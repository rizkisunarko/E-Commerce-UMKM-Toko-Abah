const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');
const { validateProduct } = require('../src/utils/productValidation');

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
  const products = [];
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
      if (sql.includes('INSERT INTO produk')) {
        const newProduct = {
          id: products.length + 1,
          nama: params[2],
          harga: params[4],
          satuan: params[5],
          stok: params[7],
          batas_stok_kritis: params[8],
          kategori: 'Minuman',
        };
        products.push(newProduct);
        return [{ insertId: newProduct.id }, []];
      }
      if (sql.includes('INSERT INTO riwayat_stok')) {
        return [{ insertId: 1 }, []];
      }
      if (sql.includes('FROM produk p')) {
        const prod = products.find((item) => item.id === params[0]);
        return [prod ? [prod] : [], []];
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
  return `http://127.0.0.1:${server.address().port}/api`;
}

test('POST /api/products: hak akses dan validasi tambah produk', async (t) => {
  const baseUrl = await createFixture(t);

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
