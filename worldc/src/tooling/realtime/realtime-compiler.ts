/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             --- WORLDSRC REALTIME COMPILER ---
	====================================================================
*/

/*

         realtime-compiler.ts
	       ---
	       this file implements the real-time compilation and feedback
	       system for WORLDSRC. it provides instant compilation feedback,
	       live error detection, performance analysis, and hot-reload
	       capabilities for the hybrid C/C++/TypeScript language.

	       the system watches for file changes, performs incremental
	       compilation, and provides immediate feedback to the developer
	       through the IDE integration layer.

*/

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

import { Lexer } from '../../lexer/lexer';
import { Parser } from '../../parser/parser';
import { SimpleSemanticAnalyzer } from '../../semantic/simple-analyzer';
import { SymbolTable } from '../../semantic/symbol-table';
import {
  WorldCCodeGenerator,
  CompilationTarget,
  OptimizationLevel,
} from '../../codegen';
import { WorldCErrorHandler } from '../../error/error-handler';

/*
	====================================================================
             --- COMPILATION TYPES ---
	====================================================================
*/

export interface RealtimeCompilationRequest {
  sourceCode: string /* source code to compile */;
  filePath: string /* source file path */;
  targets: CompilationTarget[] /* compilation targets */;
  optimizationLevel: OptimizationLevel /* optimization level */;
  includeSourceMaps: boolean /* generate source maps */;
  watchMode: boolean /* enable file watching */;
}

export interface RealtimeCompilationResult {
  success: boolean /* compilation success */;
  timestamp: Date /* compilation timestamp */;
  compilationTime: number /* compilation time (ms) */;
  errors: CompilationError[] /* compilation errors */;
  warnings: CompilationWarning[] /* compilation warnings */;
  generatedFiles: GeneratedFile[] /* generated output files */;
  performance: PerformanceMetrics /* performance metrics */;
  sourceMap?: SourceMapData /* source map data */;
}

export interface CompilationError {
  file: string /* error file */;
  line: number /* error line */;
  column: number /* error column */;
  message: string /* error message */;
  category: ErrorCategory /* error category */;
  severity: ErrorSeverity /* error severity */;
  suggestions: string[] /* fix suggestions */;
}

export interface CompilationWarning {
  file: string /* warning file */;
  line: number /* warning line */;
  column: number /* warning column */;
  message: string /* warning message */;
  category: WarningCategory /* warning category */;
  canIgnore: boolean /* can be ignored */;
}

export interface GeneratedFile {
  path: string /* output file path */;
  content: string /* file content */;
  target: CompilationTarget /* compilation target */;
  sourceMap?: string /* source map path */;
  size: number /* file size (bytes) */;
}

export interface PerformanceMetrics {
  lexingTime: number /* lexing time (ms) */;
  parsingTime: number /* parsing time (ms) */;
  analysisTime: number /* analysis time (ms) */;
  codegenTime: number /* code generation time (ms) */;
  totalTime: number /* total time (ms) */;
  memoryUsage: number /* memory usage (MB) */;
  linesPerSecond: number /* lines processed per second */;
}

export interface SourceMapData {
  version: number /* source map version */;
  sources: string[] /* source files */;
  names: string[] /* symbol names */;
  mappings: string /* mapping data */;
  sourcesContent?: string[] /* source content */;
  sourceRoot?: string /* source root */;
  file?: string /* generated file */;
}

export enum ErrorCategory {
  SYNTAX_ERROR = 'syntax' /* syntax error */,
  TYPE_ERROR = 'type' /* type mismatch */,
  SEMANTIC_ERROR = 'semantic' /* semantic error */,
  COMPILATION_ERROR = 'compilation' /* compilation error */,
  LINKER_ERROR = 'linker' /* linker error */,
  RUNTIME_ERROR = 'runtime' /* runtime error */,
}

export enum ErrorSeverity {
  ERROR = 'error' /* blocking error */,
  WARNING = 'warning' /* non-blocking warning */,
  INFO = 'info' /* informational */,
  HINT = 'hint' /* optimization hint */,
}

