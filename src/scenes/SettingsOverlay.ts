import Phaser from 'phaser'
import type { Progress } from '../core/progress'
import { t } from '../i18n/pt-BR'
import { SETTINGS_PANEL, W, type Rect } from '../ui/layout'
import { C } from '../ui/theme'
import { drawBox, txt } from '../ui/widgets'
import { OverlayScene } from './overlay'

type Key = keyof Progress['settings']

export interface SettingsDebug {
  readonly ready: true
  readonly values: Progress['settings']
  readonly rects: Record<Key | 'close', Rect>
}

declare global { interface Window { __settings?: SettingsDebug } }

const ROWS: { key: Key; title: string; desc: string }[] = [
  { key: 'sound', title: t.sons, desc: t.sonsDesc },
  { key: 'vibration', title: t.vibracao, desc: t.vibracaoDesc },
  { key: 'leftHanded', title: t.canhoto, desc: t.canhotoDesc },
]

/** Ajustes: sons, vibração e modo canhoto, gravados em `Progress.settings` a cada toque. */
export class SettingsOverlay extends OverlayScene {
  constructor() { super('settings') }

  create(): void {
    this.setup()
    const P = SETTINGS_PANEL
    const closeRect = this.frame(P, t.ajustes)
    txt(this, W / 2, P.y + 44, t.ajustesSub, 15, { color: C.mutedFg, bold: false })

    const rects = { close: closeRect } as Record<Key | 'close', Rect>
    ROWS.forEach((row, i) => {
      const r: Rect = { x: P.x + 22, y: P.y + 76 + i * 84, w: P.w - 44, h: 70 }
      rects[row.key] = r
      const g = this.add.graphics()
      drawBox(g, r, { fill: C.muted, shade: C.paperShade })
      txt(this, r.x + 18, r.y + 24, row.title, 17).setOrigin(0, 0.5)
      txt(this, r.x + 18, r.y + 47, row.desc, 12, { color: C.mutedFg, bold: false }).setOrigin(0, 0.5)
      const sw = this.add.graphics()
      const draw = () => {
        const on = this.sv.progress.settings[row.key]
        const b: Rect = { x: r.x + r.w - 58, y: r.y + 24, w: 36, h: 20 }
        sw.clear()
        sw.fillStyle(C.ink, 1).fillRect(b.x, b.y, b.w, b.h)
        sw.fillStyle(on ? C.primary : C.card, 1).fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4)
        sw.fillStyle(on ? C.card : C.paperShade, 1).fillRect(on ? b.x + b.w / 2 : b.x + 2, b.y + 2, b.w / 2 - 2, b.h - 4)
      }
      draw()
      this.add.zone(r.x, r.y, r.w, r.h).setOrigin(0).setInteractive().on('pointerup', () => {
        this.sv.update((p) => ({ ...p, settings: { ...p.settings, [row.key]: !p.settings[row.key] } }))
        draw()
      })
    })

    const sv = this.sv
    const debug: SettingsDebug = { ready: true, get values() { return sv.progress.settings }, rects }
    if (import.meta.env.DEV) window.__settings = debug
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (import.meta.env.DEV && window.__settings === debug) delete window.__settings
    })
  }
}
