/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Simple Semantic Analyzer
 *
 * Simplified semantic analysis engine that provides basic type checking
 * and symbol resolution for the WORLDSRC C/C++/TypeScript hybrid language.
 * Designed to work with the existing AST structure.
 */

import {
  Symbol,
  SymbolKind,
  SymbolVisibility,
  SymbolTable,
  ScopeType,
  TypeInfo,
  globalSymbolTable
} from './symbol-table';

import {
  TypeDescriptor,
  TypeRegistry,
  TypeChecker,
  globalTypeRegistry,
  globalTypeChecker
} from './type-system';

import {
  SourceLocation,
  globalErrorHandler
} from '../error/error-handler';

export interface SimpleAnalysisResult {
  success: boolean;
  errors: number;
  warnings: number;
  symbolsFound: number;
  typesChecked: number;
}

export class SimpleSemanticAnalyzer {
  private symbolTable: SymbolTable;
  private typeRegistry: TypeRegistry;
  private typeChecker: TypeChecker;
  private symbolsFound = 0;
  private typesChecked = 0;

  constructor(
    symbolTable = globalSymbolTable,
    typeRegistry = globalTypeRegistry,
    typeChecker = globalTypeChecker
  ) {
    this.symbolTable = symbolTable;
    this.typeRegistry = typeRegistry;
    this.typeChecker = typeChecker;
  }

  /**
   * Analyze parsed AST
   */
  public analyze(ast: any): SimpleAnalysisResult {
    const startErrors = globalErrorHandler.getErrorCount();
    const startWarnings = globalErrorHandler.getWarningCount();

    this.symbolsFound = 0;
    this.typesChecked = 0;

    try {
      if (ast && ast.declarations) {
        this.analyzeDeclarations(ast.declarations);
      } else {
        globalErrorHandler.reportWarning(
          'No AST declarations found to analyze',
          { line: 1, column: 1, file: '<input>' }
        );
      }
    } catch (error) {
      globalErrorHandler.reportInternalError(
        `Semantic analysis failed: ${(error as Error).message}`,
        error as Error
      );
    }

    const errors = globalErrorHandler.getErrorCount() - startErrors;
    const warnings = globalErrorHandler.getWarningCount() - startWarnings;

    return {
      success: errors === 0,
      errors,
      warnings,
      symbolsFound: this.symbolsFound,
      typesChecked: this.typesChecked
    };
  }

  /**
   * Analyze list of declarations
   */
  private analyzeDeclarations(declarations: any[]): void {
    /* First pass: collect symbols for forward references */
    for (const decl of declarations) {
      this.collectSymbol(decl);
    }

    /* Second pass: analyze types and validate */
    for (const decl of declarations) {
      this.analyzeDeclaration(decl);
    }
  }

  /**
   * Collect symbol from declaration
   */
  private collectSymbol(decl: any): void {
    if (!decl || !decl.constructor || !decl.name) {
      return;
    }

    const declType = decl.constructor.name;
    let symbolKind = SymbolKind.VARIABLE;

    switch (declType) {
      case 'FunctionDeclaration':
        symbolKind = SymbolKind.FUNCTION;
        break;
      case 'ClassDeclaration':
        symbolKind = SymbolKind.CLASS;
        break;
      case 'InterfaceDeclaration':
        symbolKind = SymbolKind.INTERFACE;
        break;
      case 'StructDeclaration':
        symbolKind = SymbolKind.STRUCT;
        break;
      case 'VariableDeclaration':
        symbolKind = SymbolKind.VARIABLE;
        break;
      default:
        globalErrorHandler.reportWarning(
          `Unknown declaration type: ${declType}`,
          this.getLocation(decl)
        );
        return;
    }

    const typeInfo = this.extractTypeInfo(decl);

    const symbol: Symbol = {
      name: decl.name,
      kind: symbolKind,
      type: typeInfo,
      visibility: SymbolVisibility.PUBLIC,
      location: this.getLocation(decl),
      scope: this.symbolTable.getCurrentScope()
    };

    if (this.symbolTable.addSymbol(symbol)) {
      this.symbolsFound++;
    } else {
      globalErrorHandler.reportSemanticError(
        `Symbol '${decl.name}' is already declared`,
        this.getLocation(decl)
      );
    }
  }

