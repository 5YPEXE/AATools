const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// transfer_lines tablosunun tüm içeriği
console.log('=== transfer_lines tablosu (TÜM kayıtlar) ===');
const allTL = faresDb.prepare(`SELECT * FROM transfer_lines ORDER BY line_id, prev_line_id`).all();
console.log(`Toplam: ${allTL.length} kayıt`);
allTL.slice(0, 50).forEach(r => {
  // Hat isimlerini de göster
  const lineA = linesDb.prepare(`SELECT name FROM lines WHERE line_id=?`).get(r.line_id);
  const lineB = linesDb.prepare(`SELECT name FROM lines WHERE line_id=?`).get(r.prev_line_id);
  console.log(`  prev_line_id=${r.prev_line_id} (${lineB?.name || '?'}) -> line_id=${r.line_id} (${lineA?.name || '?'})`);
});

// 339'a yakın hat numaraları (338, 340 vb.) var mı?
console.log('\n=== Zone 49 ve Zone 50 hatları ===');
const z49 = linesDb.prepare(`SELECT line_id, name FROM lines WHERE zone_id=49 ORDER BY line_id`).all();
const z50 = linesDb.prepare(`SELECT line_id, name FROM lines WHERE zone_id=50 ORDER BY line_id`).all();
console.log('Zone 49 hatları:', z49.map(l => `${l.line_id}: ${l.name}`).join('\n  '));
console.log('\nZone 50 hatları:', z50.map(l => `${l.line_id}: ${l.name}`).join('\n  '));

// transfers_according_to_previous_line'da 339 ile ilgili HERHANGİ bir kayıt?
// (LIKE ile arama - belki 3390, 3391 vb. şeklinde saklanmış olabilir)
console.log('\n=== transfers_according_to_previous_line: 339 veya 338 ile başlayan line_id ===');
const likeRules = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE CAST(line_id AS TEXT) LIKE '339%'
     OR CAST(line_id AS TEXT) LIKE '338%'
     OR CAST(previous_line_id AS TEXT) LIKE '339%'
     OR CAST(previous_line_id AS TEXT) LIKE '338%'
  LIMIT 20
`).all();
console.log(likeRules.length > 0 ? JSON.stringify(likeRules, null, 2) : 'Hiç bulunamadı.');
