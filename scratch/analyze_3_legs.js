const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

// 1. Get all rules with transfer_num = 1
const t1Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type FROM transfers_according_to_previous_line WHERE transfer_num = 1").all();

// 2. Get all rules with transfer_num = 2
const t2Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type FROM transfers_according_to_previous_line WHERE transfer_num = 2").all();

console.log(`Found ${t1Rules.length} 1st-transfer rules and ${t2Rules.length} 2nd-transfer rules.`);

// We want to find matches where zoneA -> zoneB (transfer_num=1) AND zoneB -> zoneC (transfer_num=2)
// Let's index t2Rules by fromZone (which is zoneB in the middle)
const t2Index = {};
t2Rules.forEach(r => {
  if (!t2Index[r.fromZone]) {
    t2Index[r.fromZone] = [];
  }
  t2Index[r.fromZone].push(r);
});

const threeLegCombinations = [];

t1Rules.forEach(r1 => {
  const zoneA = r1.fromZone;
  const zoneB = r1.toZone;
  
  const possibleLeg2 = t2Index[zoneB];
  if (possibleLeg2) {
    possibleLeg2.forEach(r2 => {
      const zoneC = r2.toZone;
      
      threeLegCombinations.push({
        zoneA,
        zoneB,
        zoneC,
        rule1: r1,
        rule2: r2
      });
    });
  }
});

console.log(`Found ${threeLegCombinations.length} valid 3-leg zone combinations (zoneA -> zoneB -> zoneC).`);

// Let's analyze and group them by type of rules (e.g. general discount, complementary, etc.)
// And let's find some famous lines for each zone!
function getLineSamplesForZone(zoneId) {
  const samples = linesDb.prepare("SELECT line_id, name FROM lines WHERE zone_id = ? LIMIT 2").all(zoneId);
  return samples.map(l => `${l.line_id} (${l.name})`).join(' / ');
}

console.log('\n--- SAMPLE 3-LEG COMBINATIONS (First 20) ---');
const printed = new Set();
let count = 0;
for (const combo of threeLegCombinations) {
  const key = `${combo.zoneA}->${combo.zoneB}->${combo.zoneC}`;
  if (printed.has(key)) continue;
  printed.add(key);
  
  count++;
  if (count > 20) break;
  
  const sampleA = getLineSamplesForZone(combo.zoneA);
  const sampleB = getLineSamplesForZone(combo.zoneB);
  const sampleC = getLineSamplesForZone(combo.zoneC);
  
  function getRuleStr(r) {
    if (r.percent === 1 && r.discount_type === '4') return 'Complementary';
    if (r.percent === 1) return 'General Transfer';
    if (r.percent === 10) return 'Half-Price';
    return `percent=${r.percent}`;
  }
  
  console.log(`${count}. Zone: ${combo.zoneA} -> ${combo.zoneB} -> ${combo.zoneC}`);
  console.log(`   Rules: ${getRuleStr(combo.rule1)} -> ${getRuleStr(combo.rule2)}`);
  console.log(`   Lines: [${sampleA}] -> [${sampleB}] -> [${sampleC}]`);
  console.log('--------------------------------------------------');
}

// Let's count how many complementary transfers are in the 1st vs 2nd rules
let comp1 = 0, comp2 = 0;
threeLegCombinations.forEach(c => {
  if (c.rule1.percent === 1 && c.rule1.discount_type === '4') comp1++;
  if (c.rule2.percent === 1 && c.rule2.discount_type === '4') comp2++;
});
console.log(`\nComplementary transfers: Rule 1: ${comp1}, Rule 2: ${comp2}`);

faresDb.close();
linesDb.close();
