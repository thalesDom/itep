/* ITEP — avisos de envio dos formulários (sucesso, erro, atenção), sem alert() nem confirm().
   Uso: ITEPFeedback.show(elemento, { type: 'success'|'error'|'info', title, text, actions: [{ label, href, primary, onClick }] })
        ITEPFeedback.clear(elemento) */
(function (w) {
    'use strict';
    var css = '' +
        '.fb-wrap{display:block!important;margin-top:18px;padding:0!important;border:0!important;background:none!important;text-align:left!important;font-weight:400!important}' +
        '.fb{display:flex;gap:16px;align-items:flex-start;padding:18px 20px;border-radius:18px;font-family:Inter,system-ui,sans-serif;line-height:1.5;animation:fb-in .45s cubic-bezier(.2,.8,.2,1) both}' +
        '.fb--success{color:#0F3D22;background:#E3F3E8;box-shadow:inset 0 0 0 1.5px rgba(27,143,69,.45)}' +
        '.fb--error{color:#6E1712;background:#FDECEA;box-shadow:inset 0 0 0 1.5px rgba(179,38,30,.4)}' +
        '.fb--info{color:#0E1D14;background:#FFF6D9;box-shadow:inset 0 0 0 1.5px rgba(255,194,26,.7)}' +
        '.fb__ico{flex:none;width:44px;height:44px;display:grid;place-items:center;border-radius:14px;color:#fff}' +
        '.fb--success .fb__ico{background:linear-gradient(135deg,#1B8F45,#0F3D22)}' +
        '.fb--error .fb__ico{background:#B3261E}' +
        '.fb--info .fb__ico{background:#0E1D14;color:#FFC21A}' +
        '.fb__ico svg{width:24px;height:24px}' +
        '.fb__body{min-width:0;flex:1}' +
        '.fb__title{display:block;font-family:Manrope,Inter,system-ui,sans-serif;font-size:1.0625rem;font-weight:800;letter-spacing:-.01em;line-height:1.3}' +
        '.fb__text{margin:4px 0 0;font-size:.9688rem;opacity:.92}' +
        '.fb__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}' +
        '.fb__btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 18px;font:700 .9375rem Manrope,Inter,system-ui,sans-serif;text-decoration:none;color:inherit;background:transparent;border:0;border-radius:12px;box-shadow:inset 0 0 0 2px currentColor;cursor:pointer;transition:background-color .2s,color .2s,transform .2s}' +
        '.fb__btn:hover{transform:translateY(-2px)}' +
        '.fb__btn:focus-visible{outline:3px solid #FFC21A;outline-offset:3px}' +
        '.fb__btn--primary{color:#fff;background:#16783A;box-shadow:none}' +
        '.fb--error .fb__btn--primary{background:#0F3D22}' +
        '.fb__btn--primary:hover{background:#0F3D22}' +
        '@keyframes fb-in{from{opacity:0;transform:translateY(10px)}}' +
        '@media (max-width:520px){.fb{flex-direction:column;gap:12px}.fb__actions{flex-direction:column}.fb__btn{width:100%}}' +
        '@media (prefers-reduced-motion:reduce){.fb{animation:none}.fb__btn{transition:none}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.01"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>'
    };

    function show(el, o) {
        if (!el) return;
        var type = ICONS[o.type] ? o.type : 'info';
        el.className = (el.className.replace(/\bform-message\b|\bfb-wrap\b|\bsuccess\b|\berror\b/g, '') + ' form-message fb-wrap').trim();
        el.style.display = '';
        el.textContent = '';
        var box = document.createElement('div');
        box.className = 'fb fb--' + type;
        box.setAttribute('role', type === 'error' ? 'alert' : 'status');
        var ico = document.createElement('span'); ico.className = 'fb__ico'; ico.innerHTML = ICONS[type];
        var body = document.createElement('div'); body.className = 'fb__body';
        var t = document.createElement('strong'); t.className = 'fb__title'; t.textContent = o.title || '';
        body.appendChild(t);
        if (o.text) { var p = document.createElement('p'); p.className = 'fb__text'; p.textContent = o.text; body.appendChild(p); }
        if (o.actions && o.actions.length) {
            var row = document.createElement('div'); row.className = 'fb__actions';
            o.actions.forEach(function (a) {
                var b = document.createElement(a.href ? 'a' : 'button');
                b.className = 'fb__btn' + (a.primary ? ' fb__btn--primary' : '');
                b.textContent = a.label;
                if (a.href) { b.href = a.href; b.target = '_blank'; b.rel = 'noopener'; } else { b.type = 'button'; }
                if (a.onClick) b.addEventListener('click', a.onClick);
                row.appendChild(b);
            });
            body.appendChild(row);
        }
        box.appendChild(ico); box.appendChild(body); el.appendChild(box);
        try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* navegador antigo */ }
    }
    function clear(el) { if (!el) return; el.textContent = ''; el.className = (el.className || '').replace(/\bfb-wrap\b/g, '').trim(); }

    w.ITEPFeedback = { show: show, clear: clear };
})(window);
