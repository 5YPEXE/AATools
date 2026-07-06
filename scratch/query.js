const Database = require('better-sqlite3');
const path = require('path');

const faresDb = new Database(path.join(__dirname, '..', 'fares_20260412000000_20360131235959.sqlite'));
const linesDb = new Database(path.join(__dirname, '..', 'lines_20260412000000_20360127235959.sqlite'));

const line507 = linesDb.prepare('SELECT * FROM lines WHERE line_id = 507').get();
const line902 = linesDb.prepare('SELECT * FROM lines WHERE line_id = 902').get();
console.log('507:', line507);
console.log('902:', line902);

const rules = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?').all(line507.zone_id, line902.zone_id);
console.log('Rules 507 -> 902:', rules);
