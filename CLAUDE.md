# Sticker Tracker - Copa do Mundo 2022

## Visão do Projeto

Aplicativo web simples para gerenciar a coleção de figurinhas do álbum Panini da Copa do Mundo de 2022, organizado por seleção. Controla quais figurinhas o usuário já possui, quais estão faltando e quais são repetidas (para troca).

## Stack

- HTML
- CSS (custom properties, suporte a dark mode via `prefers-color-scheme`)
- JavaScript vanilla (ES modules)

Sem frameworks, sem build step, sem `package.json`. Persistência local via `localStorage` (recurso do navegador que salva dados em pares chave/valor no próprio computador do usuário, funciona offline e sem servidor).

Para rodar localmente: extensão **Live Server** do VS Code, `python3 -m http.server`, ou similar. O JS é módulo ES e usa `fetch`, então `file://` não funciona.

## Hospedagem

Publicado em GitHub Pages a partir da branch `main`:
<https://lucianoamagalhaes.github.io/sticker-tracker-wordcup2022/>

Cada push em `main` republica automaticamente.

## Convenções

### Idiomas

- **Português**: documentação (`README.md`, `CLAUDE.md`), textos da UI/UX visíveis ao usuário final.
- **Inglês**: todo o código (nomes de variáveis, funções, arquivos), comentários, docstrings, mensagens de commit, nomes de branch, títulos e corpo de PRs.

### Git

- **Branch principal**: `main`.
- **Mensagens de commit**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`.
- **Nomes de branch**: `<tipo>/<descrição-kebab-case>` — ex: `feat/sticker-grid`, `fix/storage-bug`, `docs/readme`.
- Trabalho novo sempre em branch própria, nunca direto no `main`.
- PRs são mergeadas via **rebase** para preservar histórico linear.

## Estrutura do Álbum

### Figurinhas por Seleção (640 no total)

- 32 seleções, cada uma com **20 figurinhas**: 1 foto do time + 1 escudo + 18 jogadores.
- Código: 3 letras da seleção + número de 1 a 20, **sem espaço**.
  - `XXX1` → foto do time
  - `XXX2` → escudo
  - `XXX3` a `XXX20` → jogadores

### Figurinhas Especiais

- **Gerais (FWC)**: `FWC1` a `FWC29` → 29 figurinhas (troféu, mascote, estádios, legends, etc.).
- **Coca-Cola (C)**: `C1` a `C8` → 8 figurinhas.
- **Especial**: `00` → 1 figurinha única.

### Total geral: 640 + 29 + 8 + 1 = **678 figurinhas**

### Seleções por Grupo da Copa

- **Grupo A**: QAT (Catar), ECU (Equador), SEN (Senegal), NED (Holanda)
- **Grupo B**: ENG (Inglaterra), IRN (Irã), USA (Estados Unidos), WAL (País de Gales)
- **Grupo C**: ARG (Argentina), KSA (Arábia Saudita), MEX (México), POL (Polônia)
- **Grupo D**: FRA (França), AUS (Austrália), DEN (Dinamarca), TUN (Tunísia)
- **Grupo E**: ESP (Espanha), CRC (Costa Rica), GER (Alemanha), JPN (Japão)
- **Grupo F**: BEL (Bélgica), CAN (Canadá), MAR (Marrocos), CRO (Croácia)
- **Grupo G**: BRA (Brasil), SRB (Sérvia), SUI (Suíça), CMR (Camarões)
- **Grupo H**: POR (Portugal), GHA (Gana), URU (Uruguai), KOR (Coreia do Sul)

## Modelo de Dados

### Catálogo (`data/album.json`)

Estrutura compacta com metadados. As figurinhas individuais não são listadas — são expandidas em runtime pelo JS:

- `selectionStickerLayout` define a regra (1=team, 2=shield, 3–20=player) usada para gerar as figurinhas de qualquer seleção a partir do código de 3 letras.
- `specials` lista os blocos extras: cada um com `prefix + count` (Gerais, Coca-Cola) ou `ids` explícito (Especial = `["00"]`).

### Identificadores em inglês (convenção)

- **type**: `team` | `shield` | `player` | `general` | `coca` | `special`
- **status** (gerenciado no `localStorage`, não no catálogo): `owned` | `missing` | `duplicate`

### Storage no navegador (`localStorage`)

- `sticker-tracker-wordcup2022:collection` — objeto `{stickerId: status}`. Só entradas não-`missing` são persistidas (default é missing).
- `sticker-tracker-wordcup2022:filter` — string com o filtro ativo (`all` | `missing` | `owned` | `duplicate`).

## Arquitetura do Frontend

### Arquivos

```text
sticker-tracker-wordcup2022/
├── index.html          # Estrutura HTML; carrega CSS e JS module
├── css/styles.css      # Tokens CSS + tema light/dark; estilos por seção
├── js/main.js          # Lógica completa do app
└── data/album.json     # Catálogo do álbum
```

### Conceitos principais em `js/main.js`

- **`sectionsIndex`** — `Map` com todas as seções navegáveis. Inclui seleções reais (com `stickers`) + duas virtual views (`view:duplicates`, `view:missing`) que não têm stickers próprios, mas agregam de outras seções.
- **`stickerToSection`** — `Map` reversa de `stickerId → sectionId`, usada para atualizar o contador da seção de origem quando um sticker é alterado a partir de uma view virtual.
- **`activeSectionId`** — qual seção/view está renderizada no content area.
- **`collection`** — objeto em memória sincronizado com `localStorage`.
- **`currentFilter`** — filtro de status ativo, persistido em `localStorage`.

### Fluxo de renderização

- `renderOverview()` — barra/contadores no topo (recomputa stats globais)
- `renderNav(album)` — sidebar completa (re-render). Cada item tem um `data-progress-for="${sectionId}"` para updates surgical.
- `renderContent(section)` — despacha por `section.kind`:
  - `selection` / `special` → `renderStickers(section)` (com filtro aplicado)
  - `duplicates-view` / `missing-view` → `renderGroupedList({...})` (agrupado por seleção)
- `updateNavProgressFor(sectionId)` — atualiza só o contador daquele item da nav
- `handleStickerClick(card)` — cicla status, persiste, e dispara as atualizações pontuais corretas dependendo do contexto (view virtual vs. seção, filtro ativo vs. não)

## Funcionalidades implementadas

- Catálogo das 678 figurinhas (32 seleções + 38 especiais)
- Navegação por grupo da copa + bloco de Especiais
- Click cicla status (missing → owned → duplicate → missing)
- Visões dedicadas: **Minhas repetidas** e **Minhas faltantes**, agrupadas por seleção
- Filtros (Todas / Faltantes / Obtidas / Repetidas)
- Progresso ao vivo (global + por seleção)
- Exportar / Importar coleção em JSON
- Copiar lista (formato flat para seção, agrupado para views virtuais)
- Persistência em `localStorage`
- Dark mode automático
- Responsivo (10 / 5 / 4 colunas conforme viewport)
- A11y básica (aria-labels, aria-current, aria-pressed, focus rings, prefers-reduced-motion)

## Ideias futuras

- Per-grupo de copa: mostrar progresso agregado do grupo no header da sidebar
- Modo "trocas inteligentes": cruzar minhas repetidas com lista de faltantes de outra pessoa importada
- Atalhos de teclado (J/K para navegar entre seleções, número para alternar status)
- Botão de toggle manual light/dark/system (hoje só segue o sistema)
- PWA (manifest + service worker para instalar como app)
- Confetes ou animação especial quando completa o álbum
