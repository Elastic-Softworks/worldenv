/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Types
 *
 * Shared type definitions for engine status, state management,
 * and communication between main and renderer processes.
 */

/**
 * EngineStatus enum
 *
 * Defines the various states the engine can be in during its lifecycle.
 */
export enum EngineStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSING = 'disposing'
}

/**
 * EngineState interface
 *
 * Complete state information for the engine system.
 */
export interface EngineState {
  status: EngineStatus;
  isInitialized: boolean;
  isRunning: boolean;
  isPlayMode: boolean;
  isPaused: boolean;
  hasErrors: boolean;
  errorMessage?: string;
  lastErrorTime?: string;
  initializationProgress?: number;
  capabilities?: EngineCapabilities;
}

/**
 * EngineCapabilities interface
 *
 * Information about what the engine can do.
 */
export interface EngineCapabilities {
  supports3D: boolean;
  supports2D: boolean;
  supportsPhysics: boolean;
  supportsAudio: boolean;
  supportsScripting: boolean;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  maxVertices: number;
  supportedFormats: string[];
}

/**
 * EngineStats interface
 *
 * Performance and runtime statistics from the engine.
 */
export interface EngineStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  memory: number;
  gpuMemory?: number;
  entities: number;
  systems: number;
}

/**
 * EngineInfo interface
 *
 * Static information about the engine version and features.
 */
export interface EngineInfo {
  version: string;
  buildDate: string;
  features: string[];
  formats: string[];
  renderer: string;
  platform: string;
}

/**
 * EngineInitializationOptions interface
 *
 * Configuration options for engine initialization.
 */
export interface EngineInitializationOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  enableDebug?: boolean;
  enableProfiling?: boolean;
  maxFPS?: number;
  enableWebGL2?: boolean;
  enableAudio?: boolean;
  enablePhysics?: boolean;
}

/**
 * EngineHealthCheck interface
 *
 * Results from engine health monitoring.
 */
export interface EngineHealthCheck {
  timestamp: string;
  status: EngineStatus;
  isResponsive: boolean;
  memoryUsage: number;
  cpuUsage?: number;
  errorCount: number;
  warningCount: number;
  lastError?: string;
  lastWarning?: string;
}

/**
 * EngineEvent types
 *
 * Event types that can be emitted by the engine system.
 */
export type EngineEventType =
  | 'status-changed'
  | 'initialized'
  | 'error'
  | 'warning'
  | 'stats-updated'
  | 'health-check'
  | 'play-mode-started'
  | 'play-mode-stopped'
  | 'play-mode-paused'
  | 'play-mode-resumed'
  | 'scene-loaded'
  | 'scene-unloaded'
  | 'entity-created'
  | 'entity-destroyed'
  | 'component-added'
  | 'component-removed';

/**
 * EngineEvent interface
 *
 * Structure for engine events.
 */
export interface EngineEvent {
  type: EngineEventType;
  timestamp: string;
  data?: unknown;
  source: 'main' | 'renderer' | 'engine';
}

/**
 * EngineStatusUpdate interface
 *
 * Update message for engine status changes.
 */
export interface EngineStatusUpdate {
  status: EngineStatus;
  message?: string;
  progress?: number;
  timestamp: string;
  error?: Error;
}
