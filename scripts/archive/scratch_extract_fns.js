const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'scratch', 'disassembled_main.txt');
const content = fs.readFileSync(filePath, 'utf8');

const regex = /Disassembly of <code object (calculate_transfer|compute_transfer|compute_complementary_transfer|compute_complementary_transfer_for_card)[\s\S]*?(?=Disassembly of <code object|$)/g;

let match;
while ((match = regex.exec(content)) !== null) {
  const name = match[1];
  const body = match[0];
  const lines = body.split('\n');
  console.log(`=== FUNCTION: ${name} (${lines.length} lines) ===`);
  // Save to a file for easy viewing
  fs.writeFileSync(path.join(__dirname, 'scratch', `${name}.txt`), body);
}
console.log('Saved disassembled functions to scratch/');