  /**
   * Analyze individual declaration
   */
  private analyzeDeclaration(decl: any): void {
    if (!decl || !decl.constructor) {
      return;
    }

    const declType = decl.constructor.name;

    switch (declType) {
      case 'FunctionDeclaration':
        this.analyzeFunctionDeclaration(decl);
        break;
      case 'ClassDeclaration':
        this.analyzeClassDeclaration(decl);
        break;
      case 'VariableDeclaration':
        this.analyzeVariableDeclaration(decl);
        break;
      case 'InterfaceDeclaration':
        this.analyzeInterfaceDeclaration(decl);
        break;
      case 'StructDeclaration':
        this.analyzeStructDeclaration(decl);
        break;
      default:
        /* Already warned in collectSymbol */
        break;
    }
  }

  /**
   * Analyze function declaration
   */
  private analyzeFunctionDeclaration(funcDecl: any): void {
    const symbol = this.symbolTable.lookup(funcDecl.name);
    if (!symbol) {
      globalErrorHandler.reportSemanticError(
        `Function '${funcDecl.name}' not found in symbol table`,
        this.getLocation(funcDecl)
      );
      return;
    }

    /* Enter function scope */
    this.symbolTable.enterScope(
      ScopeType.FUNCTION,
      funcDecl.name,
      this.getLocation(funcDecl)
    );

    /* Analyze parameters */
    if (funcDecl.parameters && Array.isArray(funcDecl.parameters)) {
      for (const param of funcDecl.parameters) {
        this.analyzeParameter(param);
      }
    }

    /* Analyze return type */
    if (funcDecl.returnType) {
      this.validateType(funcDecl.returnType);
    }

    /* Analyze function body */
    if (funcDecl.body) {
      this.analyzeStatement(funcDecl.body);
    }

    /* Exit function scope */
    this.symbolTable.exitScope();

    this.typesChecked++;
  }

  /**
   * Analyze parameter
   */
  private analyzeParameter(param: any): void {
    if (!param || !param.name) {
      return;
    }

    const typeInfo = this.extractTypeInfo(param);

    const paramSymbol: Symbol = {
      name: param.name,
      kind: SymbolKind.PARAMETER,
      type: typeInfo,
      visibility: SymbolVisibility.PUBLIC,
      location: this.getLocation(param),
      scope: this.symbolTable.getCurrentScope()
    };

    if (!this.symbolTable.addSymbol(paramSymbol)) {
      globalErrorHandler.reportSemanticError(
        `Parameter '${param.name}' is already declared`,
        this.getLocation(param)
      );
    }
  }

  /**
   * Analyze class declaration
   */
  private analyzeClassDeclaration(classDecl: any): void {
    /* Enter class scope */
    this.symbolTable.enterScope(
      ScopeType.CLASS,
      classDecl.name,
      this.getLocation(classDecl)
    );

    /* Analyze class members */
    if (classDecl.members && Array.isArray(classDecl.members)) {
      for (const member of classDecl.members) {
        this.analyzeDeclaration(member);
      }
    }

    /* Exit class scope */
    this.symbolTable.exitScope();

    this.typesChecked++;
  }

  /**
   * Analyze variable declaration
   */
  private analyzeVariableDeclaration(varDecl: any): void {
    const symbol = this.symbolTable.lookup(varDecl.name);
    if (!symbol) {
      globalErrorHandler.reportSemanticError(
        `Variable '${varDecl.name}' not found in symbol table`,
        this.getLocation(varDecl)
      );
      return;
    }

    /* Validate type */
    if (varDecl.type) {
      this.validateType(varDecl.type);
    }

    /* Check initializer if present */
    if (varDecl.initializer) {
      const initType = this.analyzeExpression(varDecl.initializer);
      if (initType && varDecl.type) {
        this.validateTypeCompatibility(
          this.extractTypeInfo(varDecl),
          initType,
          'initialization'
        );
      }
    }

    this.typesChecked++;
  }

  /**
   * Analyze interface declaration
   */
  private analyzeInterfaceDeclaration(interfaceDecl: any): void {
    /* Enter interface scope */
    this.symbolTable.enterScope(
      ScopeType.INTERFACE,
      interfaceDecl.name,
      this.getLocation(interfaceDecl)
    );

    /* Analyze interface members */
    if (interfaceDecl.members && Array.isArray(interfaceDecl.members)) {
      for (const member of interfaceDecl.members) {
        this.analyzeDeclaration(member);
      }
    }

    /* Exit interface scope */
    this.symbolTable.exitScope();

    this.typesChecked++;
  }

