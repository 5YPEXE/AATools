const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- RULES BETWEEN METRO (9) AND 507 (32) ---');
const r1 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = 32 AND line_id = 9").all();
console.log('From 32 to 9 (507 to Metro):', r1);

const r2 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = 9 AND line_id = 32").all();
console.log('From 9 to 32 (Metro to 507):', r2);

faresDb.close();
