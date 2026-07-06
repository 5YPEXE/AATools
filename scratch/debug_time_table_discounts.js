const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- WEEKDAY DAILY TIME TABLE (daily_time_table_id = 3) ---');
const dtt = faresDb.prepare("SELECT * FROM daily_time_tables WHERE daily_time_table_id = 3 ORDER BY time_point").all();

dtt.forEach((r, idx) => {
  const nextTime = dtt[idx + 1] ? dtt[idx + 1].time_point : 1440;
  const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  
  // Get transfer discount for card 1 (TAM KART) in this TZ
  const disc1 = faresDb.prepare("SELECT percent FROM transfer_discounts WHERE time_zone_id = ? AND card_type_id = 1").get(r.time_zone_id);
  const fare1 = disc1 && disc1.percent > 0 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(disc1.percent)?.fare : 0;
  
  // Get transfer discount for card 2 (STUDENT) in this TZ
  const disc2 = faresDb.prepare("SELECT percent FROM transfer_discounts WHERE time_zone_id = ? AND card_type_id = 2").get(r.time_zone_id);
  const fare2 = disc2 && disc2.percent > 0 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(disc2.percent)?.fare : 0;
  
  console.log(`TZ ${r.time_zone_id}: ${toHHMM(r.time_point)} - ${toHHMM(nextTime)} -> TAM KART: ${fare1/100} TL, ÖĞRENCİ: ${fare2/100} TL`);
});

faresDb.close();
