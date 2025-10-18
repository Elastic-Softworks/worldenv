/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         AudioSourceComponent
           ---
           handles audio playback for entities with support
           for 2D and 3D spatial audio.

           provides volume control, pitch adjustment, looping,
           and distance-based attenuation for realistic
           audio experiences in games.

*/

import { Component, Vector3, PropertyMetadata } from '../Component';

/*
 * ===========================
        --- TYPES ---
 * ===========================
 */

export enum AudioRolloffMode {
  LOGARITHMIC = 'logarithmic',
  LINEAR = 'linear',
  CUSTOM = 'custom',
}

export enum AudioState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused',
}

/*
 * ===========================
        --- COMPONENT ---
 * ===========================
 */

/**
 * AudioSource component
 *
 * plays audio clips from entities with full 3D spatial
 * audio support. handles volume, pitch, looping, and
 * distance-based attenuation.
 */
export class AudioSourceComponent extends Component {

  private _audioContext: AudioContext | null = null;
  private _audioBuffer: AudioBuffer | null = null;
  private _sourceNode: AudioBufferSourceNode | null = null;
  private _gainNode: GainNode | null = null;
  private _pannerNode: PannerNode | null = null;
  private _currentState: AudioState = AudioState.STOPPED;
  private _playbackTime: number = 0;
  private _pausedAt: number = 0;

  /**
   * AudioSourceComponent constructor
   */
  constructor() {

    super(
      'AudioSource',
      'Audio Source',
      'Plays audio clips with 2D and 3D spatial audio support',
      'Audio'
    );

  }

  /**
   * initializeProperties()
   *
   * sets up audio source properties with proper
   * defaults for both 2D and 3D audio playback.
   */
  protected initializeProperties(): void {

    /* audio clip and playback */

    this.defineProperty<string>(
      'audioClip',
      '',
      {
        type: 'asset',
        displayName: 'Audio Clip',
        description: 'Audio file to play (MP3, WAV, OGG)',
        assetTypes: ['audio'],
      }
    );

    this.defineProperty<boolean>(
      'playOnAwake',
      false,
      {
        type: 'boolean',
        displayName: 'Play On Awake',
        description: 'Start playing when the entity is created',
      }
    );

    this.defineProperty<boolean>(
      'loop',
      false,
      {
        type: 'boolean',
        displayName: 'Loop',
        description: 'Repeat playback when audio finishes',
      }
    );

    /* volume and pitch */

    this.defineProperty<number>(
      'volume',
      1.0,
      {
        type: 'number',
        displayName: 'Volume',
        description: 'Playback volume (0 = silent, 1 = full volume)',
        min: 0.0,
        max: 1.0,
        step: 0.01,
      }
    );

    this.defineProperty<number>(
      'pitch',
      1.0,
      {
        type: 'number',
        displayName: 'Pitch',
        description: 'Playback speed and pitch multiplier',
        min: 0.1,
        max: 3.0,
        step: 0.01,
      }
    );

    this.defineProperty<boolean>(
      'mute',
      false,
      {
        type: 'boolean',
        displayName: 'Mute',
        description: 'Temporarily disable audio output',
      }
    );

    /* 3D spatial audio */

    this.defineProperty<boolean>(
      'spatialBlend',
      false,
      {
        type: 'boolean',
        displayName: '3D Sound',
        description: 'Enable 3D spatial audio positioning',
      }
    );

    this.defineProperty<number>(
      'minDistance',
      1.0,
      {
        type: 'number',
        displayName: 'Min Distance',
        description: 'Distance at which audio is at full volume',
        min: 0.1,
        max: 1000.0,
        step: 0.1,
        visible: (component: AudioSourceComponent) =>
          component.getProperty<boolean>('spatialBlend') === true,
      }
    );

    this.defineProperty<number>(
      'maxDistance',
      100.0,
      {
        type: 'number',
        displayName: 'Max Distance',
        description: 'Distance at which audio becomes inaudible',
        min: 1.0,
        max: 10000.0,
        step: 1.0,
        visible: (component: AudioSourceComponent) =>
          component.getProperty<boolean>('spatialBlend') === true,
      }
    );

    this.defineProperty<AudioRolloffMode>(
      'rolloffMode',
      AudioRolloffMode.LOGARITHMIC,
      {
        type: 'enum',
        displayName: 'Rolloff Mode',
        description: 'How volume decreases with distance',
        options: Object.values(AudioRolloffMode),
        visible: (component: AudioSourceComponent) =>
          component.getProperty<boolean>('spatialBlend') === true,
      }
    );

    this.defineProperty<number>(
      'dopplerLevel',
      1.0,
      {
        type: 'number',
        displayName: 'Doppler Level',
        description: 'Strength of doppler effect for moving sources',
        min: 0.0,
        max: 5.0,
        step: 0.1,
        visible: (component: AudioSourceComponent) =>
          component.getProperty<boolean>('spatialBlend') === true,
      }
    );

    /* priority and mixing */

    this.defineProperty<number>(
      'priority',
      128,
      {
        type: 'number',
        displayName: 'Priority',
        description: 'Audio priority (0 = highest, 255 = lowest)',
        min: 0,
        max: 255,
        step: 1,
      }
    );

    this.defineProperty<string>(
      'outputAudioMixerGroup',
      'Master',
      {
        type: 'string',
        displayName: 'Output',
        description: 'Audio mixer group for this source',
      }
    );

  }

