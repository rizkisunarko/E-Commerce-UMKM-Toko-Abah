# DOKUMENTASI SPRINT 3

**Sistem E-Commerce UMKM Toko Abah – Seremoni Scrum Kartu PPL-29**

| Parameter | Keterangan |
|---|---|
| Nama Proyek | Sistem E-Commerce UMKM Toko Abah |
| Periode Sprint | 19 – 25 November 2026 (7 Hari) |
| Product Owner | Cintya |
| Scrum Master | Muamanah |
| Tim Pengembang | - Rizki (Frontend, UI/UX)<br>- Budi (Backend, Database) |
| Status Sprint | Selesai (Done) – Seluruh 3 User Story Berhasil, Kartu Pendukung PPL-27 Dijalakan di Sprint 4 |

## Ringkasan Sprint 3

Sprint 3 berhasil melanjutkan alur pemesanan online ke tahap pengiriman dan pembayaran: pilihan metode penerimaan pesanan (ambil di toko atau kurir pihak ketiga) di checkout (PPL-09), perhitungan ongkos kirim melalui API RajaOngkir (Komerce) mode sandbox (PPL-10), pembayaran online melalui Midtrans Snap mode sandbox beserta endpoint callback publik untuk memperbarui status Dibayar (PPL-11), serta pengarsipan atau penghapusan produk khusus admin (PPL-14). Seluruh user story telah lolos uji QA. Selain itu tim menyiapkan akun sandbox Midtrans (PPL-26), merekap catatan sprint 0–2 dan menyusun skrip serta storyboard video (PPL-28), dan memulai draf Laporan Requirement IEEE (PPL-27).

---

## 1. Sprint Planning (19 November 2026, Kartu PPL-29.1)

### 1.1. Tujuan dan Target Sprint

Pengiriman, pembayaran, dan arsip produk: metode penerimaan, API pengiriman, ongkos kirim, Midtrans Snap sandbox, serta arsip/hapus produk.

**Target Utama:** Pemesanan online dapat dilanjutkan ke pengiriman dan pembayaran.

### 1.2 User Story yang Dipilih dari Backlog

| Kode | User Story | Prioritas | Dep. | AC | PIC Utama | Jadwal |
|---|---|---|---|---|---|---|
| PPL-09 | Pelanggan memilih pengambilan pesanan di toko (gratis) atau pengiriman kurir pihak ketiga | High | PPL08 | 3 | - Budi (Backend)<br>- Rizki (UI)<br>- Cintya (Uji) | 19 – 20 Nov |
| PPL-10 | Pelanggan mengetahui ongkos kirim berdasarkan alamat tujuan | High | PPL08, 09 | 3 | - Budi (API)<br>- Rizki (UI)<br>- Cintya (QA) | 21 – 22 Nov |
| PPL-11 | Pelanggan membayar pesanan secara online (Midtrans Snap sandbox) | High | PPL08, 09 | 3 | - Budi<br>- Rizki<br>- Cintya | 23 – 25 Nov |
| PPL-14 | Admin mengarsipkan atau menghapus produk yang tidak dijual lagi | Medium | PPL01, 05 | 3 | - Budi<br>- Rizki<br>- Cintya | 19 – 21 Nov |

Total user story yang direncanakan: 4 User Story (3 High Priority dan 1 Medium Priority)

### 1.3 Kartu Pendukung Sprint

| Kode Kartu | Pekerjaan | PIC | Jadwal Pelaksanaan |
|---|---|---|---|
| PPL-26 | Persiapan akun sandbox Midtrans (Snap) dan penyiapan key di .env | Budi | 19 – 20 Nov |
| PPL-27 | Draf Laporan Requirement IEEE (Bab 1-5) | Cintya | 19 – 25 Nov |
| PPL-28 | Persiapan video dan catatan sprint (rekap catatan sprint 0-2, skrip dan stotybiard video) | Muamanah | 19 – 24 Nov |
| PPL-29 | Seremoni Scrum Sprint 3 | Muamanah | 19 – 25 Nov |

### 1.4 Pembagian Peran dan Manajemen Beban

