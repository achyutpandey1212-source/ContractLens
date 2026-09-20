import fs from 'fs';

const wf = JSON.parse(fs.readFileSync('wf_4_gemini_models.json', 'utf8'));

console.log('Total nodes before:', wf.nodes.length);

// Robust JSON extraction helper used in all Save nodes
const extractHelperCode = `
function extractData(item, key) {
  if (!item) return null;
  if (item.output && item.output[key]) return item.output[key];
  if (item[key]) return item[key];
  if (item.output && Array.isArray(item.output)) return item.output;
  if (item.output && typeof item.output === 'object' && item.output.output && item.output.output[key]) {
    return item.output.output[key];
  }

  const rawStrings = [item.output, item.text, item.content, item.message].filter(s => typeof s === 'string');
  for (const raw of rawStrings) {
    try {
      const p = JSON.parse(raw);
      if (p[key]) return p[key];
      if (p.output && p.output[key]) return p.output[key];
      if (Array.isArray(p)) return p;
    } catch(e) {}

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

// 1. Update Check nodes to eliminate $('Extract PDF Text') and $('Init State')
const checkConfigs = [
  { name: 'Check Clause', stage: 'clause', plural: 'clauses' },
  { name: 'Check Risk', stage: 'risk', plural: 'risks' },
  { name: 'Check Obligation', stage: 'obligation', plural: 'obligations' },
  { name: 'Check Summary', stage: 'summary', plural: 'summary' }
];

checkConfigs.forEach(({ name, stage, plural }) => {
  const node = wf.nodes.find(n => n.name === name);
  if (!node) return;

  node.parameters.jsCode = `// In-memory state store without disk dependencies
if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
if (item.failed) return [{ json: item }];

const contractId = item.contractId || ('contract_' + Date.now());
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();
const text = item.text || (contractId && global.__contractlens_state?.[contractId]?.text) || '';

let saved = null;
if (contractId && global.__contractlens_state[contractId]) {
  try {
    const state = global.__contractlens_state[contractId];
    if (state.${plural}) {
      if (resumeFrom !== '${stage}') {
        saved = state.${plural};
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
      output: { ${stage === 'summary' ? '' : plural + ': '}saved },
      ${plural}: saved,
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
  console.log(`Updated ${name} to use pure forward data flow`);
});

// 2. Update Save nodes to eliminate $('Check Clause'), $('Init State')
const saveConfigs = [
  { name: 'Save Clause', stage: 'clause', agentName: 'Clause Extraction Agent', plural: 'clauses' },
  { name: 'Save Risk', stage: 'risk', agentName: 'Risk Assessment Agent', plural: 'risks' },
  { name: 'Save Obligation', stage: 'obligation', agentName: 'Obligation Extraction Agent', plural: 'obligations' },
  { name: 'Save Summary', stage: 'summary', agentName: 'Executive Summary Agent', plural: 'summary' }
];

saveConfigs.forEach(({ name, stage, agentName, plural }) => {
  const node = wf.nodes.find(n => n.name === name);
  if (!node) return;

  node.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
const contractId = item.contractId || ('contract_' + Date.now());
const resumeFrom = item.resumeFrom || 'clause';
const text = item.text || (contractId && global.__contractlens_state?.[contractId]?.text) || '';

if (item.failed) return [{ json: item }];
if (item.error || !item) {
  let errText = (item?.error && (item.error.message || item.error.description)) || item?.message || String(item?.error || 'AI stage execution error');
  if (errText.includes('503') || errText.includes('high demand')) {
    errText = 'The AI model is experiencing temporary high demand. Click Try Again to retry.';
  }
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: '${agentName}',
      stage: '${stage}',
      contractId,
      resumeFrom: '${stage}',
      error: errText
    }
  }];
}

${extractHelperCode}

let data;
if ('${stage}' === 'summary') {
  data = (item.output && typeof item.output === 'object' && item.output.contract_name) ? item.output : extractData(item, 'summary');
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    if (item.contract_name) data = item;
    else if (item.output && typeof item.output === 'object') data = item.output;
    else data = {};
  }
} else {
  data = extractData(item, '${plural}') ${stage === 'obligation' ? "|| extractData(item, 'cities')" : ""};
  data = Array.isArray(data) ? data : [];
}

if (contractId) {
  if (!global.__contractlens_state[contractId]) global.__contractlens_state[contractId] = {};
  global.__contractlens_state[contractId].${plural} = data;
  if (text) global.__contractlens_state[contractId].text = text;
  global.__contractlens_state[contractId].updatedAt = new Date().toISOString();
}

return [{
  json: {
    contractId,
    resumeFrom,
    text,
    ${plural}: data,
    output: ${stage === 'summary' ? "data" : `{ ${plural}: data }`}
  }
}];
`;
  console.log(`Updated ${name} to use pure forward data flow`);
});

// 3. Update all 4 AI Agent nodes prompt text to use {{ $json.text }}
const agentPromptPrefixes = {
  'Clause Extraction Agent': 'Analyze the following contract text and extract all clauses according to the required schema:',
  'Risk Assessment Agent': 'Analyze the following contract text and evaluate all legal, operational, and financial risks according to the required schema:',
  'Obligation Extraction Agent': 'Extract all obligations, duties, and commitments from the following contract text according to the required schema:',
  'Executive Summary Agent': 'Generate a structured executive summary of the following contract text according to the required schema:'
};

wf.nodes.forEach(n => {
  if (agentPromptPrefixes[n.name]) {
    n.parameters.text = `=${agentPromptPrefixes[n.name]}\n\n--- CONTRACT TEXT ---\n{{ $json.text }}`;
    console.log(`Cleaned prompt text expression in ${n.name}`);
  }
});

// 4. Update Assemble Analysis to eliminate $('Check Summary')
const assembleNode = wf.nodes.find(n => n.name === 'Assemble Analysis');
if (assembleNode) {
  assembleNode.parameters.jsCode = `if (!global.__contractlens_state) global.__contractlens_state = {};
const item = $json;
const contractId = item.contractId || ('contract_' + Date.now());

if (item.failed) {
  return [{
    json: {
      success: false,
      failed: true,
      failedAgent: item.failedAgent || 'AI Agent',
      stage: item.stage || 'clause',
      contractId: contractId,
      error: item.error || 'Pipeline stage failed'
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
  console.log('Updated Assemble Analysis to use pure forward data flow');
}

// 5. Update Calculate Risk Score to eliminate $('Contract Upload Webhook')
const calcNode = wf.nodes.find(n => n.name === 'Calculate Risk Score');
if (calcNode) {
  calcNode.parameters.jsCode = calcNode.parameters.jsCode.replace(
    /const contractName = [\s\S]*?'Contract Agreement';/,
    `const contractName = summaryData.contract_name || 'Contract Agreement';`
  );
  console.log("Removed Contract Upload Webhook from Calculate Risk Score");
}

// 6. Update Respond to Webhook to use {{ $json }} directly
const respNode = wf.nodes.find(n => n.name === 'Respond to Webhook');
if (respNode) {
  respNode.parameters.responseBody = '={{ $json }}';
  console.log('Updated Respond to Webhook responseBody to {{ $json }}');
}

// Save the resulting workflow
fs.writeFileSync('wf_4_gemini_models.json', JSON.stringify(wf, null, 2));
console.log('Done! Updated wf_4_gemini_models.json');
