const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createFixture(t) {
  const accounts = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin-pass', 4), nama: 'admin', role: 'admin' },
    { id: 2, username: 'pegawai', password: bcrypt.hashSync('employee-pass', 4), nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
    { id: 3, username: 'nonaktif', password: bcrypt.hashSync('inactive-pass', 4), nama: 'Pegawai Nonaktif', role: 'pegawai', status: 'nonaktif' },
  ];
  const transactions = new Map([
    [10, {
      id_transaksi: 10,
      kode_transaksi: 'TRX-10',
      status_transaksi: 'menunggu',
      jenis_transaksi: 'online',
    }],
  ]);
  const products = [
    {
      id: 20,
      nama: 'Beras 5 kg',
      kategori: 'Beras & Tepung',
      harga: '68000.00',
      harga_beli: '50000.00',
      satuan: 'karung',
      stok: '4.000',
      batas_stok_kritis: '10.000',
      status_stok: 'Stok Kritis',
    },
  ];
  const stockHistory = [];
  const db = {
    async query(sql, params) {
      if (sql.includes('UNION ALL')) {
        return [accounts.filter((account) => params.includes(account.username)), []];
      }
      if (sql.includes('SELECT nama_kategori FROM kategori')) {
        return [[{ nama_kategori: 'Beras & Tepung' }], []];
      }
      if (sql.includes('FROM admin WHERE id_admin')) {
        const account = accounts.find((item) => item.role === 'admin' && item.id === params[0]);
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }
      if (sql.includes('FROM pegawai WHERE id_pegawai')) {
        const account = accounts.find(
          (item) => item.role === 'pegawai' && item.id === params[0] && item.status === 'aktif',
        );
        return [account ? [{ id: account.id, nama: account.nama }] : [], []];
      }
      if (sql.includes('COUNT(*) AS stok_kritis')) {
        return [[{ stok_kritis: products.filter(
          (product) => Number(product.stok) <= Number(product.batas_stok_kritis),
        ).length }], []];
      }
      if (sql.includes('FROM produk p')) {
        if (sql.includes('WHERE p.id_produk = ?')) {
          return [products.filter((product) => product.id === params[0]), []];
        }
        let rows = sql.includes('p.archived_at IS NULL')
          ? products.filter((product) => !product.archived_at)
          : [...products];
        if (sql.includes('p.nama_produk LIKE ?')) {
          const search = params.find((param) => typeof param === 'string' && param.startsWith('%'))
            .slice(1, -1).toLowerCase();
          rows = rows.filter((product) => product.nama.toLowerCase().includes(search));
        }
        if (sql.includes('k.nama_kategori = ?')) {
          const category = params.find((param) => param === 'Beras & Tepung');
          rows = rows.filter((product) => product.kategori === category);
        }
        if (sql.includes('COUNT(*) AS total')) return [[{ total: rows.length }], []];
        if (!sql.includes('LIMIT ? OFFSET ?')) return [rows, []];
        const limit = params.at(-2);
        const offset = params.at(-1);
        return [rows.slice(offset, offset + limit), []];
      }
      if (sql.includes('SELECT jumlah_stok FROM produk WHERE id_produk = ?')) {
        const product = products.find((item) => item.id === params[0]);
        return [product && !product.archived_at ? [{ jumlah_stok: product.stok }] : [], []];
      }
      if (sql.trimStart().startsWith('UPDATE produk')) {
        const product = products.find((item) => item.id === params[2]);
        if (product) product.stok = String(params[0]);
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
        return [{ insertId: stockHistory.length }, []];
      }
      if (sql.startsWith('UPDATE transaksi')) {
        const transaction = transactions.get(params[1]);
        if (transaction) transaction.status_transaksi = params[0];
        return [{ affectedRows: transaction ? 1 : 0 }, []];
      }
      if (sql.includes('FROM transaksi WHERE id_transaksi')) {
        const transaction = transactions.get(params[0]);
        return [transaction ? [transaction] : [], []];
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

async function login(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return { response, body: await response.json() };
}

async function updateStatus(baseUrl, token, id, status) {
  return fetch(`${baseUrl}/transactions/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
}

test('login menghasilkan sesi, menolak kredensial salah dan pegawai nonaktif', async (t) => {
  const baseUrl = await createFixture(t);
  const { response, body } = await login(baseUrl, 'pegawai', 'employee-pass');
  assert.equal(response.status, 200);
  assert.deepEqual(body.user, { id: 2, nama: 'Pegawai Toko', role: 'pegawai' });

  const me = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  assert.equal(me.status, 200);
  assert.deepEqual((await me.json()).user, body.user);

  assert.equal((await login(baseUrl, 'pegawai', 'wrong-pass')).response.status, 401);
  assert.equal((await login(baseUrl, 'nonaktif', 'inactive-pass')).response.status, 401);
});

test('perubahan status online harus memakai endpoint pesanan', async (t) => {
  const baseUrl = await createFixture(t);
  const { body } = await login(baseUrl, 'pegawai', 'employee-pass');

  for (const status of ['diproses', 'siap_diambil', 'siap_dikirim']) {
    const response = await updateStatus(baseUrl, body.token, 10, status);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).message,
      'Status pesanan online harus diubah melalui endpoint pesanan');
  }

  const denied = await updateStatus(baseUrl, body.token, 10, 'batal');
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { message: 'Hanya admin yang dapat membatalkan pesanan' });

  const stillUncancelled = await fetch(`${baseUrl}/transactions/10/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${body.token}`,
    },
    body: JSON.stringify({ status: 'selesai' }),
  });
  assert.equal(stillUncancelled.status, 403);
});

test('endpoint transaksi tidak dapat mengubah status online dan request tanpa token ditolak', async (t) => {
  const baseUrl = await createFixture(t);
  const { body } = await login(baseUrl, 'admin', 'admin-pass');

  const cancelled = await updateStatus(baseUrl, body.token, 10, 'batal');
  assert.equal(cancelled.status, 409);
  assert.equal((await updateStatus(baseUrl, null, 10, 'diproses')).status, 401);
});

test('pegawai dapat mengurangi stok tetapi tidak dapat menambahnya', async (t) => {
  const baseUrl = await createFixture(t);
  const { body } = await login(baseUrl, 'pegawai', 'employee-pass');
  const headers = {
    'Content-Type': 'application/json',
    [['Author', 'ization'].join('')]: [['Be', 'arer'].join(''), body.token].join(' '),
  };
  const decrease = await fetch(`${baseUrl}/products/20/stock`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ stok: 3 }),
  });
  assert.equal(decrease.status, 200);
  assert.equal((await decrease.json()).data.stok, '3');

  const increase = await fetch(`${baseUrl}/products/20/stock`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ stok: 5 }),
  });
  assert.equal(increase.status, 403);
  assert.deepEqual(await increase.json(), { message: 'Pegawai hanya dapat mengurangi stok' });
});

test('admin dapat menambah stok', async (t) => {
  const baseUrl = await createFixture(t);
  const { body } = await login(baseUrl, 'admin', 'admin-pass');
  const response = await fetch(`${baseUrl}/products/20/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      [['Author', 'ization'].join('')]: [['Be', 'arer'].join(''), body.token].join(' '),
    },
    body: JSON.stringify({ stok: 5 }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.stok, '5');

  const fractional = await fetch(`${baseUrl}/products/20/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      [['Author', 'ization'].join('')]: [['Be', 'arer'].join(''), body.token].join(' '),
    },
    body: JSON.stringify({ stok: 4.5 }),
  });
  assert.equal(fractional.status, 422);
});

test('produk dan kategori dibaca dari API backend dan memerlukan login', async (t) => {
  const baseUrl = await createFixture(t);
  const unauthenticated = await fetch(`${baseUrl}/products`);
  assert.equal(unauthenticated.status, 401);

  const { body } = await login(baseUrl, 'admin', 'admin-pass');
  const headers = { Authorization: `Bearer ${body.token}` };
  const productResponse = await fetch(`${baseUrl}/products?search=Beras`, { headers });
  assert.equal(productResponse.status, 200);
  const products = await productResponse.json();
  assert.equal(products.data[0].nama, 'Beras 5 kg');
  assert.equal(products.data[0].satuan, 'karung');
  assert.deepEqual(products.pagination, {
    page: 1,
    limit: 10,
    total: 1,
    total_pages: 1,
  });

  const filteredResponse = await fetch(
    `${baseUrl}/products?search=%20beras%20&kategori=${encodeURIComponent('Beras & Tepung')}&page=1&limit=1`,
    { headers },
  );
  const filtered = await filteredResponse.json();
  assert.equal(filteredResponse.status, 200);
  assert.equal(filtered.data.length, 1);
  assert.equal(filtered.pagination.total_pages, 1);
  assert.equal(filtered.data[0].kategori, 'Beras & Tepung');

  const emptyPageResponse = await fetch(`${baseUrl}/products?page=2&limit=1`, { headers });
  const emptyPage = await emptyPageResponse.json();
  assert.equal(emptyPageResponse.status, 200);
  assert.equal(emptyPage.data.length, 0);
  assert.equal(emptyPage.pagination.total, 1);
  assert.equal(emptyPage.pagination.total_pages, 1);

  const invalidQuery = await fetch(`${baseUrl}/products?page=0&limit=101`, { headers });
  assert.equal(invalidQuery.status, 422);
  assert.deepEqual(Object.keys((await invalidQuery.json()).errors).sort(), ['limit', 'page']);

  const repeatedSearch = await fetch(`${baseUrl}/products?search[]=beras&search[]=gula`, { headers });
  assert.equal(repeatedSearch.status, 422);
  assert.equal((await repeatedSearch.json()).errors.search, 'Pencarian harus berupa teks');

  const categoriesResponse = await fetch(`${baseUrl}/categories`, { headers });
  assert.deepEqual(await categoriesResponse.json(), { data: ['Beras & Tepung'] });

  const { body: employee } = await login(baseUrl, 'pegawai', 'employee-pass');
  const archivedResponse = await fetch(`${baseUrl}/products?include_archived=true`, {
    headers: { Authorization: `Bearer ${employee.token}` },
  });
  assert.equal(archivedResponse.status, 403);
});

test('katalog publik dapat dibaca tanpa login dan tidak membocorkan harga beli', async (t) => {
  const baseUrl = await createFixture(t);
  const catalogResponse = await fetch(`${baseUrl}/catalog?search=Beras&page=1&limit=1`);
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  assert.deepEqual(catalog.pagination, {
    page: 1,
    limit: 1,
    total: 1,
    total_pages: 1,
  });
  assert.equal(catalog.data[0].nama, 'Beras 5 kg');
  assert.equal(catalog.data[0].tersedia, true);
  assert.equal('harga_beli' in catalog.data[0], false);

  const categoriesResponse = await fetch(`${baseUrl}/catalog/categories`);
  assert.equal(categoriesResponse.status, 200);
  assert.deepEqual(await categoriesResponse.json(), { data: ['Beras & Tepung'] });

  const archivedResponse = await fetch(`${baseUrl}/catalog?include_archived=true`);
  assert.equal(archivedResponse.status, 403);
});

test('pegawai tidak melihat harga_beli pada produk dan stok, admin tetap melihat', async (t) => {
  const baseUrl = await createFixture(t);
  const { body: admin } = await login(baseUrl, 'admin', 'admin-pass');
  const { body: pegawai } = await login(baseUrl, 'pegawai', 'employee-pass');

  const adminProducts = await fetch(`${baseUrl}/products`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(adminProducts.status, 200);
  assert.equal((await adminProducts.json()).data[0].harga_beli, '50000.00');

  for (const path of ['/products', '/stock']) {
    const empRes = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${pegawai.token}` },
    });
    assert.equal(empRes.status, 200);
    const body = await empRes.json();
    assert.equal('harga_beli' in body.data[0], false);
  }
});

test('login salah lebih dari 10 kali dibatasi dengan status 429', async (t) => {
  const baseUrl = await createFixture(t);
  for (let i = 0; i < 10; i += 1) {
    const res = await login(baseUrl, 'pegawai', 'wrong-pass');
    assert.equal(res.response.status, 401);
  }
  const blocked = await login(baseUrl, 'pegawai', 'wrong-pass');
  assert.equal(blocked.response.status, 429);
});
