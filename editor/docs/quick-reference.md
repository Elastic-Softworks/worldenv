# WORLDENV Quick Reference

## Project Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run asbuild          # Compile AssemblyScript to WASM
npm run build            # Production build
npm run preview          # Preview production build

# Editor (Electron)
cd editor
npm install              # Install dependencies (first time)
npm run dev              # Start dev mode with hot reload
npm run build            # Build for production
npm start                # Start Electron application
npm run package          # Create installers
npm run lint             # Check code quality
npm run format           # Format code with Prettier
```

## Project Structure

```
worldenv/
├── asm/              # AssemblyScript (WASM)
├── src/              # TypeScript engine
│   ├── core/         # Engine systems
│   ├── components/   # ECS components
│   └── scenes/       # Game scenes
├── editor/           # WORLDEDIT
│   ├── src/          # Editor code
│   └── docs/         # Documentation
├── public/           # Static assets
├── build/            # WASM output
└── dist/             # Production build
```

## Key Directories

- Documentation: `editor/docs/`
- WORLDSRC: `editor/docs/worldsrc/`
- Templates: `editor/docs/guides/`
- Calendar: `editor/docs/calendar.txt`
- TODO Lists: `editor/docs/todo-*.txt`

## Documentation Files

Core Documentation:
- Agent instructions: `editor/docs/agent-instruct.md`
- Engine overview: `editor/docs/engine-overview.md`
- Engine setup: `editor/docs/engine-setup.md`
- Development overview: `editor/docs/development-overview.md`
- Documentation summary: `editor/docs/doc-summary.md`
- Quick reference: `editor/docs/quick-reference.md` (this file)

Implementation Documentation:
- Build guide: `editor/docs/build-guide.md`
- Quick start: `editor/docs/quickstart.md`
- Phase 1 status: `editor/docs/phase1-status.md`
- Implementation log: `editor/docs/implementation-log.md`

WORLDSRC Documentation:
- WORLDSRC manual: `editor/docs/worldsrc/worldsrc-manual.md`
- WORLDSRC lexicon: `editor/docs/worldsrc/worldsrc-lexicon.md`

Game Templates:
- 2D platformer: `editor/docs/guides/template-2d-platformer.md`
- First-person 3D: `editor/docs/guides/template-first-person-3d.md`

## Development Timeline

- Pre-Alpha: Oct 13, 2025 - Apr 28, 2026 (6 months)
- Alpha: Apr 29, 2026 - Dec 31, 2026 (8 months)
- Beta: Jan 1, 2027 - Jun 15, 2027 (5.5 months)
- Release: Jun 16, 2027 - Sep 15, 2027 (3 months)

## Current Phase

**Phase 1: Project Setup & Infrastructure - COMPLETE**
Completed: Current Session
Status: All tasks verified complete, build successful
Next: Phase 2 - Basic Electron Application

### Phase 1 Results
- Build time: ~2.7 seconds
- Main process: 2.91 KB (compiled)
- Renderer process: 19.2 KB (compiled)
- Zero compilation errors or warnings
- 15 core files created (~1,827 lines)
- 4 documentation files (~1,116 lines)

## Writing Standards

- Dry, concise, clinical, professional tone
- Active voice
- No emojis or decorative elements
- Direct technical language
- Step-by-step instructions
- Working code examples

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit types
- const/let only (no var)
- Functions under 50 lines
- TSDoc for public APIs

### C89 (Editor C code)
- NASA Power of 10 rules
- C-Form formatting
- No dynamic allocation after init
- Bounded loops
- Functions under 60 lines

### Editor (TypeScript/Electron)
- TypeScript strict mode
- Explicit types required
- ESLint rules enforced
- Prettier formatting
- Functions under 50 lines
- IPC via secure preload script

### WORLDSRC
- C-inspired syntax
- Type-safe
- Compiles to TS/AS
- Engine-specific built-ins

## Editor Architecture

### Process Model
- Main Process: Node.js runtime, system integration
- Renderer Process: Chromium browser, UI rendering
- IPC: Secure communication via preload script

### Key Files
- `editor/src/main/main.ts` - Application entry point
- `editor/src/main/preload.ts` - IPC bridge
- `editor/src/renderer/renderer.ts` - UI initialization
- `editor/src/shared/types.ts` - Type definitions

### Build System
- Webpack for main and renderer processes
- Development mode on port 9000
- Hot reload enabled
- Source maps for debugging

## Entity Component System

```typescript
// Create entity
const entity = new Entity();

// Add components
entity.addComponent<Transform>('Transform', {
  x: 0, y: 0, rotation: 0
});

// Get component
const transform = entity.getComponent<Transform>('Transform');

// Check component
if (entity.hasComponent<Sprite>('Sprite')) {
  // Has sprite
}
```

## WORLDSRC Quick Syntax

```worldsrc
// Variables
int x = 10;
float y = 3.14;
string name = "entity";

// Functions
int add(int a, int b) {
    return a + b;
}

// Components
component Health {
    int current;
    int maximum;
}

// Systems
system MovementSystem {
    void update(float delta) {
        foreach (Entity e in query<Transform, Velocity>()) {
            // Process entities
        }
    }
}

// Built-ins
print("Debug message");
bool key = is_key_down("Space");
vec2 pos = get_mouse_position();
float dt = get_delta_time();
```

## Common Tasks

### Create New Component
1. Define interface in `src/components/`
2. Implement component class
3. Register with component system
4. Add to inspector UI

### Create New Scene
1. Extend Scene class in `src/scenes/`
2. Implement init(), update(), render()
3. Load scene in main.ts

### Add WASM Module
1. Write AssemblyScript in `asm/`
2. Export functions
3. Run `npm run asbuild`
4. Import in TypeScript

### Debug
- Browser DevTools (F12)
- Console logging
- Source maps enabled
- Check `build/` for WASM output

## File Extensions

- `.ts` - TypeScript source
- `.as` - AssemblyScript source
- `.wasm` - WebAssembly binary
- `.scene.json` - Scene data
- `.prefab.json` - Prefab data
- `.worldenv` - Project config
- `.ws` - WORLDSRC source (planned)

## Important URLs

- Dev server: `http://localhost:5173`
- Preview server: `http://localhost:4173`
- TypeScript: https://www.typescriptlang.org
- AssemblyScript: https://www.assemblyscript.org
- Three.js: https://threejs.org
- Pixi.js: https://pixijs.com

## Git Workflow

```bash
# Commit format
[category] brief description

# Categories
feat, fix, docs, perf, refactor, test, build, chore

# Example
git commit -m "[feat] implement transform manipulator system"
```

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### WASM Not Compiling
```bash
npm run asbuild
# Check asm/ for syntax errors
```

### Port In Use
```bash
lsof -ti:5173 | xargs kill
npm run dev
```

## Performance Targets

- 60 FPS for games
- < 500MB base memory
- < 3 second editor startup
- < 1 second scene load
- 16.67ms frame budget

## Editor Keyboard Shortcuts

- W: Translate mode
- E: Rotate mode
- R: Scale mode
- F: Frame selected
- Delete: Delete selected
- F5: Play
- F6: Pause
- F8: Stop
- Ctrl+Z: Undo
- Ctrl+Y: Redo

## Support

- Issues: GitHub issue tracker
- Documentation: `editor/docs/`
- Examples: `editor/docs/guides/`
- Calendar: `editor/docs/calendar.txt`

## Version

WORLDENV Engine: Pre-Alpha
WORLDEDIT Editor: Pre-Alpha
WORLDSRC Language: Design Phase
Documentation: v1.0.0

Last Updated: October 13, 2025