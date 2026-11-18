import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { applyGravity, boardKey, isAdjacent, parseBoard, swap } from '../../src/core/board'
import { applyMove } from '../../src/core/engine'

const book = new RecipeBook(csv)
const L = { A: 'agua', P: 'pedra', F: 'fogo', B: 'broto', R: 'barro', T: 'tijolo' }
const board = (rows: string[]) => parseBoard(rows, L)
const ACTIVE = new Set(['agua+pedra', 'barro+fogo'])
const p = (r: number, c: number) => ({ r, c })

describe('board', () => {
  test('parseBoard lê letras, vazio e parede; linhas desiguais lançam erro', () => {
    const b = board(['A.#'])
    expect(b.cells).toEqual(['agua', null, '#'])
    expect(() => board(['AB', 'A'])).toThrow()
    expect(boardKey(board(['AB'])).length).toBeGreaterThan(0)
    expect(boardKey(board(['AB']))).not.toBe(boardKey(board(['BA'])))
  })
  test('isAdjacent e gravidade com parede', () => {
    expect(isAdjacent(p(0, 0), p(0, 1))).toBe(true)
    expect(isAdjacent(p(0, 0), p(1, 1))).toBe(false)
    const g = applyGravity(board(['B', '#', 'B', '.']))
    expect(g.board).toEqual(board(['B', '#', '.', 'B']))
  })
  test('swap é imutável', () => {
    const b = board(['AP'])
    const s = swap(b, { from: p(0, 0), to: p(0, 1) })
    expect(s).toEqual(board(['PA']))
    expect(b).toEqual(board(['AP']))
  })
})

describe('applyMove', () => {
  test('troca que forma par reage e resultado fica no destino', () => {
    const r = applyMove(board(['APB']), { from: p(0, 1), to: p(0, 0) }, book, new Set(['agua+pedra']), {})
    expect(r.board).toEqual(board(['R.B']))
    expect(r.steps.length).toBe(1)
    expect(r.steps[0].reactions[0]).toMatchObject({ at: p(0, 0), recipe: 'agua+pedra', collected: false })
    expect(r.newlySeen).toEqual(['agua+pedra'])
  })

  test('troca sem reação é permitida e só troca', () => {
    const r = applyMove(board(['APF']), { from: p(0, 1), to: p(0, 2) }, book, ACTIVE, {})
    expect(r.board).toEqual(board(['AFP']))
    expect(r.steps).toEqual([])
    expect(r.newlySeen).toEqual([])
  })

  test('cadeia: barro criado ao lado de fogo vira tijolo no passo seguinte', () => {
    const r = applyMove(board(['AFP']), { from: p(0, 2), to: p(0, 1) }, book, ACTIVE, {})
    expect(r.board).toEqual(board(['.T.']))
    expect(r.steps.length).toBe(2)
    expect(r.newlySeen).toEqual(['agua+pedra', 'barro+fogo'])
  })

  test('gravidade: peça acima de casa vazia cai; parede segura', () => {
    const r = applyMove(
      board(['BB.', '.#.', '...', 'ABP']),
      { from: p(3, 0), to: p(3, 1) }, book, ACTIVE, {},
    )
    expect(r.board).toEqual(board(['.B.', '.#.', 'B..', 'BR.']))
    expect(r.steps.length).toBe(1)
    expect(r.steps[0].falls).toEqual([{ from: p(0, 0), to: p(2, 0) }])
  })

  test('gravidade gera cascata', () => {
    const r = applyMove(
      board(['A..', '...', 'RBF', 'PBB']),
      { from: p(2, 2), to: p(2, 1) }, book, ACTIVE, {},
    )
    expect(r.board).toEqual(board(['...', '...', '.TB', 'RBB']))
    expect(r.steps.length).toBe(2)
    expect(r.steps[0].falls).toEqual([{ from: p(0, 0), to: p(2, 0) }])
    expect(r.steps[1].reactions[0]).toMatchObject({ at: p(3, 0), recipe: 'agua+pedra' })
    expect(r.newlySeen).toEqual(['barro+fogo', 'agua+pedra'])
  })

  test('casa não reage duas vezes no mesmo passo (ordem de leitura)', () => {
    const r = applyMove(board(['AAP']), { from: p(0, 1), to: p(0, 2) }, book, ACTIVE, {})
    // A P A: o par da esquerda reage primeiro; o P já usado não reage com o A da direita
    expect(r.board).toEqual(board(['.RA']))
    expect(r.steps.length).toBe(1)
    expect(r.steps[0].reactions.length).toBe(1)
  })

  test('resultado de meta é coletado e casa esvazia', () => {
    const r = applyMove(board(['APB']), { from: p(0, 1), to: p(0, 0) }, book, new Set(['agua+pedra']), { barro: 1 })
    expect(r.collected).toEqual({ barro: 1 })
    expect(r.board).toEqual(board(['..B']))
    expect(r.steps[0].reactions[0].collected).toBe(true)
  })

  test('meta já cumprida não coleta', () => {
    const r = applyMove(board(['APB']), { from: p(0, 1), to: p(0, 0) }, book, new Set(['agua+pedra']), { barro: 0 })
    expect(r.collected).toEqual({})
    expect(r.board).toEqual(board(['R.B']))
  })

  test('não coleta além do que falta no mesmo passo', () => {
    const r = applyMove(board(['PAAP']), { from: p(0, 0), to: p(0, 1) }, book, ACTIVE, { barro: 1 })
    expect(r.collected).toEqual({ barro: 1 })
    expect(r.board).toEqual(board(['..R.']))
    expect(r.steps.length).toBe(1)
  })

  test('receita inativa não reage', () => {
    const r = applyMove(board(['APB']), { from: p(0, 1), to: p(0, 0) }, book, new Set(['barro+fogo']), {})
    expect(r.board).toEqual(board(['PAB']))
    expect(r.steps).toEqual([])
  })

  test('mesmo estado + mesmo movimento = mesmo resultado', () => {
    const b = board(['A..', '...', 'RBF', 'PBB'])
    const before = boardKey(b)
    const m = { from: p(2, 2), to: p(2, 1) }
    const r1 = applyMove(b, m, book, ACTIVE, { tijolo: 1 })
    const r2 = applyMove(b, m, book, ACTIVE, { tijolo: 1 })
    expect(r1).toEqual(r2)
    expect(boardKey(b)).toBe(before)
  })

  test('movimento não vizinho, parede ou vazio lança erro', () => {
    const b = board(['AP.#'])
    expect(() => applyMove(b, { from: p(0, 0), to: p(0, 2) }, book, ACTIVE, {})).toThrow()
    expect(() => applyMove(b, { from: p(0, 1), to: p(0, 2) }, book, ACTIVE, {})).toThrow()
    expect(() => applyMove(board(['A#']), { from: p(0, 0), to: p(0, 1) }, book, ACTIVE, {})).toThrow()
  })
})
