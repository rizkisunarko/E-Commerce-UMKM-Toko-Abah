import { api, ApiError } from './api';
import { mockRequest } from '../mocks/mockServer';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const shippingService = {
  async searchDestinations(search) {
    const trimmed = (search || '').trim();
    if (USE_MOCK) {
      const res = await mockRequest('GET', `/shipping/destinations?search=${encodeURIComponent(trimmed)}`);
      if (res.status >= 400) {
        throw new ApiError(res.status, res.body?.message || 'Data tidak valid', res.body?.errors);
      }
      return res.body;
    }
    return api.get(`/shipping/destinations?search=${encodeURIComponent(trimmed)}`);
  },

  async calculateCost(tujuanId, items) {
    const cleanItems = (Array.isArray(items) ? items : []).map((it) => ({
      product_id: Number(it.product_id || it.id),
      jumlah: Number(it.jumlah || 1),
    }));

    const payload = {
      tujuan_id: Number(tujuanId) || tujuanId,
      destination_id: String(tujuanId),
      items: cleanItems,
    };

    if (USE_MOCK) {
      const res = await mockRequest('POST', '/shipping/cost', payload);
      if (res.status >= 400) {
        throw new ApiError(res.status, res.body?.message || 'Terjadi kesalahan', res.body?.errors);
      }
      return res.body;
    }

    return api.post('/shipping/cost', payload);
  },
};

export default shippingService;
