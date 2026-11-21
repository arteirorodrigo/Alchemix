import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { alertasCapitulo, alertasFase, chanceVitoria, contarSolucoes, medirFase, seguirDica } from '../../scripts/medir/metricas.mjs';
import { createRequire } from 'node:module';
const R = createRequire(import.meta.url)('../../prototipos/regras-normal.js');

describe('medidor de fases', () => {
  it('fase 1 tem solução', () => {
    expect(contarSolucoes(1).solucoes).toBeGreaterThan(0);
  });

  it('chance entre 0 e 1 e reprodutível', () => {
    const c = chanceVitoria(1, 'chute', 200, 7);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
    expect(chanceVitoria(1, 'chute', 200, 7)).toBe(c);
  });

  it('quem sabe o caminho vence mais que o chute', () => {
    expect(chanceVitoria(21, 'sabeCaminho', 300, 3)).toBeGreaterThanOrEqual(chanceVitoria(21, 'chute', 300, 3));
  });

  it('alerta sem solução', () => {
    const m = { solucoes: 0, completo: true, chute: 0, sabeCaminho: 0.5, dicaVence: true };
    expect(alertasFase(m)).toContain('SEM SOLUÇÃO SEM ERRAR');
  });

  it('alerta de capítulo', () => {
    const ms = [
      { n: 1, capitulo: 2, sabeCaminho: 0.1, alertas: [] as string[] },
      { n: 2, capitulo: 2, sabeCaminho: 0.5, alertas: [] as string[] },
    ];
    alertasCapitulo(ms);
    expect(ms[1].alertas).toContain('FICOU MAIS FÁCIL');
    expect(ms[0].alertas).not.toContain('FICOU MAIS FÁCIL');
  });

  it('sem dica, seguir a dica não vence por sorte', () => {
    const e = R.novaFase(1);
    e.cells = e.cells.map(() => 'lago'); // nenhum par reage: não há dica
    expect(R.dica(e)).toBeNull();
    expect(seguirDica(e)).toBe(false);
  });

  it('a dica só aponta jogada que ainda vence (Praia, sorteio original)', () => {
    expect(seguirDica(R.gerarFase(21, 0))).toBe(true);
  });

  it('sem saída limpa a dica avisa em vez de mandar errar (Sabão, sorteio original)', () => {
    expect(contarSolucoes(25, { k: 0 }).solucoes).toBe(0);
    expect(R.dica(R.gerarFase(25, 0))).toBeNull();
  });

  it('fase além do fim', () => {
    expect(() => medirFase(50, { partidas: 100 })).not.toThrow();
  });

  it('tempo da fase mais longa (Árvore, 32)', () => {
    const t = Date.now();
    const m = medirFase(32);
    expect(m.meta).toBe('arvore');
    expect(Date.now() - t).toBeLessThan(20000);
  }, 30000);
});
