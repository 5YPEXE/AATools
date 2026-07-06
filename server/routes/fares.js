const express = require('express');
const router = express.Router();
const { getFaresDb } = require('../db');

// GET /api/fares?page=1&limit=50&cardType=&stopType=&timeZone=
router.get('/', (req, res) => {
  try {
    const db = getFaresDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const cardType = req.query.cardType !== undefined && req.query.cardType !== '' ? parseInt(req.query.cardType) : null;
    const stopType = req.query.stopType !== undefined && req.query.stopType !== '' ? parseInt(req.query.stopType) : null;
    const timeZone = req.query.timeZone !== undefined && req.query.timeZone !== '' ? parseInt(req.query.timeZone) : null;

    let where = 'WHERE 1=1';
    const params = [];

    if (cardType !== null) { where += ' AND tf.card_type_id = ?'; params.push(cardType); }
    if (stopType !== null) { where += ' AND tf.stop_type = ?'; params.push(stopType); }
    if (timeZone !== null) { where += ' AND tf.time_zone_id = ?'; params.push(timeZone); }

    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM ticket_fares tf ${where}`).get(...params);

    const fares = db.prepare(`
      SELECT 
        tf.stop_type,
        tf.time_zone_id,
        tf.card_type_id,
        tf.fare_id,
        f.fare
      FROM ticket_fares tf
      JOIN fares f ON f.fare_id = tf.fare_id
      ${where}
      ORDER BY tf.stop_type, tf.time_zone_id, tf.card_type_id
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      total: countRow.cnt,
      page,
      limit,
      data: fares
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fares/filters — kullanılabilir filtre değerleri
router.get('/filters', (req, res) => {
  try {
    const db = getFaresDb();
    const cardTypes = db.prepare('SELECT DISTINCT card_type_id FROM ticket_fares ORDER BY card_type_id').all().map(r => r.card_type_id);
    const stopTypes = db.prepare('SELECT DISTINCT stop_type FROM ticket_fares ORDER BY stop_type').all().map(r => r.stop_type);
    const timeZones = db.prepare('SELECT DISTINCT time_zone_id FROM ticket_fares ORDER BY time_zone_id').all().map(r => r.time_zone_id);

    res.json({ cardTypes, stopTypes, timeZones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fares/transfers
router.get('/transfers', (req, res) => {
  try {
    const db = getFaresDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const count = db.prepare('SELECT COUNT(*) as cnt FROM transfers_according_to_previous_line').get().cnt;
    const transfers = db.prepare(`
      SELECT * FROM transfers_according_to_previous_line
      ORDER BY line_id, previous_line_id, transfer_num
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({ total: count, page, limit, data: transfers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fares/transfer-discounts
router.get('/transfer-discounts', (req, res) => {
  try {
    const db = getFaresDb();
    const discounts = db.prepare('SELECT * FROM transfer_discounts ORDER BY rowid').all();
    const intervals = db.prepare('SELECT * FROM transfer_intervals ORDER BY rowid').all();
    res.json({ discounts, intervals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fares/bank-commission
router.get('/bank-commission', (req, res) => {
  try {
    const db = getFaresDb();
    const commissions = db.prepare('SELECT * FROM bank_commission ORDER BY range').all();
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
