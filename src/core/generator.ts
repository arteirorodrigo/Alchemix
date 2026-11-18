import type { Board, Cell, ElementId, Goal, Level, Move, MoveResult } from './types'
import type { RecipeBook } from './recipes'
import { paramsFor, type LevelParams } from './curriculum'
import { applyMove } from './engine'
import { boardKey } from './board'
import { hashString, mulberry32 } from './rng'
import { newGame, play } from './game'

const MAX_ATTEMPTS = 200
const MAX_ACTIVE = 6
const MAX_GOAL_COUNT = 4
const CLOSED_UNTIL = 20 // antes desta fase as ativas são fechadas (sem peças intermediárias)
const GREEDY_P = 0.7

type Rng = () => number

const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)]

function shuffled<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- receitas ativas ----------

function producerOf(book: RecipeBook, unlocked: readonly string[], el: ElementId): string | undefined {
  return unlocked.find(k => book.byKey(k).result === el)
}

// Receitas que precisam entrar junto com `key` para que todo ingrediente não base
// seja produzido por outra ativa. undefined = impossível fechar com as desbloqueadas.
function closureOf(
  book: RecipeBook, unlocked: readonly string[], base: ReadonlySet<ElementId>, key: string, have: ReadonlySet<string>,
): string[] | undefined {
  const out: string[] = []
  const inSet = new Set(have)
  const stack = [key]
  while (stack.length) {
    const k = stack.pop()!
    if (inSet.has(k)) continue
    inSet.add(k)
    out.push(k)
    const r = book.byKey(k)
    for (const ing of [r.a, r.b]) {
      if (base.has(ing)) continue
      const prod = producerOf(book, unlocked, ing)
      if (!prod) return undefined
      stack.push(prod)
    }
  }
  return out
}

function chooseActive(rng: Rng, p: LevelParams, book: RecipeBook): string[] {
  const base = new Set(book.base())
  const closed = p.number < CLOSED_UNTIL
  const active: string[] = []
  const add = (k: string): boolean => {
    if (!closed) {
      if (active.includes(k)) return false
      active.push(k)
      return true
    }
    const extra = closureOf(book, p.unlocked, base, k, new Set(active))
    if (!extra || extra.length === 0) return false
    // a receita nova entra sempre; as demais só se couberem no limite
    if (k !== p.newRecipe && active.length + extra.length > MAX_ACTIVE) return false
    active.push(...extra)
    return true
  }
  if (p.newRecipe) add(p.newRecipe)
  for (const k of shuffled(rng, p.unlocked)) {
    if (active.length >= p.activeCount) break
    add(k)
  }
  return active
}

// Elementos que podem estar no tabuleiro inicial, com pesos.
function boardElements(
  p: LevelParams, book: RecipeBook, active: readonly string[],
): { el: ElementId; w: number }[] {
  const base = book.base()
  const ingredients = new Set<ElementId>()
  for (const k of active) { const r = book.byKey(k); ingredients.add(r.a); ingredients.add(r.b) }
  const out = base.map(el => ({ el, w: ingredients.has(el) ? 3 : 1 }))
  if (p.number >= CLOSED_UNTIL) {
    const results = new Set(p.unlocked.map(k => book.byKey(k).result))
    for (const el of ingredients) if (!base.includes(el) && results.has(el)) out.push({ el, w: 2 })
  }
  return out
}

// ---------- tabuleiro inicial ----------

