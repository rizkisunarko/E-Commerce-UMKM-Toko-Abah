const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createAuthenticate } = require('../middleware/auth');

function createAuthRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

  router.post('/login', async (req, res, next) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).json({ message: 'Nama pengguna dan kata sandi wajib diisi' });
    }

    try {
      const [rows] = await db.query(
        `SELECT id_admin AS id, username, password, username AS nama, 'admin' AS role, NULL AS status
         FROM admin WHERE username = ?
         UNION ALL
         SELECT id_pegawai AS id, username, password, nama, 'pegawai' AS role, status
         FROM pegawai WHERE username = ?
         LIMIT 2`,
        [username, username],
      );

      if (
        rows.length !== 1 ||
        (rows[0].role === 'pegawai' && rows[0].status !== 'aktif')
      ) {
        return res.status(401).json({ message: 'Nama pengguna atau kata sandi salah' });
      }

      const account = rows[0];
      const passwordMatches = await bcrypt.compare(password, account.password);
      if (!passwordMatches) {
        return res.status(401).json({ message: 'Nama pengguna atau kata sandi salah' });
      }

      const token = jwt.sign(
        { nama: account.nama, role: account.role },
        jwtSecret,
        { subject: String(account.id), expiresIn: '8h' },
      );
      return res.json({
        token,
        user: { id: Number(account.id), nama: account.nama, role: account.role },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = createAuthRoutes;
