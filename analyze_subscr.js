const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=================================================================');
console.log('  SONUÇ: subscr_ticket_taken TABLOSUNUN ROLÜ');
console.log('=================================================================\n');

// subscr_ticket_taken tablosu ne anlama geliyor?
// Hat 507 + card_type=2 + ticket=1 + isTransferActive=0
// Hat M2 (902) + card_type=2 + ticket=1 + isTransferActive=0
// ticket=1 → Bu hat için bilet alınıyor (abonman geçerli)
// isTransferActive=0 → Aktarma DEVRE DIŞI

// Ama validatörde ücretsiz geçiyor! Peki nasıl?

// TZ=10 ile ücretsiz aktarma
// TZ=10 hangi saat dilimi? Daily_time_table'da TZ=10 yok (max TZ=7)
// TZ=10 farklı bir weekly_time_table'da olmalı!

// Diğer daily_time_table'ları inceleyelim
console.log('Tüm daily_time_tables içerikleri:');
for (let dttId = 1; dttId <= 4; dttId++) {
  const rows = fdb.prepare('SELECT * FROM daily_time_tables WHERE daily_time_table_id=? ORDER BY time_point').all(dttId);
  console.log(`\nDaily TT ${dttId}:`, JSON.stringify(rows));
}

// weekly_time_tables - tüm içerikler
console.log('\nTüm weekly_time_tables:');
const wtt = fdb.prepare('SELECT * FROM weekly_time_tables ORDER BY weekly_time_table_id, weekday_id').all();
console.log(JSON.stringify(wtt, null, 2));

// TZ=10 hiçbir daily_time_table'da yok - peki nereden geliyor?
// Belki metro hatlarının farklı bir weekly_time_table_id'si var

// M2'nin wtt_id = 1 (aynı normal hatlar gibi)
// 507'nin wtt_id = 1

// subscr_ticket_taken: ticket=1, isTransferActive=0
// Bu demek ki: Bu hat üzerinde ÖĞRENCİ kartı kullanılıyor
// ama aktarma ÖZEL BİR DURUM
// isTransferActive=0 → transfer aktif değil = bu hattan yapılan aktarma ücretli mi?
// isTransferActive=1 → bu hattan aktarma ücretsiz mi?

// M2 (902) ve 507 için hem card=2 hem card=10'un isTransferActive durumu
const allSubscr = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.line_id IN (507, 902) ORDER BY stt.line_id, stt.card_type').all();
console.log('\nHat 507 ve M2 (902) tüm subscr_ticket_taken:');
allSubscr.forEach(r => {
  console.log(`  Hat ${r.line_id} - ${r.description} (${r.card_type}): ticket=${r.ticket}, isTransferActive=${r.isTransferActive}`);
});

// isTransferActive=0 → Bu hat için aktarma aktif değil
// Bu demek ki: ÖĞRENCİ kartı M2'den başka hatta geçerken aktarma indirimi UYGULANMIYOR
// Ama 507'den M2'ye geçerken ne oluyor?

// transfer_discounts card=2 TZ=10 için fare=0 (ücretsiz)
// TZ=10 hiçbir daily_time_table'da yok!
// Peki hangi hat/senaryo TZ=10'a düşer?

// Belki metro için farklı bir weekly_time_table_id kullanılıyor?
// Fares DB'deki line_time_tables'ta M2 için farklı bir wtt_id var mı?
const metroLTT = fdb.prepare('SELECT * FROM line_time_tables WHERE line_id IN (900,901,902,903,500,600)').all();
console.log('\nMetro hatları (900-903,500,600) line_time_tables:', JSON.stringify(metroLTT));

// TZ=10'u üretebilecek daily_time_table var mı?
const allTZ = fdb.prepare('SELECT DISTINCT time_zone_id FROM daily_time_tables ORDER BY time_zone_id').all();
console.log('\nDaily_time_tables içindeki tüm TZ değerleri:', allTZ.map(r=>r.time_zone_id).join(', '));

// SONUÇ: TZ=10 daily_time_table'da yok ama transfer_discounts'ta var
// Bu muhtemelen özel bir kural: bazı hat çiftleri için özel TZ=10 uygulanıyor
// Veya transfer_discounts'taki TZ=10 hiç aktive olmuyor (dead record)

// ÖĞRENCİ 507→M2 ücretsiz aktarma validatörde çalışıyor
// DB'de bunu açıklayan mekanizma nedir?

// Belki: isTransferActive bu sorunun cevabı değil
// Belki: metro-otobüs arası aktarma için özel bir tarife sistemi var
// EGO'da metro hattına geçişte bilet alınmıyor - entegre tarife

// GERÇEK: Ankara'da EGO otobüsünden Metro'ya geçerken
// KENT kart sistemi aktarma penceresinde ücretsiz geçiş sağlıyor
// Bu otomatik aktarma sistemi - validatör doğrudan sıfır ücret uyguluyor
// DB'de bunu kodlayan yer: transfer_discounts değil başka bir yapı olabilir

// Daha geniş bak: ticket_fares'taki stop_type=19 (metro) için tüm kart tipleri
console.log('\nstop_type=19 (Metro) için TZ=3 tüm kart tipleri:');
const metroFares = fdb.prepare('SELECT tf.card_type_id, ct.description, f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id LEFT JOIN card_types ct ON ct.card_type_id=tf.card_type_id WHERE tf.stop_type=19 AND tf.time_zone_id=3 ORDER BY tf.card_type_id').all();
metroFares.slice(0,15).forEach(r => console.log(`  card=${r.card_type_id} (${r.description}): ${r.fare/100}₺`));

// stop_type=20 (hat 507 tipi) için
console.log('\nstop_type=20 (Hat 507 tipi) için TZ=3 tüm kart tipleri:');
const busStop20Fares = fdb.prepare('SELECT tf.card_type_id, ct.description, f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id LEFT JOIN card_types ct ON ct.card_type_id=tf.card_type_id WHERE tf.stop_type=20 AND tf.time_zone_id=3 ORDER BY tf.card_type_id').all();
busStop20Fares.slice(0,15).forEach(r => console.log(`  card=${r.card_type_id} (${r.description}): ${r.fare/100}₺`));

console.log('\n=== ÖZET ===');
console.log('507 → M2 (902) ücretsiz aktarma için DB mekanizması:');
console.log('1. subscr_ticket_taken: Hat 507 + M2 (902) için card_type=2, isTransferActive=0');
console.log('   → isTransferActive=0 = Bu hat abonman desteğiyle AKTARMA YAPMIYOR');
console.log('   → Ama ticket=1 = Hat üzerinde bilet geçerli');
console.log('2. transfer_discounts: TZ=10 için card_type=2 → fare_id=253 → 0₺ (ücretsiz)');
console.log('   → TZ=10 hiçbir günlük tarifede tanımlı değil (hiç aktive olmuyor)');
console.log('3. stop_type=19 (metro) ÖĞRENCİ fiyatı = 1750₺ (stop_type=1 ile aynı)');
console.log('');
console.log('SONUÇ: Bu aktarma DB\'de standart yolla kodlanmamış olabilir.');
console.log('Metro-otobüs entegre aktarması KENT kart firmware seviyesinde işleniyor.');
console.log('Veya başka bir tablo/mekanizma var.');

// Başka tablolar var mı?
const allTables = fdb.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('\nFares DB tüm tablolar:', allTables.map(r=>r.name).join(', '));

fdb.close();
ldb.close();
