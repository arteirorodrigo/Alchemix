import type { Page } from '@playwright/test'
import type { Rect } from '../../src/ui/layout'
import type { RecipeBook } from '../../src/core/recipes'
import type { Level, Move } from '../../src/core/types'
import { newGame, play as playMove } from '../../src/core/game'

/** Toca no centro de um retângulo dado em coordenadas do mundo do jogo (converte para CSS px). */
export async function tapWorld(page: Page, r: Rect): Promise<void> {
  const p = await page.evaluate((r) => {
    const c = document.querySelector('canvas')!.getBoundingClientRect()
    const k = c.width / (window as any).__world.w
    return { x: c.left + (r.x + r.w / 2) * k, y: c.top + (r.y + r.h / 2) * k }
  }, r)
  await page.mouse.click(p.x, p.y)
}

/** Fator CSS px por unidade do mundo. */
export const cssScale = (page: Page) => page.evaluate(() =>
  document.querySelector('canvas')!.getBoundingClientRect().width / (window as any).__world.w)

export async function home(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).__home?.ready === true)
}

export async function idle(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).__game && !(window as any).__game.animating)
}

/** Na tela inicial, toca JOGAR e espera a fase `n` abrir. */
export async function play(page: Page, n: number): Promise<void> {
  await home(page)
  await tapWorld(page, await page.evaluate(() => (window as any).__home.rects.play))
  await page.waitForFunction((n) => (window as any).__game?.level?.number === n, n)
  await idle(page)
}

export const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('alquimia.save.v1') ?? 'null'))

/** Grava um save antes de a página carregar (só na primeira carga do teste). */
export async function seed(page: Page, p: Record<string, unknown>): Promise<void> {
  const full = {
    version: 1, currentLevel: 1, stars: {}, discovered: [], hints: 3, lastFreeHintDay: '2026-01-01',
    settings: { sound: true, vibration: true, leftHanded: false }, ...p,
  }
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('alquimia.save.v1', s)
      sessionStorage.setItem('seeded', '1')
    }
  }, JSON.stringify(full))
}

/** Primeira troca válida da fase que não a vence. */
export function nonWinningMove(level: Level, book: RecipeBook): Move {
  const { rows, cols, cells } = level.board
  const el = (r: number, c: number) => { const v = cells[r * cols + c]; return v !== null && v !== '#' }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    for (const to of [{ r, c: c + 1 }, { r: r + 1, c }]) {
      if (to.r >= rows || to.c >= cols || !el(r, c) || !el(to.r, to.c)) continue
      const m = { from: { r, c }, to }
      if (playMove(newGame(level), m, level, book).state.status === 'playing') return m
    }
  }
  throw new Error('fase sem movimento não vencedor')
}

export async function tapMove(page: Page, m: Move): Promise<void> {
  await page.evaluate((m) => {
    const g = (window as any).__game
    g.tap(m.from.r, m.from.c)
    g.tap(m.to.r, m.to.c)
  }, m)
  await idle(page)
}
