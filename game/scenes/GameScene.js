/**
 * GameScene - Main game scene with background and character sprites
 */

import { AudioManager } from '../managers/AudioManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.currentSprite = null;
    this.currentBackground = null;
  }

  create() {
    console.log('GameScene: Starting...');
    
    // Get nodeManager from registry
    this.nodeManager = this.registry.get('nodeManager');
    
    if (!this.nodeManager) {
      console.error('NodeManager not found!');
      return;
    }
    
    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
    
    // Track if user has interacted (required for browser autoplay policy)
    this.audioUnlocked = false;
    
    // Unlock audio on first user interaction
    const unlockAudio = () => {
      if (!this.audioUnlocked) {
        this.audioUnlocked = true;
        console.log('🔓 Audio unlocked by user interaction');
        
        // Verify audio files are available in cache
        const testKeys = ['music-contemplative', 'sfx-click'];
        testKeys.forEach(key => {
          if (this.cache.audio.exists(key)) {
            console.log(`✓ Audio file available in cache: ${key}`);
          } else {
            console.warn(`✗ Audio file NOT in cache: ${key}`);
          }
        });
        // List all cached audio files
        const allAudio = this.cache.audio.getKeys();
        console.log('All audio files in cache:', allAudio);
        
        // Try to play music if audio is loaded and we have a node
        if (this.audioLoaded && this.nodeManager && this.nodeManager.currentNode) {
          const musicKey = this.audioManager.getMusicForPathway(this.nodeManager.currentNode.path);
          this.audioManager.playMusic(musicKey);
        }
      }
    };
    
    // Listen for user interactions to unlock audio
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);
    
    // Set up the scene
    this.setupBackground();
    this.setupCharacterSprite();
    
    // Check URL hash for node and trail
    this.parseUrlHash();
    
    // Start UI scene (overlays this scene)
    this.scene.launch('UIScene');
    
    // Listen for node changes from UI scene
    this.events.on('changeNode', this.onNodeChange, this);
    
    // Wait for UI scene to be ready before loading first node
    this.time.delayedCall(100, () => {
      this.loadCurrentNode();
    });
    
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
      this.parseUrlHash();
      this.loadCurrentNode();
    });
    
    // Audio is loaded in BootScene - just mark as ready
    this.audioLoaded = true;
  }

  parseUrlHash() {
    const hash = window.location.hash;
    if (!hash) {
      this.nodeManager.restart();
      return;
    }
    
    // Parse node=X&trail=Y format
    const nodeMatch = hash.match(/node=([^&]+)/);
    const trailMatch = hash.match(/trail=([^&]+)/);
    
    if (nodeMatch) {
      const nodeId = decodeURIComponent(nodeMatch[1]);
      this.nodeManager.currentNodeId = nodeId;
    }
    
    if (trailMatch) {
      const trail = decodeURIComponent(trailMatch[1]);
      this.nodeManager.trail = trail.split('>');
    }
  }

  setupBackground() {
    // Create background image
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    this.currentBackground = this.add.image(
      centerX,
      centerY,
      'background-classroom'
    );
    
    // Scale background to cover the entire screen (1024x1024 image on 1024x768 canvas)
    // Scale to fit width, then adjust height if needed
    const scaleX = this.cameras.main.width / 1024;
    const scaleY = this.cameras.main.height / 1024;
    const scale = Math.max(scaleX, scaleY); // Cover entire screen
    this.currentBackground.setScale(scale);
    
    this.currentBackground.setDepth(-10);
    
    // Add a subtle overlay to maintain pathway color theming (optional)
    this.backgroundOverlay = this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.0 // Start with no overlay
    );
    this.backgroundOverlay.setDepth(-9);
  }

  setupCharacterSprite() {
    // Place character sprite at the bottom-left of the screen, showing only half
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Position sprite to the left (25% from left edge)
    const spriteX = width * 0.25;
    
    // Position sprite so only bottom half is visible, moved up a bit
    // Sprite is 1024x1024, scaled to 0.48 = ~492x492 pixels (20% larger than 0.4)
    // To show only bottom half: position sprite center slightly above screen bottom
    const spriteY = height - 50; // Move up 50 pixels from bottom
    
    this.currentSprite = this.add.sprite(spriteX, spriteY, 'sprite-professor-neutral');
    // Scale increased by 20%: 0.408 * 1.2 = 0.4896
    this.currentSprite.setScale(0.4896); // Increased by 20%
    this.currentSprite.setDepth(0);
    this.currentSprite.setAlpha(0);
    
    // Keep origin at center (0.5, 0.5) - default
    // This way, positioning slightly above bottom shows bottom half
    
    // Fade in
    this.tweens.add({
      targets: this.currentSprite,
      alpha: 1,
      duration: 500,
      ease: 'Power2'
    });
  }

  loadCurrentNode() {
    const node = this.nodeManager.getCurrentNode();
    
    if (!node) {
      console.error('Node not found:', this.nodeManager.currentNodeId);
      return;
    }
    
    console.log('Loading node:', node.id, '-', node.title);
    
    // Update background color based on pathway
    this.updateBackground(node.path);
    
    // Update character emotion
    this.updateCharacterEmotion(node.path);
    
    // Play appropriate music (only if audio is loaded and unlocked by user)
    if (this.audioLoaded && this.audioUnlocked) {
      const musicKey = this.audioManager.getMusicForPathway(node.path);
      this.audioManager.playMusic(musicKey);
    } else if (this.audioLoaded && !this.audioUnlocked) {
      console.log('Audio loaded but waiting for user interaction to play...');
    }
    
    // Send node data to UI scene
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.displayNode(node);
    }
  }

  updateBackground(pathway) {
    // Get color for this pathway
    const colorHex = this.nodeManager.getPathwayColorHex(pathway);
    const color = Phaser.Display.Color.IntegerToColor(colorHex);
    
    // Apply subtle tint to background image based on pathway
    // Use a light tint (20-30% opacity) to maintain classroom visibility
    const tintIntensity = 0.25; // 25% tint
    
    // Tint the background image
    this.currentBackground.setTint(
      Phaser.Display.Color.GetColor(
        Math.min(255, color.r + (255 - color.r) * (1 - tintIntensity)),
        Math.min(255, color.g + (255 - color.g) * (1 - tintIntensity)),
        Math.min(255, color.b + (255 - color.b) * (1 - tintIntensity))
      )
    );
    
    // Optional: Add a subtle overlay for stronger pathway theming
    // Fade overlay in/out based on pathway intensity
    const overlayOpacity = pathway === 'shared' ? 0.0 : 0.15; // Subtle overlay for non-shared paths
    
    this.tweens.add({
      targets: this.backgroundOverlay,
      alpha: overlayOpacity,
      duration: 800,
      ease: 'Power2'
    });
    
    // Set overlay color to pathway color
    this.backgroundOverlay.setFillStyle(colorHex, overlayOpacity);
  }

  updateCharacterEmotion(pathway) {
    // Choose sprite based on pathway/emotion
    let spriteKey = 'sprite-professor-neutral';
    
    switch(pathway) {
      case 'prohibitive':
        spriteKey = 'sprite-professor-concerned';
        break;
      case 'ignore':
        spriteKey = 'sprite-professor-concerned';
        break;
      case 'balanced':
      case 'embracing':
      case 'collaborative':
        spriteKey = 'sprite-professor-thoughtful';
        break;
      default:
        spriteKey = 'sprite-professor-neutral';
    }
    
    // Only animate sprite change if the sprite actually needs to change
    if (this.currentSprite.texture.key !== spriteKey) {
      // Smooth fade-out, change texture, then fade-in
      this.tweens.add({
        targets: this.currentSprite,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.currentSprite.setTexture(spriteKey);
          this.tweens.add({
            targets: this.currentSprite,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
          });
        }
      });
    }
  }

  onNodeChange(nodeId) {
    // Update node in manager
    const oldNodeId = this.nodeManager.currentNodeId;
    this.nodeManager.setCurrentNode(nodeId);
    
    // Update URL hash
    const trail = this.nodeManager.getTrail();
    window.location.hash = `node=${encodeURIComponent(nodeId)}&trail=${encodeURIComponent(trail)}`;
    
    // Play transition sound
    this.audioManager.playSFX('sfx-transition', 0.3);
    
    // Load new node immediately - all elements (background, typewriter, dialogue box, buttons, character) are persistent
    // Only content (text, choices) and character sprite texture change
    this.loadCurrentNode();
  }

  // Audio is now loaded in BootScene - removed lazy loading method

  shutdown() {
    // Clean up event listeners
    this.events.off('changeNode');
    this.audioManager.stopMusic();
  }
}

