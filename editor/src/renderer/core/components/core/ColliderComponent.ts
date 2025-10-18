/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         ColliderComponent
           ---
           handles collision detection shapes for physics
           simulation and trigger events.

           supports box, sphere, capsule, and mesh colliders
           with material properties for friction, restitution,
           and collision response.

*/

import { Component, Vector3, PropertyMetadata } from '../Component';

/*
 * ===========================
        --- TYPES ---
 * ===========================
 */

export enum ColliderType {
  BOX = 'box',
  SPHERE = 'sphere',
  CAPSULE = 'capsule',
  MESH = 'mesh',
  COMPOUND = 'compound'
}

export interface PhysicsMaterial {
  name: string;
  friction: number;
  restitution: number;
  frictionCombine: CombineMode;
  restitutionCombine: CombineMode;
}

export enum CombineMode {
  AVERAGE = 'average',
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
  MULTIPLY = 'multiply'
}

/*
 * ===========================
        --- COMPONENT ---
 * ===========================
 */

/**
 * Collider component
 *
 * defines collision shapes and physics materials
 * for entities in the physics simulation.
 * works with RigidBody components for collision response.
 */
export class ColliderComponent extends Component {
  /**
   * ColliderComponent constructor
   */
  constructor() {
    super(
      'Collider',
      'Collider',
      'Defines collision shape and physics material properties',
      'Physics'
    );
  }

  /**
   * initializeProperties()
   *
   * sets up collider shape and material properties
   * with appropriate defaults and validation.
   */
  protected initializeProperties(): void {
    /* collider shape */

    this.defineProperty<ColliderType>('type', ColliderType.BOX, {
      type: 'enum',
      displayName: 'Collider Type',
      description: 'Shape used for collision detection',
      options: Object.values(ColliderType)
    });

    this.defineProperty<boolean>('isTrigger', false, {
      type: 'boolean',
      displayName: 'Is Trigger',
      description: 'Collider detects but does not physically collide'
    });

    /* box collider properties */

    this.defineProperty<Vector3>(
      'size',
      { x: 1, y: 1, z: 1 },
      {
        type: 'vector3',
        displayName: 'Size',
        description: 'Box dimensions (width, height, depth)',
        min: 0.01,
        step: 0.1,
        visible: (component: ColliderComponent) =>
          component.getProperty<ColliderType>('type') === ColliderType.BOX
      }
    );

    /* sphere collider properties */

    this.defineProperty<number>('radius', 0.5, {
      type: 'number',
      displayName: 'Radius',
      description: 'Sphere radius',
      min: 0.01,
      max: 100.0,
      step: 0.1,
      visible: (component: ColliderComponent) => {
        const type = component.getProperty<ColliderType>('type');
        return type === ColliderType.SPHERE || type === ColliderType.CAPSULE;
      }
    });

    /* capsule collider properties */

    this.defineProperty<number>('height', 2.0, {
      type: 'number',
      displayName: 'Height',
      description: 'Capsule height (including rounded ends)',
      min: 0.01,
      max: 100.0,
      step: 0.1,
      visible: (component: ColliderComponent) =>
        component.getProperty<ColliderType>('type') === ColliderType.CAPSULE
    });

    this.defineProperty<number>('direction', 1, {
      type: 'number',
      displayName: 'Direction',
      description: 'Capsule orientation axis (0=X, 1=Y, 2=Z)',
      min: 0,
      max: 2,
      step: 1,
      visible: (component: ColliderComponent) =>
        component.getProperty<ColliderType>('type') === ColliderType.CAPSULE
    });

    /* mesh collider properties */

    this.defineProperty<string>('meshAsset', '', {
      type: 'asset',
      displayName: 'Mesh Asset',
      description: 'Mesh asset to use for collision shape',
      assetTypes: ['mesh'],
      visible: (component: ColliderComponent) =>
        component.getProperty<ColliderType>('type') === ColliderType.MESH
    });

    this.defineProperty<boolean>('convex', false, {
      type: 'boolean',
      displayName: 'Convex',
      description: 'Use convex hull for better performance (mesh colliders)',
      visible: (component: ColliderComponent) =>
        component.getProperty<ColliderType>('type') === ColliderType.MESH
    });

    /* center and rotation */

    this.defineProperty<Vector3>(
      'center',
      { x: 0, y: 0, z: 0 },
      {
        type: 'vector3',
        displayName: 'Center',
        description: 'Local center offset of the collider',
        step: 0.1
      }
    );

    this.defineProperty<Vector3>(
      'rotation',
      { x: 0, y: 0, z: 0 },
      {
        type: 'vector3',
        displayName: 'Rotation',
        description: 'Local rotation of the collider in degrees',
        min: -360,
        max: 360,
        step: 1
      }
    );

    /* physics material properties */

    this.defineProperty<number>('friction', 0.6, {
      type: 'number',
      displayName: 'Friction',
      description: 'Surface friction coefficient',
      min: 0.0,
      max: 1.0,
      step: 0.01
    });

    this.defineProperty<number>('restitution', 0.0, {
      type: 'number',
      displayName: 'Restitution',
      description: 'Bounciness (0 = no bounce, 1 = perfect bounce)',
      min: 0.0,
      max: 1.0,
      step: 0.01
    });

    this.defineProperty<CombineMode>('frictionCombine', CombineMode.AVERAGE, {
      type: 'enum',
      displayName: 'Friction Combine',
      description: 'How friction combines with other materials',
      options: Object.values(CombineMode)
    });

    this.defineProperty<CombineMode>('restitutionCombine', CombineMode.AVERAGE, {
      type: 'enum',
      displayName: 'Restitution Combine',
      description: 'How restitution combines with other materials',
      options: Object.values(CombineMode)
    });

    /* layer and filtering */

    this.defineProperty<number>('layer', 0, {
      type: 'number',
      displayName: 'Layer',
      description: 'Physics layer for collision filtering',
      min: 0,
      max: 31,
      step: 1
    });

    this.defineProperty<number>('layerMask', 0xffffffff, {
      type: 'number',
      displayName: 'Layer Mask',
      description: 'Bitmask of layers this collider interacts with',
      min: 0,
      max: 0xffffffff,
      step: 1
    });
  }

