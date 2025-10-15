/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Undo/Redo Hook
 *
 * React hook for undo/redo functionality.
 * Provides state management and command execution for undo/redo operations.
 */

import { useEffect, useState, useCallback } from 'react';
import { UndoRedoManager, ICommand } from '../core/undo';

/**
 * Undo/redo state interface
 */
export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  lastUndoDescription: string | null;
  lastRedoDescription: string | null;
}

/**
 * useUndoRedo hook
 *
 * Provides undo/redo functionality with React state management.
 */
export function useUndoRedo() {
  const [state, setState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
    lastUndoDescription: null,
    lastRedoDescription: null
  });

  const undoRedoManager = UndoRedoManager.getInstance();

  /**
   * updateState()
   *
   * Updates hook state from manager.
   */
  const updateState = useCallback(() => {
    setState({
      canUndo: undoRedoManager.canUndo(),
      canRedo: undoRedoManager.canRedo(),
      undoCount: undoRedoManager.getUndoCount(),
      redoCount: undoRedoManager.getRedoCount(),
      lastUndoDescription: undoRedoManager.getLastUndoDescription(),
      lastRedoDescription: undoRedoManager.getLastRedoDescription()
    });
  }, [undoRedoManager]);

  /**
   * executeCommand()
   *
   * Executes a command and updates state.
   */
  const executeCommand = useCallback(
    (command: ICommand) => {
      undoRedoManager.executeCommand(command);
    },
    [undoRedoManager]
  );

  /**
   * undo()
   *
   * Performs undo operation.
   */
  const undo = useCallback(() => {
    return undoRedoManager.undo();
  }, [undoRedoManager]);

  /**
   * redo()
   *
   * Performs redo operation.
   */
  const redo = useCallback(() => {
    return undoRedoManager.redo();
  }, [undoRedoManager]);

  /**
   * clear()
   *
   * Clears undo/redo history.
   */
  const clear = useCallback(() => {
    undoRedoManager.clear();
  }, [undoRedoManager]);

  /**
   * handleKeyDown()
   *
   * Handles keyboard shortcuts for undo/redo.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
          return true;
        }

        if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
          return true;
        }
      }

      return false;
    },
    [undo, redo]
  );

  /**
   * Setup effect
   */
  useEffect(() => {
    // Initial state update
    updateState();

    // Add listener for state changes
    undoRedoManager.addListener(updateState);

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      undoRedoManager.removeListener(updateState);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateState, handleKeyDown, undoRedoManager]);

  return {
    ...state,
    executeCommand,
    undo,
    redo,
    clear,
    handleKeyDown
  };
}
