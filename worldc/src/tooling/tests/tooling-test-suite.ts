/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             --- WORLDSRC TOOLING TEST SUITE ---
	====================================================================
*/

/*

         tooling-test-suite.ts
	       ---
	       this file implements comprehensive tests for the WORLDSRC
	       tooling system including language server, debugging,
	       real-time compilation, and IDE integration components.

	       the test suite validates functionality, performance,
	       and integration scenarios to ensure robust operation
	       across different development environments.

*/

import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

import {
  WorldSrcTooling,
  ToolingConfiguration,
  ToolingFeature,
  ConnectionType,
  createDefaultConfiguration,
  createMinimalConfiguration,
} from '../index';

import { WorldSrcLanguageServer } from '../lsp/language-server';
import { WorldSrcDebugAdapter } from '../debugging/debug-protocol';
import { RealtimeCompiler } from '../realtime/realtime-compiler';
import { IDEIntegrationManager } from '../ide/ide-integration';

/*
	====================================================================
             --- TEST FRAMEWORK ---
	====================================================================
*/

class TestRunner {
  private tests: TestCase[];
  private results: TestResult[];
  private setupTasks: (() => Promise<void>)[];
  private cleanupTasks: (() => Promise<void>)[];

  constructor() {
    this.tests = [];
    this.results = [];
    this.setupTasks = [];
    this.cleanupTasks = [];
  }

  /*

           addTest()
  	       ---
  	       adds a test case to the test suite with description
  	       and async test function.

  */

  addTest(
    name: string,
    description: string,
    testFn: () => Promise<void>
  ): void {
    this.tests.push({
      name,
      description,
      testFn,
      timeout: 30000 /* 30 second timeout */,
    });
  }

  /*

           addSetup()
  	       ---
  	       adds a setup task to run before all tests.

  */

  addSetup(setupFn: () => Promise<void>): void {
    this.setupTasks.push(setupFn);
  }

  /*

           addCleanup()
  	       ---
  	       adds a cleanup task to run after all tests.

  */

  addCleanup(cleanupFn: () => Promise<void>): void {
    this.cleanupTasks.push(cleanupFn);
  }

  /*

           run()
  	       ---
  	       executes all tests and returns comprehensive results.

  */

  async run(): Promise<TestSuiteResult> {
    const startTime = Date.now();

    console.log('\nStarting WORLDC Tooling Test Suite...\n');

    /* run setup tasks */
    for (const setup of this.setupTasks) {
      await setup();
    }

    /* run all tests */
    for (const test of this.tests) {
      const result = await this.runSingleTest(test);
      this.results.push(result);

      this.printTestResult(result);
    }

    /* run cleanup tasks */
    for (const cleanup of this.cleanupTasks) {
      try {
        await cleanup();
      } catch (error) {
        console.warn(`Cleanup failed: ${error.message}`);
      }
    }

    const endTime = Date.now();
    const summary = this.generateSummary(startTime, endTime);

    this.printSummary(summary);

    return summary;
  }

  /*

           runSingleTest()
  	       ---
  	       executes a single test case with timeout and
  	       error handling.

  */

