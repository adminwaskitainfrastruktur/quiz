<?php
/*
 * CONTOH pengaturan. Di server (File Manager Hostinger):
 *   1. Salin file ini menjadi `config.php` di folder yang sama (api/).
 *   2. Isi password database dan password admin.
 * Jangan pernah mengirim isi config.php lewat chat/email atau meng-commit-nya ke GitHub.
 * File ini tidak bisa dibuka dari browser (diblokir .htaccess).
 */
return [
    'db' => [
        // Untuk PHP yang berjalan di hosting Hostinger yang sama, host-nya "localhost".
        'host' => 'localhost',
        'name' => 'u443105861_quiz',
        'user' => 'u443105861_workshop',
        'pass' => 'ISI_PASSWORD_DATABASE',
    ],
    // Password untuk halaman admin (iform.waskitainfrastruktur.co.id/admin/).
    // Gunakan minimal 12 karakter.
    'admin_password' => 'ISI_PASSWORD_ADMIN',
];
