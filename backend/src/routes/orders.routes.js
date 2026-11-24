const express = require('express');
const { randomBytes } = require('node:crypto');
const { createAuthenticate, authorizeRoles } = require('../middleware/auth');
const parseGram = require('../utils/weight');
const { calculateTotalWeight } = parseGram;

const MAX_ITEMS = 100;
const MAX_QUANTITY = 1000;
const MAX_MONEY_CENTS = 999999999999;
const PHONE_PATTERN = /^(\+62|62|0)8\d{8,11}$/;
const PICKUP_METHOD = 'ambil_di_toko';
const COURIER_METHOD = 'kurir';
const PAYMENT_METHODS = ['midtrans', 'cod'];

function validatePayload(body) {
  const errors = {};
  const nama = typeof body?.nama_pemesan === 'string' ? body.nama_pemesan.trim() : '';
  const noHp = typeof body?.no_hp === 'string'
    ? body.no_hp.trim().replace(/[\s-]/g, '')
    : '';
  const catatan = body?.catatan === undefined ? '' : body.catatan;
  const metode = body?.metode_penerimaan;
  const metodePembayaran = body?.metode_pembayaran ?? 'midtrans';
  const alamat = body?.alamat_lengkap === undefined ? '' : body.alamat_lengkap;
  const wilayah = body?.wilayah === undefined ? '' : body.wilayah;
  const quantities = new Map();

  if (!nama) errors.nama_pemesan = 'Kolom ini wajib diisi';
  else if (nama.length > 100) errors.nama_pemesan = 'Nama maksimal 100 karakter';
  if (!noHp) errors.no_hp = 'Kolom ini wajib diisi';
  else if (!PHONE_PATTERN.test(noHp)) {
    errors.no_hp = 'Masukkan nomor HP yang valid (contoh: 081234567890)';
  }
  if (metode !== PICKUP_METHOD && metode !== COURIER_METHOD) {
    errors.metode_penerimaan = 'Pilih cara menerima pesanan';
  }
  if (!PAYMENT_METHODS.includes(metodePembayaran)) {
    errors.metode_pembayaran = 'Pilih metode pembayaran yang tersedia';
  } else if (metodePembayaran === 'cod' && metode !== COURIER_METHOD) {
    errors.metode_pembayaran = 'COD hanya tersedia untuk pengiriman kurir';
  }
  if (typeof catatan !== 'string' || catatan.length > 2000) {
    errors.catatan = 'Catatan maksimal 2000 karakter';
  }
  if (typeof alamat !== 'string' || alamat.length > 1000) {
    errors.alamat_lengkap = 'Alamat maksimal 1000 karakter';
  } else if (metode === COURIER_METHOD && !alamat.trim()) {
    errors.alamat_lengkap = 'Kolom ini wajib diisi';
  }
  if (typeof wilayah !== 'string' || wilayah.length > 255) {
    errors.wilayah = 'Wilayah maksimal 255 karakter';
  } else if (metode === COURIER_METHOD && !wilayah.trim()) {
    errors.wilayah = 'Pilih wilayah tujuan';
  }

  const items = body && Array.isArray(body.items) ? body.items : [];
  if (items.length === 0 || items.length > MAX_ITEMS) {
    errors.items = 'Pilih 1 sampai 100 produk';
  }
  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.jumlah);
    const key = Number.isSafeInteger(productId) && productId > 0
      ? `items.${productId}`
      : 'items';

    if (!Number.isSafeInteger(productId) || productId < 1) {
      errors[key] = 'Produk tidak valid';
    } else if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      errors[key] = 'Jumlah harus berupa bilangan bulat positif';
    } else {
      const combined = (quantities.get(productId) || 0) + quantity;
      if (!Number.isSafeInteger(combined) || combined > MAX_QUANTITY) {
        errors[key] = `Jumlah maksimal ${MAX_QUANTITY} per produk`;
      } else {
        quantities.set(productId, combined);
      }
    }
  }

  let destinationId;
  let selectedRateId;
  if (metode === COURIER_METHOD) {
    destinationId = String(body?.destination_id ?? '');
    selectedRateId = typeof body?.selected_rate_id === 'string'
      ? body.selected_rate_id.trim()
      : '';
    if (!/^\d+$/.test(destinationId) ||
        !Number.isSafeInteger(Number(destinationId)) || Number(destinationId) < 1) {
      errors.destination_id = 'Pilih wilayah tujuan yang valid';
    }
    if (!selectedRateId || selectedRateId.length > 100) {
      errors.selected_rate_id = 'Pilih layanan kurir';
    }
  }

  return {
    errors,
    values: {
      nama,
      noHp,
      catatan: typeof catatan === 'string' ? catatan.trim() : '',
      metode,
      metodePembayaran,
      alamat: typeof alamat === 'string' ? alamat.trim() : '',
      wilayah: typeof wilayah === 'string' ? wilayah.trim() : '',
      destinationId,
      selectedRateId,
    },
    quantities,
  };
}

