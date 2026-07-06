const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', {readonly: true});

// We want to simulate the scenario of:
// 507 (line_id = 507) -> M2 (line_id = 902)
// For card_type_id = 2 (Student card)
// Tuesday 09:00

// In our route:
const fromLineId = 507;
const toLineId = 902;
const cardTypeId = 2; // Student card

const fromLine = linesDb.prepare('SELECT * FROM lines WHERE line_id = ?').get(fromLineId);
const toLine = linesDb.prepare('SELECT * FROM lines WHERE line_id = ?').get(toLineId);

console.log('fromLine zone:', fromLine.zone_id);
console.log('toLine zone:', toLine.zone_id);

const fromStopType = 1; // standard
const toStopType = 19; // metro

const tzId = 3; // 09:00 Tuesday

const fromFare = 1000; // Let's say student fare is 10.00 TL (or check from ticket_fares)
const toFare = 1050; // check from ticket_fares

const transferRules = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line WHERE line_id = ? AND previous_line_id = ?").all(toLine.zone_id, fromLine.zone_id);
console.log('Rules:', transferRules);

// How does the route currently calculate this?
const rule = transferRules[0];
const percent = rule.percent;
console.log('Rule percent:', percent);

function interpretTransferType(percent, discountType) {
  if (percent === 0) return { type: 'NO_TRANSFER' };
  if (percent === 1) return { type: 'FREE' };
  if (percent === 10) return { type: 'HALF_PRICE' };
  return { type: 'DISCOUNTED' };
}

const tt = interpretTransferType(percent, rule.discount_type);
console.log('Interpreted transfer type:', tt);

function calcTransferFare(firstLineFare, secondLineFare, transferType, percent) {
  switch (transferType) {
    case 'FREE': return 0;
    case 'NO_TRANSFER': return secondLineFare;
    case 'HALF_PRICE': return Math.round(secondLineFare / 2);
    default: return secondLineFare;
  }
}

const transferFare = calcTransferFare(fromFare, toFare, tt.type, percent);
console.log('Calculated transfer fare for student:', transferFare);

faresDb.close();
linesDb.close();
