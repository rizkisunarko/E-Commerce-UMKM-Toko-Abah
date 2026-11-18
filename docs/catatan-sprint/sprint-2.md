# DOKUMENTASI SPRINT 2

Proyek: Sistem E-Commerce UMKM Toko Abah
Periode: 12 - 18 November 2026 (7 hari)
Product Owner: Cintya
Scrum Master: Muamanah Nur Chayanti (PPL-25)

## 1. Sprint Planning (12 November 2026, kartu PPL-25.1, selesai)

### 1.1 Tujuan sprint

Stok kritis, kasir, dan katalog: penanda stok kritis, kasir, riwayat transaksi, katalog pelanggan, keranjang, dan checkout.

Target sprint: alur transaksi offline dan alur pemesanan online dasar dapat berjalan.

### 1.2 User story yang dipilih dari backlog

| Kode | User story | Prioritas | Dependensi | AC | PIC utama | Jadwal |
|------|------------|-----------|------------|----|-----------|--------|
| PPL-04 | Admin melihat penanda stok kritis (aturan: stok ≤ batas kritis → "Stok Kritis", selain itu "Stok Aman") | High | PPL-03 | 3 | Budi (API), Rizki (halaman dan uji) | 12 - 14 Nov |
| PPL-05 | Pemilik/pegawai menghitung total belanja dan mencatat transaksi (metode bayar tunai/QRIS) melalui kasir | High | PPL-01, PPL-03 | 3 | Budi (API), Rizki (halaman), Cintya (uji) | 14 - 16 Nov |
| PPL-06 | Admin melihat riwayat transaksi, filter tanggal, dan rekap harian per metode bayar | Medium | PPL-05 | 3 | Budi, Rizki, Cintya | 15 - 16 Nov |
| PPL-07 | Pelanggan melihat katalog, harga, dan ketersediaan produk tanpa login | High | PPL-01, PPL-03 | 3 | Budi, Rizki, Cintya | 14 - 18 Nov |
| PPL-08 | Pelanggan memilih produk, memasukkannya ke keranjang, dan checkout | High | PPL-07 | 3 | Budi (API), Rizki (halaman), Cintya (uji) | 16 - 18 Nov |

Total user story direncanakan: 5.

### 1.3 Kartu pendukung sprint

| Kode | Kartu | PIC | Jadwal |
|------|-------|-----|--------|
| PPL-22 | Desain UI/UX kasir, riwayat, katalog, dan checkout | Rizki | 12 - 15 Nov |
| PPL-23 | Perancangan database transaksi dan pesanan | Budi | 12 - 13 Nov |
| PPL-24 | Perancangan alur pemesanan, penerimaan, ongkir, dan pembayaran | Cintya | 12 - 15 Nov |
| PPL-34 | Persiapan akun sandbox RajaOngkir (Komerce) | Budi | 16 - 17 Nov |
| PPL-25 | Seremoni Scrum Sprint 2 | Muamanah | 12 - 18 Nov |

### 1.4 Pembagian peran dan beban

| Anggota | Peran | Fokus Sprint 2 |
|---------|-------|----------------|
| Cintya | Product Owner / System Analyst | Perancangan alur pemesanan (PPL-24), pengujian PPL-05 sampai PPL-08 |
| Muamanah Nur Chayanti | Scrum Master | Seremoni sprint, stand-up, rekap rencana vs realisasi |
| Rizki | Frontend, UI/UX | Desain kasir, riwayat, katalog, checkout (PPL-22); halaman PPL-04 sampai PPL-08 |
| Budi | Backend | Database transaksi dan pesanan (PPL-23); API PPL-04 sampai PPL-08; akun sandbox (PPL-34) |

Aturan beban: maksimal dua tugas paralel per orang.

### 1.5 Definition of Done

