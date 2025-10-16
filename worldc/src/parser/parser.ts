/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDC Parser
 *
 * Recursive descent parser supporting C, C++, and TypeScript syntax
 * in a unified language for game development with simplified verbiage
 */

import { TokenType, Token, SourcePosition } from '../lexer/tokens';
import { Lexer } from '../lexer/lexer';
import {
  ASTNode,
  Program,
  Declaration,
  Statement,
  Expression,
  TypeNode,
  VariableDeclaration,
  FunctionDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  StructDeclaration,
  EnumDeclaration,
  NamespaceDeclaration,
  TypeAliasDeclaration,
  ImportDeclaration,
  ExportDeclaration,
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  ForInStatement,
  ForOfStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  CatchClause,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  BinaryExpression,
  UnaryExpression,
  AssignmentExpression,
  UpdateExpression,
  LogicalExpression,
  ConditionalExpression,
  CallExpression,
  MemberExpression,
  ArrayExpression,
  ObjectExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  LambdaExpression,
  NewExpression,
  ThisExpression,
  SuperExpression,
  Identifier,
  Literal,
  TemplateLiteral,
  TemplateElement,
  AwaitExpression,
  YieldExpression,
  PrimitiveType,
  ArrayType,
  PointerType,
  ReferenceType,
  FunctionType,
  GenericType,
  UnionType,
  IntersectionType,
  TupleType,
  OptionalType,
  Parameter,
  ClassMember,
  InterfaceMember,
  StructMember,
  EnumMember,
  TypeParameter,
  ObjectProperty,
  LambdaCapture,
  ImportSpecifier,
  ExportSpecifier,
  AccessModifier,
  SourceLocation,
} from './ast';