  /*
   * ===========================
          --- GETTERS ---
   * ===========================
   */

  /**
   * getAudioClip()
   *
   * returns the current audio clip asset path.
   */
  getAudioClip(): string {
    return this.getProperty<string>('audioClip') || '';
  }

  /**
   * getVolume()
   *
   * returns the current volume level.
   */
  getVolume(): number {
    return this.getProperty<number>('volume') || 1.0;
  }

  /**
   * getPitch()
   *
   * returns the current pitch multiplier.
   */
  getPitch(): number {
    return this.getProperty<number>('pitch') || 1.0;
  }

  /**
   * isLooping()
   *
   * returns whether audio is set to loop.
   */
  isLooping(): boolean {
    return this.getProperty<boolean>('loop') === true;
  }

  /**
   * isMuted()
   *
   * returns whether audio is muted.
   */
  isMuted(): boolean {
    return this.getProperty<boolean>('mute') === true;
  }

  /**
   * is3D()
   *
   * returns whether 3D spatial audio is enabled.
   */
  is3D(): boolean {
    return this.getProperty<boolean>('spatialBlend') === true;
  }

  /**
   * getState()
   *
   * returns current playback state.
   */
  getState(): AudioState {
    return this._currentState;
  }

  /**
   * isPlaying()
   *
   * returns whether audio is currently playing.
   */
  isPlaying(): boolean {
    return this._currentState === AudioState.PLAYING;
  }

  /**
   * isPaused()
   *
   * returns whether audio is paused.
   */
  isPaused(): boolean {
    return this._currentState === AudioState.PAUSED;
  }

  /*
   * ===========================
          --- PLAYBACK ---
   * ===========================
   */

  /**
   * play()
   *
   * starts or resumes audio playback.
   */
  async play(): Promise<void> {

    if (!this.getAudioClip()) {
      console.warn('AudioSource: No audio clip assigned');
      return;
    }

    /* initialize audio context if needed */
    if (!this._audioContext) {
      await this.initializeAudioContext();
    }

    /* load audio buffer if needed */
    if (!this._audioBuffer) {
      await this.loadAudioClip();
    }

    if (!this._audioBuffer) {
      console.error('AudioSource: Failed to load audio clip');
      return;
    }

    /* stop any existing playback */
    this.stop();

    /* create and configure audio nodes */
    this.createAudioNodes();

    /* start playback */
    const offset = this._currentState === AudioState.PAUSED ? this._pausedAt : 0;
    this._sourceNode!.start(0, offset);
    this._currentState = AudioState.PLAYING;
    this._playbackTime = this._audioContext!.currentTime - offset;

  }

