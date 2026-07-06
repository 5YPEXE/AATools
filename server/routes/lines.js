const express = require('express');
const router = express.Router();
const { getLinesDb } = require('../db');

// GET /api/lines?page=1&limit=50&search=&zone=
router.get('/', (req, res) => {
  try {
    const db = getLinesDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const zone = req.query.zone !== undefined && req.query.zone !== '' ? parseInt(req.query.zone) : null;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (l.name LIKE ? OR CAST(l.line_id AS TEXT) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (zone !== null) {
      where += ' AND l.zone_id = ?';
      params.push(zone);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as cnt FROM lines l ${where}
    `).get(...params);

    const lines = db.prepare(`
      SELECT 
        l.line_id,
        l.name,
        l.zone_id,
        COUNT(DISTINCT ls.stop_id) as stopCount,
        GROUP_CONCAT(DISTINCT cl.companyId) as companyIds
      FROM lines l
      LEFT JOIN line_stops ls ON ls.line_id = l.line_id
      LEFT JOIN company_lines cl ON cl.lineId = l.line_id
      ${where}
      GROUP BY l.line_id
      ORDER BY
        CASE WHEN l.line_id <= 999 THEN l.line_id ELSE l.line_id / 10 END,
        CASE WHEN l.line_id <= 999 THEN 0 ELSE l.line_id % 10 END
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      total: countRow.cnt,
      page,
      limit,
      data: lines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lines/:id
router.get('/:id', (req, res) => {
  try {
    const db = getLinesDb();
    const lineId = parseInt(req.params.id);

    const line = db.prepare('SELECT * FROM lines WHERE line_id = ?').get(lineId);
    if (!line) return res.status(404).json({ error: 'Hat bulunamadı' });

    const stops = db.prepare(`
      SELECT 
        ls.direction,
        ls.position,
        ls.stop_type,
        s.stop_id,
        s.name,
        s.lat_deg,
        s.lat_min,
        s.long_deg,
        s.long_min
      FROM line_stops ls
      JOIN stops s ON s.stop_id = ls.stop_id
      WHERE ls.line_id = ?
      ORDER BY ls.direction, ls.position
    `).all(lineId);

    const companies = db.prepare(`
      SELECT companyId FROM company_lines WHERE lineId = ?
    `).all(lineId);

    res.json({
      ...line,
      stops,
      companies: companies.map(c => c.companyId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lines/by-stop/:stopId
router.get('/by-stop/:stopId', (req, res) => {
  try {
    const db = getLinesDb();
    const stopId = parseInt(req.params.stopId);

    const lines = db.prepare(`
      SELECT DISTINCT l.line_id, l.name, l.zone_id, ls.direction, ls.stop_type
      FROM line_stops ls
      JOIN lines l ON l.line_id = ls.line_id
      WHERE ls.stop_id = ?
      ORDER BY
        CASE WHEN l.line_id <= 999 THEN l.line_id ELSE l.line_id / 10 END,
        CASE WHEN l.line_id <= 999 THEN 0 ELSE l.line_id % 10 END
    `).all(stopId);

    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
