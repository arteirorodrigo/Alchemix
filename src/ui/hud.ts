import Phaser from 'phaser'
import type { RecipeBook } from '../core/recipes'
import type { Goal } from '../core/types'
import { t } from '../i18n/pt-BR'
import * as icons from './icons'
import { FOOTER, LEGEND_MAX, LEGEND_Y, PANEL, TOP, W, footerRects, type FooterKey, type Rect } from './layout'
import { elementIcon } from './pieces'
import { C } from './theme'
import { Button, drawBox, txt } from './widgets'

export interface HudActions {
  back(): void; settings(): void; book(): void; extra(): void; hint(): void; undo(): void
}

/** Topo, painel MOVIMENTOS/OBJETIVO/PONTOS, legenda das receitas e rodapé de botões. */
export class Hud {
  private moves!: Phaser.GameObjects.Text
  private points!: Phaser.GameObjects.Text
  private goalTexts: Phaser.GameObjects.Text[] = []
  private bar!: Phaser.GameObjects.Graphics
  private legend?: Phaser.GameObjects.Container
  readonly goalAnchor = { x: PANEL.x + PANEL.w / 2, y: PANEL.y + 50 }
  readonly extra: Button
  readonly hint: Button
  readonly undo: Button
  readonly bookButton: Button
  readonly back: Button
  readonly settings: Button

  constructor(
    private scene: Phaser.Scene, private book: RecipeBook, levelNumber: number,
    private goals: Goal[], a: HudActions, leftHanded = false,
  ) {
    const back = this.back = new Button(scene, TOP.back, { fill: C.card, shade: C.paperShade }, a.back)
    icons.arrowLeft(back.icon, TOP.back.w / 2, TOP.back.h / 2 - 2, 22, C.ink)
    const settings = this.settings = new Button(scene, TOP.settings, { fill: C.card, shade: C.paperShade }, a.settings)
    icons.gear(settings.icon, TOP.settings.w / 2, TOP.settings.h / 2 - 2, 26, C.ink)
    const tg = scene.add.graphics()
    drawBox(tg, TOP.title, { fill: C.primary, shade: C.primaryShade })
    txt(scene, TOP.title.x + TOP.title.w / 2, TOP.title.y + TOP.title.h / 2 - 2, t.fase(levelNumber), 24,
      { color: C.primaryFg, shadow: true })

    this.buildPanel()

    const bk = this.bookButton = new Button(scene, FOOTER.book, { fill: C.card, shade: C.paperShade }, a.book)
    icons.book(bk.icon, FOOTER.book.w / 2, FOOTER.book.h / 2 - 2, 26, C.ink)
    this.extra = new Button(scene, FOOTER.extra,
      { fill: C.secondary, shade: C.secondaryShade, label: t.maisMovimentos, sub: t.verAnuncio, size: 15 }, a.extra)
    icons.tv(this.extra.icon, FOOTER.extra.w / 2 - 40, FOOTER.extra.h * 0.68 + 1, 13, C.primaryFg)
    this.extra.setSub('    ' + t.verAnuncio)
    this.hint = new Button(scene, FOOTER.hint,
      { fill: C.accent, shade: C.accentShade, label: t.dica, sub: '', size: 17, textColor: C.ink }, a.hint)
    icons.bulb(this.hint.icon, 22, FOOTER.hint.h * 0.36 - 1, 18, C.ink)
    this.hint.shiftText(9)
    this.undo = new Button(scene, FOOTER.undo,
      { fill: C.berry, shade: C.berryShade, label: t.desfazer, sub: '', size: 14 }, a.undo)
    this.setLeftHanded(leftHanded)
  }

  private get footerButtons(): Record<FooterKey, Button> {
    return { book: this.bookButton, extra: this.extra, hint: this.hint, undo: this.undo }
  }

  /** Modo canhoto: espelha o rodapé (só muda o x; o y de cada botão segue o original). */
  setLeftHanded(on: boolean): void {
    const rects = footerRects(on)
    for (const [k, b] of Object.entries(this.footerButtons)) b.setX(rects[k as FooterKey].x)
  }

  /** Retângulos atuais dos botões do rodapé. */
  footer(): Record<FooterKey, Rect> {
    const out = {} as Record<FooterKey, Rect>
    for (const [k, b] of Object.entries(this.footerButtons)) out[k as FooterKey] = { ...b.rect, x: b.x }
    return out
  }

