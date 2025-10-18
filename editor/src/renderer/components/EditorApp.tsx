/*
   ===============================================================
   WORLDEDIT MAIN EDITOR APPLICATION COMPONENT
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import React from 'react'; /* REACT FRAMEWORK */
import { useEditorState } from '../context/EditorStateContext'; /* EDITOR STATE MANAGEMENT */
import { useTheme } from '../context/ThemeContext'; /* THEME MANAGEMENT */
import { EditorShell } from './EditorShell'; /* EDITOR SHELL COMPONENT */

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/**
 * EditorApp component
 *
 * Main application component that always renders the editor shell.
 * Individual panels handle no-project states with appropriate overlays.
 * This ensures UI is always visible and accessible.
 */
export function EditorApp(): JSX.Element {
  console.log('[EDITOR APP] Component rendering...');
  const { state } = useEditorState();
  const { theme } = useTheme();

  console.log('[EDITOR APP] State:', { initialized: state.initialized });
  console.log('[EDITOR APP] Theme:', theme);

  /* DEBUG: Log current state */
  console.log('[EDITOR APP] Rendering with state:', {
    initialized: state.initialized,
    projectOpen: state.project.isOpen,
    projectPath: state.project.path
  });

  /* show loading state during initial application setup */

  if (!state.initialized) {
    console.log('[EDITOR APP] Showing initialization screen');
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: theme.colors.background.primary,
          color: theme.colors.foreground.primary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            WORLDEDIT
          </h1>
          <p
            style={{
              margin: 0,
              color: theme.colors.foreground.secondary,
              fontSize: '14px'
            }}
          >
            Initializing editor...
          </p>
        </div>
      </div>
    );
  }

  /* always render the full editor shell */
  /* panels will display appropriate empty states when no project is open */

  console.log('[EDITOR APP] Rendering EditorShell');
  return <EditorShell />;
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
