const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function createFixture(t, products = [{
  id_produk: 20,
  nama_produk: 'Beras 5 kg',
  nama_kategori: 'Beras & Tepung',
  harga_jual: '68000.00',
  jumlah_stok: 5,
  archived_at: null,
  satuan: '5 kg',
}]) {
  const state = {
    products: structuredClone(products),
    transactions: [],
    details: [],
    shipments: [],
    payments: [],
    stockHistory: [],
    nextTransactionId: 1,
  };
  const shippingCalls = [];
  let snapshot;

  async function query(sql, params = []) {
    if (sql.includes('FROM admin WHERE id_admin')) {
      return params[0] === 1 ? [[{ id: 1, nama: 'Admin Toko' }], []] : [[], []];
    }
    if (sql.includes('FROM pegawai WHERE id_pegawai')) {
      return params[0] === 2 ? [[{ id: 2, nama: 'Pegawai Toko' }], []] : [[], []];
    }
    if (sql.includes('SELECT id_produk, satuan')) {
      return [state.products
        .filter((product) => !product.archived_at && params.includes(product.id_produk))
        .map(({ id_produk, satuan }) => ({ id_produk, satuan })), []];
    }
    if (sql.includes('FROM produk WHERE id_produk = ? FOR UPDATE')) {
      const product = state.products.find((item) => item.id_produk === params[0]);
      return [product ? [{ ...product }] : [], []];
    }
    if (sql.startsWith('INSERT INTO transaksi')) {
      const transaction = {
        id_transaksi: state.nextTransactionId++,
        kode_transaksi: params[0],
        jenis_transaksi: 'online',
        nama_pelanggan: params[1],
        no_telepon: params[2],
        alamat_pelanggan: params[3],
        metode_penerimaan: params[4],
        subtotal_produk: params[5],
        ongkos_kirim: params[6],
        total_bayar: params[7],
        status_transaksi: 'menunggu',
        stock_reserved: 1,
        catatan: params[8],
        tanggal_transaksi: new Date(),
      };
      state.transactions.push(transaction);
      return [{ insertId: transaction.id_transaksi }, []];
    }
    if (sql.startsWith('UPDATE produk') && sql.includes('jumlah_stok = ?')) {
      const productId = params.length === 3 ? params[2] : params[1];
      const product = state.products.find((item) => item.id_produk === productId);
      if (product) {
        product.jumlah_stok = params[0];
        product.status_produk = params.length === 3 ? params[1] : 'tersedia';
      }
      return [{ affectedRows: product ? 1 : 0 }, []];
    }
    if (sql.includes('INSERT INTO riwayat_stok')) {
      const isStockOut = sql.includes("'keluar'");
      state.stockHistory.push({
        id_produk: params[0],
        jenis_perubahan: isStockOut ? 'keluar' : 'masuk',
        jumlah: params[isStockOut ? 1 : 2],
        stok_sebelum: params[isStockOut ? 2 : 3],
        stok_sesudah: params[isStockOut ? 3 : 4],
        keterangan: params[isStockOut ? 4 : 5],
      });
      return [{ insertId: state.stockHistory.length }, []];
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
    if (sql.includes('INSERT INTO pengiriman')) {
      state.shipments.push({
        id_transaksi: params[0],
        alamat_tujuan: params[1],
        wilayah_tujuan: params[2],
        layanan_kurir: params[3],
        ongkos_kirim: params[4],
      });
      return [{ insertId: state.shipments.length }, []];
    }
    if (sql.includes('INSERT INTO pembayaran')) {
      const payment = {
        id_pembayaran: state.payments.length + 1,
        id_transaksi: params[0],
        metode_pembayaran: params[1],
        jumlah_bayar: params[2],
        status_pembayaran: 'menunggu',
        kode_referensi: params[3] || null,
        snap_token: null,
      };
      state.payments.push(payment);
      return [{ insertId: payment.id_pembayaran }, []];
    }
    if (sql.includes('UPDATE pembayaran SET kode_referensi')) {
      const payment = state.payments.find((item) => item.id_pembayaran === params[1]);
      if (payment && payment.status_pembayaran === 'menunggu') {
        payment.kode_referensi = params[0];
      }
      return [{ affectedRows: payment ? 1 : 0 }, []];
    }
    if (sql.includes('UPDATE pembayaran SET snap_token')) {
      const payment = state.payments.find((item) => item.id_pembayaran === params[1]);
      if (payment && payment.status_pembayaran === 'menunggu') {
        payment.snap_token = params[0];
      }
      return [{ affectedRows: payment ? 1 : 0 }, []];
    }
    if (sql.includes("UPDATE pembayaran SET status_pembayaran = 'gagal'") &&
        sql.includes('WHERE id_pembayaran = ?')) {
      const payment = state.payments.find((item) => item.id_pembayaran === params[0]);
      if (payment && payment.status_pembayaran === 'menunggu') payment.status_pembayaran = 'gagal';
      return [{ affectedRows: payment ? 1 : 0 }, []];
    }
    if (sql.includes('FROM pembayaran p') && sql.includes('JOIN transaksi t') &&
        sql.includes('p.kode_referensi = ?')) {
      const payment = state.payments.find((item) => item.kode_referensi === params[0]);
      const transaction = state.transactions.find(
        (item) => item.id_transaksi === payment?.id_transaksi,
      );
      return [payment && transaction ? [{
        id_pembayaran: payment.id_pembayaran,
        id_transaksi: payment.id_transaksi,
        status_pembayaran: payment.status_pembayaran,
        jumlah_bayar: payment.jumlah_bayar,
        status_transaksi: transaction.status_transaksi,
        kode_transaksi: transaction.kode_transaksi,
        stock_reserved: transaction.stock_reserved,
      }] : [], []];
    }
    if (sql.includes('FROM riwayat_stok')) {
      const term = String(params[0] || '').replace(/%/g, '');
      const matches = state.stockHistory.filter(
        (item) => item.jenis_perubahan === 'keluar' && String(item.keterangan || '').includes(term),
      );
      return [matches.map((item, idx) => ({ id_riwayat: idx + 1, ...item })), []];
    }
    if (sql.includes("UPDATE transaksi SET status_transaksi = ?") &&
        sql.includes('stock_reserved = 0')) {
      const transaction = state.transactions.find((item) => item.id_transaksi === params[1]);
      if (transaction) {
        transaction.status_transaksi = params[0];
        transaction.stock_reserved = 0;
      }
      return [{ affectedRows: transaction ? 1 : 0 }, []];
    }
    if (sql.includes('UPDATE transaksi SET status_transaksi = ?')) {
      const transaction = state.transactions.find((item) => item.id_transaksi === params[1]);
      if (transaction) transaction.status_transaksi = params[0];
      return [{ affectedRows: transaction ? 1 : 0 }, []];
    }
    if (sql.includes('UPDATE pembayaran') &&
        sql.includes("metode_pembayaran = 'cod'") &&
        sql.includes("status_pembayaran = 'berhasil'")) {
      const payment = state.payments.find((item) =>
        item.id_transaksi === params[0] &&
        item.metode_pembayaran === 'cod' &&
        item.status_pembayaran === 'menunggu');
      if (payment) payment.status_pembayaran = 'berhasil';
      return [{ affectedRows: payment ? 1 : 0 }, []];
    }
    if (sql.includes("UPDATE pembayaran") &&
        sql.includes("status_pembayaran = 'berhasil'")) {
      const payment = state.payments.find((item) => item.id_pembayaran === params[0]);
      if (payment && payment.status_pembayaran === 'menunggu') {
        payment.status_pembayaran = 'berhasil';
      }
      return [{ affectedRows: payment ? 1 : 0 }, []];
    }
    if (sql.includes('UPDATE pembayaran SET status_pembayaran = \'gagal\'') &&
        sql.includes('id_transaksi = ?')) {
      for (const payment of state.payments) {
        if (payment.id_transaksi === params[0] &&
            payment.id_pembayaran !== params[1] &&
            payment.status_pembayaran === 'menunggu') {
          payment.status_pembayaran = 'gagal';
        }
      }
      return [{ affectedRows: 1 }, []];
    }
    if (sql.includes("UPDATE transaksi SET status_transaksi = 'dibayar'")) {
      const stockReserved = params.length === 2 ? params[0] : 1;
      const transactionId = params.length === 2 ? params[1] : params[0];
      const transaction = state.transactions.find((item) => item.id_transaksi === transactionId);
      if (transaction && transaction.status_transaksi === 'menunggu') {
        transaction.status_transaksi = 'dibayar';
        transaction.stock_reserved = stockReserved;
      }
      return [{ affectedRows: transaction ? 1 : 0 }, []];
    }
    if (sql.includes('FROM transaksi') && sql.includes("jenis_transaksi = 'online'") &&
        sql.includes('FOR UPDATE')) {
      const transaction = state.transactions.find(
        (item) => item.kode_transaksi === params[0] && item.jenis_transaksi === 'online',
      );
      if (!transaction) return [[], []];
      const shipment = state.shipments.find(
        (item) => item.id_transaksi === transaction.id_transaksi,
      );
      return [[{
        id: transaction.id_transaksi,
        id_transaksi: transaction.id_transaksi,
        nomor_pesanan: transaction.kode_transaksi,
        kode_transaksi: transaction.kode_transaksi,
        status: transaction.status_transaksi,
        status_transaksi: transaction.status_transaksi,
        tanggal: transaction.tanggal_transaksi,
        tanggal_transaksi: transaction.tanggal_transaksi,
        nama_pemesan: transaction.nama_pelanggan,
        nama_pelanggan: transaction.nama_pelanggan,
        no_hp: transaction.no_telepon,
        no_telepon: transaction.no_telepon,
        catatan: transaction.catatan,
        metode_penerimaan: transaction.metode_penerimaan,
        alamat_lengkap: transaction.alamat_pelanggan,
        alamat_pelanggan: transaction.alamat_pelanggan,
        subtotal: transaction.subtotal_produk,
        subtotal_produk: transaction.subtotal_produk,
        ongkir: transaction.ongkos_kirim,
        ongkos_kirim: transaction.ongkos_kirim,
        total: transaction.total_bayar,
        total_bayar: transaction.total_bayar,
        stock_reserved: transaction.stock_reserved,
        wilayah: shipment?.wilayah_tujuan || null,
        layanan_kurir: shipment?.layanan_kurir || null,
        status_pembayaran: state.payments
          .filter((payment) => payment.id_transaksi === transaction.id_transaksi)
          .sort((a, b) => b.id_pembayaran - a.id_pembayaran)[0]?.status_pembayaran || null,
        metode_pembayaran: state.payments
          .filter((payment) => payment.id_transaksi === transaction.id_transaksi)
          .sort((a, b) => b.id_pembayaran - a.id_pembayaran)[0]?.metode_pembayaran || null,
      }], []];
    }
    if (sql.includes('FROM pembayaran') && sql.includes("status_pembayaran = 'menunggu'")) {
      const payment = state.payments
        .filter((item) => item.id_transaksi === params[0] &&
          item.status_pembayaran === 'menunggu' &&
          (!sql.includes("metode_pembayaran = 'payment_gateway'") ||
            item.metode_pembayaran === 'payment_gateway'))
        .sort((a, b) => b.id_pembayaran - a.id_pembayaran)[0];
      return [payment ? [{ ...payment }] : [], []];
    }
    if (sql.includes('FROM transaksi t') && sql.includes('WHERE t.kode_transaksi = ?')) {
      const transaction = state.transactions.find(
        (item) => item.kode_transaksi === params[0] && item.jenis_transaksi === 'online',
      );
      if (!transaction) return [[], []];
      const shipment = state.shipments.find(
        (item) => item.id_transaksi === transaction.id_transaksi,
      );
      return [[{
        id: transaction.id_transaksi,
        nomor_pesanan: transaction.kode_transaksi,
        status: transaction.status_transaksi,
        tanggal: transaction.tanggal_transaksi,
        nama_pemesan: transaction.nama_pelanggan,
        no_hp: transaction.no_telepon,
        catatan: transaction.catatan,
        metode_penerimaan: transaction.metode_penerimaan,
        alamat_lengkap: transaction.alamat_pelanggan,
        subtotal: transaction.subtotal_produk,
        ongkir: transaction.ongkos_kirim,
        total: transaction.total_bayar,
        status_pembayaran: state.payments
          .filter((payment) => payment.id_transaksi === transaction.id_transaksi)
          .sort((a, b) => b.id_pembayaran - a.id_pembayaran)[0]?.status_pembayaran || null,
        metode_pembayaran: state.payments
          .filter((payment) => payment.id_transaksi === transaction.id_transaksi)
          .sort((a, b) => b.id_pembayaran - a.id_pembayaran)[0]?.metode_pembayaran || null,
        wilayah: shipment?.wilayah_tujuan,
        layanan_kurir: shipment?.layanan_kurir,
      }], []];
    }
    if (sql.includes('FROM detail_transaksi dt')) {
      return [state.details
        .filter((item) => item.id_transaksi === params[0])
        .map((item) => {
          const product = state.products.find((row) => row.id_produk === item.id_produk);
          return {
            product_id: item.id_produk,
            nama: product.nama_produk,
            kategori: product.nama_kategori,
            harga: item.harga_satuan,
            jumlah: item.jumlah,
            subtotal: item.subtotal,
          };
        }), []];
    }
    if (sql.includes('SELECT id_produk, jumlah FROM detail_transaksi')) {
      return [state.details
        .filter((item) => item.id_transaksi === params[0])
        .map(({ id_produk, jumlah }) => ({ id_produk, jumlah })), []];
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
  const shippingClient = {
    async calculateDomesticCost(input) {
      shippingCalls.push(input);
      return [{
        id: 'jne:REG:0',
        courier_name: 'JNE',
        service: 'REG',
        cost: 17000,
      }];
    },
  };
  const paymentCalls = [];
  const paymentClient = {
    isConfigured: () => true,
    isNotificationConfigured: () => true,
    getClientKey: () => 'client-test',
    async createTransaction(parameter) {
      paymentCalls.push(parameter);
      return { token: `snap-${parameter.transaction_details.order_id}` };
    },
    verifyNotification: (notification) => notification?.signature_key === 'valid',
  };
  const server = createApp({
    db,
    jwtSecret: JWT_SECRET,
    shippingClient,
    paymentClient,
  }).listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    state,
    shippingCalls,
    paymentCalls,
  };
}

async function createOrder(baseUrl, body) {
  return fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const pickupOrder = {
  nama_pemesan: '  Ibu Tester  ',
  no_hp: '0812-3456-7890',
  metode_penerimaan: 'ambil_di_toko',
  catatan: '  Tolong disiapkan  ',
  items: [
    { product_id: 20, jumlah: 1 },
    { product_id: 20, jumlah: 1 },
  ],
};

test('checkout tamu mereservasi stok dan memakai harga server', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const response = await createOrder(baseUrl, {
    ...pickupOrder,
    ongkir: 90000,
    diskon: 90000,
  });

  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.match(data.nomor_pesanan, /^TA-\d{8}-[A-F0-9]{24}$/);
  assert.equal(data.nama_pemesan, 'Ibu Tester');
  assert.equal(data.no_hp, '081234567890');
  assert.equal(data.metode_penerimaan, 'ambil_di_toko');
  assert.equal(data.metode_pembayaran, 'midtrans');
  assert.equal(data.subtotal, 136000);
  assert.equal(data.diskon, 0);
  assert.equal(data.ongkir, 0);
  assert.equal(data.total, 136000);
  assert.equal(data.items[0].jumlah, 2);
  assert.equal(state.transactions[0].jenis_transaksi, 'online');
  assert.equal(state.transactions[0].metode_penerimaan, 'pickup');
  assert.equal(state.transactions[0].status_transaksi, 'menunggu');
  assert.equal(state.transactions[0].stock_reserved, 1);
  assert.equal(state.payments[0].metode_pembayaran, 'payment_gateway');
  assert.equal(state.products[0].jumlah_stok, 3);
  assert.equal(state.details.length, 1);
  assert.equal(state.stockHistory.length, 1);
  assert.equal(state.stockHistory[0].jenis_perubahan, 'keluar');
  assert.equal(state.stockHistory[0].jumlah, 2);
});

test('checkout kedua ditolak bila stok telah direservasi pesanan pertama', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const first = await createOrder(baseUrl, {
    ...pickupOrder,
    items: [{ product_id: 20, jumlah: 4 }],
  });
  assert.equal(first.status, 201);

  const second = await createOrder(baseUrl, {
    ...pickupOrder,
    items: [{ product_id: 20, jumlah: 2 }],
  });
  assert.equal(second.status, 422);
  assert.match((await second.json()).errors['items.20'], /Stok tidak mencukupi/);
  assert.equal(state.transactions.length, 1);
  assert.equal(state.products[0].jumlah_stok, 1);
});

test('pembatalan pesanan menunggu mengembalikan stok yang direservasi', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const createResponse = await createOrder(baseUrl, pickupOrder);
  const order = (await createResponse.json()).data;
  const adminToken = jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    { subject: '1', expiresIn: '1h' },
  );
  const cancelResponse = await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Dibatalkan' }),
  });

  assert.equal(cancelResponse.status, 200);
  assert.equal(state.products[0].jumlah_stok, 5);
  assert.equal(state.transactions[0].stock_reserved, 0);
  assert.deepEqual(state.stockHistory.map((entry) => entry.jenis_perubahan), ['keluar', 'masuk']);
});

