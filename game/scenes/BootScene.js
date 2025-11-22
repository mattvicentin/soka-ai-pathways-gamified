/**
 * BootScene - Loads all game assets and initializes managers
 */

import { NodeManager } from '../managers/NodeManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Update loading bar
    this.load.on('progress', (value) => {
      const progressBar = document.getElementById('loading-progress');
      if (progressBar) {
        progressBar.style.width = (value * 100) + '%';
      }
    });

    // Handle file loading errors gracefully
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load file: ${file.key} (${file.src})`);
      // Continue loading even if some files fail
    });

    // Load actual sprite images
    this.load.image('sprite-professor-neutral', 'assets/sprites/professor-neutral.png');
    this.load.image('sprite-professor-concerned', 'assets/sprites/professor-concerned.png');
    this.load.image('sprite-professor-thoughtful', 'assets/sprites/professor-thoughtful.png');
    
    // Load background image
    this.load.image('background-classroom', 'assets/backgrounds/classroom-bg.png');
    
    // Load typewriter sprite
    this.load.image('typewriter', 'assets/sprites/typewriter.png');
    
    // Load cloud sprite for volume panel
    this.load.image('cloud', 'assets/sprites/cloud.png');
    
    // Load heart sprite for credits scene
    this.load.image('heart', 'assets/sprites/heart.png');
    
    // Load audio files - errors are handled gracefully so game continues if files fail
    this.loadAudioAssets();
  }

  async create() {
    console.log('BootScene: Initializing...');
    
    // Initialize NodeManager and load all nodes
    this.nodeManager = new NodeManager();
    
    try {
      await this.nodeManager.loadNodes();
      
      // Store nodeManager globally so other scenes can access it
      this.registry.set('nodeManager', this.nodeManager);
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
      
      // Start the game with welcome screen
      this.scene.start('GameScene');
      
    } catch (error) {
      console.error('Failed to load nodes:', error);
      this.showError('Failed to load game data. Please refresh the page.');
    }
  }

  

  loadAudioAssets() {
    // Load audio files - game will work without them if files don't exist
    const audioPath = 'assets/audio/';
    
    // Background music tracks
    this.load.audio('music-contemplative', audioPath + 'contemplative.mp3');
    this.load.audio('music-serious', audioPath + 'serious.mp3');
    this.load.audio('music-hopeful', audioPath + 'hopeful.mp3');
    
    // Sound effects
    this.load.audio('sfx-click', audioPath + 'button_click.mp3');
    this.load.audio('sfx-text', audioPath + 'typewriter.mp3');
    this.load.audio('sfx-transition', audioPath + 'transition.mp3');
  }

  showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-content">
          <h1 style="color: #ff6b6b;">Error</h1>
          <p style="color: white; margin-top: 1rem;">${message}</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #66B0FF; border: none; color: white; cursor: pointer; border-radius: 4px;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

