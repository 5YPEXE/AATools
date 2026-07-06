const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// Server mantığı: getLineStopType = line_stops'taki en yaygın stop_type
function getLineStopType(lineId) {
  const row = linesDb.prepare(`
    SELECT stop_type, COUNT(*) as cnt
    FROM line_stops WHERE line_id = ?
    GROUP BY stop_type ORDER BY cnt DESC LIMIT 1
  `).get(lineId);
  return row ? row.stop_type : 1;
}

function getTicketFare(stopType, timeZoneId, cardTypeId) {
  const row = faresDb.prepare(`
    SELECT f.fare FROM ticket_fares tf
    JOIN fares f ON f.fare_id = tf.fare_id
    WHERE tf.stop_type = ? AND tf.time_zone_id = ? AND tf.card_type_id = ?
  `).get(stopType, timeZoneId, cardTypeId);
  return row ? row.fare : null;
}

const CARD_TYPE = 1; // TAM KART
const TIME_ZONE = 3; // Salı 09:00 -> TZ 3

const st339 = getLineStopType(339);
const st338 = getLineStopType(338);

console.log('=== 339 -> 338 SENARYO ANALİZİ ===\n');
console.log(`Hat 339: stop_type=${st339}`);
console.log(`Hat 338: stop_type=${st338}`);

const fare339 = getTicketFare(st339, TIME_ZONE, CARD_TYPE);
const fare338 = getTicketFare(st338, TIME_ZONE, CARD_TYPE);

console.log(`\nHat 339 ücreti: ${fare339 !== null ? (fare339/100).toFixed(2) : '?'} ₺`);
console.log(`Hat 338 ücreti: ${fare338 !== null ? (fare338/100).toFixed(2) : '?'} ₺`);

// Özel aktarma kuralı?
const specialRule = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE line_id = 338 AND previous_line_id = 339
`).all();
console.log(`\nÖzel aktarma kuralı (339->338): ${specialRule.length > 0 ? JSON.stringify(specialRule) : 'YOK'}`);

// Genel aktarma indirimi
const genDisc = faresDb.prepare(`SELECT * FROM transfer_discounts WHERE card_type_id = ? AND time_zone_id = ?`).get(CARD_TYPE, TIME_ZONE);
console.log(`Genel aktarma indirimi: percent=${genDisc ? genDisc.percent : '?'}`);

// Hesaplama (percent=254 = genel indirim referansı)
// Server'daki mantık: general transfer fare = getTicketFare(stop_type=67)
// stop_type=67 -> 17.50 TL (TAM KART, TZ3)
const generalTransferFare = getTicketFare(67, TIME_ZONE, CARD_TYPE);
console.log(`\nGenel aktarma ücreti (stop_type=67): ${generalTransferFare !== null ? (generalTransferFare/100).toFixed(2) : '?'} ₺`);

// Fiyat farkı: 338 > 339 mü?
const fareDiff = fare338 - fare339;
console.log(`\nÜcret farkı (338 - 339): ${(fareDiff/100).toFixed(2)} ₺`);

let finalTransferFare;
if (fareDiff > 0) {
  finalTransferFare = generalTransferFare + fareDiff;
  console.log(`338 daha pahalı -> aktarma = ${(generalTransferFare/100).toFixed(2)} + ${(fareDiff/100).toFixed(2)} = ${(finalTransferFare/100).toFixed(2)} ₺`);
} else {
  finalTransferFare = generalTransferFare;
  console.log(`338 eşit/daha ucuz -> aktarma = ${(generalTransferFare/100).toFixed(2)} ₺`);
}

const total = fare339 + finalTransferFare;
const screenTotal = 5250; // 52.50 TL

console.log('\n=== SONUÇ ===');
console.log(`Ekrandaki değer:         52.50 ₺`);
console.log(`Hesaplanan 1. ücret:     ${(fare339/100).toFixed(2)} ₺`);
console.log(`Hesaplanan aktarma:      ${(finalTransferFare/100).toFixed(2)} ₺`);
console.log(`Hesaplanan TOPLAM:       ${(total/100).toFixed(2)} ₺`);
console.log(`\n${Math.abs(total - screenTotal) < 1 ? '✅ DOĞRU - Hesaplama eşleşiyor' : '❌ HATALI - Fark: ' + ((total - screenTotal)/100).toFixed(2) + ' ₺'}`);
