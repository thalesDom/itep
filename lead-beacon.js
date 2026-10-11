/* ITEP — envia uma cópia de cada contato (formulários) para a área restrita.
   Não altera o comportamento dos formulários: o e-mail e o WhatsApp continuam funcionando como antes. */
(function () {
    'use strict';

    function val(form, sel) { var e = form.querySelector(sel); return e ? e.value : ''; }
    function opt(form, sel) { var e = form.querySelector(sel); if (!e) return ''; if (e.tagName === 'SELECT') { var o = e.options[e.selectedIndex]; return o && o.value ? o.text.replace(/\s+-\s+MG$/, '') : ''; } return e.value; }

    var READERS = {
        'contact-form': function (f) { return { name: val(f, '#name'), phone: val(f, '#phone'), email: val(f, '#email'), age: val(f, '#age'), city: opt(f, '#city'), course: opt(f, '#course'), message: val(f, '#message') }; },
        'contactForm': function (f) { return { name: val(f, '#name'), phone: val(f, '#phone'), email: val(f, '#email'), city: opt(f, '#city'), course: opt(f, '#course'), subject: val(f, '#subject'), message: val(f, '#message') }; },
        'multiStepForm': function (f) { return { name: val(f, '#nome'), phone: val(f, '#telefone'), email: val(f, '#email'), city: opt(f, '#cidade'), course: opt(f, '#curso') }; }
    };

    document.addEventListener('submit', function (e) {
        var f = e.target;
        var read = f && READERS[f.id];
        if (!read || !f.checkValidity || !f.checkValidity()) return;
        var p = read(f);
        p.source = location.pathname;
        try {
            fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), keepalive: true, credentials: 'same-origin' }).catch(function () { });
        } catch (err) { /* sem API: ignora */ }
    }, true);
})();
