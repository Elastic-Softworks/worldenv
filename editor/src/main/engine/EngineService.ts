/*
   ===============================================================
   WORLDEDIT ENGINE SERVICE
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import {
  EngineWrapper,
  EngineConfig,
  EngineEvent,
  EngineState,
  EngineStats
} from './EngineWrapper'; /* ENGINE WRAPPER INTEGRATION */
import { SceneData } from '../../shared/types/SceneTypes'; /* SCENE DATA TYPES */
import { EventEmitter } from 'events'; /* EVENT SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         EngineServiceConfig
	       ---
	       configuration interface for engine service behavior
	       controlling synchronization, debugging, performance,
	       and profiling features during engine operations.

*/

export interface EngineServiceConfig {
  enableAutoSync: boolean /* automatic scene synchronization */;
  enableDebugMode: boolean /* engine debug information display */;
  maxFPS: number /* maximum frames per second limit */;
  enableProfiling: boolean /* performance profiling data collection */;
}

/*

         EngineServiceEvent
	       ---
	       enumeration of events emitted by the engine service
	       during lifecycle operations. provides notifications
	       for engine state changes and synchronization events.

*/

export enum EngineServiceEvent {
  ENGINE_READY = 'engineReady' /* engine initialization completed */,
  ENGINE_ERROR = 'engineError' /* engine error occurred */,
  PLAY_MODE_CHANGED = 'playModeChanged' /* play/edit mode changed */,
  SCENE_SYNCED = 'sceneSynced' /* scene synchronization completed */,
  STATS_UPDATED = 'statsUpdated' /* performance statistics updated */
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         EngineService
	       ---
	       high-level service layer that manages engine integration
	       within the editor environment. provides a simplified
	       interface for engine operations, state management, and
	       synchronization between editor and runtime systems.

	       the service orchestrates engine lifecycle, scene
	       synchronization, play mode transitions, and performance
	       monitoring. it abstracts the complexity of the underlying
	       engine wrapper and provides event-driven notifications
	       for UI updates.

*/
 *
 * Manages engine integration and provides editor interface.
 * Handles engine lifecycle, scene synchronization, and play mode.
 */
export class EngineService extends EventEmitter {
  private static instance: EngineService | null = null;
  private engineWrapper: EngineWrapper | null = null;
  private config: EngineServiceConfig;
  private isInitialized: boolean = false;
  private currentCanvas: HTMLCanvasElement | null = null;
  private autoSyncEnabled: boolean = true;
  private lastSyncHash: string = '';

  constructor(config: EngineServiceConfig) {
    super();
    this.config = config;
  }

  /**
   * getInstance()
   *
   * Get singleton instance of EngineService.
   */
  static getInstance(config?: EngineServiceConfig): EngineService {
    if (!EngineService.instance) {
      if (!config) {
        throw new Error('EngineService config required for first initialization');
      }
      EngineService.instance = new EngineService(config);
    }
    return EngineService.instance;
  }

  /**
   * initialize()
   *
   * Initialize engine service with canvas.
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    try {
      if (this.isInitialized) {
        throw new Error('EngineService already initialized');
      }

      this.currentCanvas = canvas;

      /* CREATE ENGINE WRAPPER */
      const engineConfig: EngineConfig = {
        canvas,
        width: canvas.width,
        height: canvas.height,
        enableDebug: this.config.enableDebugMode
      };

      this.engineWrapper = new EngineWrapper(engineConfig);
      this.setupEngineEventHandlers();

      /* INITIALIZE ENGINE */
      await this.engineWrapper.initialize();

      /* ENGINE READY FOR SYNC */
      console.log('[ENGINE_SERVICE] Engine ready for scene synchronization');

