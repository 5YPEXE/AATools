const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        files = files.concat(walk(filePath));
      }
    } else if (filePath.endsWith('.py')) {
      files.push(filePath);
    }
  });
  return files;
}

const pyFiles = walk(path.join(__dirname, '..'));
console.log('--- PYTHON FILES ---');
console.log(pyFiles);
