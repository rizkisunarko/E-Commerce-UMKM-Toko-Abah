const cors = require('cors');
const express = require('express');
const createRoutes = require('./routes');

function createApp({ db, jwtSecret }) {
  if (!db || typeof db.query !== 'function') {
    throw new Error('Pool database backend wajib dikonfigurasi');
  }
  if (typeof jwtSecret !== 'string' || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET wajib diisi dengan rahasia acak minimal 32 karakter');
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createRoutes(db, jwtSecret));
  app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });
  return app;
}

module.exports = createApp;
