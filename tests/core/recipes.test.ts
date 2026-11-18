import { describe, expect, test } from 'vitest'
import csv from '../../src/data/receitas.csv?raw'
import { RecipeBook, slug } from '../../src/core/recipes'

const book = new RecipeBook(csv)

describe('slug', () => {
  test('normaliza', () => {
    expect(slug('Arco-íris')).toBe('arco-iris')
    expect(slug('Poção da Cura')).toBe('pocao-da-cura')
    expect(slug('Broto')).toBe('broto')
  })
})

describe('RecipeBook', () => {
  test('carrega 59 elementos e 55 receitas', () => { expect(book.elements.size).toBe(59); expect(book.recipes.length).toBe(55) })
  test('base são os 4 elementos do protótipo', () => expect(book.base().sort()).toEqual(['agua','broto','fogo','pedra']))
  test('find é simétrico', () => { expect(book.find('pedra','agua')!.result).toBe('barro'); expect(book.find('agua','pedra')!.result).toBe('barro') })
  test('par igual funciona', () => expect(book.find('tijolo','tijolo')!.result).toBe('casinha'))
  test('find respeita conjunto ativo', () => expect(book.find('agua','pedra', new Set(['agua+fogo']))).toBeUndefined())
  test('unlockOrder começa pelas receitas de nível 1 na ordem do CSV', () => expect(book.unlockOrder().slice(0,3)).toEqual(['agua+pedra','agua+fogo','agua+broto']))
  test('arte do Broto é planta.png', () => expect(book.elements.get('broto')!.art).toBe('planta.png'))
  test('arte: arco-iris e elementos sem imagem', () => {
    expect(book.elements.get('arco-iris')!.art).toBe('arcoiris.png')
    expect(book.elements.get('frasco')?.art).toBeUndefined()
  })
  test('tier, kind e campos da receita', () => {
    expect(book.elements.get('agua')!.tier).toBe(0)
    expect(book.elements.get('tijolo')!.tier).toBe(2)
    expect(book.elements.get('tijolo')!.kind).toBe('elemento')
    const r = book.byKey('agua+pedra')
    expect(r).toMatchObject({ a: 'agua', b: 'pedra', tier: 1, logic: 'terra molhada vira barro' })
  })
  test('campo com vírgula entre aspas', () => {
    expect(book.recipes.find(r => r.result === 'pocao-do-sapo')!.logic).toBe('cuidado, vira sapo')
  })
  test('byKey lança em chave desconhecida', () => expect(() => book.byKey('x+y')).toThrow())
})
