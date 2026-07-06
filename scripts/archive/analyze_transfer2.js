const Database = require('./node_modules/better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly:true});

// Tam transfer verisi analizi
console.log('=== TÜME TRANSFER TABLOLARI ===\n');

// transfer_discounts tam veri
const discounts = faresDb.prepare('SELECT * FROM transfer_discounts ORDER BY rowid').all();
console.log('transfer_discounts:');
console.log(JSON.stringify(discounts, null, 2));

// transfer_intervals tam veri
const intervals = faresDb.prepare('SELECT * FROM transfer_intervals ORDER BY rowid').all();
console.log('\ntransfer_intervals:');
console.log(JSON.stringify(intervals, null, 2));

// transfer_discounts şema
const tdCols = faresDb.prepare('PRAGMA table_info(transfer_discounts)').all();
console.log('\ntransfer_discounts kolonlar:', tdCols.map(c=>c.name+':'+c.type));

const tiCols = faresDb.prepare('PRAGMA table_info(transfer_intervals)').all();
console.log('transfer_intervals kolonlar:', tiCols.map(c=>c.name+':'+c.type));

// transfers_according_to_previous_line - percent=1 demek %100 indirim mi?
console.log('\n=== percent değerleri yorumu ===');
const percAll = faresDb.prepare('SELECT DISTINCT percent FROM transfers_according_to_previous_line ORDER BY percent').all();
console.log('Unique percent:', percAll.map(r=>r.percent));

// flags yorumu
console.log('\n=== flags + percent kombinasyonları ===');
const combos = faresDb.prepare('SELECT flags, percent, COUNT(*) as cnt FROM transfers_according_to_previous_line GROUP BY flags, percent ORDER BY flags, percent').all();
console.log(JSON.stringify(combos, null, 2));

// threshold_time ne zaman 0 değil?
console.log('\n=== threshold_time > 0 örnekleri ===');
const thresh = faresDb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE threshold_time > 0 LIMIT 10').all();
console.log(JSON.stringify(thresh, null, 2));

// card_types tam liste
console.log('\n=== card_types tam liste ===');
const ct = faresDb.prepare('SELECT * FROM card_types ORDER BY card_type_id').all();
ct.forEach(c => console.log(`  ${c.card_type_id}: "${c.description}"`));

// ticket_fares - hangi stop_type'lar fiyatlı?
console.log('\n=== stop_type bazında ücret ortalaması ===');
const stFares = faresDb.prepare(`
  SELECT tf.stop_type, AVG(f.fare) as avgFare, MIN(f.fare) as minFare, MAX(f.fare) as maxFare, COUNT(*) as cnt
  FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id
  WHERE f.fare > 0
  GROUP BY tf.stop_type
  ORDER BY tf.stop_type
  LIMIT 20
`).all();
console.log(JSON.stringify(stFares, null, 2));

// Hat 140 ve 160 stop_type'ları line_stops'ta
console.log('\n=== Hat 140 ve 160 için stop_type\'lar ===');
const stopTypes140 = linesDb.prepare('SELECT DISTINCT stop_type FROM line_stops WHERE line_id=140').all();
const stopTypes160 = linesDb.prepare('SELECT DISTINCT stop_type FROM line_stops WHERE line_id=160').all();
console.log('Hat 140 stop_types:', stopTypes140.map(r=>r.stop_type));
console.log('Hat 160 stop_types:', stopTypes160.map(r=>r.stop_type));

// Hat 140 ve 160 için manual fare var mı?
const mf140 = faresDb.prepare('SELECT * FROM line_manual_fare WHERE line_id IN (140,160)').all();
console.log('\nManual fare 140/160:', JSON.stringify(mf140, null, 2));

// line_time_tables için hat 140 ve 160
const ltt140 = faresDb.prepare('SELECT * FROM line_time_tables WHERE line_id IN (140, 160)').all();
console.log('\nline_time_tables 140/160:', JSON.stringify(ltt140, null, 2));

// Tüm weekly time table - id=1 için detay
console.log('\n=== weekly_time_table_id=1 için tüm günler ===');
const wtt = faresDb.prepare(`
  SELECT w.weekday_id, w.daily_time_table_id, d.time_point, d.time_zone_id
  FROM weekly_time_tables w
  JOIN daily_time_tables d ON d.daily_time_table_id = w.daily_time_table_id
  WHERE w.weekly_time_table_id=1
  ORDER BY w.weekday_id, d.time_point
`).all();
console.log(JSON.stringify(wtt, null, 2));

// card_types_parameters tam
console.log('\n=== card_types_parameters (ilk 20) ===');
const ctp = faresDb.prepare('SELECT * FROM card_types_parameters LIMIT 20').all();
console.log(JSON.stringify(ctp, null, 2));

faresDb.close();
linesDb.close();
