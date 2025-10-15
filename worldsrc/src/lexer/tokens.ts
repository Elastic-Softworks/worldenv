/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Token Definitions
 *
 * Comprehensive token system supporting C, C++, and TypeScript syntax
 * in a unified language for game development
 */

export enum TokenType {
  // EOF and Invalid
  EOF = 'EOF',
  INVALID = 'INVALID',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  INTEGER_LITERAL = 'INTEGER_LITERAL',
  FLOAT_LITERAL = 'FLOAT_LITERAL',
  STRING_LITERAL = 'STRING_LITERAL',
  CHAR_LITERAL = 'CHAR_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',

  // C/C++ Keywords
  AUTO = 'auto',
  BOOL = 'bool',
  BREAK = 'break',
  CASE = 'case',
  CATCH = 'catch',
  CHAR = 'char',
  CLASS = 'class',
  CONST = 'const',
  CONST_CAST = 'const_cast',
  CONTINUE = 'continue',
  DEFAULT = 'default',
  DELETE = 'delete',
  DO = 'do',
  DOUBLE = 'double',
  DYNAMIC_CAST = 'dynamic_cast',
  ELSE = 'else',
  ENUM = 'enum',
  EXPLICIT = 'explicit',
  EXPORT = 'export',
  EXTERN = 'extern',
  FALSE = 'false',
  FINAL = 'final',
  FLOAT = 'float',
  FOR = 'for',
  FINALLY = 'finally',
  FRIEND = 'friend',
  GOTO = 'goto',
  IF = 'if',
  INLINE = 'inline',
  INT = 'int',
  LONG = 'long',
  MUTABLE = 'mutable',
  NAMESPACE = 'namespace',
  NEW = 'new',
  NULLPTR = 'nullptr',
  OPERATOR = 'operator',
  OVERRIDE = 'override',
  PRIVATE = 'private',
  PROTECTED = 'protected',
  PUBLIC = 'public',
  REGISTER = 'register',
  REINTERPRET_CAST = 'reinterpret_cast',
  RETURN = 'return',
  SHORT = 'short',
  SIGNED = 'signed',
  SIZEOF = 'sizeof',
  STATIC = 'static',
  STATIC_ASSERT = 'static_assert',
  STATIC_CAST = 'static_cast',
  STRUCT = 'struct',
  SUPER = 'super',
  SWITCH = 'switch',
  TEMPLATE = 'template',
  THIS = 'this',
  THROW = 'throw',
  TRUE = 'true',
  TRY = 'try',
  TYPEDEF = 'typedef',
  TYPEID = 'typeid',
  TYPENAME = 'typename',
  UNION = 'union',
  UNSIGNED = 'unsigned',
  USING = 'using',
  VIRTUAL = 'virtual',
  VOID = 'void',
  VOLATILE = 'volatile',
  WHILE = 'while',

  // TypeScript Keywords
  ABSTRACT = 'abstract',
  ANY = 'any',
  AS = 'as',
  ASYNC = 'async',
  AWAIT = 'await',
  BIGINT = 'bigint',
  BOOLEAN = 'boolean',
  DECLARE = 'declare',
  EXTENDS = 'extends',
  FUNCTION = 'function',
  IMPLEMENTS = 'implements',
  IMPORT = 'import',
  IN = 'in',
  INSTANCEOF = 'instanceof',
  INTERFACE = 'interface',
  FROM = 'from',
  IS = 'is',
  KEYOF = 'keyof',
  LET = 'let',
  MODULE = 'module',
  NEVER = 'never',
  NULL = 'null',
  NUMBER = 'number',
  OBJECT = 'object',
  OF = 'of',
  READONLY = 'readonly',
  REQUIRE = 'require',
  STRING = 'string',
  SYMBOL = 'symbol',
  TYPE = 'type',
  TYPEOF = 'typeof',
  UNDEFINED = 'undefined',
  UNIQUE = 'unique',
  UNKNOWN = 'unknown',
  VAR = 'var',
  YIELD = 'yield',

  // WORLDSRC Vector Types
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  IVEC2 = 'ivec2',
  IVEC3 = 'ivec3',
  IVEC4 = 'ivec4',
  QUAT = 'quat',
  MAT3 = 'mat3',
  MAT4 = 'mat4',

  // Operators
  PLUS = '+',
  MINUS = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
  MODULO = '%',
  ASSIGN = '=',
  PLUS_ASSIGN = '+=',
  MINUS_ASSIGN = '-=',
  MULTIPLY_ASSIGN = '*=',
  DIVIDE_ASSIGN = '/=',
  MODULO_ASSIGN = '%=',

  // Comparison
  EQUAL = '==',
  NOT_EQUAL = '!=',
  LESS_THAN = '<',
  LESS_EQUAL = '<=',
  GREATER_THAN = '>',
  GREATER_EQUAL = '>=',
  STRICT_EQUAL = '===',
  STRICT_NOT_EQUAL = '!==',

  // Logical
  AND = '&&',
  OR = '||',
  NOT = '!',

  // Bitwise
  BIT_AND = '&',
  BIT_OR = '|',
  BIT_XOR = '^',
  BIT_NOT = '~',
  LEFT_SHIFT = '<<',
  RIGHT_SHIFT = '>>',
  UNSIGNED_RIGHT_SHIFT = '>>>',

  // Increment/Decrement
  INCREMENT = '++',
  DECREMENT = '--',

  // Member Access
  DOT = '.',
  ARROW = '->',
  SCOPE = '::',
  OPTIONAL_CHAINING = '?.',

  // Punctuation
  SEMICOLON = ';',
  COMMA = ',',
  QUESTION = '?',
  COLON = ':',

