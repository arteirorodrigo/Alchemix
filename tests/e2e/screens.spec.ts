import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { RecipeBook } from '../../src/core/recipes'
import { generateLevel } from '../../src/core/generator'
import { newGame, play as playMove } from '../../src/core/game'
import { cssScale, home, idle, nonWinningMove, play, saved, seed, tapMove, tapWorld } from './helpers'

const book = new RecipeBook(readFileSync(new URL('../../src/data/receitas.csv', import.meta.url), 'utf8'))
const level1 = generateLevel(1, book)

const homeInfo = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify((window as any).__home)))
const tapHome = async (page: Page, name: string) =>
  tapWorld(page, await page.evaluate((n) => (window as any).__home.rects[n], name))

async function winLevel1(page: Page) {
  await play(page, 1)
  for (const m of level1.solution) await tapMove(page, m)
  await page.waitForFunction(() => (window as any).__game.overlay === 'win')
}

async function backHome(page: Page) {
  await tapWorld(page, await page.evaluate(() => (window as any).__game.rects.back))
  await home(page)
}

const shot = async (page: Page, name: string) => {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `tests/e2e/__shots__/${name}.png` })
}

test('início mostra Fase atual e contador de receitas', async ({ page }) => {
  await seed(page, { currentLevel: 3, stars: { 1: 3, 2: 2 }, discovered: ['agua+pedra', 'agua+fogo'] })
  await page.goto('/')
  await home(page)
  const h = await homeInfo(page)
  expect(h.playLabel).toContain('Fase 3')
  expect(h.recipesLabel).toBe('Receitas 2/55')
  expect(h.hintsLabel).toBe('4 dicas')                // 3 + a grátis do dia
  expect(h.strip).toEqual([{ level: 1, stars: 3 }, { level: 2, stars: 2 }, { level: 3, stars: 0 }])
  await shot(page, 'inicio')
})

test('faixa de fases mostra só as últimas 10', async ({ page }) => {
  await seed(page, { currentLevel: 15, stars: Object.fromEntries([...Array(14)].map((_, i) => [i + 1, 1])) })
  await page.goto('/')
  await home(page)
  const strip = (await homeInfo(page)).strip as { level: number }[]
  expect(strip.map((s) => s.level)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
})

test('JOGAR abre a fase atual', async ({ page }) => {
  await seed(page, { currentLevel: 4 })
  await page.goto('/')
  await play(page, 4)
  expect(await page.evaluate(() => (window as any).__game.level.number)).toBe(4)
})

test('JOGAR continua a fase em andamento e Voltar retorna ao início', async ({ page }) => {
  await page.goto('/')
  await play(page, 1)
  await tapMove(page, nonWinningMove(level1, book))
  await backHome(page)
  await play(page, 1)
  expect(await page.evaluate(() => (window as any).__game.state.history.length)).toBe(1)
})

test('livro lista 55 entradas e mostra descobertas após vencer a fase 1', async ({ page }) => {
  await page.goto('/')
  await winLevel1(page)
  await page.waitForFunction(() => (window as any).__game.rects.next)
  await page.waitForTimeout(250)   // diálogo terminando de aparecer
  await tapWorld(page, await page.evaluate(() => (window as any).__game.rects.next))
  await page.waitForFunction(() => (window as any).__game?.level?.number === 2)
  await idle(page)
  await backHome(page)
  const h = await homeInfo(page)
  expect(h.recipesLabel).toBe('Receitas 1/55')
  expect(h.strip[0].level).toBe(1)
  expect(h.strip[0].stars).toBeGreaterThanOrEqual(1)

  await tapHome(page, 'book')
  await page.waitForFunction(() => (window as any).__book?.ready === true)
  const b = await page.evaluate(() => JSON.parse(JSON.stringify((window as any).__book)))
  expect(b.header).toBe('1 de 55 descobertas')
  expect(b.entries).toHaveLength(55)
  expect(new Set(b.entries.map((e: { tier: number }) => e.tier))).toEqual(new Set([1, 2, 3, 4, 5]))
  const found = b.entries.filter((e: { discovered: boolean }) => e.discovered)
  expect(found.map((e: { key: string }) => e.key)).toEqual(['agua+pedra'])
  expect(found[0].text).toBe('💧 + 🪨 = 🟤 Barro')
  expect(found[0].logic).toBe(book.byKey('agua+pedra').logic)
  expect(b.entries.find((e: { discovered: boolean }) => !e.discovered).text).toBe('? + ? = ainda secreta')
  await shot(page, 'receitas')

  // fechar o livro e rejogar a fase 1 pela faixa: não rebaixa a fase atual
  await tapWorld(page, b.rects.close)
  await page.waitForFunction(() => !(window as any).__book)
  await tapWorld(page, (await homeInfo(page)).rects.strip0)
  await page.waitForFunction(() => (window as any).__game?.level?.number === 1)
  await idle(page)
  for (const m of level1.solution) await tapMove(page, m)
  await page.waitForFunction(() => (window as any).__game.overlay === 'win')
  expect((await saved(page)).currentLevel).toBe(2)
})

test('modo canhoto inverte o rodapé', async ({ page }) => {
  await page.goto('/')
  await home(page)
  await tapHome(page, 'settings')
  await page.waitForFunction(() => (window as any).__settings?.ready === true)
  await shot(page, 'ajustes')
  const s = await page.evaluate(() => JSON.parse(JSON.stringify((window as any).__settings)))
  expect(s.values).toEqual({ sound: true, vibration: true, leftHanded: false })
  await tapWorld(page, s.rects.leftHanded)
  await page.waitForFunction(() => (window as any).__settings.values.leftHanded === true)
  expect((await saved(page)).settings.leftHanded).toBe(true)
  await tapWorld(page, s.rects.close)
  await page.waitForFunction(() => !(window as any).__settings)

  await play(page, 1)
  const order = () => page.evaluate(() => (window as any).__game.footerOrder)
  expect(await order()).toEqual(['undo', 'hint', 'extra', 'book'])

  // pela engrenagem da fase também
  await tapWorld(page, await page.evaluate(() => (window as any).__game.rects.settings))
  await page.waitForFunction(() => (window as any).__settings?.ready === true)
  await tapWorld(page, s.rects.leftHanded)
  await page.waitForFunction(() => (window as any).__settings.values.leftHanded === false)
  await tapWorld(page, s.rects.close)
  await page.waitForFunction(() => !(window as any).__settings)
  expect(await order()).toEqual(['book', 'extra', 'hint', 'undo'])
  expect((await saved(page)).settings.leftHanded).toBe(false)
})

for (const vp of [{ width: 320, height: 568 }, { width: 412, height: 915 }]) {
  test(`em ${vp.width}×${vp.height} o tabuleiro 8×7 cabe sem rolagem horizontal e o rodapé fica visível`, async ({ page }) => {
    await page.setViewportSize(vp)
    await seed(page, { currentLevel: 61 })
    await page.goto('/')
    await play(page, 61)
    const g = await page.evaluate(() => {
      const d = (window as any).__game
      return { rows: d.level.board.rows, cols: d.level.board.cols, tile: d.tile, board: d.rects.board, footer: d.rects.footer }
    })
    expect([g.rows, g.cols]).toEqual([8, 7])
    const k = await cssScale(page)
    const c = await page.evaluate(() => {
      const r = document.querySelector('canvas')!.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight }
    })
    expect(c.sw).toBeLessThanOrEqual(c.iw)
    expect(c.left).toBeGreaterThanOrEqual(-0.5)
    expect(c.right).toBeLessThanOrEqual(c.iw + 0.5)
    // tabuleiro inteiro dentro da tela e acima do rodapé
    expect(c.left + g.board.x * k).toBeGreaterThanOrEqual(-0.5)
    expect(c.left + (g.board.x + g.board.w) * k).toBeLessThanOrEqual(c.iw + 0.5)
    for (const f of Object.values(g.footer) as { y: number; h: number }[]) {
      expect(g.board.y + g.board.h).toBeLessThanOrEqual(f.y)
      expect(c.top + (f.y + f.h) * k).toBeLessThanOrEqual(c.ih + 0.5)
      expect(f.h * k).toBeGreaterThanOrEqual(44)
    }
    expect(g.tile * k).toBeGreaterThanOrEqual(vp.width >= 360 ? 48 : 44)
    await shot(page, `fase61-${vp.width}x${vp.height}`)
  })
}

