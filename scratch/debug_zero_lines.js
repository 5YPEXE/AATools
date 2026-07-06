const Database = require('better-sqlite3');
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

const zeroLines = linesDb.prepare("SELECT line_id, name, zone_id FROM lines WHERE zone_id = 0").all();
console.log('--- LINES WITH ZONE_ID = 0 ---');
console.log('Count:', zeroLines.length);
zeroLines.forEach(l => {
  console.log(`  line_id=${l.line_id}, name="${l.name}"`);
});

linesDb.close();
