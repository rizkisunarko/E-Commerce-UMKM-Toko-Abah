# Catatan Sprint 1

Proyek: Sistem E-Commerce UMKM Toko Abah
Periode: 5 - 11 November 2026 (7 hari)
Product Owner: Cintya
Scrum Master: Muamanah Nur Chayanti (PPL-21)
Status dokumen: draf per 7 November 2026. Bagian Planning terisi dari data sprint. Bagian Review dan Retrospektif diisi pada 11 November 2026 setelah sprint berakhir (ditandai `[isi]`).

Sumber data: sheet Product Backlog, Sprint Planning, WBS, dan Perlu Konfirmasi (K-12, K-13).

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
| (isi anggota lain) | (isi peran) | (isi tugas) |

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

| Kode | Integrasi | Status per 7 Nov |
|------|-----------|------------------|
| I-1 | GitHub ke Discord (`#github-notif`) | Terpasang |
| I-2 | Board (Jira) dan GitHub | Terpasang, commit tampil di panel Development |
| I-3 | Board (Jira) ke Discord (`#board-notif`) | Terpasang melalui Jira Automation |

Catatan: dosen diundang ke board, kanal komunikasi, dan repositori paling lambat akhir minggu ke-6 (PPL-16.4).

## 2. Progres Sprint (snapshot 7 November 2026)

Berdasarkan sheet WBS.

| Kode | Kartu | Status | Keterangan |
|------|-------|--------|------------|
| PPL-15 | Setup repositori dan struktur proyek | Selesai | 15.1, 15.2, 15.3 selesai |
| PPL-16 | Integrasi board, GitHub, kanal | Selesai | I-1, I-2, I-3 terpasang; kartu backlog sudah di Jira dan masih perlu revisi (16.1) |
| PPL-17 | Analisis kebutuhan | Berjalan | 17.1 dan 17.2 selesai; 17.3 (alur kelola produk, stok, kasir) belum mulai |
| PPL-18 | Desain UI/UX admin | Berjalan | 18.1 dan 18.2 selesai; 18.3 (review desain) berjalan |
| PPL-19 | Database produk dan stok | Selesai | ERD dan skema tabel selesai |
| PPL-20 | Autentikasi dan hak akses | Belum mulai | Jadwal 8 - 10 Nov |
| PPL-01 | Tambah produk | Belum mulai | Jadwal 9 - 11 Nov |
| PPL-02 | Ubah produk dan harga | Belum mulai | Jadwal 10 - 11 Nov |
| PPL-03 | Perbarui stok | Belum mulai | Jadwal 11 Nov |
| PPL-21 | Seremoni Sprint 1 | Berjalan | 21.1 selesai; 21.2 dan 21.3 belum |

Ringkasan: 3 dari 7 kartu pendukung selesai penuh (PPL-15, PPL-16, PPL-19), 2 berjalan (PPL-17, PPL-18). Tiga user story utama belum dimulai.

Perhatian: ketiga user story (PPL-01 sampai PPL-03) terjadwal pada 9 - 11 November, tiga hari terakhir sprint, dan bergantung pada API Budi serta halaman login. Risiko spillover PPL-03 tetap ada. PPL-17.3 melewati jadwal (8 November).

## 3. Stand-up Tertulis Mingguan (kartu PPL-21.2, 8 November 2026)

Ditulis di kanal `#diskusi`. Salin ringkasannya ke sini.

| Anggota | Sudah dikerjakan | Akan dikerjakan | Kendala |
|---------|------------------|-----------------|---------|
| Cintya | [isi] | [isi] | [isi] |
| Muamanah | [isi] | [isi] | [isi] |
| Rizki | [isi] | [isi] | [isi] |
| Budi | [isi] | [isi] | [isi] |
| (anggota lain) | [isi] | [isi] | [isi] |

## 4. Sprint Review (11 November 2026, kartu PPL-21.3)

Peserta: [isi]
Demo kepada: [Product Owner / mitra Toko Abah]

