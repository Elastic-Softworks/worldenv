# AGENT INSTRUCTIONS FOR WORLDENV DEVELOPMENT

## Communication Style

Use dry, concise, clinical, professional, and utilitarian tone in all documentation and code comments.

### Writing Rules

1. Use active voice
2. State facts directly without hedging
3. Avoid conversational language
4. Eliminate unnecessary words
5. No emojis or decorative elements
6. Use imperative mood for instructions
7. Present information in logical order
8. Use technical terminology correctly
9. Keep sentences short and clear
10. Structure content with clear hierarchy

### Documentation Format

- Start with purpose statement
- List prerequisites when applicable
- Present steps in sequential order
- Include code examples without explanation unless necessary
- State expected outcomes
- Reference related documents with paths only

## Code Standards

### TypeScript/JavaScript

- Use TypeScript strict mode
- Declare types explicitly
- Follow ES2020+ standards
- Use const for immutable bindings
- Use let for mutable bindings
- Never use var
- Prefer async/await over promises
- Document public APIs with TSDoc comments
- Keep functions under 50 lines
- Single responsibility per function

### AssemblyScript

- Mirror TypeScript conventions
- Use explicit types always
- Optimize for WASM performance
- Minimize memory allocations
- Use typed arrays for data structures
- Document performance implications
- Profile performance-critical code

### C89 (Editor Code)

- Follow NASA Power of 10 rules
- Use C-Form formatting style
- No dynamic allocation after initialization
- All loops must have fixed upper bounds
- No recursion
- All functions under 60 lines
- Two space indentation
- Align declarations vertically
- Comment intent, not implementation
- All variables declared at function start

### C-Form Formatting

```c
void function_name(type_t* param) {

    int     local_var;
    float   other_var;
    char*   pointer;
    
    /* COMMENT DESCRIBES SECTION PURPOSE */
    for  (i = 0; i < MAX_BOUND; i++) {
    
        /* Implementation */
        
    }
    
}
```

## Project Structure

### File Organization

```
worldenv/
├── asm/              # AssemblyScript performance layer
├── src/              # TypeScript game engine
│   ├── core/         # Core engine systems
│   ├── components/   # ECS components
│   ├── scenes/       # Scene management
│   └── main.ts       # Entry point
├── editor/           # WORLDEDIT Electron editor
│   ├── src/          # Editor source code
│   │   ├── main/     # Electron main process
│   │   ├── renderer/ # UI renderer process
│   │   └── shared/   # Shared utilities
│   └── docs/         # Editor documentation
└── docs/             # Engine documentation
```

### Naming Conventions

- Files: kebab-case (transform-component.ts)
- Classes: PascalCase (TransformComponent)
- Functions: camelCase (updateTransform)
- Constants: UPPER_SNAKE_CASE (MAX_ENTITIES)
- Interfaces: PascalCase with I prefix when ambiguous (IComponent)
- Types: PascalCase ending in Type (ConfigType)
- Enums: PascalCase (EntityState)

## Development Workflow

### Pre-Alpha Phase Tasks

1. Complete Phase 1: Project setup and infrastructure
2. Complete Phase 2: Basic Electron application
3. Continue through phases sequentially
4. Reference calendar.txt for timeline
5. Update documentation as features are implemented
6. Test each phase before proceeding
7. Document deviations from plan

### Documentation Requirements

- Write documentation before implementation
- Update documentation during implementation
- Document all public APIs
- Include code examples for complex features
- Maintain consistency across all documents
- Use relative paths for cross-references
- Keep examples minimal and functional

### Documentation File Management

- Do NOT create phase-specific files (phase1-README.md, phase2-report.md, phase4-summary.md, phase5-testing.md, etc.)
- Do NOT create temporary documentation files for any purpose
- Update existing documentation files only
- Consolidate phase information into appropriate existing documents
- Prevents file overload and maintains organized structure
- Valid documentation files in editor/docs/:
  - calendar.txt: Timeline and scheduling
  - todo-prealpha.txt: Pre-alpha task tracking
  - todo-alpha.txt: Alpha task tracking
  - todo-beta.txt: Beta task tracking
  - todo-release.txt: Release task tracking
  - agent-instruct.md: Agent development guidelines
  - README.md: Project overview and getting started
- Add phase completion notes to todo files, not separate documents
- Update README.md with current status and features
- Document architecture changes in appropriate sections of existing files
- Delete any phase-specific files immediately if accidentally created

### Testing Approach

- Test each component in isolation
- Integration test after phase completion
- Manual test all UI interactions
- Profile performance-critical paths
- Validate against success criteria
- Document known issues
- Fix critical bugs before proceeding

## WORLDSRC Language

### Design Principles

- C-inspired syntax
- Type-safe by default
- Compiles to TypeScript/AssemblyScript
- Engine-specific built-in functions
- Zero-cost abstractions where possible
- Explicit over implicit
- Performance-focused

### Implementation Order

1. Lexer (Phase 15.2)
2. Parser (Phase 15.3)
3. Semantic analyzer (Alpha Phase 16.1)
4. Type checker (Alpha Phase 16.2)
5. Code generator (Alpha Phase 16.3)
6. Standard library (Alpha Phase 16.4)
7. Optimization pass (Beta Phase 4.1)
8. Debugger integration (Beta Phase 4.4)

