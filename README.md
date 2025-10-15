# WORLDENV

**Professional 2D/3D Game Development Environment**

WORLDENV provides a comprehensive game development ecosystem consisting of **WORLDEDIT** (the visual editor) and **WORLDSRC** (the programming language). This monorepo contains both components organized for standalone use and integrated development.

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
└── worldsrc/               # WORLDSRC - Programming language
    ├── README.md           # Language-specific documentation
    ├── package.json        # Language tooling dependencies
    ├── src/                # Language implementation
    ├── dist/               # Compiled language tools
    ├── docs/               # Language documentation
    ├── tests/              # Language test suites
    └── examples/           # Code examples
```

## Components

### WORLDEDIT - Visual Game Editor

**Professional Electron-based game editor with real-time rendering**

- **Modern UI**: Dockable panels, customizable workspace
- **Scene Editor**: Visual viewport with transform manipulators
- **Entity-Component System**: Flexible game object architecture
- **Asset Browser**: Integrated file management and preview
- **Script Editor**: WORLDSRC integration with syntax highlighting
- **Play Mode**: Real-time testing within the editor
- **Build System**: Multi-platform export and deployment

**Quick Start**: See [`editor/README.md`](editor/README.md) for detailed information.

### WORLDSRC - Hybrid Programming Language

**C/C++/TypeScript hybrid language for game development**

- **Familiar Syntax**: C/C++ syntax with TypeScript type system
- **Multi-target**: Compiles to TypeScript and AssemblyScript
- **Engine Integration**: Direct access to WORLDENV APIs
- **Professional Tooling**: LSP support for all major editors
- **Performance**: Hot compilation with optimization passes
- **Type Safety**: Advanced type system with generics and pointers

**Quick Start**: See [`worldsrc/README.md`](worldsrc/README.md) for detailed information.

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

### Option 1: Use WORLDEDIT with Integrated WORLDSRC

Install the complete editor which includes WORLDSRC:

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

### Option 2: Use WORLDSRC Standalone

Install only the programming language:

```bash
# Clone repository
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv/worldsrc

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
npm install -g @worldenv/worldsrc
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

4. **Write Scripts**: Create WORLDSRC files for game logic

5. **Test in Play Mode**: Press F5 to test your game

6. **Build and Deploy**: Select File → Build → Select target platform

### WORLDSRC Programming Example

```worldsrc
/* 
   ===============================================
   WORLDSRC Game Logic Example
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

## Development Status

**Current Phase**: Pre-Alpha Testing Preparation

### Completed Features

- **WORLDEDIT**: Complete visual editor with all core features
- **WORLDSRC**: Functional programming language with multi-target compilation
- **Integration**: Editor and language work together seamlessly
- **Documentation**: Comprehensive guides and references
- **Build System**: Full compilation and deployment pipeline

### Upcoming Features

- **Pre-Alpha Testing**: Comprehensive testing program
- **Performance Optimization**: Editor and language performance improvements
- **Mobile Support**: Android and iOS export targets
- **Cloud Features**: Online collaboration and asset sharing
- **Plugin System**: Third-party extensions and tools

## Documentation

- **[Editor Quick Start](editor/docs/QUICKSTART.md)**: Start with WORLDEDIT
- **[User Guide](editor/docs/USER-GUIDE.md)**: Complete editor manual
- **[Developer Guide](editor/docs/DEVELOPER-GUIDE.md)**: Contribution and development
- **[Troubleshooting](editor/docs/TROUBLESHOOTING.md)**: Issue resolution
- **[API Reference](editor/docs/API-REFERENCE.md)**: Technical API documentation
- **[WORLDSRC Manual](worldsrc/README.md)**: Programming language reference

## Community and Support

- **GitHub Issues**: Submit bug reports and feature requests
- **Documentation**: Access comprehensive guides and tutorials
- **Examples**: Download sample projects and code snippets
- **Discord** (Coming Soon): Join community chat and support

## Contributing

Contribute to both WORLDEDIT and WORLDSRC:

1. Fork the repository
2. Create a feature branch
3. Follow coding standards (C-Form for C code)
4. Add tests for new features
5. Submit a pull request

See [`editor/docs/DEVELOPER-GUIDE.md`](editor/docs/DEVELOPER-GUIDE.md) for detailed contribution guidelines.

## License

Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0.
See LICENSE.txt for complete license texts.

## Technical Stack

### Editor Technology

- **Electron**: Cross-platform desktop application framework
- **React**: Modern UI component framework
- **TypeScript**: Type-safe JavaScript development
- **Three.js**: 3D rendering and WebGL integration
- **Pixi.js**: High-performance 2D rendering
- **Monaco Editor**: Professional code editing experience

### Language Technology

- **TypeScript Compiler API**: Parsing and analysis
- **Custom AST**: Hybrid language syntax tree
- **Multi-target Codegen**: TypeScript and AssemblyScript output
- **Language Server Protocol**: IDE integration
- **Incremental Compilation**: Fast development iteration

---

**WORLDENV** - Professional game development made accessible