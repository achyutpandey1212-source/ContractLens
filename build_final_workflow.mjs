#!/usr/bin/env node
/**
 * build_final_workflow.mjs
 * 
 * Generates the DEFINITIVE fixed ContractLens n8n workflow.
 * 
 * ROOT CAUSE ANALYSIS (from user's live run):
 * ============================================
 * 
 * 1. "Node 'Extract PDF Text' hasn't been executed" error
 *    - The user's live workflow has agent prompts referencing
 *      $("Init State") and $("Extract PDF Text") as fallbacks.
 *    - On the resume path, these nodes don't execute → n8n throws.
 *    
 * 2. Risk Agent returns empty risks: []
 *    Obligation Agent returns empty obligations: []
 *    Summary Agent says "No contract text was provided"
 *    - The agents ARE receiving input but the text field is empty.
 *    - The n8n Agent node wraps its response in { output: ... }.
 *      After the Clause agent runs, its OUTPUT loses the "text" field.
 *      Save Clause must re-attach text from global state.
 *    - Also: the Obligation Parser has schema { "output": { "obligations": [...] } }
 *      which forces the LLM to return a double-wrapped structure.
 *    
 * 3. Merge Analysis Results is orphaned (nothing connects INTO it).
 *    Check Any Failed? (false) → Calculate Risk Score is the real path.
 * 
 * 4. Insert Contract has $('Calculate Risk Score') cross-branch reference.
 */

import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('./wf_4_gemini_models.json', 'utf8'));
const out = JSON.parse(JSON.stringify(wf));

function findNode(name) {
  return out.nodes.find(n => n.name === name);
}

// ===== FIX 1: Agent prompts — ONLY {{ $json.text }}, zero fallbacks =====

