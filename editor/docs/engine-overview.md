# WORLDENV Engine Overview

## Architecture

WORLDENV uses a dual-layer architecture for web-based game development.

**High-Level Layer (TypeScript)**
- Game logic and scripting
- Scene management
- Entity-component system
- Engine API

**Performance Layer (AssemblyScript/WASM)**
- Physics calculations
- Collision detection
- Pathfinding
- Compute-intensive operations

## Core Technologies

- **TypeScript**: Type-safe game development
- **AssemblyScript**: Near-native performance via WebAssembly
- **Three.js**: 3D rendering engine
- **Pixi.js**: 2D sprite rendering
- **WebAssembly**: Direct WASM module support
- **WORLDSRC**: High-level scripting language (planned)

## Rendering

### 2D (Pixi.js)
- Hardware-accelerated sprite rendering
- Texture management
- Particle systems
- UI rendering

### 3D (Three.js)
- Mesh rendering
- Material system
- Lighting and shadows
- Camera controls

### Hybrid
- 2D UI over 3D scenes
- Mixed 2D/3D elements
- Separate render passes

## Entity Component System

**Entities**: Unique identifiers for game objects
**Components**: Pure data structures (Transform, Sprite, RigidBody)
**Systems**: Logic operating on components

Benefits:
- Composition over inheritance
- Cache-friendly data layout
- Flexible and modular

## Scene System

Scenes represent game states (menu, gameplay, game over).

**Lifecycle**:
1. init() - Initialize scene
2. update(dt) - Update logic
3. render() - Render frame
4. destroy() - Cleanup

## Game Loop

```typescript
const game = new Game({
  width: 800,
  height: 600,
  canvasId: 'gameCanvas'
});

await game.init();
game.run();
```

Target: 60 FPS (16.67ms per frame)
- Update: ~8ms
- Render: ~8ms

## WebAssembly Integration

Load and execute WASM modules from any language (C, Rust, AssemblyScript).

```typescript
const wasm = await WebAssembly.instantiateStreaming(
  fetch('module.wasm')
);
const result = wasm.instance.exports.function(args);
```

## Performance Optimization

- Object pooling for frequent allocations
- Texture atlases for sprite batching
- Frustum culling for 3D scenes
- Typed arrays for data exchange
- Minimize JS ↔ WASM boundary crossings

## Project Structure

```
worldenv/
├── asm/              # AssemblyScript source
├── src/              # TypeScript source
│   ├── core/         # Engine core
│   ├── components/   # ECS components
│   └── scenes/       # Game scenes
├── public/           # Static assets
├── build/            # WASM output
├── dist/             # Production build
└── editor/           # WORLDEDIT editor
```

## Development Workflow

1. Write TypeScript for game logic
2. Write AssemblyScript for performance-critical code
3. Compile AssemblyScript to WASM
4. Bundle with Vite
5. Deploy to web

## WORLDSRC Language

C-inspired scripting language for WORLDENV (in development).

**Features**:
- C-like syntax
- Type-safe
- Compiles to TypeScript/AssemblyScript
- Engine-specific built-ins
- Zero-cost abstractions

**Status**: Design phase. Lexer and parser foundation in pre-alpha.

## Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14.1+

Requirements: WebGL 2.0 and WebAssembly support

## References

- Engine setup: `docs/engine-setup.md`
- WORLDEDIT editor: `editor/README.md`
- WORLDSRC manual: `editor/docs/worldsrc/worldsrc-manual.md`
- Development calendar: `editor/docs/calendar.txt`
