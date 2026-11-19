-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 15, 2026 at 02:58 PM
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
(1, 'admin', '$2b$10$2u3Eqz7BnEa1nvwuAw3zTu0M2LP44puARYDN.FPU8sIOOyh/3Xu/S', '2026-11-07 19:56:36', '2026-11-08 14:40:02'),
(2, 'admin_contoh', '$2b$10$74Knn/u0fAU6sNFTPPYlUuUVg4SnkQjEZ2dlUwka0BzqrnS1xHQ82', '2026-11-07 20:32:36', NULL);

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

--
-- Dumping data for table `detail_transaksi`
--

INSERT INTO `detail_transaksi` (`id_detail_transaksi`, `id_transaksi`, `id_produk`, `jumlah`, `harga_satuan`, `subtotal`) VALUES
(1, 1, 4, '2.000', '3500.00', '7000.00'),
(2, 1, 5, '2.000', '1500.00', '3000.00'),
(3, 2, 5, '1.000', '1500.00', '1500.00'),
(4, 3, 4, '1.000', '3500.00', '3500.00'),
(5, 4, 4, '1.000', '3500.00', '3500.00'),
(6, 5, 6, '1.000', '8000.00', '8000.00'),
(7, 6, 2, '3.000', '19000.00', '57000.00'),
(8, 6, 4, '4.000', '3500.00', '14000.00'),
(9, 6, 7, '3.000', '18000.00', '54000.00'),
(10, 7, 4, '4.000', '3500.00', '14000.00'),
(11, 8, 2, '3.000', '19000.00', '57000.00'),
(14, 11, 5, '3.000', '1500.00', '4500.00'),
(15, 12, 4, '2.000', '3500.00', '7000.00');

-- --------------------------------------------------------

--
-- Table structure for table `item_keranjang`
--

CREATE TABLE `item_keranjang` (
  `id_item_keranjang` int NOT NULL,
  `id_keranjang` int NOT NULL,
  `id_produk` int NOT NULL,
  `jumlah` int UNSIGNED NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ;

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
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id_keranjang` int NOT NULL,
  `id_user` int DEFAULT NULL,
  `guest_token_hash` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_keranjang` enum('aktif','checkout','dikosongkan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `metode_pembayaran` enum('tunai','QRIS','debit','payment_gateway','cod') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jumlah_bayar` decimal(12,2) NOT NULL,
  `jumlah_diterima` decimal(12,2) DEFAULT NULL,
  `kembalian` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status_pembayaran` enum('menunggu','berhasil','gagal') COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu',
  `kode_referensi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snap_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_pembayaran` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id_pembayaran`, `id_transaksi`, `metode_pembayaran`, `jumlah_bayar`, `jumlah_diterima`, `kembalian`, `status_pembayaran`, `kode_referensi`, `tanggal_pembayaran`) VALUES
(1, 1, 'QRIS', '10000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:29:10'),
(2, 2, 'tunai', '1500.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:32:26'),
(3, 3, 'QRIS', '3500.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:32:49'),
(4, 4, 'tunai', '3500.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:33:21'),
(5, 5, 'QRIS', '8000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:33:36'),
(6, 6, 'tunai', '125000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:58:56'),
(7, 7, 'QRIS', '14000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 20:59:37'),
(8, 8, 'tunai', '57000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 21:01:53'),
(9, 11, 'tunai', '4500.00', '50000.00', '45500.00', 'berhasil', NULL, '2026-11-15 21:15:12'),
(10, 12, 'QRIS', '7000.00', NULL, '0.00', 'berhasil', NULL, '2026-11-15 21:16:37');

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
  `wilayah_tujuan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `archived_at` datetime DEFAULT NULL,
  `jumlah_stok` int NOT NULL DEFAULT '0',
  `batas_stok_minimum` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id_produk`, `id_kategori`, `kode_produk`, `nama_produk`, `deskripsi`, `harga_beli`, `harga_jual`, `satuan`, `foto_produk`, `status_produk`, `archived_at`, `jumlah_stok`, `batas_stok_minimum`, `created_at`, `updated_at`) VALUES
