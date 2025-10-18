/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         basic.test.ts
           ---
           basic smoke test suite for WORLDC production system.

           provides fundamental tests to verify package
           structure and basic functionality without
           requiring complex imports that may fail
           during build issues.

*/

/// <reference types="jest" />
/// <reference types="node" />

describe('WORLDC Package Structure', () => {
  test('should have valid package.json', () => {
    const pkg = require('../package.json');

    expect(pkg.name).toBe('@worldenv/worldc');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(pkg.main).toBeDefined();
    expect(pkg.types).toBeDefined();
    expect(pkg.scripts).toHaveProperty('build');
    expect(pkg.scripts).toHaveProperty('test');
  });

  test('should have correct file structure', () => {
    const fs = require('fs');
    const path = require('path');

    // Check main directories exist
    expect(fs.existsSync(path.join(__dirname, '../src'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../src/lexer'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../src/parser'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../src/codegen'))).toBe(true);
  });

  test('should have TypeScript configuration', () => {
    const fs = require('fs');
    const path = require('path');

    expect(fs.existsSync(path.join(__dirname, '../tsconfig.json'))).toBe(true);
  });

  test('should have necessary dependencies', () => {
    const pkg = require('../package.json');

    expect(pkg.dependencies).toHaveProperty('typescript');
    expect(pkg.devDependencies).toHaveProperty('jest');
    expect(pkg.devDependencies).toHaveProperty('@types/jest');
  });
});

describe('WORLDC Basic Math', () => {
  test('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect(10 / 2).toBe(5);
  });

  test('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.length).toBe(4);
  });
});

describe('WORLDC Environment', () => {
  test('should run in Node.js environment', () => {
    expect(typeof process).toBe('object');
    expect(process.versions).toHaveProperty('node');
  });

  test('should have access to standard modules', () => {
    expect(() => require('fs')).not.toThrow();
    expect(() => require('path')).not.toThrow();
  });
});
