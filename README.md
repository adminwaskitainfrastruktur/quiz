# Kuesioner WKI — Survei Kebutuhan & Layanan Peralatan

Situs kuesioner responsif (HP, tablet, desktop) dari dokumen **Kuesioner WASKITA v2**, sudah termasuk revisi Book1.xlsx (2 Nov 2026).
Dibuat dengan React + TypeScript (TSX). Jawaban disimpan ke MySQL lewat PHP, sehingga bisa
dipasang di hosting Hostinger biasa tanpa Node.js.

- Alamat produksi: **https://iform.waskitainfrastruktur.co.id**
- Database: `u443105861_quiz`

## Fitur

- **Satu pertanyaan per layar** (pola template Typeform): judul besar, pilihan berhuruf A/B/C yang bisa
  dipilih dengan keyboard, tombol **OK** + "tekan Enter ↵", pindah otomatis setelah memilih jawaban tunggal,
  tombol ▲▼ di kanan bawah, dan bilah kemajuan di atas.
- Layar pembuka dan pembuka tiap bagian bertata letak terbelah (teks + ilustrasi), dengan peta bagian
  dan kalimat penghubung antarbagian.
- Animasi: transisi geser vertikal antarlayar, isi layar muncul berurutan, riak dari titik sentuh dan efek tekan
  pada semua tombol/pilihan, sorotan halus saat memilih,
  getar saat jawaban belum lengkap, warna latar berganti per bagian, konfeti saat terkirim.
  Semua gerak mati otomatis bila perangkat diatur "kurangi gerakan".
- Semua pertanyaan wajib diisi. Email boleh dari domain apa pun (kantor, Gmail, Outlook, dll.).
- Logika lompat: 3.1 → 3.2; 3.7 "hanya subkon" → lewati 3.8–3.9; 4.1 "Tidak" → lewati 4.2 dan 5.3;
  4.8 "Tidak ada" → lewati 4.9–4.10.
- 2.6 minimal 3, maksimal 5 alat: pilih kelompok alat (kartu bergambar), lalu satu tipe alat dari kelompok itu saja.
- 3.2 dan 3.6 berupa peringkat "ketuk sesuai urutan" (#1, #2, …) dengan tombol ▲▼ untuk menggeser; 3.6 = top 5 dari 7 aspek.
  Di data tersimpan sebagai nilai 5 (#1) sampai 1 (#5).
- Draf tersimpan otomatis di browser; ada halaman ringkasan dengan tombol "Ubah" per jawaban.
- Halaman admin `/admin/` menampilkan jumlah respons dan tombol unduh CSV untuk Excel.

## Logo

Letakkan file logo di `public/brand/` lalu build ulang (`npm run serve` / `npm run build`). Nama file bebas:
yang mengandung "wki" atau "waskita" dipakai sebagai logo utama, yang mengandung "danantara" sebagai logo
pendamping (PNG/SVG/JPG/WEBP). Selama file belum ada, situs menampilkan ikon pengganti.

## Struktur

| Lokasi | Isi |
|---|---|
| `src/survey.ts` | **Isi kuesioner**: teks, opsi, wajib/opsional, logika lompat. Ubah pertanyaan di sini. |
| `src/logic.ts` | Validasi dan penyusunan data yang dikirim. |
| `src/App.tsx`, `src/components/` | Tampilan (TSX). |
| `public/api/submit.php` | Menerima jawaban dan menyimpannya ke MySQL. |
| `public/api/config.sample.php` | Contoh pengaturan database dan password admin. |
| `public/admin/index.php` | Halaman admin dan unduhan CSV. |
| `public/.htaccess` | HTTPS, perlindungan file pengaturan, dan cache. |
| `database/schema.sql` | Tabel `responses` dan `response_items`. |

## Menjalankan di komputer (Laragon, port 8080)

Jalankan perintah di **Terminal Laragon** (tombol *Terminal* di Laragon), dengan Laragon dalam keadaan *Start All*.

```bat
cd C:\laragon\www
git clone -b claude/busy-cray-rhlw2w https://github.com/adminwaskitainfrastruktur/quiz.git Quiz
cd Quiz
npm install
copy public\api\config.sample.php public\api\config.php
```

Buka `public\api\config.php`, lalu ubah bagian `db` untuk MySQL Laragon (bawaan Laragon: user `root`, tanpa password):

```php
'user' => 'root',
'pass' => '',
```

Isi juga `admin_password`. Lalu buat database dan tabelnya:

```bat
mysql -u root -e "CREATE DATABASE IF NOT EXISTS u443105861_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root u443105861_quiz < database\schema.sql
```

Jalankan:

```bat
npm run serve
```

Buka **http://localhost:8080** untuk kuesioner dan **http://localhost:8080/admin/** untuk admin.

Untuk mengubah tampilan dengan *hot reload*, jalankan dua terminal: `npm run api` (PHP di port 8081)
dan `npm run dev` (situs di http://localhost:8080).

## Memasang di Hostinger (iform.waskitainfrastruktur.co.id)

1. **Database.** Di hPanel → *Databases* → phpMyAdmin untuk `u443105861_quiz` → tab **SQL** →
   tempel isi `database/schema.sql` → **Go**.
2. **Build.** Jalankan `npm run build`. Hasilnya ada di folder `dist/`, dan `config.php` sengaja *tidak* ikut.
   Kompres **isi** folder `dist/` menjadi ZIP (termasuk file `.htaccess`).
3. **Unggah.** hPanel → *File Manager* → buka folder subdomain `iform` (biasanya `public_html/iform`
   atau `domains/iform.waskitainfrastruktur.co.id/public_html`). Unggah ZIP, lalu **Extract** di sana,
   sehingga `index.html`, `.htaccess`, `assets/`, `api/`, dan `admin/` berada langsung di folder itu.
4. **Pengaturan.** Di folder `api/`, salin `config.sample.php` menjadi `config.php`. Isi password
   database `u443105861_workshop` dan password admin. Host tetap `localhost`.
5. **SSL.** Pastikan SSL aktif untuk subdomain (hPanel → *Security* → *SSL*), karena `.htaccess` mengalihkan ke HTTPS.
6. **Uji.** Isi kuesioner sekali, lalu cek di `/admin/`. Hapus data uji lewat phpMyAdmin:
   `DELETE FROM responses;` (baris tabel isian ikut terhapus otomatis).

Saat memperbarui situs, cukup timpa `index.html` dan folder `assets/`. Jangan menimpa `api/config.php`.

## Mengolah hasil

- `/admin/` → **Semua jawaban**: satu baris per responden, satu kolom per pertanyaan.
  Untuk matriks, setiap faktor punya kolom sendiri.
- Tombol **2.6 / 4.4**: satu baris per alat, lengkap dengan ID respons dan divisi.
- Pertanyaan yang dilewati karena logika lompat tetap punya kolom, tetapi kosong.
- Kolom `Durasi (menit)` dapat dipakai untuk mengukur waktu pengisian saat uji coba.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run serve` | Build dan jalankan situs lengkap (dengan PHP) di http://localhost:8080 |
| `npm run dev` + `npm run api` | Mode pengembangan dengan *hot reload* |
| `npm run build` | Build untuk diunggah ke hosting (`dist/`) |
| `npm test` | Tes logika validasi |
