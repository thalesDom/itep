/* ITEP — aviso de cookies (LGPD). Categorias iguais às da Política de Privacidade.
   Para usar a escolha em outros scripts:
     window.ITEPCookies.get()                    -> { functional, analytics, marketing } ou null
     document.addEventListener('itep:cookies', e => e.detail) */
(function () {
    'use strict';

    var KEY = 'itep-cookies';
    var VALID_DAYS = 180; // 6 meses, a maior duração listada na política
    var POLICY = '/itep/politica-de-privacidades/index.html';

    var CATS = [
        { id: 'necessary', locked: true, title: 'Essenciais', time: 'Sessão',
          text: 'Necessários para o funcionamento básico do site. Não podem ser desativados.' },
        { id: 'functional', title: 'Funcionais', time: '1 ano',
          text: 'Lembram suas preferências e configurações.' },
        { id: 'analytics', title: 'Analytics', time: '2 anos',
          text: 'Ajudam a entender como você usa o site, para melhorarmos a experiência.' },
        { id: 'marketing', title: 'Marketing', time: '6 meses',
          text: 'Personalizam anúncios e conteúdo.' }
    ];

    var SVG_COOKIE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>';
    var SVG_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

    function read() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY));
            if (!v || v.v !== 1) return null;
            if (Date.now() - v.ts > VALID_DAYS * 86400000) return null;
            return v;
        } catch (e) { return null; }
    }

    function save(choice) {
        var data = { v: 1, ts: Date.now(), functional: !!choice.functional, analytics: !!choice.analytics, marketing: !!choice.marketing };
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sem armazenamento */ }
        try {
            document.cookie = 'itep_consent=' + (data.functional ? 'f' : '') + (data.analytics ? 'a' : '') + (data.marketing ? 'm' : '') +
                '; max-age=' + (VALID_DAYS * 86400) + '; path=/; SameSite=Lax';
        } catch (e) { /* cookies bloqueados */ }
        document.dispatchEvent(new CustomEvent('itep:cookies', { detail: { functional: data.functional, analytics: data.analytics, marketing: data.marketing } }));
        return data;
    }

    function build() {
        var root = document.createElement('div');
        root.className = 'ck';
        root.innerHTML =
            '<section class="ck-banner" id="ckBanner" role="region" aria-labelledby="ckTitle">' +
                '<div class="ck-head"><span class="ck-ico">' + SVG_COOKIE + '</span><h2 id="ckTitle">Sua privacidade importa</h2></div>' +
                '<p class="ck-text">Usamos cookies para o site funcionar, lembrar suas preferências e entender como ele é usado. ' +
                'Você escolhe quais permitir. Saiba mais na <a href="' + POLICY + '">Política de Privacidade</a>.</p>' +
                '<div class="ck-actions">' +
                    '<button type="button" class="ck-btn ck-btn--primary" data-ck="all">Aceitar todos</button>' +
                    '<button type="button" class="ck-btn ck-btn--ghost" data-ck="essential">Só os essenciais</button>' +
                    '<button type="button" class="ck-link" data-ck="custom">Personalizar</button>' +
                '</div>' +
            '</section>' +
            '<dialog class="ck-modal" id="ckModal" aria-labelledby="ckModalTitle">' +
                '<div class="ck-modal__head">' +
                    '<h2 id="ckModalTitle">Preferências de cookies</h2>' +
                    '<p>Escolha quais categorias você permite. Você pode mudar isso quando quiser, pelo rodapé do site.</p>' +
                    '<button type="button" class="ck-close" data-ck="close" aria-label="Fechar">' + SVG_X + '</button>' +
                '</div>' +
                '<ul class="ck-list">' +
                CATS.map(function (c) {
                    return '<li class="ck-item"><h3>' + c.title + '</h3>' +
                        '<label class="ck-switch"><input type="checkbox" data-cat="' + c.id + '"' + (c.locked ? ' checked disabled' : '') + ' aria-label="' + c.title + '"><span></span></label>' +
                        '<p>' + c.text + '</p><small>Duração: ' + c.time + '</small></li>';
                }).join('') +
                '</ul>' +
                '<div class="ck-modal__foot">' +
                    '<button type="button" class="ck-btn ck-btn--ghost" data-ck="save">Salvar preferências</button>' +
                    '<button type="button" class="ck-btn ck-btn--primary" data-ck="all">Aceitar todos</button>' +
                '</div>' +
            '</dialog>';
        document.body.appendChild(root);
        return root;
    }

    function init() {
        var root = build();
        var banner = root.querySelector('#ckBanner');
        var modal = root.querySelector('#ckModal');
        var boxes = {};
        root.querySelectorAll('input[data-cat]').forEach(function (i) { boxes[i.dataset.cat] = i; });
        var htmlEl = document.documentElement;

        function showBanner(on) {
            banner.classList.toggle('is-open', on);
            htmlEl.classList.toggle('ck-open', on);
        }
        function fill(c) {
            boxes.functional.checked = !!(c && c.functional);
            boxes.analytics.checked = !!(c && c.analytics);
            boxes.marketing.checked = !!(c && c.marketing);
        }
        function closeAll() {
            if (modal.open) modal.close();
            showBanner(false);
            document.body.style.overflow = '';
        }
        function openModal() {
            fill(read());
            if (modal.showModal) { modal.showModal(); document.body.style.overflow = 'hidden'; }
        }

        root.addEventListener('click', function (e) {
            var b = e.target.closest('[data-ck]');
            if (e.target === modal) { modal.close(); return; }
            if (!b) return;
            var a = b.dataset.ck;
            if (a === 'all') { save({ functional: true, analytics: true, marketing: true }); closeAll(); }
            else if (a === 'essential') { save({}); closeAll(); }
            else if (a === 'custom') { openModal(); }
            else if (a === 'save') { save({ functional: boxes.functional.checked, analytics: boxes.analytics.checked, marketing: boxes.marketing.checked }); closeAll(); }
            else if (a === 'close') { modal.close(); }
        });
        modal.addEventListener('close', function () { document.body.style.overflow = ''; });

        // link "Preferências de cookies" no rodapé
        document.addEventListener('click', function (e) {
            var l = e.target.closest('[data-cookie-settings]');
            if (!l) return;
            e.preventDefault();
            openModal();
        });

        window.ITEPCookies = {
            get: function () { var c = read(); return c ? { functional: c.functional, analytics: c.analytics, marketing: c.marketing } : null; },
            open: openModal
        };

        var saved = read();
        if (saved) {
            document.dispatchEvent(new CustomEvent('itep:cookies', { detail: { functional: saved.functional, analytics: saved.analytics, marketing: saved.marketing } }));
        } else {
            setTimeout(function () { showBanner(true); }, 700);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
