/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IComponent } from '../../core/components/Component';
import { ScriptComponent } from '../../core/components/core/ScriptComponent';
import '../../../styles/ScriptComponentUI.css';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

interface ScriptComponentUIProps {
  component: IComponent;
  onPropertyChange: (key: string, value: any) => void;
  onRemove: () => void;
}

interface ScriptSystemStats {
  totalScripts: number;
  activeScripts: number;
  executionsThisFrame: number;
  averageExecutionTime: number;
  totalExecutionTime: number;
  errorCount: number;
  hotReloadCount: number;
  lastUpdateTime: number;
}

/*
	===============================================================
             --- COMPONENT ---
	===============================================================
*/

export const ScriptComponentUI: React.FC<ScriptComponentUIProps> = ({
  component,
  onPropertyChange,
  onRemove
}) => {
  const scriptComponent = component as ScriptComponent;

  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [systemStats, setSystemStats] = useState<ScriptSystemStats | null>(null);
  const [customPropertyKey, setCustomPropertyKey] = useState<string>('');
  const [customPropertyValue, setCustomPropertyValue] = useState<string>('');

  const lifecyclePhases = [
    { id: 'awake', label: 'Awake', description: 'Called once when entity is created' },
    { id: 'start', label: 'Start', description: 'Called once before first update' },
    { id: 'update', label: 'Update', description: 'Called every frame' },
    { id: 'fixedUpdate', label: 'Fixed Update', description: 'Called at fixed intervals' },
    { id: 'lateUpdate', label: 'Late Update', description: 'Called after all updates' },
    { id: 'destroy', label: 'Destroy', description: 'Called when entity is destroyed' }
  ];

  /*
	       loadAvailableScripts()
	         ---
	         loads list of available script files from the project
	         for selection in the script path dropdown menu.
  */

  const loadAvailableScripts = useCallback(async () => {
    try {
      const scripts = await window.worldedit.script.listScripts();
      setAvailableScripts(scripts);
    } catch (error) {
      console.error('Failed to load available scripts:', error);
      setAvailableScripts([]);
    }
  }, []);

  /*
	       loadSystemStats()
	         ---
	         retrieves current script system statistics for
	         performance monitoring and debugging display.
  */

  const loadSystemStats = useCallback(async () => {
    try {
      const stats = await window.worldedit.script.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setSystemStats(null);
    }
  }, []);

  /*
	       handlePropertyUpdate()
	         ---
	         updates script component properties using the
	         component system's property change mechanism.
  */

  const handlePropertyUpdate = (key: string, value: any) => {
    onPropertyChange(key, value);
  };

  /*
	       handleCompileScript()
	         ---
	         compiles the currently selected WORLDC script
	         and updates compilation status.
  */

  const handleCompileScript = async () => {
    const scriptFile = scriptComponent.getScriptFile();
    if (!scriptFile || !scriptFile.path) {
      return;
    }

    try {
      setIsCompiling(true);
      scriptComponent.setCompilationStatus('Compiling...');

      const result = await window.worldedit.script.compileWorldC('', scriptFile.path);

      if (result.success) {
        scriptComponent.setCompilationStatus('Compiled successfully');
        scriptComponent.clearCompilationErrors();
      } else {
        scriptComponent.setCompilationStatus('Compilation failed');
        scriptComponent.setCompilationErrors(result.diagnostics || []);
      }
    } catch (error) {
      console.error('Failed to compile script:', error);
      scriptComponent.setCompilationStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsCompiling(false);
    }
  };

  /*
	       handlePhaseToggle()
	         ---
	         toggles lifecycle phase enabled state and updates
	         the script component configuration.
  */

  const handlePhaseToggle = (phaseId: string) => {
    const currentPhases = scriptComponent.getEnabledPhases();
    const updatedPhases = currentPhases.includes(phaseId)
      ? currentPhases.filter((p) => p !== phaseId)
      : [...currentPhases, phaseId];

    handlePropertyUpdate('enabledPhases', updatedPhases);
  };

  /*
	       handleAddCustomProperty()
	         ---
	         adds a new custom property to the script component
	         with user-defined key and value.
  */

  const handleAddCustomProperty = () => {
    const currentVariables = scriptComponent.getPublicVariables();
    if (!customPropertyKey.trim() || customPropertyKey in currentVariables) {
      return;
    }

    scriptComponent.setPublicVariable(customPropertyKey, customPropertyValue || '');
    setCustomPropertyKey('');
    setCustomPropertyValue('');
  };

  /*
	       handleRemoveCustomProperty()
	         ---
	         removes a custom property from the script component
	         configuration and updates the properties.
  */

  const handleRemoveCustomProperty = (key: string) => {
    const currentVariables = scriptComponent.getPublicVariables();
    delete currentVariables[key];
    scriptComponent.setPublicVariables(currentVariables);
  };

  /*
	       handleCreateNewScript()
	         ---
	         creates a new WORLDC script file and sets it
	         as the current script path for the component.
  */

  const handleCreateNewScript = async () => {
    try {
      const scriptPath = await window.worldedit.script.createNew('worldc');
      scriptComponent.setScriptFile({
        id: `script_${Date.now()}`,
        path: scriptPath,
        type: 'worldc'
      });
      await loadAvailableScripts();
    } catch (error) {
      console.error('Failed to create new script:', error);
    }
  };

  /* EFFECTS */

  useEffect(() => {
    loadAvailableScripts();
    loadSystemStats();

    /* refresh stats periodically */
    const statsInterval = setInterval(loadSystemStats, 2000);
    return () => clearInterval(statsInterval);
  }, [loadAvailableScripts, loadSystemStats]);

  /* RENDER */

  return (
    <div className="script-component-ui">
      {/* COMPONENT HEADER */}
      <div className="component-header">
        <div className="component-title">
          <span className="component-icon">📜</span>
          <span>Script Component</span>
        </div>
        <div className="component-actions">
          <button className="btn btn-sm btn-danger" onClick={onRemove} title="Remove Component">
            ×
          </button>
        </div>
      </div>

      {/* SCRIPT SELECTION */}
      <div className="property-group">
        <label className="property-label">Script File</label>
        <div className="script-selection">
          <select
            className="property-input"
            value={scriptComponent.getScriptFile()?.path || ''}
            onChange={(e) => {
              if (e.target.value) {
                scriptComponent.setScriptFile({
                  id: `script_${Date.now()}`,
                  path: e.target.value,
                  type: 'worldc'
                });
              } else {
                scriptComponent.setScriptFile(null);
              }
            }}
          >
            <option value="">Select a script...</option>
            {availableScripts.map((script) => (
              <option key={script} value={script}>
                {script.split('/').pop()}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleCreateNewScript}
            title="Create New Script"
          >
            +
          </button>
        </div>
      </div>

      {/* COMPILATION */}
      <div className="property-group">
        <div className="script-compilation">
          <button
            className="btn btn-primary"
            onClick={handleCompileScript}
            disabled={!scriptComponent.hasScriptFile() || isCompiling}
          >
            {isCompiling ? 'Compiling...' : 'Compile Script'}
          </button>
        </div>
        <div
          className={`status-message ${scriptComponent.hasCompilationErrors() ? 'error' : 'success'}`}
        >
          {scriptComponent.getCompilationStatus()}
        </div>
        {scriptComponent.hasCompilationErrors() && (
          <div className="compilation-errors">
            {scriptComponent.getCompilationErrors().map((error: any, index: number) => (
              <div key={index} className="error-item">
                {error.message} {error.line && `(Line ${error.line})`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCRIPT CONFIGURATION */}
      <div className="property-group">
        <label className="property-label">Configuration</label>

        <div className="property-row">
          <label>
            <input
              type="checkbox"
              checked={scriptComponent.isAutoStart()}
              onChange={(e) => handlePropertyUpdate('autoStart', e.target.checked)}
            />
            Auto Start
          </label>
        </div>

        <div className="property-row">
          <label>
            <input
              type="checkbox"
              checked={scriptComponent.isHotReloadEnabled()}
              onChange={(e) => handlePropertyUpdate('enableHotReload', e.target.checked)}
            />
            Enable Hot Reload
          </label>
        </div>

        <div className="property-row">
          <label>
            <input
              type="checkbox"
              checked={scriptComponent.shouldRunInEditor()}
              onChange={(e) => handlePropertyUpdate('runInEditor', e.target.checked)}
            />
            Run In Editor
          </label>
        </div>

        <div className="property-row">
          <label className="property-label">Execution Order</label>
          <input
            type="number"
            className="property-input"
            value={scriptComponent.getExecutionOrder()}
            onChange={(e) => handlePropertyUpdate('executionOrder', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* LIFECYCLE PHASES */}
      <div className="property-group">
        <label className="property-label">Enabled Lifecycle Phases</label>
        <div className="lifecycle-phases">
          {lifecyclePhases.map((phase) => (
            <div key={phase.id} className="phase-item">
              <label>
                <input
                  type="checkbox"
                  checked={scriptComponent.getEnabledPhases().includes(phase.id)}
                  onChange={() => handlePhaseToggle(phase.id)}
                />
                <span className="phase-name">{phase.label}</span>
              </label>
              <span className="phase-description">{phase.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOM PROPERTIES */}
      <div className="property-group">
        <label className="property-label">Custom Properties</label>

        {/* EXISTING PROPERTIES */}
        <div className="custom-properties">
          {Object.entries(scriptComponent.getPublicVariables()).map(([key, value]) => (
            <div key={key} className="custom-property-item">
              <span className="property-key">{key}:</span>
              <input
                type="text"
                className="property-value"
                value={String(value)}
                onChange={(e) => {
                  scriptComponent.setPublicVariable(key, e.target.value);
                }}
              />
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemoveCustomProperty(key)}
                title="Remove Property"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* ADD NEW PROPERTY */}
        <div className="add-property">
          <input
            type="text"
            className="property-input"
            placeholder="Property name"
            value={customPropertyKey}
            onChange={(e) => setCustomPropertyKey(e.target.value)}
          />
          <input
            type="text"
            className="property-input"
            placeholder="Property value"
            value={customPropertyValue}
            onChange={(e) => setCustomPropertyValue(e.target.value)}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleAddCustomProperty}
            disabled={!customPropertyKey.trim()}
          >
            Add
          </button>
        </div>
      </div>

      {/* SYSTEM STATISTICS */}
      {systemStats && (
        <div className="property-group">
          <label className="property-label">Script System Stats</label>
          <div className="system-stats">
            <div className="stat-item">
              <span className="stat-label">Total Scripts:</span>
              <span className="stat-value">{systemStats.totalScripts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Scripts:</span>
              <span className="stat-value">{systemStats.activeScripts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Execution Time:</span>
              <span className="stat-value">{systemStats.averageExecutionTime.toFixed(2)}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Errors:</span>
              <span className="stat-value">{systemStats.errorCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hot Reloads:</span>
              <span className="stat-value">{systemStats.hotReloadCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