function buildBoard(
  rng: Rng, p: LevelParams, book: RecipeBook, activeSet: ReadonlySet<string>,
  elements: { el: ElementId; w: number }[],
): Board | undefined {
  const { rows, cols } = p
  const cells: Cell[] = new Array(rows * cols).fill(null)
  // paredes em linhas 1..rows-1, nunca vizinhas entre si
  let placed = 0
  for (let tries = 0; placed < p.walls && tries < 500; tries++) {
    const r = 1 + Math.floor(rng() * (rows - 1))
    const c = Math.floor(rng() * cols)
    const i = r * cols + c
    if (cells[i] === '#') continue
    const near = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .some(([rr, cc]) => rr >= 0 && rr < rows && cc >= 0 && cc < cols && cells[rr * cols + cc] === '#')
    if (near) continue
    cells[i] = '#'
    placed++
  }
  if (placed < p.walls) return undefined
  const emptyTop = rng() < 0.5
  const lastRow = emptyTop ? 1 : 0
  // de baixo para cima; vizinhos já colocados: abaixo e à esquerda
  for (let r = rows - 1; r >= lastRow; r--) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      if (cells[i] === '#') continue
      const below = r + 1 < rows ? cells[i + cols] : null
      const left = c > 0 ? cells[i - 1] : null
      const ok = elements.filter(({ el }) =>
        !(typeof below === 'string' && below !== '#' && book.find(el, below, activeSet)) &&
        !(typeof left === 'string' && left !== '#' && book.find(el, left, activeSet)))
      if (ok.length === 0) return undefined
      const total = ok.reduce((s, e) => s + e.w, 0)
      let x = rng() * total
      let chosen = ok[ok.length - 1].el
      for (const e of ok) { x -= e.w; if (x < 0) { chosen = e.el; break } }
      cells[i] = chosen
    }
  }
  return { rows, cols, cells }
}

// ---------- jogada de ida ----------

const isEl = (v: Cell | undefined): v is ElementId => v !== null && v !== undefined && v !== '#'

// Tabuleiro parado: a troca reage sse uma das casas trocadas forma par ativo com um vizinho.
function swapReacts(b: Board, i: number, j: number, book: RecipeBook, active: ReadonlySet<string>): boolean {
  const { cols, rows, cells } = b
  const check = (at: number, val: ElementId, skip: number): boolean => {
    const r = Math.floor(at / cols), c = at % cols
    const ns = [r > 0 ? at - cols : -1, r < rows - 1 ? at + cols : -1, c > 0 ? at - 1 : -1, c < cols - 1 ? at + 1 : -1]
    for (const n of ns) {
      if (n < 0 || n === skip) continue
      const w = cells[n]
      if (isEl(w) && book.find(val, w, active)) return true
    }
    return false
  }
  return check(i, cells[j] as ElementId, j) || check(j, cells[i] as ElementId, i)
}

interface Candidate { move: Move; result: MoveResult; maxTier: number; triggersNew: boolean; produced: ElementId[] }

function reactingMoves(
  b: Board, book: RecipeBook, active: ReadonlySet<string>, newRecipe: string | undefined,
): Candidate[] {
  const out: Candidate[] = []
  const { rows, cols, cells } = b
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    if (!isEl(v)) continue
    const r = Math.floor(i / cols), c = i % cols
    for (const j of [c < cols - 1 ? i + 1 : -1, r < rows - 1 ? i + cols : -1]) {
      if (j < 0) continue
      const w = cells[j]
      if (!isEl(w) || w === v) continue
      if (!swapReacts(b, i, j, book, active)) continue
      const move: Move = { from: { r, c }, to: { r: Math.floor(j / cols), c: j % cols } }
      const result = applyMove(b, move, book, active, {})
      const produced: ElementId[] = []
      let maxTier = -1
      let triggersNew = false
      for (const s of result.steps) {
        for (const e of s.reactions) {
          const rec = book.byKey(e.recipe)
          produced.push(rec.result)
          maxTier = Math.max(maxTier, rec.tier)
          if (e.recipe === newRecipe) triggersNew = true
        }
      }
      out.push({ move, result, maxTier, triggersNew, produced })
    }
  }
  return out
}

function choose(rng: Rng, cands: Candidate[]): Candidate {
  if (rng() < GREEDY_P) {
    const top = Math.max(...cands.map(c => c.maxTier))
    return pick(rng, cands.filter(c => c.maxTier === top))
  }
  return pick(rng, cands)
}

// ---------- tentativa ----------

