/*
   ===============================================================
   WORLDEDIT TRANSFORM COMPONENT
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

import { Component, Vector3, PropertyMetadata } from '../Component';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         TransformComponent
	       ---
	       core spatial transformation component that handles entity
	       positioning, rotation, and scaling in both 2D and 3D
	       coordinate systems. this component serves as the foundation
	       for all spatial relationships in the scene hierarchy.

	       the transform system uses a standard coordinate system where:
	       - position represents world coordinates or local offset
	       - rotation uses euler angles in degrees for intuitive editing
	       - scale provides uniform and non-uniform scaling factors

	       transforms can be hierarchical, where child entities inherit
	       their parent's transformation matrix, enabling complex
	       object compositions and scene organization.

*/

export class TransformComponent extends Component {
  /*
	===============================================================
             --- FUNCS ---
	===============================================================
  */

  /*

           constructor()
	         ---
	         initializes the transform component with default spatial
	         values and establishes the property metadata for editor
	         interaction. sets up position at origin, no rotation,
	         and unit scale as sensible defaults for new entities.

  */

  constructor() {
    super(
      'Transform',
      'Transform',
      'Controls the position, rotation, and scale of an entity',
      'Core'
    );
  }

  /*

           initializeProperties()
	         ---
	         sets up the transform component properties including
	         position, rotation, and scale vectors with appropriate
	         metadata for editor interaction and validation.

  */

  protected initializeProperties(): void {
    const vector3Metadata: PropertyMetadata = {
      type: 'vector3',
      displayName: 'Vector3',
      description: 'Three-dimensional vector (X, Y, Z)',
      step: 0.1
    };

    this.defineProperty<Vector3>(
      'position',
      { x: 0, y: 0, z: 0 },
      {
        ...vector3Metadata,
        displayName: 'Position',
        description: 'World position of the entity'
      }
    );

    this.defineProperty<Vector3>(
      'rotation',
      { x: 0, y: 0, z: 0 },
      {
        ...vector3Metadata,
        displayName: 'Rotation',
        description: 'Rotation in degrees (Euler angles)',
        min: -360,
        max: 360
      }
    );

    this.defineProperty<Vector3>(
      'scale',
      { x: 1, y: 1, z: 1 },
      {
        ...vector3Metadata,
        displayName: 'Scale',
        description: 'Scale factor for each axis',
        min: 0.001,
        max: 100,
        step: 0.01
      }
    );
  }

  /*

           getPosition()
	         ---
	         retrieves the current world position of the transform.
	         returns a Vector3 representing x, y, z coordinates in
	         world space or local space depending on hierarchy.

  */

  getPosition(): Vector3 {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getPosition: component properties must be initialized'
    );

    const position = this.getProperty<Vector3>('position');

    /* ASSERTION: position property must exist and be valid */
    console.assert(
      position !== null && typeof position === 'object',
      'getPosition: position property must be valid Vector3 object'
    );

