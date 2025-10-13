# WORLDENV Engine Setup

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- Modern web browser with WebGL 2.0
- Code editor (VSCode recommended)

## Installation

### Clone Repository

```bash
git clone https://github.com/your-org/worldenv.git
cd worldenv
```

### Install Dependencies

```bash
npm install
```

## Project Structure

```
worldenv/
├── asm/              # AssemblyScript source
├── src/              # TypeScript source
│   ├── core/         # Engine systems
│   ├── components/   # ECS components
│   └── scenes/       # Scene management
├── public/           # Static assets
├── build/            # WASM output
├── dist/             # Production build
└── scripts/          # Build scripts
```

## Configuration

### TypeScript (tsconfig.json)

Default configuration included. Key settings:
- Target: ES2020
- Module: ES2020
- Strict mode enabled
- Source maps enabled

### AssemblyScript (asconfig.json)

Two build targets:
- Debug: Full debugging symbols
- Release: Optimized for production

### Vite (vite.config.ts)

Development server configuration:
- Port: 5173
- Hot module replacement enabled
- Source map support

## Development

### Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Compile AssemblyScript

```bash
npm run asbuild
```

Output: `build/optimized.wasm`

## Editor Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- C/C++ compiler (for native Electron modules)

### Install Editor Dependencies

```bash
cd editor
npm install
```

### Editor Project Structure

```
editor/
├── src/
│   ├── main/          # Electron main process
│   ├── renderer/      # UI renderer process
│   ├── shared/        # Shared types and utilities
│   └── engine/        # Engine integration layer
├── assets/            # Editor UI resources
├── templates/         # Project templates
├── build/             # Build output
├── dist/              # Compiled output
└── docs/              # Documentation
```

### Editor Configuration

#### TypeScript (tsconfig.json)

Editor-specific configuration:
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Path aliases for imports

#### Webpack

Two configurations:
- `webpack.main.config.js` - Main process
- `webpack.renderer.config.js` - Renderer process

#### Code Quality

- ESLint: `.eslintrc.json`
- Prettier: `.prettierrc.json`

### Editor Development

Start development mode:

```bash
cd editor
npm run dev
```

In separate terminal, start Electron:

```bash
npm start
```

### Build Editor

Production build:

```bash
cd editor
npm run build
```

Create installers:

```bash
npm run package
```

Output: `build/packages/`

### Editor Documentation

- Quick start: `docs/quickstart.md`
- Build guide: `docs/build-guide.md`
- Phase 1 status: `docs/phase1-status.md`

### Build Production

```bash
npm run build
```

Output: `dist/` directory

## Project Creation

### Basic Game Template

```typescript
// src/main.ts
import { Game } from './core/Game';

const game = new Game({
  width: 800,
  height: 600,
  canvasId: 'gameCanvas'
});

await game.init();
game.run();
```

### HTML Entry Point

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WORLDENV Game</title>
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### AssemblyScript Module

```typescript
// asm/index.ts
export function add(a: i32, b: i32): i32 {
  return a + b;
}
```

## Verification

### Test TypeScript

```bash
npm run dev
```

Check browser console for errors.

### Test AssemblyScript

```bash
npm run asbuild
```

Check `build/` for WASM output.

### Test Build

```bash
npm run build
npm run preview
```

Opens production build at `http://localhost:4173`

## Common Issues

### Module Resolution Errors

Solution: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### WASM Compilation Fails

Solution: Check AssemblyScript syntax
```bash
npm run asbuild
```

Review error output for syntax issues.

### Port Already in Use

Solution: Change port in vite.config.ts or kill existing process
```bash
lsof -ti:5173 | xargs kill
npm run dev
```

## Next Steps

- Read engine overview: `editor/docs/engine-overview.md`
- Follow game templates: `editor/docs/guides/`
- Install WORLDEDIT: `editor/README.md`

## References

- TypeScript: https://www.typescriptlang.org
- AssemblyScript: https://www.assemblyscript.org
- Three.js: https://threejs.org
- Pixi.js: https://pixijs.com
- Vite: https://vitejs.dev