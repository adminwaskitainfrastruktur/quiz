<?php
// Cek kesiapan server: buka /api/health.php di browser.
// Di localhost menampilkan detail; di hosting hanya status singkat (tanpa membocorkan pengaturan).
require __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$local = is_local_request();
$checks = [];
$add = function (string $name, bool $ok, string $detail = '') use (&$checks, $local) {
    $checks[] = ['cek' => $name, 'ok' => $ok] + ($local && $detail !== '' ? ['detail' => $detail] : []);
    return $ok;
};

$phpOk = version_compare(PHP_VERSION, '7.4', '>=');
$add('PHP versi ' . PHP_VERSION, $phpOk, $phpOk ? '' : 'Butuh PHP 7.4 atau lebih baru.');
$pdoOk = extension_loaded('pdo_mysql');
$add('Ekstensi pdo_mysql', $pdoOk, $pdoOk ? '' : 'Aktifkan ekstensi pdo_mysql di php.ini.');
$cfgOk = false;
try {
    $cfg = app_config();
    $cfgOk = $add('api/config.php', true, 'Database: ' . ($cfg['db']['name'] ?? '?') . ', user: ' . ($cfg['db']['user'] ?? '?') . ', host: ' . ($cfg['db']['host'] ?? '?'));
} catch (Throwable $e) {
    $add('api/config.php', false, $e->getMessage());
}
if ($cfgOk) {
    try {
        $pdo = db();
        $add('Koneksi database', true);
        ensure_schema($pdo);
        $n = (int) $pdo->query('SELECT COUNT(*) FROM responses')->fetchColumn();
        $add('Tabel responses & response_items', true, "$n respons tersimpan.");
    } catch (Throwable $e) {
        $add('Koneksi/tabel database', false, explain_db_error($e));
    }
}
$allOk = !in_array(false, array_column($checks, 'ok'), true);
http_response_code($allOk ? 200 : 500);
echo json_encode(['ok' => $allOk, 'checks' => $checks], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
