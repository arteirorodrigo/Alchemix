# Alquimia em Cadeia — Plano 1: núcleo jogável (navegador)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O jogo jogável no navegador do celular: fases infinitas geradas com solução garantida, troca de peças com reações em cadeia, metas, movimentos, desfazer, dica, estrelas, mapa de fases, livro de receitas e ajustes — com a arte e o layout do protótipo do Lovable.

**Architecture:** Núcleo de regras em TypeScript puro (`src/core/`, sem Phaser, 100% testado com Vitest): receitas, motor de reações, estado da partida, currículo, gerador e dica. Camada visual em Phaser 3 (`src/scenes/`) que só desenha estados e eventos devolvidos pelo núcleo. Persistência e anúncios atrás de interfaces (`Storage`, `AdService`) com implementações de navegador/falsas agora e Capacitor/AdMob no Plano 2.

**Tech Stack:** TypeScript 5, Vite 5, Phaser 3.90, Vitest 2, Playwright (já instalado no ambiente) para testes de fumaça.

**Spec:** `docs/superpowers/specs/2026-11-18-alquimia-em-cadeia-design.md` (aprovado). Referência visual: `docs/design/prototipo-lovable/README.md`.

**Fora deste plano (Plano 2):** laboratório livre, desafio diário, Presente do dia, AdMob real + consentimento UMP + intersticial, empacotamento Android/Capacitor, publicação.

## Global Constraints

- Sem sorte durante a fase: nada é sorteado depois que a fase começa; mesmo estado + mesmo movimento → mesmo resultado (spec §5.3).
- Nada cai do céu: casas esvaziadas são preenchidas só por gravidade das peças de cima (decisão do dono, spec §5.3).
- Toda fase mostrada tem solução dentro do limite de movimentos (spec §6.2).
- Fase N é igual para todos os jogadores; fases nunca se repetem (spec §5.6.1, §6.2).
- Dica revela só o próximo movimento (spec §6.3).
- +3 movimentos: no máximo 1 vez por fase; vitória que usou isso vale no máximo 1 estrela (spec §7).
- Desfazer: 1 grátis por fase, depois via anúncio, sem limite (spec §7).
- Dica: 3 iniciais (protótipo) + 1 grátis por dia; depois via anúncio, sem limite (spec §7).
- Retrato, uma mão, tocar-tocar para trocar; alvos de toque ≥ 48 px CSS na largura 360 (spec §3).
- Funciona offline: fonte e imagens empacotadas localmente, nenhuma chamada de rede no jogo (spec §3).
- Fechar a qualquer momento não perde nada (spec §3).
- Textos em pt-BR num único arquivo `src/i18n/pt-BR.ts` (spec §3).
- Visual: pixel art do protótipo, fonte Pixelify Sans, cores de `docs/design/prototipo-lovable/tema.css` (spec §8.1).
- Fonte única das receitas: `src/data/receitas.csv` (movida de `docs/design/receitas.csv`).

## Decisões de implementação deste plano

Pontos que a spec deixou para o construtor (§9), decididos aqui:

1. **Receitas ativas por fase.** Cada fase tem um conjunto pequeno de receitas ativas (2–6), mostrado numa legenda acima do tabuleiro; só elas reagem. Sem isso, com os 4 elementos base todos reagindo entre si (inclusive água+água), nenhum tabuleiro inicial ficaria parado. A receita nova da fase aparece na legenda como `? + ? = ?` até acontecer.
2. **Ordem de resolução:** a cada passo, varrer as casas em ordem de leitura (linha, depois coluna); para cada casa, testar o vizinho da direita e depois o de baixo; um par só reage se nenhuma das duas casas já reagiu neste passo.
3. **Onde fica o resultado:** no primeiro passo após a troca, se o par contém a casa de destino da peça tocada primeiro (`to`), o resultado fica em `to`; senão, se contém `from`, fica em `from`. Nos demais casos (cascata): par vertical → casa de baixo; par horizontal → casa da esquerda. A outra casa esvazia.
4. **Coleta:** se o resultado é um elemento de meta ainda não cumprida, ele é coletado (casa esvazia, contador sobe) no mesmo passo.
5. **Gravidade:** por coluna, peças caem até a parede (`#`) ou fundo mais próximo; paredes não se movem.
6. **Gerador por jogada de ida:** gerar tabuleiro inicial estável (sem pares ativos vizinhos), jogar uma sequência semeada de trocas que causam reações, e definir a meta a partir do que essa sequência produziu. A sequência é a solução guardada → solubilidade garantida por construção.
7. **Dica:** se o estado atual é prefixo da solução guardada, devolver o próximo movimento dela; senão, busca em profundidade limitada (profundidade = movimentos restantes, máx. 4, orçamento 250 ms); sem resultado → sugerir desfazer.

