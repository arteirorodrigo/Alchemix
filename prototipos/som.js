// Sons do Alchemix, sintetizados no navegador (sem arquivos de áudio).
// Script clássico: window.AlchemixSom.tocar('acerto'), .ligado(), .alternar().
// O som começa a valer no primeiro toque (regra dos navegadores) e a escolha fica salva.
(function (g) {
  const CHAVE = 'alchemix.som';
  let ctx = null, mestre = null;
  const ler = () => { try { return g.localStorage.getItem(CHAVE) !== 'off'; } catch { return true; } };
  let ligado = ler();

  function audio() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = g.AudioContext || g.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); mestre = ctx.createGain(); mestre.gain.value = 0.35; mestre.connect(ctx.destination);
    return ctx;
  }
  // uma nota: frequência (Hz), início (s, relativo a agora), duração (s), forma, volume, deslize até outra frequência
  function nota(f, ini, dur, forma = 'triangle', vol = 0.5, ate) {
    const c = audio(); if (!c) return;
    const t = c.currentTime + ini, o = c.createOscillator(), v = c.createGain();
    o.type = forma; o.frequency.setValueAtTime(f, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v); v.connect(mestre); o.start(t); o.stop(t + dur + 0.02);
  }
  // ruído curto (explosão)
  function ruido(ini, dur, vol = 0.4) {
    const c = audio(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), v = c.createGain(), fl = c.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = 900; v.gain.value = vol;
    s.buffer = buf; s.connect(fl); fl.connect(v); v.connect(mestre); s.start(c.currentTime + ini);
  }

  const SONS = {
    toque: () => nota(660, 0, 0.06, 'square', 0.15),
    acerto: () => { nota(523, 0, 0.12); nota(784, 0.07, 0.18); },
    novo: () => [784, 988, 1175, 1568].forEach((f, i) => nota(f, i * 0.07, 0.22, 'triangle', 0.4)),
    meta: () => { nota(659, 0, 0.15, 'sine', 0.5); nota(880, 0.1, 0.25, 'sine', 0.5); },
    erro: () => { nota(220, 0, 0.3, 'sawtooth', 0.25, 90); ruido(0.05, 0.25, 0.5); },
    vitoria: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.11, i === 3 ? 0.5 : 0.16, 'triangle', 0.5)),
    estrela: (i = 0) => nota(1047 * Math.pow(1.26, i), 0, 0.3, 'sine', 0.45),
    derrota: () => [392, 330, 262].forEach((f, i) => nota(f, i * 0.16, 0.25, 'triangle', 0.35)),
  };

  g.AlchemixSom = {
    tocar(nome, arg) { if (!ligado || !SONS[nome]) return; try { SONS[nome](arg); } catch { /* sem som, sem problema */ } },
    ligado: () => ligado,
    alternar() { ligado = !ligado; try { g.localStorage.setItem(CHAVE, ligado ? 'on' : 'off'); } catch {} if (ligado) this.tocar('acerto'); return ligado; },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
