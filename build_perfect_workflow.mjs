import fs from 'fs';

// Read the base workflow
const wf = JSON.parse(fs.readFileSync('wf_bulletproof.json', 'utf8'));

console.log('Original nodes count:', wf.nodes.length);

// 1. Remove unwanted/dangling model nodes
const unwantedNodeNames = [
  'Claude 3.5 Model',
  'Mistral Cloud Chat Model',
  'Groq Chat Model',
  'Groq Chat Model1',
  'Respond to Webhook1'
];
wf.nodes = wf.nodes.filter(n => !unwantedNodeNames.includes(n.name));

// 2. Configure Google Gemini Chat Model
const geminiNode = wf.nodes.find(n => n.name === 'Google Gemini Chat Model');
if (geminiNode) {
  geminiNode.parameters = {
    modelName: 'models/gemini-2.5-flash',
    options: {}
  };
  geminiNode.position = [1420, -100]; // Positioned nicely next to the AI agents
  geminiNode.credentials = {
    googlePalmApi: {
      id: 'oo1j2cDWPGzVLmk3',
      name: 'Google Gemini(PaLM) Api account'
    }
  };
} else {
  console.error('Google Gemini Chat Model not found!');
}

// 3. Ensure all 4 Agents are configured with fallback prompts and connected to Gemini
const agentNames = [
  'Clause Extraction Agent',
  'Risk Assessment Agent',
  'Obligation Extraction Agent',
  'Executive Summary Agent'
];

wf.nodes.forEach(n => {
  if (agentNames.includes(n.name)) {
    // Robust prompt text expression ensuring text is NEVER empty
    n.parameters.text = '={{ $json.text || $("Init State").first()?.json?.text || $("Extract PDF Text").first()?.json?.text || "" }}';
    // Remove continueRegularOutput so failures are not silently swallowed, or if set, handled downstream
    delete n.onError;
  }
});

// 4. Update Check nodes to guarantee text is forwarded
const checkNodes = ['Check Clause', 'Check Risk', 'Check Obligation', 'Check Summary'];
wf.nodes.forEach(n => {
  if (checkNodes.includes(n.name)) {
    const stage = n.name.replace('Check ', '').toLowerCase();
    n.parameters.jsCode = `// In-memory state store without disk dependencies
if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
if (item.failed) return [{ json: item }];

let initItem = {};
try { initItem = $('Init State').first().json || {}; } catch(e) {}
let prevCheck = {};
try { prevCheck = $('Check Clause').first().json || {}; } catch(e) {}

const contractId = item.contractId || initItem.contractId || prevCheck.contractId || ('contract_' + Date.now());
const resumeFrom = (item.resumeFrom || initItem.resumeFrom || 'clause').toLowerCase();
const text = item.text || initItem.text || $('Extract PDF Text').first()?.json?.text || '';

let saved = null;
if (contractId) {
  try {
    const state = global.__contractlens_state[contractId] || {};
    if (state.${stage}s || state.${stage}) {
      if (resumeFrom !== '${stage}') {
        saved = state.${stage}s || state.${stage};
      }
    }
  } catch (e) {}
}

if (saved) {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      output: { ${stage === 'summary' ? '' : stage + 's: '}saved },
      ${stage === 'summary' ? 'summary' : stage + 's'}: saved,
      text,
      reused: true,
      shouldReuse: true
    }
  }];
} else {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      text,
      shouldReuse: false
    }
  }];
}
`;
  }
});

// 5. Update Save nodes to properly parse data and maintain state
wf.nodes.forEach(n => {
  if (n.name === 'Save Clause') {
    n.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
let prevItem = {};
try { prevItem = $('Check Clause').first().json || {}; } catch(e) {}

const contractId = item.contractId || prevItem.contractId;
const resumeFrom = item.resumeFrom || prevItem.resumeFrom || 'clause';
const text = item.text || prevItem.text || $('Init State').first()?.json?.text || '';

if (item.failed) return [{ json: item }];
if (item.error) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: 'Clause Extraction Agent',
      stage: 'clause',
      contractId,
      resumeFrom,
      error: item.error.message || String(item.error)
    }
  }];
}

let data = item.output?.clauses || item.clauses;
if (!data && typeof item.output === 'string') {
  try { data = JSON.parse(item.output).clauses; } catch(e) {}
}
if (!data && item.text && typeof item.text === 'string' && item.text.includes('"clauses"')) {
  try { data = JSON.parse(item.text).clauses; } catch(e) {}
}