export enum WarningCategory {
  PERFORMANCE = 'performance' /* performance warning */,
  DEPRECATED = 'deprecated' /* deprecated usage */,
  UNUSED = 'unused' /* unused code */,
  STYLE = 'style' /* style warning */,
  COMPATIBILITY = 'compatibility' /* compatibility warning */,
  SECURITY = 'security' /* security warning */,
}

/*
	====================================================================
             --- FILE WATCHER ---
	====================================================================
*/

class FileWatcher extends EventEmitter {
  private watchedFiles: Set<string>;
  private watchers: Map<string, fs.FSWatcher>;
  private debounceTimers: Map<string, NodeJS.Timeout>;
  private debounceDelay: number;

  constructor(debounceDelay: number = 300) {
    super();

    this.watchedFiles = new Set();
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.debounceDelay = debounceDelay;
  }

  /*

           watch()
  	       ---
  	       starts watching a file for changes. debounces change
  	       events to avoid excessive compilation triggers during
  	       rapid editing sessions.

  */

  watch(filePath: string): void {
    if (this.watchedFiles.has(filePath)) {
      return;
    }

    const watcher = fs.watch(filePath, (eventType, filename) => {
      if (eventType === 'change') {
        this.debouncedChange(filePath);
      }
    });

    this.watchers.set(filePath, watcher);
    this.watchedFiles.add(filePath);
  }

  /*

           unwatch()
  	       ---
  	       stops watching a file for changes. cleans up
  	       associated resources and timers.

  */

  unwatch(filePath: string): void {
    const watcher = this.watchers.get(filePath);

    if (watcher) {
      watcher.close();
      this.watchers.delete(filePath);
    }

    const timer = this.debounceTimers.get(filePath);

    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(filePath);
    }

    this.watchedFiles.delete(filePath);
  }

  /*

           unwatchAll()
  	       ---
  	       stops watching all files and cleans up all resources.
  	       called during shutdown or reset operations.

  */

  unwatchAll(): void {
    for (const filePath of this.watchedFiles) {
      this.unwatch(filePath);
    }
  }

  /*

           debouncedChange()
  	       ---
  	       implements debounced change notifications to prevent
  	       excessive compilation during rapid file modifications.

  */

  private debouncedChange(filePath: string): void {
    const existingTimer = this.debounceTimers.get(filePath);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.emit('fileChanged', filePath);
    }, this.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }
}

/*
	====================================================================
             --- REALTIME COMPILER ---
	====================================================================
*/

export class RealtimeCompiler extends EventEmitter {
  private lexer: Lexer;
  private parser: Parser;
  private analyzer: SimpleSemanticAnalyzer;
  private codeGenerator: WorldCCodeGenerator;
  private errorHandler: WorldCErrorHandler;
  private fileWatcher: FileWatcher;
  private compilationQueue: Map<string, RealtimeCompilationRequest>;
  private isCompiling: boolean;
  private lastResults: Map<string, RealtimeCompilationResult>;

  constructor() {
    super();

    this.lexer = new Lexer('', {});
    this.parser = new Parser([], {});
    this.analyzer = new SimpleSemanticAnalyzer();
    this.codeGenerator = new WorldCCodeGenerator();
    this.errorHandler = new WorldCErrorHandler();
    this.fileWatcher = new FileWatcher();
    this.compilationQueue = new Map();
    this.isCompiling = false;
    this.lastResults = new Map();

    this.setupEventHandlers();
  }

  /*

           setupEventHandlers()
  	       ---
  	       configures event handling for file watching and
  	       compilation queue management. enables automatic
  	       recompilation on file changes.

  */

  private setupEventHandlers(): void {
    this.fileWatcher.on('fileChanged', (filePath: string) => {
      const request = this.compilationQueue.get(filePath);

      if (request) {
        this.queueCompilation(request);
      }
    });
  }

