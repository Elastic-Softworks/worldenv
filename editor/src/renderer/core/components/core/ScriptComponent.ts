/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Script Component
 *
 * Enhanced script component for attaching WORLDC script files to entities.
 * Integrates with WORLDC compiler and script system for hot-reload and execution.
 */

import { Component, AssetReference, PropertyMetadata } from '../Component';

/**
 * Script execution modes
 */
export enum ScriptExecutionMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  EVENT_DRIVEN = 'event_driven'
}

/**
 * Script languages
 */
export enum ScriptLanguage {
  WORLDC = 'worldc',
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript'
}

/**
 * Script component
 *
 * Attaches script files to entities for behavior and logic.
 * Supports various script languages and execution modes.
 */
export class ScriptComponent extends Component {
  /**
   * ScriptComponent constructor
   */
  constructor() {
    super(
      'Script',
      'Script',
      'Attaches a script file to an entity for custom behavior',
      'Scripting'
    );
  }

  /**
   * initializeProperties()
   *
   * Sets up script properties.
   */
  protected initializeProperties(): void {
    this.defineProperty<AssetReference | null>('scriptFile', null, {
      type: 'asset',
      displayName: 'Script File',
      description: 'The script file to attach to this entity',
      fileFilter: 'text/javascript,text/typescript,text/worldc'
    });

    this.defineProperty<ScriptLanguage>('language', ScriptLanguage.WORLDC, {
      type: 'enum',
      displayName: 'Language',
      description: 'Programming language of the script',
      options: Object.values(ScriptLanguage)
    });

    this.defineProperty<ScriptExecutionMode>('executionMode', ScriptExecutionMode.AUTOMATIC, {
      type: 'enum',
      displayName: 'Execution Mode',
      description: 'How and when the script should be executed',
      options: Object.values(ScriptExecutionMode)
    });

    this.defineProperty<boolean>('autoStart', true, {
      type: 'boolean',
      displayName: 'Auto Start',
      description: 'Start script execution automatically when entity is created'
    });

    this.defineProperty<boolean>('runInEditor', false, {
      type: 'boolean',
      displayName: 'Run In Editor',
      description: 'Execute script in editor mode (for tools and utilities)'
    });

    this.defineProperty<number>('executionOrder', 0, {
      type: 'number',
      displayName: 'Execution Order',
      description: 'Script execution order relative to other scripts',
      min: -1000,
      max: 1000,
      step: 1
    });

    this.defineProperty<Record<string, any>>(
      'publicVariables',
      {},
      {
        type: 'object',
        displayName: 'Public Variables',
        description: 'Variables exposed from the script for editor configuration'
      }
    );

    this.defineProperty<string[]>('enabledPhases', ['start', 'update', 'destroy'], {
      type: 'object',
      displayName: 'Enabled Phases',
      description: 'Lifecycle phases that this script will execute'
    });

    this.defineProperty<string>('compilationStatus', 'Not Compiled', {
      type: 'string',
      displayName: 'Compilation Status',
      description: 'Current compilation status of the script',
      readonly: true
    });

    this.defineProperty<any[]>('compilationErrors', [], {
      type: 'object',
      displayName: 'Compilation Errors',
      description: 'Script compilation and runtime errors',
      readonly: true
    });

    this.defineProperty<string[]>('dependencies', [], {
      type: 'object',
      displayName: 'Dependencies',
      description: 'List of script dependencies that must be loaded first'
    });

    this.defineProperty<boolean>('enableDebugging', true, {
      type: 'boolean',
      displayName: 'Enable Debugging',
      description: 'Enable debugging features for this script'
    });

    this.defineProperty<boolean>('enableHotReload', true, {
      type: 'boolean',
      displayName: 'Enable Hot Reload',
      description: 'Automatically reload script when file changes'
    });

    this.defineProperty<string>('version', '1.0.0', {
      type: 'string',
      displayName: 'Version',
      description: 'Script version for compatibility checking',
      readonly: true
    });

    this.defineProperty<string>('author', '', {
      type: 'string',
      displayName: 'Author',
      description: 'Script author information',
      readonly: true
    });

    this.defineProperty<string>('description', '', {
      type: 'string',
      displayName: 'Description',
      description: 'Script description and purpose',
      readonly: true
    });
  }

  /**
   * getScriptFile()
   *
   * Gets script file reference.
   */
  getScriptFile(): AssetReference | null {
    return this.getProperty<AssetReference | null>('scriptFile');
  }

  /**
   * setScriptFile()
   *
   * Sets script file reference.
   */
  setScriptFile(scriptFile: AssetReference | null): void {
    this.setProperty('scriptFile', scriptFile);
  }

  /**
   * getLanguage()
   *
   * Gets script language.
   */
  getLanguage(): ScriptLanguage {
    return this.getProperty<ScriptLanguage>('language') || ScriptLanguage.WORLDC;
  }

