/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Editor Camera System
 *
 * Provides camera control for the viewport, separate from game cameras.
 * Handles both 2D and 3D camera modes with appropriate controls.
 */

import * as THREE from 'three';

export type CameraMode = '2d' | '3d';
export type CameraPreset = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'perspective';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  mode: CameraMode;
}

export interface Camera2DState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * EditorCamera
 *
 * Camera system for the editor viewport.
 * Provides smooth controls and preset positions for efficient scene editing.
 */
export class EditorCamera {
  private camera3D: THREE.PerspectiveCamera;
  private camera2D: Camera2DState;
  private mode: CameraMode;
  private target: THREE.Vector3;
  private isDragging: boolean;
  private lastMousePosition: { x: number; y: number };
  private canvas: HTMLCanvasElement | null;

  /* CAMERA CONFIGURATION */
  private static readonly FOV = 75;
  private static readonly NEAR_PLANE = 0.1;
  private static readonly FAR_PLANE = 1000;
  private static readonly MIN_ZOOM_2D = 0.1;
  private static readonly MAX_ZOOM_2D = 10.0;
  private static readonly MIN_DISTANCE_3D = 1.0;
  private static readonly MAX_DISTANCE_3D = 100.0;
  private static readonly ROTATION_SPEED = 0.005;
  private static readonly PAN_SPEED_2D = 1.0;
  private static readonly PAN_SPEED_3D = 0.5;
  private static readonly ZOOM_SPEED = 0.1;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || null;
    this.mode = '3d';
    this.target = new THREE.Vector3(0, 0, 0);
    this.isDragging = false;
    this.lastMousePosition = { x: 0, y: 0 };

    /* INITIALIZE 3D CAMERA */
    this.camera3D = new THREE.PerspectiveCamera(
      EditorCamera.FOV,
      1.0 /* ASPECT RATIO UPDATED IN resize() */,
      EditorCamera.NEAR_PLANE,
      EditorCamera.FAR_PLANE
    );

    /* INITIALIZE 2D CAMERA STATE */
    this.camera2D = {
      x: 0,
      y: 0,
      zoom: 1.0
    };

    /* SET DEFAULT 3D POSITION */
    this.setPreset('perspective');

