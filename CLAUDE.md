# Sticker Tracker - Álbuns da Copa do Mundo

## Visão do Projeto

Aplicativo web simples para gerenciar coleções de figurinhas dos álbuns Panini da Copa do Mundo, organizado por seleção. Controla quais figurinhas o usuário já possui, quais estão faltando e quais são repetidas (para troca). Suporta múltiplos álbuns (Copa 2022 e Copa 2026 incluídos), com seletor no header e coleções separadas por álbum. Na primeira visita o app abre no álbum 2026 (definido em `data/albums.json`).

## Stack

- HTML
- CSS (custom properties, suporte a dark mode via `prefers-color-scheme`)
- JavaScript vanilla (ES modules)

Sem frameworks, sem build step, sem `package.json`. Persistência local via `localStorage` (recurso do navegador que salva dados em pares chave/valor no próprio computador do usuário, funciona offline e sem servidor).

Para rodar localmente: extensão **Live Server** do VS Code, `python3 -m http.server`, ou similar. O JS é módulo ES e usa `fetch`, então `file://` não funciona.

## Hospedagem

Publicado em GitHub Pages a partir da branch `main`:
<https://lucianoamagalhaes.github.io/sticker-tracker-worldcup/>

Cada push em `main` republica automaticamente. O repositório foi renomeado de `sticker-tracker-wordcup2022` para `sticker-tracker-worldcup`; o GitHub redireciona operações git para a URL antiga, mas o Pages no nome antigo deixou de responder (Pages é derivado do nome do repo).

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

## Álbuns suportados

### Convenção comum

- Cada seleção tem **20 figurinhas**: 1 foto do time + 1 escudo + 18 jogadores.
- Código: 3 letras da seleção + número de 1 a 20, **sem espaço**.
  - `XXX1` → foto do time
  - `XXX2` → escudo
  - `XXX3` a `XXX20` → jogadores

### Copa do Mundo 2022 (`album-2022.json`)

- 32 seleções × 20 = 640 figurinhas
- **Gerais (FWC)**: `FWC1` a `FWC29` → 29 figurinhas (troféu, mascote, estádios, legends, etc.)
- **Coca-Cola (C)**: `C1` a `C8` → 8 figurinhas
- **Especial**: `00` → 1 figurinha única
- **Total**: 640 + 29 + 8 + 1 = **678 figurinhas**

Seleções por Grupo:

- **Grupo A**: QAT (Catar), ECU (Equador), SEN (Senegal), NED (Holanda)
- **Grupo B**: ENG (Inglaterra), IRN (Irã), USA (Estados Unidos), WAL (País de Gales)
- **Grupo C**: ARG (Argentina), KSA (Arábia Saudita), MEX (México), POL (Polônia)
- **Grupo D**: FRA (França), AUS (Austrália), DEN (Dinamarca), TUN (Tunísia)
- **Grupo E**: ESP (Espanha), CRC (Costa Rica), GER (Alemanha), JPN (Japão)
- **Grupo F**: BEL (Bélgica), CAN (Canadá), MAR (Marrocos), CRO (Croácia)
- **Grupo G**: BRA (Brasil), SRB (Sérvia), SUI (Suíça), CMR (Camarões)
- **Grupo H**: POR (Portugal), GHA (Gana), URU (Uruguai), KOR (Coreia do Sul)

### Copa do Mundo 2026 (`album-2026.json`)

- 48 seleções × 20 = 960 figurinhas
- **Introduction (FWC1–FWC9)**: 9 figurinhas (logo Panini, emblema, mascotes, slogan, bola, cidades-sede)
- **FIFA Museum (FWC10–FWC20)**: 11 figurinhas (campeões mundiais de 1934 a 2022)
- **Coca-Cola (C)**: `C1` a `C12` → 12 figurinhas promocionais (em rótulos da Coca, fora dos envelopes)
- **Total**: 960 + 9 + 11 + 12 = **992 figurinhas**

> Nota: a Panini divulga o álbum como tendo **980 figurinhas** (48×20 + 20 especiais). As 12 Coca-Cola são promocionais e não entram nesse total oficial; aqui são incluídas no `totalStickers` por consistência com o catálogo do 2022.

Seleções por Grupo (sorteio de 5 dez 2025 em Washington):

