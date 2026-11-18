import Phaser from 'phaser'
import type { RecipeBook } from '../core/recipes'
import type { Board, Move, Pos, StepEvents } from '../core/types'
import { BOARD_AREA, W, type Rect } from './layout'
import { drawWall, makePiece } from './pieces'
import { C } from './theme'
import { tween } from './widgets'

const GRASS = 12
const MAX_TILE = 58

/**
 * Espaçamentos da moldura. Tabuleiros de 7+ colunas usam a largura toda da tela, sem vão entre as
 * casas (cada peça já tem borda escura): é o que deixa as peças ≥ 44 px CSS numa tela de 320.
 */
interface Geometry { gap: number; pad: number; rim: number; area: Rect }
function geometry(cols: number): Geometry {
  return cols >= 7
    ? { gap: 0, pad: 3, rim: 3, area: { ...BOARD_AREA, x: 0, w: W } }
    : { gap: 5, pad: 8, rim: 4, area: BOARD_AREA }
}

export const TIMING = { swap: 120, react: 180, fallPerCell: 140 }

/** Tabuleiro na moldura de madeira com borda de grama; desenha, recebe toques e anima `StepEvents`. */
export class BoardView {
  readonly tile: number
  /** Moldura inteira (madeira + grama), em coordenadas do mundo. */
  readonly frame: Rect
  private gap: number
  private ox: number
  private oy: number
  private pieces = new Map<number, Phaser.GameObjects.Container>()
  private layer: Phaser.GameObjects.Container
  private walls: Phaser.GameObjects.Graphics
  private selection: Phaser.GameObjects.Graphics
  private hintG: Phaser.GameObjects.Graphics
  private hintTween?: Phaser.Tweens.Tween
  private rows: number
  private cols: number

