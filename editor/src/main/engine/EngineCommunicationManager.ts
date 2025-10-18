/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Communication Manager
 *
 * Manages IPC communication between main process and renderer for engine operations.
 * Provides command/response patterns, event publishing, and message queuing.
 */

import { EventEmitter } from 'events';
import { BrowserWindow, ipcMain } from 'electron';
import {
  IPCCommand,
  IPCResponse,
  IPCEvent,
  IPCError,
  IPCPriority,
  IPCChannels,
  IPCChannelName,
  QueuedCommand,
  CommandQueue,
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
import { EngineStatusManager } from './EngineStatusManager';
import { WCCompilerIntegration, CompilationTarget, CompilerEvent } from './WCCompilerIntegration';
import { WCHotReloadManager, HotReloadManagerFactory } from './WCHotReloadManager';
import { logger } from '../logger';

export interface EngineCommunicationConfig {
  commandTimeout: number;
  maxQueueSize: number;
  maxRetryAttempts: number;
  retryDelay: number;
  enableStatistics: boolean;
  enableDebugLogging: boolean;
}

/**
 * EngineCommunicationManager class
 *
 * Enhanced with WorldC compiler integration for real-time
 * compilation and hot-reload functionality.
 *
 * Handles all IPC communication between the main process and renderer
 * for engine-related operations. Provides reliable message delivery,
 * command queuing, and event publishing.
 */
export class EngineCommunicationManager extends EventEmitter {
  private static instance: EngineCommunicationManager | null = null;
  private config: EngineCommunicationConfig;
  private mainWindow: BrowserWindow | null = null;
  private commandQueue: Map<string, QueuedCommand> = new Map();
  private pendingResponses: Map<string, (response: IPCResponse) => void> = new Map();
  private queueProcessor: NodeJS.Timeout | null = null;
  private statistics: IPCStatistics;
  private isInitialized: boolean = false;
  private compiler: WCCompilerIntegration | null = null;
  private hotReloadManager: WCHotReloadManager | null = null;

  constructor(config: EngineCommunicationConfig) {
    super();
    this.config = config;
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
  }

  /**
   * getInstance()
   *
   * Get singleton instance.
   */
  static getInstance(config?: EngineCommunicationConfig): EngineCommunicationManager {
    if (!EngineCommunicationManager.instance) {
      if (!config) {
        throw new Error('EngineCommunicationManager config required for first initialization');
      }
      EngineCommunicationManager.instance = new EngineCommunicationManager(config);
    }
    return EngineCommunicationManager.instance;
  }

  /**
   * initialize()
   *
   * Initialize communication manager with main window.
   */
  initialize(mainWindow: BrowserWindow): void {
    if (this.isInitialized) {
      return;
    }

    this.mainWindow = mainWindow;
    this.setupIPCHandlers();
    this.startQueueProcessor();
    this.initializeWorldCIntegration();
    this.isInitialized = true;

    if (this.config.enableDebugLogging) {
      logger.info('ENGINE_COMM', 'Communication manager initialized');
    }
  }

  /**
   * sendCommand()
   *
   * Send command to engine and return response promise.
   */
  async sendCommand<TPayload, TResponse>(
    channel: IPCChannelName,
    payload: TPayload,
    options?: {
      timeout?: number;
      priority?: IPCPriority;
      retryOnFailure?: boolean;
    }
  ): Promise<TResponse> {
    const commandId = this.generateCommandId();
    const timeout = options?.timeout || this.config.commandTimeout;
    const priority = options?.priority || IPCPriority.NORMAL;

    const command: IPCCommand<TPayload> = {
      id: commandId,
      channel,
      type: 'command',
      payload,
      timestamp: Date.now(),
      timeout,
      priority
    };

    return new Promise<TResponse>((resolve, reject) => {
      // Set up response handler
      const responseHandler = (response: IPCResponse<TResponse>): void => {
        this.pendingResponses.delete(commandId);

        if (response.success) {
          resolve(response.payload);
        } else {
          reject(new Error(response.error?.message || 'Command failed'));
        }
      };

      this.pendingResponses.set(commandId, responseHandler as (response: IPCResponse) => void);

      // Set up timeout
      setTimeout(() => {
        if (this.pendingResponses.has(commandId)) {
          this.pendingResponses.delete(commandId);
          this.statistics.failedCommands++;
          reject(new Error(`Command timeout: ${channel}`));
        }
      }, timeout);

      // Queue command for processing
      this.queueCommand(command);
    });
  }

  /**
   * publishEvent()
   *
   * Publish event to renderer process.
   */
  publishEvent<T>(channel: IPCChannelName, payload: T, source: 'main' | 'engine' = 'main'): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const event: IPCEvent<T> = {
      id: this.generateCommandId(),
      channel,
      type: 'event',
      payload,
      timestamp: Date.now(),
      source
    };

    try {
      this.mainWindow.webContents.send(channel, event);

      if (this.config.enableDebugLogging) {
        logger.debug('ENGINE_COMM', `Event published: ${channel}`, { payload });
      }
    } catch (error) {
      logger.error('ENGINE_COMM', `Failed to publish event: ${channel}`, { error });
    }
  }

  /**
   * getStatistics()
   *
   * Get communication statistics.
   */
  getStatistics(): IPCStatistics {
    this.statistics.queueSize = this.commandQueue.size;
    return { ...this.statistics };
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
      queueSize: this.commandQueue.size,
      subscriptions: 0
    };
  }

  /**
   * setupIPCHandlers()
   *
   * Set up IPC handlers for engine communication.
   */
  private setupIPCHandlers(): void {
    // Engine initialization
    ipcMain.handle(
      IPCChannels.ENGINE_INITIALIZE,
      async (_event, command: IPCCommand<EngineInitializeCommand>) => {
        return this.handleEngineInitialize(command);
      }
    );

    // Scene management
    ipcMain.handle(
      IPCChannels.ENGINE_LOAD_SCENE,
      async (_event, command: IPCCommand<EngineLoadSceneCommand>) => {
        return this.handleEngineLoadScene(command);
      }
    );

    // Play mode control
    ipcMain.handle(
      IPCChannels.ENGINE_SET_PLAY_MODE,
      async (_event, command: IPCCommand<EngineSetPlayModeCommand>) => {
        return this.handleEngineSetPlayMode(command);
      }
    );

    // Entity management
    ipcMain.handle(
      IPCChannels.ENGINE_CREATE_ENTITY,
      async (_event, command: IPCCommand<EngineCreateEntityCommand>) => {
        return this.handleEngineCreateEntity(command);
      }
    );

    // Component management
    ipcMain.handle(
      IPCChannels.ENGINE_UPDATE_COMPONENT,
      async (_event, command: IPCCommand<EngineUpdateComponentCommand>) => {
        return this.handleEngineUpdateComponent(command);
      }
    );

    // Status and statistics
    ipcMain.handle(IPCChannels.ENGINE_GET_STATUS, () => {
      const statusManager = EngineStatusManager.getInstance();
      return this.createSuccessResponse('status-retrieved', statusManager.getState());
    });

    ipcMain.handle(IPCChannels.ENGINE_GET_STATS, () => {
      return this.createSuccessResponse('stats-retrieved', this.getStatistics());
    });

    // Script compilation
    ipcMain.handle(IPCChannels.ENGINE_COMPILE_SCRIPT, async (_event, command: IPCCommand) => {
      return this.handleCompileScript(command);
    });

    ipcMain.handle(IPCChannels.ENGINE_VALIDATE_SCRIPT, async (_event, command: IPCCommand) => {
      return this.handleValidateScript(command);
    });

    // Hot-reload
    ipcMain.handle(IPCChannels.ENGINE_START_HOT_RELOAD, async (_event, command: IPCCommand) => {
      return this.handleStartHotReload(command);
    });

    ipcMain.handle(IPCChannels.ENGINE_STOP_HOT_RELOAD, async (_event, command: IPCCommand) => {
      return this.handleStopHotReload(command);
    });
  }

  /**
   * removeAllIPCHandlers()
   *
   * Remove all IPC handlers.
   */
  private removeAllIPCHandlers(): void {
    const channels = Object.values(IPCChannels);
    channels.forEach((channel) => {
      ipcMain.removeAllListeners(channel);
    });
  }

  /**
   * handleEngineInitialize()
   *
   * Handle engine initialization command.
   */
  private async handleEngineInitialize(
    command: IPCCommand<EngineInitializeCommand>
  ): Promise<IPCResponse<EngineInitializeResponse>> {
    try {
      const statusManager = EngineStatusManager.getInstance();

      // Start initialization
      statusManager.startInitialization(command.payload.options);

      // Simulate engine initialization
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete initialization with capabilities
      const capabilities = {
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

      statusManager.completeInitialization(capabilities);

      const response: EngineInitializeResponse = {
        success: true,
        capabilities,
        initializationTime: 2000
      };

      return this.createSuccessResponse(command.id, response);
    } catch (error) {
      return this.createErrorResponse<EngineInitializeResponse>(
        command.id,
        'INIT_FAILED',
        error as Error
      );
    }
  }

  /**
   * handleEngineLoadScene()
   *
   * Handle scene loading command.
   */
  private async handleEngineLoadScene(
    command: IPCCommand<EngineLoadSceneCommand>
  ): Promise<IPCResponse<EngineLoadSceneResponse>> {
    try {
      // TODO: Implement actual scene loading
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response: EngineLoadSceneResponse = {
        success: true,
        sceneId: 'scene-' + Date.now(),
        entityCount: 0,
        validationResults: {
          isValid: true,
          errors: [],
          warnings: []
        }
      };

      // Publish scene loaded event
      this.publishEvent(
        IPCChannels.ENGINE_SCENE_LOADED,
        {
          sceneId: response.sceneId,
          scenePath: command.payload.scenePath,
          entityCount: response.entityCount
        },
        'engine'
      );

      return this.createSuccessResponse(command.id, response);
    } catch (error) {
      return this.createErrorResponse<EngineLoadSceneResponse>(
        command.id,
        'SCENE_LOAD_FAILED',
        error as Error
      );
    }
  }

  /**
   * handleEngineSetPlayMode()
   *
   * Handle play mode change command.
   */
  private async handleEngineSetPlayMode(
    command: IPCCommand<EngineSetPlayModeCommand>
  ): Promise<IPCResponse<boolean>> {
    try {
      const statusManager = EngineStatusManager.getInstance();
      statusManager.setPlayMode(command.payload.playMode);

      // Publish play mode changed event
      this.publishEvent(
        IPCChannels.ENGINE_PLAY_MODE_CHANGED,
        {
          isPlayMode: command.payload.playMode,
          isPaused: false
        },
        'engine'
      );

      return this.createSuccessResponse(command.id, true);
    } catch (error) {
      return this.createErrorResponse<boolean>(command.id, 'PLAY_MODE_FAILED', error as Error);
    }
  }

  /**
   * handleEngineCreateEntity()
   *
   * Handle entity creation command.
   */
  private async handleEngineCreateEntity(
    command: IPCCommand<EngineCreateEntityCommand>
  ): Promise<IPCResponse<EngineCreateEntityResponse>> {
    try {
      // TODO: Implement actual entity creation
      const entityId = 'entity-' + Date.now();
      const components = ['Transform'];

      const response: EngineCreateEntityResponse = {
        success: true,
        entityId,
        components
      };

      // Publish entity created event
      this.publishEvent(
        IPCChannels.ENGINE_ENTITY_CREATED,
        {
          entityId,
          parentId: command.payload.parentId,
          components
        },
        'engine'
      );

      return this.createSuccessResponse(command.id, response);
    } catch (error) {
      return this.createErrorResponse<EngineCreateEntityResponse>(
        command.id,
        'ENTITY_CREATE_FAILED',
        error as Error
      );
    }
  }

  /**
   * handleEngineUpdateComponent()
   *
   * Handle component update command.
   */
  private async handleEngineUpdateComponent(
    command: IPCCommand<EngineUpdateComponentCommand>
  ): Promise<IPCResponse<boolean>> {
    try {
      // TODO: Implement actual component update
      await new Promise((resolve) => setTimeout(resolve, 50));

      return this.createSuccessResponse(command.id, true);
    } catch (error) {
      return this.createErrorResponse<boolean>(
        command.id,
        'COMPONENT_UPDATE_FAILED',
        error as Error
      );
    }
  }

  /**
   * queueCommand()
   *
   * Add command to processing queue.
   */
  private queueCommand<T>(command: IPCCommand<T>): void {
    if (this.commandQueue.size >= this.config.maxQueueSize) {
      throw new Error('Command queue is full');
    }

    const queuedCommand: QueuedCommand<T> = {
      ...command,
      queuedAt: Date.now(),
      attempts: 0,
      status: 'pending'
    };

    this.commandQueue.set(command.id, queuedCommand);
    this.statistics.commandsSent++;

    if (this.config.enableDebugLogging) {
      logger.debug('ENGINE_COMM', `Command queued: ${command.channel}`, { id: command.id });
    }
  }

  /**
   * startQueueProcessor()
   *
   * Start command queue processing.
   */
  private startQueueProcessor(): void {
    if (this.queueProcessor) {
      return;
    }

    this.queueProcessor = setInterval(() => {
      this.processCommandQueue();
    }, 16); // ~60fps processing
  }

  /**
   * stopQueueProcessor()
   *
   * Stop command queue processing.
   */
  private stopQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
  }

  /**
   * processCommandQueue()
   *
   * Process pending commands in queue.
   */
  private processCommandQueue(): void {
    const pendingCommands = Array.from(this.commandQueue.values())
      .filter((cmd) => cmd.status === 'pending')
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Higher priority first

    for (const command of pendingCommands.slice(0, 5)) {
      // Process up to 5 commands per frame
      this.processCommand(command);
    }
  }

  /**
   * processCommand()
   *
   * Process individual command.
   */
  private processCommand(command: QueuedCommand): void {
    command.status = 'processing';
    command.attempts++;
    command.lastAttempt = Date.now();

    // TODO: Route command to appropriate engine system
    // For now, mark as completed
    setTimeout(() => {
      command.status = 'completed';
      this.commandQueue.delete(command.id);
    }, 10);
  }

  /**
   * clearPendingCommands()
   *
   * Clear all pending commands and responses.
   */
  private clearPendingCommands(): void {
    this.commandQueue.clear();
    this.pendingResponses.clear();
  }

  /**
   * createSuccessResponse()
   *
   * Create success response.
   */
  private createSuccessResponse<T>(commandId: string, payload: T): IPCResponse<T> {
    return {
      id: commandId,
      channel: '',
      type: 'response',
      payload,
      timestamp: Date.now(),
      success: true
    };
  }

  /**
   * createErrorResponse()
   *
   * Create error response.
   */
  private createErrorResponse<T = null>(
    commandId: string,
    code: string,
    error: Error
  ): IPCResponse<T> {
    const ipcError: IPCError = {
      code,
      message: error.message,
      details: error,
      stack: error.stack
    };

    return {
      id: commandId,
      channel: '',
      type: 'response',
      payload: null as T,
      timestamp: Date.now(),
      success: false,
      error: ipcError
    };
  }

  /**
   * generateCommandId()
   *
   * Generate unique command ID.
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * initializeWorldCIntegration()
   *
   * Initialize WorldC compiler and hot-reload integration.
   */
  private async initializeWorldCIntegration(): Promise<void> {
    try {
      /* CREATE COMPILER INTEGRATION */
      this.compiler = new WCCompilerIntegration();
      await this.compiler.initialize();

      /* CREATE HOT-RELOAD MANAGER */
      this.hotReloadManager = HotReloadManagerFactory.createDefault(this.compiler);

      /* SET UP COMPILER EVENT HANDLERS */
      this.compiler.on(CompilerEvent.COMPILATION_COMPLETE, (result) => {
        this.publishEvent(IPCChannels.ENGINE_SCRIPT_COMPILED, {
          type: 'script-compiled',
          data: {
            success: result.success,
            target: result.target,
            outputCode: result.outputCode,
            diagnostics: result.diagnostics,
            warnings: result.warnings
          },
          timestamp: Date.now()
        });
      });

      this.compiler.on(CompilerEvent.COMPILATION_ERROR, (result) => {
        this.publishEvent(IPCChannels.ENGINE_SCRIPT_COMPILED, {
          type: 'script-compilation-error',
          data: {
            success: false,
            target: result.target,
            diagnostics: result.diagnostics,
            warnings: result.warnings
          },
          timestamp: Date.now()
        });
      });

      /* SET UP HOT-RELOAD EVENT HANDLERS */
      this.hotReloadManager.on('hotReloadEvent', (event) => {
        this.publishEvent(IPCChannels.ENGINE_HOT_RELOAD, {
          type: 'hot-reload-event',
          data: event,
          timestamp: Date.now()
        });
      });

      console.log('[ENGINE] WC integration initialized');
    } catch (error) {
      console.error('[ENGINE] Failed to initialize WC integration:', error);
    }
  }

  /**
   * handleCompileScript()
   *
   * Handle script compilation requests.
   */
  private async handleCompileScript(command: IPCCommand): Promise<IPCResponse> {
    try {
      const { sourceCode, filename, target } = command.payload as any;

      if (!this.compiler) {
        throw new Error('WC compiler not initialized');
      }

      const result = await this.compiler.compile({
        sourceCode,
        filename: filename || 'script.wc',
        target: target || CompilationTarget.TYPESCRIPT
      });

      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: result.success,
        payload: {
          outputCode: result.outputCode,
          outputFiles: result.outputFiles,
          diagnostics: result.diagnostics,
          warnings: result.warnings,
          timing: result.timing
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: false,
        payload: null,
        error: {
          code: 'COMPILATION_FAILED',
          message: `Script compilation failed: ${error}`,
          details: { error: String(error) }
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * handleValidateScript()
   *
   * Handle script validation requests.
   */
  private async handleValidateScript(command: IPCCommand): Promise<IPCResponse> {
    try {
      const { sourceCode, filename } = command.payload as any;

      if (!this.compiler) {
        throw new Error('WC compiler not initialized');
      }

      const result = await this.compiler.validateSource(sourceCode, filename || 'script.wc');

      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: true,
        payload: {
          valid: result.valid,
          diagnostics: result.diagnostics,
          warnings: result.warnings
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: false,
        payload: null,
        error: {
          code: 'VALIDATION_FAILED',
          message: `Script validation failed: ${error}`,
          details: { error: String(error) }
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * handleStartHotReload()
   *
   * Handle hot-reload start requests.
   */
  private async handleStartHotReload(command: IPCCommand): Promise<IPCResponse> {
    try {
      const { watchPaths, config } = command.payload as any;

      if (!this.hotReloadManager) {
        throw new Error('Hot-reload manager not initialized');
      }

      if (watchPaths && Array.isArray(watchPaths)) {
        for (const watchPath of watchPaths) {
          await this.hotReloadManager.addWatchPath(watchPath);
        }
      }

      if (config) {
        await this.hotReloadManager.updateConfig(config);
      }

      await this.hotReloadManager.startWatching();

      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: true,
        payload: {
          state: this.hotReloadManager.getState(),
          watchedFiles: this.hotReloadManager.getWatchedFiles().length,
          config: this.hotReloadManager.getConfig()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: false,
        payload: null,
        error: {
          code: 'HOT_RELOAD_START_FAILED',
          message: `Failed to start hot-reload: ${error}`,
          details: { error: String(error) }
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * handleStopHotReload()
   *
   * Handle hot-reload stop requests.
   */
  private async handleStopHotReload(command: IPCCommand): Promise<IPCResponse> {
    try {
      if (!this.hotReloadManager) {
        throw new Error('Hot-reload manager not initialized');
      }

      await this.hotReloadManager.stopWatching();

      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: true,
        payload: {
          state: this.hotReloadManager.getState()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        id: command.id,
        channel: command.channel,
        type: 'response',
        success: false,
        payload: null,
        error: {
          code: 'HOT_RELOAD_STOP_FAILED',
          message: `Failed to stop hot-reload: ${error}`,
          details: { error: String(error) }
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * dispose()
   *
   * Clean up resources including WC integration.
   */
  async dispose(): Promise<void> {
    /* STOP HOT-RELOAD */
    if (this.hotReloadManager) {
      await this.hotReloadManager.dispose();
    }

    /* DISPOSE COMPILER */
    if (this.compiler) {
      this.compiler.dispose();
    }

    /* EXISTING CLEANUP */
    this.commandQueue.clear();
    this.removeAllListeners();

    if (this.mainWindow) {
      this.mainWindow = null;
    }

    console.log('[ENGINE] Communication manager disposed');
  }
}
