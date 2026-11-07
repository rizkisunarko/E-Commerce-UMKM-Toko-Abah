const express = require('express');
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

function createTransactionsRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

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
        await db.query(
          'UPDATE transaksi SET status_transaksi = ? WHERE id_transaksi = ?',
          [status, id],
        );
        const [rows] = await db.query(
          `SELECT id_transaksi, kode_transaksi, status_transaksi
           FROM transaksi WHERE id_transaksi = ?`,
          [id],
        );

        if (!rows.length) {
          return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }
        return res.json({ data: rows[0] });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

module.exports = createTransactionsRoutes;
