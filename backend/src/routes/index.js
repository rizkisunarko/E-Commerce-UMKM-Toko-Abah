const express = require('express');
const createAuthRoutes = require('./auth.routes');
const createHealthRoutes = require('./health.routes');
const createProductsRoutes = require('./products.routes');
const createTransactionsRoutes = require('./transactions.routes');

function createRoutes(db, jwtSecret) {
  const router = express.Router();
  router.use('/health', createHealthRoutes(db));
  router.use('/auth', createAuthRoutes(db, jwtSecret));
  router.use('/', createProductsRoutes(db, jwtSecret));
  router.use('/transactions', createTransactionsRoutes(db, jwtSecret));
  return router;
}

module.exports = createRoutes;
