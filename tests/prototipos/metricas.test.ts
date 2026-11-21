import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { alertasCapitulo, alertasFase, chanceVitoria, contarSolucoes, medirFase } from '../../scripts/medir/metricas.mjs';

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

  it('fase além do fim', () => {
    expect(() => medirFase(50, { partidas: 100 })).not.toThrow();
  });

  it('tempo da fase mais longa (Árvore, 31)', () => {
    const t = Date.now();
    const m = medirFase(31);
    expect(m.meta).toBe('arvore');
    expect(Date.now() - t).toBeLessThan(20000);
  }, 30000);
});
