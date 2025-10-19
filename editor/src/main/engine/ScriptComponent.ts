/*
   ===============================================================
   WORLDEDIT SCRIPT COMPONENT SYSTEM
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

import { EventEmitter } from 'events'; /* NODE EVENT SYSTEM */
import * as path from 'path'; /* PATH MANIPULATION */
import * as fs from 'fs/promises'; /* ASYNC FILE SYSTEM */
import {
  WCCompilerIntegration,
  CompilationResult,
  CompilationTarget
} from './WCCompilerIntegration';
import { ComponentData } from '../../shared/types';

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

         ScriptExecutionContext
	       ---
	       runtime context for script execution containing entity
	       references, component access, and system interfaces
	       available to the executing script code.

*/

export interface ScriptExecutionContext {
  entityId: string /* unique entity identifier */;
  deltaTime?: number /* frame delta time for updates */;
  fixedDeltaTime?: number /* fixed timestep for physics */;
  gameTime?: number /* total elapsed game time */;
  frameCount?: number /* current frame number */;
  engineAPI?: any /* engine system access */;
}

/*

         ScriptProperties
	       ---
	       configuration properties for script component behavior
	       including execution settings, compilation options,
	       and runtime parameters for script management.

*/

export interface ScriptProperties {
  scriptPath: string /* path to source script file */;
  compiledPath?: string /* path to compiled output */;
  autoCompile: boolean /* automatically compile on changes */;
  enableHotReload: boolean /* enable hot-reload functionality */;
  executionOrder: number /* script execution priority */;
  enabledPhases: ScriptLifecyclePhase[] /* active lifecycle phases */;
  customProperties: Record<string, any> /* user-defined properties */;
}

/*

         ScriptInstance
	       ---
	       runtime instance of a compiled script containing
	       execution state, lifecycle methods, and property
	       values for a specific entity instance.

*/

export interface ScriptInstance {
  id: string /* unique instance identifier */;
  entityId: string /* owning entity reference */;
  compiledCode: any /* compiled script module */;
  state: ScriptState /* current execution state */;
  properties: Record<string, any> /* runtime property values */;
  lastExecutionTime?: number /* timestamp of last execution */;
  executionCount: number /* number of executions */;
  errors: ScriptError[] /* execution error history */;
}

/*

         ScriptState
	       ---
	       enumeration of script execution states tracking
	       the current phase and status of script lifecycle
	       management and execution monitoring.

*/

export enum ScriptState {
  UNINITIALIZED = 'uninitialized' /* script not yet prepared */,
  COMPILING = 'compiling' /* script being compiled */,
  READY = 'ready' /* script ready for execution */,
  RUNNING = 'running' /* script currently executing */,
  PAUSED = 'paused' /* script execution paused */,
  ERROR = 'error' /* script in error state */,
  DESTROYED = 'destroyed' /* script has been destroyed */
}

/*

         ScriptError
	       ---
	       error information for script compilation and execution
	       failures including diagnostic data, stack traces,
	       and recovery suggestions for debugging.

*/

export interface ScriptError {
  type: 'compilation' | 'runtime' | 'lifecycle';
  message: string /* error description */;
  stackTrace?: string /* execution stack trace */;
  sourceLocation?: {
    /* source code location */ line: number;
    column: number;
    filename: string;
  };
  timestamp: number /* error occurrence time */;
  phase?: ScriptLifecyclePhase /* lifecycle phase when error occurred */;
}

/*

         ScriptEvent
	       ---
	       event types emitted by the script component system
	       for monitoring script lifecycle, compilation status,
	       and execution progress.

*/

export enum ScriptEvent {
  COMPILATION_STARTED = 'compilationStarted',
  COMPILATION_COMPLETE = 'compilationComplete',
  COMPILATION_FAILED = 'compilationFailed',
  INSTANCE_CREATED = 'instanceCreated',
  INSTANCE_STARTED = 'instanceStarted',
  INSTANCE_DESTROYED = 'instanceDestroyed',
  EXECUTION_ERROR = 'executionError',
  HOT_RELOAD_APPLIED = 'hotReloadApplied'
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         ScriptComponent
	       ---
	       comprehensive script component system for attaching
	       and managing WORLDC scripts on entities. handles script
	       compilation, hot-reload, lifecycle management, and
	       execution context for entity-based scripting.

