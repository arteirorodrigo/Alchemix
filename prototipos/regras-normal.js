// Regras do modo Normal ("Rumo à receita") — fonte única usada pelo jogo
// (rumo-a-receita.html) e pelo medidor de fases (scripts/medir-fases.mjs).
// Script clássico: no navegador vira window.AlchemixRegras; no Node, module.exports.
(function (g) {
  const EL = {
    agua: ['Água', '💧', 'agua', '#cde8f8'], terra: ['Terra', '🟫', 'terra', '#dfe1e8'], fogo: ['Fogo', '🔥', 'fogo', '#fde3b0'],
    vida: ['Vida', '🌱', 'vida', '#d6f0c4'], barro: ['Barro', '🟤', 'barro', '#ecd9c0'], tijolo: ['Tijolo', '🧱', 'tijolo', '#f2cdbd'],
    vapor: ['Vapor', '☁️', 'vapor', '#f1f6fb'], flor: ['Flor', '🌸', 'flor', '#f8dbe6'], casinha: ['Casinha', '🏠', 'casinha', '#fbeeb8'],
    arcoiris: ['Arco-íris', '🌈', 'arcoiris', '#d6f2f2'], lava: ['Lava', '🌋', 'lava', '#f7c3a6'], obsidiana: ['Obsidiana', '🖤', 'obsidiana', '#d6d0dc'],
    cinza: ['Cinza', '⚫', 'cinza', '#dedad6'], sabao: ['Sabão', '🧼', 'sabao', '#e2f1fb'], nuvem: ['Nuvem', '🌥️', 'nuvem', '#eef2f7'],
    chuva: ['Chuva', '🌧️', 'chuva', '#d5e4f3'], musgo: ['Musgo', '🍀', 'musgo', '#d4ecc7'], pantano: ['Pântano', '🐸', 'pantano', '#cfe3c2'],
    sol: ['Sol', '☀️', 'sol', '#fdeeb0'], areia: ['Areia', '🏜️', 'areia', '#f4e2bd'], vidro: ['Vidro', '🔷', 'vidro', '#d9ecf8'], vaso: ['Vaso', '🏺', 'vaso', '#efd6bf'],
    lago: ['Lago', '🏞️', 'lago', '#cfe6f2'], montanha: ['Montanha', '⛰️', 'montanha', '#e2e0dc'], arbusto: ['Arbusto', '🌿', 'arbusto', '#cfeac0'],
    arvore: ['Árvore', '🌳', 'arvore', '#cde8bf'], minerio: ['Minério', '🪙', 'minerio', '#efe2b8'], metal: ['Metal', '⚙️', 'metal', '#dde2e8'],
    vento: ['Vento', '🌬️', 'vento', '#e6f3f8'], passaro: ['Pássaro', '🐦', 'passaro', '#e3eefa'], raio: ['Raio', '⚡', 'raio', '#fff1a8'], onda: ['Onda', '🌊', 'onda', '#cfe4f6'], poeira: ['Poeira', '🌫️', 'poeira', '#e8e3da'],
    tornado: ['Tornado', '🌪️', 'tornado', '#dfe4ea'], tempestade: ['Tempestade', '⛈️', 'tempestade', '#cfd7e3'], praia: ['Praia', '🏖️', 'praia', '#f6e6c0'],
    abelha: ['Abelha', '🐝', 'abelha', '#fbedb0'], mel: ['Mel', '🍯', 'mel', '#f9e0a8'], ferramenta: ['Ferramenta', '⛏️', 'ferramenta', '#e4dfd8'],
    fazenda: ['Fazenda', '🚜', 'fazenda', '#dcefc6'], castelo: ['Castelo', '🏰', 'castelo', '#e2e2ea'], peixe: ['Peixe', '🐟', 'peixe', '#d3e8f7'],
    ilha: ['Ilha', '🏝️', 'ilha', '#d2eef0'], deserto: ['Deserto', '🌵', 'deserto', '#f6e3b8'],
  };
  const BASE = ['agua', 'fogo', 'terra', 'vento', 'vida'];
  const R = (a, b, r) => ({ a, b, r, k: [a, b].sort().join('+') });
  const RECIPES = [
    R('agua','terra','barro'), R('agua','fogo','vapor'), R('vida','agua','flor'), R('fogo','terra','lava'), R('vida','terra','musgo'),
    R('vida','fogo','cinza'), R('agua','agua','lago'), R('terra','terra','montanha'), R('fogo','fogo','sol'), R('vida','vida','arbusto'),
    R('barro','fogo','tijolo'), R('flor','vapor','arcoiris'), R('vapor','vapor','nuvem'), R('lava','agua','obsidiana'), R('lava','terra','minerio'),
    R('sol','terra','areia'), R('cinza','agua','sabao'), R('musgo','agua','pantano'), R('tijolo','tijolo','casinha'), R('nuvem','agua','chuva'),
    R('arbusto','chuva','arvore'), R('areia','fogo','vidro'), R('minerio','fogo','metal'), R('barro','barro','vaso'),
    R('vento','fogo','raio'), R('vento','agua','onda'), R('vento','terra','poeira'), R('vento','vento','tornado'), R('nuvem','raio','tempestade'), R('areia','onda','praia'), R('vida','vento','passaro'),
    R('flor','vento','abelha'), R('abelha','flor','mel'), R('minerio','terra','ferramenta'), R('ferramenta','vida','fazenda'), R('ferramenta','tijolo','castelo'), R('onda','vida','peixe'), R('lava','onda','ilha'), R('areia','vento','deserto'),
  ];
  const find = (x, y) => RECIPES.find(r => (r.a === x && r.b === y) || (r.a === y && r.b === x));
  const producer = (e) => RECIPES.find(r => r.r === e);
  // objetivos em ordem de dificuldade
  // capítulos: cada um destrava uma base nova
  // metas "elemento:quantidade"; toda fase pede ≥ 2 combinações e o capítulo vai do mais fácil ao mais difícil
  const CHAPTERS = [
    { bases: ['agua', 'fogo'], goals: ['vapor:2', 'sol:2', 'lago:3', 'nuvem', 'chuva'] },
    { bases: ['agua', 'fogo', 'terra'], goals: ['barro:2', 'tijolo', 'obsidiana', 'areia', 'minerio', 'lava:3', 'montanha:3', 'vaso', 'vidro', 'metal', 'casinha'] },
    { bases: ['agua', 'fogo', 'terra', 'vento'], goals: ['raio:2', 'onda:2', 'poeira:3', 'tornado:3', 'praia', 'tempestade'] },
    { bases: ['agua', 'fogo', 'terra', 'vento', 'vida'], goals: ['flor:2', 'musgo:2', 'sabao', 'pantano', 'cinza:3', 'passaro:3', 'arcoiris', 'arbusto:3', 'arvore'] },
    { bases: ['agua', 'fogo', 'terra', 'vento', 'vida'], goals: ['peixe:2', 'abelha:2', 'deserto', 'ilha', 'ferramenta', 'mel', 'fazenda', 'castelo'] },
  ];
  const ALLGOALS = CHAPTERS.flatMap(c => c.goals);
  const parseGoal = (s) => { const [goal, n] = s.split(':'); return { goal, count: Number(n) || 1 }; };
  function levelInfo(n) {
    let first = 1;
    for (let c = 0; c < CHAPTERS.length; c++) {
      const ch = CHAPTERS[c];
      if (n < first + ch.goals.length) return { chapter: c + 1, first, bases: ch.bases, ...parseGoal(ch.goals[n - first]) };
      first += ch.goals.length;
    }
    return { chapter: CHAPTERS.length, first: -1, bases: BASE, ...parseGoal(ALLGOALS[(n - first) % ALLGOALS.length]) };
  }
  const ROWS = 6, COLS = 5;

  // folhas (elementos base) e passos necessários para fazer `e`
  function leaves(e, out = []) { const p = producer(e); if (!p || BASE.includes(e)) out.push(e); else { leaves(p.a, out); leaves(p.b, out); } return out; }
  const steps = (e) => leaves(e).length - 1;
  // elementos da árvore do objetivo (o que é "útil" fazer)
  function caminho(goal) { const path = new Set(); (function walk(e) { path.add(e); const p = producer(e); if (p && !BASE.includes(e)) { walk(p.a); walk(p.b); } })(goal); return path; }
  const adj = (a, b) => { const ra = Math.floor(a / COLS), ca = a % COLS, rb = Math.floor(b / COLS), cb = b % COLS; return Math.abs(ra - rb) + Math.abs(ca - cb) === 1; };

  // sorteio (mulberry32) com o estado guardado no número `estado.s`, para dar para copiar a partida
  function rand(e) { let a = e.s | 0; a = a + 0x6D2B79F5 | 0; e.s = a; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  const pick = (e, xs) => xs[Math.floor(rand(e) * xs.length)];
  const sortear = (e) => rand(e) < 0.3 ? pick(e, leaves(e.goal)) : pick(e, e.bases);

  function novaFase(n) {
    const info = levelInfo(n);
    const e = { n, goal: info.goal, count: info.count, made: 0, need: steps(info.goal) * info.count, bases: info.bases, cells: [], queue: [], s: (n * 104729 + 7) >>> 0, taps: 0, lives: 3, done: [] };
    e.cells = Array.from({ length: ROWS * COLS }, () => sortear(e));
    e.queue = [0, 0, 0].map(() => sortear(e));
    e.taps = e.need + 2;
    return e;
  }
  function proximaPeca(e) { e.queue.push(sortear(e)); return e.queue.shift(); }
  // peça "útil": folha do objetivo que está em falta no tabuleiro
  function util(e) {
    const need = leaves(e.goal); const have = {}; for (const c of e.cells) if (c) have[c] = (have[c] || 0) + 1;
    const cnt = {}; for (const l of need) cnt[l] = (cnt[l] || 0) + 1;
    const short = Object.keys(cnt).filter(l => (have[l] || 0) < cnt[l] + 1);
    return short.length ? pick(e, short) : pick(e, need);
  }

  // uma jogada: juntar a casa `a` (primeiro toque) com a vizinha `b`. Muta o estado.
  function jogar(e, a, b) {
    if (a === b || !adj(a, b) || e.done.includes(a) || e.done.includes(b)) return { tipo: 'invalido', venceu: false, perdeu: false };
    const r = find(e.cells[a], e.cells[b]);
    let venceu = false;
    if (r) {
      e.taps--;
      e.cells[b] = r.r; e.cells[a] = proximaPeca(e);
      if (r.r === e.goal) {
        e.made++;
        if (e.made >= e.count) venceu = true;
        else e.done.push(b); // a peça pronta fica no tabuleiro, travada, e conta no objetivo
      }
    } else {
      e.lives--; e.taps--;
      e.cells[a] = util(e); e.cells[b] = util(e);
    }
    const perdeu = venceu ? false : e.lives <= 0 ? 'vidas' : e.taps <= 0 ? 'toques' : false;
    return { tipo: r ? 'receita' : 'erro', receita: r, venceu, perdeu };
  }
  function paresValidos(e) {
    const out = [];
    for (let a = 0; a < e.cells.length; a++) for (const b of [a + 1, a + COLS]) if (b < e.cells.length && adj(a, b) && !e.done.includes(a) && !e.done.includes(b)) out.push([a, b]);
    return out;
  }
  // dica: o par vizinho que faz a peça mais avançada do caminho do objetivo
  function dica(e) {
    const path = caminho(e.goal);
    let best = null, bestTier = -1;
    for (let a = 0; a < e.cells.length; a++) for (let b = 0; b < e.cells.length; b++) {
      if (!adj(a, b) || e.done.includes(a) || e.done.includes(b)) continue; const r = find(e.cells[a], e.cells[b]); if (!r || !path.has(r.r)) continue;
      const tier = steps(r.r); if (tier > bestTier) { bestTier = tier; best = [a, b]; }
    }
    return best;
  }

  const api = { EL, BASE, RECIPES, CHAPTERS, ROWS, COLS, find, producer, leaves, steps, caminho, levelInfo, adj, rand, novaFase, jogar, paresValidos, dica };
  g.AlchemixRegras = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
