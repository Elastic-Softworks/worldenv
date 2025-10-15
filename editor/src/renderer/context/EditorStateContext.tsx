/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Editor State Context
 *
 * Provides global application state management.
 * Handles project state, UI state, and editor configuration.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SceneManager, SceneManagerEvent } from '../core/hierarchy/SceneManager';
import { NodeType } from '../core/hierarchy/Node';
import { UndoRedoManager } from '../core/undo/UndoRedoManager';

/**
 * Project state interface
 */
interface ProjectState {
  isOpen: boolean;
  path: string | null;
  name: string | null;
  version: string | null;
  engineVersion: string | null;
  isModified: boolean;
  lastSaved: Date | null;
}

/**
 * Panel state interface
 */
interface PanelState {
  visible: boolean;
  collapsed: boolean;
  size: number;
}

/**
 * UI state interface
 */
interface UIState {
  panels: {
    hierarchy: PanelState;
    inspector: PanelState;
    assets: PanelState;
    viewport: PanelState;
    script: PanelState;
  };
  activeViewportMode: '2d' | '3d';
  showGrid: boolean;
  showGizmos: boolean;
  snapToGrid: boolean;
}

/**
 * Editor state interface
 */
interface EditorState {
  initialized: boolean;
  version: string;
  project: ProjectState;
  ui: UIState;
  selectedEntities: string[];
  clipboard: any[];
  scene: {
    hasScene: boolean;
    isDirty: boolean;
    nodeCount: number;
  };
  undo: {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
  };
}

/**
 * Initial state
 */
const initialState: EditorState = {
  initialized: false,
  version: '',
  project: {
    isOpen: false,
    path: null,
    name: null,
    version: null,
    engineVersion: null,
    isModified: false,
    lastSaved: null
  },
  ui: {
    panels: {
      hierarchy: { visible: true, collapsed: false, size: 250 },
      inspector: { visible: true, collapsed: false, size: 300 },
      assets: { visible: true, collapsed: false, size: 200 },
      viewport: { visible: true, collapsed: false, size: 600 },
      script: { visible: false, collapsed: false, size: 400 }
    },
    activeViewportMode: '3d',
    showGrid: true,
    showGizmos: true,
    snapToGrid: false
  },
  selectedEntities: [],
  clipboard: [],
  scene: {
    hasScene: false,
    isDirty: false,
    nodeCount: 0
  },
  undo: {
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0
  }
};

/**
 * Action types
 */
type EditorAction =
  | { type: 'INITIALIZE'; payload: { version: string } }
  | { type: 'PROJECT_OPEN'; payload: ProjectState }
  | { type: 'PROJECT_CLOSE' }
  | { type: 'PROJECT_SAVE'; payload: { lastSaved: Date } }
  | { type: 'PROJECT_MODIFY'; payload: { isModified: boolean } }
  | { type: 'PANEL_TOGGLE'; payload: { panel: keyof UIState['panels']; visible: boolean } }
  | { type: 'PANEL_COLLAPSE'; payload: { panel: keyof UIState['panels']; collapsed: boolean } }
  | { type: 'PANEL_RESIZE'; payload: { panel: keyof UIState['panels']; size: number } }
  | { type: 'VIEWPORT_MODE_CHANGE'; payload: { mode: '2d' | '3d' } }
  | { type: 'TOGGLE_GRID'; payload: { show: boolean } }
  | { type: 'TOGGLE_GIZMOS'; payload: { show: boolean } }
  | { type: 'TOGGLE_SNAP_TO_GRID'; payload: { enabled: boolean } }
  | { type: 'SELECT_ENTITIES'; payload: { entityIds: string[] } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'COPY_TO_CLIPBOARD'; payload: { data: any[] } }
  | { type: 'CLEAR_CLIPBOARD' }
  | { type: 'SCENE_UPDATE'; payload: { hasScene: boolean; isDirty: boolean; nodeCount: number } }
  | {
      type: 'UNDO_REDO_UPDATE';
      payload: { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number };
    };

