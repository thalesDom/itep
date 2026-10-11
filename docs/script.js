/* ITEP Home v2 */
(function () {
    'use strict';

    function waNumber() { return window.ITEP_WA || '5533998043901'; }
    var desktop = window.matchMedia('(min-width: 1000px)');

    document.querySelectorAll('.card').forEach(function (c) {
        var go = document.createElement('span');
        go.className = 'card__go';
        go.innerHTML = '<i data-lucide="arrow-up-right"></i>';
        c.appendChild(go);
    });

    if (window.lucide) window.lucide.createIcons();

    /* ---------- Hero slider ---------- */
    (function () {
        var hero = document.getElementById('hero');
        if (!hero) return;
        var slides = hero.querySelectorAll('.hslide');
        var bgs = hero.querySelectorAll('.hero__bg');
        var dots = hero.querySelectorAll('.hero__dot');
        var card = hero.querySelector('.search');
        var DELAY = 6500, idx = 0, timer = null, paused = false;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function size() { if (card) hero.style.setProperty('--sh', card.offsetHeight + 'px'); }
        size();
        window.addEventListener('resize', size);

        function go(i) {
            idx = (i + slides.length) % slides.length;
            slides.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); s.setAttribute('aria-hidden', String(k !== idx)); });
            bgs.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
            dots.forEach(function (d, k) { d.classList.toggle('is-active', k === idx); d.setAttribute('aria-selected', String(k === idx)); });
            restart();
        }
        function restart() {
            clearTimeout(timer);
            hero.classList.toggle('is-paused', paused || reduce);
            if (paused || reduce) return;
            // reinicia a barra de progresso
            dots.forEach(function (d) { var s = d.firstElementChild; s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; });
            timer = setTimeout(function () { go(idx + 1); }, DELAY);
        }
        document.getElementById('heroNext').addEventListener('click', function () { go(idx + 1); });
        document.getElementById('heroPrev').addEventListener('click', function () { go(idx - 1); });
        dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
        hero.addEventListener('mouseenter', function () { paused = true; restart(); });
        hero.addEventListener('mouseleave', function () { paused = false; restart(); });
        hero.addEventListener('focusin', function () { paused = true; restart(); });
        hero.addEventListener('focusout', function () { paused = false; restart(); });
        document.addEventListener('visibilitychange', function () { paused = document.hidden; restart(); });
        var sx = 0;
        hero.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].screenX; }, { passive: true });
        hero.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].screenX - sx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); }, { passive: true });
        restart();
    })();

    /* ---------- Cabeçalho: sombra ao rolar ---------- */
    (function () {
        var hd = document.getElementById('header');
        if (!hd) return;
        function on() { hd.classList.toggle('is-scrolled', window.pageYOffset > 8); }
        window.addEventListener('scroll', on, { passive: true });
        on();
    })();

    /* ---------- Menu ---------- */
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu');
    var subs = document.querySelectorAll('.has-sub');

    function setMenu(open) {
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () {
        setMenu(!menu.classList.contains('is-open'));
    });

    subs.forEach(function (item) {
        var btn = item.querySelector('.menu__link');
        btn.addEventListener('click', function () {
            var open = !item.classList.contains('is-open');
            subs.forEach(function (o) {
                o.classList.remove('is-open');
                o.querySelector('.menu__link').setAttribute('aria-expanded', 'false');
            });
            item.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
        });
    });

    menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        setMenu(false);
        subs.forEach(function (o) { o.classList.remove('is-open'); });
    });

    desktop.addEventListener('change', function () { setMenu(false); });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.has-sub')) {
            subs.forEach(function (o) { o.classList.remove('is-open'); });
        }
    });

    /* ---------- Filtro de cursos ---------- */
    var grid = document.getElementById('courseGrid');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var filters = document.querySelectorAll('.filter');

    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var f = btn.dataset.filter;
            filters.forEach(function (b) {
                var on = b === btn;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-selected', String(on));
            });
            cards.forEach(function (c) {
                c.classList.toggle('is-hidden', !(f === 'todos' || c.dataset.area === f));
            });
            grid.classList.toggle('is-filtered', f !== 'todos');
        });
    });

    /* ---------- Busca do hero: copia as opções do formulário e filtra os cursos pelo município ---------- */
    var CITY_COURSES = {"almenara":["comercio-exterior","gerencia-em-saude","logistica","mineracao","recursos-humanos","vigilancia-em-saude"],"aracuai":["analises-clinicas","contabilidade","design-de-interiores","enfermagem","farmacia","meio-ambiente","mineracao","radiologia","saude-bucal"],"cachoeira-pajeu":["enfermagem","gerencia-em-saude","marketing","meio-ambiente","mineracao","seguranca-do-trabalho"],"curral-de-dentro":["administracao","enfermagem","gerencia-em-saude","marketing"],"divisa-alegre":["administracao","contabilidade","geologia","marketing","meio-ambiente","mineracao","seguranca-do-trabalho"],"divisopolis":["administracao","agronegocio","farmacia","logistica","marketing","protese-dentaria","saude-bucal"],"itaobim":["enfermagem","farmacia","meio-ambiente","mineracao","saude-bucal","seguranca-do-trabalho"],"jordania":["administracao","enfermagem","gerencia-em-saude","marketing","mineracao"],"mata-verde":["administracao","enfermagem","gerencia-em-saude","marketing"],"medina":["enfermagem","farmacia","saude-bucal"],"pedra-azul":["administracao","enfermagem","farmacia","gerencia-em-saude","marketing","meio-ambiente","mineracao","saude-bucal","servicos-juridicos"],"rio-do-prado":["administracao","contabilidade","enfermagem","gerencia-em-saude","marketing"],"salto-da-divisa":["administracao","contabilidade","gerencia-em-saude","marketing"]};
    var sCity = document.getElementById('sCity');
    var sCourse = document.getElementById('sCourse');
    sCity.innerHTML = document.getElementById('city').innerHTML;
    sCourse.innerHTML = document.getElementById('course').innerHTML;
    sCity.options[0].text = 'Todos os municípios';
    sCourse.options[0].text = 'Todos os cursos';

    function filterCourses(cityEl, courseEl) {
        var allowed = CITY_COURSES[cityEl.value];
        if (window.ITEP_SITE && cityEl.value) {
            var nm = (cityEl.options[cityEl.selectedIndex].text || '').replace(/\s+-\s+MG$/, '');
            var hit = window.ITEP_SITE.cities.filter(function (c) { return c.name === nm; })[0];
            if (hit) allowed = hit.courses;
        }
        Array.prototype.forEach.call(courseEl.querySelectorAll('option'), function (o) {
            if (!o.value) return;
            var ok = !allowed || allowed.indexOf(o.value) !== -1;
            o.hidden = !ok;
            o.disabled = !ok;
        });
        Array.prototype.forEach.call(courseEl.querySelectorAll('optgroup'), function (g) {
            var any = Array.prototype.some.call(g.querySelectorAll('option'), function (o) { return !o.hidden; });
            g.hidden = !any;
            g.disabled = !any;
        });
        var cur = courseEl.options[courseEl.selectedIndex];
        if (cur && cur.disabled) courseEl.value = '';
    }
    sCity.addEventListener('change', function () { filterCourses(sCity, sCourse); });
    var fCity = document.getElementById('city');
    var fCourse = document.getElementById('course');
    fCity.addEventListener('change', function () { filterCourses(fCity, fCourse); });

    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var city = sCity.value ? sCity.options[sCity.selectedIndex].text : '';
        var course = sCourse.value ? sCourse.options[sCourse.selectedIndex].text : '';
        var nl = String.fromCharCode(10);
        var text = 'Olá! Quero me matricular no ITEP.' +
            (course ? nl + 'Curso: ' + course : '') +
            (city ? nl + 'Município: ' + city : '');
        window.open('https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });

    /* ---------- Contagem dos números (uma vez, ao aparecer) ---------- */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nums = document.querySelectorAll('.stats dd');
    if ('IntersectionObserver' in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                var el = en.target, txt = el.textContent;
                var end = parseInt(txt, 10), suffix = txt.replace(/[0-9]/g, ''), t0 = null;
                function step(t) {
                    if (!t0) t0 = t;
                    var p = Math.min((t - t0) / 1200, 1);
                    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }, { threshold: 0.6 });
        nums.forEach(function (n) { io.observe(n); });
    }

    /* ---------- Formulário (envia pelo WhatsApp) ---------- */
    var form = document.getElementById('contact-form');
    var errorBox = document.getElementById('formError');
    var phone = document.getElementById('phone');

    phone.addEventListener('input', function () {
        var d = phone.value.replace(/\D/g, '').slice(0, 11);
        if (d.length > 7) phone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        else if (d.length > 2) phone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
        else phone.value = d;
    });

    function validField(el) {
        var ok = true;
        if (el.type === 'checkbox') ok = el.checked;
        else if (el.required && !el.value.trim()) ok = false;
        else if (el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) ok = false;
        var box = el.closest('.field');
        if (box) box.classList.toggle('is-invalid', !ok);
        el.setAttribute('aria-invalid', String(!ok));
        return ok;
    }

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.addEventListener('blur', function () { validField(el); });
        el.addEventListener('input', function () {
            if (el.closest('.field') && el.closest('.field').classList.contains('is-invalid')) validField(el);
        });
    });

    function label(id) {
        var s = document.getElementById(id);
        return s.options[s.selectedIndex].text;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var all = Array.prototype.slice.call(form.querySelectorAll('[required]'));
        var bad = all.filter(function (el) { return !validField(el); });
        if (bad.length) {
            errorBox.hidden = false;
            bad[0].focus();
            return;
        }
        errorBox.hidden = true;

        var age = document.getElementById('age').value;
        var msg = document.getElementById('message').value.trim();
        var text = [
            'INTERESSE EM CURSO TÉCNICO - ITEP',
            '',
            'Dados do interessado:',
            '• Nome: ' + document.getElementById('name').value.trim(),
            '• E-mail: ' + document.getElementById('email').value.trim(),
            '• Telefone: ' + phone.value,
            age ? '• Idade: ' + age + ' anos' : '',
            '',
            'Cidade: ' + label('city'),
            'Curso de interesse: ' + label('course'),
            msg ? '\nMensagem:\n' + msg : '',
            '',
            '---',
            'Enviado pelo site do ITEP'
        ].filter(function (l, i, a) { return !(l === '' && a[i - 1] === ''); }).join('\n');

        window.open('https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        form.reset();
    });
})();
