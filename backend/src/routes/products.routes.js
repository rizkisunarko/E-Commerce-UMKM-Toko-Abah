const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { createAuthenticate, authorizeRoles } = require('../middleware/auth');
const { validateProduct, REQUIRED, INVALID_NUMBER } = require('../utils/productValidation');
const {
  createProductHandler,
  formatProduct,
  findCategoryId,
  PRODUCT_SELECT,
} = require('../controllers/product.controller');

const CREATE_REVIEWS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ulasan_produk (
    id_ulasan int NOT NULL AUTO_INCREMENT,
    id_produk int NOT NULL,
    id_transaksi int DEFAULT NULL,
    nama_pengulas varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    rating tinyint UNSIGNED NOT NULL,
    komentar text COLLATE utf8mb4_unicode_ci NOT NULL,
    terverifikasi tinyint(1) NOT NULL DEFAULT '0',
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_ulasan),
    KEY idx_ulasan_produk (id_produk, created_at),
    UNIQUE KEY uq_ulasan_transaksi_produk (id_transaksi, id_produk),
    CONSTRAINT fk_ulasan_produk FOREIGN KEY (id_produk) REFERENCES produk (id_produk) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ulasan_transaksi FOREIGN KEY (id_transaksi) REFERENCES transaksi (id_transaksi) ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function runWithReviewsTable(db, fn) {
  try {
    return await fn();
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      await db.query(CREATE_REVIEWS_TABLE_SQL);
      return await fn();
    }
    throw error;
  }
}

const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/products');
const ALLOWED_IMAGE_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function detectImageExtension(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

const CATALOG_PRODUCT_SELECT = `
  SELECT p.id_produk AS id,
         p.nama_produk AS nama,
         k.nama_kategori AS kategori,
         p.deskripsi,
         p.harga_jual AS harga,
         p.satuan,
         p.foto_produk,
         p.jumlah_stok AS stok,
         COALESCE((
           SELECT SUM(dt.jumlah)
           FROM detail_transaksi dt
           JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
           WHERE dt.id_produk = p.id_produk
             AND (
               (t.jenis_transaksi = 'kasir' AND t.status_transaksi = 'selesai')
               OR (t.jenis_transaksi = 'online' AND t.status_transaksi IN ('dibayar', 'diproses', 'siap_diambil', 'siap_dikirim', 'selesai'))
             )
         ), 0) AS terjual,
         COALESCE((
           SELECT ROUND(AVG(u.rating), 1)
           FROM ulasan_produk u
           WHERE u.id_produk = p.id_produk
         ), 0) AS rating_rata,
         COALESCE((
           SELECT COUNT(*)
           FROM ulasan_produk u
           WHERE u.id_produk = p.id_produk
         ), 0) AS jumlah_ulasan
  FROM produk p
  JOIN kategori k ON k.id_kategori = p.id_kategori
`;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  return isBlank(value) ? NaN : Number(value);
}

function stockChangeType(change) {
  return change > 0 ? 'masuk' : 'keluar';
}

function parseProductListQuery(query) {
  const errors = {};
  const parsePositiveInteger = (value, field, fallback, maximum) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      errors[field] = 'Masukkan bilangan bulat positif';
      return fallback;
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      errors[field] = 'Nilai terlalu besar';
      return fallback;
    }
    if (parsed < 1) {
      errors[field] = 'Masukkan bilangan bulat positif';
      return fallback;
    }
    if (maximum !== undefined && parsed > maximum) {
      errors[field] = `Nilai harus antara 1 dan ${maximum}`;
      return fallback;
    }
    return parsed;
  };

  const page = parsePositiveInteger(query.page, 'page', 1);
  const limit = parsePositiveInteger(query.limit, 'limit', 10, 100);
  const search = query.search === undefined ? '' : query.search;
  const kategori = query.kategori === undefined ? '' : query.kategori;

  if (typeof search !== 'string') {
    errors.search = 'Pencarian harus berupa teks';
  } else if (search.trim().length > 150) {
    errors.search = 'Pencarian maksimal 150 karakter';
  }
  if (typeof kategori !== 'string') {
    errors.kategori = 'Kategori harus berupa teks';
  } else if (kategori.trim().length > 100) {
    errors.kategori = 'Kategori maksimal 100 karakter';
  }
  if (query.include_archived !== undefined &&
      !['true', 'false'].includes(query.include_archived)) {
    errors.include_archived = 'Nilai harus true atau false';
  }

  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) {
    errors.page = 'Nomor halaman terlalu besar';
  }

  return {
    errors,
    page,
    limit,
    offset,
    search: typeof search === 'string' ? search.trim() : '',
    kategori: typeof kategori === 'string' ? kategori.trim() : '',
  };
}

