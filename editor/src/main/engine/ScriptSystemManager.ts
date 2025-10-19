/*
   ===============================================================
   WORLDEDIT SCRIPT SYSTEM MANAGER
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
import { ScriptComponent, ScriptLifecyclePhase, ScriptEvent, ScriptState } from './ScriptComponent';
import { WCCompilerIntegration } from './WCCompilerIntegration';
import { WCHotReloadManager } from './WCHotReloadManager';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ScriptSystemConfig
	       ---
	       configuration for the script system manager controlling
	       compilation behavior, execution scheduling, and
	       hot-reload settings for the entire script system.

*/

export interface ScriptSystemConfig {
  enableAutoCompilation: boolean /* automatically compile scripts on changes */;
  enableHotReload: boolean /* enable hot-reload for all scripts */;
  executionFrameLimit: number /* max scripts to execute per frame */;
  compilationTimeout: number /* max time for script compilation */;
  debugMode: boolean /* enable debug logging and profiling */;
  scriptsDirectory: string /* default scripts directory path */;
}

/*

         ScriptSystemEvent
	       ---
	       events emitted by the script system manager for
	       monitoring system-wide script operations and
	       coordination between components.

*/

export enum ScriptSystemEvent {
  SYSTEM_INITIALIZED = 'systemInitialized',
  SYSTEM_SHUTDOWN = 'systemShutdown',
  BATCH_COMPILATION_STARTED = 'batchCompilationStarted',
  BATCH_COMPILATION_COMPLETE = 'batchCompilationComplete',
  EXECUTION_CYCLE_STARTED = 'executionCycleStarted',
  EXECUTION_CYCLE_COMPLETE = 'executionCycleComplete',
  SCRIPT_REGISTERED = 'scriptRegistered',
  SCRIPT_UNREGISTERED = 'scriptUnregistered',
  HOT_RELOAD_EVENT = 'hotReloadEvent'
}

/*

         ScriptExecutionStats
	       ---
	       performance statistics for script system execution
	       including timing metrics, execution counts, and
	       error tracking for system monitoring.

*/

export interface ScriptExecutionStats {
  totalScripts: number /* total registered scripts */;
  activeScripts: number /* currently active scripts */;
  executionsThisFrame: number /* executions in current frame */;
  averageExecutionTime: number /* average execution time */;
  totalExecutionTime: number /* cumulative execution time */;
  errorCount: number /* total error count */;
  hotReloadCount: number /* total hot reloads */;
  lastUpdateTime: number /* timestamp of last update */;
}

/*

         ScriptBatch
	       ---
	       batch of scripts grouped for coordinated execution
	       based on execution order, lifecycle phase, and
	       performance optimization requirements.

*/

export interface ScriptBatch {
  phase: ScriptLifecyclePhase /* execution phase for this batch */;
  scripts: ScriptComponent[] /* scripts in execution order */;
  totalExecutionTime: number /* estimated execution time */;
  priority: number /* batch execution priority */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         ScriptSystemManager
	       ---
	       central coordinator for the script component system
	       managing script registration, execution scheduling,
	       compilation coordination, and hot-reload orchestration
	       across all script components in the game.

	       the manager provides centralized control over script
	       lifecycle execution, performance optimization through
	       batching, and system-wide debugging and monitoring
	       capabilities for comprehensive script management.

*/

export class ScriptSystemManager extends EventEmitter {
  private static instance: ScriptSystemManager | null = null;

  private config: ScriptSystemConfig;
  private compiler: WCCompilerIntegration;
  private hotReloadManager: WCHotReloadManager;
  private registeredScripts: Map<string, ScriptComponent> = new Map();
  private executionBatches: Map<ScriptLifecyclePhase, ScriptBatch> = new Map();
  private isInitialized: boolean = false;
  private isExecuting: boolean = false;
  private stats: ScriptExecutionStats;
  private frameExecutionLimit: number;

  constructor(config?: Partial<ScriptSystemConfig>) {
    super();

    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };

    this.compiler = new WCCompilerIntegration();
    this.hotReloadManager = new WCHotReloadManager(this.compiler);
    this.frameExecutionLimit = this.config.executionFrameLimit;

    this.stats = this.initializeStats();

