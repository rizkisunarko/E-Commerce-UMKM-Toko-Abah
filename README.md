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
1. Nyalakan MySQL (misalnya melalui XAMPP).
2. Siapkan backend dan konfigurasi lokal:
   ```bash
   cd backend
   npm install
   ```
   Jika ingin mengatur koneksi sebelum setup, buat `.env` dari templat dengan
   `Copy-Item .env.example .env` (hanya jika `.env` belum ada), lalu ubah `DB_USER`, `DB_PASSWORD`,
   dan bila perlu `DB_HOST`/`DB_PORT`.
3. Buat database dan tabel dari dump SQL (hanya untuk database kosong):
   ```bash
   npm run db:setup
   ```
   Jika `.env` belum ada, perintah ini membuatnya dari `.env.example`; jika `DB_NAME` belum ada,
   nilainya dilengkapi dari templat, dan `JWT_SECRET` kosong/placeholder diganti dengan nilai acak.
   Periksa `DB_USER` dan `DB_PASSWORD` di `.env`; bila koneksi MySQL ditolak, sesuaikan nilainya lalu ulangi.
   Perintah membuat database sesuai `DB_NAME` di `.env` dan mengimpor `backend/database/toko_abah.sql`.
   Jika database sudah memiliki tabel, proses dibatalkan tanpa menghapus data. Untuk setup ulang, gunakan
   database kosong yang baru; jangan hapus database berisi data penting.
4. Jalankan backend:
   ```bash
   npm run dev
   ```
5. Siapkan frontend di terminal baru:
   ```bash
   cd frontend
   copy .env.example .env
   ```
   Semua halaman menggunakan backend dan MySQL. Atur `VITE_API_URL` di `frontend/.env` bila alamat backend berbeda, lalu jalankan:
   ```bash
   npm install
   npm run dev
   ```
6. Cek backend di http://localhost:5000/api/health dan buka alamat frontend yang ditampilkan Vite.

### Reset password admin

Jika password admin terlupa, buka terminal di folder `backend` dan jalankan:

```bash
npm run db:reset-admin-password
```

Masukkan password baru dua kali saat diminta (input tidak ditampilkan). Password minimal 8 karakter. Perintah ini hanya memperbarui hash password akun `admin` di database yang dikonfigurasi pada `backend/.env`; perintah ini tidak mereset atau mengubah akun pegawai.

Catatan: `.env.example` hanya templat; aplikasi dan script setup membaca file `.env`. `npm run db:setup`
membuat skema dan memasukkan data contoh dari `backend/database/seed.sql`. Akun demo: `admin / admin123`
dan `pegawai / pegawai123` pada database baru. Seed memakai `INSERT IGNORE`, jadi username yang sudah
ada tidak ditimpa. Harga beli contoh bernilai 0 karena dataset contoh belum menyediakan harga beli.
Kata sandi di database tersimpan sebagai hash bcrypt.

### Login dan hak akses backend

- Endpoint kategori, daftar/detail/tambah/ubah produk, daftar stok, dan pembaruan stok membaca/menulis MySQL.
- Setiap perubahan jumlah stok memperbarui tabel `produk` dan mencatat perubahan pada `riwayat_stok` dalam transaksi database.
- `GET /api/stock?search=beras&kritis=true` memerlukan login, mencari produk berdasarkan nama, dan dapat memfilter stok kritis. Respons berisi `data` dan ringkasan jumlah produk kritis.
- `PATCH /api/products/:id/stock` menerima `{ "stok": 12 }`. Stok harus berupa bilangan bulat nonnegatif; admin dapat menaikkan atau menurunkan stok, sedangkan pegawai hanya dapat menguranginya. Perubahan produk dan riwayat stok disimpan dalam satu transaksi.
- Admin dapat menaikkan atau menurunkan stok; pegawai dapat melihat dan hanya menurunkan stok melalui halaman Stok.
- Form ubah produk admin dapat memperbarui stok. Jika stok berubah, API memperbarui produk dan mencatat riwayat stok dalam satu transaksi; setelah disimpan, aplikasi membuka halaman Daftar Stok dengan nilai terbaru.
- Stok produk, batas stok minimum, dan jumlah pada riwayat menggunakan bilangan bulat. Migrasi `backend/database/migrations/002-convert-stock-to-integers.sql` membulatkan nilai pecahan yang sudah ada ke bawah (FLOOR); jalankan sekali pada database lama sebelum memakai versi ini. Data baru akan menolak stok pecahan.
- `PUT /api/products/:id` mengubah nama, kategori, harga jual, berat, dan batas stok minimum; hanya admin yang boleh mengaksesnya. Pegawai mendapat respons `403` dan tidak dapat mengubah harga atau data produk. Tidak tersedia endpoint untuk menghapus produk.
- Dua peran yang digunakan adalah admin (pemilik, akses penuh) dan pegawai (kasir/operasional, tanpa hak ubah harga, tambah, ubah, atau arsip produk). Pembatasan diberlakukan backend, bukan hanya dengan menyembunyikan tombol.
- `PATCH /api/products/:id/archive` menerima `{ "archived": true|false }` dan hanya dapat digunakan admin. Arsip menyembunyikan produk dari daftar aktif dan stok tanpa menghapus riwayat; admin dapat menampilkan arsip lalu memulihkan produk. Produk arsip tidak dapat disesuaikan stoknya.
- Untuk database yang sudah ada, jalankan sekali `backend/database/migrations/001-add-product-archive.sql` sebelum menjalankan versi backend ini. Database baru memperoleh kolom arsip dari dump SQL.
- NFR-02: pemeriksaan hak akses dilakukan pada setiap endpoint backend; aksi produk yang dibatasi tetap ditolak meskipun dipanggil langsung tanpa UI.

- `POST /api/auth/login` menerima `{ "username": "...", "password": "..." }` dan mengembalikan token Bearer serta data pengguna.
- `GET /api/auth/me` memerlukan `Authorization: Bearer <token>` dan mengembalikan sesi pengguna yang masih aktif.
- `PATCH /api/transactions/:id/status` menerima `{ "status": "diproses" }`. Admin dapat mengatur status transaksi yang valid; pegawai hanya dapat mengatur `diproses`, `siap_diambil`, atau `siap_dikirim`. Status `batal` hanya dapat diatur admin.
- Password pada tabel `admin` dan `pegawai` harus disimpan sebagai hash bcrypt. Akun pegawai dengan status selain `aktif` tidak dapat login dan tokennya tidak dapat dipakai.

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
