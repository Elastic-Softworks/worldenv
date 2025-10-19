# WORLDEDIT DOCUMENTATION

**Game development editor for the WORLDENV engine**

## Quick Navigation
### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 15 minutes
- **[USER-GUIDE.md](USER-GUIDE.md)** - Comprehensive user manual
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### Development
- **[DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)** - Development and contribution guide
- **[API-REFERENCE.md](API-REFERENCE.md)** - Technical API documentation

### WORLDC Language
- **[WORLDC Manual](../worldc/docs/WC-MANUAL.md)** - Complete language reference
- **[WORLDC Lexicon](../worldc/docs/WC-LEXICON.md)** - API and function reference
- **[WORLDC Troubleshooting](../worldc/docs/troubleshooting.md)** - Language-specific issues

## What is WORLDEDIT?

WORLDEDIT is a professional game development editor built for the WORLDENV engine. It provides a complete integrated development environment for creating 2D and 3D games with visual tools, scene management, component systems, and the powerful WORLDC programming language.

### Key Features

- **Advanced Viewport System** - Real-time 3D/2D visualization with professional controls
- **Object Selection & Manipulation** - Multi-select, transform gizmos, visual feedback
- **Smart Camera Controls** - Orbit, pan, zoom, focus with smooth animations
- **Component-Based Rendering** - Entity-component architecture with real-time visualization
- **Performance Optimized** - Material/geometry caching, efficient rendering pipeline
- **Professional Asset Management** - Import, organize, preview with drag-and-drop to viewport
- **Asset Import Pipeline** - Support for images, 3D models, audio, fonts with thumbnails
- **Asset Properties & Metadata** - Tag management, descriptions, technical information
- **Integrated Editing** - Viewport-hierarchy synchronization, keyboard shortcuts
- **WORLDC Integration** - Advanced scripting with hybrid C/C++/TypeScript syntax
- **Complete Build System** - Multi-platform compilation with profiles and optimization
- **Multi-Platform Deployment** - Export to web, desktop, mobile, and PWA formats
- **Progressive Web Apps** - Service workers, offline support, installable apps
- **Development Tools** - Hot-reload, bundle analysis, installer generation
- **Professional UI** - VS Code-inspired interface with dockable panels

### Technology Stack

- **Frontend**: Electron, React, TypeScript
- **Backend**: Node.js, IPC communication
- **Rendering**: Three.js (3D), Pixi.js (2D)
- **Language**: WORLDC compiler and tooling
- **Build System**: Webpack, TypeScript compiler

## Documentation Structure

### For Users
1. **Start Here**: [QUICKSTART.md](QUICKSTART.md) - Essential first steps
2. **Learn More**: [USER-GUIDE.md](USER-GUIDE.md) - Complete feature guide
3. **Get Help**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem solving

### For Developers
1. **Development**: [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) - Build and contribute
2. **API Reference**: [API-REFERENCE.md](API-REFERENCE.md) - Technical documentation
3. **Language Docs**: [WORLDC Documentation](../worldc/docs/) - Programming language

### For Testing
- **[Pre-Alpha Testing](todo/pre-alpha-testing-checklist.md)** - Complete testing framework
- **[Project Cleanup](todo/project-clean-todo.txt)** - Current reorganization status

## Installation

### Quick Install (Recommended)
```bash
# Download from releases
wget https://github.com/elastic-softworks/worldenv/releases/latest

# Install WORLDC compiler
npm install -g @worldenv/worldc
```

### Build from Source
```bash
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv/editor
npm install
npm run build
npm run start
```

## System Requirements

**Minimum:**
- Node.js 18+ and npm 9+
- 4 GB RAM, 2 GB disk space
- OpenGL 3.3 compatible graphics

**Recommended:**
- 8 GB RAM, SSD storage
- Dedicated graphics card
- Multi-core processor

## Project Status

**Current Version**: 0.1.0 (Pre-Alpha)

## Build System

WORLDEDIT includes a comprehensive build system for deploying your projects:

### Build Profiles
- **Debug**: Fast builds with debugging features and hot-reload
- **Release**: Optimized builds for testing and staging
- **Distribution**: Production-ready builds with maximum optimization

### Supported Platforms
- **Web**: HTML/CSS/JS packages for web deployment
- **Desktop**: Electron applications for Windows, macOS, Linux
- **Mobile**: Cordova/PhoneGap apps for iOS and Android
- **WebAssembly**: High-performance WASM modules
- **PWA**: Progressive Web Apps with offline support

### Build Features
- WorldC compilation to TypeScript and AssemblyScript
- Asset bundling and optimization
- Source map generation
- Code minification and compression
- Bundle size analysis
- Automatic installer generation
- Hot-reload for development

## Getting Started with Builds

1. **Configure Build Settings**: `Build > Build Configuration...`
2. **Select Profile**: Choose Debug, Release, or Distribution
3. **Choose Platforms**: Select target platforms (Web, Desktop, Mobile)
4. **Set Options**: Configure compression, PWA features, installers
5. **Build Project**: `Build > Build Project` or `Ctrl+B`

