import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('wf_fixed5.json', 'utf8'));
const nodes = wf[0].nodes;

// Update Check Summary to reuse valid summary if available
const cs = nodes.find(n => n.name === 'Check Summary');
cs.parameters.jsCode = `const item = $json;
if (item.failed) return [{ json: item }];

const fs = require('fs');

const contractId = item.contractId;
const resumeFrom = (item.resumeFrom || 'clause').toLowerCase();

let text = item.text || '';
let saved = null;
if (contractId) {
  try {
    const raw = fs.readFileSync('/tmp/contractlens_state/' + contractId + '.json', 'utf8');
    const state = JSON.parse(raw);
    if (state.text) text = state.text;
    // If state already has a valid summary object with contents, reuse it to prevent rate limit stalls
    if (state.summary && (state.summary.contract_name || state.summary.overall_assessment || state.summary.parties)) {
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

// Ensure Respond to Webhook uses expression to return Calculate Risk Score directly
const r = nodes.find(n => n.name === 'Respond to Webhook');
r.parameters.respondWith = 'json';
r.parameters.responseBody = "={{ $('Calculate Risk Score').first().json }}";

writeFileSync('wf_fixed6.json', JSON.stringify(wf, null, 2));
console.log('Successfully written wf_fixed6.json');
