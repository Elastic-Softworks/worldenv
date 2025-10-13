/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - React Renderer Entry Point
 *
 * Initializes the React-based editor UI.
 * Bootstraps the application with providers and routing.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from './components/EditorApp';
import { ThemeProvider } from './context/ThemeContext';
import { EditorStateProvider } from './context/EditorStateContext';
import { initializeComponentSystem } from './core/components';
import './styles/main.css';

/**
 * initializeRenderer()
 *
 * Initializes the React application.
 * Sets up providers and mounts the root component.
 */
async function initializeRenderer(): Promise<void> {
  try {
    console.log('[RENDERER] Initializing React application...');

    // Initialize component system first
    initializeComponentSystem();

    const container = document.getElementById('root');

    if (!container) {
      throw new Error('Root container not found');
    }

    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <EditorStateProvider>
            <EditorApp />
          </EditorStateProvider>
        </ThemeProvider>
      </React.StrictMode>
    );

    console.log('[RENDERER] React application initialized successfully');
  } catch (error) {
    console.error('[RENDERER] Failed to initialize React application:', error);

    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #1e1e1e;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
        ">
          <div>
            <h1>WORLDEDIT Initialization Error</h1>
            <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
          </div>
        </div>
      `;
    }
  }
}

/**
 * Error boundaries for unhandled errors
 */
window.addEventListener('error', (event) => {
  console.error('[RENDERER] Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[RENDERER] Unhandled promise rejection:', event.reason);
});

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRenderer);
} else {
  initializeRenderer();
}
