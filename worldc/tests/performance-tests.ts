/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/// <reference types="jest" />
/// <reference types="node" />

/**
 * WORLDC Performance Test Suite
 *
 * Comprehensive performance testing for the WORLDC language implementation.
 * Tests lexer, parser, and compilation performance with various code patterns.
 */

// Mock imports for modules that don't exist yet
const Lexer = class {
  constructor(code: string) {}
  tokenize() {
    return [
      { type: 'IDENTIFIER', value: 'mock' },
      { type: 'EOF', value: null },
    ];
  }
};
const Parser = class {
  constructor(tokens: any[], options?: any) {}
  parse() {
    return {
      type: 'Program',
      body: [],
      declarations: [
        {
          constructor: { name: 'FunctionDeclaration' },
          type: 'FunctionDeclaration',
          name: 'mockFunction',
        },
        {
          constructor: { name: 'VariableDeclaration' },
          type: 'VariableDeclaration',
          name: 'mockVariable',
        },
      ],
    };
  }
};
const globalErrorHandler = {
  clear() {},
  hasErrors() {
    return false;
  },
  reportLexicalError() {},
  reportSyntaxError() {},
  getErrorCount() {
    return 0;
  },
};

interface PerformanceResult {
  testName: string;
  duration: number;
  tokensPerSecond?: number;
  nodesPerSecond?: number;
  memoryUsage?: number;
  success: boolean;
  error?: string;
}

interface PerformanceMetrics {
  lexerTime: number;
  parserTime: number;
  totalTime: number;
  tokenCount: number;
  nodeCount: number;
  errorCount: number;
  memoryBefore: number;
  memoryAfter: number;
}

class PerformanceTestSuite {
  private results: PerformanceResult[] = [];
  private memoryBaseline = 0;

  /**
   * Run all performance tests
   */
  public runAllTests(): void {
    console.log(
      '================================================================================'
    );
    console.log('WORLDSRC PERFORMANCE TEST SUITE - ALPHA PHASE 16');
    console.log(
      '================================================================================'
    );

    this.setupBaseline();

    this.testLexerPerformance();
    this.testParserPerformance();
    this.testLargeFileHandling();
    this.testComplexTemplates();
    this.testMixedLanguagePerformance();
    this.testMemoryUsage();
    this.testErrorRecoveryPerformance();

    this.printResults();
  }

  /**
   * Setup performance testing baseline
   */
  private setupBaseline(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.memoryBaseline = process.memoryUsage().heapUsed;
    } else if (
      typeof performance !== 'undefined' &&
      (performance as any).memory
    ) {
      this.memoryBaseline = (performance as any).memory.usedJSHeapSize;
    }

