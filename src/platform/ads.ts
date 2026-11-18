import { t } from '../i18n/pt-BR'

export type RewardReason = 'undo' | 'extra-moves' | 'hint'

export interface AdService {
  /** Mostra um anúncio com recompensa; resolve `true` se a recompensa deve ser dada. */
  showRewarded(reason: RewardReason): Promise<boolean>
}

const STYLE = `
.ad-overlay{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;
  background:rgba(37,19,35,.72);font-family:'Pixelify Sans',monospace;color:#2c1a2b}
.ad-card{width:min(340px,88vw);background:#f9eed1;border:3px solid #2c1a2b;box-shadow:6px 6px 0 #2c1a2b;
  padding:16px;text-align:center;position:relative}
.ad-title{position:absolute;left:50%;top:-22px;transform:translateX(-50%);background:#73cb51;color:#fdfcf5;
  border:3px solid #2c1a2b;box-shadow:inset 0 -5px 0 #2b8a36;padding:4px 18px 8px;font-size:22px;font-weight:700;
  text-shadow:2px 2px 0 #2c1a2b;white-space:nowrap}
.ad-reason{margin:18px 0 12px;font-size:15px}
.ad-sky{position:relative;height:150px;background:#21b3ed;border:3px solid #2c1a2b;display:flex;flex-direction:column;
  align-items:center;justify-content:center;color:#fdfcf5;font-size:15px;text-shadow:2px 2px 0 #2c1a2b}
.ad-sky img{width:84px;height:84px;image-rendering:pixelated}
.ad-count{position:absolute;right:6px;top:6px;background:#f9eed1;color:#2c1a2b;border:2px solid #2c1a2b;
  padding:1px 6px;font-size:13px;text-shadow:none}
.ad-bar{position:absolute;left:0;bottom:0;height:8px;background:#ffb330;width:0;transition:width linear}
.ad-wait{margin-top:12px;border:3px solid #2c1a2b;background:#e7d6b3;color:#734e39;padding:10px;font-size:17px}
.ad-note{margin-top:10px;font-size:12px;color:#734e39}`

/** Anúncio de mentira para desenvolvimento: diálogo de prévia do protótipo, 2 s, sempre recompensa. */
export class FakeAdService implements AdService {
  constructor(private durationMs = 2000) {}

  showRewarded(reason: RewardReason): Promise<boolean> {
    if (!document.getElementById('ad-style')) {
      const st = document.createElement('style')
      st.id = 'ad-style'
      st.textContent = STYLE
      document.head.appendChild(st)
    }
    const secs = Math.ceil(this.durationMs / 1000)
    const el = document.createElement('div')
    el.className = 'ad-overlay'
    el.setAttribute('data-testid', 'ad')
    el.innerHTML = `<div class="ad-card"><div class="ad-title"></div><div class="ad-reason"></div>
      <div class="ad-sky"><span class="ad-count"></span><img src="/assets/mascote-frasco.png" alt="">
      <span class="ad-msg"></span><div class="ad-bar"></div></div>
      <div class="ad-wait"></div><div class="ad-note"></div></div>`
    const q = (s: string) => el.querySelector(s) as HTMLElement
    q('.ad-title').textContent = t.anuncio.titulo
    q('.ad-reason').textContent = t.anuncio.motivo[reason]
    q('.ad-msg').textContent = t.anuncio.aparece
    q('.ad-wait').textContent = t.anuncio.assistindo
    q('.ad-note').textContent = t.anuncio.previa
    const count = q('.ad-count')
    count.textContent = `${secs}s`
    document.body.appendChild(el)
    const bar = q('.ad-bar')
    bar.style.transitionDuration = `${this.durationMs}ms`
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '100%' }))
    return new Promise((resolve) => {
      const start = performance.now()
      const timer = setInterval(() => {
        const left = Math.max(0, this.durationMs - (performance.now() - start))
        count.textContent = `${Math.ceil(left / 1000)}s`
        if (left <= 0) {
          clearInterval(timer)
          el.remove()
          resolve(true)
        }
      }, 100)
    })
  }
}
