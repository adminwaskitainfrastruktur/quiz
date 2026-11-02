<?php
// Koneksi database bersama untuk api/ dan admin/.

function app_config(): array
{
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        throw new RuntimeException('config.php belum dibuat. Salin api/config.sample.php menjadi api/config.php lalu isi user & password database.');
    }
    $cfg = require $file;
    if (!is_array($cfg) || empty($cfg['db'])) {
        throw new RuntimeException('Format config.php tidak valid.');
    }
    return $cfg;
}

/** Permintaan dari komputer sendiri (Laragon/localhost) → boleh melihat detail error. */
function is_local_request(): bool
{
    $host = strtolower(parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST) ?: '');
    return in_array($host, ['localhost', '127.0.0.1', '[::1]', '::1'], true) || str_ends_with_compat($host, '.test');
}

function str_ends_with_compat(string $s, string $end): bool
{
    return $end === '' || substr($s, -strlen($end)) === $end;
}

/** Penjelasan singkat dalam Bahasa Indonesia untuk error database yang umum. */
function explain_db_error(Throwable $e): string
{
    $m = $e->getMessage();
    if (stripos($m, 'could not find driver') !== false) return 'Ekstensi PHP pdo_mysql belum aktif.';
    if (strpos($m, '[1045]') !== false) return 'User atau password database di api/config.php salah.';
    if (strpos($m, '[1049]') !== false) return 'Database belum ada. Buat database sesuai nama di api/config.php.';
    if (strpos($m, '[2002]') !== false) return 'Server MySQL tidak bisa dihubungi. Pastikan MySQL menyala (Laragon: Start All) dan host di config benar.';
    if (strpos($m, '[1142]') !== false) return 'User database tidak punya izin membuat/menulis tabel.';
    return $m;
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

/**
 * Membuat tabel bila belum ada (sama dengan database/schema.sql), sehingga situs tetap jalan
 * walau schema.sql lupa dijalankan. Aman dipanggil berulang.
 */
function ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $pdo->exec("CREATE TABLE IF NOT EXISTS responses (
        id CHAR(36) NOT NULL, version VARCHAR(16) NOT NULL, submitted_at DATETIME NOT NULL,
        started_at DATETIME NULL, duration_minutes DECIMAL(6,1) NULL, divisi VARCHAR(255) NULL,
        peran VARCHAR(100) NULL, answers LONGTEXT NOT NULL, raw LONGTEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_submitted (submitted_at), KEY idx_divisi (divisi(64)), KEY idx_peran (peran)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS response_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT, response_id CHAR(36) NOT NULL, table_name VARCHAR(100) NOT NULL,
        row_no SMALLINT UNSIGNED NOT NULL, data LONGTEXT NOT NULL,
        PRIMARY KEY (id), KEY idx_response (response_id), KEY idx_table (table_name),
        CONSTRAINT fk_items_response FOREIGN KEY (response_id) REFERENCES responses (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done = true;
}
