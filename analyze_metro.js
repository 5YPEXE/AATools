const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});
const ldb = require('./node_modules/better-sqlite3')('lines_20260412000000_20360127235959.sqlite', {readonly:true});

// M2 metro hattını bul (Kızılay-Batıkent veya Kızılay-Keçiören)
const allLines = ldb.prepare('SELECT * FROM lines ORDER BY line_id').all();

// Metro hatlarını tanımla - M2 = Kızılay-Batıkent
const m1Lines = allLines.filter(l => {
  const n = (l.name || '').toUpperCase();
  return n.includes('BATIKÖY') || n.includes('BATIKENT') || n.includes('OSB-TÖREKENT') || 
         (n.includes('KIZILAY') && n.includes('BATI'));
});
const m2Lines = allLines.filter(l => {
  const n = (l.name || '').toUpperCase();
  return n.includes('KEÇİÖREN') || n.includes('KEÇIÖREN') || n.includes('DİKİMEVİ') || n.includes('DIKIMEVI');
});
const m4Lines = allLines.filter(l => {
  const n = (l.name || '').toUpperCase();
  return (n.includes('ERYAMAN') && n.includes('METRO')) || n.includes('ÜMİTKÖY') || 
         n.includes('KORU METRO') || n.includes('BİLKENT METRO');
});

console.log('M1 benzeri:', JSON.stringify(m1Lines.slice(0,5)));
console.log('M2 benzeri (Keçiören):', JSON.stringify(m2Lines.slice(0,5)));
console.log('M4 benzeri:', JSON.stringify(m4Lines.slice(0,5)));

// Hat 507
const line507 = ldb.prepare('SELECT * FROM lines WHERE line_id=507').get();
console.log('\nHat 507:', JSON.stringify(line507));

// Fares DB'sindeki tüm line_id'leri ve ne kadar aktarma kuralı var
console.log('\nFares DB ticket_fares - kaç farklı stop_type var?');
const stopTypes = fdb.prepare('SELECT DISTINCT stop_type FROM ticket_fares ORDER BY stop_type').all();
console.log('Stop types:', stopTypes.map(r => r.stop_type).join(', '));

// Hat 507'nin fares DB'sinde ne tür stop_type var
if (line507) {
  const st507 = ldb.prepare('SELECT stop_type, COUNT(*) as cnt FROM line_stops WHERE line_id=507 GROUP BY stop_type ORDER BY cnt DESC').all();
  console.log('\nHat 507 stop_types (lines DB):', JSON.stringify(st507));
}

// Fares DB'de line_time_tables - 507 var mı?
const ltt507 = fdb.prepare('SELECT * FROM line_time_tables WHERE line_id=507').all();
console.log('\nFares DB - Hat 507 time_tables:', JSON.stringify(ltt507));

// M2 için line_id tahminleri - Ankara M2 = Kızılay-Keçiören (2014'te açıldı)
// line_id olarak farklı numaralar deneyebiliriz
// Önce fares DB'deki tüm line_id'leri görelim
const fareLineIds = fdb.prepare('SELECT DISTINCT line_id FROM line_time_tables ORDER BY line_id').all();
console.log('\nFares DB line_time_tables line_id listesi (ilk 30):', fareLineIds.slice(0,30).map(r=>r.line_id).join(', '));
console.log('Toplam hat sayısı fares DB:', fareLineIds.length);

// subscr_ticket_taken - özellikle M2 aktarma kuralları
// Önce 507'nin abonman bilgisi
const subscr507 = fdb.prepare('SELECT * FROM subscr_ticket_taken WHERE line_id=507').all();
console.log('\nHat 507 subscr_ticket_taken:', JSON.stringify(subscr507));

// transfers_according_to_previous_line - line_id değerlerinin aralığı
const transferLineRange = fdb.prepare('SELECT MIN(line_id) as minL, MAX(line_id) as maxL, MIN(previous_line_id) as minP, MAX(previous_line_id) as maxP FROM transfers_according_to_previous_line').get();
console.log('\ntransfers_according_to_previous_line ID aralıkları:', JSON.stringify(transferLineRange));

// transfers_according_to_previous_line - tüm benzersiz line_id değerleri
const transferLineIds = fdb.prepare('SELECT DISTINCT line_id FROM transfers_according_to_previous_line ORDER BY line_id').all();
console.log('Transfer tablosundaki tüm line_id değerleri:', transferLineIds.map(r=>r.line_id).join(', '));

const transferPrevLineIds = fdb.prepare('SELECT DISTINCT previous_line_id FROM transfers_according_to_previous_line ORDER BY previous_line_id').all();
console.log('Transfer tablosundaki tüm previous_line_id değerleri:', transferPrevLineIds.map(r=>r.previous_line_id).join(', '));

fdb.close();
ldb.close();
