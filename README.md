# E-Commerce UMKM Toko Abah

Aplikasi e-commerce berbasis web untuk Toko Abah (toko sembako). Proyek mata kuliah
Proyek Perangkat Lunak (PPL), Semester Ganjil 2026/2027.

## Fitur Utama
- Pengelolaan produk dan stok, penanda stok kritis
- Kasir dan riwayat transaksi
- Katalog, keranjang, dan checkout
- Pembayaran Midtrans Snap (sandbox) dan ongkos kirim RajaOngkir/Komerce (sandbox)
- Daftar pesanan dan laporan produk terlaris

## Tech Stack
React (Vite), Node.js + Express, MySQL

## Cara Menjalankan
1. Nyalakan MySQL (XAMPP) dan buat database `toko_abah`.
2. Backend:
   ```bash
   cd backend
   copy .env.example .env
   npm install
   npm run dev
   ```
3. Frontend:
   ```bash
   cd frontend
   copy .env.example .env
   npm install
   npm run dev
   ```
4. Cek backend: http://localhost:5000/api/health
5. Buka frontend: http://localhost:5173

## Anggota dan Peran
| Nama | Peran |
|------|-------|
| (isi) | Product Owner / System Analyst |
| (isi) | Scrum Master |
| Rizki | Frontend, UI/UX |
| Budi | Backend |
| (isi) | QA / Tester |
| (isi) | Dokumentasi dan Branding |

## Alur Kerja
Satu user story satu branch: feature/PPL-xx-nama-fitur.
Pesan commit: [PPL-xx] deskripsi singkat.
Perubahan masuk ke main melalui pull request yang di-review minimal satu anggota lain.
