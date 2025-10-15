/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Manipulator Manager
 *
 * Manages all transform manipulators and coordinates their interaction.
 * Provides unified interface for manipulator operations and mode switching.
 */

import * as THREE from 'three';
import {
  BaseManipulator,
  ManipulatorMode,
  TransformSpace,
  ManipulatorSettings
} from './BaseManipulator';
import { TranslateManipulator } from './TranslateManipulator';
import { RotateManipulator } from './RotateManipulator';
import { ScaleManipulator } from './ScaleManipulator';

/**
 * Manipulator change event
 */
export interface ManipulatorChangeEvent {
  mode: ManipulatorMode;
  targets: THREE.Object3D[];
  transformType: 'start' | 'update' | 'end';
  values?: {
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  };
}

/**
 * ManipulatorManager class
 *
 * Coordinates all manipulator instances and manages their lifecycle.
 * Handles mode switching, target selection, and transform events.
 */
export class ManipulatorManager extends THREE.Group {
  private manipulators: Map<ManipulatorMode, BaseManipulator>;
  private currentMode: ManipulatorMode;
  private currentSpace: TransformSpace;
  private isEnabled: boolean;
  private targets: THREE.Object3D[];

  private camera: THREE.Camera | null;
  private domElement: HTMLElement | null;
  private settings: ManipulatorSettings;

  private eventListeners: Map<string, (event: ManipulatorChangeEvent) => void>;

  constructor() {
    super();

    this.manipulators = new Map();
    this.currentMode = ManipulatorMode.Translate;
    this.currentSpace = TransformSpace.World;
    this.isEnabled = true;
    this.targets = [];

    this.camera = null;
    this.domElement = null;
    this.settings = {
      size: 1.0,
      opacity: 0.8,
      visible: true,
      snapEnabled: false,
      snapValue: 1.0,
      space: TransformSpace.World
    };

    this.eventListeners = new Map();

    this.initializeManipulators();
  }

  /**
   * initialize()
   *
   * Initializes manipulator manager with camera and DOM element.
   */
  public initialize(camera: THREE.Camera, domElement: HTMLElement): void {
    this.camera = camera;
    this.domElement = domElement;

    // Configure all manipulators
    this.manipulators.forEach((manipulator) => {
      manipulator.setCamera(camera);
      manipulator.setDomElement(domElement);
      manipulator.setSettings(this.settings);
    });

    this.updateCurrentManipulator();
  }

  /**
   * setMode()
   *
   * Sets current manipulator mode.
   */
  public setMode(mode: ManipulatorMode): void {
    if (this.currentMode === mode) {
      return;
    }

    this.currentMode = mode;
    this.updateCurrentManipulator();

    this.dispatchChangeEvent({
      mode,
      targets: this.targets,
      transformType: 'start'
    });
  }

  /**
   * getMode()
   *
   * Returns current manipulator mode.
   */
  public getMode(): ManipulatorMode {
    return this.currentMode;
  }

  /**
   * setSpace()
   *
   * Sets transform space (world or local).
   */
  public setSpace(space: TransformSpace): void {
    this.currentSpace = space;
    this.settings.space = space;

    this.manipulators.forEach((manipulator) => {
      if ('setSpace' in manipulator) {
        (manipulator as any).setSpace(space);
      }
    });
  }

  /**
   * getSpace()
   *
   * Returns current transform space.
   */
  public getSpace(): TransformSpace {
    return this.currentSpace;
  }

  /**
   * setTargets()
   *
   * Sets target objects for manipulation.
   */
  public setTargets(objects: THREE.Object3D[]): void {
    this.targets = [...objects];

    this.manipulators.forEach((manipulator) => {
      manipulator.setTargets(objects);
    });

    this.updateVisibility();
  }

  /**
   * getTargets()
   *
   * Returns current target objects.
   */
  public getTargets(): THREE.Object3D[] {
    return [...this.targets];
  }

  /**
   * addTarget()
   *
   * Adds target to selection.
   */
  public addTarget(object: THREE.Object3D): void {
    if (!this.targets.includes(object)) {
      this.targets.push(object);
      this.setTargets(this.targets);
    }
  }

  /**
   * removeTarget()
   *
   * Removes target from selection.
   */
  public removeTarget(object: THREE.Object3D): void {
    const index = this.targets.indexOf(object);

    if (index >= 0) {
      this.targets.splice(index, 1);
      this.setTargets(this.targets);
    }
  }

  /**
   * clearTargets()
   *
   * Clears all targets.
   */
  public clearTargets(): void {
    this.setTargets([]);
  }

