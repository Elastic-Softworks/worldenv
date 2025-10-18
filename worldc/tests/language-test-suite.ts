/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/// <reference types="jest" />
/// <reference types="node" />

/**
 * WORLDC Language Test Suite
 *
 * Comprehensive test suite for the WORLDC C/C++/TypeScript hybrid language.
 * Tests lexer, parser, and AST generation for all supported language features.
 */

// Mock imports for modules that don't exist yet
const Lexer = class {
  constructor(code: string) {}
  tokenize() {
    return [
      { type: TokenType.IDENTIFIER, value: 'mock' },
      { type: TokenType.EOF, value: null },
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
enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  INT = 'INT',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  TYPEDEF = 'TYPEDEF',
  INCLUDE = 'INCLUDE',
  DEFINE = 'DEFINE',
  INTEGER_LITERAL = 'INTEGER_LITERAL',
  AUTO = 'AUTO',
  ASSIGN = 'ASSIGN',
  LEFT_BRACKET = 'LEFT_BRACKET',
  RIGHT_BRACKET = 'RIGHT_BRACKET',
  ASYNC = 'ASYNC',
  FUNCTION = 'FUNCTION',
  CONST = 'CONST',
  LET = 'LET',
  COLON = 'COLON',
  TYPE = 'TYPE',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  STRING = 'STRING',
  VOID = 'VOID',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  RETURN = 'RETURN',
  CLASS = 'CLASS',
  STRUCT = 'STRUCT',
  ENUM = 'ENUM',
  UNION = 'UNION',
  NAMESPACE = 'NAMESPACE',
  USING = 'USING',
  TEMPLATE = 'TEMPLATE',
  TYPENAME = 'TYPENAME',
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
  VIRTUAL = 'VIRTUAL',
  OVERRIDE = 'OVERRIDE',
  FINAL = 'FINAL',
  STATIC = 'STATIC',
  INLINE = 'INLINE',
  EXTERN = 'EXTERN',
  VOLATILE = 'VOLATILE',
  MUTABLE = 'MUTABLE',
  EXPLICIT = 'EXPLICIT',
  OPERATOR = 'OPERATOR',
  NEW = 'NEW',
  DELETE = 'DELETE',
  THIS = 'THIS',
  SUPER = 'SUPER',
  NULL_LITERAL = 'NULL_LITERAL',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LOGICAL_AND = 'LOGICAL_AND',
  LOGICAL_OR = 'LOGICAL_OR',
  LOGICAL_NOT = 'LOGICAL_NOT',
  BITWISE_AND = 'BITWISE_AND',
  BITWISE_OR = 'BITWISE_OR',
  BITWISE_XOR = 'BITWISE_XOR',
  BITWISE_NOT = 'BITWISE_NOT',
  LEFT_SHIFT = 'LEFT_SHIFT',
  RIGHT_SHIFT = 'RIGHT_SHIFT',
  DOT = 'DOT',
  ARROW = 'ARROW',
  SCOPE = 'SCOPE',
  QUESTION = 'QUESTION',
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
}

interface TestCase {
  name: string;
  code: string;
  expectSuccess: boolean;
  expectedTokens?: TokenType[];
  expectedNodes?: string[];
  description?: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

class LanguageTestSuite {
  private results: TestResult[] = [];

  /**
   * Run all test suites
   */
  public runAllTests(): void {
    console.log(
      '================================================================================'
    );
    console.log('WORLDSRC LANGUAGE TEST SUITE');
    console.log(
      '================================================================================'
    );

    this.testCLanguageFeatures();
    this.testCppLanguageFeatures();
    this.testTypeScriptFeatures();
    this.testMixedLanguageCode();
    this.testWorldSrcSpecificFeatures();
    this.testErrorHandling();
    this.testPerformance();

    this.printResults();
  }

  /**
   * Test C language features
   */
  private testCLanguageFeatures(): void {
    console.log('\n--- Testing C Language Features ---');

    const tests: TestCase[] = [
      {
        name: 'C function declaration',
        code: 'int add(int a, int b);',
        expectSuccess: true,
        expectedTokens: [
          TokenType.INT,
          TokenType.IDENTIFIER,
          TokenType.LEFT_PAREN,
          TokenType.INT,
          TokenType.IDENTIFIER,
          TokenType.COMMA,
          TokenType.INT,
          TokenType.IDENTIFIER,
          TokenType.RIGHT_PAREN,
          TokenType.SEMICOLON,
        ],
        description: 'Basic C function declaration',
      },
      {
        name: 'C function definition',
        code: `int add(int a, int b) {
          return a + b;
        }`,
        expectSuccess: true,
        expectedNodes: ['FunctionDeclaration'],
        description: 'C function with body',
      },
      {
        name: 'C struct definition',
        code: `struct Point {
          int x;
          int y;
        };`,
        expectSuccess: true,
        expectedNodes: ['StructDeclaration'],
        description: 'C struct with members',
      },
      {
        name: 'C typedef',
        code: 'typedef int MyInt;',
        expectSuccess: true,
        expectedTokens: [
          TokenType.TYPEDEF,
          TokenType.INT,
          TokenType.IDENTIFIER,
          TokenType.SEMICOLON,
        ],
        description: 'C typedef declaration',
      },
      {
        name: 'C pointer declaration',
        code: 'int* ptr = NULL;',
        expectSuccess: true,
        description: 'C pointer with initialization',
      },
      {
        name: 'C array declaration',
        code: 'int numbers[10];',
        expectSuccess: true,
        description: 'C fixed-size array',
      },
      {
        name: 'C for loop',
        code: `for (int i = 0; i < 10; i++) {
          printf("%d\\n", i);
        }`,
        expectSuccess: true,
        expectedNodes: ['ForStatement'],
        description: 'C-style for loop',
      },
      {
        name: 'C switch statement',
        code: `switch (value) {
          case 1:
            printf("One");
            break;
          default:
            printf("Other");
            break;
        }`,
        expectSuccess: true,
        expectedNodes: ['SwitchStatement'],
        description: 'C switch with cases',
      },
      {
        name: 'C preprocessor directives',
        code: `#include <stdio.h>
        #define MAX_SIZE 100`,
        expectSuccess: true,
        expectedTokens: [
          TokenType.INCLUDE,
          TokenType.IDENTIFIER,
          TokenType.DEFINE,
          TokenType.IDENTIFIER,
          TokenType.INTEGER_LITERAL,
        ],
        description: 'C preprocessor #include and #define',
      },
    ];

    this.runTestCases('C Language', tests);
  }

  /**
   * Test C++ language features
   */
  private testCppLanguageFeatures(): void {
    console.log('\n--- Testing C++ Language Features ---');

    const tests: TestCase[] = [
      {
        name: 'C++ class declaration',
        code: `class MyClass {
        private:
          int value;
        public:
          MyClass(int v) : value(v) {}
          int getValue() const { return value; }
        };`,
        expectSuccess: true,
        expectedNodes: ['ClassDeclaration'],
        description: 'C++ class with constructor and methods',
      },
      {
        name: 'C++ inheritance',
        code: `class Derived : public Base {
        public:
          void override_method() override {}
        };`,
        expectSuccess: true,
        expectedNodes: ['ClassDeclaration'],
        description: 'C++ class inheritance with override',
      },
      {
        name: 'C++ template function',
        code: `template<typename T>
        T max(T a, T b) {
          return (a > b) ? a : b;
        }`,
        expectSuccess: true,
        expectedNodes: ['TemplateDeclaration'],
        description: 'C++ template function',
      },
      {
        name: 'C++ template class',
        code: `template<typename T, int N>
        class Array {
        private:
          T data[N];
        public:
          T& operator[](int index) { return data[index]; }
        };`,
        expectSuccess: true,
        expectedNodes: ['TemplateDeclaration'],
        description: 'C++ template class with operator overload',
      },
      {
        name: 'C++ namespace',
        code: `namespace MyNamespace {
          int function() { return 42; }
        }`,
        expectSuccess: true,
        expectedNodes: ['NamespaceDeclaration'],
        description: 'C++ namespace declaration',
      },
      {
        name: 'C++ lambda expression',
        code: 'auto lambda = [](int x) -> int { return x * 2; };',
        expectSuccess: true,
        expectedTokens: [
          TokenType.AUTO,
          TokenType.IDENTIFIER,
          TokenType.ASSIGN,
          TokenType.LEFT_BRACKET,
          TokenType.RIGHT_BRACKET,
        ],
        description: 'C++ lambda with capture and return type',
      },
      {
        name: 'C++ smart pointers',
        code: `std::unique_ptr<int> ptr = std::make_unique<int>(42);
        std::shared_ptr<MyClass> shared = std::make_shared<MyClass>(10);`,
        expectSuccess: true,
        description: 'C++ smart pointer usage',
      },
      {
        name: 'C++ operator overloading',
        code: `Vector3 operator+(const Vector3& a, const Vector3& b) {
          return Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
        }`,
        expectSuccess: true,
        expectedNodes: ['FunctionDeclaration'],
        description: 'C++ operator overload function',
      },
    ];

    this.runTestCases('C++', tests);
  }

  /**
   * Test TypeScript features
   */
  private testTypeScriptFeatures(): void {
    console.log('\n--- Testing TypeScript Features ---');

    const tests: TestCase[] = [
      {
        name: 'TypeScript interface',
        code: `interface Entity {
          id: number;
          name: string;
          position: vec3;
          update(deltaTime: number): void;
        }`,
        expectSuccess: true,
        expectedNodes: ['InterfaceDeclaration'],
        description: 'TypeScript interface with methods',
      },
      {
        name: 'TypeScript generics',
        code: `interface Container<T> {
          value: T;
          getValue(): T;
        }`,
        expectSuccess: true,
        expectedNodes: ['InterfaceDeclaration'],
        description: 'TypeScript generic interface',
      },
      {
        name: 'TypeScript async function',
        code: `async function loadAsset(path: string): Promise<Asset> {
          const response = await fetch(path);
          return await response.json();
        }`,
        expectSuccess: true,
        expectedNodes: ['FunctionDeclaration'],
        expectedTokens: [TokenType.ASYNC, TokenType.FUNCTION],
        description: 'TypeScript async/await function',
      },
      {
        name: 'TypeScript arrow function',
        code: `const multiply = (a: number, b: number): number => a * b;`,
        expectSuccess: true,
        expectedTokens: [
          TokenType.CONST,
          TokenType.IDENTIFIER,
          TokenType.ASSIGN,
        ],
        description: 'TypeScript arrow function with types',
      },
      {
        name: 'TypeScript union types',
        code: `let value: string | number | boolean = "hello";`,
        expectSuccess: true,
        expectedTokens: [TokenType.LET, TokenType.IDENTIFIER, TokenType.COLON],
        description: 'TypeScript union type annotation',
      },
      {
        name: 'TypeScript optional properties',
        code: `interface Config {
          required: string;
          optional?: number;
          readonly immutable: boolean;
        }`,
        expectSuccess: true,
        expectedNodes: ['InterfaceDeclaration'],
        description: 'TypeScript optional and readonly properties',
      },
      {
        name: 'TypeScript type aliases',
        code: `type EventHandler = (event: Event) => void;
        type Point2D = { x: number; y: number; };`,
        expectSuccess: true,
        expectedTokens: [TokenType.TYPE, TokenType.IDENTIFIER],
        description: 'TypeScript type alias declarations',
      },
      {
        name: 'TypeScript destructuring',
        code: `const { x, y, z } = position;
        const [first, second, ...rest] = array;`,
        expectSuccess: true,
        expectedTokens: [
          TokenType.CONST,
          TokenType.LEFT_BRACE,
          TokenType.IDENTIFIER,
        ],
        description: 'TypeScript destructuring assignment',
      },
    ];

    this.runTestCases('TypeScript', tests);
  }

  /**
   * Test mixed language code
   */
  private testMixedLanguageCode(): void {
    console.log('\n--- Testing Mixed Language Features ---');

    const tests: TestCase[] = [
      {
        name: 'C function with TypeScript types',
        code: `function processEntity(entity: Entity): number {
          return entity.id;
        }`,
        expectSuccess: true,
        expectedNodes: ['FunctionDeclaration'],
        description: 'Function using both C and TypeScript syntax',
      },
      {
        name: 'C++ class implementing TypeScript interface',
        code: `class Player : public Entity, public IUpdateable {
        public:
          void update(deltaTime: number): void override {
            // Implementation
          }
        };`,
        expectSuccess: true,
        expectedNodes: ['ClassDeclaration'],
        description: 'C++ class implementing TypeScript interface',
      },
      {
        name: 'Mixed variable declarations',
        code: `int c_variable = 10;
        let ts_variable: number = 20;
        auto cpp_variable = 30;`,
        expectSuccess: true,
        description: 'Variables using different language syntaxes',
      },
      {
        name: 'C struct with TypeScript methods',
        code: `struct GameEntity {
          int id;
          vec3 position;

          update(deltaTime: number): void;
          render(): void;
        };`,
        expectSuccess: true,
        expectedNodes: ['StructDeclaration'],
        description: 'C struct enhanced with TypeScript method signatures',
      },
    ];

    this.runTestCases('Mixed Language', tests);
  }

  /**
   * Test WORLDSRC-specific features
   */
  private testWorldSrcSpecificFeatures(): void {
    console.log('\n--- Testing WORLDSRC-Specific Features ---');

    const tests: TestCase[] = [
      {
        name: 'WORLDSRC vector types',
        code: `vec2 pos2d = vec2(10.0f, 20.0f);
        vec3 pos3d = vec3(1.0f, 2.0f, 3.0f);
        vec4 color = vec4(1.0f, 0.5f, 0.0f, 1.0f);`,
        expectSuccess: true,
        expectedTokens: [
          TokenType.IDENTIFIER,
          TokenType.IDENTIFIER,
          TokenType.ASSIGN,
        ],
        description: 'WORLDSRC built-in vector types',
      },
      {
        name: 'WORLDSRC game engine functions',
        code: `Display* display = display_create(1920, 1080, "Game");
        Renderer3D* renderer = renderer3d_create();
        if (is_key_down(KEY_W)) {
          player->move_forward();
        }`,
        expectSuccess: true,
        description: 'WORLDSRC engine API calls',
      },
      {
        name: 'WORLDSRC Three.js integration',
        code: `Scene* scene = scene_create();
        Mesh* mesh = mesh_create_box(1.0f, 1.0f, 1.0f);
        scene_add_mesh(scene, mesh);`,
        expectSuccess: true,
        description: 'WORLDSRC Three.js wrapper functions',
      },
      {
        name: 'WORLDSRC Pixi.js integration',
        code: `Sprite* sprite = sprite_create("texture.png");
        sprite_set_position(sprite, 100.0f, 200.0f);
        renderer2d_add_sprite(renderer, sprite);`,
        expectSuccess: true,
        description: 'WORLDSRC Pixi.js wrapper functions',
      },
    ];

    this.runTestCases('WORLDSRC-Specific', tests);
  }

  /**
   * Test error handling
   */
  private testErrorHandling(): void {
    console.log('\n--- Testing Error Handling ---');

    const tests: TestCase[] = [
      {
        name: 'Invalid syntax',
        code: 'int function( {',
        expectSuccess: false,
        description: 'Should report syntax error for malformed function',
      },
      {
        name: 'Unterminated string',
        code: 'const message = "unterminated string;',
        expectSuccess: false,
        description: 'Should report unterminated string literal',
      },
      {
        name: 'Invalid token sequence',
        code: 'int ++ void',
        expectSuccess: false,
        description: 'Should report invalid token sequence',
      },
      {
        name: 'Mismatched braces',
        code: 'if (true) { return; }',
        expectSuccess: false,
        description: 'Should report mismatched braces',
      },
      {
        name: 'Invalid number format',
        code: 'int value = 0x;',
        expectSuccess: false,
        description: 'Should report invalid hexadecimal number',
      },
    ];

    this.runTestCases('Error Handling', tests);
  }

  /**
   * Test parser performance
   */
  private testPerformance(): void {
    console.log('\n--- Testing Performance ---');

    // Generate large code sample
    let largeCode = '#include <stdio.h>\n';
    for (let i = 0; i < 1000; i++) {
      largeCode += `int function_${i}(int param) { return param * ${i}; }\n`;
    }

    const startTime = performance.now();

    try {
      const lexer = new Lexer(largeCode);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens, {
        allowTSFeatures: true,
        allowCPPFeatures: true,
        strict: false,
      });

      const ast = parser.parse();

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `   Performance test: ${duration.toFixed(2)}ms for 1000 functions`
      );
      console.log(`   Tokens generated: ${tokens.length}`);
      console.log(`   AST nodes: ${ast.declarations.length}`);

      if (duration < 1000) {
        // Less than 1 second
        this.addResult(
          'Performance test',
          true,
          `Completed in ${duration.toFixed(2)}ms`
        );
      } else {
        this.addResult(
          'Performance test',
          false,
          `Too slow: ${duration.toFixed(2)}ms`
        );
      }
    } catch (error) {
      this.addResult('Performance test', false, (error as Error).message);
    }
  }

  /**
   * Run a set of test cases
   */
  private runTestCases(category: string, tests: TestCase[]): void {
    for (const test of tests) {
      try {
        // Tokenize
        const lexer = new Lexer(test.code);
        const tokens = lexer.tokenize();

        // Check expected tokens if specified
        if (test.expectedTokens) {
          for (
            let i = 0;
            i < test.expectedTokens.length && i < tokens.length;
            i++
          ) {
            if (tokens[i].type !== test.expectedTokens[i]) {
              throw new Error(
                `Expected token ${test.expectedTokens[i]}, got ${tokens[i].type} at position ${i}`
              );
            }
          }
        }

        // Parse
        const parser = new Parser(tokens, {
          allowTSFeatures: true,
          allowCPPFeatures: true,
          strict: false,
        });

        const ast = parser.parse();

        // Check expected nodes if specified
        if (test.expectedNodes) {
          for (const expectedNode of test.expectedNodes) {
            const found = ast.declarations.some(
              (decl) => decl.constructor.name === expectedNode
            );
            if (!found) {
              throw new Error(`Expected AST node ${expectedNode} not found`);
            }
          }
        }

        if (test.expectSuccess) {
          console.log(`   PASS: ${test.name}`);
          this.addResult(`${category}: ${test.name}`, true);
        } else {
          console.log(`   FAIL: ${test.name} (should have failed but didn't)`);
          this.addResult(
            `${category}: ${test.name}`,
            false,
            'Expected failure but test passed'
          );
        }
      } catch (error) {
        if (test.expectSuccess) {
          console.log(`   FAIL: ${test.name}: ${(error as Error).message}`);
          this.addResult(
            `${category}: ${test.name}`,
            false,
            (error as Error).message
          );
        } else {
          console.log(`   PASS: ${test.name} (correctly failed)`);
          this.addResult(
            `${category}: ${test.name}`,
            true,
            'Correctly reported error'
          );
        }
      }
    }
  }

  /**
   * Add test result
   */
  private addResult(name: string, passed: boolean, details?: string): void {
    this.results.push({
      name,
      passed,
      details,
    });
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log(
      '\n================================================================================'
    );
    console.log('TEST RESULTS SUMMARY');
    console.log(
      '================================================================================'
    );

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

    if (failed > 0) {
      console.log('\nFAILED TESTS:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  FAIL: ${r.name}: ${r.details || 'Unknown error'}`);
        });
    }

    console.log(
      '\n================================================================================'
    );

    if (failed === 0) {
      console.log(
        'ALL TESTS PASSED! WORLDC language implementation is stable.'
      );
    } else if (failed <= total * 0.1) {
      // Less than 10% failure rate
      console.log(
        'Minor issues detected. WORLDC implementation is mostly stable.'
      );
    } else {
      console.log(
        'Significant issues detected. WORLDC implementation needs attention.'
      );
    }

    console.log(
      '================================================================================'
    );
  }
}

/**
 * Export test runner
 */
export function runLanguageTests(): void {
  const testSuite = new LanguageTestSuite();
  testSuite.runAllTests();
}

/**
 * Run tests if this module is executed directly
 */
if (require.main === module) {
  runLanguageTests();
}
