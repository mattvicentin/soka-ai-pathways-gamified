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
      
      // Show customization modal before starting game
      this.time.delayedCall(100, () => {
        this.showCustomizationModal();
      });
      
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

  showCustomizationModal() {
    // Don't show if already open
    if (document.getElementById('customization-overlay')) {
      return;
    }
    
    // Create DOM overlay for customization form (matching reflection modal design)
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
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
    
    // Field 1: Institution Name
    const nameContainer = this.createCustomizationField('institutionName', 'Institution Name', 'Full name of your institution (appears throughout site)', 'e.g., Soka University of America');
    form.appendChild(nameContainer);
    
    // Field 2: Institution Short Name
    const shortNameContainer = this.createCustomizationField('institutionShort', 'Institution Short Name', 'Abbreviation (e.g., SUA, MIT, UCLA)', 'e.g., SUA');
    form.appendChild(shortNameContainer);
    
    // Field 3: Mission Page URL
    const missionUrlContainer = this.createCustomizationField('missionUrl', 'Mission Page URL', 'Link to your institution\'s mission/values page', 'e.g., https://www.soka.edu/about/mission', 'url');
    form.appendChild(missionUrlContainer);
    
    // Field 4: Mission Link Label
    const missionLabelContainer = this.createCustomizationField('missionLabel', 'Mission Link Label', 'How to label the mission link (e.g., Stanford Mission and Values)', 'e.g., Soka University Mission');
    form.appendChild(missionLabelContainer);
    
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
    skipBtn.onclick = () => this.skipCustomization();
    
    buttonContainer.appendChild(continueBtn);
    buttonContainer.appendChild(skipBtn);
    
    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(form);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
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

  submitCustomization() {
    // Get form values
    const institutionName = document.getElementById('institutionName')?.value.trim() || '';
    const institutionShort = document.getElementById('institutionShort')?.value.trim() || '';
    const missionUrl = document.getElementById('missionUrl')?.value.trim() || '';
    const missionLabel = document.getElementById('missionLabel')?.value.trim() || '';
    
    // Update NodeManager config with user input (only if provided)
    if (this.nodeManager && this.nodeManager.config) {
      if (institutionName) {
        this.nodeManager.config.institution.name = institutionName;
      }
      if (institutionShort) {
        this.nodeManager.config.institution.shortName = institutionShort;
        // Automatically generate possessive from short name
        this.nodeManager.config.institution.possessive = this.generatePossessive(institutionShort);
      }
      if (missionUrl) {
        this.nodeManager.config.institution.missionUrl = missionUrl;
      }
      if (missionLabel) {
        this.nodeManager.config.institution.missionLinkLabel = missionLabel;
      }
      
      // Re-apply placeholders to all nodes with updated config
      this.reapplyPlaceholders();
    }
    
    // Close modal and start game
    this.closeCustomizationModal();
    
    // Unlock audio before starting GameScene (user clicked Continue, so this counts as user interaction)
    this.registry.set('audioUnlocked', true);
    
    this.scene.start('GameScene');
  }

  skipCustomization() {
    // Close modal and start game with default config
    this.closeCustomizationModal();
    
    // Unlock audio before starting GameScene (user clicked Skip, so this counts as user interaction)
    this.registry.set('audioUnlocked', true);
    
    this.scene.start('GameScene');
  }

  reapplyPlaceholders() {
    // Re-process all nodes with updated config using original unprocessed nodes
    const processedNodes = {};
    const baseNodes = this.nodeManager.originalNodes;
    
    if (!baseNodes || Object.keys(baseNodes).length === 0) {
      console.warn('No original nodes found for re-applying placeholders');
      return;
    }
    
    Object.entries(baseNodes).forEach(([id, node]) => {
      processedNodes[id] = {
        ...node,
        title: this.nodeManager.applyPlaceholders(node.title),
        narrative: this.nodeManager.applyPlaceholders(node.narrative),
        pathLabel: this.nodeManager.applyPlaceholders(node.pathLabel),
        resources: node.resources?.map(r => ({
          ...r,
          label: this.nodeManager.applyPlaceholders(r.label),
          why: this.nodeManager.applyPlaceholders(r.why),
          url: this.nodeManager.applyPlaceholders(r.url)
        })) || [],
        choices: node.choices?.map(c => ({
          ...c,
          label: this.nodeManager.applyPlaceholders(c.label)
        })) || []
      };
    });
    
    this.nodeManager.nodes = processedNodes;
    console.log('✓ Re-applied placeholders with updated customization');
  }

  closeCustomizationModal() {
    if (this.customizationOverlay) {
      this.customizationOverlay.remove();
      this.customizationOverlay = null;
    }
  }
}

