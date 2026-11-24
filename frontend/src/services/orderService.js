import { api } from './api';

export function normalizePaymentStatus(status) {
  if (!status) return 'belum_dibayar';
  const s = String(status).toLowerCase().trim();
  if (s === 'berhasil' || s === 'dibayar' || s === 'settlement' || s === 'capture') return 'dibayar';
  if (s === 'menunggu' || s === 'pending') return 'menunggu';
  if (s === 'gagal' || s === 'deny' || s === 'cancel' || s === 'failure') return 'gagal';
  if (s === 'kedaluwarsa' || s === 'expire') return 'kedaluwarsa';
  return 'menunggu';
}

// Endpoint publik untuk pelanggan: tanpa login.
export const orderService = {
  searchDestinations: (search) =>
    api.get(`/shipping/destinations?search=${encodeURIComponent(search)}`),
  calculateShipping: (destinationId, items) =>
    api.post('/shipping/cost', { destination_id: destinationId, items }),
  // items: [{ product_id, jumlah }]. Hasil: harga dan stok terbaru dari server.
  checkCart: (items) => api.post('/cart/check', { items }),
  // Checkout publik: sertakan metode_pembayaran (midtrans atau cod) bersama data pesanan.
  create: (data) => api.post('/orders', data),
  createPayment: (nomor) =>
    api.post(`/orders/${encodeURIComponent(nomor)}/pembayaran`),
  pay: async (nomor) => {
    const res = await api.post(`/orders/${encodeURIComponent(nomor)}/pembayaran`);
    return {
      snap_token: res.data?.snap_token,
      client_key: res.data?.client_key,
      redirect_url: null,
      kedaluwarsa_pada: null,
    };
  },
  get: (nomor) => api.get(`/orders/${encodeURIComponent(nomor)}`),
  getByNumber: (nomor) => api.get(`/orders/${encodeURIComponent(nomor)}`),
};