  private async runSingleTest(test: TestCase): Promise<TestResult> {
    const result: TestResult = {
      name: test.name,
      description: test.description,
      success: false,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      error: null,
      output: [],
    };

    try {
      /* run test with timeout */
      await Promise.race([
        test.testFn(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Test timed out after ${test.timeout}ms`));
          }, test.timeout);
        }),
      ]);

      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;

    return result;
  }

  private printTestResult(result: TestResult): void {
    const status = result.success ? 'PASS' : 'FAIL';
    const time = `${result.duration}ms`;

    console.log(`${status} ${result.name} (${time})`);

    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  private generateSummary(startTime: number, endTime: number): TestSuiteResult {
    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    return {
      totalTests: this.results.length,
      passed: passed,
      failed: failed,
      successRate: passed / this.results.length,
      totalTime: endTime - startTime,
      results: this.results,
    };
  }

  private printSummary(summary: TestSuiteResult): void {
    console.log('\nTest Summary:');
    console.log(`   Total:   ${summary.totalTests}`);
    console.log(`   Passed:  ${summary.passed}`);
    console.log(`   Failed:  ${summary.failed}`);
    console.log(`   Rate:    ${(summary.successRate * 100).toFixed(1)}%`);
    console.log(`   Time:    ${summary.totalTime}ms`);

    if (summary.failed > 0) {
      console.log('\nFailed Tests:');
      for (const result of summary.results) {
        if (!result.success) {
          console.log(`   - ${result.name}: ${result.error}`);
        }
      }
    }

    console.log('');
  }
}

/*
	====================================================================
             --- TEST UTILITIES ---
	====================================================================
*/

class TestEnvironment {
  public tempDir: string;
  public workspaceDir: string;
  public tooling: WorldSrcTooling | null;

  constructor() {
    this.tempDir = '';
    this.workspaceDir = '';
    this.tooling = null;
  }

  /*

           setup()
  	       ---
  	       creates temporary test environment with workspace
  	       and sample files.

  */

  async setup(): Promise<void> {
    /* create temporary directory */
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worldsrc-test-'));
    this.workspaceDir = path.join(this.tempDir, 'workspace');

    fs.mkdirSync(this.workspaceDir, { recursive: true });

    /* create sample WORLDSRC files */
    await this.createSampleFiles();

    /* create package.json */
    await this.createPackageJson();
  }

  /*

           cleanup()
  	       ---
  	       cleans up temporary test environment and stops
  	       running services.

  */

  async cleanup(): Promise<void> {
    if (this.tooling) {
      await this.tooling.shutdown();
      this.tooling = null;
    }

    if (this.tempDir && fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }

  /*

           createTooling()
  	       ---
  	       creates and initializes a WORLDSRC tooling instance
  	       for testing.

  */

  async createTooling(
    config?: Partial<ToolingConfiguration>
  ): Promise<WorldSrcTooling> {
    const defaultConfig = createDefaultConfiguration(this.workspaceDir);
    const finalConfig = { ...defaultConfig, ...config };

    this.tooling = new WorldSrcTooling(finalConfig);
    await this.tooling.initialize();

    return this.tooling;
  }

  private async createSampleFiles(): Promise<void> {
    /* sample WORLDSRC file */
    const sampleWorldSrc = `
// Sample WORLDSRC file for testing
#include <stdio.h>

class Player {
  private health: number = 100;

  public takeDamage(amount: number): void {
    this.health -= amount;
    printf("Player health: %d\\n", this.health);
  }
}

function main(): void {
  const player = new Player();
  player.takeDamage(25);
}
    `.trim();

    fs.writeFileSync(
      path.join(this.workspaceDir, 'main.worldsrc'),
      sampleWorldSrc
    );

    /* sample TypeScript file */
    const sampleTypeScript = `
export interface GameState {
  entities: Entity[];
  systems: System[];
}

export class Entity {
  id: number;
  components: Component[];
}
    `.trim();

    fs.writeFileSync(
      path.join(this.workspaceDir, 'types.ts'),
      sampleTypeScript
    );
  }

  private async createPackageJson(): Promise<void> {
    const packageJson = {
      name: 'worldsrc-test-project',
      version: '1.0.0',
      dependencies: {
        three: '^0.150.0',
        'pixi.js': '^7.0.0',
      },
      devDependencies: {
        typescript: '^4.9.0',
        assemblyscript: '^0.20.0',
      },
    };

    fs.writeFileSync(
      path.join(this.workspaceDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }
}

/*
	====================================================================
             --- MAIN TEST SUITE ---
	====================================================================
*/

export async function runToolingTests(): Promise<TestSuiteResult> {
  const runner = new TestRunner();
  const env = new TestEnvironment();

  /* setup and cleanup */
  runner.addSetup(async () => {
    await env.setup();
  });

  runner.addCleanup(async () => {
    await env.cleanup();
  });

  /*
	====================================================================
             --- CONFIGURATION TESTS ---
	====================================================================
  */

  runner.addTest('config-default', 'Create default configuration', async () => {
    const config = createDefaultConfiguration('/test/workspace');

    assert.equal(config.workspaceRoot, '/test/workspace');
    assert.equal(config.languageServer.enabled, true);
    assert.equal(config.debugging.enabled, true);
    assert.equal(config.realtimeCompiler.enabled, true);
    assert.equal(config.ideIntegration.enabled, true);
    assert(config.features.length > 0);
  });

  runner.addTest('config-minimal', 'Create minimal configuration', async () => {
    const config = createMinimalConfiguration('/test/workspace');

    assert.equal(config.workspaceRoot, '/test/workspace');
    assert.equal(config.languageServer.enabled, true);
    assert.equal(config.debugging.enabled, false);
    assert.equal(config.realtimeCompiler.enabled, true);
    assert.equal(config.ideIntegration.enabled, false);
    assert(config.features.length === 2);
  });

  /*
	====================================================================
             --- TOOLING INITIALIZATION TESTS ---
	====================================================================
  */

  runner.addTest(
    'tooling-init-default',
    'Initialize tooling with default configuration',
    async () => {
      const tooling = await env.createTooling();
      const status = tooling.getServiceStatus();

      assert.equal(status.initialized, true);
      assert(status.services.languageServer.running);
      assert(status.services.realtimeCompiler.running);
    }
  );

  runner.addTest(
    'tooling-init-minimal',
    'Initialize tooling with minimal configuration',
    async () => {
      const minimalConfig = createMinimalConfiguration(env.workspaceDir);
      const tooling = await env.createTooling(minimalConfig);
      const status = tooling.getServiceStatus();

      assert.equal(status.initialized, true);
      assert.equal(status.services.debugAdapter.running, false);
      assert.equal(status.services.ideIntegration.running, false);
    }
  );

  runner.addTest(
    'tooling-shutdown',
    'Shutdown tooling gracefully',
    async () => {
      const tooling = await env.createTooling();
      await tooling.shutdown();

      const status = tooling.getServiceStatus();
      assert.equal(status.initialized, false);
    }
  );

  /*
	====================================================================
             --- LANGUAGE SERVER TESTS ---
	====================================================================
  */

  runner.addTest(
    'lsp-initialize',
    'Language server initialization',
    async () => {
      const server = new WorldSrcLanguageServer();

      const initResult = await server.initialize({
        workspaceRoot: env.workspaceDir,
      });

      assert(initResult.capabilities);
      assert(initResult.capabilities.completionProvider);
      assert(initResult.capabilities.hoverProvider);
    }
  );

  runner.addTest(
    'lsp-document-open',
    'Language server document operations',
    async () => {
      const server = new WorldSrcLanguageServer();
      await server.initialize({ workspaceRoot: env.workspaceDir });

      const fileContent = fs.readFileSync(
        path.join(env.workspaceDir, 'main.worldsrc'),
        'utf8'
      );

      await server.textDocumentDidOpen({
        textDocument: {
          uri: `file://${path.join(env.workspaceDir, 'main.worldsrc')}`,
          text: fileContent,
          version: 1,
        },
      });

      /* test completion */
      const completions = await server.completion({
        textDocument: {
          uri: `file://${path.join(env.workspaceDir, 'main.worldsrc')}`,
        },
        position: { line: 5, character: 10 },
      });

      assert(Array.isArray(completions));
    }
  );

