/*
   ===============================================================
   WORLDEDIT CAMERA COMPONENT
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

import { Component, Color, PropertyMetadata } from '../Component';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ProjectionMode
	       ---
	       camera projection types that determine how 3D scenes are
	       flattened to 2D screen space. perspective projection mimics
	       human vision with depth perspective, while orthographic
	       projection maintains parallel lines for technical drawing.

*/

export enum ProjectionMode {
  PERSPECTIVE = 'perspective' /* realistic depth perspective */,
  ORTHOGRAPHIC = 'orthographic' /* parallel projection */
}

/*

         CameraClearFlags
	       ---
	       rendering clear behavior that determines what happens to
	       the framebuffer before drawing the scene. controls whether
	       to clear with skybox, solid color, or depth information only.

*/

export enum CameraClearFlags {
  SKYBOX = 'skybox' /* clear with environment skybox */,
  SOLID_COLOR = 'solid_color' /* clear with single color */,
  DEPTH_ONLY = 'depth_only' /* clear depth buffer only */
}

/*

         CameraComponent
	       ---
	       camera component that defines the view properties for scene
	       rendering including projection parameters, field of view,
	       clipping planes, and rendering behavior. acts as the "eye"
	       through which the 3D world is observed and projected.

	       cameras use either perspective or orthographic projection:
	       - perspective creates realistic depth with vanishing points
	       - orthographic maintains parallel lines for technical views

	       the frustum (viewing volume) is defined by:
	       - field of view angle for perspective cameras
	       - orthographic size for parallel projection cameras
	       - near and far clipping planes for depth range

	       multiple cameras can exist in a scene, with one designated
	       as the main camera for primary viewport rendering. additional
	       cameras can be used for special effects, UI overlays, or
	       picture-in-picture displays.

*/

export class CameraComponent extends Component {
  /*
	===============================================================
             --- FUNCS ---
	===============================================================
  */

  /*

           constructor()
	         ---
	         initializes the camera component with standard viewing
	         parameters suitable for general 3D scene observation.
	         sets up perspective projection with reasonable field of
	         view and clipping planes for typical scene scales.

  */

  constructor() {
    super('Camera', 'Camera', 'Controls the view and projection properties for rendering', 'Core');
  }

  /*

           initializeProperties()
	         ---
	         sets up the camera component properties including
	         projection mode, field of view, clipping planes, and
	         rendering options with appropriate metadata for
	         editor interaction and validation.

  */

  protected initializeProperties(): void {
    this.defineProperty<ProjectionMode>('projectionMode', ProjectionMode.PERSPECTIVE, {
      type: 'enum',
      displayName: 'Projection',
      description: 'Camera projection mode',
      options: Object.values(ProjectionMode)
    });

    this.defineProperty<number>('fieldOfView', 60, {
      type: 'number',
      displayName: 'Field of View',
      description: 'Vertical field of view in degrees (perspective mode)',
      min: 1,
      max: 179,
      step: 1
    });

    this.defineProperty<number>('orthographicSize', 5, {
      type: 'number',
      displayName: 'Size',
      description: 'Half-height of camera view in world units (orthographic mode)',
      min: 0.1,
      max: 100,
      step: 0.1
    });

    this.defineProperty<number>('nearClipPlane', 0.3, {
      type: 'number',
      displayName: 'Near Clip Plane',
      description: 'Distance to near clipping plane',
      min: 0.01,
      max: 100,
      step: 0.01
    });

    this.defineProperty<number>('farClipPlane', 1000, {
      type: 'number',
      displayName: 'Far Clip Plane',
      description: 'Distance to far clipping plane',
      min: 1,
      max: 10000,
      step: 1
    });

    this.defineProperty<CameraClearFlags>('clearFlags', CameraClearFlags.SKYBOX, {
      type: 'enum',
      displayName: 'Clear Flags',
      description: 'How the camera clears the background',
      options: Object.values(CameraClearFlags)
    });

    this.defineProperty<Color>(
      'backgroundColor',
      { r: 0.19, g: 0.3, b: 0.47, a: 1 },
      {
        type: 'color',
        displayName: 'Background',
        description: 'Background color when clear flags is solid color'
      }
    );

    this.defineProperty<number>('depth', -1, {
      type: 'number',
      displayName: 'Depth',
      description: 'Camera rendering order (higher values render on top)',
      min: -100,
      max: 100,
      step: 1
    });

    this.defineProperty<number>('aspect', 1.777778, {
      type: 'number',
      displayName: 'Aspect Ratio',
      description: 'Camera aspect ratio (width/height)',
      min: 0.1,
      max: 10,
      step: 0.01,
      readonly: true
    });
  }

