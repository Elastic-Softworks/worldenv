/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Base Manipulator
 *
 * Abstract base class for all transform manipulators.
 * Provides common functionality for translate, rotate, and scale tools.
 */

import * as THREE from 'three';
import { TransformUtils, TransformType } from '../../utils/TransformUtils';

/**
 * Manipulator modes
 */
export enum ManipulatorMode {
  Translate = 'translate',
  Rotate = 'rotate',
  Scale = 'scale'
}

/**
 * Transform space
 */
export enum TransformSpace {
  Local = 'local',
  World = 'world'
}

/**
 * Manipulator axis
 */
export enum ManipulatorAxis {
  X = 'x',
  Y = 'y',
  Z = 'z',
  XY = 'xy',
  XZ = 'xz',
  YZ = 'yz',
  XYZ = 'xyz'
}

/**
 * Interaction state
 */
export interface InteractionState {
  isActive: boolean;
  isDragging: boolean;
  activeAxis: ManipulatorAxis | null;
  startValue: THREE.Vector3;
  currentValue: THREE.Vector3;
  deltaValue: THREE.Vector3;
}

/**
 * Manipulator settings
 */
export interface ManipulatorSettings {
  size: number;
  opacity: number;
  visible: boolean;
  snapEnabled: boolean;
  snapValue: number;
  space: TransformSpace;
}

/**
 * Transform target
 */
export interface TransformTarget {
  object: THREE.Object3D;
  initialTransform: {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  };
}

/**
 * BaseManipulator class
 *
 * Abstract base for all manipulator implementations.
 * Handles common functionality like selection, rendering, and interaction.
 */
export abstract class BaseManipulator extends THREE.Group {
  protected mode: ManipulatorMode;
  protected settings: ManipulatorSettings;
  protected targets: TransformTarget[];
  protected interaction: InteractionState;

  protected camera: THREE.Camera | null;
  protected domElement: HTMLElement | null;
  protected raycaster: THREE.Raycaster;
  protected mouse: THREE.Vector2;

  protected handles: Map<ManipulatorAxis, THREE.Object3D>;
  protected materials: Map<string, THREE.Material>;

  private eventListeners: Map<string, (event: Event) => void>;

  constructor(mode: ManipulatorMode) {
    super();

    this.mode = mode;
    this.settings = {
      size: 1.0,
      opacity: 0.8,
      visible: true,
      snapEnabled: false,
      snapValue: 1.0,
      space: TransformSpace.World
    };

    this.targets = [];
    this.interaction = {
      isActive: false,
      isDragging: false,
      activeAxis: null,
      startValue: new THREE.Vector3(),
      currentValue: new THREE.Vector3(),
      deltaValue: new THREE.Vector3()
    };

    this.camera = null;
    this.domElement = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.handles = new Map();
    this.materials = new Map();
    this.eventListeners = new Map();

    this.initializeMaterials();
    this.createHandles();
  }

  /**
   * setCamera()
   *
   * Sets camera for manipulator calculations.
   */
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * setDomElement()
   *
   * Sets DOM element for mouse events.
   */
  public setDomElement(element: HTMLElement): void {
    if (this.domElement) {
      this.removeEventListeners();
    }

    this.domElement = element;
    this.addEventListeners();
  }

  /**
   * setTargets()
   *
   * Sets transform targets for manipulation.
   */
  public setTargets(objects: THREE.Object3D[]): void {
    this.targets = objects.map((object) => ({
      object,
      initialTransform: {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone()
      }
    }));

    this.updatePosition();
  }

  /**
   * getMode()
   *
   * Returns current manipulator mode.
   */
  public getMode(): ManipulatorMode {
    return this.mode;
  }

  /**
   * setSettings()
   *
   * Updates manipulator settings.
   */
  public setSettings(settings: Partial<ManipulatorSettings>): void {
    Object.assign(this.settings, settings);
    this.updateAppearance();
  }

  /**
   * getSettings()
   *
   * Returns current settings.
   */
  public getSettings(): ManipulatorSettings {
    return { ...this.settings };
  }

  /**
   * isActive()
   *
   * Returns true if manipulator is currently active.
   */
  public isActive(): boolean {
    return this.interaction.isActive;
  }

  /**
   * isDragging()
   *
   * Returns true if currently dragging.
   */
  public isDragging(): boolean {
    return this.interaction.isDragging;
  }

