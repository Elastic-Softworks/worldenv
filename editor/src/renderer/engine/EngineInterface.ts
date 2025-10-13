/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Interface (Renderer)
 *
 * Renderer-side interface for engine integration.
 * Communicates with main process engine service via IPC.
 */

import { SceneData } from '../../shared/types/SceneTypes';

export interface EngineState {
  isInitialized: boolean;
  isRunning: boolean;
  isPlayMode: boolean;
  isPaused: boolean;
  hasErrors: boolean;
  errorMessage?: string;
}

export interface EngineStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  memory: number;
}

export interface EngineInfo {
  version: string;
  features: string[];
  formats: string[];
  status: string;
}

export type EngineEventListener = (event: string, ...args: unknown[]) => void;

/**
 * EngineInterface class
 *
 * Renderer-side engine interface for play mode and scene operations.
 * Provides abstraction over IPC communication with engine service.
 */
export class EngineInterface {
  private static instance: EngineInterface | null = null;
  private listeners: Map<string, Set<EngineEventListener>> = new Map();
  private state: EngineState = {
    isInitialized: false,
    isRunning: false,
    isPlayMode: false,
    isPaused: false,
    hasErrors: false
  };

  constructor() {
    this.setupIPCListeners();
  }

  /**
   * getInstance()
   *
   * Get singleton instance.
   */
  static getInstance(): EngineInterface {
    if (!EngineInterface.instance) {
      EngineInterface.instance = new EngineInterface();
    }
    return EngineInterface.instance;
  }

  /**
   * isEngineReady()
   *
   * Check if engine is ready for operations.
   */
  isEngineReady(): boolean {
    return this.state.isInitialized && !this.state.hasErrors;
  }

  /**
   * isInPlayMode()
   *
   * Check if engine is in play mode.
   */
  isInPlayMode(): boolean {
    return this.state.isPlayMode;
  }

  /**
   * isPaused()
   *
   * Check if engine is paused.
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * getState()
   *
   * Get current engine state.
   */
  getState(): EngineState {
    return { ...this.state };
  }

  /**
   * getEngineInfo()
   *
   * Get engine information.
   */
  async getEngineInfo(): Promise<EngineInfo> {
    try {
      const info = await window.worldedit.engine.getEngineInfo();
      return info as EngineInfo;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to get engine info:', error);
      throw error;
    }
  }

  /**
   * startPlayMode()
   *
   * Start play mode.
   */
  async startPlayMode(): Promise<void> {
    try {
      this.emit('playModeStarting');

      // For now, just update local state
      // In full implementation, this would communicate with engine service
      await Promise.resolve();
      this.updateState({
        isPlayMode: true,
        isRunning: true,
        isPaused: false
      });

      this.emit('playModeStarted');
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to start play mode:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * stopPlayMode()
   *
   * Stop play mode.
   */
  stopPlayMode(): void {
    try {
      this.emit('playModeStopping');

      this.updateState({
        isPlayMode: false,
        isRunning: false,
        isPaused: false
      });

      this.emit('playModeStopped');
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to stop play mode:', error);
      this.emit('error', error);
    }
  }

  /**
   * pausePlayMode()
   *
   * Pause play mode.
   */
  pausePlayMode(): void {
    if (!this.state.isPlayMode) {
      return;
    }

    this.updateState({
      isPaused: true,
      isRunning: false
    });

    this.emit('playModePaused');
  }

  /**
   * resumePlayMode()
   *
   * Resume play mode.
   */
  resumePlayMode(): void {
    if (!this.state.isPlayMode || !this.state.isPaused) {
      return;
    }

    this.updateState({
      isPaused: false,
      isRunning: true
    });

    this.emit('playModeResumed');
  }

  /**
   * exportScene()
   *
   * Export scene to engine format.
   */
  async exportScene(sceneData: SceneData, options?: Record<string, unknown>): Promise<unknown> {
    try {
      const result = await window.worldedit.engine.exportScene(sceneData, options);
      return result;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to export scene:', error);
      throw error;
    }
  }

  /**
   * validateScene()
   *
   * Validate scene data.
   */
  async validateScene(sceneData: SceneData): Promise<unknown> {
    try {
      const result = await window.worldedit.engine.validateScene(sceneData);
      return result;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to validate scene:', error);
      throw error;
    }
  }

  /**
   * saveScene()
   *
   * Save scene to file.
   */
  async saveScene(path: string, sceneData: SceneData): Promise<void> {
    try {
      await window.worldedit.engine.saveScene(path, sceneData);
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to save scene:', error);
      throw error;
    }
  }

  /**
   * loadScene()
   *
   * Load scene from file.
   */
  async loadScene(path: string): Promise<SceneData> {
    try {
      const sceneData = await window.worldedit.engine.loadScene(path);
      return sceneData as SceneData;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to load scene:', error);
      throw error;
    }
  }

  /**
   * addEventListener()
   *
   * Add event listener.
   */
  addEventListener(event: string, listener: EngineEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * removeEventListener()
   *
   * Remove event listener.
   */
  removeEventListener(event: string, listener: EngineEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * emit()
   *
   * Emit event to listeners.
   */
  private emit(event: string, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(event, ...args);
        } catch (error) {
          console.error('[ENGINE_INTERFACE] Event listener error:', error);
        }
      }
    }
  }

  /**
   * updateState()
   *
   * Update engine state and emit change event.
   */
  private updateState(changes: Partial<EngineState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...changes };

    this.emit('stateChanged', this.state, oldState);
  }

  /**
   * setupIPCListeners()
   *
   * Set up IPC event listeners for engine communication.
   */
  private setupIPCListeners(): void {
    // Listen for engine events from main process
    if (window.worldedit?.on) {
      window.worldedit.on('engine:state-changed', (...args: unknown[]) => {
        const state = args[0] as EngineState;
        this.state = state;
        this.emit('stateChanged', state);
      });

      window.worldedit.on('engine:error', (...args: unknown[]) => {
        const error = args[0] as Error;
        this.updateState({ hasErrors: true, errorMessage: error.message });
        this.emit('error', error);
      });

      window.worldedit.on('engine:initialized', () => {
        this.updateState({ isInitialized: true, hasErrors: false });
        this.emit('ready');
      });
    }
  }
}