	       the component provides complete script integration
	       including automatic compilation, error handling,
	       property management, and event-driven communication
	       between scripts and the engine system.

*/

export class ScriptComponent extends EventEmitter {
  private static instanceCounter: number = 0;
  private static activeInstances: Map<string, ScriptInstance> = new Map();
  private static compiler: WCCompilerIntegration | null = null;

  private componentId: string;
  private entityId: string;
  private properties: ScriptProperties;
  private instance: ScriptInstance | null = null;
  private isInitialized: boolean = false;

  constructor(entityId: string, properties: ScriptProperties) {
    super();

    this.componentId = `script_${++ScriptComponent.instanceCounter}`;
    this.entityId = entityId;
    this.properties = { ...this.getDefaultProperties(), ...properties };

    /* initialize compiler if needed */
    if (!ScriptComponent.compiler) {
      ScriptComponent.compiler = new WCCompilerIntegration();
    }
  }

  /*

           initialize()
	       ---
	       initializes the script component by compiling the
	       source script, creating runtime instance, and
	       preparing execution context for lifecycle methods.

	       the method handles script compilation, error detection,
	       and instance preparation while setting up hot-reload
	       monitoring if enabled in component properties.

  */

  async initialize(): Promise<void> {
    try {
      /* ensure compiler is ready */
      if (!ScriptComponent.compiler?.isReady()) {
        await ScriptComponent.compiler?.initialize();
      }

      /* compile script if needed */
      await this.compileScript();

      /* create script instance */
      await this.createInstance();

      /* setup hot-reload if enabled */
      if (this.properties.enableHotReload) {
        await this.setupHotReload();
      }

      this.isInitialized = true;
      this.emit(ScriptEvent.INSTANCE_CREATED, this.instance);
    } catch (error) {
      const scriptError: ScriptError = {
        type: 'compilation',
        message: error instanceof Error ? error.message : 'Unknown initialization error',
        timestamp: Date.now()
      };

      this.handleError(scriptError);
      throw error;
    }
  }

  /*

           start()
	       ---
	       executes the script start lifecycle method if the
	       script instance is ready and the start phase is
	       enabled in the component configuration.

  */

  async start(): Promise<void> {
    if (!this.canExecutePhase(ScriptLifecyclePhase.START)) {
      return;
    }

    await this.executeLifecycleMethod(ScriptLifecyclePhase.START);
    this.emit(ScriptEvent.INSTANCE_STARTED, this.instance);
  }

  /*

           update()
	       ---
	       executes the script update lifecycle method with
	       delta time information for frame-based logic
	       processing and entity behavior updates.

  */

  async update(deltaTime: number): Promise<void> {
    if (!this.canExecutePhase(ScriptLifecyclePhase.UPDATE)) {
      return;
    }

    const context: ScriptExecutionContext = {
      entityId: this.entityId,
      deltaTime,
      gameTime: performance.now(),
      frameCount: this.instance?.executionCount || 0
    };

    await this.executeLifecycleMethod(ScriptLifecyclePhase.UPDATE, context);
  }

  /*

           fixedUpdate()
	       ---
	       executes the script fixed update lifecycle method
	       at consistent intervals for physics and time-sensitive
	       calculations independent of frame rate variations.

  */

  async fixedUpdate(fixedDeltaTime: number): Promise<void> {
    if (!this.canExecutePhase(ScriptLifecyclePhase.FIXED_UPDATE)) {
      return;
    }

    const context: ScriptExecutionContext = {
      entityId: this.entityId,
      fixedDeltaTime,
      gameTime: performance.now()
    };

    await this.executeLifecycleMethod(ScriptLifecyclePhase.FIXED_UPDATE, context);
  }

  /*

           lateUpdate()
	       ---
	       executes the script late update lifecycle method
	       after all regular updates for final processing
	       and cleanup operations in the frame cycle.

  */

  async lateUpdate(deltaTime: number): Promise<void> {
    if (!this.canExecutePhase(ScriptLifecyclePhase.LATE_UPDATE)) {
      return;
    }

    const context: ScriptExecutionContext = {
      entityId: this.entityId,
      deltaTime,
      gameTime: performance.now()
    };

    await this.executeLifecycleMethod(ScriptLifecyclePhase.LATE_UPDATE, context);
  }