- Kode di-merge ke `main` melalui pull request yang di-review anggota lain.
- Fitur sudah diuji (QA) terhadap kriteria penerimaan.
- Tidak ada error saat dijalankan.
- Commit, branch, dan PR memuat kode kartu Jira.

### 1.6 Keputusan dan risiko saat planning

| No | Keputusan atau risiko | Rujukan |
|----|-----------------------|---------|
| 1 | Beban Sprint 2 melebihi kapasitas Rizki dan Budi (beberapa sub-tugas ditandai Padat). PPL-06 (Medium) menjadi kandidat yang digeser ke Sprint 3 bila kapasitas tidak cukup. | Keputusan PO, Sprint Planning |
| 2 | PPL-08 berisiko spillover; waktu perbaikan disisihkan di Sprint 3. | Sprint Planning |
| 3 | Akun sandbox RajaOngkir (PPL-34) dipindah dari Sprint 3 ke Sprint 2 agar PPL-09 dan PPL-10 tidak menunggu. | K-08 |
| 4 | Metode bayar tunai atau QRIS wajib dicatat pada setiap transaksi kasir. | K-06 |
| 5 | Katalog dapat dilihat tanpa login; login atau pengisian nama dan nomor HP baru diminta saat checkout. | K-07 |
| 6 | Alur status pesanan: Menunggu Pembayaran → Dibayar → Diproses → Siap Diambil/Dikirim → Selesai, ditambah Dibatalkan. | K-09 |
| 7 | Riwayat transaksi (PPL-06) hanya dapat diakses admin; pegawai boleh memakai kasir. | K-02, K-14 |
| 8 | Batas stok kritis bawaan 5, barang cepat habis 10, dan dapat diatur per produk. | K-03 |
| 9 | Tindak lanjut Sprint 1: AC-02.2 (harga baru berlaku ke transaksi baru) diuji penuh setelah PPL-05 dan PPL-08 tersedia. | Sprint 1, bagian 4.4 |

### 1.7 Integrasi tools pada sprint ini

| Kode | Integrasi | Status per 18 Nov |
|------|-----------|-------------------|
| I-1 | GitHub ke Discord (`#github-notif`) | Tetap terpasang dari Sprint 1 |
| I-2 | Board (Jira) dan GitHub | Tetap terpasang, commit tampil di panel Development |
| I-3 | Board (Jira) ke Discord (`#board-notif`) | Tetap terpasang melalui Jira Automation |

Catatan: tidak ada integrasi tools baru pada Sprint 2. Akun sandbox RajaOngkir (PPL-34) disiapkan lebih awal sebagai persiapan integrasi ongkos kirim (PPL-10) di Sprint 3.

## 2. Progres Sprint (status akhir sprint, 18 November 2026)

Berdasarkan sheet WBS dan board Jira.

| Kode | Kartu | Status | Keterangan |
|------|-------|--------|------------|
| PPL-22 | Desain UI/UX kasir, riwayat, katalog, checkout | Selesai | 22.1 dan 22.2 selesai |
| PPL-23 | Database transaksi dan pesanan | Selesai | 23.1 selesai (transaksi, detail, metode bayar, keranjang, pesanan, item, status pesanan) |
| PPL-24 | Alur pemesanan, penerimaan, ongkir, pembayaran | Selesai | 24.1 dan 24.2 selesai |
| PPL-34 | Akun sandbox RajaOngkir (Komerce) | Selesai | 34.1 (akun dan API key di `.env`) dan 34.2 (uji satu panggilan ongkir) selesai |
| PPL-04 | Penanda stok kritis | Selesai | 04.1 (aturan di backend), 04.2 (penanda dan filter), dan 04.3 (pengujian) selesai |
| PPL-05 | Kasir dan transaksi | Selesai | 05.1 (API), 05.2 (halaman), dan 05.3 (pengujian) selesai |
| PPL-06 | Riwayat transaksi | Selesai | 06.1 (API), 06.2 (halaman), dan 06.3 (pengujian) selesai; tetap di Sprint 2, tidak jadi digeser |
| PPL-07 | Katalog produk | Selesai | 07.1 (API), 07.2 (halaman), dan 07.3 (pengujian) selesai |
| PPL-08 | Keranjang dan checkout | Selesai | 08.1 (API), 08.2 (halaman), 08.3 (ringkasan dan opsi WhatsApp), dan 08.4 (pengujian) selesai |
| PPL-25 | Seremoni Sprint 2 | Selesai | 25.1 (planning), 25.2 (stand-up, ditulis di `#diskusi`), dan 25.3 (PPL-86, review, retrospektif, rekap) selesai |

