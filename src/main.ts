import Phaser from 'phaser'
import { grantDailyHint } from './core/progress'
import { FakeAdService } from './platform/ads'
import { LocalStorage } from './platform/storage'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { SERVICES, Services } from './scenes/services'
import { H, W } from './ui/layout'
import { C, css } from './ui/theme'
import { ZOOM } from './ui/widgets'

const services = new Services(new LocalStorage(), new FakeAdService())
const today = new Date().toLocaleDateString('sv')   // AAAA-MM-DD no fuso local
// Primeira abertura: começa com as 3 dicas do protótipo; a grátis do dia vale a partir de amanhã.
services.update((p) => (p.lastFreeHintDay === '' ? { ...p, lastFreeHintDay: today } : grantDailyHint(p, today)))

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W * ZOOM,
  height: H * ZOOM,
  backgroundColor: css(C.background),
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, GameScene],
})
game.registry.set(SERVICES, services)
