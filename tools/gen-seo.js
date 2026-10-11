/* Gera a parte técnica de SEO do site: link canônico, Open Graph/Twitter, dados estruturados (JSON-LD),
   robots.txt e sitemap.xml. Pode rodar de novo a qualquer momento (troca o bloco anterior).
   Uso:  node tools/gen-seo.js [https://dominio.com.br]      (padrão: https://itepminasgerais.com.br) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = String(process.argv[2] || 'https://itepminasgerais.com.br').replace(/\/+$/, '');
const NAME = 'ITEP – Instituto Técnico Educacional Polivalente';
const IG = 'https://www.instagram.com/iteppolivalente', FB = 'https://www.facebook.com/iteppolivalente';
const PHONE = '+55 33 99804-3901', EMAIL = 'diretoriaitep@itepminasgerais.com.br';
const OG_IMG = SITE + '/img/og-itep.jpg';
const SKIP = new Set(['docs', 'prints', 'node_modules', '.git', 'uploads', 'admin', 'api', 'instalar', 'tools', 'img']);
const NOT_INDEXED = new Set(['blog/artigo']);          // modelo de artigo (o conteúdo vem do banco)

const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'api', 'seed.json'), 'utf8'));
const courseDirs = new Set(seed.courses.map(c => c.dir));
const cities = new Map(seed.cities.map(c => [c.dir, c.name]));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pages = [];
(function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!(rel === '' && SKIP.has(e.name))) walk(path.join(d, e.name), rel ? rel + '/' + e.name : e.name); }
        else if (e.name === 'index.html') pages.push(rel);
    }
})(ROOT, '');
pages.sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));

const problems = [];
const titles = new Map(), descs = new Map();
const urls = [];

for (const rel of pages) {
    const file = path.join(ROOT, rel, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
    const desc = (/<meta\s+name="description"\s+content="([^"]*)"/.exec(html) || [])[1];
    if (!title) { problems.push(rel + ': sem <title>'); continue; }
    if (!desc) problems.push((rel || '/') + ': sem meta description');
    if (title.length > 70) problems.push((rel || '/') + ': título com ' + title.length + ' caracteres (ideal até ~60)');
    if (desc && !NOT_INDEXED.has(rel) && (desc.length > 170 || desc.length < 50)) problems.push((rel || '/') + ': descrição com ' + desc.length + ' caracteres (ideal 70–160)');
    (titles.get(title) || titles.set(title, []).get(title)).push(rel || '/');
    if (desc) (descs.get(desc) || descs.set(desc, []).get(desc)).push(rel || '/');

    const url = SITE + '/' + (rel ? rel.split('/').map(encodeURIComponent).join('/') + '/' : '');
    const dirName = rel.split('/')[0];
    const isCourse = courseDirs.has(rel), isCity = cities.has(rel), isPost = /^blog\/[^/]+$/.test(rel) && rel !== 'blog/artigo';
    const heroImg = (/<div class="pg-hero__media">\s*<img[^>]*src="([^"]+)"/.exec(html) || /<img class="art__img"[^>]*src="(https?:[^"]+)"/.exec(html) || [])[1];
    const image = heroImg && /^https:\/\//.test(heroImg) ? heroImg.replace(/&amp;/g, '&') : OG_IMG;
    const org = { '@type': 'EducationalOrganization', '@id': SITE + '/#organizacao', name: NAME, url: SITE + '/' };

    const graph = [];
    if (rel === '') {
        graph.push({
            '@type': 'EducationalOrganization', '@id': SITE + '/#organizacao', name: NAME, alternateName: 'ITEP Trilhas do Futuro', url: SITE + '/',
            logo: SITE + '/icon-192.png', image: OG_IMG, description: desc, telephone: PHONE, email: EMAIL, sameAs: [IG, FB],
            address: { '@type': 'PostalAddress', addressRegion: 'MG', addressCountry: 'BR' },
            areaServed: seed.cities.map(c => ({ '@type': 'City', name: c.name }))
        });
        graph.push({ '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'ITEP', inLanguage: 'pt-BR', publisher: { '@id': SITE + '/#organizacao' } });
    } else {
        if (isCourse) {
            const h1 = (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) || [])[1];
            graph.push({
                '@type': 'Course', name: (h1 ? h1.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : title.split('|')[0].trim()), description: desc, url,
                inLanguage: 'pt-BR', educationalLevel: 'Técnico', isAccessibleForFree: true, image,
                provider: org, offers: { '@type': 'Offer', category: 'Curso gratuito', price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock' }
            });
        } else if (isCity) {
            graph.push({
                '@type': 'EducationalOrganization', name: 'ITEP ' + cities.get(rel), url, description: desc, telephone: PHONE, email: EMAIL, parentOrganization: org,
                address: { '@type': 'PostalAddress', addressLocality: cities.get(rel), addressRegion: 'MG', addressCountry: 'BR' }, areaServed: { '@type': 'City', name: cities.get(rel) }
            });
        } else if (isPost) {
            const h1 = (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) || [])[1];
            graph.push({ '@type': 'BlogPosting', headline: (h1 ? h1.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : title), description: desc, image, url, inLanguage: 'pt-BR', author: org, publisher: org, mainEntityOfPage: url });
        }
        const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }];
        if (isPost) crumbs.push({ '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + '/blog/' });
        crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: title.split('|')[0].trim(), item: url });
        graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });
    }

    const robots = ''; // o modelo de artigo também serve os artigos novos do banco: não pode ter noindex (o robots.txt já bloqueia /blog/artigo/)
    const block = [
        '    <!-- seo:start -->',
        robots + '    <link rel="canonical" href="' + esc(url) + '">',
        '    <meta name="theme-color" content="#0F3D22">',
        '    <meta property="og:locale" content="pt_BR">',
        '    <meta property="og:site_name" content="ITEP">',
        '    <meta property="og:type" content="' + (isPost ? 'article' : 'website') + '">',
        '    <meta property="og:title" content="' + esc(title) + '">',
        desc ? '    <meta property="og:description" content="' + esc(desc) + '">' : '',
        '    <meta property="og:url" content="' + esc(url) + '">',
        '    <meta property="og:image" content="' + esc(image) + '">',
        '    <meta name="twitter:card" content="summary_large_image">',
        '    <meta name="twitter:title" content="' + esc(title) + '">',
        desc ? '    <meta name="twitter:description" content="' + esc(desc) + '">' : '',
        '    <meta name="twitter:image" content="' + esc(image) + '">',
        '    <script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') + '</script>',
        '    <!-- seo:end -->'
    ].filter(Boolean).join('\n') + '\n';

    html = html.replace(/[ \t]*<!-- seo:start -->[\s\S]*?<!-- seo:end -->\r?\n?/, '');
    if (!html.includes('</head>')) { problems.push(rel + ': sem </head>'); continue; }
    html = html.replace('</head>', block + '</head>');
    fs.writeFileSync(file, html);
    if (!NOT_INDEXED.has(rel)) urls.push({ url, rel });
}

/* títulos e descrições repetidos atrapalham o Google */
for (const [t, list] of titles) if (list.length > 1) problems.push('título repetido (' + list.join(', ') + '): ' + t);
for (const [t, list] of descs) if (list.length > 1) problems.push('descrição repetida (' + list.join(', ') + ')');

const today = new Date().toISOString().slice(0, 10);
const xmlUrl = u => '  <url><loc>' + esc(u.url) + '</loc><lastmod>' + today + '</lastmod><priority>' + (u.rel === '' ? '1.0' : /^[^/]+$/.test(u.rel) && (courseDirs.has(u.rel) || cities.has(u.rel)) ? '0.8' : '0.6') + '</priority></url>';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(xmlUrl).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /instalar/
Disallow: /blog/artigo/

Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/sitemap-blog.xml
`);
console.log('páginas com SEO:', urls.length, '| sitemap.xml e robots.txt criados para', SITE);
console.log(problems.length ? 'ATENÇÃO:\n - ' + problems.join('\n - ') : 'Sem problemas de título/descrição.');
