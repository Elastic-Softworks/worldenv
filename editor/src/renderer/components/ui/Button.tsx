/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Button Component
 *
 * Reusable button component with theming support.
 * Provides multiple variants and sizes for consistent UI.
 */

import React, { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Button component props
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Button component
 *
 * Themed button component with variants and sizes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    /**
     * getVariantStyles()
     *
     * Returns style object for button variant.
     */
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: theme.colors.button.background,
            color: theme.colors.button.text,
            border: `1px solid ${theme.colors.button.background}`,
            hover: {
              backgroundColor: theme.colors.button.backgroundHover,
              borderColor: theme.colors.button.backgroundHover
            },
            active: {
              backgroundColor: theme.colors.button.backgroundActive,
              borderColor: theme.colors.button.backgroundActive
            }
          };

        case 'secondary':
          return {
            backgroundColor: 'transparent',
            color: theme.colors.foreground.primary,
            border: `1px solid ${theme.colors.border.primary}`,
            hover: {
              backgroundColor: theme.colors.background.tertiary,
              borderColor: theme.colors.border.secondary
            },
            active: {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.secondary
            }
          };

        case 'danger':
          return {
            backgroundColor: theme.colors.accent.danger,
            color: '#ffffff',
            border: `1px solid ${theme.colors.accent.danger}`,
            hover: {
              backgroundColor: '#e73c3e',
              borderColor: '#e73c3e'
            },
            active: {
              backgroundColor: '#dc2626',
              borderColor: '#dc2626'
            }
          };

        case 'success':
          return {
            backgroundColor: theme.colors.accent.success,
            color: '#ffffff',
            border: `1px solid ${theme.colors.accent.success}`,
            hover: {
              backgroundColor: '#22c55e',
              borderColor: '#22c55e'
            },
            active: {
              backgroundColor: '#16a34a',
              borderColor: '#16a34a'
            }
          };

        case 'warning':
          return {
            backgroundColor: theme.colors.accent.warning,
            color: '#ffffff',
            border: `1px solid ${theme.colors.accent.warning}`,
            hover: {
              backgroundColor: '#eab308',
              borderColor: '#eab308'
            },
            active: {
              backgroundColor: '#ca8a04',
              borderColor: '#ca8a04'
            }
          };

        default:
          return {
            backgroundColor: theme.colors.button.background,
            color: theme.colors.button.text,
            border: `1px solid ${theme.colors.button.background}`,
            hover: {
              backgroundColor: theme.colors.button.backgroundHover,
              borderColor: theme.colors.button.backgroundHover
            },
            active: {
              backgroundColor: theme.colors.button.backgroundActive,
              borderColor: theme.colors.button.backgroundActive
            }
          };
      }
    };

    /**
     * getSizeStyles()
     *
     * Returns style object for button size.
     */
    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            fontSize: '12px',
            minHeight: '28px'
          };

        case 'md':
          return {
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            fontSize: '14px',
            minHeight: '32px'
          };

        case 'lg':
          return {
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            fontSize: '16px',
            minHeight: '40px'
          };

        default:
          return {
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            fontSize: '14px',
            minHeight: '32px'
          };
      }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    const buttonStyle: React.CSSProperties = {
      ...sizeStyles,
      backgroundColor: variantStyles.backgroundColor,
      color: variantStyles.color,
      border: variantStyles.border,
      borderRadius: theme.borderRadius.md,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
      fontWeight: 500,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      textDecoration: 'none',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled || loading ? 0.6 : 1,
      position: 'relative',
      ...style
    };

    /**
     * handleMouseEnter()
     *
     * Handles mouse enter event for hover styles.
     */
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        const target = e.currentTarget;
        target.style.backgroundColor = variantStyles.hover.backgroundColor;
        target.style.borderColor = variantStyles.hover.borderColor;
      }
    };

    /**
     * handleMouseLeave()
     *
     * Handles mouse leave event to reset styles.
     */
    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        const target = e.currentTarget;
        target.style.backgroundColor = variantStyles.backgroundColor;
        target.style.borderColor = variantStyles.border.replace('1px solid ', '');
      }
    };

    /**
     * handleMouseDown()
     *
     * Handles mouse down event for active styles.
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        const target = e.currentTarget;
        target.style.backgroundColor = variantStyles.active.backgroundColor;
        target.style.borderColor = variantStyles.active.borderColor;
      }
    };

    /**
     * handleMouseUp()
     *
     * Handles mouse up event to reset to hover styles.
     */
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        const target = e.currentTarget;
        target.style.backgroundColor = variantStyles.hover.backgroundColor;
        target.style.borderColor = variantStyles.hover.borderColor;
      }
    };

    /**
     * renderContent()
     *
     * Renders button content with optional icon and loading state.
     */
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid currentColor',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }}
            />
            {children && <span>{children}</span>}
          </>
        );
      }

      const iconElement = icon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      );

      if (iconPosition === 'right') {
        return (
          <>
            {children && <span>{children}</span>}
            {iconElement}
          </>
        );
      }

      return (
        <>
          {iconElement}
          {children && <span>{children}</span>}
        </>
      );
    };

    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <button
          ref={ref}
          style={buttonStyle}
          disabled={disabled || loading}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          {...props}
        >
          {renderContent()}
        </button>
      </>
    );
  }
);

Button.displayName = 'Button';
