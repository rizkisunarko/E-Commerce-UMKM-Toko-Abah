const express = require('express');
const { createAuthenticate, authorizeRoles } = require('../middleware/auth');

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getWibDateString(date) {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function getDaysAgoWibString(date, days) {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function getWibSqlDateTime(date) {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function wibDateToUtcIso(dateStr, timeStr = '00:00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm, ss] = timeStr.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm, ss) - 7 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

function createReportsRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

  router.get(
    '/top-products',
    authenticate,
    authorizeRoles('admin'),
    async (req, res, next) => {
      const { period, from, to } = req.query;
      const VALID_PERIODS = ['24h', '7d', 'custom'];

      if (!period || !VALID_PERIODS.includes(period)) {
        return res.status(422).json({
          message: 'Data tidak valid',
          errors: { period: 'Periode tidak valid' },
        });
      }

      let startSql;
      let endSql;
      let fromIso;
      let toIso;

      if (period === 'custom') {
        const errors = {};
        if (!isValidDate(from)) {
          errors.from = 'Tanggal awal tidak valid';
        }
        if (!isValidDate(to)) {
          errors.to = 'Tanggal akhir tidak valid';
        }
        if (!errors.from && !errors.to) {
          if (from > to) {
            errors.from = 'Tanggal awal tidak boleh setelah tanggal akhir';
          } else {
            const fromMs = new Date(`${from}T00:00:00.000Z`).getTime();
            const toMs = new Date(`${to}T00:00:00.000Z`).getTime();
            const diffDays = Math.round((toMs - fromMs) / (24 * 3600 * 1000));
            if (diffDays > 366) {
              errors.to = 'Rentang tanggal maksimal 366 hari';
            }
          }
        }

        if (Object.keys(errors).length > 0) {
          return res.status(422).json({
            message: 'Data tidak valid',
            errors,
          });
        }

        startSql = `${from} 00:00:00`;
        endSql = `${to} 23:59:59`;
        fromIso = wibDateToUtcIso(from, '00:00:00');
        toIso = wibDateToUtcIso(to, '23:59:59');
      } else if (period === '7d') {
        const now = new Date();
        const todayWib = getWibDateString(now);
        const fromWib = getDaysAgoWibString(now, 6);
        startSql = `${fromWib} 00:00:00`;
        endSql = `${todayWib} 23:59:59`;
        fromIso = wibDateToUtcIso(fromWib, '00:00:00');
        toIso = wibDateToUtcIso(todayWib, '23:59:59');
      } else if (period === '24h') {
        const now = new Date();
        const fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startSql = getWibSqlDateTime(fromDate);
        endSql = getWibSqlDateTime(now);
        fromIso = fromDate.toISOString();
        toIso = now.toISOString();
      }

      try {
        const query = `
          SELECT
            p.id_produk AS product_id,
            p.nama_produk AS nama,
            COALESCE(SUM(dt.jumlah), 0) AS jumlah_terjual
          FROM detail_transaksi dt
          JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
          JOIN produk p ON p.id_produk = dt.id_produk
          WHERE t.tanggal_transaksi >= ? AND t.tanggal_transaksi <= ?
            AND (
              (t.jenis_transaksi = 'kasir' AND t.status_transaksi = 'selesai')
              OR
              (t.jenis_transaksi = 'online' AND t.status_transaksi IN ('dibayar', 'diproses', 'siap_diambil', 'siap_dikirim', 'selesai'))
            )
          GROUP BY p.id_produk, p.nama_produk
          ORDER BY jumlah_terjual DESC, p.nama_produk ASC
        `;

        const [rows] = await db.query(query, [startSql, endSql]);

        const data = rows.map((row) => ({
          product_id: Number(row.product_id),
          nama: row.nama,
          jumlah_terjual: Number(row.jumlah_terjual),
        }));

        return res.json({
          data,
          periode: {
            from: fromIso,
            to: toIso,
          },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

module.exports = createReportsRoutes;