test('checkout meminta nama dan nomor HP yang valid tanpa meminta login', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  for (const body of [
    { ...pickupOrder, nama_pemesan: ' ' },
    { ...pickupOrder, no_hp: 'nomor-salah' },
  ]) {
    const response = await createOrder(baseUrl, body);
    assert.equal(response.status, 422);
  }
  assert.equal(state.transactions.length, 0);
});

test('checkout COD menyimpan pembayaran tunai dan hanya berlaku untuk kurir', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const courierOrder = {
    ...pickupOrder,
    metode_penerimaan: 'kurir',
    metode_pembayaran: 'cod',
    alamat_lengkap: 'Jl. Raya Telang No. 10',
    wilayah: 'Kamal, Bangkalan, Jawa Timur',
    destination_id: '123',
    selected_rate_id: 'jne:REG:0',
    items: [{ product_id: 20, jumlah: 2 }],
  };
  const response = await createOrder(baseUrl, courierOrder);

  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.equal(data.metode_pembayaran, 'cod');
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].metode_pembayaran, 'cod');
  assert.equal(state.payments[0].status_pembayaran, 'menunggu');

  const paymentResponse = await fetch(
    `${baseUrl}/orders/${data.nomor_pesanan}/pembayaran`,
    { method: 'POST' },
  );
  assert.equal(paymentResponse.status, 409);

  const detailResponse = await fetch(`${baseUrl}/orders/${data.nomor_pesanan}`);
  assert.equal((await detailResponse.json()).data.metode_pembayaran, 'cod');

  const pickupResponse = await createOrder(baseUrl, {
    ...pickupOrder,
    metode_pembayaran: 'cod',
  });
  assert.equal(pickupResponse.status, 422);
  assert.equal(state.transactions.length, 1);
});