  /**
   * Analyze struct declaration
   */
  private analyzeStructDeclaration(structDecl: any): void {
    /* Enter struct scope */
    this.symbolTable.enterScope(
      ScopeType.CLASS,
      structDecl.name,
      this.getLocation(structDecl)
    );

    /* Analyze struct members */
    if (structDecl.members && Array.isArray(structDecl.members)) {
      for (const member of structDecl.members) {
        this.analyzeDeclaration(member);
      }
    }

    /* Exit struct scope */
    this.symbolTable.exitScope();

    this.typesChecked++;
  }

  /**
   * Analyze statement
   */
  private analyzeStatement(stmt: any): void {
    if (!stmt || !stmt.constructor) {
      return;
    }

    const stmtType = stmt.constructor.name;

    switch (stmtType) {
      case 'BlockStatement':
        this.analyzeBlockStatement(stmt);
        break;
      case 'ExpressionStatement':
        if (stmt.expression) {
          this.analyzeExpression(stmt.expression);
        }
        break;
      case 'IfStatement':
        this.analyzeIfStatement(stmt);
        break;
      case 'ForStatement':
        this.analyzeForStatement(stmt);
        break;
      case 'WhileStatement':
        this.analyzeWhileStatement(stmt);
        break;
      case 'ReturnStatement':
        this.analyzeReturnStatement(stmt);
        break;
      default:
        /* Ignore unknown statements for now */
        break;
    }
  }

  /**
   * Analyze block statement
   */
  private analyzeBlockStatement(blockStmt: any): void {
    /* Enter block scope */
    this.symbolTable.enterScope(
      ScopeType.BLOCK,
      `block_${Date.now()}`,
      this.getLocation(blockStmt)
    );

    if (blockStmt.statements && Array.isArray(blockStmt.statements)) {
      for (const stmt of blockStmt.statements) {
        this.analyzeStatement(stmt);
      }
    }

    /* Exit block scope */
    this.symbolTable.exitScope();
  }

  /**
   * Analyze if statement
   */
  private analyzeIfStatement(ifStmt: any): void {
    /* Analyze condition */
    if (ifStmt.condition || ifStmt.test) {
      const condition = ifStmt.condition || ifStmt.test;
      const condType = this.analyzeExpression(condition);

      if (condType) {
        const boolType = this.typeRegistry.getType('bool');
        if (boolType && !this.typeChecker.isAssignable(condType, boolType)) {
          globalErrorHandler.reportWarning(
            `If condition should be boolean, got '${condType.name}'`,
            this.getLocation(ifStmt)
          );
        }
      }
    }

    /* Analyze then branch */
    if (ifStmt.then || ifStmt.consequent) {
      this.analyzeStatement(ifStmt.then || ifStmt.consequent);
    }

    /* Analyze else branch */
    if (ifStmt.else || ifStmt.alternate) {
      this.analyzeStatement(ifStmt.else || ifStmt.alternate);
    }
  }

  /**
   * Analyze for statement
   */
  private analyzeForStatement(forStmt: any): void {
    /* Enter for scope */
    this.symbolTable.enterScope(
      ScopeType.BLOCK,
      `for_${Date.now()}`,
      this.getLocation(forStmt)
    );

    /* Analyze init */
    if (forStmt.init) {
      if (forStmt.init.constructor && forStmt.init.constructor.name === 'VariableDeclaration') {
        this.analyzeVariableDeclaration(forStmt.init);
      } else {
        this.analyzeExpression(forStmt.init);
      }
    }

    /* Analyze condition */
    if (forStmt.condition || forStmt.test) {
      this.analyzeExpression(forStmt.condition || forStmt.test);
    }

    /* Analyze update */
    if (forStmt.update) {
      this.analyzeExpression(forStmt.update);
    }

    /* Analyze body */
    if (forStmt.body) {
      this.analyzeStatement(forStmt.body);
    }

    /* Exit for scope */
    this.symbolTable.exitScope();
  }

  /**
   * Analyze while statement
   */
  private analyzeWhileStatement(whileStmt: any): void {
    /* Analyze condition */
    if (whileStmt.condition || whileStmt.test) {
      this.analyzeExpression(whileStmt.condition || whileStmt.test);
    }

    /* Analyze body */
    if (whileStmt.body) {
      this.analyzeStatement(whileStmt.body);
    }
  }

