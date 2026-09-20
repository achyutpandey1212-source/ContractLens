import fs from 'fs';

const wf = JSON.parse(fs.readFileSync('wf_user_fixed.json', 'utf8'));

console.log('Nodes count:', wf.nodes.length);
console.log('\nAI Model Nodes:');
wf.nodes.filter(n => n.type.includes('lmChat')).forEach(n => {
  console.log(' -', n.name, n.parameters, n.credentials);
});

console.log('\nAI Agents:');
wf.nodes.filter(n => n.type.includes('agent')).forEach(n => {
  console.log(' -', n.name, 'hasOutputParser:', n.parameters.hasOutputParser);
});

let fsFound = false;
wf.nodes.forEach(n => {
  if (n.parameters?.jsCode && n.parameters.jsCode.includes("require('fs')")) {
    console.error('ERROR: require(fs) found in', n.name);
    fsFound = true;
  }
});
if (!fsFound) console.log('PASS: No fs module dependencies found.');

// Test extractData simulation
const saveClause = wf.nodes.find(n => n.name === 'Save Clause');
console.log('Save Clause has extractData:', saveClause.parameters.jsCode.includes('extractData'));
