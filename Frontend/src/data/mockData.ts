export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Contract {
  id: string;
  name: string;
  client: string;
  vendor: string;
  riskScore: number;
  riskLevel: RiskLevel;
  date: string;
}

export interface RiskFinding {
  id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
}

export interface Obligation {
  id: string;
  party: 'Vendor' | 'Client';
  obligation: string;
  status: 'Pending' | 'Completed' | 'In Progress';
}

export const mockContracts: Contract[] = [
  {
    id: '1',
    name: 'Vendor Services Agreement',
    client: 'Meridian Retail Technologies Pvt. Ltd.',
    vendor: 'CloudAxis Solutions Pvt. Ltd.',
    riskScore: 82,
    riskLevel: 'HIGH',
    date: 'Sep 19, 2026',
  },
  {
    id: '2',
    name: 'SaaS Subscription Agreement',
    client: 'Apex Enterprise Global',
    vendor: 'HyperScale Software Ltd.',
    riskScore: 54,
    riskLevel: 'MEDIUM',
    date: 'Sep 18, 2026',
  },
  {
    id: '3',
    name: 'NDA',
    client: 'Vertex Innovations Corp.',
    vendor: 'BlueHorizon Analytics',
    riskScore: 24,
    riskLevel: 'LOW',
    date: 'Sep 17, 2026',
  },
];

export const defaultContractDetails = {
  id: '1',
  title: 'SaaS Subscription and Managed Services Agreement',
  riskScore: '71%',
  riskLevel: 'HIGH' as RiskLevel,
  client: 'Meridian Retail Technologies Pvt. Ltd.',
  vendor: 'CloudAxis Solutions Pvt. Ltd.',
  overviewSummary:
    'Standard multi-year enterprise subscription agreement covering managed cloud infrastructure, data processing, and associated technical support commitments.',
};

export const mockRiskFindings: RiskFinding[] = [
  {
    id: 'finding-1',
    severity: 'HIGH',
    title: 'Service Level',
    description: 'Uptime target has no meaningful remedy.',
    recommendation:
      'Negotiate a binding SLA with defined uptime percentages, response times, and service credits.',
  },
  {
    id: 'finding-2',
    severity: 'CRITICAL',
    title: 'Limitation of Liability',
    description: 'Liability is capped at fees paid during the previous 3 months.',
    recommendation:
      'Negotiate a higher liability cap and explicit carve-outs for data breach, confidentiality, and IP infringement.',
  },
  {
    id: 'finding-3',
    severity: 'HIGH',
    title: 'Data Protection',
    description:
      'Security obligations are vague and do not specify clear breach-notification timelines.',
    recommendation:
      'Add specific security standards and a defined breach-notification period.',
  },
  {
    id: 'finding-4',
    severity: 'HIGH',
    title: 'Renewal & Termination',
    description:
      "Automatic renewal requires 90 days' advance notice and creates potential lock-in.",
    recommendation:
      'Reduce the renewal notice period or require explicit renewal consent.',
  },
];

export const mockObligations: Obligation[] = [
  {
    id: 'ob-1',
    party: 'Vendor',
    obligation: 'Provide SaaS services',
    status: 'Pending',
  },
  {
    id: 'ob-2',
    party: 'Client',
    obligation: 'Pay quarterly invoice within 15 days',
    status: 'Pending',
  },
  {
    id: 'ob-3',
    party: 'Vendor',
    obligation: 'Notify material security incidents',
    status: 'Pending',
  },
  {
    id: 'ob-4',
    party: 'Client',
    obligation: 'Give 90-day renewal notice',
    status: 'Pending',
  },
  {
    id: 'ob-5',
    party: 'Vendor',
    obligation: 'Maintain reasonable security safeguards',
    status: 'Pending',
  },
  {
    id: 'ob-6',
    party: 'Client',
    obligation: 'Provide required information and cooperation',
    status: 'Pending',
  },
];
