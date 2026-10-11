/* ITEP — VLibras (Governo Federal): tradutor gratuito de português para Libras, com avatar 3D.
   Carrega depois que a página termina, para não atrasar o site. https://www.gov.br/governodigital/pt-br/vlibras */
(function () {
    'use strict';
    if (document.getElementById('vlibras-access')) return;

    function load() {
        var s = document.createElement('script');
        s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        s.async = true;
        s.onload = function () { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch (e) { /* sem VLibras: o site funciona normalmente */ } };
        document.body.appendChild(s);
    }
    if (document.readyState === 'complete') setTimeout(load, 400);
    else window.addEventListener('load', function () { setTimeout(load, 400); });
})();
