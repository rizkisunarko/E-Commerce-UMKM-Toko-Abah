# Dokumentasi Desain UI/UX - Toko Abah

Dokumentasi rancangan antarmuka pengguna (UI/UX) sistem E-Commerce Sembako UMKM Toko Abah, dirancang menggunakan Google Stitch dengan prinsip Material 3 dan ramah pengguna lokal (desktop & mobile 360px).

---

## 1. Pilihan Metode Penerimaan Pesanan di Checkout (PPL-09.1)

- **Tanggal Desain**: 19 November 2026
- **Desainer**: Rizki Sunarko
- **Proyek Stitch**: Toko Abah E-Commerce UI Redesign (Checkout & Fulfillment)
- **Status**: Disetujui (Approved)

### Berkas Desain
1. **Desain Komprehensif**:
   - `docs/design/Membuat desain UI pilihan metode penerimaan pesanan di checkout 09.2.png`
2. **Wireframe Rinci (`docs/design/wireframe/`)**:
   - `19-checkout-ambil-di-toko.png` — Tampilan varian "Ambil di Toko" (tanpa isian alamat fisik, ongkos kirim Rp 0).
   - `20-checkout-kurir-pihak-ketiga.png` — Tampilan varian "Kurir Pihak Ketiga" dengan isian Alamat Lengkap, pencarian Kecamatan/Kota Tujuan, tombol Cek Ongkir, dan pilihan layanan kurir.
   - `21-checkout-kesalahan-kurir.png` — Tampilan status error & validasi ketika formulir kurir belum terisi lengkap atau saat terjadi gangguan layanan kurir.

> [!NOTE]
> Ongkos kirim (Rp 18.000 / Rp 17.000 / Rp 19.000) dan daftar layanan kurir (JNE, SiCepat, J&T) pada gambar desain merupakan data contoh (*mockup*). Nilai dan layanan riil dihitung dinamis menggunakan API RajaOngkir Komerce (PPL-10 / PPL-34).

---

## 2. Fitur & Komponen Utama Desain
- **Bento Stepper**: 1. Keranjang &rarr; 2. Checkout &rarr; 3. Pembayaran.
- **Section 1 (Data Pemesan)**: Nama lengkap, Nomor WhatsApp/HP dengan prefix `+62`, dan catatan toko.
- **Section 2 (Cara Menerima Pesanan)**:
  - Kartu pilihan interaktif: *Ambil di Toko* vs *Kurir Pihak Ketiga*.
  - Indikator radio aktif dengan badge *Pilihan Aktif*.
  - Sub-konten kurir: Alamat lengkap, pencarian kecamatan/kota tujuan, tombol cek ongkir, pilihan layanan, dan kotak status kondisi kurir.
- **Ringkasan Pesanan (Sticky Right Column)**: Daftar produk ringkas, rincian subtotal, ongkir, total pembayaran dengan tipografi KPI yang jelas, serta tombol aksi *Buat Pesanan*.
