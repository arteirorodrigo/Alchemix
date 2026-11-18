import Phaser from 'phaser';

class VaziaScene extends Phaser.Scene {
  constructor() {
    super('vazia');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 390,
  height: 844,
  backgroundColor: '#7fc4ea',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [VaziaScene],
});