## Review Focus

1. Fechar o app no meio de uma cascata animada → ao voltar, a fase está no estado final daquele movimento (o núcleo salva o estado resolvido, não o quadro da animação). Teste na Task 8 e Task 9.
2. Tocar rápido várias vezes durante a animação → só um movimento é aplicado; entrada bloqueada até a animação acabar. Teste na Task 9.
3. Pedir dica num estado sem solução → resposta `{kind:'undo'}` em menos de 300 ms, sem travar. Teste na Task 7.
4. Gerar a fase num celular fraco → cada fase das 1–200 gera em < 150 ms no Node (orçamento ~4× para aparelho de entrada). Teste na Task 6.
5. Tela estreita (320×568) e alta (412×915) → tabuleiro 7×8 inteiro visível, sem rolagem horizontal, botões do rodapé visíveis. Teste na Task 10.

---

## Estrutura de arquivos

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, index.html
public/assets/elementos/*.png      # arte do protótipo (agua, pedra, fogo, planta, barro, tijolo, vapor, flor, casinha, arcoiris)
public/assets/fundo-vila.webp, public/assets/mascote-frasco.png
public/fonts/PixelifySans.woff2    # OFL, empacotada para offline
src/data/receitas.csv              # fonte única das receitas
src/core/types.ts                  # tipos compartilhados
src/core/rng.ts                    # PRNG semeado
src/core/recipes.ts                # leitura do CSV → RecipeBook
src/core/board.ts                  # tabuleiro, gravidade, troca
src/core/engine.ts                 # resolução de reações (applyMove)
src/core/game.ts                   # estado da partida, metas, estrelas, desfazer, +3
src/core/curriculum.ts             # parâmetros da fase N
src/core/generator.ts              # geração de fases
src/core/hint.ts                   # dica
src/core/progress.ts               # progresso salvo
src/platform/storage.ts            # interface Storage + LocalStorage
src/platform/ads.ts                # interface AdService + FakeAdService
src/i18n/pt-BR.ts                  # textos
src/ui/theme.ts                    # cores, fonte, cor por elemento
src/scenes/BootScene.ts, HomeScene.ts, GameScene.ts, BookScene.ts, SettingsOverlay.ts
src/main.ts                        # Phaser.Game
tests/core/*.test.ts               # Vitest
tests/e2e/*.spec.ts                # Playwright (fumaça)
```

## Tipos compartilhados (`src/core/types.ts`, criados na Task 2 e usados por todas)

```ts
export type ElementId = string;                  // slug: 'agua', 'barro', 'pocao-da-cura'
export type Cell = ElementId | null | '#';       // null = vazio, '#' = parede
export interface Pos { r: number; c: number }
export interface Board { rows: number; cols: number; cells: Cell[] }   // linha a linha
export interface ElementDef { id: ElementId; name: string; emoji: string; tier: number; kind: string; art?: string }
export interface Recipe { key: string; a: ElementId; b: ElementId; result: ElementId; tier: number; logic: string }
export interface Goal { element: ElementId; count: number }
export interface Move { from: Pos; to: Pos }
export interface Level {
  number: number; seed: number; board: Board; goals: Goal[]; moves: number;
  active: string[];            // Recipe.key ativas nesta fase
  newRecipe?: string;          // Recipe.key introduzida nesta fase
  solution: Move[];            // solução guardada pelo gerador
  fingerprint: string;
}
export interface ReactionEvent { a: Pos; b: Pos; at: Pos; recipe: string; collected: boolean }
export interface FallEvent { from: Pos; to: Pos }
export interface StepEvents { reactions: ReactionEvent[]; falls: FallEvent[] }
export interface MoveResult { board: Board; steps: StepEvents[]; collected: Record<ElementId, number>; newlySeen: string[] }
```

---

### Task 1: Projeto, dados e arte

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `tests/core/smoke.test.ts`
- Move: `docs/design/receitas.csv` → `src/data/receitas.csv` (git mv); deixar em `docs/design/README-receitas.md` uma linha apontando para o novo caminho
- Copy: `docs/design/prototipo-lovable/imagens/{agua,pedra,fogo,planta,barro,tijolo,vapor,flor,casinha,arcoiris}.png` → `public/assets/elementos/`; `fundo-vila.webp`, `mascote-frasco.png` → `public/assets/`
- Create: `public/fonts/PixelifySans.woff2` (baixar do Google Fonts, licença OFL; salvar `public/fonts/OFL.txt`)
- Modify: `.gitignore` (node_modules, dist)

**Interfaces:**
- Produces: scripts `npm test` (vitest run), `npm run dev` (vite, porta 5173), `npm run build`, `npm run e2e` (playwright test --trace off).

- [ ] **Step 1:** Criar o projeto com dependências fixas: `phaser@3.90.0`, `typescript@5.6.3`, `vite@5.4.11`, `vitest@2.1.8`, `@playwright/test` na versão já instalada no ambiente (`node -e "console.log(require('playwright/package.json').version)"`). Vite com `assetsInclude: ['**/*.csv']` e import `?raw` para o CSV.
- [ ] **Step 2:** Teste `tests/core/smoke.test.ts`: importa `src/data/receitas.csv?raw` e afirma que tem 60 linhas não vazias (cabeçalho + 4 base + 55 receitas).
- [ ] **Step 3:** `npm test` → PASS; `npm run build` → sai com código 0.
- [ ] **Step 4:** `src/main.ts` cria um `Phaser.Game` 390×844, `scale.mode = FIT`, `autoCenter = CENTER_BOTH`, fundo `#7fc4ea`, com uma cena vazia. `npm run dev` + abrir no Playwright mostra canvas sem erro no console.
- [ ] **Step 5:** Commit `chore: scaffold Phaser+Vite project with recipe data and prototype art`.

