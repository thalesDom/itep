<?php
declare(strict_types=1);
/* ITEP — sessão do painel (cookie HttpOnly + SameSite=Strict), usuários da área restrita e proteção CSRF. */

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

/** Bancos criados antes dos vários usuários são atualizados sozinhos (coluna username, id automático, usuário único). */
function ensure_users_schema(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    $pdo = db();
    $cols = [];
    foreach ($pdo->query('SHOW COLUMNS FROM admin_users')->fetchAll() as $c) $cols[$c['Field']] = $c;
    if (!isset($cols['username'])) $pdo->exec("ALTER TABLE admin_users ADD COLUMN username VARCHAR(40) NOT NULL DEFAULT 'admin' AFTER id");
    if (stripos((string) ($cols['id']['Extra'] ?? ''), 'auto_increment') === false) $pdo->exec('ALTER TABLE admin_users MODIFY id INT UNSIGNED NOT NULL AUTO_INCREMENT');
    $hasUnique = false;
    foreach ($pdo->query('SHOW INDEX FROM admin_users')->fetchAll() as $ix) if ($ix['Column_name'] === 'username' && (int) $ix['Non_unique'] === 0) $hasUnique = true;
    if (!$hasUnique) $pdo->exec('ALTER TABLE admin_users ADD UNIQUE KEY uq_admin_username (username)');
    if (!isset($cols['created_at'])) $pdo->exec('ALTER TABLE admin_users ADD COLUMN created_at DATETIME NULL');
}

function session_login(int $uid): string {
    session_open();
    session_regenerate_id(true);
    $_SESSION['auth'] = true;
    $_SESSION['uid'] = $uid;
    $_SESSION['seen'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    $_SESSION['pwv'] = pw_version($uid);
    return $_SESSION['csrf'];
}

function require_admin(string $method): int {
    session_open();
    $uid = (int) ($_SESSION['uid'] ?? 0);
    $v = $uid > 0 ? pw_version($uid) : '';
    if (empty($_SESSION['auth']) || $v === '' || !hash_equals($v, (string) ($_SESSION['pwv'] ?? ''))) {
        $_SESSION = [];
        fail(401, 'Sessão expirada. Entre novamente.');
    }
    if ($method !== 'GET' && !hash_equals((string) ($_SESSION['csrf'] ?? ''), (string) ($_SERVER['HTTP_X_CSRF'] ?? ''))) fail(403, 'Requisição recusada.');
    return $uid;
}

/** Impressão digital da senha do usuário: trocar a senha ou remover o usuário invalida as sessões dele. Vazio = usuário não existe. */
function pw_version(int $uid): string {
    ensure_users_schema();
    $st = db()->prepare('SELECT pass_hash FROM admin_users WHERE id = ?');
    $st->execute([$uid]);
    $h = $st->fetchColumn();
    return $h === false ? '' : substr(hash('sha256', (string) $h), 0, 24);
}

function admin_find(string $user): ?array {
    ensure_users_schema();
    $st = db()->prepare('SELECT id, username, pass_hash FROM admin_users WHERE username = ?');
    $st->execute([trim($user)]);
    $r = $st->fetch();
    return $r ?: null;
}

/** Confere usuário E senha. Devolve o id do usuário ou null; o tempo é o mesmo quando o usuário não existe. */
function admin_check(string $user, string $pw): ?int {
    $row = admin_find($user);
    $hash = $row ? (string) $row['pass_hash'] : '$2y$10$usesomesillystringforsaleeKDD0gmQYiXKRq2fvP7ZxrQdL1y2u';
    $ok = password_verify($pw, $hash);
    return ($row && $ok) ? (int) $row['id'] : null;
}

function admin_username(int $uid): string {
    ensure_users_schema();
    $st = db()->prepare('SELECT username FROM admin_users WHERE id = ?');
    $st->execute([$uid]);
    $u = $st->fetchColumn();
    return $u === false ? '' : (string) $u;
}

function admin_list(): array {
    ensure_users_schema();
    return db()->query('SELECT id, username, created_at, updated_at FROM admin_users ORDER BY id')->fetchAll();
}

function admin_create(string $user, string $pw): int {
    ensure_users_schema();
    $st = db()->prepare('INSERT INTO admin_users (username, pass_hash, created_at, updated_at) VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())');
    $st->execute([$user, password_hash($pw, PASSWORD_DEFAULT)]);
    return (int) db()->lastInsertId();
}

function admin_set_password(int $uid, string $pw): void {
    ensure_users_schema();
    db()->prepare('UPDATE admin_users SET pass_hash = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([password_hash($pw, PASSWORD_DEFAULT), $uid]);
}

function admin_delete(int $uid): void {
    ensure_users_schema();
    db()->prepare('DELETE FROM admin_users WHERE id = ?')->execute([$uid]);
}

function admin_count(): int {
    ensure_users_schema();
    return (int) db()->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
}

function username_ok(string $u): bool {
    return (bool) preg_match('/^[A-Za-z0-9._-]{3,40}$/', $u);
}
function password_policy_ok(string $pw): bool {
    return strlen($pw) >= 10 && preg_match('/[A-Za-z]/', $pw) && preg_match('/\d/', $pw);
}
