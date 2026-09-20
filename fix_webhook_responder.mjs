import { readFileSync, writeFileSync } from 'fs';

const wf = JSON.parse(readFileSync('wf_fixed3.json', 'utf8'));

// 1. Remove Respond to Webhook1 node
wf[0].nodes = wf[0].nodes.filter(n => n.name !== 'Respond to Webhook1');

// 2. Remove outgoing connections from Send Email Alert and Send Slack Alert to Respond to Webhook1
const edges = wf[0].connections;
if (edges['Send Email Alert']) {
  delete edges['Send Email Alert'];
}
if (edges['Send Slack Alert']) {
  delete edges['Send Slack Alert'];
}

// 3. Verify Check Risk Level has Respond to Webhook connected properly
console.log('Check Risk Level branch 0 (>= 0.7):', JSON.stringify(edges['Check Risk Level'].main[0]));
console.log('Check Risk Level branch 1 (< 0.7):', JSON.stringify(edges['Check Risk Level'].main[1]));

writeFileSync('wf_fixed4.json', JSON.stringify(wf, null, 2));
console.log('Successfully written wf_fixed4.json');
