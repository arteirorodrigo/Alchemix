// Geometria das telas (coordenadas do jogo). Sem dependências: o Playwright importa daqui.
//
// A largura do mundo é fixa (390); a altura acompanha a proporção da tela, para que celulares
// baixos (320×568, 360×640) usem a largura toda em vez de ganhar faixas laterais. Fora do
// navegador (testes em Node) vale a referência 390×844.
export interface Rect { x: number; y: number; w: number; h: number }

export const W = 390
export const MIN_H = 692
export const MAX_H = 900

export function worldHeight(viewW: number, viewH: number): number {
  if (!(viewW > 0 && viewH > 0)) return 844
  return Math.min(MAX_H, Math.max(MIN_H, Math.round((W * viewH) / viewW)))
}

export const H = typeof window === 'undefined' ? 844 : worldHeight(window.innerWidth, window.innerHeight)
/** Telas baixas: topo, painel e rodapé mais enxutos para o tabuleiro 8×7 caber. */
export const COMPACT = H < 780

export const TOP = COMPACT
  ? { back: { x: 10, y: 6, w: 52, h: 52 } as Rect, title: { x: 135, y: 9, w: 120, h: 46 } as Rect,
      settings: { x: 328, y: 6, w: 52, h: 52 } as Rect }
  : { back: { x: 14, y: 18, w: 52, h: 52 } as Rect, title: { x: 135, y: 20, w: 120, h: 46 } as Rect,
      settings: { x: 324, y: 18, w: 52, h: 52 } as Rect }

export const PANEL: Rect = COMPACT ? { x: 18, y: 64, w: 354, h: 58 } : { x: 18, y: 88, w: 354, h: 84 }
export const LEGEND_Y = COMPACT ? 140 : 206
/** Altura máxima da legenda de receitas. */
export const LEGEND_MAX = COMPACT ? 28 : 48

const FOOTER_H = COMPACT ? 62 : 76
const FOOTER_Y = H - FOOTER_H - (COMPACT ? 6 : 16)

export const FOOTER = {
  book: { x: 12, y: FOOTER_Y, w: 56, h: FOOTER_H } as Rect,
  extra: { x: 74, y: FOOTER_Y, w: 122, h: FOOTER_H } as Rect,
  hint: { x: 202, y: FOOTER_Y, w: 88, h: FOOTER_H } as Rect,
  undo: { x: 296, y: FOOTER_Y, w: 82, h: FOOTER_H } as Rect,
}
export type FooterKey = keyof typeof FOOTER

/** Rodapé espelhado (modo canhoto): os botões principais ficam à esquerda. */
export function footerRects(leftHanded: boolean): Record<FooterKey, Rect> {
  if (!leftHanded) return FOOTER
  const m = (r: Rect): Rect => ({ ...r, x: W - r.x - r.w })
  return { book: m(FOOTER.book), extra: m(FOOTER.extra), hint: m(FOOTER.hint), undo: m(FOOTER.undo) }
}

/** Área disponível para a moldura do tabuleiro. */
const BOARD_TOP = COMPACT ? 158 : 236
export const BOARD_AREA: Rect = { x: 14, y: BOARD_TOP, w: 362, h: FOOTER_Y - (COMPACT ? 6 : 16) - BOARD_TOP }

// ---------- tela inicial ----------

const lerp = (a: number, b: number) => Math.round(a + (b - a) * Math.min(1, Math.max(0, (H - MIN_H) / (844 - MIN_H))))

export const HOME = {
  hints: { x: 18, y: lerp(10, 24), w: 124, h: 46 } as Rect,
  settings: { x: 320, y: lerp(8, 20), w: 52, h: 52 } as Rect,
  mascot: { x: W / 2, y: lerp(108, 168), size: lerp(96, 140) },
  logoY: lerp(192, 270),
  subtitle: { x: 118, y: lerp(226, 312), w: 154, h: 44 } as Rect,
  combo: { x: 66, y: lerp(282, 376), w: 258, h: 42 } as Rect,
  strip: { x: 18, y: H - 320, w: 354, h: 96 } as Rect,
  play: { x: 22, y: H - 208, w: 346, h: 72 } as Rect,
  book: { x: 22, y: H - 122, w: 346, h: 52 } as Rect,
  footY: H - 42,
}

// ---------- janelas (livro e ajustes) ----------

export const BOOK_PANEL: Rect = { x: 24, y: lerp(64, 136), w: 342, h: H - lerp(64, 136) - lerp(48, 136) }
export const SETTINGS_PANEL: Rect = { x: 24, y: Math.round(H / 2 - 170), w: 342, h: 340 }

export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
