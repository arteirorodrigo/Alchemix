import type { Board, Cell, ElementId, FallEvent, Move, Pos } from './types'
import type { RecipeBook } from './recipes'

export function parseBoard(rows: string[], legend: Record<string, ElementId>): Board {
  const cols = rows[0]?.length ?? 0
  const cells: Cell[] = []
  for (const row of rows) {
    if (row.length !== cols) throw new Error('Linhas do tabuleiro com tamanhos diferentes')
    for (const ch of row) {
      if (ch === '.') cells.push(null)
      else if (ch === '#') cells.push('#')
      else {
        const id = legend[ch]
        if (id === undefined) throw new Error(`Letra sem legenda: ${ch}`)
        cells.push(id)
      }
    }
  }
  return { rows: rows.length, cols, cells }
}

function inBounds(b: Board, p: Pos): boolean {
  return p.r >= 0 && p.r < b.rows && p.c >= 0 && p.c < b.cols
}

export function get(b: Board, p: Pos): Cell {
  if (!inBounds(b, p)) throw new RangeError(`Posição fora do tabuleiro: ${p.r},${p.c}`)
  return b.cells[p.r * b.cols + p.c]
}

export function set(b: Board, p: Pos, v: Cell): Board {
  if (!inBounds(b, p)) throw new RangeError(`Posição fora do tabuleiro: ${p.r},${p.c}`)
  const cells = b.cells.slice()
  cells[p.r * b.cols + p.c] = v
  return { rows: b.rows, cols: b.cols, cells }
}

export function isAdjacent(p: Pos, q: Pos): boolean {
  return Math.abs(p.r - q.r) + Math.abs(p.c - q.c) === 1
}

export function swap(b: Board, m: Move): Board {
  if (!isAdjacent(m.from, m.to)) throw new Error('Movimento entre casas não vizinhas')
  const x = get(b, m.from)
  const y = get(b, m.to)
  if (x === null || x === '#' || y === null || y === '#') {
    throw new Error('Só é possível trocar duas casas com elementos')
  }
  return set(set(b, m.from, y), m.to, x)
}

// Por coluna, peças caem até a parede ou o fundo mais próximo; paredes não se movem.
export function applyGravity(b: Board): { board: Board; falls: FallEvent[] } {
  const cells = b.cells.slice()
  const falls: FallEvent[] = []
  for (let c = 0; c < b.cols; c++) {
    let dest = b.rows - 1
    for (let r = b.rows - 1; r >= 0; r--) {
      const v = cells[r * b.cols + c]
      if (v === '#') dest = r - 1
      else if (v !== null) {
        if (dest !== r) {
          cells[dest * b.cols + c] = v
          cells[r * b.cols + c] = null
          falls.push({ from: { r, c }, to: { r: dest, c } })
        }
        dest--
      }
    }
  }
  return { board: { rows: b.rows, cols: b.cols, cells }, falls }
}

function isElement(v: Cell | undefined): v is ElementId {
  return v !== null && v !== undefined && v !== '#'
}

export function hasActivePair(b: Board, book: RecipeBook, active: ReadonlySet<string>): boolean {
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = b.cells[r * b.cols + c]
      if (!isElement(v)) continue
      const right = c + 1 < b.cols ? b.cells[r * b.cols + c + 1] : null
      const down = r + 1 < b.rows ? b.cells[(r + 1) * b.cols + c] : null
      if (isElement(right) && book.find(v, right, active)) return true
      if (isElement(down) && book.find(v, down, active)) return true
    }
  }
  return false
}

export function boardKey(b: Board): string {
  const body = b.cells.map(v => (v === null ? '.' : v === '#' ? '#' : v)).join('|')
  return `${b.rows}x${b.cols}:${body}`
}
