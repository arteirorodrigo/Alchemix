import type { ElementDef, ElementId, Recipe } from './types'

export function slug(name: string): ElementId {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

// Imagens prontas do protótipo (core não acessa o filesystem, então o mapa é fixo).
const ART: Record<ElementId, string> = {
  agua: 'agua.png',
  pedra: 'pedra.png',
  fogo: 'fogo.png',
  broto: 'planta.png',
  barro: 'barro.png',
  tijolo: 'tijolo.png',
  vapor: 'vapor.png',
  flor: 'flor.png',
  casinha: 'casinha.png',
  'arco-iris': 'arcoiris.png',
}

function parseLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else quoted = false
      } else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

export class RecipeBook {
  elements = new Map<ElementId, ElementDef>()
  recipes: Recipe[] = []
  private byKeyMap = new Map<string, Recipe>()

  constructor(csv: string) {
    const lines = csv.split(/\r?\n/).filter(l => l.trim() !== '')
    for (const line of lines.slice(1)) {
      const [nivel, ia, ib, resultado, emoji, tipo, logica] = parseLine(line)
      const tier = Number(nivel)
      const id = slug(resultado)
      this.elements.set(id, { id, name: resultado, emoji, tier, kind: tipo, art: ART[id] })
      if (tier > 0) {
        const [a, b] = [slug(ia), slug(ib)].sort()
        const recipe: Recipe = { key: `${a}+${b}`, a, b, result: id, tier, logic: logica }
        this.recipes.push(recipe)
        this.byKeyMap.set(recipe.key, recipe)
      }
    }
  }

  byKey(key: string): Recipe {
    const r = this.byKeyMap.get(key)
    if (!r) throw new Error(`Receita desconhecida: ${key}`)
    return r
  }

  find(a: ElementId, b: ElementId, active?: ReadonlySet<string>): Recipe | undefined {
    const [x, y] = [a, b].sort()
    const key = `${x}+${y}`
    if (active && !active.has(key)) return undefined
    return this.byKeyMap.get(key)
  }

  base(): ElementId[] {
    return [...this.elements.values()].filter(e => e.tier === 0).map(e => e.id)
  }

  unlockOrder(): string[] {
    return this.recipes
      .map((r, i) => ({ r, i }))
      .sort((x, y) => x.r.tier - y.r.tier || x.i - y.i)
      .map(x => x.r.key)
  }
}