test('COD dapat diproses pegawai dan lunas saat admin menyelesaikan pesanan', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const courierOrder = {
    ...pickupOrder,
    metode_penerimaan: 'kurir',
    metode_pembayaran: 'cod',
    alamat_lengkap: 'Jl. Raya Telang No. 10',
    wilayah: 'Kamal, Bangkalan, Jawa Timur',
    destination_id: '123',
    selected_rate_id: 'jne:REG:0',
    items: [{ product_id: 20, jumlah: 2 }],
  };
  const createResponse = await createOrder(baseUrl, courierOrder);
  const order = (await createResponse.json()).data;
  const employeeToken = jwt.sign(
    { role: 'pegawai' },
    JWT_SECRET,
    { subject: '2', expiresIn: '1h' },
  );
  const adminToken = jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    { subject: '1', expiresIn: '1h' },
  );
  const updateStatus = (token, status) => fetch(
    `${baseUrl}/orders/${order.nomor_pesanan}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );

  assert.equal(createResponse.status, 201);
  assert.equal(state.products[0].jumlah_stok, 3);
  assert.equal((await updateStatus(employeeToken, 'Diproses')).status, 200);
  assert.equal((await updateStatus(employeeToken, 'Siap Diambil/Dikirim')).status, 200);
  assert.equal((await updateStatus(adminToken, 'Selesai')).status, 200);
  assert.equal(state.transactions[0].status_transaksi, 'selesai');
  assert.equal(state.payments[0].status_pembayaran, 'berhasil');
  assert.equal(state.products[0].jumlah_stok, 3);
});

test('checkout menolak stok yang tidak cukup dan membatalkan transaksi', async (t) => {
  const { baseUrl, state } = await createFixture(t);
  const response = await createOrder(baseUrl, {
    ...pickupOrder,
    items: [{ product_id: 20, jumlah: 6 }],
  });

  assert.equal(response.status, 422);
  assert.match((await response.json()).errors['items.20'], /Stok tidak mencukupi/);
  assert.equal(state.transactions.length, 0);
  assert.equal(state.details.length, 0);
  assert.equal(state.products[0].jumlah_stok, 5);
});

test('pesanan kurir memakai tarif server dan menyimpan tujuan serta layanan', async (t) => {
  const { baseUrl, state, shippingCalls } = await createFixture(t);
  const response = await createOrder(baseUrl, {
    ...pickupOrder,
    metode_penerimaan: 'kurir',
    alamat_lengkap: 'Jl. Raya Telang No. 10',
    wilayah: 'Kamal, Bangkalan, Jawa Timur',
    destination_id: '123',
    selected_rate_id: 'jne:REG:0',
    ongkir: 0,
    diskon: 999999,
    items: [{ product_id: 20, jumlah: 2 }],
  });

  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.equal(data.ongkir, 17000);
  assert.equal(data.diskon, 0);
  assert.equal(data.total, 153000);
  assert.equal(state.transactions[0].metode_penerimaan, 'kurir');
  assert.equal(data.alamat_lengkap, 'Jl. Raya Telang No. 10');
  assert.equal(data.layanan_kurir, 'JNE REG');
  assert.deepEqual(shippingCalls, [{ destination: '123', weight: 10000 }]);
  assert.deepEqual(state.shipments, [{
    id_transaksi: 1,
    alamat_tujuan: 'Jl. Raya Telang No. 10',
    wilayah_tujuan: 'Kamal, Bangkalan, Jawa Timur',
    layanan_kurir: 'JNE REG',
    ongkos_kirim: '17000.00',
  }]);

  const detailResponse = await fetch(`${baseUrl}/orders/${data.nomor_pesanan}`);
  assert.equal(detailResponse.status, 200);
  const detail = (await detailResponse.json()).data;
  assert.equal(detail.metode_penerimaan, 'kurir');
  assert.equal(detail.metode_pembayaran, 'midtrans');
  assert.equal(detail.wilayah, 'Kamal, Bangkalan, Jawa Timur');
  assert.equal(detail.alamat_lengkap, 'Kamal, Bangkalan, Jawa Timur');
  assert.equal(detail.no_hp, '0812*****890');
  assert.equal(detail.items[0].nama, 'Beras 5 kg');
});

test('pembayaran Snap memakai total pesanan server dan menyimpan token agar dapat dipakai ulang', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;

  const firstResponse = await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, {
    method: 'POST',
  });
  assert.equal(firstResponse.status, 201);
  const firstPayment = (await firstResponse.json()).data;
  assert.match(firstPayment.snap_token, /^snap-TA-/);
  assert.equal(firstPayment.client_key, 'client-test');
  assert.equal(paymentCalls[0].transaction_details.gross_amount, 136000);
  assert.equal(
    paymentCalls[0].callbacks.finish,
    `http://localhost:5173/pesanan/${order.nomor_pesanan}`,
  );
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].status_pembayaran, 'menunggu');

  const retryResponse = await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, {
    method: 'POST',
  });
  assert.equal(retryResponse.status, 200);
  assert.deepEqual((await retryResponse.json()).data, firstPayment);
  assert.equal(paymentCalls.length, 1);
});

