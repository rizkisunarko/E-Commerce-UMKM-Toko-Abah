// Backend tiruan di browser. Bentuk request dan respons mengikuti Kontrak API.
// Dipakai saat VITE_USE_MOCK=true. Data hilang saat halaman dimuat ulang.

const USERS = [
  { id: 1, username: 'admin', password: 'admin123', nama: 'Pemilik Toko', role: 'admin' },
  { id: 2, username: 'pegawai', password: 'pegawai123', nama: 'Pegawai Toko', role: 'pegawai' },
];

const CATEGORIES = [
  'Beras & Tepung',
  'Minyak & Bumbu',
  'Gula & Pemanis',
  'Telur & Lauk',
  'Makanan Instan',
  'Minuman',
  'Kebutuhan Rumah',
];

const now = () => new Date().toISOString();

let nextId = 9;
const products = [
  { id: 1, nama: 'Beras 5 kg', kategori: 'Sembako', harga: 74000, berat: 5000, stok: 15, batas_stok_kritis: 10 },
  { id: 2, nama: 'Minyak Goreng 1 L', kategori: 'Sembako', harga: 18500, berat: 1000, stok: 24, batas_stok_kritis: 10 },
  { id: 3, nama: 'Gula Pasir 1 kg', kategori: 'Sembako', harga: 17500, berat: 1000, stok: 18, batas_stok_kritis: 10 },
  { id: 4, nama: 'Telur Ayam 1 kg', kategori: 'Sembako', harga: 28000, berat: 1000, stok: 12, batas_stok_kritis: 15 },
  { id: 5, nama: 'Mie Instan', kategori: 'Mie & Bumbu', harga: 3500, berat: 80, stok: 96, batas_stok_kritis: 10 },
  { id: 6, nama: 'Kopi Sachet', kategori: 'Minuman', harga: 1500, berat: 20, stok: 80, batas_stok_kritis: 10 },
  { id: 7, nama: 'Sabun Mandi', kategori: 'Kebutuhan Rumah', harga: 3500, berat: 100, stok: 12, batas_stok_kritis: 5 },
  { id: 8, nama: 'Teh Celup', kategori: 'Minuman', harga: 8000, berat: 100, stok: 15, batas_stok_kritis: 5 },
].map((p) => ({ ...p, created_at: now(), updated_at: now() }));

// Tanggal (YYYY-MM-DD) menurut WIB (UTC+7), dipakai untuk filter dan rekap harian
const toWibDate = (iso) => new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Data contoh riwayat transaksi (PPL-06). Tidak mengurangi stok.
const MOCK_DESTINATIONS = [
  { id: 17486, label: 'Pasar Minggu, Jakarta Selatan, DKI Jakarta' },
  { id: 17490, label: 'Cilandak, Jakarta Selatan, DKI Jakarta' },
  { id: 17495, label: 'Pancoran, Jakarta Selatan, DKI Jakarta' },
  { id: 17500, label: 'Tebet, Jakarta Selatan, DKI Jakarta' },
  { id: 17505, label: 'Kebayoran Baru, Jakarta Selatan, DKI Jakarta' },
  { id: 18120, label: 'Depok, Jawa Barat' },
  { id: 19230, label: 'Bekasi Selatan, Kota Bekasi, Jawa Barat' },
  { id: 20110, label: 'Bandung Wetan, Kota Bandung, Jawa Barat' },
];

