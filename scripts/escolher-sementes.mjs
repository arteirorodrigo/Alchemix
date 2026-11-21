#!/usr/bin/env node
// Escolhe, para cada fase do modo Normal, a variação do sorteio (k) que deixa a fase justa:
// dá para vencer sem errar, seguir a 💡 vence, o chute não resolve e quem sabe as receitas
// costuma vencer — com a dificuldade subindo em rampa dentro do capítulo.
// Uso: node scripts/escolher-sementes.mjs [--fases 1-39] [--tentativas 60]
// Saída: a linha `const AJUSTE = {...}` para colar em prototipos/regras-normal.js.
import { createRequire } from 'node:module';
import { chanceVitoria, contarSolucoes, seguirDica, LIMITES } from './medir/metricas.mjs';

const R = createRequire(import.meta.url)('../prototipos/regras-normal.js');
const args = process.argv.slice(2);
const opt = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const total = R.CHAPTERS.reduce((s, c) => s + c.goals.length, 0);
const [de, ate] = opt('--fases', `1-${total}`).split('-').map(Number);
const tentativas = Number(opt('--tentativas', 60));
const PARTIDAS = 300;

// alvo de "sabe o caminho" pela posição no capítulo: começa fácil (100%) e termina em 55%
function alvo(n) {
  const info = R.levelInfo(n); const len = R.CHAPTERS[info.chapter - 1].goals.length;
  const pos = n - info.first;
  return 1 - 0.45 * (len > 1 ? pos / (len - 1) : 0);
}

// nota menor = melhor. Requisitos pesam muito; a distância do alvo desempata.
function avaliar(n, k) {
  const sol = contarSolucoes(n, { k, limiteNos: 50000 }).solucoes;
  if (!sol) return { k, nota: 1e6 };
  const dica = seguirDica(R.gerarFase(n, k));
  const chute = chanceVitoria(n, 'chute', PARTIDAS, 1, k);
  const sabe = chanceVitoria(n, 'sabeCaminho', PARTIDAS, 1, k);
  let nota = Math.abs(sabe - alvo(n));
  if (!dica) nota += 100;
  if (chute >= LIMITES.chuteVence) nota += 10 * (chute - LIMITES.chuteVence + 0.01);
  if (sabe < 0.5) nota += 5 * (0.5 - sabe);
  return { k, nota, sol, dica, chute, sabe };
}

const escolha = {};
for (let n = de; n <= (ate || de); n++) {
  let melhor = avaliar(n, 0);
  for (let k = 1; k < tentativas && melhor.nota > 0.05; k++) {
    const a = avaliar(n, k);
    if (a.nota < melhor.nota) melhor = a;
  }
  if (melhor.k) escolha[n] = melhor.k;
  const pct = (x) => x == null ? '  -' : `${Math.round(x * 100)}%`;
  console.error(`fase ${n} ${R.levelInfo(n).goal}: k=${melhor.k} sabeCam ${pct(melhor.sabe)} (alvo ${pct(alvo(n))}) chute ${pct(melhor.chute)} dica ${melhor.dica ? 'vence' : 'NÃO'}${melhor.nota >= 1 ? '  ⚠ não achei variação boa' : ''}`);
}
console.log(`  const AJUSTE = ${JSON.stringify(escolha).replace(/"/g, '')};`);