  /**
   * Analyze return statement
   */
  private analyzeReturnStatement(returnStmt: any): void {
    if (returnStmt.argument || returnStmt.value) {
      this.analyzeExpression(returnStmt.argument || returnStmt.value);
    }
  }

  /**
   * Analyze expression and return its type
   */
  private analyzeExpression(expr: any): TypeDescriptor | undefined {
    if (!expr || !expr.constructor) {
      return undefined;
    }

    const exprType = expr.constructor.name;

    switch (exprType) {
      case 'Identifier':
        return this.analyzeIdentifier(expr);
      case 'Literal':
        return this.analyzeLiteral(expr);
      case 'BinaryExpression':
        return this.analyzeBinaryExpression(expr);
      case 'UnaryExpression':
        return this.analyzeUnaryExpression(expr);
      case 'CallExpression':
        return this.analyzeCallExpression(expr);
      case 'MemberExpression':
        return this.analyzeMemberExpression(expr);
      case 'AssignmentExpression':
        return this.analyzeAssignmentExpression(expr);
      default:
        /* Return unknown type for unsupported expressions */
        return this.typeRegistry.getType('any');
    }
  }

  /**
   * Analyze identifier
   */
  private analyzeIdentifier(identifier: any): TypeDescriptor | undefined {
    if (!identifier.name) {
      return undefined;
    }

    const symbol = this.symbolTable.lookup(identifier.name);
    if (!symbol) {
      globalErrorHandler.reportSemanticError(
        `Undefined identifier '${identifier.name}'`,
        this.getLocation(identifier)
      );
      return undefined;
    }

    return this.typeChecker.convertTypeInfo(symbol.type);
  }

  /**
   * Analyze literal
   */
  private analyzeLiteral(literal: any): TypeDescriptor | undefined {
    if (literal.value === undefined && literal.value === null) {
      return this.typeRegistry.getType('null');
    }

    switch (typeof literal.value) {
      case 'number':
        return literal.value % 1 === 0
          ? this.typeRegistry.getType('int')
          : this.typeRegistry.getType('float');
      case 'string':
        return this.typeRegistry.getType('string');
      case 'boolean':
        return this.typeRegistry.getType('bool');
      default:
        return this.typeRegistry.getType('any');
    }
  }

  /**
   * Analyze binary expression
   */
  private analyzeBinaryExpression(binExpr: any): TypeDescriptor | undefined {
    const leftType = this.analyzeExpression(binExpr.left);
    const rightType = this.analyzeExpression(binExpr.right);

    if (!leftType || !rightType) {
      return undefined;
    }

    /* Basic operator validation */
    const operator = binExpr.operator;
    if (!operator) {
      return leftType;
    }

    /* Comparison operators return boolean */
    const comparisonOps = ['==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    if (comparisonOps.includes(operator)) {
      return this.typeRegistry.getType('bool');
    }

    /* Arithmetic operators return the wider type */
    const arithmeticOps = ['+', '-', '*', '/', '%'];
    if (arithmeticOps.includes(operator)) {
      return this.getWiderType(leftType, rightType);
    }

    return leftType;
  }

  /**
   * Analyze unary expression
   */
  private analyzeUnaryExpression(unaryExpr: any): TypeDescriptor | undefined {
    const operandType = this.analyzeExpression(unaryExpr.argument);
    if (!operandType) {
      return undefined;
    }

    /* Logical NOT returns boolean */
    if (unaryExpr.operator === '!') {
      return this.typeRegistry.getType('bool');
    }

    /* Other unary operators return same type */
    return operandType;
  }

  /**
   * Analyze call expression
   */
  private analyzeCallExpression(callExpr: any): TypeDescriptor | undefined {
    /* Get function symbol */
    let functionSymbol: Symbol | undefined;
    if (callExpr.callee && callExpr.callee.constructor.name === 'Identifier') {
      functionSymbol = this.symbolTable.lookup(callExpr.callee.name);
    }

    if (!functionSymbol || functionSymbol.kind !== SymbolKind.FUNCTION) {
      globalErrorHandler.reportSemanticError(
        `Cannot call non-function`,
        this.getLocation(callExpr)
      );
      return undefined;
    }

    /* Analyze arguments */
    if (callExpr.args || callExpr.arguments) {
      const args = callExpr.args || callExpr.arguments;
      if (Array.isArray(args)) {
        for (const arg of args) {
          this.analyzeExpression(arg);
        }
      }
    }

    /* Return function return type */
    return this.typeChecker.convertTypeInfo(functionSymbol.type);
  }