  /**
   * pause()
   *
   * pauses audio playback.
   */
  pause(): void {

    if (this._currentState !== AudioState.PLAYING) {
      return;
    }

    if (this._sourceNode) {
      this._sourceNode.stop();
      this._pausedAt = this._audioContext!.currentTime - this._playbackTime;
    }

    this._currentState = AudioState.PAUSED;

  }

  /**
   * stop()
   *
   * stops audio playback and resets position.
   */
  stop(): void {

    if (this._sourceNode) {
      this._sourceNode.stop();
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }

    this._currentState = AudioState.STOPPED;
    this._playbackTime = 0;
    this._pausedAt = 0;

  }

  /**
   * setVolume()
   *
   * sets the playback volume.
   */
  setVolume(volume: number): void {
    this.setProperty('volume', Math.max(0, Math.min(1, volume)));
    this.updateGainNode();
  }

  /**
   * setPitch()
   *
   * sets the playback pitch/speed.
   */
  setPitch(pitch: number): void {
    this.setProperty('pitch', Math.max(0.1, Math.min(3.0, pitch)));
    this.updateSourceNode();
  }

  /*
   * ===========================
         --- AUDIO SETUP ---
   * ===========================
   */

  /**
   * initializeAudioContext()
   *
   * creates and initializes the Web Audio API context.
   */
  private async initializeAudioContext(): Promise<void> {

    try {

      this._audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      /* resume context if suspended (required by browser policies) */
      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

    } catch (error) {
      console.error('AudioSource: Failed to initialize audio context:', error);
    }

  }

