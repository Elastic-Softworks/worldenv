/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         compilation-pipeline.ts
           ---
           compilation pipeline manager for WORLDC language.

           this module orchestrates the complete compilation process
           from source code to target output, managing multiple
           generators, optimization passes, and output artifacts.

*/

import {
  BaseCodeGenerator,
  CodeGenerator,
  CompilationTarget,
  OptimizationLevel,
  CodeGenerationOptions,
  CodeGenerationResult,
  CodegenDiagnostic,
} from './base-generator';

import { TypeScriptGenerator } from './typescript-generator';
import { AssemblyScriptGenerator } from './assemblyscript-generator';

import { Program } from '../parser/ast';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';
import { SimpleSemanticAnalyzer } from '../semantic/simple-analyzer';

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         CompilationRequest
           ---
           request object containing source code, target
           configuration, and compilation options for
           processing through the pipeline.

*/

export interface CompilationRequest {
  sourceCode: string;
  filename?: string;
  target: CompilationTarget | CompilationTarget[];

  options: CodeGenerationOptions;
  includeSourceMaps: boolean;
  includeTypeDeclarations: boolean;

  metadata?: {
    projectName: string;
    version: string;
    author: string;
    description: string;
  };
}

/*

         CompilationResult
           ---
           comprehensive result of compilation process including
           generated code for all targets, diagnostics, timing
           information, and generated artifacts.

*/

export interface CompilationResult {
  success: boolean;
  request: CompilationRequest;

  results: Map<CompilationTarget, CodeGenerationResult>;
  diagnostics: CodegenDiagnostic[];
  warnings: CodegenDiagnostic[];

  timing: {
    lexingTime: number;
    parsingTime: number;
    semanticAnalysisTime: number;
    codeGenerationTime: number;
    totalTime: number;
  };

  artifacts: Map<string, string>;
  outputFiles: Map<CompilationTarget, string[]>;
}

/*

         PipelineStage
           ---
           enumeration of compilation pipeline stages for
           progress tracking and error reporting.

*/

export enum PipelineStage {
  INITIALIZATION = 'initialization',
  LEXING = 'lexing',
  PARSING = 'parsing',
  SEMANTIC_ANALYSIS = 'semantic_analysis',
  CODE_GENERATION = 'code_generation',
  OPTIMIZATION = 'optimization',
  OUTPUT = 'output',
  COMPLETE = 'complete',
}

/*

         PipelineEvents
           ---
           event interface for monitoring compilation progress
           and handling errors during pipeline execution.

*/

export interface PipelineEvents {
  onStageStart?(stage: PipelineStage, target?: CompilationTarget): void;
  onStageComplete?(stage: PipelineStage, target?: CompilationTarget): void;
  onError?(
    error: Error,
    stage: PipelineStage,
    target?: CompilationTarget
  ): void;
  onWarning?(warning: CodegenDiagnostic, stage: PipelineStage): void;
  onProgress?(progress: number, message: string): void;
}

/*
    ====================================
             --- PIPELINE ---
    ====================================
*/

/*

         CompilationPipeline
           ---
           main compilation pipeline orchestrating the complete
           process from source code to target outputs. manages
           multiple generators, handles errors, and provides
           progress reporting.

*/

export class CompilationPipeline {
  private generators: Map<CompilationTarget, CodeGenerator>;
  private lexer: Lexer;
  private parser: Parser;
  private semanticAnalyzer: SimpleSemanticAnalyzer;

  private events: PipelineEvents;
  private isRunning: boolean;
  private currentStage: PipelineStage;

  constructor(events?: PipelineEvents) {
    this.generators = new Map();
    this.lexer = new Lexer('');
    this.parser = new Parser([]);
    this.semanticAnalyzer = new SimpleSemanticAnalyzer();

    this.events = events || {};
    this.isRunning = false;
    this.currentStage = PipelineStage.INITIALIZATION;

    this.initializeGenerators();
  }

  /*

           initializeGenerators()
             ---
             creates and registers code generators for all
             supported compilation targets.

  */

  private initializeGenerators(): void {
    this.generators.set(
      CompilationTarget.TYPESCRIPT,
      new TypeScriptGenerator()
    );
    this.generators.set(
      CompilationTarget.ASSEMBLYSCRIPT,
      new AssemblyScriptGenerator()
    );

    /* additional generators can be registered here */
  }

