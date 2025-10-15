/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - 2D Viewport Renderer
 *
 * Pixi.js-based renderer for 2D viewport mode.
 * Handles sprite rendering, selection highlights, grid overlay, and 2D gizmos.
 */

import * as PIXI from 'pixi.js';
import { EditorCamera } from './EditorCamera';

export interface RenderStats2D {
  drawCalls: number;
  sprites: number;
  graphics: number;
  textures: number;
}

/**
 * ViewportRenderer2D
 *
 * Manages Pixi.js rendering for the 2D viewport.
 * Provides scene rendering with editor-specific overlays and tools.
 */
export class ViewportRenderer2D {
  private app: PIXI.Application;
  private camera: EditorCamera;
  private canvas: HTMLCanvasElement;
  private animationId: number | null;
  private isInitialized: boolean;

  /* SCENE CONTAINERS */
  private worldContainer: PIXI.Container | null;
  private gridContainer: PIXI.Container | null;
  private gizmoContainer: PIXI.Container | null;
  private uiContainer: PIXI.Container | null;

  /* GRID SYSTEM */
  private gridGraphics: PIXI.Graphics | null;
  private showGrid: boolean;
  private gridSize: number;

  /* SELECTION SYSTEM */
  private selectedObjects: PIXI.DisplayObject[];
  private selectionGraphics: PIXI.Graphics | null;

  /* GIZMOS AND HELPERS */
  private transformGizmo: PIXI.Container | null;
  private showGizmos: boolean;

  /* PERFORMANCE MONITORING */
  private stats: RenderStats2D;
  private lastFrameTime: number;
  private frameCount: number;

  /* CONFIGURATION */
  private static readonly GRID_SIZE = 50;
  private static readonly GRID_COLOR = 0x333333;
  private static readonly GRID_ALPHA = 0.5;
  private static readonly AXIS_COLOR_X = 0xff4444;
  private static readonly AXIS_COLOR_Y = 0x44ff44;
  private static readonly SELECTION_COLOR = 0x00ff00;
  private static readonly SELECTION_WIDTH = 2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.animationId = null;
    this.isInitialized = false;
    this.showGrid = true;
    this.showGizmos = true;
    this.gridSize = ViewportRenderer2D.GRID_SIZE;
    this.selectedObjects = [];
    this.transformGizmo = null;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.worldContainer = null;
    this.gridContainer = null;
    this.gizmoContainer = null;
    this.uiContainer = null;
    this.gridGraphics = null;
    this.selectionGraphics = null;

    /* INITIALIZE PIXI APPLICATION */
    this.app = new PIXI.Application({
      view: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      backgroundColor: 0x1e1e1e,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true
    });

    /* INITIALIZE CAMERA */
    this.camera = new EditorCamera(canvas);
    this.camera.setMode('2d');

    /* INITIALIZE CONTAINERS */
    this.initializeContainers();

    /* INITIALIZE GRID */
    this.initializeGrid();

    /* INITIALIZE SELECTION GRAPHICS */
    this.initializeSelection();

    /* INITIALIZE STATS */
    this.stats = {
      drawCalls: 0,
      sprites: 0,
      graphics: 0,
      textures: 0
    };

