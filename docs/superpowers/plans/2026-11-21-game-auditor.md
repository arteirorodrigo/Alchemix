# Auditor de jogos (game_auditor) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um agente `game_auditor` que mede e joga as fases do modo Normal e entrega um relatório curto com 3–5 problemas e sugestões.

**Architecture:** As regras do modo Normal saem de dentro de `prototipos/rumo-a-receita.html` para `prototipos/regras-normal.js` (script clássico que funciona no navegador e no Node). O HTML passa a só desenhar e chamar essas regras; o medidor `scripts/medir-fases.mjs` usa o mesmo arquivo para simular partidas. O agente `.claude/agents/game_auditor.md` roda o medidor, joga algumas fases no Chrome e escreve o relatório.

**Tech Stack:** JavaScript puro (protótipo, sem build), Node 18+, Vitest 2.1.8 (já no projeto), Playwright + Chromium (já instalados).

**Spec:** `docs/superpowers/specs/2026-11-21-game-auditor-design.md`

## Global Constraints

- Tudo em português do Brasil (código pode ter nomes em português, como o protótipo já faz).
- O protótipo continua sendo arquivo estático: abre por `file://` e pelo GitHub Pages, **sem build e sem `type="module"`**.
- Uma fonte só de regras: nada de receitas, capítulos, semente ou fila copiados em dois lugares.
- O comportamento do jogo não muda: mesma fase gera o mesmo tabuleiro e a mesma fila de antes (paridade).
- Regra nova já em vigor: peça do objetivo concluída (quando a meta pede 2× ou 3×) **fica no tabuleiro, travada** (`done`), não se mexe nem forma par.
- O auditor **não altera o jogo**; só lê, mede, fotografa e escreve em `docs/auditorias/`.
- Relatório: 3–5 problemas, cada um com evidência (número ou foto) e sugestão; sem sugestões que tragam sorte decidindo, clique à toa ou "um erro e acabou".

## Review Focus

1. Paridade: fase 1 e fase 20 geram exatamente o mesmo tabuleiro inicial e a mesma fila de antes da mudança (teste com valores gravados).
2. Peça travada: par que envolve uma casa `done` é recusado pelas regras e ignorado pelo medidor (teste em Task 1).
3. Fase além do último capítulo (`n` > total de metas) não quebra o medidor (teste `--fases 50-51`).
4. Busca explosiva (fases de 8 toques): o medidor termina em menos de ~2 min para todas as fases, usando limite de nós e marcando "≥ N" (teste de tempo na Task 2).
5. Navegador: depois da troca, o jogo abre sem erro de console em `file://` e a regra de travar continua funcionando (verificação Playwright na Task 1).

---

### Task 1: Regras do modo Normal num arquivo só

**Files:**
- Create: `prototipos/regras-normal.js`
- Modify: `prototipos/rumo-a-receita.html` (bloco `<script>`: tirar dados/regras, carregar `regras-normal.js`, `tap()` passa a chamar `jogar`)
- Modify: `vitest.config.ts` (incluir `tests/prototipos/**/*.test.ts`)
- Test: `tests/prototipos/regras-normal.test.ts`

**Interfaces:**
- Produces (em `globalThis.AlchemixRegras` e `module.exports`):
  - `EL`, `BASE`, `RECIPES`, `CHAPTERS`, `ROWS` (6), `COLS` (5) — copiados do HTML atual, sem mudar valores.
  - `find(x, y) -> Receita | undefined`, `producer(e)`, `leaves(e) -> string[]`, `steps(e) -> number`, `levelInfo(n)`, `adj(a, b) -> boolean`, `caminho(goal) -> Set<string>` (elementos da árvore do objetivo, como `path` em `findHint`).
  - `novaFase(n) -> Estado`, com `Estado = { n, goal, count, made, need, bases, cells: string[], queue: string[], s: number, taps, lives, done: number[] }`. **O estado do sorteio é o número `s`** (não um closure), para o medidor poder copiar o estado com `structuredClone`.
  - `rand(estado) -> number` — mesmo algoritmo de `rngOf` (mulberry32), avançando `estado.s`; semente inicial `n * 104729 + 7`.
  - `jogar(estado, a, b) -> { tipo: 'invalido' | 'receita' | 'erro', receita?, venceu: boolean, perdeu: false | 'vidas' | 'toques' }` — muta o estado exatamente como o `tap()` atual (ordem de consumo do sorteio igual: `nextPiece` em `a`; no erro, `helpful()` em `a` e depois em `b`). `invalido` = não vizinhos, mesma casa, ou casa em `done`.
  - `paresValidos(estado) -> [a, b][]` (vizinhos, `a < b`, nenhum em `done`) e `dica(estado) -> [a, b] | null` (mesma lógica de `findHint`, ignorando `done`).

