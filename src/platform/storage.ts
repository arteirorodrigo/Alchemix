export interface Storage {
  get(key: string): string | null
  set(key: string, v: string): void
}

export class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get(key: string): string | null { return this.m.get(key) ?? null }
  set(key: string, v: string): void { this.m.set(key, v) }
}

/** localStorage com queda para memória quando indisponível ou lançando. */
export class LocalStorage implements Storage {
  private fallback = new MemoryStorage()
  get(key: string): string | null {
    try {
      const v = window.localStorage.getItem(key)
      if (v !== null) return v
    } catch { /* indisponível */ }
    return this.fallback.get(key)
  }
  set(key: string, v: string): void {
    this.fallback.set(key, v)
    try { window.localStorage.setItem(key, v) } catch { /* indisponível */ }
  }
}