  /*
   * ===========================
          --- GETTERS ---
   * ===========================
   */

  /**
   * getColliderType()
   *
   * returns the collider shape type.
   */
  getColliderType(): ColliderType {
    return this.getProperty<ColliderType>('type') || ColliderType.BOX;
  }

  /**
   * isTrigger()
   *
   * returns whether this is a trigger collider.
   */
  isTrigger(): boolean {
    return this.getProperty<boolean>('isTrigger') === true;
  }

  /**
   * getSize()
   *
   * returns box collider dimensions.
   */
  getSize(): Vector3 {
    return this.getProperty<Vector3>('size') || { x: 1, y: 1, z: 1 };
  }

  /**
   * getRadius()
   *
   * returns sphere/capsule radius.
   */
  getRadius(): number {
    return this.getProperty<number>('radius') || 0.5;
  }

  /**
   * getHeight()
   *
   * returns capsule height.
   */
  getHeight(): number {
    return this.getProperty<number>('height') || 2.0;
  }

  /**
   * getCenter()
   *
   * returns local center offset.
   */
  getCenter(): Vector3 {
    return this.getProperty<Vector3>('center') || { x: 0, y: 0, z: 0 };
  }

  /**
   * getRotation()
   *
   * returns local rotation in degrees.
   */
  getRotation(): Vector3 {
    return this.getProperty<Vector3>('rotation') || { x: 0, y: 0, z: 0 };
  }

  /**
   * getPhysicsMaterial()
   *
   * returns physics material properties.
   */
  getPhysicsMaterial(): PhysicsMaterial {
    return {
      name: 'Default',
      friction: this.getProperty<number>('friction') || 0.6,
      restitution: this.getProperty<number>('restitution') || 0.0,
      frictionCombine: this.getProperty<CombineMode>('frictionCombine') || CombineMode.AVERAGE,
      restitutionCombine: this.getProperty<CombineMode>('restitutionCombine') || CombineMode.AVERAGE
    };
  }

