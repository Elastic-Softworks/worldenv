# WORLDENV HITL TEST 1 - QUICK START GUIDE

**CRITICAL: You must BUILD the application before testing!**

## The Problem

Previous testing showed no changes because **the application was never built**. All source code changes were made, but without compiling them into `dist/`, the changes are not visible when running the editor.

## The Solution

Follow these steps **exactly** to see the changes:

---

## STEP 1: Build the Application

### Option A: Use the Build Script (Recommended)

```bash
cd worldenv/editor
./BUILD-AND-TEST.sh
```

The script will:
- Check Node.js version
- Install dependencies
- Build main process
- Build renderer process
- Verify build output
- Launch the application

### Option B: Manual Build

```bash
cd worldenv/editor
npm install
npm run build:main
npm run build:renderer
npm start
```

---

## STEP 2: What to Look For

### Splash Screen (First 3 seconds)
✓ Shows "ELASTIC SOFTWORKS 2025" (not "game development editor")  
✓ Shows "NEW WORLD APPLICATIONS" beneath WORLDENV logo  
✓ Rainbow gradient animation on company text  
✓ Logo glow/pulse effect  
✓ Background watermarks in corners  
✓ Displays for 3 seconds (not 1 second)  

### Main Editor Window
✓ **All panels are visible immediately** (not blank gray screen)  
✓ Hierarchy panel on left  
✓ Viewport panel in center  
✓ Inspector panel on right  
✓ Asset browser panel at bottom  

### Welcome Overlay (in Viewport)
✓ Shows WORLDEDIT title  
✓ Shows "ELASTIC SOFTWORKS 2025"  
✓ Shows "NEW WORLD APPLICATIONS"  
✓ Has "New Project" button  
✓ Has "Open Project" button  
✓ Message: "All editor panels are visible and ready for use"  

### Menu System
✓ Open Developer Tools: `View > Toggle Developer Tools`  
✓ Click menu items and check Console tab  
✓ Should see `[MENU]` messages for every action  

**Test these menus:**
- File > New Project → `[MENU] File > New Project`
- File > Open Project → `[MENU] File > Open Project`
- File > Save Project → `[MENU] File > Save Project`
- Edit > Undo → `[MENU] Edit > Undo`
- View > Reload → `[MENU] View > Reload`
- Build > Build Project → `[MENU] Build > Build Project`

---

## STEP 3: Document Your Findings

### Use the HITL Testing Page

```bash
# Open in browser
firefox worldenv/hitl/index.html
# or
google-chrome worldenv/hitl/index.html
```

The testing page will:
- Show checklist of all tests
- Let you record notes and priority
- Let you attach screenshots
- Generate JSON report
- Copy report to clipboard automatically

### Take Screenshots

For any issues, capture:
1. The problem (what you see)
2. Developer Tools console (if relevant)
3. Terminal output (if relevant)

---

## What Changed in Source Code

These files were modified:

### 1. `editor/src/renderer/components/EditorApp.tsx`
**Change:** Always renders `<EditorShell />` instead of conditionally showing WelcomeScreen  
**Result:** All UI panels now visible on startup

### 2. `editor/src/main/main.ts`
**Change:** Added `console.log()` to all File menu handlers  
**Result:** Menu actions now produce visible console output

### 3. `editor/src/main/splash.ts`
**Status:** Already had correct branding and animations  
**Note:** No changes needed, just needed to build

### 4. `editor/src/renderer/components/panels/ViewportPanel.tsx`
**Status:** Already had welcome overlay  
**Note:** No changes needed, works correctly

---

## Troubleshooting

### "Nothing changed, I still see gray screen"
→ Did you run the build? Check if `worldenv/editor/dist/` exists  
→ Try: `rm -rf dist && npm run build && npm start`

### "Build fails with errors"
→ Check Node.js version: `node -v` (need 18+)  
→ Clean install: `rm -rf node_modules && npm install`  
→ Check for syntax errors in console output

