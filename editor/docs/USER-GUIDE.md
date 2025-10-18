# WORLDEDIT USER GUIDE

**Advanced Asset Management & Viewport Integration**

**Comprehensive guide for using WORLDEDIT game development editor**

> **⚠️ USER STATUS NOTICE**
> 
> WORLDEDIT is currently in active development with build issues preventing application launch. This user guide describes the intended functionality once development is complete.
> 
> **Current Status:**
> - Application cannot be built or launched due to TypeScript compilation errors
> - Core systems are implemented but not accessible to end users
> - Features described in this guide are designed but not currently testable
> 
> **For Developers:** See [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for technical details and resolution steps.
> 
> **For Users:** This software is not yet ready for end-user installation. Please check back after build issues are resolved.

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

- **Visual Scene Editor** - Real-time 3D/2D viewport with advanced object manipulation
- **Advanced Selection System** - Multi-selection, highlighting, and visual feedback
- **Transform Gizmos** - Professional translate, rotate, and scale tools
- **Camera Controls** - Smooth orbit, pan, zoom with focus operations
- **Component System** - Modular entity-component architecture with visual rendering
- **Professional Asset Management** - Import, organize, preview with drag-and-drop to viewport
- **Asset Import Pipeline** - Support for images, 3D models, audio, fonts with thumbnails
- **Asset Properties & Metadata** - Tag management, descriptions, technical information
- **WORLDC Integration** - Advanced scripting with hybrid C/C++/TypeScript syntax
- **Multi-Platform Deployment** - Export to web, desktop, and PWA formats
- **Professional UI** - VS Code-inspired interface with dockable panels

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

**3D Viewport Features:**
- Advanced object selection with multi-selection (Ctrl/Shift)
- Real-time visual highlighting and selection feedback
- Professional transform gizmos (translate, rotate, scale)
- Smooth camera controls with orbit, pan, zoom
- Focus-on-object functionality with automatic framing
- Grid, axes, and helper visualization
- Component-based entity rendering
- Performance optimization with caching

**2D Viewport Features:**
- Sprite-based rendering with PIXI.js
- 2D camera controls and viewport navigation
- Layer management and depth sorting
- 2D transform gizmos and manipulation
- Smooth viewport mode switching (2D ↔ 3D)

**Selection System:**
- **Click Selection**: Left mouse click on objects
- **Multi-Selection**: Ctrl + Click to add/remove from selection
- **Range Selection**: Shift + Click for range selection
- **Clear Selection**: Click empty space or Esc key
- **Visual Feedback**: Automatic highlighting and outline

**Camera Controls:**
- **Orbit**: Left Mouse + Drag (3D mode)
- **Pan**: Middle Mouse + Drag or Shift + Left Mouse + Drag
- **Zoom**: Mouse Wheel or Right Mouse + Drag
- **Focus**: F key (focus on selected objects)
- **Reset**: Home key (reset camera to default position)
- **Touch Support**: Pinch to zoom, two-finger pan on touch devices

**Transform Gizmos:**
- **Select Mode**: Q key (selection tool)
- **Translate**: W key (move objects)
- **Rotate**: E key (rotate objects)
- **Scale**: R key (scale objects)
- **World/Local Space**: Toggle between coordinate systems
- **Snap Settings**: Grid snap and increment controls

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
1. File → New Scene (or Ctrl+N)
2. Enter scene name in dialog
3. Choose scene template:
   - **Empty**: Blank scene with basic lighting
   - **2D**: Configured for 2D games with orthographic camera
   - **3D**: Configured for 3D games with perspective camera
4. Scene is automatically created and opened
5. Scene files saved as `.scene.json` in `scenes/` directory

**Scene Loading:**
- File → Open Scene to browse existing scenes
- Recent scenes available in File menu
- Double-click scene files in Asset Browser
- Scenes auto-save every 5 minutes
- Scene validation on load with error reporting

**Scene File Format:**
```json
{
  "format": "worldenv-scene",
  "version": "1.0.0",
  "metadata": {
    "name": "MainLevel",
    "created": "2024-01-15T10:30:00Z",
    "modified": "2024-01-15T14:22:15Z"
  },
  "settings": {
    "gravity": { "x": 0, "y": -9.81, "z": 0 },
    "ambientLight": { "r": 0.2, "g": 0.2, "b": 0.2, "a": 1.0 }
  },
  "entities": []
}
```

### Hierarchy Management

**Entity Creation:**
1. Right-click in Hierarchy panel
2. Select "Add Entity" from context menu
3. Entity created with default Transform component
4. Rename entity by double-clicking name

**Tree Operations:**
- **Drag-and-drop**: Reparent entities by dragging
- **Multi-select**: Ctrl+Click or Shift+Click for multiple entities
- **Right-click menu**: Access entity operations
- **Keyboard navigation**: Arrow keys to navigate hierarchy
- **Expand/Collapse**: Click triangle icons or use +/- keys

**Entity Operations:**
- **Visibility Toggle**: Eye icon to show/hide entities
- **Lock Toggle**: Lock icon to prevent selection/editing
- **Delete**: Delete key or context menu (with confirmation)
- **Duplicate**: Ctrl+D to duplicate selected entities
- **Rename**: Double-click name or F2 key

**Entity Organization:**
- Use parent-child relationships for logical grouping
- Descriptive naming conventions (Player, Environment, UI, etc.)
- Lock parent containers to prevent accidental modification
- Use visibility to manage complex scenes during editing

### Play Mode

**Note**: Play Mode is implemented and available through the toolbar controls.

**Current Scene Testing:**
- Scene validation ensures structural integrity
- Component properties can be edited in Inspector
- Scene hierarchy updates in real-time
- Save scene before testing with external tools

**Planned Play Mode Features:**
- **Play**: Start scene simulation with physics/scripts
- **Pause**: Freeze game state for debugging
- **Step**: Advance one frame at a time
- **Stop**: Return to edit mode with state reset
- Runtime property editing with change tracking
- Debug visualization overlays
- Performance monitoring and profiling

## Asset Management

**Professional Asset System with Import, Preview, and Viewport Integration**

### Asset Browser

The enhanced asset browser provides professional file management with drag-and-drop integration.

**Core Features:**
- **Import Pipeline**: Drag files directly into the browser or use Ctrl+I
- **Thumbnail Preview**: Automatic generation for images, models, and audio
- **Metadata Management**: Tags, descriptions, and technical information
- **Drag-to-Viewport**: Drop assets directly into 3D/2D viewport to create entities
- **Search & Filter**: Real-time search with type and tag filtering
- **Keyboard Navigation**: Full keyboard shortcuts (Delete, F2, F5, Enter, Ctrl+A)

**Supported Formats:**
- **Images**: PNG, JPG, JPEG, GIF, WebP, BMP, TIFF with thumbnail generation
- **3D Models**: GLTF, GLB, OBJ, FBX, DAE, 3DS with preview support
- **Audio**: MP3, WAV, OGG, FLAC, AAC, M4A with waveform preview
- **Fonts**: TTF, OTF, WOFF, WOFF2 with text preview
- **Scripts**: .wc (WorldC), .ts, .js with syntax detection
- **Data**: JSON, XML, YAML for configuration files

### Import Workflow

**Step 1: Import Assets**
1. **Drag-and-Drop**: Drag files from your file system into the asset browser
2. **File Import**: Use Ctrl+I or right-click → "Import Files..."
3. **Progress Tracking**: Real-time import progress with file names
4. **Automatic Organization**: Files organized in current folder location

**Step 2: Asset Organization**
1. **Create Folders**: Right-click → "New Folder" or organize by type
2. **Rename Assets**: Press F2 or right-click → "Rename"
3. **Add Metadata**: Right-click → "Show Properties" to add tags and descriptions
4. **Search Assets**: Use the search bar to find assets by name, type, or tags

**Step 3: Use in Scene**
1. **Drag to Viewport**: Drag assets from browser to 3D/2D viewport
2. **Automatic Entity Creation**: 
   - Images become Sprite entities with SpriteComponent
   - 3D models become Model entities with MeshRendererComponent
   - Audio files become Audio entities with AudioSourceComponent
3. **Component Integration**: Assets automatically populate component properties

### Asset Properties Dialog

Access detailed asset information and metadata editing:

**Basic Information:**
- File size, creation date, modification date
- File path and extension
- Asset type and format

**Technical Metadata:**
- **Images**: Dimensions, format, channels, compression status
- **Audio**: Duration, sample rate, channels, bit rate
- **3D Models**: Vertex count, face count, animations, materials

**Editable Metadata:**
- **Tags**: Comma-separated labels for organization
- **Description**: Detailed asset description
- **Custom Properties**: Project-specific metadata

### Keyboard Shortcuts

**Navigation:**
- **Enter**: Open folder or show properties
- **Escape**: Clear selection
- **F5**: Refresh asset list

**File Operations:**
- **Delete**: Delete selected assets
- **F2**: Rename selected asset
- **Ctrl+I**: Import new assets
- **Ctrl+A**: Select all assets

**Organization:**
- **Right-click**: Context menu for all operations
- **Drag-and-drop**: Move files between folders
- **Search**: Real-time filtering as you type

### Asset Integration

**Viewport Integration:**
- Drop images to create sprite entities
- Drop 3D models to create mesh entities
- Drop audio files to create audio source entities
- Automatic component property population

**Component Mapping:**
- **SpriteComponent**: Texture property from image assets
- **MeshRendererComponent**: Mesh and material from model assets
- **AudioSourceComponent**: Audio clip from audio assets
- **Material Properties**: Texture maps from image assets

**Performance Features:**
- **Lazy Loading**: Thumbnails load as needed
- **Caching**: Asset metadata and thumbnails cached
- **Background Processing**: Import operations don't block UI

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