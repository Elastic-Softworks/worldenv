/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Camera Component
 *
 * Camera component for controlling viewport rendering and projection.
 * Handles camera properties, projection modes, and rendering parameters.
 */

import { Component, Color, PropertyMetadata } from '../Component';

/**
 * Camera projection modes
 */
export enum ProjectionMode {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic',
}

/**
 * Camera clear flags
 */
export enum CameraClearFlags {
  SKYBOX = 'skybox',
  SOLID_COLOR = 'solid_color',
  DEPTH_ONLY = 'depth_only',
  DONT_CLEAR = 'dont_clear',
}

/**
 * Camera rendering path
 */
export enum RenderingPath {
  FORWARD = 'forward',
  DEFERRED = 'deferred',
  LEGACY_VERTEX_LIT = 'legacy_vertex_lit',
}

/**
 * Camera component
 *
 * Controls camera properties for rendering viewports.
 * Supports perspective and orthographic projections with various rendering options.
 */
export class CameraComponent extends Component {
  /**
   * CameraComponent constructor
   */
  constructor() {
    super(
      'Camera',
      'Camera',
      'Renders the scene from this entity\'s position and orientation',
      'Core'
    );
  }

  /**
   * initializeProperties()
   *
   * Sets up camera properties.
   */
  protected initializeProperties(): void {
    this.defineProperty<ProjectionMode>(
      'projectionMode',
      ProjectionMode.PERSPECTIVE,
      {
        type: 'enum',
        displayName: 'Projection',
        description: 'Camera projection mode',
        options: Object.values(ProjectionMode),
      }
    );

    this.defineProperty<number>(
      'fieldOfView',
      60,
      {
        type: 'number',
        displayName: 'Field of View',
        description: 'Vertical field of view in degrees (perspective mode)',
        min: 1,
        max: 179,
        step: 1,
      }
    );

    this.defineProperty<number>(
      'orthographicSize',
      5,
      {
        type: 'number',
        displayName: 'Size',
        description: 'Half-height of camera view in world units (orthographic mode)',
        min: 0.1,
        max: 100,
        step: 0.1,
      }
    );

    this.defineProperty<number>(
      'nearClipPlane',
      0.3,
      {
        type: 'number',
        displayName: 'Near Clip Plane',
        description: 'Distance to near clipping plane',
        min: 0.01,
        max: 100,
        step: 0.01,
      }
    );

    this.defineProperty<number>(
      'farClipPlane',
      1000,
      {
        type: 'number',
        displayName: 'Far Clip Plane',
        description: 'Distance to far clipping plane',
        min: 1,
        max: 10000,
        step: 1,
      }
    );

    this.defineProperty<CameraClearFlags>(
      'clearFlags',
      CameraClearFlags.SKYBOX,
      {
        type: 'enum',
        displayName: 'Clear Flags',
        description: 'How the camera clears the background',
        options: Object.values(CameraClearFlags),
      }
    );

    this.defineProperty<Color>(
      'backgroundColor',
      { r: 0.19, g: 0.3, b: 0.47, a: 1 },
      {
        type: 'color',
        displayName: 'Background',
        description: 'Background color when clear flags is solid color',
      }
    );

    this.defineProperty<number>(
      'depth',
      -1,
      {
        type: 'number',
        displayName: 'Depth',
        description: 'Camera rendering order (higher values render on top)',
        min: -100,
        max: 100,
        step: 1,
      }
    );

    this.defineProperty<number>(
      'cullingMask',
      -1,
      {
        type: 'number',
        displayName: 'Culling Mask',
        description: 'Layer mask for selective rendering',
        readonly: true,
      }
    );

    this.defineProperty<RenderingPath>(
      'renderingPath',
      RenderingPath.FORWARD,
      {
        type: 'enum',
        displayName: 'Rendering Path',
        description: 'Rendering pipeline to use',
        options: Object.values(RenderingPath),
      }
    );

    this.defineProperty<boolean>(
      'useOcclusionCulling',
      true,
      {
        type: 'boolean',
        displayName: 'Occlusion Culling',
        description: 'Enable occlusion culling for performance',
      }
    );

    this.defineProperty<boolean>(
      'allowHDR',
      true,
      {
        type: 'boolean',
        displayName: 'Allow HDR',
        description: 'Enable high dynamic range rendering',
      }
    );

    this.defineProperty<boolean>(
      'allowMSAA',
      true,
      {
        type: 'boolean',
        displayName: 'Allow MSAA',
        description: 'Enable multi-sample anti-aliasing',
      }
    );

    this.defineProperty<boolean>(
      'allowDynamicResolution',
      false,
      {
        type: 'boolean',
        displayName: 'Allow Dynamic Resolution',
        description: 'Enable dynamic resolution scaling',
      }
    );

    this.defineProperty<number>(
      'targetEye',
      0,
      {
        type: 'number',
        displayName: 'Target Eye',
        description: 'Target eye for VR rendering (0=Both, 1=Left, 2=Right)',
        min: 0,
        max: 2,
        step: 1,
      }
    );

    this.defineProperty<boolean>(
      'forceIntoRenderTexture',
      false,
      {
        type: 'boolean',
        displayName: 'Force Into Render Texture',
        description: 'Force camera to render into a texture',
      }
    );

    this.defineProperty<number>(
      'aspect',
      1.777778,
      {
        type: 'number',
        displayName: 'Aspect Ratio',
        description: 'Camera aspect ratio (width/height)',
        min: 0.1,
        max: 10,
        step: 0.01,
        readonly: true,
      }
    );
  }

