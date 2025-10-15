/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Transform Utilities
 *
 * Utilities for transform operations with undo/redo support.
 * Provides helpers for creating undoable transform commands.
 */

import * as THREE from 'three';
import {
  UndoRedoManager,
  TransformPositionCommand,
  TransformRotationCommand,
  TransformScaleCommand
} from '../core/undo';

/**
 * Transform operation type
 */
export enum TransformType {
  Position = 'position',
  Rotation = 'rotation',
  Scale = 'scale'
}

/**
 * Transform data interface
 */
export interface TransformData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

/**
 * Transform operation state
 */
export interface TransformOperationState {
  targets: THREE.Object3D[];
  initialTransforms: TransformData[];
  isActive: boolean;
  type: TransformType;
}

/**
 * TransformUtils class
 *
 * Utility functions for transform operations with undo/redo support.
 */
export class TransformUtils {
  private static operationState: TransformOperationState | null = null;
  private static undoRedoManager = UndoRedoManager.getInstance();

  /**
   * beginTransformOperation()
   *
   * Begins a transform operation and stores initial state.
   */
  public static beginTransformOperation(
    targets: THREE.Object3D[],
    type: TransformType
  ): void {
    if (this.operationState?.isActive) {
      this.endTransformOperation();
    }

    const initialTransforms = targets.map((target) => ({
      position: target.position.clone(),
      rotation: target.rotation.clone(),
      scale: target.scale.clone()
    }));

    this.operationState = {
      targets: [...targets],
      initialTransforms,
      isActive: true,
      type
    };
  }

  /**
   * endTransformOperation()
   *
   * Ends transform operation and creates undo command.
   */
  public static endTransformOperation(): void {
    if (!this.operationState?.isActive) {
      return;
    }

    const { targets, initialTransforms, type } = this.operationState;

    // Check if transforms actually changed
    const hasChanges = targets.some((target, index) => {
      const initial = initialTransforms[index];
      const current = {
        position: target.position,
        rotation: target.rotation,
        scale: target.scale
      };

      switch (type) {
        case TransformType.Position:
          return !initial.position.equals(current.position);
        case TransformType.Rotation:
          return !initial.rotation.equals(current.rotation);
        case TransformType.Scale:
          return !initial.scale.equals(current.scale);
        default:
          return false;
      }
    });

    if (hasChanges) {
      this.createUndoCommand(targets, initialTransforms, type);
    }

    this.operationState = null;
  }

  /**
   * cancelTransformOperation()
   *
   * Cancels transform operation and restores initial state.
   */
  public static cancelTransformOperation(): void {
    if (!this.operationState?.isActive) {
      return;
    }

    const { targets, initialTransforms } = this.operationState;

    // Restore initial transforms
    targets.forEach((target, index) => {
      const initial = initialTransforms[index];
      target.position.copy(initial.position);
      target.rotation.copy(initial.rotation);
      target.scale.copy(initial.scale);
    });

    this.operationState = null;
  }

