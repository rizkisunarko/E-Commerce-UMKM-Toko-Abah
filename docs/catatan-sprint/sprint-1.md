# DOKUMENTASI SPRINT 1

Proyek: Sistem E-Commerce UMKM Toko Abah
Periode: 5 - 11 November 2026 (7 hari)
Product Owner: Cintya
Scrum Master: Muamanah Nur Chayanti (PPL-21)

## 1. Sprint Planning (5 November 2026, kartu PPL-21.1, selesai)

### 1.1 Tujuan sprint

Fondasi sistem dan pengelolaan produk: setup proyek dan integrasi tools, analisis dan desain, database, autentikasi, tambah dan ubah produk, serta perbarui stok.

Target sprint: pengelolaan produk dan stok dasar dapat digunakan.

### 1.2 User story yang dipilih dari backlog

| Kode | User story | Prioritas | Dependensi | AC | PIC utama | Jadwal |
|------|------------|-----------|------------|----|-----------|--------|
| PPL-01 | Admin menambahkan data produk (nama, kategori, harga, berat, stok awal, batas stok kritis) | High | - | 3 | Budi (API), Rizki (halaman), Cintya (uji) | 9 - 11 Nov |
| PPL-02 | Admin mengubah informasi produk (termasuk berat) dan harga | High | PPL-01 | 3 | Budi, Rizki, Cintya | 10 - 11 Nov |
| PPL-03 | Admin memperbarui jumlah stok barang | High | PPL-01 | 3 | Budi, Rizki, Cintya | 11 Nov |

Total user story direncanakan: 3.

### 1.3 Kartu pendukung sprint

| Kode | Kartu | PIC | Jadwal |
|------|-------|-----|--------|
| PPL-15 | Setup repositori dan struktur proyek | Rizki | 5 - 7 Nov |
| PPL-16 | Integrasi Agile board, GitHub, dan kanal komunikasi | Rizki | 5 - 9 Nov |
| PPL-17 | Analisis kebutuhan dan alur proses (produk, stok, kasir) | Cintya | 5 - 8 Nov |
| PPL-18 | Desain UI/UX admin produk dan stok | Rizki (review Cintya) | 5 - 10 Nov |
| PPL-19 | Perancangan database produk dan stok | Budi | 5 - 8 Nov |
| PPL-20 | Autentikasi dan hak akses | Budi (halaman login Rizki) | 8 - 10 Nov |
| PPL-21 | Seremoni Scrum Sprint 1 | Muamanah | 5 - 11 Nov |

### 1.4 Pembagian peran dan beban

| Anggota | Peran | Fokus Sprint 1 |
|---------|-------|----------------|
| Cintya | Product Owner / System Analyst | Analisis kebutuhan, review desain, pengujian PPL-01 sampai PPL-03 |
| Muamanah Nur Chayanti | Scrum Master | Seremoni sprint, stand-up, rekap rencana vs realisasi |
| Rizki | Frontend, UI/UX | Setup repositori, integrasi tools, desain, halaman login, form produk dan stok |
| Budi | Backend | Database, autentikasi, API produk dan stok |

Aturan beban: maksimal dua tugas paralel per orang.

### 1.5 Definition of Done

- Kode di-merge ke `main` melalui pull request yang di-review anggota lain.
- Fitur sudah diuji (QA) terhadap kriteria penerimaan.
- Tidak ada error saat dijalankan.
- Commit, branch, dan PR memuat kode kartu Jira.

### 1.6 Keputusan dan risiko saat planning

