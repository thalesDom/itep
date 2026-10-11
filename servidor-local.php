<?php
/* ITEP — servidor de TESTE local (não use em produção; lá vale o .htaccess).
   Uso:  php -S localhost:8000 servidor-local.php   (veja iniciar-local.bat) */
if (php_sapi_name() !== 'cli-server') { http_response_code(404); exit; }

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (strpos($path, "\0") !== false) { http_response_code(400); exit; }

// bloqueios (espelham o .htaccess)
if (preg_match('~(^|/)\.|/api/inc/|/api/config\.php$|/api/seed\.json$|\.(sql|md|bat|lock)$~i', $path)) { http_response_code(404); echo 'Não encontrado'; return true; }

// painel: entregue pelo PHP, com os mesmos cabeçalhos do .htaccess
// (o servidor embutido descarta cabeçalhos quando entrega arquivos estáticos)
if ($path === '/admin' || strpos($path, '/admin/') === 0) {
    $rel = ($path === '/admin' || substr($path, -1) === '/') ? rtrim($path, '/') . '/index.html' : $path;
    $file = realpath(__DIR__ . $rel);
    if ($file === false || strpos($file, realpath(__DIR__ . '/admin')) !== 0 || !is_file($file)) { http_response_code(404); echo 'Não encontrado'; return true; }
    $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'js' => 'text/javascript; charset=utf-8'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');
    readfile($file);
    return true;
}

// API
if (strpos($path, '/api/') === 0 && $path !== '/api/index.php') { require __DIR__ . '/api/index.php'; return true; }

$full = realpath(__DIR__ . $path);
if ($full !== false && strpos($full, realpath(__DIR__)) === 0) {
    if (is_file($full)) {
        if (preg_match('~/uploads/.*\.(php|phtml|phar)$~i', $path)) { http_response_code(403); return true; }
        return false; // deixa o servidor embutido entregar o arquivo
    }
    if (is_dir($full)) return false;
}
// artigos novos do blog
if (preg_match('~^/blog/([a-z0-9\-]+)(?:/(?:index\.html)?)?$~', $path)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/blog/artigo/index.html');
    return true;
}
http_response_code(404);
echo 'Página não encontrada';
return true;
