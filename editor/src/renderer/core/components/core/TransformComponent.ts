/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Transform Component
 *
 * Core transform component for entity positioning, rotation, and scaling.
 * Handles 2D and 3D transformations with hierarchical transforms.
 */

import { Component, Vector3, PropertyMetadata } from '../Component';

/**
 * Transform component
 *
 * Essential component for spatial positioning of entities.
 * Provides position, rotation, and scale properties with 2D/3D support.
 */
export class TransformComponent extends Component {
  /**
   * TransformComponent constructor
   */
  constructor() {
    super(
      'Transform',
      'Transform',
      'Controls the position, rotation, and scale of an entity',
      'Core'
    );
  }

  /**
   * initializeProperties()
   *
   * Sets up transform properties.
   */
  protected initializeProperties(): void {
    const vector3Metadata: PropertyMetadata = {
      type: 'vector3',
      displayName: 'Vector3',
      description: 'Three-dimensional vector (X, Y, Z)',
      step: 0.1,
    };

    this.defineProperty<Vector3>(
      'position',
      { x: 0, y: 0, z: 0 },
      {
        ...vector3Metadata,
        displayName: 'Position',
        description: 'World position of the entity',
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
        max: 360,
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
        step: 0.01,
      }
    );

    this.defineProperty<boolean>(
      'is2D',
      false,
      {
        type: 'boolean',
        displayName: 'Is 2D',
        description: 'Whether this transform operates in 2D mode (ignores Z-axis)',
      }
    );
  }

  /**
   * getPosition()
   *
   * Gets current position.
   */
  getPosition(): Vector3 {
    return this.getProperty<Vector3>('position') || { x: 0, y: 0, z: 0 };
  }

  /**
   * setPosition()
   *
   * Sets position.
   */
  setPosition(position: Vector3): void {
    this.setProperty('position', position);
  }

  /**
   * getRotation()
   *
   * Gets current rotation in degrees.
   */
  getRotation(): Vector3 {
    return this.getProperty<Vector3>('rotation') || { x: 0, y: 0, z: 0 };
  }

  /**
   * setRotation()
   *
   * Sets rotation in degrees.
   */
  setRotation(rotation: Vector3): void {
    this.setProperty('rotation', rotation);
  }

  /**
   * getScale()
   *
   * Gets current scale.
   */
  getScale(): Vector3 {
    return this.getProperty<Vector3>('scale') || { x: 1, y: 1, z: 1 };
  }

  /**
   * setScale()
   *
   * Sets scale.
   */
  setScale(scale: Vector3): void {
    this.setProperty('scale', scale);
  }

  /**
   * is2DMode()
   *
   * Checks if transform is in 2D mode.
   */
  is2DMode(): boolean {
    return this.getProperty<boolean>('is2D') || false;
  }

  /**
   * set2DMode()
   *
   * Sets 2D mode state.
   */
  set2DMode(is2D: boolean): void {
    this.setProperty('is2D', is2D);
  }

  /**
   * translate()
   *
   * Adds offset to current position.
   */
  translate(offset: Vector3): void {
    const currentPos = this.getPosition();
    this.setPosition({
      x: currentPos.x + offset.x,
      y: currentPos.y + offset.y,
      z: currentPos.z + offset.z,
    });
  }

  /**
   * rotate()
   *
   * Adds rotation to current rotation.
   */
  rotate(rotation: Vector3): void {
    const currentRot = this.getRotation();
    this.setRotation({
      x: currentRot.x + rotation.x,
      y: currentRot.y + rotation.y,
      z: currentRot.z + rotation.z,
    });
  }

  /**
   * scaleBy()
   *
   * Multiplies current scale by factor.
   */
  scaleBy(factor: Vector3): void {
    const currentScale = this.getScale();
    this.setScale({
      x: currentScale.x * factor.x,
      y: currentScale.y * factor.y,
      z: currentScale.z * factor.z,
    });
  }

  /**
   * reset()
   *
   * Resets transform to default values.
   */
  reset(): void {
    this.setPosition({ x: 0, y: 0, z: 0 });
    this.setRotation({ x: 0, y: 0, z: 0 });
    this.setScale({ x: 1, y: 1, z: 1 });
  }

  /**
   * getMatrix()
   *
   * Calculates transformation matrix (simplified for editor use).
   */
  getMatrix(): number[] {
    const pos = this.getPosition();
    const rot = this.getRotation();
    const scale = this.getScale();

    // Convert degrees to radians
    const rx = (rot.x * Math.PI) / 180;
    const ry = (rot.y * Math.PI) / 180;
    const rz = (rot.z * Math.PI) / 180;

    // Simplified 4x4 matrix for editor visualization
    // In a real engine, this would use proper matrix math
    return [
      scale.x * Math.cos(rz), -Math.sin(rz), 0, pos.x,
      Math.sin(rz), scale.y * Math.cos(rz), 0, pos.y,
      0, 0, scale.z, pos.z,
      0, 0, 0, 1,
    ];
  }

  /**
   * validate()
   *
   * Validates transform properties.
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

  /**
   * onPropertyChanged()
   *
   * Handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    // Normalize rotation values
    if (key === 'rotation') {
      const rot = value as Vector3;
      rot.x = ((rot.x % 360) + 360) % 360;
      rot.y = ((rot.y % 360) + 360) % 360;
      rot.z = ((rot.z % 360) + 360) % 360;
    }

    // Ensure minimum scale
    if (key === 'scale') {
      const scale = value as Vector3;
      scale.x = Math.max(0.001, scale.x);
      scale.y = Math.max(0.001, scale.y);
      scale.z = Math.max(0.001, scale.z);
    }

    // In 2D mode, lock Z values
    if (this.is2DMode()) {
      if (key === 'position') {
        const pos = value as Vector3;
        pos.z = 0;
      }
      if (key === 'rotation') {
        const rot = value as Vector3;
        rot.x = 0;
        rot.y = 0;
      }
    }
  }
}

/**
 * Transform component factory
 */
export function createTransformComponent(): TransformComponent {
  return new TransformComponent();
}