### "Application won't start"
→ Check if `dist/main/main.js` exists  
→ Check if `dist/renderer/index.html` exists  
→ Try: `npm start` again

### "Splash screen still shows old text"
→ Build cache issue: `rm -rf dist && npm run build`  
→ Hard refresh in Electron (Ctrl+Shift+R)

### "Panels still not visible"
→ Check Developer Tools console for errors  
→ Verify EditorApp.tsx was actually rebuilt  
→ Check file modification timestamp: `ls -la dist/renderer/`

---

## Development Mode (For Faster Iteration)

```bash
cd worldenv/editor
./BUILD-AND-TEST.sh --dev
```

This starts the editor with hot-reload enabled. Source code changes will automatically rebuild and refresh.

---

## Current Test Status

### ✅ Completed (in source code)
- EditorApp always renders UI panels
- Splash screen branding updated
- Splash screen animations implemented
- Menu logging added to File operations
- Menu logging already exists for Edit/View/Build

### ⏳ Needs Testing (after build)
- Verify all panels visible
- Verify welcome overlay works
- Verify menu console output
- Verify window controls
- Verify theme switching
- Verify project creation/opening

### ❓ Unknown (need investigation)
- Minimize button freeze issue
- Opening project UI update
- Light mode switching
- Graphics fallback behavior

---

## Success Checklist

Before declaring success, verify:

- [ ] Application builds without errors
- [ ] Application launches without crashes
- [ ] Splash screen shows for 3 seconds
- [ ] Splash screen has new branding
- [ ] All 4 panels visible on startup
- [ ] Welcome overlay appears in viewport
- [ ] Menu items log to console
- [ ] Window controls work (minimize/maximize/close)

---

## Next Steps After Testing

1. **Complete HITL Round 2**
   - Use `hitl/index.html` checklist
   - Test all 241 items systematically
   - Generate JSON report
   
2. **Update Documentation**
   - Mark completed items in `test1-todo.txt`
   - Update `TESTING-GUIDE.md` if needed
   - Create issue tickets for remaining bugs

3. **Address Remaining Issues**
   - Minimize button freeze
   - Project opening UI updates
   - Any new issues found in testing

---

## Files to Reference

- **Action Plan:** `hitl/docs/test1-action-plan.txt` (detailed strategy)
- **Todo List:** `hitl/docs/test1-todo.txt` (implementation status)
- **Testing Guide:** `editor/docs/TESTING-GUIDE.md` (test specifications)
- **HITL Form:** `hitl/index.html` (testing interface)
- **Build Script:** `editor/BUILD-AND-TEST.sh` (automated build)

---

## Important Notes

⚠️ **ALWAYS BUILD BEFORE TESTING**  
Source code changes are not visible until compiled to `dist/`

⚠️ **CHECK DIST DIRECTORY EXISTS**  
If `dist/` is missing, the build didn't work

⚠️ **USE DEVELOPER TOOLS**  
Essential for seeing console output and debugging

⚠️ **DOCUMENT ACTUAL BEHAVIOR**  
Report what you see, not what you expect

⚠️ **TAKE SCREENSHOTS**  
Visual evidence helps debugging significantly

---

## Quick Command Reference

```bash
# Full build and test
cd worldenv/editor && ./BUILD-AND-TEST.sh

# Development mode with hot reload
cd worldenv/editor && ./BUILD-AND-TEST.sh --dev

# Manual build
cd worldenv/editor
npm install
npm run build
npm start

# Clean rebuild
cd worldenv/editor
rm -rf dist node_modules
npm install
npm run build
npm start

# Check build output
ls -la worldenv/editor/dist/main/
ls -la worldenv/editor/dist/renderer/
```

---

## Timeline Estimate

- **Build:** 2-5 minutes
- **Initial verification:** 10-15 minutes
- **Systematic testing:** 30-60 minutes
- **Documentation:** 15-30 minutes
- **Total:** ~1-2 hours

---

**Ready to proceed? Run the build script now!**

```bash
cd worldenv/editor && ./BUILD-AND-TEST.sh
```

Good luck with testing! 🚀