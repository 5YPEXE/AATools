const express = require('express');
const router = express.Router();
const { getFaresDb, getLinesDb } = require('../db');

// GET /api/stats/summary
router.get('/summary', (req, res) => {
  try {
    const linesDb = getLinesDb();
    const faresDb = getFaresDb();

    const totalLines = linesDb.prepare('SELECT COUNT(*) as cnt FROM lines').get().cnt;
    const totalStops = linesDb.prepare('SELECT COUNT(*) as cnt FROM stops').get().cnt;
    const totalLineStops = linesDb.prepare('SELECT COUNT(DISTINCT line_id) as cnt FROM line_stops').get().cnt;
    const totalCompanies = linesDb.prepare('SELECT COUNT(DISTINCT companyId) as cnt FROM company_lines').get().cnt;
    const totalZones = linesDb.prepare('SELECT COUNT(DISTINCT zone_id) as cnt FROM lines').get().cnt;
    const totalCardTypes = faresDb.prepare('SELECT COUNT(*) as cnt FROM card_types').get().cnt;
    const totalFareRules = faresDb.prepare('SELECT COUNT(*) as cnt FROM ticket_fares').get().cnt;
    const totalTransferRules = faresDb.prepare('SELECT COUNT(*) as cnt FROM transfers_according_to_previous_line').get().cnt;

    // Fare range
    const fareRange = faresDb.prepare(`
      SELECT MIN(f.fare) as minFare, MAX(f.fare) as maxFare, AVG(f.fare) as avgFare
      FROM fares f WHERE f.fare > 0
    `).get();

    res.json({
      totalLines,
      totalStops,
      totalLineStops,
      totalCompanies,
      totalZones,
      totalCardTypes,
      totalFareRules,
      totalTransferRules,
      fareRange: {
        min: fareRange.minFare,
        max: fareRange.maxFare,
        avg: Math.round(fareRange.avgFare)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/zones
router.get('/zones', (req, res) => {
  try {
    const linesDb = getLinesDb();
    const zones = linesDb.prepare(`
      SELECT zone_id, COUNT(*) as lineCount
      FROM lines
      GROUP BY zone_id
      ORDER BY zone_id ASC
    `).all();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/fares-distribution
router.get('/fares-distribution', (req, res) => {
  try {
    const faresDb = getFaresDb();
    // Group fares into buckets
    const fares = faresDb.prepare('SELECT fare FROM fares WHERE fare > 0 ORDER BY fare').all();
    
    // Create buckets of 1000 (10 TL)
    const buckets = {};
    fares.forEach(({ fare }) => {
      const bucket = Math.floor(fare / 1000) * 1000;
      const label = `${bucket/100}-${(bucket+1000)/100} TL`;
      buckets[label] = (buckets[label] || 0) + 1;
    });

    res.json(Object.entries(buckets).map(([range, count]) => ({ range, count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/time-zones
router.get('/time-zones', (req, res) => {
  try {
    const faresDb = getFaresDb();
    const tzData = faresDb.prepare(`
      SELECT time_zone_id, COUNT(*) as ruleCount
      FROM ticket_fares
      GROUP BY time_zone_id
      ORDER BY time_zone_id
    `).all();
    res.json(tzData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/card-types
router.get('/card-types', (req, res) => {
  try {
    const faresDb = getFaresDb();
    const cardData = faresDb.prepare(`
      SELECT card_type_id, COUNT(*) as fareCount
      FROM ticket_fares
      GROUP BY card_type_id
      ORDER BY card_type_id
    `).all();
    res.json(cardData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/companies
router.get('/companies', (req, res) => {
  try {
    const linesDb = getLinesDb();
    const companies = linesDb.prepare(`
      SELECT companyId, COUNT(*) as lineCount
      FROM company_lines
      GROUP BY companyId
      ORDER BY lineCount DESC
    `).all();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
