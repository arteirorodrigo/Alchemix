import Phaser from 'phaser'
import { addExtraMoves, canUndoFree, newGame, play, stars, undo, type GameState } from '../core/game'
import { generateLevel } from '../core/generator'
import { getHint } from '../core/hint'
import { recordSeen, recordWin } from '../core/progress'
import { isAdjacent } from '../core/board'
import type { Level, Move, Pos } from '../core/types'
import { t } from '../i18n/pt-BR'
import { BoardView } from '../ui/boardView'
import { discoveryCard, loseDialog, toast, winDialog } from '../ui/dialogs'
import { Hud } from '../ui/hud'
import { H, W } from '../ui/layout'
import { setupCamera } from '../ui/widgets'
import { SERVICES, type Services } from './services'

type Overlay = 'win' | 'lose' | null

export interface GameDebug {
  readonly state: GameState
  readonly level: Level
  readonly animating: boolean
  readonly highlight: [Pos, Pos] | null
  readonly overlay: Overlay
  readonly legend: string[]
  tap(r: number, c: number): void
}

declare global { interface Window { __game?: GameDebug } }

/** Tela da fase: liga o núcleo (`src/core`) ao tabuleiro, HUD e diálogos. */
export class GameScene extends Phaser.Scene {
  private sv!: Services
  private level!: Level
  private state!: GameState
  private points: number[] = [0]
  private board!: BoardView
  private hud!: Hud
  private selected: Pos | null = null
  private highlight: [Pos, Pos] | null = null
  private animating = false
  private busy = false                       // esperando anúncio
  private overlay: Overlay = null
  private dialogBox?: Phaser.GameObjects.Container
  private levelNumber = 1

  constructor() { super('game') }

  init(data: { levelNumber?: number }): void {
    this.levelNumber = data.levelNumber ?? 1
    this.selected = null
    this.highlight = null
    this.animating = false
    this.busy = false
    this.overlay = null
    this.dialogBox = undefined
  }

