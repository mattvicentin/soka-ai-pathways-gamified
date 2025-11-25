/**
 * Main game initialization
 */

import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1024,
  height: 768,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  loader: {
    baseURL: './'  // Ensures asset paths work correctly on GitHub Pages
  },
  scene: [BootScene, GameScene, UIScene, CreditsScene],
  pixelArt: false, // Set to true if using actual pixel art sprites
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  audio: {
    disableWebAudio: false
  }
};

// Create the game instance
const game = new Phaser.Game(config);

// Make game instance available globally for debugging
window.game = game;

console.log('🎮 AI Pathways Explorer - Game Version');
console.log('Phaser version:', Phaser.VERSION);

