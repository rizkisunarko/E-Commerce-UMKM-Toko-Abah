require('dotenv').config();
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('./config/db');
const createApp = require('./app');
const { expireOverdueOrdersBatch } = require('./utils/orderExpiration');
const app = createApp({ db, jwtSecret: process.env.JWT_SECRET });

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
  expireOverdueOrdersBatch(db).catch((err) => {
    console.error('Gagal memeriksa pesanan kedaluwarsa saat startup:', err.message);
  });
  const timer = setInterval(() => {
    expireOverdueOrdersBatch(db).catch((err) => {
      console.error('Gagal membatalkan pesanan kedaluwarsa otomatis:', err.message);
    });
  }, 60 * 1000);
  timer.unref();
});