| No | Keputusan atau risiko | Rujukan |
|----|-----------------------|---------|
| 1 | Prioritas dan pembagian sprint disepakati pada rapat tim 5 November 2026. | K-12 |
| 2 | PPL-04 (penanda stok kritis) dipindah dari Sprint 1 ke Sprint 2 karena beban Sprint 1 terlalu padat. Disetujui Product Owner. | K-13 |
| 3 | Sprint 1 adalah sprint paling padat. PPL-03 berisiko spillover ke Sprint 2. | Sprint Planning |
| 4 | Story baru PPL-14 (arsip/hapus produk) dijadwalkan di Sprint 3. | K-13 |
| 5 | Berat produk (gram) wajib ada pada data produk karena dipakai menghitung ongkos kirim. | K-08 |
| 6 | Hak akses: pegawai tidak boleh mengubah harga, menambah, atau menghapus produk. | K-02, K-14 |

### 1.7 Integrasi tools pada sprint ini

| Kode | Integrasi | Status per 11 Nov |
|------|-----------|-------------------|
| I-1 | GitHub ke Discord (`#github-notif`) | Terpasang |
| I-2 | Board (Jira) dan GitHub | Terpasang, commit tampil di panel Development |
| I-3 | Board (Jira) ke Discord (`#board-notif`) | Terpasang melalui Jira Automation |

Catatan: dosen diundang ke board, kanal komunikasi, dan repositori paling lambat akhir minggu ke-6 (PPL-16.4).

## 2. Progres Sprint (status akhir sprint, 11 November 2026)

Berdasarkan sheet WBS dan board Jira.

| Kode | Kartu | Status | Keterangan |
|------|-------|--------|------------|
| PPL-15 | Setup repositori dan struktur proyek | Selesai | 15.1, 15.2, 15.3 selesai |
| PPL-16 | Integrasi board, GitHub, kanal | Selesai | I-1, I-2, I-3 terpasang; kartu backlog sudah di Jira dan sudah direvisi (16.1) |
| PPL-17 | Analisis kebutuhan | Selesai | 17.1, 17.2, dan 17.3 (alur kelola produk, stok, kasir) selesai |
| PPL-18 | Desain UI/UX admin | Selesai | 18.1, 18.2, dan 18.3 (review desain) selesai |
| PPL-19 | Database produk dan stok | Selesai | ERD dan skema tabel selesai |
| PPL-20 | Autentikasi dan hak akses | Selesai | Backend dan halaman login selesai |
| PPL-01 | Tambah produk | Selesai | 01.1 (API), 01.2 (halaman), dan 01.3 (pengujian) selesai |
| PPL-02 | Ubah produk dan harga | Selesai | 02.1 (API, PPL-54), 02.2 (halaman), dan 02.3 (pengujian, PPL-56) selesai |
| PPL-03 | Perbarui stok | Selesai | 03.1 (API, PPL-57), 03.2 (halaman), dan 03.3 (pengujian, PPL-59) selesai |
| PPL-21 | Seremoni Sprint 1 | Berjalan | 21.1 selesai; 21.2 (stand-up) ditulis di `#diskusi`; 21.3 (PPL-62) sedang dikerjakan 11 Nov, selesai setelah PR dokumen ini di-merge |

Ringkasan: 6 dari 6 kartu pendukung teknis selesai (PPL-15 sampai PPL-20), 3 dari 3 user story selesai (PPL-01 sampai PPL-03), dan hanya PPL-21 (seremoni) yang masih berjalan pada 11 November. Integrasi GitHub dan Jira sudah selesai, seluruh anggota mengerjakan tugas sesuai peran (jobdesk) masing-masing, dan seluruh fitur sudah diuji dan berjalan tanpa kendala.

Catatan akhir sprint:
- Seluruh anggota tim mengerjakan tugas sesuai peran (jobdesk) masing-masing, dan tidak ada kendala pada pengerjaan.
- Seluruh fitur sudah diuji oleh Cintya (PPL-01.3, PPL-02.3/PPL-56, PPL-03.3/PPL-59) dan diperiksa seluruh anggota kelompok. Hasilnya aman dan tidak ada temuan yang tersisa.
- Temuan pada pengujian fitur perbarui stok sudah diperbaiki dan dinyatakan aman oleh seluruh anggota.
- AC-02.2 (harga baru berlaku pada transaksi atau pesanan baru) tidak dapat diuji penuh pada Sprint 1 karena kasir (PPL-05) dan pemesanan online (PPL-08) dikerjakan di Sprint 2. Pada Sprint 1 pengujian dibatasi sampai harga baru tersimpan dan tampil di daftar produk; pengujian penuh menjadi tindak lanjut Sprint 2.

