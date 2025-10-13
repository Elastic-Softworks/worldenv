/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Wrapper
 *
 * Wraps WORLDENV runtime for editor integration.
 * Provides controlled access to engine functionality.
 */

// Type-only import to avoid rootDir issues
interface Game {
  init(): Promise<void>;
  run(): void;
  stop(): void;
  canvas?: HTMLCanvasElement;
}
import { SceneData } from '../../shared/types/SceneTypes';
import { EventEmitter } from 'events';

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  enableDebug: boolean;
}

export interface EngineStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  memory: number;
}

export interface EngineState {
  isInitialized: boolean;
  isRunning: boolean;
  isPlayMode: boolean;
  isPaused: boolean;
  hasErrors: boolean;
  errorMessage?: string;
}

export enum EngineEvent {
  INITIALIZED = 'initialized',
  ERROR = 'error',
  STATE_CHANGED = 'stateChanged',
  PLAY_MODE_STARTED = 'playModeStarted',
  PLAY_MODE_STOPPED = 'playModeStopped',
  SCENE_LOADED = 'sceneLoaded',
  ENTITY_SELECTED = 'entitySelected',
  STATS_UPDATED = 'statsUpdated'
}

/**
 * EngineWrapper class
 *
 * Manages WORLDENV engine instance within editor context.
 * Handles initialization, scene loading, and play mode.
 */
export class EngineWrapper extends EventEmitter {
  private game: Game | null = null;
  private config: EngineConfig;
  private state: EngineState;
  private stats: EngineStats;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private statsInterval: number | null = null;
  private editorSnapshot: SceneData | null = null;