/**
 * Editor state reducer
 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        initialized: true,
        version: action.payload.version
      };

    case 'PROJECT_OPEN':
      return {
        ...state,
        project: {
          ...action.payload,
          isOpen: true
        }
      };

    case 'PROJECT_CLOSE':
      return {
        ...state,
        project: {
          ...initialState.project
        },
        selectedEntities: []
      };

    case 'PROJECT_SAVE':
      return {
        ...state,
        project: {
          ...state.project,
          isModified: false,
          lastSaved: action.payload.lastSaved
        }
      };

    case 'PROJECT_MODIFY':
      return {
        ...state,
        project: {
          ...state.project,
          isModified: action.payload.isModified
        }
      };

    case 'PANEL_TOGGLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [action.payload.panel]: {
              ...state.ui.panels[action.payload.panel],
              visible: action.payload.visible
            }
          }
        }
      };

    case 'PANEL_COLLAPSE':
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [action.payload.panel]: {
              ...state.ui.panels[action.payload.panel],
              collapsed: action.payload.collapsed
            }
          }
        }
      };

    case 'PANEL_RESIZE':
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [action.payload.panel]: {
              ...state.ui.panels[action.payload.panel],
              size: action.payload.size
            }
          }
        }
      };

    case 'VIEWPORT_MODE_CHANGE':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeViewportMode: action.payload.mode
        }
      };

    case 'TOGGLE_GRID':
      return {
        ...state,
        ui: {
          ...state.ui,
          showGrid: action.payload.show
        }
      };

    case 'TOGGLE_GIZMOS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showGizmos: action.payload.show
        }
      };

    case 'TOGGLE_SNAP_TO_GRID':
      return {
        ...state,
        ui: {
          ...state.ui,
          snapToGrid: action.payload.enabled
        }
      };

    case 'SELECT_ENTITIES':
      return {
        ...state,
        selectedEntities: action.payload.entityIds
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedEntities: []
      };

    case 'COPY_TO_CLIPBOARD':
      return {
        ...state,
        clipboard: action.payload.data
      };

    case 'CLEAR_CLIPBOARD':
      return {
        ...state,
        clipboard: []
      };

    case 'SCENE_UPDATE':
      return {
        ...state,
        scene: action.payload
      };

    case 'UNDO_REDO_UPDATE':
      return {
        ...state,
        undo: action.payload
      };

    default:
      return state;
  }
}

/**
 * Editor state context interface
 */
interface EditorStateContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  actions: {
    initialize: (version: string) => void;
    openProject: (project: Omit<ProjectState, 'isOpen'>) => void;
    closeProject: () => void;
    saveProject: () => void;
    setProjectModified: (modified: boolean) => void;
    togglePanel: (panel: keyof UIState['panels'], visible: boolean) => void;
    collapsePanel: (panel: keyof UIState['panels'], collapsed: boolean) => void;
    resizePanel: (panel: keyof UIState['panels'], size: number) => void;
    setViewportMode: (mode: '2d' | '3d') => void;
    toggleGrid: (show: boolean) => void;
    toggleGizmos: (show: boolean) => void;
    toggleSnapToGrid: (enabled: boolean) => void;
    selectEntities: (entityIds: string[]) => void;
    clearSelection: () => void;
    copyToClipboard: (data: any[]) => void;
    clearClipboard: () => void;
    createNewScene: (name?: string) => void;
    createNode: (name: string, type: NodeType, parentId?: string) => void;
    deleteNode: (nodeId: string) => void;
    duplicateNode: (nodeId: string) => void;
    updateSceneState: () => void;
    undo: () => void;
    redo: () => void;
    updateUndoRedoState: () => void;
  };
}

/**
 * Editor state context
 */
const EditorStateContext = createContext<EditorStateContextType | undefined>(undefined);

/**
 * Editor state provider props
 */
interface EditorStateProviderProps {
  children: ReactNode;
}

/**
 * EditorStateProvider component
 *
 * Provides editor state context to child components.
 * Handles state persistence and IPC communication.
 */
