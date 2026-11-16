const express = require('express');
const createAuthRoutes = require('./auth.routes');
const createHealthRoutes = require('./health.routes');
const createProductsRoutes = require('./products.routes');
const createShippingRoutes = require('./shipping.routes');
const createTransactionsRoutes = require('./transactions.routes');
const { createRajaOngkirClient } = require('../services/rajaOngkir');

function createRoutes(db, jwtSecret, shippingClient = createRajaOngkirClient()) {
  const router = express.Router();
  router.use('/health', createHealthRoutes(db));
  router.use('/auth', createAuthRoutes(db, jwtSecret));
  router.use('/shipping', createShippingRoutes(db, shippingClient));
  router.use('/', createProductsRoutes(db, jwtSecret));
  router.use('/transactions', createTransactionsRoutes(db, jwtSecret));
  return router;
}

module.exports = createRoutes;