| Anggota | Peran Scrum | Fokus Sprint 3 |
|---|---|---|
| Cintya | Product Owner / System Analyst | Pengujian PPL-09, PPL-10, PPL-11, dan PPL-14; penyusunan draf Laporan Requirement IEEE |
| Muamanah | Scrum Master | Seremoni sprint, stand-up tertulis, rekap catatan sprint 0–2, skrip dan storyboard video, rekap rencana vs realisasi |
| Rizki | Frontend, UI/UX | Pilihan metode penerimaan di checkout, tampilan ongkir dan total pembayaran, alur pembayaran, tombol dan konfirmasi arsip produk |
| Budi | Backend, Database | Akun sandbox Midtrans, backend metode penerimaan, integrasi RajaOngkir (Komerce), Midtrans Snap dan callback, API arsip/hapus produk |

**Aturan kapasitas beban tim:** Maksimal dua tugas paralel per orang pada saat yang sama (WIP Limit).

### 1.5 Definisi of Done (DoD)

- Kode program di-merge ke main melalui Pull Request (PR) yang telah direview dan disetujui anggota tim.
- Fitur telah diverifikasi dan diuji (QA) terhadap seluruh Kriteria Penerimaan (Acceptance Criteria).
- Tidak ada error fatal atau exception saat aplikasi dijalankan.
- Setiap commit message, branch fitur, dan pull request memuat Issue Key Jira yang sesuai.

### 1.6 Keputusan dan Mitigasi Risiko Saat Planning

| No | Keputusan atau Risiko | Rujukan |
|---|---|---|
| 1 | Prioritas dan pembagian sprint mengikuti Product Backlog yang disepakati pada rapat tim 5 November 2026. | K-12 |
| 2 | Prioritas PPL-09 dinaikkan ke High karena menjadi dependensi PPL-10 dan PPL-11. PPL-11 tidak bergantung pada PPL-10 agar pembayaran tidak terhambat keputusan penyedia ongkir. | K-13 |
| 3 | Tim menyepakati Midtrans (Snap) dan RajaOngkir (Komerce) pada mode sandbox. Akun sandbox RajaOngkir sudah disiapkan di Sprint 2 (PPL-34), akun Midtrans disiapkan di PPL-26. | K-08 |
| 4 | Callback sandbox Midtrans tidak dapat menjangkau localhost, sehingga dibutuhkan endpoint yang dapat diakses publik (PPL-11.5). | Sprint Planning |
| 5 | Pesanan baru disiapkan setelah status Dibayar; ongkir dibayar pelanggan; kurir pihak ketiga menjemput pesanan di toko. | K-05, K-10 |
| 6 | PPL-14 adalah story baru yang disetujui Product Owner. Produk yang sudah punya transaksi diarsipkan, bukan dihapus permanen (usulan); pegawai tidak boleh menghapus produk. | K-02, K-13 |
| 7 | Beban backend Budi melebihi batas dua tugas paralel (PPL-11.2, PPL-14.1) sehingga berisiko spillover. | WBS Sprint 3 |

### 1.7 Integrasi Tools dan Layanan Eksternal pada Sprint 3

