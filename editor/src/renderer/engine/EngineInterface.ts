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
 * Provides command/response patterns and event subscriptions.
 */

import { SceneData } from '../../shared/types/SceneTypes';
import {
  EngineStatus,
  EngineState,
  EngineHealthCheck,
  EngineStatusUpdate
} from '../../shared/types/EngineTypes';
import {
  IPCCommand,
  IPCResponse,
  IPCEvent,
  IPCChannels,
  IPCChannelName,
  EventSubscription,
  IPCStatistics,
  EngineInitializeCommand,
  EngineInitializeResponse,
  EngineLoadSceneCommand,
  EngineLoadSceneResponse,
  EngineSetPlayModeCommand,
  EngineCreateEntityCommand,
  EngineCreateEntityResponse,
  EngineUpdateComponentCommand
} from '../../shared/types/IPCTypes';
import { EngineCommandQueue, CommandQueueConfig } from './EngineCommandQueue';

// Re-export from shared types
export type { EngineState, EngineStatus, EngineHealthCheck } from '../../shared/types/EngineTypes';

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
 * CommandOptions interface
 *
 * Options for sending commands to engine.
 */
export interface CommandOptions {
  timeout?: number;
  retryOnFailure?: boolean;
}

/**
 * EngineInterface class
 *
 * Renderer-side engine interface for play mode and scene operations.
 * Provides abstraction over IPC communication with engine service.
 */
export class EngineInterface {
  private static instance: EngineInterface | null = null;
  private listeners: Map<string, Set<EngineEventListener>> = new Map();
  private eventSubscriptions: Map<IPCChannelName, EventSubscription> = new Map();
  private commandQueue: EngineCommandQueue;
  private statistics: IPCStatistics;
  private state: EngineState = {
    status: EngineStatus.UNINITIALIZED,
    isInitialized: false,
    isRunning: false,
    isPlayMode: false,
    isPaused: false,
    hasErrors: false
  };

