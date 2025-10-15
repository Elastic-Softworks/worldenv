# WORLDSRC

**High-level hybrid programming language for WORLDENV game development**

WORLDSRC is a C/C++/TypeScript hybrid programming language specifically designed for the WORLDENV game engine. It combines the familiar syntax of C and C++ with TypeScript's type system, providing engine-specific functions and direct access to the TypeScript/AssemblyScript/Three.js/Pixi.js stack.

## Overview

WORLDSRC simplifies game development by providing:

- **Hybrid Syntax**: Write C, C++, and TypeScript code in the same file
- **Engine Integration**: Direct access to WORLDENV engine APIs
- **Multi-target Compilation**: Compiles to TypeScript and AssemblyScript
- **Professional Tooling**: Full IDE support with Language Server Protocol
- **Real-time Compilation**: Incremental builds with hot-reload
- **Type Safety**: Advanced type system with pointers, arrays, and generics

## Language Features

### Hybrid Programming Model

```worldsrc
// C-style function declaration
int calculateDamage(int baseDamage, float multiplier) {
    return (int)(baseDamage * multiplier);
}

// TypeScript-style interface
interface Player {
    health: number;
    position: Vector3;
    inventory: Item[];
}

// C++ template syntax
template<typename T>
class Component {
    T data;
    void update(T newData) { data = newData; }
};
```

### Engine Integration

```worldsrc
// Direct engine API access
Entity player = Engine.createEntity("Player");
player.addComponent<Transform>(Vector3(0, 0, 0));
player.addComponent<SpriteRenderer>("player.png");

// Scene management
Scene* currentScene = SceneManager.getActiveScene();
currentScene->addEntity(player);

// Input handling
if (Input.isKeyPressed(KeyCode.SPACE)) {
    player.getComponent<RigidBody>().addForce(Vector3(0, 10, 0));
}
```

### Performance-Critical Code

```worldsrc
/* 
         Physics Calculation Function
           ---
           this function demonstrates WORLDSRC's ability
           to compile to AssemblyScript for performance-
           critical operations. it applies gravity to
           an array of 3D positions efficiently.
*/

@asmjs
float* calculatePhysics(float* positions, int count, float deltaTime) {

  /* iterate through all position vectors and apply
     gravitational acceleration to the Y component */
     
  for  (int i = 0; i < count; i++) {
  
    positions[i * 3 + 1] += -9.81f * deltaTime;  /* apply gravity force */
    
  }
  
  return positions;
  
}
```

## Installation

### Standalone Installation

```bash
npm install -g @worldenv/worldsrc
```

### As Project Dependency

```bash
npm install @worldenv/worldsrc
```

### From Source

```bash
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv/worldsrc
npm install
npm run build
```

## Quick Start

### 1. Create a WORLDSRC File

Create `hello.wsrc`:

```worldsrc
/* 
   ===============================================
   WORLDSRC Hello World Example
   ===============================================
*/

#include <worldenv.h>

/* 
         Game Initialization
           ---
           this function demonstrates basic entity creation
           and component assignment. it creates a text entity
           that displays a welcome message at the origin
           of the game world.
*/

void start() {

  Entity text = Engine.createEntity("HelloText");
  
  text.addComponent<TextRenderer>("Hello, WORLDSRC!");        /* display text */
  text.getComponent<Transform>().position = Vector3(0, 0, 0); /* center position */
  
}

/* 
         Game Update Loop
           ---
           this function runs every frame and handles
           basic input processing. pressing escape will
           cleanly exit the application.
*/

void update(float deltaTime) {

  /* check for escape key to quit application */
  
  if  (Input.isKeyPressed(KeyCode.ESCAPE)) {
  
    Engine.quit();
    
  }
  
}
```

### 2. Compile the Code

```bash
worldsrc compile hello.wsrc --target typescript
```

### 3. Generated Output

WORLDSRC generates optimized TypeScript:

```typescript
import { Engine, Entity, Transform, TextRenderer, Vector3, Input, KeyCode } from '@worldenv/engine';

export function start(): void {
    const text: Entity = Engine.createEntity("HelloText");
    text.addComponent(new TextRenderer("Hello, WORLDSRC!"));
    text.getComponent(Transform).position = new Vector3(0, 0, 0);
}

export function update(deltaTime: number): void {
    if (Input.isKeyPressed(KeyCode.ESCAPE)) {
        Engine.quit();
    }
}
```

## Compilation Targets

### TypeScript Output
```bash
worldsrc compile game.wsrc --target typescript --output dist/game.ts
```

### AssemblyScript Output
```bash
worldsrc compile physics.wsrc --target assemblyscript --output dist/physics.as
```

### Web Bundle
```bash
worldsrc build project/ --target web --output dist/web/
```

### Desktop Application
```bash
worldsrc build project/ --target desktop --output dist/desktop/
```

