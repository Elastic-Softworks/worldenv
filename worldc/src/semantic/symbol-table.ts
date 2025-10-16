/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Symbol Table
 *
 * Comprehensive symbol table implementation for semantic analysis
 * supporting C, C++, TypeScript hybrid language features including
 * scoped symbol resolution, forward declarations, and template management.
 */

import { SourceLocation } from '../error/error-handler';

export enum SymbolKind {
  VARIABLE = 'VARIABLE',
  FUNCTION = 'FUNCTION',
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  STRUCT = 'STRUCT',
  ENUM = 'ENUM',
  NAMESPACE = 'NAMESPACE',
  TEMPLATE = 'TEMPLATE',
  TYPEDEF = 'TYPEDEF',
  PARAMETER = 'PARAMETER',
  FIELD = 'FIELD',
  METHOD = 'METHOD',
  CONSTRUCTOR = 'CONSTRUCTOR',
  DESTRUCTOR = 'DESTRUCTOR',
  OPERATOR = 'OPERATOR',
  LABEL = 'LABEL'
}

export enum SymbolVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
  INTERNAL = 'INTERNAL'
}

export enum StorageClass {
  AUTO = 'AUTO',
  STATIC = 'STATIC',
  EXTERN = 'EXTERN',
  REGISTER = 'REGISTER',
  MUTABLE = 'MUTABLE',
  CONST = 'CONST',
  VOLATILE = 'VOLATILE',
  THREAD_LOCAL = 'THREAD_LOCAL'
}

export interface TypeInfo {
  name: string;
  isPointer: boolean;
  isReference: boolean;
  isArray: boolean;
  arraySize?: number;
  isConst: boolean;
  isVolatile: boolean;
  templateParameters?: TypeInfo[];
  baseTypes?: TypeInfo[];           /* For inheritance */
  memberTypes?: Map<string, TypeInfo>; /* For struct/class members */
}

export interface TemplateParameter {
  name: string;
  type: 'typename' | 'class' | 'int' | 'template';
  defaultValue?: string;
  constraint?: string;
}

export interface FunctionSignature {
  returnType: TypeInfo;
  parameters: Array<{
    name: string;
    type: TypeInfo;
    defaultValue?: string;
    isOptional?: boolean;
  }>;
  isVirtual: boolean;
  isOverride: boolean;
  isFinal: boolean;
  isAsync: boolean;
  templateParameters?: TemplateParameter[];
}

export interface Symbol {
  name: string;
  kind: SymbolKind;
  type: TypeInfo;
  visibility: SymbolVisibility;
  storageClass?: StorageClass;
  location: SourceLocation;
  scope: Scope;

  /* Function-specific properties */
  signature?: FunctionSignature;
  isForwardDeclaration?: boolean;
  isDefinition?: boolean;

  /* Template-specific properties */
  templateParameters?: TemplateParameter[];
  templateInstantiations?: Map<string, Symbol>;

  /* Class/Interface-specific properties */
  baseClasses?: string[];
  interfaces?: string[];
  members?: Map<string, Symbol>;

  /* Additional metadata */
  documentation?: string;
  attributes?: Map<string, string>;
  usageCount?: number;
  isExported?: boolean;
  isImported?: boolean;
  importSource?: string;
}

export enum ScopeType {
  GLOBAL = 'GLOBAL',
  NAMESPACE = 'NAMESPACE',
  CLASS = 'CLASS',
  FUNCTION = 'FUNCTION',
  BLOCK = 'BLOCK',
  TEMPLATE = 'TEMPLATE',
  INTERFACE = 'INTERFACE'
}

export class Scope {
  public symbols = new Map<string, Symbol>();
  public children: Scope[] = [];
  public templateInstantiations = new Map<string, Scope>();

