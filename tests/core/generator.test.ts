import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { applyGravity, hasActivePair, parseBoard } from '../../src/core/board'
import { newGame, play } from '../../src/core/game'
import { paramsFor } from '../../src/core/curriculum'
import { generateLevel } from '../../src/core/generator'
import type { Level } from '../../src/core/types'

const book = new RecipeBook(csv)
const N = 200

// Gera 1..200 uma vez (sem `seen`) e reaproveita nos testes de varredura.
const levels: Level[] = []
const times: number[] = []
for (let n = 1; n <= N; n++) {
  const t0 = performance.now()
  levels.push(generateLevel(n, book))
  times.push(performance.now() - t0)
}

describe('hasActivePair', () => {
  const L = { A: 'agua', P: 'pedra', F: 'fogo', B: 'broto' }
  const active = new Set(['agua+pedra'])
  test('tabuleiro parado → false', () => {
    expect(hasActivePair(parseBoard(['AF', 'BP'], L), book, active)).toBe(false)
  })
  test('par ativo vizinho → true (horizontal e vertical)', () => {
    expect(hasActivePair(parseBoard(['AP', 'BF'], L), book, active)).toBe(true)
    expect(hasActivePair(parseBoard(['AF', 'PB'], L), book, active)).toBe(true)
  })
})

describe('generateLevel', () => {
  test('determinístico', () => {
    expect(generateLevel(7, book)).toEqual(generateLevel(7, book))
    expect(generateLevel(137, book)).toEqual(levels[136])
  })

  test('metadados coerentes com o currículo', () => {
    for (const lv of levels) {
      const p = paramsFor(lv.number, book)
      expect(lv.board.rows).toBe(p.rows)
      expect(lv.board.cols).toBe(p.cols)
      expect(lv.board.cells.filter(c => c === '#').length).toBe(p.walls)
      expect(lv.newRecipe).toBe(p.newRecipe)
      expect(lv.active.length).toBeGreaterThanOrEqual(1)
      expect(lv.active.length).toBeLessThanOrEqual(6)
      for (const k of lv.active) expect(p.unlocked).toContain(k)
      expect(new Set(lv.active).size).toBe(lv.active.length)
      expect(lv.goals.length).toBeGreaterThanOrEqual(1)
      for (const g of lv.goals) {
        expect(g.count).toBeGreaterThanOrEqual(1)
        expect(g.count).toBeLessThanOrEqual(4)
      }
      expect(lv.moves).toBe(lv.solution.length + p.slack)
      expect(lv.fingerprint).toBe(`${lv.board.rows}x${lv.board.cols}:` +
        lv.board.cells.map(v => (v === null ? '.' : v)).join('|') + '|' + JSON.stringify(lv.goals))
    }
  })

  test('tabuleiro inicial parado: sem par ativo e sem queda', () => {
    for (const lv of levels) {
      expect(hasActivePair(lv.board, book, new Set(lv.active))).toBe(false)
      expect(applyGravity(lv.board).falls).toEqual([])
      // vazios só na linha do topo (0–1 linha vazia)
      lv.board.cells.forEach((v, i) => {
        if (v === null) expect(Math.floor(i / lv.board.cols)).toBe(0)
      })
    }
  })

  test('antes da fase 20 as ativas são fechadas (ingredientes vêm de base ou de outra ativa)', () => {
    const base = new Set(book.base())
    for (const lv of levels.slice(0, 19)) {
      const produced = new Set(lv.active.map(k => book.byKey(k).result))
      for (const k of lv.active) {
        const r = book.byKey(k)
        for (const ing of [r.a, r.b]) expect(base.has(ing) || produced.has(ing)).toBe(true)
      }
      // e o tabuleiro só tem elementos base
      for (const v of lv.board.cells) if (v !== null && v !== '#') expect(base.has(v)).toBe(true)
    }
  })

  test('solução guardada vence a fase', () => {
    for (const lv of levels) {
      let s = newGame(lv)
      for (const m of lv.solution) {
        expect(s.status).toBe('playing')
        s = play(s, m, lv, book).state
      }
      expect(s.status).toBe('won')
    }
  })

  test('fase com receita nova tem a receita nova entre as ativas e na meta', () => {
    let count = 0
    for (const lv of levels) {
      if (!lv.newRecipe) continue
      count++
      expect(lv.active).toContain(lv.newRecipe)
      const result = book.byKey(lv.newRecipe).result
      expect(lv.goals.map(g => g.element)).toContain(result)
    }
    expect(count).toBeGreaterThan(20)
  })

  test('200 primeiras fases têm fingerprints únicos', () => {
    expect(new Set(levels.map(l => l.fingerprint)).size).toBe(N)
  })

  test('cada fase 1–200 gera em < 150 ms', () => {
    // Inclui a primeira geração (fria) de cada fase, medida acima.
    for (const t of times) expect(t).toBeLessThan(150)
  })

  test('`seen` rejeita um candidato e tenta outro', () => {
    const lv = levels[9]
    const other = generateLevel(10, book, new Set([lv.fingerprint]))
    expect(other.fingerprint).not.toBe(lv.fingerprint)
    expect(other.seed).not.toBe(lv.seed)
    expect(generateLevel(10, book)).toEqual(lv) // sem `seen`, a mesma fase de sempre
  })
})
