/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         index.ts
           ---
           main code generation API for WORLDSRC language.

           this module provides the primary interface for
           code generation operations, orchestrating the
           compilation pipeline and output management for
           all supported targets.

*/

/* export core interfaces and types */
export {
  BaseCodeGenerator,
  CodegenUtils,
  CompilationTarget,
  OptimizationLevel,
} from './base-generator';
export type {
  CodeGenerator,
  CodeGenerationOptions,
  CodeGenerationResult,
  CodegenDiagnostic,
} from './base-generator';

/* export specific generators */
export { TypeScriptGenerator } from './typescript-generator';
export { AssemblyScriptGenerator } from './assemblyscript-generator';

/* export compilation pipeline */
export {
  CompilationPipeline,
  CompilationPipelineFactory,
  PipelineStage,
} from './compilation-pipeline';
export type {
  CompilationRequest,
  CompilationResult,
  PipelineEvents,
} from './compilation-pipeline';

/* export output management */
export {
  OutputManager,
  OutputManagerFactory,
  BrowserFileSystem,
} from './output-manager';
export type {
  OutputConfiguration,
  OutputResult,
  OutputError,
  FileArtifact,
  FileSystemInterface,
} from './output-manager';

/*
    ====================================
             --- MAIN API ---
    ====================================
*/

/*

         WorldSrcCodeGenerator
           ---
           main API class for WORLDSRC code generation.
           provides a simplified interface for common
           code generation tasks and pipeline operations.

*/

import {
  CompilationPipeline,
  CompilationRequest,
  CompilationResult,
} from './compilation-pipeline';
import { OutputManager, OutputManagerFactory } from './output-manager';
import {
  CodeGenerationOptions,
  CompilationTarget,
  OptimizationLevel,
} from './base-generator';

export class WorldSrcCodeGenerator {
  private pipeline: CompilationPipeline;
  private outputManager: OutputManager;

  constructor(outputDirectory: string = './output') {
    this.pipeline = new CompilationPipeline({
      onStageStart: (stage, target) => {
        console.log(`Starting ${stage}${target ? ` for ${target}` : ''}`);
      },
      onStageComplete: (stage, target) => {
        console.log(`Completed ${stage}${target ? ` for ${target}` : ''}`);
      },
      onError: (error, stage, target) => {
        console.error(
          `Error in ${stage}${target ? ` for ${target}` : ''}: ${error.message}`
        );
      },
      onProgress: (progress, message) => {
        console.log(`[${progress}%] ${message}`);
      },
    });

    this.outputManager = OutputManagerFactory.createDefault(outputDirectory);
  }

  /*

           compile()
             ---
             main compilation method with simplified API.
             compiles WORLDSRC source code to specified targets
             and outputs results to configured directory.

  */

  public async compile(options: {
    sourceCode: string;
    filename?: string;
    targets: CompilationTarget | CompilationTarget[];
    optimizationLevel?: OptimizationLevel;
    outputDirectory?: string;
    minify?: boolean;
    sourceMaps?: boolean;
  }): Promise<{
    success: boolean;
    files: string[];
    errors: string[];
    warnings: string[];
  }> {
    /* create compilation request */
    const request: CompilationRequest = {
      sourceCode: options.sourceCode,
      filename: options.filename,
      target: options.targets,
      options: {
        target: Array.isArray(options.targets)
          ? options.targets[0]!
          : options.targets,
        optimizationLevel: options.optimizationLevel || OptimizationLevel.BASIC,
        outputFormat: 'esm',
        minify: options.minify || false,
        sourceMaps: options.sourceMaps !== false,
        typeDeclarations: true,
        indentSize: 2,
        useTabs: false,
        insertFinalNewline: true,
        strictMode: true,
        asyncSupport: true,
        moduleSystem: 'es6',
      },
      includeSourceMaps: options.sourceMaps !== false,
      includeTypeDeclarations: true,
    };

    try {
      /* run compilation pipeline */
      const compilationResult = await this.pipeline.compile(request);

      /* process output */
      if (options.outputDirectory) {
        this.outputManager.updateConfiguration({
          outputDirectory: options.outputDirectory,
        });
      }

      const outputResult =
        await this.outputManager.processCompilationResult(compilationResult);

      /* return simplified result */
      return {
        success: compilationResult.success && outputResult.success,
        files: outputResult.filesCreated,
        errors: [
          ...compilationResult.diagnostics
            .filter((d) => d.severity === 'error')
            .map((d) => d.message),
          ...outputResult.errors.map((e) => e.message),
        ],
        warnings: [
          ...compilationResult.warnings.map((w) => w.message),
          ...outputResult.warnings.map((w) => w.message),
        ],
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        errors: [`Compilation failed: ${error}`],
        warnings: [],
      };
    }
  }

  /*

           compileToTypeScript()
             ---
             convenience method for TypeScript compilation only.

  */

  public async compileToTypeScript(
    sourceCode: string,
    filename?: string
  ): Promise<{
    success: boolean;
    code: string;
    errors: string[];
  }> {
    const result = await this.compile({
      sourceCode,
      filename: filename || 'input.ws',
      targets: CompilationTarget.TYPESCRIPT,
    });

    return {
      success: result.success,
      code: result.success
        ? 'Generated TypeScript code'
        : '' /* would need to extract from result */,
      errors: result.errors,
    };
  }

  /*

           compileToAssemblyScript()
             ---
             convenience method for AssemblyScript compilation only.

  */

