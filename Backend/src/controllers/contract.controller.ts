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

// Helper to map n8n analysis output to Contract document fields
const mapAnalysisToContractFields = (analysis: any, originalFileName?: string) => {
  const summary = analysis.summary || {};
  const overallRiskScore = typeof analysis.overall_risk_score === 'number' ? analysis.overall_risk_score : 0;
  const riskScore = Math.round(overallRiskScore * 100);

  let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (overallRiskScore >= 0.85) {
    riskLevel = 'CRITICAL';
  } else if (overallRiskScore >= 0.70) {
    riskLevel = 'HIGH';
  } else if (overallRiskScore >= 0.40) {
    riskLevel = 'MEDIUM';
  }

  const contractName = summary.contract_name || (originalFileName ? originalFileName.replace(/\.pdf$/i, '') : 'Contract');

  let client = '';
  let vendor = '';
  if (Array.isArray(summary.parties)) {
    client = summary.parties[0] || '';
    vendor = summary.parties[1] || '';
  } else if (summary.parties && typeof summary.parties === 'object') {
    client = summary.parties.client || '';
    vendor = summary.parties.vendor || '';
  }

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

  const obligations = Array.isArray(analysis.obligations)
    ? analysis.obligations.map((o: any) => ({
        obligation_type: o.obligation_type || 'compliance',
        status: o.status || 'pending',
        responsible_party: o.responsible_party || client || 'Ambassador',
        obligation_text: o.obligation_text || o.description || '',
        due_date: o.due_date || null
      }))
    : [];

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

  const clauses = Array.isArray(analysis.clauses)
    ? analysis.clauses.map((c: any) => ({
        clause_type: c.clause_type || '',
        clause_text: c.clause_text || '',
        risk_level: c.risk_level || '',
        analysis: c.analysis || '',
        ai_confidence: c.ai_confidence || 1
      }))
    : [];

  return {
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
    status: 'analyzed',
    failedAgent: undefined,
    resumeFrom: undefined
  };
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

    let response;
    try {
      response = await axios.post(webhookUrl, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 300000 // 5 minutes timeout for AI processing
      });
    } catch (axiosErr: any) {
      // Check if n8n returned a structured recoverable error (e.g., HTTP 422 with failed: true)
      const errData = axiosErr.response?.data;
      if (errData && (errData.failed || errData.stage)) {
        const n8nContractId = errData.contractId;
        const failedAgent = errData.failedAgent || 'AI Agent';
        const resumeFrom = errData.stage || errData.resumeFrom || 'summary';
        const errorMessage = errData.error || 'The AI service temporarily ran into a problem.';

        // Create pending Contract record so user can retry
        const pendingDoc = new Contract({
          name: req.file.originalname.replace(/\.pdf$/i, ''),
          originalFileName: req.file.originalname,
          status: 'failed',
          n8nContractId,
          failedAgent,
          resumeFrom
        });
        const savedPending = await pendingDoc.save();

        res.status(422).json({
          success: false,
          analysisStatus: 'failed',
          failedAgent,
          resumeFrom,
          contractId: savedPending._id.toString(),
          n8nContractId,
          error: errorMessage
        });
        return;
      }
      throw axiosErr;
    }

    const analysis = response.data;
    if (!analysis) {
      res.status(502).json({ success: false, error: 'Empty response from contract analysis service' });
      return;
    }

    // Check if body itself is a failure object
    if (analysis.failed || analysis.stage) {
      const n8nContractId = analysis.contractId;
      const failedAgent = analysis.failedAgent || 'AI Agent';
      const resumeFrom = analysis.stage || analysis.resumeFrom || 'summary';
      const errorMessage = analysis.error || 'The AI service temporarily ran into a problem.';

      const pendingDoc = new Contract({
        name: req.file.originalname.replace(/\.pdf$/i, ''),
        originalFileName: req.file.originalname,
        status: 'failed',
        n8nContractId,
        failedAgent,
        resumeFrom
      });
      const savedPending = await pendingDoc.save();

      res.status(422).json({
        success: false,
        analysisStatus: 'failed',
        failedAgent,
        resumeFrom,
        contractId: savedPending._id.toString(),
        n8nContractId,
        error: errorMessage
      });
      return;
    }

    const fields = mapAnalysisToContractFields(analysis, req.file.originalname);
    const contractDoc = new Contract({
      ...fields,
      originalFileName: req.file.originalname,
      n8nContractId: analysis.contractId
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
      error: error?.response?.data?.message || 'Contract analysis failed. Please try again.'
    });
  }
};

export const retryContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { agent, resumeFrom: bodyResumeFrom } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid contract ID format' });
      return;
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }

    const resumeFrom = bodyResumeFrom || agent || contract.resumeFrom || 'summary';
    const n8nContractId = contract.n8nContractId;

    if (!n8nContractId) {
      res.status(400).json({
        success: false,
        error: 'No resumable state found for this contract. Please upload again.'
      });
      return;
    }

    const resumeUrl = process.env.N8N_RESUME_WEBHOOK_URL ||
      (process.env.N8N_WEBHOOK_URL
        ? process.env.N8N_WEBHOOK_URL.replace(/\/contract-upload$/, '/contract-resume')
        : 'http://localhost:5678/webhook/contract-resume');

    console.log(`[Retry Contract] Resuming contract ${id} (n8n: ${n8nContractId}) from ${resumeFrom} at ${resumeUrl}`);

    let response;
    try {
      response = await axios.post(
        resumeUrl,
        {
          contractId: n8nContractId,
          resumeFrom
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 300000
        }
      );
    } catch (axiosErr: any) {
      const errData = axiosErr.response?.data;
      if (errData && (errData.failed || errData.stage)) {
        const failedAgent = errData.failedAgent || 'AI Agent';
        const newResumeFrom = errData.stage || errData.resumeFrom || resumeFrom;
        const errorMessage = errData.error || 'The AI service temporarily ran into a problem.';

        contract.failedAgent = failedAgent;
        contract.resumeFrom = newResumeFrom;
        contract.status = 'failed';
        await contract.save();

        res.status(422).json({
          success: false,
          analysisStatus: 'failed',
          failedAgent,
          resumeFrom: newResumeFrom,
          contractId: contract._id.toString(),
          n8nContractId,
          error: errorMessage
        });
        return;
      }
      throw axiosErr;
    }

    const analysis = response.data;
    if (!analysis) {
      res.status(502).json({ success: false, error: 'Empty response from contract resume service' });
      return;
    }

    if (analysis.failed || analysis.stage) {
      const failedAgent = analysis.failedAgent || 'AI Agent';
      const newResumeFrom = analysis.stage || analysis.resumeFrom || resumeFrom;
      const errorMessage = analysis.error || 'The AI service temporarily ran into a problem.';

      contract.failedAgent = failedAgent;
      contract.resumeFrom = newResumeFrom;
      contract.status = 'failed';
      await contract.save();

      res.status(422).json({
        success: false,
        analysisStatus: 'failed',
        failedAgent,
        resumeFrom: newResumeFrom,
        contractId: contract._id.toString(),
        n8nContractId,
        error: errorMessage
      });
      return;
    }

    // Map successful analysis and update existing contract
    const fields = mapAnalysisToContractFields(analysis, contract.originalFileName);
    Object.assign(contract, fields);
    const updatedContract = await contract.save();

    res.json({
      success: true,
      contract: updatedContract
    });
  } catch (error: any) {
    console.error('[Retry Contract Error]', error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.response?.data?.message || 'Contract retry failed. Please try again.'
    });
  }
};
