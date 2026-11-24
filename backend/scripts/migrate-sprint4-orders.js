require('dotenv').config();
const db = require('../src/config/db');

async function main() {
  try {
    const [statusColumns] = await db.query(
      "SHOW COLUMNS FROM transaksi LIKE 'status_transaksi'",
    );
    if (statusColumns.length && !statusColumns[0].Type.includes("'dibayar'")) {
      await db.query(
        `ALTER TABLE transaksi
         MODIFY COLUMN status_transaksi
         ENUM('menunggu','dibayar','diproses','siap_diambil','siap_dikirim','selesai','batal')
         COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu'`,
      );
      console.log("Status 'dibayar' berhasil ditambahkan ke enum status_transaksi.");
    } else {
      console.log("Status 'dibayar' sudah tersedia di enum status_transaksi.");
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(`Migrasi status transaksi gagal: ${error.message}`);
  process.exitCode = 1;
});
