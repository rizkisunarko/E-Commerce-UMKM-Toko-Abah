const PAYMENT_DEADLINE_HOURS = 24;
const PAYMENT_DEADLINE_MS = PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000;

function getPaymentDeadlineIso(rawDate, metodePembayaran) {
  if (metodePembayaran === 'cod') return null;
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + PAYMENT_DEADLINE_MS).toISOString();
}

function isOrderPaymentExpired(row, now = new Date()) {
  if (!row) return false;
  const status = row.status ?? row.status_transaksi;
  if (status !== 'menunggu') return false;
  if (row.metode_pembayaran === 'cod') return false;
  if (row.status_pembayaran === 'berhasil') return false;
  const rawDate = row.tanggal ?? row.tanggal_transaksi;
  const createdMs = rawDate instanceof Date ? rawDate.getTime() : new Date(rawDate).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return now.getTime() >= createdMs + PAYMENT_DEADLINE_MS;
}

async function restoreOrderStock(connection, { orderId, stockReserved, adminId = null, keterangan }) {
  if (Number(stockReserved) !== 1) return;

  const [items] = await connection.query(
    'SELECT id_produk, jumlah FROM detail_transaksi WHERE id_transaksi = ?',
    [orderId],
  );

  for (const item of items) {
    const [productRows] = await connection.query(
      'SELECT id_produk, jumlah_stok FROM produk WHERE id_produk = ? FOR UPDATE',
      [item.id_produk],
    );
    if (!productRows.length) continue;

    const stockBefore = Number(productRows[0].jumlah_stok);
    const stockAfter = stockBefore + Number(item.jumlah);
    await connection.query(
      `UPDATE produk
       SET jumlah_stok = ?, status_produk = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id_produk = ?`,
      [stockAfter, stockAfter === 0 ? 'habis' : 'tersedia', item.id_produk],
    );
    await connection.query(
      `INSERT INTO riwayat_stok (
         id_produk, id_admin, jenis_perubahan, jumlah, stok_sebelum, stok_sesudah, keterangan
       ) VALUES (?, ?, 'masuk', ?, ?, ?, ?)`,
      [
        item.id_produk,
        adminId,
        Number(item.jumlah),
        stockBefore,
        stockAfter,
        keterangan,
      ],
    );
  }
}

async function expireOrderInTransaction(connection, order, { now = new Date(), force = false } = {}) {
  if (!force && !isOrderPaymentExpired(order, now)) return false;

  const orderId = order.id ?? order.id_transaksi;
  const nomorPesanan = order.nomor_pesanan ?? order.kode_transaksi;

  await restoreOrderStock(connection, {
    orderId,
    stockReserved: order.stock_reserved,
    adminId: null,
    keterangan: `Pembatalan otomatis batas waktu pembayaran 24 jam ${nomorPesanan}`,
  });

  await connection.query(
    `UPDATE pembayaran SET status_pembayaran = 'gagal'
     WHERE id_transaksi = ? AND id_pembayaran <> ? AND status_pembayaran = 'menunggu'`,
    [orderId, 0],
  );

  await connection.query(
    'UPDATE transaksi SET status_transaksi = ?, stock_reserved = 0 WHERE id_transaksi = ?',
    ['batal', orderId],
  );

  return true;
}

async function expireSingleOrderIfOverdue(db, nomorPesanan, now = new Date()) {
  if (typeof db.getConnection !== 'function') return false;

  let connection;
  let transactionStarted = false;
  try {
    connection = await db.getConnection();
    if (typeof connection.beginTransaction !== 'function') return false;
    await connection.beginTransaction();
    transactionStarted = true;

    const [orders] = await connection.query(
      `SELECT id_transaksi, kode_transaksi, status_transaksi, tanggal_transaksi, stock_reserved,
              (SELECT status_pembayaran
               FROM pembayaran
               WHERE id_transaksi = transaksi.id_transaksi
               ORDER BY id_pembayaran DESC
               LIMIT 1) AS status_pembayaran,
              (SELECT metode_pembayaran
               FROM pembayaran
               WHERE id_transaksi = transaksi.id_transaksi
               ORDER BY id_pembayaran DESC
               LIMIT 1) AS metode_pembayaran
       FROM transaksi
       WHERE kode_transaksi = ? AND jenis_transaksi = 'online'
       FOR UPDATE`,
      [nomorPesanan],
    );

    if (!orders.length) {
      await connection.rollback();
      return false;
    }

    const expired = await expireOrderInTransaction(connection, orders[0], { now });
    if (expired) {
      await connection.commit();
    } else {
      await connection.rollback();
    }
    transactionStarted = false;
    return expired;
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch {}
    }
    throw error;
  } finally {
    if (connection && typeof connection.release === 'function') {
      connection.release();
    }
  }
}

async function expireOverdueOrdersBatch(db, now = new Date()) {
  if (!db || typeof db.query !== 'function' || typeof db.getConnection !== 'function') {
    return 0;
  }
  const cutoff = new Date(now.getTime() - PAYMENT_DEADLINE_MS);
  const [candidates] = await db.query(
    `SELECT t.kode_transaksi
     FROM transaksi t
     WHERE t.jenis_transaksi = 'online'
       AND t.status_transaksi = 'menunggu'
       AND t.tanggal_transaksi <= ?
       AND COALESCE((
         SELECT pb.metode_pembayaran
         FROM pembayaran pb
         WHERE pb.id_transaksi = t.id_transaksi
         ORDER BY pb.id_pembayaran DESC
         LIMIT 1
       ), 'payment_gateway') <> 'cod'
       AND COALESCE((
         SELECT pb.status_pembayaran
         FROM pembayaran pb
         WHERE pb.id_transaksi = t.id_transaksi
         ORDER BY pb.id_pembayaran DESC
         LIMIT 1
       ), 'menunggu') <> 'berhasil'
     LIMIT 50`,
    [cutoff],
  );

  let expiredCount = 0;
  for (const row of candidates) {
    const expired = await expireSingleOrderIfOverdue(db, row.kode_transaksi, now);
    if (expired) expiredCount += 1;
  }
  return expiredCount;
}

module.exports = {
  PAYMENT_DEADLINE_HOURS,
  PAYMENT_DEADLINE_MS,
  getPaymentDeadlineIso,
  isOrderPaymentExpired,
  restoreOrderStock,
  expireOrderInTransaction,
  expireSingleOrderIfOverdue,
  expireOverdueOrdersBatch,
};
