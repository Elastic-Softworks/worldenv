/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Drag Number Input Component
 *
 * Numeric input with drag-to-change functionality.
 * Supports mouse dragging for continuous value adjustment.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

interface DragNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  dragSensitivity?: number;
}

/**
 * DragNumberInput component
 *
 * Numeric input with drag-to-change functionality.
 */
export function DragNumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.1,
  precision = 3,
  disabled = false,
  placeholder,
  style,
  dragSensitivity = 1.0
}: DragNumberInputProps): JSX.Element {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const dragStartRef = useRef<{ x: number; startValue: number } | null>(null);

  /**
   * clampValue()
   *
   * Clamps value to min/max bounds.
   */
  const clampValue = useCallback(
    (val: number): number => {
      return Math.max(min, Math.min(max, val));
    },
    [min, max]
  );

  /**
   * formatValue()
   *
   * Formats value for display.
   */
  const formatValue = useCallback(
    (val: number): string => {
      return parseFloat(val.toFixed(precision)).toString();
    },
    [precision]
  );

  /**
   * handleMouseDown()
   *
   * Initiates drag operation.
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || isEditing) return;

      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        startValue: value
      };

      document.body.style.cursor = 'ew-resize';
    },
    [disabled, isEditing, value]
  );

  /**
   * handleMouseMove()
   *
   * Handles drag movement.
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || disabled) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaValue = (deltaX * step * dragSensitivity) / 10;
      const newValue = clampValue(dragStartRef.current.startValue + deltaValue);

      onChange(newValue);
    },
    [isDragging, disabled, step, dragSensitivity, clampValue, onChange]
  );

  /**
   * handleMouseUp()
   *
   * Ends drag operation.
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.cursor = '';
    }
  }, [isDragging]);

  /**
   * handleDoubleClick()
   *
   * Enters edit mode on double click.
   */
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;

    setIsEditing(true);
    setEditValue(formatValue(value));

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
  }, [disabled, value, formatValue]);

  /**
   * handleKeyDown()
   *
   * Handles keyboard input during editing.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const numValue = parseFloat(editValue);
        if (!isNaN(numValue)) {
          onChange(clampValue(numValue));
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setEditValue(formatValue(value));
        setIsEditing(false);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onChange(clampValue(value + step));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onChange(clampValue(value - step));
      }
    },
    [editValue, onChange, clampValue, value, formatValue, step]
  );

  /**
   * handleBlur()
   *
   * Exits edit mode on blur.
   */
  const handleBlur = useCallback(() => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      onChange(clampValue(numValue));
    }
    setIsEditing(false);
  }, [editValue, onChange, clampValue]);

  /**
   * handleWheel()
   *
   * Handles mouse wheel for value adjustment.
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled || isEditing) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      onChange(clampValue(value + delta));
    },
    [disabled, isEditing, step, value, clampValue, onChange]
  );

  // Global mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update edit value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(formatValue(value));
    }
  }, [value, isEditing, formatValue]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.input.background,
    border: `1px solid ${isDragging ? theme.colors.accent.primary : theme.colors.input.border}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.input.text,
    fontSize: '12px',
    fontFamily: 'monospace',
    textAlign: 'center',
    cursor: disabled ? 'default' : isEditing ? 'text' : 'ew-resize',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    userSelect: isEditing ? 'text' : 'none',
    ...style
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={containerStyle}>
      <input
        ref={inputRef}
        type={isEditing ? 'text' : 'text'}
        value={isEditing ? editValue : formatValue(value)}
        onChange={(e) => {
          if (isEditing) {
            setEditValue(e.target.value);
          }
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onWheel={handleWheel}
        disabled={disabled}
        placeholder={placeholder}
        style={inputStyle}
        readOnly={!isEditing}
      />

      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            fontSize: '10px',
            color: theme.colors.accent.primary,
            backgroundColor: theme.colors.background.primary,
            padding: '2px 4px',
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.accent.primary}`,
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {formatValue(value)}
        </div>
      )}
    </div>
  );
}
