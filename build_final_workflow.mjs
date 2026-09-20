#!/usr/bin/env node
/**
 * build_final_workflow.mjs — DEFINITIVE FIX v2
 * 
 * THE ROOT CAUSE (finally nailed):
 * =================================
 * n8n's Agent node REPLACES $json entirely with its own output.
 * Input:  { contractId, resumeFrom, text, shouldReuse: false }
 * Output: { output: { clauses: [...] } }  ← contractId, text GONE
 * 
 * So Save Clause receives { output: { clauses } } with NO contractId 
 * and NO text. It can't find the state, can't get the text, and all
 * downstream agents get empty text.
 * 
 * THE FIX:
 * ========
 * Each Check node stores: global.__contractlens_current = { contractId, resumeFrom, text }
 * Each Save node reads:   global.__contractlens_current (guaranteed to be set before agent runs)
 * 
 * Flow: Check → IF → Agent → Save
 *       ↑ sets current         ↑ reads current
 */

import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('./wf_4_gemini_models.json', 'utf8'));
const out = JSON.parse(JSON.stringify(wf));

function findNode(name) {
  return out.nodes.find(n => n.name === name);
}

// ===== FIX: Agent prompts — ONLY {{ $json.text }} =====

const clauseAgent = findNode('Clause Extraction Agent');
clauseAgent.parameters.text = `=Analyze the following contract text and extract all clauses according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
clauseAgent.parameters.options.systemMessage = `You are a legal contract analysis expert specializing in clause extraction.\n\nYour task:\n1. Identify and extract ALL contract clauses from the provided contract text.\n2. For each clause, assign clause_type to one of: "payment_terms", "termination", "liability", "ip", "confidentiality", "warranty", or "indemnification".\n3. Extract the exact clause_text from the document.\n4. Assign an ai_confidence score between 0.0 and 1.0.\n\nFormat your output as a valid JSON object matching the required schema with a top-level "clauses" array.\nAlways provide standard JSON arguments directly. Never output XML tags such as <tool_call>, </tool_call>, or <function>. Never include markdown code fences for function calls.`;
clauseAgent.onError = "continueRegularOutput";
clauseAgent.retryOnFail = true;
clauseAgent.waitBetweenTries = 5000;
clauseAgent.maxTries = 4;

const riskAgent = findNode('Risk Assessment Agent');
riskAgent.parameters.text = `=Analyze the following contract text and evaluate all legal, operational, and financial risks according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
riskAgent.parameters.options.systemMessage = `You are a legal risk assessment expert specializing in contract analysis.\n\nYour task:\n1. Analyze each clause and provision in the provided contract text for potential risks.\n2. For each risk, specify:\n   - clause_type: clause category (e.g. "payment_terms", "liability", "termination", "ip", "confidentiality", "warranty", "indemnification", "data_protection", "service_level")\n   - risk_level: "critical", "high", "medium", or "low"\n   - risk_description: concise explanation of the risk factor\n   - recommendation: concrete legal or negotiation recommendation\n   - ai_confidence: confidence score between 0.0 and 1.0\n3. Identify critical risk factors such as unlimited liability, unilateral indemnity, harsh penalties, lock-in periods, or broad IP assignments.\n4. You MUST find and report ALL risks. Do not return an empty array.\n\nFormat your output as a valid JSON object matching the required schema with a top-level "risks" array.\nAlways provide standard JSON arguments directly. Never output XML tags. Never include markdown code fences for function calls.`;
riskAgent.onError = "continueRegularOutput";
riskAgent.retryOnFail = true;
riskAgent.waitBetweenTries = 5000;
riskAgent.maxTries = 4;

