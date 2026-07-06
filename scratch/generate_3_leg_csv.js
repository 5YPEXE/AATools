const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

console.log('Generating 3-leg combinations CSV...');

// 1. Get all rules with transfer_num = 1
const t1Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type, interval FROM transfers_according_to_previous_line WHERE transfer_num = 1").all();

// 2. Get all rules with transfer_num = 2
const t2Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type, interval FROM transfers_according_to_previous_line WHERE transfer_num = 2").all();

// Index by fromZone
const t2Index = {};
t2Rules.forEach(r => {
  if (!t2Index[r.fromZone]) {
    t2Index[r.fromZone] = [];
  }
  t2Index[r.fromZone].push(r);
});

// Cache line names for zones to speed up generation
const zoneLinesCache = {};
function getLineSamplesForZone(zoneId) {
  if (zoneLinesCache[zoneId]) return zoneLinesCache[zoneId];
  const samples = linesDb.prepare("SELECT line_id, name FROM lines WHERE zone_id = ? LIMIT 3").all(zoneId);
  const result = samples.map(l => `${l.line_id} (${l.name})`).join(' | ');
  zoneLinesCache[zoneId] = result || `Bölge ${zoneId} (Örnek hat yok)`;
  return zoneLinesCache[zoneId];
}

function getRuleStr(percent, discount_type) {
  if (percent === 1 && discount_type === '4') return 'Tamamlayıcı (Complementary)';
  if (percent === 1) return 'Genel Aktarma (General)';
  if (percent === 10) return 'Yarı Fiyat (Half-Price)';
  if (percent === 0) return 'Aktarma Yok';
  return `percent=${percent}`;
}

const csvRows = [
  'No,1. Hat Bölge ID,2. Hat Bölge ID,3. Hat Bölge ID,1. Aktarma Kuralı,2. Aktarma Kuralı,1. Aktarma Süresi (Dk),2. Aktarma Süresi (Dk),1. Bölge Örnek Hatları,2. Bölge Örnek Hatları,3. Bölge Örnek Hatları'
];

let no = 1;
t1Rules.forEach(r1 => {
  const zoneA = r1.fromZone;
  const zoneB = r1.toZone;
  
  const possibleLeg2 = t2Index[zoneB];
  if (possibleLeg2) {
    possibleLeg2.forEach(r2 => {
      const zoneC = r2.toZone;
      
      const r1Str = getRuleStr(r1.percent, r1.discount_type);
      const r2Str = getRuleStr(r2.percent, r2.discount_type);
      
      const sampleA = getLineSamplesForZone(zoneA).replace(/"/g, '""');
      const sampleB = getLineSamplesForZone(zoneB).replace(/"/g, '""');
      const sampleC = getLineSamplesForZone(zoneC).replace(/"/g, '""');
      
      csvRows.push(
        `${no},${zoneA},${zoneB},${zoneC},"${r1Str}","${r2Str}",${r1.interval},${r2.interval},"${sampleA}","${sampleB}","${sampleC}"`
      );
      no++;
    });
  }
});

const csvPath = 'three_leg_transfer_combinations.csv';
fs.writeFileSync(csvPath, '\ufeff' + csvRows.join('\n'), 'utf8'); // BOM added for Excel compatibility

console.log(`Successfully generated CSV at ${csvPath}. Total combinations: ${no - 1}`);

faresDb.close();
linesDb.close();
