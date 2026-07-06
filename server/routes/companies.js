const express = require('express');
const router = express.Router();
const { getLinesDb } = require('../db');

// GET /api/companies
router.get('/', (req, res) => {
  try {
    const db = getLinesDb();
    const companies = db.prepare(`
      SELECT 
        cl.companyId,
        COUNT(DISTINCT cl.lineId) as lineCount,
        GROUP_CONCAT(DISTINCT l.zone_id) as zones
      FROM company_lines cl
      LEFT JOIN lines l ON l.line_id = cl.lineId
      GROUP BY cl.companyId
      ORDER BY lineCount DESC
    `).all();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:id/lines
router.get('/:id/lines', (req, res) => {
  try {
    const db = getLinesDb();
    const companyId = parseInt(req.params.id);
    const lines = db.prepare(`
      SELECT l.line_id, l.name, l.zone_id,
        COUNT(DISTINCT ls.stop_id) as stopCount
      FROM company_lines cl
      JOIN lines l ON l.line_id = cl.lineId
      LEFT JOIN line_stops ls ON ls.line_id = l.line_id
      WHERE cl.companyId = ?
      GROUP BY l.line_id
      ORDER BY
        CASE WHEN l.line_id <= 999 THEN l.line_id ELSE l.line_id / 10 END,
        CASE WHEN l.line_id <= 999 THEN 0 ELSE l.line_id % 10 END
    `).all(companyId);
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