## 3. Stand-up Tertulis (kartu PPL-21.2, 8 - 11 November 2026)

Ditulis di kanal `#diskusi`. Salin ringkasannya ke sini.

**Stand-up 8 - 9 November 2026**

| Anggota | Sudah dikerjakan | Akan dikerjakan | Kendala |
|---------|------------------|-----------------|---------|
| Cintya | Analisis kebutuhan dan alur proses (PPL-17) | Pengujian PPL-01.3, PPL-02.3 (PPL-56), dan PPL-03.3 (PPL-59) | Tidak ada kendala |
| Muamanah | Sprint Planning (PPL-21.1); mencoba menjalankan web dan menguji fitur perbarui stok | Stand-up, Sprint Review, Retrospektif, dan rekap (PPL-21.2 dan PPL-21.3 / PPL-62) | Tidak ada kendala |
| Rizki | Setup repositori, integrasi tools, desain UI/UX, halaman produk dan stok (PPL-02.2, PPL-03.2) | Review PR API dan integrasi halaman dengan API | Tidak ada kendala |
| Budi | Database, autentikasi, API produk dan stok (PPL-54 dan PPL-57) | Pull request API ke `main` | Tidak ada kendala |

**Stand-up 11 November 2026**

| Anggota | Sudah dikerjakan | Akan dikerjakan | Kendala |
|---------|------------------|-----------------|---------|
| Cintya | Implementasi halaman produk | Fitur stok | Tidak ada |
| Muamanah | Analisis kebutuhan dan dokumentasi | Memperbaiki acceptance criteria dan dokumentasi sprint | Tidak ada |
| Rizki | Desain UI/UX halaman kasir dan checkout | Implementasi halaman checkout | Tidak ada |
| Budi | Struktur backend dan koneksi database | Implementasi fitur produk | Penyesuaian struktur database |

## 4. Sprint Review (11 November 2026, kartu PPL-21.3 / PPL-62)

Peserta: Cintya, Muamanah, Rizki, Budi
Demo kepada: Product Owner (Cintya)

### 4.1 Hasil per user story

| Kode | Hasil | Selesai (Done) | Catatan |
|------|-------|:--------------:|---------|
| PPL-01 | API tambah produk (01.1), halaman form (01.2), dan pengujian AC-01.1 sampai AC-01.3 (01.3) selesai; fitur berjalan | ✔ | Seluruh anggota memeriksa dan hasilnya aman |
| PPL-02 | API (02.1, PPL-54), halaman (02.2), dan pengujian PPL-02.3 (PPL-56) selesai; fitur berjalan | ✔ | AC-02.2 (harga baru berlaku ke depan) baru dapat diuji penuh di Sprint 2 setelah PPL-05 dan PPL-08; AC-02.1 dan AC-02.3 diuji di Sprint 1 |
| PPL-03 | API (03.1, PPL-57), halaman (03.2), dan pengujian PPL-03.3 (PPL-59) selesai; fitur berjalan | ✔ | Temuan saat pengujian sudah diperbaiki dan hasilnya aman |

### 4.2 Hasil kartu pendukung

PPL-15 sampai PPL-20 selesai (lihat bagian 2). Hasil review desain PPL-18.3: desain high fidelity halaman produk dan stok sudah direview bersama tim dan kartu selesai, catatan perbaikan dari pemilik toko belum tercatat.

### 4.3 Umpan balik Product Owner / mitra

Seluruh fitur sudah diuji dan berjalan. Tidak ada catatan tambahan dari Product Owner.

### 4.4 Item yang pindah ke Sprint 2 (spillover)