  /*

           compile()
             ---
             main compilation entry point. processes the request
             through all pipeline stages and returns comprehensive
             results for all requested targets.

  */

  public async compile(
    request: CompilationRequest
  ): Promise<CompilationResult> {
    if (this.isRunning) {
      throw new Error('Compilation pipeline is already running');
    }

    this.isRunning = true;
    const startTime = performance.now();

    const result: CompilationResult = {
      success: false,
      request,
      results: new Map(),
      diagnostics: [],
      warnings: [],
      timing: {
        lexingTime: 0,
        parsingTime: 0,
        semanticAnalysisTime: 0,
        codeGenerationTime: 0,
        totalTime: 0,
      },
      artifacts: new Map(),
      outputFiles: new Map(),
    };

    try {
      /* determine target list */
      const targets = Array.isArray(request.target)
        ? request.target
        : [request.target];

      /* validate targets */
      for (const target of targets) {
        if (!this.generators.has(target)) {
          this.addError(
            result,
            `Unsupported compilation target: ${target}`,
            'UNSUPPORTED_TARGET'
          );
          return result;
        }
      }

      /* stage 1: lexical analysis */
      this.setStage(PipelineStage.LEXING);
      const lexingStart = performance.now();

      this.lexer = new Lexer(request.sourceCode);
      const tokens = this.lexer.tokenize();
      if (tokens.length === 0) {
        this.addError(
          result,
          'No tokens generated from source code',
          'EMPTY_TOKENS'
        );
        return result;
      }

      result.timing.lexingTime = performance.now() - lexingStart;
      this.reportProgress(20, 'Lexical analysis complete');

      /* stage 2: syntax analysis */
      this.setStage(PipelineStage.PARSING);
      const parsingStart = performance.now();

      this.parser = new Parser(tokens);
      const ast = this.parser.parse();
      if (!ast) {
        this.addError(
          result,
          'Failed to generate AST from tokens',
          'PARSING_FAILED'
        );
        return result;
      }

      result.timing.parsingTime = performance.now() - parsingStart;
      this.reportProgress(40, 'Syntax analysis complete');

      /* stage 3: semantic analysis */
      this.setStage(PipelineStage.SEMANTIC_ANALYSIS);
      const semanticStart = performance.now();

      const semanticResult = await this.semanticAnalyzer.analyze(ast);
      if (!semanticResult.success) {
        this.addError(result, 'Semantic analysis failed', 'SEMANTIC_FAILED');
        return result;
      }

      result.timing.semanticAnalysisTime = performance.now() - semanticStart;
      this.reportProgress(60, 'Semantic analysis complete');

      /* stage 4: code generation for each target */
      this.setStage(PipelineStage.CODE_GENERATION);
      const codegenStart = performance.now();

      let successCount = 0;
      const progressPerTarget = 30 / targets.length;

      for (const target of targets) {
        try {
          this.reportStageStart(PipelineStage.CODE_GENERATION, target);

          const generator = this.generators.get(target)!;
          const targetOptions = { ...request.options, target };

          const generationResult = await generator.generate(
            ast as Program,
            targetOptions
          );
          result.results.set(target, generationResult);

          if (generationResult.success) {
            successCount++;
            this.processGenerationResult(result, target, generationResult);
          } else {
            this.mergeGenerationDiagnostics(result, generationResult);
          }

          this.reportStageComplete(PipelineStage.CODE_GENERATION, target);
        } catch (error) {
          this.addError(
            result,
            `Code generation failed for ${target}: ${error}`,
            'CODEGEN_EXCEPTION'
          );
          this.reportError(
            error as Error,
            PipelineStage.CODE_GENERATION,
            target
          );
        }

        this.reportProgress(
          60 + progressPerTarget * (targets.indexOf(target) + 1),
          `Code generation complete for ${target}`
        );
      }

      result.timing.codeGenerationTime = performance.now() - codegenStart;

      /* stage 5: finalization */
      this.setStage(PipelineStage.OUTPUT);
      this.generateOutputArtifacts(result);

      result.success = successCount > 0;
      this.reportProgress(100, 'Compilation complete');
    } catch (error) {
      this.addError(result, `Pipeline error: ${error}`, 'PIPELINE_EXCEPTION');
      this.reportError(error as Error, this.currentStage);
    } finally {
      result.timing.totalTime = performance.now() - startTime;
      this.setStage(PipelineStage.COMPLETE);
      this.isRunning = false;
    }

    return result;
  }

