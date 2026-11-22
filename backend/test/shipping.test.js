const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const createApp = require('../src/app');
const { createRajaOngkirClient } = require('../src/services/rajaOngkir');

const JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

async function listen(t, app) {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

function createShippingFixture(t, {
  products = [],
  searchError,
  costError,
} = {}) {
  const calls = [];
  let databaseQueries = 0;
  const db = {
    async query(sql, params) {
      databaseQueries += 1;
      assert.match(sql, /SELECT id_produk, satuan/);
      return [products.filter((product) => params.includes(product.id_produk)), []];
    },
  };
  const shippingClient = {
    async searchDestinations(search) {
      calls.push({ type: 'search', search });
      if (searchError) throw searchError;
      return [{ id: '123', label: 'Kamal, Bangkalan, Jawa Timur' }];
    },
    async calculateDomesticCost(input) {
      calls.push({ type: 'cost', ...input });
      if (costError) throw costError;
      return [{
        id: 'jne:REG:0',
        courier_code: 'jne',
        courier_name: 'JNE',
        service: 'REG',
        description: 'Layanan reguler',
        cost: 17000,
        etd: '2-3 hari',
      }];
    },
  };
  const app = createApp({ db, jwtSecret: JWT_SECRET, shippingClient });
  return {
    baseUrlPromise: listen(t, app),
    calls,
    getDatabaseQueries: () => databaseQueries,
  };
}

test('pencarian tujuan mengembalikan hasil dari RajaOngkir', async (t) => {
  const { baseUrlPromise, calls } = createShippingFixture(t);
  const response = await fetch(`${await baseUrlPromise}/api/shipping/destinations?search=Kamal`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: [{ id: '123', label: 'Kamal, Bangkalan, Jawa Timur' }],
  });
  assert.deepEqual(calls, [{ type: 'search', search: 'Kamal' }]);
});

test('tarif memakai total berat dari produk database, bukan berat kiriman browser', async (t) => {
  const { baseUrlPromise, calls } = createShippingFixture(t, {
    products: [
      { id_produk: 1, satuan: '5 kg' },
      { id_produk: 2, satuan: '1000 g' },
    ],
  });
  const response = await fetch(`${await baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: '456',
      items: [
        { product_id: 1, jumlah: 2 },
        { product_id: 2, jumlah: 3 },
      ],
      weight: 1,
    }),
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.weight, 13000);
  assert.equal(body.weight_kg, 13);
  assert.equal(body.data[0].cost, 17000);
  assert.deepEqual(calls, [{
    type: 'cost',
    destination: '456',
    weight: 13000,
  }]);
});

test('tarif ditolak bila produk hilang atau berat produk tidak valid', async (t) => {
  const missingProduct = createShippingFixture(t);
  const missingResponse = await fetch(`${await missingProduct.baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: '456',
      items: [{ product_id: 9, jumlah: 1 }],
    }),
  });
  assert.equal(missingResponse.status, 422);
  assert.equal(missingProduct.calls.length, 0);

  const invalidWeight = createShippingFixture(t, {
    products: [{ id_produk: 1, satuan: 'paket besar' }],
  });
  const invalidResponse = await fetch(`${await invalidWeight.baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: '456',
      items: [{ product_id: 1, jumlah: 1 }],
    }),
  });
  assert.equal(invalidResponse.status, 422);
  assert.equal(invalidWeight.calls.length, 0);
});

test('tarif menolak alamat tujuan dengan ID tidak valid sebelum mengakses database', async (t) => {
  const { baseUrlPromise, calls, getDatabaseQueries } = createShippingFixture(t);
  const response = await fetch(`${await baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: 'alamat-tidak-valid',
      items: [{ product_id: 1, jumlah: 1 }],
    }),
  });

  assert.equal(response.status, 422);
  assert.equal((await response.json()).errors.destination_id, 'Kolom ini wajib diisi');
  assert.equal(getDatabaseQueries(), 0);
  assert.equal(calls.length, 0);
});

