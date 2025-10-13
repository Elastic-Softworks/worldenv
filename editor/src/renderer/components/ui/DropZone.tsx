/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Drop Zone Component
 *
 * Drag and drop zone for importing assets into the editor.
 * Provides visual feedback and file validation.
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Supported file types for asset import
 */
const SUPPORTED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.m4a',
  '.gltf',
  '.glb',
  '.obj',
  '.fbx',
  '.dae',
  '.3ds',
  '.ws',
  '.worldsrc',
  '.ts',
  '.js',
  '.scene',
  '.worldscene',
  '.mat',
  '.material',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.json',
  '.xml',
  '.csv',
  '.txt',
  '.glsl',
  '.hlsl',
  '.wgsl',
  '.vert',
  '.frag',
  '.compute'
];

/**
 * DropZone props interface
 */
interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DropZone component
 *
 * Provides drag and drop functionality for file import.
 */
export function DropZone({
  onFilesDropped,
  disabled = false,
  children,
  className,
  style
}: DropZoneProps): JSX.Element {
  const { theme } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  /**
   * validateFile()
   *
   * Checks if file is supported for import.
   */
  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(extension);
  };

  /**
   * handleDragEnter()
   *
   * Handles drag enter event.
   */
  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        return;
      }

      setDragCounter((prev) => prev + 1);

      if (event.dataTransfer.items) {
        const hasFiles = Array.from(event.dataTransfer.items).some((item) => item.kind === 'file');

        if (hasFiles) {
          setIsDragOver(true);
        }
      }
    },
    [disabled]
  );

  /**
   * handleDragLeave()
   *
   * Handles drag leave event.
   */
  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        return;
      }

      setDragCounter((prev) => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragOver(false);
        }
        return newCounter;
      });
    },
    [disabled]
  );

  /**
   * handleDragOver()
   *
   * Handles drag over event.
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        event.dataTransfer.dropEffect = 'none';
        return;
      }

      event.dataTransfer.dropEffect = 'copy';
    },
    [disabled]
  );

  /**
   * handleDrop()
   *
   * Handles file drop event.
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragOver(false);
      setDragCounter(0);

      if (disabled) {
        return;
      }

      const files = Array.from(event.dataTransfer.files);
      const validFiles = files.filter(validateFile);

      if (validFiles.length > 0) {
        onFilesDropped(validFiles);
      }

      if (validFiles.length !== files.length) {
        const invalidCount = files.length - validFiles.length;
        console.warn(`[DROPZONE] ${invalidCount} files were not imported (unsupported format)`);
      }
    },
    [disabled, onFilesDropped]
  );

  /**
   * Component styles
   */
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    border: isDragOver
      ? `2px dashed ${theme.colors.accent.primary}`
      : disabled
        ? `1px solid ${theme.colors.border.secondary}`
        : 'none',
    borderRadius: theme.borderRadius.md,
    backgroundColor: isDragOver ? `${theme.colors.accent.primary}20` : 'transparent',
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'default',
    ...style
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: isDragOver ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.accent.primary}40`,
    borderRadius: theme.borderRadius.md,
    zIndex: 10,
    pointerEvents: 'none'
  };

  const overlayTextStyle: React.CSSProperties = {
    color: theme.colors.accent.primary,
    fontSize: '18px',
    fontWeight: 600,
    textAlign: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.sm,
    boxShadow: theme.shadows.lg
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop overlay */}
      <div style={overlayStyle}>
        <div style={overlayTextStyle}>
          📁 Drop files here to import
          <br />
          <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.8 }}>
            Supported: Images, Audio, Models, Scripts, and more
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * DropZoneIndicator component
 *
 * Visual indicator for drag and drop zones.
 */
interface DropZoneIndicatorProps {
  active?: boolean;
  text?: string;
  icon?: string;
}

export function DropZoneIndicator({
  active = false,
  text = 'Drag files here to import',
  icon = '📁'
}: DropZoneIndicatorProps): JSX.Element {
  const { theme } = useTheme();

  const indicatorStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    border: `2px dashed ${active ? theme.colors.accent.primary : theme.colors.border.secondary}`,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: active
      ? `${theme.colors.accent.primary}10`
      : theme.colors.background.secondary,
    color: active ? theme.colors.accent.primary : theme.colors.foreground.tertiary,
    textAlign: 'center',
    transition: 'all 0.3s ease',
    minHeight: '120px'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: theme.spacing.md,
    opacity: active ? 1 : 0.6
  };

  const textStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    marginBottom: theme.spacing.sm
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.7
  };

  return (
    <div style={indicatorStyle}>
      <div style={iconStyle}>{icon}</div>
      <div style={textStyle}>{text}</div>
      <div style={subtextStyle}>Images • Audio • Models • Scripts • Materials</div>
    </div>
  );
}
