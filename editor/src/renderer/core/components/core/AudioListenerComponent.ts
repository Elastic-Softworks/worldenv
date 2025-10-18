/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         AudioListenerComponent
           ---
           represents the audio listener position and orientation
           for 3D spatial audio.

           typically attached to the main camera or player entity,
           this component defines where audio is "heard" from
           in the 3D world space.

*/

import { Component, Vector3, PropertyMetadata } from '../Component';

/*
 * ===========================
        --- TYPES ---
 * ===========================
 */

export enum ListenerMode {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

/*
 * ===========================
        --- COMPONENT ---
 * ===========================
 */

/**
 * AudioListener component
 *
 * defines the position and orientation of the audio listener
 * in 3D space. controls global audio settings and provides
 * the reference point for spatial audio calculations.
 */
export class AudioListenerComponent extends Component {
  private _globalVolume: number = 1.0;
  private _lastPosition: Vector3 = { x: 0, y: 0, z: 0 };
  private _velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private static _activeListener: AudioListenerComponent | null = null;

  /**
   * AudioListenerComponent constructor
   */
  constructor() {
    super(
      'AudioListener',
      'Audio Listener',
      'Defines the position and orientation for 3D spatial audio',
      'Audio'
    );
  }

  /**
   * initializeProperties()
   *
   * sets up audio listener properties for global
   * audio control and 3D positioning.
   */
  protected initializeProperties(): void {
    /* global audio settings */

    this.defineProperty<number>('volume', 1.0, {
      type: 'number',
      displayName: 'Volume',
      description: 'Global audio volume multiplier',
      min: 0.0,
      max: 1.0,
      step: 0.01
    });

    this.defineProperty<boolean>('mute', false, {
      type: 'boolean',
      displayName: 'Mute',
      description: 'Mute all audio globally'
    });

    this.defineProperty<boolean>('pauseWhenUnfocused', true, {
      type: 'boolean',
      displayName: 'Pause When Unfocused',
      description: 'Pause audio when application loses focus'
    });

    /* 3D audio settings */

    this.defineProperty<boolean>('enable3D', true, {
      type: 'boolean',
      displayName: 'Enable 3D Audio',
      description: 'Enable spatial 3D audio positioning'
    });

    this.defineProperty<number>('dopplerFactor', 1.0, {
      type: 'number',
      displayName: 'Doppler Factor',
      description: 'Global doppler effect strength',
      min: 0.0,
      max: 5.0,
      step: 0.1,
      visible: (component: AudioListenerComponent) =>
        component.getProperty<boolean>('enable3D') === true
    });

    this.defineProperty<number>('speedOfSound', 343.3, {
      type: 'number',
      displayName: 'Speed of Sound',
      description: 'Speed of sound in units per second',
      min: 1.0,
      max: 10000.0,
      step: 1.0,
      visible: (component: AudioListenerComponent) =>
        component.getProperty<boolean>('enable3D') === true
    });

    /* listener orientation */

    this.defineProperty<Vector3>(
      'forward',
      { x: 0, y: 0, z: -1 },
      {
        type: 'vector3',
        displayName: 'Forward Vector',
        description: 'Direction the listener is facing',
        step: 0.1,
        visible: (component: AudioListenerComponent) =>
          component.getProperty<boolean>('enable3D') === true
      }
    );

    this.defineProperty<Vector3>(
      'up',
      { x: 0, y: 1, z: 0 },
      {
        type: 'vector3',
        displayName: 'Up Vector',
        description: 'Up direction for listener orientation',
        step: 0.1,
        visible: (component: AudioListenerComponent) =>
          component.getProperty<boolean>('enable3D') === true
      }
    );

    /* audio quality settings */

    this.defineProperty<number>('sampleRate', 44100, {
      type: 'number',
      displayName: 'Sample Rate',
      description: 'Audio sample rate in Hz',
      min: 8000,
      max: 96000,
      step: 1000,
      options: ['8000', '16000', '22050', '44100', '48000', '88200', '96000']
    });

    this.defineProperty<number>('bufferSize', 512, {
      type: 'number',
      displayName: 'Buffer Size',
      description: 'Audio buffer size (lower = less latency, higher = more stable)',
      min: 128,
      max: 4096,
      step: 128,
      options: ['128', '256', '512', '1024', '2048', '4096']
    });

    /* listener management */

    this.defineProperty<boolean>('isActive', true, {
      type: 'boolean',
      displayName: 'Is Active',
      description: 'Whether this listener is currently active'
    });

    this.defineProperty<number>('priority', 0, {
      type: 'number',
      displayName: 'Priority',
      description: 'Listener priority (higher values take precedence)',
      min: 0,
      max: 100,
      step: 1
    });
  }

