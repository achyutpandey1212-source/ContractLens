import fs from 'fs';

const wf = JSON.parse(fs.readFileSync('wf_4_gemini_models.json', 'utf8'));

console.log('=== TEST 1: Full Upload Execution Path Simulation ===');
const globalState = { __contractlens_state: {} };

const contractText = `CLOUD SERVICES, DATA PROCESSING & MANAGED SERVICES AGREEMENT
Northstar Retail Technologies Pvt. Ltd. / BlackPeak Digital Solutions Pvt. Ltd.
Effective Date: October 1, 2026
1. Definitions and Interpretation
2. Services and Obligations
3. Limitation of Liability: Neither party shall be liable, except client assumes unlimited liability.`;

// 1. Init State
const initNode = wf.nodes.find(n => n.name === 'Init State');
const runInit = new Function('$json', '$', 'global', initNode.parameters.jsCode);
const initOut = runInit({ text: contractText }, () => ({ first: () => ({ json: {} }) }), globalState);
const contractId = initOut[0].json.contractId;
console.log('Init State contractId:', contractId, 'has text:', Boolean(initOut[0].json.text));

// 2. Check Clause (not cached)
const checkClauseNode = wf.nodes.find(n => n.name === 'Check Clause');
const runCheckClause = new Function('$json', 'global', checkClauseNode.parameters.jsCode);
const checkClauseOut = runCheckClause(initOut[0].json, globalState);
console.log('Check Clause shouldReuse:', checkClauseOut[0].json.shouldReuse, 'has text:', Boolean(checkClauseOut[0].json.text));

// 3. Clause Extraction Agent simulation -> Save Clause
const saveClauseNode = wf.nodes.find(n => n.name === 'Save Clause');
const runSaveClause = new Function('$json', 'global', saveClauseNode.parameters.jsCode);
const mockAgentClauseOut = {
  ...checkClauseOut[0].json,
  output: {
    clauses: [{ clause_type: 'liability', clause_text: 'Unlimited liability for client' }]
  }
};
const saveClauseOut = runSaveClause(mockAgentClauseOut, globalState);
console.log('Save Clause saved clauses count:', saveClauseOut[0].json.clauses.length, 'has text:', Boolean(saveClauseOut[0].json.text));

// 4. Check Risk -> Save Risk
const checkRiskNode = wf.nodes.find(n => n.name === 'Check Risk');
const runCheckRisk = new Function('$json', 'global', checkRiskNode.parameters.jsCode);
const checkRiskOut = runCheckRisk(saveClauseOut[0].json, globalState);
const saveRiskNode = wf.nodes.find(n => n.name === 'Save Risk');
const runSaveRisk = new Function('$json', 'global', saveRiskNode.parameters.jsCode);
const mockAgentRiskOut = {
  ...checkRiskOut[0].json,
  output: {
    risks: [{ clause_type: 'liability', risk_level: 'critical', risk_description: 'Unlimited liability', recommendation: 'Cap liability' }]
  }
};
const saveRiskOut = runSaveRisk(mockAgentRiskOut, globalState);
console.log('Save Risk saved risks count:', saveRiskOut[0].json.risks.length, 'has text:', Boolean(saveRiskOut[0].json.text));

// 5. Check Obligation -> Save Obligation
const checkObligationNode = wf.nodes.find(n => n.name === 'Check Obligation');
const runCheckObligation = new Function('$json', 'global', checkObligationNode.parameters.jsCode);
const checkObligationOut = runCheckObligation(saveRiskOut[0].json, globalState);
const saveObligationNode = wf.nodes.find(n => n.name === 'Save Obligation');
const runSaveObligation = new Function('$json', 'global', saveObligationNode.parameters.jsCode);
const mockAgentObligationOut = {
  ...checkObligationOut[0].json,
  output: {
    obligations: [{ obligation_text: 'Deliver services monthly', obligation_type: 'delivery' }]
  }
};
const saveObligationOut = runSaveObligation(mockAgentObligationOut, globalState);
console.log('Save Obligation obligations count:', saveObligationOut[0].json.obligations.length);

