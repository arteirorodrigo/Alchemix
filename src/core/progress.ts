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

export function loadProgress(st: Storage): Progress {
  try {
    const raw = st.get(KEY)
    if (raw === null) return defaults()
    const o = JSON.parse(raw)
    if (typeof o !== 'object' || o === null || o.version !== 1) return defaults()
    const d = defaults()
    return { ...d, ...o, settings: { ...d.settings, ...(o.settings ?? {}) } }
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
  const { inProgress: _drop, ...rest } = p
  return {
    ...rest,
    stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    currentLevel: Math.max(p.currentLevel, level + 1),
    discovered: union(p.discovered, seen),
  }
}

export function recordSeen(p: Progress, seen: string[]): Progress {
  return { ...p, discovered: union(p.discovered, seen) }
}
