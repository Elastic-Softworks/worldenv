/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         typescript-generator.ts
           ---
           TypeScript code generator for WORLDSRC language.

           this generator converts WORLDSRC AST nodes into
           valid TypeScript code, handling the hybrid syntax
           by translating C/C++ constructs into their TypeScript
           equivalents while preserving semantic meaning.

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

         TypeScriptGenerator
           ---
           generates TypeScript code from WORLDSRC AST.
           handles type mapping, syntax translation, and
           optimization for the TypeScript runtime environment.

*/

export class TypeScriptGenerator extends BaseCodeGenerator {
  public readonly target = CompilationTarget.TYPESCRIPT;
  public readonly name = 'TypeScript Generator';
  public readonly version = '1.0.0';

  private typeMapping: Map<string, string>;
  private imports: Set<string>;
  private exports: Set<string>;
  private interfaceDeclarations: Set<string>;

  constructor() {
    super();
    this.typeMapping = this.createTypeMapping();
    this.imports = new Set();
    this.exports = new Set();
    this.interfaceDeclarations = new Set();
  }

  /*

           createTypeMapping()
             ---
             creates mapping from C/C++ types to TypeScript types.
             handles primitive types, pointers, and complex types.

  */

  private createTypeMapping(): Map<string, string> {
    const mapping = new Map<string, string>();

    /* primitive type mappings */
    mapping.set('int', 'number');
    mapping.set('float', 'number');
    mapping.set('double', 'number');
    mapping.set('char', 'string');
    mapping.set('bool', 'boolean');
    mapping.set('void', 'void');
    mapping.set('string', 'string');

    /* size-specific integers */
    mapping.set('int8', 'number');
    mapping.set('int16', 'number');
    mapping.set('int32', 'number');
    mapping.set('int64', 'bigint');
    mapping.set('uint8', 'number');
    mapping.set('uint16', 'number');
    mapping.set('uint32', 'number');
    mapping.set('uint64', 'bigint');

    /* floating point types */
    mapping.set('f32', 'number');
    mapping.set('f64', 'number');

    /* pointer types become optional references */
    mapping.set('char*', 'string | null');
    mapping.set('void*', 'any | null');

    return mapping;
  }

  /*

           file structure generation methods

  */

  protected emitFileHeader(): void {
    this.emitComment('Generated TypeScript code from WORLDSRC');
    this.emitComment(`Generated on ${new Date().toISOString()}`);
    this.emitLine();

    /* emit strict mode if enabled */
    if (this.options.strictMode) {
      this.emitLine('"use strict";');
      this.emitLine();
    }

    /* emit imports */
    if (this.imports.size > 0) {
      for (const importStatement of this.imports) {
        this.emitLine(importStatement);
      }
      this.emitLine();
    }
  }

  protected emitFileFooter(): void {
    this.emitLine();

    /* emit exports */
    if (this.exports.size > 0) {
      this.emitLine('/* exports */');
      for (const exportStatement of this.exports) {
        this.emitLine(exportStatement);
      }
    }

    /* emit final newline if requested */
    if (this.options.insertFinalNewline) {
      this.emitLine();
    }
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

    /* generate function signature */
    const isAsync = node.isAsync || false;
    const isExport = false; // Export handling would need to be added to AST

    let signature = '';

    if (isExport) {
      signature += 'export ';
    }

    if (isAsync) {
      signature += 'async ';
    }

    signature += `function ${functionName}(`;

    /* emit parameters */
    const params: string[] = [];
    for (let i = 0; i < node.parameters.length; i++) {
      const param = node.parameters[i];
      if (!param) continue;
      const paramName = CodegenUtils.sanitizeIdentifier(
        param.name,
        this.target
      );
      const paramType = this.mapTypeToTypeScript(param.type);
      params.push(`${paramName}: ${paramType}`);
    }

    signature += params.join(', ');
    signature += ')';

    /* emit return type */
    if (node.returnType) {
      const returnType = this.mapTypeToTypeScript(node.returnType);
      if (isAsync && returnType !== 'void') {
        signature += `: Promise<${returnType}>`;
      } else if (isAsync) {
        signature += ': Promise<void>';
      } else {
        signature += `: ${returnType}`;
      }
    }

    signature += ' {';
    this.emitLine(signature);

    /* emit function body */
    this.indent();
    if (node.body) {
      node.body.accept(this);
    }
    this.dedent();

    this.emitLine('}');

    this.metadata.functionsEmitted++;
    this.exitScope();
  }

  private visitVariableDeclaration(node: VariableDeclaration): void {
    const varName = CodegenUtils.sanitizeIdentifier(node.name, this.target);
    const isConst = node.isConst;
    const isExport = false; // Export handling would need to be added to AST

    let declaration = '';

    if (isExport) {
      declaration += 'export ';
    }

    declaration += isConst ? 'const ' : 'let ';
    declaration += varName;

    /* add type annotation if available */
    if (node.type) {
      const tsType = this.mapTypeToTypeScript(node.type);
      declaration += `: ${tsType}`;
    }

    /* add initializer if present */
    if (node.initializer) {
      declaration += ' = ';
      node.initializer.accept(this);
    }

    declaration += ';';
    this.emitLine(declaration);
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

    /* handle interfaces */
    if (node.interfaces && node.interfaces.length > 0) {
      const interfaceNames = node.interfaces.map((i) => i).join(', ');
      classDecl += ` implements ${interfaceNames}`;
    }

    classDecl += ' {';
    this.emitLine(classDecl);

    /* emit class body */
    this.indent();
    if (node.members && node.members.length > 0) {
      for (const member of node.members) {
        member.accept(this);
        this.emitLine();
      }
    }
    this.dedent();

    this.emitLine('}');

    this.metadata.classesEmitted++;
    this.exitScope();
  }

