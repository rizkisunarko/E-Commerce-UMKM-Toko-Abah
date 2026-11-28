const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');
const { formatProduct } = require('../src/controllers/product.controller');
const { validateProduct, INVALID_NUMBER } = require('../src/utils/productValidation');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

test('productValidation: memvalidasi input produk sesuai kontrak', () => {
  // 1. Kolom wajib kosong
  const empty = validateProduct({});
  assert.equal(empty.errors.nama, 'Kolom ini wajib diisi');
  assert.equal(empty.errors.kategori, 'Kolom ini wajib diisi');
  assert.equal(empty.errors.harga, 'Kolom ini wajib diisi');
  assert.equal(empty.errors.berat, 'Kolom ini wajib diisi');
  assert.equal(empty.errors.stok, 'Kolom ini wajib diisi');

  // 2. Kategori tidak valid
  const invalidCat = validateProduct({ kategori: 'Elektronik' });
  assert.equal(invalidCat.errors.kategori, 'Kategori tidak valid');

  // 3. Harga dan berat bukan angka atau <= 0
  const invalidNum = validateProduct({ harga: -100, berat: 0, stok: -5 });
  assert.equal(invalidNum.errors.harga, 'Masukkan angka yang valid');
  assert.equal(invalidNum.errors.berat, 'Masukkan angka yang valid');
  assert.equal(invalidNum.errors.stok, 'Jumlah stok tidak boleh negatif');
  assert.equal(validateProduct({ stok: 1.5 }, 'update').errors.stok, INVALID_NUMBER);

  // 4. Data valid & default batas_stok_kritis = 5 bila kosong
  const valid = validateProduct({
    nama: 'Susu UHT 1 L',
    kategori: 'Minuman',
    harga: 18000,
    berat: 1000,
    stok: 24,
  });
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.values.batas_stok_kritis, 5);
  assert.equal(valid.values.berat, 1000);
  assert.equal(valid.values.satuan, '1000 g');
});

test('formatProduct: status stok kritis berlaku saat stok sama atau di bawah batas', () => {
  const product = { stok: '5', batas_stok_kritis: '5' };
  assert.equal(formatProduct(product).status_stok, 'Stok Kritis');
  assert.equal(formatProduct({ ...product, stok: '4' }).status_stok, 'Stok Kritis');
  assert.equal(formatProduct({ ...product, stok: '6' }).status_stok, 'Stok Aman');
});

