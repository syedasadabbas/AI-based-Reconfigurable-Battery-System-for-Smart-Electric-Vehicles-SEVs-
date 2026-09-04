import { AudioCue } from '@shared/schema';

export class AudioController {
  private audioContext: AudioContext | null = null;
  private oscillators: Map<AudioCue, OscillatorNode> = new Map();
  private gainNodes: Map<AudioCue, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private currentCue: AudioCue = AudioCue.IDLE;
  private isEnabled: boolean = false;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Audio context will be created on first user interaction
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.audioContext.destination);

        // Create oscillators for each engine state
        this.createEngineSound(AudioCue.IDLE, 80, 0.1);
        this.createEngineSound(AudioCue.CRUISE, 120, 0.15);
        this.createEngineSound(AudioCue.POWER, 180, 0.25);
        this.createEngineSound(AudioCue.MAX_POWER, 240, 0.35);

        this.isInitialized = true;
        console.log('Audio controller initialized');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  private createEngineSound(cue: AudioCue, baseFrequency: number, baseGain: number) {
    if (!this.audioContext || !this.masterGain) return;

    // Create oscillator for engine tone
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth'; // Harsh engine sound
    oscillator.frequency.value = baseFrequency;

    // Create gain node for this sound
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0; // Start silent

    // Add some noise/roughness with additional oscillator
    const noiseOsc = this.audioContext.createOscillator();
    noiseOsc.type = 'square';
    noiseOsc.frequency.value = baseFrequency * 0.5;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = baseGain * 0.3;

    // Create a low-pass filter for more realistic engine sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + baseFrequency * 2;
    filter.Q.value = 1;

    // Connect the audio graph
    oscillator.connect(filter);
    noiseOsc.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Start oscillators
    oscillator.start();
    noiseOsc.start();

    this.oscillators.set(cue, oscillator);
    this.gainNodes.set(cue, gainNode);
  }

  async enable() {
    await this.initialize();
    
    // Resume audio context if needed
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.isEnabled = true;
    this.updateAudioCue(this.currentCue);
  }

  disable() {
    this.isEnabled = false;
    if (!this.audioContext) return;
    
    this.gainNodes.forEach(gainNode => {
      gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext!.currentTime + 0.1
      );
    });
  }

  updateAudioCue(cue: AudioCue, speed: number = 1.0) {
    if (!this.isEnabled || !this.isInitialized || !this.audioContext) return;

    this.currentCue = cue;
    const currentTime = this.audioContext.currentTime;

    // Fade out all sounds
    this.gainNodes.forEach((gainNode, audioCue) => {
      const targetGain = audioCue === cue ? this.getTargetGain(cue) * Math.min(speed / 10, 1.0) : 0;
      gainNode.gain.linearRampToValueAtTime(targetGain, currentTime + 0.2);
    });

    // Adjust frequency based on speed
    const oscillator = this.oscillators.get(cue);
    if (oscillator) {
      const baseFreq = this.getBaseFrequency(cue);
      const speedMultiplier = 1 + (speed / 20) * 0.5; // Up to 50% frequency increase
      oscillator.frequency.linearRampToValueAtTime(
        baseFreq * speedMultiplier,
        currentTime + 0.2
      );
    }
  }

  private getTargetGain(cue: AudioCue): number {
    switch (cue) {
      case AudioCue.IDLE: return 0.05;
      case AudioCue.CRUISE: return 0.12;
      case AudioCue.POWER: return 0.20;
      case AudioCue.MAX_POWER: return 0.30;
      default: return 0.08;
    }
  }

  private getBaseFrequency(cue: AudioCue): number {
    switch (cue) {
      case AudioCue.IDLE: return 80;
      case AudioCue.CRUISE: return 120;
      case AudioCue.POWER: return 180;
      case AudioCue.MAX_POWER: return 240;
      default: return 100;
    }
  }

  playBumpSound() {
    if (!this.isEnabled || !this.isInitialized || !this.audioContext || !this.masterGain) return;

    // Create a short noise burst for bump effect
    const noise = this.audioContext.createOscillator();
    noise.type = 'square';
    noise.frequency.value = 50;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.15;

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start();
    noise.stop(this.audioContext.currentTime + 0.1);

    // Decay the gain
    noiseGain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    );
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  cleanup() {
    this.isEnabled = false;
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    this.oscillators.clear();
    this.gainNodes.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}
