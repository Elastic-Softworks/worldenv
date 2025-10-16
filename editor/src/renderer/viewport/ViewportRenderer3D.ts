/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - 3D Viewport Renderer
 *
 * Three.js-based renderer for 3D viewport mode.
 * Handles scene rendering, gizmos, selection highlights, and grid overlay.
 */

import * as THREE from 'three';
import { EditorCamera } from './EditorCamera';

export interface RenderStats {
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
}

/**
 * ViewportRenderer3D
 *
 * Manages Three.js rendering for the 3D viewport.
 * Provides scene rendering with editor-specific overlays and tools.
 */
export class ViewportRenderer3D {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: EditorCamera;
  private canvas: HTMLCanvasElement;
  private animationId: number | null;
  private isInitialized: boolean;

  /* GRID SYSTEM */
  private gridHelper: THREE.GridHelper | null;
  private axesHelper: THREE.AxesHelper | null;
  private showGrid: boolean;
  private showAxes: boolean;

  /* SELECTION SYSTEM */
  private selectedObjects: THREE.Object3D[];
  private selectionBox!: THREE.BoxHelper;
  private outlinePass: any | null;

  /* GIZMOS AND HELPERS */
  private transformGizmo: THREE.Group | null;
  private showGizmos: boolean;

  /* LIGHTING SETUP */
  private ambientLight: THREE.AmbientLight | null;
  private directionalLight: THREE.DirectionalLight | null;

  /* PERFORMANCE MONITORING */
  private stats!: RenderStats;
  private lastFrameTime: number;
  private frameCount: number;

  /* CONFIGURATION */
  private static readonly GRID_SIZE = 20;
  private static readonly GRID_DIVISIONS = 20;
  private static readonly AXES_SIZE = 5;
  private static readonly SELECTION_COLOR = 0x00ff00;
  private static readonly GRID_COLOR_CENTER = 0x444444;
  private static readonly GRID_COLOR_GRID = 0x222222;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.animationId = null;
    this.isInitialized = false;
    this.showGrid = true;
    this.showAxes = true;
    this.showGizmos = true;
    this.selectedObjects = [];
    this.transformGizmo = null;
    this.outlinePass = null;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.gridHelper = null;
    this.axesHelper = null;
    this.ambientLight = null;
    this.directionalLight = null;

