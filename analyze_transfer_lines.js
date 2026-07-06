const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

console.log('=================================================================');
console.log('  transfer_lines TABLOSU - KRİTİK ANALİZ');
console.log('=================================================================\n');

// transfer_lines tablosu şeması
const schema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transfer_lines'").get();
console.log('transfer_lines şeması:', schema?.sql);

// Tüm içerik
const allTL = fdb.prepare('SELECT * FROM transfer_lines ORDER BY line_id, card_type LIMIT 100').all();
console.log('\ntransfer_lines ilk 100 kayıt:', JSON.stringify(allTL, null, 2));

// Hat 507 ve M2 (902)
const tl507 = fdb.prepare('SELECT * FROM transfer_lines WHERE line_id=507 OR line_id=902').all();
console.log('\nHat 507 ve M2 (902) transfer_lines:', JSON.stringify(tl507));

// Toplam kayıt sayısı
const cnt = fdb.prepare('SELECT COUNT(*) as cnt FROM transfer_lines').get();
console.log('\nToplam transfer_lines kayıt sayısı:', cnt.cnt);

// Benzersiz card_type değerleri
const cardTypes = fdb.prepare('SELECT DISTINCT card_type FROM transfer_lines ORDER BY card_type').all();
console.log('Benzersiz card_type değerleri:', cardTypes.map(r=>r.card_type).join(', '));

// card_type=2 (ÖĞRENCİ) kayıtları
const tl_ogr = fdb.prepare('SELECT tl.*, ct.description FROM transfer_lines tl LEFT JOIN card_types ct ON ct.card_type_id=tl.card_type WHERE tl.card_type=2 ORDER BY tl.line_id').all();
console.log('\ncard_type=2 (ÖĞRENCİ) transfer_lines:');
tl_ogr.forEach(r => console.log(`  Hat ${r.line_id}: card=${r.card_type} (${r.description}), diğer alanlar:`, JSON.stringify(r)));

// Diğer tablolar da inceleyelim
console.log('\n\n=== route_subscr tablosu ===');
const rsSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='route_subscr'").get();
console.log('route_subscr şeması:', rsSchema?.sql);
const rs = fdb.prepare('SELECT * FROM route_subscr LIMIT 20').all();
console.log('route_subscr örnek:', JSON.stringify(rs));

console.log('\n=== subscr_allowence tablosu ===');
const saSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='subscr_allowence'").get();
console.log('subscr_allowence şeması:', saSchema?.sql);
const sa = fdb.prepare('SELECT * FROM subscr_allowence LIMIT 20').all();
console.log('subscr_allowence örnek:', JSON.stringify(sa));

console.log('\n=== subscr_detail tablosu ===');
const sdSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='subscr_detail'").get();
console.log('subscr_detail şeması:', sdSchema?.sql);
const sd = fdb.prepare('SELECT * FROM subscr_detail LIMIT 20').all();
console.log('subscr_detail örnek:', JSON.stringify(sd));

console.log('\n=== fare_type_assignment tablosu ===');
const ftaSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='fare_type_assignment'").get();
console.log('fare_type_assignment şeması:', ftaSchema?.sql);
const fta = fdb.prepare('SELECT * FROM fare_type_assignment LIMIT 30').all();
console.log('fare_type_assignment örnek:', JSON.stringify(fta));

console.log('\n=== transfers_ingenico tablosu ===');
const tiSchema = fdb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transfers_ingenico'").get();
console.log('transfers_ingenico şeması:', tiSchema?.sql);
const ti = fdb.prepare('SELECT * FROM transfers_ingenico LIMIT 20').all();
console.log('transfers_ingenico örnek:', JSON.stringify(ti));

fdb.close();
ldb.close();
