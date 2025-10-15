/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDSRC Error Handling System
 *
 * Comprehensive error handling for lexical analysis, parsing, and compilation.
 * Provides detailed error reporting, recovery mechanisms, and logging capabilities.
 */

export enum ErrorType {
  LEXICAL_ERROR = 'LEXICAL_ERROR',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  SEMANTIC_ERROR = 'SEMANTIC_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  FATAL = 'FATAL'
}

export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
  length?: number;
}

export interface WorldSrcError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  location?: SourceLocation;
  code?: string;
  suggestion?: string;
  stack?: string;
  timestamp: Date;
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  PANIC_MODE = 'PANIC_MODE' /* Skip tokens until synchronization point */,
  PHRASE_LEVEL = 'PHRASE_LEVEL' /* Insert/delete tokens to continue */,
  ERROR_PRODUCTION = 'ERROR_PRODUCTION' /* Use grammar rules for common errors */,
  GLOBAL_CORRECTION = 'GLOBAL_CORRECTION' /* Minimal changes to make valid */
}

/**
 * WORLDSRC Error Handler
 *
 * Central error handling system for all WORLDSRC language processing.
 * Handles error reporting, recovery, logging, and user feedback.
 */
export class WorldSrcErrorHandler {
  private errors: WorldSrcError[] = [];
  private warnings: WorldSrcError[] = [];
  private maxErrors = 50; /* Limit error count to prevent spam */
  private errorCount = 0;
  private warningCount = 0;
  private fatalError = false;
  private logToFile = true;
  private logToConsole = true;

  /**
   * Report a lexical error
   */
  public reportLexicalError(message: string, location?: SourceLocation, suggestion?: string): void {
    this.reportError({
      type: ErrorType.LEXICAL_ERROR,
      severity: ErrorSeverity.ERROR,
      message,
      location,
      suggestion,
      timestamp: new Date()
    });
  }

  /**
   * Report a syntax error
   */
  public reportSyntaxError(message: string, location?: SourceLocation, suggestion?: string): void {
    this.reportError({
      type: ErrorType.SYNTAX_ERROR,
      severity: ErrorSeverity.ERROR,
      message,
      location,
      suggestion,
      timestamp: new Date()
    });
  }

  /**
   * Report a semantic error
   */
  public reportSemanticError(
    message: string,
    location?: SourceLocation,
    suggestion?: string
  ): void {
    this.reportError({
      type: ErrorType.SEMANTIC_ERROR,
      severity: ErrorSeverity.ERROR,
      message,
      location,
      suggestion,
      timestamp: new Date()
    });
  }

  /**
   * Report a type error
   */
  public reportTypeError(message: string, location?: SourceLocation, suggestion?: string): void {
    this.reportError({
      type: ErrorType.TYPE_ERROR,
      severity: ErrorSeverity.ERROR,
      message,
      location,
      suggestion,
      timestamp: new Date()
    });
  }

  /**
   * Report a warning
   */
  public reportWarning(message: string, location?: SourceLocation, suggestion?: string): void {
    this.reportError({
      type: ErrorType.COMPILATION_ERROR,
      severity: ErrorSeverity.WARNING,
      message,
      location,
      suggestion,
      timestamp: new Date()
    });
  }

  /**
   * Report a fatal error
   */
  public reportFatalError(message: string, location?: SourceLocation, error?: Error): void {
    this.fatalError = true;

    this.reportError({
      type: ErrorType.FATAL,
      severity: ErrorSeverity.FATAL,
      message,
      location,
      stack: error?.stack,
      timestamp: new Date()
    });
  }

  /**
   * Report an internal compiler error
   */
  public reportInternalError(message: string, error?: Error, location?: SourceLocation): void {
    this.reportError({
      type: ErrorType.INTERNAL_ERROR,
      severity: ErrorSeverity.FATAL,
      message: `Internal compiler error: ${message}`,
      location,
      stack: error?.stack,
      timestamp: new Date()
    });

    this.fatalError = true;
  }