  public async compileToAssemblyScript(
    sourceCode: string,
    filename?: string
  ): Promise<{
    success: boolean;
    code: string;
    errors: string[];
  }> {
    const result = await this.compile({
      sourceCode,
      filename: filename || 'input.ws',
      targets: CompilationTarget.ASSEMBLYSCRIPT,
      optimizationLevel: OptimizationLevel.AGGRESSIVE,
    });

    return {
      success: result.success,
      code: result.success ? 'Generated AssemblyScript code' : '',
      errors: result.errors,
    };
  }

  /*

           compileMultiTarget()
             ---
             convenience method for multi-target compilation.

  */

  public async compileMultiTarget(
    sourceCode: string,
    targets: CompilationTarget[],
    options?: {
      filename?: string;
      outputDirectory?: string;
      optimizationLevel?: OptimizationLevel;
    }
  ): Promise<{
    success: boolean;
    results: Map<CompilationTarget, { success: boolean; files: string[] }>;
    errors: string[];
    warnings: string[];
  }> {
    const result = await this.compile({
      sourceCode,
      filename: options?.filename,
      targets,
      optimizationLevel: options?.optimizationLevel,
      outputDirectory: options?.outputDirectory,
    });

    /* would need to parse results by target from the compilation result */
    const targetResults = new Map<
      CompilationTarget,
      { success: boolean; files: string[] }
    >();
    for (const target of targets) {
      targetResults.set(target, {
        success: result.success,
        files: result.files.filter((f) => f.includes(target)) /* simplified */,
      });
    }

    return {
      success: result.success,
      results: targetResults,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  /*

           validateSource()
             ---
             validates WORLDSRC source code without compilation.

  */

  public async validateSource(
    sourceCode: string,
    filename?: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    /* would use lexer and parser directly for validation */
    try {
      /* create minimal compilation request for validation */
      const request: CompilationRequest = {
        sourceCode,
        filename: filename || 'input.ws',
        target: CompilationTarget.TYPESCRIPT,
        options: {
          target: CompilationTarget.TYPESCRIPT,
          optimizationLevel: OptimizationLevel.NONE,
          outputFormat: 'esm',
          minify: false,
          sourceMaps: false,
          typeDeclarations: false,
          indentSize: 2,
          useTabs: false,
          insertFinalNewline: false,
          strictMode: false,
          asyncSupport: true,
          moduleSystem: 'es6',
        },
        includeSourceMaps: false,
        includeTypeDeclarations: false,
      };

      /* run compilation up to semantic analysis */
      const result = await this.pipeline.compile(request);

      return {
        valid: result.success,
        errors: result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.message),
        warnings: result.warnings.map((w) => w.message),
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error}`],
        warnings: [],
      };
    }
  }

  /*

           getSupportedTargets()
             ---
             returns list of supported compilation targets.

  */

  public getSupportedTargets(): CompilationTarget[] {
    return this.pipeline.getSupportedTargets();
  }

  /*

           getGeneratorInfo()
             ---
             returns information about available code generators.

  */

  public getGeneratorInfo(): Array<{
    target: CompilationTarget;
    name: string;
    version: string;
    supported: boolean;
  }> {
    const targets = Object.values(CompilationTarget);
    return targets.map((target) => {
      const info = this.pipeline.getGeneratorInfo(target);
      return {
        target,
        name: info?.name || 'Unknown',
        version: info?.version || '0.0.0',
        supported: this.pipeline.isTargetSupported(target),
      };
    });
  }
}

/*
    ====================================
             --- FACTORY ---
    ====================================
*/

/*

         CodeGeneratorFactory
           ---
         factory for creating configured code generators
         with different settings and capabilities.

*/

export class CodeGeneratorFactory {
  public static createDefault(outputDirectory?: string): WorldSrcCodeGenerator {
    return new WorldSrcCodeGenerator(outputDirectory);
  }

  public static createOptimized(
    outputDirectory?: string
  ): WorldSrcCodeGenerator {
    const generator = new WorldSrcCodeGenerator(outputDirectory);
    /* would configure for optimized compilation */
    return generator;
  }

  public static createDebug(outputDirectory?: string): WorldSrcCodeGenerator {
    const generator = new WorldSrcCodeGenerator(outputDirectory);
    /* would configure for debug compilation */
    return generator;
  }
}

/*
    ====================================
             --- UTILITIES ---
    ====================================
*/

/*

         CodeGenerationUtilities
           ---
           utility functions for common code generation tasks
           and helper operations.

*/

export class CodeGenerationUtilities {
  public static async compileString(
    sourceCode: string,
    target: CompilationTarget = CompilationTarget.TYPESCRIPT
  ): Promise<string> {
    const generator = CodeGeneratorFactory.createDefault();
    const result = await generator.compile({
      sourceCode,
      targets: target,
    });

    if (!result.success) {
      throw new Error(`Compilation failed: ${result.errors.join(', ')}`);
    }

    return 'Generated code'; /* would extract actual code from result */
  }

  public static async validateString(sourceCode: string): Promise<boolean> {
    const generator = CodeGeneratorFactory.createDefault();
    const result = await generator.validateSource(sourceCode);
    return result.valid;
  }

  public static getDefaultOptions(): CodeGenerationOptions {
    return {
      target: CompilationTarget.TYPESCRIPT,
      optimizationLevel: OptimizationLevel.BASIC,
      outputFormat: 'esm',
      minify: false,
      sourceMaps: true,
      typeDeclarations: true,
      indentSize: 2,
      useTabs: false,
      insertFinalNewline: true,
      strictMode: true,
      asyncSupport: true,
      moduleSystem: 'es6',
    };
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
