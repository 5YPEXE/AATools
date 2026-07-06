const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

const l440 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 440").get();
const l902 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 902").get();
const l237 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 237").get();

console.log('Line 440:', l440);
console.log('Line 902:', l902);
console.log('Line 237:', l237);

console.log('\n--- 1ST TRANSFER RULES FROM 440 (zone ' + l440.zone_id + ') TO 902 (zone ' + l902.zone_id + ') ---');
const r1 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(l440.zone_id, l902.zone_id);
console.log(r1);

console.log('\n--- 2ND TRANSFER RULES FROM 902 (zone ' + l902.zone_id + ') TO 237 (zone ' + l237.zone_id + ') ---');
const r2 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(l902.zone_id, l237.zone_id);
console.log(r2);

faresDb.close();
linesDb.close();
