/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Abstract Syntax Tree Definitions
 *
 * AST node definitions supporting C, C++, and TypeScript syntax
 * in a unified language for game development
 */

import { Token, SourcePosition } from '../lexer/tokens';

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

export abstract class ASTNode {
  constructor(public location: SourceLocation) {}
  abstract accept<T>(visitor: ASTVisitor<T>): T;
}

/**
 * Visitor pattern for AST traversal
 */
export interface ASTVisitor<T> {
  visitProgram(node: Program): T;
  visitDeclaration(node: Declaration): T;
  visitStatement(node: Statement): T;
  visitExpression(node: Expression): T;
  visitType(node: TypeNode): T;
}

/**
 * Root program node
 */
export class Program extends ASTNode {
  constructor(
    public declarations: Declaration[],
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitProgram(this);
  }
}

/**
 * Base declaration node
 */
export abstract class Declaration extends ASTNode {
  constructor(location: SourceLocation) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this);
  }
}

/**
 * Variable declaration
 */
export class VariableDeclaration extends Declaration {
  constructor(
    public name: string,
    public type: TypeNode | null,
    public initializer: Expression | null,
    public isConst: boolean = false,
    public isStatic: boolean = false,
    public isExtern: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Function declaration
 */
export class FunctionDeclaration extends Declaration {
  constructor(
    public name: string,
    public parameters: Parameter[],
    public returnType: TypeNode | null,
    public body: BlockStatement | null,
    public isInline: boolean = false,
    public isVirtual: boolean = false,
    public isStatic: boolean = false,
    public isAsync: boolean = false,
    public templateParameters: TypeParameter[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Function parameter
 */
export class Parameter extends ASTNode {
  constructor(
    public name: string,
    public type: TypeNode,
    public defaultValue: Expression | null = null,
    public isOptional: boolean = false,
    public isRest: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitExpression(this as any);
  }
}

/**
 * Class declaration
 */
export class ClassDeclaration extends Declaration {
  constructor(
    public name: string,
    public superClass: TypeNode | null,
    public interfaces: TypeNode[],
    public members: ClassMember[],
    public isAbstract: boolean = false,
    public templateParameters: TypeParameter[] = [],
    public accessModifier: AccessModifier = AccessModifier.Public,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Interface declaration (TypeScript)
 */
export class InterfaceDeclaration extends Declaration {
  constructor(
    public name: string,
    public extends_: TypeNode[],
    public members: InterfaceMember[],
    public templateParameters: TypeParameter[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Struct declaration (C/C++)
 */
export class StructDeclaration extends Declaration {
  constructor(
    public name: string,
    public members: StructMember[],
    public templateParameters: TypeParameter[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Enum declaration
 */
export class EnumDeclaration extends Declaration {
  constructor(
    public name: string,
    public members: EnumMember[],
    public underlyingType: TypeNode | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Namespace declaration
 */
export class NamespaceDeclaration extends Declaration {
  constructor(
    public name: string,
    public declarations: Declaration[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Type alias declaration
 */
export class TypeAliasDeclaration extends Declaration {
  constructor(
    public name: string,
    public type: TypeNode,
    public templateParameters: TypeParameter[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Import declaration (TypeScript)
 */
export class ImportDeclaration extends Declaration {
  constructor(
    public specifiers: ImportSpecifier[],
    public source: string,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Export declaration (TypeScript)
 */
export class ExportDeclaration extends Declaration {
  constructor(
    public declaration: Declaration | null,
    public specifiers: ExportSpecifier[],
    public source: string | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Base statement node
 */
export abstract class Statement extends ASTNode {
  constructor(location: SourceLocation) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitStatement(this);
  }
}

/**
 * Block statement
 */
export class BlockStatement extends Statement {
  constructor(
    public statements: Statement[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Expression statement
 */
export class ExpressionStatement extends Statement {
  constructor(
    public expression: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * If statement
 */
export class IfStatement extends Statement {
  constructor(
    public condition: Expression,
    public thenStatement: Statement,
    public elseStatement: Statement | null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * While statement
 */
export class WhileStatement extends Statement {
  constructor(
    public condition: Expression,
    public body: Statement,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * For statement
 */
export class ForStatement extends Statement {
  constructor(
    public init: Statement | Expression | null,
    public condition: Expression | null,
    public update: Expression | null,
    public body: Statement,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * For-in statement (TypeScript)
 */
export class ForInStatement extends Statement {
  constructor(
    public variable: string,
    public iterable: Expression,
    public body: Statement,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * For-of statement (TypeScript)
 */
export class ForOfStatement extends Statement {
  constructor(
    public variable: string,
    public iterable: Expression,
    public body: Statement,
    public isAsync: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Switch statement
 */
export class SwitchStatement extends Statement {
  constructor(
    public discriminant: Expression,
    public cases: SwitchCase[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Switch case
 */
export class SwitchCase extends Statement {
  constructor(
    public test: Expression | null, // null for default case
    public statements: Statement[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Try statement
 */
export class TryStatement extends Statement {
  constructor(
    public body: BlockStatement,
    public handler: CatchClause | null,
    public finalizer: BlockStatement | null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Catch clause
 */
export class CatchClause extends Statement {
  constructor(
    public param: string | null,
    public body: BlockStatement,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Return statement
 */
export class ReturnStatement extends Statement {
  constructor(
    public argument: Expression | null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Break statement
 */
export class BreakStatement extends Statement {
  constructor(
    public label: string | null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Continue statement
 */
export class ContinueStatement extends Statement {
  constructor(
    public label: string | null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Throw statement
 */
export class ThrowStatement extends Statement {
  constructor(
    public argument: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Base expression node
 */
export abstract class Expression extends ASTNode {
  constructor(location: SourceLocation) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitExpression(this);
  }
}

/**
 * Binary expression
 */
export class BinaryExpression extends Expression {
  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Unary expression
 */
export class UnaryExpression extends Expression {
  constructor(
    public operator: string,
    public argument: Expression,
    public prefix: boolean = true,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Assignment expression
 */
export class AssignmentExpression extends Expression {
  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Update expression (++ and --)
 */
export class UpdateExpression extends Expression {
  constructor(
    public operator: string,
    public argument: Expression,
    public prefix: boolean,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Logical expression
 */
export class LogicalExpression extends Expression {
  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Conditional expression (ternary)
 */
export class ConditionalExpression extends Expression {
  constructor(
    public test: Expression,
    public consequent: Expression,
    public alternate: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Call expression
 */
export class CallExpression extends Expression {
  constructor(
    public callee: Expression,
    public args: Expression[],
    public templateArguments: TypeNode[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Member expression
 */
export class MemberExpression extends Expression {
  constructor(
    public object: Expression,
    public property: Expression,
    public computed: boolean = false, // true for a[b], false for a.b
    public optional: boolean = false, // true for a?.b
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Array expression
 */
export class ArrayExpression extends Expression {
  constructor(
    public elements: (Expression | null)[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Object expression
 */
export class ObjectExpression extends Expression {
  constructor(
    public properties: ObjectProperty[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Arrow function expression (TypeScript)
 */
export class ArrowFunctionExpression extends Expression {
  constructor(
    public parameters: Parameter[],
    public body: Expression | BlockStatement,
    public isAsync: boolean = false,
    public returnType: TypeNode | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Function expression
 */
export class FunctionExpression extends Expression {
  constructor(
    public name: string | null,
    public parameters: Parameter[],
    public body: BlockStatement,
    public isAsync: boolean = false,
    public returnType: TypeNode | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Lambda expression (C++)
 */
export class LambdaExpression extends Expression {
  constructor(
    public captures: LambdaCapture[],
    public parameters: Parameter[],
    public body: Expression | BlockStatement,
    public returnType: TypeNode | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * New expression
 */
export class NewExpression extends Expression {
  constructor(
    public callee: Expression,
    public args: Expression[],
    public templateArguments: TypeNode[] = [],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * This expression
 */
export class ThisExpression extends Expression {
  constructor(location: SourceLocation) {
    super(location);
  }
}

/**
 * Super expression
 */
export class SuperExpression extends Expression {
  constructor(location: SourceLocation) {
    super(location);
  }
}

/**
 * Identifier
 */
export class Identifier extends Expression {
  constructor(
    public name: string,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Literal expressions
 */
export class Literal extends Expression {
  constructor(
    public value: any,
    public raw: string,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Template literal (TypeScript)
 */
export class TemplateLiteral extends Expression {
  constructor(
    public quasis: TemplateElement[],
    public expressions: Expression[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Template element
 */
export class TemplateElement extends ASTNode {
  constructor(
    public value: { raw: string; cooked: string },
    public tail: boolean,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitExpression(this as any);
  }
}

/**
 * Await expression
 */
export class AwaitExpression extends Expression {
  constructor(
    public argument: Expression,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Yield expression
 */
export class YieldExpression extends Expression {
  constructor(
    public argument: Expression | null,
    public delegate: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Type nodes
 */
export abstract class TypeNode extends ASTNode {
  constructor(location: SourceLocation) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitType(this);
  }
}

/**
 * Primitive type
 */
export class PrimitiveType extends TypeNode {
  constructor(
    public name: string,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Array type
 */
export class ArrayType extends TypeNode {
  constructor(
    public elementType: TypeNode,
    public size: Expression | null = null,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Pointer type
 */
export class PointerType extends TypeNode {
  constructor(
    public pointeeType: TypeNode,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Reference type
 */
export class ReferenceType extends TypeNode {
  constructor(
    public referencedType: TypeNode,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Function type
 */
export class FunctionType extends TypeNode {
  constructor(
    public parameters: TypeNode[],
    public returnType: TypeNode,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Generic type
 */
export class GenericType extends TypeNode {
  constructor(
    public name: string,
    public typeArguments: TypeNode[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Union type (TypeScript)
 */
export class UnionType extends TypeNode {
  constructor(
    public types: TypeNode[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Intersection type (TypeScript)
 */
export class IntersectionType extends TypeNode {
  constructor(
    public types: TypeNode[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Tuple type (TypeScript)
 */
export class TupleType extends TypeNode {
  constructor(
    public elementTypes: TypeNode[],
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Optional type (TypeScript)
 */
export class OptionalType extends TypeNode {
  constructor(
    public type: TypeNode,
    location: SourceLocation
  ) {
    super(location);
  }
}

/**
 * Supporting classes
 */

export enum AccessModifier {
  Public = 'public',
  Private = 'private',
  Protected = 'protected'
}

export class ClassMember extends ASTNode {
  constructor(
    public accessModifier: AccessModifier,
    public isStatic: boolean,
    public isAbstract: boolean,
    public member: FunctionDeclaration | VariableDeclaration,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}

export class InterfaceMember extends ASTNode {
  constructor(
    public member: FunctionDeclaration | VariableDeclaration,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}

export class StructMember extends ASTNode {
  constructor(
    public name: string,
    public type: TypeNode,
    public accessModifier: AccessModifier = AccessModifier.Public,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}

export class EnumMember extends ASTNode {
  constructor(
    public name: string,
    public value: Expression | null,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}

export class TypeParameter extends ASTNode {
  constructor(
    public name: string,
    public constraint: TypeNode | null = null,
    public defaultType: TypeNode | null = null,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitType(this as any);
  }
}

export class ObjectProperty extends ASTNode {
  constructor(
    public key: Expression | string,
    public value: Expression,
    public computed: boolean = false,
    public shorthand: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitExpression(this as any);
  }
}

export class LambdaCapture extends ASTNode {
  constructor(
    public name: string,
    public byReference: boolean = false,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitExpression(this as any);
  }
}

export class ImportSpecifier extends ASTNode {
  constructor(
    public imported: string,
    public local: string,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}

export class ExportSpecifier extends ASTNode {
  constructor(
    public local: string,
    public exported: string,
    location: SourceLocation
  ) {
    super(location);
  }

  accept<T>(visitor: ASTVisitor<T>): T {
    return visitor.visitDeclaration(this as any);
  }
}
