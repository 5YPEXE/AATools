/**
 * Validatör Aktarma Formülü Analizi
 * 
 * Gerçek formül (kullanıcı tarafından doğrulandı):
 *   transferFare = max(0, secondLineFare - firstLineFare) + baseTransferFee
 * 
 * Örnekler:
 *   35 → 69: max(0, 69-35) + 17 = 34 + 17 = 51₺
 *   69 → 35: max(0, 35-69) + 17 = 0  + 17 = 17₺
 *   35 → 35: max(0, 35-35) + 17 = 0  + 17 = 17₺
 */

const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// ── Yardımcı fonksiyonlar ──────────────────────────────────

function getLineStopType(lineId) {
  const row = linesDb.prepare(`
    SELECT stop_type, COUNT(*) as cnt FROM line_stops
    WHERE line_id=? GROUP BY stop_type ORDER BY cnt DESC LIMIT 1
  `).get(lineId);
  return row ? row.stop_type : 1;
}

function getWeeklyTTId(lineId) {
  const row = faresDb.prepare(`SELECT weekly_time_table_id FROM line_time_tables WHERE line_id=? AND direction=0 LIMIT 1`).get(lineId);
  return row ? row.weekly_time_table_id : 1;
}

function getTimeZoneId(weeklyTTId, weekday, timeMinutes) {
  const dayRow = faresDb.prepare(`SELECT daily_time_table_id FROM weekly_time_tables WHERE weekly_time_table_id=? AND weekday_id=? LIMIT 1`).get(weeklyTTId, weekday);
  if (!dayRow) return 0;
  const timePoints = faresDb.prepare(`SELECT time_point, time_zone_id FROM daily_time_tables WHERE daily_time_table_id=? ORDER BY time_point DESC`).all(dayRow.daily_time_table_id);
  for (const tp of timePoints) { if (timeMinutes >= tp.time_point) return tp.time_zone_id; }
  return 0;
}

function getTicketFare(stopType, tzId, cardTypeId) {
  const row = faresDb.prepare(`SELECT f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id WHERE tf.stop_type=? AND tf.time_zone_id=? AND tf.card_type_id=? LIMIT 1`).get(stopType, tzId, cardTypeId);
  return row ? row.fare : null;
}

function getGeneralTransferFareId(tzId, cardTypeId) {
  const row = faresDb.prepare(`SELECT percent FROM transfer_discounts WHERE time_zone_id=? AND card_type_id=? LIMIT 1`).get(tzId, cardTypeId);
  return row ? row.percent : 0;
}

function getFareById(fareId) {
  if (!fareId) return null;
  const row = faresDb.prepare(`SELECT fare FROM fares WHERE fare_id=? LIMIT 1`).get(fareId);
  return row ? row.fare : null;
}

/**
 * Validatör formülü:
 *   transferFare = max(0, secondFare - firstFare) + baseTransferFee
 * 
 * percent=0 ise transfer yasak (tam ücret).
 */
function calcValidatorTransferFare(firstFare, secondFare, percent, baseTransferFee) {
  if (percent === 0) return secondFare; // Aktarma yasak
  const diff = Math.max(0, secondFare - firstFare);
  return diff + (baseTransferFee ?? 0);
}

// ── Tüm zone çiftlerini al ─────────────────────────────────

const CARD_TYPE = 1; // TAM KART
const WEEKDAY   = 1; // Salı
const HOUR      = 9; // 09:00 → TZ3 (sabah pik)
const MINUTES   = HOUR * 60;

const allRules = faresDb.prepare(`
  SELECT DISTINCT line_id, previous_line_id, percent, discount_type, interval, transfer_num
  FROM transfers_according_to_previous_line
  ORDER BY previous_line_id, line_id, transfer_num
`).all();

// Zone → örnek hat mapping (her zone'dan bir hat seç)
const zoneToLine = {};
const allLines = linesDb.prepare(`SELECT line_id, zone_id FROM lines WHERE zone_id IS NOT NULL ORDER BY zone_id, line_id`).all();
for (const l of allLines) {
  if (!zoneToLine[l.zone_id]) zoneToLine[l.zone_id] = l.line_id;
}