function moneyInCents(value) {
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= MAX_MONEY_CENTS
    ? cents
    : null;
}

const STATUS_CANONICAL = {
  menunggu: 'menunggu',
  'menunggu pembayaran': 'menunggu',
  dibayar: 'dibayar',
  diproses: 'diproses',
  siap: 'siap',
  'siap diambil': 'siap_diambil',
  'siap dikirim': 'siap_dikirim',
  'siap diambil/dikirim': 'siap',
  siap_diambil: 'siap_diambil',
  siap_dikirim: 'siap_dikirim',
  siap_diambil_dikirim: 'siap',
  selesai: 'selesai',
  dibatalkan: 'batal',
  batal: 'batal',
};

function orderStatusLabel(status, metodePenerimaan, statusPembayaran) {
  if (status === 'batal') return 'Dibatalkan';
  if (status === 'selesai') return 'Selesai';
  if (status === 'siap_dikirim') return 'Siap Dikirim';
  if (status === 'siap_diambil') return 'Siap Diambil';
  if (status === 'siap_diambil_dikirim') {
    return metodePenerimaan === 'kurir' ? 'Siap Dikirim' : 'Siap Diambil';
  }
  if (status === 'diproses') return 'Diproses';
  if (status === 'dibayar' || statusPembayaran === 'berhasil') return 'Dibayar';
  return 'Menunggu Pembayaran';
}

function formatOrder(row, items) {
  const subtotal = Number(row.subtotal);
  const ongkir = Number(row.ongkir);
  const total = Number(row.total);
  return {
    id: Number(row.id),
    nomor_pesanan: row.nomor_pesanan,
    status: orderStatusLabel(row.status, row.metode_penerimaan, row.status_pembayaran),
    status_pembayaran: row.status_pembayaran || null,
    metode_pembayaran: row.metode_pembayaran === 'cod' ? 'cod' : 'midtrans',
    tanggal: row.tanggal instanceof Date ? row.tanggal.toISOString() : new Date(row.tanggal).toISOString(),
    nama_pemesan: row.nama_pemesan,
    no_hp: row.no_hp,
    catatan: row.catatan || '',
    metode_penerimaan: row.metode_penerimaan === 'kurir' ? COURIER_METHOD : PICKUP_METHOD,
    wilayah: row.wilayah || '',
    alamat_lengkap: row.alamat_lengkap || '',
    layanan_kurir: row.layanan_kurir || null,
    items: items.map((item) => ({
      product_id: Number(item.product_id),
      nama: item.nama,
      kategori: item.kategori,
      harga: Number(item.harga),
      jumlah: Number(item.jumlah),
      subtotal: Number(item.subtotal),
    })),
    subtotal,
    diskon: Math.max(0, subtotal + ongkir - total),
    ongkir,
    total,
  };
}

