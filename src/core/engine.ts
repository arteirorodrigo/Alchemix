import type { Board, ElementId, Move, MoveResult, Pos, ReactionEvent, StepEvents } from './types'
import type { RecipeBook } from './recipes'
import { applyGravity, set, swap } from './board'

const MAX_STEPS = 100

const same = (p: Pos, q: Pos) => p.r === q.r && p.c === q.c

interface Pair { a: Pos; b: Pos; vertical: boolean; key: string }

// Decisão 2: leitura por linha/coluna; testa direita, depois baixo; casa usada não reage de novo.
function findPairs(b: Board, book: RecipeBook, active: ReadonlySet<string>): Pair[] {
  const used = new Set<number>()
  const pairs: Pair[] = []
  const el = (r: number, c: number) => {
    if (r >= b.rows || c >= b.cols || used.has(r * b.cols + c)) return null
    const v = b.cells[r * b.cols + c]
    return v === null || v === '#' ? null : v
  }
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = el(r, c)
      if (v === null) continue
      for (const vertical of [false, true]) {
        const [nr, nc] = vertical ? [r + 1, c] : [r, c + 1]
        const w = el(nr, nc)
        if (w === null) continue
        const recipe = book.find(v, w, active)
        if (!recipe) continue
        used.add(r * b.cols + c)
        used.add(nr * b.cols + nc)
        pairs.push({ a: { r, c }, b: { r: nr, c: nc }, vertical, key: recipe.key })
        break
      }
    }
  }
  return pairs
}

export function applyMove(
  b: Board,
  m: Move,
  book: RecipeBook,
  active: ReadonlySet<string>,
  wanted: Record<ElementId, number>,
): MoveResult {
  let board = swap(b, m)
  const remaining: Record<ElementId, number> = { ...wanted }
  const collected: Record<ElementId, number> = {}
  const steps: StepEvents[] = []
  const seen: string[] = []

  for (let step = 0; step < MAX_STEPS; step++) {
    const pairs = findPairs(board, book, active)
    if (pairs.length === 0) break
    const reactions: ReactionEvent[] = []
    for (const pair of pairs) {
      let at: Pos
      if (step === 0 && (same(pair.a, m.to) || same(pair.b, m.to))) at = m.to
      else if (step === 0 && (same(pair.a, m.from) || same(pair.b, m.from))) at = m.from
      else at = pair.vertical ? pair.b : pair.a
      const other = same(at, pair.a) ? pair.b : pair.a
      const recipe = book.byKey(pair.key)
      const isGoal = (remaining[recipe.result] ?? 0) > 0
      board = set(board, other, null)
      if (isGoal) {
        remaining[recipe.result]--
        collected[recipe.result] = (collected[recipe.result] ?? 0) + 1
        board = set(board, at, null)
      } else {
        board = set(board, at, recipe.result)
      }
      if (!seen.includes(pair.key)) seen.push(pair.key)
      reactions.push({ a: pair.a, b: pair.b, at, recipe: pair.key, collected: isGoal })
    }
    const g = applyGravity(board)
    board = g.board
    steps.push({ reactions, falls: g.falls })
  }
  return { board, steps, collected, newlySeen: seen }
}
