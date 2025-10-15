/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - New Project Dialog
 *
 * Project creation wizard with template selection and configuration.
 * Guides user through project setup process with validation.
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ProjectData } from '../../../shared/types';
import { Button } from '../ui/Button';

/**
 * Project template definitions
 */
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  defaultSettings: Partial<ProjectData['settings']>;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'empty',
    name: 'Empty Project',
    description: 'Start with a blank project and add features as needed',
    icon: 'Empty',
    features: ['Basic scene', 'Default configuration'],
    defaultSettings: {
      viewport: {
        mode: '2d',
        grid_visible: true,
        grid_size: 32,
        snap_enabled: false,
        snap_value: 16
      }
    }
  },
  {
    id: '2d-game',
    name: '2D Game',
    description: 'Optimized for 2D games with sprite rendering and physics',
    icon: 'Game2D',
    features: ['2D viewport', 'Sprite renderer', '2D physics', 'Input system'],
    defaultSettings: {
      viewport: {
        mode: '2d',
        grid_visible: true,
        grid_size: 16,
        snap_enabled: true,
        snap_value: 16
      },
      rendering: {
        renderer: 'webgl',
        antialias: false,
        vsync: true,
        target_fps: 60,
        resolution_scale: 1.0
      },
      physics: {
        enabled: true,
        gravity: [0, -9.8],
        fixed_timestep: 0.016
      }
    }
  },
  {
    id: '3d-game',
    name: '3D Game',
    description: 'Full 3D environment with lighting and advanced rendering',
    icon: 'Game3D',
    features: ['3D viewport', 'PBR rendering', '3D physics', 'Lighting system'],
    defaultSettings: {
      viewport: {
        mode: '3d',
        grid_visible: true,
        grid_size: 1,
        snap_enabled: false,
        snap_value: 0.5
      },
      rendering: {
        renderer: 'webgl',
        antialias: true,
        vsync: true,
        target_fps: 60,
        resolution_scale: 1.0
      },
      physics: {
        enabled: true,
        gravity: [0, -9.8],
        fixed_timestep: 0.016
      }
    }
  },
  {
    id: 'ui-app',
    name: 'UI Application',
    description: 'Interactive application with UI elements and minimal physics',
    icon: 'AppUI',
    features: ['2D viewport', 'UI system', 'No physics', 'Input handling'],
    defaultSettings: {
      viewport: {
        mode: '2d',
        grid_visible: false,
        grid_size: 16,
        snap_enabled: true,
        snap_value: 8
      },
      rendering: {
        renderer: 'webgl',
        antialias: true,
        vsync: true,
        target_fps: 60,
        resolution_scale: 1.0
      },
      physics: {
        enabled: false,
        gravity: [0, 0],
        fixed_timestep: 0.016
      }
    }
  }
];

/**
 * Dialog props
 */
interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (config: ProjectConfig) => Promise<void>;
}

/**
 * Project configuration
 */
interface ProjectConfig {
  name: string;
  location: string;
  template: ProjectTemplate;
}

/**
 * NewProjectDialog component
 *
 * Multi-step wizard for creating new projects.
 * Includes template selection and project configuration.
 */
