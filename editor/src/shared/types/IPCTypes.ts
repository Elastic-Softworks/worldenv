/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - IPC Communication Types
 *
 * Defines type-safe IPC communication protocols between main and renderer processes.
 * Provides command/response patterns, event subscriptions, and message queuing.
 */

/**
 * IPCCommand interface
 *
 * Base structure for IPC command messages.
 */
export interface IPCCommand<T = unknown> {
  id: string;
  channel: string;
  type: 'command';
  payload: T;
  timestamp: number;
  timeout?: number;
  priority?: IPCPriority;
}

/**
 * IPCResponse interface
 *
 * Base structure for IPC response messages.
 */
export interface IPCResponse<T = unknown> {
  id: string;
  channel: string;
  type: 'response';
  payload: T;
  timestamp: number;
  success: boolean;
  error?: IPCError;
}

/**
 * IPCEvent interface
 *
 * Base structure for IPC event messages.
 */
export interface IPCEvent<T = unknown> {
  id: string;
  channel: string;
  type: 'event';
  payload: T;
  timestamp: number;
  source: 'main' | 'renderer' | 'engine';
}

/**
 * IPCError interface
 *
 * Standard error structure for IPC communication.
 */
export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
  timestamp?: number;
}

/**
 * IPCPriority enum
 *
 * Priority levels for IPC message processing.
 */
export enum IPCPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * IPCMessageType union
 *
 * All possible IPC message types.
 */
export type IPCMessage<T = unknown> = IPCCommand<T> | IPCResponse<T> | IPCEvent<T>;

/**
 * Engine Command Types
 *
 * Specific command types for engine communication.
 */
export interface EngineInitializeCommand {
  options: {
    enableDebug?: boolean;
    enableProfiling?: boolean;
    maxFPS?: number;
    enableWebGL2?: boolean;
    enableAudio?: boolean;
    enablePhysics?: boolean;
  };
}

export interface EngineLoadSceneCommand {
  scenePath: string;
  options?: {
    validateScene?: boolean;
    loadAssets?: boolean;
    resetCamera?: boolean;
  };
}

export interface EngineSetPlayModeCommand {
  playMode: boolean;
  options?: {
    preserveSelection?: boolean;
    resetPhysics?: boolean;
  };
}

export interface EngineExecuteScriptCommand {
  scriptPath: string;
  options?: {
    hotReload?: boolean;
    debugMode?: boolean;
  };
}

export interface EngineCreateEntityCommand {
  parentId?: string;
  template?: string;
  properties?: Record<string, unknown>;
}

export interface EngineUpdateComponentCommand {
  entityId: string;
  componentType: string;
  properties: Record<string, unknown>;
}

/**
 * Engine Response Types
 *
 * Response payloads for engine commands.
 */
export interface EngineInitializeResponse {
  success: boolean;
  capabilities: {
    supports3D: boolean;
    supports2D: boolean;
    supportsPhysics: boolean;
    supportsAudio: boolean;
    supportsScripting: boolean;
    maxTextureSize: number;
    supportedFormats: string[];
  };
  initializationTime: number;
}

