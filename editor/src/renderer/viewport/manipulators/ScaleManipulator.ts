/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Scale Manipulator
 *
 * Scale manipulator with box handles for X, Y, Z axes.
 * Supports drag-to-scale, uniform scaling, and proportional constraints.
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
 * ScaleManipulator class
 *
 * Box-based manipulator for scaling objects along world or local axes.
 * Provides uniform and non-uniform scaling with visual feedback.
 */
export class ScaleManipulator extends BaseManipulator {
  private startScale: THREE.Vector3;
  private startDistance: number;
  private uniformScale: boolean;
  private startMouse: THREE.Vector2;

  constructor() {
    super(ManipulatorMode.Scale);

    this.startScale = new THREE.Vector3(1, 1, 1);
    this.startDistance = 0;
    this.uniformScale = false;
    this.startMouse = new THREE.Vector2();
  }

  /**
   * createHandles()
   *
   * Creates box handles for X, Y, Z axes and center handle.
   */
  protected createHandles(): void {
    // X-axis handle (red box)
    const xHandle = this.createBoxHandle(ManipulatorAxis.X);
    xHandle.position.set(1.0, 0, 0);
    this.handles.set(ManipulatorAxis.X, xHandle);
    this.add(xHandle);

    // Y-axis handle (green box)
    const yHandle = this.createBoxHandle(ManipulatorAxis.Y);
    yHandle.position.set(0, 1.0, 0);
    this.handles.set(ManipulatorAxis.Y, yHandle);
    this.add(yHandle);

    // Z-axis handle (blue box)
    const zHandle = this.createBoxHandle(ManipulatorAxis.Z);
    zHandle.position.set(0, 0, 1.0);
    this.handles.set(ManipulatorAxis.Z, zHandle);
    this.add(zHandle);

    // XY plane handle (yellow box)
    const xyHandle = this.createBoxHandle(ManipulatorAxis.XY);
    xyHandle.position.set(0.7, 0.7, 0);
    this.handles.set(ManipulatorAxis.XY, xyHandle);
    this.add(xyHandle);

    // XZ plane handle (magenta box)
    const xzHandle = this.createBoxHandle(ManipulatorAxis.XZ);
    xzHandle.position.set(0.7, 0, 0.7);
    this.handles.set(ManipulatorAxis.XZ, xzHandle);
    this.add(xzHandle);

    // YZ plane handle (cyan box)
    const yzHandle = this.createBoxHandle(ManipulatorAxis.YZ);
    yzHandle.position.set(0, 0.7, 0.7);
    this.handles.set(ManipulatorAxis.YZ, yzHandle);
    this.add(yzHandle);

    // Center handle for uniform scaling (white cube)
    const centerHandle = this.createCenterHandle();
    this.handles.set(ManipulatorAxis.XYZ, centerHandle);
    this.add(centerHandle);

    // Create connecting lines
    this.createConnectingLines();
  }

