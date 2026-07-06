const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        files = files.concat(walk(filePath));
      }
    } else if (filePath.endsWith('.js')) {
      files.push(filePath);
    }
  });
  return files;
}

const jsFiles = walk(path.join(__dirname, '..'));
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('transfers_according_to_previous_line')) {
    console.log(`Found transfers_according_to_previous_line in ${file}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('transfers_according_to_previous_line') || line.includes('percent')) {
        console.log(`  L${idx+1}: ${line.trim()}`);
      }
    });
  }
});
