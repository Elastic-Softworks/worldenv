/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Build Configuration Dialog
 *
 * Configures build settings for project compilation.
 * Provides options for output directory, build target,
 * optimization level, and entry scene selection.
 */

import React, { useState, useEffect } from 'react';
import './BuildConfigDialog.css';

export interface BuildTarget {
  id: string;
  name: string;
  description: string;
}

export interface OptimizationLevel {
  id: string;
  name: string;
  description: string;
}

export interface BuildProfile {
  id: string;
  name: string;
  description: string;
  defaults: Partial<BuildConfiguration>;
}

export interface BuildConfiguration {
  outputDirectory: string;
  buildTarget: string;
  buildProfile: string;
  optimizationLevel: string;
  entryScene: string;
  includeAssets: boolean;
  includeScripts: boolean;
  generateSourceMaps: boolean;
  minifyOutput: boolean;
  enableHotReload: boolean;
  generateInstaller: boolean;
  enablePWA: boolean;
  compressionLevel: number;
  bundleAnalysis: boolean;
  targetPlatforms: string[];
}

interface BuildConfigDialogProps {
  isOpen: boolean;
  config: BuildConfiguration;
  availableScenes: Array<{ id: string; name: string; path: string }>;
  buildProfiles: BuildProfile[];
  onClose: () => void;
  onSave: (config: BuildConfiguration) => void;
  onBuild: (config: BuildConfiguration) => void;
}

const BUILD_TARGETS: BuildTarget[] = [
  {
    id: 'web',
    name: 'Web',
    description: 'Browser-based application with WebGL rendering'
  },
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'Electron-based desktop application'
  },
  {
    id: 'wasm',
    name: 'WebAssembly',
    description: 'Optimized WASM build for performance-critical applications'
  },
  {
    id: 'mobile',
    name: 'Mobile',
    description: 'Mobile application with native integration'
  }
];

const OPTIMIZATION_LEVELS: OptimizationLevel[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No optimization - fastest build time'
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Basic optimizations - balanced build time and performance'
  },
  {
    id: 'full',
    name: 'Full',
    description: 'Maximum optimization - best performance, slower build'
  }
];

