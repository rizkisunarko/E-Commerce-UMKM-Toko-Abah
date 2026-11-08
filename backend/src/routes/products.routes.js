const express = require('express');
const { createAuthenticate, authorizeRoles } = require('../middleware/auth');
const { validateProduct, REQUIRED, INVALID_NUMBER } = require('../utils/productValidation');
const {
  createProductHandler,
  formatProduct,
  findCategoryId,
  PRODUCT_SELECT,
} = require('../controllers/product.controller');

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  return isBlank(value) ? NaN : Number(value);
}

function stockChangeType(change) {
  return change > 0 ? 'masuk' : 'keluar';
}

function createProductsRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

  // 1. GET /api/categories - Mengambil daftar kategori
  router.get('/categories', authenticate, async (req, res, next) => {
    try {
      const [rows] = await db.query(
        'SELECT nama_kategori FROM kategori ORDER BY nama_kategori',
      );
      return res.json({ data: rows.map((row) => row.nama_kategori) });
    } catch (error) {
      return next(error);
    }
  });

  // 2. GET /api/products - Mengambil daftar produk (dengan paginasi & filter)
  router.get('/products', authenticate, async (req, res, next) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    if (!Number.isSafeInteger(page) || page < 1 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Nomor halaman atau batas data tidak valid' });
    }

    const conditions = [];
    const params = [];
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      conditions.push('p.nama_produk LIKE ?');
      params.push(`%${req.query.search.trim()}%`);
    }
    if (typeof req.query.kategori === 'string' && req.query.kategori.trim()) {
      conditions.push('k.nama_kategori = ?');
      params.push(req.query.kategori.trim());
    }
    if (!(req.user.role === 'admin' && req.query.include_archived === 'true')) {
      conditions.push('p.archived_at IS NULL');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    try {
      const [rows] = await db.query(
        `${PRODUCT_SELECT} ${where} ORDER BY p.nama_produk LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM produk p
         JOIN kategori k ON k.id_kategori = p.id_kategori
         ${where}`,
        params,
      );
      return res.json({
        data: rows.map(formatProduct),
        pagination: { page, limit, total: Number(countRows[0].total) },
      });
    } catch (error) {
      return next(error);
    }
  });

  // 3. POST /api/products - Tambah produk baru (PPL-01.1, Khusus Admin)
  router.post('/products', authenticate, (req, res, next) => {
    return createProductHandler(req, res, next, db);
  });

  // 4. PUT /api/products/:id - Ubah data produk (Khusus Admin)
  router.put('/products/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const { errors, values } = validateProduct(req.body || {}, 'update');
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data tidak valid', errors });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [products] = await connection.query(
        'SELECT jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE',
        [id],
      );
      if (!products.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      const idKategori = await findCategoryId(connection, values.kategori);
      if (!idKategori) {
        await connection.rollback();
        return res.status(422).json({
          message: 'Data tidak valid',
          errors: { kategori: 'Kategori tidak valid' },
        });
      }
      const previousStock = Number(products[0].jumlah_stok);
      const stockChanged = values.stok !== undefined && values.stok !== previousStock;
      const satuan = values.satuan;
      await connection.query(
        `UPDATE produk
         SET id_kategori = ?, nama_produk = ?, harga_jual = ?,
             harga_beli = COALESCE(?, harga_beli),
             satuan = ?, batas_stok_minimum = COALESCE(?, batas_stok_minimum),
             jumlah_stok = COALESCE(?, jumlah_stok),
             status_produk = CASE WHEN ? IS NULL THEN status_produk
               WHEN ? = 0 THEN 'habis' ELSE 'tersedia' END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_produk = ?`,
        [
          idKategori,
          values.nama,
          values.harga,
          values.hargaBeli,
          satuan,
          values.batas_stok_kritis,
          values.stok ?? null,
          values.stok ?? null,
          values.stok ?? null,
          id,
        ],
      );
      if (stockChanged) {
        const change = values.stok - previousStock;
        await connection.query(
          `INSERT INTO riwayat_stok (
             id_produk, id_admin, jenis_perubahan, jumlah,
             stok_sebelum, stok_sesudah, keterangan
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            req.user.id,
            stockChangeType(change),
            Math.abs(change),
            previousStock,
            values.stok,
            'Penyesuaian stok saat mengubah produk',
          ],
        );
      }
      const [rows] = await connection.query(`${PRODUCT_SELECT} WHERE p.id_produk = ?`, [id]);
      await connection.commit();
      return res.json({ data: formatProduct(rows[0]) });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
    }
  });

  // PPL-14: Arsip bersifat lunak agar riwayat transaksi dan stok tetap tersimpan.
  router.patch('/products/:id/archive', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }
    if (typeof req.body?.archived !== 'boolean') {
      return res.status(422).json({
        message: 'Data tidak valid',
        errors: { archived: 'Status arsip harus berupa true atau false' },
      });
    }

    try {
      const [products] = await db.query(
        'SELECT id_produk FROM produk WHERE id_produk = ?',
        [id],
      );
      if (!products.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });

      await db.query(
        `UPDATE produk
         SET archived_at = CASE
           WHEN ? = 1 THEN COALESCE(archived_at, CURRENT_TIMESTAMP)
           ELSE NULL
         END,
         updated_at = CURRENT_TIMESTAMP
         WHERE id_produk = ?`,
        [req.body.archived, id],
      );
      return res.json({
        message: req.body.archived ? 'Produk berhasil diarsipkan' : 'Produk berhasil dipulihkan',
      });
    } catch (error) {
      return next(error);
    }
  });

  // 5. GET /api/products/:id - Detail produk berdasarkan ID
  router.get('/products/:id', authenticate, async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    try {
      const archiveCondition = req.user.role === 'admin' ? '' : ' AND p.archived_at IS NULL';
      const [rows] = await db.query(
        `${PRODUCT_SELECT} WHERE p.id_produk = ?${archiveCondition}`,
        [id],
      );
      if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });
      return res.json({ data: formatProduct(rows[0]) });
    } catch (error) {
      return next(error);
    }
  });

  // 6. GET /api/stock - Daftar stok produk (termasuk filter stok kritis)
  router.get('/stock', authenticate, async (req, res, next) => {
    const conditions = ['p.archived_at IS NULL'];
    const params = [];
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      conditions.push('p.nama_produk LIKE ?');
      params.push(`%${req.query.search.trim()}%`);
    }
    if (req.query.kritis === 'true') {
      conditions.push('p.jumlah_stok <= p.batas_stok_minimum');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const [rows] = await db.query(
        `${PRODUCT_SELECT} ${where} ORDER BY p.nama_produk`,
        params,
      );
      const [countRows] = await db.query(
        'SELECT COUNT(*) AS stok_kritis FROM produk WHERE archived_at IS NULL AND jumlah_stok <= batas_stok_minimum',
      );
      return res.json({
        data: rows.map(formatProduct),
        ringkasan: { stok_kritis: Number(countRows[0].stok_kritis) },
      });
    } catch (error) {
      return next(error);
    }
  });

  // 7. PATCH /api/products/:id/stock - Penyesuaian stok produk
  router.patch('/products/:id/stock', authenticate, async (req, res, next) => {
    if (!['admin', 'pegawai'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const stok = toNumber(req.body?.stok);
    if (isBlank(req.body?.stok)) {
      return res.status(422).json({ message: 'Data tidak valid', errors: { stok: REQUIRED } });
    }
    if (!Number.isSafeInteger(stok) || stok > 2147483647) {
      return res.status(422).json({ message: 'Data tidak valid', errors: { stok: INVALID_NUMBER } });
    }
    if (stok < 0) {
      return res.status(422).json({
        message: 'Data tidak valid',
        errors: { stok: 'Jumlah stok tidak boleh negatif' },
      });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [products] = await connection.query(
        'SELECT jumlah_stok FROM produk WHERE id_produk = ? AND archived_at IS NULL FOR UPDATE',
        [id],
      );
      if (!products.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      const previousStock = Number(products[0].jumlah_stok);
      const change = stok - previousStock;
      if (req.user.role === 'pegawai' && change >= 0) {
        await connection.rollback();
        return res.status(403).json({ message: 'Pegawai hanya dapat mengurangi stok' });
      }

      await connection.query(
        `UPDATE produk
         SET jumlah_stok = ?, status_produk = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id_produk = ?`,
        [stok, stok === 0 ? 'habis' : 'tersedia', id],
      );
      if (change !== 0) {
        await connection.query(
          `INSERT INTO riwayat_stok (
             id_produk, id_admin, jenis_perubahan, jumlah,
             stok_sebelum, stok_sesudah, keterangan
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            req.user.role === 'admin' ? req.user.id : null,
            stockChangeType(change),
            Math.abs(change),
            previousStock,
            stok,
            req.user.role === 'admin'
              ? 'Penyesuaian stok melalui aplikasi'
              : `Penyesuaian stok oleh pegawai ${req.user.nama} (ID ${req.user.id})`,
          ],
        );
      }
      const [rows] = await connection.query(`${PRODUCT_SELECT} WHERE p.id_produk = ?`, [id]);
      await connection.commit();
      return res.json({ data: formatProduct(rows[0]) });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
}

module.exports = createProductsRoutes;
