const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

// Hat 507
const line507 = ldb.prepare('SELECT * FROM lines WHERE line_id=507').get();
console.log('Hat 507:', JSON.stringify(line507));

// Tüm hatlar içinde metro benzeri olanlar
const allLines = ldb.prepare('SELECT * FROM lines ORDER BY line_id').all();
const metroLike = allLines.filter(l => {
  const n = (l.name || '').toUpperCase();
  return n.includes('M1') || n.includes('M2') || n.includes('M3') || n.includes('M4') ||
         n.includes('METRO') || n.includes('ANKARAY') || n.includes('A1') ||
         n.includes('KIZILAY') || n.includes('BATI') || n.includes('KEÇIÖREN');
});
console.log('\nMetro/Raylı hatlar:', JSON.stringify(metroLike, null, 2));

// stop_type farklılıklarını da incele
console.log('\nFarklı stop_type değerleri:');
const stopTypes = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops GROUP BY stop_type ORDER BY stop_type').all();
console.log(JSON.stringify(stopTypes));

// Hat 507 stop_type
if (line507) {
  const st507 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=507 GROUP BY stop_type ORDER BY cnt DESC').all();
  console.log('\nHat 507 stop_types:', JSON.stringify(st507));
}

// M2 / Ankaray / Metro hattı stop_type
// Önce line_id'si 5000-6000 arasındaki hatları dene (genellikle metro ayrı segmentte olur)
const bigLines = ldb.prepare('SELECT * FROM lines WHERE line_id > 1000 ORDER BY line_id LIMIT 50').all();
console.log('\nline_id > 1000 hatlar:', JSON.stringify(bigLines));

// Tüm zone_id değerleri
const zones = ldb.prepare('SELECT zone_id, COUNT(*) as cnt FROM lines GROUP BY zone_id ORDER BY zone_id').all();
console.log('\nZone dağılımı:', JSON.stringify(zones));

// Zone > 1 hatlar (metro farklı zone'da olabilir)
const highZone = ldb.prepare('SELECT * FROM lines WHERE zone_id > 1 ORDER BY line_id').all();
console.log('\nZone > 1 hatlar:', JSON.stringify(highZone));

fdb.close();
ldb.close();
