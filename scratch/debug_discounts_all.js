const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- ALL TRANSFER_DISCOUNTS ---');
const disc = faresDb.prepare("SELECT * FROM transfer_discounts").all();
disc.forEach(d => {
  const fareRow = faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(d.percent);
  console.log(`  time_zone_id=${d.time_zone_id}, card_type_id=${d.card_type_id}, percent/fare_id=${d.percent}, fare=${fareRow ? fareRow.fare : 'null'}`);
});

faresDb.close();