    /* INITIALIZE RENDERER WITH FALLBACK HANDLING */
    this.initializeRenderer();
  }

  /**
   * initializeRenderer()
   *
   * Initialize WebGL renderer with fallback handling.
   */
  private initializeRenderer(): void {
    try {
      console.log('[3D_RENDERER] Initializing WebGL renderer...');

      // Check WebGL support
      if (!this.isWebGLSupported()) {
        throw new Error('WebGL not supported by browser');
      }

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false // Allow software rendering
      });

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x1e1e1e, 1);

      // Enable shadows with fallback
      try {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } catch (error) {
        console.warn('[3D_RENDERER] Shadow mapping not supported, disabling shadows');
        this.renderer.shadowMap.enabled = false;
      }

      // Set up WebGL context loss handling
      this.setupContextLossHandling();

      console.log('[3D_RENDERER] WebGL renderer initialized successfully');
    } catch (error) {
      console.error('[3D_RENDERER] Failed to initialize WebGL renderer:', error);
      this.initializeFallbackRenderer();
    }

    /* INITIALIZE SCENE */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);

    /* INITIALIZE CAMERA */
    this.camera = new EditorCamera(this.canvas);

    /* INITIALIZE HELPERS */
    this.initializeHelpers();

    /* INITIALIZE LIGHTING */
    this.initializeLighting();

    /* INITIALIZE STATS */
    this.stats = {
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0
    };

    /* CREATE SELECTION HELPER */
    const selectionGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.selectionBox = new THREE.BoxHelper(
      new THREE.Mesh(selectionGeometry),
      ViewportRenderer3D.SELECTION_COLOR
    );
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.resize();
    this.isInitialized = true;
  }

  /**
   * initializeHelpers()
   *
   * Set up grid and axes helpers for spatial reference.
   */
  private initializeHelpers(): void {
    /* GRID HELPER */
    this.gridHelper = new THREE.GridHelper(
      ViewportRenderer3D.GRID_SIZE,
      ViewportRenderer3D.GRID_DIVISIONS,
      ViewportRenderer3D.GRID_COLOR_CENTER,
      ViewportRenderer3D.GRID_COLOR_GRID
    );
    this.scene.add(this.gridHelper);

    /* AXES HELPER */
    this.axesHelper = new THREE.AxesHelper(ViewportRenderer3D.AXES_SIZE);
    this.scene.add(this.axesHelper);
  }

  /**
   * initializeLighting()
   *
   * Set up scene lighting for object visibility.
   */
  private initializeLighting(): void {
    /* AMBIENT LIGHT */
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.ambientLight);

    /* DIRECTIONAL LIGHT */
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 10, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.scene.add(this.directionalLight);
  }

  /**
   * startRenderLoop()
   *
   * Begin the rendering loop.
   */
  startRenderLoop(): void {
    if (this.animationId !== null) {
      return;
    }

    const animate = (time: number): void => {
      this.render(time);
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * stopRenderLoop()
   *
   * Stop the rendering loop.
   */
  stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * render()
   *
   * Render single frame.
   */
  render(time: number = performance.now()): void {
    if (!this.isInitialized) {
      return;
    }

    /* UPDATE PERFORMANCE STATS */
    this.updateStats(time);

    /* RENDER SCENE */
    this.renderer.render(this.scene, this.camera.getCamera3D());

    /* UPDATE GIZMOS */
    this.updateGizmos();
  }

  /**
   * updateStats()
   *
   * Update rendering performance statistics.
   */
  private updateStats(time: number): void {
    this.frameCount++;

    if (time - this.lastFrameTime >= 1000) {
      const info = this.renderer.info;

      this.stats = {
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines,
        geometries: info.memory.geometries,
        textures: info.memory.textures
      };

      this.lastFrameTime = time;
    }
  }

  /**
   * updateGizmos()
   *
   * Update transform gizmos and selection helpers.
   */
  private updateGizmos(): void {
    if (this.selectedObjects.length > 0 && this.showGizmos) {
      /* UPDATE SELECTION BOX */
      const selectedObject = this.selectedObjects[0];
      this.selectionBox.setFromObject(selectedObject);
      this.selectionBox.visible = true;

      /* UPDATE TRANSFORM GIZMO */
      if (this.transformGizmo) {
        this.transformGizmo.position.copy(selectedObject.position);
        this.transformGizmo.visible = true;
      }
    } else {
      this.selectionBox.visible = false;
      if (this.transformGizmo) {
        this.transformGizmo.visible = false;
      }
    }
  }

  /**
   * addObject()
   *
   * Add object to the scene.
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * removeObject()
   *
   * Remove object from the scene.
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);

    /* REMOVE FROM SELECTION */
    const index = this.selectedObjects.indexOf(object);
    if (index !== -1) {
      this.selectedObjects.splice(index, 1);
    }
  }

  /**
   * selectObject()
   *
   * Select object for editing.
   */
  selectObject(object: THREE.Object3D): void {
    this.selectedObjects = [object];
  }

  /**
   * clearSelection()
   *
   * Clear object selection.
   */
  clearSelection(): void {
    this.selectedObjects = [];
  }

  /**
   * getSelectedObjects()
   *
   * Get currently selected objects.
   */
  getSelectedObjects(): THREE.Object3D[] {
    return [...this.selectedObjects];
  }

  /**
   * setGridVisible()
   *
   * Toggle grid visibility.
   */
  setGridVisible(visible: boolean): void {
    this.showGrid = visible;
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  /**
   * setAxesVisible()
   *
   * Toggle axes visibility.
   */
  setAxesVisible(visible: boolean): void {
    this.showAxes = visible;
    if (this.axesHelper) {
      this.axesHelper.visible = visible;
    }
  }

  /**
   * setGizmosVisible()
   *
   * Toggle gizmos visibility.
   */
  setGizmosVisible(visible: boolean): void {
    this.showGizmos = visible;
  }

  /**
   * resize()
   *
   * Handle viewport resize.
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.renderer.setSize(width, height);
    this.camera.resize(width, height);
  }

  /**
   * setCameraMode()
   *
   * Set camera mode (handled by camera instance).
   */
  setCameraMode(mode: '2d' | '3d'): void {
    this.camera.setMode(mode);
  }

  /**
   * setCameraPreset()
   *
   * Set camera to preset position.
   */
  setCameraPreset(
    preset: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'perspective'
  ): void {
    this.camera.setPreset(preset);
  }

  /**
   * resetCamera()
   *
   * Reset camera to default position.
   */
  resetCamera(): void {
    this.camera.reset();
  }

  /**
   * getCamera()
   *
   * Get camera instance.
   */
  getCamera(): EditorCamera {
    return this.camera;
  }

  /**
   * getScene()
   *
   * Get Three.js scene.
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * getRenderer()
   *
   * Get Three.js renderer.
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * getStats()
   *
   * Get current rendering statistics.
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * raycaster()
   *
   * Perform raycast for object picking.
   */
  raycast(x: number, y: number): THREE.Intersection[] {
    const rect = this.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera.getCamera3D());

    return raycaster.intersectObjects(this.scene.children, true);
  }

  /**
   * dispose()
   *
   * Clean up resources.
   */
  dispose(): void {
    this.stopRenderLoop();

    /* DISPOSE GEOMETRY AND MATERIALS */
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material: any) => material.dispose());
        } else {
          (object.material as any).dispose();
        }
      }
    });

    /* DISPOSE RENDERER */
    this.renderer.dispose();

    /* DISPOSE CAMERA */
    this.camera.dispose();
  }

  /**
   * isWebGLSupported()
   *
   * Check if WebGL is supported by the browser.
   */
  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }

  /**
   * initializeFallbackRenderer()
   *
   * Initialize fallback renderer when WebGL fails.
   */
  private initializeFallbackRenderer(): void {
    console.log('[3D_RENDERER] Initializing fallback 2D canvas renderer...');

    // Clear canvas and show fallback message
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3D Viewport Unavailable', this.canvas.width / 2, this.canvas.height / 2 - 20);

      ctx.fillStyle = '#888888';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        'WebGL not supported or graphics drivers incompatible',
        this.canvas.width / 2,
        this.canvas.height / 2 + 10
      );
    }
  }

  /**
   * setupContextLossHandling()
   *
   * Set up WebGL context loss and restore handling.
   */
  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (event) => {
      console.warn('[3D_RENDERER] WebGL context lost');
      event.preventDefault();

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.log('[3D_RENDERER] WebGL context restored, reinitializing...');
      this.reinitialize();
    });
  }

  /**
   * reinitialize()
   *
   * Reinitialize renderer after context loss.
   */
  private reinitialize(): void {
    try {
      this.initializeRenderer();
      console.log('[3D_RENDERER] Successfully reinitialized after context loss');
    } catch (error) {
      console.error('[3D_RENDERER] Failed to reinitialize after context loss:', error);
      this.initializeFallbackRenderer();
    }
  }
}
