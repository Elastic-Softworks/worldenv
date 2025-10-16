# WORLDEDIT

Integrated development environment for WORLDENV game engine projects.

## Overview

WORLDEDIT is a cross-platform game editor built with Electron, TypeScript, and web technologies. It provides visual tools for creating, editing, and managing WORLDENV game projects through an integrated workflow similar to established engines like Godot and Unity.

## Architecture

WORLDEDIT uses a dual-process architecture:

- **Main Process**: Node.js environment handling file system operations, project management, and system integration
- **Renderer Process**: Chromium-based UI running the visual editor, viewport, and integrated tools

The editor embeds the WORLDENV runtime (TypeScript/AssemblyScript/WebAssembly) directly in the viewport for live editing and testing.

## Core Features

### Viewport & Scene Editor

Visual editing environment supporting both 2D and 3D modes. Provides camera controls, object manipulation, and real-time preview of game scenes.

### Entity-Component System

Hierarchical scene graph with component-based architecture. Entities organize game objects in parent-child relationships. Components define behavior and properties.

### Inspector Panel

Advanced property editor for selected entities with enhanced editing capabilities:
- Type-safe property editors with validation and error display
- Drag-to-change numeric inputs with precision control
- Vector2/Vector3 inputs with color-coded axis components
- Color picker with alpha channel support
- Dropdown selectors for enumeration types
- Multi-entity selection with shared property editing
- Undo/redo support for all property changes
- Real-time validation with constraint enforcement

### Asset Browser & File System

Comprehensive asset management system with real-time file system integration:
- Drag-and-drop asset import with format validation
- Grid and list view modes with thumbnail previews
- Context menu operations (rename, delete, organize)
- Multi-format support: images, 3D models, audio, scripts, materials
- Asset metadata tracking and search functionality
- Automatic folder structure creation and organization

### Engine Integration & Play Mode

Real-time engine integration with WORLDENV runtime embedded directly in the editor:
- Live scene synchronization between editor and engine
- Play mode with pause/resume functionality for testing game logic
- Engine state preservation and restoration when entering/exiting play mode
- Real-time performance statistics and error reporting
- Scene serialization to WORLDENV format (.scene.json) with validation
- IPC communication layer for secure engine operations
- Visual play mode indicators and engine status feedback

### Script Editor

Integrated code editor based on Monaco (VSCode editor component) with full IDE features:
- TypeScript and AssemblyScript support with syntax highlighting
- Tab-based file management with multiple open files
- IntelliSense, code completion, and error detection
- Built-in find/replace, code folding, and bracket matching
- Auto-indentation and multi-cursor editing
- Script file templates for components
- Dirty state tracking and auto-save support
- Integrated with project scripts directory

### Project Management

Comprehensive project lifecycle management with professional workflow:
- New Project Wizard with template selection (Empty, 2D Game, 3D Game, UI App)
- Recent Projects dialog with validation and cleanup
- Enhanced project structure with organized subdirectories
- Project Settings dialog with tabbed configuration interface
- Template-based project creation with pre-configured settings
- Recent projects persistence and invalid project handling
- Project metadata and version tracking

### Prefab System

Reusable entity templates with instance overrides. Create prefabs from scene entities, instantiate multiple copies, and propagate changes to all instances.

### Animation Editor

Timeline-based animation system with keyframe editing. Supports transform animations, property curves, and event triggers.

### Build System

Compiles and packages projects for deployment. Generates production builds for web browsers and desktop platforms (via Electron).

## WORLDC Language

WORLDEDIT includes WORLDC, a hybrid programming language that combines C/C++ performance with TypeScript/JavaScript flexibility. WORLDC serves as a superset of C, C++, and TypeScript, allowing mixed-language programming in a single unified syntax.

### Language Features

