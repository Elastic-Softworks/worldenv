/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         assemblyscript-generator.ts
           ---
           AssemblyScript code generator for WORLDC language.

           this generator converts WORLDC AST nodes into
           valid AssemblyScript code, optimizing for WebAssembly
           performance by leveraging AssemblyScript's typed
           nature and low-level capabilities.

*/

import {
  BaseCodeGenerator,
  CompilationTarget,
  OptimizationLevel,
  CodeGenerationOptions,
  CodegenDiagnostic,
  CodegenUtils,
} from './base-generator';

import {
  ASTNode,
  Program,
  Declaration,
  Statement,
  Expression,
  TypeNode,
  FunctionDeclaration,
  VariableDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  Parameter,
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  BinaryExpression,
  UnaryExpression,
  CallExpression,
  MemberExpression,
  Identifier,
  Literal,
  AssignmentExpression,
  PrimitiveType,
  ArrayType,
  PointerType,
  FunctionType,
} from '../parser/ast';

/*
    ====================================
             --- GENERATOR ---
    ====================================
*/

/*

         AssemblyScriptGenerator
           ---
           generates AssemblyScript code from WORLDC AST.
           focuses on performance optimization and WebAssembly
           compatibility with strict typing and memory management.

*/

export class AssemblyScriptGenerator extends BaseCodeGenerator {
  public readonly target = CompilationTarget.ASSEMBLYSCRIPT;
  public readonly name = 'AssemblyScript Generator';
  public readonly version = '1.0.0';

  private typeMapping: Map<string, string>;
  private imports: Set<string>;
  private exports: Set<string>;
  private memoryAllocations: Set<string>;
  private staticVariables: Set<string>;

  constructor() {
    super();
    this.typeMapping = this.createTypeMapping();
    this.imports = new Set();
    this.exports = new Set();
    this.memoryAllocations = new Set();
    this.staticVariables = new Set();
  }

  /*

           createTypeMapping()
             ---
             creates mapping from C/C++ types to AssemblyScript types.
             leverages AssemblyScript's native integer and float types
             for optimal WebAssembly performance.

  */

  private createTypeMapping(): Map<string, string> {
    const mapping = new Map<string, string>();

    /* primitive type mappings optimized for WASM */
    mapping.set('int', 'i32');
    mapping.set('unsigned int', 'u32');
    mapping.set('short', 'i16');
    mapping.set('unsigned short', 'u16');
    mapping.set('char', 'i8');
    mapping.set('unsigned char', 'u8');
    mapping.set('long', 'i64');
    mapping.set('unsigned long', 'u64');
    mapping.set('float', 'f32');
    mapping.set('double', 'f64');
    mapping.set('bool', 'bool');
    mapping.set('void', 'void');

    /* direct AssemblyScript types */
    mapping.set('i8', 'i8');
    mapping.set('i16', 'i16');
    mapping.set('i32', 'i32');
    mapping.set('i64', 'i64');
    mapping.set('u8', 'u8');
    mapping.set('u16', 'u16');
    mapping.set('u32', 'u32');
    mapping.set('u64', 'u64');
    mapping.set('f32', 'f32');
    mapping.set('f64', 'f64');

    /* string handling in AssemblyScript */
    mapping.set('string', 'string');
    mapping.set('char*', 'string');

    /* pointer types become references or managed objects */
    mapping.set('void*', 'usize');
    mapping.set('int*', 'usize');
    mapping.set('float*', 'usize');

    return mapping;
  }

  /*

           file structure generation methods

  */

  protected emitFileHeader(): void {
    this.emitComment('Generated AssemblyScript code from WORLDC');
    this.emitComment(`Generated on ${new Date().toISOString()}`);
    this.emitComment('Optimized for WebAssembly performance');
    this.emitLine();

    /* emit memory management imports */
    this.imports.add('import { memory } from "env";');

    /* emit standard library imports if needed */
    if (this.options.optimizationLevel >= OptimizationLevel.BASIC) {
      this.imports.add('import { load, store } from "@assemblyscript/loader";');
    }

    /* emit imports */
    if (this.imports.size > 0) {
      for (const importStatement of this.imports) {
        this.emitLine(importStatement);
      }
      this.emitLine();
    }

    /* emit memory configuration */
    this.emitComment('Memory configuration for optimal WASM performance');
    this.emitLine('declare const memory: WebAssembly.Memory;');
    this.emitLine();
  }

