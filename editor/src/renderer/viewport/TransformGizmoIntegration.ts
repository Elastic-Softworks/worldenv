/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Transform Gizmo Integration
 *
 * Integrates Transform component changes with viewport gizmos.
 * Handles bidirectional synchronization between component properties
 * and interactive transform gizmos in both 2D and 3D viewports.
 */

import { ViewportManager } from './ViewportManager';
import { componentSystem } from '../core/components';
import { TransformComponent } from '../core/components/core/TransformComponent';
import { SceneManager } from '../core/hierarchy/SceneManager';
import type { Vector3 } from '../core/components/Component';
import * as THREE from 'three';
import * as PIXI from 'pixi.js';

export interface GizmoTransformData {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export interface TransformGizmoOptions {
  enablePosition: boolean;
  enableRotation: boolean;
  enableScale: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

/**
 * TransformGizmoIntegration
 *
 * Manages the connection between Transform components and viewport gizmos.
 * Ensures that gizmo manipulations update component properties and vice versa.
 */
export class TransformGizmoIntegration {
  private viewportManager: ViewportManager;
  private sceneManager: SceneManager;
  private selectedEntityId: string | null;
  private isUpdatingFromGizmo: boolean;
  private options: TransformGizmoOptions;

  /* GIZMO INTERACTION STATE */
  private isDragging: boolean;
  private dragStartTransform: GizmoTransformData | null;
  private transformBeforeEdit: GizmoTransformData | null;

  /* EVENT HANDLERS */
  private boundHandlers: Map<string, Function>;

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.sceneManager = SceneManager.getInstance();
    this.selectedEntityId = null;
    this.isUpdatingFromGizmo = false;
    this.isDragging = false;
    this.dragStartTransform = null;
    this.transformBeforeEdit = null;
    this.boundHandlers = new Map();

    this.options = {
      enablePosition: true,
      enableRotation: true,
      enableScale: true,
      snapToGrid: false,
      gridSize: 1.0
    };

    this.initializeEventHandlers();
  }

  /**
   * initializeEventHandlers()
   *
   * Set up event listeners for component changes and gizmo interactions.
   */
  private initializeEventHandlers(): void {
    // Event system not implemented yet - using polling approach
    console.log('[TRANSFORM_GIZMO] Using polling approach for updates');
  }

  /**
   * setSelectedEntity()
   *
   * Update the currently selected entity for gizmo integration.
   */
  setSelectedEntity(entityId: string | null): void {
    if (this.selectedEntityId === entityId) {
      return;
    }

    // Clear previous selection
    if (this.selectedEntityId) {
      this.clearGizmoForEntity(this.selectedEntityId);
    }

    this.selectedEntityId = entityId;

    // Setup gizmo for new selection
    if (entityId) {
      this.setupGizmoForEntity(entityId);
    }
  }

  /**
   * setupGizmoForEntity()
   *
   * Initialize gizmo for the specified entity's Transform component.
   */
  private setupGizmoForEntity(entityId: string): void {
    const transform = componentSystem.getComponent(entityId, 'Transform') as TransformComponent;
    if (!transform) {
      console.warn('[TRANSFORM_GIZMO] Entity has no Transform component:', entityId);
      return;
    }

    // Get transform data
    const position = transform.getProperty('position') as Vector3;
    const rotation = transform.getProperty('rotation') as Vector3;
    const scale = transform.getProperty('scale') as Vector3;

    // Update gizmo position in viewport
    this.updateGizmoTransform({
      position,
      rotation,
      scale
    });

    // Enable gizmo interaction
    this.enableGizmoInteraction();
  }

  /**
   * clearGizmoForEntity()
   *
   * Clear gizmo for the specified entity.
   */
  private clearGizmoForEntity(entityId: string): void {
    this.disableGizmoInteraction();
    // Additional cleanup would go here
  }

  /**
   * handleComponentChange()
   *
   * Handle Transform component property changes.
   */
  private handleComponentChange(data: {
    entityId: string;
    componentType: string;
    propertyKey: string;
    newValue: any;
    oldValue: any;
  }): void {
    // Only handle Transform component changes for selected entity
    if (
      data.entityId !== this.selectedEntityId ||
      data.componentType !== 'Transform' ||
      this.isUpdatingFromGizmo
    ) {
      return;
    }

    // Update gizmo to reflect component changes
    const transform = componentSystem.getComponent(
      data.entityId,
      'Transform'
    ) as TransformComponent;
    if (transform) {
      const position = transform.getProperty('position') as Vector3;
      const rotation = transform.getProperty('rotation') as Vector3;
      const scale = transform.getProperty('scale') as Vector3;

      this.updateGizmoTransform({
        position,
        rotation,
        scale
      });
    }
  }

  /**
   * handleSelectionChange()
   *
   * Handle entity selection changes.
   */
  private handleSelectionChange(selectedEntities: string[]): void {
    const newSelection = selectedEntities.length === 1 ? selectedEntities[0] : null;
    this.setSelectedEntity(newSelection);
  }

