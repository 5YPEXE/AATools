const fs = require('fs');
const content = fs.readFileSync('client/src/pages/TransferScenario.jsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('return (') && idx > 200) {
    console.log(`Return starts at line ${idx + 1}: ${line.trim()}`);
  }
  if (line.includes('export default') || line.includes('module.exports')) {
    console.log(`Export at line ${idx + 1}: ${line.trim()}`);
  }
});