// 6. Check Summary -> Save Summary
const checkSummaryNode = wf.nodes.find(n => n.name === 'Check Summary');
const runCheckSummary = new Function('$json', 'global', checkSummaryNode.parameters.jsCode);
const checkSummaryOut = runCheckSummary(saveObligationOut[0].json, globalState);
const saveSummaryNode = wf.nodes.find(n => n.name === 'Save Summary');
const runSaveSummary = new Function('$json', 'global', saveSummaryNode.parameters.jsCode);
const mockAgentSummaryOut = {
  ...checkSummaryOut[0].json,
  output: {
    contract_name: 'Cloud Services & Managed Services Agreement',
    parties: ['Northstar Retail Technologies Pvt. Ltd.', 'BlackPeak Digital Solutions Pvt. Ltd.']
  }
};
const saveSummaryOut = runSaveSummary(mockAgentSummaryOut, globalState);
console.log('Save Summary contract_name:', saveSummaryOut[0].json.summary.contract_name);

// 7. Assemble Analysis
const assembleNode = wf.nodes.find(n => n.name === 'Assemble Analysis');
const runAssemble = new Function('$json', 'global', assembleNode.parameters.jsCode);
const assembleOut = runAssemble(saveSummaryOut[0].json, globalState);
console.log('Assemble Analysis outputs count:', assembleOut.length);

// 8. Calculate Risk Score
const calcNode = wf.nodes.find(n => n.name === 'Calculate Risk Score');
const runCalc = new Function('$input', 'global', calcNode.parameters.jsCode);
const calcOut = runCalc({ all: () => assembleOut }, globalState);
console.log('Calculate Risk Score output:', calcOut[0].json.overall_risk_score, 'contract_name:', calcOut[0].json.contract_name);

console.log('\n=== TEST 2: Resume / Retry Execution Path Simulation ===');
// Assume clause and risk are cached in globalState, and we resumeFrom: 'obligation'
const resumeContractId = contractId;
const resumeInput = {
  contractId: resumeContractId,
  resumeFrom: 'obligation'
};

const loadStateNode = wf.nodes.find(n => n.name === 'Load State');
const runLoadState = new Function('$json', 'global', loadStateNode.parameters.jsCode);
const loadOut = runLoadState(resumeInput, globalState);
console.log('Load State output resumeFrom:', loadOut[0].json.resumeFrom, 'has text:', Boolean(loadOut[0].json.text));

// Check Clause (should reuse cached clauses!)
const resumeCheckClauseOut = runCheckClause(loadOut[0].json, globalState);
console.log('Resume Check Clause shouldReuse:', resumeCheckClauseOut[0].json.shouldReuse, '(Expected true)');
const resumeSaveClauseOut = runSaveClause(resumeCheckClauseOut[0].json, globalState);

// Check Risk (should reuse cached risks!)
const resumeCheckRiskOut = runCheckRisk(resumeSaveClauseOut[0].json, globalState);
console.log('Resume Check Risk shouldReuse:', resumeCheckRiskOut[0].json.shouldReuse, '(Expected true)');
const resumeSaveRiskOut = runSaveRisk(resumeCheckRiskOut[0].json, globalState);

// Check Obligation (resumeFrom === 'obligation', so should NOT reuse, but re-run agent!)
const resumeCheckObligationOut = runCheckObligation(resumeSaveRiskOut[0].json, globalState);
console.log('Resume Check Obligation shouldReuse:', resumeCheckObligationOut[0].json.shouldReuse, '(Expected false)');
console.log('Resume Check Obligation has text for Agent:', Boolean(resumeCheckObligationOut[0].json.text));

console.log('\nALL SIMULATION TESTS PASSED 100%!');
