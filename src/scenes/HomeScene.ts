import Phaser from 'phaser'
import { t } from '../i18n/pt-BR'
import * as icons from '../ui/icons'
import { H, HOME, W, type Rect } from '../ui/layout'
import { elementIcon } from '../ui/pieces'
import { Scroller } from '../ui/scroller'
import { C, css } from '../ui/theme'
import { Button, drawBox, setupCamera, txt } from '../ui/widgets'
import { OVERLAY_CLOSED, openOverlay } from './overlay'
import { SERVICES, type Services } from './services'

export interface HomeDebug {
  readonly ready: true
  readonly playLabel: string
  readonly recipesLabel: string
  readonly hintsLabel: string
  readonly strip: { level: number; stars: number }[]
  /** Retângulos em coordenadas do mundo: play, book, settings, strip0..stripN (posição atual da faixa). */
  readonly rects: Record<string, Rect>
}

declare global { interface Window { __home?: HomeDebug } }

const CHIP_W = 60
const CHIP_GAP = 10
const STRIP_LEN = 10

/** Tela inicial: dicas, ajustes, logo, JOGAR, livro de receitas e a faixa das últimas fases. */
export class HomeScene extends Phaser.Scene {
  private sv!: Services
  private hintsText!: Phaser.GameObjects.Text

  constructor() { super('home') }

  create(): void {
    setupCamera(this, W, H)
    this.sv = this.registry.get(SERVICES) as Services
    const p = this.sv.progress
    const bg = this.add.image(W / 2, H / 2, 'fundo')
    bg.setScale(Math.max(W / bg.width, H / bg.height))

    // topo
    const hg = this.add.graphics()
    drawBox(hg, HOME.hints, { fill: C.card, shade: C.paperShade })
    icons.bulb(hg, HOME.hints.x + 26, HOME.hints.y + HOME.hints.h / 2 - 1, 18, C.accentShade)
    this.hintsText = txt(this, HOME.hints.x + 44, HOME.hints.y + HOME.hints.h / 2 - 2, t.dicas(p.hints), 17)
      .setOrigin(0, 0.5)
    const gear = new Button(this, HOME.settings, { fill: C.card, shade: C.paperShade }, () => openOverlay(this, 'settings'))
    icons.gear(gear.icon, HOME.settings.w / 2, HOME.settings.h / 2 - 2, 26, C.ink)

    // mascote e logo
    const m = HOME.mascot
    const mascot = this.add.image(m.x, m.y, 'mascote').setDisplaySize(m.size, m.size)
    this.tweens.add({ targets: mascot, y: m.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    const logo = txt(this, W / 2, HOME.logoY, t.logo, 62, { color: C.primaryFg })
    logo.setStroke(css(C.ink), 10).setShadow(4, 5, css(C.ink), 0, true, true)
    const sg = this.add.graphics()
    drawBox(sg, HOME.subtitle, { fill: C.accent, shade: C.accentShade })
    txt(this, W / 2, HOME.subtitle.y + HOME.subtitle.h / 2 - 2, t.logoSub, 20)
    this.combo(HOME.combo)

    this.levelStrip(HOME.strip)

    const current = p.inProgress?.levelNumber ?? p.currentLevel
    const playLabel = t.jogar(current)
    const play = new Button(this, HOME.play, { fill: C.primary, shade: C.primaryShade, label: playLabel, size: 28 },
      () => this.startLevel(current))
    play.shiftText(16)
    icons.playTriangle(play.icon, HOME.play.w / 2 + 16 - play.labelWidth / 2 - 24, HOME.play.h / 2 - 3, 22, C.primaryFg)

    const known = new Set(p.discovered)
    const found = this.sv.book.recipes.filter((r) => known.has(r.key)).length
    const recipesLabel = t.receitasBotao(found, this.sv.book.recipes.length)
    const bk = new Button(this, HOME.book, { fill: C.card, shade: C.paperShade, label: recipesLabel, size: 18, textColor: C.ink },
      () => openOverlay(this, 'book'))
    bk.shiftText(12)
    icons.book(bk.icon, HOME.book.w / 2 - 82, HOME.book.h / 2 - 2, 22, C.ink)
    txt(this, W / 2, HOME.footY, t.umaMao, 12, { color: C.primaryFg, bold: false, shadow: true })

    this.events.on(OVERLAY_CLOSED, () => this.hintsText.setText(t.dicas(this.sv.progress.hints)))
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(OVERLAY_CLOSED)
      if (import.meta.env.DEV && window.__home === debug) delete window.__home
    })

    const scene = this
    const debug: HomeDebug = {
      ready: true, playLabel, recipesLabel,
      get hintsLabel() { return scene.hintsText.text },
      strip: this.stripLevels().map((n) => ({ level: n, stars: p.stars[n] ?? 0 })),
      get rects() { return scene.debugRects() },
    }
    if (import.meta.env.DEV) window.__home = debug
  }

