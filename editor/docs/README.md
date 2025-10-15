# WORLDEDIT DOCUMENTATION

**Professional game development editor for the WORLDENV engine**

## Quick Navigation

### Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 15 minutes
- **[USER-GUIDE.md](USER-GUIDE.md)** - Comprehensive user manual
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### Development
- **[DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)** - Development and contribution guide
- **[API-REFERENCE.md](API-REFERENCE.md)** - Technical API documentation

### WORLDSRC Language
- **[WORLDSRC Manual](../worldsrc/docs/worldsrc-manual.md)** - Complete language reference
- **[WORLDSRC Lexicon](../worldsrc/docs/worldsrc-lexicon.md)** - API and function reference
- **[WORLDSRC Troubleshooting](../worldsrc/docs/troubleshooting.md)** - Language-specific issues

## What is WORLDEDIT?

WORLDEDIT is a professional game development editor built for the WORLDENV engine. It provides a complete integrated development environment for creating 2D and 3D games with visual tools, scene management, component systems, and the powerful WORLDSRC programming language.

### Key Features

- **Visual Scene Editor** - Real-time 2D/3D viewport with object manipulation
- **Component System** - Modular entity-component architecture
- **Asset Management** - Comprehensive file browser with drag-and-drop support
- **WORLDSRC Integration** - Advanced scripting with hybrid C/C++/TypeScript syntax
- **Multi-Platform Deployment** - Export to web, desktop, and PWA formats
- **Professional UI** - VS Code-inspired interface with dockable panels

### Technology Stack

- **Frontend**: Electron, React, TypeScript
- **Backend**: Node.js, IPC communication
- **Rendering**: Three.js (3D), Pixi.js (2D)
- **Language**: WORLDSRC compiler and tooling
- **Build System**: Webpack, TypeScript compiler

## Documentation Structure

### For Users
1. **Start Here**: [QUICKSTART.md](QUICKSTART.md) - Essential first steps
2. **Learn More**: [USER-GUIDE.md](USER-GUIDE.md) - Complete feature guide
3. **Get Help**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem solving

### For Developers
1. **Development**: [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) - Build and contribute
2. **API Reference**: [API-REFERENCE.md](API-REFERENCE.md) - Technical documentation
3. **Language Docs**: [WORLDSRC Documentation](../worldsrc/docs/) - Programming language

### For Testing
- **[Pre-Alpha Testing](todo/pre-alpha-testing-checklist.md)** - Complete testing framework
- **[Project Cleanup](todo/project-clean-todo.txt)** - Current reorganization status

## Installation

### Quick Install (Recommended)
```bash
# Download from releases
wget https://github.com/elastic-softworks/worldenv/releases/latest

# Install WORLDSRC compiler
npm install -g @worldenv/worldsrc
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
**Development Phase**: Alpha Phase 20 Complete  
**Next Milestone**: Beta Testing & Community Release

### Recent Achievements
- Complete editor infrastructure
- Visual scene editing system
- Component-based architecture
- WORLDSRC language integration
- Multi-platform build system
- Professional UI framework

### Upcoming Features
- Enhanced asset pipeline
- Advanced animation tools
- Collaborative editing
- Cloud deployment
- Mobile platform support

## Quick Examples

### Creating Your First Project
1. Launch WORLDEDIT
2. Click "New Project" → "2D Platformer"
3. Name your project and click "Create"
4. Press F5 to test in play mode

### Basic WORLDSRC Script
```worldsrc
class PlayerController {
    private float speed = 200.0f;
    
    void update(float deltaTime) {
        if (Input.isKeyPressed(KeyCode.A)) {
            transform.position.x -= speed * deltaTime;
        }
        if (Input.isKeyPressed(KeyCode.D)) {
            transform.position.x += speed * deltaTime;
        }
    }
}
```

### Building for Web
1. Build → Build Settings
2. Select "Web" platform
3. Click "Build"
4. Open `build/web/index.html`

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

**Ready to Start Building Games?**

👉 **[Get Started with QUICKSTART.md](QUICKSTART.md)**

Need help? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or reach out to our community!