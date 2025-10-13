# WORLDEDIT QUICK START

Quick start guide for WORLDEDIT development.

## Installation

```bash
cd worldenv/editor
npm install
```

## Development

Start development server:

```bash
npm run dev
```

In separate terminal, start Electron:

```bash
npm start
```

## Building

Build for production:

```bash
npm run build
```

## Project Structure

```
editor/
├── src/
│   ├── main/          # Electron main process
│   ├── renderer/      # UI renderer process
│   ├── shared/        # Shared types
│   └── engine/        # Engine integration
├── dist/              # Build output
└── docs/              # Documentation
```

## Key Files

- `src/main/main.ts` - Application entry point
- `src/main/preload.ts` - IPC bridge
- `src/renderer/renderer.ts` - UI entry point
- `src/shared/types.ts` - Type definitions

## Build Scripts

- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build
- `npm start` - Start Electron
- `npm run package` - Create installers
- `npm run lint` - Check code quality
- `npm run format` - Format code

## Code Quality

Lint code:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

## Development Workflow

1. Make changes to source files
2. Webpack automatically rebuilds
3. Refresh Electron window (Ctrl+R)
4. Test changes
5. Run linter before commit
6. Format code before commit

## Architecture

### Main Process

Node.js environment. Handles:
- File system operations (read/write/JSON)
- Window management with state persistence
- Project management (.worldenv files)
- Auto-save functionality
- File system watching
- IPC communication (40+ handlers)
- System integration
- Application menu
- Dialog operations

### Renderer Process

Browser environment. Handles:
- UI rendering
- User interaction
- Editor state
- Viewport rendering
- Project display

### IPC Communication

Secure communication via preload script:
- Context isolation enabled
- Controlled API surface (window.worldedit)
- Type-safe messages
- Event listeners (on/off/once)

## Current Features

### Project Management

Create, open, save, and close projects:

```typescript
// Create new project
await window.worldedit.project.create(path, name);

// Open existing project
await window.worldedit.project.open(path);

// Save project
await window.worldedit.project.save();

// Close project
await window.worldedit.project.close();
```

### File System Operations

```typescript
// Read/write files
const content = await window.worldedit.fs.readFile(path);
await window.worldedit.fs.writeFile(path, content);

// Read/write JSON
const data = await window.worldedit.fs.readJSON(path);
await window.worldedit.fs.writeJSON(path, data);

// Check file status
const exists = await window.worldedit.fs.exists(path);
const isFile = await window.worldedit.fs.isFile(path);
```

### Dialog Operations

```typescript
// File dialogs
const file = await window.worldedit.dialog.openFile(options);
const dir = await window.worldedit.dialog.openDirectory(options);

// Message dialogs
await window.worldedit.dialog.showError(title, message);
const confirmed = await window.worldedit.dialog.showConfirm(title, message);
```

## Adding Features

### New IPC Handler

Main process (`src/main/ipc.ts`):

```typescript
ipcMain.handle('feature:action', async (event, data) => {
  return result;
});
```

Preload script (`src/main/preload.ts`):

```typescript
feature: {
  action: (data: any): Promise<any> => {
    return ipcRenderer.invoke('feature:action', data);
  }
}
```

Renderer process (`src/renderer/renderer.ts`):

```typescript
const result = await window.worldedit.feature.action(data);
```

### New Type Definition

Add to `src/shared/types.ts`:

```typescript
export interface NewType {
  property: string;
}
```

## Debugging

### Main Process

Add breakpoints in VSCode or use:

```bash
node --inspect-brk ./dist/main/main.js
```

### Renderer Process

Open DevTools (Ctrl+Shift+I) and use browser debugging tools.

### Source Maps

Source maps enabled in development mode. Debug TypeScript directly.

## Common Issues

### Build fails

Clear cache and rebuild:

```bash
rm -rf dist/ node_modules/
npm install
npm run build
```

### Hot reload not working

Restart dev server:

```bash
npm run dev
```

### TypeScript errors

Check tsconfig.json and verify all types are correct.

## Documentation

- `README.md` - Project overview
- `docs/build-guide.md` - Complete build instructions
- `docs/implementation-log.md` - Development log with phase reports
- `docs/agent-instruct.md` - Development guidelines
- `docs/todo-prealpha.txt` - Task tracking

## Code Standards

- TypeScript strict mode
- ESLint rules enforced
- Prettier formatting
- Explicit types required
- No unused variables
- Error handling required

## Current Status

Phase 1: COMPLETE
- Project infrastructure
- Build system
- Basic Electron setup

Phase 2: COMPLETE
- Window management
- File system operations
- Project management
- Auto-save
- IPC handlers
- Application menu

Next: Phase 3 - UI Framework & Layout

See `docs/todo-prealpha.txt` for complete task list and `docs/implementation-log.md` for detailed reports.

---

END OF QUICK START