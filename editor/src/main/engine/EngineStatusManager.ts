/*
   ===============================================================
   WORLDEDIT ENGINE STATUS MANAGER
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

import { EventEmitter } from 'events'; /* NODE.JS EVENT SYSTEM FOR STATUS NOTIFICATIONS */
import { BrowserWindow } from 'electron'; /* ELECTRON WINDOW FOR IPC COMMUNICATION */
import {
  EngineStatus,
  EngineState,
  EngineStatusUpdate,
  EngineHealthCheck,
  EngineCapabilities,
  EngineInitializationOptions
} from '../../shared/types/EngineTypes'; /* ENGINE STATUS TYPE DEFINITIONS */
import { logger } from '../logger'; /* CENTRALIZED LOGGING SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

export interface EngineStatusManagerConfig {
  healthCheckInterval: number /* MILLISECONDS BETWEEN HEALTH CHECKS */;
  maxErrorCount: number /* MAXIMUM ERRORS BEFORE CRITICAL STATE */;
  statusUpdateDebounce: number /* MILLISECONDS TO DEBOUNCE STATUS UPDATES */;
  enableDetailedLogging: boolean /* WHETHER TO LOG DETAILED STATUS CHANGES */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         EngineStatusManager
	       ---
	       centralized management of engine status and health
	       monitoring. tracks initialization progress, error
	       states, and performance metrics while providing
	       real-time status updates to the renderer process.

	       implements health checking, error counting, and
	       automatic status reporting to ensure the editor
	       ui stays synchronized with engine state changes.

*/
export class EngineStatusManager extends EventEmitter {
  private static instance: EngineStatusManager | null = null;
  private config: EngineStatusManagerConfig;
  private currentState: EngineState;
  private mainWindow: BrowserWindow | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private statusUpdateTimer: NodeJS.Timeout | null = null;
  private errorCount: number = 0;
  private warningCount: number = 0;
  private initializationStartTime: number = 0;
  private lastHealthCheck: EngineHealthCheck | null = null;

  constructor(config: EngineStatusManagerConfig) {
    super();
    this.config = config;
    this.currentState = {
      status: EngineStatus.UNINITIALIZED,
      isInitialized: false,
      isRunning: false,
      isPlayMode: false,
      isPaused: false,
      hasErrors: false,
      initializationProgress: 0
    };
  }

  /**
   * getInstance()
   *
   * Get singleton instance of EngineStatusManager.
   */
  static getInstance(config?: EngineStatusManagerConfig): EngineStatusManager {
    if (!EngineStatusManager.instance) {
      if (!config) {
        throw new Error('EngineStatusManager config required for first initialization');
      }
      EngineStatusManager.instance = new EngineStatusManager(config);
    }
    return EngineStatusManager.instance;
  }

  /**
   * initialize()
   *
   * Initialize status manager with main window reference.
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.startHealthMonitoring();

    if (this.config.enableDetailedLogging) {
      logger.info('ENGINE_STATUS', 'Status manager initialized');
    }
  }

  /**
   * dispose()
   *
   * Clean up status manager resources.
   */
  dispose(): void {
    this.stopHealthMonitoring();
    this.clearStatusUpdateTimer();
    this.mainWindow = null;
    this.removeAllListeners();

    if (this.config.enableDetailedLogging) {
      logger.info('ENGINE_STATUS', 'Status manager disposed');
    }
  }

  /**
   * getState()
   *
   * Get current engine state.
   */
  getState(): EngineState {
    return { ...this.currentState };
  }

