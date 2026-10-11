/* Gera a versão ESTÁTICA do site em /docs para o GitHub Pages.
   O Pages serve o site em /<repositório>/, então todo link que começa com "/" precisa receber o prefixo.
   A área restrita (/admin/), a API, o instalador e os uploads NÃO vão para o GitHub: rodam só no servidor próprio (PHP + MySQL).
   Uso:  node tools/build-pages.js [nome-do-repositório]      (padrão: itep) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs');
// aceita só o NOME do repositório (o Git Bash converteria '/itep' num caminho do Windows)
const PREFIX = '/' + path.basename(String(process.argv[2] || 'itep').replace(/[\\/]+$/, ''));
if (!/^\/[A-Za-z0-9._-]+$/.test(PREFIX)) { console.error('Prefixo inválido: ' + PREFIX); process.exit(1); }
const SKIP_DIRS = new Set(['docs', 'tools', 'api', 'admin', 'instalar', 'uploads', 'prints', '.git', 'node_modules']);
const SKIP_FILES = /(^\.|\.php$|\.md$|\.bat$|\.sql$|\.lock$|^seed\.json$|^site-data\.js$|^lead-beacon\.js$)/;
const SKIP_PAGES = new Set(['blog/artigo']); // modelo que depende da API

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
rmrf(OUT); fs.mkdirSync(OUT, { recursive: true });

let nHtml = 0, nOther = 0;
function copyDir(src, dst, rel) {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) { if ((!rel && SKIP_DIRS.has(e.name)) || SKIP_PAGES.has(r)) continue; copyDir(path.join(src, e.name), path.join(dst, e.name), r); continue; }
        if (SKIP_FILES.test(e.name)) continue;
        const from = path.join(src, e.name), to = path.join(dst, e.name);
        if (e.name.endsWith('.html')) { fs.writeFileSync(to, transformHtml(fs.readFileSync(from, 'utf8'))); nHtml++; }
        else if (e.name === 'cookies.js') { fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replace("'/politica-de-privacidades/index.html'", `'${PREFIX}/politica-de-privacidades/index.html'`)); nOther++; }
        else { fs.copyFileSync(from, to); nOther++; }
    }
}

function transformHtml(h) {
    // caminhos absolutos -> com prefixo (não mexe em https://, // nem #)
    h = h.replace(/(\s(?:href|src|action)=")\/(?!\/)/g, `$1${PREFIX}/`);
    // sem API no Pages: remove os scripts que dependem dela
    h = h.replace(/\s*<script src="[^"]*\/(?:site-data|lead-beacon)\.js"[^>]*><\/script>/g, '');
    // a área restrita não existe na cópia pública: remove o botão que leva até ela
    h = h.replace(/\s*<a class="footer__admin"[^>]*>[\s\S]*?<\/a>/g, '');
    // cópia de demonstração: fora dos buscadores
    if (!/name="robots"/.test(h)) h = h.replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n</head>');
    return h;
}

copyDir(ROOT, OUT, '');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(OUT, '404.html'), `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Página não encontrada | ITEP</title><link rel="icon" href="${PREFIX}/favicon.svg" type="image/svg+xml"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif;color:#fff;text-align:center;background:linear-gradient(160deg,#0F3D22,#072814)}h1{font-size:clamp(2rem,6vw,3.5rem);margin:0 0 12px}p{margin:0 0 24px;color:#BFE0C9}a{display:inline-block;padding:14px 26px;border-radius:12px;background:#FFC21A;color:#0E1D14;font-weight:700;text-decoration:none}</style></head><body><main><h1>Página não encontrada</h1><p>O endereço pode ter mudado ou não existe.</p><a href="${PREFIX}/">Voltar ao início</a></main></body></html>`);

/* ---------- verificação: todo link/arquivo interno precisa existir, com a MESMA caixa de letras (o GitHub diferencia) ---------- */
function exactExists(base, rel) {
    let cur = base;
    for (const seg of rel.split('/').filter(Boolean)) {
        let names; try { names = fs.readdirSync(cur); } catch (e) { return false; }
        if (!names.includes(seg)) return false;
        cur = path.join(cur, seg);
    }
    return true;
}
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
const bad = []; let checked = 0;
for (const f of walk(OUT).filter(x => x.endsWith('.html'))) {
    const h = fs.readFileSync(f, 'utf8');
    const rel = path.relative(OUT, f).replace(/\\/g, '/');
    const dirRel = path.posix.dirname(rel);
    for (const m of h.matchAll(/\s(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
        const u = m[1];
        if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(u)) continue;
        let target;
        if (u.startsWith(PREFIX + '/') || u === PREFIX) target = decodeURIComponent(u.slice(PREFIX.length));
        else if (u.startsWith('/')) { bad.push(`${rel}: link absoluto sem prefixo ${u}`); continue; }
        else target = path.posix.normalize(path.posix.join(dirRel, decodeURIComponent(u)));
        if (target === '' || target === '/') target = '/index.html';
        if (target.endsWith('/')) target += 'index.html';
        checked++;
        if (!exactExists(OUT, target)) bad.push(`${rel}: ${u} -> não existe (ou a caixa das letras não confere)`);
    }
}
console.log(`docs/: ${nHtml} páginas HTML + ${nOther} arquivos | prefixo ${PREFIX} | ${checked} links/arquivos verificados`);
if (bad.length) { console.log('PROBLEMAS (' + bad.length + '):\n- ' + [...new Set(bad)].slice(0, 40).join('\n- ')); process.exit(1); }
console.log('OK: todos os links internos existem, com a caixa de letras certa.');