- **Grupo A**: MEX (México), RSA (África do Sul), KOR (Coreia do Sul), CZE (República Tcheca)
- **Grupo B**: CAN (Canadá), BIH (Bósnia e Herzegovina), QAT (Catar), SUI (Suíça)
- **Grupo C**: BRA (Brasil), MAR (Marrocos), HAI (Haiti), SCO (Escócia)
- **Grupo D**: USA (Estados Unidos), PAR (Paraguai), AUS (Austrália), TUR (Turquia)
- **Grupo E**: GER (Alemanha), CUW (Curaçao), CIV (Costa do Marfim), ECU (Equador)
- **Grupo F**: NED (Holanda), JPN (Japão), SWE (Suécia), TUN (Tunísia)
- **Grupo G**: BEL (Bélgica), EGY (Egito), IRN (Irã), NZL (Nova Zelândia)
- **Grupo H**: ESP (Espanha), CPV (Cabo Verde), KSA (Arábia Saudita), URU (Uruguai)
- **Grupo I**: FRA (França), SEN (Senegal), IRQ (Iraque), NOR (Noruega)
- **Grupo J**: ARG (Argentina), ALG (Argélia), AUT (Áustria), JOR (Jordânia)
- **Grupo K**: POR (Portugal), COD (RD Congo), UZB (Uzbequistão), COL (Colômbia)
- **Grupo L**: ENG (Inglaterra), CRO (Croácia), GHA (Gana), PAN (Panamá)

Estreantes na Copa: CPV (Cabo Verde), CUW (Curaçao), JOR (Jordânia), UZB (Uzbequistão).

## Modelo de Dados

### Manifest de álbuns (`data/albums.json`)

Lista todos os álbuns disponíveis e o default na primeira visita:

```json
{
  "defaultAlbumId": "2026",
  "albums": [
    { "id": "2026", "name": "Copa do Mundo 2026", "shortName": "Copa 2026", "year": 2026, "file": "data/album-2026.json" },
    { "id": "2022", "name": "Copa do Mundo 2022", "shortName": "Copa 2022", "year": 2022, "file": "data/album-2022.json" }
  ]
}
```

### Catálogo por álbum (`data/album-<id>.json`)

Estrutura compacta com metadados. As figurinhas individuais não são listadas — são expandidas em runtime pelo JS:

- Cabeçalho: `id`, `name`, `shortName`, `year`, `totalStickers`.
- `selectionStickerLayout` define a regra (1=team, 2=shield, 3–20=player) usada para gerar as figurinhas de qualquer seleção a partir do código de 3 letras.
- `groups` → lista de grupos, cada um com `id`, `name` e `selections` (cada `{code, name}`).
- `specials` lista os blocos extras. Dois formatos: `prefix + count` (gera `${prefix}1..N`, usado por Coca-Cola e pelos FWC do 2022) ou `ids` explícito (usado quando dois blocos compartilham o mesmo prefixo — ex: Introduction `FWC1–9` e FIFA Museum `FWC10–20` no 2026 — ou quando o id não segue padrão sequencial — ex: `["00"]` no 2022).

### Identificadores em inglês (convenção)

- **type**: `team` | `shield` | `player` | `general` | `coca` | `special`
- **status** (gerenciado no `localStorage`, não no catálogo): `owned` | `missing` | `duplicate`

### Storage no navegador (`localStorage`)

Chaves namespaceadas pelo álbum:

- `sticker-tracker:active-album` — id do álbum atualmente selecionado.
- `sticker-tracker:<albumId>:collection` — objeto `{stickerId: status}`. Só entradas não-`missing` são persistidas (default é missing).
- `sticker-tracker:<albumId>:filter` — string com o filtro ativo (`all` | `missing` | `owned` | `duplicate`).

**Migration**: na primeira carga após o upgrade multi-álbum, as chaves antigas (`sticker-tracker-wordcup2022:collection`/`filter`) são copiadas para o namespace do álbum `2022` e removidas.

## Arquitetura do Frontend

### Arquivos

```text
sticker-tracker-worldcup/
├── index.html              # Estrutura HTML; carrega CSS e JS module
├── css/styles.css          # Tokens CSS + tema light/dark; estilos por seção
├── js/main.js              # Lógica completa do app
└── data/
    ├── albums.json         # Manifest com a lista de álbuns
    └── album-<id>.json     # Catálogo de cada álbum (ex: album-2022.json)
```

### Conceitos principais em `js/main.js`

