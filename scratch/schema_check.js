const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', { readonly: true });
const linesDb = new Database('lines_20260412000000_20360127235959.sqlite', { readonly: true });

// Tüm tabloları gör
console.log('=== FARES DB TABLOLARI ===');
const faresTables = faresDb.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
faresTables.forEach(t => {
  const cols = faresDb.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`\n[${t.name}]`);
  cols.forEach(c => console.log(`  ${c.name} (${c.type})`));
  // İlk 2 satırı göster
  const sample = faresDb.prepare(`SELECT * FROM ${t.name} LIMIT 2`).all();
  sample.forEach(r => console.log('  örnek:', JSON.stringify(r)));
});