  /**
   * updateStatus()
   *
   * Update engine status and notify renderer.
   */
  updateStatus(status: EngineStatus, message?: string, progress?: number, error?: Error): void {
    const oldStatus = this.currentState.status;
    const timestamp = new Date().toISOString();

    /* UPDATE STATE */
    this.currentState.status = status;

    if (progress !== undefined) {
      this.currentState.initializationProgress = Math.max(0, Math.min(100, progress));
    }

    if (error) {
      this.currentState.hasErrors = true;
      this.currentState.errorMessage = error.message;
      this.currentState.lastErrorTime = timestamp;
      this.errorCount++;
    }

    /* UPDATE DERIVED STATES */
    this.updateDerivedStates();

    /* LOG STATUS CHANGE */
    if (oldStatus !== status || error) {
      const logLevel = error ? 'error' : 'info';
      logger[logLevel]('ENGINE_STATUS', `Status changed: ${oldStatus} -> ${status}`, {
        message,
        progress,
        error: error?.message
      });
    }

    /* EMIT EVENTS */
    this.emit('status-changed', this.currentState, oldStatus);

    if (error) {
      this.emit('error', error);
    }

    /* NOTIFY RENDERER */
    this.scheduleStatusUpdate({
      status,
      message,
      progress,
      timestamp,
      error
    });
  }

  /**
   * startInitialization()
   *
   * Begin engine initialization sequence.
   */
  startInitialization(options?: EngineInitializationOptions): void {
    this.initializationStartTime = Date.now();
    this.errorCount = 0;
    this.warningCount = 0;

    this.updateStatus(EngineStatus.INITIALIZING, 'Starting engine initialization...', 0);

    /* SIMULATE INITIALIZATION STEPS */
    this.simulateInitializationProgress();
  }

  /**
   * completeInitialization()
   *
   * Complete engine initialization with capabilities.
   */
  completeInitialization(capabilities?: EngineCapabilities): void {
    const initTime = Date.now() - this.initializationStartTime;

    this.currentState.capabilities = capabilities;
    this.currentState.isInitialized = true;

    this.updateStatus(EngineStatus.READY, `Engine initialized in ${initTime}ms`, 100);

    if (this.config.enableDetailedLogging) {
      logger.info('ENGINE_STATUS', 'Engine initialization complete', {
        initializationTime: initTime,
        capabilities
      });
    }
  }

  /**
   * reportError()
   *
   * Report engine error.
   */
  reportError(error: Error, context?: string): void {
    this.updateStatus(EngineStatus.ERROR, context || 'Engine error occurred', undefined, error);

    /* CHECK FOR CRITICAL ERROR COUNT */
    if (this.errorCount >= this.config.maxErrorCount) {
      logger.error('ENGINE_STATUS', `Critical error count reached: ${this.errorCount}`);
      this.emit('critical-error', this.errorCount);
    }
  }

  /**
   * reportWarning()
   *
   * Report engine warning.
   */
  reportWarning(message: string, context?: string): void {
    this.warningCount++;

    logger.warn('ENGINE_STATUS', `Engine warning: ${message}`, { context });

    this.emit('warning', { message, context, count: this.warningCount });
  }

  /**
   * setPlayMode()
   *
   * Update play mode state.
   */
  setPlayMode(isPlayMode: boolean, isPaused: boolean = false): void {
    this.currentState.isPlayMode = isPlayMode;
    this.currentState.isPaused = isPaused;
    this.currentState.isRunning = isPlayMode && !isPaused;

    this.scheduleStatusUpdate({
      status: this.currentState.status,
      timestamp: new Date().toISOString()
    });

    if (this.config.enableDetailedLogging) {
      logger.info('ENGINE_STATUS', 'Play mode updated', {
        isPlayMode,
        isPaused,
        isRunning: this.currentState.isRunning
      });
    }
  }

  /**
   * performHealthCheck()
   *
   * Perform engine health check.
   */
  performHealthCheck(): EngineHealthCheck {
    const timestamp = new Date().toISOString();
    const memoryUsage = process.memoryUsage().heapUsed;

    const healthCheck: EngineHealthCheck = {
      timestamp,
      status: this.currentState.status,
      isResponsive: true /* TODO: Implement actual responsiveness check */,
      memoryUsage,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      lastError: this.currentState.errorMessage,
      lastWarning: undefined /* TODO: Track last warning */
    };

    this.lastHealthCheck = healthCheck;
    this.emit('health-check', healthCheck);

    return healthCheck;
  }

