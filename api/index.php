<?php
declare(strict_types=1);
/* ITEP — API (PHP + MySQL). Entrada única: /api/... (veja .htaccess). */
require __DIR__ . '/inc/bootstrap.php';
require __DIR__ . '/inc/auth.php';
require __DIR__ . '/inc/site.php';

mb_internal_encoding('UTF-8');
set_error_handler(function ($no, $str, $file, $line) { throw new ErrorException($str, 0, $no, $file, $line); });

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pos = strpos($path, '/api/');
    $route = rtrim($pos === false ? $path : substr($path, $pos + 4), '/');
    if ($route === '') $route = '/';

    if (!cfg()) fail(503, 'Sistema ainda não instalado. Acesse /instalar/.');
    $pdo = db();

    /* ===== público ===== */
    if ($route === '/site' && $method === 'GET') out(200, site_payload(true), ['Cache-Control' => 'public, max-age=20']);

    /* sitemap dos artigos do blog (inclui os criados no painel); o sitemap.xml das páginas fixas é um arquivo estático */
    if ($route === '/sitemap-blog.xml' && $method === 'GET') {
        $base = rtrim((string) (cfg()['site_url'] ?? 'https://itepminasgerais.com.br'), '/');
        $rows = $pdo->query('SELECT slug, updated_at FROM posts WHERE published = 1 ORDER BY sort, updated_at DESC')->fetchAll();
        header('Content-Type: application/xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        echo '  <url><loc>' . htmlspecialchars($base . '/blog/', ENT_XML1) . '</loc></url>' . "\n";
        foreach ($rows as $r) {
            $ts = strtotime(((string) $r['updated_at']) . ' UTC');
            echo '  <url><loc>' . htmlspecialchars($base . '/blog/' . rawurlencode((string) $r['slug']) . '/', ENT_XML1) . '</loc>' . ($ts ? '<lastmod>' . gmdate('Y-m-d', $ts) . '</lastmod>' : '') . '</url>' . "\n";
        }
        echo '</urlset>' . "\n";
        exit;
    }

    if ($route === '/lead' && $method === 'POST') {
        $b = body(20000);
        if (!empty($b['website'])) out(200, ['ok' => true]); // armadilha anti-robô
        if (rate_limited('lead:' . client_ip(), 8, 3600)) fail(429, 'Muitos envios. Tente mais tarde.');
        $lead = [
            'id' => bin2hex(random_bytes(6)),
            'name' => clean($b['name'] ?? '', 120), 'phone' => clean($b['phone'] ?? '', 30), 'email' => clean($b['email'] ?? '', 140),
            'age' => clean($b['age'] ?? '', 4), 'city' => clean($b['city'] ?? '', 80), 'course' => clean($b['course'] ?? '', 120),
            'subject' => clean($b['subject'] ?? '', 160), 'message' => clean($b['message'] ?? '', 2000), 'source' => clean($b['source'] ?? '', 160),
        ];
        if (mb_strlen($lead['name']) < 2 || (strlen(digits($lead['phone'])) < 10 && !valid_email($lead['email']))) fail(400, 'Dados incompletos.');
        $dup = $pdo->prepare('SELECT 1 FROM leads WHERE name = ? AND phone = ? AND email = ? AND created_at > (UTC_TIMESTAMP() - INTERVAL 60 SECOND) LIMIT 1');
        $dup->execute([$lead['name'], $lead['phone'], $lead['email']]);
        if (!$dup->fetchColumn()) {
            $pdo->prepare('INSERT INTO leads (id, created_at, name, phone, email, age, city, course, subject, message, source) VALUES (?, UTC_TIMESTAMP(), ?,?,?,?,?,?,?,?,?)')
                ->execute([$lead['id'], $lead['name'], $lead['phone'], $lead['email'], $lead['age'], $lead['city'], $lead['course'], $lead['subject'], $lead['message'], $lead['source']]);
        }
        out(200, ['ok' => true]);
    }

    if ($route === '/admin/login' && $method === 'POST') {
        $b = body(2000);
        // só as senhas ERRADAS contam: entrar várias vezes com a senha certa não bloqueia ninguém
        if (rate_count('login:' . client_ip(), 600) >= 6) fail(429, 'Muitas tentativas. Aguarde 10 minutos.');
        if (rate_count('login:all', 600) >= 40) fail(429, 'Muitas tentativas. Aguarde alguns minutos.');
        usleep(400000);
        $loginId = admin_check((string) ($b['username'] ?? ''), (string) ($b['password'] ?? ''));
        if ($loginId === null) { rate_hit('login:' . client_ip()); rate_hit('login:all'); fail(401, 'Usuário ou senha incorretos.'); }
        out(200, ['ok' => true, 'csrf' => session_login($loginId)]);
    }

    /* ===== painel (autenticado) ===== */
    if (strpos($route, '/admin/') !== 0) fail(404, 'Não encontrado.');
    $meId = require_admin($method);

    if ($route === '/admin/me' && $method === 'GET') out(200, ['ok' => true, 'csrf' => $_SESSION['csrf'], 'username' => admin_username($meId)]);
    if ($route === '/admin/logout' && $method === 'POST') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => is_https()]);
        session_destroy();
        out(200, ['ok' => true]);
    }
    if ($route === '/admin/site' && $method === 'GET') out(200, site_payload(false));

    if ($route === '/admin/stats' && $method === 'GET') {
        $by = [];
        foreach ($pdo->query('SELECT status, COUNT(*) n FROM leads GROUP BY status') as $r) $by[$r['status']] = (int) $r['n'];
        $top = function (string $col) use ($pdo): array {
            $out = [];
            foreach ($pdo->query("SELECT $col v, COUNT(*) n FROM leads WHERE $col <> '' GROUP BY $col ORDER BY n DESC LIMIT 5") as $r) $out[] = [$r['v'], (int) $r['n']];
            return $out;
        };
        out(200, [
            'total' => (int) $pdo->query('SELECT COUNT(*) FROM leads')->fetchColumn(),
            'byStatus' => (object) $by,
            'week' => (int) $pdo->query('SELECT COUNT(*) FROM leads WHERE created_at > (UTC_TIMESTAMP() - INTERVAL 7 DAY)')->fetchColumn(),
            'topCourse' => $top('course'), 'topCity' => $top('city'),
            'posts' => (int) $pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn(),
            'published' => (int) $pdo->query('SELECT COUNT(*) FROM posts WHERE published = 1')->fetchColumn(),
        ]);
    }

    /* --- mensagens --- */
    $leadRow = fn(array $r) => ['id' => $r['id'], 'ts' => utc_iso($r['created_at']), 'status' => $r['status'], 'notes' => $r['notes'], 'name' => $r['name'], 'phone' => $r['phone'], 'email' => $r['email'], 'age' => $r['age'], 'city' => $r['city'], 'course' => $r['course'], 'subject' => $r['subject'], 'message' => $r['message'], 'source' => $r['source']];
    if ($route === '/admin/leads' && $method === 'GET') out(200, array_map($leadRow, $pdo->query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5000')->fetchAll()));
    if ($route === '/admin/leads.csv' && $method === 'GET') {
        security_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="mensagens-itep.csv"');
        header('Cache-Control: no-store');
        $cols = ['ts', 'status', 'name', 'phone', 'email', 'age', 'city', 'course', 'subject', 'message', 'source', 'notes'];
        $cell = function ($v) { $v = (string) $v; if (preg_match('/^[=+\-@\t\r]/', $v)) $v = "'" . $v; return '"' . str_replace('"', '""', $v) . '"'; };
        echo "\xEF\xBB\xBF" . implode(';', $cols) . "\r\n";
        foreach ($pdo->query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5000') as $r) { $l = $leadRow($r); echo implode(';', array_map(fn($c) => $cell($l[$c]), $cols)) . "\r\n"; }
        exit;
    }
    if (preg_match('~^/admin/leads/([a-f0-9]{12})$~', $route, $m)) {
        $st = $pdo->prepare('SELECT * FROM leads WHERE id = ?'); $st->execute([$m[1]]);
        $cur = $st->fetch();
        if (!$cur) fail(404, 'Não encontrado.');
        if ($method === 'DELETE') { $pdo->prepare('DELETE FROM leads WHERE id = ?')->execute([$m[1]]); out(200, ['ok' => true]); }
        if ($method === 'PUT') {
            $b = body(5000);
            $status = in_array($b['status'] ?? '', ['novo', 'contatado', 'matriculado', 'arquivado'], true) ? $b['status'] : $cur['status'];
            $notes = array_key_exists('notes', $b) ? clean($b['notes'], 1000) : $cur['notes'];
            $pdo->prepare('UPDATE leads SET status = ?, notes = ? WHERE id = ?')->execute([$status, $notes, $m[1]]);
            $st->execute([$m[1]]);
            out(200, $leadRow($st->fetch()));
        }
    }

    /* --- contato e redes --- */
    if ($route === '/admin/contact' && $method === 'PUT') {
        $b = body(5000);
        $wa = digits($b['whatsapp'] ?? '');
        $email = clean($b['email'] ?? '', 140);
        $ig = clean($b['instagram'] ?? '', 200); $fb = clean($b['facebook'] ?? '', 200);
        if (strlen($wa) < 10 || strlen($wa) > 15) fail(400, 'WhatsApp inválido (use DDI+DDD+número, ex.: 5533998043901).');
        if (!valid_email($email)) fail(400, 'E-mail inválido.');
        if (($ig !== '' && !is_http($ig)) || ($fb !== '' && !is_http($fb))) fail(400, 'Os links de Instagram e Facebook devem começar com https://');
        $pdo->beginTransaction();
        setting_set('whatsapp', $wa); setting_set('whatsappLabel', clean($b['whatsappLabel'] ?? '', 30) ?: $wa);
        setting_set('email', $email); setting_set('hours', clean($b['hours'] ?? '', 60)); setting_set('instagram', $ig); setting_set('facebook', $fb);
        $pdo->commit();
        out(200, site_payload(false)['contact']);
    }

    /* --- cidades --- */
    if (preg_match('~^/admin/cities/([A-Za-z0-9\- %]+)$~', $route, $m) && $method === 'PUT') {
        $dir = rawurldecode($m[1]);
        $st = $pdo->prepare('SELECT * FROM cities WHERE dir = ?'); $st->execute([$dir]);
        if (!$st->fetch()) fail(404, 'Cidade não encontrada.');
        $b = body(8000);
        $ig = clean($b['instagram'] ?? '', 200); $fb = clean($b['facebook'] ?? '', 200); $ph = digits($b['phone'] ?? '');
        if (($ig !== '' && !is_http($ig)) || ($fb !== '' && !is_http($fb))) fail(400, 'Os links devem começar com https://');
        if ($ph !== '' && (strlen($ph) < 10 || strlen($ph) > 15)) fail(400, 'WhatsApp da unidade inválido (DDI+DDD+número).');
        $valid = $pdo->query('SELECT `key` FROM courses')->fetchAll(PDO::FETCH_COLUMN);
        $list = array_values(array_unique(array_filter((array) ($b['courses'] ?? []), fn($k) => is_string($k) && in_array($k, $valid, true))));
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE cities SET address = ?, phone = ?, instagram = ?, facebook = ?, map_query = ? WHERE dir = ?')
            ->execute([clean($b['address'] ?? '', 200), $ph, $ig, $fb, clean($b['mapQuery'] ?? '', 120) ?: ($dir . ', MG'), $dir]);
        $pdo->prepare('DELETE FROM city_courses WHERE city_dir = ?')->execute([$dir]);
        $ins = $pdo->prepare('INSERT INTO city_courses (city_dir, course_key) VALUES (?, ?)');
        foreach ($list as $k) $ins->execute([$dir, $k]);
        $pdo->commit();
        foreach (site_payload(false)['cities'] as $c) if ($c['dir'] === $dir) out(200, $c);
    }

    /* --- cursos --- */
    if (preg_match('~^/admin/courses/([a-z0-9\-]+)$~', $route, $m) && $method === 'PUT') {
        $st = $pdo->prepare('SELECT * FROM courses WHERE `key` = ?'); $st->execute([$m[1]]);
        $cur = $st->fetch();
        if (!$cur) fail(404, 'Curso não encontrado.');
        $b = body(8000);
        $img = clean($b['img'] ?? '', 300); $obj = clean($b['obj'] ?? '', 600);
        if (!ok_img($img)) fail(400, 'Imagem inválida: use um link https:// ou envie um arquivo.');
        if ($obj === '') fail(400, 'O objetivo do curso não pode ficar vazio.');
        $pdo->prepare('UPDATE courses SET obj = ?, obj1 = ?, img = ? WHERE `key` = ?')->execute([$obj, clean($b['obj1'] ?? '', 400), $img ?: $cur['img'], $m[1]]);
        foreach (site_payload(false)['courses'] as $c) if ($c['key'] === $m[1]) out(200, $c);
    }

    /* --- blog --- */
    $cleanPost = function (array $b, ?string $selfId) use ($pdo, &$cleanPost) {
        $title = clean($b['title'] ?? '', 140); $cat = clean($b['cat'] ?? '', 40) ?: 'Geral';
        $text = [];
        foreach ((array) ($b['text'] ?? []) as $t) { $t = clean($t, 3000); if ($t !== '') $text[] = $t; }
        if (mb_strlen($title) < 3) fail(400, 'Escreva um título.');
        if (!$text) fail(400, 'Escreva o texto do artigo.');
        if (count($text) > 40) fail(400, 'Texto longo demais.');
        $slug = slugify(clean($b['slug'] ?? '', 80) ?: $title);
        if ($slug === '') fail(400, 'Endereço (slug) inválido.');
        if (in_array($slug, ['index', 'artigo'], true)) $slug .= '-artigo';
        $st = $pdo->prepare('SELECT id FROM posts WHERE slug = ? AND id <> ?'); $st->execute([$slug, $selfId ?? '']);
        if ($st->fetchColumn()) fail(400, 'Já existe um artigo com esse endereço. Mude o título ou o endereço.');
        $img = clean($b['img'] ?? '', 300); $href = clean($b['ctaHref'] ?? '', 300); $ctext = clean($b['ctaText'] ?? '', 60);
        if (!ok_img($img)) fail(400, 'Imagem inválida: use um link https:// ou envie um arquivo.');
        if (!ok_href($href)) fail(400, 'Link do botão inválido.');
        return ['slug' => $slug, 'cat' => $cat, 'title' => $title, 'img' => $img, 'body' => json_encode($text, JSON_UNESCAPED_UNICODE), 'cta_text' => $ctext ?: 'Falar com o ITEP',
            'cta_href' => $href ?: ('https://wa.me/' . setting_get('whatsapp')), 'published' => !empty($b['published']) ? 1 : 0];
    };
    $postOut = function (string $id) use ($pdo) { foreach (site_payload(false)['posts'] as $p) if ($p['id'] === $id) return $p; return null; };

    if ($route === '/admin/posts' && $method === 'POST') {
        $r = $cleanPost(body(60000), null);
        $id = 'p' . bin2hex(random_bytes(4));
        $pdo->beginTransaction();
        $pdo->exec('UPDATE posts SET sort = sort + 1');
        $pdo->prepare('INSERT INTO posts (id, slug, cat, title, img, body_json, cta_text, cta_href, published, sort, updated_at) VALUES (?,?,?,?,?,?,?,?,?,0,UTC_TIMESTAMP())')
            ->execute([$id, $r['slug'], $r['cat'], $r['title'], $r['img'], $r['body'], $r['cta_text'], $r['cta_href'], $r['published']]);
        $pdo->commit();
        out(200, $postOut($id));
    }
    if ($route === '/admin/posts/order' && $method === 'PUT') {
        $b = body(5000);
        if (!is_array($b['ids'] ?? null)) fail(400, 'Dados inválidos.');
        $up = $pdo->prepare('UPDATE posts SET sort = ? WHERE id = ?');
        $pdo->beginTransaction();
        foreach (array_values($b['ids']) as $i => $id) if (is_string($id) && preg_match('~^[A-Za-z0-9]{1,20}$~', $id)) $up->execute([$i, $id]);
        $pdo->commit();
        out(200, ['ok' => true]);
    }
    if (preg_match('~^/admin/posts/([A-Za-z0-9]{1,20})$~', $route, $m)) {
        $st = $pdo->prepare('SELECT id FROM posts WHERE id = ?'); $st->execute([$m[1]]);
        if (!$st->fetchColumn()) fail(404, 'Artigo não encontrado.');
        if ($method === 'DELETE') { $pdo->prepare('DELETE FROM posts WHERE id = ?')->execute([$m[1]]); out(200, ['ok' => true]); }
        if ($method === 'PUT') {
            $r = $cleanPost(body(60000), $m[1]);
            $pdo->prepare('UPDATE posts SET slug = ?, cat = ?, title = ?, img = ?, body_json = ?, cta_text = ?, cta_href = ?, published = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')
                ->execute([$r['slug'], $r['cat'], $r['title'], $r['img'], $r['body'], $r['cta_text'], $r['cta_href'], $r['published'], $m[1]]);
            out(200, $postOut($m[1]));
        }
    }

    /* --- upload de imagem --- */
    if ($route === '/admin/upload' && $method === 'POST') {
        $b = body(8000000);
        $bin = base64_decode((string) ($b['data'] ?? ''), true);
        if ($bin === false || $bin === '' || strlen($bin) > 5000000) fail(413, 'Arquivo vazio ou maior que 5 MB.');
        $info = @getimagesizefromstring($bin);
        $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
        if (!$info || !isset($types[$info[2]])) fail(400, 'Envie uma imagem JPG, PNG ou WEBP.');
        if ($info[0] > 8000 || $info[1] > 8000) fail(400, 'Imagem grande demais (máx. 8000 px).');
        $dir = ROOT_DIR . '/uploads';
        if (!is_dir($dir) && !@mkdir($dir, 0755, true)) fail(500, 'Não foi possível criar a pasta de envios.');
        $name = time() . '-' . bin2hex(random_bytes(4)) . '.' . $types[$info[2]];
        if (file_put_contents($dir . '/' . $name, $bin) === false) fail(500, 'Não foi possível salvar o arquivo.');
        out(200, ['url' => '/uploads/' . $name]);
    }

    /* --- senha --- */
    if ($route === '/admin/password' && $method === 'POST') {
        $b = body(2000);
        if (rate_count('pw:' . client_ip(), 600) >= 6) fail(429, 'Muitas tentativas. Aguarde.');
        if (admin_check(admin_username($meId), (string) ($b['current'] ?? '')) !== $meId) { rate_hit('pw:' . client_ip()); fail(401, 'Senha atual incorreta.'); }
        $n = (string) ($b['next'] ?? '');
        if (!password_policy_ok($n)) fail(400, 'A nova senha precisa ter 10+ caracteres, com letras e números.');
        admin_set_password($meId, $n);
        session_regenerate_id(true);
        $_SESSION['pwv'] = pw_version($meId);
        out(200, ['ok' => true]);
    }

    /* --- usuários da área restrita --- */
    if ($route === '/admin/users' && $method === 'GET') {
        out(200, ['users' => array_map(fn($u) => ['id' => (int) $u['id'], 'username' => $u['username'], 'createdAt' => $u['created_at'], 'me' => (int) $u['id'] === $meId], admin_list())]);
    }
    if ($route === '/admin/users' && $method === 'POST') {
        $b = body(2000);
        if (rate_limited('usr:' . client_ip(), 20, 3600)) fail(429, 'Muitas tentativas. Aguarde.');
        $u = trim((string) ($b['username'] ?? '')); $p = (string) ($b['password'] ?? '');
        if (!username_ok($u)) fail(400, 'O usuário precisa ter de 3 a 40 caracteres (letras, números, ponto, _ ou -).');
        if (!password_policy_ok($p)) fail(400, 'A senha precisa ter 10+ caracteres, com letras e números.');
        try { $newId = admin_create($u, $p); }
        catch (PDOException $e) { if ((string) $e->getCode() === '23000') fail(409, 'Esse usuário já existe.'); throw $e; }
        out(200, ['ok' => true, 'id' => $newId]);
    }
    if (preg_match('~^/admin/users/([0-9]{1,10})(/password)?$~', $route, $m)) {
        $target = (int) $m[1];
        if (admin_username($target) === '') fail(404, 'Usuário não encontrado.');
        if (!empty($m[2])) {
            if ($method !== 'POST') fail(405, 'Método não permitido.');
            if ($target === $meId) fail(400, 'Para trocar a sua senha, use o formulário "Trocar senha".');
            $p = (string) (body(2000)['password'] ?? '');
            if (!password_policy_ok($p)) fail(400, 'A senha precisa ter 10+ caracteres, com letras e números.');
            admin_set_password($target, $p);
            out(200, ['ok' => true]);
        }
        if ($method === 'DELETE') {
            if ($target === $meId) fail(400, 'Você não pode remover o próprio usuário.');
            if (admin_count() <= 1) fail(400, 'É preciso manter ao menos um usuário.');
            admin_delete($target);
            out(200, ['ok' => true]);
        }
    }

    fail(404, 'Não encontrado.');
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('[ITEP api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if ($e->getMessage() === 'not_installed') fail(503, 'Sistema ainda não instalado. Acesse /instalar/.');
    fail(500, 'Erro interno. Tente novamente.');
}
