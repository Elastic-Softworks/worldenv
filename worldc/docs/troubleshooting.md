# WORLDC Troubleshooting Guide

*WORLDC Language Implementation - Alpha Development*

## Overview

This guide provides solutions for common issues encountered when using the WORLDC C/C++/TypeScript hybrid language. WORLDC combines syntax from C, C++, and TypeScript to create a unified language for game development with Three.js and Pixi.js integration.

## Common Issues

### Lexical Analysis Errors

#### Unterminated String Literals

**Problem:**
```
ERROR:LEXICAL_ERROR: Unterminated template string
```

**Cause:** Missing closing quote or backtick in string literals.

**Solution:**
```c
// Incorrect
const message = "Hello World;

// Correct
const message = "Hello World";

// Incorrect template string
const greeting = `Hello ${name};

// Correct template string
const greeting = `Hello ${name}`;
```

#### Invalid Character Sequences

**Problem:**
```
ERROR:LEXICAL_ERROR: Unexpected character: @
```

**Cause:** Using unsupported characters in code.

**Solution:**
- Remove or replace unsupported characters
- Check for copy-paste errors from other languages
- Ensure proper UTF-8 encoding

#### Invalid Number Formats

**Problem:**
```
ERROR:LEXICAL_ERROR: Invalid hexadecimal number
```

**Cause:** Malformed numeric literals.

**Solution:**
```c
// Incorrect
int value = 0x;
int binary = 0b;