  /*
   * ===========================
          --- GETTERS ---
   * ===========================
   */

  /**
   * getVolume()
   *
   * returns the global volume level.
   */
  getVolume(): number {
    return this.getProperty<number>('volume') || 1.0;
  }

  /**
   * isMuted()
   *
   * returns whether global audio is muted.
   */
  isMuted(): boolean {
    return this.getProperty<boolean>('mute') === true;
  }

  /**
   * is3DEnabled()
   *
   * returns whether 3D spatial audio is enabled.
   */
  is3DEnabled(): boolean {
    return this.getProperty<boolean>('enable3D') !== false;
  }

  /**
   * getForward()
   *
   * returns the normalized forward vector.
   */
  getForward(): Vector3 {
    const forward = this.getProperty<Vector3>('forward') || { x: 0, y: 0, z: -1 };
    return this.normalizeVector3(forward);
  }

  /**
   * getUp()
   *
   * returns the normalized up vector.
   */
  getUp(): Vector3 {
    const up = this.getProperty<Vector3>('up') || { x: 0, y: 1, z: 0 };
    return this.normalizeVector3(up);
  }

  /**
   * getVelocity()
   *
   * returns the current velocity for doppler calculations.
   */
  getVelocity(): Vector3 {
    return { ...this._velocity };
  }

  /**
   * isActive()
   *
   * returns whether this listener is active.
   */
  isActive(): boolean {
    return this.getProperty<boolean>('isActive') !== false;
  }

  /**
   * getPriority()
   *
   * returns the listener priority.
   */
  getPriority(): number {
    return this.getProperty<number>('priority') || 0;
  }

  /*
   * ===========================
          --- SETTERS ---
   * ===========================
   */

  /**
   * setVolume()
   *
   * sets the global volume level.
   */
  setVolume(volume: number): void {
    this.setProperty('volume', Math.max(0, Math.min(1, volume)));
    this.updateGlobalVolume();
  }

  /**
   * setMute()
   *
   * sets the global mute state.
   */
  setMute(mute: boolean): void {
    this.setProperty('mute', mute);
    this.updateGlobalVolume();
  }

  /**
   * setOrientation()
   *
   * sets the listener orientation with forward and up vectors.
   */
  setOrientation(forward: Vector3, up: Vector3): void {
    this.setProperty('forward', this.normalizeVector3(forward));
    this.setProperty('up', this.normalizeVector3(up));
    this.updateListenerOrientation();
  }

  /**
   * setActive()
   *
   * activates or deactivates this listener.
   */
  setActive(active: boolean): void {
    this.setProperty('isActive', active);

    if (active) {
      this.makeActive();
    } else if (AudioListenerComponent._activeListener === this) {
      AudioListenerComponent._activeListener = null;
    }
  }

  /*
   * ===========================
        --- LISTENER MGMT ---
   * ===========================
   */

