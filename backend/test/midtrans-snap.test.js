const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { createMidtransSnapClient } = require('../src/services/midtransSnap');

test('Snap client menggunakan endpoint Sandbox dan autentikasi Server Key', async () => {
  let request;
  const client = createMidtransSnapClient({
    serverKey: 'sandbox-server-key',
    clientKey: 'sandbox-client-key',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        async json() {
          return { token: 'snap-token', redirect_url: 'https://sandbox.example/redirect' };
        },
      };
    },
  });

  const result = await client.createTransaction({
    transaction_details: { order_id: 'TA-123', gross_amount: 10000 },
  });

  assert.equal(request.url, 'https://app.sandbox.midtrans.com/snap/v1/transactions');
  assert.equal(
    request.options.headers.Authorization,
    `Basic ${Buffer.from('sandbox-server-key:').toString('base64')}`,
  );
  assert.equal(result.token, 'snap-token');
  assert.equal(client.getClientKey(), 'sandbox-client-key');
});

test('Snap client memverifikasi signature notifikasi dengan Server Key Midtrans', () => {
  const serverKey = 'sandbox-server-key';
  const notification = {
    order_id: 'TA-123-attempt',
    status_code: '200',
    gross_amount: '10000.00',
  };
  notification.signature_key = createHash('sha512')
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`,
    )
    .digest('hex');
  const client = createMidtransSnapClient({
    serverKey,
    clientKey: 'sandbox-client-key',
  });

  assert.equal(client.verifyNotification(notification), true);
  assert.equal(client.verifyNotification({ ...notification, gross_amount: '1.00' }), false);
  assert.equal(client.verifyNotification({ ...notification, signature_key: 'invalid' }), false);
});

test('Snap notification requires a configured Server Key', () => {
  const client = createMidtransSnapClient({
    clientKey: 'sandbox-client-key',
  });

  assert.equal(client.isNotificationConfigured(), false);
  assert.equal(client.verifyNotification({}), false);
});

test('Snap client menolak membuat transaksi jika key belum diatur', async () => {
  const client = createMidtransSnapClient({ serverKey: '', clientKey: '' });

  await assert.rejects(
    () => client.createTransaction({}),
    { statusCode: 503, message: /MIDTRANS_SERVER_KEY/ },
  );
});