  // Brackets
  LEFT_PAREN = '(',
  RIGHT_PAREN = ')',
  LEFT_BRACE = '{',
  RIGHT_BRACE = '}',
  LEFT_BRACKET = '[',
  RIGHT_BRACKET = ']',

  // Template Literals
  TEMPLATE_START = '`',
  TEMPLATE_MIDDLE = 'TEMPLATE_MIDDLE',
  TEMPLATE_END = 'TEMPLATE_END',
  DOLLAR_BRACE = '${',

  // Comments
  SINGLE_LINE_COMMENT = '//',
  MULTI_LINE_COMMENT = '/*',
  DOC_COMMENT = '/**',

  // Preprocessor
  INCLUDE = '#include',
  DEFINE = '#define',
  IFDEF = '#ifdef',
  IFNDEF = '#ifndef',
  ENDIF = '#endif',
  PRAGMA = '#pragma',

  // Special
  ELLIPSIS = '...',
  NEWLINE = 'NEWLINE',
  WHITESPACE = 'WHITESPACE'
}

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface Token {
  type: TokenType;
  value: string;
  start: SourcePosition;
  end: SourcePosition;
}

/**
 * Keywords organized by language origin for lexer implementation
 */
export const C_KEYWORDS = new Set([
  'auto',
  'break',
  'case',
  'char',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extern',
  'float',
  'for',
  'goto',
  'if',
  'inline',
  'int',
  'long',
  'register',
  'return',
  'short',
  'signed',
  'sizeof',
  'static',
  'struct',
  'switch',
  'typedef',
  'union',
  'unsigned',
  'void',
  'volatile',
  'while'
]);

export const CPP_KEYWORDS = new Set([
  'class',
  'private',
  'protected',
  'public',
  'virtual',
  'friend',
  'template',
  'typename',
  'namespace',
  'using',
  'operator',
  'new',
  'delete',
  'this',
  'throw',
  'try',
  'catch',
  'explicit',
  'mutable',
  'override',
  'final',
  'nullptr',
  'static_assert',
  'const_cast',
  'dynamic_cast',
  'reinterpret_cast',
  'static_cast',
  'typeid'
]);

export const TYPESCRIPT_KEYWORDS = new Set([
  'abstract',
  'any',
  'as',
  'async',
  'await',
  'boolean',
  'declare',
  'extends',
  'function',
  'implements',
  'import',
  'interface',
  'is',
  'keyof',
  'let',
  'module',
  'never',
  'null',
  'number',
  'object',
  'of',
  'readonly',
  'require',
  'string',
  'symbol',
  'type',
  'typeof',
  'undefined',
  'unique',
  'unknown',
  'var',
  'yield',
  'bigint',
  'in',
  'instanceof'
]);

export const WORLDSRC_KEYWORDS = new Set([
  'vec2',
  'vec3',
  'vec4',
  'ivec2',
  'ivec3',
  'ivec4',
  'quat',
  'mat3',
  'mat4'
]);

export const BOOLEAN_LITERALS = new Set(['true', 'false']);

export const NULL_LITERALS = new Set(['null', 'nullptr', 'undefined']);

/**
 * Operator precedence for parser
 */
export const OPERATOR_PRECEDENCE: Record<string, number> = {
  '::': 18,
  '()': 17,
  '[]': 17,
  '.': 17,
  '->': 17,
  '?.': 17,
  '++_post': 16,
  '--_post': 16, // postfix
  '++_pre': 15,
  '--_pre': 15,
  '+_unary': 15,
  '-_unary': 15,
  '!': 15,
  '~': 15, // prefix
  sizeof: 15,
  new: 15,
  delete: 15,
  '*': 14,
  '/': 14,
  '%': 14, // multiplicative
  '+': 13,
  '-': 13, // additive
  '<<': 12,
  '>>': 12,
  '>>>': 12, // shift
  '<': 11,
  '<=': 11,
  '>': 11,
  '>=': 11, // relational
  instanceof: 11,
  in: 11,
  '==': 10,
  '!=': 10,
  '===': 10,
  '!==': 10, // equality
  '&': 9, // bitwise AND
  '^': 8, // bitwise XOR
  '|': 7, // bitwise OR
  '&&': 6, // logical AND
  '||': 5, // logical OR
  '?:': 4, // conditional
  '=': 3,
  '+=': 3,
  '-=': 3,
  '*=': 3,
  '/=': 3,
  '%=': 3, // assignment
  ',': 1 // comma
};

/**
 * Token utility functions
 */
export class TokenUtils {
  static isKeyword(value: string): boolean {
    return (
      C_KEYWORDS.has(value) ||
      CPP_KEYWORDS.has(value) ||
      TYPESCRIPT_KEYWORDS.has(value) ||
      WORLDSRC_KEYWORDS.has(value)
    );
  }

  static getKeywordType(value: string): TokenType | null {
    if (
      C_KEYWORDS.has(value) ||
      CPP_KEYWORDS.has(value) ||
      TYPESCRIPT_KEYWORDS.has(value) ||
      WORLDSRC_KEYWORDS.has(value)
    ) {
      return value as TokenType;
    }
    return null;
  }

  static isBooleanLiteral(value: string): boolean {
    return BOOLEAN_LITERALS.has(value);
  }

  static isNullLiteral(value: string): boolean {
    return NULL_LITERALS.has(value);
  }

  static isOperator(value: string): boolean {
    return value in OPERATOR_PRECEDENCE;
  }

  static getOperatorPrecedence(operator: string): number {
    return OPERATOR_PRECEDENCE[operator] || 0;
  }

  static createToken(
    type: TokenType,
    value: string,
    start: SourcePosition,
    end: SourcePosition
  ): Token {
    return { type, value, start, end };
  }

  static createPosition(line: number, column: number, offset: number): SourcePosition {
    return { line, column, offset };
  }
}
