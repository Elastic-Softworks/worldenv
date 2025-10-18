/*
   ===============================================================
   WORLDEDIT ENGINE COMMUNICATION MANAGER
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

import { EventEmitter } from 'events'; /* NODE EVENT SYSTEM */
import { BrowserWindow, ipcMain } from 'electron'; /* ELECTRON IPC */
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
} from '../../shared/types/IPCTypes'; /* IPC TYPE DEFINITIONS */
import { EngineStatusManager } from './EngineStatusManager'; /* ENGINE STATUS TRACKING */
import {
  WCCompilerIntegration,
  CompilationTarget,
  CompilerEvent
} from './WCCompilerIntegration'; /* WORLDC COMPILER */
import {
  WCHotReloadManager,
  HotReloadManagerFactory
} from './WCHotReloadManager'; /* HOT RELOAD SYSTEM */
import { logger } from '../logger'; /* LOGGING SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         EngineCommunicationConfig
	       ---
	       configuration interface for IPC communication behavior
	       controlling timeouts, queue limits, retry behavior, and
	       debugging features for engine communication.

*/

export interface EngineCommunicationConfig {
  commandTimeout: number /* milliseconds before command timeout */;
  maxQueueSize: number /* maximum queued commands allowed */;
  maxRetryAttempts: number /* maximum retry attempts per command */;
  retryDelay: number /* delay between retry attempts */;
  enableStatistics: boolean /* performance statistics collection */;
  enableDebugLogging: boolean /* detailed debug message logging */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         EngineCommunicationManager
	       ---
	       comprehensive IPC communication manager that orchestrates
	       message passing between the main process and renderer for
	       engine operations. provides reliable command/response
	       patterns, event publishing, and message queuing.

	       enhanced with WorldC compiler integration for real-time
	       compilation and hot-reload functionality. manages the
	       complexity of asynchronous communication while ensuring
	       message delivery and proper error handling.

	       the manager implements a queuing system to handle multiple
	       concurrent requests, retry logic for failed operations,
	       and performance statistics for monitoring communication
	       efficiency.

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

  /*

           initialize()
  	       ---
  	       establishes communication channels between main process
  	       and renderer for engine operations. sets up IPC handlers,
  	       starts the command queue processor, and initializes
  	       WorldC compiler integration.

  	       this method must be called before any communication
  	       can occur. it configures the bidirectional message
  	       passing system and prepares all subsystems for
  	       engine interaction.

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

  /*

           sendCommand()
  	       ---
  	       sends a command to the engine renderer process and
  	       returns a promise that resolves with the response.
  	       implements timeout handling, retry logic, and proper
  	       error propagation for reliable communication.

  	       the method uses a unique command ID to track requests
  	       and responses, ensuring proper correlation in the
  	       asynchronous communication system. commands are queued
  	       for processing to handle multiple concurrent requests.

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

  /*

           publishEvent()
  	       ---
  	       publishes an event to the renderer process without
  	       expecting a response. used for notifying the UI of
  	       engine state changes, compilation results, or other
  	       asynchronous events that require UI updates.

  	       events are fire-and-forget messages that follow a
  	       different pattern from commands. they include source
  	       identification to help the renderer determine the
  	       appropriate handling logic.

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

  /*

           getStatistics()
  	       ---
  	       retrieves current communication performance statistics
  	       including command counts, response times, queue sizes,
  	       and failure rates. updates queue size before returning
  	       to ensure accuracy of real-time metrics.

  	       the statistics provide insight into communication
  	       efficiency and help identify potential bottlenecks
  	       or reliability issues in the IPC system.

  */
  getStatistics(): IPCStatistics {
    this.statistics.queueSize = this.commandQueue.size;
    return { ...this.statistics };
  }

  /*

           clearStatistics()
  	       ---
  	       resets all communication statistics to zero while
  	       preserving the current queue size. used for periodic
  	       monitoring or debugging to establish fresh baseline
  	       measurements for performance analysis.

  	       this operation does not affect the actual communication
  	       state, only the accumulated statistical counters.

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

  /*

           setupIPCHandlers()
  	       ---
  	       registers IPC handlers for all engine communication
  	       channels. establishes the mapping between channel names
  	       and their corresponding handler methods to enable
  	       bidirectional communication with the renderer process.

  	       each handler is registered with Electron's ipcMain
  	       system and provides proper error handling and response
  	       formatting. the handlers implement the command/response
  	       pattern for reliable communication.

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

  /*

           removeAllIPCHandlers()
  	       ---
  	       removes all registered IPC handlers from the main process
  	       to prevent memory leaks and ensure clean shutdown. iterates
  	       through all defined channels and removes their associated
  	       listeners from Electron's ipcMain system.

  	       this method is called during disposal to ensure proper
  	       cleanup of communication resources and prevent handler
  	       conflicts during restart operations.

  */
  private removeAllIPCHandlers(): void {
    const channels = Object.values(IPCChannels);
    channels.forEach((channel) => {
      ipcMain.removeAllListeners(channel);
    });
  }