  /*
	====================================================================
             --- DEBUG ADAPTER TESTS ---
	====================================================================
  */

  runner.addTest(
    'debug-initialize',
    'Debug adapter initialization',
    async () => {
      const adapter = new WorldSrcDebugAdapter();

      const initRequest = {
        seq: 1,
        type: 'request' as const,
        command: 'initialize',
        arguments: {
          clientID: 'test-client',
          adapterID: 'worldsrc',
        },
      };

      const response = await adapter['session'].handleRequest(initRequest);

      assert.equal(response.success, true);
      assert(response.body);
      assert(response.body.supportsConfigurationDoneRequest);
    }
  );

  runner.addTest(
    'debug-breakpoints',
    'Debug adapter breakpoint handling',
    async () => {
      const adapter = new WorldSrcDebugAdapter();

      const breakpointRequest = {
        seq: 2,
        type: 'request' as const,
        command: 'setBreakpoints',
        arguments: {
          source: {
            name: 'main.worldsrc',
            path: path.join(env.workspaceDir, 'main.worldsrc'),
          },
          breakpoints: [{ line: 10, column: 0 }],
        },
      };

      const response =
        await adapter['session'].handleRequest(breakpointRequest);

      assert.equal(response.success, true);
      assert(response.body);
      assert(response.body.breakpoints);
      assert.equal(response.body.breakpoints.length, 1);
    }
  );

