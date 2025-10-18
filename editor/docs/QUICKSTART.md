# WORLDEDIT QUICKSTART GUIDE
**Get up and running with WORLDEDIT in 15 minutes**

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First Launch](#first-launch)
- [Creating Your First Project](#creating-your-first-project)
- [Basic Editor Tour](#basic-editor-tour)
- [Your First Script](#your-first-script)
- [Building and Testing](#building-and-testing)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+**
- **Git** for version control
- **4 GB RAM** minimum (8 GB recommended)
- **OpenGL 3.3** compatible graphics

**Quick Check:**
```bash
node --version    # Should be 18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
git --version     # Any recent version
```

## Installation

### Option 1: Pre-built Releases (Recommended)

1. **Download WORLDEDIT**
   - Visit [Releases Page](https://github.com/elastic-softworks/worldenv/releases)
   - Download for your platform (Windows/macOS/Linux)
   - Extract and run the installer

2. **Install WORLDC Compiler**
   ```bash
   npm install -g @worldenv/worldc
   worldc --version  # Verify installation
   ```

### Option 2: Build from Source

1. **Clone Repository**
   ```bash
   git clone https://github.com/elastic-softworks/worldenv.git
   cd worldenv/editor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Application**
   ```bash
   npm run build
   npm run start
   ```

## First Launch

1. **Start WORLDEDIT**
   ```bash
   # Pre-built version
   ./worldedit

   # From source
   npm run start
   ```

2. **Engine Status Check**
   - Application loads with splash screen
   - Engine status shows "Ready" (green) or "Initializing" (yellow)
   - If WORLDC compiler not found, warning logged but editor continues
   - All panels load correctly (Hierarchy, Inspector, Viewport, Assets)

3. **Verify Installation**
   - Main window opens with proper panel layout
   - File menu contains "New Scene" option
   - Hierarchy panel shows empty scene hierarchy
   - Console shows engine initialization messages

## Creating Your First Project

### Step 1: Create Your First Scene

**Note**: Project management system is implemented. Create new projects or work with existing scenes.

1. Launch WORLDEDIT
2. Go to **File → New Scene**
3. Enter scene name: `MyFirstLevel`
4. Choose **"3D"** template for this example
5. Scene is created and opened automatically

### Step 2: Scene Structure

Your scene file is created in the current directory:
```
MyFirstLevel.scene.json     # Scene data with entities and components
```

The scene contains:
- Scene metadata (name, creation date, version)
- Default lighting settings
- Gravity and physics settings
- Empty entity hierarchy (ready for your content)

### Step 2: Add Your First Entity

1. Right-click in the **Hierarchy Panel**
2. Select **"Add Entity"** from context menu
3. A new entity appears named "Entity"
4. Double-click the name to rename it to "Player"
5. Notice it automatically has a **Transform component** in the Inspector
6. **NEW**: The entity is now visible in the 3D viewport with selection highlighting

## Basic Editor Tour

### Main Interface

```
┌─────────────────────────────────────────────────────────────┐
│ File  Edit  View  Project  Build  Help                     │
├──────────┬────────────────────────────────┬─────────────────┤
│ Hierarchy│        3D Viewport             │ Inspector       │
│ ► Player │   [3D Scene with Gizmos]      │ Transform       │
│   Platform│  • Selection highlighting     │ Position: 0,0,0 │
│   Camera │   • Transform gizmos          │ Rotation: 0,0,0 │
│          │   • Camera controls           │ Scale: 1,1,1    │
├──────────┼────────────────────────────────┼─────────────────┤
│ Assets   │ [Q][W][E][R] 2D|3D [Grid][Giz]│ Console         │
│ sprites/ │  Transform Tools & View Controls│                 │
│ audio/   │                                │ Viewport Ready  │
└──────────┴────────────────────────────────┴─────────────────┘
```

### Key Panels

**Hierarchy Panel (Left)**
- Shows all entities in the scene
- Drag to reparent objects
- Right-click for context menu

**Viewport (Center) - Enhanced**
- Real-time 3D/2D visual scene editor with advanced controls
- **Object Selection**: Click objects to select, Ctrl+Click for multi-selection
- **Camera Controls**: 
  - **Orbit**: Left mouse + drag (3D mode)
  - **Pan**: Middle mouse + drag or Shift + left mouse + drag
  - **Zoom**: Mouse wheel or right mouse + drag
  - **Focus**: F key to focus on selected objects
- **Transform Gizmos**: W (move), E (rotate), R (scale), Q (select)
- **Visual Feedback**: Automatic highlighting, selection outlines
- **Performance**: Optimized rendering with caching systems

**Inspector Panel (Right)**
- Edit properties of selected entity
- Add/remove components
- Adjust transform values

**Asset Browser (Bottom Left)**
- Browse project files
- Drag assets into scene
- Import new assets

**Script Editor (Bottom Center)**
- Script editing capabilities with Monaco editor
- WORLDC syntax highlighting support
- IntelliSense support planned

## Working with Components

**Note**: Full scripting support is available through the integrated Monaco editor. Focus on scene and entity management for initial development.

### Step 1: Understanding the Viewport Selection

1. **Click** the "Player" entity in the **3D Viewport** to select it
2. Notice the **visual highlighting** that appears around the object
3. The **Inspector Panel** automatically updates to show selected entity
4. You'll see a **Transform Component** with Position, Rotation, and Scale
5. **Transform Gizmos** appear in the viewport for direct manipulation
6. Try the **Focus** feature by pressing **F** to center the camera on your object

### Step 2: Transform Component and Gizmos

The Transform component controls the entity's spatial properties with real-time visual feedback:

```json
Transform Component:
├── Position: { x: 0, y: 0, z: 0 }  ← Move with W key gizmo
├── Rotation: { x: 0, y: 0, z: 0 }  ← Rotate with E key gizmo
└── Scale:    { x: 1, y: 1, z: 1 }  ← Scale with R key gizmo
```

**Viewport Capabilities:**
- **Visual Transform Gizmos**: Direct viewport manipulation with W/E/R
- **Real-time Updates**: Changes instantly reflected in viewport
- **World/Local Space**: Toggle coordinate systems for gizmos
- **Snap Settings**: Grid snapping and increment controls
- **Multi-Selection**: Transform multiple objects simultaneously
- **Undo/Redo**: Framework ready for transform operations

### Step 3: Advanced Selection and Manipulation

Try these enhanced entity management features:

1. **Viewport Selection**: Click objects directly in 3D viewport
2. **Multi-Selection**: Ctrl+Click to select multiple entities
3. **Selection Synchronization**: Viewport and hierarchy selection stay in sync
4. **Transform Gizmos**: Use W/E/R keys to switch manipulation modes
5. **Camera Focus**: Press F to focus camera on selected objects
6. **Visual Feedback**: Selected objects show highlighting and outlines
7. **Grid Controls**: Toggle grid visibility and snap settings
8. **2D/3D Switching**: Seamlessly switch between viewport modes

### Step 4: Scene Management with Viewport

Practice scene operations with real-time viewport feedback:

1. **Save scene**: File → Save Scene (Ctrl+S) - viewport state preserved
2. **Create new scene**: File → New Scene - viewport automatically refreshes
3. **Entity visualization**: All entities appear immediately in viewport
4. **Scene validation**: Automatic validation with visual error feedback
5. **Performance**: Optimized rendering for large scenes
6. **Camera state**: Viewport camera position saved with scene

## Current Testing & Future Building

**Advanced viewport and rendering system fully operational!**

### Step 1: Viewport Testing

What you can test now:
1. **3D Viewport**: Real-time scene visualization with entity rendering
2. **Object Selection**: Click objects in viewport, multi-select with Ctrl
3. **Transform Gizmos**: Use W/E/R keys for translate/rotate/scale
4. **Camera Controls**: Orbit, pan, zoom with smooth animations
5. **Focus Operations**: Press F to focus on selected objects
6. **Visual Feedback**: Selection highlighting and visual outlines
7. **2D/3D Switching**: Toggle between viewport modes seamlessly
8. **Performance**: Optimized rendering with material/geometry caching

### Step 2: Viewport Integration Testing

The editor provides comprehensive viewport integration:
```
Viewport Integration:
✓ Entity-to-visual mapping working
✓ Component rendering (Transform, Mesh, Light, Camera)
✓ Selection synchronization (viewport ↔ hierarchy)
✓ Transform gizmo manipulation
✓ Camera controls and focus operations
✓ Performance optimization active
✓ Multi-selection and visual feedback
✓ 2D/3D mode switching functional
```

### Step 3: Advanced Viewport Features

**Advanced Viewport System:**
- Real-time 3D/2D scene visualization
- Professional object selection with multi-select
- Transform gizmos (translate, rotate, scale)
- Smooth camera controls with focus operations
- Performance-optimized entity rendering
- Visual feedback and highlighting systems

**Integrated Editor Experience:**
- Viewport-hierarchy selection synchronization
- Real-time component property updates
- Transform manipulation with visual feedback
- 2D/3D seamless switching
- Grid, axes, and helper visualization
- Keyboard shortcuts (W/E/R, F, Q)

**Performance & Optimization:**
- Material and geometry caching
- Efficient entity-to-visual mapping
- Optimized rendering pipeline
- Memory management and resource cleanup

### Step 4: Advanced Asset System Features

**Asset System Capabilities:**
- Comprehensive asset import pipeline
- Image, 3D model, audio, and font import
- Asset browser with drag-and-drop to viewport
- Asset preview generation and caching
- Texture and material management

**File & Project System:**
- New script and shader creation
- Project folder structure management
- File templates and snippets
- External file change monitoring

**Script Editor & Code Integration:**
- WORLDC syntax highlighting and validation
- Script component integration with viewport
- Hot-reload and debugging support
- Script performance profiling

## Next Steps

### What You Can Do Now

1. **Practice Scene Management**
   - Create multiple scenes with different templates
   - Build complex entity hierarchies
   - Experiment with entity organization and naming

2. **Learn the Editor Interface**
   - Master hierarchy navigation and selection
   - Use keyboard shortcuts for efficiency
   - Understand the Inspector panel layout

3. **Prepare for Component System**
   - Plan your game entities and their needed components
   - Think about Transform positions for your game objects
   - Organize entities logically for component assignment

### Component System Features

1. **Add Components to Entities**
   - Render components for visual representation
   - Camera components for viewport control
   - Physics components for collision and movement

2. **Component Property Editing**
   - Visual property editors in Inspector
   - Real-time component validation
   - Component dependency management

3. **Viewport Integration**
   - Transform gizmos for visual editing
   - Object selection and highlighting
   - Real-time rendering of scene entities

### Learning Resources

1. **Read the User Guide**
   - [USER-GUIDE.md](USER-GUIDE.md) - Comprehensive editor reference
   - [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) - Advanced development topics

2. **WORLDC Language**
   - [WORLDC Manual](../worldc/docs/worldc-manual.md) - Complete language reference
   - [WORLDC Lexicon](../worldc/docs/worldc-lexicon.md) - API documentation

3. **Community Resources**
   - GitHub Issues for bug reports
   - Discord server for real-time help
   - Example projects in repository

### Common Next Features

**Audio System:**
```worldc
// Play background music
AudioManager.playMusic("background.mp3", true);

// Play sound effects
AudioManager.playSound("coin.wav");
AudioManager.setVolume(0.8f);
```

**Animation System:**
```worldc
// Simple sprite animation
SpriteRenderer* renderer = getComponent<SpriteRenderer>();
renderer->playAnimation("walk", true);
```

**UI Elements:**
```worldc
// Display score
UIText* scoreText = UI.createText("Score: 0");
scoreText->setPosition(Vector2(10, 10));
```

**Save System:**
```worldc
// Save game data
SaveSystem.setInt("level", currentLevel);
SaveSystem.setFloat("bestTime", playerTime);
SaveSystem.save();
```

## Troubleshooting

### Editor Won't Start
```bash
# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Start in development mode
npm run dev
```

### Viewport is Black
- Update graphics drivers
- Try software rendering: `--disable-gpu`
- Check OpenGL support in browser

### Script Compilation Errors
- Check syntax carefully (semicolons, braces)
- Verify WORLDC compiler installation
- Review error messages in Console panel

### Build Failures
- Ensure all assets are in project directory
- Check file permissions
- Verify output directory is writable

### Performance Issues
- Reduce viewport quality settings
- Limit number of entities in scene
- Optimize asset file sizes

## Quick Reference

### Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Scene |
| `Ctrl+S` | Save Scene |
| `F` | Focus Camera on Selected |
| `Q` | Select Tool |
| `W` | Translate Tool (Move) |
| `E` | Rotate Tool |
| `R` | Scale Tool |
| `Home` | Reset Camera |
| `Esc` | Clear Selection |
| `Ctrl+Click` | Multi-Select |
| `Shift+Click` | Range Select |

### WORLDC Quick Syntax

```worldc
// Variables
int health = 100;
float speed = 5.5f;
bool isAlive = true;
string name = "Player";

// Functions
void start() { }
void update(float deltaTime) { }

// Input
if (Input.isKeyPressed(KeyCode.SPACE)) { }

// Components
Transform* t = getComponent<Transform>();
t->position = Vector3(0, 0, 0);

// Audio
AudioManager.playSound("sound.wav");

// Debug
console.log("Debug message");
```

## Success Checklist

By the end of this quickstart, you should have:

- [ ] WORLDEDIT installed and running
- [ ] Created your first scene with entities
- [ ] Explored the enhanced 3D viewport interface
- [ ] Used object selection and transform gizmos
- [ ] Tested camera controls and focus operations
- [ ] Experienced real-time viewport feedback
- [ ] Understood the integrated editing workflow
- [ ] Identified Phase 5 asset system features

**Congratulations!** You're now ready to create your own games with WORLDEDIT. 

For more advanced topics, see the [USER-GUIDE.md](USER-GUIDE.md) and [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md).

---

**Need Help?**
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Visit the GitHub repository for examples
- Join the community Discord for support