- **C/C++ Foundation**: Full C89 and C++17 compatibility with native performance
- **TypeScript Integration**: Complete TypeScript support including interfaces, generics, async/await
- **Mixed Programming**: C, C++, and TypeScript functions can coexist in the same file
- **Web Integration**: Direct access to DOM APIs, Web APIs, and browser functionality
- **Game Engine Integration**: Built-in support for Three.js (3D) and Pixi.js (2D) rendering
- **Hot Reload**: JIT compilation for rapid development iteration
- **Multiple Targets**: Compiles to TypeScript, AssemblyScript, WebAssembly, and JavaScript

### WORLDC Example

```worldc
/* 
   ===============================================
   WORLDC Mixed-Language Example
   ===============================================
*/

#include <world-render3d.h>

/* TypeScript interface definition for game entities.
   This establishes the contract that all game objects
   must follow for position tracking and updates. */

interface Entity {

  position: vec3;                    /* 3D world position vector */
  
  update(deltaTime: number): void;   /* frame update method */
  
}

/* 
         Player Class Implementation
           ---
           this demonstrates the hybrid C++/TypeScript
           nature of WORLDC. the class uses C++ syntax
           for performance-critical game logic while
           implementing the TypeScript Entity interface
           for type safety and integration.
*/

class Player : public Entity {

  private:
  
    float  health;                   /* player health points */
    
  public:
  
    Player() {
    
      health = 100.0f;              /* initialize with full health */
      
    }
    
    void update(float deltaTime) override {
    
      /* handle player movement input using C-style
         key checking for maximum performance */
         
      if  (is_key_down(KEY_W)) {
      
        position.z -= 5.0f * deltaTime;    /* move forward */
        
      }
      
    }
    
};

/* 
         Asset Loading Function
           ---
           this TypeScript async function demonstrates
           how WORLDC seamlessly integrates modern
           JavaScript patterns for non-performance
           critical operations like asset loading.
*/

async function loadAssets(): Promise<void> {

  const model = await loadModel("player.gltf");
  
  console.log("Assets loaded successfully");
  
}
```

## Development Status

WORLDEDIT is currently in pre-alpha development. The following core systems are implemented:

### Completed Features
- **COMPLETE** **Phase 1-3**: Basic Electron application with UI framework (React)
- **COMPLETE** **Phase 4**: Viewport system with 2D/3D rendering (Three.js, Pixi.js)
- **COMPLETE** **Phase 5**: Scene hierarchy management with drag-and-drop node organization
- **COMPLETE** **Phase 6**: Entity-component system with registry and lifecycle management
- **COMPLETE** **Phase 7**: Enhanced inspector panel with property validation and undo/redo
- **COMPLETE** **Phase 8**: Asset browser and file system integration with drag-and-drop import
- **COMPLETE** **Phase 9**: Engine integration with live play mode and scene serialization
- **COMPLETE** **Phase 10**: Script editor with Monaco integration and code features
- **COMPLETE** **Phase 11**: Project management with creation wizard and settings
- **COMPLETE** **Phase 12**: Transform manipulators and operations
- **COMPLETE** **Phase 13**: Undo/redo system with command pattern implementation
- **COMPLETE** **Phase 14**: Basic build system with configuration dialog and compilation
- **COMPLETE** **Phase 15**: WORLDC language foundation (C/C++/TypeScript hybrid)

### Planned Features
- **PLANNED** **Phase 16**: Advanced build features, prefab system, and animation editor
- **PLANNED** **Phase 17+**: WORLDC language compiler and debugging tools

## Technical Stack

- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Type-safe development language
- **Three.js**: 3D rendering in viewport
- **Pixi.js**: 2D rendering in viewport
- **Monaco Editor**: Code editing component
- **React**: UI framework for editor interface
- **Webpack**: Module bundling and build system

## System Requirements

### Minimum

- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- GPU: OpenGL 3.3 / WebGL 2.0 support
- Storage: 500 MB free space
- OS: Windows 10, macOS 10.14, Ubuntu 18.04 (or equivalent)

