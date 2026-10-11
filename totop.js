/* ITEP — botão "voltar ao topo" com anel de progresso de rolagem (autônomo: injeta o próprio CSS) */
(function () {
    'use strict';

    var css = '' +
        '.totop{position:fixed;z-index:95;right:16px;bottom:86px;width:52px;height:52px;display:grid;place-items:center;border:0;padding:0;cursor:pointer;border-radius:50%;' +
        'background:#fff;color:#0F3D22;box-shadow:0 14px 28px -10px rgba(7,40,20,.55);opacity:0;visibility:hidden;transform:translateY(14px) scale(.9);' +
        'transition:opacity .3s,transform .3s cubic-bezier(.34,1.56,.64,1),visibility .3s,background-color .2s,color .2s}' +
        '.totop.is-on{opacity:1;visibility:visible;transform:none}' +
        '.totop:hover{background:#0F3D22;color:#FFC21A;transform:translateY(-3px)}' +
        '.totop:focus-visible{outline:3px solid #FFC21A;outline-offset:3px}' +
        '.totop svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}' +
        '.totop .tt-track{fill:none;stroke:#E3F3E8;stroke-width:3}' +
        '.totop .tt-bar{fill:none;stroke:#1B8F45;stroke-width:3;stroke-linecap:round;transition:stroke .2s}' +
        '.totop:hover .tt-track{stroke:rgba(255,255,255,.2)}' +
        '.totop:hover .tt-bar{stroke:#FFC21A}' +
        '.totop .tt-arrow{position:relative;width:22px;height:22px}' +
        '@media(min-width:700px){.totop{right:28px;bottom:104px;width:54px;height:54px}}' +
        '@media(max-width:699px){html.ck-open .totop{opacity:0;pointer-events:none}}' +
        '@media(prefers-reduced-motion:reduce){.totop{transition:none}}';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var R = 22, C = 2 * Math.PI * R;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'totop';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.innerHTML =
        '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="tt-track" cx="26" cy="26" r="' + R + '"/>' +
        '<circle class="tt-bar" cx="26" cy="26" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/></svg>' +
        '<svg class="tt-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="transform:none" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    var bar = btn.querySelector('.tt-bar');
    var ticking = false;

    function update() {
        var y = window.pageYOffset || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(y / max, 1) : 0;
        bar.style.strokeDashoffset = String(C * (1 - p));
        btn.classList.toggle('is-on', y > 400);
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);

    btn.addEventListener('click', function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        btn.blur();
    });

    update();
})();
