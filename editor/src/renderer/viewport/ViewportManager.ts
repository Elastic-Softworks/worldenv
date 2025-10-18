/*
   ===============================================================
   WORLDEDIT VIEWPORT MANAGER
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

import { ViewportRenderer3D, RenderStats } from './ViewportRenderer3D'; /* 3D RENDERING */
import { ViewportRenderer2D, RenderStats2D } from './ViewportRenderer2D'; /* 2D RENDERING */
import { EditorCamera, CameraPreset } from './EditorCamera'; /* CAMERA CONTROLS */
import { ManipulatorManager } from './manipulators/ManipulatorManager'; /* TRANSFORM TOOLS */
import {
  ManipulatorMode,
  TransformSpace
} from './manipulators/BaseManipulator'; /* MANIPULATOR TYPES */
import { ObjectSelectionSystem } from './ObjectSelectionSystem'; /* SELECTION SYSTEM */
import { CameraControlsIntegration } from './CameraControlsIntegration'; /* CAMERA INTEGRATION */
import { EntityRenderingSystem } from './EntityRenderingSystem'; /* ENTITY RENDERING */
import { Entity } from '../core/scene/Entity'; /* ENTITY SYSTEM */
import * as THREE from 'three'; /* 3D LIBRARY */
import * as PIXI from 'pixi.js'; /* 2D LIBRARY */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

export type ViewportMode = '2d' | '3d';

export interface ViewportStats {
  mode: ViewportMode /* current rendering mode */;
  fps: number /* frames per second */;
  frameCount: number /* total frames rendered */;
  renderStats: RenderStats | RenderStats2D /* detailed render metrics */;
}

export interface ViewportSettings {
  showGrid: boolean /* display grid overlay */;
  showGizmos: boolean /* display transform gizmos */;
  showAxes: boolean /* display coordinate axes */;
  snapToGrid: boolean /* snap transforms to grid */;
  gridSize: number /* grid cell size in units */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         ViewportManager
	       ---
	       central coordinator for viewport rendering operations.
	       manages the complexity of switching between 2D and 3D
	       rendering modes while maintaining a unified interface
	       for editor interactions.

	       this class orchestrates multiple subsystems: the 3D
	       renderer (Three.js), 2D renderer (Pixi.js), camera
	       controls, object selection, transform manipulators,
	       and entity rendering. it provides a single point of
	       control for all viewport-related operations.

*/

export class ViewportManager {
  private canvas: HTMLCanvasElement;
  private renderer3D: ViewportRenderer3D | null;
  private renderer2D: ViewportRenderer2D | null;
  private currentMode: ViewportMode;
  private isInitialized: boolean;

  /* PERFORMANCE TRACKING */
  private fps: number;
  private frameCount: number;
  private lastFpsUpdate: number;
  private frameCounter: number;

  /* VIEWPORT SETTINGS */
  private settings: ViewportSettings;

  /* EVENT CALLBACKS */
  private onModeChangeCallback: ((mode: ViewportMode) => void) | null;
  private onSelectionChangeCallback:
    | ((objects: (THREE.Object3D | PIXI.DisplayObject)[]) => void)
    | null;

  /* CONFIGURATION */
  private static readonly DEFAULT_GRID_SIZE = 50;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer3D = null;
    this.renderer2D = null;
    this.currentMode = '3d';
    this.isInitialized = false;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.frameCounter = 0;
    this.onModeChangeCallback = null;
    this.onSelectionChangeCallback = null;

    /* INITIALIZE SETTINGS */
    this.settings = {
      showGrid: true,
      showGizmos: true,
      showAxes: true,
      snapToGrid: false,
      gridSize: ViewportManager.DEFAULT_GRID_SIZE
    };

    this.initialize();
  }

  /**
   * initialize()
   *
   * Set up viewport renderers and start rendering.
   */
  private initialize(): void {
    /* INITIALIZE 3D RENDERER */
    this.renderer3D = new ViewportRenderer3D(this.canvas);
    this.applySettingsTo3D();

    /* SET INITIAL MODE TO 3D */
    this.setMode('3d');

    this.isInitialized = true;
  }

  /**
   * applySettingsTo3D()
   *
   * Apply current settings to 3D renderer.
   */
  private applySettingsTo3D(): void {
    if (!this.renderer3D) {
      return;
    }

    this.renderer3D.setGridVisible(this.settings.showGrid);
    this.renderer3D.setAxesVisible(this.settings.showAxes);
    this.renderer3D.setGizmosVisible(this.settings.showGizmos);
  }

  /**
   * applySettingsTo2D()
   *
   * Apply current settings to 2D renderer.
   */
  private applySettingsTo2D(): void {
    if (!this.renderer2D) {
      return;
    }

    this.renderer2D.setGridVisible(this.settings.showGrid);
    this.renderer2D.setGizmosVisible(this.settings.showGizmos);
  }