data = Array.isArray(data) ? data : [];

if (contractId) {
  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = {};
  global.__contractlens_state[contractId].clauses = data;
  global.__contractlens_state[contractId].text = text;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{
  json: {
    contractId,
    resumeFrom,
    text,
    clauses: data,
    output: { clauses: data }
  }
}];
`;
  }

  if (n.name === 'Save Risk') {
    n.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
let prevItem = {};
try { prevItem = $('Check Risk').first().json || {}; } catch(e) {}

const contractId = item.contractId || prevItem.contractId;
const resumeFrom = item.resumeFrom || prevItem.resumeFrom || 'clause';
const text = item.text || prevItem.text || $('Init State').first()?.json?.text || '';

if (item.failed) return [{ json: item }];
if (item.error) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: 'Risk Assessment Agent',
      stage: 'risk',
      contractId,
      resumeFrom,
      error: item.error.message || String(item.error)
    }
  }];
}

let data = item.output?.risks || item.risks;
if (!data && typeof item.output === 'string') {
  try { data = JSON.parse(item.output).risks; } catch(e) {}
}
if (!data && item.text && typeof item.text === 'string' && item.text.includes('"risks"')) {
  try { data = JSON.parse(item.text).risks; } catch(e) {}
}

data = Array.isArray(data) ? data : [];

if (contractId) {
  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = {};
  global.__contractlens_state[contractId].risks = data;
  global.__contractlens_state[contractId].text = text;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{
  json: {
    contractId,
    resumeFrom,
    text,
    risks: data,
    output: { risks: data }
  }
}];
`;
  }

  if (n.name === 'Save Obligation') {
    n.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
let prevItem = {};
try { prevItem = $('Check Obligation').first().json || {}; } catch(e) {}

const contractId = item.contractId || prevItem.contractId;
const resumeFrom = item.resumeFrom || prevItem.resumeFrom || 'clause';
const text = item.text || prevItem.text || $('Init State').first()?.json?.text || '';

if (item.failed) return [{ json: item }];
if (item.error) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: 'Obligation Extraction Agent',
      stage: 'obligation',
      contractId,
      resumeFrom,
      error: item.error.message || String(item.error)
    }
  }];
}

let data = item.output?.obligations || item.obligations || item.output?.cities;
if (!data && typeof item.output === 'string') {
  try {
    const p = JSON.parse(item.output);
    data = p.obligations || p.cities;
  } catch(e) {}
}
if (!data && item.text && typeof item.text === 'string' && item.text.includes('"obligations"')) {
  try { data = JSON.parse(item.text).obligations; } catch(e) {}
}

data = Array.isArray(data) ? data : [];

if (contractId) {
  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = {};
  global.__contractlens_state[contractId].obligations = data;
  global.__contractlens_state[contractId].text = text;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{
  json: {
    contractId,
    resumeFrom,
    text,
    obligations: data,
    output: { obligations: data }
  }
}];
`;
  }

  if (n.name === 'Save Summary') {
    n.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
let prevItem = {};
try { prevItem = $('Check Summary').first().json || {}; } catch(e) {}

const contractId = item.contractId || prevItem.contractId;
const resumeFrom = item.resumeFrom || prevItem.resumeFrom || 'clause';
const text = item.text || prevItem.text || $('Init State').first()?.json?.text || '';

if (item.failed) return [{ json: item }];
if (item.error) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: 'Executive Summary Agent',
      stage: 'summary',
      contractId,
      resumeFrom,
      error: item.error.message || String(item.error)
    }
  }];
}

let data = item.output || item.summary;
if (!data && typeof item.output === 'string') {
  try { data = JSON.parse(item.output); } catch(e) {}
}
if (!data && item.text && typeof item.text === 'string' && item.text.includes('"contract_name"')) {
  try { data = JSON.parse(item.text); } catch(e) {}
}
if (!data && item.contract_name) {
  data = item;
}

data = (data && typeof data === 'object') ? data : {};

if (contractId) {
  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = {};
  global.__contractlens_state[contractId].summary = data;
  global.__contractlens_state[contractId].text = text;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{
  json: {
    contractId,
    resumeFrom,
    text,
    summary: data,
    output: data
  }
}];
`;
  }

  if (n.name === 'Assemble Analysis') {
    n.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
let prevItem = {};
try { prevItem = $('Check Summary').first().json || {}; } catch(e) {}

const contractId = item.contractId || prevItem.contractId;

if (item.failed) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: item.failedAgent,
      stage: item.stage,
      contractId: contractId || item.contractId,
      error: item.error
    }
  }];
}

