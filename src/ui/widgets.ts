import Phaser from 'phaser'
import { C, FONT, css } from './theme'
import type { Rect } from './layout'

/** Fator de zoom da câmera: o canvas é desenhado em alta densidade e a câmera amplia o mundo 390×844. */
export const ZOOM = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)))

export function setupCamera(scene: Phaser.Scene, w: number, h: number): void {
  scene.cameras.main.setZoom(ZOOM).centerOn(w / 2, h / 2)
}

export interface TextOpts { color?: number; bold?: boolean; shadow?: boolean; align?: string; wrap?: number }

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string, size: number, o: TextOpts = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: `${size}px`, color: css(o.color ?? C.ink),
    fontStyle: o.bold === false ? 'normal' : 'bold', align: o.align ?? 'center', resolution: ZOOM,
    wordWrap: o.wrap ? { width: o.wrap } : undefined,
  }).setOrigin(0.5)
  if (o.shadow) t.setShadow(2, 2, css(C.ink), 0, false, true)
  return t
}

export interface BoxStyle { fill: number; shade?: number; border?: number; shadow?: number }

/** Caixa "de papel": borda escura grossa, sombra dura e faixa de sombra embaixo (sem cantos arredondados). */
export function drawBox(g: Phaser.GameObjects.Graphics, r: Rect, s: BoxStyle): void {
  const b = s.border ?? 3
  const sh = s.shadow ?? 4
  if (sh > 0) g.fillStyle(C.ink, 1).fillRect(r.x + sh, r.y + sh, r.w, r.h)
  g.fillStyle(C.ink, 1).fillRect(r.x, r.y, r.w, r.h)
  g.fillStyle(s.fill, 1).fillRect(r.x + b, r.y + b, r.w - 2 * b, r.h - 2 * b)
  if (s.shade !== undefined) {
    const band = Math.max(4, Math.round(r.h * 0.09))
    g.fillStyle(s.shade, 1).fillRect(r.x + b, r.y + r.h - b - band, r.w - 2 * b, band)
  }
}

export interface ButtonStyle extends BoxStyle { label?: string; sub?: string; size?: number; textColor?: number }

/** Botão retangular com sombra dura; afunda ao tocar. `onTap` dispara no soltar dentro do botão. */
export class Button extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics
  private main?: Phaser.GameObjects.Text
  private subText?: Phaser.GameObjects.Text
  private enabled = true
  readonly icon: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, readonly rect: Rect, private style: ButtonStyle, onTap: () => void) {
    super(scene, rect.x, rect.y)
    const local = { x: 0, y: 0, w: rect.w, h: rect.h }
    this.g = scene.add.graphics()
    drawBox(this.g, local, style)
    this.add(this.g)
    this.icon = scene.add.graphics()
    this.add(this.icon)
    const fg = style.textColor ?? C.primaryFg
    const light = fg !== C.ink
    if (style.label !== undefined) {
      const y = style.sub !== undefined ? rect.h * 0.36 : rect.h / 2 - 2
      this.main = txt(scene, rect.w / 2, y, style.label, style.size ?? 18, { color: fg, shadow: light })
      this.add(this.main)
    }
    if (style.sub !== undefined) {
      this.subText = txt(scene, rect.w / 2, rect.h * 0.68, style.sub, 12, { color: fg, bold: false, shadow: light })
      this.add(this.subText)
    }
    this.setSize(rect.w, rect.h)
    const hit = new Phaser.Geom.Rectangle(rect.w / 2, rect.h / 2, rect.w, rect.h)
    this.setInteractive(hit, Phaser.Geom.Rectangle.Contains)
    let down = false
    this.on('pointerdown', () => { if (this.enabled) { down = true; this.y = rect.y + 2 } })
    this.on('pointerout', () => { down = false; this.y = rect.y })
    this.on('pointerup', () => {
      this.y = rect.y
      if (down && this.enabled) onTap()
      down = false
    })
    scene.add.existing(this)
  }

  setEnabled(on: boolean): this {
    this.enabled = on
    this.setAlpha(on ? 1 : 0.7)
    return this
  }

  get isEnabled(): boolean { return this.enabled }

  setLabel(s: string): this { this.main?.setText(s); return this }
  setSub(s: string): this { this.subText?.setText(s); return this }

  /** Reposiciona o rótulo para dar lugar a um ícone à esquerda. */
  shiftText(dx: number): this {
    this.main?.setX(this.rect.w / 2 + dx)
    return this
  }

  get styleDef(): ButtonStyle { return this.style }
}

/** Promessa que resolve quando o tween termina. */
export function tween(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((resolve) => scene.tweens.add({ ...cfg, onComplete: () => resolve() }))
}

export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, () => resolve()))
}
