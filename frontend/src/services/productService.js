import { api } from './api';

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') q.set(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const productService = {
  categories: () => api.get('/categories'),
  list: (params) => api.get(`/products${toQuery(params)}`),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
};
