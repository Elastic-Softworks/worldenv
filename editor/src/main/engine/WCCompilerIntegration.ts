/*
   ===============================================================
   WORLDEDIT WC COMPILER INTEGRATION
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
import * as fsSync from 'fs'; /* SYNC FILE SYSTEM ACCESS */
import { exec } from 'child_process'; /* PROCESS EXECUTION */
import { promisify } from 'util'; /* PROMISE UTILITIES */

/* WORLDC COMPILER MODULES - Use direct require for now */
// We'll use direct require since the module structure is complex

const execAsync = promisify(exec);

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         CompilationRequest
	       ---
	       interface defining compilation request parameters
	       including source code, filename, target platform,
	       and optional compilation configuration settings.

*/

export interface CompilationRequest {
  sourceCode: string;
  filename: string;
  target: CompilationTarget;
  options?: CompilationOptions;
}

/*

         CompilationResult
	       ---
	       comprehensive result data from WorldC compilation
	       including success status, generated output, diagnostic
	       information, and detailed timing metrics for performance
	       analysis and debugging purposes.

*/

export interface CompilationResult {
  success: boolean /* compilation completed successfully */;
  target: CompilationTarget /* target platform for compilation */;
  outputCode?: string /* generated code output */;
  outputFiles?: string[] /* list of generated output files */;
  diagnostics: CompilationDiagnostic[] /* error messages and issues */;
  warnings: CompilationDiagnostic[] /* warning messages */;
  timing: {
    lexingTime: number /* lexical analysis duration */;
    parsingTime: number /* parsing phase duration */;
    codeGenerationTime: number /* code generation duration */;
    totalTime: number /* total compilation time */;
  };
}

/*

         CompilationDiagnostic
	       ---
	       diagnostic message structure for compilation errors,
	       warnings, and informational messages. includes location
	       information and severity classification for proper
	       error reporting and debugging assistance.

*/

export interface CompilationDiagnostic {
  severity: 'error' | 'warning' | 'info' /* message severity level */;
  message: string /* human-readable diagnostic message */;
  filename?: string /* source file where issue occurred */;
  line?: number /* line number of the issue */;
  column?: number /* column position of the issue */;
  code?: string /* diagnostic code identifier */;
}

/*

         CompilationOptions
	       ---
	       configuration options for WorldC compilation behavior
	       controlling optimization, output format, source maps,
	       type generation, and strict mode enforcement for
	       customized compilation results.

*/

export interface CompilationOptions {
  optimizationLevel: OptimizationLevel /* code optimization level */;
  outputFormat: 'esm' | 'cjs' | 'iife' /* JavaScript module format */;
  minify: boolean /* enable code minification */;
  sourceMaps: boolean /* generate source map files */;
  typeDeclarations: boolean /* generate TypeScript declarations */;
  strictMode: boolean /* enforce strict compilation rules */;
}

/*

         CompilationTarget
	       ---
	       enumeration of supported compilation target platforms
	       for WorldC code generation. defines output languages
	       and execution environments for compiled scripts.

*/

export enum CompilationTarget {
  TYPESCRIPT = 'typescript' /* compile to TypeScript output */,
  ASSEMBLYSCRIPT = 'assemblyscript' /* compile to AssemblyScript */,
  BOTH = 'both' /* compile to both target formats */
}

/*

         OptimizationLevel
	       ---
	       compilation optimization levels controlling code
	       generation strategies and performance optimizations
	       applied during the compilation process.

*/

export enum OptimizationLevel {
  NONE = 'none' /* no optimization applied */,
  BASIC = 'basic' /* basic optimization techniques */,
  AGGRESSIVE = 'aggressive' /* maximum optimization level */
}

/*

         CompilerEvent
	       ---
	       enumeration of events emitted by the WorldC compiler
	       integration system for monitoring compilation progress
	       and handling asynchronous compilation workflows.

*/

export enum CompilerEvent {
  COMPILATION_STARTED = 'compilationStarted' /* compilation process began */,
  COMPILATION_COMPLETE = 'compilationComplete' /* compilation finished successfully */,
  COMPILATION_ERROR = 'compilationError' /* compilation failed with errors */,
  HOT_RELOAD_TRIGGERED = 'hotReloadTriggered' /* hot reload process initiated */,
  DIAGNOSTICS_UPDATED = 'diagnosticsUpdated' /* diagnostic information updated */
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         WCCompilerIntegration
	       ---
	       comprehensive WorldC compiler integration system that
	       manages compilation requests, orchestrates compiler
	       processes, and provides hot-reload capabilities for
	       real-time development workflows.

