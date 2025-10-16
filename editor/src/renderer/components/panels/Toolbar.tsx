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

import React, { useState, useEffect } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { EngineInterface } from '../../engine/EngineInterface';

/**
 * Toolbar component
 *
 * Horizontal toolbar with editor tools and controls.
 */
export function Toolbar(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();

  /* PLAY MODE STATE */
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
      engineInterface.removeEventListener('playModeStarted', handlePlayModeStarted);
      engineInterface.removeEventListener('playModeStopped', handlePlayModeStopped);
      engineInterface.removeEventListener('playModePaused', handlePlayModePaused);
      engineInterface.removeEventListener('playModeResumed', handlePlayModeResumed);
      engineInterface.removeEventListener('error', handleEngineError);
    };
  }, []);

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
    active = false,
    disabled = false,
    onClick
  }: {
    icon: string;
    title: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }): JSX.Element => (
    <button
      style={active ? activeIconButtonStyle : iconButtonStyle}
      title={title}
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

  return (
    <div style={toolbarStyle}>
      {/* File Operations */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          handleSaveProject().catch(console.error);
        }}
        disabled={!state.project.isOpen || !state.project.isModified}
        title="Save Project (Ctrl+S)"
        icon="Save"
      >
        Save
      </Button>

      <div style={separatorStyle} />

      {/* Edit Operations */}
      <IconButton
        icon="↶"
        title={`Undo (Ctrl+Z)${state.undo.canUndo ? '' : ' - Nothing to undo'}`}
        disabled={!state.undo.canUndo}
        onClick={actions.undo}
      />
      <IconButton
        icon="↷"
        title={`Redo (Ctrl+Y)${state.undo.canRedo ? '' : ' - Nothing to redo'}`}
        disabled={!state.undo.canRedo}
        onClick={actions.redo}
      />

      <div style={separatorStyle} />

      {/* Transform Tools */}
      <IconButton icon="↖" title="Select Tool (Q)" active={true} />
      <IconButton icon="⌘" title="Move Tool (W)" disabled={true} />
      <IconButton icon="↻" title="Rotate Tool (E)" disabled={true} />
      <IconButton icon="⤢" title="Scale Tool (R)" disabled={true} />

      <div style={separatorStyle} />

      {/* Viewport Controls */}
      <IconButton
        icon="2D"
        title="2D View"
        active={state.ui.activeViewportMode === '2d'}
        onClick={() => actions.setViewportMode('2d')}
      />
      <IconButton
        icon="3D"
        title="3D View"
        active={state.ui.activeViewportMode === '3d'}
        onClick={() => actions.setViewportMode('3d')}
      />

      <div style={separatorStyle} />

      {/* Play Mode Controls */}
      <Button
        variant={isPlayMode ? 'danger' : 'primary'}
        size="sm"
        onClick={() => {
          handlePlayMode().catch(console.error);
        }}
        disabled={!state.project.isOpen || !isEngineReady}
        title={isPlayMode ? 'Stop Play Mode (F5)' : 'Start Play Mode (F5)'}
      >
        {isPlayMode ? 'Stop' : 'Play'}
      </Button>

      {isPlayMode && (
        <IconButton
          icon={isPaused ? 'Resume' : 'Pause'}
          title={isPaused ? 'Resume (F6)' : 'Pause (F6)'}
          onClick={handlePauseMode}
        />
      )}

      <div style={separatorStyle} />

      {/* View Options */}
      <IconButton
        icon="⊞"
        title="Toggle Grid (Ctrl+G)"
        active={state.ui.showGrid}
        onClick={() => actions.toggleGrid(!state.ui.showGrid)}
      />
      <IconButton
        icon="⌘"
        title="Toggle Gizmos"
        active={state.ui.showGizmos}
        onClick={() => actions.toggleGizmos(!state.ui.showGizmos)}
      />
      <IconButton
        icon="⊡"
        title="Snap to Grid"
        active={state.ui.snapToGrid}
        onClick={() => actions.toggleSnapToGrid(!state.ui.snapToGrid)}
      />

      <div style={{ flex: 1 }} />

      {/* Right Side Info */}
      {state.project.isOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          {/* Engine Status */}
          {!isEngineReady && (
            <span style={{ fontSize: '12px', color: theme.colors.accent.warning }}>
              Engine: Not Ready
            </span>
          )}
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
