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
    // Choice block area for fade overlay (non-interactive, just for reference)
    this.choiceBlockArea = null;
    // Track how many choice buttons are currently hovered
    this.hoveredChoiceCount = 0;
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
    
    // Restart button - bottom-left, 30% smaller
    const restartBtn = this.add.text(
      padding,
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
    restartBtn.setDepth(101);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.restart());
    restartBtn.on('pointerover', () => restartBtn.setBackgroundColor('#555555'));
    restartBtn.on('pointerout', () => restartBtn.setBackgroundColor('#333333'));
    
    // Audio toggle button - bottom-right, 30% smaller
    const audioBtn = this.add.text(
      width - padding - 40,
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
    audioBtn.setDepth(101);
    audioBtn.setInteractive({ useHandCursor: true });
    audioBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.audioManager) {
        const isMuted = gameScene.audioManager.toggleMute();
        audioBtn.setText(isMuted ? '🔇' : '🔊');
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
    
    // Clear previous choices
    this.clearChoices();
    
    // Update title (centered)
    this.titleText.setText(node.title);
    
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

  startTypewriter(text) {
    // Split text into pages
    this.textPages = this.splitTextIntoPages(text);
    this.currentPage = 0;
    this.fullText = this.textPages[0] || text;
    this.displayedText = '';
    this.charIndex = 0;
    this.isTyping = true;
    this.continueIndicator.setVisible(false);
    this.hideContinueButton();
    
    // Clear existing text
    this.narrativeText.setText('');
    
    // Type character by character
    this.typewriterTimer = this.time.addEvent({
      delay: 30, // ms per character
      callback: () => {
        if (this.charIndex < this.fullText.length) {
          this.displayedText += this.fullText[this.charIndex];
          this.narrativeText.setText(this.displayedText);
          this.charIndex++;
          
          // Play text sound (if available)
          const gameScene = this.scene.get('GameScene');
          if (gameScene && gameScene.audioManager && this.charIndex % 3 === 0) {
            gameScene.audioManager.playSFX('sfx-text', 0.1);
          }
        } else {
          this.finishTypewriter();
        }
      },
      loop: true
    });
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
    this.isTyping = false;
    
    // Stop timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    
    // Check if there are more pages
    if (this.currentPage < this.textPages.length - 1) {
      // Show continue button instead of choices
      this.showContinueButton();
    } else {
      // All text displayed, show continue indicator and choices
      this.continueIndicator.setVisible(true);
      this.hideContinueButton();
      
      // Show choices after a brief delay
      this.time.delayedCall(300, () => {
        this.showChoices();
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
      
      // Type character by character
      this.typewriterTimer = this.time.addEvent({
        delay: 30,
        callback: () => {
          if (this.charIndex < this.fullText.length) {
            this.displayedText += this.fullText[this.charIndex];
            this.narrativeText.setText(this.displayedText);
            this.charIndex++;
            
            // Play text sound (if available)
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.audioManager && this.charIndex % 3 === 0) {
              gameScene.audioManager.playSFX('sfx-text', 0.1);
            }
          } else {
            this.finishTypewriter();
          }
        },
        loop: true
      });
    }
  }

  showChoices() {
    if (!this.currentNode || !this.currentNode.choices) return;
    
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
    const totalChoices = this.currentNode.choices.length;
    const lineHeight = 40; // Spacing between different options (not within each option)
    const totalTextHeight = (totalChoices - 1) * lineHeight;
    const startY = paperArea.y - (totalTextHeight / 2) - 15; // Center vertically, moved up 15px
    
    // Display each choice as typewritten text on the paper
    this.currentNode.choices.forEach((choice, index) => {
      const y = startY + (index * lineHeight);
      
      // Format choice label: split by dash or parentheses
      // Handle em dash (—), en dash (–), regular dash (-), and parentheses
      // Note: Non-breaking hyphen (‑) is NOT used as separator - it keeps words together
      let firstPart = '';
      let secondPart = '';
      let hasDescription = false;
      
      // First check for dash separator (em dash, en dash, or regular dash)
      const dashMatch = choice.label.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (dashMatch) {
        firstPart = dashMatch[1].trim();
        secondPart = dashMatch[2].trim();
        hasDescription = true;
      } else {
        // If no dash, check for parentheses (text in parentheses is always a description)
        const parenMatch = choice.label.match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (parenMatch) {
          firstPart = parenMatch[1].trim();
          secondPart = parenMatch[2].trim();
          hasDescription = true;
        } else {
          // No dash or parentheses found - entire label is header only
          firstPart = choice.label;
          hasDescription = false;
        }
      }
      
      // Typewritten text style - lines within each option close together, spacing between options
      const textX = paperArea.centerX - 12; // Shift left 12px for better centering on paper
      
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

