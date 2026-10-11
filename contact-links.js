/* ITEP — links de e-mail e de telefone que funcionam em qualquer computador.
   E-mail: quem não tem aplicativo de e-mail configurado clica e nada acontece; aqui abre uma janela com
   "Abrir no Gmail", "Usar o aplicativo de e-mail" e "Copiar endereço".
   Telefone: abre uma janela com "Chamar no WhatsApp", "Ligar" e "Copiar número". */
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

    var P = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    var SVG = {
        mail: '<svg viewBox="0 0 24 24" ' + P + '><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        copy: '<svg viewBox="0 0 24 24" ' + P + '><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        ext: '<svg viewBox="0 0 24 24" ' + P + '><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
        phone: '<svg viewBox="0 0 24 24" ' + P + '><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        chat: '<svg viewBox="0 0 24 24" ' + P + '><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
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

    /* janela genérica: cfg = { icon, title, highlight, hint, copy: { text, label, done }, actions: [{ label, icon, href, blank, native, primary }] } */
    function openDialog(cfg) {
        var prev = document.activeElement;
        var back = el('div', 'cl-back');
        var card = el('div', 'cl-card');
        card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'clTitle');
        var title = el('h2'); title.id = 'clTitle'; title.textContent = cfg.title;
        var hl = el('p', 'cl-mail'); hl.textContent = cfg.highlight;
        var hint = el('p', 'cl-hint'); hint.textContent = cfg.hint;
        var actions = el('div', 'cl-actions');
        var links = [];
        cfg.actions.forEach(function (a) {
            var n = el('a', 'cl-btn ' + (a.primary ? 'cl-btn--primary' : 'cl-btn--line'), (SVG[a.icon] || '') + '<span></span>');
            n.querySelector('span').textContent = a.label; n.href = a.href;
            if (a.blank) { n.target = '_blank'; n.rel = 'noopener'; }
            if (a.native) n.setAttribute('data-native', '');
            n.addEventListener('click', function () { setTimeout(close, a.blank ? 150 : 450); });
            actions.appendChild(n); links.push(n);
        });
        var copy = el('button', 'cl-btn cl-btn--line', SVG.copy + '<span></span>'); copy.type = 'button'; copy.querySelector('span').textContent = cfg.copy.label;
        actions.appendChild(copy);
        var x = el('button', 'cl-x', SVG.x); x.type = 'button'; x.setAttribute('aria-label', 'Fechar');
        var ico = el('div', 'cl-ico', SVG[cfg.icon]);
        [x, ico, title, hl, hint, actions].forEach(function (n) { card.appendChild(n); });
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
        copy.addEventListener('click', function () {
            copyText(cfg.copy.text).then(function () {
                copy.classList.add('is-done'); copy.innerHTML = SVG.check + '<span>' + cfg.copy.done + '</span>';
                setTimeout(close, 1100);
            }).catch(function () { copy.querySelector('span').textContent = 'Copie manualmente: ' + cfg.copy.text; });
        });
        if (links[0]) links[0].focus();
    }

    function openMail(addr, subject) {
        openDialog({
            icon: 'mail', title: 'Enviar e-mail', highlight: addr, hint: 'Escolha como prefere escrever para o ITEP.',
            copy: { text: addr, label: 'Copiar endereço', done: 'Endereço copiado' },
            actions: [
                { label: 'Abrir no Gmail', icon: 'ext', blank: true, primary: true, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(addr) + (subject ? '&su=' + encodeURIComponent(subject) : '') },
                { label: 'Usar o aplicativo de e-mail', icon: 'mail', native: true, href: 'mailto:' + addr + (subject ? '?subject=' + encodeURIComponent(subject) : '') }
            ]
        });
    }

    function openPhone(shown, digits) {
        var d = String(digits).replace(/\D/g, '');
        if (d.length <= 11) d = '55' + d;
        openDialog({
            icon: 'phone', title: 'Falar com o ITEP', highlight: shown, hint: 'Escolha como prefere falar com a equipe.',
            copy: { text: shown, label: 'Copiar número', done: 'Número copiado' },
            actions: [
                { label: 'Chamar no WhatsApp', icon: 'chat', blank: true, primary: true, href: 'https://wa.me/' + d },
                { label: 'Ligar', icon: 'phone', native: true, href: 'tel:+' + d }
            ]
        });
    }

    /* o link mostra só um número de telefone (sem outro texto)? */
    var PHONE = /\(\d{2}\)\s*9?\s?\d{4}-\d{4}/;
    function phoneOf(a) {
        var t = (a.textContent || '').replace(/\s+/g, ' ').trim();
        var m = PHONE.exec(t); if (!m) return null;
        var rest = t.replace(m[0], '').replace(/whatsapp/i, '').replace(/telefone|ligue|ligar/gi, '').trim();
        return rest.length <= 4 ? m[0] : null;
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!e.target.closest) return;
        var a = e.target.closest('a[href^="mailto:"]');
        if (a && !a.hasAttribute('data-native')) {
            var raw = a.getAttribute('href').slice(7).split('?')[0];
            var addr; try { addr = decodeURIComponent(raw); } catch (err) { addr = raw; }
            if (addr) { e.preventDefault(); openMail(addr); }
            return;
        }
        var w = e.target.closest('a[href*="wa.me/"]');
        if (w && !w.hasAttribute('data-native')) {
            var shown = phoneOf(w);
            if (shown) { e.preventDefault(); openPhone(shown, (/wa\.me\/(\d+)/.exec(w.getAttribute('href')) || [])[1] || shown); }
        }
    });

    window.ITEPContact = { openMail: openMail, openPhone: openPhone };
})();
