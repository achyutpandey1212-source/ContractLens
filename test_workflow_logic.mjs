import fs from 'fs';

const wf = JSON.parse(fs.readFileSync('wf_complete_working.json', 'utf8'));

console.log('=== 1. Check for Disallowed "fs" Module in Nodes ===');
let fsFound = false;
wf.nodes.forEach(n => {
  if (n.parameters?.jsCode && n.parameters.jsCode.includes("require('fs')")) {
    console.error(`ERROR: Node "${n.name}" still contains require('fs')!`);
    fsFound = true;
  }
});
if (!fsFound) console.log('PASS: Zero require("fs") references across all nodes.');

console.log('\n=== 2. Check Model Connections to AI Agents ===');
const geminiTargets = wf.connections['Google Gemini Chat Model']?.ai_languageModel?.[0] || [];
console.log('Google Gemini connected to:', geminiTargets.map(t => t.node));
const expectedAgents = [
  'Clause Extraction Agent',
  'Risk Assessment Agent',
  'Obligation Extraction Agent',
  'Executive Summary Agent'
];
const allConnected = expectedAgents.every(agent => geminiTargets.some(t => t.node === agent));
if (allConnected) {
  console.log('PASS: Google Gemini is connected to all 4 AI agents!');
} else {
  console.error('ERROR: Missing agent connections from Google Gemini!');
}

console.log('\n=== 3. Check Webhook Response & Alert Routing ===');
const checkRiskConn = wf.connections['Check Risk Level']?.main;
console.log('Check Risk Level [True (out 0)] ->', checkRiskConn[0].map(t => t.node));
console.log('Check Risk Level [False (out 1)] ->', checkRiskConn[1].map(t => t.node));

const trueHasEmail = checkRiskConn[0].some(t => t.node === 'Send Email Alert');
const trueHasSlack = checkRiskConn[0].some(t => t.node === 'Send Slack Alert');
const trueHasWebhook = checkRiskConn[0].some(t => t.node === 'Respond to Webhook');
const falseHasWebhook = checkRiskConn[1].some(t => t.node === 'Respond to Webhook');

if (trueHasEmail && trueHasSlack && trueHasWebhook && falseHasWebhook) {
  console.log('PASS: Risk Level threshold routing is 100% correct.');
} else {
  console.error('ERROR: Risk routing issue!');
}

console.log('\n=== 4. Test Calculate Risk Score Simulation ===');
// Simulate sample contract risk data from the AI
const sampleRisks = [
  { clause_type: 'limitation of liability', risk_level: 'critical', risk_description: 'Unlimited liability for client', recommendation: 'Cap liability' },
  { clause_type: 'fees and payment', risk_level: 'high', risk_description: 'Immediate acceleration and penalty interest', recommendation: '30-day grace period' },
  { clause_type: 'term and termination', risk_level: 'high', risk_description: 'Lock-in period with early termination penalty', recommendation: 'Allow termination with 30 days notice' }
];

const sampleClauses = [
  { clause_type: 'liability', clause_text: 'Client indemnifies vendor for all losses without limit' },
  { clause_type: 'payment_terms', clause_text: 'Payment due on receipt' },
  { clause_type: 'termination', clause_text: '3 year minimum term' }
];

const sampleSummary = {
  contract_name: 'Cloud Services & Managed Services Agreement',
  parties: ['Northstar Retail Technologies Pvt. Ltd.', 'BlackPeak Digital Solutions Pvt. Ltd.']
};

// Simulate node code
const calcNode = wf.nodes.find(n => n.name === 'Calculate Risk Score');
const runCode = new Function('$input', 'global', calcNode.parameters.jsCode);

const mockInput = {
  all: () => [
    { json: { output: { clauses: sampleClauses } } },
    { json: { output: { risks: sampleRisks } } },
    { json: { output: { obligations: [] } } },
    { json: { output: sampleSummary } }
  ]
};

const calcResult = runCode(mockInput, { __contractlens_state: {} });
const resultJson = calcResult[0].json;

console.log('Contract Name:', resultJson.contract_name);
console.log('Overall Risk Score:', resultJson.overall_risk_score, `(${resultJson.risk_level})`);
console.log('Red Flags Count:', resultJson.red_flags.length);
console.log('Recommendations Count:', resultJson.recommendations.length);

if (resultJson.overall_risk_score >= 0.70 && resultJson.contract_name) {
  console.log('PASS: Calculate Risk Score accurately triggers high risk (>= 0.70) with contract name present!');
} else {
  console.error('ERROR in risk calculation!');
}