### Task 2: Receitas (`recipes.ts`) e tipos

**Files:** Create `src/core/types.ts` (bloco acima), `src/core/recipes.ts`; Test `tests/core/recipes.test.ts`

**Interfaces:**
- Produces:
  - `slug(name: string): ElementId` — minúsculas, sem acento, espaços→`-` (`'Arco-íris'`→`'arco-iris'`, `'Poção da Cura'`→`'pocao-da-cura'`, `'Broto'`→`'broto'`).
  - `class RecipeBook { constructor(csv: string); elements: Map<ElementId, ElementDef>; recipes: Recipe[]; byKey(key): Recipe; find(a: ElementId, b: ElementId, active?: ReadonlySet<string>): Recipe | undefined; base(): ElementId[]; unlockOrder(): string[] }`
  - `Recipe.key` = `${a}+${b}` com `a <= b` em ordem alfabética.
  - `unlockOrder()` = chaves ordenadas por `tier`, depois pela ordem de linha no CSV.
  - `ElementDef.art` = nome do arquivo em `public/assets/elementos/` quando `arte_pronta = sim` e a imagem existe (Broto→`planta.png`, Arco-íris→`arcoiris.png`); senão `undefined`.

- [ ] **Step 1: Testes**
```ts
test('carrega 59 elementos e 55 receitas', () => { expect(book.elements.size).toBe(59); expect(book.recipes.length).toBe(55) })
test('base são os 4 elementos do protótipo', () => expect(book.base().sort()).toEqual(['agua','broto','fogo','pedra']))
test('find é simétrico', () => { expect(book.find('pedra','agua')!.result).toBe('barro'); expect(book.find('agua','pedra')!.result).toBe('barro') })
test('par igual funciona', () => expect(book.find('tijolo','tijolo')!.result).toBe('casinha'))
test('find respeita conjunto ativo', () => expect(book.find('agua','pedra', new Set(['agua+fogo']))).toBeUndefined())
test('unlockOrder começa pelas receitas de nível 1 na ordem do CSV', () => expect(book.unlockOrder().slice(0,3)).toEqual(['agua+pedra','agua+fogo','agua+broto']))
test('arte do Broto é planta.png', () => expect(book.elements.get('broto')!.art).toBe('planta.png'))
```
- [ ] **Step 2:** `npm test -- recipes` → FAIL.
- [ ] **Step 3:** Implementar `recipes.ts` (parser CSV que respeita campos entre aspas).
- [ ] **Step 4:** `npm test -- recipes` → PASS.
- [ ] **Step 5:** Commit `feat(core): recipe book from CSV`.

### Task 3: Tabuleiro e motor de reações

