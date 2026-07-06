const Database = require('./node_modules/better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('\n========= TRANSFER MANTIK ANALİZİ =========\n');

// 1. transfers_according_to_previous_line şeması
console.log('=== transfers_according_to_previous_line (ilk 10 kayıt) ===');
const transfers = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line LIMIT 10').all();
console.log(JSON.stringify(transfers, null, 2));

// 2. transfer_discounts
console.log('\n=== transfer_discounts (tümü) ===');
const discounts = faresDb.prepare('SELECT * FROM transfer_discounts').all();
console.log(JSON.stringify(discounts, null, 2));

// 3. transfer_intervals
console.log('\n=== transfer_intervals (tümü) ===');
const intervals = faresDb.prepare('SELECT * FROM transfer_intervals').all();
console.log(JSON.stringify(intervals, null, 2));

// 4. percent değerleri ne anlama geliyor?
console.log('\n=== Distinct percent değerleri ===');
const percs = faresDb.prepare('SELECT DISTINCT percent, COUNT(*) as cnt FROM transfers_according_to_previous_line GROUP BY percent ORDER BY percent').all();
console.log(JSON.stringify(percs, null, 2));

// 5. flags değerleri
console.log('\n=== Distinct flags değerleri ===');
const flags = faresDb.prepare('SELECT DISTINCT flags, COUNT(*) as cnt FROM transfers_according_to_previous_line GROUP BY flags ORDER BY flags').all();
console.log(JSON.stringify(flags, null, 2));

// 6. Belirli bir hat çifti için transfer: 140 -> 160
console.log('\n=== Hat 140 -> 160 arası transfer kuralı ===');
const t140_160 = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE line_id=160 AND previous_line_id=140').all();
console.log(JSON.stringify(t140_160, null, 2));

// 7. Hat 140'a ait tüm transfer kuralları (previous hat olarak)
console.log('\n=== 140 numaralı hattan sonra aktarma kuralları (line_id üzerinden) ===');
const from140 = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id=140 LIMIT 10').all();
console.log(JSON.stringify(from140, null, 2));

// 8. Hat 160 için previous hat transfer kuralları
console.log('\n=== 160 numaralı hatta inerken transfer kuralları (line_id=160) ===');
const to160 = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE line_id=160 LIMIT 10').all();
console.log(JSON.stringify(to160, null, 2));

// 9. line_id=1 previous_line_id=1 (aynı hat aktarması?)
console.log('\n=== Aynı hat aktarması (line_id=previous_line_id) ===');
const sameHat = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE line_id=previous_line_id LIMIT 5').all();
console.log(JSON.stringify(sameHat, null, 2));

// 10. ticket_fares - stop_type ne demek? line_stops.stop_type ile ilişki
console.log('\n=== line_stops stop_type distinct ===');
const stopTypes = linesDb.prepare('SELECT DISTINCT stop_type, COUNT(*) as cnt FROM line_stops GROUP BY stop_type ORDER BY cnt DESC').all();
console.log(JSON.stringify(stopTypes, null, 2));

// 11. Hat 140 ve 160 zone'ları
console.log('\n=== Hat 140 ve 160 bilgileri ===');
const l140 = linesDb.prepare('SELECT * FROM lines WHERE line_id IN (140, 160, 1401, 1402, 1601, 1602)').all();
console.log(JSON.stringify(l140, null, 2));

// 12. ticket_fares - stop_type=1 kart tipleri için ücretler
console.log('\n=== ticket_fares stop_type=1 time_zone=0 (örnek) ===');
const tf = faresDb.prepare(`
  SELECT tf.*, f.fare 
  FROM ticket_fares tf 
  JOIN fares f ON f.fare_id = tf.fare_id 
  WHERE tf.stop_type=1 AND tf.time_zone_id=0 
  ORDER BY tf.card_type_id
`).all();
console.log(JSON.stringify(tf, null, 2));

// 13. daily_time_tables
console.log('\n=== daily_time_tables (tümü) ===');
const dailyTT = faresDb.prepare('SELECT * FROM daily_time_tables').all();
console.log(JSON.stringify(dailyTT, null, 2));

// 14. weekly_time_tables
console.log('\n=== weekly_time_tables (tümü) ===');
const weeklyTT = faresDb.prepare('SELECT * FROM weekly_time_tables').all();
console.log(JSON.stringify(weeklyTT, null, 2));

// 15. line_time_tables (ilk 10)
console.log('\n=== line_time_tables şeması + örnek ===');
const lttCols = faresDb.prepare('PRAGMA table_info(line_time_tables)').all();
console.log('Kolonlar:', JSON.stringify(lttCols.map(c=>({name:c.name,type:c.type})), null, 2));
const ltt = faresDb.prepare('SELECT * FROM line_time_tables LIMIT 5').all();
console.log('Örnek:', JSON.stringify(ltt, null, 2));

// 16. card_types şeması
console.log('\n=== card_types şeması ===');
const ctCols = faresDb.prepare('PRAGMA table_info(card_types)').all();
console.log('Kolonlar:', JSON.stringify(ctCols.map(c=>({name:c.name,type:c.type})), null, 2));
const ctSample = faresDb.prepare('SELECT * FROM card_types LIMIT 10').all();
console.log('Örnek:', JSON.stringify(ctSample, null, 2));

// 17. round_trip_discounts
console.log('\n=== round_trip_discounts ===');
const rtd = faresDb.prepare('SELECT * FROM round_trip_discounts').all();
console.log(JSON.stringify(rtd, null, 2));

// 18. line_manual_fare - özel ücretli hatlar
console.log('\n=== line_manual_fare (tümü) ===');
const lmfCols = faresDb.prepare('PRAGMA table_info(line_manual_fare)').all();
console.log('Kolonlar:', JSON.stringify(lmfCols.map(c=>({name:c.name,type:c.type})), null, 2));
const lmf = faresDb.prepare('SELECT * FROM line_manual_fare LIMIT 10').all();
console.log('Örnek:', JSON.stringify(lmf, null, 2));

// 19. subscr_ticket_taken (abonman) - hat 140, 160
console.log('\n=== subscr_ticket_taken hat 140, 160 ===');
const stt = faresDb.prepare('SELECT * FROM subscr_ticket_taken WHERE line_id IN (140, 160)').all();
console.log(JSON.stringify(stt, null, 2));

faresDb.close();
linesDb.close();
