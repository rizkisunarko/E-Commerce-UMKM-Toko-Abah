require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ulasan_produk (
        id_ulasan int NOT NULL AUTO_INCREMENT,
        id_produk int NOT NULL,
        id_transaksi int DEFAULT NULL,
        nama_pengulas varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        rating tinyint UNSIGNED NOT NULL,
        komentar text COLLATE utf8mb4_unicode_ci NOT NULL,
        terverifikasi tinyint(1) NOT NULL DEFAULT '0',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_ulasan),
        KEY idx_ulasan_produk (id_produk, created_at),
        UNIQUE KEY uq_ulasan_transaksi_produk (id_transaksi, id_produk),
        CONSTRAINT fk_ulasan_produk FOREIGN KEY (id_produk) REFERENCES produk (id_produk) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_ulasan_transaksi FOREIGN KEY (id_transaksi) REFERENCES transaksi (id_transaksi) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Tabel ulasan_produk siap digunakan.');
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(`Migrasi ulasan gagal: ${error.message}`);
  process.exitCode = 1;
});