  protected emitFileFooter(): void {
    this.emitLine();

    /* emit static variable initializations */
    if (this.staticVariables.size > 0) {
      this.emitComment('Static variable initialization');
      for (const staticVar of this.staticVariables) {
        this.emitLine(staticVar);
      }
      this.emitLine();
    }

    /* emit memory cleanup functions */
    if (this.memoryAllocations.size > 0) {
      this.emitMemoryCleanupFunctions();
    }

    /* emit exports */
    if (this.exports.size > 0) {
      this.emitComment('Exported functions and variables');
      for (const exportStatement of this.exports) {
        this.emitLine(exportStatement);
      }
    }

    /* emit final newline if requested */
    if (this.options.insertFinalNewline) {
      this.emitLine();
    }
  }

  private emitMemoryCleanupFunctions(): void {
    this.emitComment('Memory management functions');
    this.emitLine('export function cleanup(): void {');
    this.indent();
    this.emitComment('Cleanup allocated memory resources');
    for (const allocation of this.memoryAllocations) {
      this.emitLine(`// Free ${allocation}`);
    }
    this.dedent();
    this.emitLine('}');
    this.emitLine();
  }

  /*

           AST visitor implementations

  */

  public visitProgram(node: Program): void {
    this.enterScope('global');

    /* process all declarations */
    for (const declaration of node.declarations) {
      declaration.accept(this);
      this.emitLine();
    }

    this.exitScope();
  }

  public visitDeclaration(node: Declaration): void {
    if (node instanceof FunctionDeclaration) {
      this.visitFunctionDeclaration(node);
    } else if (node instanceof VariableDeclaration) {
      this.visitVariableDeclaration(node);
    } else if (node instanceof ClassDeclaration) {
      this.visitClassDeclaration(node);
    } else if (node instanceof InterfaceDeclaration) {
      this.visitInterfaceDeclaration(node);
    } else {
      this.addWarning(
        `Unsupported declaration type: ${node.constructor.name}`,
        'UNSUPPORTED_DECLARATION',
        node
      );
    }
  }

  public visitStatement(node: Statement): void {
    if (node instanceof BlockStatement) {
      this.visitBlockStatement(node);
    } else if (node instanceof ExpressionStatement) {
      this.visitExpressionStatement(node);
    } else if (node instanceof IfStatement) {
      this.visitIfStatement(node);
    } else if (node instanceof WhileStatement) {
      this.visitWhileStatement(node);
    } else if (node instanceof ForStatement) {
      this.visitForStatement(node);
    } else if (node instanceof ReturnStatement) {
      this.visitReturnStatement(node);
    } else {
      this.addWarning(
        `Unsupported statement type: ${node.constructor.name}`,
        'UNSUPPORTED_STATEMENT',
        node
      );
    }
  }

  public visitExpression(node: Expression): void {
    if (node instanceof BinaryExpression) {
      this.visitBinaryExpression(node);
    } else if (node instanceof UnaryExpression) {
      this.visitUnaryExpression(node);
    } else if (node instanceof CallExpression) {
      this.visitCallExpression(node);
    } else if (node instanceof MemberExpression) {
      this.visitMemberExpression(node);
    } else if (node instanceof AssignmentExpression) {
      this.visitAssignmentExpression(node);
    } else if (node instanceof Identifier) {
      this.visitIdentifier(node);
    } else if (node instanceof Literal) {
      this.visitLiteral(node);
    } else {
      this.addWarning(
        `Unsupported expression type: ${node.constructor.name}`,
        'UNSUPPORTED_EXPRESSION',
        node
      );
    }
  }

