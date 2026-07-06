const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=================================================================');
console.log('  transfer_lines + DİĞER TABLOLAR TAM ANALİZ');
console.log('=================================================================\n');

// transfer_lines: (line_id, prev_line_id) - kart tipi yok!
// Bu muhtemelen "bu hat çifti için ÖZEL aktarma var" listesi
const allTL = fdb.prepare('SELECT * FROM transfer_lines ORDER BY line_id LIMIT 50').all();
console.log('transfer_lines (ilk 50):', JSON.stringify(allTL));
const cntTL = fdb.prepare('SELECT COUNT(*) as c FROM transfer_lines').get();
console.log('Toplam transfer_lines:', cntTL.c);

// 507 veya 902 var mı?
const tl507 = fdb.prepare('SELECT * FROM transfer_lines WHERE line_id=507 OR prev_line_id=507 OR line_id=902 OR prev_line_id=902').all();
console.log('\n507/902 transfer_lines:', JSON.stringify(tl507));

// Tüm tabloların şemaları
const tables = ['route_subscr', 'subscr_allowence', 'subscr_detail', 'fare_type_assignment', 'transfers_ingenico', 'local_card_types', 'subscr_types', 'card_types_parameters'];
for (const t of tables) {
  const schema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(t);
  console.log('\n' + t + ' şeması:', schema?.sql);
  try {
    const rows = fdb.prepare('SELECT * FROM ' + t + ' LIMIT 10').all();
    console.log(t + ' örnek:', JSON.stringify(rows));
  } catch(e) { console.log('Hata:', e.message); }
}

// ÖNEMLI: variables tablosu - sistem parametreleri
console.log('\n\n=== variables tablosu ===');
const vars = fdb.prepare('SELECT * FROM variables').all();
console.log(JSON.stringify(vars, null, 2));

// transfer_discounts - weekday_id=5,6 (Cumartesi-Pazar) için TZ=10
// Daily TT 4 (hafta sonu): TZ=10 = 06:45-07:00 arası!
console.log('\n=================================================================');
console.log('  KRİTİK BULUŞ: Daily TT 4 = HAFTA SONU');
console.log('=================================================================\n');
console.log('Daily TT 3 (Hafta içi): TZ=0,1,2,3,4,5,6,7');
console.log('Daily TT 4 (Hafta sonu/Cumartesi-Pazar): TZ=0,9,10,11,12,13,14,15');
console.log('');
console.log('Hafta sonu TZ=10 → 06:45-07:00 arası → transfer_discount card=2 fare=0 (ÜCRETSİZ!)');
console.log('');
console.log('EVET! ÖĞRENCİ kartı HAFTA SONU SABAH 06:45-07:00 arasında ÜCRETSİZ aktarma yapabilir');
console.log('Bu çok dar bir pencere - belki validatörde farklı uygulama yapılıyor');

// Hafta sonu TZ=10 için transfer_discounts TÜM kart tipleri
console.log('\nHafta sonu TZ=10 transfer_discounts tüm kartlar:');
const tz10all = fdb.prepare('SELECT td.*, f.fare, ct.description FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent LEFT JOIN card_types ct ON ct.card_type_id=td.card_type_id WHERE td.time_zone_id=10 AND td.percent > 0 ORDER BY td.card_type_id').all();
tz10all.forEach(r => console.log(`  card=${r.card_type_id} (${r.description}): fare_id=${r.percent} → ${r.fare/100}₺`));

// Hafta sonu Daily TT 4 tam listesi
console.log('\nHafta sonu zaman dilimleri (Daily TT 4):');
const dtt4 = fdb.prepare('SELECT * FROM daily_time_tables WHERE daily_time_table_id=4 ORDER BY time_point').all();
dtt4.forEach(r => {
  const endMin = dtt4.find(x => x.time_point > r.time_point)?.time_point ?? 1440;
  const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  console.log(`  TZ=${r.time_zone_id}: ${toHHMM(r.time_point)} - ${toHHMM(endMin)}`);
});

// Hafta içi Daily TT 3 tam listesi  
console.log('\nHafta içi zaman dilimleri (Daily TT 3):');
const dtt3 = fdb.prepare('SELECT * FROM daily_time_tables WHERE daily_time_table_id=3 ORDER BY time_point').all();
dtt3.forEach(r => {
  const endMin = dtt3.find(x => x.time_point > r.time_point)?.time_point ?? 1440;
  const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const disc2 = fdb.prepare('SELECT td.*, f.fare FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent WHERE td.time_zone_id=? AND td.card_type_id=2').get(r.time_zone_id);
  const discStr = disc2 ? `ÖĞR aktarma: ${disc2.fare/100}₺ (fare_id=${disc2.percent})` : 'ÖĞR aktarma: yok';
  console.log(`  TZ=${r.time_zone_id}: ${toHHMM(r.time_point)} - ${toHHMM(endMin)} → ${discStr}`);
});

// Hafta sonu Daily TT 4 ile transfer_discounts card=2
console.log('\nHafta sonu zaman dilimleri + ÖĞRENCİ aktarma:');
dtt4.forEach(r => {
  const endMin = dtt4.find(x => x.time_point > r.time_point)?.time_point ?? 1440;
  const toHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const disc2 = fdb.prepare('SELECT td.*, f.fare FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent WHERE td.time_zone_id=? AND td.card_type_id=2').get(r.time_zone_id);
  const discStr = disc2 && disc2.percent > 0 ? `ÖĞR aktarma: ${disc2.fare/100}₺ (fare_id=${disc2.percent})` : 'ÖĞR aktarma: yok/0';
  console.log(`  TZ=${r.time_zone_id}: ${toHHMM(r.time_point)} - ${toHHMM(endMin)} → ${discStr}`);
});

// PEKI NEDEN 507→M2 HER ZAMAN ÜCRETSİZ?
// subscr_ticket_taken tablosu bunu açıklıyor mu?
// card_type=2 (ÖĞRENCİ) + ticket=1 → bilet alınabilir
// isTransferActive=0 → AKTİF DEĞIL - bu ne demek?
// Belki isTransferActive: bu hat için aktarma GELİYOR mu ÇIKIYOR mu?
// 0 = bu hattan aktarma çıkmaz (bu hat SON hat olarak sayılır)
// 1 = bu hattan aktarma yapılabilir
// BU ANLAM YANLIŞ OLUR ÇÜNKÜ M2 GİRİŞİNDE aktarma yapılıyor

// Belki de: isTransferActive=0 → aktarma ücreti UYGULANMAZ (ücretsiz)
// isTransferActive=1 → aktarma ücreti uygulanır
// BU ANLAM 507→M2 ÜCRETSİZ SORUSUNU AÇIKLIYOR OLABİLİR!

console.log('\n\n=== subscr_ticket_taken KAPSAMLI ANALİZ ===');
console.log('isTransferActive=1 olan hat+kart çiftleri:');
const active1 = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.isTransferActive=1 ORDER BY stt.line_id').all();
active1.forEach(r => console.log(`  Hat ${r.line_id} - ${r.description} (${r.card_type}): ticket=${r.ticket}`));

console.log('\nisTransferActive=0 olan hat+kart çiftleri (ilk 20):');
const active0 = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.isTransferActive=0 ORDER BY stt.line_id LIMIT 20').all();
active0.forEach(r => console.log(`  Hat ${r.line_id} - ${r.description} (${r.card_type}): ticket=${r.ticket}`));

fdb.close();
ldb.close();