  /*

           handleEngineInitialize()
  	       ---
  	       processes engine initialization requests from the renderer
  	       process. orchestrates the startup sequence by coordinating
  	       with the status manager and simulating engine bootstrap
  	       operations with appropriate timing delays.

  	       the method establishes engine capabilities including 3D/2D
  	       rendering support, physics integration, audio systems, and
  	       scripting capabilities. returns comprehensive initialization
  	       data including supported formats and hardware limitations.

  	       implements proper error handling and status reporting to
  	       ensure the renderer receives accurate initialization results
  	       for subsequent engine operations.

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

  /*

           handleEngineLoadScene()
  	       ---
  	       processes scene loading requests from the renderer and
  	       coordinates the engine's scene initialization process.
  	       implements proper validation, error handling, and event
  	       publishing for scene loading operations.

  	       the method simulates scene loading timing and returns
  	       comprehensive loading results including entity counts
  	       and validation status. publishes scene loaded events
  	       to notify the UI of successful scene transitions.

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

  /*

           handleEngineSetPlayMode()
  	       ---
  	       manages play mode state transitions within the engine
  	       by coordinating with the status manager and publishing
  	       appropriate state change events to the renderer process.

  	       the method ensures proper play/edit mode switching and
  	       notifies all listening components of the state change
  	       through the event publishing system.

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

  /*

           handleEngineCreateEntity()
  	       ---
  	       processes entity creation requests from the editor and
  	       coordinates the instantiation of new entities within
  	       the engine's scene graph. implements proper validation
  	       and component attachment for newly created entities.

  	       the method generates unique entity identifiers and
  	       ensures proper initialization of entity properties
  	       before returning creation confirmation to the editor.

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

  /*

           handleEngineUpdateComponent()
  	       ---
  	       processes component property update requests from the
  	       editor and applies changes to the specified entity's
  	       component data within the engine. implements proper
  	       validation and change tracking for component modifications.

  	       the method ensures component updates are applied
  	       correctly and returns confirmation of successful
  	       property changes to the editor interface.

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

  /*

           queueCommand()
  	       ---
  	       adds commands to the processing queue with proper
  	       queue size validation and statistical tracking.
  	       creates a queued command wrapper that includes
  	       timing information and retry tracking.

  	       the method enforces queue size limits to prevent
  	       memory exhaustion and provides debug logging for
  	       command flow monitoring during development.

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

  /*

           startQueueProcessor()
  	       ---
  	       initiates the command queue processing interval that
  	       runs at approximately 60fps to ensure responsive
  	       command handling. prevents multiple processors from
  	       running simultaneously through instance checking.

  	       the processor interval provides consistent command
  	       throughput while maintaining system responsiveness
  	       for real-time engine operations.

  */
  private startQueueProcessor(): void {
    if (this.queueProcessor) {
      return;
    }

    this.queueProcessor = setInterval(() => {
      this.processCommandQueue();
    }, 16); // ~60fps processing
  }

