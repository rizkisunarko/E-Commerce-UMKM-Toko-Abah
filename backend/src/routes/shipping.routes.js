const express = require('express');
const parseGram = require('../utils/weight');

const REQUIRED = 'Kolom ini wajib diisi';

function parseItems(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    return { errors: { items: 'Pilih setidaknya satu produk.' } };
  }

  const quantities = new Map();
  for (const item of value) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.jumlah);
    if (!Number.isSafeInteger(productId) || productId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
      return { errors: { items: 'Data produk atau jumlah tidak valid.' } };
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  return { quantities };
}

function createShippingRoutes(db, shippingClient) {
  const router = express.Router();

  router.get('/destinations', async (req, res, next) => {
    const search = req.query.search;
    if (typeof search !== 'string' || search.trim().length < 2 || search.trim().length > 100) {
      return res.status(422).json({
        message: 'Masukkan nama kecamatan atau kota (2-100 karakter).',
      });
    }
    try {
      const data = await shippingClient.searchDestinations(search.trim());
      return res.json({ data });
    } catch (error) {
      if (Number.isInteger(error.statusCode)) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  });

  router.post('/cost', async (req, res, next) => {
    const destination = req.body?.destination_id;
    if (typeof destination !== 'string' || !/^\d+$/.test(destination) ||
        !Number.isSafeInteger(Number(destination)) || Number(destination) < 1) {
      return res.status(422).json({
        message: 'Pilih wilayah tujuan yang valid.',
        errors: { destination_id: REQUIRED },
      });
    }

    const { quantities, errors } = parseItems(req.body?.items);
    if (errors) {
      return res.status(422).json({ message: 'Data keranjang tidak valid.', errors });
    }

    const productIds = [...quantities.keys()];
    const placeholders = productIds.map(() => '?').join(', ');
    try {
      const [products] = await db.query(
        `SELECT id_produk, satuan
         FROM produk
         WHERE archived_at IS NULL AND id_produk IN (${placeholders})`,
        productIds,
      );
      if (products.length !== productIds.length) {
        return res.status(422).json({
          message: 'Keranjang berisi produk yang tidak tersedia.',
          errors: { items: 'Periksa kembali produk pada keranjang.' },
        });
      }

      let weight = 0;
      for (const product of products) {
        const itemWeight = parseGram(product.satuan);
        if (itemWeight < 1) {
          return res.status(422).json({
            message: 'Berat produk belum diatur dengan benar.',
            errors: { items: `Periksa satuan produk dengan ID ${product.id_produk}.` },
          });
        }
        weight += itemWeight * quantities.get(Number(product.id_produk));
      }
      if (!Number.isSafeInteger(weight) || weight < 1) {
        return res.status(422).json({ message: 'Total berat pesanan tidak valid.' });
      }

      const data = await shippingClient.calculateDomesticCost({
        destination: String(destination),
        weight,
      });
      return res.json({ data, weight });
    } catch (error) {
      if (Number.isInteger(error.statusCode)) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return next(error);
    }
  });

  return router;
}

module.exports = createShippingRoutes;
