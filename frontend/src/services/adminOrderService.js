import { api } from './api';

export const adminOrderService = {
  list: async ({ status, page = 1, limit = 20, search, dari, sampai } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'Semua') {
      params.append('status', status);
    }
    if (page) {
      params.append('page', page);
    }
    if (limit) {
      params.append('limit', limit);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (dari) {
      params.append('dari', dari);
    }
    if (sampai) {
      params.append('sampai', sampai);
    }

    const qs = params.toString();
    return api.get(`/orders${qs ? `?${qs}` : ''}`);
  },

  getDetail: async (nomor) => {
    return api.get(`/orders/${encodeURIComponent(nomor)}`);
  },

  updateStatus: async (nomor, status) => {
    return api.patch(`/orders/${encodeURIComponent(nomor)}/status`, { status });
  },
};
