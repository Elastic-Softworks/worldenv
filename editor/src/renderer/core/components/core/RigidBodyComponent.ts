/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         RigidBodyComponent
           ---
           handles physics simulation for entities with mass,
           velocity, and force interactions.

           supports static bodies (immovable), kinematic bodies
           (script-controlled movement), and dynamic bodies
           (physics-controlled movement with collisions).

*/

import { Component, Vector3, PropertyMetadata } from '../Component';

/*
 * ===========================
        --- TYPES ---
 * ===========================
 */

export enum BodyType {
  STATIC = 'static',
  KINEMATIC = 'kinematic',
  DYNAMIC = 'dynamic'
}

export enum ForceMode {
  FORCE = 'force',
  IMPULSE = 'impulse',
  VELOCITY_CHANGE = 'velocity_change',
  ACCELERATION = 'acceleration'
}

/*
 * ===========================
        --- COMPONENT ---
 * ===========================
 */

/**
 * RigidBody component
 *
 * provides physics simulation for entities.
 * handles mass, velocity, forces, and integration
 * with the physics world.
 */
export class RigidBodyComponent extends Component {
  private _velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private _angularVelocity: Vector3 = { x: 0, y: 0, z: 0 };
  private _forces: Vector3 = { x: 0, y: 0, z: 0 };
  private _torques: Vector3 = { x: 0, y: 0, z: 0 };

  /**
   * RigidBodyComponent constructor
   */
  constructor() {
    super(
      'RigidBody',
      'Rigid Body',
      'Handles physics simulation with mass, velocity, and forces',
      'Physics'
    );
  }

