const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..');

// 1. Get Tables & Schemas for a specific SQLite database
router.get('/tables', (req, res) => {
  const { db: dbName } = req.query;
  if (!dbName) {
    return res.status(400).json({ error: 'db parametresi zorunludur.' });
  }

  let db = null;
  try {
    db = new Database(path.join(DB_DIR, dbName), { readonly: true });
    
    // Fetch tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
    
    const schema = {};
    for (const table of tables) {
      const cols = db.prepare(`PRAGMA table_info("${table}")`).all();
      schema[table] = cols.map(c => ({
        name: c.name,
        type: c.type,
        pk: c.pk > 0,
        notnull: c.notnull > 0
      }));
    }

    res.json({ tables, schema });
  } catch (err) {
    res.status(500).json({ error: `Veritabanı okunamadı: ${err.message}` });
  } finally {
    if (db) db.close();
  }
});

// 2. Execute SQL query (strictly readonly)
router.post('/execute', (req, res) => {
  const { db: dbName, sql } = req.body;
  if (!dbName || !sql) {
    return res.status(400).json({ error: 'db ve sql parametreleri zorunludur.' });
  }

  // Basic validation to block write statements at the routing level
  const sqlLower = sql.trim().toLowerCase();
  if (sqlLower.startsWith('insert') || sqlLower.startsWith('update') || sqlLower.startsWith('delete') || 
      sqlLower.startsWith('drop') || sqlLower.startsWith('create') || sqlLower.startsWith('alter')) {
    return res.status(403).json({ error: 'Bu panelde sadece veri sorgulama (SELECT) işlemlerine izin verilmektedir.' });
  }

  let db = null;
  try {
    db = new Database(path.join(DB_DIR, dbName), { readonly: true });
    const stmt = db.prepare(sql);
    
    let rows;
    // Check if query is a SELECT statement (returns columns)
    if (stmt.columns && stmt.columns.length > 0) {
      rows = stmt.all();
    } else {
      // Just in case they executed PRAGMA or something else without cols
      const info = stmt.run();
      rows = [info];
    }
    
    res.json(rows);
  } catch (err) {
    res.status(400).json({ error: `Sorgu hatası: ${err.message}` });
  } finally {
    if (db) db.close();
  }
});

module.exports = router;
