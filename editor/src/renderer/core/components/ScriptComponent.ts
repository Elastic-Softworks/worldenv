/*
   ===============================================================
   WORLDEDIT SCRIPT COMPONENT
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import {
  Component,
  PropertyType,
  ComponentProperty,
  ComponentSerialData,
  PropertyMetadata
} from './Component';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ScriptLifecyclePhase
	       ---
	       enumeration of script execution phases during entity
	       lifecycle. defines when script methods are invoked
	       during entity initialization, updates, and cleanup.

*/

export enum ScriptLifecyclePhase {
  AWAKE = 'awake' /* called once when entity is created */,
  START = 'start' /* called once before first update */,
  UPDATE = 'update' /* called every frame */,
  FIXED_UPDATE = 'fixedUpdate' /* called at fixed intervals */,
  LATE_UPDATE = 'lateUpdate' /* called after all updates */,
  DESTROY = 'destroy' /* called when entity is destroyed */
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         ScriptComponent
	       ---
	       component for attaching WORLDC scripts to entities.
	       provides script path configuration, lifecycle phase
	       management, and custom property support for script
	       behavior customization.

	       the component integrates with the script system manager
	       to handle compilation, hot-reload, and execution
	       coordination across the entity lifecycle.

*/

export class ScriptComponent extends Component {
  constructor() {
    super(
      'Script',
      'Script Component',
      'Attaches a WORLDC script to provide entity behavior and logic',
      'Scripting'
    );
  }

  /*

           initializeProperties()
	         ---
	         sets up the script component properties for editor
	         configuration including script path, compilation
	         settings, lifecycle phases, and custom properties.

  */

  protected initializeProperties(): void {
    /* script file path */
    this.addProperty('scriptPath', '', {
      type: 'string' as PropertyType,
      displayName: 'Script Path',
      description: 'Path to the WORLDC script file (.wc)',
      required: true,
      placeholder: 'scripts/MyScript.wc',
      fileFilter: '.wc'
    });

    /* auto compilation setting */
    this.addProperty('autoCompile', true, {
      type: 'boolean' as PropertyType,
      displayName: 'Auto Compile',
      description: 'Automatically compile script when source changes',
      defaultValue: true
    });

    /* hot reload setting */
    this.addProperty('enableHotReload', true, {
      type: 'boolean' as PropertyType,
      displayName: 'Enable Hot Reload',
      description: 'Enable hot-reload functionality for development',
      defaultValue: true
    });

    /* execution order */
    this.addProperty('executionOrder', 0, {
      type: 'number' as PropertyType,
      displayName: 'Execution Order',
      description: 'Script execution priority (lower values execute first)',
      defaultValue: 0,
      step: 1
    });

    /* enabled lifecycle phases */
    this.addProperty('enabledPhases', ['start', 'update', 'destroy'], {
      type: 'object' as PropertyType,
      displayName: 'Enabled Phases',
      description: 'Lifecycle phases that this script will execute',
      defaultValue: ['start', 'update', 'destroy']
    });

    /* custom script properties */
    this.addProperty(
      'customProperties',
      {},
      {
        type: 'object' as PropertyType,
        displayName: 'Custom Properties',
        description: 'User-defined properties accessible from the script',
        defaultValue: {}
      }
    );

    /* compilation status (read-only) */
    this.addProperty('compilationStatus', 'Not Compiled', {
      type: 'string' as PropertyType,
      displayName: 'Compilation Status',
      description: 'Current compilation status of the script',
      readonly: true,
      defaultValue: 'Not Compiled'
    });

    /* script errors (read-only) */
    this.addProperty('errors', [], {
      type: 'object' as PropertyType,
      displayName: 'Errors',
      description: 'Compilation and runtime errors',
      readonly: true,
      defaultValue: []
    });
  }

  /*

           addProperty()
	         ---
	         helper method to add a property with metadata
	         to the component property map with proper
	         metadata configuration and validation.

  */

