/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Camera Controls Integration
 *
 * Enhanced camera controls for 3D viewport including orbit, pan, zoom, and focus.
 * Provides smooth animations and configurable interaction modes.
 */

import * as THREE from 'three';
import { EditorCamera } from './EditorCamera';

export interface CameraControlsEvent {
  type: 'change' | 'start' | 'end';
  camera: THREE.Camera;
  target: THREE.Vector3;
}

export interface CameraControlsSettings {
  enableOrbit: boolean;
  enablePan: boolean;
  enableZoom: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  panSpeed: number;
  rotateSpeed: number;
  zoomSpeed: number;
  keyPanSpeed: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

/**
 * CameraControlsIntegration
 *
 * Advanced camera controls for 3D viewport with smooth interactions.
 * Integrates with EditorCamera and provides animation support.
 */
export class CameraControlsIntegration {
  private camera: EditorCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;
  private eventListeners: Map<string, (event: CameraControlsEvent) => void>;

  /* INTERACTION STATE */
  private isEnabled: boolean;
  private state: 'none' | 'rotate' | 'pan' | 'dolly';
  private startMouse: THREE.Vector2;
  private currentMouse: THREE.Vector2;
  private lastMouse: THREE.Vector2;

  /* SPHERICAL COORDINATES */
  private spherical: THREE.Spherical;
  private sphericalDelta: THREE.Spherical;
  private scale: number;
  private panOffset: THREE.Vector3;

  /* DAMPING AND ANIMATION */
  private enableDamping: boolean;
  private dampingFactor: number;
  private isAnimating: boolean;
  private animationId: number | null;

  /* CONFIGURATION */
  private settings: CameraControlsSettings;

  /* TOUCH SUPPORT */
  private touches: { [key: number]: THREE.Vector2 };
  private touchCount: number;

  /* KEYBOARD STATE */
  private keys: { [key: string]: boolean };

  /* CONSTANTS */
  private static readonly EPS = 0.000001;
  private static readonly DEFAULT_DISTANCE = 10;
  private static readonly MIN_DISTANCE = 0.1;
  private static readonly MAX_DISTANCE = 1000;
  private static readonly MIN_POLAR_ANGLE = 0;
  private static readonly MAX_POLAR_ANGLE = Math.PI;

  constructor(camera: EditorCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3();

    /* INITIALIZE INTERACTION STATE */
    this.isEnabled = true;
    this.state = 'none';
    this.startMouse = new THREE.Vector2();
    this.currentMouse = new THREE.Vector2();
    this.lastMouse = new THREE.Vector2();

    /* INITIALIZE SPHERICAL COORDINATES */
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();

    /* INITIALIZE DAMPING */
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    this.isAnimating = false;
    this.animationId = null;

    /* INITIALIZE SETTINGS */
    this.settings = {
      enableOrbit: true,
      enablePan: true,
      enableZoom: true,
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: CameraControlsIntegration.MIN_DISTANCE,
      maxDistance: CameraControlsIntegration.MAX_DISTANCE,
      minPolarAngle: CameraControlsIntegration.MIN_POLAR_ANGLE,
      maxPolarAngle: CameraControlsIntegration.MAX_POLAR_ANGLE,
      panSpeed: 1.0,
      rotateSpeed: 1.0,
      zoomSpeed: 1.0,
      keyPanSpeed: 7.0,
      autoRotate: false,
      autoRotateSpeed: 2.0
    };

    /* INITIALIZE EVENT LISTENERS */
    this.eventListeners = new Map();

    /* INITIALIZE TOUCH STATE */
    this.touches = {};
    this.touchCount = 0;

    /* INITIALIZE KEYBOARD STATE */
    this.keys = {};

    this.setupEventListeners();
    this.updateCameraState();
  }

