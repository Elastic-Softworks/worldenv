# WORLDEDIT DEVELOPER GUIDE

**Viewport & Rendering Systems Architecture**

**Complete guide for developing and contributing to WORLDEDIT**

## Table of Contents

- [Development Environment](#development-environment)
- [Build System](#build-system)
- [Project Architecture](#project-architecture)
- [Viewport System Architecture](#viewport-system-architecture)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Development Environment

### Prerequisites

**Required Software:**
- Node.js 18+ and npm 9+
- Git 2.30+
- Visual Studio Code (recommended)
- TypeScript 5.3+

**Platform-Specific Requirements:**

**Windows:**
```bash
# Install Visual Studio Build Tools
npm install -g windows-build-tools

# Install Python (for native modules)
choco install python3
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install build-essential python3 python3-pip
sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxss1-dev libgconf-2-4
```

### Repository Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/elastic-softworks/worldenv.git
   cd worldenv/editor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Installation**
   ```bash
   npm run build
   npm run start
   ```

### IDE Configuration

**Visual Studio Code Extensions:**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier - Code formatter
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

## Build System

### Architecture Overview

WORLDEDIT uses a dual-process Electron architecture:
- **Main Process**: Node.js backend (file system, IPC)
- **Renderer Process**: Chromium frontend (UI, viewport)

### Build Configuration

**package.json Scripts:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "webpack --config webpack.main.config.js --mode development --watch",
    "dev:renderer": "webpack serve --config webpack.renderer.config.js --mode development",
    "build": "npm run build:main && npm run build:renderer",
    "build:main": "webpack --config webpack.main.config.js --mode production",
    "build:renderer": "webpack --config webpack.renderer.config.js --mode production",
    "start": "electron .",
    "package": "electron-builder",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,scss}\""
  }
}
```

### Webpack Configuration

**Main Process (webpack.main.config.js):**
```javascript
module.exports = {
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
    preload: './src/main/preload.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: false }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
};
```

**Renderer Process (webpack.renderer.config.js):**
```javascript
module.exports = {
  target: 'electron-renderer',
  entry: './src/renderer/renderer.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: false }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@engine': path.resolve(__dirname, 'src/engine')
    }
  }
};
```

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@main/*": ["main/*"],
      "@renderer/*": ["renderer/*"],
      "@shared/*": ["shared/*"],
      "@engine/*": ["engine/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### Build Commands

**Development Build:**
```bash
# Start development server with hot reload
npm run dev

# Build main process only
npm run dev:main

# Build renderer process only
npm run dev:renderer
```

**Production Build:**
```bash
# Full production build
npm run build

# Build for packaging
npm run package

# Platform-specific builds
npm run package:win
npm run package:mac
npm run package:linux
```

## Project Architecture

### Directory Structure

```
editor/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Application entry point
│   │   ├── preload.ts     # Renderer process bridge
│   │   ├── window-manager.ts
│   │   ├── asset-manager.ts
│   │   ├── file-system.ts
│   │   └── engine/        # Engine integration
│   ├── renderer/          # Electron renderer process
│   │   ├── renderer.tsx   # React entry point
│   │   ├── components/    # UI components
│   │   ├── context/       # React contexts
│   │   ├── core/          # Core systems
│   │   ├── viewport/      # 3D/2D rendering
│   │   └── styles/        # CSS styling
│   ├── shared/            # Shared types and utilities
│   │   └── types/         # TypeScript definitions
│   └── engine/            # Game engine interface
├── dist/                  # Build output
├── build/                 # Packaging output
├── docs/                  # Documentation
├── webpack.*.config.js    # Build configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

### Key Components

**Main Process Components:**
- **WindowManager**: Electron window lifecycle
- **AssetManager**: File import and processing
- **FileSystem**: Project file operations
- **EngineService**: Game engine integration
- **Logger**: Application logging

**Renderer Process Components:**
- **ViewportPanel**: 3D/2D scene rendering
- **HierarchyPanel**: Scene object tree
- **InspectorPanel**: Property editing
- **AssetBrowserPanel**: File management
- **ScriptEditorPanel**: Code editing

### Data Flow

**Core Implementation:**
```
User Action → React Components → IPC Channel → Main Process → Scene Manager
     ↓              ↓                            ↓              ↓
UI Update ← Context State ← IPC Response ← File Operations ← Scene Data
     ↓              ↓
Hierarchy Panel ← EditorState
     ↓              ↓
Inspector Panel ← Scene Manager (Renderer)
```