const obligationAgent = findNode('Obligation Extraction Agent');
obligationAgent.parameters.text = `=Extract all obligations, duties, and commitments from the following contract text according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
obligationAgent.parameters.options.systemMessage = `You are a legal obligation tracking expert.\n\nYour task:\n1. Extract ALL obligations, duties, commitments, and deadlines from the contract text. Look for keywords: "must", "shall", "required", "obligated", "agrees to".\n2. For each obligation, specify:\n   - obligation_text: exact or summary description of the obligation\n   - obligation_type: one of "payment", "delivery", "reporting", or "compliance"\n   - due_date: deadline in YYYY-MM-DD format if mentioned, or null\n   - responsible_party: name or role of responsible party (e.g. "Client", "Vendor", or party name), or null\n   - status: "pending"\n\nFormat your output as a valid JSON object matching the required schema with a top-level "obligations" array.\nAlways provide standard JSON arguments directly. Never output XML tags. Never include markdown code fences for function calls.`;
obligationAgent.onError = "continueRegularOutput";
obligationAgent.retryOnFail = true;
obligationAgent.waitBetweenTries = 5000;
obligationAgent.maxTries = 4;

const summaryAgent = findNode('Executive Summary Agent');
summaryAgent.parameters.text = `=Generate a structured executive summary of the following contract text according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
summaryAgent.parameters.options.systemMessage = `You are a legal contract summarization expert.\n\nYour task:\n1. Generate a comprehensive, concise executive summary of the contract.\n2. Identify:\n   - contract_name: title or formal name of the agreement\n   - parties: array of contracting party names (e.g. ["Client Name", "Vendor Name"])\n   - contract_type: category of agreement (e.g. "vendor", "saas", "services", "nda", "employment")\n   - execution_date: effective or execution date (YYYY-MM-DD or string)\n   - expiry_date: termination or expiry date (YYYY-MM-DD or string)\n   - value: contract monetary value as a number, or null\n   - key_terms: summary of key commercial and operational terms\n   - major_obligations: summary of main responsibilities of each party\n   - notable_provisions: key termination, liability, or unusual clauses\n   - overall_assessment: executive assessment of the contract\n\nFormat your output as a valid JSON object matching the required schema.\nAlways provide standard JSON arguments directly. Never output XML tags or markdown code fences for function calls.`;
summaryAgent.onError = "continueRegularOutput";
summaryAgent.retryOnFail = true;
summaryAgent.waitBetweenTries = 5000;
summaryAgent.maxTries = 4;

// ===== FIX: Obligation Parser schema — no extra "output" wrapper =====

const obligationParser = findNode('Obligation Parser');
obligationParser.parameters.jsonSchemaExample = JSON.stringify({
  obligations: [
    {
      obligation_text: "Vendor shall provide cloud services with 99.9% uptime",
      obligation_type: "delivery",
      due_date: "2025-01-01",
      responsible_party: "Vendor",
      status: "pending"
    }
  ]
}, null, 2);

// ===== FIX: Init State =====

findNode('Init State').parameters.jsCode = `// Initialize state for fresh upload
if (!global.__contractlens_state) global.__contractlens_state = {};

const body = $input.first().json;
const contractId = 'contract_' + Date.now();
const text = body.text || '';

if (!text || text.trim().length < 50) {
  throw new Error('PDF text extraction failed or text too short (' + (text ? text.length : 0) + ' chars).');
}

// Cache text in global state
global.__contractlens_state[contractId] = {
  contractId, text,
  clauses: null, risks: null, obligations: null, summary: null,
  updatedAt: new Date().toISOString()
};

// Also set as current context (for Save nodes after Agent strips $json)
global.__contractlens_current = { contractId, resumeFrom: 'clause', text };

return [{ json: { contractId, resumeFrom: 'clause', text } }];`;

// ===== FIX: Load State =====

findNode('Load State').parameters.jsCode = `// Load state for resume/retry
if (!global.__contractlens_state) global.__contractlens_state = {};

const body = $input.first().json.body || $input.first().json;
const contractId = body.contractId;
const resumeFrom = (body.resumeFrom || 'clause').toLowerCase();
const state = global.__contractlens_state[contractId] || {};

if (!state.text) {
  throw new Error('No cached state for contractId: ' + contractId + '. Contract must be re-uploaded.');
}

// Set current context
global.__contractlens_current = { contractId, resumeFrom, text: state.text };

return [{ json: {
  contractId, resumeFrom,
  text: state.text,
  clauses: state.clauses || null,
  risks: state.risks || null,
  obligations: state.obligations || null,
  summary: state.summary || null
} }];`;

// ===== THE KEY FIX: Check nodes store context, Save nodes recover it =====

// Check Clause
findNode('Check Clause').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();
const text = item.text || (global.__contractlens_state[contractId]?.text) || '';

// ** THE KEY: store context so Save Clause can recover it after Agent strips $json **
global.__contractlens_current = { contractId, resumeFrom, text };

const cached = global.__contractlens_state[contractId]?.clauses;
const shouldReuse = cached && Array.isArray(cached) && cached.length > 0 && resumeFrom !== 'clause';

