# WORLDEDIT USER GUIDE

**Comprehensive guide for using WORLDEDIT game development editor**

## Table of Contents

- [Introduction](#introduction)
- [Installation & Setup](#installation--setup)
- [Getting Started](#getting-started)
- [User Interface](#user-interface)
- [Core Features](#core-features)
- [Inspector Panel](#inspector-panel)
- [Scene Management](#scene-management)
- [Asset Management](#asset-management)
- [Scripting with WORLDC](#scripting-with-worldc)
- [Build System](#build-system)
- [Project Templates](#project-templates)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips & Best Practices](#tips--best-practices)

## Introduction

WORLDEDIT is a professional game development editor for the WORLDENV engine. It provides a complete integrated development environment for creating 2D and 3D games with visual tools, scene management, component systems, and WORLDC language integration.

### Key Features

- **Visual Scene Editor**: Real-time 2D/3D viewport with object manipulation
- **Component System**: Modular entity-component architecture
- **Asset Management**: Comprehensive file browser with drag-and-drop support
- **WORLDC Integration**: Advanced scripting with hybrid C/C++/TypeScript syntax
- **Multi-Platform Deployment**: Export to web, desktop, and PWA formats
- **Professional UI**: VS Code-inspired interface with dockable panels

## Installation & Setup

### System Requirements

**Minimum Requirements:**
- Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- 4 GB RAM
- 2 GB disk space
- OpenGL 3.3 support

**Recommended:**
- 8 GB RAM
- Dedicated graphics card
- SSD storage

### Installation Steps

1. **Download WORLDEDIT**
   ```bash
   # From releases page
   wget https://github.com/elastic-softworks/worldenv/releases/latest/worldedit.zip
   
   # Or build from source
   git clone https://github.com/elastic-softworks/worldenv.git
   cd worldenv/editor
   npm install
   npm run build
   ```

2. **Install Dependencies**
   ```bash
   # Node.js 18+ required
   node --version
   npm --version
   
   # Install WORLDC language support
   npm install -g @worldenv/worldc
   ```

3. **Launch WORLDEDIT**
   ```bash
   # Packaged version
   ./worldedit
   
   # Development version
   npm run start
   ```

### First Launch Configuration

1. **Project Directory**: Choose default location for projects
2. **WORLDC Compiler**: Verify language compiler path
3. **Editor Preferences**: Configure theme, layout, and shortcuts
4. **Asset Directories**: Set up asset search paths

## Getting Started

### Creating Your First Project

1. **New Project Dialog**
   - Click "New Project" on welcome screen
   - Choose project template (2D Platformer, 3D First-Person, Empty)
   - Set project name and location
   - Configure initial settings

2. **Project Structure**
   ```
   MyGame/
   ├── assets/          # Sprites, models, sounds
   ├── scenes/          # Scene files (.worldscene)
   ├── scripts/         # WORLDC scripts (.wc)
   ├── project.json     # Project configuration
   └── build/           # Built game output
   ```

3. **Initial Scene Setup**
   - Main scene created automatically
   - Basic camera and lighting added
   - Ready for entity placement

### Basic Workflow

1. **Scene Creation**: Build levels using visual editor
2. **Entity Management**: Add and configure game objects
3. **Component Assignment**: Attach behaviors and properties
4. **Script Writing**: Implement game logic with WORLDC
5. **Asset Integration**: Import and organize game assets
6. **Testing**: Play mode for immediate feedback
7. **Building**: Export to target platforms

## User Interface

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Menu Bar                                                    │
├──────────┬────────────────────────────────┬─────────────────┤
│ Hierarchy│                                │ Inspector       │
│ Panel    │        Viewport                │ Panel           │
│          │                                │                 │
│          │                                │                 │
├──────────┼────────────────────────────────┼─────────────────┤
│ Asset    │        Script Editor           │ Properties      │
│ Browser  │                                │ Panel           │
└──────────┴────────────────────────────────┴─────────────────┘
│ Status Bar                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Panel System

**Dockable Panels:**
- Drag panels to rearrange layout
- Create custom workspace configurations
- Save and restore layout presets
- Maximize panels for focused work

**Panel Types:**
- **Hierarchy**: Scene object tree
- **Inspector**: Property editing
- **Viewport**: 3D/2D scene view
- **Asset Browser**: File management
- **Script Editor**: Code editing
- **Console**: Debug output
- **Build**: Compilation status

## Core Features

### Viewport System

**3D Viewport:**
- Perspective and orthographic cameras
- Real-time lighting and shadows
- Material preview and editing
- Transform manipulators (move, rotate, scale)
- Grid and snap settings

**2D Viewport:**
- Pixel-perfect rendering
- Sprite layering and sorting
- Tile-based editing tools
- Animation preview
- UI layout guides

**Camera Controls:**
- **Orbit**: Alt + Left Mouse
- **Pan**: Alt + Middle Mouse
- **Zoom**: Mouse Wheel
- **Fly Mode**: Right Mouse + WASD
- **Focus**: F key (focus selected object)

### Entity-Component System

**Entity Management:**
- Create, duplicate, and delete entities
- Parent-child hierarchies
- Entity naming and tagging
- Batch operations on multiple entities

**Component Types:**
- **Transform**: Position, rotation, scale
- **Renderer**: Visual representation
- **Collider**: Physics collision
- **Script**: Custom behavior
- **Audio**: Sound effects and music
- **Animation**: Keyframe animation

**Component Workflow:**
1. Select entity in hierarchy
2. Add components via Inspector
3. Configure component properties
4. Test in play mode
5. Adjust parameters as needed

## Inspector Panel

### Property Editing

**Data Types:**
- **Numbers**: Drag to adjust, type for precision
- **Vectors**: X/Y/Z controls with constraint options
- **Colors**: Color picker with alpha support
- **Assets**: Drag-and-drop from Asset Browser
- **Enums**: Dropdown selection
- **Booleans**: Checkbox toggles

**Advanced Features:**
- **Undo/Redo**: Full property change history
- **Copy/Paste**: Component property transfer
- **Reset**: Restore default values
- **Presets**: Save/load component configurations
- **Validation**: Real-time error checking

### Component Inspector

**Transform Component:**
```
Position: [X: 0.0] [Y: 0.0] [Z: 0.0]
Rotation: [X: 0.0] [Y: 0.0] [Z: 0.0]
Scale:    [X: 1.0] [Y: 1.0] [Z: 1.0]
```

**Renderer Component:**
```
Mesh:     [sphere.obj]
Material: [default_material]
Visible:  [X] Enabled
```

**Script Component:**
```
Script File: [player_controller.wc]
Language:    [WORLDC]
Auto Load:   [X] Enabled
```

### Property Validation

**Real-time Feedback:**
- Red borders for invalid values
- Warning icons for potential issues
- Tooltip explanations for errors
- Automatic value clamping where appropriate

**Common Validations:**
- File path existence
- Numeric range constraints
- Required field completion
- Asset type compatibility

## Scene Management

### Scene Operations

**Creating Scenes:**
1. File → New Scene
2. Choose scene template
3. Configure initial settings
4. Save with descriptive name

**Scene Loading:**
- Recent scenes in File menu
- Project browser navigation
- Auto-save and backup system
- Scene dependency tracking

### Hierarchy Management

**Tree Operations:**
- Drag-and-drop reparenting
- Multi-select with Ctrl/Shift
- Right-click context menus
- Keyboard navigation

**Entity Organization:**
- Group related entities
- Use descriptive naming
- Tag entities by function
- Create prefabs for reuse

### Play Mode

**Testing Features:**
- Instant play mode toggle
- Runtime property editing
- Debug visualization
- Performance monitoring

**Play Mode Controls:**
- **Play**: Start scene simulation
- **Pause**: Freeze game state
- **Step**: Advance one frame
- **Stop**: Return to edit mode

## Asset Management

### Asset Browser

**File Operations:**
- Import assets via drag-and-drop
- Create folders for organization
- Rename and delete files
- Asset preview thumbnails

**Supported Formats:**
- **Images**: PNG, JPG, GIF, WebP
- **3D Models**: OBJ, FBX, GLTF, GLB
- **Audio**: MP3, WAV, OGG
- **Scripts**: .wc, .ts, .js
- **Scenes**: .worldscene
- **Projects**: .worldenv

### Import Pipeline

**Automatic Processing:**
- Texture compression and optimization
- Model import with materials
- Audio format conversion
- Script compilation validation

**Import Settings:**
- Texture filtering and wrapping
- Model scale and orientation
- Audio compression quality
- Asset naming conventions

### Asset References

**Reference Management:**
- Automatic dependency tracking
- Missing asset warnings
- Asset usage reports
- Batch reference updates

**Best Practices:**
- Use relative paths for portability
- Organize assets in logical folders
- Maintain consistent naming
- Regular asset cleanup

## Scripting with WORLDC

### Language Overview

WORLDC combines C/C++ syntax with TypeScript types, providing familiar programming paradigms with modern type safety.

**Basic Script Structure:**
```worldc
#include <worldenv.h>

class PlayerController {
    private float speed = 5.0f;
    private Vector3 velocity;
    
    void start() {
        // Initialize component
    }
    
    void update(float deltaTime) {
        handleInput(deltaTime);
        updateMovement(deltaTime);
    }
    
    private void handleInput(float deltaTime) {
        velocity = Vector3.zero;
        
        if (Input.isKeyPressed(KeyCode.W)) {
            velocity.z = speed;
        }
        if (Input.isKeyPressed(KeyCode.S)) {
            velocity.z = -speed;
        }
        
        transform.position += velocity * deltaTime;
    }
}
```

### Script Editor Features

**Code Intelligence:**
- Syntax highlighting for WORLDC
- IntelliSense autocompletion
- Real-time error checking
- Go-to-definition navigation
- Symbol search and references

**Debugging Support:**
- Breakpoint management
- Variable inspection
- Call stack navigation
- Runtime value modification

### Engine API Access

**Common APIs:**
```worldc
// Entity management
Entity enemy = Engine.createEntity("Enemy");
enemy.addComponent<SpriteRenderer>("enemy.png");

// Input handling
if (Input.isKeyPressed(KeyCode.SPACE)) {
    player.jump();
}

// Scene management
Scene* currentScene = SceneManager.getActiveScene();
currentScene->addEntity(powerup);

// Audio system
AudioManager.playSound("explosion.wav");

// Physics
RigidBody* rb = entity.getComponent<RigidBody>();
rb->addForce(Vector3(0, 10, 0));
```

## Build System

### Build Configuration

**Target Platforms:**
- **Web**: HTML5/WebGL deployment
- **Desktop**: Electron application
- **PWA**: Progressive Web App

**Build Settings:**
```json
{
  "targets": ["web", "desktop"],
  "optimization": "production",
  "compression": true,
  "sourceMaps": false,
  "assetOptimization": true
}
```

### Build Process

1. **Asset Processing**: Optimize textures, models, audio
2. **Script Compilation**: WORLDC → TypeScript → JavaScript
3. **Bundle Generation**: Package all assets and code
4. **Platform Packaging**: Create platform-specific builds
5. **Distribution**: Generate installer and deployment files

### Build Output

**Web Build:**
```
build/web/
├── index.html
├── game.js
├── game.wasm
├── assets/
└── manifest.json
```

**Desktop Build:**
```
build/desktop/
├── MyGame.exe (Windows)
├── MyGame.app (macOS)
├── MyGame.AppImage (Linux)
└── resources/
```

## Project Templates

### 2D Platformer Template

**Features Included:**
- Side-scrolling camera system
- Player character with physics
- Collectible items and scoring
- Enemy AI with patrol patterns
- Level progression system
- UI for health and score

**Key Scripts:**
- `PlayerController.wc`: Character movement and jumping
- `EnemyAI.wc`: Basic AI behaviors
- `Collectible.wc`: Item collection logic
- `GameManager.wc`: Level management

**Getting Started:**
1. Create new project with 2D Platformer template
2. Open `MainLevel.worldscene`
3. Customize player sprite and animations
4. Design levels using tile-based tools
5. Adjust physics parameters in Inspector
6. Test and iterate on gameplay

### First-Person 3D Template

**Features Included:**
- Mouse look camera controls
- WASD movement with physics
- Interaction system for objects
- Basic lighting setup
- 3D audio positioning
- Simple inventory system

**Key Scripts:**
- `FirstPersonController.wc`: Camera and movement
- `InteractionSystem.wc`: Object interaction
- `InventoryManager.wc`: Item management
- `AudioController.wc`: 3D sound positioning

**Getting Started:**
1. Create new project with 3D template
2. Open `Demo3DScene.worldscene`
3. Import 3D models and textures
4. Set up collision meshes
5. Configure lighting and materials
6. Build and test in play mode

### Empty Project Template

**Starting Point:**
- Basic scene with camera and lighting
- Default project structure
- Essential component types
- Build configuration templates

**Use Cases:**
- Custom game genres
- Experimental projects
- Learning WORLDC programming
- Prototype development

## Keyboard Shortcuts

### General Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Project |
| `Ctrl+O` | Open Project |
| `Ctrl+S` | Save Scene |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Del` | Delete Selected |
| `F` | Focus on Selected |
| `Ctrl+D` | Duplicate |

### Viewport Controls

| Shortcut | Action |
|----------|--------|
| `W` | Move Tool |
| `E` | Rotate Tool |
| `R` | Scale Tool |
| `Q` | Pan Tool |
| `G` | Toggle Grid |
| `X` | Toggle Snap |
| `F5` | Play Mode |
| `F6` | Pause |
| `F7` | Step Frame |

### Script Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl+/` | Toggle Comment |
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `F12` | Go to Definition |
| `Shift+F12` | Find References |
| `F5` | Build Script |
| `F9` | Toggle Breakpoint |

### Panel Management

| Shortcut | Action |
|----------|--------|
| `Tab` | Toggle Panel Focus |
| `Ctrl+1` | Hierarchy Panel |
| `Ctrl+2` | Inspector Panel |
| `Ctrl+3` | Asset Browser |
| `Ctrl+4` | Script Editor |
| `Ctrl+5` | Console |

## Tips & Best Practices

### Project Organization

**Folder Structure:**
```
assets/
├── textures/        # Image files
├── models/          # 3D assets
├── audio/           # Sound files
├── fonts/           # Typography
└── materials/       # Material definitions

scripts/
├── player/          # Player-related scripts
├── enemies/         # AI and enemy logic
├── ui/              # Interface scripts
└── systems/         # Core game systems

scenes/
├── levels/          # Game levels
├── menus/           # UI scenes
└── test/            # Development scenes
```

**Naming Conventions:**
- Use descriptive, consistent names
- Avoid spaces and special characters
- Use PascalCase for classes and components
- Use camelCase for variables and functions
- Include version numbers for assets

### Performance Optimization

**Entity Management:**
- Limit active entities (< 1000 for mobile)
- Use object pooling for frequently created objects
- Disable components when not needed
- Group similar entities for batch operations

**Asset Optimization:**
- Compress textures appropriately for platform
- Use LOD (Level of Detail) for 3D models
- Optimize audio file sizes and formats
- Remove unused assets before building

**Script Performance:**
- Minimize Update() calls
- Cache component references
- Use events instead of polling
- Profile scripts for bottlenecks

### Debugging Workflow

**Common Issues:**
1. **Missing References**: Check Asset Browser for broken links
2. **Script Errors**: Review Console panel for compilation errors
3. **Performance Problems**: Use Profiler to identify bottlenecks
4. **Build Failures**: Verify all assets and scripts are valid

**Debug Tools:**
- Console logging with different severity levels
- Visual debugging with gizmos and wireframes
- Performance counters and frame rate monitoring
- Memory usage tracking

### Version Control

**Git Integration:**
- Initialize repository in project root
- Use .gitignore for build artifacts
- Commit frequently with descriptive messages
- Tag releases for milestone tracking

**Recommended .gitignore:**
```
build/
dist/
node_modules/
*.log
*.cache
.DS_Store
Thumbs.db
```

### Collaboration

**Multi-Developer Workflow:**
- Establish coding standards and conventions
- Use branching strategy for features
- Document custom components and systems
- Share asset libraries and prefabs
- Regular code reviews and testing

**Asset Management:**
- Central asset repository
- Consistent export settings
- Version control for large binary files
- Asset naming and organization standards

---

**Next Steps:**
- Read the [QUICKSTART.md](QUICKSTART.md) for hands-on tutorials
- Check [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) for advanced topics
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Visit [API-REFERENCE.md](API-REFERENCE.md) for complete API documentation