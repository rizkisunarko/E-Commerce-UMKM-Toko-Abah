const API_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';
const COURIERS = [
  'jne',
  'sicepat',
  'ide',
  'sap',
  'ninja',
  'jnt',
  'tiki',
  'wahana',
  'pos',
  'sentral',
  'lion',
  'rex',
  'spx',
];

class RajaOngkirError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'RajaOngkirError';
    this.statusCode = statusCode;
  }
}

function destinationLabel(destination) {
  if (typeof destination.label === 'string' && destination.label.trim()) {
    return destination.label.trim();
  }
  return [
    destination.subdistrict_name,
    destination.district_name,
    destination.city_name,
    destination.province_name,
  ].filter(Boolean).join(', ');
}

function destinationId(destination) {
  return destination.id ?? destination.destination_id;
}

function normalizeDestination(destination) {
  if (!destination || typeof destination !== 'object') {
    throw new RajaOngkirError('Format data tujuan dari RajaOngkir tidak dikenali.');
  }
  const id = destinationId(destination);
  if (id === undefined || id === null || !destinationLabel(destination)) {
    throw new RajaOngkirError('Format data tujuan dari RajaOngkir tidak dikenali.');
  }
  return {
    id: String(id),
    label: destinationLabel(destination),
    province_name: destination.province_name,
    city_name: destination.city_name,
    district_name: destination.district_name,
    subdistrict_name: destination.subdistrict_name,
  };
}

function normalizeRate(rate, index) {
  if (!rate || typeof rate !== 'object') {
    throw new RajaOngkirError('Format tarif dari RajaOngkir tidak dikenali.');
  }
  const cost = Number(
    typeof rate.cost === 'object' && rate.cost !== null
      ? rate.cost.value
      : rate.cost,
  );
  if (!Number.isFinite(cost) || cost < 0) {
    throw new RajaOngkirError('Format tarif dari RajaOngkir tidak dikenali.');
  }
  const code = String(rate.code ?? rate.courier_code ?? '').toLowerCase();
  const service = String(rate.service ?? rate.service_name ?? '').trim();
  const name = String(rate.name ?? rate.courier_name ?? code).trim();
  if (!code || !service || !name) {
    throw new RajaOngkirError('Format layanan kurir dari RajaOngkir tidak dikenali.');
  }
  return {
    id: `${code}:${service}:${index}`,
    courier_code: code,
    courier_name: name,
    service,
    description: String(rate.description ?? ''),
    cost,
    etd: String(rate.etd ?? ''),
  };
}

function createRajaOngkirClient({
  apiKey = () => process.env.RAJAONGKIR_API_KEY,
  fetchImpl = globalThis.fetch,
} = {}) {
  let originIdPromise;

  async function request(path, { method = 'GET', query, body } = {}) {
    const key = typeof apiKey === 'function' ? apiKey() : apiKey;
    if (typeof key !== 'string' || !key.trim()) {
      throw new RajaOngkirError(
        'RAJAONGKIR_API_KEY belum diatur pada backend/.env.',
        503,
      );
    }

    const url = new URL(`${API_BASE_URL}/${path}`);
    for (const [name, value] of Object.entries(query || {})) {
      url.searchParams.set(name, String(value));
    }
    const headers = { Accept: 'application/json', key: key.trim() };
    const options = { method, headers };
    if (body) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.body = new URLSearchParams(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetchImpl(url, { ...options, signal: controller.signal });
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'RajaOngkir tidak merespons dalam batas waktu.'
        : 'Tidak dapat terhubung ke RajaOngkir.';
      throw new RajaOngkirError(message);
    } finally {
      clearTimeout(timeout);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new RajaOngkirError('Respons RajaOngkir tidak dapat dibaca.');
    }
    const upstreamStatus = Number(payload?.meta?.code) || response.status;
    if (!response.ok || payload?.meta?.status === 'error') {
      if (upstreamStatus === 401 || upstreamStatus === 403) {
        throw new RajaOngkirError(
          'RajaOngkir menolak API key. Periksa key Shipping Cost Sandbox di backend/.env.',
          502,
        );
      }
      if (upstreamStatus === 400 || upstreamStatus === 422) {
        throw new RajaOngkirError(
          'Alamat tujuan atau data pengiriman tidak valid. Pilih alamat dari hasil pencarian.',
          422,
        );
      }
      throw new RajaOngkirError(
        'RajaOngkir gagal memproses permintaan. Periksa data tujuan dan konfigurasi akun.',
      );
    }
    if (!Array.isArray(payload?.data)) {
      throw new RajaOngkirError('Format respons RajaOngkir tidak dikenali.');
    }
    return payload.data;
  }

  async function searchDestinations(search) {
    const data = await request('destination/domestic-destination', {
      query: { search, limit: 10, offset: 0 },
    });
    return data.map(normalizeDestination);
  }

  async function getOriginId() {
    if (!originIdPromise) {
      originIdPromise = searchDestinations('Kamal').then((destinations) => {
        const match = destinations.find((destination) => {
          const label = [
            destination.label,
            destination.province_name,
            destination.city_name,
            destination.district_name,
            destination.subdistrict_name,
          ].filter(Boolean).join(' ').toLowerCase();
          return label.includes('kamal') && label.includes('bangkalan');
        });
        if (!match) {
          throw new RajaOngkirError(
            'Lokasi asal Kamal, Bangkalan tidak ditemukan di RajaOngkir.',
            503,
          );
        }
        return match.id;
      }).catch((error) => {
        originIdPromise = null;
        throw error;
      });
    }
    return originIdPromise;
  }

  async function calculateDomesticCost({ destination, weight }) {
    const origin = await getOriginId();
    const data = await request('calculate/domestic-cost', {
      method: 'POST',
      body: {
        origin,
        destination,
        weight,
        courier: COURIERS.join(':'),
      },
    });
    return data.map(normalizeRate);
  }

  return { searchDestinations, calculateDomesticCost };
}

module.exports = { createRajaOngkirClient };