- [ ] **Step 1: Gravar os valores de paridade antes de mexer.** Com Playwright, abrir o HTML atual (`file://`), ler `aria-label` das 30 casas e da fila para as fases 1 e 20 (via `localStorage receita.level`) e guardar como constantes no teste (`INICIAL_1`, `INICIAL_20`, em ids: traduzir rótulo → id pelo `EL`).

- [ ] **Step 2: Escrever os testes que falham** em `tests/prototipos/regras-normal.test.ts` (carregar com `createRequire(import.meta.url)('../../prototipos/regras-normal.js')`):
  - `paridade fase 1 e 20`: `novaFase(1).cells` igual a `INICIAL_1.cells` e `.queue` igual a `INICIAL_1.queue`; idem fase 20.
  - `toques = mínimo + 2`: `novaFase(1)` tem `need === 2` (vapor×2, 1 passo cada) e `taps === 4`.
  - `receita conta e trava`: na fase 1, achar um par Água+Fogo vizinho, `jogar` → `tipo 'receita'`, `made 1`, `done` contém a casa `b`, `taps === 3`.
  - `casa travada não joga`: `jogar(estado, b, vizinhoDeB)` → `tipo 'invalido'`, estado inalterado (`taps`, `cells`, `s` iguais).
  - `paresValidos ignora done`: nenhum par retornado contém a casa travada.
  - `vence na meta`: fazer o segundo Vapor → `venceu true`.
  - `erro tira vida e toque`: montar estado com par que não reage (ex.: forçar `cells` com `vapor` vizinho de `terra` na fase 20) → `tipo 'erro'`, `lives 2`, `taps` −1.
  - `fase além do fim`: `novaFase(60)` não lança e tem `goal` válido em `EL`.

- [ ] **Step 3: Rodar e ver falhar.** `npm install` (primeira vez) e `npx vitest run tests/prototipos` → FAIL (arquivo não existe).

- [ ] **Step 4: Criar `prototipos/regras-normal.js`** com as interfaces acima: script clássico no formato `(function (g) { ...; const api = {...}; g.AlchemixRegras = api; if (typeof module !== 'undefined') module.exports = api; })(typeof globalThis !== 'undefined' ? globalThis : this);`. Mover (não copiar) os dados e funções do HTML.

- [ ] **Step 5: Ajustar o HTML.** Antes do script principal, `<script src="regras-normal.js"></script>`. O script principal desestrutura `AlchemixRegras`, guarda o estado em `G` (vindo de `novaFase`) e `tap()` vira: seleção/vizinhança/toast de casa travada → `jogar(G, a, b)` → desenhar conforme `tipo` (pop/drop, toast de receita nova, shake+boom no erro, vitória, derrota). Livro (`known`), toasts e modais continuam no HTML. `findHint` usa `dica(G)`.

- [ ] **Step 6: Rodar os testes.** `npx vitest run tests/prototipos` → PASS (8 testes). `npm test` → os testes antigos continuam passando.

- [ ] **Step 7: Verificar no Chrome.** Script Playwright no scratchpad: abrir `prototipos/rumo-a-receita.html` por `file://` em 412×915, fase 1: sem `pageerror`; fazer um Vapor → casa com classe `done`, contador `1/2`; tocar na casa travada → toast "já conta para o objetivo"; fazer o segundo → modal de vitória. Tirar print e olhar.

