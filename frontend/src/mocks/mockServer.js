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
  { id: 1, nama: 'Beras 5 kg', kategori: 'Beras & Tepung', harga: 68000, berat: 5000, stok: 4, batas_stok_kritis: 10 },
  { id: 2, nama: 'Minyak Goreng 1 L', kategori: 'Minyak & Bumbu', harga: 18000, berat: 1000, stok: 3, batas_stok_kritis: 10 },
  { id: 3, nama: 'Gula Pasir 1 kg', kategori: 'Gula & Pemanis', harga: 17000, berat: 1000, stok: 5, batas_stok_kritis: 10 },
  { id: 4, nama: 'Telur Ayam 1 kg', kategori: 'Telur & Lauk', harga: 30000, berat: 1000, stok: 20, batas_stok_kritis: 5 },
  { id: 5, nama: 'Mie Instan', kategori: 'Makanan Instan', harga: 3500, berat: 80, stok: 48, batas_stok_kritis: 5 },
  { id: 6, nama: 'Kopi Sachet', kategori: 'Minuman', harga: 1500, berat: 20, stok: 30, batas_stok_kritis: 5 },
  { id: 7, nama: 'Sabun Mandi', kategori: 'Kebutuhan Rumah', harga: 3500, berat: 100, stok: 12, batas_stok_kritis: 5 },
  { id: 8, nama: 'Teh Celup', kategori: 'Minuman', harga: 8000, berat: 100, stok: 15, batas_stok_kritis: 5 },
].map((p) => ({ ...p, archived_at: null, created_at: now(), updated_at: now() }));

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const toNumber = (v) => (isBlank(v) ? NaN : Number(v));

function withStatus(p) {
  return { ...p, status_stok: p.stok <= p.batas_stok_kritis ? 'Stok Kritis' : 'Stok Aman' };
}

// Mode create mewajibkan stok; mode update memvalidasi stok bila dikirim.
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
    else if (!Number.isSafeInteger(stok) || stok > 2147483647) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  } else if (mode === 'update' && !isBlank(body.stok)) {
    const stok = toNumber(body.stok);
    if (!Number.isSafeInteger(stok) || stok > 2147483647) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  }

  if (!isBlank(body.batas_stok_kritis)) {
    const b = toNumber(body.batas_stok_kritis);
    if (!Number.isSafeInteger(b) || b > 2147483647 || b < 0) {
      errors.batas_stok_kritis = INVALID_NUMBER;
    }
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
    let rows = products.filter((p) => (isAdmin && query.include_archived === 'true') || !p.archived_at).map(withStatus);
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
    if (product.archived_at && !isAdmin) return reply(404, { message: 'Produk tidak ditemukan' });

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
        ...(isBlank(body.stok) ? {} : { stok: Number(body.stok) }),
        batas_stok_kritis: isBlank(body.batas_stok_kritis) ? product.batas_stok_kritis : Number(body.batas_stok_kritis),
        updated_at: now(),
      });
      return reply(200, { data: withStatus(product) });
    }
  }

  const archiveMatch = path.match(/^\/products\/(\d+)\/archive$/);
  if (method === 'PATCH' && archiveMatch) {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const product = products.find((p) => p.id === Number(archiveMatch[1]));
    if (!product) return reply(404, { message: 'Produk tidak ditemukan' });
    if (typeof body.archived !== 'boolean') {
      return reply(422, {
        message: 'Data tidak valid',
        errors: { archived: 'Status arsip harus berupa true atau false' },
      });
    }
    product.archived_at = body.archived ? product.archived_at || now() : null;
    product.updated_at = now();
    return reply(200, {
      message: body.archived ? 'Produk berhasil diarsipkan' : 'Produk berhasil dipulihkan',
    });
  }

  // Stok
  if (method === 'GET' && path === '/stock') {
    let rows = products.filter((p) => !p.archived_at).map(withStatus);
    if (query.search) rows = rows.filter((p) => p.nama.toLowerCase().includes(query.search.toLowerCase()));
    if (query.kritis === 'true') rows = rows.filter((p) => p.status_stok === 'Stok Kritis');
    return reply(200, { data: rows, ringkasan: { stok_kritis: products.filter((p) => !p.archived_at && p.stok <= p.batas_stok_kritis).length } });
  }

  const stockMatch = path.match(/^\/products\/(\d+)\/stock$/);
  if (method === 'PATCH' && stockMatch) {
    if (!isAdmin) return reply(403, { message: 'Akses ditolak' });
    const product = products.find((p) => p.id === Number(stockMatch[1]));
    if (!product || product.archived_at) return reply(404, { message: 'Produk tidak ditemukan' });
    const stok = toNumber(body.stok);
    if (isBlank(body.stok)) return reply(422, { message: 'Data tidak valid', errors: { stok: REQUIRED } });
    if (!Number.isSafeInteger(stok) || stok > 2147483647) {
      return reply(422, { message: 'Data tidak valid', errors: { stok: INVALID_NUMBER } });
    }
    if (stok < 0) return reply(422, { message: 'Data tidak valid', errors: { stok: 'Jumlah stok tidak boleh negatif' } });
    product.stok = stok;
    product.updated_at = now();
    return reply(200, { data: withStatus(product) });
  }

  return reply(404, { message: 'Endpoint tidak ditemukan' });
}
