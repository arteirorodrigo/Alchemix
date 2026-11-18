// Geometria da tela da fase (coordenadas do jogo, 390×844). Sem dependências: o Playwright importa daqui.
export interface Rect { x: number; y: number; w: number; h: number }

export const W = 390
export const H = 844

export const TOP = {
  back: { x: 14, y: 18, w: 52, h: 52 } as Rect,
  title: { x: 135, y: 20, w: 120, h: 46 } as Rect,
  settings: { x: 324, y: 18, w: 52, h: 52 } as Rect,
}

export const PANEL: Rect = { x: 18, y: 88, w: 354, h: 84 }
export const LEGEND_Y = 206
/** Área disponível para a moldura do tabuleiro. */
export const BOARD_AREA: Rect = { x: 14, y: 236, w: 362, h: 500 }

export const FOOTER = {
  book: { x: 12, y: 752, w: 56, h: 76 } as Rect,
  extra: { x: 74, y: 752, w: 122, h: 76 } as Rect,
  hint: { x: 202, y: 752, w: 88, h: 76 } as Rect,
  undo: { x: 296, y: 752, w: 82, h: 76 } as Rect,
}

export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
