/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Main Editor Application Component
 *
 * Root component that provides the main editor shell.
 * Manages layout and renders core panels when project is open.
 */

import React from 'react';
import { useEditorState } from '../context/EditorStateContext';
import { useTheme } from '../context/ThemeContext';
import { EditorShell } from './EditorShell';
import { WelcomeScreen } from './WelcomeScreen';

/**
 * EditorApp component
 *
 * Main application component that handles routing between
 * welcome screen and editor shell based on project state.
 */
export function EditorApp(): JSX.Element {
  const { state } = useEditorState();
  const { theme } = useTheme();

  if (!state.initialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: theme.colors.background.primary,
          color: theme.colors.foreground.primary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, marginBottom: theme.spacing.md, fontSize: '24px' }}>
            WORLDEDIT
          </h1>
          <p style={{ margin: 0, color: theme.colors.foreground.secondary }}>
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  if (!state.project.isOpen) {
    return <WelcomeScreen />;
  }

  return <EditorShell />;
}
