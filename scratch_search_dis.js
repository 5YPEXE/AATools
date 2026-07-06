const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'scratch', 'disassembled_main.txt');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const keywords = [
  'discount_type',
  'percent',
  'discountType',
  'calc',
  'transfer',
  'complementary',
  'COMPLEMENTARY'
];

keywords.forEach(keyword => {
  console.log(`=== SEARCH FOR "${keyword}" ===`);
  let count = 0;
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      count++;
      if (count <= 30) {
        console.log(`L${idx+1}: ${line.trim()}`);
      }
    }
  });
  console.log(`Found ${count} lines.\n`);
});