  /**
   * setEnabled()
   *
   * Enables or disables manipulators.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.updateVisibility();
  }

  /**
   * isManipulatorEnabled()
   *
   * Returns true if manipulators are enabled.
   */
  public isManipulatorEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * setSettings()
   *
   * Updates manipulator settings.
   */
  public setSettings(settings: Partial<ManipulatorSettings>): void {
    Object.assign(this.settings, settings);

    this.manipulators.forEach((manipulator) => {
      manipulator.setSettings(this.settings);
    });
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
   * setSize()
   *
   * Sets manipulator size.
   */
  public setSize(size: number): void {
    this.settings.size = size;
    this.setSettings({ size });
  }

  /**
   * setOpacity()
   *
   * Sets manipulator opacity.
   */
  public setOpacity(opacity: number): void {
    this.settings.opacity = opacity;
    this.setSettings({ opacity });
  }

  /**
   * setSnapEnabled()
   *
   * Enables or disables snapping.
   */
  public setSnapEnabled(enabled: boolean): void {
    this.settings.snapEnabled = enabled;
    this.setSettings({ snapEnabled: enabled });
  }

  /**
   * setSnapValue()
   *
   * Sets snap increment value.
   */
  public setSnapValue(value: number): void {
    this.settings.snapValue = value;
    this.setSettings({ snapValue: value });
  }

  /**
   * isActive()
   *
   * Returns true if any manipulator is currently active.
   */
  public isActive(): boolean {
    const currentManipulator = this.manipulators.get(this.currentMode);
    return currentManipulator?.isActive() || false;
  }

  /**
   * isDragging()
   *
   * Returns true if currently dragging.
   */
  public isDragging(): boolean {
    const currentManipulator = this.manipulators.get(this.currentMode);
    return currentManipulator?.isDragging() || false;
  }

  /**
   * update()
   *
   * Updates manipulator system.
   */
  public update(): void {
    if (!this.camera) {
      return;
    }

    // Update current manipulator
    const currentManipulator = this.manipulators.get(this.currentMode);

    if (currentManipulator && currentManipulator.visible) {
      // Update scale based on camera distance
      const distance = this.camera.position.distanceTo(currentManipulator.position);
      const scale = distance * this.settings.size * 0.1;
      currentManipulator.scale.setScalar(scale);
    }
  }

  /**
   * addChangeListener()
   *
   * Adds manipulator change event listener.
   */
  public addChangeListener(listener: (event: ManipulatorChangeEvent) => void): void {
    this.eventListeners.set('change', listener);
  }

  /**
   * removeChangeListener()
   *
   * Removes change event listener.
   */
  public removeChangeListener(): void {
    this.eventListeners.delete('change');
  }

  /**
   * dispose()
   *
   * Cleanup manipulator resources.
   */
  public dispose(): void {
    this.manipulators.forEach((manipulator) => {
      manipulator.dispose();
      this.remove(manipulator);
    });

    this.manipulators.clear();
    this.eventListeners.clear();
    this.targets = [];
  }

  /**
   * initializeManipulators()
   *
   * Creates all manipulator instances.
   */
  private initializeManipulators(): void {
    // Create manipulator instances
    const translateManipulator = new TranslateManipulator();
    const rotateManipulator = new RotateManipulator();
    const scaleManipulator = new ScaleManipulator();

    // Store in map
    this.manipulators.set(ManipulatorMode.Translate, translateManipulator);
    this.manipulators.set(ManipulatorMode.Rotate, rotateManipulator);
    this.manipulators.set(ManipulatorMode.Scale, scaleManipulator);

    // Add to scene graph (initially hidden)
    this.manipulators.forEach((manipulator) => {
      manipulator.visible = false;
      this.add(manipulator);
    });
  }

  /**
   * updateCurrentManipulator()
   *
   * Updates visibility of current manipulator.
   */
  private updateCurrentManipulator(): void {
    // Hide all manipulators
    this.manipulators.forEach((manipulator) => {
      manipulator.visible = false;
    });

    // Show current manipulator
    const currentManipulator = this.manipulators.get(this.currentMode);

    if (currentManipulator && this.isEnabled && this.targets.length > 0) {
      currentManipulator.visible = true;
    }
  }

  /**
   * updateVisibility()
   *
   * Updates manipulator visibility based on state.
   */
  private updateVisibility(): void {
    const shouldShow = this.isEnabled && this.targets.length > 0 && this.settings.visible;

    const currentManipulator = this.manipulators.get(this.currentMode);

    if (currentManipulator) {
      currentManipulator.visible = shouldShow;
    }
  }

  /**
   * dispatchChangeEvent()
   *
   * Dispatches manipulator change event.
   */
  private dispatchChangeEvent(event: ManipulatorChangeEvent): void {
    const listener = this.eventListeners.get('change');

    if (listener) {
      listener(event);
    }
  }

  /**
   * Keyboard shortcut handling
   */

  /**
   * handleKeyDown()
   *
   * Handles keyboard shortcuts for mode switching and manipulation controls.
   */
  public handleKeyDown(event: KeyboardEvent): boolean {
    // Forward escape key to current manipulator for cancellation
    if (event.key === 'Escape') {
      const currentManipulator = this.manipulators.get(this.currentMode);
      if (currentManipulator && currentManipulator.handleKeyDown) {
        return currentManipulator.handleKeyDown(event);
      }
    }

    // Skip mode switching if modifiers are pressed (for undo/redo)
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }

    switch (event.code) {
      case 'KeyW':
        this.setMode(ManipulatorMode.Translate);
        return true;

      case 'KeyE':
        this.setMode(ManipulatorMode.Rotate);
        return true;

      case 'KeyR':
        this.setMode(ManipulatorMode.Scale);
        return true;

      case 'Tab':
        this.toggleSpace();
        event.preventDefault();
        return true;

      case 'KeyG':
        this.setSnapEnabled(!this.settings.snapEnabled);
        return true;
    }

    return false;
  }

  /**
   * toggleSpace()
   *
   * Toggles between world and local transform space.
   */
  public toggleSpace(): void {
    const newSpace =
      this.currentSpace === TransformSpace.World ? TransformSpace.Local : TransformSpace.World;

    this.setSpace(newSpace);
  }

  /**
   * getCurrentManipulator()
   *
   * Returns current active manipulator.
   */
  public getCurrentManipulator(): BaseManipulator | null {
    return this.manipulators.get(this.currentMode) || null;
  }

  /**
   * getManipulator()
   *
   * Returns manipulator for specific mode.
   */
  public getManipulator(mode: ManipulatorMode): BaseManipulator | null {
    return this.manipulators.get(mode) || null;
  }
}
