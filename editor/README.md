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

Property editor for selected entities. Displays and modifies component data with type-appropriate controls (numeric inputs, color pickers, dropdown selectors).

### Asset Browser

File system integration for importing and managing project assets. Supports images, 3D models, audio files, and scripts. Provides thumbnail previews and metadata display.

### Script Editor

Integrated code editor based on Monaco (VSCode editor component). Supports TypeScript and AssemblyScript with syntax highlighting, IntelliSense, and error detection.

### Prefab System

Reusable entity templates with instance overrides. Create prefabs from scene entities, instantiate multiple copies, and propagate changes to all instances.

### Animation Editor

Timeline-based animation system with keyframe editing. Supports transform animations, property curves, and event triggers.

### Build System

Compiles and packages projects for deployment. Generates production builds for web browsers and desktop platforms (via Electron).

## Technical Stack

- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Type-safe development language
- **Three.js**: 3D rendering in viewport
- **Pixi.js**: 2D rendering in viewport
- **Monaco Editor**: Code editing component
- **React/Vue**: UI framework (selected during implementation)
- **Webpack/Vite**: Module bundling and build system

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

WORLDEDIT is under active development. Current phase: Pre-Alpha

See development roadmaps:
- `docs/todo-prealpha.txt` - Foundation features
- `docs/todo-alpha.txt` - Feature expansion
- `docs/todo-beta.txt` - Polish and optimization
- `docs/todo-release.txt` - Release preparation

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