Ringkasan: 4 dari 4 kartu pendukung teknis selesai (PPL-22, PPL-23, PPL-24, PPL-34), 5 dari 5 user story selesai (PPL-04 sampai PPL-08), dan seremoni PPL-25 selesai. Seluruh pekerjaan Sprint 2 selesai pada 18 November.

Catatan akhir sprint:
- Seluruh kartu teknis dan user story berstatus Done di board Jira pada 18 November 2026.
- Seluruh anggota tim mengerjakan tugas sesuai peran (jobdesk) masing-masing.
- Seluruh fitur sudah diuji terhadap acceptance criteria AC-04.1 sampai AC-08.3 (15 AC). Hasilnya aman dan tidak ada temuan yang tersisa.
- AC-02.2 (harga baru berlaku pada transaksi atau pesanan baru), tindak lanjut Sprint 1, kini dapat diuji penuh karena kasir (PPL-05) dan checkout (PPL-08) sudah tersedia. Hasilnya aman.

## 3. Stand-up Tertulis (kartu PPL-25.2, 12 - 18 November 2026)

Ditulis di kanal `#diskusi`. Salin ringkasannya ke sini.

**Stand-up 15 November 2026**

| Anggota | Sudah dikerjakan | Akan dikerjakan | Kendala |
|---------|------------------|-----------------|---------|
| Cintya | Perancangan alur pemesanan online dan penerimaan pesanan (PPL-24.1) | Alur ongkir dan pembayaran Midtrans (PPL-24.2); pengujian kasir dan riwayat (PPL-05.3, PPL-06.3) | Tidak ada kendala |
| Muamanah | Sprint Planning (PPL-25.1) | Stand-up, Sprint Review, Retrospektif, dan rekap (PPL-25.2 dan PPL-25.3) | Tidak ada kendala |
| Rizki | Desain UI/UX kasir, riwayat, katalog, dan checkout (PPL-22); halaman stok kritis (PPL-04.2) | Halaman kasir (PPL-05.2), riwayat (PPL-06.2), dan katalog (PPL-07.2) | Tidak ada kendala |
| Budi | Database transaksi dan pesanan (PPL-23); aturan stok kritis (PPL-04.1) | API kasir (PPL-05.1), riwayat (PPL-06.1), dan katalog (PPL-07.1) | Tidak ada kendala |

**Stand-up 17 - 18 November 2026**

| Anggota | Sudah dikerjakan | Akan dikerjakan | Kendala |
|---------|------------------|-----------------|---------|
| Cintya | Pengujian kasir, riwayat transaksi, dan katalog (PPL-05.3, PPL-06.3, PPL-07.3) | Pengujian keranjang dan checkout (PPL-08.4) | Tidak ada kendala |
| Muamanah | Stand-up tertulis (PPL-25.2) | Sprint Review, Retrospektif, dan rekap (PPL-25.3 / PPL-86) | Tidak ada kendala |
| Rizki | Halaman kasir, riwayat, dan katalog (PPL-05.2, PPL-06.2, PPL-07.2) | Halaman keranjang dan checkout, ringkasan pesanan dan opsi WhatsApp (PPL-08.2, PPL-08.3) | Tidak ada kendala |
| Budi | API kasir, riwayat, dan katalog (PPL-05.1, PPL-06.1, PPL-07.1); akun sandbox RajaOngkir (PPL-34) | API keranjang dan pesanan (PPL-08.1) | Tidak ada kendala |


