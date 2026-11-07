const express = require('express');
const { randomBytes } = require('node:crypto');
const { createAuthenticate } = require('../middleware/auth');

const PRODUCT_SELECT = `
  SELECT p.id_produk AS id,
         p.nama_produk AS nama,
         k.nama_kategori AS kategori,
         p.harga_jual AS harga,
         p.harga_beli,
         p.satuan,
         p.jumlah_stok AS stok,
         p.batas_stok_minimum AS batas_stok_kritis,
         CASE
           WHEN p.jumlah_stok <= p.batas_stok_minimum THEN 'Stok Kritis'
           ELSE 'Stok Aman'
         END AS status_stok
  FROM produk p
  JOIN kategori k ON k.id_kategori = p.id_kategori
`;

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  return isBlank(value) ? NaN : Number(value);
}

function validateProduct(body, includeStock) {
  const errors = {};
  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  const kategori = typeof body.kategori === 'string' ? body.kategori.trim() : '';
  const harga = toNumber(body.harga);
  const berat = isBlank(body.berat) ? null : toNumber(body.berat);
  const batasStok = isBlank(body.batas_stok_kritis)
    ? (includeStock ? 5 : null)
    : toNumber(body.batas_stok_kritis);
  const stok = toNumber(body.stok);
  const satuan = typeof body.satuan === 'string' ? body.satuan.trim() : '';

  if (!nama) errors.nama = REQUIRED;
  if (!kategori) errors.kategori = REQUIRED;
  if (isBlank(body.harga)) errors.harga = REQUIRED;
  else if (!Number.isFinite(harga) || harga <= 0) errors.harga = INVALID_NUMBER;
  if (berat !== null && (!Number.isFinite(berat) || berat <= 0)) errors.berat = INVALID_NUMBER;
  if (!satuan && berat === null) errors.satuan = REQUIRED;
  if (isBlank(body.batas_stok_kritis) === false &&
      (!Number.isFinite(batasStok) || batasStok < 0)) {
    errors.batas_stok_kritis = INVALID_NUMBER;
  }
  if (includeStock) {
    if (isBlank(body.stok)) errors.stok = REQUIRED;
    else if (!Number.isFinite(stok)) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  }
  if (!isBlank(body.harga_beli)) {
    const hargaBeli = toNumber(body.harga_beli);
    if (!Number.isFinite(hargaBeli) || hargaBeli < 0) errors.harga_beli = INVALID_NUMBER;
  }

  return {
    errors,
    values: {
      nama,
      kategori,
      harga,
      hargaBeli: isBlank(body.harga_beli)
        ? (includeStock ? 0 : null)
        : toNumber(body.harga_beli),
      satuan: satuan || `${berat} g`,
      stok,
      batasStok,
    },
  };
}

async function findCategoryId(connection, category) {
  const [rows] = await connection.query(
    'SELECT id_kategori FROM kategori WHERE nama_kategori = ?',
    [category],
  );
  return rows.length ? rows[0].id_kategori : null;
}

function stockChangeType(change) {
  return change > 0 ? 'masuk' : 'keluar';
}

function createProductsRoutes(db, jwtSecret) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);

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
        data: rows,
        pagination: { page, limit, total: Number(countRows[0].total) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/products', authenticate, async (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { errors, values } = validateProduct(req.body || {}, true);
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data tidak valid', errors });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const idKategori = await findCategoryId(connection, values.kategori);
      if (!idKategori) {
        await connection.rollback();
        return res.status(422).json({
          message: 'Data tidak valid',
          errors: { kategori: 'Kategori tidak valid' },
        });
      }

      const kodeProduk = `PRD-${randomBytes(8).toString('hex')}`;
      const [result] = await connection.query(
        `INSERT INTO produk (
           id_kategori, kode_produk, nama_produk, harga_beli, harga_jual,
           satuan, status_produk, jumlah_stok, batas_stok_minimum
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idKategori,
          kodeProduk,
          values.nama,
          values.hargaBeli,
          values.harga,
          values.satuan,
          values.stok === 0 ? 'habis' : 'tersedia',
          values.stok,
          values.batasStok,
        ],
      );
      if (values.stok > 0) {
        await connection.query(
          `INSERT INTO riwayat_stok (
             id_produk, id_admin, jenis_perubahan, jumlah, stok_sebelum, stok_sesudah, keterangan
           ) VALUES (?, ?, 'masuk', ?, 0, ?, 'Stok awal produk')`,
          [result.insertId, req.user.id, values.stok, values.stok],
        );
      }
      const [rows] = await connection.query(`${PRODUCT_SELECT} WHERE p.id_produk = ?`, [result.insertId]);
      await connection.commit();
      return res.status(201).json({ data: rows[0] });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
    }
  });

  router.put('/products/:id', authenticate, async (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const { errors, values } = validateProduct(req.body || {}, false);
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data tidak valid', errors });
    }

    try {
      const idKategori = await findCategoryId(db, values.kategori);
      if (!idKategori) {
        return res.status(422).json({
          message: 'Data tidak valid',
          errors: { kategori: 'Kategori tidak valid' },
        });
      }
      const satuan = values.satuan;
      await db.query(
        `UPDATE produk
         SET id_kategori = ?, nama_produk = ?, harga_jual = ?,
             harga_beli = COALESCE(?, harga_beli),
             satuan = ?, batas_stok_minimum = COALESCE(?, batas_stok_minimum),
             updated_at = CURRENT_TIMESTAMP
         WHERE id_produk = ?`,
        [idKategori, values.nama, values.harga, values.hargaBeli, satuan, values.batasStok, id],
      );
      const [rows] = await db.query(`${PRODUCT_SELECT} WHERE p.id_produk = ?`, [id]);
      if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });
      return res.json({ data: rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/products/:id', authenticate, async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    try {
      const [rows] = await db.query(`${PRODUCT_SELECT} WHERE p.id_produk = ?`, [id]);
      if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan' });
      return res.json({ data: rows[0] });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/stock', authenticate, async (req, res, next) => {
    const conditions = [];
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
        'SELECT COUNT(*) AS stok_kritis FROM produk WHERE jumlah_stok <= batas_stok_minimum',
      );
      return res.json({ data: rows, ringkasan: { stok_kritis: Number(countRows[0].stok_kritis) } });
    } catch (error) {
      return next(error);
    }
  });

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
    if (!Number.isFinite(stok)) {
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
        'SELECT jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE',
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
      return res.json({ data: rows[0] });
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
