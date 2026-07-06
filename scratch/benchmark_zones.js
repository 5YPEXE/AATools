const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

console.time('Simulate Zone combinations');

// 1. Get most common stop type for each zone
const zoneStopTypes = {};
const zoneSampleLines = {};

const lines = linesDb.prepare('SELECT line_id, name, zone_id FROM lines').all();

// Pre-query stop types for all lines
const lineStopTypes = {};
linesDb.prepare('SELECT line_id, stop_type, COUNT(*) as cnt FROM line_stops GROUP BY line_id, stop_type').all().forEach(row => {
  if (!lineStopTypes[row.line_id] || row.cnt > lineStopTypes[row.line_id].cnt) {
    lineStopTypes[row.line_id] = row.stop_type;
  }
});

// Group stop types and lines by zone
lines.forEach(l => {
  const st = lineStopTypes[l.line_id] || 1;
  if (!zoneStopTypes[l.zone_id]) {
    zoneStopTypes[l.zone_id] = {};
  }
  zoneStopTypes[l.zone_id][st] = (zoneStopTypes[l.zone_id][st] || 0) + 1;
  
  if (!zoneSampleLines[l.zone_id]) zoneSampleLines[l.zone_id] = [];
  if (zoneSampleLines[l.zone_id].length < 3) {
    zoneSampleLines[l.zone_id].push(`${l.line_id} (${l.name})`);
  }
});

// Select the most common stop type for each zone
const primaryZoneStopType = {};
for (const zoneId in zoneStopTypes) {
  let bestSt = 1;
  let maxCount = 0;
  for (const st in zoneStopTypes[zoneId]) {
    if (zoneStopTypes[zoneId][st] > maxCount) {
      maxCount = zoneStopTypes[zoneId][st];
      bestSt = parseInt(st);
    }
  }
  primaryZoneStopType[zoneId] = bestSt;
}

// Pre-query fares for card_type_id = 1, time_zone_id = 3
const faresCache = {};
faresDb.prepare('SELECT stop_type, fare FROM ticket_fares tf JOIN fares f ON f.fare_id = tf.fare_id WHERE tf.card_type_id = 1 AND tf.time_zone_id = 3').all().forEach(row => {
  faresCache[row.stop_type] = row.fare;
});

// Cache transfer interval and discounts
const generalTransferFareId = faresDb.prepare('SELECT percent FROM transfer_discounts WHERE time_zone_id = 3 AND card_type_id = 1 LIMIT 1').get()?.percent || 0;
const generalTransferFare = faresDb.prepare('SELECT fare FROM fares WHERE fare_id = ? LIMIT 1').get(generalTransferFareId)?.fare || 0;

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

// Find zone transitions
const t1Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type, interval FROM transfers_according_to_previous_line WHERE transfer_num = 1").all();
const t2Rules = faresDb.prepare("SELECT previous_line_id as fromZone, line_id as toZone, percent, discount_type, interval FROM transfers_according_to_previous_line WHERE transfer_num = 2").all();

const t2Index = {};
t2Rules.forEach(r => {
  if (!t2Index[r.fromZone]) t2Index[r.fromZone] = [];
  t2Index[r.fromZone].push(r);
});

let comboCount = 0;
const simulatedCombos = [];

t1Rules.forEach(r1 => {
  const zoneA = r1.fromZone;
  const zoneB = r1.toZone;
  const possibleLeg2 = t2Index[zoneB];
  
  if (possibleLeg2) {
    possibleLeg2.forEach(r2 => {
      const zoneC = r2.toZone;
      comboCount++;
      
      const stA = primaryZoneStopType[zoneA] || 1;
      const stB = primaryZoneStopType[zoneB] || 1;
      const stC = primaryZoneStopType[zoneC] || 1;
      
      const fareA = faresCache[stA] || 3500;
      const fareB = faresCache[stB] || 3500;
      const fareC = faresCache[stC] || 3500;
      
      const tt1 = interpretTransferType(r1.percent, r1.discount_type);
      const tf1 = calcTransferFare(fareA, fareB, tt1, r1.percent);
      
      const tt2 = interpretTransferType(r2.percent, r2.discount_type);
      const tf2 = calcTransferFare(fareB, fareC, tt2, r2.percent);
      
      const total = fareA + tf1 + tf2;
      
      simulatedCombos.push({
        zoneA, zoneB, zoneC,
        fareA, fareB, fareC,
        tf1, tf2, total,
        rule1: tt1, rule2: tt2
      });
    });
  }
});

console.timeEnd('Simulate Zone combinations');
console.log('Total unique Zone combinations:', comboCount);
if (simulatedCombos.length > 0) {
  console.log('First 3 zone simulations:', simulatedCombos.slice(0, 3));
}
