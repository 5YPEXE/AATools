const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

console.log('--- LINE DETAILS ---');
const l902 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 902").get();
const l442 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 442").get();
console.log('Line 902:', l902);
console.log('Line 442:', l442);

// Check if they have manual fares
const mf902 = faresDb.prepare("SELECT * FROM line_manual_fare WHERE line_id = 902").get();
const mf442 = faresDb.prepare("SELECT * FROM line_manual_fare WHERE line_id = 442").get();
console.log('Manual fare 902:', mf902);
console.log('Manual fare 442:', mf442);

if (mf442) {
  // If manual fare exists, print manual fare tables content
  try {
    const tableRows = faresDb.prepare("SELECT * FROM manual_fares WHERE manual_fare_table_id = ?").all(mf442.manual_fare_table_id);
    console.log('Manual fares table for 442:', tableRows);
  } catch(e) {
    console.log('No manual_fares table or error:', e.message);
  }
}

// Let's check stop type
const st902 = linesDb.prepare("SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id = 902 GROUP BY stop_type").all();
const st442 = linesDb.prepare("SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id = 442 GROUP BY stop_type").all();
console.log('Stop types 902:', st902);
console.log('Stop types 442:', st442);

// Ticket fares for card 1 (TAM KART), weekday 1 (Tuesday), time 09:00 (540 minutes)
console.log('\n--- TIME ZONE & FARE CALCULATIONS FOR TUESDAY 09:00 (540 MIN) ---');
function getWeeklyTTId(db, lineId) {
  const row = db.prepare('SELECT weekly_time_table_id FROM line_time_tables WHERE line_id = ? AND direction = 0').get(lineId);
  return row ? row.weekly_time_table_id : null;
}
function getTimeZoneId(db, wttId, weekday, timeMin) {
  const dayRow = db.prepare('SELECT daily_time_table_id FROM weekly_time_tables WHERE weekly_time_table_id = ? AND weekday_id = ?').get(wttId, weekday);
  if (!dayRow) return null;
  const tp = db.prepare('SELECT time_point, time_zone_id FROM daily_time_tables WHERE daily_time_table_id = ? AND time_point <= ? ORDER BY time_point DESC LIMIT 1').get(dayRow.daily_time_table_id, timeMin);
  return tp ? tp.time_zone_id : null;
}

const wtt902 = getWeeklyTTId(faresDb, 902);
const wtt442 = getWeeklyTTId(faresDb, 442);
const tz902 = getTimeZoneId(faresDb, wtt902, 1, 540);
const tz442 = getTimeZoneId(faresDb, wtt442, 1, 540);
console.log(`902 WTT: ${wtt902}, TZ: ${tz902}`);
console.log(`442 WTT: ${wtt442}, TZ: ${tz442}`);

const fare902 = faresDb.prepare("SELECT * FROM ticket_fares WHERE stop_type = ? AND time_zone_id = ? AND card_type_id = 1").get(st902[0].stop_type, tz902);
const fare442 = faresDb.prepare("SELECT * FROM ticket_fares WHERE stop_type = ? AND time_zone_id = ? AND card_type_id = 1").get(st442[0].stop_type, tz442);
console.log('Ticket fare entry 902:', fare902, fare902 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(fare902.fare_id) : 'N/A');
console.log('Ticket fare entry 442:', fare442, fare442 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(fare442.fare_id) : 'N/A');

// Let's check general transfer discount for TZ of 442 and card 1
console.log('\n--- GENERAL TRANSFER DISCOUNT FOR 442 ZONE & CARD 1 ---');
const genDisc = faresDb.prepare("SELECT * FROM transfer_discounts WHERE time_zone_id = ? AND card_type_id = 1").get(tz442);
console.log('General transfer discount for TZ', tz442, ':', genDisc);
if (genDisc) {
  console.log('Resolved discount fare:', faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(genDisc.percent));
}

// Let's check if there are specific transfer rules between zone of 902 (zone_id 9) and 442 (zone_id 27)
console.log('\n--- SPECIFIC TRANSFER RULES BETWEEN 902 (zone_id = 9) AND 442 (zone_id = 27) ---');
const rules = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(9, 27);
console.log('Rules where previous_line_id = 9 and line_id = 27 (from M2 to 442):', rules);

const rulesRev = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(27, 9);
console.log('Rules where previous_line_id = 27 and line_id = 9 (from 442 to M2):', rulesRev);

// Let's check if 442 (zone_id = 27) has ANY specific transfer rules defined at all!
const rulesAny442 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE line_id = 27 OR previous_line_id = 27").all();
console.log('Any transfer rules involving zone 27:', rulesAny442);

// Check if there is some other table or logic we are missing, e.g. does 442 belong to a special zone, or how does manual fare table work?
if (mf442) {
  console.log('\n--- MANUAL FARE TABLES SCHEMA ---');
  try {
    const tableInfo = faresDb.prepare("PRAGMA table_info(manual_fares)").all();
    console.log(tableInfo);
    const tableInfo2 = faresDb.prepare("PRAGMA table_info(line_manual_fare)").all();
    console.log(tableInfo2);
  } catch(e) {
    console.log(e.message);
  }
}

faresDb.close();
linesDb.close();