if (shouldReuse) {
  return [{ json: { contractId, resumeFrom, text, shouldReuse: true, clauses: cached, output: { clauses: cached } } }];
}
return [{ json: { contractId, resumeFrom, text, shouldReuse: false } }];`;

// Save Clause — recovers contractId and text from global.__contractlens_current
findNode('Save Clause').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;

// ** THE KEY: Agent node replaces $json entirely, losing contractId and text.
// Recover from global.__contractlens_current (set by Check Clause before Agent ran) **
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || ctx.contractId;
const resumeFrom = item.resumeFrom || ctx.resumeFrom || 'clause';
const text = item.text || ctx.text || (global.__contractlens_state[contractId]?.text) || '';

// If cached bypass, data is already in item
if (item.shouldReuse && item.clauses) {
  return [{ json: { contractId, resumeFrom, text, clauses: item.clauses, output: { clauses: item.clauses } } }];
}

// Extract clauses from Agent output
function extractArray(obj, key) {
  if (obj.output?.[key] && Array.isArray(obj.output[key])) return obj.output[key];
  if (obj[key] && Array.isArray(obj[key])) return obj[key];
  if (obj.output?.output?.[key] && Array.isArray(obj.output.output[key])) return obj.output.output[key];
  const strs = [obj.output, obj.text, obj.content, obj.message].filter(s => typeof s === 'string');
  for (const raw of strs) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p[key] && Array.isArray(p[key])) return p[key];
      if (p.output?.[key]) return p.output[key];
    } catch(e) {}
  }
  return [];
}

const clauses = extractArray(item, 'clauses');

if (contractId && global.__contractlens_state[contractId]) {
  global.__contractlens_state[contractId].clauses = clauses;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{ json: { contractId, resumeFrom, text, clauses, output: { clauses } } }];`;

// Check Risk
findNode('Check Risk').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();
const text = item.text || (global.__contractlens_state[contractId]?.text) || '';

// Store context for Save Risk (Agent will strip $json)
global.__contractlens_current = { contractId, resumeFrom, text };

const cached = global.__contractlens_state[contractId]?.risks;
const shouldReuse = cached && Array.isArray(cached) && cached.length > 0 && resumeFrom !== 'clause' && resumeFrom !== 'risk';

if (shouldReuse) {
  return [{ json: { contractId, resumeFrom, text, shouldReuse: true, risks: cached, output: { risks: cached } } }];
}
return [{ json: { contractId, resumeFrom, text, shouldReuse: false } }];`;

// Save Risk
findNode('Save Risk').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || ctx.contractId;
const resumeFrom = item.resumeFrom || ctx.resumeFrom || 'clause';
const text = item.text || ctx.text || (global.__contractlens_state[contractId]?.text) || '';

if (item.shouldReuse && item.risks) {
  return [{ json: { contractId, resumeFrom, text, risks: item.risks, output: { risks: item.risks } } }];
}

function extractArray(obj, key) {
  if (obj.output?.[key] && Array.isArray(obj.output[key])) return obj.output[key];
  if (obj[key] && Array.isArray(obj[key])) return obj[key];
  if (obj.output?.output?.[key] && Array.isArray(obj.output.output[key])) return obj.output.output[key];
  const strs = [obj.output, obj.text, obj.content, obj.message].filter(s => typeof s === 'string');
  for (const raw of strs) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p[key] && Array.isArray(p[key])) return p[key];
      if (p.output?.[key]) return p.output[key];
    } catch(e) {}
  }
  return [];
}

const risks = extractArray(item, 'risks');

if (contractId && global.__contractlens_state[contractId]) {
  global.__contractlens_state[contractId].risks = risks;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{ json: { contractId, resumeFrom, text, risks, output: { risks } } }];`;

// Check Obligation
findNode('Check Obligation').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();
const text = item.text || (global.__contractlens_state[contractId]?.text) || '';

// Store context for Save Obligation
global.__contractlens_current = { contractId, resumeFrom, text };

const cached = global.__contractlens_state[contractId]?.obligations;
const shouldReuse = cached && Array.isArray(cached) && cached.length > 0 && resumeFrom !== 'clause' && resumeFrom !== 'risk' && resumeFrom !== 'obligation';

if (shouldReuse) {
  return [{ json: { contractId, resumeFrom, text, shouldReuse: true, obligations: cached, output: { obligations: cached } } }];
}
return [{ json: { contractId, resumeFrom, text, shouldReuse: false } }];`;

// Save Obligation
findNode('Save Obligation').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || ctx.contractId;
const resumeFrom = item.resumeFrom || ctx.resumeFrom || 'clause';
const text = item.text || ctx.text || (global.__contractlens_state[contractId]?.text) || '';

if (item.shouldReuse && item.obligations) {
  return [{ json: { contractId, resumeFrom, text, obligations: item.obligations, output: { obligations: item.obligations } } }];
}

function extractArray(obj, key) {
  if (obj.output?.[key] && Array.isArray(obj.output[key])) return obj.output[key];
  if (obj[key] && Array.isArray(obj[key])) return obj[key];
  if (obj.output?.output?.[key] && Array.isArray(obj.output.output[key])) return obj.output.output[key];
  const strs = [obj.output, obj.text, obj.content, obj.message].filter(s => typeof s === 'string');
  for (const raw of strs) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p[key] && Array.isArray(p[key])) return p[key];
      if (p.output?.[key]) return p.output[key];
    } catch(e) {}
  }
  return [];
}

const obligations = extractArray(item, 'obligations');

if (contractId && global.__contractlens_state[contractId]) {
  global.__contractlens_state[contractId].obligations = obligations;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{ json: { contractId, resumeFrom, text, obligations, output: { obligations } } }];`;

