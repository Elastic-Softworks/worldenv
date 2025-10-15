/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Recent Projects Dialog
 *
 * Displays recently opened projects with quick access.
 * Handles invalid/missing projects gracefully.
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

/**
 * Recent project entry
 */
interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
  exists: boolean;
}

/**
 * Dialog props
 */
interface RecentProjectsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (path: string) => Promise<void>;
  onBrowseProject: () => void;
}

/**
 * RecentProjectsDialog component
 *
 * Shows list of recently opened projects.
 * Validates project existence and provides fallback options.
 */
export function RecentProjectsDialog({
  isOpen,
  onClose,
  onOpenProject,
  onBrowseProject
}: RecentProjectsDialogProps): JSX.Element | null {
  const { theme } = useTheme();

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load recent projects when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      loadRecentProjects();
    }
  }, [isOpen]);

  /**
   * Load recent projects from storage
   */
  const loadRecentProjects = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const projects = (await window.worldedit.app.getRecentProjects()) as RecentProject[];

      const validatedProjects = await Promise.all(
        projects.map(async (project: RecentProject) => {
          const exists = await window.worldedit.fs.exists(project.path);
          return { ...project, exists };
        })
      );

      setRecentProjects(
        validatedProjects.sort((a: RecentProject, b: RecentProject) => b.lastOpened - a.lastOpened)
      );
    } catch (err) {
      setError('Failed to load recent projects');
      console.error('[RECENT] Failed to load recent projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle project selection
   */
  const handleSelectProject = async (project: RecentProject): Promise<void> => {
    if (!project.exists) {
      setError('Project no longer exists at this location');
      return;
    }

    try {
      setError(null);
      await onOpenProject(project.path);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open project');
    }
  };

  /**
   * Remove project from recent list
   */
  const handleRemoveProject = async (projectPath: string): Promise<void> => {
    try {
      await window.worldedit.app.removeRecentProject(projectPath);
      setRecentProjects((prev) => prev.filter((p) => p.path !== projectPath));
    } catch (err) {
      console.error('[RECENT] Failed to remove project:', err);
    }
  };

  /**
   * Clear all recent projects
   */
  const handleClearAll = async (): Promise<void> => {
    try {
      await window.worldedit.app.clearRecentProjects();
      setRecentProjects([]);
    } catch (err) {
      console.error('[RECENT] Failed to clear recent projects:', err);
    }
  };

  /**
   * Format last opened date
   */
  const formatLastOpened = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          width: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border.primary}`,
            backgroundColor: theme.colors.background.secondary
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: theme.colors.foreground.primary
            }}
          >
            Recent Projects
          </h2>
          <p
            style={{
              margin: `${theme.spacing.sm} 0 0 0`,
              fontSize: '14px',
              color: theme.colors.foreground.secondary
            }}
          >
            Open a recently used project or browse for a new one
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: theme.spacing.lg
          }}
        >
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.foreground.secondary
              }}
            >
              Loading recent projects...
            </div>
          )}

          {!isLoading && recentProjects.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: theme.spacing.xl,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: theme.spacing.md,
                  opacity: 0.5
                }}
              >
                Folder
              </div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: theme.spacing.sm,
                  fontSize: '16px',
                  color: theme.colors.foreground.primary
                }}
              >
                No Recent Projects
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: theme.colors.foreground.secondary
                }}
              >
                Your recently opened projects will appear here
              </p>
            </div>
          )}

          {!isLoading && recentProjects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {recentProjects.map((project, index) => (
                <div
                  key={project.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: project.exists
                      ? theme.colors.background.secondary
                      : theme.colors.background.tertiary,
                    cursor: project.exists ? 'pointer' : 'default',
                    opacity: project.exists ? 1 : 0.6,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => project.exists && handleSelectProject(project)}
                  onMouseEnter={(e) => {
                    if (project.exists) {
                      e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = project.exists
                      ? theme.colors.background.secondary
                      : theme.colors.background.tertiary;
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.xs
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 500,
                          color: project.exists
                            ? theme.colors.foreground.primary
                            : theme.colors.foreground.tertiary
                        }}
                      >
                        {project.name}
                      </h4>
                      {!project.exists && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            borderRadius: theme.borderRadius.sm
                          }}
                        >
                          Missing
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: theme.colors.foreground.tertiary,
                        fontFamily: 'monospace'
                      }}
                    >
                      {project.path}
                    </p>
                    <p
                      style={{
                        margin: `${theme.spacing.xs} 0 0 0`,
                        fontSize: '12px',
                        color: theme.colors.foreground.tertiary
                      }}
                    >
                      Last opened: {formatLastOpened(project.lastOpened)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProject(project.path);
                      }}
                      style={{
                        padding: theme.spacing.xs,
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: theme.colors.foreground.tertiary,
                        cursor: 'pointer',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '14px'
                      }}
                      title="Remove from recent projects"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {recentProjects.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: theme.spacing.md
                  }}
                >
                  <Button variant="secondary" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              style={{
                marginTop: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: theme.borderRadius.sm,
                fontSize: '14px'
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border.primary}`,
            backgroundColor: theme.colors.background.secondary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Button variant="secondary" onClick={onBrowseProject}>
            Browse for Project...
          </Button>

          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
