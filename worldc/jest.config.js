/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         jest.config.js
           ---
           Jest configuration for WORLDC test suite.

           provides standard ts-jest setup for TypeScript
           testing with proper type definitions and test
           environment configuration.

*/

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  /* test file patterns */
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],

  /* TypeScript configuration */
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'node',
          strict: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },

  /* module resolution */
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  /* coverage configuration */
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],

  /* test environment */
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  /* output configuration */
  verbose: false,
  silent: false,

  /* performance */
  maxWorkers: '50%',

  /* additional Jest configuration */
  testTimeout: 30000,
};
