import { describe, expect, test } from 'vitest'
import { hashString, mulberry32 } from '../../src/core/rng'

describe('rng', () => {
  test('mesma semente gera a mesma sequência; hashString é estável', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(hashString('alquimia')).toBe(hashString('alquimia'))
    expect(hashString('a')).not.toBe(hashString('b'))
  })

  test('valores ficam em [0,1) e hash é inteiro sem sinal de 32 bits', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
    const h = hashString('qualquer coisa')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
  })
})
