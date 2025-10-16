/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         test-codegen.ts
           ---
           test and demonstration file for WORLDSRC code generation.

           this module provides examples and tests for the
           code generation system, showing how to use the
           compilation pipeline and output management for
           different targets.

*/

import {
  WorldCCodeGenerator,
  CodeGeneratorFactory,
  CompilationTarget,
  OptimizationLevel,
  CodeGenerationUtilities,
} from './index';

/*
    ====================================
             --- TEST DATA ---
    ====================================
*/

const SAMPLE_WORLDSRC_CODE = `
// WORLDSRC hybrid language example
#include <stdio.h>
#include "worldenv.h"

// C-style function with TypeScript-like features
int calculate_damage(int base_damage, float multiplier): number {

    // C-style variable declarations with TypeScript types
    int   result = 0;
    float calculated = 0.0f;

    // Hybrid syntax combining C and TypeScript
    calculated = base_damage * multiplier;

    if (calculated > INT_MAX) {
        return INT_MAX;
    } else {
        result = (int)calculated;
    }

    return result;
}

// TypeScript-style class with C++ features
class GameEntity {

    private int    health;
    private float  x, y, z;
    private string name;

    // Constructor using C++ syntax
    GameEntity(string entity_name, int initial_health) {
        this.name = entity_name;
        this.health = initial_health;
        this.x = 0.0f;
        this.y = 0.0f;
        this.z = 0.0f;
    }

    // Method with TypeScript-style type annotations
    public takeDamage(damage: number): boolean {

        this.health -= damage;

        if (this.health <= 0) {
            this.health = 0;
            return true;  // entity destroyed
        }

        return false;
    }

    // C++-style getter
    int getHealth() const {
        return this.health;
    }

    // TypeScript-style method
    public move(dx: number, dy: number, dz: number): void {
        this.x += dx;
        this.y += dy;
        this.z += dz;
    }

}

// Main function combining all paradigms
int main(): void {

    // Create game entity
    GameEntity player("Player", 100);

    // Calculate damage using C-style function
    int damage = calculate_damage(25, 1.5f);

    // Apply damage using TypeScript-style method
    bool destroyed = player.takeDamage(damage);

    if (destroyed) {
        printf("Player destroyed!\\n");
    } else {
        printf("Player health: %d\\n", player.getHealth());
    }

    // Move player using TypeScript method
    player.move(10.0, 0.0, 5.0);

    return 0;
}
`;

/*
    ====================================
             --- TESTS ---
    ====================================
*/

/*

         runCodeGenerationTests()
           ---
           runs comprehensive tests of the code generation
           system including all targets and configurations.

*/

export async function runCodeGenerationTests(): Promise<void> {
  console.log('='.repeat(50));
  console.log('WORLDSRC Code Generation Tests');
  console.log('='.repeat(50));

  /* test 1: basic TypeScript generation */
  console.log('\n1. Testing TypeScript Generation...');
  await testTypeScriptGeneration();

  /* test 2: AssemblyScript generation */
  console.log('\n2. Testing AssemblyScript Generation...');
  await testAssemblyScriptGeneration();

  /* test 3: multi-target compilation */
  console.log('\n3. Testing Multi-Target Compilation...');
  await testMultiTargetCompilation();

  /* test 4: source validation */
  console.log('\n4. Testing Source Validation...');
  await testSourceValidation();

  /* test 5: output management */
  console.log('\n5. Testing Output Management...');
  await testOutputManagement();

  /* test 6: error handling */
  console.log('\n6. Testing Error Handling...');
  await testErrorHandling();

  console.log('\n' + '='.repeat(50));
  console.log('Code Generation Tests Complete');
  console.log('='.repeat(50));
}

/*

         test implementations

*/

async function testTypeScriptGeneration(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault();

    const result = await generator.compileToTypeScript(
      SAMPLE_WORLDSRC_CODE,
      'test-game.wsrc'
    );

    if (result.success) {
      console.log('  PASS: TypeScript generation successful');
      console.log(`  Generated code length: ${result.code.length} characters`);
    } else {
      console.log('  FAIL: TypeScript generation failed');
      console.log('  Errors:', result.errors);
    }
  } catch (error) {
    console.log(`  FAIL: TypeScript generation exception: ${error}`);
  }
}

async function testAssemblyScriptGeneration(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault();

    const result = await generator.compileToAssemblyScript(
      SAMPLE_WORLDSRC_CODE,
      'test-game.wsrc'
    );

    if (result.success) {
      console.log('  PASS: AssemblyScript generation successful');
      console.log(`  Generated code length: ${result.code.length} characters`);
    } else {
      console.log('  FAIL: AssemblyScript generation failed');
      console.log('  Errors:', result.errors);
    }
  } catch (error) {
    console.log(`  FAIL: AssemblyScript generation exception: ${error}`);
  }
}