  /**
   * initializeProperties()
   *
   * sets up all physics body properties with
   * appropriate defaults and validation.
   */
  protected initializeProperties(): void {
    /* body type and behavior */

    this.defineProperty<BodyType>('bodyType', BodyType.DYNAMIC, {
      type: 'enum',
      displayName: 'Body Type',
      description: 'How this body interacts with physics simulation',
      options: Object.values(BodyType)
    });

    this.defineProperty<boolean>('isKinematic', false, {
      type: 'boolean',
      displayName: 'Is Kinematic',
      description: 'Body moves only through Transform, not physics forces',
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.KINEMATIC
    });

    /* mass properties */

    this.defineProperty<number>('mass', 1.0, {
      type: 'number',
      displayName: 'Mass',
      description: 'Mass in kilograms (affects inertia and force response)',
      min: 0.001,
      max: 10000.0,
      step: 0.1,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    this.defineProperty<number>('density', 1.0, {
      type: 'number',
      displayName: 'Density',
      description: 'Mass per unit volume (auto-calculates mass from collider)',
      min: 0.1,
      max: 100.0,
      step: 0.1,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    this.defineProperty<boolean>('useAutoMass', false, {
      type: 'boolean',
      displayName: 'Use Auto Mass',
      description: 'Calculate mass automatically from density and collider volume',
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    /* motion properties */

    this.defineProperty<number>('linearDrag', 0.1, {
      type: 'number',
      displayName: 'Linear Drag',
      description: 'Air resistance for linear motion',
      min: 0.0,
      max: 10.0,
      step: 0.01,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    this.defineProperty<number>('angularDrag', 0.1, {
      type: 'number',
      displayName: 'Angular Drag',
      description: 'Air resistance for rotational motion',
      min: 0.0,
      max: 10.0,
      step: 0.01,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    /* constraints */

    this.defineProperty<boolean>('freezePositionX', false, {
      type: 'boolean',
      displayName: 'Freeze Position X',
      description: 'Prevent movement along X axis'
    });

    this.defineProperty<boolean>('freezePositionY', false, {
      type: 'boolean',
      displayName: 'Freeze Position Y',
      description: 'Prevent movement along Y axis'
    });

    this.defineProperty<boolean>('freezePositionZ', false, {
      type: 'boolean',
      displayName: 'Freeze Position Z',
      description: 'Prevent movement along Z axis'
    });

    this.defineProperty<boolean>('freezeRotationX', false, {
      type: 'boolean',
      displayName: 'Freeze Rotation X',
      description: 'Prevent rotation around X axis'
    });

    this.defineProperty<boolean>('freezeRotationY', false, {
      type: 'boolean',
      displayName: 'Freeze Rotation Y',
      description: 'Prevent rotation around Y axis'
    });

    this.defineProperty<boolean>('freezeRotationZ', false, {
      type: 'boolean',
      displayName: 'Freeze Rotation Z',
      description: 'Prevent rotation around Z axis'
    });

    /* simulation settings */

    this.defineProperty<boolean>('useGravity', true, {
      type: 'boolean',
      displayName: 'Use Gravity',
      description: 'Whether this body is affected by gravity',
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    this.defineProperty<number>('gravityScale', 1.0, {
      type: 'number',
      displayName: 'Gravity Scale',
      description: 'Multiplier for gravity effect on this body',
      min: -10.0,
      max: 10.0,
      step: 0.1,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC &&
        component.getProperty<boolean>('useGravity') === true
    });

    this.defineProperty<boolean>('isTrigger', false, {
      type: 'boolean',
      displayName: 'Is Trigger',
      description: 'Body detects collisions but does not physically collide'
    });

    /* sleep settings */

    this.defineProperty<boolean>('canSleep', true, {
      type: 'boolean',
      displayName: 'Can Sleep',
      description: 'Allow physics system to put inactive bodies to sleep',
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC
    });

    this.defineProperty<number>('sleepThreshold', 0.1, {
      type: 'number',
      displayName: 'Sleep Threshold',
      description: 'Velocity threshold below which body can sleep',
      min: 0.01,
      max: 1.0,
      step: 0.01,
      visible: (component: RigidBodyComponent) =>
        component.getProperty<BodyType>('bodyType') === BodyType.DYNAMIC &&
        component.getProperty<boolean>('canSleep') === true
    });
  }

  /*
   * ===========================
          --- GETTERS ---
   * ===========================
   */

  /**
   * getBodyType()
   *
   * returns the physics body type.
   */
  getBodyType(): BodyType {
    return this.getProperty<BodyType>('bodyType') || BodyType.DYNAMIC;
  }

  /**
   * getMass()
   *
   * returns the body mass in kilograms.
   */
  getMass(): number {
    return this.getProperty<number>('mass') || 1.0;
  }

  /**
   * getVelocity()
   *
   * returns the current linear velocity.
   */
  getVelocity(): Vector3 {
    return { ...this._velocity };
  }

  /**
   * getAngularVelocity()
   *
   * returns the current angular velocity.
   */
  getAngularVelocity(): Vector3 {
    return { ...this._angularVelocity };
  }

  /**
   * isKinematic()
   *
   * returns whether body is kinematic.
   */
  isKinematic(): boolean {
    return (
      this.getBodyType() === BodyType.KINEMATIC || this.getProperty<boolean>('isKinematic') === true
    );
  }

  /**
   * isStatic()
   *
   * returns whether body is static.
   */
  isStatic(): boolean {
    return this.getBodyType() === BodyType.STATIC;
  }

  /**
   * isDynamic()
   *
   * returns whether body is dynamic.
   */
  isDynamic(): boolean {
    return this.getBodyType() === BodyType.DYNAMIC;
  }

  /**
   * isTrigger()
   *
   * returns whether body is a trigger.
   */
  isTrigger(): boolean {
    return this.getProperty<boolean>('isTrigger') === true;
  }

  /*
   * ===========================
          --- SETTERS ---
   * ===========================
   */

  /**
   * setBodyType()
   *
   * changes the physics body type.
   */
  setBodyType(type: BodyType): void {
    this.setProperty('bodyType', type);

    /* reset velocities when changing to static/kinematic */
    if (type !== BodyType.DYNAMIC) {
      this._velocity = { x: 0, y: 0, z: 0 };
      this._angularVelocity = { x: 0, y: 0, z: 0 };
    }
  }

  /**
   * setMass()
   *
   * sets the body mass.
   */
  setMass(mass: number): void {
    this.setProperty('mass', Math.max(0.001, mass));
  }

  /**
   * setVelocity()
   *
   * sets the linear velocity directly.
   */
  setVelocity(velocity: Vector3): void {
    if (this.isDynamic()) {
      this._velocity = { ...velocity };
      this.applyConstraints();
    }
  }

  /**
   * setAngularVelocity()
   *
   * sets the angular velocity directly.
   */
  setAngularVelocity(angularVelocity: Vector3): void {
    if (this.isDynamic()) {
      this._angularVelocity = { ...angularVelocity };
      this.applyConstraints();
    }
  }

  /*
   * ===========================
          --- FORCES ---
   * ===========================
   */

  /**
   * addForce()
   *
   * applies force to the body.
   */
  addForce(force: Vector3, forceMode: ForceMode = ForceMode.FORCE): void {
    if (!this.isDynamic()) {
      return;
    }

    const mass = this.getMass();

    switch (forceMode) {
      case ForceMode.FORCE:
        /* F = ma, so a = F/m */
        this._forces.x += force.x;
        this._forces.y += force.y;
        this._forces.z += force.z;
        break;

      case ForceMode.IMPULSE:
        /* J = mΔv, so Δv = J/m */
        this._velocity.x += force.x / mass;
        this._velocity.y += force.y / mass;
        this._velocity.z += force.z / mass;
        break;

      case ForceMode.VELOCITY_CHANGE:
        /* directly change velocity */
        this._velocity.x += force.x;
        this._velocity.y += force.y;
        this._velocity.z += force.z;
        break;

      case ForceMode.ACCELERATION:
        /* a = F/m, but treat force as acceleration directly */
        this._velocity.x += force.x * (1.0 / 60.0); /* assume 60fps */
        this._velocity.y += force.y * (1.0 / 60.0);
        this._velocity.z += force.z * (1.0 / 60.0);
        break;
    }

    this.applyConstraints();
  }

  /**
   * addForceAtPosition()
   *
   * applies force at a specific world position,
   * which can create torque.
   */
  addForceAtPosition(force: Vector3, position: Vector3): void {
    if (!this.isDynamic()) {
      return;
    }

    /* apply linear force */
    this.addForce(force);

    /* calculate torque = r × F */
    /* for simplicity, assume center of mass is at transform position */
    const centerOfMass = { x: 0, y: 0, z: 0 }; /* relative to transform */
    const r = {
      x: position.x - centerOfMass.x,
      y: position.y - centerOfMass.y,
      z: position.z - centerOfMass.z
    };

    const torque = this.crossProduct(r, force);
    this.addTorque(torque);
  }

  /**
   * addTorque()
   *
   * applies rotational force to the body.
   */
  addTorque(torque: Vector3): void {
    if (!this.isDynamic()) {
      return;
    }

    this._torques.x += torque.x;
    this._torques.y += torque.y;
    this._torques.z += torque.z;
  }

  /*
   * ===========================
          --- SIMULATION ---
   * ===========================
   */

  /**
   * integrateForces()
   *
   * integrates accumulated forces into velocity.
   * called by physics system each frame.
   */
  integrateForces(deltaTime: number): void {
    if (!this.isDynamic()) {
      return;
    }

    const mass = this.getMass();

    /* apply forces: a = F/m, v = v + a*dt */
    this._velocity.x += (this._forces.x / mass) * deltaTime;
    this._velocity.y += (this._forces.y / mass) * deltaTime;
    this._velocity.z += (this._forces.z / mass) * deltaTime;

    /* apply gravity */
    if (this.getProperty<boolean>('useGravity') !== false) {
      const gravityScale = this.getProperty<number>('gravityScale') || 1.0;
      const gravity = -9.81 * gravityScale; /* assume gravity is downward */
      this._velocity.y += gravity * deltaTime;
    }

    /* apply drag */
    const linearDrag = this.getProperty<number>('linearDrag') || 0.1;
    const dragFactor = Math.max(0, 1.0 - linearDrag * deltaTime);
    this._velocity.x *= dragFactor;
    this._velocity.y *= dragFactor;
    this._velocity.z *= dragFactor;

    /* apply torques to angular velocity */
    const momentOfInertia = mass; /* simplified */
    this._angularVelocity.x += (this._torques.x / momentOfInertia) * deltaTime;
    this._angularVelocity.y += (this._torques.y / momentOfInertia) * deltaTime;
    this._angularVelocity.z += (this._torques.z / momentOfInertia) * deltaTime;

    /* apply angular drag */
    const angularDrag = this.getProperty<number>('angularDrag') || 0.1;
    const angularDragFactor = Math.max(0, 1.0 - angularDrag * deltaTime);
    this._angularVelocity.x *= angularDragFactor;
    this._angularVelocity.y *= angularDragFactor;
    this._angularVelocity.z *= angularDragFactor;

    /* clear accumulated forces */
    this._forces = { x: 0, y: 0, z: 0 };
    this._torques = { x: 0, y: 0, z: 0 };

    /* apply constraints */
    this.applyConstraints();
  }

  /**
   * applyConstraints()
   *
   * applies position and rotation constraints.
   */
  private applyConstraints(): void {
    /* freeze position axes */
    if (this.getProperty<boolean>('freezePositionX') === true) {
      this._velocity.x = 0;
    }
    if (this.getProperty<boolean>('freezePositionY') === true) {
      this._velocity.y = 0;
    }
    if (this.getProperty<boolean>('freezePositionZ') === true) {
      this._velocity.z = 0;
    }

    /* freeze rotation axes */
    if (this.getProperty<boolean>('freezeRotationX') === true) {
      this._angularVelocity.x = 0;
    }
    if (this.getProperty<boolean>('freezeRotationY') === true) {
      this._angularVelocity.y = 0;
    }
    if (this.getProperty<boolean>('freezeRotationZ') === true) {
      this._angularVelocity.z = 0;
    }
  }

  /*
   * ===========================
          --- UTILS ---
   * ===========================
   */

  /**
   * crossProduct()
   *
   * calculates cross product of two vectors.
   */
  private crossProduct(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  /**
   * calculateAutoMass()
   *
   * calculates mass from density and collider volume.
   */
  calculateAutoMass(): number {
    /* this would need integration with collider component */
    const density = this.getProperty<number>('density') || 1.0;
    const volume = 1.0; /* placeholder - would get from collider */
    return density * volume;
  }

  /*
   * ===========================
        --- VALIDATION ---
   * ===========================
   */

  /**
   * validate()
   *
   * validates rigid body properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const mass = this.getMass();
    const bodyType = this.getBodyType();

    /* validate mass */
    if (bodyType === BodyType.DYNAMIC) {
      if (mass <= 0) {
        errors.push('Dynamic body mass must be greater than zero');
      }
      if (mass > 10000) {
        errors.push('Body mass is extremely high and may cause simulation instability');
      }
    }

    /* validate drag values */
    const linearDrag = this.getProperty<number>('linearDrag') || 0;
    const angularDrag = this.getProperty<number>('angularDrag') || 0;

    if (linearDrag < 0) {
      errors.push('Linear drag cannot be negative');
    }
    if (angularDrag < 0) {
      errors.push('Angular drag cannot be negative');
    }

    /* validate gravity scale */
    const gravityScale = this.getProperty<number>('gravityScale') || 1;
    if (Math.abs(gravityScale) > 10) {
      errors.push('Gravity scale is very high and may cause simulation issues');
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* recalculate auto mass when density changes */
    if (key === 'density' && this.getProperty<boolean>('useAutoMass') === true) {
      const autoMass = this.calculateAutoMass();
      this.setProperty('mass', autoMass);
    }

    /* clear velocities when switching to static/kinematic */
    if (key === 'bodyType' && value !== BodyType.DYNAMIC) {
      this._velocity = { x: 0, y: 0, z: 0 };
      this._angularVelocity = { x: 0, y: 0, z: 0 };
    }

    /* apply constraints when constraint properties change */
    if (key.startsWith('freeze')) {
      this.applyConstraints();
    }
  }
}

/*
 * ===========================
       --- FACTORY ---
 * ===========================
 */

/**
 * createRigidBodyComponent()
 *
 * rigid body component factory function.
 */
export function createRigidBodyComponent(): RigidBodyComponent {
  return new RigidBodyComponent();
}

/* EOF */