### Recommended

- CPU: Quad-core 3.0 GHz
- RAM: 8 GB
- GPU: Dedicated graphics with 2 GB VRAM
- Storage: 2 GB free space (for projects and assets)
- OS: Windows 11, macOS 12+, Ubuntu 22.04+

## Installation

### Pre-built Binaries

Download platform-specific installers from the releases page:

- Windows: `.msi` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage`, `.deb`, or `.rpm` package

### Build from Source

Requirements:
- Node.js 18+ and npm 9+
- Git
- C/C++ compiler (for native modules)

```bash
git clone https://github.com/your-org/worldenv.git
cd worldenv/editor
npm install
npm run build
npm run package
```

## Project Structure

```
editor/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # UI and renderer process
│   ├── shared/         # Shared utilities and types
│   └── engine/         # WORLDENV runtime integration
├── assets/             # Editor UI resources
├── templates/          # Project templates
├── docs/               # Documentation and guides
├── build/              # Build configuration
└── dist/               # Compiled output
```

## Development

### Running in Development Mode

```bash
npm run dev
```

Opens the editor with hot reload enabled. Changes to source files automatically reload the application.

### Building for Production

```bash
npm run build
npm run package
```

Creates optimized production build and generates platform-specific installers in `dist/`.

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # End-to-end tests
```

## Usage

### Creating a Project

1. Launch WORLDEDIT
2. File → New Project
3. Select template and location
4. Configure project settings

### Editing Scenes

1. Open project
2. Create or open scene file
3. Add entities from hierarchy panel
4. Attach components via inspector
5. Position objects in viewport

### Writing Scripts

1. Create new script in asset browser
2. Open in integrated editor
3. Write TypeScript or AssemblyScript code
4. Attach script component to entity
5. Test in play mode

### Building Projects

1. Build → Build Settings
2. Select target platform
3. Configure optimization level
4. Click Build
5. Locate output in project's `dist/` directory

## Configuration

Editor preferences are stored in:

- Windows: `%APPDATA%/worldedit/config.json`
- macOS: `~/Library/Application Support/worldedit/config.json`
- Linux: `~/.config/worldedit/config.json`

## Keyboard Shortcuts

### General

- `Ctrl+N`: New project
- `Ctrl+O`: Open project
- `Ctrl+S`: Save scene
- `Ctrl+Shift+S`: Save scene as
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo

### Viewport

- `W`: Translate mode
- `E`: Rotate mode
- `R`: Scale mode
- `F`: Frame selected
- `Delete`: Delete selected

### Play Mode

- `F5`: Play
- `F6`: Pause
- `F8`: Stop

### Script Editor

- `Ctrl+Shift+S`: Toggle script editor panel
- `Ctrl+S`: Save current script file

## File Formats

### Project File

`.worldenv` - JSON format containing project configuration and settings

### Scene File

`.scene.json` - JSON format containing entity hierarchy and component data

### Prefab File

`.prefab.json` - JSON format containing reusable entity templates

### Animation File

`.anim.json` - JSON format containing keyframe and curve data

## Extending WORLDEDIT

### Plugin System

Create plugins to extend editor functionality:

```typescript
import { Plugin } from 'worldedit';

export default class MyPlugin implements Plugin {
  name = 'My Plugin';
  version = '1.0.0';

  activate(context: PluginContext) {
    // Register commands, panels, tools
  }

  deactivate() {
    // Cleanup
  }
}
```

### Custom Components

Define custom components for specialized behavior:

```typescript
import { Component } from 'worldenv';

export class CustomComponent extends Component {
  // Component properties and methods
}
```

## Troubleshooting

### Editor Fails to Start

Check system requirements and graphics drivers. Review error logs in:

- Windows: `%APPDATA%/worldedit/logs/`
- macOS: `~/Library/Logs/worldedit/`
- Linux: `~/.local/share/worldedit/logs/`