(1, 1, 'CONTOH-001', 'Beras 5 kg', NULL, '0.00', '68000.00', '5 kg', NULL, 'tersedia', '2026-11-08 13:54:12', 3, 10, '2026-11-07 20:39:29', '2026-11-08 13:54:12'),
(2, 3, 'CONTOH-003', 'Gula Pasir 1 kg', NULL, '0.00', '19000.00', '1000 g', NULL, 'tersedia', NULL, 17, 10, '2026-11-07 20:39:29', '2026-11-15 21:01:53'),
(3, 7, 'CONTOH-007', 'Sabun Mandi', NULL, '0.00', '3500.00', '100 g', NULL, 'tersedia', NULL, 12, 12, '2026-11-07 20:39:29', '2026-11-13 23:10:02'),
(4, 5, 'CONTOH-005', 'Mie Instan', NULL, '0.00', '3500.00', '80 g', NULL, 'tersedia', NULL, 34, 5, '2026-11-07 20:39:29', '2026-11-15 21:16:37'),
(5, 6, 'CONTOH-006', 'Kopi Sachet', NULL, '0.00', '1500.00', '20 g', NULL, 'tersedia', NULL, 24, 5, '2026-11-07 20:39:29', '2026-11-15 21:15:12'),
(6, 6, 'CONTOH-008', 'Teh Celup', NULL, '0.00', '8000.00', '100 g', NULL, 'tersedia', NULL, 14, 5, '2026-11-07 20:39:29', '2026-11-15 20:33:36'),
(7, 2, 'CONTOH-002', 'Minyak Goreng 1 L', NULL, '0.00', '18000.00', '1000 g', NULL, 'tersedia', NULL, 14, 12, '2026-11-07 20:39:29', '2026-11-15 20:58:56'),
(8, 4, 'CONTOH-004', 'Telur Ayam 1 kg', NULL, '0.00', '30000.00', '1000 g', NULL, 'tersedia', NULL, 4, 6, '2026-11-07 20:39:29', '2026-11-13 23:10:18');

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
  `jumlah` int NOT NULL,
  `stok_sebelum` int NOT NULL,
  `stok_sesudah` int NOT NULL,
  `keterangan` text COLLATE utf8mb4_unicode_ci,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `riwayat_stok`
--