function replay(level: Level, moves: Move[], book: RecipeBook): { collected: Record<ElementId, number>; wonAt: number } {
  let s = newGame(level)
  for (let i = 0; i < moves.length; i++) {
    try {
      s = play(s, moves[i], level, book).state
    } catch {
      break // a coleta mudou o tabuleiro e a troca deixou de ser válida
    }
    if (s.status === 'won') return { collected: s.collected, wonAt: i + 1 }
    if (s.status !== 'playing') break
  }
  return { collected: s.collected, wonAt: -1 }
}

function attempt(n: number, seed: number, p: LevelParams, book: RecipeBook): Level | undefined {
  const rng = mulberry32(seed)
  const active = chooseActive(rng, p, book)
  if (p.newRecipe && !active.includes(p.newRecipe)) return undefined
  if (active.length === 0) return undefined
  const activeSet = new Set(active)
  const initial = buildBoard(rng, p, book, activeSet, boardElements(p, book, active))
  if (!initial) return undefined

  // jogada de ida
  let board = initial
  const moves: Move[] = []
  const produced = new Map<ElementId, number>() // ordem de primeira produção
  let newTriggered = false
  for (let k = 0; k < p.playoutMoves; k++) {
    let cands = reactingMoves(board, book, activeSet, p.newRecipe)
    if (cands.length === 0) break
    if (p.newRecipe && !newTriggered) {
      const withNew = cands.filter(c => c.triggersNew)
      if (withNew.length) cands = withNew
    }
    const ch = choose(rng, cands)
    moves.push(ch.move)
    board = ch.result.board
    newTriggered ||= ch.triggersNew
    for (const el of ch.produced) produced.set(el, (produced.get(el) ?? 0) + 1)
  }
  if (moves.length === 0) return undefined
  if (p.newRecipe && !newTriggered) return undefined

  // metas
  const tier = (el: ElementId) => book.elements.get(el)!.tier
  let top: ElementId | undefined
  for (const [el, cnt] of produced) {
    if (top === undefined || tier(el) > tier(top) || (tier(el) === tier(top) && cnt > produced.get(top)!)) top = el
  }
  const goals: Goal[] = [{ element: top!, count: Math.min(produced.get(top!)!, MAX_GOAL_COUNT) }]
  const newResult = p.newRecipe ? book.byKey(p.newRecipe).result : undefined
  if (newResult && newResult !== top) {
    goals.push({ element: newResult, count: Math.min(produced.get(newResult) ?? 1, MAX_GOAL_COUNT) })
  }

  const draft = (gs: Goal[], solution: Move[], moveCount: number): Level => {
    const lv: Level = {
      number: n, seed, board: initial, goals: gs, moves: moveCount, active,
      solution, fingerprint: boardKey(initial) + '|' + JSON.stringify(gs),
    }
    if (p.newRecipe) lv.newRecipe = p.newRecipe
    return lv
  }

  // repetir com coleta real; aparar metas ao que foi coletado
  const first = replay(draft(goals, moves, moves.length), moves, book)
  const trimmed = goals.map(g => ({ element: g.element, count: Math.min(g.count, first.collected[g.element] ?? 0) }))
  if (trimmed.some(g => g.count === 0)) return undefined
  const check = replay(draft(trimmed, moves, moves.length), moves, book)
  if (check.wonAt < 0) return undefined
  const solution = moves.slice(0, check.wonAt)
  return draft(trimmed, solution, solution.length + p.slack)
}

export function generateLevel(n: number, book: RecipeBook, seen?: Set<string>): Level {
  const p = paramsFor(n, book)
  const seed0 = hashString('alquimia:' + n)
  for (let k = 0; k < MAX_ATTEMPTS; k++) {
    const lv = attempt(n, (seed0 + k) >>> 0, p, book)
    if (lv && !(seen && seen.has(lv.fingerprint))) return lv
  }
  throw new Error(`Não foi possível gerar a fase ${n} após ${MAX_ATTEMPTS} tentativas`)
}
