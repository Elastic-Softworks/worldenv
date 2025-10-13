/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - IPC Handlers
 *
 * Inter-process communication handlers between main and renderer processes.
 * Provides safe API for file system, dialogs, and project operations.
 */

import { ipcMain, BrowserWindow, app } from 'electron';
import { logger } from './logger';
import { fileSystem } from './file-system';
import { dialogManager } from './dialogs';
import { projectManager } from './project';
import { fileWatcher } from './watcher';
import { autoSave } from './auto-save';
// Asset manager placeholder - types defined inline
interface AssetImportOptions {
  preserveStructure?: boolean;
  generateThumbnails?: boolean;
  overwriteExisting?: boolean;
}

interface AssetSearchOptions {
  query?: string;
  types?: string[];
  tags?: string[];
  recursive?: boolean;
}

interface AssetMetadata {
  name?: string;
  description?: string;
  tags?: string[];
  [key: string]: unknown;
}

const assetManager = {
  async importAssets(
    filePaths: string[],
    options?: AssetImportOptions
  ): Promise<{ success: boolean; imported: string[] }> {
    console.log('Asset import placeholder:', filePaths, options);
    await Promise.resolve();
    return { success: true, imported: filePaths };
  },
  async searchAssets(options: AssetSearchOptions): Promise<unknown[]> {
    console.log('Asset search placeholder:', options);
    await Promise.resolve();
    return [];
  },
  updateAssetMetadata(path: string, metadata: Partial<AssetMetadata>): void {
    console.log('Asset metadata update placeholder:', path, metadata);
  },
  async listAssets(path: string): Promise<unknown[]> {
    console.log('Asset list placeholder:', path);
    await Promise.resolve();
    return [];
  },
  async deleteAsset(path: string): Promise<void> {
    console.log('Asset delete placeholder:', path);
    await Promise.resolve();
  },
  getAssetMetadata(path: string): Record<string, unknown> {
    console.log('Asset get metadata placeholder:', path);
    return {};
  },
  setProjectPath(path: string | null): void {
    console.log('Asset set project path placeholder:', path);
  },
  async initializeAssetDirectory(path: string): Promise<void> {
    console.log('Asset initialize directory placeholder:', path);
    await Promise.resolve();
  },
  createFolder(name: string, parentPath: string): string {
    console.log('Asset create folder placeholder:', name, parentPath);
    return `${parentPath}/${name}`;
  },
  renameAsset(oldPath: string, newName: string): string {
    console.log('Asset rename placeholder:', oldPath, newName);
    return `${oldPath.split('/').slice(0, -1).join('/')}/${newName}`;
  },
  getThumbnailPath(assetPath: string): string {
    console.log('Asset get thumbnail placeholder:', assetPath);
    return `${assetPath}.thumb.png`;
  }
};
import { DialogOptions, MessageDialogOptions } from '../shared/types';

class IPCManager {
  private initialized: boolean;

  constructor() {
    this.initialized = false;
  }

  /**
   * initialize()
   *
   * Registers all IPC handlers.
   * Called once during application startup.
   */
  public initialize(): void {
    if (this.initialized) {
      logger.warn('IPC', 'IPC handlers already initialized');
      return;
    }

    this.registerAppHandlers();
    this.registerFileSystemHandlers();
    this.registerDialogHandlers();
    this.registerProjectHandlers();
    this.registerAssetHandlers();
    this.registerEngineHandlers();

    this.initialized = true;

    logger.info('IPC', 'IPC handlers initialized');
  }

  /**
   * registerAppHandlers()
   *
   * Registers application-level IPC handlers.
   */
  private registerAppHandlers(): void {
    ipcMain.handle('app:get-version', () => {
      try {
        return app.getVersion();
      } catch (error) {
        logger.error('IPC', 'Failed to get app version', { error });
        throw error;
      }
    });

    ipcMain.handle('app:get-path', (_event, name: string) => {
      try {
        return app.getPath(
          name as
            | 'home'
            | 'appData'
            | 'userData'
            | 'temp'
            | 'exe'
            | 'desktop'
            | 'documents'
            | 'downloads'
        );
      } catch (error) {
        logger.error('IPC', 'Failed to get app path', { name, error });
        throw error;
      }
    });

    ipcMain.handle('app:get-locale', () => {
      try {
        return app.getLocale();
      } catch (error) {
        logger.error('IPC', 'Failed to get locale', { error });
        throw error;
      }
    });

    ipcMain.handle('app:quit', () => {
      try {
        logger.info('IPC', 'Application quit requested');
        app.quit();
      } catch (error) {
        logger.error('IPC', 'Failed to quit app', { error });
        throw error;
      }
    });
  }

