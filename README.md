![WORLDENV Logo](https://github.com/Elastic-Softworks/worldenv/blob/master/gh/b-logo-fit-trans.png)


WORLDENV is a game development ecosystem consisting of **WORLDEDIT** (a visual editor) and **WORLDC** (a programming language). This monorepo contains both components organized for standalone use and integrated development.

## Project Structure

```
worldenv/
├── README.md                 # This file - project overview
├── .gitignore               # Git ignore patterns
├── editor/                  # WORLDEDIT - Visual game editor
│   ├── README.md           # Editor-specific documentation
│   ├── package.json        # Editor dependencies and scripts
│   ├── src/                # Editor source code
│   ├── dist/               # Built editor application
│   └── docs/               # Editor documentation
│       ├── QUICKSTART.md
│       ├── USER-GUIDE.md
│       ├── DEVELOPER-GUIDE.md
│       ├── TROUBLESHOOTING.md
│       └── API-REFERENCE.md
└── worldc/                 # WORLDC - Programming language
    ├── README.md           # Language-specific documentation
    ├── package.json        # Language tooling dependencies
    ├── src/                # Language implementation
    ├── dist/               # Compiled language tools
    ├── docs/               # Language documentation
    ├── tests/              # Language test suites
    └── examples/           # Code examples
```

## Components

### WORLDEDIT - Visual Editor

**Electron-based game editor with real-time rendering**

- Dockable panels, customizable workspace
- Scene editor with viewport and transform manipulators
- Entity-Component System for game object architecture
- Asset browser with file management and preview
- Script editor with WORLDC integration and syntax highlighting
- Play mode for real-time testing
- Multi-platform build system

**Quick Start**: See [`editor/README.md`](editor/README.md) for detailed information.

### WORLDC - Hybrid Programming Language

**C/C++/TypeScript hybrid language for game development**

- C/C++ syntax with TypeScript type system
- Compiles to TypeScript and AssemblyScript
- Direct access to WORLDENV APIs
- LSP support for IDE integration
- Hot compilation with optimization passes
- Type system with generics and pointers

**Quick Start**: See [`worldc/README.md`](worldc/README.md) for detailed information.

## System Requirements

### Minimum Requirements

- **CPU**: Dual-core 2.0 GHz
- **RAM**: 4 GB
- **GPU**: OpenGL 3.3 / WebGL 2.0 support
- **Storage**: 1 GB free space
- **OS**: Windows 10, macOS 10.14, Ubuntu 18.04 (or equivalent)

### Recommended Requirements

- **CPU**: Quad-core 3.0 GHz
- **RAM**: 8 GB
- **GPU**: Dedicated graphics with 2 GB VRAM
- **Storage**: 4 GB free space (for projects and assets)
- **OS**: Windows 11, macOS 12+, Ubuntu 22.04+

## Installation

### Option 1: Use WORLDEDIT with Integrated WORLDC

Install the complete editor which includes WORLDC:

```bash
# Clone repository
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv/editor

# Install dependencies
npm install

# Run development version
npm run dev

# Or build for production
npm run build
```

### Option 2: Use WORLDC Standalone

Install only the programming language:

```bash
# Clone repository
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv/worldc

# Install dependencies
npm install

# Build language tools
npm run build

# Install globally (optional)
npm install -g .
```

### Option 3: Install from NPM (Future)

```bash
# Editor (when published)
npm install -g @worldenv/editor

# Language only (when published)
npm install -g @worldenv/worldc
```

## Quick Start

### Create Your First Game

1. **Start WORLDEDIT**:
   ```bash
   cd worldenv/editor
   npm run dev
   ```

2. **Create New Project**: Select File → New Project → Select template

3. **Design Scenes**: Place entities and components using the visual editor

4. **Write Scripts**: Create WORLDC files for game logic

5. **Test in Play Mode**: Press F5 to test your game

6. **Build and Deploy**: Select File → Build → Select target platform

### WORLDC Programming Example

```worldc
/* 
   ===============================================
   WORLDC Game Logic Example
   ===============================================
*/

#include <worldenv.h>

/* 
         Game Initialization
           ---
           this function runs once when the game starts.
           it creates the player entity and sets up the
           basic components needed for rendering and
           positioning in the game world.
*/

void start() {

  Entity player = Engine.createEntity("Player");
  
  player.addComponent<Transform>(Vector3(0, 0, 0));     /* position at origin */
  player.addComponent<SpriteRenderer>("player.png");   /* visual representation */
  
}

/* 
         Frame Update Logic
           ---
           this function runs every frame during gameplay.
           it handles input processing and creates new
           game objects like bullets when the player
           presses the space key.
*/

void update(float deltaTime) {

  /* check for player input and create bullets
     when space key is pressed */
     
  if  (Input.isKeyPressed(KeyCode.SPACE)) {
  
    Entity bullet = Engine.createEntity("Bullet");
    
    bullet.addComponent<Transform>(player.position);      /* spawn at player */
    bullet.addComponent<RigidBody>().velocity = Vector3(0, 10, 0);  /* upward velocity */
    
  }
  
}
```

## Documentation

- **[Editor Quick Start](editor/docs/QUICKSTART.md)**: Getting started with WORLDEDIT
- **[User Guide](editor/docs/USER-GUIDE.md)**: Editor manual
- **[Developer Guide](editor/docs/DEVELOPER-GUIDE.md)**: Contribution and development
- **[Troubleshooting](editor/docs/TROUBLESHOOTING.md)**: Issue resolution
- **[API Reference](editor/docs/API-REFERENCE.md)**: API documentation
- **[WORLDC Manual](worldc/README.md)**: Programming language reference

## License

Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0.
See LICENSE.txt for complete license texts.

## Technical Stack

### Editor Integrations

- Electron: Cross-platform desktop application framework
- React: UI component framework
- TypeScript: Type-safe JavaScript development
- Three.js: 3D rendering and WebGL integration
- Pixi.js: 2D rendering
- Monaco Editor: Code editing component

### Language Integrations

- TypeScript Compiler API: Parsing and analysis
- Custom AST: Hybrid language syntax tree
- Multi-target Codegen: TypeScript and AssemblyScript output
- Language Server Protocol: IDE integration
- Incremental Compilation: Development iteration

---

[![Hippocratic License HL3-FULL](https://img.shields.io/static/v1?label=Hippocratic%20License&message=HL3-FULL&labelColor=5e2751&color=bc8c3d)](https://firstdonoharm.dev/version/3/0/full.html)
