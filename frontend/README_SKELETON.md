# Kerangka Frontend Toko Abah

Kerangka ini sudah diuji: `npm install` dan `npm run build` berhasil, dan logika data tiruan diuji terhadap login, validasi, hak akses admin/pegawai, dan stok kritis.

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

## Mode data tiruan dan backend asli

Di `frontend/.env`:
- `VITE_USE_MOCK=true`: semua panggilan API dilayani data tiruan di browser (`src/mocks/mockServer.js`). Backend belum diperlukan.
- `VITE_USE_MOCK=false`: panggilan dikirim ke backend asli di `VITE_API_URL`.

Bentuk permintaan dan respons data tiruan sama dengan dokumen Kontrak API. Saat backend siap, cukup ubah `VITE_USE_MOCK` menjadi `false`. Halaman tidak perlu diubah.

## Isi kerangka

```
src/
├── main.jsx                 titik masuk, router, penyedia autentikasi
├── App.jsx                  daftar rute dan pembatasan peran
├── index.css                gaya dasar (warna hijau Toko Abah)
├── context/AuthContext.jsx  status login, login(), logout()
├── services/
│   ├── api.js               satu pintu panggilan API (mock atau backend asli)
│   ├── authService.js
│   ├── productService.js
│   └── stockService.js
├── mocks/mockServer.js      backend tiruan
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
