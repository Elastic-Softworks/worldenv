#!/bin/bash

#
# WORLDEDIT - BUILD AND TEST SCRIPT
# Quick start script for building and testing the editor
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WORLDEDIT BUILD AND TEST${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
SKIP_INSTALL=false
SKIP_BUILD=false
DEV_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --dev)
      DEV_MODE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-install  Skip npm install step"
      echo "  --skip-build    Skip build step (only works if already built)"
      echo "  --dev           Run in development mode with watch"
      echo "  --help          Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Step 1: Check Node.js version
echo -e "${YELLOW}[1/5] Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}ERROR: Node.js version $NODE_VERSION is too old${NC}"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Step 2: Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
    if [ ! -d "node_modules" ]; then
        echo "No node_modules found, running npm install..."
    else
        echo "node_modules exists, running npm install to ensure consistency..."
    fi

    npm install

    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: npm install failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
else
    echo -e "${YELLOW}[2/5] Skipping dependency installation${NC}"
    echo ""
fi

# Step 3: Build the application
if [ "$DEV_MODE" = true ]; then
    echo -e "${YELLOW}[3/5] Starting development mode...${NC}"
    echo "This will start the editor with hot reload enabled."
    echo "Press Ctrl+C to stop."
    echo ""
    npm run dev
    exit 0
fi

if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}[3/5] Building application...${NC}"

    # Clean previous build
    if [ -d "dist" ]; then
        echo "Cleaning previous build..."
        rm -rf dist
    fi

    echo "Building main process..."
    npm run build:main

    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Main process build failed${NC}"
        exit 1
    fi

    echo "Building renderer process..."
    npm run build:renderer

    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: Renderer process build failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Build completed${NC}"
    echo ""
else
    echo -e "${YELLOW}[3/5] Skipping build step${NC}"
    echo ""
fi

# Step 4: Verify build output
echo -e "${YELLOW}[4/5] Verifying build output...${NC}"

ERRORS=0

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ dist/ directory not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ dist/ directory exists${NC}"
fi

if [ ! -f "dist/main/main.js" ]; then
    echo -e "${RED}✗ dist/main/main.js not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ dist/main/main.js exists${NC}"
fi

if [ ! -d "dist/renderer" ]; then
    echo -e "${RED}✗ dist/renderer/ directory not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ dist/renderer/ directory exists${NC}"
fi

if [ ! -f "dist/renderer/index.html" ]; then
    echo -e "${RED}✗ dist/renderer/index.html not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ dist/renderer/index.html exists${NC}"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}ERROR: Build verification failed with $ERRORS error(s)${NC}"
    echo "Please check the build output above for errors."
    exit 1
fi

echo ""

# Step 5: Launch the application
echo -e "${YELLOW}[5/5] Launching WORLDEDIT...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BUILD SUCCESSFUL${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "The editor will launch in a moment."
echo ""
echo "TESTING CHECKLIST:"
echo "1. Verify splash screen shows 'ELASTIC SOFTWORKS 2025'"
echo "2. Verify splash screen shows 'NEW WORLD APPLICATIONS'"
echo "3. Verify splash screen animations (rainbow gradient, logo glow)"
echo "4. Verify all panels are visible (Hierarchy, Viewport, Inspector, Assets)"
echo "5. Verify welcome overlay in viewport with project creation buttons"
echo "6. Open Developer Tools (View > Toggle Developer Tools)"
echo "7. Test menu items and verify console output"
echo "8. Check console for [MENU] messages when clicking menu items"
echo ""
echo "To view console output, check:"
echo "  - Terminal output (main process logs)"
echo "  - Developer Tools Console (renderer process logs)"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop the editor${NC}"
echo ""

npm start
