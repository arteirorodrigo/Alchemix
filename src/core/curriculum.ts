import type { RecipeBook } from './recipes'

export interface LevelParams {
  number: number
  rows: number
  cols: number
  unlocked: string[]
  newRecipe?: string
  activeCount: number
  playoutMoves: number
  slack: number
  walls: number
}

function isIntroLevel(n: number): boolean {
  return n === 1 || n === 2 || n === 4 || n === 6 || n === 8 || (n > 8 && (n - 8) % 3 === 0)
}

// Por livro: introduções por fase (índice n) e lista acumulada de desbloqueios.
interface Progress { intro: (string | undefined)[]; unlocked: string[]; level: number }
const cache = new WeakMap<RecipeBook, Progress>()

function advance(book: RecipeBook, p: Progress, upTo: number): void {
  const order = book.unlockOrder()
  while (p.level < upTo) {
    const n = ++p.level
    let added: string | undefined
    if (isIntroLevel(n)) {
      const known = new Set<string>(book.base())
      for (const k of p.unlocked) known.add(book.byKey(k).result)
      const have = new Set(p.unlocked)
      added = order.find(k => {
        if (have.has(k)) return false
        const r = book.byKey(k)
        return known.has(r.a) && known.has(r.b)
      })
      if (added) p.unlocked.push(added)
    }
    p.intro[n] = added
  }
}

export function paramsFor(n: number, book: RecipeBook): LevelParams {
  let p = cache.get(book)
  if (!p) { p = { intro: [], unlocked: [], level: 0 }; cache.set(book, p) }
  advance(book, p, n)
  // Receitas introduzidas nas fases 1..n, em ordem de introdução.
  const unlocked: string[] = []
  for (let i = 1; i <= n; i++) { const k = p.intro[i]; if (k) unlocked.push(k) }

  const [rows, cols] = n <= 5 ? [5, 5] : n <= 20 ? [6, 6] : n <= 60 ? [6, 7] : [7, 8]
  const playoutMoves = n <= 5 ? 2 : n <= 20 ? 3 : n <= 60 ? 4 : 5
  const baseSlack = n <= 5 ? 3 : n <= 20 ? 2 : n <= 40 ? 1 : 0
  return {
    number: n,
    rows,
    cols,
    unlocked,
    newRecipe: p.intro[n],
    activeCount: Math.min(2 + Math.floor(n / 8), 6, unlocked.length),
    playoutMoves,
    slack: baseSlack + (n % 5 === 0 ? 2 : 0),
    walls: n <= 20 ? 0 : Math.min(Math.floor((n - 20) / 20) + 1, 6),
  }
}
