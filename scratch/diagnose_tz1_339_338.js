const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

function getLineStopType(lineId) {
  const row = linesDb.prepare(`
    SELECT stop_type, COUNT(*) as cnt FROM line_stops
    WHERE line_id = ? GROUP BY stop_type ORDER BY cnt DESC LIMIT 1
  `).get(lineId);
  return row ? row.stop_type : 1;
}

function getTicketFare(stopType, tzId, cardTypeId) {
  const row = faresDb.prepare(`
    SELECT f.fare FROM ticket_fares tf
    JOIN fares f ON f.fare_id = tf.fare_id
    WHERE tf.stop_type = ? AND tf.time_zone_id = ? AND tf.card_type_id = ?
  `).get(stopType, tzId, cardTypeId);
  return row ? row.fare : null;
}

const CARD = 1; // TAM KART
const TZ1 = 1;  // 06:00 -> TZ 1

const st339 = getLineStopType(339);
const st338 = getLineStopType(338);

console.log('=== TZ1 (saat 06:00) DURUM ANALİZİ ===\n');

// 1. Hat ücretleri TZ1'de
const fare339_tz1 = getTicketFare(st339, TZ1, CARD);
const fare338_tz1 = getTicketFare(st338, TZ1, CARD);
console.log(`Hat 339 (stop_type=${st339}), TZ1: ${fare339_tz1 !== null ? (fare339_tz1/100).toFixed(2) : '?'} ₺`);
console.log(`Hat 338 (stop_type=${st338}), TZ1: ${fare338_tz1 !== null ? (fare338_tz1/100).toFixed(2) : '?'} ₺`);

// 2. TZ1 genel aktarma indirimi
const td_tz1 = faresDb.prepare(`SELECT * FROM transfer_discounts WHERE card_type_id=? AND time_zone_id=?`).get(CARD, TZ1);
console.log(`\nTZ1 genel aktarma indirimi: percent=${td_tz1?.percent}`);

// 3. stop_type=67 TZ1'de ne veriyor? (genel aktarma ücreti)
const generalFare_tz1 = getTicketFare(67, TZ1, CARD);
console.log(`stop_type=67, TZ1, TAM KART -> ${generalFare_tz1 !== null ? (generalFare_tz1/100).toFixed(2) : '?'} ₺`);

// 4. Sistemimizin hesabı
console.log('\n--- Sistemimizin hesabı (mevcut) ---');
const transferFare = generalFare_tz1 ?? 0;
const total = (fare339_tz1 ?? 0) + transferFare;
console.log(`1. hat ücreti:   ${((fare339_tz1 ?? 0)/100).toFixed(2)} ₺`);
console.log(`Aktarma ücreti:  ${(transferFare/100).toFixed(2)} ₺  <-- BU YANLIŞ OLMALI`);
console.log(`TOPLAM:          ${(total/100).toFixed(2)} ₺`);

// 5. Doğru hesap (ücretsiz aktarma)
console.log('\n--- Doğru hesap (ücretsiz aktarma olursa) ---');
console.log(`1. hat ücreti:   ${((fare339_tz1 ?? 0)/100).toFixed(2)} ₺`);
console.log(`Aktarma ücreti:  0.00 ₺`);
console.log(`TOPLAM:          ${((fare339_tz1 ?? 0)/100).toFixed(2)} ₺`);

// 6. Gerçek validatör davranışı (kullanıcı bildirimine göre)
console.log('\n--- Gerçek validatör davranışı (kullanıcı bildirimine göre) ---');
console.log(`1. tap (339):    25.00 ₺`);
console.log(`2. tap (338):    25.00 ₺  <-- Aktarma uygulanmıyor, tam fiyat kesiyor`);
console.log(`TOPLAM:          50.00 ₺`);

// 7. Özet: 3 farklı değer karşılaştırması
console.log('\n=== 3 SENARYO KARŞILAŞTIRMASI ===');
console.log(`Olması gereken:  25₺ + 0₺  = 25.00₺  (ücretsiz aktarma)`);
console.log(`Gerçek validatör: 25₺ + 25₺ = 50.00₺  (aktarma hiç uygulanmıyor)`);
console.log(`Sistemimiz:      25₺ + 12.50₺ = 37.50₺  (yarı fiyat aktarma - DB'deki genel kural)`);

// 8. DB'de ücretsiz aktarma kuralı var mı?
console.log('\n=== DB\'de ücretsiz aktarma kuralı var mı? ===');
const freeRule = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE line_id = 338 AND previous_line_id = 339
`).get();
console.log(`transfers_according_to_previous_line (339->338): ${freeRule ? JSON.stringify(freeRule) : 'KAYIT YOK'}`);
console.log(`transfer_lines tablosu toplam kayıt: ${faresDb.prepare('SELECT COUNT(*) as c FROM transfer_lines').get().c}`);

// 9. Ücretsiz aktarma nasıl tanımlanır? percent=0 olan kurallar hangi hatlarda?
console.log('\n=== percent=0 olan hatların örnekleri (ücretsiz aktarma) ===');
const zeroPct = faresDb.prepare(`
  SELECT line_id, previous_line_id, transfer_num, interval FROM transfers_according_to_previous_line
  WHERE percent = 0 LIMIT 10
`).all();
if (zeroPct.length === 0) {
  console.log('DB\'de hiç percent=0 (ücretsiz) özel aktarma kuralı yok!');
} else {
  zeroPct.forEach(r => console.log(`  ${r.previous_line_id} -> ${r.line_id} | transfer_num=${r.transfer_num}`));
}
