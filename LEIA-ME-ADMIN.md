# ITEP — área restrita (PHP + MySQL)

## O que ela faz
- **/admin/** — painel com login. **Mensagens recebidas** (com status, anotações e exportação em CSV), **Relatórios** (período, gráfico, rankings, impressão/PDF e CSV), e, em segundo plano, blog, cidades (endereço, WhatsApp, redes, cursos), cursos (texto e foto), contato e redes do site, troca de senha e cadastro de outros usuários (em Segurança).
- **Mensagens:** cada contato enviado pelos formulários (Contato, Seja nosso aluno e o formulário da home) é guardado no MySQL. O envio por e-mail e por WhatsApp que já existia continua igual.
- O site público lê o conteúdo de `/api/site`. Se a API estiver fora do ar, as páginas continuam mostrando o conteúdo que já está nelas.

## Requisitos da hospedagem
PHP 8.1+ (extensões `pdo_mysql`, `mbstring`, `json`, `fileinfo`), MySQL 5.7+ ou MariaDB 10.3+, Apache com `mod_rewrite` e `AllowOverride All` (para o `.htaccess`).

## Instalação (uma vez)
1. Envie **todo o conteúdo da pasta `v2`** para a raiz do site (`public_html`).
2. Crie um banco MySQL e um usuário com acesso a ele (painel da hospedagem).
3. Dê permissão de escrita às pastas `api/` (só durante a instalação) e `uploads/`.
4. Abra `https://seusite.com.br/instalar/`, preencha os dados do banco e escolha o usuário e a senha do painel (senha com 10+ caracteres, letras e números).
5. **Apague a pasta `instalar/`** do servidor. Opcional: volte a permissão da pasta `api/` para somente leitura.
6. Entre em `https://seusite.com.br/admin/`.

O instalador cria as tabelas e já carrega todo o conteúdo atual do site (22 cursos, 13 cidades, 4 artigos).

## Nginx (se não for Apache)
```nginx
location ~ ^/api/(?!index\.php$) { rewrite ^ /api/index.php last; }
location ~ ^/api/inc/ { deny all; }
location ~ ^/api/(config\.php|seed\.json|schema\.sql)$ { deny all; }
location ~ /\. { deny all; }
location ~ \.(sql|md|bat|lock)$ { deny all; }
location ^~ /uploads/ { location ~ \.php$ { deny all; } }
location ~ ^/blog/([a-z0-9\-]+)/?(index\.html)?$ { try_files $uri $uri/ /blog/artigo/index.html; }
```

## Testar no seu computador
`iniciar-local.bat` (precisa de PHP 8.1+ e de um MySQL rodando). Depois abra `http://localhost:8000/instalar/`.

## Segurança (já implementada)
Senha com hash (`password_hash`), sessão em cookie HttpOnly + SameSite=Strict, proteção CSRF, limite de tentativas de login (6 a cada 10 min por IP), consultas SQL parametrizadas, upload só de imagem real (JPG/PNG/WEBP, até 5 MB, sem execução de scripts), mensagens e artigos exibidos sempre como texto (sem HTML), CSV protegido contra fórmulas.
Se o site ficar atrás de proxy/Cloudflare, mude `trust_proxy` para `true` em `api/config.php`.

## Backup
Faça backup do banco MySQL e da pasta `uploads/`. Esses dois guardam tudo que foi editado pelo painel.

## Limites desta versão
Cidades e cursos **existentes** podem ser editados, mas criar uma cidade ou um curso novo ainda exige criar a página (HTML) correspondente.

## SEO (Google) — domínio https://itepminasgerais.com.br

O site já sai pronto: título e descrição únicos por página, link canônico, Open Graph/Twitter (prévia ao compartilhar), dados estruturados (organização, cursos, unidades, artigos), robots.txt e sitemaps.

- Para regerar depois de mudar páginas: node tools/gen-seo.js (sitemap.xml, robots.txt e o bloco de SEO de cada página).
- sitemap-blog.xml é gerado pelo banco e inclui os artigos criados no painel.
- O .htaccess redireciona para HTTPS e ativa compressão e cache.

Depois de publicar na hospedagem:
1. Google Search Console (search.google.com/search-console): adicione o domínio, confirme a propriedade e envie sitemap.xml e sitemap-blog.xml.
2. Peça a indexação da página inicial (Inspeção de URL > Solicitar indexação).
3. Crie/reivindique o perfil do ITEP no Google Meu Negócio (uma ficha por unidade, se houver endereço).
4. Confirme que o site abre só com HTTPS e que a versão www redireciona para a sem www (ou o contrário), em um endereço só.
5. Resultado nas primeiras posições leva semanas ou meses e depende de concorrência, conteúdo e links vindos de outros sites.
