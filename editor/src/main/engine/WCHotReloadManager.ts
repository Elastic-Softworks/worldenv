/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WC Hot Reload Manager
 *
 * Manages hot-reload functionality for WC code changes.
 * Watches files, detects changes, recompiles, and triggers
 * engine updates in real-time.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';
import {
  WCCompilerIntegration,
  CompilationResult,
  CompilationTarget,
  CompilerEvent
} from './WCCompilerIntegration';

export interface HotReloadConfig {
  watchPaths: string[];
  ignorePatterns: string[];
  debounceDelay: number;
  compilationTargets: CompilationTarget[];
  enableSourceMaps: boolean;
  enableTypeDeclarations: boolean;
}

export interface HotReloadEvent {
  type:
    | 'file-changed'
    | 'compilation-started'
    | 'compilation-complete'
    | 'compilation-error'
    | 'reload-triggered';
  filename?: string;
  result?: CompilationResult;
  error?: Error;
  timestamp: number;
}

export interface WatchedFile {
  path: string;
  lastModified: number;
  content: string;
  compilationResult?: CompilationResult;
}

export enum HotReloadState {
  IDLE = 'idle',
  WATCHING = 'watching',
  COMPILING = 'compiling',
  RELOADING = 'reloading',
  ERROR = 'error'
}

/**
 * WCHotReloadManager
 *
 * Main hot-reload management class. Orchestrates file watching,
 * compilation, and engine reload operations for seamless
 * development experience.
 */
export class WCHotReloadManager extends EventEmitter {
  private compiler: WCCompilerIntegration;
  private config: HotReloadConfig;
  private state: HotReloadState = HotReloadState.IDLE;
  private watcher: chokidar.FSWatcher | null = null;
  private watchedFiles: Map<string, WatchedFile> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private compilationQueue: Set<string> = new Set();
  private isProcessingQueue: boolean = false;

  constructor(compiler: WCCompilerIntegration, config?: Partial<HotReloadConfig>) {
    super();

    this.compiler = compiler;
    this.config = {
      watchPaths: ['./src', './scripts'],
      ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/*.tmp',
        '**/*.log'
      ],
      debounceDelay: 300,
      compilationTargets: [CompilationTarget.TYPESCRIPT],
      enableSourceMaps: true,
      enableTypeDeclarations: true,
      ...config
    };

