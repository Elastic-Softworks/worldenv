/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Welcome Screen Component
 *
 * Initial screen displayed when no project is open.
 * Provides options to create or open projects.
 */

import React, { useState } from 'react';
import { useEditorState } from '../context/EditorStateContext';
import { useTheme } from '../context/ThemeContext';
import { ProjectData } from '../../shared/types';
import { Button } from './ui/Button';
import { NewProjectDialog } from './dialogs/NewProjectDialog';
import { RecentProjectsDialog } from './dialogs/RecentProjectsDialog';

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
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showRecentProjectsDialog, setShowRecentProjectsDialog] = useState(false);

  /**
   * handleNewProject()
   *
   * Shows new project dialog.
   */
  const handleNewProject = (): void => {
    setShowNewProjectDialog(true);
  };

  /**
   * handleCreateProject()
   *
   * Handles project creation from wizard.
   */
  const handleCreateProject = async (config: {
    name: string;
    location: string;
    template: any;
  }): Promise<void> => {
    try {
      setIsCreatingProject(true);

      const projectPath = `${config.location}/${config.name}`;

      const project = (await window.worldedit.project.create(
        projectPath,
        config.name
      )) as ProjectData;

      actions.openProject({
        path: projectPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified)
      });
    } catch (error) {
      console.error('[WELCOME] Failed to create project:', error);
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  /**
   * handleOpenProject()
   *
   * Handles project opening from path.
   */
  const handleOpenProject = async (projectPath: string): Promise<void> => {
    try {
      setIsOpeningProject(true);

      const project = (await window.worldedit.project.open(projectPath)) as ProjectData;

      actions.openProject({
        path: projectPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified)
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

  /**
   * handleBrowseProject()
   *
   * Shows file browser for project selection.
   */
  const handleBrowseProject = async (): Promise<void> => {
    try {
      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Open Project'
      });

      if (dirPath) {
        await handleOpenProject(dirPath);
      }
    } catch (error) {
      console.error('[WELCOME] Failed to browse for project:', error);
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
          backgroundColor: theme.colors.background.secondary
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              fontFamily:
                'Hothouse, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            WoRLDenV
          </h1>
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.foreground.tertiary,
              backgroundColor: theme.colors.background.tertiary,
              padding: '2px 6px',
              borderRadius: theme.borderRadius.sm
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
          {themeType === 'dark' ? 'Light' : 'Dark'}
        </Button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1
            style={{
              margin: 0,
              marginBottom: theme.spacing.lg,
              fontSize: 'clamp(2.5rem, 8vw, 4rem)',
              fontWeight: 700,
              fontFamily:
                'Hothouse, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: theme.colors.foreground.primary
            }}
          >
            WoRLDenV
          </h1>

          <p
            style={{
              margin: 0,
              marginBottom: theme.spacing.xl,
              fontSize: 'clamp(1rem, 3vw, 1.125rem)',
              color: theme.colors.foreground.secondary,
              lineHeight: 1.5
            }}
          >
            Game Development Editor for WORLDENV Engine
          </p>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'center',
              marginBottom: theme.spacing.xl
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
              onClick={() => setShowRecentProjectsDialog(true)}
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
              textAlign: 'left'
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: theme.spacing.md,
                fontSize: '16px',
                color: theme.colors.accent.primary
              }}
            >
              Project Management
            </h3>

            <p
              style={{
                margin: 0,
                marginBottom: theme.spacing.sm,
                fontSize: '14px',
                color: theme.colors.foreground.secondary
              }}
            >
              Current implementation features:
            </p>

            <ul
              style={{
                margin: 0,
                paddingLeft: theme.spacing.lg,
                fontSize: '14px',
                color: theme.colors.foreground.secondary
              }}
            >
              <li>Project creation wizard with templates</li>
              <li>Recent projects management</li>
              <li>Enhanced project structure with prefabs</li>
              <li>Project settings configuration</li>
              <li>Script editor integration</li>
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
          textAlign: 'center'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: theme.colors.foreground.tertiary
          }}
        >
          WoRLDenV - Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
        </p>
      </div>

      {/* Project Creation Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Recent Projects Dialog */}
      <RecentProjectsDialog
        isOpen={showRecentProjectsDialog}
        onClose={() => setShowRecentProjectsDialog(false)}
        onOpenProject={handleOpenProject}
        onBrowseProject={handleBrowseProject}
      />
    </div>
  );
}
