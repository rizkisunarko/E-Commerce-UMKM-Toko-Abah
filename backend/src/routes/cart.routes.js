const express = require('express');
const { createHash } = require('node:crypto');

const MAX_ITEMS = 100;
const MAX_QUANTITY = 1000;
const GUEST_TOKEN_PATTERN = /^[\da-f]{64}$/i;

function parseQuantities(items, { allowEmpty = false } = {}) {
  if (!Array.isArray(items) || items.length > MAX_ITEMS ||
      (!allowEmpty && items.length === 0)) {
    return null;
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.jumlah);
    if (!Number.isSafeInteger(productId) || productId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return null;
    }
    const combined = (quantities.get(productId) || 0) + quantity;
    if (!Number.isSafeInteger(combined) || combined > MAX_QUANTITY) return null;
    quantities.set(productId, combined);
  }
  return quantities;
}

function getGuestTokenHash(req) {
  const token = req.get('X-Guest-Cart-Token');
  if (typeof token !== 'string' || !GUEST_TOKEN_PATTERN.test(token)) return null;
  return createHash('sha256').update(token.toLowerCase()).digest('hex');
}

function formatCartRows(rows, quantities) {
  return rows.map((row) => {
    const productId = Number(row.product_id);
    const quantity = quantities.get(productId);
    const stock = Number(row.stok);
    return {
      product_id: productId,
      nama: row.nama,
      harga: Number(row.harga),
      stok: stock,
      jumlah: quantity,
      jumlah_diminta: quantity,
      cukup: stock >= quantity,
    };
  });
}

function createCartRoutes(db) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    const tokenHash = getGuestTokenHash(req);
    if (!tokenHash) {
      return res.status(400).json({ message: 'Token keranjang tamu tidak valid' });
    }

    try {
      const [carts] = await db.query(
        `SELECT id_keranjang
         FROM keranjang
         WHERE guest_token_hash = ? AND status_keranjang = 'aktif'`,
        [tokenHash],
      );
      if (!carts.length) return res.json({ data: [], persisted: false });

      const [rows] = await db.query(
        `SELECT i.id_produk AS product_id, p.nama_produk AS nama,
                p.harga_jual AS harga, p.jumlah_stok AS stok, i.jumlah
         FROM item_keranjang i
         JOIN produk p ON p.id_produk = i.id_produk
         WHERE i.id_keranjang = ? AND p.archived_at IS NULL
         ORDER BY i.id_item_keranjang`,
        [carts[0].id_keranjang],
      );
      const quantities = new Map(rows.map((row) => [
        Number(row.product_id),
        Number(row.jumlah),
      ]));
      return res.json({
        data: formatCartRows(rows, quantities),
        persisted: true,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.put('/', async (req, res, next) => {
    const tokenHash = getGuestTokenHash(req);
    if (!tokenHash) {
      return res.status(400).json({ message: 'Token keranjang tamu tidak valid' });
    }
    const quantities = parseQuantities(req.body?.items, { allowEmpty: true });
    if (!quantities) {
      return res.status(422).json({
        message: 'Data keranjang tidak valid.',
        errors: { items: 'Pilih maksimal 100 produk dengan jumlah yang valid.' },
      });
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

      const productIds = [...quantities.keys()].sort((a, b) => a - b);
      let rows = [];
      if (productIds.length) {
        const placeholders = productIds.map(() => '?').join(', ');
        [rows] = await connection.query(
          `SELECT id_produk AS product_id, nama_produk AS nama,
                  harga_jual AS harga, jumlah_stok AS stok
           FROM produk
           WHERE archived_at IS NULL AND id_produk IN (${placeholders})`,
          productIds,
        );
        if (rows.length !== productIds.length) {
          await connection.rollback();
          transactionStarted = false;
          return res.status(422).json({
            message: 'Keranjang berisi produk yang tidak tersedia',
            errors: { items: 'Periksa kembali produk pada keranjang' },
          });
        }
      }

      let cartId;
      if (productIds.length) {
        const [cartResult] = await connection.query(
          `INSERT INTO keranjang (id_user, guest_token_hash, status_keranjang)
           VALUES (NULL, ?, 'aktif')
           ON DUPLICATE KEY UPDATE
             id_keranjang = LAST_INSERT_ID(id_keranjang),
             status_keranjang = 'aktif'`,
          [tokenHash],
        );
        cartId = cartResult.insertId;
      } else {
        const [carts] = await connection.query(
          'SELECT id_keranjang FROM keranjang WHERE guest_token_hash = ? FOR UPDATE',
          [tokenHash],
        );
        if (!carts.length) {
          await connection.commit();
          transactionStarted = false;
          return res.json({ data: [], persisted: false });
        }
        cartId = carts[0].id_keranjang;
      }
      await connection.query('DELETE FROM item_keranjang WHERE id_keranjang = ?', [cartId]);

      for (const productId of productIds) {
        await connection.query(
          `INSERT INTO item_keranjang (id_keranjang, id_produk, jumlah)
           VALUES (?, ?, ?)`,
          [cartId, productId, quantities.get(productId)],
        );
      }

      await connection.commit();
      transactionStarted = false;
      return res.json({
        data: formatCartRows(rows, quantities),
        persisted: true,
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

  router.post('/check', async (req, res, next) => {
    const quantities = parseQuantities(req.body?.items);
    if (!quantities) {
      return res.status(422).json({
        message: 'Data keranjang tidak valid.',
        errors: { items: 'Pilih setidaknya satu produk dengan jumlah yang valid.' },
      });
    }

    const productIds = [...quantities.keys()];
    const placeholders = productIds.map(() => '?').join(', ');
    try {
      const [rows] = await db.query(
        `SELECT id_produk AS product_id,
                nama_produk AS nama,
                harga_jual AS harga,
                jumlah_stok AS stok
         FROM produk
         WHERE archived_at IS NULL AND id_produk IN (${placeholders})`,
        productIds,
      );
      return res.json({
        data: rows.map((row) => ({
          product_id: Number(row.product_id),
          nama: row.nama,
          harga: Number(row.harga),
          stok: Number(row.stok),
          jumlah_diminta: quantities.get(Number(row.product_id)),
          cukup: Number(row.stok) >= quantities.get(Number(row.product_id)),
        })),
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createCartRoutes;
