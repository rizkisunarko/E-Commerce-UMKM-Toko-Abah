const defaultDb = require('../config/db');
const { validateProduct, CATEGORIES } = require('../utils/productValidation');
const { randomBytes } = require('node:crypto');

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
         END AS status_stok,
         p.created_at,
         p.updated_at
  FROM produk p
  JOIN kategori k ON k.id_kategori = p.id_kategori
`;

function parseGram(satuan) {
  if (typeof satuan !== 'string') return 0;
  const match = satuan.match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml)?/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') return Math.round(val * 1000);
  return Math.round(val);
}

// status_stok dihitung, tidak disimpan (AC-04.1)
function formatProduct(row) {
  if (!row) return null;
  const berat = row.berat !== undefined && row.berat !== null
    ? Number(row.berat)
    : parseGram(row.satuan);

  return {
    ...row,
    id: typeof row.id === 'string' ? Number(row.id) : row.id,
    nama: row.nama,
    kategori: row.kategori,
    berat,
    status_stok: Number(row.stok) <= Number(row.batas_stok_kritis) ? 'Stok Kritis' : 'Stok Aman',
  };
}

async function findCategoryId(connection, category) {
  const [rows] = await connection.query(
    'SELECT id_kategori FROM kategori WHERE nama_kategori = ?',
    [category],
  );
  return rows.length ? rows[0].id_kategori : null;
}

// Handler untuk POST /api/products
async function createProductHandler(req, res, next, db = defaultDb) {
  // Hanya admin yang boleh menambah produk
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak' });
  }

  const { errors, values } = validateProduct(req.body, 'create');
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Data tidak valid', errors });
  }

  let connection;
  try {
    connection = typeof db.getConnection === 'function' ? await db.getConnection() : db;
    if (typeof connection.beginTransaction === 'function') {
      await connection.beginTransaction();
    }

    const idKategori = await findCategoryId(connection, values.kategori);
    if (!idKategori) {
      if (typeof connection.rollback === 'function') await connection.rollback();
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
        values.batas_stok_kritis,
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
    if (typeof connection.commit === 'function') {
      await connection.commit();
    }

    return res.status(201).json({ data: formatProduct(rows[0]) });
  } catch (error) {
    if (connection && typeof connection.rollback === 'function') {
      await connection.rollback();
    }
    return next ? next(error) : res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  } finally {
    if (connection && typeof connection.release === 'function') {
      connection.release();
    }
  }
}

module.exports = {
  createProduct: (req, res, next) => createProductHandler(req, res, next, defaultDb),
  createProductHandler,
  formatProduct,
  parseGram,
  findCategoryId,
  PRODUCT_SELECT,
};
