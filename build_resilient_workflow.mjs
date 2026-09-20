import fs from 'fs';

const baseWf = JSON.parse(fs.readFileSync('wf_user_fixed.json', 'utf8'));

function makeResilient(wf, aiChoice) {
  const result = JSON.parse(JSON.stringify(wf));

  // 1. Agent configuration: onError continueRegularOutput + retryOnFail
  const agentStages = {
    'Clause Extraction Agent': 'clause',
    'Risk Assessment Agent': 'risk',
    'Obligation Extraction Agent': 'obligation',
    'Executive Summary Agent': 'summary'
  };

  result.nodes.forEach(n => {
    if (agentStages[n.name]) {
      n.onError = 'continueRegularOutput';
      n.retryOnFail = true;
      n.maxTries = 4;
      n.waitBetweenTries = 5000;
    }
  });

  // 2. Gemini model adjustment: use production gemini-2.5-flash to eliminate 503 spikes
  const geminiNode = result.nodes.find(n => n.name === 'Google Gemini Chat Model');
  if (geminiNode) {
    geminiNode.parameters = {
      modelName: 'models/gemini-2.5-flash',
      options: {}
    };
  }

  // 3. AI provider wiring
  if (aiChoice === 'gemini') {
    result.name = "ContractLens - Gemini Resilient Auto-Retry";
    result.connections['Google Gemini Chat Model'] = {
      ai_languageModel: [
        [
          { node: 'Clause Extraction Agent', type: 'ai_languageModel', index: 0 },
          { node: 'Risk Assessment Agent', type: 'ai_languageModel', index: 0 },
          { node: 'Obligation Extraction Agent', type: 'ai_languageModel', index: 0 },
          { node: 'Executive Summary Agent', type: 'ai_languageModel', index: 0 }
        ]
      ]
    };
    delete result.connections['Groq Chat Model'];
    delete result.connections['Groq Chat Model1'];
    delete result.connections['Groq Chat Model2'];
  } else {
    result.name = "ContractLens - Groq Llama Resilient Auto-Retry";
    result.nodes.filter(n => n.type.includes('lmChatGroq')).forEach(n => {
      n.parameters.model = 'llama-3.1-8b-instant';
      n.parameters.options = {
        ...n.parameters.options,
        temperature: 0.1
      };
    });
  }

  // 4. Update Save nodes to properly catch agent errors when continueRegularOutput triggers
  result.nodes.forEach(n => {
    if (n.name === 'Save Clause' || n.name === 'Save Risk' || n.name === 'Save Obligation' || n.name === 'Save Summary') {
      const stage = n.name.replace('Save ', '').toLowerCase();
      const agentName = stage.charAt(0).toUpperCase() + stage.slice(1) + (stage === 'summary' ? ' Agent' : (stage === 'clause' ? ' Extraction Agent' : (stage === 'risk' ? ' Assessment Agent' : ' Extraction Agent')));
      const originalCode = n.parameters.jsCode;

      // Ensure error checking is comprehensive
      n.parameters.jsCode = originalCode.replace(
        /if \(item\.error\) \{[\s\S]*?\}\s*\}\];\s*\}/,
        `if (item.error || item.failed || !item) {
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
}`
      );
    }
  });

  // 5. Check Any Failed? condition
  const checkFailedNode = result.nodes.find(n => n.name === 'Check Any Failed?');
  if (checkFailedNode) {
    checkFailedNode.parameters = {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict",
          version: 2
        },
        conditions: [
          {
            id: "id-1",
            leftValue: "={{ $json.failed }}",
            rightValue: true,
            operator: {
              type: "boolean",
              operation: "true"
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    };
  }

  // 6. Respond Error parameters (422)
  const respondErrorNode = result.nodes.find(n => n.name === 'Respond Error');
  if (respondErrorNode) {
    respondErrorNode.parameters = {
      respondWith: "json",
      responseBody: "={{ { success: false, analysisStatus: 'failed', failedAgent: $json.failedAgent || 'AI Agent', resumeFrom: $json.resumeFrom || $json.stage || 'clause', contractId: $json.contractId, error: $json.error || 'Temporary AI service issue.' } }}",
      options: {
        responseCode: 422
      }
    };
  }

  return result;
}

// Generate both resilient versions
const resilientGemini = makeResilient(baseWf, 'gemini');
fs.writeFileSync('wf_resilient_gemini.json', JSON.stringify(resilientGemini, null, 2));
console.log('Generated wf_resilient_gemini.json');

const resilientGroq = makeResilient(baseWf, 'groq');
fs.writeFileSync('wf_resilient_groq.json', JSON.stringify(resilientGroq, null, 2));
console.log('Generated wf_resilient_groq.json');
