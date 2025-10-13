/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Scene Data Types
 *
 * Type definitions for scene serialization and engine integration.
 * Defines the data format for scene exchange between editor and engine.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Transform {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export interface AssetReference {
  id: string;
  path: string;
  type: 'image' | 'model' | 'audio' | 'script' | 'material' | 'texture';
}

export interface ComponentData {
  id: string;
  type: string;
  enabled: boolean;
  properties: Record<string, unknown>;
}

export interface TransformComponent extends ComponentData {
  type: 'transform';
  properties: {
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
  };
}

export interface RenderComponent extends ComponentData {
  type: 'render';
  properties: {
    mesh?: AssetReference;
    material?: AssetReference;
    color?: Color;
    visible: boolean;
    castShadows: boolean;
    receiveShadows: boolean;
  };
}

export interface CameraComponent extends ComponentData {
  type: 'camera';
  properties: {
    fov: number;
    aspect: number;
    near: number;
    far: number;
    orthographic: boolean;
    size?: number;
  };
}

export interface LightComponent extends ComponentData {
  type: 'light';
  properties: {
    lightType: 'directional' | 'point' | 'spot' | 'ambient';
    color: Color;
    intensity: number;
    range?: number;
    angle?: number;
    castShadows: boolean;
  };
}

export interface AudioComponent extends ComponentData {
  type: 'audio';
  properties: {
    clip?: AssetReference;
    volume: number;
    pitch: number;
    loop: boolean;
    spatialBlend: number;
    autoPlay: boolean;
  };
}

export interface ScriptComponent extends ComponentData {
  type: 'script';
  properties: {
    script?: AssetReference;
    enabled: boolean;
    parameters: Record<string, unknown>;
  };
}

export interface PhysicsComponent extends ComponentData {
  type: 'physics';
  properties: {
    bodyType: 'static' | 'kinematic' | 'dynamic';
    mass: number;
    friction: number;
    restitution: number;
    isTrigger: boolean;
    colliderType: 'box' | 'sphere' | 'capsule' | 'mesh';
    colliderSize: Vector3;
  };
}

export type AnyComponent =
  | TransformComponent
  | RenderComponent
  | CameraComponent
  | LightComponent
  | AudioComponent
  | ScriptComponent
  | PhysicsComponent
  | ComponentData;

export interface NodeData {
  id: string;
  name: string;
  type: 'scene' | 'camera' | 'light' | 'entity_2d' | 'entity_3d' | 'group';
  enabled: boolean;
  transform: Transform;
  components: AnyComponent[];
  children: NodeData[];
  tags?: string[];
  layer?: number;
}

export interface SceneMetadata {
  version: string;
  createdAt: string;
  modifiedAt: string;
  author?: string;
  description?: string;
  engineVersion?: string;
  editorVersion?: string;
}

export interface SceneSettings {
  ambientColor: Color;
  fogEnabled: boolean;
  fogColor?: Color;
  fogNear?: number;
  fogFar?: number;
  skybox?: AssetReference;
  gravity: Vector3;
  physicsEnabled: boolean;
  audioEnabled: boolean;
}

export interface SceneData {
  id: string;
  name: string;
  rootNode: NodeData;
  settings?: SceneSettings;
  metadata: SceneMetadata;
  assets?: AssetReference[];
}

export interface SceneExportData extends SceneData {
  format: 'worldenv-scene';
  formatVersion: string;
  exportedAt: string;
  exportSettings: {
    includeAssets: boolean;
    compressAssets: boolean;
    optimizeForRuntime: boolean;
  };
}

export interface NodeReference {
  nodeId: string;
  scenePath?: string;
}

export interface ComponentReference {
  nodeId: string;
  componentId: string;
  scenePath?: string;
}

export interface SceneValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  componentId?: string;
  property?: string;
}

export interface SceneValidationResult {
  isValid: boolean;
  errors: SceneValidationError[];
  warnings: SceneValidationError[];
}

export interface SceneDiff {
  added: NodeData[];
  removed: string[];
  modified: {
    nodeId: string;
    changes: Partial<NodeData>;
  }[];
}

export interface SceneSnapshot {
  timestamp: string;
  sceneData: SceneData;
  description?: string;
}

export interface PlayModeState {
  isActive: boolean;
  startTime: string;
  pausedTime?: string;
  editorSnapshot: SceneData;
  runtimeChanges: SceneDiff[];
}
