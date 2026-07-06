const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- TRANSFER_DISCOUNTS FOR CARD 1 ---');
const disc1 = faresDb.prepare("SELECT * FROM transfer_discounts WHERE card_type_id = 1").all();
disc1.forEach(d => {
  const fareRow = faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(d.percent);
  console.log(`  time_zone_id=${d.time_zone_id}, percent/fare_id=${d.percent}, fare=${fareRow ? fareRow.fare : 'null'}`);
});

console.log('\n--- TRANSFER_DISCOUNTS FOR CARD 2 ---');
const disc2 = faresDb.prepare("SELECT * FROM transfer_discounts WHERE card_type_id = 2").all();
disc2.forEach(d => {
  const fareRow = faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(d.percent);
  console.log(`  time_zone_id=${d.time_zone_id}, percent/fare_id=${d.percent}, fare=${fareRow ? fareRow.fare : 'null'}`);
});

faresDb.close();