  private addProperty(key: string, defaultValue: any, metadata: Partial<PropertyMetadata>): void {
    const property: ComponentProperty = {
      key,
      value: defaultValue,
      metadata: {
        type: metadata.type || ('string' as PropertyType),
        displayName: metadata.displayName || key,
        description: metadata.description,
        readonly: metadata.readonly || false,
        required: metadata.required || false,
        defaultValue: defaultValue,
        visible: metadata.visible !== false,
        ...metadata
      }
    };

    this._properties.set(key, property);
  }

  /*

           getScriptPath()
	         ---
	         retrieves the configured script file path
	         for this component instance.

  */

  getScriptPath(): string {
    return this.getProperty<string>('scriptPath') || '';
  }

  /*

           setScriptPath()
	         ---
	         updates the script file path and triggers
	         recompilation if auto-compile is enabled.

  */

  setScriptPath(path: string): void {
    this.setProperty('scriptPath', path);
  }

  /*

           getEnabledPhases()
	         ---
	         returns array of enabled lifecycle phases
	         for script execution coordination.

  */

  getEnabledPhases(): ScriptLifecyclePhase[] {
    const phases = this.getProperty<string[]>('enabledPhases') || [];
    return phases.map((phase) => phase as ScriptLifecyclePhase);
  }

  /*

           setEnabledPhases()
	         ---
	         updates the enabled lifecycle phases
	         for script execution management.

  */

  setEnabledPhases(phases: ScriptLifecyclePhase[]): void {
    this.setProperty('enabledPhases', phases);
  }

  /*

           getCustomProperties()
	         ---
	         retrieves custom properties object for
	         script runtime access and configuration.

  */

  getCustomProperties(): Record<string, any> {
    return this.getProperty<Record<string, any>>('customProperties') || {};
  }

  /*

           setCustomProperty()
	         ---
	         updates a single custom property value
	         in the component configuration.

  */

  setCustomProperty(key: string, value: any): void {
    const customProps = this.getCustomProperties();
    customProps[key] = value;
    this.setProperty('customProperties', customProps);
  }

  /*

           removeCustomProperty()
	         ---
	         removes a custom property from the
	         component configuration.

  */

  removeCustomProperty(key: string): void {
    const customProps = this.getCustomProperties();
    delete customProps[key];
    this.setProperty('customProperties', customProps);
  }

  /*

           isAutoCompileEnabled()
	         ---
	         checks if automatic compilation is enabled
	         for this script component instance.

  */

  isAutoCompileEnabled(): boolean {
    return this.getProperty<boolean>('autoCompile') || false;
  }

  /*

           isHotReloadEnabled()
	         ---
	         checks if hot-reload functionality is enabled
	         for development workflow optimization.

  */

  isHotReloadEnabled(): boolean {
    return this.getProperty<boolean>('enableHotReload') || false;
  }

  /*

           getExecutionOrder()
	         ---
	         retrieves script execution priority order
	         for coordinated script system execution.

  */

  getExecutionOrder(): number {
    return this.getProperty<number>('executionOrder') || 0;
  }

  /*

           setExecutionOrder()
	         ---
	         updates script execution priority order
	         for system coordination management.

  */

  setExecutionOrder(order: number): void {
    this.setProperty('executionOrder', order);
  }

  /*

           getCompilationStatus()
	         ---
	         retrieves current compilation status
	         for debugging and monitoring purposes.

  */

  getCompilationStatus(): string {
    return this.getProperty<string>('compilationStatus') || 'Not Compiled';
  }

  /*

           setCompilationStatus()
	         ---
	         updates compilation status for display
	         in the editor interface.

  */

  setCompilationStatus(status: string): void {
    this.setProperty('compilationStatus', status);
  }

  /*

           getErrors()
	         ---
	         retrieves array of compilation and runtime
	         errors for debugging assistance.

  */

  getErrors(): any[] {
    return this.getProperty<any[]>('errors') || [];
  }

  /*

           setErrors()
	         ---
	         updates error list for debugging and
	         editor error reporting display.

  */

