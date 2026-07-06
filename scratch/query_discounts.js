const Database = require('better-sqlite3');
const db = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

const card2Discounts = db.prepare("SELECT * FROM transfer_discounts WHERE card_type_id = 2").all();
console.log('Card 2 transfer_discounts:');
card2Discounts.forEach(d => {
  const fareRow = db.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(d.percent);
  console.log(`  time_zone_id=${d.time_zone_id}, fare_id=${d.percent}, fare=${fareRow ? fareRow.fare : 'null'}`);
});

db.close();
