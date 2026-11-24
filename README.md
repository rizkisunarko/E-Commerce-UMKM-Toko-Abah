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
   Untuk tarif ongkir, isi `RAJAONGKIR_API_KEY` di `backend/.env` dengan key **Shipping Cost Sandbox**
   dari dashboard Komerce. Jangan menaruh key di frontend atau mengirimkannya ke Git.
   Untuk pembayaran, isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` dari dashboard Midtrans
   Sandbox. Server Key dengan izin Snap Checkout Write juga digunakan backend untuk memverifikasi
   signature webhook. Simpan Server Key hanya di `backend/.env`; jangan kirim ke browser atau Git.
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
   Untuk database yang sudah ada, jalankan `npm run db:migrate:orders` dari folder `backend` agar
   keranjang tamu, wilayah pengiriman, token Snap, dan metode pembayaran COD dapat disimpan.
4. Jalankan backend:
   ```bash
   npm run dev
   ```
5. Siapkan frontend di terminal baru:
   ```bash
   cd frontend
   copy .env.example .env
   ```
   Ubah `VITE_USE_MOCK=false` agar checkout memakai backend dan Midtrans. Atur `VITE_API_URL` bila
   alamat backend berbeda, lalu jalankan:
   ```bash
   npm install
   npm run dev
   ```
6. Cek backend di http://localhost:5000/api/health dan buka alamat frontend yang ditampilkan Vite.

Checkout mencari kecamatan/kota melalui backend, lalu menampilkan pilihan tarif dan layanan dari
RajaOngkir berdasarkan jumlah berat produk di database (berat per produk dikalikan kuantitas).
Endpoint ongkir mengembalikan total berat dalam gram (`weight`) dan kilogram (`weight_kg`) untuk
ditampilkan di ringkasan checkout. Backend menghitung ulang berat dan tarif saat pesanan dibuat;
tarif tujuan tidak dikirim sebagai nilai tepercaya dari browser. Permintaan ongkir memakai key
Shipping Cost Sandbox yang disimpan di
`backend/.env`. Jika pencarian atau perhitungan gagal atau tidak menghasilkan layanan, checkout
menampilkan error tanpa tarif contoh; pelanggan dapat mencoba lagi atau memilih ambil di toko.
Checkout menyediakan Midtrans Snap Sandbox dan COD untuk pesanan yang dikirim kurir. Pesanan COD
tetap berstatus menunggu pembayaran sampai pembayaran tunai dikonfirmasi. Pembayaran Midtrans
menggunakan token dari total pesanan yang dihitung server, sementara status lunas hanya berubah
setelah notifikasi Midtrans dengan signature dan nominal yang valid diterima. Atur URL notifikasi
pada dashboard Midtrans ke
`https://<alamat-backend-publik>/api/payments/midtrans/notification`; server lokal `localhost`
tidak dapat menerima webhook tanpa URL publik. Untuk pengujian lokal, jalankan backend lalu jalankan
`npm run tunnel` dari folder `backend` untuk memperoleh URL LocalTunnel sementara, atau
`npm run tunnel:ngrok` jika ngrok sudah terpasang dan dikonfigurasi. Tambahkan path
`/api/payments/midtrans/notification` ke URL publik yang diberikan tunnel dan daftarkan sebagai URL
notifikasi di dashboard Midtrans Sandbox. URL tunnel berubah atau tidak aktif setelah proses tunnel
berhenti. Endpoint callback tidak memerlukan login, tetapi hanya memproses notifikasi dengan signature
dan nominal valid. `FRONTEND_URL` (default `http://localhost:5173`) dipakai sebagai URL kembali setelah
metode pembayaran berbasis redirect selesai.

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

