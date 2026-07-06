const Database = require('better-sqlite3');
const path = require('path');

const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

function getLineInfo(lineId) {
  const line = linesDb.prepare('SELECT * FROM lines WHERE line_id = ?').get(lineId);
  if (!line) return null;
  // Get stop type
  const stopTypeRow = linesDb.prepare(`
    SELECT stop_type, COUNT(*) as cnt
    FROM line_stops WHERE line_id = ?
    GROUP BY stop_type ORDER BY cnt DESC LIMIT 1
  `).get(lineId);
  const stopType = stopTypeRow ? stopTypeRow.stop_type : 1;
  return { ...line, stopType };
}

const line201 = getLineInfo(201);
const line354 = getLineInfo(354);
const line110 = getLineInfo(110);

console.log('--- LINE INFO ---');
console.log('201:', line201);
console.log('354:', line354);
console.log('110:', line110);

// Base fares for card_type_id = 1 (TAM KART), time_zone_id = 3 (from image, TZ 3)
const cardTypeId = 1;
const timeZoneId = 3;

function getFare(stopType) {
  const row = faresDb.prepare(`
    SELECT f.fare, tf.fare_id FROM ticket_fares tf
    JOIN fares f ON f.fare_id = tf.fare_id
    WHERE tf.stop_type = ? AND tf.time_zone_id = ? AND tf.card_type_id = ?
  `).get(stopType, timeZoneId, cardTypeId);
  return row;
}

console.log('\n--- FARES (TAM KART, TZ 3) ---');
console.log('201 Fare:', getFare(line201.stopType));
console.log('354 Fare:', getFare(line354.stopType));
console.log('110 Fare:', getFare(line110.stopType));

// Transfer rules
console.log('\n--- TRANSFER RULES 201 -> 354 ---');
const rules1 = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE previous_line_id = ? AND line_id = ?
`).all(line201.zone_id, line354.zone_id);
console.log(rules1);

console.log('\n--- TRANSFER RULES 354 -> 110 ---');
const rules2 = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE previous_line_id = ? AND line_id = ?
`).all(line354.zone_id, line110.zone_id);
console.log(rules2);

// Let's also check if there are direct rules for 201 -> 110
console.log('\n--- TRANSFER RULES 201 -> 110 ---');
const rules3 = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE previous_line_id = ? AND line_id = ?
`).all(line201.zone_id, line110.zone_id);
console.log(rules3);
