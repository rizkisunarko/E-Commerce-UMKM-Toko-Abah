import { api } from './api';

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
  get: (nomor) => api.get(`/orders/${encodeURIComponent(nomor)}`),
};

