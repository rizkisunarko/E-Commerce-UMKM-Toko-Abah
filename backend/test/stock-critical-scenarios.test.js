const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createStockFixture(t) {
  const accounts = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin-pass', 4), nama: 'admin', role: 'admin' },
    { id: 2, username: 'pegawai', password: bcrypt.hashSync('employee-pass', 4), nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
  ];

  // Data awal sesuai spesifikasi Bagian 4 & 6:
  // P1: UJI-Batas Bawaan (stok 6, batas 5 -> Aman)
  // P2: UJI-Sama Batas (stok 10, batas 10 -> Kritis)
  // P3: UJI-Di Atas Batas (stok 11, batas 10 -> Aman)
  // P4: UJI-Stok Nol (stok 0, batas 5 -> Kritis)
  const products = [
    { id: 1, nama: 'Beras 5 kg', kategori: 'Beras & Tepung', harga: 65000, harga_beli: 55000, satuan: '5000 g', stok: 4, batas_stok_kritis: 10, archived_at: null },
    { id: 2, nama: 'Minyak Goreng 1 L', kategori: 'Minyak & Bumbu', harga: 14000, harga_beli: 12000, satuan: '1000 g', stok: 3, batas_stok_kritis: 10, archived_at: null },
    { id: 3, nama: 'Gula Pasir 1 kg', kategori: 'Gula & Pemanis', harga: 17500, harga_beli: 15000, satuan: '1000 g', stok: 5, batas_stok_kritis: 10, archived_at: null },
    { id: 4, nama: 'Telur Ayam 1 kg', kategori: 'Telur & Lauk', harga: 28000, harga_beli: 25000, satuan: '1000 g', stok: 20, batas_stok_kritis: 5, archived_at: null },
    { id: 101, nama: 'UJI-Batas Bawaan', kategori: 'Beras & Tepung', harga: 1000, harga_beli: 800, satuan: '100 g', stok: 6, batas_stok_kritis: 5, archived_at: null },
    { id: 102, nama: 'UJI-Sama Batas', kategori: 'Minyak & Bumbu', harga: 1000, harga_beli: 800, satuan: '100 g', stok: 10, batas_stok_kritis: 10, archived_at: null },
    { id: 103, nama: 'UJI-Di Atas Batas', kategori: 'Gula & Pemanis', harga: 1000, harga_beli: 800, satuan: '100 g', stok: 11, batas_stok_kritis: 10, archived_at: null },
    { id: 104, nama: 'UJI-Stok Nol', kategori: 'Makanan Instan', harga: 1000, harga_beli: 800, satuan: '100 g', stok: 0, batas_stok_kritis: 5, archived_at: null },
  ];

  const stockHistory = [];

  const db = {
    async getConnection() {
      return {
        ...db,
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        release() {},
      };
    },
    async query(sql, params = []) {
      if (sql.includes('UNION ALL')) {
        return [accounts.filter((a) => params.includes(a.username)), []];
      }
      if (sql.includes('FROM admin WHERE id_admin')) {
        const a = accounts.find((item) => item.role === 'admin' && item.id === params[0]);
        return [a ? [{ id: a.id, nama: a.nama }] : [], []];
      }
      if (sql.includes('FROM pegawai WHERE id_pegawai')) {
        const a = accounts.find((item) => item.role === 'pegawai' && item.id === params[0]);
        return [a ? [{ id: a.id, nama: a.nama }] : [], []];
      }
      if (sql.includes('SELECT id_kategori FROM kategori WHERE nama_kategori = ?')) {
        return [[{ id_kategori: 1 }], []];
      }
      if (sql.includes('SELECT jumlah_stok FROM produk WHERE id_produk = ?')) {
        const product = products.find((p) => p.id === params[0] && !p.archived_at);
        return [product ? [{ jumlah_stok: product.stok }] : [], []];
      }
      if (sql.includes('SELECT id_produk FROM produk WHERE id_produk = ?')) {
        return products.some((p) => p.id === params[0]) ? [[{ id_produk: params[0] }], []] : [[], []];
      }
      if (sql.trimStart().startsWith('UPDATE produk') && sql.includes('SET jumlah_stok =')) {
        const product = products.find((item) => item.id === params[2]);
        if (product) product.stok = params[0];
        return [{ affectedRows: product ? 1 : 0 }, []];
      }
      if (sql.trimStart().startsWith('UPDATE produk') && sql.includes('batas_stok_minimum')) {
        const id = params[9];
        const p = products.find((item) => item.id === id);
        if (p) {
          p.nama = params[1];
          p.harga = params[2];
          p.harga_beli = params[3] ?? p.harga_beli;
          p.satuan = params[4];
          if (params[5] !== undefined && params[5] !== null) {
            p.batas_stok_kritis = Number(params[5]);
          }
          if (params[6] !== undefined && params[6] !== null) {
            p.stok = Number(params[6]);
          }
        }
        return [{ affectedRows: p ? 1 : 0 }, []];
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
        return [{ insertId: stockHistory.length }, []];
      }
      if (sql.includes('COUNT(*) AS stok_kritis')) {
        const kritisCount = products.filter((p) => !p.archived_at && p.stok <= p.batas_stok_kritis).length;
        return [[{ stok_kritis: kritisCount }], []];
      }
      if (sql.includes('FROM produk p')) {
        if (sql.includes('WHERE p.id_produk = ?')) {
          const p = products.find((item) => item.id === params[0]);
          return [p ? [p] : [], []];
        }
        let result = products.filter((p) => !p.archived_at);
        if (sql.includes('p.nama_produk LIKE ?')) {
          const kw = params[0].replace(/%/g, '').toLowerCase();
          result = result.filter((p) => p.nama.toLowerCase().includes(kw));
        }
        if (sql.includes('p.jumlah_stok <= p.batas_stok_minimum')) {
          result = result.filter((p) => p.stok <= p.batas_stok_kritis);
        }
        return [result, []];
      }
      return [[]];
    },
  };

  const app = createApp({ db, jwtSecret: JWT_SECRET });
  const server = app.listen(0);
  t.after(() => server.close());
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  // Login admin & pegawai
  const adminRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin-pass' }),
  });
  const { token: adminToken } = await adminRes.json();

  const pegRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pegawai', password: 'employee-pass' }),
  });
  const { token: pegawaiToken } = await pegRes.json();

  return { baseUrl, adminToken, pegawaiToken, products };
}

