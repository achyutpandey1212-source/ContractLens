import fs from 'fs';

const fileContent = fs.readFileSync('./updated_wf_clean.json', 'utf8');
const wf = JSON.parse(fileContent);

let modifiedCount = 0;

for (const node of wf.nodes) {
  if (node.parameters && node.parameters.jsCode && node.parameters.jsCode.includes("require('fs')")) {
    let code = node.parameters.jsCode;

    // Replace require('fs') and fs file operations with global in-memory state dictionary
    code = `// In-memory state store without disk dependencies
if (!global.__contractlens_state) global.__contractlens_state = {};
` + code.replace(/const\s+fs\s*=\s*require\(['"]fs['"]\);?/g, '');

    // Replace mkdirSync
    code = code.replace(/try\s*\{\s*fs\.mkdirSync\([^)]+\);\s*\}\s*catch\s*\(e\)\s*\{\}/g, '');

    // Replace writeFileSync
    // fs.writeFileSync('/tmp/contractlens_state/' + contractId + '.json', JSON.stringify(state));
    code = code.replace(
      /fs\.writeFileSync\(['"]\/tmp\/contractlens_state\/['"]\s*\+\s*contractId\s*\+\s*['"]\.json['"],\s*JSON\.stringify\(([^)]+)\)\);?/g,
      'global.__contractlens_state[contractId] = JSON.parse(JSON.stringify($1));'
    );

    // Replace writeFileSync with custom path
    code = code.replace(
      /fs\.writeFileSync\(p,\s*JSON\.stringify\(([^)]+)\)\);?/g,
      'global.__contractlens_state[contractId] = JSON.parse(JSON.stringify($1));'
    );

    // Replace readFileSync
    code = code.replace(
      /fs\.readFileSync\(['"]\/tmp\/contractlens_state\/['"]\s*\+\s*contractId\s*\+\s*['"]\.json['"],\s*['"]utf8['"]\)/g,
      'JSON.stringify(global.__contractlens_state[contractId] || {})'
    );

    code = code.replace(
      /fs\.readFileSync\(p,\s*['"]utf8['"]\)/g,
      'JSON.stringify(global.__contractlens_state[contractId] || {})'
    );

    node.parameters.jsCode = code;
    modifiedCount++;
  }
}

fs.writeFileSync('./wf_production_clean.json', JSON.stringify(wf, null, 2), 'utf8');
console.log(`Successfully removed fs module from ${modifiedCount} nodes and generated wf_production_clean.json`);