console.log(`\n${'='.repeat(100)}`);
console.log('VALIDATÖR FORMÜLÜ ANALİZİ — TAM KART, Salı 09:00');
console.log(`Formül: transferFare = max(0, 2.hat_ücreti - 1.hat_ücreti) + genel_aktarma_ücreti`);
console.log(`${'='.repeat(100)}\n`);

// Benzersiz zone çiftleri için analiz
const uniquePairs = [...new Set(allRules.filter(r => r.transfer_num === 1).map(r => `${r.previous_line_id}→${r.line_id}`))];
console.log(`Toplam benzersiz zone çifti (transfer_num=1): ${uniquePairs.length}\n`);

const results = [];

for (const rule of allRules.filter(r => r.transfer_num === 1)) {
  const fromZone = rule.previous_line_id;
  const toZone   = rule.line_id;

  // Her zone'dan bir örnek hat
  const fromLineId = zoneToLine[fromZone];
  const toLineId   = zoneToLine[toZone];

  if (!fromLineId || !toLineId) continue;

  const fromWTT    = getWeeklyTTId(fromLineId);
  const toWTT      = getWeeklyTTId(toLineId);
  const fromTZ     = getTimeZoneId(fromWTT, WEEKDAY, MINUTES);
  const toTZ       = getTimeZoneId(toWTT, WEEKDAY, MINUTES);
  const fromST     = getLineStopType(fromLineId);
  const toST       = getLineStopType(toLineId);
  const fromFare   = getTicketFare(fromST, fromTZ, CARD_TYPE);
  const toFare     = getTicketFare(toST, toTZ, CARD_TYPE);
  const baseFareId = getGeneralTransferFareId(toTZ, CARD_TYPE);
  const baseFare   = getFareById(baseFareId);

  const validatorFare = calcValidatorTransferFare(fromFare ?? 0, toFare ?? 0, rule.percent, baseFare ?? 0);
  const diff          = Math.max(0, (toFare ?? 0) - (fromFare ?? 0));
  const totalFare     = (fromFare ?? 0) + validatorFare;

  results.push({
    fromZone, toZone,
    fromLineId, toLineId,
    fromFare, toFare,
    baseFare, baseFareId,
    percent: rule.percent,
    discount_type: rule.discount_type,
    diff,
    validatorFare,
    totalFare,
    fromTZ, toTZ,
  });
}

// ── Gruplama: farklı percent değerleri ──────────────────────
const byPercent = {};
for (const r of results) {
  const k = String(r.percent);
  if (!byPercent[k]) byPercent[k] = [];
  byPercent[k].push(r);
}

console.log('PERCENT DEĞERLERİNE GÖRE GRUPLAMA:\n');
for (const [pct, rows] of Object.entries(byPercent)) {
  console.log(`  percent=${pct}: ${rows.length} kural`);
}
console.log('');

// ── Aktarma ücretlerinin dağılımı ─────────────────────────
console.log('AKTARMA ÜCRETİ DAĞILIMI (validatör formülü):\n');
const fareGroups = {};
for (const r of results) {
  const k = r.validatorFare;
  fareGroups[k] = (fareGroups[k] || 0) + 1;
}
for (const [fare, cnt] of Object.entries(fareGroups).sort((a,b)=>Number(a[0])-Number(b[0]))) {
  console.log(`  ${(fare/100).toFixed(2)}₺: ${cnt} hat çifti`);
}
console.log('');

// ── İlginç senaryolar ─────────────────────────────────────
console.log('İLGİNÇ SENARYOLAR:\n');