  /**
   * makeActive()
   *
   * makes this the active audio listener.
   */
  makeActive(): void {
    /* check if this listener has higher priority */
    if (AudioListenerComponent._activeListener) {
      const currentPriority = AudioListenerComponent._activeListener.getPriority();
      if (this.getPriority() <= currentPriority) {
        return; /* current listener has higher or equal priority */
      }
    }

    /* deactivate previous listener */
    if (AudioListenerComponent._activeListener && AudioListenerComponent._activeListener !== this) {
      AudioListenerComponent._activeListener.setProperty('isActive', false);
    }

    /* activate this listener */
    AudioListenerComponent._activeListener = this;
    this.setProperty('isActive', true);
    this.updateGlobalAudioSettings();
  }

  /**
   * getActiveListener()
   *
   * returns the currently active audio listener.
   */
  static getActiveListener(): AudioListenerComponent | null {
    return AudioListenerComponent._activeListener;
  }

  /*
   * ===========================
         --- AUDIO UPDATE ---
   * ===========================
   */

  /**
   * updatePosition()
   *
   * updates the listener position and calculates velocity.
   * should be called by the engine when transform changes.
   */
  updatePosition(position: Vector3, deltaTime: number): void {
    if (!this.isActive() || !this.is3DEnabled()) {
      return;
    }

    /* calculate velocity for doppler effect */
    if (deltaTime > 0) {
      this._velocity = {
        x: (position.x - this._lastPosition.x) / deltaTime,
        y: (position.y - this._lastPosition.y) / deltaTime,
        z: (position.z - this._lastPosition.z) / deltaTime
      };
    }

    this._lastPosition = { ...position };

    /* update Web Audio API listener position */
    this.updateListenerPosition(position);
  }

  /**
   * updateListenerPosition()
   *
   * updates the Web Audio API listener position.
   */
  private updateListenerPosition(position: Vector3): void {
    /* this would integrate with the Web Audio API listener */
    /* in a real implementation, this would update AudioContext.listener */
    if (typeof AudioContext !== 'undefined' && (window as any).audioContext) {
      const context = (window as any).audioContext as AudioContext;
      if (context.listener) {
        context.listener.positionX.value = position.x;
        context.listener.positionY.value = position.y;
        context.listener.positionZ.value = position.z;
      }
    }
  }

  /**
   * updateListenerOrientation()
   *
   * updates the Web Audio API listener orientation.
   */
  private updateListenerOrientation(): void {
    if (!this.isActive() || !this.is3DEnabled()) {
      return;
    }

    const forward = this.getForward();
    const up = this.getUp();

    /* update Web Audio API listener orientation */
    if (typeof AudioContext !== 'undefined' && (window as any).audioContext) {
      const context = (window as any).audioContext as AudioContext;
      if (context.listener) {
        context.listener.forwardX.value = forward.x;
        context.listener.forwardY.value = forward.y;
        context.listener.forwardZ.value = forward.z;
        context.listener.upX.value = up.x;
        context.listener.upY.value = up.y;
        context.listener.upZ.value = up.z;
      }
    }
  }

  /**
   * updateGlobalVolume()
   *
   * updates the global audio volume.
   */
  private updateGlobalVolume(): void {
    if (!this.isActive()) {
      return;
    }

    const volume = this.isMuted() ? 0 : this.getVolume();
    this._globalVolume = volume;

    /* apply to global audio context gain node */
    /* this would require integration with a global audio manager */
  }

  /**
   * updateGlobalAudioSettings()
   *
   * updates global audio context settings.
   */
  private updateGlobalAudioSettings(): void {
    this.updateGlobalVolume();
    this.updateListenerOrientation();

    /* update doppler settings */
    const dopplerFactor = this.getProperty<number>('dopplerFactor') || 1.0;
    const speedOfSound = this.getProperty<number>('speedOfSound') || 343.3;

    /* this would set global doppler parameters on audio context */
  }

  /*
   * ===========================
          --- UTILS ---
   * ===========================
   */

  /**
   * normalizeVector3()
   *
   * normalizes a 3D vector to unit length.
   */
  private normalizeVector3(vec: Vector3): Vector3 {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

    if (length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: vec.x / length,
      y: vec.y / length,
      z: vec.z / length
    };
  }

