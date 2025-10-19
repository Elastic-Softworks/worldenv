/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Toolbar Component
 *
 * Editor toolbar with common tools and viewport controls.
 * Provides quick access to frequently used functions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { EngineInterface, EngineState } from '../../engine/EngineInterface';
import { EngineStatusBadge } from '../ui/EngineStatus';
import { EngineStatus } from '../../../shared/types/EngineTypes';
import {
  TransformManager,
  TransformMode,
  TransformSpace
} from '../../core/transform/TransformManager';
import { tooltipManager } from '../../core/tooltip';

/**
 * Toolbar component
 *
 * Horizontal toolbar with editor tools and controls.
 */
export function Toolbar(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();

  /* TRANSFORM MANAGER */
  const transformManager = TransformManager.getInstance();
  const [currentTransformMode, setCurrentTransformMode] = useState<TransformMode>(
    TransformMode.SELECT
  );
  const [currentTransformSpace, setCurrentTransformSpace] = useState<TransformSpace>(
    TransformSpace.WORLD
  );

  /* PLAY MODE STATE */
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [engineState, setEngineState] = useState<EngineState>({
    status: EngineStatus.UNINITIALIZED,
    isInitialized: false,
    isRunning: false,
    isPlayMode: false,
    isPaused: false,
    hasErrors: false
  });

  /**
   * handleSaveProject()
   *
   * Handles project saving.
   */
  const handleSaveProject = async (): Promise<void> => {
    try {
      await window.worldedit.project.save();
      actions.saveProject();
    } catch (error) {
      console.error('[TOOLBAR] Failed to save project:', error);
      await window.worldedit.dialog.showError(
        'Save Error',
        `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * Engine interface setup and event handlers
   */
  useEffect(() => {
    const engineInterface = EngineInterface.getInstance();

    const handleEngineReady = (): void => {
      setIsEngineReady(true);
    };

    const handleStateChanged = (_event: string, ...args: unknown[]): void => {
      const state = args[0] as EngineState;
      setEngineState(state);
      setIsEngineReady(state.status === EngineStatus.READY);
    };

    const handlePlayModeStarted = (): void => {
      setIsPlayMode(true);
      setIsPaused(false);
    };

    const handlePlayModeStopped = (): void => {
      setIsPlayMode(false);
      setIsPaused(false);
    };

    const handlePlayModePaused = (): void => {
      setIsPaused(true);
    };

    const handlePlayModeResumed = (): void => {
      setIsPaused(false);
    };

    const handleEngineError = (event: string, ...args: unknown[]): void => {
      const error = args[0] as Error;
      console.error('[TOOLBAR] Engine error:', error);
      setIsEngineReady(false);
      setIsPlayMode(false);
      setIsPaused(false);
    };

    engineInterface.addEventListener('ready', handleEngineReady);
    engineInterface.addEventListener('stateChanged', handleStateChanged);
    engineInterface.addEventListener('playModeStarted', handlePlayModeStarted);
    engineInterface.addEventListener('playModeStopped', handlePlayModeStopped);
    engineInterface.addEventListener('playModePaused', handlePlayModePaused);
    engineInterface.addEventListener('playModeResumed', handlePlayModeResumed);
    engineInterface.addEventListener('error', handleEngineError);

    /* CHECK INITIAL STATE */
    setIsEngineReady(engineInterface.isEngineReady());
    setIsPlayMode(engineInterface.isInPlayMode());
    setIsPaused(engineInterface.isPaused());

    return () => {
      engineInterface.removeEventListener('ready', handleEngineReady);
      engineInterface.removeEventListener('stateChanged', handleStateChanged);
      engineInterface.removeEventListener('playModeStarted', handlePlayModeStarted);
      engineInterface.removeEventListener('playModeStopped', handlePlayModeStopped);
      engineInterface.removeEventListener('playModePaused', handlePlayModePaused);
      engineInterface.removeEventListener('playModeResumed', handlePlayModeResumed);
      engineInterface.removeEventListener('error', handleEngineError);
    };

    /* TRANSFORM STATE LISTENER */
    const handleTransformStateChange = (event: CustomEvent) => {
      const transformState = event.detail;
      setCurrentTransformMode(transformState.mode);
      setCurrentTransformSpace(transformState.space);
    };

    window.addEventListener('transform-state-changed', handleTransformStateChange as EventListener);

    /* INITIALIZE TRANSFORM MANAGER */
    transformManager.setSelectedEntities(state.selectedEntities);

    return () => {
      engineInterface.removeEventListener('ready', handleEngineReady);
      engineInterface.removeEventListener('stateChanged', handleStateChanged);
      engineInterface.removeEventListener('playModeStarted', handlePlayModeStarted);
      engineInterface.removeEventListener('playModeStopped', handlePlayModeStopped);
      engineInterface.removeEventListener('playModePaused', handlePlayModePaused);
      engineInterface.removeEventListener('playModeResumed', handlePlayModeResumed);
      engineInterface.removeEventListener('error', handleEngineError);
      window.removeEventListener(
        'transform-state-changed',
        handleTransformStateChange as EventListener
      );
    };
  }, []);

  /* UPDATE TRANSFORM MANAGER WITH SELECTED ENTITIES */
  useEffect(() => {
    transformManager.setSelectedEntities(state.selectedEntities);
  }, [state.selectedEntities]);

  /**
   * handlePlayMode()
   *
   * Start or stop play mode.
   */
  const handlePlayMode = async (): Promise<void> => {
    try {
      const engineInterface = EngineInterface.getInstance();

      if (isPlayMode) {
        engineInterface.stopPlayMode();
      } else {
        await engineInterface.startPlayMode();
      }
    } catch (error) {
      console.error('[TOOLBAR] Play mode error:', error);
      await window.worldedit.dialog.showError(
        'Play Mode Error',
        `Failed to ${isPlayMode ? 'stop' : 'start'} play mode: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handlePauseMode()
   *
   * Pause or resume play mode.
   */
  const handlePauseMode = (): void => {
    try {
      const engineInterface = EngineInterface.getInstance();

      if (isPaused) {
        engineInterface.resumePlayMode();
      } else {
        engineInterface.pausePlayMode();
      }
    } catch (error) {
      console.error('[TOOLBAR] Pause mode error:', error);
    }
  };

  /**
   * handleSetTransformMode()
   *
   * Changes the active transform tool mode.
   */
  const handleSetTransformMode = (mode: TransformMode): void => {
    transformManager.setTransformMode(mode);
  };

  /**
   * handleToggleTransformSpace()
   *
   * Toggles between world and local transform space.
   */
  const handleToggleTransformSpace = (): void => {
    const newSpace =
      currentTransformSpace === TransformSpace.WORLD ? TransformSpace.LOCAL : TransformSpace.WORLD;
    transformManager.setTransformSpace(newSpace);
  };

  /**
   * handleDuplicateEntities()
   *
   * Duplicates selected entities.
   */
  const handleDuplicateEntities = (): void => {
    if (state.selectedEntities.length > 0) {
      const duplicated = transformManager.duplicateEntities();
      actions.selectEntities(duplicated);
    }
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    backgroundColor: theme.colors.background.secondary,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    padding: `0 ${theme.spacing.md}`,
    gap: theme.spacing.sm
  };

  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: theme.colors.border.primary,
    margin: `0 ${theme.spacing.xs}`
  };

  const iconButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    border: `1px solid transparent`,
    borderRadius: theme.borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.1s ease'
  };

  const activeIconButtonStyle: React.CSSProperties = {
    ...iconButtonStyle,
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
    color: '#ffffff'
  };

  /**
   * IconButton component
   *
   * Toolbar icon button with hover and active states.
   */
  const IconButton = ({
    icon,
    title,
    shortcut,
    active = false,
    disabled = false,
    onClick
  }: {
    icon: string;
    title: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }): JSX.Element => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    /* REGISTER TOOLTIP ON MOUNT */
    useEffect(() => {
      if (buttonRef.current) {
        tooltipManager.register(buttonRef.current, {
          content: title,
          shortcut: shortcut,
          delay: 500
        });
      }

      return () => {
        if (buttonRef.current) {
          tooltipManager.unregister(buttonRef.current);
        }
      };
    }, [title, shortcut]);

    return (
      <button
        ref={buttonRef}
        style={active ? activeIconButtonStyle : iconButtonStyle}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!disabled && !active) {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            e.currentTarget.style.borderColor = theme.colors.border.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        <span style={{ fontSize: '16px', opacity: disabled ? 0.5 : 1 }}>{icon}</span>
      </button>
    );
  };

  return (
    <div style={toolbarStyle}>
      {/* File Operations */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          console.log('[TOOLBAR] Save button clicked');
          handleSaveProject().catch(console.error);
        }}
        disabled={!state.project.isOpen || !state.project.isModified}
      >
        Save
      </Button>

      <div style={separatorStyle} />

      {/* Edit Operations */}
      <IconButton
        icon="↶"
        title="Undo"
        shortcut="Ctrl+Z"
        disabled={!state.undo.canUndo}
        onClick={() => {
          console.log('[TOOLBAR] Undo button clicked');
          actions.undo();
        }}
      />
      <IconButton
        icon="↷"
        title="Redo"
        shortcut="Ctrl+Y"
        disabled={!state.undo.canRedo}
        onClick={() => {
          console.log('[TOOLBAR] Redo button clicked');
          actions.redo();
        }}
      />

      <div style={separatorStyle} />

      {/* Transform Tools */}
      <IconButton
        icon="↖"
        title="Select Tool"
        shortcut="Q"
        active={currentTransformMode === TransformMode.SELECT}
        onClick={() => handleSetTransformMode(TransformMode.SELECT)}
      />
      <IconButton
        icon="⌘"
        title="Move Tool"
        shortcut="W"
        active={currentTransformMode === TransformMode.TRANSLATE}
        onClick={() => handleSetTransformMode(TransformMode.TRANSLATE)}
      />
      <IconButton
        icon="↻"
        title="Rotate Tool"
        shortcut="E"
        active={currentTransformMode === TransformMode.ROTATE}
        onClick={() => handleSetTransformMode(TransformMode.ROTATE)}
      />
      <IconButton
        icon="⤢"
        title="Scale Tool"
        shortcut="R"
        active={currentTransformMode === TransformMode.SCALE}
        onClick={() => handleSetTransformMode(TransformMode.SCALE)}
      />

      <div style={separatorStyle} />

      {/* Transform Space Toggle */}
      <IconButton
        icon={currentTransformSpace === TransformSpace.WORLD ? '🌍' : '📍'}
        title={`Transform Space: ${currentTransformSpace.toUpperCase()}`}
        active={false}
        onClick={handleToggleTransformSpace}
      />

      {/* Duplicate Tool */}
      {/* Duplicate */}
      <IconButton
        icon="⧉"
        title="Duplicate Selected"
        shortcut="Ctrl+D"
        disabled={state.selectedEntities.length === 0}
        onClick={handleDuplicateEntities}
      />

      <div style={separatorStyle} />

      {/* Viewport Controls */}
      <IconButton
        icon="2D"
        title="2D View"
        active={state.ui.activeViewportMode === '2d'}
        onClick={() => {
          console.log('[TOOLBAR] 2D View button clicked');
          actions.setViewportMode('2d');
        }}
      />
      <IconButton
        icon="3D"
        title="3D View"
        active={state.ui.activeViewportMode === '3d'}
        onClick={() => {
          console.log('[TOOLBAR] 3D View button clicked');
          actions.setViewportMode('3d');
        }}
      />

      <div style={separatorStyle} />

      {/* Play Mode Controls */}
      <Button
        variant={isPlayMode ? 'danger' : 'primary'}
        size="sm"
        onClick={() => {
          console.log('[TOOLBAR] Play/Stop button clicked', { isPlayMode, isEngineReady });
          handlePlayMode().catch(console.error);
        }}
        disabled={!state.project.isOpen || !isEngineReady}
      >
        {isPlayMode ? 'Stop' : 'Play'}
      </Button>

      {isPlayMode && (
        <IconButton
          icon={isPaused ? 'Resume' : 'Pause'}
          title={isPaused ? 'Resume' : 'Pause'}
          shortcut="F6"
          onClick={() => {
            console.log('[TOOLBAR] Pause/Resume button clicked', { isPaused });
            handlePauseMode();
          }}
        />
      )}

      <div style={separatorStyle} />

      {/* View Options */}
      <IconButton
        icon="⊞"
        title="Toggle Grid"
        shortcut="Ctrl+G"
        active={state.ui.showGrid}
        onClick={() => {
          console.log('[TOOLBAR] Toggle Grid clicked', { current: state.ui.showGrid });
          actions.toggleGrid(!state.ui.showGrid);
        }}
      />
      <IconButton
        icon="⌘"
        title="Toggle Gizmos"
        active={state.ui.showGizmos}
        onClick={() => {
          console.log('[TOOLBAR] Toggle Gizmos clicked', { current: state.ui.showGizmos });
          actions.toggleGizmos(!state.ui.showGizmos);
        }}
      />
      <IconButton
        icon="⊡"
        title="Snap to Grid"
        active={state.ui.snapToGrid}
        onClick={() => {
          console.log('[TOOLBAR] Snap to Grid clicked', { current: state.ui.snapToGrid });
          actions.toggleSnapToGrid(!state.ui.snapToGrid);
        }}
      />

      <div style={{ flex: 1 }} />

      {/* Right Side Info */}
      {state.project.isOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* Engine Status */}
          <EngineStatusBadge engineState={engineState} />
          {isPlayMode && (
            <span style={{ fontSize: '12px', color: theme.colors.accent.success }}>
              {isPaused ? 'PAUSED' : 'PLAYING'}
            </span>
          )}
          <span style={{ fontSize: '12px', color: theme.colors.foreground.tertiary }}>
            Mode: {state.ui.activeViewportMode.toUpperCase()}
          </span>
          {state.selectedEntities.length > 0 && (
            <span style={{ fontSize: '12px', color: theme.colors.foreground.tertiary }}>
              Selected: {state.selectedEntities.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
