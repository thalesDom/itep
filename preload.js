/* ITEP — preloader premium. Aparece uma vez por sessão; autônomo (injeta o próprio CSS). */
(function () {
    'use strict';

    var KEY = 'itep-preload';
    try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, '1'); } catch (e) { /* segue sem lembrar */ }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var MIN = reduce ? 300 : 1900;   // tempo mínimo na tela
    var MAX = 4500;                  // nunca prende o visitante

    var css = '' +
        '.pl{position:fixed;inset:0;z-index:3000;display:grid;place-items:center;font-family:"Manrope","Inter",system-ui,sans-serif;color:#fff;overflow:hidden}' +
        '.pl__panel{position:absolute;left:0;right:0;height:50.5%;background:radial-gradient(70% 70% at 85% 0%,rgba(27,143,69,.55),transparent 60%),radial-gradient(60% 60% at 8% 100%,rgba(255,194,26,.14),transparent 60%),linear-gradient(170deg,#0F3D22,#072814);background-size:100% 198%;transition:transform .9s cubic-bezier(.76,0,.24,1)}'  +
        '.pl__panel--t{top:0;background-position:0 0}.pl__panel--b{bottom:0;background-position:0 100%}'  +
        '.pl__dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.1) 1.5px,transparent 1.6px);background-size:30px 30px;-webkit-mask-image:radial-gradient(circle at center,#000,transparent 70%);mask-image:radial-gradient(circle at center,#000,transparent 70%);transition:opacity .4s}' +
        '.pl__core{position:relative;z-index:2;display:grid;justify-items:center;gap:22px;padding:24px;text-align:center;transition:opacity .35s,transform .5s}' +
        '.pl__mark{position:relative;width:96px;height:96px;display:grid;place-items:center}' +
        '.pl__ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}' +
        '.pl__ring circle{fill:none;stroke-width:3}' +
        '.pl__ring .t{stroke:rgba(255,255,255,.14)}' +
        '.pl__ring .b{stroke:#FFC21A;stroke-linecap:round;stroke-dasharray:289;stroke-dashoffset:289;animation:pl-ring 1.7s cubic-bezier(.65,0,.35,1) .15s forwards}' +
        '.pl__gem{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:#FFC21A;color:#0E1D14;transform:rotate(-8deg) scale(.4);opacity:0;animation:pl-gem .8s cubic-bezier(.34,1.56,.64,1) .1s forwards;box-shadow:0 18px 34px -12px rgba(255,194,26,.7)}' +
        '.pl__gem svg{width:30px;height:30px}' +
        '.pl__word{display:flex;gap:2px;font-size:clamp(2.75rem,10vw,4.25rem);font-weight:800;line-height:1;letter-spacing:-.04em}' +
        '.pl__word span{display:inline-block;opacity:0;transform:translateY(60%);animation:pl-up .7s cubic-bezier(.2,.8,.2,1) forwards}' +
        '.pl__word span:nth-child(1){animation-delay:.35s}.pl__word span:nth-child(2){animation-delay:.43s}.pl__word span:nth-child(3){animation-delay:.51s}.pl__word span:nth-child(4){animation-delay:.59s;color:#FFC21A}' +
        '.pl__tag{margin:0;font-family:"Inter",system-ui,sans-serif;font-size:.9375rem;font-weight:500;color:#BFE0C9;opacity:0;animation:pl-fade .7s ease .9s forwards}' +
        '.pl__bar{position:relative;width:min(220px,60vw);height:4px;border-radius:4px;background:rgba(255,255,255,.14);overflow:hidden;opacity:0;animation:pl-fade .5s ease .7s forwards}' +
        '.pl__bar i{position:absolute;inset:0;border-radius:4px;background:linear-gradient(90deg,#1B8F45,#FFC21A);transform:scaleX(0);transform-origin:left;animation:pl-bar 1.7s cubic-bezier(.65,0,.35,1) .7s forwards}' +
        '.pl.is-out .pl__panel--t{transform:translateY(-101%)}.pl.is-out .pl__panel--b{transform:translateY(101%)}' +
        '.pl.is-out .pl__core,.pl.is-out .pl__dots{opacity:0;transform:scale(.94)}' +
        '@keyframes pl-ring{to{stroke-dashoffset:0}}' +
        '@keyframes pl-gem{to{transform:rotate(-8deg) scale(1);opacity:1}}' +
        '@keyframes pl-up{to{opacity:1;transform:none}}' +
        '@keyframes pl-fade{to{opacity:1}}' +
        '@keyframes pl-bar{to{transform:scaleX(1)}}' +
        '@media(prefers-reduced-motion:reduce){.pl *{animation-duration:.01s!important;animation-delay:0s!important}.pl__panel{transition:none!important}.pl__core,.pl__dots{transition:none!important}}';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.className = 'pl';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Carregando o site do ITEP');
    el.innerHTML =
        '<div class="pl__panel pl__panel--t"></div><div class="pl__panel pl__panel--b"></div><div class="pl__dots"></div>' +
        '<div class="pl__core">' +
            '<div class="pl__mark">' +
                '<svg class="pl__ring" viewBox="0 0 96 96" aria-hidden="true"><circle class="t" cx="48" cy="48" r="46"/><circle class="b" cx="48" cy="48" r="46"/></svg>' +
                '<div class="pl__gem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg></div>' +
            '</div>' +
            '<div class="pl__word" aria-hidden="true"><span>I</span><span>T</span><span>E</span><span>P</span></div>' +
            '<p class="pl__tag">Há 20 anos transformando vidas</p>' +
            '<div class="pl__bar" aria-hidden="true"><i></i></div>' +
        '</div>';
    document.documentElement.appendChild(el);
    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    var t0 = Date.now(), done = false, loaded = document.readyState === 'complete';

    function finish() {
        if (done) return;
        done = true;
        el.classList.add('is-out');
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (style.parentNode) style.parentNode.removeChild(style);
            document.documentElement.style.overflow = prevOverflow;
        }, reduce ? 50 : 1000);
    }
    function tryFinish() {
        if (!loaded) return;
        var wait = Math.max(0, MIN - (Date.now() - t0));
        setTimeout(finish, wait);
    }

    if (loaded) tryFinish();
    else window.addEventListener('load', function () { loaded = true; tryFinish(); });
    setTimeout(finish, MAX);
})();
