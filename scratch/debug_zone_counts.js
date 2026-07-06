const Database = require('better-sqlite3');
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

const counts = linesDb.prepare("SELECT zone_id, COUNT(*) as cnt FROM lines GROUP BY zone_id ORDER BY cnt DESC").all();
console.log('--- LINES BY ZONE_ID ---');
console.log(counts);

linesDb.close();
