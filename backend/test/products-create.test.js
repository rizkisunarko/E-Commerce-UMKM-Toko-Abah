const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createFixture(t) {
  const accounts = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 4), nama: 'admin', role: 'admin' },
    { id: 2, username: 'pegawai', password: bcrypt.hashSync('pegawai123', 4), nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
  ];
  const products = [];
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
        const validCategories = {
          'Beras & Tepung': 1,
          'Minyak & Bumbu': 2,
          'Gula & Pemanis': 3,
          'Telur & Lauk': 4,
          'Makanan Instan': 5,
          'Minuman': 6,
          'Kebutuhan Rumah': 7,
        };
        const id = validCategories[params[0]];
        return id ? [[{ id_kategori: id }], []] : [[], []];
      }
      if (sql.includes('INSERT INTO produk')) {
        const newProduct = {
          id: products.length + 1,
          id_kategori: params[0],
          kode_produk: params[1],
          nama: params[2],
          harga_beli: params[3],
          harga: params[4],
          satuan: params[5],
          status_produk: params[6],
          stok: params[7],
          batas_stok_kritis: params[8],
          kategori: Object.keys({
            'Beras & Tepung': 1,
            'Minyak & Bumbu': 2,
            'Gula & Pemanis': 3,
            'Telur & Lauk': 4,
            'Makanan Instan': 5,
            'Minuman': 6,
            'Kebutuhan Rumah': 7,
          }).find((k) => ({
            'Beras & Tepung': 1,
            'Minyak & Bumbu': 2,
            'Gula & Pemanis': 3,
            'Telur & Lauk': 4,
            'Makanan Instan': 5,
            'Minuman': 6,
            'Kebutuhan Rumah': 7,
          })[k] === params[0]),
        };
        products.push(newProduct);
        return [{ insertId: newProduct.id }, []];
      }
      if (sql.includes('INSERT INTO riwayat_stok')) {
        stockHistory.push({
          id_produk: params[0],
          id_admin: params[1],
          jumlah: params[2],
          stok_sebelum: 0,
          stok_sesudah: params[3],
          keterangan: 'Stok awal produk',
        });
        return [{ insertId: stockHistory.length }, []];
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

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    products,
    stockHistory,
  };
}

