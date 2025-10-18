/*
   ===============================================================
   WORLDC LEXICAL ANALYZER
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import {
  TokenType,
  Token,
  SourcePosition,
  TokenUtils,
} from './tokens'; /* TOKEN DEFINITIONS */
import {
  globalErrorHandler,
  WorldCErrorHandler,
  ErrorType,
} from '../error/error-handler'; /* ERROR HANDLING */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         LexerOptions
	       ---
	       configuration interface for lexical analysis behavior.
	       controls how the lexer processes whitespace, comments,
	       and newlines during tokenization. strict mode enables
	       additional validation for production code.

*/

export interface LexerOptions {
  skipWhitespace?: boolean /* ignore whitespace tokens */;
  skipComments?: boolean /* ignore comment tokens */;
  preserveNewlines?: boolean /* keep newline tokens for formatting */;
  strict?: boolean /* enable strict validation mode */;
}

/*

         LexerError
	       ---
	       specialized error class for lexical analysis failures.
	       provides detailed position information and integrates
	       with the global error handling system for comprehensive
	       error reporting and debugging.

*/

export class LexerError extends Error {
  constructor(
    message: string,
    public position: SourcePosition,
    public source?: string
  ) {
    super(
      `Lexer error at line ${position.line}, column ${position.column}: ${message}`
    );
    this.name = 'LexerError';

    /* report to global error handler for centralized logging */
    globalErrorHandler.reportLexicalError(message, {
      line: position.line,
      column: position.column,
      file: source,
    });
  }
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         Lexer
	       ---
	       comprehensive lexical analyzer for the WORLDC language.
	       tokenizes source code supporting C, C++, and TypeScript
	       syntax elements in a unified hybrid language.

	       the lexer processes input character by character,
	       identifying keywords, operators, literals, and
	       identifiers. it maintains position tracking for
	       detailed error reporting and supports configurable
	       processing modes through LexerOptions.

*/

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private options: Required<LexerOptions>;
  private tokens: Token[] = [];
  private current: number = 0;
  private errorHandler: WorldCErrorHandler;

  constructor(input: string, options: LexerOptions = {}) {
    this.input = input;
    this.errorHandler = globalErrorHandler;
    this.options = {
      skipWhitespace: options.skipWhitespace ?? true,
      skipComments: options.skipComments ?? true,
      preserveNewlines: options.preserveNewlines ?? false,
      strict: options.strict ?? false,
    };
  }