See [USER-GUIDE.md](USER-GUIDE.md) for detailed build system documentation.

**Current Status**: Script editor and code integration complete
**Latest Features**: Advanced build system with multi-platform compilation

### Core Features
- **Engine Foundation**: Status system, IPC communication, WORLDC integration
- **Scene Management**: Create/save/load scenes with .scene.json format
- **Entity System**: Create, delete, reparent entities with hierarchy management
- **Component System**: 10 core components with Inspector integration and help system
- **Advanced Viewport**: Real-time 3D/2D rendering with object manipulation
- **Selection System**: Multi-selection, highlighting, visual feedback
- **Transform Gizmos**: Professional translate, rotate, scale tools
- **Camera Controls**: Orbit, pan, zoom, focus operations with smooth animations
- **Performance Optimization**: Material/geometry caching, efficient rendering
- **Professional Asset Management**: Import, organize, preview with metadata
- **Asset Import Pipeline**: Images, 3D models, audio, fonts with thumbnails
- **Drag-and-Drop Integration**: Asset browser to viewport with entity creation
- **Asset Properties**: Metadata editing, tags, descriptions, technical info
- **Asset Organization**: Search, filtering, breadcrumb navigation, keyboard shortcuts

### Current Development Focus
- Project structure and file templates
- Script creation and management
- File system integration and monitoring
- Project settings and configuration

### Upcoming Features
- Menu & Toolbar Functionality
- Performance Optimization & Polish
- Advanced debugging features

## Quick Examples

### Creating Your First Scene
1. Launch WORLDEDIT
2. Go to "File" → "New Scene"
3. Enter scene name and choose template (Empty/2D/3D)
4. Add entities with right-click → "Add Entity"
5. **Import Assets**: Drag files into asset browser or use Ctrl+I
6. **Create from Assets**: Drag assets from browser to viewport
7. **Manipulate Objects**: Use W/E/R keys for transform gizmos
8. **Focus Camera**: Press F to focus on selected objects
9. **Organize Assets**: Use tags, descriptions, and folders
10. Save scene with Ctrl+S

### Basic Scene Structure
```json
{
  "format": "worldenv-scene",
  "version": "1.0.0",
  "metadata": {
    "name": "MyFirstLevel",
    "created": "2024-01-15T10:30:00Z"
  },
  "entities": [
    {
      "id": "uuid-here",
      "name": "Player",
      "transform": {
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 }
      }
    }
  ]
}
```

### Current Working Features
- **Advanced 3D/2D Viewport**: Real-time scene visualization with object manipulation
- **Professional Asset Management**: Import, organize, preview with metadata editing
- **Drag-and-Drop Workflow**: Assets to viewport with automatic entity creation
- **Asset Import Pipeline**: Images, 3D models, audio, fonts with thumbnails
- **Object Selection**: Click selection, multi-select, visual highlighting
- **Transform Gizmos**: Professional W/E/R translate/rotate/scale tools
- **Camera Controls**: Orbit, pan, zoom, focus with smooth animations
- **Scene Management**: Create/save/load with viewport and asset integration
- **Component System**: 10 core components with asset-driven properties
- **Search & Organization**: Real-time asset filtering, tags, breadcrumb navigation
- **Keyboard Shortcuts**: Comprehensive shortcuts for viewport and asset operations
- **Performance**: Optimized rendering and asset loading with caching systems

## Community & Support

### Getting Help
- **Documentation**: Start with [QUICKSTART.md](QUICKSTART.md)
- **Issues**: [GitHub Issues](https://github.com/elastic-softworks/worldenv/issues)
- **Discord**: Join our community server
- **Email**: support@elasticsoftworks.com

### Contributing
- **Bug Reports**: Use GitHub issue templates
- **Feature Requests**: Discuss in GitHub discussions
- **Code Contributions**: See [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
- **Documentation**: Help improve these guides

### Resources
- **Examples**: Browse sample projects in repository
- **Tutorials**: Step-by-step video guides
- **API Docs**: Complete technical reference
- **Community**: Share projects and get feedback

## License

Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0.  
See [LICENSE.txt](../LICENSE.txt) for complete license texts.

## Acknowledgments

Built with love by Elastic Softworks using:
- Electron by GitHub
- React by Meta
- Three.js by mrdoob
- TypeScript by Microsoft
- And many other amazing open source projects

---

**Ready to Experience Professional Game Development?**

**Latest Enhancements:**
- Enhanced file creation capabilities (scripts, shaders, materials, prefabs)
- Comprehensive project validation and integrity checking
- Project backup and recovery system with automatic scheduling
- File history and version tracking with diff-based storage
- Project templates for different application types
- Enhanced file operations (rename, move, copy, search)
- Professional asset management with import pipeline
- Drag-and-drop workflow from assets to viewport

**[Get Started with QUICKSTART.md](QUICKSTART.md)**

Need help? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or reach out to our community!