test('notifikasi Snap terverifikasi menandai pembayaran lunas, status Dibayar, dan idempoten', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;
  assert.equal(state.products[0].jumlah_stok, 3); // 5 - 2 direservasi saat checkout

  await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, { method: 'POST' });
  const reference = paymentCalls[0].transaction_details.order_id;
  const payload = {
    order_id: reference,
    status_code: '200',
    gross_amount: '136000.00',
    signature_key: 'valid',
    transaction_status: 'settlement',
  };

  const response = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 200);
  assert.equal(state.payments[0].status_pembayaran, 'berhasil');
  assert.equal(state.transactions[0].status_transaksi, 'dibayar');
  assert.equal(state.products[0].jumlah_stok, 3); // tidak berkurang dua kali

  // Kirim notifikasi ganda: harus tetap 200 dan tidak mengubah stok/status
  const duplicateResponse = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(duplicateResponse.status, 200);
  assert.equal(state.products[0].jumlah_stok, 3);

  const orderResponse = await fetch(`${baseUrl}/orders/${order.nomor_pesanan}`);
  assert.equal(orderResponse.status, 200);
  const orderData = (await orderResponse.json()).data;
  assert.equal(orderData.status_pembayaran, 'berhasil');
  assert.equal(orderData.status, 'Dibayar');
});