test('PPL-04.3: Pengujian Lengkap Skenario API A01 - A18', async (t) => {
  const { baseUrl, adminToken, pegawaiToken } = await createStockFixture(t);
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };
  const pegawaiHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${pegawaiToken}`,
  };

  // A01 (AC-04.1): GET /api/stock -> setiap produk memuat status_stok sesuai formula stok <= batas
  await t.test('A01: GET /api/stock menyertakan status_stok akurat untuk semua produk', async () => {
    const res = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    for (const p of json.data) {
      assert.ok('status_stok' in p, `status_stok harus ada pada ${p.nama}`);
      const expectedStatus = p.stok <= p.batas_stok_kritis ? 'Stok Kritis' : 'Stok Aman';
      assert.equal(p.status_stok, expectedStatus, `Status ${p.nama} tidak sesuai formula`);
    }
  });

  // A02 (AC-04.2): GET /api/stock?kritis=true -> Semua baris berstatus Stok Kritis
  await t.test('A02: GET /api/stock?kritis=true hanya menampilkan produk berstatus Stok Kritis', async () => {
    const res = await fetch(`${baseUrl}/stock?kritis=true`, { headers: adminHeaders });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.length > 0);
    for (const p of json.data) {
      assert.equal(p.status_stok, 'Stok Kritis');
    }
  });

  // A03 (AC-04.2): Bandingkan hasil A02 dengan A01
  await t.test('A03: Jumlah baris A02 sama dengan jumlah Stok Kritis di A01 dan ringkasan.stok_kritis', async () => {
    const resAll = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const jsonAll = await resAll.json();
    const criticalInAll = jsonAll.data.filter((p) => p.status_stok === 'Stok Kritis').length;

    const resKritis = await fetch(`${baseUrl}/stock?kritis=true`, { headers: adminHeaders });
    const jsonKritis = await resKritis.json();

    assert.equal(jsonKritis.data.length, criticalInAll);
    assert.equal(jsonAll.ringkasan.stok_kritis, criticalInAll);
    assert.equal(jsonKritis.ringkasan.stok_kritis, criticalInAll);
  });

  // A04 (AC-04.2): GET /api/stock?search=beras
  await t.test('A04: Pencarian kata beras memfilter data namun mempertahankan ringkasan.stok_kritis', async () => {
    const res = await fetch(`${baseUrl}/stock?search=beras`, { headers: adminHeaders });
    assert.equal(res.status, 200);
    const json = await res.json();
    for (const p of json.data) {
      assert.ok(p.nama.toLowerCase().includes('beras'));
    }
    assert.ok(json.ringkasan.stok_kritis >= 1);
  });

  // A05 (AC-04.1): PATCH /api/products/102/stock body { stok: 10 } (P2 batas 10)
  await t.test('A05: Stok sama dengan batas (10 <= 10) menghasilkan Stok Kritis', async () => {
    const patchRes = await fetch(`${baseUrl}/products/102/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: 10 }),
    });
    assert.equal(patchRes.status, 200);

    const getRes = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const json = await getRes.json();
    const p2 = json.data.find((p) => p.id === 102);
    assert.equal(p2.stok, 10);
    assert.equal(p2.status_stok, 'Stok Kritis');
  });

  // A06 (AC-04.1): PATCH /api/products/102/stock body { stok: 11 } (P2 batas 10)
  await t.test('A06: Stok di atas batas (11 > 10) menghasilkan Stok Aman', async () => {
    const patchRes = await fetch(`${baseUrl}/products/102/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: 11 }),
    });
    assert.equal(patchRes.status, 200);

    const getRes = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const json = await getRes.json();
    const p2 = json.data.find((p) => p.id === 102);
    assert.equal(p2.stok, 11);
    assert.equal(p2.status_stok, 'Stok Aman');
  });

  // A07 (AC-04.1): PATCH /api/products/104/stock body { stok: 0 }
  await t.test('A07: Stok nol menghasilkan 200 dan status Stok Kritis', async () => {
    const patchRes = await fetch(`${baseUrl}/products/104/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: 0 }),
    });
    assert.equal(patchRes.status, 200);
    const json = await patchRes.json();
    assert.equal(json.data.stok, 0);
    assert.equal(json.data.status_stok, 'Stok Kritis');
  });

  // A08 (AC-04.1): PATCH respons langsung memuat data.status_stok
  await t.test('A08: Respons langsung PATCH memuat status_stok yang valid', async () => {
    const patchRes = await fetch(`${baseUrl}/products/102/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: 9 }),
    });
    assert.equal(patchRes.status, 200);
    const json = await patchRes.json();
    assert.equal(json.data.stok, 9);
    assert.equal(json.data.status_stok, 'Stok Kritis');
  });

  // A09 (AC-03.2): PATCH /api/products/102/stock body { stok: -1 } -> 422
  await t.test('A09: Stok negatif ditolak dengan status 422 dan pesan validasi', async () => {
    const patchRes = await fetch(`${baseUrl}/products/102/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: -1 }),
    });
    assert.equal(patchRes.status, 422);
    const json = await patchRes.json();
    assert.equal(json.errors.stok, 'Jumlah stok tidak boleh negatif');
  });

  // A10 (AC-04.3): PUT /api/products/103 ubah batas_stok_kritis menjadi 11 (stok 11)
  await t.test('A10: Menaikkan batas_stok_kritis ke 11 (stok 11) mengubah status menjadi Stok Kritis', async () => {
    const putRes = await fetch(`${baseUrl}/products/103`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nama: 'UJI-Di Atas Batas',
        kategori: 'Gula & Pemanis',
        harga: 1000,
        berat: 100,
        stok: 11,
        batas_stok_kritis: 11,
      }),
    });
    assert.equal(putRes.status, 200);

    const getRes = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const json = await getRes.json();
    const p3 = json.data.find((p) => p.id === 103);
    assert.equal(p3.batas_stok_kritis, 11);
    assert.equal(p3.status_stok, 'Stok Kritis');
  });

  // A11 (AC-04.3): PUT /api/products/103 ubah batas_stok_kritis menjadi 5 (stok 11)
  await t.test('A11: Menurunkan batas_stok_kritis ke 5 (stok 11) mengubah status menjadi Stok Aman', async () => {
    const putRes = await fetch(`${baseUrl}/products/103`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nama: 'UJI-Di Atas Batas',
        kategori: 'Gula & Pemanis',
        harga: 1000,
        berat: 100,
        stok: 11,
        batas_stok_kritis: 5,
      }),
    });
    assert.equal(putRes.status, 200);

    const getRes = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const json = await getRes.json();
    const p3 = json.data.find((p) => p.id === 103);
    assert.equal(p3.batas_stok_kritis, 5);
    assert.equal(p3.status_stok, 'Stok Aman');
  });

  // A12 (AC-04.3): PUT batas_stok_kritis tidak valid (-1 dan 'abc')
  await t.test('A12: Nilai batas_stok_kritis tidak valid ditolak dengan 422', async () => {
    const putNeg = await fetch(`${baseUrl}/products/103`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nama: 'UJI-Di Atas Batas',
        kategori: 'Gula & Pemanis',
        harga: 1000,
        berat: 100,
        batas_stok_kritis: -1,
      }),
    });
    assert.equal(putNeg.status, 422);

    const putStr = await fetch(`${baseUrl}/products/103`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nama: 'UJI-Di Atas Batas',
        kategori: 'Gula & Pemanis',
        harga: 1000,
        berat: 100,
        batas_stok_kritis: 'abc',
      }),
    });
    assert.equal(putStr.status, 422);
  });

  // A13 (AC-04.3): PUT /api/products/103 tanpa batas_stok_kritis -> batas lama dipertahankan
  await t.test('A13: PUT tanpa field batas_stok_kritis mempertahankan batas lama', async () => {
    const putRes = await fetch(`${baseUrl}/products/103`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        nama: 'UJI-Di Atas Batas (Updated)',
        kategori: 'Gula & Pemanis',
        harga: 1200,
        berat: 100,
      }),
    });
    assert.equal(putRes.status, 200);
    const json = await putRes.json();
    assert.equal(json.data.batas_stok_kritis, 5);
  });

  // A14 (AC-01.1, K-03): Cek P1 dibuat dengan batas default 5, stok 6 -> Stok Aman
  await t.test('A14: Batas default adalah 5, stok 6 menghasilkan Stok Aman', async () => {
    const getRes = await fetch(`${baseUrl}/stock`, { headers: adminHeaders });
    const json = await getRes.json();
    const p1 = json.data.find((p) => p.id === 101);
    assert.equal(p1.batas_stok_kritis, 5);
    assert.equal(p1.stok, 6);
    assert.equal(p1.status_stok, 'Stok Aman');
  });

  // A15 (AC-04.1, K-03): PATCH P1 stok 5 (batas bawaan 5) -> Stok Kritis
  await t.test('A15: PATCH stok 5 pada produk berbatas bawaan 5 menghasilkan Stok Kritis', async () => {
    const patchRes = await fetch(`${baseUrl}/products/101/stock`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ stok: 5 }),
    });
    assert.equal(patchRes.status, 200);
    const json = await patchRes.json();
    assert.equal(json.data.status_stok, 'Stok Kritis');
  });

  // A16 (Hak akses): GET /api/stock?kritis=true dengan token pegawai -> 200
  await t.test('A16: Pegawai berhak mengakses GET /api/stock?kritis=true', async () => {
    const res = await fetch(`${baseUrl}/stock?kritis=true`, { headers: pegawaiHeaders });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
  });

  // A17 (Hak akses): PATCH stok oleh pegawai -> 403 saat menambah stok
  await t.test('A17: Pegawai ditolak (403) saat mencoba menambah stok', async () => {
    const patchRes = await fetch(`${baseUrl}/products/101/stock`, {
      method: 'PATCH',
      headers: pegawaiHeaders,
      body: JSON.stringify({ stok: 50 }),
    });
    assert.equal(patchRes.status, 403);
  });

  // A18 (Hak akses): GET /api/stock tanpa token -> 401
  await t.test('A18: Request tanpa token ke GET /api/stock ditolak dengan status 401', async () => {
    const res = await fetch(`${baseUrl}/stock`);
    assert.equal(res.status, 401);
  });
});
