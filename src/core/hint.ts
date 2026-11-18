import type { Level, Move } from './types'
import type { RecipeBook } from './recipes'
import { boardKey, get } from './board'
import { newGame, play, type GameState } from './game'

export type Hint = { kind: 'move'; move: Move } | { kind: 'undo' } | { kind: 'unknown' }

const MAX_DEPTH = 4
const UNDO: Hint = { kind: 'undo' }
const UNKNOWN: Hint = { kind: 'unknown' }

function isElement(c: unknown): boolean {
  return typeof c === 'string' && c !== '#'
}

function validMoves(s: GameState): Move[] {
  const out: Move[] = []
  const { rows, cols } = s.board
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const from = { r, c }
      if (!isElement(get(s.board, from))) continue
      for (const to of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (to.r < rows && to.c < cols && isElement(get(s.board, to))) out.push({ from, to })
      }
    }
  }
  return out
}

function sameProgress(a: GameState, b: GameState): boolean {
  return boardKey(a.board) === boardKey(b.board)
    && JSON.stringify(a.collected) === JSON.stringify(b.collected)
}

function onSolution(s: GameState, level: Level, book: RecipeBook): Move | undefined {
  const k = s.history.length
  if (k >= level.solution.length) return undefined
  let g = newGame(level)
  for (let i = 0; i < k; i++) g = play(g, level.solution[i], level, book).state
  return sameProgress(g, s) ? level.solution[k] : undefined
}

export function getHint(s: GameState, level: Level, book: RecipeBook, budgetMs = 250): Hint {
  if (s.status !== 'playing') return UNDO
  const stored = onSolution(s, level, book)
  if (stored) return { kind: 'move', move: stored }

  const deadline = performance.now() + budgetMs
  const visited = new Set<string>()
  let timedOut = false

  const dfs = (st: GameState, depth: number): boolean => {
    if (depth === 0) return false
    const key = `${boardKey(st.board)}|${JSON.stringify(st.collected)}|${depth}`
    if (visited.has(key)) return false
    visited.add(key)
    for (const m of validMoves(st)) {
      if (performance.now() > deadline) { timedOut = true; return false }
      const next = play(st, m, level, book).state
      if (next.status === 'won') return true
      if (next.status === 'playing' && dfs(next, depth - 1)) return true
      if (timedOut) return false
    }
    return false
  }

  const depth = Math.min(s.movesLeft, MAX_DEPTH)
  for (const m of validMoves(s)) {
    if (performance.now() > deadline) { timedOut = true; break }
    const next = play(s, m, level, book).state
    if (next.status === 'won') return { kind: 'move', move: m }
    if (next.status === 'playing' && depth > 1 && dfs(next, depth - 1)) return { kind: 'move', move: m }
    if (timedOut) break
  }
  // 'undo' só com prova exaustiva (busca completa dentro dos movimentos restantes) e algo a desfazer.
  const exhaustive = !timedOut && s.movesLeft <= MAX_DEPTH
  return exhaustive && s.history.length > 0 ? UNDO : UNKNOWN
}