  public visitTypeNode(node: TypeNode): void {
    if (node instanceof PrimitiveType) {
      this.visitPrimitiveType(node);
    } else if (node instanceof ArrayType) {
      this.visitArrayType(node);
    } else if (node instanceof PointerType) {
      this.visitPointerType(node);
    } else if (node instanceof FunctionType) {
      this.visitFunctionType(node);
    } else {
      this.addWarning(
        `Unsupported type node: ${node.constructor.name}`,
        'UNSUPPORTED_TYPE',
        node
      );
    }
  }

  /*

           specific AST node visitors

  */

  private visitFunctionDeclaration(node: FunctionDeclaration): void {
    const functionName = CodegenUtils.sanitizeIdentifier(
      node.name,
      this.target
    );
    this.enterScope(functionName);

    /* generate function signature with AssemblyScript annotations */
    const isExport = false; // Export handling would need to be added to AST
    const isInline = false; // Inline handling would need to be added to AST

    let signature = '';

    if (isExport) {
      signature += 'export ';
    }

    if (isInline && this.options.optimizationLevel >= OptimizationLevel.BASIC) {
      signature += '@inline ';
    }

    signature += `function ${functionName}(`;

    /* emit parameters with strict types */
    const params: string[] = [];
    for (let i = 0; i < node.parameters.length; i++) {
      const param = node.parameters[i];
      if (!param) continue;
      const paramName = CodegenUtils.sanitizeIdentifier(
        param.name,
        this.target
      );
      const paramType = this.mapTypeToAssemblyScript(param.type);
      params.push(`${paramName}: ${paramType}`);
    }

    signature += params.join(', ');
    signature += ')';

    /* emit return type */
    if (node.returnType) {
      const returnType = this.mapTypeToAssemblyScript(node.returnType);
      signature += `: ${returnType}`;
    } else {
      signature += ': void';
    }

    signature += ' {';
    this.emitLine(signature);

    /* emit function body with optimization hints */
    this.indent();
    if (node.body) {
      node.body.accept(this);
    }
    this.dedent();

    this.emitLine('}');

    /* mark for export if needed */
    if (isExport) {
      this.exports.add(`export { ${functionName} };`);
    }

    this.metadata.functionsEmitted++;
    this.exitScope();
  }

  private visitVariableDeclaration(node: VariableDeclaration): void {
    const varName = CodegenUtils.sanitizeIdentifier(node.name, this.target);
    const isConst = node.isConst;
    const isStatic = node.isStatic;
    const isExport = false; // Export handling would need to be added to AST

    let declaration = '';

    if (isExport) {
      declaration += 'export ';
    }

    if (isStatic) {
      declaration += 'var '; /* static variables in AssemblyScript */
    } else {
      declaration += isConst ? 'const ' : 'let ';
    }

    declaration += varName;

    /* add explicit type annotation for AssemblyScript */
    if (node.type) {
      const asType = this.mapTypeToAssemblyScript(node.type);
      declaration += `: ${asType}`;
    } else {
      /* infer type from initializer if possible */
      if (node.initializer) {
        const inferredType = this.inferTypeFromExpression(node.initializer);
        if (inferredType) {
          declaration += `: ${inferredType}`;
        }
      }
    }

    /* add initializer if present */
    if (node.initializer) {
      declaration += ' = ';

      /* handle special cases for AssemblyScript */
      if (node.type && this.requiresCast(node.initializer, node.type)) {
        const targetType = this.mapTypeToAssemblyScript(node.type);
        declaration += `<${targetType}>`;
      }

      node.initializer.accept(this);
    } else if (!isConst) {
      /* provide default values for uninitialized variables */
      const defaultValue = this.getDefaultValue(node.type);
      if (defaultValue) {
        declaration += ` = ${defaultValue}`;
      }
    }

    declaration += ';';
    this.emitLine(declaration);

    /* track static variables for initialization */
    if (isStatic) {
      this.staticVariables.add(declaration);
    }
  }

