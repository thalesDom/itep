<?php
declare(strict_types=1);
/* ITEP — leitura do conteúdo (payload público e do painel) e carga inicial. */

function site_payload(bool $onlyPublished): array {
    $pdo = db();
    $contact = [
        'whatsapp' => setting_get('whatsapp'), 'whatsappLabel' => setting_get('whatsappLabel'),
        'email' => setting_get('email'), 'hours' => setting_get('hours'),
        'instagram' => setting_get('instagram'), 'facebook' => setting_get('facebook'),
    ];
    $areas = json_decode(setting_get('areas', '{}'), true) ?: new stdClass();
    $courses = array_map(fn($r) => ['key' => $r['key'], 'dir' => $r['dir'], 'name' => $r['name'], 'area' => $r['area'], 'img' => $r['img'], 'obj' => $r['obj'], 'obj1' => $r['obj1']],
        $pdo->query('SELECT * FROM courses ORDER BY sort, name')->fetchAll());

    $map = [];
    foreach ($pdo->query('SELECT cc.city_dir, cc.course_key FROM city_courses cc JOIN courses c ON c.`key` = cc.course_key ORDER BY c.sort, c.name') as $r) $map[$r['city_dir']][] = $r['course_key'];
    $cities = array_map(fn($r) => [
        'dir' => $r['dir'], 'name' => $r['name'], 'address' => $r['address'], 'phone' => $r['phone'],
        'instagram' => $r['instagram'], 'facebook' => $r['facebook'], 'mapQuery' => $r['map_query'], 'courses' => $map[$r['dir']] ?? [],
    ], $pdo->query('SELECT * FROM cities ORDER BY sort, name')->fetchAll());

    $sql = 'SELECT * FROM posts' . ($onlyPublished ? ' WHERE published = 1' : '') . ' ORDER BY sort, updated_at DESC';
    $posts = array_map(fn($r) => [
        'id' => $r['id'], 'slug' => $r['slug'], 'cat' => $r['cat'], 'title' => $r['title'], 'img' => $r['img'],
        'text' => json_decode($r['body_json'], true) ?: [], 'ctaText' => $r['cta_text'], 'ctaHref' => $r['cta_href'],
        'published' => (bool) $r['published'], 'updated' => utc_iso($r['updated_at']),
    ], $pdo->query($sql)->fetchAll());

    return ['contact' => $contact, 'areas' => $areas, 'courses' => $courses, 'cities' => $cities, 'posts' => $posts];
}

/** Carga inicial a partir de seed.json (só roda se as tabelas estiverem vazias). */
function seed_database(PDO $pdo): void {
    $seed = json_decode((string) file_get_contents(API_DIR . '/seed.json'), true);
    if (!is_array($seed)) throw new RuntimeException('seed.json inválido');
    $n = (int) $pdo->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    if ($n > 0) return;
    $pdo->beginTransaction();
    try {
        $set = $pdo->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
        foreach ($seed['contact'] as $k => $v) $set->execute([$k, (string) $v]);
        $set->execute(['areas', json_encode($seed['areas'], JSON_UNESCAPED_UNICODE)]);
        $c = $pdo->prepare('INSERT INTO courses (`key`, dir, name, area, img, obj, obj1, sort) VALUES (?,?,?,?,?,?,?,?)');
        foreach ($seed['courses'] as $i => $r) $c->execute([$r['key'], $r['dir'], $r['name'], $r['area'], $r['img'], $r['obj'], $r['obj1'] ?? '', $i]);
        $ci = $pdo->prepare('INSERT INTO cities (dir, name, address, phone, instagram, facebook, map_query, sort) VALUES (?,?,?,?,?,?,?,?)');
        $cc = $pdo->prepare('INSERT INTO city_courses (city_dir, course_key) VALUES (?, ?)');
        foreach ($seed['cities'] as $i => $r) {
            $ci->execute([$r['dir'], $r['name'], $r['address'] ?? '', $r['phone'] ?? '', $r['instagram'] ?? '', $r['facebook'] ?? '', $r['mapQuery'] ?? ($r['name'] . ', MG'), $i]);
            foreach ($r['courses'] as $k) $cc->execute([$r['dir'], $k]);
        }
        $p = $pdo->prepare('INSERT INTO posts (id, slug, cat, title, img, body_json, cta_text, cta_href, published, sort, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP())');
        foreach ($seed['posts'] as $i => $r) $p->execute([$r['id'], $r['slug'], $r['cat'], $r['title'], $r['img'], json_encode($r['text'], JSON_UNESCAPED_UNICODE), $r['ctaText'], $r['ctaHref'], $r['published'] ? 1 : 0, $i]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