test('Fase C: Pengujian Seluruh 11 Skenario Tambah Produk (PPL-01.1)', async (t) => {
  const { baseUrl, products, stockHistory } = await createFixture(t);

  // Skenario 1: Login admin
  const resLoginAdmin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  assert.equal(resLoginAdmin.status, 200, 'Skenario 1: Login admin harus 200');
  const bodyLoginAdmin = await resLoginAdmin.json();
  assert.ok(bodyLoginAdmin.token, 'Skenario 1: Harus mengembalikan JWT token');
  const adminToken = bodyLoginAdmin.token;
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // Skenario 2: Tambah produk valid
  const resValid = await fetch(`${baseUrl}/products`, {
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
  assert.equal(resValid.status, 201, 'Skenario 2: Status harus 201 Created');
  const bodyValid = await resValid.json();
  assert.equal(bodyValid.data.nama, 'Susu UHT 1 L');
  assert.equal(bodyValid.data.kategori, 'Minuman');
  assert.equal(bodyValid.data.harga, 18000);
  assert.equal(bodyValid.data.berat, 1000);
  assert.equal(bodyValid.data.stok, 24);
  assert.equal(bodyValid.data.batas_stok_kritis, 5, 'Skenario 2: batas_stok_kritis bawaan = 5');
  assert.equal(bodyValid.data.status_stok, 'Stok Aman', 'Skenario 2: status_stok harus terisi');

  // Skenario 3: Body kosong {}
  const resEmpty = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({}),
  });
  assert.equal(resEmpty.status, 422, 'Skenario 3: Body kosong harus 422');
  const bodyEmpty = await resEmpty.json();
  assert.equal(bodyEmpty.message, 'Data tidak valid');
  assert.equal(bodyEmpty.errors.nama, 'Kolom ini wajib diisi');
  assert.equal(bodyEmpty.errors.kategori, 'Kolom ini wajib diisi');
  assert.equal(bodyEmpty.errors.harga, 'Kolom ini wajib diisi');
  assert.equal(bodyEmpty.errors.berat, 'Kolom ini wajib diisi');
  assert.equal(bodyEmpty.errors.stok, 'Kolom ini wajib diisi');

  // Skenario 4: Harga bukan angka ("abc")
  const resInvalidHarga = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Produk Uji',
      kategori: 'Minuman',
      harga: 'abc',
      berat: 500,
      stok: 10,
    }),
  });
  assert.equal(resInvalidHarga.status, 422, 'Skenario 4: Harga non-angka harus 422');
  const bodyInvalidHarga = await resInvalidHarga.json();
  assert.equal(bodyInvalidHarga.errors.harga, 'Masukkan angka yang valid');

  // Skenario 5: Berat nol atau kosong
  const resInvalidBerat = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Produk Uji',
      kategori: 'Minuman',
      harga: 10000,
      berat: 0,
      stok: 10,
    }),
  });
  assert.equal(resInvalidBerat.status, 422, 'Skenario 5: Berat nol harus 422');
  const bodyInvalidBerat = await resInvalidBerat.json();
  assert.equal(bodyInvalidBerat.errors.berat, 'Masukkan angka yang valid');

  // Skenario 6: Stok negatif (-1)
  const resInvalidStok = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Produk Uji',
      kategori: 'Minuman',
      harga: 10000,
      berat: 500,
      stok: -1,
    }),
  });
  assert.equal(resInvalidStok.status, 422, 'Skenario 6: Stok negatif harus 422');
  const bodyInvalidStok = await resInvalidStok.json();
  assert.equal(bodyInvalidStok.errors.stok, 'Jumlah stok tidak boleh negatif');

  // Skenario 7: Kategori di luar daftar
  const resInvalidKat = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Produk Uji',
      kategori: 'Otomotif',
      harga: 10000,
      berat: 500,
      stok: 10,
    }),
  });
  assert.equal(resInvalidKat.status, 422, 'Skenario 7: Kategori tidak terdaftar harus 422');
  const bodyInvalidKat = await resInvalidKat.json();
  assert.equal(bodyInvalidKat.errors.kategori, 'Kategori tidak valid');

  // Skenario 8: Batas stok kritis diisi 10
  const resCustomBatas = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      nama: 'Minyak Goreng 2 L',
      kategori: 'Minyak & Bumbu',
      harga: 35000,
      berat: 2000,
      stok: 8,
      batas_stok_kritis: 10,
    }),
  });
  assert.equal(resCustomBatas.status, 201, 'Skenario 8: Harus 201');
  const bodyCustomBatas = await resCustomBatas.json();
  assert.equal(bodyCustomBatas.data.batas_stok_kritis, 10, 'Skenario 8: batas_stok_kritis harus 10');
  assert.equal(bodyCustomBatas.data.status_stok, 'Stok Kritis', 'Skenario 8: stok (8) <= batas (10) -> Stok Kritis');

  // Skenario 9: Token pegawai ditolak (403)
  const resLoginPegawai = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'pegawai123' }),
  });
  const pegawaiToken = (await resLoginPegawai.json()).token;
  const resPegawai = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({
      nama: 'Produk Pegawai',
      kategori: 'Minuman',
      harga: 10000,
      berat: 500,
      stok: 10,
    }),
  });
  assert.equal(resPegawai.status, 403, 'Skenario 9: Token pegawai harus 403 Akses ditolak');

  // Skenario 10: Tanpa token ditolak (401)
  const resNoToken = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'Produk Tanpa Token',
      kategori: 'Minuman',
      harga: 10000,
      berat: 500,
      stok: 10,
    }),
  });
  assert.equal(resNoToken.status, 401, 'Skenario 10: Tanpa token harus 401');

  // Skenario 11: Cek penyimpanan di database dan riwayat stok
  assert.equal(products.length, 2, 'Skenario 11: 2 produk berhasil tersimpan di database');
  assert.equal(products[0].satuan, '1000 g', 'Skenario 11: berat tersimpan dalam gram di kolom satuan');
  assert.equal(stockHistory.length, 2, 'Skenario 11: Riwayat stok awal tercatat');
  assert.equal(stockHistory[0].keterangan, 'Stok awal produk');
});