  create(): void {
    setupCamera(this, W, H)
    this.sv = this.registry.get(SERVICES) as Services
    const { book } = this.sv
    this.level = generateLevel(this.levelNumber, book)
    const saved = this.sv.progress.inProgress
    this.state = saved && saved.levelNumber === this.levelNumber && saved.status !== 'won' ? saved : newGame(this.level)
    this.points = this.sv.loadPoints(this.levelNumber, this.state.history.length)

    const bg = this.add.image(W / 2, H / 2, 'fundo')
    bg.setScale(Math.max(W / bg.width, H / bg.height))

    this.hud = new Hud(this, book, this.levelNumber, this.level.goals, {
      back: () => { if (!this.locked()) this.scene.start('boot') },
      settings: () => toast(this, t.emBreve),
      book: () => toast(this, t.emBreve),
      extra: () => void this.useExtraMoves(),
      hint: () => void this.useHint(),
      undo: () => void this.useUndo(),
    })
    this.board = new BoardView(this, book, this.state.board, (r, c) => this.onCellTap(r, c))
    this.refreshHud()
    this.refreshLegend()
    if (this.state.status === 'lost') this.showLose()

    const onVisibility = () => { if (document.visibilityState === 'hidden') this.saveInProgress() }
    document.addEventListener('visibilitychange', onVisibility)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (import.meta.env.DEV && window.__game === debug) delete window.__game
    })

    const scene = this
    const debug: GameDebug = {
      get state() { return scene.state },
      get level() { return scene.level },
      get animating() { return scene.animating },
      get highlight() { return scene.highlight },
      get overlay() { return scene.overlay },
      get legend() { return scene.legendStrings() },
      tap: (r, c) => this.onCellTap(r, c),
    }
    if (import.meta.env.DEV) window.__game = debug
  }

  private locked(): boolean { return this.animating || this.busy }

  // ---------- entrada no tabuleiro (ponteiro e __game.tap passam por aqui) ----------

  private onCellTap(r: number, c: number): void {
    if (this.locked() || this.overlay || this.state.status !== 'playing') return
    if (r < 0 || c < 0 || r >= this.state.board.rows || c >= this.state.board.cols) return
    if (this.highlight) { this.highlight = null; this.board.setHighlight(null) }
    const v = this.state.board.cells[r * this.state.board.cols + c]
    const p = { r, c }
    if (v === null || v === '#') return this.select(null)
    const sel = this.selected
    if (!sel) return this.select(p)
    if (sel.r === r && sel.c === c) return this.select(null)
    if (isAdjacent(sel, p)) {
      this.select(null)
      void this.doMove({ from: sel, to: p })
      return
    }
    this.select(p)
  }

  private select(p: Pos | null): void {
    this.selected = p
    this.board.setSelected(p)
  }

  private async doMove(m: Move): Promise<void> {
    this.animating = true
    this.refreshButtons()
    const { book } = this.sv
    const known = new Set([...this.sv.progress.discovered, ...this.state.seen])
    const { state, result } = play(this.state, m, this.level, book)
    this.state = state
    let pts = this.points[this.points.length - 1]
    this.points = [...this.points, pts]
    this.saveInProgress()
    const fresh = result.newlySeen.filter((k) => !known.has(k))
    if (fresh.length) this.sv.update((p) => recordSeen(p, fresh))
    this.hud.setMoves(state.movesLeft)

    const collected: Record<string, number> = { ...this.prevCollected() }
    await this.board.animate(m, result.steps, state.board, (i) => {
      const step = result.steps[i]
      pts += 10 * step.reactions.length * (i + 1)
      this.hud.setPoints(pts)
      for (const r of step.reactions) {
        if (!r.collected) continue
        const el = book.byKey(r.recipe).result
        collected[el] = (collected[el] ?? 0) + 1
      }
      this.hud.setCollected(collected)
    })
    this.points[this.points.length - 1] = pts
    this.sv.savePoints(this.levelNumber, this.points)
    for (const k of fresh) discoveryCard(this, book, book.byKey(k))
    if (fresh.length) this.refreshLegend()
    this.animating = false
    this.refreshHud()
    if (state.status === 'won') this.finishWin()
    else if (state.status === 'lost') this.showLose()
  }

  private prevCollected(): Record<string, number> {
    const h = this.state.history
    return h.length ? h[h.length - 1].collected : {}
  }

  // ---------- botões ----------

  private async useHint(): Promise<void> {
    if (this.locked() || this.overlay || this.state.status !== 'playing') return
    if (this.sv.progress.hints > 0) {
      this.sv.update((p) => ({ ...p, hints: p.hints - 1 }))
    } else if (!(await this.watchAd('hint'))) return
    this.refreshButtons()
    const h = getHint(this.state, this.level, this.sv.book)
    if (h.kind === 'undo') return toast(this, t.semSaida)
    this.select(null)
    this.highlight = [h.move.from, h.move.to]
    this.board.setHighlight(this.highlight)
  }

  private async useUndo(): Promise<void> {
    if (this.locked() || this.overlay === 'win' || this.state.history.length === 0) return
    if (!canUndoFree(this.state) && !(await this.watchAd('undo'))) return
    this.state = undo(this.state)
    this.points = this.points.slice(0, -1)
    this.closeDialog()
    this.select(null)
    this.highlight = null
    this.board.setHighlight(null)
    this.board.render(this.state.board)
    this.saveInProgress()
    this.sv.savePoints(this.levelNumber, this.points)
    this.refreshHud()
  }

  private async useExtraMoves(): Promise<void> {
    if (this.locked() || this.state.status !== 'lost' || this.state.extraMovesUsed) return
    if (!(await this.watchAd('extra-moves'))) return
    this.state = addExtraMoves(this.state)
    this.closeDialog()
    this.saveInProgress()
    this.refreshHud()
  }

  private async watchAd(reason: 'undo' | 'extra-moves' | 'hint'): Promise<boolean> {
    this.busy = true
    this.refreshButtons()
    try {
      return await this.sv.ads.showRewarded(reason)
    } finally {
      this.busy = false
      this.refreshButtons()
    }
  }

  // ---------- fim de fase ----------

  private finishWin(): void {
    const n = stars(this.state, this.level)
    this.sv.update((p) => recordWin(p, this.levelNumber, n, this.state.seen))
    this.sv.savePoints(this.levelNumber + 1, [0])
    this.overlay = 'win'
    const pts = this.points[this.points.length - 1]
    this.time.delayedCall(350, () => {
      this.dialogBox = winDialog(this, n, pts, () => this.scene.restart({ levelNumber: this.levelNumber + 1 }))
    })
  }

  private showLose(): void {
    this.overlay = 'lose'
    this.dialogBox = loseDialog(this, !this.state.extraMovesUsed,
      () => void this.useExtraMoves(),
      () => this.retry())
    this.refreshButtons()
  }

  private retry(): void {
    if (this.locked()) return
    this.closeDialog()
    this.state = newGame(this.level)
    this.points = [0]
    this.select(null)
    this.board.render(this.state.board)
    this.saveInProgress()
    this.sv.savePoints(this.levelNumber, this.points)
    this.refreshHud()
  }

  private closeDialog(): void {
    this.dialogBox?.destroy()
    this.dialogBox = undefined
    this.overlay = null
  }

  // ---------- persistência e HUD ----------

  private saveInProgress(): void {
    if (this.state.status === 'won') return
    this.sv.update((p) => ({ ...p, inProgress: this.state }))
  }

  private refreshHud(): void {
    this.hud.setMoves(this.state.movesLeft)
    this.hud.setCollected(this.state.collected)
    this.hud.setPoints(this.points[this.points.length - 1])
    this.refreshButtons()
  }

  private refreshButtons(): void {
    const s = this.state
    const free = !this.locked()
    this.hud.extra.setEnabled(free && s.status === 'lost' && !s.extraMovesUsed)
    this.hud.hint.setEnabled(free && s.status === 'playing' && this.overlay === null)
    const hints = this.sv.progress.hints
    this.hud.hint.setSub(hints > 0 ? t.restantes(hints) : t.dicaAnuncio)
    this.hud.undo.setEnabled(free && s.history.length > 0 && this.overlay !== 'win')
    this.hud.undo.setSub(canUndoFree(s) ? t.gratis : t.verAnuncio)
  }

  private legendEntries() {
    const known = new Set([...this.sv.progress.discovered, ...this.state.seen])
    return this.level.active.map((k) => {
      const r = this.sv.book.byKey(k)
      return { a: r.a, b: r.b, result: r.result, secret: k === this.level.newRecipe && !known.has(k) }
    })
  }

  private refreshLegend(): void { this.hud.setLegend(this.legendEntries()) }

  private legendStrings(): string[] {
    const em = (id: string) => this.sv.book.elements.get(id)?.emoji ?? '?'
    return this.legendEntries().map((e) => e.secret ? t.receitaSecreta : `${em(e.a)} + ${em(e.b)} = ${em(e.result)}`)
  }
}
