# ITEP — Trilhas do Futuro (site v2)

Redesenho do site do **ITEP (Instituto Técnico Educacional Polivalente)**: 22 cursos técnicos, 13 municípios de Minas Gerais, blog e área restrita.

**Versão para visualização (somente o site, sem painel):** https://thalesdom.github.io/itep/

## O que tem aqui
| Pasta/arquivo | O que é |
|---|---|
| `index.html`, `<curso>/`, `<cidade>/`, `blog/`, `sobre-nos/`, `contato/`… | páginas do site (HTML + CSS + JS puro) |
| `admin/` | painel da área restrita |
| `api/` | API em PHP + MySQL (`schema.sql` tem as tabelas) |
| `instalar/` | instalador (rodar uma vez; depois apagar) |
| `docs/` | cópia estática publicada no GitHub Pages (gerada) |
| `tools/build-pages.js` | gera a pasta `docs/` |
| `LEIA-ME-ADMIN.md` | instalação do painel na hospedagem |

## No GitHub Pages
É só a vitrine: páginas, cursos, cidades, blog e formulários (que continuam enviando por e-mail/WhatsApp). O painel e o banco **não rodam no Pages**, porque exigem PHP e MySQL.
Para atualizar a vitrine depois de mudar o site: `node tools/build-pages.js itep` e `git push`.

## Site completo (com painel e banco)
Precisa de hospedagem com PHP 8.1+ e MySQL. Passo a passo em [`LEIA-ME-ADMIN.md`](LEIA-ME-ADMIN.md).
Para testar no computador: `iniciar-local.bat` (PHP + MySQL instalados).

## Observações
- A cópia do Pages tem `noindex`: é de demonstração e não aparece no Google.
- Fotos de cursos, blog e slides são de banco de imagens (Unsplash) e devem ser trocadas por fotos reais do ITEP.
- Textos de cursos, cidades e instituição seguem os PDFs institucionais do ITEP.
