/**
 * CreditsScene - Transition scene with thank you message and credits
 */

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    console.log('CreditsScene: Creating...');
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Set camera background color to black
    this.cameras.main.setBackgroundColor(0x000000);
    
    // Start with camera faded in from black (smooth transition)
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    
    // Black background (full screen)
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    bg.setDepth(0);
    
    // "Thank you" text (initially invisible) - pixelated font
    const thankYouText = this.add.text(width / 2, height / 2 - 50, 'Thank you', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px',
      color: '#FFFFFF',
      align: 'center'
    });
    thankYouText.setOrigin(0.5, 0.5);
    thankYouText.setAlpha(0);
    thankYouText.setDepth(100);
    
    // "by Ian Read & Matheus Vicentin" text (initially invisible) - pixelated font
    const creditsText = this.add.text(width / 2, height / 2 + 10, 'by Ian Read & Matheus Vicentin', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#FFFFFF',
      align: 'center'
    });
    creditsText.setOrigin(0.5, 0.5);
    creditsText.setAlpha(0);
    creditsText.setDepth(100);
    
    // "from Professor & Student, to Professors & Students" text (initially invisible) - pixelated font
    // Split into parts to italicize only "from" and "to"
    const taglineY = height / 2 + 40;
    const taglineBaseStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#FFFFFF',
      align: 'center'
    };
    
    // Create text parts
    const fromText = this.add.text(0, taglineY, 'from', {
      ...taglineBaseStyle,
      fontStyle: 'italic'
    });
    fromText.setOrigin(0, 0.5);
    fromText.setAlpha(0);
    fromText.setDepth(100);
    
    const middleText = this.add.text(0, taglineY, ' Professor & Student, ', taglineBaseStyle);
    middleText.setOrigin(0, 0.5);
    middleText.setAlpha(0);
    middleText.setDepth(100);
    
    const toText = this.add.text(0, taglineY, 'to', {
      ...taglineBaseStyle,
      fontStyle: 'italic'
    });
    toText.setOrigin(0, 0.5);
    toText.setAlpha(0);
    toText.setDepth(100);
    
    const endText = this.add.text(0, taglineY, ' Professors & Students', taglineBaseStyle);
    endText.setOrigin(0, 0.5);
    endText.setAlpha(0);
    endText.setDepth(100);
    
    // Position text parts horizontally centered
    this.time.delayedCall(50, () => {
      const totalWidth = fromText.width + middleText.width + toText.width + endText.width;
      let currentX = width / 2 - totalWidth / 2;
      
      fromText.x = currentX;
      currentX += fromText.width;
      
      middleText.x = currentX;
      currentX += middleText.width;
      
      toText.x = currentX;
      currentX += toText.width;
      
      endText.x = currentX;
    });
    
    // Store all tagline parts for animation
    const taglineText = [fromText, middleText, toText, endText];
    
    // Red pixelated heart sprite (initially invisible)
    const heartSprite = this.add.image(width / 2, height / 2 + 60, 'heart');
    heartSprite.setOrigin(0.5, 0.5);
    heartSprite.setAlpha(0);
    heartSprite.setDepth(100);
    // Scale heart to emoji size (32px height)
    heartSprite.setDisplaySize(32, 32);
    
    // Animation sequence
    // 1. Fade in "Thank you" (1 second)
    this.tweens.add({
      targets: thankYouText,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 2. After "Thank you" finishes fading in, fade in credits (1 second)
        this.tweens.add({
          targets: creditsText,
          alpha: 1,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            // 3. After credits finish fading in, fade in tagline and heart (1 second)
            this.tweens.add({
              targets: [...taglineText, heartSprite],
              alpha: 1,
              duration: 1000,
              ease: 'Power2'
            });
          }
        });
      }
    });
    
    // 4. After 8 seconds total (1s fade in + 7s visible), fade out "Thank you"
    this.time.delayedCall(8000, () => {
      this.tweens.add({
        targets: thankYouText,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
                      // 5. Fade out everything else
                      this.tweens.add({
                        targets: [creditsText, ...taglineText, heartSprite],
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power2',
                        onComplete: () => {
                          // 6. Transition back to D1 (dilemma)
                          this.transitionToD1();
                        }
                      });
        }
      });
    });
  }
  
  transitionToD1() {
    // Fade to black using camera fade
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    // When fade completes, return to character selection interface
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Get GameScene to stop music and reset state
      const gameScene = this.scene.get('GameScene');
      
      // Stop music before transitioning
      if (gameScene && gameScene.audioManager) {
        gameScene.audioManager.stopMusic();
        console.log('Music stopped after credits scene');
      }
      
      // Reset node manager to D1
      if (gameScene && gameScene.nodeManager) {
        gameScene.nodeManager.restart();
        window.location.hash = 'node=D1';
      }
      
      // Clear customization flag so it shows again after character selection
      this.registry.set('customizationShown', false);
      window.showCustomizationAfterCredits = false;
      this.registry.set('showCustomizationAfterCredits', false);
      
      // Stop all current scenes
      this.scene.stop('CreditsScene');
      if (gameScene) {
        this.scene.stop('GameScene');
      }
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        this.scene.stop('UIScene');
      }
      
      console.log('CreditsScene: Transitioning to character selection');
      
      // Go to character selection scene
      this.scene.start('CharacterSelectionScene');
    });
  }

  fadeInScenes() {
    // Fade in the game scenes
    this.time.delayedCall(50, () => {
      const newGameScene = this.scene.get('GameScene');
      const newUIScene = this.scene.get('UIScene');
      if (newGameScene && newGameScene.cameras) {
        newGameScene.cameras.main.setAlpha(0);
        newGameScene.cameras.main.fadeIn(1000, 0, 0, 0);
      }
      if (newUIScene && newUIScene.cameras) {
        newUIScene.cameras.main.setAlpha(0);
        newUIScene.cameras.main.fadeIn(1000, 0, 0, 0);
      }
    });
  }

  restartGame() {
    // Get GameScene and restart it, then navigate to D1
    const gameScene = this.scene.get('GameScene');
    const uiScene = this.scene.get('UIScene');
    
    if (gameScene && gameScene.nodeManager) {
      // Reset to D1
      gameScene.nodeManager.restart();
      window.location.hash = 'node=D1';
      
      // Start game scenes with cameras already faded out
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      
      // Wait a frame for scenes to initialize, then fade in
      this.time.delayedCall(50, () => {
        const newGameScene = this.scene.get('GameScene');
        const newUIScene = this.scene.get('UIScene');
        if (newGameScene && newGameScene.cameras) {
          newGameScene.cameras.main.setAlpha(0);
          newGameScene.cameras.main.fadeIn(1000, 0, 0, 0);
        }
        if (newUIScene && newUIScene.cameras) {
          newUIScene.cameras.main.setAlpha(0);
          newUIScene.cameras.main.fadeIn(1000, 0, 0, 0);
        }
      });
    }
  }
}

