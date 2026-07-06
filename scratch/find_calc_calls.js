const fs = require('fs');
const lines = fs.readFileSync('server/routes/transfer.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('calcTransferFare')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
