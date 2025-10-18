/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Engine Status Component
 *
 * Displays the current engine status with appropriate styling and animations.
 * Shows initialization progress, error states, and health information.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { EngineStatus as EngineStatusEnum, EngineState } from '../../../shared/types/EngineTypes';

interface EngineStatusProps {
  engineState: EngineState;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * EngineStatus component
 *
 * Visual indicator of engine status with color-coded display
 * and optional detailed information.
 */
export function EngineStatus({
  engineState,
  compact = false,
  showDetails = false
}: EngineStatusProps): JSX.Element {
  const { theme } = useTheme();

  /**
   * getStatusColor()
   *
   * Returns appropriate color for current engine status.
   */
  const getStatusColor = (): string => {
    switch (engineState.status) {
      case EngineStatusEnum.READY:
        return theme.colors.accent.success;
      case EngineStatusEnum.INITIALIZING:
        return theme.colors.accent.warning;
      case EngineStatusEnum.ERROR:
        return theme.colors.accent.danger;
      case EngineStatusEnum.DISPOSING:
        return theme.colors.foreground.tertiary;
      case EngineStatusEnum.UNINITIALIZED:
      default:
        return theme.colors.foreground.secondary;
    }
  };

  /**
   * getStatusText()
   *
   * Returns display text for current engine status.
   */
  const getStatusText = (): string => {
    switch (engineState.status) {
      case EngineStatusEnum.READY:
        return 'Engine: Ready';
      case EngineStatusEnum.INITIALIZING:
        return engineState.initializationProgress !== undefined
          ? `Engine: Initializing (${Math.round(engineState.initializationProgress)}%)`
          : 'Engine: Initializing';
      case EngineStatusEnum.ERROR:
        return 'Engine: Error';
      case EngineStatusEnum.DISPOSING:
        return 'Engine: Shutting Down';
      case EngineStatusEnum.UNINITIALIZED:
      default:
        return 'Engine: Not Ready';
    }
  };

  /**
   * getStatusIcon()
   *
   * Returns appropriate icon for current engine status.
   */
  const getStatusIcon = (): string => {
    switch (engineState.status) {
      case EngineStatusEnum.READY:
        return '●';
      case EngineStatusEnum.INITIALIZING:
        return '◐';
      case EngineStatusEnum.ERROR:
        return '⬢';
      case EngineStatusEnum.DISPOSING:
        return '◯';
      case EngineStatusEnum.UNINITIALIZED:
      default:
        return '○';
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    fontSize: compact ? '11px' : '12px',
    color: getStatusColor(),
    fontFamily: 'monospace'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: compact ? '10px' : '12px',
    animation:
      engineState.status === EngineStatusEnum.INITIALIZING
        ? 'pulse 1.5s ease-in-out infinite'
        : 'none'
  };

  const textStyle: React.CSSProperties = {
    whiteSpace: 'nowrap'
  };

  const detailsStyle: React.CSSProperties = {
    fontSize: '10px',
    color: theme.colors.foreground.tertiary,
    marginLeft: theme.spacing.sm
  };

  const progressBarStyle: React.CSSProperties = {
    width: '60px',
    height: '3px',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: '2px',
    overflow: 'hidden',
    marginLeft: theme.spacing.xs
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: getStatusColor(),
    width: `${engineState.initializationProgress || 0}%`,
    transition: 'width 0.3s ease'
  };

  const errorTooltipStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: theme.colors.background.tertiary,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    fontSize: '10px',
    color: theme.colors.foreground.primary,
    zIndex: 1000,
    whiteSpace: 'pre-wrap',
    maxWidth: '300px'
  };

  return (
    <div style={containerStyle}>
      {/* STATUS ICON */}
      <span style={iconStyle}>{getStatusIcon()}</span>

      {/* STATUS TEXT */}
      <span style={textStyle}>{getStatusText()}</span>

      {/* INITIALIZATION PROGRESS BAR */}
      {engineState.status === EngineStatusEnum.INITIALIZING &&
        engineState.initializationProgress !== undefined && (
          <div style={progressBarStyle}>
            <div style={progressFillStyle} />
          </div>
        )}

      {/* DETAILED STATUS INFO */}
      {showDetails && engineState.status === EngineStatusEnum.READY && (
        <span style={detailsStyle}>
          {engineState.isPlayMode ? (engineState.isPaused ? 'PAUSED' : 'PLAYING') : 'EDIT'}
        </span>
      )}

      {/* ERROR MESSAGE TOOLTIP */}
      {engineState.status === EngineStatusEnum.ERROR && engineState.errorMessage && (
        <div style={errorTooltipStyle} title={engineState.errorMessage}>
          {engineState.errorMessage}
        </div>
      )}

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * EngineStatusBadge component
 *
 * Compact badge version for use in toolbars and status bars.
 */
export function EngineStatusBadge({ engineState }: { engineState: EngineState }): JSX.Element {
  return <EngineStatus engineState={engineState} compact={true} />;
}

/**
 * EngineStatusDetailed component
 *
 * Detailed version for use in panels and dialogs.
 */
export function EngineStatusDetailed({ engineState }: { engineState: EngineState }): JSX.Element {
  return <EngineStatus engineState={engineState} showDetails={true} />;
}
