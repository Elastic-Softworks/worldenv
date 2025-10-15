/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Translate Manipulator
 *
 * Translation manipulator with arrow handles for X, Y, Z axes.
 * Supports drag-to-translate, snapping, and multi-object transformation.
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
 * TranslateManipulator class
 *
 * Arrow-based manipulator for translating objects along world or local axes.
 * Provides visual feedback and precise positioning controls.
 */
export class TranslateManipulator extends BaseManipulator {
  private plane: THREE.Plane;
  private startPosition: THREE.Vector3;
  private startMouse: THREE.Vector2;

  constructor() {
    super(ManipulatorMode.Translate);

    this.plane = new THREE.Plane();
    this.startPosition = new THREE.Vector3();
    this.startMouse = new THREE.Vector2();
  }

  /**
   * createHandles()
   *
   * Creates arrow handles for X, Y, Z axes and plane handles.
   */
  protected createHandles(): void {
    // X-axis handle (red arrow)
    const xHandle = this.createArrowHandle(ManipulatorAxis.X);
    xHandle.rotation.z = -Math.PI / 2;
    this.handles.set(ManipulatorAxis.X, xHandle);
    this.add(xHandle);

    // Y-axis handle (green arrow)
    const yHandle = this.createArrowHandle(ManipulatorAxis.Y);
    this.handles.set(ManipulatorAxis.Y, yHandle);
    this.add(yHandle);

    // Z-axis handle (blue arrow)
    const zHandle = this.createArrowHandle(ManipulatorAxis.Z);
    zHandle.rotation.x = Math.PI / 2;
    this.handles.set(ManipulatorAxis.Z, zHandle);
    this.add(zHandle);

    // XY plane handle (yellow square)
    const xyHandle = this.createPlaneHandle(ManipulatorAxis.XY);
    xyHandle.position.set(0.5, 0.5, 0);
    this.handles.set(ManipulatorAxis.XY, xyHandle);
    this.add(xyHandle);

    // XZ plane handle (magenta square)
    const xzHandle = this.createPlaneHandle(ManipulatorAxis.XZ);
    xzHandle.position.set(0.5, 0, 0.5);
    xzHandle.rotation.x = -Math.PI / 2;
    this.handles.set(ManipulatorAxis.XZ, xzHandle);
    this.add(xzHandle);

    // YZ plane handle (cyan square)
    const yzHandle = this.createPlaneHandle(ManipulatorAxis.YZ);
    yzHandle.position.set(0, 0.5, 0.5);
    yzHandle.rotation.y = Math.PI / 2;
    this.handles.set(ManipulatorAxis.YZ, yzHandle);
    this.add(yzHandle);
  }

  /**
   * createArrowHandle()
   *
   * Creates arrow geometry for axis handle.
   */
  private createArrowHandle(axis: ManipulatorAxis): THREE.Group {
    const group = new THREE.Group();

    // Arrow shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const shaftMaterial = this.materials.get(axis)!;
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 0.4;
    group.add(shaft);

    // Arrow head
    const headGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
    const head = new THREE.Mesh(headGeometry, shaftMaterial);
    head.position.y = 0.9;
    group.add(head);

    return group;
  }

  /**
   * createPlaneHandle()
   *
   * Creates plane geometry for multi-axis handle.
   */
  private createPlaneHandle(axis: ManipulatorAxis): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const material = this.materials.get(axis)!;
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  /**
   * calculateDelta()
   *
   * Calculates translation delta from mouse movement.
   */
  protected calculateDelta(): THREE.Vector3 {
    if (!this.camera || !this.interaction.activeAxis) {
      return new THREE.Vector3();
    }

    const axis = this.interaction.activeAxis;
    const delta = new THREE.Vector3();

    // Set up constraint plane based on active axis
    this.setupConstraintPlane(axis);

    // Cast ray to constraint plane
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(this.plane, intersectPoint)) {
      // Calculate world space delta
      const worldDelta = intersectPoint.clone().sub(this.startPosition);

      // Apply axis constraints
      switch (axis) {
        case ManipulatorAxis.X:
          delta.set(worldDelta.x, 0, 0);
          break;

        case ManipulatorAxis.Y:
          delta.set(0, worldDelta.y, 0);
          break;

        case ManipulatorAxis.Z:
          delta.set(0, 0, worldDelta.z);
          break;

        case ManipulatorAxis.XY:
          delta.set(worldDelta.x, worldDelta.y, 0);
          break;

        case ManipulatorAxis.XZ:
          delta.set(worldDelta.x, 0, worldDelta.z);
          break;

        case ManipulatorAxis.YZ:
          delta.set(0, worldDelta.y, worldDelta.z);
          break;
      }

      // Transform to local space if needed
      if (this.settings.space === TransformSpace.Local && this.targets.length === 1) {
        const target = this.targets[0].object;
        const worldToLocal = new THREE.Matrix4().copy(target.matrixWorld).invert();
        delta.transformDirection(worldToLocal);
      }
    }

    return delta;
  }

  /**
   * setupConstraintPlane()
   *
   * Sets up constraint plane for axis-locked movement.
   */
  private setupConstraintPlane(axis: ManipulatorAxis): void {
    if (!this.camera) {
      return;
    }

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    let normal = new THREE.Vector3();

    switch (axis) {
      case ManipulatorAxis.X:
        // Plane perpendicular to camera, containing X axis
        normal.crossVectors(new THREE.Vector3(1, 0, 0), cameraDirection).normalize();
        normal.cross(new THREE.Vector3(1, 0, 0));
        break;

      case ManipulatorAxis.Y:
        // Plane perpendicular to camera, containing Y axis
        normal.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();
        normal.cross(new THREE.Vector3(0, 1, 0));
        break;

      case ManipulatorAxis.Z:
        // Plane perpendicular to camera, containing Z axis
        normal.crossVectors(new THREE.Vector3(0, 0, 1), cameraDirection).normalize();
        normal.cross(new THREE.Vector3(0, 0, 1));
        break;

      case ManipulatorAxis.XY:
        normal.set(0, 0, 1);
        break;

      case ManipulatorAxis.XZ:
        normal.set(0, 1, 0);
        break;

      case ManipulatorAxis.YZ:
        normal.set(1, 0, 0);
        break;
    }

    this.plane.setFromNormalAndCoplanarPoint(normal, this.position);
  }

  /**
   * updateTransform()
   *
   * Applies translation delta to target objects.
   */
  protected updateTransform(axis: ManipulatorAxis, delta: THREE.Vector3): void {
    this.targets.forEach((target) => {
      const newPosition = target.initialTransform.position.clone().add(delta);
      target.object.position.copy(newPosition);
    });

    // Update manipulator position to follow targets
    this.updatePosition();
  }

  /**
   * startInteraction()
   *
   * Begins translation interaction.
   */
  protected startInteraction(axis: ManipulatorAxis): void {
    super.startInteraction(axis);

    // Store initial intersection point
    this.setupConstraintPlane(axis);
    this.raycaster.setFromCamera(this.mouse, this.camera!);

    if (this.raycaster.ray.intersectPlane(this.plane, this.startPosition)) {
      // Store start position for delta calculation
    } else {
      // Fallback to manipulator center
      this.startPosition.copy(this.position);
    }

    this.startMouse.copy(this.mouse);
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
   * getTransformType()
   *
   * Returns the transform type for this manipulator.
   */
  protected getTransformType(): TransformType {
    return TransformType.Position;
  }
}
