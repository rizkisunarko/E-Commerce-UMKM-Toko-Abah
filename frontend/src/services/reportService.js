import { api } from './api';

export const reportService = {
  topProducts: async ({ period = '7d', from, to } = {}) => {
    const params = new URLSearchParams();
    if (period) {
      params.append('period', period);
    }
    if (from) {
      params.append('from', from);
    }
    if (to) {
      params.append('to', to);
    }
    const qs = params.toString();
    return api.get(`/reports/top-products${qs ? `?${qs}` : ''}`);
  },
};