test('tarif menolak kuantitas gabungan di atas batas checkout', async (t) => {
  const { baseUrlPromise, calls } = createShippingFixture(t, {
    products: [{ id_produk: 1, satuan: '5 kg' }],
  });
  const response = await fetch(`${await baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: '456',
      items: [
        { product_id: 1, jumlah: 1000 },
        { product_id: 1, jumlah: 1 },
      ],
    }),
  });

  assert.equal(response.status, 422);
  assert.equal(calls.length, 0);
});

test('tarif mengembalikan validasi alamat saat Komerce menolak tujuan', async (t) => {
  const { baseUrlPromise, calls } = createShippingFixture(t, {
    products: [{ id_produk: 1, satuan: '1 kg' }],
    costError: {
      statusCode: 422,
      message: 'Alamat tujuan atau data pengiriman tidak valid.',
    },
  });
  const response = await fetch(`${await baseUrlPromise}/api/shipping/cost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination_id: '456',
      items: [{ product_id: 1, jumlah: 1 }],
    }),
  });

  assert.equal(response.status, 422);
  assert.equal((await response.json()).message, 'Alamat tujuan atau data pengiriman tidak valid.');
  assert.equal(calls[0].type, 'cost');
});

test('pencarian alamat mengembalikan error upstream dengan status yang jelas', async (t) => {
  const { baseUrlPromise, calls } = createShippingFixture(t, {
    searchError: {
      statusCode: 502,
      message: 'RajaOngkir gagal memproses permintaan.',
    },
  });
  const response = await fetch(`${await baseUrlPromise}/api/shipping/destinations?search=Surabaya`);

  assert.equal(response.status, 502);
  assert.equal((await response.json()).message, 'RajaOngkir gagal memproses permintaan.');
  assert.deepEqual(calls, [{ type: 'search', search: 'Surabaya' }]);
});

test('RajaOngkir client authenticates requests and resolves the Kamal origin', async () => {
  const requests = [];
  const client = createRajaOngkirClient({
    apiKey: 'sandbox-secret',
    fetchImpl: async (url, options) => {
      requests.push({ url: new URL(url), options });
      if (url.pathname.endsWith('/destination/domestic-destination')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 100, label: 'Kamal, Bangkalan, Jawa Timur' }],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{
            code: 'jne',
            name: 'JNE',
            service: 'REG',
            description: 'Layanan reguler',
            cost: 17000,
            etd: '2-3 hari',
          }],
        }),
      };
    },
  });

  const destinations = await client.searchDestinations('Surabaya');
  const rates = await client.calculateDomesticCost({ destination: '456', weight: 13000 });

  assert.equal(destinations[0].id, '100');
  assert.equal(rates[0].cost, 17000);
  assert.equal(requests[0].options.headers.key, 'sandbox-secret');
  assert.equal(requests[0].url.searchParams.get('search'), 'Surabaya');
  assert.equal(requests[1].url.searchParams.get('search'), 'Kamal');
  assert.equal(requests[2].options.headers.key, 'sandbox-secret');
  assert.equal(requests[2].options.body.get('origin'), '100');
  assert.equal(requests[2].options.body.get('destination'), '456');
  assert.equal(requests[2].options.body.get('weight'), '13000');
  assert.equal(requests[2].options.body.get('courier'), 'jne:sicepat:ide:sap:ninja:jnt:tiki:wahana:pos:sentral:lion:rex:spx');
});

test('RajaOngkir client fails explicitly when API key is missing', async () => {
  const client = createRajaOngkirClient({ apiKey: '' });
  await assert.rejects(client.searchDestinations('Kamal'), {
    statusCode: 503,
    message: 'RAJAONGKIR_API_KEY belum diatur pada backend/.env.',
  });
});

test('RajaOngkir client returns a validation error for an unsupported destination', async () => {
  const client = createRajaOngkirClient({
    apiKey: 'sandbox-secret',
    fetchImpl: async (url) => ({
      ok: url.pathname.endsWith('/destination/domestic-destination'),
      status: url.pathname.endsWith('/destination/domestic-destination') ? 200 : 400,
      json: async () => url.pathname.endsWith('/destination/domestic-destination')
        ? { data: [{ id: 100, label: 'Kamal, Bangkalan, Jawa Timur' }] }
        : { meta: { status: 'error', code: 422 } },
    }),
  });

  await assert.rejects(
    client.calculateDomesticCost({ destination: '999999', weight: 1000 }),
    {
      statusCode: 422,
      message: 'Alamat tujuan atau data pengiriman tidak valid. Pilih alamat dari hasil pencarian.',
    },
  );
});

test('RajaOngkir client reports upstream API failures as gateway errors', async () => {
  const client = createRajaOngkirClient({
    apiKey: 'sandbox-secret',
    fetchImpl: async () => ({
      ok: false,
      status: 503,
      json: async () => ({ meta: { status: 'error', code: 503 } }),
    }),
  });

  await assert.rejects(client.searchDestinations('Surabaya'), {
    statusCode: 502,
    message: 'RajaOngkir gagal memproses permintaan. Periksa data tujuan dan konfigurasi akun.',
  });
});
