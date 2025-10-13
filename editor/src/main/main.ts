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

    ipcManager.initialize();

    splashScreen.updateMessage('Setting up UI...');
    splashScreen.updateProgress(40);

    setupMenuHandlers();

    splashScreen.updateMessage('Creating window...');
    splashScreen.updateProgress(60);

    createMainWindow();

    splashScreen.updateMessage('Loading interface...');
    splashScreen.updateProgress(80);

    splashScreen.hideAfter(1000);

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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

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
      if (!mainWindow) {
return;
}

      try {
        const dir_path = await dialogManager.openDirectory(mainWindow, {
          title: 'Select Project Directory',
          properties: ['createDirectory']
        });

        if (!dir_path) {
return;
}

        const project_name = path.basename(dir_path);

        await projectManager.createProject(dir_path, project_name);

        logger.info('MAIN', 'New project created', { path: dir_path });

        ipcManager.sendToWindow(mainWindow, 'project:opened');
      } catch (error) {
        logger.error('MAIN', 'Failed to create project', { error });

        await dialogManager.showError(
          mainWindow,
          'Project Creation Error',
          'Failed to create new project.'
        );
      }
    },

    onOpenProject: async () => {
      if (!mainWindow) {
return;
}

      try {
        const dir_path = await dialogManager.openDirectory(mainWindow, {
          title: 'Open Project'
        });

        if (!dir_path) {
return;
}

        await projectManager.openProject(dir_path);

        logger.info('MAIN', 'Project opened', { path: dir_path });

        ipcManager.sendToWindow(mainWindow, 'project:opened');
      } catch (error) {
        logger.error('MAIN', 'Failed to open project', { error });

        await dialogManager.showError(mainWindow, 'Project Open Error', 'Failed to open project.');
      }
    },

    onSaveProject: async () => {
      if (!mainWindow) {
return;
}

      try {
        if (!projectManager.isProjectOpen()) {
          await dialogManager.showWarning(
            mainWindow,
            'No Project',
            'No project is currently open.'
          );

          return;
        }

        await projectManager.saveProject();

        logger.info('MAIN', 'Project saved');

        ipcManager.sendToWindow(mainWindow, 'project:saved');
      } catch (error) {
        logger.error('MAIN', 'Failed to save project', { error });

        await dialogManager.showError(mainWindow, 'Save Error', 'Failed to save project.');
      }
    },

    onSaveProjectAs: async () => {
      logger.info('MAIN', 'Save project as not yet implemented');
    },

    onCloseProject: async () => {
      if (!mainWindow) {
return;
}

      try {
        if (!projectManager.isProjectOpen()) {
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
            return;
          }
        }

        projectManager.closeProject();

        logger.info('MAIN', 'Project closed');

        ipcManager.sendToWindow(mainWindow, 'project:closed');
      } catch (error) {
        logger.error('MAIN', 'Failed to close project', { error });
      }
    },

    onExit: async () => {
      isQuitting = true;
      app.quit();
    },

    onUndo: () => {
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'edit:undo');
      }
    },

    onRedo: () => {
      if (mainWindow) {
        ipcManager.sendToWindow(mainWindow, 'edit:redo');
      }
    },

    onCut: () => {
      if (mainWindow) {
        mainWindow.webContents.cut();
      }
    },

    onCopy: () => {
      if (mainWindow) {
        mainWindow.webContents.copy();
      }
    },

    onPaste: () => {
      if (mainWindow) {
        mainWindow.webContents.paste();
      }
    },

    onDelete: () => {
      if (mainWindow) {
        mainWindow.webContents.delete();
      }
    },

    onSelectAll: () => {
      if (mainWindow) {
        mainWindow.webContents.selectAll();
      }
    },

    onToggleDevTools: () => {
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    },

    onReload: () => {
      if (mainWindow) {
        mainWindow.webContents.reload();
      }
    },

    onToggleFullScreen: () => {
      if (mainWindow) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      }
    },

    onResetZoom: () => {
      if (mainWindow) {
        mainWindow.webContents.setZoomLevel(0);
      }
    },

    onZoomIn: () => {
      if (mainWindow) {
        const current = mainWindow.webContents.getZoomLevel();
        mainWindow.webContents.setZoomLevel(current + 0.5);
      }
    },

    onZoomOut: () => {
      if (mainWindow) {
        const current = mainWindow.webContents.getZoomLevel();
        mainWindow.webContents.setZoomLevel(current - 0.5);
      }
    },

    onShowDocumentation: () => {
      logger.info('MAIN', 'Documentation not yet implemented');
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
