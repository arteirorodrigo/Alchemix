import Phaser from 'phaser'
import type { Recipe } from '../core/types'
import { t } from '../i18n/pt-BR'
import { BOOK_PANEL, W, type Rect } from '../ui/layout'
import { makePiece } from '../ui/pieces'
import { Scroller } from '../ui/scroller'
import { C } from '../ui/theme'
import { drawBox, txt } from '../ui/widgets'
import { OverlayScene } from './overlay'

export interface BookEntry { key: string; tier: number; discovered: boolean; text: string; logic: string }
export interface BookDebug {
  readonly ready: true
  readonly header: string
  readonly entries: BookEntry[]
  readonly rects: { close: Rect }
}

declare global { interface Window { __book?: BookDebug } }

const HEADER_H = 30
const CARD_FOUND = 80
const CARD_SECRET = 52
const GAP = 10

/** Livro de receitas: todas as receitas por nível; as não descobertas aparecem como `? + ? = ainda secreta`. */
export class BookScene extends OverlayScene {
  constructor() { super('book') }

  create(): void {
    this.setup()
    const P = BOOK_PANEL
    const closeRect = this.frame(P, t.receitas)
    const { book, progress } = this.sv
    const known = new Set(progress.discovered)
    const recipes = [...book.recipes].sort((a, b) => a.tier - b.tier)
    const found = recipes.filter((r) => known.has(r.key)).length
    const header = t.descobertas(found, recipes.length)
    txt(this, W / 2, P.y + 46, header, 15, { color: C.mutedFg, bold: false })

    const area: Rect = { x: P.x + 18, y: P.y + 72, w: P.w - 50, h: P.h - 90 }
    const em = (id: string) => book.elements.get(id)?.emoji ?? '?'
    const entries: BookEntry[] = []
    const items: Phaser.GameObjects.GameObject[] = []
    let y = 0
    let tier = -1
    for (const r of recipes) {
      if (r.tier !== tier) {
        tier = r.tier
        items.push(txt(this, 4, y + HEADER_H / 2, t.nivel(tier), 15, { color: C.mutedFg }).setOrigin(0, 0.5))
        y += HEADER_H
      }
      const on = known.has(r.key)
      const name = book.elements.get(r.result)?.name ?? r.result
      entries.push({
        key: r.key, tier: r.tier, discovered: on, logic: r.logic,
        text: on ? `${em(r.a)} + ${em(r.b)} = ${em(r.result)} ${name}` : `? + ? = ${t.aindaSecreta}`,
      })
      const h = on ? CARD_FOUND : CARD_SECRET
      items.push(...(on ? this.foundCard(r, name, y, area.w - 4) : this.secretCard(y, area.w - 4)))
      y += h + GAP
    }
    const list = new Scroller(this, area, 'y', y, () => { /* entradas não são tocáveis */ }, true)
    list.content.add(items)

    const debug: BookDebug = { ready: true, header, entries, rects: { close: closeRect } }
    if (import.meta.env.DEV) window.__book = debug
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (import.meta.env.DEV && window.__book === debug) delete window.__book
    })
  }

  private card(y: number, w: number, h: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()
    drawBox(g, { x: 0, y, w, h }, { fill: C.muted, shade: C.paperShade, shadow: 3 })
    return g
  }

  private secretCard(y: number, w: number): Phaser.GameObjects.GameObject[] {
    return [this.card(y, w, CARD_SECRET),
      txt(this, w / 2, y + CARD_SECRET / 2 - 2, `? + ? =  ${t.aindaSecreta}`, 15, { color: C.mutedFg, bold: false })]
  }

  private foundCard(r: Recipe, name: string, y: number, w: number): Phaser.GameObjects.GameObject[] {
    const s = 30
    const cy = y + 24
    const out: Phaser.GameObjects.GameObject[] = [this.card(y, w, CARD_FOUND)]
    out.push(makePiece(this, this.sv.book, r.a, 26, cy, s), txt(this, 52, cy, '+', 16))
    out.push(makePiece(this, this.sv.book, r.b, 78, cy, s), txt(this, 104, cy, '=', 16))
    out.push(makePiece(this, this.sv.book, r.result, 130, cy, s))
    out.push(txt(this, 156, cy, name, 17).setOrigin(0, 0.5))
    out.push(txt(this, 12, y + 56, r.logic, 12, { color: C.mutedFg, bold: false, align: 'left', wrap: w - 24 })
      .setOrigin(0, 0.5))
    return out
  }
}