    this.setupEventListeners();
  }

  /**
   * setupEventListeners()
   *
   * Initialize mouse and keyboard event handlers for camera control.
   */
  private setupEventListeners(): void {
    if (!this.canvas) {
      return;
    }

    /* MOUSE EVENTS */
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * onMouseDown()
   *
   * Handle mouse press for camera interaction.
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 1 || event.button === 2) {
      /* MIDDLE OR RIGHT CLICK */
      this.isDragging = true;
      this.lastMousePosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    }
  }

  /**
   * onMouseMove()
   *
   * Handle mouse movement for camera panning and rotation.
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.lastMousePosition.x;
    const deltaY = event.clientY - this.lastMousePosition.y;

    if (this.mode === '3d') {
      this.orbit3D(deltaX, deltaY);
    } else {
      this.pan2D(deltaX, deltaY);
    }

    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  /**
   * onMouseUp()
   *
   * Handle mouse release.
   */
  private onMouseUp(): void {
    this.isDragging = false;
  }

  /**
   * onWheel()
   *
   * Handle mouse wheel for zooming.
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const zoomDelta = event.deltaY * EditorCamera.ZOOM_SPEED;

    if (this.mode === '3d') {
      this.zoom3D(zoomDelta);
    } else {
      this.zoom2D(zoomDelta);
    }
  }

  /**
   * orbit3D()
   *
   * Orbit camera around target in 3D mode.
   */
  private orbit3D(deltaX: number, deltaY: number): void {
    const position = this.camera3D.position.clone().sub(this.target);
    const spherical = new THREE.Spherical().setFromVector3(position);

    spherical.theta -= deltaX * EditorCamera.ROTATION_SPEED;
    spherical.phi += deltaY * EditorCamera.ROTATION_SPEED;

    /* CLAMP PHI TO PREVENT FLIPPING */
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    position.setFromSpherical(spherical);
    this.camera3D.position.copy(position.add(this.target));
    this.camera3D.lookAt(this.target);
  }

  /**
   * pan2D()
   *
   * Pan camera in 2D mode.
   */
  private pan2D(deltaX: number, deltaY: number): void {
    const panScale = EditorCamera.PAN_SPEED_2D / this.camera2D.zoom;
    this.camera2D.x -= deltaX * panScale;
    this.camera2D.y += deltaY * panScale;
  }

  /**
   * zoom3D()
   *
   * Zoom camera in 3D mode by moving closer/farther from target.
   */
  private zoom3D(delta: number): void {
    const direction = this.camera3D.position.clone().sub(this.target).normalize();
    const distance = this.camera3D.position.distanceTo(this.target);
    const newDistance = Math.max(
      EditorCamera.MIN_DISTANCE_3D,
      Math.min(EditorCamera.MAX_DISTANCE_3D, distance + delta)
    );

    this.camera3D.position.copy(this.target.clone().add(direction.multiplyScalar(newDistance)));
  }

  /**
   * zoom2D()
   *
   * Zoom camera in 2D mode.
   */
  private zoom2D(delta: number): void {
    const zoomFactor = 1.0 + delta * 0.1;
    this.camera2D.zoom = Math.max(
      EditorCamera.MIN_ZOOM_2D,
      Math.min(EditorCamera.MAX_ZOOM_2D, this.camera2D.zoom * zoomFactor)
    );
  }

  /**
   * setMode()
   *
   * Switch between 2D and 3D camera modes.
   */
  setMode(mode: CameraMode): void {
    this.mode = mode;

    if (mode === '3d') {
      this.setPreset('perspective');
    } else {
      this.reset2D();
    }
  }

  /**
   * setPreset()
   *
   * Set camera to predefined position (3D mode only).
   */
  setPreset(preset: CameraPreset): void {
    if (this.mode !== '3d') {
      return;
    }

    const distance = 10;

    switch (preset) {
      case 'top':
        this.camera3D.position.set(0, distance, 0);
        this.camera3D.up.set(0, 0, -1);
        break;
      case 'bottom':
        this.camera3D.position.set(0, -distance, 0);
        this.camera3D.up.set(0, 0, 1);
        break;
      case 'front':
        this.camera3D.position.set(0, 0, distance);
        this.camera3D.up.set(0, 1, 0);
        break;
      case 'back':
        this.camera3D.position.set(0, 0, -distance);
        this.camera3D.up.set(0, 1, 0);
        break;
      case 'left':
        this.camera3D.position.set(-distance, 0, 0);
        this.camera3D.up.set(0, 1, 0);
        break;
      case 'right':
        this.camera3D.position.set(distance, 0, 0);
        this.camera3D.up.set(0, 1, 0);
        break;
      case 'perspective':
      default:
        this.camera3D.position.set(5, 5, 5);
        this.camera3D.up.set(0, 1, 0);
        break;
    }

    this.camera3D.lookAt(this.target);
  }

  /**
   * reset2D()
   *
   * Reset 2D camera to default position.
   */
  reset2D(): void {
    this.camera2D.x = 0;
    this.camera2D.y = 0;
    this.camera2D.zoom = 1.0;
  }

  /**
   * reset()
   *
   * Reset camera to default position for current mode.
   */
  reset(): void {
    if (this.mode === '3d') {
      this.setPreset('perspective');
    } else {
      this.reset2D();
    }
  }

  /**
   * resize()
   *
   * Update camera aspect ratio when viewport resizes.
   */
  resize(width: number, height: number): void {
    this.camera3D.aspect = width / height;
    this.camera3D.updateProjectionMatrix();
  }

  /**
   * getCamera3D()
   *
   * Get Three.js camera for 3D rendering.
   */
  getCamera3D(): THREE.PerspectiveCamera {
    return this.camera3D;
  }

  /**
   * getCamera2D()
   *
   * Get 2D camera state for 2D rendering.
   */
  getCamera2D(): Camera2DState {
    return { ...this.camera2D };
  }

  /**
   * getMode()
   *
   * Get current camera mode.
   */
  getMode(): CameraMode {
    return this.mode;
  }

  /**
   * getState()
   *
   * Get complete camera state for serialization.
   */
  getState(): CameraState {
    return {
      position: this.camera3D.position.clone(),
      target: this.target.clone(),
      zoom: this.camera2D.zoom,
      mode: this.mode
    };
  }

  /**
   * setState()
   *
   * Restore camera state from serialized data.
   */
  setState(state: CameraState): void {
    this.mode = state.mode;
    this.target.copy(state.target);
    this.camera3D.position.copy(state.position);
    this.camera3D.lookAt(this.target);
    this.camera2D.zoom = state.zoom;
  }

  /**
   * setCanvas()
   *
   * Update canvas reference for event handling.
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvas) {
      /* REMOVE OLD EVENT LISTENERS */
      this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
      this.canvas.removeEventListener('wheel', this.onWheel.bind(this));
    }

    this.canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * dispose()
   *
   * Clean up resources and event listeners.
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
      this.canvas.removeEventListener('wheel', this.onWheel.bind(this));
    }
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
