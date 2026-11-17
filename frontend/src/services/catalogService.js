import { api } from './api';

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') q.set(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

// Endpoint publik: tidak butuh login
export const catalogService = {
  // params: { search, kategori, page, limit }
  list: (params) => api.get(`/catalog${toQuery(params)}`),
  categories: () => api.get('/catalog/categories'),
};