  /*
	====================================================================
             --- REAL-TIME COMPILER TESTS ---
	====================================================================
  */

  runner.addTest(
    'compiler-basic',
    'Real-time compiler basic compilation',
    async () => {
      const compiler = new RealtimeCompiler();

      const request = {
        sourceCode: 'function test(): void { console.log("test"); }',
        filePath: path.join(env.workspaceDir, 'test.worldsrc'),
        targets: ['typescript' as any],
        optimizationLevel: 'basic' as any,
        includeSourceMaps: false,
        watchMode: false,
      };

      const result = await compiler.compile(request);

      assert.equal(result.success, true);
      assert(result.generatedFiles.length > 0);
      assert(result.performance.totalTime > 0);
    }
  );

  runner.addTest(
    'compiler-watch-mode',
    'Real-time compiler watch mode',
    async () => {
      const compiler = new RealtimeCompiler();

      let compilationCount = 0;

      compiler.on('compilationComplete', () => {
        compilationCount++;
      });

      await compiler.startWatching(
        path.join(env.workspaceDir, 'main.worldsrc'),
        ['typescript' as any],
        'basic' as any
      );

      /* wait for initial compilation */
      await new Promise((resolve) => setTimeout(resolve, 500));

      assert(compilationCount >= 1);

      compiler.stopWatchingAll();
    }
  );

  /*
	====================================================================
             --- IDE INTEGRATION TESTS ---
	====================================================================
  */

  runner.addTest(
    'ide-workspace-init',
    'IDE integration workspace initialization',
    async () => {
      const ideManager = new IDEIntegrationManager(env.workspaceDir);
      await ideManager.initialize();

      const structure = ideManager['workspaceManager'].getProjectStructure();

      assert.equal(structure.root, env.workspaceDir);
      assert(structure.sourceFiles.length > 0);
      assert(structure.dependencies.length > 0);
    }
  );

  runner.addTest(
    'ide-editor-config',
    'IDE integration editor configuration generation',
    async () => {
      const ideManager = new IDEIntegrationManager(env.workspaceDir);
      await ideManager.initialize();

      const vscodeConfig = await ideManager.generateEditorConfig(
        'vscode' as any
      );

      assert(vscodeConfig.settings);
      assert(vscodeConfig.launch);
      assert(vscodeConfig.tasks);
      assert(vscodeConfig.extensions);
    }
  );

  /*
	====================================================================
             --- CONNECTION TESTS ---
	====================================================================
  */

  runner.addTest('connection-lsp', 'LSP client connection', async () => {
    const tooling = await env.createTooling();

    const connection = await tooling.createConnection(
      'test-lsp-client',
      ConnectionType.LSP_CLIENT,
      { capabilities: { completion: true } }
    );

    assert(connection);
    assert.equal(connection['connectionId'], 'test-lsp-client');
    assert.equal(connection['connectionType'], ConnectionType.LSP_CLIENT);

    /* test request handling */
    const response = await connection.sendRequest('textDocument/completion', {
      textDocument: { uri: 'file:///test.worldsrc' },
      position: { line: 0, character: 0 },
    });

    assert(Array.isArray(response));

    tooling.removeConnection('test-lsp-client');
  });

  runner.addTest('connection-debug', 'Debug client connection', async () => {
    const tooling = await env.createTooling();

    const connection = await tooling.createConnection(
      'test-debug-client',
      ConnectionType.DEBUG_CLIENT
    );

    assert(connection);

    /* test debug request */
    const response = await connection.sendRequest('initialize', {
      clientID: 'test-client',
    });

    assert(response);

    tooling.removeConnection('test-debug-client');
  });

