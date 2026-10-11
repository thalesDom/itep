/* ITEP — área restrita (painel). Fala com /api/admin/* (PHP + MySQL). Sem innerHTML com dados: tudo via textContent. */
(function () {
    'use strict';

    var csrf = '';
    var data = null;        // /api/admin/site
    var leads = [];
    var meName = '';
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
        var pw = $('#pw'); pw.value = ''; pw.type = 'password'; var us = $('#us'); us.focus();
    }
    $('#loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var err = $('#loginErr'), btn = e.target.querySelector('button[type=submit]'); err.hidden = true; btn.disabled = true;
        api('POST', '/api/admin/login', { username: $('#us').value, password: $('#pw').value }).then(function (r) { csrf = r.csrf; start(); })
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
        relatorios: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>',
        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
        alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        seguranca: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
    };
    ICON.m_pre = ICON.m_contato = ICON.mensagens;
    var VIEWS = [['painel', 'Painel'], ['m_pre', 'Pré-cadastros'], ['m_contato', 'Contato'], ['relatorios', 'Relatórios'], ['blog', 'Blog'], ['contato', 'Contato e redes'], ['seguranca', 'Segurança']];
    var KIND_LABEL = { m_pre: 'Pré-cadastro', m_contato: 'Contato' };
    /* de qual formulário veio a mensagem */
    function leadKind(l) {
        return String(l.source || '').toLowerCase().indexOf('seja') !== -1 ? 'm_pre' : 'm_contato';
    }
    var current = 'painel';

    function svg(name) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ico'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICON[name]; return s; }

    function buildNav() {
        var nav = $('#nav'); nav.textContent = '';
        VIEWS.forEach(function (v) {
            var isMsg = v[0].indexOf('m_') === 0;
            if (v[0] === 'm_pre') nav.appendChild(h('p', { class: 'nav__group', text: 'Mensagens recebidas' }));
            if (v[0] === 'blog') nav.appendChild(h('p', { class: 'nav__group', text: 'Conteúdo do site (opcional)' }));
            if (v[0] === 'seguranca') nav.appendChild(h('p', { class: 'nav__group', text: 'Conta' }));
            var novos = isMsg ? leads.filter(function (l) { return l.status === 'novo' && leadKind(l) === v[0]; }).length : 0;
            var b = h('button', { type: 'button', 'data-v': v[0], 'aria-current': v[0] === current ? 'page' : false, onclick: function () { go(v[0]); } }, svg(v[0]), v[1], novos ? h('span', { class: 'count', text: String(novos) }) : null);
            nav.appendChild(b);
        });
    }
    function go(v) {
        current = v; buildNav();
        setMenu(false);
        $('#title').textContent = VIEWS.filter(function (x) { return x[0] === v; })[0][1];
        var view = $('#view'); view.textContent = ''; view.focus();
        safe(RENDER[v])(view);
        window.scrollTo(0, 0);
    }
    /* menu do celular: abre, e fecha pelo X, tocando fora, com ESC ou ao escolher uma tela */
    function setMenu(open) {
        var side = $('#side'), btn = $('#menuBtn'), back = $('#sideBack');
        if (side.classList.contains('is-open') === open) return;
        side.classList.toggle('is-open', open); back.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) { var cur = side.querySelector('nav button[aria-current=page]') || side.querySelector('nav button'); if (cur) cur.focus(); } else btn.focus({ preventScroll: true });
    }
    $('#menuBtn').addEventListener('click', function () { setMenu(!$('#side').classList.contains('is-open')); });
    $('#sideClose').addEventListener('click', function () { setMenu(false); });
    $('#sideBack').addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#side').classList.contains('is-open')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 960) setMenu(false); });

    function load() {
        return Promise.all([api('GET', '/api/admin/site'), api('GET', '/api/admin/leads'), api('GET', '/api/admin/me')]).then(function (r) { data = r[0]; leads = r[1]; meName = r[2].username || ''; });
    }
    function start() {
        load().then(function () { $('#login').hidden = true; $('#app').hidden = false; go(current); }).catch(function (e) { toast(e.message, true); });
    }

    /* ---------- utilidades ---------- */
    function fdate(iso) { try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso || ''; } }
    function waLink(phone) { var d = String(phone || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 ? 'https://wa.me/' + d : null; }
    var uid = 0;
    /* campo de senha com botão de olho (mostrar/ocultar) */
    function pwWrap(input) {
        var wrap = h('div', { class: 'pw' });
        var btn = h('button', { type: 'button', class: 'pw__btn', 'aria-label': 'Mostrar senha', 'aria-pressed': 'false', title: 'Mostrar senha' }, svg('eye'));
        btn.addEventListener('click', function () {
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.textContent = ''; btn.appendChild(svg(show ? 'eyeoff' : 'eye'));
            btn.setAttribute('aria-pressed', String(show)); btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); btn.title = show ? 'Ocultar senha' : 'Mostrar senha';
            input.focus();
        });
        if (input.parentNode) input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input); wrap.appendChild(btn);
        return wrap;
    }
    function field(label, input, hint) { if (!input.id) input.id = 'f' + (++uid); var ctl = input.type === 'password' ? pwWrap(input) : input; return h('div', null, h('label', { for: input.id, text: label }), ctl, hint ? h('p', { class: 'hint', text: hint }) : null); }
    function input(id, val, attrs) { return h('input', Object.assign({ id: id, type: 'text', value: val || '' }, attrs || {})); }
    function pill(text, cls) { return h('span', { class: 'pill ' + (cls || ''), text: text }); }
    /* ---------- janelas (no lugar do confirm/prompt do navegador) ---------- */
    function norm(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+-\s+mg$/, '').replace(/^tecnic[oa] em /, '').trim(); }
    function canon(key, v) {
        v = String(v || '').trim(); if (!v || !data) return v;
        var list = key === 'course' ? data.courses : data.cities, n = norm(v);
        var hit = (list || []).filter(function (x) { return norm(x.name) === n; })[0];
        return hit ? hit.name : v;
    }
    function countBy(rows, key) {
        var m = {};
        rows.forEach(function (l) { var v = canon(key, l[key]); if (v) m[v] = (m[v] || 0) + 1; });
        return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (x, y) { return y[1] - x[1] || (x[0] < y[0] ? -1 : 1); });
    }
    function modal(o) {
        return new Promise(function (resolve) {
            var prev = document.activeElement, inputs = {};
            var err = h('p', { class: 'msg msg--err', hidden: true, role: 'alert' });
            var fields = (o.fields || []).map(function (f) {
                var i = h('input', { id: 'mf_' + f.name, type: f.type || 'text', autocomplete: f.autocomplete || 'off', placeholder: f.placeholder || false });
                inputs[f.name] = i; return field(f.label, i, f.hint);
            });
            var cancel = o.hideCancel ? null : h('button', { type: 'button', class: 'btn btn--line', text: o.cancelLabel || 'Cancelar', onclick: function () { close(null); } });
            var extra = (o.extra || []).map(function (x) { return h('button', { type: 'button', class: 'btn btn--line', text: x.label, onclick: function (e) { x.onclick(e.currentTarget, close); } }); });
            var ok = o.confirmLabel === false ? null : h('button', { type: 'submit', class: 'btn ' + (o.danger ? 'btn--danger-solid' : 'btn--primary'), text: o.confirmLabel || 'Confirmar' });
            var card = h('form', { class: 'modal__card', novalidate: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mdTitle' },
                h('span', { class: 'modal__ico modal__ico--' + (o.tone || 'info'), 'aria-hidden': 'true' }, svg(o.icon || 'seguranca')),
                h('h2', { id: 'mdTitle', text: o.title }),
                o.text ? h('p', { class: 'modal__text', text: o.text }) : null,
                o.highlight ? h('p', { class: 'modal__hl', text: o.highlight }) : null,
                h('div', { class: 'modal__fields' }, fields), err,
                h('div', { class: 'modal__actions' }, extra, cancel, ok));
            var back = h('div', { class: 'modal' }, card);
            var lock = document.body.style.overflow;
            function close(v) {
                document.removeEventListener('keydown', onKey, true);
                back.classList.add('is-out');
                setTimeout(function () { back.remove(); document.body.style.overflow = lock; if (prev && prev.focus) prev.focus(); }, 160);
                resolve(v);
            }
            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); close(null); return; }
                if (e.key !== 'Tab') return;
                var f = card.querySelectorAll('input,button,a[href]'); if (!f.length) return;
                var first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
            card.addEventListener('submit', function (e) {
                e.preventDefault();
                var vals = {}; Object.keys(inputs).forEach(function (k) { vals[k] = inputs[k].value; });
                var msg = o.validate ? o.validate(vals) : '';
                if (msg) { err.textContent = msg; err.hidden = false; return; }
                close(Object.keys(inputs).length ? vals : true);
            });
            back.addEventListener('mousedown', function (e) { if (e.target === back) close(null); });
            document.addEventListener('keydown', onKey, true);
            document.body.style.overflow = 'hidden'; document.body.appendChild(back);
            var focusEl = Object.keys(inputs).length ? inputs[Object.keys(inputs)[0]] : (ok || cancel); if (focusEl) focusEl.focus();
        });
    }
    function confirmAsk(msg, o) {
        o = o || {};
        return modal({ title: o.title || 'Confirmar', text: msg, tone: o.danger ? 'danger' : 'info', icon: o.danger ? 'alerta' : 'seguranca', danger: o.danger, confirmLabel: o.confirmLabel || 'Confirmar' }).then(function (v) { return !!v; });
    }
    function askNewPassword(username) {
        return modal({
            title: 'Redefinir senha', text: 'Defina uma nova senha para "' + username + '". Ela precisa ter 10+ caracteres, com letras e números.', icon: 'seguranca', confirmLabel: 'Redefinir senha',
            fields: [{ name: 'p1', label: 'Nova senha', type: 'password', autocomplete: 'new-password' }, { name: 'p2', label: 'Repita a senha', type: 'password', autocomplete: 'new-password' }],
            validate: function (v) {
                if (v.p1 !== v.p2) return 'As senhas não conferem.';
                if (v.p1.length < 10 || !/[A-Za-z]/.test(v.p1) || !/[0-9]/.test(v.p1)) return 'A senha precisa ter 10+ caracteres, com letras e números.';
                return '';
            }
        }).then(function (v) { return v ? v.p1 : null; });
    }
    function mailModal(addr) {
        modal({
            title: 'Enviar e-mail', highlight: addr, text: 'Escolha como prefere escrever.', icon: 'mail', hideCancel: true, confirmLabel: 'Abrir no Gmail',
            extra: [
                { label: 'App de e-mail', onclick: function (b, close) { window.location.href = 'mailto:' + addr; close(null); } },
                { label: 'Copiar endereço', onclick: function (b, close) {
                    (navigator.clipboard ? navigator.clipboard.writeText(addr) : Promise.reject()).then(function () { b.textContent = 'Copiado'; setTimeout(function () { close(null); }, 900); })
                        .catch(function () { b.textContent = 'Copie manualmente'; });
                } }
            ]
        }).then(function (v) { if (v) window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(addr), '_blank', 'noopener'); });
    }
    function areaLabel(k) { return (data.areas[k] || {}).label || k; }
    function readFile(file) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1]); }; fr.onerror = function () { rej(new Error('Não foi possível ler o arquivo.')); }; fr.readAsDataURL(file); });
    }
    function imageField(id, val) {
        var url = input(id, val, { placeholder: 'https://… ou envie um arquivo', inputmode: 'url' });
        var prev = h('img', { class: 'preview', alt: 'Pré-visualização da imagem' });
        var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', id: id + 'File' });
        function sync() { var v = url.value.trim(); if (v) { prev.src = v; prev.hidden = false; } else prev.hidden = true; rm.hidden = !v; }
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
        var rm = h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Remover imagem', onclick: function () { url.value = ''; file.value = ''; sync(); toast('Imagem removida. Salve para aplicar.'); } });
        sync();
        return { box: h('div', null, h('label', { for: id, text: 'Imagem' }), h('div', { class: 'upload' }, url, btn, rm, file), h('p', { class: 'hint', text: 'JPG, PNG ou WEBP, até 5 MB. Deixe vazio para publicar sem imagem.' }), prev), url: url };
    }

    function csvFile(rows, name) {
        var cols = ['ts', 'status', 'name', 'phone', 'email', 'age', 'city', 'course', 'subject', 'message', 'source', 'notes'];
        var head = ['Data', 'Status', 'Nome', 'Telefone', 'E-mail', 'Idade', 'Cidade', 'Curso', 'Assunto', 'Mensagem', 'Origem', 'Anotações'];
        function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
        var out = '\ufeff' + head.join(';') + '\r\n' + rows.map(function (l) { return cols.map(function (c) { return cell(c === 'ts' ? fdate(l.ts) : l[c]); }).join(';'); }).join('\r\n');
        var url = URL.createObjectURL(new Blob([out], { type: 'text/csv;charset=utf-8' }));
        var a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
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
            view.appendChild(h('div', { class: 'two' }, rank('Cursos mais procurados', countBy(leads, 'course').slice(0, 5)), rank('Cidades mais procuradas', countBy(leads, 'city').slice(0, 5))));
            var last = leads.slice(0, 5);
            view.appendChild(h('div', { class: 'card', style: 'margin-top:18px' }, h('h2', { text: 'Últimas mensagens' }),
                last.length ? h('ul', { class: 'rank' }, last.map(function (l) { return h('li', null, h('span', { text: l.name + (l.course ? ' — ' + l.course : '') + ' · ' + KIND_LABEL[leadKind(l)] }), pill(l.status, 'pill--' + l.status)); })) : h('p', { class: 'empty', text: 'Nenhuma mensagem recebida ainda. Elas chegam aqui pelos formulários do site.' }),
                null));
        });
    };

    function originLabel(src) {
        src = String(src || '');
        if (src === '' || src === '/' || src.indexOf('/index.html') === 0 || src.indexOf('/#') === 0) return 'Página inicial';
        if (src.indexOf('/contato') === 0) return 'Página de contato';
        return src;
    }
    function renderMessages(view, kind, intro, emptyText) {
        var mine = function () { return leads.filter(function (l) { return leadKind(l) === kind; }); };
        view.appendChild(h('p', { class: 'hint', style: 'margin-bottom:12px', text: intro }));
        var q = h('input', { type: 'search', placeholder: 'Buscar por nome, telefone, e-mail, curso…', 'aria-label': 'Buscar mensagens' });
        var st = h('select', { 'aria-label': 'Filtrar por status' }, [['', 'Todos os status'], ['novo', 'Novos'], ['contatado', 'Contatados'], ['matriculado', 'Matriculados'], ['arquivado', 'Arquivados']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        var count = h('span', { class: 'hint' });
        var list = h('div', { class: 'leads' });
        var shown = 40, lastRows = [];
        view.appendChild(h('div', { class: 'bar' }, q, st, count, h('span', { class: 'spacer' }), h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Exportar CSV', onclick: function () { csvFile(lastRows, 'mensagens-' + kind.slice(2) + '-itep.csv'); } })));
        view.appendChild(list);

        function draw() {
            var t = q.value.trim().toLowerCase(), s = st.value;
            var rows = mine().filter(function (l) { return (!s || l.status === s) && (!t || [l.name, l.phone, l.email, l.course, l.city, l.message, l.subject].join(' ').toLowerCase().indexOf(t) !== -1); });
            lastRows = rows;
            count.textContent = rows.length + (rows.length === 1 ? ' mensagem' : ' mensagens');
            list.textContent = '';
            if (!rows.length) { list.appendChild(h('p', { class: 'empty', text: mine().length ? 'Nenhuma mensagem com esse filtro.' : emptyText })); return; }
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
                    kind === 'm_contato' ? h('span', null, 'Origem: ', h('b', { text: originLabel(l.source) })) : null),
                l.message ? h('div', { class: 'lead__msg', text: l.message }) : null,
                notes,
                h('div', { class: 'lead__actions' }, sel,
                    h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Salvar nota', onclick: safe(function () { return api('PUT', '/api/admin/leads/' + l.id, { notes: notes.value }).then(function (r) { l.notes = r.notes; toast('Nota salva.'); }); }) }),
                    wa ? h('a', { class: 'btn btn--primary btn--sm', href: wa, target: '_blank', rel: 'noopener', text: 'Chamar no WhatsApp' }) : null,
                    l.email ? h('a', { class: 'btn btn--line btn--sm', href: 'mailto:' + encodeURIComponent(l.email).replace('%40', '@'), text: 'E-mail', onclick: function (e) { e.preventDefault(); mailModal(l.email); } }) : null,
                    h('span', { class: 'spacer' }),
                    h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Apagar', onclick: safe(function () { return confirmAsk('Apagar a mensagem de ' + l.name + '? Isso não pode ser desfeito.', { title: 'Apagar mensagem', confirmLabel: 'Apagar', danger: true }).then(function (ok) { if (!ok) return; return api('DELETE', '/api/admin/leads/' + l.id).then(function () { leads = leads.filter(function (x) { return x.id !== l.id; }); buildNav(); draw(); toast('Mensagem apagada.'); }); }); }) })));
            sel.addEventListener('change', safe(function () { return api('PUT', '/api/admin/leads/' + l.id, { status: sel.value }).then(function (r) { l.status = r.status; buildNav(); draw(); toast('Status atualizado.'); }); }));
            return card;
        }
        q.addEventListener('input', function () { shown = 40; draw(); }); st.addEventListener('change', function () { shown = 40; draw(); }); draw();
    }
    RENDER.m_pre = function (v) { renderMessages(v, 'm_pre', 'Alunos que preencheram o formulário "Seja nosso aluno".', 'Nenhum pré-cadastro recebido ainda.'); };
    RENDER.m_contato = function (v) { renderMessages(v, 'm_contato', 'Mensagens dos formulários de contato: o "Solicite mais informações" da página inicial e o da página de contato.', 'Nenhuma mensagem de contato ainda.'); };

    /* --- relatórios --- */
    RENDER.relatorios = function (view) {
        var DAY = 864e5;
        function ymd(d) { var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
        function startOf(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
        function pt(d) { return d.toLocaleDateString('pt-BR'); }
        var now = new Date();
        var period = h('select', { id: 'rp', 'aria-label': 'Período' }, [['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias'], ['mes', 'Este mês'], ['tudo', 'Todo o período'], ['custom', 'Personalizado…']].map(function (o) { return h('option', { value: o[0], text: o[1], selected: o[0] === '30' }); }));
        var from = h('input', { type: 'date', id: 'rf', 'aria-label': 'De' }); var to = h('input', { type: 'date', id: 'rt', 'aria-label': 'Até' });
        from.value = ymd(new Date(now - 29 * DAY)); to.value = ymd(now);
        var dates = h('span', { class: 'report__dates', hidden: true }, h('label', { class: 'sr', for: 'rf', text: 'De' }), from, h('span', { text: 'até' }), h('label', { class: 'sr', for: 'rt', text: 'Até' }), to);
        var status = h('select', { id: 'rs', 'aria-label': 'Status' }, [['', 'Todos os status'], ['novo', 'Novos'], ['contatado', 'Contatados'], ['matriculado', 'Matriculados'], ['arquivado', 'Arquivados']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        var origin = h('select', { id: 'ro', 'aria-label': 'Origem' }, [['', 'Todas as origens'], ['m_pre', 'Pré-cadastros'], ['m_contato', 'Contato']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
        var area = h('div', { class: 'report', id: 'reportArea' });
        var rowsNow = [], label = '';
        view.appendChild(h('div', { class: 'bar report__controls' }, period, dates, status, origin, h('span', { class: 'spacer' }),
            h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Exportar CSV', onclick: function () { csvFile(rowsNow, 'relatorio-itep-' + ymd(new Date()) + '.csv'); } }),
            h('button', { type: 'button', class: 'btn btn--primary btn--sm', text: 'Imprimir / salvar PDF', onclick: function () { window.print(); } })));
        view.appendChild(area);

        function range() {
            var p = period.value, t = startOf(now), a = null, b = null, txt;
            if (p === '7' || p === '30' || p === '90') { a = new Date(t - (+p - 1) * DAY); b = t; txt = 'Últimos ' + p + ' dias'; }
            else if (p === 'mes') { a = new Date(t.getFullYear(), t.getMonth(), 1); b = t; txt = 'Este mês'; }
            else if (p === 'custom') { a = from.value ? new Date(from.value + 'T00:00:00') : null; b = to.value ? new Date(to.value + 'T00:00:00') : null; txt = 'Personalizado'; }
            else txt = 'Todo o período';
            var span = a && b ? pt(a) + ' a ' + pt(b) : (p === 'tudo' ? 'desde a primeira mensagem' : '');
            return { a: a, b: b, label: txt + (span ? ' (' + span + ')' : '') };
        }
        function count(rows, key) { return countBy(rows, key); }
        function bars(title, rows, max) {
            var card = h('div', { class: 'card' }, h('h2', { text: title }));
            if (!rows.length) { card.appendChild(h('p', { class: 'empty', text: 'Sem dados neste período.' })); return card; }
            var top = rows.slice(0, max), peak = top[0][1], ul = h('ul', { class: 'bars' });
            top.forEach(function (r) { var fill = h('i'); fill.style.width = Math.max(4, Math.round(r[1] / peak * 100)) + '%'; ul.appendChild(h('li', null, h('span', { class: 'bars__l', text: r[0] }), h('span', { class: 'bars__t' }, fill), h('b', { text: String(r[1]) }))); });
            card.appendChild(ul); return card;
        }
        function chart(rows, a, b) {
            var card = h('div', { class: 'card' }, h('h2', { text: 'Mensagens por ' }));
            if (!rows.length) { card.querySelector('h2').textContent = 'Mensagens por dia'; card.appendChild(h('p', { class: 'empty', text: 'Sem mensagens neste período.' })); return card; }
            var first = a || startOf(new Date(Math.min.apply(null, rows.map(function (l) { return +new Date(l.ts); })))), last = b || startOf(now);
            var days = Math.round((last - first) / DAY) + 1, weekly = days > 62, buckets = [], i;
            var step = weekly ? 7 : 1, n = Math.ceil(days / step);
            for (i = 0; i < n; i++) buckets.push({ d: new Date(+first + i * step * DAY), n: 0 });
            rows.forEach(function (l) { var d = startOf(new Date(l.ts)); var k = Math.floor((d - first) / DAY / step); if (k >= 0 && k < n) buckets[k].n++; });
            card.querySelector('h2').textContent = 'Mensagens por ' + (weekly ? 'semana' : 'dia');
            var W = 640, H = 170, pad = 26, peak = Math.max.apply(null, buckets.map(function (x) { return x.n; })) || 1, bw = (W - pad * 2) / n;
            var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'chart'); svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', 'Gráfico de mensagens por ' + (weekly ? 'semana' : 'dia') + ', pico de ' + peak);
            function node(tag, attrs, text) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text != null) e.textContent = text; return e; }
            svg.appendChild(node('line', { x1: pad, y1: H - 22, x2: W - pad, y2: H - 22, stroke: '#DCE5DF' }));
            buckets.forEach(function (x, k) {
                var bh = Math.round((H - 52) * x.n / peak), bx = pad + k * bw;
                var r = node('rect', { x: bx + Math.max(1, bw * 0.12), y: H - 22 - bh, width: Math.max(2, bw * 0.76), height: Math.max(x.n ? 2 : 0, bh), rx: 3, fill: x.n ? '#16783A' : '#E3F3E8' });
                r.appendChild(node('title', {}, pt(x.d) + (weekly ? ' (semana)' : '') + ': ' + x.n)); svg.appendChild(r);
                if (x.n && bw > 14) svg.appendChild(node('text', { x: bx + bw / 2, y: H - 26 - bh, 'text-anchor': 'middle', 'font-size': 10, fill: '#0E1D14' }, String(x.n)));
            });
            svg.appendChild(node('text', { x: pad, y: H - 6, 'font-size': 10, fill: '#4A5C51' }, pt(buckets[0].d)));
            svg.appendChild(node('text', { x: W - pad, y: H - 6, 'text-anchor': 'end', 'font-size': 10, fill: '#4A5C51' }, pt(buckets[n - 1].d)));
            card.appendChild(svg); return card;
        }

        function draw() {
            dates.hidden = period.value !== 'custom';
            var r = range();
            var rows = leads.filter(function (l) {
                var d = startOf(new Date(l.ts));
                return (!r.a || d >= r.a) && (!r.b || d <= r.b) && (!status.value || l.status === status.value) && (!origin.value || leadKind(l) === origin.value);
            });
            rowsNow = rows; label = r.label;
            var by = { novo: 0, contatado: 0, matriculado: 0, arquivado: 0 }; rows.forEach(function (l) { by[l.status] = (by[l.status] || 0) + 1; });
            var total = rows.length, rate = total ? Math.round(by.matriculado / total * 1000) / 10 : 0;
            var daysN = r.a && r.b ? Math.round((r.b - r.a) / DAY) + 1 : (total ? Math.max(1, Math.round((startOf(now) - startOf(new Date(Math.min.apply(null, rows.map(function (l) { return +new Date(l.ts); }))))) / DAY) + 1) : 1);
            var avg = total ? (Math.round(total / daysN * 10) / 10).toLocaleString('pt-BR') : '0';
            area.textContent = '';
            area.appendChild(h('header', { class: 'report__head' },
                h('div', null, h('p', { class: 'report__kicker', text: 'ITEP · Trilhas do Futuro' }), h('h2', { text: 'Relatório de mensagens recebidas' }), h('p', { class: 'report__period', text: label + (status.value ? ' · status: ' + status.options[status.selectedIndex].text.toLowerCase() : '') })),
                h('p', { class: 'report__gen', text: 'Gerado em ' + now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) })));
            function stat(n, t, cls) { return h('div', { class: 'stat' + (cls ? ' ' + cls : '') }, h('strong', { text: String(n) }), h('span', { text: t })); }
            area.appendChild(h('div', { class: 'stats stats--6' }, stat(total, 'Mensagens no período'), stat(by.novo, 'Novas', 'stat--hot'), stat(by.contatado, 'Contatadas'), stat(by.matriculado, 'Matriculadas'), stat(rate.toLocaleString('pt-BR') + '%', 'Taxa de matrícula'), stat(avg, 'Média por dia')));
            if (!total) { area.appendChild(h('p', { class: 'empty', style: 'margin-top:18px', text: leads.length ? 'Nenhuma mensagem neste período. Tente outro intervalo.' : 'Nenhuma mensagem recebida ainda. Elas chegam aqui pelos formulários do site.' })); return; }
            area.appendChild(h('div', { style: 'margin-top:18px' }, chart(rows, r.a, r.b)));
            area.appendChild(h('div', { class: 'two' }, bars('Cursos mais procurados', count(rows, 'course'), 10), bars('Cidades mais procuradas', count(rows, 'city'), 10)));
            area.appendChild(h('div', { class: 'two' }, bars('Por situação', [['Novas', by.novo], ['Contatadas', by.contatado], ['Matriculadas', by.matriculado], ['Arquivadas', by.arquivado]].filter(function (x) { return x[1]; }).sort(function (x, y) { return y[1] - x[1]; }), 4), bars('Página de origem', count(rows, 'source'), 6)));
            var LIM = 200, tbl = h('table', { class: 'tbl' }, h('thead', null, h('tr', null, ['Data', 'Nome', 'Cidade', 'Curso', 'Status'].map(function (t) { return h('th', { scope: 'col', text: t }); }))), h('tbody', null, rows.slice(0, LIM).map(function (l) { return h('tr', null, h('td', { text: fdate(l.ts) }), h('td', { text: l.name }), h('td', { text: l.city || '—' }), h('td', { text: l.course || '—' }), h('td', { text: l.status })); })));
            area.appendChild(h('div', { class: 'card', style: 'margin-top:18px' }, h('h2', { text: 'Mensagens do período' }), h('div', { class: 'tbl-wrap' }, tbl), rows.length > LIM ? h('p', { class: 'hint', text: 'Mostrando as ' + LIM + ' mais recentes de ' + rows.length + '. Exporte o CSV para a lista completa.' }) : null));
        }
        [period, from, to, status, origin].forEach(function (e) { e.addEventListener('change', draw); });
        draw();
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
                        h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Excluir', onclick: safe(function () { return confirmAsk('Excluir o artigo "' + p.title + '"? Isso não pode ser desfeito.', { title: 'Excluir artigo', confirmLabel: 'Excluir', danger: true }).then(function (ok) { if (!ok) return; return api('DELETE', '/api/admin/posts/' + p.id).then(function () { data.posts = data.posts.filter(function (x) { return x.id !== p.id; }); listView(); toast('Artigo excluído.'); }); }); }) }))));
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
            title.classList.add('title-input'); title.setAttribute('placeholder', 'Título do artigo');
            var counter = h('p', { class: 'hint', 'aria-live': 'polite' });
            function recount() {
                var words = text.value.split(String.fromCharCode(10)).join(' ').split(' ').filter(Boolean).length;
                counter.textContent = words + (words === 1 ? ' palavra' : ' palavras') + (words ? ' · leitura de ~' + Math.max(1, Math.round(words / 200)) + ' min' : '');
            }
            text.addEventListener('input', recount); text.setAttribute('rows', '20'); recount();
            var saveBtn = h('button', { type: 'submit', class: 'btn btn--primary', text: 'Salvar artigo' });
            var form = h('form', { class: 'editor', novalidate: true },
                h('div', { class: 'editor__main' },
                    h('div', { class: 'card form' },
                        field('Título', title),
                        h('div', null, h('label', { for: 'px', text: 'Texto' }), text, counter, h('p', { class: 'hint', text: 'Separe os parágrafos com uma linha em branco.' })))),
                h('div', { class: 'editor__side' },
                    h('div', { class: 'card form' }, h('h2', { text: 'Publicação' }),
                        h('label', { class: 'switch' }, pub, ' Publicado (visível no site)'),
                        h('div', { class: 'form__foot' }, saveBtn, h('button', { type: 'button', class: 'btn btn--line', text: 'Cancelar', onclick: function () { $('#title').textContent = 'Blog'; listView(); } }))),
                    h('div', { class: 'card form' }, h('h2', { text: 'Imagem de capa' }), img.box),
                    h('div', { class: 'card form' }, h('h2', { text: 'Detalhes' }),
                        h('div', null, h('label', { for: 'pc', text: 'Tema' }), cat, dl),
                        field('Endereço do artigo (/blog/…)', slug, 'Gerado do título; só letras minúsculas, números e hífens.'),
                        field('Texto do botão final', ctext), field('Link do botão final', chref, 'Vazio = WhatsApp do ITEP.'))));
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
        var form = h('form', { class: 'card form sec__pass', novalidate: true },
            h('div', { class: 'sec__me' }, h('span', { class: 'avatar avatar--lg', 'aria-hidden': 'true', text: (meName || '?').charAt(0).toUpperCase() }), h('div', null, h('h2', { text: 'Minha senha' }), h('p', { class: 'hint', text: 'Você está logado como ' + meName + '.' }))),
            field('Senha atual', cur), field('Nova senha', n1, 'Mínimo de 10 caracteres, com letras e números.'), field('Repita a nova senha', n2), msg,
            h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Trocar senha' })));
        form.addEventListener('submit', function (e) {
            e.preventDefault(); msg.hidden = true;
            if (n1.value !== n2.value) { msg.className = 'msg msg--err'; msg.textContent = 'As senhas novas não conferem.'; msg.hidden = false; return; }
            api('POST', '/api/admin/password', { current: cur.value, next: n1.value })
                .then(function () { cur.value = n1.value = n2.value = ''; msg.className = 'msg msg--ok'; msg.textContent = 'Senha trocada com sucesso.'; msg.hidden = false; })
                .catch(function (x) { msg.className = 'msg msg--err'; msg.textContent = x.message; msg.hidden = false; });
        });
        view.appendChild(h('div', { class: 'sec' }, usersCard(), form));
    };

    /* --- usuários da área restrita (dentro de Segurança) --- */
    function usersCard() {
        function userRow(u) {
            var actions = h('div', { class: 'row__btns' });
            if (!u.me) {
                actions.appendChild(h('button', { type: 'button', class: 'btn btn--line btn--sm', text: 'Redefinir senha', onclick: safe(function () {
                    return askNewPassword(u.username).then(function (p) {
                        if (!p) return;
                        return api('POST', '/api/admin/users/' + u.id + '/password', { password: p }).then(function () { toast('Senha de ' + u.username + ' redefinida.'); });
                    });
                }) }));
                actions.appendChild(h('button', { type: 'button', class: 'btn btn--danger btn--sm', text: 'Remover', onclick: safe(function () {
                    return confirmAsk('Remover o usuário "' + u.username + '"? Ele perde o acesso na hora.', { title: 'Remover usuário', confirmLabel: 'Remover', danger: true }).then(function (ok) {
                        if (!ok) return;
                        return api('DELETE', '/api/admin/users/' + u.id).then(function () { toast('Usuário removido.'); return reload(); });
                    });
                }) }));
            }
            return h('div', { class: 'urow' + (u.me ? ' urow--me' : '') },
                h('span', { class: 'avatar', 'aria-hidden': 'true', text: u.username.charAt(0).toUpperCase() }),
                h('div', { class: 'urow__txt' }, h('strong', { text: u.username }), h('span', { text: u.createdAt ? 'Criado em ' + String(u.createdAt).slice(0, 10).split('-').reverse().join('/') : 'Administrador principal' })),
                u.me ? h('span', { class: 'pill', text: 'Você' }) : null,
                actions);
        }
        var list = h('div', { class: 'users' }, userRow({ username: meName || 'admin', me: true }));
        var uName = input('nu0', '', { autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', maxlength: '40', placeholder: 'ex.: maria.secretaria' });
        var uP1 = input('nu1', '', { type: 'password', autocomplete: 'new-password', minlength: '10' });
        var uP2 = input('nu2', '', { type: 'password', autocomplete: 'new-password', minlength: '10' });
        var msg = h('p', { class: 'msg', hidden: true, role: 'alert' });
        var form = h('form', { class: 'form users__form', novalidate: true },
            h('h3', { text: 'Adicionar usuário' }),
            field('Usuário', uName, '3 a 40 caracteres: letras, números, ponto, _ ou -.'), field('Senha', uP1, 'Mínimo de 10 caracteres, com letras e números.'), field('Repita a senha', uP2), msg,
            h('div', { class: 'form__foot' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Cadastrar usuário' })));
        function say(t, ok) { msg.className = 'msg ' + (ok ? 'msg--ok' : 'msg--err'); msg.textContent = t; msg.hidden = false; }
        function reload() {
            return api('GET', '/api/admin/users').then(function (r) {
                list.textContent = '';
                r.users.forEach(function (u) { list.appendChild(userRow(u)); });
            }).catch(function (e) { list.textContent = ''; list.appendChild(h('p', { class: 'msg msg--err', text: e.message })); });
        }
        form.addEventListener('submit', function (e) {
            e.preventDefault(); msg.hidden = true;
            if (uP1.value !== uP2.value) { say('As senhas não conferem.'); return; }
            api('POST', '/api/admin/users', { username: uName.value.trim(), password: uP1.value })
                .then(function () { uName.value = uP1.value = uP2.value = ''; say('Usuário cadastrado. Ele já pode entrar com o usuário e a senha definidos.', true); return reload(); })
                .catch(function (x) { say(x.message); });
        });
        reload();
        return h('section', { class: 'card sec__users' }, h('h2', { text: 'Quem tem acesso' }),
            h('p', { class: 'hint', style: 'margin-bottom:14px', text: 'Cada pessoa entra com o próprio usuário e senha e vê as mesmas mensagens e relatórios.' }), list, form);
    }

    /* ---------- início ---------- */
    pwWrap($('#pw'));
    api('GET', '/api/admin/me').then(function (r) { csrf = r.csrf; start(); }).catch(function () { showLogin(); });
})();