    return position || { x: 0, y: 0, z: 0 };
  }

  /*

           setPosition()
	         ---
	         updates the transform position to the specified coordinates.
	         triggers change events for systems that need to respond
	         to position updates like physics and rendering.

  */

  setPosition(position: Vector3): void {
    /* ASSERTION: position parameter validation */
    console.assert(
      position !== null && typeof position === 'object',
      'setPosition: position must be valid Vector3 object'
    );
    console.assert(
      typeof position.x === 'number' && isFinite(position.x),
      'setPosition: position.x must be finite number'
    );
    console.assert(
      typeof position.y === 'number' && isFinite(position.y),
      'setPosition: position.y must be finite number'
    );
    console.assert(
      typeof position.z === 'number' && isFinite(position.z),
      'setPosition: position.z must be finite number'
    );

    if (!position || typeof position !== 'object') {
      throw new Error('setPosition: Invalid position parameter - must be Vector3 object');
    }

    if (
      typeof position.x !== 'number' ||
      !isFinite(position.x) ||
      typeof position.y !== 'number' ||
      !isFinite(position.y) ||
      typeof position.z !== 'number' ||
      !isFinite(position.z)
    ) {
      throw new Error('setPosition: Invalid position components - must be finite numbers');
    }

    this.setProperty('position', position);
  }

  /*

           getRotation()
	         ---
	         retrieves the current rotation as euler angles in degrees.
	         rotation order is typically YXZ (yaw, pitch, roll) for
	         consistent behavior across transform operations.

  */

  getRotation(): Vector3 {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getRotation: component properties must be initialized'
    );

    const rotation = this.getProperty<Vector3>('rotation');

    /* ASSERTION: rotation property must exist and be valid */
    console.assert(
      rotation !== null && typeof rotation === 'object',
      'getRotation: rotation property must be valid Vector3 object'
    );

    return rotation || { x: 0, y: 0, z: 0 };
  }

  /*

           setRotation()
	         ---
	         updates the transform rotation to the specified euler angles.
	         automatically normalizes angle values to prevent overflow
	         and maintains consistent rotation representation.

  */

  setRotation(rotation: Vector3): void {
    /* ASSERTION: rotation parameter validation */
    console.assert(
      rotation !== null && typeof rotation === 'object',
      'setRotation: rotation must be valid Vector3 object'
    );
    console.assert(
      typeof rotation.x === 'number' && isFinite(rotation.x),
      'setRotation: rotation.x must be finite number'
    );
    console.assert(
      typeof rotation.y === 'number' && isFinite(rotation.y),
      'setRotation: rotation.y must be finite number'
    );
    console.assert(
      typeof rotation.z === 'number' && isFinite(rotation.z),
      'setRotation: rotation.z must be finite number'
    );

    if (!rotation || typeof rotation !== 'object') {
      throw new Error('setRotation: Invalid rotation parameter - must be Vector3 object');
    }

    if (
      typeof rotation.x !== 'number' ||
      !isFinite(rotation.x) ||
      typeof rotation.y !== 'number' ||
      !isFinite(rotation.y) ||
      typeof rotation.z !== 'number' ||
      !isFinite(rotation.z)
    ) {
      throw new Error('setRotation: Invalid rotation components - must be finite numbers');
    }

    this.setProperty('rotation', rotation);
  }

  /*

           getScale()
	         ---
	         retrieves the current scale factors for each axis.
	         scale values of 1.0 represent no scaling, values greater
	         than 1.0 enlarge, and values less than 1.0 shrink.

  */

  getScale(): Vector3 {
    /* ASSERTION: component must be properly initialized */
    console.assert(this.properties !== null, 'getScale: component properties must be initialized');

    const scale = this.getProperty<Vector3>('scale');

    /* ASSERTION: scale property must exist and be valid */
    console.assert(
      scale !== null && typeof scale === 'object',
      'getScale: scale property must be valid Vector3 object'
    );

    return scale || { x: 1, y: 1, z: 1 };
  }

  /*

           setScale()
	         ---
	         updates the transform scale factors. prevents zero or
	         negative scale values which would cause matrix inversions
	         and rendering artifacts in the transform pipeline.

  */

  setScale(scale: Vector3): void {
    /* ASSERTION: scale parameter validation */
    console.assert(
      scale !== null && typeof scale === 'object',
      'setScale: scale must be valid Vector3 object'
    );
    console.assert(
      typeof scale.x === 'number' && isFinite(scale.x) && scale.x > 0,
      'setScale: scale.x must be positive finite number'
    );
    console.assert(
      typeof scale.y === 'number' && isFinite(scale.y) && scale.y > 0,
      'setScale: scale.y must be positive finite number'
    );
    console.assert(
      typeof scale.z === 'number' && isFinite(scale.z) && scale.z > 0,
      'setScale: scale.z must be positive finite number'
    );

    if (!scale || typeof scale !== 'object') {
      throw new Error('setScale: Invalid scale parameter - must be Vector3 object');
    }

    if (
      typeof scale.x !== 'number' ||
      !isFinite(scale.x) ||
      scale.x <= 0 ||
      typeof scale.y !== 'number' ||
      !isFinite(scale.y) ||
      scale.y <= 0 ||
      typeof scale.z !== 'number' ||
      !isFinite(scale.z) ||
      scale.z <= 0
    ) {
      throw new Error('setScale: Invalid scale components - must be positive finite numbers');
    }

    this.setProperty('scale', scale);
  }

  /*

           translate()
	         ---
	         applies a relative offset to the current position without
	         replacing it entirely. useful for movement animations
	         and incremental position adjustments.

  */

  translate(offset: Vector3): void {
    /* ASSERTION: offset parameter validation */
    console.assert(
      offset !== null && typeof offset === 'object',
      'translate: offset must be valid Vector3 object'
    );
    console.assert(
      typeof offset.x === 'number' && isFinite(offset.x),
      'translate: offset.x must be finite number'
    );
    console.assert(
      typeof offset.y === 'number' && isFinite(offset.y),
      'translate: offset.y must be finite number'
    );
    console.assert(
      typeof offset.z === 'number' && isFinite(offset.z),
      'translate: offset.z must be finite number'
    );

    if (!offset || typeof offset !== 'object') {
      throw new Error('translate: Invalid offset parameter - must be Vector3 object');
    }

    if (
      typeof offset.x !== 'number' ||
      !isFinite(offset.x) ||
      typeof offset.y !== 'number' ||
      !isFinite(offset.y) ||
      typeof offset.z !== 'number' ||
      !isFinite(offset.z)
    ) {
      throw new Error('translate: Invalid offset components - must be finite numbers');
    }

    const currentPos = this.getPosition();
    this.setPosition({
      x: currentPos.x + offset.x,
      y: currentPos.y + offset.y,
      z: currentPos.z + offset.z
    });
  }

  /*

           rotate()
	         ---
	         applies a relative rotation to the current rotation values.
	         combines rotations additively for incremental rotation
	         operations like continuous spinning or user manipulation.

  */

  rotate(rotation: Vector3): void {
    /* ASSERTION: rotation parameter validation */
    console.assert(
      rotation !== null && typeof rotation === 'object',
      'rotate: rotation must be valid Vector3 object'
    );
    console.assert(
      typeof rotation.x === 'number' && isFinite(rotation.x),
      'rotate: rotation.x must be finite number'
    );
    console.assert(
      typeof rotation.y === 'number' && isFinite(rotation.y),
      'rotate: rotation.y must be finite number'
    );
    console.assert(
      typeof rotation.z === 'number' && isFinite(rotation.z),
      'rotate: rotation.z must be finite number'
    );

    if (!rotation || typeof rotation !== 'object') {
      throw new Error('rotate: Invalid rotation parameter - must be Vector3 object');
    }

    if (
      typeof rotation.x !== 'number' ||
      !isFinite(rotation.x) ||
      typeof rotation.y !== 'number' ||
      !isFinite(rotation.y) ||
      typeof rotation.z !== 'number' ||
      !isFinite(rotation.z)
    ) {
      throw new Error('rotate: Invalid rotation components - must be finite numbers');
    }

    const currentRot = this.getRotation();
    this.setRotation({
      x: currentRot.x + rotation.x,
      y: currentRot.y + rotation.y,
      z: currentRot.z + rotation.z
    });
  }

  /*

           scaleBy()
	         ---
	         applies a multiplicative scale factor to the current scale.
	         allows for proportional scaling operations while preserving
	         the relative scale ratios between axes.

  */

  scaleBy(factor: Vector3): void {
    /* ASSERTION: factor parameter validation */
    console.assert(
      factor !== null && typeof factor === 'object',
      'scaleBy: factor must be valid Vector3 object'
    );
    console.assert(
      typeof factor.x === 'number' && isFinite(factor.x) && factor.x > 0,
      'scaleBy: factor.x must be positive finite number'
    );
    console.assert(
      typeof factor.y === 'number' && isFinite(factor.y) && factor.y > 0,
      'scaleBy: factor.y must be positive finite number'
    );
    console.assert(
      typeof factor.z === 'number' && isFinite(factor.z) && factor.z > 0,
      'scaleBy: factor.z must be positive finite number'
    );

    if (!factor || typeof factor !== 'object') {
      throw new Error('scaleBy: Invalid factor parameter - must be Vector3 object');
    }

    if (
      typeof factor.x !== 'number' ||
      !isFinite(factor.x) ||
      factor.x <= 0 ||
      typeof factor.y !== 'number' ||
      !isFinite(factor.y) ||
      factor.y <= 0 ||
      typeof factor.z !== 'number' ||
      !isFinite(factor.z) ||
      factor.z <= 0
    ) {
      throw new Error('scaleBy: Invalid factor components - must be positive finite numbers');
    }

    const currentScale = this.getScale();
    this.setScale({
      x: currentScale.x * factor.x,
      y: currentScale.y * factor.y,
      z: currentScale.z * factor.z
    });
  }

  /*

           reset()
	         ---
	         restores the transform to its default state with position
	         at origin, no rotation, and unit scale. useful for
	         reinitializing objects or resetting to neutral pose.

  */

  reset(): void {
    /* ASSERTION: component must be properly initialized for reset */
    console.assert(this.properties !== null, 'reset: component properties must be initialized');

    this.setPosition({ x: 0, y: 0, z: 0 });
    this.setRotation({ x: 0, y: 0, z: 0 });
    this.setScale({ x: 1, y: 1, z: 1 });
  }

  /*

           getTransformMatrix()
	         ---
	         computes the 4x4 transformation matrix representing the
	         combined position, rotation, and scale transformations.
	         this matrix can be used by rendering systems to position
	         objects in world space efficiently.

	         the matrix is built by composing translation, rotation,
	         and scaling matrices in the standard order: T * R * S.

  */

  getTransformMatrix(): number[] {
    /* ASSERTION: component must be properly initialized */
    console.assert(
      this.properties !== null,
      'getTransformMatrix: component properties must be initialized'
    );

    const pos = this.getPosition();
    const rot = this.getRotation();
    const scale = this.getScale();

    /* ASSERTION: retrieved properties must be valid */
    console.assert(
      pos !== null && typeof pos === 'object',
      'getTransformMatrix: position must be valid Vector3'
    );
    console.assert(
      rot !== null && typeof rot === 'object',
      'getTransformMatrix: rotation must be valid Vector3'
    );
    console.assert(
      scale !== null && typeof scale === 'object',
      'getTransformMatrix: scale must be valid Vector3'
    );

    /* convert degrees to radians */
    const rx = (rot.x * Math.PI) / 180;
    const ry = (rot.y * Math.PI) / 180;
    const rz = (rot.z * Math.PI) / 180;

    /* ASSERTION: rotation values must be finite after conversion */
    console.assert(
      isFinite(rx) && isFinite(ry) && isFinite(rz),
      'getTransformMatrix: rotation radians must be finite'
    );

    /* compute rotation matrix components */
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);

    /* ASSERTION: trigonometric values must be finite */
    console.assert(
      isFinite(cx) && isFinite(sx) && isFinite(cy) && isFinite(sy) && isFinite(cz) && isFinite(sz),
      'getTransformMatrix: trigonometric values must be finite'
    );

    /* build combined rotation matrix (ZYX order) */
    const r00 = cy * cz;
    const r01 = -cy * sz;
    const r02 = sy;
    const r10 = sx * sy * cz + cx * sz;
    const r11 = -sx * sy * sz + cx * cz;
    const r12 = -sx * cy;
    const r20 = -cx * sy * cz + sx * sz;
    const r21 = cx * sy * sz + sx * cz;
    const r22 = cx * cy;

    /* ASSERTION: rotation matrix components must be finite */
    console.assert(
      isFinite(r00) &&
        isFinite(r01) &&
        isFinite(r02) &&
        isFinite(r10) &&
        isFinite(r11) &&
        isFinite(r12) &&
        isFinite(r20) &&
        isFinite(r21) &&
        isFinite(r22),
      'getTransformMatrix: rotation matrix components must be finite'
    );

    /* construct 4x4 transformation matrix with scale and translation */
    const matrix = [
      r00 * scale.x,
      r01 * scale.x,
      r02 * scale.x,
      0,
      r10 * scale.y,
      r11 * scale.y,
      r12 * scale.y,
      0,
      r20 * scale.z,
      r21 * scale.z,
      r22 * scale.z,
      0,
      pos.x,
      pos.y,
      pos.z,
      1
    ];

    /* ASSERTION: final matrix must contain only finite values */
    console.assert(
      matrix.every((value) => isFinite(value)),
      'getTransformMatrix: final matrix must contain only finite values'
    );

    return matrix;
  }

  /*

           setFromMatrix()
	         ---
	         decomposes a 4x4 transformation matrix back into position,
	         rotation, and scale components. useful for importing
	         transforms from external sources or applying computed
	         transformations back to the component properties.

  */

  setFromMatrix(matrix: number[]): void {
    /* extract translation directly from matrix */
    this.setPosition({
      x: matrix[12],
      y: matrix[13],
      z: matrix[14]
    });

    /* extract scale from matrix column lengths */
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
    const scaleY = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
    const scaleZ = Math.sqrt(
      matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]
    );

    this.setScale({ x: scaleX, y: scaleY, z: scaleZ });

    /* normalize rotation matrix by removing scale */
    const r00 = matrix[0] / scaleX;
    const r01 = matrix[4] / scaleY;
    const r02 = matrix[8] / scaleZ;
    const r10 = matrix[1] / scaleX;
    const r11 = matrix[5] / scaleY;
    const r12 = matrix[9] / scaleZ;
    const r20 = matrix[2] / scaleX;
    const r21 = matrix[6] / scaleY;
    const r22 = matrix[10] / scaleZ;

    /* extract euler angles from rotation matrix (ZYX order) */
    const rotY = (Math.asin(Math.max(-1, Math.min(1, r02))) * 180) / Math.PI;
    let rotX, rotZ;

    if (Math.abs(r02) < 0.99999) {
      rotX = (Math.atan2(-r12, r22) * 180) / Math.PI;
      rotZ = (Math.atan2(-r01, r00) * 180) / Math.PI;
    } else {
      /* handle gimbal lock case */
      rotX = (Math.atan2(r21, r11) * 180) / Math.PI;
      rotZ = 0;
    }

    this.setRotation({ x: rotX, y: rotY, z: rotZ });
  }

  /*

           validate()
	         ---
	         ensures transform parameters are within valid ranges for
	         mathematical operations. prevents configurations that
	         would cause matrix singularities or numerical instability.

  */

  validate(): string[] {
    const errors = super.validate();

    const scale = this.getScale();
    if (scale.x <= 0 || scale.y <= 0 || scale.z <= 0) {
      errors.push('Scale values must be greater than zero');
    }

    const position = this.getPosition();
    if (!isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
      errors.push('Position values must be finite numbers');
    }

    const rotation = this.getRotation();
    if (!isFinite(rotation.x) || !isFinite(rotation.y) || !isFinite(rotation.z)) {
      errors.push('Rotation values must be finite numbers');
    }

    return errors;
  }

  /*

           onPropertyChanged()
	         ---
	         handles transform property changes including validation
	         and normalization of rotation values to maintain
	         consistent angle representation.

  */

  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* normalize rotation values to 0-360 degree range */
    if (key === 'rotation') {
      const rot = value as Vector3;
      rot.x = ((rot.x % 360) + 360) % 360;
      rot.y = ((rot.y % 360) + 360) % 360;
      rot.z = ((rot.z % 360) + 360) % 360;
    }

    /* ensure minimum scale to prevent matrix singularities */
    if (key === 'scale') {
      const scale = value as Vector3;
      scale.x = Math.max(0.001, scale.x);
      scale.y = Math.max(0.001, scale.y);
      scale.z = Math.max(0.001, scale.z);
    }
  }
}

/*
	===============================================================
             --- FACTORY ---
	===============================================================
*/

/*

         createTransformComponent()
	       ---
	       factory function that creates a new TransformComponent
	       with default values. provides consistent instantiation
	       pattern for the component system registration.

	       returns a properly initialized transform component
	       at world origin with identity scale and zero rotation.

*/

export function createTransformComponent(): TransformComponent {
  return new TransformComponent();
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