export function NewProjectDialog({
  isOpen,
  onClose,
  onCreateProject
}: NewProjectDialogProps): JSX.Element | null {
  const { theme } = useTheme();

  const [step, setStep] = useState<'template' | 'config' | 'creating'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(PROJECT_TEMPLATES[0]);
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reset dialog state when opened
   */
  useEffect(() => {
    if (isOpen) {
      setStep('template');
      setSelectedTemplate(PROJECT_TEMPLATES[0]);
      setProjectName('');
      setProjectLocation('');
      setIsCreating(false);
      setError(null);
    }
  }, [isOpen]);

  /**
   * Handle location selection
   */
  const handleSelectLocation = async (): Promise<void> => {
    try {
      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Select Project Location',
        properties: ['createDirectory']
      });

      if (dirPath) {
        setProjectLocation(dirPath);
      }
    } catch (err) {
      setError('Failed to select project location');
    }
  };

  /**
   * Handle project creation
   */
  const handleCreateProject = async (): Promise<void> => {
    if (!projectName.trim() || !projectLocation) {
      setError('Project name and location are required');
      return;
    }

    try {
      setIsCreating(true);
      setStep('creating');
      setError(null);

      await onCreateProject({
        name: projectName.trim(),
        location: projectLocation,
        template: selectedTemplate
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setStep('config');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Validate project configuration
   */
  const isConfigValid = (): boolean => {
    return projectName.trim().length > 0 && projectLocation.length > 0;
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
        if (e.target === e.currentTarget && !isCreating) {
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
            New Project
          </h2>
          <p
            style={{
              margin: `${theme.spacing.sm} 0 0 0`,
              fontSize: '14px',
              color: theme.colors.foreground.secondary
            }}
          >
            {step === 'template' && 'Choose a project template to get started'}
            {step === 'config' && 'Configure your new project'}
            {step === 'creating' && 'Creating project...'}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.lg }}>
          {/* Template Selection */}
          {step === 'template' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg
                }}
              >
                {PROJECT_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    style={{
                      border: `2px solid ${
                        selectedTemplate.id === template.id
                          ? theme.colors.accent.primary
                          : theme.colors.border.primary
                      }`,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      cursor: 'pointer',
                      backgroundColor:
                        selectedTemplate.id === template.id
                          ? theme.colors.background.tertiary
                          : theme.colors.background.secondary,
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.sm
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{template.icon}</span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 600,
                          color: theme.colors.foreground.primary
                        }}
                      >
                        {template.name}
                      </h3>
                    </div>
                    <p
                      style={{
                        margin: `0 0 ${theme.spacing.sm} 0`,
                        fontSize: '13px',
                        color: theme.colors.foreground.secondary,
                        lineHeight: 1.4
                      }}
                    >
                      {template.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: theme.spacing.xs
                      }}
                    >
                      {template.features.map((feature) => (
                        <span
                          key={feature}
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            backgroundColor: theme.colors.background.primary,
                            color: theme.colors.foreground.tertiary,
                            borderRadius: theme.borderRadius.sm,
                            border: `1px solid ${theme.colors.border.secondary}`
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Configuration */}
          {step === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
              {/* Project Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.background.secondary,
                    color: theme.colors.foreground.primary,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              {/* Project Location */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: theme.spacing.sm,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Location
                </label>
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <input
                    type="text"
                    value={projectLocation}
                    readOnly
                    placeholder="Select project location"
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.background.tertiary,
                      color: theme.colors.foreground.primary,
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <Button variant="secondary" onClick={handleSelectLocation} disabled={isCreating}>
                    Browse
                  </Button>
                </div>
              </div>

              {/* Selected Template Info */}
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.sm
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.sm
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{selectedTemplate.icon}</span>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.colors.foreground.primary
                    }}
                  >
                    {selectedTemplate.name}
                  </h4>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: theme.colors.foreground.secondary
                  }}
                >
                  {selectedTemplate.description}
                </p>
              </div>
            </div>
          )}

          {/* Creating Project */}
          {step === 'creating' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: theme.spacing.lg,
                padding: theme.spacing.xl
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: `4px solid ${theme.colors.border.primary}`,
                  borderTop: `4px solid ${theme.colors.accent.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  color: theme.colors.foreground.primary,
                  textAlign: 'center'
                }}
              >
                Creating project "{projectName}"...
              </p>
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
        {step !== 'creating' && (
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
            <div>
              {step === 'config' && (
                <Button
                  variant="secondary"
                  onClick={() => setStep('template')}
                  disabled={isCreating}
                >
                  Back
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="secondary" onClick={onClose} disabled={isCreating}>
                Cancel
              </Button>

              {step === 'template' && (
                <Button variant="primary" onClick={() => setStep('config')}>
                  Next
                </Button>
              )}

              {step === 'config' && (
                <Button
                  variant="primary"
                  onClick={handleCreateProject}
                  disabled={!isConfigValid() || isCreating}
                >
                  Create Project
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