  /**
   * calculateDistanceAttenuation()
   *
   * calculates volume attenuation based on distance from listener.
   */
  calculateDistanceAttenuation(
    sourcePosition: Vector3,
    minDistance: number,
    maxDistance: number
  ): number {
    if (!this.is3DEnabled()) {
      return 1.0;
    }

    const distance = Math.sqrt(
      Math.pow(sourcePosition.x - this._lastPosition.x, 2) +
        Math.pow(sourcePosition.y - this._lastPosition.y, 2) +
        Math.pow(sourcePosition.z - this._lastPosition.z, 2)
    );

    if (distance <= minDistance) {
      return 1.0;
    }

    if (distance >= maxDistance) {
      return 0.0;
    }

    /* logarithmic rolloff */
    return minDistance / distance;
  }

  /*
   * ===========================
        --- VALIDATION ---
   * ===========================
   */

  /**
   * validate()
   *
   * validates audio listener properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const volume = this.getVolume();
    const dopplerFactor = this.getProperty<number>('dopplerFactor') || 1;
    const speedOfSound = this.getProperty<number>('speedOfSound') || 343.3;
    const sampleRate = this.getProperty<number>('sampleRate') || 44100;

    /* validate volume */
    if (volume < 0 || volume > 1) {
      errors.push('Volume must be between 0 and 1');
    }

    /* validate doppler settings */
    if (dopplerFactor < 0 || dopplerFactor > 5) {
      errors.push('Doppler Factor must be between 0 and 5');
    }

    if (speedOfSound <= 0) {
      errors.push('Speed of Sound must be greater than zero');
    }

    /* validate sample rate */
    const validSampleRates = [8000, 16000, 22050, 44100, 48000, 88200, 96000];
    if (!validSampleRates.includes(sampleRate)) {
      errors.push('Sample Rate must be a standard audio sample rate');
    }

    /* validate orientation vectors */
    const forward = this.getProperty<Vector3>('forward') || { x: 0, y: 0, z: -1 };
    const up = this.getProperty<Vector3>('up') || { x: 0, y: 1, z: 0 };

    const forwardLength = Math.sqrt(
      forward.x * forward.x + forward.y * forward.y + forward.z * forward.z
    );
    const upLength = Math.sqrt(up.x * up.x + up.y * up.y + up.z * up.z);

    if (forwardLength === 0) {
      errors.push('Forward vector cannot be zero length');
    }

    if (upLength === 0) {
      errors.push('Up vector cannot be zero length');
    }

    /* check if forward and up are perpendicular */
    const dotProduct = forward.x * up.x + forward.y * up.y + forward.z * up.z;
    if (Math.abs(dotProduct) > 0.1) {
      errors.push('Forward and Up vectors should be perpendicular');
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * handles property changes and updates audio settings.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    if (!this.isActive()) {
      return;
    }

    /* update global settings when properties change */
    switch (key) {
      case 'volume':
      case 'mute':
        this.updateGlobalVolume();
        break;

      case 'forward':
      case 'up':
        /* normalize vectors */
        if (key === 'forward' || key === 'up') {
          const normalized = this.normalizeVector3(value as Vector3);
          this.setProperty(key, normalized);
        }
        this.updateListenerOrientation();
        break;

      case 'enable3D':
      case 'dopplerFactor':
      case 'speedOfSound':
        this.updateGlobalAudioSettings();
        break;

      case 'isActive':
        if (value) {
          this.makeActive();
        }
        break;
    }
  }

  /**
   * onDestroy()
   *
   * cleanup when component is destroyed.
   */
  onDestroy(): void {
    if (AudioListenerComponent._activeListener === this) {
      AudioListenerComponent._activeListener = null;
    }
  }
}

/*
 * ===========================
       --- FACTORY ---
 * ===========================
 */

/**
 * createAudioListenerComponent()
 *
 * audio listener component factory function.
 */
export function createAudioListenerComponent(): AudioListenerComponent {
  return new AudioListenerComponent();
}

/* EOF */