  /**
   * setMode()
   *
   * Switch between 2D and 3D viewport modes.
   */
  setMode(mode: ViewportMode): void {
    if (this.currentMode === mode) {
      return;
    }

    /* STOP CURRENT RENDERER */
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.stopRenderLoop();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.stopRenderLoop();
    }

    this.currentMode = mode;

    if (mode === '3d') {
      /* ENSURE 3D RENDERER EXISTS */
      if (!this.renderer3D) {
        this.renderer3D = new ViewportRenderer3D(this.canvas);
        this.applySettingsTo3D();
      }

      /* DISPOSE 2D RENDERER TO FREE MEMORY */
      if (this.renderer2D) {
        this.renderer2D.dispose();
        this.renderer2D = null;
      }

      this.renderer3D.setCameraMode('3d');
      this.renderer3D.startRenderLoop();
    } else {
      /* ENSURE 2D RENDERER EXISTS */
      if (!this.renderer2D) {
        this.renderer2D = new ViewportRenderer2D(this.canvas);
        this.applySettingsTo2D();
      }

      /* DISPOSE 3D RENDERER TO FREE MEMORY */
      if (this.renderer3D) {
        this.renderer3D.dispose();
        this.renderer3D = null;
      }

      this.renderer2D.setCameraMode('2d');
      this.renderer2D.startRenderLoop();
    }

