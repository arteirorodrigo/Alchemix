import { describe, expect, it } from 'vitest';
import csv from '../../src/data/receitas.csv?raw';

describe('receitas.csv', () => {
  it('tem cabeçalho + 4 base + 55 receitas', () => {
    const linhas = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
    expect(linhas).toHaveLength(60);
  });
});