## 4. Sprint Review (18 November 2026, kartu PPL-25.3 / PPL-86)

Peserta: Cintya, Muamanah, Rizki, Budi
Demo kepada: Product Owner (Cintya)

### 4.1 Hasil per user story

| Kode | Hasil | Selesai (Done) | Catatan |
|------|-------|:--------------:|---------|
| PPL-04 | API aturan stok kritis (04.1), halaman penanda dan filter (04.2), dan pengujian AC-04.1 sampai AC-04.3 (04.3) selesai | ✔ | Seluruh anggota memeriksa dan hasilnya aman |
| PPL-05 | API kasir (05.1), halaman kasir (05.2), dan pengujian AC-05.1 sampai AC-05.3 (05.3) selesai | ✔ | Metode bayar tunai/QRIS tercatat (K-06) |
| PPL-06 | API riwayat (06.1), halaman (06.2), dan pengujian AC-06.1 sampai AC-06.3 (06.3) selesai | ✔ | Tetap di Sprint 2; tidak jadi digeser ke Sprint 3 |
| PPL-07 | API katalog (07.1), halaman (07.2), dan pengujian AC-07.1 sampai AC-07.3 (07.3) selesai | ✔ | Katalog tampil tanpa login (K-07) |
| PPL-08 | API keranjang dan pesanan (08.1), halaman (08.2), ringkasan dan opsi WhatsApp (08.3), dan pengujian AC-08.1 sampai AC-08.3 (08.4) selesai | ✔ | Pesanan berstatus "Menunggu Pembayaran"; metode penerimaan, ongkir, dan pembayaran dikerjakan di Sprint 3 |

### 4.2 Hasil kartu pendukung

PPL-22, PPL-23, PPL-24, dan PPL-34 selesai (lihat bagian 2). Desain halaman kasir, riwayat, katalog, dan checkout (PPL-22) sudah menjadi dasar implementasi halaman. Akun sandbox RajaOngkir (PPL-34) sudah siap sehingga PPL-09 dan PPL-10 di Sprint 3 tidak menunggu. Catatan perbaikan desain dari pemilik toko belum tercatat.

### 4.3 Umpan balik Product Owner / mitra

Seluruh fitur sudah diuji dan berjalan. Tidak ada catatan tambahan dari Product Owner.

### 4.4 Item yang pindah ke Sprint 3 (spillover)

Tidak ada user story yang spillover; PPL-04 sampai PPL-08 selesai di Sprint 2.

Tindak lanjut ke Sprint 3: metode penerimaan pesanan (PPL-09), ongkos kirim (PPL-10), dan pembayaran online (PPL-11) melanjutkan pesanan dari checkout PPL-08.

## 5. Retrospektif Sprint 2 (18 November 2026)

Diisi bersama tim berdasarkan data sprint:

- Seluruh 5 user story dan 4 kartu pendukung selesai dalam sprint, meskipun beban direncanakan melebihi kapasitas Rizki dan Budi.
- PPL-06 yang menjadi kandidat digeser ke Sprint 3 tetap selesai di Sprint 2.
- Pengujian PPL-07.3 dan PPL-08.4 dijadwalkan pada 18 November, hari terakhir sprint. PPL-08 juga bergantung pada PPL-07.
- Beberapa sub-tugas ditandai Padat (melebihi dua tugas paralel): PPL-06.1, PPL-06.2, PPL-08.2, dan PPL-08.3.

### 5.1 Berjalan baik

