require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  try {
    const [guestTokenColumns] = await db.query(
      "SHOW COLUMNS FROM keranjang LIKE 'guest_token_hash'",
    );
    if (guestTokenColumns.length === 0) {
      await db.query(
        'ALTER TABLE keranjang ADD COLUMN guest_token_hash CHAR(64) NULL AFTER id_user',
      );
      console.log('Kolom keranjang.guest_token_hash berhasil ditambahkan.');
    }

    const [userColumns] = await db.query("SHOW COLUMNS FROM keranjang LIKE 'id_user'");
    if (userColumns[0]?.Null === 'NO') {
      await db.query('ALTER TABLE keranjang MODIFY id_user INT NULL');
      console.log('Kolom keranjang.id_user kini dapat kosong untuk keranjang tamu.');
    }

    const [guestTokenIndexes] = await db.query(
      "SHOW INDEX FROM keranjang WHERE Key_name = 'uq_keranjang_guest_token'",
    );
    if (guestTokenIndexes.length === 0) {
      await db.query(
        'ALTER TABLE keranjang ADD UNIQUE KEY uq_keranjang_guest_token (guest_token_hash)',
      );
      console.log('Indeks unik token keranjang tamu berhasil ditambahkan.');
    }

    const [columns] = await db.query("SHOW COLUMNS FROM pengiriman LIKE 'wilayah_tujuan'");
    if (columns.length === 0) {
      await db.query(
        'ALTER TABLE pengiriman ADD COLUMN wilayah_tujuan VARCHAR(255) NULL AFTER alamat_tujuan',
      );
      console.log('Kolom pengiriman.wilayah_tujuan berhasil ditambahkan.');
    } else {
      console.log('Kolom pengiriman.wilayah_tujuan sudah tersedia.');
    }

    const [snapTokenColumns] = await db.query(
      "SHOW COLUMNS FROM pembayaran LIKE 'snap_token'",
    );
    if (snapTokenColumns.length === 0) {
      await db.query(
        'ALTER TABLE pembayaran ADD COLUMN snap_token VARCHAR(255) NULL AFTER kode_referensi',
      );
      console.log('Kolom pembayaran.snap_token berhasil ditambahkan.');
    } else {
      console.log('Kolom pembayaran.snap_token sudah tersedia.');
    }

    const [paymentMethodColumns] = await db.query(
      "SHOW COLUMNS FROM pembayaran LIKE 'metode_pembayaran'",
    );
    if (paymentMethodColumns.length &&
        !paymentMethodColumns[0].Type.includes("'cod'")) {
      await db.query(
        `ALTER TABLE pembayaran
         MODIFY COLUMN metode_pembayaran
         ENUM('tunai','QRIS','debit','payment_gateway','cod')
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL`,
      );
      console.log('Metode pembayaran COD berhasil ditambahkan.');
    } else {
      console.log('Metode pembayaran COD sudah tersedia.');
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(`Migrasi checkout gagal: ${error.message}`);
  process.exitCode = 1;
});
