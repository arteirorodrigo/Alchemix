import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const R = createRequire(import.meta.url)('../../prototipos/regras-normal.js');

// Gravado do protótipo antes de as regras saírem do HTML (paridade).
const nome = (rotulos: string[]) => rotulos.map((r) => Object.keys(R.EL).find((k) => R.EL[k][0] === r));
const INICIAL_1 = {
  cells: nome(['Água', 'Fogo', 'Água', 'Fogo', 'Fogo', 'Água', 'Água', 'Fogo', 'Água', 'Fogo', 'Fogo', 'Fogo', 'Água', 'Fogo', 'Água', 'Água', 'Água', 'Água', 'Água', 'Água', 'Fogo', 'Água', 'Água', 'Água', 'Fogo', 'Fogo', 'Fogo', 'Fogo', 'Fogo', 'Fogo']),
  queue: nome(['Fogo', 'Água', 'Fogo']),
};
const INICIAL_20 = {
  cells: nome(['Terra', 'Vento', 'Água', 'Água', 'Vento', 'Vento', 'Fogo', 'Fogo', 'Fogo', 'Fogo', 'Água', 'Vento', 'Água', 'Vento', 'Terra', 'Fogo', 'Água', 'Terra', 'Fogo', 'Vento', 'Fogo', 'Vento', 'Vento', 'Vento', 'Vento', 'Água', 'Vento', 'Vento', 'Vento', 'Vento']),
  queue: nome(['Fogo', 'Vento', 'Terra']),
};

// primeiro par vizinho (a < b) cujo produto é `alvo`
function parQueFaz(e: any, alvo: string): [number, number] {
  const p = R.paresValidos(e).find(([a, b]: [number, number]) => R.find(e.cells[a], e.cells[b])?.r === alvo);
  if (!p) throw new Error('sem par para ' + alvo);
  return p;
}

describe('regras do modo Normal', () => {
  it('paridade fase 1 e 20', () => {
    // sorteio original (variação 0); fases 1 e 20 não mudaram de meta na reordenação
    expect(R.gerarFase(1, 0).cells).toEqual(INICIAL_1.cells);
    expect(R.gerarFase(1, 0).queue).toEqual(INICIAL_1.queue);
    expect(R.gerarFase(20, 0).cells).toEqual(INICIAL_20.cells);
    expect(R.gerarFase(20, 0).queue).toEqual(INICIAL_20.queue);
  });

  it('toques = mínimo + 2', () => {
    const e = R.novaFase(1);
    expect(e.need).toBe(2);
    expect(e.taps).toBe(4);
  });

  it('receita conta e trava', () => {
    const e = R.novaFase(1);
    const [a, b] = parQueFaz(e, 'vapor');
    const res = R.jogar(e, a, b);
    expect(res.tipo).toBe('receita');
    expect(e.made).toBe(1);
    expect(e.done).toContain(b);
    expect(e.taps).toBe(3);
    expect(res.venceu).toBe(false);
  });

  it('casa travada não joga e paresValidos a ignora', () => {
    const e = R.novaFase(1);
    const [a, b] = parQueFaz(e, 'vapor');
    R.jogar(e, a, b);
    const viz = [b - 1, b + 1, b - R.COLS, b + R.COLS].find((v) => v >= 0 && v < e.cells.length && R.adj(b, v))!;
    const antes = structuredClone(e);
    const res = R.jogar(e, b, viz);
    expect(res.tipo).toBe('invalido');
    expect(e).toEqual(antes);
    expect(R.paresValidos(e).some(([x, y]: number[]) => x === b || y === b)).toBe(false);
    expect(R.dica(e)?.includes(b) ?? false).toBe(false);
  });

  it('vence na meta', () => {
    const e = R.novaFase(1);
    R.jogar(e, ...parQueFaz(e, 'vapor'));
    const res = R.jogar(e, ...parQueFaz(e, 'vapor'));
    expect(res.venceu).toBe(true);
    expect(res.perdeu).toBe(false);
  });

  it('erro tira vida e toque', () => {
    const e = R.novaFase(20);
    e.cells[0] = 'vapor'; e.cells[1] = 'terra';
    const res = R.jogar(e, 0, 1);
    expect(res.tipo).toBe('erro');
    expect(e.lives).toBe(2);
    expect(e.taps).toBe(R.novaFase(20).taps - 1);
  });

  it('erro mantém as duas peças no lugar', () => {
    const e = R.novaFase(20);
    e.cells[0] = 'vapor'; e.cells[1] = 'terra';
    const antes = e.s;
    const res = R.jogar(e, 0, 1);
    expect(res.tipo).toBe('erro');
    expect([e.cells[0], e.cells[1]]).toEqual(['vapor', 'terra']);
    expect(e.s).toBe(antes);
  });

  it('fase além do fim', () => {
    const e = R.novaFase(60);
    expect(R.EL[e.goal]).toBeDefined();
  });
});
