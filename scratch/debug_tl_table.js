const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- TRANSFER_LINES SCHEMA ---');
const schema = faresDb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transfer_lines'").get();
console.log(schema?.sql);

console.log('\n--- TRANSFER_LINES DATA (first 50) ---');
const data = faresDb.prepare("SELECT * FROM transfer_lines LIMIT 50").all();
console.log(data);

console.log('\n--- check for 507 or 902 in transfer_lines ---');
const matched = faresDb.prepare("SELECT * FROM transfer_lines WHERE line_id = 507 OR line_id = 902").all();
console.log(matched);

faresDb.close();
