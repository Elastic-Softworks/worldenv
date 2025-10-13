# WORLDEDIT BUILD GUIDE

Build and development instructions for WORLDEDIT Electron editor.

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

## Installation

Navigate to editor directory:

```bash
cd worldenv/editor
```

Install dependencies:

```bash
npm install
```

## Development

### Development Mode

Start development server with hot reload:

```bash
npm run dev
```

This command:
- Compiles main process with watch mode
- Starts webpack dev server for renderer
- Automatically reloads on code changes

Start Electron application:

```bash
npm start
```

### Separate Process Development

Run main process build with watch:

```bash
npm run dev:main
```

Run renderer process dev server:

```bash
npm run dev:renderer
```

## Building

### Production Build

Build all processes for production:

```bash
npm run build
```

Output location: `dist/`

### Main Process Only

```bash
npm run build:main
```

Output: `dist/main/`

### Renderer Process Only

```bash
npm run build:renderer
```

Output: `dist/renderer/`

## Packaging

### All Platforms

Create installer packages for all platforms:

```bash
npm run package
```

Output: `build/packages/`

### Platform-Specific

Windows:

```bash
npm run package:win
```

Outputs:
- NSIS installer (.exe)
- Portable executable

macOS:

```bash
npm run package:mac
```

Outputs:
- DMG disk image
- ZIP archive

Linux:

```bash
npm run package:linux
```

Outputs:
- AppImage
- Debian package (.deb)
- Tarball (.tar.gz)

## Code Quality

### Linting

Check for linting errors:

```bash
npm run lint
```

Fix linting errors automatically:

```bash
npm run lint:fix
```

### Formatting

Format code with Prettier:

```bash
npm run format
```

Check formatting without changes:

```bash
npm run format:check
```

## Project Structure

```
editor/
├── src/
│   ├── main/              Main process (Node.js/Electron)
│   │   ├── main.ts        Application entry point
│   │   └── preload.ts     IPC bridge/context isolation
│   ├── renderer/          Renderer process (browser)
│   │   ├── renderer.ts    UI entry point
│   │   ├── index.html     HTML template
│   │   └── styles/        CSS stylesheets
│   ├── shared/            Shared types and utilities
│   │   └── types.ts       Common type definitions
│   └── engine/            Engine integration layer
├── dist/                  Build output
├── build/                 Build resources and packages
├── docs/                  Documentation
├── package.json           Dependencies and scripts
├── tsconfig.json          TypeScript configuration
├── webpack.main.config.js     Main process build config
├── webpack.renderer.config.js Renderer process build config
├── .eslintrc.json         ESLint configuration
└── .prettierrc.json       Prettier configuration
```

## Build Configuration

### TypeScript

Configuration: `tsconfig.json`

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps enabled
- Path aliases for imports

### Webpack

Main process: `webpack.main.config.js`
- Target: electron-main
- Entry: main.ts, preload.ts
- Output: dist/main/

Renderer process: `webpack.renderer.config.js`
- Target: electron-renderer
- Entry: renderer.ts
- Output: dist/renderer/
- Dev server: localhost:9000

### Electron Builder

Configuration in `package.json` under `build` key.

Build resources location: `build/resources/`

Icons required:
- Windows: icon.ico (256x256)
- macOS: icon.icns (1024x1024)
- Linux: icon.png (512x512)

## Debugging

### Main Process

Use Node.js debugging:

```bash
node --inspect-brk ./dist/main/main.js
```

Attach debugger to port 9229.

### Renderer Process

Open DevTools in development mode (enabled by default).

Access via View menu or Ctrl+Shift+I (Windows/Linux) / Cmd+Option+I (macOS).

### Source Maps

Source maps enabled for both processes in development mode.

Maps TypeScript source to compiled JavaScript for debugging.

## Troubleshooting

### Build Failures

Clear build cache:

```bash
rm -rf dist/ node_modules/
npm install
npm run build
```

### TypeScript Errors

Check TypeScript version:

```bash
npx tsc --version
```

Regenerate type definitions:

```bash
npm run build
```

### Webpack Issues

Clear webpack cache:

```bash
rm -rf node_modules/.cache/
```

### Electron Issues

Clear Electron cache:

```bash
rm -rf ~/.electron/
```

Reinstall Electron:

```bash
npm install electron --force
```

## Performance

### Development Build

- Main process: ~1-2 seconds
- Renderer process: ~3-5 seconds
- Hot reload: <1 second

### Production Build

- Full build: ~10-15 seconds
- Minification enabled
- Source maps optional

### Package Creation

- Windows: ~30-60 seconds
- macOS: ~45-90 seconds
- Linux: ~30-60 seconds

## Environment Variables

Set build environment:

```bash
NODE_ENV=production npm run build
```

Custom port for dev server:

```bash
PORT=9001 npm run dev:renderer
```

## Dependencies

Core dependencies:
- electron: Desktop application framework
- electron-store: Settings persistence

Development dependencies:
- typescript: Language compiler
- webpack: Module bundler
- ts-loader: TypeScript loader for webpack
- eslint: Code linting
- prettier: Code formatting
- electron-builder: Application packaging

## Continuous Integration

Recommended CI workflow:

1. Install dependencies
2. Run linting
3. Run formatting check
4. Build all processes
5. Run tests (when available)
6. Create packages (release only)

Example:

```bash
npm ci
npm run lint
npm run format:check
npm run build
npm run package
```

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Commit changes
4. Create git tag
5. Build packages
6. Upload to release platform

```bash
npm version patch
npm run build
npm run package
git push --tags
```

## Additional Resources

- Electron documentation: https://electronjs.org/docs
- TypeScript handbook: https://www.typescriptlang.org/docs
- Webpack guides: https://webpack.js.org/guides

---

END OF BUILD GUIDE