test('notifikasi Midtrans ditolak jika tanda tangan tidak valid atau nominal berbeda', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;
  await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, { method: 'POST' });
  const notification = {
    order_id: paymentCalls[0].transaction_details.order_id,
    status_code: '200',
    gross_amount: '136000.00',
    transaction_status: 'settlement',
  };

  const invalidSignature = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...notification, signature_key: 'invalid' }),
  });
  assert.equal(invalidSignature.status, 401);

  const invalidAmount = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...notification, gross_amount: '1.00', signature_key: 'valid' }),
  });
  assert.equal(invalidAmount.status, 422);
  assert.equal(state.payments[0].status_pembayaran, 'menunggu');
  assert.equal(state.transactions[0].status_transaksi, 'menunggu');
});

test('notifikasi capture dengan fraud deny menandai pembayaran gagal', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;
  await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, { method: 'POST' });
  const response = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: paymentCalls[0].transaction_details.order_id,
      status_code: '200',
      gross_amount: '136000.00',
      signature_key: 'valid',
      transaction_status: 'capture',
      fraud_status: 'deny',
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(state.payments[0].status_pembayaran, 'gagal');
  assert.equal(state.transactions[0].status_transaksi, 'menunggu');
});

test('detail pesanan yang tidak dikenal mengembalikan 404', async (t) => {
  const { baseUrl } = await createFixture(t);
  const response = await fetch(`${baseUrl}/orders/TA-not-found`);

  assert.equal(response.status, 404);
});