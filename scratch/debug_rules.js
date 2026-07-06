const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

const rules = faresDb.prepare("SELECT * FROM transfers_according_to_previous_line").all();
console.log('Total rules in transfers_according_to_previous_line:', rules.length);

const discountTypes = {};
const percents = {};
const transferNums = {};

rules.forEach(r => {
  discountTypes[r.discount_type] = (discountTypes[r.discount_type] || 0) + 1;
  percents[r.percent] = (percents[r.percent] || 0) + 1;
  transferNums[r.transfer_num] = (transferNums[r.transfer_num] || 0) + 1;
});

console.log('Discount types:', discountTypes);
console.log('Percents:', percents);
console.log('Transfer nums:', transferNums);

faresDb.close();