	       the integration handles asynchronous compilation queuing,
	       compiler process management, diagnostic reporting, and
	       hot-reload coordination to enable seamless WorldC
	       development within the editor environment.

*/
export class WCCompilerIntegration extends EventEmitter {
  private isInitialized: boolean = false;
  private compilerPath: string;
  private workingDirectory: string;
  private currentRequest: CompilationRequest | null = null;
  private lastResult: CompilationResult | null = null;
  private compilationQueue: CompilationRequest[] = [];
  private isCompiling: boolean = false;

  constructor(compilerPath?: string, workingDirectory?: string) {
    super();

    this.compilerPath = compilerPath || this.findWCCompiler();
    this.workingDirectory = workingDirectory || process.cwd();
  }

  /*

           initialize()
  	       ---
  	       initializes the WorldC compiler integration by setting
  	       up the working directory, verifying compiler availability,
  	       and preparing the compilation environment for script
  	       processing and hot-reload functionality.

  	       the method ensures the compiler is properly configured
  	       and accessible before enabling compilation features
  	       in the editor interface.

  */
  async initialize(): Promise<void> {
    try {
      /* SET UP WORKING DIRECTORY */
      await this.setupWorkingDirectory();

      /* VERIFY COMPILER EXISTS */
      await this.verifyCompiler();

      this.isInitialized = true;
      console.log('[WC] Compiler integration initialized');
    } catch (error) {
      console.error('[WC] Failed to initialize compiler:', error);
      throw error;
    }
  }

  /*

           compile()
  	       ---
  	       compiles WorldC source code to the specified target
  	       platform with comprehensive error handling, diagnostic
  	       reporting, and performance timing. manages compilation
  	       queue and provides detailed compilation results.

  	       the method handles both synchronous and asynchronous
  	       compilation workflows while maintaining compilation
  	       state and providing progress notifications through
  	       the event system.

  */
  async compile(request: CompilationRequest): Promise<CompilationResult> {
    if (!this.isInitialized) {
      throw new Error('Compiler integration not initialized');
    }

    /* QUEUE COMPILATION IF BUSY */
    if (this.isCompiling) {
      this.compilationQueue.push(request);
      return new Promise((resolve) => {
        const handler = (result: CompilationResult) => {
          if (result.target === request.target) {
            this.removeListener(CompilerEvent.COMPILATION_COMPLETE, handler);
            resolve(result);
          }
        };
        this.on(CompilerEvent.COMPILATION_COMPLETE, handler);
      });
    }

    return await this.performCompilation(request);
  }

  /*

           compileToTypeScript()
  	       ---
  	       compiles WorldC source code to TypeScript output
  	       with proper type generation and module formatting.
  	       handles TypeScript-specific optimizations and
  	       compatibility requirements for seamless integration.

  	       the method provides high-quality TypeScript output
  	       suitable for modern JavaScript environments and
  	       maintains type safety throughout the compilation.

  */
  async compileToTypeScript(
    sourceCode: string,
    filename: string = 'input.wc',
    options?: Partial<CompilationOptions>
  ): Promise<CompilationResult> {
    const request: CompilationRequest = {
      sourceCode,
      filename,
      target: CompilationTarget.TYPESCRIPT,
      options: {
        optimizationLevel: OptimizationLevel.BASIC,
        outputFormat: 'esm',
        minify: false,
        sourceMaps: true,
        typeDeclarations: true,
        strictMode: true,
        ...options
      }
    };

    return await this.compile(request);
  }

  /*

           compileToAssemblyScript()
  	       ---
  	       compiles WorldC source code to AssemblyScript for
  	       high-performance WebAssembly execution. applies
  	       AssemblyScript-specific optimizations and memory
  	       management strategies for efficient runtime performance.

  	       the method generates optimized AssemblyScript code
  	       suitable for WebAssembly compilation and execution
  	       in performance-critical applications.

  */
  async compileToAssemblyScript(
    sourceCode: string,
    filename: string = 'input.wc',
    options?: Partial<CompilationOptions>
  ): Promise<CompilationResult> {
    const request: CompilationRequest = {
      sourceCode,
      filename,
      target: CompilationTarget.ASSEMBLYSCRIPT,
      options: {
        optimizationLevel: OptimizationLevel.AGGRESSIVE,
        outputFormat: 'esm',
        minify: true,
        sourceMaps: false,
        typeDeclarations: false,
        strictMode: true,
        ...options
      }
    };

    return await this.compile(request);
  }

