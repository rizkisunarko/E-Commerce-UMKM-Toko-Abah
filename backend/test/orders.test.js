const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
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
    nextTransactionId: 1,
  };
  const shippingCalls = [];
  let snapshot;

  async function query(sql, params = []) {
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
        catatan: params[8],
        tanggal_transaksi: new Date(),
      };
      state.transactions.push(transaction);
      return [{ insertId: transaction.id_transaksi }, []];
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
        jumlah_bayar: params[1],
        status_pembayaran: 'menunggu',
        kode_referensi: params[2],
        snap_token: null,
      };
      state.payments.push(payment);
      return [{ insertId: payment.id_pembayaran }, []];
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
      }] : [], []];
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
    if (sql.includes("UPDATE transaksi SET status_transaksi = 'diproses'")) {
      const transaction = state.transactions.find((item) => item.id_transaksi === params[0]);
      if (transaction && transaction.status_transaksi === 'menunggu') {
        transaction.status_transaksi = 'diproses';
      }
      return [{ affectedRows: transaction ? 1 : 0 }, []];
    }
    if (sql.includes('FROM transaksi') && sql.includes("jenis_transaksi = 'online'") &&
        sql.includes('FOR UPDATE')) {
      const transaction = state.transactions.find(
        (item) => item.kode_transaksi === params[0] && item.jenis_transaksi === 'online',
      );
      return [transaction ? [{
        id_transaksi: transaction.id_transaksi,
        kode_transaksi: transaction.kode_transaksi,
        nama_pelanggan: transaction.nama_pelanggan,
        no_telepon: transaction.no_telepon,
        total_bayar: transaction.total_bayar,
        status_transaksi: transaction.status_transaksi,
      }] : [], []];
    }
    if (sql.includes('FROM pembayaran') && sql.includes("status_pembayaran = 'menunggu'")) {
      const payment = state.payments
        .filter((item) => item.id_transaksi === params[0] && item.status_pembayaran === 'menunggu')
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

test('checkout tamu membuat pesanan berdasarkan harga server tanpa mengurangi stok', async (t) => {
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
  assert.equal(data.subtotal, 136000);
  assert.equal(data.diskon, 6000);
  assert.equal(data.ongkir, 0);
  assert.equal(data.total, 130000);
  assert.equal(data.items[0].jumlah, 2);
  assert.equal(state.transactions[0].jenis_transaksi, 'online');
  assert.equal(state.transactions[0].status_transaksi, 'menunggu');
  assert.equal(state.products[0].jumlah_stok, 5);
  assert.equal(state.details.length, 1);
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
  assert.equal(data.diskon, 6000);
  assert.equal(data.total, 147000);
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
  assert.equal(detail.wilayah, 'Kamal, Bangkalan, Jawa Timur');
  assert.equal(detail.alamat_lengkap, 'Jl. Raya Telang No. 10');
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
  assert.equal(paymentCalls[0].transaction_details.gross_amount, 130000);
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

test('notifikasi Snap terverifikasi menandai pembayaran lunas dan pesanan diproses', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;
  await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, { method: 'POST' });
  const reference = paymentCalls[0].transaction_details.order_id;

  const response = await fetch(`${baseUrl}/payments/midtrans/notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: reference,
      status_code: '200',
      gross_amount: '130000.00',
      signature_key: 'valid',
      transaction_status: 'settlement',
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(state.payments[0].status_pembayaran, 'berhasil');
  assert.equal(state.transactions[0].status_transaksi, 'diproses');
});

test('notifikasi Midtrans ditolak jika tanda tangan tidak valid atau nominal berbeda', async (t) => {
  const { baseUrl, state, paymentCalls } = await createFixture(t);
  const createdOrder = await createOrder(baseUrl, pickupOrder);
  const order = (await createdOrder.json()).data;
  await fetch(`${baseUrl}/orders/${order.nomor_pesanan}/pembayaran`, { method: 'POST' });
  const notification = {
    order_id: paymentCalls[0].transaction_details.order_id,
    status_code: '200',
    gross_amount: '130000.00',
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

test('detail pesanan yang tidak dikenal mengembalikan 404', async (t) => {
  const { baseUrl } = await createFixture(t);
  const response = await fetch(`${baseUrl}/orders/TA-not-found`);

  assert.equal(response.status, 404);
});