- Kartu pendukung PPL-22, PPL-23, PPL-24 selesai di awal sprint (13 - 15 Nov), sehingga desain, database, dan alur siap sebelum implementasi fitur.
- PPL-34 (akun sandbox RajaOngkir) selesai lebih awal, mempersiapkan Sprint 3.
- Jadwal fitur lebih tersebar dibanding Sprint 1: PPL-04 selesai 14 Nov, PPL-05 dan PPL-06 selesai 16 Nov, PPL-07 dan PPL-08 selesai 18 Nov.
- Seluruh user story selesai sesuai target sprint: alur transaksi offline dan alur pemesanan online dasar dapat berjalan.

### 5.2 Perlu diperbaiki

- Pengujian dua story terakhir (PPL-07 dan PPL-08) masih bertumpuk di hari terakhir sprint, sehingga waktu perbaikan bila ada bug sangat sempit. Ini masalah yang sama dengan Sprint 1.
- Beban Rizki dan Budi pada PPL-06 dan PPL-08 melebihi batas dua tugas paralel.
- Pengujian PPL-04.3 dikerjakan Rizki, yang juga mengerjakan implementasi halamannya (PPL-04.2), sehingga penguji tidak independen.
- Sprint 3 memuat integrasi pihak ketiga (RajaOngkir dan Midtrans) dengan callback yang butuh endpoint publik (PPL-11.5), sehingga risiko kendala teknis lebih tinggi.

### 5.3 Tindakan perbaikan (1 - 2 butir, dikerjakan di Sprint 3)

| No | Tindakan | PIC | Batas waktu | Bukti |
|----|----------|-----|-------------|-------|
| 1 | Pengujian (sub-tugas .3 atau .4) dimulai segera setelah API dan halaman selesai; PPL-11.4 tidak menunggu hari terakhir sprint, dan pengujian dikerjakan penguji independen (Cintya) | Cintya | Sprint 3 | Kartu pengujian di Jira selesai sebelum hari terakhir sprint |
| 2 | Endpoint callback publik Midtrans (PPL-11.5) disiapkan lebih awal, dan pull request di-review maksimal 1 hari | Budi dan seluruh tim | Sprint 3 | Riwayat PR di GitHub dan tanggal kartu di Jira |

## 6. Rekap Rencana vs Realisasi Sprint 2

Salin ke tab Sprint Planning (bagian Rekap Rencana vs Realisasi) dan Appendix D laporan.

| Sprint | Tujuan sprint | User story direncanakan | User story selesai (Done) | Tindakan dari retrospektif |
|--------|---------------|:-----------------------:|:-------------------------:|----------------------------|
| Sprint 2 | Stok kritis, kasir, dan katalog | 5 | 5 | Pengujian dimulai lebih awal dengan penguji independen; callback publik disiapkan awal dan PR di-review maksimal 1 hari (lihat bagian 5.3) |

Rekap per kartu:

