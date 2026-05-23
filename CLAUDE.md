# Sticker Tracker - Copa do Mundo 2022

## Visão do Projeto

Aplicativo web simples para gerenciar a coleção de figurinhas do álbum Panini da Copa do Mundo de 2022, organizado por seleção. O objetivo é controlar quais figurinhas o usuário já possui, quais estão faltando e quais são repetidas (para troca).

## Stack

- HTML
- CSS
- JavaScript (vanilla)

Sem frameworks, sem build step, sem `package.json`. Persistência local via `localStorage` (recurso do navegador que salva dados em pares chave/valor no próprio computador do usuário, funciona offline e sem servidor).

Para rodar localmente: extensão **Live Server** do VS Code ou abrir `index.html` direto no navegador.

## Convenções

### Idiomas

- **Português**: documentação (`README.md`, `CLAUDE.md`), textos da UI/UX visíveis ao usuário final.
- **Inglês**: todo o código (nomes de variáveis, funções, arquivos), comentários, docstrings, mensagens de commit, nomes de branch.

### Git

- **Branch principal**: `main`.
- **Mensagens de commit**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.
- **Nomes de branch**: `<tipo>/<descrição-kebab-case>` — ex: `feat/sticker-grid`, `fix/storage-bug`, `docs/readme-screenshots`.
- Trabalho novo sempre em branch própria, nunca direto no `main`.

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

## Estado Atual

Projeto recém-iniciado. Diretório vazio — apenas este `CLAUDE.md`.

## Próximos Passos

1. **Modelar os dados** — gerar JSON com:
   - 32 seleções agrupadas por grupo da copa, cada uma com 20 figurinhas
   - Bloco Gerais (`FWC1`–`FWC29`)
   - Bloco Coca-Cola (`C1`–`C8`)
   - Figurinha especial (`00`)
   - Identificadores em inglês (conforme convenção):
     - **type**: `team` | `shield` | `player` | `general` | `coca` | `special`
     - **status** (gerenciado no `localStorage`, não no catálogo): `owned` | `missing` | `duplicate`
2. **Estrutura HTML base** — `index.html` com layout (navegação por grupo/seleção + seções extras para Gerais, Coca-Cola e Especial).
3. **Estilização CSS** — visual limpo, responsivo, com indicadores visuais claros para os 3 estados das figurinhas.
4. **Lógica JavaScript**:
   - Renderizar seleções e figurinhas a partir do JSON
   - Alternar status de cada figurinha ao clicar
   - Persistir estado em `localStorage`
   - Mostrar progresso por seleção, por grupo, por categoria especial e total geral
5. **Funcionalidades extras** (futuro):
   - Botão de exportar/importar JSON (backup manual, para mitigar a limitação do `localStorage` ser preso ao navegador)
   - Exportar lista de repetidas para troca
   - Filtros (só faltantes, só repetidas, etc.)
