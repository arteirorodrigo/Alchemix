import Phaser from 'phaser'
import * as icons from '../ui/icons'
import { H, W, type Rect } from '../ui/layout'
import { C } from '../ui/theme'
import { drawBox, setupCamera, txt } from '../ui/widgets'
import { SERVICES, type Services } from './services'

export type OverlayKey = 'book' | 'settings'
/** Emitido na cena de baixo quando uma janela fecha (`key` da janela como argumento). */
export const OVERLAY_CLOSED = 'overlay-closed'

/** Abre uma janela (livro ou ajustes) por cima de `from`, que para de receber toques até ela fechar. */
export function openOverlay(from: Phaser.Scene, key: OverlayKey): void {
  if (from.scene.isActive(key)) return
  from.input.enabled = false
  from.scene.launch(key, { from: from.scene.key })
}

/** Base das janelas modais: fundo escurecido, papel creme, faixa verde de título e X para fechar. */
export abstract class OverlayScene extends Phaser.Scene {
  protected sv!: Services
  private parentKey = ''

  init(data: { from?: string }): void { this.parentKey = data.from ?? 'home' }

  protected setup(): void {
    setupCamera(this, W, H)
    this.sv = this.registry.get(SERVICES) as Services
  }

  protected close(): void {
    const parent = this.scene.get(this.parentKey)
    this.scene.stop()
    parent.input.enabled = true
    parent.events.emit(OVERLAY_CLOSED, this.scene.key)
  }

  /** Desenha a moldura e devolve o retângulo (área de toque) do X. */
  protected frame(panel: Rect, title: string): Rect {
    this.add.rectangle(0, 0, W, H, C.overlay, 0.62).setOrigin(0).setInteractive()
    const g = this.add.graphics()
    drawBox(g, panel, { fill: C.card, shadow: 6 })
    const label = txt(this, W / 2, panel.y - 4, title, 24, { color: C.primaryFg, shadow: true }).setDepth(1)
    const rw = Math.ceil(label.width) + 44
    drawBox(g, { x: W / 2 - rw / 2, y: panel.y - 26, w: rw, h: 44 }, { fill: C.primary, shade: C.primaryShade })

    // 54×54: ≥ 48 px CSS já na largura 360 (54 × 360/390 ≈ 49,8)
    const x: Rect = { x: panel.x + panel.w - 58, y: panel.y + 3, w: 54, h: 54 }
    const xg = this.add.graphics()
    icons.close(xg, x.x + x.w / 2, x.y + x.h / 2, 14, C.ink)
    this.add.zone(x.x, x.y, x.w, x.h).setOrigin(0).setInteractive().on('pointerup', () => this.close())
    return x
  }
}