  private visitClassDeclaration(node: ClassDeclaration): void {
    const className = CodegenUtils.sanitizeIdentifier(node.name, this.target);
    this.enterScope(className);

    const isExport = false; // Export handling would need to be added to AST
    let classDecl = '';

    if (isExport) {
      classDecl += 'export ';
    }

    classDecl += `class ${className}`;

    /* handle inheritance */
    if (node.superClass) {
      classDecl += ` extends ${node.superClass}`;
    }

    classDecl += ' {';
    this.emitLine(classDecl);

    /* emit class body with memory management considerations */
    this.indent();
    if (node.members && node.members.length > 0) {
      for (const member of node.members) {
        member.accept(this);
        this.emitLine();
      }
    }

    /* emit destructor if memory allocations are used */
    if (this.memoryAllocations.size > 0) {
      this.emitLine('__destroy(): void {');
      this.indent();
      this.emitComment('Cleanup class resources');
      this.dedent();
      this.emitLine('}');
    }

    this.dedent();
    this.emitLine('}');

    this.metadata.classesEmitted++;
    this.exitScope();
  }

  private visitInterfaceDeclaration(node: InterfaceDeclaration): void {
    this.addWarning(
      'Interfaces are not directly supported in AssemblyScript',
      'INTERFACE_NOT_SUPPORTED',
      node
    );

    /* convert interface to abstract class or skip */
    const interfaceName = CodegenUtils.sanitizeIdentifier(
      node.name,
      this.target
    );
    this.emitComment(
      `Interface ${interfaceName} - converted to abstract class`
    );
  }

  private visitBlockStatement(node: BlockStatement): void {
    for (const statement of node.statements) {
      statement.accept(this);
    }
  }

  private visitExpressionStatement(node: ExpressionStatement): void {
    node.expression.accept(this);
    this.emit(';');
    this.emitLine();
  }

  private visitIfStatement(node: IfStatement): void {
    this.emit('if (');
    node.condition.accept(this);
    this.emit(') {');
    this.emitLine();

    this.indent();
    node.thenStatement.accept(this);
    this.dedent();

    if (node.elseStatement) {
      this.emitLine('} else {');
      this.indent();
      node.elseStatement.accept(this);
      this.dedent();
    }

    this.emitLine('}');
  }

  private visitWhileStatement(node: WhileStatement): void {
    this.emit('while (');
    node.condition.accept(this);
    this.emit(') {');
    this.emitLine();

    this.indent();
    node.body.accept(this);
    this.dedent();

    this.emitLine('}');
  }

  private visitForStatement(node: ForStatement): void {
    this.emit('for (');

    if (node.init) {
      node.init.accept(this);
    }

    this.emit('; ');

    if (node.condition) {
      node.condition.accept(this);
    }

    this.emit('; ');

    if (node.update) {
      node.update.accept(this);
    }

    this.emit(') {');
    this.emitLine();

    this.indent();
    node.body.accept(this);
    this.dedent();

    this.emitLine('}');
  }

  private visitReturnStatement(node: ReturnStatement): void {
    this.emit('return');

    if (node.argument) {
      this.emit(' ');
      node.argument.accept(this);
    }

    this.emit(';');
    this.emitLine();
  }

  private visitBinaryExpression(node: BinaryExpression): void {
    /* handle type coercion for AssemblyScript */
    const needsCoercion = this.requiresTypeCoercion(node);

    if (needsCoercion) {
      this.emit('(');
    }

    node.left.accept(this);
    this.emit(` ${this.mapOperator(node.operator)} `);
    node.right.accept(this);

    if (needsCoercion) {
      this.emit(')');
    }
  }

  private visitUnaryExpression(node: UnaryExpression): void {
    this.emit(this.mapOperator(node.operator));
    node.argument.accept(this);
  }

  private visitCallExpression(node: CallExpression): void {
    node.callee.accept(this);
    this.emit('(');

    for (let i = 0; i < node.args.length; i++) {
      if (i > 0) this.emit(', ');

      /* handle type casting for function arguments */
      const arg = node.args[i];
      if (!arg) continue;

      const needsCast = this.requiresArgumentCast(arg, i);

      if (needsCast) {
        const castType = this.inferArgumentType(arg, i);
        this.emit(`<${castType}>`);
      }

      arg.accept(this);
    }

    this.emit(')');
  }

  private visitMemberExpression(node: MemberExpression): void {
    node.object.accept(this);

    if (node.computed) {
      this.emit('[');
      node.property.accept(this);
      this.emit(']');
    } else {
      this.emit('.');
      node.property.accept(this);
    }
  }

