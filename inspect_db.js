const Database = require('better-sqlite3');

const dbs = [
  'fares_20260412000000_20360131235959.sqlite',
  'lines_20260412000000_20360127235959.sqlite'
];

for (const dbFile of dbs) {
  console.log('\n========================================');
  console.log('DB:', dbFile);
  console.log('========================================');
  const db = new Database(dbFile, {readonly: true});
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));

  for (const {name} of tables) {
    console.log('\n  Table: ' + name);
    const cols = db.prepare('PRAGMA table_info(' + name + ')').all();
    for (const c of cols) {
      console.log('    ' + c.cid + '. ' + c.name + ' [' + c.type + '] notnull=' + c.notnull + ' pk=' + c.pk);
    }
    const count = db.prepare('SELECT COUNT(*) as cnt FROM "' + name + '"').get();
    console.log('  Row count: ' + count.cnt);
    if (count.cnt > 0) {
      const sample = db.prepare('SELECT * FROM "' + name + '" LIMIT 3').all();
      console.log('  Sample rows: ' + JSON.stringify(sample, null, 2));
    }
  }
  db.close();
}