  /*
   * ===========================
          --- SETTERS ---
   * ===========================
   */

  /**
   * setColliderType()
   *
   * changes the collider shape type.
   */
  setColliderType(type: ColliderType): void {
    this.setProperty('type', type);

    /* set appropriate default values for the new type */
    switch (type) {
      case ColliderType.BOX:
        this.setProperty('size', { x: 1, y: 1, z: 1 });
        break;

      case ColliderType.SPHERE:
        this.setProperty('radius', 0.5);
        break;

      case ColliderType.CAPSULE:
        this.setProperty('radius', 0.5);
        this.setProperty('height', 2.0);
        this.setProperty('direction', 1); /* Y-axis */
        break;

      case ColliderType.MESH:
        this.setProperty('convex', false);
        break;
    }
  }

  /**
   * setSize()
   *
   * sets box collider size.
   */
  setSize(size: Vector3): void {
    const clampedSize = {
      x: Math.max(0.01, size.x),
      y: Math.max(0.01, size.y),
      z: Math.max(0.01, size.z)
    };
    this.setProperty('size', clampedSize);
  }

  /**
   * setRadius()
   *
   * sets sphere/capsule radius.
   */
  setRadius(radius: number): void {
    this.setProperty('radius', Math.max(0.01, radius));
  }

  /**
   * setPhysicsMaterial()
   *
   * sets physics material properties.
   */
  setPhysicsMaterial(material: PhysicsMaterial): void {
    this.setProperty('friction', material.friction);
    this.setProperty('restitution', material.restitution);
    this.setProperty('frictionCombine', material.frictionCombine);
    this.setProperty('restitutionCombine', material.restitutionCombine);
  }

  /*
   * ===========================
          --- COLLISION ---
   * ===========================
   */

  /**
   * getBounds()
   *
   * calculates axis-aligned bounding box for the collider.
   */
  getBounds(): { min: Vector3; max: Vector3 } {
    const center = this.getCenter();
    const type = this.getColliderType();

    let min: Vector3, max: Vector3;

    switch (type) {
      case ColliderType.BOX: {
        const size = this.getSize();
        const halfSize = {
          x: size.x * 0.5,
          y: size.y * 0.5,
          z: size.z * 0.5
        };
        min = {
          x: center.x - halfSize.x,
          y: center.y - halfSize.y,
          z: center.z - halfSize.z
        };
        max = {
          x: center.x + halfSize.x,
          y: center.y + halfSize.y,
          z: center.z + halfSize.z
        };
        break;
      }

      case ColliderType.SPHERE: {
        const radius = this.getRadius();
        min = {
          x: center.x - radius,
          y: center.y - radius,
          z: center.z - radius
        };
        max = {
          x: center.x + radius,
          y: center.y + radius,
          z: center.z + radius
        };
        break;
      }

      case ColliderType.CAPSULE: {
        const radius = this.getRadius();
        const height = this.getHeight();
        const direction = this.getProperty<number>('direction') || 1;

        const halfHeight = height * 0.5;

        if (direction === 0) {
          /* X-axis */
          min = { x: center.x - halfHeight, y: center.y - radius, z: center.z - radius };
          max = { x: center.x + halfHeight, y: center.y + radius, z: center.z + radius };
        } else if (direction === 1) {
          /* Y-axis */
          min = { x: center.x - radius, y: center.y - halfHeight, z: center.z - radius };
          max = { x: center.x + radius, y: center.y + halfHeight, z: center.z + radius };
        } else {
          /* Z-axis */
          min = { x: center.x - radius, y: center.y - radius, z: center.z - halfHeight };
          max = { x: center.x + radius, y: center.y + radius, z: center.z + halfHeight };
        }
        break;
      }

      default:
        /* fallback to unit box */
        min = { x: center.x - 0.5, y: center.y - 0.5, z: center.z - 0.5 };
        max = { x: center.x + 0.5, y: center.y + 0.5, z: center.z + 0.5 };
        break;
    }

    return { min, max };
  }