- [ ] **Step 8: Commit.**
```bash
git add prototipos/regras-normal.js prototipos/rumo-a-receita.html tests/prototipos vitest.config.ts
git commit -m "Protótipo Normal: regras num arquivo só (regras-normal.js)"
```

### Task 2: Medidor de fases

**Files:**
- Create: `scripts/medir-fases.mjs` (linha de comando)
- Create: `scripts/medir/metricas.mjs` (funções puras, testáveis)
- Test: `tests/prototipos/metricas.test.ts`

**Interfaces:**
- Consumes: `novaFase`, `jogar`, `paresValidos`, `dica`, `caminho`, `levelInfo`, `CHAPTERS` da Task 1.
- Produces (em `scripts/medir/metricas.mjs`):
  - `contarSolucoes(n, { limiteNos = 200000 }) -> { solucoes: number, completo: boolean }` — busca em profundidade só com jogadas que reagem e cujo produto está em `caminho(goal)`; copia o estado com `structuredClone` a cada ramo; para ao vencer ou acabar toques/vidas; `completo false` quando bate o limite (relatório mostra "≥ N").
  - `chanceVitoria(n, politica, partidas = 2000, semente = 1) -> number` (0–1). Políticas: `'chute'` = par aleatório entre `paresValidos` (inclui pares que não reagem); `'sabeCaminho'` = par aleatório entre os que reagem e produzem algo de `caminho(goal)`, caindo em `'chute'` se não houver; `'dica'` = sempre `dica()`, caindo em `'chute'`. O sorteio da política usa um gerador próprio (mulberry32 com `semente`), separado do `s` da fase.
  - `medirFase(n) -> { n, capitulo, meta: string, toques, minimo, solucoes, completo, chute, sabeCaminho, dicaVence: boolean, alertas: string[] }`.
  - `alertasCapitulo(medidas[]) -> void` — acrescenta `'FICOU MAIS FÁCIL'` quando `sabeCaminho` de uma fase passa a da anterior do mesmo capítulo por mais de 0,25.
- Alertas por fase (limites são decisão do Claude, citados no relatório): `solucoes === 0` → `'SEM SOLUÇÃO'`; `solucoes === 1` → `'UM CAMINHO SÓ'`; `chute >= 0.30` → `'CHUTE VENCE'`; `sabeCaminho < 0.20` → `'APERTADA'`; `!dicaVence` → `'DICA NÃO LEVA À VITÓRIA'`.
- CLI: `node scripts/medir-fases.mjs [--fases 1-39] [--partidas 2000] [--json]`. Padrão: todas as fases dos capítulos. Saída: tabela em texto (uma linha por fase: n, cap, meta, toques, soluções, chute %, sabe caminho %, dica, alertas) e, no fim, a lista só das fases com alerta. `--json` imprime o array.

- [ ] **Step 1: Escrever os testes que falham** em `tests/prototipos/metricas.test.ts`:
  - `fase 1 tem solução`: `contarSolucoes(1).solucoes > 0`.
  - `chance entre 0 e 1 e reprodutível`: `chanceVitoria(1, 'chute', 200, 7)` está em [0,1] e é igual numa segunda chamada com os mesmos argumentos.
  - `quem sabe o caminho vence mais que o chute`: na fase 1, `sabeCaminho >= chute`.
  - `alerta sem solução`: `medirFase` com `contarSolucoes` simulado em 0 (exportar `alertasFase(medida)` e testar direto) → contém `'SEM SOLUÇÃO'`.
  - `alerta de capítulo`: `alertasCapitulo` com duas medidas do mesmo capítulo (0,10 → 0,50) marca a segunda com `'FICOU MAIS FÁCIL'`.
  - `fase além do fim`: `medirFase(50)` não lança.
  - `tempo`: `medirFase(31)` (Árvore, a mais longa) termina em < 20 s.

