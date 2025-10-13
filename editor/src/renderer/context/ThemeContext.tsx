/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Theme Context
 *
 * Provides theme management for the editor application.
 * Handles dark/light theme switching and theme persistence.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Theme types
 */
export type ThemeType = 'dark' | 'light';

export interface Theme {
  type: ThemeType;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    foreground: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      primary: string;
      secondary: string;
    };
    accent: {
      primary: string;
      secondary: string;
      danger: string;
      warning: string;
      success: string;
    };
    panel: {
      background: string;
      border: string;
      header: string;
    };
    button: {
      background: string;
      backgroundHover: string;
      backgroundActive: string;
      text: string;
    };
    input: {
      background: string;
      border: string;
      text: string;
      placeholder: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Dark theme definition
 */
const darkTheme: Theme = {
  type: 'dark',
  colors: {
    background: {
      primary: '#1e1e1e',
      secondary: '#2d2d2d',
      tertiary: '#3c3c3c',
    },
    foreground: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#999999',
    },
    border: {
      primary: '#404040',
      secondary: '#555555',
    },
    accent: {
      primary: '#007acc',
      secondary: '#005a9e',
      danger: '#f85149',
      warning: '#d29922',
      success: '#3fb950',
    },
    panel: {
      background: '#252526',
      border: '#3c3c3c',
      header: '#2d2d2d',
    },
    button: {
      background: '#0e639c',
      backgroundHover: '#1177bb',
      backgroundActive: '#005a9e',
      text: '#ffffff',
    },
    input: {
      background: '#3c3c3c',
      border: '#555555',
      text: '#ffffff',
      placeholder: '#999999',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
};

/**
 * Light theme definition
 */
const lightTheme: Theme = {
  type: 'light',
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8f8f8',
      tertiary: '#f0f0f0',
    },
    foreground: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: {
      primary: '#d0d0d0',
      secondary: '#c0c0c0',
    },
    accent: {
      primary: '#007acc',
      secondary: '#005a9e',
      danger: '#d13438',
      warning: '#bf8803',
      success: '#28a745',
    },
    panel: {
      background: '#f8f8f8',
      border: '#d0d0d0',
      header: '#e8e8e8',
    },
    button: {
      background: '#0e639c',
      backgroundHover: '#1177bb',
      backgroundActive: '#005a9e',
      text: '#ffffff',
    },
    input: {
      background: '#ffffff',
      border: '#d0d0d0',
      text: '#333333',
      placeholder: '#999999',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Theme context interface
 */
interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component
 *
 * Provides theme context to child components.
 * Handles theme switching and persistence.
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [themeType, setThemeType] = useState<ThemeType>('dark');

  /**
   * Load saved theme on mount
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('worldedit-theme') as ThemeType;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeType(savedTheme);
    }
  }, []);

  /**
   * Apply theme to document root
   */
  useEffect(() => {
    const theme = themeType === 'dark' ? darkTheme : lightTheme;
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-bg-${key}`, value);
    });

    Object.entries(theme.colors.foreground).forEach(([key, value]) => {
      root.style.setProperty(`--color-fg-${key}`, value);
    });

    Object.entries(theme.colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--color-border-${key}`, value);
    });

    Object.entries(theme.colors.accent).forEach(([key, value]) => {
      root.style.setProperty(`--color-accent-${key}`, value);
    });

    Object.entries(theme.colors.panel).forEach(([key, value]) => {
      root.style.setProperty(`--color-panel-${key}`, value);
    });

    Object.entries(theme.colors.button).forEach(([key, value]) => {
      root.style.setProperty(`--color-button-${key}`, value);
    });

    Object.entries(theme.colors.input).forEach(([key, value]) => {
      root.style.setProperty(`--color-input-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Set theme type class
    root.className = `theme-${themeType}`;
  }, [themeType]);

  /**
   * setTheme()
   *
   * Sets the theme and persists to localStorage.
   */
  const setTheme = (newTheme: ThemeType): void => {
    setThemeType(newTheme);
    localStorage.setItem('worldedit-theme', newTheme);
  };

  /**
   * toggleTheme()
   *
   * Toggles between dark and light themes.
   */
  const toggleTheme = (): void => {
    const newTheme = themeType === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const currentTheme = themeType === 'dark' ? darkTheme : lightTheme;

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    themeType,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme hook
 *
 * Hook to access theme context.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * withTheme HOC
 *
 * Higher-order component to inject theme props.
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
): React.ComponentType<P> {
  return function ThemedComponent(props: P) {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
}
