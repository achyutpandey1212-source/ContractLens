#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('./wf_final.json', 'utf8'));

function updateSaveNode(nodeName, checkNodeName) {
  const node = wf.nodes.find(n => n.name === nodeName);
  let code = node.parameters.jsCode;
  
  // Look for where contractId and text are recovered
  const oldCodeStart = "const ctx = global.__contractlens_current || {};";
  const oldCodeEnd = "const text = item.text || ctx.text || (global.__contractlens_state[contractId]?.text) || '';";
  
  const replacement = `let checkData = {};
try { checkData = $('${checkNodeName}').first().json || {}; } catch(e) {}
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || checkData.contractId || ctx.contractId;
const resumeFrom = item.resumeFrom || checkData.resumeFrom || ctx.resumeFrom || 'clause';
const text = item.text || checkData.text || ctx.text || (contractId && global.__contractlens_state?.[contractId]?.text) || '';`;

  if (code.includes(oldCodeStart)) {
    const startIndex = code.indexOf(oldCodeStart);
    const endIndex = code.indexOf(oldCodeEnd) + oldCodeEnd.length;
    node.parameters.jsCode = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    console.log(`✅ Updated ${nodeName} with direct $('${checkNodeName}') reference`);
  } else {
    console.log(`⚠️ Could not find target pattern in ${nodeName}`);
  }
}

updateSaveNode('Save Clause', 'Check Clause');
updateSaveNode('Save Risk', 'Check Risk');
updateSaveNode('Save Obligation', 'Check Obligation');
updateSaveNode('Save Summary', 'Check Summary');

// Also update Assemble Analysis to check $('Check Summary') as well
const assembleNode = wf.nodes.find(n => n.name === 'Assemble Analysis');
if (assembleNode) {
  let aCode = assembleNode.parameters.jsCode;
  const oldTarget = "const ctx = global.__contractlens_current || {};";
  const newTarget = `let checkData = {};
try { checkData = $('Check Summary').first().json || {}; } catch(e) {}
const ctx = global.__contractlens_current || {};
const contractId = item.contractId || checkData.contractId || ctx.contractId;`;
  if (aCode.includes(oldTarget)) {
    aCode = aCode.replace("const ctx = global.__contractlens_current || {};\nconst contractId = item.contractId || ctx.contractId;", newTarget);
    assembleNode.parameters.jsCode = aCode;
    console.log("✅ Updated Assemble Analysis with $('Check Summary') fallback");
  }
}

writeFileSync('./wf_final.json', JSON.stringify(wf, null, 2));
writeFileSync('./wf_4_gemini_models.json', JSON.stringify(wf, null, 2));
console.log('Saved both wf_final.json and wf_4_gemini_models.json!');
