# Sticker Tracker — Copa do Mundo 2022

Aplicativo web simples para gerenciar a coleção do álbum Panini da Copa do Mundo de 2022. Marca o que você tem, o que falta e o que tem de repetida para troca — tudo offline, com os dados salvos no próprio navegador.

**Acesse online:** <https://lucianoamagalhaes.github.io/sticker-tracker-wordcup2022/>

## Funcionalidades

- Catálogo completo do álbum: **678 figurinhas** (32 seleções × 20 + 29 Gerais + 8 Coca-Cola + 1 especial)
- Navegação por grupo da copa (A–H) + bloco de Especiais
- Cada clique cicla o status da figurinha: **falta → tenho → repetida → falta**
- Progresso ao vivo: total geral (com barra), por seleção (na sidebar) e por seção (acima do grid)
- Filtros por status: Todas / Faltantes / Obtidas / Repetidas
- Visões dedicadas:
  - **Minhas repetidas** — lista tudo que você tem de extra, agrupado por seleção
  - **Minhas faltantes** — lista tudo que está faltando, agrupado por seleção
- **Copiar lista** para troca, com formato pronto para colar em WhatsApp/email
- **Exportar / Importar** coleção em JSON (backup e sincronização entre dispositivos)
- Persistência local no `localStorage` — funciona offline
- Dark mode automático (acompanha o tema do sistema operacional)
- Responsivo (desktop, tablet, mobile)

## Stack

- HTML
- CSS (com custom properties para tema light/dark)
- JavaScript vanilla (ES modules)

Sem frameworks, sem build, sem `package.json`, sem dependências.

## Como rodar localmente

O JS é carregado como ES module e usa `fetch`, então **não funciona abrindo `index.html` direto via `file://`** — é preciso servir os arquivos por HTTP. Algumas opções:

### Opção 1 — VS Code Live Server (mais simples)

Instale a extensão **Live Server**, abra a pasta no VS Code, clique com o botão direito em `index.html` → "Open with Live Server".

### Opção 2 — Python

```bash
python3 -m http.server 8080
```

Abra <http://localhost:8080> no navegador.

### Opção 3 — Node.js (se já tiver instalado)

```bash
npx serve
```

## Estrutura de pastas

```text
sticker-tracker-wordcup2022/
├── index.html          # Estrutura HTML principal
├── css/
│   └── styles.css      # Estilos (tokens CSS, light + dark)
├── js/
│   └── main.js         # Módulo ES com toda a lógica
├── data/
│   └── album.json      # Catálogo do álbum (grupos, seleções, especiais)
├── CLAUDE.md           # Visão do projeto e convenções
└── README.md           # Este arquivo
```

## Como usar

### Marcando figurinhas

1. Clique numa seleção na barra lateral esquerda (ex: "Brasil")
2. Clique numa figurinha do grid para alterar o status:
   - **1º clique** — Tenho (card verde)
   - **2º clique** — Repetida (card laranja com badge "REP")
   - **3º clique** — Volta para falta (card cinza tracejado)

### Filtrando

Acima do grid, use os chips **Todas / Faltantes / Obtidas / Repetidas**. O filtro escolhido persiste entre sessões.

### Vendo repetidas e faltantes

Na barra lateral, em **Visões**:

- **Minhas repetidas** — útil para listar o que você tem de extra para trocar
- **Minhas faltantes** — útil como "lista de compras" no próximo trocário

### Copiando lista para trocas

Em qualquer view com lista (filtro ativo ou views especiais), aparece o botão **Copiar lista**:

- Numa seção com filtro → copia os códigos como lista plana:
  ```
  BRA3, BRA5, BRA7
  ```
- Nas views **Minhas repetidas** / **Minhas faltantes** → copia agrupado por seleção:
  ```
  Brasil (Grupo G): BRA3, BRA5
  Catar (Grupo A): QAT9
  Gerais: FWC2
  ```

Cole no WhatsApp, email ou onde for trocar.

### Backup e sincronização entre dispositivos

A coleção fica no `localStorage` do seu navegador — isso significa que abrir noutro celular ou outro browser começa zerado. Para sincronizar:

- **Exportar coleção** baixa um arquivo `colecao-copa-2022-AAAA-MM-DD.json` com seu estado atual
- **Importar coleção** carrega esse JSON em outro dispositivo

## Formato dos códigos

- **Seleções**: três letras + número de 1 a 20 (sem espaço). Ex: `BRA1` (foto do time), `BRA2` (escudo), `BRA3`–`BRA20` (jogadores)
- **Gerais**: `FWC1` a `FWC29` (troféu, mascote, estádios, legends, etc.)
- **Coca-Cola**: `C1` a `C8`
- **Especial**: `00`

## Convenções do projeto

### Idiomas

- **Português**: documentação e UI/UX
- **Inglês**: código, comentários, mensagens de commit, nomes de branch

### Git

- Branch principal: `main`
- Mensagens de commit: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`
- Nomes de branch: `<tipo>/<descrição-kebab-case>` (ex: `feat/sticker-grid`, `docs/readme`)
- Pull Requests: rebase merge para manter histórico linear

## Hospedagem

Publicado em [GitHub Pages](https://pages.github.com/) a partir da branch `main`. Cada push em `main` republica automaticamente em poucos segundos.
