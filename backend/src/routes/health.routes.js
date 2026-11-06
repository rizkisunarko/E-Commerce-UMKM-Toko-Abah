const express = require('express');
const db = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message || err.code || 'database connection error' });
  }
});

module.exports = router;