Tidak ada user story yang spillover; PPL-01, PPL-02, dan PPL-03 selesai di Sprint 1. Tindak lanjut ke Sprint 2: pengujian penuh AC-02.2 setelah kasir (PPL-05) dan pemesanan online (PPL-08) tersedia.

## 5. Retrospektif Sprint 1 (11 November 2026)

Diisi bersama tim berdasarkan data sprint:

- Jadwal user story menumpuk di tiga hari terakhir sprint.
- Pengujian PPL-01.3, PPL-02.3 (PPL-56), dan PPL-03.3 (PPL-59) baru selesai 10 November, sehari sebelum akhir sprint.
- Beban sprint paling padat sejak planning; apakah batas dua tugas paralel per orang realistis?
- Dependensi antar-sprint: AC-02.2 baru dapat diuji penuh setelah PPL-05 dan PPL-08.

### 5.1 Berjalan baik

- Kartu pendukung teknis PPL-15 sampai PPL-20 (repositori, integrasi tools, analisis, desain, database, autentikasi) selesai sesuai jadwal sprint.
- Integrasi GitHub, Jira, dan Discord (I-1, I-2, I-3) terpasang sejak awal sprint, sehingga progres dan commit mudah dipantau.
- Seluruh fitur PPL-01 sampai PPL-03 sudah diuji dan berjalan; temuan saat pengujian langsung diperbaiki sebelum akhir sprint.
- Seluruh anggota mengerjakan tugas sesuai peran (jobdesk) masing-masing tanpa kendala; integrasi GitHub dan Jira selesai, dan kartu backlog di Jira sudah direvisi (PPL-16.1).

### 5.2 Perlu diperbaiki

- Pengujian ketiga user story menumpuk di hari-hari terakhir sprint, sehingga waktu perbaikan bila ditemukan bug sangat sempit.
- Kartu fitur utama (PPL-01 sampai PPL-03) dijadwalkan pada tiga hari terakhir sprint dan bergantung pada autentikasi serta database.

### 5.3 Tindakan perbaikan (1 - 2 butir, dikerjakan di Sprint 2)

| No | Tindakan | PIC | Batas waktu | Bukti |
|----|----------|-----|-------------|-------|
| 1 | Pengujian (sub-tugas .3) dimulai segera setelah API dan halaman selesai, tidak menunggu hari terakhir sprint | Cintya | Sprint 2 | Kartu pengujian di Jira selesai sebelum hari terakhir sprint |
| 2 | Jadwal kartu fitur disebar sejak awal sprint dan pull request di-review maksimal 1 hari | Muamanah dan seluruh tim | Sprint 2 | Riwayat PR di GitHub dan tanggal kartu di Jira |

## 6. Rekap Rencana vs Realisasi Sprint 1

Salin ke tab Sprint Planning (bagian Rekap Rencana vs Realisasi) dan Appendix D laporan.

| Sprint | Tujuan sprint | User story direncanakan | User story selesai (Done) | Tindakan dari retrospektif |
|--------|---------------|:-----------------------:|:-------------------------:|----------------------------|
| Sprint 1 | Fondasi sistem dan pengelolaan produk | 3 | 3 | Pengujian dimulai lebih awal dan jadwal disebar (lihat bagian 5.3) |

Rekap per kartu:

| Kartu | Rencana | Realisasi | Status |
|-------|---------|-----------|--------|
| PPL-15 | Sprint 1 (7 Nov) | Selesai | Selesai |
| PPL-16 | Sprint 1 (9 Nov) | Selesai | Selesai |
| PPL-17 | Sprint 1 (8 Nov) | Selesai | Selesai |
| PPL-18 | Sprint 1 (10 Nov) | Selesai | Selesai |
| PPL-19 | Sprint 1 (8 Nov) | Selesai | Selesai |
| PPL-20 | Sprint 1 (10 Nov) | Selesai | Selesai |
| PPL-01 | Sprint 1 (11 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-02 | Sprint 1 (11 Nov) | Selesai dan sudah diuji (AC-02.2 penuh di Sprint 2) | Selesai |
| PPL-03 | Sprint 1 (11 Nov) | Selesai dan sudah diuji | Selesai |
| PPL-21 | Sprint 1 (11 Nov) | 21.1 selesai; 21.2 ditulis di `#diskusi`; 21.3 sedang dikerjakan 11 Nov | Berjalan (Selesai setelah PR di-merge) |

## 7. Tindak Lanjut dari Sprint Sebelumnya

Sprint 0 (27 Oktober - 4 November) menghasilkan Product Backlog, acceptance criteria, dan konfirmasi mitra. Tindak lanjut dari Sprint 0 dicatat di bawah.

| Hal dari sprint sebelumnya | Tindak lanjut di Sprint 1 | Bukti |
|----------------------------|---------------------------|-------|
| Revisi pasca-rapat 5 November (K-13): PPL-04 pindah ke Sprint 2, story PPL-14 baru, dependensi ditambah | Planning Sprint 1 hanya memuat PPL-01 sampai PPL-03 | Sheet Product Backlog, K-13 |
| Product Backlog dipindahkan ke Jira Scrum | Seluruh kartu backlog sudah ada di board Jira dan sudah direvisi (PPL-16.1) | Board Jira, WBS PPL-16.1 |
| Kebutuhan fungsional dan nonfungsional perlu dianalisis sebelum pengembangan | Dianalisis di PPL-17, lalu digabung menjadi satu dokumen kebutuhan dan alur proses | Dokumen di `#diskusi`, WBS PPL-17 |

## 8. Bukti Sprint

- Board Jira, filter label Sprint 1: https://rizkipratamasunarko.atlassian.net/jira/software/projects/PPL/boards/4/backlog
- Screenshot board Jira per 11 November 2026 (PPL-01, 02, 03, dan PPL-15 sampai PPL-20 berstatus Done):

  ![Gambar 1 Berikut hasil yang sudah terselesaikan di sprint](img/board-jira-sprint-1.png)

  *Gambar 1 Berikut hasil yang sudah terselesaikan di sprint*

- Desain UI/UX (PPL-18): https://stitch.withgoogle.com/projects/1713106232600797796
- Database dan ERD (PPL-19):

  ![Gambar 1 Berikut gambar ERD nya](img/erd-database.png)

  *Gambar 1 Berikut gambar ERD nya*

- Repositori GitHub: https://github.com/rizkisunarko/E-Commerce-UMKM-Toko-Abah.git
- Riwayat commit dan PR Sprint 1 (kanal Discord): https://discord.com/channels/1565614056445055058/1567819275992039455
- Screenshot `#github-notif` dan `#board-notif`:

  ![Gambar 2 Berikut Screenshot github-notif](img/github-notif.png)

  *Gambar 2 Berikut Screenshot github-notif*

  ![Gambar 3 Berikut screenshot board-notif](img/board-notif.png)

  *Gambar 3 Berikut screenshot board-notif*

- Catatan stand-up (8 - 9 dan 11 November) di `#diskusi`: https://discord.com/channels/1565614056445055058/1565614057036193796
- Berkas catatan ini: `docs/catatan-sprint/sprint-1.md`

## 9. Cara Menyimpan Catatan

1. Simpan berkas di `docs/catatan-sprint/sprint-1.md`.
2. Buat branch dari tombol Create branch pada kartu Jira (atau `feature/PPL-21-catatan-sprint-1`), commit `[PPL-62] isi sprint review, retrospektif, dan rekap Sprint 1`, lalu buka pull request dan minta review.
3. Pastikan kunci Jira kartu seremoni (PPL-21, atau key subtask PPL-21.1 sampai PPL-21.3) dipakai pada commit agar tertaut ke kartu.
4. Pada 11 November, lengkapi bagian 3, 4, 5, 6, dan 7, lalu perbarui pull request dan pindahkan kartu PPL-21 ke Done.