function getMockCourierRates(beratGram) {
  const kg = Math.max(1, Math.ceil(beratGram / 1000));
  return [
    {
      id: 'jne_reg',
      kode: 'jne_reg',
      kurir: 'JNE',
      courier_name: 'JNE',
      layanan: 'REG',
      service: 'REG',
      biaya: kg * 9000,
      cost: kg * 9000,
      estimasi: '2-3 hari',
      etd: '2-3 hari',
      nama: 'JNE REG',
    },
    {
      id: 'sicepat_reg',
      kode: 'sicepat_reg',
      kurir: 'SiCepat',
      courier_name: 'SiCepat',
      layanan: 'REG',
      service: 'REG',
      biaya: kg * 8500,
      cost: kg * 8500,
      estimasi: '2-3 hari',
      etd: '2-3 hari',
      nama: 'SiCepat REG',
    },
    {
      id: 'jnt_ez',
      kode: 'jnt_ez',
      kurir: 'J&T',
      courier_name: 'J&T',
      layanan: 'EZ',
      service: 'EZ',
      biaya: kg * 9500,
      cost: kg * 9500,
      estimasi: '1-2 hari',
      etd: '1-2 hari',
      nama: 'J&T EZ',
    },
  ];
}
const daysAgo = (d, h, m) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, m, 0, 0);
  return t.toISOString();
};
const makeTransaction = (id, tanggal, metode_bayar, lines, customPrices = {}) => {
  const items = lines.map(([productId, jumlah]) => {
    const p = products.find((x) => x.id === productId) || { id: productId, nama: `Produk ${productId}`, harga: 10000 };
    const price = customPrices[productId] !== undefined ? customPrices[productId] : p.harga;
    return { product_id: p.id, nama: p.nama, harga: price, jumlah, subtotal: price * jumlah };
  });
  return { id, tanggal, metode_bayar, items, total: items.reduce((sum, i) => sum + i.subtotal, 0) };
};
const transactions = [
  makeTransaction(1, daysAgo(0, 8, 15), 'tunai', [[1, 1], [2, 2]], { 1: 68000, 2: 18000 }),
  makeTransaction(2, daysAgo(0, 9, 40), 'qris', [[5, 5], [6, 4]], { 5: 3500, 6: 1500 }),
  makeTransaction(3, daysAgo(0, 13, 5), 'tunai', [[3, 2], [4, 1]], { 3: 17000, 4: 30000 }),
  makeTransaction(4, daysAgo(1, 10, 20), 'qris', [[1, 2]], { 1: 68000 }),
  makeTransaction(5, daysAgo(1, 16, 45), 'tunai', [[7, 3], [8, 2]], { 7: 3500, 8: 8000 }),
  makeTransaction(6, daysAgo(3, 11, 10), 'tunai', [[2, 1], [5, 10]], { 2: 18000, 5: 3500 }),
];
let nextTransactionId = transactions.length + 1;
const orders = [];
const guestCarts = new Map();

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const toNumber = (v) => (isBlank(v) ? NaN : Number(v));

function withStatus(p) {
  return { ...p, status_stok: p.stok <= p.batas_stok_kritis ? 'Stok Kritis' : 'Stok Aman' };
}

// mode 'create' mewajibkan stok; mode 'update' tidak memuat stok
function validateProduct(body, mode) {
  const errors = {};
  if (isBlank(body.nama)) errors.nama = REQUIRED;
  if (isBlank(body.kategori)) errors.kategori = REQUIRED;
  else if (!CATEGORIES.includes(body.kategori)) errors.kategori = 'Kategori tidak valid';

  const harga = toNumber(body.harga);
  if (isBlank(body.harga)) errors.harga = REQUIRED;
  else if (!Number.isFinite(harga) || harga <= 0) errors.harga = INVALID_NUMBER;

  const berat = toNumber(body.berat);
  if (isBlank(body.berat)) errors.berat = REQUIRED;
  else if (!Number.isFinite(berat) || berat <= 0) errors.berat = INVALID_NUMBER;

  if (mode === 'create') {
    const stok = toNumber(body.stok);
    if (isBlank(body.stok)) errors.stok = REQUIRED;
    else if (!Number.isFinite(stok)) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  }

  if (!isBlank(body.batas_stok_kritis)) {
    const b = toNumber(body.batas_stok_kritis);
    if (!Number.isFinite(b) || b < 0) errors.batas_stok_kritis = INVALID_NUMBER;
  }
  return errors;
}