  /*

           destroy()
	       ---
	       executes the script destroy lifecycle method and
	       cleans up script instance, compilation artifacts,
	       and runtime resources for proper component disposal.

  */

  async destroy(): Promise<void> {
    if (this.instance && this.canExecutePhase(ScriptLifecyclePhase.DESTROY)) {
      await this.executeLifecycleMethod(ScriptLifecyclePhase.DESTROY);
    }

    /* cleanup instance */
    if (this.instance) {
      this.instance.state = ScriptState.DESTROYED;
      ScriptComponent.activeInstances.delete(this.instance.id);
    }

    /* remove event listeners */
    this.removeAllListeners();

    this.emit(ScriptEvent.INSTANCE_DESTROYED, this.instance);
  }

  /*

           setProperty()
	       ---
	       updates a script property value and optionally
	       triggers hot-reload if the property change requires
	       script recompilation or instance refresh.

  */

  async setProperty(key: string, value: any, triggerReload: boolean = false): Promise<void> {
    this.properties.customProperties[key] = value;

    if (this.instance) {
      this.instance.properties[key] = value;
    }

    if (triggerReload && this.properties.enableHotReload) {
      await this.applyHotReload();
    }
  }

  /*

           getProperty()
	       ---
	       retrieves a script property value from the runtime
	       instance or component configuration with optional
	       default value for missing properties.

  */

  getProperty(key: string, defaultValue?: any): any {
    if (this.instance?.properties.hasOwnProperty(key)) {
      return this.instance.properties[key];
    }

    return this.properties.customProperties[key] ?? defaultValue;
  }

  /*

           getState()
	       ---
	       returns the current script execution state for
	       monitoring and debugging script lifecycle status
	       and execution progress.

  */

  getState(): ScriptState {
    return this.instance?.state || ScriptState.UNINITIALIZED;
  }

  /*

           getErrors()
	       ---
	       returns array of script errors including compilation
	       failures, runtime exceptions, and lifecycle errors
	       for debugging and error reporting.

  */

  getErrors(): ScriptError[] {
    return this.instance?.errors || [];
  }

  /*

           toComponentData()
	       ---
	       serializes script component to component data format
	       for scene persistence and entity serialization
	       while preserving property values and configuration.

  */

  toComponentData(): ComponentData {
    return {
      type: 'Script',
      enabled: this.instance ? this.instance.state !== ScriptState.DESTROYED : false,
      properties: {
        scriptPath: this.properties.scriptPath,
        autoCompile: this.properties.autoCompile,
        enableHotReload: this.properties.enableHotReload,
        executionOrder: this.properties.executionOrder,
        enabledPhases: this.properties.enabledPhases,
        customProperties: this.properties.customProperties
      }
    };
  }

  /*

           fromComponentData()
	       ---
	       creates script component from serialized component
	       data for scene loading and entity deserialization
	       with property restoration and configuration setup.

  */

  static fromComponentData(entityId: string, data: ComponentData): ScriptComponent {
    const properties: ScriptProperties = {
      scriptPath: (data.properties.scriptPath as string) || '',
      autoCompile: (data.properties.autoCompile as boolean) ?? true,
      enableHotReload: (data.properties.enableHotReload as boolean) ?? true,
      executionOrder: (data.properties.executionOrder as number) ?? 0,
      enabledPhases: (data.properties.enabledPhases as ScriptLifecyclePhase[]) || [
        ScriptLifecyclePhase.START,
        ScriptLifecyclePhase.UPDATE,
        ScriptLifecyclePhase.DESTROY
      ],
      customProperties: data.properties.customProperties || {}
    };

    return new ScriptComponent(entityId, properties);
  }

  /* PRIVATE METHODS */

  private getDefaultProperties(): ScriptProperties {
    return {
      scriptPath: '',
      autoCompile: true,
      enableHotReload: true,
      executionOrder: 0,
      enabledPhases: [
        ScriptLifecyclePhase.START,
        ScriptLifecyclePhase.UPDATE,
        ScriptLifecyclePhase.DESTROY
      ],
      customProperties: {}
    };
  }