// Check Summary
findNode('Check Summary').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();
const text = item.text || (global.__contractlens_state[contractId]?.text) || '';

// Store context for Save Summary
global.__contractlens_current = { contractId, resumeFrom, text };

const cached = global.__contractlens_state[contractId]?.summary;
const shouldReuse = cached && typeof cached === 'object' && Object.keys(cached).length > 0 && resumeFrom !== 'summary';

if (shouldReuse) {
  return [{ json: { contractId, resumeFrom, text, shouldReuse: true, summary: cached, output: cached } }];
}
return [{ json: { contractId, resumeFrom, text, shouldReuse: false } }];`;

// Save Summary
findNode('Save Summary').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || ctx.contractId;
const resumeFrom = item.resumeFrom || ctx.resumeFrom || 'clause';
const text = item.text || ctx.text || (global.__contractlens_state[contractId]?.text) || '';

if (item.shouldReuse && item.summary && typeof item.summary === 'object') {
  return [{ json: { contractId, resumeFrom, text, summary: item.summary, output: item.summary } }];
}

function extractSummary(obj) {
  if (obj.output && typeof obj.output === 'object' && obj.output.contract_name) return obj.output;
  if (obj.output?.output && typeof obj.output.output === 'object' && obj.output.output.contract_name) return obj.output.output;
  if (obj.contract_name) return obj;
  const strs = [obj.output, obj.text, obj.content, obj.message].filter(s => typeof s === 'string');
  for (const raw of strs) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p.contract_name) return p;
      if (p.output?.contract_name) return p.output;
    } catch(e) {}
  }
  return {};
}

const summary = extractSummary(item);

if (contractId && global.__contractlens_state[contractId]) {
  global.__contractlens_state[contractId].summary = summary;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{ json: { contractId, resumeFrom, text, summary, output: summary } }];`;

// ===== FIX: Assemble Analysis =====

findNode('Assemble Analysis').parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $input.first().json;
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || ctx.contractId;
const state = global.__contractlens_state[contractId] || {};

const clauses = state.clauses || item.clauses || [];
const risks = state.risks || item.risks || [];
const obligations = state.obligations || item.obligations || [];
const summary = state.summary || item.summary || {};

return [
  { json: { contractId, output: { clauses } } },
  { json: { contractId, output: { risks } } },
  { json: { contractId, output: { obligations } } },
  { json: { contractId, output: summary } }
];`;

// ===== FIX: Remove orphaned Merge Analysis Results =====
out.nodes = out.nodes.filter(n => n.name !== 'Merge Analysis Results');
delete out.connections["Merge Analysis Results"];

out.connections["Check Any Failed?"] = {
  main: [
    [{ node: "Respond Error", type: "main", index: 0 }],
    [{ node: "Calculate Risk Score", type: "main", index: 0 }]
  ]
};

// ===== FIX: Calculate Risk Score =====

findNode('Calculate Risk Score').parameters.jsCode = `const inputs = $input.all();
let contractId = null;
let clauseData = [], riskData = [], obligationData = [], summaryData = {};

for (const inp of inputs) {
  const json = inp.json;
  if (json.contractId) contractId = json.contractId;
  if (json.output) {
    if (json.output.clauses) clauseData = json.output.clauses;
    else if (json.output.risks) riskData = json.output.risks;
    else if (json.output.obligations) obligationData = json.output.obligations;
    else if (json.output.contract_name) summaryData = json.output;
  }
}

// Fallback: global state
if (contractId && global.__contractlens_state?.[contractId]) {
  const st = global.__contractlens_state[contractId];
  if (!clauseData.length && st.clauses) clauseData = st.clauses;
  if (!riskData.length && st.risks) riskData = st.risks;
  if (!obligationData.length && st.obligations) obligationData = st.obligations;
  if (!summaryData.contract_name && st.summary) summaryData = st.summary;
}

