/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Type System
 *
 * Comprehensive type system implementation for semantic analysis
 * supporting C, C++, TypeScript hybrid language features including
 * type inference, compatibility checking, and template resolution.
 */

import { TypeInfo, TemplateParameter, Symbol, SymbolKind } from './symbol-table';
import { SourceLocation, globalErrorHandler } from '../error/error-handler';

export enum TypeKind {
  PRIMITIVE = 'PRIMITIVE',
  POINTER = 'POINTER',
  REFERENCE = 'REFERENCE',
  ARRAY = 'ARRAY',
  FUNCTION = 'FUNCTION',
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  STRUCT = 'STRUCT',
  ENUM = 'ENUM',
  TEMPLATE = 'TEMPLATE',
  UNION = 'UNION',
  VOID = 'VOID',
  AUTO = 'AUTO',
  UNKNOWN = 'UNKNOWN'
}

export enum PrimitiveType {
  VOID = 'void',
  BOOL = 'bool',
  CHAR = 'char',
  INT = 'int',
  FLOAT = 'float',
  DOUBLE = 'double',
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ANY = 'any',
  NEVER = 'never',
  UNDEFINED = 'undefined',
  NULL = 'null'
}

export enum VectorType {
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  IVEC2 = 'ivec2',
  IVEC3 = 'ivec3',
  IVEC4 = 'ivec4',
  QUAT = 'quat',
  MAT3 = 'mat3',
  MAT4 = 'mat4'
}

export interface TypeDescriptor {
  kind: TypeKind;
  name: string;
  size: number;
  alignment: number;
  isConst: boolean;
  isVolatile: boolean;
  isUnsigned: boolean;

  /* Pointer/Reference specific */
  pointeeType?: TypeDescriptor;
  referenceType?: TypeDescriptor;

  /* Array specific */
  elementType?: TypeDescriptor;
  arrayLength?: number;
  isDynamicArray?: boolean;

  /* Function specific */
  returnType?: TypeDescriptor;
  parameterTypes?: TypeDescriptor[];
  isVariadic?: boolean;

  /* Class/Struct specific */
  members?: Map<string, TypeDescriptor>;
  baseTypes?: TypeDescriptor[];

  /* Template specific */
  templateParameters?: TemplateParameter[];
  templateArguments?: TypeDescriptor[];

  /* Union types (TypeScript) */
  unionTypes?: TypeDescriptor[];

  /* Intersection types (TypeScript) */
  intersectionTypes?: TypeDescriptor[];

  /* Generic constraints */
  constraints?: TypeDescriptor[];

  /* Metadata */
  location?: SourceLocation;
  documentation?: string;
}

export class TypeRegistry {
  private types = new Map<string, TypeDescriptor>();
  private templateInstantiations = new Map<string, TypeDescriptor>();
  private typeAliases = new Map<string, TypeDescriptor>();

  constructor() {
    this.registerBuiltinTypes();
  }

