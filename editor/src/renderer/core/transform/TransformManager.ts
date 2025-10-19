/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Transform Manager
 *
 * Provides transform tool functionality for manipulating entities in 3D space.
 * Handles translation, rotation, scaling with gizmo controls and snapping.
 */

import { SceneManager } from '../hierarchy/SceneManager';
import { UndoRedoManager, ICommand } from '../undo';
import { Vector3, Matrix4, Quaternion, Euler } from 'three';

/**
 * Transform manipulation modes
 */
export enum TransformMode {
  SELECT = 'select',
  TRANSLATE = 'translate',
  ROTATE = 'rotate',
  SCALE = 'scale'
}

/**
 * Coordinate space for transformations
 */
export enum TransformSpace {
  WORLD = 'world',
  LOCAL = 'local',
  SCREEN = 'screen'
}

/**
 * Snapping configuration
 */
export interface SnapSettings {
  enabled: boolean;
  translationStep: number;
  rotationStep: number;
  scaleStep: number;
  snapToGrid: boolean;
  snapToObjects: boolean;
  snapDistance: number;
}

/**
 * Transform state
 */
export interface TransformState {
  mode: TransformMode;
  space: TransformSpace;
  selectedEntities: string[];
  isTransforming: boolean;
  showGizmos: boolean;
  snapSettings: SnapSettings;
  pivotPoint: Vector3;
}

/**
 * Transform data
 */
export interface TransformData {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  matrix?: Matrix4;
}

/**
 * Transform command for undo/redo
 */
class TransformEntitiesCommand implements ICommand {
  public description: string;
  private sceneManager: SceneManager;

  constructor(
    private entityTransforms: Map<string, {
      original: TransformData;
      modified: TransformData;
    }>
  ) {
    const count = entityTransforms.size;
    this.description = `Transform ${count} ${count === 1 ? 'entity' : 'entities'}`;
    this.sceneManager = SceneManager.getInstance();
  }

  execute(): void {
    for (const [entityId, transforms] of this.entityTransforms) {
      this.applyTransform(entityId, transforms.modified);
    }
  }

  undo(): void {
    for (const [entityId, transforms] of this.entityTransforms) {
      this.applyTransform(entityId, transforms.original);
    }
  }

  private applyTransform(entityId: string, transform: TransformData): void {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return;

      const node = scene.getNode(entityId);
      if (node) {
        node.setTransform({
          position: {
            x: transform.position.x,
            y: transform.position.y,
            z: transform.position.z
          },
          rotation: {
            x: transform.rotation.x * 180 / Math.PI,
            y: transform.rotation.y * 180 / Math.PI,
            z: transform.rotation.z * 180 / Math.PI
          },
          scale: {
            x: transform.scale.x,
            y: transform.scale.y,
            z: transform.scale.z
          }
        });
      }
    } catch (error) {
      console.error('[TRANSFORM] Failed to apply transform:', error);
    }
  }
}

/**
 * Transform manager singleton
 */
export class TransformManager {
  private static instance: TransformManager;
  private state: TransformState;
  private sceneManager: SceneManager;
  private undoRedoManager: UndoRedoManager;
  private transformStart: Map<string, TransformData> = new Map();
  private isActive = false;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.undoRedoManager = UndoRedoManager.getInstance();

    this.state = {
      mode: TransformMode.SELECT,
      space: TransformSpace.WORLD,
      selectedEntities: [],
      isTransforming: false,
      showGizmos: true,
      snapSettings: {
        enabled: false,
        translationStep: 1.0,
        rotationStep: 15.0,
        scaleStep: 0.1,
        snapToGrid: true,
        snapToObjects: false,
        snapDistance: 0.5
      },
      pivotPoint: new Vector3()
    };