  /*

           getProjectionMode()
	         ---
	         retrieves the current camera projection mode, either
	         perspective or orthographic. determines how 3D geometry
	         is projected onto the 2D screen plane.

  */

  getProjectionMode(): ProjectionMode {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getProjectionMode: component properties must be initialized'
    );

    const mode = this.getProperty<ProjectionMode>('projectionMode');

    /* ASSERTION: projection mode must be valid */
    console.assert(
      mode === null || Object.values(ProjectionMode).includes(mode),
      'getProjectionMode: projection mode must be valid enum value'
    );

    return mode || ProjectionMode.PERSPECTIVE;
  }

  /*

           setProjectionMode()
	         ---
	         updates the camera projection mode. switching between
	         perspective and orthographic changes how depth is
	         represented and affects which other properties are relevant.

  */

  setProjectionMode(mode: ProjectionMode): void {
    /* ASSERTION: mode parameter validation */
    console.assert(
      mode !== null && mode !== undefined,
      'setProjectionMode: mode cannot be null or undefined'
    );
    console.assert(
      Object.values(ProjectionMode).includes(mode),
      'setProjectionMode: mode must be valid ProjectionMode enum value'
    );

    if (!mode || !Object.values(ProjectionMode).includes(mode)) {
      throw new Error('setProjectionMode: Invalid projection mode provided');
    }

    this.setProperty('projectionMode', mode);
  }

  /*

           getFieldOfView()
	         ---
	         retrieves the field of view angle in degrees for
	         perspective projection. wider angles show more of the
	         scene but with more distortion at the edges.

  */

  getFieldOfView(): number {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getFieldOfView: component properties must be initialized'
    );

    const fov = this.getProperty<number>('fieldOfView');

    /* ASSERTION: field of view must be valid if present */
    console.assert(
      fov === null || fov === undefined || (typeof fov === 'number' && isFinite(fov) && fov > 0),
      'getFieldOfView: field of view must be positive finite number'
    );

    return fov || 60;
  }

  /*

           setFieldOfView()
	         ---
	         updates the field of view angle. only affects perspective
	         projection mode. values between 30-90 degrees are typical
	         for realistic viewing, while extreme values create special effects.

  */

  setFieldOfView(fov: number): void {
    /* ASSERTION: fov parameter validation */
    console.assert(
      typeof fov === 'number' && isFinite(fov),
      'setFieldOfView: fov must be finite number'
    );
    console.assert(fov > 0 && fov <= 180, 'setFieldOfView: fov must be between 0 and 180 degrees');

    if (typeof fov !== 'number' || !isFinite(fov) || fov <= 0 || fov > 180) {
      throw new Error(
        'setFieldOfView: Invalid field of view - must be finite number between 0 and 180 degrees'
      );
    }

    this.setProperty('fieldOfView', fov);
  }

  /*

           getOrthographicSize()
	         ---
	         retrieves the orthographic view size representing the
	         half-height of the viewing volume in world units.
	         larger values show more area but smaller details.

  */

  getOrthographicSize(): number {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getOrthographicSize: component properties must be initialized'
    );

    const size = this.getProperty<number>('orthographicSize');

    /* ASSERTION: orthographic size must be valid if present */
    console.assert(
      size === null ||
        size === undefined ||
        (typeof size === 'number' && isFinite(size) && size > 0),
      'getOrthographicSize: orthographic size must be positive finite number'
    );

    return size || 5;
  }

  /*

           setOrthographicSize()
	         ---
	         updates the orthographic view size. only affects
	         orthographic projection mode. controls how much of
	         the world is visible in the camera view.

  */

  setOrthographicSize(size: number): void {
    /* ASSERTION: size parameter validation */
    console.assert(
      typeof size === 'number' && isFinite(size),
      'setOrthographicSize: size must be finite number'
    );
    console.assert(size > 0, 'setOrthographicSize: size must be positive');

    if (typeof size !== 'number' || !isFinite(size) || size <= 0) {
      throw new Error(
        'setOrthographicSize: Invalid orthographic size - must be positive finite number'
      );
    }

    this.setProperty('orthographicSize', size);
  }

  /*

           getNearClipPlane()
	         ---
	         retrieves the near clipping plane distance. objects
	         closer than this distance are not rendered and may
	         cause visual artifacts if set too small.

  */

  getNearClipPlane(): number {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getNearClipPlane: component properties must be initialized'
    );

    const nearClip = this.getProperty<number>('nearClipPlane');

    /* ASSERTION: near clip plane must be valid if present */
    console.assert(
      nearClip === null ||
        nearClip === undefined ||
        (typeof nearClip === 'number' && isFinite(nearClip) && nearClip > 0),
      'getNearClipPlane: near clip plane must be positive finite number'
    );

    return nearClip || 0.3;
  }

  /*

           setNearClipPlane()
	         ---
	         updates the near clipping plane distance. must be
	         positive and less than the far clipping plane.
	         affects depth buffer precision and z-fighting.

  */

  setNearClipPlane(near: number): void {
    /* ASSERTION: near parameter validation */
    console.assert(
      typeof near === 'number' && isFinite(near),
      'setNearClipPlane: near must be finite number'
    );
    console.assert(near > 0, 'setNearClipPlane: near must be positive');

    if (typeof near !== 'number' || !isFinite(near) || near <= 0) {
      throw new Error('setNearClipPlane: Invalid near clip plane - must be positive finite number');
    }

    /* ASSERTION: near must be less than far clip plane */
    const currentFar = this.getFarClipPlane();
    console.assert(
      near < currentFar,
      'setNearClipPlane: near clip plane must be less than far clip plane'
    );

    if (near >= currentFar) {
      throw new Error(
        `setNearClipPlane: Near clip plane (${near}) must be less than far clip plane (${currentFar})`
      );
    }

    this.setProperty('nearClipPlane', near);
  }

  /*

           getFarClipPlane()
	         ---
	         retrieves the far clipping plane distance. objects
	         farther than this distance are not rendered, which
	         helps optimize rendering performance.

  */

  getFarClipPlane(): number {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getFarClipPlane: component properties must be initialized'
    );

    const farClip = this.getProperty<number>('farClipPlane');

    /* ASSERTION: far clip plane must be valid if present */
    console.assert(
      farClip === null ||
        farClip === undefined ||
        (typeof farClip === 'number' && isFinite(farClip) && farClip > 0),
      'getFarClipPlane: far clip plane must be positive finite number'
    );

    return farClip || 1000;
  }

  /*

           setFarClipPlane()
	         ---
	         updates the far clipping plane distance. must be
	         greater than the near clipping plane. larger values
	         reduce depth buffer precision but show more distant objects.

  */

  setFarClipPlane(far: number): void {
    /* ASSERTION: far parameter validation */
    console.assert(
      typeof far === 'number' && isFinite(far),
      'setFarClipPlane: far must be finite number'
    );
    console.assert(far > 0, 'setFarClipPlane: far must be positive');

    if (typeof far !== 'number' || !isFinite(far) || far <= 0) {
      throw new Error('setFarClipPlane: Invalid far clip plane - must be positive finite number');
    }

    /* ASSERTION: far must be greater than near clip plane */
    const currentNear = this.getNearClipPlane();
    console.assert(
      far > currentNear,
      'setFarClipPlane: far clip plane must be greater than near clip plane'
    );

    if (far <= currentNear) {
      throw new Error(
        `setFarClipPlane: Far clip plane (${far}) must be greater than near clip plane (${currentNear})`
      );
    }

    this.setProperty('farClipPlane', far);
  }

  /*

           getClearFlags()
	         ---
	         retrieves the framebuffer clear behavior that determines
	         what happens before rendering each frame. affects the
	         background appearance and rendering performance.

  */

  getClearFlags(): CameraClearFlags {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getClearFlags: component properties must be initialized'
    );

    const flags = this.getProperty<CameraClearFlags>('clearFlags');

    /* ASSERTION: clear flags must be valid if present */
    console.assert(
      flags === null || flags === undefined || Object.values(CameraClearFlags).includes(flags),
      'getClearFlags: clear flags must be valid enum value'
    );

    return flags || CameraClearFlags.SKYBOX;
  }

  /*

           setClearFlags()
	         ---
	         updates the framebuffer clear behavior. skybox clearing
	         shows the environment, solid color uses a flat background,
	         and depth-only preserves the previous frame's colors.

  */

  setClearFlags(flags: CameraClearFlags): void {
    this.setProperty('clearFlags', flags);
  }

  /*

           getBackgroundColor()
	         ---
	         retrieves the solid background color used when clear
	         flags is set to solid color mode. provides a flat
	         colored background behind rendered geometry.

  */

  getBackgroundColor(): Color {
    return this.getProperty<Color>('backgroundColor') || { r: 0.19, g: 0.3, b: 0.47, a: 1 };
  }

  /*

           setBackgroundColor()
	         ---
	         updates the solid background color. only used when
	         clear flags is set to solid color mode. color components
	         should be in the 0.0-1.0 range.

  */

  setBackgroundColor(color: Color): void {
    this.setProperty('backgroundColor', color);
  }

  /*

           getDepth()
	         ---
	         retrieves the camera rendering order value. cameras
	         with higher depth values render on top of cameras
	         with lower values, enabling layered rendering effects.

  */

  getDepth(): number {
    return this.getProperty<number>('depth') || -1;
  }

  /*

           setDepth()
	         ---
	         updates the camera rendering order. useful for
	         creating UI overlays, picture-in-picture effects,
	         or multi-camera rendering setups with specific layering.

  */

  setDepth(depth: number): void {
    this.setProperty('depth', depth);
  }

  /*

           getAspectRatio()
	         ---
	         retrieves the camera aspect ratio (width divided by height).
	         typically set automatically by the viewport system but
	         can be manually controlled for special rendering effects.

  */

  getAspectRatio(): number {
    return this.getProperty<number>('aspect') || 1.777778;
  }

  /*

           setAspectRatio()
	         ---
	         updates the camera aspect ratio. usually handled
	         automatically by viewport resizing but can be set
	         manually for non-standard aspect ratios or special effects.

  */

  setAspectRatio(aspect: number): void {
    this.setProperty('aspect', aspect);
  }

  /*

           isPerspective()
	         ---
	         utility function that checks if the camera is using
	         perspective projection mode. useful for conditional
	         logic that depends on projection type.

  */

  isPerspective(): boolean {
    return this.getProjectionMode() === ProjectionMode.PERSPECTIVE;
  }

  /*

           isOrthographic()
	         ---
	         utility function that checks if the camera is using
	         orthographic projection mode. helpful for enabling
	         orthographic-specific features or user interface elements.

  */

  isOrthographic(): boolean {
    return this.getProjectionMode() === ProjectionMode.ORTHOGRAPHIC;
  }

  /*

           getProjectionMatrix()
	         ---
	         computes the 4x4 projection matrix that transforms view
	         space coordinates to clip space. this matrix defines how
	         3D points are projected onto the 2D screen plane.

	         perspective projection creates a frustum (truncated pyramid)
	         where objects appear smaller as they get farther away.
	         orthographic projection creates a rectangular box where
	         object size remains constant regardless of distance.

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
        f / aspect,
        0,
        0,
        0,
        0,
        f,
        0,
        0,
        0,
        0,
        (far + near) / (near - far),
        (2 * far * near) / (near - far),
        0,
        0,
        -1,
        0
      ];
    } else {
      const size = this.getOrthographicSize();
      const right = size * aspect;
      const left = -right;
      const top = size;
      const bottom = -size;

      return [
        2 / (right - left),
        0,
        0,
        -(right + left) / (right - left),
        0,
        2 / (top - bottom),
        0,
        -(top + bottom) / (top - bottom),
        0,
        0,
        -2 / (far - near),
        -(far + near) / (far - near),
        0,
        0,
        0,
        1
      ];
    }
  }

  /*

           validate()
	         ---
	         ensures camera parameters are within valid ranges for
	         rendering. prevents configurations that would cause
	         rendering errors or mathematical instability.

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

  /*

           onPropertyChanged()
	         ---
	         handles camera property changes including validation
	         and constraint enforcement. ensures clipping planes
	         maintain proper relationships and values stay within bounds.

  */

  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* ensure near < far clipping plane relationship */
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

    /* clamp field of view to valid range */
    if (key === 'fieldOfView') {
      const fov = value as number;
      const clampedFov = Math.max(1, Math.min(179, fov));
      if (clampedFov !== fov) {
        this.setProperty('fieldOfView', clampedFov);
      }
    }

    /* ensure positive orthographic size */
    if (key === 'orthographicSize') {
      const size = value as number;
      if (size <= 0) {
        this.setProperty('orthographicSize', 0.1);
      }
    }

    /* clamp color values to valid range */
    if (key === 'backgroundColor') {
      const color = value as Color;
      color.r = Math.max(0, Math.min(1, color.r));
      color.g = Math.max(0, Math.min(1, color.g));
      color.b = Math.max(0, Math.min(1, color.b));
      color.a = Math.max(0, Math.min(1, color.a));
    }

    /* clamp depth value */
    if (key === 'depth') {
      const depth = value as number;
      const clampedDepth = Math.max(-100, Math.min(100, Math.floor(depth)));
      if (clampedDepth !== depth) {
        this.setProperty('depth', clampedDepth);
      }
    }
  }
}

/*
	===============================================================
             --- FACTORY ---
	===============================================================
*/

/*

         createCameraComponent()
	       ---
	       factory function that creates a new CameraComponent
	       with default values. provides consistent instantiation
	       pattern for the component system registration.

	       returns a properly initialized camera component
	       with perspective projection and standard settings.

*/

export function createCameraComponent(): CameraComponent {
  return new CameraComponent();
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
