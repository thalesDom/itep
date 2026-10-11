/* ITEP — área restrita (painel). Fala com /api/admin/* (PHP + MySQL). Sem innerHTML com dados: tudo via textContent. */
(function () {
    'use strict';

    var csrf = '';
    var data = null;        // /api/admin/site
    var leads = [];
    var $ = function (s, c) { return (c || document).querySelector(s); };

    function h(tag, attrs) {
        var el = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) {
            var v = attrs[k];
            if (v === false || v == null) return;
            if (k === 'class') el.className = v;
            else if (k === 'text') el.textContent = v;
            else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
            else if (k === 'value') el.value = v;
            else el.setAttribute(k, v === true ? '' : v);
        });
        (function add(list) {
            for (var i = 0; i < list.length; i++) {
                var c = list[i];
                if (c == null || c === false) continue;
                if (Array.isArray(c)) { add(c); continue; }
                el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
            }
        })(Array.prototype.slice.call(arguments, 2));
        return el;
    }

    var toastT;
    function toast(msg, err) {
        var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' is-err' : ''); t.hidden = false;
        clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, err ? 6000 : 3000);
    }

    function api(method, path, body) {
        var opt = { method: method, credentials: 'same-origin', headers: {} };
        if (csrf) opt.headers['X-CSRF'] = csrf;
        if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
        return fetch(path, opt).then(function (r) { unlock(); return r; }, function (e) { unlock(); throw e; }).then(function (r) {
            return r.text().then(function (t) {
                var j = null; try { j = JSON.parse(t); } catch (e) { /* vazio */ }
                if (r.status === 401 && path !== '/api/admin/login') { showLogin(); throw new Error((j && j.error) || 'Sessão expirada.'); }
                if (!r.ok) throw new Error((j && j.error) || 'Erro ' + r.status);
                return j;
            });
        });
    }
    var locked = [];
    document.addEventListener('submit', function (e) { var b = e.target.querySelector && e.target.querySelector('button[type=submit]'); if (b && !b.disabled) { b.disabled = true; locked.push(b); setTimeout(function () { b.disabled = false; }, 5000); } }, true);
    function unlock() { locked.splice(0).forEach(function (b) { b.disabled = false; }); }
    function safe(fn) { return function () { var a = arguments; return Promise.resolve().then(function () { return fn.apply(null, a); }).catch(function (e) { toast(e.message || 'Erro inesperado', true); }); }; }

    /* ---------- login ---------- */
    function showLogin() {
        $('#app').hidden = true; $('#login').hidden = false; csrf = '';
        var pw = $('#pw'); pw.value = ''; pw.focus();
    }
    $('#loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var err = $('#loginErr'), btn = e.target.querySelector('button'); err.hidden = true; btn.disabled = true;
        api('POST', '/api/admin/login', { password: $('#pw').value }).then(function (r) { csrf = r.csrf; start(); })
            .catch(function (x) { err.textContent = x.message; err.hidden = false; })
            .then(function () { btn.disabled = false; });
    });
    $('#logout').addEventListener('click', function () { api('POST', '/api/admin/logout', {}).catch(function () { }).then(showLogin); });

    /* ---------- navegação ---------- */
    var ICON = {
        painel: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
        mensagens: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
        blog: '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/>',
        unidades: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        cursos: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        contato: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
        seguranca: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
    };
    var VIEWS = [['painel', 'Painel'], ['mensagens', 'Mensagens'], ['blog', 'Blog'], ['unidades', 'Cidades'], ['cursos', 'Cursos'], ['contato', 'Contato e redes'], ['seguranca', 'Segurança']];
    var current = 'painel';

    function svg(name) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ico'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICON[name]; return s; }

    function buildNav() {
        var nav = $('#nav'); nav.textContent = '';
        VIEWS.forEach(function (v) {
            var novos = v[0] === 'mensagens' ? leads.filter(function (l) { return l.status === 'novo'; }).length : 0;
            var b = h('button', { type: 'button', 'data-v': v[0], 'aria-current': v[0] === current ? 'page' : false, onclick: function () { go(v[0]); } }, svg(v[0]), v[1], novos ? h('span', { class: 'count', text: String(novos) }) : null);
            nav.appendChild(b);
        });
    }
    function go(v) {
        current = v; buildNav();
        $('#side').classList.remove('is-open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
        $('#title').textContent = VIEWS.filter(function (x) { return x[0] === v; })[0][1];
        var view = $('#view'); view.textContent = ''; view.focus();
        safe(RENDER[v])(view);
        window.scrollTo(0, 0);
    }
    $('#menuBtn').addEventListener('click', function () { var o = $('#side').classList.toggle('is-open'); this.setAttribute('aria-expanded', String(o)); });

    function load() {
        return Promise.all([api('GET', '/api/admin/site'), api('GET', '/api/admin/leads')]).then(function (r) { data = r[0]; leads = r[1]; });
    }
    function start() {
        load().then(function () { $('#login').hidden = true; $('#app').hidden = false; go(current); }).catch(function (e) { toast(e.message, true); });
    }

    /* ---------- utilidades ---------- */
    function fdate(iso) { try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso || ''; } }
    function waLink(phone) { var d = String(phone || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 ? 'https://wa.me/' + d : null; }
    var uid = 0;
    function field(label, input, hint) { if (!input.id) input.id = 'f' + (++uid); return h('div', null, h('label', { for: input.id, text: label }), input, hint ? h('p', { class: 'hint', text: hint }) : null); }
    function input(id, val, attrs) { return h('input', Object.assign({ id: id, type: 'text', value: val || '' }, attrs || {})); }
    function pill(text, cls) { return h('span', { class: 'pill ' + (cls || ''), text: text }); }
    function confirmAsk(msg) { return window.confirm(msg); }
    function areaLabel(k) { return (data.areas[k] || {}).label || k; }
    function readFile(file) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = function () { rej(new Error('Não foi possível ler o arquivo.')); }; fr.readAsDataURL(file); });
    }
    function imageField(id, val) {
        var url = input(id, val, { placeholder: 'https://… ou envie um arquivo', inputmode: 'url' });
        var prev = h('img', { class: 'preview', alt: 'Pré-visualização da imagem' });
        var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', id: id + 'File' });
        function sync() { var v = url.value.trim(); if (v) { prev.src = v; prev.hidden = false; } else prev.hidden = true; }
        url.addEventListener('input', sync); prev.addEventListener('error', function () { prev.hidden = true; }); prev.addEventListener('load', function () { prev.hidden = false; });
        file.addEventListener('change', function () {
            var f = file.files[0]; if (!f) return;
            if (f.size > 5 * 1024 * 1024) { toast('A imagem tem mais de 5 MB.', true); file.value = ''; return; }
            btn.disabled = true; btn.textContent = 'Enviando…';
            readFile(f).then(function (b64) { return api('POST', '/api/admin/upload', { name: f.name, data: b64 }); })
                .then(function (r) { url.value = r.url; sync(); toast('Imagem enviada.'); })
                .catch(function (e) { toast(e.message, true); })
                .then(function () { btn.disabled = false; btn.textContent = 'Enviar imagem'; file.value = ''; });
        });
        var btn = h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Enviar imagem', onclick: function () { file.click(); } });
        sync();
        return { box: h('div', null, h('label', { for: id, text: 'Imagem' }), h('div', { class: 'upload' }, url, btn, file), h('p', { class: 'hint', text: 'JPG, PNG ou WEBP, até 5 MB.' }), prev), url: url };
    }

    /* ---------- views ---------- */
    var RENDER = {};

    RENDER.painel = function (view) {
        return api('GET', '/api/admin/stats').then(function (s) {
            var novos = s.byStatus.novo || 0;
            view.appendChild(h('div', { class: 'stats' },
                h('div', { class: 'stat stat--hot' }, h('strong', { text: String(novos) }), h('span', { text: 'Mensagens novas' })),
                h('div', { class: 'stat' }, h('strong', { text: String(s.week) }), h('span', { text: 'Recebidas nos últimos 7 dias' })),
                h('div', { class: 'stat' }, h('strong', { text: String(s.total) }), h('span', { text: 'Mensagens no total' })),
                h('div', { class: 'stat' }, h('strong', { text: s.published + '/' + s.posts }), h('span', { text: 'Artigos publicados' }))));
            function rank(title, rows) {
                return h('div', { class: 'card' }, h('h2', { text: title }), rows.length ? h('ul', { class: 'rank' }, rows.map(function (r) { return h('li', null, h('span', { text: r[0] }), h('b', { text: String(r[1]) })); })) : h('p', { class: 'empty', text: 'Ainda sem dados.' }));
            }
            view.appendChild(h('div', { class: 'two' }, rank('Cursos mais procurados', s.topCourse), rank('Cidades mais procuradas', s.topCity)));
            var last = leads.slice(0, 5);
            view.appendChild(h('div', { class: 'card', style: 'margin-top:18px' }, h('h2', { text: 'Últimas mensagens' }),
                last.length ? h('ul', { class: 'rank' }, last.map(function (l) { return h('li', null, h('span', { text: l.name + (l.course ? ' — ' + l.course : '') }), pill(l.status, 'pill--' + l.status)); })) : h('p', { class: 'empty', text: 'Nenhuma mensagem recebida ainda. Elas chegam aqui pelos formulários do site.' }),
                leads.length ? h('p', { style: 'margin-top:14px' }, h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Ver todas', onclick: function () { go('mensagens'); } })) : null));
        });
    };

    RENDER.mensagens = function (view) {
        var q = h('input', { type: 'search', placeholder: 'Buscar por nome, telefone, e-mail, curso…', 'aria-label': 'Buscar mensagens' });
        var st = h('select', { 'aria-label': 'Filtrar por status' }, [['', 'Todos os status'], ['novo', 'Novos'], ['contatado', 'Contatados'], ['matriculado', 'Matriculados'], ['arquivado', 'Arquivados']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        var count = h('span', { class: 'hint' });
        var list = h('div', { class: 'leads' });
        var shown = 40;
        view.appendChild(h('div', { class: 'bar' }, q, st, count, h('span', { class: 'spacer' }), h('a', { class: 'btn btn--line btn--sm', href: '/api/admin/leads.csv', text: 'Exportar CSV' })));
        view.appendChild(list);

        function draw() {
            var t = q.value.trim().toLowerCase(), s = st.value;
            var rows = leads.filter(function (l) { return (!s || l.status === s) && (!t || [l.name, l.phone, l.email, l.course, l.city, l.message, l.subject].join(' ').toLowerCase().indexOf(t) !== -1); });
            count.textContent = rows.length + (rows.length === 1 ? ' mensagem' : ' mensagens');
            list.textContent = '';
            if (!rows.length) { list.appendChild(h('p', { class: 'empty', text: leads.length ? 'Nenhuma mensagem com esse filtro.' : 'Nenhuma mensagem recebida ainda. Elas chegam aqui pelos formulários do site.' })); return; }
            rows.slice(0, shown).forEach(function (l) { list.appendChild(leadCard(l)); });
            if (rows.length > shown) list.appendChild(h('button', { type: 'button', class: 'btn btn--line', text: 'Mostrar mais (' + (rows.length - shown) + ')', onclick: function () { shown += 40; draw(); } }));
        }
        function leadCard(l) {
            var sel = h('select', { 'aria-label': 'Status' }, ['novo', 'contatado', 'matriculado', 'arquivado'].map(function (o) { return h('option', { value: o, text: o.charAt(0).toUpperCase() + o.slice(1), selected: o === l.status }); }));
            var notes = h('textarea', { placeholder: 'Anotações internas (só você vê)', maxlength: '1000', 'aria-label': 'Anotações' }); notes.value = l.notes || '';
            var wa = waLink(l.phone);
            var card = h('article', { class: 'lead is-' + l.status },
                h('div', { class: 'lead__head' }, h('span', { class: 'lead__name', text: l.name }), pill(l.status, 'pill--' + l.status), h('span', { class: 'lead__date', text: fdate(l.ts) })),
                h('div', { class: 'lead__meta' },
                    l.phone ? h('span', null, 'Telefone: ', h('b', { text: l.phone })) : null,
                    l.email ? h('span', null, 'E-mail: ', h('b', { text: l.email })) : null,
                    l.city ? h('span', null, 'Cidade: ', h('b', { text: l.city })) : null,
                    l.course ? h('span', null, 'Curso: ', h('b', { text: l.course })) : null,
                    l.age ? h('span', null, 'Idade: ', h('b', { text: l.age })) : null,
                    l.subject ? h('span', null, 'Assunto: ', h('b', { text: l.subject })) : null,
                    l.source ? h('span', null, 'Origem: ', h('b', { text: l.source })) : null),
                l.message ? h('div', { class: 'lead__msg', text: l.message }) : null,
                notes,
                h('div', { class: 'lead__actions' }, sel,
                    h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Salvar nota', onclick: safe(function () { return api('PUT', '/api/admin/leads/' + l.id, { notes: notes.value }).then(function (r) { l.notes = r.notes; toast('Nota salva.'); }); }) }),
                    wa ? h('a', { class: 'btn btn--primary btn--sm', href: wa, target: '_blank', rel: 'noopener', text: 'Chamar no WhatsApp' }) : null,
                    l.email ? h('a', { class: 'btn btn--line btn--sm', href: 'mailto:' + encodeURIComponent(l.email).replace('%40', '@'), text: 'E-mail' }) : null,
                    h('span', { class: 'spacer' }),
                    h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Apagar', onclick: safe(function () { if (!confirmAsk('Apagar esta mensagem de ' + l.name + '? Isso não pode ser desfeito.')) return; return api('DELETE', '/api/admin/leads/' + l.id).then(function () { leads = leads.filter(function (x) { return x.id !== l.id; }); buildNav(); draw(); toast('Mensagem apagada.'); }); }) })));
            sel.addEventListener('change', safe(function () { return api('PUT', '/api/admin/leads/' + l.id, { status: sel.value }).then(function (r) { l.status = r.status; buildNav(); draw(); toast('Status atualizado.'); }); }));
            return card;
        }
        q.addEventListener('input', function () { shown = 40; draw(); }); st.addEventListener('change', function () { shown = 40; draw(); }); draw();
    };

    /* --- blog --- */
    RENDER.blog = function (view) {
        function listView() {
            view.textContent = '';
            view.appendChild(h('div', { class: 'bar' }, h('button', { type: 'button', class: 'btn btn--primary', text: '+ Novo artigo', onclick: function () { editor(null); } }), h('span', { class: 'hint', text: 'A ordem aqui é a ordem no site. O primeiro aparece em destaque na home.' })));
            var rows = h('div', { class: 'rows' });
            if (!data.posts.length) rows.appendChild(h('p', { class: 'empty', text: 'Nenhum artigo ainda. Crie o primeiro!' }));
            data.posts.forEach(function (p, i) {
                function move(d) { var j = i + d; if (j < 0 || j >= data.posts.length) return; var a = data.posts.slice(); var t = a[i]; a[i] = a[j]; a[j] = t; return api('PUT', '/api/admin/posts/order', { ids: a.map(function (x) { return x.id; }) }).then(function () { data.posts = a; listView(); }); }
                rows.appendChild(h('div', { class: 'row' },
                    p.img ? h('img', { src: p.img, alt: '', loading: 'lazy' }) : h('img', { alt: '' }),
                    h('div', { class: 'row__txt' }, h('strong', { text: p.title }), h('span', { text: p.cat + ' · /blog/' + p.slug + '/' + (p.updated ? ' · editado em ' + fdate(p.updated) : '') })),
                    pill(p.published ? 'Publicado' : 'Rascunho', p.published ? '' : 'pill--off'),
                    h('div', { class: 'row__btns' },
                        h('button', { type: 'button', class: 'btn btn--line btn--sm', 'aria-label': 'Subir', text: '↑', disabled: i === 0, onclick: safe(function () { return move(-1); }) }),
                        h('button', { type: 'button', class: 'btn btn--line btn--sm', 'aria-label': 'Descer', text: '↓', disabled: i === data.posts.length - 1, onclick: safe(function () { return move(1); }) }),
                        p.published ? h('a', { class: 'btn btn--line btn--sm', href: '/blog/' + p.slug + '/', target: '_blank', rel: 'noopener', text: 'Ver' }) : null,
                        h('button', { type: 'button', class: 'btn btn--primary btn--sm', text: 'Editar', onclick: function () { editor(p); } }),
                        h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Excluir', onclick: safe(function () { if (!confirmAsk('Excluir o artigo "' + p.title + '"? Isso não pode ser desfeito.')) return; return api('DELETE', '/api/admin/posts/' + p.id).then(function () { data.posts = data.posts.filter(function (x) { return x.id !== p.id; }); listView(); toast('Artigo excluído.'); }); }) }))));
            });
            view.appendChild(rows);
        }
        function editor(p) {
            view.textContent = '';
            $('#title').textContent = p ? 'Editar artigo' : 'Novo artigo';
            var title = input('pt', p && p.title, { maxlength: '140', required: true });
            var slugTouched = !!p;
            var slug = input('ps', p && p.slug, { maxlength: '80' });
            slug.addEventListener('input', function () { slugTouched = true; });
            title.addEventListener('input', function () { if (!slugTouched) slug.value = title.value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); });
            var cats = Array.from(new Set(data.posts.map(function (x) { return x.cat; })));
            var cat = input('pc', (p && p.cat) || '', { maxlength: '40', list: 'catlist', placeholder: 'Ex.: Carreira' });
            var dl = h('datalist', { id: 'catlist' }, cats.map(function (c) { return h('option', { value: c }); }));
            var img = imageField('pi', p && p.img);
            var text = h('textarea', { id: 'px', rows: '12', 'aria-label': 'Texto do artigo' }); text.value = p ? p.text.join('\n\n') : '';
            var ctext = input('pct', p && p.ctaText, { maxlength: '60', placeholder: 'Ex.: Ver os cursos' });
            var chref = input('pch', p && p.ctaHref, { maxlength: '300', placeholder: 'https://… ou /pagina/' });
            var pub = h('input', { type: 'checkbox', id: 'pp' }); pub.checked = p ? p.published : true;
            var form = h('form', { class: 'card form', novalidate: true },
                field('Título', title),
                h('div', { class: 'cols' }, field('Endereço do artigo (/blog/…)', slug, 'Gerado do título; só letras minúsculas, números e hífens.'), h('div', null, h('label', { for: 'pc', text: 'Tema' }), cat, dl)),
                img.box,
                h('div', null, h('label', { for: 'px', text: 'Texto' }), text, h('p', { class: 'hint', text: 'Separe os parágrafos com uma linha em branco.' })),
                h('div', { class: 'cols' }, field('Texto do botão final', ctext), field('Link do botão final', chref, 'Vazio = WhatsApp do ITEP.')),
                h('label', { class: 'switch' }, pub, ' Publicado (visível no site)'),
                h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Salvar artigo' }), h('button', { type: 'button', class: 'btn btn--line', text: 'Cancelar', onclick: function () { $('#title').textContent = 'Blog'; listView(); } })));
            form.addEventListener('submit', safe(function (e) {
                e.preventDefault();
                var body = { title: title.value, slug: slug.value, cat: cat.value, img: img.url.value.trim(), text: text.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean), ctaText: ctext.value, ctaHref: chref.value.trim(), published: pub.checked };
                var req = p ? api('PUT', '/api/admin/posts/' + p.id, body) : api('POST', '/api/admin/posts', body);
                return req.then(function (r) {
                    if (p) data.posts = data.posts.map(function (x) { return x.id === r.id ? r : x; }); else data.posts.unshift(r);
                    $('#title').textContent = 'Blog'; listView(); toast('Artigo salvo.');
                });
            }));
            view.appendChild(form); title.focus();
        }
        listView();
    };

    /* --- cidades --- */
    RENDER.unidades = function (view) {
        function listView() {
            view.textContent = '';
            view.appendChild(h('p', { class: 'hint', style: 'margin-bottom:14px', text: 'Endereço, WhatsApp da unidade, redes e cursos oferecidos em cada cidade.' }));
            var rows = h('div', { class: 'rows' });
            data.cities.forEach(function (c) {
                rows.appendChild(h('div', { class: 'row' },
                    h('div', { class: 'row__txt' }, h('strong', { text: c.name }), h('span', { text: (c.address || 'Sem endereço cadastrado') + ' · ' + c.courses.length + (c.courses.length === 1 ? ' curso' : ' cursos') })),
                    pill(c.address ? 'Completo' : 'Falta endereço', c.address ? '' : 'pill--novo'),
                    h('div', { class: 'row__btns' }, h('button', { type: 'button', class: 'btn btn--primary btn--sm', text: 'Editar', onclick: function () { editor(c); } }))));
            });
            view.appendChild(rows);
        }
        function editor(c) {
            view.textContent = ''; $('#title').textContent = c.name;
            var address = input('ca', c.address, { maxlength: '200', placeholder: 'Rua, número, bairro' });
            var phone = input('cp', c.phone, { maxlength: '20', inputmode: 'tel', placeholder: 'Opcional — ex.: 5533999990000' });
            var ig = input('ci', c.instagram, { maxlength: '200', placeholder: 'https://instagram.com/…', inputmode: 'url' });
            var fb = input('cf', c.facebook, { maxlength: '200', placeholder: 'https://facebook.com/…', inputmode: 'url' });
            var map = input('cm', c.mapQuery, { maxlength: '120' });
            var boxes = {};
            var groups = h('div', null);
            Object.keys(data.areas).forEach(function (ak) {
                var cs = data.courses.filter(function (x) { return x.area === ak; }); if (!cs.length) return;
                groups.appendChild(h('p', { class: 'group', text: areaLabel(ak) }));
                groups.appendChild(h('div', { class: 'checks' }, cs.map(function (x) {
                    var cb = h('input', { type: 'checkbox' }); cb.checked = c.courses.indexOf(x.key) !== -1; boxes[x.key] = cb;
                    return h('label', { class: 'check' }, cb, x.name);
                })));
            });
            var form = h('form', { class: 'card form', novalidate: true },
                field('Endereço da unidade', address, 'Aparece na página da cidade.'),
                h('div', { class: 'cols' }, field('WhatsApp da unidade', phone, 'Se preencher, os botões dessa página usam este número.'), field('Busca do mapa', map, 'Texto usado no Google Maps. Ex.: endereço completo.')),
                h('div', { class: 'cols' }, field('Instagram', ig), field('Facebook', fb)),
                h('div', null, h('label', { text: 'Cursos oferecidos nesta cidade' }), groups),
                h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Salvar cidade' }), h('button', { type: 'button', class: 'btn btn--line', text: 'Voltar', onclick: function () { $('#title').textContent = 'Cidades'; listView(); } })));
            form.addEventListener('submit', safe(function (e) {
                e.preventDefault();
                return api('PUT', '/api/admin/cities/' + encodeURIComponent(c.dir), { address: address.value, phone: phone.value, instagram: ig.value.trim(), facebook: fb.value.trim(), mapQuery: map.value, courses: Object.keys(boxes).filter(function (k) { return boxes[k].checked; }) })
                    .then(function (r) { data.cities = data.cities.map(function (x) { return x.dir === r.dir ? r : x; }); $('#title').textContent = 'Cidades'; listView(); toast('Cidade salva.'); });
            }));
            view.appendChild(form);
        }
        listView();
    };

    /* --- cursos --- */
    RENDER.cursos = function (view) {
        function listView() {
            view.textContent = '';
            view.appendChild(h('p', { class: 'hint', style: 'margin-bottom:14px', text: 'Texto de apresentação e foto de cada curso. O nome e a área seguem a relação oficial.' }));
            var rows = h('div', { class: 'rows' });
            data.courses.forEach(function (c) {
                rows.appendChild(h('div', { class: 'row' }, h('img', { src: c.img, alt: '', loading: 'lazy' }),
                    h('div', { class: 'row__txt' }, h('strong', { text: 'Técnico em ' + c.name }), h('span', { text: areaLabel(c.area) })),
                    h('div', { class: 'row__btns' }, h('a', { class: 'btn btn--line btn--sm', href: '/' + encodeURI(c.dir) + '/', target: '_blank', rel: 'noopener', text: 'Ver' }), h('button', { type: 'button', class: 'btn btn--primary btn--sm', text: 'Editar', onclick: function () { editor(c); } }))));
            });
            view.appendChild(rows);
        }
        function editor(c) {
            view.textContent = ''; $('#title').textContent = 'Técnico em ' + c.name;
            var obj = h('textarea', { id: 'co', maxlength: '600', rows: '4' }); obj.value = c.obj;
            var obj1 = h('textarea', { id: 'co1', maxlength: '400', rows: '3' }); obj1.value = c.obj1 || '';
            var img = imageField('cimg', c.img);
            var form = h('form', { class: 'card form', novalidate: true },
                h('div', null, h('label', { for: 'co', text: 'Objetivo do curso' }), obj, h('p', { class: 'hint', text: 'Aparece no topo da página do curso.' })),
                h('div', null, h('label', { for: 'co1', text: 'Descrição complementar (opcional)' }), obj1),
                img.box,
                h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Salvar curso' }), h('button', { type: 'button', class: 'btn btn--line', text: 'Voltar', onclick: function () { $('#title').textContent = 'Cursos'; listView(); } })));
            form.addEventListener('submit', safe(function (e) {
                e.preventDefault();
                return api('PUT', '/api/admin/courses/' + c.key, { obj: obj.value, obj1: obj1.value, img: img.url.value.trim() })
                    .then(function (r) { data.courses = data.courses.map(function (x) { return x.key === r.key ? r : x; }); $('#title').textContent = 'Cursos'; listView(); toast('Curso salvo.'); });
            }));
            view.appendChild(form);
        }
        listView();
    };

    /* --- contato --- */
    RENDER.contato = function (view) {
        var c = data.contact;
        var wa = input('kw', c.whatsapp, { inputmode: 'numeric', maxlength: '20' });
        var wl = input('kl', c.whatsappLabel, { maxlength: '30' });
        var em = input('ke', c.email, { type: 'email', maxlength: '140' });
        var hr = input('kh', c.hours, { maxlength: '60' });
        var ig = input('ki', c.instagram, { maxlength: '200', placeholder: 'https://instagram.com/…', inputmode: 'url' });
        var fb = input('kf', c.facebook, { maxlength: '200', placeholder: 'https://facebook.com/…', inputmode: 'url' });
        var form = h('form', { class: 'card form', novalidate: true },
            h('p', { class: 'hint', text: 'Estes dados aparecem em todas as páginas do site (topo, rodapé, contato e botões).' }),
            h('div', { class: 'cols' }, field('WhatsApp (só números, com 55 + DDD)', wa, 'Ex.: 5533998043901'), field('Como mostrar o número', wl, 'Ex.: (33) 9 9804-3901')),
            h('div', { class: 'cols' }, field('E-mail', em), field('Horário de atendimento', hr)),
            h('div', { class: 'cols' }, field('Instagram do ITEP', ig), field('Facebook do ITEP', fb)),
            h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Salvar' })));
        form.addEventListener('submit', safe(function (e) {
            e.preventDefault();
            return api('PUT', '/api/admin/contact', { whatsapp: wa.value, whatsappLabel: wl.value, email: em.value, hours: hr.value, instagram: ig.value.trim(), facebook: fb.value.trim() }).then(function (r) { data.contact = r; toast('Contato salvo. O site já usa os novos dados.'); });
        }));
        view.appendChild(form);
    };

    /* --- segurança --- */
    RENDER.seguranca = function (view) {
        var cur = input('sp0', '', { type: 'password', autocomplete: 'current-password' });
        var n1 = input('sp1', '', { type: 'password', autocomplete: 'new-password', minlength: '10' });
        var n2 = input('sp2', '', { type: 'password', autocomplete: 'new-password', minlength: '10' });
        var msg = h('p', { class: 'msg', hidden: true, role: 'alert' });
        var form = h('form', { class: 'card form', novalidate: true, style: 'max-width:520px' },
            h('h2', { text: 'Trocar senha' }),
            field('Senha atual', cur), field('Nova senha', n1, 'Mínimo de 10 caracteres, com letras e números.'), field('Repita a nova senha', n2), msg,
            h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Trocar senha' })));
        form.addEventListener('submit', function (e) {
            e.preventDefault(); msg.hidden = true;
            if (n1.value !== n2.value) { msg.className = 'msg msg--err'; msg.textContent = 'As senhas novas não conferem.'; msg.hidden = false; return; }
            api('POST', '/api/admin/password', { current: cur.value, next: n1.value })
                .then(function () { cur.value = n1.value = n2.value = ''; msg.className = 'msg msg--ok'; msg.textContent = 'Senha trocada com sucesso.'; msg.hidden = false; })
                .catch(function (x) { msg.className = 'msg msg--err'; msg.textContent = x.message; msg.hidden = false; });
        });
        view.appendChild(form);
    };

    /* ---------- início ---------- */
    api('GET', '/api/admin/me').then(function (r) { csrf = r.csrf; start(); }).catch(function () { showLogin(); });
})();
