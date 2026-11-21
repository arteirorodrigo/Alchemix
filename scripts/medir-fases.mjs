#!/usr/bin/env node
// Medidor de fases do modo Normal.
// Uso: node scripts/medir-fases.mjs [--fases 1-39] [--partidas 2000] [--json]
import { LIMITES, alertasCapitulo, medirFase, totalDeFases } from './medir/metricas.mjs';

const args = process.argv.slice(2);
const opt = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const [de, ate] = (opt('--fases', `1-${totalDeFases()}`)).split('-').map(Number);
const partidas = Number(opt('--partidas', 2000));
if (!(de >= 1) || (ate && !(ate >= de))) { console.error('Uso: --fases A-B com 1 ≤ A ≤ B (ex.: --fases 17-31)'); process.exit(1); }
const json = args.includes('--json');

const medidas = [];
for (let n = de; n <= (ate || de); n++) {
  medidas.push(medirFase(n, { partidas }));
  if (!json) process.stderr.write(`\rmedindo fase ${n}…`);
}
alertasCapitulo(medidas);

if (json) { console.log(JSON.stringify(medidas, null, 1)); process.exit(0); }

const pct = (x) => `${Math.round(x * 100)}%`.padStart(4);
process.stderr.write('\r' + ' '.repeat(30) + '\r');
console.log('fase cap meta              toques mín  soluções   chute sabeCam dica  alertas');
for (const m of medidas) {
  const meta = `${m.quantidade > 1 ? m.quantidade + '× ' : ''}${m.meta}`;
  const sol = `${m.completo ? '' : '≥'}${m.solucoes}`;
  console.log(`${String(m.n).padStart(4)} ${String(m.capitulo).padStart(3)} ${meta.padEnd(17)} ${String(m.toques).padStart(6)} ${String(m.minimo).padStart(4)} ${sol.padStart(9)}   ${pct(m.chute)}    ${pct(m.sabeCaminho)}  ${m.dicaVence ? 'sim' : 'não'}  ${m.alertas.join(', ')}`);
}
const ruins = medidas.filter((m) => m.alertas.length);
console.log(`\n${ruins.length} fase(s) com alerta de ${medidas.length}.`);
for (const m of ruins) console.log(`  fase ${m.n} (${m.meta}): ${m.alertas.join(', ')}`);
console.log(`\nColunas: soluções = sequências de jogadas úteis que vencem sem errar (≥ = busca parou no limite);`);
console.log(`chute = vitórias de quem junta vizinhos ao acaso; sabeCam = de quem só faz peças do caminho, ao acaso; dica = seguir a 💡 vence.`);
console.log(`Limites: CHUTE VENCE ≥ ${pct(LIMITES.chuteVence).trim()}; APERTADA < ${pct(LIMITES.apertada).trim()} no sabeCam; FICOU MAIS FÁCIL = sabeCam sobe > ${Math.round(LIMITES.ficouMaisFacil * 100)} pontos dentro do capítulo.`);