  constructor(
    private scene: Phaser.Scene, private book: RecipeBook, board: Board,
    onTap: (r: number, c: number) => void,
  ) {
    this.rows = board.rows
    this.cols = board.cols
    const { gap: GAP, pad: PAD, rim: RIM, area } = geometry(this.cols)
    this.gap = GAP
    const frame = RIM + PAD
    const fitW = (area.w - 2 * frame - (this.cols - 1) * GAP) / this.cols
    const fitH = (area.h - 2 * frame - GRASS - (this.rows - 1) * GAP) / this.rows
    this.tile = Math.floor(Math.min(MAX_TILE, fitW, fitH))
    const gridW = this.cols * this.tile + (this.cols - 1) * GAP
    const gridH = this.rows * this.tile + (this.rows - 1) * GAP
    const fw = gridW + 2 * frame
    const fh = gridH + 2 * frame + GRASS
    const fx = Math.round(area.x + (area.w - fw) / 2)
    const fy = Math.round(area.y + Math.min(16, (area.h - fh) / 2))   // ancorado no alto, como no protótipo
    this.ox = fx + frame
    this.frame = { x: fx, y: fy, w: fw, h: fh }
    this.oy = fy + frame + GRASS

    const g = scene.add.graphics()
    g.fillStyle(C.ink, 1).fillRect(fx + 5, fy + 5, fw, fh)          // sombra dura
    g.fillStyle(C.ink, 1).fillRect(fx, fy, fw, fh)
    g.fillStyle(C.earth, 1).fillRect(fx + RIM, fy + RIM, fw - 2 * RIM, fh - 2 * RIM)
    for (let y = fy + RIM + GRASS + 10; y < fy + fh - RIM; y += 18) {   // veios da madeira
      if (PAD > 4) g.fillStyle(C.earthDark, 0.35).fillRect(fx + RIM, y, PAD - 2, 3).fillRect(fx + fw - RIM - PAD + 2, y + 9, PAD - 2, 3)
    }
    g.fillStyle(C.primary, 1).fillRect(fx + RIM, fy + RIM, fw - 2 * RIM, GRASS)
    g.fillStyle(C.primaryShade, 1).fillRect(fx + RIM, fy + RIM + GRASS - 4, fw - 2 * RIM, 4)
    for (let x = fx + RIM + 4; x < fx + fw - RIM - 4; x += 12) {          // tufos de grama
      g.fillStyle(C.primaryShade, 1).fillRect(x, fy + RIM + GRASS, 4, 4)
    }
    g.fillStyle(C.earthDark, 1).fillRect(this.ox - 3, this.oy - 3, gridW + 6, gridH + 6)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x, y } = this.xy({ r, c })
        const inset = GAP === 0 ? 1 : 0   // sem vão: um filete separa as casas vazias
        g.fillStyle(0x5a2f20, 1).fillRect(x - this.tile / 2 + inset, y - this.tile / 2 + inset, this.tile - 2 * inset, this.tile - 2 * inset)
      }
    }
    this.walls = scene.add.graphics()
    this.layer = scene.add.container(0, 0)
    this.hintG = scene.add.graphics()
    this.selection = scene.add.graphics()

    const zone = scene.add.zone(this.ox, this.oy, gridW, gridH).setOrigin(0).setInteractive()
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cell = this.cellAt(p.worldX, p.worldY)
      if (cell) onTap(cell.r, cell.c)
    })
    this.render(board)
  }

  xy(p: Pos): { x: number; y: number } {
    return {
      x: this.ox + p.c * (this.tile + this.gap) + this.tile / 2,
      y: this.oy + p.r * (this.tile + this.gap) + this.tile / 2,
    }
  }

  cellAt(x: number, y: number): Pos | null {
    const c = Math.floor((x - this.ox) / (this.tile + this.gap))
    const r = Math.floor((y - this.oy) / (this.tile + this.gap))
    if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return null
    return { r, c }
  }

  private idx(p: Pos): number { return p.r * this.cols + p.c }

  /** Redesenha todas as peças a partir do tabuleiro (fonte da verdade). */
  render(board: Board): void {
    for (const p of this.pieces.values()) p.destroy()
    this.pieces.clear()
    this.walls.clear()
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const v = board.cells[r * board.cols + c]
        const { x, y } = this.xy({ r, c })
        if (v === '#') drawWall(this.walls, x, y, this.tile)
        else if (v !== null) this.addPiece({ r, c }, v)
      }
    }
  }

  private addPiece(p: Pos, id: string): Phaser.GameObjects.Container {
    const { x, y } = this.xy(p)
    const piece = makePiece(this.scene, this.book, id, x, y, this.tile)
    this.layer.add(piece)
    this.pieces.set(this.idx(p), piece)
    return piece
  }

  setSelected(p: Pos | null): void {
    this.selection.clear()
    if (!p) return
    const { x, y } = this.xy(p)
    const h = this.tile / 2 + 3
    this.selection.lineStyle(4, 0xffffff, 1).strokeRect(x - h, y - h, 2 * h, 2 * h)
    this.selection.lineStyle(2, C.ink, 1).strokeRect(x - h - 3, y - h - 3, 2 * h + 6, 2 * h + 6)
  }

  /** Contorno pulsante nas duas casas da dica (até o próximo toque). */
  setHighlight(cells: [Pos, Pos] | null): void {
    this.hintTween?.remove()
    this.hintTween = undefined
    this.hintG.clear().setAlpha(1)
    if (!cells) return
    const h = this.tile / 2 + 2
    for (const p of cells) {
      const { x, y } = this.xy(p)
      this.hintG.lineStyle(6, C.accent, 1).strokeRect(x - h, y - h, 2 * h, 2 * h)
      this.hintG.lineStyle(2, C.accentShade, 1).strokeRect(x - h - 3, y - h - 3, 2 * h + 6, 2 * h + 6)
    }
    this.hintTween = this.scene.tweens.add({ targets: this.hintG, alpha: 0.4, duration: 420, yoyo: true, repeat: -1 })
  }

  /**
   * Anima a troca e cada passo da cadeia; `onStep(i)` roda ao fim das reações do passo i.
   * Ao final, sincroniza com `final` (o estado do núcleo é a fonte da verdade).
   */
  async animate(move: Move, steps: StepEvents[], final: Board, onStep: (i: number) => void): Promise<void> {
    const a = this.pieces.get(this.idx(move.from))
    const b = this.pieces.get(this.idx(move.to))
    const pa = this.xy(move.from)
    const pb = this.xy(move.to)
    await Promise.all([
      a ? tween(this.scene, { targets: a, x: pb.x, y: pb.y, duration: TIMING.swap }) : Promise.resolve(),
      b ? tween(this.scene, { targets: b, x: pa.x, y: pa.y, duration: TIMING.swap }) : Promise.resolve(),
    ])
    if (a) this.pieces.set(this.idx(move.to), a); else this.pieces.delete(this.idx(move.to))
    if (b) this.pieces.set(this.idx(move.from), b); else this.pieces.delete(this.idx(move.from))

    for (let i = 0; i < steps.length; i++) {
      await this.react(steps[i])
      onStep(i)
      await this.fall(steps[i])
    }
    this.render(final)
  }

  private async react(step: StepEvents): Promise<void> {
    const jobs: Promise<void>[] = []
    const results: { at: Pos; id: string; collected: boolean }[] = []
    for (const r of step.reactions) {
      const other = r.at.r === r.a.r && r.at.c === r.a.c ? r.b : r.a
      const at = this.xy(r.at)
      const glow = this.scene.add.circle(at.x, at.y, this.tile * 0.55, 0xfff6c0, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD).setScale(0.4)
      jobs.push(tween(this.scene, { targets: glow, scale: 1.5, alpha: 0, duration: TIMING.react })
        .then(() => glow.destroy()))
      const po = this.pieces.get(this.idx(other))
      if (po) jobs.push(tween(this.scene, { targets: po, x: at.x, y: at.y, scale: 0.5, alpha: 0, duration: TIMING.react }))
      const pt = this.pieces.get(this.idx(r.at))
      if (pt) jobs.push(tween(this.scene, { targets: pt, scale: 1.15, duration: TIMING.react }))
      results.push({ at: r.at, id: this.book.byKey(r.recipe).result, collected: r.collected })
    }
    await Promise.all(jobs)
    for (const r of step.reactions) {
      for (const p of [r.a, r.b]) {
        this.pieces.get(this.idx(p))?.destroy()
        this.pieces.delete(this.idx(p))
      }
    }
    for (const r of results) {
      const piece = this.addPiece(r.at, r.id).setScale(1.2)
      if (r.collected) {
        this.pieces.delete(this.idx(r.at))
        this.scene.tweens.add({
          targets: piece, y: piece.y - 60, scale: 0.6, alpha: 0, duration: 320, onComplete: () => piece.destroy(),
        })
      } else {
        this.scene.tweens.add({ targets: piece, scale: 1, duration: 90 })
      }
    }
  }

  private async fall(step: StepEvents): Promise<void> {
    if (step.falls.length === 0) return
    const moved = new Map<number, Phaser.GameObjects.Container>()
    const jobs: Promise<void>[] = []
    for (const f of step.falls) {
      const p = this.pieces.get(this.idx(f.from))
      if (!p) continue
      this.pieces.delete(this.idx(f.from))
      moved.set(this.idx(f.to), p)
      const to = this.xy(f.to)
      const cells = Math.abs(f.to.r - f.from.r)
      jobs.push(tween(this.scene, { targets: p, y: to.y, duration: TIMING.fallPerCell * cells, ease: 'Quad.easeIn' }))
    }
    for (const [k, p] of moved) this.pieces.set(k, p)
    await Promise.all(jobs)
  }
}