    this.setupCompilerEvents();
  }

  /**
   * startWatching()
   *
   * Start watching WC files for changes.
   */
  async startWatching(): Promise<void> {
    if (this.state === HotReloadState.WATCHING) {
      return;
    }

    try {
      /* STOP EXISTING WATCHER */
      await this.stopWatching();

      /* CREATE NEW WATCHER */
      this.watcher = chokidar.watch(this.config.watchPaths, {
        ignored: this.config.ignorePatterns,
        persistent: true,
        ignoreInitial: false,
        followSymlinks: true,
        depth: undefined,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      /* SET UP EVENT HANDLERS */
      this.setupWatcherEvents();

      /* UPDATE STATE */
      this.state = HotReloadState.WATCHING;

      console.log('[HOTRELOAD] Started watching files:', this.config.watchPaths);
      this.emitHotReloadEvent({
        type: 'compilation-started',
        timestamp: Date.now()
      });
    } catch (error) {
      this.state = HotReloadState.ERROR;
      console.error('[HOTRELOAD] Failed to start watching:', error);
      throw error;
    }
  }

  /**
   * stopWatching()
   *
   * Stop watching files and clean up resources.
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    /* CLEAR DEBOUNCE TIMERS */
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    /* CLEAR QUEUES */
    this.compilationQueue.clear();
    this.isProcessingQueue = false;

    this.state = HotReloadState.IDLE;
    console.log('[HOTRELOAD] Stopped watching files');
  }

  /**
   * addWatchPath()
   *
   * Add a new path to watch for changes.
   */
  async addWatchPath(watchPath: string): Promise<void> {
    if (!this.config.watchPaths.includes(watchPath)) {
      this.config.watchPaths.push(watchPath);

      if (this.watcher) {
        this.watcher.add(watchPath);
      }

      console.log('[HOTRELOAD] Added watch path:', watchPath);
    }
  }

  /**
   * removeWatchPath()
   *
   * Remove a path from watching.
   */
  async removeWatchPath(watchPath: string): Promise<void> {
    const index = this.config.watchPaths.indexOf(watchPath);
    if (index !== -1) {
      this.config.watchPaths.splice(index, 1);

      if (this.watcher) {
        this.watcher.unwatch(watchPath);
      }

      console.log('[HOTRELOAD] Removed watch path:', watchPath);
    }
  }

  /**
   * forceRecompile()
   *
   * Force recompilation of all watched files.
   */
  async forceRecompile(): Promise<void> {
    if (this.state !== HotReloadState.WATCHING) {
      return;
    }

    console.log('[HOTRELOAD] Force recompiling all watched files');

    for (const filePath of this.watchedFiles.keys()) {
      if (this.isWCFile(filePath)) {
        this.compilationQueue.add(filePath);
      }
    }

    await this.processCompilationQueue();
  }

  /**
   * getWatchedFiles()
   *
   * Get list of currently watched files.
   */
  getWatchedFiles(): WatchedFile[] {
    return Array.from(this.watchedFiles.values());
  }

  /**
   * getConfig()
   *
   * Get current hot-reload configuration.
   */
  getConfig(): HotReloadConfig {
    return { ...this.config };
  }

  /**
   * updateConfig()
   *
   * Update hot-reload configuration.
   */
  async updateConfig(newConfig: Partial<HotReloadConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    /* RESTART WATCHING IF PATHS CHANGED */
    if (
      JSON.stringify(oldConfig.watchPaths) !== JSON.stringify(this.config.watchPaths) ||
      JSON.stringify(oldConfig.ignorePatterns) !== JSON.stringify(this.config.ignorePatterns)
    ) {
      if (this.state === HotReloadState.WATCHING) {
        await this.startWatching();
      }
    }

    console.log('[HOTRELOAD] Configuration updated');
  }

  /**
   * getState()
   *
   * Get current hot-reload state.
   */
  getState(): HotReloadState {
    return this.state;
  }

  /**
   * dispose()
   *
   * Clean up hot-reload manager resources.
   */
  async dispose(): Promise<void> {
    await this.stopWatching();
    this.watchedFiles.clear();
    this.removeAllListeners();
  }

  /**
   * setupCompilerEvents()
   *
   * Set up event handlers for compiler integration.
   */
  private setupCompilerEvents(): void {
    this.compiler.on(CompilerEvent.COMPILATION_STARTED, (request) => {
      this.state = HotReloadState.COMPILING;
      this.emitHotReloadEvent({
        type: 'compilation-started',
        filename: request.filename,
        timestamp: Date.now()
      });
    });

    this.compiler.on(CompilerEvent.COMPILATION_COMPLETE, (result) => {
      this.state = HotReloadState.WATCHING;
      this.emitHotReloadEvent({
        type: 'compilation-complete',
        result,
        timestamp: Date.now()
      });

      /* UPDATE WATCHED FILE RESULT */
      const watchedFile = this.findWatchedFileByName(result.target);
      if (watchedFile) {
        watchedFile.compilationResult = result;
      }

      /* TRIGGER RELOAD IF SUCCESSFUL */
      if (result.success) {
        this.triggerReload(result);
      }
    });

    this.compiler.on(CompilerEvent.COMPILATION_ERROR, (result) => {
      this.state = HotReloadState.ERROR;
      this.emitHotReloadEvent({
        type: 'compilation-error',
        result,
        timestamp: Date.now()
      });
    });
  }

  /**
   * setupWatcherEvents()
   *
   * Set up file watcher event handlers.
   */
  private setupWatcherEvents(): void {
    if (!this.watcher) return;

    this.watcher.on('add', (filePath) => {
      this.handleFileAdded(filePath);
    });

    this.watcher.on('change', (filePath) => {
      this.handleFileChanged(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this.handleFileRemoved(filePath);
    });

    this.watcher.on('error', (error) => {
      console.error('[HOTRELOAD] Watcher error:', error);
      this.state = HotReloadState.ERROR;
    });

    this.watcher.on('ready', () => {
      console.log('[HOTRELOAD] Initial scan complete');
    });
  }

  /**
   * handleFileAdded()
   *
   * Handle file addition event.
   */
  private async handleFileAdded(filePath: string): Promise<void> {
    if (!this.isWCFile(filePath)) {
      return;
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      const watchedFile: WatchedFile = {
        path: filePath,
        lastModified: stats.mtime.getTime(),
        content
      };

      this.watchedFiles.set(filePath, watchedFile);
      console.log('[HOTRELOAD] Added file:', filePath);

      /* COMPILE NEW FILE */
      this.queueCompilation(filePath);
    } catch (error) {
      console.error('[HOTRELOAD] Error adding file:', filePath, error);
    }
  }

  /**
   * handleFileChanged()
   *
   * Handle file change event.
   */
  private async handleFileChanged(filePath: string): Promise<void> {
    if (!this.isWCFile(filePath)) {
      return;
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      const existingFile = this.watchedFiles.get(filePath);
      if (existingFile && existingFile.content === content) {
        return; /* NO ACTUAL CHANGE */
      }

      const watchedFile: WatchedFile = {
        path: filePath,
        lastModified: stats.mtime.getTime(),
        content,
        compilationResult: existingFile?.compilationResult
      };

      this.watchedFiles.set(filePath, watchedFile);

      this.emitHotReloadEvent({
        type: 'file-changed',
        filename: filePath,
        timestamp: Date.now()
      });

      console.log('[HOTRELOAD] File changed:', filePath);

      /* DEBOUNCED COMPILATION */
      this.debouncedCompilation(filePath);
    } catch (error) {
      console.error('[HOTRELOAD] Error handling file change:', filePath, error);
    }
  }

  /**
   * handleFileRemoved()
   *
   * Handle file removal event.
   */
  private handleFileRemoved(filePath: string): void {
    if (this.watchedFiles.has(filePath)) {
      this.watchedFiles.delete(filePath);
      console.log('[HOTRELOAD] Removed file:', filePath);
    }

    /* CANCEL PENDING COMPILATION */
    this.compilationQueue.delete(filePath);
    const timer = this.debounceTimers.get(filePath);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(filePath);
    }
  }

  /**
   * debouncedCompilation()
   *
   * Schedule debounced compilation for file.
   */
  private debouncedCompilation(filePath: string): void {
    /* CLEAR EXISTING TIMER */
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    /* SET NEW TIMER */
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.queueCompilation(filePath);
    }, this.config.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * queueCompilation()
   *
   * Queue file for compilation.
   */
  private queueCompilation(filePath: string): void {
    this.compilationQueue.add(filePath);
    this.processCompilationQueue();
  }

  /**
   * processCompilationQueue()
   *
   * Process queued compilations.
   */
  private async processCompilationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.compilationQueue.size === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      for (const filePath of this.compilationQueue) {
        const watchedFile = this.watchedFiles.get(filePath);
        if (!watchedFile) {
          continue;
        }

        console.log('[HOTRELOAD] Compiling:', filePath);

        /* COMPILE FOR ALL TARGETS */
        for (const target of this.config.compilationTargets) {
          try {
            const result = await this.compiler.compile({
              sourceCode: watchedFile.content,
              filename: path.basename(filePath),
              target,
              options: {
                optimizationLevel: 'basic' as any,
                outputFormat: 'esm',
                minify: false,
                sourceMaps: this.config.enableSourceMaps,
                typeDeclarations: this.config.enableTypeDeclarations,
                strictMode: true
              }
            });

            watchedFile.compilationResult = result;
          } catch (error) {
            console.error('[HOTRELOAD] Compilation error for', filePath, error);
          }
        }
      }

      this.compilationQueue.clear();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * triggerReload()
   *
   * Trigger engine reload with compilation result.
   */
  private triggerReload(result: CompilationResult): void {
    this.state = HotReloadState.RELOADING;

    this.emitHotReloadEvent({
      type: 'reload-triggered',
      result,
      timestamp: Date.now()
    });

    /* NOTIFY ENGINE OF CODE UPDATE */
    /* This would integrate with the engine wrapper to reload scripts */
    console.log('[HOTRELOAD] Triggering reload for:', result.target);

    /* RETURN TO WATCHING STATE */
    setTimeout(() => {
      this.state = HotReloadState.WATCHING;
    }, 100);
  }

  /**
   * emitHotReloadEvent()
   *
   * Emit hot-reload event to listeners.
   */
  private emitHotReloadEvent(event: HotReloadEvent): void {
    this.emit('hotReloadEvent', event);
    this.emit(event.type, event);
  }

  /**
   * isWCFile()
   *
   * Check if file is a WC source file.
   */
  private isWCFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.wc' || ext === '.worldc';
  }

  /**
   * findWatchedFileByName()
   *
   * Find watched file by compilation target name.
   */
  private findWatchedFileByName(target: string): WatchedFile | undefined {
    /* This is a simplified lookup - in practice would need better mapping */
    return Array.from(this.watchedFiles.values())[0];
  }
}

/**
 * HotReloadManagerFactory
 *
 * Factory for creating hot-reload manager instances.
 */
export class HotReloadManagerFactory {
  /**
   * createDefault()
   *
   * Create default hot-reload manager.
   */
  public static createDefault(compiler: WCCompilerIntegration): WCHotReloadManager {
    return new WCHotReloadManager(compiler);
  }

  /**
   * createWithConfig()
   *
   * Create hot-reload manager with custom configuration.
   */
  public static createWithConfig(
    compiler: WCCompilerIntegration,
    config: Partial<HotReloadConfig>
  ): WCHotReloadManager {
    return new WCHotReloadManager(compiler, config);
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
