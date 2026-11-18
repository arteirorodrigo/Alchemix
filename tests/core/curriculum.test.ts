import { describe, it, expect } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { paramsFor } from '../../src/core/curriculum'

const book = new RecipeBook(csv)

describe('curriculum', () => {
  it('fase 1 introduz agua+pedra', () => {
    const p = paramsFor(1, book)
    expect(p.newRecipe).toBe('agua+pedra')
    expect(p.unlocked).toEqual(['agua+pedra'])
    expect(p.activeCount).toBe(1)
  })

  it('fase 3 não introduz receita', () => {
    const p = paramsFor(3, book)
    expect(p.newRecipe).toBeUndefined()
    expect(p.unlocked).toEqual(paramsFor(2, book).unlocked)
  })

  it('receita só desbloqueia com ingredientes disponíveis', () => {
    const known = new Set(book.base())
    const seen = new Set<string>()
    for (let n = 1; n <= 300; n++) {
      const p = paramsFor(n, book)
      if (p.newRecipe) {
        const r = book.byKey(p.newRecipe)
        expect(known.has(r.a)).toBe(true)
        expect(known.has(r.b)).toBe(true)
        expect(seen.has(p.newRecipe)).toBe(false)
        seen.add(p.newRecipe)
        known.add(r.result)
      }
    }
  })

  it('tamanhos por faixa', () => {
    const sz = (n: number) => { const p = paramsFor(n, book); return [p.rows, p.cols] }
    expect(sz(1)).toEqual([5, 5]); expect(sz(5)).toEqual([5, 5])
    expect(sz(6)).toEqual([6, 6]); expect(sz(20)).toEqual([6, 6])
    expect(sz(21)).toEqual([7, 6]); expect(sz(60)).toEqual([7, 6])
    expect(sz(61)).toEqual([8, 7])
  })

  it('fase 25 é respiro com slack maior', () => {
    expect(paramsFor(25, book).slack).toBe(paramsFor(24, book).slack + 2)
    expect(paramsFor(24, book).slack).toBe(1)
  })

  it('valores de playoutMoves, slack e walls', () => {
    expect(paramsFor(3, book)).toMatchObject({ playoutMoves: 2, slack: 3, walls: 0 })
    expect(paramsFor(8, book)).toMatchObject({ playoutMoves: 3, slack: 2, walls: 0 })
    expect(paramsFor(41, book)).toMatchObject({ playoutMoves: 4, slack: 0, walls: 2 })
    expect(paramsFor(1000, book)).toMatchObject({ playoutMoves: 5, walls: 6, activeCount: 6 })
  })

  it('paramsFor é puro (mesmo n → mesmo resultado)', () => {
    expect(paramsFor(37, book)).toEqual(paramsFor(37, book))
    expect(paramsFor(37, new RecipeBook(csv))).toEqual(paramsFor(37, book))
  })

  it('até a fase 300 todas as 55 receitas foram desbloqueadas', () => {
    expect(paramsFor(300, book).unlocked.length).toBe(55)
    expect(new Set(paramsFor(300, book).unlocked).size).toBe(55)
  })
})
