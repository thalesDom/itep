/* ITEP — aplica no site o conteúdo vindo do painel (PHP + MySQL).
   Se a API não responder (ex.: hospedagem só de arquivos), o site continua com o conteúdo já presente no HTML. */
(function () {
    'use strict';

    var OLD = { wa: '5533998043901', label: '(33) 9 9804-3901', mail: 'diretoriaitep@itepminasgerais.com.br', hours: 'Seg a sex, 8h às 18h' };
    var SITE = null;

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function icon(name) { var i = document.createElement('i'); i.setAttribute('data-lucide', name); return i; }
    function icons() { if (window.lucide) window.lucide.createIcons(); }
    function byKey(k) { return SITE.courses.filter(function (c) { return c.key === k; })[0]; }
    function areaShort(k) { var a = SITE.areas[k]; return a ? (a.short || a.label) : ''; }
    function safeUrl(u) { return /^https?:\/\//i.test(u) || /^\/[A-Za-z0-9\-._\/~#?=&%]*$/.test(u) ? u : '#'; }

    /* ---------- texto/links globais ---------- */
    function textNodes(root, fn) {
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode && n.parentNode.nodeName; return (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' || p === 'OPTION') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
        var list = []; while (w.nextNode()) list.push(w.currentNode);
        list.forEach(fn);
    }
    function applyContact(c, waOverride) {
        var wa = waOverride || c.whatsapp;
        window.ITEP_WA = wa;
        document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) {
            var h = a.getAttribute('href');
            [OLD.wa, c.whatsapp].forEach(function (n) { if (n && h.indexOf('https://wa.me/' + n) === 0) a.setAttribute('href', h.replace(n, wa)); });
        });
        if (waOverride) return; // número da unidade: só os links; o texto continua o do ITEP
        if (c.whatsappLabel && c.whatsappLabel !== OLD.label) textNodes(document.body, function (n) { if (n.nodeValue.indexOf(OLD.label) !== -1) n.nodeValue = n.nodeValue.split(OLD.label).join(c.whatsappLabel); });
        if (c.email && c.email !== OLD.mail) {
            document.querySelectorAll('a[href^="mailto:' + OLD.mail + '"]').forEach(function (a) { a.setAttribute('href', 'mailto:' + c.email); });
            textNodes(document.body, function (n) { if (n.nodeValue.indexOf(OLD.mail) !== -1) n.nodeValue = n.nodeValue.split(OLD.mail).join(c.email); });
        }
        if (c.hours && c.hours !== OLD.hours) {
            textNodes(document.body, function (n) {
                var v = n.nodeValue;
                if (v.indexOf(OLD.hours) !== -1) n.nodeValue = v.split(OLD.hours).join(c.hours);
                else if (v.trim() === 'Segunda a sexta, das 8h às 18h') n.nodeValue = v.replace('Segunda a sexta, das 8h às 18h', c.hours);
                else if (v.trim() === 'Atendimento de segunda a sexta, das 8h às 18h') n.nodeValue = v.replace('Atendimento de segunda a sexta, das 8h às 18h', 'Atendimento: ' + c.hours);
            });
        }
        var soc = { Instagram: c.instagram, Facebook: c.facebook };
        Object.keys(soc).forEach(function (k) {
            if (!soc[k] || !/^https?:\/\//i.test(soc[k])) return;
            document.querySelectorAll('.footer__social a[aria-label="' + k + '"], .social-icons a[aria-label="' + k + '"]').forEach(function (a) { a.setAttribute('href', soc[k]); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
        });
    }

    /* ---------- cards ---------- */
    function courseCard(c) {
        var a = el('a', 'card'); a.href = '/' + encodeURI(c.dir) + '/index.html'; a.setAttribute('data-area', c.area);
        var im = el('div', 'card__img'); var img = document.createElement('img'); img.loading = 'lazy'; img.alt = 'Técnico em ' + c.name; img.src = c.img; im.appendChild(img);
        var body = el('div', 'card__body'); body.appendChild(el('span', 'card__area', areaShort(c.area))); body.appendChild(el('h3', null, c.name));
        var meta = el('p', 'card__meta'); var s = el('span'); s.appendChild(icon('badge-check')); s.appendChild(document.createTextNode(' Gratuito')); meta.appendChild(s); body.appendChild(meta);
        var go = el('span', 'card__go'); go.appendChild(icon('arrow-up-right'));
        a.appendChild(im); a.appendChild(body); a.appendChild(go);
        return a;
    }
    function postUrl(p) { return '/blog/' + p.slug + '/'; }
    function postCard(p) {
        var a = el('a', 'bcard'); a.href = postUrl(p); a.setAttribute('data-cat', p.cat);
        var im = el('span', 'bcard__img'); if (p.img) { var i = document.createElement('img'); i.loading = 'lazy'; i.alt = ''; i.src = p.img; im.appendChild(i); }
        var b = el('span', 'bcard__body'); b.appendChild(el('span', 'post__cat', p.cat)); b.appendChild(el('span', 'bcard__title', p.title));
        var t = p.text[0] || ''; b.appendChild(el('span', 'bcard__ex', t.length > 140 ? t.slice(0, 140).replace(/\s+\S*$/, '') + '…' : t));
        var m = el('span', 'post__more', 'Ler artigo '); m.appendChild(icon('arrow-right')); b.appendChild(m);
        a.appendChild(im); a.appendChild(b); return a;
    }

    /* ---------- home ---------- */
    function applyHome() {
        var grid = document.getElementById('courseGrid');
        if (grid) grid.querySelectorAll('.card').forEach(function (card) {
            var dir = decodeURI(card.getAttribute('href')).split('/')[1];
            var c = SITE.courses.filter(function (x) { return x.dir === dir; })[0];
            var im = card.querySelector('img'); if (c && im && c.img && im.getAttribute('src') !== c.img) im.src = c.img;
        });
        var bg = document.querySelector('#blog .blog__grid');
        if (bg && SITE.posts.length) {
            bg.textContent = '';
            var f = SITE.posts[0];
            var feat = el('a', 'post post--feat'); feat.href = postUrl(f);
            if (f.img) { var fi = document.createElement('img'); fi.alt = ''; fi.loading = 'lazy'; fi.src = f.img; feat.appendChild(fi); }
            feat.appendChild(el('span', 'post__shade'));
            var fc = el('span', 'post__content'); fc.appendChild(el('span', 'post__cat', f.cat)); fc.appendChild(el('span', 'post__title', f.title));
            var ft = f.text[0] || ''; fc.appendChild(el('span', 'post__excerpt', ft.length > 130 ? ft.slice(0, 130).replace(/\s+\S*$/, '') + '…' : ft));
            var fm = el('span', 'post__more', 'Ler artigo '); fm.appendChild(icon('arrow-right')); fc.appendChild(fm); feat.appendChild(fc); bg.appendChild(feat);
            SITE.posts.slice(1, 4).forEach(function (p) {
                var r = el('a', 'post post--row'); r.href = postUrl(p);
                var th = el('span', 'post__thumb'); if (p.img) { var ti = document.createElement('img'); ti.alt = ''; ti.loading = 'lazy'; ti.src = p.img; th.appendChild(ti); }
                var tx = el('span', 'post__text'); tx.appendChild(el('span', 'post__cat', p.cat)); tx.appendChild(el('span', 'post__title', p.title));
                var m = el('span', 'post__more', 'Ler artigo '); m.appendChild(icon('arrow-right')); tx.appendChild(m);
                r.appendChild(th); r.appendChild(tx); bg.appendChild(r);
            });
        }
        if (bg && !SITE.posts.length) { var sec = document.getElementById('blog'); if (sec) sec.hidden = true; }
    }

    /* ---------- cidade ---------- */
    function applyCity(dir) {
        var city = SITE.cities.filter(function (c) { return c.dir === dir; })[0]; if (!city) return;
        if (city.phone) applyContact(SITE.contact, city.phone);
        document.querySelectorAll('.facts__bar--4 .fact').forEach(function (f) {
            var s = f.querySelector('span'), st = f.querySelector('strong');
            if (s && st && s.textContent.trim() === 'Endereço' && city.address) st.textContent = city.address;
        });
        var iframe = document.querySelector('.pg-hero__map iframe');
        if (iframe && city.mapQuery) iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent(city.mapQuery) + '&output=embed';
        var n = city.courses.length;
        var grid = document.querySelector('#cursos .grid--city');
        if (grid) { grid.textContent = ''; city.courses.map(byKey).filter(Boolean).forEach(function (c) { grid.appendChild(courseCard(c)); }); }
        var h2 = document.querySelector('#cursos .pg-head h2'); if (h2) h2.textContent = n + (n === 1 ? ' curso técnico' : ' cursos técnicos') + ' em ' + city.name;
        var lead = document.querySelector('.pg-hero__lead'); if (lead) lead.textContent = n + (n === 1 ? ' curso técnico gratuito' : ' cursos técnicos gratuitos') + ' em ' + city.name + ', Minas Gerais. Fale com a equipe e garanta sua vaga.';
        var eb = document.querySelector('#cursos .pg-head .eyebrow'); if (eb) eb.textContent = 'Cursos em ' + city.name;
        var soc = document.querySelector('.unit-social');
        var links = [['facebook', 'Facebook do ITEP', city.facebook], ['instagram', 'Instagram do ITEP', city.instagram]].filter(function (x) { return /^https?:\/\//i.test(x[2]); });
        if (!soc && links.length && grid) { soc = el('p', 'unit-social'); grid.parentNode.appendChild(soc); }
        if (soc) { soc.textContent = ''; links.forEach(function (x) { var a = el('a', 'btn btn--line'); a.href = x[2]; a.target = '_blank'; a.rel = 'noopener'; a.appendChild(icon(x[0])); a.appendChild(document.createTextNode(' ' + x[1])); soc.appendChild(a); soc.appendChild(document.createTextNode(' ')); }); }
        icons();
    }

    /* ---------- curso ---------- */
    function applyCourse(key) {
        var c = byKey(key); if (!c) return;
        var lead = document.querySelector('.pg-hero__lead'); if (lead) lead.textContent = c.obj;
        var call = document.querySelector('.callout');
        if (call) { var ps = call.querySelectorAll('p'); if (ps[0]) ps[0].textContent = c.obj; if (c.obj1) { if (ps[1]) ps[1].textContent = c.obj1; else { var p2 = el('p', null, c.obj1); call.appendChild(p2); } } else if (ps[1]) ps[1].remove(); }
        var im = document.querySelector('.pg-hero__media img'); if (im && c.img) im.src = c.img;
        var cities = SITE.cities.filter(function (x) { return x.courses.indexOf(key) !== -1; });
        var list = document.querySelector('.where .where__list, .where .where__none');
        var h2 = document.querySelector('.where .pg-head h2');
        if (h2) h2.textContent = cities.length ? 'Técnico em ' + c.name + ' em ' + cities.length + (cities.length === 1 ? ' município' : ' municípios') : 'Técnico em ' + c.name;
        if (list) {
            var nu;
            if (cities.length) { nu = el('ul', 'where__list'); cities.forEach(function (ct) { var li = el('li'); var a = el('a'); a.href = '/' + encodeURI(ct.dir) + '/index.html'; a.appendChild(icon('map-pin')); a.appendChild(document.createTextNode(' ' + ct.name)); li.appendChild(a); nu.appendChild(li); }); }
            else { nu = el('p', 'where__none', 'A disponibilidade deste curso por município deve ser confirmada com a equipe. '); var a2 = el('a', null, 'Perguntar pelo WhatsApp'); a2.href = 'https://wa.me/' + SITE.contact.whatsapp; a2.target = '_blank'; a2.rel = 'noopener'; nu.appendChild(a2); }
            list.parentNode.replaceChild(nu, list);
        }
        document.querySelectorAll('.facts__bar .fact').forEach(function (f) {
            var s = f.querySelector('span'), st = f.querySelector('strong');
            if (s && st && s.textContent.trim() === 'Onde cursar') st.textContent = !cities.length ? 'Consulte a equipe' : (cities.length === 1 ? cities[0].name : cities.length + ' municípios');
        });
        icons();
    }

    /* ---------- blog ---------- */
    function applyBlogList() {
        var grid = document.getElementById('blogGrid'); if (!grid) return;
        grid.textContent = ''; SITE.posts.forEach(function (p) { grid.appendChild(postCard(p)); });
        var bar = document.getElementById('blogFilters');
        if (bar) {
            bar.textContent = '';
            var cats = []; SITE.posts.forEach(function (p) { if (cats.indexOf(p.cat) === -1) cats.push(p.cat); });
            function btn(label, cat, n, active) { var b = el('button', 'filter' + (active ? ' is-active' : '')); b.type = 'button'; b.setAttribute('data-cat', cat); b.appendChild(document.createTextNode(label + ' ')); b.appendChild(el('span', 'filter__n', String(n))); return b; }
            bar.appendChild(btn('Todos', 'todos', SITE.posts.length, true));
            cats.forEach(function (c) { bar.appendChild(btn(c, c, SITE.posts.filter(function (p) { return p.cat === c; }).length, false)); });
        }
        var empty = document.getElementById('blogEmpty'); if (empty) { empty.hidden = SITE.posts.length > 0; empty.textContent = 'Nenhum artigo publicado ainda.'; }
        icons();
    }
    function applyArticle(slug) {
        var p = SITE.posts.filter(function (x) { return x.slug === slug; })[0];
        var main = document.getElementById('conteudo');
        if (!p) {
            if (main) {
                main.textContent = '';
                var s = el('section', 'pg-section'); var w = el('div', 'wrap'); w.style.textAlign = 'center';
                w.appendChild(el('h1', null, 'Artigo indisponível')); var pp = el('p', null, 'Este artigo não está mais publicado.'); pp.style.margin = '16px 0 24px'; w.appendChild(pp);
                var a = el('a', 'btn btn--green btn--lg', 'Ver todos os artigos'); a.href = '/blog/index.html'; w.appendChild(a); s.appendChild(w); main.appendChild(s);
                document.title = 'Artigo indisponível | ITEP'; var nr = document.createElement('meta'); nr.name = 'robots'; nr.content = 'noindex'; document.head.appendChild(nr);
            }
            return;
        }
        document.title = p.title + ' | Blog ITEP';
        /* SEO do artigo (o modelo é um só; título, descrição, canônico e dados estruturados vêm do banco) */
        (function () {
            var base = 'https://itepminasgerais.com.br', url = base + '/blog/' + encodeURIComponent(p.slug || slug) + '/';
            var d = String((p.text && p.text[0]) || p.title).replace(/\s+/g, ' ').trim(); if (d.length > 155) d = d.slice(0, 152).replace(/\s+\S*$/, '') + '...';
            var img = /^https?:\/\//i.test(p.img || '') ? p.img : (p.img ? base + p.img : base + '/img/og-itep.jpg');
            function put(tag, key, val, content) {
                var e = document.head.querySelector(tag + '[' + key + '="' + val + '"]');
                if (!e) { e = document.createElement(tag); e.setAttribute(key, val); document.head.appendChild(e); }
                e.setAttribute(tag === 'link' ? 'href' : 'content', content);
            }
            put('meta', 'name', 'description', d);
            put('link', 'rel', 'canonical', url);
            put('meta', 'property', 'og:type', 'article'); put('meta', 'property', 'og:title', p.title + ' | Blog ITEP'); put('meta', 'property', 'og:description', d);
            put('meta', 'property', 'og:url', url); put('meta', 'property', 'og:image', img);
            put('meta', 'name', 'twitter:title', p.title + ' | Blog ITEP'); put('meta', 'name', 'twitter:description', d); put('meta', 'name', 'twitter:image', img);
            var ld = document.getElementById('seo-ld') || document.head.appendChild(document.createElement('script')); ld.id = 'seo-ld'; ld.type = 'application/ld+json';
            var org = { '@type': 'EducationalOrganization', name: 'ITEP – Instituto Técnico Educacional Polivalente', url: base + '/' };
            ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: d, image: img, url: url, mainEntityOfPage: url, inLanguage: 'pt-BR', author: org, publisher: org });
        })();
        var h1 = document.querySelector('.pg-hero h1'); if (h1) h1.textContent = p.title;
        var tag = document.querySelector('.pg-hero .pg-tag'); if (tag) { tag.textContent = ''; tag.appendChild(icon('newspaper')); tag.appendChild(document.createTextNode(' ' + p.cat)); }
        var cur = document.querySelector('.crumbs [aria-current]'); if (cur) cur.textContent = p.cat;
        var im = document.querySelector('.art__img'); if (im) { if (p.img) { im.src = p.img; im.hidden = false; } else im.hidden = true; }
        var body = document.querySelector('.art__body');
        if (body) {
            var cta = body.querySelector('.art__cta'); body.textContent = '';
            p.text.forEach(function (t) { body.appendChild(el('p', null, t)); });
            var box = el('div', 'art__cta');
            var b1 = el('a', 'btn btn--green btn--lg', p.ctaText || 'Falar com o ITEP'); b1.href = safeUrl(p.ctaHref); if (/^https?:/i.test(p.ctaHref)) { b1.target = '_blank'; b1.rel = 'noopener'; }
            var b2 = el('a', 'btn btn--line btn--lg', 'Tirar dúvidas no WhatsApp'); b2.href = 'https://wa.me/' + SITE.contact.whatsapp; b2.target = '_blank'; b2.rel = 'noopener';
            box.appendChild(b1); box.appendChild(b2); body.appendChild(box);
        }
        var others = SITE.posts.filter(function (x) { return x.slug !== slug; }).slice(0, 3);
        var og = document.querySelector('.pg-section--alt .bgrid');
        if (og) { og.textContent = ''; others.forEach(function (x) { og.appendChild(postCard(x)); }); var sec = og.closest('section'); if (sec) sec.hidden = !others.length; }
        document.querySelectorAll('[data-artigo-hide]').forEach(function (n) { n.hidden = false; });
        icons();
    }

    /* ---------- início ---------- */
    function run() {
        var b = document.body;
        applyContact(SITE.contact);
        if (b.dataset.city) applyCity(b.dataset.city);
        if (b.dataset.course) applyCourse(b.dataset.course);
        var m = location.pathname.match(/^\/blog\/([a-z0-9\-]+)\/?(?:index\.html)?$/);
        if (m && m[1] === 'artigo') { location.replace('/blog/'); return; }
        if (m) applyArticle(m[1]);
        if (/^\/blog\/(index\.html)?$/.test(location.pathname)) applyBlogList();
        if (document.getElementById('courseGrid') || document.getElementById('blog')) applyHome();
        window.ITEP_SITE = SITE;
        document.dispatchEvent(new CustomEvent('itep:site', { detail: SITE }));
    }
    fetch('/api/site', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
        if (!d || !d.courses) throw 0; SITE = d; run();
    }).catch(function () { /* sem API: mantém o conteúdo do HTML */ });
})();
