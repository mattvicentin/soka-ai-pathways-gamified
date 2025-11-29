/**
 * UIScene - Visual novel interface with dialogue box and choices
 */

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
    this.currentNode = null;
    this.isTyping = false;
    this.typewriterTimer = null;
    this.fullText = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.choiceButtons = [];
    // Text pagination
    this.textPages = [];
    this.currentPage = 0;
    this.continueButton = null;
    // Timer for delayed choice display
    this.showChoicesTimer = null;
    // Track typewriter sound instance
    this.typewriterSound = null;
    // Choice block area for fade overlay (non-interactive, just for reference)
    this.choiceBlockArea = null;
    // Track how many choice buttons are currently hovered
    this.hoveredChoiceCount = 0;
    // Volume control panel
    this.volumePanel = null;
    this.volumePanelVisible = false;
    // Typewriter cursor
    this.typewriterCursor = null;
    this.cursorBlinkTimer = null;
    // Reflection modal
    this.shouldShowReflection = false;
    this.reflectionOverlay = null;
    // Resources modal
    this.resourcesOverlay = null;
    // Customization modal
    this.customizationOverlay = null;
  }

  create() {
    console.log('UIScene: Starting...');
    
    // Start with scene faded out, will fade in with GameScene
    this.cameras.main.setAlpha(0);
    console.log('UIScene camera alpha set to 0, will fade in with GameScene');
    
    // Get nodeManager from registry
    this.nodeManager = this.registry.get('nodeManager');
    
    // Check if we should show customization modal after credits
    // Check both window object (persists) and registry (backup)
    const showCustomization = window.showCustomizationAfterCredits || this.registry.get('showCustomizationAfterCredits');
    console.log('UIScene create - showCustomization flag:', showCustomization, '(window:', window.showCustomizationAfterCredits, ', registry:', this.registry.get('showCustomizationAfterCredits'), ')');
    if (showCustomization) {
      // Don't clear flags yet - wait until modal is actually shown
      // Wait a bit for scene to fully initialize, then show modal
      this.time.delayedCall(500, () => {
        console.log('Delayed call executing - showing customization modal after credits scene');
        // Check flag again in case scene was recreated
        const stillShow = window.showCustomizationAfterCredits || this.registry.get('showCustomizationAfterCredits');
        if (stillShow) {
          // Clear flags now
          window.showCustomizationAfterCredits = false;
          this.registry.set('showCustomizationAfterCredits', false);
          try {
            console.log('Calling showCustomizationModal()...');
            this.showCustomizationModal();
            console.log('showCustomizationModal() called successfully');
          } catch (error) {
            console.error('Error showing customization modal:', error);
            // Fallback: load the node if modal fails
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
              gameScene.skipAutoLoad = false;
              gameScene.loadCurrentNode();
            }
          }
        } else {
          console.warn('Flag was cleared before modal could be shown');
        }
      });
    }
    
    // Create fade overlay for choice button hover effect (initially hidden)
    // Use graphics object which is non-interactive by default
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.fadeOverlay = this.add.graphics();
    // Position graphics at center, then draw rectangle from top-left corner
    this.fadeOverlay.x = width / 2;
    this.fadeOverlay.y = height / 2;
    this.fadeOverlay.fillStyle(0x000000, 1.0); // Full opacity - control via alpha property
    this.fadeOverlay.fillRect(-width / 2, -height / 2, width, height);
    this.fadeOverlay.setDepth(50); // Very low depth - well below all interactive elements
    this.fadeOverlay.setAlpha(0); // Start hidden (0 = invisible)
    this.fadeOverlay.setVisible(false);
    // Graphics objects are non-interactive by default - no need to disable input
    
    // Create UI elements
    this.createDialogueBox();
    this.createPathwayBadge();
    this.createControlButtons();
    this.createTypewriter();
    
    // Input handling
    this.input.keyboard.on('keydown-SPACE', () => this.skipTypewriter());
    this.input.keyboard.on('keydown-ENTER', () => this.skipTypewriter());
    this.input.on('pointerdown', (pointer) => {
      // Click in dialogue box area (top) to skip typewriter
      // Dialogue box is now at Y ~140-320 (title + dialogue box)
      if (this.isTyping && pointer.y < 350) {
        this.skipTypewriter();
      }
    });
  }

  createDialogueBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const titleHeight = 40; // Space for title
    const boxHeight = 135; // Dialogue box height (reduced by 25% from 180)
    const titleY = 20; // Title at top
    const boxY = titleY + titleHeight + boxHeight / 2; // Dialogue box below title
    
    // Title text - centered at top, black with white outline
    this.titleText = this.add.text(width / 2, titleY, '', {
      fontFamily: '"VT323", monospace',
      fontSize: '24px', // Increased for better readability
      fontStyle: 'bold',
      color: '#000000',
      stroke: '#FFFFFF',
      strokeThickness: 3,
      wordWrap: { width: width - 60 }
    });
    this.titleText.setOrigin(0.5, 0); // Center horizontally, align top
    this.titleText.setDepth(101);
    
    // Dialogue box background (Undertale/Tails Noir style) - below title, centered
    const boxWidth = width - 40; // Keep original width
    this.dialogueBox = this.add.rectangle(
      width / 2,
      boxY,
      boxWidth,
      boxHeight,
      0x000000,
      0.85
    );
    this.dialogueBox.setOrigin(0.5, 0.5); // Center the rectangle
    this.dialogueBox.setStrokeStyle(4, 0xFFFFFF, 1);
    this.dialogueBox.setDepth(100);
    
    // Narrative text - inside dialogue box, constrained to box boundaries
    // Since dialogue box is centered, calculate edges from center
    const dialogueBoxLeft = 20; // Left edge of dialogue box (margin from screen edge)
    const dialogueBoxRight = width - 20; // Right edge of dialogue box
    const dialogueBoxTop = boxY - boxHeight / 2; // Top edge of dialogue box (center - half height)
    const dialogueBoxBottom = boxY + boxHeight / 2; // Bottom edge of dialogue box (center + half height)
    const textPadding = 20; // Padding inside box
    const continueButtonReservedSpace = 40; // Space reserved at bottom for continue button (30px button + 10px margin)
    const maxTextWidth = dialogueBoxRight - dialogueBoxLeft - (textPadding * 2); // Available width
    const maxTextHeight = boxHeight - (textPadding * 2) - continueButtonReservedSpace; // Available height (135 - 40 - 40 = 55px)
    
    this.narrativeText = this.add.text(
      dialogueBoxLeft + textPadding, 
      dialogueBoxTop + textPadding, 
      '', 
      {
        fontFamily: '"VT323", monospace',
        fontSize: '22px', // Increased for better readability
        color: '#FFFFFF',
        lineSpacing: 4,
        wordWrap: { 
          width: maxTextWidth // Constrain to box width
        },
        maxLines: 0 // Allow wrapping but will be clipped by mask
      }
    );
    this.narrativeText.setOrigin(0, 0); // Left-align text within the centered box
    this.narrativeText.setDepth(101);
    
    // Create a mask to clip text that goes beyond dialogue box
    this.textMask = this.add.rectangle(
      dialogueBoxLeft + textPadding,
      dialogueBoxTop + textPadding,
      maxTextWidth,
      maxTextHeight,
      0x000000,
      0
    );
    this.textMask.setOrigin(0, 0);
    this.textMask.setDepth(100);
    this.textMask.setVisible(false); // Hide the mask rectangle (it's just for clipping)
    
    // Apply mask to narrative text to ensure it stays within box
    this.narrativeText.setMask(new Phaser.Display.Masks.GeometryMask(this, this.textMask));
    
    // Typewriter cursor - blinking indicator at end of text
    this.typewriterCursor = this.add.text(0, 0, '|', {
      fontFamily: '"VT323", monospace',
      fontSize: '22px', // Increased to match narrative text
      color: '#FFFFFF'
    });
    this.typewriterCursor.setOrigin(0, 0);
    this.typewriterCursor.setDepth(102); // Above narrative text
    this.typewriterCursor.setVisible(false);
    
    // Make cursor blink
    this.tweens.add({
      targets: this.typewriterCursor,
      alpha: { from: 1, to: 0 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // "Click to continue" indicator - at bottom right of dialogue box (above continue button area)
    this.continueIndicator = this.add.text(
      width - 50,
      dialogueBoxBottom - 40, // Above the continue button reserved area
      '▼',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#FFFFFF'
      }
    );
    this.continueIndicator.setDepth(101);
    this.continueIndicator.setVisible(false);
    
    // Animate indicator
    this.tweens.add({
      targets: this.continueIndicator,
      y: '+=10',
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createPathwayBadge() {
    // Pathway badge removed per user request
    // Keeping method for compatibility but not creating any elements
  }

  createControlButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const padding = 20;
    
    // Audio toggle button - bottom-left, 30% smaller
    const audioBtn = this.add.text(
      padding,
      height - padding - 20,
      '🔊',
      {
        fontFamily: 'Arial',
        fontSize: '13px', // 30% smaller (18px * 0.7 ≈ 13px)
        color: '#FFFFFF',
        backgroundColor: '#333333',
        padding: { x: 7, y: 4 } // Also reduce padding
      }
    );
    
    // Restart button - bottom-right, moved left
    const restartBtn = this.add.text(
      width - padding - 80,
      height - padding - 20,
      '↻ Restart',
      {
        fontFamily: '"VT323", monospace',
        fontSize: '16px', // Increased for better readability
        color: '#FFFFFF',
        backgroundColor: '#333333',
        padding: { x: 7, y: 4 } // Also reduce padding
      }
    );
    restartBtn.setDepth(103); // Above typewriter (102)
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.restart());
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#555555'));
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#333333'));
    audioBtn.setDepth(110); // Above typewriter (102) and all other UI elements
    audioBtn.setInteractive({ useHandCursor: true });
    
    // Store audio button reference
    this.audioButton = audioBtn;
    
    // Create volume control panel (hidden by default)
    this.createVolumePanel(width, height, padding);
    
    audioBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.audioManager) {
        // Unlock audio on first click (browser autoplay policy)
        if (!gameScene.audioUnlocked) {
          gameScene.audioUnlocked = true;
          console.log('🔓 Audio unlocked by audio button click');
        }
        
        // Toggle volume panel instead of mute
        this.toggleVolumePanel();
      }
    });
    audioBtn.on('pointerover', () => audioBtn.setBackgroundColor('#555555'));
    audioBtn.on('pointerout', () => audioBtn.setBackgroundColor('#333333'));
  }

  createTypewriter() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Position typewriter in bottom right corner, extending beyond right edge to cover audio button
    // Scale it appropriately - estimate size, will adjust based on actual sprite
    this.typewriterSprite = this.add.image(
      width + 150, // Extends beyond right edge to cover audio button (150px off-screen)
      height + 190, // Position lower so bottom is cut off (190px below screen)
      'typewriter'
    );
    
    // Set origin to bottom-right for easier positioning
    this.typewriterSprite.setOrigin(1, 1);
    
    // Wait for sprite to load before calculating scale and paper area
    this.time.delayedCall(50, () => {
      // Scale typewriter to double size (100% increase = 2x)
      const targetWidth = width * 0.80; // 80% of screen width
      const spriteWidth = this.typewriterSprite.width || 400; // Fallback if not loaded
      const scale = targetWidth / spriteWidth;
      this.typewriterSprite.setScale(scale);
      
      // Calculate paper area position (typically upper center of typewriter)
      // These will be recalculated in showChoices, but initialize here
      const typewriterCenterX = this.typewriterSprite.x - (this.typewriterSprite.width * scale * 0.5);
      // Use smaller paper area to ensure text fits
      const paperWidth = this.typewriterSprite.width * scale * 0.5; // 50% of typewriter width
      const paperHeight = this.typewriterSprite.height * scale * 0.35; // 35% of typewriter height
      
      this.typewriterPaperArea = {
        centerX: typewriterCenterX, // Center of typewriter (for reference)
        leftX: typewriterCenterX - paperWidth / 2, // Left edge of paper area
        y: this.typewriterSprite.y - (this.typewriterSprite.height * scale * 0.65), // Adjusted Y position
        width: paperWidth, // 50% of typewriter width
        height: paperHeight // 35% of typewriter height
      };
    });
    
    // Set depth - above audio button (101) so it covers it
    this.typewriterSprite.setDepth(102);
    
    // Always visible - persistent element like background, dialogue box, buttons, and character
    this.typewriterSprite.setVisible(true);
    this.typewriterSprite.setAlpha(1);
    
    // Initialize paper area (will be recalculated when needed)
    this.typewriterPaperArea = null;
  }

  displayNode(node, retryCount = 0) {
    if (!node) {
      console.error('displayNode called with no node');
      return;
    }
    
    // Safety check - make sure UI elements are created
    if (!this.titleText || !this.narrativeText) {
      // Limit retries to prevent infinite loop
      if (retryCount < 10) {
        console.log('UI elements not ready yet, retrying...', retryCount);
        this.time.delayedCall(50, () => this.displayNode(node, retryCount + 1));
        return;
      } else {
        console.error('UI elements failed to initialize after 10 retries');
        return;
      }
    }
    
    this.currentNode = node;
    
    // CRITICAL: Stop any running typewriter and reset state before starting new node
    this.stopTypewriter();
    
    // Clear previous choices
    this.clearChoices();
    
    // Hide continue button and indicator
    this.hideContinueButton();
    if (this.continueIndicator) {
      this.continueIndicator.setVisible(false);
    }
    
    // Update title (centered)
    this.titleText.setText(node.title);
    
    // Clear narrative text
    this.narrativeText.setText('');
    
    // If this is R1, show reflection modal immediately (before typewriter)
    if (node.id === 'R1') {
      this.shouldShowReflection = true;
      // Show modal immediately, don't wait for typewriter
      this.time.delayedCall(100, () => {
        this.showReflectionModal();
      });
      // Still show the narrative text, but modal will be on top
      this.startTypewriter(node.narrative);
    } else {
      this.shouldShowReflection = false;
      // Start typewriter effect for narrative
      this.startTypewriter(node.narrative);
    }
  }

  splitTextIntoPages(text) {
    // Calculate available text area (matching createDialogueBox calculations)
    const width = this.cameras.main.width;
    const dialogueBoxLeft = 20; // Left edge of dialogue box (margin from screen edge)
    const dialogueBoxRight = width - 20; // Right edge of dialogue box
    const textPadding = 20;
    const continueButtonReservedSpace = 40; // Space reserved at bottom for continue button
    const boxHeight = 135; // Dialogue box height
    const maxTextWidth = dialogueBoxRight - dialogueBoxLeft - (textPadding * 2); // Available width
    const maxTextHeight = boxHeight - (textPadding * 2) - continueButtonReservedSpace; // Available height (135 - 40 - 40 = 55px)
    
    // Create a temporary text object to measure text dimensions
    const tempText = this.add.text(0, 0, '', {
      fontFamily: '"VT323", monospace',
      fontSize: '22px', // Match narrative text size
      wordWrap: { width: maxTextWidth },
      lineSpacing: 4
    });
    
    const pages = [];
    let remainingText = text;
    
    while (remainingText.length > 0) {
      // Find the maximum text that fits in one page
      let pageText = '';
      let testText = '';
      
      // Try adding words until we exceed the height
      const words = remainingText.split(' ');
      for (let i = 0; i < words.length; i++) {
        const test = testText + (testText ? ' ' : '') + words[i];
        tempText.setText(test);
        const textHeight = tempText.height;
        
        if (textHeight <= maxTextHeight) {
          testText = test;
          pageText = test;
        } else {
          break;
        }
      }
      
      // If we couldn't fit any words, force at least one word
      if (!pageText && words.length > 0) {
        pageText = words[0];
      }
      
      pages.push(pageText);
      // Find where this page text ends in the remaining text
      // We need to account for the space that was added between words
      const wordsUsed = pageText.split(' ').length;
      const remainingWords = remainingText.split(' ');
      remainingText = remainingWords.slice(wordsUsed).join(' ').trim();
    }
    
    tempText.destroy();
    return pages;
  }

  stopTypewriter() {
    // Stop any running typewriter timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    
    // Hide cursor
    if (this.typewriterCursor) {
      this.typewriterCursor.setVisible(false);
    }
    
    // Stop typewriter sound
    if (this.typewriterSound) {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.audioManager) {
        gameScene.audioManager.stopSFX(this.typewriterSound);
      }
      this.typewriterSound = null;
    }
    
    // Reset typewriter state
    this.isTyping = false;
    this.displayedText = '';
    this.charIndex = 0;
    this.textPages = [];
    this.currentPage = 0;
    this.fullText = '';
    
    // Cancel any pending delayed calls for showing choices
    if (this.showChoicesTimer) {
      this.time.removeEvent(this.showChoicesTimer);
      this.showChoicesTimer = null;
    }
  }

  startTypewriter(text) {
    // CRITICAL: Stop any existing typewriter first
    this.stopTypewriter();
    
    // Split text into pages
    this.textPages = this.splitTextIntoPages(text);
    this.currentPage = 0;
    this.fullText = this.textPages[0] || text;
    this.displayedText = '';
    this.charIndex = 0;
    this.isTyping = true;
    
    if (this.continueIndicator) {
      this.continueIndicator.setVisible(false);
    }
    this.hideContinueButton();
    
    // Clear existing text
    this.narrativeText.setText('');
    
    // Show cursor
    if (this.typewriterCursor) {
      this.typewriterCursor.setVisible(true);
      this.updateCursorPosition();
    }
    
    // Type character by character
    this.typewriterTimer = this.time.addEvent({
      delay: 16, // ms per character (20% faster: 20 * 0.8 = 16)
      callback: () => {
        // Check if we're still supposed to be typing (prevents race conditions)
        if (!this.isTyping || !this.typewriterTimer) {
          return;
        }
        
        if (this.charIndex < this.fullText.length) {
          this.displayedText += this.fullText[this.charIndex];
          this.narrativeText.setText(this.displayedText);
          this.charIndex++;
          
          // Update cursor position
          this.updateCursorPosition();
          
          // Play text sound (if available) - only on first character to start looping sound
          const gameScene = this.scene.get('GameScene');
          if (gameScene && gameScene.audioManager && this.charIndex === 1) {
            // Start typewriter sound at 0:07, loop between 0:07 and 0:25 (18 seconds)
            // Use current SFX volume * 0.17 multiplier (typewriter is 17% of SFX volume)
            const typewriterVol = gameScene.audioManager.sfxVolume * 0.17;
            this.typewriterSound = gameScene.audioManager.playSFX('sfx-text', typewriterVol, 7, 7, 25);
          }
        } else {
          this.finishTypewriter();
        }
      },
      loop: true
    });
  }

  updateCursorPosition() {
    if (!this.typewriterCursor || !this.narrativeText || !this.displayedText) return;
    
    // Get word wrap width safely - calculate from dialogue box dimensions
    const width = this.cameras.main.width;
    const dialogueBoxLeft = 20;
    const dialogueBoxRight = width - 20;
    const textPadding = 20;
    const maxTextWidth = dialogueBoxRight - dialogueBoxLeft - (textPadding * 2);
    
    // Get word wrap width from text style, or use calculated maxTextWidth as fallback
    let wordWrapWidth = maxTextWidth;
    try {
      if (this.narrativeText.style && this.narrativeText.style.wordWrap && this.narrativeText.style.wordWrap.width) {
        wordWrapWidth = this.narrativeText.style.wordWrap.width;
      }
    } catch (e) {
      // Use fallback if style access fails
      wordWrapWidth = maxTextWidth;
    }
    
    // Create a temporary text object with the same style to measure text dimensions
    const tempText = this.add.text(0, 0, this.displayedText, {
      fontFamily: '"VT323", monospace',
      fontSize: '22px', // Match narrative text size
      wordWrap: { width: wordWrapWidth },
      lineSpacing: 4
    });
    
    // Get the text dimensions
    const textWidth = tempText.width;
    const textHeight = tempText.height;
    
    // For wrapped text, find the last line
    const lines = this.displayedText.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    
    // Measure just the last line to get its width
    const lastLineText = this.add.text(0, 0, lastLine, {
      fontFamily: '"VT323", monospace',
      fontSize: '22px' // Match narrative text size
    });
    const lastLineWidth = lastLineText.width;
    lastLineText.destroy();
    tempText.destroy();
    
    // Position cursor at the end of the last line
    this.typewriterCursor.x = this.narrativeText.x + lastLineWidth;
    // Y position: start of narrative text + height of all text minus one line height
    // Since text wraps, we need to calculate based on number of lines
    const lineHeight = 14 + 4; // fontSize + lineSpacing
    const numLines = lines.length;
    this.typewriterCursor.y = this.narrativeText.y + (numLines - 1) * lineHeight;
  }

  skipTypewriter() {
    if (!this.isTyping) return;
    
    // Stop timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    
    // Show full text immediately for current page
    this.narrativeText.setText(this.fullText);
    this.displayedText = this.fullText;
    this.charIndex = this.fullText.length;
    this.finishTypewriter();
  }

  finishTypewriter() {
    // Prevent multiple calls
    if (!this.isTyping) {
      return;
    }
    
    this.isTyping = false;
    
    // Stop timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    
    // Hide cursor
    if (this.typewriterCursor) {
      this.typewriterCursor.setVisible(false);
    }
    
    // Stop typewriter sound
    if (this.typewriterSound) {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.audioManager) {
        gameScene.audioManager.stopSFX(this.typewriterSound);
      }
      this.typewriterSound = null;
    }
    
    // Ensure we have the full text displayed
    this.narrativeText.setText(this.fullText);
    this.displayedText = this.fullText;
    this.charIndex = this.fullText.length;
    
    // Check if there are more pages
    if (this.currentPage < this.textPages.length - 1) {
      // Show continue button instead of choices
      this.showContinueButton();
    } else {
      // All text displayed, show continue indicator and choices
      if (this.continueIndicator) {
        this.continueIndicator.setVisible(true);
      }
      this.hideContinueButton();
      
      // Cancel any existing delayed call
      if (this.showChoicesTimer) {
        this.time.removeEvent(this.showChoicesTimer);
      }
      
      // Show choices after a brief delay - only if we're still on the same node
      // Don't show choices for R1 if reflection modal is open
      this.showChoicesTimer = this.time.delayedCall(300, () => {
        // Don't show choices for R1 if reflection modal is open
        if (this.currentNode && this.currentNode.id === 'R1' && this.reflectionOverlay) {
          console.log('Skipping choices for R1 - reflection modal is open');
          return;
        }
        
        if (this.currentNode && this.currentNode.choices && this.currentNode.choices.length > 0) {
          // Double-check we're still on the same node before showing choices
          this.showChoices();
        }
        this.showChoicesTimer = null;
      });
    }
  }

  showContinueButton() {
    // Hide continue indicator when showing continue button
    this.continueIndicator.setVisible(false);
    
    // Remove existing continue button if any
    this.hideContinueButton();
    
    const width = this.cameras.main.width;
    const titleHeight = 40;
    const dialogueBoxHeight = 135; // Reduced by 25% from 180
    const titleY = 20;
    const boxY = titleY + titleHeight + dialogueBoxHeight / 2; // Center Y of dialogue box
    const dialogueBoxBottom = boxY + dialogueBoxHeight / 2; // Bottom edge of centered dialogue box
    const dialogueBoxRight = width - 20; // Right edge of dialogue box (original width)
    
    // Continue button at bottom-right of dialogue box, within reserved space
    const buttonWidth = 100;
    const buttonHeight = 30;
    const buttonMargin = 10; // Margin from bottom and right edges
    const buttonX = dialogueBoxRight - buttonWidth - buttonMargin;
    const buttonY = dialogueBoxBottom - buttonHeight / 2 - buttonMargin; // Centered vertically in reserved space
    
    // Button background
    const buttonBg = this.add.rectangle(
      buttonX + buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x000000,
      0.7
    );
    buttonBg.setStrokeStyle(2, 0xFFFFFF, 1);
    buttonBg.setDepth(102);
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Button text
    const buttonText = this.add.text(
      buttonX + buttonWidth / 2,
      buttonY,
      'Continue →',
      {
        fontFamily: '"VT323", monospace',
        fontSize: '18px', // Increased for better readability
        color: '#FFFFFF',
        align: 'center'
      }
    );
    buttonText.setOrigin(0.5);
    buttonText.setDepth(103);
    
    // Click handler
    buttonBg.on('pointerdown', () => {
      this.continueToNextPage();
    });
    
    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x000000, 0.9);
    });
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x000000, 0.7);
    });
    
    this.continueButton = { bg: buttonBg, text: buttonText };
  }

  hideContinueButton() {
    if (this.continueButton) {
      this.continueButton.bg.destroy();
      this.continueButton.text.destroy();
      this.continueButton = null;
    }
  }

  continueToNextPage() {
    // Prevent multiple calls or calling while typing
    if (this.isTyping) {
      return;
    }
    
    // Make sure we have more pages
    if (this.currentPage >= this.textPages.length - 1) {
      return;
    }
    
    // Stop any existing typewriter sound before starting new page
    if (this.typewriterSound) {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.audioManager) {
        gameScene.audioManager.stopSFX(this.typewriterSound);
      }
      this.typewriterSound = null;
    }
    
    // Move to next page
    this.currentPage++;
    
    if (this.currentPage < this.textPages.length) {
      // Start typewriter for next page
      this.fullText = this.textPages[this.currentPage];
      this.displayedText = '';
      this.charIndex = 0;
      this.isTyping = true;
      this.hideContinueButton();
      
      // Clear existing text
      this.narrativeText.setText('');
      
      // Show cursor
      if (this.typewriterCursor) {
        this.typewriterCursor.setVisible(true);
        this.updateCursorPosition();
      }
      
      // Type character by character
      this.typewriterTimer = this.time.addEvent({
        delay: 16, // ms per character (20% faster: 20 * 0.8 = 16)
        callback: () => {
          // Check if we're still supposed to be typing (prevents race conditions)
          if (!this.isTyping || !this.typewriterTimer) {
            return;
          }
          
          if (this.charIndex < this.fullText.length) {
            this.displayedText += this.fullText[this.charIndex];
            this.narrativeText.setText(this.displayedText);
            this.charIndex++;
            
            // Update cursor position
            this.updateCursorPosition();
            
            // Play text sound (if available) - only on first character to start looping sound
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.audioManager && this.charIndex === 1) {
              // Start typewriter sound at 0:07, loop between 0:07 and 0:25 (18 seconds)
              // Use current SFX volume * 0.17 multiplier (typewriter is 17% of SFX volume)
              const typewriterVol = gameScene.audioManager.sfxVolume * 0.17;
              this.typewriterSound = gameScene.audioManager.playSFX('sfx-text', typewriterVol, 7, 7, 25);
            }
          } else {
            this.finishTypewriter();
          }
        },
        loop: true
      });
    } else {
      // Shouldn't happen, but handle gracefully
      console.warn('continueToNextPage called but no more pages');
      this.finishTypewriter();
    }
  }

  showChoices() {
    // CRITICAL: Only show choices if typewriter has finished and we're not typing
    if (!this.currentNode || !this.currentNode.choices || this.isTyping) {
      return;
    }
    
    // Don't show choices if reflection modal is open (for R1 node)
    if (this.currentNode.id === 'R1' && this.reflectionOverlay) {
      return;
    }
    
    // Make sure we've finished all pages
    if (this.currentPage < this.textPages.length - 1) {
      return;
    }
    
    // Typewriter is always visible (persistent element) - just recalculate paper area
    // Recalculate paper area position (in case screen was resized)
    if (this.typewriterSprite) {
      const scale = this.typewriterSprite.scaleX;
      const typewriterCenterX = this.typewriterSprite.x - (this.typewriterSprite.width * scale * 0.5);
      // Reduce paper area to ensure text fits - use smaller percentage
      const paperWidth = this.typewriterSprite.width * scale * 0.5; // Reduced from 0.6 to 0.5
      const paperHeight = this.typewriterSprite.height * scale * 0.35; // Reduced from 0.4 to 0.35
      
      this.typewriterPaperArea = {
        centerX: typewriterCenterX, // Center of typewriter (for reference)
        leftX: typewriterCenterX - paperWidth / 2, // Left edge of paper area
        y: this.typewriterSprite.y - (this.typewriterSprite.height * scale * 0.65), // Adjusted Y position
        width: paperWidth, // 50% of typewriter width
        height: paperHeight // 35% of typewriter height
      };
    }
    
    const paperArea = this.typewriterPaperArea;
    if (!paperArea) return;
    
    // Create a mask to clip text to paper area
    const paperMask = this.make.graphics();
    paperMask.fillStyle(0xffffff);
    paperMask.fillRect(
      paperArea.leftX,
      paperArea.y - paperArea.height / 2,
      paperArea.width,
      paperArea.height
    );
    const geometryMask = paperMask.createGeometryMask();
    
    // Calculate text positioning on paper - ensure it fits within bounds
    const textPadding = 20; // Increased padding to keep text well within paper edges
    // Use 85% of available width to ensure text never exceeds paper borders
    const maxTextWidth = Math.max(60, (paperArea.width - (textPadding * 2)) * 0.85);
    
    // Calculate vertical positioning - center text within paper height, moved up slightly
    // Account for choices that have both header and description (taller)
    const totalChoices = this.currentNode.choices.length;
    
    // Reduce spacing when there are many choices (5+) to fit everything on paper
    const baseLineHeight = totalChoices >= 5 ? 32 : 40; // Reduced spacing for many choices
    const descriptionHeight = totalChoices >= 5 ? 16 : 20; // Reduced description height for many choices
    
    // Calculate total height needed
    let totalTextHeight = 0;
    this.currentNode.choices.forEach((choice) => {
      // Check if choice has description (dash or parentheses)
      const hasDesc = /[—–-]/.test(choice.label) || /\(/.test(choice.label);
      totalTextHeight += baseLineHeight + (hasDesc ? descriptionHeight : 0);
    });
    totalTextHeight -= baseLineHeight; // Remove last spacing
    
    // Adjust start position - move up more when there are many choices
    const verticalOffset = totalChoices >= 5 ? 25 : 15; // More offset for many choices
    const startY = paperArea.y - (totalTextHeight / 2) - verticalOffset;
    let currentY = startY;
    
    // Display each choice as typewritten text on the paper
    this.currentNode.choices.forEach((choice, index) => {
      const y = currentY;
      
      // Format choice label: split by dash or parentheses
      // Handle em dash (—), en dash (–), regular dash (-), and parentheses
      // Note: Non-breaking hyphen (‑) is NOT used as separator - it keeps words together
      let firstPart = '';
      let secondPart = '';
      let hasDescription = false;
      
      // Special case: "Co - design community storytelling guidelines" pattern
      // Match "Co - design" or "Co-design" followed by lowercase text
      // Split so "Co-design" is the header and the rest is the description
      const coDesignMatch = choice.label.match(/^(Co\s*[-–—]?\s*design)\s+([a-z].+)$/i);
      if (coDesignMatch) {
        firstPart = 'Co-design'; // Normalize to "Co-design"
        secondPart = coDesignMatch[2].trim();
        hasDescription = true;
      } else if (choice.label.match(/Keep\s+refining/i)) {
        // Special case: "Keep refining through dialogue" pattern
        // Split so "Keep refining" is the header and "through dialogue" is the description
        const keepRefiningMatch = choice.label.match(/^(Keep\s+refining)\s+(.+)$/i);
        if (keepRefiningMatch) {
          firstPart = 'Keep refining';
          secondPart = keepRefiningMatch[2].trim();
          hasDescription = true;
        }
      } else if (choice.label.match(/^Facilitate/i)) {
        // Special case: "Facilitate collective inquiry" pattern
        // Split so "Facilitate" is the header and "collective inquiry" is the description
        const facilitateMatch = choice.label.match(/^(Facilitate)\s+(.+)$/i);
        if (facilitateMatch) {
          firstPart = 'Facilitate';
          secondPart = facilitateMatch[2].trim();
          hasDescription = true;
        }
      } else if (choice.label.match(/Shift\s+to\s+Collaborative/i)) {
        // Special case: "Shift to Collaborative co-design" pattern
        // Split so "Shift to Collaborative" is the header and "co-design" is the description
        const shiftMatch = choice.label.match(/^(Shift\s+to\s+Collaborative)\s+(.+)$/i);
        if (shiftMatch) {
          firstPart = 'Shift to Collaborative';
          secondPart = shiftMatch[2].trim();
          hasDescription = true;
        }
      } else if (choice.label.match(/^Acknowledge/i)) {
        // Special case: "Acknowledge the integrity failure" pattern
        // Split so "Acknowledge" is the header and "the integrity failure" is the description
        // Remove "switch to Prohibitive" or "(switch to Prohibitive)" if present
        const acknowledgeMatch = choice.label.match(/^Acknowledge\s+(.+)$/i);
        if (acknowledgeMatch) {
          firstPart = 'Acknowledge';
          // Extract description, removing any "switch to X" or "(switch to X)" suffix
          let desc = acknowledgeMatch[1].trim();
          // Remove "switch to X" at the end (with or without parentheses)
          desc = desc.replace(/\s*\(?\s*switch\s+to\s+\w+\s*\)?\s*$/i, '').trim();
          // Also remove standalone "switch to X" patterns
          desc = desc.replace(/\s+switch\s+to\s+\w+$/i, '').trim();
          secondPart = desc;
          hasDescription = true;
        }
      } else {
        // First check for dash separator (em dash, en dash, or regular dash)
        // Match various dash types: em dash (—), en dash (–), regular dash (-)
        // Note: Non-breaking hyphen (‑) is NOT included - it keeps words together
        const dashMatch = choice.label.match(/^(.+?)\s*[—–-]\s*(.+)$/);
        if (dashMatch) {
          firstPart = dashMatch[1].trim();
          secondPart = dashMatch[2].trim();
          hasDescription = true;
          
          // Debug: log parsing results for troubleshooting
          if (index === 0 && this.currentNode.id === 'D1') {
            console.log('D1 First Choice Parsing:', {
              label: choice.label,
              firstPart: firstPart,
              secondPart: secondPart,
              dashMatch: dashMatch
            });
          }
          
          // Safety check: ensure firstPart is not empty
          if (!firstPart || firstPart === '') {
            console.warn('Dash match found but firstPart is empty for label:', choice.label);
            // Fallback: use secondPart as firstPart if firstPart is empty
            if (secondPart) {
              firstPart = secondPart;
              secondPart = '';
              hasDescription = false;
            }
          }
        } else {
          // If no dash, check for parentheses (text in parentheses is always a description)
          const parenMatch = choice.label.match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (parenMatch) {
          firstPart = parenMatch[1].trim();
          secondPart = parenMatch[2].trim();
          hasDescription = true;
        } else {
          // Special case: "Partner with the [Capitalized Words]" pattern
          // Split at "the" when followed by capitalized words (can include lowercase after first letter) or placeholder
          const theMatch = choice.label.match(/^(.+?\sthe)\s+([A-Z][A-Za-z\s]+|\{\{[^}]+\}\})$/);
          if (theMatch) {
            firstPart = theMatch[1].trim();
            secondPart = theMatch[2].trim();
            hasDescription = true;
          } else {
            // No dash or parentheses found - check if label is too long and needs splitting
            const label = choice.label;
            
            // Check both character length and visual width
            // Labels longer than 30 characters or that would exceed paper width should be split
            const labelLength = label.length;
            const testHeader = `- ${label} -`;
            const tempText = this.add.text(0, 0, testHeader, {
              font: 'bold 24px "VT323", monospace',
              wordWrap: { width: maxTextWidth, useAdvancedWrap: true }
            });
            const headerWidth = tempText.width;
            tempText.destroy();
            
            // Split if label is longer than 30 characters OR exceeds 80% of max width
            if (labelLength > 30 || headerWidth > maxTextWidth * 0.8) {
              // Try to split at natural break points:
              // 1. After a capitalized word (e.g., "Document Lessons" -> "for campus colleagues")
              // 2. After common prepositions (for, with, to, etc.)
              // 3. At a reasonable length (around 20-25 characters)
              
              // Pattern 1: Split after common prepositions (for, with, to, from, etc.)
              // This handles cases like "Document lessons for campus colleagues"
              const prepMatch = label.match(/^(.+?)\s+(for|with|to|from|at|in|on|by)\s+(.+)$/i);
              if (prepMatch) {
                // Capitalize first letter of each word in the header part
                const headerWords = prepMatch[1].trim().split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                );
                firstPart = headerWords.join(' ');
                secondPart = (prepMatch[2] + ' ' + prepMatch[3]).trim();
                hasDescription = true;
              } else {
                // Pattern 2: Split after second word (e.g., "Invite collaborative" -> "reflection circle")
                // Capitalize the words in the header
                const words = label.split(' ');
                if (words.length >= 3) {
                  // Take first 2 words for header, rest for description
                  const headerWords = words.slice(0, 2).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  );
                  firstPart = headerWords.join(' ');
                  secondPart = words.slice(2).join(' ');
                  hasDescription = true;
                } else {
                  // Pattern 3: Split at approximately 25 characters, trying to break at word boundary
                  let headerWords = [];
                  let descWords = [];
                  const targetLength = 25;
                  
                  for (let i = 0; i < words.length; i++) {
                    const testLength = headerWords.join(' ').length + (headerWords.length > 0 ? 1 : 0) + words[i].length;
                    if (testLength <= targetLength || headerWords.length === 0) {
                      headerWords.push(words[i]);
                    } else {
                      descWords = words.slice(i);
                      break;
                    }
                  }
                  
                  if (descWords.length > 0) {
                    // Capitalize header words
                    const capitalizedHeader = headerWords.map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    );
                    firstPart = capitalizedHeader.join(' ');
                    secondPart = descWords.join(' ');
                    hasDescription = true;
                  } else {
                    // Couldn't split intelligently, use entire label as header
                    firstPart = label;
                    hasDescription = false;
                  }
                }
              }
            } else {
              // Label is short enough, use as header only
              firstPart = label;
              hasDescription = false;
            }
          }
        }
      }
      } // Close coDesignMatch else block
      
      // Typewritten text style - lines within each option close together, spacing between options
      const textX = paperArea.centerX - 12; // Shift left 12px for better centering on paper
      
      // Safety check: ensure firstPart is not empty
      if (!firstPart || firstPart.trim() === '') {
        // Fallback: use entire label as header if parsing failed
        firstPart = choice.label;
        hasDescription = false;
        secondPart = '';
      }
      
      // Always wrap header in hyphens (like first node: "- Header -")
      const headerText = `- ${firstPart} -`;
      // Center header vertically if no description, otherwise position above center
      const headerY = hasDescription ? y - 8 : y;
      const headerTextObj = this.add.text(
        textX,
        headerY,
        headerText,
        {
          fontFamily: '"VT323", monospace',
          fontSize: '20px', // Reduced from 24px to fit within paper
          fontStyle: 'bold', // Explicitly set bold for headers
          color: '#000000', // Darker black for bold appearance
          align: 'center',
          wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
          fontWeight: 'bold' // Additional weight specification
        }
      );
      headerTextObj.setOrigin(0.5, 0.5);
      headerTextObj.setDepth(105);
      headerTextObj.setVisible(true); // Ensure it's visible
      headerTextObj.setAlpha(1); // Ensure it's not transparent
      headerTextObj.setMask(geometryMask);
      
      // Create regular description text (second part)
      let descriptionTextObj = null;
      if (secondPart) {
        descriptionTextObj = this.add.text(
          textX,
          y + 8, // Position slightly below center for the description
          secondPart,
          {
            fontFamily: '"VT323", monospace',
            fontSize: '16px', // Reduced from 18px to fit within paper
            fontStyle: 'normal', // Explicitly set normal (not bold) for descriptions
            color: '#1a1a1a',
            align: 'center',
            wordWrap: { width: maxTextWidth, useAdvancedWrap: true }
          }
        );
        descriptionTextObj.setOrigin(0.5, 0.5);
        descriptionTextObj.setDepth(105);
        descriptionTextObj.setMask(geometryMask);
      }
      
      // Update currentY for next choice - add spacing based on whether this choice has description
      currentY += baseLineHeight + (hasDescription ? descriptionHeight : 0);
      
      // Store both text objects for hit area calculation
      const textObjects = [headerTextObj, descriptionTextObj].filter(obj => obj !== null);
      
      // Create clickable hit area for the text
      this.time.delayedCall(10, () => {
        // Calculate combined bounds of all text objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        textObjects.forEach(textObj => {
          const bounds = textObj.getBounds();
          minX = Math.min(minX, bounds.x);
          minY = Math.min(minY, bounds.y);
          maxX = Math.max(maxX, bounds.x + bounds.width);
          maxY = Math.max(maxY, bounds.y + bounds.height);
        });
        
        const hitAreaWidth = (maxX - minX) + 10; // Add padding
        const hitAreaHeight = (maxY - minY) + 8; // Add padding
        const hitAreaX = (minX + maxX) / 2;
        const hitAreaY = (minY + maxY) / 2;
        
        const hitArea = this.add.rectangle(
          hitAreaX,
          hitAreaY,
          hitAreaWidth,
          hitAreaHeight,
          0x000000,
          0 // Transparent
        );
        hitArea.setOrigin(0.5, 0.5);
        hitArea.setDepth(200); // Very high depth to ensure clickability
        hitArea.setInteractive({ useHandCursor: true });
        
        // Hover effect - very subtle transparent shadow behind text
        // Shadow is consistently applied to all text objects (header and description) with same settings
        hitArea.on('pointerover', () => {
          textObjects.forEach(textObj => {
            // Add very subtle, almost transparent shadow behind letters
            // Same shadow settings for all choices to ensure consistency
            textObj.setShadow(0.5, 0.5, '#CCCCCC', 1, true, true); // Very light gray, minimal offset, minimal blur
          });
          
          const gameScene = this.scene.get('GameScene');
          if (gameScene && gameScene.audioManager) {
            gameScene.audioManager.playSFX('sfx-click', 0.2);
          }
        });
        hitArea.on('pointerout', () => {
          textObjects.forEach(textObj => {
            // Remove shadow when not hovering
            textObj.setShadow(0, 0, 'transparent', 0);
          });
        });
        
        // Click handler
        hitArea.on('pointerdown', () => {
          this.selectChoice(choice.to);
        });
        
        // Store reference for cleanup
        this.choiceButtons.push({
          button: hitArea,
          text: textObjects // Store array of text objects
        });
        
        // Animate in with typewriter effect (staggered)
        textObjects.forEach(textObj => textObj.setAlpha(0));
        hitArea.setAlpha(0);
        this.tweens.add({
          targets: [...textObjects, hitArea],
          alpha: 1,
          duration: 200,
          delay: index * 150, // Stagger appearance
          ease: 'Power2'
        });
      });
    });
    
    // Add resources button if node has resources
    if (this.currentNode.resources && this.currentNode.resources.length > 0) {
      this.showResourcesButton();
    }
  }

  showResourcesButton() {
    const width = this.cameras.main.width;
    const titleHeight = 40;
    const dialogueBoxHeight = 135; // Reduced by 25% from 180
    const titleY = 20;
    const boxY = titleY + titleHeight + dialogueBoxHeight / 2; // Center Y of dialogue box (same as createDialogueBox)
    const dialogueBoxBottom = boxY + dialogueBoxHeight / 2; // Bottom edge of centered dialogue box
    
    // Resources button positioned between dialogue box and first choice
    const buttonWidth = 120;
    const buttonHeight = 35;
    const buttonX = width / 2; // Center X
    const resourcesButtonSpacing = 20; // Space between dialogue box and resources button
    const buttonY = dialogueBoxBottom + resourcesButtonSpacing; // Positioned below dialogue box with spacing
    
    // Button background (black with 50% transparency) - centered
    const buttonBg = this.add.rectangle(
      buttonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x000000,
      0.5
    );
    buttonBg.setOrigin(0.5, 0.5); // Center the rectangle
    buttonBg.setStrokeStyle(2, 0xFFFFFF, 0.8);
    buttonBg.setDepth(103);
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Button text
    const buttonText = this.add.text(
      buttonX,
      buttonY,
      '📚 Resources',
      {
        fontFamily: '"VT323", monospace',
        fontSize: '18px', // Increased from 12px for better readability
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    );
    buttonText.setOrigin(0.5, 0.5);
    buttonText.setDepth(104);
    
    // Click handlers
    const clickHandler = () => this.showResourcesModal();
    buttonBg.on('pointerdown', clickHandler);
    buttonText.setInteractive({ useHandCursor: true });
    buttonText.on('pointerdown', clickHandler);
    
    // Hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x000000, 0.7);
      buttonBg.setStrokeStyle(2, 0xFFFFFF, 1);
    });
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x000000, 0.5);
      buttonBg.setStrokeStyle(2, 0xFFFFFF, 0.8);
    });
    
    this.choiceButtons.push({ button: buttonBg, text: buttonText });
  }

  showResourcesModal() {
    // Don't show if already open
    if (this.resourcesOverlay) {
      return;
    }
    
    // Create DOM overlay for resources modal (matching reflection modal design)
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'resources-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    // Prevent clicks from passing through to the game
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        // Only close if clicking directly on overlay, not on modal
        this.closeResourcesModal();
      }
    };
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'resources-modal';
    modal.style.cssText = `
      background: #D4A574;
      border: 4px solid #000000;
      border-radius: 8px;
      padding: 30px;
      max-width: ${width - 100}px;
      max-height: ${height - 100}px;
      width: 90%;
      overflow-y: auto;
      position: relative;
    `;
    
    // Prevent clicks on modal from closing it
    modal.onclick = (e) => {
      e.stopPropagation();
    };
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Resources for this section';
    title.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 20px;
      text-align: center;
    `;
    
    // Resources list container
    const resourcesList = document.createElement('div');
    resourcesList.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';
    
    // Resources list
    this.currentNode.resources.forEach((resource, index) => {
      const resourceItem = document.createElement('div');
      resourceItem.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
      
      // Resource label (clickable link)
      const resourceLink = document.createElement('a');
      resourceLink.href = resource.url;
      resourceLink.target = '_blank';
      resourceLink.textContent = `${index + 1}. ${resource.label}`;
      resourceLink.style.cssText = `
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: bold;
        color: #000000;
        text-decoration: none;
        cursor: pointer;
        word-wrap: break-word;
      `;
      resourceLink.onmouseover = () => resourceLink.style.textDecoration = 'underline';
      resourceLink.onmouseout = () => resourceLink.style.textDecoration = 'none';
      
      resourceItem.appendChild(resourceLink);
      
      // Resource description (if exists)
      if (resource.why) {
        const whyText = document.createElement('p');
        whyText.textContent = resource.why;
        whyText.style.cssText = `
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #2C1810;
          margin: 0;
          word-wrap: break-word;
        `;
        resourceItem.appendChild(whyText);
      }
      
      resourcesList.appendChild(resourceItem);
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 30px;
      color: #000000;
      cursor: pointer;
      width: 40px;
      height: 40px;
      line-height: 30px;
      padding: 0;
    `;
    closeBtn.onclick = () => this.closeResourcesModal();
    
    // Assemble modal
    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(resourcesList);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Store reference for cleanup
    this.resourcesOverlay = overlay;
  }

  closeResourcesModal() {
    if (this.resourcesOverlay) {
      this.resourcesOverlay.remove();
      this.resourcesOverlay = null;
    }
  }

  showReflectionModal() {
    console.log('showReflectionModal called');
    // Don't show if already open
    if (this.reflectionOverlay) {
      console.log('Reflection modal already open');
      return;
    }
    
    // Create DOM overlay for reflection form (Phaser doesn't have native text inputs)
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'reflection-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    // Prevent clicks from passing through to the game
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        // Only close if clicking directly on overlay, not on modal
        this.closeReflectionModal();
      }
    };
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'reflection-modal';
    modal.style.cssText = `
      background: #D4A574;
      border: 4px solid #000000;
      border-radius: 8px;
      padding: 30px;
      max-width: ${width - 100}px;
      max-height: ${height - 100}px;
      width: 90%;
      overflow-y: auto;
      position: relative;
    `;
    
    // Title
    const title = document.createElement('h2');
    title.textContent = '📝 Share Your Reflection (Optional)';
    title.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 10px;
      text-align: center;
    `;
    
    // Description
    const description = document.createElement('p');
    description.textContent = 'Help us improve this application by sharing your insights. Your response will be sent to the organizers.';
    description.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #2C1810;
      margin-bottom: 20px;
      text-align: center;
    `;
    
    // Form container
    const form = document.createElement('div');
    form.id = 'reflection-form';
    form.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
    
    // Question 1: What did you protect?
    const q1Container = this.createQuestionField('protected', 'What did you protect?', 'e.g., Academic integrity, student trust...');
    form.appendChild(q1Container);
    
    // Question 2: What did you risk?
    const q2Container = this.createQuestionField('risked', 'What did you risk?', 'e.g., Student engagement, workload...');
    form.appendChild(q2Container);
    
    // Question 3: What did you learn?
    const q3Container = this.createQuestionField('learned', 'What did you learn?', 'e.g., The importance of dialogue...');
    form.appendChild(q3Container);
    
    // Question 4: What is one concrete next step?
    const q4Container = this.createQuestionField('nextStep', 'What is one concrete next step?', 'e.g., Add AI literacy unit to my syllabus...');
    form.appendChild(q4Container);
    
    // Send button
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: bold;
      color: #FFFFFF;
      background: #000000;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      align-self: center;
      min-width: 120px;
    `;
    sendBtn.onmouseover = () => sendBtn.style.background = '#333333';
    sendBtn.onmouseout = () => sendBtn.style.background = '#000000';
    sendBtn.onclick = () => this.submitReflection();
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 30px;
      color: #000000;
      cursor: pointer;
      width: 40px;
      height: 40px;
      line-height: 30px;
      padding: 0;
    `;
    closeBtn.onclick = () => this.closeReflectionModal();
    
    // Thank you message (hidden initially)
    const thanksDiv = document.createElement('div');
    thanksDiv.id = 'reflection-thanks';
    thanksDiv.style.cssText = 'display: none; text-align: center; padding: 20px;';
    thanksDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
      <h3 style="font-family: 'Inter', sans-serif; font-size: 22px; font-weight: bold; color: #000000; margin-bottom: 10px;">Thank You!</h3>
      <p style="font-family: 'Inter', sans-serif; font-size: 14px; color: #2C1810;">Your reflection has been sent.</p>
    `;
    
    // Assemble modal
    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(form);
    modal.appendChild(sendBtn);
    modal.appendChild(thanksDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Prevent clicks on modal from closing it
    modal.onclick = (e) => {
      e.stopPropagation();
    };
    
    // Store reference for cleanup
    this.reflectionOverlay = overlay;
    
    console.log('Reflection modal created and displayed');
  }

  createQuestionField(id, label, placeholder) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: #000000;
    `;
    
    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.placeholder = placeholder;
    textarea.rows = 3;
    textarea.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #000000;
      background: #F5E6D3;
      border: 2px solid #000000;
      border-radius: 4px;
      padding: 10px;
      resize: vertical;
      width: 100%;
      box-sizing: border-box;
    `;
    
    container.appendChild(labelEl);
    container.appendChild(textarea);
    return container;
  }

  async submitReflection() {
    const protectedVal = document.getElementById('protected')?.value || '';
    const riskedVal = document.getElementById('risked')?.value || '';
    const learnedVal = document.getElementById('learned')?.value || '';
    const nextStepVal = document.getElementById('nextStep')?.value || '';
    
    // At least one field must be filled
    if (!protectedVal && !riskedVal && !learnedVal && !nextStepVal) {
      alert('Please fill in at least one reflection field.');
      return;
    }
    
    const form = document.getElementById('reflection-form');
    const sendBtn = form?.nextElementSibling;
    const thanksDiv = document.getElementById('reflection-thanks');
    
    // Disable button during submission
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
    }
    
    try {
      // Build email body
      let emailBody = 'AI Pathway Feedback\n\n';
      if (protectedVal) emailBody += `What did you protect?\n${protectedVal}\n\n`;
      if (riskedVal) emailBody += `What did you risk?\n${riskedVal}\n\n`;
      if (learnedVal) emailBody += `What did you learn?\n${learnedVal}\n\n`;
      if (nextStepVal) emailBody += `What is one concrete next step?\n${nextStepVal}\n\n`;
      
      // Use EmailJS to send email automatically
      // Configuration: EmailJS service credentials
      const serviceId = 'service_skkvtpg';
      const templateId = 'template_jpszbkw';
      const publicKey = 'CO_pAmc94eFPHWu3n';
      
      // Get email config from nodeManager
      const gameScene = this.scene.get('GameScene');
      const emailConfig = gameScene?.nodeManager?.config?.email || {};
      const toEmail = (emailConfig.primaryRecipient || '').trim();
      const ccEmail = (emailConfig.ccRecipient || '').trim();
      // From email is set in EmailJS template, not from config
      
      // Validate email format (basic check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      // Check if primary recipient is configured and valid
      if (!toEmail || !emailRegex.test(toEmail)) {
        alert('Email recipient not configured or invalid. Please restart the game and configure email settings in the customization modal (expand "Who should receive reflections?" section).');
        // Re-enable button
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
        return;
      }
      
      // Validate CC email if provided
      if (ccEmail && !emailRegex.test(ccEmail)) {
        alert('CC recipient email is invalid. Please check the email format in the customization settings.');
        // Re-enable button
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
        return;
      }
      
      // Check if EmailJS is configured and available
      if (typeof emailjs !== 'undefined' && serviceId !== 'YOUR_SERVICE_ID') {
        try {
          // Initialize EmailJS (only needs to be done once, but safe to call multiple times)
          if (!emailjs.init) {
            console.error('EmailJS library not loaded correctly');
            throw new Error('EmailJS library not available');
          }
          
          emailjs.init(publicKey);
          
          console.log('Sending email via EmailJS with:', { serviceId, templateId, toEmail, ccEmail });
          console.log('Email config from nodeManager:', emailConfig);
          
          // Double-check email is not empty before sending (safety check)
          if (!toEmail || toEmail.trim() === '') {
            throw new Error('Recipient email address is empty. Please configure email settings in the customization modal.');
          }
          
          // Build email parameters - only include ccEmail if provided
          // Note: from_email is set in EmailJS template configuration, not here
          // IMPORTANT: EmailJS template must have "To Email" field set to {{email}} in the dashboard
          // IMPORTANT: EmailJS template must have "Cc" field set to {{email_cc}} in the dashboard (if using CC)
          const emailParams = {
            email: toEmail.trim(), // Template uses {{email}}, not {{to_email}}
            subject: 'AI Pathway Feedback',
            message: emailBody,
            protected: protectedVal || '(not provided)',
            risked: riskedVal || '(not provided)',
            learned: learnedVal || '(not provided)',
            next_step: nextStepVal || '(not provided)'
          };
          
          // Only add CC if provided and valid
          if (ccEmail && ccEmail.trim() !== '') {
            emailParams.email_cc = ccEmail.trim(); // Template uses {{email_cc}}, not {{to_email_cc}}
          }
          
          // Log the exact parameters being sent
          console.log('EmailJS parameters being sent:', emailParams);
          
          // Send email using EmailJS
          const response = await emailjs.send(serviceId, templateId, emailParams);
          
            console.log('Reflection email sent successfully via EmailJS', response);
        } catch (emailError) {
          console.error('EmailJS error details:', emailError);
          
          // Provide specific error messages based on error type
          let errorMessage = 'There was an error sending your reflection.';
          
          if (emailError.text) {
            if (emailError.text.includes('template ID not found')) {
              errorMessage = 'Email template not found. Please verify the template ID in EmailJS dashboard and update the code.';
            } else if (emailError.text.includes('recipients address is empty') || emailError.text.includes('recipient')) {
              // This error usually means the EmailJS template "To Email" field is not set to {{email}}
              errorMessage = 'EmailJS template configuration error: The "To Email" field in your EmailJS template must be set to {{email}} (not a static email address). Please check your EmailJS template settings.';
            } else {
              errorMessage = `Error sending email: ${emailError.text}. Please check your EmailJS configuration.`;
            }
          } else if (emailError.message) {
            errorMessage = emailError.message;
          }
          
          alert(errorMessage);
          
          // Re-enable button
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
          }
          
          // Don't re-throw - we've already handled the error with a user-friendly message
          return;
        }
      } else {
        // Fallback: Use mailto if EmailJS is not configured
        console.warn('EmailJS not configured, using mailto fallback');
        
        // Check if email is configured for mailto fallback
        if (!toEmail || toEmail.trim() === '') {
          alert('Email recipient not configured. Please restart the game and configure email settings in the customization modal (expand "Who should receive reflections?" section).');
          // Re-enable button
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
          }
          return;
        }
        
        const subject = encodeURIComponent('AI Pathway Feedback');
        const body = encodeURIComponent(emailBody);
        
        // Build mailto URL with configured recipients
        let mailtoUrl = `mailto:${toEmail.trim()}`;
        if (ccEmail && ccEmail.trim() !== '') {
          mailtoUrl += `,${ccEmail.trim()}`;
        }
        mailtoUrl += `?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoUrl;
        
        // Re-enable button since mailto opens email client
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
        return;
      }
      
      // Show thank you message
      if (form) form.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'none';
      if (thanksDiv) thanksDiv.style.display = 'block';
      
      // Auto-close after 3 seconds, then show credits
      setTimeout(() => {
        this.closeReflectionModal();
        // Show credits scene after closing modal
        this.showCreditsScene();
      }, 3000);
      
    } catch (error) {
      console.error('Error sending reflection email:', error);
      
      // Only show generic error if it's not an EmailJS error (those are handled above)
      // Check if error is from EmailJS or if it's a different type of error
      if (!error.text && !error.message?.includes('EmailJS')) {
        alert('There was an unexpected error sending your reflection. Please try again.');
      }
      // If it's an EmailJS error that wasn't caught above, it will have been handled
      
      // Re-enable button
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }
  }

  closeReflectionModal() {
    console.log('closeReflectionModal called');
    if (this.reflectionOverlay) {
      this.reflectionOverlay.remove();
      this.reflectionOverlay = null;
    }
    // Show choices after closing reflection modal
    if (this.currentNode && this.currentNode.choices && this.currentNode.choices.length > 0) {
      this.showChoices();
    }
  }

  clearChoices() {
    this.choiceButtons.forEach((choice) => {
      if (choice.button) choice.button.destroy();
      // Handle both single text object and array of text objects
      if (choice.text) {
        if (Array.isArray(choice.text)) {
          choice.text.forEach(textObj => {
            if (textObj) textObj.destroy();
          });
        } else {
          choice.text.destroy();
        }
      }
    });
    this.choiceButtons = [];
    
    // Cancel any pending delayed call to show choices
    if (this.showChoicesTimer) {
      this.time.removeEvent(this.showChoicesTimer);
      this.showChoicesTimer = null;
    }
    
    // Also hide continue button when clearing choices
    this.hideContinueButton();
    
    // Typewriter is persistent - always visible, don't hide it
    // Reset hover counter and hide fade overlay
    this.hoveredChoiceCount = 0;
    if (this.fadeOverlay && this.fadeOverlay.visible) {
      this.tweens.killTweensOf(this.fadeOverlay);
      this.fadeOverlay.setAlpha(0);
      this.fadeOverlay.setVisible(false);
    }
  }

  selectChoice(nextNodeId) {
    console.log('Selected choice, going to node:', nextNodeId);
    
    // Play click sound
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.audioManager) {
      gameScene.audioManager.playSFX('sfx-click', 0.5);
    }
    
    // Clear choices
    this.clearChoices();
    
    // If the choice is to restart (go to D1), show credits scene instead
    if (nextNodeId === 'D1') {
      this.showCreditsScene();
    } else {
      // Tell GameScene to change node
      gameScene.events.emit('changeNode', nextNodeId);
    }
  }

  createVolumePanel(width, height, padding) {
    // Use cloud sprite as panel background
    // Position on far left to avoid covering character (character is at 32% from left)
    const panelX = padding + 120; // Smaller offset to keep it on far left
    const panelY = height - padding - 20 - 80; // Moved down (was -120, now -80)
    
    // Create cloud sprite - scale it to appropriate size for the panel
    const panelBg = this.add.image(panelX, panelY, 'cloud');
    panelBg.setOrigin(0.5, 0.5);
    panelBg.setDepth(111);
    panelBg.setVisible(false);
    
    // Scale cloud to fit content (slightly larger to accommodate elements)
    // Wait for sprite to load, then scale
    this.time.delayedCall(50, () => {
      if (panelBg && panelBg.width && panelBg.height) {
        const targetWidth = 260; // Increased from 240
        const targetHeight = 200; // Increased from 180
        const spriteWidth = panelBg.width;
        const spriteHeight = panelBg.height;
        const scaleX = targetWidth / spriteWidth;
        const scaleY = targetHeight / spriteHeight;
        panelBg.setScale(Math.min(scaleX, scaleY)); // Use smaller scale to fit inside cloud
        console.log(`Cloud sprite scaled: ${spriteWidth}x${spriteHeight} -> scale ${Math.min(scaleX, scaleY)}`);
      } else {
        console.warn('Cloud sprite dimensions not available:', panelBg);
      }
    });
    
    // Store actual panel dimensions for positioning elements
    const panelWidth = 260;
    const panelHeight = 200;
    
    // Music slider - positioned inside cloud, more compact
    const musicY = panelY - 20; // Closer to center
    // Music slider track - shortened by half, centered horizontally in cloud
    const sliderWidth = 48; // Half of 95
    const sliderX = panelX - sliderWidth / 2 + 10; // Moved 10px to the right for better centering
    
    // Music label - positioned closer to slider, moved right, white with black outline
    const musicLabel = this.add.text(panelX - sliderWidth / 2 + 2, musicY, 'Music', {
      fontFamily: '"VT323", monospace',
      fontSize: '9px',
      color: '#FFFFFF', // White text
      stroke: '#000000', // Black outline
      strokeThickness: 4 // Thick outline
    });
    musicLabel.setOrigin(1, 0.5); // Right-aligned so it ends before the slider
    musicLabel.setDepth(112);
    musicLabel.setVisible(false);
    
    const sliderTrack = this.add.rectangle(panelX + 10, musicY, sliderWidth, 3, 0x555555); // Moved 10px right
    sliderTrack.setDepth(112);
    sliderTrack.setVisible(false);
    sliderTrack.setInteractive({ useHandCursor: true });
    
    // Music slider handle - square, white with thick black outline
    const gameScene = this.scene.get('GameScene');
    const musicVolume = gameScene && gameScene.audioManager ? gameScene.audioManager.musicVolume : 0.144;
    const musicHandleX = sliderX + (musicVolume * sliderWidth);
    const musicHandle = this.add.rectangle(musicHandleX, musicY, 12, 12, 0xFFFFFF); // White square
    musicHandle.setStrokeStyle(3, 0x000000, 1); // Thick black outline
    musicHandle.setDepth(113);
    musicHandle.setVisible(false);
    musicHandle.setInteractive({ useHandCursor: true });
    
    // Music + button - positioned closer to slider (minus button removed)
    const musicPlus = this.add.text(sliderX + sliderWidth + 6, musicY, '+', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#000000' // Black text for white cloud
    });
    musicPlus.setOrigin(0.5, 0.5);
    musicPlus.setDepth(112);
    musicPlus.setVisible(false);
    musicPlus.setInteractive({ useHandCursor: true });
    
    // SFX slider - positioned lower, much closer to music
    const sfxY = panelY + 5; // Much closer to music slider (reduced from +15)
    
    // SFX label - positioned closer to slider, moved right, white with black outline
    const sfxLabel = this.add.text(panelX - sliderWidth / 2 + 2, sfxY, 'Sfx', {
      fontFamily: '"VT323", monospace',
      fontSize: '9px',
      color: '#FFFFFF', // White text
      stroke: '#000000', // Black outline
      strokeThickness: 4 // Thick outline
    });
    sfxLabel.setOrigin(1, 0.5); // Right-aligned so it ends before the slider
    sfxLabel.setDepth(112);
    sfxLabel.setVisible(false);
    
    // SFX slider track - same width as music, moved right
    const sfxSliderTrack = this.add.rectangle(panelX + 10, sfxY, sliderWidth, 3, 0x555555); // Moved 10px right
    sfxSliderTrack.setDepth(112);
    sfxSliderTrack.setVisible(false);
    sfxSliderTrack.setInteractive({ useHandCursor: true });
    
    // SFX slider handle - square, white with thick black outline
    const sfxVolume = gameScene && gameScene.audioManager ? gameScene.audioManager.sfxVolume : 0.5;
    const sfxHandleX = sliderX + (sfxVolume * sliderWidth);
    const sfxHandle = this.add.rectangle(sfxHandleX, sfxY, 12, 12, 0xFFFFFF); // White square
    sfxHandle.setStrokeStyle(3, 0x000000, 1); // Thick black outline
    sfxHandle.setDepth(113);
    sfxHandle.setVisible(false);
    sfxHandle.setInteractive({ useHandCursor: true });
    
    // SFX + button (minus button removed)
    const sfxPlus = this.add.text(sliderX + sliderWidth + 6, sfxY, '+', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#000000' // Black text for white cloud
    });
    sfxPlus.setOrigin(0.5, 0.5);
    sfxPlus.setDepth(112);
    sfxPlus.setVisible(false);
    sfxPlus.setInteractive({ useHandCursor: true });
    
    // Store panel elements
    this.volumePanel = {
      bg: panelBg,
      musicLabel,
      musicTrack: sliderTrack,
      musicHandle,
      musicPlus,
      sfxLabel,
      sfxTrack: sfxSliderTrack,
      sfxHandle,
      sfxPlus,
      sliderX,
      sliderWidth,
      musicY,
      sfxY
    };
    
    // Set up interactions
    this.setupVolumeSliderInteractions();
  }
  
  setupVolumeSliderInteractions() {
    const panel = this.volumePanel;
    const gameScene = this.scene.get('GameScene');
    
    if (!gameScene || !gameScene.audioManager) return;
    
    const audioManager = gameScene.audioManager;
    
    // Music slider drag
    let isDraggingMusic = false;
    panel.musicHandle.on('pointerdown', (pointer) => {
      isDraggingMusic = true;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (isDraggingMusic && panel.musicHandle.visible) {
        const newX = Phaser.Math.Clamp(pointer.x, panel.sliderX, panel.sliderX + panel.sliderWidth);
        panel.musicHandle.x = newX;
        const volume = (newX - panel.sliderX) / panel.sliderWidth;
        audioManager.setMusicVolume(volume);
      }
    });
    
    this.input.on('pointerup', () => {
      isDraggingMusic = false;
    });
    
    // Music track click to jump
    panel.musicTrack.on('pointerdown', (pointer) => {
      const localX = pointer.x - panel.sliderX;
      const volume = Phaser.Math.Clamp(localX / panel.sliderWidth, 0, 1);
      audioManager.setMusicVolume(volume);
      panel.musicHandle.x = panel.sliderX + (volume * panel.sliderWidth);
    });
    
    // Music + button
    panel.musicPlus.on('pointerdown', () => {
      const currentVol = audioManager.musicVolume;
      const newVol = Math.min(1, currentVol + 0.1);
      audioManager.setMusicVolume(newVol);
      panel.musicHandle.x = panel.sliderX + (newVol * panel.sliderWidth);
    });
    
    // SFX slider drag
    let isDraggingSFX = false;
    panel.sfxHandle.on('pointerdown', (pointer) => {
      isDraggingSFX = true;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (isDraggingSFX && panel.sfxHandle.visible) {
        const newX = Phaser.Math.Clamp(pointer.x, panel.sliderX, panel.sliderX + panel.sliderWidth);
        panel.sfxHandle.x = newX;
        const volume = (newX - panel.sliderX) / panel.sliderWidth;
        audioManager.setSFXVolume(volume);
        // Update typewriter sound volume if it's playing
        if (this.typewriterSound && this.typewriterSound.isPlaying) {
          this.typewriterSound.setVolume(volume * 0.17); // Typewriter uses 0.17 of SFX volume
        }
      }
    });
    
    this.input.on('pointerup', () => {
      isDraggingSFX = false;
    });
    
    // SFX track click to jump
    panel.sfxTrack.on('pointerdown', (pointer) => {
      const localX = pointer.x - panel.sliderX;
      const volume = Phaser.Math.Clamp(localX / panel.sliderWidth, 0, 1);
      audioManager.setSFXVolume(volume);
      panel.sfxHandle.x = panel.sliderX + (volume * panel.sliderWidth);
      // Update typewriter sound volume if it's playing
      // Typewriter should be 0.17 when SFX is at 1.0, so scale proportionally
      if (this.typewriterSound && this.typewriterSound.isPlaying) {
        this.typewriterSound.setVolume(volume * 0.17);
      }
    });
    
    // SFX + button
    panel.sfxPlus.on('pointerdown', () => {
      const currentVol = audioManager.sfxVolume;
      const newVol = Math.min(1, currentVol + 0.1);
      audioManager.setSFXVolume(newVol);
      panel.sfxHandle.x = panel.sliderX + (newVol * panel.sliderWidth);
      // Update typewriter sound volume if it's playing
      if (this.typewriterSound && this.typewriterSound.isPlaying) {
        this.typewriterSound.setVolume(newVol * 0.17); // Typewriter uses 0.17 of SFX volume
      }
    });
    
    // Hover effects
    [panel.musicPlus, panel.sfxPlus].forEach(btn => {
      btn.on('pointerover', () => {
        btn.setColor('#66B0FF'); // Blue on hover
      });
      btn.on('pointerout', () => {
        btn.setColor('#000000'); // Black when not hovering
      });
    });
  }
  
  toggleVolumePanel() {
    this.volumePanelVisible = !this.volumePanelVisible;
    
    if (!this.volumePanel) return;
    
    const panel = this.volumePanel;
    const gameScene = this.scene.get('GameScene');
    
    // Update slider positions based on current volumes
    if (gameScene && gameScene.audioManager) {
      const audioManager = gameScene.audioManager;
      panel.musicHandle.x = panel.sliderX + (audioManager.musicVolume * panel.sliderWidth);
      panel.sfxHandle.x = panel.sliderX + (audioManager.sfxVolume * panel.sliderWidth);
    }
    
    // Show/hide all panel elements
    const elements = [
      panel.bg, panel.musicLabel, panel.musicTrack, panel.musicHandle,
      panel.musicPlus, panel.sfxLabel, panel.sfxTrack, panel.sfxHandle,
      panel.sfxPlus
    ];
    
    elements.forEach(element => {
      element.setVisible(this.volumePanelVisible);
    });
    
    // Update audio button icon based on mute state
    if (gameScene && gameScene.audioManager) {
      const isMuted = gameScene.audioManager.isMuted;
      this.audioButton.setText(isMuted ? '🔇' : '🔊');
    }
  }

  restart() {
    console.log('Restarting game...');
    
    // Show credits scene first, then customization modal after credits
    this.showCreditsScene();
  }
  
  showCreditsScene() {
    // Use camera fade to smoothly transition to black
    const gameScene = this.scene.get('GameScene');
    
    // Fade out both scenes simultaneously
    if (gameScene) {
      gameScene.cameras.main.fadeOut(1000, 0, 0, 0);
    }
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    // When fade completes, start credits scene
    this.cameras.main.once('camerafadeoutcomplete', () => {
      console.log('Fade to black complete, starting credits scene');
      this.scene.start('CreditsScene');
    });
  }

  showCustomizationModal() {
    console.log('showCustomizationModal called');
    // Don't show if already open
    if (document.getElementById('customization-overlay')) {
      console.log('Customization modal already open');
      return;
    }
    
    // Get nodeManager from GameScene
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.nodeManager) {
      console.error('NodeManager not available in showCustomizationModal');
      return;
    }
    
    console.log('Creating customization modal...');
    
    // Create DOM overlay for customization form (matching reflection modal design)
    // Use window dimensions as fallback if camera is not available
    const width = this.cameras?.main?.width || window.innerWidth;
    const height = this.cameras?.main?.height || window.innerHeight;
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'customization-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    // Prevent clicks from passing through to the game
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        // Don't allow closing by clicking outside - user must click Skip or Continue
        return;
      }
    };
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'customization-modal';
    modal.style.cssText = `
      background: #D4A574;
      border: 4px solid #000000;
      border-radius: 8px;
      padding: 30px;
      max-width: ${width - 100}px;
      max-height: ${height - 100}px;
      width: 90%;
      overflow-y: auto;
      position: relative;
    `;
    
    // Prevent clicks on modal from closing it
    modal.onclick = (e) => {
      e.stopPropagation();
    };
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Customize Your Experience (Optional)';
    title.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 10px;
      text-align: center;
    `;
    
    // Description
    const description = document.createElement('p');
    description.textContent = 'Personalize the game with your institution\'s information. This will customize the narrative text throughout the experience.';
    description.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #2C1810;
      margin-bottom: 20px;
      text-align: center;
    `;
    
    // Form container
    const form = document.createElement('div');
    form.id = 'customization-form';
    form.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
    
    // Get current config values for pre-population (gameScene already declared above)
    const currentConfig = gameScene.nodeManager.config?.institution || {};
    
    // Field 1: Institution Name
    const nameContainer = this.createCustomizationField('institutionName', 'Institution Name', 'Full name of your institution (appears throughout site)', 'e.g., Soka University of America');
    if (currentConfig.name) {
      const input = nameContainer.querySelector('input');
      if (input) input.value = currentConfig.name;
    }
    form.appendChild(nameContainer);
    
    // Field 2: Institution Short Name
    const shortNameContainer = this.createCustomizationField('institutionShort', 'Institution Short Name', 'Abbreviation (e.g., SUA, MIT, UCLA)', 'e.g., SUA');
    if (currentConfig.shortName) {
      const input = shortNameContainer.querySelector('input');
      if (input) input.value = currentConfig.shortName;
    }
    form.appendChild(shortNameContainer);
    
    // Field 3: Mission Page URL
    const missionUrlContainer = this.createCustomizationField('missionUrl', 'Mission Page URL', 'Link to your institution\'s mission/values page', 'e.g., https://www.soka.edu/about/mission', 'url');
    if (currentConfig.missionUrl) {
      const input = missionUrlContainer.querySelector('input');
      if (input) input.value = currentConfig.missionUrl;
    }
    form.appendChild(missionUrlContainer);
    
    // Field 4: Mission Link Label
    const missionLabelContainer = this.createCustomizationField('missionLabel', 'Mission Link Label', 'How to label the mission link (e.g., Stanford Mission and Values)', 'e.g., Soka University Mission');
    if (currentConfig.missionLinkLabel) {
      const input = missionLabelContainer.querySelector('input');
      if (input) input.value = currentConfig.missionLinkLabel;
    }
    form.appendChild(missionLabelContainer);
    
    // Collapsible Email Section
    const emailSection = this.createCollapsibleEmailSection(gameScene);
    form.appendChild(emailSection);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-top: 10px;';
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'Continue';
    continueBtn.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: bold;
      color: #FFFFFF;
      background: #000000;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      min-width: 120px;
    `;
    continueBtn.onmouseover = () => continueBtn.style.background = '#333333';
    continueBtn.onmouseout = () => continueBtn.style.background = '#000000';
    continueBtn.onclick = () => this.submitCustomization();
    
    // Skip button
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: bold;
      color: #000000;
      background: transparent;
      border: 2px solid #000000;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      min-width: 120px;
    `;
    skipBtn.onmouseover = () => {
      skipBtn.style.background = '#F5E6D3';
    };
    skipBtn.onmouseout = () => {
      skipBtn.style.background = 'transparent';
    };
    skipBtn.onclick = () => {
      console.log('Skip button clicked');
      this.skipCustomization();
    };
    
    buttonContainer.appendChild(continueBtn);
    buttonContainer.appendChild(skipBtn);
    
    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(form);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    console.log('Customization modal appended to DOM. Overlay element:', overlay);
    console.log('Modal element:', modal);
    
    // Store reference for cleanup
    this.customizationOverlay = overlay;
  }

  /**
   * Generate possessive form from institution short name
   * Examples: "SUA" -> "SUA's", "MIT" -> "MIT's"
   * Handles edge cases like empty strings or already possessive forms
   */
  generatePossessive(shortName) {
    if (!shortName || typeof shortName !== 'string') {
      return '';
    }
    
    const trimmed = shortName.trim();
    if (!trimmed) {
      return '';
    }
    
    // If it already ends with an apostrophe and 's', return as is
    if (trimmed.endsWith("'s") || trimmed.endsWith("'")) {
      return trimmed;
    }
    
    // Otherwise, add 's
    return trimmed + "'s";
  }

  createCustomizationField(id, label, instruction, placeholder, inputType = 'text') {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: #000000;
    `;
    
    const instructionEl = document.createElement('p');
    instructionEl.textContent = instruction;
    instructionEl.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #2C1810;
      margin: 0;
    `;
    
    const input = document.createElement('input');
    input.type = inputType;
    input.id = id;
    input.placeholder = placeholder;
    input.style.cssText = `
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #000000;
      background: #F5E6D3;
      border: 2px solid #000000;
      border-radius: 4px;
      padding: 10px;
      width: 100%;
      box-sizing: border-box;
    `;
    
    container.appendChild(labelEl);
    container.appendChild(instructionEl);
    container.appendChild(input);
    return container;
  }

  createCollapsibleEmailSection(gameScene) {
    const section = document.createElement('div');
    section.style.cssText = 'display: flex; flex-direction: column; gap: 10px; border: 2px solid #000000; border-radius: 4px; padding: 15px; background: #F5E6D3;';
    
    // Get current email config values for pre-population
    const currentEmailConfig = gameScene?.nodeManager?.config?.email || {};
    
    // Collapsible header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;';
    header.onclick = () => {
      const isExpanded = content.style.display !== 'none';
      content.style.display = isExpanded ? 'none' : 'flex';
      toggleIcon.textContent = isExpanded ? '▶' : '▼';
    };
    
    const headerText = document.createElement('span');
    headerText.textContent = 'Who should receive reflections?';
    headerText.style.cssText = 'font-family: \'Inter\', sans-serif; font-size: 14px; font-weight: bold; color: #000000;';
    
    const toggleIcon = document.createElement('span');
    toggleIcon.textContent = '▶';
    toggleIcon.style.cssText = 'font-family: \'Inter\', sans-serif; font-size: 12px; color: #000000;';
    
    header.appendChild(headerText);
    header.appendChild(toggleIcon);
    
    // Collapsible content (initially hidden)
    const content = document.createElement('div');
    content.id = 'email-section-content';
    content.style.cssText = 'display: none; flex-direction: column; gap: 15px; margin-top: 10px;';
    
    // Primary Recipient Email
    const primaryEmailContainer = this.createCustomizationField('primaryRecipientEmail', 'Primary Recipient Email', 'Email address where meta-reflections will be sent', 'dean@university.edu', 'email');
    if (currentEmailConfig.primaryRecipient) {
      const input = primaryEmailContainer.querySelector('input');
      if (input) input.value = currentEmailConfig.primaryRecipient;
    }
    content.appendChild(primaryEmailContainer);
    
    // CC Recipient Email (Optional)
    const ccEmailContainer = this.createCustomizationField('ccRecipientEmail', 'CC Recipient (Optional)', 'Additional email to copy on reflections', 'professor@university.edu', 'email');
    if (currentEmailConfig.ccRecipient) {
      const input = ccEmailContainer.querySelector('input');
      if (input) input.value = currentEmailConfig.ccRecipient;
    }
    content.appendChild(ccEmailContainer);
    
    section.appendChild(header);
    section.appendChild(content);
    
    return section;
  }

  submitCustomization() {
    // Get form values
    const institutionName = document.getElementById('institutionName')?.value.trim() || '';
    const institutionShort = document.getElementById('institutionShort')?.value.trim() || '';
    const missionUrl = document.getElementById('missionUrl')?.value.trim() || '';
    const missionLabel = document.getElementById('missionLabel')?.value.trim() || '';
    const primaryRecipientEmail = document.getElementById('primaryRecipientEmail')?.value.trim() || '';
    const ccRecipientEmail = document.getElementById('ccRecipientEmail')?.value.trim() || '';
    
    // Get nodeManager from GameScene
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene.nodeManager) {
      console.error('NodeManager not available');
      this.closeCustomizationModal();
      return;
    }
    
    // Update NodeManager config with user input (only if provided)
    if (gameScene.nodeManager && gameScene.nodeManager.config) {
      if (institutionName) {
        gameScene.nodeManager.config.institution.name = institutionName;
      }
      if (institutionShort) {
        gameScene.nodeManager.config.institution.shortName = institutionShort;
        // Automatically generate possessive from short name
        gameScene.nodeManager.config.institution.possessive = this.generatePossessive(institutionShort);
      }
      if (missionUrl) {
        gameScene.nodeManager.config.institution.missionUrl = missionUrl;
      }
      if (missionLabel) {
        gameScene.nodeManager.config.institution.missionLinkLabel = missionLabel;
      }
      
      // Initialize email config if it doesn't exist
      if (!gameScene.nodeManager.config.email) {
        gameScene.nodeManager.config.email = {};
      }
      
      // Update email config
      if (primaryRecipientEmail) {
        gameScene.nodeManager.config.email.primaryRecipient = primaryRecipientEmail;
      }
      if (ccRecipientEmail) {
        gameScene.nodeManager.config.email.ccRecipient = ccRecipientEmail;
      }
      
      // Re-apply placeholders to all nodes with updated config
      this.reapplyPlaceholders(gameScene.nodeManager);
    }
    
    // Close modal and restart game to D1
    this.closeCustomizationModal();
    this.restartGame();
  }

  skipCustomization() {
    console.log('skipCustomization called');
    // Close modal first
    this.closeCustomizationModal();
    // Small delay to ensure DOM is cleaned up before restarting
    this.time.delayedCall(50, () => {
      console.log('Restarting game after skip');
      this.restartGame();
    });
  }

  restartGame() {
    console.log('restartGame called');
    // Get GameScene and restart it, then navigate to D1
    const gameScene = this.scene.get('GameScene');
    
    if (gameScene && gameScene.nodeManager) {
      // Clear the skip flag so node will load
      gameScene.skipAutoLoad = false;
      
      // Reset cameras to fully visible before restarting
      if (gameScene.cameras && gameScene.cameras.main) {
        gameScene.cameras.main.setAlpha(1);
        gameScene.cameras.main.clearTint();
      }
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setAlpha(1);
        this.cameras.main.clearTint();
      }
      
      // Load the current node (D1)
      gameScene.loadCurrentNode();
      
      // Wait a frame for scenes to initialize, then fade in
      this.time.delayedCall(100, () => {
        const newGameScene = this.scene.get('GameScene');
        const newUIScene = this.scene.get('UIScene');
        if (newGameScene && newGameScene.cameras) {
          // Ensure camera is visible
          newGameScene.cameras.main.setAlpha(1);
          // Fade in from black
          newGameScene.cameras.main.fadeIn(1000, 0, 0, 0);
        }
        if (newUIScene && newUIScene.cameras) {
          // Ensure camera is visible
          newUIScene.cameras.main.setAlpha(1);
          // Fade in from black
          newUIScene.cameras.main.fadeIn(1000, 0, 0, 0);
        }
      });
    }
  }

  reapplyPlaceholders(nodeManager) {
    // Re-process all nodes with updated config using original unprocessed nodes
    const processedNodes = {};
    const baseNodes = nodeManager.originalNodes;
    
    if (!baseNodes || Object.keys(baseNodes).length === 0) {
      console.warn('No original nodes found for re-applying placeholders');
      return;
    }
    
    Object.entries(baseNodes).forEach(([id, node]) => {
      processedNodes[id] = {
        ...node,
        title: nodeManager.applyPlaceholders(node.title),
        narrative: nodeManager.applyPlaceholders(node.narrative),
        pathLabel: nodeManager.applyPlaceholders(node.pathLabel),
        resources: node.resources?.map(r => ({
          ...r,
          label: nodeManager.applyPlaceholders(r.label),
          why: nodeManager.applyPlaceholders(r.why),
          url: nodeManager.applyPlaceholders(r.url)
        })) || [],
        choices: node.choices?.map(c => ({
          ...c,
          label: nodeManager.applyPlaceholders(c.label)
        })) || []
      };
    });
    
    nodeManager.nodes = processedNodes;
    console.log('✓ Re-applied placeholders with updated customization');
  }

  closeCustomizationModal() {
    console.log('closeCustomizationModal called');
    
    // First, try to find and remove by ID (most reliable)
    const overlayById = document.getElementById('customization-overlay');
    if (overlayById) {
      console.log('Found overlay by ID, removing...');
      overlayById.style.display = 'none';
      overlayById.remove();
    }
    
    // Remove overlay from stored reference
    if (this.customizationOverlay) {
      console.log('Removing overlay from stored reference');
      try {
        if (this.customizationOverlay.parentNode) {
          this.customizationOverlay.remove();
        }
      } catch (e) {
        console.warn('Error removing overlay from stored reference:', e);
      }
      this.customizationOverlay = null;
    }
    
    // Double-check: remove any remaining overlays using querySelector
    const allOverlays = document.querySelectorAll('#customization-overlay');
    if (allOverlays.length > 0) {
      console.log(`Found ${allOverlays.length} additional overlay(s), removing...`);
      allOverlays.forEach(ov => {
        try {
          ov.style.display = 'none';
          if (ov.parentNode) {
            ov.remove();
          }
        } catch (e) {
          console.warn('Error removing additional overlay:', e);
        }
      });
    }
    
    // Also check for the modal itself
    const modal = document.getElementById('customization-modal');
    if (modal) {
      console.log('Found modal, removing...');
      modal.style.display = 'none';
      if (modal.parentNode) {
        modal.remove();
      }
    }
    
    // Final verification
    const verifyOverlay = document.getElementById('customization-overlay');
    if (verifyOverlay) {
      console.error('Overlay still exists after cleanup! Forcing removal with display:none...');
      verifyOverlay.style.display = 'none';
      verifyOverlay.style.visibility = 'hidden';
      verifyOverlay.style.opacity = '0';
      verifyOverlay.style.pointerEvents = 'none';
      if (verifyOverlay.parentNode) {
        verifyOverlay.remove();
      }
    } else {
      console.log('Overlay successfully removed');
    }
    
    // Also check for any elements with the customization overlay class or similar
    const anyOverlays = document.querySelectorAll('[id*="customization"], [class*="customization"]');
    if (anyOverlays.length > 0) {
      console.log(`Found ${anyOverlays.length} additional customization-related element(s), removing...`);
      anyOverlays.forEach(el => {
        if (el.id === 'customization-overlay' || el.id === 'customization-modal') {
          el.style.display = 'none';
          if (el.parentNode) {
            el.remove();
          }
        }
      });
    }
  }
}