// 1. Fark ödeyen (pahalı hatta geçen)
const withDiff = results.filter(r => r.diff > 0 && r.percent !== 0);
console.log(`[1] Fark ödeyen (2.hat daha pahalı): ${withDiff.length} çift`);
withDiff.slice(0, 10).forEach(r => {
  console.log(`    Z${r.fromZone}→Z${r.toZone} | ${(r.fromFare/100).toFixed(2)}₺→${(r.toFare/100).toFixed(2)}₺ | fark=${((r.toFare-r.fromFare)/100).toFixed(2)}₺ | aktarma=${(r.validatorFare/100).toFixed(2)}₺ | toplam=${(r.totalFare/100).toFixed(2)}₺`);
});
if (withDiff.length > 10) console.log(`    ... ve ${withDiff.length-10} tane daha`);

// 2. Sadece base fee (fark yok veya 2.hat ucuz)
const baseOnly = results.filter(r => r.diff === 0 && r.percent !== 0 && r.baseFare !== null);
console.log(`\n[2] Sadece base fee ödeyen (fark yok): ${baseOnly.length} çift`);
baseOnly.slice(0, 10).forEach(r => {
  console.log(`    Z${r.fromZone}→Z${r.toZone} | ${(r.fromFare/100).toFixed(2)}₺→${(r.toFare/100).toFixed(2)}₺ | aktarma=${(r.validatorFare/100).toFixed(2)}₺`);
});

// 3. percent=0 (transfer yasak)
const blocked = results.filter(r => r.percent === 0);
console.log(`\n[3] Aktarma yasak (percent=0): ${blocked.length} çift`);
blocked.slice(0, 5).forEach(r => {
  console.log(`    Z${r.fromZone}→Z${r.toZone} | ${(r.fromFare/100).toFixed(2)}₺→${(r.toFare/100).toFixed(2)}₺`);
});

// 4. percent=10 (339→338 gibi) — formülle hesap
const pct10 = results.filter(r => r.percent === 10);
console.log(`\n[4] percent=10 kuralları (${pct10.length} çift):`);
pct10.forEach(r => {
  console.log(`    Z${r.fromZone}→Z${r.toZone} | 1.hat=${(r.fromFare/100).toFixed(2)}₺ 2.hat=${(r.toFare/100).toFixed(2)}₺ base=${r.baseFare!==null?(r.baseFare/100).toFixed(2):'?'}₺ | formül: max(0,${(r.toFare/100).toFixed(2)}-${(r.fromFare/100).toFixed(2)})+(${r.baseFare!==null?(r.baseFare/100).toFixed(2):'?'}) = ${(r.validatorFare/100).toFixed(2)}₺`);
});

// 5. Tüm unique (fromFare, toFare, baseFare) kombinasyonları
console.log('\n[5] BASE TRANSFER FEE değerleri (fare_id referansları):\n');
const baseGroups = {};
for (const r of results) {
  const k = r.baseFareId;
  if (!baseGroups[k]) baseGroups[k] = { fareId: r.baseFareId, fare: r.baseFare, count: 0 };
  baseGroups[k].count++;
}
for (const [k, v] of Object.entries(baseGroups)) {
  console.log(`    fare_id=${v.fareId} → ${v.fare !== null ? (v.fare/100).toFixed(2)+'₺' : 'null'} (${v.count} kural)`);
}

// 6. Özet istatistik
const validRules = results.filter(r => r.percent !== 0);
console.log(`\n${'='.repeat(100)}`);
console.log('ÖZET:');
console.log(`  Toplam analiz edilen kural (transfer_num=1): ${results.length}`);
console.log(`  Aktarma yapılabilen (percent!=0): ${validRules.length}`);
console.log(`  Aktarma yasak (percent=0): ${blocked.length}`);
console.log(`  Fark ödenen (2.hat daha pahalı): ${withDiff.length}`);
console.log(`  Sadece base fee (2.hat ucuz/eşit): ${baseOnly.length}`);
console.log(`  Min aktarma ücreti: ${validRules.length > 0 ? ((Math.min(...validRules.map(r=>r.validatorFare)))/100).toFixed(2)+'₺' : 'N/A'}`);
console.log(`  Max aktarma ücreti: ${validRules.length > 0 ? ((Math.max(...validRules.map(r=>r.validatorFare)))/100).toFixed(2)+'₺' : 'N/A'}`);
console.log(`${'='.repeat(100)}\n`);
