import { api } from './api';

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') q.set(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const transactionService = {
  // data: { metode_bayar: 'tunai' | 'qris', items: [{ product_id, jumlah }] }
  create: (data) => api.post('/transactions', data),
  // params: { dari: 'YYYY-MM-DD', sampai: 'YYYY-MM-DD' }
  list: (params) => api.get(`/transactions${toQuery(params)}`),
  get: (id) => api.get(`/transactions/${id}`),
  // tanggal: 'YYYY-MM-DD'
  rekap: (tanggal) => api.get(`/transactions/rekap${toQuery({ tanggal })}`),
};