      this.isInitialized = true;
      this.emit(EngineServiceEvent.ENGINE_READY);
    } catch (error) {
      console.error('[ENGINE_SERVICE] Initialization failed:', error);
      this.emit(EngineServiceEvent.ENGINE_ERROR, error);
      throw error;
    }
  }

  /**
   * dispose()
   *
   * Clean up engine service resources.
   */
  dispose(): void {
    if (this.engineWrapper) {
      this.engineWrapper.dispose();
      this.engineWrapper = null;
    }

    this.currentCanvas = null;
    this.isInitialized = false;
    this.removeAllListeners();
  }

  /**
   * isEngineReady()
   *
   * Check if engine is ready for operations.
   */
  isEngineReady(): boolean {
    return (
      this.isInitialized &&
      this.engineWrapper !== null &&
      this.engineWrapper.getState().isInitialized
    );
  }

  /**
   * getEngineState()
   *
   * Get current engine state.
   */
  getEngineState(): EngineState | null {
    return this.engineWrapper?.getState() ?? null;
  }

  /**
   * getEngineStats()
   *
   * Get current engine statistics.
   */
  getEngineStats(): EngineStats | null {
    return this.engineWrapper?.getStats() ?? null;
  }

  /**
   * startPlayMode()
   *
   * Start engine play mode.
   */
  async startPlayMode(): Promise<void> {
    if (!this.isEngineReady() || !this.engineWrapper) {
      throw new Error('Engine not ready');
    }

    try {
      /* ENGINE READY FOR PLAY MODE */
      console.log('[ENGINE_SERVICE] Starting play mode');

      /* START PLAY MODE */
      this.engineWrapper.startPlayMode();
      await Promise.resolve();

      this.emit(EngineServiceEvent.PLAY_MODE_CHANGED, true);
    } catch (error) {
      console.error('[ENGINE_SERVICE] Failed to start play mode:', error);
      this.emit(EngineServiceEvent.ENGINE_ERROR, error);
      throw error;
    }
  }

  /**
   * stopPlayMode()
   *
   * Stop engine play mode.
   */
  stopPlayMode(): void {
    if (!this.engineWrapper) {
      return;
    }

    try {
      this.engineWrapper.stopPlayMode();
      this.emit(EngineServiceEvent.PLAY_MODE_CHANGED, false);
    } catch (error) {
      console.error('[ENGINE_SERVICE] Failed to stop play mode:', error);
      this.emit(EngineServiceEvent.ENGINE_ERROR, error);
    }
  }

  /**
   * pausePlayMode()
   *
   * Pause engine execution.
   */
  pausePlayMode(): void {
    if (!this.engineWrapper) {
      return;
    }

    this.engineWrapper.pausePlayMode();
  }

  /**
   * resumePlayMode()
   *
   * Resume engine execution.
   */
  resumePlayMode(): void {
    if (!this.engineWrapper) {
      return;
    }

    this.engineWrapper.resumePlayMode();
  }

  /**
   * isInPlayMode()
   *
   * Check if engine is in play mode.
   */
  isInPlayMode(): boolean {
    const state = this.getEngineState();
    return state?.isPlayMode ?? false;
  }

  /**
   * syncScene()
   *
   * Synchronize scene data with engine.
   */
  async syncScene(sceneData: SceneData): Promise<void> {
    if (!this.isEngineReady() || !this.engineWrapper) {
      return;
    }

    try {
      const sceneHash = this.generateSceneHash(sceneData);

      /* SKIP SYNC IF SCENE UNCHANGED */
      if (sceneHash === this.lastSyncHash && !this.config.enableDebugMode) {
        return;
      }

      await this.engineWrapper.loadScene(sceneData);
      this.lastSyncHash = sceneHash;

      this.emit(EngineServiceEvent.SCENE_SYNCED, sceneData);
    } catch (error) {
      console.error('[ENGINE_SERVICE] Scene sync failed:', error);
      this.emit(EngineServiceEvent.ENGINE_ERROR, error);
    }
  }

  /**
   * forceSceneSync()
   *
   * Force scene synchronization regardless of changes.
   */
  async forceSceneSync(sceneData: SceneData): Promise<void> {
    this.lastSyncHash = '';
    await this.syncScene(sceneData);
  }

  /**
   * resizeEngine()
   *
   * Resize engine viewport.
   */
  resizeEngine(width: number, height: number): void {
    if (!this.engineWrapper) {
      return;
    }

    this.engineWrapper.resize(width, height);
  }

  /**
   * setAutoSync()
   *
   * Enable or disable automatic scene synchronization.
   */
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  /**
   * getAutoSync()
   *
   * Get auto sync status.
   */
  getAutoSync(): boolean {
    return this.autoSyncEnabled;
  }

  /**
   * setupEventHandlers()
   *
   * Set up engine event handlers.
   */
  private setupEventHandlers(): void {
    /* ENGINE EVENT HANDLERS SETUP */
    console.log('[ENGINE_SERVICE] Event handlers initialized');
  }

  /**
   * setupEngineEventHandlers()
   *
   * Set up engine wrapper event handlers.
   */
  private setupEngineEventHandlers(): void {
    if (!this.engineWrapper) {
      return;
    }

    this.engineWrapper.on(EngineEvent.ERROR, (error: Error) => {
      this.emit(EngineServiceEvent.ENGINE_ERROR, error);
    });

    this.engineWrapper.on(EngineEvent.STATS_UPDATED, (stats: EngineStats) => {
      this.emit(EngineServiceEvent.STATS_UPDATED, stats);
    });

    this.engineWrapper.on(EngineEvent.PLAY_MODE_STARTED, () => {
      this.emit(EngineServiceEvent.PLAY_MODE_CHANGED, true);
    });

    this.engineWrapper.on(EngineEvent.PLAY_MODE_STOPPED, () => {
      this.emit(EngineServiceEvent.PLAY_MODE_CHANGED, false);
    });
  }

  /**
   * generateSceneHash()
   *
   * Generate hash for scene change detection.
   */
  private generateSceneHash(sceneData: SceneData): string {
    const jsonString = JSON.stringify(sceneData);
    let hash = 0;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; /* CONVERT TO 32-BIT INTEGER */
    }

    return hash.toString();
  }
}
