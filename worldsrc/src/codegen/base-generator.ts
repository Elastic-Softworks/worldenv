/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         base-generator.ts
           ---
           base code generator interface and abstract class for
           WORLDSRC compilation targets.

           this module provides the foundation for all code
           generators, defining common interfaces, utilities,
           and base functionality that target-specific generators
           can extend and customize.

*/

import { ASTNode, Program, ASTVisitor } from '../parser/ast';
import { SimpleSemanticAnalyzer } from '../semantic/simple-analyzer';
import { SymbolTable } from '../semantic/symbol-table';
import { TypeRegistry } from '../semantic/type-system';

/*
    ====================================
             --- ENUMS ---
    ====================================
*/

export enum CompilationTarget {
  TYPESCRIPT = 'typescript',
  ASSEMBLYSCRIPT = 'assemblyscript',
  WASM = 'wasm',
  JAVASCRIPT = 'javascript',
}

export enum OptimizationLevel {
  NONE = 0,
  BASIC = 1,
  AGGRESSIVE = 2,
  SIZE = 3,
}

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         CodeGenerationOptions
           ---
           configuration options for code generation including
           target selection, optimization levels, output formatting,
           and compilation-specific settings.

*/

export interface CodeGenerationOptions {
  target: CompilationTarget;
  optimizationLevel: OptimizationLevel;
  outputFormat: 'esm' | 'cjs' | 'umd' | 'iife';

  minify: boolean;
  sourceMaps: boolean;
  typeDeclarations: boolean;

  indentSize: number;
  useTabs: boolean;
  insertFinalNewline: boolean;

  strictMode: boolean;
  asyncSupport: boolean;
  moduleSystem: 'es6' | 'commonjs' | 'amd' | 'systemjs';

  customTemplates?: Map<string, string>;
  outputPath?: string;
}

/*

         CodeGenerationResult
           ---
           result of code generation containing the generated
           source code, metadata, diagnostics, and any
           additional artifacts produced during compilation.

*/

export interface CodeGenerationResult {
  success: boolean;
  generatedCode: string;
  sourceMap?: string;
  typeDeclarations?: string;

  target: CompilationTarget;
  diagnostics: CodegenDiagnostic[];
  warnings: CodegenDiagnostic[];

  metadata: {
    linesGenerated: number;
    functionsEmitted: number;
    classesEmitted: number;
    modulesEmitted: number;
    generationTime: number;
  };

  artifacts: Map<string, string>;
}

/*

         CodegenDiagnostic
           ---
           diagnostic message from code generation including
           errors, warnings, and informational messages with
           source location and severity information.

*/

export interface CodegenDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: string;

  location?: {
    line: number;
    column: number;
    length: number;
    filename?: string;
  };

  suggestion?: string;
  relatedInformation?: CodegenDiagnostic[];
}

/*

         CodeGenerator
           ---
           main interface for code generators. implementations
           must provide methods for generating code from AST nodes,
           handling compilation options, and producing output
           artifacts for their target platform.

*/

export interface CodeGenerator {
  readonly target: CompilationTarget;
  readonly name: string;
  readonly version: string;

  generate(
    ast: Program,
    options: CodeGenerationOptions
  ): Promise<CodeGenerationResult>;

  supportsFeature(feature: string): boolean;
  getDefaultOptions(): CodeGenerationOptions;
  validateOptions(options: CodeGenerationOptions): CodegenDiagnostic[];
}

/*
    ====================================
             --- BASE CLASS ---
    ====================================
*/

/*

         BaseCodeGenerator
           ---
           abstract base class providing common functionality
           for all code generators including AST traversal,
           symbol resolution, type checking, and utility
           methods for code emission.

           target-specific generators extend this class and
           implement the abstract methods for their specific
           output format and language semantics.

*/