  /**
   * Core error reporting function
   */
  private reportError(error: WorldSrcError): void {
    /* Check if we've exceeded error limit */
    if (this.errorCount >= this.maxErrors) {
      if (this.errorCount === this.maxErrors) {
        const limitError: WorldSrcError = {
          type: ErrorType.COMPILATION_ERROR,
          severity: ErrorSeverity.FATAL,
          message: `Too many errors (${this.maxErrors}). Compilation stopped.`,
          timestamp: new Date()
        };
        this.errors.push(limitError);
        this.logError(limitError);
      }
      return;
    }

    /* Categorize by severity */
    if (error.severity === ErrorSeverity.WARNING) {
      this.warnings.push(error);
      this.warningCount++;
    } else {
      this.errors.push(error);
      this.errorCount++;
    }

    /* Log the error */
    this.logError(error);

    /* Stop compilation on fatal errors */
    if (error.severity === ErrorSeverity.FATAL) {
      this.fatalError = true;
    }
  }

  /**
   * Log error to console and/or file
   */
  private logError(error: WorldSrcError): void {
    const formattedError = this.formatError(error);

    if (this.logToConsole) {
      const colorCode = this.getErrorColor(error.severity);
      console.error(`${colorCode}${formattedError}\x1b[0m`);
    }

    if (this.logToFile) {
      this.writeToLogFile(formattedError);
    }
  }

  /**
   * Format error message for display
   */
  private formatError(error: WorldSrcError): string {
    let formatted = '';

    /* Add timestamp */
    const timeStr = error.timestamp.toISOString();
    formatted += `[${timeStr}] `;

    /* Add severity and type */
    formatted += `${error.severity}:${error.type}: `;

    /* Add location if available */
    if (error.location) {
      const loc = error.location;
      if (loc.file) {
        formatted += `${loc.file}:`;
      }
      formatted += `${loc.line}:${loc.column}: `;
    }

    /* Add message */
    formatted += error.message;

    /* Add suggestion if available */
    if (error.suggestion) {
      formatted += `\n  Suggestion: ${error.suggestion}`;
    }

    /* Add stack trace for internal errors */
    if (error.stack && error.type === ErrorType.INTERNAL_ERROR) {
      formatted += `\n  Stack trace:\n${error.stack}`;
    }

    return formatted;
  }