**Engine Integration Flow:**
```
Editor UI → Scene Operations → IPC → Main Process Scene Manager
    ↓                                        ↓
Hierarchy Updates ← Scene Events ← Engine Status Check
    ↓                                        ↓
Real-time UI ← Component System ← WORLDC Integration
```

### Inter-Process Communication

**Scene Management IPC (Implemented):**
```typescript
// Scene creation
ipcMain.handle('scene:create', async (event, name, template) => {
  return await sceneManager.createScene(name, template);
});

// Scene loading
ipcMain.handle('scene:load', async (event, scenePath) => {
  return await sceneManager.loadScene(scenePath);
});

// Scene saving
ipcMain.handle('scene:save', async (event, sceneData) => {
  return await sceneManager.saveScene(sceneData);
});
```

**Engine Status IPC (Implemented):**
```typescript
// Engine status monitoring
ipcMain.handle('engine:status', async () => {
  return engineInterface.getStatus();
});

// Engine initialization
ipcMain.handle('engine:initialize', async () => {
  return await engineInterface.initialize();
});
```

**File System IPC (Enhanced):**
```typescript
// Enhanced file operations for scene management
ipcMain.handle('fs:readJSON', async (event, path) => {
  const content = await fs.readFile(path, 'utf8');
  return JSON.parse(content);
});

ipcMain.handle('fs:writeJSON', async (event, path, data) => {
  const content = JSON.stringify(data, null, 2);
  return await fs.writeFile(path, content, 'utf8');
});
```

**Event System (Real-time Updates):**
```typescript
// Scene change events
sceneManager.on('sceneLoaded', (sceneData) => {
  mainWindow.webContents.send('scene:loaded', sceneData);
});

// Engine status updates
engineInterface.on('statusChanged', (status) => {
  mainWindow.webContents.send('engine:statusChanged', status);
});

// Renderer event handling
window.worldedit.events.on('scene:loaded', (sceneData) => {
  editorState.setActiveScene(sceneData);
  hierarchyPanel.updateHierarchy(sceneData.entities);
});
```

## Viewport System Architecture

### Overview

The viewport and rendering system provides comprehensive real-time 3D/2D scene visualization, object manipulation, and visual feedback. The system is built around several key components that work together to create a professional editing experience.

### Core Architecture

```
ViewportManager
    ├── ViewportRenderer3D (Three.js)
    │   ├── ObjectSelectionSystem
    │   ├── CameraControlsIntegration  
    │   ├── EntityRenderingSystem
    │   └── ManipulatorManager
    │
    ├── ViewportRenderer2D (PIXI.js)
    │   ├── 2D Selection System
    │   ├── 2D Camera Controls
    │   └── Sprite Rendering
    │
    └── Shared Systems
        ├── Event Coordination
        ├── Performance Optimization
        └── Resource Management
```

### ObjectSelectionSystem

Provides advanced object selection with visual feedback:

```typescript
class ObjectSelectionSystem extends THREE.EventDispatcher {
  // Multi-selection with Ctrl/Shift
  handleMouseDown(event: MouseEvent): void;
  performSelection(x: number, y: number, multiSelect: boolean): void;
  
  // Visual feedback
  applySelectionHighlight(object: THREE.Object3D): void;
  updateSelectionBox(): void;
  
  // Event integration  
  dispatchSelectionEvent(type: string): void;
}
```

**Key Features:**
- Raycasting-based object picking
- Multi-selection with keyboard modifiers
- Visual highlighting with outline materials
- Selection box visualization
- Bidirectional hierarchy synchronization

### CameraControlsIntegration

Advanced camera controls with smooth animations:

```typescript
class CameraControlsIntegration {
  // Core navigation
  handleRotate(deltaX: number, deltaY: number): void;
  handlePan(deltaX: number, deltaY: number): void; 
  handleZoom(delta: number): void;
  
  // Focus operations
  focusOnObject(object: THREE.Object3D): void;
  focusOnBounds(box: THREE.Box3): void;
  
  // Animation system
  update(): boolean;
  startAnimation(): void;
}
```

**Key Features:**
- Orbit, pan, and zoom controls
- Focus-on-object functionality
- Touch support for mobile devices
- Configurable interaction settings
- Smooth damping and animation

