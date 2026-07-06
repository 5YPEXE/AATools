const express = require('express');
const router = express.Router();
const { getLinesDb } = require('../db');

// GET /api/stops?page=1&limit=50&search=
router.get('/', (req, res) => {
  try {
    const db = getLinesDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (s.name LIKE ? OR CAST(s.stop_id AS TEXT) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM stops s ${where}`).get(...params);

    const stops = db.prepare(`
      SELECT 
        s.stop_id,
        s.name,
        s.lat_deg,
        s.lat_min,
        s.long_deg,
        s.long_min,
        COUNT(DISTINCT ls.line_id) as lineCount
      FROM stops s
      LEFT JOIN line_stops ls ON ls.stop_id = s.stop_id
      ${where}
      GROUP BY s.stop_id
      ORDER BY s.stop_id
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      total: countRow.cnt,
      page,
      limit,
      data: stops
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stops/geo — tüm duraklar harita için (sadece koordinatlar)
router.get('/geo/all', (req, res) => {
  try {
    const db = getLinesDb();
    const stops = db.prepare(`
      SELECT 
        s.stop_id,
        s.name,
        s.lat_deg,
        s.lat_min,
        s.long_deg,
        s.long_min,
        COUNT(DISTINCT ls.line_id) as lineCount
      FROM stops s
      LEFT JOIN line_stops ls ON ls.stop_id = s.stop_id
      GROUP BY s.stop_id
    `).all();

    // Koordinatları dönüştür
    const geoStops = stops.map(s => ({
      id: s.stop_id,
      name: s.name,
      lat: s.lat_deg + s.lat_min / 600000,
      lon: s.long_deg + s.long_min / 600000,
      lineCount: s.lineCount
    })).filter(s => s.lat > 38 && s.lat < 41 && s.lon > 30 && s.lon < 35); // Ankara bölgesi filtresi

    res.json(geoStops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stops/:id
router.get('/:id', (req, res) => {
  try {
    const db = getLinesDb();
    const stopId = parseInt(req.params.id);

    const stop = db.prepare('SELECT * FROM stops WHERE stop_id = ?').get(stopId);
    if (!stop) return res.status(404).json({ error: 'Durak bulunamadı' });

    const lines = db.prepare(`
      SELECT DISTINCT l.line_id, l.name, l.zone_id, ls.direction, ls.position, ls.stop_type
      FROM line_stops ls
      JOIN lines l ON l.line_id = ls.line_id
      WHERE ls.stop_id = ?
      ORDER BY l.line_id
    `).all(stopId);

    res.json({
      ...stop,
      lat: stop.lat_deg + stop.lat_min / 600000,
      lon: stop.long_deg + stop.long_min / 600000,
      lines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