  private visitInterfaceDeclaration(node: InterfaceDeclaration): void {
    const interfaceName = CodegenUtils.sanitizeIdentifier(
      node.name,
      this.target
    );
    this.interfaceDeclarations.add(interfaceName);

    const isExport = false; // Export handling would need to be added to AST
    let interfaceDecl = '';

    if (isExport) {
      interfaceDecl += 'export ';
    }

    interfaceDecl += `interface ${interfaceName}`;

    /* handle generic parameters */
    if (node.templateParameters && node.templateParameters.length > 0) {
      const typeParams = node.templateParameters
        .map((tp: any) => tp.name)
        .join(', ');
      interfaceDecl += `<${typeParams}>`;
    }

    /* handle inheritance */
    if (node.extends_ && node.extends_.length > 0) {
      const baseTypes = node.extends_.map((e: any) => e).join(', ');
      interfaceDecl += ` extends ${baseTypes}`;
    }

    interfaceDecl += ' {';
    this.emitLine(interfaceDecl);

    /* emit interface body */
    this.indent();
    if (node.members && node.members.length > 0) {
      for (const member of node.members) {
        member.accept(this);
      }
    }
    this.dedent();

    this.emitLine('}');
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
    node.left.accept(this);
    this.emit(` ${this.mapOperator(node.operator)} `);
    node.right.accept(this);
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
      const arg = node.args[i];
      if (!arg) continue;
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
      const formatted = CodegenUtils.formatNumber(node.value, this.target);
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
    this.emit(this.mapTypeToTypeScript(node));
  }

  private visitArrayType(node: ArrayType): void {
    const elementType = this.mapTypeToTypeScript(node.elementType);
    this.emit(`${elementType}[]`);
  }

  private visitPointerType(node: PointerType): void {
    const pointeeType = this.mapTypeToTypeScript(node.pointeeType);
    this.emit(`${pointeeType} | null`);
  }

  private visitFunctionType(node: FunctionType): void {
    this.emit('(');

    for (let i = 0; i < node.parameters.length; i++) {
      if (i > 0) this.emit(', ');
      const param = node.parameters[i];
      const paramType = this.mapTypeToTypeScript(param || 'any');
      this.emit(`param${i}: ${paramType}`);
    }

    this.emit(') => ');

    const returnType = this.mapTypeToTypeScript(node.returnType);
    this.emit(returnType);
  }

  /*

           utility methods

  */

  private mapTypeToTypeScript(type: TypeNode | string): string {
    if (typeof type === 'string') {
      return this.typeMapping.get(type) || type;
    }

    if (type instanceof PrimitiveType) {
      return this.typeMapping.get(type.name) || type.name;
    }

    if (type instanceof ArrayType) {
      const elementType = this.mapTypeToTypeScript(type.elementType);
      return `${elementType}[]`;
    }

    if (type instanceof PointerType) {
      const pointeeType = this.mapTypeToTypeScript(type.pointeeType);
      return `${pointeeType} | null`;
    }

    if (type instanceof FunctionType) {
      const params = type.parameters
        .map((p, i) => {
          const paramType = this.mapTypeToTypeScript(p);
          return `param${i}: ${paramType}`;
        })
        .join(', ');

      const returnType = this.mapTypeToTypeScript(type.returnType);
      return `(${params}) => ${returnType}`;
    }

    return 'any';
  }

  private mapOperator(operator: string): string {
    /* most operators map directly, but handle special cases */
    switch (operator) {
      case '&&':
        return '&&';
      case '||':
        return '||';
      case '==':
        return '==='; /* use strict equality */
      case '!=':
        return '!=='; /* use strict inequality */
      default:
        return operator;
    }
  }

  /*

           configuration and validation methods

  */

  public supportsFeature(feature: string): boolean {
    const supportedFeatures = [
      'classes',
      'interfaces',
      'generics',
      'async-await',
      'modules',
      'decorators',
      'type-annotations',
      'arrow-functions',
      'destructuring',
      'template-literals',
    ];

    return supportedFeatures.includes(feature);
  }

  public getDefaultOptions(): CodeGenerationOptions {
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

  public validateOptions(options: CodeGenerationOptions): CodegenDiagnostic[] {
    const diagnostics: CodegenDiagnostic[] = [];

    if (options.target !== CompilationTarget.TYPESCRIPT) {
      diagnostics.push({
        severity: 'error',
        message: 'TypeScript generator only supports TypeScript target',
        code: 'INVALID_TARGET',
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

/* end of TypeScript generator */

/*
    ====================================
             --- EOF ---
    ====================================
*/
