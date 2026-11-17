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
  const server = createApp({ db, jwtSecret: JWT_SECRET, shippingClient }).listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    state,
    shippingCalls,
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

test('detail pesanan yang tidak dikenal mengembalikan 404', async (t) => {
  const { baseUrl } = await createFixture(t);
  const response = await fetch(`${baseUrl}/orders/TA-not-found`);

  assert.equal(response.status, 404);
});