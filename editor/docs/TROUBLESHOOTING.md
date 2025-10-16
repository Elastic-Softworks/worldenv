# WORLDEDIT TROUBLESHOOTING GUIDE

**Common issues and solutions for WORLDEDIT development and usage**

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build and Compilation](#build-and-compilation)
- [Runtime Errors](#runtime-errors)
- [Performance Problems](#performance-problems)
- [Editor Interface Issues](#editor-interface-issues)
- [Asset and File Management](#asset-and-file-management)
- [WORLDC Language Issues](#worldc-language-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Development Environment](#development-environment)
- [Debugging Tips](#debugging-tips)

## Installation Issues

### Node.js Version Conflicts

**Problem:** WORLDEDIT requires Node.js 18+ but you have an older version.

**Symptoms:**
```
Error: This version of Node.js requires npm 9+
npm ERR! Unsupported engine
```

**Solutions:**
```bash
# Check current Node.js version
node --version

# Install Node Version Manager (Unix/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Node Version Manager (Windows)
# Download and install from: https://github.com/coreybutler/nvm-windows
nvm install 18.16.0
nvm use 18.16.0

# Verify installation
node --version
npm --version
```

### Permission Denied Errors

**Problem:** Cannot install packages due to permission restrictions.

**Symptoms:**
```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
npm ERR! The operation was rejected by your operating system
```

**Solutions:**

**Unix/macOS:**
```bash
# Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Alternative: Use sudo (not recommended for development)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Windows:**
```cmd
# Run command prompt as administrator
# Right-click cmd.exe → "Run as administrator"

# Or use PowerShell as administrator
Start-Process powershell -Verb runAs
```

### Missing Build Tools

**Problem:** Native module compilation fails due to missing build tools.

**Symptoms:**
```
Error: Microsoft Visual Studio C++ 14.0 is required
error MSB8003: Could not find WindowsSDK
gyp ERR! stack Error: not found: make
```

**Solutions:**

**Windows:**
```bash
# Install Visual Studio Build Tools
npm install -g windows-build-tools

# Or install Visual Studio Community with C++ workload
# Download from: https://visualstudio.microsoft.com/downloads/

# Install Python for native modules
choco install python3
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install build-essential python3 python3-pip
sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxss1-dev
```

## Build and Compilation

### TypeScript Compilation Errors

**Problem:** TypeScript compilation fails with type errors.

**Symptoms:**
```
error TS2304: Cannot find name 'React'
error TS2307: Cannot find module '@types/node'
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf dist/ node_modules/.cache/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check TypeScript configuration
npx tsc --noEmit --listFiles

# Update @types packages
npm update @types/node @types/react @types/react-dom
```

### Webpack Build Failures

**Problem:** Webpack fails to bundle the application.

**Symptoms:**
```
Module not found: Error: Can't resolve 'three'
Configuration error: Entry module not found
ERROR in ./src/main.ts Module build failed
```

**Solutions:**
```bash
# Clear webpack cache
rm -rf dist/ .cache/

# Verify entry points exist
ls -la src/main/main.ts src/renderer/renderer.tsx

# Check webpack configuration
npx webpack --config webpack.main.config.js --mode development --stats verbose

# Update webpack and loaders
npm update webpack webpack-cli ts-loader
```

### Electron Packaging Issues

**Problem:** Electron-builder fails to create packages.

**Symptoms:**
```
Error: Application entry file "dist/main/main.js" does not exist
Cannot resolve target: win32
Error: spawn wine ENOENT (on Linux building for Windows)
```

**Solutions:**
```bash
# Ensure build completes before packaging
npm run build
ls -la dist/main/main.js dist/renderer/

# Install platform-specific dependencies
npm install --save-dev electron-builder

# For cross-platform builds on Linux
sudo apt install wine64

# For macOS builds on other platforms
# macOS builds must be done on macOS hardware

# Check electron-builder configuration
npx electron-builder --help
```

## Runtime Errors

### Application Won't Start

**Problem:** WORLDEDIT crashes immediately on startup.

**Symptoms:**
```
Error: spawn ENOENT
Segmentation fault (core dumped)
Application failed to start: Path not found
```

**Solutions:**
```bash
# Check Electron installation
npx electron --version

# Start in development mode for debugging
npm run dev

# Enable debug logging
DEBUG=* npm run start

# Check for missing dependencies
ldd worldedit (Linux)
otool -L worldedit (macOS)

# Verify file permissions
chmod +x worldedit
```

### GPU/Graphics Issues

**Problem:** Viewport doesn't render or shows corrupted graphics.

**Symptoms:**
```
WebGL context lost
Failed to create OpenGL context
Black screen in viewport
Graphics driver error
```

**Solutions:**
```bash
# Update graphics drivers
# NVIDIA: Download from nvidia.com
# AMD: Download from amd.com
# Intel: Use system update

# Disable hardware acceleration (temporary fix)
worldedit --disable-gpu

# Check WebGL support
# Open Chrome and visit: chrome://gpu/

# Force software rendering
worldedit --disable-gpu-sandbox --disable-software-rasterizer
```

### Memory Leaks

**Problem:** Application memory usage grows continuously.

**Symptoms:**
```
Out of memory error
Application becomes slow over time
System becomes unresponsive
```

**Solutions:**
```bash
# Monitor memory usage
top -p $(pgrep worldedit)
tasklist /fi "imagename eq worldedit.exe" /fo table

# Enable memory profiling
worldedit --inspect=9229
# Open chrome://inspect in Chrome browser

# Clear cache and temporary files
rm -rf ~/.cache/worldedit/
rm -rf %APPDATA%/worldedit/

# Restart application periodically during development
```

## Performance Problems

### Slow Startup

**Problem:** WORLDEDIT takes a long time to start.

**Symptoms:**
- Splash screen visible for > 10 seconds
- File system operations timeout
- Asset loading delays

**Solutions:**
```bash
# Disable antivirus real-time scanning for project directory
# Add exclusion for node_modules/ and dist/ folders

# Use SSD storage for better I/O performance
# Move project to local drive (not network drive)

# Reduce startup asset loading
# Check project.json for auto-loaded assets

# Enable startup profiling
worldedit --trace-startup
```

### Viewport Performance

**Problem:** 3D viewport runs at low frame rate.

**Symptoms:**
- Frame rate below 30 FPS
- Stuttering during camera movement
- Delayed response to user input

**Solutions:**
```bash
# Check GPU usage
nvidia-smi (NVIDIA)
radeontop (AMD)

# Reduce viewport quality settings
# Viewport → Settings → Quality: Low/Medium

# Disable expensive effects
# Turn off shadows, anti-aliasing, post-processing

# Limit viewport resolution
# Use smaller viewport panel size

# Check for debug/wireframe mode
# Disable debug overlays and gizmos
```

### Large Project Loading

**Problem:** Projects with many assets load slowly.

**Symptoms:**
- Asset browser takes minutes to populate
- Scene loading timeouts
- UI becomes unresponsive

**Solutions:**
```bash
# Enable asset streaming
# Settings → Assets → Stream Loading: Enabled

# Organize assets in subfolders
# Avoid flat directory structures with 1000+ files

# Use asset compression
# Compress textures and models before import

# Implement asset pagination
# Load assets on-demand rather than all at once

# Check disk I/O performance
iotop (Linux)
# Resource Monitor → Disk tab (Windows)
```

## Editor Interface Issues

### UI Layout Problems

**Problem:** Panels are missing or incorrectly sized.

**Symptoms:**
- Blank panels or missing content
- Panels don't respond to resize
- Layout appears corrupted

**Solutions:**
```bash
# Reset layout to default
# Window → Layout → Reset to Default

# Clear UI preferences
rm -rf ~/.config/worldedit/layout.json
del %APPDATA%\worldedit\layout.json

# Check for CSS conflicts
# Press F12 to open DevTools
# Look for CSS errors in Console

# Restart application
# Close and reopen WORLDEDIT
```

### Drag and Drop Not Working

**Problem:** Cannot drag assets or entities.

**Symptoms:**
- Drag operations don't register
- Drop zones don't highlight
- File imports fail

**Solutions:**
```bash
# Check file permissions
# Ensure files are readable and not locked

# Verify supported file formats
# See USER-GUIDE.md for supported extensions

# Disable browser security features (development only)
worldedit --disable-web-security

# Check for modal dialogs blocking input
# Close any open dialogs or overlays

# Restart with clean state
rm -rf ~/.cache/worldedit/
```

### Menu and Shortcuts Not Responding

**Problem:** Keyboard shortcuts and menu items don't work.

**Symptoms:**
- Ctrl+S doesn't save
- Menu items grayed out
- No response to key presses

**Solutions:**
```bash
# Check focus state
# Click in viewport to ensure focus

# Verify no modal dialogs are open
# Look for semi-transparent overlays

# Reset keyboard shortcuts
# Edit → Preferences → Keyboard → Reset

# Check for key capture by other applications
# Disable global hotkey applications

# Restart application
```

## Asset and File Management

### Asset Import Failures

**Problem:** Assets fail to import or show as corrupted.

**Symptoms:**
```
Error: Unsupported file format
Failed to load texture: corrupted header
Model import failed: missing materials
```

**Solutions:**
```bash
# Verify file format support
# Check file extension against supported formats

# Test file integrity
file myasset.png (Unix)
# Open file in appropriate native application

# Check file permissions
ls -la myasset.png
# Ensure read permissions for user

# Try different file formats
# Convert PNG to JPG, OBJ to FBX, etc.

# Reduce file size
# Large files (>100MB) may timeout during import
```

### Project File Corruption

**Problem:** Project files become corrupted or unreadable.

**Symptoms:**
```
Error: Invalid JSON in project.json
Scene file corrupted: unexpected token
Cannot parse project configuration
```

**Solutions:**
```bash
# Restore from backup
cp project.json.backup project.json

# Validate JSON syntax
jq . project.json
# Use online JSON validator

# Recreate project file
# File → Project → Repair Project

# Check disk for errors
fsck /dev/sdX (Linux)
chkdsk C: /f (Windows)

# Use version control to restore
git checkout HEAD -- project.json
```

### Missing Dependencies

**Problem:** Referenced assets or scripts cannot be found.

**Symptoms:**
```
Warning: Missing texture: sprites/player.png
Script not found: scripts/player_controller.wc
Broken asset reference in scene
```

**Solutions:**
```bash
# Check file paths in project
# Use relative paths, not absolute

# Restore missing files
# Re-import assets or restore from backup

# Update asset references
# Use Find & Replace in project files

# Clean up broken references
# Project → Clean → Remove Broken References

# Verify project structure
tree project_directory
dir /s project_directory
```

## WORLDC Language Issues

### Compilation Errors

**Problem:** WORLDC scripts fail to compile.

**Symptoms:**
```
Syntax error: unexpected token '}'
Type error: cannot convert 'int' to 'float'
Linker error: undefined reference to function
```

**Solutions:**
```bash
# Check WORLDC compiler installation
worldc --version

# Validate syntax
worldc compile --check-only script.wc

# Review error messages carefully
# Line numbers and character positions are provided

# Check for common syntax issues
# Missing semicolons, unmatched braces, typos

# Update WORLDC compiler
npm update @worldenv/worldc
```

### Language Server Issues

**Problem:** IDE features like autocomplete don't work.

**Symptoms:**
- No syntax highlighting
- Missing IntelliSense
- Go-to-definition not working

**Solutions:**
```bash
# Restart language server
# VS Code: Cmd/Ctrl+Shift+P → "Restart Language Server"

# Check WORLDC extension installation
# VS Code: Extensions → @worldenv/worldc

# Verify workspace configuration
# Check .vscode/settings.json for WORLDC paths

# Update IDE extensions
# Keep WORLDC extension up to date

# Check language server logs
# Output panel → WORLDC Language Server
```

### Runtime Script Errors

**Problem:** Scripts throw errors during game execution.

**Symptoms:**
```
Runtime error: null reference exception
TypeError: Cannot read property 'x' of undefined
Stack overflow in recursive function
```

**Solutions:**
```bash
# Enable debug mode
# Add console.log() statements for debugging

# Use debugger breakpoints
# Add debugger; statements in WORLDC code

# Check variable initialization
# Ensure all variables are properly initialized

# Validate component references
# Check that components exist before accessing

# Review error stack traces
# Identify exact line causing error
```

## Platform-Specific Issues

### Windows Issues

**Problem:** Windows-specific problems.

**Symptoms:**
- Long path name errors
- Windows Defender interference
- Graphics driver conflicts

**Solutions:**
```cmd
# Enable long path support
reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1

# Add Windows Defender exclusions
# Windows Security → Virus & threat protection → Exclusions
# Add folder: C:\path\to\worldenv\

# Update Windows and drivers
# Windows Update → Check for updates
# Device Manager → Update drivers

# Run as administrator if needed
# Right-click worldedit.exe → "Run as administrator"
```

### macOS Issues

**Problem:** macOS-specific problems.

**Symptoms:**
- App not signed/notarized warnings
- Permission denied for file access
- Gatekeeper blocking execution

**Solutions:**
```bash
# Bypass Gatekeeper (development only)
sudo spctl --master-disable

# Grant file system permissions
# System Preferences → Security & Privacy → Privacy → Full Disk Access

# Allow app to run
# System Preferences → Security & Privacy → General → "Allow apps downloaded from:"

# Sign application (for distribution)
codesign --force --deep --sign "Developer ID" worldedit.app
```

### Linux Issues

**Problem:** Linux-specific problems.

**Symptoms:**
- Missing library dependencies
- X11/Wayland compatibility issues
- AppImage execution problems

**Solutions:**
```bash
# Install missing libraries
ldd worldedit | grep "not found"
sudo apt install libxss1 libasound2 libxtst6

# Fix AppImage permissions
chmod +x worldedit.AppImage

# Run with different display server
# For Wayland issues, try X11:
GDK_BACKEND=x11 ./worldedit

# Install system dependencies
sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev
```

## Development Environment

### VS Code Integration Issues

**Problem:** WORLDEDIT extension doesn't work properly in VS Code.

**Symptoms:**
- Extension not loading
- Syntax highlighting missing
- Debugging not working

**Solutions:**
```bash
# Reinstall VS Code extension
# Extensions → Uninstall → Reinstall

# Check VS Code version compatibility
# Update VS Code to latest version

# Reset VS Code settings
# Cmd/Ctrl+Shift+P → "Developer: Reset Extension Host"

# Check extension logs
# Help → Toggle Developer Tools → Console

# Verify workspace configuration
cat .vscode/settings.json
```

### Git and Version Control

**Problem:** Git conflicts or repository issues.

**Symptoms:**
- Merge conflicts in binary files
- Large repository size
- Sync issues with remote

**Solutions:**
```bash
# Use Git LFS for large assets
git lfs track "*.png" "*.jpg" "*.fbx" "*.wav"

# Ignore build artifacts
echo "dist/" >> .gitignore
echo "node_modules/" >> .gitignore
echo "build/" >> .gitignore

# Clean up repository
git gc --aggressive --prune=now

# Resolve merge conflicts
# Use external merge tools for complex conflicts
git config merge.tool vimdiff
```

### Network and Proxy Issues

**Problem:** Network connectivity problems during development.

**Symptoms:**
- npm install failures
- Asset download timeouts
- Proxy authentication errors

**Solutions:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set proxy authentication
npm config set proxy http://username:password@proxy:8080

# Use different registry
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force

# Check network connectivity
ping registry.npmjs.org
curl -I https://registry.npmjs.org/
```

## Debugging Tips

### Enabling Debug Mode

**General Debug Commands:**
```bash
# Start with maximum debugging
DEBUG=* npm run dev

# Electron main process debugging
npm run dev:main -- --inspect=9229

# Webpack build debugging
npm run build -- --stats verbose

# Enable source maps
# Ensure sourceMap: true in webpack config
```

### Log File Locations

**Application Logs:**
```bash
# Windows
%APPDATA%\worldedit\logs\

# macOS
~/Library/Logs/worldedit/

# Linux
~/.config/worldedit/logs/

# Development logs
./logs/main.log
./logs/renderer.log
```

### Common Debug Commands

**System Information:**
```bash
# Check system resources
top (Unix)
tasklist (Windows)

# Disk space
df -h (Unix)
dir (Windows)

# Memory usage
free -h (Linux)
vm_stat (macOS)
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory (Windows)

# Graphics information
glxinfo | grep render (Linux)
system_profiler SPDisplaysDataType (macOS)
dxdiag (Windows)
```

### Performance Profiling

**Chrome DevTools:**
```bash
# Open DevTools in Electron
# Ctrl+Shift+I or Cmd+Opt+I

# Memory profiling
# Performance tab → Record → Stop
# Memory tab → Take heap snapshot

# Network profiling
# Network tab → Record network activity

# Console profiling
console.time('operation');
// code to profile
console.timeEnd('operation');
```

### Emergency Recovery

**Reset to Clean State:**
```bash
# Clear all caches and temporary files
rm -rf node_modules/ dist/ .cache/
rm -rf ~/.cache/worldedit/
rm -rf ~/.config/worldedit/

# Reinstall everything
npm cache clean --force
npm install
npm run build

# Reset git repository (if needed)
git clean -fd
git reset --hard HEAD
```

**Backup and Restore:**
```bash
# Create project backup
tar -czf project-backup-$(date +%Y%m%d).tar.gz project/

# Restore from backup
tar -xzf project-backup-20240101.tar.gz

# Export project settings
# File → Export → Project Settings → settings.json

# Import project settings
# File → Import → Project Settings → settings.json
```

---

**Need More Help?**

If you're still experiencing issues:

1. **Check GitHub Issues**: [https://github.com/elastic-softworks/worldenv/issues](https://github.com/elastic-softworks/worldenv/issues)
2. **Create Bug Report**: Use the issue template with system info and reproduction steps
3. **Community Support**: Join the Discord server for real-time help
4. **Documentation**: Review [USER-GUIDE.md](USER-GUIDE.md) and [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)
5. **Professional Support**: Contact Elastic Softworks for commercial support

**Before Reporting Issues:**
- Update to the latest version
- Check if the issue exists in a clean project
- Include system information and error logs
- Provide minimal reproduction steps