    this.setupEventHandlers();
  }

  /*

           getInstance()
	       ---
	       singleton access to the script system manager ensuring
	       only one instance manages all script components across
	       the entire application lifecycle.

  */

  static getInstance(config?: Partial<ScriptSystemConfig>): ScriptSystemManager {
    if (!ScriptSystemManager.instance) {
      ScriptSystemManager.instance = new ScriptSystemManager(config);
    }

    return ScriptSystemManager.instance;
  }

  /*

           initialize()
	       ---
	       initializes the script system by setting up the
	       compiler, hot-reload manager, and execution batches
	       while preparing the system for script registration
	       and execution coordination.

  */

  async initialize(): Promise<void> {
    try {
      /* initialize compiler */
      await this.compiler.initialize();

      /* initialize hot-reload manager */
      if (this.config.enableHotReload) {
        await this.hotReloadManager.startWatching([this.config.scriptsDirectory]);
      }

      /* setup execution batches */
      this.initializeExecutionBatches();

      this.isInitialized = true;
      this.emit(ScriptSystemEvent.SYSTEM_INITIALIZED);

      if (this.config.debugMode) {
        console.log('[ScriptSystem] Script system initialized');
      }
    } catch (error) {
      console.error('[ScriptSystem] Failed to initialize:', error);
      throw error;
    }
  }

  /*

           registerScript()
	       ---
	       registers a script component with the system for
	       execution coordination, compilation management,
	       and hot-reload monitoring while organizing scripts
	       into execution batches by lifecycle phase.

  */