  /*

           validateSource()
  	       ---
  	       validates WorldC source code syntax and semantics
  	       without performing full compilation. provides rapid
  	       feedback for syntax errors, type mismatches, and
  	       semantic issues during development.

  	       the method enables real-time validation in the editor
  	       for immediate error detection and correction without
  	       the overhead of complete compilation passes.

  */
  async validateSource(
    sourceCode: string,
    filename: string = 'input.wc'
  ): Promise<{
    valid: boolean;
    diagnostics: CompilationDiagnostic[];
    warnings: CompilationDiagnostic[];
  }> {
    try {
      /* WRITE SOURCE TO TEMP FILE */
      const tempFile = path.join(this.workingDirectory, `temp_${Date.now()}.wc`);
      await fs.writeFile(tempFile, sourceCode, 'utf8');

      try {
        /* RUN VALIDATION COMMAND */
        const cmd = `"${this.compilerPath}" validate "${tempFile}"`;
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: this.workingDirectory,
          timeout: 10000
        });

        /* PARSE VALIDATION OUTPUT */
        const result = this.parseValidationOutput(stdout, stderr);

        return {
          valid: result.diagnostics.filter((d) => d.severity === 'error').length === 0,
          diagnostics: result.diagnostics,
          warnings: result.warnings
        };
      } finally {
        /* CLEAN UP TEMP FILE */
        try {
          await fs.unlink(tempFile);
        } catch (error) {
          /* IGNORE CLEANUP ERRORS */
        }
      }
    } catch (error) {
      return {
        valid: false,
        diagnostics: [
          {
            severity: 'error',
            message: `Validation failed: ${error}`,
            filename
          }
        ],
        warnings: []
      };
    }
  }

  /**
   * getLastResult()
   *
   * Get the last compilation result.
   */
  getLastResult(): CompilationResult | null {
    return this.lastResult;
  }

  /*

           compileScript()
  	       ---
  	       alias method for script compilation that matches the
  	       expected interface used by EngineCommunicationManager.
  	       compiles the specified script file to the target format.

  */
  async compileScript(scriptPath: string, target: string): Promise<any> {
    const sourceCode = await fs.readFile(scriptPath, 'utf-8');
    const filename = path.basename(scriptPath);

    const request: CompilationRequest = {
      sourceCode,
      filename,
      target: target as CompilationTarget,
      options: {
        optimizationLevel: OptimizationLevel.BASIC,
        outputFormat: 'esm',
        minify: false,
        sourceMaps: true,
        typeDeclarations: false,
        strictMode: false
      }
    };

    return await this.compile(request);
  }

  /*

           validateScript()
  	       ---
  	       alias method for script validation that matches the
  	       expected interface used by EngineCommunicationManager.
  	       validates script content without full compilation.

  */
  async validateScript(scriptContent: string, filePath: string): Promise<any> {
    return await this.validateSource(scriptContent, filePath);
  }

  /**
   * isReady()
   *
   * Check if compiler is ready for compilation.
   */
  isReady(): boolean {
    return this.isInitialized && !this.isCompiling;
  }

  /*

           dispose()
  	       ---
  	       performs comprehensive cleanup of compiler resources
  	       including process termination, file cleanup, and
  	       event listener removal. ensures proper shutdown
  	       without resource leaks or hanging processes.

  	       the method coordinates cleanup of all compiler
  	       subsystems and prepares for clean integration
  	       restart if needed.

  */
  dispose(): void {
    this.isInitialized = false;
    this.currentRequest = null;
    this.lastResult = null;
    this.compilationQueue = [];
    this.isCompiling = false;
    this.removeAllListeners();
  }

  /**
   * readOutputFile()
   *
   * Read compiled output file.
   */
  private async readOutputFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.warn(`[WC] Could not read output file ${filePath}: ${error}`);
      return '';
    }
  }

  /**
   * findWCCompiler()
   *
   * Locate WC compiler executable.
   */
  private findWCCompiler(): string {
    /* LOOK FOR WC IN STANDARD LOCATIONS */
    const possiblePaths = [
      path.join(__dirname, '../../../worldc/dist/src/index.js'),
      path.join(process.cwd(), 'worldc/dist/src/index.js'),
      path.join(__dirname, '../../../../worldc/dist/src/index.js'),
      'worldc' /* ASSUME IN PATH */
    ];

    for (const compilerPath of possiblePaths) {
      try {
        /* FOR NODE.JS FILES, CHECK IF THEY EXIST */
        if (compilerPath.endsWith('.js')) {
          if (fsSync.existsSync(compilerPath)) {
            return `node "${compilerPath}"`;
          }
        }
      } catch (error) {
        /* CONTINUE SEARCHING */
      }
    }

    /* DEFAULT TO ASSUME WC IS IN PATH */
    return 'worldc';
  }

  /**
   * verifyCompiler()
   *
   * Verify that WC compiler is available and working.
   */
  private async verifyCompiler(): Promise<void> {
    try {
      const cmd = `${this.compilerPath} --version`;
      const { stdout } = await execAsync(cmd, { timeout: 5000 });
      console.log('[WC] Compiler version:', stdout.trim());
    } catch (error) {
      throw new Error(`WC compiler not found or not working: ${error}`);
    }
  }

  /**
   * setupWorkingDirectory()
   *
   * Set up working directory for compilation.
   */
  private async setupWorkingDirectory(): Promise<void> {
    try {
      await fs.access(this.workingDirectory);
    } catch (error) {
      await fs.mkdir(this.workingDirectory, { recursive: true });
    }
  }

  /**
   * performCompilation()
   *
   * Perform actual compilation process.
   */
  private async performCompilation(request: CompilationRequest): Promise<CompilationResult> {
    this.isCompiling = true;
    this.currentRequest = request;
    const startTime = Date.now();

    this.emit(CompilerEvent.COMPILATION_STARTED, request);

    try {
      /* WRITE SOURCE TO TEMP FILE */
      const tempFile = path.join(
        this.workingDirectory,
        `compile_${Date.now()}_${request.filename}`
      );
      await fs.writeFile(tempFile, request.sourceCode, 'utf8');

      try {
        /* BUILD COMPILATION COMMAND */
        const cmd = this.buildCompilationCommand(tempFile, request);

        /* EXECUTE COMPILATION */
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: this.workingDirectory,
          timeout: 30000
        });

        /* PARSE COMPILATION RESULT */
        const result = await this.parseCompilationResult(request, stdout, stderr, startTime);

        this.lastResult = result;
        this.emit(CompilerEvent.COMPILATION_COMPLETE, result);

        return result;
      } finally {
        /* CLEAN UP TEMP FILE */
        try {
          await fs.unlink(tempFile);
        } catch (error) {
          /* IGNORE CLEANUP ERRORS */
        }
      }
    } catch (error) {
      const result: CompilationResult = {
        success: false,
        target: request.target,
        diagnostics: [
          {
            severity: 'error',
            message: `Compilation failed: ${error}`,
            filename: request.filename
          }
        ],
        warnings: [],
        timing: {
          lexingTime: 0,
          parsingTime: 0,
          codeGenerationTime: 0,
          totalTime: Date.now() - startTime
        }
      };

      this.emit(CompilerEvent.COMPILATION_ERROR, result);
      return result;
    } finally {
      this.isCompiling = false;
      this.currentRequest = null;

      /* PROCESS QUEUED COMPILATIONS */
      if (this.compilationQueue.length > 0) {
        const nextRequest = this.compilationQueue.shift()!;
        setImmediate(() => this.performCompilation(nextRequest));
      }
    }
  }

  /**
   * buildCompilationCommand()
   *
   * Build WorldC compiler command with options.
   */
  private buildCompilationCommand(inputFile: string, request: CompilationRequest): string {
    const options = request.options || {
      optimizationLevel: OptimizationLevel.BASIC,
      outputFormat: 'esm',
      minify: false,
      sourceMaps: true,
      typeDeclarations: true,
      strictMode: true
    };

    let cmd = `${this.compilerPath} compile "${inputFile}"`;
    cmd += ` --target ${request.target}`;
    cmd += ` --optimization ${options.optimizationLevel}`;
    cmd += ` --format ${options.outputFormat}`;

    if (options.minify) cmd += ' --minify';
    if (options.sourceMaps) cmd += ' --source-maps';
    if (options.typeDeclarations) cmd += ' --declarations';
    if (options.strictMode) cmd += ' --strict';

    return cmd;
  }

  /**
   * parseCompilationResult()
   *
   * Parse compilation output into structured result.
   */
  private async parseCompilationResult(
    request: CompilationRequest,
    stdout: string,
    stderr: string,
    startTime: number
  ): Promise<CompilationResult> {
    const result: CompilationResult = {
      success: stderr.length === 0,
      target: request.target,
      diagnostics: [],
      warnings: [],
      timing: {
        lexingTime: 0,
        parsingTime: 0,
        codeGenerationTime: 0,
        totalTime: Date.now() - startTime
      }
    };

    /* PARSE STDOUT FOR OUTPUT CODE */
    if (stdout.trim()) {
      try {
        const output = JSON.parse(stdout);
        if (output.code) {
          result.outputCode = output.code;
        }
        if (output.files) {
          result.outputFiles = output.files;
        }
        if (output.timing) {
          result.timing = { ...result.timing, ...output.timing };
        }
      } catch (error) {
        /* FALLBACK: TREAT STDOUT AS DIRECT OUTPUT */
        result.outputCode = stdout;
      }
    }

    /* PARSE STDERR FOR DIAGNOSTICS */
    if (stderr.trim()) {
      const diagnostics = this.parseDiagnostics(stderr, request.filename);
      result.diagnostics = diagnostics.filter((d) => d.severity === 'error');
      result.warnings = diagnostics.filter((d) => d.severity === 'warning');
      result.success = result.diagnostics.length === 0;
    }

    return result;
  }

  /**
   * parseValidationOutput()
   *
   * Parse validation output into diagnostics.
   */
  private parseValidationOutput(
    stdout: string,
    stderr: string
  ): {
    diagnostics: CompilationDiagnostic[];
    warnings: CompilationDiagnostic[];
  } {
    const allDiagnostics = this.parseDiagnostics(stderr + stdout);

    return {
      diagnostics: allDiagnostics.filter((d) => d.severity === 'error'),
      warnings: allDiagnostics.filter((d) => d.severity === 'warning')
    };
  }

  /**
   * parseDiagnostics()
   *
   * Parse diagnostic messages from compiler output.
   */
  private parseDiagnostics(output: string, filename?: string): CompilationDiagnostic[] {
    const diagnostics: CompilationDiagnostic[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      /* PARSE DIAGNOSTIC LINE FORMAT */
      const match = line.match(
        /^(?:(error|warning|info):\s*)?(.+?)(?:\s+at\s+(.+):(\d+):(\d+))?$/i
      );

      if (match) {
        const [, severity, message, file, lineStr, columnStr] = match;

        diagnostics.push({
          severity: (severity?.toLowerCase() as 'error' | 'warning' | 'info') || 'error',
          message: message.trim(),
          filename: file || filename,
          line: lineStr ? parseInt(lineStr, 10) : undefined,
          column: columnStr ? parseInt(columnStr, 10) : undefined
        });
      } else {
        /* FALLBACK: TREAT AS GENERIC ERROR */
        diagnostics.push({
          severity: 'error',
          message: line.trim(),
          filename
        });
      }
    }

    return diagnostics;
  }
}

/**
 * WCCompilerFactory
 *
 * Factory for creating WC compiler integration instances.
 */
export class WCCompilerFactory {
  private static instance: WCCompilerIntegration | null = null;

  /**
   * createDefault()
   *
   * Create default compiler integration instance.
   */
  public static createDefault(): WCCompilerIntegration {
    if (!this.instance) {
      this.instance = new WCCompilerIntegration();
    }
    return this.instance;
  }

  /*
  	===============================================================
               --- EOF ---
  	===============================================================
  */

  /**
   * createWithOptions()
   *
   * Create compiler integration with custom options.
   */
  public static createWithOptions(
    compilerPath?: string,
    workingDirectory?: string
  ): WCCompilerIntegration {
    return new WCCompilerIntegration(compilerPath, workingDirectory);
  }

  /**
   * getInstance()
   *
   * Get singleton instance.
   */
  public static getInstance(): WCCompilerIntegration | null {
    return this.instance;
  }

  /**
   * dispose()
   *
   * Dispose singleton instance.
   */
  public static dispose(): void {
    if (this.instance) {
      this.instance.dispose();
      this.instance = null;
    }
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
