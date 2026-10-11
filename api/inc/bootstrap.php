<?php
declare(strict_types=1);
/* ITEP — base comum: configuração, banco, respostas JSON, validação, limite de requisições. */

ini_set('display_errors', '0');
ini_set('log_errors', '1');

const API_DIR = __DIR__ . '/..';
const ROOT_DIR = __DIR__ . '/../..';

function cfg(): array {
    static $c = null;
    if ($c === null) {
        $f = API_DIR . '/config.php';
        $c = is_file($f) ? (array) require $f : [];
    }
    return $c;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = cfg();
    if (!$c) throw new RuntimeException('not_installed');
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'] ?? 'localhost', (int) ($c['db_port'] ?? 3306), $c['db_name'] ?? '');
    $pdo = new PDO($dsn, $c['db_user'] ?? '', $c['db_pass'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

/* ---------- respostas ---------- */
function security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}
function out(int $code, $data, array $headers = []): never {
    security_headers();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    if (!isset($headers['Cache-Control'])) header('Cache-Control: no-store');
    foreach ($headers as $k => $v) header("$k: $v");
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail(int $code, string $msg): never { out($code, ['error' => $msg]); }

function body(int $limit): array {
    $len = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($len > $limit) fail(413, 'Conteúdo grande demais.');
    $raw = file_get_contents('php://input', false, null, 0, $limit + 1);
    if ($raw === false || strlen($raw) > $limit) fail(413, 'Conteúdo grande demais.');
    if ($raw === '') return [];
    $ct = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (strpos($ct, 'application/json') === false) fail(415, 'Tipo de conteúdo não aceito.');
    $d = json_decode($raw, true);
    if (!is_array($d)) fail(400, 'Dados inválidos.');
    return $d;
}

/* ---------- validação ---------- */
function clean($v, int $max): string {
    if (!is_string($v)) return '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    $v = trim($v);
    return mb_substr($v, 0, $max, 'UTF-8');
}
function digits($v): string { return preg_replace('/\D+/', '', (string) $v) ?? ''; }
function is_http(string $u): bool { return (bool) preg_match('~^https?://[^\s<>"\']+$~i', $u); }
function ok_href(string $u): bool { return $u === '' || is_http($u) || (bool) preg_match('@^/[A-Za-z0-9\-._/~#?=&%]*$@', $u); }
function ok_img(string $u): bool { return $u === '' || is_http($u) || (bool) preg_match('~^/(uploads|img)/[A-Za-z0-9\-._]+$~', $u); }
function slugify(string $s): string {
    $map = ['á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e','í'=>'i','ì'=>'i','î'=>'i','ï'=>'i','ó'=>'o','ò'=>'o','ô'=>'o','õ'=>'o','ö'=>'o','ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c','ñ'=>'n'];
    $s = strtr(mb_strtolower($s, 'UTF-8'), $map);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    return mb_substr(trim($s, '-'), 0, 80);
}
function valid_email(string $e): bool { return (bool) filter_var($e, FILTER_VALIDATE_EMAIL); }
function utc_iso(?string $dt): ?string { return $dt ? gmdate('Y-m-d\TH:i:s\Z', strtotime($dt . ' UTC')) : null; }

/* ---------- limite de requisições (persistente, por IP) ---------- */
function client_ip(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (!empty(cfg()['trust_proxy']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $first = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) $ip = $first;
    }
    return $ip;
}
/** Quantas ocorrências da chave existem na janela (sem registrar nada). */
function rate_count(string $key, int $windowSec): int {
    $st = db()->prepare('SELECT COUNT(*) FROM rate_limits WHERE k = ? AND t >= ?');
    $st->execute([substr($key, 0, 80), time() - $windowSec]);
    return (int) $st->fetchColumn();
}
/** Registra uma ocorrência (ex.: senha errada). */
function rate_hit(string $key): void {
    db()->prepare('INSERT INTO rate_limits (k, t) VALUES (?, ?)')->execute([substr($key, 0, 80), time()]);
    if (random_int(1, 50) === 1) db()->prepare('DELETE FROM rate_limits WHERE t < ?')->execute([time() - 86400]);
}
function rate_limited(string $key, int $max, int $windowSec): bool {
    $k = substr($key, 0, 80);
    $now = time();
    $pdo = db();
    $pdo->prepare('DELETE FROM rate_limits WHERE k = ? AND t < ?')->execute([$k, $now - $windowSec]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE k = ?');
    $st->execute([$k]);
    if ((int) $st->fetchColumn() >= $max) return true;
    $pdo->prepare('INSERT INTO rate_limits (k, t) VALUES (?, ?)')->execute([$k, $now]);
    if (random_int(1, 50) === 1) $pdo->prepare('DELETE FROM rate_limits WHERE t < ?')->execute([$now - 86400]);
    return false;
}

/* ---------- configurações do site ---------- */
function setting_get(string $k, string $default = ''): string {
    $st = db()->prepare('SELECT v FROM settings WHERE k = ?');
    $st->execute([$k]);
    $v = $st->fetchColumn();
    return $v === false ? $default : (string) $v;
}
function setting_set(string $k, string $v): void {
    db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)')->execute([$k, $v]);
}