  constructor() {
    this.statistics = {
      commandsSent: 0,
      commandsReceived: 0,
      responsesReceived: 0,
      eventsReceived: 0,
      averageResponseTime: 0,
      failedCommands: 0,
      queueSize: 0,
      subscriptions: 0
    };

    // Initialize command queue
    const queueConfig: CommandQueueConfig = {
      maxQueueSize: 1000,
      processingInterval: 16, // ~60fps
      maxRetryAttempts: 3,
      retryDelay: 1000,
      batchSize: 5,
      enablePriorityQueue: true,
      enableStatistics: true
    };

    this.commandQueue = new EngineCommandQueue(queueConfig);
    this.commandQueue.initialize(this.processCommand.bind(this));

    this.setupIPCListeners();
    this.syncEngineState();
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
    return this.state.status === EngineStatus.READY && !this.state.hasErrors;
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
   * getEngineStatus()
   *
   * Get current engine status from main process.
   */
  async getEngineStatus(): Promise<EngineState> {
    try {
      const status = await window.worldedit.engine.getStatus();
      return status as EngineState;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to get engine status:', error);
      throw error;
    }
  }

  /**
   * getHealthCheck()
   *
   * Get latest engine health check results.
   */
  async getHealthCheck(): Promise<EngineHealthCheck | null> {
    try {
      const healthCheck = await window.worldedit.engine.getHealthCheck();
      return healthCheck as EngineHealthCheck | null;
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to get health check:', error);
      throw error;
    }
  }

  /**
   * sendCommand()
   *
   * Send command to engine via command queue.
   */
  async sendCommand<TPayload, TResponse>(
    channel: IPCChannelName,
    payload: TPayload,
    options?: CommandOptions
  ): Promise<TResponse> {
    const commandId = this.generateCommandId();
    const timeout = options?.timeout || 30000;

    const command: IPCCommand<TPayload> = {
      id: commandId,
      channel,
      type: 'command',
      payload,
      timestamp: Date.now(),
      timeout
    };

    this.statistics.commandsSent++;

    // Enqueue command for reliable processing
    const response = await this.commandQueue.enqueue(command);

    if (!response.success) {
      this.statistics.failedCommands++;
      throw new Error(response.error?.message || 'Command failed');
    }

    this.statistics.responsesReceived++;
    return response.payload as TResponse;
  }

  /**
   * initializeEngine()
   *
   * Initialize engine with configuration options.
   */
  async initializeEngine(
    options: EngineInitializeCommand['options']
  ): Promise<EngineInitializeResponse> {
    return this.sendCommand<EngineInitializeCommand, EngineInitializeResponse>(
      IPCChannels.ENGINE_INITIALIZE,
      { options }
    );
  }

  /**
   * loadScene()
   *
   * Load scene file into engine.
   */
  async loadEngineScene(
    scenePath: string,
    options?: EngineLoadSceneCommand['options']
  ): Promise<EngineLoadSceneResponse> {
    return this.sendCommand<EngineLoadSceneCommand, EngineLoadSceneResponse>(
      IPCChannels.ENGINE_LOAD_SCENE,
      { scenePath, options }
    );
  }

  /**
   * setEnginePlayMode()
   *
   * Set engine play mode state.
   */
  async setEnginePlayMode(
    playMode: boolean,
    options?: EngineSetPlayModeCommand['options']
  ): Promise<boolean> {
    return this.sendCommand<EngineSetPlayModeCommand, boolean>(IPCChannels.ENGINE_SET_PLAY_MODE, {
      playMode,
      options
    });
  }

  /**
   * createEngineEntity()
   *
   * Create new entity in engine.
   */
  async createEngineEntity(
    parentId?: string,
    template?: string,
    properties?: Record<string, unknown>
  ): Promise<EngineCreateEntityResponse> {
    return this.sendCommand<EngineCreateEntityCommand, EngineCreateEntityResponse>(
      IPCChannels.ENGINE_CREATE_ENTITY,
      { parentId, template, properties }
    );
  }

  /**
   * updateEngineComponent()
   *
   * Update component properties in engine.
   */
  async updateEngineComponent(
    entityId: string,
    componentType: string,
    properties: Record<string, unknown>
  ): Promise<boolean> {
    return this.sendCommand<EngineUpdateComponentCommand, boolean>(
      IPCChannels.ENGINE_UPDATE_COMPONENT,
      { entityId, componentType, properties }
    );
  }

  /**
   * subscribeToEvent()
   *
   * Subscribe to engine events.
   */
  subscribeToEvent(
    channel: IPCChannelName,
    callback: (event: IPCEvent) => void,
    options?: { once?: boolean; filter?: (event: IPCEvent) => boolean }
  ): () => void {
    const subscription: EventSubscription = {
      channel,
      callback,
      once: options?.once,
      filter: options?.filter
    };

    this.eventSubscriptions.set(channel, subscription);
    this.statistics.subscriptions++;

    // Set up IPC listener
    const ipcCallback = (...args: unknown[]) => {
      const event = args[0] as IPCEvent;
      this.statistics.eventsReceived++;

      if (subscription.filter && !subscription.filter(event)) {
        return;
      }

      callback(event);

      if (subscription.once) {
        this.unsubscribeFromEvent(channel);
      }
    };

    window.worldedit.on(channel, ipcCallback);

    // Return unsubscribe function
    return () => this.unsubscribeFromEvent(channel);
  }

  /**
   * unsubscribeFromEvent()
   *
   * Unsubscribe from engine events.
   */
  unsubscribeFromEvent(channel: IPCChannelName): void {
    if (this.eventSubscriptions.has(channel)) {
      this.eventSubscriptions.delete(channel);
      this.statistics.subscriptions--;

      // Remove IPC listener
      window.worldedit.off(channel, () => {});
    }
  }

  /**
   * getStatistics()
   *
   * Get communication statistics including queue stats.
   */
  getStatistics(): IPCStatistics {
    const queueStats = this.commandQueue.getStatistics();
    return {
      ...this.statistics,
      queueSize: queueStats.currentQueueSize
    };
  }

  /**
   * clearStatistics()
   *
   * Reset communication statistics.
   */
  clearStatistics(): void {
    this.statistics = {
      commandsSent: 0,
      commandsReceived: 0,
      responsesReceived: 0,
      eventsReceived: 0,
      averageResponseTime: 0,
      failedCommands: 0,
      queueSize: 0,
      subscriptions: this.eventSubscriptions.size
    };
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
   * syncEngineState()
   *
   * Synchronize engine state with main process.
   */
  private async syncEngineState(): Promise<void> {
    try {
      const status = await this.getEngineStatus();
      this.state = status;
      this.emit('stateChanged', status);

      if (status.status === EngineStatus.READY) {
        this.emit('ready');
      }
    } catch (error) {
      console.error('[ENGINE_INTERFACE] Failed to sync engine state:', error);
    }
  }

  /**
   * setupIPCListeners()
   *
   * Set up IPC event listeners for engine communication.
   */
  private setupIPCListeners(): void {
    // Listen for engine events from main process
    if (window.worldedit?.on) {
      window.worldedit.on('engine:status-changed', (...args: unknown[]) => {
        const update = args[0] as EngineStatusUpdate & { state: EngineState };
        this.state = update.state;
        this.emit('stateChanged', update.state);

        if (update.state.status === EngineStatus.READY) {
          this.emit('ready');
        }

        if (update.error) {
          this.emit('error', update.error);
        }
      });

      window.worldedit.on('engine:error', (...args: unknown[]) => {
        const error = args[0] as Error;
        this.updateState({
          hasErrors: true,
          errorMessage: error.message,
          status: EngineStatus.ERROR
        });
        this.emit('error', error);
      });

      window.worldedit.on('engine:initialized', () => {
        this.updateState({
          isInitialized: true,
          hasErrors: false,
          status: EngineStatus.READY
        });
        this.emit('ready');
      });
    }
  }

  /**
   * processCommand()
   *
   * Process command through IPC system.
   */
  private async processCommand(command: IPCCommand): Promise<IPCResponse> {
    try {
      const response = await window.worldedit.invoke(command.channel, command);
      return response as IPCResponse;
    } catch (error) {
      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        payload: null,
        timestamp: Date.now(),
        success: false,
        error: {
          code: 'IPC_ERROR',
          message: (error as Error).message,
          details: error
        }
      };
    }
  }

  /**
   * generateCommandId()
   *
   * Generate unique command ID.
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
