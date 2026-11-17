const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createFixture(t) {
  const products = [
    { id_produk: 2, nama_produk: 'Gula Pasir 1 kg', harga_jual: '17000.00', jumlah_stok: '17', archived_at: null },
    { id_produk: 3, nama_produk: 'Produk Arsip', harga_jual: '10000.00', jumlah_stok: '5', archived_at: new Date() },
  ];
  const queries = [];
  const db = {
    async query(sql, params) {
      queries.push({ sql, params });
      assert.match(sql, /archived_at IS NULL/);
      return [
        products
          .filter((product) => product.archived_at === null && params.includes(product.id_produk))
          .map(({ id_produk, nama_produk, harga_jual, jumlah_stok }) => ({
            product_id: id_produk,
            nama: nama_produk,
            harga: harga_jual,
            stok: jumlah_stok,
          })),
        [],
      ];
    },
  };
  const server = createApp({ db, jwtSecret: JWT_SECRET }).listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    queries,
  };
}

test('POST /api/cart/check returns authoritative active product prices and stock without login', async (t) => {
  const { baseUrl, queries } = await createFixture(t);
  const response = await fetch(`${baseUrl}/cart/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { product_id: 2, jumlah: 1 },
        { product_id: 3, jumlah: 1 },
        { product_id: 999, jumlah: 1 },
      ],
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: [{
      product_id: 2,
      nama: 'Gula Pasir 1 kg',
      harga: 17000,
      stok: 17,
      jumlah_diminta: 1,
      cukup: true,
    }],
  });
  assert.deepEqual(queries[0].params, [2, 3, 999]);
});

test('POST /api/cart/check marks insufficient combined quantities', async (t) => {
  const { baseUrl } = await createFixture(t);
  const response = await fetch(`${baseUrl}/cart/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { product_id: 2, jumlah: 10 },
        { product_id: 2, jumlah: 8 },
      ],
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data[0], {
    product_id: 2,
    nama: 'Gula Pasir 1 kg',
    harga: 17000,
    stok: 17,
    jumlah_diminta: 18,
    cukup: false,
  });
});

test('POST /api/cart/check rejects empty or invalid cart data before querying products', async (t) => {
  const { baseUrl, queries } = await createFixture(t);
  for (const items of [
    [],
    [{ product_id: 2, jumlah: 0 }],
    [{ product_id: 2, jumlah: 700 }, { product_id: 2, jumlah: 400 }],
  ]) {
    const response = await fetch(`${baseUrl}/cart/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    assert.equal(response.status, 422);
  }
  assert.equal(queries.length, 0);
});
