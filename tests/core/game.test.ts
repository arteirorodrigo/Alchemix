import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { parseBoard } from '../../src/core/board'
import { addExtraMoves, canUndoFree, newGame, play, stars, undo } from '../../src/core/game'
import type { Level, Move } from '../../src/core/types'

const book = new RecipeBook(csv)
const L = { A: 'agua', P: 'pedra', F: 'fogo', B: 'broto', R: 'barro', T: 'tijolo' }
const p = (r: number, c: number) => ({ r, c })
const mv = (a: [number, number], b: [number, number]): Move => ({ from: p(...a), to: p(...b) })
const mk = (rows: string[], goals: Level['goals'], moves: number): Level => ({
  number: 1, seed: 0, board: parseBoard(rows, L), goals, moves,
  active: ['agua+pedra', 'barro+fogo'], solution: [], fingerprint: '',
})
// 'APB': mover pedra para a esquerda forma barro (agua+pedra)
const winLevel = () => mk(['APB'], [{ element: 'barro', count: 1 }], 3)
const NOOP = mv([0, 1], [0, 2]) // troca sem reação em 'APB'? (P<->B)

describe('game', () => {
  test('vitória ao cumprir metas', () => {
    const lv = mk(['AFP'], [{ element: 'tijolo', count: 1 }], 3)
    const { state } = play(newGame(lv), mv([0, 2], [0, 1]), lv, book)
    expect(state.status).toBe('won')
    expect(state.collected.tijolo).toBe(1)
    expect(state.movesLeft).toBe(2)
  })

  test('derrota ao zerar movimentos', () => {
    const lv = mk(['APB'], [{ element: 'tijolo', count: 1 }], 1)
    const { state } = play(newGame(lv), NOOP, lv, book)
    expect(state.status).toBe('lost')
    expect(state.movesLeft).toBe(0)
    expect(() => play(state, NOOP, lv, book)).toThrow()
  })

  test('undo restaura tabuleiro, movimentos e coletados', () => {
    const lv = mk(['APB'], [{ element: 'tijolo', count: 1 }], 3)
    const g0 = newGame(lv)
    const g1 = play(g0, NOOP, lv, book).state
    expect(g1.history.length).toBe(1)
    const g2 = undo(g1)
    expect(g2.board).toEqual(g0.board)
    expect(g2.movesLeft).toBe(3)
    expect(g2.collected).toEqual(g0.collected)
    expect(g2.freeUndoUsed).toBe(true)
    expect(canUndoFree(g2)).toBe(false)
    expect(canUndoFree(g0)).toBe(true)
    expect(() => undo(g2)).toThrow()
  })

  test('undo de vitória volta a playing', () => {
    const lv = winLevel()
    const won = play(newGame(lv), mv([0, 1], [0, 0]), lv, book).state
    expect(won.status).toBe('won')
    const back = undo(won)
    expect(back.status).toBe('playing')
    expect(back.collected.barro ?? 0).toBe(0)
    expect(back.seen).toEqual(['agua+pedra'])
  })

  test('addExtraMoves só uma vez', () => {
    const g = addExtraMoves(newGame(winLevel()))
    expect(g.movesLeft).toBe(6)
    expect(g.extraMovesUsed).toBe(true)
    expect(() => addExtraMoves(g)).toThrow()
  })

  test('addExtraMoves reabre fase perdida', () => {
    const lv = mk(['APB'], [{ element: 'tijolo', count: 1 }], 1)
    const lost = play(newGame(lv), NOOP, lv, book).state
    const g = addExtraMoves(lost)
    expect(g.status).toBe('playing')
    expect(g.movesLeft).toBe(3)
  })

  test('estrelas por movimentos que sobraram', () => {
    const lv = winLevel()
    const mk2 = (n: number) => ({ ...play(newGame(lv), mv([0, 1], [0, 0]), lv, book).state, movesLeft: n })
    expect(stars(mk2(2), lv)).toBe(3)
    expect(stars(mk2(1), lv)).toBe(2)
    expect(stars(mk2(0), lv)).toBe(1)
    expect(stars(newGame(lv), lv)).toBe(0)
  })

  test('vitória com +3 vale no máximo 1 estrela', () => {
    const lv = winLevel()
    const g = play(addExtraMoves(newGame(lv)), mv([0, 1], [0, 0]), lv, book).state
    expect(g.status).toBe('won')
    expect(g.movesLeft).toBeGreaterThanOrEqual(2)
    expect(stars(g, lv)).toBe(1)
  })

  test('perdeu → +3 → desfazer mantém os +3', () => {
    const lv = mk(['APB'], [{ element: 'tijolo', count: 1 }], 2)
    const a = play(newGame(lv), NOOP, lv, book).state
    const lost = play(a, mv([0, 1], [0, 2]), lv, book).state
    expect(lost.status).toBe('lost')
    const extra = addExtraMoves(lost)
    const u = undo(extra)
    expect(u.movesLeft).toBe(lost.history[lost.history.length - 1].movesLeft + 3)
    expect(u.status).toBe('playing')
  })

  test('play() não altera o estado de entrada', () => {
    const lv = winLevel()
    const s = newGame(lv)
    const before = structuredClone(s)
    play(s, mv([0, 1], [0, 0]), lv, book)
    expect(s).toEqual(before)
  })

  test('estrelas em fase perdida = 0', () => {
    const lv = mk(['APB'], [{ element: 'tijolo', count: 1 }], 1)
    const lost = play(newGame(lv), NOOP, lv, book).state
    expect(lost.status).toBe('lost')
    expect(stars(lost, lv)).toBe(0)
  })
})