- [ ] **Step 2: Rodar e ver falhar.** `npx vitest run tests/prototipos/metricas.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `scripts/medir/metricas.mjs` (carrega as regras com `createRequire`) e `scripts/medir-fases.mjs` (lê argumentos, chama `medirFase` para cada fase, `alertasCapitulo`, imprime).

- [ ] **Step 4: Rodar os testes.** `npx vitest run tests/prototipos` → PASS.

- [ ] **Step 5: Rodar de verdade.** `node scripts/medir-fases.mjs` → tabela das 39 fases em menos de ~2 min, sem erro; `--fases 50-51` também roda. Conferir que Praia e Árvore aparecem com números (é o caso que o dono reclamou).

- [ ] **Step 6: Commit.**
```bash
git add scripts/medir-fases.mjs scripts/medir tests/prototipos/metricas.test.ts
git commit -m "Medidor de fases do modo Normal"
```

### Task 3: Agente game_auditor

**Files:**
- Create: `.claude/agents/game_auditor.md`
- Create: `docs/auditorias/.gitkeep`
- Modify: `docs/APRENDIZADOS.md` (uma linha em "Estado atual": existe o auditor e como chamar)

**Interfaces:**
- Consumes: `node scripts/medir-fases.mjs [--fases a-b]` (Task 2); `prototipos/rumo-a-receita.html` (Task 1).

- [ ] **Step 1: Escrever o agente.** Frontmatter: `name: game_auditor`; `description:` em português, dizendo quando usar ("auditar/testar o jogo, uma fase, um capítulo; achar o que atrapalha a diversão e sugerir melhorias"); `tools: Read, Grep, Glob, Bash, Write`. Corpo, nesta ordem:
  1. Papel: testador especialista em jogos de quebra-cabeça mobile; olha de fora; nunca altera o jogo.
  2. Antes de tudo: ler `docs/APRENDIZADOS.md` (o que o dono gosta e não gosta, pilares) e a seção 1–2 de `docs/superpowers/specs/2026-11-18-alquimia-em-cadeia-design.md`.
  3. Medir: rodar o medidor nas fases pedidas (padrão: todas); explicar o que cada coluna e alerta significa.
  4. Jogar: script Playwright no scratchpad (Chromium já instalado, `require('playwright')`), `file://` do protótipo, `localStorage` `receita.seen=1` e `receita.level=<n>`; viewports 412×915 e 320×568; escolher 2–3 fases pelos números (pior, melhor, típica); jogar seguindo a dica e tirar fotos com `deviceScaleFactor: 1`; olhar cada foto (texto vazando, peça fora da caixa, botão pequeno, o que não se entende sem ler).
  5. Julgar com a régua do dono: deduzir > chutar; erro custa algo mas não acaba tudo; sem clique à toa; fácil → difícil dentro do capítulo; fase de 1 combinação não é fase.
  6. Relatório em `docs/auditorias/AAAA-MM-DD-<tema>.md` com fotos em `docs/auditorias/AAAA-MM-DD-<tema>/`: título; "Em uma frase"; 3–5 problemas (do mais grave ao menor) com **O que vi**, **Prova** (número ou foto), **Sugestão** (concreta, que respeite os pilares); "O que está bom" (1–3 linhas); limites dos alertas usados. Responder com um resumo de até 10 linhas e o caminho do arquivo.
  7. Economia: no máximo 3 fases jogadas no navegador e 6 fotos por auditoria.

- [ ] **Step 2: Testar o agente de verdade.** Chamar `game_auditor` com "audita as fases 21 (Praia) e 31 (Árvore), que parecem apertadas, e o resto dos capítulos 3 e 4". Conferir: rodou o medidor, tirou fotos, relatório existe em `docs/auditorias/` com 3–5 problemas, cada um com prova e sugestão, e nenhuma sugestão fere as restrições globais. Se falhar algum ponto, ajustar o texto do agente e repetir uma vez.

- [ ] **Step 3: Atualizar `APRENDIZADOS.md`** ("Estado atual"): "Auditor: peça 'audita o jogo' (ou uma fase/capítulo); agente em `.claude/agents/game_auditor.md`, medidor `node scripts/medir-fases.mjs`, relatórios em `docs/auditorias/`."

- [ ] **Step 4: Commit.**
```bash
git add .claude/agents/game_auditor.md docs/auditorias docs/APRENDIZADOS.md
git commit -m "Agente game_auditor e primeira auditoria"
```