  /**
   * loadAudioClip()
   *
   * loads and decodes the audio file.
   */
  private async loadAudioClip(): Promise<void> {

    const clipPath = this.getAudioClip();
    if (!clipPath || !this._audioContext) {
      return;
    }

    try {

      const response = await fetch(clipPath);
      const arrayBuffer = await response.arrayBuffer();
      this._audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer);

    } catch (error) {
      console.error(`AudioSource: Failed to load audio clip "${clipPath}":`, error);
    }

  }

  /**
   * createAudioNodes()
   *
   * creates and connects Web Audio API nodes.
   */
  private createAudioNodes(): void {

    if (!this._audioContext || !this._audioBuffer) {
      return;
    }

    /* create source node */
    this._sourceNode = this._audioContext.createBufferSource();
    this._sourceNode.buffer = this._audioBuffer;
    this._sourceNode.loop = this.isLooping();
    this._sourceNode.playbackRate.value = this.getPitch();

    /* create gain node for volume control */
    this._gainNode = this._audioContext.createGain();
    this.updateGainNode();

    /* create panner node for 3D audio */
    if (this.is3D()) {
      this._pannerNode = this._audioContext.createPanner();
      this.updatePannerNode();
      this._sourceNode.connect(this._pannerNode);
      this._pannerNode.connect(this._gainNode);
    } else {
      this._sourceNode.connect(this._gainNode);
    }

    /* connect to destination */
    this._gainNode.connect(this._audioContext.destination);

    /* handle playback end */
    this._sourceNode.onended = () => {
      if (!this.isLooping()) {
        this._currentState = AudioState.STOPPED;
        this._playbackTime = 0;
        this._pausedAt = 0;
      }
    };

  }

  /**
   * updateGainNode()
   *
   * updates volume settings on the gain node.
   */
  private updateGainNode(): void {

    if (!this._gainNode) {
      return;
    }

    const volume = this.isMuted() ? 0 : this.getVolume();
    this._gainNode.gain.value = volume;

  }

  /**
   * updateSourceNode()
   *
   * updates pitch settings on the source node.
   */
  private updateSourceNode(): void {

    if (!this._sourceNode) {
      return;
    }

    this._sourceNode.playbackRate.value = this.getPitch();

  }

  /**
   * updatePannerNode()
   *
   * updates 3D spatial audio settings.
   */
  private updatePannerNode(): void {

    if (!this._pannerNode) {
      return;
    }

    /* set distance model */
    const rolloffMode = this.getProperty<AudioRolloffMode>('rolloffMode') || AudioRolloffMode.LOGARITHMIC;
    const minDistance = this.getProperty<number>('minDistance') || 1.0;
    const maxDistance = this.getProperty<number>('maxDistance') || 100.0;

    switch (rolloffMode) {
      case AudioRolloffMode.LINEAR:
        this._pannerNode.distanceModel = 'linear';
        break;
      case AudioRolloffMode.LOGARITHMIC:
        this._pannerNode.distanceModel = 'inverse';
        break;
      case AudioRolloffMode.CUSTOM:
        this._pannerNode.distanceModel = 'exponential';
        break;
    }

    this._pannerNode.refDistance = minDistance;
    this._pannerNode.maxDistance = maxDistance;
    this._pannerNode.rolloffFactor = 1.0;

    /* set panning model for better 3D audio */
    this._pannerNode.panningModel = 'HRTF';
    this._pannerNode.coneInnerAngle = 360;
    this._pannerNode.coneOuterAngle = 360;
    this._pannerNode.coneOuterGain = 0;

  }

  /**
   * updatePosition()
   *
   * updates 3D position for spatial audio.
   * should be called by the engine when transform changes.
   */
  updatePosition(position: Vector3): void {

    if (!this._pannerNode || !this.is3D()) {
      return;
    }

    this._pannerNode.positionX.value = position.x;
    this._pannerNode.positionY.value = position.y;
    this._pannerNode.positionZ.value = position.z;

  }

  /*
   * ===========================
        --- VALIDATION ---
   * ===========================
   */

  /**
   * validate()
   *
   * validates audio source properties.
   */
  validate(): string[] {

    const errors = super.validate();

    const audioClip = this.getAudioClip();
    const volume = this.getVolume();
    const pitch = this.getPitch();
    const minDistance = this.getProperty<number>('minDistance') || 1;
    const maxDistance = this.getProperty<number>('maxDistance') || 100;

    /* validate audio clip */
    if (!audioClip) {
      errors.push('Audio Source requires an audio clip to be assigned');
    }

    /* validate volume */
    if (volume < 0 || volume > 1) {
      errors.push('Volume must be between 0 and 1');
    }

    /* validate pitch */
    if (pitch < 0.1 || pitch > 3.0) {
      errors.push('Pitch must be between 0.1 and 3.0');
    }

    /* validate 3D audio settings */
    if (this.is3D()) {
      if (minDistance <= 0) {
        errors.push('Min Distance must be greater than zero');
      }
      if (maxDistance <= minDistance) {
        errors.push('Max Distance must be greater than Min Distance');
      }
    }

    return errors;

  }

  /**
   * onPropertyChanged()
   *
   * handles property changes and updates audio nodes.
   */
  protected onPropertyChanged(key: string, value: any): void {

    super.onPropertyChanged(key, value);

    /* update audio nodes when properties change */
    switch (key) {

      case 'volume':
      case 'mute':
        this.updateGainNode();
        break;

      case 'pitch':
        this.updateSourceNode();
        break;

      case 'loop':
        if (this._sourceNode) {
          this._sourceNode.loop = value as boolean;
        }
        break;

      case 'spatialBlend':
      case 'minDistance':
      case 'maxDistance':
      case 'rolloffMode':
        if (this.is3D()) {
          this.updatePannerNode();
        }
        break;

      case 'audioClip':
        /* reload audio when clip changes */
        this._audioBuffer = null;
        this.stop();
        break;

    }

  }

  /**
   * onDestroy()
   *
   * cleanup when component is destroyed.
   */
  onDestroy(): void {
    this.stop();
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
    }
  }

}

/*
 * ===========================
       --- FACTORY ---
 * ===========================
 */

/**
 * createAudioSourceComponent()
 *
 * audio source component factory function.
 */
export function createAudioSourceComponent(): AudioSourceComponent {
  return new AudioSourceComponent();
}

/* EOF */