  /**
   * createBoxHandle()
   *
   * Creates box geometry for axis handle.
   */
  private createBoxHandle(axis: ManipulatorAxis): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = this.materials.get(axis)!;
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  }

  /**
   * createCenterHandle()
   *
   * Creates center handle for uniform scaling.
   */
  private createCenterHandle(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: this.settings.opacity
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * createConnectingLines()
   *
   * Creates lines connecting center to handles.
   */
  private createConnectingLines(): void {
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array([
      // X axis line
      0, 0, 0, 0.9, 0, 0,
      // Y axis line
      0, 0, 0, 0, 0.9, 0,
      // Z axis line
      0, 0, 0, 0, 0, 0.9
    ]);

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    // X axis line
    const xLineMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: this.settings.opacity * 0.5
    });
    const xLine = new THREE.Line(lineGeometry.clone(), xLineMaterial);
    xLine.geometry.setDrawRange(0, 2);
    this.add(xLine);

    // Y axis line
    const yLineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: this.settings.opacity * 0.5
    });
    const yLine = new THREE.Line(lineGeometry.clone(), yLineMaterial);
    yLine.geometry.setDrawRange(2, 2);
    this.add(yLine);

    // Z axis line
    const zLineMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: this.settings.opacity * 0.5
    });
    const zLine = new THREE.Line(lineGeometry.clone(), zLineMaterial);
    zLine.geometry.setDrawRange(4, 2);
    this.add(zLine);
  }

  /**
   * calculateDelta()
   *
   * Calculates scale delta from mouse movement.
   */
  protected calculateDelta(): THREE.Vector3 {
    if (!this.camera || !this.interaction.activeAxis) {
      return new THREE.Vector3(1, 1, 1);
    }

    const axis = this.interaction.activeAxis;
    const scale = new THREE.Vector3(1, 1, 1);

    if (axis === ManipulatorAxis.XYZ) {
      // Uniform scaling based on distance from center
      const scaleFactor = this.calculateUniformScale();
      scale.setScalar(scaleFactor);
    } else {
      // Non-uniform scaling
      const scaleFactor = this.calculateAxisScale(axis);

      switch (axis) {
        case ManipulatorAxis.X:
          scale.set(scaleFactor, 1, 1);
          break;

        case ManipulatorAxis.Y:
          scale.set(1, scaleFactor, 1);
          break;

        case ManipulatorAxis.Z:
          scale.set(1, 1, scaleFactor);
          break;

        case ManipulatorAxis.XY:
          scale.set(scaleFactor, scaleFactor, 1);
          break;

        case ManipulatorAxis.XZ:
          scale.set(scaleFactor, 1, scaleFactor);
          break;

        case ManipulatorAxis.YZ:
          scale.set(1, scaleFactor, scaleFactor);
          break;
      }
    }

    // Ensure minimum scale
    scale.x = Math.max(0.01, scale.x);
    scale.y = Math.max(0.01, scale.y);
    scale.z = Math.max(0.01, scale.z);

    return scale;
  }

  /**
   * calculateUniformScale()
   *
   * Calculates uniform scale factor from mouse distance.
   */
  private calculateUniformScale(): number {
    if (!this.camera) {
      return 1.0;
    }

    // Calculate distance from mouse to manipulator center in screen space
    const manipulatorScreenPos = new THREE.Vector3();
    manipulatorScreenPos.copy(this.position);
    manipulatorScreenPos.project(this.camera);

    const mouseScreenPos = new THREE.Vector2(this.mouse.x, this.mouse.y);
    const manipulatorScreenPos2D = new THREE.Vector2(
      manipulatorScreenPos.x,
      manipulatorScreenPos.y
    );

    const currentDistance = mouseScreenPos.distanceTo(manipulatorScreenPos2D);
    const deltaDistance = currentDistance - this.startDistance;

    // Convert distance to scale factor
    const scaleFactor = 1.0 + deltaDistance * 2.0;

    return Math.max(0.01, scaleFactor);
  }

  /**
   * calculateAxisScale()
   *
   * Calculates axis-constrained scale factor.
   */
  private calculateAxisScale(axis: ManipulatorAxis): number {
    if (!this.camera) {
      return 1.0;
    }

    // Project axis direction to screen space
    const axisDirection = this.getAxisDirection(axis);
    const worldDirection = axisDirection.clone();

    if (this.settings.space === TransformSpace.Local && this.targets.length === 1) {
      worldDirection.transformDirection(this.targets[0].object.matrixWorld);
    }

    // Convert to screen space direction
    const screenCenter = new THREE.Vector3();
    screenCenter.copy(this.position);
    screenCenter.project(this.camera);

    const screenEnd = new THREE.Vector3();
    screenEnd.copy(this.position).add(worldDirection);
    screenEnd.project(this.camera);

    const screenDirection = new THREE.Vector2(
      screenEnd.x - screenCenter.x,
      screenEnd.y - screenCenter.y
    ).normalize();

    // Calculate mouse movement along axis
    const mouseStart = new THREE.Vector2(this.startMouse.x, this.startMouse.y);
    const mouseCurrent = new THREE.Vector2(this.mouse.x, this.mouse.y);
    const mouseMovement = mouseCurrent.clone().sub(mouseStart);

    const projectedMovement = mouseMovement.dot(screenDirection);
    const scaleFactor = 1.0 + projectedMovement * 2.0;

    return Math.max(0.01, scaleFactor);
  }

  /**
   * getAxisDirection()
   *
   * Returns direction vector for axis.
   */
  private getAxisDirection(axis: ManipulatorAxis): THREE.Vector3 {
    const direction = new THREE.Vector3();

    switch (axis) {
      case ManipulatorAxis.X:
        direction.set(1, 0, 0);
        break;

      case ManipulatorAxis.Y:
        direction.set(0, 1, 0);
        break;

      case ManipulatorAxis.Z:
        direction.set(0, 0, 1);
        break;

      case ManipulatorAxis.XY:
        direction.set(1, 1, 0).normalize();
        break;

      case ManipulatorAxis.XZ:
        direction.set(1, 0, 1).normalize();
        break;

      case ManipulatorAxis.YZ:
        direction.set(0, 1, 1).normalize();
        break;
    }

    return direction;
  }

  /**
   * updateTransform()
   *
   * Applies scale delta to target objects.
   */
  protected updateTransform(axis: ManipulatorAxis, delta: THREE.Vector3): void {
    this.targets.forEach((target) => {
      const newScale = target.initialTransform.scale.clone();
      newScale.multiply(delta);

      target.object.scale.copy(newScale);
    });
  }

  /**
   * startInteraction()
   *
   * Begins scaling interaction.
   */
  protected startInteraction(axis: ManipulatorAxis): void {
    super.startInteraction(axis);

    this.uniformScale = axis === ManipulatorAxis.XYZ;
    this.startMouse.copy(this.mouse);

    if (this.uniformScale) {
      // Calculate initial distance for uniform scaling
      const manipulatorScreenPos = new THREE.Vector3();
      manipulatorScreenPos.copy(this.position);
      manipulatorScreenPos.project(this.camera!);

      const mouseScreenPos = new THREE.Vector2(this.mouse.x, this.mouse.y);
      const manipulatorScreenPos2D = new THREE.Vector2(
        manipulatorScreenPos.x,
        manipulatorScreenPos.y
      );

      this.startDistance = mouseScreenPos.distanceTo(manipulatorScreenPos2D);
    }

    // Store initial scales
    this.targets.forEach((target) => {
      target.initialTransform.scale.copy(target.object.scale);
    });
  }

  /**
   * applySnap()
   *
   * Applies scale snapping to delta value.
   */
  protected applySnap(delta: THREE.Vector3): void {
    const snapValue = this.settings.snapValue;

    delta.x = Math.round(delta.x / snapValue) * snapValue;
    delta.y = Math.round(delta.y / snapValue) * snapValue;
    delta.z = Math.round(delta.z / snapValue) * snapValue;
  }

  /**
   * setUniformScaling()
   *
   * Enables or disables uniform scaling constraint.
   */
  public setUniformScaling(uniform: boolean): void {
    this.uniformScale = uniform;
  }

  /**
   * isUniformScaling()
   *
   * Returns true if uniform scaling is enabled.
   */
  public isUniformScaling(): boolean {
    return this.uniformScale;
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
   * getScaleFactor()
   *
   * Returns current scale factor for display.
   */
  public getScaleFactor(): THREE.Vector3 {
    if (this.targets.length === 0) {
      return new THREE.Vector3(1, 1, 1);
    }

    return this.targets[0].object.scale.clone();
  }

  /**
   * getTransformType()
   *
   * Returns the transform type for this manipulator.
   */
  protected getTransformType(): TransformType {
    return TransformType.Scale;
  }
}