  setErrors(errors: any[]): void {
    this.setProperty('errors', errors);
  }

  /*

           addError()
	         ---
	         appends a new error to the error list
	         for incremental error tracking.

  */

  addError(error: any): void {
    const errors = this.getErrors();
    errors.push(error);
    this.setErrors(errors);
  }

  /*

           clearErrors()
	         ---
	         removes all errors from the error list
	         for clean compilation state.

  */

  clearErrors(): void {
    this.setErrors([]);
  }

  /*

           validate()
	         ---
	         validates component configuration including
	         script path existence and phase configuration
	         returning array of validation error messages.

  */

  validate(): string[] {
    const errors: string[] = [];

    /* validate script path */
    const scriptPath = this.getScriptPath();
    if (!scriptPath) {
      errors.push('Script path is required');
    } else if (!scriptPath.endsWith('.wc')) {
      errors.push('Script path must end with .wc extension');
    }

    /* validate enabled phases */
    const phases = this.getEnabledPhases();
    if (phases.length === 0) {
      errors.push('At least one lifecycle phase must be enabled');
    }

    /* validate execution order */
    const order = this.getExecutionOrder();
    if (!Number.isInteger(order)) {
      errors.push('Execution order must be an integer');
    }

    return errors;
  }

  /*

           clone()
	         ---
	         creates deep copy of the script component
	         with identical configuration and properties
	         for duplication operations.

  */

  clone(): ScriptComponent {
    const cloned = new ScriptComponent();

    /* copy all properties */
    for (const [key, property] of this._properties) {
      cloned.setProperty(key, structuredClone(property.value));
    }

    /* copy enabled state */
    cloned.enabled = this.enabled;

    return cloned;
  }

  /*

           serialize()
	         ---
	         converts script component to serializable data
	         for scene persistence and project saving
	         with complete property preservation.

  */

  serialize(): ComponentSerialData {
    const properties: Record<string, any> = {};

    for (const [key, property] of this._properties) {
      properties[key] = property.value;
    }

    return {
      id: this.id,
      type: this.type,
      enabled: this.enabled,
      version: this.version,
      properties,
      metadata: {
        created: this.metadata.created,
        modified: this.metadata.modified
      }
    };
  }

  /*

           deserialize()
	         ---
	         restores script component from serialized data
	         during scene loading and project restoration
	         with property validation and migration.

  */

  deserialize(data: ComponentSerialData): void {
    this._id = data.id;
    this._enabled = data.enabled;
    this._metadata = {
      created: new Date(data.metadata.created),
      modified: new Date(data.metadata.modified)
    };

    /* restore properties */
    for (const [key, value] of Object.entries(data.properties)) {
      if (this._properties.has(key)) {
        this.setProperty(key, value);
      }
    }

    /* handle version migration if needed */
    if (data.version < this.version) {
      this.migrateFromVersion(data.version);
    }
  }

  /*

           migrateFromVersion()
	         ---
	         handles component data migration from older
	         versions to maintain compatibility with
	         previous project file formats.

  */

  private migrateFromVersion(fromVersion: number): void {
    /* handle migration from older versions */
    if (fromVersion < 1) {
      /* initial version migration logic */
    }

    this.markModified();
  }

  /*

           markModified()
	         ---
	         updates modification timestamp for change
	         tracking and dirty state management.

  */

  protected markModified(): void {
    this._metadata.modified = new Date();
  }

  /*

           onEnabledChanged()
	         ---
	         handles enabled state change events for
	         script component lifecycle management.

  */

  protected onEnabledChanged(enabled: boolean): void {
    /* notify script system of enabled state change */
    console.log(`[ScriptComponent] ${this.id} enabled state changed: ${enabled}`);
  }

  /*

           dispose()
	         ---
	         cleans up script component resources including
	         property cleanup and event listener removal
	         for proper memory management.

  */

  dispose(): void {
    /* clear all properties */
    this._properties.clear();

    /* reset state */
    this._enabled = false;
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
