-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 07, 2026 at 02:11 PM
-- Server version: 8.4.8
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `toko_abah`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id_admin` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id_admin`, `username`, `password`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$g.YcWfo6b4RjHmw0nBOt4.cq4pAEWuWtD85ZfZhBCBkdDd2eLjRzG', '2026-11-07 19:56:36', '2026-11-07 20:07:40'),
(2, 'admin_contoh', '$2b$10$g.YcWfo6b4RjHmw0nBOt4.cq4pAEWuWtD85ZfZhBCBkdDd2eLjRzG', '2026-11-07 20:32:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `detail_pembelian`
--

CREATE TABLE `detail_pembelian` (
  `id_detail_pembelian` int NOT NULL,
  `id_pembelian` int NOT NULL,
  `id_produk` int NOT NULL,
  `jumlah` decimal(12,3) NOT NULL,
  `harga_beli` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detail_transaksi`
--

CREATE TABLE `detail_transaksi` (
  `id_detail_transaksi` int NOT NULL,
  `id_transaksi` int NOT NULL,
  `id_produk` int NOT NULL,
  `jumlah` decimal(12,3) NOT NULL,
  `harga_satuan` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id_kategori` int NOT NULL,
  `nama_kategori` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id_kategori`, `nama_kategori`, `deskripsi`, `created_at`, `updated_at`) VALUES
(1, 'Beras & Tepung', NULL, '2026-11-07 20:39:29', NULL),
(2, 'Minyak & Bumbu', NULL, '2026-11-07 20:39:29', NULL),
(3, 'Gula & Pemanis', NULL, '2026-11-07 20:39:29', NULL),
(4, 'Telur & Lauk', NULL, '2026-11-07 20:39:29', NULL),
(5, 'Makanan Instan', NULL, '2026-11-07 20:39:29', NULL),
(6, 'Minuman', NULL, '2026-11-07 20:39:29', NULL),
(7, 'Kebutuhan Rumah', NULL, '2026-11-07 20:39:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kurir`
--

CREATE TABLE `kurir` (
  `id_kurir` int NOT NULL,
  `nama_kurir` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode_kurir` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pegawai`
--

CREATE TABLE `pegawai` (
  `id_pegawai` int NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('aktif','nonaktif') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'aktif',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pegawai`
--

INSERT INTO `pegawai` (`id_pegawai`, `nama`, `username`, `password`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Pegawai Contoh', 'pegawai_contoh', '$2b$10$/VVMg.LTE1N7xZVHrNAEUejZjpn89nczXmFepz3dmCDK4Sml4IFVm', 'aktif', '2026-11-07 20:32:36', NULL),
(2, 'Pegawai Toko', 'pegawai', '$2b$10$b8pqRa5189ZwLfxtBRacn.cWZzJ5wqfG/EfZ4a3pTbwvipO5flmG2', 'aktif', '2026-11-07 20:39:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pemasok`
--

CREATE TABLE `pemasok` (
  `id_pemasok` int NOT NULL,
  `nama_pemasok` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_perusahaan` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telepon` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int NOT NULL,
  `id_transaksi` int NOT NULL,
  `metode_pembayaran` enum('tunai','QRIS','payment_gateway') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jumlah_bayar` decimal(12,2) NOT NULL,
  `status_pembayaran` enum('menunggu','berhasil','gagal') COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu',
  `kode_referensi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_pembayaran` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembelian_stok`
--

CREATE TABLE `pembelian_stok` (
  `id_pembelian` int NOT NULL,
  `id_pemasok` int NOT NULL,
  `id_admin` int DEFAULT NULL,
  `id_user` int DEFAULT NULL,
  `kode_pembelian` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_pembelian` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_pembelian` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status_pembelian` enum('draft','diterima','dibatalkan') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `keterangan` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengiriman`
--

CREATE TABLE `pengiriman` (
  `id_pengiriman` int NOT NULL,
  `id_transaksi` int NOT NULL,
  `id_kurir` int DEFAULT NULL,
  `alamat_tujuan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `layanan_kurir` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ongkos_kirim` decimal(12,2) NOT NULL DEFAULT '0.00',
  `nomor_resi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_pengiriman` enum('menunggu','dikirim','diterima','gagal') COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu',
  `tanggal_pengiriman` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id_produk` int NOT NULL,
  `id_kategori` int NOT NULL,
  `kode_produk` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_produk` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `harga_beli` decimal(12,2) NOT NULL,
  `harga_jual` decimal(12,2) NOT NULL,
  `satuan` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto_produk` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_produk` enum('tersedia','habis') COLLATE utf8mb4_unicode_ci DEFAULT 'tersedia',
  `jumlah_stok` decimal(12,3) NOT NULL DEFAULT '0.000',
  `batas_stok_minimum` decimal(12,3) NOT NULL DEFAULT '0.000',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id_produk`, `id_kategori`, `kode_produk`, `nama_produk`, `deskripsi`, `harga_beli`, `harga_jual`, `satuan`, `foto_produk`, `status_produk`, `jumlah_stok`, `batas_stok_minimum`, `created_at`, `updated_at`) VALUES
(1, 1, 'CONTOH-001', 'Beras 5 kg', NULL, '0.00', '68000.00', '5 kg', NULL, 'tersedia', '3.990', '10.000', '2026-11-07 20:39:29', '2026-11-07 21:10:18'),
(2, 3, 'CONTOH-003', 'Gula Pasir 1 kg', NULL, '0.00', '17000.00', '1 kg', NULL, 'tersedia', '5.000', '10.000', '2026-11-07 20:39:29', NULL),
(3, 7, 'CONTOH-007', 'Sabun Mandi', NULL, '0.00', '3500.00', '100 g', NULL, 'tersedia', '12.000', '5.000', '2026-11-07 20:39:29', NULL),
(4, 5, 'CONTOH-005', 'Mie Instan', NULL, '0.00', '3500.00', '80 g', NULL, 'tersedia', '48.000', '5.000', '2026-11-07 20:39:29', NULL),
(5, 6, 'CONTOH-006', 'Kopi Sachet', NULL, '0.00', '1500.00', '20 g', NULL, 'tersedia', '30.000', '5.000', '2026-11-07 20:39:29', NULL),
(6, 6, 'CONTOH-008', 'Teh Celup', NULL, '0.00', '8000.00', '100 g', NULL, 'tersedia', '15.000', '5.000', '2026-11-07 20:39:29', NULL),
(7, 2, 'CONTOH-002', 'Minyak Goreng 1 L', NULL, '0.00', '18000.00', '1 L', NULL, 'tersedia', '3.000', '10.000', '2026-11-07 20:39:29', NULL),
(8, 4, 'CONTOH-004', 'Telur Ayam 1 kg', NULL, '0.00', '30000.00', '1 kg', NULL, 'tersedia', '20.000', '5.000', '2026-11-07 20:39:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_stok`
--

CREATE TABLE `riwayat_stok` (
  `id_riwayat` int NOT NULL,
  `id_produk` int NOT NULL,
  `id_admin` int DEFAULT NULL,
  `id_user` int DEFAULT NULL,
  `jenis_perubahan` enum('masuk','keluar','penyesuaian') COLLATE utf8mb4_unicode_ci NOT NULL,
  `jumlah` decimal(12,3) NOT NULL,
  `stok_sebelum` decimal(12,3) NOT NULL,
  `stok_sesudah` decimal(12,3) NOT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `riwayat_stok`
--

INSERT INTO `riwayat_stok` (`id_riwayat`, `id_produk`, `id_admin`, `id_user`, `jenis_perubahan`, `jumlah`, `stok_sebelum`, `stok_sesudah`, `keterangan`, `tanggal`) VALUES
(1, 1, 2, NULL, 'keluar', '1.000', '4.000', '3.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:40:15'),
(2, 1, 2, NULL, 'masuk', '1.000', '3.000', '4.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:40:15'),
(5, 1, 2, NULL, 'keluar', '1.000', '4.000', '3.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:45:19'),
(6, 1, 2, NULL, 'masuk', '1.000', '3.000', '4.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:45:19'),
(8, 1, 1, NULL, 'masuk', '4.000', '0.000', '4.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(9, 7, 1, NULL, 'masuk', '3.000', '0.000', '3.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(10, 2, 1, NULL, 'masuk', '5.000', '0.000', '5.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(11, 8, 1, NULL, 'masuk', '20.000', '0.000', '20.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(12, 4, 1, NULL, 'masuk', '48.000', '0.000', '48.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(13, 5, 1, NULL, 'masuk', '30.000', '0.000', '30.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(14, 3, 1, NULL, 'masuk', '12.000', '0.000', '12.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(15, 6, 1, NULL, 'masuk', '15.000', '0.000', '15.000', 'Stok awal data contoh', '2026-11-07 20:45:56'),
(23, 1, 2, NULL, 'keluar', '1.000', '4.000', '3.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:46:10'),
(24, 1, 2, NULL, 'masuk', '1.000', '3.000', '4.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:46:10'),
(26, 1, NULL, NULL, 'keluar', '1.000', '4.000', '3.000', 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-07 21:07:24'),
(27, 1, 2, NULL, 'masuk', '1.000', '3.000', '4.000', 'Penyesuaian stok melalui aplikasi', '2026-11-07 21:07:24'),
(28, 1, NULL, NULL, 'keluar', '0.010', '4.000', '3.990', 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-07 21:10:18');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id_transaksi` int NOT NULL,
  `id_admin` int DEFAULT NULL,
  `id_user` int DEFAULT NULL,
  `kode_transaksi` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_transaksi` enum('kasir','online') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_pelanggan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `no_telepon` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_pelanggan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat_pelanggan` text COLLATE utf8mb4_unicode_ci,
  `metode_penerimaan` enum('pickup','kurir') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pickup',
  `subtotal_produk` decimal(12,2) NOT NULL DEFAULT '0.00',
  `ongkos_kirim` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_bayar` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status_transaksi` enum('menunggu','diproses','siap_diambil','siap_dikirim','selesai','batal') COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu',
  `tanggal_transaksi` datetime DEFAULT CURRENT_TIMESTAMP,
  `catatan` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telepon` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  ADD PRIMARY KEY (`id_detail_pembelian`),
  ADD KEY `fk_detail_pembelian_header` (`id_pembelian`),
  ADD KEY `fk_detail_pembelian_produk` (`id_produk`);

--
-- Indexes for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD PRIMARY KEY (`id_detail_transaksi`),
  ADD KEY `fk_detail_transaksi_header` (`id_transaksi`),
  ADD KEY `fk_detail_transaksi_produk` (`id_produk`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id_kategori`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`);

--
-- Indexes for table `kurir`
--
ALTER TABLE `kurir`
  ADD PRIMARY KEY (`id_kurir`),
  ADD UNIQUE KEY `kode_kurir` (`kode_kurir`);

--
-- Indexes for table `pegawai`
--
ALTER TABLE `pegawai`
  ADD PRIMARY KEY (`id_pegawai`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `pemasok`
--
ALTER TABLE `pemasok`
  ADD PRIMARY KEY (`id_pemasok`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD KEY `fk_pembayaran_transaksi` (`id_transaksi`);

--
-- Indexes for table `pembelian_stok`
--
ALTER TABLE `pembelian_stok`
  ADD PRIMARY KEY (`id_pembelian`),
  ADD UNIQUE KEY `kode_pembelian` (`kode_pembelian`),
  ADD KEY `fk_pembelian_pemasok` (`id_pemasok`),
  ADD KEY `fk_pembelian_admin` (`id_admin`),
  ADD KEY `fk_pembelian_user` (`id_user`);

--
-- Indexes for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id_pengiriman`),
  ADD UNIQUE KEY `id_transaksi` (`id_transaksi`),
  ADD KEY `fk_pengiriman_kurir` (`id_kurir`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id_produk`),
  ADD UNIQUE KEY `kode_produk` (`kode_produk`),
  ADD KEY `fk_produk_kategori` (`id_kategori`);

--
-- Indexes for table `riwayat_stok`
--
ALTER TABLE `riwayat_stok`
  ADD PRIMARY KEY (`id_riwayat`),
  ADD KEY `fk_riwayat_produk` (`id_produk`),
  ADD KEY `fk_riwayat_admin` (`id_admin`),
  ADD KEY `fk_riwayat_user` (`id_user`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id_transaksi`),
  ADD UNIQUE KEY `kode_transaksi` (`kode_transaksi`),
  ADD KEY `fk_transaksi_admin` (`id_admin`),
  ADD KEY `fk_transaksi_user` (`id_user`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  MODIFY `id_detail_pembelian` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  MODIFY `id_detail_transaksi` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `kurir`
--
ALTER TABLE `kurir`
  MODIFY `id_kurir` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pegawai`
--
ALTER TABLE `pegawai`
  MODIFY `id_pegawai` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `pemasok`
--
ALTER TABLE `pemasok`
  MODIFY `id_pemasok` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembelian_stok`
--
ALTER TABLE `pembelian_stok`
  MODIFY `id_pembelian` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengiriman`
--
ALTER TABLE `pengiriman`
  MODIFY `id_pengiriman` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id_produk` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `riwayat_stok`
--
ALTER TABLE `riwayat_stok`
  MODIFY `id_riwayat` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_transaksi` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pembelian`
--
ALTER TABLE `detail_pembelian`
  ADD CONSTRAINT `fk_detail_pembelian_header` FOREIGN KEY (`id_pembelian`) REFERENCES `pembelian_stok` (`id_pembelian`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_pembelian_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `detail_transaksi`
--
ALTER TABLE `detail_transaksi`
  ADD CONSTRAINT `fk_detail_transaksi_header` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_transaksi_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `fk_pembayaran_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pembelian_stok`
--
ALTER TABLE `pembelian_stok`
  ADD CONSTRAINT `fk_pembelian_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pembelian_pemasok` FOREIGN KEY (`id_pemasok`) REFERENCES `pemasok` (`id_pemasok`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pembelian_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD CONSTRAINT `fk_pengiriman_kurir` FOREIGN KEY (`id_kurir`) REFERENCES `kurir` (`id_kurir`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengiriman_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `fk_produk_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_stok`
--
ALTER TABLE `riwayat_stok`
  ADD CONSTRAINT `fk_riwayat_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_riwayat_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `fk_transaksi_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaksi_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