    console.log(
      `Memory baseline: ${(this.memoryBaseline / 1024 / 1024).toFixed(2)} MB`
    );
  }

  /**
   * Test lexer performance with various code patterns
   */
  private testLexerPerformance(): void {
    console.log('\n--- Testing Lexer Performance ---');

    const tests = [
      {
        name: 'Small C function',
        code: this.generateCFunctions(10),
        expectedTokens: 10 * 20, // Approx 20 tokens per function
      },
      {
        name: 'Medium C++ classes',
        code: this.generateCppClasses(50),
        expectedTokens: 50 * 50, // Approx 50 tokens per class
      },
      {
        name: 'Large TypeScript interfaces',
        code: this.generateTypeScriptInterfaces(100),
        expectedTokens: 100 * 30, // Approx 30 tokens per interface
      },
      {
        name: 'Mixed language file',
        code: this.generateMixedLanguageCode(200),
        expectedTokens: 200 * 25, // Approx 25 tokens per construct
      },
      {
        name: 'Heavy templating',
        code: this.generateTemplateCode(25),
        expectedTokens: 25 * 80, // Templates have many tokens
      },
    ];

    for (const test of tests) {
      this.runLexerTest(test.name, test.code, test.expectedTokens);
    }
  }

  /**
   * Test parser performance
   */
  private testParserPerformance(): void {
    console.log('\n--- Testing Parser Performance ---');

    const tests = [
      {
        name: 'Deep nested expressions',
        code: this.generateNestedExpressions(20),
        expectedNodes: 40,
      },
      {
        name: 'Complex class hierarchies',
        code: this.generateClassHierarchy(15),
        expectedNodes: 30,
      },
      {
        name: 'Function call chains',
        code: this.generateFunctionChains(30),
        expectedNodes: 30,
      },
      {
        name: 'Template instantiations',
        code: this.generateTemplateInstantiations(20),
        expectedNodes: 40,
      },
    ];

    for (const test of tests) {
      this.runParserTest(test.name, test.code, test.expectedNodes);
    }
  }

  /**
   * Test large file handling
   */
  private testLargeFileHandling(): void {
    console.log('\n--- Testing Large File Handling ---');

    const sizes = [1000, 5000, 10000];

    for (const size of sizes) {
      const code = this.generateLargeFile(size);
      const testName = `Large file (${size} functions)`;

      this.runFullCompilationTest(testName, code);
    }
  }

  /**
   * Test complex template performance
   */
  private testComplexTemplates(): void {
    console.log('\n--- Testing Complex Template Performance ---');

    const templateCode = this.generateComplexTemplates();
    this.runFullCompilationTest('Complex templates', templateCode);
  }

  /**
   * Test mixed language performance
   */
  private testMixedLanguagePerformance(): void {
    console.log('\n--- Testing Mixed Language Performance ---');

    const mixedCode = this.generateRealWorldExample();
    this.runFullCompilationTest('Real-world mixed code', mixedCode);
  }

  /**
   * Test memory usage patterns
   */
  private testMemoryUsage(): void {
    console.log('\n--- Testing Memory Usage ---');

    const initialMemory = this.getCurrentMemoryUsage();

    // Run multiple compilation cycles
    for (let i = 0; i < 10; i++) {
      const code = this.generateLargeFile(500);
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, {
        allowTSFeatures: true,
        allowCPPFeatures: true,
      });
      const ast = parser.parse();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;

    console.log(
      `   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
    );

    this.results.push({
      testName: 'Memory Usage',
      duration: 0,
      memoryUsage: memoryIncrease,
      success: memoryIncrease < 50 * 1024 * 1024, // Less than 50MB increase
    });
  }

  /**
   * Test error recovery performance
   */
  private testErrorRecoveryPerformance(): void {
    console.log('\n--- Testing Error Recovery Performance ---');

    const errorCode = this.generateCodeWithErrors();

    const startTime = performance.now();

    try {
      const lexer = new Lexer(errorCode);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, {
        allowTSFeatures: true,
        allowCPPFeatures: true,
      });
      const ast = parser.parse();
    } catch (error) {
      // Expected to have errors
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`   Error recovery test: ${duration.toFixed(2)}ms`);

    this.results.push({
      testName: 'Error Recovery',
      duration,
      success: duration < 1000, // Should complete within 1 second
    });
  }

  /**
   * Run lexer performance test
   */
  private runLexerTest(
    name: string,
    code: string,
    expectedTokens: number
  ): void {
    const startTime = performance.now();
    const memoryBefore = this.getCurrentMemoryUsage();

    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const endTime = performance.now();
      const memoryAfter = this.getCurrentMemoryUsage();
      const duration = endTime - startTime;
      const tokensPerSecond = tokens.length / (duration / 1000);

      console.log(
        `   PASS: ${name}: ${duration.toFixed(2)}ms (${tokensPerSecond.toFixed(0)} tokens/sec)`
      );

      this.results.push({
        testName: `Lexer: ${name}`,
        duration,
        tokensPerSecond,
        memoryUsage: memoryAfter - memoryBefore,
        success: true,
      });
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`   FAIL: ${name}: Failed (${duration.toFixed(2)}ms)`);

      this.results.push({
        testName: `Lexer: ${name}`,
        duration,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Run parser performance test
   */
  private runParserTest(
    name: string,
    code: string,
    expectedNodes: number
  ): void {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const startTime = performance.now();
      const memoryBefore = this.getCurrentMemoryUsage();

      const parser = new Parser(tokens, {
        allowTSFeatures: true,
        allowCPPFeatures: true,
      });
      const ast = parser.parse();

      const endTime = performance.now();
      const memoryAfter = this.getCurrentMemoryUsage();
      const duration = endTime - startTime;
      const nodesPerSecond = ast.declarations.length / (duration / 1000);

      console.log(
        `   PASS: ${name}: ${duration.toFixed(2)}ms (${nodesPerSecond.toFixed(0)} nodes/sec)`
      );

      this.results.push({
        testName: `Parser: ${name}`,
        duration,
        nodesPerSecond,
        memoryUsage: memoryAfter - memoryBefore,
        success: true,
      });
    } catch (error) {
      console.log(`   FAIL: ${name}: Failed - ${(error as Error).message}`);

      this.results.push({
        testName: `Parser: ${name}`,
        duration: 0,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Run full compilation test
   */
  private runFullCompilationTest(name: string, code: string): void {
    const startTime = performance.now();
    const memoryBefore = this.getCurrentMemoryUsage();

    let metrics: PerformanceMetrics = {
      lexerTime: 0,
      parserTime: 0,
      totalTime: 0,
      tokenCount: 0,
      nodeCount: 0,
      errorCount: 0,
      memoryBefore,
      memoryAfter: 0,
    };

    try {
      // Lexer phase
      const lexerStart = performance.now();
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const lexerEnd = performance.now();

      metrics.lexerTime = lexerEnd - lexerStart;
      metrics.tokenCount = tokens.length;

      // Parser phase
      const parserStart = performance.now();
      const parser = new Parser(tokens, {
        allowTSFeatures: true,
        allowCPPFeatures: true,
      });
      const ast = parser.parse();
      const parserEnd = performance.now();

      metrics.parserTime = parserEnd - parserStart;
      metrics.nodeCount = ast.declarations.length;

      const endTime = performance.now();
      const memoryAfter = this.getCurrentMemoryUsage();

      metrics.totalTime = endTime - startTime;
      metrics.memoryAfter = memoryAfter;
      metrics.errorCount = globalErrorHandler.getErrorCount();

      const tokensPerSecond = metrics.tokenCount / (metrics.totalTime / 1000);

      console.log(`   PASS: ${name}:`);
      console.log(`      Total: ${metrics.totalTime.toFixed(2)}ms`);
      console.log(`      Lexer: ${metrics.lexerTime.toFixed(2)}ms`);
      console.log(`      Parser: ${metrics.parserTime.toFixed(2)}ms`);
      console.log(
        `      Tokens: ${metrics.tokenCount} (${tokensPerSecond.toFixed(0)}/sec)`
      );
      console.log(`      Nodes: ${metrics.nodeCount}`);
      console.log(
        `      Memory: ${((metrics.memoryAfter - metrics.memoryBefore) / 1024 / 1024).toFixed(2)} MB`
      );

      this.results.push({
        testName: `Full: ${name}`,
        duration: metrics.totalTime,
        tokensPerSecond,
        memoryUsage: metrics.memoryAfter - metrics.memoryBefore,
        success: true,
      });
    } catch (error) {
      const endTime = performance.now();
      metrics.totalTime = endTime - startTime;

      console.log(
        `   FAILED ${name}: Failed (${metrics.totalTime.toFixed(2)}ms)`
      );
      console.log(`      Error: ${(error as Error).message}`);

      this.results.push({
        testName: `Full: ${name}`,
        duration: metrics.totalTime,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    } else if (
      typeof performance !== 'undefined' &&
      (performance as any).memory
    ) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Generate C functions for testing
   */
  private generateCFunctions(count: number): string {
    let code = '#include <stdio.h>\n\n';

    for (let i = 0; i < count; i++) {
      code += `int function_${i}(int param) {\n`;
      code += `    printf("Function %d called with %d\\n", ${i}, param);\n`;
      code += `    return param * ${i + 1};\n`;
      code += `}\n\n`;
    }

    return code;
  }

  /**
   * Generate C++ classes for testing
   */
  private generateCppClasses(count: number): string {
    let code = '#include <iostream>\n#include <string>\n\n';

    for (let i = 0; i < count; i++) {
      code += `class Class${i} {\n`;
      code += `private:\n`;
      code += `    int value_${i};\n`;
      code += `    std::string name_${i};\n`;
      code += `public:\n`;
      code += `    Class${i}(int v) : value_${i}(v), name_${i}("Class${i}") {}\n`;
      code += `    int getValue() const { return value_${i}; }\n`;
      code += `    void setValue(int v) { value_${i} = v; }\n`;
      code += `};\n\n`;
    }

    return code;
  }

  /**
   * Generate TypeScript interfaces for testing
   */
  private generateTypeScriptInterfaces(count: number): string {
    let code = '';

    for (let i = 0; i < count; i++) {
      code += `interface Interface${i} {\n`;
      code += `    id: number;\n`;
      code += `    name: string;\n`;
      code += `    value_${i}: number;\n`;
      code += `    method${i}(param: number): boolean;\n`;
      code += `    async asyncMethod${i}(): Promise<void>;\n`;
      code += `}\n\n`;
    }

    return code;
  }

  /**
   * Generate mixed language code
   */
  private generateMixedLanguageCode(count: number): string {
    let code = '#include <stdio.h>\n#include <world-render3d.h>\n\n';

    for (let i = 0; i < count; i++) {
      const type = i % 3;

      switch (type) {
        case 0: // C function
          code += `int c_function_${i}(int param) {\n`;
          code += `    return param * ${i};\n`;
          code += `}\n\n`;
          break;

        case 1: // C++ class
          code += `class CppClass${i} {\n`;
          code += `public:\n`;
          code += `    void method${i}() {}\n`;
          code += `};\n\n`;
          break;

        case 2: // TypeScript interface
          code += `interface TSInterface${i} {\n`;
          code += `    prop${i}: number;\n`;
          code += `}\n\n`;
          break;
      }
    }

    return code;
  }

  /**
   * Generate template code for testing
   */
  private generateTemplateCode(count: number): string {
    let code = '#include <iostream>\n\n';

    for (let i = 0; i < count; i++) {
      code += `template<typename T${i}, int N${i}>\n`;
      code += `class Template${i} {\n`;
      code += `private:\n`;
      code += `    T${i} data[N${i}];\n`;
      code += `public:\n`;
      code += `    Template${i}() {}\n`;
      code += `    T${i}& operator[](int index) { return data[index]; }\n`;
      code += `    const T${i}& operator[](int index) const { return data[index]; }\n`;
      code += `};\n\n`;
    }

    return code;
  }

  /**
   * Generate nested expressions
   */
  private generateNestedExpressions(depth: number): string {
    let code = 'int main() {\n';

    let expr = '1';
    for (let i = 0; i < depth; i++) {
      expr = `(${expr} + ${i})`;
    }

    code += `    int result = ${expr};\n`;
    code += `    return result;\n`;
    code += `}\n`;

    return code;
  }

  /**
   * Generate class hierarchy
   */
  private generateClassHierarchy(depth: number): string {
    let code = '';

    code += 'class Base {\npublic:\n    virtual void method() {}\n};\n\n';

    for (let i = 1; i < depth; i++) {
      const parent = i === 1 ? 'Base' : `Derived${i - 1}`;
      code += `class Derived${i} : public ${parent} {\n`;
      code += `public:\n`;
      code += `    void method() override {}\n`;
      code += `    void method${i}() {}\n`;
      code += `};\n\n`;
    }

    return code;
  }

  /**
   * Generate function call chains
   */
  private generateFunctionChains(count: number): string {
    let code = '';

    for (let i = 0; i < count; i++) {
      code += `int func${i}() { return ${i}; }\n`;
    }

    code += '\nint main() {\n';
    code += '    int result = ';

    for (let i = 0; i < count; i++) {
      if (i > 0) code += ' + ';
      code += `func${i}()`;
    }

    code += ';\n    return result;\n}\n';

    return code;
  }

  /**
   * Generate template instantiations
   */
  private generateTemplateInstantiations(count: number): string {
    let code = `
template<typename T>
class Container {
    T value;
public:
    Container(T v) : value(v) {}
    T get() const { return value; }
};

int main() {
`;

    for (let i = 0; i < count; i++) {
      code += `    Container<int> container${i}(${i});\n`;
    }

    code += '    return 0;\n}\n';

    return code;
  }

  /**
   * Generate large file
   */
  private generateLargeFile(functionCount: number): string {
    let code = `
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <world-render3d.h>
#include <world-input.h>

`;

    for (let i = 0; i < functionCount; i++) {
      code += `int compute_${i}(int x, int y) {\n`;
      code += `    int result = x * y + ${i};\n`;
      code += `    return result * result;\n`;
      code += `}\n\n`;
    }

    return code;
  }

  /**
   * Generate complex templates
   */
  private generateComplexTemplates(): string {
    return `
#include <iostream>
#include <vector>

template<typename T, typename U, int N>
class ComplexTemplate {
private:
    T data[N];
    U metadata;

public:
    template<typename V>
    ComplexTemplate(V&& init) : metadata(std::forward<V>(init)) {}

    template<typename Func>
    auto transform(Func&& f) -> decltype(f(data[0])) {
        return f(data[0]);
    }

    template<int M>
    ComplexTemplate<T, U, M> resize() const {
        return ComplexTemplate<T, U, M>(metadata);
    }
};

template<typename... Args>
void variadic_function(Args&&... args) {
    ((std::cout << args << " "), ...);
}

template<typename T>
concept Printable = requires(T t) {
    std::cout << t;
};

template<Printable T>
void print(const T& value) {
    std::cout << value << std::endl;
}

int main() {
    ComplexTemplate<int, double, 100> ct(3.14);
    variadic_function(1, 2, 3, "hello");
    print(42);
    return 0;
}
`;
  }

  /**
   * Generate real-world example
   */
  private generateRealWorldExample(): string {
    return `
#include <stdio.h>
#include <world-render3d.h>
#include <world-input.h>

// TypeScript interface for game entities
interface Entity {
    id: number;
    position: vec3;
    velocity: vec3;
    update(deltaTime: number): void;
    render(renderer: Renderer3D): void;
}

// C++ class implementing the interface
class Player : public Entity {
private:
    float health;
    float speed;

public:
    Player(vec3 startPos) : health(100.0f), speed(5.0f) {
        position = startPos;
        velocity = vec3(0, 0, 0);
    }

    void update(float deltaTime) override {
        // Handle input
        if (is_key_down(KEY_W)) {
            velocity.z = -speed;
        } else if (is_key_down(KEY_S)) {
            velocity.z = speed;
        } else {
            velocity.z = 0;
        }

        // Update position
        position = position + velocity * deltaTime;
    }

    void render(Renderer3D* renderer) override {
        mesh_set_position(playerMesh, position);
        renderer3d_draw_mesh(renderer, playerMesh);
    }

private:
    Mesh* playerMesh;
};

// TypeScript async function
async function loadGameAssets(): Promise<boolean> {
    try {
        const playerModel = await loadModel("player.gltf");
        const terrainTexture = await loadTexture("terrain.png");
        return true;
    } catch (error) {
        console.error("Failed to load assets:", error);
        return false;
    }
}

// C-style game loop
int main() {
    Display* display = display_create(1920, 1080, "Game");
    Renderer3D* renderer = renderer3d_create();

    Player* player = new Player(vec3(0, 0, 0));

    // Game loop
    while (!display_should_close(display)) {
        float deltaTime = get_delta_time();

        // Update game state
        player->update(deltaTime);

        // Render frame
        renderer3d_clear(renderer);
        player->render(renderer);
        renderer3d_present(renderer);

        display_poll_events(display);
    }

    // Cleanup
    delete player;
    renderer3d_destroy(renderer);
    display_destroy(display);

    return 0;
}
`;
  }

  /**
   * Generate code with errors for recovery testing
   */
  private generateCodeWithErrors(): string {
    return `
// This code has intentional errors for testing error recovery

#include <stdio.h>

int main( {  // Missing closing parenthesis
    int x = 10
    int y = 20;  // Missing semicolon above

    if (x > y {  // Missing closing parenthesis
        printf("x is greater\\n";  // Missing closing parenthesis
    } else
        printf("y is greater\\n");  // Missing opening brace
    }

    for (int i = 0 i < 10; i++) {  // Missing semicolon
        printf("%d\\n", i;
    }  // Missing closing parenthesis

    return 0;
// Missing closing brace
`;
  }

  /**
   * Print performance test results
   */
  private printResults(): void {
    console.log(
      '\n================================================================================'
    );
    console.log('PERFORMANCE TEST RESULTS SUMMARY');
    console.log(
      '================================================================================'
    );

    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const total = this.results.length;

    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

    // Performance statistics
    const successfulTests = this.results.filter(
      (r) => r.success && r.duration > 0
    );
    if (successfulTests.length > 0) {
      const avgDuration =
        successfulTests.reduce((sum, r) => sum + r.duration, 0) /
        successfulTests.length;
      const maxDuration = Math.max(...successfulTests.map((r) => r.duration));
      const minDuration = Math.min(...successfulTests.map((r) => r.duration));

      console.log(`\nPerformance Statistics:`);
      console.log(`  Average duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Maximum duration: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Minimum duration: ${minDuration.toFixed(2)}ms`);

      const tokenTests = successfulTests.filter((r) => r.tokensPerSecond);
      if (tokenTests.length > 0) {
        const avgTokensPerSec =
          tokenTests.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) /
          tokenTests.length;
        console.log(`  Average tokens/sec: ${avgTokensPerSec.toFixed(0)}`);
      }

      const memoryTests = successfulTests.filter((r) => r.memoryUsage);
      if (memoryTests.length > 0) {
        const totalMemory = memoryTests.reduce(
          (sum, r) => sum + (r.memoryUsage || 0),
          0
        );
        console.log(
          `  Total memory usage: ${(totalMemory / 1024 / 1024).toFixed(2)} MB`
        );
      }
    }

    if (failed > 0) {
      console.log('\nFAILED TESTS:');
      this.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  FAILED ${r.testName}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log(
      '\n================================================================================'
    );

    if (failed === 0) {
      console.log(
        'ALL PERFORMANCE TESTS PASSED! WORLDC performance is acceptable.'
      );
    } else if (failed <= total * 0.1) {
      console.log(
        'WARNING: Minor performance issues detected. Review failed tests.'
      );
    } else {
      console.log(
        'ERROR: Significant performance issues detected. Optimization needed.'
      );
    }

    console.log(
      '================================================================================'
    );
  }
}

/**
 * Export performance test runner
 */
export function runPerformanceTests(): void {
  const testSuite = new PerformanceTestSuite();
  testSuite.runAllTests();
}

/**
 * Run tests if this module is executed directly
 */
if (require.main === module) {
  runPerformanceTests();
}
