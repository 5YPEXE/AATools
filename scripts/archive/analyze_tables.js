const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

// transfer_lines tum icerik
const tl = fdb.prepare('SELECT * FROM transfer_lines ORDER BY line_id').all();
console.log('transfer_lines toplam:', tl.length);
tl.slice(0, 30).forEach(r => {
  const f = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.line_id);
  const t = ldb.prepare('SELECT name FROM lines WHERE line_id=?').get(r.prev_line_id);
  console.log(`  ${r.line_id} (${(f && f.name || '?').substring(0, 35)}) <- ${r.prev_line_id} (${(t && t.name || '?').substring(0, 35)})`);
});

// card_types_parameters
const ctpSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'card_types_parameters');
console.log('\ncard_types_parameters schema:', ctpSchema.sql);
const ctp12 = fdb.prepare('SELECT * FROM card_types_parameters WHERE card_type_id IN (1,2,3)').all();
console.log('card=1,2,3:', JSON.stringify(ctp12, null, 2));

// tüm card_types_parameters ilk 20
const ctpAll = fdb.prepare('SELECT * FROM card_types_parameters LIMIT 20').all();
console.log('card_types_parameters (20):', JSON.stringify(ctpAll));

// local_card_types
const lctSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'local_card_types');
console.log('\nlocal_card_types schema:', lctSchema.sql);
const lct = fdb.prepare('SELECT * FROM local_card_types LIMIT 10').all();
console.log('local_card_types:', JSON.stringify(lct));

// subscr_types
const stSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'subscr_types');
console.log('\nsubscr_types schema:', stSchema.sql);
const st = fdb.prepare('SELECT * FROM subscr_types').all();
console.log('subscr_types:', JSON.stringify(st, null, 2));

// round_trip_allowed
const rtaSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'round_trip_allowed');
console.log('\nround_trip_allowed schema:', rtaSchema.sql);
const rta = fdb.prepare('SELECT * FROM round_trip_allowed LIMIT 10').all();
console.log('round_trip_allowed:', JSON.stringify(rta));

// round_trip_discounts
const rtdSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'round_trip_discounts');
console.log('\nround_trip_discounts schema:', rtdSchema.sql);
const rtd = fdb.prepare('SELECT * FROM round_trip_discounts LIMIT 10').all();
console.log('round_trip_discounts:', JSON.stringify(rtd));

// fare_type_assignment
const ftaSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'fare_type_assignment');
console.log('\nfare_type_assignment schema:', ftaSchema.sql);
const fta = fdb.prepare('SELECT * FROM fare_type_assignment LIMIT 20').all();
console.log('fare_type_assignment:', JSON.stringify(fta, null, 2));

// transfers_ingenico
const tiSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'transfers_ingenico');
console.log('\ntransfers_ingenico schema:', tiSchema.sql);
const ti = fdb.prepare('SELECT * FROM transfers_ingenico LIMIT 10').all();
console.log('transfers_ingenico:', JSON.stringify(ti));

// variables
const vars = fdb.prepare('SELECT * FROM variables').all();
console.log('\nvariables:', JSON.stringify(vars, null, 2));

fdb.close();
ldb.close();