  private buildPanel(): void {
    const s = this.scene
    const g = s.add.graphics()
    drawBox(g, PANEL, { fill: C.card })
    const col = PANEL.w / 3
    for (const i of [1, 2]) {
      const x = PANEL.x + col * i
      for (let y = PANEL.y + 12; y < PANEL.y + PANEL.h - 10; y += 6) g.fillStyle(C.paperShade, 1).fillRect(x - 1, y, 2, 3)
    }
    const k = PANEL.h / 84
    const labelY = PANEL.y + Math.round(22 * k)
    const valueY = PANEL.y + Math.round(52 * k)
    const cx = (i: number) => PANEL.x + col * i + col / 2
    txt(s, cx(0), labelY, t.movimentos, 11, { color: C.mutedFg, bold: false })
    txt(s, cx(1), labelY - 4, t.objetivo, 11, { color: C.mutedFg, bold: false })
    txt(s, cx(2), labelY, t.pontos, 11, { color: C.mutedFg, bold: false })
    const big = k < 1 ? 24 : 28
    this.moves = txt(s, cx(0), valueY, '0', big)
    this.points = txt(s, cx(2), valueY, '0', big)

    // objetivo: ícone + contador por meta, barra do progresso total
    const n = this.goals.length
    const slot = col / n
    this.goals.forEach((goal, i) => {
      const x0 = PANEL.x + col + slot * i
      const icon = 24
      const gy = PANEL.y + Math.round(42 * k)
      elementIcon(s, this.book, goal.element, x0 + slot / 2 - 18, gy, k < 1 ? 20 : icon)
      this.goalTexts.push(txt(s, x0 + slot / 2 + 14, gy, '', n > 1 ? 13 : 17).setOrigin(0.5))
    })
    this.bar = s.add.graphics()
  }

  setMoves(n: number): void { this.moves.setText(String(n)) }
  setPoints(n: number): void { this.points.setText(String(n)) }

  setCollected(collected: Record<string, number>): void {
    let have = 0
    let need = 0
    this.goals.forEach((g, i) => {
      const c = Math.min(g.count, collected[g.element] ?? 0)
      have += c
      need += g.count
      this.goalTexts[i].setText(`${c}/${g.count}`)
    })
    const col = PANEL.w / 3
    const k = PANEL.h / 84
    const bar: Rect = { x: PANEL.x + col + 14, y: PANEL.y + Math.round(60 * k), w: col - 28, h: k < 1 ? 10 : 12 }
    this.bar.clear()
    this.bar.fillStyle(C.ink, 1).fillRect(bar.x, bar.y, bar.w, bar.h)
    this.bar.fillStyle(C.muted, 1).fillRect(bar.x + 2, bar.y + 2, bar.w - 4, bar.h - 4)
    const fw = Math.round((bar.w - 4) * (need ? have / need : 0))
    if (fw > 0) this.bar.fillStyle(C.primary, 1).fillRect(bar.x + 2, bar.y + 2, fw, bar.h - 4)
  }

  /** Legenda das receitas ativas; `secret` mostra `? + ? = ?`. */
  setLegend(entries: { a: string; b: string; result: string; secret: boolean }[]): void {
    this.legend?.destroy()
    const s = this.scene
    const box = s.add.container(0, 0)
    const icon = 26
    const chipW = 116
    const chipH = 34
    // Quantas por linha: a divisão que deixa a legenda maior dentro de LEGEND_MAX × (largura útil).
    const fit = (per: number) => {
      const r = Math.ceil(entries.length / per)
      return Math.min(1, LEGEND_MAX / (r * chipH + (r - 1) * 6), (W - 28) / (per * (chipW + 8) - 8))
    }
    let perRow = 1
    for (let k = 2; k <= Math.max(1, entries.length); k++) if (fit(k) > fit(perRow) + 1e-6) perRow = k
    const rows = Math.ceil(entries.length / perRow)
    entries.forEach((e, i) => {
      const inRow = Math.min(perRow, entries.length - Math.floor(i / perRow) * perRow)
      const col = i % perRow
      const row = Math.floor(i / perRow)
      const x = (col - (inRow - 1) / 2) * (chipW + 8)
      const y = row * (chipH + 6)
      const g = s.add.graphics()
      drawBox(g, { x: x - chipW / 2, y: y - chipH / 2, w: chipW, h: chipH }, { fill: C.card, border: 2, shadow: 3 })
      box.add(g)
      const parts = e.secret ? ['?', '?', '?'] : [e.a, e.b, e.result]
      const xs = [x - 42, x - 21, x, x + 21, x + 42]
      parts.forEach((p, k) => {
        box.add(e.secret
          ? txt(s, xs[k * 2], y, '?', 18, { color: C.mutedFg })
          : elementIcon(s, this.book, p, xs[k * 2], y, icon))
      })
      box.add(txt(s, xs[1], y, '+', 16))
      box.add(txt(s, xs[3], y, '=', 16))
    })
    const scale = fit(perRow)
    box.setScale(scale).setPosition(W / 2, LEGEND_Y - ((rows - 1) * (chipH + 6) * scale) / 2)
    this.legend = box
  }
}