export abstract class BaseCodeGenerator
  implements CodeGenerator, ASTVisitor<void>
{
  protected options: CodeGenerationOptions;
  protected diagnostics: CodegenDiagnostic[];
  protected warnings: CodegenDiagnostic[];
  protected generatedCode: string[];
  protected indentLevel: number;
  protected currentScope: string[];

  protected symbolTable: SymbolTable;
  protected typeRegistry: TypeRegistry;
  protected semanticAnalyzer: SimpleSemanticAnalyzer;

  protected metadata: {
    linesGenerated: number;
    functionsEmitted: number;
    classesEmitted: number;
    modulesEmitted: number;
    generationTime: number;
  };

  public abstract readonly target: CompilationTarget;
  public abstract readonly name: string;
  public abstract readonly version: string;

  constructor() {
    this.options = this.getDefaultOptions();
    this.diagnostics = [];
    this.warnings = [];
    this.generatedCode = [];
    this.indentLevel = 0;
    this.currentScope = [];

    this.symbolTable = new SymbolTable();
    this.typeRegistry = new TypeRegistry();
    this.semanticAnalyzer = new SimpleSemanticAnalyzer();

    this.metadata = {
      linesGenerated: 0,
      functionsEmitted: 0,
      classesEmitted: 0,
      modulesEmitted: 0,
      generationTime: 0,
    };
  }

  /*

           generate()
             ---
             main entry point for code generation. performs
             semantic analysis, validates the AST, and then
             traverses it to emit target-specific code.

  */

  public async generate(
    ast: Program,
    options: CodeGenerationOptions
  ): Promise<CodeGenerationResult> {
    const startTime = performance.now();

    this.reset();
    this.options = { ...this.getDefaultOptions(), ...options };

    /* validate options before proceeding */
    const optionDiagnostics = this.validateOptions(this.options);
    if (optionDiagnostics.length > 0) {
      this.diagnostics.push(...optionDiagnostics);
    }

    /* perform semantic analysis if not already done */
    try {
      const analysisResult = await this.semanticAnalyzer.analyze(ast);
      if (!analysisResult.success) {
        this.addError('Semantic analysis failed', 'SEMANTIC_ERROR');
        return this.createFailureResult();
      }

      /* semantic analysis results would be accessed here */
      /* this.symbolTable = analysisResult.symbolTable; */
      /* this.typeRegistry = analysisResult.typeRegistry; */
    } catch (error) {
      this.addError(
        `Semantic analysis exception: ${error}`,
        'SEMANTIC_EXCEPTION'
      );
      return this.createFailureResult();
    }

    /* generate code by traversing AST */
    try {
      this.emitFileHeader();
      this.visitProgram(ast);
      this.emitFileFooter();
    } catch (error) {
      this.addError(`Code generation exception: ${error}`, 'CODEGEN_EXCEPTION');
      return this.createFailureResult();
    }

    this.metadata.generationTime = performance.now() - startTime;

    return this.createSuccessResult();
  }

  /*

           utility methods for code emission and formatting

  */

  protected emit(code: string): void {
    this.generatedCode.push(code);
    this.metadata.linesGenerated++;
  }

  protected emitLine(code: string = ''): void {
    const indent = this.options.useTabs
      ? '\t'.repeat(this.indentLevel)
      : ' '.repeat(this.indentLevel * this.options.indentSize);

    this.emit(indent + code + '\n');
  }

  protected emitComment(comment: string): void {
    this.emitLine(`/* ${comment} */`);
  }

  protected indent(): void {
    this.indentLevel++;
  }

  protected dedent(): void {
    if (this.indentLevel > 0) {
      this.indentLevel--;
    }
  }

  protected enterScope(scopeName: string): void {
    this.currentScope.push(scopeName);
  }

  protected exitScope(): void {
    this.currentScope.pop();
  }

  protected getCurrentScope(): string {
    return this.currentScope.join('::');
  }

  /*

           diagnostic and error handling methods

  */

  protected addError(message: string, code: string, location?: any): void {
    const diagnostic: CodegenDiagnostic = {
      severity: 'error',
      message,
      code,
    };

    if (location) {
      diagnostic.location = this.extractLocation(location);
    }

    this.diagnostics.push(diagnostic);
  }

  protected addWarning(message: string, code: string, location?: any): void {
    const warning: CodegenDiagnostic = {
      severity: 'warning',
      message,
      code,
    };

    if (location) {
      warning.location = this.extractLocation(location);
    }

    this.warnings.push(warning);
  }

  protected addInfo(message: string, code: string, location?: any): void {
    const info: CodegenDiagnostic = {
      severity: 'info',
      message,
      code,
    };

    if (location) {
      info.location = this.extractLocation(location);
    }

    this.diagnostics.push(info);
  }

  private extractLocation(
    location: any
  ): { line: number; column: number; length: number } | undefined {
    if (location && typeof location === 'object') {
      return {
        line: location.line || 0,
        column: location.column || 0,
        length: location.length || 0,
      };
    }

    return undefined;
  }

  /*

           result creation methods

  */

  protected createSuccessResult(): CodeGenerationResult {
    const generatedCode = this.generatedCode.join('');
    const hasErrors = this.diagnostics.some((d) => d.severity === 'error');

    return {
      success: !hasErrors,
      generatedCode,
      target: this.target,
      diagnostics: this.diagnostics,
      warnings: this.warnings,
      metadata: { ...this.metadata },
      artifacts: new Map(),
    };
  }

  protected createFailureResult(): CodeGenerationResult {
    return {
      success: false,
      generatedCode: '',
      target: this.target,
      diagnostics: this.diagnostics,
      warnings: this.warnings,
      metadata: { ...this.metadata },
      artifacts: new Map(),
    };
  }

  /*

           abstract methods that must be implemented by subclasses

  */

  protected abstract emitFileHeader(): void;
  protected abstract emitFileFooter(): void;

  public abstract supportsFeature(feature: string): boolean;
  public abstract getDefaultOptions(): CodeGenerationOptions;
  public abstract validateOptions(
    options: CodeGenerationOptions
  ): CodegenDiagnostic[];

  /* AST visitor methods - default implementations delegate to specific handlers */
  public abstract visitProgram(node: Program): void;
  public abstract visitDeclaration(node: any): void;
  public abstract visitStatement(node: any): void;
  public abstract visitExpression(node: any): void;
  public visitType(node: any): void {
    this.visitTypeNode(node);
  }

  /* Additional abstract method for type nodes */
  protected abstract visitTypeNode(node: any): void;

  /*

           reset method to clear state between generations

  */

  protected reset(): void {
    this.diagnostics = [];
    this.warnings = [];
    this.generatedCode = [];
    this.indentLevel = 0;
    this.currentScope = [];

    this.metadata = {
      linesGenerated: 0,
      functionsEmitted: 0,
      classesEmitted: 0,
      modulesEmitted: 0,
      generationTime: 0,
    };
  }
}

