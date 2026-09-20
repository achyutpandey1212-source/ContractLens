import fs from 'fs';

// Read the user provided workflow
const wf = JSON.parse(fs.readFileSync('wf_user_provided.json', 'utf8'));

console.log('Nodes count in user workflow:', wf.nodes.length);

// 1. Fix Obligation Parser schema to remove conflicting "output" wrapper
const obParser = wf.nodes.find(n => n.name === 'Obligation Parser');
if (obParser) {
  obParser.parameters.jsonSchemaExample = JSON.stringify({
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
  console.log('Fixed Obligation Parser schema example');
}

// 2. Set temperature: 0.1 on all Groq models for deterministic structured output
wf.nodes.filter(n => n.type.includes('lmChatGroq')).forEach(n => {
  n.parameters.options = {
    ...n.parameters.options,
    temperature: 0.1
  };
  console.log('Set temperature 0.1 on', n.name);
});

// 3. Fix Clause Extraction Agent
const clauseAgent = wf.nodes.find(n => n.name === 'Clause Extraction Agent');
if (clauseAgent) {
  clauseAgent.parameters.text = '=Analyze the following contract text and extract all clauses according to the required schema:\n\n--- CONTRACT TEXT ---\n{{ $json.text || $("Init State").first()?.json?.text || $("Extract PDF Text").first()?.json?.text || "" }}';
  clauseAgent.parameters.options.systemMessage = `You are a legal contract analysis expert specializing in clause extraction.

Your task:
1. Identify and extract ALL contract clauses from the provided contract text.
2. For each clause, assign clause_type to one of: "payment_terms", "termination", "liability", "ip", "confidentiality", "warranty", or "indemnification".
3. Extract the exact clause_text from the document.
4. Assign an ai_confidence score between 0.0 and 1.0.

Format your output as a valid JSON object matching the required schema with a top-level "clauses" array.
Always provide standard JSON arguments directly. Never output XML tags such as <tool_call>, </tool_call>, or <function>. Never include markdown code fences for function calls.`;
  console.log('Updated Clause Extraction Agent prompt');
}

// 4. Fix Risk Assessment Agent
const riskAgent = wf.nodes.find(n => n.name === 'Risk Assessment Agent');
if (riskAgent) {
  riskAgent.parameters.text = '=Analyze the following contract text and evaluate all legal, operational, and financial risks according to the required schema:\n\n--- CONTRACT TEXT ---\n{{ $json.text || $("Init State").first()?.json?.text || $("Extract PDF Text").first()?.json?.text || "" }}';
  riskAgent.parameters.options.systemMessage = `You are a legal risk assessment expert specializing in contract analysis.

Your task:
1. Analyze each clause and provision in the provided contract text for potential risks.
2. For each risk, specify:
   - clause_type: clause category (e.g. "payment_terms", "liability", "termination", "ip", "confidentiality", "warranty", "indemnification", "data_protection", "service_level")
   - risk_level: "critical", "high", "medium", or "low"
   - risk_description: concise explanation of the risk factor
   - recommendation: concrete legal or negotiation recommendation
   - ai_confidence: confidence score between 0.0 and 1.0
3. Identify critical risk factors such as unlimited liability, unilateral indemnity, harsh penalties, lock-in periods, or broad IP assignments.

Format your output as a valid JSON object matching the required schema with a top-level "risks" array.
Always provide standard JSON arguments directly. Never output XML tags such as <tool_call>, </tool_call>, or <function>. Never include markdown code fences for function calls.`;
  console.log('Updated Risk Assessment Agent prompt');
}

// 5. Fix Obligation Extraction Agent
const obAgent = wf.nodes.find(n => n.name === 'Obligation Extraction Agent');
if (obAgent) {
  obAgent.parameters.text = '=Extract all obligations, duties, and commitments from the following contract text according to the required schema:\n\n--- CONTRACT TEXT ---\n{{ $json.text || $("Init State").first()?.json?.text || $("Extract PDF Text").first()?.json?.text || "" }}';
  obAgent.parameters.options.systemMessage = `You are a legal obligation tracking expert.

Your task:
1. Extract ALL obligations, duties, commitments, and deadlines from the contract text (look for "must", "shall", "required", "obligated", "agrees to").
2. For each obligation, specify:
   - obligation_text: exact or summary description of the obligation
   - obligation_type: one of "payment", "delivery", "reporting", or "compliance"
   - due_date: deadline in YYYY-MM-DD format if mentioned, or null
   - responsible_party: name or role of responsible party (e.g. "Client", "Vendor", or party name), or null
   - status: "pending"

Format your output as a valid JSON object matching the required schema with a top-level "obligations" array.
Always provide standard JSON arguments directly. Never output XML tags such as <tool_call>, </tool_call>, or <function>. Never include markdown code fences for function calls.`;
  console.log('Updated Obligation Extraction Agent prompt');
}

// 6. Fix Executive Summary Agent
const summaryAgent = wf.nodes.find(n => n.name === 'Executive Summary Agent');
if (summaryAgent) {
  summaryAgent.parameters.text = '=Generate a structured executive summary of the following contract text according to the required schema:\n\n--- CONTRACT TEXT ---\n{{ $json.text || $("Init State").first()?.json?.text || $("Extract PDF Text").first()?.json?.text || "" }}';
  summaryAgent.parameters.options.systemMessage = `You are a legal contract summarization expert.

Your task:
1. Generate a comprehensive, concise executive summary of the contract.
2. Identify:
   - contract_name: title or formal name of the agreement
   - parties: array of contracting party names (e.g. ["Client Name", "Vendor Name"])
   - contract_type: category of agreement (e.g. "vendor", "saas", "services", "nda", "employment")
   - execution_date: effective or execution date (YYYY-MM-DD or string)
   - expiry_date: termination or expiry date (YYYY-MM-DD or string)
   - value: contract monetary value as a number, or null
   - key_terms: summary of key commercial and operational terms
   - major_obligations: summary of main responsibilities of each party
   - notable_provisions: key termination, liability, or unusual clauses
   - overall_assessment: executive assessment of the contract

Format your output as a valid JSON object matching the required schema.
Always provide standard JSON arguments directly. Never output XML tags or markdown code fences for function calls.`;
  console.log('Updated Executive Summary Agent prompt');
}

// 7. Update Save nodes with bulletproof extraction helper
const robustExtractCode = `
function extractData(item, key) {
  if (!item) return null;
  // 1. Direct object properties
  if (item.output && item.output[key]) return item.output[key];
  if (item[key]) return item[key];
  if (item.output && Array.isArray(item.output)) return item.output;

  // 2. Nested output object (e.g. item.output.output[key])
  if (item.output && typeof item.output === 'object' && item.output.output && item.output.output[key]) {
    return item.output.output[key];
  }

  // 3. String extraction from item.output or item.text or item.content
  const rawStrings = [item.output, item.text, item.content, item.message].filter(s => typeof s === 'string');
  for (const raw of rawStrings) {
    try {
      const p = JSON.parse(raw);
      if (p[key]) return p[key];
      if (p.output && p.output[key]) return p.output[key];
      if (Array.isArray(p)) return p;
    } catch(e) {}

    // Find first { and matching last }
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sub = raw.substring(firstBrace, lastBrace + 1);
        const p = JSON.parse(sub);
        if (p[key]) return p[key];
        if (p.output && p.output[key]) return p.output[key];
      } catch(e) {}
    }

    // Find first [ and matching last ]
    const firstBracket = raw.indexOf('[');
    const lastBracket = raw.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        const sub = raw.substring(firstBracket, lastBracket + 1);
        const p = JSON.parse(sub);
        if (Array.isArray(p)) return p;
      } catch(e) {}
    }
  }
  return null;
}
`;

// Save Clause
const saveClause = wf.nodes.find(n => n.name === 'Save Clause');
if (saveClause) {
  saveClause.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
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

${robustExtractCode}

let data = extractData(item, 'clauses');
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
  console.log('Updated Save Clause code');
}

// Save Risk
const saveRisk = wf.nodes.find(n => n.name === 'Save Risk');
if (saveRisk) {
  saveRisk.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
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

${robustExtractCode}

let data = extractData(item, 'risks');
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
  console.log('Updated Save Risk code');
}

// Save Obligation
const saveObligation = wf.nodes.find(n => n.name === 'Save Obligation');
if (saveObligation) {
  saveObligation.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
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

${robustExtractCode}

let data = extractData(item, 'obligations') || extractData(item, 'cities');
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
  console.log('Updated Save Obligation code');
}

// Save Summary
const saveSummary = wf.nodes.find(n => n.name === 'Save Summary');
if (saveSummary) {
  saveSummary.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
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

${robustExtractCode}

let data = item.output || item.summary;
if (!data || typeof data !== 'object') {
  data = extractData(item, 'summary') || {};
}
if ((!data || Object.keys(data).length === 0) && item.contract_name) {
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
  console.log('Updated Save Summary code');
}

// Write the fixed workflow
fs.writeFileSync('wf_user_fixed.json', JSON.stringify(wf, null, 2));
console.log('Successfully generated wf_user_fixed.json');
