<?php
// Halaman admin: jumlah respons, respons terbaru, dan unduh hasil (CSV untuk Excel).
require __DIR__ . '/../api/db.php';

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
session_name('wki_admin');
session_start();

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function e($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

$error = '';
try {
    $cfg = app_config();
} catch (Throwable $ex) {
    $cfg = null;
    $error = $ex->getMessage();
}
$adminPass = (string) ($cfg['admin_password'] ?? '');
$configured = $adminPass !== '' && $adminPass !== 'ISI_PASSWORD_ADMIN';

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

// Masuk / keluar
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $okToken = hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''));
    if (isset($_POST['logout']) && $okToken) {
        $_SESSION = [];
        session_destroy();
        header('Location: ./');
        exit;
    }
    if (isset($_POST['password']) && $okToken && $configured) {
        if (hash_equals($adminPass, (string) $_POST['password'])) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            header('Location: ./');
            exit;
        }
        sleep(2);
        $error = 'Password salah.';
    }
}
$authed = !empty($_SESSION['admin']) && $configured;

// ── Unduhan CSV ─────────────────────────────────────────────────
function csv_cell($v): string
{
    if ($v === null) {
        return '';
    }
    $s = is_float($v) ? str_replace('.', ',', (string) $v) : (string) $v;
    // Cegah teks dibaca sebagai rumus di Excel
    if ($s !== '' && in_array($s[0], ['=', '+', '-', '@', "\t", "\r"], true) && !is_numeric($s)) {
        $s = "'" . $s;
    }
    return $s;
}

function send_csv(string $filename, array $headers, iterable $rows, string $sep): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
    fputcsv($out, $headers, $sep);
    foreach ($rows as $r) {
        fputcsv($out, array_map('csv_cell', $r), $sep);
    }
    fclose($out);
    exit;
}

if ($authed && isset($_GET['download'])) {
    $sep = ($_GET['sep'] ?? '') === 'comma' ? ',' : ';';
    $pdo = db();
    $stamp = date('Ymd-His');
    if ($_GET['download'] === 'responses') {
        $rows = $pdo->query('SELECT id, submitted_at, duration_minutes, answers FROM responses ORDER BY submitted_at')->fetchAll();
        $cols = [];
        $decoded = [];
        foreach ($rows as $r) {
            $a = json_decode($r['answers'], true) ?: [];
            foreach (array_keys($a) as $k) {
                $cols[$k] = true;
            }
            $decoded[] = [$r, $a];
        }
        $cols = array_keys($cols);
        $out = [];
        foreach ($decoded as [$r, $a]) {
            $line = [$r['id'], $r['submitted_at'], $r['duration_minutes'] === null ? null : (float) $r['duration_minutes']];
            foreach ($cols as $c) {
                $line[] = $a[$c] ?? null;
            }
            $out[] = $line;
        }
        send_csv("kuesioner-jawaban-$stamp.csv", array_merge(['ID respons', 'Waktu kirim', 'Durasi (menit)'], $cols), $out, $sep);
    }
    if ($_GET['download'] === 'items') {
        $table = (string) ($_GET['table'] ?? '');
        $stmt = $pdo->prepare(
            'SELECT i.response_id, i.row_no, i.data, r.submitted_at, r.divisi
               FROM response_items i JOIN responses r ON r.id = i.response_id
              WHERE i.table_name = ? ORDER BY r.submitted_at, i.row_no'
        );
        $stmt->execute([$table]);
        $rows = $stmt->fetchAll();
        $cols = [];
        foreach ($rows as $r) {
            foreach (array_keys(json_decode($r['data'], true) ?: []) as $k) {
                $cols[$k] = true;
            }
        }
        $cols = array_keys($cols);
        $out = [];
        foreach ($rows as $r) {
            $d = json_decode($r['data'], true) ?: [];
            $line = [$r['response_id'], $r['submitted_at'], $r['divisi'], (int) $r['row_no']];
            foreach ($cols as $c) {
                $line[] = $d[$c] ?? null;
            }
            $out[] = $line;
        }
        $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($table)), '-') ?: 'tabel';
        send_csv("kuesioner-$slug-$stamp.csv", array_merge(['ID respons', 'Waktu kirim', 'Divisi', 'No.'], $cols), $out, $sep);
    }
}