  /**
   * Get ANSI color code for error severity
   */
  private getErrorColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.INFO:
        return '\x1b[36m'; /* Cyan */
      case ErrorSeverity.WARNING:
        return '\x1b[33m'; /* Yellow */
      case ErrorSeverity.ERROR:
        return '\x1b[31m'; /* Red */
      case ErrorSeverity.FATAL:
        return '\x1b[91m'; /* Bright Red */
      default:
        return '\x1b[0m'; /* Reset */
    }
  }

  /**
   * Write error to log file
   */
  private writeToLogFile(errorMessage: string): void {
    /* In browser environment, store in localStorage */
    if (typeof window !== 'undefined') {
      try {
        const logKey = 'worldsrc-error-log';
        const existingLog = localStorage.getItem(logKey) || '';
        const newLog = existingLog + errorMessage + '\n';

        /* Keep only last 1000 lines to prevent storage overflow */
        const lines = newLog.split('\n');
        if (lines.length > 1000) {
          lines.splice(0, lines.length - 1000);
        }

        localStorage.setItem(logKey, lines.join('\n'));
      } catch (e) {
        /* Ignore localStorage errors */
      }
    }

    /* In Node.js environment, write to file */
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'worldsrc-errors.log');

        fs.appendFileSync(logPath, errorMessage + '\n', 'utf8');
      } catch (e) {
        /* Ignore file system errors */
      }
    }
  }

  /**
   * Clear all errors and warnings
   */
  public clear(): void {
    this.errors = [];
    this.warnings = [];
    this.errorCount = 0;
    this.warningCount = 0;
    this.fatalError = false;
  }

  /**
   * Get all errors
   */
  public getErrors(): WorldSrcError[] {
    return [...this.errors];
  }

  /**
   * Get all warnings
   */
  public getWarnings(): WorldSrcError[] {
    return [...this.warnings];
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errorCount > 0;
  }

  /**
   * Check if there are any warnings
   */
  public hasWarnings(): boolean {
    return this.warningCount > 0;
  }

  /**
   * Check if a fatal error occurred
   */
  public hasFatalError(): boolean {
    return this.fatalError;
  }

  /**
   * Get error count
   */
  public getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this.warningCount;
  }

  /**
   * Set configuration options
   */
  public configure(options: {
    maxErrors?: number;
    logToFile?: boolean;
    logToConsole?: boolean;
  }): void {
    if (options.maxErrors !== undefined) {
      this.maxErrors = options.maxErrors;
    }

    if (options.logToFile !== undefined) {
      this.logToFile = options.logToFile;
    }

    if (options.logToConsole !== undefined) {
      this.logToConsole = options.logToConsole;
    }
  }

  /**
   * Generate error summary report
   */
  public generateReport(): string {
    let report = '';

    report += '================================================================================\n';
    report += 'WORLDSRC COMPILATION REPORT\n';
    report += '================================================================================\n';

    report += `Errors: ${this.errorCount}\n`;
    report += `Warnings: ${this.warningCount}\n`;

    if (this.fatalError) {
      report += 'Status: FATAL ERROR - Compilation failed\n';
    } else if (this.errorCount > 0) {
      report += 'Status: FAILED - Compilation completed with errors\n';
    } else if (this.warningCount > 0) {
      report += 'Status: SUCCESS - Compilation completed with warnings\n';
    } else {
      report += 'Status: SUCCESS - Clean compilation\n';
    }

    report += '================================================================================\n';

    if (this.errors.length > 0) {
      report += '\nERRORS:\n';
      for (const error of this.errors) {
        report += this.formatError(error) + '\n';
      }
    }

    if (this.warnings.length > 0) {
      report += '\nWARNINGS:\n';
      for (const warning of this.warnings) {
        report += this.formatError(warning) + '\n';
      }
    }

    return report;
  }

  /**
   * Parse error recovery - attempt to synchronize parser state
   */
  public recoverFromSyntaxError(strategy: RecoveryStrategy, context: string): void {
    switch (strategy) {
      case RecoveryStrategy.PANIC_MODE:
        this.reportWarning(
          `Parser recovered using panic mode at ${context}`,
          undefined,
          'Check for missing semicolons, braces, or parentheses'
        );
        break;

      case RecoveryStrategy.PHRASE_LEVEL:
        this.reportWarning(
          `Parser recovered using phrase-level recovery at ${context}`,
          undefined,
          'Check for syntax errors in the surrounding code'
        );
        break;

      case RecoveryStrategy.ERROR_PRODUCTION:
        this.reportWarning(
          `Parser recovered using error production at ${context}`,
          undefined,
          'Check for common syntax mistakes'
        );
        break;

      case RecoveryStrategy.GLOBAL_CORRECTION:
        this.reportWarning(
          `Parser recovered using global correction at ${context}`,
          undefined,
          'Multiple syntax errors were corrected'
        );
        break;
    }
  }

  /**
   * Create error location from line/column
   */
  public static createLocation(
    line: number,
    column: number,
    file?: string,
    length?: number
  ): SourceLocation {
    return {
      line,
      column,
      file,
      length
    };
  }

  /**
   * Export error log to string
   */
  public exportLog(): string {
    let log = '';

    log += 'WORLDSRC Error Log\n';
    log += `Generated: ${new Date().toISOString()}\n`;
    log += '================================================================================\n\n';

    const allIssues = [...this.errors, ...this.warnings].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const issue of allIssues) {
      log += this.formatError(issue) + '\n\n';
    }

    return log;
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new WorldSrcErrorHandler();

/**
 * Utility function to create and throw WORLDSRC errors
 */
export function throwWorldSrcError(
  type: ErrorType,
  message: string,
  location?: SourceLocation
): never {
  const error = {
    type,
    severity: ErrorSeverity.ERROR,
    message,
    location,
    timestamp: new Date()
  };

  if (type === ErrorType.LEXICAL_ERROR) {
    globalErrorHandler.reportLexicalError(message, location);
  } else if (type === ErrorType.SYNTAX_ERROR) {
    globalErrorHandler.reportSyntaxError(message, location);
  } else if (type === ErrorType.SEMANTIC_ERROR) {
    globalErrorHandler.reportSemanticError(message, location);
  } else if (type === ErrorType.TYPE_ERROR) {
    globalErrorHandler.reportTypeError(message, location);
  } else {
    globalErrorHandler.reportWarning(message, location);
  }

  throw new Error(`${type}: ${message}`);
}

/**
 * Utility function for safe error handling
 */
export function handleError<T>(
  operation: () => T,
  errorMessage: string,
  location?: SourceLocation
): T | null {
  try {
    return operation();
  } catch (error) {
    globalErrorHandler.reportInternalError(
      `${errorMessage}: ${(error as Error).message}`,
      error as Error,
      location
    );
    return null;
  }
}
