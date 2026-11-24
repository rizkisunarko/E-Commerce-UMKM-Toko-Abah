const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET);
}

async function createFixture(t, initialData = {}) {
  const accounts = [
    { id: 1, username: 'admin', nama: 'Admin Toko', role: 'admin' },
    { id: 2, username: 'pegawai', nama: 'Pegawai Toko', role: 'pegawai', status: 'aktif' },
  ];

  const products = initialData.products || [
    {
      id_produk: 1,
      nama_produk: 'Beras 5 kg',
      harga_jual: '68000.00',
      jumlah_stok: 10,
      satuan: '5 kg',
      archived_at: null,
    },
    {
      id_produk: 2,
      nama_produk: 'Minyak Goreng 1 L',
      harga_jual: '18000.00',
      jumlah_stok: 20,
      satuan: '1000 g',
      archived_at: null,
    },
  ];

  const orders = initialData.orders || [
    {
      id_transaksi: 1,
      kode_transaksi: 'TA-20261126-0001',
      jenis_transaksi: 'online',
      nama_pelanggan: 'Budi Santoso',
      no_telepon: '081234567890',
      alamat_pelanggan: 'Jl. Merdeka No. 10',
      metode_penerimaan: 'kurir',
      subtotal_produk: '68000.00',
      ongkos_kirim: '10000.00',
      total_bayar: '78000.00',
      status_transaksi: 'dibayar',
      catatan: 'Tolong packing rapi',
      tanggal_transaksi: new Date('2026-11-26T03:10:00.000Z'),
    },
    {
      id_transaksi: 2,
      kode_transaksi: 'TA-20261126-0002',
      jenis_transaksi: 'online',
      nama_pelanggan: 'Siti Aminah',
      no_telepon: '081234567891',
      alamat_pelanggan: '',
      metode_penerimaan: 'pickup',
      subtotal_produk: '36000.00',
      ongkos_kirim: '0.00',
      total_bayar: '36000.00',
      status_transaksi: 'menunggu',
      catatan: '',
      tanggal_transaksi: new Date('2026-11-26T04:20:00.000Z'),
    },
    {
      id_transaksi: 3,
      kode_transaksi: 'TA-20261126-0003',
      jenis_transaksi: 'online',
      nama_pelanggan: 'Ahmad Dahlan',
      no_telepon: '081234567892',
      alamat_pelanggan: 'Jl. Sudirman No. 5',
      metode_penerimaan: 'kurir',
      subtotal_produk: '18000.00',
      ongkos_kirim: '9000.00',
      total_bayar: '27000.00',
      status_transaksi: 'diproses',
      catatan: '',
      tanggal_transaksi: new Date('2026-11-26T05:30:00.000Z'),
    },
  ];

  const payments = initialData.payments || [
    {
      id_pembayaran: 1,
      id_transaksi: 1,
      metode_pembayaran: 'payment_gateway',
      jumlah_bayar: '78000.00',
      status_pembayaran: 'berhasil',
    },
    {
      id_pembayaran: 2,
      id_transaksi: 2,
      metode_pembayaran: 'payment_gateway',
      jumlah_bayar: '36000.00',
      status_pembayaran: 'menunggu',
    },
    {
      id_pembayaran: 3,
      id_transaksi: 3,
      metode_pembayaran: 'payment_gateway',
      jumlah_bayar: '27000.00',
      status_pembayaran: 'berhasil',
    },
  ];

  const details = initialData.details || [
    {
      id_detail_transaksi: 1,
      id_transaksi: 1,
      id_produk: 1,
      nama: 'Beras 5 kg',
      kategori: 'Beras & Tepung',
      jumlah: 1,
      harga_satuan: '68000.00',
      subtotal: '68000.00',
    },
    {
      id_detail_transaksi: 2,
      id_transaksi: 2,
      id_produk: 2,
      nama: 'Minyak Goreng 1 L',
      kategori: 'Minyak & Bumbu',
      jumlah: 2,
      harga_satuan: '18000.00',
      subtotal: '36000.00',
    },
    {
      id_detail_transaksi: 3,
      id_transaksi: 3,
      id_produk: 2,
      nama: 'Minyak Goreng 1 L',
      kategori: 'Minyak & Bumbu',
      jumlah: 1,
      harga_satuan: '18000.00',
      subtotal: '18000.00',
    },
  ];

  const shipments = initialData.shipments || [
    {
      id_transaksi: 1,
      alamat_tujuan: 'Jl. Merdeka No. 10',
      wilayah_tujuan: 'Bandung',
      layanan_kurir: 'JNE REG',
      ongkos_kirim: '10000.00',
    },
    {
      id_transaksi: 3,
      alamat_tujuan: 'Jl. Sudirman No. 5',
      wilayah_tujuan: 'Bandung',
      layanan_kurir: 'J&T EZ',
      ongkos_kirim: '9000.00',
    },
  ];

  const stockHistory = [];

  const db = {
    async query(sql, params = []) {
      // Auth lookups
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

      // COUNT query for GET /orders
      if (sql.includes('COUNT(DISTINCT t.id_transaksi) AS total')) {
        let filtered = orders.filter((o) => o.jenis_transaksi === 'online');
        // Match status conditions
        if (sql.includes("t.status_transaksi = 'dibayar'")) {
          filtered = filtered.filter((o) => {
            const pay = payments.find((p) => p.id_transaksi === o.id_transaksi);
            return o.status_transaksi === 'dibayar' || (o.status_transaksi === 'menunggu' && pay?.status_pembayaran === 'berhasil');
          });
        } else if (sql.includes("t.status_transaksi = 'menunggu'")) {
          filtered = filtered.filter((o) => {
            const pay = payments.find((p) => p.id_transaksi === o.id_transaksi);
            return o.status_transaksi === 'menunggu' && pay?.status_pembayaran !== 'berhasil';
          });
        } else if (sql.includes("t.status_transaksi = 'diproses'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'diproses');
        } else if (sql.includes("t.status_transaksi = 'selesai'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'selesai');
        } else if (sql.includes("t.status_transaksi = 'batal'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'batal');
        } else if (sql.includes("t.status_transaksi IN ('siap_diambil'")) {
          filtered = filtered.filter((o) => ['siap_diambil', 'siap_dikirim', 'siap_diambil_dikirim'].includes(o.status_transaksi));
        }

        if (sql.includes('t.kode_transaksi LIKE ? OR t.nama_pelanggan LIKE ?')) {
          const term = String(params[0] || '').replace(/%/g, '').toLowerCase();
          filtered = filtered.filter(
            (o) => o.kode_transaksi.toLowerCase().includes(term) || o.nama_pelanggan.toLowerCase().includes(term),
          );
        }

        return [[{ total: filtered.length }], []];
      }

      // SELECT single order FOR UPDATE in PATCH /orders/:nomor/status
      if (sql.includes('WHERE t.kode_transaksi = ?') && sql.includes('FOR UPDATE')) {
        const order = orders.find((o) => o.kode_transaksi === params[0] && o.jenis_transaksi === 'online');
        if (!order) return [[], []];
        const pay = payments.find((p) => p.id_transaksi === order.id_transaksi);
        const ship = shipments.find((s) => s.id_transaksi === order.id_transaksi);
        return [[{
          id: order.id_transaksi,
          nomor_pesanan: order.kode_transaksi,
          status: order.status_transaksi,
          tanggal: order.tanggal_transaksi,
          nama_pemesan: order.nama_pelanggan,
          no_hp: order.no_telepon,
          catatan: order.catatan,
          metode_penerimaan: order.metode_penerimaan,
          alamat_lengkap: order.alamat_pelanggan,
          subtotal: order.subtotal_produk,
          ongkir: order.ongkos_kirim,
          total: order.total_bayar,
          wilayah: ship?.wilayah_tujuan || '',
          layanan_kurir: ship?.layanan_kurir || null,
          status_pembayaran: pay?.status_pembayaran || null,
          metode_pembayaran: pay?.metode_pembayaran || 'payment_gateway',
        }], []];
      }

      // SELECT single order for GET /orders/:nomor
      if (sql.includes('WHERE t.kode_transaksi = ?') && !sql.includes('LIMIT ? OFFSET ?')) {
        const order = orders.find((o) => o.kode_transaksi === params[0] && o.jenis_transaksi === 'online');
        if (!order) return [[], []];
        const pay = payments.find((p) => p.id_transaksi === order.id_transaksi);
        const ship = shipments.find((s) => s.id_transaksi === order.id_transaksi);
        return [[{
          id: order.id_transaksi,
          nomor_pesanan: order.kode_transaksi,
          status: order.status_transaksi,
          tanggal: order.tanggal_transaksi,
          nama_pemesan: order.nama_pelanggan,
          no_hp: order.no_telepon,
          catatan: order.catatan,
          metode_penerimaan: order.metode_penerimaan,
          alamat_lengkap: order.alamat_pelanggan,
          subtotal: order.subtotal_produk,
          ongkir: order.ongkos_kirim,
          total: order.total_bayar,
          wilayah: ship?.wilayah_tujuan || '',
          layanan_kurir: ship?.layanan_kurir || null,
          status_pembayaran: pay?.status_pembayaran || null,
          metode_pembayaran: pay?.metode_pembayaran || 'payment_gateway',
        }], []];
      }

      // SELECT list query for GET /orders (with LIMIT and OFFSET)
      if (sql.includes('LIMIT ? OFFSET ?')) {
        let filtered = orders.filter((o) => o.jenis_transaksi === 'online');
        if (sql.includes("t.status_transaksi = 'dibayar'")) {
          filtered = filtered.filter((o) => {
            const pay = payments.find((p) => p.id_transaksi === o.id_transaksi);
            return o.status_transaksi === 'dibayar' || (o.status_transaksi === 'menunggu' && pay?.status_pembayaran === 'berhasil');
          });
        } else if (sql.includes("t.status_transaksi = 'menunggu'")) {
          filtered = filtered.filter((o) => {
            const pay = payments.find((p) => p.id_transaksi === o.id_transaksi);
            return o.status_transaksi === 'menunggu' && pay?.status_pembayaran !== 'berhasil';
          });
        } else if (sql.includes("t.status_transaksi = 'diproses'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'diproses');
        } else if (sql.includes("t.status_transaksi = 'selesai'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'selesai');
        } else if (sql.includes("t.status_transaksi = 'batal'")) {
          filtered = filtered.filter((o) => o.status_transaksi === 'batal');
        } else if (sql.includes("t.status_transaksi IN ('siap_diambil'")) {
          filtered = filtered.filter((o) => ['siap_diambil', 'siap_dikirim', 'siap_diambil_dikirim'].includes(o.status_transaksi));
        }

        if (sql.includes('t.kode_transaksi LIKE ? OR t.nama_pelanggan LIKE ?')) {
          const term = String(params[0] || '').replace(/%/g, '').toLowerCase();
          filtered = filtered.filter(
            (o) => o.kode_transaksi.toLowerCase().includes(term) || o.nama_pelanggan.toLowerCase().includes(term),
          );
        }

        filtered.sort((a, b) => b.tanggal_transaksi - a.tanggal_transaksi || b.id_transaksi - a.id_transaksi);
        const limit = params.at(-2) ?? 20;
        const offset = params.at(-1) ?? 0;
        const paged = filtered.slice(offset, offset + limit);

        const rows = paged.map((o) => {
          const pay = payments.find((p) => p.id_transaksi === o.id_transaksi);
          return {
            id: o.id_transaksi,
            nomor_pesanan: o.kode_transaksi,
            nama_pemesan: o.nama_pelanggan,
            tanggal: o.tanggal_transaksi,
            total: o.total_bayar,
            metode_penerimaan: o.metode_penerimaan,
            status_transaksi: o.status_transaksi,
            status_pembayaran: pay?.status_pembayaran || null,
          };
        });
        return [rows, []];
      }

      // SELECT detail items
      if (sql.includes('FROM detail_transaksi dt') || sql.includes('FROM detail_transaksi WHERE id_transaksi = ?')) {
        const idTransaksi = params[0];
        const items = details.filter((d) => d.id_transaksi === idTransaksi);
        return [items.map((i) => ({
          id_produk: i.id_produk,
          product_id: i.id_produk,
          nama: i.nama,
          kategori: i.kategori,
          harga_satuan: i.harga_satuan,
          harga: i.harga_satuan,
          jumlah: i.jumlah,
          subtotal: i.subtotal,
        })), []];
      }

      // UPDATE status on transaksi
      if (sql.startsWith('UPDATE transaksi SET status_transaksi = ? WHERE id_transaksi = ?')) {
        const order = orders.find((o) => o.id_transaksi === params[1]);
        if (order) order.status_transaksi = params[0];
        return [{ affectedRows: order ? 1 : 0 }, []];
      }

      // Product query FOR UPDATE
      if (sql.includes('FROM produk WHERE id_produk = ? FOR UPDATE')) {
        const prod = products.find((p) => p.id_produk === params[0]);
        return [prod ? [{ ...prod }] : [], []];
      }

      // UPDATE produk stock
      if (sql.startsWith('UPDATE produk') && sql.includes('jumlah_stok = ?')) {
        const prod = products.find((p) => p.id_produk === params[1]);
        if (prod) prod.jumlah_stok = params[0];
        return [{ affectedRows: prod ? 1 : 0 }, []];
      }

      // INSERT riwayat_stok
      if (sql.includes('INSERT INTO riwayat_stok')) {
        stockHistory.push({
          id_produk: params[0],
          id_admin: params[1],
          jenis_perubahan: 'masuk',
          jumlah: params[2],
          stok_sebelum: params[3],
          stok_sesudah: params[4],
          keterangan: params[5],
        });
        return [{ insertId: stockHistory.length }, []];
      }

      throw new Error(`Unhandled test query: ${sql}`);
    },
  };

  db.getConnection = async () => ({
    query: db.query.bind(db),
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
  });

  const app = createApp({ db, jwtSecret: JWT_SECRET });
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const adminToken = createToken({ sub: 1, role: 'admin' });
  const pegawaiToken = createToken({ sub: 2, role: 'pegawai' });

  return { baseUrl, adminToken, pegawaiToken, orders, products, stockHistory };
}

// B1: GET /orders tanpa token -> 401
test('B1: GET /orders tanpa token mengembalikan 401', async (t) => {
  const { baseUrl } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders`);
  assert.equal(res.status, 401);
});

// B2: GET /orders?status=Dibayar sebagai pegawai -> Hanya pesanan Dibayar, ada meta
test('B2: GET /orders?status=Dibayar sebagai pegawai mengembalikan pesanan Dibayar dan meta', async (t) => {
  const { baseUrl, pegawaiToken } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders?status=Dibayar`, {
    headers: { Authorization: `Bearer ${pegawaiToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(Array.isArray(body.data), true);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].nomor_pesanan, 'TA-20261126-0001');
  assert.equal(body.data[0].status, 'Dibayar');
  assert.equal(body.data[0].status_pembayaran, 'dibayar');
  assert.equal(body.meta.page, 1);
  assert.equal(body.meta.limit, 20);
  assert.equal(body.meta.total, 1);
});

// B3: GET /orders?status=ngawur -> 422
test('B3: GET /orders?status=ngawur mengembalikan 422', async (t) => {
  const { baseUrl, pegawaiToken } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders?status=ngawur`, {
    headers: { Authorization: `Bearer ${pegawaiToken}` },
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.errors?.status !== undefined, true);
});

// B4: Ubah pesanan Menunggu Pembayaran ke Diproses -> 422 "Pesanan belum dibayar"
test('B4: Ubah pesanan Menunggu Pembayaran ke Diproses mengembalikan 422 "Pesanan belum dibayar"', async (t) => {
  const { baseUrl, pegawaiToken } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders/TA-20261126-0002/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ status: 'Diproses' }),
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.message, 'Pesanan belum dibayar');
});

// B5: Dibayar ke Diproses ke Siap Diambil/Dikirim sebagai pegawai -> 200 tiap langkah
test('B5: Dibayar ke Diproses ke Siap Diambil/Dikirim sebagai pegawai mengembalikan 200 tiap langkah', async (t) => {
  const { baseUrl, pegawaiToken, orders } = await createFixture(t);

  // 1. Dibayar -> Diproses
  const res1 = await fetch(`${baseUrl}/orders/TA-20261126-0001/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ status: 'Diproses' }),
  });
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.data.status, 'Diproses');
  assert.equal(orders[0].status_transaksi, 'diproses');

  // 2. Diproses -> Siap Diambil/Dikirim (metode kurir -> Siap Dikirim)
  const res2 = await fetch(`${baseUrl}/orders/TA-20261126-0001/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ status: 'Siap Diambil/Dikirim' }),
  });
  assert.equal(res2.status, 200);
  const body2 = await res2.json();
  assert.equal(body2.data.status, 'Siap Dikirim');
  assert.equal(orders[0].status_transaksi, 'siap_dikirim');
});

// B6: Pegawai ke Selesai atau Dibatalkan -> 403
test('B6: Pegawai ke Selesai atau Dibatalkan mengembalikan 403', async (t) => {
  const { baseUrl, pegawaiToken } = await createFixture(t);

  const resSelesai = await fetch(`${baseUrl}/orders/TA-20261126-0003/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ status: 'Selesai' }),
  });
  assert.equal(resSelesai.status, 403);

  const resBatal = await fetch(`${baseUrl}/orders/TA-20261126-0003/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pegawaiToken}`,
    },
    body: JSON.stringify({ status: 'Dibatalkan' }),
  });
  assert.equal(resBatal.status, 403);
});

// B7: Admin ke Selesai, lalu Selesai ke Diproses -> 200, lalu 422
test('B7: Admin ke Selesai 200, lalu Selesai ke Diproses mengembalikan 422', async (t) => {
  const { baseUrl, adminToken, orders } = await createFixture(t);
  // Set order 3 to siap_dikirim first so Selesai transition is valid
  orders[2].status_transaksi = 'siap_dikirim';

  const res1 = await fetch(`${baseUrl}/orders/TA-20261126-0003/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Selesai' }),
  });
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.data.status, 'Selesai');

  // Attempt transition from Selesai to Diproses -> 422
  const res2 = await fetch(`${baseUrl}/orders/TA-20261126-0003/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Diproses' }),
  });
  assert.equal(res2.status, 422);
});

// B8: Admin batalkan pesanan Dibayar -> Status Dibatalkan, stok kembali
test('B8: Admin batalkan pesanan Dibayar memulihkan stok dan mengubah status ke Dibatalkan', async (t) => {
  const { baseUrl, adminToken, products, stockHistory } = await createFixture(t);
  assert.equal(products[0].jumlah_stok, 10);

  const res = await fetch(`${baseUrl}/orders/TA-20261126-0001/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Dibatalkan' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.status, 'Dibatalkan');

  // Check that stock was returned: 10 + 1 = 11
  assert.equal(products[0].jumlah_stok, 11);
  assert.equal(stockHistory.length, 1);
  assert.equal(stockHistory[0].jenis_perubahan, 'masuk');
  assert.equal(stockHistory[0].jumlah, 1);
});

