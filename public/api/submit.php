<?php
// Menerima jawaban kuesioner (JSON) dan menyimpannya ke MySQL.
require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function cell($v): bool
{
    return $v === null || is_int($v) || is_float($v) || (is_string($v) && mb_strlen($v) <= 5000);
}

function to_datetime($iso): ?string
{
    if (!is_string($iso) || $iso === '') {
        return null;
    }
    try {
        $d = new DateTime($iso);
        $d->setTimezone(new DateTimeZone('Asia/Jakarta'));
        return $d->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}

function first_with_prefix(array $answers, string $prefix): ?string
{
    foreach ($answers as $k => $v) {
        if (strpos((string) $k, $prefix) === 0 && is_string($v) && $v !== '') {
            return mb_substr($v, 0, 255);
        }
    }
    return null;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'Gunakan metode POST.']);
}

// Hanya terima kiriman dari halaman kuesioner di domain yang sama
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
    reply(403, ['ok' => false, 'error' => 'Asal permintaan tidak diizinkan.']);
}

$body = file_get_contents('php://input', false, null, 0, 600000);
if ($body === false || strlen($body) >= 600000) {
    reply(413, ['ok' => false, 'error' => 'Data terlalu besar.']);
}
$data = json_decode($body, true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'Format data tidak dikenali.']);
}

// Umpan bot: manusia tidak pernah mengisi kolom ini
if (!empty($data['website'])) {
    reply(200, ['ok' => true]);
}

$id = $data['id'] ?? '';
$answers = $data['answers'] ?? null;
$tables = $data['tables'] ?? [];
if (!is_string($id) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
    reply(400, ['ok' => false, 'error' => 'ID respons tidak valid.']);
}
if (!is_array($answers) || count($answers) === 0 || count($answers) > 400 || !is_array($tables) || count($tables) > 20) {
    reply(400, ['ok' => false, 'error' => 'Isi jawaban tidak valid.']);
}
foreach ($answers as $k => $v) {
    if (!is_string($k) || strlen($k) > 255 || !cell($v)) {
        reply(400, ['ok' => false, 'error' => 'Isi jawaban tidak valid.']);
    }
}
$items = [];
foreach ($tables as $name => $rows) {
    if (!is_string($name) || strlen($name) > 100 || !is_array($rows) || count($rows) > 60) {
        reply(400, ['ok' => false, 'error' => 'Tabel isian tidak valid.']);
    }
    foreach (array_values($rows) as $i => $row) {
        if (!is_array($row) || count($row) > 30) {
            reply(400, ['ok' => false, 'error' => 'Tabel isian tidak valid.']);
        }
        foreach ($row as $k => $v) {
            if (!is_string($k) || strlen($k) > 255 || !cell($v)) {
                reply(400, ['ok' => false, 'error' => 'Tabel isian tidak valid.']);
            }
        }
        $items[] = [$name, $i + 1, $row];
    }
}

$json = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
$duration = isset($data['durationMinutes']) && is_numeric($data['durationMinutes'])
    ? min(9999.9, max(0, round((float) $data['durationMinutes'], 1)))
    : null;
$raw = isset($data['raw']) && is_array($data['raw']) ? json_encode($data['raw'], $json) : null;

try {
    $pdo = db();
    ensure_schema($pdo);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO responses
           (id, version, submitted_at, started_at, duration_minutes, divisi, peran, answers, raw)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        strtolower($id),
        mb_substr((string) ($data['version'] ?? ''), 0, 16),
        to_datetime($data['startedAt'] ?? null),
        $duration,
        first_with_prefix($answers, '1.4 '),
        first_with_prefix($answers, '1.6 '),
        json_encode($answers, $json),
        $raw,
    ]);
    if ($stmt->rowCount() === 0) {
        // Sudah tersimpan sebelumnya (mis. tombol kirim ditekan dua kali)
        $pdo->commit();
        reply(200, ['ok' => true, 'id' => $id, 'duplicate' => true]);
    }
    $ins = $pdo->prepare('INSERT INTO response_items (response_id, table_name, row_no, data) VALUES (?, ?, ?, ?)');
    foreach ($items as [$name, $no, $row]) {
        $ins->execute([strtolower($id), $name, $no, json_encode($row, $json)]);
    }
    $pdo->commit();
    reply(200, ['ok' => true, 'id' => $id]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[kuesioner] ' . $e->getMessage());
    // Di komputer sendiri (localhost/Laragon) tampilkan penyebabnya; di hosting cukup pesan umum.
    $detail = is_local_request() ? ' Penyebab: ' . explain_db_error($e) . ' Cek juga api/health.php.' : '';
    reply(500, ['ok' => false, 'error' => 'Server gagal menyimpan jawaban.' . $detail]);
}