  /**
   * getProjectionMode()
   *
   * Gets current projection mode.
   */
  getProjectionMode(): ProjectionMode {
    return this.getProperty<ProjectionMode>('projectionMode') || ProjectionMode.PERSPECTIVE;
  }

  /**
   * setProjectionMode()
   *
   * Sets projection mode.
   */
  setProjectionMode(mode: ProjectionMode): void {
    this.setProperty('projectionMode', mode);
  }

  /**
   * getFieldOfView()
   *
   * Gets field of view in degrees.
   */
  getFieldOfView(): number {
    return this.getProperty<number>('fieldOfView') || 60;
  }

  /**
   * setFieldOfView()
   *
   * Sets field of view in degrees.
   */
  setFieldOfView(fov: number): void {
    this.setProperty('fieldOfView', fov);
  }

  /**
   * getOrthographicSize()
   *
   * Gets orthographic size.
   */
  getOrthographicSize(): number {
    return this.getProperty<number>('orthographicSize') || 5;
  }

  /**
   * setOrthographicSize()
   *
   * Sets orthographic size.
   */
  setOrthographicSize(size: number): void {
    this.setProperty('orthographicSize', size);
  }

  /**
   * getNearClipPlane()
   *
   * Gets near clipping plane distance.
   */
  getNearClipPlane(): number {
    return this.getProperty<number>('nearClipPlane') || 0.3;
  }

  /**
   * setNearClipPlane()
   *
   * Sets near clipping plane distance.
   */
  setNearClipPlane(near: number): void {
    this.setProperty('nearClipPlane', near);
  }

  /**
   * getFarClipPlane()
   *
   * Gets far clipping plane distance.
   */
  getFarClipPlane(): number {
    return this.getProperty<number>('farClipPlane') || 1000;
  }

  /**
   * setFarClipPlane()
   *
   * Sets far clipping plane distance.
   */
  setFarClipPlane(far: number): void {
    this.setProperty('farClipPlane', far);
  }

  /**
   * getClearFlags()
   *
   * Gets camera clear flags.
   */
  getClearFlags(): CameraClearFlags {
    return this.getProperty<CameraClearFlags>('clearFlags') || CameraClearFlags.SKYBOX;
  }

  /**
   * setClearFlags()
   *
   * Sets camera clear flags.
   */
  setClearFlags(flags: CameraClearFlags): void {
    this.setProperty('clearFlags', flags);
  }

  /**
   * getBackgroundColor()
   *
   * Gets background color.
   */
  getBackgroundColor(): Color {
    return this.getProperty<Color>('backgroundColor') || { r: 0.19, g: 0.3, b: 0.47, a: 1 };
  }

  /**
   * setBackgroundColor()
   *
   * Sets background color.
   */
  setBackgroundColor(color: Color): void {
    this.setProperty('backgroundColor', color);
  }

  /**
   * getDepth()
   *
   * Gets camera depth (rendering order).
   */
  getDepth(): number {
    return this.getProperty<number>('depth') || -1;
  }

  /**
   * setDepth()
   *
   * Sets camera depth (rendering order).
   */
  setDepth(depth: number): void {
    this.setProperty('depth', depth);
  }

  /**
   * getRenderingPath()
   *
   * Gets rendering path.
   */
  getRenderingPath(): RenderingPath {
    return this.getProperty<RenderingPath>('renderingPath') || RenderingPath.FORWARD;
  }

  /**
   * setRenderingPath()
   *
   * Sets rendering path.
   */
  setRenderingPath(path: RenderingPath): void {
    this.setProperty('renderingPath', path);
  }

  /**
   * isOcclusionCullingEnabled()
   *
   * Checks if occlusion culling is enabled.
   */
  isOcclusionCullingEnabled(): boolean {
    return this.getProperty<boolean>('useOcclusionCulling') || false;
  }

  /**
   * setOcclusionCulling()
   *
   * Sets occlusion culling state.
   */
  setOcclusionCulling(enabled: boolean): void {
    this.setProperty('useOcclusionCulling', enabled);
  }

  /**
   * isHDRAllowed()
   *
   * Checks if HDR is allowed.
   */
  isHDRAllowed(): boolean {
    return this.getProperty<boolean>('allowHDR') || false;
  }

  /**
   * setAllowHDR()
   *
   * Sets HDR allowance.
   */
  setAllowHDR(allow: boolean): void {
    this.setProperty('allowHDR', allow);
  }

