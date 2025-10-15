/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Rotate Manipulator
 *
 * Rotation manipulator with circular handles for X, Y, Z axes.
 * Supports drag-to-rotate, angle snapping, and quaternion interpolation.
 */

import * as THREE from 'three';
import {
  BaseManipulator,
  ManipulatorMode,
  ManipulatorAxis,
  TransformSpace
} from './BaseManipulator';
import { TransformType } from '../../utils/TransformUtils';

/**
 * RotateManipulator class
 *
 * Circle-based manipulator for rotating objects around world or local axes.
 * Provides visual angle feedback and precise rotation controls.
 */
export class RotateManipulator extends BaseManipulator {
  private startRotation: THREE.Quaternion;
  private currentRotation: THREE.Quaternion;
  private rotationAxis: THREE.Vector3;
  private startAngle: number;
  private currentAngle: number;
  private startMouse: THREE.Vector2;

  constructor() {
    super(ManipulatorMode.Rotate);

    this.startRotation = new THREE.Quaternion();
    this.currentRotation = new THREE.Quaternion();
    this.rotationAxis = new THREE.Vector3();
    this.startAngle = 0;
    this.currentAngle = 0;
    this.startMouse = new THREE.Vector2();
  }

  /**
   * createHandles()
   *
   * Creates circular handles for X, Y, Z axes rotation.
   */
  protected createHandles(): void {
    // X-axis handle (red circle)
    const xHandle = this.createCircleHandle(ManipulatorAxis.X);
    xHandle.rotation.y = Math.PI / 2;
    this.handles.set(ManipulatorAxis.X, xHandle);
    this.add(xHandle);

    // Y-axis handle (green circle)
    const yHandle = this.createCircleHandle(ManipulatorAxis.Y);
    yHandle.rotation.x = Math.PI / 2;
    this.handles.set(ManipulatorAxis.Y, yHandle);
    this.add(yHandle);

    // Z-axis handle (blue circle)
    const zHandle = this.createCircleHandle(ManipulatorAxis.Z);
    this.handles.set(ManipulatorAxis.Z, zHandle);
    this.add(zHandle);

    // Outer sphere handle for screen-space rotation
    const sphereHandle = this.createSphereHandle();
    this.handles.set(ManipulatorAxis.XYZ, sphereHandle);
    this.add(sphereHandle);
  }

  /**
   * createCircleHandle()
   *
   * Creates circular geometry for axis handle.
   */
  private createCircleHandle(axis: ManipulatorAxis): THREE.Group {
    const group = new THREE.Group();

    // Circle geometry
    const geometry = new THREE.TorusGeometry(1.0, 0.02, 8, 64);
    const material = this.materials.get(axis)!;
    const circle = new THREE.Mesh(geometry, material);
    group.add(circle);

    // Add tick marks for visual reference
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tickGeometry = new THREE.BoxGeometry(0.05, 0.02, 0.02);
      const tick = new THREE.Mesh(tickGeometry, material);

      tick.position.set(Math.cos(angle) * 1.05, Math.sin(angle) * 1.05, 0);
      tick.rotation.z = angle;

      group.add(tick);
    }