**Files:** Create `src/core/rng.ts`, `src/core/board.ts`, `src/core/engine.ts`; Test `tests/core/engine.test.ts`

**Interfaces:**
- Produces:
  - `rng.ts`: `mulberry32(seed: number): () => number`; `hashString(s: string): number`.
  - `board.ts`: `parseBoard(rows: string[], legend: Record<string, ElementId>): Board` (para testes: `'.'`=vazio, `'#'`=parede, letra=elemento); `get(b, p)`, `set(b, p, v)` (imutável, devolve novo Board); `isAdjacent(p, q): boolean`; `swap(b, m: Move): Board`; `applyGravity(b): { board: Board; falls: FallEvent[] }`; `hasActivePair(b, book, active): boolean`; `boardKey(b): string`.
  - `engine.ts`: `applyMove(b: Board, m: Move, book: RecipeBook, active: ReadonlySet<string>, wanted: Record<ElementId, number>): MoveResult` — implementa as decisões 2–5. `wanted` = quanto falta de cada meta; `collected` no resultado conta o coletado neste movimento; `newlySeen` = chaves das receitas que reagiram. Lança erro se `m` não for vizinho ou envolver parede/vazio. Limite de 100 passos.

- [ ] **Step 1: Testes** (legenda `A=agua P=pedra F=fogo B=broto R=barro T=tijolo`, ativo `{agua+pedra, barro+fogo}` salvo indicação):
```ts
test('troca que forma par reage e resultado fica no destino', ...)      // ['APB'] ativo só {agua+pedra}: swap from (0,1) to (0,0) → P em (0,0) com A em (0,1) → barro em (0,0) (destino) → ['R.B'], 1 passo
test('troca sem reação é permitida e só troca', ...)
test('cadeia: barro criado ao lado de fogo vira tijolo no passo seguinte', ...) // ['AFP'] swap from (0,2) to (0,1) → A P F → barro em (0,1) → barro+fogo, par horizontal → tijolo na esquerda (0,1) → ['.T.'], steps.length === 2
test('gravidade: peça acima de casa vazia cai; parede segura', ...)
test('gravidade gera cascata', ...)                                       // queda junta A e P → reação no passo 2
test('casa não reage duas vezes no mesmo passo (ordem de leitura)', ...)
test('resultado de meta é coletado e casa esvazia', ...)                  // wanted {barro:1} → collected.barro === 1, célula null
test('meta já cumprida não coleta', ...)                                  // wanted {barro:0}
test('receita inativa não reage', ...)
test('mesmo estado + mesmo movimento = mesmo resultado', ...)             // determinismo
test('movimento não vizinho lança erro', ...)
```
Cada teste escreve o tabuleiro com `parseBoard` e afirma o tabuleiro final com `parseBoard` esperado e o número de passos.
- [ ] **Step 2:** `npm test -- engine` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -- engine` → PASS.
- [ ] **Step 5:** Commit `feat(core): deterministic reaction engine with gravity cascades`.

### Task 4: Estado da partida

**Files:** Create `src/core/game.ts`; Test `tests/core/game.test.ts`

**Interfaces:**
- Consumes: `applyMove`, `Level`, `RecipeBook`.
- Produces:
```ts
export interface GameState {
  levelNumber: number; board: Board; movesLeft: number; collected: Record<ElementId, number>;
  history: { board: Board; movesLeft: number; collected: Record<ElementId, number> }[];
  freeUndoUsed: boolean; extraMovesUsed: boolean; seen: string[];   // receitas vistas nesta fase
  status: 'playing' | 'won' | 'lost';
}
export function newGame(level: Level): GameState
export function play(s: GameState, m: Move, level: Level, book: RecipeBook): { state: GameState; result: MoveResult }
export function undo(s: GameState): GameState                 // lança se history vazio
export function canUndoFree(s: GameState): boolean            // !freeUndoUsed
export function addExtraMoves(s: GameState): GameState        // +3, movesLeft, status 'lost'→'playing'; lança se extraMovesUsed
export function stars(s: GameState, level: Level): 0 | 1 | 2 | 3
```
- Regras: vitória quando `collected[g.element] >= g.count` para todas as metas (checado após cada movimento); derrota quando `movesLeft === 0` sem vitória. `undo` marca `freeUndoUsed = true` (a cena decide se pede anúncio). Estrelas: 3 se sobrou ≥ 2 movimentos, 2 se sobrou 1, 1 se sobrou 0; no máximo 1 se `extraMovesUsed`; 0 se não venceu.

- [ ] **Step 1: Testes:** `vitória ao cumprir metas`, `derrota ao zerar movimentos`, `undo restaura tabuleiro, movimentos e coletados`, `undo de vitória volta a playing`, `addExtraMoves só uma vez`, `addExtraMoves reabre fase perdida`, `estrelas por movimentos que sobraram`, `vitória com +3 vale no máximo 1 estrela`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(core): game state, undo, extra moves, stars`.

