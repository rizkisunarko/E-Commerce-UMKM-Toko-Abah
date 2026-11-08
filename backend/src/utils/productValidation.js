const CATEGORIES = [
  'Beras & Tepung',
  'Minyak & Bumbu',
  'Gula & Pemanis',
  'Telur & Lauk',
  'Makanan Instan',
  'Minuman',
  'Kebutuhan Rumah',
];

const REQUIRED = 'Kolom ini wajib diisi';
const INVALID_NUMBER = 'Masukkan angka yang valid';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Mengembalikan { errors, values }. errors kosong berarti data valid.
function validateProduct(body = {}, mode = 'create') {
  const errors = {};

  if (isBlank(body.nama)) errors.nama = REQUIRED;

  if (isBlank(body.kategori)) errors.kategori = REQUIRED;
  else if (!CATEGORIES.includes(body.kategori)) errors.kategori = 'Kategori tidak valid';

  const harga = Number(body.harga);
  if (isBlank(body.harga)) errors.harga = REQUIRED;
  else if (!Number.isFinite(harga) || harga <= 0) errors.harga = INVALID_NUMBER;

  const berat = Number(body.berat);
  if (isBlank(body.berat)) errors.berat = REQUIRED;
  else if (!Number.isFinite(berat) || berat <= 0) errors.berat = INVALID_NUMBER;

  const stok = Number(body.stok);
  if (mode === 'create') {
    if (isBlank(body.stok)) errors.stok = REQUIRED;
    else if (!Number.isSafeInteger(stok) || stok > 2147483647) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  } else if (mode === 'update' && !isBlank(body.stok)) {
    if (!Number.isSafeInteger(stok) || stok > 2147483647) errors.stok = INVALID_NUMBER;
    else if (stok < 0) errors.stok = 'Jumlah stok tidak boleh negatif';
  }

  let batas = 5; // nilai bawaan bila batas stok kritis kosong
  if (!isBlank(body.batas_stok_kritis)) {
    batas = Number(body.batas_stok_kritis);
    if (!Number.isSafeInteger(batas) || batas > 2147483647 || batas < 0) {
      errors.batas_stok_kritis = INVALID_NUMBER;
    }
  }

  const hargaBeli = isBlank(body.harga_beli) ? 0 : Number(body.harga_beli);
  if (!isBlank(body.harga_beli) && (!Number.isFinite(hargaBeli) || hargaBeli < 0)) {
    errors.harga_beli = INVALID_NUMBER;
  }

  return {
    errors,
    values: {
      nama: String(body.nama || '').trim(),
      kategori: body.kategori,
      harga,
      hargaBeli,
      berat,
      stok: mode === 'create' || (mode === 'update' && !isBlank(body.stok)) ? stok : undefined,
      batas_stok_kritis: batas,
      satuan: body.satuan ? String(body.satuan).trim() : `${berat} g`,
    },
  };
}

module.exports = { validateProduct, CATEGORIES, REQUIRED, INVALID_NUMBER };
