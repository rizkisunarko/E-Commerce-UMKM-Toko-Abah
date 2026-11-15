const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createFixture(t) {
  const accounts = [
    { id: 1, nama: 'Admin Toko', role: 'admin' },
    { id: 2, nama: 'Pegawai Toko', role: 'pegawai' },
  ];
  const state = {
    products: [{
      id_produk: 20,
      nama_produk: 'Beras 5 kg',
      harga_jual: '68000.00',
      jumlah_stok: 5,
      archived_at: null,
    }],
    transactions: [],
    details: [],
    payments: [],
    stockHistory: [],
    nextTransactionId: 1,
  };
  let snapshot;

  async function query(sql, params = []) {
    if (sql.includes('FROM admin WHERE id_admin')) {
      const account = accounts.find((item) => item.role === 'admin' && item.id === params[0]);
      return [account ? [{ id: account.id, nama: account.nama }] : [], []];
    }
    if (sql.includes('FROM pegawai WHERE id_pegawai')) {
      const account = accounts.find((item) => item.role === 'pegawai' && item.id === params[0]);
      return [account ? [{ id: account.id, nama: account.nama }] : [], []];
    }
    if (sql.includes('FROM produk WHERE id_produk = ? FOR UPDATE')) {
      const product = state.products.find((item) => item.id_produk === params[0]);
      return [product ? [{ ...product }] : [], []];
    }
    if (sql.startsWith('INSERT INTO transaksi')) {
      const transaction = {
        id_transaksi: state.nextTransactionId++,
        id_admin: params[0],
        kode_transaksi: params[1],
        jenis_transaksi: 'kasir',
        total_bayar: params[3],
        tanggal_transaksi: new Date(),
      };
      state.transactions.push(transaction);
      return [{ insertId: transaction.id_transaksi }, []];
    }
    if (sql.trimStart().startsWith('UPDATE produk')) {
      const product = state.products.find((item) => item.id_produk === params[2]);
      if (product) product.jumlah_stok = params[0];
      return [{ affectedRows: product ? 1 : 0 }, []];
    }
    if (sql.includes('INSERT INTO detail_transaksi')) {
      state.details.push({
        id_transaksi: params[0],
        id_produk: params[1],
        jumlah: params[2],
        harga_satuan: params[3],
        subtotal: params[4],
      });
      return [{ insertId: state.details.length }, []];
    }
    if (sql.includes('INSERT INTO riwayat_stok')) {
      state.stockHistory.push(params);
      return [{ insertId: state.stockHistory.length }, []];
    }
    if (sql.includes('INSERT INTO pembayaran')) {
      state.payments.push({
        id_transaksi: params[0],
        metode_pembayaran: params[1],
        jumlah_bayar: params[2],
        jumlah_diterima: params[3],
        kembalian: params[4],
      });
      return [{ insertId: state.payments.length }, []];
    }
    if (sql.includes('SELECT t.id_transaksi AS id') && sql.includes('WHERE t.id_transaksi = ?')) {
      const transaction = state.transactions.find((item) => item.id_transaksi === params[0]);
      if (!transaction) return [[], []];
      const payment = state.payments.find((item) => item.id_transaksi === transaction.id_transaksi);
      return [[{
        id: transaction.id_transaksi,
        tanggal: transaction.tanggal_transaksi,
        metode_bayar: payment && payment.metode_pembayaran,
        total: transaction.total_bayar,
        jumlah_diterima: payment && payment.jumlah_diterima,
        kembalian: payment && payment.kembalian,
      }], []];
    }
    if (sql.includes('FROM detail_transaksi dt') && sql.includes('ORDER BY dt.id_detail_transaksi')) {
      return [state.details
        .filter((item) => item.id_transaksi === params[0])
        .map((item) => {
          const product = state.products.find((row) => row.id_produk === item.id_produk);
          return {
            product_id: item.id_produk,
            nama: product.nama_produk,
            harga: item.harga_satuan,
            jumlah: item.jumlah,
            subtotal: item.subtotal,
          };
        }), []];
    }
    if (sql.includes('SELECT t.id_transaksi AS id')) {
      return [state.transactions.map((transaction) => {
        const payment = state.payments.find((item) => item.id_transaksi === transaction.id_transaksi);
        const items = state.details.filter((item) => item.id_transaksi === transaction.id_transaksi);
        return {
          id: transaction.id_transaksi,
          tanggal: transaction.tanggal_transaksi,
          metode_bayar: payment && payment.metode_pembayaran,
          total: transaction.total_bayar,
          jumlah_item: items.reduce((sum, item) => sum + Number(item.jumlah), 0),
        };
      }), []];
    }
    if (sql.includes('COUNT(DISTINCT t.id_transaksi)')) {
      const paid = state.transactions.map((transaction) => ({
        transaction,
        payment: state.payments.find((item) => item.id_transaksi === transaction.id_transaksi),
      }));
      const sumMethod = (method) => paid
        .filter(({ payment }) => payment && payment.metode_pembayaran === method)
        .reduce((sum, { payment }) => sum + Number(payment.jumlah_bayar), 0);
      return [[{
        tunai: sumMethod('tunai'),
        qris: sumMethod('QRIS'),
        debit: sumMethod('debit'),
        total: paid.reduce((sum, { payment }) => sum + Number(payment?.jumlah_bayar || 0), 0),
        jumlah_transaksi: paid.length,
      }], []];
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
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const tokenFor = (account) => jwt.sign(
    { nama: account.nama, role: account.role },
    JWT_SECRET,
    { subject: String(account.id), expiresIn: '1h' },
  );
  return { baseUrl, tokenFor, state };
}

test('kasir menyimpan transaksi debit dan mengurangi stok dalam satu proses', async (t) => {
  const { baseUrl, tokenFor, state } = await createFixture(t);
  const pegawaiToken = tokenFor({ id: 2, nama: 'Pegawai Toko', role: 'pegawai' });
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({
      metode_bayar: 'debit',
      items: [
        { product_id: 20, jumlah: 1 },
        { product_id: 20, jumlah: 1 },
      ],
    }),
  });

  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.deepEqual(data.items, [{
    product_id: 20,
    nama: 'Beras 5 kg',
    harga: 68000,
    jumlah: 2,
    subtotal: 136000,
  }]);
  assert.equal(data.total, 136000);
  assert.equal(data.metode_bayar, 'debit');
  assert.equal(state.products[0].jumlah_stok, 3);
  assert.equal(state.transactions.length, 1);
  assert.equal(state.details.length, 1);
  assert.equal(state.payments[0].metode_pembayaran, 'debit');
  assert.equal(state.payments[0].jumlah_diterima, null);
  assert.equal(state.stockHistory.length, 1);
});

