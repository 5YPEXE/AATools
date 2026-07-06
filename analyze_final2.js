/**
 * subscr_ticket_taken tablosunun kesin anlamını çözme
 * isTransferActive=0 ne demek?
 */
const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=== subscr_ticket_taken ANLAMI ===\n');

// ticket=255 ne anlama geliyor?
// Hat 140 card=2 ticket=255 → 255 genellikle "disabled/invalid" anlamına gelir
// Hat 140 card=2 isTransferActive=0
// Demek ki: Bu hat için ÖĞRENCİ kartı GEÇERSİZ (ticket=255)
const special = fdb.prepare('SELECT stt.*, ct.description, l.name FROM subscr_ticket_taken stt LEFT JOIN card_types ct ON ct.card_type_id=stt.card_type LEFT JOIN line_time_tables ltt ON ltt.line_id=stt.line_id WHERE stt.ticket IN (255, 1) ORDER BY stt.ticket, stt.isTransferActive LIMIT 30').all();
special.forEach(r => console.log(`Hat ${r.line_id}, card=${r.card_type} (${r.description}): ticket=${r.ticket}, isTransferActive=${r.isTransferActive}`));

// ticket=1 + isTransferActive=0 → Bu kart bu hatta geçerli AMA AKTARMA YOK
// ticket=1 + isTransferActive=1 → Bu kart bu hatta geçerli VE AKTARMA VAR
// ticket=255 → Bu kart bu hatta GEÇERSİZ (abonman)

// Hat 507 ÖĞRENCİ: ticket=1, isTransferActive=0
// Bu demek ki: 507 hattı ÖĞRENCİ için geçerli bilet kullanıyor
// AMA bu hat üzerinden aktarma AKTIF DEĞİL (yani 507 üzerinden gelen aktarma indirimi yok)
// Validatörde 507'den M2'ye geçişte:
// 507 validatörü: isTransferActive=0 → aktarma bilgisi kaydedilmez
// M2 validatörü: önceki hat=507, isTransferActive=0 → aktarma geçerliliği kontrol edilmiyor
// Bu durumda M2'de tam ücret veya ayrı bir mekanizma devreye girer

// TERS BAKIŞ: isTransferActive=1 olan hatlar sadece GENİŞLETİLMİŞ SOSYAL ABONMAN
// Bu demek ki: Sadece "GENİŞLETİLMİŞ SOSYAL ABONMAN" kartı için aktarma aktif
// ÖĞRENCİ kartı için subscr_ticket_taken'da aktarma aktif değil
// Peki 507→M2 neden ücretsiz?

// transfer_lines tablosunu inceleyelim - bu gerçek aktarma çiftlerini gösteriyor olabilir
const allTL = fdb.prepare('SELECT * FROM transfer_lines ORDER BY line_id').all();
console.log('\ntransfer_lines tüm içerik:');
allTL.forEach(r => {
  const fromLine = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.line_id);
  const toLine = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.prev_line_id);
  console.log(`  ${r.line_id} (${fromLine?.name?.substring(0,30)}) ← ${r.prev_line_id} (${toLine?.name?.substring(0,30)})`);
});

// 507 veya 902 var mı transfer_lines'ta?
console.log('\n507/902 transfer_lines kontrolü:');
const check = allTL.filter(r => r.line_id === 507 || r.prev_line_id === 507 || r.line_id === 902 || r.prev_line_id === 902);
console.log('Sonuç:', check.length === 0 ? 'YOK - Bu tablo bu çifti içermiyor' : JSON.stringify(check));

// transfer_lines tablosundaki hat isimlerini göster
console.log('\ntransfer_lines hat isimleri:');
allTL.slice(0, 20).forEach(r => {
  const fromLine = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.line_id);
  const toLine = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.prev_line_id);
  console.log(`  ${r.line_id}: ${fromLine?.name?.substring(0,40) || '?'}`);
  console.log(`  ← ${r.prev_line_id}: ${toLine?.name?.substring(0,40) || '?'}`);
  console.log('');
});

// SONUÇ: 507→M2 aktarması hangi tabloda kodlu?
// Muhtemelen doğru cevap şu: Bu aktarma DB'de KODLU DEĞİL
// Validatörler KENT kart sistemi seviyesinde zone bazlı aktarma yapıyor
// EGO otobüsünden Metro'ya aktarma = entegre tarife
// DB bu kuralı içermiyor - firmware/yazılım seviyesinde

// PEKI BUNU NASIL GÖSTERELİM?
// Kullanıcının sorusu: "507→M2 ÖĞRENCİ kartı ücretsiz yapması gerekiyor"
// Bu kuralın nerede tanımlandığını bulmamız gerek

// round_trip_discounts ve round_trip_allowed tablolarını incele
console.log('\n\n=== round_trip_allowed ===');
const rta = fdb.prepare('SELECT * FROM round_trip_allowed LIMIT 10').all();
console.log(JSON.stringify(rta));

console.log('\n=== round_trip_discounts ===');
const rtdSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='round_trip_discounts'").get();
console.log('Şema:', rtdSchema?.sql);
const rtd = fdb.prepare('SELECT * FROM round_trip_discounts LIMIT 10').all();
console.log(JSON.stringify(rtd));

// local_card_types - yerel kart tipleri
console.log('\n=== local_card_types ===');
const lct = fdb.prepare('SELECT * FROM local_card_types LIMIT 20').all();
console.log(JSON.stringify(lct));

// subscr_types
console.log('\n=== subscr_types ===');
const stypes = fdb.prepare('SELECT * FROM subscr_types').all();
console.log(JSON.stringify(stypes));

// card_types_parameters
console.log('\n=== card_types_parameters ===');
const ctpSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='card_types_parameters'").get();
console.log('Şema:', ctpSchema?.sql);
const ctp = fdb.prepare('SELECT * FROM card_types_parameters WHERE card_type_id IN (1,2,3) ORDER BY card_type_id').all();
console.log(JSON.stringify(ctp, null, 2));

fdb.close();
ldb.close();
