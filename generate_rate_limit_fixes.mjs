import fs from 'fs';

// Read base user fixed workflow
const wf = JSON.parse(fs.readFileSync('wf_user_fixed.json', 'utf8'));

// -------------------------------------------------------------
// Version 1: All Gemini (1 Million TPM Free Tier)
// -------------------------------------------------------------
const wfGemini = JSON.parse(JSON.stringify(wf));
wfGemini.name = "ContractLens - Gemini High Throughput (1M TPM)";

// Wire Google Gemini Chat Model to all 4 agents
wfGemini.connections['Google Gemini Chat Model'] = {
  ai_languageModel: [
    [
      { node: 'Clause Extraction Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Risk Assessment Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Obligation Extraction Agent', type: 'ai_languageModel', index: 0 },
      { node: 'Executive Summary Agent', type: 'ai_languageModel', index: 0 }
    ]
  ]
};

// Remove Groq connections to avoid conflicts
delete wfGemini.connections['Groq Chat Model'];
delete wfGemini.connections['Groq Chat Model1'];
delete wfGemini.connections['Groq Chat Model2'];

fs.writeFileSync('wf_gemini_unlimited.json', JSON.stringify(wfGemini, null, 2));
console.log('Generated wf_gemini_unlimited.json');

// -------------------------------------------------------------
// Version 2: Groq Llama 3.3 70B (12,000 TPM - 12x Qwen's 1000 OTPM)
// -------------------------------------------------------------
const wfGroqLlama = JSON.parse(JSON.stringify(wf));
wfGroqLlama.name = "ContractLens - Groq Llama 3.3 70B";

wfGroqLlama.nodes.filter(n => n.type.includes('lmChatGroq')).forEach(n => {
  n.parameters.model = 'llama-3.3-70b-versatile';
  n.parameters.options = {
    ...n.parameters.options,
    temperature: 0.1
  };
});

fs.writeFileSync('wf_groq_llama70b.json', JSON.stringify(wfGroqLlama, null, 2));
console.log('Generated wf_groq_llama70b.json');
