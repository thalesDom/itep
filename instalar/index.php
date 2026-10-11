<?php
declare(strict_types=1);
/* ITEP — instalador (rode uma vez no navegador: /instalar/). Depois APAGUE esta pasta. */
require __DIR__ . '/../api/inc/bootstrap.php';
require __DIR__ . '/../api/inc/auth.php';
require __DIR__ . '/../api/inc/site.php';

security_headers();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$lock = __DIR__ . '/install.lock';
$configFile = API_DIR . '/config.php';
if (is_file($lock) || is_file($configFile)) {
    http_response_code(403);
    page('Já instalado', '<p>O sistema já foi instalado. Por segurança, <b>apague a pasta <code>/instalar</code></b> do servidor.</p><p><a href="/admin/">Ir para a área restrita</a></p>');
    exit;
}

session_name('itep_install');
session_set_cookie_params(['path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => is_https()]);
session_start();
if (empty($_SESSION['t'])) $_SESSION['t'] = bin2hex(random_bytes(16));

$err = '';
$v = ['host' => 'localhost', 'port' => '3306', 'name' => '', 'user' => ''];
$problems = [];
if (version_compare(PHP_VERSION, '8.1.0', '<')) $problems[] = 'PHP 8.1 ou superior é necessário (atual: ' . PHP_VERSION . ').';
foreach (['pdo_mysql', 'mbstring', 'json', 'fileinfo'] as $ext) if (!extension_loaded($ext)) $problems[] = "Extensão PHP ausente: $ext.";
if (!is_writable(API_DIR)) $problems[] = 'A pasta /api precisa de permissão de escrita para criar o config.php (ou copie o arquivo manualmente, mostrado ao final).';
if (!is_dir(ROOT_DIR . '/uploads')) @mkdir(ROOT_DIR . '/uploads', 0755, true);
if (!is_writable(ROOT_DIR . '/uploads')) $problems[] = 'A pasta /uploads precisa de permissão de escrita (envio de imagens do blog).';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $v = ['host' => trim((string) ($_POST['host'] ?? '')), 'port' => trim((string) ($_POST['port'] ?? '3306')), 'name' => trim((string) ($_POST['name'] ?? '')), 'user' => trim((string) ($_POST['user'] ?? ''))];
    $pass = (string) ($_POST['pass'] ?? '');
    $pw1 = (string) ($_POST['pw1'] ?? ''); $pw2 = (string) ($_POST['pw2'] ?? '');
    try {
        if (!hash_equals($_SESSION['t'], (string) ($_POST['t'] ?? ''))) throw new RuntimeException('Sessão inválida. Recarregue a página.');
        if ($problems && array_filter($problems, fn($p) => strpos($p, '/api precisa') === false)) throw new RuntimeException('Corrija os requisitos acima antes de continuar.');
        if ($v['host'] === '' || $v['name'] === '' || $v['user'] === '') throw new RuntimeException('Preencha servidor, nome do banco e usuário.');
        if (!preg_match('/^[A-Za-z0-9_.\-]+$/', $v['name'])) throw new RuntimeException('Nome do banco inválido (use letras, números, _ ou -).');
        if (!password_policy_ok($pw1)) throw new RuntimeException('A senha do painel precisa ter 10+ caracteres, com letras e números.');
        if ($pw1 !== $pw2) throw new RuntimeException('As senhas não conferem.');

        try {
            $pdo = new PDO("mysql:host={$v['host']};port=" . (int) $v['port'] . ";dbname={$v['name']};charset=utf8mb4", $v['user'], $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        } catch (PDOException $e) {
            // tenta criar o banco, se o usuário tiver permissão
            try {
                $tmp = new PDO("mysql:host={$v['host']};port=" . (int) $v['port'] . ";charset=utf8mb4", $v['user'], $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                $tmp->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '', $v['name']) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
                $pdo = new PDO("mysql:host={$v['host']};port=" . (int) $v['port'] . ";dbname={$v['name']};charset=utf8mb4", $v['user'], $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
            } catch (PDOException $e2) {
                throw new RuntimeException('Não foi possível conectar ao MySQL: confira servidor, banco, usuário e senha.');
            }
        }
        $pdo->exec("SET time_zone = '+00:00'");
        $sql = (string) file_get_contents(API_DIR . '/schema.sql');
        foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', $sql)))) as $stmt) $pdo->exec($stmt);

        seed_database($pdo);
        $hash = password_hash($pw1, PASSWORD_DEFAULT);
        $pdo->prepare('INSERT INTO admin_users (id, pass_hash, updated_at) VALUES (1, ?, UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE pass_hash = VALUES(pass_hash), updated_at = UTC_TIMESTAMP()')->execute([$hash]);

        $config = "<?php\n// Gerado pelo instalador. NÃO publique este arquivo.\nreturn " . var_export([
            'db_host' => $v['host'], 'db_port' => (int) $v['port'], 'db_name' => $v['name'], 'db_user' => $v['user'], 'db_pass' => $pass,
            'trust_proxy' => false, // mude para true se o site estiver atrás de proxy/Cloudflare
        ], true) . ";\n";
        $saved = @file_put_contents($configFile, $config, LOCK_EX) !== false;
        if ($saved) @chmod($configFile, 0640);
        @file_put_contents($lock, date('c'));
        if (!$saved) {
            page('Quase pronto', '<p>O banco foi criado, mas não consegui gravar <code>api/config.php</code>. Crie esse arquivo manualmente com o conteúdo abaixo e depois apague a pasta <code>/instalar</code>:</p><pre>' . htmlspecialchars($config, ENT_QUOTES, 'UTF-8') . '</pre>');
            exit;
        }
        page('Instalação concluída', '<p>Tudo certo! Tabelas criadas e conteúdo do site carregado.</p><ol><li><b>Apague a pasta <code>/instalar</code></b> do servidor.</li><li>Entre na <a href="/admin/">área restrita</a> com a senha que você acabou de definir.</li></ol>');
        exit;
    } catch (Throwable $e) {
        $err = $e instanceof RuntimeException || $e instanceof PDOException ? $e->getMessage() : 'Erro inesperado na instalação.';
        if (!($e instanceof RuntimeException)) error_log('[ITEP install] ' . $e->getMessage());
    }
}

$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
ob_start(); ?>
<?php if ($problems): ?><div class="warn"><b>Requisitos</b><ul><?php foreach ($problems as $p) echo '<li>' . $h($p) . '</li>'; ?></ul></div><?php endif; ?>
<?php if ($err): ?><div class="err" role="alert"><?= $h($err) ?></div><?php endif; ?>
<form method="post" autocomplete="off">
    <input type="hidden" name="t" value="<?= $h($_SESSION['t']) ?>">
    <h2>1. Banco de dados MySQL</h2>
    <div class="cols"><label>Servidor<input name="host" value="<?= $h($v['host']) ?>" required></label><label>Porta<input name="port" value="<?= $h($v['port']) ?>" inputmode="numeric" required></label></div>
    <label>Nome do banco<input name="name" value="<?= $h($v['name']) ?>" required></label>
    <div class="cols"><label>Usuário<input name="user" value="<?= $h($v['user']) ?>" required></label><label>Senha do banco<input type="password" name="pass" autocomplete="new-password"></label></div>
    <h2>2. Senha da área restrita</h2>
    <div class="cols"><label>Senha<input type="password" name="pw1" required minlength="10" autocomplete="new-password"></label><label>Repita a senha<input type="password" name="pw2" required minlength="10" autocomplete="new-password"></label></div>
    <p class="hint">Mínimo de 10 caracteres, com letras e números.</p>
    <button type="submit">Instalar</button>
</form>
<?php page('Instalação do ITEP', (string) ob_get_clean());

function page(string $title, string $html): void {
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><title>' . htmlspecialchars($title) . '</title><style>
    *{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,Segoe UI,sans-serif;color:#0E1D14;background:linear-gradient(160deg,#0F3D22,#072814);min-height:100vh;display:grid;place-items:center;padding:20px}
    main{width:min(560px,100%);background:#fff;border-radius:24px;padding:32px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6)}h1{margin:0 0 6px;font-size:1.6rem}h2{font-size:1.05rem;margin:24px 0 10px;color:#16783A}
    label{display:block;font-weight:600;font-size:.9rem;margin-bottom:12px}input{display:block;width:100%;margin-top:6px;padding:12px 14px;font:inherit;border:2px solid #DCE5DF;border-radius:12px}input:focus{outline:none;border-color:#1B8F45}
    .cols{display:grid;gap:0 14px}@media(min-width:560px){.cols{grid-template-columns:1fr 1fr}}button{width:100%;margin-top:8px;padding:14px;font:inherit;font-weight:700;color:#fff;background:#16783A;border:0;border-radius:12px;cursor:pointer}button:hover{background:#0F3D22}
    .err{padding:12px 14px;margin-bottom:14px;border-radius:12px;background:#FDECEA;color:#8C1D18;font-weight:600}.warn{padding:12px 14px;margin-bottom:14px;border-radius:12px;background:#FFF6D9;color:#5C4500}.warn ul{margin:6px 0 0;padding-left:20px}.hint{font-size:.85rem;color:#4A5C51}
    pre{white-space:pre-wrap;word-break:break-all;background:#F3F6F4;padding:14px;border-radius:12px;font-size:.8rem}code{background:#F3F6F4;padding:1px 6px;border-radius:6px}a{color:#16783A;font-weight:600}</style></head><body><main><h1>' . htmlspecialchars($title) . '</h1>' . $html . '</main></body></html>';
}
