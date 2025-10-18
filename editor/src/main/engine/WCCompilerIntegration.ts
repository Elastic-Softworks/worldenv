/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WC Compiler Integration
 *
 * Integrates WC compiler into the editor for real-time
 * compilation and hot-reload functionality.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

/* WORLDC COMPILER MODULES - Use direct require for now */
// We'll use direct require since the module structure is complex

const execAsync = promisify(exec);

export interface CompilationRequest {
  sourceCode: string;
  filename: string;
  target: CompilationTarget;
  options?: CompilationOptions;
}

export interface CompilationResult {
  success: boolean;
  target: CompilationTarget;
  outputCode?: string;
  outputFiles?: string[];
  diagnostics: CompilationDiagnostic[];
  warnings: CompilationDiagnostic[];
  timing: {
    lexingTime: number;
    parsingTime: number;
    codeGenerationTime: number;
    totalTime: number;
  };
}

export interface CompilationDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  filename?: string;
  line?: number;
  column?: number;
  code?: string;
}

export interface CompilationOptions {
  optimizationLevel: OptimizationLevel;
  outputFormat: 'esm' | 'cjs' | 'iife';
  minify: boolean;
  sourceMaps: boolean;
  typeDeclarations: boolean;
  strictMode: boolean;
}

export enum CompilationTarget {
  TYPESCRIPT = 'typescript',
  ASSEMBLYSCRIPT = 'assemblyscript',
  BOTH = 'both'
}

export enum OptimizationLevel {
  NONE = 'none',
  BASIC = 'basic',
  AGGRESSIVE = 'aggressive'
}

export enum CompilerEvent {
  COMPILATION_STARTED = 'compilationStarted',
  COMPILATION_COMPLETE = 'compilationComplete',
  COMPILATION_ERROR = 'compilationError',
  HOT_RELOAD_TRIGGERED = 'hotReloadTriggered',
  DIAGNOSTICS_UPDATED = 'diagnosticsUpdated'
}

/**
 * WCCompilerIntegration
 *
 * Main integration class for WC compiler functionality.
 * Handles compilation requests, manages compiler process,
 * and provides hot-reload capabilities.
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

  /**
   * initialize()
   *
   * Initialize the WC compiler integration.
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

  /**
   * compile()
   *
   * Compile WC source code to specified target.
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

  /**
   * compileToTypeScript()
   *
   * Convenience method for TypeScript compilation.
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

  /**
   * compileToAssemblyScript()
   *
   * Convenience method for AssemblyScript compilation.
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

  /**
   * validateSource()
   *
   * Validate WC source code without compilation.
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

  /**
   * isReady()
   *
   * Check if compiler is ready for compilation.
   */
  isReady(): boolean {
    return this.isInitialized && !this.isCompiling;
  }

  /**
   * dispose()
   *
   * Clean up compiler integration resources.
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
          require.resolve(compilerPath);
          return `node "${compilerPath}"`;
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