export const BuildConfigDialog: React.FC<BuildConfigDialogProps> = ({
  isOpen,
  config,
  availableScenes,
  buildProfiles,
  onClose,
  onSave,
  onBuild
}) => {
  const [localConfig, setLocalConfig] = useState<BuildConfiguration>(config);
  const [selectedProfile, setSelectedProfile] = useState<string>(config.buildProfile || 'debug');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleInputChange = (
    field: keyof BuildConfiguration,
    value: string | boolean | number | string[]
  ) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileChange = async (profileId: string) => {
    setSelectedProfile(profileId);

    try {
      const testConfig = { ...localConfig, buildProfile: profileId };
      const result = (await window.worldedit.build.applyBuildProfile(testConfig)) as {
        config?: BuildConfiguration;
      };
      if (result && result.config) {
        setLocalConfig(result.config);
      }
    } catch (error) {
      console.error('Failed to apply build profile:', error);
    }
  };

  const handleBrowseOutputDirectory = async () => {
    try {
      const result = await window.electronAPI.dialog.openDirectory({
        title: 'Select Output Directory',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: localConfig.outputDirectory
      });

      if (result) {
        handleInputChange('outputDirectory', result);
      }
    } catch (error) {
      console.error('Failed to browse output directory:', error);
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleBuild = () => {
    onBuild(localConfig);
    onClose();
  };

  const isValid = () => {
    return (
      localConfig.outputDirectory.trim() !== '' &&
      localConfig.buildTarget !== '' &&
      localConfig.buildProfile !== '' &&
      localConfig.optimizationLevel !== '' &&
      localConfig.entryScene !== '' &&
      localConfig.compressionLevel >= 0 &&
      localConfig.compressionLevel <= 9 &&
      localConfig.targetPlatforms.length > 0
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog build-config-dialog">
        <div className="dialog-header">
          <h2>Build Configuration</h2>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-content">
          {/* BUILD PROFILE */}
          <div className="form-section">
            <h3>Build Profile</h3>
            <div className="form-group">
              <label>Profile:</label>
              <div className="radio-group">
                {buildProfiles.map((profile) => (
                  <div key={profile.id} className="radio-item">
                    <input
                      type="radio"
                      id={`profile-${profile.id}`}
                      name="buildProfile"
                      value={profile.id}
                      checked={selectedProfile === profile.id}
                      onChange={(e) => handleProfileChange(e.target.value)}
                    />
                    <label htmlFor={`profile-${profile.id}`}>
                      <strong>{profile.name}</strong>
                      <span className="description">{profile.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OUTPUT DIRECTORY */}
          <div className="form-section">
            <h3>Output Directory</h3>
            <div className="form-group">
              <label htmlFor="output-directory">Build Output Location:</label>
              <div className="input-group">
                <input
                  id="output-directory"
                  type="text"
                  value={localConfig.outputDirectory}
                  onChange={(e) => handleInputChange('outputDirectory', e.target.value)}
                  placeholder="Select output directory..."
                />
                <button
                  type="button"
                  className="browse-button"
                  onClick={handleBrowseOutputDirectory}
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* BUILD TARGET */}
          <div className="form-section">
            <h3>Build Target</h3>
            <div className="form-group">
              <label>Platform:</label>
              <div className="radio-group">
                {BUILD_TARGETS.map((target) => (
                  <div key={target.id} className="radio-item">
                    <input
                      type="radio"
                      id={`target-${target.id}`}
                      name="buildTarget"
                      value={target.id}
                      checked={localConfig.buildTarget === target.id}
                      onChange={(e) => handleInputChange('buildTarget', e.target.value)}
                    />
                    <label htmlFor={`target-${target.id}`}>
                      <strong>{target.name}</strong>
                      <span className="description">{target.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OPTIMIZATION LEVEL */}
          <div className="form-section">
            <h3>Optimization</h3>
            <div className="form-group">
              <label>Level:</label>
              <div className="radio-group">
                {OPTIMIZATION_LEVELS.map((level) => (
                  <div key={level.id} className="radio-item">
                    <input
                      type="radio"
                      id={`opt-${level.id}`}
                      name="optimizationLevel"
                      value={level.id}
                      checked={localConfig.optimizationLevel === level.id}
                      onChange={(e) => handleInputChange('optimizationLevel', e.target.value)}
                    />
                    <label htmlFor={`opt-${level.id}`}>
                      <strong>{level.name}</strong>
                      <span className="description">{level.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ENTRY SCENE */}
          <div className="form-section">
            <h3>Entry Scene</h3>
            <div className="form-group">
              <label htmlFor="entry-scene">Starting Scene:</label>
              <select
                id="entry-scene"
                value={localConfig.entryScene}
                onChange={(e) => handleInputChange('entryScene', e.target.value)}
              >
                <option value="">Select entry scene...</option>
                {availableScenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name} ({scene.path})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BUILD OPTIONS */}
          <div className="form-section">
            <h3>Build Options</h3>
            <div className="form-group">
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="include-assets"
                    checked={localConfig.includeAssets}
                    onChange={(e) => handleInputChange('includeAssets', e.target.checked)}
                  />
                  <label htmlFor="include-assets">Include Assets</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="include-scripts"
                    checked={localConfig.includeScripts}
                    onChange={(e) => handleInputChange('includeScripts', e.target.checked)}
                  />
                  <label htmlFor="include-scripts">Include Scripts</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="generate-sourcemaps"
                    checked={localConfig.generateSourceMaps}
                    onChange={(e) => handleInputChange('generateSourceMaps', e.target.checked)}
                  />
                  <label htmlFor="generate-sourcemaps">Generate Source Maps</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="minify-output"
                    checked={localConfig.minifyOutput}
                    onChange={(e) => handleInputChange('minifyOutput', e.target.checked)}
                  />
                  <label htmlFor="minify-output">Minify Output</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="enable-hot-reload"
                    checked={localConfig.enableHotReload}
                    onChange={(e) => handleInputChange('enableHotReload', e.target.checked)}
                  />
                  <label htmlFor="enable-hot-reload">Enable Hot Reload</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="generate-installer"
                    checked={localConfig.generateInstaller}
                    onChange={(e) => handleInputChange('generateInstaller', e.target.checked)}
                  />
                  <label htmlFor="generate-installer">Generate Installer</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="enable-pwa"
                    checked={localConfig.enablePWA}
                    onChange={(e) => handleInputChange('enablePWA', e.target.checked)}
                  />
                  <label htmlFor="enable-pwa">Enable PWA Features</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="bundle-analysis"
                    checked={localConfig.bundleAnalysis}
                    onChange={(e) => handleInputChange('bundleAnalysis', e.target.checked)}
                  />
                  <label htmlFor="bundle-analysis">Generate Bundle Analysis</label>
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED OPTIONS */}
          <div className="form-section">
            <h3>Advanced Options</h3>
            <div className="form-group">
              <label htmlFor="compression-level">Compression Level (0-9):</label>
              <input
                id="compression-level"
                type="range"
                min="0"
                max="9"
                value={localConfig.compressionLevel}
                onChange={(e) => handleInputChange('compressionLevel', parseInt(e.target.value))}
              />
              <span className="range-value">{localConfig.compressionLevel}</span>
            </div>

            <div className="form-group">
              <label>Target Platforms:</label>
              <div className="checkbox-group">
                {['web', 'desktop', 'mobile'].map((platform) => (
                  <div key={platform} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`platform-${platform}`}
                      checked={localConfig.targetPlatforms.includes(platform)}
                      onChange={(e) => {
                        const platforms = e.target.checked
                          ? [...localConfig.targetPlatforms, platform]
                          : localConfig.targetPlatforms.filter((p) => p !== platform);
                        handleInputChange('targetPlatforms', platforms);
                      }}
                    />
                    <label htmlFor={`platform-${platform}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!isValid()}>
            Save Configuration
          </button>
          <button className="btn btn-success" onClick={handleBuild} disabled={!isValid()}>
            Build Now
          </button>
        </div>
      </div>
    </div>
  );
};
