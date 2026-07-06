const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'faresimulator', 'FareSimulator_v3 (1).exe');
const buffer = fs.readFileSync(filePath);

console.log('File size:', buffer.length);

const keywords = [
  'UPX',
  'PyInstaller',
  'pyinstaller',
  'python',
  'Python',
  'node.js',
  'electron',
  'Electron',
  'MEI', // PyInstaller temporary directory prefix: _MEIxxxxxx
  'unity',
  'flutter',
  'go.webview',
  'wails'
];

keywords.forEach(keyword => {
  const indices = [];
  let index = buffer.indexOf(keyword);
  while (index !== -1) {
    indices.push(index);
    index = buffer.indexOf(keyword, index + 1);
  }
  console.log(`Keyword "${keyword}": found ${indices.length} times. First few indices:`, indices.slice(0, 5));
});
