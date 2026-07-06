const Database = require('better-sqlite3');
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// Zone'ların hangi sırayla geldiğini ve hat sayısını göster
const zones = linesDb.prepare(`
  SELECT zone_id, COUNT(*) as line_count
  FROM lines
  GROUP BY zone_id
  ORDER BY line_count DESC
`).all();

console.log('--- ZONE SIRASI (Hat Sayısına Göre Azalan) ---');
zones.forEach(z => {
  console.log(`Zone ${z.zone_id}: ${z.line_count} hat`);
});