export interface ParserOptions {
  allowTSFeatures?: boolean;
  allowCPPFeatures?: boolean;
  strict?: boolean;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public token: Token,
    public source?: string
  ) {
    super(
      `Parse error at line ${token.start.line}, column ${token.start.column}: ${message}`
    );
    this.name = 'ParseError';
  }
}

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private options: Required<ParserOptions>;

  constructor(tokens: Token[], options: ParserOptions = {}) {
    this.tokens = tokens;
    this.options = {
      allowTSFeatures: options.allowTSFeatures ?? true,
      allowCPPFeatures: options.allowCPPFeatures ?? true,
      strict: options.strict ?? false,
    };
  }

  /**
   * Parse tokens into AST
   */
  public parse(): Program {
    const declarations: Declaration[] = [];

    while (!this.isAtEnd()) {
      const decl = this.parseDeclaration();
      if (decl) {
        declarations.push(decl);
      }
    }

    return new Program(
      declarations,
      this.createLocation(
        this.tokens[0]?.start || { line: 1, column: 1, offset: 0 },
        this.peek().end
      )
    );
  }

  /**
   * Parse declaration
   */
  private parseDeclaration(): Declaration | null {
    try {
      // TypeScript imports/exports
      if (this.options.allowTSFeatures) {
        if (this.match(TokenType.IMPORT)) return this.parseImportDeclaration();
        if (this.match(TokenType.EXPORT)) return this.parseExportDeclaration();
        if (this.match(TokenType.INTERFACE))
          return this.parseInterfaceDeclaration();
        if (this.match(TokenType.TYPE)) return this.parseTypeAliasDeclaration();
      }

      // C++ namespace
      if (this.options.allowCPPFeatures && this.match(TokenType.NAMESPACE)) {
        return this.parseNamespaceDeclaration();
      }

      // Class declarations
      if (this.match(TokenType.CLASS)) return this.parseClassDeclaration();
      if (this.match(TokenType.STRUCT)) return this.parseStructDeclaration();
      if (this.match(TokenType.ENUM)) return this.parseEnumDeclaration();

      // Function declarations
      if (this.options.allowTSFeatures && this.match(TokenType.FUNCTION)) {
        return this.parseFunctionDeclaration();
      }

      // Check for function declaration (C/C++ style)
      if (this.isFunctionDeclaration()) {
        return this.parseFunctionDeclaration();
      }

      // Variable declarations
      if (this.isVariableDeclaration()) {
        return this.parseVariableDeclaration();
      }

      // Preprocessor directives
      if (
        this.match(
          TokenType.INCLUDE,
          TokenType.DEFINE,
          TokenType.IFDEF,
          TokenType.IFNDEF,
          TokenType.ENDIF,
          TokenType.PRAGMA
        )
      ) {
        this.advance(); // Skip preprocessor for now
        return null;
      }

      throw new ParseError(
        `Unexpected token: ${this.peek().value}`,
        this.peek()
      );
    } catch (error) {
      this.synchronize();
      throw error;
    }
  }

  /**
   * Parse variable declaration
   */
  private parseVariableDeclaration(): VariableDeclaration {
    const start = this.peek().start;
    let isConst = false;
    let isStatic = false;
    let isExtern = false;

    // Parse modifiers
    while (
      this.match(
        TokenType.CONST,
        TokenType.EDICT,
        TokenType.STATIC,
        TokenType.EXTERN
      )
    ) {
      const modifier = this.previous();
      switch (modifier.type) {
        case TokenType.CONST:
        case TokenType.EDICT:
          isConst = true;
          break;
        case TokenType.STATIC:
          isStatic = true;
          break;
        case TokenType.EXTERN:
          isExtern = true;
          break;
      }
    }

    // TypeScript let/var
    const isLet = this.match(TokenType.LET);
    const isVar = this.match(TokenType.VAR);

    // Parse type
    let type: TypeNode | null = null;
    if (!isLet && !isVar) {
      type = this.parseType();
    }

    // Parse identifier
    this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    const name = this.previous().value;

    // TypeScript type annotation
    if (this.match(TokenType.COLON)) {
      type = this.parseType();
    }

    // Initializer
    let initializer: Expression | null = null;
    if (this.match(TokenType.ASSIGN)) {
      initializer = this.parseExpression();
    }

    this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after variable declaration"
    );

    return new VariableDeclaration(
      name,
      type,
      initializer,
      isConst,
      isStatic,
      isExtern,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse function declaration
   */
  private parseFunctionDeclaration(): FunctionDeclaration {
    const start = this.peek().start;
    let isInline = false;
    let isVirtual = false;
    let isStatic = false;
    let isAsync = false;

    // Parse modifiers
    while (
      this.match(
        TokenType.INLINE,
        TokenType.VIRTUAL,
        TokenType.STATIC,
        TokenType.ASYNC
      )
    ) {
      const modifier = this.previous();
      switch (modifier.type) {
        case TokenType.INLINE:
          isInline = true;
          break;
        case TokenType.VIRTUAL:
          isVirtual = true;
          break;
        case TokenType.STATIC:
          isStatic = true;
          break;
        case TokenType.ASYNC:
          isAsync = true;
          break;
      }
    }

    // Template parameters
    const templateParameters: TypeParameter[] = [];
    if (this.match(TokenType.TEMPLATE)) {
      this.consume(TokenType.LESS_THAN, "Expected '<' after template");
      // Parse template parameters
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          templateParameters.push(this.parseTypeParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.GREATER_THAN,
        "Expected '>' after template parameters"
      );
    }

    // Return type (C/C++ style) or function keyword (TS style)
    let returnType: TypeNode | null = null;
    if (!this.check(TokenType.FUNCTION)) {
      returnType = this.parseType();
    } else {
      this.advance(); // consume 'function'
    }

    // Function name
    this.consume(TokenType.IDENTIFIER, 'Expected function name');
    const name = this.previous().value;

    // Parameters
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
    const parameters: Parameter[] = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        parameters.push(this.parseParameter());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");

    // TypeScript return type annotation
    if (this.match(TokenType.COLON)) {
      returnType = this.parseType();
    }

    // Function body or semicolon for declaration
    let body: BlockStatement | null = null;
    if (this.match(TokenType.LEFT_BRACE)) {
      body = this.parseBlockStatement();
    } else {
      this.consume(
        TokenType.SEMICOLON,
        "Expected ';' after function declaration"
      );
    }

    return new FunctionDeclaration(
      name,
      parameters,
      returnType,
      body,
      isInline,
      isVirtual,
      isStatic,
      isAsync,
      templateParameters,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse class declaration
   */
  private parseClassDeclaration(): ClassDeclaration {
    const start = this.previous().start;
    let isAbstract = false;

    if (this.previous().type === TokenType.ABSTRACT) {
      isAbstract = true;
      this.consume(TokenType.CLASS, "Expected 'class' after 'abstract'");
    }

    // Template parameters
    const templateParameters: TypeParameter[] = [];
    if (this.match(TokenType.TEMPLATE)) {
      this.consume(TokenType.LESS_THAN, "Expected '<' after template");
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          templateParameters.push(this.parseTypeParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.GREATER_THAN,
        "Expected '>' after template parameters"
      );
    }

    // Class name
    this.consume(TokenType.IDENTIFIER, 'Expected class name');
    const name = this.previous().value;

    // Inheritance
    let superClass: TypeNode | null = null;
    if (this.match(TokenType.EXTENDS)) {
      superClass = this.parseType();
    }

    // Interfaces (TypeScript)
    const interfaces: TypeNode[] = [];
    if (this.options.allowTSFeatures && this.match(TokenType.IMPLEMENTS)) {
      do {
        interfaces.push(this.parseType());
      } while (this.match(TokenType.COMMA));
    }

    // Class body
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before class body");
    const members: ClassMember[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      members.push(this.parseClassMember());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after class body");

    return new ClassDeclaration(
      name,
      superClass,
      interfaces,
      members,
      isAbstract,
      templateParameters,
      AccessModifier.Public,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse class member
   */
  private parseClassMember(): ClassMember {
    const start = this.peek().start;
    let accessModifier = AccessModifier.Public;
    let isStatic = false;
    let isAbstract = false;

    // Parse access modifiers
    if (this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.PROTECTED)) {
      accessModifier = this.previous().value as AccessModifier;
      this.consume(TokenType.COLON, "Expected ':' after access modifier");
    }

    // Parse other modifiers
    while (this.match(TokenType.STATIC, TokenType.ABSTRACT)) {
      const modifier = this.previous();
      switch (modifier.type) {
        case TokenType.STATIC:
          isStatic = true;
          break;
        case TokenType.ABSTRACT:
          isAbstract = true;
          break;
      }
    }

    // Parse member (function or variable)
    let member: FunctionDeclaration | VariableDeclaration;
    if (this.isFunctionDeclaration()) {
      member = this.parseFunctionDeclaration();
    } else {
      member = this.parseVariableDeclaration();
    }

    return new ClassMember(
      accessModifier,
      isStatic,
      isAbstract,
      member,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse interface declaration (TypeScript)
   */
  private parseInterfaceDeclaration(): InterfaceDeclaration {
    const start = this.previous().start;

    // Template parameters
    const templateParameters: TypeParameter[] = [];
    if (this.match(TokenType.TEMPLATE)) {
      this.consume(TokenType.LESS_THAN, "Expected '<' after template");
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          templateParameters.push(this.parseTypeParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.GREATER_THAN,
        "Expected '>' after template parameters"
      );
    }

    // Interface name
    this.consume(TokenType.IDENTIFIER, 'Expected interface name');
    const name = this.previous().value;

    // Extends
    const extends_: TypeNode[] = [];
    if (this.match(TokenType.EXTENDS)) {
      do {
        extends_.push(this.parseType());
      } while (this.match(TokenType.COMMA));
    }

    // Interface body
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before interface body");
    const members: InterfaceMember[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const member = this.parseInterfaceMember();
      members.push(member);
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after interface body");

    return new InterfaceDeclaration(
      name,
      extends_,
      members,
      templateParameters,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse interface member
   */
  private parseInterfaceMember(): InterfaceMember {
    const start = this.peek().start;

    let member: FunctionDeclaration | VariableDeclaration;
    if (this.isFunctionDeclaration()) {
      member = this.parseFunctionDeclaration();
    } else {
      member = this.parseVariableDeclaration();
    }

    return new InterfaceMember(
      member,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse struct declaration
   */
  private parseStructDeclaration(): StructDeclaration {
    const start = this.previous().start;

    // Template parameters
    const templateParameters: TypeParameter[] = [];
    if (this.match(TokenType.TEMPLATE)) {
      this.consume(TokenType.LESS_THAN, "Expected '<' after template");
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          templateParameters.push(this.parseTypeParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.GREATER_THAN,
        "Expected '>' after template parameters"
      );
    }

    // Struct name
    this.consume(TokenType.IDENTIFIER, 'Expected struct name');
    const name = this.previous().value;

    // Struct body
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before struct body");
    const members: StructMember[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      members.push(this.parseStructMember());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after struct body");
    this.consume(TokenType.SEMICOLON, "Expected ';' after struct declaration");

    return new StructDeclaration(
      name,
      members,
      templateParameters,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse struct member
   */
  private parseStructMember(): StructMember {
    const start = this.peek().start;

    const type = this.parseType();
    this.consume(TokenType.IDENTIFIER, 'Expected member name');
    const name = this.previous().value;
    this.consume(TokenType.SEMICOLON, "Expected ';' after struct member");

    return new StructMember(
      name,
      type,
      AccessModifier.Public,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse enum declaration
   */
  private parseEnumDeclaration(): EnumDeclaration {
    const start = this.previous().start;

    // Enum name
    this.consume(TokenType.IDENTIFIER, 'Expected enum name');
    const name = this.previous().value;

    // Underlying type (C++ style)
    let underlyingType: TypeNode | null = null;
    if (this.match(TokenType.COLON)) {
      underlyingType = this.parseType();
    }

    // Enum body
    this.consume(TokenType.LEFT_BRACE, "Expected '{' before enum body");
    const members: EnumMember[] = [];

    if (!this.check(TokenType.RIGHT_BRACE)) {
      do {
        const memberStart = this.peek().start;
        this.consume(TokenType.IDENTIFIER, 'Expected enum member name');
        const memberName = this.previous().value;

        let value: Expression | null = null;
        if (this.match(TokenType.ASSIGN)) {
          value = this.parseExpression();
        }

        members.push(
          new EnumMember(
            memberName,
            value,
            this.createLocation(memberStart, this.previous().end)
          )
        );
      } while (
        this.match(TokenType.COMMA) &&
        !this.check(TokenType.RIGHT_BRACE)
      );
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after enum body");
    this.consume(TokenType.SEMICOLON, "Expected ';' after enum declaration");

    return new EnumDeclaration(
      name,
      members,
      underlyingType,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse namespace declaration
   */
  private parseNamespaceDeclaration(): NamespaceDeclaration {
    const start = this.previous().start;

    this.consume(TokenType.IDENTIFIER, 'Expected namespace name');
    const name = this.previous().value;

    this.consume(TokenType.LEFT_BRACE, "Expected '{' before namespace body");
    const declarations: Declaration[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const decl = this.parseDeclaration();
      if (decl) {
        declarations.push(decl);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after namespace body");

    return new NamespaceDeclaration(
      name,
      declarations,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse type alias declaration
   */
  private parseTypeAliasDeclaration(): TypeAliasDeclaration {
    const start = this.previous().start;

    this.consume(TokenType.IDENTIFIER, 'Expected type alias name');
    const name = this.previous().value;

    // Template parameters
    const templateParameters: TypeParameter[] = [];
    if (this.match(TokenType.LESS_THAN)) {
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          templateParameters.push(this.parseTypeParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.GREATER_THAN,
        "Expected '>' after template parameters"
      );
    }

    this.consume(TokenType.ASSIGN, "Expected '=' after type alias name");
    const type = this.parseType();
    this.consume(TokenType.SEMICOLON, "Expected ';' after type alias");

    return new TypeAliasDeclaration(
      name,
      type,
      templateParameters,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse import declaration
   */
  private parseImportDeclaration(): ImportDeclaration {
    const start = this.previous().start;
    const specifiers: ImportSpecifier[] = [];

    // Parse import specifiers
    if (this.match(TokenType.LEFT_BRACE)) {
      // Named imports: import { a, b } from "module"
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          const imported = this.consume(
            TokenType.IDENTIFIER,
            'Expected import name'
          ).value;
          let local = imported;
          if (this.match(TokenType.AS)) {
            local = this.consume(
              TokenType.IDENTIFIER,
              'Expected local name'
            ).value;
          }
          specifiers.push(
            new ImportSpecifier(
              imported,
              local,
              this.createLocation(start, this.previous().end)
            )
          );
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.RIGHT_BRACE,
        "Expected '}' after import specifiers"
      );
    } else {
      // Default import: import name from "module"
      const name = this.consume(
        TokenType.IDENTIFIER,
        'Expected import name'
      ).value;
      specifiers.push(
        new ImportSpecifier(
          'default',
          name,
          this.createLocation(start, this.previous().end)
        )
      );
    }

    this.consume(TokenType.FROM, "Expected 'from' after import specifiers");
    const source = this.consume(
      TokenType.STRING_LITERAL,
      'Expected module path'
    ).value;
    this.consume(TokenType.SEMICOLON, "Expected ';' after import");

    return new ImportDeclaration(
      specifiers,
      source.slice(1, -1), // Remove quotes
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse export declaration
   */
  private parseExportDeclaration(): ExportDeclaration {
    const start = this.previous().start;
    let declaration: Declaration | null = null;
    const specifiers: ExportSpecifier[] = [];
    let source: string | null = null;

    if (this.match(TokenType.LEFT_BRACE)) {
      // Named exports: export { a, b }
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          const local = this.consume(
            TokenType.IDENTIFIER,
            'Expected export name'
          ).value;
          let exported = local;
          if (this.match(TokenType.AS)) {
            exported = this.consume(
              TokenType.IDENTIFIER,
              'Expected exported name'
            ).value;
          }
          specifiers.push(
            new ExportSpecifier(
              local,
              exported,
              this.createLocation(start, this.previous().end)
            )
          );
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.RIGHT_BRACE,
        "Expected '}' after export specifiers"
      );

      if (this.match(TokenType.FROM)) {
        source = this.consume(
          TokenType.STRING_LITERAL,
          'Expected module path'
        ).value.slice(1, -1);
      }
      this.consume(TokenType.SEMICOLON, "Expected ';' after export");
    } else {
      // Export declaration: export function foo() {}
      declaration = this.parseDeclaration();
    }

    return new ExportDeclaration(
      declaration,
      specifiers,
      source,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse statement
   */
  private parseStatement(): Statement {
    if (this.match(TokenType.LEFT_BRACE)) return this.parseBlockStatement();
    if (this.match(TokenType.IF)) return this.parseIfStatement();
    if (this.match(TokenType.WHILE)) return this.parseWhileStatement();
    if (this.match(TokenType.FOR)) return this.parseForStatement();
    if (this.match(TokenType.SWITCH)) return this.parseSwitchStatement();
    if (this.match(TokenType.TRY)) return this.parseTryStatement();
    if (this.match(TokenType.PASS)) return this.parsePassStatement();
    if (this.match(TokenType.RETURN)) return this.parseReturnStatement();
    if (this.match(TokenType.BREAK)) return this.parseBreakStatement();
    if (this.match(TokenType.CONTINUE)) return this.parseContinueStatement();
    if (this.match(TokenType.THROW)) return this.parseThrowStatement();

    return this.parseExpressionStatement();
  }

  /**
   * Parse block statement
   */
  private parseBlockStatement(): BlockStatement {
    const start = this.previous().start;
    const statements: Statement[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block");
    return new BlockStatement(
      statements,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse if statement
   */
  private parseIfStatement(): IfStatement {
    const start = this.previous().start;

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition");

    const thenStatement = this.parseStatement();
    let elseStatement: Statement | null = null;
    if (this.match(TokenType.ELSE)) {
      elseStatement = this.parseStatement();
    }

    return new IfStatement(
      condition,
      thenStatement,
      elseStatement,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse while statement
   */
  private parseWhileStatement(): WhileStatement {
    const start = this.previous().start;

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'");
    const condition = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition");

    const body = this.parseStatement();

    return new WhileStatement(
      condition,
      body,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse for statement
   */
  private parseForStatement(): ForStatement | ForInStatement | ForOfStatement {
    const start = this.previous().start;

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'");

    // Check for for-in or for-of (TypeScript)
    if (this.options.allowTSFeatures) {
      const checkpoint = this.current;
      try {
        if (this.match(TokenType.IDENTIFIER)) {
          const variable = this.previous().value;
          if (this.match(TokenType.IN)) {
            const iterable = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for-in");
            const body = this.parseStatement();
            return new ForInStatement(
              variable,
              iterable,
              body,
              this.createLocation(start, this.previous().end)
            );
          } else if (this.match(TokenType.OF)) {
            const iterable = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for-of");
            const body = this.parseStatement();
            return new ForOfStatement(
              variable,
              iterable,
              body,
              false,
              this.createLocation(start, this.previous().end)
            );
          }
        }
      } catch {
        // Fall back to regular for loop
      }
      this.current = checkpoint;
    }

    // Regular for loop
    let init: Statement | Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.isVariableDeclaration()) {
        init = this.parseVariableDeclaration();
      } else {
        init = this.parseExpression();
        this.consume(
          TokenType.SEMICOLON,
          "Expected ';' after for loop initializer"
        );
      }
    } else {
      this.advance(); // consume ';'
    }

    let condition: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.parseExpression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for loop condition");

    let update: Expression | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      update = this.parseExpression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for clauses");

    const body = this.parseStatement();

    return new ForStatement(
      init,
      condition,
      update,
      body,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse switch statement
   */
  private parseSwitchStatement(): SwitchStatement {
    const start = this.previous().start;

    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'switch'");
    const discriminant = this.parseExpression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after switch expression");

    this.consume(TokenType.LEFT_BRACE, "Expected '{' before switch body");
    const cases: SwitchCase[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.CASE)) {
        const test = this.parseExpression();
        this.consume(TokenType.COLON, "Expected ':' after case value");
        const statements: Statement[] = [];
        while (
          !this.check(
            TokenType.CASE,
            TokenType.DEFAULT,
            TokenType.RIGHT_BRACE
          ) &&
          !this.isAtEnd()
        ) {
          statements.push(this.parseStatement());
        }
        cases.push(
          new SwitchCase(
            test,
            statements,
            this.createLocation(start, this.previous().end)
          )
        );
      } else if (this.match(TokenType.DEFAULT)) {
        this.consume(TokenType.COLON, "Expected ':' after default");
        const statements: Statement[] = [];
        while (
          !this.check(
            TokenType.CASE,
            TokenType.DEFAULT,
            TokenType.RIGHT_BRACE
          ) &&
          !this.isAtEnd()
        ) {
          statements.push(this.parseStatement());
        }
        cases.push(
          new SwitchCase(
            null,
            statements,
            this.createLocation(start, this.previous().end)
          )
        );
      } else {
        throw new ParseError(
          "Expected 'case' or 'default' in switch statement",
          this.peek()
        );
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after switch body");

    return new SwitchStatement(
      discriminant,
      cases,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse try statement
   */
  private parseTryStatement(): TryStatement {
    const start = this.previous().start;

    const body = this.parseBlockStatement();

    let handler: CatchClause | null = null;
    if (this.match(TokenType.CATCH)) {
      const catchStart = this.previous().start;
      let param: string | null = null;

      if (this.match(TokenType.LEFT_PAREN)) {
        if (!this.check(TokenType.RIGHT_PAREN)) {
          param = this.consume(
            TokenType.IDENTIFIER,
            'Expected parameter name'
          ).value;
        }
        this.consume(
          TokenType.RIGHT_PAREN,
          "Expected ')' after catch parameter"
        );
      }

      const catchBody = this.parseBlockStatement();
      handler = new CatchClause(
        param,
        catchBody,
        this.createLocation(catchStart, this.previous().end)
      );
    }

    let finalizer: BlockStatement | null = null;
    if (this.match(TokenType.FINALLY)) {
      finalizer = this.parseBlockStatement();
    }

    if (!handler && !finalizer) {
      throw new ParseError('Missing catch or finally after try', this.peek());
    }

    return new TryStatement(
      body,
      handler,
      finalizer,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse return statement
   */
  private parseReturnStatement(): ReturnStatement {
    const start = this.previous().start;

    let argument: Expression | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      argument = this.parseExpression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after return value");
    return new ReturnStatement(
      argument,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse break statement
   */
  private parseBreakStatement(): BreakStatement {
    const start = this.previous().start;

    let label: string | null = null;
    if (this.check(TokenType.IDENTIFIER)) {
      label = this.advance().value;
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after break");
    return new BreakStatement(
      label,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse continue statement
   */
  private parseContinueStatement(): ContinueStatement {
    const start = this.previous().start;

    let label: string | null = null;
    if (this.check(TokenType.IDENTIFIER)) {
      label = this.advance().value;
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after continue");
    return new ContinueStatement(
      label,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse throw statement
   */
  private parseThrowStatement(): ThrowStatement {
    const start = this.previous().start;

    const argument = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after throw expression");

    return new ThrowStatement(
      argument,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse pass statement (WORLDC simplified no-op)
   * pass;
   */
  private parsePassStatement(): ExpressionStatement {
    const start = this.previous().start;
    this.consume(TokenType.SEMICOLON, "Expected ';' after pass");

    // Create a null literal as the expression for pass
    const nullExpr = new Literal(
      null,
      'pass',
      this.createLocation(start, this.previous().end)
    );

    return new ExpressionStatement(
      nullExpr,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse expression statement
   */
  private parseExpressionStatement(): ExpressionStatement {
    const start = this.peek().start;
    const expression = this.parseExpression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression");
    return new ExpressionStatement(
      expression,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse expression
   */
  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  /**
   * Parse assignment expression
   */
  private parseAssignment(): Expression {
    const expr = this.parseConditional();

    if (
      this.match(
        TokenType.ASSIGN,
        TokenType.PLUS_ASSIGN,
        TokenType.MINUS_ASSIGN,
        TokenType.MULTIPLY_ASSIGN,
        TokenType.DIVIDE_ASSIGN,
        TokenType.MODULO_ASSIGN
      )
    ) {
      const operator = this.previous().value;
      const right = this.parseAssignment();
      return new AssignmentExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse conditional expression (ternary)
   */
  private parseConditional(): Expression {
    const expr = this.parseLogicalOr();

    if (this.match(TokenType.QUESTION)) {
      const consequent = this.parseExpression();
      this.consume(
        TokenType.COLON,
        "Expected ':' after '?' in conditional expression"
      );
      const alternate = this.parseConditional();
      return new ConditionalExpression(
        expr,
        consequent,
        alternate,
        this.createLocation(expr.location.start, alternate.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse logical OR expression
   */
  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = new LogicalExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse logical AND expression
   */
  private parseLogicalAnd(): Expression {
    let expr = this.parseBitwiseOr();

    while (this.match(TokenType.AND)) {
      const operator = this.previous().value;
      const right = this.parseBitwiseOr();
      expr = new LogicalExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse bitwise OR expression
   */
  private parseBitwiseOr(): Expression {
    let expr = this.parseBitwiseXor();

    while (this.match(TokenType.BIT_OR)) {
      const operator = this.previous().value;
      const right = this.parseBitwiseXor();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse bitwise XOR expression
   */
  private parseBitwiseXor(): Expression {
    let expr = this.parseBitwiseAnd();

    while (this.match(TokenType.BIT_XOR)) {
      const operator = this.previous().value;
      const right = this.parseBitwiseAnd();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse bitwise AND expression
   */
  private parseBitwiseAnd(): Expression {
    let expr = this.parseEquality();

    while (this.match(TokenType.BIT_AND)) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse equality expression
   */
  private parseEquality(): Expression {
    let expr = this.parseRelational();

    while (
      this.match(
        TokenType.EQUAL,
        TokenType.NOT_EQUAL,
        TokenType.STRICT_EQUAL,
        TokenType.STRICT_NOT_EQUAL
      )
    ) {
      const operator = this.previous().value;
      const right = this.parseRelational();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse relational expression
   */
  private parseRelational(): Expression {
    let expr = this.parseShift();

    while (
      this.match(
        TokenType.LESS_THAN,
        TokenType.LESS_EQUAL,
        TokenType.GREATER_THAN,
        TokenType.GREATER_EQUAL
      )
    ) {
      const operator = this.previous().value;
      const right = this.parseShift();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse shift expression
   */
  private parseShift(): Expression {
    let expr = this.parseAdditive();

    while (
      this.match(
        TokenType.LEFT_SHIFT,
        TokenType.RIGHT_SHIFT,
        TokenType.UNSIGNED_RIGHT_SHIFT
      )
    ) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse additive expression
   */
  private parseAdditive(): Expression {
    let expr = this.parseMultiplicative();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse multiplicative expression
   */
  private parseMultiplicative(): Expression {
    let expr = this.parseUnary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = new BinaryExpression(
        operator,
        expr,
        right,
        this.createLocation(expr.location.start, right.location.end)
      );
    }

    return expr;
  }

  /**
   * Parse unary expression
   */
  private parseUnary(): Expression {
    if (
      this.match(
        TokenType.NOT,
        TokenType.BIT_NOT,
        TokenType.PLUS,
        TokenType.MINUS
      )
    ) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      return new UnaryExpression(
        operator,
        right,
        true,
        this.createLocation(this.previous().start, right.location.end)
      );
    }

    if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
      const operator = this.previous().value;
      const right = this.parsePostfix();
      return new UpdateExpression(
        operator,
        right,
        true,
        this.createLocation(this.previous().start, right.location.end)
      );
    }

    if (this.options.allowTSFeatures && this.match(TokenType.AWAIT)) {
      const argument = this.parseUnary();
      return new AwaitExpression(
        argument,
        this.createLocation(this.previous().start, argument.location.end)
      );
    }

    if (this.match(TokenType.SIZEOF)) {
      const argument = this.parseUnary();
      return new UnaryExpression(
        'sizeof',
        argument,
        true,
        this.createLocation(this.previous().start, argument.location.end)
      );
    }

    return this.parsePostfix();
  }

  /**
   * Parse postfix expression
   */
  private parsePostfix(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match(TokenType.INCREMENT, TokenType.DECREMENT)) {
        const operator = this.previous().value;
        expr = new UpdateExpression(
          operator,
          expr,
          false,
          this.createLocation(expr.location.start, this.previous().end)
        );
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.parseExpression();
        this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array index");
        expr = new MemberExpression(
          expr,
          index,
          true,
          false,
          this.createLocation(expr.location.start, this.previous().end)
        );
      } else if (
        this.match(TokenType.DOT, TokenType.ARROW, TokenType.OPTIONAL_CHAINING)
      ) {
        const operator = this.previous().value;
        const property = this.consume(
          TokenType.IDENTIFIER,
          'Expected property name'
        ).value;
        const propertyExpr = new Identifier(
          property,
          this.createLocation(this.previous().start, this.previous().end)
        );
        const optional = operator === '?.';
        expr = new MemberExpression(
          expr,
          propertyExpr,
          false,
          optional,
          this.createLocation(expr.location.start, this.previous().end)
        );
        // Call expression or invoke expression
      } else if (this.match(TokenType.LEFT_PAREN)) {
        const args: Expression[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        expr = new CallExpression(
          expr,
          args,
          [],
          this.createLocation(expr.location.start, this.previous().end)
        );
      } else {
        break;
      }
    }

    return expr;
  }

  /**
   * Parse primary expression
   */
  private parsePrimary(): Expression {
    const start = this.peek().start;

    if (this.match(TokenType.TRUE, TokenType.FALSE)) {
      const value = this.previous().value === 'true';
      return new Literal(
        value,
        this.previous().value,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.NULL, TokenType.NULLPTR, TokenType.UNDEFINED)) {
      const value = this.previous().value === 'undefined' ? undefined : null;
      return new Literal(
        value,
        this.previous().value,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.INTEGER_LITERAL)) {
      const raw = this.previous().value;
      const value = parseInt(
        raw,
        raw.startsWith('0x') ? 16 : raw.startsWith('0b') ? 2 : 10
      );
      return new Literal(
        value,
        raw,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.FLOAT_LITERAL)) {
      const raw = this.previous().value;
      const value = parseFloat(raw);
      return new Literal(
        value,
        raw,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.STRING_LITERAL)) {
      const raw = this.previous().value;
      const value = raw.slice(1, -1); // Remove quotes
      return new Literal(
        value,
        raw,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.CHAR_LITERAL)) {
      const raw = this.previous().value;
      const value = raw.slice(1, -1); // Remove quotes
      return new Literal(
        value,
        raw,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;
      return new Identifier(
        name,
        this.createLocation(start, this.previous().end)
      );
    }

    // WORLDC invoke expression
    if (this.match(TokenType.INVOKE)) {
      const funcName = this.consume(
        TokenType.IDENTIFIER,
        'Expected function name after invoke'
      ).value;
      this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");

      const args: Expression[] = [];
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");

      const funcExpr = new Identifier(
        funcName,
        this.createLocation(start, this.previous().end)
      );

      return new CallExpression(
        funcExpr,
        args,
        [],
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.THIS)) {
      return new ThisExpression(
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.SUPER)) {
      return new SuperExpression(
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression");
      return expr;
    }

    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements: (Expression | null)[] = [];
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          if (this.check(TokenType.COMMA)) {
            elements.push(null); // Sparse array
          } else {
            elements.push(this.parseExpression());
          }
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.RIGHT_BRACKET,
        "Expected ']' after array elements"
      );
      return new ArrayExpression(
        elements,
        this.createLocation(start, this.previous().end)
      );
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      const properties: ObjectProperty[] = [];
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          const key = this.parseExpression();
          this.consume(TokenType.COLON, "Expected ':' after object key");
          const value = this.parseExpression();
          properties.push(
            new ObjectProperty(
              key,
              value,
              false,
              false,
              this.createLocation(start, this.previous().end)
            )
          );
        } while (
          this.match(TokenType.COMMA) &&
          !this.check(TokenType.RIGHT_BRACE)
        );
      }
      this.consume(
        TokenType.RIGHT_BRACE,
        "Expected '}' after object properties"
      );
      return new ObjectExpression(
        properties,
        this.createLocation(start, this.previous().end)
      );
    }

    // Arrow function (TypeScript)
    if (this.options.allowTSFeatures && this.isArrowFunction()) {
      return this.parseArrowFunction();
    }

    // Lambda expression (C++)
    if (this.options.allowCPPFeatures && this.match(TokenType.LEFT_BRACKET)) {
      return this.parseLambdaExpression();
    }

    if (this.match(TokenType.NEW)) {
      const callee = this.parsePrimary();
      let args: Expression[] = [];
      if (this.match(TokenType.LEFT_PAREN)) {
        if (!this.check(TokenType.RIGHT_PAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
      }
      return new NewExpression(
        callee,
        args,
        [],
        this.createLocation(start, this.previous().end)
      );
    }

    throw new ParseError(`Unexpected token: ${this.peek().value}`, this.peek());
  }

  /**
   * Parse arrow function (TypeScript)
   */
  private parseArrowFunction(): ArrowFunctionExpression {
    const start = this.peek().start;
    const parameters: Parameter[] = [];

    if (this.match(TokenType.LEFT_PAREN)) {
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          parameters.push(this.parseParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters");
    } else {
      // Single parameter without parentheses
      const param = this.consume(
        TokenType.IDENTIFIER,
        'Expected parameter name'
      ).value;
      parameters.push(
        new Parameter(
          param,
          new PrimitiveType(
            'any',
            this.createLocation(this.previous().start, this.previous().end)
          ),
          null,
          false,
          false,
          this.createLocation(this.previous().start, this.previous().end)
        )
      );
    }

    let returnType: TypeNode | null = null;
    if (this.match(TokenType.COLON)) {
      returnType = this.parseType();
    }

    this.consume(
      TokenType.ARROW,
      "Expected '=>' after arrow function parameters"
    );

    let body: Expression | BlockStatement;
    if (this.match(TokenType.LEFT_BRACE)) {
      body = this.parseBlockStatement();
    } else {
      body = this.parseExpression();
    }

    return new ArrowFunctionExpression(
      parameters,
      body,
      false,
      returnType,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse lambda expression (C++)
   */
  private parseLambdaExpression(): LambdaExpression {
    const start = this.previous().start;
    const captures: LambdaCapture[] = [];

    // Parse captures
    if (!this.check(TokenType.RIGHT_BRACKET)) {
      do {
        let byReference = false;
        if (this.match(TokenType.BIT_AND)) {
          byReference = true;
        }
        const name = this.consume(
          TokenType.IDENTIFIER,
          'Expected capture name'
        ).value;
        captures.push(
          new LambdaCapture(
            name,
            byReference,
            this.createLocation(start, this.previous().end)
          )
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after lambda captures");

    // Parameters
    const parameters: Parameter[] = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          parameters.push(this.parseParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.RIGHT_PAREN,
        "Expected ')' after lambda parameters"
      );
    }

    // Return type
    let returnType: TypeNode | null = null;
    if (this.match(TokenType.ARROW)) {
      returnType = this.parseType();
    }

    // Body
    let body: Expression | BlockStatement;
    if (this.match(TokenType.LEFT_BRACE)) {
      body = this.parseBlockStatement();
    } else {
      body = this.parseExpression();
    }

    return new LambdaExpression(
      captures,
      parameters,
      body,
      returnType,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse parameter
   */
  private parseParameter(): Parameter {
    const start = this.peek().start;

    // Rest parameter
    let isRest = false;
    if (this.match(TokenType.ELLIPSIS)) {
      isRest = true;
    }

    // Parameter type (C/C++ style)
    let type: TypeNode | null = null;
    if (!this.check(TokenType.IDENTIFIER) || this.isTypeToken()) {
      type = this.parseType();
    }

    // Parameter name
    this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
    const name = this.previous().value;

    // TypeScript type annotation
    if (this.match(TokenType.COLON)) {
      type = this.parseType();
    }

    // Optional parameter
    let isOptional = false;
    if (this.match(TokenType.QUESTION)) {
      isOptional = true;
    }

    // Default value
    let defaultValue: Expression | null = null;
    if (this.match(TokenType.ASSIGN)) {
      defaultValue = this.parseExpression();
    }

    // Ensure we have a type
    if (!type) {
      type = new PrimitiveType(
        'any',
        this.createLocation(start, this.previous().end)
      );
    }

    return new Parameter(
      name,
      type,
      defaultValue,
      isOptional,
      isRest,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse type parameter
   */
  private parseTypeParameter(): TypeParameter {
    const start = this.peek().start;

    this.consume(TokenType.IDENTIFIER, 'Expected type parameter name');
    const name = this.previous().value;

    let constraint: TypeNode | null = null;
    if (this.match(TokenType.EXTENDS)) {
      constraint = this.parseType();
    }

    let defaultType: TypeNode | null = null;
    if (this.match(TokenType.ASSIGN)) {
      defaultType = this.parseType();
    }

    return new TypeParameter(
      name,
      constraint,
      defaultType,
      this.createLocation(start, this.previous().end)
    );
  }

  /**
   * Parse type
   */
  private parseType(): TypeNode {
    return this.parseUnionType();
  }

  /**
   * Parse union type (TypeScript)
   */
  private parseUnionType(): TypeNode {
    let type = this.parseIntersectionType();

    if (this.options.allowTSFeatures && this.match(TokenType.BIT_OR)) {
      const types = [type];
      do {
        types.push(this.parseIntersectionType());
      } while (this.match(TokenType.BIT_OR));
      return new UnionType(
        types,
        this.createLocation(
          type.location.start,
          types[types.length - 1].location.end
        )
      );
    }

    return type;
  }

  /**
   * Parse intersection type (TypeScript)
   */
  private parseIntersectionType(): TypeNode {
    let type = this.parsePrimaryType();

    if (this.options.allowTSFeatures && this.match(TokenType.BIT_AND)) {
      const types = [type];
      do {
        types.push(this.parsePrimaryType());
      } while (this.match(TokenType.BIT_AND));
      return new IntersectionType(
        types,
        this.createLocation(
          type.location.start,
          types[types.length - 1].location.end
        )
      );
    }

    return type;
  }

  /**
   * Parse primary type
   */
  private parsePrimaryType(): TypeNode {
    const start = this.peek().start;

    // Pointer type
    if (this.match(TokenType.MULTIPLY)) {
      const pointeeType = this.parsePrimaryType();
      return new PointerType(
        pointeeType,
        this.createLocation(start, pointeeType.location.end)
      );
    }

    // Reference type
    if (this.match(TokenType.BIT_AND)) {
      const referencedType = this.parsePrimaryType();
      return new ReferenceType(
        referencedType,
        this.createLocation(start, referencedType.location.end)
      );
    }

    // Parenthesized type
    if (this.match(TokenType.LEFT_PAREN)) {
      const type = this.parseType();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after type");
      return type;
    }

    // Array type (TypeScript style)
    if (this.options.allowTSFeatures && this.match(TokenType.LEFT_BRACKET)) {
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' for array type");
      const elementType = this.parsePrimaryType();
      return new ArrayType(
        elementType,
        null,
        this.createLocation(start, elementType.location.end)
      );
    }

    // Tuple type (TypeScript)
    if (this.options.allowTSFeatures && this.match(TokenType.LEFT_BRACKET)) {
      const elementTypes: TypeNode[] = [];
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          elementTypes.push(this.parseType());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after tuple types");
      return new TupleType(
        elementTypes,
        this.createLocation(start, this.previous().end)
      );
    }

    // Function type
    if (this.match(TokenType.LEFT_PAREN)) {
      const parameters: TypeNode[] = [];
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          parameters.push(this.parseType());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(
        TokenType.RIGHT_PAREN,
        "Expected ')' after function parameters"
      );
      this.consume(TokenType.ARROW, "Expected '=>' after function parameters");
      const returnType = this.parseType();
      return new FunctionType(
        parameters,
        returnType,
        this.createLocation(start, returnType.location.end)
      );
    }

    // Named type
    this.consume(TokenType.IDENTIFIER, 'Expected type name');
    const name = this.previous().value;
    let type: TypeNode = new PrimitiveType(
      name,
      this.createLocation(start, this.previous().end)
    );

    // Generic type
    if (this.match(TokenType.LESS_THAN)) {
      const typeArguments: TypeNode[] = [];
      if (!this.check(TokenType.GREATER_THAN)) {
        do {
          typeArguments.push(this.parseType());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.GREATER_THAN, "Expected '>' after type arguments");
      type = new GenericType(
        name,
        typeArguments,
        this.createLocation(start, this.previous().end)
      );
    }

    // Array type (C style)
    while (this.match(TokenType.LEFT_BRACKET)) {
      let size: Expression | null = null;
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        size = this.parseExpression();
      }
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array size");
      type = new ArrayType(
        type,
        size,
        this.createLocation(start, this.previous().end)
      );
    }

    // Optional type (TypeScript)
    if (this.options.allowTSFeatures && this.match(TokenType.QUESTION)) {
      type = new OptionalType(
        type,
        this.createLocation(start, this.previous().end)
      );
    }

    return type;
  }

  /**
   * Helper methods
   */

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(...types: TokenType[]): boolean {
    if (this.isAtEnd()) return false;
    return types.includes(this.peek().type);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(message, this.peek());
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUNCTION:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private createLocation(
    start: SourcePosition,
    end: SourcePosition
  ): SourceLocation {
    return { start, end };
  }

  private isFunctionDeclaration(): boolean {
    const checkpoint = this.current;

    try {
      // Skip modifiers
      while (
        this.match(
          TokenType.INLINE,
          TokenType.VIRTUAL,
          TokenType.STATIC,
          TokenType.ASYNC
        )
      ) {
        // Continue
      }

      // Skip template
      if (this.match(TokenType.TEMPLATE)) {
        this.consume(TokenType.LESS_THAN, '');
        let depth = 1;
        while (depth > 0 && !this.isAtEnd()) {
          if (this.match(TokenType.LESS_THAN)) depth++;
          else if (this.match(TokenType.GREATER_THAN)) depth--;
          else this.advance();
        }
      }

      // Return type or function keyword
      if (this.match(TokenType.FUNCTION)) {
        return true;
      }

      // Try to parse type
      if (this.isTypeToken()) {
        this.parseType();
        // Function name
        if (this.match(TokenType.IDENTIFIER)) {
          // Parameters
          if (this.match(TokenType.LEFT_PAREN)) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    } finally {
      this.current = checkpoint;
    }
  }

  private isVariableDeclaration(): boolean {
    const checkpoint = this.current;

    try {
      // Skip modifiers
      while (this.match(TokenType.CONST, TokenType.STATIC, TokenType.EXTERN)) {
        // Continue
      }

      // TypeScript let/var
      if (this.match(TokenType.LET, TokenType.VAR)) {
        return true;
      }

      // C/C++ style type declaration
      if (this.isTypeToken()) {
        this.parseType();
        if (this.match(TokenType.IDENTIFIER)) {
          // Check for assignment or semicolon
          return this.check(TokenType.ASSIGN, TokenType.SEMICOLON);
        }
      }

      return false;
    } catch {
      return false;
    } finally {
      this.current = checkpoint;
    }
  }

  private isTypeToken(): boolean {
    return this.check(
      TokenType.VOID,
      TokenType.INT,
      TokenType.FLOAT,
      TokenType.DOUBLE,
      TokenType.CHAR,
      TokenType.BOOL,
      TokenType.SHORT,
      TokenType.LONG,
      TokenType.SIGNED,
      TokenType.UNSIGNED,
      TokenType.AUTO,
      TokenType.STRING,
      TokenType.NUMBER,
      TokenType.BOOLEAN,
      TokenType.ANY,
      TokenType.OBJECT,
      TokenType.SYMBOL,
      TokenType.BIGINT,
      TokenType.UNKNOWN,
      TokenType.NEVER,
      TokenType.VEC2,
      TokenType.VEC3,
      TokenType.VEC4,
      TokenType.IVEC2,
      TokenType.IVEC3,
      TokenType.IVEC4,
      TokenType.QUAT,
      TokenType.MAT3,
      TokenType.MAT4,
      TokenType.IDENTIFIER
    );
  }

  private isArrowFunction(): boolean {
    const checkpoint = this.current;

    try {
      // Single parameter or parameter list
      if (this.match(TokenType.IDENTIFIER)) {
        return this.check(TokenType.ARROW);
      } else if (this.match(TokenType.LEFT_PAREN)) {
        // Skip parameter list
        let depth = 1;
        while (depth > 0 && !this.isAtEnd()) {
          if (this.match(TokenType.LEFT_PAREN)) depth++;
          else if (this.match(TokenType.RIGHT_PAREN)) depth--;
          else this.advance();
        }

        // Optional type annotation
        if (this.match(TokenType.COLON)) {
          this.parseType();
        }

        return this.check(TokenType.ARROW);
      }

      return false;
    } catch {
      return false;
    } finally {
      this.current = checkpoint;
    }
  }
}

/**
 * Utility function to create parser from source code
 */
export function createParser(
  source: string,
  options: ParserOptions = {}
): Parser {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  return new Parser(tokens, options);
}

/**
 * Utility function to parse source code directly
 */
export function parseSource(
  source: string,
  options: ParserOptions = {}
): Program {
  const parser = createParser(source, options);
  return parser.parse();
}
