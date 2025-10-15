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

2. **Install WORLDSRC Compiler**
   ```bash
   npm install -g @worldenv/worldsrc
   worldsrc --version  # Verify installation
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

2. **Welcome Screen**
   - Choose project location (default: `~/WorldEditProjects`)
   - Configure editor preferences
   - Select theme (Dark/Light)

3. **Verify Installation**
   - Check WORLDSRC compiler detection
   - Confirm asset directories
   - Test viewport rendering

## Creating Your First Project

### Step 1: New Project

1. Click **"New Project"** on welcome screen
2. Choose **"2D Platformer"** template
3. Set project name: `MyFirstGame`
4. Select project location
5. Click **"Create Project"**

### Step 2: Project Structure

Your project now contains:
```
MyFirstGame/
├── assets/
│   ├── sprites/      # Character and object sprites
│   └── audio/        # Sound effects and music
├── scenes/
│   └── MainLevel.worldscene
├── scripts/
│   ├── PlayerController.wsrc
│   └── GameManager.wsrc
└── project.json
```

### Step 3: Initial Scene

The template creates a basic level with:
- Player character sprite
- Platform geometry
- Background elements
- Basic lighting setup

## Basic Editor Tour

### Main Interface

```
┌─────────────────────────────────────────────────────────────┐
│ File  Edit  View  Project  Build  Help                     │
├──────────┬────────────────────────────────┬─────────────────┤
│ Hierarchy│                                │ Inspector       │
│          │        Viewport                │                 │
│ Player   │                                │ Transform       │
│ Platform │                                │ Position: 0,0,0 │
│ Camera   │                                │ Rotation: 0,0,0 │
├──────────┼────────────────────────────────┼─────────────────┤
│ Assets   │        Script Editor           │ Console         │
│ sprites/ │                                │                 │
│ audio/   │  class PlayerController {      │ Build: Success  │
└──────────┴────────────────────────────────┴─────────────────┘
```

### Key Panels

**Hierarchy Panel (Left)**
- Shows all entities in the scene
- Drag to reparent objects
- Right-click for context menu

**Viewport (Center)**
- Visual scene editor
- Use mouse to navigate:
  - **Left Click**: Select objects
  - **Middle Click + Drag**: Pan view
  - **Mouse Wheel**: Zoom in/out
  - **Right Click + Drag**: Orbit camera (3D)

**Inspector Panel (Right)**
- Edit properties of selected entity
- Add/remove components
- Adjust transform values

**Asset Browser (Bottom Left)**
- Browse project files
- Drag assets into scene
- Import new assets

**Script Editor (Bottom Center)**
- Edit WORLDSRC code
- Syntax highlighting
- IntelliSense support

## Your First Script

### Step 1: Open Player Script

1. In Asset Browser, navigate to `scripts/`
2. Double-click `PlayerController.wsrc`
3. Script opens in editor

### Step 2: Examine the Code

```worldsrc
#include <worldenv.h>

class PlayerController {
    private float speed = 200.0f;
    private float jumpForce = 400.0f;
    private bool isGrounded = false;
    
    void start() {
        // Called when entity is created
        console.log("Player initialized");
    }
    
    void update(float deltaTime) {
        handleMovement(deltaTime);
        handleJumping();
    }
    
    private void handleMovement(float deltaTime) {
        Vector2 velocity = Vector2.zero;
        
        if (Input.isKeyPressed(KeyCode.A) || Input.isKeyPressed(KeyCode.LEFT)) {
            velocity.x = -speed;
        }
        if (Input.isKeyPressed(KeyCode.D) || Input.isKeyPressed(KeyCode.RIGHT)) {
            velocity.x = speed;
        }
        
        transform.position.x += velocity.x * deltaTime;
    }
    
    private void handleJumping() {
        if (Input.isKeyPressed(KeyCode.SPACE) && isGrounded) {
            RigidBody* rb = getComponent<RigidBody>();
            rb->addForce(Vector2(0, jumpForce));
            isGrounded = false;
        }
    }
}
```

### Step 3: Modify the Script

Let's add a simple jump sound effect:

1. Find the `handleJumping()` function
2. Add this line inside the if statement:
```worldsrc
AudioManager.playSound("jump.wav");
```

3. Save the file (`Ctrl+S`)

### Step 4: Attach Script to Player

1. Select Player entity in Hierarchy
2. In Inspector, click **"Add Component"**
3. Choose **"Script Component"**
4. Set Script File to `PlayerController.wsrc`
5. Language should auto-detect as WORLDSRC

## Building and Testing

### Step 1: Test in Play Mode

1. Click the **Play** button in toolbar
2. Use **A/D** or **Arrow Keys** to move
3. Press **Space** to jump
4. Click **Stop** to exit play mode

### Step 2: Build for Web

1. Go to **Build → Build Settings**
2. Select **Web** platform
3. Set output directory: `build/web/`
4. Click **Build**

Watch the Console panel for build progress:
```
Compiling WORLDSRC scripts...
Generating TypeScript...
Bundling assets...
Creating web build...
Build completed successfully!
```

### Step 3: Test Built Game

1. Navigate to `build/web/` folder
2. Open `index.html` in web browser
3. Your game should run in the browser

## Next Steps

### Immediate Tasks

1. **Customize Player Sprite**
   - Import your own sprite image
   - Assign to Player entity's Sprite Renderer

2. **Design Levels**
   - Add more platforms using primitive shapes
   - Create collectible items
   - Add enemies with basic AI

3. **Enhance Gameplay**
   - Add sound effects and music
   - Implement score system
   - Create multiple levels

### Learning Resources

1. **Read the User Guide**
   - [USER-GUIDE.md](USER-GUIDE.md) - Comprehensive editor reference
   - [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) - Advanced development topics

2. **WORLDSRC Language**
   - [WORLDSRC Manual](../worldsrc/docs/worldsrc-manual.md) - Complete language reference
   - [WORLDSRC Lexicon](../worldsrc/docs/worldsrc-lexicon.md) - API documentation

3. **Community Resources**
   - GitHub Issues for bug reports
   - Discord server for real-time help
   - Example projects in repository

### Common Next Features

**Audio System:**
```worldsrc
// Play background music
AudioManager.playMusic("background.mp3", true);

// Play sound effects
AudioManager.playSound("coin.wav");
AudioManager.setVolume(0.8f);
```

**Animation System:**
```worldsrc
// Simple sprite animation
SpriteRenderer* renderer = getComponent<SpriteRenderer>();
renderer->playAnimation("walk", true);
```

**UI Elements:**
```worldsrc
// Display score
UIText* scoreText = UI.createText("Score: 0");
scoreText->setPosition(Vector2(10, 10));
```

**Save System:**
```worldsrc
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
- Verify WORLDSRC compiler installation
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
| `Ctrl+N` | New Project |
| `Ctrl+S` | Save Scene |
| `F5` | Play Mode |
| `F` | Focus on Selected |
| `W` | Move Tool |
| `E` | Rotate Tool |
| `R` | Scale Tool |

### WORLDSRC Quick Syntax

```worldsrc
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
- [ ] Created your first project
- [ ] Explored the main interface panels
- [ ] Modified a WORLDSRC script
- [ ] Tested in play mode
- [ ] Built a web version of your game
- [ ] Identified next learning steps

**Congratulations!** You're now ready to create your own games with WORLDEDIT. 

For more advanced topics, see the [USER-GUIDE.md](USER-GUIDE.md) and [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md).

---

**Need Help?**
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Visit the GitHub repository for examples
- Join the community Discord for support