  /**
   * Tokenize the entire input
   */
  public tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.current = 0;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  /**
   * Get next token without consuming it
   */
  public peek(): Token {
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF
    }
    return this.tokens[this.current];
  }

  /**
   * Get next token and consume it
   */
  public nextToken(): Token {
    const token = this.peek();
    if (this.current < this.tokens.length - 1) {
      this.current++;
    }
    return token;
  }

  /**
   * Check if we've reached the end of input
   */
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  /**
   * Get current character
   */
  private peek_char(): string {
    if (this.isAtEnd()) return '\0';
    return this.input[this.position];
  }

  /**
   * Get next character
   */
  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input[this.position + 1];
  }

  /**
   * Consume and return current character
   */
  private advance(): string {
    const char = this.peek_char();
    this.position++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  /**
   * Check if current character matches expected
   */
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.peek_char() !== expected) return false;
    this.advance();
    return true;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    const start = this.getCurrentPosition();
    const char = this.advance();

    switch (char) {
      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        if (!this.options.skipWhitespace) {
          this.addToken(TokenType.WHITESPACE, char);
        }
        break;

      case '\n':
        if (this.options.preserveNewlines) {
          this.addToken(TokenType.NEWLINE, char);
        }
        break;

      // Single character tokens
      case '(':
        this.addToken(TokenType.LEFT_PAREN, char);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN, char);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE, char);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE, char);
        break;
      case '[':
        this.addToken(TokenType.LEFT_BRACKET, char);
        break;
      case ']':
        this.addToken(TokenType.RIGHT_BRACKET, char);
        break;
      case ',':
        this.addToken(TokenType.COMMA, char);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON, char);
        break;
      case '~':
        this.addToken(TokenType.BIT_NOT, char);
        break;
      case '^':
        this.addToken(TokenType.BIT_XOR, char);
        break;

      // Operators that can be compound
      case '+':
        if (this.match('+')) {
          this.addToken(TokenType.INCREMENT, '++');
        } else if (this.match('=')) {
          this.addToken(TokenType.PLUS_ASSIGN, '+=');
        } else {
          this.addToken(TokenType.PLUS, char);
        }
        break;

      case '-':
        if (this.match('-')) {
          this.addToken(TokenType.DECREMENT, '--');
        } else if (this.match('=')) {
          this.addToken(TokenType.MINUS_ASSIGN, '-=');
        } else if (this.match('>')) {
          this.addToken(TokenType.ARROW, '->');
        } else {
          this.addToken(TokenType.MINUS, char);
        }
        break;

      case '*':
        if (this.match('=')) {
          this.addToken(TokenType.MULTIPLY_ASSIGN, '*=');
        } else {
          this.addToken(TokenType.MULTIPLY, char);
        }
        break;

      case '/':
        if (this.match('/')) {
          this.scanSingleLineComment();
        } else if (this.match('*')) {
          this.scanMultiLineComment();
        } else if (this.match('=')) {
          this.addToken(TokenType.DIVIDE_ASSIGN, '/=');
        } else {
          this.addToken(TokenType.DIVIDE, char);
        }
        break;

      case '%':
        if (this.match('=')) {
          this.addToken(TokenType.MODULO_ASSIGN, '%=');
        } else {
          this.addToken(TokenType.MODULO, char);
        }
        break;

      case '=':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.STRICT_EQUAL, '===');
          } else {
            this.addToken(TokenType.EQUAL, '==');
          }
        } else {
          this.addToken(TokenType.ASSIGN, char);
        }
        break;

      case '!':
        if (this.match('=')) {
          if (this.match('=')) {
            this.addToken(TokenType.STRICT_NOT_EQUAL, '!==');
          } else {
            this.addToken(TokenType.NOT_EQUAL, '!=');
          }
        } else {
          this.addToken(TokenType.NOT, char);
        }
        break;

      case '<':
        if (this.match('<')) {
          this.addToken(TokenType.LEFT_SHIFT, '<<');
        } else if (this.match('=')) {
          this.addToken(TokenType.LESS_EQUAL, '<=');
        } else {
          this.addToken(TokenType.LESS_THAN, char);
        }
        break;

      case '>':
        if (this.match('>')) {
          if (this.match('>')) {
            this.addToken(TokenType.UNSIGNED_RIGHT_SHIFT, '>>>');
          } else {
            this.addToken(TokenType.RIGHT_SHIFT, '>>');
          }
        } else if (this.match('=')) {
          this.addToken(TokenType.GREATER_EQUAL, '>=');
        } else {
          this.addToken(TokenType.GREATER_THAN, char);
        }
        break;

      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AND, '&&');
        } else {
          this.addToken(TokenType.BIT_AND, char);
        }
        break;

      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.OR, '||');
        } else {
          this.addToken(TokenType.BIT_OR, char);
        }
        break;

      case ':':
        if (this.match(':')) {
          this.addToken(TokenType.SCOPE, '::');
        } else {
          this.addToken(TokenType.COLON, char);
        }
        break;

      case '?':
        if (this.match('.')) {
          this.addToken(TokenType.OPTIONAL_CHAINING, '?.');
        } else {
          this.addToken(TokenType.QUESTION, char);
        }
        break;

      case '.':
        if (this.match('.')) {
          if (this.match('.')) {
            this.addToken(TokenType.ELLIPSIS, '...');
          } else {
            this.throwError('Invalid token ".."');
          }
        } else if (this.isDigit(this.peek_char())) {
          this.position--; // Back up to scan as number
          this.column--;
          this.scanNumber();
        } else {
          this.addToken(TokenType.DOT, char);
        }
        break;

      case '#':
        this.scanPreprocessor();
        break;

      case '"':
      case "'":
        this.scanString(char);
        break;

      case '`':
        this.scanTemplateString();
        break;

      default:
        if (this.isDigit(char)) {
          this.position--; // Back up to scan full number
          this.column--;
          this.scanNumber();
        } else if (this.isAlpha(char)) {
          this.position--; // Back up to scan full identifier
          this.column--;
          this.scanIdentifier();
        } else {
          this.throwError(`Unexpected character: ${char}`);
        }
        break;
    }
  }

  /**
   * Scan single line comment
   */
  private scanSingleLineComment(): void {
    const start = this.getCurrentPosition();
    let value = '//';

    while (this.peek_char() !== '\n' && !this.isAtEnd()) {
      value += this.advance();
    }

    if (!this.options.skipComments) {
      this.addToken(TokenType.SINGLE_LINE_COMMENT, value);
    }
  }

  /**
   * Scan multi-line comment
   */
  private scanMultiLineComment(): void {
    const start = this.getCurrentPosition();
    let value = '/*';
    let isDocComment = false;

    if (this.peek_char() === '*') {
      isDocComment = true;
      value += this.advance();
    }

    while (!this.isAtEnd()) {
      if (this.peek_char() === '*' && this.peekNext() === '/') {
        value += this.advance(); // *
        value += this.advance(); // /
        break;
      }
      value += this.advance();
    }

    if (!this.options.skipComments) {
      const tokenType = isDocComment
        ? TokenType.DOC_COMMENT
        : TokenType.MULTI_LINE_COMMENT;
      this.addToken(tokenType, value);
    }
  }

  /**
   * Scan preprocessor directive
   */
  private scanPreprocessor(): void {
    let value = '#';

    while (this.isAlpha(this.peek_char())) {
      value += this.advance();
    }

    const directive = value.toLowerCase();
    switch (directive) {
      case '#include':
        this.addToken(TokenType.INCLUDE, value);
        break;
      case '#define':
        this.addToken(TokenType.DEFINE, value);
        break;
      case '#ifdef':
        this.addToken(TokenType.IFDEF, value);
        break;
      case '#ifndef':
        this.addToken(TokenType.IFNDEF, value);
        break;
      case '#endif':
        this.addToken(TokenType.ENDIF, value);
        break;
      case '#pragma':
        this.addToken(TokenType.PRAGMA, value);
        break;
      default:
        this.throwError(`Unknown preprocessor directive: ${directive}`);
    }
  }

  /**
   * Scan string literal
   */
  private scanString(quote: string): void {
    let value = quote;
    let escaped = false;

    while (!this.isAtEnd()) {
      const char = this.peek_char();

      if (escaped) {
        value += this.advance();
        escaped = false;
      } else if (char === '\\') {
        value += this.advance();
        escaped = true;
      } else if (char === quote) {
        value += this.advance();
        break;
      } else {
        value += this.advance();
      }
    }

    if (quote === '"') {
      this.addToken(TokenType.STRING_LITERAL, value);
    } else {
      this.addToken(TokenType.CHAR_LITERAL, value);
    }
  }

  /**
   * Scan template string (backtick strings)
   */
  private scanTemplateString(): void {
    let value = '`';

    while (!this.isAtEnd()) {
      const char = this.peek_char();

      if (char === '`') {
        value += this.advance();
        this.addToken(TokenType.STRING_LITERAL, value);
        return;
      } else if (char === '$' && this.peekNext() === '{') {
        // Template interpolation
        this.addToken(TokenType.TEMPLATE_START, value);
        this.advance(); // $
        this.advance(); // {
        this.addToken(TokenType.DOLLAR_BRACE, '${');
        return;
      } else {
        value += this.advance();
      }
    }

    this.throwError('Unterminated template string');
  }

  /**
   * Scan number literal
   */
  private scanNumber(): void {
    let value = '';
    let isFloat = false;

    // Handle hex, binary, octal prefixes
    if (this.peek_char() === '0') {
      value += this.advance();
      if (this.peek_char() === 'x' || this.peek_char() === 'X') {
        value += this.advance();
        this.scanHexNumber(value);
        return;
      } else if (this.peek_char() === 'b' || this.peek_char() === 'B') {
        value += this.advance();
        this.scanBinaryNumber(value);
        return;
      }
    }

    // Scan integer part
    while (this.isDigit(this.peek_char())) {
      value += this.advance();
    }

    // Look for decimal point
    if (this.peek_char() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      value += this.advance(); // .

      while (this.isDigit(this.peek_char())) {
        value += this.advance();
      }
    }

    // Look for exponent
    if (this.peek_char() === 'e' || this.peek_char() === 'E') {
      isFloat = true;
      value += this.advance();

      if (this.peek_char() === '+' || this.peek_char() === '-') {
        value += this.advance();
      }

      while (this.isDigit(this.peek_char())) {
        value += this.advance();
      }
    }

    // Check for float suffix
    if (this.peek_char() === 'f' || this.peek_char() === 'F') {
      isFloat = true;
      value += this.advance();
    }

    const tokenType = isFloat
      ? TokenType.FLOAT_LITERAL
      : TokenType.INTEGER_LITERAL;
    this.addToken(tokenType, value);
  }

  /**
   * Scan hexadecimal number
   */
  private scanHexNumber(prefix: string): void {
    let value = prefix;

    while (this.isHexDigit(this.peek_char())) {
      value += this.advance();
    }

    this.addToken(TokenType.INTEGER_LITERAL, value);
  }

  /**
   * Scan binary number
   */
  private scanBinaryNumber(prefix: string): void {
    let value = prefix;

    while (this.peek_char() === '0' || this.peek_char() === '1') {
      value += this.advance();
    }

    this.addToken(TokenType.INTEGER_LITERAL, value);
  }

  /**
   * Scan identifier or keyword
   */
  private scanIdentifier(): void {
    let value = '';

    while (this.isAlphaNumeric(this.peek_char())) {
      value += this.advance();
    }

    // Check if it's a keyword
    const keywordType = TokenUtils.getKeywordType(value);
    if (keywordType) {
      this.addToken(keywordType, value);
    } else if (TokenUtils.isBooleanLiteral(value)) {
      this.addToken(TokenType.BOOLEAN_LITERAL, value);
    } else {
      this.addToken(TokenType.IDENTIFIER, value);
    }
  }

  /**
   * Helper methods
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return (
      this.isDigit(char) ||
      (char >= 'a' && char <= 'f') ||
      (char >= 'A' && char <= 'F')
    );
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_' ||
      char === '$'
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  /**
   * Add token to list
   */
  private addToken(type: TokenType, value: string): void {
    const start = TokenUtils.createPosition(
      this.line,
      this.column - value.length,
      this.position - value.length
    );
    const end = this.getCurrentPosition();

    this.tokens.push(TokenUtils.createToken(type, value, start, end));
  }

  /**
   * Get current position
   */
  private getCurrentPosition(): SourcePosition {
    return TokenUtils.createPosition(this.line, this.column, this.position);
  }

  /**
   * Throw lexer error
   */
  private throwError(message: string): never {
    throw new LexerError(message, this.getCurrentPosition(), this.input);
  }
}