INSERT INTO `riwayat_stok` (`id_riwayat`, `id_produk`, `id_admin`, `id_user`, `jenis_perubahan`, `jumlah`, `stok_sebelum`, `stok_sesudah`, `keterangan`, `tanggal`) VALUES
(1, 1, 2, NULL, 'keluar', 1, 4, 3, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:40:15'),
(2, 1, 2, NULL, 'masuk', 1, 3, 4, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:40:15'),
(5, 1, 2, NULL, 'keluar', 1, 4, 3, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:45:19'),
(6, 1, 2, NULL, 'masuk', 1, 3, 4, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:45:19'),
(8, 1, 1, NULL, 'masuk', 4, 0, 4, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(9, 7, 1, NULL, 'masuk', 3, 0, 3, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(10, 2, 1, NULL, 'masuk', 5, 0, 5, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(11, 8, 1, NULL, 'masuk', 20, 0, 20, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(12, 4, 1, NULL, 'masuk', 48, 0, 48, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(13, 5, 1, NULL, 'masuk', 30, 0, 30, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(14, 3, 1, NULL, 'masuk', 12, 0, 12, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(15, 6, 1, NULL, 'masuk', 15, 0, 15, 'Stok awal data contoh', '2026-11-07 20:45:56'),
(23, 1, 2, NULL, 'keluar', 1, 4, 3, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:46:10'),
(24, 1, 2, NULL, 'masuk', 1, 3, 4, 'Penyesuaian stok melalui aplikasi', '2026-11-07 20:46:10'),
(26, 1, NULL, NULL, 'keluar', 1, 4, 3, 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-07 21:07:24'),
(27, 1, 2, NULL, 'masuk', 1, 3, 4, 'Penyesuaian stok melalui aplikasi', '2026-11-07 21:07:24'),
(28, 1, NULL, NULL, 'keluar', 0, 4, 3, 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-07 21:10:18'),
(29, 2, 1, NULL, 'masuk', 194, 5, 199, 'Penyesuaian stok saat mengubah produk', '2026-11-08 14:57:16'),
(30, 2, 1, NULL, 'keluar', 0, 199, 198, 'Penyesuaian stok saat mengubah produk', '2026-11-08 14:58:09'),
(31, 2, NULL, NULL, 'keluar', 0, 198, 198, 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-08 14:59:25'),
(32, 2, NULL, NULL, 'keluar', 182, 198, 16, 'Penyesuaian stok oleh pegawai Pegawai Toko (ID 2)', '2026-11-08 15:03:03'),
(33, 2, 1, NULL, 'keluar', 8, 16, 8, 'Penyesuaian stok saat mengubah produk', '2026-11-08 15:17:22'),
(34, 2, 1, NULL, 'masuk', 15, 8, 23, 'Penyesuaian stok saat mengubah produk', '2026-11-08 15:17:39'),
(35, 2, 1, NULL, 'masuk', 2, 23, 25, 'Penyesuaian stok melalui aplikasi', '2026-11-08 15:18:04'),
(36, 2, 1, NULL, 'keluar', 2, 25, 23, 'Penyesuaian stok melalui aplikasi', '2026-11-08 15:55:27'),
(37, 7, 1, NULL, 'masuk', 2, 3, 5, 'Penyesuaian stok melalui aplikasi', '2026-11-08 15:58:59'),
(38, 7, 1, NULL, 'masuk', 12, 5, 17, 'Penyesuaian stok melalui aplikasi', '2026-11-08 15:59:39'),
(39, 8, 1, NULL, 'keluar', 16, 20, 4, 'Penyesuaian stok melalui aplikasi', '2026-11-13 22:53:33'),
(40, 4, 1, NULL, 'keluar', 2, 48, 46, 'Penjualan kasir TRX-1794749350133-0ef4bdcd51fb oleh admin', '2026-11-15 20:29:10'),
(41, 5, 1, NULL, 'keluar', 2, 30, 28, 'Penjualan kasir TRX-1794749350133-0ef4bdcd51fb oleh admin', '2026-11-15 20:29:10'),
(42, 5, 1, NULL, 'keluar', 1, 28, 27, 'Penjualan kasir TRX-1794749546361-9e24fba4be44 oleh admin', '2026-11-15 20:32:26'),
(43, 4, 1, NULL, 'keluar', 1, 46, 45, 'Penjualan kasir TRX-1794749569228-535e1c554d3c oleh admin', '2026-11-15 20:32:49'),
(44, 4, 1, NULL, 'keluar', 1, 45, 44, 'Penjualan kasir TRX-1794749601139-71c7a2ca6322 oleh admin', '2026-11-15 20:33:21'),
(45, 6, 1, NULL, 'keluar', 1, 15, 14, 'Penjualan kasir TRX-1794749616395-3a614f39c028 oleh admin', '2026-11-15 20:33:36'),
(46, 2, NULL, NULL, 'keluar', 3, 23, 20, 'Penjualan kasir TRX-1794751135979-9d47cfd5e857 oleh Pegawai Toko', '2026-11-15 20:58:56'),
(47, 4, NULL, NULL, 'keluar', 4, 44, 40, 'Penjualan kasir TRX-1794751135979-9d47cfd5e857 oleh Pegawai Toko', '2026-11-15 20:58:56'),
(48, 7, NULL, NULL, 'keluar', 3, 17, 14, 'Penjualan kasir TRX-1794751135979-9d47cfd5e857 oleh Pegawai Toko', '2026-11-15 20:58:56'),
(49, 4, NULL, NULL, 'keluar', 4, 40, 36, 'Penjualan kasir TRX-1794751177380-d8ebb1306069 oleh Pegawai Toko', '2026-11-15 20:59:37'),
(50, 2, NULL, NULL, 'keluar', 3, 20, 17, 'Penjualan kasir TRX-1794751313821-9be0f9abb5d7 oleh Pegawai Toko', '2026-11-15 21:01:53'),
(53, 5, NULL, NULL, 'keluar', 3, 27, 24, 'Penjualan kasir TRX-1794752112115-69119ceb295c oleh Pegawai Toko', '2026-11-15 21:15:12'),
(54, 4, NULL, NULL, 'keluar', 2, 36, 34, 'Penjualan kasir TRX-1794752197243-5f8b02677b0b oleh Pegawai Toko', '2026-11-15 21:16:37');

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

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`id_transaksi`, `id_admin`, `id_user`, `kode_transaksi`, `jenis_transaksi`, `nama_pelanggan`, `no_telepon`, `email_pelanggan`, `alamat_pelanggan`, `metode_penerimaan`, `subtotal_produk`, `ongkos_kirim`, `total_bayar`, `status_transaksi`, `tanggal_transaksi`, `catatan`) VALUES
(1, 1, NULL, 'TRX-1794749350133-0ef4bdcd51fb', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '10000.00', '0.00', '10000.00', 'selesai', '2026-11-15 20:29:10', 'Transaksi kasir oleh admin'),
(2, 1, NULL, 'TRX-1794749546361-9e24fba4be44', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '1500.00', '0.00', '1500.00', 'selesai', '2026-11-15 20:32:26', 'Transaksi kasir oleh admin'),
(3, 1, NULL, 'TRX-1794749569228-535e1c554d3c', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '3500.00', '0.00', '3500.00', 'selesai', '2026-11-15 20:32:49', 'Transaksi kasir oleh admin'),
(4, 1, NULL, 'TRX-1794749601139-71c7a2ca6322', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '3500.00', '0.00', '3500.00', 'selesai', '2026-11-15 20:33:21', 'Transaksi kasir oleh admin'),
(5, 1, NULL, 'TRX-1794749616395-3a614f39c028', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '8000.00', '0.00', '8000.00', 'selesai', '2026-11-15 20:33:36', 'Transaksi kasir oleh admin'),
(6, NULL, NULL, 'TRX-1794751135979-9d47cfd5e857', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '125000.00', '0.00', '125000.00', 'selesai', '2026-11-15 20:58:55', 'Transaksi kasir oleh Pegawai Toko'),
(7, NULL, NULL, 'TRX-1794751177380-d8ebb1306069', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '14000.00', '0.00', '14000.00', 'selesai', '2026-11-15 20:59:37', 'Transaksi kasir oleh Pegawai Toko'),
(8, NULL, NULL, 'TRX-1794751313821-9be0f9abb5d7', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '57000.00', '0.00', '57000.00', 'selesai', '2026-11-15 21:01:53', 'Transaksi kasir oleh Pegawai Toko'),
(11, NULL, NULL, 'TRX-1794752112115-69119ceb295c', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '4500.00', '0.00', '4500.00', 'selesai', '2026-11-15 21:15:12', 'Transaksi kasir oleh Pegawai Toko'),
(12, NULL, NULL, 'TRX-1794752197243-5f8b02677b0b', 'kasir', NULL, NULL, NULL, NULL, 'pickup', '7000.00', '0.00', '7000.00', 'selesai', '2026-11-15 21:16:37', 'Transaksi kasir oleh Pegawai Toko');

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
-- Indexes for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  ADD PRIMARY KEY (`id_item_keranjang`),
  ADD UNIQUE KEY `uq_item_keranjang_produk` (`id_keranjang`,`id_produk`),
  ADD KEY `fk_item_keranjang_produk` (`id_produk`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id_kategori`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id_keranjang`),
  ADD UNIQUE KEY `uq_keranjang_guest_token` (`guest_token_hash`),
  ADD KEY `idx_keranjang_user_status` (`id_user`,`status_keranjang`);

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
  MODIFY `id_detail_transaksi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  MODIFY `id_item_keranjang` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id_keranjang` int NOT NULL AUTO_INCREMENT;

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
  MODIFY `id_pembayaran` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `id_riwayat` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_transaksi` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
-- Constraints for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  ADD CONSTRAINT `fk_item_keranjang_keranjang` FOREIGN KEY (`id_keranjang`) REFERENCES `keranjang` (`id_keranjang`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_keranjang_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `fk_keranjang_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

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