  private visitAssignmentExpression(node: AssignmentExpression): void {
    node.left.accept(this);
    this.emit(` ${node.operator} `);

    /* handle type casting for assignments */
    if (this.requiresAssignmentCast(node)) {
      const targetType = this.inferTargetType(node.left);
      this.emit(`<${targetType}>`);
    }

    node.right.accept(this);
  }

  private visitIdentifier(node: Identifier): void {
    const sanitized = CodegenUtils.sanitizeIdentifier(node.name, this.target);
    this.emit(sanitized);
  }

  private visitLiteral(node: Literal): void {
    if (typeof node.value === 'string') {
      const escaped = CodegenUtils.escapeString(node.value, this.target);
      this.emit(`"${escaped}"`);
    } else if (typeof node.value === 'number') {
      const formatted = this.formatNumberForAssemblyScript(node.value);
      this.emit(formatted);
    } else if (typeof node.value === 'boolean') {
      this.emit(node.value.toString());
    } else if (node.value === null) {
      this.emit('null');
    } else {
      this.emit(String(node.value));
    }
  }

  /*

           type system visitors

  */

  private visitPrimitiveType(node: PrimitiveType): void {
    this.emit(this.mapTypeToAssemblyScript(node));
  }

  private visitArrayType(node: ArrayType): void {
    const elementType = this.mapTypeToAssemblyScript(node.elementType);
    this.emit(`Array<${elementType}>`);
  }

  private visitPointerType(node: PointerType): void {
    /* pointers become memory addresses in AssemblyScript */
    this.emit('usize');
  }

  private visitFunctionType(node: FunctionType): void {
    this.emit('(');

    for (let i = 0; i < node.parameters.length; i++) {
      if (i > 0) this.emit(', ');
      const param = node.parameters[i];
      const paramType = this.mapTypeToAssemblyScript(param || 'any');
      this.emit(`param${i}: ${paramType}`);
    }

    this.emit(') => ');

    const returnType = this.mapTypeToAssemblyScript(node.returnType);
    this.emit(returnType);
  }

  /*

           utility methods specific to AssemblyScript

  */

  private mapTypeToAssemblyScript(type: TypeNode | string): string {
    if (typeof type === 'string') {
      return this.typeMapping.get(type) || type;
    }

    if (type instanceof PrimitiveType) {
      return this.typeMapping.get(type.name) || 'i32';
    }

    if (type instanceof ArrayType) {
      const elementType = this.mapTypeToAssemblyScript(type.elementType);
      return `Array<${elementType}>`;
    }

    if (type instanceof PointerType) {
      return 'usize'; /* memory address */
    }

    if (type instanceof FunctionType) {
      const params = type.parameters
        .map((p, i) => {
          const paramType = this.mapTypeToAssemblyScript(p);
          return `param${i}: ${paramType}`;
        })
        .join(', ');

      const returnType = this.mapTypeToAssemblyScript(type.returnType);
      return `(${params}) => ${returnType}`;
    }

    return 'i32'; /* default to i32 for unknown types */
  }

  private mapOperator(operator: string): string {
    /* most operators map directly, handle special cases */
    switch (operator) {
      case '==':
        return '==';
      case '!=':
        return '!=';
      case '&&':
        return '&&';
      case '||':
        return '||';
      case '<<':
        return '<<';
      case '>>':
        return '>>>'; /* unsigned right shift */
      default:
        return operator;
    }
  }

  private formatNumberForAssemblyScript(num: number): string {
    /* format numbers with appropriate type suffixes */
    if (Number.isInteger(num)) {
      if (num >= -2147483648 && num <= 2147483647) {
        return num.toString(); /* i32 range */
      } else {
        return `${num}i64`; /* i64 for larger integers */
      }
    } else {
      if (Math.abs(num) <= 3.4028235e38) {
        return `${num}f32`; /* f32 range */
      } else {
        return `${num}f64`; /* f64 for larger floats */
      }
    }
  }