  /**
   * Analyze member expression
   */
  private analyzeMemberExpression(memberExpr: any): TypeDescriptor | undefined {
    const objectType = this.analyzeExpression(memberExpr.object);
    if (!objectType) {
      return undefined;
    }

    /* For now, just return the object type */
    /* A full implementation would check member access */
    return objectType;
  }

  /**
   * Analyze assignment expression
   */
  private analyzeAssignmentExpression(assignExpr: any): TypeDescriptor | undefined {
    const leftType = this.analyzeExpression(assignExpr.left);
    const rightType = this.analyzeExpression(assignExpr.right);

    if (leftType && rightType) {
      this.validateTypeCompatibility(leftType, rightType, 'assignment');
    }

    return leftType;
  }

  /**
   * Helper methods
   */

  /**
   * Extract type information from AST node
   */
  private extractTypeInfo(node: any): TypeInfo {
    let typeName = 'unknown';

    if (node.type && node.type.name) {
      typeName = node.type.name;
    } else if (node.returnType && node.returnType.name) {
      typeName = node.returnType.name;
    } else if (node.constructor.name === 'FunctionDeclaration') {
      typeName = 'function';
    } else if (node.constructor.name === 'ClassDeclaration') {
      typeName = node.name || 'class';
    }

    return {
      name: typeName,
      isPointer: node.type?.isPointer || false,
      isReference: node.type?.isReference || false,
      isArray: node.type?.isArray || false,
      isConst: node.isConst || false,
      isVolatile: false
    };
  }

  /**
   * Validate that a type exists
   */
  private validateType(typeNode: any): boolean {
    if (!typeNode || !typeNode.name) {
      return false;
    }

    const type = this.typeRegistry.getType(typeNode.name);
    if (!type) {
      globalErrorHandler.reportSemanticError(
        `Unknown type '${typeNode.name}'`,
        this.getLocation(typeNode)
      );
      return false;
    }

    return true;
  }

  /**
   * Validate type compatibility
   */
  private validateTypeCompatibility(
    targetType: TypeDescriptor | TypeInfo,
    sourceType: TypeDescriptor | TypeInfo,
    context: string
  ): boolean {
    const target = 'kind' in targetType ? targetType : this.typeChecker.convertTypeInfo(targetType);
    const source = 'kind' in sourceType ? sourceType : this.typeChecker.convertTypeInfo(sourceType);

    if (!this.typeChecker.isAssignable(source, target)) {
      globalErrorHandler.reportSemanticError(
        `Type mismatch in ${context}: cannot assign '${source.name}' to '${target.name}'`,
        { line: 0, column: 0, file: '<analysis>' }
      );
      return false;
    }

    return true;
  }

  /**
   * Get wider type for arithmetic operations
   */
  private getWiderType(type1: TypeDescriptor, type2: TypeDescriptor): TypeDescriptor {
    const hierarchy = ['char', 'int', 'float', 'double'];

    const index1 = hierarchy.indexOf(type1.name);
    const index2 = hierarchy.indexOf(type2.name);

    if (index1 >= 0 && index2 >= 0) {
      return index1 > index2 ? type1 : type2;
    }

    return type1;
  }

  /**
   * Get source location from AST node
   */
  private getLocation(node: any): SourceLocation {
    if (node && node.location) {
      return {
        line: node.location.start?.line || 0,
        column: node.location.start?.column || 0,
        file: node.location.filename || '<input>'
      };
    }

    return {
      line: 0,
      column: 0,
      file: '<unknown>'
    };
  }

  /**
   * Reset analyzer state
   */
  public reset(): void {
    this.symbolsFound = 0;
    this.typesChecked = 0;
    this.symbolTable.clear();
  }

  /**
   * Get analysis statistics
   */
  public getStatistics(): {
    symbolsInTable: number;
    typesInRegistry: number;
    currentScope: string;
  } {
    return {
      symbolsInTable: this.symbolsFound,
      typesInRegistry: this.typeRegistry.getAllTypes().size,
      currentScope: this.symbolTable.getCurrentScope().name
    };
  }
}

/**
 * Global simple semantic analyzer instance
 */
export const globalSimpleAnalyzer = new SimpleSemanticAnalyzer();