test('em 360×640 o X das janelas tem ≥ 48 px CSS', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await home(page)
  const k = await cssScale(page)
  await tapHome(page, 'settings')
  await page.waitForFunction(() => (window as any).__settings?.ready === true)
  const s = await page.evaluate(() => (window as any).__settings.rects.close)
  expect(Math.min(s.w, s.h) * k).toBeGreaterThanOrEqual(48)
  await tapWorld(page, s)
  await page.waitForFunction(() => !(window as any).__settings)
  await tapHome(page, 'book')
  await page.waitForFunction(() => (window as any).__book?.ready === true)
  const b = await page.evaluate(() => (window as any).__book.rects.close)
  expect(Math.min(b.w, b.h) * k).toBeGreaterThanOrEqual(48)
})

test('chip da fase atual abre a fase atual mesmo com outra fase em andamento', async ({ page }) => {
  await seed(page, { currentLevel: 5, stars: { 1: 3, 2: 3, 3: 3, 4: 3 } })
  await page.goto('/')
  await home(page)
  // rejoga a fase 2 pela faixa e deixa no meio
  await tapWorld(page, (await homeInfo(page)).rects.strip1)
  await page.waitForFunction(() => (window as any).__game?.level?.number === 2)
  await idle(page)
  await tapMove(page, nonWinningMove(generateLevel(2, book), book))
  expect((await saved(page)).inProgress).toBeUndefined()   // replay não usa o slot de partida em andamento
  await backHome(page)
  const h = await homeInfo(page)
  expect(h.strip[4].level).toBe(5)
  await tapWorld(page, h.rects.strip4)
  await page.waitForFunction(() => (window as any).__game?.level?.number !== undefined)
  await idle(page)
  expect(await page.evaluate(() => (window as any).__game.level.number)).toBe(5)
})

test('rejogar e vencer fase antiga preserva a partida em andamento da fase atual (fase 6)', async ({ page }) => {
  const lv6 = generateLevel(6, book)
  const inProgress = playMove(newGame(lv6), nonWinningMove(lv6, book), lv6, book).state
  await seed(page, {
    currentLevel: 6, stars: Object.fromEntries([...Array(5)].map((_, i) => [i + 1, 1])), inProgress,
  })
  await page.goto('/')
  await home(page)
  const h = await homeInfo(page)
  expect(h.strip[1].level).toBe(2)
  await tapWorld(page, h.rects.strip1)
  await page.waitForFunction(() => (window as any).__game?.level?.number === 2)
  await idle(page)
  for (const m of generateLevel(2, book).solution) await tapMove(page, m)
  await page.waitForFunction(() => (window as any).__game.overlay === 'win')
  expect((await saved(page)).inProgress.levelNumber).toBe(6)
  await backHome(page)
  await play(page, 6)
  expect(await page.evaluate(() => (window as any).__game.state.history.length)).toBe(1)
})
