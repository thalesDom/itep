/* ITEP v2 — comportamento comum das páginas internas */
(function () {
    'use strict';

    if (window.lucide) window.lucide.createIcons();

    var hd = document.getElementById('header');
    if (hd) {
        var onS = function () { hd.classList.toggle('is-scrolled', window.pageYOffset > 8); };
        window.addEventListener('scroll', onS, { passive: true });
        onS();
    }

    var desktop = window.matchMedia('(min-width: 1000px)');
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu');
    var subs = document.querySelectorAll('.has-sub');

    function setMenu(open) {
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });

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

    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        setMenu(false);
        subs.forEach(function (o) { o.classList.remove('is-open'); });
    });
    desktop.addEventListener('change', function () { setMenu(false); });
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.has-sub')) subs.forEach(function (o) { o.classList.remove('is-open'); });
    });

    /* acordeão dos grupos de cursos no menu do celular */
    (function () {
        var cols = document.querySelectorAll('.sub--wide .sub__col');
        cols.forEach(function (col) {
            var h = col.querySelector('h3'); if (!h) return;
            h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0'); h.setAttribute('aria-expanded', 'false');
            function toggle() {
                if (window.matchMedia('(min-width: 1000px)').matches) return;
                var open = !col.classList.contains('is-open');
                col.classList.toggle('is-open', open); h.setAttribute('aria-expanded', String(open));
            }
            h.addEventListener('click', toggle);
            h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        });
    })();
})();
