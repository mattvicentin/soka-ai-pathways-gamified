/**
 * AudioManager - Handles background music and sound effects
 */

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
    this.currentMusicKey = null; // Track which music track is playing
    this.musicVolume = 0.144; // Reduced by 20% from previous (0.18 * 0.8 = 0.144)
    this.sfxVolume = 0.5;
    this.isMuted = false;
  }

  init() {
    // Check for saved mute preference
    const savedMute = localStorage.getItem('game-audio-muted');
    if (savedMute === 'true') {
      this.isMuted = true;
      console.log('Audio initialized as muted (from localStorage)');
    } else {
      this.isMuted = false;
      console.log('Audio initialized as unmuted');
    }
  }

  playMusic(key, loop = true) {
    if (this.isMuted) {
      console.log(`Music ${key} skipped - audio is muted`);
      return;
    }
    
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
    
    // Check if audio exists in cache (audio loaded in BootScene is in global cache)
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Audio file not in cache: ${key}`);
      // List all available audio files for debugging
      const allAudio = this.scene.cache.audio.getKeys();
      console.log('Available audio files in cache:', allAudio);
      return;
    }
    
    // Use base music volume for all tracks (hopeful is now adjustable like others)
    let trackVolume = this.musicVolume;
    
    // Play new music - use scene's sound manager which has access to cached audio
    try {
      this.currentMusic = this.scene.sound.add(key, {
        loop: loop,
        volume: trackVolume
      });
      
      if (this.currentMusic) {
        this.currentMusicKey = key; // Track which music is playing
        this.currentMusic.play();
        
        // Explicitly set volume after play to ensure it's applied
        this.currentMusic.setVolume(trackVolume);
        
        console.log(`🎵 Playing music: ${key} (volume: ${trackVolume}, actual volume: ${this.currentMusic.volume})`);
        
        // Add event listeners to track playback
        this.currentMusic.on('play', () => {
          console.log(`▶️ Music started: ${key} (volume: ${this.currentMusic.volume})`);
          // Double-check volume is set correctly after play
          if (key === 'music-hopeful' && this.currentMusic.volume !== trackVolume) {
            console.warn(`⚠️ Hopeful volume mismatch! Expected ${trackVolume}, got ${this.currentMusic.volume}`);
            this.currentMusic.setVolume(trackVolume);
          }
        });
        this.currentMusic.on('complete', () => console.log(`⏹️ Music completed: ${key}`));
        this.currentMusic.on('looped', () => console.log(`🔁 Music looped: ${key}`));
      } else {
        console.warn(`Failed to create music instance for ${key}`);
      }
    } catch (error) {
      console.error(`Failed to play music ${key}:`, error);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
  }

  playSFX(key, volume = null, seek = null, loopStart = null, loopEnd = null) {
    if (this.isMuted) return null;
    
    // Check if audio exists in cache
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Audio file not in cache: ${key}`);
      return null;
    }
    
    // If a specific volume is passed, multiply it by the current SFX volume setting
    // This ensures all SFX respect the slider (e.g., 0.2 * 0.5 = 0.1 if slider is at 50%)
    // If no volume is passed, use the SFX volume directly
    const baseVolume = volume !== null ? volume : 1.0;
    const sfxVolume = baseVolume * this.sfxVolume;
    try {
      const sfx = this.scene.sound.add(key, { 
        volume: sfxVolume
      });
      
      // Play the sound first
      sfx.play();
      console.log(`Playing SFX: ${key} at volume ${sfxVolume}`);
      
      // Set seek position and looping if specified
      if (seek !== null || (loopStart !== null && loopEnd !== null)) {
        // Use a more reliable method: wait for sound to be ready, then seek
        const setupSeek = () => {
          if (!sfx || !sfx.isPlaying) {
            // Sound might not be ready yet, try again
            this.scene.time.delayedCall(100, setupSeek);
            return;
          }
          
          // Set initial seek position
          if (seek !== null) {
            try {
              // Access the underlying audio context if available
              if (sfx.currentMarker) {
                // Phaser sound with markers
                sfx.currentMarker.start = seek;
              } else if (sfx.source && sfx.source.buffer) {
                // Direct audio buffer access
                if (sfx.source.buffer.duration > seek) {
                  sfx.seek = seek;
                }
              } else {
                // Try direct seek property
                sfx.seek = seek;
              }
              console.log(`Set seek position to ${seek} for ${key}`);
            } catch (e) {
              console.warn('Could not set seek position:', e);
            }
          }
        };
        
        // Start setup after sound begins playing
        this.scene.time.delayedCall(100, setupSeek);
      }
      
      // Set up looping between loopStart and loopEnd if specified
      if (loopStart !== null && loopEnd !== null) {
        // Check position periodically and loop back if needed
        const loopCheck = this.scene.time.addEvent({
          delay: 100, // Check every 100ms
          callback: () => {
            if (sfx && sfx.isPlaying) {
              try {
                const currentSeek = sfx.seek;
                // If we've reached or passed the end point, loop back to start
                if (currentSeek !== undefined && currentSeek >= loopEnd) {
                  sfx.seek = loopStart;
                  console.log(`Looping ${key} back to ${loopStart}`);
                }
              } catch (e) {
                // Seek might not be available, ignore
              }
            }
          },
          loop: true
        });
        
        // Store loop check timer on sound object so we can clean it up
        sfx._loopCheck = loopCheck;
      }
      
      return sfx; // Return sound instance so caller can stop it
    } catch (error) {
      console.error(`Failed to play SFX ${key}:`, error);
      return null;
    }
  }
  
  stopSFX(soundInstance) {
    if (soundInstance) {
      // Clean up loop check timer if it exists
      if (soundInstance._loopCheck) {
        soundInstance._loopCheck.destroy();
        soundInstance._loopCheck = null;
      }
      if (soundInstance.isPlaying) {
        soundInstance.stop();
      }
      soundInstance.destroy();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('game-audio-muted', this.isMuted.toString());
    
    if (this.isMuted) {
      this.scene.sound.pauseAll();
    } else {
      this.scene.sound.resumeAll();
    }
    
    return this.isMuted;
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      // Update volume of currently playing music
      this.currentMusic.setVolume(this.musicVolume);
      console.log(`Volume updated: ${this.currentMusicKey || 'music'} to ${this.musicVolume}`);
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update volume of any currently playing SFX sounds
    // Note: We track typewriter sound in UIScene, so we'll update it there
    // For other SFX, they're typically short and will use new volume on next play
    console.log(`SFX volume updated to ${this.sfxVolume}`);
  }

  // Get music track for pathway
  getMusicForPathway(path) {
    switch(path) {
      case 'ignore':
      case 'shared':
        return 'music-contemplative';
      case 'prohibitive':
        return 'music-serious';
      case 'balanced':
        return 'music-contemplative';
      case 'embracing':
      case 'collaborative':
        return 'music-hopeful';
      default:
        return 'music-contemplative';
    }
  }
}

