import csv from '../data/receitas.csv?raw'
import { RecipeBook } from '../core/recipes'
import { loadProgress, saveProgress, type Progress } from '../core/progress'
import type { Storage } from '../platform/storage'
import type { AdService } from '../platform/ads'

const POINTS_KEY = 'alquimia.pontos.v1'

/** Dependências compartilhadas pelas cenas (guardadas no `registry` do Phaser). */
export class Services {
  readonly book = new RecipeBook(csv)
  progress: Progress

  constructor(readonly storage: Storage, readonly ads: AdService) {
    this.progress = loadProgress(storage)
  }

  update(fn: (p: Progress) => Progress): void {
    this.progress = fn(this.progress)
    saveProgress(this.storage, this.progress)
  }

  /** Pontos da fase em andamento: pilha alinhada ao histórico (desfazer volta os pontos). */
  loadPoints(level: number, historyLength: number): number[] {
    try {
      const o = JSON.parse(this.storage.get(POINTS_KEY) ?? 'null')
      if (o && o.level === level && Array.isArray(o.stack) && o.stack.length === historyLength + 1) return o.stack
    } catch { /* corrompido: recomeça */ }
    return Array(historyLength + 1).fill(0)
  }

  savePoints(level: number, stack: number[]): void {
    this.storage.set(POINTS_KEY, JSON.stringify({ level, stack }))
  }
}

export const SERVICES = 'services'
