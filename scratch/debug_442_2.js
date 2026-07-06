const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

const l902 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 902").get();
const l442 = linesDb.prepare("SELECT * FROM lines WHERE line_id = 442").get();
console.log('Line 902 zone:', l902.zone_id, 'Line 442 zone:', l442.zone_id);

const mf902 = faresDb.prepare("SELECT * FROM line_manual_fare WHERE line_id = 902").get();
const mf442 = faresDb.prepare("SELECT * FROM line_manual_fare WHERE line_id = 442").get();
console.log('Manual fare 902:', mf902);
console.log('Manual fare 442:', mf442);

if (mf442) {
  const mFares = faresDb.prepare("SELECT * FROM manual_fares WHERE manual_fare_table_id = ?").all(mf442.manual_fare_table_id);
  console.log('Manual fares for 442:', mFares);
}

// Get the base ticket fares for card_type_id = 1
const st902 = linesDb.prepare("SELECT DISTINCT stop_type FROM line_stops WHERE line_id = 902").all().map(r => r.stop_type);
const st442 = linesDb.prepare("SELECT DISTINCT stop_type FROM line_stops WHERE line_id = 442").all().map(r => r.stop_type);
console.log('Stop types 902:', st902, '442:', st442);

// Time zones for Tuesday 09:00
const wtt902 = faresDb.prepare("SELECT weekly_time_table_id FROM line_time_tables WHERE line_id = 902 AND direction = 0").get()?.weekly_time_table_id;
const wtt442 = faresDb.prepare("SELECT weekly_time_table_id FROM line_time_tables WHERE line_id = 442 AND direction = 0").get()?.weekly_time_table_id;

const dt902 = faresDb.prepare("SELECT daily_time_table_id FROM weekly_time_tables WHERE weekly_time_table_id = ? AND weekday_id = 1").get(wtt902)?.daily_time_table_id;
const dt442 = faresDb.prepare("SELECT daily_time_table_id FROM weekly_time_tables WHERE weekly_time_table_id = ? AND weekday_id = 1").get(wtt442)?.daily_time_table_id;

const tz902 = faresDb.prepare("SELECT time_zone_id FROM daily_time_tables WHERE daily_time_table_id = ? AND time_point <= 540 ORDER BY time_point DESC LIMIT 1").get(dt902)?.time_zone_id;
const tz442 = faresDb.prepare("SELECT time_zone_id FROM daily_time_tables WHERE daily_time_table_id = ? AND time_point <= 540 ORDER BY time_point DESC LIMIT 1").get(dt442)?.time_zone_id;

console.log('TZ IDs 902:', tz902, '442:', tz442);

const f902 = faresDb.prepare("SELECT * FROM ticket_fares WHERE stop_type = ? AND time_zone_id = ? AND card_type_id = 1").get(st902[0], tz902);
const f442 = faresDb.prepare("SELECT * FROM ticket_fares WHERE stop_type = ? AND time_zone_id = ? AND card_type_id = 1").get(st442[0], tz442);

console.log('Fare entry 902:', f902, f902 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(f902.fare_id) : 'none');
console.log('Fare entry 442:', f442, f442 ? faresDb.prepare("SELECT fare FROM fares WHERE fare_id = ?").get(f442.fare_id) : 'none');

// Check transfers from 902's zone to 442's zone (previous_line_id = 902's zone to line_id = 442's zone)
const rules = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(l902.zone_id, l442.zone_id);
console.log('Rules from M2 zone to 442 zone:', rules);

const rules2 = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE previous_line_id = ? AND line_id = ?").all(l442.zone_id, l902.zone_id);
console.log('Rules from 442 zone to M2 zone:', rules2);

faresDb.close();
linesDb.close();