export interface EngineLoadSceneResponse {
  success: boolean;
  sceneId: string;
  entityCount: number;
  validationResults?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface EngineCreateEntityResponse {
  success: boolean;
  entityId: string;
  components: string[];
}

/**
 * Engine Event Types
 *
 * Events emitted by the engine system.
 */
export interface EngineStatusChangedEvent {
  status: string;
  message?: string;
  progress?: number;
  error?: IPCError;
}

export interface EngineEntityCreatedEvent {
  entityId: string;
  parentId?: string;
  components: string[];
}

export interface EngineEntityDestroyedEvent {
  entityId: string;
}

export interface EngineComponentAddedEvent {
  entityId: string;
  componentType: string;
  componentId: string;
}

export interface EngineComponentRemovedEvent {
  entityId: string;
  componentType: string;
  componentId: string;
}

export interface EngineSceneLoadedEvent {
  sceneId: string;
  scenePath: string;
  entityCount: number;
}

export interface EnginePlayModeChangedEvent {
  isPlayMode: boolean;
  isPaused: boolean;
}

export interface EngineStatsUpdatedEvent {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  memory: number;
  entities: number;
}

/**
 * IPC Channel Names
 *
 * Standard channel names for different types of communication.
 */
export const IPCChannels = {
  // Engine communication
  ENGINE_INITIALIZE: 'engine:initialize',
  ENGINE_DISPOSE: 'engine:dispose',
  ENGINE_LOAD_SCENE: 'engine:load-scene',
  ENGINE_SAVE_SCENE: 'engine:save-scene',
  ENGINE_SET_PLAY_MODE: 'engine:set-play-mode',
  ENGINE_EXECUTE_SCRIPT: 'engine:execute-script',
  ENGINE_GET_STATUS: 'engine:get-status',
  ENGINE_GET_STATS: 'engine:get-stats',

  // Scene management
  SCENE_CREATE: 'scene:create',
  SCENE_LOAD: 'scene:load',
  SCENE_SAVE: 'scene:save',
  SCENE_DELETE: 'scene:delete',
  SCENE_LIST: 'scene:list',
  SCENE_VALIDATE: 'scene:validate',

  // Entity management
  ENGINE_CREATE_ENTITY: 'engine:create-entity',
  ENGINE_DESTROY_ENTITY: 'engine:destroy-entity',
  ENGINE_UPDATE_ENTITY: 'engine:update-entity',
  ENGINE_SELECT_ENTITY: 'engine:select-entity',

  // Component management
  ENGINE_ADD_COMPONENT: 'engine:add-component',
  ENGINE_REMOVE_COMPONENT: 'engine:remove-component',
  ENGINE_UPDATE_COMPONENT: 'engine:update-component',
  ENGINE_GET_COMPONENT: 'engine:get-component',

  // Asset management
  ENGINE_LOAD_ASSET: 'engine:load-asset',
  ENGINE_UNLOAD_ASSET: 'engine:unload-asset',
  ENGINE_GET_ASSET_INFO: 'engine:get-asset-info',

  // Script compilation
  ENGINE_COMPILE_SCRIPT: 'engine:compile-script',
  ENGINE_VALIDATE_SCRIPT: 'engine:validate-script',
  ENGINE_SCRIPT_COMPILED: 'engine:script-compiled',
  ENGINE_COMPILATION_STARTED: 'engine:compilation-started',
  ENGINE_COMPILATION_COMPLETED: 'engine:compilation-completed',
  ENGINE_COMPILATION_FAILED: 'engine:compilation-failed',

  // Hot-reload
  ENGINE_START_HOT_RELOAD: 'engine:start-hot-reload',
  ENGINE_STOP_HOT_RELOAD: 'engine:stop-hot-reload',
  ENGINE_HOT_RELOAD: 'engine:hot-reload',
  ENGINE_SCRIPT_CHANGED: 'engine:script-changed',
  ENGINE_HOT_RELOAD_COMPLETED: 'engine:hot-reload-completed',
  ENGINE_HOT_RELOAD_FAILED: 'engine:hot-reload-failed',

  // Events
  ENGINE_STATUS_CHANGED: 'engine:status-changed',
  ENGINE_ENTITY_CREATED: 'engine:entity-created',
  ENGINE_ENTITY_DESTROYED: 'engine:entity-destroyed',
  ENGINE_COMPONENT_ADDED: 'engine:component-added',
  ENGINE_COMPONENT_REMOVED: 'engine:component-removed',
  ENGINE_SCENE_LOADED: 'engine:scene-loaded',
  ENGINE_PLAY_MODE_CHANGED: 'engine:play-mode-changed',
  ENGINE_STATS_UPDATED: 'engine:stats-updated',

  // System communication
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_SHUTDOWN: 'system:shutdown'
} as const;

/**
 * IPCChannelName type
 *
 * Type-safe channel names.
 */
export type IPCChannelName = (typeof IPCChannels)[keyof typeof IPCChannels];

/**
 * CommandQueue interface
 *
 * Command queue configuration and state.
 */
export interface CommandQueue {
  maxSize: number;
  processingTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * QueuedCommand interface
 *
 * Command with queue metadata.
 */
export interface QueuedCommand<T = unknown> extends IPCCommand<T> {
  queuedAt: number;
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * EventSubscription interface
 *
 * Event subscription configuration.
 */
export interface EventSubscription {
  channel: IPCChannelName;
  callback: (event: IPCEvent) => void;
  once?: boolean;
  filter?: (event: IPCEvent) => boolean;
}

/**
 * Communication Statistics
 *
 * Statistics for IPC communication monitoring.
 */
export interface IPCStatistics {
  commandsSent: number;
  commandsReceived: number;
  responsesReceived: number;
  eventsReceived: number;
  averageResponseTime: number;
  failedCommands: number;
  queueSize: number;
  subscriptions: number;
}

/**
 * Scene Management Commands
 */

export interface SceneCreateCommand {
  projectPath: string;
  fileName: string;
  options?: {
    name?: string;
    author?: string;
    description?: string;
    template?: 'empty' | '2d' | '3d';
  };
}

export interface SceneLoadCommand {
  scenePath: string;
}

export interface SceneSaveCommand {
  scenePath: string;
  sceneData: import('./SceneTypes').SceneData;
}

export interface SceneDeleteCommand {
  scenePath: string;
}

export interface SceneListCommand {
  projectPath: string;
}

export interface SceneValidateCommand {
  sceneData: import('./SceneTypes').SceneData;
}

/**
 * Scene Management Responses
 */

export interface SceneCreateResponse {
  success: boolean;
  scenePath: string;
}

export interface SceneLoadResponse {
  success: boolean;
  sceneData: import('./SceneTypes').SceneData;
}

export interface SceneSaveResponse {
  success: boolean;
}

export interface SceneDeleteResponse {
  success: boolean;
}

export interface SceneListResponse {
  success: boolean;
  scenes: Array<{
    name: string;
    path: string;
    metadata: import('./SceneTypes').SceneMetadata;
  }>;
}

export interface SceneValidateResponse {
  success: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
