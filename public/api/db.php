<?php
// Koneksi database bersama untuk api/ dan admin/.

function app_config(): array
{
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        throw new RuntimeException('config.php belum dibuat. Salin api/config.sample.php menjadi api/config.php lalu isi password.');
    }
    $cfg = require $file;
    if (!is_array($cfg) || empty($cfg['db'])) {
        throw new RuntimeException('Format config.php tidak valid.');
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = app_config()['db'];
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $c['host'], $c['name']);
    if (!empty($c['port'])) {
        $dsn .= ';port=' . (int) $c['port'];
    }
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+07:00'");
    return $pdo;
}