  /**
   * setLanguage()
   *
   * Sets script language.
   */
  setLanguage(language: ScriptLanguage): void {
    this.setProperty('language', language);
  }

  /**
   * getExecutionMode()
   *
   * Gets execution mode.
   */
  getExecutionMode(): ScriptExecutionMode {
    return this.getProperty<ScriptExecutionMode>('executionMode') || ScriptExecutionMode.AUTOMATIC;
  }

  /**
   * setExecutionMode()
   *
   * Sets execution mode.
   */
  setExecutionMode(mode: ScriptExecutionMode): void {
    this.setProperty('executionMode', mode);
  }

  /**
   * isAutoStart()
   *
   * Checks if auto start is enabled.
   */
  isAutoStart(): boolean {
    return this.getProperty<boolean>('autoStart') || false;
  }

  /**
   * setAutoStart()
   *
   * Sets auto start state.
   */
  setAutoStart(autoStart: boolean): void {
    this.setProperty('autoStart', autoStart);
  }

  /**
   * shouldRunInEditor()
   *
   * Checks if script should run in editor.
   */
  shouldRunInEditor(): boolean {
    return this.getProperty<boolean>('runInEditor') || false;
  }

  /**
   * setRunInEditor()
   *
   * Sets run in editor state.
   */
  setRunInEditor(runInEditor: boolean): void {
    this.setProperty('runInEditor', runInEditor);
  }

  /**
   * getExecutionOrder()
   *
   * Gets execution order.
   */
  getExecutionOrder(): number {
    return this.getProperty<number>('executionOrder') || 0;
  }

  /**
   * setExecutionOrder()
   *
   * Sets execution order.
   */
  setExecutionOrder(order: number): void {
    this.setProperty('executionOrder', order);
  }

  /**
   * getPublicVariables()
   *
   * Gets public variables object.
   */
  getPublicVariables(): Record<string, any> {
    return this.getProperty<Record<string, any>>('publicVariables') || {};
  }

  /**
   * setPublicVariables()
   *
   * Sets public variables object.
   */
  setPublicVariables(variables: Record<string, any>): void {
    this.setProperty('publicVariables', variables);
  }

  /**
   * setPublicVariable()
   *
   * Sets individual public variable.
   */
  setPublicVariable(name: string, value: any): void {
    const variables = this.getPublicVariables();
    variables[name] = value;
    this.setPublicVariables(variables);
  }

  /**
   * getPublicVariable()
   *
   * Gets individual public variable.
   */
  getPublicVariable<T = any>(name: string): T | null {
    const variables = this.getPublicVariables();
    return variables[name] || null;
  }

  /**
   * getDependencies()
   *
   * Gets script dependencies.
   */
  getDependencies(): string[] {
    return this.getProperty<string[]>('dependencies') || [];
  }

  /**
   * setDependencies()
   *
   * Sets script dependencies.
   */
  setDependencies(dependencies: string[]): void {
    this.setProperty('dependencies', dependencies);
  }

  /**
   * addDependency()
   *
   * Adds script dependency.
   */
  addDependency(dependency: string): void {
    const dependencies = this.getDependencies();
    if (!dependencies.includes(dependency)) {
      dependencies.push(dependency);
      this.setDependencies(dependencies);
    }
  }

  /**
   * removeDependency()
   *
   * Removes script dependency.
   */
  removeDependency(dependency: string): boolean {
    const dependencies = this.getDependencies();
    const index = dependencies.indexOf(dependency);
    if (index !== -1) {
      dependencies.splice(index, 1);
      this.setDependencies(dependencies);
      return true;
    }
    return false;
  }

  /**
   * isDebuggingEnabled()
   *
   * Checks if debugging is enabled.
   */
  isDebuggingEnabled(): boolean {
    return this.getProperty<boolean>('enableDebugging') || false;
  }

  /**
   * setDebuggingEnabled()
   *
   * Sets debugging enabled state.
   */
  setDebuggingEnabled(enabled: boolean): void {
    this.setProperty('enableDebugging', enabled);
  }

  /**
   * isHotReloadEnabled()
   *
   * Checks if hot reload is enabled.
   */
  isHotReloadEnabled(): boolean {
    return this.getProperty<boolean>('enableHotReload') || false;
  }

  /**
   * setHotReloadEnabled()
   *
   * Sets hot reload enabled state.
   */
  setHotReloadEnabled(enabled: boolean): void {
    this.setProperty('enableHotReload', enabled);
  }

  /**
   * getVersion()
   *
   * Gets script version.
   */
  getVersion(): string {
    return this.getProperty<string>('version') || '1.0.0';
  }

  /**
   * setVersion()
   *
   * Sets script version.
   */
  setVersion(version: string): void {
    this.setProperty('version', version);
  }