| Kartu | Rencana | Realisasi | Status |
|-------|---------|-----------|--------|
| PPL-22 | Sprint 2 (15 Nov) | Selesai | Selesai |
| PPL-23 | Sprint 2 (13 Nov) | Selesai | Selesai |
| PPL-24 | Sprint 2 (15 Nov) | Selesai | Selesai |
| PPL-34 | Sprint 2 (17 Nov) | Selesai | Selesai |
| PPL-04 | Sprint 2 (14 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-05 | Sprint 2 (16 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-06 | Sprint 2 (16 Nov) | Selesai dan sudah diuji (tidak digeser ke Sprint 3) | Selesai |
| PPL-07 | Sprint 2 (18 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-08 | Sprint 2 (18 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-25 | Sprint 2 (18 Nov) | 25.1, 25.2, dan 25.3 selesai | Selesai |

## 7. Tindak Lanjut dari Sprint Sebelumnya

Sprint 1 (5 - 11 November) menghasilkan fondasi sistem dan pengelolaan produk (PPL-01 sampai PPL-03). Tindak lanjut dari Sprint 1 dicatat di bawah.

| Hal dari sprint sebelumnya | Tindak lanjut di Sprint 2 | Bukti |
|----------------------------|---------------------------|-------|
| Tindakan retrospektif 1: pengujian dimulai segera setelah API dan halaman selesai | Sebagian terpenuhi: pengujian tersebar sesuai jadwal tiap story (14, 16, dan 18 Nov), tetapi PPL-07.3 dan PPL-08.4 tetap berada di hari terakhir sprint | Tanggal kartu pengujian di Jira, WBS |
| Tindakan retrospektif 2: jadwal kartu fitur disebar sejak awal sprint dan PR di-review maksimal 1 hari | Jadwal fitur tersebar mulai hari pertama (PPL-04 pada 12 Nov); seluruh PR sudah di-merge dan seluruh kartu selesai di dalam sprint | Riwayat PR di GitHub, tanggal kartu di Jira |
| AC-02.2 (harga baru berlaku pada transaksi atau pesanan baru) belum dapat diuji penuh | Sudah diuji penuh setelah kasir (PPL-05) dan checkout (PPL-08) selesai; hasilnya aman | Kartu pengujian PPL-05.3 dan PPL-08.4, hasil uji AC-02.2 |
| PPL-04 dipindah dari Sprint 1 ke Sprint 2 (K-13) | PPL-04 selesai dan diuji di Sprint 2 | Board Jira, WBS PPL-04 |

## 8. Bukti Sprint

- Board Jira, filter label Sprint 2: https://rizkipratamasunarko.atlassian.net/jira/software/projects/PPL/boards/4/backlog
- Screenshot board Jira per 18 November 2026 (seluruh kartu Sprint 2 berstatus Done):

  ![Gambar 1 Berikut hasil yang sudah terselesaikan di Sprint 2](img/board-jira-sprint-2.png)

  *Gambar 1 Berikut hasil yang sudah terselesaikan di Sprint 2*

- Desain UI/UX kasir, riwayat, katalog, dan checkout (PPL-22): https://stitch.google.com/projects/1713106232600797796
- Database transaksi dan pesanan (PPL-23):

  ![Gambar 2 Berikut gambar ERD transaksi dan pesanan](img/erd-database-sprint-2.jpeg)

  *Gambar 2 Berikut gambar ERD*

- Repositori GitHub: https://github.com/rizkisunarko/E-Commerce-UMKM-Toko-Abah.git
- Riwayat commit dan PR Sprint 2 (kanal Discord): https://discord.com/channels/1565614056445055058/1567819275992039455
- Screenshot `#github-notif` dan `#board-notif`:

  ![Gambar 3 Berikut Screenshot github-notif Sprint 2](img/github-notif-sprint-2.png)

  *Gambar 3 Berikut Screenshot github-notif Sprint 2*

  ![Gambar 4 Berikut screenshot board-notif Sprint 2](img/board-notif-sprint-2.png)

  *Gambar 4 Berikut screenshot board-notif Sprint 2*

- Catatan stand-up (15 dan 17 - 18 November) di `#diskusi`: https://discord.com/channels/1565614056445055058/1565614057036193796
- Berkas catatan ini: `docs/catatan-sprint/sprint-2.md`

## 9. Cara Menyimpan Catatan

1. Simpan berkas di `docs/catatan-sprint/sprint-2.md`.
2. Buat branch dari tombol Create branch pada kartu Jira (atau `feature/PPL-25-catatan-sprint-2`), commit `[PPL-86] isi sprint review, retrospektif, dan rekap Sprint 2`, lalu buka pull request dan minta review.
3. Pastikan kunci Jira kartu seremoni (PPL-25, atau key subtask PPL-84, PPL-85, dan PPL-86) dipakai pada commit agar tertaut ke kartu.
4. Pada 18 November, lengkapi bagian 3, 4, 5, 6, dan 7, lalu perbarui pull request dan pindahkan kartu PPL-25 ke Done.