const clauseAgent = findNode('Clause Extraction Agent');
clauseAgent.parameters.text = `=Analyze the following contract text and extract all clauses according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
clauseAgent.parameters.options.systemMessage = `You are a legal contract analysis expert specializing in clause extraction.\n\nYour task:\n1. Identify and extract ALL contract clauses from the provided contract text.\n2. For each clause, assign clause_type to one of: "payment_terms", "termination", "liability", "ip", "confidentiality", "warranty", or "indemnification".\n3. Extract the exact clause_text from the document.\n4. Assign an ai_confidence score between 0.0 and 1.0.\n\nFormat your output as a valid JSON object matching the required schema with a top-level "clauses" array.\nAlways provide standard JSON arguments directly. Never output XML tags such as <tool_call>, </tool_call>, or <function>. Never include markdown code fences for function calls.`;
clauseAgent.onError = "continueRegularOutput";
clauseAgent.retryOnFail = true;
clauseAgent.waitBetweenTries = 5000;
clauseAgent.maxTries = 4;

const riskAgent = findNode('Risk Assessment Agent');
riskAgent.parameters.text = `=Analyze the following contract text and evaluate all legal, operational, and financial risks according to the required schema:\n\n--- CONTRACT TEXT START ---\n{{ $json.text }}\n--- CONTRACT TEXT END ---`;
riskAgent.parameters.options.systemMessage = `You are a legal risk assessment expert specializing in contract analysis.\n\nYour task:\n1. Analyze each clause and provision in the provided contract text for potential risks.\n2. For each risk, specify:\n   - clause_type: clause category (e.g. "payment_terms", "liability", "termination", "ip", "confidentiality", "warranty", "indemnification", "data_protection", "service_level")\n   - risk_level: "critical", "high", "medium", or "low"\n   - risk_description: concise explanation of the risk factor\n   - recommendation: concrete legal or negotiation recommendation\n   - ai_confidence: confidence score between 0.0 and 1.0\n3. Identify critical risk factors such as unlimited liability, unilateral indemnity, harsh penalties, lock-in periods, or broad IP assignments.\n4. You MUST find and report ALL risks. If the contract has unfavorable terms, report them.\n\nFormat your output as a valid JSON object matching the required schema with a top-level "risks" array.\nAlways provide standard JSON arguments directly. Never output XML tags. Never include markdown code fences for function calls.`;
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

// ===== FIX 2: Obligation Parser schema — remove the extra "output" wrapper =====

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

// ===== FIX 3: Init State — no cross-branch references =====

const initState = findNode('Init State');
initState.parameters.jsCode = [
  "if (!global.__contractlens_state) global.__contractlens_state = {};",
  "",
  "const body = $input.first().json;",
  "const contractId = 'contract_' + Date.now();",
  "const text = body.text || '';",
  "",
  "if (!text || text.trim().length < 50) {",
  "  throw new Error('PDF text extraction failed or text too short. Got ' + (text ? text.length : 0) + ' chars.');",
  "}",
  "",
  "global.__contractlens_state[contractId] = {",
  "  contractId, text,",
  "  clauses: null, risks: null, obligations: null, summary: null,",
  "  updatedAt: new Date().toISOString()",
  "};",
  "",
  "return [{ json: { contractId, resumeFrom: 'clause', text } }];"
].join("\n");

// ===== FIX 4: Load State — read from cache only =====

const loadState = findNode('Load State');
loadState.parameters.jsCode = [
  "if (!global.__contractlens_state) global.__contractlens_state = {};",
  "",
  "const body = $input.first().json.body || $input.first().json;",
  "const contractId = body.contractId;",
  "const resumeFrom = (body.resumeFrom || 'clause').toLowerCase();",
  "const state = global.__contractlens_state[contractId] || {};",
  "",
  "if (!state.text) {",
  "  throw new Error('No cached state for contractId: ' + contractId + '. The contract must be re-uploaded.');",
  "}",
  "",
  "return [{ json: {",
  "  contractId, resumeFrom,",
  "  text: state.text,",
  "  clauses: state.clauses || null,",
  "  risks: state.risks || null,",
  "  obligations: state.obligations || null,",
  "  summary: state.summary || null",
  "} }];"
].join("\n");

// ===== FIX 5-12: Check and Save nodes — clean data flow =====

// Helper: generates Check node code
function makeCheckCode(stage, dataKey, priorStages) {
  const resumeConditions = priorStages.map(s => `resumeFrom !== '${s}'`).join(' && ');
  return [
    "if (!global.__contractlens_state) global.__contractlens_state = {};",
    "const item = $input.first().json;",
    "const contractId = item.contractId;",
    "const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();",
    "const text = item.text || (global.__contractlens_state[contractId]?.text) || '';",
    "",
    `const cached = global.__contractlens_state[contractId]?.${dataKey};`,
    dataKey === 'summary'
      ? `const shouldReuse = cached && typeof cached === 'object' && Object.keys(cached).length > 0 && ${resumeConditions};`
      : `const shouldReuse = cached && Array.isArray(cached) && cached.length > 0 && ${resumeConditions};`,
    "",
    "if (shouldReuse) {",
    "  return [{ json: {",
    "    contractId, resumeFrom, text,",
    "    shouldReuse: true,",
    dataKey === 'summary'
      ? `    summary: cached, output: cached`
      : `    ${dataKey}: cached, output: { ${dataKey}: cached }`,
    "  } }];",
    "}",
    "",
    "return [{ json: { contractId, resumeFrom, text, shouldReuse: false } }];"
  ].join("\n");
}

// Helper: generates Save node code  
function makeSaveCode(stage, dataKey) {
  const extractFn = dataKey === 'summary' ? `
