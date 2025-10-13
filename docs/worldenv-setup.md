# WORLDENV Environment Setup

## Introduction

This guide will walk you through setting up a complete development environment for WORLDENV. By the end, you'll have everything needed to build games and development tools.

## Prerequisites

Before starting, ensure you have:
- A computer running Windows, macOS, or Linux
- Administrator/sudo access for installing software
- At least 5GB of free disk space
- Internet connection for downloading dependencies

## Step 1: Install Node.js and npm

[Node.js](https://nodejs.org/) is a JavaScript runtime that includes npm (Node Package Manager).

### Why Node.js?
- **Build Tools**: Runs TypeScript compiler and bundlers
- **Package Management**: npm installs dependencies
- **Development Server**: Serves your game during development

### Installation

**Windows:**
1. Download the LTS installer from [nodejs.org](https://nodejs.org/)
2. Run the installer (accept defaults)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

**Expected Output:**
```
v20.x.x  (or newer)
10.x.x   (or newer)
```

### Learn More:
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [npm Documentation](https://docs.npmjs.com/)

## Step 2: Install Git

[Git](https://git-scm.com/) is version control software for tracking code changes.

### Why Git?
- **Version Control**: Track changes over time
- **Collaboration**: Work with team members
- **Backup**: Cloud storage on GitHub/GitLab
- **Branching**: Experiment safely

### Installation

**Windows:**
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run installer (accept defaults, choose VS Code as editor)
3. Verify:
   ```bash
   git --version
   ```

**macOS:**
```bash
# Using Homebrew
brew install git

# Or use Xcode Command Line Tools
xcode-select --install
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install git

# Fedora
sudo dnf install git
```

### Configuration
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Learn More:
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [Git Tutorial](https://www.atlassian.com/git/tutorials)

## Step 3: Install a Code Editor

### Visual Studio Code (Recommended)

[VS Code](https://code.visualstudio.com/) is a free, powerful code editor.

**Why VS Code?**
- **TypeScript Support**: Built-in IntelliSense
- **Extensions**: Thousands of plugins
- **Integrated Terminal**: Run commands without switching windows
- **Debugging**: Built-in debugger for JavaScript/TypeScript

**Installation:**
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install for your operating system
3. Launch VS Code

**Recommended Extensions:**
```
1. Open VS Code
2. Press Ctrl+Shift+X (Cmd+Shift+X on Mac)
3. Search and install:
   - "ESLint" - Code linting
   - "Prettier" - Code formatting
   - "WebAssembly" - WASM syntax support
   - "C/C++" - For C89 editor development
   - "Live Server" - Quick preview server
```

### Alternative Editors:
- **WebStorm** - Premium TypeScript IDE
- **Sublime Text** - Lightweight and fast
- **Vim/Neovim** - For terminal enthusiasts

### Learn More:
- [VS Code Tips and Tricks](https://code.visualstudio.com/docs/getstarted/tips-and-tricks)

## Step 4: Install C Compiler (for Editor Development)

### GCC (GNU Compiler Collection)

[GCC](https://gcc.gnu.org/) is a standard C compiler supporting C89.

**Why GCC?**
- **Free and Open Source**
- **C89 Compliant**: Supports `-std=c89` flag
- **Cross-Platform**: Available on all major OSes
- **Well Documented**: Extensive resources

**Windows:**
```bash
# Install MinGW-w64
# Download from: https://www.mingw-w64.org/downloads/

# Or use MSYS2 (recommended)
# Download from: https://www.msys2.org/
# Then install GCC:
pacman -S mingw-w64-x86_64-gcc

# Add to PATH: C:\msys64\mingw64\bin
```

**macOS:**
```bash
# Install Xcode Command Line Tools (includes Clang with GCC compatibility)
xcode-select --install

# Or install GCC via Homebrew
brew install gcc
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora
sudo dnf install gcc gcc-c++ make
```

**Verify Installation:**
```bash
gcc --version
```

**Test C89 Compilation:**
```bash
# Create test file
echo '#include <stdio.h>
int main(void) {
    printf("C89 works!\n");
    return 0;
}' > test.c

# Compile with C89 standard
gcc -std=c89 -Wall -Wextra -pedantic test.c -o test

# Run
./test  # Linux/macOS
test.exe  # Windows
```

### Learn More:
- [GCC Documentation](https://gcc.gnu.org/onlinedocs/)
- [C89 Standard](https://port70.net/~nsz/c/c89/c89-draft.html)

## Step 5: Create WORLDENV Project

### Initialize Project Structure

```bash
# Create project directory
mkdir my-worldenv-game
cd my-worldenv-game

# Initialize npm project
npm init -y

# Create directory structure
mkdir -p src/core
mkdir -p src/components
mkdir -p src/scenes
mkdir -p asm
mkdir -p public
mkdir -p editor/src
```

### Install TypeScript Dependencies

```bash
# Core dependencies
npm install pixi.js three

# Type definitions
npm install --save-dev @types/three @types/node

# Development tools
npm install --save-dev typescript vite

# AssemblyScript
npm install --save-dev assemblyscript @assemblyscript/loader
```

**What each package does:**

- **pixi.js** - 2D rendering engine
  - [Pixi.js Docs](https://pixijs.download/release/docs/index.html)
  
- **three** - 3D rendering engine
  - [Three.js Docs](https://threejs.org/docs/)
  
- **@types/three** - TypeScript type definitions for Three.js
  - Enables autocomplete and type checking
  
- **typescript** - TypeScript compiler
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  
- **vite** - Fast build tool and dev server
  - [Vite Guide](https://vitejs.dev/guide/)
  
- **assemblyscript** - WebAssembly compiler
  - [AssemblyScript Docs](https://www.assemblyscript.org/)

### Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Configuration Explanation:**

- **target: "ESNext"** - Compile to latest JavaScript features
- **module: "ESNext"** - Use ES6 module syntax (import/export)
- **lib: ["ESNext", "DOM"]** - Include browser APIs
- **strict: true** - Enable all strict type checking
- **rootDir/outDir** - Source and output directories

### Configure AssemblyScript

Create `asconfig.json`:

```json
{
  "targets": {
    "debug": {
      "outFile": "build/debug.wasm",
      "textFile": "build/debug.wat",
      "sourceMap": true,
      "debug": true
    },
    "release": {
      "outFile": "build/release.wasm",
      "textFile": "build/release.wat",
      "sourceMap": true,
      "optimizeLevel": 3,
      "shrinkLevel": 0,
      "converge": false,
      "noAssert": false
    }
  },
  "options": {
    "bindings": "esm"
  }
}
```

**Configuration Explanation:**

- **debug target** - Development build with debugging info
- **release target** - Optimized production build
- **optimizeLevel: 3** - Maximum optimization
- **sourceMap: true** - Enable debugging in browser

### Configure Vite

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  publicDir: 'public'
});
```

**Configuration Explanation:**

- **server.port** - Development server port
- **server.open** - Auto-open browser
- **build.sourcemap** - Enable source maps for debugging

### Create Package Scripts

Update `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "asbuild": "asc asm/index.ts --target release --outFile public/game.wasm",
    "asbuild:debug": "asc asm/index.ts --target debug --outFile public/game.wasm"
  }
}
```

**Script Explanation:**

- **dev** - Start development server with hot reload
- **build** - Compile TypeScript and bundle for production
- **asbuild** - Compile AssemblyScript to WebAssembly
- **preview** - Preview production build locally

### Create HTML Entry Point

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WORLDENV Game</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #000;
        }
        canvas {
            display: block;
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**HTML Explanation:**

- **meta viewport** - Responsive sizing
- **canvas#gameCanvas** - Render target
- **type="module"** - Enable ES6 modules
- **src="/src/main.ts"** - Vite handles TypeScript

### Create Core Game Files

Create `src/core/Game.ts`:

```typescript
import * as PIXI from 'pixi.js';
import * as THREE from 'three';

export interface GameConfig {
    width: number;
    height: number;
    canvasId: string;
    use3D?: boolean;
    use2D?: boolean;
}

export class Game {
    private config: GameConfig;
    private pixiApp?: PIXI.Application;
    private threeScene?: THREE.Scene;
    private threeRenderer?: THREE.WebGLRenderer;
    private threeCamera?: THREE.PerspectiveCamera;
    private canvas: HTMLCanvasElement;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    constructor(config: GameConfig) {
        this.config = {
            use2D: true,
            use3D: false,
            ...config
        };
        
        this.canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id "${config.canvasId}" not found`);
        }
    }

    async init(): Promise<void> {
        if (this.config.use2D) {
            await this.initPixi();
        }
        
        if (this.config.use3D) {
            this.initThree();
        }
        
        window.addEventListener('resize', () => this.resize());
    }

    private async initPixi(): Promise<void> {
        this.pixiApp = new PIXI.Application();
        
        await this.pixiApp.init({
            canvas: this.canvas,
            width: this.config.width,
            height: this.config.height,
            backgroundColor: 0x1099bb,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
    }

    private initThree(): void {
        this.threeScene = new THREE.Scene();
        
        this.threeRenderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.threeRenderer.setSize(this.config.width, this.config.height);
        this.threeRenderer.setPixelRatio(window.devicePixelRatio);
        
        this.threeCamera = new THREE.PerspectiveCamera(
            75,
            this.config.width / this.config.height,
            0.1,
            1000
        );
        this.threeCamera.position.z = 5;
    }

    private resize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        if (this.pixiApp) {
            this.pixiApp.renderer.resize(width, height);
        }
        
        if (this.threeRenderer && this.threeCamera) {
            this.threeRenderer.setSize(width, height);
            this.threeCamera.aspect = width / height;
            this.threeCamera.updateProjectionMatrix();
        }
    }

    protected update(deltaTime: number): void {
        // Override in subclasses
    }

    protected render(): void {
        if (this.config.use3D && this.threeRenderer && this.threeScene && this.threeCamera) {
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        }
    }

    run(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop(): void {
        this.isRunning = false;
    }

    private gameLoop = (): void => {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    getPixiApp(): PIXI.Application | undefined {
        return this.pixiApp;
    }

    getThreeScene(): THREE.Scene | undefined {
        return this.threeScene;
    }

    getThreeCamera(): THREE.PerspectiveCamera | undefined {
        return this.threeCamera;
    }
}
```

Create `src/main.ts`:

```typescript
import { Game } from './core/Game';

async function main() {
    const game = new Game({
        width: window.innerWidth,
        height: window.innerHeight,
        canvasId: 'gameCanvas',
        use2D: true,
        use3D: false
    });

    await game.init();
    game.run();

    console.log('WORLDENV initialized successfully!');
}

main().catch(console.error);
```

### Create AssemblyScript Module

Create `asm/index.ts`:

```typescript
// Example: Fast math operations in WebAssembly

export function add(a: i32, b: i32): i32 {
    return a + b;
}

export function multiply(a: f32, b: f32): f32 {
    return a * b;
}

export function dotProduct(
    x1: f32, y1: f32, z1: f32,
    x2: f32, y2: f32, z2: f32
): f32 {
    return x1 * x2 + y1 * y2 + z1 * z2;
}
```

## Step 6: Set Up C89 Editor Environment

### Create Editor Structure

```bash
# Create editor directories
mkdir -p editor/src
mkdir -p editor/include
mkdir -p editor/build
```

### Create Makefile

Create `editor/Makefile`:

```makefile
CC = gcc
CFLAGS = -std=c89 -Wall -Wextra -pedantic -O2
INCLUDES = -Iinclude
TARGET = worldenv-editor

SRCS = $(wildcard src/*.c)
OBJS = $(SRCS:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o build/$(TARGET) $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

clean:
	rm -f src/*.o build/$(TARGET)

.PHONY: all clean
```

### Create Sample Editor File

Create `editor/src/main.c`:

```c
/*
   ===================================
   WORLDENV EDITOR
   MAIN ENTRY POINT
   ===================================
*/

#include <stdio.h>
#include <stdlib.h>

/*
   ===================================
   MAIN
   ===================================
*/

int main(int argc, char* argv[]) {

    printf("WORLDENV Editor v1.0\n");
    printf("C89 ANSI-C Implementation\n\n");
    
    if (argc > 1) {
    
        printf("Project: %s\n", argv[1]);
        
    } else {
    
        printf("Usage: %s <project_path>\n", argv[0]);
        return 1;
        
    }
    
    return 0;
    
}
```

### Build Editor

```bash
cd editor
make
./build/worldenv-editor ../my-game-project
```

## Step 7: Verify Installation

### Test TypeScript Setup

```bash
# Start development server
npm run dev
```

Expected: Browser opens to `http://localhost:3000` with blank canvas

### Test AssemblyScript

```bash
# Build WASM module
npm run asbuild
```

Expected: `public/game.wasm` file created

### Test C Editor

```bash
cd editor
make
./build/worldenv-editor test
```

Expected: "WORLDENV Editor v1.0" message

## Step 8: Install Optional Tools

### Browser Developer Tools

**Chrome DevTools:**
- Press F12 or Ctrl+Shift+I
- Use Console, Network, Performance tabs
- [DevTools Guide](https://developer.chrome.com/docs/devtools/)

**Firefox Developer Edition:**
- Better WebGL debugging
- [Download](https://www.mozilla.org/en-US/firefox/developer/)

### WebAssembly Tools

**wasm-pack** (for advanced WASM):
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

**wabt** (WebAssembly Binary Toolkit):
```bash
# macOS
brew install wabt

# Linux
sudo apt-get install wabt
```

### Performance Profiling

**Chrome Performance Monitor:**
1. Open DevTools (F12)
2. Press Ctrl+Shift+P
3. Type "Show Performance Monitor"

**Stats.js** (FPS counter):
```bash
npm install stats.js
npm install --save-dev @types/stats.js
```

## Troubleshooting

### Node.js/npm Issues

**Problem:** `npm command not found`
**Solution:** 
- Restart terminal after installation
- Check PATH includes Node.js bin directory
- Reinstall Node.js

**Problem:** `EACCES` permission errors
**Solution:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### TypeScript Issues

**Problem:** `Cannot find module 'pixi.js'`
**Solution:**
```bash
npm install pixi.js
```

**Problem:** Type errors in IDE
**Solution:**
- Restart VS Code
- Run `npm install`
- Check `tsconfig.json` is valid JSON

### Vite Issues

**Problem:** `Port 3000 already in use`
**Solution:**
```bash
# Change port in vite.config.ts
# Or kill process on port 3000
# Linux/Mac: lsof -ti:3000 | xargs kill
# Windows: netstat -ano | findstr :3000
```

### C Compiler Issues

**Problem:** `gcc: command not found`
**Solution:**
- Verify GCC installation
- Add to PATH
- Use full path to gcc

**Problem:** C89 warnings/errors
**Solution:**
- Use only C89-compliant features
- No `//` comments (use `/* */`)
- Declare variables at function start
- No VLAs (Variable Length Arrays)

### WebAssembly Issues

**Problem:** WASM fails to load
**Solution:**
- Check file path is correct
- Serve from web server (not file://)
- Check browser console for errors

## Next Steps

Your WORLDENV environment is ready! 

Choose your path:

### For Game Development:
1. **[[typescript-basics|TypeScript Basics]]** - Learn the language
2. **[[tutorial-tetris|Build Tetris]]** - First complete game
3. **[[worldenv-ecs|Entity Component System]]** - Architecture patterns

### For Tool Development:
1. **[[c89-best-practices|C89 Best Practices]]** - Write safe C code
2. **[[editor-base|Editor Base]]** - Build the foundation
3. **[[editor-window-system|Window System]]** - GUI framework

## Summary

You've installed:
- ✅ Node.js and npm
- ✅ Git version control
- ✅ VS Code editor
- ✅ GCC C compiler
- ✅ TypeScript and build tools
- ✅ Pixi.js and Three.js
- ✅ AssemblyScript compiler

You've created:
- ✅ WORLDENV project structure
- ✅ Configuration files
- ✅ Core game engine files
- ✅ C89 editor skeleton

**You're ready to build games with WORLDENV!**