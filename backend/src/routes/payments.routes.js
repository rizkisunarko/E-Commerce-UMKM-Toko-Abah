const express = require('express');
const {
  isOrderPaymentExpired,
  expireOrderInTransaction,
} = require('../utils/orderExpiration');

function amountInCents(value) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

function notificationStatus(notification) {
  if (notification.transaction_status === 'settlement' ||
      (notification.transaction_status === 'capture' &&
       notification.fraud_status === 'accept')) {
    return 'berhasil';
  }
  if (notification.transaction_status === 'pending' ||
      (notification.transaction_status === 'capture' &&
       notification.fraud_status === 'challenge')) {
    return 'menunggu';
  }
  if (notification.transaction_status === 'capture' &&
      notification.fraud_status === 'deny') {
    return 'gagal';
  }
  if (['deny', 'cancel', 'expire', 'failure'].includes(notification.transaction_status)) {
    return 'gagal';
  }
  return null;
}

function createPaymentsRoutes(db, paymentClient) {
  const router = express.Router();

  router.post('/midtrans/notification', async (req, res, next) => {
    if (!paymentClient.isNotificationConfigured()) {
      return res.status(503).json({
        message: 'MIDTRANS_SERVER_KEY belum diatur pada backend/.env.',
      });
    }
    const notification = req.body;
    if (!paymentClient.verifyNotification(notification)) {
      return res.status(401).json({ message: 'Notifikasi Midtrans tidak valid.' });
    }

    const status = notificationStatus(notification);
    const notifiedAmount = amountInCents(notification.gross_amount);
    if (!status || notifiedAmount === null) {
      return res.status(422).json({ message: 'Data notifikasi Midtrans tidak valid.' });
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

      const [rows] = await connection.query(
        `SELECT p.id_pembayaran, p.id_transaksi, p.status_pembayaran, p.metode_pembayaran,
                p.jumlah_bayar, t.status_transaksi, t.kode_transaksi, t.stock_reserved,
                t.tanggal_transaksi
         FROM pembayaran p
         JOIN transaksi t ON t.id_transaksi = p.id_transaksi
         WHERE p.kode_referensi = ? AND t.jenis_transaksi = 'online'
         FOR UPDATE`,
        [notification.order_id],
      );
      if (!rows.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ message: 'Referensi pembayaran tidak ditemukan.' });
      }

      const payment = rows[0];
      if (amountInCents(String(payment.jumlah_bayar)) !== notifiedAmount) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(422).json({ message: 'Nominal notifikasi Midtrans tidak sesuai.' });
      }

      if (payment.status_pembayaran === 'menunggu' &&
          payment.status_transaksi === 'menunggu') {
        if (status === 'berhasil') {
          let stockReservedNow = Number(payment.stock_reserved) === 1;
          if (!stockReservedNow) {
            const [deductedRows] = await connection.query(
              `SELECT id_riwayat FROM riwayat_stok
               WHERE jenis_perubahan = 'keluar' AND keterangan LIKE ?
               LIMIT 1`,
              [`%${payment.kode_transaksi}%`],
            );

            if (!deductedRows.length) {
              const [items] = await connection.query(
                `SELECT id_produk, jumlah
                 FROM detail_transaksi
                 WHERE id_transaksi = ?
                 ORDER BY id_produk`,
                [payment.id_transaksi],
              );

              for (const item of items) {
                const [productRows] = await connection.query(
                  'SELECT id_produk, jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE',
                  [item.id_produk],
                );
                if (!productRows.length) continue;

                const stockBefore = Number(productRows[0].jumlah_stok);
                const requested = Number(item.jumlah);
                const deducted = Math.min(Math.max(0, stockBefore), requested);
                const stockAfter = Math.max(0, stockBefore - requested);

                let keterangan = `Pembayaran pesanan ${payment.kode_transaksi}`;
                if (stockBefore < requested) {
                  console.warn(
                    `[PERINGATAN STOK] Stok kurang untuk pesanan ${payment.kode_transaksi} (produk #${item.id_produk}): diminta ${requested}, tersedia ${stockBefore}`,
                  );
                  keterangan = `PERINGATAN: Stok kurang saat pembayaran pesanan ${payment.kode_transaksi} (diminta ${requested}, tersedia ${stockBefore})`;
                }

                await connection.query(
                  `UPDATE produk
                   SET jumlah_stok = ?, status_produk = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id_produk = ?`,
                  [stockAfter, stockAfter === 0 ? 'habis' : 'tersedia', item.id_produk],
                );
                await connection.query(
                  `INSERT INTO riwayat_stok (
                     id_produk, id_admin, jenis_perubahan, jumlah, stok_sebelum, stok_sesudah, keterangan
                   ) VALUES (?, NULL, 'keluar', ?, ?, ?, ?)`,
                  [item.id_produk, deducted, stockBefore, stockAfter, keterangan],
                );
              }
            }
            stockReservedNow = true;
          }

          await connection.query(
            `UPDATE pembayaran
             SET status_pembayaran = 'berhasil', tanggal_pembayaran = CURRENT_TIMESTAMP
             WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
            [payment.id_pembayaran],
          );
          await connection.query(
            `UPDATE pembayaran SET status_pembayaran = 'gagal'
             WHERE id_transaksi = ? AND id_pembayaran <> ?
               AND status_pembayaran = 'menunggu'`,
            [payment.id_transaksi, payment.id_pembayaran],
          );
          await connection.query(
            `UPDATE transaksi SET status_transaksi = 'dibayar', stock_reserved = ?
             WHERE id_transaksi = ? AND jenis_transaksi = 'online'
               AND status_transaksi = 'menunggu'`,
            [stockReservedNow ? 1 : 0, payment.id_transaksi],
          );
        } else if (status === 'gagal') {
          if (notification.transaction_status === 'expire' || isOrderPaymentExpired(payment)) {
            await expireOrderInTransaction(connection, payment, { force: true });
          } else {
            await connection.query(
              `UPDATE pembayaran SET status_pembayaran = 'gagal'
               WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
              [payment.id_pembayaran],
            );
          }
        }
      }

      await connection.commit();
      transactionStarted = false;
      return res.sendStatus(200);
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
  });

  return router;
}

module.exports = { createPaymentsRoutes, amountInCents, notificationStatus };