test('pembayaran tunai menghitung dan menyimpan kembalian', async (t) => {
  const { baseUrl, tokenFor, state } = await createFixture(t);
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor({ id: 1, nama: 'Admin Toko', role: 'admin' })}`,
    },
    body: JSON.stringify({
      metode_bayar: 'tunai',
      jumlah_diterima: 100000,
      items: [{ product_id: 20, jumlah: 1 }],
    }),
  });

  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.equal(data.total, 68000);
  assert.equal(data.jumlah_diterima, 100000);
  assert.equal(data.kembalian, 32000);
  assert.equal(state.payments[0].jumlah_diterima, '100000.00');
  assert.equal(state.payments[0].kembalian, '32000.00');
});

test('pembayaran tunai ditolak jika uang diterima kurang dari total', async (t) => {
  const { baseUrl, tokenFor, state } = await createFixture(t);
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor({ id: 1, nama: 'Admin Toko', role: 'admin' })}`,
    },
    body: JSON.stringify({
      metode_bayar: 'tunai',
      jumlah_diterima: 60000,
      items: [{ product_id: 20, jumlah: 1 }],
    }),
  });

  assert.equal(response.status, 422);
  assert.match((await response.json()).errors.jumlah_diterima, /minimal sebesar total/);
  assert.equal(state.products[0].jumlah_stok, 5);
  assert.equal(state.transactions.length, 0);
  assert.equal(state.payments.length, 0);
});

test('transaksi gagal tanpa mengubah stok saat jumlah melebihi stok tersedia', async (t) => {
  const { baseUrl, tokenFor, state } = await createFixture(t);
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenFor({ id: 1, nama: 'Admin Toko', role: 'admin' })}`,
    },
    body: JSON.stringify({
      metode_bayar: 'tunai',
      items: [{ product_id: 20, jumlah: 6 }],
    }),
  });

  assert.equal(response.status, 422);
  assert.match((await response.json()).errors['items.20'], /Stok tidak mencukupi/);
  assert.equal(state.products[0].jumlah_stok, 5);
  assert.equal(state.transactions.length, 0);
  assert.equal(state.payments.length, 0);
});

test('riwayat admin menerima daftar, detail, dan rekap transaksi dengan metode konsisten', async (t) => {
  const { baseUrl, tokenFor } = await createFixture(t);
  const adminToken = tokenFor({ id: 1, nama: 'Admin Toko', role: 'admin' });
  const headers = { Authorization: `Bearer ${adminToken}` };
  const created = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metode_bayar: 'qris',
      items: [{ product_id: 20, jumlah: 1 }],
    }),
  });
  assert.equal(created.status, 201);
  const { data: createdData } = await created.json();

  const listResponse = await fetch(`${baseUrl}/transactions`, { headers });
  const list = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(list.data[0].metode_bayar, 'qris');
  assert.equal(list.data[0].total, 68000);
  assert.equal(list.data[0].jumlah_item, 1);

  const detailResponse = await fetch(`${baseUrl}/transactions/${createdData.id}`, { headers });
  const detail = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.equal(detail.data.metode_bayar, 'qris');
  assert.equal(detail.data.jumlah_diterima, 68000);
  assert.equal(detail.data.kembalian, 0);
  assert.equal(detail.data.items[0].nama, 'Beras 5 kg');

  const rekapResponse = await fetch(`${baseUrl}/transactions/rekap?tanggal=2026-11-15`, { headers });
  const rekap = await rekapResponse.json();
  assert.equal(rekapResponse.status, 200);
  assert.equal(rekap.data.qris, 68000);
  assert.equal(rekap.data.total, 68000);
  assert.equal(rekap.data.jumlah_transaksi, 1);
});