  /**
   * update()
   *
   * Update gizmo state by polling for changes.
   * Should be called each frame.
   */
  update(): void {
    if (!this.selectedEntityId) {
      return;
    }

    // Check if transform has changed since last update
    const transform = componentSystem.getComponent(
      this.selectedEntityId,
      'Transform'
    ) as TransformComponent;
    if (transform) {
      const position = transform.getProperty('position') as Vector3;
      const rotation = transform.getProperty('rotation') as Vector3;
      const scale = transform.getProperty('scale') as Vector3;

      this.updateGizmoTransform({
        position,
        rotation,
        scale
      });
    }
  }

  /**
   * updateGizmoTransform()
   *
   * Update gizmo position/rotation/scale in viewport.
   */
  private updateGizmoTransform(transform: GizmoTransformData): void {
    const mode = this.viewportManager.getMode();

    if (mode === '3d') {
      this.updateGizmo3D(transform);
    } else {
      this.updateGizmo2D(transform);
    }
  }

  /**
   * updateGizmo3D()
   *
   * Update 3D viewport gizmo.
   */
  private updateGizmo3D(transform: GizmoTransformData): void {
    // Note: ViewportManager doesn't expose renderer3D directly
    // This would need to be implemented when ViewportManager API is extended
    console.log('[TRANSFORM_GIZMO] 3D gizmo update requested:', transform);
    return;

    // This would be implemented when ViewportManager API is extended
    // to provide access to the underlying 3D scene
    console.log('[TRANSFORM_GIZMO] 3D gizmo transform update:', transform);
  }

  /**
   * updateGizmo2D()
   *
   * Update 2D viewport gizmo.
   */
  private updateGizmo2D(transform: GizmoTransformData): void {
    // Note: ViewportManager doesn't expose renderer2D directly
    // This would need to be implemented when ViewportManager API is extended
    console.log('[TRANSFORM_GIZMO] 2D gizmo update requested:', transform);
    return;

    // This would be implemented when ViewportManager API is extended
    // to provide access to the underlying 2D scene
    console.log('[TRANSFORM_GIZMO] 2D gizmo transform update:', transform);
  }

  /**
   * createTransformGizmo3D()
   *
   * Create 3D transform gizmo with interactive handles.
   */
  private createTransformGizmo3D(): THREE.Group {
    const gizmo = new THREE.Group();

    // Position handles (arrows)
    if (this.options.enablePosition) {
      const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
      const arrowMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }), // X - Red
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Y - Green
        new THREE.MeshBasicMaterial({ color: 0x0000ff }) // Z - Blue
      ];

      for (let i = 0; i < 3; i++) {
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterials[i]);
        arrow.position.setComponent(i, 1);

        if (i === 0) arrow.rotation.z = -Math.PI / 2; // X arrow
        if (i === 2) arrow.rotation.x = Math.PI / 2; // Z arrow

