const fs = require('fs');
const content = fs.readFileSync('server/routes/transfer.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('cardType') || line.includes('=== 2') || line.includes('card_type_id === 2') || line.includes('card_type === 2')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
