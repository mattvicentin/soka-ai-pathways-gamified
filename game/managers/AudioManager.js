/**
 * AudioManager - Handles background music and sound effects
 */

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.isMuted = false;
  }

  init() {
    // Check for saved mute preference
    const savedMute = localStorage.getItem('game-audio-muted');
    if (savedMute === 'true') {
      this.isMuted = true;
    }
  }

  playMusic(key, loop = true) {
    if (this.isMuted) return;
    
    // Stop current music if playing
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    
    // Play new music
    if (this.scene.sound.get(key)) {
      this.currentMusic = this.scene.sound.play(key, {
        loop: loop,
        volume: this.musicVolume
      });
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  playSFX(key, volume = null) {
    if (this.isMuted) return;
    
    const sfxVolume = volume !== null ? volume : this.sfxVolume;
    if (this.scene.sound.get(key)) {
      this.scene.sound.play(key, { volume: sfxVolume });
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
      this.currentMusic.setVolume(this.musicVolume);
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
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