function extractData(item) {
  if (item.output && typeof item.output === 'object' && item.output.contract_name) return item.output;
  if (item.output?.output && typeof item.output.output === 'object' && item.output.output.contract_name) return item.output.output;
  if (item.contract_name) return item;
  const candidates = [item.output, item.text, item.content, item.message].filter(s => typeof s === 'string');
  for (const raw of candidates) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p.contract_name) return p;
      if (p.output?.contract_name) return p.output;
    } catch(e) {}
  }
  return {};
}` : `
function extractData(item, key) {
  if (item.output && item.output[key] && Array.isArray(item.output[key])) return item.output[key];
  if (item[key] && Array.isArray(item[key])) return item[key];
  if (item.output?.output?.[key] && Array.isArray(item.output.output[key])) return item.output.output[key];
  const candidates = [item.output, item.text, item.content, item.message].filter(s => typeof s === 'string');
  for (const raw of candidates) {
    try {
      const p = JSON.parse(raw.includes('{') ? raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1) : raw);
      if (p[key] && Array.isArray(p[key])) return p[key];
      if (p.output?.[key] && Array.isArray(p.output[key])) return p.output[key];
    } catch(e) {}
  }
  return [];
}`;

  const reuseCheck = dataKey === 'summary'
    ? `if (item.shouldReuse && item.summary && typeof item.summary === 'object') {\n  return [{ json: { contractId, resumeFrom, text, summary: item.summary, output: item.summary } }];\n}`
    : `if (item.shouldReuse && item.${dataKey}) {\n  return [{ json: { contractId, resumeFrom, text, ${dataKey}: item.${dataKey}, output: { ${dataKey}: item.${dataKey} } } }];\n}`;

  const extractCall = dataKey === 'summary'
    ? `const data = extractData(item);`
    : `const data = extractData(item, '${dataKey}');`;

  const returnStmt = dataKey === 'summary'
    ? `return [{ json: { contractId, resumeFrom, text, summary: data, output: data } }];`
    : `return [{ json: { contractId, resumeFrom, text, ${dataKey}: data, output: { ${dataKey}: data } } }];`;

  return [
    "if (!global.__contractlens_state) global.__contractlens_state = {};",
    "const item = $input.first().json;",
    "const contractId = item.contractId || global.__contractlens_state._lastContractId;",
    "const resumeFrom = item.resumeFrom || 'clause';",
    "const text = item.text || (global.__contractlens_state[contractId]?.text) || '';",
    "",
    reuseCheck,
    extractFn,
    "",
    extractCall,
    "",
    "if (contractId) {",
    "  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = { text };",
    `  global.__contractlens_state[contractId].${dataKey} = data;`,
    "  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();",
    "  global.__contractlens_state._lastContractId = contractId;",
    "}",
    "",
    returnStmt
  ].join("\n");
}

findNode('Check Clause').parameters.jsCode = makeCheckCode('clause', 'clauses', ['clause']);
findNode('Save Clause').parameters.jsCode = makeSaveCode('clause', 'clauses');

findNode('Check Risk').parameters.jsCode = makeCheckCode('risk', 'risks', ['clause', 'risk']);
findNode('Save Risk').parameters.jsCode = makeSaveCode('risk', 'risks');

findNode('Check Obligation').parameters.jsCode = makeCheckCode('obligation', 'obligations', ['clause', 'risk', 'obligation']);
findNode('Save Obligation').parameters.jsCode = makeSaveCode('obligation', 'obligations');

findNode('Check Summary').parameters.jsCode = makeCheckCode('summary', 'summary', ['summary']);
findNode('Save Summary').parameters.jsCode = makeSaveCode('summary', 'summary');

// ===== FIX 13: Assemble Analysis — read from global state =====

findNode('Assemble Analysis').parameters.jsCode = [
  "if (!global.__contractlens_state) global.__contractlens_state = {};",
  "const item = $input.first().json;",
  "const contractId = item.contractId || global.__contractlens_state._lastContractId;",
  "const state = global.__contractlens_state[contractId] || {};",
  "",
  "const clauses = state.clauses || item.clauses || [];",
  "const risks = state.risks || item.risks || [];",
  "const obligations = state.obligations || item.obligations || [];",
  "const summary = state.summary || item.summary || {};",
  "",
  "return [",
  "  { json: { contractId, output: { clauses } } },",
  "  { json: { contractId, output: { risks } } },",
  "  { json: { contractId, output: { obligations } } },",
  "  { json: { contractId, output: summary } }",
  "];"
].join("\n");

// ===== FIX 14: Remove orphaned Merge Analysis Results =====

out.nodes = out.nodes.filter(n => n.name !== 'Merge Analysis Results');
delete out.connections["Merge Analysis Results"];

// Fix Check Any Failed? connections (ensure index 0 for Calculate Risk Score)
out.connections["Check Any Failed?"] = {
  main: [
    [{ node: "Respond Error", type: "main", index: 0 }],
    [{ node: "Calculate Risk Score", type: "main", index: 0 }]
  ]
};

// ===== FIX 15: Calculate Risk Score =====

findNode('Calculate Risk Score').parameters.jsCode = [
  "const inputs = $input.all();",
  "let contractId = null;",
  "let clauseData = [], riskData = [], obligationData = [], summaryData = {};",
  "",
  "for (const inp of inputs) {",
  "  const json = inp.json;",
  "  if (json.contractId) contractId = json.contractId;",
  "  if (json.output) {",
  "    if (json.output.clauses) clauseData = json.output.clauses;",
  "    else if (json.output.risks) riskData = json.output.risks;",
  "    else if (json.output.obligations) obligationData = json.output.obligations;",
  "    else if (json.output.contract_name) summaryData = json.output;",
  "  }",
  "}",
  "",
  "// Fallback: global state",
  "if (contractId && global.__contractlens_state?.[contractId]) {",
  "  const st = global.__contractlens_state[contractId];",
  "  if (!clauseData.length && st.clauses) clauseData = st.clauses;",
  "  if (!riskData.length && st.risks) riskData = st.risks;",
  "  if (!obligationData.length && st.obligations) obligationData = st.obligations;",
  "  if (!summaryData.contract_name && st.summary) summaryData = st.summary;",
  "}",
  "",
  "const W = { payment_terms:.25, liability:.30, termination:.15, ip:.15, confidentiality:.08, data_protection:.12, service_level:.08, indemnification:.07, warranty:.05, general:.05 };",
  "const S = { critical:1.0, high:.80, medium:.50, low:.25, none:0 };",
  "",
  "function norm(t) {",
  "  const s = String(t||'').toLowerCase();",
  "  if (s.includes('liab')) return 'liability';",
  "  if (s.includes('pay')||s.includes('fee')) return 'payment_terms';",
  "  if (s.includes('term')||s.includes('renew')) return 'termination';",
  "  if (s.includes('indemn')) return 'indemnification';",
  "  if (s.includes('ip')||s.includes('intellectual')) return 'ip';",
  "  if (s.includes('data')||s.includes('security')) return 'data_protection';",
  "  if (s.includes('sla')||s.includes('service')) return 'service_level';",
  "  if (s.includes('confid')) return 'confidentiality';",
  "  if (s.includes('warran')) return 'warranty';",
  "  return 'general';",
  "}",
  "",
  "let bd = {}, tw = 0, te = 0, rf = [], rec = [];",
  "riskData.forEach(r => {",
  "  const c = norm(r.clause_type), w = W[c]||.10;",
  "  const l = String(r.risk_level||'').toLowerCase();",
  "  const s = S[l] !== undefined ? S[l] : .5;",
  "  tw += s * w; te += w; bd[c+'_risk'] = s;",
  "  if (l==='critical'||l==='high') {",
  "    if (r.risk_description) rf.push(r.risk_description);",
  "    if (r.recommendation) rec.push(r.recommendation);",
  "  }",
  "});",
  "",
  "['payment_terms','liability','termination'].forEach(ct => {",
  "  if (!clauseData.map(c=>norm(c.clause_type)).includes(ct)) {",
  "    rf.push('Missing critical clause: '+ct);",
  "    rec.push('Add '+ct+' clause');",
  "  }",
  "});",
  "",
  "let score = 0;",
  "if (riskData.length > 0) score = Math.min(1, Math.round((tw / Math.max(te, .5)) * 100) / 100);",
  "",
  "let level = 'LOW';",
  "if (score >= .85) level = 'CRITICAL';",
  "else if (score >= .70) level = 'HIGH';",
  "else if (score >= .40) level = 'MEDIUM';",
  "",
  "return [{ json: {",
  "  contractId, contract_name: summaryData.contract_name || 'Contract Agreement',",
  "  overall_risk_score: score, risk_level: level,",
  "  score_breakdown: bd, red_flags: rf, recommendations: rec,",
  "  clauses: clauseData, risks: riskData,",
  "  obligations: obligationData, summary: summaryData,",
  "  calculated_at: new Date().toISOString()",
  "} }];"
].join("\n");

// ===== FIX 16: Insert Contract — fix cross-branch references =====

const insertContract = findNode('Insert Contract');
if (insertContract?.parameters?.columns?.value?.parties) {
  insertContract.parameters.columns.value.parties = "={{ JSON.stringify({ client: ($json.summary?.parties || [])[0] || 'Unknown', vendor: ($json.summary?.parties || [])[1] || 'Unknown' }) }}";
}

// ===== FIX 17: Rename for clarity =====
out.name = "ContractLens - Final Fixed Workflow";

// ===== WRITE =====
writeFileSync('./wf_final.json', JSON.stringify(out, null, 2));

console.log('\\n=== Generated wf_final.json ===');
console.log('Fixes:');
console.log('  1. Agent prompts use ONLY {{ $json.text }}');
console.log('  2. Obligation Parser schema fixed (no extra output wrapper)');
console.log('  3. All agents have onError=continueRegularOutput');
console.log('  4. Init State has zero cross-branch references');
console.log('  5. All Check/Save nodes pass text forward via $json + global state');
console.log('  6. Removed orphaned Merge Analysis Results');
console.log('  7. Insert Contract parties expression fixed');

// Verify
let bad = 0;
for (const node of out.nodes) {
  const s = JSON.stringify(node.parameters || {});
  const m = s.match(/\$\(['"](Extract PDF Text|Init State|Contract Upload Webhook|Check Summary|Load State)['"]\)/g);
  if (m) { console.log('\\n  ❌ CROSS-REF in ' + node.name + ': ' + m.join(', ')); bad++; }
}
if (!bad) console.log('\\n  ✅ ZERO cross-branch references. Workflow is clean.');
