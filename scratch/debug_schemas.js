const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

console.log('--- LINES TABLE PRAGMA ---');
console.log(linesDb.prepare("PRAGMA table_info(lines)").all());

console.log('\n--- LINE 442 VALUES ---');
console.log(linesDb.prepare("SELECT * FROM lines WHERE line_id = 442").get());

console.log('\n--- LINE 902 VALUES ---');
console.log(linesDb.prepare("SELECT * FROM lines WHERE line_id = 902").get());

console.log('\n--- TICKET_FARES FOR CARD 1 IN FARES DB ---');
// Let's see if there is any column in ticket_fares or if there are other columns in fares or card_types
console.log(faresDb.prepare("PRAGMA table_info(ticket_fares)").all());

console.log('\n--- FARES TABLE PRAGMA ---');
console.log(faresDb.prepare("PRAGMA table_info(fares)").all());

console.log('\n--- TRANSFER_DISCOUNTS PRAGMA ---');
console.log(faresDb.prepare("PRAGMA table_info(transfer_discounts)").all());

console.log('\n--- CARD_TYPES_PARAMETERS PRAGMA ---');
try {
  console.log(faresDb.prepare("PRAGMA table_info(card_types_parameters)").all());
} catch(e) {
  console.log(e.message);
}

faresDb.close();
linesDb.close();