async function createFixture(t) {
  const accounts = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin-pass', 4), nama: 'admin', role: 'admin' },
    { id: 2, username: 'pegawai', password: bcrypt.hashSync('employee-pass', 4), nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
  ];
  const products = [{
    id: 20,
    nama: 'Susu UHT 1 L',
    kategori: 'Minuman',
    harga: 18000,
    harga_beli: 0,
    satuan: '1000 g',
    stok: 24,
    batas_stok_kritis: 5,
    archived_at: null,
  }];
  const stockHistory = [];
  const transactionDetails = [];
  const purchaseDetails = [];
  const cartItems = [];
  const transactions = [];
  const reviews = [];
  const db = {
    async query(sql, params) {
      if (sql.includes('UNION ALL')) {
        return [accounts.filter((account) => params.includes(account.username)), []];
      }
      if (sql.includes('FROM admin WHERE id_admin')) {
        const account = accounts.find((item) => item.role === 'admin' && item.id === params[0]);
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }
      if (sql.includes('FROM pegawai WHERE id_pegawai')) {
        const account = accounts.find((item) => item.role === 'pegawai' && item.id === params[0]);
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }
      if (sql.includes('SELECT id_kategori FROM kategori WHERE nama_kategori = ?')) {
        return params[0] === 'Minuman' ? [[{ id_kategori: 6 }], []] : [[], []];
      }
      if (sql.includes('SELECT jumlah_stok FROM produk WHERE id_produk = ?')) {
        const product = products.find((item) => item.id === params[0]);
        return [product ? [{ jumlah_stok: product.stok }] : [], []];
      }
      if (sql.includes('SELECT id_produk FROM produk WHERE id_produk = ? AND archived_at IS NULL')) {
        const product = products.find((item) => item.id === params[0] && !item.archived_at);
        return [product ? [{ id_produk: product.id }] : [], []];
      }
      if (sql.includes('SELECT id_produk FROM produk WHERE id_produk = ?')) {
        return products.some((item) => item.id === params[0])
          ? [[{ id_produk: params[0] }], []]
          : [[], []];
      }
      if (sql.includes('FROM transaksi t') && sql.includes('t.kode_transaksi = ?')) {
        const trx = transactions.find((t) =>
          t.kode_transaksi === params[0]
          && t.status_transaksi === 'selesai'
          && transactionDetails.some((dt) => dt.id_transaksi === t.id_transaksi && dt.id_produk === params[1]));
        return [trx ? [{ id_transaksi: trx.id_transaksi }] : [], []];
      }
      if (sql.includes('INSERT INTO ulasan_produk')) {
        if (params[1] !== null && reviews.some((r) => r.id_transaksi === params[1] && r.id_produk === params[0])) {
          const err = new Error('Duplicate entry');
          err.code = 'ER_DUP_ENTRY';
          throw err;
        }
        const entry = {
          id: reviews.length + 1,
          id_produk: params[0],
          id_transaksi: params[1],
          nama_pengulas: params[2],
          rating: params[3],
          komentar: params[4],
          terverifikasi: params[5],
          created_at: '2026-11-28T12:00:00.000Z',
        };
        reviews.unshift(entry);
        return [{ insertId: entry.id }, []];
      }
      if (sql.includes('FROM ulasan_produk') && sql.includes('ROUND(AVG(rating), 1)')) {
        const matched = reviews.filter((r) => r.id_produk === params[0]);
        const count = matched.length;
        const avg = count ? Math.round((matched.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
        return [[{ jumlah_ulasan: count, rating_rata: avg }], []];
      }
      if (sql.includes('FROM ulasan_produk')) {
        const matched = reviews.filter((r) => r.id_produk === params[0]);
        return [matched, []];
      }
      if (sql.includes('AS has_sales') && sql.includes('FOR UPDATE')) {
        const product = products.find((item) => item.id === params[0]);
        return [product ? [{
          id_produk: product.id,
          has_sales: transactionDetails.some((item) => item.id_produk === product.id) ? 1 : 0,
          has_purchases: purchaseDetails.some((item) => item.id_produk === product.id) ? 1 : 0,
          has_stock_history: stockHistory.some((item) => item.id_produk === product.id) ? 1 : 0,
          has_cart_items: cartItems.some((item) => item.id_produk === product.id) ? 1 : 0,
        }] : [], []];
      }
      if (sql.trimStart().startsWith('DELETE FROM produk')) {
        const index = products.findIndex((item) => item.id === params[0]);
        if (index >= 0) products.splice(index, 1);
        return [{ affectedRows: index >= 0 ? 1 : 0 }, []];
      }
      if (sql.trimStart().startsWith('UPDATE produk') && sql.includes('SET archived_at')) {
        const deletingToArchive = sql.includes('SET archived_at = COALESCE');
        const productId = deletingToArchive ? params[0] : params[1];
        const product = products.find((item) => item.id === productId);
        if (product) {
          product.archived_at = deletingToArchive
            ? (product.archived_at || '2026-11-08 12:00:00')
            : (params[0] ? '2026-11-08 12:00:00' : null);
        }
        return [{ affectedRows: product ? 1 : 0 }, []];
      }
      if (sql.trimStart().startsWith('UPDATE produk') && sql.includes('SET jumlah_stok =')) {
        const product = products.find((item) => item.id === params[2]);
        if (product) product.stok = params[0];
        return [{ affectedRows: product ? 1 : 0 }, []];
      }
      if (sql.includes('INSERT INTO produk')) {
        const newProduct = {
          id: Math.max(...products.map((product) => product.id)) + 1,
          nama: params[2],
          deskripsi: params[3] ?? null,
          harga: params[5],
          harga_beli: params[4],
          satuan: params[6],
          foto_produk: params[7] ?? null,
          stok: params[9],
          batas_stok_kritis: params[10],
          kategori: 'Minuman',
        };
        products.push(newProduct);
        return [{ insertId: newProduct.id }, []];
      }
      if (sql.trimStart().startsWith('UPDATE produk')) {
        const product = products.find((item) => item.id === params[13]);
        if (product) {
          Object.assign(product, {
            nama: params[1],
            harga: params[2],
            harga_beli: params[3] ?? product.harga_beli,
            satuan: params[4],
            deskripsi: params[5] === 1 ? params[6] : product.deskripsi,
            foto_produk: params[7] === 1 ? params[8] : product.foto_produk,
            batas_stok_kritis: params[9] ?? product.batas_stok_kritis,
            stok: params[10] ?? product.stok,
          });
        }
        return [{ affectedRows: product ? 1 : 0 }, []];
      }
      if (sql.includes('INSERT INTO riwayat_stok')) {
        stockHistory.push({
          id_produk: params[0],
          id_admin: params[1],
          jenis_perubahan: params[2],
          jumlah: params[3],
          stok_sebelum: params[4],
          stok_sesudah: params[5],
          keterangan: params[6],
        });
        return [{ insertId: 1 }, []];
      }
      if (sql.includes('COUNT(*) AS total')) {
        const visibleProducts = sql.includes('p.archived_at IS NULL')
          ? products.filter((item) => !item.archived_at)
          : products;
        return [[{ total: visibleProducts.length }], []];
      }
      if (sql.includes('COUNT(*) AS stok_kritis')) {
        return [[{
          stok_kritis: products.filter(
            (item) => !item.archived_at && item.stok <= item.batas_stok_kritis,
          ).length,
        }], []];
      }
      if (sql.includes('FROM produk p')) {
        if (sql.includes('WHERE p.id_produk = ?')) {
          const prod = products.find((item) => item.id === params[0]);
          return [prod ? [prod] : [], []];
        }
        let visibleProducts = sql.includes('p.archived_at IS NULL')
          ? products.filter((item) => !item.archived_at)
          : products;
        const searchTerm = params.find(
          (param) => typeof param === 'string' && param.startsWith('%') && param.endsWith('%'),
        );
        if (searchTerm) {
          const search = searchTerm.slice(1, -1).toLowerCase();
          visibleProducts = visibleProducts.filter((item) => item.nama.toLowerCase().includes(search));
        }
        if (sql.includes('AND p.jumlah_stok <= p.batas_stok_minimum')) {
          visibleProducts = visibleProducts.filter(
            (item) => item.stok <= item.batas_stok_kritis,
          );
        }
        return [visibleProducts, []];
      }
      throw new Error(`Query test tidak dikenal: ${sql}`);
    },
  };
  db.getConnection = async () => ({
    query: db.query.bind(db),
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
  });

  const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'toko-abah-upload-'));
  const server = createApp({ db, jwtSecret: JWT_SECRET, uploadDir }).listen(0);
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(uploadDir, { recursive: true, force: true });
  });
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    serverOrigin: `http://127.0.0.1:${server.address().port}`,
    stockHistory,
    transactionDetails,
    purchaseDetails,
    cartItems,
    transactions,
    reviews,
    products,
  };
}

