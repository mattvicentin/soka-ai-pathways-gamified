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

    // Load actual sprite images
    this.load.image('sprite-professor-neutral', 'assets/sprites/professor-neutral.png');
    this.load.image('sprite-professor-concerned', 'assets/sprites/professor-concerned.png');
    this.load.image('sprite-professor-thoughtful', 'assets/sprites/professor-thoughtful.png');
    
    // Load background image
    this.load.image('background-classroom', 'assets/backgrounds/classroom-bg.png');
    
    // Load typewriter sprite
    this.load.image('typewriter', 'assets/sprites/typewriter.png');
    
    // Load audio files (placeholder - in production, add actual audio files)
    // For POC, we'll use simple beep sounds or skip audio if files don't exist
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
    // Attempt to load audio files if they exist
    // For POC, these are optional and will fail gracefully
    
    // Background music
    const musicPath = 'assets/audio/';
    const sfxPath = 'assets/audio/';
    
    // Try to load, but don't fail if files don't exist
    try {
      // Note: In production, add actual audio files to assets/audio/
      // For now, these will fail silently and game will work without audio
      
      // this.load.audio('music-contemplative', musicPath + 'contemplative.mp3');
      // this.load.audio('music-serious', musicPath + 'serious.mp3');
      // this.load.audio('music-hopeful', musicPath + 'hopeful.mp3');
      // this.load.audio('sfx-click', sfxPath + 'click.mp3');
      // this.load.audio('sfx-text', sfxPath + 'text.mp3');
      // this.load.audio('sfx-transition', sfxPath + 'transition.mp3');
    } catch (error) {
      console.log('Audio files not loaded (optional for POC)');
    }
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