### EntityRenderingSystem

Maps scene entities to visual objects:

```typescript
class EntityRenderingSystem {
  // Entity lifecycle
  addEntity(entity: Entity): void;
  updateEntity(entityId: string): void;
  removeEntity(entityId: string): void;
  
  // Visual creation
  createVisualForEntity(entity: Entity): THREE.Object3D;
  createMeshFromRenderer(component: MeshRendererComponent): THREE.Mesh;
  createLightFromComponent(component: LightComponent): THREE.Light;
  
  // Performance optimization
  private materialCache: Map<string, THREE.Material>;
  private geometryCache: Map<string, THREE.BufferGeometry>;
}
```

**Key Features:**
- Component-driven visual creation
- Material and geometry caching
- Helper visualization (lights, cameras, colliders)
- Performance optimization with dirty tracking
- Support for both 3D and 2D rendering

### ManipulatorManager

Transform gizmos for object manipulation:

```typescript
class ManipulatorManager extends THREE.Group {
  setMode(mode: ManipulatorMode): void; // TRANSLATE, ROTATE, SCALE
  setTargets(targets: THREE.Object3D[]): void;
  setTransformSpace(space: TransformSpace): void; // WORLD, LOCAL
}
```

**Key Features:**
- Multiple manipulation modes
- World and local transform spaces
- Multi-object manipulation
- Undo/redo integration (framework ready)
- Keyboard shortcuts (W/E/R)

### Performance Optimization

The viewport system includes several performance optimizations:

1. **Material Caching**: Shared materials reduce memory usage
2. **Geometry Caching**: Primitive geometries are cached and reused
3. **Dirty Tracking**: Only updated objects are re-rendered
4. **Frustum Culling**: Off-screen objects are automatically culled
5. **LOD System**: Framework ready for level-of-detail optimization

### Integration Points

The viewport system integrates with other editor systems:

- **Hierarchy Panel**: Bidirectional selection synchronization
- **Inspector Panel**: Real-time property updates
- **Component System**: Visual representation of component data
- **Scene Manager**: Entity lifecycle management
- **Undo/Redo**: Transform operation history (framework ready)

## Development Workflow

### Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Implement Feature**
   - Write TypeScript code following style guide
   - Add unit tests for new functionality
   - Update documentation
   - Test in development mode

3. **Code Review**
   ```bash
   # Lint and format code
   npm run lint
   npm run format
   
   # Run tests
   npm test
   
   # Build and verify
   npm run build
   ```

4. **Submit Pull Request**
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes
   - Ensure CI passes

### Development Commands

**Code Quality:**
```bash
# Lint TypeScript code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

**Testing:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Hot Reload Development

**Development Server Features:**
- Automatic TypeScript compilation
- Live reload on file changes
- Source map support for debugging
- Error overlay in development

**Development Workflow:**
1. Start development server: `npm run dev`
2. Make code changes
3. Save files (automatic compilation)
4. Test changes in running application
5. Debug with Chrome DevTools

### Debugging

**Main Process Debugging:**
```bash
# Start with debugging enabled
npm run dev:main -- --inspect=9229

# Attach debugger in VS Code or Chrome DevTools
```

**Renderer Process Debugging:**
- Open Chrome DevTools in Electron app
- Use React DevTools extension
- Console logging and breakpoints
- Network tab for asset loading

**Common Debug Scenarios:**
- IPC communication issues
- File system operations
- Asset loading problems
- UI component state management

## Code Standards

### TypeScript Guidelines

**Naming Conventions:**
- **Classes**: PascalCase (`ViewportManager`)
- **Interfaces**: PascalCase with 'I' prefix (`IAssetManager`)
- **Functions**: camelCase (`loadAsset`)
- **Variables**: camelCase (`currentScene`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ENTITIES`)
- **Files**: kebab-case (`asset-manager.ts`)

**Type Safety:**
```typescript
// Use strict typing
interface AssetData {
  id: string;
  path: string;
  type: AssetType;
  metadata?: AssetMetadata;
}

// Avoid 'any' type
function processAsset(asset: AssetData): ProcessedAsset {
  // Implementation
}

// Use generics for reusability
class ComponentManager<T extends Component> {
  private components: Map<string, T> = new Map();
  
  add(id: string, component: T): void {
    this.components.set(id, component);
  }
}
```

