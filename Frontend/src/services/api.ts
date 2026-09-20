const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ContractListItem {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt: string;
}

export interface RiskItem {
  clause_type?: string;
  risk_level?: string;
  risk_score?: number;
  risk_description?: string;
  recommendation?: string;
  ai_confidence?: number;
}

export interface ObligationItem {
  obligation_type?: string;
  status?: string;
  responsible_party?: string;
  obligation_text?: string;
  due_date?: string | null;
}

export interface ContractDetail {
  id: string;
  name: string;
  contractType?: string;
  client?: string;
  vendor?: string;
  effectiveDate?: string;
  expirationDate?: string;
  value?: string | number;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary?: any;
  clauses?: any[];
  risks?: RiskItem[];
  obligations?: ObligationItem[];
  redFlags?: any[];
  recommendations?: any[];
  originalFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  async getContracts(): Promise<ContractListItem[]> {
    const res = await fetch(`${API_BASE}/api/contracts`);
    if (!res.ok) throw new Error('Failed to load contracts.');
    return res.json();
  },

  async getContractById(id: string): Promise<ContractDetail> {
    const res = await fetch(`${API_BASE}/api/contracts/${id}`);
    if (!res.ok) throw new Error('Failed to load contract.');
    return res.json();
  },

  async getContractObligations(id: string): Promise<{ contractId: string; obligations: ObligationItem[] }> {
    const res = await fetch(`${API_BASE}/api/contracts/${id}/obligations`);
    if (!res.ok) throw new Error('Failed to load obligations.');
    return res.json();
  },

  async analyzeContract(file: File): Promise<{ success: boolean; contract: ContractDetail }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/contracts/analyze`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Contract analysis failed. Please try again.');
    }
    return data;
  }
};
