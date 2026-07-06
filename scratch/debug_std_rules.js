const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- RULES BETWEEN ZONE 1 AND ZONE 1 (Bus to Bus) ---');
const r1 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = 1 AND line_id = 1").all();
console.log('From 1 to 1:', r1);

console.log('\n--- RULES BETWEEN ZONE 1 AND ZONE 9 (Bus to Metro) ---');
const r2 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = 1 AND line_id = 9").all();
console.log('From 1 to 9:', r2);

console.log('\n--- RULES BETWEEN ZONE 9 AND ZONE 1 (Metro to Bus) ---');
const r3 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = 9 AND line_id = 1").all();
console.log('From 9 to 1:', r3);

faresDb.close();