### Viewport Performance Issues

Reduce viewport quality settings in Edit → Preferences → Viewport. Disable antialiasing and shadows for better performance.

### Build Errors

Verify all scripts compile without errors. Check console output for specific error messages. Ensure all asset references are valid.

## Contributing

Contributions are welcome. Submit bug reports and feature requests via the issue tracker. Follow the contribution guidelines in `CONTRIBUTING.md` before submitting pull requests.

## License

WORLDEDIT is multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0. See `LICENSE.txt` for full license texts.

## Documentation

Complete documentation available at:

- User Manual: `docs/user-manual.md`
- API Reference: `docs/api-reference.md`
- Development Guide: `docs/development-guide.md`

## Support

- Issue Tracker: GitHub Issues
- Community Forum: [forum link]
- Discord: [server invite]
- Email: support@worldenv.dev

## Development Status

WORLDEDIT is under active development. Current phase: Pre-Alpha (Phase 12 Complete)

### Phase 1: Project Setup & Infrastructure - COMPLETE

Phase 1 implementation complete. All foundational infrastructure established:

- COMPLETE: Electron application structure
- COMPLETE: TypeScript build system with Webpack
- COMPLETE: Main and renderer process architecture
- COMPLETE: Secure IPC communication
- COMPLETE: Development environment with hot reload
- COMPLETE: ESLint and Prettier configuration
- COMPLETE: Base type system and error handling
- COMPLETE: CSS styling foundation
- COMPLETE: Build and packaging system
- COMPLETE: Complete documentation

### Phase 2: Basic Electron Application - COMPLETE

Phase 2 implementation complete. Core application functionality established:

- COMPLETE: Window management with state persistence
- COMPLETE: File system abstraction and operations
- COMPLETE: Project management system (create, open, save, close)
- COMPLETE: Auto-save functionality with file watching
- COMPLETE: Application menu system
- COMPLETE: Dialog handlers for user interaction
- COMPLETE: Structured logging system
- COMPLETE: Splash screen and application lifecycle
- COMPLETE: Comprehensive IPC handler system

### Phase 3: UI Framework & Layout - COMPLETE

Phase 3 implementation complete. Modern React-based UI architecture established:

- COMPLETE: React 18 with TypeScript JSX integration
- COMPLETE: Comprehensive theming system (dark/light modes)
- COMPLETE: Dockable panel system with Allotment
- COMPLETE: All core layout panels (viewport, hierarchy, inspector, assets)
- COMPLETE: Menu bar with File, Edit, View, Help menus
- COMPLETE: Toolbar with tools and viewport controls
- COMPLETE: Status bar with project and system information
- COMPLETE: Rich UI components (buttons, inputs, property editors)
- COMPLETE: State management with context providers
- COMPLETE: Panel resize and persistence functionality

Build verified:
- Main process: 316 KB (compiled, production)
- Renderer process: 286 KB (compiled, production)
- Build time: ~9 seconds
- Zero compilation errors or warnings
- Professional VS Code-inspired interface

### Phase 8: Asset Browser & File System - COMPLETE

Phase 8 implementation complete. Comprehensive asset management system established:

- COMPLETE: AssetManager service with file system operations
- COMPLETE: Real-time asset listing and caching
- COMPLETE: Drag-and-drop asset import with DropZone component
- COMPLETE: Context menu system for asset operations
- COMPLETE: Support for multiple asset types (images, audio, models, scripts, etc.)
- COMPLETE: Asset metadata tracking and thumbnail generation
- COMPLETE: Integration with project system and IPC handlers
- COMPLETE: Grid and list view modes with file size and date display
- COMPLETE: Asset search and filtering functionality
- COMPLETE: Folder creation and organization tools

### Phase 9: Engine Integration - COMPLETE

Phase 9 implementation complete. WORLDENV runtime integrated with live testing:

- COMPLETE: EngineWrapper class for runtime embedding in viewport
- COMPLETE: EngineService for high-level engine management
- COMPLETE: SceneSerializer for converting editor scenes to engine format
- COMPLETE: IPC handlers for engine operations (export, validate, save/load)
- COMPLETE: Play/Pause/Stop controls in toolbar with state preservation
- COMPLETE: Engine status indicators and play mode visual feedback
- COMPLETE: Scene synchronization between editor and engine
- COMPLETE: Error reporting and real-time validation
- COMPLETE: Integration with asset and project management systems

### Phase 10: Basic Script Editor - COMPLETE

Phase 10 implementation complete. Integrated code editor with Monaco:

- COMPLETE: Monaco Editor (@monaco-editor/react) integration
- COMPLETE: ScriptEditorPanel with tab-based file management
- COMPLETE: IPC handlers for script operations (read, write, create, delete, rename, list)
- COMPLETE: Script API in preload bridge for secure renderer access
- COMPLETE: TypeScript and AssemblyScript support with syntax highlighting
- COMPLETE: Built-in code folding, find/replace, bracket matching, auto-indent
- COMPLETE: Script file templates for component creation
- COMPLETE: Toggle via View menu (Ctrl+Shift+S)
- COMPLETE: Dirty state indicators and save prompts
- COMPLETE: Multi-file tab management with close confirmation

### Phase 11: Project Management - COMPLETE

Phase 11 implementation complete. Professional project lifecycle management:

- COMPLETE: NewProjectDialog with multi-step wizard and 4 project templates
- COMPLETE: RecentProjectsDialog with project validation and cleanup
- COMPLETE: ProjectSettingsDialog with tabbed configuration interface
- COMPLETE: RecentProjectsManager for persistence and validation
- COMPLETE: Enhanced project structure with prefabs, materials, shaders
- COMPLETE: Project template system (Empty, 2D Game, 3D Game, UI App)
- COMPLETE: Recent projects list with missing project handling
- COMPLETE: WelcomeScreen integration with new dialogs
- COMPLETE: MenuBar project settings access
- COMPLETE: Organized project directories (components, systems, materials, etc.)

### Phase 12: Transform Manipulators & Operations - COMPLETE

Phase 12 implementation complete. Professional transform tools with visual manipulators:

- COMPLETE: BaseManipulator system with common functionality for all transform tools
- COMPLETE: TranslateManipulator with arrow handles for X/Y/Z axis movement
- COMPLETE: RotateManipulator with circular handles for rotation around axes
- COMPLETE: ScaleManipulator with box handles for uniform and non-uniform scaling
- COMPLETE: ManipulatorManager coordinating all manipulators and mode switching
- COMPLETE: Viewport integration with toolbar controls and keyboard shortcuts
- COMPLETE: World/local transform space support with Tab toggle
- COMPLETE: Snap to grid functionality with G key toggle
- COMPLETE: Keyboard shortcuts (W=translate, E=rotate, R=scale)
- COMPLETE: Full Three.js scene integration with visual feedback

Next: Phase 13 - Undo/Redo System

See development roadmaps:
- `docs/todo-prealpha.txt` - Foundation features
- `docs/todo-alpha.txt` - Feature expansion
- `docs/todo-beta.txt` - Polish and optimization
- `docs/todo-release.txt` - Release preparation

See also:
- `docs/phase1-status.md` - Complete Phase 1 status report
- `docs/implementation-log.md` - Development session log
- `docs/build-guide.md` - Build instructions

## Acknowledgments

Built on top of:
- Electron - Cross-platform framework
- Three.js - 3D graphics library
- Pixi.js - 2D rendering engine
- Monaco Editor - Code editor component
- WORLDENV - Game engine runtime

## Links

- Website: [link]
- Repository: [link]
- Documentation: [link]
- WORLDENV Engine: [link]