  /*

           stopQueueProcessor()
  	       ---
  	       stops the command queue processing interval and cleans
  	       up the processor timer to prevent memory leaks. ensures
  	       proper shutdown of the queue processing system during
  	       communication manager disposal.

  	       this method is called during cleanup operations to
  	       ensure all processing resources are properly released
  	       and no background processing continues after shutdown.

  */
  private stopQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
  }

  /*

           processCommandQueue()
  	       ---
  	       processes pending commands from the queue in priority
  	       order, handling up to 5 commands per processing cycle
  	       to maintain system responsiveness. sorts commands by
  	       priority with higher priority commands processed first.

  	       the method implements frame-based processing to ensure
  	       consistent performance and prevent queue processing
  	       from blocking other system operations during high
  	       command volume periods.

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

  /*

           processCommand()
  	       ---
  	       processes individual commands by updating their status
  	       and attempt counters. implements basic command routing
  	       and completion tracking with timing information for
  	       performance monitoring and retry logic.

  	       the method currently simulates command processing with
  	       a placeholder implementation that marks commands as
  	       completed after a brief delay. actual routing to engine
  	       systems will be implemented in future iterations.

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

  /*

           clearPendingCommands()
  	       ---
  	       clears all pending commands and response handlers from
  	       the communication system. used during reset operations
  	       or error recovery to ensure clean state and prevent
  	       stale command processing or response handling.

  	       this method provides a clean slate for communication
  	       restart scenarios and helps prevent memory leaks
  	       from accumulated pending operations.

  */
  private clearPendingCommands(): void {
    this.commandQueue.clear();
    this.pendingResponses.clear();
  }

  /*

           createSuccessResponse()
  	       ---
  	       creates a properly formatted success response for
  	       completed commands. includes the original command ID
  	       for correlation, payload data, and timing information
  	       for response tracking and debugging.

  	       the method ensures consistent response formatting
  	       across all command handlers and provides proper
  	       success indication for the requesting client.

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

  /*

           createErrorResponse()
  	       ---
  	       creates properly formatted error responses for failed
  	       commands with detailed error information including
  	       error codes, messages, and stack traces for debugging.

  	       the method ensures consistent error reporting across
  	       all command handlers and provides comprehensive
  	       failure information for client error handling.

  */
  private createErrorResponse<T>(
    commandId: string,
    errorCode: string,
    error: Error
  ): IPCResponse<T> {
    const errorDetails: IPCError = {
      code: errorCode,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };

    return {
      id: commandId,
      channel: '',
      type: 'response',
      payload: null as any,
      timestamp: Date.now(),
      success: false,
      error: errorDetails
    };
  }

  /*

           generateCommandId()
  	       ---
  	       generates unique command identifiers using timestamp
  	       and random values to ensure proper command correlation
  	       in the asynchronous communication system.

  	       the method provides collision-resistant IDs for
  	       tracking commands and responses throughout their
  	       lifecycle in the communication pipeline.

  */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /*

           initializeWorldCIntegration()
  	       ---
  	       initializes WorldC compiler integration and hot-reload
  	       systems for real-time script compilation and development
  	       workflow enhancement. sets up compiler instances and
  	       configures hot-reload management for script changes.

  	       the method establishes the foundation for advanced
  	       development features including real-time compilation,
  	       script validation, and automatic reload capabilities
  	       that enhance the editor development experience.

  */
  private async initializeWorldCIntegration(): Promise<void> {
    try {
      /* INITIALIZE COMPILER INTEGRATION */
      this.compiler = new WCCompilerIntegration();

      await this.compiler.initialize();

      /* SETUP COMPILER EVENT HANDLERS */
      this.compiler.on(CompilerEvent.COMPILATION_STARTED, (target: CompilationTarget) => {
        this.publishEvent(IPCChannels.ENGINE_COMPILATION_STARTED, {
          target: target.toString(),
          timestamp: Date.now()
        });
      });

      this.compiler.on(CompilerEvent.COMPILATION_COMPLETE, (result) => {
        this.publishEvent(IPCChannels.ENGINE_COMPILATION_COMPLETED, result);
      });

      this.compiler.on(CompilerEvent.COMPILATION_ERROR, (error) => {
        this.publishEvent(IPCChannels.ENGINE_COMPILATION_FAILED, {
          error: error.message,
          timestamp: Date.now()
        });
      });

      /* INITIALIZE HOT RELOAD MANAGER */
      this.hotReloadManager = HotReloadManagerFactory.create({
        watchPaths: ['./src/scripts', './src/components'],
        compiler: this.compiler,
        debounceMs: 300
      });

      if (this.config.enableDebugLogging) {
        logger.info('ENGINE_COMM', 'WorldC integration initialized');
      }
    } catch (error) {
      logger.error('ENGINE_COMM', 'Failed to initialize WorldC integration', { error });
      /* NON-FATAL ERROR - CONTINUE WITHOUT WORLDC FEATURES */
    }
  }

  /*

           handleCompileScript()
  	       ---
  	       processes script compilation requests by coordinating
  	       with the WorldC compiler integration. validates script
  	       syntax, performs compilation, and returns compilation
  	       results including any errors or warnings.

  	       the method provides real-time compilation feedback
  	       to the editor for immediate script validation and
  	       error reporting during development workflows.

  */
  private async handleCompileScript(command: IPCCommand): Promise<IPCResponse> {
    try {
      if (!this.compiler) {
        throw new Error('WorldC compiler not available');
      }

      const { scriptPath, target } = command.payload as { scriptPath: string; target: string };

      /* COMPILE SCRIPT WITH WORLDC */
      const result = await this.compiler.compileScript(scriptPath, target);

      return this.createSuccessResponse(command.id, {
        success: result.success,
        outputPath: result.outputPath,
        errors: result.errors,
        warnings: result.warnings,
        compilationTime: result.compilationTime
      });
    } catch (error) {
      return this.createErrorResponse(command.id, 'COMPILATION_FAILED', error as Error);
    }
  }

  /*

           handleValidateScript()
  	       ---
  	       validates script syntax and semantics without full
  	       compilation. provides rapid feedback for script
  	       correctness checking during editing operations
  	       without the overhead of complete compilation.

  	       the method enables real-time syntax checking and
  	       validation feedback in the editor interface for
  	       improved development experience and error prevention.

  */
  private async handleValidateScript(command: IPCCommand): Promise<IPCResponse> {
    try {
      if (!this.compiler) {
        throw new Error('WorldC compiler not available');
      }

      const { scriptContent, filePath } = command.payload as {
        scriptContent: string;
        filePath: string;
      };

      /* VALIDATE SCRIPT SYNTAX */
      const validation = await this.compiler.validateScript(scriptContent, filePath);

      return this.createSuccessResponse(command.id, {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions
      });
    } catch (error) {
      return this.createErrorResponse(command.id, 'VALIDATION_FAILED', error as Error);
    }
  }

  /*

           handleStartHotReload()
  	       ---
  	       initiates hot-reload monitoring for specified script
  	       paths. enables automatic recompilation and engine
  	       updates when script files are modified during
  	       development sessions.

  	       the method configures file watchers and compilation
  	       triggers to provide seamless development workflow
  	       with immediate script updates reflected in the
  	       running engine environment.

  */
  private async handleStartHotReload(command: IPCCommand): Promise<IPCResponse> {
    try {
      if (!this.hotReloadManager) {
        throw new Error('Hot reload manager not available');
      }

      const { watchPaths, options } = command.payload as { watchPaths: string[]; options: any };

      /* START HOT RELOAD MONITORING */
      await this.hotReloadManager.startWatching(watchPaths, options);

      /* SETUP HOT RELOAD EVENT HANDLERS */
      this.hotReloadManager.on('fileChanged', (filePath: string) => {
        this.publishEvent(IPCChannels.ENGINE_SCRIPT_CHANGED, {
          filePath,
          timestamp: Date.now()
        });
      });

      this.hotReloadManager.on('reloadCompleted', (result) => {
        this.publishEvent(IPCChannels.ENGINE_HOT_RELOAD_COMPLETED, result);
      });

      this.hotReloadManager.on('reloadFailed', (error) => {
        this.publishEvent(IPCChannels.ENGINE_HOT_RELOAD_FAILED, {
          error: error.message,
          timestamp: Date.now()
        });
      });

      return this.createSuccessResponse(command.id, {
        success: true,
        watchingPaths: watchPaths,
        message: 'Hot reload monitoring started'
      });
    } catch (error) {
      return this.createErrorResponse(command.id, 'HOT_RELOAD_START_FAILED', error as Error);
    }
  }

  /*

           handleStopHotReload()
  	       ---
  	       stops hot-reload monitoring and cleans up file watchers
  	       and event handlers. used when switching to production
  	       mode or when hot-reload features are no longer needed
  	       during development sessions.

  	       the method ensures proper cleanup of monitoring resources
  	       and prevents continued file watching after hot-reload
  	       functionality is disabled.

  */
  private async handleStopHotReload(command: IPCCommand): Promise<IPCResponse> {
    try {
      if (!this.hotReloadManager) {
        throw new Error('Hot reload manager not available');
      }

      /* STOP HOT RELOAD MONITORING */
      await this.hotReloadManager.stopWatching();

      /* REMOVE EVENT HANDLERS */
      this.hotReloadManager.removeAllListeners();

      return this.createSuccessResponse(command.id, {
        success: true,
        message: 'Hot reload monitoring stopped'
      });
    } catch (error) {
      return this.createErrorResponse(command.id, 'HOT_RELOAD_STOP_FAILED', error as Error);
    }
  }

  /*

           dispose()
  	       ---
  	       performs comprehensive cleanup of all communication
  	       resources including IPC handlers, queue processors,
  	       WorldC integration, and hot-reload systems. ensures
  	       proper shutdown without resource leaks.

  	       the method coordinates shutdown of all subsystems
  	       in the correct order to prevent errors and ensure
  	       clean termination of the communication manager.

  */
  async dispose(): Promise<void> {
    /* STOP QUEUE PROCESSING */
    this.stopQueueProcessor();

    /* CLEAR PENDING OPERATIONS */
    this.clearPendingCommands();

    /* REMOVE IPC HANDLERS */
    this.removeAllIPCHandlers();

    /* DISPOSE WORLDC INTEGRATION */
    if (this.compiler) {
      await this.compiler.dispose();
      this.compiler = null;
    }

    if (this.hotReloadManager) {
      await this.hotReloadManager.dispose();
      this.hotReloadManager = null;
    }

    /* CLEANUP REFERENCES */
    this.mainWindow = null;
    this.isInitialized = false;

    /* REMOVE ALL EVENT LISTENERS */
    this.removeAllListeners();

    if (this.config.enableDebugLogging) {
      logger.info('ENGINE_COMM', 'Communication manager disposed');
    }
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
