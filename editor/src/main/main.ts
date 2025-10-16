/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Main Process Entry Point
 *
 * Electron main process initialization and window management.
 * Handles application lifecycle, IPC communication, and system integration.
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { logger, LogLevel } from './logger';
import { windowManager } from './window-manager';
import { menuManager } from './menu';
import { ipcManager } from './ipc';
import { dialogManager } from './dialogs';
import { projectManager } from './project';
import { fileWatcher } from './watcher';
import { autoSave } from './auto-save';
import { splashScreen } from './splash';
import { recentProjectsManager } from './recent-projects';

const isDevelopment = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

/**
 * initializeApplication()
 *
 * Initializes all application systems and modules.
 * Called after app ready event.
 */
async function initializeApplication(): Promise<void> {
  try {
    logger.initialize();

    if (isDevelopment) {
      logger.setLevel(LogLevel.DEBUG);
    }

    logger.info('MAIN', 'Initializing application', {
      version: app.getVersion(),
      environment: isDevelopment ? 'development' : 'production',
      platform: process.platform,
      arch: process.arch
    });

    await splashScreen.show();

    splashScreen.updateMessage('Initializing...');
    splashScreen.updateProgress(20);

    await recentProjectsManager.initialize();

    ipcManager.initialize();

    splashScreen.updateMessage('Setting up UI...');
    splashScreen.updateProgress(40);

    setupMenuHandlers();

    splashScreen.updateMessage('Creating window...');
    splashScreen.updateProgress(60);

    createMainWindow();

    splashScreen.updateMessage('Loading interface...');
    splashScreen.updateProgress(80);

    splashScreen.hideAfter(3000);

    logger.info('MAIN', 'Application initialized successfully');
  } catch (error) {
    logger.fatal('MAIN', 'Application initialization failed', { error });

    dialogManager.showErrorBox(
      'Initialization Error',
      'Failed to initialize WORLDEDIT. Please check the logs for details.'
    );

    app.quit();
  }
}

/**
 * createMainWindow()
 *
 * Creates and configures the main editor window.
 * Sets up window properties, dev tools, and event handlers.
 */
