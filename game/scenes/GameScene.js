/**
 * GameScene - Main game scene with background and character sprites
 */

import { AudioManager } from '../managers/AudioManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.currentSprite = null;
    this.currentBackground = null;
    this.currentPathway = null; // Track current pathway to avoid restarting music unnecessarily
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
    
    // Check if audio was already unlocked (e.g., from customization modal)
    this.audioUnlocked = this.registry.get('audioUnlocked') || false;
    
    if (this.audioUnlocked) {
      console.log('🔓 Audio already unlocked (from customization modal)');
    } else {
      // Track if user has interacted (required for browser autoplay policy)
      this.audioUnlocked = false;
      
      // Unlock audio on first user interaction
      const unlockAudio = () => {
        if (!this.audioUnlocked) {
          this.audioUnlocked = true;
          this.registry.set('audioUnlocked', true);
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
      
      // Listen for user interactions to unlock audio (fallback if not unlocked from modal)
      this.input.once('pointerdown', unlockAudio);
      this.input.keyboard?.once('keydown', unlockAudio);
    }
    
    // Set up the scene
    this.setupBackground();
    this.setupCharacterSprite();
    
    // Check URL hash for node and trail
    this.parseUrlHash();
    
    // Start UI scene (overlays this scene)
    this.scene.launch('UIScene');
    
    // Listen for node changes from UI scene
    this.events.on('changeNode', this.onNodeChange, this);
    
    // Audio is loaded in BootScene - just mark as ready
    this.audioLoaded = true;
    
    // Start with scene faded out, then fade in smoothly after sprites are created
    this.cameras.main.setAlpha(0);
    console.log('GameScene camera alpha set to 0, will fade in');
    
    // Fade in both scenes smoothly after sprites are created
    // Wait for UI scene to be fully initialized
    this.time.delayedCall(500, () => {
      console.log('Starting fade in... Current alpha:', this.cameras.main.alpha);
      
      // Use tween to fade camera alpha from 0 to 1 (more reliable than fadeIn)
      this.tweens.add({
        targets: this.cameras.main,
        alpha: 1,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          console.log('GameScene fade complete, alpha:', this.cameras.main.alpha);
        }
      });
      
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.cameras && uiScene.cameras.main) {
        console.log('UIScene found, starting fade. Current alpha:', uiScene.cameras.main.alpha);
        uiScene.tweens.add({
          targets: uiScene.cameras.main,
          alpha: 1,
          duration: 600,
          ease: 'Power2',
          onComplete: () => {
            console.log('UIScene fade complete, alpha:', uiScene.cameras.main.alpha);
          }
        });
      } else {
        console.warn('UIScene not found or cameras not ready');
      }
    });
    
    // Wait for UI scene to be ready before loading first node
    // Skip auto-load if flag is set (e.g., when coming from credits scene or character selection)
    this.skipAutoLoad = this.skipAutoLoad || this.registry.get('skipAutoLoad') || false;
    this.time.delayedCall(100, () => {
      if (!this.skipAutoLoad) {
        this.loadCurrentNode();
      } else {
        console.log('Skipping auto-load, waiting for customization modal');
        // Clear the registry flag
        this.registry.set('skipAutoLoad', false);
      }
    });
    
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
      this.parseUrlHash();
      this.loadCurrentNode();
    });
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
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.currentBackground = this.add.image(
      centerX,
      centerY,
      'background-classroom'
    );
    
    // Scale background to cover the entire screen (1024x1024 image on 1024x768 canvas)
    // Scale to fit width, then adjust height if needed
    const scaleX = width / 1024;
    const scaleY = height / 1024;
    const scale = Math.max(scaleX, scaleY); // Cover entire screen
    this.currentBackground.setScale(scale);
    
    this.currentBackground.setDepth(-10);
    
    // Add bookshelf sprites on the sides using DOM elements (outside Phaser canvas)
    // This fills the blue side areas that appear when canvas doesn't fill screen width
    this.addBookshelvesToSides();
    
    // Add a subtle overlay to maintain pathway color theming (optional)
    this.backgroundOverlay = this.add.rectangle(
      centerX,
      centerY,
      width,
      height,
      0x000000,
      0.0 // Start with no overlay
    );
    this.backgroundOverlay.setDepth(-8);
  }

  addBookshelvesToSides() {
    // Remove any existing bookshelf DOM elements
    const existingLeft = document.getElementById('bookshelf-left-container');
    const existingRight = document.getElementById('bookshelf-right-container');
    if (existingLeft) existingLeft.remove();
    if (existingRight) existingRight.remove();
    
    // Get the game container and canvas
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    const canvas = this.game.canvas;
    
    // Wait for next frame to ensure canvas is positioned
    this.time.delayedCall(100, () => {
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = gameContainer.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      
      // Calculate the side areas (space between canvas edges and viewport edges)
      const leftSpace = canvasRect.left - bodyRect.left;
      const rightSpace = bodyRect.right - canvasRect.right;
      
      // Add left bookshelf if there's space
      if (leftSpace > 10) {
        // Container for bookshelf and overlay
        const leftContainer = document.createElement('div');
        leftContainer.id = 'bookshelf-left-container';
        leftContainer.style.cssText = `
          position: fixed;
          left: 0;
          top: ${canvasRect.top}px;
          height: ${canvasRect.height}px;
          width: ${leftSpace}px;
          z-index: 0;
        `;
        
        const leftBookshelf = document.createElement('img');
        leftBookshelf.src = 'assets/sprites/bookshelf_left.png';
        leftBookshelf.id = 'bookshelf-left-dom';
        leftBookshelf.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        `;
        
        // Black fade overlay (fades from dark on right edge - near canvas - to transparent on left edge - outer edge)
        const leftOverlay = document.createElement('div');
        leftOverlay.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          background: linear-gradient(to left, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 30%, transparent 100%);
          pointer-events: none;
        `;
        
        leftContainer.appendChild(leftBookshelf);
        leftContainer.appendChild(leftOverlay);
        document.body.appendChild(leftContainer);
        this.leftBookshelfDOM = leftContainer;
      }
      
      // Add right bookshelf if there's space
      if (rightSpace > 10) {
        // Container for bookshelf and overlay
        const rightContainer = document.createElement('div');
        rightContainer.id = 'bookshelf-right-container';
        rightContainer.style.cssText = `
          position: fixed;
          right: 0;
          top: ${canvasRect.top}px;
          height: ${canvasRect.height}px;
          width: ${rightSpace}px;
          z-index: 0;
        `;
        
        const rightBookshelf = document.createElement('img');
        rightBookshelf.src = 'assets/sprites/bookshelf_right.png';
        rightBookshelf.id = 'bookshelf-right-dom';
        rightBookshelf.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        `;
        
        // Black fade overlay (fades from dark on left edge - near canvas - to transparent on right edge - outer edge)
        const rightOverlay = document.createElement('div');
        rightOverlay.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          background: linear-gradient(to right, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 30%, transparent 100%);
          pointer-events: none;
        `;
        
        rightContainer.appendChild(rightBookshelf);
        rightContainer.appendChild(rightOverlay);
        document.body.appendChild(rightContainer);
        this.rightBookshelfDOM = rightContainer;
      }
      
      // Update positions on window resize
      const resizeHandler = () => {
        this.updateBookshelfPositions();
      };
      window.addEventListener('resize', resizeHandler);
      this.resizeHandler = resizeHandler;
    });
  }

  updateBookshelfPositions() {
    const canvas = this.game.canvas;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    
    const leftSpace = canvasRect.left - bodyRect.left;
    const rightSpace = bodyRect.right - canvasRect.right;
    
    if (this.leftBookshelfDOM && leftSpace > 10) {
      this.leftBookshelfDOM.style.top = `${canvasRect.top}px`;
      this.leftBookshelfDOM.style.height = `${canvasRect.height}px`;
      this.leftBookshelfDOM.style.width = `${leftSpace}px`;
    } else if (this.leftBookshelfDOM) {
      this.leftBookshelfDOM.remove();
      this.leftBookshelfDOM = null;
    }
    
    if (this.rightBookshelfDOM && rightSpace > 10) {
      this.rightBookshelfDOM.style.top = `${canvasRect.top}px`;
      this.rightBookshelfDOM.style.height = `${canvasRect.height}px`;
      this.rightBookshelfDOM.style.width = `${rightSpace}px`;
    } else if (this.rightBookshelfDOM) {
      this.rightBookshelfDOM.remove();
      this.rightBookshelfDOM = null;
    }
  }

  setupCharacterSprite() {
    // Place character sprite at the bottom-left of the screen, showing only half
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Position sprite between cloud (left) and typewriter (right) - at 32% from left
    const spriteX = width * 0.32;
    
    // Position sprite so only bottom half is visible, moved up a bit
    // Sprite is 1024x1024, scaled to 0.48 = ~492x492 pixels (20% larger than 0.4)
    // To show only bottom half: position sprite center slightly above screen bottom
    const spriteY = height - 50; // Move up 50 pixels from bottom
    
    // Get selected character from registry (default to professor if not selected)
    const selectedCharacter = this.registry.get('selectedCharacter') || 'professor';
    const baseSpriteKey = this.getCharacterSpriteKey(selectedCharacter, 'neutral');
    
    this.currentSprite = this.add.sprite(spriteX, spriteY, baseSpriteKey);
    
    // Use fixed target height to ensure all characters appear the same size
    // regardless of their base sprite dimensions, while maintaining aspect ratio
    // Target height: 501px (based on 1024px base sprite * 0.4896 scale)
    const targetHeight = 501;
    
    // Calculate scale based on sprite's frame dimensions
    // Use a more reliable method to get texture dimensions
    const calculateScale = () => {
      let spriteHeight = 0;
      
      // Method 1: Try to get from texture source (most reliable)
      const texture = this.textures.get(baseSpriteKey);
      if (texture) {
        // Try texture source first (original image dimensions)
        if (texture.source && texture.source.length > 0) {
          const source = texture.source[0];
          if (source && source.height) {
            spriteHeight = source.height;
          }
        }
        
        // Method 2: Try texture frames
        if (spriteHeight === 0 && texture.frames) {
          if (texture.frames.__BASE && texture.frames.__BASE.height) {
            spriteHeight = texture.frames.__BASE.height;
          } else {
            const frameKeys = Object.keys(texture.frames);
            if (frameKeys.length > 0) {
              const firstFrame = texture.frames[frameKeys[0]];
              if (firstFrame && firstFrame.height) {
                spriteHeight = firstFrame.height;
              }
            }
          }
        }
      }
      
      // Method 3: Try sprite's frame property
      if (spriteHeight === 0 && this.currentSprite.frame) {
        spriteHeight = this.currentSprite.frame.height;
      }
      
      // Method 4: Try sprite's height property (may be scaled already)
      if (spriteHeight === 0) {
        spriteHeight = this.currentSprite.height;
        // If height is already scaled, try to get original
        if (this.currentSprite.scaleY !== 1 && this.currentSprite.scaleY > 0) {
          spriteHeight = spriteHeight / this.currentSprite.scaleY;
        }
      }
      
      // Final fallback: assume standard sprite size
      if (spriteHeight === 0 || spriteHeight < 100) {
        spriteHeight = 1024; // Default assumption
        console.warn(`Could not determine sprite height for ${baseSpriteKey}, assuming 1024px`);
      }
      
      // Calculate scale to achieve target height
      let scale = targetHeight / spriteHeight;
      
      // Adjust scale for black_male_thoughtful sprite due to different image cropping
      // Increase size by 40% to match visual appearance of other characters
      if (baseSpriteKey === 'sprite-black-male-thoughtful') {
        scale = scale * 1.4; // Increase by 40% to compensate for different cropping
        console.log(`Black male thoughtful sprite detected - applying size adjustment (scale: ${scale.toFixed(4)})`);
      }
      
      // Adjust scale for black_female sprites - increase by 20% for in-game experience
      if (baseSpriteKey.startsWith('sprite-black-female-')) {
        scale = scale * 1.2; // Increase by 20% to match visual appearance of other characters
        console.log(`Black female sprite detected - applying size adjustment (scale: ${scale.toFixed(4)})`);
      }
      
      this.currentSprite.setScale(scale);
      // Store target height and scale for use when texture changes
      this.characterTargetHeight = targetHeight;
      this.characterScale = scale;
      console.log(`Character ${baseSpriteKey}: original height=${spriteHeight}px, target=${targetHeight}px, scale=${scale.toFixed(4)}`);
    };
    
    // Calculate scale - try immediately and retry if needed
    calculateScale();
    // Retry after a short delay to ensure texture is fully loaded
    this.time.delayedCall(100, calculateScale);
    
    this.currentSprite.setDepth(0);
    // Start visible - camera fade will handle the transition
    this.currentSprite.setAlpha(1);
    
    // Store selected character for emotion updates
    this.selectedCharacter = selectedCharacter;
    
    // Keep origin at center (0.5, 0.5) - default
    // This way, positioning slightly above bottom shows bottom half
  }
  
  getCharacterSpriteKey(characterKey, emotion) {
    // Map character key and emotion to sprite key
    let characterPrefix;
    if (characterKey === 'white_female') {
      characterPrefix = 'sprite-white-female';
    } else if (characterKey === 'black_male') {
      characterPrefix = 'sprite-black-male';
    } else if (characterKey === 'black_female') {
      characterPrefix = 'sprite-black-female';
    } else {
      characterPrefix = 'sprite-professor'; // Default to professor
    }
    const emotionSuffix = emotion || 'neutral';
    return `${characterPrefix}-${emotionSuffix}`;
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
    
    // Play appropriate music only if pathway changed (only if audio is loaded and unlocked by user)
    if (this.audioLoaded && this.audioUnlocked) {
      // Only change music if we're switching to a different pathway, or if no music is playing yet
      if (this.currentPathway !== node.path || !this.audioManager.currentMusic) {
        const musicKey = this.audioManager.getMusicForPathway(node.path);
        this.audioManager.playMusic(musicKey);
        this.currentPathway = node.path; // Update tracked pathway
      }
      // If staying in same pathway, keep current music playing
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
    // Get selected character (default to professor if not set)
    const selectedCharacter = this.selectedCharacter || this.registry.get('selectedCharacter') || 'professor';
    
    // Choose emotion based on pathway
    let emotion = 'neutral';
    
    switch(pathway) {
      case 'prohibitive':
        emotion = 'concerned';
        break;
      case 'ignore':
        emotion = 'concerned';
        break;
      case 'balanced':
      case 'embracing':
      case 'collaborative':
        emotion = 'thoughtful';
        break;
      default:
        emotion = 'neutral';
    }
    
    // Get sprite key for selected character and emotion
    const spriteKey = this.getCharacterSpriteKey(selectedCharacter, emotion);
    
    // Only animate sprite change if the sprite actually needs to change
    if (this.currentSprite.texture.key !== spriteKey) {
      // Store target height to ensure consistent sizing
      const targetHeight = this.characterTargetHeight || 501;
      
      // Smooth fade-out, change texture, then fade-in
      this.tweens.add({
        targets: this.currentSprite,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.currentSprite.setTexture(spriteKey);
          
          // Recalculate scale based on new sprite's texture dimensions
          // Use fixed target height so all characters appear the same size
          const targetHeight = this.characterTargetHeight || 501;
          let newSpriteHeight = 0;
          
          // Method 1: Try texture source (most reliable)
          const texture = this.textures.get(spriteKey);
          if (texture) {
            if (texture.source && texture.source.length > 0) {
              const source = texture.source[0];
              if (source && source.height) {
                newSpriteHeight = source.height;
              }
            }
            
            // Method 2: Try texture frames
            if (newSpriteHeight === 0 && texture.frames) {
              if (texture.frames.__BASE && texture.frames.__BASE.height) {
                newSpriteHeight = texture.frames.__BASE.height;
              } else {
                const frameKeys = Object.keys(texture.frames);
                if (frameKeys.length > 0) {
                  const firstFrame = texture.frames[frameKeys[0]];
                  if (firstFrame && firstFrame.height) {
                    newSpriteHeight = firstFrame.height;
                  }
                }
              }
            }
          }
          
          // Method 3: Try sprite's frame property
          if (newSpriteHeight === 0 && this.currentSprite.frame) {
            newSpriteHeight = this.currentSprite.frame.height;
          }
          
          // Method 4: Try sprite's height (may need to account for current scale)
          if (newSpriteHeight === 0) {
            newSpriteHeight = this.currentSprite.height;
            if (this.currentSprite.scaleY !== 1 && this.currentSprite.scaleY > 0) {
              newSpriteHeight = newSpriteHeight / this.currentSprite.scaleY;
            }
          }
          
          // Final fallback: assume standard size
          if (newSpriteHeight === 0 || newSpriteHeight < 100) {
            newSpriteHeight = 1024;
            console.warn(`Could not determine sprite height for ${spriteKey}, assuming 1024px`);
          }
          
          // Calculate scale to achieve target height
          let newScale = targetHeight / newSpriteHeight;
          
          // Adjust scale for black_male_thoughtful sprite due to different image cropping
          // Increase size by 40% to match visual appearance of other characters
          if (spriteKey === 'sprite-black-male-thoughtful') {
            newScale = newScale * 1.4; // Increase by 40% to compensate for different cropping
            console.log(`Black male thoughtful sprite detected - applying size adjustment (scale: ${newScale.toFixed(4)})`);
          }
          
          // Adjust scale for black_female sprites - increase by 20% for in-game experience
          if (spriteKey.startsWith('sprite-black-female-')) {
            newScale = newScale * 1.2; // Increase by 20% to match visual appearance of other characters
            console.log(`Black female sprite detected - applying size adjustment (scale: ${newScale.toFixed(4)})`);
          }
          
          this.currentSprite.setScale(newScale);
          // Update stored scale and target height
          this.characterScale = newScale;
          this.characterTargetHeight = targetHeight;
          console.log(`Character ${spriteKey}: original height=${newSpriteHeight}px, target=${targetHeight}px, scale=${newScale.toFixed(4)}`);
          
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
    
    // Clean up DOM bookshelf elements
    if (this.leftBookshelfDOM) {
      this.leftBookshelfDOM.remove();
      this.leftBookshelfDOM = null;
    }
    if (this.rightBookshelfDOM) {
      this.rightBookshelfDOM.remove();
      this.rightBookshelfDOM = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}

