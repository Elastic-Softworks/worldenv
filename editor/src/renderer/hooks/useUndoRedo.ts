/*
   ===============================================================
   WORLDEDIT UNDO/REDO HOOK
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

import { useEffect, useState, useCallback } from 'react'; /* REACT HOOKS */
import { UndoRedoManager, ICommand } from '../core/undo'; /* UNDO SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         UndoRedoState
	       ---
	       state interface for undo/redo operations that tracks
	       the current state of the command history stack.
	       provides information needed by UI components to
	       enable/disable undo/redo buttons and display
	       operation descriptions.

*/

export interface UndoRedoState {
  canUndo: boolean /* whether undo operation is available */;
  canRedo: boolean /* whether redo operation is available */;
  undoCount: number /* number of operations in undo stack */;
  redoCount: number /* number of operations in redo stack */;
  lastUndoDescription: string | null /* description of last undoable operation */;
  lastRedoDescription: string | null /* description of last redoable operation */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         useUndoRedo()
	       ---
	       react hook that provides comprehensive undo/redo
	       functionality with state management and command
	       execution. integrates with the editor's command
	       pattern system to provide reversible operations.

	       the hook manages the undo/redo stack state and
	       provides functions for executing, undoing, and
	       redoing commands. it automatically updates when
	       the command history changes.

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

        if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
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
