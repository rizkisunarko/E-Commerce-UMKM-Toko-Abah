const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('node:path');
const createRoutes = require('./routes');

function getAllowedOrigins() {
  const configured = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return new Set(['http://localhost:5173', ...configured]);
}

function createApp({ db, jwtSecret, shippingClient, paymentClient, uploadDir } = {}) {
  if (!db || typeof db.query !== 'function') {
    throw new Error('Pool database backend wajib dikonfigurasi');
  }
  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET wajib diisi dengan rahasia acak minimal 32 karakter');
  }

  const app = express();
  const allowedOrigins = getAllowedOrigins();
  const resolvedUploadDir = uploadDir || path.resolve(__dirname, '../uploads/products');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, '');
        return callback(null, allowedOrigins.has(normalized));
      },
    }),
  );
  app.use('/uploads/products', express.static(resolvedUploadDir));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createRoutes(db, jwtSecret, shippingClient, paymentClient, { uploadDir: resolvedUploadDir }));
  app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });
  return app;
}

module.exports = createApp;