    this.setupKeyboardHandlers();
  }

  public static getInstance(): TransformManager {
    if (!TransformManager.instance) {
      TransformManager.instance = new TransformManager();
    }
    return TransformManager.instance;
  }

  /**
   * Set the active transform mode
   */
  public setTransformMode(mode: TransformMode): void {
    if (this.state.mode === mode) return;

    this.state.mode = mode;
    console.log(`[TRANSFORM] Mode changed to: ${mode}`);

    this.updateGizmoDisplay();
    this.notifyStateChange();
  }

  /**
   * Set the transform space
   */
  public setTransformSpace(space: TransformSpace): void {
    if (this.state.space === space) return;

    this.state.space = space;
    console.log(`[TRANSFORM] Space changed to: ${space}`);

    this.updateGizmoDisplay();
    this.notifyStateChange();
  }

  /**
   * Update selected entities
   */
  public setSelectedEntities(entityIds: string[]): void {
    this.state.selectedEntities = [...entityIds];

    if (entityIds.length > 0) {
      this.calculatePivotPoint();
      this.updateGizmoDisplay();
    }

    console.log(`[TRANSFORM] Selected entities: ${entityIds.length}`);
    this.notifyStateChange();
  }

  /**
   * Start transform operation
   */
  public startTransform(): void {
    if (this.state.isTransforming || this.state.selectedEntities.length === 0) {
      return;
    }

    this.state.isTransforming = true;
    this.transformStart.clear();

    // Store initial transforms
    for (const entityId of this.state.selectedEntities) {
      const transform = this.getEntityTransform(entityId);
      if (transform) {
        this.transformStart.set(entityId, transform);
      }
    }

    console.log(`[TRANSFORM] Started transform for ${this.state.selectedEntities.length} entities`);
    this.notifyStateChange();
  }

  /**
   * Update transform during manipulation
   */
  public updateTransform(
    delta: Partial<TransformData>,
    applySnapping = true
  ): void {
    if (!this.state.isTransforming || this.state.selectedEntities.length === 0) {
      return;
    }

    for (const entityId of this.state.selectedEntities) {
      const currentTransform = this.getEntityTransform(entityId);
      if (!currentTransform) continue;

      const newTransform = this.calculateNewTransform(
        currentTransform,
        delta,
        applySnapping
      );

      const scene = this.sceneManager.currentScene;
      if (scene) {
        const node = scene.getNode(entityId);
        if (node) {
          node.setTransform({
            position: {
              x: newTransform.position.x,
              y: newTransform.position.y,
              z: newTransform.position.z
            },
            rotation: {
              x: newTransform.rotation.x * 180 / Math.PI,
              y: newTransform.rotation.y * 180 / Math.PI,
              z: newTransform.rotation.z * 180 / Math.PI
            },
            scale: {
              x: newTransform.scale.x,
              y: newTransform.scale.y,
              z: newTransform.scale.z
            }
          });
        }
      }
    }

    this.calculatePivotPoint();
    this.updateGizmoDisplay();
  }

  /**
   * Complete transform operation
   */
  public endTransform(): void {
    if (!this.state.isTransforming) {
      return;
    }

    const entityTransforms = new Map<string, {
      original: TransformData;
      modified: TransformData;
    }>();

    let hasChanges = false;

    for (const entityId of this.state.selectedEntities) {
      const original = this.transformStart.get(entityId);
      const modified = this.getEntityTransform(entityId);

      if (original && modified) {
        if (!this.transformsEqual(original, modified)) {
          entityTransforms.set(entityId, { original, modified });
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      const command = new TransformEntitiesCommand(entityTransforms);
      this.undoRedoManager.executeCommand(command);
      console.log(`[TRANSFORM] Applied transforms to ${entityTransforms.size} entities`);
    }

    this.state.isTransforming = false;
    this.transformStart.clear();
    this.notifyStateChange();
  }

  /**
   * Cancel ongoing transform
   */
  public cancelTransform(): void {
    if (!this.state.isTransforming) {
      return;
    }

    // Restore original transforms
    const scene = this.sceneManager.currentScene;
    if (scene) {
      for (const [entityId, originalTransform] of this.transformStart) {
        const node = scene.getNode(entityId);
        if (node) {
          node.setTransform({
            position: {
              x: originalTransform.position.x,
              y: originalTransform.position.y,
              z: originalTransform.position.z
            },
            rotation: {
              x: originalTransform.rotation.x * 180 / Math.PI,
              y: originalTransform.rotation.y * 180 / Math.PI,
              z: originalTransform.rotation.z * 180 / Math.PI
            },
            scale: {
              x: originalTransform.scale.x,
              y: originalTransform.scale.y,
              z: originalTransform.scale.z
            }
          });
        }
      }
    }

    this.state.isTransforming = false;
    this.transformStart.clear();

    console.log('[TRANSFORM] Transform cancelled');
    this.updateGizmoDisplay();
    this.notifyStateChange();
  }

  /**
   * Duplicate selected entities
   */
  public duplicateEntities(offset?: Vector3): string[] {
    if (this.state.selectedEntities.length === 0) {
      return [];
    }

    const duplicatedIds: string[] = [];
    const defaultOffset = offset || new Vector3(1, 0, 0);

    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return [];

      for (const entityId of this.state.selectedEntities) {
        const originalNode = scene.getNode(entityId);
        if (originalNode) {
          // Create duplicate
          const duplicateNode = scene.createNode(
            `${originalNode.name} Copy`,
            originalNode.type,
            originalNode.parent
          );

          // Copy transform with offset
          const originalTransform = originalNode.transform;
          if (originalTransform) {
            const newTransform = {
              position: {
                x: (originalTransform.position?.x || 0) + defaultOffset.x,
                y: (originalTransform.position?.y || 0) + defaultOffset.y,
                z: (originalTransform.position?.z || 0) + defaultOffset.z
              },
              rotation: { ...originalTransform.rotation },
              scale: { ...originalTransform.scale }
            };
            duplicateNode.setTransform(newTransform);
          }

          duplicatedIds.push(duplicateNode.id);
        }
      }

      console.log(`[TRANSFORM] Duplicated ${duplicatedIds.length} entities`);
      return duplicatedIds;

    } catch (error) {
      console.error('[TRANSFORM] Failed to duplicate entities:', error);
      return [];
    }
  }

  /**
   * Update snap settings
   */
  public setSnapSettings(settings: Partial<SnapSettings>): void {
    this.state.snapSettings = {
      ...this.state.snapSettings,
      ...settings
    };

    console.log('[TRANSFORM] Snap settings updated:', this.state.snapSettings);
    this.notifyStateChange();
  }

  /**
   * Toggle gizmo visibility
   */
  public toggleGizmos(show: boolean): void {
    this.state.showGizmos = show;
    this.updateGizmoDisplay();
    this.notifyStateChange();
  }

  /**
   * Get current state
   */
  public getState(): TransformState {
    return { ...this.state };
  }

  /**
   * Check if currently transforming
   */
  public isTransforming(): boolean {
    return this.state.isTransforming;
  }

  private getEntityTransform(entityId: string): TransformData | null {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return null;

      const node = scene.getNode(entityId);
      if (!node) return null;

      const transform = node.transform;
      if (!transform) return null;

      return {
        position: new Vector3(
          transform.position?.x || 0,
          transform.position?.y || 0,
          transform.position?.z || 0
        ),
        rotation: new Quaternion().setFromEuler(new Euler(
          (transform.rotation?.x || 0) * Math.PI / 180,
          (transform.rotation?.y || 0) * Math.PI / 180,
          (transform.rotation?.z || 0) * Math.PI / 180
        )),
        scale: new Vector3(
          transform.scale?.x || 1,
          transform.scale?.y || 1,
          transform.scale?.z || 1
        )
      };
    } catch (error) {
      console.error('[TRANSFORM] Failed to get entity transform:', error);
      return null;
    }
  }

  private calculatePivotPoint(): void {
    if (this.state.selectedEntities.length === 0) {
      this.state.pivotPoint.set(0, 0, 0);
      return;
    }

    const center = new Vector3();
    let count = 0;

    for (const entityId of this.state.selectedEntities) {
      const transform = this.getEntityTransform(entityId);
      if (transform) {
        center.add(transform.position);
        count++;
      }
    }

    if (count > 0) {
      center.divideScalar(count);
      this.state.pivotPoint.copy(center);
    }
  }

  private calculateNewTransform(
    current: TransformData,
    delta: Partial<TransformData>,
    applySnapping: boolean
  ): TransformData {
    const newTransform: TransformData = {
      position: current.position.clone(),
      rotation: current.rotation.clone(),
      scale: current.scale.clone()
    };

    // Apply position delta
    if (delta.position) {
      newTransform.position.add(delta.position);

      if (applySnapping && this.state.snapSettings.enabled) {
        newTransform.position = this.snapPosition(newTransform.position);
      }
    }

    // Apply rotation delta
    if (delta.rotation) {
      newTransform.rotation.multiplyQuaternions(delta.rotation, current.rotation);

      if (applySnapping && this.state.snapSettings.enabled) {
        newTransform.rotation = this.snapRotation(newTransform.rotation);
      }
    }

    // Apply scale delta
    if (delta.scale) {
      newTransform.scale.multiply(delta.scale);

      if (applySnapping && this.state.snapSettings.enabled) {
        newTransform.scale = this.snapScale(newTransform.scale);
      }
    }

    return newTransform;
  }

  private snapPosition(position: Vector3): Vector3 {
    const step = this.state.snapSettings.translationStep;

    return new Vector3(
      Math.round(position.x / step) * step,
      Math.round(position.y / step) * step,
      Math.round(position.z / step) * step
    );
  }

  private snapRotation(rotation: Quaternion): Quaternion {
    const step = this.state.snapSettings.rotationStep * (Math.PI / 180);
    const euler = new Euler().setFromQuaternion(rotation);

    euler.x = Math.round(euler.x / step) * step;
    euler.y = Math.round(euler.y / step) * step;
    euler.z = Math.round(euler.z / step) * step;

    return new Quaternion().setFromEuler(euler);
  }

  private snapScale(scale: Vector3): Vector3 {
    const step = this.state.snapSettings.scaleStep;

    return new Vector3(
      Math.round(scale.x / step) * step,
      Math.round(scale.y / step) * step,
      Math.round(scale.z / step) * step
    );
  }

  private transformsEqual(a: TransformData, b: TransformData): boolean {
    const posEqual = a.position.distanceTo(b.position) < 0.001;
    const rotEqual = a.rotation.angleTo(b.rotation) < 0.001;
    const scaleEqual = a.scale.distanceTo(b.scale) < 0.001;

    return posEqual && rotEqual && scaleEqual;
  }

  private updateGizmoDisplay(): void {
    // Send gizmo update to viewport
    try {
      window.dispatchEvent(new CustomEvent('transform-gizmo-update', {
        detail: {
          mode: this.state.mode,
          space: this.state.space,
          position: this.state.pivotPoint,
          visible: this.state.showGizmos && this.state.selectedEntities.length > 0
        }
      }));
    } catch (error) {
      console.warn('[TRANSFORM] Failed to update gizmo display:', error);
    }
  }

  private notifyStateChange(): void {
    // Notify components of state change
    window.dispatchEvent(new CustomEvent('transform-state-changed', {
      detail: this.getState()
    }));
  }

  private setupKeyboardHandlers(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return;

      switch (event.key.toLowerCase()) {
        case 'q':
          event.preventDefault();
          this.setTransformMode(TransformMode.SELECT);
          break;

        case 'w':
          event.preventDefault();
          this.setTransformMode(TransformMode.TRANSLATE);
          break;

        case 'e':
          event.preventDefault();
          this.setTransformMode(TransformMode.ROTATE);
          break;

        case 'r':
          event.preventDefault();
          this.setTransformMode(TransformMode.SCALE);
          break;

        case 'g':
          if (event.ctrlKey) {
            event.preventDefault();
            const newSettings = {
              snapToGrid: !this.state.snapSettings.snapToGrid
            };
            this.setSnapSettings(newSettings);
          }
          break;

        case 'escape':
          if (this.state.isTransforming) {
            event.preventDefault();
            this.cancelTransform();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    this.isActive = true;
  }

  public destroy(): void {
    this.isActive = false;
    // Cleanup event listeners
  }
}