  /**
   * Register built-in types
   */
  private registerBuiltinTypes(): void {
    /* C primitive types */
    this.registerType('void', {
      kind: TypeKind.VOID,
      name: 'void',
      size: 0,
      alignment: 1,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('bool', {
      kind: TypeKind.PRIMITIVE,
      name: 'bool',
      size: 1,
      alignment: 1,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('char', {
      kind: TypeKind.PRIMITIVE,
      name: 'char',
      size: 1,
      alignment: 1,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('int', {
      kind: TypeKind.PRIMITIVE,
      name: 'int',
      size: 4,
      alignment: 4,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('float', {
      kind: TypeKind.PRIMITIVE,
      name: 'float',
      size: 4,
      alignment: 4,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('double', {
      kind: TypeKind.PRIMITIVE,
      name: 'double',
      size: 8,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    /* TypeScript types */
    this.registerType('string', {
      kind: TypeKind.PRIMITIVE,
      name: 'string',
      size: 8,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('number', {
      kind: TypeKind.PRIMITIVE,
      name: 'number',
      size: 8,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('boolean', {
      kind: TypeKind.PRIMITIVE,
      name: 'boolean',
      size: 1,
      alignment: 1,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    this.registerType('any', {
      kind: TypeKind.PRIMITIVE,
      name: 'any',
      size: 8,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false
    });

    /* WORLDSRC vector types */
    this.registerVectorTypes();
  }

  /**
   * Register WORLDSRC vector types
   */
  private registerVectorTypes(): void {
    const vectorTypes = [
      { name: 'vec2', components: 2, componentType: 'float' },
      { name: 'vec3', components: 3, componentType: 'float' },
      { name: 'vec4', components: 4, componentType: 'float' },
      { name: 'ivec2', components: 2, componentType: 'int' },
      { name: 'ivec3', components: 3, componentType: 'int' },
      { name: 'ivec4', components: 4, componentType: 'int' },
      { name: 'quat', components: 4, componentType: 'float' },
      { name: 'mat3', components: 9, componentType: 'float' },
      { name: 'mat4', components: 16, componentType: 'float' }
    ];

    for (const vectorType of vectorTypes) {
      const componentSize = vectorType.componentType === 'float' ? 4 : 4;

      this.registerType(vectorType.name, {
        kind: TypeKind.STRUCT,
        name: vectorType.name,
        size: vectorType.components * componentSize,
        alignment: componentSize,
        isConst: false,
        isVolatile: false,
        isUnsigned: false,
        members: new Map<string, TypeDescriptor>([
          ['x', this.getType(vectorType.componentType)!],
          ['y', this.getType(vectorType.componentType)!],
          ...(vectorType.components > 2
            ? [['z', this.getType(vectorType.componentType)!] as [string, TypeDescriptor]]
            : []),
          ...(vectorType.components > 3
            ? [['w', this.getType(vectorType.componentType)!] as [string, TypeDescriptor]]
            : [])
        ])
      });
    }
  }

  /**
   * Register a type
   */
  public registerType(name: string, type: TypeDescriptor): void {
    this.types.set(name, type);
  }

  /**
   * Get type by name
   */
  public getType(name: string): TypeDescriptor | undefined {
    /* Check aliases first */
    const alias = this.typeAliases.get(name);
    if (alias) {
      return alias;
    }

    return this.types.get(name);
  }

  /**
   * Create pointer type
   */
  public createPointerType(pointeeType: TypeDescriptor): TypeDescriptor {
    const typeName = `${pointeeType.name}*`;

    const existing = this.types.get(typeName);
    if (existing) {
      return existing;
    }

    const pointerType: TypeDescriptor = {
      kind: TypeKind.POINTER,
      name: typeName,
      size: 8 /* 64-bit pointer */,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false,
      pointeeType
    };

    this.types.set(typeName, pointerType);
    return pointerType;
  }

  /**
   * Create reference type
   */
  public createReferenceType(referenceType: TypeDescriptor): TypeDescriptor {
    const typeName = `${referenceType.name}&`;

    const existing = this.types.get(typeName);
    if (existing) {
      return existing;
    }

    const refType: TypeDescriptor = {
      kind: TypeKind.REFERENCE,
      name: typeName,
      size: 8 /* Reference is essentially a pointer */,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false,
      referenceType
    };

    this.types.set(typeName, refType);
    return refType;
  }

  /**
   * Create array type
   */
  public createArrayType(elementType: TypeDescriptor, length?: number): TypeDescriptor {
    const typeName = length ? `${elementType.name}[${length}]` : `${elementType.name}[]`;

    const existing = this.types.get(typeName);
    if (existing) {
      return existing;
    }

    const arrayType: TypeDescriptor = {
      kind: TypeKind.ARRAY,
      name: typeName,
      size: length ? elementType.size * length : 8 /* Dynamic array size */,
      alignment: elementType.alignment,
      isConst: false,
      isVolatile: false,
      isUnsigned: false,
      elementType,
      arrayLength: length,
      isDynamicArray: !length
    };

    this.types.set(typeName, arrayType);
    return arrayType;
  }

  /**
   * Create function type
   */
  public createFunctionType(
    returnType: TypeDescriptor,
    parameterTypes: TypeDescriptor[],
    isVariadic = false
  ): TypeDescriptor {
    const paramStr = parameterTypes.map((p) => p.name).join(', ');
    const typeName = `${returnType.name}(${paramStr}${isVariadic ? ', ...' : ''})`;

    const existing = this.types.get(typeName);
    if (existing) {
      return existing;
    }

    const functionType: TypeDescriptor = {
      kind: TypeKind.FUNCTION,
      name: typeName,
      size: 8 /* Function pointer size */,
      alignment: 8,
      isConst: false,
      isVolatile: false,
      isUnsigned: false,
      returnType,
      parameterTypes,
      isVariadic
    };

    this.types.set(typeName, functionType);
    return functionType;
  }

  /**
   * Create union type (TypeScript)
   */
  public createUnionType(types: TypeDescriptor[]): TypeDescriptor {
    const typeName = types.map((t) => t.name).join(' | ');

    const existing = this.types.get(typeName);
    if (existing) {
      return existing;
    }

    /* Union size is the maximum of all member types */
    const maxSize = Math.max(...types.map((t) => t.size));
    const maxAlignment = Math.max(...types.map((t) => t.alignment));

    const unionType: TypeDescriptor = {
      kind: TypeKind.UNION,
      name: typeName,
      size: maxSize,
      alignment: maxAlignment,
      isConst: false,
      isVolatile: false,
      isUnsigned: false,
      unionTypes: types
    };

    this.types.set(typeName, unionType);
    return unionType;
  }

  /**
   * Create template instantiation
   */
  public createTemplateInstantiation(
    templateType: TypeDescriptor,
    templateArguments: TypeDescriptor[]
  ): TypeDescriptor {
    const argStr = templateArguments.map((t) => t.name).join(', ');
    const typeName = `${templateType.name}<${argStr}>`;

    const existing = this.templateInstantiations.get(typeName);
    if (existing) {
      return existing;
    }

    const instantiation: TypeDescriptor = {
      ...templateType,
      name: typeName,
      templateArguments
    };

    this.templateInstantiations.set(typeName, instantiation);
    return instantiation;
  }

  /**
   * Register type alias
   */
  public registerAlias(alias: string, targetType: TypeDescriptor): void {
    this.typeAliases.set(alias, targetType);
  }

  /**
   * Get all registered types
   */
  public getAllTypes(): Map<string, TypeDescriptor> {
    return new Map(this.types);
  }

  /**
   * Clear all types (reset to built-ins)
   */
  public clear(): void {
    this.types.clear();
    this.templateInstantiations.clear();
    this.typeAliases.clear();
    this.registerBuiltinTypes();
  }
}

export class TypeChecker {
  private typeRegistry: TypeRegistry;
  private conversionRules = new Map<string, Map<string, number>>();

  constructor(typeRegistry: TypeRegistry) {
    this.typeRegistry = typeRegistry;
    this.initializeConversionRules();
  }

  /**
   * Initialize type conversion rules
   */
  private initializeConversionRules(): void {
    /* Implicit conversion costs (0 = no conversion, higher = more expensive) */
    const rules = [
      /* C numeric conversions */
      { from: 'char', to: 'int', cost: 1 },
      { from: 'int', to: 'float', cost: 2 },
      { from: 'float', to: 'double', cost: 1 },
      { from: 'int', to: 'double', cost: 3 },

      /* TypeScript conversions */
      { from: 'number', to: 'int', cost: 2 },
      { from: 'number', to: 'float', cost: 1 },
      { from: 'boolean', to: 'int', cost: 3 },
      { from: 'string', to: 'char*', cost: 1 },

      /* Any type conversions */
      { from: 'any', to: 'int', cost: 4 },
      { from: 'any', to: 'string', cost: 4 },
      { from: 'int', to: 'any', cost: 2 },
      { from: 'string', to: 'any', cost: 2 }
    ];

    for (const rule of rules) {
      if (!this.conversionRules.has(rule.from)) {
        this.conversionRules.set(rule.from, new Map());
      }
      this.conversionRules.get(rule.from)!.set(rule.to, rule.cost);
    }
  }

  /**
   * Check if two types are exactly equal
   */
  public areTypesEqual(type1: TypeDescriptor, type2: TypeDescriptor): boolean {
    if (type1.name === type2.name) {
      return true;
    }

    /* Check structural equality for complex types */
    if (type1.kind !== type2.kind) {
      return false;
    }

    switch (type1.kind) {
      case TypeKind.POINTER:
        return !!(
          type1.pointeeType &&
          type2.pointeeType &&
          this.areTypesEqual(type1.pointeeType, type2.pointeeType)
        );

      case TypeKind.REFERENCE:
        return !!(
          type1.referenceType &&
          type2.referenceType &&
          this.areTypesEqual(type1.referenceType, type2.referenceType)
        );

      case TypeKind.ARRAY:
        return !!(
          type1.elementType &&
          type2.elementType &&
          type1.arrayLength === type2.arrayLength &&
          this.areTypesEqual(type1.elementType, type2.elementType)
        );

      case TypeKind.FUNCTION:
        return this.areFunctionTypesEqual(type1, type2);

      default:
        return false;
    }
  }

  /**
   * Check if function types are equal
   */
  private areFunctionTypesEqual(func1: TypeDescriptor, func2: TypeDescriptor): boolean {
    if (!func1.returnType || !func2.returnType) {
      return false;
    }

    if (!this.areTypesEqual(func1.returnType, func2.returnType)) {
      return false;
    }

    if (!func1.parameterTypes || !func2.parameterTypes) {
      return func1.parameterTypes === func2.parameterTypes;
    }

    if (func1.parameterTypes.length !== func2.parameterTypes.length) {
      return false;
    }

    for (let i = 0; i < func1.parameterTypes.length; i++) {
      if (!this.areTypesEqual(func1.parameterTypes[i], func2.parameterTypes[i])) {
        return false;
      }
    }

    return (func1.isVariadic || false) === (func2.isVariadic || false);
  }

  /**
   * Check if type1 is assignable to type2
   */
  public isAssignable(fromType: TypeDescriptor, toType: TypeDescriptor): boolean {
    /* Exact match */
    if (this.areTypesEqual(fromType, toType)) {
      return true;
    }

    /* Check implicit conversions */
    const cost = this.getConversionCost(fromType, toType);
    return cost !== undefined && cost < 10; /* Arbitrary threshold */
  }

  /**
   * Get conversion cost between types
   */
  public getConversionCost(fromType: TypeDescriptor, toType: TypeDescriptor): number | undefined {
    /* Direct conversion rule */
    const fromRules = this.conversionRules.get(fromType.name);
    if (fromRules) {
      const cost = fromRules.get(toType.name);
      if (cost !== undefined) {
        return cost;
      }
    }

    /* Pointer compatibility */
    if (fromType.kind === TypeKind.POINTER && toType.kind === TypeKind.POINTER) {
      if (fromType.pointeeType && toType.pointeeType) {
        if (toType.pointeeType.name === 'void') {
          return 1; /* void* conversion */
        }
        return this.getConversionCost(fromType.pointeeType, toType.pointeeType);
      }
    }

    /* Array to pointer decay */
    if (fromType.kind === TypeKind.ARRAY && toType.kind === TypeKind.POINTER) {
      if (fromType.elementType && toType.pointeeType) {
        return this.areTypesEqual(fromType.elementType, toType.pointeeType) ? 1 : undefined;
      }
    }

    /* Inheritance (would need class hierarchy analysis) */
    if (fromType.kind === TypeKind.CLASS && toType.kind === TypeKind.CLASS) {
      return this.checkInheritanceConversion(fromType, toType);
    }

    return undefined;
  }

  /**
   * Check inheritance-based conversion
   */
  private checkInheritanceConversion(
    derived: TypeDescriptor,
    base: TypeDescriptor
  ): number | undefined {
    if (!derived.baseTypes) {
      return undefined;
    }

    /* Direct base class */
    for (const baseType of derived.baseTypes) {
      if (this.areTypesEqual(baseType, base)) {
        return 1;
      }
    }

    /* Indirect inheritance (recursive check) */
    for (const baseType of derived.baseTypes) {
      const cost = this.checkInheritanceConversion(baseType, base);
      if (cost !== undefined) {
        return cost + 1;
      }
    }

    return undefined;
  }

  /**
   * Infer type from expression context
   */
  public inferType(
    expressionType: string,
    context: 'assignment' | 'parameter' | 'return' | 'initialization',
    expectedType?: TypeDescriptor
  ): TypeDescriptor | undefined {
    /* Auto type inference */
    if (expressionType === 'auto') {
      if (expectedType && context === 'initialization') {
        return expectedType;
      }
      return this.typeRegistry.getType('int'); /* Default to int */
    }

    /* Var type inference (TypeScript) */
    if (expressionType === 'var') {
      return expectedType || this.typeRegistry.getType('any');
    }

    return this.typeRegistry.getType(expressionType);
  }

  /**
   * Check template constraint satisfaction
   */
  public checkTemplateConstraints(
    templateParameter: TemplateParameter,
    argument: TypeDescriptor
  ): boolean {
    if (!templateParameter.constraint) {
      return true; /* No constraint */
    }

    const constraintType = this.typeRegistry.getType(templateParameter.constraint);
    if (!constraintType) {
      return false; /* Unknown constraint */
    }

    /* Check if argument satisfies constraint */
    return this.isAssignable(argument, constraintType);
  }

  /**
   * Resolve function overload
   */
  public resolveOverload(
    candidates: Symbol[],
    argumentTypes: TypeDescriptor[]
  ): Symbol | undefined {
    let bestMatch: Symbol | undefined;
    let bestCost = Infinity;

    for (const candidate of candidates) {
      if (!candidate.signature || candidate.signature.parameters.length !== argumentTypes.length) {
        continue;
      }

      let totalCost = 0;
      let validMatch = true;

      for (let i = 0; i < argumentTypes.length; i++) {
        const paramType = this.typeRegistry.getType(candidate.signature.parameters[i].type.name);
        if (!paramType) {
          validMatch = false;
          break;
        }

        const cost = this.getConversionCost(argumentTypes[i], paramType);
        if (cost === undefined) {
          validMatch = false;
          break;
        }

        totalCost += cost;
      }

      if (validMatch && totalCost < bestCost) {
        bestMatch = candidate;
        bestCost = totalCost;
      }
    }

    return bestMatch;
  }

  /**
   * Validate operator overload
   */
  public validateOperatorOverload(operatorSymbol: string, operandTypes: TypeDescriptor[]): boolean {
    /* Basic validation rules for operators */
    const binaryOperators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>='];
    const unaryOperators = ['++', '--', '-', '+', '!', '~'];

    if (binaryOperators.includes(operatorSymbol) && operandTypes.length !== 2) {
      return false;
    }

    if (unaryOperators.includes(operatorSymbol) && operandTypes.length !== 1) {
      return false;
    }

    /* Type-specific validation */
    for (const operandType of operandTypes) {
      if (operandType.kind === TypeKind.VOID) {
        return false; /* Cannot perform operations on void */
      }
    }

    return true;
  }

  /**
   * Convert TypeInfo to TypeDescriptor
   */
  public convertTypeInfo(typeInfo: TypeInfo): TypeDescriptor {
    let baseType = this.typeRegistry.getType(typeInfo.name);

    if (!baseType) {
      /* Create unknown type */
      baseType = {
        kind: TypeKind.UNKNOWN,
        name: typeInfo.name,
        size: 8,
        alignment: 8,
        isConst: typeInfo.isConst,
        isVolatile: typeInfo.isVolatile,
        isUnsigned: false
      };
    }

    if (typeInfo.isPointer) {
      return this.typeRegistry.createPointerType(baseType);
    }

    if (typeInfo.isReference) {
      return this.typeRegistry.createReferenceType(baseType);
    }

    if (typeInfo.isArray) {
      return this.typeRegistry.createArrayType(baseType, typeInfo.arraySize);
    }

    return {
      ...baseType,
      isConst: typeInfo.isConst,
      isVolatile: typeInfo.isVolatile
    };
  }
}

/**
 * Global type registry and checker instances
 */
export const globalTypeRegistry = new TypeRegistry();
export const globalTypeChecker = new TypeChecker(globalTypeRegistry);
