const express = require('express');
const createAuthRoutes = require('./auth.routes');
const createCartRoutes = require('./cart.routes');
const createHealthRoutes = require('./health.routes');
const createOrdersRoutes = require('./orders.routes');
const { createPaymentsRoutes } = require('./payments.routes');
const createProductsRoutes = require('./products.routes');
const createShippingRoutes = require('./shipping.routes');
const createTransactionsRoutes = require('./transactions.routes');
const { createMidtransSnapClient } = require('../services/midtransSnap');
const { createRajaOngkirClient } = require('../services/rajaOngkir');

function createRoutes(
  db,
  jwtSecret,
  shippingClient = createRajaOngkirClient(),
  paymentClient = createMidtransSnapClient(),
) {
  const router = express.Router();
  router.use('/health', createHealthRoutes(db));
  router.use('/auth', createAuthRoutes(db, jwtSecret));
  router.use('/cart', createCartRoutes(db));
  router.use('/payments', createPaymentsRoutes(db, paymentClient));
  router.use('/orders', createOrdersRoutes(db, jwtSecret, shippingClient, paymentClient));
  router.use('/shipping', createShippingRoutes(db, shippingClient));
  router.use('/', createProductsRoutes(db, jwtSecret));
  router.use('/transactions', createTransactionsRoutes(db, jwtSecret));
  return router;
}

module.exports = createRoutes;
