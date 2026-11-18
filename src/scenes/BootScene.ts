import Phaser from 'phaser'
import { t } from '../i18n/pt-BR'
import { artKey } from '../ui/pieces'
import { H, W } from '../ui/layout'
import { C } from '../ui/theme'
import { setupCamera, txt } from '../ui/widgets'
import { SERVICES, type Services } from './services'

const ART = ['agua', 'pedra', 'fogo', 'planta', 'barro', 'tijolo', 'vapor', 'flor', 'casinha', 'arcoiris']

/** Carrega imagens e a fonte, depois abre a fase atual (até a HomeScene existir). */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot') }

  preload(): void {
    setupCamera(this, W, H)
    this.cameras.main.setBackgroundColor(C.background)
    for (const a of ART) this.load.image(artKey(a + '.png'), `assets/elementos/${a}.png`)
    this.load.image('fundo', 'assets/fundo-vila.webp')
    this.load.image('mascote', 'assets/mascote-frasco.png')
  }

  async create(): Promise<void> {
    const loading = txt(this, W / 2, H / 2, t.carregando, 20)
    try {
      await document.fonts.load('20px "Pixelify Sans"')
      await document.fonts.load('bold 20px "Pixelify Sans"')
    } catch { /* segue com a fonte reserva */ }
    loading.destroy()
    const sv = this.registry.get(SERVICES) as Services
    this.scene.start('game', { levelNumber: sv.progress.currentLevel })
  }
}
