// Métricas das fases do modo Normal. Usa as MESMAS regras do jogo (prototipos/regras-normal.js).
import { createRequire } from 'node:module';

const R = createRequire(import.meta.url)('../../prototipos/regras-normal.js');
const { novaFase, jogar, paresValidos, dica, caminho, find, levelInfo } = R;

// Limites dos alertas (decisão do Claude; o relatório do auditor os cita).
export const LIMITES = { chuteVence: 0.30, apertada: 0.20, ficouMaisFacil: 0.25 };

// cópia rápida da partida (bases não muda durante o jogo)
const copiar = (e) => ({ ...e, cells: e.cells.slice(), queue: e.queue.slice(), done: e.done.slice() });

// jogadas que reagem e fazem algo do caminho do objetivo, nas duas ordens (a peça nova nasce em `b`)
function jogadasUteis(e, path) {
  const out = [];
  for (const [a, b] of paresValidos(e)) {
    const r = find(e.cells[a], e.cells[b]);
    if (r && path.has(r.r)) out.push([a, b], [b, a]);
  }
  return out;
}

// Conta as sequências de jogadas úteis que vencem sem errar. Estados repetidos são lembrados
// (mesmo tabuleiro, fila, sorteio, toques e metas → mesmo número de soluções).
export function contarSolucoes(n, { limiteNos = 200000 } = {}) {
  const inicio = novaFase(n);
  const path = caminho(inicio.goal);
  const memo = new Map();
  let nos = 0, completo = true;
  function busca(e) {
    const chave = e.cells.join() + '|' + e.queue.join() + '|' + e.s + '|' + e.taps + '|' + e.made + '|' + e.done.join();
    if (memo.has(chave)) return memo.get(chave);
    if (++nos > limiteNos) { completo = false; return 0; }
    let total = 0;
    for (const [a, b] of jogadasUteis(e, path)) {
      const f = copiar(e);
      const res = jogar(f, a, b);
      if (res.venceu) total++;
      else if (!res.perdeu) total += busca(f);
    }
    if (completo) memo.set(chave, total);
    return total;
  }
  const solucoes = busca(inicio);
  return { solucoes, completo };
}

function geradorDe(semente) {
  let a = semente >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function escolherJogada(e, politica, rnd, path) {
  const sorteia = (xs) => xs[Math.floor(rnd() * xs.length)];
  if (politica === 'dica') { const d = dica(e); if (d) return d; }
  if (politica === 'sabeCaminho') { const u = jogadasUteis(e, path); if (u.length) return sorteia(u); }
  const [a, b] = sorteia(paresValidos(e));
  return rnd() < 0.5 ? [a, b] : [b, a];
}

// Fração de partidas vencidas por um jogador que segue a `politica`:
// 'chute' = par vizinho qualquer; 'sabeCaminho' = par útil ao acaso; 'dica' = sempre a dica.
export function chanceVitoria(n, politica, partidas = 2000, semente = 1) {
  const rnd = geradorDe(semente);
  const path = caminho(levelInfo(n).goal);
  let vitorias = 0;
  for (let i = 0; i < partidas; i++) {
    const e = novaFase(n);
    for (;;) {
      const [a, b] = escolherJogada(e, politica, rnd, path);
      const res = jogar(e, a, b);
      if (res.venceu) { vitorias++; break; }
      if (res.perdeu) break;
    }
  }
  return vitorias / partidas;
}

// Segue sempre a 💡 a partir do estado `e` (muta). Sem dica disponível = não vence
// (nada de jogada ao acaso, para a sorte não esconder o alerta).
export function seguirDica(e) {
  for (;;) {
    const d = dica(e);
    if (!d) return false;
    const res = jogar(e, d[0], d[1]);
    if (res.venceu) return true;
    if (res.perdeu) return false;
  }
}

export function alertasFase(m) {
  const al = [];
  if (m.solucoes === 0 && m.completo) al.push('SEM SOLUÇÃO SEM ERRAR');
  if (m.solucoes === 1 && m.completo) al.push('UM CAMINHO SÓ');
  if (m.chute >= LIMITES.chuteVence) al.push('CHUTE VENCE');
  if (m.sabeCaminho < LIMITES.apertada) al.push('APERTADA');
  if (!m.dicaVence) al.push('DICA NÃO LEVA À VITÓRIA');
  return al;
}

// Dentro do capítulo, a dificuldade deve subir: marca a fase que ficou bem mais fácil que a anterior.
export function alertasCapitulo(medidas) {
  for (let i = 1; i < medidas.length; i++) {
    const ant = medidas[i - 1], m = medidas[i];
    if (ant.capitulo === m.capitulo && m.sabeCaminho - ant.sabeCaminho > LIMITES.ficouMaisFacil) m.alertas.push('FICOU MAIS FÁCIL');
  }
}

export function medirFase(n, { partidas = 2000, limiteNos = 200000 } = {}) {
  const info = levelInfo(n);
  const e = novaFase(n);
  const { solucoes, completo } = contarSolucoes(n, { limiteNos });
  const m = {
    n, capitulo: info.chapter, meta: info.goal, quantidade: info.count, toques: e.taps, minimo: e.need,
    solucoes, completo,
    chute: chanceVitoria(n, 'chute', partidas),
    sabeCaminho: chanceVitoria(n, 'sabeCaminho', partidas),
    dicaVence: seguirDica(novaFase(n)),
  };
  m.alertas = alertasFase(m);
  return m;
}

export const totalDeFases = () => R.CHAPTERS.reduce((s, c) => s + c.goals.length, 0);