function createOrdersRoutes(db, jwtSecretOrShipping, maybeShipping, maybePayment) {
  let jwtSecret;
  let shippingClient;
  let paymentClient;
  if (typeof jwtSecretOrShipping === 'string') {
    jwtSecret = jwtSecretOrShipping;
    shippingClient = maybeShipping;
    paymentClient = maybePayment;
  } else {
    shippingClient = jwtSecretOrShipping;
    paymentClient = maybeShipping;
  }

  const router = express.Router();
  const authenticate = typeof jwtSecret === 'string'
    ? createAuthenticate(db, jwtSecret)
    : (req, res, next) => next();

  router.get(
    '/',
    authenticate,
    authorizeRoles('admin', 'pegawai'),
    async (req, res, next) => {
      try {
        const { status, search } = req.query;
        let page = Number.parseInt(req.query.page, 10);
        if (!Number.isInteger(page) || page < 1) page = 1;
        let limit = Number.parseInt(req.query.limit, 10);
        if (!Number.isInteger(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        const conditions = ["t.jenis_transaksi = 'online'"];
        const params = [];

        if (status !== undefined && status !== null && String(status).trim() !== '') {
          const raw = String(status).trim().toLowerCase();
          if (raw === 'semua') {
            // No filter
          } else if (!(raw in STATUS_CANONICAL)) {
            return res.status(422).json({
              message: 'Status pesanan tidak valid',
              errors: { status: 'Status tidak dikenal' },
            });
          } else {
            const mapped = STATUS_CANONICAL[raw];
            if (mapped === 'menunggu') {
              conditions.push("t.status_transaksi = 'menunggu' AND (pb.status_pembayaran IS NULL OR pb.status_pembayaran <> 'berhasil')");
            } else if (mapped === 'dibayar') {
              conditions.push("(t.status_transaksi = 'dibayar' OR (t.status_transaksi = 'menunggu' AND pb.status_pembayaran = 'berhasil'))");
            } else if (mapped === 'diproses') {
              conditions.push("t.status_transaksi = 'diproses'");
            } else if (mapped === 'siap') {
              conditions.push("t.status_transaksi IN ('siap_diambil', 'siap_dikirim', 'siap_diambil_dikirim')");
            } else if (mapped === 'siap_diambil') {
              conditions.push("(t.status_transaksi = 'siap_diambil' OR (t.status_transaksi = 'siap_diambil_dikirim' AND t.metode_penerimaan = 'pickup'))");
            } else if (mapped === 'siap_dikirim') {
              conditions.push("(t.status_transaksi = 'siap_dikirim' OR (t.status_transaksi = 'siap_diambil_dikirim' AND t.metode_penerimaan = 'kurir'))");
            } else if (mapped === 'selesai') {
              conditions.push("t.status_transaksi = 'selesai'");
            } else if (mapped === 'batal') {
              conditions.push("t.status_transaksi = 'batal'");
            }
          }
        }

        if (typeof search === 'string' && search.trim() !== '') {
          conditions.push('(t.kode_transaksi LIKE ? OR t.nama_pelanggan LIKE ?)');
          const term = `%${search.trim()}%`;
          params.push(term, term);
        }

        const whereSql = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        const countQuery = `
          SELECT COUNT(DISTINCT t.id_transaksi) AS total
          FROM transaksi t
          LEFT JOIN (
            SELECT p1.id_transaksi, p1.status_pembayaran
            FROM pembayaran p1
            INNER JOIN (
              SELECT id_transaksi, MAX(id_pembayaran) AS max_id
              FROM pembayaran
              GROUP BY id_transaksi
            ) p2 ON p1.id_pembayaran = p2.max_id
          ) pb ON pb.id_transaksi = t.id_transaksi
          WHERE ${whereSql}
        `;
        const [countRows] = await db.query(countQuery, params);
        const total = Number(countRows[0]?.total || 0);

        const listQuery = `
          SELECT t.id_transaksi AS id, t.kode_transaksi AS nomor_pesanan,
                 t.nama_pelanggan AS nama_pemesan,
                 t.tanggal_transaksi AS tanggal,
                 t.total_bayar AS total,
                 t.metode_penerimaan,
                 t.status_transaksi,
                 pb.status_pembayaran
          FROM transaksi t
          LEFT JOIN (
            SELECT p1.id_transaksi, p1.status_pembayaran
            FROM pembayaran p1
            INNER JOIN (
              SELECT id_transaksi, MAX(id_pembayaran) AS max_id
              FROM pembayaran
              GROUP BY id_transaksi
            ) p2 ON p1.id_pembayaran = p2.max_id
          ) pb ON pb.id_transaksi = t.id_transaksi
          WHERE ${whereSql}
          ORDER BY t.tanggal_transaksi DESC, t.id_transaksi DESC
          LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(listQuery, [...params, limit, offset]);

        const data = rows.map((row) => ({
          nomor_pesanan: row.nomor_pesanan,
          nama_pemesan: row.nama_pemesan,
          tanggal: row.tanggal instanceof Date ? row.tanggal.toISOString() : new Date(row.tanggal).toISOString(),
          total: Math.round(Number(row.total)),
          metode_penerimaan: row.metode_penerimaan === 'kurir' ? 'kurir' : 'ambil_di_toko',
          status_pembayaran: row.status_pembayaran === 'berhasil' ? 'dibayar' : (row.status_pembayaran || 'menunggu'),
          status: orderStatusLabel(row.status_transaksi, row.metode_penerimaan, row.status_pembayaran),
        }));

        return res.json({
          data,
          meta: { page, limit, total },
        });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.patch(
    '/:nomor/status',
    authenticate,
    authorizeRoles('admin', 'pegawai'),
    async (req, res, next) => {
      const rawStatus = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
      if (!rawStatus) {
        return res.status(422).json({
          message: 'Status pesanan tidak valid',
          errors: { status: 'Status wajib diisi' },
        });
      }

      const normalized = rawStatus.toLowerCase();
      if (!(normalized in STATUS_CANONICAL)) {
        return res.status(422).json({
          message: 'Status pesanan tidak valid',
          errors: { status: 'Status tidak dikenal' },
        });
      }

      const targetAction = STATUS_CANONICAL[normalized];
      if (targetAction === 'menunggu' || targetAction === 'dibayar') {
        return res.status(422).json({
          message: 'Status Menunggu Pembayaran dan Dibayar tidak boleh diset lewat endpoint ini',
        });
      }

      if (req.user.role === 'pegawai' && (targetAction === 'selesai' || targetAction === 'batal')) {
        return res.status(403).json({ message: 'Akses ditolak' });
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

        const [orders] = await connection.query(
          `SELECT t.id_transaksi AS id, t.kode_transaksi AS nomor_pesanan,
                  t.status_transaksi AS status, t.tanggal_transaksi AS tanggal,
                  t.nama_pelanggan AS nama_pemesan, t.no_telepon AS no_hp,
                  t.catatan, t.metode_penerimaan,
                  t.alamat_pelanggan AS alamat_lengkap,
                  t.subtotal_produk AS subtotal, t.ongkos_kirim AS ongkir,
                  t.total_bayar AS total, p.wilayah_tujuan AS wilayah,
                  p.layanan_kurir,
                  (SELECT pb.status_pembayaran
                   FROM pembayaran pb
                   WHERE pb.id_transaksi = t.id_transaksi
                   ORDER BY pb.id_pembayaran DESC
                   LIMIT 1) AS status_pembayaran,
                  (SELECT pb.metode_pembayaran
                   FROM pembayaran pb
                   WHERE pb.id_transaksi = t.id_transaksi
                   ORDER BY pb.id_pembayaran DESC
                   LIMIT 1) AS metode_pembayaran
           FROM transaksi t
           LEFT JOIN pengiriman p ON p.id_transaksi = t.id_transaksi
           WHERE t.kode_transaksi = ? AND t.jenis_transaksi = 'online'
           FOR UPDATE`,
          [req.params.nomor],
        );

        if (!orders.length) {
          await connection.rollback();
          transactionStarted = false;
          return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }

        const order = orders[0];
        let currentEffective = order.status;
        if (currentEffective === 'menunggu' && order.status_pembayaran === 'berhasil') {
          currentEffective = 'dibayar';
        }

        if (currentEffective === 'selesai') {
          await connection.rollback();
          transactionStarted = false;
          return res.status(422).json({
            message: 'Pesanan yang sudah selesai tidak dapat diubah statusnya',
          });
        }
        if (currentEffective === 'batal') {
          await connection.rollback();
          transactionStarted = false;
          return res.status(422).json({
            message: 'Pesanan yang sudah dibatalkan tidak dapat diubah statusnya',
          });
        }

        if (currentEffective === 'menunggu') {
          if (targetAction === 'diproses') {
            await connection.rollback();
            transactionStarted = false;
            return res.status(422).json({ message: 'Pesanan belum dibayar' });
          }
          if (targetAction !== 'batal') {
            await connection.rollback();
            transactionStarted = false;
            return res.status(422).json({ message: 'Transisi status tidak valid' });
          }
        } else if (currentEffective === 'dibayar') {
          if (targetAction !== 'diproses' && targetAction !== 'batal') {
            await connection.rollback();
            transactionStarted = false;
            return res.status(422).json({ message: 'Transisi status tidak valid' });
          }
        } else if (currentEffective === 'diproses') {
          if (targetAction !== 'siap' && targetAction !== 'siap_diambil' && targetAction !== 'siap_dikirim' && targetAction !== 'batal') {
            await connection.rollback();
            transactionStarted = false;
            return res.status(422).json({ message: 'Transisi status tidak valid' });
          }
        } else if (currentEffective === 'siap_diambil' || currentEffective === 'siap_dikirim' || currentEffective === 'siap_diambil_dikirim') {
          if (targetAction !== 'selesai' && targetAction !== 'batal') {
            await connection.rollback();
            transactionStarted = false;
            return res.status(422).json({ message: 'Transisi status tidak valid' });
          }
        }

        let nextDbStatus = targetAction;
        if (targetAction === 'siap') {
          nextDbStatus = order.metode_penerimaan === 'kurir' ? 'siap_dikirim' : 'siap_diambil';
        }

        if (targetAction === 'batal') {
          const hadStockDeducted = (
            currentEffective === 'dibayar' ||
            currentEffective === 'diproses' ||
            currentEffective === 'siap_diambil' ||
            currentEffective === 'siap_dikirim' ||
            currentEffective === 'siap_diambil_dikirim'
          );

          if (hadStockDeducted) {
            const [items] = await connection.query(
              'SELECT id_produk, jumlah FROM detail_transaksi WHERE id_transaksi = ?',
              [order.id],
            );

            for (const item of items) {
              const [productRows] = await connection.query(
                'SELECT id_produk, jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE',
                [item.id_produk],
              );
              if (productRows.length) {
                const stockBefore = Number(productRows[0].jumlah_stok);
                const stockAfter = stockBefore + Number(item.jumlah);
                await connection.query(
                  `UPDATE produk
                   SET jumlah_stok = ?, status_produk = 'tersedia', updated_at = CURRENT_TIMESTAMP
                   WHERE id_produk = ?`,
                  [stockAfter, item.id_produk],
                );
                await connection.query(
                  `INSERT INTO riwayat_stok (
                     id_produk, id_admin, jenis_perubahan, jumlah, stok_sebelum, stok_sesudah, keterangan
                   ) VALUES (?, ?, 'masuk', ?, ?, ?, ?)`,
                  [
                    item.id_produk,
                    req.user.role === 'admin' ? req.user.id : null,
                    Number(item.jumlah),
                    stockBefore,
                    stockAfter,
                    `Pengembalian stok pesanan dibatalkan ${order.nomor_pesanan}`,
                  ],
                );
              }
            }
          }
        }

        await connection.query(
          'UPDATE transaksi SET status_transaksi = ? WHERE id_transaksi = ?',
          [nextDbStatus, order.id],
        );

        order.status = nextDbStatus;

        const [items] = await connection.query(
          `SELECT dt.id_produk AS product_id, p.nama_produk AS nama,
                  k.nama_kategori AS kategori, dt.harga_satuan AS harga,
                  dt.jumlah, dt.subtotal
           FROM detail_transaksi dt
           JOIN produk p ON p.id_produk = dt.id_produk
           LEFT JOIN kategori k ON k.id_kategori = p.id_kategori
           WHERE dt.id_transaksi = ?
           ORDER BY dt.id_detail_transaksi`,
          [order.id],
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({ data: formatOrder(order, items) });
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

  router.post('/', async (req, res, next) => {
    const { errors, values, quantities } = validatePayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(422).json({ message: 'Data pesanan tidak valid', errors });
    }

    const productIds = [...quantities.keys()].sort((a, b) => a - b);
    let shippingRate = null;
    let quotedWeight;
    try {
      if (values.metode === COURIER_METHOD) {
        const placeholders = productIds.map(() => '?').join(', ');
        const [products] = await db.query(
          `SELECT id_produk, satuan
           FROM produk
           WHERE archived_at IS NULL AND id_produk IN (${placeholders})`,
          productIds,
        );
        if (products.length !== productIds.length) {
          return res.status(422).json({
            message: 'Keranjang berisi produk yang tidak tersedia',
            errors: { items: 'Periksa kembali produk pada keranjang' },
          });
        }

        const weightResult = calculateTotalWeight(products, quantities);
        quotedWeight = weightResult.weight;
        if (quotedWeight === null && weightResult.invalidProductId !== undefined) {
          return res.status(422).json({
            message: 'Berat produk belum diatur dengan benar',
            errors: { [`items.${weightResult.invalidProductId}`]: 'Periksa satuan produk' },
          });
        }
        if (quotedWeight === null) {
          return res.status(422).json({
            message: 'Berat keranjang tidak valid',
            errors: { items: 'Periksa kembali jumlah produk' },
          });
        }

        const rates = await shippingClient.calculateDomesticCost({
          destination: values.destinationId,
          weight: quotedWeight,
        });
        shippingRate = Array.isArray(rates)
          ? rates.find((rate) => rate.id === values.selectedRateId)
          : null;
        if (!shippingRate || !Number.isSafeInteger(Number(shippingRate.cost)) ||
            Number(shippingRate.cost) < 0) {
          return res.status(422).json({
            message: 'Tarif kurir sudah berubah. Pilih kembali layanan pengiriman.',
            errors: { selected_rate_id: 'Pilih layanan kurir yang tersedia' },
          });
        }
      }
    } catch (error) {
      if (Number.isInteger(error.statusCode)) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
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
      let lockedWeight = 0;
      for (const productId of productIds) {
        const [rows] = await connection.query(
          `SELECT id_produk, nama_produk, harga_jual, jumlah_stok, archived_at, satuan
           FROM produk WHERE id_produk = ? FOR UPDATE`,
          [productId],
        );
        const product = rows[0];
        if (!product || product.archived_at) {
          errors[`items.${productId}`] = 'Produk tidak ditemukan atau sudah tidak tersedia';
          continue;
        }

        const quantity = quantities.get(productId);
        const stock = Number(product.jumlah_stok);
        if (!Number.isSafeInteger(stock) || stock < quantity) {
          errors[`items.${productId}`] =
            `Stok tidak mencukupi. Stok tersedia: ${Number.isFinite(stock) ? stock : 0}`;
          continue;
        }

        const priceCents = moneyInCents(product.harga_jual);
        const subtotalCents = priceCents === null ? null : priceCents * quantity;
        if (priceCents === null || !Number.isSafeInteger(subtotalCents) ||
            subtotalCents > MAX_MONEY_CENTS) {
          errors[`items.${productId}`] = 'Harga atau jumlah produk tidak valid';
          continue;
        }

        if (values.metode === COURIER_METHOD) {
          const itemWeight = parseGram(product.satuan);
          if (itemWeight < 1) {
            errors[`items.${productId}`] = 'Berat produk belum diatur dengan benar';
            continue;
          }
          lockedWeight += itemWeight * quantity;
        }
        lines.push({
          id: productId,
          nama: product.nama_produk,
          hargaCents: priceCents,
          jumlah: quantity,
          subtotalCents,
        });
      }

      if (values.metode === COURIER_METHOD && lockedWeight !== quotedWeight) {
        errors.destination_id = 'Data berat produk berubah. Periksa kembali ongkir.';
      }
      if (Object.keys(errors).length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(422).json({ message: 'Data pesanan tidak valid', errors });
      }

      const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
      if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_MONEY_CENTS) {
        throw new Error('Total pesanan di luar batas yang didukung');
      }
      const discountCents = subtotalCents >= 10000000 ? 600000 : 0;
      const shippingCents = values.metode === COURIER_METHOD
        ? Number(shippingRate.cost) * 100
        : 0;
      const totalCents = subtotalCents - discountCents + shippingCents;
      if (!Number.isSafeInteger(shippingCents) || shippingCents > MAX_MONEY_CENTS ||
          !Number.isSafeInteger(totalCents) || totalCents > MAX_MONEY_CENTS) {
        throw new Error('Total pesanan di luar batas yang didukung');
      }

      const now = new Date();
      const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
      const nomorPesanan = `TA-${dateCode}-${randomBytes(12).toString('hex').toUpperCase()}`;
      const address = values.metode === COURIER_METHOD ? values.alamat : null;
      const databaseMethod = values.metode === COURIER_METHOD ? 'kurir' : 'pickup';
      const [result] = await connection.query(
        `INSERT INTO transaksi (
           kode_transaksi, jenis_transaksi, nama_pelanggan, no_telepon, alamat_pelanggan,
           metode_penerimaan, subtotal_produk, ongkos_kirim, total_bayar,
           status_transaksi, catatan
         ) VALUES (?, 'online', ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?)`,
        [
          nomorPesanan,
          values.nama,
          values.noHp,
          address,
          databaseMethod,
          (subtotalCents / 100).toFixed(2),
          (shippingCents / 100).toFixed(2),
          (totalCents / 100).toFixed(2),
          values.catatan,
        ],
      );
      const transactionId = result.insertId;
      const databasePaymentMethod = values.metodePembayaran === 'cod'
        ? 'cod'
        : 'payment_gateway';
      await connection.query(
        `INSERT INTO pembayaran (
           id_transaksi, metode_pembayaran, jumlah_bayar, status_pembayaran,
           kode_referensi, snap_token
         ) VALUES (?, ?, ?, 'menunggu', NULL, NULL)`,
        [transactionId, databasePaymentMethod, (totalCents / 100).toFixed(2)],
      );

      for (const line of lines) {
        await connection.query(
          `INSERT INTO detail_transaksi (
             id_transaksi, id_produk, jumlah, harga_satuan, subtotal
           ) VALUES (?, ?, ?, ?, ?)`,
          [
            transactionId,
            line.id,
            line.jumlah,
            (line.hargaCents / 100).toFixed(2),
            (line.subtotalCents / 100).toFixed(2),
          ],
        );
      }

      if (values.metode === COURIER_METHOD) {
        await connection.query(
          `INSERT INTO pengiriman (
             id_transaksi, alamat_tujuan, wilayah_tujuan, layanan_kurir,
             ongkos_kirim, status_pengiriman
           ) VALUES (?, ?, ?, ?, ?, 'menunggu')`,
          [
            transactionId,
            values.alamat,
            values.wilayah,
            `${shippingRate.courier_name} ${shippingRate.service}`,
            (shippingCents / 100).toFixed(2),
          ],
        );
      }

      await connection.commit();
      transactionStarted = false;
      return res.status(201).json({
        data: {
          id: transactionId,
          nomor_pesanan: nomorPesanan,
          status: 'Menunggu Pembayaran',
          metode_pembayaran: values.metodePembayaran,
          tanggal: now.toISOString(),
          nama_pemesan: values.nama,
          no_hp: values.noHp,
          catatan: values.catatan,
          metode_penerimaan: values.metode,
          wilayah: values.wilayah,
          alamat_lengkap: values.alamat,
          layanan_kurir: shippingRate
            ? `${shippingRate.courier_name} ${shippingRate.service}`
            : null,
          items: lines.map((line) => ({
            product_id: line.id,
            nama: line.nama,
            harga: line.hargaCents / 100,
            jumlah: line.jumlah,
            subtotal: line.subtotalCents / 100,
          })),
          subtotal: subtotalCents / 100,
          diskon: discountCents / 100,
          ongkir: shippingCents / 100,
          total: totalCents / 100,
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
  });

  router.post('/:nomor/pembayaran', async (req, res, next) => {
    if (!paymentClient.isConfigured()) {
      return res.status(503).json({
        message: 'Konfigurasi Midtrans Sandbox belum lengkap di backend/.env.',
      });
    }

    let connection;
    let transactionStarted = false;
    let paymentReference;
    let paymentId;
    let payment;
    try {
      connection = typeof db.getConnection === 'function' ? await db.getConnection() : db;
      if (typeof connection.beginTransaction !== 'function') {
        throw new Error('Koneksi database tidak mendukung transaksi atomik');
      }
      await connection.beginTransaction();
      transactionStarted = true;

      const [orders] = await connection.query(
        `SELECT id_transaksi, kode_transaksi, nama_pelanggan, no_telepon,
                total_bayar, status_transaksi,
                (SELECT metode_pembayaran
                 FROM pembayaran
                 WHERE id_transaksi = transaksi.id_transaksi
                 ORDER BY id_pembayaran DESC
                 LIMIT 1) AS metode_pembayaran
         FROM transaksi
         WHERE kode_transaksi = ? AND jenis_transaksi = 'online'
         FOR UPDATE`,
        [req.params.nomor],
      );
      if (!orders.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
      }

      const order = orders[0];
      if (order.metode_pembayaran === 'cod') {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
          message: 'Pesanan ini menggunakan COD dan tidak memerlukan pembayaran Midtrans.',
        });
      }
      if (order.status_transaksi !== 'menunggu') {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({ message: 'Pesanan ini tidak lagi menunggu pembayaran.' });
      }

      const [existingPayments] = await connection.query(
        `SELECT id_pembayaran, snap_token, kode_referensi
         FROM pembayaran
         WHERE id_transaksi = ? AND metode_pembayaran = 'payment_gateway'
           AND status_pembayaran = 'menunggu'
         ORDER BY id_pembayaran DESC
         LIMIT 1
         FOR UPDATE`,
        [order.id_transaksi],
      );
      if (existingPayments.length) {
        payment = existingPayments[0];
        if (payment.snap_token) {
          await connection.commit();
          transactionStarted = false;
          return res.json({
            data: {
              snap_token: payment.snap_token,
              client_key: paymentClient.getClientKey(),
            },
          });
        }
        if (payment.kode_referensi) {
          await connection.rollback();
          transactionStarted = false;
          return res.status(409).json({
            message: 'Pembayaran sedang disiapkan. Coba beberapa saat lagi.',
          });
        }
        paymentId = payment.id_pembayaran;
      } else {
        const [result] = await connection.query(
          `INSERT INTO pembayaran (
             id_transaksi, metode_pembayaran, jumlah_bayar, status_pembayaran,
             kode_referensi, snap_token
           ) VALUES (?, 'payment_gateway', ?, 'menunggu', NULL, NULL)`,
          [order.id_transaksi, order.total_bayar],
        );
        paymentId = result.insertId;
      }

      paymentReference = `${order.kode_transaksi}-${randomBytes(4).toString('hex')}`;
      await connection.query(
        `UPDATE pembayaran SET kode_referensi = ?
         WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
        [paymentReference, paymentId],
      );
      await connection.commit();
      transactionStarted = false;

      const created = await paymentClient.createTransaction({
        transaction_details: {
          order_id: paymentReference,
          gross_amount: Number(Number(order.total_bayar).toFixed(2)),
        },
        customer_details: {
          first_name: order.nama_pelanggan,
          phone: order.no_telepon,
        },
        callbacks: {
          finish: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')}/pesanan/${encodeURIComponent(order.kode_transaksi)}`,
        },
      });
      await db.query(
        `UPDATE pembayaran SET snap_token = ?
         WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
        [created.token, paymentId],
      );
      return res.status(201).json({
        data: {
          snap_token: created.token,
          client_key: paymentClient.getClientKey(),
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
      if (paymentId) {
        try {
          await db.query(
            `UPDATE pembayaran SET status_pembayaran = 'gagal'
             WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu'`,
            [paymentId],
          );
        } catch (updateError) {
          return next(updateError);
        }
      }
      if (Number.isInteger(error.statusCode)) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    } finally {
      if (connection && typeof connection.release === 'function') {
        connection.release();
      }
    }
  });

  router.get('/:nomor', async (req, res, next) => {
    try {
      const [orders] = await db.query(
        `SELECT t.id_transaksi AS id, t.kode_transaksi AS nomor_pesanan,
                t.status_transaksi AS status, t.tanggal_transaksi AS tanggal,
                t.nama_pelanggan AS nama_pemesan, t.no_telepon AS no_hp,
                t.catatan, t.metode_penerimaan,
                t.alamat_pelanggan AS alamat_lengkap,
                t.subtotal_produk AS subtotal, t.ongkos_kirim AS ongkir,
                t.total_bayar AS total, p.wilayah_tujuan AS wilayah,
                p.layanan_kurir,
                (SELECT pb.status_pembayaran
                 FROM pembayaran pb
                 WHERE pb.id_transaksi = t.id_transaksi
                 ORDER BY pb.id_pembayaran DESC
                 LIMIT 1) AS status_pembayaran,
                (SELECT pb.metode_pembayaran
                 FROM pembayaran pb
                 WHERE pb.id_transaksi = t.id_transaksi
                 ORDER BY pb.id_pembayaran DESC
                 LIMIT 1) AS metode_pembayaran
         FROM transaksi t
         LEFT JOIN pengiriman p ON p.id_transaksi = t.id_transaksi
         WHERE t.kode_transaksi = ? AND t.jenis_transaksi = 'online'`,
        [req.params.nomor],
      );
      if (!orders.length) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      }

      const order = orders[0];
      const [items] = await db.query(
        `SELECT dt.id_produk AS product_id, p.nama_produk AS nama,
                k.nama_kategori AS kategori, dt.harga_satuan AS harga,
                dt.jumlah, dt.subtotal
         FROM detail_transaksi dt
         JOIN produk p ON p.id_produk = dt.id_produk
         LEFT JOIN kategori k ON k.id_kategori = p.id_kategori
         WHERE dt.id_transaksi = ?
         ORDER BY dt.id_detail_transaksi`,
        [order.id],
      );
      return res.json({ data: formatOrder(order, items) });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createOrdersRoutes;