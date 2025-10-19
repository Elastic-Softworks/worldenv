/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         index.ts
           ---
           main entry point for the WORLDC compiler package.

           this module provides the primary API for WORLDC language
           compilation, including lexical analysis, parsing,
           semantic analysis, and code generation for multiple
           target platforms.

*/

/*
    ====================================
             --- EXPORTS ---
    ====================================
*/

/* core compilation pipeline */
export * from './codegen/index';

/* lexical analysis */
export { Lexer, LexerOptions, LexerError } from './lexer/lexer';
export { TokenType, Token, SourcePosition, TokenUtils } from './lexer/tokens';

/* syntax parsing */
export { Parser, ParserOptions } from './parser/parser';
export * from './parser/ast';

/* semantic analysis */
export {
  SimpleSemanticAnalyzer,
  SimpleAnalysisResult,
} from './semantic/simple-analyzer';
export { SymbolTable, Symbol, SymbolKind } from './semantic/symbol-table';
export {
  TypeDescriptor,
  TypeRegistry,
  TypeChecker,
} from './semantic/type-system';

/* error handling */
export {
  WorldCErrorHandler,
  globalErrorHandler,
  ErrorType,
} from './error/error-handler';

/* deployment tools */
export * from './deployment/index';

/* tooling integration */
export * from './tooling/index';

/*
    ====================================
             --- MAIN API ---
    ====================================
*/

import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { SimpleSemanticAnalyzer } from './semantic/simple-analyzer';

export interface CompileOptions {
  target?: 'typescript' | 'assemblyscript' | 'js' | 'wasm';
  optimize?: boolean;
  sourceMaps?: boolean;
  minify?: boolean;
  outputDirectory?: string;
  strict?: boolean;
}

export interface CompileResult {
  success: boolean;
  code: string;
  sourceMap?: string;
  errors: string[];
  warnings: string[];
}

export async function compile(
  source: string,
  options: CompileOptions = {}
): Promise<CompileResult> {
  try {
    /* set default options */
    const opts = {
      target: 'typescript' as const,
      optimize: false,
      sourceMaps: true,
      minify: false,
      strict: true,
      ...options,
    };

    /* create lexer and tokenize */
    const lexer = new Lexer(source, { skipWhitespace: true });
    const tokens = lexer.tokenize();

    /* create parser and parse to AST */
    const parser = new Parser(tokens, { strict: opts.strict });
    const ast = parser.parse();

    /* run semantic analysis */
    const analyzer = new SimpleSemanticAnalyzer();
    const semanticResult = analyzer.analyze(ast);

    if (!semanticResult.success) {
      return {
        success: false,
        code: '',
        errors: [
          `Semantic analysis failed with ${semanticResult.errors} errors`,
        ],
        warnings: [`${semanticResult.warnings} warnings found`],
      };
    }

    /* simple code generation placeholder */
    let generatedCode = '';

    switch (opts.target) {
      case 'typescript':
      case 'js':
        generatedCode = `// Generated TypeScript code from WORLDC\n// ${semanticResult.symbolsFound} symbols found\nexport {};`;
        break;

      case 'assemblyscript':
      case 'wasm':
        generatedCode = `// Generated AssemblyScript code from WORLDC\n// ${semanticResult.typesChecked} types checked\nexport {};`;
        break;

      default:
        throw new Error(`Unsupported target: ${opts.target}`);
    }

    return {
      success: true,
      code: generatedCode,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    return {
      success: false,
      code: '',
      errors: [`Compilation failed: ${error}`],
      warnings: [],
    };
  }
}

/*

         validate()
           ---
           validates WORLDC source code without compilation.

*/

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validate(source: string): Promise<ValidateResult> {
  try {
    /* create lexer and tokenize */
    const lexer = new Lexer(source, { skipWhitespace: true });
    const tokens = lexer.tokenize();

    /* create parser and parse to AST */
    const parser = new Parser(tokens, { strict: true });
    const ast = parser.parse();

    /* run semantic analysis */
    const analyzer = new SimpleSemanticAnalyzer();
    const semanticResult = analyzer.analyze(ast);

    return {
      valid: semanticResult.success,
      errors: semanticResult.success
        ? []
        : [`${semanticResult.errors} errors found`],
      warnings:
        semanticResult.warnings > 0
          ? [`${semanticResult.warnings} warnings found`]
          : [],
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

         parseAST()
           ---
           parses WORLDC source code into an abstract syntax tree.

*/

export interface ParseResult {
  success: boolean;
  ast?: any;
  errors: string[];
}

export function parseAST(source: string): ParseResult {
  try {
    /* create lexer and parser */
    const lexer = new Lexer(source, { skipWhitespace: true });
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens, { strict: false });
    const ast = parser.parse();

    return {
      success: true,
      ast,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Parse failed: ${error}`],
    };
  }
}

/*

         getVersion()
           ---
           returns the current version of the WORLDC compiler.

*/

export function getVersion(): string {
  return '0.1.0';
}

/*

         getSupportedTargets()
           ---
           returns list of supported compilation targets.

*/

export function getSupportedTargets(): string[] {
  return ['typescript', 'assemblyscript', 'js', 'wasm'];
}

/*
    ====================================
             --- CLASSES ---
    ====================================
*/

/*

         WorldCCompiler
           ---
           main compiler class providing stateful compilation
           with configuration and caching capabilities.

*/

export class WorldCCompiler {
  private options: CompileOptions;

  constructor(options: CompileOptions = {}) {
    this.options = {
      target: 'typescript',
      optimize: false,
      sourceMaps: true,
      minify: false,
      strict: true,
      ...options,
    };
  }

  public async compile(source: string): Promise<CompileResult> {
    return compile(source, this.options);
  }

  public async validate(source: string): Promise<ValidateResult> {
    return validate(source);
  }

  public setOptions(options: Partial<CompileOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): CompileOptions {
    return { ...this.options };
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