### Documentation Structure

- Manual: Comprehensive language guide
- Lexicon: Function and syntax reference
- Examples: Practical code samples
- Migration: TypeScript to WORLDSRC guide

## Editor Development

### Technology Stack

- Electron: Desktop application framework
- TypeScript: Editor logic
- React or Vue: UI framework (selected in Phase 3.1)
- Monaco Editor: Code editing component
- Three.js: 3D viewport rendering
- Pixi.js: 2D viewport rendering

### Core Features by Phase

Phase 1-4: Foundation (UI, viewport, rendering)
Phase 5-7: Scene editing (hierarchy, components, inspector)
Phase 8-9: Asset management and engine integration
Phase 10-11: Script editing and project management
Phase 12-14: Tools (manipulators, undo/redo, build system)
Phase 15: WORLDSRC foundation
Phase 16: Testing and polish

### UI Design Principles

- Function over form
- Consistent layout across panels
- Keyboard-first navigation
- Context-sensitive help
- Minimal visual noise
- Clear state indication
- Responsive feedback
- Professional appearance

## Engine Architecture

### Core Systems

- Game: Main game loop and initialization
- Scene: Scene graph and lifecycle management
- Entity: Entity-component system
- Renderer: 2D/3D rendering pipeline
- Input: Keyboard, mouse, gamepad handling
- Physics: Collision and physics simulation
- Audio: Sound and music playback
- Assets: Resource loading and caching

### Component System

- Pure data structures
- No logic in components
- Serializable by default
- Type-safe properties
- Minimal dependencies
- Composable architecture

### Performance Targets

- 60 FPS minimum for games
- 16.67ms frame budget
- < 500MB base memory usage
- < 3 second editor startup
- < 1 second scene load (typical)
- Zero-allocation game loops where possible

## Version Control

### Commit Messages

Format: `[category] brief description`

Categories:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- perf: Performance improvement
- refactor: Code restructuring
- test: Test additions or changes
- build: Build system changes
- chore: Maintenance tasks

Example: `[feat] implement transform manipulator system`

### Branch Strategy

- main: Stable releases only
- develop: Active development
- feature/*: Feature branches
- fix/*: Bug fix branches
- docs/*: Documentation branches

### Pull Request Requirements

- All tests pass
- Documentation updated
- Code follows style guide
- No compiler warnings
- Performance tested if applicable
- Reviewed by at least one developer

## Debugging Procedures

### TypeScript/JavaScript

1. Use browser developer tools
2. Set breakpoints in source maps
3. Inspect variable state
4. Profile performance
5. Check console for errors
6. Validate network requests

### AssemblyScript/WASM

1. Enable debug build with source maps
2. Use WASM debugging tools
3. Validate memory access
4. Profile WASM execution
5. Compare with TypeScript implementation
6. Test boundary conditions

### Editor (Electron)

1. Open DevTools for renderer process
2. Use main process debugging
3. Check IPC communication
4. Validate file system operations
5. Test on all target platforms
6. Review error logs

## Build Process

### Development Build

```bash
npm run dev          # Start dev server
npm run asbuild      # Compile WASM modules
```

### Production Build

```bash
npm run build        # Full production build
```

### Editor Build

```bash
cd editor
npm run dev          # Development mode
npm run build        # Production build
npm run package      # Create installers
```

## Error Handling

### Guidelines

- Validate all inputs
- Handle all error cases
- Provide useful error messages
- Log errors appropriately
- Recover gracefully when possible
- Fail fast on critical errors
- Never silently ignore errors

### Error Message Format

```
[SYSTEM] Operation: Specific error description
Expected: what should happen
Actual: what happened
Action: how to resolve
```

## Documentation Updates

### When to Update

- Before implementing new features
- After completing implementation
- When changing existing behavior
- When fixing bugs that affect documentation
- When adding new APIs
- When deprecating features

### What to Document

- Public APIs and interfaces
- Configuration options
- Command-line tools
- File formats
- Build procedures
- Deployment steps
- Troubleshooting guides
- Migration guides

## References

- Development calendar: `editor/docs/calendar.txt`
- Pre-alpha tasks: `editor/docs/todo-prealpha.txt`
- Alpha tasks: `editor/docs/todo-alpha.txt`
- Beta tasks: `editor/docs/todo-beta.txt`
- Release tasks: `editor/docs/todo-release.txt`
- Engine README: `README.md`
- Editor README: `editor/README.md`

## Completion Criteria

### Definition of Done

- Feature implemented and functional
- Tests written and passing
- Documentation updated
- Code reviewed
- No compiler warnings
- Performance validated
- Known issues documented
- Success criteria met

### Phase Completion

- All phase tasks completed
- Integration tests passing
- Performance benchmarks met
- Documentation current
- Demo project functional
- Team sign-off obtained

## Support

File issues in GitHub issue tracker with:
- Description of problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- System information
- Error messages
- Screenshots if applicable

---

END OF AGENT INSTRUCTIONS