test('POST /api/products: hak akses dan validasi tambah produk', async (t) => {
  const { baseUrl } = await createFixture(t);

  // 1. Tanpa token ditolak (401)
  const noToken = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'Teh Botol' }),
  });
  assert.equal(noToken.status, 401);

  // 2. Pegawai ditolak menambah produk (403)
  const loginPegawai = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'employee-pass' }),
  });
  const pegawaiToken = (await loginPegawai.json()).token;

  const pegawaiCreate = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({
      nama: 'Susu UHT',
      kategori: 'Minuman',
      harga: 18000,
      berat: 1000,
      stok: 10,
    }),
  });
  assert.equal(pegawaiCreate.status, 403);

  // 3. Admin login
  const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await loginAdmin.json()).token;
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // 4. Data tidak valid (422) dengan pesan per field
  const invalidBody = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  assert.equal(invalidBody.status, 422);
  const errBody = await invalidBody.json();
  assert.equal(errBody.message, 'Data tidak valid');
  assert.equal(errBody.errors.nama, 'Kolom ini wajib diisi');
  assert.equal(errBody.errors.kategori, 'Kolom ini wajib diisi');
  assert.equal(errBody.errors.harga, 'Kolom ini wajib diisi');
  assert.equal(errBody.errors.berat, 'Kolom ini wajib diisi');
  assert.equal(errBody.errors.stok, 'Kolom ini wajib diisi');

  // 5. Data valid berhasil dibuat (201)
  const validCreate = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Susu UHT 1 L',
      kategori: 'Minuman',
      harga: 18000,
      berat: 1000,
      stok: 24,
    }),
  });
  assert.equal(validCreate.status, 201);
  const created = (await validCreate.json()).data;
  assert.equal(created.nama, 'Susu UHT 1 L');
  assert.equal(created.harga, 18000);
  assert.equal(created.berat, 1000);
  assert.equal(created.stok, 24);
  assert.equal(created.batas_stok_kritis, 5);
  assert.equal(created.status_stok, 'Stok Aman');
});