// ── Data ringkas untuk dasbor ───────────────────────────────────
$stats = null;
if ($authed) {
    try {
        $pdo = db();
        ensure_schema($pdo);
        $stats = [
            'total' => (int) $pdo->query('SELECT COUNT(*) FROM responses')->fetchColumn(),
            'today' => (int) $pdo->query('SELECT COUNT(*) FROM responses WHERE DATE(submitted_at) = CURDATE()')->fetchColumn(),
            'avg' => $pdo->query('SELECT ROUND(AVG(duration_minutes), 1) FROM responses WHERE duration_minutes BETWEEN 1 AND 180')->fetchColumn(),
            'tables' => $pdo->query('SELECT table_name, COUNT(*) n FROM response_items GROUP BY table_name ORDER BY table_name')->fetchAll(),
            'byDiv' => $pdo->query('SELECT COALESCE(divisi, "-") divisi, COUNT(*) n FROM responses GROUP BY divisi ORDER BY n DESC')->fetchAll(),
            'latest' => $pdo->query('SELECT submitted_at, divisi, peran, duration_minutes FROM responses ORDER BY submitted_at DESC LIMIT 15')->fetchAll(),
        ];
    } catch (Throwable $ex) {
        error_log('[kuesioner-admin] ' . $ex->getMessage());
        $error = 'Tidak dapat terhubung ke database. Periksa pengaturan di api/config.php.'
            . (is_local_request() ? ' Penyebab: ' . explain_db_error($ex) : '');
    }
}
?><!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin · Kuesioner WKI</title>
<style>
  :root { --navy:#0f2a4f; --blue:#2563c9; --line:#dde3ec; --muted:#5a6577; --bg:#f3f5f9; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background:var(--bg); color:#17202e; }
  header { background:var(--navy); color:#fff; padding:14px 16px; }
  header div { max-width:960px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:12px; }
  main { max-width:960px; margin:0 auto; padding:20px 16px 48px; }
  h1 { font-size:1.1rem; margin:0; } h2 { font-size:1rem; margin:0 0 10px; }
  .card { background:#fff; border-radius:12px; padding:16px; margin-bottom:14px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:14px; }
  .stat b { display:block; font-size:1.8rem; color:var(--navy); } .stat span { color:var(--muted); font-size:.85rem; }
  .btn { display:inline-flex; align-items:center; min-height:40px; padding:8px 14px; border-radius:10px; border:1.5px solid var(--line);
         background:#fff; color:var(--navy); font-weight:600; text-decoration:none; cursor:pointer; font:inherit; }
  .btn-primary { background:var(--blue); border-color:var(--blue); color:#fff; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  table { width:100%; border-collapse:collapse; font-size:.9rem; }
  th, td { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:.8rem; }
  .scroll { overflow-x:auto; }
  .muted { color:var(--muted); font-size:.85rem; }
  .error { background:#fdecea; color:#8a1f17; padding:10px 12px; border-radius:10px; margin-bottom:14px; }
  form.login { max-width:360px; margin:40px auto; }
  input[type=password] { width:100%; min-height:44px; padding:10px 12px; border:1.5px solid var(--line); border-radius:10px; font-size:16px; margin:8px 0 12px; }
</style>
</head>
<body>
<header><div><h1>Admin · Kuesioner WKI</h1>
<?php if ($authed): ?>
  <form method="post"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><button class="btn" name="logout" value="1">Keluar</button></form>
<?php endif; ?>
</div></header>
<main>
<?php if ($error): ?><div class="error"><?= e($error) ?></div><?php endif; ?>

<?php if (!$configured): ?>
  <div class="card">Password admin belum diatur. Isi <code>admin_password</code> di <code>api/config.php</code>.</div>
<?php elseif (!$authed): ?>
  <form class="card login" method="post">
    <h2>Masuk</h2>
    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
    <label for="pw">Password admin</label>
    <input id="pw" type="password" name="password" autocomplete="current-password" required autofocus>
    <button class="btn btn-primary">Masuk</button>
  </form>
<?php elseif ($stats): ?>
  <div class="stats">
    <div class="card stat"><b><?= $stats['total'] ?></b><span>Total respons</span></div>
    <div class="card stat"><b><?= $stats['today'] ?></b><span>Masuk hari ini</span></div>
    <div class="card stat"><b><?= $stats['avg'] !== null ? e(str_replace('.', ',', $stats['avg'])) : '–' ?></b><span>Rata-rata menit pengisian</span></div>
  </div>

  <div class="card">
    <h2>Unduh hasil (CSV, bisa dibuka di Excel)</h2>
    <div class="row">
      <a class="btn btn-primary" href="?download=responses">Semua jawaban</a>
      <?php foreach ($stats['tables'] as $t): ?>
        <a class="btn" href="?download=items&amp;table=<?= e(rawurlencode($t['table_name'])) ?>"><?= e($t['table_name']) ?> (<?= (int) $t['n'] ?> baris)</a>
      <?php endforeach; ?>
    </div>
    <p class="muted">File memakai pemisah titik koma (;) untuk Excel berbahasa Indonesia.
      Bila kolom tidak terpisah di Excel Anda, gunakan <a href="?download=responses&amp;sep=comma">versi koma</a>.</p>
  </div>

  <div class="card">
    <h2>Respons per divisi</h2>
    <div class="scroll"><table>
      <tr><th>Divisi</th><th>Jumlah</th></tr>
      <?php foreach ($stats['byDiv'] as $d): ?><tr><td><?= e($d['divisi']) ?></td><td><?= (int) $d['n'] ?></td></tr><?php endforeach; ?>
    </table></div>
  </div>

  <div class="card">
    <h2>15 respons terbaru</h2>
    <div class="scroll"><table>
      <tr><th>Waktu</th><th>Divisi</th><th>Peran</th><th>Durasi</th></tr>
      <?php foreach ($stats['latest'] as $r): ?>
        <tr><td><?= e($r['submitted_at']) ?></td><td><?= e($r['divisi']) ?></td><td><?= e($r['peran']) ?></td>
            <td><?= $r['duration_minutes'] !== null ? e(str_replace('.', ',', $r['duration_minutes'])) . ' mnt' : '–' ?></td></tr>
      <?php endforeach; ?>
      <?php if (!$stats['latest']): ?><tr><td colspan="4" class="muted">Belum ada respons.</td></tr><?php endif; ?>
    </table></div>
  </div>
<?php endif; ?>
</main>
</body>
</html>