### 4.1 Hasil per user story

| Kode | Hasil | Selesai (Done) | Catatan |
|------|-------|:--------------:|---------|
| PPL-01 | [isi] | [ ] | [isi] |
| PPL-02 | [isi] | [ ] | [isi] |
| PPL-03 | [isi] | [ ] | [isi, jika spillover tulis alasan] |

### 4.2 Hasil kartu pendukung

[isi: PPL-17 sampai PPL-20 yang selesai, termasuk hasil review desain PPL-18.3]

### 4.3 Umpan balik Product Owner / mitra

[isi]

### 4.4 Item yang pindah ke Sprint 2 (spillover)

[isi: kode kartu dan alasan]

## 5. Retrospektif Sprint 1 (11 November 2026)

Diisi bersama tim. Bahan yang sudah terlihat dari data sprint (usulan, konfirmasikan dengan tim sebelum dipakai):

- Jadwal user story menumpuk di tiga hari terakhir sprint.
- PPL-17.3 belum dimulai walau jadwalnya 7 - 8 November.
- Kartu backlog di Jira masih perlu revisi (PPL-16.1).

### 5.1 Berjalan baik

- [isi]

### 5.2 Perlu diperbaiki

- [isi]

### 5.3 Tindakan perbaikan (1 - 2 butir, dikerjakan di Sprint 2)

| No | Tindakan | PIC | Batas waktu | Bukti |
|----|----------|-----|-------------|-------|
| 1 | [isi, contoh: pull request di-review maksimal 1 hari] | [isi] | Sprint 2 | [isi] |
| 2 | [isi] | [isi] | Sprint 2 | [isi] |

## 6. Rekap Rencana vs Realisasi Sprint 1

Salin ke tab Sprint Planning (bagian Rekap Rencana vs Realisasi) dan Appendix D laporan.

| Sprint | Tujuan sprint | User story direncanakan | User story selesai (Done) | Tindakan dari retrospektif |
|--------|---------------|:-----------------------:|:-------------------------:|----------------------------|
| Sprint 1 | Fondasi sistem dan pengelolaan produk | 3 | [isi 11 Nov] | [isi sesuai bagian 5.3] |

## 7. Tindak Lanjut dari Sprint Sebelumnya

Sprint 0 (27 Oktober - 4 November) menghasilkan Product Backlog, acceptance criteria, dan konfirmasi mitra. Tindak lanjut dari Sprint 0 dicatat di bawah.

| Hal dari sprint sebelumnya | Tindak lanjut di Sprint 1 | Bukti |
|----------------------------|---------------------------|-------|
| Revisi pasca-rapat 5 November (K-13): PPL-04 pindah ke Sprint 2, story PPL-14 baru, dependensi ditambah | Planning Sprint 1 hanya memuat PPL-01 sampai PPL-03 | Sheet Product Backlog, K-13 |
| [isi] | [isi] | [isi] |

## 8. Bukti Sprint

- Board Jira, filter label Sprint 1: [tautan]
- Repositori GitHub, riwayat commit dan PR Sprint 1: [tautan]
- Screenshot `#github-notif` dan `#board-notif`: [tautan atau berkas di `docs/`]
- Catatan stand-up di `#diskusi`: [tautan pesan]
- Berkas catatan ini: `docs/catatan-sprint/sprint-1.md`

## 9. Cara Menyimpan Catatan

1. Simpan berkas di `docs/catatan-sprint/sprint-1.md`.
2. Buat branch `feature/PPL-21-catatan-sprint-1`, commit `[PPL-21] tambah catatan Sprint 1`, lalu buka pull request dan minta review.
3. Pastikan kunci Jira kartu seremoni (PPL-21, atau key subtask PPL-21.1 sampai PPL-21.3) dipakai pada commit agar tertaut ke kartu.
4. Pada 11 November, lengkapi bagian 3, 4, 5, 6, dan 7, lalu perbarui pull request dan pindahkan kartu PPL-21 ke Done.