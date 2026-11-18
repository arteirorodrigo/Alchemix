import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook } from '../../src/core/recipes'
import { generateLevel } from '../../src/core/generator'
import { newGame, play } from '../../src/core/game'
import { MemoryStorage, LocalStorage } from '../../src/platform/storage'
import { grantDailyHint, loadProgress, recordSeen, recordWin, saveProgress } from '../../src/core/progress'

const book = new RecipeBook(csv)

describe('progress', () => {
  test('progresso padrão', () => {
    const p = loadProgress(new MemoryStorage())
    expect(p).toEqual({
      version: 1, currentLevel: 1, stars: {}, discovered: [], hints: 3, lastFreeHintDay: '',
      settings: { sound: true, vibration: true, leftHanded: false },
    })
  })

  test('save/load ida e volta', () => {
    const st = new MemoryStorage()
    const p = recordWin(loadProgress(st), 1, 2, ['a+b'])
    saveProgress(st, p)
    expect(loadProgress(st)).toEqual(p)
  })

  test('JSON corrompido volta ao padrão sem lançar', () => {
    const st = new MemoryStorage()
    st.set('alquimia.save.v1', '{nao eh json')
    expect(loadProgress(st).currentLevel).toBe(1)
    st.set('alquimia.save.v1', JSON.stringify({ version: 2, currentLevel: 9 }))
    expect(loadProgress(st).currentLevel).toBe(1)
    st.set('alquimia.save.v1', JSON.stringify({ version: 1, currentLevel: 4 }))
    const p = loadProgress(st)
    expect(p.currentLevel).toBe(4)
    expect(p.hints).toBe(3)
  })

  test('dica diária só uma vez por dia', () => {
    const p0 = loadProgress(new MemoryStorage())
    const p1 = grantDailyHint(p0, '2026-11-18')
    expect(p1.hints).toBe(4)
    expect(grantDailyHint(p1, '2026-11-18')).toBe(p1)
    expect(grantDailyHint(p1, '2026-11-19').hints).toBe(5)
    expect(p0.hints).toBe(3)
  })

  test('recordWin mantém a melhor estrela', () => {
    let p = loadProgress(new MemoryStorage())
    p = recordWin(p, 3, 3, ['x', 'y'])
    p = recordWin(p, 3, 1, ['y', 'z'])
    expect(p.stars[3]).toBe(3)
    expect(p.currentLevel).toBe(4)
    expect(p.discovered).toEqual(['x', 'y', 'z'])
    p = recordWin(p, 1, 2, [])
    expect(p.currentLevel).toBe(4)
    expect(p.inProgress).toBeUndefined()
    expect(recordSeen(p, ['z', 'w']).discovered).toEqual(['x', 'y', 'z', 'w'])
  })

  test('inProgress salvo é restaurado igual', () => {
    const level = generateLevel(1, book)
    const { state } = play(newGame(level), level.solution[0], level, book)
    const st = new MemoryStorage()
    saveProgress(st, { ...loadProgress(st), inProgress: state })
    expect(loadProgress(st).inProgress).toEqual(state)
  })

  test('LocalStorage funciona sem window', () => {
    const ls = new LocalStorage()
    expect(ls.get('k')).toBeNull()
    ls.set('k', 'v')
    expect(ls.get('k')).toBe('v')
  })

  test('recordWin só limpa inProgress da própria fase', () => {
    const level = generateLevel(10, book)
    const g = newGame(level)
    const p0 = { ...loadProgress(new MemoryStorage()), currentLevel: 10, inProgress: g }
    expect(recordWin(p0, 1, 3, []).inProgress).toEqual(g)
    expect(recordWin(p0, 10, 3, []).inProgress).toBeUndefined()
  })

  test('save com formato inválido cai nos padrões', () => {
    const st = new MemoryStorage()
    const put = (o: object) => st.set('alquimia.save.v1', JSON.stringify({ version: 1, ...o }))
    put({ inProgress: { levelNumber: 3 } })
    expect(loadProgress(st).inProgress).toBeUndefined()
    put({ discovered: 'x', hints: -2, currentLevel: 0, stars: 5, settings: { sound: 'sim' } })
    const p = loadProgress(st)
    expect(p.discovered).toEqual([])
    expect(p.hints).toBe(3)
    expect(p.currentLevel).toBe(1)
    expect(p.stars).toEqual({})
    expect(p.settings.sound).toBe(true)
    put({ inProgress: { levelNumber: 1, board: { rows: 2, cols: 2, cells: ['a'] }, movesLeft: 1, collected: {}, history: [], status: 'playing' } })
    expect(loadProgress(st).inProgress).toBeUndefined()
  })
})