    return group;
  }

  /**
   * createSphereHandle()
   *
   * Creates sphere handle for free rotation.
   */
  private createSphereHandle(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.2, 16, 12);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * calculateDelta()
   *
   * Calculates rotation delta from mouse movement.
   */
  protected calculateDelta(): THREE.Vector3 {
    if (!this.camera || !this.interaction.activeAxis) {
      return new THREE.Vector3();
    }

    const axis = this.interaction.activeAxis;
    const delta = new THREE.Vector3();

    // Calculate rotation angle based on mouse movement
    const angle = this.calculateRotationAngle(axis);
    const deltaAngle = angle - this.startAngle;

    // Convert to axis rotation
    switch (axis) {
      case ManipulatorAxis.X:
        delta.set(deltaAngle, 0, 0);
        this.rotationAxis.set(1, 0, 0);
        break;

      case ManipulatorAxis.Y:
        delta.set(0, deltaAngle, 0);
        this.rotationAxis.set(0, 1, 0);
        break;

      case ManipulatorAxis.Z:
        delta.set(0, 0, deltaAngle);
        this.rotationAxis.set(0, 0, 1);
        break;

      case ManipulatorAxis.XYZ:
        // Screen-space rotation
        delta.copy(this.calculateScreenRotation());
        break;
    }

    return delta;
  }

  /**
   * calculateRotationAngle()
   *
   * Calculates rotation angle from mouse position on circle.
   */
  private calculateRotationAngle(axis: ManipulatorAxis): number {
    if (!this.camera) {
      return 0;
    }

    // Project mouse ray onto rotation plane
    const plane = new THREE.Plane();
    const normal = new THREE.Vector3();

    switch (axis) {
      case ManipulatorAxis.X:
        normal.set(1, 0, 0);
        break;

      case ManipulatorAxis.Y:
        normal.set(0, 1, 0);
        break;

      case ManipulatorAxis.Z:
        normal.set(0, 0, 1);
        break;

      default:
        return 0;
    }

    // Transform normal to world space if in local mode
    if (this.settings.space === TransformSpace.Local && this.targets.length === 1) {
      const target = this.targets[0].object;
      normal.transformDirection(target.matrixWorld);
    }

    plane.setFromNormalAndCoplanarPoint(normal, this.position);

    // Cast ray to plane
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(plane, intersectPoint)) {
      // Calculate angle from manipulator center
      const direction = intersectPoint.clone().sub(this.position).normalize();
      const angle = Math.atan2(direction.y, direction.x);

      return angle;
    }

    return 0;
  }

  /**
   * calculateScreenRotation()
   *
   * Calculates screen-space rotation delta.
   */
  private calculateScreenRotation(): THREE.Vector3 {
    if (!this.camera) {
      return new THREE.Vector3();
    }

    // Calculate mouse movement in screen space
    const deltaX = this.mouse.x - this.startMouse.x;
    const deltaY = this.mouse.y - this.startMouse.y;

    // Convert to rotation angles
    const rotationSpeed = 2.0;
    const deltaRotation = new THREE.Vector3(-deltaY * rotationSpeed, deltaX * rotationSpeed, 0);

    return deltaRotation;
  }

  /**
   * updateTransform()
   *
   * Applies rotation delta to target objects.
   */
  protected updateTransform(axis: ManipulatorAxis, delta: THREE.Vector3): void {
    this.targets.forEach((target) => {
      let rotation: THREE.Quaternion;

      if (axis === ManipulatorAxis.XYZ) {
        // Screen-space rotation
        rotation = this.calculateScreenQuaternion(delta);
      } else {
        // Axis-constrained rotation
        rotation = this.calculateAxisQuaternion(axis, delta);
      }

      // Apply rotation
      if (this.settings.space === TransformSpace.Local) {
        target.object.quaternion.setFromEuler(target.initialTransform.rotation);
        target.object.quaternion.multiply(rotation);
      } else {
        const worldRotation = new THREE.Quaternion().setFromEuler(target.initialTransform.rotation);
        worldRotation.premultiply(rotation);
        target.object.quaternion.copy(worldRotation);
      }
    });
  }

  /**
   * calculateAxisQuaternion()
   *
   * Creates quaternion for axis-constrained rotation.
   */
  private calculateAxisQuaternion(axis: ManipulatorAxis, delta: THREE.Vector3): THREE.Quaternion {
    const quaternion = new THREE.Quaternion();
    const axisVector = new THREE.Vector3();

    switch (axis) {
      case ManipulatorAxis.X:
        axisVector.set(1, 0, 0);
        quaternion.setFromAxisAngle(axisVector, delta.x);
        break;

      case ManipulatorAxis.Y:
        axisVector.set(0, 1, 0);
        quaternion.setFromAxisAngle(axisVector, delta.y);
        break;

      case ManipulatorAxis.Z:
        axisVector.set(0, 0, 1);
        quaternion.setFromAxisAngle(axisVector, delta.z);
        break;
    }

    // Transform axis to local space if needed
    if (this.settings.space === TransformSpace.Local && this.targets.length === 1) {
      const target = this.targets[0].object;
      axisVector.transformDirection(target.matrixWorld);
      quaternion.setFromAxisAngle(axisVector, delta.length());
    }

    return quaternion;
  }

  /**
   * calculateScreenQuaternion()
   *
   * Creates quaternion for screen-space rotation.
   */
  private calculateScreenQuaternion(delta: THREE.Vector3): THREE.Quaternion {
    if (!this.camera) {
      return new THREE.Quaternion();
    }

    // Get camera right and up vectors
    const cameraMatrix = new THREE.Matrix4().extractRotation(this.camera.matrixWorld);
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(cameraMatrix);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(cameraMatrix);

    // Create rotation quaternions
    const xRotation = new THREE.Quaternion().setFromAxisAngle(right, delta.x);
    const yRotation = new THREE.Quaternion().setFromAxisAngle(up, delta.y);

    // Combine rotations
    const combined = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

    return combined;
  }

  /**
   * startInteraction()
   *
   * Begins rotation interaction.
   */
  protected startInteraction(axis: ManipulatorAxis): void {
    super.startInteraction(axis);

    // Store initial angle
    this.startAngle = this.calculateRotationAngle(axis);
    this.startMouse.copy(this.mouse);

    /* Store initial rotations */
    this.targets.forEach((target) => {
      target.initialTransform.rotation.setFromQuaternion(target.object.quaternion);
    });
  }

  /**
   * applySnap()
   *
   * Applies angle snapping to rotation delta.
   */
  protected applySnap(delta: THREE.Vector3): void {
    const snapAngle = this.settings.snapValue * (Math.PI / 180); // Convert to radians

    delta.x = Math.round(delta.x / snapAngle) * snapAngle;
    delta.y = Math.round(delta.y / snapAngle) * snapAngle;
    delta.z = Math.round(delta.z / snapAngle) * snapAngle;
  }

  /**
   * setSpace()
   *
   * Sets transform space (world or local).
   */
  public setSpace(space: TransformSpace): void {
    this.settings.space = space;
    this.updateOrientation();
  }

  /**
   * updateOrientation()
   *
   * Updates manipulator orientation based on transform space.
   */
  private updateOrientation(): void {
    if (this.settings.space === TransformSpace.Local && this.targets.length === 1) {
      // Orient to target's local coordinate system
      const target = this.targets[0].object;
      this.quaternion.copy(target.quaternion);
    } else {
      // Reset to world space orientation
      this.quaternion.set(0, 0, 0, 1);
    }
  }

  /**
   * updatePosition()
   *
   * Updates manipulator position and orientation.
   */
  protected updatePosition(): void {
    super.updatePosition();
    this.updateOrientation();
  }

  /**
   * getRotationAngle()
   *
   * Returns current rotation angle for display.
   */
  public getRotationAngle(): number {
    return this.currentAngle * (180 / Math.PI); // Convert to degrees
  }

  /**
   * getTransformType()
   *
   * Returns the transform type for this manipulator.
   */
  protected getTransformType(): TransformType {
    return TransformType.Rotation;
  }
}
