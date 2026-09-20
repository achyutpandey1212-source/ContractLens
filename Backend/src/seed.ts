import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Contract } from './models/Contract.js';

const seedContracts = [
  {
    name: 'Vendor Services Agreement',
    contractType: 'Services Agreement',
    client: 'Meridian Retail Technologies Pvt. Ltd.',
    vendor: 'CloudAxis Solutions Pvt. Ltd.',
    effectiveDate: new Date('2026-09-01'),
    expirationDate: new Date('2027-08-31'),
    value: '$120,000/year',
    riskScore: 82,
    riskLevel: 'HIGH',
    status: 'analyzed',
    originalFileName: 'Vendor_Services_Agreement_2026.pdf',
    summary: {
      contract_name: 'Vendor Services Agreement',
      parties: ['Meridian Retail Technologies Pvt. Ltd.', 'CloudAxis Solutions Pvt. Ltd.'],
      contract_type: 'Services Agreement',
      execution_date: '2026-09-01',
      expiry_date: '2027-08-31',
      value: '$120,000/year',
      key_terms: ['Managed Infrastructure', 'SLA Credits', 'Confidentiality', 'IP Rights'],
      major_obligations: [
        'Maintain 99.9% platform availability',
        'Invoice payment within 15 days',
        'Notification of security breaches within 24 hours'
      ],
      notable_provisions: ['Uncapped indemnification for client breach', 'Short cure period for vendor'],
      overall_assessment: 'High exposure primarily stemming from lopsided liability and indemnification clauses.'
    },
    clauses: [
      {
        clause_type: 'Limitation of Liability',
        clause_text: 'Liability is capped at fees paid during the previous 3 months.',
        risk_level: 'CRITICAL',
        analysis: 'Cap is far too low given the commercial value and potential operational downtime losses.',
        ai_confidence: 0.95
      },
      {
        clause_type: 'Service Level Agreement',
        clause_text: 'Uptime target has no meaningful remedy beyond standard email support.',
        risk_level: 'HIGH',
        analysis: 'Vendor offers no financial credits or termination remedies if uptime falls below standard.',
        ai_confidence: 0.91
      },
      {
        clause_type: 'Data Protection',
        clause_text: 'Security obligations are vague and do not specify clear breach-notification timelines.',
        risk_level: 'HIGH',
        analysis: 'Does not meet industry standards for data breach reporting or compliance with data protection laws.',
        ai_confidence: 0.89
      }
    ],
    risks: [
      {
        clause_type: 'Limitation of Liability',
        risk_level: 'CRITICAL',
        risk_score: 90,
        risk_description: 'Liability is capped at fees paid during the previous 3 months.',
        recommendation: 'Negotiate a higher liability cap (e.g., 12 months fees) and explicit carve-outs for data breaches and confidentiality.',
        ai_confidence: 0.95
      },
      {
        clause_type: 'Service Level',
        risk_level: 'HIGH',
        risk_score: 80,
        risk_description: 'Uptime target has no meaningful remedy.',
        recommendation: 'Negotiate a binding SLA with defined uptime percentages, response times, and service credits.',
        ai_confidence: 0.91
      },
      {
        clause_type: 'Data Protection',
        risk_level: 'HIGH',
        risk_score: 75,
        risk_description: 'Security obligations are vague and do not specify clear breach-notification timelines.',
        recommendation: 'Add specific security standards (SOC 2, ISO 27001) and a defined 48-hour breach notification period.',
        ai_confidence: 0.89
      },
      {
        clause_type: 'Renewal & Termination',
        risk_level: 'HIGH',
        risk_score: 72,
        risk_description: "Automatic renewal requires 90 days' advance notice and creates potential lock-in.",
        recommendation: 'Reduce the renewal notice period to 30 days or require explicit mutual renewal consent.',
        ai_confidence: 0.88
      }
    ],
    obligations: [
      {
        obligation_type: 'service',
        status: 'pending',
        responsible_party: 'Vendor',
        obligation_text: 'Provide SaaS managed cloud infrastructure and support services.',
        due_date: '2026-10-01'
      },
      {
        obligation_type: 'payment',
        status: 'pending',
        responsible_party: 'Client',
        obligation_text: 'Pay quarterly invoices within 15 days of invoice date.',
        due_date: '2026-10-15'
      },
      {
        obligation_type: 'compliance',
        status: 'pending',
        responsible_party: 'Vendor',
        obligation_text: 'Notify material security incidents within 24 hours.',
        due_date: null
      },
      {
        obligation_type: 'renewal',
        status: 'pending',
        responsible_party: 'Client',
        obligation_text: 'Provide 90-day written notice prior to contract expiration to prevent automatic renewal.',
        due_date: '2027-06-01'
      }
    ],
    redFlags: [
      'Uncapped client indemnity obligations',
      '3-month trailing liability cap for vendor damages'
    ],
    recommendations: [
      'Require minimum 12-month trailing liability cap',
      'Insert 48-hour breach notification obligation'
    ]
  },
  {
    name: 'SaaS Subscription and Managed Services Agreement',
    contractType: 'SaaS Subscription',
    client: 'Apex Enterprise Global',
    vendor: 'HyperScale Software Ltd.',
    effectiveDate: new Date('2026-08-15'),
    expirationDate: new Date('2028-08-14'),
    value: '$250,000/year',
    riskScore: 54,
    riskLevel: 'MEDIUM',
    status: 'analyzed',
    originalFileName: 'HyperScale_SaaS_Agreement_v2.pdf',
    summary: {
      contract_name: 'SaaS Subscription and Managed Services Agreement',
      parties: ['Apex Enterprise Global', 'HyperScale Software Ltd.'],
      contract_type: 'SaaS Subscription',
      execution_date: '2026-08-15',
      expiry_date: '2028-08-14',
      value: '$250,000/year',
      key_terms: ['Multi-year Term', 'Data Processing Addendum', 'IP Licensing'],
      major_obligations: [
        'Maintain SOC 2 Type II compliance',
        'Net 30 payment schedule'
      ],
      notable_provisions: ['Unilateral amendment rights reserved by vendor with 30 days notice'],
      overall_assessment: 'Moderate risk profile with reasonable warranties but vendor-favorable amendment clauses.'
    },
    clauses: [
      {
        clause_type: 'Amendment',
        clause_text: 'Vendor may amend terms upon 30 days posted notice.',
        risk_level: 'MEDIUM',
        analysis: 'Allows vendor to modify commercial or SLA terms unilaterally.',
        ai_confidence: 0.86
      }
    ],
    risks: [
      {
        clause_type: 'Unilateral Modification',
        risk_level: 'MEDIUM',
        risk_score: 55,
        risk_description: 'Vendor reserves right to update SLA terms unilaterally on web portal.',
        recommendation: 'Require mutual written consent for any material amendments to terms or service levels.',
        ai_confidence: 0.87
      }
    ],
    obligations: [
      {
        obligation_type: 'security',
        status: 'pending',
        responsible_party: 'Vendor',
        obligation_text: 'Maintain annual SOC 2 Type II certification and provide audit reports upon request.',
        due_date: '2027-01-01'
      },
      {
        obligation_type: 'payment',
        status: 'pending',
        responsible_party: 'Client',
        obligation_text: 'Pay annual licensing fees Net 30 days from invoice issuance.',
        due_date: '2026-09-15'
      }
    ],
    redFlags: ['Unilateral terms modification clause'],
    recommendations: ['Add mutual written consent requirement for any fee or SLA revisions']
  },
  {
    name: 'Mutual Non-Disclosure Agreement',
    contractType: 'NDA',
    client: 'Vertex Innovations Corp.',
    vendor: 'BlueHorizon Analytics',
    effectiveDate: new Date('2026-09-10'),
    expirationDate: new Date('2028-09-09'),
    value: 'N/A',
    riskScore: 24,
    riskLevel: 'LOW',
    status: 'analyzed',
    originalFileName: 'Mutual_NDA_Vertex_BlueHorizon.pdf',
    summary: {
      contract_name: 'Mutual Non-Disclosure Agreement',
      parties: ['Vertex Innovations Corp.', 'BlueHorizon Analytics'],
      contract_type: 'NDA',
      execution_date: '2026-09-10',
      expiry_date: '2028-09-09',
      value: 'N/A',
      key_terms: ['Mutual Confidentiality', '2-Year Non-Use Term', 'Return or Destruction of Data'],
      major_obligations: ['Maintain strict confidentiality', 'Secure destruction of sensitive files upon request'],
      notable_provisions: ['Standard mutual terms with typical carve-outs for publicly known info'],
      overall_assessment: 'Low risk standard mutual NDA.'
    },
    clauses: [
      {
        clause_type: 'Confidentiality',
        clause_text: 'Both parties agree to hold confidential information in strict confidence for 2 years.',
        risk_level: 'LOW',
        analysis: 'Balanced mutual confidentiality obligation with industry-standard exceptions.',
        ai_confidence: 0.94
      }
    ],
    risks: [
      {
        clause_type: 'Term',
        risk_level: 'LOW',
        risk_score: 24,
        risk_description: '2-year survival period for trade secrets might expire earlier than desired.',
        recommendation: 'Add perpetual confidentiality for trade secrets.',
        ai_confidence: 0.9
      }
    ],
    obligations: [
      {
        obligation_type: 'confidentiality',
        status: 'pending',
        responsible_party: 'Both Parties',
        obligation_text: 'Protect confidential information using the same degree of care as own confidential information.',
        due_date: null
      },
      {
        obligation_type: 'destruction',
        status: 'pending',
        responsible_party: 'Both Parties',
        obligation_text: 'Return or destroy confidential material within 14 days of written request.',
        due_date: null
      }
    ],
    redFlags: [],
    recommendations: ['Consider extending survival period for trade secrets indefinitely']
  }
];

const seed = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contractlens';

  try {
    console.log(`[Seed] Connecting to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI);

    console.log('[Seed] Clearing existing contracts...');
    await Contract.deleteMany({});

    console.log('[Seed] Inserting mock contracts...');
    const inserted = await Contract.insertMany(seedContracts);

    console.log(`[Seed] Successfully inserted ${inserted.length} contracts:`);
    inserted.forEach((c) => {
      console.log(`  - [${c.id}] ${c.name} (Risk: ${c.riskLevel} - ${c.riskScore})`);
    });

    await mongoose.disconnect();
    console.log('[Seed] Done. Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error running seed:', error);
    process.exit(1);
  }
};

seed();