export function EditorStateProvider({ children }: EditorStateProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const sceneManager = SceneManager.getInstance();

  /**
   * Update scene state from SceneManager
   */
  const updateSceneState = () => {
    const hasScene = sceneManager.hasScene;
    const isDirty = sceneManager.hasUnsavedChanges();
    const nodeCount = sceneManager.getSceneStats()?.nodeCount || 0;

    dispatch({
      type: 'SCENE_UPDATE',
      payload: { hasScene, isDirty, nodeCount }
    });
  };

  /**
   * Initialize editor on mount
   */
  useEffect(() => {
    async function initializeEditor() {
      try {
        const version = await window.worldedit.app.getVersion();
        dispatch({ type: 'INITIALIZE', payload: { version } });

        // Load persisted UI state
        const savedUIState = localStorage.getItem('worldedit-ui-state');
        if (savedUIState) {
          try {
            const parsedState = JSON.parse(savedUIState);
            if (parsedState.panels) {
              Object.entries(parsedState.panels).forEach(
                ([panelName, panelState]: [string, any]) => {
                  const panel = panelName as keyof UIState['panels'];
                  if (panelState.visible !== undefined) {
                    dispatch({
                      type: 'PANEL_TOGGLE',
                      payload: { panel, visible: panelState.visible }
                    });
                  }
                  if (panelState.collapsed !== undefined) {
                    dispatch({
                      type: 'PANEL_COLLAPSE',
                      payload: { panel, collapsed: panelState.collapsed }
                    });
                  }
                  if (panelState.size !== undefined) {
                    dispatch({ type: 'PANEL_RESIZE', payload: { panel, size: panelState.size } });
                  }
                }
              );
            }
            if (parsedState.activeViewportMode) {
              dispatch({
                type: 'VIEWPORT_MODE_CHANGE',
                payload: { mode: parsedState.activeViewportMode }
              });
            }
            if (parsedState.showGrid !== undefined) {
              dispatch({ type: 'TOGGLE_GRID', payload: { show: parsedState.showGrid } });
            }
            if (parsedState.showGizmos !== undefined) {
              dispatch({ type: 'TOGGLE_GIZMOS', payload: { show: parsedState.showGizmos } });
            }
            if (parsedState.snapToGrid !== undefined) {
              dispatch({
                type: 'TOGGLE_SNAP_TO_GRID',
                payload: { enabled: parsedState.snapToGrid }
              });
            }
          } catch (error) {
            console.warn('[EDITOR_STATE] Failed to parse saved UI state:', error);
          }
        }

        // Initialize undo/redo state
        actions.updateUndoRedoState();

        // Setup undo/redo manager listener
        const undoRedoManager = UndoRedoManager.getInstance();
        undoRedoManager.addListener(() => {
          actions.updateUndoRedoState();
        });
      } catch (error) {
        console.error('[EDITOR_STATE] Failed to initialize:', error);
      }
    }

    initializeEditor();

    // Listen to scene manager events
    const handleSceneEvent = () => {
      updateSceneState();
    };

    sceneManager.addListener(handleSceneEvent);

    // Setup IPC handlers for undo/redo
    const handleUndo = () => {
      actions.undo();
    };

    const handleRedo = () => {
      actions.redo();
    };

    window.worldedit?.on('edit:undo', handleUndo);
    window.worldedit?.on('edit:redo', handleRedo);

    return () => {
      sceneManager.removeListener(handleSceneEvent);
      window.worldedit?.off('edit:undo', handleUndo);
      window.worldedit?.off('edit:redo', handleRedo);
    };
  }, [sceneManager]);

  /**
   * Persist UI state changes
   */
  useEffect(() => {
    if (state.initialized) {
      const uiState = {
        panels: state.ui.panels,
        activeViewportMode: state.ui.activeViewportMode,
        showGrid: state.ui.showGrid,
        showGizmos: state.ui.showGizmos,
        snapToGrid: state.ui.snapToGrid
      };
      localStorage.setItem('worldedit-ui-state', JSON.stringify(uiState));
    }
  }, [state.ui, state.initialized]);

  /**
   * Action creators
   */
  const actions = {
    initialize: (version: string) => {
      dispatch({ type: 'INITIALIZE', payload: { version } });
    },

    openProject: (project: Omit<ProjectState, 'isOpen'>) => {
      dispatch({ type: 'PROJECT_OPEN', payload: { ...project, isOpen: true } });
    },

    closeProject: () => {
      dispatch({ type: 'PROJECT_CLOSE' });
    },

    saveProject: () => {
      dispatch({ type: 'PROJECT_SAVE', payload: { lastSaved: new Date() } });
    },

    setProjectModified: (modified: boolean) => {
      dispatch({ type: 'PROJECT_MODIFY', payload: { isModified: modified } });
    },

    togglePanel: (panel: keyof UIState['panels'], visible: boolean) => {
      dispatch({ type: 'PANEL_TOGGLE', payload: { panel, visible } });
    },

    collapsePanel: (panel: keyof UIState['panels'], collapsed: boolean) => {
      dispatch({ type: 'PANEL_COLLAPSE', payload: { panel, collapsed } });
    },

    resizePanel: (panel: keyof UIState['panels'], size: number) => {
      dispatch({ type: 'PANEL_RESIZE', payload: { panel, size } });
    },

    setViewportMode: (mode: '2d' | '3d') => {
      dispatch({ type: 'VIEWPORT_MODE_CHANGE', payload: { mode } });
    },

    toggleGrid: (show: boolean) => {
      dispatch({ type: 'TOGGLE_GRID', payload: { show } });
    },

    toggleGizmos: (show: boolean) => {
      dispatch({ type: 'TOGGLE_GIZMOS', payload: { show } });
    },

    toggleSnapToGrid: (enabled: boolean) => {
      dispatch({ type: 'TOGGLE_SNAP_TO_GRID', payload: { enabled } });
    },

    selectEntities: (entityIds: string[]) => {
      dispatch({ type: 'SELECT_ENTITIES', payload: { entityIds } });
    },

    clearSelection: () => {
      dispatch({ type: 'CLEAR_SELECTION' });
    },

    copyToClipboard: (data: any[]) => {
      dispatch({ type: 'COPY_TO_CLIPBOARD', payload: { data } });
    },

    clearClipboard: () => {
      dispatch({ type: 'CLEAR_CLIPBOARD' });
    },

    createNewScene: (name?: string) => {
      sceneManager.createNewScene(name);
      updateSceneState();
    },

    createNode: (name: string, type: NodeType, parentId?: string) => {
      const parent = parentId ? sceneManager.getNode(parentId) : null;
      const newNode = sceneManager.createNode(name, type, parent || undefined);
      if (newNode) {
        dispatch({ type: 'SELECT_ENTITIES', payload: { entityIds: [newNode.id] } });
      }
      updateSceneState();
    },

    deleteNode: (nodeId: string) => {
      const node = sceneManager.getNode(nodeId);
      if (node) {
        sceneManager.removeNode(node);
        // Clear selection if deleted node was selected
        const newSelection = state.selectedEntities.filter((id) => id !== nodeId);
        dispatch({ type: 'SELECT_ENTITIES', payload: { entityIds: newSelection } });
      }
      updateSceneState();
    },

    duplicateNode: (nodeId: string) => {
      const node = sceneManager.getNode(nodeId);
      if (node) {
        const duplicated = sceneManager.duplicateNode(node, `${node.name} Copy`);
        if (duplicated) {
          dispatch({ type: 'SELECT_ENTITIES', payload: { entityIds: [duplicated.id] } });
        }
      }
      updateSceneState();
    },

    undo: () => {
      const undoRedoManager = UndoRedoManager.getInstance();
      undoRedoManager.undo();
      actions.updateUndoRedoState();
    },

    redo: () => {
      const undoRedoManager = UndoRedoManager.getInstance();
      undoRedoManager.redo();
      actions.updateUndoRedoState();
    },

    updateUndoRedoState: () => {
      const undoRedoManager = UndoRedoManager.getInstance();
      dispatch({
        type: 'UNDO_REDO_UPDATE',
        payload: {
          canUndo: undoRedoManager.canUndo(),
          canRedo: undoRedoManager.canRedo(),
          undoCount: undoRedoManager.getUndoCount(),
          redoCount: undoRedoManager.getRedoCount()
        }
      });
    },

    updateSceneState
  };

  const contextValue: EditorStateContextType = {
    state,
    dispatch,
    actions
  };

  return <EditorStateContext.Provider value={contextValue}>{children}</EditorStateContext.Provider>;
}

/**
 * useEditorState hook
 *
 * Hook to access editor state context.
 */
export function useEditorState(): EditorStateContextType {
  const context = useContext(EditorStateContext);

  if (context === undefined) {
    throw new Error('useEditorState must be used within an EditorStateProvider');
  }

  return context;
}
