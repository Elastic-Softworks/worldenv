/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Vector Input Components
 *
 * Vector2 and Vector3 input components with drag-to-change functionality.
 * Provides intuitive vector editing with individual component controls.
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { DragNumberInput } from './DragNumberInput';
import type { Vector2, Vector3 } from '../../../core/components/Component';

interface Vector2InputProps {
  value: Vector2;
  onChange: (value: Vector2) => void;
  disabled?: boolean;
  step?: number;
  precision?: number;
  min?: number;
  max?: number;
  labels?: [string, string];
}

interface Vector3InputProps {
  value: Vector3;
  onChange: (value: Vector3) => void;
  disabled?: boolean;
  step?: number;
  precision?: number;
  min?: number;
  max?: number;
  labels?: [string, string, string];
}

/**
 * Vector2Input component
 *
 * Two-component vector input with drag support.
 */
export function Vector2Input({
  value,
  onChange,
  disabled = false,
  step = 0.1,
  precision = 3,
  min,
  max,
  labels = ['X', 'Y']
}: Vector2InputProps): JSX.Element {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: theme.colors.foreground.secondary,
    textAlign: 'center',
    marginBottom: '2px'
  };

  const componentContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={containerStyle}>
      <div style={componentContainerStyle}>
        <div style={{ ...labelStyle, color: '#ff6b6b' }}>{labels[0]}</div>
        <DragNumberInput
          value={value.x}
          onChange={(x) => onChange({ ...value, x })}
          disabled={disabled}
          step={step}
          precision={precision}
          min={min}
          max={max}
          style={{
            borderColor: '#ff6b6b22',
            backgroundColor: disabled ? theme.colors.input.background : '#ff6b6b11'
          }}
        />
      </div>
      <div style={componentContainerStyle}>
        <div style={{ ...labelStyle, color: '#51cf66' }}>{labels[1]}</div>
        <DragNumberInput
          value={value.y}
          onChange={(y) => onChange({ ...value, y })}
          disabled={disabled}
          step={step}
          precision={precision}
          min={min}
          max={max}
          style={{
            borderColor: '#51cf6622',
            backgroundColor: disabled ? theme.colors.input.background : '#51cf6611'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Vector3Input component
 *
 * Three-component vector input with drag support.
 */
export function Vector3Input({
  value,
  onChange,
  disabled = false,
  step = 0.1,
  precision = 3,
  min,
  max,
  labels = ['X', 'Y', 'Z']
}: Vector3InputProps): JSX.Element {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: theme.colors.foreground.secondary,
    textAlign: 'center',
    marginBottom: '2px'
  };

  const componentContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={containerStyle}>
      <div style={componentContainerStyle}>
        <div style={{ ...labelStyle, color: '#ff6b6b' }}>{labels[0]}</div>
        <DragNumberInput
          value={value.x}
          onChange={(x) => onChange({ ...value, x })}
          disabled={disabled}
          step={step}
          precision={precision}
          min={min}
          max={max}
          style={{
            borderColor: '#ff6b6b22',
            backgroundColor: disabled ? theme.colors.input.background : '#ff6b6b11'
          }}
        />
      </div>
      <div style={componentContainerStyle}>
        <div style={{ ...labelStyle, color: '#51cf66' }}>{labels[1]}</div>
        <DragNumberInput
          value={value.y}
          onChange={(y) => onChange({ ...value, y })}
          disabled={disabled}
          step={step}
          precision={precision}
          min={min}
          max={max}
          style={{
            borderColor: '#51cf6622',
            backgroundColor: disabled ? theme.colors.input.background : '#51cf6611'
          }}
        />
      </div>
      <div style={componentContainerStyle}>
        <div style={{ ...labelStyle, color: '#4dabf7' }}>{labels[2]}</div>
        <DragNumberInput
          value={value.z}
          onChange={(z) => onChange({ ...value, z })}
          disabled={disabled}
          step={step}
          precision={precision}
          min={min}
          max={max}
          style={{
            borderColor: '#4dabf722',
            backgroundColor: disabled ? theme.colors.input.background : '#4dabf711'
          }}
        />
      </div>
    </div>
  );
}

/**
 * CompactVector2Input component
 *
 * Compact two-component vector input for tight spaces.
 */
export function CompactVector2Input({
  value,
  onChange,
  disabled = false,
  step = 0.1,
  precision = 2
}: Omit<Vector2InputProps, 'labels'>): JSX.Element {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const prefixStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: theme.colors.foreground.tertiary,
    minWidth: '12px',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <span style={{ ...prefixStyle, color: '#ff6b6b' }}>X</span>
      <DragNumberInput
        value={value.x}
        onChange={(x) => onChange({ ...value, x })}
        disabled={disabled}
        step={step}
        precision={precision}
        style={{ flex: 1, minWidth: '60px' }}
      />
      <span style={{ ...prefixStyle, color: '#51cf66' }}>Y</span>
      <DragNumberInput
        value={value.y}
        onChange={(y) => onChange({ ...value, y })}
        disabled={disabled}
        step={step}
        precision={precision}
        style={{ flex: 1, minWidth: '60px' }}
      />
    </div>
  );
}

/**
 * CompactVector3Input component
 *
 * Compact three-component vector input for tight spaces.
 */
export function CompactVector3Input({
  value,
  onChange,
  disabled = false,
  step = 0.1,
  precision = 2
}: Omit<Vector3InputProps, 'labels'>): JSX.Element {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const prefixStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    color: theme.colors.foreground.tertiary,
    minWidth: '12px',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <span style={{ ...prefixStyle, color: '#ff6b6b' }}>X</span>
      <DragNumberInput
        value={value.x}
        onChange={(x) => onChange({ ...value, x })}
        disabled={disabled}
        step={step}
        precision={precision}
        style={{ flex: 1, minWidth: '50px' }}
      />
      <span style={{ ...prefixStyle, color: '#51cf66' }}>Y</span>
      <DragNumberInput
        value={value.y}
        onChange={(y) => onChange({ ...value, y })}
        disabled={disabled}
        step={step}
        precision={precision}
        style={{ flex: 1, minWidth: '50px' }}
      />
      <span style={{ ...prefixStyle, color: '#4dabf7' }}>Z</span>
      <DragNumberInput
        value={value.z}
        onChange={(z) => onChange({ ...value, z })}
        disabled={disabled}
        step={step}
        precision={precision}
        style={{ flex: 1, minWidth: '50px' }}
      />
    </div>
  );
}
