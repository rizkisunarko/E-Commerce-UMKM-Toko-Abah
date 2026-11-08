const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');
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
      if (sql.includes('SELECT jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE')) {
        const product = products.find((item) => item.id === params[0]);
        return [product ? [{ jumlah_stok: product.stok }] : [], []];
      }
      if (sql.includes('SELECT id_produk FROM produk WHERE id_produk = ?')) {
        return products.some((item) => item.id === params[0])
          ? [[{ id_produk: params[0] }], []]
          : [[], []];
      }
      if (sql.trimStart().startsWith('UPDATE produk') && sql.includes('SET archived_at')) {
        const product = products.find((item) => item.id === params[1]);
        if (product) product.archived_at = params[0] ? '2026-11-08 12:00:00' : null;
        return [{ affectedRows: product ? 1 : 0 }, []];
      }
      if (sql.includes('INSERT INTO produk')) {
        const newProduct = {
          id: Math.max(...products.map((product) => product.id)) + 1,
          nama: params[2],
          harga: params[4],
          harga_beli: params[3],
          satuan: params[5],
          stok: params[7],
          batas_stok_kritis: params[8],
          kategori: 'Minuman',
        };
        products.push(newProduct);
        return [{ insertId: newProduct.id }, []];
      }
      if (sql.trimStart().startsWith('UPDATE produk')) {
        const product = products.find((item) => item.id === params[9]);
        if (product) {
          Object.assign(product, {
            nama: params[1],
            harga: params[2],
            harga_beli: params[3] ?? product.harga_beli,
            satuan: params[4],
            batas_stok_kritis: params[5] ?? product.batas_stok_kritis,
            stok: params[6] ?? product.stok,
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
        return [
          sql.includes('p.archived_at IS NULL')
            ? products.filter((item) => !item.archived_at)
            : products,
          [],
        ];
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

  const server = createApp({ db, jwtSecret: JWT_SECRET }).listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    stockHistory,
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
