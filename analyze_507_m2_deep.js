const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=======================================================');
console.log('  507 → M2 AKTARMA: TAM ANALİZ');
console.log('=======================================================\n');

// M2 = line_id 902
const lineM2 = ldb.prepare('SELECT * FROM lines WHERE line_id=902').get();
const line507 = ldb.prepare('SELECT * FROM lines WHERE line_id=507').get();
console.log('Hat M2 (902):', JSON.stringify(lineM2));
console.log('Hat 507:', JSON.stringify(line507));

// M2 stop_type
const stM2 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=902 GROUP BY stop_type ORDER BY cnt DESC').all();
const st507 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=507 GROUP BY stop_type ORDER BY cnt DESC').all();
console.log('\nM2 (902) stop_types:', JSON.stringify(stM2));
console.log('Hat 507 stop_types:', JSON.stringify(st507));

// M2 fares DB'de var mı?
const lttM2 = fdb.prepare('SELECT * FROM line_time_tables WHERE line_id=902').all();
console.log('\nM2 (902) line_time_tables:', JSON.stringify(lttM2));

// M2 için ticket_fares (stop_type bazlı)
const stM2Val = stM2[0]?.stop_type;
if (stM2Val) {
  const fareM2 = fdb.prepare('SELECT tf.*, f.fare, ct.description FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id LEFT JOIN card_types ct ON ct.card_type_id=tf.card_type_id WHERE tf.stop_type=? AND tf.card_type_id IN (1,2,3) AND tf.time_zone_id=3').all(stM2Val);
  console.log('\nM2 (stop_type=' + stM2Val + ') TZ=3 fiyatlar:', JSON.stringify(fareM2));
}

// transfers_according_to_previous_line - 507→M2 veya M2→507
console.log('\ntransfers_according_to_previous_line: line_id=902 veya previous=507:');
const tr1 = fdb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE line_id=902 OR previous_line_id=902').all();
const tr2 = fdb.prepare('SELECT * FROM transfers_according_to_previous_line WHERE line_id=507 OR previous_line_id=507').all();
console.log('M2 (902) ilgili kurallar:', JSON.stringify(tr1));
console.log('Hat 507 ilgili kurallar:', JSON.stringify(tr2));

// subscr_ticket_taken - M2 için
const subscrM2 = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.line_id=902').all();
console.log('\nM2 (902) subscr_ticket_taken:', JSON.stringify(subscrM2));

// subscr_ticket_taken - Hat 507 için tüm kartlar
const subscr507 = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.line_id=507').all();
console.log('\nHat 507 subscr_ticket_taken (tüm kartlar):', JSON.stringify(subscr507));

// ÖNEMLI: Zone 9 hatları için özel aktarma kuralı var mı?
// Zone 9 = M1, M2, M3 metro hatları
// Bunlar için ticket_fares nasıl yapılandırılmış?
const zone9Lines = ldb.prepare('SELECT line_id FROM lines WHERE zone_id=9').all().map(r => r.line_id);
console.log('\nZone 9 line_id değerleri:', zone9Lines);

// Bu hatların fares DB'sindeki time_tables
for (const lid of zone9Lines) {
  const ltt = fdb.prepare('SELECT * FROM line_time_tables WHERE line_id=?').get(lid);
  if (ltt) {
    const st = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=? GROUP BY stop_type ORDER BY cnt DESC').get(lid);
    console.log(`Hat ${lid}: weekly_tt=${ltt.weekly_time_table_id}, stop_type=${st?.stop_type}`);
  } else {
    console.log(`Hat ${lid}: Fares DB'de time_table YOK`);
  }
}

// transfer_discounts tablosunda stop_type 20 için ne var?
// HAYIR - transfer_discounts sadece time_zone_id + card_type_id
// Aktarma indirimi stop_type'a göre değişmiyor!
// Öyleyse 507→M2 ücretsiz aktarma NEREDEN geliyor?

// TZ=10 için transfer_discounts - fare_id=253 → fare=0 (ücretsiz!)
console.log('\n\n=== KRİTİK: TZ=10 nedir? ===');
const tz10Info = fdb.prepare('SELECT td.*, f.fare FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent WHERE td.time_zone_id=10 AND td.card_type_id IN (1,2,3)').all();
console.log('TZ=10 transfer_discounts (card 1,2,3):', JSON.stringify(tz10Info));

// TZ=10 hangi saat aralığına karşılık geliyor?
// weekly_time_table_id=1, weekday=1 (Salı) için time points
const timePoints = fdb.prepare('SELECT * FROM daily_time_tables WHERE daily_time_table_id=3 ORDER BY time_point').all();
console.log('\nTZ time points (daily_tt_id=3, Salı):', JSON.stringify(timePoints));

// Tüm daily_time_table içeriklerini göster
const allDTT = fdb.prepare('SELECT DISTINCT daily_time_table_id FROM daily_time_tables ORDER BY daily_time_table_id').all();
console.log('\nTüm daily_time_table_id değerleri:', allDTT.map(r=>r.daily_time_table_id).join(', '));

// M2 için weekly_time_table_id nedir?
const lttM2Full = fdb.prepare('SELECT * FROM line_time_tables WHERE line_id=902').all();
console.log('\nM2 full time_table:', JSON.stringify(lttM2Full));

// M2 (902) için weekly_time_table_id=? → daily_time_table_id → time_points
if (lttM2Full.length > 0) {
  const wttId = lttM2Full[0].weekly_time_table_id;
  const wtt = fdb.prepare('SELECT * FROM weekly_time_tables WHERE weekly_time_table_id=? ORDER BY weekday_id').all(wttId);
  console.log('\nM2 weekly_time_table:', JSON.stringify(wtt));
  
  // Weekday=1 için
  const day = wtt.find(r => r.weekday_id === 1);
  if (day) {
    const dtt = fdb.prepare('SELECT * FROM daily_time_tables WHERE daily_time_table_id=? ORDER BY time_point').all(day.daily_time_table_id);
    console.log('\nM2 Salı daily_time_table:', JSON.stringify(dtt));
    
    // 09:00 = 540 dk için TZ
    let tz = 0;
    for (const tp of [...dtt].sort((a,b) => b.time_point - a.time_point)) {
      if (540 >= tp.time_point) { tz = tp.time_zone_id; break; }
    }
    console.log('\nM2 için 09:00 Salı → TZ:', tz);
    
    // Bu TZ için card=2 transfer_discount
    const disc = fdb.prepare('SELECT td.*, f.fare FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent WHERE td.time_zone_id=? AND td.card_type_id=2').get(tz);
    console.log('TZ=' + tz + ', card=2 transfer_discount:', JSON.stringify(disc));
  }
}

fdb.close();
ldb.close();