### Task 5: Currículo

**Files:** Create `src/core/curriculum.ts`; Test `tests/core/curriculum.test.ts`

**Interfaces:**
- Produces:
```ts
export interface LevelParams { number: number; rows: number; cols: number; unlocked: string[]; newRecipe?: string;
  activeCount: number; playoutMoves: number; slack: number; walls: number }
export function paramsFor(n: number, book: RecipeBook): LevelParams
```
- Valores:
  - Receita nova nas fases 1, 2, 4, 6, 8 e depois a cada 3 fases (11, 14, 17…), seguindo `unlockOrder()`; só desbloqueia receita cujos ingredientes já são base ou resultado de receita desbloqueada (pular e voltar depois se não).
  - Tamanho: fases 1–5 → 5×5; 6–20 → 6×6; 21–60 → 6×7; 61+ → 7×8.
  - `activeCount`: min(2 + ⌊n/8⌋, 6, unlocked.length).
  - `playoutMoves`: 2 nas fases 1–5, 3 até 20, 4 até 60, 5 depois.
  - `slack`: 3 nas fases 1–5, 2 até 20, 1 até 40, 0 depois; a cada 5ª fase (respiro) +2.
  - `walls`: 0 até 20; depois ⌊(n-20)/20⌋ + 1, máx. 6.

- [ ] **Step 1: Testes:** `fase 1 introduz agua+pedra`, `fase 3 não introduz receita`, `receita só desbloqueia com ingredientes disponíveis`, `tamanhos por faixa`, `fase 25 é respiro com slack maior`, `paramsFor é puro (mesmo n → mesmo resultado)`, `até a fase 300 todas as 55 receitas foram desbloqueadas`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(core): level curriculum`.

### Task 6: Gerador de fases

**Files:** Create `src/core/generator.ts`; Test `tests/core/generator.test.ts`

**Interfaces:**
- Consumes: `paramsFor`, `applyMove`, `mulberry32`, `hashString`, `hasActivePair`, `boardKey`.
- Produces: `generateLevel(n: number, book: RecipeBook, seen?: Set<string>): Level`.
- Algoritmo (decisão 6):
  1. `seed = hashString('alquimia:' + n)`; tentar com `seed`, `seed+1`, … até 200 tentativas.
  2. Ativas = `newRecipe` (se houver) + receitas desbloqueadas sorteadas até `activeCount`.
  3. Elementos que podem aparecer no tabuleiro inicial = base ∪ resultados de receitas desbloqueadas que são ingredientes das ativas (permite peças intermediárias pré-colocadas a partir da fase 20).
  4. Preencher de baixo para cima, deixando 0–1 linha vazia no topo, com paredes em posições sorteadas; rejeitar a casa se formar par ativo com vizinho já colocado.
  5. Jogada de ida: `playoutMoves` vezes, escolher (semeado) um movimento entre os que causam ≥ 1 reação; preferir o que gera o resultado de maior `tier`. Se nenhum movimento reage, nova tentativa.
  6. Meta = o resultado de maior tier produzido na jogada (contagem produzida, máx. 4); se `newRecipe`, a meta inclui o resultado dela. Repetir a jogada com `wanted` = meta para confirmar que vence; `moves = movimentos usados + slack`.
  7. `fingerprint = boardKey(board) + '|' + JSON.stringify(goals)`; rejeitar se estiver em `seen`.

- [ ] **Step 1: Testes:**
```ts
test('determinístico', () => expect(generateLevel(7, book)).toEqual(generateLevel(7, book)))
test('tabuleiro inicial parado', () => { for (let n = 1; n <= 200; n++) expect(hasActivePair(generateLevel(n, book).board, book, new Set(generateLevel(n, book).active))).toBe(false) })
test('solução guardada vence a fase', () => { for (let n = 1; n <= 200; n++) { /* replay level.solution com play() → status 'won' */ } })
test('fase com receita nova tem a receita nova entre as ativas e na meta', ...)
test('200 primeiras fases têm fingerprints únicos', ...)
test('cada fase 1–200 gera em < 150 ms', ...)   // Review Focus 4
```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(core): seeded level generator with guaranteed solution`.