  /*
	====================================================================
             --- INTEGRATION TESTS ---
	====================================================================
  */

  runner.addTest(
    'integration-full-workflow',
    'Full development workflow integration',
    async () => {
      const tooling = await env.createTooling();

      /* create LSP connection */
      const lspConnection = await tooling.createConnection(
        'test-workflow',
        ConnectionType.LSP_CLIENT
      );

      /* open document */
      const languageServer = tooling.getLanguageServer();
      const fileContent = fs.readFileSync(
        path.join(env.workspaceDir, 'main.worldsrc'),
        'utf8'
      );

      await languageServer.textDocumentDidOpen({
        textDocument: {
          uri: `file://${path.join(env.workspaceDir, 'main.worldsrc')}`,
          text: fileContent,
          version: 1,
        },
      });

      /* get completions */
      const completions = await lspConnection.sendRequest(
        'textDocument/completion',
        {
          textDocument: {
            uri: `file://${path.join(env.workspaceDir, 'main.worldsrc')}`,
          },
          position: { line: 5, character: 10 },
        }
      );

      assert(Array.isArray(completions));

      /* start real-time compilation */
      const compiler = tooling.getRealtimeCompiler();
      await compiler.startWatching(
        path.join(env.workspaceDir, 'main.worldsrc')
      );

      /* wait for compilation */
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const status = compiler.getCompilationStatus();
      assert(status.watchedFiles > 0);

      tooling.removeConnection('test-workflow');
    }
  );

  /*
	====================================================================
             --- PERFORMANCE TESTS ---
	====================================================================
  */

  runner.addTest(
    'performance-compilation-speed',
    'Compilation performance test',
    async () => {
      const compiler = new RealtimeCompiler();

      /* create larger test file */
      const largeSource = Array(1000)
        .fill(0)
        .map(
          (_, i) => `function test${i}(): void { console.log("test ${i}"); }`
        )
        .join('\n');

      const request = {
        sourceCode: largeSource,
        filePath: path.join(env.workspaceDir, 'large.worldsrc'),
        targets: ['typescript' as any],
        optimizationLevel: 'basic' as any,
        includeSourceMaps: false,
        watchMode: false,
      };

      const startTime = Date.now();
      const result = await compiler.compile(request);
      const endTime = Date.now();

      assert.equal(result.success, true);
      assert(result.performance.linesPerSecond > 0);

      /* should compile reasonably fast */
      const totalTime = endTime - startTime;
      assert(totalTime < 5000, `Compilation too slow: ${totalTime}ms`);
    }
  );

  runner.addTest('performance-memory-usage', 'Memory usage test', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const tooling = await env.createTooling();

    /* create multiple connections */
    const connections = [];
    for (let i = 0; i < 10; i++) {
      const conn = await tooling.createConnection(
        `test-connection-${i}`,
        ConnectionType.LSP_CLIENT
      );
      connections.push(conn);
    }

    const peakMemory = process.memoryUsage().heapUsed;

    /* cleanup connections */
    for (const conn of connections) {
      tooling.removeConnection(conn['connectionId']);
    }

    await tooling.shutdown();

    const finalMemory = process.memoryUsage().heapUsed;

    /* memory should not grow excessively */
    const memoryGrowth = peakMemory - initialMemory;
    const memoryMB = memoryGrowth / 1024 / 1024;

    assert(memoryMB < 100, `Excessive memory usage: ${memoryMB.toFixed(2)}MB`);
  });

  return runner.run();
}

/*
	====================================================================
             --- TYPE DEFINITIONS ---
	====================================================================
*/

interface TestCase {
  name: string;
  description: string;
  testFn: () => Promise<void>;
  timeout: number;
}

interface TestResult {
  name: string;
  description: string;
  success: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  error: string | null;
  output: string[];
}

interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  successRate: number;
  totalTime: number;
  results: TestResult[];
}

/*
	====================================================================
             --- MAIN EXPORT ---
	====================================================================
*/

/* run tests if called directly */
if (require.main === module) {
  runToolingTests()
    .then((result) => {
      const exitCode = result.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
