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
  }

  create() {
    console.log('UIScene: Starting...');
    
    // Get nodeManager from registry
    this.nodeManager = this.registry.get('nodeManager');
    
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
      fontFamily: 'Inter',
      fontSize: '16px', // Reduced by 2 points (from 18px)
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
        fontFamily: 'Inter',
        fontSize: '14px',
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
      fontFamily: 'Inter',
      fontSize: '14px',
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
    
    // Restart button - bottom-right, 30% smaller
    const restartBtn = this.add.text(
      width - padding - 40,
      height - padding - 20,
      '↻ Restart',
      {
        fontFamily: 'Inter',
        fontSize: '10px', // 30% smaller (14px * 0.7 ≈ 10px)
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
    
    // Start typewriter effect for narrative
    this.startTypewriter(node.narrative);
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
      fontFamily: 'Inter',
      fontSize: '14px',
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
      fontFamily: 'Inter',
      fontSize: '14px',
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
      fontFamily: 'Inter',
      fontSize: '14px'
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
      this.showChoicesTimer = this.time.delayedCall(300, () => {
        // Double-check we're still on the same node before showing choices
        if (this.currentNode && this.currentNode.choices && this.currentNode.choices.length > 0) {
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
        fontFamily: 'Inter',
        fontSize: '12px',
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
              font: 'bold 13px "Special Elite", "Courier New", monospace',
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
          font: 'bold 13px "Special Elite", "Courier New", monospace', // Reduced from 14px to ensure fit
          color: '#000000', // Darker black for bold appearance
          align: 'center',
          wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
          stroke: '#000000', // Add stroke for bolder appearance
          strokeThickness: 0.5
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
            fontFamily: '"Special Elite", "Courier New", monospace',
            fontSize: '12px', // Reduced from 13px to ensure fit within paper borders
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
        fontFamily: 'Inter',
        fontSize: '12px',
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
    // Create a modal overlay showing resources
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(200);
    overlay.setInteractive();
    
    // Modal box
    const modalBox = this.add.rectangle(width / 2, height / 2, width - 100, height - 100, 0xFFFFFF, 1);
    modalBox.setStrokeStyle(4, 0x0048B7);
    modalBox.setDepth(201);
    
    // Modal title
    const modalTitle = this.add.text(
      60,
      60,
      'Resources for this section',
      {
        fontFamily: 'Inter',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#0048B7'
      }
    );
    modalTitle.setDepth(202);
    
    // Resources list
    let resourcesHTML = '';
    this.currentNode.resources.forEach((resource, index) => {
      const y = 110 + index * 60;
      
      const resourceText = this.add.text(
        60,
        y,
        `${index + 1}. ${resource.label}`,
        {
          fontFamily: 'Inter',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#0048B7',
          wordWrap: { width: width - 140 }
        }
      );
      resourceText.setDepth(202);
      resourceText.setInteractive({ useHandCursor: true });
      resourceText.on('pointerdown', () => {
        window.open(resource.url, '_blank');
      });
      this.choiceButtons.push({ button: resourceText, text: null });
      
      if (resource.why) {
        const whyText = this.add.text(
          60,
          y + 20,
          resource.why,
          {
            fontFamily: 'Inter',
            fontSize: '12px',
            color: '#666666',
            wordWrap: { width: width - 140 }
          }
        );
        whyText.setDepth(202);
        this.choiceButtons.push({ button: whyText, text: null });
      }
    });
    
    // Close button
    const closeBtn = this.add.text(
      width / 2,
      height - 80,
      'Close',
      {
        fontFamily: 'Inter',
        fontSize: '16px',
        color: '#FFFFFF',
        backgroundColor: '#0048B7',
        padding: { x: 20, y: 10 }
      }
    );
    closeBtn.setOrigin(0.5);
    closeBtn.setDepth(202);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      modalBox.destroy();
      modalTitle.destroy();
      closeBtn.destroy();
      // Clean up resource texts
      this.clearChoices();
      this.showChoices();
    });
    
    this.choiceButtons.push({ button: overlay, text: null });
    this.choiceButtons.push({ button: modalBox, text: null });
    this.choiceButtons.push({ button: modalTitle, text: null });
    this.choiceButtons.push({ button: closeBtn, text: null });
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
    
    // Tell GameScene to change node
    gameScene.events.emit('changeNode', nextNodeId);
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
      fontFamily: 'Inter',
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
      fontFamily: 'Inter',
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
    
    // Reset node manager
    this.nodeManager.restart();
    
    // Clear URL hash
    window.location.hash = '';
    
    // Reload the game scene
    this.scene.restart();
    this.scene.get('GameScene').scene.restart();
  }
}