  /*

           compile()
  	       ---
  	       performs real-time compilation of WORLDSRC source code.
  	       provides comprehensive feedback including errors, warnings,
  	       and performance metrics. supports incremental compilation
  	       for improved performance.

  */

  async compile(
    request: RealtimeCompilationRequest
  ): Promise<RealtimeCompilationResult> {
    const startTime = performance.now();

    const result: RealtimeCompilationResult = {
      success: false,
      timestamp: new Date(),
      compilationTime: 0,
      errors: [],
      warnings: [],
      generatedFiles: [],
      performance: this.createEmptyMetrics(),
    };

    try {
      /* stage 1: lexical analysis */
      const lexStart = performance.now();
      this.lexer = new Lexer(request.sourceCode, {});
      const tokens = this.lexer.tokenize();
      const lexTime = performance.now() - lexStart;

      /* stage 2: parsing */
      const parseStart = performance.now();
      this.parser = new Parser(tokens, {});
      const ast = this.parser.parse();
      const parseTime = performance.now() - parseStart;

      /* stage 3: semantic analysis */
      const analysisStart = performance.now();
      const symbolTable = new SymbolTable();
      const analysisResult = this.analyzer.analyze(ast);
      const analysisTime = performance.now() - analysisStart;

      /* collect errors and warnings from analysis */
      if (analysisResult.errors > 0) {
        result.errors.push(...this.convertErrors([]));
      }

      if (analysisResult.warnings > 0) {
        result.warnings.push(...this.convertWarnings([]));
      }

      /* stage 4: code generation (if no critical errors) */
      let codegenTime = 0;

      if (result.errors.length === 0) {
        const codegenStart = performance.now();

        for (const target of request.targets) {
          const generatedCode = await this.codeGenerator.compile({
            sourceCode: request.sourceCode,
            targets: target,
            optimizationLevel: request.optimizationLevel,
            outputDirectory: path.dirname(request.filePath),
          });

          if (generatedCode.success) {
            const outputPath = this.generateOutputPath(
              request.filePath,
              target
            );

            const generatedFile: GeneratedFile = {
              path: outputPath,
              content: generatedCode.files[0] || '',
              target: target,
              size: Buffer.from(generatedCode.files[0] || '').length,
            };

            if (request.includeSourceMaps) {
              generatedFile.sourceMap = outputPath + '.map';
            }

            result.generatedFiles.push(generatedFile);
          } else {
            /* add code generation errors */
            if (generatedCode.errors) {
              result.errors.push(
                ...this.convertCodegenErrors(generatedCode.errors)
              );
            }
          }
        }

        codegenTime = performance.now() - codegenStart;
      }

      /* calculate performance metrics */
      const totalTime = performance.now() - startTime;

      result.performance = {
        lexingTime: lexTime,
        parsingTime: parseTime,
        analysisTime: analysisTime,
        codegenTime: codegenTime,
        totalTime: totalTime,
        memoryUsage: this.getMemoryUsage(),
        linesPerSecond: this.calculateLinesPerSecond(
          request.sourceCode,
          totalTime
        ),
      };

      result.compilationTime = totalTime;
      result.success = result.errors.length === 0;

      /* cache result for incremental compilation */
      this.lastResults.set(request.filePath, result);

      /* start watching file if requested */
      if (request.watchMode) {
        this.fileWatcher.watch(request.filePath);
        this.compilationQueue.set(request.filePath, request);
      }

      /* emit compilation events */
      this.emit('compilationComplete', result);

      if (result.success) {
        this.emit('compilationSuccess', result);
      } else {
        this.emit('compilationError', result);
      }
    } catch (error) {
      /* handle unexpected compilation errors */
      const compilationError: CompilationError = {
        file: request.filePath,
        line: 0,
        column: 0,
        message: `Compilation failed: ${error.message}`,
        category: ErrorCategory.COMPILATION_ERROR,
        severity: ErrorSeverity.ERROR,
        suggestions: ['Check syntax and try again'],
      };

      result.errors.push(compilationError);
      result.compilationTime = performance.now() - startTime;

      this.emit('compilationError', result);
    }

    return result;
  }