  /*

           utility methods for pipeline management

  */

  private setStage(stage: PipelineStage): void {
    this.currentStage = stage;
    this.reportStageStart(stage);
  }

  private reportStageStart(
    stage: PipelineStage,
    target?: CompilationTarget
  ): void {
    if (this.events.onStageStart) {
      this.events.onStageStart(stage, target);
    }
  }

  private reportStageComplete(
    stage: PipelineStage,
    target?: CompilationTarget
  ): void {
    if (this.events.onStageComplete) {
      this.events.onStageComplete(stage, target);
    }
  }

  private reportError(
    error: Error,
    stage: PipelineStage,
    target?: CompilationTarget
  ): void {
    if (this.events.onError) {
      this.events.onError(error, stage, target);
    }
  }

  private reportProgress(progress: number, message: string): void {
    if (this.events.onProgress) {
      this.events.onProgress(progress, message);
    }
  }

  private addError(
    result: CompilationResult,
    message: string,
    code: string
  ): void {
    result.diagnostics.push({
      severity: 'error',
      message,
      code,
    });
  }

  private addWarning(
    result: CompilationResult,
    message: string,
    code: string
  ): void {
    result.warnings.push({
      severity: 'warning',
      message,
      code,
    });
  }

  /*

           result processing methods

  */

  private processGenerationResult(
    result: CompilationResult,
    target: CompilationTarget,
    generationResult: CodeGenerationResult
  ): void {
    /* store generated code */
    const filename = this.generateOutputFilename(
      target,
      result.request.filename
    );
    result.artifacts.set(filename, generationResult.generatedCode);

    /* store source maps if generated */
    if (generationResult.sourceMap) {
      const mapFilename = filename + '.map';
      result.artifacts.set(mapFilename, generationResult.sourceMap);
    }

    /* store type declarations if generated */
    if (generationResult.typeDeclarations) {
      const dtsFilename = filename.replace(/\.(ts|js)$/, '.d.ts');
      result.artifacts.set(dtsFilename, generationResult.typeDeclarations);
    }

    /* merge additional artifacts */
    for (const [name, content] of generationResult.artifacts) {
      result.artifacts.set(name, content);
    }

    /* track output files */
    const outputFiles = result.outputFiles.get(target) || [];
    outputFiles.push(filename);
    result.outputFiles.set(target, outputFiles);
  }

  private mergeGenerationDiagnostics(
    result: CompilationResult,
    generationResult: CodeGenerationResult
  ): void {
    result.diagnostics.push(...generationResult.diagnostics);
    result.warnings.push(...generationResult.warnings);
  }

