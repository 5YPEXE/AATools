const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- RULES WITH ZONE_ID = 0 ---');
const zeroRules = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE line_id = 0 OR previous_line_id = 0").all();
console.log('Number of transfer rules with zone 0:', zeroRules.length);
if (zeroRules.length > 0) {
  console.log(zeroRules.slice(0, 5));
}

console.log('\n--- ALL UNIQUE ZONES IN TRANSFERS_ACCORDING_TO_PREVIOUS_LINE ---');
const uniqueLines = faresDb.prepare("SELECT DISTINCT line_id FROM transfers_according_to_previous_line").all().map(r => r.line_id);
const uniquePrev = faresDb.prepare("SELECT DISTINCT previous_line_id FROM transfers_according_to_previous_line").all().map(r => r.previous_line_id);
console.log('Unique destination zones in rules:', uniqueLines);
console.log('Unique origin zones in rules:', uniquePrev);

faresDb.close();