function createMainWindow(): void {
  mainWindow = windowManager.createWindow('main', {
    minWidth: 800,
    minHeight: 600,
    title: 'WORLDEDIT',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:9000');
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    logger.info('MAIN', 'Loading HTML file', htmlPath);

    // Check if HTML file exists
    const fs = require('fs');
    if (fs.existsSync(htmlPath)) {
      logger.info('MAIN', 'HTML file exists, loading...');
      mainWindow.loadFile(htmlPath);
    } else {
      logger.error('MAIN', 'HTML file not found!', htmlPath);
    }
  }

  // Add debugging for renderer process
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error(
      'MAIN',
      'Renderer failed to load',
      `Code: ${errorCode}, Description: ${errorDescription}, URL: ${validatedURL}`
    );
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('MAIN', 'Renderer finished loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    logger.info('MAIN', 'Renderer DOM ready');
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();

      logger.info('MAIN', 'Main window shown');
    }
  });

  mainWindow.on('close', async (event) => {
    if (isQuitting) {
      return;
    }

    if (projectManager.isProjectModified()) {
      event.preventDefault();

      const result = await dialogManager.showSaveConfirm(
        mainWindow,
        'Unsaved Changes',
        'Do you want to save changes to the current project?'
      );

      if (result === 'save') {
        try {
          await projectManager.saveProject();
          isQuitting = true;
          mainWindow?.close();
        } catch (error) {
          logger.error('MAIN', 'Failed to save project before quit', {
            error
          });

          await dialogManager.showError(
            mainWindow,
            'Save Error',
            'Failed to save project. Please try again.'
          );
        }
      } else if (result === 'discard') {
        isQuitting = true;
        mainWindow?.close();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    logger.info('MAIN', 'Main window closed');
  });

  mainWindow.on('blur', () => {
    autoSave.onWindowBlur().catch((error) => {
      logger.error('MAIN', 'Auto-save on blur failed', { error });
    });
  });

  menuManager.buildMenu(mainWindow);
}

/**
 * setupMenuHandlers()
 *
 * Sets up handlers for menu actions.
 */
function setupMenuHandlers(): void {
  menuManager.setHandlers({
    onNewProject: async () => {
      console.log('[MENU] File > New Project');
      if (!mainWindow) {
        return;
      }

      try {
        const dir_path = await dialogManager.openDirectory(mainWindow, {
          title: 'Select Project Directory',
          properties: ['createDirectory']
        });

        if (!dir_path) {
          console.log('[MENU] File > New Project - cancelled by user');
          return;
        }

        const project_name = path.basename(dir_path);

        await projectManager.createProject(dir_path, project_name);

        logger.info('MAIN', 'New project created', { path: dir_path });
        console.log('[MENU] File > New Project - created:', dir_path);

        ipcManager.sendToWindow(mainWindow, 'project:opened');
      } catch (error) {
        logger.error('MAIN', 'Failed to create project', { error });
        console.error('[MENU] File > New Project - error:', error);

        await dialogManager.showError(
          mainWindow,
          'Project Creation Error',
          'Failed to create new project.'
        );
      }
    },

    onOpenProject: async () => {
      console.log('[MENU] File > Open Project');
      if (!mainWindow) {
        return;
      }

      try {
        const dir_path = await dialogManager.openDirectory(mainWindow, {
          title: 'Open Project'
        });

        if (!dir_path) {
          console.log('[MENU] File > Open Project - cancelled by user');
          return;
        }

        await projectManager.openProject(dir_path);

        logger.info('MAIN', 'Project opened', { path: dir_path });
        console.log('[MENU] File > Open Project - opened:', dir_path);

        ipcManager.sendToWindow(mainWindow, 'project:opened');
      } catch (error) {
        logger.error('MAIN', 'Failed to open project', { error });
        console.error('[MENU] File > Open Project - error:', error);

        await dialogManager.showError(mainWindow, 'Project Open Error', 'Failed to open project.');
      }
    },

    onSaveProject: async () => {
      console.log('[MENU] File > Save Project');
      if (!mainWindow) {
        return;
      }

      try {
        if (!projectManager.isProjectOpen()) {
          console.log('[MENU] File > Save Project - no project open');
          await dialogManager.showWarning(
            mainWindow,
            'No Project',
            'No project is currently open.'
          );

          return;
        }

        await projectManager.saveProject();

        logger.info('MAIN', 'Project saved');
        console.log('[MENU] File > Save Project - saved successfully');

        ipcManager.sendToWindow(mainWindow, 'project:saved');
      } catch (error) {
        logger.error('MAIN', 'Failed to save project', { error });
        console.error('[MENU] File > Save Project - error:', error);

        await dialogManager.showError(mainWindow, 'Save Error', 'Failed to save project.');
      }
    },

    onSaveProjectAs: async () => {
      console.log('[MENU] File > Save Project As (not implemented yet)');
      logger.info('MAIN', 'Save project as not yet implemented');
    },

    onCloseProject: async () => {
      console.log('[MENU] File > Close Project');
      if (!mainWindow) {
        return;
      }

      try {
        if (!projectManager.isProjectOpen()) {
          console.log('[MENU] File > Close Project - no project open');
          return;
        }

        if (projectManager.isProjectModified()) {
          const result = await dialogManager.showSaveConfirm(
            mainWindow,
            'Unsaved Changes',
            'Do you want to save changes before closing?'
          );

          if (result === 'save') {
            await projectManager.saveProject();
          } else if (result === 'cancel') {
            console.log('[MENU] File > Close Project - cancelled by user');
            return;
          }
        }

        projectManager.closeProject();

        logger.info('MAIN', 'Project closed');
        console.log('[MENU] File > Close Project - closed successfully');

        ipcManager.sendToWindow(mainWindow, 'project:closed');
      } catch (error) {
        logger.error('MAIN', 'Failed to close project', { error });
        console.error('[MENU] File > Close Project - error:', error);
      }
    },

    onExit: async () => {
      console.log('[MENU] File > Exit');
      isQuitting = true;
      app.quit();
    },

    onUndo: () => {
      logger.info('MAIN', 'Edit menu: Undo requested');
      console.log('[MENU] Edit > Undo');
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'edit:undo');
      }
    },

    onRedo: () => {
      logger.info('MAIN', 'Edit menu: Redo requested');
      console.log('[MENU] Edit > Redo');
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'edit:redo');
      }
    },

    onCut: () => {
      logger.info('MAIN', 'Edit menu: Cut requested');
      console.log('[MENU] Edit > Cut');
      if (mainWindow) {
        mainWindow.webContents.cut();
      }
    },

    onCopy: () => {
      logger.info('MAIN', 'Edit menu: Copy requested');
      console.log('[MENU] Edit > Copy');
      if (mainWindow) {
        mainWindow.webContents.copy();
      }
    },

    onPaste: () => {
      logger.info('MAIN', 'Edit menu: Paste requested');
      console.log('[MENU] Edit > Paste');
      if (mainWindow) {
        mainWindow.webContents.paste();
      }
    },

    onDelete: () => {
      logger.info('MAIN', 'Edit menu: Delete requested');
      console.log('[MENU] Edit > Delete');
      if (mainWindow) {
        mainWindow.webContents.delete();
      }
    },

    onSelectAll: () => {
      logger.info('MAIN', 'Edit menu: Select All requested');
      console.log('[MENU] Edit > Select All');
      if (mainWindow) {
        mainWindow.webContents.selectAll();
      }
    },

    onToggleDevTools: () => {
      logger.info('MAIN', 'View menu: Toggle Developer Tools requested');
      console.log('[MENU] View > Toggle Developer Tools');
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    },

    onReload: () => {
      logger.info('MAIN', 'View menu: Reload requested');
      console.log('[MENU] View > Reload');
      if (mainWindow) {
        mainWindow.webContents.reload();
      }
    },

    onToggleFullScreen: () => {
      const isFullScreen = mainWindow?.isFullScreen() || false;
      logger.info(
        'MAIN',
        `View menu: Toggle fullscreen (currently ${isFullScreen ? 'on' : 'off'})`
      );
      console.log(`[MENU] View > Toggle Fullscreen (${isFullScreen ? 'exit' : 'enter'})`);
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    },

    onResetZoom: () => {
      logger.info('MAIN', 'View menu: Reset Zoom requested');
      console.log('[MENU] View > Reset Zoom');
      if (mainWindow) {
        mainWindow.webContents.setZoomLevel(0);
      }
    },

    onZoomIn: () => {
      if (mainWindow) {
        const current = mainWindow.webContents.getZoomLevel();
        const newLevel = current + 0.5;
        logger.info('MAIN', `View menu: Zoom In (${current} -> ${newLevel})`);
        console.log(`[MENU] View > Zoom In (${current.toFixed(1)} -> ${newLevel.toFixed(1)})`);
        mainWindow.webContents.setZoomLevel(newLevel);
      }
    },

    onZoomOut: () => {
      if (mainWindow) {
        const current = mainWindow.webContents.getZoomLevel();
        const newLevel = current - 0.5;
        logger.info('MAIN', `View menu: Zoom Out (${current} -> ${newLevel})`);
        console.log(`[MENU] View > Zoom Out (${current.toFixed(1)} -> ${newLevel.toFixed(1)})`);
        mainWindow.webContents.setZoomLevel(newLevel);
      }
    },

    onShowDocumentation: () => {
      logger.info('MAIN', 'Help menu: Show Documentation requested (not yet implemented)');
      console.log('[MENU] Help > Documentation (not implemented yet)');
    },

    onShowAbout: async () => {
      if (!mainWindow) {
        return;
      }

      await dialogManager.showInfo(
        mainWindow,
        'About WORLDEDIT',
        `WORLDEDIT v${app.getVersion()}\n\nGame development editor for WORLDENV engine.`,
        'Copyright © 2025 Elastic Softworks'
      );
    },

    onBuildProject: () => {
      logger.info('MAIN', 'Build menu: Build Project requested');
      console.log('[MENU] Build > Build Project');
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'menu:build-project');
      }
    },

    onBuildConfiguration: () => {
      logger.info('MAIN', 'Build menu: Build Configuration requested');
      console.log('[MENU] Build > Build Configuration');
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'menu:build-configuration');
      }
    },

    onOpenBuildLocation: () => {
      logger.info('MAIN', 'Build menu: Open Build Location requested');
      console.log('[MENU] Build > Open Build Location');
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'menu:open-build-location');
      }
    }
  });
}

/**
 * Application event handlers
 */

app.on('ready', () => {
  initializeApplication().catch((error) => {
    console.error('[MAIN] Fatal initialization error:', error);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  fileWatcher.unwatchAll();
  autoSave.stop();
  logger.shutdown();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

/**
 * Error handling
 */

process.on('uncaughtException', (error) => {
  logger.fatal('MAIN', 'Uncaught exception', { error });

  dialogManager.showErrorBox('Fatal Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('MAIN', 'Unhandled rejection', { reason });
});
