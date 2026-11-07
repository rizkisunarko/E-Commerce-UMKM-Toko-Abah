const express = require('express');

function createHealthRoutes(db) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        db: error.message || error.code || 'database connection error',
      });
    }
  });

  return router;
}

module.exports = createHealthRoutes;
