const express = require('express');

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
        `SELECT p.id_pembayaran, p.id_transaksi, p.status_pembayaran,
                p.jumlah_bayar, t.status_transaksi
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
            `UPDATE transaksi SET status_transaksi = 'diproses'
             WHERE id_transaksi = ? AND jenis_transaksi = 'online'
               AND status_transaksi = 'menunggu'`,
            [payment.id_transaksi],
          );
        } else if (status === 'gagal') {
          await connection.query(
            `UPDATE pembayaran SET status_pembayaran = 'gagal'
             WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
            [payment.id_pembayaran],
          );
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
