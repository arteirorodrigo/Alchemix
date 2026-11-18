import Phaser from 'phaser'
import type { RecipeBook } from '../core/recipes'
import { C, elementColor } from './theme'
import { txt } from './widgets'

export const artKey = (file: string) => 'el:' + file

/** Ícone do elemento: PNG do protótipo quando houver, senão o emoji. */
export function elementIcon(
  scene: Phaser.Scene, book: RecipeBook, id: string, x: number, y: number, size: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  const def = book.elements.get(id)
  if (def?.art && scene.textures.exists(artKey(def.art))) {
    return scene.add.image(x, y, artKey(def.art)).setDisplaySize(size, size)
  }
  return txt(scene, x, y, def?.emoji ?? '?', Math.round(size * 0.78), { bold: false })
}

/** Peça do tabuleiro: quadrado na cor do elemento, faixa de sombra e a arte (ou emoji) no meio. */
export function makePiece(
  scene: Phaser.Scene, book: RecipeBook, id: string, x: number, y: number, s: number,
): Phaser.GameObjects.Container {
  const { fill, shade } = elementColor(id)
  const g = scene.add.graphics()
  const h = s / 2
  const band = Math.max(3, Math.round(s * 0.1))
  g.fillStyle(C.ink, 1).fillRect(-h, -h, s, s)
  g.fillStyle(shade, 1).fillRect(-h + 2, -h + 2, s - 4, s - 4)
  g.fillStyle(fill, 1).fillRect(-h + 2, -h + 2, s - 4, s - 4 - band)
  g.fillStyle(0xffffff, 0.45).fillRect(-h + 4, -h + 4, s - 8, 2)
  const icon = elementIcon(scene, book, id, 0, -band / 2, Math.round(s * 0.68))
  return scene.add.container(x, y, [g, icon])
}

/** Parede: bloco de pedra escura. */
export function drawWall(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number): void {
  const h = s / 2
  g.fillStyle(C.ink, 1).fillRect(x - h, y - h, s, s)
  g.fillStyle(C.earthDark, 1).fillRect(x - h + 2, y - h + 2, s - 4, s - 4)
  g.fillStyle(C.earth, 1).fillRect(x - h + 4, y - h + 4, s / 2 - 5, s / 2 - 5)
  g.fillRect(x + 1, y + 1, s / 2 - 5, s / 2 - 5)
}