    this.resize();
    this.isInitialized = true;
  }

  /**
   * initializeContainers()
   *
   * Set up display object hierarchy for proper layering.
   */
  private initializeContainers(): void {
    /* WORLD CONTAINER - HOLDS GAME OBJECTS */
    this.worldContainer = new PIXI.Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);

    /* GRID CONTAINER - BACKGROUND GRID */
    this.gridContainer = new PIXI.Container();
    this.app.stage.addChild(this.gridContainer);

    /* GIZMO CONTAINER - TRANSFORM TOOLS */
    this.gizmoContainer = new PIXI.Container();
    this.app.stage.addChild(this.gizmoContainer);

    /* UI CONTAINER - OVERLAY UI ELEMENTS */
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.uiContainer);
  }

  /**
   * initializeGrid()
   *
   * Create grid graphics for spatial reference.
   */
  private initializeGrid(): void {
    this.gridGraphics = new PIXI.Graphics();
    this.gridContainer?.addChild(this.gridGraphics);
    this.updateGrid();
  }

  /**
   * initializeSelection()
   *
   * Create selection highlight graphics.
   */
  private initializeSelection(): void {
    this.selectionGraphics = new PIXI.Graphics();
    this.gizmoContainer?.addChild(this.selectionGraphics);
  }

  /**
   * updateGrid()
   *
   * Redraw the grid based on current camera position and zoom.
   */
  private updateGrid(): void {
    if (!this.showGrid || !this.gridGraphics) {
      if (this.gridGraphics) this.gridGraphics.visible = false;
      return;
    }

    this.gridGraphics.visible = true;
    this.gridGraphics.clear();

    const camera2D = this.camera.getCamera2D();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    /* CALCULATE GRID BOUNDS */
    const leftBound = camera2D.x - width / (2 * camera2D.zoom);
    const rightBound = camera2D.x + width / (2 * camera2D.zoom);
    const topBound = camera2D.y - height / (2 * camera2D.zoom);
    const bottomBound = camera2D.y + height / (2 * camera2D.zoom);

    const gridSpacing = this.gridSize / camera2D.zoom;

    /* SKIP GRID IF TOO DENSE */
    if (gridSpacing < 5) {
      return;
    }

    /* DRAW GRID LINES */
    this.gridGraphics.lineStyle(1, ViewportRenderer2D.GRID_COLOR, ViewportRenderer2D.GRID_ALPHA);

    /* VERTICAL LINES */
    const startX = Math.floor(leftBound / this.gridSize) * this.gridSize;
    for (let x = startX; x <= rightBound; x += this.gridSize) {
      const screenX = (x - camera2D.x) * camera2D.zoom + width / 2;
      this.gridGraphics.moveTo(screenX, 0);
      this.gridGraphics.lineTo(screenX, height);
    }

    /* HORIZONTAL LINES */
    const startY = Math.floor(topBound / this.gridSize) * this.gridSize;
    for (let y = startY; y <= bottomBound; y += this.gridSize) {
      const screenY = (y - camera2D.y) * camera2D.zoom + height / 2;
      this.gridGraphics.moveTo(0, screenY);
      this.gridGraphics.lineTo(width, screenY);
    }

    /* DRAW AXES */
    const centerX = -camera2D.x * camera2D.zoom + width / 2;
    const centerY = -camera2D.y * camera2D.zoom + height / 2;

    /* X AXIS */
    if (centerY >= 0 && centerY <= height) {
      this.gridGraphics.lineStyle(2, ViewportRenderer2D.AXIS_COLOR_X, 0.8);
      this.gridGraphics.moveTo(0, centerY);
      this.gridGraphics.lineTo(width, centerY);
    }

    /* Y AXIS */
    if (centerX >= 0 && centerX <= width) {
      this.gridGraphics.lineStyle(2, ViewportRenderer2D.AXIS_COLOR_Y, 0.8);
      this.gridGraphics.moveTo(centerX, 0);
      this.gridGraphics.lineTo(centerX, height);
    }
  }

  /**
   * updateSelection()
   *
   * Update selection highlight graphics.
   */
  private updateSelection(): void {
    if (!this.selectionGraphics) return;

    this.selectionGraphics.clear();

    if (this.selectedObjects.length === 0 || !this.showGizmos) {
      return;
    }

    this.selectionGraphics.lineStyle(
      ViewportRenderer2D.SELECTION_WIDTH,
      ViewportRenderer2D.SELECTION_COLOR,
      1
    );

    this.selectedObjects.forEach((object) => {
      const bounds = object.getBounds();
      this.selectionGraphics?.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
    });
  }

  /**
   * updateCamera()
   *
   * Apply camera transform to world container.
   */
  private updateCamera(): void {
    const camera2D = this.camera.getCamera2D();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    /* APPLY CAMERA TRANSFORM */
    if (this.worldContainer) {
      this.worldContainer.scale.set(camera2D.zoom);
      this.worldContainer.position.set(
        -camera2D.x * camera2D.zoom + width / 2,
        -camera2D.y * camera2D.zoom + height / 2
      );
    }

    /* UPDATE GRID */
    this.updateGrid();
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

    /* UPDATE CAMERA TRANSFORM */
    this.updateCamera();

    /* UPDATE SELECTION */
    this.updateSelection();

    /* RENDER FRAME */
    this.app.render();
  }

  /**
   * updateStats()
   *
   * Update rendering performance statistics.
   */
  private updateStats(time: number): void {
    this.frameCount++;

    if (time - this.lastFrameTime >= 1000) {
      /* COUNT DISPLAY OBJECTS */
      let sprites = 0;
      let graphics = 0;

      this.app.stage.children.forEach((child) => {
        this.countDisplayObjects(child, (obj) => {
          if (obj instanceof PIXI.Sprite) sprites++;
          if (obj instanceof PIXI.Graphics) graphics++;
        });
      });

      this.stats = {
        drawCalls: 0, // Simplified - actual WebGL draw calls not easily accessible
        sprites,
        graphics,
        textures: Object.keys((PIXI as any).utils.TextureCache || {}).length
      };

      this.lastFrameTime = time;
    }
  }

  /**
   * countDisplayObjects()
   *
   * Recursively count display objects in container.
   */
  private countDisplayObjects(
    container: PIXI.DisplayObject,
    callback: (obj: PIXI.DisplayObject) => void
  ): void {
    callback(container);

    if (container instanceof PIXI.Container) {
      container.children.forEach((child) => {
        this.countDisplayObjects(child, callback);
      });
    }
  }

  /**
   * addObject()
   *
   * Add object to the scene.
   */
  addObject(object: PIXI.DisplayObject): void {
    this.worldContainer?.addChild(object);
  }

  /**
   * removeObject()
   *
   * Remove object from the scene.
   */
  removeObject(object: PIXI.DisplayObject): void {
    this.worldContainer?.removeChild(object);

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
  selectObject(object: PIXI.DisplayObject): void {
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
  getSelectedObjects(): PIXI.DisplayObject[] {
    return [...this.selectedObjects];
  }

  /**
   * setGridVisible()
   *
   * Toggle grid visibility.
   */
  setGridVisible(visible: boolean): void {
    this.showGrid = visible;
    this.updateGrid();
  }

  /**
   * setGizmosVisible()
   *
   * Toggle gizmos visibility.
   */
  setGizmosVisible(visible: boolean): void {
    this.showGizmos = visible;
    this.updateSelection();
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

    this.app.renderer.resize(width, height);
    this.camera.resize(width, height);
    this.updateGrid();
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
   * Get main scene container.
   */
  getScene(): PIXI.Container | null {
    return this.worldContainer;
  }

  /**
   * getApp()
   *
   * Get Pixi.js application.
   */
  getApp(): PIXI.Application {
    return this.app;
  }

  /**
   * getWorldContainer()
   *
   * Get world container for adding game objects.
   */
  getWorldContainer(): PIXI.Container | null {
    return this.worldContainer;
  }

  /**
   * getStats()
   *
   * Get current rendering statistics.
   */
  getStats(): RenderStats2D {
    return { ...this.stats };
  }

  /**
   * hitTest()
   *
   * Test for object intersection at screen coordinates.
   */
  hitTest(x: number, y: number): PIXI.DisplayObject | null {
    const globalPoint = new PIXI.Point(x, y);
    // Simplified hit testing - traverse children manually
    if (!this.worldContainer) return null;

    for (const child of this.worldContainer.children) {
      const bounds = child.getBounds();
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return child;
      }
    }
    return null;
  }

  /**
   * screenToWorld()
   *
   * Convert screen coordinates to world coordinates.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const camera2D = this.camera.getCamera2D();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const worldX = (screenX - width / 2) / camera2D.zoom + camera2D.x;
    const worldY = (screenY - height / 2) / camera2D.zoom + camera2D.y;

    return { x: worldX, y: worldY };
  }

  /**
   * worldToScreen()
   *
   * Convert world coordinates to screen coordinates.
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const camera2D = this.camera.getCamera2D();
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const screenX = (worldX - camera2D.x) * camera2D.zoom + width / 2;
    const screenY = (worldY - camera2D.y) * camera2D.zoom + height / 2;

    return { x: screenX, y: screenY };
  }

  /**
   * dispose()
   *
   * Clean up resources.
   */
  dispose(): void {
    this.stopRenderLoop();

    /* DISPOSE PIXI APPLICATION */
    this.app.destroy(true, true);

    /* DISPOSE CAMERA */
    this.camera.dispose();
  }
}