  /**
   * registerFileSystemHandlers()
   *
   * Registers file system operation IPC handlers.
   */
  private registerFileSystemHandlers(): void {
    ipcMain.handle('fs:read-file', async (_event, path: string) => {
      try {
        const content = await fileSystem.readFile(path);
        return content;
      } catch (error) {
        logger.error('IPC', 'File read failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:write-file', async (_event, args: { path: string; content: string }) => {
      try {
        await fileSystem.writeFile(args.path, args.content, {
          create_dirs: true
        });
      } catch (error) {
        logger.error('IPC', 'File write failed', {
          path: args.path,
          error
        });
        throw error;
      }
    });

    ipcMain.handle('fs:read-json', async (_event, path: string) => {
      try {
        const data = await fileSystem.readJSON(path);
        return data;
      } catch (error) {
        logger.error('IPC', 'JSON read failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:write-json', async (_event, args: { path: string; data: unknown }) => {
      try {
        await fileSystem.writeJSON(args.path, args.data, {
          create_dirs: true
        });
      } catch (error) {
        logger.error('IPC', 'JSON write failed', {
          path: args.path,
          error
        });
        throw error;
      }
    });

    ipcMain.handle('fs:exists', async (_event, path: string) => {
      try {
        return await fileSystem.exists(path);
      } catch (error) {
        logger.error('IPC', 'Exists check failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:is-file', async (_event, path: string) => {
      try {
        return await fileSystem.isFile(path);
      } catch (error) {
        logger.error('IPC', 'Is-file check failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:is-directory', async (_event, path: string) => {
      try {
        return await fileSystem.isDirectory(path);
      } catch (error) {
        logger.error('IPC', 'Is-directory check failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:list-directory', async (_event, path: string) => {
      try {
        return await fileSystem.listDirectory(path);
      } catch (error) {
        logger.error('IPC', 'Directory listing failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:ensure-directory', async (_event, path: string) => {
      try {
        await fileSystem.ensureDirectory(path);
      } catch (error) {
        logger.error('IPC', 'Directory creation failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:delete-file', async (_event, path: string) => {
      try {
        await fileSystem.deleteFile(path);
      } catch (error) {
        logger.error('IPC', 'File deletion failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:delete-directory', async (_event, path: string) => {
      try {
        await fileSystem.deleteDirectory(path);
      } catch (error) {
        logger.error('IPC', 'Directory deletion failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('fs:get-stats', async (_event, path: string) => {
      try {
        const stats = await fileSystem.getFileStats(path);

        return {
          size: stats.size,
          is_file: stats.isFile(),
          is_directory: stats.isDirectory(),
          created: stats.birthtime.getTime(),
          modified: stats.mtime.getTime(),
          accessed: stats.atime.getTime()
        };
      } catch (error) {
        logger.error('IPC', 'Get stats failed', { path, error });
        throw error;
      }
    });
  }

  /**
   * registerDialogHandlers()
   *
   * Registers dialog operation IPC handlers.
   */
  private registerDialogHandlers(): void {
    ipcMain.handle('dialog:open-file', async (event, options: DialogOptions) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        return await dialogManager.openFile(window, options);
      } catch (error) {
        logger.error('IPC', 'Open file dialog failed', { error });
        throw error;
      }
    });

    ipcMain.handle('dialog:open-files', async (event, options: DialogOptions) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        return await dialogManager.openFiles(window, options);
      } catch (error) {
        logger.error('IPC', 'Open files dialog failed', { error });
        throw error;
      }
    });

    ipcMain.handle('dialog:save-file', async (event, options: DialogOptions) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        return await dialogManager.saveFile(window, options);
      } catch (error) {
        logger.error('IPC', 'Save file dialog failed', { error });
        throw error;
      }
    });

    ipcMain.handle('dialog:open-directory', async (event, options: DialogOptions) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        return await dialogManager.openDirectory(window, options);
      } catch (error) {
        logger.error('IPC', 'Open directory dialog failed', { error });
        throw error;
      }
    });

    ipcMain.handle('dialog:show-message', async (event, options: MessageDialogOptions) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        return await dialogManager.showMessage(window, options);
      } catch (error) {
        logger.error('IPC', 'Show message dialog failed', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'dialog:show-error',
      async (event, args: { title: string; message: string; detail?: string }) => {
        try {
          const window = BrowserWindow.fromWebContents(event.sender);
          await dialogManager.showError(window, args.title, args.message, args.detail);
        } catch (error) {
          logger.error('IPC', 'Show error dialog failed', { error });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'dialog:show-confirm',
      async (event, args: { title: string; message: string; detail?: string }) => {
        try {
          const window = BrowserWindow.fromWebContents(event.sender);
          return await dialogManager.showConfirm(window, args.title, args.message, args.detail);
        } catch (error) {
          logger.error('IPC', 'Show confirm dialog failed', { error });
          throw error;
        }
      }
    );
  }

  /**
   * registerProjectHandlers()
   *
   * Registers project operation IPC handlers.
   */
  private registerProjectHandlers(): void {
    ipcMain.handle('project:create', async (_event, args: { path: string; name: string }) => {
      try {
        const project = await projectManager.createProject(args.path, args.name);

        assetManager.setProjectPath(args.path);
        await assetManager.initializeAssetDirectory(args.path);
        fileWatcher.watch(args.path);
        autoSave.start();

        return project;
      } catch (error) {
        logger.error('IPC', 'Project creation failed', {
          path: args.path,
          error
        });
        throw error;
      }
    });

    ipcMain.handle('project:open', async (_event, path: string) => {
      try {
        const project = await projectManager.openProject(path);

        assetManager.setProjectPath(path);
        fileWatcher.watch(path);
        autoSave.start();

        return project;
      } catch (error) {
        logger.error('IPC', 'Project open failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('project:save', async () => {
      try {
        await projectManager.saveProject();
      } catch (error) {
        logger.error('IPC', 'Project save failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:close', async () => {
      try {
        const project = projectManager.getCurrentProject();

        if (project) {
          fileWatcher.unwatch(project.path);
        }

        assetManager.setProjectPath(null);
        await Promise.resolve();
        autoSave.stop();
        projectManager.closeProject();
      } catch (error) {
        logger.error('IPC', 'Project close failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:get-current', () => {
      try {
        const project = projectManager.getCurrentProject();
        return project ? project.data : null;
      } catch (error) {
        logger.error('IPC', 'Get current project failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:is-open', () => {
      try {
        return projectManager.isProjectOpen();
      } catch (error) {
        logger.error('IPC', 'Is project open check failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:is-modified', () => {
      try {
        return projectManager.isProjectModified();
      } catch (error) {
        logger.error('IPC', 'Is project modified check failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:mark-modified', () => {
      try {
        projectManager.markModified();
      } catch (error) {
        logger.error('IPC', 'Mark project modified failed', { error });
        throw error;
      }
    });
  }

  /**
   * registerAssetHandlers()
   *
   * Registers asset management IPC handlers.
   */
  private registerAssetHandlers(): void {
    ipcMain.handle('asset:list', async (_event, relativePath: string = '') => {
      try {
        return await assetManager.listAssets(relativePath);
      } catch (error) {
        logger.error('IPC', 'Asset list failed', { relativePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'asset:import',
      async (_event, args: { filePaths: string[]; options?: unknown }) => {
        try {
          return await assetManager.importAssets(
            args.filePaths,
            args.options as AssetImportOptions
          );
        } catch (error) {
          logger.error('IPC', 'Asset import failed', { filePaths: args.filePaths, error });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'asset:create-folder',
      async (_event, args: { relativePath: string; name: string }) => {
        try {
          return await assetManager.createFolder(args.relativePath, args.name);
        } catch (error) {
          logger.error('IPC', 'Asset create folder failed', { args, error });
          throw error;
        }
      }
    );

    ipcMain.handle('asset:rename', async (_event, args: { oldPath: string; newName: string }) => {
      try {
        await Promise.resolve();
        return assetManager.renameAsset(args.oldPath, args.newName);
      } catch (error) {
        logger.error('IPC', 'Asset rename failed', { args, error });
        throw error;
      }
    });

    ipcMain.handle('asset:delete', async (_event, relativePath: string) => {
      try {
        await assetManager.deleteAsset(relativePath);
      } catch (error) {
        logger.error('IPC', 'Asset delete failed', { relativePath, error });
        throw error;
      }
    });

    ipcMain.handle('asset:search', async (_event, options: unknown) => {
      try {
        return await assetManager.searchAssets(options as AssetSearchOptions);
      } catch (error) {
        logger.error('IPC', 'Asset search failed', { options, error });
        throw error;
      }
    });

    ipcMain.handle('asset:get-metadata', (_event, relativePath: string) => {
      try {
        return assetManager.getAssetMetadata(relativePath);
      } catch (error) {
        logger.error('IPC', 'Asset get metadata failed', { relativePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'asset:update-metadata',
      (_event, args: { relativePath: string; metadata: unknown }) => {
        try {
          assetManager.updateAssetMetadata(
            args.relativePath,
            args.metadata as Partial<AssetMetadata>
          );
        } catch (error) {
          logger.error('IPC', 'Asset update metadata failed', { args, error });
          throw error;
        }
      }
    );

    ipcMain.handle('asset:get-thumbnail', (_event, assetPath: string) => {
      try {
        return assetManager.getThumbnailPath(assetPath);
      } catch (error) {
        logger.error('IPC', 'Asset get thumbnail failed', { assetPath, error });
        throw error;
      }
    });
  }

  /**
   * registerEngineHandlers()
   *
   * Registers engine operation IPC handlers.
   */
  private registerEngineHandlers(): void {
    ipcMain.handle(
      'engine:export-scene',
      async (_event, args: { sceneData: unknown; options?: unknown }) => {
        try {
          // For now, just return the scene data as-is
          // In a full implementation, this would use SceneSerializer
          await Promise.resolve();
          return {
            success: true,
            data: args.sceneData,
            format: 'worldenv-scene',
            exportedAt: new Date().toISOString()
          };
        } catch (error) {
          logger.error('IPC', 'Scene export failed', { error });
          throw error;
        }
      }
    );

    ipcMain.handle('engine:validate-scene', async (_event, sceneData: unknown) => {
      try {
        // Basic validation - in full implementation would use SceneSerializer
        await Promise.resolve();
        if (!sceneData || typeof sceneData !== 'object') {
          return {
            isValid: false,
            errors: [{ type: 'error', message: 'Invalid scene data format' }],
            warnings: []
          };
        }

        return {
          isValid: true,
          errors: [],
          warnings: []
        };
      } catch (error) {
        logger.error('IPC', 'Scene validation failed', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'engine:save-scene',
      async (_event, args: { path: string; sceneData: unknown }) => {
        try {
          await fileSystem.writeJSON(args.path, args.sceneData, {
            create_dirs: true
          });

          logger.info('IPC', 'Scene saved', { path: args.path });
        } catch (error) {
          logger.error('IPC', 'Scene save failed', { path: args.path, error });
          throw error;
        }
      }
    );

    ipcMain.handle('engine:load-scene', async (_event, path: string) => {
      try {
        const sceneData = await fileSystem.readJSON(path);
        logger.info('IPC', 'Scene loaded', { path });
        return sceneData;
      } catch (error) {
        logger.error('IPC', 'Scene load failed', { path, error });
        throw error;
      }
    });

    ipcMain.handle('engine:get-engine-info', () => {
      try {
        return {
          version: '0.1.0-prealpha',
          features: ['3D', '2D', 'Physics', 'Audio', 'Scripting'],
          formats: ['worldenv-scene'],
          status: 'development'
        };
      } catch (error) {
        logger.error('IPC', 'Get engine info failed', { error });
        throw error;
      }
    });
  }

  /**
   * sendToWindow()
   *
   * Sends message to specific window.
   */
  public sendToWindow(window: BrowserWindow, channel: string, ...args: unknown[]): void {
    if (window.isDestroyed()) {
      logger.warn('IPC', 'Cannot send to destroyed window', { channel });
      return;
    }

    try {
      window.webContents.send(channel, ...args);
    } catch (error) {
      logger.error('IPC', 'Failed to send message', { channel, error });
    }
  }

  /**
   * sendToAllWindows()
   *
   * Broadcasts message to all windows.
   */
  public sendToAllWindows(channel: string, ...args: unknown[]): void {
    const windows = BrowserWindow.getAllWindows();

    for (const window of windows) {
      this.sendToWindow(window, channel, ...args);
    }
  }
}

export const ipcManager = new IPCManager();
