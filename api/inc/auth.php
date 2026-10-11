<?php
declare(strict_types=1);
/* ITEP — sessão do painel (cookie HttpOnly + SameSite=Strict) e proteção CSRF. */

function is_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (!empty(cfg()['trust_proxy']) && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function session_open(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('itep_sid');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    $limit = 8 * 3600;
    if (isset($_SESSION['seen']) && time() - $_SESSION['seen'] > $limit) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (!empty($_SESSION['auth'])) $_SESSION['seen'] = time();
}

function session_login(): string {
    session_open();
    session_regenerate_id(true);
    $_SESSION['auth'] = true;
    $_SESSION['seen'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    $_SESSION['pwv'] = pw_version();
    return $_SESSION['csrf'];
}

function require_admin(string $method): void {
    session_open();
    if (empty($_SESSION['auth']) || !hash_equals(pw_version(), (string) ($_SESSION['pwv'] ?? ''))) {
        $_SESSION = [];
        fail(401, 'Sessão expirada. Entre novamente.');
    }
    if ($method !== 'GET' && !hash_equals((string) ($_SESSION['csrf'] ?? ''), (string) ($_SERVER['HTTP_X_CSRF'] ?? ''))) fail(403, 'Requisição recusada.');
}

/** Impressão digital da senha atual: trocar a senha invalida todas as outras sessões. */
function pw_version(): string {
    return substr(hash('sha256', (string) admin_hash()), 0, 24);
}

function admin_hash(): ?string {
    $st = db()->query('SELECT pass_hash FROM admin_users WHERE id = 1');
    $h = $st->fetchColumn();
    return $h === false ? null : (string) $h;
}
function admin_check(string $pw): bool {
    $h = admin_hash();
    return $h !== null && password_verify($pw, $h);
}
function admin_set_password(string $pw): void {
    $hash = password_hash($pw, PASSWORD_DEFAULT);
    db()->prepare('INSERT INTO admin_users (id, pass_hash, updated_at) VALUES (1, ?, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE pass_hash = VALUES(pass_hash), updated_at = UTC_TIMESTAMP()')->execute([$hash]);
}
function password_policy_ok(string $pw): bool {
    return strlen($pw) >= 10 && preg_match('/[A-Za-z]/', $pw) && preg_match('/\d/', $pw);
}
