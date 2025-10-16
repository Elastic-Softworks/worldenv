/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         setup.ts
           ---
           test setup utilities for WORLDC test suite.

           provides mock objects and utilities for testing
           without relying on Jest globals or complex
           setup configurations.

*/

/// <reference types="jest" />
/// <reference types="node" />

/*

         Mock WORLDC Components
           ---
           lightweight mocks for WORLDC compiler components.

*/

/* mock WORLDC compiler for tests that don't need real compilation */
export const mockWorldCCompiler = {
  compile: () =>
    Promise.resolve({
      success: true,
      output: 'mock-compiled-output',
      errors: [],
      warnings: [],
    }),

  validate: () => ({
    valid: true,
    errors: [],
  }),

  generateAST: () => ({
    type: 'Program',
    body: [],
  }),
};

/* mock file system for tests that don't need real files */
export const mockFileSystem = {
  readFile: () => Promise.resolve('mock file content'),
  writeFile: () => Promise.resolve(undefined),
  exists: () => true,
  stat: () => Promise.resolve({ isFile: () => true }),
};

/* mock error handler for testing */
export const mockErrorHandler = {
  clear: () => {},
  hasErrors: () => false,
  reportLexicalError: (message: string, location?: any) => {},
  reportSyntaxError: (message: string, location?: any) => {},
  getErrorCount: () => 0,
  getWarningCount: () => 0,
};

/*

         Test Utilities
           ---
           helper functions for common test operations.

*/

/* create mock token for testing */
export function createMockToken(type: string, value: any) {
  return {
    type,
    value,
    line: 1,
    column: 1,
  };
}

/* create mock AST node for testing */
export function createMockAST(type: string = 'Program') {
  return {
    type,
    body: [],
    declarations: [
      {
        constructor: { name: 'FunctionDeclaration' },
        type: 'FunctionDeclaration',
        name: 'mockFunction',
      },
    ],
  };
}

/* timing utility for performance tests */
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/* memory usage utility for testing */
export function getCurrentMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

/* export default configuration */
export default {
  mockWorldCCompiler,
  mockFileSystem,
  mockErrorHandler,
  createMockToken,
  createMockAST,
  measureTime,
  getCurrentMemoryUsage,
};
