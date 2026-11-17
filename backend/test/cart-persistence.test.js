const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { once } = require('node:events');
const test = require('node:test');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
const GUEST_TOKEN = 'a'.repeat(64);
const TOKEN_HASH = createHash('sha256').update(GUEST_TOKEN).digest('hex');

async function createFixture(t) {
  const state = {
    carts: [],
    items: [],
    products: [{
      id_produk: 2,
      nama_produk: 'Gula Pasir 1 kg',
      harga_jual: '17000.00',
      jumlah_stok: 5,
      archived_at: null,
    }],
    nextCartId: 1,
  };
  let snapshot;

  async function query(sql, params = []) {
    if (sql.includes('SELECT id_produk AS product_id')) {
      return [state.products
        .filter((product) => !product.archived_at && params.includes(product.id_produk))
        .map((product) => ({
          product_id: product.id_produk,
          nama: product.nama_produk,
          harga: product.harga_jual,
          stok: product.jumlah_stok,
        })), []];
    }
    if (sql.includes('FROM keranjang') && sql.includes('guest_token_hash = ?')) {
      const cart = state.carts.find((item) => item.guest_token_hash === params[0] &&
        (!sql.includes("status_keranjang = 'aktif'") || item.status_keranjang === 'aktif'));
      return [cart ? [{ id_keranjang: cart.id_keranjang }] : [], []];
    }
    if (sql.includes('FROM item_keranjang i')) {
      const rows = state.items
        .filter((item) => item.id_keranjang === params[0])
        .map((item) => {
          const product = state.products.find((row) => row.id_produk === item.id_produk);
          return product && !product.archived_at
            ? {
              product_id: product.id_produk,
              nama: product.nama_produk,
              harga: product.harga_jual,
              stok: product.jumlah_stok,
              jumlah: item.jumlah,
            }
            : null;
        })
        .filter(Boolean);
      return [rows, []];
    }
    if (sql.startsWith('INSERT INTO keranjang')) {
      let cart = state.carts.find((item) => item.guest_token_hash === params[0]);
      if (!cart) {
        cart = {
          id_keranjang: state.nextCartId++,
          id_user: null,
          guest_token_hash: params[0],
          status_keranjang: 'aktif',
        };
        state.carts.push(cart);
      } else {
        cart.status_keranjang = 'aktif';
      }
      return [{ insertId: cart.id_keranjang }, []];
    }
    if (sql.startsWith('DELETE FROM item_keranjang')) {
      state.items = state.items.filter((item) => item.id_keranjang !== params[0]);
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT INTO item_keranjang')) {
      state.items.push({
        id_keranjang: params[0],
        id_produk: params[1],
        jumlah: params[2],
      });
      return [{ insertId: state.items.length }, []];
    }
    throw new Error(`Query test tidak dikenal: ${sql}`);
  }

  const db = {
    query,
    async getConnection() {
      return {
        query,
        async beginTransaction() {
          snapshot = structuredClone(state);
        },
        async commit() {
          snapshot = null;
        },
        async rollback() {
          if (snapshot) {
            Object.assign(state, snapshot);
            snapshot = null;
          }
        },
        release() {},
      };
    },
  };
  const server = createApp({ db, jwtSecret: JWT_SECRET }).listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    state,
  };
}

function guestHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Guest-Cart-Token': GUEST_TOKEN,
  };
}

test('keranjang tamu dapat disimpan dan dimuat tanpa login dengan token hash', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const emptyResponse = await fetch(`${baseUrl}/cart`, { headers: guestHeaders() });
  assert.equal(emptyResponse.status, 200);
  assert.deepEqual(await emptyResponse.json(), { data: [], persisted: false });

  const saveResponse = await fetch(`${baseUrl}/cart`, {
    method: 'PUT',
    headers: guestHeaders(),
    body: JSON.stringify({
      items: [
        { product_id: 2, jumlah: 2 },
        { product_id: 2, jumlah: 4 },
      ],
    }),
  });
  assert.equal(saveResponse.status, 200);
  assert.deepEqual((await saveResponse.json()).data, [{
    product_id: 2,
    nama: 'Gula Pasir 1 kg',
    harga: 17000,
    stok: 5,
    jumlah: 6,
    jumlah_diminta: 6,
    cukup: false,
  }]);
  assert.equal(state.carts[0].id_user, null);
  assert.equal(state.carts[0].guest_token_hash, TOKEN_HASH);
  assert.notEqual(state.carts[0].guest_token_hash, GUEST_TOKEN);

  const loadResponse = await fetch(`${baseUrl}/cart`, { headers: guestHeaders() });
  assert.equal(loadResponse.status, 200);
  assert.deepEqual(await loadResponse.json(), {
    data: [{
      product_id: 2,
      nama: 'Gula Pasir 1 kg',
      harga: 17000,
      stok: 5,
      jumlah: 6,
      jumlah_diminta: 6,
      cukup: false,
    }],
    persisted: true,
  });
});

test('keranjang tamu bisa dikosongkan dan token wajib valid', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const missingToken = await fetch(`${baseUrl}/cart`);
  assert.equal(missingToken.status, 400);

  const emptyResponse = await fetch(`${baseUrl}/cart`, {
    method: 'PUT',
    headers: guestHeaders(),
    body: JSON.stringify({ items: [] }),
  });
  assert.equal(emptyResponse.status, 200);
  assert.deepEqual(await emptyResponse.json(), { data: [], persisted: false });
  assert.equal(state.carts.length, 0);

  await fetch(`${baseUrl}/cart`, {
    method: 'PUT',
    headers: guestHeaders(),
    body: JSON.stringify({ items: [{ product_id: 2, jumlah: 1 }] }),
  });
  const clearResponse = await fetch(`${baseUrl}/cart`, {
    method: 'PUT',
    headers: guestHeaders(),
    body: JSON.stringify({ items: [] }),
  });
  assert.equal(clearResponse.status, 200);
  assert.deepEqual(await clearResponse.json(), { data: [], persisted: true });
  assert.equal(state.items.length, 0);
});

test('keranjang tamu menolak produk yang tidak tersedia tanpa menyimpan sebagian data', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const response = await fetch(`${baseUrl}/cart`, {
    method: 'PUT',
    headers: guestHeaders(),
    body: JSON.stringify({
      items: [
        { product_id: 2, jumlah: 1 },
        { product_id: 999, jumlah: 1 },
      ],
    }),
  });

  assert.equal(response.status, 422);
  assert.equal(state.carts.length, 0);
  assert.equal(state.items.length, 0);
});
