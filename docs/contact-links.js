/* ITEP — links de e-mail que funcionam em qualquer computador.
   Quem não tem aplicativo de e-mail configurado clica em "contato@..." e nada acontece; aqui o clique abre uma janela
   com três opções: abrir no Gmail, usar o aplicativo de e-mail ou copiar o endereço. */
(function () {
    'use strict';

    var css = '' +
        '.cl-back{position:fixed;inset:0;z-index:400;display:grid;place-items:center;padding:16px;background:rgba(7,40,20,.6);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);animation:cl-fade .2s ease both}' +
        '.cl-back.is-out{animation:cl-fade .16s ease reverse both}' +
        '.cl-card{position:relative;width:min(440px,100%);padding:30px 26px 24px;text-align:center;font-family:Inter,system-ui,sans-serif;color:#0E1D14;background:#fff;border-radius:26px;box-shadow:0 40px 80px -24px rgba(0,0,0,.6);animation:cl-pop .35s cubic-bezier(.2,.9,.25,1.15) both}' +
        '.cl-ico{width:58px;height:58px;margin:0 auto 14px;display:grid;place-items:center;border-radius:18px;color:#fff;background:linear-gradient(135deg,#1B8F45,#0F3D22);box-shadow:0 16px 28px -14px rgba(22,120,58,.9)}' +
        '.cl-ico svg{width:28px;height:28px}' +
        '.cl-card h2{margin:0;font:800 1.375rem/1.2 Manrope,Inter,system-ui,sans-serif;letter-spacing:-.02em}' +
        '.cl-mail{margin:10px 0 0;padding:12px 14px;font:700 1.0625rem Manrope,Inter,system-ui,sans-serif;color:#0F3D22;background:#E3F3E8;border-radius:14px;overflow-wrap:anywhere}' +
        '.cl-hint{margin:12px 0 0;font-size:.9063rem;color:#4A5C51}' +
        '.cl-actions{display:grid;gap:10px;margin-top:20px}' +
        '.cl-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:12px 18px;font:700 1rem Manrope,Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;border:0;border-radius:14px;transition:background-color .2s,transform .2s,color .2s}' +
        '.cl-btn svg{width:20px;height:20px;flex:none}' +
        '.cl-btn:hover{transform:translateY(-2px)}' +
        '.cl-btn:focus-visible,.cl-x:focus-visible{outline:3px solid #FFC21A;outline-offset:3px}' +
        '.cl-btn--primary{color:#fff;background:#16783A;box-shadow:0 14px 24px -14px rgba(22,120,58,.9)}' +
        '.cl-btn--primary:hover{background:#0F3D22}' +
        '.cl-btn--line{color:#16783A;background:#fff;box-shadow:inset 0 0 0 2px #16783A}' +
        '.cl-btn--line:hover{color:#fff;background:#16783A}' +
        '.cl-btn.is-done{color:#fff;background:#16783A;box-shadow:none}' +
        '.cl-x{position:absolute;top:12px;right:12px;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:50%;color:#4A5C51;background:transparent;cursor:pointer}' +
        '.cl-x:hover{background:#F2F6F3}' +
        '.cl-x svg{width:20px;height:20px}' +
        '@keyframes cl-fade{from{opacity:0}}' +
        '@keyframes cl-pop{from{opacity:0;transform:translateY(18px) scale(.96)}}' +
        '@media (prefers-reduced-motion:reduce){.cl-back,.cl-card{animation:none}.cl-btn{transition:none}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var SVG = {
        mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
    };

    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

    function copyText(t) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
        return new Promise(function (ok, fail) {
            var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); } ta.remove();
        });
    }

    function openMail(addr, subject) {
        var prev = document.activeElement;
        var back = el('div', 'cl-back');
        var card = el('div', 'cl-card');
        card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'clTitle');
        var title = el('h2'); title.id = 'clTitle'; title.textContent = 'Enviar e-mail';
        var mail = el('p', 'cl-mail'); mail.textContent = addr;
        var hint = el('p', 'cl-hint'); hint.textContent = 'Escolha como prefere escrever para o ITEP.';
        var gmail = el('a', 'cl-btn cl-btn--primary', SVG.ext + '<span>Abrir no Gmail</span>');
        gmail.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(addr) + (subject ? '&su=' + encodeURIComponent(subject) : '');
        gmail.target = '_blank'; gmail.rel = 'noopener';
        var app = el('a', 'cl-btn cl-btn--line', SVG.mail + '<span>Usar o aplicativo de e-mail</span>');
        app.href = 'mailto:' + addr + (subject ? '?subject=' + encodeURIComponent(subject) : '');
        app.setAttribute('data-native', '');
        var copy = el('button', 'cl-btn cl-btn--line', SVG.copy + '<span>Copiar endereço</span>'); copy.type = 'button';
        var x = el('button', 'cl-x', SVG.x); x.type = 'button'; x.setAttribute('aria-label', 'Fechar');
        var ico = el('div', 'cl-ico', SVG.mail);
        var actions = el('div', 'cl-actions'); actions.appendChild(gmail); actions.appendChild(app); actions.appendChild(copy);
        [x, ico, title, mail, hint, actions].forEach(function (n) { card.appendChild(n); });
        back.appendChild(card); document.body.appendChild(back);
        var lock = document.body.style.overflow; document.body.style.overflow = 'hidden';

        function close() {
            document.removeEventListener('keydown', onKey, true);
            back.classList.add('is-out');
            setTimeout(function () { back.remove(); document.body.style.overflow = lock; if (prev && prev.focus) prev.focus(); }, 160);
        }
        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key !== 'Tab') return;
            var f = card.querySelectorAll('a[href],button'); if (!f.length) return;
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        document.addEventListener('keydown', onKey, true);
        back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
        x.addEventListener('click', close);
        gmail.addEventListener('click', function () { setTimeout(close, 150); });
        app.addEventListener('click', function () { setTimeout(close, 400); });
        copy.addEventListener('click', function () {
            copyText(addr).then(function () {
                copy.classList.add('is-done'); copy.innerHTML = SVG.check + '<span>Endereço copiado</span>';
                setTimeout(close, 1100);
            }).catch(function () { copy.querySelector('span').textContent = 'Copie manualmente: ' + addr; });
        });
        gmail.focus();
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
        if (!a || a.hasAttribute('data-native')) return;
        var raw = a.getAttribute('href').slice(7).split('?')[0];
        var addr; try { addr = decodeURIComponent(raw); } catch (err) { addr = raw; }
        if (!addr) return;
        e.preventDefault();
        openMail(addr);
    });

    window.ITEPContact = { openMail: openMail };
})();
