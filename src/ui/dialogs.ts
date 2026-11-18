import Phaser from 'phaser'
import type { RecipeBook } from '../core/recipes'
import type { Recipe } from '../core/types'
import { t } from '../i18n/pt-BR'
import * as icons from './icons'
import { FOOTER, H, W, type Rect } from './layout'
import { elementIcon } from './pieces'
import { C } from './theme'
import { Button, drawBox, txt } from './widgets'

/** Mensagem curta acima do rodapé que some sozinha. */
export function toast(scene: Phaser.Scene, text: string, ms = 2200): void {
  const w = 330
  const y = FOOTER.book.y - 52
  const g = scene.add.graphics()
  drawBox(g, { x: -w / 2, y: -22, w, h: 44 }, { fill: C.card, border: 3, shadow: 4 })
  const label = txt(scene, 0, 0, text, 14, { wrap: w - 20 })
  const c = scene.add.container(W / 2, y, [g, label]).setDepth(50).setAlpha(0)
  scene.tweens.add({ targets: c, alpha: 1, duration: 150 })
  scene.time.delayedCall(ms, () => scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() }))
}

/** Cartão "💧 + 🪨 = Barro · descoberta!" ao revelar uma receita nova. */
export function discoveryCard(scene: Phaser.Scene, book: RecipeBook, r: Recipe): void {
  const w = 320
  const h = 96
  const g = scene.add.graphics()
  drawBox(g, { x: -w / 2, y: -h / 2, w, h }, { fill: C.card, shade: C.paperShade, shadow: 5 })
  const items: Phaser.GameObjects.GameObject[] = [g]
  const y = -14
  items.push(elementIcon(scene, book, r.a, -110, y, 34), txt(scene, -80, y, '+', 22))
  items.push(elementIcon(scene, book, r.b, -50, y, 34), txt(scene, -20, y, '=', 22))
  items.push(elementIcon(scene, book, r.result, 12, y, 34))
  const name = book.elements.get(r.result)?.name ?? r.result
  items.push(txt(scene, 34, y, name, 20).setOrigin(0, 0.5))
  items.push(txt(scene, 0, 26, '· ' + t.descoberta + ' ·', 15, { color: C.primaryShade }))
  const card = scene.add.container(W / 2, 300, items).setDepth(60).setScale(0.6).setAlpha(0)
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' })
  scene.time.delayedCall(2200, () =>
    scene.tweens.add({ targets: card, alpha: 0, y: 260, duration: 300, onComplete: () => card.destroy() }))
}

interface DialogButton { label: string; sub?: string; fill: number; shade: number; textColor?: number; onTap(): void }

/**
 * Diálogo modal: escurece a tela (até `coverBottom`) e bloqueia toques por baixo.
 * Devolve o container para ser destruído ao fechar.
 */
function dialog(
  scene: Phaser.Scene, title: string, coverBottom: number, height: number,
  body: (c: Phaser.GameObjects.Container, top: number) => void, buttons: DialogButton[],
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0).setDepth(80)
  const dim = scene.add.rectangle(0, 0, W, coverBottom, C.overlay, 0.72).setOrigin(0).setInteractive()
  root.add(dim)
  const w = 320
  const x = (W - w) / 2
  const top = Math.round((coverBottom - height) / 2) + 10
  const g = scene.add.graphics()
  drawBox(g, { x, y: top, w, h: height }, { fill: C.card, shadow: 6 })
  root.add(g)
  const label = txt(scene, W / 2, top - 2, title, 22, { color: C.primaryFg, shadow: true })
  if (label.width > 300) label.setFontSize(18)
  const rw = Math.min(340, Math.ceil(label.width) + 40)
  const rib = scene.add.graphics()
  drawBox(rib, { x: W / 2 - rw / 2, y: top - 22, w: rw, h: 44 }, { fill: C.primary, shade: C.primaryShade })
  root.add([rib, label])
  body(root, top)
  const bh = 62
  const rects: Rect[] = []
  buttons.forEach((b, i) => {
    const by = top + height - 18 - (buttons.length - i) * (bh + 12) + 12
    rects.push({ x: x + 24, y: by, w: w - 48, h: bh })
    const btn = new Button(scene, rects[i],
      { fill: b.fill, shade: b.shade, label: b.label, sub: b.sub, size: 18, textColor: b.textColor }, b.onTap)
    root.add(btn)
  })
  root.setData('buttons', rects)   // retângulos dos botões (para os testes)
  root.setAlpha(0)
  scene.tweens.add({ targets: root, alpha: 1, duration: 200 })
  return root
}

export function winDialog(
  scene: Phaser.Scene, nStars: number, points: number, onNext: () => void,
): Phaser.GameObjects.Container {
  return dialog(scene, t.vitoria, H, 330, (root, top) => {
    root.add(scene.add.image(W / 2, top + 72, 'mascote').setDisplaySize(96, 96))
    const g = scene.add.graphics()
    for (let i = 0; i < 3; i++) {
      const on = i < nStars
      icons.star(g, W / 2 + (i - 1) * 62, top + 150 - (i === 1 ? 8 : 0), i === 1 ? 26 : 22,
        on ? C.accent : C.muted, C.ink)
    }
    root.add(g)
    root.add(txt(scene, W / 2, top + 196, t.pontosFinal(points), 18, { color: C.mutedFg }))
  }, [{ label: t.proximaFase, fill: C.primary, shade: C.primaryShade, onTap: onNext }])
}

/** Derrota: cobre só até o rodapé, que continua usável (desfazer / +3). */
export function loseDialog(
  scene: Phaser.Scene, canExtra: boolean, onExtra: () => void, onRetry: () => void,
): Phaser.GameObjects.Container {
  const buttons: DialogButton[] = []
  if (canExtra) buttons.push({ label: t.maisMovimentosAnuncio, fill: C.secondary, shade: C.secondaryShade, onTap: onExtra })
  buttons.push({ label: t.tentarDeNovo, fill: C.accent, shade: C.accentShade, textColor: C.ink, onTap: onRetry })
  const height = 120 + buttons.length * 74
  return dialog(scene, t.derrota, FOOTER.book.y - 8, height, (root, top) => {
    root.add(txt(scene, W / 2, top + 64, t.derrotaTexto, 16, { wrap: 270 }))
  }, buttons)
}
