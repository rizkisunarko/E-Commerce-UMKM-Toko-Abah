const express = require('express');

const MAX_ITEMS = 100;
const MAX_QUANTITY = 1000;

function parseProductIds(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return null;
  }

  const productIds = new Set();
  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.jumlah);
    if (!Number.isSafeInteger(productId) || productId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return null;
    }
    productIds.add(productId);
  }
  return [...productIds];
}

function createCartRoutes(db) {
  const router = express.Router();

  router.post('/check', async (req, res, next) => {
    const productIds = parseProductIds(req.body?.items);
    if (!productIds) {
      return res.status(422).json({
        message: 'Data keranjang tidak valid.',
        errors: { items: 'Pilih setidaknya satu produk dengan jumlah yang valid.' },
      });
    }

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
        })),
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createCartRoutes;
