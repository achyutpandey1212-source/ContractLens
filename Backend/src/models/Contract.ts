import { Schema, model, Document } from 'mongoose';

export interface IClause {
  clause_type?: string;
  clause_text?: string;
  risk_level?: string;
  analysis?: string;
  ai_confidence?: number;
  [key: string]: any;
}

export interface IRisk {
  clause_type?: string;
  risk_level?: string;
  risk_score?: number;
  risk_description?: string;
  recommendation?: string;
  ai_confidence?: number;
  [key: string]: any;
}

export interface IObligation {
  obligation_type?: string;
  status?: string;
  responsible_party?: string;
  obligation_text?: string;
  due_date?: string | Date | null;
  [key: string]: any;
}

export interface ISummary {
  contract_name?: string;
  parties?: string[] | { client?: string; vendor?: string };
  contract_type?: string;
  execution_date?: string | Date;
  expiry_date?: string | Date;
  value?: string | number;
  key_terms?: string[];
  major_obligations?: string[];
  notable_provisions?: string[];
  overall_assessment?: string;
  [key: string]: any;
}

export interface IContract extends Document {
  name: string;
  contractType?: string;
  client?: string;
  vendor?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  renewalDate?: Date;
  value?: string | number;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  summary?: ISummary | Record<string, any>;
  clauses?: IClause[];
  risks?: IRisk[];
  obligations?: IObligation[];
  redFlags?: any[];
  recommendations?: any[];
  status?: string;
  originalFileName?: string;
  n8nContractId?: string;
  failedAgent?: string;
  resumeFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClauseSchema = new Schema<IClause>(
  {
    clause_type: { type: String },
    clause_text: { type: String },
    risk_level: { type: String },
    analysis: { type: String },
    ai_confidence: { type: Number }
  },
  { _id: false, strict: false }
);

const RiskSchema = new Schema<IRisk>(
  {
    clause_type: { type: String },
    risk_level: { type: String },
    risk_score: { type: Number },
    risk_description: { type: String },
    recommendation: { type: String },
    ai_confidence: { type: Number }
  },
  { _id: false, strict: false }
);

const ObligationSchema = new Schema<IObligation>(
  {
    obligation_type: { type: String },
    status: { type: String, default: 'pending' },
    responsible_party: { type: String },
    obligation_text: { type: String },
    due_date: { type: Schema.Types.Mixed, default: null }
  },
  { _id: false, strict: false }
);

const ContractSchema = new Schema<IContract>(
  {
    name: { type: String, required: true, trim: true },
    contractType: { type: String, trim: true },
    client: { type: String, trim: true },
    vendor: { type: String, trim: true },
    effectiveDate: { type: Date },
    expirationDate: { type: Date },
    renewalDate: { type: Date },
    value: { type: Schema.Types.Mixed },
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'LOW'
    },
    summary: { type: Schema.Types.Mixed, default: {} },
    clauses: { type: [ClauseSchema], default: [] },
    risks: { type: [RiskSchema], default: [] },
    obligations: { type: [ObligationSchema], default: [] },
    redFlags: { type: [Schema.Types.Mixed], default: [] },
    recommendations: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, default: 'analyzed' },
    originalFileName: { type: String },
    n8nContractId: { type: String },
    failedAgent: { type: String },
    resumeFrom: { type: String }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Contract = model<IContract>('Contract', ContractSchema);
