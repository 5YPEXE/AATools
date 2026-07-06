const Database = require('better-sqlite3');

// Fares DB - daha fazla detay
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('=== FARES DB - Tüm tablolar ve satır sayıları ===');
const faresTables = faresDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
faresTables.forEach(t => {
  const count = faresDb.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get();
  console.log(`  ${t.name}: ${count.cnt} satır`);
});

console.log('\n=== ticket_fares - Distinct stop_type ve time_zone_id değerleri ===');
const stopTypes = faresDb.prepare("SELECT DISTINCT stop_type FROM ticket_fares ORDER BY stop_type").all();
console.log('stop_type values:', stopTypes.map(r => r.stop_type));

const timeZones = faresDb.prepare("SELECT DISTINCT time_zone_id FROM ticket_fares ORDER BY time_zone_id").all();
console.log('time_zone_id values:', timeZones.map(r => r.time_zone_id));

const cardTypes = faresDb.prepare("SELECT DISTINCT card_type_id FROM ticket_fares ORDER BY card_type_id LIMIT 30").all();
console.log('card_type_id values (first 30):', cardTypes.map(r => r.card_type_id));

console.log('\n=== fares tablosu - tüm kayıtlar ===');
const allFares = faresDb.prepare("SELECT * FROM fares ORDER BY fare_id LIMIT 20").all();
console.log(JSON.stringify(allFares, null, 2));

console.log('\n=== time_zones tablosu ===');
try {
  const tz = faresDb.prepare("SELECT * FROM time_zones LIMIT 10").all();
  console.log(JSON.stringify(tz, null, 2));
} catch(e) { console.log('time_zones tablosu yok'); }

console.log('\n=== subscr_parameters tablosu ===');
try {
  const sp = faresDb.prepare("SELECT * FROM subscr_parameters LIMIT 10").all();
  console.log(JSON.stringify(sp, null, 2));
} catch(e) { console.log('subscr_parameters tablosu yok'); }

// Diğer tablo listesi
console.log('\n=== Tüm tablolar (fares db) ===');
const allTables = faresDb.prepare("SELECT name FROM sqlite_master WHERE type='table' OR type='view'").all();
console.log(allTables.map(t => t.name));

faresDb.close();

// Lines DB - detay
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

console.log('\n=== LINES DB ===');
console.log('\nLines örnek (daha fazla):');
const lines = linesDb.prepare("SELECT * FROM lines LIMIT 10").all();
console.log(JSON.stringify(lines, null, 2));

console.log('\nDinstinct zone_id in lines:');
const zones = linesDb.prepare("SELECT DISTINCT zone_id FROM lines ORDER BY zone_id").all();
console.log(zones.map(z => z.zone_id));

console.log('\nStops koordinat sistemi (lat/lon)- örnek dönüşüm:');
const stopSample = linesDb.prepare("SELECT stop_id, name, lat_deg, lat_min, long_deg, long_min FROM stops WHERE name != '' LIMIT 5").all();
stopSample.forEach(s => {
  const lat = s.lat_deg + s.lat_min / 1000000;
  const lon = s.long_deg + s.long_min / 1000000;
  console.log(`  ${s.name}: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
});

console.log('\nlines - toplam kaç farklı zone?');
const zoneCount = linesDb.prepare("SELECT zone_id, COUNT(*) as cnt FROM lines GROUP BY zone_id ORDER BY zone_id").all();
console.log(JSON.stringify(zoneCount, null, 2));

console.log('\nline_stops - kaç benzersiz hat?');
const lineCount = linesDb.prepare("SELECT COUNT(DISTINCT line_id) as cnt FROM line_stops").get();
console.log('Benzersiz hat sayısı:', lineCount.cnt);

console.log('\ncompany_lines - kaç şirket?');
const compCount = linesDb.prepare("SELECT COUNT(DISTINCT companyId) as cnt FROM company_lines").get();
console.log('Şirket sayısı:', compCount.cnt);

linesDb.close();