        arrow.userData = { axis: i, type: 'position' };
        gizmo.add(arrow);
      }
    }

    // Scale handles (cubes)
    if (this.options.enableScale) {
      const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff8888 }), // X - Light Red
        new THREE.MeshBasicMaterial({ color: 0x88ff88 }), // Y - Light Green
        new THREE.MeshBasicMaterial({ color: 0x8888ff }) // Z - Light Blue
      ];

      for (let i = 0; i < 3; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterials[i]);
        cube.position.setComponent(i, 1.5);
        cube.userData = { axis: i, type: 'scale' };
        gizmo.add(cube);
      }
    }

    return gizmo;
  }

  /**
   * createTransformGizmo2D()
   *
   * Create 2D transform gizmo with interactive handles.
   */
  private createTransformGizmo2D(): PIXI.Container {
    const gizmo = new PIXI.Container();

    // Position handles (arrows)
    if (this.options.enablePosition) {
      const xArrow = new PIXI.Graphics();
      xArrow.beginFill(0xff0000);
      xArrow.drawPolygon([0, 0, 50, 0, 40, -10, 50, 0, 40, 10]);
      xArrow.endFill();
      xArrow.interactive = true;
      xArrow.cursor = 'pointer';
      gizmo.addChild(xArrow);

      const yArrow = new PIXI.Graphics();
      yArrow.beginFill(0x00ff00);
      yArrow.drawPolygon([0, 0, 0, -50, -10, -40, 0, -50, 10, -40]);
      yArrow.endFill();
      yArrow.interactive = true;
      yArrow.cursor = 'pointer';
      gizmo.addChild(yArrow);
    }

    // Scale handles
    if (this.options.enableScale) {
      const scaleHandle = new PIXI.Graphics();
      scaleHandle.beginFill(0xffff00);
      scaleHandle.drawRect(60, -60, 10, 10);
      scaleHandle.endFill();
      scaleHandle.interactive = true;
      scaleHandle.cursor = 'nw-resize';
      gizmo.addChild(scaleHandle);
    }

    return gizmo;
  }

  /**
   * enableGizmoInteraction()
   *
   * Enable gizmo interaction for transform manipulation.
   */
  private enableGizmoInteraction(): void {
    // This would set up mouse/touch event handlers for gizmo manipulation
    // Implementation depends on the specific viewport renderer APIs
    console.log('[TRANSFORM_GIZMO] Gizmo interaction enabled');
  }

  /**
   * disableGizmoInteraction()
   *
   * Disable gizmo interaction.
   */
  private disableGizmoInteraction(): void {
    console.log('[TRANSFORM_GIZMO] Gizmo interaction disabled');
  }

  /**
   * handleGizmoTransformStart()
   *
   * Handle start of gizmo transform operation.
   */
  handleGizmoTransformStart(): void {
    if (!this.selectedEntityId) {
      return;
    }

    this.isDragging = true;

    // Store transform state for undo/redo
    const transform = componentSystem.getComponent(
      this.selectedEntityId,
      'Transform'
    ) as TransformComponent;
    if (transform) {
      this.transformBeforeEdit = {
        position: { ...(transform.getProperty('position') as Vector3) },
        rotation: { ...(transform.getProperty('rotation') as Vector3) },
        scale: { ...(transform.getProperty('scale') as Vector3) }
      };
    }
  }

  /**
   * handleGizmoTransformChange()
   *
   * Handle gizmo transform changes during manipulation.
   */
  handleGizmoTransformChange(newTransform: Partial<GizmoTransformData>): void {
    if (!this.selectedEntityId || !this.isDragging) {
      return;
    }

    this.isUpdatingFromGizmo = true;

    const transform = componentSystem.getComponent(
      this.selectedEntityId,
      'Transform'
    ) as TransformComponent;
    if (transform) {
      // Apply snap to grid if enabled
      const processedTransform = this.applySnapping(newTransform);

      // Update component properties
      if (processedTransform.position) {
        transform.setProperty('position', processedTransform.position);
      }
      if (processedTransform.rotation) {
        transform.setProperty('rotation', processedTransform.rotation);
      }
      if (processedTransform.scale) {
        transform.setProperty('scale', processedTransform.scale);
      }
    }

    this.isUpdatingFromGizmo = false;
  }

  /**
   * handleGizmoTransformEnd()
   *
   * Handle end of gizmo transform operation.
   */
  handleGizmoTransformEnd(): void {
    if (!this.isDragging || !this.selectedEntityId) {
      return;
    }

    this.isDragging = false;

    // Create undo/redo command for the transform operation
    if (this.transformBeforeEdit) {
      const transform = componentSystem.getComponent(
        this.selectedEntityId,
        'Transform'
      ) as TransformComponent;
      if (transform) {
        const finalTransform = {
          position: transform.getProperty('position') as Vector3,
          rotation: transform.getProperty('rotation') as Vector3,
          scale: transform.getProperty('scale') as Vector3
        };

        // TODO: Add to undo/redo system
        console.log('[TRANSFORM_GIZMO] Transform operation completed', {
          before: this.transformBeforeEdit,
          after: finalTransform
        });
      }
    }

    this.transformBeforeEdit = null;
  }

  /**
   * applySnapping()
   *
   * Apply grid snapping to transform values if enabled.
   */
  private applySnapping(transform: Partial<GizmoTransformData>): Partial<GizmoTransformData> {
    if (!this.options.snapToGrid) {
      return transform;
    }

    const snapped: Partial<GizmoTransformData> = {};

    if (transform.position) {
      snapped.position = {
        x: Math.round(transform.position.x / this.options.gridSize) * this.options.gridSize,
        y: Math.round(transform.position.y / this.options.gridSize) * this.options.gridSize,
        z: Math.round(transform.position.z / this.options.gridSize) * this.options.gridSize
      };
    }

    if (transform.rotation) {
      snapped.rotation = transform.rotation; // Rotation typically doesn't snap to grid
    }

    if (transform.scale) {
      snapped.scale = transform.scale; // Scale typically doesn't snap to grid
    }

    return snapped;
  }

  /**
   * setOptions()
   *
   * Update gizmo options.
   */
  setOptions(options: Partial<TransformGizmoOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * getOptions()
   *
   * Get current gizmo options.
   */
  getOptions(): TransformGizmoOptions {
    return { ...this.options };
  }

  /**
   * destroy()
   *
   * Clean up event handlers and resources.
   */
  destroy(): void {
    // Clean up resources
    this.boundHandlers.clear();
    this.setSelectedEntity(null);
  }
}

/**
 * Global transform gizmo integration instance
 */
let transformGizmoIntegration: TransformGizmoIntegration | null = null;

/**
 * initializeTransformGizmoIntegration()
 *
 * Initialize the global transform gizmo integration.
 */
export function initializeTransformGizmoIntegration(
  viewportManager: ViewportManager
): TransformGizmoIntegration {
  if (transformGizmoIntegration) {
    transformGizmoIntegration.destroy();
  }

  transformGizmoIntegration = new TransformGizmoIntegration(viewportManager);
  return transformGizmoIntegration;
}

/**
 * getTransformGizmoIntegration()
 *
 * Get the global transform gizmo integration instance.
 */
export function getTransformGizmoIntegration(): TransformGizmoIntegration | null {
  return transformGizmoIntegration;
}