test('PUT /api/products/:id: admin dapat mengubah harga, pegawai ditolak', async (t) => {
  const { baseUrl } = await createFixture(t);
  const loginPegawai = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'employee-pass' }),
  });
  const pegawaiToken = (await loginPegawai.json()).token;
  const productUpdate = {
    nama: 'Susu UHT 1 L',
    kategori: 'Minuman',
    harga: 20000,
    harga_beli: 12000,
    berat: 1000,
    batas_stok_kritis: 8,
  };

  const pegawaiUpdate = await fetch(`${baseUrl}/products/20`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify(productUpdate),
  });
  assert.equal(pegawaiUpdate.status, 403);

  const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await loginAdmin.json()).token;
  const adminUpdate = await fetch(`${baseUrl}/products/20`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(productUpdate),
  });

  assert.equal(adminUpdate.status, 200);
  const updated = (await adminUpdate.json()).data;
  assert.equal(updated.nama, 'Susu UHT 1 L');
  assert.equal(Number(updated.harga), 20000);
  assert.equal(updated.berat, 1000);
  assert.equal(Number(updated.stok), 24);
  assert.equal(Number(updated.batas_stok_kritis), 8);
});

test('PUT /api/products/:id: perubahan stok memperbarui stok dan mencatat riwayat', async (t) => {
  const { baseUrl, stockHistory } = await createFixture(t);
  const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await loginAdmin.json()).token;
  const response = await fetch(`${baseUrl}/products/20`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'Susu UHT 1 L',
      kategori: 'Minuman',
      harga: 18000,
      berat: 1000,
      stok: 18,
      batas_stok_kritis: 5,
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(Number((await response.json()).data.stok), 18);
  assert.deepEqual(stockHistory.at(-1), {
    id_produk: 20,
    id_admin: 1,
    jenis_perubahan: 'keluar',
    jumlah: 6,
    stok_sebelum: 24,
    stok_sesudah: 18,
    keterangan: 'Penyesuaian stok saat mengubah produk',
  });
  const stockResponse = await fetch(`${baseUrl}/stock`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const stockData = await stockResponse.json();
  assert.equal(stockResponse.status, 200);
  assert.equal(Number(stockData.data[0].stok), 18);
});

test('GET /api/stock: pencarian produk dan filter stok kritis', async (t) => {
  const { baseUrl } = await createFixture(t);
  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const { token } = await login.json();
  const headers = { Authorization: ['Bearer', token].join(' ') };

  const searchResponse = await fetch(`${baseUrl}/stock?search=%20Susu%20`, { headers });
  assert.equal(searchResponse.status, 200);
  const searchResult = await searchResponse.json();
  assert.deepEqual(searchResult.data.map((product) => product.nama), ['Susu UHT 1 L']);

  const noMatchResponse = await fetch(`${baseUrl}/stock?search=Kopi`, { headers });
  assert.equal((await noMatchResponse.json()).data.length, 0);

  const criticalResponse = await fetch(`${baseUrl}/stock?kritis=true`, { headers });
  assert.equal((await criticalResponse.json()).data.length, 0);
});

test('PATCH /api/products/:id/stock: validasi, update, dan riwayat stok transaksional', async (t) => {
  const { baseUrl, stockHistory } = await createFixture(t);
  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const { token } = await login.json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: ['Bearer', token].join(' '),
  };
  const invalidCases = [
    { id: 20, body: {}, error: 'Kolom ini wajib diisi' },
    { id: 20, body: { stok: -1 }, error: 'Jumlah stok tidak boleh negatif' },
    { id: 20, body: { stok: 2.5 }, error: INVALID_NUMBER },
    { id: 20, body: { stok: 2147483648 }, error: INVALID_NUMBER },
  ];

  for (const { id, body, error } of invalidCases) {
    const response = await fetch(`${baseUrl}/products/${id}/stock`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).errors.stok, error);
  }

  const invalidId = await fetch(`${baseUrl}/products/invalid/stock`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ stok: 10 }),
  });
  assert.equal(invalidId.status, 400);

  const missingProduct = await fetch(`${baseUrl}/products/999/stock`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ stok: 10 }),
  });
  assert.equal(missingProduct.status, 404);

  const updateResponse = await fetch(`${baseUrl}/products/20/stock`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ stok: 0 }),
  });
  assert.equal(updateResponse.status, 200);
  const updated = (await updateResponse.json()).data;
  assert.equal(updated.stok, 0);
  assert.equal(updated.status_stok, 'Stok Kritis');
  assert.deepEqual(stockHistory.at(-1), {
    id_produk: 20,
    id_admin: 1,
    jenis_perubahan: 'keluar',
    jumlah: 24,
    stok_sebelum: 24,
    stok_sesudah: 0,
    keterangan: 'Penyesuaian stok melalui aplikasi',
  });
});