  private startLevel(n: number): void {
    this.scene.start('game', { levelNumber: n })
  }

  /** Faixa "💧 + 🪨 = 🟤 e o que mais?" com a arte dos elementos. */
  private combo(r: Rect): void {
    const g = this.add.graphics()
    drawBox(g, r, { fill: C.card, shade: C.paperShade })
    const y = r.y + r.h / 2 - 2
    const book = this.sv.book
    elementIcon(this, book, 'agua', r.x + 30, y, 26)
    txt(this, r.x + 54, y, '+', 16)
    elementIcon(this, book, 'pedra', r.x + 78, y, 26)
    txt(this, r.x + 102, y, '=', 16)
    elementIcon(this, book, 'barro', r.x + 126, y, 26)
    txt(this, r.x + 150, y, t.oQueMais, 15, { bold: false }).setOrigin(0, 0.5)
  }

  // ---------- faixa de fases ----------

  private strip?: Scroller

  /** Últimas 10 fases alcançadas (a atual incluída). */
  private stripLevels(): number[] {
    const cur = this.sv.progress.currentLevel
    const first = Math.max(1, cur - STRIP_LEN + 1)
    return Array.from({ length: cur - first + 1 }, (_, i) => first + i)
  }

  private stripPad = 0
  private chipRect(i: number): Rect { return { x: this.stripPad + i * (CHIP_W + CHIP_GAP), y: 0, w: CHIP_W, h: 66 } }

  private levelStrip(r: Rect): void {
    const g = this.add.graphics()
    drawBox(g, r, { fill: C.card, shade: C.paperShade })
    txt(this, r.x + 14, r.y + 14, t.fases, 12, { color: C.mutedFg }).setOrigin(0, 0.5)
    const levels = this.stripLevels()
    const cur = this.sv.progress.currentLevel
    const area: Rect = { x: r.x + 10, y: r.y + 24, w: r.w - 20, h: 66 }
    const length = levels.length * (CHIP_W + CHIP_GAP) - CHIP_GAP
    // centraliza quando cabe; senão começa mostrando a fase atual (fim da faixa)
    this.stripPad = Math.max(0, Math.round((area.w - length) / 2))
    const strip = new Scroller(this, area, 'x', length, (lx) => {
      const x = lx - this.stripPad
      const i = Math.floor(x / (CHIP_W + CHIP_GAP))
      if (i >= 0 && i < levels.length && x - i * (CHIP_W + CHIP_GAP) <= CHIP_W) {
        const n = levels[i]
        const p = this.sv.progress
        this.startLevel(n === cur && p.inProgress ? p.inProgress.levelNumber : n)
      }
    })
    levels.forEach((n, i) => {
      const c = this.chipRect(i)
      const stars = this.sv.progress.stars[n] ?? 0
      const isCur = n === cur
      const cg = this.add.graphics()
      drawBox(cg, { ...c, h: c.h - 4 }, isCur
        ? { fill: C.primary, shade: C.primaryShade, shadow: 3 }
        : { fill: C.muted, shade: C.paperShade, shadow: 3 })
      strip.content.add(cg)
      strip.content.add(txt(this, c.x + c.w / 2, 22, String(n), 22, isCur ? { color: C.primaryFg, shadow: true } : {}))
      const sg = this.add.graphics()
      for (let k = 0; k < 3; k++) icons.star(sg, c.x + c.w / 2 + (k - 1) * 18, 46, 8.5, k < stars ? C.accent : C.card, C.ink, 1.5)
      strip.content.add(sg)
    })
    strip.scrollTo(strip.max)
    this.strip = strip
  }

  private debugRects(): Record<string, Rect> {
    const out: Record<string, Rect> = { play: HOME.play, book: HOME.book, settings: HOME.settings }
    this.stripLevels().forEach((_, i) => { if (this.strip) out[`strip${i}`] = this.strip.toWorld(this.chipRect(i)) })
    return out
  }
}
