/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Shared Types
 *
 * Common type definitions used across main and renderer processes.
 * Defines project structure, editor state, and IPC message types.
 */

/**
 * Project file format (.worldenv)
 */
export interface ProjectData {
  version: string;
  name: string;
  engine_version: string;
  created: number;
  modified: number;
  settings: ProjectSettings;
  scenes: string[];
  prefabs: string[];
  assets: AssetManifest;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  default_scene: string;
  viewport: ViewportSettings;
  rendering: RenderingSettings;
  physics: PhysicsSettings;
  audio: AudioSettings;
}

/**
 * Viewport configuration
 */
export interface ViewportSettings {
  mode: '2d' | '3d';
  grid_visible: boolean;
  grid_size: number;
  snap_enabled: boolean;
  snap_value: number;
}

/**
 * Rendering configuration
 */
export interface RenderingSettings {
  renderer: 'webgl' | 'webgpu' | 'canvas';
  antialias: boolean;
  vsync: boolean;
  target_fps: number;
  resolution_scale: number;
}

/**
 * Physics configuration
 */
export interface PhysicsSettings {
  enabled: boolean;
  gravity: [number, number];
  fixed_timestep: number;
}

/**
 * Audio configuration
 */
export interface AudioSettings {
  master_volume: number;
  music_volume: number;
  sfx_volume: number;
}

/**
 * Asset manifest
 */
export interface AssetManifest {
  textures: AssetEntry[];
  audio: AssetEntry[];
  scripts: AssetEntry[];
  fonts: AssetEntry[];
  data: AssetEntry[];
  materials: AssetEntry[];
  shaders: AssetEntry[];
}

/**
 * Asset entry
 */
export interface AssetEntry {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  imported: number;
  metadata: Record<string, unknown>;
}

/**
 * Scene file format
 */
export interface SceneData {
  version: string;
  name: string;
  entities: EntityData[];
  root_entities: string[];
}

/**
 * Entity data
 */
export interface EntityData {
  id: string;
  name: string;
  parent: string | null;
  children: string[];
  components: ComponentData[];
  enabled: boolean;
}

/**
 * Component data
 */
export interface ComponentData {
  type: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

/**
 * Editor state
 */
export interface EditorState {
  project_path: string | null;
  current_scene: string | null;
  selected_entities: string[];
  viewport_mode: '2d' | '3d';
  tool_mode: ToolMode;
  grid_visible: boolean;
  snap_enabled: boolean;
}

/**
 * Tool modes
 */
export type ToolMode = 'select' | 'translate' | 'rotate' | 'scale' | 'rect' | 'circle';

/**
 * Window state
 */
export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
}

/**
 * Panel layout state
 */
export interface PanelLayout {
  panels: PanelState[];
  main_split: number;
  left_split: number;
  right_split: number;
  bottom_split: number;
}

/**
 * Panel state
 */
export interface PanelState {
  id: string;
  type: PanelType;
  visible: boolean;
  position: 'left' | 'right' | 'bottom' | 'center';
  width?: number;
  height?: number;
}

/**
 * Panel types
 */
export type PanelType =
  | 'viewport'
  | 'hierarchy'
  | 'inspector'
  | 'assets'
  | 'console'
  | 'script_editor';

/**
 * IPC message types
 */
export interface IPCMessages {
  'app:get-version': {
    request: void;
    response: string;
  };
  'app:get-path': {
    request: string;
    response: string;
  };
  'fs:read-file': {
    request: string;
    response: string;
  };
  'fs:write-file': {
    request: { path: string; content: string };
    response: void;
  };
  'fs:exists': {
    request: string;
    response: boolean;
  };
  'dialog:open-file': {
    request: DialogOptions;
    response: string | null;
  };
  'dialog:save-file': {
    request: DialogOptions;
    response: string | null;
  };
  'dialog:open-directory': {
    request: DialogOptions;
    response: string | null;
  };
  'dialog:show-message': {
    request: MessageDialogOptions;
    response: number;
  };
  'project:open': {
    request: string;
    response: ProjectData;
  };
  'project:save': {
    request: { path: string; data: ProjectData };
    response: void;
  };
  'project:close': {
    request: void;
    response: void;
  };
}

/**
 * Dialog options
 */
export interface DialogOptions {
  title?: string;
  default_path?: string;
  filters?: FileFilter[];
  properties?: string[];
}

/**
 * File filter
 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * Message dialog options
 */
export interface MessageDialogOptions {
  type: 'info' | 'warning' | 'error' | 'question';
  title: string;
  message: string;
  detail?: string;
  buttons?: string[];
  default_id?: number;
  cancel_id?: number;
}

/**
 * Error types
 */
export class EditorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EditorError';
  }
}

export class ProjectError extends EditorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROJECT_ERROR', details);
    this.name = 'ProjectError';
  }
}

export class FileSystemError extends EditorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FS_ERROR', details);
    this.name = 'FileSystemError';
  }
}

export class ValidationError extends EditorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Build configuration
 */
export interface BuildConfiguration {
  outputDirectory: string;
  buildTarget: string;
  optimizationLevel: string;
  entryScene: string;
  includeAssets: boolean;
  includeScripts: boolean;
  generateSourceMaps: boolean;
  minifyOutput: boolean;
}

/**
 * Build progress
 */
export interface BuildProgress {
  stage: string;
  progress: number;
  message: string;
  error?: string;
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  outputPath: string;
  errors: string[];
  warnings: string[];
  buildTime: number;
}

/**
 * Build target
 */
export interface BuildTarget {
  id: string;
  name: string;
  description: string;
}

/**
 * Optimization level
 */
export interface OptimizationLevel {
  id: string;
  name: string;
  description: string;
}

/**
 * Asset type enumeration
 */
export type AssetType =
  | 'folder'
  | 'image'
  | 'audio'
  | 'model'
  | 'script'
  | 'scene'
  | 'material'
  | 'font'
  | 'data'
  | 'shader'
  | 'unknown';

/**
 * Image metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  channels: number;
  format: string;
  compressed: boolean;
}

/**
 * Audio metadata
 */
export interface AudioMetadata {
  duration: number;
  channels: number;
  sampleRate: number;
  bitrate?: number;
  format: string;
}

/**
 * Model metadata
 */
export interface ModelMetadata {
  vertices: number;
  faces: number;
  materials: string[];
  animations?: string[];
  format: string;
}

/**
 * WorldC metadata
 */
export interface WorldCMetadata {
  version: string;
  target: 'typescript' | 'assemblyscript';
  exports: string[];
  dependencies: string[];
  compiled: Date;
  compiledPath?: string;
  lastCompiled?: Date;
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;
  animations: string[];
  format: string;
}

/**
 * Asset metadata interface
 */
export interface AssetMetadata {
  id: string;
  imported: Date;
  tags: string[];
  description?: string;
  thumbnail?: string;
  imageInfo?: ImageMetadata;
  audioInfo?: AudioMetadata;
  modelInfo?: ModelMetadata;
  worldcInfo?: WorldCMetadata;
}

/**
 * Asset item interface
 */
export interface AssetItem {
  name: string;
  type: AssetType;
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  created: Date;
  extension: string;
  metadata: AssetMetadata;
  children?: AssetItem[];
}
