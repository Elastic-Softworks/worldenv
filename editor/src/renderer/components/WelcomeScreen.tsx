/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Welcome Screen Component
 *
 * Displays welcome screen with project management options.
 * Provides interface for creating and opening projects.
 */

import React, { useState } from 'react';
import { useEditorState } from '../context/EditorStateContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';

/**
 * WelcomeScreen component
 *
 * Welcome screen for project management.
 * Shows when no project is open.
 */
export function WelcomeScreen(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme, toggleTheme, themeType } = useTheme();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isOpeningProject, setIsOpeningProject] = useState(false);

  /**
   * handleNewProject()
   *
   * Handles new project creation workflow.
   */
  const handleNewProject = async (): Promise<void> => {
    try {
      setIsCreatingProject(true);

      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Select Project Directory',
        properties: ['createDirectory']
      });

      if (!dirPath) {
        return;
      }

      const projectName = dirPath.split('/').pop() || 'New Project';

      const project = await window.worldedit.project.create(dirPath, projectName);

      actions.openProject({
        path: dirPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified),
      });
    } catch (error) {
      console.error('[WELCOME] Failed to create project:', error);

      await window.worldedit.dialog.showError(
        'Project Creation Error',
        `Failed to create new project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  /**
   * handleOpenProject()
   *
   * Handles project opening workflow.
   */
  const handleOpenProject = async (): Promise<void> => {
    try {
      setIsOpeningProject(true);

      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Open Project'
      });

      if (!dirPath) {
        return;
      }

      const project = await window.worldedit.project.open(dirPath);

      actions.openProject({
        path: dirPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified),
      });
    } catch (error) {
      console.error('[WELCOME] Failed to open project:', error);

      await window.worldedit.dialog.showError(
        'Project Open Error',
        `Failed to open project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsOpeningProject(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: theme.colors.background.primary,
        color: theme.colors.foreground.primary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.border.primary}`,
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            WORLDEDIT
          </h1>
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.foreground.tertiary,
              backgroundColor: theme.colors.background.tertiary,
              padding: '2px 6px',
              borderRadius: theme.borderRadius.sm,
            }}
          >
            v{state.version}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={toggleTheme}
          title={`Switch to ${themeType === 'dark' ? 'light' : 'dark'} theme`}
        >
          {themeType === 'dark' ? '☀️' : '🌙'}
        </Button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1
            style={{
              margin: 0,
              marginBottom: theme.spacing.lg,
              fontSize: '48px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WORLDEDIT
          </h1>

          <p
            style={{
              margin: 0,
              marginBottom: theme.spacing.xl,
              fontSize: '18px',
              color: theme.colors.foreground.secondary,
              lineHeight: 1.5,
            }}
          >
            Game Development Editor for WORLDENV Engine
          </p>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'center',
              marginBottom: theme.spacing.xl,
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={handleNewProject}
              disabled={isCreatingProject || isOpeningProject}
            >
              {isCreatingProject ? 'Creating...' : 'New Project'}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={handleOpenProject}
              disabled={isCreatingProject || isOpeningProject}
            >
              {isOpeningProject ? 'Opening...' : 'Open Project'}
            </Button>
          </div>

          {/* Phase Information */}
          <div
            style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: theme.spacing.md,
                fontSize: '16px',
                color: theme.colors.accent.primary,
              }}
            >
              Phase 3: UI Framework & Layout
            </h3>

            <p
              style={{
                margin: 0,
                marginBottom: theme.spacing.sm,
                fontSize: '14px',
                color: theme.colors.foreground.secondary,
              }}
            >
              Current implementation features:
            </p>

            <ul
              style={{
                margin: 0,
                paddingLeft: theme.spacing.lg,
                fontSize: '14px',
                color: theme.colors.foreground.secondary,
              }}
            >
              <li>React-based UI framework</li>
              <li>Theme system (dark/light modes)</li>
              <li>Application state management</li>
              <li>Dockable panel architecture</li>
              <li>Project management integration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: theme.spacing.md,
          borderTop: `1px solid ${theme.colors.border.primary}`,
          backgroundColor: theme.colors.background.secondary,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: theme.colors.foreground.tertiary,
          }}
        >
          WORLDEDIT - Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
        </p>
      </div>
    </div>
  );
}