**Error Handling:**
```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function loadAsset(path: string): Promise<Result<Asset>> {
  try {
    const asset = await AssetLoader.load(path);
    return { success: true, data: asset };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### React Guidelines

**Component Structure:**
```typescript
// Functional components with TypeScript
interface ComponentProps {
  data: ComponentData;
  onUpdate: (data: ComponentData) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ data, onUpdate }) => {
  const [localState, setLocalState] = useState<LocalState>(initialState);
  
  const handleAction = useCallback((action: Action) => {
    // Handle action
    onUpdate(updatedData);
  }, [onUpdate]);
  
  return (
    <div className="my-component">
      {/* Component JSX */}
    </div>
  );
};
```

**Hooks Usage:**
```typescript
// Custom hooks for shared logic
function useAssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  
  const loadAsset = useCallback(async (path: string) => {
    const result = await AssetManager.load(path);
    if (result.success) {
      setAssets(prev => [...prev, result.data]);
    }
  }, []);
  
  return { assets, loadAsset };
}
```

### C-Form Style Guidelines

**File Structure:**
```c
/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
   ===============================================================
             COMPONENT NAME
   ===============================================================
*/

#include <standard_headers>    /* STANDARD LIBRARIES FIRST */
#include "project_headers.h"   /* PROJECT HEADERS LAST */

/*
   ===============================================================
             GLOBAL DECLARATIONS
   ===============================================================
*/

static int global_variable;

/*
   ===============================================================
             FUNCTION IMPLEMENTATIONS
   ===============================================================
*/

/*

         function_name()
           ---
           Brief description of function purpose.
           
           Detailed explanation of implementation,
           parameters, and behavior.

*/

void function_name(int parameter_one, char* parameter_two) {

  int    local_variable;
  char*  pointer_variable;    /* Align declarations */
  float  another_variable;    /* by type and name */

  local_variable   = 100;     /* Align assignments */
  pointer_variable = "value"; /* vertically */

  if  (condition && another_condition) {

    for  (int i = 0; i < count; i++) {
      process_element(i);
    }
    
  } else {
  
    handle_alternative();
    
  }

}
```

## Testing

### Test Framework

**Jest Configuration:**
```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src", "<rootDir>/tests"],
    "testMatch": [
      "**/__tests__/**/*.ts",
      "**/?(*.)+(spec|test).ts"
    ],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**"
    ]
  }
}
```

### Unit Testing

**Component Testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';

describe('InspectorPanel', () => {
  it('renders component properties', () => {
    const mockComponent = {
      type: 'Transform',
      properties: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      }
    };
    
    render(<InspectorPanel component={mockComponent} />);
    
    expect(screen.getByText('Transform')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });
  
  it('updates property values', () => {
    const onUpdate = jest.fn();
    render(<InspectorPanel component={mockComponent} onUpdate={onUpdate} />);
    
    const input = screen.getByLabelText('Position X');
    fireEvent.change(input, { target: { value: '10' } });
    
    expect(onUpdate).toHaveBeenCalledWith({
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        position: { x: 10, y: 0, z: 0 }
      }
    });
  });
});
```

**Service Testing:**
```typescript
import { AssetManager } from '../AssetManager';

describe('AssetManager', () => {
  beforeEach(() => {
    AssetManager.reset();
  });
  
  it('loads assets successfully', async () => {
    const mockAsset = { id: '1', path: 'test.png', type: 'texture' };
    jest.spyOn(FileSystem, 'readFile').mockResolvedValue(mockAsset);
    
    const result = await AssetManager.loadAsset('test.png');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockAsset);
  });
  
  it('handles load errors gracefully', async () => {
    jest.spyOn(FileSystem, 'readFile').mockRejectedValue(new Error('File not found'));
    
    const result = await AssetManager.loadAsset('missing.png');
    
    expect(result.success).toBe(false);
    expect(result.error.message).toBe('File not found');
  });
});
```

### Integration Testing

**E2E Testing with Playwright:**
```typescript
import { test, expect } from '@playwright/test';

test('create new project workflow', async ({ page }) => {
  await page.goto('http://localhost:9000');
  
  // Click new project button
  await page.click('[data-testid="new-project-button"]');
  
  // Fill project details
  await page.fill('[data-testid="project-name"]', 'Test Project');
  await page.selectOption('[data-testid="template-select"]', '2d-platformer');
  
  // Create project
  await page.click('[data-testid="create-button"]');
  
  // Verify project created
  await expect(page.locator('[data-testid="project-title"]')).toHaveText('Test Project');
});
```

