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
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      files.push(filePath);
    }
  });
  return files;
}

const jsFiles = walk(path.join(__dirname, '..', 'client'));
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('percent')) {
    console.log(`Found percent in ${file}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('percent') && (line.includes('10') || line.includes('rule') || line.includes('transfer') || line.includes('calc'))) {
        console.log(`  L${idx+1}: ${line.trim()}`);
      }
    });
  }
});
