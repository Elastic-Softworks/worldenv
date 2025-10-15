/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Manipulators Module
 *
 * Export all manipulator classes and types for viewport transform tools.
 * Provides unified interface for importing manipulator functionality.
 */

export {
  BaseManipulator,
  ManipulatorMode,
  ManipulatorAxis,
  TransformSpace,
  type InteractionState,
  type ManipulatorSettings,
  type TransformTarget
} from './BaseManipulator';

export { TranslateManipulator } from './TranslateManipulator';
export { RotateManipulator } from './RotateManipulator';
export { ScaleManipulator } from './ScaleManipulator';

export {
  ManipulatorManager,
  type ManipulatorChangeEvent
} from './ManipulatorManager';
