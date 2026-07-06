const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

// card_types_parameters - sütun adı card_type (card_type_id değil)
const ctp = fdb.prepare('SELECT * FROM card_types_parameters WHERE card_type IN (1,2,3)').all();
console.log('card_types_parameters card=1,2,3:', JSON.stringify(ctp, null, 2));

// Tüm parametreler
const ctpAll = fdb.prepare('SELECT * FROM card_types_parameters ORDER BY card_type').all();
console.log('\ncard_types_parameters tam liste (named kartlar için):');
ctpAll.forEach(r => {
  const ct = fdb.prepare('SELECT description FROM card_types WHERE card_type_id=?').get(r.card_type);
  const name = ct ? ct.description.trim() : 'KT_' + r.card_type;
  if (!/^KT_\d+$/.test(name)) {
    console.log(`  card=${r.card_type} (${name}): subscr_transfer_type=${r.subscr_transfer_type}, companion=${r.companion}, validity_control=${r.validity_control_flag}, daily_max=${r.daily_max_limit}, monthly_max=${r.subs_monthly_max_limit}, sequential_max=${r.sequential_max_limit}`);
  }
});

// subscr_transfer_type ne demek?
// Bu ABONE aktarma tipi - 0=yok, 1=var gibi

// local_card_types
const lctSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'local_card_types');
console.log('\nlocal_card_types schema:', lctSchema ? lctSchema.sql : 'yok');

// fare_type_assignment
const ftaSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'fare_type_assignment');
console.log('\nfare_type_assignment schema:', ftaSchema ? ftaSchema.sql : 'yok');
const fta = fdb.prepare('SELECT * FROM fare_type_assignment LIMIT 20').all();
console.log('fare_type_assignment:', JSON.stringify(fta, null, 2));

// subscr_types
const stSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'subscr_types');
console.log('\nsubscr_types schema:', stSchema ? stSchema.sql : 'yok');
const st = fdb.prepare('SELECT * FROM subscr_types').all();
console.log('subscr_types:', JSON.stringify(st, null, 2));

// transfers_ingenico
const tiSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'transfers_ingenico');
console.log('\ntransfers_ingenico schema:', tiSchema ? tiSchema.sql : 'yok');
const ti = fdb.prepare('SELECT * FROM transfers_ingenico LIMIT 10').all();
console.log('transfers_ingenico:', JSON.stringify(ti));

// variables
const vars = fdb.prepare('SELECT * FROM variables').all();
console.log('\nvariables:', JSON.stringify(vars, null, 2));

// ÖNEMLI SORU: isTransferActive'in tam anlamı
// Hat 507 card=2: isTransferActive=0
// Hat M2 (902) card=2: isTransferActive=0
// Bu demek ki: ÖĞRENCİ kartı bu hatlarda ABONMAN aktarmasını aktive etmiyor
// Ama normal tarife indirimini etkiliyor mu?

// subscr_allowence
const saSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'subscr_allowence');
console.log('\nsubscr_allowence schema:', saSchema ? saSchema.sql : 'yok');
const sa = fdb.prepare('SELECT * FROM subscr_allowence LIMIT 10').all();
console.log('subscr_allowence (10):', JSON.stringify(sa, null, 2));

// subscr_detail
const sdSchema = fdb.prepare('SELECT sql FROM sqlite_master WHERE type=? AND name=?').get('table', 'subscr_detail');
console.log('\nsubscr_detail schema:', sdSchema ? sdSchema.sql : 'yok');
const sd = fdb.prepare('SELECT * FROM subscr_detail LIMIT 10').all();
console.log('subscr_detail (10):', JSON.stringify(sd, null, 2));

fdb.close();
ldb.close();
