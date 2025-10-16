/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Viewport Toolbar Component
 *
 * Toolbar for viewport controls including camera presets, view settings,
 * transform manipulators, and viewport mode switching.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CameraPreset } from '../../viewport/EditorCamera';
import { ManipulatorMode, TransformSpace } from '../../viewport/manipulators';

export interface ViewportToolbarProps {
  mode: '2d' | '3d';
  showGrid: boolean;
  showGizmos: boolean;
  showAxes: boolean;
  snapToGrid: boolean;
  manipulatorMode: ManipulatorMode;
  transformSpace: TransformSpace;
  onModeToggle: () => void;
  onCameraPreset: (preset: CameraPreset) => void;
  onCameraReset: () => void;
  onToggleGrid: () => void;
  onToggleGizmos: () => void;
  onToggleAxes: () => void;
  onToggleSnap: () => void;
  onManipulatorModeChange: (mode: ManipulatorMode) => void;
  onTransformSpaceToggle: () => void;
}

/**
 * ViewportToolbar component
 *
 * Provides controls for viewport settings, camera management, and transform tools.
 * Adapts interface based on current viewport mode (2D/3D).
 */
export function ViewportToolbar({
  mode,
  showGrid,
  showGizmos,
  showAxes,
  snapToGrid,
  manipulatorMode,
  transformSpace,
  onModeToggle,
  onCameraPreset,
  onCameraReset,
  onToggleGrid,
  onToggleGizmos,
  onToggleAxes,
  onToggleSnap,
  onManipulatorModeChange,
  onTransformSpaceToggle
}: ViewportToolbarProps): JSX.Element {
  const { theme } = useTheme();

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.panel.header,
    borderBottom: `1px solid ${theme.colors.panel.border}`,
    flexWrap: 'wrap',
    minHeight: '36px'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs
  };

  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    backgroundColor: theme.colors.border.primary,
    margin: `0 ${theme.spacing.xs}`
  };

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.foreground.primary,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: '32px',
    height: '28px',
    justifyContent: 'center'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
    color: theme.colors.foreground.primary
  };

  const iconButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    minWidth: '28px',
    padding: theme.spacing.xs
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: theme.colors.foreground.secondary,
    fontWeight: 500,
    marginRight: theme.spacing.xs
  };

  const cameraPresets: { preset: CameraPreset; label: string; icon: string }[] = [
    { preset: 'top', label: 'Top', icon: '↓' },
    { preset: 'front', label: 'Front', icon: '←' },
    { preset: 'right', label: 'Right', icon: '↗' },
    { preset: 'perspective', label: 'Persp', icon: '◆' }
  ];

  const manipulatorModes: {
    mode: ManipulatorMode;
    label: string;
    icon: string;
    shortcut: string;
  }[] = [
    { mode: ManipulatorMode.Translate, label: 'Move', icon: '↔', shortcut: 'W' },
    { mode: ManipulatorMode.Rotate, label: 'Rotate', icon: '↻', shortcut: 'E' },
    { mode: ManipulatorMode.Scale, label: 'Scale', icon: '▣', shortcut: 'R' }
  ];

  return (
    <div style={toolbarStyle}>
      {/* VIEW MODE TOGGLE */}
      <div style={buttonGroupStyle}>
        <span style={labelStyle}>Mode:</span>
        <button
          style={mode === '2d' ? activeButtonStyle : buttonStyle}
          onClick={onModeToggle}
          title="Switch to 2D view"
          disabled={mode === '2d'}
        >
          2D
        </button>
        <button
          style={mode === '3d' ? activeButtonStyle : buttonStyle}
          onClick={onModeToggle}
          title="Switch to 3D view"
          disabled={mode === '3d'}
        >
          3D
        </button>
      </div>

      <div style={separatorStyle} />

      {/* CAMERA CONTROLS */}
      {mode === '3d' && (
        <>
          <div style={buttonGroupStyle}>
            <span style={labelStyle}>Camera:</span>
            {cameraPresets.map(({ preset, label, icon }) => (
              <button
                key={preset}
                style={buttonStyle}
                onClick={() => onCameraPreset(preset)}
                title={`Set ${label} view`}
              >
                <span style={{ fontSize: '10px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div style={separatorStyle} />
        </>
      )}

      {/* CAMERA RESET */}
      <button
        style={iconButtonStyle}
        onClick={onCameraReset}
        title="Reset camera to default position"
      >
        Focus
      </button>

      <div style={separatorStyle} />

      {/* TRANSFORM TOOLS */}
      <div style={buttonGroupStyle}>
        <span style={labelStyle}>Tools:</span>
        {manipulatorModes.map(({ mode: toolMode, label, icon, shortcut }) => (
          <button
            key={toolMode}
            style={manipulatorMode === toolMode ? activeButtonStyle : buttonStyle}
            onClick={() => onManipulatorModeChange(toolMode)}
            title={`${label} tool (${shortcut})`}
          >
            <span style={{ fontSize: '10px' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={separatorStyle} />

      {/* TRANSFORM SPACE */}
      <div style={buttonGroupStyle}>
        <span style={labelStyle}>Space:</span>
        <button
          style={buttonStyle}
          onClick={onTransformSpaceToggle}
          title={`Transform space: ${transformSpace} (Tab to toggle)`}
        >
          {transformSpace === TransformSpace.World ? 'World' : 'Local'}
        </button>
      </div>

      <div style={separatorStyle} />

      {/* DISPLAY SETTINGS */}
      <div style={buttonGroupStyle}>
        <span style={labelStyle}>Display:</span>

        <button
          style={showGrid ? activeButtonStyle : buttonStyle}
          onClick={onToggleGrid}
          title="Toggle grid visibility"
        >
          <span style={{ fontSize: '10px' }}>⊞</span>
          Grid
        </button>

        {mode === '3d' && (
          <button
            style={showAxes ? activeButtonStyle : buttonStyle}
            onClick={onToggleAxes}
            title="Toggle axes visibility"
          >
            <span style={{ fontSize: '10px' }}>⊕</span>
            Axes
          </button>
        )}

        <button
          style={showGizmos ? activeButtonStyle : buttonStyle}
          onClick={onToggleGizmos}
          title="Toggle gizmos visibility"
        >
          <span style={{ fontSize: '10px' }}>Tools</span>
          Gizmos
        </button>
      </div>

      <div style={separatorStyle} />

      {/* SNAP SETTINGS */}
      <div style={buttonGroupStyle}>
        <span style={labelStyle}>Snap:</span>
        <button
          style={snapToGrid ? activeButtonStyle : buttonStyle}
          onClick={onToggleSnap}
          title="Toggle snap to grid (G)"
        >
          <span style={{ fontSize: '10px' }}>⊞</span>
          Grid
        </button>
      </div>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* VIEWPORT STATS */}
      <div
        style={{
          fontSize: '11px',
          color: theme.colors.foreground.tertiary,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}
      >
        <span>{mode.toUpperCase()} View</span>
        <span>•</span>
        <span>
          {manipulatorMode === ManipulatorMode.Translate && 'Translate'}
          {manipulatorMode === ManipulatorMode.Rotate && 'Rotate'}
          {manipulatorMode === ManipulatorMode.Scale && 'Scale'}
        </span>
        <span>•</span>
        <span>{transformSpace}</span>
      </div>
    </div>
  );
}
