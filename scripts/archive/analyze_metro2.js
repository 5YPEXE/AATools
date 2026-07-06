const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=========================================================');
console.log('  KRİTİK BULGU: AKTARMA SİSTEMİ NASIL ÇALIŞIYOR?');
console.log('=========================================================\n');

// Hat 507: stop_type=20
// ticket_fares'te stop_type=20, card_type=2 için fiyat nedir?
const fare507OGR = fdb.prepare('SELECT f.fare, tf.* FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id WHERE tf.stop_type=20 AND tf.card_type_id=2 ORDER BY tf.time_zone_id').all();
console.log('Hat 507 (stop_type=20) ÖĞRENCİ fiyatları:', JSON.stringify(fare507OGR));

// transfer_discounts'ta stop_type=20, card_type=2
// HAYIR - transfer_discounts'ta stop_type yok, sadece time_zone_id ve card_type_id var
// Ama stop_type=20 için bilet fiyatı ne?

// M2 metro için hangi stop_type kullanılıyor?
// Ankara M2 = Dikimevi-Keçiören (ya da Kızılay-Keçiören)
// line_id'si büyük ihtimalle doğrudan "M2" olarak geçmiyor
// Zone_id=9 olan hatlar metro olabilir
const zone9Lines = ldb.prepare('SELECT * FROM lines WHERE zone_id=9 ORDER BY line_id').all();
console.log('\nZone_id=9 hatlar (Metro/Ankaray?):', JSON.stringify(zone9Lines));

// Zone_id=0 hatlar
const zone0Lines = ldb.prepare('SELECT * FROM lines WHERE zone_id=0 ORDER BY line_id').all();
console.log('\nZone_id=0 hatlar:', JSON.stringify(zone0Lines));

// Hat 200 (BATIKENT METRO - M1) ve 300 (DİKİMEVİ - M2/Ankaray?) stop_type'larını incele
const stopType200 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=200 GROUP BY stop_type ORDER BY cnt DESC').all();
const stopType300 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=300 GROUP BY stop_type ORDER BY cnt DESC').all();
console.log('\nHat 200 (Batıkent Metro-M1?) stop_types:', JSON.stringify(stopType200));
console.log('Hat 300 (Dikimevi-M2/Ankaray?) stop_types:', JSON.stringify(stopType300));

// Hat 507 = "PLEVNE MAHALLESİ – ÜMİTKÖY METRO İST." → zone_id=32, stop_type=20
// ÜMİTKÖY METRO = M4 metro istasyonu bağlantı hattı
// subscr_ticket_taken'da hat 507 için card_type=2 isTransferActive=0 !!!
console.log('\n!!!KRİTİK!!!');
console.log('Hat 507 subscr_ticket_taken:');
const s507 = fdb.prepare('SELECT stt.*, ct.description FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type WHERE stt.line_id=507').all();
console.log(JSON.stringify(s507, null, 2));

// "isTransferActive=0" ne anlama geliyor?
// Bu abonman (subscr) tablosu değil mi - aktarma yapınca bu hat için indirim uygulanmaz mı?
// Yoksa bu hat üzerinden transfer aktif mi demek?

// M2 metro hattı - Ankara'da M2 = Keçiören Metro
// line_id'yi bulmak için "Keçiören" veya "M2" içeren hatları ara
const kecioren = ldb.prepare("SELECT * FROM lines WHERE name LIKE '%KEÇİÖREN%' OR name LIKE '%KEC%OREN%' ORDER BY line_id LIMIT 10").all();
console.log('\nKeçiören içeren hatlar:', JSON.stringify(kecioren));

// Kullanıcının M2 dediği şey hangi line_id?
// M2 Ankara = Kızılay-Keçiören Metro (2014)
// Hat 300 = "DİKİMEVİ - KIZILAY - AŞTİ" = Ankaray/M1 olabilir
// Gerçek M2 = ayrı bir line_id

// stop_type=20 için transfer_discounts
const td20 = fdb.prepare('SELECT td.*, f.fare FROM transfer_discounts td LEFT JOIN fares f ON f.fare_id=td.percent WHERE td.card_type_id=2 ORDER BY td.time_zone_id').all();
console.log('\ntransfer_discounts card=2 (ÖĞRENCİ) tüm TZ:', JSON.stringify(td20));

// GERÇEK SORU: transfer_discounts tablosu stop_type'a göre ayrılmış mı?
// Yoksa sadece time_zone_id ve card_type_id'ye göre mi?
const tdSchema = fdb.prepare("SELECT * FROM transfer_discounts LIMIT 3").all();
console.log('\ntransfer_discounts örnek kayıtlar:', JSON.stringify(tdSchema));

// Kritik: ticket_fares tablosu nasıl yapılandırılmış?
// stop_type aslında TAŞIT TÜRÜNÜ mü temsil ediyor?
// stop_type=1 = otobüs, stop_type=9 = özel/banliyö, stop_type=20 = metro bağlantı?
const stopType20Fares = fdb.prepare('SELECT tf.stop_type, tf.card_type_id, ct.description, tf.time_zone_id, f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id LEFT JOIN card_types ct ON ct.card_type_id=tf.card_type_id WHERE tf.stop_type=20 AND tf.card_type_id IN (1,2,3) AND tf.time_zone_id=3').all();
console.log('\nstop_type=20, card=1,2,3, TZ=3 fiyatlar:', JSON.stringify(stopType20Fares));

// transfer_discounts SADECE time_zone_id + card_type_id ile çalışıyor
// Yani stop_type'a bakılmaksızın aynı indirim uygulanıyor
// AMA: 507'den M2'ye ücretsiz olması için özel bir kural olmalı

// M2 metro = hangi stop_type?
// Eğer M2'nin stop_type'ı farklıysa ve transfer_discounts o stop_type için 0 fare_id dönüyorsa
// o zaman indirim yok anlamına gelir

// Hat 507 zone_id=32 hatları listesi ve stop_type'ları
const zone32Sample = ldb.prepare('SELECT l.line_id, l.name, ls.stop_type FROM lines l JOIN (SELECT line_id, stop_type, COUNT(*) as cnt FROM line_stops GROUP BY line_id, stop_type ORDER BY cnt DESC) ls ON ls.line_id=l.line_id WHERE l.zone_id=32 ORDER BY l.line_id LIMIT 20').all();
console.log('\nZone_id=32 hatlar ve stop_type:', JSON.stringify(zone32Sample));

// Kullanıcının bahsettiği M2 - belki line_id=201 (BATIKENT-KIZILAY-METROBÜS)
// zone_id=9 hatları:
const zone9Info = ldb.prepare('SELECT l.line_id, l.name, l.zone_id FROM lines l WHERE l.zone_id=9').all();
console.log('\nZone_id=9 hatlar:', JSON.stringify(zone9Info));

fdb.close();
ldb.close();