  constructor(
    public type: ScopeType,
    public name: string,
    public parent?: Scope,
    public location?: SourceLocation
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  /**
   * Add symbol to this scope
   */
  public addSymbol(symbol: Symbol): boolean {
    /* Check for redefinition */
    const existing = this.symbols.get(symbol.name);
    if (existing) {
      /* Allow forward declarations */
      if (existing.isForwardDeclaration && !symbol.isForwardDeclaration) {
        /* Replace forward declaration with definition */
        this.symbols.set(symbol.name, symbol);
        return true;
      }

      /* Allow function overloading */
      if (existing.kind === SymbolKind.FUNCTION && symbol.kind === SymbolKind.FUNCTION) {
        return this.addOverloadedFunction(existing, symbol);
      }

      /* Redefinition error */
      return false;
    }

    symbol.scope = this;
    this.symbols.set(symbol.name, symbol);
    return true;
  }

  /**
   * Handle function overloading
   */
  private addOverloadedFunction(existing: Symbol, newSymbol: Symbol): boolean {
    /* Create overload set if needed */
    if (!existing.attributes) {
      existing.attributes = new Map();
    }

    /* Check if signatures are different */
    if (this.areFunctionSignaturesDifferent(existing.signature!, newSymbol.signature!)) {
      /* Store overloads in attributes */
      const overloadKey = `overload_${this.symbols.size}`;
      existing.attributes.set(overloadKey, JSON.stringify(newSymbol));
      return true;
    }

    return false; /* Identical signatures */
  }

  /**
   * Check if function signatures are different
   */
  private areFunctionSignaturesDifferent(sig1: FunctionSignature, sig2: FunctionSignature): boolean {
    if (sig1.parameters.length !== sig2.parameters.length) {
      return true;
    }

    for (let i = 0; i < sig1.parameters.length; i++) {
      if (!this.areTypesEqual(sig1.parameters[i].type, sig2.parameters[i].type)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two types are equal
   */
  private areTypesEqual(type1: TypeInfo, type2: TypeInfo): boolean {
    return type1.name === type2.name &&
           type1.isPointer === type2.isPointer &&
           type1.isReference === type2.isReference &&
           type1.isArray === type2.isArray &&
           type1.arraySize === type2.arraySize &&
           type1.isConst === type2.isConst;
  }

  /**
   * Lookup symbol in this scope only
   */
  public lookupLocal(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }

  /**
   * Lookup symbol in this scope and parent scopes
   */
  public lookup(name: string): Symbol | undefined {
    const symbol = this.symbols.get(name);
    if (symbol) {
      return symbol;
    }

    return this.parent?.lookup(name);
  }

  /**
   * Lookup symbol with qualified name (namespace::class::member)
   */
  public lookupQualified(qualifiedName: string): Symbol | undefined {
    const parts = qualifiedName.split('::');

    if (parts.length === 1) {
      return this.lookup(parts[0]);
    }

    /* Find namespace or class scope */
    let currentScope: Scope | undefined = this;
    for (let i = 0; i < parts.length - 1; i++) {
      const scopeSymbol = currentScope.lookup(parts[i]);
      if (!scopeSymbol) {
        return undefined;
      }

      /* Find child scope */
      currentScope = currentScope.children.find(child => child.name === parts[i]);
      if (!currentScope) {
        return undefined;
      }
    }

    return currentScope.lookup(parts[parts.length - 1]);
  }

  /**
   * Get all symbols in scope (including inherited)
   */
  public getAllSymbols(): Map<string, Symbol> {
    const allSymbols = new Map<string, Symbol>();

    /* Add parent symbols first */
    if (this.parent) {
      const parentSymbols = this.parent.getAllSymbols();
      for (const [name, symbol] of parentSymbols) {
        allSymbols.set(name, symbol);
      }
    }

    /* Add local symbols (override parent symbols) */
    for (const [name, symbol] of this.symbols) {
      allSymbols.set(name, symbol);
    }

    return allSymbols;
  }

  /**
   * Create child scope
   */
  public createChild(type: ScopeType, name: string, location?: SourceLocation): Scope {
    return new Scope(type, name, this, location);
  }

  /**
   * Find child scope by name
   */
  public findChild(name: string): Scope | undefined {
    return this.children.find(child => child.name === name);
  }

  /**
   * Get scope depth
   */
  public getDepth(): number {
    return this.parent ? this.parent.getDepth() + 1 : 0;
  }

  /**
   * Get full qualified name of this scope
   */
  public getQualifiedName(): string {
    if (!this.parent || this.parent.type === ScopeType.GLOBAL) {
      return this.name;
    }

    return `${this.parent.getQualifiedName()}::${this.name}`;
  }

  /**
   * Check if symbol is accessible from this scope
   */
  public isSymbolAccessible(symbol: Symbol): boolean {
    /* Public symbols are always accessible */
    if (symbol.visibility === SymbolVisibility.PUBLIC) {
      return true;
    }

    /* Private symbols only accessible within same class */
    if (symbol.visibility === SymbolVisibility.PRIVATE) {
      return this.isInSameClass(symbol.scope);
    }

    /* Protected symbols accessible within same class or derived classes */
    if (symbol.visibility === SymbolVisibility.PROTECTED) {
      return this.isInSameClass(symbol.scope) || this.isInDerivedClass(symbol.scope);
    }

    return true;
  }

  /**
   * Check if current scope is in same class as target scope
   */
  private isInSameClass(targetScope: Scope): boolean {
    let currentScope: Scope | undefined = this;
    let targetClassScope: Scope | undefined = targetScope;

    /* Find class scopes */
    while (currentScope && currentScope.type !== ScopeType.CLASS) {
      currentScope = currentScope.parent;
    }

    while (targetClassScope && targetClassScope.type !== ScopeType.CLASS) {
      targetClassScope = targetClassScope.parent;
    }

    return currentScope === targetClassScope;
  }

  /**
   * Check if current scope is in derived class of target scope
   */
  private isInDerivedClass(targetScope: Scope): boolean {
    /* Implementation would require inheritance hierarchy analysis */
    /* For now, return false - this would be implemented in semantic analyzer */
    return false;
  }
}

export class SymbolTable {
  private globalScope: Scope;
  private currentScope: Scope;
  private scopes = new Map<string, Scope>();

  constructor() {
    this.globalScope = new Scope(ScopeType.GLOBAL, 'global');
    this.currentScope = this.globalScope;
    this.scopes.set('global', this.globalScope);

    /* Add built-in types and functions */
    this.addBuiltinSymbols();
  }

  /**
   * Add built-in symbols (types, functions)
   */
  private addBuiltinSymbols(): void {
    /* Basic C types */
    const basicTypes = ['void', 'char', 'int', 'float', 'double', 'bool'];
    for (const typeName of basicTypes) {
      this.addType(typeName, {
        name: typeName,
        isPointer: false,
        isReference: false,
        isArray: false,
        isConst: false,
        isVolatile: false
      });
    }

    /* WORLDSRC vector types */
    const vectorTypes = ['vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'quat', 'mat3', 'mat4'];
    for (const vectorType of vectorTypes) {
      this.addType(vectorType, {
        name: vectorType,
        isPointer: false,
        isReference: false,
        isArray: false,
        isConst: false,
        isVolatile: false
      });
    }

    /* Standard library functions */
    this.addBuiltinFunction('printf', 'int', [
      { name: 'format', type: { name: 'char', isPointer: true, isReference: false, isArray: false, isConst: true, isVolatile: false } }
    ]);

    this.addBuiltinFunction('malloc', 'void', [
      { name: 'size', type: { name: 'size_t', isPointer: false, isReference: false, isArray: false, isConst: false, isVolatile: false } }
    ], true);

    this.addBuiltinFunction('free', 'void', [
      { name: 'ptr', type: { name: 'void', isPointer: true, isReference: false, isArray: false, isConst: false, isVolatile: false } }
    ]);
  }

  /**
   * Add built-in type
   */
  private addType(name: string, type: TypeInfo): void {
    const symbol: Symbol = {
      name,
      kind: SymbolKind.TYPEDEF,
      type,
      visibility: SymbolVisibility.PUBLIC,
      location: { line: 0, column: 0, file: '<builtin>' },
      scope: this.globalScope
    };

    this.globalScope.addSymbol(symbol);
  }

  /**
   * Add built-in function
   */
  private addBuiltinFunction(
    name: string,
    returnType: string,
    parameters: Array<{ name: string; type: TypeInfo }>,
    returnsPointer = false
  ): void {
    const signature: FunctionSignature = {
      returnType: {
        name: returnType,
        isPointer: returnsPointer,
        isReference: false,
        isArray: false,
        isConst: false,
        isVolatile: false
      },
      parameters,
      isVirtual: false,
      isOverride: false,
      isFinal: false,
      isAsync: false
    };

    const symbol: Symbol = {
      name,
      kind: SymbolKind.FUNCTION,
      type: signature.returnType,
      signature,
      visibility: SymbolVisibility.PUBLIC,
      location: { line: 0, column: 0, file: '<builtin>' },
      scope: this.globalScope
    };

    this.globalScope.addSymbol(symbol);
  }

  /**
   * Enter new scope
   */
  public enterScope(type: ScopeType, name: string, location?: SourceLocation): Scope {
    const newScope = this.currentScope.createChild(type, name, location);
    this.currentScope = newScope;

    const scopeKey = `${type}_${name}_${this.scopes.size}`;
    this.scopes.set(scopeKey, newScope);

    return newScope;
  }

  /**
   * Exit current scope
   */
  public exitScope(): Scope | undefined {
    const exitedScope = this.currentScope;
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
    return exitedScope;
  }

  /**
   * Get current scope
   */
  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  /**
   * Get global scope
   */
  public getGlobalScope(): Scope {
    return this.globalScope;
  }

  /**
   * Add symbol to current scope
   */
  public addSymbol(symbol: Symbol): boolean {
    return this.currentScope.addSymbol(symbol);
  }

  /**
   * Lookup symbol starting from current scope
   */
  public lookup(name: string): Symbol | undefined {
    return this.currentScope.lookup(name);
  }

  /**
   * Lookup symbol with qualified name
   */
  public lookupQualified(qualifiedName: string): Symbol | undefined {
    return this.currentScope.lookupQualified(qualifiedName);
  }

  /**
   * Create symbol from basic information
   */
  public createSymbol(
    name: string,
    kind: SymbolKind,
    type: TypeInfo,
    location: SourceLocation,
    visibility = SymbolVisibility.PUBLIC
  ): Symbol {
    return {
      name,
      kind,
      type,
      visibility,
      location,
      scope: this.currentScope
    };
  }

  /**
   * Create function symbol
   */
  public createFunctionSymbol(
    name: string,
    signature: FunctionSignature,
    location: SourceLocation,
    visibility = SymbolVisibility.PUBLIC,
    isForwardDeclaration = false
  ): Symbol {
    return {
      name,
      kind: SymbolKind.FUNCTION,
      type: signature.returnType,
      signature,
      visibility,
      location,
      scope: this.currentScope,
      isForwardDeclaration,
      isDefinition: !isForwardDeclaration
    };
  }

  /**
   * Create class symbol
   */
  public createClassSymbol(
    name: string,
    location: SourceLocation,
    baseClasses: string[] = [],
    interfaces: string[] = [],
    visibility = SymbolVisibility.PUBLIC
  ): Symbol {
    return {
      name,
      kind: SymbolKind.CLASS,
      type: {
        name,
        isPointer: false,
        isReference: false,
        isArray: false,
        isConst: false,
        isVolatile: false
      },
      visibility,
      location,
      scope: this.currentScope,
      baseClasses,
      interfaces,
      members: new Map()
    };
  }

  /**
   * Get all symbols matching pattern
   */
  public findSymbols(pattern: RegExp, kind?: SymbolKind): Symbol[] {
    const results: Symbol[] = [];

    const searchScope = (scope: Scope) => {
      for (const [name, symbol] of scope.symbols) {
        if (pattern.test(name) && (!kind || symbol.kind === kind)) {
          results.push(symbol);
        }
      }

      for (const child of scope.children) {
        searchScope(child);
      }
    };

    searchScope(this.globalScope);
    return results;
  }

  /**
   * Get symbol usage statistics
   */
  public getUsageStatistics(): Map<string, number> {
    const stats = new Map<string, number>();

    const collectStats = (scope: Scope) => {
      for (const [name, symbol] of scope.symbols) {
        stats.set(name, symbol.usageCount || 0);
      }

      for (const child of scope.children) {
        collectStats(child);
      }
    };

    collectStats(this.globalScope);
    return stats;
  }

  /**
   * Export symbol table for debugging/analysis
   */
  public exportTable(): any {
    const exportScope = (scope: Scope): any => {
      return {
        type: scope.type,
        name: scope.name,
        symbols: Array.from(scope.symbols.entries()).map(([name, symbol]) => ({
          name,
          kind: symbol.kind,
          type: symbol.type.name,
          visibility: symbol.visibility,
          location: symbol.location
        })),
        children: scope.children.map(child => exportScope(child))
      };
    };

    return exportScope(this.globalScope);
  }

  /**
   * Clear all symbols (reset to built-ins only)
   */
  public clear(): void {
    this.globalScope = new Scope(ScopeType.GLOBAL, 'global');
    this.currentScope = this.globalScope;
    this.scopes.clear();
    this.scopes.set('global', this.globalScope);
    this.addBuiltinSymbols();
  }
}

/**
 * Global symbol table instance
 */
export const globalSymbolTable = new SymbolTable();
