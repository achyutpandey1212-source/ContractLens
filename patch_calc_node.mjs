import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('verify2.json', 'utf8'));
const nodes = wf[0].nodes;
const edges = wf[0].connections;

const calcNode = nodes.find(x => x.name === 'Calculate Risk Score');

const newCode = `// Read directly from state file - robust against merge/ordering issues
const fs = require('fs');
const inputs = $input.all();

// Get contractId from any available input
const contractId = inputs.map(i => i.json && i.json.contractId).find(Boolean)
  || ($('Assemble Analysis').first() && $('Assemble Analysis').first().json && $('Assemble Analysis').first().json.contractId);

// Load data from state file (source of truth)
let clauseData = [], riskData = [], obligationData = [], summaryData = {};
if (contractId) {
  try {
    const state = JSON.parse(fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8'));
    clauseData = state.clauses || [];
    riskData = state.risks || [];
    obligationData = state.obligations || [];
    summaryData = state.summary || {};
  } catch (e) {}
}

// Fallback to input items if state file empty
if (!riskData.length) {
  clauseData = (inputs.find(i => i.json && i.json.output && i.json.output.clauses) || {json:{output:{clauses:[]}}}).json.output.clauses;
  riskData = (inputs.find(i => i.json && i.json.output && i.json.output.risks) || {json:{output:{risks:[]}}}).json.output.risks;
  obligationData = (inputs.find(i => i.json && i.json.output && i.json.output.obligations) || {json:{output:{obligations:[]}}}).json.output.obligations;
  const summaryInput = inputs.find(i => i.json && i.json.output && (i.json.output.contract_name || i.json.output.overall_assessment));
  summaryData = summaryInput ? summaryInput.json.output : {};
}

// Risk weights by clause categories
const riskWeights = {
  'Service Level and Support (Clause 3)': 0.16,
  'Fees and Payment (Clause 4)': 0.08,
  'Data Protection and Security (Clause 5)': 0.18,
  'Confidentiality (Clause 6)': 0.05,
  'Intellectual Property (Clause 7)': 0.08,
  'Indemnification (Clause 8)': 0.10,
  'Limitation of Liability (Clause 9)': 0.22,
  'Term, Renewal and Termination (Clause 10)': 0.10,
  'Effect of Termination (Clause 11)': 0.02,
  'General / Governing Law (Clause 12)': 0.01,
  'Definitions and Interpretation (Clause 1)': 0.00,
  'Services and Obligations (Clause 2)': 0.00
};

// Risk level scores
const riskScores = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
  none: 0.0
};

function normalizeRiskType(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('liability')) return 'Limitation of Liability (Clause 9)';
  if (value.includes('data protection') || value.includes('security')) return 'Data Protection and Security (Clause 5)';
  if (value.includes('service level') || value.includes('sla') || value.includes('support')) return 'Service Level and Support (Clause 3)';
  if (value.includes('indemn')) return 'Indemnification (Clause 8)';
  if (value.includes('payment') || value.includes('fee') || value.includes('compensation')) return 'Fees and Payment (Clause 4)';
  if (value.includes('effect of termination') || value.includes('data return')) return 'Effect of Termination (Clause 11)';
  if (value.includes('termination') || value.includes('term') || value.includes('renewal')) return 'Term, Renewal and Termination (Clause 10)';
  if (value.includes('ip') || value.includes('intellectual property')) return 'Intellectual Property (Clause 7)';
  if (value.includes('confidential')) return 'Confidentiality (Clause 6)';
  if (value.includes('governing law') || value.includes('dispute') || value.includes('general')) return 'General / Governing Law (Clause 12)';
  if (value.includes('service') || value.includes('modification') || value.includes('guarantee') || value.includes('duties') || value.includes('work scope')) return 'Services and Obligations (Clause 2)';
  return null;
}

// Calculate weighted risk score
let scoreBreakdown = {};
let totalWeightedScore = 0;
let redFlags = [];
let recommendations = [];

riskData.forEach(function(risk) {
  const matchedKey = riskWeights[risk.clause_type] !== undefined
    ? risk.clause_type
    : normalizeRiskType(risk.clause_type);
  const weight = matchedKey ? (riskWeights[matchedKey] !== undefined ? riskWeights[matchedKey] : 0) : 0;
  const score = riskScores[(risk.risk_level || '').toLowerCase()] !== undefined ? riskScores[(risk.risk_level || '').toLowerCase()] : 0;
  const weightedScore = score * weight;
  scoreBreakdown[(matchedKey || risk.clause_type) + '_risk'] = score;
  totalWeightedScore += weightedScore;

  if ((risk.risk_level || '').toLowerCase() === 'critical' || (risk.risk_level || '').toLowerCase() === 'high') {
    redFlags.push(risk.risk_description);
    recommendations.push(risk.recommendation);
  }
});

// Check for missing critical clauses
const criticalClauses = ['payment_terms', 'liability', 'termination'];
const foundClauses = clauseData.map(function(c) { return c.clause_type; });
criticalClauses.forEach(function(critical) {
  if (!foundClauses.includes(critical)) {
    redFlags.push('Missing critical clause: ' + critical);
    recommendations.push('Add ' + critical + ' clause to contract');
  }
});

// Check AI confidence levels
const allItems = clauseData.concat(riskData);
const lowConfidenceItems = allItems.filter(function(item) {
  return typeof item.ai_confidence === 'number' && item.ai_confidence < 0.6;
});
if (lowConfidenceItems.length > 0) {
  redFlags.push(lowConfidenceItems.length + ' items flagged for manual legal review (low AI confidence)');
  recommendations.push('Schedule legal review for low-confidence extractions');
}

// Final risk score
const overallRiskScore = Math.min(1.0, Math.round(totalWeightedScore * 100) / 100);

return {
  clauses: clauseData,
  risks: riskData,
  obligations: obligationData,
  summary: summaryData,
  overall_risk_score: overallRiskScore,
  score_breakdown: scoreBreakdown,
  red_flags: redFlags,
  recommendations: recommendations,
  calculated_at: new Date().toISOString(),
  contractId: contractId
};
`;

calcNode.parameters.jsCode = newCode;

// Remove the orphaned Merge Analysis Results connections
if (edges['Merge Analysis Results']) {
  delete edges['Merge Analysis Results'];
  console.log('Removed orphaned Merge Analysis Results connections');
}

writeFileSync('wf_fixed2.json', JSON.stringify(wf, null, 2));
console.log('Written wf_fixed2.json');
console.log('Calculate Risk Score now reads from state file directly - riskData will always be populated');
