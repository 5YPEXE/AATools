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
    } else {
      files.push(filePath);
    }
  });
  return files;
}

const allFiles = walk(path.join(__dirname, '..'));
console.log('--- ALL FILES ---');
allFiles.forEach(f => {
  if (f.toLowerCase().endsWith('.exe') || f.toLowerCase().includes('simulator')) {
    console.log(f);
  }
});
