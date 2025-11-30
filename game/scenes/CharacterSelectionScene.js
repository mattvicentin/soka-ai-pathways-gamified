/**
 * CharacterSelectionScene - Character selection interface
 */

import { AudioManager } from '../managers/AudioManager.js';

export class CharacterSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectionScene' });
  }

  create() {
    try {
      console.log('CharacterSelectionScene: create() method called!');
      
      // Initialize audio manager
      this.audioManager = new AudioManager(this);
      this.audioManager.init();
      
      // Check if audio was already unlocked (from loading screen interaction)
      const audioUnlocked = this.registry.get('audioUnlocked') || false;
      
      // Resume audio context if needed (required for browser autoplay policy)
      if (audioUnlocked) {
        // Force AudioContext creation by playing a silent sound
        // This ensures the AudioContext is created and unlocked
        this.time.delayedCall(50, () => {
          try {
            // Try to create a silent sound to force AudioContext creation
            if (this.cache.audio.exists('sfx-click')) {
              // Play a silent click sound at volume 0 to unlock AudioContext
              const unlockSound = this.sound.add('sfx-click', { volume: 0 });
              unlockSound.play();
              unlockSound.once('play', () => {
                unlockSound.stop();
                unlockSound.destroy();
                console.log('🔓 AudioContext unlocked via silent sound');
                this.startContemplativeMusic();
              });
            } else {
              // No sound available, try direct AudioContext access
              this.ensureAudioContextReady();
            }
          } catch (error) {
            console.warn('Error creating unlock sound:', error);
            // Fallback to direct AudioContext access
            this.ensureAudioContextReady();
          }
        });
      } else {
        // Audio not unlocked yet, wait for user interaction
        console.log('Audio not unlocked yet, waiting for user interaction...');
        const unlockAndStart = () => {
          this.registry.set('audioUnlocked', true);
          // Resume AudioContext during user interaction
          if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
              console.log('🔓 AudioContext resumed on user interaction');
              this.startContemplativeMusic();
            }).catch(() => {
              this.startContemplativeMusic();
            });
          } else {
            this.startContemplativeMusic();
          }
          this.input.off('pointerdown', unlockAndStart);
          this.input.keyboard?.off('keydown', unlockAndStart);
        };
        this.input.once('pointerdown', unlockAndStart);
        this.input.keyboard?.once('keydown', unlockAndStart);
      }
      
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      
    console.log('CharacterSelectionScene: Canvas dimensions:', width, height);
    console.log('CharacterSelectionScene: Available textures:', Object.keys(this.textures.list || {}));
    
    // Check if background image exists
    if (!this.textures.exists('background-classroom')) {
      console.error('Background image "background-classroom" not found in cache!');
      console.log('Available texture keys:', Object.keys(this.textures.list));
      // Create a fallback dark background
      const fallbackBg = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
      fallbackBg.setDepth(0);
    } else {
      console.log('Background image found, creating...');
    }
    
    // Load classroom background with blur effect
    let bg = null;
    let isClassroomBackground = false;
    
    try {
      if (this.textures.exists('background-classroom')) {
        bg = this.add.image(width / 2, height / 2, 'background-classroom');
        isClassroomBackground = true;
        console.log('Background image created successfully');
        console.log('Background dimensions:', bg.width, 'x', bg.height);
        
        // Scale background to fill screen
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY) * 1.1; // Slightly larger to ensure coverage
        bg.setScale(scale);
        bg.setDepth(0);
        console.log('Background scaled to:', scale, 'Display size:', bg.displayWidth, 'x', bg.displayHeight);
        
        // Apply blur effect - lighter to show the classroom background
        // Technique 1: Light darken and slight opacity reduction for subtle blur effect
        bg.setTint(0xAAAAAA); // Light darkening to maintain visibility
        bg.setAlpha(0.6); // More visible - classroom should be clearly visible
      } else {
        console.warn('Background texture not found, using fallback');
        bg = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
        bg.setDepth(0);
        isClassroomBackground = false;
      }
    } catch (error) {
      console.error('Error creating background image:', error);
      // Fallback
      bg = this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);
      bg.setDepth(0);
      isClassroomBackground = false;
    }
    
    // Technique 2: Create light semi-transparent overlay for subtle blur effect
    // Only add overlays if classroom background was successfully created
    if (isClassroomBackground && bg) {
      const blurOverlay1 = this.add.graphics();
      blurOverlay1.fillStyle(0x000000, 0.2); // Light overlay to show classroom background clearly
      blurOverlay1.fillRect(0, 0, width, height);
      blurOverlay1.setDepth(1);
      
      const blurOverlay2 = this.add.graphics();
      blurOverlay2.fillStyle(0x444444, 0.15); // Very light additional blur layer
      blurOverlay2.fillRect(0, 0, width, height);
      blurOverlay2.setDepth(2);
      console.log('Blur overlays added - classroom background should be visible');
    } else {
      console.warn('Classroom background not available, skipping blur overlays');
    }
    
    // Title - very pixelated font with floating shadow effect
    const title = this.add.text(width / 2, 80, 'Choose Your Character', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(10);
    // Add floating shadow effect
    title.setShadow(3, 3, 'rgba(0, 0, 0, 0.5)', 5, true, true);
    
    // Character selection grid (2x2) - centered on screen
    const gridPadding = 40;
    const cellWidth = 300; // Fixed cell width for consistency
    const cellHeight = 300; // Fixed cell height for consistency
    
    // Calculate total grid dimensions
    const totalGridWidth = (cellWidth * 2) + gridPadding; // 2 cells + 1 gap
    const totalGridHeight = (cellHeight * 2) + gridPadding; // 2 cells + 1 gap
    
    // Center the grid horizontally
    const gridStartX = (width - totalGridWidth) / 2;
    const startX = gridStartX + cellWidth / 2; // Center of first column
    
    // Center the grid vertically (accounting for title at top)
    const titleHeight = 100; // Space for title
    const availableHeight = height - titleHeight;
    const gridStartY = titleHeight + (availableHeight - totalGridHeight) / 2;
    const startY = gridStartY + cellHeight / 2; // Center of first row
    
    // Character options - 2x2 grid layout
    // Top row: placeholder (left), black_male (right)
    // Bottom row: professor (left), white_female (right)
    const characters = [
      // Top-left: Placeholder
      {
        key: 'character4',
        name: 'Character 4',
        spriteKey: null // Will be added later
      },
      // Top-right: Black Male
      {
        key: 'black_male',
        name: 'Black Male',
        spriteKey: 'sprite-black-male-neutral'
      },
      // Bottom-left: Professor
      {
        key: 'professor',
        name: 'Professor',
        spriteKey: 'sprite-professor-neutral'
      },
      // Bottom-right: White Female
      {
        key: 'white_female',
        name: 'White Female',
        spriteKey: 'sprite-white-female-neutral'
      }
    ];
    
    // Create character selection buttons
    const characterButtons = [];
    characters.forEach((char, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      const x = startX + col * (cellWidth + gridPadding);
      const y = startY + row * (cellHeight + gridPadding);
      
      // Character container (background box)
      const container = this.add.rectangle(x, y, cellWidth - 20, cellHeight - 20, 0x000000, 0.7);
      container.setStrokeStyle(3, 0xFFFFFF, 1);
      container.setDepth(10);
      container.setInteractive({ useHandCursor: true });
      
      // Calculate consistent sprite size to fit in container
      // Leave padding on all sides (about 20px top/bottom, 10px left/right)
      const maxSpriteWidth = cellWidth - 40;
      const maxSpriteHeight = cellHeight - 60; // More space for centered sprite
      const targetSpriteSize = Math.min(maxSpriteWidth, maxSpriteHeight);
      
      // Character sprite (if available)
      if (char.spriteKey && this.textures.exists(char.spriteKey)) {
        const sprite = this.add.sprite(x, y, char.spriteKey);
        // Use setDisplaySize to ensure consistent sizing across all characters
        sprite.setDisplaySize(targetSpriteSize, targetSpriteSize);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(11);
        
        // Store sprite reference
        container.sprite = sprite;
        container.targetSize = targetSpriteSize;
      } else {
        // Placeholder text for characters not yet added - pixelated font
        const placeholder = this.add.text(x, y, 'Coming\nSoon', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '16px',
          color: '#888888',
          align: 'center'
        });
        placeholder.setOrigin(0.5, 0.5);
        placeholder.setDepth(11);
        container.placeholder = placeholder;
      }
      
      // Hover effects
      container.on('pointerover', () => {
        container.setFillStyle(0x000000, 0.8);
        container.setStrokeStyle(4, 0xFFFFFF, 1);
        if (container.sprite && container.targetSize) {
          // Slightly larger on hover (10% increase)
          const hoverSize = container.targetSize * 1.1;
          container.sprite.setDisplaySize(hoverSize, hoverSize);
        }
        
        // Play button click sound on hover (only for selectable characters)
        if (char.spriteKey && this.textures.exists(char.spriteKey) && this.audioManager) {
          try {
            this.audioManager.playSFX('sfx-click', 0.2);
          } catch (e) {
            console.log('Audio not available for hover sound');
          }
        }
      });
      
      container.on('pointerout', () => {
        container.setFillStyle(0x000000, 0.7);
        container.setStrokeStyle(3, 0xFFFFFF, 1);
        if (container.sprite && container.targetSize) {
          // Return to original size
          container.sprite.setDisplaySize(container.targetSize, container.targetSize);
        }
      });
      
      // Click handler
      if (char.spriteKey && this.textures.exists(char.spriteKey)) {
        container.on('pointerdown', () => {
          // Store selected character in registry
          this.registry.set('selectedCharacter', char.key);
          this.registry.set('selectedCharacterSpriteKey', char.spriteKey);
          
          console.log('Character selected:', char.key);
          
          // Play click sound on selection
          if (this.audioManager) {
            try {
              this.audioManager.playSFX('sfx-click', 0.3);
            } catch (e) {
              console.log('Audio not available for character selection click');
            }
          }
          
          // Fade out and transition to game
          // GameScene will launch UIScene, which will show customization modal if needed
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            // Always show customization modal after character selection (including after restart)
            // This ensures the user can reconfigure settings
            this.registry.set('showCustomizationAfterCredits', true);
            window.showCustomizationAfterCredits = true;
            
            // Reset node manager to D1
            const nodeManager = this.registry.get('nodeManager');
            if (nodeManager) {
              nodeManager.restart();
              window.location.hash = 'node=D1';
            }
            
            // Set flag to prevent auto-loading node (will load after customization)
            this.registry.set('skipAutoLoad', true);
            
            this.scene.start('GameScene');
          });
        });
      } else {
        // Disable interaction for placeholder characters
        container.setFillStyle(0x000000, 0.3);
        container.setStrokeStyle(2, 0x666666, 1);
        container.disableInteractive();
      }
      
      characterButtons.push(container);
    });
    
      // Start with scene visible (no fade needed since we're coming from loading screen)
      this.cameras.main.setAlpha(1);
      
      console.log('CharacterSelectionScene: Setup complete, scene should be visible');
      console.log('CharacterSelectionScene: Number of game objects:', this.children.list.length);
    } catch (error) {
      console.error('CharacterSelectionScene: Error in create() method:', error);
      console.error('Error stack:', error.stack);
      // Create a simple error message on screen
      const errorText = this.add.text(width / 2, height / 2, 'Error loading character selection', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FF0000'
      });
      errorText.setOrigin(0.5, 0.5);
    }
  }
  
  ensureAudioContextReady() {
    // Ensure AudioContext is created and resumed
    const tryResume = () => {
      try {
        if (this.sound && this.sound.context) {
          if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
              console.log('🔓 AudioContext resumed successfully');
              this.startContemplativeMusic();
            }).catch(err => {
              console.warn('Failed to resume AudioContext:', err);
              // Try to start music anyway
              this.startContemplativeMusic();
            });
          } else {
            // Already running, start music
            console.log('🔓 AudioContext already active');
            this.startContemplativeMusic();
          }
        } else {
          // AudioContext not created yet, wait a bit and try again
          console.log('AudioContext not ready yet, waiting...');
          this.time.delayedCall(100, tryResume);
        }
      } catch (error) {
        console.warn('Error accessing AudioContext:', error);
        // Try to start music anyway
        this.startContemplativeMusic();
      }
    };
    
    tryResume();
  }
  
  startContemplativeMusic() {
    // Start playing contemplative music
    if (this.audioManager && this.cache.audio.exists('music-contemplative')) {
      this.audioManager.playMusic('music-contemplative');
      console.log('CharacterSelectionScene: Started contemplative music');
    } else {
      console.warn('CharacterSelectionScene: Contemplative music not in cache');
      const allAudio = this.cache.audio.getKeys();
      console.log('Available audio files:', allAudio);
    }
  }
}

