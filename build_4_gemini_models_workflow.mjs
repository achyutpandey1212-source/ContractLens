import fs from 'fs';

// Read the base resilient workflow
const wf = JSON.parse(fs.readFileSync('wf_resilient_gemini.json', 'utf8'));

wf.name = "ContractLens - 4 Dedicated Gemini Models";

// Remove old model nodes (both Groq and the single Gemini)
const oldModelNames = [
  'Google Gemini Chat Model',
  'Groq Chat Model',
  'Groq Chat Model1',
  'Groq Chat Model2'
];
wf.nodes = wf.nodes.filter(n => !oldModelNames.includes(n.name));

// Clean old connections from these models
oldModelNames.forEach(name => {
  delete wf.connections[name];
});

// Create 4 distinct Gemini Chat Model nodes
const geminiModels = [
  {
    name: 'Gemini Clause Model',
    agent: 'Clause Extraction Agent',
    position: [-220, 3024],
    credential: {
      id: 'oo1j2cDWPGzVLmk3',
      name: 'Google Gemini(PaLM) Api account'
    }
  },
  {
    name: 'Gemini Risk Model',
    agent: 'Risk Assessment Agent',
    position: [-220, 3568],
    credential: {
      id: 'DVyYY3dMnvv6TFEi',
      name: 'Google Gemini(PaLM) Api account 3'
    }
  },
  {
    name: 'Gemini Obligation Model',
    agent: 'Obligation Extraction Agent',
    position: [-220, 4000],
    credential: {
      id: 'ESSTvHaMwwXiFTOi',
      name: 'Google Gemini(PaLM) Api account 4'
    }
  },
  {
    name: 'Gemini Summary Model',
    agent: 'Executive Summary Agent',
    position: [-220, 4400],
    credential: {
      id: 'DVyYY3dMnvv6TFEi',
      name: 'Google Gemini(PaLM) Api account 2'
    }
  }
];

geminiModels.forEach(m => {
  // Add node
  wf.nodes.push({
    parameters: {
      modelName: 'models/gemini-2.5-flash',
      options: {}
    },
    type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
    typeVersion: 1.1,
    position: m.position,
    id: `gemini-model-${m.agent.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: m.name,
    credentials: {
      googlePalmApi: m.credential
    }
  });

  // Wire to its dedicated agent
  wf.connections[m.name] = {
    ai_languageModel: [
      [
        {
          node: m.agent,
          type: 'ai_languageModel',
          index: 0
        }
      ]
    ]
  };
});

// Ensure all 4 agents have resilient error handling and automatic retry
wf.nodes.forEach(n => {
  if (geminiModels.some(m => m.agent === n.name)) {
    n.onError = 'continueRegularOutput';
    n.retryOnFail = true;
    n.maxTries = 4;
    n.waitBetweenTries = 5000;
  }
});

// Write to final file
fs.writeFileSync('wf_4_gemini_models.json', JSON.stringify(wf, null, 2));
console.log('Successfully generated wf_4_gemini_models.json with', wf.nodes.length, 'nodes');
