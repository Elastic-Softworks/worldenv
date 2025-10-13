# WORLDEDIT Documentation

Documentation for WORLDEDIT game development editor and WORLDENV engine.

## Navigation

See [index.md](index.md) for complete documentation index.

## Quick Start

- [Quick Start Guide](quickstart.md) - Essential commands and workflows
- [Build Guide](build-guide.md) - Complete build instructions
- [Quick Reference](quick-reference.md) - Commands and shortcuts

## Core Documentation

- [Agent Instructions](agent-instruct.md) - Development guidelines
- [Engine Overview](engine-overview.md) - Engine architecture
- [Engine Setup](engine-setup.md) - Installation instructions
- [Development Overview](development-overview.md) - Project phases

## Implementation Status

- **Phase 1: Project Setup & Infrastructure - COMPLETE**
- **Phase 2: Basic Electron Application - COMPLETE**
- **Phase 3: UI Framework & Layout - COMPLETE**
- **Phase 4: Viewport & Rendering - COMPLETE**
- **Phase 5: Scene Hierarchy System - COMPLETE**
- **Phase 6: Component System - COMPLETE**
- [Implementation Log](implementation-log.md) - Development sessions and detailed reports

## Development Planning

- [Calendar](calendar.txt) - Complete timeline with dates
- [Pre-Alpha TODO](todo-prealpha.txt) - Foundation tasks
- [Alpha TODO](todo-alpha.txt) - Feature expansion
- [Beta TODO](todo-beta.txt) - Polish and optimization
- [Release TODO](todo-release.txt) - Release preparation

## WORLDSRC Language

- [Manual](worldsrc/worldsrc-manual.md) - Language specification
- [Lexicon](worldsrc/worldsrc-lexicon.md) - Function reference

## Game Templates

- [2D Platformer](guides/template-2d-platformer.md)
- [First-Person 3D](guides/template-first-person-3d.md)

## Current Status

**Phase 5: Scene Hierarchy System - COMPLETE**

Comprehensive scene hierarchy management system implemented:

Phase 1 (Complete):
- Electron application structure
- TypeScript build system
- Main and renderer processes
- IPC communication foundation
- Development environment
- Code quality tools

Phase 2 (Complete):
- Window management with state persistence
- File system abstraction layer
- Project management (.worldenv format)
- Auto-save functionality
- File system watcher
- Application menu system
- Dialog handlers
- Structured logging system
- Splash screen
- IPC handler system (40+ handlers)

Phase 3 (Complete):
- React 18 UI framework integration
- Professional VS Code-inspired interface
- Complete panel layout system (viewport, hierarchy, inspector, assets)
- Dark/light theme system with CSS variables
- Responsive panel management with Allotment
- Menu bar with file operations
- Status bar with project information
- Component library with buttons, inputs, forms

Phase 4 (Complete):
- Three.js 3D renderer integration
- Pixi.js 2D renderer integration
- Seamless 2D/3D viewport mode switching
- Advanced camera control system (orbit, pan, zoom)
- Interactive viewport toolbar with camera presets
- Grid overlay and axes helpers
- Object selection and highlighting
- Transform gizmos system
- Real-time performance statistics
- Demo content system for testing

Phase 5 (Complete):
- Node/Entity data structure with hierarchical tree management
- Scene and SceneManager classes for lifecycle operations
- Enhanced HierarchyPanel with drag-and-drop reparenting
- Context menus for node operations (create, delete, rename, duplicate)
- Inline editing with keyboard shortcuts
- Real-time scene updates and dirty state tracking
- Scene file I/O with .scene.json format
- Integration with existing IPC file system handlers
- Multi-selection support with Ctrl/Cmd modifiers
- Node visibility toggles and type-specific icons

Build verified:
- Main process: 316 KB (minified)
- Renderer process: 1.44 MB (minified, includes hierarchy system)
- Build time: ~11 seconds
- Performance targets maintained
- All hierarchy operations tested

Next: Phase 6 - Component System

## Documentation Standards

All documentation follows:
- Dry, concise, clinical, professional tone
- Active voice
- Direct instructions
- No fluff or conversational language
- Step-by-step procedures
- Working code examples

## File Organization

```
docs/
├── index.md                    Documentation index
├── README.md                   This file
├── agent-instruct.md           Development guidelines
├── build-guide.md              Build instructions
├── quickstart.md               Quick start guide
├── quick-reference.md          Commands and shortcuts
├── engine-overview.md          Engine architecture
├── engine-setup.md             Installation guide
├── development-overview.md     Project phases
├── doc-summary.md              Documentation inventory
├── implementation-log.md       Development log with phase reports
├── calendar.txt                Development timeline
├── todo-prealpha.txt           Pre-alpha tasks
├── todo-alpha.txt              Alpha tasks
├── todo-beta.txt               Beta tasks
├── todo-release.txt            Release tasks
├── guides/                     Game templates
│   ├── template-2d-platformer.md
│   └── template-first-person-3d.md
└── worldsrc/                   WORLDSRC language
    ├── worldsrc-manual.md
    └── worldsrc-lexicon.md
```

## Version

Documentation Version: 1.5.0
Editor Version: 0.1.0 (Pre-Alpha)
Last Updated: Phase 5 Complete - December 2024

---

END OF README