    /* NOTIFY MODE CHANGE */
    if (this.onModeChangeCallback) {
      this.onModeChangeCallback(mode);
    }
  }

  /**
   * getMode()
   *
   * Get current viewport mode.
   */
  getMode(): ViewportMode {
    return this.currentMode;
  }

  /**
   * toggleMode()
   *
   * Toggle between 2D and 3D modes.
   */
  toggleMode(): void {
    this.setMode(this.currentMode === '3d' ? '2d' : '3d');
  }

  /**
   * setCameraPreset()
   *
   * Set camera to predefined position (3D mode only).
   */
  setCameraPreset(preset: CameraPreset): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.setCameraPreset(preset);
    }
  }

  /**
   * resetCamera()
   *
   * Reset camera to default position.
   */
  resetCamera(): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.resetCamera();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.resetCamera();
    }
  }

  /**
   * getCamera()
   *
   * Get current camera instance.
   */
  getCamera(): EditorCamera | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getCamera();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.getCamera();
    }
    return null;
  }

  /**
   * getScene()
   *
   * Get current scene instance.
   */
  getScene(): THREE.Scene | PIXI.Container | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getScene();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.getScene();
    }
    return null;
  }

  /**
   * addObject()
   *
   * Add object to current scene.
   */
  addObject(object: THREE.Object3D | PIXI.DisplayObject): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.addObject(object as THREE.Object3D);
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.addObject(object as PIXI.DisplayObject);
    }
  }

  /**
   * removeObject()
   *
   * Remove object from current scene.
   */
  removeObject(object: THREE.Object3D | PIXI.DisplayObject): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.removeObject(object as THREE.Object3D);
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.removeObject(object as PIXI.DisplayObject);
    }
  }

  /**
   * selectObject()
   *
   * Select object for editing.
   */
  selectObject(object: THREE.Object3D | PIXI.DisplayObject): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.selectObject(object as THREE.Object3D);
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.selectObject(object as PIXI.DisplayObject);
    }

    /* NOTIFY SELECTION CHANGE */
    if (this.onSelectionChangeCallback) {
      this.onSelectionChangeCallback([object]);
    }
  }

  /**
   * clearSelection()
   *
   * Clear object selection.
   */
  clearSelection(): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.clearSelection();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.clearSelection();
    }

    /* NOTIFY SELECTION CHANGE */
    if (this.onSelectionChangeCallback) {
      this.onSelectionChangeCallback([]);
    }
  }

  /**
   * getSelectedObjects()
   *
   * Get currently selected objects.
   */
  getSelectedObjects(): (THREE.Object3D | PIXI.DisplayObject)[] {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getSelectedObjects();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.getSelectedObjects();
    }
    return [];
  }

  /**
   * raycast()
   *
   * Perform raycast for object picking (3D mode only).
   */
  raycast(x: number, y: number): THREE.Intersection[] {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.raycast(x, y);
    }
    return [];
  }

  /**
   * addEntity()
   *
   * Add entity to viewport rendering system.
   */
  addEntity(entity: Entity): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.addEntity(entity);
    }
  }

  /**
   * removeEntity()
   *
   * Remove entity from viewport rendering system.
   */
  removeEntity(entityId: string): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.removeEntity(entityId);
    }
  }

  /**
   * updateEntity()
   *
   * Update entity visualization.
   */
  updateEntity(entityId: string): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.updateEntity(entityId);
    }
  }

  /**
   * focusOnObject()
   *
   * Focus camera on specific object.
   */
  focusOnObject(object: THREE.Object3D): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.focusOnObject(object);
    }
  }

  /**
   * focusOnSelection()
   *
   * Focus camera on currently selected objects.
   */
  focusOnSelection(): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.focusOnSelection();
    }
  }

  /**
   * getManipulatorManager()
   *
   * Get manipulator manager for transform operations.
   */
  getManipulatorManager(): ManipulatorManager | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getManipulatorManager();
    }
    return null;
  }

  /**
   * getSelectionSystem()
   *
   * Get selection system for object picking.
   */
  getSelectionSystem(): ObjectSelectionSystem | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getSelectionSystem();
    }
    return null;
  }

  /**
   * getCameraControls()
   *
   * Get camera controls for advanced navigation.
   */
  getCameraControls(): CameraControlsIntegration | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getCameraControls();
    }
    return null;
  }

  /**
   * getEntityRenderingSystem()
   *
   * Get entity rendering system.
   */
  getEntityRenderingSystem(): EntityRenderingSystem | null {
    if (this.currentMode === '3d' && this.renderer3D) {
      return this.renderer3D.getEntityRenderingSystem();
    }
    return null;
  }

  /**
   * hitTest()
   *
   * Test for object intersection (2D mode only).
   */
  hitTest(x: number, y: number): PIXI.DisplayObject | null {
    if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.hitTest(x, y);
    }
    return null;
  }

  /**
   * screenToWorld()
   *
   * Convert screen coordinates to world coordinates.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number; z?: number } {
    if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.screenToWorld(screenX, screenY);
    }
    /* 3D SCREEN TO WORLD REQUIRES RAYCAST - RETURN SCREEN COORDS FOR NOW */
    return { x: screenX, y: screenY, z: 0 };
  }

  /**
   * worldToScreen()
   *
   * Convert world coordinates to screen coordinates.
   */
  worldToScreen(worldX: number, worldY: number, _worldZ: number = 0): { x: number; y: number } {
    if (this.currentMode === '2d' && this.renderer2D) {
      return this.renderer2D.worldToScreen(worldX, worldY);
    }
    /* 3D WORLD TO SCREEN REQUIRES PROJECTION - RETURN WORLD COORDS FOR NOW */
    return { x: worldX, y: worldY };
  }

  /**
   * resize()
   *
   * Handle viewport resize.
   */
  resize(): void {
    if (this.currentMode === '3d' && this.renderer3D) {
      this.renderer3D.resize();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      this.renderer2D.resize();
    }
  }

  /**
   * getSettings()
   *
   * Get current viewport settings.
   */
  getSettings(): ViewportSettings {
    return { ...this.settings };
  }

  /**
   * updateSettings()
   *
   * Update viewport settings.
   */
  updateSettings(newSettings: Partial<ViewportSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    /* APPLY SETTINGS TO ACTIVE RENDERER */
    if (this.currentMode === '3d') {
      this.applySettingsTo3D();
    } else {
      this.applySettingsTo2D();
    }
  }

  /**
   * getStats()
   *
   * Get current viewport statistics.
   */
  getStats(): ViewportStats {
    let renderStats: RenderStats | RenderStats2D;

    if (this.currentMode === '3d' && this.renderer3D) {
      renderStats = this.renderer3D.getStats();
    } else if (this.currentMode === '2d' && this.renderer2D) {
      renderStats = this.renderer2D.getStats();
    } else {
      renderStats = {
        drawCalls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
        geometries: 0,
        textures: 0
      };
    }

    return {
      mode: this.currentMode,
      fps: this.fps,
      frameCount: this.frameCount,
      renderStats
    };
  }

  /**
   * onModeChange()
   *
   * Set callback for mode change events.
   */
  onModeChange(callback: (mode: ViewportMode) => void): void {
    this.onModeChangeCallback = callback;
  }

  /**
   * onSelectionChange()
   *
   * Set callback for selection change events.
   */
  onSelectionChange(callback: (objects: (THREE.Object3D | PIXI.DisplayObject)[]) => void): void {
    this.onSelectionChangeCallback = callback;
  }

  /**
   * dispose()
   *
   * Clean up resources.
   */
  dispose(): void {
    if (this.renderer3D) {
      this.renderer3D.dispose();
      this.renderer3D = null;
    }

    if (this.renderer2D) {
      this.renderer2D.dispose();
      this.renderer2D = null;
    }

    this.onModeChangeCallback = null;
    this.onSelectionChangeCallback = null;
  }
}