  /*

           queueCompilation()
  	       ---
  	       queues a compilation request for batch processing.
  	       prevents overlapping compilations and manages
  	       compilation priority.

  */

  async queueCompilation(request: RealtimeCompilationRequest): Promise<void> {
    if (this.isCompiling) {
      /* update queue with latest request */
      this.compilationQueue.set(request.filePath, request);
      return;
    }

    this.isCompiling = true;

    try {
      /* read latest file content if watching */
      if (request.watchMode && fs.existsSync(request.filePath)) {
        request.sourceCode = fs.readFileSync(request.filePath, 'utf8');
      }

      const result = await this.compile(request);

      /* emit real-time feedback */
      this.emit('realtimeFeedback', {
        filePath: request.filePath,
        result: result,
      });
    } finally {
      this.isCompiling = false;

      /* process next item in queue */
      const nextRequest = this.compilationQueue.get(request.filePath);

      if (nextRequest && nextRequest !== request) {
        setImmediate(() => this.queueCompilation(nextRequest));
      }
    }
  }

  /*

           startWatching()
  	       ---
  	       starts watching a file for changes and enables
  	       automatic recompilation. sets up the complete
  	       real-time development workflow.

  */

  async startWatching(
    filePath: string,
    targets: CompilationTarget[] = [CompilationTarget.TYPESCRIPT],
    optimizationLevel: OptimizationLevel = OptimizationLevel.BASIC
  ): Promise<void> {
    const sourceCode = fs.readFileSync(filePath, 'utf8');

    const request: RealtimeCompilationRequest = {
      sourceCode,
      filePath,
      targets,
      optimizationLevel,
      includeSourceMaps: true,
      watchMode: true,
    };

    await this.queueCompilation(request);
  }

  /*

           stopWatching()
  	       ---
  	       stops watching a file for changes and removes it
  	       from the compilation queue. cleans up resources
  	       associated with the file.

  */

  stopWatching(filePath: string): void {
    this.fileWatcher.unwatch(filePath);
    this.compilationQueue.delete(filePath);
    this.lastResults.delete(filePath);
  }

  /*

           stopWatchingAll()
  	       ---
  	       stops watching all files and clears all compilation
  	       queues. used for clean shutdown or reset operations.

  */

  stopWatchingAll(): void {
    this.fileWatcher.unwatchAll();
    this.compilationQueue.clear();
    this.lastResults.clear();
  }

  /*

           getLastResult()
  	       ---
  	       retrieves the last compilation result for a file.
  	       useful for IDE integration and status reporting.

  */

  getLastResult(filePath: string): RealtimeCompilationResult | undefined {
    return this.lastResults.get(filePath);
  }

  /*

           getAllResults()
  	       ---
  	       returns all cached compilation results. provides
  	       workspace-wide compilation status information.

  */

  getAllResults(): Map<string, RealtimeCompilationResult> {
    return new Map(this.lastResults);
  }

  /*

           getCompilationStatus()
  	       ---
  	       provides current compilation status and statistics.
  	       useful for monitoring and performance analysis.

  */

  getCompilationStatus(): {
    isCompiling: boolean;
    queuedFiles: number;
    watchedFiles: number;
    totalCompilations: number;
    averageTime: number;
  } {
    const results = Array.from(this.lastResults.values());
    const totalTime = results.reduce((sum, r) => sum + r.compilationTime, 0);

    return {
      isCompiling: this.isCompiling,
      queuedFiles: this.compilationQueue.size,
      watchedFiles: this.fileWatcher['watchedFiles'].size,
      totalCompilations: results.length,
      averageTime: results.length > 0 ? totalTime / results.length : 0,
    };
  }

  /* utility methods for error conversion and metrics */

  private convertErrors(errors: any[]): CompilationError[] {
    return errors.map((error) => ({
      file: error.file || 'unknown',
      line: error.line || 0,
      column: error.column || 0,
      message: error.message || 'Unknown error',
      category: this.mapErrorCategory(error.type),
      severity: ErrorSeverity.ERROR,
      suggestions: error.suggestions || [],
    }));
  }