// B9: Nomor pesanan tidak ada -> 404
test('B9: Nomor pesanan tidak ditemukan mengembalikan 404', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders/TA-NONEXISTENT/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Diproses' }),
  });
  assert.equal(res.status, 404);
});

// Extra: Search & pagination
test('GET /orders mendukung pencarian nomor/nama dan paginasi', async (t) => {
  const { baseUrl, adminToken } = await createFixture(t);

  const resSearch = await fetch(`${baseUrl}/orders?search=Siti`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(resSearch.status, 200);
  const bodySearch = await resSearch.json();
  assert.equal(bodySearch.data.length, 1);
  assert.equal(bodySearch.data[0].nama_pemesan, 'Siti Aminah');

  const resPaging = await fetch(`${baseUrl}/orders?page=1&limit=2`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(resPaging.status, 200);
  const bodyPaging = await resPaging.json();
  assert.equal(bodyPaging.data.length, 2);
  assert.equal(bodyPaging.meta.limit, 2);
  assert.equal(bodyPaging.meta.total, 3);
});

// Extra: GET /orders/:nomor remains public
test('GET /orders/:nomor tetap publik tanpa token', async (t) => {
  const { baseUrl } = await createFixture(t);
  const res = await fetch(`${baseUrl}/orders/TA-20261126-0001`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.nomor_pesanan, 'TA-20261126-0001');
});
