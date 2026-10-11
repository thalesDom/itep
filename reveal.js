/* ITEP — animações ao rolar a página (autônomo: injeta o próprio CSS).
   Respeita "reduzir movimento"; sem JavaScript o conteúdo aparece normalmente. */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    var css = '' +
        '.rv{opacity:0;transform:translateY(30px);transition:opacity .75s cubic-bezier(.2,.8,.2,1) var(--d,0s),transform .75s cubic-bezier(.2,.8,.2,1) var(--d,0s);will-change:opacity,transform}' +
        '.rv[data-rv="scale"]{transform:scale(.93) translateY(14px)}' +
        '.rv[data-rv="left"]{transform:translateX(-14px)}' +
        '.rv[data-rv="right"]{transform:translateX(14px)}' +
        '.rv[data-rv="mask"]{opacity:1;transform:none;clip-path:inset(0 100% 0 0 round 28px);transition:clip-path 1s cubic-bezier(.2,.8,.2,1) var(--d,0s)}' +
        '.rv.rv-in{opacity:1;transform:none;will-change:auto}' +
        '.rv[data-rv="mask"].rv-in{clip-path:inset(0 0 0 0 round 28px)}' +
        '.scrollbar-top{position:fixed;z-index:160;left:0;top:0;height:3px;width:100%;transform:scaleX(0);transform-origin:left;background:linear-gradient(90deg,#1B8F45,#FFC21A);pointer-events:none}' +
        '@media print{.rv{opacity:1!important;transform:none!important;clip-path:none!important}.scrollbar-top{display:none}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var mobile = window.matchMedia('(max-width: 699px)').matches;

    /* [seletor, tipo, escalonar?] — o primeiro da lista que casar define o tipo do elemento */
    var RULES = [
        ['.head > *, .pg-head > *, .blog__head > *', 'up', false],
        ['.trust__item', 'up', true],
        ['.courses .card', mobile ? null : 'scale', true],
        ['.steps__list .step', 'up', true],
        ['.steps__foot > *', 'up', false],
        ['.cities__list li', 'scale', true],
        ['.about__media', 'mask', false],
        ['.about__text > *', 'up', true],
        ['.purpose', 'scale', false],
        ['.purpose .values__grid li', 'left', true],
        ['.post', 'up', true],
        ['.bcard', 'up', true],
        ['.cta__card', 'scale', false],
        ['.contact__info > *, .contact__list li', 'up', true],
        ['.contact__form', 'right', false],
        ['.footer__top > *', 'up', true],
        /* páginas internas */
        ['.tile, .perk, .area, .fact, .polaroid-card, .ccard', 'up', true],
        ['.salary', 'scale', false],
        ['.timeline li', 'left', true],
        ['.where__list li', 'scale', true],
        ['.doc__body > h2', 'up', false],
        ['.ct-side, .ct-card, .faq-item', 'up', true]
    ];

    /* títulos: cada palavra sobe de dentro de uma máscara */
    document.querySelectorAll('.head h2, .pg-head h2, .blog__head h2, .about__text h2, .contact__info h2').forEach(function (h) {
        var n = 0;
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (c) {
                if (c.nodeType === 3) {
                    var parts = c.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
                    parts.forEach(function (p) {
                        if (!p) return;
                        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var w = document.createElement('span'), i = document.createElement('span');
                        w.className = 'w'; i.textContent = p; i.style.setProperty('--i', n++); w.appendChild(i); frag.appendChild(w);
                    });
                    c.parentNode.replaceChild(frag, c);
                } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c);
            });
        })(h);
    });

    var seen = new Set(), items = [];
    RULES.forEach(function (r) {
        if (!r[1]) return;
        var parents = new Map();
        document.querySelectorAll(r[0]).forEach(function (el) {
            if (seen.has(el) || el.closest('#preview, .menu, .sub, .header, dialog')) return;
            seen.add(el);
            var p = el.parentNode, n = parents.get(p) || 0;
            parents.set(p, n + 1);
            el.classList.add('rv');
            el.setAttribute('data-rv', r[1]);
            if (r[2]) el.style.setProperty('--d', (Math.min(n, 7) * 0.08).toFixed(2) + 's');
            items.push(el);
        });
    });

    document.querySelectorAll('.w').forEach(function (w) { var h = w.closest('h2'); if (h && !h.classList.contains('rv')) w.classList.add('is-in'); });

    /* passo a passo: linha que se desenha e círculos que surgem em sequência */
    var stepsList = document.querySelector('.steps__list');
    if (stepsList) {
        stepsList.classList.add('rv-ready');
        stepsList.querySelectorAll('.step').forEach(function (st, k) { st.style.setProperty('--d', (k * 0.5 + 0.35).toFixed(2) + 's'); });
    }
    function liveSteps() { if (stepsList && !stepsList.classList.contains('is-live')) stepsList.classList.add('is-live'); }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('rv-in');
            io.unobserve(e.target);
        });
    }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
    items.forEach(function (el) { io.observe(el); });
    if (stepsList) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { liveSteps(); o.disconnect(); } }, { threshold: 0.25 }).observe(stepsList);

    /* varredura determinística: tudo que já entrou na tela aparece (cobre o fim da página e itens aninhados) */
    var sweepQueued = false;
    function sweep() {
        sweepQueued = false;
        var vh = window.innerHeight;
        if (stepsList) { var sr = stepsList.getBoundingClientRect(); if (sr.top < vh * 0.7) liveSteps(); }
        items.forEach(function (el) {
            if (el.classList.contains('rv-in')) return;
            var r = el.getBoundingClientRect();
            if (r.height > 0 && r.top < vh * 0.98) { el.classList.add('rv-in'); io.unobserve(el); }
        });
    }
    function queueSweep() { if (!sweepQueued) { sweepQueued = true; requestAnimationFrame(sweep); } }
    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep);
    window.addEventListener('load', queueSweep);
    queueSweep();

    /* rede de segurança: nada fica invisível se algo falhar */
    setTimeout(function () {
        items.forEach(function (el) {
            if (el.classList.contains('rv-in')) return;
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 1.5) el.classList.add('rv-in');
        });
        if (stepsList && stepsList.getBoundingClientRect().top < window.innerHeight * 1.2) liveSteps();
    }, 3500);

    /* barra de progresso de leitura no topo */
    var bar = document.createElement('div');
    bar.className = 'scrollbar-top';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0) + ')';
        ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
