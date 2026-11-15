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

// Data contoh riwayat transaksi (PPL-06). Tidak mengurangi stok.
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

export async function mockRequest(method, fullPath, body = {}, token) {
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

  if (!user) return reply(401, { message: 'Silakan login terlebih dahulu' });
  const isAdmin = user.role === 'admin';

  if (method === 'GET' && path === '/auth/me') {
    return reply(200, { user: { id: user.id, nama: user.nama, role: user.role } });
  }

  if (method === 'GET' && path === '/categories') return reply(200, { data: CATEGORIES });

  // Produk
  if (method === 'GET' && path === '/products') {
    let rows = products.map(withStatus);
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
    const product = products.find((p) => p.id === Number(productMatch[1]));
    if (!product) return reply(404, { message: 'Produk tidak ditemukan' });

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
  }

  // Stok
  if (method === 'GET' && path === '/stock') {
    let rows = products.map(withStatus);
    if (query.search) rows = rows.filter((p) => p.nama.toLowerCase().includes(query.search.toLowerCase()));
    if (query.kritis === 'true') rows = rows.filter((p) => p.status_stok === 'Stok Kritis');
    return reply(200, { data: rows, ringkasan: { stok_kritis: products.filter((p) => p.stok <= p.batas_stok_kritis).length } });
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return reply(422, { message: 'Data tidak valid', errors: { tanggal: 'Masukkan tanggal yang valid' } });
    }
    const day = transactions.filter((t) => toWibDate(t.tanggal) === tanggal);
    const sum = (metode) => day.filter((t) => t.metode_bayar === metode).reduce((acc, t) => acc + t.total, 0);
    const tunai = sum('tunai');
    const qris = sum('qris');
    return reply(200, { data: { tanggal, tunai, qris, total: tunai + qris, jumlah_transaksi: day.length } });
  }

  if (method === 'GET' && path === '/transactions') {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const errors = {};
    const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (query.dari && !validDate(query.dari)) errors.dari = 'Masukkan tanggal yang valid';
    if (query.sampai && !validDate(query.sampai)) errors.sampai = 'Masukkan tanggal yang valid';
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
