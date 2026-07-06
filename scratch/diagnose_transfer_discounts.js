const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });

console.log('--- TRANSFER DISCOUNTS FOR CARD 1 ---');
const rows = faresDb.prepare('SELECT * FROM transfer_discounts WHERE card_type_id = 1').all();
console.log(rows);

// Let's resolve the fare amount for each percent (fare_id)
console.log('\n--- FARES IN FARES TABLE FOR THOSE FARE_IDs ---');
rows.forEach(r => {
  const fareRow = faresDb.prepare('SELECT fare FROM fares WHERE fare_id = ?').get(r.percent);
  console.log(`fare_id ${r.percent}:`, fareRow ? fareRow.fare : 'not found');
});