test('PATCH /api/products/:id/archive: hanya admin dapat mengarsipkan dan memulihkan produk', async (t) => {
  const { baseUrl } = await createFixture(t);
  const pegawaiLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'employee-pass' }),
  });
  const pegawaiToken = (await pegawaiLogin.json()).token;
  const pegawaiResponse = await fetch(`${baseUrl}/products/20/archive`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ archived: true }),
  });
  assert.equal(pegawaiResponse.status, 403);

  const adminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await adminLogin.json()).token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };
  const archiveResponse = await fetch(`${baseUrl}/products/20/archive`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ archived: true }),
  });
  assert.equal(archiveResponse.status, 200);

  const activeProducts = await fetch(`${baseUrl}/products`, { headers });
  assert.equal((await activeProducts.json()).data.length, 0);
  const activeStock = await fetch(`${baseUrl}/stock`, { headers });
  assert.equal((await activeStock.json()).data.length, 0);
  const allProducts = await fetch(`${baseUrl}/products?include_archived=true`, { headers });
  const archived = (await allProducts.json()).data;
  assert.equal(archived.length, 1);
  assert.ok(archived[0].archived_at);

  const restoreResponse = await fetch(`${baseUrl}/products/20/archive`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ archived: false }),
  });
  assert.equal(restoreResponse.status, 200);
  const restoredProducts = await fetch(`${baseUrl}/products`, { headers });
  assert.equal((await restoredProducts.json()).data.length, 1);
});

test('DELETE /api/products/:id: hapus produk tanpa riwayat, arsipkan produk yang pernah ditransaksikan', async (t) => {
  const { baseUrl, products, transactionDetails } = await createFixture(t);
  const login = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  const noTokenResponse = await fetch(`${baseUrl}/products/20`, { method: 'DELETE' });
  assert.equal(noTokenResponse.status, 401);

  transactionDetails.push({ id_produk: 20 });
  const archivedResponse = await fetch(`${baseUrl}/products/20`, {
    method: 'DELETE',
    headers,
  });
  assert.equal(archivedResponse.status, 200);
  assert.equal((await archivedResponse.json()).action, 'archived');
  assert.ok(products[0].archived_at);
  assert.equal(products.length, 1);

  transactionDetails.length = 0;
  products[0].archived_at = null;
  const deletedResponse = await fetch(`${baseUrl}/products/20`, {
    method: 'DELETE',
    headers,
  });
  assert.equal(deletedResponse.status, 200);
  assert.equal((await deletedResponse.json()).action, 'deleted');
  assert.equal(products.length, 0);

  const missingResponse = await fetch(`${baseUrl}/products/20`, {
    method: 'DELETE',
    headers,
  });
  assert.equal(missingResponse.status, 404);
});

test('POST /api/products/photo dan foto_produk: upload, validasi, dan penyimpanan', async (t) => {
  const invalidUrl = validateProduct({
    nama: 'Kopi ABC',
    kategori: 'Minuman',
    harga: 2000,
    berat: 25,
    stok: 10,
    foto_produk: 'javascript:alert(1)',
  });
  assert.ok(invalidUrl.errors.foto_produk);

  const { baseUrl, serverOrigin } = await createFixture(t);
  const loginPegawai = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'employee-pass' }),
  });
  const pegawaiToken = (await loginPegawai.json()).token;

  const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await loginAdmin.json()).token;

  const validPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  ]);

  const noTokenRes = await fetch(`${baseUrl}/products/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: validPng,
  });
  assert.equal(noTokenRes.status, 401);

  const pegawaiRes = await fetch(`${baseUrl}/products/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: validPng,
  });
  assert.equal(pegawaiRes.status, 403);

  const spoofedRes = await fetch(`${baseUrl}/products/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${adminToken}`,
    },
    body: Buffer.from('<script>alert(1)</script>'),
  });
  assert.equal(spoofedRes.status, 422);

  const uploadRes = await fetch(`${baseUrl}/products/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${adminToken}`,
    },
    body: validPng,
  });
  assert.equal(uploadRes.status, 201);
  const uploadedUrl = (await uploadRes.json()).data.url;
  assert.match(uploadedUrl, /^\/uploads\/products\/prd-.*\.png$/);

  const staticRes = await fetch(`${serverOrigin}${uploadedUrl}`);
  assert.equal(staticRes.status, 200);
  assert.equal(staticRes.headers.get('cross-origin-resource-policy'), 'cross-origin');

  const createRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'Kopi ABC Susu',
      kategori: 'Minuman',
      harga: 2000,
      berat: 30,
      stok: 20,
      foto_produk: uploadedUrl,
    }),
  });
  assert.equal(createRes.status, 201);
  const created = (await createRes.json()).data;
  assert.equal(created.foto_produk, uploadedUrl);

  const preserveRes = await fetch(`${baseUrl}/products/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'Kopi ABC Susu 30g',
      kategori: 'Minuman',
      harga: 2500,
      berat: 30,
    }),
  });
  assert.equal(preserveRes.status, 200);
  assert.equal((await preserveRes.json()).data.foto_produk, uploadedUrl);

  const clearRes = await fetch(`${baseUrl}/products/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'Kopi ABC Susu 30g',
      kategori: 'Minuman',
      harga: 2500,
      berat: 30,
      foto_produk: null,
    }),
  });
  assert.equal(clearRes.status, 200);
  assert.equal((await clearRes.json()).data.foto_produk, null);
});

