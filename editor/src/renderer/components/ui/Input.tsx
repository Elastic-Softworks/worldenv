/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        Input Component
        ---
        this component provides a styled input field for forms
        and dialogs. it supports various input types and integrates
        with the theme system for consistent styling across the
        editor interface.

        the component handles common input events and provides
        proper accessibility attributes for screen readers and
        keyboard navigation.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import React from 'react'; /* REACT FRAMEWORK */
import { useTheme } from '../../context/ThemeContext'; /* THEME MANAGEMENT */

/*
	===============================================================
             --- PROPS ---
	===============================================================
*/

/**
 * Input component props interface
 */
interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onChange: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/*
	===============================================================
             --- COMPONENT ---
	===============================================================
*/

/**
 * Input component
 *
 * Styled input field with theme integration and event handling.
 * Provides consistent styling and behavior across the editor.
 */
export function Input({
  type = 'text',
  value,
  placeholder,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  className = '',
  style,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp
}: InputProps): JSX.Element {
  const { theme } = useTheme();

  /**
   * handleInputChange()
   *
   * Handles input value changes and calls onChange prop.
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  /* BASE STYLES */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: '4px',
    backgroundColor: disabled ? theme.colors.background.secondary : theme.colors.background.primary,
    color: disabled ? theme.colors.foreground.tertiary : theme.colors.foreground.primary,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',

    ...style
  };

  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      autoFocus={autoFocus}
      className={`input ${className}`.trim()}
      style={inputStyle}
      onChange={handleInputChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
