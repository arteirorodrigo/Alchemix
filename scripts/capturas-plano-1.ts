// Joga as fases 1–3 no build de produção (vite preview) e salva capturas em docs/design/capturas-plano-1/.
// Uso: npm run build && npx vite preview --port 4173 & npx vite-node scripts/capturas-plano-1.ts
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { RecipeBook } from '../src/core/recipes'
import { generateLevel } from '../src/core/generator'
import { BOARD_AREA, FOOTER, HOME, W, center, type Rect } from '../src/ui/layout'

const GRASS = 12
const book = new RecipeBook(readFileSync(new URL('../src/data/receitas.csv', import.meta.url), 'utf8'))
const out = 'docs/design/capturas-plano-1'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function cellCenter(rows: number, cols: number, r: number, c: number) {
  const wide = cols >= 7
  const [gap, pad, rim] = wide ? [0, 3, 3] : [5, 8, 4]
  const area = wide ? { ...BOARD_AREA, x: 0, w: W } : BOARD_AREA
  const frame = rim + pad
  const tile = Math.floor(Math.min(58, (area.w - 2 * frame - (cols - 1) * gap) / cols,
    (area.h - 2 * frame - GRASS - (rows - 1) * gap) / rows))
  const fw = cols * tile + (cols - 1) * gap + 2 * frame
  const fh = rows * tile + (rows - 1) * gap + 2 * frame + GRASS
  const fx = Math.round(area.x + (area.w - fw) / 2)
  const fy = Math.round(area.y + Math.min(16, (area.h - fh) / 2))
  return { x: fx + frame + c * (tile + gap) + tile / 2, y: fy + frame + GRASS + r * (tile + gap) + tile / 2 }
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errors: string[] = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/')
await page.evaluate(() => document.fonts.ready)
await wait(2500)
const click = async (r: { x: number; y: number }) => {
  const box = (await page.locator('canvas').boundingBox())!
  const k = box.width / W
  await page.mouse.click(box.x + r.x * k, box.y + r.y * k)
}
const cr = (r: Rect) => center(r)
await page.screenshot({ path: `${out}/inicio.png` })

for (let n = 1; n <= 3; n++) {
  await click(cr(HOME.play))
  await wait(1500)
  const lv = generateLevel(n, book)
  const { rows, cols } = lv.board
  for (let i = 0; i < lv.solution.length; i++) {
    const m = lv.solution[i]
    await click(cellCenter(rows, cols, m.from.r, m.from.c)); await wait(400)
    if (n === 2 && i === 0) await page.screenshot({ path: `${out}/fase.png` })   // fase 2 com a 1ª casa selecionada
    await click(cellCenter(rows, cols, m.to.r, m.to.c))
    await wait(2200)
  }
  await wait(1500)
  if (n === 1) await page.screenshot({ path: `${out}/vitoria.png` })
  await click({ x: 195, y: 548 })           // Próxima fase
  await wait(1500)
  await page.screenshot({ path: `/tmp/claude-0/-home-user-Jogo/3acacfa0-61b2-5ee8-9dcc-d4b56ae72896/scratchpad/after${n}.png` })
  // volta ao início para o próximo JOGAR
  await click({ x: 40, y: 44 }); await wait(1200)
}
await click(cr(HOME.book)); await wait(1500)
await page.screenshot({ path: `${out}/livro.png` })
console.log('console errors:', errors)
await browser.close()