  /**
   * isMSAAAllowed()
   *
   * Checks if MSAA is allowed.
   */
  isMSAAAllowed(): boolean {
    return this.getProperty<boolean>('allowMSAA') || false;
  }

  /**
   * setAllowMSAA()
   *
   * Sets MSAA allowance.
   */
  setAllowMSAA(allow: boolean): void {
    this.setProperty('allowMSAA', allow);
  }

  /**
   * getAspectRatio()
   *
   * Gets camera aspect ratio.
   */
  getAspectRatio(): number {
    return this.getProperty<number>('aspect') || 1.777778;
  }

  /**
   * setAspectRatio()
   *
   * Sets camera aspect ratio.
   */
  setAspectRatio(aspect: number): void {
    this.setProperty('aspect', aspect);
  }

  /**
   * isPerspective()
   *
   * Checks if camera is in perspective mode.
   */
  isPerspective(): boolean {
    return this.getProjectionMode() === ProjectionMode.PERSPECTIVE;
  }

  /**
   * isOrthographic()
   *
   * Checks if camera is in orthographic mode.
   */
  isOrthographic(): boolean {
    return this.getProjectionMode() === ProjectionMode.ORTHOGRAPHIC;
  }

  /**
   * getProjectionMatrix()
   *
   * Calculates projection matrix (simplified for editor use).
   */
  getProjectionMatrix(): number[] {
    const aspect = this.getAspectRatio();
    const near = this.getNearClipPlane();
    const far = this.getFarClipPlane();

    if (this.isPerspective()) {
      const fov = this.getFieldOfView();
      const fovRad = (fov * Math.PI) / 180;
      const f = 1.0 / Math.tan(fovRad / 2);

      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), (2 * far * near) / (near - far),
        0, 0, -1, 0,
      ];
    } else {
      const size = this.getOrthographicSize();
      const right = size * aspect;
      const left = -right;
      const top = size;
      const bottom = -size;

      return [
        2 / (right - left), 0, 0, -(right + left) / (right - left),
        0, 2 / (top - bottom), 0, -(top + bottom) / (top - bottom),
        0, 0, -2 / (far - near), -(far + near) / (far - near),
        0, 0, 0, 1,
      ];
    }
  }

  /**
   * validate()
   *
   * Validates camera properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const near = this.getNearClipPlane();
    const far = this.getFarClipPlane();

    if (near >= far) {
      errors.push('Near clipping plane must be less than far clipping plane');
    }

    if (near <= 0) {
      errors.push('Near clipping plane must be greater than zero');
    }

    const fov = this.getFieldOfView();
    if (fov <= 0 || fov >= 180) {
      errors.push('Field of view must be between 0 and 180 degrees');
    }

    const orthographicSize = this.getOrthographicSize();
    if (orthographicSize <= 0) {
      errors.push('Orthographic size must be greater than zero');
    }

    const aspect = this.getAspectRatio();
    if (aspect <= 0) {
      errors.push('Aspect ratio must be greater than zero');
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * Handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    // Ensure near < far
    if (key === 'nearClipPlane' || key === 'farClipPlane') {
      const near = this.getNearClipPlane();
      const far = this.getFarClipPlane();

      if (key === 'nearClipPlane' && near >= far) {
        this.setProperty('nearClipPlane', Math.max(0.01, far - 0.1));
      }

      if (key === 'farClipPlane' && far <= near) {
        this.setProperty('farClipPlane', near + 0.1);
      }
    }

    // Clamp field of view
    if (key === 'fieldOfView') {
      const fov = value as number;
      const clampedFov = Math.max(1, Math.min(179, fov));
      if (clampedFov !== fov) {
        this.setProperty('fieldOfView', clampedFov);
      }
    }

    // Ensure positive orthographic size
    if (key === 'orthographicSize') {
      const size = value as number;
      if (size <= 0) {
        this.setProperty('orthographicSize', 0.1);
      }
    }

    // Clamp color values
    if (key === 'backgroundColor') {
      const color = value as Color;
      color.r = Math.max(0, Math.min(1, color.r));
      color.g = Math.max(0, Math.min(1, color.g));
      color.b = Math.max(0, Math.min(1, color.b));
      color.a = Math.max(0, Math.min(1, color.a));
    }

    // Clamp depth
    if (key === 'depth') {
      const depth = value as number;
      const clampedDepth = Math.max(-100, Math.min(100, Math.floor(depth)));
      if (clampedDepth !== depth) {
        this.setProperty('depth', clampedDepth);
      }
    }

    // Clamp target eye
    if (key === 'targetEye') {
      const eye = value as number;
      const clampedEye = Math.max(0, Math.min(2, Math.floor(eye)));
      if (clampedEye !== eye) {
        this.setProperty('targetEye', clampedEye);
      }
    }
  }
}

/**
 * Camera component factory
 */
export function createCameraComponent(): CameraComponent {
  return new CameraComponent();
}