const reply = (status, body) => ({ status, body });
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockRequest(method, fullPath, body = {}, token, requestHeaders = {}) {
  await delay();
  const [path, queryString = ''] = fullPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  const user = token && token.startsWith('mock-token-')
    ? USERS.find((u) => u.id === Number(token.replace('mock-token-', '')))
    : null;

  // Auth
  if (method === 'POST' && path === '/auth/login') {
    const found = USERS.find((u) => u.username === body.username && u.password === body.password);
    if (!found) return reply(401, { message: 'Nama pengguna atau kata sandi salah' });
    return reply(200, {
      token: `mock-token-${found.id}`,
      user: { id: found.id, nama: found.nama, role: found.role },
    });
  }

  // Katalog publik (PPL-07): tanpa login. Hanya field yang aman untuk pelanggan.
  // Produk arsip (PPL-14, Sprint 3) nantinya tidak ikut ditampilkan.
  if (method === 'GET' && path === '/catalog') {
    let rows = products.filter((p) => !p.archived_at);
    if (query.search) rows = rows.filter((p) => p.nama.toLowerCase().includes(query.search.toLowerCase()));
    if (query.kategori) rows = rows.filter((p) => p.kategori === query.kategori);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const data = rows.slice((page - 1) * limit, page * limit).map((p) => ({
      id: p.id,
      nama: p.nama,
      kategori: p.kategori,
      harga: p.harga,
      stok: p.stok,
      tersedia: p.stok > 0,
    }));
    return reply(200, { data, pagination: { page, limit, total: rows.length } });
  }
  if (method === 'GET' && path === '/catalog/categories') return reply(200, { data: CATEGORIES });
  if (method === 'GET' && path === '/categories') return reply(200, { data: CATEGORIES });

  // Keranjang dan pesanan pelanggan (PPL-08): tanpa login. Harga selalu dari server.
  // Stok TIDAK berkurang saat pesanan dibuat; stok berkurang saat pembayaran berhasil (Sprint 3).
  const guestCartToken = requestHeaders['X-Guest-Cart-Token'];
  if ((method === 'GET' || method === 'PUT') && path === '/cart') {
    if (typeof guestCartToken !== 'string' || !/^[\da-f]{64}$/i.test(guestCartToken)) {
      return reply(400, { message: 'Token keranjang tamu tidak valid' });
    }

    if (method === 'GET') {
      const savedItems = guestCarts.get(guestCartToken);
      if (!savedItems) return reply(200, { data: [], persisted: false });
      const data = savedItems
        .map(({ product_id, jumlah }) => {
          const product = products.find((item) => item.id === product_id);
          if (!product) return null;
          return {
            product_id,
            nama: product.nama,
            harga: product.harga,
            stok: product.stok,
            jumlah,
            jumlah_diminta: jumlah,
            cukup: product.stok >= jumlah,
          };
        })
        .filter(Boolean);
      return reply(200, { data, persisted: true });
    }

    if (!Array.isArray(body.items) || body.items.length > 100) {
      return reply(422, {
        message: 'Data keranjang tidak valid.',
        errors: { items: 'Pilih maksimal 100 produk dengan jumlah yang valid.' },
      });
    }
    const quantities = new Map();
    for (const item of body.items) {
      const productId = Number(item?.product_id);
      const quantity = Number(item?.jumlah);
      const combined = (quantities.get(productId) || 0) + quantity;
      if (!Number.isSafeInteger(productId) || productId < 1 ||
          !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000 ||
          !Number.isSafeInteger(combined) || combined > 1000) {
        return reply(422, {
          message: 'Data keranjang tidak valid.',
          errors: { items: 'Pilih produk dengan jumlah yang valid.' },
        });
      }
      quantities.set(productId, combined);
    }
    const data = [...quantities].map(([product_id, jumlah]) => {
      const product = products.find((item) => item.id === product_id);
      return product ? {
        product_id,
        nama: product.nama,
        harga: product.harga,
        stok: product.stok,
        jumlah,
        jumlah_diminta: jumlah,
        cukup: product.stok >= jumlah,
      } : null;
    });
    if (data.some((item) => !item)) {
      return reply(422, {
        message: 'Keranjang berisi produk yang tidak tersedia',
        errors: { items: 'Periksa kembali produk pada keranjang' },
      });
    }
    guestCarts.set(guestCartToken, [...quantities].map(([product_id, jumlah]) => ({
      product_id,
      jumlah,
    })));
    return reply(200, { data, persisted: true });
  }

  if (method === 'POST' && path === '/cart/check') {
    const quantities = new Map();
    for (const item of Array.isArray(body.items) ? body.items : []) {
      const productId = Number(item.product_id);
      quantities.set(productId, (quantities.get(productId) || 0) + Number(item.jumlah));
    }
    const data = [...quantities]
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        return {
          product_id: product.id,
          nama: product.nama,
          harga: product.harga,
          stok: product.stok,
          jumlah_diminta: quantity,
          cukup: product.stok >= quantity && product.stok > 0,
        };
      })
      .filter(Boolean);
    return reply(200, { data });
  }
  // Shipping API (PPL-10.2)
  if (method === 'GET' && path === '/shipping/destinations') {
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    if (search.length < 3) {
      return reply(422, {
        message: 'Data tidak valid',
        errors: { search: 'Ketik minimal 3 huruf' },
      });
    }
    const filtered = MOCK_DESTINATIONS.filter((d) =>
      d.label.toLowerCase().includes(search.toLowerCase())
    );
    return reply(200, { data: filtered });
  }

  if (method === 'POST' && path === '/shipping/cost') {
    const destId = body.tujuan_id || body.destination_id;
    if (!destId) {
      return reply(422, {
        message: 'Pilih kecamatan / kota tujuan',
        errors: { tujuan_id: 'Pilih kecamatan / kota tujuan', destination_id: REQUIRED },
      });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return reply(422, {
        message: 'Keranjang masih kosong',
        errors: { items: 'Keranjang masih kosong' },
      });
    }

    let berat_gram = 0;
    for (const it of items) {
      const p = products.find((x) => x.id === Number(it.product_id));
      const beratSatuan = p?.berat || 1000;
      berat_gram += beratSatuan * Number(it.jumlah || 1);
    }
    if (berat_gram < 1000) berat_gram = 1000;

    const matchedDest = MOCK_DESTINATIONS.find((d) => String(d.id) === String(destId))
      || MOCK_DESTINATIONS.find((d) => d.label.toLowerCase().includes(String(destId).toLowerCase()));

    // Bandung Wetan: layanan kosong [] (uji keadaan empty)
    if (String(destId) === '20110' || (matchedDest && matchedDest.label.includes('Bandung Wetan'))) {
      return reply(200, {
        data: [],
        weight: berat_gram,
        weight_kg: Number((berat_gram / 1000).toFixed(2)),
        berat_gram,
      });
    }

    // Bekasi Selatan: 502 error (uji keadaan gagal)
    if (String(destId) === '19230' || (matchedDest && matchedDest.label.includes('Bekasi Selatan'))) {
      return reply(502, {
        message: 'Layanan pengiriman sedang bermasalah. Coba lagi.',
      });
    }

    const layanan = getMockCourierRates(berat_gram);
    return reply(200, {
      data: layanan,
      weight: berat_gram,
      weight_kg: Number((berat_gram / 1000).toFixed(2)),
      berat_gram,
    });
  }

  if (method === 'POST' && path === '/orders') {
    const errors = {};
    const nama = String(body.nama_pemesan || '').trim();
    const hp = String(body.no_hp || '').replace(/[\s-]/g, '');
    const metode = body.metode_penerimaan === 'kurir' ? 'kurir' : 'ambil_di_toko';
    const alamat = String(body.alamat_pengiriman || body.alamat_lengkap || '').trim();
    const tujuanId = body.tujuan_id || body.destination_id;
    const rateCode = body.layanan_kurir || body.selected_rate_id;

    if (!nama) errors.nama_pemesan = REQUIRED;
    if (!hp) errors.no_hp = REQUIRED;
    else if (!/^(\+62|62|0)8\d{8,11}$/.test(hp)) errors.no_hp = 'Masukkan nomor HP yang valid (hanya angka)';
    
    if (body.metode_penerimaan && body.metode_penerimaan !== 'ambil_di_toko' && body.metode_penerimaan !== 'kurir') {
      errors.metode_penerimaan = 'Pilih cara menerima pesanan';
    }
    if (metode === 'kurir') {
      if (!alamat) errors.alamat_lengkap = REQUIRED;
      if (!tujuanId) {
        errors.tujuan_id = 'Pilih kecamatan / kota tujuan';
        errors.wilayah = 'Pilih kecamatan / kota tujuan';
      }
      if (!rateCode) {
        errors.layanan_kurir = 'Pilih layanan kurir terlebih dahulu';
        errors.selected_rate_id = 'Pilih layanan kurir';
      }
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) errors.items = 'Keranjang masih kosong';
    const lines = [];
    let berat_gram = 0;
    items.forEach((it) => {
      const key = `items.${it.product_id}`;
      const product = products.find((p) => p.id === Number(it.product_id));
      const jumlah = toNumber(it.jumlah);
      if (!product) errors[key] = 'Produk tidak ditemukan';
      else if (!Number.isInteger(jumlah) || jumlah < 1) errors[key] = INVALID_NUMBER;
      else if (jumlah > product.stok) errors[key] = `Stok tidak mencukupi. Stok tersedia: ${product.stok}`;
      else {
        lines.push({ product, jumlah });
        berat_gram += (product.berat || 1000) * jumlah;
      }
    });

    let matchedRate = null;
    if (metode === 'kurir' && rateCode) {
      const mockRates = getMockCourierRates(Math.max(1000, berat_gram));
      matchedRate = mockRates.find((r) => r.id === rateCode || r.kode === rateCode);
      if (!matchedRate) {
        errors.layanan_kurir = 'Pilih layanan kurir terlebih dahulu';
        errors.selected_rate_id = 'Pilih layanan kurir';
      }
    }

    if (Object.keys(errors).length) return reply(422, { message: 'Data tidak valid', errors });

    const tanggal = now();
    const day = toWibDate(tanggal).replace(/-/g, '');
    const seq = orders.filter((o) => o.nomor_pesanan.includes(day)).length + 1;
    const detail = lines.map(({ product, jumlah }) => ({
      product_id: product.id,
      nama: product.nama,
      harga: product.harga,
      jumlah,
      subtotal: product.harga * jumlah,
      kategori: product.kategori || 'Sembako',
    }));
    const subtotal = detail.reduce((sum, d) => sum + d.subtotal, 0);
    const diskon = subtotal >= 100000 ? 6000 : 0;
    const ongkir = metode === 'kurir' && matchedRate ? matchedRate.cost : 0;
    const total = Math.max(0, subtotal - diskon + ongkir);

    const matchedDest = MOCK_DESTINATIONS.find((d) => String(d.id) === String(tujuanId))
      || MOCK_DESTINATIONS.find((d) => d.label.toLowerCase().includes(String(body.tujuan || body.wilayah || '').toLowerCase()));

    const savedCourier = matchedRate
      ? {
          kode: matchedRate.kode,
          nama: `${matchedRate.kurir} ${matchedRate.layanan}`,
          estimasi: matchedRate.estimasi,
        }
      : null;

    const order = {
      id: orders.length + 1,
      nomor_pesanan: `TA-${day}-${String(seq).padStart(3, '0')}`,
      status: 'Menunggu Pembayaran',
      status_pembayaran: 'menunggu',
      tanggal,
      nama_pemesan: nama,
      no_hp: hp,
      catatan: String(body.catatan || '').trim(),
      metode_penerimaan: metode,
      metode_pembayaran: body.metode_pembayaran === 'cod' ? 'cod' : 'midtrans',
      wilayah: metode === 'kurir' ? (body.tujuan || body.wilayah || matchedDest?.label || '') : '',
      alamat_lengkap: metode === 'kurir' ? alamat : '',
      layanan_kurir: savedCourier,
      items: detail,
      subtotal,
      diskon,
      ongkir,
      total,
    };
    orders.push(order);
    return reply(201, { data: order });
  }
  const orderMatch = path.match(/^\/orders\/([^/]+)$/);
  if (method === 'GET' && orderMatch) {
    const nomor = decodeURIComponent(orderMatch[1]);
    let order = orders.find((o) => o.nomor_pesanan === nomor);
    if (!order) {
      // Fallback pesanan default untuk preview
      order = {
        id: 1,
        nomor_pesanan: nomor,
        status: 'Menunggu Pembayaran',
        tanggal: now(),
        nama_pemesan: 'Ibu Rahmawati',
        no_hp: '081298765432',
        catatan: 'Tolong bungkus minyaknya rapat ya Abah.',
        metode_penerimaan: 'ambil_di_toko',
        wilayah: 'Telang, Kamal (Radius < 3 km)',
        alamat_lengkap: 'Jl. Raya Telang No. 15, RT 04 / RW 03, Kamal, Bangkalan, Madura',
        layanan_kurir: 'Kurir Instan Toko Abah (Motor)',
        items: [
          { product_id: 1, nama: 'Beras Ramos Setra 5 kg', harga: 74000, jumlah: 1, subtotal: 74000, kategori: 'Beras Premium', variasi: '5 kg', catatan: 'Kualitas super, putih bersih, pulen wangi' },
          { product_id: 2, nama: 'Minyak Goreng Sawit 2 L', harga: 36000, jumlah: 1, subtotal: 36000, kategori: 'Minyak & Mentega', variasi: '2 L', catatan: 'Kemasan pouch refill ganda penyaringan' },
          { product_id: 3, nama: 'Gula Pasir Tebu 1 kg', harga: 17500, jumlah: 1, subtotal: 17500, kategori: 'Gula & Pemanis', variasi: '1 kg', catatan: 'Manis alami dari sari tebu pilihan, kristal putih' },
        ],
        subtotal: 127500,
        diskon: 6000,
        ongkir: 0,
        total: 121500,
      };
    }
    return reply(200, { data: order });
  }

  const paymentMatch = path.match(/^\/orders\/([^/]+)\/(?:pembayaran|payment)$/);
  if (method === 'POST' && paymentMatch) {
    const nomor = decodeURIComponent(paymentMatch[1]);
    const found = orders.find((o) => o.nomor_pesanan === nomor);
    return reply(201, {
      data: {
        snap_token: `mock-snap-token-${nomor}`,
        client_key: 'Mid-client-mock',
      },
    });
  }

  const simulateMatch = path.match(/^\/orders\/([^/]+)\/simulate-payment$/);
  if (method === 'POST' && simulateMatch) {
    const nomor = decodeURIComponent(simulateMatch[1]);
    const found = orders.find((o) => o.nomor_pesanan === nomor);
    if (found) {
      found.status_pembayaran = 'berhasil';
      found.status = 'Diproses';
    }
    return reply(200, { data: found || { status_pembayaran: 'berhasil', status: 'Diproses' } });
  }

  if (!user) return reply(401, { message: 'Silakan login terlebih dahulu' });
  const isAdmin = user.role === 'admin';

  if (method === 'GET' && path === '/auth/me') {
    return reply(200, { user: { id: user.id, nama: user.nama, role: user.role } });
  }

  if (method === 'GET' && path === '/categories') return reply(200, { data: CATEGORIES });

  // Produk
  if (method === 'GET' && path === '/products') {
    let rows = products.filter((p) => !p.archived_at).map(withStatus);
    if (query.search) rows = rows.filter((p) => p.nama.toLowerCase().includes(query.search.toLowerCase()));
    if (query.kategori) rows = rows.filter((p) => p.kategori === query.kategori);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return reply(200, {
      data: rows.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: rows.length },
    });
  }

  if (method === 'POST' && path === '/products') {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const errors = validateProduct(body, 'create');
    if (Object.keys(errors).length) return reply(422, { message: 'Data tidak valid', errors });
    const product = {
      id: nextId++,
      nama: String(body.nama).trim(),
      kategori: body.kategori,
      harga: Number(body.harga),
      berat: Number(body.berat),
      stok: Number(body.stok),
      batas_stok_kritis: isBlank(body.batas_stok_kritis) ? 5 : Number(body.batas_stok_kritis),
      created_at: now(),
      updated_at: now(),
    };
    products.push(product);
    return reply(201, { data: withStatus(product) });
  }

  const productMatch = path.match(/^\/products\/(\d+)$/);
  if (productMatch) {
    const id = Number(productMatch[1]);
    const product = products.find((p) => p.id === id);
    if (!product || (product.archived_at && method === 'GET' && !isAdmin)) {
      return reply(404, { message: 'Produk tidak ditemukan' });
    }

    if (method === 'GET') return reply(200, { data: withStatus(product) });

    if (method === 'PUT') {
      if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
      const errors = validateProduct(body, 'update');
      if (Object.keys(errors).length) return reply(422, { message: 'Data tidak valid', errors });
      Object.assign(product, {
        nama: String(body.nama).trim(),
        kategori: body.kategori,
        harga: Number(body.harga),
        berat: Number(body.berat),
        batas_stok_kritis: isBlank(body.batas_stok_kritis) ? product.batas_stok_kritis : Number(body.batas_stok_kritis),
        updated_at: now(),
      });
      return reply(200, { data: withStatus(product) });
    }

    if (method === 'DELETE') {
      if (!isAdmin) return reply(403, { message: 'Akses ditolak' });

      // Cek apakah produk pernah muncul di riwayat transaksi atau pesanan mock
      const hasTransaction = transactions.some((t) =>
        t.items.some((it) => it.product_id === id)
      );
      const hasOrder = orders.some((o) =>
        o.items.some((it) => it.product_id === id)
      );
      const hasHistory = hasTransaction || hasOrder;

      if (hasHistory) {
        product.archived_at = now();
        return reply(200, {
          message: 'Produk diarsipkan. Riwayat transaksi lama tetap tersimpan.',
          data: { id, tindakan: 'diarsipkan' },
          action: 'archived',
        });
      }

      const idx = products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        products.splice(idx, 1);
      }
      return reply(200, {
        message: 'Produk berhasil dihapus.',
        data: { id, tindakan: 'dihapus' },
        action: 'deleted',
      });
    }
  }

  // Stok
  if (method === 'GET' && path === '/stock') {
    let rows = products.filter((p) => !p.archived_at).map(withStatus);
    if (query.search) rows = rows.filter((p) => p.nama.toLowerCase().includes(query.search.toLowerCase()));
    if (query.kritis === 'true') rows = rows.filter((p) => p.status_stok === 'Stok Kritis');
    return reply(200, {
      data: rows,
      ringkasan: {
        stok_kritis: products.filter((p) => !p.archived_at && p.stok <= p.batas_stok_kritis).length,
      },
    });
  }

  const stockMatch = path.match(/^\/products\/(\d+)\/stock$/);
  if (method === 'PATCH' && stockMatch) {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const product = products.find((p) => p.id === Number(stockMatch[1]));
    if (!product) return reply(404, { message: 'Produk tidak ditemukan' });
    const stok = toNumber(body.stok);
    if (isBlank(body.stok)) return reply(422, { message: 'Data tidak valid', errors: { stok: REQUIRED } });
    if (!Number.isFinite(stok)) return reply(422, { message: 'Data tidak valid', errors: { stok: INVALID_NUMBER } });
    if (stok < 0) return reply(422, { message: 'Data tidak valid', errors: { stok: 'Jumlah stok tidak boleh negatif' } });
    product.stok = stok;
    product.updated_at = now();
    return reply(200, { data: withStatus(product) });
  }

  // Riwayat transaksi (PPL-06): hanya admin. Urutan rute: rekap harus sebelum :id
  if (method === 'GET' && path === '/transactions/rekap') {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const tanggal = query.tanggal || toWibDate(now());
    if (!isValidDate(tanggal)) {
      return reply(422, { message: 'Data tidak valid', errors: { tanggal: 'Masukkan tanggal yang valid' } });
    }
    const day = transactions.filter((t) => toWibDate(t.tanggal) === tanggal);
    const sum = (metode) => day.filter((t) => t.metode_bayar === metode).reduce((acc, t) => acc + t.total, 0);
    const count = (metode) => day.filter((t) => t.metode_bayar === metode).length;
    const tunai = sum('tunai');
    const qris = sum('qris');
    const debit = sum('debit');
    return reply(200, {
      data: {
        tanggal,
        tunai,
        qris,
        debit,
        total: tunai + qris + debit,
        jumlah_transaksi: day.length,
        jumlah_transaksi_tunai: count('tunai'),
        jumlah_transaksi_qris: count('qris'),
        jumlah_transaksi_debit: count('debit'),
      },
    });
  }

  if (method === 'GET' && path === '/transactions') {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const errors = {};
    if (query.dari !== undefined && !isValidDate(query.dari)) errors.dari = 'Masukkan tanggal yang valid';
    if (query.sampai !== undefined && !isValidDate(query.sampai)) errors.sampai = 'Masukkan tanggal yang valid';
    if (!errors.dari && !errors.sampai && query.dari && query.sampai && query.dari > query.sampai) {
      errors.sampai = 'Tanggal akhir tidak boleh sebelum tanggal awal';
    }
    if (Object.keys(errors).length) return reply(422, { message: 'Data tidak valid', errors });

    const rows = transactions
      .filter((t) => (!query.dari || toWibDate(t.tanggal) >= query.dari) && (!query.sampai || toWibDate(t.tanggal) <= query.sampai))
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
      .map((t) => ({
        id: t.id,
        tanggal: t.tanggal,
        metode_bayar: t.metode_bayar,
        total: t.total,
        jumlah_item: t.items.reduce((acc, i) => acc + i.jumlah, 0),
      }));
    return reply(200, { data: rows });
  }

  const trxMatch = path.match(/^\/transactions\/(\d+)$/);
  if (method === 'GET' && trxMatch) {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const found = transactions.find((t) => t.id === Number(trxMatch[1]));
    if (!found) return reply(404, { message: 'Transaksi tidak ditemukan' });
    return reply(200, { data: found });
  }

  // Kasir (PPL-05): simpan transaksi dan kurangi stok. Admin dan pegawai boleh.
  if (method === 'POST' && path === '/transactions') {
    const errors = {};
    if (!['tunai', 'qris', 'debit'].includes(body.metode_bayar)) errors.metode_bayar = 'Pilih metode bayar terlebih dahulu';

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) errors.items = 'Belum ada produk dipilih';

    const lines = [];
    items.forEach((it) => {
      const key = `items.${it.product_id}`;
      const product = products.find((p) => p.id === Number(it.product_id));
      const jumlah = toNumber(it.jumlah);
      if (!product) errors[key] = 'Produk tidak ditemukan';
      else if (!Number.isInteger(jumlah) || jumlah < 1) errors[key] = INVALID_NUMBER;
      else if (jumlah > product.stok) errors[key] = `Stok tidak mencukupi. Stok tersedia: ${product.stok}`;
      else lines.push({ product, jumlah });
    });

    if (Object.keys(errors).length) return reply(422, { message: 'Data tidak valid', errors });

    const total = lines.reduce((sum, { product, jumlah }) => sum + product.harga * jumlah, 0);
    const received = body.metode_bayar === 'tunai' ? Number(body.jumlah_diterima) : total;
    if (body.metode_bayar === 'tunai' &&
        (!Number.isSafeInteger(received) || received < total)) {
      return reply(422, {
        message: 'Data tidak valid',
        errors: {
          jumlah_diterima: 'Uang diterima harus berupa angka bulat dan minimal sebesar total tagihan',
        },
      });
    }

    const detail = lines.map(({ product, jumlah }) => {
      product.stok -= jumlah;
      product.updated_at = now();
      return {
        product_id: product.id,
        nama: product.nama,
        harga: product.harga,
        jumlah,
        subtotal: product.harga * jumlah,
      };
    });
    const transaction = {
      id: nextTransactionId++,
      tanggal: now(),
      metode_bayar: body.metode_bayar,
      items: detail,
      total,
      jumlah_diterima: received,
      kembalian: body.metode_bayar === 'tunai' ? received - total : 0,
    };
    transactions.push(transaction);
    return reply(201, { data: transaction });
  }

  return reply(404, { message: 'Endpoint tidak ditemukan' });
}