test('deskripsi produk dan ulasan pelanggan (/api/catalog/:id/reviews)', async (t) => {
  const longDesc = validateProduct({
    nama: 'Tepung Segitiga',
    kategori: 'Minuman',
    harga: 12000,
    berat: 1000,
    stok: 10,
    deskripsi: 'a'.repeat(1001),
  });
  assert.ok(longDesc.errors.deskripsi);

  const { baseUrl, transactions, transactionDetails } = await createFixture(t);
  const loginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const adminToken = (await loginAdmin.json()).token;

  const createRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'Tepung Terigu 1 kg',
      kategori: 'Minuman',
      harga: 14000,
      berat: 1000,
      stok: 15,
      deskripsi: 'Tepung serbaguna kemasan 1 kg.',
    }),
  });
  assert.equal(createRes.status, 201);
  const created = (await createRes.json()).data;
  assert.equal(created.deskripsi, 'Tepung serbaguna kemasan 1 kg.');

  const emptyReviewsRes = await fetch(`${baseUrl}/catalog/${created.id}/reviews`);
  assert.equal(emptyReviewsRes.status, 200);
  const emptyReviews = await emptyReviewsRes.json();
  assert.deepEqual(emptyReviews.data, []);
  assert.equal(emptyReviews.ringkasan.jumlah_ulasan, 0);
  assert.equal(emptyReviews.ringkasan.rating_rata, null);

  const invalidReviewRes = await fetch(`${baseUrl}/catalog/${created.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama_pengulas: '', rating: 6, komentar: 'ok' }),
  });
  assert.equal(invalidReviewRes.status, 422);

  const guestReviewRes = await fetch(`${baseUrl}/catalog/${created.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama_pengulas: 'Ibu Sari',
      rating: 4,
      komentar: 'Kemasan rapi dan pengiriman cepat.',
    }),
  });
  assert.equal(guestReviewRes.status, 201);
  const guestReview = await guestReviewRes.json();
  assert.equal(guestReview.data.terverifikasi, false);
  assert.equal(guestReview.ringkasan.jumlah_ulasan, 1);
  assert.equal(guestReview.ringkasan.rating_rata, 4);

  transactions.push({
    id_transaksi: 501,
    kode_transaksi: 'TA-20261128-0501',
    status_transaksi: 'selesai',
  });
  transactionDetails.push({ id_transaksi: 501, id_produk: created.id });

  const verifiedReviewRes = await fetch(`${baseUrl}/catalog/${created.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama_pengulas: 'Pak Budi',
      rating: 5,
      komentar: 'Tepung halus dan berkualitas.',
      nomor_pesanan: 'TA-20261128-0501',
    }),
  });
  assert.equal(verifiedReviewRes.status, 201);
  const verifiedReview = await verifiedReviewRes.json();
  assert.equal(verifiedReview.data.terverifikasi, true);
  assert.equal(verifiedReview.ringkasan.jumlah_ulasan, 2);
  assert.equal(verifiedReview.ringkasan.rating_rata, 4.5);

  const dupVerifiedRes = await fetch(`${baseUrl}/catalog/${created.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama_pengulas: 'Pak Budi',
      rating: 5,
      komentar: 'Ulasan ganda.',
      nomor_pesanan: 'TA-20261128-0501',
    }),
  });
  assert.equal(dupVerifiedRes.status, 422);
});
