const fs = require('fs');
const content = fs.readFileSync('client/src/pages/TransferScenario.jsx', 'utf8');
const lines = content.split('\n');
let found = false;
lines.forEach((line, idx) => {
  if (line.includes('const TransferTypeBadge') || line.includes('function TransferTypeBadge')) {
    found = true;
  }
  if (found) {
    console.log(`${idx + 1}: ${line}`);
    if (line.includes('};') || line.includes('}')) {
      found = false;
    }
  }
});
