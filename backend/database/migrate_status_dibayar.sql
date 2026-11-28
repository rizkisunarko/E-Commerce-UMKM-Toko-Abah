-- Migrasi aman untuk memastikan enum status_transaksi memuat 'dibayar'
-- Cara menjalankan:
-- 1. Melalui MySQL CLI: mysql -u root -p toko_abah < backend/database/migrate_status_dibayar.sql
-- 2. Atau melalui Node script: node backend/scripts/migrate-sprint4-orders.js

ALTER TABLE `transaksi`
  MODIFY COLUMN `status_transaksi`
  ENUM('menunggu','dibayar','diproses','siap_diambil','siap_dikirim','selesai','batal')
  COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu';
