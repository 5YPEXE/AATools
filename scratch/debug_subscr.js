const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- SUBSCR_TICKET_TAKEN FOR 442 ---');
const subscr442 = faresDb.prepare("SELECT * FROM subscr_ticket_taken WHERE line_id = 442").all();
console.log(subscr442);

console.log('\n--- SUBSCR_TICKET_TAKEN FOR 902 ---');
const subscr902 = faresDb.prepare("SELECT * FROM subscr_ticket_taken WHERE line_id = 902").all();
console.log(subscr902);

console.log('\n--- ALL DISTINCT line_ids in subscr_ticket_taken ---');
const subscrLines = faresDb.prepare("SELECT DISTINCT line_id FROM subscr_ticket_taken").all().map(r => r.line_id);
console.log('Count of lines in subscr_ticket_taken:', subscrLines.length);

faresDb.close();
