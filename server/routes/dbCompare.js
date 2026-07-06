const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..');

// 1. List SQLite databases in directory
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(DB_DIR);
    const dbs = files.filter(f => f.endsWith('.sqlite'));
    res.json(dbs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Upload SQLite database file (raw binary stream)
router.post('/upload', (req, res) => {
  try {
    const fileName = req.headers['x-filename'] || `db_${Date.now()}.sqlite`;
    const cleanName = path.basename(fileName);
    
    if (!cleanName.endsWith('.sqlite')) {
      return res.status(400).json({ error: 'Sadece .sqlite uzantılı dosyalar kabul edilir.' });
    }

    const destPath = path.join(DB_DIR, cleanName);
    const writeStream = fs.createWriteStream(destPath);
    
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.json({ success: true, filename: cleanName });
    });

    writeStream.on('error', (err) => {
      res.status(500).json({ error: `Yazma hatası: ${err.message}` });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Schema Diff: Compare tables & column definitions
router.get('/schema-diff', (req, res) => {
  const { source, target } = req.query;
  if (!source || !target) {
    return res.status(400).json({ error: 'source ve target veritabanı adları zorunludur.' });
  }

  let db1 = null;
  let db2 = null;

  try {
    db1 = new Database(path.join(DB_DIR, source), { readonly: true });
    db2 = new Database(path.join(DB_DIR, target), { readonly: true });

    const getTables = (db) => {
      return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
    };

    const t1 = getTables(db1);
    const t2 = getTables(db2);

    const addedTables = t2.filter(t => !t1.includes(t));
    const removedTables = t1.filter(t => !t2.includes(t));
    const commonTables = t1.filter(t => t2.includes(t));

    const modifiedTables = [];

    for (const name of commonTables) {
      const cols1 = db1.prepare(`PRAGMA table_info("${name}")`).all();
      const cols2 = db2.prepare(`PRAGMA table_info("${name}")`).all();

      const map1 = new Map(cols1.map(c => [c.name, c]));
      const map2 = new Map(cols2.map(c => [c.name, c]));

      const addedCols = cols2.filter(c => !map1.has(c.name)).map(c => ({ name: c.name, type: c.type }));
      const removedCols = cols1.filter(c => !map2.has(c.name)).map(c => ({ name: c.name, type: c.type }));
      const changedCols = [];

      for (const [colName, c1] of map1) {
        const c2 = map2.get(colName);
        if (c2 && (c1.type !== c2.type || c1.notnull !== c2.notnull || c1.pk !== c2.pk)) {
          changedCols.push({
            name: colName,
            oldType: c1.type,
            newType: c2.type,
            oldPk: c1.pk,
            newPk: c2.pk,
            oldNotnull: c1.notnull,
            newNotnull: c2.notnull
          });
        }
      }

      if (addedCols.length > 0 || removedCols.length > 0 || changedCols.length > 0) {
        modifiedTables.push({
          name,
          addedCols,
          removedCols,
          changedCols
        });
      }
    }

    res.json({
      addedTables,
      removedTables,
      modifiedTables,
      commonTables
    });
  } catch (err) {
    res.status(500).json({ error: `Karşılaştırma hatası: ${err.message}` });
  } finally {
    if (db1) db1.close();
    if (db2) db2.close();
  }
});

// 4. Data Diff: Compare rows for a given table
router.get('/data-diff', (req, res) => {
  const { source, target, table } = req.query;
  if (!source || !target || !table) {
    return res.status(400).json({ error: 'source, target ve table parametreleri zorunludur.' });
  }

  let db1 = null;
  let db2 = null;

  try {
    db1 = new Database(path.join(DB_DIR, source), { readonly: true });
    db2 = new Database(path.join(DB_DIR, target), { readonly: true });

    // Read headers and detect Primary Keys
    const cols1 = db1.prepare(`PRAGMA table_info("${table}")`).all();
    const cols2 = db2.prepare(`PRAGMA table_info("${table}")`).all();
    
    // Use target headers as base for display
    const headers = cols2.map(c => c.name);
    
    // Sort PKs by position
    const pks = cols2.filter(c => c.pk > 0).sort((a, b) => a.pk - b.pk).map(c => c.name);

    const rows1 = db1.prepare(`SELECT * FROM "${table}"`).all();
    const rows2 = db2.prepare(`SELECT * FROM "${table}"`).all();

    // Fallback key builder if no primary key is defined
    const keyFn = (row, index) => {
      if (pks.length > 0) {
        return pks.map(k => String(row[k] ?? '')).join('|__|');
      }
      return `idx_${index}`;
    };

    const m1 = new Map();
    const m2 = new Map();

    rows1.forEach((r, i) => m1.set(keyFn(r, i), { r, idx: i }));
    rows2.forEach((r, i) => m2.set(keyFn(r, i), { r, idx: i }));

    const added = [];
    const removed = [];
    const changed = [];
    const same = [];

    // Compare Source -> Target
    m1.forEach((val1, key) => {
      const val2 = m2.get(key);
      if (!val2) {
        removed.push({ row: val1.r });
      } else {
        const r1 = val1.r;
        const r2 = val2.r;
        const changedCells = {};
        let isDifferent = false;

        headers.forEach(h => {
          const v1 = r1[h];
          const v2 = r2[h];
          if (v1 !== v2) {
            isDifferent = true;
            changedCells[h] = { oldVal: v1, newVal: v2 };
          }
        });

        if (isDifferent) {
          changed.push({ row: r2, oldRow: r1, changedCells });
        } else {
          same.push({ row: r2 });
        }
      }
    });

    // Detect new rows in target
    m2.forEach((val2, key) => {
      if (!m1.has(key)) {
        added.push({ row: val2.r });
      }
    });

    // Cap output lists to avoid massive JSON payloads (limit to 100 for safety)
    const LIMIT = 100;

    res.json({
      primaryKeys: pks,
      headers: headers,
      counts: {
        added: added.length,
        removed: removed.length,
        changed: changed.length,
        same: same.length,
        total: rows2.length
      },
      diffs: {
        added: added.slice(0, LIMIT),
        removed: removed.slice(0, LIMIT),
        changed: changed.slice(0, LIMIT),
        sameCount: same.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: `Veri karşılaştırma hatası: ${err.message}` });
  } finally {
    if (db1) db1.close();
    if (db2) db2.close();
  }
});

module.exports = router;
