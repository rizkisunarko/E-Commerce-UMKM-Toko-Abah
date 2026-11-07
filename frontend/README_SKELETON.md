# Kerangka Frontend Toko Abah

Frontend menggunakan backend API sebagai sumber data; akun, produk, kategori, dan stok disimpan di MySQL.

## Cara memasang ke repositori

1. Di repositori, buat branch dari `main`:
   ```
   git checkout main
   git pull
   git checkout -b feature/PPL-20-kerangka-frontend
   ```
2. Salin isi folder `frontend` dari zip ini ke folder `frontend` di repositori. Timpa berkas yang sudah ada (`package.json`, `index.html`, `vite.config.js`, `src/`). Hapus berkas bawaan Vite yang tidak dipakai (`src/App.css`, `src/assets/react.svg`).
3. Pasang dependensi dan jalankan:
   ```
   cd frontend
   copy .env.example .env      (Windows PowerShell: Copy-Item .env.example .env)
   npm install
   npm run dev
   ```
4. Buka `http://localhost:5173`. Masuk dengan akun uji:
   - admin / admin123
   - pegawai / pegawai123

## Backend dan database

Atur `VITE_API_URL` di `frontend/.env` untuk menunjuk ke backend. Jalankan `npm run db:setup` di folder `backend` untuk membuat skema MySQL dan mengisi akun, kategori, serta produk contoh.

## Isi kerangka

```
src/
├── main.jsx                 titik masuk, router, penyedia autentikasi
├── App.jsx                  daftar rute dan pembatasan peran
├── index.css                gaya dasar (warna hijau Toko Abah)
├── context/AuthContext.jsx  status login, login(), logout()
├── services/
│   ├── api.js               satu pintu panggilan ke backend API
│   ├── authService.js
│   ├── productService.js
│   └── stockService.js
├── components/
│   ├── Layout.jsx, Sidebar.jsx, ProtectedRoute.jsx
│   └── Button.jsx, TextField.jsx, Badge.jsx, Modal.jsx
├── pages/
│   ├── LoginPage.jsx        selesai (PPL-20.2)
│   ├── ProductListPage.jsx  contoh tersambung ke service
│   ├── PlaceholderPage.jsx  penanda halaman yang belum dibuat
│   └── NotFoundPage.jsx
└── utils/format.js          formatRupiah
```

## Peta kartu ke berkas

| Kartu | Yang dikerjakan | Berkas |
|-------|-----------------|--------|
| PPL-20.2 | Halaman login | `pages/LoginPage.jsx` (kerangka sudah ada, sesuaikan dengan desain) |
| PPL-01.2 | Form tambah produk | buat `pages/ProductFormPage.jsx`, ganti rute `produk/tambah` di `App.jsx` |
| PPL-02.2 | Form ubah produk | pakai komponen form yang sama, ganti rute `produk/:id/ubah` |
| PPL-03.2 | Daftar dan pembaruan stok | buat `pages/StockPage.jsx` memakai `stockService`, `Badge`, dan `Modal`, ganti rute `stok` |

Tips: buat satu komponen form produk yang dipakai bersama oleh halaman tambah dan ubah, lalu tampilkan pesan kesalahan per kolom dari `err.errors` (format `{ nama: "Kolom ini wajib diisi" }`).

## Catatan

- Jangan menaruh kunci rahasia di frontend. Semua kunci API (Midtrans, RajaOngkir) hanya di backend `.env`.
- Token login disimpan di `localStorage` (cukup untuk tugas ini).