  /**
   * dispose()
   *
   * Cleanup manipulator resources.
   */
  public dispose(): void {
    this.removeEventListeners();

    this.handles.forEach((handle) => {
      this.remove(handle);
    });

    this.materials.forEach((material) => {
      material.dispose();
    });

    this.handles.clear();
    this.materials.clear();
    this.targets = [];
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract createHandles(): void;
  protected abstract updateTransform(axis: ManipulatorAxis, delta: THREE.Vector3): void;

  /**
   * initializeMaterials()
   *
   * Creates common materials for manipulator handles.
   */
  protected initializeMaterials(): void {
    const materials = {
      x: new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: this.settings.opacity
      }),
      y: new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: this.settings.opacity
      }),
      z: new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: this.settings.opacity
      }),
      xy: new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: this.settings.opacity * 0.5
      }),
      xz: new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: this.settings.opacity * 0.5
      }),
      yz: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: this.settings.opacity * 0.5
      }),
      highlight: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
      })
    };

    Object.entries(materials).forEach(([name, material]) => {
      this.materials.set(name, material);
    });
  }

  /**
   * updatePosition()
   *
   * Updates manipulator position based on targets.
   */
  protected updatePosition(): void {
    if (this.targets.length === 0) {
      this.visible = false;
      return;
    }

    this.visible = this.settings.visible;

    if (this.targets.length === 1) {
      this.position.copy(this.targets[0].object.position);
    } else {
      const center = new THREE.Vector3();

      this.targets.forEach((target) => {
        center.add(target.object.position);
      });

      center.divideScalar(this.targets.length);
      this.position.copy(center);
    }

    this.updateScale();
  }

  /**
   * updateScale()
   *
   * Updates manipulator scale based on camera distance.
   */
  protected updateScale(): void {
    if (!this.camera) {
      return;
    }

    const distance = this.camera.position.distanceTo(this.position);
    const scale = distance * this.settings.size * 0.1;

    this.scale.setScalar(scale);
  }

  /**
   * updateAppearance()
   *
   * Updates manipulator visual appearance.
   */
  protected updateAppearance(): void {
    this.visible = this.settings.visible;

    this.materials.forEach((material, name) => {
      if (material instanceof THREE.MeshBasicMaterial) {
        if (name.includes('highlight')) {
          return;
        }

        material.opacity = name.length > 1 ? this.settings.opacity * 0.5 : this.settings.opacity;
      }
    });

    this.updateScale();
  }

  /**
   * addEventListeners()
   *
   * Adds mouse event listeners.
   */
  protected addEventListeners(): void {
    if (!this.domElement) {
      return;
    }

    const mouseDown = this.onMouseDown.bind(this) as (event: Event) => void;
    const mouseMove = this.onMouseMove.bind(this) as (event: Event) => void;
    const mouseUp = this.onMouseUp.bind(this) as (event: Event) => void;

    this.domElement.addEventListener('mousedown', mouseDown);
    this.domElement.addEventListener('mousemove', mouseMove);
    this.domElement.addEventListener('mouseup', mouseUp);

    this.eventListeners.set('mousedown', mouseDown);
    this.eventListeners.set('mousemove', mouseMove);
    this.eventListeners.set('mouseup', mouseUp);
  }

  /**
   * removeEventListeners()
   *
   * Removes mouse event listeners.
   */
  protected removeEventListeners(): void {
    if (!this.domElement) {
      return;
    }

    this.eventListeners.forEach((listener, event) => {
      this.domElement!.removeEventListener(event, listener);
    });

    this.eventListeners.clear();
  }

  /**
   * onMouseDown()
   *
   * Handles mouse down events.
   */
  protected onMouseDown(event: MouseEvent): void {
    if (!this.camera || !this.domElement) {
      return;
    }

    this.updateMouseCoordinates(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.children, true);

    if (intersects.length > 0) {
      const handle = intersects[0].object;
      const axis = this.getAxisFromHandle(handle);

      if (axis) {
        this.startInteraction(axis);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  /**
   * onMouseMove()
   *
   * Handles mouse move events.
   */
  protected onMouseMove(event: MouseEvent): void {
    if (!this.camera || !this.domElement) {
      return;
    }

    this.updateMouseCoordinates(event);

    if (this.interaction.isDragging && this.interaction.activeAxis) {
      this.updateInteraction();
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.updateHover();
    }
  }

  /**
   * onMouseUp()
   *
   * Handles mouse up events.
   */
  protected onMouseUp(event: MouseEvent): void {
    if (this.interaction.isDragging) {
      this.endInteraction();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * updateMouseCoordinates()
   *
   * Updates mouse coordinates from event.
   */
  protected updateMouseCoordinates(event: MouseEvent): void {
    if (!this.domElement) {
      return;
    }

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * cancelInteraction()
   *
   * Cancels current interaction and restores initial state.
   */
  protected cancelInteraction(): void {
    if (!this.interaction.isDragging) {
      return;
    }

    // Cancel undo/redo operation and restore initial state
    TransformUtils.cancelTransformOperation();

    this.interaction.isActive = false;
    this.interaction.isDragging = false;
    this.interaction.activeAxis = null;

    this.clearHighlight();
  }

  /**
   * handleKeyDown()
   *
   * Handles keyboard events during manipulation.
   */
  public handleKeyDown(event: KeyboardEvent): boolean {
    if (this.interaction.isDragging) {
      if (event.key === 'Escape') {
        this.cancelInteraction();
        event.preventDefault();
        return true;
      }
    }

    return false;
  }

  /**
   * getAxisFromHandle()
   *
   * Returns axis from handle object.
   */
  protected getAxisFromHandle(handle: THREE.Object3D): ManipulatorAxis | null {
    for (const [axis, handleObj] of this.handles) {
      if (handle === handleObj || handle.parent === handleObj) {
        return axis;
      }
    }

    return null;
  }

  /**
   * startInteraction()
   *
   * Begins manipulator interaction.
   */
  protected startInteraction(axis: ManipulatorAxis): void {
    this.interaction.isActive = true;
    this.interaction.isDragging = true;
    this.interaction.activeAxis = axis;

    this.storeInitialTransforms();
    this.highlightAxis(axis);

    // Begin undo/redo operation
    const transformType = this.getTransformType();
    const objects = this.targets.map((target) => target.object);
    TransformUtils.beginTransformOperation(objects, transformType);
  }

  /**
   * updateInteraction()
   *
   * Updates ongoing interaction.
   */
  protected updateInteraction(): void {
    if (!this.interaction.activeAxis) {
      return;
    }

    const delta = this.calculateDelta();

    if (this.settings.snapEnabled) {
      this.applySnap(delta);
    }

    this.updateTransform(this.interaction.activeAxis, delta);
  }

  /**
   * endInteraction()
   *
   * Ends manipulator interaction.
   */
  protected endInteraction(): void {
    // End undo/redo operation before clearing state
    TransformUtils.endTransformOperation();

    this.interaction.isActive = false;
    this.interaction.isDragging = false;
    this.interaction.activeAxis = null;

    this.clearHighlight();
  }

  /**
   * storeInitialTransforms()
   *
   * Stores initial transforms for undo/redo.
   */
  protected storeInitialTransforms(): void {
    this.targets.forEach((target) => {
      target.initialTransform.position.copy(target.object.position);
      target.initialTransform.rotation.copy(target.object.rotation);
      target.initialTransform.scale.copy(target.object.scale);
    });
  }

  /**
   * calculateDelta()
   *
   * Calculates transform delta from mouse movement.
   */
  protected abstract calculateDelta(): THREE.Vector3;

  /**
   * getTransformType()
   *
   * Returns the transform type for this manipulator.
   */
  protected abstract getTransformType(): TransformType;

  /**
   * applySnap()
   *
   * Applies snapping to delta value.
   */
  protected applySnap(delta: THREE.Vector3): void {
    const snapValue = this.settings.snapValue;

    delta.x = Math.round(delta.x / snapValue) * snapValue;
    delta.y = Math.round(delta.y / snapValue) * snapValue;
    delta.z = Math.round(delta.z / snapValue) * snapValue;
  }

  /**
   * highlightAxis()
   *
   * Highlights active axis.
   */
  protected highlightAxis(axis: ManipulatorAxis): void {
    const handle = this.handles.get(axis);

    if (handle && handle instanceof THREE.Mesh) {
      handle.material = this.materials.get('highlight')!;
    }
  }

  /**
   * clearHighlight()
   *
   * Clears axis highlighting.
   */
  protected clearHighlight(): void {
    this.handles.forEach((handle, axis) => {
      if (handle instanceof THREE.Mesh) {
        const materialName = axis.toString();
        handle.material = this.materials.get(materialName)!;
      }
    });
  }

  /**
   * updateHover()
   *
   * Updates hover highlighting.
   */
  protected updateHover(): void {
    if (!this.camera) {
      return;
    }

    this.clearHighlight();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.children, true);

    if (intersects.length > 0) {
      const handle = intersects[0].object;
      const axis = this.getAxisFromHandle(handle);

      if (axis) {
        this.highlightAxis(axis);
      }
    }
  }
}