### Task 7: Dica

**Files:** Create `src/core/hint.ts`; Test `tests/core/hint.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Level`, `play`, `applyMove`.
- Produces: `type Hint = { kind: 'move'; move: Move } | { kind: 'undo' }`; `getHint(s: GameState, level: Level, book: RecipeBook, budgetMs = 250): Hint` (decisão 7; a busca enumera todas as trocas vizinhas válidas, poda estados repetidos por `boardKey`+coletados).

- [ ] **Step 1: Testes:** `no início devolve o 1º movimento da solução`, `após seguir a solução 1 passo devolve o 2º`, `fora da solução encontra movimento que ainda vence (replay vence)`, `estado sem solução devolve undo em < 300 ms` (Review Focus 3), `nunca devolve mais de um movimento`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(core): one-step hint`.

### Task 8: Progresso salvo

**Files:** Create `src/platform/storage.ts`, `src/core/progress.ts`; Test `tests/core/progress.test.ts`

**Interfaces:**
- Produces:
  - `interface Storage { get(key: string): string | null; set(key: string, v: string): void }`; `class LocalStorage implements Storage` (try/catch, cai para memória); `class MemoryStorage implements Storage`.
  - ```ts
    export interface Progress { version: 1; currentLevel: number; stars: Record<number, number>; discovered: string[];
      hints: number; lastFreeHintDay: string; inProgress?: GameState;
      settings: { sound: boolean; vibration: boolean; leftHanded: boolean } }
    export function loadProgress(st: Storage): Progress           // chave 'alquimia.save.v1'; padrão: currentLevel 1, hints 3, settings todos true exceto leftHanded false
    export function saveProgress(st: Storage, p: Progress): void
    export function grantDailyHint(p: Progress, today: string): Progress   // +1 se today !== lastFreeHintDay; today = 'AAAA-MM-DD' local
    export function recordWin(p: Progress, level: number, stars: number, seen: string[]): Progress  // guarda melhor estrela, currentLevel = max(currentLevel, level+1), discovered ∪ seen, limpa inProgress
    export function recordSeen(p: Progress, seen: string[]): Progress
    ```

- [ ] **Step 1: Testes:** `progresso padrão`, `save/load ida e volta`, `JSON corrompido volta ao padrão sem lançar`, `dica diária só uma vez por dia`, `recordWin mantém a melhor estrela`, `inProgress salvo é restaurado igual` (Review Focus 1, parte do núcleo).
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS. **Step 5:** Commit `feat(core): saved progress`.

### Task 9: Tela da fase (Phaser)

**Files:** Create `src/platform/ads.ts`, `src/i18n/pt-BR.ts`, `src/ui/theme.ts`, `src/scenes/BootScene.ts`, `src/scenes/GameScene.ts`; Modify `src/main.ts`; Test `tests/e2e/game.spec.ts`

**Interfaces:**
- Consumes: tudo de `src/core/`, `Progress`.
- Produces:
  - `interface AdService { showRewarded(reason: 'undo' | 'extra-moves' | 'hint'): Promise<boolean> }`; `class FakeAdService` mostra o diálogo de prévia do protótipo ("Seu anúncio aparece aqui", contagem de 2 s) e resolve `true`.
  - `theme.ts`: cores do `tema.css` convertidas para hex; `elementColor(id): { fill: number; shade: number }` — as 10 do protótipo pelo `--el-*`, as demais por matiz derivada de `hashString(id)` (luminosidade/croma iguais aos do protótipo).
  - `GameScene` recebe `{ levelNumber }`; expõe `window.__game = { state, level, tap(r,c) }` só em `import.meta.env.DEV` para o Playwright.
- Layout (igual a `docs/design/prototipo-lovable/telas/fase.png`): topo com voltar, "Fase N", ajustes; painel MOVIMENTOS / OBJETIVO (ícone + contador + barra) / PONTOS (pontos = 10 por reação × passo da cadeia); **legenda das receitas ativas** (`💧 + 🪨 = 🟤`, receita nova como `? + ? = ?`); tabuleiro em moldura de madeira com borda de grama; rodapé: livro, "+3 movimentos · ver anúncio" (só ao perder, ou sempre visível desabilitado — seguir protótipo: sempre visível, ativo só se `!extraMovesUsed`), "Dica · N restantes", "Desfazer" (grátis 1×, depois ícone de anúncio). Peças com arte usam PNG; sem arte, quadrado com `elementColor` + emoji.
- Comportamento: tocar peça seleciona (contorno), tocar vizinha troca, tocar outra não vizinha muda a seleção; animação por `StepEvents` (troca 120 ms, reação 180 ms com brilho, queda 140 ms por casa); entrada bloqueada durante animação; ao revelar receita nova, cartão "🔥 + 💨 = Fumaça · descoberta!"; vitória: celebração com estrelas e "Próxima fase"; derrota: "+3 movimentos (anúncio)" (se disponível) ou "Tentar de novo". Salvar `inProgress` após cada movimento resolvido e ao `visibilitychange` oculto.

- [ ] **Step 1: Testes Playwright** (servidor `npm run dev`, viewport 390×844):
```ts
test('fase 1 abre com tabuleiro, metas e legenda', ...)                // screenshot tests/e2e/__shots__/fase1.png
test('seguir a solução guardada vence a fase 1', ...)                   // usa __game.level.solution + __game.tap
test('toques rápidos durante animação aplicam um movimento só', ...)    // Review Focus 2: 6 taps em 100 ms → movesLeft caiu 1
test('recarregar a página no meio da fase restaura o estado', ...)       // Review Focus 1
test('dica destaca duas casas vizinhas', ...)
```
- [ ] **Step 2:** `npm run e2e -- game` → FAIL.
- [ ] **Step 3:** Implementar `BootScene` (carrega imagens e fonte, depois `HomeScene`/`GameScene`) e `GameScene`.
- [ ] **Step 4:** `npm run e2e -- game` → PASS; abrir o screenshot e conferir contra `fase.png`.
- [ ] **Step 5:** Commit `feat(ui): playable level scene`.

### Task 10: Início, livro de receitas e ajustes

**Files:** Create `src/scenes/HomeScene.ts`, `src/scenes/BookScene.ts`, `src/scenes/SettingsOverlay.ts`; Test `tests/e2e/screens.spec.ts`

**Interfaces:**
- Consumes: `Progress`, `RecipeBook`, `GameScene`.
- Layout (iguais a `telas/inicio.png`, `receitas.png`, `ajustes.png`):
  - **Início:** "N dicas" (sup. esq.), ajustes (sup. dir.), mascote, logo "ALQUIMIA / em Cadeia", faixa "💧 + 🪨 = 🟤 e o que mais?", botão verde "▶ JOGAR · Fase N" (continua `inProgress` se houver), "Receitas X/55", e no lugar de "Presente" um **mapa de fases**: faixa horizontal rolável com as últimas 10 fases e suas estrelas, tocáveis para rejogar. (Presente do dia entra no Plano 2.)
  - **Livro:** "X de 55 descobertas", grade por nível; descoberta mostra `A + B = R` com arte/emoji e a `logica` do CSV; não descoberta mostra `? + ? = ainda secreta`.
  - **Ajustes:** Sons, Vibração, Modo canhoto (inverte a ordem dos botões do rodapé da fase); salva em `Progress.settings`.
- Ao abrir o app: `grantDailyHint(progress, hoje)`.

- [ ] **Step 1: Testes Playwright:** `início mostra Fase atual e contador de receitas`, `JOGAR abre a fase atual`, `livro lista 55 entradas e mostra descobertas após vencer a fase 1`, `modo canhoto inverte o rodapé`, `em 320×568 e 412×915 o tabuleiro 7×8 cabe sem rolagem horizontal e o rodapé fica visível` (Review Focus 5; abrir fase 61).
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** PASS; conferir screenshots com o protótipo.
- [ ] **Step 5:** Commit `feat(ui): home, recipe book and settings`.

### Task 11: Verificação final

- [ ] **Step 1:** `npm test` → todos PASS; `npm run e2e` → todos PASS; `npm run build` → OK.
- [ ] **Step 2:** Abrir o build (`npx vite preview`) com o Playwright em 390×844, jogar as fases 1–3 pela solução guardada, salvar screenshots de início, fase, vitória e livro em `docs/design/capturas-plano-1/`.
- [ ] **Step 3:** Commit `docs: plan 1 screenshots` e push.