async function testMultiTargetCompilation(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault();

    const targets = [
      CompilationTarget.TYPESCRIPT,
      CompilationTarget.ASSEMBLYSCRIPT,
    ];

    const result = await generator.compileMultiTarget(
      SAMPLE_WORLDSRC_CODE,
      targets,
      {
        filename: 'multi-target-test.wsrc',
        optimizationLevel: OptimizationLevel.BASIC,
      }
    );

    if (result.success) {
      console.log('  PASS: Multi-target compilation successful');
      console.log(`  Generated ${result.results.size} target outputs`);

      for (const [target, targetResult] of result.results) {
        console.log(
          `    ${target}: ${targetResult.success ? 'success' : 'failed'} (${targetResult.files.length} files)`
        );
      }
    } else {
      console.log('  FAIL: Multi-target compilation failed');
      console.log('  Errors:', result.errors);
    }
  } catch (error) {
    console.log(`  FAIL: Multi-target compilation exception: ${error}`);
  }
}

async function testSourceValidation(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault();

    /* test valid code */
    const validResult = await generator.validateSource(
      SAMPLE_WORLDSRC_CODE,
      'valid.wsrc'
    );
    console.log(
      `  Valid code: ${validResult.valid ? 'PASS' : 'FAIL'} (${validResult.errors.length} errors, ${validResult.warnings.length} warnings)`
    );

    /* test invalid code */
    const invalidCode = `
      // Invalid WORLDSRC code
      int broken_function( {
        invalid syntax here
        return "this won't work";
      }
    `;

    const invalidResult = await generator.validateSource(
      invalidCode,
      'invalid.wsrc'
    );
    console.log(
      `  Invalid code: ${!invalidResult.valid ? 'PASS' : 'FAIL'} (${invalidResult.errors.length} errors expected)`
    );
  } catch (error) {
    console.log(`  FAIL: Source validation exception: ${error}`);
  }
}

async function testOutputManagement(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault('./test-output');

    const result = await generator.compile({
      sourceCode: SAMPLE_WORLDSRC_CODE,
      filename: 'output-test.wsrc',
      targets: CompilationTarget.TYPESCRIPT,
      outputDirectory: './test-output',
      sourceMaps: true,
      minify: false,
    });

    if (result.success) {
      console.log('  PASS: Output management successful');
      console.log(`  Created ${result.files.length} files`);

      for (const file of result.files) {
        console.log(`    - ${file}`);
      }
    } else {
      console.log('  FAIL: Output management failed');
      console.log('  Errors:', result.errors);
    }
  } catch (error) {
    console.log(`  FAIL: Output management exception: ${error}`);
  }
}

async function testErrorHandling(): Promise<void> {
  try {
    const generator = CodeGeneratorFactory.createDefault();

    /* test with empty source code */
    const emptyResult = await generator.compile({
      sourceCode: '',
      targets: CompilationTarget.TYPESCRIPT,
    });

    console.log(
      `  Empty source: ${!emptyResult.success ? 'PASS' : 'FAIL'} (error handling worked)`
    );

    /* test with unsupported features */
    const unsupportedCode = `
      // Code with potentially unsupported features
      template<typename T>
      class TemplateClass {
        #pragma once
        goto label;
        label: return;
      }
    `;

    const unsupportedResult = await generator.compile({
      sourceCode: unsupportedCode,
      targets: CompilationTarget.TYPESCRIPT,
    });

    console.log(
      `  Unsupported features: handled with ${unsupportedResult.warnings.length} warnings`
    );
  } catch (error) {
    console.log(`  FAIL: Error handling exception: ${error}`);
  }
}

/*
    ====================================
             --- UTILITIES ---
    ====================================
*/

/*

         demonstrateUtilities()
           ---
           demonstrates utility functions for code generation.

*/

export async function demonstrateUtilities(): Promise<void> {
  console.log('\n' + '-'.repeat(40));
  console.log('Code Generation Utilities Demo');
  console.log('-'.repeat(40));

  /* test utility functions */
  try {
    /* validate using utility */
    const isValid =
      await CodeGenerationUtilities.validateString(SAMPLE_WORLDSRC_CODE);
    console.log(`Source validation: ${isValid ? 'valid' : 'invalid'}`);

    /* compile using utility */
    const compiledCode = await CodeGenerationUtilities.compileString(
      SAMPLE_WORLDSRC_CODE,
      CompilationTarget.TYPESCRIPT
    );
    console.log(`Compiled successfully: ${compiledCode.length > 0}`);

    /* show default options */
    const defaultOptions = CodeGenerationUtilities.getDefaultOptions();
    console.log('Default options:', {
      target: defaultOptions.target,
      optimization: defaultOptions.optimizationLevel,
      sourceMaps: defaultOptions.sourceMaps,
    });
  } catch (error) {
    console.log(`Utilities demo error: ${error}`);
  }
}

/*

         showGeneratorInfo()
           ---
           displays information about available code generators.

*/

export function showGeneratorInfo(): void {
  console.log('\n' + '-'.repeat(40));
  console.log('Available Code Generators');
  console.log('-'.repeat(40));

  const generator = CodeGeneratorFactory.createDefault();
  const generators = generator.getGeneratorInfo();

  for (const gen of generators) {
    const status = gen.supported ? 'SUPPORTED' : 'NOT SUPPORTED';
    console.log(`${status} ${gen.target}: ${gen.name} v${gen.version}`);
  }

  console.log(
    `\nSupported targets: ${generator.getSupportedTargets().join(', ')}`
  );
}

/*

         main test runner

*/

export async function runAllTests(): Promise<void> {
  showGeneratorInfo();
  await demonstrateUtilities();
  await runCodeGenerationTests();
}

/* end of test file */

/*
    ====================================
             --- EOF ---
    ====================================
*/