- **`albumsManifest`** — manifest carregado de `data/albums.json` (lista de álbuns + default).
- **`activeAlbumId`** — id do álbum atualmente carregado; determina as chaves de `localStorage` em uso.
- **`album`** — catálogo do álbum ativo (resultado de `loadAlbumById`).
- **`sectionsIndex`** — `Map` com todas as seções navegáveis do álbum ativo. Inclui seleções reais (com `stickers`) + duas virtual views (`view:duplicates`, `view:missing`) que não têm stickers próprios, mas agregam de outras seções.
- **`stickerToSection`** — `Map` reversa de `stickerId → sectionId`, usada para atualizar o contador da seção de origem quando um sticker é alterado a partir de uma view virtual.
- **`activeSectionId`** — qual seção/view está renderizada no content area.
- **`collection`** — objeto em memória sincronizado com `localStorage` (chave do álbum ativo).
- **`currentFilter`** — filtro de status ativo, persistido em `localStorage` (chave do álbum ativo).
- **`switchAlbum(newId)`** — recarrega catálogo, rebuilda `sectionsIndex`, troca `collection`/`currentFilter` para os do novo álbum, re-renderiza tudo.
- **`applyAlbumTheme()`** — escreve `data-album="<id>"` no `<body>`. CSS reage com overrides de tokens (ex: `body[data-album="2026"] { --primary: ...; }`) sob o `:root` base e dentro do `@media (prefers-color-scheme: dark)`. Hoje 2022 usa os tokens default (vinho + areia); 2026 tem paleta própria inspirada na capa do álbum Panini WC26 (vermelho coral + dourado + verde do troféu).

### Fluxo de renderização

- `renderOverview()` — barra/contadores no topo (recomputa stats globais)
- `renderNav(album)` — sidebar completa (re-render). Cada item tem um `data-progress-for="${sectionId}"` para updates surgical.
- `renderContent(section)` — despacha por `section.kind`:
  - `selection` / `special` → `renderStickers(section)` (com filtro aplicado)
  - `duplicates-view` / `missing-view` → `renderGroupedList({...})` (agrupado por seleção)
- `updateNavProgressFor(sectionId)` — atualiza só o contador daquele item da nav
- `handleStickerClick(card)` — cicla status, persiste, e dispara as atualizações pontuais corretas dependendo do contexto (view virtual vs. seção, filtro ativo vs. não)

## Funcionalidades implementadas

- Suporte multi-álbum com seletor (dropdown) no header
- Coleção e filtro persistidos por álbum (chaves namespaceadas)
- Migration automática das chaves antigas para o namespace do álbum 2022
- Catálogo Copa 2022 completo (678 figurinhas: 32 seleções + 38 especiais)
- Navegação por grupo da copa + bloco de Especiais
- Click cicla status (missing → owned → duplicate → missing)
- Visões dedicadas: **Minhas repetidas** e **Minhas faltantes**, agrupadas por seleção
- Filtros (Todas / Faltantes / Obtidas / Repetidas)
- Progresso ao vivo (global + por seleção)
- Exportar / Importar coleção em JSON (arquivo nomeado pelo álbum ativo)
- Copiar lista (formato flat para seção, agrupado para views virtuais)
- Persistência em `localStorage`
- Dark mode automático
- Responsivo (10 / 5 / 4 colunas conforme viewport)
- A11y básica (aria-labels, aria-current, aria-pressed, focus rings, prefers-reduced-motion)

## Contexto histórico

Notas que sobrevivem ao plano original de três PRs (refactor multi-álbum + catálogo 2026 + docs) e ainda servem como referência:

- **Renomeação do repositório**: de `sticker-tracker-wordcup2022` para `sticker-tracker-worldcup`. O GitHub redireciona operações `git` para a URL antiga, mas o Pages no nome antigo retorna 404 — Pages é derivado do nome do repo e não tem redirect automático.
- **Pesquisa do álbum 2026 (maio/2026)**: total oficial Panini é **980 figurinhas** em 112 páginas (48×20 + 20 especiais). As 12 Coca-Cola são promocionais (em rótulos da Coca, fora dos envelopes) e foram adicionadas ao `totalStickers` por consistência com o 2022 → 992 no catálogo.
- **Sobre as "68 metalizadas"**: imprensa brasileira fala em 68 figurinhas metalizadas (48 escudos + 16 estádios + 4 institucionais). Isso conta os 48 escudos que **já estão dentro das páginas das seleções** (versão FOIL do slot do escudo). Não são bloco extra — não afetam a contagem.
- **Ausência notável no 2026**: Itália (eliminada na repescagem europeia pela Bósnia).
- **Decisão sobre os especiais 2026**: Intro e FIFA Museum modelados como dois blocos navegáveis distintos compartilhando o prefixo `FWC` (1–9 e 10–20), via `ids` explícito no JSON — espelha a numeração real da Panini.

## Ideias futuras

- Per-grupo de copa: mostrar progresso agregado do grupo no header da sidebar
- Modo "trocas inteligentes": cruzar minhas repetidas com lista de faltantes de outra pessoa importada
- Atalhos de teclado (J/K para navegar entre seleções, número para alternar status)
- Botão de toggle manual light/dark/system (hoje só segue o sistema)
- PWA (manifest + service worker para instalar como app)
- Confetes ou animação especial quando completa o álbum