  private requiresCast(expr: Expression, targetType: TypeNode | null): boolean {
    /* determine if expression needs type casting */
    if (!targetType) return false;

    const exprType = this.inferTypeFromExpression(expr);
    const targetAs = this.mapTypeToAssemblyScript(targetType);

    return exprType !== targetAs;
  }

  private requiresTypeCoercion(node: BinaryExpression): boolean {
    /* check if binary expression needs type coercion */
    const leftType = this.inferTypeFromExpression(node.left);
    const rightType = this.inferTypeFromExpression(node.right);

    return leftType !== rightType;
  }

  private requiresArgumentCast(arg: Expression, index: number): boolean {
    /* simplified argument casting check */
    return false; /* implement based on function signature analysis */
  }

  private requiresAssignmentCast(node: AssignmentExpression): boolean {
    /* check if assignment needs casting */
    const leftType = this.inferTargetType(node.left);
    const rightType = this.inferTypeFromExpression(node.right);

    return leftType !== rightType;
  }

  private inferTypeFromExpression(expr: Expression): string {
    if (expr instanceof Literal) {
      if (typeof expr.value === 'number') {
        return Number.isInteger(expr.value) ? 'i32' : 'f32';
      } else if (typeof expr.value === 'boolean') {
        return 'bool';
      } else if (typeof expr.value === 'string') {
        return 'string';
      }
    }

    return 'i32'; /* default assumption */
  }

  private inferTargetType(expr: Expression): string {
    /* implement type inference for assignment targets */
    return 'i32'; /* simplified */
  }

  private inferArgumentType(arg: Expression, index: number): string {
    /* implement argument type inference */
    return 'i32'; /* simplified */
  }

  private getDefaultValue(type: TypeNode | null): string | null {
    if (!type) return null;
    if (!(type instanceof PrimitiveType)) return null;

    const asType = this.mapTypeToAssemblyScript(type);

    switch (asType) {
      case 'i8':
      case 'i16':
      case 'i32':
      case 'i64':
      case 'u8':
      case 'u16':
      case 'u32':
      case 'u64':
        return '0';
      case 'f32':
      case 'f64':
        return '0.0';
      case 'bool':
        return 'false';
      case 'string':
        return '""';
      default:
        return null;
    }
  }

  /*

           configuration and validation methods

  */

  public supportsFeature(feature: string): boolean {
    const supportedFeatures = [
      'classes',
      'static-typing',
      'memory-management',
      'simd',
      'threading',
      'wasm-export',
      'performance-optimization',
      'inline-functions',
      'operator-overloading',
    ];

    return supportedFeatures.includes(feature);
  }

  public getDefaultOptions(): CodeGenerationOptions {
    return {
      target: CompilationTarget.ASSEMBLYSCRIPT,
      optimizationLevel: OptimizationLevel.AGGRESSIVE,
      outputFormat: 'esm',
      minify: false,
      sourceMaps: true,
      typeDeclarations: false /* AssemblyScript has built-in types */,
      indentSize: 2,
      useTabs: false,
      insertFinalNewline: true,
      strictMode: true,
      asyncSupport: false /* AssemblyScript doesn't support async */,
      moduleSystem: 'es6',
    };
  }

  public validateOptions(options: CodeGenerationOptions): CodegenDiagnostic[] {
    const diagnostics: CodegenDiagnostic[] = [];

    if (options.target !== CompilationTarget.ASSEMBLYSCRIPT) {
      diagnostics.push({
        severity: 'error',
        message: 'AssemblyScript generator only supports AssemblyScript target',
        code: 'INVALID_TARGET',
      });
    }

    if (options.asyncSupport) {
      diagnostics.push({
        severity: 'warning',
        message: 'AssemblyScript does not support async/await',
        code: 'ASYNC_NOT_SUPPORTED',
      });
    }

    if (options.indentSize < 1 || options.indentSize > 8) {
      diagnostics.push({
        severity: 'warning',
        message: 'Indent size should be between 1 and 8',
        code: 'INVALID_INDENT',
      });
    }

    return diagnostics;
  }
}

/* end of AssemblyScript generator */

/*
    ====================================
             --- EOF ---
    ====================================
*/
