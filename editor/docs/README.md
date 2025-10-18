# WORLDEDIT DOCUMENTATION

**Phase 5 Complete - Professional Asset Management & Viewport Integration**

**Professional game development editor for the WORLDENV engine**

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
- **Multi-Platform Deployment** - Export to web, desktop, and PWA formats
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
**Development Phase**: Phase 5 Complete (Asset System Overhaul)  
**Next Milestone**: Phase 6 - File & Project System

### Phase 1-5 Completed Features ✅
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

### Phase 6 Ready to Begin
- Project structure and file templates
- Script creation and management
- File system integration and monitoring
- Project settings and configuration

### Upcoming Features ⏳
- File & Project System (Phase 6)
- Script Editor & WORLDC Integration (Phase 7)
- Build System & Compilation (Phase 8)

## Quick Examples

### Creating Your First Scene (Phase 5 Enhanced)
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

### Current Working Features (Phase 5 Complete)
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

**Phase 5 brings you:**
- Professional 3D viewport with real-time rendering
- Comprehensive asset management with import pipeline
- Drag-and-drop workflow from assets to viewport
- Asset properties with metadata and tag management
- Advanced object selection and manipulation
- Transform gizmos for precise editing
- Smooth camera controls with focus operations
- Performance-optimized rendering and asset loading

**[Get Started with QUICKSTART.md](QUICKSTART.md)**

Need help? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or reach out to our community!