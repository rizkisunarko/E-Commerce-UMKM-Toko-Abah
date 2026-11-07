import { api } from './api';

export const stockService = {
  // params: { search, kritis: 'true' }
  list: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') q.set(key, value);
    });
    const s = q.toString();
    return api.get(`/stock${s ? `?${s}` : ''}`);
  },
  update: (productId, stok) => api.patch(`/products/${productId}/stock`, { stok }),
};
