const { createHash, timingSafeEqual } = require('node:crypto');

const SANDBOX_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const PRODUCTION_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';

function getSnapUrl(serverKey) {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    (typeof serverKey === 'string' &&
     serverKey.startsWith('Mid-server-') &&
     !serverKey.toLowerCase().includes('sandbox'));
  return isProd ? PRODUCTION_SNAP_URL : SANDBOX_SNAP_URL;
}

class MidtransError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'MidtransError';
    this.statusCode = statusCode;
  }
}

function createMidtransSnapClient({
  serverKey = () => process.env.MIDTRANS_SERVER_KEY,
  clientKey = () => process.env.MIDTRANS_CLIENT_KEY,
  fetchImpl = globalThis.fetch,
} = {}) {
  function getKeys() {
    const server = typeof serverKey === 'function' ? serverKey() : serverKey;
    const client = typeof clientKey === 'function' ? clientKey() : clientKey;
    return {
      server: typeof server === 'string' ? server.trim() : '',
      client: typeof client === 'string' ? client.trim() : '',
    };
  }

  function isConfigured() {
    const keys = getKeys();
    return Boolean(keys.server && keys.client);
  }

  function isNotificationConfigured() {
    return Boolean(getKeys().server);
  }

  async function createTransaction(parameter) {
    const keys = getKeys();
    if (!keys.server || !keys.client) {
      throw new MidtransError(
        'MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY belum diatur pada backend/.env.',
        503,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetchImpl(getSnapUrl(keys.server), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${keys.server}:`).toString('base64')}`,
        },
        body: JSON.stringify(parameter),
        signal: controller.signal,
      });
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'Midtrans tidak merespons dalam batas waktu.'
        : 'Tidak dapat terhubung ke Midtrans.';
      throw new MidtransError(message);
    } finally {
      clearTimeout(timeout);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new MidtransError('Respons Midtrans tidak dapat dibaca.');
    }

    if (!response.ok) {
      const details = Array.isArray(payload.error_messages)
        ? payload.error_messages
          .filter((message) => typeof message === 'string')
          .slice(0, 2)
          .map((message) => message.slice(0, 200))
          .join(' ')
        : '';
      throw new MidtransError(
        `Midtrans menolak pembuatan transaksi (HTTP ${response.status})${
          details ? `: ${details}` : '. Periksa Server Key dan izin Snap Checkout Write.'
        }`,
      );
    }
    if (typeof payload.token !== 'string' || typeof payload.redirect_url !== 'string') {
      throw new MidtransError('Respons Snap Midtrans tidak lengkap.');
    }
    return { token: payload.token, redirectUrl: payload.redirect_url };
  }

  function verifyNotification(notification) {
    const { server } = getKeys();
    if (!server || !notification || typeof notification !== 'object') return false;
    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
    } = notification;
    if ([orderId, statusCode, grossAmount, signature].some(
      (value) => typeof value !== 'string' || !value,
    )) {
      return false;
    }

    const expected = createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${server}`)
      .digest();
    let received;
    try {
      received = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  return {
    createTransaction,
    getClientKey: () => getKeys().client,
    isConfigured,
    isNotificationConfigured,
    verifyNotification,
  };
}

module.exports = { createMidtransSnapClient, MidtransError };