  /**
   * getLastHealthCheck()
   *
   * Get last health check results.
   */
  getLastHealthCheck(): EngineHealthCheck | null {
    return this.lastHealthCheck;
  }

  /**
   * updateDerivedStates()
   *
   * Update derived state properties based on current status.
   */
  private updateDerivedStates(): void {
    switch (this.currentState.status) {
      case EngineStatus.READY:
        this.currentState.isInitialized = true;
        this.currentState.hasErrors = false;
        break;

      case EngineStatus.ERROR:
        this.currentState.hasErrors = true;
        this.currentState.isRunning = false;
        this.currentState.isPlayMode = false;
        this.currentState.isPaused = false;
        break;

      case EngineStatus.INITIALIZING:
        this.currentState.isInitialized = false;
        this.currentState.isRunning = false;
        this.currentState.isPlayMode = false;
        this.currentState.isPaused = false;
        break;

      case EngineStatus.DISPOSING:
        this.currentState.isRunning = false;
        this.currentState.isPlayMode = false;
        this.currentState.isPaused = false;
        break;

      case EngineStatus.UNINITIALIZED:
      default:
        this.currentState.isInitialized = false;
        this.currentState.isRunning = false;
        this.currentState.isPlayMode = false;
        this.currentState.isPaused = false;
        break;
    }
  }

  /**
   * scheduleStatusUpdate()
   *
   * Schedule debounced status update to renderer.
   */
  private scheduleStatusUpdate(update: EngineStatusUpdate): void {
    this.clearStatusUpdateTimer();

    this.statusUpdateTimer = setTimeout(() => {
      this.sendStatusUpdate(update);
    }, this.config.statusUpdateDebounce);
  }

  /**
   * sendStatusUpdate()
   *
   * Send status update to renderer process.
   */
  private sendStatusUpdate(update: EngineStatusUpdate): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    try {
      this.mainWindow.webContents.send('engine:status-changed', {
        ...update,
        state: this.currentState
      });
    } catch (error) {
      logger.error('ENGINE_STATUS', 'Failed to send status update', { error });
    }
  }

  /**
   * startHealthMonitoring()
   *
   * Start periodic health monitoring.
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * stopHealthMonitoring()
   *
   * Stop health monitoring.
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * clearStatusUpdateTimer()
   *
   * Clear pending status update timer.
   */
  private clearStatusUpdateTimer(): void {
    if (this.statusUpdateTimer) {
      clearTimeout(this.statusUpdateTimer);
      this.statusUpdateTimer = null;
    }
  }

  /**
   * simulateInitializationProgress()
   *
   * Simulate initialization progress for demonstration.
   * TODO: Replace with actual initialization steps.
   */
  private simulateInitializationProgress(): void {
    const steps = [
      { progress: 10, message: 'Loading WORLDC runtime...' },
      { progress: 25, message: 'Initializing renderer...' },
      { progress: 40, message: 'Setting up physics engine...' },
      { progress: 60, message: 'Loading audio system...' },
      { progress: 80, message: 'Preparing script environment...' },
      { progress: 95, message: 'Finalizing initialization...' }
    ];

    let stepIndex = 0;

    const processStep = (): void => {
      if (stepIndex >= steps.length) {
        /* COMPLETE INITIALIZATION */
        const capabilities: EngineCapabilities = {
          supports3D: true,
          supports2D: true,
          supportsPhysics: true,
          supportsAudio: true,
          supportsScripting: true,
          supportsWebGL: true,
          supportsWebGL2: true,
          maxTextureSize: 4096,
          maxVertices: 65536,
          supportedFormats: ['gltf', 'obj', 'png', 'jpg', 'mp3', 'wav']
        };

        this.completeInitialization(capabilities);
        return;
      }

      const step = steps[stepIndex];
      this.updateStatus(EngineStatus.INITIALIZING, step.message, step.progress);

      stepIndex++;
      setTimeout(processStep, 200 + Math.random() * 300);
    };

    /* START FIRST STEP */
    setTimeout(processStep, 100);
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