### Test Coverage

**Coverage Goals:**
- Unit tests: > 80% line coverage
- Integration tests: > 60% line coverage
- Critical paths: 100% coverage

**Coverage Report:**
```bash
npm run test:coverage
```

## Contributing

### Contribution Process

1. **Fork Repository**
   ```bash
   git clone https://github.com/your-username/worldenv.git
   cd worldenv/editor
   ```

2. **Create Issue**
   - Bug reports with reproduction steps
   - Feature requests with use cases
   - Documentation improvements

3. **Development**
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation
   - Ensure builds pass

4. **Pull Request**
   - Clear title and description
   - Link to related issues
   - Include testing instructions
   - Request appropriate reviewers

### Code Review Guidelines

**Review Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes without migration path
- [ ] Performance impact considered
- [ ] Security implications reviewed

**Review Process:**
1. Automated checks (CI/CD)
2. Peer code review
3. Manual testing
4. Approval and merge

### Issue Guidelines

**Bug Reports:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 10
- Node.js: 18.16.0
- WORLDEDIT: 0.1.0

## Additional Context
Screenshots, logs, or other relevant information
```

**Feature Requests:**
```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why this feature is needed

## Proposed Solution
How the feature might be implemented

## Alternatives Considered
Other approaches that were considered

## Additional Context
Mockups, references, or examples
```

## Deployment

### Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Build Release**
   ```bash
   npm run build
   npm run package
   ```

3. **Testing**
   - Automated test suite
   - Manual smoke tests
   - Performance testing
   - Security scanning

4. **Distribution**
   ```bash
   # Create GitHub release
   gh release create v0.1.0 --generate-notes
   
   # Upload artifacts
   gh release upload v0.1.0 build/packages/*
   ```

### Continuous Integration

**GitHub Actions Workflow:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
  
  package:
    needs: test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm run package
      
      - uses: actions/upload-artifact@v3
        with:
          name: packages-${{ matrix.os }}
          path: build/packages/
```

### Distribution Channels

**GitHub Releases:**
- Automated builds for all platforms
- Release notes generation
- Asset management

**Package Managers:**
```bash
# npm (for development)
npm install -g @worldenv/worldedit

# Homebrew (macOS)
brew install worldedit

# Chocolatey (Windows)
choco install worldedit

# Snap (Linux)
snap install worldedit
```

## Troubleshooting

### Common Build Issues

**Node.js Version Conflicts:**
```bash
# Use Node Version Manager
nvm install 18
nvm use 18
npm ci
```

**Native Module Compilation:**
```bash
# Rebuild native modules
npm rebuild

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**TypeScript Compilation Errors:**
```bash
# Clear TypeScript cache
rm -rf dist/
npm run build

# Check for type conflicts
npx tsc --noEmit
```

### Development Environment Issues

**Port Conflicts:**
```bash
# Check port usage
lsof -ti:9000
netstat -ano | findstr :9000

# Kill process using port
kill -9 <PID>
taskkill /PID <PID> /F
```

**File System Permissions:**
```bash
# Fix permissions (Unix)
chmod -R 755 .
chown -R $USER:$USER .

# Run as administrator (Windows)
# Right-click command prompt → "Run as administrator"
```

### Performance Issues

**Memory Leaks:**
```bash
# Profile memory usage
npm run dev -- --inspect
# Open chrome://inspect in Chrome
# Take heap snapshots to identify leaks
```

**Build Performance:**
```bash
# Enable webpack build analysis
npm run build -- --analyze

# Optimize TypeScript compilation
npm install -D fork-ts-checker-webpack-plugin
```

### Debugging Electron Issues

**Main Process Debugging:**
```bash
# Start with inspector
electron --inspect=9229 .

# Remote debugging
electron --remote-debugging-port=9222 .
```

**Renderer Process Debugging:**
- Enable DevTools in production builds
- Use React DevTools extension
- Console logging and breakpoints
- Performance profiling

---

**Additional Resources:**
- [Electron Documentation](https://www.electronjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [Webpack Configuration](https://webpack.js.org/configuration/)
- [Jest Testing Framework](https://jestjs.io/docs/)