  /**
   * getVolume()
   *
   * calculates approximate volume of the collider shape.
   */
  getVolume(): number {
    const type = this.getColliderType();

    switch (type) {
      case ColliderType.BOX: {
        const size = this.getSize();
        return size.x * size.y * size.z;
      }

      case ColliderType.SPHERE: {
        const radius = this.getRadius();
        return (4.0 / 3.0) * Math.PI * radius * radius * radius;
      }

      case ColliderType.CAPSULE: {
        const radius = this.getRadius();
        const height = this.getHeight();
        const cylinderHeight = Math.max(0, height - 2 * radius);
        const cylinderVolume = Math.PI * radius * radius * cylinderHeight;
        const sphereVolume = (4.0 / 3.0) * Math.PI * radius * radius * radius;
        return cylinderVolume + sphereVolume;
      }

      case ColliderType.MESH:
        /* mesh volume calculation would require mesh data */
        return 1.0; /* placeholder */

      default:
        return 1.0;
    }
  }

  /*
   * ===========================
        --- VALIDATION ---
   * ===========================
   */

  /**
   * validate()
   *
   * validates collider properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const type = this.getColliderType();

    /* validate dimensions */
    if (type === ColliderType.BOX) {
      const size = this.getSize();
      if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
        errors.push('Box collider size must be greater than zero on all axes');
      }
    }

    if (type === ColliderType.SPHERE || type === ColliderType.CAPSULE) {
      const radius = this.getRadius();
      if (radius <= 0) {
        errors.push('Radius must be greater than zero');
      }
    }

    if (type === ColliderType.CAPSULE) {
      const height = this.getHeight();
      const radius = this.getRadius();
      if (height <= 0) {
        errors.push('Capsule height must be greater than zero');
      }
      if (height < 2 * radius) {
        errors.push('Capsule height should be at least twice the radius');
      }
    }

    /* validate physics material */
    const friction = this.getProperty<number>('friction') || 0;
    const restitution = this.getProperty<number>('restitution') || 0;

    if (friction < 0 || friction > 1) {
      errors.push('Friction must be between 0 and 1');
    }

    if (restitution < 0 || restitution > 1) {
      errors.push('Restitution must be between 0 and 1');
    }

    /* validate mesh asset */
    if (type === ColliderType.MESH) {
      const meshAsset = this.getProperty<string>('meshAsset') || '';
      if (!meshAsset) {
        errors.push('Mesh collider requires a mesh asset');
      }
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * handles property changes and enforces constraints.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* clamp size values */
    if (key === 'size') {
      const size = value as Vector3;
      size.x = Math.max(0.01, size.x);
      size.y = Math.max(0.01, size.y);
      size.z = Math.max(0.01, size.z);
    }

    /* clamp radius and height */
    if (key === 'radius') {
      const radius = Math.max(0.01, value as number);
      if (radius !== value) {
        this.setProperty(key, radius);
      }
    }

    if (key === 'height') {
      const height = Math.max(0.01, value as number);
      if (height !== value) {
        this.setProperty(key, height);
      }
    }

    /* normalize rotation values */
    if (key === 'rotation') {
      const rot = value as Vector3;
      rot.x = ((rot.x % 360) + 360) % 360;
      rot.y = ((rot.y % 360) + 360) % 360;
      rot.z = ((rot.z % 360) + 360) % 360;
    }

    /* clamp material values */
    if (key === 'friction' || key === 'restitution') {
      const clamped = Math.max(0, Math.min(1, value as number));
      if (clamped !== value) {
        this.setProperty(key, clamped);
      }
    }
  }
}

/*
 * ===========================
       --- FACTORY ---
 * ===========================
 */

/**
 * createColliderComponent()
 *
 * collider component factory function.
 */
export function createColliderComponent(): ColliderComponent {
  return new ColliderComponent();
}

/* EOF */
