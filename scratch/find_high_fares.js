const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

const highFares = faresDb.prepare(`
  SELECT DISTINCT f.fare, tf.stop_type
  FROM ticket_fares tf
  JOIN fares f ON f.fare_id = tf.fare_id
  WHERE tf.card_type_id = 1 AND tf.time_zone_id = 3 AND f.fare > 3500
  ORDER BY f.fare DESC
`).all();

console.log('--- HIGH FARE PRICING TIERS IN DATABASE (> 35 ₺) ---');
highFares.forEach(uf => {
  const sampleLines = linesDb.prepare(`
    SELECT DISTINCT zone_id, line_id, name FROM lines
    WHERE line_id IN (
      SELECT line_id FROM line_stops WHERE stop_type = ?
    ) LIMIT 2
  `).all(uf.stop_type);
  
  console.log(`Fiyat: ${uf.fare/100} ₺ | Stop Type: ${uf.stop_type} | Bölgeler/Örnek Hatlar:`, 
    sampleLines.map(sl => `Bölge ${sl.zone_id} (Hat ${sl.line_id} - ${sl.name})`).join(', ')
  );
});
