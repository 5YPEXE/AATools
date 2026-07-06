const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// 1. Find all ticket fares for card_type_id = 1, time_zone_id = 3
// Let's see what unique fares exist in the database (shows all different price levels!)
const uniqueFares = faresDb.prepare(`
  SELECT DISTINCT f.fare, tf.stop_type
  FROM ticket_fares tf
  JOIN fares f ON f.fare_id = tf.fare_id
  WHERE tf.card_type_id = 1 AND tf.time_zone_id = 3
  ORDER BY f.fare DESC
`).all();

console.log('--- ALL UNIQUE PRICE LEVELS IN DB (TAM KART) ---');
uniqueFares.forEach(uf => {
  // Find which zones use this stop type
  const sampleLines = linesDb.prepare(`
    SELECT DISTINCT zone_id, line_id, name FROM lines
    WHERE line_id IN (
      SELECT line_id FROM line_stops WHERE stop_type = ?
    ) LIMIT 2
  `).all(uf.stop_type);
  
  console.log(`Fare: ${uf.fare/100} ₺ | Stop Type: ${uf.stop_type} | Zones/Lines using it:`, 
    sampleLines.map(sl => `Zone ${sl.zone_id} (Line ${sl.line_id} - ${sl.name})`).join(', ')
  );
});
