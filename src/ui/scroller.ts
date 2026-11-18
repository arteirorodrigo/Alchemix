import Phaser from 'phaser'
import type { Rect } from './layout'
import { C } from './theme'

const TAP_SLOP = 8

/**
 * Faixa rolável (arrastar ou roda do mouse) com máscara. O conteúdo vai em `content`, em coordenadas
 * locais a partir de (0, 0); um toque sem arrasto chama `onTap` com a posição local no conteúdo.
 */
export class Scroller {
  readonly content: Phaser.GameObjects.Container
  private offset = 0
  private bar?: Phaser.GameObjects.Graphics

  constructor(
    private scene: Phaser.Scene, readonly area: Rect, private axis: 'x' | 'y', private length: number,
    onTap: (lx: number, ly: number) => void, withBar = false,
  ) {
    this.content = scene.add.container(area.x, area.y)
    const mg = scene.make.graphics({}, false).fillStyle(0xffffff, 1).fillRect(area.x, area.y, area.w, area.h)
    this.content.setMask(mg.createGeometryMask())
    if (withBar) this.bar = scene.add.graphics()

    const zone = scene.add.zone(area.x, area.y, area.w, area.h).setOrigin(0).setInteractive()
    let start: { x: number; y: number; offset: number } | null = null
    let dragged = false
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      start = { x: p.worldX, y: p.worldY, offset: this.offset }
      dragged = false
    })
    const move = (p: Phaser.Input.Pointer) => {
      if (!start || !p.isDown) return
      const d = axis === 'x' ? p.worldX - start.x : p.worldY - start.y
      if (Math.abs(d) > TAP_SLOP) dragged = true
      if (dragged) this.scrollTo(start.offset - d)
    }
    const up = (p: Phaser.Input.Pointer) => {
      if (start && !dragged) onTap(p.worldX - this.content.x, p.worldY - this.content.y)
      start = null
    }
    scene.input.on('pointermove', move)
    scene.input.on('pointerup', up)
    zone.on('wheel', (_p: unknown, dx: number, dy: number) => this.scrollTo(this.offset + (axis === 'x' ? dx || dy : dy)))
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointermove', move)
      scene.input.off('pointerup', up)
    })
    this.scrollTo(0)
  }

  private get span(): number { return this.axis === 'x' ? this.area.w : this.area.h }
  get max(): number { return Math.max(0, this.length - this.span) }

  scrollTo(v: number): void {
    this.offset = Math.round(Math.min(this.max, Math.max(0, v)))
    if (this.axis === 'x') this.content.x = this.area.x - this.offset
    else this.content.y = this.area.y - this.offset
    this.drawBar()
  }

  /** Posição em coordenadas do mundo de um retângulo local do conteúdo. */
  toWorld(r: Rect): Rect { return { ...r, x: r.x + this.content.x, y: r.y + this.content.y } }

  private drawBar(): void {
    if (!this.bar || this.max === 0) return
    const a = this.area
    const h = Math.max(30, (a.h * a.h) / this.length)
    const y = a.y + ((a.h - h) * this.offset) / this.max
    this.bar.clear().fillStyle(C.paperShade, 1).fillRect(a.x + a.w + 6, a.y, 6, a.h)
    this.bar.fillStyle(C.mutedFg, 1).fillRect(a.x + a.w + 6, y, 6, h)
  }
}