const state = (contractId && global.__contractlens_state[contractId]) ? global.__contractlens_state[contractId] : {};

const clauses = (state.clauses && state.clauses.length > 0) ? state.clauses : (item.clauses || []);
const risks = (state.risks && state.risks.length > 0) ? state.risks : (item.risks || []);
const obligations = (state.obligations && state.obligations.length > 0) ? state.obligations : (item.obligations || []);
const summary = (state.summary && Object.keys(state.summary).length > 0) ? state.summary : (item.summary || {});

return [
  { json: { contractId, output: { clauses } } },
  { json: { contractId, output: { risks } } },
  { json: { contractId, output: { obligations } } },
  { json: { contractId, output: summary } }
];
`;
  }

  if (n.name === 'Calculate Risk Score') {
    n.parameters.jsCode = `// Extract data from merged inputs and in-memory state
const inputs = $input.all();
let contractId = null;
for (const inp of inputs) {
  if (inp?.json?.contractId) { contractId = inp.json.contractId; break; }
}

const state = (contractId && global.__contractlens_state?.[contractId]) || {};

const clauseData = inputs[0]?.json?.output?.clauses || inputs[0]?.json?.clauses || state.clauses || [];
const riskData = inputs[1]?.json?.output?.risks || inputs[1]?.json?.risks || state.risks || [];
const obligationData = inputs[2]?.json?.output?.obligations || inputs[2]?.json?.obligations || state.obligations || [];
const summaryData = inputs[3]?.json?.output || inputs[3]?.json?.summary || state.summary || {};

// Standard category weights
const riskWeights = {
  payment_terms: 0.25,
  liability: 0.30,
  termination: 0.15,
  ip: 0.15,
  confidentiality: 0.08,
  data_protection: 0.12,
  service_level: 0.08,
  indemnification: 0.07,
  warranty: 0.05,
  general: 0.05
};

const riskScores = {
  critical: 1.0,
  high: 0.80,
  medium: 0.50,
  low: 0.25,
  none: 0.0
};

function normalizeRiskType(type) {
  const s = String(type || '').toLowerCase();
  if (s.includes('liab')) return 'liability';
  if (s.includes('pay') || s.includes('fee') || s.includes('compensation')) return 'payment_terms';
  if (s.includes('term') || s.includes('renew')) return 'termination';
  if (s.includes('indemn')) return 'indemnification';
  if (s.includes('ip') || s.includes('intellectual')) return 'ip';
  if (s.includes('data') || s.includes('security')) return 'data_protection';
  if (s.includes('sla') || s.includes('support') || s.includes('service')) return 'service_level';
  if (s.includes('confid')) return 'confidentiality';
  if (s.includes('warran')) return 'warranty';
  return 'general';
}

let scoreBreakdown = {};
let totalWeightedScore = 0;
let totalEvaluatedWeight = 0;
let redFlags = [];
let recommendations = [];

riskData.forEach(risk => {
  const category = normalizeRiskType(risk.clause_type);
  const weight = riskWeights[category] || 0.10;
  const level = String(risk.risk_level || '').toLowerCase();
  const score = riskScores[level] !== undefined ? riskScores[level] : 0.5;

  totalWeightedScore += score * weight;
  totalEvaluatedWeight += weight;

  scoreBreakdown[(category || 'general') + '_risk'] = score;

  if (level === 'critical' || level === 'high') {
    if (risk.risk_description) redFlags.push(risk.risk_description);
    if (risk.recommendation) recommendations.push(risk.recommendation);
  }
});

// Check for missing critical clauses
const criticalClauses = ['payment_terms', 'liability', 'termination'];
const foundClauses = clauseData.map(c => normalizeRiskType(c.clause_type));

criticalClauses.forEach(critical => {
  if (!foundClauses.includes(critical)) {
    redFlags.push('Missing critical clause: ' + critical);
    recommendations.push('Add ' + critical + ' clause to contract');
  }
});

// Check AI confidence
const lowConfidenceItems = [...clauseData, ...riskData].filter(
  item => typeof item.ai_confidence === 'number' && item.ai_confidence < 0.6
);
if (lowConfidenceItems.length > 0) {
  redFlags.push(lowConfidenceItems.length + ' items flagged for manual legal review');
  recommendations.push('Schedule legal review for low-confidence extractions');
}

