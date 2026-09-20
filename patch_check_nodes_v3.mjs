import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('wf_fixed2.json', 'utf8'));
const nodes = wf[0].nodes;

// The definitive fix: in Check Summary, ALWAYS load text from state file explicitly.
// Do NOT rely on item.text propagating through the chain - just always read it.
const checkSummaryNode = nodes.find(x => x.name === 'Check Summary');
checkSummaryNode.parameters.jsCode = `const item = $json;
if (item.failed) return [{ json: item }];

const fs = require('fs');

const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();

// ALWAYS load text directly from state file - never rely on propagation
let text = item.text || '';
let saved = null;
if (contractId) {
  try {
    const raw = fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8');
    const state = JSON.parse(raw);
    // Always prefer state file text (authoritative source)
    if (state.text) text = state.text;
    if (state.summary && resumeFrom !== 'summary' && resumeFrom !== 'obligation' && resumeFrom !== 'risk' && resumeFrom !== 'clause') {
      saved = state.summary;
    }
  } catch (e) {}
}

if (saved) {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      text,
      output: saved,
      summary: saved,
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

// Apply same unconditional fix to Check Clause, Check Risk, Check Obligation too
// so that text always flows robustly no matter which stage is being resumed
const checkClauseNode = nodes.find(x => x.name === 'Check Clause');
checkClauseNode.parameters.jsCode = `const item = $json;
const fs = require('fs');

const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();

// Always load text from state file
let text = item.text || '';
let saved = null;
if (contractId) {
  try {
    const raw = fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8');
    const state = JSON.parse(raw);
    if (state.text) text = state.text;
    if (state.clauses && resumeFrom !== 'clause') {
      saved = state.clauses;
    }
  } catch (e) {}
}

if (saved) {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      text,
      output: { clauses: saved },
      clauses: saved,
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

const checkRiskNode = nodes.find(x => x.name === 'Check Risk');
checkRiskNode.parameters.jsCode = `const item = $json;
if (item.failed) return [{ json: item }];

const fs = require('fs');

const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();

// Always load text from state file
let text = item.text || '';
let saved = null;
if (contractId) {
  try {
    const raw = fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8');
    const state = JSON.parse(raw);
    if (state.text) text = state.text;
    const order = ['clause', 'risk', 'obligation', 'summary'];
    if (state.risks && order.indexOf(resumeFrom) > order.indexOf('risk')) {
      saved = state.risks;
    }
  } catch (e) {}
}

if (saved) {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      text,
      output: { risks: saved },
      risks: saved,
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

const checkObligationNode = nodes.find(x => x.name === 'Check Obligation');
checkObligationNode.parameters.jsCode = `const item = $json;
if (item.failed) return [{ json: item }];

const fs = require('fs');

const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();

// Always load text from state file
let text = item.text || '';
let saved = null;
if (contractId) {
  try {
    const raw = fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8');
    const state = JSON.parse(raw);
    if (state.text) text = state.text;
    const order = ['clause', 'risk', 'obligation', 'summary'];
    if (state.obligations && order.indexOf(resumeFrom) > order.indexOf('obligation')) {
      saved = state.obligations;
    }
  } catch (e) {}
}

if (saved) {
  return [{
    json: {
      ...item,
      contractId,
      resumeFrom,
      text,
      output: { obligations: saved },
      obligations: saved,
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

writeFileSync('wf_fixed3.json', JSON.stringify(wf, null, 2));
console.log('Written wf_fixed3.json');
console.log('All Check nodes now ALWAYS load text from state file unconditionally');
