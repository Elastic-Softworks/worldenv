/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Project Settings Dialog
 *
 * Configuration dialog for project-wide settings.
 * Includes rendering, physics, audio, and metadata options.
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ProjectData, ProjectSettings } from '../../../shared/types';
import { Button } from '../ui/Button';

/**
 * Dialog props
 */
interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ProjectSettings) => Promise<void>;
  projectData: ProjectData | null;
}

/**
 * Settings tab type
 */
type SettingsTab = 'general' | 'rendering' | 'physics' | 'audio' | 'viewport';

/**
 * ProjectSettingsDialog component
 *
 * Multi-tab settings editor for project configuration.
 * Provides validation and real-time preview where applicable.
 */
export function ProjectSettingsDialog({
  isOpen,
  onClose,
  onSave,
  projectData
}: ProjectSettingsDialogProps): JSX.Element | null {
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Initialize settings when dialog opens
   */
  useEffect(() => {
    if (isOpen && projectData) {
      setSettings({ ...projectData.settings });
      setHasChanges(false);
      setError(null);
    }
  }, [isOpen, projectData]);

  /**
   * Update setting value
   */
  const updateSetting = (path: string, value: unknown): void => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  /**
   * Handle save
   */
  const handleSave = async (): Promise<void> => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      setError(null);

      await onSave(settings);
      setHasChanges(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Tab definitions
   */
  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: 'general', label: 'General', icon: 'Settings' },
    { id: 'rendering', label: 'Rendering', icon: 'Render' },
    { id: 'physics', label: 'Physics', icon: 'Physics' },
    { id: 'audio', label: 'Audio', icon: 'Audio' },
    { id: 'viewport', label: 'Viewport', icon: 'View' }
  ];

  if (!isOpen || !settings || !projectData) {
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
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.background.primary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.lg,
          width: '800px',
          height: '600px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column'
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
            Project Settings
          </h2>
          <p
            style={{
              margin: `${theme.spacing.sm} 0 0 0`,
              fontSize: '14px',
              color: theme.colors.foreground.secondary
            }}
          >
            Configure project-wide settings for {projectData.name}
          </p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '200px',
              borderRight: `1px solid ${theme.colors.border.primary}`,
              backgroundColor: theme.colors.background.secondary
            }}
          >
            <div style={{ padding: theme.spacing.sm }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: 'none',
                    backgroundColor:
                      activeTab === tab.id ? theme.colors.background.tertiary : 'transparent',
                    color:
                      activeTab === tab.id
                        ? theme.colors.accent.primary
                        : theme.colors.foreground.primary,
                    cursor: 'pointer',
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '14px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.xs
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <div
            style={{
              flex: 1,
              padding: theme.spacing.lg,
              overflowY: 'auto'
            }}
          >
            {/* General Settings */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.foreground.primary
                  }}
                >
                  General Settings
                </h3>

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
                    Default Scene
                  </label>
                  <select
                    value={settings.default_scene}
                    onChange={(e) => updateSetting('default_scene', e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.foreground.primary,
                      fontSize: '14px'
                    }}
                  >
                    {projectData.scenes.map((scene) => (
                      <option key={scene} value={scene}>
                        {scene.replace('scenes/', '').replace('.worldscene', '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Rendering Settings */}
            {activeTab === 'rendering' && settings?.rendering && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Rendering Settings
                </h3>

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
                    Renderer
                  </label>
                  <select
                    value={settings.rendering.renderer || 'webgl'}
                    onChange={(e) => updateSetting('rendering.renderer', e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.foreground.primary,
                      fontSize: '14px'
                    }}
                  >
                    <option value="webgl">WebGL</option>
                    <option value="webgpu">WebGPU</option>
                    <option value="canvas">Canvas 2D</option>
                  </select>
                </div>

                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}
                >
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
                      Target FPS
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="120"
                      value={settings.rendering.target_fps || 60}
                      onChange={(e) =>
                        updateSetting('rendering.target_fps', parseInt(e.target.value))
                      }
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.foreground.primary,
                        fontSize: '14px'
                      }}
                    />
                  </div>

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
                      Resolution Scale
                    </label>
                    <input
                      type="number"
                      min="0.25"
                      max="2.0"
                      step="0.25"
                      value={settings.rendering.resolution_scale || 1.0}
                      onChange={(e) =>
                        updateSetting('rendering.resolution_scale', parseFloat(e.target.value))
                      }
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.foreground.primary,
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: '14px',
                      color: theme.colors.foreground.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.rendering.antialias || false}
                      onChange={(e) => updateSetting('rendering.antialias', e.target.checked)}
                    />
                    Antialiasing
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: '14px',
                      color: theme.colors.foreground.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.rendering.vsync || false}
                      onChange={(e) => updateSetting('rendering.vsync', e.target.checked)}
                    />
                    Vertical Sync
                  </label>
                </div>
              </div>
            )}

            {/* Physics Settings */}
            {activeTab === 'physics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Physics Settings
                </h3>

                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: '14px',
                      color: theme.colors.foreground.primary,
                      cursor: 'pointer',
                      marginBottom: theme.spacing.md
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.physics.enabled}
                      onChange={(e) => updateSetting('physics.enabled', e.target.checked)}
                    />
                    Enable Physics System
                  </label>
                </div>

                {settings.physics.enabled && (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: theme.spacing.md
                      }}
                    >
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
                          Gravity X
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.physics.gravity[0]}
                          onChange={(e) =>
                            updateSetting('physics.gravity', [
                              parseFloat(e.target.value),
                              settings.physics.gravity[1]
                            ])
                          }
                          style={{
                            width: '100%',
                            padding: theme.spacing.sm,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.foreground.primary,
                            fontSize: '14px'
                          }}
                        />
                      </div>

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
                          Gravity Y
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.physics.gravity[1]}
                          onChange={(e) =>
                            updateSetting('physics.gravity', [
                              settings.physics.gravity[0],
                              parseFloat(e.target.value)
                            ])
                          }
                          style={{
                            width: '100%',
                            padding: theme.spacing.sm,
                            border: `1px solid ${theme.colors.border.primary}`,
                            borderRadius: theme.borderRadius.sm,
                            backgroundColor: theme.colors.background.secondary,
                            color: theme.colors.foreground.primary,
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

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
                        Fixed Timestep (seconds)
                      </label>
                      <input
                        type="number"
                        min="0.001"
                        max="0.1"
                        step="0.001"
                        value={settings.physics.fixed_timestep}
                        onChange={(e) =>
                          updateSetting('physics.fixed_timestep', parseFloat(e.target.value))
                        }
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          border: `1px solid ${theme.colors.border.primary}`,
                          borderRadius: theme.borderRadius.sm,
                          backgroundColor: theme.colors.background.secondary,
                          color: theme.colors.foreground.primary,
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Audio Settings */}
            {activeTab === 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Audio Settings
                </h3>

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
                    Master Volume: {Math.round(settings.audio.master_volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.audio.master_volume}
                    onChange={(e) =>
                      updateSetting('audio.master_volume', parseFloat(e.target.value))
                    }
                    style={{
                      width: '100%'
                    }}
                  />
                </div>

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
                    Music Volume: {Math.round(settings.audio.music_volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.audio.music_volume}
                    onChange={(e) =>
                      updateSetting('audio.music_volume', parseFloat(e.target.value))
                    }
                    style={{
                      width: '100%'
                    }}
                  />
                </div>

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
                    Sound Effects Volume: {Math.round(settings.audio.sfx_volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.audio.sfx_volume}
                    onChange={(e) => updateSetting('audio.sfx_volume', parseFloat(e.target.value))}
                    style={{
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Viewport Settings */}
            {activeTab === 'viewport' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.foreground.primary
                  }}
                >
                  Viewport Settings
                </h3>

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
                    Default Mode
                  </label>
                  <select
                    value={settings.viewport.mode}
                    onChange={(e) => updateSetting('viewport.mode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.border.primary}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: theme.colors.background.secondary,
                      color: theme.colors.foreground.primary,
                      fontSize: '14px'
                    }}
                  >
                    <option value="2d">2D Mode</option>
                    <option value="3d">3D Mode</option>
                  </select>
                </div>

                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}
                >
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
                      Grid Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="128"
                      value={settings.viewport.grid_size}
                      onChange={(e) =>
                        updateSetting('viewport.grid_size', parseInt(e.target.value))
                      }
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.foreground.primary,
                        fontSize: '14px'
                      }}
                    />
                  </div>

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
                      Snap Value
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={settings.viewport.snap_value}
                      onChange={(e) =>
                        updateSetting('viewport.snap_value', parseInt(e.target.value))
                      }
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.border.primary}`,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: theme.colors.background.secondary,
                        color: theme.colors.foreground.primary,
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: '14px',
                      color: theme.colors.foreground.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.viewport.grid_visible}
                      onChange={(e) => updateSetting('viewport.grid_visible', e.target.checked)}
                    />
                    Show Grid by Default
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      fontSize: '14px',
                      color: theme.colors.foreground.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.viewport.snap_enabled}
                      onChange={(e) => updateSetting('viewport.snap_enabled', e.target.checked)}
                    />
                    Enable Snap by Default
                  </label>
                </div>
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
          <div>
            {hasChanges && (
              <span
                style={{
                  fontSize: '14px',
                  color: theme.colors.foreground.secondary
                }}
              >
                Unsaved changes
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>

            <Button variant="primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
