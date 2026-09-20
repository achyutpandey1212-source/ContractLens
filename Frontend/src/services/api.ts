const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token?: string;
}

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

export interface RetryFailureResponse {
  success: false;
  analysisStatus: 'failed';
  failedAgent: string;
  resumeFrom: string;
  contractId: string;
  n8nContractId?: string;
  error: string;
}

export class AnalysisError extends Error {
  failureData?: RetryFailureResponse;
  constructor(message: string, failureData?: RetryFailureResponse) {
    super(message);
    this.name = 'AnalysisError';
    this.failureData = failureData;
  }
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

    const data = await res.json().catch(() => ({}));
    if (res.status === 422 && data && data.analysisStatus === 'failed') {
      throw new AnalysisError(data.error || 'The AI service temporarily ran into a problem.', data);
    }

    if (!res.ok || !data.success) {
      throw new AnalysisError(data.error || 'Contract analysis failed. Please try again.');
    }
    return data;
  },

  async retryContract(contractId: string, agent?: string): Promise<{ success: boolean; contract: ContractDetail }> {
    const res = await fetch(`${API_BASE}/api/contracts/${contractId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent })
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 422 && data && data.analysisStatus === 'failed') {
      throw new AnalysisError(data.error || 'The AI service temporarily ran into a problem.', data);
    }

    if (!res.ok || !data.success) {
      throw new AnalysisError(data.error || 'Contract retry failed. Please try again.');
    }
    return data;
  },

  async register(email: string, password: string, confirmPassword?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, confirmPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Ignore network errors on logout
    }
  },

  async getMe(token?: string | null): Promise<{ user: AuthUser }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Session expired');
    }
    return data;
  }
};