  private generateOutputFilename(
    target: CompilationTarget,
    sourceFilename?: string
  ): string {
    const baseName = sourceFilename
      ? sourceFilename.replace(/\.[^.]+$/, '')
      : 'output';

    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return `${baseName}.ts`;
      case CompilationTarget.ASSEMBLYSCRIPT:
        return `${baseName}.as.ts`;
      case CompilationTarget.JAVASCRIPT:
        return `${baseName}.js`;
      case CompilationTarget.WASM:
        return `${baseName}.wasm`;
      default:
        return `${baseName}.out`;
    }
  }

  private generateOutputArtifacts(result: CompilationResult): void {
    /* generate package.json if multiple targets */
    if (result.outputFiles.size > 1) {
      const packageJson = this.generatePackageJson(result);
      result.artifacts.set('package.json', packageJson);
    }

    /* generate README with usage instructions */
    if (result.request.metadata) {
      const readme = this.generateReadme(result);
      result.artifacts.set('README.md', readme);
    }

    /* generate build configuration files */
    for (const target of result.outputFiles.keys()) {
      const buildConfig = this.generateBuildConfig(target, result);
      if (buildConfig) {
        const configFilename = this.getBuildConfigFilename(target);
        result.artifacts.set(configFilename, buildConfig);
      }
    }
  }

  private generatePackageJson(result: CompilationResult): string {
    const metadata = result.request.metadata || {};

    const packageConfig: any = {
      name: (metadata as any).projectName || 'worldc-project',
      version: (metadata as any).version || '1.0.0',
      description: (metadata as any).description || 'Generated from WORLDC',
      author: (metadata as any).author || 'WORLDC Compiler',
      main: 'index.js',
      types: 'index.d.ts',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    };

    /* add target-specific configurations */
    if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      packageConfig.devDependencies['typescript'] = '^5.0.0';
      packageConfig.scripts['build:ts'] = 'tsc';
    }

    if (result.outputFiles.has(CompilationTarget.ASSEMBLYSCRIPT)) {
      packageConfig.devDependencies['assemblyscript'] = '^0.27.0';
      packageConfig.scripts['build:as'] =
        'asc assembly/index.ts -b build/optimized.wasm -O3z';
    }

    return JSON.stringify(packageConfig, null, 2);
  }

  private generateReadme(result: CompilationResult): string {
    const metadata = result.request.metadata || {};

    let readme = `# ${(metadata as any).projectName || 'WORLDC Project'}\n\n`;
    readme += `${(metadata as any).description || 'Generated from WORLDC language'}\n\n`;

    readme += '## Generated Files\n\n';
    for (const [target, files] of result.outputFiles) {
      readme += `### ${target}\n`;
      for (const file of files) {
        readme += `- ${file}\n`;
      }
      readme += '\n';
    }

    readme += '## Usage\n\n';
    readme += 'This project was generated from WORLDC source code. ';
    readme += 'Refer to the WORLDC documentation for more information.\n\n';

    if ((metadata as any).author) {
      readme += `## Author\n\n${(metadata as any).author}\n\n`;
    }

    readme += '## License\n\n';
    readme += 'Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0\n';

    return readme;
  }

  private generateBuildConfig(
    target: CompilationTarget,
    result: CompilationResult
  ): string | null {
    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return this.generateTsConfig();
      case CompilationTarget.ASSEMBLYSCRIPT:
        return this.generateAsConfig();
      default:
        return null;
    }
  }

  private generateTsConfig(): string {
    const config = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    return JSON.stringify(config, null, 2);
  }

  private generateAsConfig(): string {
    const config = {
      targets: {
        debug: {
          outFile: 'build/debug.wasm',
          textFile: 'build/debug.wat',
          sourceMap: true,
          debug: true,
        },
        release: {
          outFile: 'build/release.wasm',
          textFile: 'build/release.wat',
          sourceMap: true,
          optimizeLevel: 3,
          shrinkLevel: 0,
          converge: false,
          noAssert: false,
        },
      },
      options: {},
    };

    return JSON.stringify(config, null, 2);
  }

  private getBuildConfigFilename(target: CompilationTarget): string {
    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return 'tsconfig.json';
      case CompilationTarget.ASSEMBLYSCRIPT:
        return 'asconfig.json';
      default:
        return 'build.config.json';
    }
  }

  /*

           public API methods

  */

  public registerGenerator(
    target: CompilationTarget,
    generator: CodeGenerator
  ): void {
    this.generators.set(target, generator);
  }

  public getSupportedTargets(): CompilationTarget[] {
    return Array.from(this.generators.keys());
  }

  public isTargetSupported(target: CompilationTarget): boolean {
    return this.generators.has(target);
  }

  public getGeneratorInfo(
    target: CompilationTarget
  ): { name: string; version: string } | null {
    const generator = this.generators.get(target);
    return generator
      ? { name: generator.name, version: generator.version }
      : null;
  }
}

/* end of compilation pipeline */

/*
    ====================================
             --- FACTORY ---
    ====================================
*/

/*

         CompilationPipelineFactory
           ---
           factory class for creating configured compilation
           pipelines with different generator sets and options.

*/

export class CompilationPipelineFactory {
  public static createDefault(events?: PipelineEvents): CompilationPipeline {
    return new CompilationPipeline(events);
  }

  public static createForTarget(
    target: CompilationTarget,
    events?: PipelineEvents
  ): CompilationPipeline {
    const pipeline = new CompilationPipeline(events);

    /* remove unsupported generators to prevent errors */
    const supportedTargets = pipeline.getSupportedTargets();
    for (const supportedTarget of supportedTargets) {
      if (supportedTarget !== target) {
        /* implementation would remove non-matching generators */
      }
    }

    return pipeline;
  }

  public static createCustom(
    generators: Map<CompilationTarget, CodeGenerator>,
    events?: PipelineEvents
  ): CompilationPipeline {
    const pipeline = new CompilationPipeline(events);

    for (const [target, generator] of generators) {
      pipeline.registerGenerator(target, generator);
    }

    return pipeline;
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