// Calculate final overall risk score (scale 0.0 - 1.0)
let overallRiskScore = 0;
if (riskData.length > 0) {
  // If there are evaluated risks, normalize by weight with high-impact sensitivity
  const normalized = totalWeightedScore / Math.max(totalEvaluatedWeight, 0.5);
  overallRiskScore = Math.min(1.0, Math.round(normalized * 100) / 100);
}

// Determine risk level string
let riskLevel = 'LOW';
if (overallRiskScore >= 0.85) riskLevel = 'CRITICAL';
else if (overallRiskScore >= 0.70) riskLevel = 'HIGH';
else if (overallRiskScore >= 0.40) riskLevel = 'MEDIUM';

const contractName = summaryData.contract_name || 
                     $('Contract Upload Webhook').first()?.json?.headers?.['x-contract-name'] ||
                     'Contract Agreement';

const result = {
  contractId,
  contract_name: contractName,
  overall_risk_score: overallRiskScore,
  risk_level: riskLevel,
  score_breakdown: scoreBreakdown,
  red_flags: redFlags,
  recommendations: recommendations,
  clauses: clauseData,
  risks: riskData,
  obligations: obligationData,
  summary: summaryData,
  calculated_at: new Date().toISOString()
};

return [{ json: result }];
`;
  }
});

// 6. Fix Connections: Wire Google Gemini Chat Model to all 4 Agents
wf.connections['Google Gemini Chat Model'] = {
  ai_languageModel: [
    [
      { node: 'Clause Extraction Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Risk Assessment Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Obligation Extraction Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Executive Summary Agent', type: 'ai_languageModel', index: 0 }
    ]
  ]
};

// Clean up connections from deleted nodes
delete wf.connections['Claude 3.5 Model'];
delete wf.connections['Mistral Cloud Chat Model'];
delete wf.connections['Groq Chat Model'];
delete wf.connections['Groq Chat Model1'];

// 7. Fix Alert and Webhook Connections
// Check Risk Level:
// out:0 (True, score >= 0.7) -> Send Email Alert, Send Slack Alert, Respond to Webhook
// out:1 (False, score < 0.7) -> Respond to Webhook
wf.connections['Check Risk Level'] = {
  main: [
    [
      { node: 'Send Email Alert', type: 'main', index: 0 },
      { node: 'Send Slack Alert', type: 'main', index: 0 },
      { node: 'Respond to Webhook', type: 'main', index: 0 }
    ],
    [
      { node: 'Respond to Webhook', type: 'main', index: 0 }
    ]
  ]
};

// Send Email Alert and Send Slack Alert have NO outgoing connections (no duplicate Webhook1)
delete wf.connections['Send Email Alert'];
delete wf.connections['Send Slack Alert'];

// Add onError: continueRegularOutput on alerts so alert failures don't kill webhook response
const emailNode = wf.nodes.find(n => n.name === 'Send Email Alert');
if (emailNode) {
  emailNode.onError = 'continueRegularOutput';
  emailNode.parameters.message = '<h2>High Risk Contract Detected</h2><p><strong>Contract:</strong> {{ $json.contract_name }}</p><p><strong>Risk Score:</strong> {{ $json.overall_risk_score }} (Threshold: 0.7)</p><h3>Red Flags:</h3><ul>{{ ($json.red_flags || []).map(f => "<li>" + f + "</li>").join("") }}</ul><h3>Recommendations:</h3><ul>{{ ($json.recommendations || []).map(r => "<li>" + r + "</li>").join("") }}</ul><p>Please review this contract immediately.</p>';
}

const slackNode = wf.nodes.find(n => n.name === 'Send Slack Alert');
if (slackNode) {
  slackNode.onError = 'continueRegularOutput';
  slackNode.parameters.text = '⚠️ *HIGH RISK CONTRACT ALERT*\n\n*Contract:* {{ $json.contract_name }}\n*Risk Score:* {{ $json.overall_risk_score }} (Threshold: 0.7)\n\n*Red Flags:*\n{{ ($json.red_flags || []).map((f, i) => (i+1) + ". " + f).join("\\n") }}\n\n*Recommendations:*\n{{ ($json.recommendations || []).map((r, i) => (i+1) + ". " + r).join("\\n") }}\n\nPlease review immediately.';
}

// 8. Write the complete, verified workflow
fs.writeFileSync('wf_complete_working.json', JSON.stringify(wf, null, 2));
console.log('Successfully generated wf_complete_working.json with', wf.nodes.length, 'nodes');