const W = { payment_terms:.25, liability:.30, termination:.15, ip:.15, confidentiality:.08, data_protection:.12, service_level:.08, indemnification:.07, warranty:.05, general:.05 };
const S = { critical:1.0, high:.80, medium:.50, low:.25, none:0 };

function norm(t) {
  const s = String(t||'').toLowerCase();
  if (s.includes('liab')) return 'liability';
  if (s.includes('pay')||s.includes('fee')) return 'payment_terms';
  if (s.includes('term')||s.includes('renew')) return 'termination';
  if (s.includes('indemn')) return 'indemnification';
  if (s.includes('ip')||s.includes('intellectual')) return 'ip';
  if (s.includes('data')||s.includes('security')) return 'data_protection';
  if (s.includes('sla')||s.includes('service')) return 'service_level';
  if (s.includes('confid')) return 'confidentiality';
  if (s.includes('warran')) return 'warranty';
  return 'general';
}

let bd = {}, tw = 0, te = 0, rf = [], rec = [];
riskData.forEach(r => {
  const c = norm(r.clause_type), w = W[c]||.10;
  const l = String(r.risk_level||'').toLowerCase();
  const s = S[l] !== undefined ? S[l] : .5;
  tw += s * w; te += w; bd[c+'_risk'] = s;
  if (l==='critical'||l==='high') {
    if (r.risk_description) rf.push(r.risk_description);
    if (r.recommendation) rec.push(r.recommendation);
  }
});

['payment_terms','liability','termination'].forEach(ct => {
  if (!clauseData.map(c=>norm(c.clause_type)).includes(ct)) {
    rf.push('Missing critical clause: '+ct);
    rec.push('Add '+ct+' clause');
  }
});

let score = 0;
if (riskData.length > 0) score = Math.min(1, Math.round((tw / Math.max(te, .5)) * 100) / 100);

let level = 'LOW';
if (score >= .85) level = 'CRITICAL';
else if (score >= .70) level = 'HIGH';
else if (score >= .40) level = 'MEDIUM';

return [{ json: {
  contractId, contract_name: summaryData.contract_name || 'Contract Agreement',
  overall_risk_score: score, risk_level: level,
  score_breakdown: bd, red_flags: rf, recommendations: rec,
  clauses: clauseData, risks: riskData,
  obligations: obligationData, summary: summaryData,
  calculated_at: new Date().toISOString()
} }];`;

// ===== FIX: Insert Contract parties cross-branch ref =====
const insertContract = findNode('Insert Contract');
if (insertContract?.parameters?.columns?.value?.parties) {
  insertContract.parameters.columns.value.parties = "={{ JSON.stringify({ client: ($json.summary?.parties || [])[0] || 'Unknown', vendor: ($json.summary?.parties || [])[1] || 'Unknown' }) }}";
}

// ===== FIX: Respond Error =====
const respondError = findNode('Respond Error');
respondError.parameters.responseBody = `={{ { success: false, analysisStatus: 'failed', failedAgent: $json.failedAgent || 'AI Agent', resumeFrom: $json.resumeFrom || $json.stage || 'clause', contractId: $json.contractId, error: $json.error || 'Temporary AI service issue. Please try again.' } }}`;

// ===== Output =====
out.name = "ContractLens - Final Fixed Workflow";
writeFileSync('./wf_final.json', JSON.stringify(out, null, 2));

// Also overwrite the main file
writeFileSync('./wf_4_gemini_models.json', JSON.stringify(out, null, 2));

console.log('\\n=== Generated wf_final.json + wf_4_gemini_models.json ===');
console.log('');
console.log('ROOT CAUSE: n8n Agent node REPLACES $json with its own output.');
console.log('  Input to Agent:  { contractId, resumeFrom, text, shouldReuse }');
console.log('  Output of Agent: { output: { clauses: [...] } }  <-- text GONE');
console.log('');
console.log('FIX: Each Check node stores global.__contractlens_current = { contractId, resumeFrom, text }');
console.log('     Each Save node reads from global.__contractlens_current as fallback');
console.log('');

// Verify
let bad = 0;
const badRefs = ['Extract PDF Text', 'Init State', 'Contract Upload Webhook', 'Load State'];
for (const node of out.nodes) {
  const s = JSON.stringify(node.parameters || {});
  badRefs.forEach(ref => {
    if (s.includes("$('" + ref + "')") || s.includes('$("' + ref + '")') || s.includes("$(\\\'" + ref) || s.includes("$(\\\"" + ref)) {
      console.log('  ❌ CROSS-REF in ' + node.name + ': ' + ref);
      bad++;
    }
  });
}
if (!bad) console.log('✅ ZERO cross-branch references. Workflow is clean.');
