import { api } from './api';

export const transactionService = {
  // data: { metode_bayar: 'tunai' | 'qris', items: [{ product_id, jumlah }] }
  create: (data) => api.post('/transactions', data),
};