/* end of base code generator */

/*
    ====================================
             --- UTILITIES ---
    ====================================
*/

/*

         CodegenUtils
           ---
           utility functions for code generation including
           identifier sanitization, type conversion, and
           common code patterns.

*/

export class CodegenUtils {
  public static sanitizeIdentifier(
    name: string,
    target: CompilationTarget
  ): string {
    /* remove invalid characters and ensure valid identifier */
    let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '_');

    /* ensure it doesn't start with a number */
    if (/^[0-9]/.test(sanitized)) {
      sanitized = '_' + sanitized;
    }

    /* handle target-specific reserved words */
    const reservedWords = this.getReservedWords(target);
    if (reservedWords.includes(sanitized)) {
      sanitized = sanitized + '_';
    }

    return sanitized;
  }

  public static getReservedWords(target: CompilationTarget): string[] {
    const common = [
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'export',
      'extends',
      'finally',
      'for',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'new',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'yield',
    ];

    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return [
          ...common,
          'abstract',
          'as',
          'async',
          'await',
          'declare',
          'enum',
          'implements',
          'interface',
          'module',
          'namespace',
          'private',
          'protected',
          'public',
          'readonly',
          'static',
          'type',
        ];

      case CompilationTarget.ASSEMBLYSCRIPT:
        return [
          ...common,
          'i32',
          'i64',
          'f32',
          'f64',
          'bool',
          'string',
          'void',
          'export',
          'import',
          'memory',
          'table',
        ];

      case CompilationTarget.WASM:
        return [
          'i32',
          'i64',
          'f32',
          'f64',
          'func',
          'param',
          'result',
          'local',
          'global',
          'memory',
          'table',
          'export',
          'import',
        ];

      default:
        return common;
    }
  }

  public static escapeString(str: string, target: CompilationTarget): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  public static formatNumber(num: number, target: CompilationTarget): string {
    /* format numbers appropriately for target */
    if (target === CompilationTarget.WASM) {
      /* WASM requires explicit type suffixes */
      if (Number.isInteger(num)) {
        return num.toString();
      } else {
        return num.toString();
      }
    }

    return num.toString();
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