  constructor(config: EngineConfig) {
    super();
    this.config = config;
    this.state = {
      isInitialized: false,
      isRunning: false,
      isPlayMode: false,
      isPaused: false,
      hasErrors: false
    };
    this.stats = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      memory: 0
    };
  }

  /**
   * initialize()
   *
   * Initialize WORLDENV engine instance.
   */
  async initialize(): Promise<void> {
    try {
      if (this.state.isInitialized) {
        throw new Error('Engine already initialized');
      }

      /* CREATE GAME INSTANCE */
      // Create game instance - implementation details handled at runtime
      this.game = {
        init: async (): Promise<void> => {
          await Promise.resolve();
        },
        run: (): void => {
          console.log('Game run placeholder');
        },
        stop: (): void => {
          console.log('Game stop placeholder');
        }
      } as Game;

      /* OVERRIDE CANVAS WITH PROVIDED ELEMENT */
      (this.game as unknown as { canvas: HTMLCanvasElement }).canvas = this.config.canvas;

      /* INITIALIZE ENGINE */
      await (this.game as unknown as { init(): Promise<void> }).init();

      /* SET UP STATS MONITORING */
      this.setupStatsMonitoring();

      /* UPDATE STATE */
      this.state.isInitialized = true;
      this.state.hasErrors = false;
      this.state.errorMessage = undefined;

      this.emit(EngineEvent.INITIALIZED);
      this.emit(EngineEvent.STATE_CHANGED, this.state);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * dispose()
   *
   * Clean up engine resources.
   */
  dispose(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.game) {
      (this.game as unknown as { stop(): void }).stop();
      this.game = null;
    }

    this.state.isInitialized = false;
    this.state.isRunning = false;
    this.state.isPlayMode = false;
    this.state.isPaused = false;

    this.emit(EngineEvent.STATE_CHANGED, this.state);
  }

  /**
   * loadScene()
   *
   * Load scene data into engine.
   */
  async loadScene(sceneData: SceneData): Promise<void> {
    try {
      if (!this.state.isInitialized || !this.game) {
        throw new Error('Engine not initialized');
      }

      /* STOP PLAY MODE IF ACTIVE */
      if (this.state.isPlayMode) {
        this.stopPlayMode();
      }

      /* CLEAR EXISTING SCENE */
      this.clearScene();

      /* LOAD NEW SCENE DATA */
      await this.loadSceneData(sceneData);

      this.emit(EngineEvent.SCENE_LOADED, sceneData);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * startPlayMode()
   *
   * Start engine in play mode.
   */
  startPlayMode(): void {
    try {
      if (!this.state.isInitialized || !this.game) {
        throw new Error('Engine not initialized');
      }

      if (this.state.isPlayMode) {
        return;
      }

      /* CAPTURE EDITOR STATE FOR RESTORATION */
      this.editorSnapshot = this.captureEditorState();

      /* START ENGINE */
      (this.game as unknown as { run(): void }).run();

      /* UPDATE STATE */
      this.state.isPlayMode = true;
      this.state.isRunning = true;
      this.state.isPaused = false;

      this.emit(EngineEvent.PLAY_MODE_STARTED);
      this.emit(EngineEvent.STATE_CHANGED, this.state);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * stopPlayMode()
   *
   * Stop play mode and restore editor state.
   */
  stopPlayMode(): void {
    try {
      if (!this.state.isPlayMode || !this.game) {
        return;
      }

      /* STOP ENGINE */
      (this.game as unknown as { stop(): void }).stop();

      /* RESTORE EDITOR STATE */
      if (this.editorSnapshot) {
        this.restoreEditorState(this.editorSnapshot);
        this.editorSnapshot = null;
      }

      /* UPDATE STATE */
      this.state.isPlayMode = false;
      this.state.isRunning = false;
      this.state.isPaused = false;

      this.emit(EngineEvent.PLAY_MODE_STOPPED);
      this.emit(EngineEvent.STATE_CHANGED, this.state);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * pausePlayMode()
   *
   * Pause engine execution.
   */
  pausePlayMode(): void {
    if (!this.state.isPlayMode || !this.game) {
      return;
    }

    (this.game as unknown as { stop(): void }).stop();
    this.state.isPaused = true;
    this.state.isRunning = false;

    this.emit(EngineEvent.STATE_CHANGED, this.state);
  }

  /**
   * resumePlayMode()
   *
   * Resume engine execution.
   */
  resumePlayMode(): void {
    if (!this.state.isPlayMode || !this.state.isPaused || !this.game) {
      return;
    }

    (this.game as unknown as { run(): void }).run();
    this.state.isPaused = false;
    this.state.isRunning = true;

    this.emit(EngineEvent.STATE_CHANGED, this.state);
  }

  /**
   * resize()
   *
   * Resize engine viewport.
   */
  resize(width: number, height: number): void {
    if (!this.state.isInitialized || !this.game) {
      return;
    }

    this.config.width = width;
    this.config.height = height;

    /* RESIZE GAME VIEWPORT */
    /* TODO: Add resize method to Game class */
    console.log('[ENGINE] Resize to', width, height);
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
   * getStats()
   *
   * Get current engine statistics.
   */
  getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * handleError()
   *
   * Handle engine errors.
   */
  private handleError(error: Error): void {
    console.error('[ENGINE] Error:', error);

    this.state.hasErrors = true;
    this.state.errorMessage = error.message;

    this.emit(EngineEvent.ERROR, error);
    this.emit(EngineEvent.STATE_CHANGED, this.state);
  }

  /**
   * setupStatsMonitoring()
   *
   * Set up performance statistics monitoring.
   */
  private setupStatsMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;

    this.statsInterval = window.setInterval(() => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        this.stats.fps = Math.round((frameCount * 1000) / deltaTime);
        this.stats.frameTime = deltaTime / frameCount;

        frameCount = 0;
        lastTime = currentTime;

        /* UPDATE OTHER STATS */
        this.updateRenderStats();

        this.emit(EngineEvent.STATS_UPDATED, this.stats);
      }

      frameCount++;
    }, 16); /* ~60 FPS MONITORING */
  }

  /**
   * updateRenderStats()
   *
   * Update rendering statistics.
   */
  private updateRenderStats(): void {
    /* TODO: Get actual stats from renderer */
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;
    this.stats.textures = 0;
    this.stats.memory = 0;
  }

  /**
   * clearScene()
   *
   * Clear current scene.
   */
  private clearScene(): void {
    /* TODO: Clear scene objects from engine */
    console.log('[ENGINE] Clearing scene');
  }

  /**
   * loadSceneData()
   *
   * Load scene data into engine.
   */
  private async loadSceneData(sceneData: SceneData): Promise<void> {
    /* TODO: Convert editor scene data to engine format */
    console.log('[ENGINE] Loading scene data:', sceneData);
    await Promise.resolve();
  }

  /**
   * captureEditorState()
   *
   * Capture current editor state for restoration.
   */
  private captureEditorState(): SceneData {
    /* TODO: Capture complete scene state */
    return {
      id: 'editor-snapshot',
      name: 'Editor Snapshot',
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'scene',
        enabled: true,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        components: [],
        children: []
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * restoreEditorState()
   *
   * Restore editor state from snapshot.
   */
  private restoreEditorState(snapshot: SceneData): void {
    /* TODO: Restore scene state to editor */
    console.log('[ENGINE] Restoring editor state:', snapshot);
  }
}
