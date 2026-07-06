const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

const dbZones = faresDb.prepare("SELECT DISTINCT line_id FROM transfers_according_to_previous_line").all().map(r => r.line_id);
const dbPrevZones = faresDb.prepare("SELECT DISTINCT previous_line_id FROM transfers_according_to_previous_line").all().map(r => r.previous_line_id);
const allTransferZones = new Set([...dbZones, ...dbPrevZones]);

const lineZones = linesDb.prepare("SELECT DISTINCT zone_id FROM lines").all().map(r => r.zone_id);

console.log('All unique zone_ids in lines DB:', lineZones.sort((a,b) => a-b));
console.log('All unique transfer zones in rules:', Array.from(allTransferZones).sort((a,b) => a-b));

const zonesNotInRules = lineZones.filter(z => !allTransferZones.has(z));
console.log('Zones in lines table that are NOT in transfer rules:', zonesNotInRules);

// Let's print some lines for these non-transfer zones
zonesNotInRules.forEach(z => {
  const lineCount = linesDb.prepare("SELECT COUNT(*) as cnt FROM lines WHERE zone_id = ?").get(z).cnt;
  const samples = linesDb.prepare("SELECT line_id, name FROM lines WHERE zone_id = ? LIMIT 3").all(z);
  console.log(`Zone ${z}: ${lineCount} lines. Samples:`, samples);
});

faresDb.close();
linesDb.close();
