import type { GameState } from './game'
import type { Storage } from '../platform/storage'

export interface Progress {
  version: 1
  currentLevel: number
  stars: Record<number, number>
  discovered: string[]
  hints: number
  lastFreeHintDay: string
  inProgress?: GameState
  settings: { sound: boolean; vibration: boolean; leftHanded: boolean }
}

const KEY = 'alquimia.save.v1'

function defaults(): Progress {
  return {
    version: 1, currentLevel: 1, stars: {}, discovered: [], hints: 3, lastFreeHintDay: '',
    settings: { sound: true, vibration: true, leftHanded: false },
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function validInProgress(g: unknown): g is GameState {
  if (!isObj(g) || typeof g.levelNumber !== 'number' || typeof g.movesLeft !== 'number') return false
  const b = g.board
  if (!isObj(b) || !Array.isArray(b.cells) || typeof b.rows !== 'number' || typeof b.cols !== 'number') return false
  if (b.rows * b.cols !== b.cells.length) return false
  return isObj(g.collected) && Array.isArray(g.history) && typeof g.status === 'string'
}

function sanitize(o: Record<string, unknown>, d: Progress): Progress {
  const out: Progress = { ...d }
  if (Number.isInteger(o.currentLevel) && (o.currentLevel as number) > 0) out.currentLevel = o.currentLevel as number
  if (typeof o.hints === 'number' && Number.isFinite(o.hints) && o.hints >= 0) out.hints = o.hints
  if (isObj(o.stars)) out.stars = o.stars as Record<number, number>
  if (Array.isArray(o.discovered) && o.discovered.every((x) => typeof x === 'string')) out.discovered = o.discovered as string[]
  if (typeof o.lastFreeHintDay === 'string') out.lastFreeHintDay = o.lastFreeHintDay
  if (isObj(o.settings)) {
    for (const k of Object.keys(d.settings) as (keyof Progress['settings'])[]) {
      const v = o.settings[k]
      if (typeof v === 'boolean') out.settings[k] = v
    }
  }
  if (validInProgress(o.inProgress)) out.inProgress = o.inProgress
  return out
}

export function loadProgress(st: Storage): Progress {
  try {
    const raw = st.get(KEY)
    if (raw === null) return defaults()
    const o = JSON.parse(raw)
    if (typeof o !== 'object' || o === null || o.version !== 1) return defaults()
    const d = defaults()
    return sanitize(o, d)
  } catch {
    return defaults()
  }
}

export function saveProgress(st: Storage, p: Progress): void {
  st.set(KEY, JSON.stringify(p))
}

export function grantDailyHint(p: Progress, today: string): Progress {
  if (today === p.lastFreeHintDay) return p
  return { ...p, hints: p.hints + 1, lastFreeHintDay: today }
}

function union(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])]
}

export function recordWin(p: Progress, level: number, stars: number, seen: string[]): Progress {
  const { inProgress, ...rest } = p
  return {
    ...rest,
    ...(inProgress && inProgress.levelNumber !== level ? { inProgress } : {}),
    stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    currentLevel: Math.max(p.currentLevel, level + 1),
    discovered: union(p.discovered, seen),
  }
}

export function recordSeen(p: Progress, seen: string[]): Progress {
  return { ...p, discovered: union(p.discovered, seen) }
}
