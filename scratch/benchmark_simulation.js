const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

console.time('Simulate 40k combinations');

// 1. Pre-fetch all lines and their stop types/fares
const lines = linesDb.prepare('SELECT line_id, name, zone_id FROM lines').all();
const stopTypes = {};
linesDb.prepare('SELECT line_id, stop_type, COUNT(*) as cnt FROM line_stops GROUP BY line_id, stop_type').all().forEach(row => {
  if (!stopTypes[row.line_id] || row.cnt > stopTypes[row.line_id].cnt) {
    stopTypes[row.line_id] = { stop_type: row.stop_type, cnt: row.cnt };
  }
});

// Cache base fares for card_type_id = 1, time_zone_id = 3
const faresCache = {};
faresDb.prepare('SELECT stop_type, fare FROM ticket_fares tf JOIN fares f ON f.fare_id = tf.fare_id WHERE tf.card_type_id = 1 AND tf.time_zone_id = 3').all().forEach(row => {
  faresCache[row.stop_type] = row.fare;
});

// Cache transfer interval and discounts
const generalTransferFareId = faresDb.prepare('SELECT percent FROM transfer_discounts WHERE time_zone_id = 3 AND card_type_id = 1 LIMIT 1').get()?.percent || 0;
const generalTransferFare = faresDb.prepare('SELECT fare FROM fares WHERE fare_id = ? LIMIT 1').get(generalTransferFareId)?.fare || 0;

// Cache zone transfer rules
const transferRules = {};
faresDb.prepare('SELECT * FROM transfers_according_to_previous_line').all().forEach(row => {
  const key = `${row.previous_line_id}->${row.line_id}`;
  if (!transferRules[key]) transferRules[key] = [];
  transferRules[key].push(row);
});

console.log('Pre-processing complete. Starting simulation...');

function interpretTransferType(percent, discountType) {
  if (percent === 0) return 'NO_TRANSFER';
  if (percent === 1 && discountType === '4') return 'COMPLEMENTARY';
  if (percent === 1) return 'GENERAL_DISCOUNT';
  if (percent === 10) return 'HALF_PRICE';
  if (percent === 2) return 'DISCOUNTED';
  if (percent === 3 && discountType === '4') return 'COMPLEMENTARY_PARTIAL';
  return 'DISCOUNTED';
}

function calcTransferFare(firstLineFare, secondLineFare, transferType, percent) {
  switch (transferType) {
    case 'FREE': return 0;
    case 'NO_TRANSFER': return secondLineFare;
    case 'NO_RULE': return secondLineFare;
    case 'GENERAL_DISCOUNT':
      return generalTransferFare + Math.max(0, secondLineFare - firstLineFare);
    case 'COMPLEMENTARY':
      return Math.max(0, secondLineFare - firstLineFare);
    case 'HALF_PRICE':
      return Math.round(secondLineFare / 2);
    case 'DISCOUNTED':
      return Math.round(secondLineFare * (1 - 1 / percent));
    case 'COMPLEMENTARY_PARTIAL':
      return Math.round(Math.max(0, secondLineFare - firstLineFare) / 2);
    default:
      return secondLineFare;
  }
}

// Group lines by zone
const linesByZone = {};
lines.forEach(l => {
  if (!linesByZone[l.zone_id]) linesByZone[l.zone_id] = [];
  linesByZone[l.zone_id].push(l);
});

// Find combinations based on transitions
const t1Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type FROM transfers_according_to_previous_line WHERE transfer_num = 1").all();
const t2Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type FROM transfers_according_to_previous_line WHERE transfer_num = 2").all();

const t2Index = {};
t2Rules.forEach(r => {
  if (!t2Index[r.fromZone]) t2Index[r.fromZone] = [];
  t2Index[r.fromZone].push(r);
});

let comboCount = 0;
let results = [];

t1Rules.forEach(r1 => {
  const zoneA = r1.fromZone;
  const zoneB = r1.toZone;
  const possibleLeg2 = t2Index[zoneB];
  
  if (possibleLeg2) {
    possibleLeg2.forEach(r2 => {
      const zoneC = r2.toZone;
      
      const linesA = linesByZone[zoneA] || [];
      const linesB = linesByZone[zoneB] || [];
      const linesC = linesByZone[zoneC] || [];
      
      // Let's take sample lines to simulate
      linesA.forEach(lA => {
        linesB.forEach(lB => {
          linesC.forEach(lC => {
            comboCount++;
            
            // Fares
            const fareA = faresCache[stopTypes[lA.line_id]?.stop_type || 1] || 3500;
            const fareB = faresCache[stopTypes[lB.line_id]?.stop_type || 1] || 3500;
            const fareC = faresCache[stopTypes[lC.line_id]?.stop_type || 1] || 3500;
            
            // Transfer 1
            const tt1 = interpretTransferType(r1.percent, r1.discount_type);
            const tf1 = calcTransferFare(fareA, fareB, tt1, r1.percent);
            
            // Transfer 2
            const tt2 = interpretTransferType(r2.percent, r2.discount_type);
            const tf2 = calcTransferFare(fareB, fareC, tt2, r2.percent);
            
            const total = fareA + tf1 + tf2;
            
            if (comboCount <= 10) {
              console.log(`Combo: ${lA.line_id} -> ${lB.line_id} -> ${lC.line_id} | Fares: ${fareA/100} -> ${tf1/100} -> ${tf2/100} | Total: ${total/100} ₺`);
            }
          });
        });
      });
    });
  }
});

console.timeEnd('Simulate 40k combinations');
console.log('Total simulated combinations:', comboCount);
