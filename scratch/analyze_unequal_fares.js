const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// Sadece ilk truncated kısımları göster
const allRules = faresDb.prepare(`
  SELECT DISTINCT line_id, previous_line_id, percent, discount_type, interval, transfer_num
  FROM transfers_according_to_previous_line ORDER BY percent, transfer_num
`).all();

console.log('PERCENT DEĞERLERİNE GÖRE GRUPLAMA (TÜM transfer_num):');
const byPercent = {};
for (const r of allRules) {
  const k = `percent=${r.percent}`;
  if (!byPercent[k]) byPercent[k] = { count: 0, discount_types: new Set(), transfer_nums: new Set() };
  byPercent[k].count++;
  byPercent[k].discount_types.add(String(r.discount_type));
  byPercent[k].transfer_nums.add(r.transfer_num);
}
for (const [k, v] of Object.entries(byPercent)) {
  console.log(`  ${k}: ${v.count} kural | discount_type değerleri: [${[...v.discount_types].join(', ')}] | transfer_num: [${[...v.transfer_nums].join(', ')}]`);
}

// Eşit olmayan fiyatlı çiftlerin özeti
console.log('\nEŞİT OLMAYAN FİYATLI ÇİFTLER (zone bazında):');
const zoneToLine = {};
const allLines = linesDb.prepare(`SELECT line_id, zone_id FROM lines WHERE zone_id IS NOT NULL ORDER BY zone_id, line_id`).all();
for (const l of allLines) { if (!zoneToLine[l.zone_id]) zoneToLine[l.zone_id] = l.line_id; }
function getLineStopType(lineId) {
  const row = linesDb.prepare(`SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=? GROUP BY stop_type ORDER BY cnt DESC LIMIT 1`).get(lineId);
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

const uniqueZonePairs = [...new Set(allRules.filter(r=>r.transfer_num===1).map(r=>`${r.previous_line_id},${r.line_id}`))];
const unequalFares = [];
for (const pair of uniqueZonePairs) {
  const [fz, tz] = pair.split(',').map(Number);
  const fl = zoneToLine[fz], tl = zoneToLine[tz];
  if (!fl || !tl) continue;
  const fST = getLineStopType(fl), tST = getLineStopType(tl);
  const fWTT = getWeeklyTTId(fl), tWTT = getWeeklyTTId(tl);
  const fTZ = getTimeZoneId(fWTT, 1, 540), tTZ = getTimeZoneId(tWTT, 1, 540);
  const fFare = getTicketFare(fST, fTZ, 1), tFare = getTicketFare(tST, tTZ, 1);
  if (fFare !== tFare && fFare !== null && tFare !== null) {
    const rule = allRules.find(r => r.previous_line_id===fz && r.line_id===tz && r.transfer_num===1);
    const diff = Math.max(0, tFare-fFare);
    const baseFare = 1750; // 17.50₺
    unequalFares.push({ fz, tz, fl, tl, fFare, tFare, diff, validatorFare: diff+baseFare, percent: rule?.percent });
  }
}
unequalFares.sort((a,b) => b.validatorFare - a.validatorFare);
console.log(`Toplam eşit olmayan fiyatlı çift: ${unequalFares.length}`);
unequalFares.forEach(r => {
  const direction = r.fFare < r.tFare ? '↑ PAHALI' : '↓ UCUZ';
  console.log(`  Z${r.fz}→Z${r.tz} (hat ${r.fl}→${r.tl}) | ${(r.fFare/100).toFixed(2)}₺→${(r.tFare/100).toFixed(2)}₺ ${direction} | aktarma=${((r.diff+1750)/100).toFixed(2)}₺ | toplam=${((r.fFare+r.diff+1750)/100).toFixed(2)}₺ | percent=${r.percent}`);
});
