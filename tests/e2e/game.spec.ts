import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { RecipeBook } from '../../src/core/recipes'
import { generateLevel } from '../../src/core/generator'
import type { Move } from '../../src/core/types'
import { FOOTER, center } from '../../src/ui/layout'
import { idle, nonWinningMove as nwm, play, tapMove } from './helpers'

const book = new RecipeBook(readFileSync(new URL('../../src/data/receitas.csv', import.meta.url), 'utf8'))
const level1 = generateLevel(1, book)

const nonWinningMove = (): Move => nwm(level1, book)

async function open(page: Page) {
  await page.goto('/')
  await play(page, 1)
}

const state = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify((window as any).__game.state)))
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('alquimia.save.v1') ?? 'null'))

test('fase 1 abre com tabuleiro, metas e legenda', async ({ page }) => {
  await open(page)
  const info = await page.evaluate(() => {
    const g = (window as any).__game
    return { level: g.level.number, board: g.state.board, goals: g.level.goals, active: g.level.active,
      moves: g.state.movesLeft, legend: g.legend, overlay: g.overlay }
  })
  expect(info.level).toBe(1)
  expect(info.board.cells.length).toBe(level1.board.rows * level1.board.cols)
  expect(info.goals).toEqual(level1.goals)
  expect(info.moves).toBe(level1.moves)
  expect(info.legend).toEqual(['? + ? = ?'])
  expect(info.overlay).toBeNull()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'tests/e2e/__shots__/fase1.png' })
})

test('seguir a solução guardada vence a fase 1', async ({ page }) => {
  await open(page)
  for (const m of level1.solution) await tapMove(page, m)
  const s = await state(page)
  expect(s.status).toBe('won')
  expect(await page.evaluate(() => (window as any).__game.overlay)).toBe('win')
  const p = await saved(page)
  expect(p.currentLevel).toBe(2)
  expect(p.stars['1']).toBeGreaterThanOrEqual(1)
  expect(p.inProgress).toBeUndefined()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'tests/e2e/__shots__/fase1-vitoria.png' })
})

test('toques rápidos durante animação aplicam um movimento só', async ({ page }) => {
  await open(page)
  const m = nonWinningMove()
  const before = (await state(page)).movesLeft
  await page.evaluate(async (m) => {
    const g = (window as any).__game
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    // Os toques extras só valem enquanto a primeira animação roda (sob carga os timers atrasam).
    for (let i = 0; i < 3 && (i === 0 || g.animating); i++) {
      g.tap(m.from.r, m.from.c); await wait(15)
      if (i > 0 && !g.animating) break
      g.tap(m.to.r, m.to.c); await wait(15)
    }
  }, m)
  await idle(page)
  await page.waitForTimeout(400)
  await idle(page)
  const s = await state(page)
  expect(s.movesLeft).toBe(before - 1)
  expect(s.history.length).toBe(1)
})

test('recarregar a página no meio da fase restaura o estado', async ({ page }) => {
  await open(page)
  await tapMove(page, nonWinningMove())
  const before = await state(page)
  expect(before.history.length).toBe(1)
  expect((await saved(page)).inProgress.board).toEqual(before.board)
  await page.reload()
  await open(page)
  const after = await state(page)
  expect(after.board).toEqual(before.board)
  expect(after.movesLeft).toBe(before.movesLeft)
  expect(after.history.length).toBe(1)
  expect(after.collected).toEqual(before.collected)
})

test('dica destaca duas casas vizinhas', async ({ page }) => {
  await open(page)
  const hintsBefore = (await saved(page))?.hints ?? 3
  const { x, y } = center(FOOTER.hint)
  await page.mouse.click(x, y)
  await page.waitForFunction(() => (window as any).__game.highlight !== null)
  const h = await page.evaluate(() => (window as any).__game.highlight)
  expect(Math.abs(h[0].r - h[1].r) + Math.abs(h[0].c - h[1].c)).toBe(1)
  expect(h).toEqual([level1.solution[0].from, level1.solution[0].to])
  expect((await saved(page)).hints).toBe(hintsBefore - 1)
  await page.screenshot({ path: 'tests/e2e/__shots__/fase1-dica.png' })
  await page.evaluate(() => (window as any).__game.tap(0, 0))
  expect(await page.evaluate(() => (window as any).__game.highlight)).toBeNull()
})

test('fechar durante a animação do movimento vencedor não perde a vitória', async ({ page }) => {
  await open(page)
  const m = level1.solution[0]
  await page.evaluate((m) => {
    const g = (window as any).__game
    g.tap(m.from.r, m.from.c)
    g.tap(m.to.r, m.to.c)
  }, m)
  expect(await page.evaluate(() => (window as any).__game.animating)).toBe(true)
  const p = await saved(page)
  await page.reload()
  await play(page, 2)
  expect(p.currentLevel).toBe(2)
  expect(p.stars['1']).toBeGreaterThanOrEqual(1)
  expect(p.inProgress).toBeUndefined()
  expect(await page.evaluate(() => (window as any).__game.level.number)).toBe(2)
})
