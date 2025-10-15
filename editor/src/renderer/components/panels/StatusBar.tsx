/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Status Bar Component
 *
 * Bottom status bar displaying application and project status.
 * Shows current state, selection info, and system status.
 */

import React, { useState, useEffect } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * StatusBar component
 *
 * Bottom status bar with system information and current state.
 */
export function StatusBar(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme, themeType, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [memoryUsage, setMemoryUsage] = useState<string>('');

  /**
   * Update time and system info
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());

      // Mock memory usage for demonstration
      if ((performance as any).memory) {
        const used = Math.round(((performance as any).memory.usedJSHeapSize / 1048576) * 100) / 100;
        setMemoryUsage(`${used} MB`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * formatTime()
   *
   * Formats time for display.
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * getProjectStatus()
   *
   * Returns current project status text.
   */
  const getProjectStatus = (): string => {
    if (!state.project.isOpen) {
      return 'No project';
    }

    if (state.project.isModified) {
      return 'Modified';
    }

    return 'Saved';
  };

  /**
   * getSelectionStatus()
   *
   * Returns current selection status text.
   */
  const getSelectionStatus = (): string => {
    const count = state.selectedEntities.length;
    if (count === 0) {
      return 'Nothing selected';
    } else if (count === 1) {
      return '1 object selected';
    } else {
      return `${count} objects selected`;
    }
  };

  const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '24px',
    backgroundColor: theme.colors.background.secondary,
    borderTop: `1px solid ${theme.colors.border.primary}`,
    padding: `0 ${theme.spacing.sm}`,
    fontSize: '12px',
    color: theme.colors.foreground.secondary,
    gap: theme.spacing.md
  };

  const statusItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs
  };

  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '16px',
    backgroundColor: theme.colors.border.primary,
    opacity: 0.5
  };

  const indicatorStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  };

  const clickableStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: `2px ${theme.spacing.xs}`,
    borderRadius: theme.borderRadius.sm,
    transition: 'background-color 0.1s ease'
  };

  return (
    <div style={statusBarStyle}>
      {/* Project Status */}
      <div style={statusItemStyle}>
        <div
          style={{
            ...indicatorStyle,
            backgroundColor: state.project.isOpen
              ? state.project.isModified
                ? theme.colors.accent.warning
                : theme.colors.accent.success
              : theme.colors.foreground.tertiary
          }}
        />
        <span>{getProjectStatus()}</span>
      </div>

      {state.project.isOpen && (
        <>
          <div style={separatorStyle} />

          {/* Project Name */}
          <div style={statusItemStyle}>
            <span>Project: {state.project.name}</span>
          </div>

          {state.project.lastSaved && (
            <>
              <div style={separatorStyle} />

              {/* Last Saved */}
              <div style={statusItemStyle}>
                <span>Saved {state.project.lastSaved.toLocaleTimeString()}</span>
              </div>
            </>
          )}
        </>
      )}

      <div style={separatorStyle} />

      {/* Selection Status */}
      <div style={statusItemStyle}>
        <span>{getSelectionStatus()}</span>
      </div>

      <div style={separatorStyle} />

      {/* Viewport Mode */}
      <div
        style={{ ...statusItemStyle, ...clickableStyle }}
        onClick={() => actions.setViewportMode(state.ui.activeViewportMode === '3d' ? '2d' : '3d')}
        title={`Switch to ${state.ui.activeViewportMode === '3d' ? '2D' : '3D'} view`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>🎥 {state.ui.activeViewportMode.toUpperCase()}</span>
      </div>

      {/* View Options */}
      {(state.ui.showGrid || state.ui.showGizmos || state.ui.snapToGrid) && (
        <>
          <div style={separatorStyle} />
          <div style={statusItemStyle}>
            {state.ui.showGrid && <span title="Grid enabled">⊞</span>}
            {state.ui.showGizmos && <span title="Gizmos enabled">⌘</span>}
            {state.ui.snapToGrid && <span title="Snap to grid enabled">⊡</span>}
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* System Info */}
      {memoryUsage && (
        <>
          <div style={statusItemStyle}>
            <span>🧠 {memoryUsage}</span>
          </div>
          <div style={separatorStyle} />
        </>
      )}

      {/* Theme */}
      <div
        style={{ ...statusItemStyle, ...clickableStyle }}
        onClick={toggleTheme}
        title={`Switch to ${themeType === 'dark' ? 'light' : 'dark'} theme`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>{themeType}</span>
      </div>

      <div style={separatorStyle} />

      {/* Version */}
      <div style={statusItemStyle}>
        <span>v{state.version}</span>
      </div>

      <div style={separatorStyle} />

      {/* Time */}
      <div style={statusItemStyle}>
        <span>🕐 {formatTime(currentTime)}</span>
      </div>
    </div>
  );
}
