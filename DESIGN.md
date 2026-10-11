# DESIGN.md — ITEP Home v2

Versão original intacta em `../`. Tudo do redesign vive em `./v2/`.

## Conceito
O Vale do Jequitinhonha é conhecido pelas pedras preciosas (água-marinha, esmeralda, citrino). O ITEP "lapida" pessoas.
A paleta vem dessas pedras e o motivo visual é o **corte facetado**: cantos chanfrados em imagens, botões e painéis.

## Cores
| Token | Hex | Uso |
|---|---|---|
| `--esmeralda-900` | #0B3326 | fundo escuro, texto de destaque |
| `--esmeralda-700` | #14583F | botão primário, links |
| `--agua-marinha` | #8FD8C0 | realces sobre fundo escuro |
| `--citrino` | #F4B820 | CTA de matrícula, marcador |
| `--papel` | #F3F6F1 | fundo base (verde-gelo, não creme) |
| `--tinta` | #11231B | texto |
| `--tinta-suave` | #44574D | texto secundário (AA sobre papel) |
| `--linha` | #D5DED6 | divisórias |

Contraste: tinta/papel 15:1, tinta-suave/papel 7:1, tinta/citrino 9:1, branco/esmeralda-700 8:1.

## Tipografia (Google Fonts)
- **Bricolage Grotesque** (700–800, eixo de largura) — títulos, nomes de cursos e cidades. Tracking negativo.
- **Figtree** (400–700) — texto corrido, interface.
- Escala (mobile → desktop): 14 / 16 / 18 / 22 / 32→48 / 44→96.
- Medida máxima de linha: 62ch.

## Espaçamento, radius, sombras
- Base 4/8px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Seções: 64px mobile, 112px desktop.
- Radius: 4px (campos), 12px (painéis), pill só em filtros. Imagens e CTAs usam **corte facetado** via `clip-path`.
- Sombras: uma só, `0 24px 48px -24px rgba(11,51,38,.35)`, usada só em elementos flutuantes.

## 3 decisões que fogem do genérico
1. **Corte facetado** (clip-path com cantos chanfrados) como assinatura em foto do hero, preview de curso e botão de matrícula.
2. **Cursos como índice, não grade de cards.** Lista tipográfica grande; ao passar o mouse ou focar, a foto do curso troca no painel lateral. No mobile, vira lista com miniatura.
3. **Cidades como parede de nomes** em tipografia grande sobre esmeralda escuro, com contador de 13 unidades. Sem cards, sem ícones de pin repetidos.

## Layout
- Hero: texto alinhado à esquerda, foto facetada à direita, selo "gratuito" sobreposto no canto da foto.
- Processo em 3 passos (esta sim é uma sequência, por isso numerada).
- Movimento: uma única animação de entrada no hero; resto só reage a ação do usuário. `prefers-reduced-motion` desliga tudo.
- Ícones: Lucide. WhatsApp em SVG inline (Lucide não tem marca).
