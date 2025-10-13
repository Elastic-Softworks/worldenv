# WORLDENV

Web-based game engine powered by TypeScript, AssemblyScript, Three.js, and Pixi.js.

## Overview

WORLDENV is a hybrid game engine designed for high-performance web games. It combines TypeScript for game logic with AssemblyScript for performance-critical operations, providing a development environment that mirrors traditional C/Assembly workflows for the modern web platform.

## Architecture

WORLDENV operates on a dual-layer architecture:

- **High-Level Layer (TypeScript)**: Game logic, scene management, component systems, and engine APIs
- **Performance Layer (AssemblyScript/WASM)**: Physics calculations, collision detection, pathfinding, and computationally intensive operations

The engine supports both 2D and 3D rendering through Pixi.js and Three.js respectively, with the ability to mix rendering modes within a single application.

## Core Technologies

- **TypeScript**: Type-safe game logic and scripting
- **AssemblyScript**: Near-native performance through WebAssembly compilation
- **Three.js**: 3D rendering, materials, lighting, and scene management
- **Pixi.js**: Hardware-accelerated 2D sprite rendering
- **WebAssembly**: Direct execution of performance-critical code
- **WebGL**: GPU-accelerated graphics rendering

## Features

### Rendering

- 2D sprite rendering via Pixi.js
- 3D mesh rendering via Three.js
- Hybrid 2D/3D scene composition
- Shader support for custom visual effects
- Hardware acceleration through WebGL

### Performance

- WebAssembly modules for compute-intensive operations
- AssemblyScript compilation for TypeScript-like syntax at native speeds
- Support for direct WASM integration (C, Rust, or other WASM-compatible languages)
- Optimized rendering pipeline with batching and culling

### Development

- Component-based entity system
- Scene graph architecture
- Asset management and loading
- Event system for decoupled communication
- Hot module replacement during development

### WORLDSRC (Planned)

WORLDSRC is a planned high-level scripting language for WORLDENV. Designed with C-inspired syntax, WORLDSRC will provide engine-specific functions and direct access to the TypeScript/AssemblyScript/Three.js/Pixi.js stack, simplifying game development with purpose-built abstractions.

**Status**: In design phase. See development roadmap for timeline.

## System Requirements

### Minimum

- Modern web browser with WebGL 2.0 support
- 4 GB RAM
- Dual-core 2.0 GHz processor

### Recommended

- Latest Chrome, Firefox, or Edge
- 8 GB RAM
- Quad-core 3.0 GHz processor
- Dedicated GPU with WebGL 2.0 support

## Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Clone and Install

```bash
git clone https://github.com/your-org/worldenv.git
cd worldenv
npm install
```

## Project Structure

```
worldenv/
├── asm/              # AssemblyScript source (compiles to WASM)
├── src/              # TypeScript source
│   ├── core/         # Engine core systems
│   ├── components/   # ECS components
│   ├── scenes/       # Scene management
│   └── main.ts       # Entry point
├── public/           # Static assets
├── build/            # WASM build output
├── dist/             # Production build output
├── scripts/          # Build and development scripts
└── editor/           # WORLDEDIT editor (Electron-based)
```

## Development

### Run Development Server

```bash
npm run dev
```

Starts Vite development server with hot reload at `http://localhost:5173`

### Build AssemblyScript to WASM

```bash
npm run asbuild
```

Compiles AssemblyScript modules in `asm/` to optimized WASM in `build/`

### Production Build

```bash
npm run build
```

Compiles TypeScript and bundles application for production deployment

### Preview Production Build

```bash
npm run preview
```

## Usage

### Basic Game Setup

```typescript
import { Game } from './core/Game';

const game = new Game({
  width: 800,
  height: 600,
  canvasId: 'gameCanvas'
});

await game.init();
game.run();
```

### Using AssemblyScript/WASM

```typescript
// Load WASM module
const wasmModule = await WebAssembly.instantiateStreaming(
  fetch('/build/optimized.wasm')
);

// Call WASM function
const result = wasmModule.instance.exports.calculatePhysics(deltaTime);
```

### Component System

```typescript
import { Entity } from './core/Entity';
import { Transform } from './components/Transform';
import { Sprite } from './components/Sprite';

const entity = new Entity();
entity.addComponent(new Transform(x, y));
entity.addComponent(new Sprite(texture));
```

## Configuration

### TypeScript Configuration

See `tsconfig.json` for TypeScript compiler options. The configuration targets ES2020 with strict type checking enabled.

### AssemblyScript Configuration

See `asconfig.json` for AssemblyScript compilation targets. Includes both debug and release configurations with optimization levels.

### Vite Configuration

See `vite.config.ts` for build and development server configuration.

## Scripts

All scripts located in `scripts/` directory:

- `dev.sh`: Start development server
- `build.sh`: Production build
- `asbuild.sh`: Compile AssemblyScript to WASM
- `test.sh`: Run tests (placeholder)

## WORLDEDIT Editor

WORLDEDIT is the integrated development environment for WORLDENV projects. Built with Electron, it provides visual editing tools, scene management, asset pipeline, and live preview capabilities.

See `editor/README.md` for editor documentation.

**Status**: In development. See `editor/docs/calendar.txt` for development timeline.

## Direct WASM Integration

WORLDENV supports direct WASM module integration from any language that compiles to WebAssembly (C, C++, Rust, etc.). Compile your code to WASM and import it into the engine:

```c
// Example C code
int add(int a, int b) {
  return a + b;
}
```

Compile to WASM and use in WORLDENV:

```typescript
const wasmModule = await WebAssembly.instantiateStreaming(
  fetch('/custom.wasm')
);
const result = wasmModule.instance.exports.add(5, 10);
```

## Performance Optimization

### WebAssembly Best Practices

- Minimize JavaScript ↔ WASM boundary crossings
- Use typed arrays for data exchange
- Batch operations in WASM when possible
- Profile to identify hot paths

### Rendering Optimization

- Use sprite batching for 2D rendering
- Implement frustum culling for 3D scenes
- Optimize draw calls through instancing
- Generate texture atlases for sprite sheets

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14.1+

All browsers must support WebGL 2.0 and WebAssembly.

## Development Roadmap

### Current Status

- Core engine: Pre-Alpha
- WORLDEDIT editor: Pre-Alpha (starting Oct 2025)
- WORLDSRC language: Design phase

### Upcoming Features

- Entity Component System (ECS) improvements
- Physics engine integration
- Audio system enhancements
- Advanced particle systems
- WORLDSRC language implementation
- Visual shader editor
- Animation system

See `editor/docs/calendar.txt` for complete development timeline.

## License

Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0. See `LICENSE.txt` for complete license texts.

## Contributing

Contributions are welcome. Follow the contribution guidelines and code standards defined in the project.

## Documentation

- Engine Overview: `docs/worldenv-overview.md`
- Environment Setup: `docs/worldenv-setup.md`
- Editor Documentation: `editor/README.md`
- Development Calendar: `editor/docs/calendar.txt`

## Support

- Issue Tracker: GitHub Issues
- Documentation: `docs/` directory
- Editor Support: `editor/docs/`

## Acknowledgments

Built with:
- TypeScript by Microsoft
- Three.js by mrdoob and contributors
- Pixi.js by PixiJS team
- AssemblyScript by AssemblyScript contributors
- Vite by Evan You and contributors

## Links

- Repository: [GitHub]
- Documentation: [Link]
- WORLDEDIT Editor: `editor/`