- Katalog pelanggan dapat diakses tanpa login melalui `GET /api/catalog?search=beras&kategori=Beras%20%26%20Tepung&page=1&limit=12` dan `GET /api/catalog/categories`. Katalog hanya mengembalikan produk aktif dan tidak menyertakan harga beli.
- `POST /api/cart/check` dapat digunakan tanpa login untuk memeriksa harga, stok, dan kecukupan jumlah keranjang dari produk aktif di database.
- `GET /api/cart` dan `PUT /api/cart` menyimpan keranjang tamu di database menggunakan token acak per browser; token disimpan sebagai hash.
- Checkout pesanan pelanggan tidak memerlukan login, tetapi `POST /api/orders` mewajibkan nama dan nomor HP. Server memvalidasi ulang harga, stok, diskon, dan tarif pengiriman; pesanan dapat dilihat dengan nomor pesanan melalui `GET /api/orders/:nomor`.
- Endpoint kategori, daftar/detail/tambah/ubah produk, daftar stok, dan pembaruan stok membaca/menulis MySQL.
- `GET /api/products?page=1&limit=10&search=beras&kategori=Beras%20%26%20Tepung` memerlukan token login, menggabungkan pencarian nama dan filter kategori, lalu mengembalikan `data` serta `pagination` (`page`, `limit`, `total`, `total_pages`). `limit` maksimum 100; parameter berulang/berformat salah ditolak. `GET /api/categories` menyediakan opsi kategori untuk filter.
- Produk arsip tidak disertakan secara default. Hanya admin dapat meminta `include_archived=true`; pegawai menerima `403`.
- Setiap perubahan jumlah stok memperbarui tabel `produk` dan mencatat perubahan pada `riwayat_stok` dalam transaksi database.
- `GET /api/stock?search=beras&kritis=true` memerlukan login, mencari produk berdasarkan nama, dan dapat memfilter stok kritis. Respons berisi `data` dan ringkasan jumlah produk kritis.
- `PATCH /api/products/:id/stock` menerima `{ "stok": 12 }`. Stok harus berupa bilangan bulat nonnegatif; admin dapat menaikkan atau menurunkan stok, sedangkan pegawai hanya dapat menguranginya. Perubahan produk dan riwayat stok disimpan dalam satu transaksi.
- Admin dapat menaikkan atau menurunkan stok; pegawai dapat melihat dan hanya menurunkan stok melalui halaman Stok.
- Form ubah produk admin dapat memperbarui stok. Jika stok berubah, API memperbarui produk dan mencatat riwayat stok dalam satu transaksi; setelah disimpan, aplikasi membuka halaman Daftar Stok dengan nilai terbaru.
- Stok produk, batas stok minimum, dan jumlah pada riwayat menggunakan bilangan bulat. Migrasi `backend/database/migrations/002-convert-stock-to-integers.sql` membulatkan nilai pecahan yang sudah ada ke bawah (FLOOR); jalankan sekali pada database lama sebelum memakai versi ini. Data baru akan menolak stok pecahan.
- `PUT /api/products/:id` mengubah nama, kategori, harga jual, berat, dan batas stok minimum; hanya admin yang boleh mengaksesnya. Pegawai mendapat respons `403` dan tidak dapat mengubah harga atau data produk.
- Dua peran yang digunakan adalah admin (pemilik, akses penuh) dan pegawai (kasir/operasional, tanpa hak ubah harga, tambah, ubah, atau arsip produk). Pembatasan diberlakukan backend, bukan hanya dengan menyembunyikan tombol.
- `PATCH /api/products/:id/archive` menerima `{ "archived": true|false }` dan hanya dapat digunakan admin. Arsip menyembunyikan produk dari daftar aktif dan stok tanpa menghapus riwayat; admin dapat menampilkan arsip lalu memulihkan produk. Produk arsip tidak dapat disesuaikan stoknya.
- `DELETE /api/products/:id` hanya dapat digunakan admin. Produk yang memiliki detail penjualan/pembelian, riwayat stok, atau masih ada di keranjang akan diarsipkan; produk tanpa relasi tersebut dihapus permanen. Respons menyertakan `action` bernilai `archived` atau `deleted`.
- Untuk database yang sudah ada, jalankan sekali `backend/database/migrations/001-add-product-archive.sql` sebelum menjalankan versi backend ini. Database baru memperoleh kolom arsip dari dump SQL.
- NFR-02: pemeriksaan hak akses dilakukan pada setiap endpoint backend; aksi produk yang dibatasi tetap ditolak meskipun dipanggil langsung tanpa UI.

- `POST /api/auth/login` menerima `{ "username": "...", "password": "..." }` dan mengembalikan token Bearer serta data pengguna.
- `GET /api/auth/me` memerlukan `Authorization: Bearer <token>` dan mengembalikan sesi pengguna yang masih aktif.
- `POST /api/transactions` menerima metode `tunai`, `qris`, atau `debit` beserta `items: [{ "product_id": 1, "jumlah": 2 }]`. Untuk tunai, sertakan `jumlah_diterima` sebagai nominal uang bulat. Admin dan pegawai dapat membuat transaksi; server menghitung total dari harga database, mengunci dan mengurangi stok, serta menyimpan detail, riwayat stok, pembayaran, dan kembalian dalam satu transaksi database.
- `GET /api/transactions?dari=YYYY-MM-DD&sampai=YYYY-MM-DD`, `GET /api/transactions/:id`, dan `GET /api/transactions/rekap?tanggal=YYYY-MM-DD` menyediakan daftar, detail, dan rekap transaksi kasir untuk admin. Filter tanggal bersifat inklusif; tanggal kalender tidak valid dan rentang terbalik ditolak. Rekap hanya menghitung pembayaran berhasil dan menyediakan total serta jumlah transaksi keseluruhan dan per metode (`tunai`, `qris`, `debit`); metode lama `payment_gateway` direkap sebagai debit.
- Pembayaran tunai meminta jumlah uang diterima; server menolak nominal yang kurang dari total dan mengembalikan serta menyimpan nilai kembalian. Untuk QRIS, kasir mengonfirmasi secara manual setelah pembayaran diterima pada aplikasi merchant; aplikasi tidak membuat QR atau memverifikasi payment gateway.
- Untuk database lama, jalankan sekali `backend/database/migrations/20261115_add_debit_payment_method.sql` untuk menambahkan metode debit dan kolom uang diterima/kembalian. Database baru memperoleh skema tersebut dari dump SQL.
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
