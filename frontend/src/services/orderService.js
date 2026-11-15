import { api } from './api';

// Endpoint publik untuk pelanggan: tanpa login.
export const orderService = {
  // items: [{ product_id, jumlah }]. Hasil: harga dan stok terbaru dari server.
  checkCart: (items) => api.post('/cart/check', { items }),
  // data: { nama_pemesan, no_hp, catatan, metode_penerimaan, items }
  create: (data) => api.post('/orders', data),
  get: (nomor) => api.get(`/orders/${encodeURIComponent(nomor)}`),
};