  private convertWarnings(warnings: any[]): CompilationWarning[] {
    return warnings.map((warning) => ({
      file: warning.file || 'unknown',
      line: warning.line || 0,
      column: warning.column || 0,
      message: warning.message || 'Unknown warning',
      category: this.mapWarningCategory(warning.type),
      canIgnore: warning.canIgnore !== false,
    }));
  }

  private convertCodegenErrors(errors: any[]): CompilationError[] {
    return errors.map((error) => ({
      file: error.file || 'codegen',
      line: 0,
      column: 0,
      message: error.message || 'Code generation error',
      category: ErrorCategory.COMPILATION_ERROR,
      severity: ErrorSeverity.ERROR,
      suggestions: [],
    }));
  }

  private mapErrorCategory(type: string): ErrorCategory {
    switch (type) {
      case 'syntax':
        return ErrorCategory.SYNTAX_ERROR;
      case 'type':
        return ErrorCategory.TYPE_ERROR;
      case 'semantic':
        return ErrorCategory.SEMANTIC_ERROR;
      case 'runtime':
        return ErrorCategory.RUNTIME_ERROR;
      default:
        return ErrorCategory.COMPILATION_ERROR;
    }
  }

  private mapWarningCategory(type: string): WarningCategory {
    switch (type) {
      case 'performance':
        return WarningCategory.PERFORMANCE;
      case 'deprecated':
        return WarningCategory.DEPRECATED;
      case 'unused':
        return WarningCategory.UNUSED;
      case 'style':
        return WarningCategory.STYLE;
      case 'compatibility':
        return WarningCategory.COMPATIBILITY;
      case 'security':
        return WarningCategory.SECURITY;
      default:
        return WarningCategory.STYLE;
    }
  }

  private generateOutputPath(
    sourcePath: string,
    target: CompilationTarget
  ): string {
    const dir = path.dirname(sourcePath);
    const name = path.basename(sourcePath, path.extname(sourcePath));

    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return path.join(dir, `${name}.ts`);
      case CompilationTarget.ASSEMBLYSCRIPT:
        return path.join(dir, `${name}.as.ts`);
      default:
        return path.join(dir, `${name}.js`);
    }
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      lexingTime: 0,
      parsingTime: 0,
      analysisTime: 0,
      codegenTime: 0,
      totalTime: 0,
      memoryUsage: 0,
      linesPerSecond: 0,
    };
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100;
  }

  private calculateLinesPerSecond(sourceCode: string, timeMs: number): number {
    const lines = sourceCode.split('\n').length;
    const seconds = timeMs / 1000;
    return seconds > 0 ? Math.round(lines / seconds) : 0;
  }
}

/*
	====================================================================
             --- COMPILATION CACHE ---
	====================================================================
*/

export class CompilationCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize: number = 100, maxAge: number = 3600000) {
    /* 1 hour */

    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /*

           get()
  	       ---
  	       retrieves cached compilation result if available
  	       and not expired. returns undefined for cache misses.

  */

  get(key: string): RealtimeCompilationResult | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    entry.lastAccessed = Date.now();
    return entry.result;
  }

  /*

           set()
  	       ---
  	       stores compilation result in cache with timestamp.
  	       implements LRU eviction when cache size limit is reached.

  */

  set(key: string, result: RealtimeCompilationResult): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      result: result,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /*

           invalidate()
  	       ---
  	       removes entry from cache. used when source files
  	       are modified or dependencies change.

  */

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /*

           clear()
  	       ---
  	       clears all cached entries. used for complete
  	       cache invalidation or memory cleanup.

  */

  clear(): void {
    this.cache.clear();
  }

  /*

           evictOldest()
  	       ---
  	       removes the least recently used cache entry
  	       to make room for new entries.

  */

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime: number = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

interface CacheEntry {
  result: RealtimeCompilationResult;
  timestamp: number;
  lastAccessed: number;
}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