function formatCatalogProduct(row) {
  const product = formatProduct(row);
  const reviewCount = Number(row.jumlah_ulasan || 0);
  const avgRating = reviewCount > 0 && row.rating_rata !== undefined && row.rating_rata !== null
    ? Number(row.rating_rata)
    : null;
  return {
    id: product.id,
    nama: product.nama,
    kategori: product.kategori,
    deskripsi: product.deskripsi || null,
    harga: Number(product.harga),
    satuan: product.satuan,
    berat: product.berat,
    foto_produk: product.foto_produk || null,
    stok: Number(product.stok),
    tersedia: Number(product.stok) > 0,
    terjual: Number(row.terjual || 0),
    rating_rata: avgRating,
    jumlah_ulasan: reviewCount,
  };
}

function createProductListHandler(db, { publicCatalog = false } = {}) {
  return async (req, res, next) => {
    const { errors, page, limit, offset, search, kategori } =
      parseProductListQuery(req.query);
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Parameter daftar produk tidak valid', errors });
    }
    if (req.query.include_archived === 'true' &&
        (publicCatalog || req.user.role !== 'admin')) {
      return res.status(403).json({
        message: publicCatalog
          ? 'Produk arsip tidak dapat diakses melalui katalog publik'
          : 'Hanya admin yang dapat melihat produk arsip',
      });
    }

    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('p.nama_produk LIKE ?');
      params.push(`%${search}%`);
    }
    if (kategori) {
      conditions.push('k.nama_kategori = ?');
      params.push(kategori);
    }
    const includeArchived = !publicCatalog &&
      req.user.role === 'admin' &&
      req.query.include_archived === 'true';
    if (!includeArchived) conditions.push('p.archived_at IS NULL');
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const select = publicCatalog ? CATALOG_PRODUCT_SELECT : PRODUCT_SELECT;

    try {
      const executeQuery = () => Promise.all([
        db.query(
          `${select} ${where} ORDER BY p.nama_produk, p.id_produk LIMIT ? OFFSET ?`,
          [...params, limit, offset],
        ),
        db.query(
          `SELECT COUNT(*) AS total
           FROM produk p
           JOIN kategori k ON k.id_kategori = p.id_kategori
           ${where}`,
          params,
        ),
      ]);
      const [[rows], [countRows]] = publicCatalog
        ? await runWithReviewsTable(db, executeQuery)
        : await executeQuery();
      const includeCost = !publicCatalog && req.user?.role === 'admin';
      return res.json({
        data: rows.map((row) =>
          (publicCatalog ? formatCatalogProduct(row) : formatProduct(row, { includeCost }))),
        pagination: {
          page,
          limit,
          total: Number(countRows[0].total),
          total_pages: Math.ceil(Number(countRows[0].total) / limit),
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}

function createProductsRoutes(db, jwtSecret, uploadDir = DEFAULT_UPLOAD_DIR) {
  const router = express.Router();
  const authenticate = createAuthenticate(db, jwtSecret);
  const rawImageParser = express.raw({
    type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    limit: '2mb',
  });

  const reviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak pengiriman ulasan. Silakan coba lagi nanti.' },
  });

  router.get('/catalog/categories', async (req, res, next) => {
    try {
      const [rows] = await db.query(
        'SELECT nama_kategori FROM kategori ORDER BY nama_kategori',
      );
      return res.json({ data: rows.map((row) => row.nama_kategori) });
    } catch (error) {
      return next(error);
    }
  });
  router.get('/catalog', createProductListHandler(db, { publicCatalog: true }));

  router.get('/catalog/:id/reviews', async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    try {
      const [products] = await db.query(
        'SELECT id_produk FROM produk WHERE id_produk = ? AND archived_at IS NULL',
        [id],
      );
      if (!products.length) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      const [reviews, summaryRows] = await runWithReviewsTable(db, () => Promise.all([
        db.query(
          `SELECT id_ulasan AS id, nama_pengulas, rating, komentar, terverifikasi, created_at
           FROM ulasan_produk
           WHERE id_produk = ?
           ORDER BY created_at DESC, id_ulasan DESC
           LIMIT 50`,
          [id],
        ).then(([rows]) => rows),
        db.query(
          `SELECT COUNT(*) AS jumlah_ulasan, ROUND(AVG(rating), 1) AS rating_rata
           FROM ulasan_produk
           WHERE id_produk = ?`,
          [id],
        ).then(([rows]) => rows),
      ]));

      const jumlahUlasan = Number(summaryRows[0]?.jumlah_ulasan || 0);
      return res.json({
        data: reviews.map((r) => ({
          id: Number(r.id),
          nama_pengulas: r.nama_pengulas,
          rating: Number(r.rating),
          komentar: r.komentar,
          terverifikasi: Boolean(Number(r.terverifikasi)),
          created_at: r.created_at,
        })),
        ringkasan: {
          jumlah_ulasan: jumlahUlasan,
          rating_rata: jumlahUlasan > 0 ? Number(summaryRows[0].rating_rata) : null,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/catalog/:id/reviews', reviewLimiter, async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const nama = typeof req.body?.nama_pengulas === 'string' ? req.body.nama_pengulas.trim() : '';
    const komentar = typeof req.body?.komentar === 'string' ? req.body.komentar.trim() : '';
    const rating = Number(req.body?.rating);
    const nomorPesanan = typeof req.body?.nomor_pesanan === 'string'
      ? req.body.nomor_pesanan.trim()
      : '';

    const errors = {};
    if (!nama) errors.nama_pengulas = REQUIRED;
    else if (nama.length > 100) errors.nama_pengulas = 'Nama maksimal 100 karakter';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.rating = 'Rating harus antara 1 sampai 5';
    }

    if (!komentar) errors.komentar = REQUIRED;
    else if (komentar.length < 3) errors.komentar = 'Ulasan minimal 3 karakter';
    else if (komentar.length > 500) errors.komentar = 'Ulasan maksimal 500 karakter';

    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data ulasan tidak valid', errors });
    }

    try {
      const [products] = await db.query(
        'SELECT id_produk FROM produk WHERE id_produk = ? AND archived_at IS NULL',
        [id],
      );
      if (!products.length) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      let idTransaksi = null;
      let terverifikasi = 0;
      if (nomorPesanan) {
        const [orders] = await db.query(
          `SELECT t.id_transaksi
           FROM transaksi t
           JOIN detail_transaksi dt ON dt.id_transaksi = t.id_transaksi
           WHERE t.kode_transaksi = ?
             AND t.status_transaksi = 'selesai'
             AND dt.id_produk = ?
           LIMIT 1`,
          [nomorPesanan, id],
        );
        if (!orders.length) {
          return res.status(422).json({
            message: 'Data ulasan tidak valid',
            errors: {
              nomor_pesanan: 'Nomor pesanan tidak ditemukan, belum selesai, atau tidak memuat produk ini',
            },
          });
        }
        idTransaksi = orders[0].id_transaksi;
        terverifikasi = 1;
      }

      const [insertResult] = await runWithReviewsTable(db, () => db.query(
        `INSERT INTO ulasan_produk (
           id_produk, id_transaksi, nama_pengulas, rating, komentar, terverifikasi
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, idTransaksi, nama, rating, komentar, terverifikasi],
      ));

      const [summaryRows] = await db.query(
        `SELECT COUNT(*) AS jumlah_ulasan, ROUND(AVG(rating), 1) AS rating_rata
         FROM ulasan_produk
         WHERE id_produk = ?`,
        [id],
      );
      const jumlahUlasan = Number(summaryRows[0]?.jumlah_ulasan || 0);

      return res.status(201).json({
        data: {
          id: Number(insertResult.insertId),
          nama_pengulas: nama,
          rating,
          komentar,
          terverifikasi: Boolean(terverifikasi),
          created_at: new Date().toISOString(),
        },
        ringkasan: {
          jumlah_ulasan: jumlahUlasan,
          rating_rata: jumlahUlasan > 0 ? Number(summaryRows[0].rating_rata) : null,
        },
      });
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        return res.status(422).json({
          message: 'Produk pada pesanan ini sudah pernah diulas',
          errors: { nomor_pesanan: 'Produk pada pesanan ini sudah pernah diulas' },
        });
      }
      return next(error);
    }
  });

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
  router.get('/products', authenticate, createProductListHandler(db));

  // 3. POST /api/products/photo - Upload foto produk (Khusus Admin)
  router.post(
    '/products/photo',
    authenticate,
    authorizeRoles('admin'),
    (req, res, next) => {
      rawImageParser(req, res, (err) => {
        if (err) {
          if (err.type === 'entity.too.large') {
            return res.status(413).json({
              message: 'Ukuran foto maksimal 2 MB',
              errors: { foto_produk: 'Ukuran foto maksimal 2 MB' },
            });
          }
          return res.status(400).json({ message: 'Gagal membaca file foto' });
        }
        return next();
      });
    },
    async (req, res, next) => {
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const expectedExt = ALLOWED_IMAGE_MIME[contentType];
      const detectedExt = detectImageExtension(req.body);
      if (!expectedExt || !detectedExt || expectedExt !== detectedExt) {
        return res.status(422).json({
          message: 'Format foto harus JPG, PNG, atau WebP',
          errors: { foto_produk: 'Format foto harus JPG, PNG, atau WebP (maks. 2 MB)' },
        });
      }

      try {
        await fs.mkdir(uploadDir, { recursive: true });
        const filename = `prd-${Date.now()}-${randomBytes(6).toString('hex')}.${detectedExt}`;
        await fs.writeFile(path.join(uploadDir, filename), req.body);
        return res.status(201).json({
          data: { url: `/uploads/products/${filename}` },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  // 4. POST /api/products - Tambah produk baru (PPL-01.1, Khusus Admin)
  router.post('/products', authenticate, (req, res, next) => {
    return createProductHandler(req, res, next, db);
  });

  // 5. PUT /api/products/:id - Ubah data produk (Khusus Admin)
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
      const hasDescriptionUpdate = values.deskripsi !== undefined;
      const hasPhotoUpdate = values.foto_produk !== undefined;
      await connection.query(
        `UPDATE produk
         SET id_kategori = ?, nama_produk = ?, harga_jual = ?,
             harga_beli = COALESCE(?, harga_beli),
             satuan = ?,
             deskripsi = CASE WHEN ? = 1 THEN ? ELSE deskripsi END,
             foto_produk = CASE WHEN ? = 1 THEN ? ELSE foto_produk END,
             batas_stok_minimum = COALESCE(?, batas_stok_minimum),
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
          hasDescriptionUpdate ? 1 : 0,
          hasDescriptionUpdate ? values.deskripsi : null,
          hasPhotoUpdate ? 1 : 0,
          hasPhotoUpdate ? values.foto_produk : null,
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

  router.delete('/products/:id', authenticate, authorizeRoles('admin'), async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [products] = await connection.query(
        `SELECT p.id_produk,
                EXISTS(SELECT 1 FROM detail_transaksi dt WHERE dt.id_produk = p.id_produk)
                  AS has_sales,
                EXISTS(SELECT 1 FROM detail_pembelian dp WHERE dp.id_produk = p.id_produk)
                  AS has_purchases,
                EXISTS(SELECT 1 FROM riwayat_stok rs WHERE rs.id_produk = p.id_produk)
                  AS has_stock_history,
                EXISTS(SELECT 1 FROM item_keranjang ik WHERE ik.id_produk = p.id_produk)
                  AS has_cart_items
         FROM produk p
         WHERE p.id_produk = ?
         FOR UPDATE`,
        [id],
      );
      if (!products.length) {
        await connection.rollback();
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
      }

      const product = products[0];
      const hasHistory = [
        product.has_sales,
        product.has_purchases,
        product.has_stock_history,
        product.has_cart_items,
      ].some((value) => Number(value) === 1);

      if (hasHistory) {
        await connection.query(
          `UPDATE produk
           SET archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE id_produk = ?`,
          [id],
        );
        await connection.commit();
        return res.json({
          action: 'archived',
          message: 'Produk memiliki riwayat atau masih digunakan, sehingga berhasil diarsipkan',
        });
      }

      await connection.query('DELETE FROM produk WHERE id_produk = ?', [id]);
      await connection.commit();
      return res.json({
        action: 'deleted',
        message: 'Produk berhasil dihapus permanen',
      });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
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
      return res.json({
        data: formatProduct(rows[0], { includeCost: req.user?.role === 'admin' }),
      });
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
      const includeCost = req.user?.role === 'admin';
      return res.json({
        data: rows.map((row) => formatProduct(row, { includeCost })),
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
