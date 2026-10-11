/* ITEP — MODO DEMONSTRAÇÃO da área restrita (só entra na cópia do GitHub Pages).
   Simula a API (/api/...) dentro do navegador, com dados FICTÍCIOS salvos em localStorage.
   Nada vai para servidor nenhum e nada aparece no site público. Senha de entrada: demo */
(function () {
    'use strict';
    window.ITEP_DEMO = true;

    var KEY = 'itep-demo-v1', AUTH = 'itep-demo-auth';
    var base = document.currentScript ? new URL('.', document.currentScript.src).href : './';
    var realFetch = window.fetch.bind(window);
    var db = null;
    var ready = null;

    /* ---------- dados de exemplo (fictícios, determinísticos) ---------- */
    function rnd(seed) { var x = seed >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
    function makeLeads(site) {
        var r = rnd(20260101);
        var first = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Talita', 'Vinícius'];
        var last = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Henrique', 'Lopes', 'Macedo', 'Nunes', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Souza'];
        var msgs = ['Quais documentos preciso levar para a matrícula?', 'Tem vaga para o próximo semestre?', 'Qual o horário das aulas?', 'Gostaria de saber como funciona o estágio.', 'Posso me matricular com 17 anos?', 'Onde fica a unidade da minha cidade?', '', 'Quero informações sobre o curso.'];
        var sources = ['/contato/index.html', '/', '/seja-nosso-aluno/index.html', '/Medina/index.html', '/tec-enfermagem/index.html'];
        var statuses = ['novo', 'novo', 'contatado', 'contatado', 'matriculado', 'arquivado'];
        var out = [], now = Date.now(), i;
        // cidades com mais procura têm peso maior
        var cities = site.cities.slice();
        for (i = 0; i < 64; i++) {
            var c = cities[Math.floor(Math.pow(r(), 1.6) * cities.length)];
            var courseKey = c.courses.length ? c.courses[Math.floor(Math.pow(r(), 1.4) * c.courses.length)] : '';
            var course = site.courses.filter(function (x) { return x.key === courseKey; })[0];
            var name = first[Math.floor(r() * first.length)] + ' ' + last[Math.floor(r() * last.length)] + ' (exemplo)';
            var age = 17 + Math.floor(r() * 30);
            var ts = new Date(now - Math.floor(r() * r() * 44 * 864e5) - Math.floor(r() * 864e5)).toISOString();
            out.push({
                id: ('d' + (100000000000 + i * 7919)).slice(0, 12), ts: ts,
                status: statuses[Math.floor(r() * statuses.length)], notes: '',
                name: name, phone: '(33) 9' + String(8000 + Math.floor(r() * 1999)) + '-' + String(1000 + Math.floor(r() * 8999)),
                email: i % 3 ? name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') + i + '@exemplo.com' : '',
                age: String(age), city: c.name, course: course ? course.name : '', subject: i % 4 === 0 ? 'Informações sobre matrícula' : '',
                message: msgs[Math.floor(r() * msgs.length)], source: sources[Math.floor(r() * sources.length)]
            });
        }
        return out.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
    }
    function load() {
        if (ready) return ready;
        ready = Promise.resolve().then(function () {
            try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.site && s.leads) { db = s; return; } } catch (e) { }
            return realFetch(base + 'demo-seed.json').then(function (r) { return r.json(); }).then(function (seed) {
                seed.posts.forEach(function (p) { p.updated = null; });
                db = { site: seed, leads: makeLeads(seed) }; save();
            });
        });
        return ready;
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* cheio */ } }

    /* ---------- utilidades ---------- */
    function res(code, obj) { return new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json' } }); }
    function err(code, msg) { return res(code, { error: msg }); }
    function clean(v, n) { return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n) : ''; }
    function digits(v) { return String(v || '').replace(/\D+/g, ''); }
    function isHttp(u) { return /^https?:\/\/[^\s<>"']+$/i.test(u); }
    function slugify(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }
    function rid() { return 'p' + Math.random().toString(16).slice(2, 10); }

    /* ---------- rotas ---------- */
    function route(method, path, body) {
        var m;
        if (path === '/api/admin/login' && method === 'POST') {
            if (body.password === 'demo') { sessionStorage.setItem(AUTH, '1'); return res(200, { ok: true, csrf: 'demo' }); }
            return err(401, 'Senha incorreta. No modo demonstração a senha é: demo');
        }
        if (path.indexOf('/api/admin/') !== 0) return err(404, 'Não encontrado.');
        if (!sessionStorage.getItem(AUTH)) return err(401, 'Sessão expirada. Entre novamente.');
        if (path === '/api/admin/me') return res(200, { ok: true, csrf: 'demo' });
        if (path === '/api/admin/logout') { sessionStorage.removeItem(AUTH); return res(200, { ok: true }); }
        if (path === '/api/admin/site') return res(200, db.site);
        if (path === '/api/admin/leads' && method === 'GET') return res(200, db.leads);
        if (path === '/api/admin/stats') {
            var by = {}, tc = {}, tci = {};
            db.leads.forEach(function (l) { by[l.status] = (by[l.status] || 0) + 1; if (l.course) tc[l.course] = (tc[l.course] || 0) + 1; if (l.city) tci[l.city] = (tci[l.city] || 0) + 1; });
            var top = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5); };
            return res(200, { total: db.leads.length, byStatus: by, week: db.leads.filter(function (l) { return Date.now() - Date.parse(l.ts) < 7 * 864e5; }).length, topCourse: top(tc), topCity: top(tci), posts: db.site.posts.length, published: db.site.posts.filter(function (p) { return p.published; }).length });
        }
        if ((m = path.match(/^\/api\/admin\/leads\/([A-Za-z0-9]+)$/))) {
            var i = db.leads.findIndex(function (l) { return l.id === m[1]; });
            if (i < 0) return err(404, 'Não encontrado.');
            if (method === 'DELETE') { db.leads.splice(i, 1); save(); return res(200, { ok: true }); }
            if (method === 'PUT') {
                if (['novo', 'contatado', 'matriculado', 'arquivado'].indexOf(body.status) !== -1) db.leads[i].status = body.status;
                if (typeof body.notes === 'string') db.leads[i].notes = clean(body.notes, 1000);
                save(); return res(200, db.leads[i]);
            }
        }
        if (path === '/api/admin/contact' && method === 'PUT') {
            var wa = digits(body.whatsapp), em = clean(body.email, 140), ig = clean(body.instagram, 200), fb = clean(body.facebook, 200);
            if (wa.length < 10 || wa.length > 15) return err(400, 'WhatsApp inválido (use DDI+DDD+número, ex.: 5533998043901).');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return err(400, 'E-mail inválido.');
            if ((ig && !isHttp(ig)) || (fb && !isHttp(fb))) return err(400, 'Os links de Instagram e Facebook devem começar com https://');
            db.site.contact = { whatsapp: wa, whatsappLabel: clean(body.whatsappLabel, 30) || wa, email: em, hours: clean(body.hours, 60), instagram: ig, facebook: fb };
            save(); return res(200, db.site.contact);
        }
        if ((m = path.match(/^\/api\/admin\/cities\/(.+)$/)) && method === 'PUT') {
            var dir = decodeURIComponent(m[1]), c = db.site.cities.filter(function (x) { return x.dir === dir; })[0];
            if (!c) return err(404, 'Cidade não encontrada.');
            var cig = clean(body.instagram, 200), cfb = clean(body.facebook, 200), ph = digits(body.phone);
            if ((cig && !isHttp(cig)) || (cfb && !isHttp(cfb))) return err(400, 'Os links devem começar com https://');
            if (ph && (ph.length < 10 || ph.length > 15)) return err(400, 'WhatsApp da unidade inválido (DDI+DDD+número).');
            var valid = db.site.courses.map(function (x) { return x.key; });
            var list = (body.courses || []).filter(function (k, ix, a) { return valid.indexOf(k) !== -1 && a.indexOf(k) === ix; });
            Object.assign(c, { address: clean(body.address, 200), phone: ph, instagram: cig, facebook: cfb, mapQuery: clean(body.mapQuery, 120) || c.name + ', MG', courses: list });
            save(); return res(200, c);
        }
        if ((m = path.match(/^\/api\/admin\/courses\/([a-z0-9-]+)$/)) && method === 'PUT') {
            var co = db.site.courses.filter(function (x) { return x.key === m[1]; })[0];
            if (!co) return err(404, 'Curso não encontrado.');
            if (!clean(body.obj, 600)) return err(400, 'O objetivo do curso não pode ficar vazio.');
            var img = clean(body.img, 300);
            if (img && !isHttp(img) && img.indexOf('data:image/') !== 0) return err(400, 'Imagem inválida: use um link https:// ou envie um arquivo.');
            Object.assign(co, { obj: clean(body.obj, 600), obj1: clean(body.obj1, 400), img: img || co.img });
            save(); return res(200, co);
        }
        if (path === '/api/admin/posts' && method === 'POST') {
            var r1 = cleanPost(body, null); if (r1.error) return err(400, r1.error);
            var p = Object.assign({ id: rid() }, r1.post, { updated: new Date().toISOString() });
            db.site.posts.unshift(p); save(); return res(200, p);
        }
        if (path === '/api/admin/posts/order' && method === 'PUT') {
            var map = {}; db.site.posts.forEach(function (x) { map[x.id] = x; });
            var sorted = (body.ids || []).map(function (id) { return map[id]; }).filter(Boolean);
            db.site.posts.forEach(function (x) { if (sorted.indexOf(x) === -1) sorted.push(x); });
            db.site.posts = sorted; save(); return res(200, { ok: true });
        }
        if ((m = path.match(/^\/api\/admin\/posts\/([A-Za-z0-9]+)$/))) {
            var pi = db.site.posts.findIndex(function (x) { return x.id === m[1]; });
            if (pi < 0) return err(404, 'Artigo não encontrado.');
            if (method === 'DELETE') { db.site.posts.splice(pi, 1); save(); return res(200, { ok: true }); }
            if (method === 'PUT') {
                var r2 = cleanPost(body, m[1]); if (r2.error) return err(400, r2.error);
                db.site.posts[pi] = Object.assign({ id: m[1] }, r2.post, { updated: new Date().toISOString() });
                save(); return res(200, db.site.posts[pi]);
            }
        }
        if (path === '/api/admin/upload' && method === 'POST') {
            var data = String(body.data || '');
            if (!data) return err(400, 'Arquivo vazio.');
            if (data.length > 600000) return err(413, 'No modo demonstração, use imagens de até ~400 KB (ou cole um link).');
            var mime = data.indexOf('/9j/') === 0 ? 'image/jpeg' : data.indexOf('iVBOR') === 0 ? 'image/png' : data.indexOf('UklGR') === 0 ? 'image/webp' : null;
            if (!mime) return err(400, 'Envie uma imagem JPG, PNG ou WEBP.');
            return res(200, { url: 'data:' + mime + ';base64,' + data });
        }
        if (path === '/api/admin/password' && method === 'POST') return res(200, { ok: true });
        return err(404, 'Não encontrado.');
    }
    function cleanPost(b, self) {
        var title = clean(b.title, 140), cat = clean(b.cat, 40) || 'Geral';
        var text = (b.text || []).map(function (t) { return clean(t, 3000); }).filter(Boolean);
        if (title.length < 3) return { error: 'Escreva um título.' };
        if (!text.length) return { error: 'Escreva o texto do artigo.' };
        var slug = slugify(clean(b.slug, 80) || title); if (!slug) return { error: 'Endereço (slug) inválido.' };
        if (slug === 'index' || slug === 'artigo') slug += '-artigo';
        if (db.site.posts.some(function (x) { return x.slug === slug && x.id !== self; })) return { error: 'Já existe um artigo com esse endereço. Mude o título ou o endereço.' };
        var img = clean(b.img, 300), href = clean(b.ctaHref, 300);
        if (img && !isHttp(img) && img.indexOf('data:image/') !== 0) return { error: 'Imagem inválida: use um link https:// ou envie um arquivo.' };
        if (href && !isHttp(href) && !/^\/[A-Za-z0-9\-._\/~#?=&%]*$/.test(href)) return { error: 'Link do botão inválido.' };
        return { post: { slug: slug, cat: cat, title: title, img: img, text: text, ctaText: clean(b.ctaText, 60) || 'Falar com o ITEP', ctaHref: href || 'https://wa.me/' + db.site.contact.whatsapp, published: !!b.published } };
    }

    /* ---------- intercepta fetch('/api/...') ---------- */
    window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var path; try { path = new URL(url, location.href).pathname; } catch (e) { path = ''; }
        if (path.indexOf('/api/') !== 0) return realFetch(input, init);
        var method = ((init && init.method) || 'GET').toUpperCase();
        var body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) { }
        return load().then(function () { return new Promise(function (ok) { setTimeout(function () { ok(route(method, path, body)); }, 120); }); });
    };

    /* ---------- faixa de aviso ---------- */
    function banner() {
        var b = document.createElement('div');
        b.className = 'demo-banner'; b.setAttribute('role', 'note');
        var t = document.createElement('span'); t.innerHTML = '<b>Modo demonstração</b> — dados fictícios, salvos só neste navegador. Nada é enviado para servidor e nada muda no site público. Senha: <code>demo</code>';
        var r = document.createElement('button'); r.type = 'button'; r.textContent = 'Restaurar exemplos';
        r.addEventListener('click', function () { if (confirm('Voltar aos dados de exemplo originais?')) { localStorage.removeItem(KEY); sessionStorage.removeItem(AUTH); location.reload(); } });
        b.appendChild(t); b.appendChild(r); document.body.insertBefore(b, document.body.firstChild);
        var st = document.createElement('style');
        st.textContent = '.demo-banner{position:sticky;top:0;z-index:300;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;padding:9px 14px;font:600 .8125rem/1.4 Inter,system-ui,sans-serif;color:#0E1D14;background:#FFC21A;text-align:center}.demo-banner code{background:rgba(0,0,0,.12);padding:1px 7px;border-radius:6px}.demo-banner button{font:inherit;font-weight:700;padding:5px 12px;border:0;border-radius:8px;background:#0E1D14;color:#fff;cursor:pointer}.side{top:var(--demo-h,0)}';
        document.head.appendChild(st);
        var fix = function () { document.documentElement.style.setProperty('--demo-h', b.offsetHeight + 'px'); };
        fix(); window.addEventListener('resize', fix);
    }
    if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
    document.title = 'Área restrita (demonstração) | ITEP';
})();
