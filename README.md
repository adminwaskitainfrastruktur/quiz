# Kuesioner WKI — Survei Kebutuhan & Layanan Peralatan

Situs kuesioner responsif (HP, tablet, desktop) dari dokumen **Kuesioner WASKITA v2**.
Dibuat dengan React + TypeScript (TSX). Jawaban disimpan ke MySQL lewat PHP, sehingga bisa
dipasang di hosting Hostinger biasa tanpa Node.js.

- Alamat produksi: **https://iform.waskitainfrastruktur.co.id**
- Database: `u443105861_quiz`

## Fitur

- Satu bagian per halaman, ada bilah kemajuan, dan pertanyaan wajib dicek sebelum lanjut.
- Logika lompat sesuai dokumen: 3.1 → 3.2, 4.6 "Tidak ada" → lewati 4.7–4.8, 4.9 "Tidak" → lewati 4.10–4.12.
- Tabel isian (2.5, 4.2, 4.10) berupa kartu yang barisnya bisa ditambah, jadi tidak perlu template Excel terpisah.
- Skala dan matriks 1–5 tampil sebagai tabel di desktop dan sebagai tombol besar di HP.
- Draf tersimpan otomatis di browser. Responden bisa menutup halaman lalu melanjutkan nanti.
- Halaman ringkasan sebelum kirim. Bila koneksi gagal, responden bisa coba lagi atau mengunduh salinan jawaban.
- Halaman admin `/admin/` menampilkan jumlah respons dan tombol unduh CSV untuk Excel.

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
- Tombol **2.5 / 4.2 / 4.10**: satu baris per alat, lengkap dengan ID respons dan divisi.
- Pertanyaan yang dilewati karena logika lompat tetap punya kolom, tetapi kosong.
- Kolom `Durasi (menit)` dapat dipakai untuk mengukur waktu pengisian saat uji coba.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run serve` | Build dan jalankan situs lengkap (dengan PHP) di http://localhost:8080 |
| `npm run dev` + `npm run api` | Mode pengembangan dengan *hot reload* |
| `npm run build` | Build untuk diunggah ke hosting (`dist/`) |
| `npm test` | Tes logika validasi |
