import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { parseBoard } from '../../src/core/board'
import { newGame, play, type GameState } from '../../src/core/game'
import { generateLevel } from '../../src/core/generator'
import { getHint } from '../../src/core/hint'
import type { Level } from '../../src/core/types'

const book = new RecipeBook(csv)
const L = { A: 'agua', P: 'pedra', F: 'fogo', B: 'broto' }

describe('getHint', () => {
  test('no início devolve o 1º movimento da solução', () => {
    for (const n of [1, 5, 30]) {
      const lv = generateLevel(n, book)
      expect(getHint(newGame(lv), lv, book)).toEqual({ kind: 'move', move: lv.solution[0] })
    }
  })

  test('após seguir a solução 1 passo devolve o 2º', () => {
    for (const n of [5, 30]) {
      const lv = generateLevel(n, book)
      if (lv.solution.length < 2) continue
      const s = play(newGame(lv), lv.solution[0], lv, book).state
      if (s.status !== 'playing') continue
      expect(getHint(s, lv, book)).toEqual({ kind: 'move', move: lv.solution[1] })
    }
  })

  test('fora da solução encontra movimento que ainda vence (replay vence)', () => {
    const lv = generateLevel(30, book)
    // joga um movimento diferente do da solução e segue as dicas até vencer
    let s: GameState = newGame(lv)
    const wrong = { from: { r: 0, c: 0 }, to: { r: 0, c: 1 } } // verificado: != solução e ainda vencível
    expect(wrong).not.toEqual(lv.solution[0])
    s = play(s, wrong, lv, book).state
    let steps = 0
    while (s.status === 'playing' && steps < 10) {
      const h = getHint(s, lv, book)
      if (h.kind !== 'move') break
      s = play(s, h.move, lv, book).state
      steps++
    }
    expect(s.status).toBe('won')
  })

  test('fora da solução com vitória em 1 passo', () => {
    // 'PBA': solução guardada vazia; barro formado por A<->P? A e P não adjacentes -> mover B<->A
    const lv: Level = {
      number: 1, seed: 0, board: parseBoard(['PBA'], L), goals: [{ element: 'barro', count: 1 }],
      moves: 3, active: ['agua+pedra'], solution: [], fingerprint: '',
    }
    const h = getHint(newGame(lv), lv, book)
    expect(h.kind).toBe('move')
    if (h.kind !== 'move') return
    expect(play(newGame(lv), h.move, lv, book).state.status).toBe('won')
  })

  test('estado sem solução devolve undo em < 300 ms', () => {
    const lv: Level = {
      number: 1, seed: 0, board: parseBoard(['APBF', 'FBPA', 'PABF'], L),
      goals: [{ element: 'tijolo', count: 1 }], moves: 4, active: ['agua+pedra'], solution: [], fingerprint: '',
    }
    const t0 = performance.now()
    const start = newGame(lv)
    const h = getHint({ ...start, history: [{ board: start.board, movesLeft: 5, collected: {} }] }, lv, book)
    expect(performance.now() - t0).toBeLessThan(300)
    expect(h).toEqual({ kind: 'undo' })
  })

  test('sem tempo na busca fora da solução devolve unknown', () => {
    const lv = generateLevel(30, book)
    const wrong = { from: { r: 0, c: 0 }, to: { r: 0, c: 1 } }
    const s = play(newGame(lv), wrong, lv, book).state
    expect(getHint(s, lv, book, 0)).toEqual({ kind: 'unknown' })
  })

  test('sem solução e sem histórico devolve unknown', () => {
    const lv: Level = {
      number: 1, seed: 0, board: parseBoard(['APBF', 'FBPA', 'PABF'], L),
      goals: [{ element: 'tijolo', count: 1 }], moves: 4, active: ['agua+pedra'], solution: [], fingerprint: '',
    }
    expect(getHint(newGame(lv), lv, book)).toEqual({ kind: 'unknown' })
  })

  test('partida terminada devolve undo', () => {
    const lv = generateLevel(1, book)
    expect(getHint({ ...newGame(lv), status: 'lost' }, lv, book)).toEqual({ kind: 'undo' })
  })

  test('nunca devolve mais de um movimento', () => {
    const lv = generateLevel(5, book)
    const h = getHint(newGame(lv), lv, book)
    expect(Object.keys(h).sort()).toEqual(['kind', 'move'])
    expect(Array.isArray((h as { move: unknown }).move)).toBe(false)
  })
})
