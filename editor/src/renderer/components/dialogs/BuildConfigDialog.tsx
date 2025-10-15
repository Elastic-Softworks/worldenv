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

export interface BuildConfiguration {
  outputDirectory: string;
  buildTarget: string;
  optimizationLevel: string;
  entryScene: string;
  includeAssets: boolean;
  includeScripts: boolean;
  generateSourceMaps: boolean;
  minifyOutput: boolean;
}

interface BuildConfigDialogProps {
  isOpen: boolean;
  config: BuildConfiguration;
  availableScenes: Array<{ id: string; name: string; path: string }>;
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
  onClose,
  onSave,
  onBuild
}) => {
  const [localConfig, setLocalConfig] = useState<BuildConfiguration>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleInputChange = (field: keyof BuildConfiguration, value: string | boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value
    }));
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
      localConfig.optimizationLevel !== '' &&
      localConfig.entryScene !== ''
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
