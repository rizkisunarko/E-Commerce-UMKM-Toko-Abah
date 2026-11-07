const jwt = require('jsonwebtoken');

const ROLE_QUERIES = {
  admin: 'SELECT id_admin AS id, username AS nama FROM admin WHERE id_admin = ?',
  pegawai:
    "SELECT id_pegawai AS id, nama FROM pegawai WHERE id_pegawai = ? AND status = 'aktif'",
};

function createAuthenticate(db, jwtSecret) {
  return async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
    }

    let claims;
    try {
      claims = jwt.verify(match[1], jwtSecret);
    } catch {
      return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    }

    const id = Number(claims.sub);
    const query = Object.hasOwn(ROLE_QUERIES, claims.role) ? ROLE_QUERIES[claims.role] : null;
    if (!query || !Number.isSafeInteger(id) || id < 1) {
      return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
    }

    try {
      const [rows] = await db.query(query, [id]);
      if (!rows.length) {
        return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan' });
      }

      req.user = { id, nama: rows[0].nama, role: claims.role };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    return next();
  };
}

module.exports = { createAuthenticate, authorizeRoles };
