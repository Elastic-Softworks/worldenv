# WORLDENV Engine Overview

## Introduction

WORLDENV is a hybrid game engine that combines the power of modern web technologies with safety-critical C89 tooling to create a complete game development environment. This guide introduces you to the core architecture and design philosophy of WORLDENV.

## What is WORLDENV?

WORLDENV (World Environment) is a **dual-layer game engine**:

1. **Runtime Layer** (TypeScript/AssemblyScript): The game engine itself
2. **Tooling Layer** (C89 ANSI-C): Development tools and editor

This separation allows for:
- High-performance web-based games
- Robust, safety-critical development tools
- Cross-platform deployment (web, desktop, mobile)
- Professional-grade workflows

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    WORLDENV EDITOR                      │
│                    (C89 ANSI-C)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Scene   │ │  Asset   │ │  Script  │ │  Build   │  │
│  │  Editor  │ │  Manager │ │  Editor  │ │  Pipeline│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ Exports
┌─────────────────────────────────────────────────────────┐
│                   WORLDENV RUNTIME                      │
│              (TypeScript + AssemblyScript)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Core Game Engine                    │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │  │
│  │  │  ECS   │ │ Input  │ │Physics │ │ Audio  │   │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Rendering Engines                      │  │
│  │  ┌─────────────────┐ ┌─────────────────┐        │  │
│  │  │   Pixi.js (2D)  │ │ Three.js (3D)   │        │  │
│  │  └─────────────────┘ └─────────────────┘        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        WebAssembly Performance Layer             │  │
│  │              (AssemblyScript)                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ Runs in
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│                  (Chrome, Firefox, etc.)                │
└─────────────────────────────────────────────────────────┘
```

## Core Technologies

### 1. TypeScript
[TypeScript](https://www.typescriptlang.org/) is a strongly-typed superset of JavaScript that compiles to plain JavaScript.

**Why TypeScript?**
- **Type Safety**: Catch errors at compile-time
- **IntelliSense**: Better IDE support and autocomplete
- **Modern Features**: Classes, interfaces, generics, async/await
- **JavaScript Compatibility**: Use any JavaScript library

**In WORLDENV, TypeScript powers:**
- Game logic and scripting
- Scene management
- Component systems
- High-level engine APIs

**Learn More:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript for Game Development](https://microsoft.github.io/TypeScript-New-Handbook/everything/)

### 2. AssemblyScript
[AssemblyScript](https://www.assemblyscript.org/) is a TypeScript-like language that compiles to WebAssembly.

**Why AssemblyScript?**
- **Near-Native Performance**: Compiled to WebAssembly bytecode
- **TypeScript Syntax**: Familiar for TS developers
- **Low-Level Control**: Direct memory management
- **Fast Math**: SIMD operations for vector math

**In WORLDENV, AssemblyScript handles:**
- Physics calculations
- Collision detection
- Pathfinding algorithms
- Particle system updates
- Audio processing

**Learn More:**
- [AssemblyScript Documentation](https://www.assemblyscript.org/introduction.html)
- [WebAssembly Concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)

### 3. Pixi.js
[Pixi.js](https://pixijs.com/) is a fast 2D rendering library using WebGL.

**Why Pixi.js?**
- **Hardware Acceleration**: WebGL-powered rendering
- **Sprite Batching**: Efficient rendering of thousands of sprites
- **Rich Features**: Filters, masks, blend modes
- **Easy to Use**: Intuitive API similar to Flash/ActionScript

**In WORLDENV, Pixi.js provides:**
- 2D sprite rendering
- Texture management
- Animation systems
- UI rendering
- Particle effects

**Learn More:**
- [Pixi.js Documentation](https://pixijs.download/release/docs/index.html)
- [Pixi.js Examples](https://pixijs.com/examples)

### 4. Three.js
[Three.js](https://threejs.org/) is a comprehensive 3D graphics library.

**Why Three.js?**
- **Complete 3D Engine**: Scene graph, cameras, lights, materials
- **Extensive Loaders**: glTF, FBX, OBJ, and more
- **Post-Processing**: Screen-space effects
- **Active Community**: Thousands of examples and plugins

**In WORLDENV, Three.js handles:**
- 3D rendering and shaders
- Model loading and animation
- Camera systems
- Lighting and shadows
- 3D physics visualization

**Learn More:**
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Fundamentals](https://threejs.org/manual/)

### 5. C89 ANSI-C (Editor)
[C89](https://en.wikipedia.org/wiki/ANSI_C) is the ANSI standard for the C programming language from 1989.

**Why C89?**
- **Reliability**: Decades of proven stability
- **Portability**: Runs on virtually any platform
- **Safety**: Following NASA Power of 10 rules
- **Performance**: Native speed for tool execution
- **Deterministic**: Predictable behavior

**In WORLDENV, C89 provides:**
- Scene editor
- Asset management pipeline
- Build system
- Debugging tools
- Plugin architecture

**Learn More:**
- [C Programming Language (K&R)](https://en.wikipedia.org/wiki/The_C_Programming_Language)
- [NASA Power of 10 Rules](https://spinroot.com/gerard/pdf/P10.pdf)
- [C89 Standard Reference](https://port70.net/~nsz/c/c89/c89-draft.html)

## Engine Components

### Game Class
The central hub of your WORLDENV game. It initializes renderers, manages the game loop, and coordinates all systems.

```typescript
const game = new Game({
    width: 800,
    height: 600,
    canvasId: 'gameCanvas'
});
```

**Responsibilities:**
- Initialize Pixi.js and Three.js renderers
- Manage the game loop (update/render cycle)
- Handle window resizing
- Coordinate scene transitions

### Scene System
Scenes represent different states or levels in your game (menu, gameplay, game over).

**Key Concepts:**
- **Scene Graph**: Hierarchical organization of game objects
- **Scene Transitions**: Smooth loading between scenes
- **Scene Lifecycle**: init(), update(), render(), destroy()

### Entity Component System (ECS)
A data-oriented design pattern for game objects.

**Components:**
- **Entities**: Unique IDs for game objects
- **Components**: Pure data (Transform, Sprite, Rigidbody)
- **Systems**: Logic that operates on components

**Benefits:**
- Composition over inheritance
- Cache-friendly data layout
- Easy to parallelize
- Flexible and modular

### Rendering Pipeline

**2D Pipeline (Pixi.js):**
1. Create PIXI.Application
2. Build display object tree
3. Pixi batches draw calls
4. WebGL renders to canvas

**3D Pipeline (Three.js):**
1. Create THREE.Scene
2. Add meshes, lights, cameras
3. Render loop updates animations
4. WebGL renders with shaders

**Hybrid Rendering:**
WORLDENV can layer 2D UI over 3D scenes or mix 2D/3D elements by managing separate render passes.

### WebAssembly Integration

```typescript
// Load WASM module
const wasm = await WebAssembly.instantiateStreaming(
    fetch('optimized.wasm')
);

