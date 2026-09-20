import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import FormData from 'form-data';
import { Contract } from '../models/Contract.js';

export const getContracts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contracts = await Contract.find()
      .select('name riskScore riskLevel createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = contracts.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      riskScore: c.riskScore,
      riskLevel: c.riskLevel,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

export const getContractById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findById(id);

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
};

export const getContractObligations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findById(id).select('obligations');

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    res.json({
      contractId: contract._id.toString(),
      obligations: contract.obligations || []
    });
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Contract name is required' });
      return;
    }

    const newContract = new Contract(req.body);
    const saved = await newContract.save();

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid contract ID format' });
      return;
    }

    const updated = await Contract.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const analyzeContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'PDF file is required' });
      return;
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/contract-upload';

    // Prepare multipart/form-data for n8n with binary field 'data'
    const form = new FormData();
    form.append('data', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || 'application/pdf'
    });

    const response = await axios.post(webhookUrl, form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 300000 // 5 minutes timeout for AI processing
    });

    const analysis = response.data;
    if (!analysis) {
      res.status(502).json({ success: false, error: 'Empty response from contract analysis service' });
      return;
    }

    // Extract fields from n8n response
    const summary = analysis.summary || {};
    const overallRiskScore = typeof analysis.overall_risk_score === 'number' ? analysis.overall_risk_score : 0;
    
    // Risk score percentage (0.71 -> 71)
    const riskScore = Math.round(overallRiskScore * 100);

    // Risk level mapping: >= 0.85 -> CRITICAL, >= 0.70 -> HIGH, >= 0.40 -> MEDIUM, else -> LOW
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (overallRiskScore >= 0.85) {
      riskLevel = 'CRITICAL';
    } else if (overallRiskScore >= 0.70) {
      riskLevel = 'HIGH';
    } else if (overallRiskScore >= 0.40) {
      riskLevel = 'MEDIUM';
    }

    // Contract name
    const contractName = summary.contract_name || req.file.originalname.replace(/\.pdf$/i, '');

    // Parties extraction (can be array or object)
    let client = '';
    let vendor = '';
    if (Array.isArray(summary.parties)) {
      client = summary.parties[0] || '';
      vendor = summary.parties[1] || '';
    } else if (summary.parties && typeof summary.parties === 'object') {
      client = summary.parties.client || '';
      vendor = summary.parties.vendor || '';
    }

    // Dates
    let effectiveDate: Date | undefined;
    if (summary.execution_date) {
      const parsed = new Date(summary.execution_date);
      if (!isNaN(parsed.getTime())) effectiveDate = parsed;
    }

    let expirationDate: Date | undefined;
    if (summary.expiry_date) {
      const parsed = new Date(summary.expiry_date);
      if (!isNaN(parsed.getTime())) expirationDate = parsed;
    }

    // Map obligations
    const obligations = Array.isArray(analysis.obligations)
      ? analysis.obligations.map((o: any) => ({
          obligation_type: o.obligation_type || 'compliance',
          status: o.status || 'pending',
          responsible_party: o.responsible_party || client || 'Ambassador',
          obligation_text: o.obligation_text || o.description || '',
          due_date: o.due_date || null
        }))
      : [];

    // Map risks
    const risks = Array.isArray(analysis.risks)
      ? analysis.risks.map((r: any) => ({
          clause_type: r.clause_type || 'General',
          risk_level: r.risk_level || 'medium',
          risk_score: r.risk_score || 0.5,
          risk_description: r.risk_description || '',
          recommendation: r.recommendation || '',
          ai_confidence: r.ai_confidence || 1
        }))
      : [];

    // Map clauses
    const clauses = Array.isArray(analysis.clauses)
      ? analysis.clauses.map((c: any) => ({
          clause_type: c.clause_type || '',
          clause_text: c.clause_text || '',
          risk_level: c.risk_level || '',
          analysis: c.analysis || '',
          ai_confidence: c.ai_confidence || 1
        }))
      : [];

    const contractDoc = new Contract({
      name: contractName,
      contractType: summary.contract_type || 'Agreement',
      client,
      vendor,
      effectiveDate,
      expirationDate,
      value: summary.value,
      riskScore,
      riskLevel,
      summary,
      clauses,
      risks,
      obligations,
      redFlags: analysis.red_flags || [],
      recommendations: analysis.recommendations || [],
      originalFileName: req.file.originalname,
      status: 'analyzed'
    });

    const savedContract = await contractDoc.save();

    res.status(201).json({
      success: true,
      contract: savedContract
    });
  } catch (error: any) {
    console.error('[Analyze Contract Error]', error?.message || error);
    res.status(500).json({
      success: false,
      error: 'Contract analysis failed. Please try again.'
    });
  }
};
