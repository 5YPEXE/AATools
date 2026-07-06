const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });

// 338 veya 339 içeren TÜM özel aktarma kuralları
console.log('=== 338 veya 339 geçen TÜM özel aktarma kuralları ===\n');

const rules = faresDb.prepare(`
  SELECT * FROM transfers_according_to_previous_line
  WHERE line_id IN (338, 339) OR previous_line_id IN (338, 339)
  ORDER BY line_id, previous_line_id, transfer_num
`).all();

if (rules.length === 0) {
  console.log('Hiç özel kural bulunamadı.');
} else {
  rules.forEach(r => {
    console.log(`previous_line_id=${r.previous_line_id} -> line_id=${r.line_id} | transfer_num=${r.transfer_num} | percent=${r.percent} | interval=${r.interval} | discount_type=${r.discount_type}`);
  });
}

// Ayrıca transfer_lines tablosuna da bak
console.log('\n=== transfer_lines: 338 veya 339 içeren kayıtlar ===');
const tl = faresDb.prepare(`
  SELECT * FROM transfer_lines
  WHERE line_id IN (338, 339) OR prev_line_id IN (338, 339)
`).all();
if (tl.length === 0) {
  console.log('Hiç kayıt yok.');
} else {
  tl.forEach(r => console.log(JSON.stringify(r)));
}

// Tablodaki toplam kayıt sayısı
const total = faresDb.prepare(`SELECT COUNT(*) as cnt FROM transfers_according_to_previous_line`).get();
console.log(`\nToplam özel aktarma kuralı sayısı: ${total.cnt}`);