// Call WASM function
const result = wasm.instance.exports.add(5, 10);
```

**Performance Critical Paths:**
- Physics stepping
- Collision broad-phase
- Pathfinding
- Procedural generation

## Development Workflow

### 1. Project Structure
```
worldenv/
├── asm/              # AssemblyScript source
│   └── index.ts
├── src/              # TypeScript source
│   ├── core/         # Engine core
│   ├── components/   # ECS components
│   ├── scenes/       # Game scenes
│   └── main.ts       # Entry point
├── public/           # Static assets
├── dist/             # Build output
└── editor/           # C89 editor source
    ├── src/
    └── Makefile
```

### 2. Build Process
```bash
# Development server
npm run dev

# Build WASM modules
npm run asbuild

# Production build
npm run build
```

### 3. Editor Integration
The C89 editor compiles separately and outputs project files that the TypeScript runtime loads.

```
[C89 Editor] → scene.json, assets.json
                    ↓
[TypeScript Runtime] ← Loads and runs
```

## Key Design Patterns

### 1. Component Pattern
Separate data from behavior for flexibility.

```typescript
interface Transform {
    x: number;
    y: number;
    rotation: number;
}

interface Velocity {
    vx: number;
    vy: number;
}
```

### 2. System Pattern
Update logic operates on components.

```typescript
class PhysicsSystem {
    update(entities: Entity[], dt: number) {
        // Update all entities with Transform + Velocity
    }
}
```

### 3. Resource Management
Load assets asynchronously and cache them.

```typescript
class AssetManager {
    async loadTexture(path: string): Promise<Texture> {
        // Load and cache
    }
}
```

### 4. Event System
Decouple game systems with events.

```typescript
eventBus.emit('player_died', { score: 1000 });
eventBus.on('player_died', (data) => {
    // Handle event
});
```

## Performance Considerations

### Memory Management
- **Object Pooling**: Reuse objects instead of allocation
- **Texture Atlases**: Combine sprites to reduce draw calls
- **Geometry Instancing**: Render many copies efficiently

### Frame Budget
Target 60 FPS = 16.67ms per frame:
- **Update**: ~8ms
- **Render**: ~8ms
- **Garbage Collection**: Minimize allocations

### WebAssembly Optimization
- Use typed arrays for data exchange
- Minimize JS ↔ WASM calls
- Batch operations in WASM

## Editor Philosophy (C89)

### Safety Critical Approach
Following NASA's Power of 10 rules ensures:
- No dynamic memory after init
- Bounded loops
- Limited recursion
- Verifiable code

### C-Form Style
The editor uses C-Form formatting:
- Spacious, readable layout
- Educational comments
- Consistent structure
- Self-documenting code

**Example:**
```c
void update_scene(scene_t* scene, float delta_time) {

    int  i;
    
    /* ITERATE THROUGH ALL ENTITIES */
    for  (i = 0; i < scene->entity_count; i++) {
    
        entity_t*  entity;
        
        entity = &scene->entities[i];
        
        /* UPDATE ENTITY TRANSFORM */
        entity->x += entity->vx * delta_time;
        entity->y += entity->vy * delta_time;
        
    }
    
}
```

## Next Steps

Now that you understand WORLDENV's architecture:

1. **[[worldenv-setup|Environment Setup]]** - Install tools and dependencies
2. **[[typescript-basics|TypeScript Basics]]** - Learn the language
3. **[[tutorial-tetris|Build Tetris]]** - Your first WORLDENV game
4. **[[editor-base|Editor Base]]** - Start building C89 tools

## Summary

WORLDENV combines:
- **TypeScript** for game logic
- **AssemblyScript** for performance
- **Pixi.js** for 2D graphics
- **Three.js** for 3D graphics
- **C89** for reliable tooling

This hybrid approach gives you:
- ✅ Web deployment
- ✅ High performance
- ✅ Professional tools
- ✅ Safety-critical reliability
- ✅ Modern developer experience

**Ready to build? Let's start with [[worldenv-setup|Environment Setup]]!**