  private async compileScript(): Promise<void> {
    if (!this.properties.scriptPath || !ScriptComponent.compiler) {
      throw new Error('Script path not specified or compiler not available');
    }

    /* check if script file exists */
    try {
      await fs.access(this.properties.scriptPath);
    } catch (error) {
      throw new Error(`Script file not found: ${this.properties.scriptPath}`);
    }

    /* read source code */
    const sourceCode = await fs.readFile(this.properties.scriptPath, 'utf-8');

    /* compile to TypeScript */
    this.emit(ScriptEvent.COMPILATION_STARTED, this.properties.scriptPath);

    const result: CompilationResult = await ScriptComponent.compiler.compile({
      sourceCode,
      filename: this.properties.scriptPath,
      target: CompilationTarget.TYPESCRIPT
    });

    if (!result.success) {
      const error: ScriptError = {
        type: 'compilation',
        message: `Compilation failed: ${result.diagnostics.map((d) => d.message).join(', ')}`,
        timestamp: Date.now()
      };

      this.emit(ScriptEvent.COMPILATION_FAILED, error);
      throw new Error(error.message);
    }

    /* save compiled output if specified */
    if (result.outputCode && this.properties.compiledPath) {
      await fs.writeFile(this.properties.compiledPath, result.outputCode, 'utf-8');
    }

    this.emit(ScriptEvent.COMPILATION_COMPLETE, result);
  }

  private async createInstance(): Promise<void> {
    const instanceId = `${this.componentId}_${Date.now()}`;

    this.instance = {
      id: instanceId,
      entityId: this.entityId,
      compiledCode: null /* will be loaded from compilation result */,
      state: ScriptState.READY,
      properties: { ...this.properties.customProperties },
      executionCount: 0,
      errors: []
    };

    ScriptComponent.activeInstances.set(instanceId, this.instance);
  }

  private async executeLifecycleMethod(
    phase: ScriptLifecyclePhase,
    context?: ScriptExecutionContext
  ): Promise<void> {
    if (!this.instance || this.instance.state !== ScriptState.READY) {
      return;
    }

    try {
      this.instance.state = ScriptState.RUNNING;
      this.instance.lastExecutionTime = Date.now();
      this.instance.executionCount++;

      /* execute the lifecycle method - this would call into the compiled script */
      /* for now, we'll simulate the execution */

      await this.simulateScriptExecution(phase, context);

      this.instance.state = ScriptState.READY;
    } catch (error) {
      const scriptError: ScriptError = {
        type: 'runtime',
        message: error instanceof Error ? error.message : 'Unknown runtime error',
        timestamp: Date.now(),
        phase
      };

      this.handleError(scriptError);
    }
  }

  private async simulateScriptExecution(
    phase: ScriptLifecyclePhase,
    context?: ScriptExecutionContext
  ): Promise<void> {
    /* this is a simulation - in real implementation, this would
       execute the compiled script method for the given phase */

    console.log(`[Script] Executing ${phase} for entity ${this.entityId}`, context);

    /* simulate some async work */
    await new Promise((resolve) => setTimeout(resolve, 1));
  }

  private canExecutePhase(phase: ScriptLifecyclePhase): boolean {
    return (
      this.isInitialized &&
      this.instance !== null &&
      this.instance.state === ScriptState.READY &&
      this.properties.enabledPhases.includes(phase)
    );
  }

  private async setupHotReload(): Promise<void> {
    /* setup file watching for hot-reload */
    /* this would integrate with WCHotReloadManager */
    console.log(`[Script] Hot-reload enabled for ${this.properties.scriptPath}`);
  }

  private async applyHotReload(): Promise<void> {
    try {
      /* recompile script */
      await this.compileScript();

      /* recreate instance */
      await this.createInstance();

      this.emit(ScriptEvent.HOT_RELOAD_APPLIED, this.instance);
    } catch (error) {
      const scriptError: ScriptError = {
        type: 'compilation',
        message: `Hot-reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };

      this.handleError(scriptError);
    }
  }

  private handleError(error: ScriptError): void {
    if (this.instance) {
      this.instance.errors.push(error);
      this.instance.state = ScriptState.ERROR;
    }

    this.emit(ScriptEvent.EXECUTION_ERROR, error);
    console.error(`[Script] ${error.type} error:`, error);
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