  /**
   * setPosition()
   *
   * Sets position with undo/redo support.
   */
  public static setPosition(targets: THREE.Object3D[], position: THREE.Vector3): void {
    const oldPositions = targets.map((target) => target.position.clone());
    const newPositions = targets.map(() => position.clone());

    // Apply new positions
    targets.forEach((target) => {
      target.position.copy(position);
    });

    // Create undo command
    const command = new TransformPositionCommand(targets, oldPositions, newPositions);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * setRotation()
   *
   * Sets rotation with undo/redo support.
   */
  public static setRotation(targets: THREE.Object3D[], rotation: THREE.Euler): void {
    const oldRotations = targets.map((target) => target.rotation.clone());
    const newRotations = targets.map(() => rotation.clone());

    // Apply new rotations
    targets.forEach((target) => {
      target.rotation.copy(rotation);
    });

    // Create undo command
    const command = new TransformRotationCommand(targets, oldRotations, newRotations);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * setScale()
   *
   * Sets scale with undo/redo support.
   */
  public static setScale(targets: THREE.Object3D[], scale: THREE.Vector3): void {
    const oldScales = targets.map((target) => target.scale.clone());
    const newScales = targets.map(() => scale.clone());

    // Apply new scales
    targets.forEach((target) => {
      target.scale.copy(scale);
    });

    // Create undo command
    const command = new TransformScaleCommand(targets, oldScales, newScales);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * translateBy()
   *
   * Translates objects by delta with undo/redo support.
   */
  public static translateBy(targets: THREE.Object3D[], delta: THREE.Vector3): void {
    const oldPositions = targets.map((target) => target.position.clone());
    const newPositions = targets.map((target) => target.position.clone().add(delta));

    // Apply translation
    targets.forEach((target) => {
      target.position.add(delta);
    });

    // Create undo command
    const command = new TransformPositionCommand(targets, oldPositions, newPositions);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * rotateBy()
   *
   * Rotates objects by delta with undo/redo support.
   */
  public static rotateBy(targets: THREE.Object3D[], delta: THREE.Euler): void {
    const oldRotations = targets.map((target) => target.rotation.clone());

    // Apply rotation
    targets.forEach((target) => {
      target.rotation.x += delta.x;
      target.rotation.y += delta.y;
      target.rotation.z += delta.z;
    });

    const newRotations = targets.map((target) => target.rotation.clone());

    // Create undo command
    const command = new TransformRotationCommand(targets, oldRotations, newRotations);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * scaleBy()
   *
   * Scales objects by factor with undo/redo support.
   */
  public static scaleBy(targets: THREE.Object3D[], factor: THREE.Vector3): void {
    const oldScales = targets.map((target) => target.scale.clone());

    // Apply scaling
    targets.forEach((target) => {
      target.scale.multiply(factor);
    });

    const newScales = targets.map((target) => target.scale.clone());

    // Create undo command
    const command = new TransformScaleCommand(targets, oldScales, newScales);
    this.undoRedoManager.executeCommand(command);
  }

  /**
   * getOperationState()
   *
   * Returns current operation state.
   */
  public static getOperationState(): TransformOperationState | null {
    return this.operationState;
  }

  /**
   * isOperationActive()
   *
   * Returns true if transform operation is active.
   */
  public static isOperationActive(): boolean {
    return this.operationState?.isActive || false;
  }

  /**
   * createUndoCommand()
   *
   * Creates appropriate undo command for transform type.
   */
  private static createUndoCommand(
    targets: THREE.Object3D[],
    initialTransforms: TransformData[],
    type: TransformType
  ): void {
    switch (type) {
      case TransformType.Position: {
        const oldPositions = initialTransforms.map((t) => t.position);
        const newPositions = targets.map((target) => target.position.clone());
        const command = new TransformPositionCommand(targets, oldPositions, newPositions);
        this.undoRedoManager.executeCommand(command);
        break;
      }

      case TransformType.Rotation: {
        const oldRotations = initialTransforms.map((t) => t.rotation);
        const newRotations = targets.map((target) => target.rotation.clone());
        const command = new TransformRotationCommand(targets, oldRotations, newRotations);
        this.undoRedoManager.executeCommand(command);
        break;
      }

      case TransformType.Scale: {
        const oldScales = initialTransforms.map((t) => t.scale);
        const newScales = targets.map((target) => target.scale.clone());
        const command = new TransformScaleCommand(targets, oldScales, newScales);
        this.undoRedoManager.executeCommand(command);
        break;
      }
    }
  }

  /**
   * snapToGrid()
   *
   * Snaps vector to grid.
   */
  public static snapToGrid(vector: THREE.Vector3, gridSize: number): THREE.Vector3 {
    return new THREE.Vector3(
      Math.round(vector.x / gridSize) * gridSize,
      Math.round(vector.y / gridSize) * gridSize,
      Math.round(vector.z / gridSize) * gridSize
    );
  }

  /**
   * cloneTransform()
   *
   * Clones transform data.
   */
  public static cloneTransform(object: THREE.Object3D): TransformData {
    return {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone()
    };
  }

  /**
   * applyTransform()
   *
   * Applies transform data to object.
   */
  public static applyTransform(object: THREE.Object3D, transform: TransformData): void {
    object.position.copy(transform.position);
    object.rotation.copy(transform.rotation);
    object.scale.copy(transform.scale);
  }

  /**
   * compareTransforms()
   *
   * Compares two transform data objects.
   */
  public static compareTransforms(a: TransformData, b: TransformData): boolean {
    return (
      a.position.equals(b.position) &&
      a.rotation.equals(b.rotation) &&
      a.scale.equals(b.scale)
    );
  }
}
