const STORAGE_KEY = 'toko_abah_order_history';
const MAX_HISTORY_ITEMS = 15;

export function getSavedOrderHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.nomor_pesanan === 'string' && item.nomor_pesanan.trim() !== '');
  } catch {
    return [];
  }
}

export function saveOrderToHistory(order) {
  if (!order || !order.nomor_pesanan) return;
  try {
    const existing = getSavedOrderHistory();
    const itemCount = Array.isArray(order.items)
      ? order.items.reduce((sum, it) => sum + Number(it.jumlah || 1), 0)
      : Number(order.jumlah_item || 0);

    const entry = {
      nomor_pesanan: order.nomor_pesanan,
      tanggal: order.tanggal || new Date().toISOString(),
      total: Number(order.total || 0),
      status: order.status || 'Menunggu Pembayaran',
      metode_pembayaran: order.metode_pembayaran || 'midtrans',
      metode_penerimaan: order.metode_penerimaan || 'ambil_di_toko',
      jumlah_item: itemCount,
    };

    const filtered = existing.filter((item) => item.nomor_pesanan !== entry.nomor_pesanan);
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
}

export function removeOrderFromHistory(nomorPesanan) {
  if (!nomorPesanan) return;
  try {
    const existing = getSavedOrderHistory();
    const updated = existing.filter((item) => item.nomor_pesanan !== nomorPesanan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
}