  async registerScript(entityId: string, script: ScriptComponent): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Script system not initialized');
    }

    const scriptId = `${entityId}_script`;
    this.registeredScripts.set(scriptId, script);

    /* add to execution batches */
    this.addScriptToBatches(script);

    /* setup script event handlers */
    this.setupScriptEventHandlers(script);

    /* initialize script */
    await script.initialize();

    this.updateStats();
    this.emit(ScriptSystemEvent.SCRIPT_REGISTERED, { entityId, script });

    if (this.config.debugMode) {
      console.log(`[ScriptSystem] Script registered for entity: ${entityId}`);
    }
  }

  /*

           unregisterScript()
	       ---
	       removes a script component from the system, cleaning
	       up execution batches, event handlers, and resources
	       while ensuring proper script destruction lifecycle.

  */

  async unregisterScript(entityId: string): Promise<void> {
    const scriptId = `${entityId}_script`;
    const script = this.registeredScripts.get(scriptId);

    if (!script) {
      return;
    }

    /* remove from execution batches */
    this.removeScriptFromBatches(script);

    /* destroy script */
    await script.destroy();

    /* cleanup */
    this.registeredScripts.delete(scriptId);

    this.updateStats();
    this.emit(ScriptSystemEvent.SCRIPT_UNREGISTERED, { entityId, script });

    if (this.config.debugMode) {
      console.log(`[ScriptSystem] Script unregistered for entity: ${entityId}`);
    }
  }

  /*

           executeScripts()
	       ---
	       executes all registered scripts for the specified
	       lifecycle phase using batched execution for performance
	       optimization and frame-rate maintenance.

  */

  async executeScripts(phase: ScriptLifecyclePhase, deltaTime?: number): Promise<void> {
    if (!this.isInitialized || this.isExecuting) {
      return;
    }

    this.isExecuting = true;
    this.emit(ScriptSystemEvent.EXECUTION_CYCLE_STARTED, phase);

    const startTime = performance.now();
    let executedCount = 0;

    try {
      const batch = this.executionBatches.get(phase);
      if (!batch || batch.scripts.length === 0) {
        return;
      }

      /* execute scripts in batch with frame limit */
      for (const script of batch.scripts) {
        if (executedCount >= this.frameExecutionLimit) {
          break;
        }

        if (script.getState() === ScriptState.READY) {
          try {
            switch (phase) {
              case ScriptLifecyclePhase.START:
                await script.start();
                break;
              case ScriptLifecyclePhase.UPDATE:
                await script.update(deltaTime || 0);
                break;
              case ScriptLifecyclePhase.FIXED_UPDATE:
                await script.fixedUpdate(deltaTime || 0);
                break;
              case ScriptLifecyclePhase.LATE_UPDATE:
                await script.lateUpdate(deltaTime || 0);
                break;
              case ScriptLifecyclePhase.DESTROY:
                await script.destroy();
                break;
            }

            executedCount++;
          } catch (error) {
            console.error(`[ScriptSystem] Script execution error:`, error);
            this.stats.errorCount++;
          }
        }
      }
    } finally {
      const executionTime = performance.now() - startTime;
      this.updateExecutionStats(executedCount, executionTime);

      this.isExecuting = false;
      this.emit(ScriptSystemEvent.EXECUTION_CYCLE_COMPLETE, {
        phase,
        executedCount,
        executionTime
      });
    }
  }

  /*

           compileAllScripts()
	       ---
	       triggers compilation of all registered scripts in
	       parallel with progress reporting and error collection
	       for batch compilation operations.

  */

  async compileAllScripts(): Promise<void> {
    this.emit(ScriptSystemEvent.BATCH_COMPILATION_STARTED);

    const compilationPromises: Promise<void>[] = [];

    for (const script of this.registeredScripts.values()) {
      compilationPromises.push(
        script.initialize().catch((error) => {
          console.error('[ScriptSystem] Script compilation failed:', error);
        })
      );
    }

    await Promise.allSettled(compilationPromises);

    this.emit(ScriptSystemEvent.BATCH_COMPILATION_COMPLETE);

    if (this.config.debugMode) {
      console.log('[ScriptSystem] Batch compilation complete');
    }
  }

  /*

           getExecutionStats()
	       ---
	       returns current script system execution statistics
	       for performance monitoring and debugging analysis
	       of script system performance and behavior.

  */

  getExecutionStats(): ScriptExecutionStats {
    return { ...this.stats };
  }

  /*

           getRegisteredScripts()
	       ---
	       returns array of all currently registered script
	       components for system inspection and debugging
	       purposes with optional filtering capabilities.

  */

  getRegisteredScripts(): ScriptComponent[] {
    return Array.from(this.registeredScripts.values());
  }

  /*

           shutdown()
	       ---
	       shuts down the script system by destroying all
	       registered scripts, stopping hot-reload monitoring,
	       and cleaning up system resources.

  */

  async shutdown(): Promise<void> {
    /* stop hot-reload monitoring */
    if (this.config.enableHotReload) {
      await this.hotReloadManager.stopWatching();
    }

    /* destroy all scripts */
    const destroyPromises = Array.from(this.registeredScripts.keys()).map((entityId) =>
      this.unregisterScript(entityId.replace('_script', ''))
    );

    await Promise.allSettled(destroyPromises);

    /* cleanup */
    this.registeredScripts.clear();
    this.executionBatches.clear();

    this.isInitialized = false;
    this.emit(ScriptSystemEvent.SYSTEM_SHUTDOWN);

    if (this.config.debugMode) {
      console.log('[ScriptSystem] Script system shutdown complete');
    }
  }

  /* PRIVATE METHODS */

  private getDefaultConfig(): ScriptSystemConfig {
    return {
      enableAutoCompilation: true,
      enableHotReload: true,
      executionFrameLimit: 50,
      compilationTimeout: 30000,
      debugMode: false,
      scriptsDirectory: './scripts'
    };
  }

  private initializeStats(): ScriptExecutionStats {
    return {
      totalScripts: 0,
      activeScripts: 0,
      executionsThisFrame: 0,
      averageExecutionTime: 0,
      totalExecutionTime: 0,
      errorCount: 0,
      hotReloadCount: 0,
      lastUpdateTime: Date.now()
    };
  }

  private initializeExecutionBatches(): void {
    const phases = [
      ScriptLifecyclePhase.AWAKE,
      ScriptLifecyclePhase.START,
      ScriptLifecyclePhase.UPDATE,
      ScriptLifecyclePhase.FIXED_UPDATE,
      ScriptLifecyclePhase.LATE_UPDATE,
      ScriptLifecyclePhase.DESTROY
    ];

    for (const phase of phases) {
      this.executionBatches.set(phase, {
        phase,
        scripts: [],
        totalExecutionTime: 0,
        priority: this.getPhasePriority(phase)
      });
    }
  }

  private getPhasePriority(phase: ScriptLifecyclePhase): number {
    const priorities = {
      [ScriptLifecyclePhase.AWAKE]: 1000,
      [ScriptLifecyclePhase.START]: 900,
      [ScriptLifecyclePhase.UPDATE]: 500,
      [ScriptLifecyclePhase.FIXED_UPDATE]: 600,
      [ScriptLifecyclePhase.LATE_UPDATE]: 400,
      [ScriptLifecyclePhase.DESTROY]: 100
    };

    return priorities[phase] || 0;
  }

  private addScriptToBatches(script: ScriptComponent): void {
    /* add script to all relevant execution batches based on enabled phases */
    for (const [phase, batch] of this.executionBatches) {
      /* check if script supports this phase */
      const scriptData = script.toComponentData();
      const enabledPhases = Array.isArray(scriptData.properties.enabledPhases)
        ? scriptData.properties.enabledPhases
        : [];

      if (enabledPhases.includes(phase)) {
        batch.scripts.push(script);
        this.sortBatchByExecutionOrder(batch);
      }
    }
  }

  private removeScriptFromBatches(script: ScriptComponent): void {
    for (const batch of this.executionBatches.values()) {
      const index = batch.scripts.indexOf(script);
      if (index >= 0) {
        batch.scripts.splice(index, 1);
      }
    }
  }

  private sortBatchByExecutionOrder(batch: ScriptBatch): void {
    batch.scripts.sort((a, b) => {
      const orderA: number =
        typeof a.toComponentData().properties.executionOrder === 'number'
          ? (a.toComponentData().properties.executionOrder as number)
          : 0;
      const orderB: number =
        typeof b.toComponentData().properties.executionOrder === 'number'
          ? (b.toComponentData().properties.executionOrder as number)
          : 0;
      return orderA - orderB;
    });
  }

  private setupEventHandlers(): void {
    /* setup hot-reload event handlers */
    this.hotReloadManager.on('fileChanged', this.handleHotReload.bind(this));
    this.hotReloadManager.on('compilationComplete', this.handleCompilationComplete.bind(this));
  }

  private setupScriptEventHandlers(script: ScriptComponent): void {
    script.on(ScriptEvent.HOT_RELOAD_APPLIED, () => {
      this.stats.hotReloadCount++;
      this.emit(ScriptSystemEvent.HOT_RELOAD_EVENT, script);
    });

    script.on(ScriptEvent.EXECUTION_ERROR, (error) => {
      this.stats.errorCount++;
      if (this.config.debugMode) {
        console.error('[ScriptSystem] Script execution error:', error);
      }
    });
  }

  private handleHotReload(filePath: string): void {
    /* find scripts using this file and trigger reload */
    for (const script of this.registeredScripts.values()) {
      const scriptData = script.toComponentData();
      if (scriptData.properties.scriptPath === filePath) {
        script.setProperty('_hotReloadTrigger', Date.now(), true).catch((error) => {
          console.error('[ScriptSystem] Hot-reload failed:', error);
        });
      }
    }

    this.emit(ScriptSystemEvent.HOT_RELOAD_EVENT, filePath);
  }

  private handleCompilationComplete(result: any): void {
    if (this.config.debugMode) {
      console.log('[ScriptSystem] Compilation complete:', result);
    }
  }

  private updateStats(): void {
    this.stats.totalScripts = this.registeredScripts.size;
    this.stats.activeScripts = Array.from(this.registeredScripts.values()).filter(
      (script) => script.getState() === ScriptState.READY
    ).length;
    this.stats.lastUpdateTime = Date.now();
  }

  private updateExecutionStats(executedCount: number, executionTime: number): void {
    this.stats.executionsThisFrame = executedCount;
    this.stats.totalExecutionTime += executionTime;

    /* calculate average execution time */
    const totalExecutions =
      this.stats.executionsThisFrame + (this.stats.averageExecutionTime > 0 ? 1 : 0);

    if (totalExecutions > 0) {
      this.stats.averageExecutionTime =
        (this.stats.averageExecutionTime + executionTime) / totalExecutions;
    }

    this.stats.lastUpdateTime = Date.now();
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
