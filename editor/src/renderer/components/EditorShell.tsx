/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Editor Shell Component
 *
 * Main editor shell that provides the dockable panel layout.
 * Manages the overall editor workspace and panel organization.
 */

import React, { useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useEditorState } from '../context/EditorStateContext';
import { useTheme } from '../context/ThemeContext';
import { MenuBar } from './panels/MenuBar';
import { Toolbar } from './panels/Toolbar';
import { StatusBar } from './panels/StatusBar';
import { HierarchyPanel } from './panels/HierarchyPanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { ViewportPanel } from './panels/ViewportPanel';
import { AssetBrowserPanel } from './panels/AssetBrowserPanel';
import { ScriptEditorPanel } from './panels/ScriptEditorPanel';

/**
 * EditorShell component
 *
 * Main editor layout with dockable panels.
 * Provides split pane layout with resizable panels.
 */
export function EditorShell(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();

  /**
   * handleLeftPanelResize()
   *
   * Handles left panel (hierarchy) resize.
   */
  const handleLeftPanelResize = useCallback(
    (size: number) => {
      actions.resizePanel('hierarchy', size);
    },
    [actions]
  );

  /**
   * handleRightPanelResize()
   *
   * Handles right panel (inspector) resize.
   */
  const handleRightPanelResize = useCallback(
    (size: number) => {
      actions.resizePanel('inspector', size);
    },
    [actions]
  );

  /**
   * handleBottomPanelResize()
   *
   * Handles bottom panel (asset browser) resize.
   */
  const handleBottomPanelResize = useCallback(
    (size: number) => {
      actions.resizePanel('assets', size);
    },
    [actions]
  );

  const shellStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.foreground.primary,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const workspaceStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  };

  return (
    <div style={shellStyle}>
      {/* Menu Bar */}
      <MenuBar />

      {/* Toolbar */}
      <Toolbar />

      {/* Main Content Area */}
      <div style={contentStyle}>
        {/* Main Workspace */}
        <div style={workspaceStyle}>
          <Allotment>
            {/* Left Panel - Scene Hierarchy */}
            {state.ui.panels.hierarchy.visible && (
              <Allotment.Pane
                minSize={200}
                maxSize={400}
                preferredSize={state.ui.panels.hierarchy.size}
              >
                <HierarchyPanel />
              </Allotment.Pane>
            )}

            {/* Main Content Area */}
            <Allotment.Pane>
              <Allotment vertical>
                {/* Center Panel - Viewport */}
                <Allotment.Pane>
                  <ViewportPanel />
                </Allotment.Pane>

                {/* Bottom Panel - Asset Browser / Script Editor */}
                {(state.ui.panels.assets.visible || state.ui.panels.script.visible) && (
                  <Allotment.Pane
                    minSize={150}
                    maxSize={500}
                    preferredSize={
                      state.ui.panels.script.visible
                        ? state.ui.panels.script.size
                        : state.ui.panels.assets.size
                    }
                  >
                    <Allotment>
                      {state.ui.panels.assets.visible && (
                        <Allotment.Pane>
                          <AssetBrowserPanel />
                        </Allotment.Pane>
                      )}
                      {state.ui.panels.script.visible && (
                        <Allotment.Pane>
                          <ScriptEditorPanel />
                        </Allotment.Pane>
                      )}
                    </Allotment>
                  </Allotment.Pane>
                )}
              </Allotment>
            </Allotment.Pane>

            {/* Right Panel - Inspector */}
            {state.ui.panels.inspector.visible && (
              <Allotment.Pane
                minSize={250}
                maxSize={500}
                preferredSize={state.ui.panels.inspector.size}
              >
                <InspectorPanel />
              </Allotment.Pane>
            )}
          </Allotment>
        </div>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
}