// Correct
int value = 0xFF;
int binary = 0b1010;
float decimal = 3.14159f;
```

### Syntax Errors

#### Mismatched Braces

**Problem:**
```
ERROR:SYNTAX_ERROR: Expected '}' but found EOF
```

**Cause:** Missing closing braces, parentheses, or brackets.

**Solution:**
```c
// Incorrect
if (condition) {
    doSomething();
// Missing closing brace

// Correct
if (condition) {
    doSomething();
}
```

#### Invalid Function Declarations

**Problem:**
```
ERROR:SYNTAX_ERROR: Expected identifier after 'function'
```

**Cause:** Malformed function syntax mixing different language styles incorrectly.

**Solution:**
```c
// Incorrect - mixing syntax incorrectly
function int getValue() {
    return 42;
}

// Correct C-style
int getValue() {
    return 42;
}

// Correct TypeScript-style
function getValue(): number {
    return 42;
}
```

#### Template Syntax Errors

**Problem:**
```
ERROR:SYNTAX_ERROR: Invalid template declaration
```

**Cause:** Incorrect C++ template syntax.

**Solution:**
```cpp
// Incorrect
template<T>
class Container {
    T value;
};

// Correct
template<typename T>
class Container {
    T value;
};

// Also correct
template<class T>
class Container {
    T value;
};
```

### Mixed Language Issues

#### Interface Implementation Conflicts

**Problem:**
```
ERROR:SEMANTIC_ERROR: Class cannot implement both C++ inheritance and TypeScript interface
```

**Cause:** Conflicting inheritance patterns.

**Solution:**
```cpp
// Incorrect - conflicting patterns
class Player : public Entity implements IUpdateable {
    // ...
};

// Correct - choose one pattern
class Player : public Entity, public IUpdateable {
    // C++ multiple inheritance
};

// Or use composition
class Player : public Entity {
    private IUpdateable updateable;
    // ...
};
```

#### Type Annotation Conflicts

**Problem:**
```
ERROR:TYPE_ERROR: Cannot mix C and TypeScript parameter syntax
```

**Cause:** Mixing parameter declaration styles incorrectly.

**Solution:**
```c
// Incorrect
int processData(int count, name: string) {
    // ...
}

// Correct - consistent C style
int processData(int count, char* name) {
    // ...
}

// Correct - consistent TypeScript style
function processData(count: number, name: string): number {
    // ...
}
```

### Compilation Errors

#### Missing Headers

**Problem:**
```
ERROR:COMPILATION_ERROR: 'printf' is not defined
```

**Cause:** Missing include directives for standard library functions.

**Solution:**
```c
// Add appropriate includes
#include <stdio.h>      // For printf, scanf, etc.
#include <stdlib.h>     // For malloc, free, etc.
#include <string.h>     // For strlen, strcpy, etc.
#include <math.h>       // For sin, cos, sqrt, etc.

// WORLDC game engine headers
#include <world-render3d.h>  // For 3D rendering
#include <world-render2d.h>  // For 2D rendering
#include <world-input.h>     // For input handling

int main() {
    printf("Hello, WORLDC!\n");
    return 0;
}
```

#### Undefined WORLDC Functions

**Problem:**
```
ERROR:COMPILATION_ERROR: 'display_create' is not defined
```

**Cause:** Missing WORLDC engine includes or incorrect function names.

**Solution:**
```c
#include <world-display.h>

int main() {
    // Correct function call
    Display* display = display_create(1920, 1080, "Game Window");
    
    // Don't forget cleanup
    display_destroy(display);
    return 0;
}
```

### Runtime Issues

#### Memory Management Errors

**Problem:**
```
ERROR:RUNTIME_ERROR: Segmentation fault in malloc
```

**Cause:** Improper memory allocation or deallocation.

**Solution:**
```c
// Correct memory management pattern
void* ptr = malloc(sizeof(int) * 100);
if (ptr == NULL) {
    printf("Memory allocation failed\n");
    return -1;
}

// Use the memory
int* numbers = (int*)ptr;
for (int i = 0; i < 100; i++) {
    numbers[i] = i;
}

// Always free when done
free(ptr);
ptr = NULL;  // Prevent double-free
```

#### Null Pointer Dereference

**Problem:**
```
ERROR:RUNTIME_ERROR: Null pointer dereference
```

**Cause:** Accessing memory through null pointers.

**Solution:**
```c
// Always check pointers before use
Display* display = display_create(800, 600, "Game");
if (display != NULL) {
    // Safe to use display
    display_poll_events(display);
    display_destroy(display);
} else {
    printf("Failed to create display\n");
}
```

## Performance Issues

### Slow Compilation

**Problem:** WORLDC compilation takes too long.

**Solutions:**
1. Reduce template instantiations
2. Use forward declarations where possible
3. Break large files into smaller modules
4. Enable compiler optimizations

```c
// Use forward declarations
class Renderer3D;  // Forward declaration
class Entity;      // Forward declaration

// Instead of including full headers in header files
#include "renderer.h"  // Only in implementation files
```

### Runtime Performance

**Problem:** Poor game performance with WORLDC code.

**Solutions:**
1. Profile hot code paths
2. Use appropriate data structures
3. Minimize memory allocations in game loops
4. Cache frequently accessed data

```c
// Cache expensive operations
static float cached_sine_table[360];
static bool table_initialized = false;

float fast_sine(int degrees) {
    if (!table_initialized) {
        for (int i = 0; i < 360; i++) {
            cached_sine_table[i] = sin(i * PI / 180.0f);
        }
        table_initialized = true;
    }
    return cached_sine_table[degrees % 360];
}
```

## Debugging Tips

### Enable Verbose Logging

```c
// Set error handler configuration
globalErrorHandler.configure({
    maxErrors: 100,
    logToFile: true,
    logToConsole: true
});
```

### Use Debug Builds

Compile with debug information enabled:
```bash
# Enable debug mode
npm run build -- --debug

# Run with verbose output
WORLDC_DEBUG=1 npm run dev
```

### Add Assertions

```c
#include <assert.h>

void process_array(int* arr, int size) {
    assert(arr != NULL);     // Check for null pointer
    assert(size > 0);        // Check for valid size
    
    for (int i = 0; i < size; i++) {
        assert(i < size);    // Bounds checking
        arr[i] = i * 2;
    }
}
```

### Memory Debugging

```c
// Enable memory tracking in debug builds
#ifdef DEBUG
    #define MALLOC(size) debug_malloc(size, __FILE__, __LINE__)
    #define FREE(ptr) debug_free(ptr, __FILE__, __LINE__)
#else
    #define MALLOC(size) malloc(size)
    #define FREE(ptr) free(ptr)
#endif
```

## Editor Integration Issues

### Monaco Editor Problems

**Problem:** WORLDC syntax highlighting not working.

**Solution:**
1. Check Monaco language registration
2. Verify grammar files are loaded
3. Restart the editor application

**Problem:** IntelliSense not providing WORLDC suggestions.

**Solution:**
1. Update language service configuration
2. Rebuild TypeScript definitions
3. Clear editor cache

### Build System Issues

**Problem:** WORLDC files not being processed during build.

**Solution:**
```json
// Check vite.config.ts
export default defineConfig({
  plugins: [
    // Ensure WORLDC plugin is registered
    worldcPlugin({
      include: ['**/*.wc'],
      typescript: true,
      cpp: true
    })
  ]
});
```

## Known Limitations

### Current Alpha Limitations

1. **Limited Standard Library**: Not all C standard library functions implemented
2. **Template Constraints**: Complex template metaprogramming not fully supported
3. **Preprocessor**: Limited preprocessor directive support
4. **Debugging**: Source maps not yet generated for compiled output

### Workarounds

```c
// For unsupported standard library functions
#ifndef WORLDC_HAS_QSORT
void my_sort(int* arr, int size) {
    // Simple bubble sort implementation
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
#endif
```

## Getting Help

### Error Reporting

When reporting issues, include:

1. Complete error message
2. WORLDC code that causes the issue
3. Expected vs actual behavior
4. System information (OS, Node.js version)
5. WORLDENV version

### Log Files

Error logs are automatically saved:
- **Browser**: localStorage key `worldc-error-log`
- **Node.js**: `worldc-errors.log` in project root

### Community Resources

- GitHub Issues: Report bugs and feature requests
- Documentation: `/docs/worldc/` directory
- Examples: `/editor/src/worldc/examples/` directory

## Emergency Recovery

### Compiler Crash Recovery

If the WORLDC compiler crashes:

1. Save your work immediately
2. Check error logs for crash details
3. Try compiling smaller code sections
4. Restart the editor if necessary

```bash
# Emergency backup
cp your-file.wc your-file.wc.backup

# Clear compiler cache
rm -rf .worldc-cache/

# Restart with clean state
npm run dev -- --clean
```

### Corrupted Project Recovery

```bash
# Restore from git if available
git checkout HEAD -- .

# Or restore from backup
cp -r project-backup/* .

# Clean rebuild
npm run clean
npm run build
```

## Best Practices

### Error Prevention

1. **Always validate input parameters**
2. **Use const correctness in C++**
3. **Initialize all variables**
4. **Check return values**
5. **Use RAII for resource management**

### Code Organization

```c
// Organize code in logical sections
#include <stdio.h>          /* Standard library first */
#include <world-render3d.h> /* WORLDC libraries */
#include "game.h"           /* Project headers last */

/* Constants and macros */
#define MAX_ENTITIES 1000
const float GRAVITY = -9.81f;

/* Type definitions */
typedef struct {
    vec3 position;
    vec3 velocity;
} Entity;

/* Function declarations */
int init_game(void);
void update_game(float deltaTime);
void cleanup_game(void);

/* Implementation */
int main() {
    // Main game loop
}
```

### Performance Guidelines

1. **Minimize allocations in game loops**
2. **Use stack allocation when possible**
3. **Cache expensive calculations**
4. **Profile before optimizing**
5. **Use appropriate data structures**

This troubleshooting guide covers the most common issues encountered with WORLDC. For additional help, consult the language manual and lexicon documentation.