## IDE Integration

### Visual Studio Code

1. Install the WORLDSRC extension:
```bash
worldsrc setup vscode
```

2. Features include:
   - Syntax highlighting
   - IntelliSense and autocompletion
   - Real-time error checking
   - Go-to-definition
   - Debugging support

### Other Editors

WORLDSRC provides Language Server Protocol support for:

- **WebStorm/IntelliJ**: `worldsrc setup webstorm`
- **Vim/Neovim**: `worldsrc setup vim`
- **Emacs**: `worldsrc setup emacs`
- **Sublime Text**: `worldsrc setup sublime`

## Command Line Interface

### Compilation Commands

```bash
# Compile single file
worldsrc compile input.wsrc

# Compile with specific target
worldsrc compile input.wsrc --target typescript

# Compile project
worldsrc build ./src --output ./dist

# Watch mode
worldsrc watch ./src --output ./dist
```

### Language Server

```bash
# Start language server
worldsrc lsp --stdio

# Start debug adapter
worldsrc dap --port 4711
```

### Project Management

```bash
# Initialize new project
worldsrc init my-game

# Add WORLDSRC to existing project
worldsrc init --existing

# Validate project
worldsrc validate
```

## Configuration

### Project Configuration (worldsrc.json)

```json
{
  "name": "my-game",
  "version": "1.0.0",
  "targets": {
    "typescript": {
      "outputDir": "dist/ts",
      "optimization": "development"
    },
    "assemblyscript": {
      "outputDir": "dist/as",
      "optimization": "release"
    }
  },
  "include": ["src/**/*.wsrc"],
  "exclude": ["src/**/*.test.wsrc"],
  "engine": {
    "version": "^0.1.0",
    "features": ["2d", "3d", "physics"]
  }
}
```

### Compiler Options

```bash
# Optimization levels
worldsrc compile --optimization none|basic|full

# Debug information
worldsrc compile --debug --source-maps

# Type checking
worldsrc compile --strict --no-implicit-any

# Output formatting
worldsrc compile --format esm|cjs|umd
```

## Integration with WORLDEDIT

WORLDSRC is designed to work seamlessly with the WORLDEDIT editor:

1. **Script Editor**: Syntax highlighting and IntelliSense
2. **Real-time Compilation**: Immediate feedback on code changes
3. **Debugging**: Integrated debugging with breakpoints
4. **Hot Reload**: Live code updates during development

## Performance

WORLDSRC provides multiple performance optimization strategies:

- **Incremental Compilation**: Only recompile changed files
- **Tree Shaking**: Eliminate unused code
- **Dead Code Elimination**: Remove unreachable code
- **Assembly Optimization**: Direct AssemblyScript for critical paths
- **Caching**: Intelligent build caching

## Type System

### Basic Types

```worldsrc
int health = 100;
float speed = 5.5f;
bool isAlive = true;
string name = "Player";
```

### Pointers and References

```worldsrc
int* healthPtr = &health;
Entity& playerRef = player;
```

### Arrays and Collections

```worldsrc
int[10] inventory;
Vector3[] positions = new Vector3[100];
Array<Entity> enemies;
```

### Generics and Templates

```worldsrc
template<typename T>
class Pool {
    T[] items;
    T get() { return items.pop(); }
    void release(T item) { items.push(item); }
};

Pool<Bullet> bulletPool;
```

## Error Handling

WORLDSRC provides comprehensive error handling:

```worldsrc
try {
    Entity entity = SceneManager.findEntity("Player");
    entity.destroy();
} catch (EntityNotFoundException e) {
    Logger.error("Player not found: " + e.message);
} finally {
    SceneManager.cleanup();
}
```

## Documentation

- **Language Manual**: Comprehensive language reference
- **API Documentation**: Complete engine API documentation
- **Tutorials**: Step-by-step learning guides
- **Examples**: Sample projects and code snippets
- **Troubleshooting**: Common issues and solutions

## Contributing

WORLDSRC is part of the WORLDENV project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards (C-Form style)
4. Add tests for new features
5. Submit a pull request

## License

Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0.
See LICENSE.txt for complete license texts.

## Support

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Complete guides and references
- **Community**: Discord server and forums
- **Professional**: Commercial support available

## Roadmap

### Current Status: Alpha Phase 19 Complete

- Complete lexical analysis and parsing
- Semantic analysis and type checking
- Multi-target code generation
- Language Server Protocol support
- Debug Adapter Protocol support
- Real-time compilation pipeline
- Professional IDE integration

### Upcoming Features

- Enhanced optimization passes
- WebAssembly direct compilation
- Mobile platform support
- Cloud compilation services
- Advanced debugging features
- Performance profiling tools

---

**WORLDSRC** - Bridging the gap between low-level performance and high-level productivity in game development.