| Kode | Titik Integrasi | Status per 18 Nov |
|---|---|---|
| I-1 | Github ke Discord (#github-notif) | Tetap terpasang dari Sprint 1 & aktif |
| I-2 | Agile Board (Jira) dan GitHub | Tetap terpasang, commit terpaut otomatis ke tiket Jira |
| I-3 | Agile Board (Jira) ke Discord (#board-notif) | Tetap terpasang via Jira Automation |
| PPL10.1 | API pengiriman RajaOngkir (Komerce), mode sandbox | Terpasang; key tersimpan di .env |
| PPL11.1 | Pembayaran Midtrans Snap, mode sandbox | Terpasang; key tersimpan di .env |
| PPL11.5 | Endpoint callback publik untuk notifikasi Midtrans (ngrok atau deploy sederhana) | Terpasang; dipakai PPL11.2 untuk memperbarui status Dibayar |

> **Catatan:** Integrasi API pengiriman dan pembayaran berjalan pada mode sandbox, bukan berarti toko sudah memakai layanan tersebut.

---

## 2. Progres Sprint (Status Akhir Sprint, 25 November 2026)

Berdasarkan pemantauan sheet WBS dan board Jira, seluruh pekerjaan diselesaikan dengan rincian berikut:

| Kode Kartu | Pekerjaan | Status | Keterangan Hasil |
|---|---|---|---|
| PPL-26 | Persiapan akun sandbox Midtrans (Snap) | Selesai | 26.1 (akun sandbox dan key di .env) selesai |
| PPL-09 | Ambil di toko / kurir pihak ketiga | Selesai | 09.1 (desain UI), 09.2 (backend), 09.3 (halaman checkout), dan 09.4 (pengujian) selesai |
| PPL-10 | Ongkos kirim (API pengiriman) | Selesai | 10.1 (RajaOngkir sandbox), 10.2 (tampilan ongkir di checkout), 10.3 (penanganan error), dan 10.4 (pengujian) selesai |
| PPL-14 | Arsip / hapus produk | Selesai | 14.1 (API), 14.2 (tombol dan konfirmasi khusus admin), dan 14.3 (pengujian) selesai |
| PPL-11 | Pembayaran online (Midtrans Snap) | Selesai | 11.1 (Midtrans), 11.5 (callback publik), 11.2 (penerimaan hasil pembayaran), 11.3 (frontend), dan 11.4 (pengujian berhasil, gagal, kedaluwarsa) selesai |
| PPL-27 | Draf Laporan Requirement IEEE | Selesai | 27.1 (draf Bab 1–5) dikerjakan Cintya; dilanjutkan dan difinalisasi di Sprint 4 (PPL-31.1) |
| PPL-28 | Perisiapan video dan catatan sprint | Selesai | 28.1 (rekap catatan sprint 0–2) dan 28.2 (skrip dan storyboard) selesai |
| PPL-29 | Seremoni Sprint 3 | Selesai | 29.1 (planning), 29.2 (stand-up Discord), 29.3 (review/retro) selesai |

**Ringkasan:** 4 dari 4 user story selesai (PPL-09, PPL-10, PPL-11, dan PPL-14), kartu pendukung PPL-26, PPL-28, dan PPL-29 selesai, sedangkan PPL-27 (draf Laporan Requirement) dilanjutkan di Sprint 4. Integrasi RajaOngkir (Komerce) dan Midtrans Snap sandbox sudah berjalan, dan seluruh fitur sudah diuji dan berjalan.

**Catatan akhir sprint:**

- Seluruh fitur sudah diuji oleh Cintya (PPL-09.4, PPL-10.4, PPL-11.4, PPL-14.3) dan diperiksa seluruh anggota kelompok. Hasilnya aman dan tidak ada temuan yang tersisa.
- Temuan selama pengujian sudah diperbaiki: nama penerima tidak mengikuti isian pemesan (20 November); harga di checkout berbeda dengan harga saat pembayaran (20 November); tombol arsip produk belum ada (22 November); tampilan tidak muncul karena API key backend belum dimasukkan (23 November); notifikasi pembayaran kedaluwarsa dan penanganan transaksi gagal (25 November) ditangani dan diuji pada PPL-11.4.
- Nomor WhatsApp toko untuk ringkasan pesanan masih nomor contoh (belum nomor asli).
- PPL-12.1 (API daftar dan status pesanan, jadwal Sprint 4) dikerjakan lebih awal oleh Rizki untuk meringankan beban Budi; PR sudah di-review Budi pada 24 November.

---

## 3. Stand-up Tertulis (Kartu PPL-29.2, 19 – 25 November 2026)

Stand-up meeting dilaksanakan melalui kanal Discord #diskusi:

### Stand-up 19 – 21 November 2026

| Anggota | Sudah Dijalankan | Akan Dijalankan | Kendala |
|---|---|---|---|
| Cintya | Menguji alur checkout dan ringkasan pesanan ke WhatsApp toko (PPL-09.4) | Menguji ongkos kirim (PPL-10.4) dan arsip produk (PPL-14.3) | Temuan: nama penerima tidak berubah mengikuti isian pemesan; harga di checkout berbeda dengan harga saat pembayaran |
| Muamanah | Sprint Planning (PPL-29.1); rekap catatan sprint 0–2 dalam bentuk PDF (PPL-28.1) | Skrip dan storyboard video (PPL-28.2); stand-up | Tidak ada kendala |
| Rizki | Desain dan implementasi pilihan "Ambil di toko" dan "Kurir pihak ketiga" (PPL-09.1, PPL-09.3); mulai PPL-10.2 dengan data tiruan (mock) | Menyambungkan tampilan ongkir ke API asli setelah PPL-10.1 siap | Nomor WhatsApp toko masih nomor contoh; menunggu endpoint PPL-10.1 dari Budi |
| Budi | Akun sandbox Midtrans (PPL-26.1); backend metode penerimaan (PPL-09.2); API arsip/hapus produk (PPL-14.1) | Integrasi RajaOngkir sandbox (PPL-10.1) dan penanganan error (PPL-10.3) | Beban sprint padat (lebih dari dua tugas paralel) |

### Stand-up 22 – 25 November 2026

| Anggota | Sudah Dijalankan | Akan Dijalankan | Kendala |
|---|---|---|---|
| Cintya | Menguji arsip produk (PPL-14.3); menguji ulang tampilan setelah API key backend dimasukkan; menguji pembayaran (PPL-11.4) | Melanjutkan draf Laporan Requirement (PPL-27.1) di Sprint 4; pengujian Sprint 4 | Temuan: tombol arsip belum ada (22 Nov); notifikasi pembayaran kedaluwarsa dan transaksi gagal ditanyakan (25 Nov). Seluruh temuan sudah ditangani |
| Muamanah | Skrip dan storyboard video (PPL-28.2) dibagikan ke tim; Sprint Review, Retrospektif, dan rekap Sprint 3 dokumen sprint dibagikan di kanal #dokumen-sprint (PPL-29.3) | Rekap Sprint 4 | Konsep pengambilan gambar video belum final (syuting atau animasi) |
| Rizki | Tampilan ongkir di checkout (PPL-10.2) dengan kontrak API ke tim; alur pembayaran (PPL-11.3); PPL-12.1 diambil alih dari Budi dan PR diajukan untuk di-review | Pekerjaan Sprint 4 (daftar dan status pesanan) | Temakai API key pribadi untuk uji coba; key dihapus setelah dikonfirmasi agar tidak terbaca saat presentasi |
| Budi | API arsip produk (PPL-14.1); RajaOngkir (PPL-10.1, PPL-10.3); Midtrans Snap (PPL-11.1); callback publik (PPL-11.5); penerimaan hasil pembayaran (PPL-11.2); review PR PPL-12.1 | Pekerjaan Sprint 4 | Tampilan arsip tidak dikerjakan Budi agar tidak konflik dengan frontend Rizki |

---

## 4. Sprint Review (25 November 2026, Kartu PPL-29.3)

**Peserta:** Cintya, Muamanah, Rizki, Budi
**Demo Kepada:** Product Owner (Cintya)

| Kode | Hasil Implementasi | Status | Catatan Review |
|---|---|---|---|
| PPL-09 | Pilihan "Ambil di toko" dan "Kurir pihak ketiga" di checkout, penyimpanan metode penerimaan di backend, dan pengujian (09.4) | Done | Fitur berjalan; nomor WhatsApp toko pada ringkasan pesanan masih nomor contoh |
| PPL-10 | Integrasi RajaOngkir (Komerce) sandbox, tampilan ongkir dan total di checkout, penanganan error, dan pengujian (10.4) | Done | Berat dihitung server dari data produk; tarif berasal dari sandbox |
| PPL-11 | Integrasi Midtrans Snap sandbox, callback publik, penerimaan hasil pembayaran, alur pembayaran di frontend, dan pengujian berhasil, gagal, kedaluwarsa (11.4) | Done | Seluruh skenario pembayaran sudah diuji dan hasilnya aman |
| PPL-14 | API arsip/hapus produk (produk bertransaksi diarsipkan), tombol dan konfirmasi khusus admin, dan pengujian (14.3) | Done | Temuan 22 November (tombol arsip belum ada) sudah diperbaiki dan diverifikasi aman |

### 4.1 Hasil Kartu Pendukung

PPL-26 dan PPL-28 selesai. PPL-27 (draf Laporan Requirement IEEE, Cintya) berjalan dan dilanjutkan di Sprint 4. Skrip dan storyboard video (PPL-28.2) sudah dibagikan ke tim; konsep pengambilan gambar masih menunggu masukan tim (animasi atau syuting sederhana, sisanya rekam layar aplikasi).

### 4.2 Umpan balik Product Owner / Mitra

Seluruh fitur sudah diuji dan berjalan. Tidak ada catatan tambahan dari Product Owner.

### 4.3 Item yang Pindah Ke Sprint 4 (Spillover)

Tidak ada user story yang spillover; PPL-09, PPL-10, PPL-11, dan PPL-14 selesai di Sprint 3. Satu kartu pendukung dilanjutkan ke Sprint 4:

| Kode | Item | PIC | Tindak Lanjut |
|---|---|---|---|
| PPL-27 | Draf Laporan IEEE (Bab 1-5) | Cintya | Dilanjutkan dan difinalisasi di Sprint 4 (PPL-31.1) |

---

## 5. Retrospektif Sprint 3 (25 November 2026)

Diisi bersama tim berdasarkan data sprint:

- Seluruh fitur Sprint 3 selesai dikembangkan sebelum hari terakhir sprint, dan seluruh pengujian aman.
- Budi memegang paling banyak kartu backend (PPL-09.2, 10.1, 10.3, 11.1, 11.2, 11.5, 14.1, 26.1); sebagian pekerjaan diambil alih Rizki.
- Rizki mengerjakan tampilan ongkir lebih dulu dengan data tiruan karena API belum siap.
- Beberapa temuan pengujian (pembayaran kedaluwarsa dan gagal) baru muncul di hari-hari akhir sprint.

### 5.1 Hal yang Berjalan Baik (What Went Well)

- Seluruh user story Sprint 3 (PPL-09, 10, 11, 14) selesai dan lulus pengujian, termasuk dua integrasi eksternal (RajaOngkir/Komerce dan Midtrans) pada mode sandbox.
- Kontrak API ongkir (format permintaan, respons, dan error) ditulis ke tim sebelum endpoint siap, sehingga frontend bisa berjalan paralel dengan data tiruan dan tinggal diganti ke API asli.
- Review PR lebih cepat: PR PPL-12.1 diajukan dan di-review pada malam yang sama (24 November), sesuai tindakan perbaikan Sprint 1.
- Pengujian oleh Cintya dimulai sejak 20 November, tidak menunggu akhir sprint, dan temuan langsung dilaporkan di #diskusi lalu diperbaiki.
- Pembagian kerja backend dan frontend dijaga agar tidak konflik (Budi menyediakan API, Rizki mengerjakan tampilan).
- Fitur Sprint 3 selesai lebih cepat sehingga tim bisa mulai mengerjakan kartu Sprint 4 (PPL-12.1).

### 5.2 Hal yang Perlu Diperbaiki (What Could Be Improved)

- Penanganan notifikasi pembayaran kedaluwarsa dan transaksi gagal baru ditanyakan di hari terakhir sprint, padahal pengujiannya sudah dijadwalkan di PPL-11.4.
- Frontend sempat menunggu endpoint PPL-10.1 sehingga PPL-10.2 harus memakai data tiruan lebih dulu.
- Beban backend tidak merata dan melebihi batas dua tugas paralel pada Budi.
- API key pribadi dipakai untuk uji coba dan berisiko terbaca saat presentasi.
- Konsep video belum final karena metode pengambilan gambar masih menunggu masukan tim.

### 5.3 Tindakan Perbaikan (Action Items untuk Sprint 4)

| No | Tindakan Perbaikan | PIC | Target | Bukti Verifikasi |
|---|---|---|---|---|
| 1 | Skenario pembayaran gagal dan kedaluwarsa dibahas dan diuji bersamaan dengan pengembangan, tidak menunggu hari terakhir sprint. | Cintya & Budi | Awal Sprint 4 | Kartu pengujian di Jira selesai sebelum hari terakhir |
| 2 | Kontrak API disepakati tertulis sebelum frontend dan backend berjalan paralel; seluruh key memakai akun tim di .env, bukan key pribadi. | Rizki & Budi | Sprint 4 | Catatan kontrak di #diskusi dan .env tidak ter-commit |

---

## 6. Rekap Rencana vs Realisasi Sprint 3

*Salin ke tab Sprint Planning (bagian Rekap Rencana vs Realisasi) dan Appendix D laporan.*

| Sprint | Tujuan Sprint | US Direncanakan | US selesai | Tindakan dari Retrospektif |
|---|---|---|---|---|
| Sprint 3 | Pengiriman, pembayaran, dan arsip produk | 4 | 5 (100%) | Skenario pembayaran diuji bersamaan dengan pengembangan; kontrak API dan key tim. |

### Rekap Detail per Kartu Pekerjaan

| Kartu | Target Rencana | Realisasi Akhir | Status |
|---|---|---|---|
| PPL-26 | Sprint 3 (20 Nov) | Selesai | Selesai |
| PPL-09 | Sprint 3 (20 Nov) | Selesai | Selesai |
| PPL-14 | Sprint 3 (21 Nov) | Selesai | Selesai |
| PPL-10 | Sprint 2 (22 Nov) | Selesai | Selesai |
| PPL-11 | Sprint 3 (25 Nov) | Selesai | Selesai |
| PPL-27 | Sprint 3 (25 Nov) | 7.1 berjalan, dilanjutkan di Sprint 4 (PPL-31.1) | Berjalan |
| PPL-28 | Sprint 3 (24 Nov) | Selesai | Selesai |
| PPL-29 | Sprint 3 (25 Nov) | 29.1, 29.2, 29.3 selesai | Selesai |

---

## 7. Tindak Lanjut dari Sprint Sebelumnya (Sprint 2)

Sprint 2 (12 – 18 November) mengerjakan penanda stok kritis, kasir, riwayat transaksi, katalog, serta keranjang dan checkout. Tindak lanjut dari Sprint 2 dan tindakan retrospektif sebelumnya dicatat di bawah.

| Hal dari Sprint 1 | Tindak Lanjut di Sprint 3 | Bukti |
|---|---|---|
| Pemesanan online dasar (katalog, keranjang, dan checkout; PPL-07 dan PPL-08) selesai | Dilanjutkan ke pilihan metode penerimaan, ongkos kirim, dan pembayaran di checkout (PPL-09 sampai PPL-11) | WBS PPL-09, PPL-10, PPL-11 |
| Akun sandbox RajaOngkir (Komerce) disiapkan di Sprint 2 (PPL-34) agar PPL-10 tidak menunggu | Dipakai untuk integrasi ongkos kirim (PPL-10.1) | WBS PPL-34, PPL-10.1 |
| Tindakan retrospektif Sprint 1: pengujian dimulai lebih awal dan PR di-review maksimal 1 hari kerja | Cintya mulai menguji sejak 20 November; PR PPL-12.1 diajukan dan di-review dalam satu malam (24 November) | Kartu pengujian di Jira, riwayat PR GitHub, #diskusi |
| Tindak lanjut AC-02.2: harga baru berlaku pada pesanan baru (menunggu kasir dan pemesanan online) | Harga di checkout dan saat pembayaran diuji pada Sprint 3; perbedaan harga ditemukan 20 November dan sudah diperbaiki | Catatan stand-up di #diskusi |
| Rekap catatan sprint 0–2 (PPL-28.1) | Direkap dalam bentuk PDF dan dibagikan ke tim | Kanal #dokumen-sprint |

---

## 8. Bukti Pelaksanaan Sprint (Evidences & Artifacts)

- **Agile Board Jira:** <https://rizkipratamasunarko.atlassian.net/jira/software/projects/PPL/boards/4/backlog>
- **Repositori Github:** <https://github.com/rizkisunarko/E-Commerce-UMKM-Toko-Abah.git>
- **Riwayat commit dan PR Sprint 3 (Kanal Discord):** <https://discord.com/channels/1565614056445055058/1567819275992039455>
- **Catatan Stand-up (19 - 21 dan 22 - 25 November) di #diskusi:** <https://discord.com/channels/1565614056445055058/1565614057036193796>
- **Desain Prototipe UI/UX (Stitch), kasir, riwayat, katalog, dan checkout (PPL-22):** <https://stitch.withgoogle.com/projects/1713106232600797796>
- **Screenshot board Jira per 25 November 2026 (Seluruh sprint berstatus Done):**

  ![Gambar 8.1 Berikut hasil yang sudah di selesaikan di sprint jira](images/gambar-8-1-board-jira.png)

  *Gambar 8.1 Berikut hasil yang sudah di selesaikan di sprint jira*

- **Screnshot #github-notif dan #board-notif:**

  ![Gambar 8.2 Berikut Sreenshot #github-notif](images/gambar-8-2-github-notif.png)

  *Gambar 8.2 Berikut Sreenshot #github-notif*

  ![Gambar 8.3 Berikut Screenshot #board-notif](images/gambar-8-3-board-notif.png)

  *Gambar 8.3 Berikut Screenshot #board-notif*

- **Berkas catatan ini:** `docs/catatan-sprint/sprint-3.md`

---

## 9. Cara Menyimpan Catatan

1. Simpan berkas di `docs/catatan-sprint/sprint-3.md`
2. Buat branch dari tombol Create branch pada karu Jira (atau `feature/PPL-29-catatan-sprint-3`), commit `[PPL-29] isi sprint review, retrospektif, dan rekap Sprint 3`, lalu buka pull request dan minta review.
3. Pastikan kunci Jira kartu seremoni (PPL-29, atau key subtask PPL-29.1, PPL-29.3) dipakai pada commit agar tertaut ke kartu.
4. Pada 25 November, lengkapi bagian 3, 4, 5, 6, dan 7, lalu perbarui pull request dan pindahkan kartu PPL-29 ke Done.