  /**
   * setupEventListeners()
   *
   * Set up mouse, touch, and keyboard event listeners.
   */
  private setupEventListeners(): void {
    /* MOUSE EVENTS */
    this.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    /* TOUCH EVENTS */
    this.domElement.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false
    });
    this.domElement.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false
    });
    this.domElement.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false
    });

    /* KEYBOARD EVENTS */
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));

    /* CONTEXT MENU */
    this.domElement.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  /**
   * updateCameraState()
   *
   * Update internal state from current camera position.
   */
  private updateCameraState(): void {
    const camera3D = this.camera.getCamera3D();
    const position = camera3D.position.clone();
    const offset = position.clone().sub(this.target);

    this.spherical.setFromVector3(offset);
  }

  /**
   * handleMouseDown()
   *
   * Handle mouse down event for camera interaction start.
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    event.preventDefault();

    this.startMouse.set(event.clientX, event.clientY);
    this.lastMouse.copy(this.startMouse);

    switch (event.button) {
      case 0 /* LEFT BUTTON - ORBIT */:
        if (this.settings.enableOrbit) {
          this.state = 'rotate';
        }
        break;

      case 1 /* MIDDLE BUTTON - PAN */:
        if (this.settings.enablePan) {
          this.state = 'pan';
        }
        break;

      case 2 /* RIGHT BUTTON - PAN */:
        if (this.settings.enablePan) {
          this.state = 'pan';
        }
        break;
    }

    if (this.state !== 'none') {
      this.dispatchStartEvent();
    }
  }

  /**
   * handleMouseMove()
   *
   * Handle mouse move event for camera interaction.
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled || this.state === 'none') {
      return;
    }

    event.preventDefault();

    this.currentMouse.set(event.clientX, event.clientY);

    const deltaX = this.currentMouse.x - this.lastMouse.x;
    const deltaY = this.currentMouse.y - this.lastMouse.y;

    switch (this.state) {
      case 'rotate':
        this.handleRotate(deltaX, deltaY);
        break;

      case 'pan':
        this.handlePan(deltaX, deltaY);
        break;
    }

    this.lastMouse.copy(this.currentMouse);
    this.update();
  }

  /**
   * handleMouseUp()
   *
   * Handle mouse up event to end camera interaction.
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    event.preventDefault();

    if (this.state !== 'none') {
      this.dispatchEndEvent();
    }

    this.state = 'none';
  }

  /**
   * handleWheel()
   *
   * Handle mouse wheel event for zooming.
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled || !this.settings.enableZoom) {
      return;
    }

    event.preventDefault();

    let delta = 0;

    if (event.deltaY < 0) {
      delta = 1;
    } else if (event.deltaY > 0) {
      delta = -1;
    }

    this.handleZoom(delta * this.settings.zoomSpeed);
    this.update();
  }

  /**
   * handleTouchStart()
   *
   * Handle touch start event.
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) {
      return;
    }

    event.preventDefault();

    this.touchCount = event.touches.length;

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.touches[touch.identifier] = new THREE.Vector2(touch.clientX, touch.clientY);
    }

    if (this.touchCount === 1) {
      this.state = 'rotate';
      this.dispatchStartEvent();
    } else if (this.touchCount === 2) {
      this.state = 'dolly';
      this.dispatchStartEvent();
    }
  }

  /**
   * handleTouchMove()
   *
   * Handle touch move event.
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled || this.state === 'none') {
      return;
    }

    event.preventDefault();

    if (this.touchCount === 1 && event.touches.length === 1) {
      /* SINGLE TOUCH - ROTATE */
      const touch = event.touches[0];
      const lastTouch = this.touches[touch.identifier];

      if (lastTouch) {
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        this.handleRotate(deltaX, deltaY);
        lastTouch.set(touch.clientX, touch.clientY);
      }
    } else if (this.touchCount === 2 && event.touches.length === 2) {
      /* TWO TOUCH - ZOOM/PAN */
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const currentDistance = touch1.clientX - touch2.clientX;
      const currentDistanceY = touch1.clientY - touch2.clientY;
      const currentDistanceTotal = Math.sqrt(
        currentDistance * currentDistance + currentDistanceY * currentDistanceY
      );

      const lastTouch1 = this.touches[touch1.identifier];
      const lastTouch2 = this.touches[touch2.identifier];

      if (lastTouch1 && lastTouch2) {
        const lastDistance = lastTouch1.x - lastTouch2.x;
        const lastDistanceY = lastTouch1.y - lastTouch2.y;
        const lastDistanceTotal = Math.sqrt(
          lastDistance * lastDistance + lastDistanceY * lastDistanceY
        );

        const deltaDistance = currentDistanceTotal - lastDistanceTotal;
        this.handleZoom(deltaDistance * 0.01);
      }

      this.touches[touch1.identifier].set(touch1.clientX, touch1.clientY);
      this.touches[touch2.identifier].set(touch2.clientX, touch2.clientY);
    }

    this.update();
  }

  /**
   * handleTouchEnd()
   *
   * Handle touch end event.
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) {
      return;
    }

    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      delete this.touches[touch.identifier];
    }

    this.touchCount = event.touches.length;

    if (this.touchCount === 0) {
      this.dispatchEndEvent();
      this.state = 'none';
    }
  }

  /**
   * handleKeyDown()
   *
   * Handle keyboard input for camera controls.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) {
      return;
    }

    this.keys[event.code] = true;

    /* HANDLE CAMERA MOVEMENT KEYS */
    const panDistance = this.settings.keyPanSpeed;
    let needsUpdate = false;

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.handlePan(0, panDistance);
        needsUpdate = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.handlePan(0, -panDistance);
        needsUpdate = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.handlePan(panDistance, 0);
        needsUpdate = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.handlePan(-panDistance, 0);
        needsUpdate = true;
        break;

      case 'KeyQ':
        this.handleZoom(1);
        needsUpdate = true;
        break;

      case 'KeyE':
        this.handleZoom(-1);
        needsUpdate = true;
        break;
    }

    if (needsUpdate) {
      event.preventDefault();
      this.update();
    }
  }

  /**
   * handleKeyUp()
   *
   * Handle key release.
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) {
      return;
    }

    this.keys[event.code] = false;
  }

  /**
   * handleContextMenu()
   *
   * Prevent context menu on right click.
   */
  private handleContextMenu(event: Event): void {
    event.preventDefault();
  }

  /**
   * handleRotate()
   *
   * Handle camera rotation (orbit).
   */
  private handleRotate(deltaX: number, deltaY: number): void {
    if (!this.settings.enableOrbit) {
      return;
    }

    const element = this.domElement;
    const rotateSpeed = this.settings.rotateSpeed;

    /* CALCULATE ROTATION DELTAS */
    const rotateLeft = ((2 * Math.PI * deltaX) / element.clientHeight) * rotateSpeed;
    const rotateUp = ((2 * Math.PI * deltaY) / element.clientHeight) * rotateSpeed;

    /* APPLY ROTATION */
    this.sphericalDelta.theta -= rotateLeft;
    this.sphericalDelta.phi -= rotateUp;
  }

  /**
   * handlePan()
   *
   * Handle camera panning.
   */
  private handlePan(deltaX: number, deltaY: number): void {
    if (!this.settings.enablePan) {
      return;
    }

    const camera3D = this.camera.getCamera3D();
    const element = this.domElement;
    const panSpeed = this.settings.panSpeed;

    if (camera3D instanceof THREE.PerspectiveCamera) {
      /* PERSPECTIVE CAMERA PANNING */
      const perspectiveCamera = camera3D as THREE.PerspectiveCamera;
      const position = perspectiveCamera.position.clone();
      const targetDistance = position.distanceTo(this.target);

      /* CALCULATE PAN SCALE */
      let fov = (perspectiveCamera.fov * Math.PI) / 180;
      let panScale = (2 * Math.tan(fov / 2) * targetDistance) / element.clientHeight;
      panScale *= panSpeed;

      /* CALCULATE PAN VECTORS */
      const panLeft = new THREE.Vector3();
      const panUp = new THREE.Vector3();

      panLeft.setFromMatrixColumn(perspectiveCamera.matrix, 0);
      panUp.setFromMatrixColumn(perspectiveCamera.matrix, 1);

      panLeft.multiplyScalar(-deltaX * panScale);
      panUp.multiplyScalar(deltaY * panScale);

      this.panOffset.add(panLeft).add(panUp);
    }
  }

  /**
   * handleZoom()
   *
   * Handle camera zoom/dolly.
   */
  private handleZoom(delta: number): void {
    if (!this.settings.enableZoom) {
      return;
    }

    if (delta < 0) {
      this.scale *= Math.pow(0.95, this.settings.zoomSpeed);
    } else if (delta > 0) {
      this.scale /= Math.pow(0.95, this.settings.zoomSpeed);
    }
  }

  /**
   * update()
   *
   * Update camera position based on current state.
   */
  public update(): boolean {
    const camera3D = this.camera.getCamera3D();
    const position = camera3D.position;

    /* APPLY AUTO-ROTATION */
    if (this.settings.autoRotate && this.state === 'none') {
      this.sphericalDelta.theta -= ((2 * Math.PI) / 60 / 60) * this.settings.autoRotateSpeed;
    }

    /* APPLY SCALE */
    this.spherical.radius *= this.scale;

    /* APPLY PAN OFFSET */
    this.target.add(this.panOffset);

    /* APPLY SPHERICAL DELTAS */
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    /* CLAMP ANGLES AND DISTANCE */
    this.spherical.theta = Math.max(-Math.PI * 2, Math.min(Math.PI * 2, this.spherical.theta));

    this.spherical.phi = Math.max(
      this.settings.minPolarAngle,
      Math.min(this.settings.maxPolarAngle, this.spherical.phi)
    );

    this.spherical.radius = Math.max(
      this.settings.minDistance,
      Math.min(this.settings.maxDistance, this.spherical.radius)
    );

    this.spherical.makeSafe();

    /* UPDATE CAMERA POSITION */
    const offset = new THREE.Vector3();
    offset.setFromSpherical(this.spherical);
    position.copy(this.target).add(offset);

    camera3D.lookAt(this.target);

    /* APPLY DAMPING */
    if (this.settings.enableDamping && this.state === 'none') {
      this.sphericalDelta.theta *= 1 - this.settings.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.settings.dampingFactor;
      this.panOffset.multiplyScalar(1 - this.settings.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
      this.panOffset.set(0, 0, 0);
    }

    this.scale = 1;

    /* CHECK FOR CHANGES */
    const hasChanged =
      this.sphericalDelta.theta > CameraControlsIntegration.EPS ||
      this.sphericalDelta.phi > CameraControlsIntegration.EPS ||
      this.panOffset.lengthSq() > CameraControlsIntegration.EPS ||
      this.scale !== 1;

    if (hasChanged) {
      this.dispatchChangeEvent();
    }

    return hasChanged;
  }

  /**
   * setTarget()
   *
   * Set camera target position.
   */
  public setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
    this.updateCameraState();
  }

  /**
   * getTarget()
   *
   * Get current camera target.
   */
  public getTarget(): THREE.Vector3 {
    return this.target.clone();
  }

  /**
   * focusOnObject()
   *
   * Focus camera on specific object.
   */
  public focusOnObject(object: THREE.Object3D, fitOffset: number = 1.5): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = (maxDim * fitOffset) / (2 * Math.tan((Math.PI * 30) / 360));

    this.target.copy(center);
    this.spherical.radius = distance;
    this.updateCameraState();
    this.update();
  }

  /**
   * focusOnBounds()
   *
   * Focus camera on bounding box.
   */
  public focusOnBounds(box: THREE.Box3, fitOffset: number = 1.5): void {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = (maxDim * fitOffset) / (2 * Math.tan((Math.PI * 30) / 360));

    this.target.copy(center);
    this.spherical.radius = distance;
    this.updateCameraState();
    this.update();
  }

  /**
   * reset()
   *
   * Reset camera to default position.
   */
  public reset(): void {
    this.target.set(0, 0, 0);
    this.spherical.set(CameraControlsIntegration.DEFAULT_DISTANCE, Math.PI / 2, 0);
    this.sphericalDelta.set(0, 0, 0);
    this.panOffset.set(0, 0, 0);
    this.scale = 1;
    this.update();
  }

  /**
   * setEnabled()
   *
   * Enable or disable camera controls.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      this.state = 'none';
    }
  }

  /**
   * isControlsEnabled()
   *
   * Check if controls are enabled.
   */
  public isControlsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * setSettings()
   *
   * Update camera controls settings.
   */
  public setSettings(settings: Partial<CameraControlsSettings>): void {
    Object.assign(this.settings, settings);

    this.enableDamping = this.settings.enableDamping;
    this.dampingFactor = this.settings.dampingFactor;
  }

  /**
   * getSettings()
   *
   * Get current settings.
   */
  public getSettings(): CameraControlsSettings {
    return { ...this.settings };
  }

  /**
   * addEventListener()
   *
   * Add event listener for camera controls events.
   */
  public addEventListener(type: string, listener: (event: CameraControlsEvent) => void): void {
    this.eventListeners.set(type, listener);
  }

  /**
   * removeEventListener()
   *
   * Remove event listener.
   */
  public removeEventListener(type: string): void {
    this.eventListeners.delete(type);
  }

  /**
   * dispatchChangeEvent()
   *
   * Dispatch camera change event.
   */
  private dispatchChangeEvent(): void {
    const event: CameraControlsEvent = {
      type: 'change',
      camera: this.camera.getCamera3D(),
      target: this.target.clone()
    };

    const listener = this.eventListeners.get('change');
    if (listener) {
      listener(event);
    }

    /* EVENT DISPATCHED VIA LISTENER ABOVE */
  }

  /**
   * dispatchStartEvent()
   *
   * Dispatch interaction start event.
   */
  private dispatchStartEvent(): void {
    const event: CameraControlsEvent = {
      type: 'start',
      camera: this.camera.getCamera3D(),
      target: this.target.clone()
    };

    const listener = this.eventListeners.get('start');
    if (listener) {
      listener(event);
    }

    /* EVENT DISPATCHED VIA LISTENER ABOVE */
  }

  /**
   * dispatchEndEvent()
   *
   * Dispatch interaction end event.
   */
  private dispatchEndEvent(): void {
    const event: CameraControlsEvent = {
      type: 'end',
      camera: this.camera.getCamera3D(),
      target: this.target.clone()
    };

    const listener = this.eventListeners.get('end');
    if (listener) {
      listener(event);
    }

    /* EVENT DISPATCHED VIA LISTENER ABOVE */
  }

  /**
   * startAnimation()
   *
   * Start continuous update animation.
   */
  public startAnimation(): void {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    const animate = (): void => {
      if (!this.isAnimating) {
        return;
      }

      const hasChanged = this.update();

      if (hasChanged || this.settings.autoRotate) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * stopAnimation()
   *
   * Stop continuous update animation.
   */
  public stopAnimation(): void {
    this.isAnimating = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * dispose()
   *
   * Clean up camera controls resources.
   */
  public dispose(): void {
    /* STOP ANIMATION */
    this.stopAnimation();

    /* REMOVE EVENT LISTENERS */
    this.domElement.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.domElement.removeEventListener('wheel', this.handleWheel.bind(this));
    this.domElement.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.domElement.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.domElement.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.domElement.removeEventListener('contextmenu', this.handleContextMenu.bind(this));

    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));

    /* CLEAR COLLECTIONS */
    this.eventListeners.clear();
    this.eventListeners.delete('change');

    /* CLEAR TOUCH AND KEY COLLECTIONS */
    Object.keys(this.touches).forEach((key) => delete this.touches[parseInt(key)]);
    Object.keys(this.keys).forEach((key) => delete this.keys[key]);
    this.touches = {};
    this.keys = {};
  }

  /**
   * delete()
   *
   * Alias for dispose() method for cleanup verification.
   */
  public delete(): void {
    this.dispose();
  }
}
