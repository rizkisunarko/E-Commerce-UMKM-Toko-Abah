const express = require('express');
const { randomBytes } = require('node:crypto');
const { createAuthenticate, authorizeRoles } = require('../middleware/auth');

const ORDER_STATUSES = [
  'menunggu',
  'diproses',
  'siap_diambil',
  'siap_dikirim',
  'selesai',
  'batal',
];
const EMPLOYEE_STATUSES = ['diproses', 'siap_diambil', 'siap_dikirim'];
const PAYMENT_METHODS = ['tunai', 'qris', 'debit'];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function nextDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function normalizePaymentMethod(method) {
  if (method === 'QRIS') return 'qris';
  if (method === 'payment_gateway') return 'debit';
  return method;
}

function databasePaymentMethod(method) {
  return method === 'qris' ? 'QRIS' : method;
}

function validateCreatePayload(body) {
  const errors = {};
  const method = body && body.metode_bayar;
  if (!PAYMENT_METHODS.includes(method)) {
    errors.metode_bayar = 'Pilih metode bayar terlebih dahulu';
  }

  const items = body && Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) errors.items = 'Belum ada produk dipilih';

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item && item.product_id);
    const quantity = Number(item && item.jumlah);
    const key = Number.isSafeInteger(productId) && productId > 0
      ? `items.${productId}`
      : 'items';

    if (!Number.isSafeInteger(productId) || productId < 1) {
      errors[key] = 'Produk tidak valid';
    } else if (!Number.isSafeInteger(quantity) || quantity < 1) {
      errors[key] = 'Masukkan angka yang valid';
    } else {
      const combined = (quantities.get(productId) || 0) + quantity;
      if (!Number.isSafeInteger(combined)) {
        errors[key] = 'Jumlah produk tidak valid';
      } else {
        quantities.set(productId, combined);
      }
    }
  }

  return { errors, method, quantities };
}

function createTransactionsRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

  router.post(
    '/',
    authenticate,
    authorizeRoles('admin', 'pegawai'),
    async (req, res, next) => {
      const { errors, method, quantities } = validateCreatePayload(req.body);
      if (Object.keys(errors).length) {
        return res.status(422).json({ message: 'Data tidak valid', errors });
      }

      let connection;
      let transactionStarted = false;
      try {
        connection = typeof db.getConnection === 'function' ? await db.getConnection() : db;
        if (typeof connection.beginTransaction !== 'function') {
          throw new Error('Koneksi database tidak mendukung transaksi atomik');
        }
        await connection.beginTransaction();
        transactionStarted = true;

        const lines = [];
        let totalCents = 0;
        const productIds = [...quantities.keys()].sort((a, b) => a - b);
        for (const productId of productIds) {
          const [rows] = await connection.query(
            `SELECT id_produk, nama_produk, harga_jual, jumlah_stok, archived_at
             FROM produk WHERE id_produk = ? FOR UPDATE`,
            [productId],
          );
          const product = rows[0];
          if (!product || product.archived_at) {
            errors[`items.${productId}`] = 'Produk tidak ditemukan';
            continue;
          }

          const quantity = quantities.get(productId);
          const stock = Number(product.jumlah_stok);
          if (!Number.isSafeInteger(stock) || stock < quantity) {
            errors[`items.${productId}`] =
              `Stok tidak mencukupi. Stok tersedia: ${Number.isFinite(stock) ? stock : 0}`;
            continue;
          }

          const priceCents = Math.round(Number(product.harga_jual) * 100);
          const subtotalCents = priceCents * quantity;
          if (!Number.isSafeInteger(priceCents) || priceCents < 0 ||
              !Number.isSafeInteger(subtotalCents) ||
              !Number.isSafeInteger(totalCents + subtotalCents)) {
            throw new Error(`Nilai transaksi produk ${productId} di luar batas yang didukung`);
          }

          totalCents += subtotalCents;
          lines.push({
            id: productId,
            nama: product.nama_produk,
            harga: priceCents / 100,
            jumlah: quantity,
            subtotal: subtotalCents / 100,
            stockBefore: stock,
          });
        }

        if (Object.keys(errors).length) {
          await connection.rollback();
          transactionStarted = false;
          return res.status(422).json({ message: 'Data tidak valid', errors });
        }

        const total = totalCents / 100;
        const received = method === 'tunai' ? Number(req.body.jumlah_diterima) : null;
        if (method === 'tunai' &&
            (!Number.isSafeInteger(received) || received < total)) {
          await connection.rollback();
          transactionStarted = false;
          return res.status(422).json({
            message: 'Data tidak valid',
            errors: {
              jumlah_diterima: 'Uang diterima harus berupa angka bulat dan minimal sebesar total tagihan',
            },
          });
        }
        const change = method === 'tunai' ? received - total : 0;
        const kodeTransaksi = `TRX-${Date.now()}-${randomBytes(6).toString('hex')}`;
        const [result] = await connection.query(
          `INSERT INTO transaksi (
             id_admin, kode_transaksi, jenis_transaksi, subtotal_produk, ongkos_kirim,
             total_bayar, status_transaksi, catatan
           ) VALUES (?, ?, 'kasir', ?, 0, ?, 'selesai', ?)`,
          [
            req.user.role === 'admin' ? req.user.id : null,
            kodeTransaksi,
            total.toFixed(2),
            total.toFixed(2),
            `Transaksi kasir oleh ${req.user.nama}`,
          ],
        );
        const transactionId = result.insertId;

        for (const line of lines) {
          const stockAfter = line.stockBefore - line.jumlah;
          await connection.query(
            `UPDATE produk
             SET jumlah_stok = ?, status_produk = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id_produk = ?`,
            [stockAfter, stockAfter === 0 ? 'habis' : 'tersedia', line.id],
          );
          await connection.query(
            `INSERT INTO detail_transaksi (
               id_transaksi, id_produk, jumlah, harga_satuan, subtotal
             ) VALUES (?, ?, ?, ?, ?)`,
            [transactionId, line.id, line.jumlah, line.harga.toFixed(2), line.subtotal.toFixed(2)],
          );
          await connection.query(
            `INSERT INTO riwayat_stok (
               id_produk, id_admin, jenis_perubahan, jumlah, stok_sebelum, stok_sesudah, keterangan
             ) VALUES (?, ?, 'keluar', ?, ?, ?, ?)`,
            [
              line.id,
              req.user.role === 'admin' ? req.user.id : null,
              line.jumlah,
              line.stockBefore,
              stockAfter,
              `Penjualan kasir ${kodeTransaksi} oleh ${req.user.nama}`,
            ],
          );
        }

        await connection.query(
          `INSERT INTO pembayaran (
             id_transaksi, metode_pembayaran, jumlah_bayar, jumlah_diterima,
             kembalian, status_pembayaran
           ) VALUES (?, ?, ?, ?, ?, 'berhasil')`,
          [
            transactionId,
            databasePaymentMethod(method),
            total.toFixed(2),
            method === 'tunai' ? received.toFixed(2) : null,
            change.toFixed(2),
          ],
        );
        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
          data: {
            id: transactionId,
            tanggal: new Date().toISOString(),
            metode_bayar: method,
            jumlah_diterima: method === 'tunai' ? received : total,
            kembalian: change,
            items: lines.map(({ id, nama, harga, jumlah, subtotal }) => ({
              product_id: id,
              nama,
              harga,
              jumlah,
              subtotal,
            })),
            total,
          },
        });
      } catch (error) {
        if (transactionStarted) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            return next(rollbackError);
          }
        }
        return next(error);
      } finally {
        if (connection && typeof connection.release === 'function') {
          connection.release();
        }
      }
    },
  );

  router.get('/rekap', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const tanggal = req.query.tanggal;
    if (!isValidDate(tanggal)) {
      return res.status(422).json({
        message: 'Data tidak valid',
        errors: { tanggal: 'Masukkan tanggal yang valid' },
      });
    }

    try {
      const [rows] = await db.query(
        `SELECT
           COALESCE(SUM(p.tunai), 0) AS tunai,
           COALESCE(SUM(p.qris), 0) AS qris,
           COALESCE(SUM(p.debit), 0) AS debit,
           COALESCE(SUM(p.total), 0) AS total,
           COUNT(p.id_transaksi) AS jumlah_transaksi,
           COALESCE(SUM(p.tunai > 0), 0) AS jumlah_transaksi_tunai,
           COALESCE(SUM(p.qris > 0), 0) AS jumlah_transaksi_qris,
           COALESCE(SUM(p.debit > 0), 0) AS jumlah_transaksi_debit
         FROM transaksi t
         JOIN (
           SELECT id_transaksi,
                  SUM(CASE WHEN metode_pembayaran = 'tunai' THEN jumlah_bayar ELSE 0 END) AS tunai,
                  SUM(CASE WHEN metode_pembayaran = 'QRIS' THEN jumlah_bayar ELSE 0 END) AS qris,
                  SUM(CASE WHEN metode_pembayaran IN ('debit', 'payment_gateway')
                           THEN jumlah_bayar ELSE 0 END) AS debit,
                  SUM(jumlah_bayar) AS total
           FROM pembayaran
           WHERE status_pembayaran = 'berhasil'
           GROUP BY id_transaksi
         ) p ON p.id_transaksi = t.id_transaksi
         WHERE t.jenis_transaksi = 'kasir'
           AND t.tanggal_transaksi >= ? AND t.tanggal_transaksi < ?`,
        [`${tanggal} 00:00:00`, `${nextDate(tanggal)} 00:00:00`],
      );
      const row = rows[0];
      return res.json({
        data: {
          tanggal,
          tunai: Number(row.tunai),
          qris: Number(row.qris),
          debit: Number(row.debit),
          total: Number(row.total),
          jumlah_transaksi: Number(row.jumlah_transaksi),
          jumlah_transaksi_tunai: Number(row.jumlah_transaksi_tunai),
          jumlah_transaksi_qris: Number(row.jumlah_transaksi_qris),
          jumlah_transaksi_debit: Number(row.jumlah_transaksi_debit),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const { dari, sampai } = req.query;
    const errors = {};
    if (dari !== undefined && !isValidDate(dari)) errors.dari = 'Masukkan tanggal yang valid';
    if (sampai !== undefined && !isValidDate(sampai)) errors.sampai = 'Masukkan tanggal yang valid';
    if (!Object.keys(errors).length && dari && sampai && dari > sampai) {
      errors.sampai = 'Tanggal akhir tidak boleh sebelum tanggal awal';
    }
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data tidak valid', errors });
    }

    const conditions = ["t.jenis_transaksi = 'kasir'"];
    const params = [];
    if (dari) {
      conditions.push('t.tanggal_transaksi >= ?');
      params.push(`${dari} 00:00:00`);
    }
    if (sampai) {
      conditions.push('t.tanggal_transaksi < ?');
      params.push(`${nextDate(sampai)} 00:00:00`);
    }

    try {
      const [rows] = await db.query(
        `SELECT t.id_transaksi AS id, t.tanggal_transaksi AS tanggal,
                p.metode_bayar, t.total_bayar AS total,
                COALESCE((
                  SELECT SUM(dt.jumlah) FROM detail_transaksi dt
                  WHERE dt.id_transaksi = t.id_transaksi
                ), 0) AS jumlah_item
         FROM transaksi t
         LEFT JOIN (
           SELECT id_transaksi, MAX(metode_pembayaran) AS metode_bayar
           FROM pembayaran
           WHERE status_pembayaran = 'berhasil'
           GROUP BY id_transaksi
         ) p ON p.id_transaksi = t.id_transaksi
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.tanggal_transaksi DESC, t.id_transaksi DESC`,
        params,
      );
      return res.json({
        data: rows.map((row) => ({
          ...row,
          metode_bayar: normalizePaymentMethod(row.metode_bayar),
          total: Number(row.total),
          jumlah_item: Number(row.jumlah_item),
        })),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID transaksi tidak valid' });
    }

    try {
      const [transactions] = await db.query(
        `SELECT t.id_transaksi AS id, t.tanggal_transaksi AS tanggal,
                p.metode_bayar, t.total_bayar AS total,
                p.jumlah_diterima, p.kembalian
         FROM transaksi t
         LEFT JOIN (
           SELECT id_transaksi, MAX(metode_pembayaran) AS metode_bayar,
                  MAX(jumlah_diterima) AS jumlah_diterima,
                  MAX(kembalian) AS kembalian
           FROM pembayaran
           WHERE status_pembayaran = 'berhasil'
           GROUP BY id_transaksi
         ) p ON p.id_transaksi = t.id_transaksi
         WHERE t.id_transaksi = ? AND t.jenis_transaksi = 'kasir'`,
        [id],
      );
      if (!transactions.length) {
        return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
      }

      const [items] = await db.query(
        `SELECT dt.id_produk AS product_id, p.nama_produk AS nama,
                dt.harga_satuan AS harga, dt.jumlah, dt.subtotal
         FROM detail_transaksi dt
         JOIN produk p ON p.id_produk = dt.id_produk
         WHERE dt.id_transaksi = ?
         ORDER BY dt.id_detail_transaksi`,
        [id],
      );
      const transaction = transactions[0];
      return res.json({
        data: {
          ...transaction,
          metode_bayar: normalizePaymentMethod(transaction.metode_bayar),
          total: Number(transaction.total),
          jumlah_diterima: transaction.jumlah_diterima === null ||
            transaction.jumlah_diterima === undefined
            ? Number(transaction.total)
            : Number(transaction.jumlah_diterima),
          kembalian: Number(transaction.kembalian || 0),
          items: items.map((item) => ({
            ...item,
            harga: Number(item.harga),
            jumlah: Number(item.jumlah),
            subtotal: Number(item.subtotal),
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.patch(
    '/:id/status',
    authenticate,
    authorizeRoles('admin', 'pegawai'),
    async (req, res, next) => {
      const id = Number(req.params.id);
      const { status } = req.body || {};

      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ message: 'ID pesanan tidak valid' });
      }
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(422).json({
          message: 'Status pesanan tidak valid',
          errors: { status: `Pilih salah satu: ${ORDER_STATUSES.join(', ')}` },
        });
      }
      if (req.user.role === 'pegawai' && !EMPLOYEE_STATUSES.includes(status)) {
        const message = status === 'batal'
          ? 'Hanya admin yang dapat membatalkan pesanan'
          : 'Pegawai hanya dapat mengatur status diproses, siap diambil, atau siap dikirim';
        return res.status(403).json({ message });
      }

      try {
        const [transactions] = await db.query(
          `SELECT id_transaksi, kode_transaksi, status_transaksi, jenis_transaksi
           FROM transaksi WHERE id_transaksi = ?`,
          [id],
        );
        if (!transactions.length) {
          return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }
        if (transactions[0].jenis_transaksi === 'online') {
          return res.status(409).json({
            message: 'Status pesanan online harus diubah melalui endpoint pesanan',
          });
        }

        await db.query(
          'UPDATE transaksi SET status_transaksi = ? WHERE id_transaksi = ?',
          [status, id],
        );
        const [rows] = await db.query(
          `SELECT id_transaksi, kode_transaksi, status_transaksi
           FROM transaksi WHERE id_transaksi = ?`,
          [id],
        );
        return res.json({ data: rows[0] });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

module.exports = createTransactionsRoutes;
