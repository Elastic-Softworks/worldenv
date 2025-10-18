# WORLDENV PRE-ALPHA TESTING GUIDE

**Complete testing manual for WORLDEDIT and WORLDC systems**

## Table of Contents

- [Overview](#overview)
- [Testing Setup](#testing-setup)
- [Testing Methodology](#testing-methodology)
- [I. WORLDEDIT Editor Testing](#i-worldedit-editor-testing)
  - [1.1 Application Foundation](#11-application-foundation)
  - [1.2 Project Management](#12-project-management)
  - [1.3 UI Framework & Layout](#13-ui-framework--layout)
  - [1.4 Viewport & Rendering](#14-viewport--rendering)
  - [1.5 Scene Hierarchy System](#15-scene-hierarchy-system)
  - [1.6 Component System](#16-component-system)
  - [1.7 Asset Management](#17-asset-management)
  - [1.8 Script Editor](#18-script-editor)
  - [1.9 Build System](#19-build-system)
- [II. WORLDC Language Testing](#ii-worldc-language-testing)
  - [2.1 Language Foundation](#21-language-foundation)
  - [2.2 Compilation Pipeline](#22-compilation-pipeline)
  - [2.3 Runtime Integration](#23-runtime-integration)
  - [2.4 Development Tools](#24-development-tools)
- [III. Performance & Scalability Testing](#iii-performance--scalability-testing)
  - [3.1 Editor Performance](#31-editor-performance)
  - [3.2 Compilation Performance](#32-compilation-performance)
  - [3.3 Runtime Performance](#33-runtime-performance)
- [Testing Tools & Commands](#testing-tools--commands)
- [Feedback Guidelines](#feedback-guidelines)
- [Quick Reference](#quick-reference)

---

## Overview

This guide provides comprehensive instructions for testing the WORLDENV system as part of pre-alpha validation. Each test item includes specific steps, commands to run, what to observe, and guidance on providing actionable feedback.

### Related Documentation
- **[QUICKSTART.md](QUICKSTART.md)** - Basic setup and first project
- **[USER-GUIDE.md](USER-GUIDE.md)** - Detailed feature documentation
- **[DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)** - Technical implementation details
- **[API-REFERENCE.md](API-REFERENCE.md)** - Complete API documentation
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### System Architecture Overview

```
WORLDENV Ecosystem
├── WORLDEDIT (Editor)
│   ├── Main Process (Electron)
│   ├── Renderer Process (React/TypeScript)
│   ├── Viewport Engine (Three.js/Pixi.js)
│   └── Asset Pipeline
└── WORLDC (Language)
    ├── Lexer/Parser
    ├── Semantic Analyzer
    ├── Code Generator
    └── Language Server
```

---

## Testing Setup

### Prerequisites

Before beginning testing, ensure you have:

```bash
# Verify system requirements
node --version     # Should be 18.0.0+
npm --version      # Should be 9.0.0+
git --version      # Any recent version

# Check available RAM
free -h           # Linux
vm_stat           # macOS
systeminfo        # Windows

# Verify graphics capabilities
glxinfo | grep OpenGL    # Linux
system_profiler SPDisplaysDataType  # macOS
dxdiag                   # Windows
```

### Environment Setup

1. **Clone and Build WORLDENV**
   ```bash
   git clone https://github.com/elastic-softworks/worldenv.git
   cd worldenv
   
   # Build editor
   cd editor
   npm install
   npm run build
   
   # Build WORLDC
   cd ../worldc
   npm install
   npm run build
   npm test  # Verify basic functionality
   ```

2. **Install Testing Tools**
   ```bash
   # Global WORLDC compiler
   npm install -g @worldenv/worldc
   
   # Memory monitoring (optional)
   npm install -g clinic
   
   # Performance profiling (optional)
   npm install -g autocannon
   ```

3. **Open HITL Testing Interface**
   - Navigate to `worldenv/hitl/index.html`
   - Open in web browser
   - Bookmark for easy access during testing

### Testing Environment

Create a dedicated testing workspace:

```bash
mkdir ~/worldenv-testing
cd ~/worldenv-testing

# Create test projects directory
mkdir test-projects

# Create asset test files
mkdir test-assets
# (We'll populate this during asset testing)
```

---

## Testing Methodology

### Test Item Structure

Each test follows this pattern:

1. **Objective** - What you're testing
2. **Setup** - Required preparation
3. **Steps** - Exact actions to perform
4. **Expected Behavior** - What should happen
5. **Commands** - Terminal commands to run
6. **Screenshots** - What to capture
7. **Feedback Format** - How to report results

### Feedback Priorities

**Critical** - System completely unusable, blocks all testing
**High** - Major functionality broken, blocks significant testing
**Medium** - Feature doesn't work as expected, has workarounds
**Low** - Minor cosmetic or convenience issues

### Using the HITL System

1. Click each test item in the checklist
2. Follow the detailed instructions below
3. Provide notes in the modal that opens
4. Set appropriate priority level
5. Upload screenshots for visual issues
6. Mark as "Softlock" if it blocks further testing

---

## I. WORLDEDIT Editor Testing

### 1.1 Application Foundation

#### Test 1: Application launches successfully on Windows, macOS, Linux

**Objective:** Verify WORLDEDIT starts correctly across platforms

**Setup:**
```bash
cd worldenv/editor
npm run start
```

**Steps:**
1. Run the start command above
2. Observe startup sequence
3. Wait for main window to appear
4. Check for any error dialogs

**Expected Behavior:**
- Application launches within 5 seconds
- No error messages in terminal
- Main window appears with proper UI
- Menu bar loads correctly

**Screenshots:** Capture main window after successful launch

**Feedback Focus:**
- Startup time (measure with stopwatch)
- Any error messages (copy exact text)
- Visual glitches during startup
- Platform-specific issues (menu placement, window decorations)

#### Test 2: Splash screen displays correctly

**Objective:** Verify splash screen appearance and timing

**Setup:** Fresh application start

**Steps:**
1. Launch WORLDEDIT
2. Immediately observe splash screen
3. Time how long it remains visible
4. Check for proper graphics and text

**Expected Behavior:**
- Splash appears immediately
- Shows WORLDEDIT branding
- Displays for 2-3 seconds
- Transitions smoothly to main window

**Screenshots:** Capture splash screen

**Feedback Focus:**
- Splash screen appearance (graphics, text quality)
- Timing (too fast/slow)
- Transition smoothness
- Any graphical corruption

#### Test 3: Main window opens with proper layout

**Objective:** Verify default UI layout and panel arrangement

**Setup:** Application successfully launched

**Steps:**
1. Observe main window layout
2. Check all panels are visible
3. Verify menu bar completeness
4. Test initial responsiveness

**Expected Behavior:**
- Hierarchy panel on left
- Viewport in center
- Inspector panel on right
- Asset browser at bottom
- All panels properly sized

**Screenshots:** Full window layout

**Feedback Focus:**
- Panel positioning and sizing
- Any missing UI elements
- Visual alignment issues
- Default window size appropriateness

#### Test 4: Application closes gracefully without errors

**Objective:** Ensure clean shutdown process

**Setup:** Application running normally

**Steps:**
1. Use File → Exit (or Cmd+Q/Alt+F4)
2. Also test window close button
3. Observe shutdown process
4. Check terminal for error messages

**Expected Behavior:**
- Immediate response to close command
- No error dialogs
- Clean terminal output
- Process fully terminates

**Commands:**
```bash
# After closing, verify no processes remain
ps aux | grep electron  # Should show nothing
```

**Feedback Focus:**
- Shutdown speed
- Any error messages during close
- Processes that don't terminate
- Data loss warnings (should appear if needed)

#### Test 5: No memory leaks during startup/shutdown cycle

**Objective:** Verify memory management during app lifecycle

**Setup:** Install memory monitoring tools

**Commands:**
```bash
# Start memory monitoring
cd worldenv/editor

# Method 1: Built-in Node.js profiling
npm run start --inspect

# Method 2: External monitoring (Linux/macOS)
while true; do
  ps -o pid,vsz,rss,comm -p $(pgrep -f "electron")
  sleep 2
done
```

**Steps:**
1. Start memory monitoring
2. Launch WORLDEDIT
3. Let it run for 2 minutes
4. Close application
5. Repeat cycle 3 times
6. Record memory usage patterns

**Expected Behavior:**
- Memory usage stabilizes after startup
- No continuous memory growth
- Clean memory release on shutdown
- Consistent memory usage across cycles

**Feedback Focus:**
- Peak memory usage (in MB)
- Memory growth patterns
- Memory release efficiency
- Any system impact

### Window Management Tests (6-10)

#### Test 6: Window resizing works correctly

**Objective:** Verify window resize behavior and UI adaptation

**Steps:**
1. Resize window to minimum size
2. Resize to maximum/fullscreen
3. Resize to various intermediate sizes
4. Test rapid resize operations

**Expected Behavior:**
- Smooth resize operations
- UI elements scale appropriately
- No visual corruption
- Panels maintain proportions

#### Test 7: Minimize/maximize functionality

**Objective:** Test window state controls

**Steps:**
1. Test minimize button
2. Restore from taskbar/dock
3. Test maximize button
4. Test restore from maximized

**Expected Behavior:**
- Immediate response to controls
- Proper state restoration
- Correct icon in taskbar/dock

#### Test 8: Multi-monitor support

**Objective:** Verify behavior with multiple displays

**Setup:** Requires multi-monitor setup

**Steps:**
1. Move window between monitors
2. Maximize on different monitors
3. Test with different DPI settings
4. Verify panel behavior

**Expected Behavior:**
- Window moves smoothly between displays
- UI scales correctly on different DPIs
- No visual corruption

#### Test 9: Window state persistence between sessions

**Objective:** Verify settings save and restore

**Steps:**
1. Resize and position window
2. Close application
3. Restart application
4. Verify window state

**Expected Behavior:**
- Window reopens in same position
- Size and maximized state preserved
- Panel layout maintained

#### Test 10: Proper high-DPI scaling

**Objective:** Test UI scaling on high-density displays

**Setup:** Requires high-DPI display or scaling settings

**Steps:**
1. Set system scaling to 150% or 200%
2. Launch WORLDEDIT
3. Check text clarity
4. Verify icon sharpness
5. Test UI element sizing

**Expected Behavior:**
- Text renders sharply
- Icons appear crisp
- UI elements properly sized
- No blurry or pixelated elements

### Menu System Tests (11-15)

#### Test 11: All menu items functional

**Objective:** Verify complete menu system functionality

**Setup:** Application running with default project

**Steps:**
1. Test each top-level menu (File, Edit, View, etc.)
2. Click every menu item
3. Verify keyboard shortcuts work
4. Test disabled/enabled states

**Expected Behavior:**
- All items respond appropriately
- Shortcuts match menu labels
- Disabled items appear grayed out
- Context-appropriate enabling/disabling

**Commands:** Test these key shortcuts:
- `Ctrl+N` (New Project)
- `Ctrl+O` (Open Project) 
- `Ctrl+S` (Save)
- `Ctrl+Z` (Undo)
- `Ctrl+Y` (Redo)
- `F5` (Play Mode)

#### Test 12: Keyboard shortcuts work

**Objective:** Comprehensive shortcut testing

**Steps:**
1. Test all documented shortcuts from [USER-GUIDE.md](USER-GUIDE.md#keyboard-shortcuts)
2. Verify shortcuts work in different contexts
3. Test modifier key combinations
4. Check for shortcut conflicts

**Expected Behavior:**
- All shortcuts respond correctly
- No conflicts between shortcuts
- Context-sensitive behavior works

#### Test 13: Context menus appear correctly

**Objective:** Test right-click context menus

**Steps:**
1. Right-click in hierarchy panel
2. Right-click in viewport
3. Right-click in asset browser
4. Right-click on various UI elements

**Expected Behavior:**
- Menus appear quickly
- Appropriate items for context
- Items work correctly
- Menus dismiss properly

#### Test 14: Menu state updates appropriately

**Objective:** Verify dynamic menu behavior

**Steps:**
1. Notice initial menu states
2. Create/open project
3. Select different objects
4. Enter/exit play mode
5. Observe menu changes throughout

**Expected Behavior:**
- Save/Save As enable when changes made
- Selection-dependent items update
- Play mode affects available options

#### Test 15: Platform-specific menu behavior (macOS app menu)

**Objective:** Test platform integration (macOS only)

**Setup:** macOS system required

**Steps:**
1. Verify app menu in menu bar
2. Test Preferences location
3. Check About dialog placement
4. Verify Quit behavior

**Expected Behavior:**
- Menu follows macOS conventions
- Standard items in expected locations
- Native appearance and behavior

---

### 1.2 Project Management

#### Test 16: New project wizard functions correctly

**Objective:** Verify project creation workflow

**Steps:**
1. Click "New Project" or use Ctrl+N
2. Go through wizard steps
3. Test different project templates
4. Verify all input fields work
5. Complete project creation

**Expected Behavior:**
- Wizard opens immediately
- All templates available
- Input validation works
- Project creates successfully

**Commands:**
```bash
# Verify project structure after creation
ls -la ~/worldenv-testing/test-projects/NewProject/
tree ~/worldenv-testing/test-projects/NewProject/  # if tree available
```

**Screenshots:** Capture wizard steps and final project structure

#### Test 17: Project templates available and working

**Objective:** Test each project template

**Steps:**
1. Create project with "2D Platformer" template
2. Create project with "First-Person 3D" template  
3. Create project with "Empty Project" template
4. Verify template content loads

**Expected Behavior:**
- All templates create successfully
- Template assets load correctly
- Default scenes open properly
- Scripts compile without errors

**Feedback Focus:**
- Template completeness
- Asset quality and appropriateness
- Default scene functionality
- Documentation quality within templates

#### Test 18: Default project structure created properly

**Objective:** Verify standard project organization

**Steps:**
1. Create new project
2. Examine file structure
3. Check required directories exist
4. Verify project.json content

**Expected Structure:**
```
ProjectName/
├── assets/
│   ├── sprites/
│   ├── models/
│   ├── audio/
│   └── fonts/
├── scenes/
│   └── Main.worldscene
├── scripts/
├── build/
└── project.json
```

**Commands:**
```bash
# Verify project structure
cd ~/worldenv-testing/test-projects/TestProject
find . -type d | sort
cat project.json | jq .  # if jq available
```

#### Test 19: Project settings saved correctly

**Objective:** Test project configuration persistence

**Steps:**
1. Open project settings
2. Modify various settings
3. Save and close project
4. Reopen project
5. Verify settings persistence

**Expected Behavior:**
- Settings dialog opens correctly
- All settings are editable
- Changes save immediately or on confirmation
- Settings persist across sessions

#### Test 20: Recent projects list updates

**Objective:** Verify recent projects functionality

**Steps:**
1. Create/open several projects
2. Check recent projects list
3. Open project from recent list
4. Verify list ordering (most recent first)

**Expected Behavior:**
- List updates automatically
- Projects open from list
- List shows correct project names
- Invalid/deleted projects handled gracefully

#### Test 21: Open existing project works

**Objective:** Test project opening functionality

**Steps:**
1. Use File → Open Project
2. Browse to existing project
3. Select project.json file
4. Verify project loads completely

**Expected Behavior:**
- File dialog opens correctly
- Project loads all assets
- Scene hierarchy restores
- No error messages

#### Test 22: Save project preserves all data

**Objective:** Verify data persistence

**Steps:**
1. Make changes to scene
2. Modify scripts
3. Adjust settings
4. Use Ctrl+S to save
5. Verify all changes preserved

**Expected Behavior:**
- Save operation completes quickly
- All changes preserved
- No data loss
- Status indicates save success

#### Test 23: Project validation detects issues

**Objective:** Test project integrity checking

**Steps:**
1. Intentionally corrupt project files
2. Remove required assets
3. Open corrupted project
4. Observe validation behavior

**Commands:**
```bash
# Create test corruption
echo "invalid json" > project.json
rm -f assets/sprites/player.png
```

**Expected Behavior:**
- Validation detects corruption
- Clear error messages
- Recovery suggestions provided
- Graceful handling of issues

#### Test 24: Auto-save functionality operational

**Objective:** Verify automatic saving

**Steps:**
1. Enable auto-save in settings
2. Make changes to project
3. Wait for auto-save interval
4. Verify changes are saved automatically

**Expected Behavior:**
- Auto-save triggers at intervals
- Visual indicator shows save status
- No interruption to workflow
- Configurable save frequency

#### Test 25: Project corruption recovery

**Objective:** Test recovery mechanisms

**Steps:**
1. Create backup scenarios
2. Simulate various corruption types
3. Test recovery procedures
4. Verify data recovery

**Expected Behavior:**
- Backup files created automatically
- Recovery wizard available
- Data restoration possible
- Minimal data loss

### File System Integration Tests (26-30)

#### Test 26: File browser shows correct directory structure

**Objective:** Verify file system navigation

**Steps:**
1. Open asset browser
2. Navigate through project directories
3. Verify folder hierarchy matches disk
4. Test folder expansion/collapse

#### Test 27: File operations (create, delete, rename) work

**Objective:** Test file management operations

**Steps:**
1. Create new folder in asset browser
2. Rename existing file
3. Delete test file
4. Verify operations reflect on disk

**Commands:**
```bash
# Verify file operations
ls -la assets/
# Check that operations appear in filesystem
```

#### Test 28: External file changes detected

**Objective:** Test file watching system

**Steps:**
1. Add file externally to project
2. Modify file outside editor
3. Delete file externally
4. Verify editor updates

**Commands:**
```bash
# Add file externally
cp /path/to/test.png assets/sprites/
# Modify file timestamp
touch assets/sprites/existing.png
```

#### Test 29: Large project handling (1000+ files)

**Objective:** Test performance with many files

**Setup:** Create large test project

**Commands:**
```bash
# Create large project structure
mkdir -p large-project/assets/{sprites,audio,models}
for i in {1..1000}; do
  touch "large-project/assets/sprites/sprite_$i.png"
done
```

**Steps:**
1. Open large project
2. Navigate file browser
3. Search for files
4. Perform operations

**Expected Behavior:**
- Acceptable loading time (<30 seconds)
- Smooth navigation
- Search functionality works
- No memory issues

#### Test 30: Network drive compatibility

**Objective:** Test projects on network storage

**Setup:** Network drive or cloud sync folder

**Steps:**
1. Create project on network drive
2. Work with project normally
3. Test with slow/interrupted connection
4. Verify file operations work

**Expected Behavior:**
- Projects work on network drives
- Appropriate error handling for network issues
- Performance acceptable

---

### 1.3 UI Framework & Layout

#### Test 31: All panels (Viewport, Hierarchy, Inspector, Assets) functional

**Objective:** Verify core panel functionality

**Steps:**
1. Interact with each main panel
2. Test panel-specific operations
3. Verify content updates correctly
4. Check cross-panel communication

**Expected Behavior:**
- All panels respond to interaction
- Content updates appropriately
- Panel communication works (selection sync)

**Panel Functions to Test:**
- **Hierarchy:** Select entities, drag/drop
- **Viewport:** Navigate scene, select objects
- **Inspector:** Edit properties, add components
- **Assets:** Browse files, drag to scene

#### Test 32: Panel resizing and docking works

**Objective:** Test panel layout system

**Steps:**
1. Resize panels by dragging borders
2. Test minimum/maximum panel sizes
3. Undock panels into floating windows
4. Re-dock panels to different locations
5. Test tabbed panel groups

**Expected Behavior:**
- Smooth resize operations
- Panels respect size constraints
- Docking system works intuitively
- Layout saves and restores

**Screenshots:** Capture different layout configurations

#### Test 33: Panel state persistence

**Objective:** Verify layout saves across sessions

**Steps:**
1. Customize panel layout
2. Resize and reposition panels
3. Close and restart application
4. Verify layout restoration

**Expected Behavior:**
- Layout restores exactly
- Panel sizes maintained
- Floating panels return to position

#### Test 34: Panel overflow handling

**Objective:** Test behavior with insufficient space

**Steps:**
1. Resize window to very small size
2. Add content to panels
3. Test scrolling behavior
4. Verify critical controls remain accessible

**Expected Behavior:**
- Scrollbars appear when needed
- Important controls remain visible
- No content completely hidden
- Graceful degradation

#### Test 35: Responsive layout on different screen sizes

**Objective:** Test UI adaptation to screen size

**Setup:** Test on different resolutions or window sizes

**Steps:**
1. Test on minimum supported resolution
2. Test on very high resolution
3. Test on ultrawide displays
4. Verify UI scaling

**Expected Behavior:**
- UI adapts to screen size
- Text remains readable
- Controls remain accessible
- Proportions maintain usability

### Theme System Tests (36-40)

#### Test 36: Dark/light theme switching

**Objective:** Verify theme system functionality

**Steps:**
1. Open theme settings
2. Switch between dark and light themes
3. Verify immediate application
4. Check all UI elements update

**Expected Behavior:**
- Immediate theme application
- All elements update consistently
- Good contrast and readability
- No visual artifacts during switch

#### Test 37: Theme persistence between sessions

**Objective:** Test theme setting persistence

**Steps:**
1. Change theme
2. Restart application
3. Verify theme is maintained

**Expected Behavior:**
- Theme setting persists
- Application opens with last theme
- No flickering during startup

#### Test 38: Consistent styling across all components

**Objective:** Verify theme consistency

**Steps:**
1. Open all panels and dialogs
2. Navigate through menus
3. Check modals and popups
4. Verify consistent appearance

**Expected Behavior:**
- All components use theme colors
- Consistent spacing and typography
- No unthemed elements
- Professional appearance

#### Test 39: High contrast accessibility support

**Objective:** Test accessibility features

**Setup:** Enable high contrast mode in OS

**Steps:**
1. Enable system high contrast
2. Launch WORLDEDIT
3. Test readability and navigation
4. Verify all controls are visible

**Expected Behavior:**
- High contrast mode respected
- All text clearly readable
- Focus indicators visible
- Navigation remains functional

#### Test 40: Custom theme support

**Objective:** Test theme customization

**Steps:**
1. Access theme customization
2. Modify colors and settings
3. Apply custom theme
4. Test saving custom themes

**Expected Behavior:**
- Customization options available
- Changes apply immediately
- Custom themes can be saved
- Export/import functionality works

### Component Library Tests (41-45)

#### Test 41: All UI components render correctly

**Objective:** Verify component rendering quality

**Steps:**
1. Open component showcase/demo
2. Test all button variants
3. Check input field types
4. Verify icon rendering

**Expected Behavior:**
- All components render sharply
- No visual artifacts
- Consistent appearance
- Proper alignment

#### Test 42: Form validation and error display

**Objective:** Test form handling

**Steps:**
1. Find forms in application
2. Submit with invalid data
3. Test field validation
4. Verify error messages

**Expected Behavior:**
- Validation triggers appropriately
- Clear error messages
- Visual indication of errors
- Prevents invalid submission

#### Test 43: Button states and interactions

**Objective:** Test button behavior

**Steps:**
1. Test hover states
2. Test active/pressed states
3. Test disabled states
4. Verify click responses

**Expected Behavior:**
- Visual feedback for all states
- Immediate response to clicks
- Disabled buttons non-functional
- Consistent behavior across button types

#### Test 44: Input field behavior

**Objective:** Verify input field functionality

**Steps:**
1. Test text inputs
2. Test number inputs
3. Test dropdown selections
4. Test keyboard navigation

**Expected Behavior:**
- Appropriate input validation
- Good keyboard navigation
- Copy/paste functionality
- Undo/redo support

#### Test 45: Drag and drop functionality

**Objective:** Test drag and drop system

**Steps:**
1. Drag assets from browser to scene
2. Drag entities in hierarchy
3. Test panel rearrangement
4. Verify visual feedback

**Expected Behavior:**
- Smooth drag operations
- Clear visual feedback
- Appropriate drop zones
- Cancellation support

---

### 1.4 Viewport & Rendering

#### Test 46: Three.js integration working

**Objective:** Verify 3D rendering system

**Steps:**
1. Create 3D project
2. Add 3D objects to scene
3. Verify rendering quality
4. Test basic 3D features

**Expected Behavior:**
- 3D objects render correctly
- Good performance
- No rendering errors
- Proper depth and lighting

**Commands:**
```bash
# Check WebGL support
# In browser console (F12):
# WebGL report: chrome://gpu/
```

#### Test 47: Camera controls (orbit, pan, zoom)

**Objective:** Test 3D camera navigation

**Steps:**
1. Use mouse to orbit around objects
2. Pan camera with middle mouse
3. Zoom with scroll wheel
4. Test keyboard camera controls

**Expected Behavior:**
- Smooth camera movement
- Intuitive controls
- Proper focus points
- No camera drift or jitter

**Controls to Test:**
- **Orbit:** Left mouse + drag
- **Pan:** Middle mouse + drag
- **Zoom:** Mouse wheel
- **Focus:** F key on selected object

#### Test 48: Object selection and highlighting

**Objective:** Test object interaction

**Steps:**
1. Click on 3D objects
2. Verify selection highlighting
3. Test multi-selection
4. Test selection box tool

**Expected Behavior:**
- Objects select on click
- Clear selection highlighting
- Multi-selection works
- Selection syncs with hierarchy

#### Test 49: Transform gizmos functional

**Objective:** Test object manipulation tools

**Steps:**
1. Select object in 3D view
2. Test move gizmo (W key)
3. Test rotate gizmo (E key)
4. Test scale gizmo (R key)

**Expected Behavior:**
- Gizmos appear on selection
- Smooth transformation
- Visual feedback during operation
- Snapping options work

#### Test 50: Grid and axis helpers visible

**Objective:** Verify visual aids

**Steps:**
1. Check for grid in viewport
2. Verify axis indicators
3. Test grid visibility toggle
4. Check ruler/measurement tools

**Expected Behavior:**
- Grid clearly visible
- Axis indicators present
- Toggle controls work
- Helpful for alignment

#### Test 51: Performance with 1000+ objects

**Objective:** Test rendering performance

**Setup:** Create scene with many objects

**Commands:**
```bash
# Create performance test scene
# Use scripting to create many objects:
for i in {1..1000}; do
  # Add objects via script or copy/paste
done
```

**Steps:**
1. Create scene with 1000+ objects
2. Navigate around scene
3. Monitor frame rate
4. Test selection operations

**Expected Behavior:**
- Maintains reasonable frame rate (>30fps)
- No significant lag
- Selection remains responsive
- Memory usage reasonable

### 2D Viewport Tests (52-57)

#### Test 52: Pixi.js integration working

**Objective:** Verify 2D rendering system

**Steps:**
1. Create 2D project
2. Add sprites and 2D objects
3. Verify rendering quality
4. Test 2D-specific features

**Expected Behavior:**
- Crisp 2D rendering
- Good performance
- Proper sprite handling
- No visual artifacts

#### Test 53: 2D camera controls

**Objective:** Test 2D navigation

**Steps:**
1. Pan around 2D scene
2. Zoom in and out
3. Test snap to pixel grid
4. Verify orthographic view

**Expected Behavior:**
- Smooth 2D navigation
- Pixel-perfect zoom levels
- Grid alignment
- No perspective distortion

#### Test 54: Sprite rendering and manipulation

**Objective:** Test 2D sprite system

**Steps:**
1. Import sprite images
2. Create sprite entities
3. Test sprite properties
4. Test animation frames

**Expected Behavior:**
- Sprites render clearly
- No scaling artifacts
- Animation playback works
- Sprite sheets supported

#### Test 55: Layer management

**Objective:** Test 2D layer system

**Steps:**
1. Create multiple layers
2. Arrange layer order
3. Test layer visibility
4. Test layer locking

**Expected Behavior:**
- Clear layer hierarchy
- Easy reordering
- Visibility toggles work
- Locked layers protected

#### Test 56: 2D physics visualization

**Objective:** Test physics debug rendering

**Steps:**
1. Add 2D physics components
2. Enable physics visualization
3. Test collision boundaries
4. Verify physics simulation

**Expected Behavior:**
- Collision shapes visible
- Physics simulation accurate
- Debug rendering helpful
- Performance acceptable

#### Test 57: Smooth viewport switching

**Objective:** Test 2D/3D mode switching

**Steps:**
1. Switch between 2D and 3D modes
2. Test viewport transitions
3. Verify camera state preservation
4. Test mode-specific tools

**Expected Behavior:**
- Quick mode switching
- Smooth transitions
- State preservation
- Appropriate tool availability

### Rendering Performance Tests (58-62)

#### Test 58: Maintains 60fps with typical scenes

**Objective:** Test target performance

**Setup:** Create typical game scene

**Steps:**
1. Create scene with representative content
2. Monitor frame rate
3. Test during interaction
4. Verify consistent performance

**Commands:**
```bash
# Monitor performance in browser dev tools
# Or use built-in performance monitoring
```

**Expected Behavior:**
- Consistent 60fps or higher
- No significant frame drops
- Smooth interaction
- Good visual quality

#### Test 59: Frustum culling working

**Objective:** Verify culling optimization

**Steps:**
1. Create scene with objects outside view
2. Monitor rendering stats
3. Move camera to hide/show objects
4. Verify culling behavior

**Expected Behavior:**
- Objects outside view aren't rendered
- Performance improves with culling
- No visual popping
- Automatic optimization

#### Test 60: LOD system functional

**Objective:** Test level-of-detail system

**Steps:**
1. Create objects with LOD levels
2. Test distance-based switching
3. Verify performance impact
4. Check visual quality

**Expected Behavior:**
- Automatic LOD switching
- Performance improvement at distance
- Acceptable visual quality
- Smooth transitions

#### Test 61: Memory usage under 2GB

**Objective:** Test memory efficiency

**Setup:** Large scene with many assets

**Commands:**
```bash
# Monitor memory usage
top -p $(pgrep electron)
# Or use built-in memory profiler
```

**Steps:**
1. Load large project
2. Monitor memory usage
3. Work with many assets
4. Check for memory growth

**Expected Behavior:**
- Memory usage stays under 2GB
- No memory leaks
- Efficient asset management
- Graceful handling of limits

#### Test 62: GPU compatibility testing

**Objective:** Test graphics hardware compatibility

**Steps:**
1. Test on different GPU types
2. Verify driver compatibility
3. Test fallback rendering modes
4. Check error handling

**Expected Behavior:**
- Works on common GPUs
- Graceful fallbacks
- Clear error messages
- Performance appropriate for hardware

---

### 1.5 Scene Hierarchy System

#### Test 63: Create/delete entities ✅ **IMPLEMENTED**

**Objective:** Test basic entity operations

**Steps:**
1. Right-click in hierarchy panel → "Add Entity"
2. Entity created with default Transform component
3. Rename entity by double-clicking name
4. Delete entities using Delete key with confirmation dialog
5. Test entity active/inactive toggles

**Current Behavior:**
- ✅ Entities create immediately with "Add Entity" context menu
- ✅ Default naming works ("Entity", "Entity 1", etc.)
- ✅ Deletion removes from scene with confirmation dialog
- ✅ Transform component automatically added
- ⏳ Undo/redo planned for Phase 9

#### Test 64: Drag and drop reparenting ✅ **IMPLEMENTED**

**Objective:** Test hierarchy manipulation

**Steps:**
1. Create parent and child entities
2. Drag child to different parent
3. Drag to root level
4. Test reparenting operations

**Current Behavior:**
- ✅ Drag and drop reparenting works
- ✅ Parent-child relationships established correctly
- ✅ Visual hierarchy updates immediately
- ✅ Entity children arrays updated properly
- ⏳ Transform inheritance planned for Phase 3

#### Test 65: Multi-selection operations ✅ **IMPLEMENTED**

**Objective:** Test selection system

**Steps:**
1. Select multiple entities with Ctrl+click
2. Test Shift+click for range selection
3. Perform delete operations on selection
4. Test selection visual feedback

**Current Behavior:**
- ✅ Multi-selection with Ctrl+click works
- ✅ Shift+click for range selection works
- ✅ Bulk delete operations work
- ✅ Clear visual indication with highlighting
- ⏳ Viewport selection planned for Phase 4

#### Test 66: Undo/redo for hierarchy changes ⏳ **PLANNED (Phase 9)**

**Objective:** Test operation history

**Steps:**
1. Perform various hierarchy operations
2. Use Ctrl+Z to undo changes
3. Use Ctrl+Y to redo changes
4. Test undo stack limits

**Implementation Status:**
- ⏳ Undo/redo system planned for Phase 9
- ✅ Current operations work without undo/redo
- ✅ Scene save/load provides basic recovery

#### Test 67: Copy/paste entities with components

**Objective:** Test entity duplication

**Steps:**
1. Create entity with components
2. Copy with Ctrl+C
3. Paste with Ctrl+V
4. Verify component data copied

**Expected Behavior:**
- Entities duplicate correctly
- All component data preserved
- Unique IDs generated
- References handled properly

#### Test 68: Node visibility toggles ✅ **IMPLEMENTED**

**Objective:** Test visibility system

**Steps:**
1. Toggle entity visibility in hierarchy using eye icon
2. Verify hierarchy visual updates
3. Test visibility state persistence
4. Test visibility with parent-child relationships

**Current Behavior:**
- ✅ Eye icon toggles visibility in hierarchy
- ✅ Visual indicators work (grayed out when hidden)
- ✅ Visibility state saved with scene
- ✅ Clear visual feedback in hierarchy panel
- ⏳ Viewport rendering updates planned for Phase 4

#### Test 69: Node locking functionality ✅ **IMPLEMENTED**

**Objective:** Test entity protection

**Steps:**
1. Lock entities in hierarchy using lock icon
2. Try to delete or modify locked entities
3. Test lock state persistence
4. Verify lock visual indicators

**Current Behavior:**
- ✅ Lock icon toggles entity lock state
- ✅ Visual indicators work (lock icon visible when locked)
- ✅ Lock state saved with scene
- ✅ Clear visual feedback in hierarchy panel
- ⏳ Full modification prevention planned for Phase 3

#### Test 70: Node search and filtering ⏳ **PLANNED**

**Objective:** Test hierarchy navigation aids

**Steps:**
1. Use search box in hierarchy
2. Filter by entity type
3. Filter by component type
4. Test search with large hierarchies

**Implementation Status:**
- ⏳ Search and filtering UI planned for future enhancement
- ✅ Basic hierarchy navigation works
- ✅ Manual entity location by scrolling
- ✅ Entity naming helps with organization

#### Test 71: Bulk operations on selected nodes

**Objective:** Test mass operations

**Steps:**
1. Select many entities
2. Add component to all
3. Change property on all
4. Delete selection

**Expected Behavior:**
- Operations apply to all selected
- Performance remains acceptable
- Undo/redo works with bulk ops
- Progress indication for slow ops

#### Test 72: Hierarchy validation and repair

**Objective:** Test data integrity

**Steps:**
1. Create complex hierarchy
2. Simulate data corruption
3. Test validation system
4. Try repair functionality

**Expected Behavior:**
- Validation detects issues
- Clear error reporting
- Repair functionality available
- Data recovery possible

#### Test 71: Bulk operations on selected nodes ✅ **PARTIALLY IMPLEMENTED**

**Objective:** Test mass operations

**Steps:**
1. Select multiple entities with Ctrl+click
2. Delete multiple entities at once
3. Test bulk property changes
4. Test performance with large selections

**Current Behavior:**
- ✅ Multi-selection works with Ctrl+click and Shift+click
- ✅ Bulk delete operations work with confirmation
- ✅ Performance acceptable with reasonable selections
- ⏳ Bulk property editing planned for future implementation

#### Test 72: Hierarchy validation and repair ✅ **IMPLEMENTED**

**Objective:** Test data integrity

**Steps:**
1. Create complex hierarchy with parent-child relationships
2. Save and load scene file
3. Test scene validation system
4. Verify error handling for corrupt data

**Current Behavior:**
- ✅ Scene validation detects structural issues
- ✅ Parent-child relationship integrity maintained
- ✅ Clear error reporting in console
- ✅ Scene loading fails gracefully with validation errors
- ✅ Entity ID uniqueness enforced

### Scene File Tests (73-77)

#### Test 73: Save/load scene files (.scene.json) ✅ **IMPLEMENTED**

**Objective:** Test scene persistence

**Steps:**
1. Create scene with File → New Scene
2. Add entities and modify hierarchy
3. Save scene with File → Save Scene (Ctrl+S)
4. Create new scene and load the saved scene

**Commands:**
```bash
# Verify scene file structure
cat MyScene.scene.json | jq .
```

**Current Behavior:**
- ✅ Scene saves completely to .scene.json format
- ✅ Loading restores scene exactly with all entities
- ✅ JSON format is human-readable and well-structured
- ✅ Performance acceptable for typical scenes
- ✅ Scene validation on load prevents corruption

#### Test 74: Scene file versioning ✅ **IMPLEMENTED**

**Objective:** Test format compatibility

**Steps:**
1. Save scene in current version (worldenv-scene v1.0.0)
2. Verify version field in scene file
3. Test scene format validation
4. Check version compatibility handling

**Current Behavior:**
- ✅ Version field included in all scene files ("version": "1.0.0")
- ✅ Format field identifies file type ("format": "worldenv-scene")
- ✅ Scene validation checks format compatibility
- ✅ Clear error messages for unsupported versions
- ⏳ Migration system planned for future version updates

#### Test 75: Scene merging capabilities ⏳ **PLANNED**

**Objective:** Test scene combination

**Steps:**
1. Create two different scenes
2. Merge scenes together
3. Handle naming conflicts
4. Verify all data imported

**Implementation Status:**
- ⏳ Scene merging planned for future implementation
- ✅ Individual scene save/load works
- ✅ Scene format supports entity imports
- ✅ Entity ID system ready for merge conflict resolution

#### Test 76: Large scene handling (10,000+ entities) ⏳ **PERFORMANCE TESTING NEEDED**

**Objective:** Test scalability limits

**Steps:**
1. Create scene with many entities (1000+)
2. Test hierarchy performance
3. Test save/load times
4. Monitor memory usage

**Current Status:**
- ⏳ Large scene testing planned for future implementation
- ✅ Basic entity creation and management works
- ✅ JSON format scales well
- ⏳ Performance optimizations planned for large hierarchies

**Objective:** Test scalability

**Setup:** Create very large scene

**Steps:**
1. Create scene with 10,000+ entities
2. Test saving performance
3. Test loading performance
4. Test hierarchy navigation

**Expected Behavior:**
- Acceptable save/load times
- Hierarchy remains responsive
- Memory usage reasonable
- Search/filter still works

#### Test 77: Scene corruption recovery

**Objective:** Test robustness

**Steps:**
1. Corrupt scene file manually
2. Try to load corrupted scene
3. Test recovery mechanisms
4. Verify backup systems

**Expected Behavior:**
- Corruption detected gracefully
- Recovery options presented
- Backup systems work
- Minimal data loss

---

### 1.6 Component System

#### Test 78: Transform component functionality

**Objective:** Test core transform system

**Steps:**
1. Create entity with transform
2. Modify position, rotation, scale
3. Test transform hierarchy
4. Verify gizmo interaction

**Expected Behavior:**
- Transform values update correctly
- Hierarchy inheritance works
- Gizmos reflect values
- Numeric input precision

#### Test 79: Render component (2D/3D)

**Objective:** Test rendering components

**Steps:**
1. Add sprite renderer (2D)
2. Add mesh renderer (3D)
3. Configure rendering properties
4. Test material assignment

**Expected Behavior:**
- Components render correctly
- Properties affect rendering
- Material system works
- Performance acceptable

#### Test 80: Physics components (RigidBody, Collider)

**Objective:** Test physics integration

**Steps:**
1. Add RigidBody component
2. Add Collider component
3. Test physics simulation
4. Verify collision detection

**Expected Behavior:**
- Physics simulation accurate
- Collision detection works
- Performance acceptable
- Debug visualization available

#### Test 81: Audio components (Source, Listener)

**Objective:** Test audio system

**Steps:**
1. Add AudioSource component
2. Add AudioListener component
3. Test 3D positional audio
4. Test audio playback

**Expected Behavior:**
- Audio plays correctly
- Positional audio works
- Performance not affected
- Audio controls responsive

#### Test 82: Script component integration

**Objective:** Test script system

**Steps:**
1. Add Script component
2. Assign WORLDC script
3. Test script execution
4. Verify component interaction

**Expected Behavior:**
- Scripts execute correctly
- Component access works
- Error handling graceful
- Debugging support available

### Component Operations Tests (83-87)

#### Test 83: Add/remove components from entities

**Objective:** Test component management

**Steps:**
1. Use Add Component button
2. Browse component categories
3. Add various components
4. Remove components

**Expected Behavior:**
- Component browser works
- Components add successfully
- Removal cleans up properly
- Dependencies handled

#### Test 84: Component property editing

**Objective:** Test property system

**Steps:**
1. Select entity with components
2. Edit various property types
3. Test immediate vs. deferred updates
4. Verify validation

**Expected Behavior:**
- All property types editable
- Updates apply appropriately
- Validation prevents errors
- Undo/redo works

#### Test 85: Component validation and error handling

**Objective:** Test error handling

**Steps:**
1. Enter invalid property values
2. Create dependency conflicts
3. Test missing references
4. Verify error reporting

**Expected Behavior:**
- Invalid values rejected
- Clear error messages
- Conflicts detected
- Recovery options provided

#### Test 86: Component dependencies management

**Objective:** Test dependency system

**Steps:**
1. Add components with dependencies
2. Try to remove required components
3. Test dependency resolution
4. Verify warning systems

**Expected Behavior:**
- Dependencies enforced
- Clear dependency warnings
- Automatic resolution when possible
- User control maintained

#### Test 87: Component copy/paste between entities

**Objective:** Test component transfer

**Steps:**
1. Copy component from one entity
2. Paste to another entity
3. Test multiple component copy
4. Verify data integrity

**Expected Behavior:**
- Components copy correctly
- Data preserved accurately
- References updated appropriately
- Performance acceptable

### Inspector Panel Tests (88-92)

#### Test 88: Real-time property updates

**Objective:** Test live property editing

**Steps:**
1. Edit properties while in play mode
2. Test immediate visual feedback
3. Verify performance impact
4. Test with complex scenes

**Expected Behavior:**
- Updates apply immediately
- Visual feedback instant
- Performance remains good
- No visual artifacts

#### Test 89: Property validation and constraints

**Objective:** Test property limits

**Steps:**
1. Test numeric ranges
2. Test required fields
3. Test format validation
4. Test custom validators

**Expected Behavior:**
- Validation enforced consistently
- Clear constraint feedback
- Prevents invalid states
- User guidance provided

#### Test 90: Custom property editors

**Objective:** Test specialized editors

**Steps:**
1. Test color picker
2. Test vector editors
3. Test curve editors
4. Test asset pickers

**Expected Behavior:**
- Specialized editors available
- Intuitive interaction
- Accurate value setting
- Good visual design

#### Test 91: Component help documentation

**Objective:** Test documentation integration

**Steps:**
1. Access component help
2. Verify documentation quality
3. Test context-sensitive help
4. Check example code

**Expected Behavior:**
- Help easily accessible
- Documentation comprehensive
- Examples work correctly
- Context appropriate

#### Test 92: Bulk property editing

**Objective:** Test multi-entity editing

**Steps:**
1. Select multiple entities
2. Edit shared properties
3. Verify changes apply to all
4. Test mixed value handling

**Expected Behavior:**
- Bulk editing works correctly
- Mixed values shown clearly
- Changes apply appropriately
- Performance acceptable

---

### 1.7 Asset Management

#### Test 93: File explorer functionality

**Objective:** Test asset browser navigation

**Steps:**
1. Navigate folder structure
2. Test folder creation/deletion
3. Test file sorting options
4. Test view modes (list/grid)

**Expected Behavior:**
- Smooth navigation
- Folder operations work
- Sorting functions correctly
- View modes appropriate

#### Test 94: Asset preview generation

**Objective:** Test preview system

**Steps:**
1. Import various asset types
2. Verify preview generation
3. Test preview quality
4. Test preview performance

**Expected Behavior:**
- Previews generate automatically
- Good preview quality
- Reasonable generation time
- Previews update when assets change

#### Test 95: Asset search and filtering

**Objective:** Test asset discovery

**Steps:**
1. Search for assets by name
2. Filter by asset type
3. Filter by properties
4. Test search performance

**Expected Behavior:**
- Search finds assets quickly
- Filters work correctly
- Search is comprehensive
- Performance acceptable

#### Test 96: Asset metadata display

**Objective:** Test asset information

**Steps:**
1. Select various assets
2. View asset properties
3. Check file information
4. Verify dependency info

**Expected Behavior:**
- Complete metadata shown
- Information accurate
- Dependencies tracked
- Performance acceptable

#### Test 97: Asset organization (folders, tags)

**Objective:** Test asset management

**Steps:**
1. Create folder structure
2. Move assets between folders
3. Add tags to assets
4. Search by tags

**Expected Behavior:**
- Folder operations work
- Asset moving reliable
- Tagging system functional
- Tag-based search works

### Asset Import Tests (98-102)

#### Test 98: Image import (PNG, JPG, GIF, WebP)

**Objective:** Test image asset support

**Setup:** Prepare test images in various formats

**Steps:**
1. Import PNG files
2. Import JPG files
3. Import GIF files
4. Import WebP files

**Expected Behavior:**
- All formats import correctly
- Image quality preserved
- Metadata extracted
- Previews generated

**Commands:**
```bash
# Prepare test images
mkdir test-assets/images
# Copy various format images to test folder
```

#### Test 99: 3D model import (GLTF, OBJ, FBX)

**Objective:** Test 3D model support

**Setup:** Prepare test 3D models

**Steps:**
1. Import GLTF files
2. Import OBJ files
3. Import FBX files (if supported)
4. Verify model display

**Expected Behavior:**
- Models import correctly
- Geometry preserved
- Materials imported
- Animations supported

#### Test 100: Audio import (MP3, WAV, OGG)

**Objective:** Test audio asset support

**Steps:**
1. Import MP3 files
2. Import WAV files
3. Import OGG files
4. Test audio playback

**Expected Behavior:**
- Audio files import correctly
- Playback works in editor
- Metadata preserved
- Performance acceptable

#### Test 101: Font import (TTF, WOFF)

**Objective:** Test font asset support

**Steps:**
1. Import TTF fonts
2. Import WOFF fonts
3. Test font usage in UI
4. Verify text rendering

**Expected Behavior:**
- Fonts import correctly
- Available for text components
- Rendering quality good
- Performance acceptable

#### Test 102: Batch import operations

**Objective:** Test mass import

**Steps:**
1. Select multiple files
2. Drag into asset browser
3. Monitor import progress
4. Verify all imports successful

**Expected Behavior:**
- Batch import works reliably
- Progress indication provided
- Error handling for failed imports
- Performance acceptable

### Asset Processing Tests (103-107)

#### Test 103: Automatic optimization

**Objective:** Test asset processing

**Steps:**
1. Import large assets
2. Verify optimization applied
3. Check file size reduction
4. Verify quality maintenance

**Expected Behavior:**
- Optimization applied automatically
- Significant size reduction
- Quality acceptable
- Settings configurable

#### Test 104: Thumbnail generation

**Objective:** Test thumbnail system

**Steps:**
1. Import various asset types
2. Verify thumbnails generated
3. Test thumbnail quality
4. Test generation performance

**Expected Behavior:**
- Thumbnails for all asset types
- Good thumbnail quality
- Quick generation
- Thumbnails cache properly

#### Test 105: Asset validation

**Objective:** Test asset integrity checking

**Steps:**
1. Import corrupted assets
2. Import unsupported formats
3. Test validation feedback
4. Verify error handling

**Expected Behavior:**
- Validation detects issues
- Clear error messages
- Graceful handling
- Recovery suggestions

#### Test 106: Dependency tracking

**Objective:** Test asset relationship management

**Steps:**
1. Use assets in scenes
2. Check dependency lists
3. Test dependency updates
4. Test missing asset handling

**Expected Behavior:**
- Dependencies tracked accurately
- Updates propagate correctly
- Missing assets detected
- Clear dependency visualization

#### Test 107: Asset usage reporting

**Objective:** Test asset utilization tracking

**Steps:**
1. Use assets in various contexts
2. Generate usage reports
3. Identify unused assets
4. Test cleanup suggestions

**Expected Behavior:**
- Accurate usage tracking
- Comprehensive reports
- Unused asset identification
- Safe cleanup options

---

### 1.8 Script Editor

#### Test 108: TypeScript syntax highlighting

**Objective:** Test TypeScript language support

**Steps:**
1. Create new TypeScript file
2. Write TypeScript code
3. Verify syntax highlighting
4. Test error highlighting

**Expected Behavior:**
- Proper syntax highlighting
- TypeScript-specific features highlighted
- Error highlighting accurate
- Good color scheme

#### Test 109: WORLDC syntax highlighting

**Objective:** Test WORLDC language support

**Steps:**
1. Create new WORLDC file
2. Write WORLDC code
3. Verify syntax highlighting
4. Test mixed-language support

**Expected Behavior:**
- WORLDC syntax highlighted correctly
- C/C++ features highlighted
- TypeScript features highlighted
- Mixed syntax handled well

#### Test 110: Auto-completion functionality

**Objective:** Test IntelliSense system

**Steps:**
1. Type partial code
2. Trigger auto-completion (Ctrl+Space)
3. Test completion suggestions
4. Test parameter hints

**Expected Behavior:**
- Relevant suggestions provided
- Context-aware completions
- API documentation shown
- Keyboard navigation works

#### Test 111: Error detection and reporting

**Objective:** Test language server integration

**Steps:**
1. Write code with syntax errors
2. Write code with type errors
3. Test error reporting
4. Test error navigation

**Expected Behavior:**
- Errors detected quickly
- Clear error messages
- Error location accurate
- Quick fixes available

#### Test 112: Code formatting and linting

**Objective:** Test code quality tools

**Steps:**
1. Write unformatted code
2. Use format command
3. Test linting rules
4. Test auto-formatting

**Expected Behavior:**
- Formatting works correctly
- Consistent code style
- Linting rules enforced
- Auto-formatting available

### Script Management Tests (113-117)

#### Test 113: Create/edit/delete scripts

**Objective:** Test script file management

**Steps:**
1. Create new script file
2. Edit existing script
3. Rename script file
4. Delete script file

**Expected Behavior:**
- File operations work reliably
- Changes save correctly
- References update automatically
- Deletion removes cleanly

#### Test 114: Script templates and snippets

**Objective:** Test code generation aids

**Steps:**
1. Access script templates
2. Create from template
3. Use code snippets
4. Test custom templates

**Expected Behavior:**
- Templates available and functional
- Snippets work correctly
- Customization possible
- Good variety of templates

#### Test 115: Script search and navigation

**Objective:** Test code navigation

**Steps:**
1. Search within files
2. Search across project
3. Navigate to definitions
4. Use symbol navigation

**Expected Behavior:**
- Search works accurately
- Navigation responsive
- Symbol list comprehensive
- Cross-file navigation works

#### Test 116: Multiple file editing

**Objective:** Test multi-file support

**Steps:**
1. Open multiple script files
2. Edit in different tabs
3. Test tab management
4. Test split view

**Expected Behavior:**
- Multiple files open correctly
- Tab switching smooth
- Split view functional
- No interference between files

#### Test 117: Script backup and recovery

**Objective:** Test data protection

**Steps:**
1. Make changes to scripts
2. Test auto-save functionality
3. Simulate crash recovery
4. Test version history

**Expected Behavior:**
- Auto-save works reliably
- Recovery after crash
- Change history available
- No data loss

### Integration Features Tests (118-122)

#### Test 118: Hot-reload during development

**Objective:** Test live code updates

**Steps:**
1. Enter play mode
2. Modify script code
3. Save changes
4. Verify immediate updates

**Expected Behavior:**
- Changes apply immediately
- No restart required
- State preservation when possible
- Error handling during reload

#### Test 119: Debugging support

**Objective:** Test debugging capabilities

**Steps:**
1. Set breakpoints in code
2. Run in debug mode
3. Step through code
4. Inspect variables

**Expected Behavior:**
- Breakpoints work correctly
- Step controls responsive
- Variable inspection accurate
- Debug performance acceptable

#### Test 120: Console output integration

**Objective:** Test console system

**Steps:**
1. Use console.log in scripts
2. Check console panel
3. Test different log levels
4. Test console commands

**Expected Behavior:**
- Console output appears correctly
- Log levels distinguished
- Console interactive
- Performance not affected

#### Test 121: Performance profiling

**Objective:** Test profiling tools

**Steps:**
1. Run performance profiler
2. Analyze script performance
3. Identify bottlenecks
4. Test optimization suggestions

**Expected Behavior:**
- Profiler works accurately
- Clear performance data
- Bottlenecks identified
- Actionable suggestions

#### Test 122: Script documentation generation

**Objective:** Test documentation tools

**Steps:**
1. Write documented code
2. Generate documentation
3. Verify output quality
4. Test documentation updates

**Expected Behavior:**
- Documentation generated correctly
- Good formatting and organization
- Updates with code changes
- Export options available

---

### 1.9 Build System

#### Test 123: Build settings dialog

**Objective:** Test build configuration interface

**Steps:**
1. Open build settings
2. Navigate through options
3. Modify settings
4. Save configuration

**Expected Behavior:**
- Settings dialog opens correctly
- All options accessible
- Changes save properly
- Validation prevents errors

#### Test 124: Platform target selection

**Objective:** Test multi-platform support

**Steps:**
1. Switch between platform targets
2. Verify platform-specific options
3. Test target validation
4. Check requirements

**Expected Behavior:**
- Platform switching works
- Options update for platform
- Validation catches issues
- Requirements clearly stated

#### Test 125: Optimization level settings

**Objective:** Test build optimization

**Steps:**
1. Test different optimization levels
2. Compare build outputs
3. Verify performance impact
4. Test debug vs. release

**Expected Behavior:**
- Optimization levels work correctly
- Clear performance differences
- Debug info preserved when needed
- Build size varies appropriately

#### Test 126: Asset processing options

**Objective:** Test asset build pipeline

**Steps:**
1. Configure asset processing
2. Test different compression levels
3. Test format conversions
4. Verify output quality

**Expected Behavior:**
- Asset processing configurable
- Compression works effectively
- Format conversion accurate
- Quality acceptable

#### Test 127: Output directory configuration

**Objective:** Test build output management

**Steps:**
1. Configure output directory
2. Test directory creation
3. Verify output organization
4. Test cleanup options

**Expected Behavior:**
- Directory configuration works
- Output properly organized
- Cleanup options functional
- Path validation works

### Build Process Tests (128-132)

#### Test 128: Incremental builds

**Objective:** Test build optimization

**Steps:**
1. Perform full build
2. Make small changes
3. Perform incremental build
4. Verify build time improvement

**Expected Behavior:**
- Incremental builds much faster
- Only changed files processed
- Dependencies tracked correctly
- Output remains correct

#### Test 129: Build progress reporting

**Objective:** Test build feedback

**Steps:**
1. Start large build
2. Monitor progress reporting
3. Test progress accuracy
4. Test build cancellation

**Expected Behavior:**
- Progress reported accurately
- Clear indication of current step
- Cancellation works immediately
- Time estimates reasonable

#### Test 130: Error handling and recovery

**Objective:** Test build robustness

**Steps:**
1. Introduce build errors
2. Test error reporting
3. Fix errors and retry
4. Test partial recovery

**Expected Behavior:**
- Errors reported clearly
- Error locations accurate
- Recovery after fixes
- Partial builds when possible

#### Test 131: Build cancellation

**Objective:** Test build control

**Steps:**
1. Start long build process
2. Cancel build mid-process
3. Verify clean cancellation
4. Test restart after cancel

**Expected Behavior:**
- Cancellation immediate
- Clean process termination
- No corrupted outputs
- Restart works correctly

#### Test 132: Build artifact validation

**Objective:** Test output verification

**Steps:**
1. Complete build process
2. Verify all expected outputs
3. Test output integrity
4. Validate file formats

**Expected Behavior:**
- All expected files generated
- File integrity maintained
- Formats correct
- Validation catches issues

### Build Outputs Tests (133-137)

#### Test 133: Web deployment package

**Objective:** Test web build output

**Steps:**
1. Build for web platform
2. Verify HTML/CSS/JS files
3. Test in web browser
4. Check asset loading

**Commands:**
```bash
# Test web build
cd build/web
python -m http.server 8000
# Open http://localhost:8000
```

**Expected Behavior:**
- Complete web package generated
- Assets load correctly
- Game runs in browser
- Performance acceptable

#### Test 134: Desktop application package

**Objective:** Test desktop build output

**Steps:**
1. Build for desktop platform
2. Test executable generation
3. Verify dependencies included
4. Test on target platform

**Expected Behavior:**
- Executable runs correctly
- All dependencies included
- Platform integration works
- Installation not required

#### Test 135: Progressive Web App package

**Objective:** Test PWA build output

**Steps:**
1. Build for PWA platform
2. Test service worker
3. Verify manifest file
4. Test offline functionality

**Expected Behavior:**
- PWA installable
- Offline functionality works
- Service worker functions
- Manifest correct

#### Test 136: Development builds

**Objective:** Test debug build output

**Steps:**
1. Build in development mode
2. Verify debug symbols
3. Test debugging capabilities
4. Check performance impact

**Expected Behavior:**
- Debug symbols included
- Debugging works correctly
- Source maps accurate
- Performance impact acceptable

#### Test 137: Distribution packages

**Objective:** Test release packaging

**Steps:**
1. Build distribution packages
2. Test installer generation
3. Verify package integrity
4. Test installation process

**Expected Behavior:**
- Distribution packages complete
- Installers work correctly
- Digital signatures valid
- Installation smooth

---

## II. WORLDC Language Testing

### 2.1 Language Foundation

#### Test 138: C/C++ syntax compatibility

**Objective:** Verify C/C++ syntax support in WORLDC

**Setup:** Create test WORLDC file

**Steps:**
1. Write C-style code (structs, functions)
2. Write C++ style code (classes, templates)
3. Test compilation
4. Verify output correctness

**Test Code:**
```worldc
// Test C syntax
struct Point {
    float x, y;
};

void test_c_syntax() {
    struct Point p = {1.0f, 2.0f};
    printf("Point: %.1f, %.1f\n", p.x, p.y);
}

// Test C++ syntax  
class GameObject {
private:
    Vector3 position;
public:
    GameObject(Vector3 pos) : position(pos) {}
    Vector3 getPosition() const { return position; }
};
```

**Expected Behavior:**
- C syntax compiles correctly
- C++ syntax works properly
- Mixed syntax supported
- Output matches expectations

#### Test 139: TypeScript syntax integration

**Objective:** Test TypeScript features in WORLDC

**Steps:**
1. Use TypeScript type annotations
2. Test interface definitions
3. Use TypeScript-specific features
4. Verify compilation output

**Test Code:**
```worldc
// TypeScript syntax
interface IComponent {
    update(deltaTime: number): void;
    render(): void;
}

class PlayerController implements IComponent {
    private speed: number = 200;
    
    update(deltaTime: number): void {
        // Update logic
    }
    
    render(): void {
        // Render logic
    }
}
```

**Expected Behavior:**
- TypeScript syntax supported
- Type checking works
- Interfaces compile correctly
- Generated output is valid

#### Test 140: Mixed-language constructs

**Objective:** Test hybrid C/C++/TypeScript features

**Steps:**
1. Mix different syntax styles
2. Test interoperability
3. Verify compilation success
4. Test runtime behavior

**Test Code:**
```worldc
#include <stdio.h>

// C struct
struct GameState {
    int score;
    bool gameOver;
};

// TypeScript class
class Player implements IMovable {
    position: vec3;
    velocity: vec3;
    
    move(direction: vec3): void {
        this.velocity = direction;
    }
}

// Mixed usage
function updateGame(state: GameState, player: Player): void {
    if (!state.gameOver) {
        player.move(vec3(1, 0, 0));
        state.score += 10;
    }
}
```

**Expected Behavior:**
- All syntax types compile together
- Type checking works across languages
- Runtime behavior is correct
- No syntax conflicts

#### Test 141: WORLDC simplified verbiage

**Objective:** Test WORLDC-specific simplified syntax keywords

**Steps:**
1. Test `edict` keyword for constants
2. Test `pass` statement for no-ops
3. Test `invoke` for explicit function calls
4. Verify compilation and behavior

**Test Code:**
```worldc
// Test edict (constant declaration)
edict float GRAVITY = 9.81f;
edict int MAX_PLAYERS = 4;
edict string GAME_TITLE = "My Game";

// Test pass statement
function handleError(errorCode: int): void {
    switch (errorCode) {
        case 0:
            pass;  // Do nothing for success
            break;
        case 1:
            printf("Warning: Minor error\n");
            break;
        default:
            printf("Error: Unknown error code\n");
            break;
    }
}

// Test invoke syntax
function main(): int {
    invoke printf("Starting game...\n");
    invoke handleError(0);
    
    // Traditional calls still work
    printf("Game initialized\n");
    
    // invoke with complex expressions
    invoke updatePlayer(getPlayer(), getDeltaTime());
    
    return 0;
}

// Helper functions for testing
function getPlayer(): Player { return new Player(); }
function getDeltaTime(): float { return 0.016f; }
function updatePlayer(player: Player, dt: float): void {
    pass;  // No-op implementation
}
```

**Expected Behavior:**
- `edict` creates immutable constants
- `pass` compiles as no-operation
- `invoke` calls functions explicitly
- Mixed syntax works seamlessly
- All keywords generate proper code

#### Test 142: Simplified verbiage integration

**Objective:** Test simplified verbiage with other language features

**Steps:**
1. Mix simplified verbiage with C/C++/TypeScript
2. Test in various contexts (classes, functions, loops)
3. Verify semantic equivalence
4. Check generated output

**Test Code:**
```worldc
class GameEngine {
    edict float TARGET_FPS = 60.0f;
    
    private running: bool = true;
    
    start(): void {
        invoke this.initialize();
        
        while (this.running) {
            invoke this.update();
            invoke this.render();
            
            if (this.shouldExit()) {
                this.running = false;
            } else {
                pass;  // Continue running
            }
        }
        
        invoke this.shutdown();
    }
    
    private initialize(): void {
        pass;  // Initialization logic would go here
    }
    
    private update(): void {
        pass;  // Update logic
    }
    
    private render(): void {
        pass;  // Render logic
    }
    
    private shouldExit(): bool {
        return false;  // Simple implementation
    }
    
    private shutdown(): void {
        invoke printf("Engine shutting down...\n");
    }
}

// C++ class with TypeScript annotations
class GameManager {
private:
    gameState: GameState;
    
public:
    GameManager() {
        gameState = {0, false};
    }
    
    updateScore(points: number): void {
        gameState.score += points;
        printf("Score: %d\n", gameState.score);
    }
}
```

**Expected Behavior:**
- Mixed syntax compiles successfully
- All language features work together
- No conflicts between syntax styles
- Runtime behavior correct

#### Test 143: Preprocessor directives

**Objective:** Test C-style preprocessor support

**Steps:**
1. Use #include directives
2. Test #define macros
3. Use conditional compilation
4. Test macro expansion

**Test Code:**
```worldc
#include <worldenv.h>
#include "custom_header.h"

#define MAX_ENTITIES 1000
#define SQUARE(x) ((x) * (x))

#ifdef DEBUG
    #define LOG(msg) console.log(msg)
#else
    #define LOG(msg)
#endif

void test_preprocessor() {
    int maxCount = MAX_ENTITIES;
    int squared = SQUARE(5);
    LOG("Preprocessor test");
}
```

**Expected Behavior:**
- Includes work correctly
- Macros expand properly
- Conditional compilation functions
- No preprocessor errors

#### Test 144: Comment styles (// and /* */)

**Objective:** Test comment support

**Steps:**
1. Use single-line comments
2. Use multi-line comments
3. Test nested comments
4. Verify comment preservation

**Test Code:**
```worldc
// Single-line comment
int value = 42; // End-of-line comment

/*
 * Multi-line comment
 * with multiple lines
 */

/* Inline comment */ int another = 0;

// TODO: This is a todo comment
/* NOTE: This is a note comment */
```

**Expected Behavior:**
- All comment styles supported
- Comments don't affect compilation
- Documentation comments preserved
- Syntax highlighting correct

### Type System Tests (145-150)

#### Test 145: Primitive types (int, float, char, bool)

**Objective:** Test basic data types

**Steps:**
1. Declare variables of each type
2. Test type operations
3. Verify type checking
4. Test type conversions

**Test Code:**
```worldc
void test_primitives() {
    int intValue = 42;
    float floatValue = 3.14f;
    char charValue = 'A';
    bool boolValue = true;
    
    // Test operations
    int sum = intValue + 10;
    float product = floatValue * 2.0f;
    bool result = boolValue && true;
    
    // Test conversions
    float converted = (float)intValue;
    int truncated = (int)floatValue;
}
```

**Expected Behavior:**
- All primitive types supported
- Operations work correctly
- Type checking enforced
- Conversions function properly

#### Test 146: Complex types (struct, class, interface)
#### Test 147: Array and vector types

**Objective:** Test array and collection types

**Steps:**
1. Test C-style arrays
2. Test dynamic arrays/vectors
3. Test multidimensional arrays
4. Test array operations

**Test Code:**
```worldc
void test_arrays() {
    // C-style arrays
    int numbers[10];
    float matrix[4][4];
    
    // Dynamic arrays
    vector<int> dynamicNumbers;
    vector<GameObject*> entities;
    
    // Array operations
    numbers[0] = 42;
    dynamicNumbers.push_back(100);
    int size = dynamicNumbers.size();
    
    // Array iteration
    for (int i = 0; i < 10; i++) {
        numbers[i] = i * 2;
    }
}
```

**Expected Behavior:**
- Both static and dynamic arrays work
- Array bounds checking available
- Standard array operations supported
- Memory management handled correctly

#### Test 148: Function types and signatures

**Objective:** Test function declaration and typing

**Steps:**
1. Test function declarations
2. Test function pointers
3. Test lambda expressions
4. Test function overloading

**Test Code:**
```worldc
// Function declarations
int add(int a, int b);
float calculate(float x, float y, char operation);

// Function pointers
typedef int (*MathFunction)(int, int);
MathFunction operation = add;

// Lambda expressions
auto multiply = [](int a, int b) -> int {
    return a * b;
};

// Function overloading
void process(int value);
void process(float value);
void process(string value);
```

**Expected Behavior:**
- Function signatures parsed correctly
- Function pointers work
- Lambda expressions supported
- Overloading resolution works

#### Test 149: Generic type parameters

**Objective:** Test template/generic system

**Steps:**
1. Test template functions
2. Test template classes
3. Test type constraints
4. Test template instantiation

**Test Code:**
```worldc
// Template function
template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

// Template class
template<typename T>
class Container {
private:
    vector<T> items;
    
public:
    void add(T item) { items.push_back(item); }
    T get(int index) { return items[index]; }
    int size() const { return items.size(); }
};

// Usage
Container<int> numbers;
Container<string> names;
```

**Expected Behavior:**
- Templates compile correctly
- Type substitution works
- Template specialization available
- Good error messages for constraints

#### Test 150: Type inference and checking

**Objective:** Test automatic type deduction

**Steps:**
1. Test auto keyword
2. Test type inference
3. Test type checking errors
4. Test implicit conversions

**Test Code:**
```worldc
void test_type_inference() {
    // Auto type deduction
    auto value = 42;           // int
    auto pi = 3.14f;          // float
    auto name = "Player";      // string
    
    // Type checking
    int number = 100;
    // float result = number / "text"; // Should error
    
    // Valid conversions
    float converted = number;  // int to float
    
    // Template type deduction
    auto result = maximum(10, 20);  // T = int
}
```

**Expected Behavior:**
- Auto keyword works correctly
- Type inference accurate
- Type errors caught at compile time
- Implicit conversions allowed where safe

### Standard Library Tests (151-156)

#### Test 151: stdio.h equivalents

**Objective:** Test standard I/O functionality

**Steps:**
1. Test printf-style output
2. Test console logging
3. Test file I/O operations
4. Test formatted input/output

**Test Code:**
```worldc
#include <worldenv.h>

void test_stdio() {
    // Console output
    printf("Hello, %s!\n", "World");
    console.log("Debug message");
    console.warn("Warning message");
    console.error("Error message");
    
    // Formatted output
    int score = 1500;
    float time = 65.5f;
    printf("Score: %d, Time: %.1f seconds\n", score, time);
    
    // File operations (if supported)
    // FILE* file = fopen("data.txt", "w");
    // fprintf(file, "Game data\n");
    // fclose(file);
}
```

**Expected Behavior:**
- Console output works correctly
- Formatted output functions properly
- Different log levels distinguished
- File I/O operations available

#### Test 152: stdlib.h equivalents

**Objective:** Test standard library functions

**Steps:**
1. Test memory allocation
2. Test string conversion
3. Test random number generation
4. Test utility functions

**Test Code:**
```worldc
void test_stdlib() {
    // Memory allocation
    int* numbers = (int*)malloc(10 * sizeof(int));
    if (numbers != nullptr) {
        // Use allocated memory
        free(numbers);
    }
    
    // String conversion
    string numberStr = "123";
    int converted = atoi(numberStr.c_str());
    float floatVal = atof("3.14");
    
    // Random numbers
    srand(time(nullptr));
    int randomValue = rand() % 100;
    
    // Utility functions
    int absolute = abs(-42);
    float maximum = fmax(10.5f, 20.3f);
}
```

**Expected Behavior:**
- Memory management functions work
- String conversion accurate
- Random number generation functional
- Utility functions available

#### Test 153: string.h equivalents

**Objective:** Test string manipulation functions

**Steps:**
1. Test string copying
2. Test string comparison
3. Test string searching
4. Test string manipulation

**Test Code:**
```worldc
void test_strings() {
    char buffer[100];
    const char* source = "Hello, World!";
    
    // String copying
    strcpy(buffer, source);
    strncpy(buffer, source, 5);
    
    // String comparison
    int result = strcmp("abc", "def");
    bool equal = (strcmp("test", "test") == 0);
    
    // String searching
    char* found = strstr(buffer, "World");
    char* character = strchr(buffer, 'W');
    
    // String manipulation
    strcat(buffer, " Extra text");
    size_t length = strlen(buffer);
}
```

**Expected Behavior:**
- String functions work correctly
- Buffer operations safe
- Search functions accurate
- String building supported

#### Test 154: math.h equivalents

**Objective:** Test mathematical functions

**Steps:**
1. Test trigonometric functions
2. Test logarithmic functions
3. Test power functions
4. Test utility math functions

**Test Code:**
```worldc
void test_math() {
    float angle = 45.0f * M_PI / 180.0f; // Convert to radians
    
    // Trigonometric functions
    float sine = sin(angle);
    float cosine = cos(angle);
    float tangent = tan(angle);
    
    // Power functions
    float power = pow(2.0f, 8.0f);      // 2^8
    float squareRoot = sqrt(64.0f);      // sqrt(64)
    
    // Logarithmic functions
    float natural = log(2.718f);         // ln(e)
    float base10 = log10(1000.0f);       // log10(1000)
    
    // Utility functions
    float rounded = round(3.7f);
    float ceiling = ceil(3.2f);
    float floor_val = floor(3.8f);
    float absolute = fabs(-5.5f);
}
```

**Expected Behavior:**
- Math functions accurate
- Trigonometric calculations correct
- Power and root functions work
- Precision acceptable for game use

#### Test 155: time.h equivalents

**Objective:** Test time and date functions

**Steps:**
1. Test current time retrieval
2. Test time formatting
3. Test time calculations
4. Test high-resolution timing

**Test Code:**
```worldc
void test_time() {
    // Current time
    time_t currentTime = time(nullptr);
    
    // Time formatting
    char timeString[100];
    struct tm* timeInfo = localtime(&currentTime);
    strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", timeInfo);
    
    // High-resolution timing
    clock_t start = clock();
    // ... some operation ...
    clock_t end = clock();
    double elapsed = ((double)(end - start)) / CLOCKS_PER_SEC;
    
    // Game timing
    float deltaTime = Time.deltaTime;
    float gameTime = Time.time;
    
    printf("Current time: %s\n", timeString);
    printf("Elapsed: %.3f seconds\n", elapsed);
}
```

**Expected Behavior:**
- Time functions work correctly
- Formatting produces readable output
- High-resolution timing available
- Game-specific time functions work

#### Test 156: WORLDC-specific libraries

**Objective:** Test game engine integration

**Steps:**
1. Test WORLDENV API access
2. Test game-specific functions
3. Test engine integration
4. Test performance helpers

**Test Code:**
```worldc
#include <worldenv.h>

void test_worldc_libs() {
    // Entity management
    Entity* player = Engine.createEntity("Player");
    Transform* transform = player->getComponent<Transform>();
    
    // Input handling
    if (Input.isKeyPressed(KeyCode.SPACE)) {
        player->jump();
    }
    
    // Audio system
    AudioManager.playSound("jump.wav");
    AudioManager.setMasterVolume(0.8f);
    
    // Physics integration
    RigidBody* rb = player->getComponent<RigidBody>();
    rb->addForce(Vector3(0, 500, 0));
    
    // Scene management
    Scene* currentScene = SceneManager.getActiveScene();
    SceneManager.loadScene("Level2");
    
    // Asset loading
    Texture* playerTexture = AssetManager.load<Texture>("player.png");
    Model* playerModel = AssetManager.load<Model>("player.gltf");
}
```

**Expected Behavior:**
- WORLDENV API accessible
- Game functions work correctly
- Engine integration seamless
- Performance appropriate

---

### 2.2 Compilation Pipeline

#### Test 157: Token recognition accuracy

**Objective:** Test lexical analysis

**Steps:**
1. Test with various code samples
2. Verify token identification
3. Test edge cases
4. Check error handling

**Commands:**
```bash
# Test WORLDC compiler directly
cd worldenv/worldc
echo 'int main() { return 0; }' > test.wc
npm run compile test.wc
```

**Expected Behavior:**
- All tokens recognized correctly
- No false positives
- Edge cases handled
- Clear error messages

#### Test 158: Error reporting for invalid tokens

**Objective:** Test lexer error handling

**Steps:**
1. Create files with invalid syntax
2. Test error reporting
3. Verify error locations
4. Check recovery behavior

**Test Code:**
```worldc
// Invalid tokens to test
int value = 123@#$;  // Invalid characters
float bad = 3.14.15; // Invalid number format
char invalid = 'ab'; // Invalid character literal
string broken = "unclosed string
```

**Expected Behavior:**
- Errors detected accurately
- Clear error messages
- Correct line/column information
- Graceful error recovery

#### Test 159: Comment and whitespace handling

**Objective:** Test comment processing

**Steps:**
1. Test various comment styles
2. Test nested comments
3. Test whitespace preservation
4. Test documentation comments

**Expected Behavior:**
- Comments ignored during compilation
- Whitespace handled correctly
- Documentation comments preserved
- No comment-related errors

#### Test 160: String and number literal parsing

**Objective:** Test literal value handling

**Steps:**
1. Test string literals with escapes
2. Test various number formats
3. Test character literals
4. Test special values

**Test Code:**
```worldc
void test_literals() {
    // String literals
    string simple = "Hello";
    string escaped = "Line 1\nLine 2\tTabbed";
    string quoted = "She said \"Hello\"";
    
    // Number literals
    int decimal = 42;
    int hex = 0xFF;
    int octal = 0755;
    int binary = 0b1010;
    
    float floatVal = 3.14f;
    double doubleVal = 2.718;
    
    // Character literals
    char letter = 'A';
    char escape = '\n';
    char unicode = '\u0041';
}
```

**Expected Behavior:**
- All literal formats supported
- Escape sequences work correctly
- Unicode support available
- Precision maintained

#### Test 161: Preprocessor integration

**Objective:** Test preprocessor functionality

**Steps:**
1. Test include directives
2. Test macro definitions
3. Test conditional compilation
4. Test preprocessor errors

**Expected Behavior:**
- Includes processed correctly
- Macros expand properly
- Conditional compilation works
- Preprocessor errors clear

### Parser Tests (162-166)

#### Test 162: AST generation correctness

**Objective:** Test abstract syntax tree creation

**Steps:**
1. Parse various code constructs
2. Verify AST structure
3. Test complex expressions
4. Validate tree accuracy

**Commands:**
```bash
# Test AST generation (if debugging available)
npm run compile -- --dump-ast test.wc
```

**Expected Behavior:**
- AST generated correctly
- All code structures represented
- Tree structure logical
- No information lost

#### Test 163: Syntax error detection and recovery

**Objective:** Test parser error handling

**Steps:**
1. Create syntax errors
2. Test error detection
3. Verify recovery behavior
4. Test multiple errors

**Test Code:**
```worldc
// Syntax errors to test
class TestClass {
    int value;
    // Missing semicolon
    
    void function(  // Missing closing parenthesis
        int param
    {  // Missing closing brace
        if (condition  // Missing closing parenthesis
            doSomething();
    }
```

**Expected Behavior:**
- Syntax errors detected
- Good error messages
- Parser recovery works
- Multiple errors reported

#### Test 164: Expression precedence handling

**Objective:** Test operator precedence

**Steps:**
1. Test complex expressions
2. Verify precedence rules
3. Test associativity
4. Test parentheses override

**Test Code:**
```worldc
void test_precedence() {
    // Test precedence
    int result1 = 2 + 3 * 4;        // Should be 14, not 20
    int result2 = (2 + 3) * 4;      // Should be 20
    
    // Test associativity
    int result3 = 16 / 4 / 2;       // Should be 2 (left-to-right)
    int result4 = 2 * 3 + 4;        // Should be 10
    
    // Test boolean precedence
    bool result5 = true || false && false;  // Should be true
    bool result6 = (true || false) && false; // Should be false
}
```

**Expected Behavior:**
- Precedence rules followed correctly
- Associativity handled properly
- Parentheses override precedence
- Results match expectations

#### Test 165: Statement parsing accuracy

**Objective:** Test statement recognition

**Steps:**
1. Test various statement types
2. Test nested statements
3. Test statement blocks
4. Test control flow statements

**Expected Behavior:**
- All statement types parsed
- Nesting handled correctly
- Block structure maintained
- Control flow accurate

#### Test 166: Function and class parsing

**Objective:** Test complex structure parsing

**Steps:**
1. Test function definitions
2. Test class declarations
3. Test inheritance
4. Test template definitions

**Expected Behavior:**
- Functions parsed completely
- Class structures correct
- Inheritance relationships maintained
- Templates handled properly

### Semantic Analysis Tests (167-171)

#### Test 167: Symbol table management

**Objective:** Test symbol tracking

**Steps:**
1. Test variable declarations
2. Test scope management
3. Test symbol lookup
4. Test name conflicts

**Expected Behavior:**
- All symbols tracked correctly
- Scope rules enforced
- Lookup works efficiently
- Conflicts detected

#### Test 168: Type checking and inference

**Objective:** Test type system

**Steps:**
1. Test type compatibility
2. Test type inference
3. Test type errors
4. Test implicit conversions

**Expected Behavior:**
- Type checking accurate
- Inference works correctly
- Type errors clear
- Safe conversions allowed

#### Test 169: Scope resolution

**Objective:** Test namespace handling

**Steps:**
1. Test local vs global scope
2. Test namespace resolution
3. Test nested scopes
4. Test scope shadowing

**Expected Behavior:**
- Scope rules correct
- Resolution unambiguous
- Nested scopes work
- Shadowing detected

#### Test 170: Function overload resolution

**Objective:** Test overloading system

**Steps:**
1. Test function overloads
2. Test operator overloads
3. Test resolution rules
4. Test ambiguity detection

**Expected Behavior:**
- Overloads resolved correctly
- Best match selected
- Ambiguity detected
- Clear error messages

#### Test 171: Template instantiation

**Objective:** Test template system

**Steps:**
1. Test template instantiation
2. Test template specialization
3. Test template constraints
4. Test error handling

**Expected Behavior:**
- Templates instantiate correctly
- Specialization works
- Constraints enforced
- Template errors clear

### Code Generation Tests (172-176)

#### Test 172: TypeScript output quality

**Objective:** Test TypeScript code generation

**Steps:**
1. Compile WORLDC to TypeScript
2. Verify output quality
3. Test generated code functionality
4. Check performance

**Commands:**
```bash
# Test TypeScript generation
npm run compile -- --target typescript test.wc
cat test.ts  # Examine generated TypeScript
```

**Expected Behavior:**
- Valid TypeScript generated
- Code structure preserved
- Performance acceptable
- Readable output

#### Test 173: AssemblyScript output quality

**Objective:** Test AssemblyScript generation

**Steps:**
1. Compile to AssemblyScript
2. Test WebAssembly compilation
3. Verify performance
4. Test functionality

**Commands:**
```bash
# Test AssemblyScript generation
npm run compile -- --target assemblyscript test.wc
```

**Expected Behavior:**
- Valid AssemblyScript generated
- WebAssembly compilation works
- Performance excellent
- Functionality preserved

#### Test 174: Source map generation

**Objective:** Test debugging support

**Steps:**
1. Generate source maps
2. Test debugging capability
3. Verify source mapping accuracy
4. Test with debugger

**Expected Behavior:**
- Source maps generated
- Debugging works correctly
- Line mapping accurate
- Variable mapping correct

#### Test 175: Optimization passes

**Objective:** Test code optimization

**Steps:**
1. Test optimization levels
2. Compare optimized output
3. Verify correctness
4. Measure performance impact

**Expected Behavior:**
- Optimizations improve performance
- Correctness maintained
- Good optimization choices
- Configurable optimization

#### Test 176: Platform-specific adaptations

**Objective:** Test target platform support

**Steps:**
1. Test web platform output
2. Test desktop platform output
3. Test mobile adaptations
4. Verify platform APIs

**Expected Behavior:**
- Platform-specific code generated
- APIs adapted correctly
- Performance optimized for platform
- Platform constraints respected

---

### 2.3 Runtime Integration

#### Test 177: WORLDENV API access

**Objective:** Test engine integration

**Steps:**
1. Test basic API calls
2. Test complex interactions
3. Verify API documentation
4. Test error handling

**Expected Behavior:**
- All APIs accessible
- Documentation accurate
- Error handling graceful
- Performance acceptable

#### Test 178: Component system integration

**Objective:** Test component access

**Steps:**
1. Test component creation
2. Test component access
3. Test component modification
4. Test component events

**Expected Behavior:**
- Component system fully accessible
- Modification works correctly
- Events fire properly
- Type safety maintained

#### Test 179: Event system integration

**Objective:** Test event handling

**Steps:**
1. Test event subscription
2. Test event dispatch
3. Test event parameters
4. Test event cleanup

**Expected Behavior:**
- Event system works correctly
- Parameters passed accurately
- Memory cleanup proper
- Performance acceptable

#### Test 180: Resource management

**Objective:** Test asset handling

**Steps:**
1. Test asset loading
2. Test asset caching
3. Test memory management
4. Test cleanup

**Expected Behavior:**
- Assets load correctly
- Caching improves performance
- Memory usage reasonable
- Cleanup prevents leaks

#### Test 181: Performance monitoring

**Objective:** Test profiling integration

**Steps:**
1. Test performance counters
2. Test profiling hooks
3. Test metrics collection
4. Test reporting

**Expected Behavior:**
- Monitoring works correctly
- Metrics accurate
- Low overhead
- Useful reporting

### JavaScript Interop Tests (182-186)

#### Test 182: TypeScript compatibility

**Objective:** Test TypeScript integration

**Steps:**
1. Test TypeScript imports
2. Test type definitions
3. Test compilation together
4. Test runtime interaction

**Expected Behavior:**
- Full TypeScript compatibility
- Type definitions accurate
- Compilation smooth
- Runtime behavior correct

#### Test 183: Module system integration

**Objective:** Test module support

**Steps:**
1. Test ES6 modules
2. Test CommonJS modules
3. Test module resolution
4. Test circular dependencies

**Expected Behavior:**
- Module systems work
- Resolution correct
- Dependencies handled
- Good error messages

#### Test 184: Async/await support

**Objective:** Test asynchronous programming

**Steps:**
1. Test async functions
2. Test await expressions
3. Test Promise handling
4. Test error propagation

**Test Code:**
```worldc
async function loadAsset(path: string): Promise<Asset> {
    try {
        const asset = await AssetManager.loadAsync(path);
        return asset;
    } catch (error) {
        console.error("Failed to load asset:", error);
        throw error;
    }
}

async void test_async() {
    const texture = await loadAsset("player.png");
    // Use texture
}
```

**Expected Behavior:**
- Async/await works correctly
- Promises handled properly
- Error propagation works
- Performance acceptable

#### Test 185: Promise handling

**Objective:** Test Promise integration

**Steps:**
1. Test Promise creation
2. Test Promise chaining
3. Test Promise.all
4. Test error handling

**Expected Behavior:**
- Promises work correctly
- Chaining functions properly
- Parallel execution works
- Error handling robust

#### Test 186: Error propagation

**Objective:** Test error handling

**Steps:**
1. Test exception throwing
2. Test error catching
3. Test error propagation
4. Test error types

**Expected Behavior:**
- Exceptions work correctly
- Catching is reliable
- Propagation follows rules
- Error types preserved

### WebAssembly Support Tests (187-191)

#### Test 187: WASM module generation

**Objective:** Test WebAssembly output

**Steps:**
1. Compile to WebAssembly
2. Test module loading
3. Test function exports
4. Test performance

**Commands:**
```bash
# Test WASM generation
npm run compile -- --target wasm test.wc
```

**Expected Behavior:**
- Valid WASM generated
- Module loads correctly
- Exports work properly
- Performance excellent

#### Test 188: Memory management

**Objective:** Test WASM memory handling

**Steps:**
1. Test memory allocation
2. Test memory sharing
3. Test garbage collection
4. Test memory limits

**Expected Behavior:**
- Memory management correct
- Sharing works properly
- GC integrates well
- Limits respected

#### Test 189: Function imports/exports

**Objective:** Test WASM interop

**Steps:**
1. Test function exports
2. Test function imports
3. Test parameter passing
4. Test return values

**Expected Behavior:**
- Import/export works
- Parameters passed correctly
- Return values accurate
- Type safety maintained

#### Test 190: Performance characteristics

**Objective:** Test WASM performance

**Steps:**
1. Benchmark WASM code
2. Compare with JavaScript
3. Test optimization levels
4. Profile execution

**Expected Behavior:**
- WASM significantly faster
- Consistent performance
- Optimizations effective
- Profiling accurate

#### Test 191: Browser compatibility

**Objective:** Test WASM support

**Steps:**
1. Test in different browsers
2. Test feature detection
3. Test fallback handling
4. Test error reporting

**Expected Behavior:**
- Works in modern browsers
- Feature detection works
- Fallbacks available
- Clear error messages

---

### 2.4 Development Tools

#### Test 192: Auto-completion accuracy

**Objective:** Test IntelliSense quality

**Steps:**
1. Test API completions
2. Test context awareness
3. Test accuracy
4. Test performance

**Expected Behavior:**
- Completions accurate
- Context-aware suggestions
- Fast response time
- Helpful documentation

#### Test 193: Error diagnostics

**Objective:** Test error reporting

**Steps:**
1. Test compile-time errors
2. Test runtime errors
3. Test warning messages
4. Test quick fixes

**Expected Behavior:**
- Errors detected quickly
- Messages clear and helpful
- Warnings appropriate
- Quick fixes available

#### Test 194: Hover information

**Objective:** Test documentation display

**Steps:**
1. Test symbol hover
2. Test type information
3. Test documentation display
4. Test formatting

**Expected Behavior:**
- Hover works reliably
- Information accurate
- Documentation helpful
- Good formatting

#### Test 195: Go-to definition

**Objective:** Test navigation features

**Steps:**
1. Test definition jumping
2. Test cross-file navigation
3. Test symbol references
4. Test navigation history

**Expected Behavior:**
- Navigation works correctly
- Cross-file jumping reliable
- References found accurately
- History maintained

#### Test 196: Find references

**Objective:** Test reference finding

**Steps:**
1. Test symbol references
2. Test usage highlighting
3. Test reference accuracy
4. Test performance

**Expected Behavior:**
- All references found
- Highlighting clear
- Results accurate
- Search fast

### Debugger Tests (197-201)

#### Test 197: Breakpoint functionality

**Objective:** Test debugging breakpoints

**Steps:**
1. Set breakpoints in code
2. Test breakpoint triggering
3. Test conditional breakpoints
4. Test breakpoint management

**Expected Behavior:**
- Breakpoints work reliably
- Triggering accurate
- Conditions evaluated correctly
- Management interface good

#### Test 198: Variable inspection

**Objective:** Test variable viewing

**Steps:**
1. Inspect local variables
2. Inspect object properties
3. Test value modification
4. Test complex data types

**Expected Behavior:**
- Variables displayed correctly
- Properties accessible
- Modification works
- Complex types handled

#### Test 199: Call stack navigation

**Objective:** Test stack viewing

**Steps:**
1. View call stack
2. Navigate stack frames
3. Test stack accuracy
4. Test deep stacks

**Expected Behavior:**
- Stack displayed correctly
- Navigation smooth
- Information accurate
- Performance acceptable

#### Test 200: Step-through debugging

**Objective:** Test step controls

**Steps:**
1. Test step over
2. Test step into
3. Test step out
4. Test continue

**Expected Behavior:**
- Step controls work correctly
- Execution flow accurate
- Performance acceptable
- UI responsive

#### Test 201: Expression evaluation

**Objective:** Test debug expressions

**Steps:**
1. Evaluate expressions in debugger
2. Test complex expressions
3. Test side effects
4. Test error handling

**Expected Behavior:**
- Expressions evaluate correctly
- Complex expressions work
- Side effects handled properly
- Errors reported clearly

### Hot Reload Tests (202-206)

#### Test 202: Code change detection

**Objective:** Test change monitoring

**Steps:**
1. Make code changes
2. Test detection speed
3. Test change types
4. Test file watching

**Expected Behavior:**
- Changes detected quickly
- All change types caught
- File watching reliable
- Performance good

#### Test 203: Incremental compilation

**Objective:** Test incremental updates

**Steps:**
1. Test small changes
2. Test large changes
3. Test dependency updates
4. Test compilation speed

**Expected Behavior:**
- Incremental compilation fast
- Dependencies handled
- Large changes supported
- Speed improvement significant

#### Test 204: State preservation

**Objective:** Test hot reload state

**Steps:**
1. Test variable preservation
2. Test object state
3. Test execution context
4. Test limitations

**Expected Behavior:**
- State preserved when possible
- Object state maintained
- Context preserved
- Limitations clear

#### Test 205: Error handling

**Objective:** Test hot reload errors

**Steps:**
1. Test compilation errors
2. Test runtime errors
3. Test error recovery
4. Test rollback

**Expected Behavior:**
- Errors handled gracefully
- Recovery mechanisms work
- Rollback available
- User feedback clear

#### Test 206: Performance impact

**Objective:** Test hot reload overhead

**Steps:**
1. Measure baseline performance
2. Measure with hot reload
3. Test impact on gameplay
4. Test resource usage

**Expected Behavior:**
- Minimal performance impact
- Gameplay not affected
- Resource usage reasonable
- Optimization available

---

## III. Performance & Scalability Testing

### 3.1 Editor Performance

#### Test 207: Application startup <5 seconds

**Objective:** Measure and verify startup performance

**Setup:** Fresh system restart recommended

**Steps:**
1. Use stopwatch to time startup
2. Measure from command execution to usable UI
3. Test on different hardware
4. Identify bottlenecks

**Commands:**
```bash
# Time the startup
time npm run start

# Or measure with built-in timing
npm run start --profile
```

**Expected Behavior:**
- Startup completes under 5 seconds
- UI responsive immediately
- No unnecessary delays
- Progress indication during startup

**Feedback Focus:**
- Exact startup time (with stopwatch)
- Hardware specifications
- Any blocking operations
- Suggestions for improvement

#### Test 208: Project loading <10 seconds

**Objective:** Test project loading performance

**Setup:** Use various project sizes

**Steps:**
1. Time project loading
2. Test small projects (<10MB)
3. Test medium projects (10-100MB)
4. Test large projects (100MB+)

**Expected Behavior:**
- Small projects load instantly
- Medium projects under 5 seconds
- Large projects under 10 seconds
- Progress indication shown

#### Test 209: Large scene loading <30 seconds

**Objective:** Test scene loading scalability

**Setup:** Create large test scene

**Commands:**
```bash
# Create large scene for testing
# Use scripting or duplication to create 10,000+ entities
```

**Steps:**
1. Create scene with 10,000+ entities
2. Save scene
3. Close and reload scene
4. Measure loading time

**Expected Behavior:**
- Loading completes under 30 seconds
- Memory usage reasonable
- UI remains responsive
- Progress feedback provided

#### Test 210: Asset browser refresh <5 seconds

**Objective:** Test asset browser performance

**Setup:** Project with 1000+ assets

**Steps:**
1. Add many assets to project
2. Refresh asset browser
3. Time refresh operation
4. Test search and filtering

**Expected Behavior:**
- Refresh completes quickly
- Search is responsive
- Filtering is fast
- UI remains smooth

#### Test 211: Script compilation <2 seconds

**Objective:** Test WORLDC compilation speed

**Setup:** Various script sizes

**Steps:**
1. Compile small scripts (<100 lines)
2. Compile medium scripts (100-1000 lines)
3. Compile large scripts (1000+ lines)
4. Test incremental compilation

**Commands:**
```bash
# Test compilation directly
cd worldenv/worldc
time npm run compile large-script.wc
```

**Expected Behavior:**
- Small scripts compile instantly
- Medium scripts under 1 second
- Large scripts under 2 seconds
- Incremental compilation much faster

### Memory Usage Tests (212-216)

#### Test 212: Base memory usage <500MB

**Objective:** Test baseline memory consumption

**Setup:** Fresh editor with empty project

**Commands:**
```bash
# Monitor memory usage
top -p $(pgrep -f "worldedit")
# Or use built-in memory profiler
```

**Steps:**
1. Launch editor with empty project
2. Monitor memory usage
3. Let editor idle for 10 minutes
4. Check for memory growth

**Expected Behavior:**
- Base usage under 500MB
- No memory leaks during idle
- Stable memory consumption
- Reasonable heap size

#### Test 213: Large project handling <2GB

**Objective:** Test memory with large projects

**Setup:** Large project with many assets

**Steps:**
1. Open large project
2. Work with project normally
3. Monitor peak memory usage
4. Test memory stability

**Expected Behavior:**
- Peak usage under 2GB
- Memory usage stable
- No excessive growth
- Good garbage collection

#### Test 214: Memory leak detection

**Objective:** Test for memory leaks

**Steps:**
1. Perform repetitive operations
2. Monitor memory growth
3. Test for common leak patterns
4. Use memory profiling tools

**Commands:**
```bash
# Use Node.js memory profiling
node --inspect npm run start
# Connect Chrome DevTools for memory profiling
```

**Expected Behavior:**
- No continuous memory growth
- Memory frees appropriately
- Garbage collection effective
- No object retention

#### Test 215: Garbage collection optimization

**Objective:** Test memory management

**Steps:**
1. Monitor GC behavior
2. Test GC performance impact
3. Verify collection effectiveness
4. Test GC tuning options

**Expected Behavior:**
- GC runs efficiently
- Minimal performance impact
- Effective memory recovery
- Tuning options available

#### Test 216: Resource cleanup verification

**Objective:** Test resource management

**Steps:**
1. Load and unload assets
2. Open and close projects
3. Create and destroy objects
4. Verify cleanup

**Expected Behavior:**
- Resources cleaned properly
- No resource leaks
- File handles released
- GPU resources freed

### Responsiveness Tests (217-221)

#### Test 217: UI interactions <100ms

**Objective:** Test UI response time

**Steps:**
1. Click buttons and measure response
2. Test menu interactions
3. Test panel operations
4. Use high-precision timing

**Expected Behavior:**
- Response under 100ms
- No noticeable lag
- Smooth interactions
- Consistent timing

#### Test 218: File operations <500ms

**Objective:** Test file system performance

**Steps:**
1. Test file creation
2. Test file deletion
3. Test file modification
4. Test batch operations

**Expected Behavior:**
- Operations complete under 500ms
- Batch operations efficient
- Progress indication for slow ops
- Error handling graceful

#### Test 219: Viewport navigation <16ms (60fps)

**Objective:** Test viewport performance

**Steps:**
1. Navigate viewport smoothly
2. Monitor frame rate
3. Test with complex scenes
4. Profile rendering performance

**Commands:**
```bash
# Enable FPS monitoring in browser
# Or use built-in performance tools
```

**Expected Behavior:**
- Consistent 60fps
- Smooth navigation
- No frame drops
- Good performance scaling

#### Test 220: Asset preview generation <2 seconds

**Objective:** Test preview system performance

**Steps:**
1. Import assets requiring previews
2. Time preview generation
3. Test batch preview generation
4. Test preview quality

**Expected Behavior:**
- Individual previews under 2 seconds
- Batch generation efficient
- Good preview quality
- Background processing available

#### Test 221: Search operations <1 second

**Objective:** Test search performance

**Steps:**
1. Search in large projects
2. Search in asset browser
3. Search in hierarchy
4. Test complex search queries

**Expected Behavior:**
- Search results under 1 second
- Incremental search responsive
- Complex queries handled
- Search indexing efficient

---

### 3.2 Compilation Performance

#### Test 222: Small project (<1MB) <30 seconds

**Objective:** Test build performance for small projects

**Setup:** Create small test project

**Steps:**
1. Create project with basic assets
2. Add simple scripts
3. Build for web platform
4. Time complete build process

**Commands:**
```bash
# Time the build process
cd worldenv/editor
time npm run build
```

**Expected Behavior:**
- Build completes under 30 seconds
- All assets processed correctly
- Output quality good
- Build process reliable

#### Test 223: Medium project (<10MB) <2 minutes

**Objective:** Test scalability with medium projects

**Setup:** Create medium-sized project

**Steps:**
1. Create project with moderate assets
2. Add multiple scripts and scenes
3. Build for multiple platforms
4. Monitor build process

**Expected Behavior:**
- Build completes under 2 minutes
- Progress indication clear
- Memory usage reasonable
- Error handling good

#### Test 224: Large project (<100MB) <10 minutes

**Objective:** Test performance with large projects

**Setup:** Create large test project

**Steps:**
1. Create project with many assets
2. Add complex scripts and scenes
3. Build for all platforms
4. Monitor system resources

**Expected Behavior:**
- Build completes under 10 minutes
- System remains responsive
- Resource usage acceptable
- Build quality maintained

#### Test 225: Incremental builds <10 seconds

**Objective:** Test incremental build performance

**Steps:**
1. Perform full build
2. Make small changes
3. Perform incremental build
4. Verify build correctness

**Expected Behavior:**
- Incremental builds under 10 seconds
- Only changed files processed
- Build correctness maintained
- Dependency tracking accurate

#### Test 226: Clean builds reproducible

**Objective:** Test build consistency

**Steps:**
1. Perform clean build
2. Delete build output
3. Perform another clean build
4. Compare outputs

**Expected Behavior:**
- Builds are deterministic
- Outputs identical
- No build artifacts retained
- Reproducible results

### Resource Usage Tests (227-231)

#### Test 227: CPU usage <80% during builds

**Objective:** Test CPU resource management

**Steps:**
1. Monitor CPU usage during builds
2. Test with different core counts
3. Verify system responsiveness
4. Test parallel processing

**Commands:**
```bash
# Monitor CPU usage
top -p $(pgrep -f "worldedit")
htop  # More detailed monitoring
```

**Expected Behavior:**
- CPU usage under 80%
- System remains responsive
- Parallel processing effective
- Good core utilization

#### Test 228: Memory usage <4GB during builds

**Objective:** Test memory requirements

**Steps:**
1. Monitor memory during builds
2. Test peak memory usage
3. Verify memory cleanup
4. Test with memory limits

**Expected Behavior:**
- Memory usage under 4GB
- No memory exhaustion
- Good memory management
- Cleanup after builds

#### Test 229: Disk space usage reasonable

**Objective:** Test storage requirements

**Steps:**
1. Monitor disk usage during builds
2. Check temporary file cleanup
3. Verify output sizes
4. Test disk space limits

**Expected Behavior:**
- Reasonable disk usage
- Temporary files cleaned
- Output sizes appropriate
- Graceful handling of space limits

#### Test 230: Network usage for dependencies

**Objective:** Test network requirements

**Steps:**
1. Monitor network during builds
2. Test with slow connections
3. Test offline builds
4. Verify caching

**Expected Behavior:**
- Minimal network usage
- Offline builds possible
- Good caching behavior
- Graceful handling of network issues

#### Test 231: Parallel processing efficiency

**Objective:** Test multi-core utilization

**Steps:**
1. Test on different core counts
2. Monitor core utilization
3. Test parallel efficiency
4. Compare with sequential builds

**Expected Behavior:**
- Good parallel utilization
- Scaling with core count
- Efficient task distribution
- Significant speedup

---

### 3.3 Runtime Performance

#### Test 232: 60fps for typical games

**Objective:** Test target frame rate

**Setup:** Create typical game scene

**Steps:**
1. Create representative game scene
2. Add typical game objects
3. Run in play mode
4. Monitor frame rate

**Commands:**
```bash
# Monitor performance in browser dev tools
# Enable FPS display
```

**Expected Behavior:**
- Consistent 60fps
- No significant frame drops
- Smooth gameplay
- Good performance scaling

#### Test 233: 30fps for complex scenes

**Objective:** Test complex scene performance

**Setup:** Create demanding scene

**Steps:**
1. Create scene with many objects
2. Add complex effects
3. Test performance limits
4. Find breaking points

**Expected Behavior:**
- At least 30fps with complex scenes
- Graceful performance degradation
- Options to improve performance
- Good performance feedback

#### Test 234: Low latency input handling

**Objective:** Test input responsiveness

**Steps:**
1. Test keyboard input lag
2. Test mouse input lag
3. Test touch input (if supported)
4. Measure input-to-visual delay

**Expected Behavior:**
- Input lag under 16ms (1 frame)
- Consistent input handling
- No input dropping
- Platform-appropriate behavior

#### Test 235: Smooth animations

**Objective:** Test animation performance

**Steps:**
1. Test sprite animations
2. Test 3D animations
3. Test particle effects
4. Test interpolation quality

**Expected Behavior:**
- Smooth animation playback
- Good interpolation
- No stuttering or jitter
- Performance scaling options

#### Test 236: Stable frame times

**Objective:** Test frame consistency

**Steps:**
1. Monitor frame time variance
2. Test for frame spikes
3. Test sustained performance
4. Profile performance bottlenecks

**Expected Behavior:**
- Consistent frame times
- Low variance in timing
- No major frame spikes
- Predictable performance

### Resource Management Tests (237-241)

#### Test 237: Efficient asset loading

**Objective:** Test asset loading performance

**Steps:**
1. Test asset loading speed
2. Test memory usage during loading
3. Test streaming capabilities
4. Test cache effectiveness

**Expected Behavior:**
- Fast asset loading
- Efficient memory usage
- Streaming works correctly
- Cache improves performance

#### Test 238: Memory pool management

**Objective:** Test memory pool efficiency

**Steps:**
1. Test object pooling
2. Monitor memory allocation patterns
3. Test pool effectiveness
4. Verify no fragmentation

**Expected Behavior:**
- Pooling reduces allocations
- Good memory reuse
- No memory fragmentation
- Performance improvement

#### Test 239: Garbage collection tuning

**Objective:** Test GC optimization

**Steps:**
1. Test GC frequency
2. Test GC pause times
3. Test GC effectiveness
4. Tune GC parameters

**Expected Behavior:**
- Infrequent GC pauses
- Short pause times
- Effective memory collection
- Tuning options available

#### Test 240: GPU resource utilization

**Objective:** Test graphics performance

**Steps:**
1. Monitor GPU usage
2. Test VRAM utilization
3. Test rendering efficiency
4. Profile graphics performance

**Expected Behavior:**
- Good GPU utilization
- Efficient VRAM usage
- Optimal rendering paths
- Performance scaling

#### Test 241: Battery life on mobile

**Objective:** Test power efficiency

**Setup:** Mobile device or emulation

**Steps:**
1. Test power consumption
2. Monitor battery drain
3. Test power-saving modes
4. Compare with benchmarks

**Expected Behavior:**
- Reasonable battery life
- Power-saving modes work
- Performance/power balance
- Comparison favorable

---

## Testing Tools & Commands

### Essential Commands

**Development Setup:**
```bash
# Initial setup
git clone https://github.com/elastic-softworks/worldenv.git
cd worldenv
npm install

# Editor development
cd editor
npm run dev          # Development mode
npm run build        # Production build
npm run start        # Launch editor
npm run lint         # Code linting
npm run test         # Run tests

# WORLDC development
cd ../worldc
npm run build        # Build compiler
npm run test         # Test compiler
npm run compile      # Compile WORLDC files
```

**Performance Monitoring:**
```bash
# Memory monitoring
top -p $(pgrep electron)
ps aux | grep electron
htop

# Node.js profiling
node --inspect npm run start
npm run start --profile

# Build timing
time npm run build
```

**Testing Utilities:**
```bash
# Create test projects
mkdir test-projects
cd test-projects

# Generate test assets
for i in {1..100}; do
  touch "sprite_$i.png"
done

# Monitor file changes
watch -n 1 'ls -la | wc -l'
```

### Browser Developer Tools

**Performance Testing:**
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Record while testing
4. Analyze performance metrics

**Memory Testing:**
1. Open Memory tab in DevTools
2. Take heap snapshots
3. Compare snapshots for leaks
4. Monitor memory usage over time

**Network Testing:**
1. Open Network tab
2. Monitor asset loading
3. Test with throttled connections
4. Verify caching behavior

---

## Feedback Guidelines

### Reporting Format

For each test item, provide:

**Status:** Choose one:
- **Passed** - Works as expected
- **Minor Issue** - Works but has minor problems
- **Failed** - Does not work or has major issues
- **Blocked** - Cannot test due to dependencies

**Notes:** Detailed description including:
- What you observed
- Steps that led to the issue
- Error messages (exact text)
- Screenshots or recordings

**Priority:** Select appropriate level:
- **Critical** - System unusable, blocks all testing
- **High** - Major functionality broken
- **Medium** - Feature issues with workarounds
- **Low** - Minor cosmetic or convenience issues

**Environment:** Always include:
- Operating system and version
- Hardware specifications (CPU, RAM, GPU)
- Browser version (if relevant)
- Node.js and npm versions

### Quality Feedback Examples

**Good Feedback:**
```
Status: Failed
Priority: High

The viewport becomes unresponsive after loading a scene with 500+ entities. 
Steps: 1) Created scene with 500 cubes, 2) Saved scene, 3) Reopened scene
Error: "WebGL context lost" appears in console after 30 seconds
Environment: Ubuntu 20.04, GTX 1060 6GB, Chrome 96
Screenshot: [attached showing error dialog]

The issue seems related to GPU memory management. Reducing entity count to 300 works fine.
```

**Poor Feedback:**
```
Status: Failed
Priority: Medium

Doesn't work.
```

### Screenshots and Video

**When to Capture:**
- Visual layout issues
- Error dialogs or messages
- Performance problems (frame rate drops)
- Unexpected behavior
- UI state that's hard to describe

**What to Show:**
- Full window capture for layout issues
- Focused capture for specific problems
- Before/after states for comparisons
- Error messages with context

**Tools:**
- Built-in screenshot tools (Shift+Cmd+4 on macOS, Win+Shift+S on Windows)
- Screen recording for complex interactions
- Browser DevTools screenshots for web issues

---

## Quick Reference

### Keyboard Shortcuts for Testing

**Editor Navigation:**
- `Ctrl+N` - New project
- `Ctrl+O` - Open project
- `Ctrl+S` - Save
- `F5` - Play mode
- `Esc` - Stop play mode
- `F` - Focus selected object
- `W/E/R` - Move/Rotate/Scale tools

**Testing Shortcuts:**
- `F12` - Browser DevTools
- `Ctrl+Shift+I` - DevTools (alternative)
- `Ctrl+Shift+C` - Element inspector
- `Ctrl+R` - Refresh/reload
- `Ctrl+Shift+R` - Hard refresh

### Performance Baselines

**Target Performance:**
- Startup: <5 seconds
- Project load: <10 seconds
- Scene load: <30 seconds
- UI response: <100ms
- Frame rate: 60fps (30fps minimum)
- Memory: <2GB peak usage

**Hardware Targets:**
- Minimum: 4GB RAM, integrated graphics
- Recommended: 8GB RAM, dedicated GPU
- Development: 16GB RAM, modern GPU

### Common Issues to Watch For

**Performance:**
- Memory leaks during long sessions
- Frame rate drops with many objects
- Slow asset loading
- Unresponsive UI during operations

**Functionality:**
- Features not working as documented
- Error messages without clear resolution
- Data loss during save/load operations
- Platform-specific behavior differences

**Usability:**
- Confusing workflows
- Missing feedback for operations
- Inconsistent keyboard shortcuts
- Poor error message clarity

---

## Conclusion

This testing guide provides comprehensive coverage of the WORLDENV system across all major functional areas. The systematic approach ensures thorough validation of both WORLDEDIT and WORLDC components.

**Key Testing Principles:**
- Test systematically through each functional area
- Provide detailed, actionable feedback
- Focus on user workflows and real-world scenarios
- Document performance measurements accurately
- Report issues with sufficient context for debugging

**Success Criteria:**
- All critical functionality works reliably
- Performance meets established targets
- User experience is intuitive and efficient
- Documentation accurately reflects system behavior
- System is ready for broader beta testing

Your thorough testing and detailed feedback will be crucial for achieving a successful pre-alpha release. Thank you for your contribution to making WORLDENV a robust and reliable game development platform.

---

**Ready to Begin Testing?**

1. Open `worldenv/hitl/index.html` in your browser
2. Follow this guide for each test item
3. Provide detailed feedback using the HITL interface
4. Generate the final report when complete

Good luck with your testing!