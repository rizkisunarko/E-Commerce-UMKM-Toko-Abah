const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}

function getWibSqlDateTime(date) {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

async function createFixture(t, initialData = {}) {
  const accounts = [
    { id: 1, username: 'admin', nama: 'Admin Toko', role: 'admin' },
    { id: 2, username: 'pegawai', nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
  ];

  const products = initialData.products || [
    { id_produk: 1, nama_produk: 'Beras 5 kg' },
    { id_produk: 2, nama_produk: 'Minyak Goreng 1 L' },
    { id_produk: 3, nama_produk: 'Gula Pasir 1 kg' },
    { id_produk: 4, nama_produk: 'Kopi Sachet' },
  ];

  const now = new Date();
  const wibNow = getWibSqlDateTime(now);
  const wibToday = wibNow.slice(0, 10);

  // Buat tanggal dinamis sesuai hari ini di WIB
  const transactions = initialData.transactions || [
    {
      id_transaksi: 1,
      jenis_transaksi: 'kasir',
      status_transaksi: 'selesai',
      tanggal_transaksi: `${wibToday} 10:00:00`,
    },
    {
      id_transaksi: 2,
      jenis_transaksi: 'online',
      status_transaksi: 'dibayar',
      tanggal_transaksi: `${wibToday} 11:00:00`,
    },
    {
      id_transaksi: 3,
      jenis_transaksi: 'online',
      status_transaksi: 'diproses',
      tanggal_transaksi: `${wibToday} 08:30:00`,
    },
    {
      id_transaksi: 4,
      jenis_transaksi: 'online',
      status_transaksi: 'menunggu', // tidak boleh dihitung
      tanggal_transaksi: `${wibToday} 09:00:00`,
    },
    {
      id_transaksi: 5,
      jenis_transaksi: 'online',
      status_transaksi: 'batal', // tidak boleh dihitung
      tanggal_transaksi: `${wibToday} 09:30:00`,
    },
    {
      id_transaksi: 6,
      jenis_transaksi: 'kasir',
      status_transaksi: 'selesai',
      tanggal_transaksi: '2026-01-01 10:00:00', // di luar 7d dan 24h
    },
  ];

  const details = initialData.details || [
    // trx 1 (kasir selesai): Beras (3), Minyak (2)
    { id_detail_transaksi: 1, id_transaksi: 1, id_produk: 1, jumlah: 3 },
    { id_detail_transaksi: 2, id_transaksi: 1, id_produk: 2, jumlah: 2 },
    // trx 2 (online dibayar): Beras (5), Gula (4)
    { id_detail_transaksi: 3, id_transaksi: 2, id_produk: 1, jumlah: 5 },
    { id_detail_transaksi: 4, id_transaksi: 2, id_produk: 3, jumlah: 4 },
    // trx 3 (online diproses): Minyak (8)
    { id_detail_transaksi: 5, id_transaksi: 3, id_produk: 2, jumlah: 8 },
    // trx 4 (online menunggu - HARUS DIABAIKAN): Beras (100)
    { id_detail_transaksi: 6, id_transaksi: 4, id_produk: 1, jumlah: 100 },
    // trx 5 (online batal - HARUS DIABAIKAN): Gula (50)
    { id_detail_transaksi: 7, id_transaksi: 5, id_produk: 3, jumlah: 50 },
    // trx 6 (kasir lama di luar periode): Kopi (20)
    { id_detail_transaksi: 8, id_transaksi: 6, id_produk: 4, jumlah: 20 },
  ];

  const db = {
    async query(sql, params = []) {
      if (sql.includes('FROM admin WHERE id_admin')) {
        const account = accounts.find((a) => a.role === 'admin' && a.id === params[0]);
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }
      if (sql.includes('FROM pegawai WHERE id_pegawai')) {
        const account = accounts.find(
          (a) => a.role === 'pegawai' && a.id === params[0] && a.status === 'aktif',
        );
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }

      if (sql.includes('FROM detail_transaksi dt')) {
        const [startSql, endSql] = params;

        // Filter transaksi berdasarkan tanggal dan status
        const validTrx = transactions.filter((t) => {
          if (t.tanggal_transaksi < startSql || t.tanggal_transaksi > endSql) {
            return false;
          }
          if (t.jenis_transaksi === 'kasir' && t.status_transaksi === 'selesai') {
            return true;
          }
          if (
            t.jenis_transaksi === 'online' &&
            ['dibayar', 'diproses', 'siap_diambil', 'siap_dikirim', 'selesai'].includes(
              t.status_transaksi,
            )
          ) {
            return true;
          }
          return false;
        });

        const trxIds = new Set(validTrx.map((t) => t.id_transaksi));
        const salesByProduct = new Map();

        for (const item of details) {
          if (!trxIds.has(item.id_transaksi)) continue;
          const current = salesByProduct.get(item.id_produk) || 0;
          salesByProduct.set(item.id_produk, current + Number(item.jumlah));
        }

        const rows = [];
        for (const [prodId, qty] of salesByProduct.entries()) {
          const product = products.find((p) => p.id_produk === prodId);
          if (product) {
            rows.push({
              product_id: product.id_produk,
              nama: product.nama_produk,
              jumlah_terjual: qty,
            });
          }
        }

        // Urutkan jumlah_terjual DESC, nama ASC
        rows.sort((a, b) => b.jumlah_terjual - a.jumlah_terjual || a.nama.localeCompare(b.nama));
        return [rows, []];
      }

      return [[], []];
    },
  };

  const app = createApp({
    db,
    jwtSecret: JWT_SECRET,
    shippingClient: { isConfigured: () => true },
    paymentClient: { isConfigured: () => true },
  });

  const server = app.listen(0);
  await once(server, 'listening');

  t.after(() => {
    server.close();
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/reports`;

  return {
    baseUrl,
    adminToken: createToken({ sub: 1, role: 'admin' }),
    pegawaiToken: createToken({ sub: 2, role: 'pegawai' }),
    wibToday,
  };
}

test('GET /reports/top-products - R1: Tanpa token menghasilkan 401', async (t) => {
  const { baseUrl } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=7d`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.message, /login terlebih dahulu/i);
});

test('GET /reports/top-products - R1: Token pegawai menghasilkan 403', async (t) => {
  const { baseUrl, pegawaiToken } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=7d`, {
    headers: { Authorization: `Bearer ${pegawaiToken}` },
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.message, 'Akses ditolak');
});

test('GET /reports/top-products - R7: Validasi period salah menghasilkan 422', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=invalid`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.message, 'Data tidak valid');
  assert.ok(body.errors?.period);
});

test('GET /reports/top-products - R7: Period custom tanpa from atau to menghasilkan 422', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=custom`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.message, 'Data tidak valid');
  assert.ok(body.errors?.from);
  assert.ok(body.errors?.to);
});

test('GET /reports/top-products - R7: Period custom from setelah to menghasilkan 422', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(
    `${baseUrl}/top-products?period=custom&from=2026-11-20&to=2026-11-10`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.message, 'Data tidak valid');
  assert.ok(body.errors?.from);
});

test('GET /reports/top-products - R7: Period custom rentang lebih dari 366 hari menghasilkan 422', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(
    `${baseUrl}/top-products?period=custom&from=2025-01-01&to=2026-02-01`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.message, 'Data tidak valid');
  assert.ok(body.errors?.to);
});

test('GET /reports/top-products - R2 & R4: ?period=7d mengembalikan produk terlaris terurut menurun dan mengabaikan pesanan menunggu/batal', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=7d`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.ok(Array.isArray(body.data));
  assert.ok(body.periode?.from);
  assert.ok(body.periode?.to);

  // Minyak Goreng = 2 (trx1) + 8 (trx3) = 10
  // Beras 5 kg = 3 (trx1) + 5 (trx2) = 8 (trx4 yang statusnya menunggu tidak dihitung)
  // Gula Pasir = 4 (trx2) (trx5 yang statusnya batal tidak dihitung)
  assert.equal(body.data.length, 3);
  assert.equal(body.data[0].nama, 'Minyak Goreng 1 L');
  assert.equal(body.data[0].jumlah_terjual, 10);
  assert.equal(body.data[1].nama, 'Beras 5 kg');
  assert.equal(body.data[1].jumlah_terjual, 8);
  assert.equal(body.data[2].nama, 'Gula Pasir 1 kg');
  assert.equal(body.data[2].jumlah_terjual, 4);
});

test('GET /reports/top-products - R3: ?period=24h menghitung penjualan dalam 24 jam terakhir', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(`${baseUrl}/top-products?period=24h`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
  // Pastikan Kopi Sachet (dari 2026-01-01) tidak ikut
  const kopi = body.data.find((p) => p.nama === 'Kopi Sachet');
  assert.equal(kopi, undefined);
});

test('GET /reports/top-products - R5: ?period=custom menghitung rentang tanggal WIB', async (t) => {
  const { baseUrl, adminToken, wibToday } = await createFixture(t);

  const res = await fetch(
    `${baseUrl}/top-products?period=custom&from=${wibToday}&to=${wibToday}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.ok(Array.isArray(body.data));
  assert.equal(body.data.length, 3);
  assert.equal(body.data[0].nama, 'Minyak Goreng 1 L');
  assert.equal(body.data[0].jumlah_terjual, 10);
});

test('GET /reports/top-products - R6: Periode tanpa penjualan menghasilkan data kosong dengan status 200', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const res = await fetch(
    `${baseUrl}/top-products?period=custom&from=2020-01-01&to=2020-01-05`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.deepEqual(body.data, []);
  assert.ok(body.periode?.from);
  assert.ok(body.periode?.to);
});
