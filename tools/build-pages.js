/* Gera a versão ESTÁTICA do site em /docs para o GitHub Pages.
   O Pages serve o site em /<repositório>/, então todo link que começa com "/" precisa receber o prefixo.
   O painel (/admin/), a API e o instalador estão no repositório, mas não rodam no GitHub Pages (precisam de PHP + MySQL):
   aqui /admin/ vira uma página explicativa.
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
const SKIP_FILES = /(^\.|\.php$|\.md$|\.bat$|\.sql$|\.lock$|^seed\.json$|^site-data\.js$|^lead-beacon\.js$|^sitemap.*\.xml$|^robots\.txt$)/;
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
    // cópia de demonstração: fora dos buscadores
    if (!/name="robots"/.test(h)) h = h.replace('</head>', '    <meta name="robots" content="noindex, nofollow">\n</head>');
    return h;
}

copyDir(ROOT, OUT, '');
fs.mkdirSync(path.join(OUT, 'admin'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'admin', 'index.html'), `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Área restrita | ITEP</title><link rel="icon" href="${PREFIX}/favicon.svg" type="image/svg+xml"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Manrope:wght@800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif;color:#0E1D14;background:linear-gradient(160deg,#0F3D22,#072814)}.card{width:min(460px,100%);padding:34px 28px;text-align:center;background:#fff;border-radius:26px;box-shadow:0 40px 80px -24px rgba(0,0,0,.6)}.ico{width:58px;height:58px;margin:0 auto 16px;display:grid;place-items:center;border-radius:18px;color:#fff;background:linear-gradient(135deg,#1B8F45,#0F3D22)}h1{margin:0 0 10px;font:800 1.5rem Manrope,Inter,sans-serif;letter-spacing:-.02em}p{margin:0 0 22px;color:#4A5C51;line-height:1.6}a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;font-weight:600;color:#fff;text-decoration:none;background:#16783A;border-radius:14px}a:focus-visible{outline:3px solid #FFC21A;outline-offset:3px}</style></head><body><main class="card"><div class="ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h1>Área restrita</h1><p>O painel do ITEP funciona no servidor oficial do site (PHP + MySQL) e recebe as mensagens dos formulários. Esta é a cópia de demonstração, que não tem painel.</p><a href="${PREFIX}/">Voltar ao site</a></main></body></html>`);
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