  /**
   * getAuthor()
   *
   * Gets script author.
   */
  getAuthor(): string {
    return this.getProperty<string>('author') || '';
  }

  /**
   * setAuthor()
   *
   * Sets script author.
   */
  setAuthor(author: string): void {
    this.setProperty('author', author);
  }

  /**
   * getScriptDescription()
   *
   * Gets script description.
   */
  getScriptDescription(): string {
    return this.getProperty<string>('description') || '';
  }

  /**
   * setScriptDescription()
   *
   * Sets script description.
   */
  setScriptDescription(description: string): void {
    this.setProperty('description', description);
  }

  /**
   * hasScriptFile()
   *
   * Checks if script file is assigned.
   */
  hasScriptFile(): boolean {
    const scriptFile = this.getScriptFile();
    return scriptFile !== null && scriptFile.path.length > 0;
  }

  /**
   * getEnabledPhases()
   *
   * Gets enabled lifecycle phases.
   */
  getEnabledPhases(): string[] {
    return this.getProperty<string[]>('enabledPhases') || ['start', 'update', 'destroy'];
  }

  /**
   * setEnabledPhases()
   *
   * Sets enabled lifecycle phases.
   */
  setEnabledPhases(phases: string[]): void {
    this.setProperty('enabledPhases', phases);
  }

  /**
   * getCompilationStatus()
   *
   * Gets compilation status.
   */
  getCompilationStatus(): string {
    return this.getProperty<string>('compilationStatus') || 'Not Compiled';
  }

  /**
   * setCompilationStatus()
   *
   * Sets compilation status.
   */
  setCompilationStatus(status: string): void {
    this.setProperty('compilationStatus', status);
  }

  /**
   * getCompilationErrors()
   *
   * Gets compilation errors.
   */
  getCompilationErrors(): any[] {
    return this.getProperty<any[]>('compilationErrors') || [];
  }

  /**
   * setCompilationErrors()
   *
   * Sets compilation errors.
   */
  setCompilationErrors(errors: any[]): void {
    this.setProperty('compilationErrors', errors);
  }

  /**
   * clearCompilationErrors()
   *
   * Clears compilation errors.
   */
  clearCompilationErrors(): void {
    this.setCompilationErrors([]);
  }

  /**
   * hasCompilationErrors()
   *
   * Checks if there are compilation errors.
   */
  hasCompilationErrors(): boolean {
    return this.getCompilationErrors().length > 0;
  }

  /**
   * isWorldCScript()
   *
   * Checks if this is a WORLDC script.
   */
  isWorldCScript(): boolean {
    return this.getLanguage() === ScriptLanguage.WORLDC;
  }

  /**
   * validate()
   *
   * Validates script properties.
   */
  validate(): string[] {
    const errors = super.validate();

    if (!this.hasScriptFile()) {
      errors.push('Script component requires a script file to be assigned');
    }

    const executionOrder = this.getExecutionOrder();
    if (executionOrder < -1000 || executionOrder > 1000) {
      errors.push('Execution order must be between -1000 and 1000');
    }

    const dependencies = this.getDependencies();
    for (const dep of dependencies) {
      if (typeof dep !== 'string' || dep.trim().length === 0) {
        errors.push('Dependencies must be non-empty strings');
        break;
      }
    }

    const version = this.getVersion();
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(version)) {
      errors.push('Version must be in format "major.minor.patch" (e.g., "1.0.0")');
    }

    const phases = this.getEnabledPhases();
    if (phases.length === 0) {
      errors.push('At least one lifecycle phase must be enabled');
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * Handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    // Clamp execution order
    if (key === 'executionOrder') {
      const order = value as number;
      const clampedOrder = Math.max(-1000, Math.min(1000, Math.floor(order)));
      if (clampedOrder !== order) {
        this.setProperty('executionOrder', clampedOrder);
      }
    }

    // Auto-detect language from file extension
    if (key === 'scriptFile') {
      const scriptFile = value as AssetReference | null;
      if (scriptFile && scriptFile.path) {
        const ext = scriptFile.path.toLowerCase().split('.').pop();
        switch (ext) {
          case 'wc':
          case 'worldc':
            this.setLanguage(ScriptLanguage.WORLDC);
            break;
          case 'ts':
            this.setLanguage(ScriptLanguage.TYPESCRIPT);
            break;
          case 'js':
            this.setLanguage(ScriptLanguage.JAVASCRIPT);
            break;
        }
      }
    }

    // Clean up dependencies array
    if (key === 'dependencies') {
      const deps = value as string[];
      const cleaned = deps.filter((dep) => typeof dep === 'string' && dep.trim().length > 0);
      if (cleaned.length !== deps.length) {
        this.setProperty('dependencies', cleaned);
      }
    }
  }
}

/**
 * Script component factory
 */
export function createScriptComponent(): ScriptComponent {
  return new ScriptComponent();
}
