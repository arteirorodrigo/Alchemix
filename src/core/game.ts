import type { Board, ElementId, Level, Move, MoveResult } from './types'
import type { RecipeBook } from './recipes'
import { applyMove } from './engine'

interface Snapshot { board: Board; movesLeft: number; collected: Record<ElementId, number> }

export interface GameState {
  levelNumber: number
  board: Board
  movesLeft: number
  collected: Record<ElementId, number>
  history: Snapshot[]
  freeUndoUsed: boolean
  extraMovesUsed: boolean
  seen: string[]
  status: 'playing' | 'won' | 'lost'
}

export function newGame(level: Level): GameState {
  return {
    levelNumber: level.number, board: level.board, movesLeft: level.moves, collected: {},
    history: [], freeUndoUsed: false, extraMovesUsed: false, seen: [], status: 'playing',
  }
}

export function play(
  s: GameState, m: Move, level: Level, book: RecipeBook,
): { state: GameState; result: MoveResult } {
  if (s.status !== 'playing') throw new Error('partida não está em andamento')
  const wanted: Record<ElementId, number> = {}
  for (const g of level.goals) wanted[g.element] = Math.max(0, g.count - (s.collected[g.element] ?? 0))
  const result = applyMove(s.board, m, book, new Set(level.active), wanted)
  const collected = { ...s.collected }
  for (const [e, n] of Object.entries(result.collected)) collected[e] = (collected[e] ?? 0) + n
  const seen = [...s.seen]
  for (const k of result.newlySeen) if (!seen.includes(k)) seen.push(k)
  const movesLeft = s.movesLeft - 1
  const won = level.goals.every((g) => (collected[g.element] ?? 0) >= g.count)
  const status = won ? 'won' : movesLeft === 0 ? 'lost' : 'playing'
  const state: GameState = {
    ...s,
    board: result.board,
    movesLeft,
    collected,
    history: [...s.history, { board: s.board, movesLeft: s.movesLeft, collected: s.collected }],
    seen,
    status,
  }
  return { state, result }
}

export function undo(s: GameState): GameState {
  if (s.history.length === 0) throw new Error('nada para desfazer')
  const last = s.history[s.history.length - 1]
  return {
    ...s, board: last.board, movesLeft: last.movesLeft, collected: last.collected,
    history: s.history.slice(0, -1), freeUndoUsed: true, status: 'playing',
  }
}

export function canUndoFree(s: GameState): boolean {
  return !s.freeUndoUsed
}

export function addExtraMoves(s: GameState): GameState {
  if (s.extraMovesUsed) throw new Error('movimentos extras já usados')
  return {
    ...s, movesLeft: s.movesLeft + 3, extraMovesUsed: true,
    status: s.status === 'lost' ? 'playing' : s.status,
  }
}

export function stars(s: GameState, _level: Level): 0 | 1 | 2 | 3 {
  if (s.status !== 'won') return 0
  const base = s.movesLeft >= 2 ? 3 : s.movesLeft === 1 ? 2 : 1
  return s.extraMovesUsed ? 1 : base
}
