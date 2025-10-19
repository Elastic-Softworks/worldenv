/*
   ===============================================================
   WORLDEDIT IPC HANDLERS
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import { ipcMain, BrowserWindow, app } from 'electron'; /* ELECTRON FRAMEWORK */
import * as fs from 'fs'; /* FILESYSTEM OPERATIONS */
import * as path from 'path'; /* PATH UTILITIES */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { fileSystem } from './file-system'; /* FILE SYSTEM ABSTRACTION */
import { dialogManager } from './dialogs'; /* DIALOG MANAGEMENT */
import { projectManager } from './project'; /* PROJECT SYSTEM */
import { assetManager } from './asset-manager'; /* ASSET MANAGEMENT */
import { fileWatcher } from './watcher'; /* FILE WATCHING */
import { autoSave } from './auto-save'; /* AUTO SAVE SYSTEM */
import { recentProjectsManager } from './recent-projects'; /* RECENT PROJECTS */
import { buildManager } from './build-manager'; /* BUILD SYSTEM */
import { EngineStatusManager } from './engine/EngineStatusManager'; /* ENGINE STATUS */
import { SceneManager } from './scene-manager'; /* SCENE MANAGEMENT */
import { projectBackupManager } from './project-backup'; /* PROJECT BACKUP */
import { projectValidator } from './project-validator'; /* PROJECT VALIDATION */
import { fileHistoryManager } from './file-history'; /* FILE HISTORY */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         AssetImportOptions
	       ---
	       configuration interface for asset import operations
	       controlling how assets are processed and organized
	       during the import workflow.

*/

interface AssetImportOptions {
  preserveStructure: boolean /* maintain original directory structure */;
  generateThumbnails: boolean;
  overwriteExisting: boolean;
  targetFolder?: string;
}

interface AssetSearchOptions {
  query: string;
  types: AssetType[];
  tags: string[];
  folder?: string;
  recursive: boolean;
}

/* AssetMetadata is now imported from shared/types.ts */

import { DialogOptions, MessageDialogOptions, AssetMetadata, AssetType } from '../shared/types';

interface WorldCCompilationEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  file: string;
  message?: string;
  progress?: number;
  errors?: string[];
  warnings?: string[];
}

class IPCManager {
  private initialized: boolean;
  private worldcWatcher: Map<string, NodeJS.Timeout>;

  constructor() {
    this.initialized = false;
    this.worldcWatcher = new Map();
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
    this.registerScriptHandlers();
    this.registerFileCreationHandlers();
    this.registerProjectManagementHandlers();
    this.registerBuildHandlers();
    this.registerWorldCHandlers();
    this.registerSceneHandlers();

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

    ipcMain.handle('app:get-recent-projects', async () => {
      try {
        return recentProjectsManager.getProjects();
      } catch (error) {
        logger.error('IPC', 'Failed to get recent projects', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'app:add-recent-project',
      async (_event, project: { name: string; path: string }) => {
        try {
          await recentProjectsManager.addProject(project.path, project.name);
        } catch (error) {
          logger.error('IPC', 'Failed to add recent project', { error });
          throw error;
        }
      }
    );

    ipcMain.handle('app:remove-recent-project', async (_event, path: string) => {
      try {
        await recentProjectsManager.removeProject(path);
      } catch (error) {
        logger.error('IPC', 'Failed to remove recent project', { error });
        throw error;
      }
    });

    ipcMain.handle('app:clear-recent-projects', async () => {
      try {
        await recentProjectsManager.clearAll();
      } catch (error) {
        logger.error('IPC', 'Failed to clear recent projects', { error });
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
        await assetManager.initializeAssetDirectory();
        fileWatcher.watch(args.path);
        autoSave.start();

        await recentProjectsManager.addProject(args.path, args.name);

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

        await recentProjectsManager.addProject(path, project.name);

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

    ipcMain.handle('project:mark-modified', async () => {
      try {
        projectManager.markModified();
      } catch (error) {
        logger.error('IPC', 'Failed to mark project modified', { error });
        throw error;
      }
    });

    ipcMain.handle('project:update-settings', async (_event, settings: unknown) => {
      try {
        projectManager.updateProjectData((data) => ({
          ...data,
          settings: settings as any
        }));
        await projectManager.saveProject();
      } catch (error) {
        logger.error('IPC', 'Failed to update project settings', { error });
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
    // NOTE: Engine handlers moved to EngineCommunicationManager
    // Keeping only non-conflicting handlers here
    /*
    // Engine status handlers - NOW HANDLED BY EngineCommunicationManager
    ipcMain.handle('engine:get-status', () => {
      try {
        const engineStatusManager = EngineStatusManager.getInstance();
        return engineStatusManager.getState();
      } catch (error) {
        logger.error('IPC', 'Get engine status failed', { error });
        throw error;
      }
    });

    ipcMain.handle('engine:get-health-check', () => {
      try {
        const engineStatusManager = EngineStatusManager.getInstance();
        return engineStatusManager.getHealthCheck();
      } catch (error) {
        logger.error('IPC', 'Get health check failed', { error });
        throw error;
      }
    });

    ipcMain.handle('engine:start-initialization', async (_event, options) => {
      try {
        const engineStatusManager = EngineStatusManager.getInstance();
        engineStatusManager.startInitialization(options);
        logger.info('IPC', 'Engine initialization started', { options });
      } catch (error) {
        logger.error('IPC', 'Engine initialization failed', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'engine:complete-initialization',
      async (_event, capabilities) => {
        try {
          const engineStatusManager = EngineStatusManager.getInstance();
          engineStatusManager.completeInitialization(capabilities);
          logger.info('IPC', 'Engine initialization completed', {
            capabilities
          });
        } catch (error) {
          logger.error('IPC', 'Engine initialization completion failed', {
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('engine:set-error', async (_event, error: string) => {
      try {
        const engineStatusManager = EngineStatusManager.getInstance();
        engineStatusManager.setError(error);
        logger.error('IPC', 'Engine error set', { error });
      } catch (error) {
        logger.error('IPC', 'Set engine error failed', { error });
        throw error;
      }
    });

    ipcMain.handle('engine:validate-scene', async (_event, sceneData: unknown) => {
      try {
        // Basic validation - in full implementation would use SceneSerializer
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
    */
  }

  /**
   * registerScriptHandlers()
   *
   * Registers script management IPC handlers.
   */
  private registerScriptHandlers(): void {
    ipcMain.handle('script:read-file', async (_event, filePath: string) => {
      try {
        const content = await fileSystem.readFile(filePath);
        logger.info('IPC', 'Script file read', { path: filePath });
        return content;
      } catch (error) {
        logger.error('IPC', 'Script file read failed', { path: filePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'script:write-file',
      async (_event, args: { filePath: string; content: string }) => {
        try {
          await fileSystem.writeFile(args.filePath, args.content, {
            create_dirs: true
          });
          logger.info('IPC', 'Script file written', { path: args.filePath });
        } catch (error) {
          logger.error('IPC', 'Script file write failed', {
            path: args.filePath,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'script:create-new',
      async (_event, scriptType: 'typescript' | 'assemblyscript' | 'worldc') => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          const scriptsDir = path.join(project.path, 'scripts');
          await fileSystem.ensureDirectory(scriptsDir);

          const extension =
            scriptType === 'typescript'
              ? '.ts'
              : scriptType === 'assemblyscript'
                ? '.as.ts'
                : '.wc';
          let counter = 1;
          let scriptPath: string;

          do {
            const fileName = `NewScript${counter}${extension}`;
            scriptPath = path.join(scriptsDir, fileName);
            counter++;
          } while (await fileSystem.exists(scriptPath));

          let templateContent: string;
          if (scriptType === 'worldc') {
            templateContent = `#include <worldenv.h>

/*
 * WorldC Script - ${path.basename(scriptPath, extension)}
 *
 * This is a WorldC script file with C-like syntax.
 */

class NewComponent : public Component {

  private:
    // Private member variables

  public:

    void start(): void {
      // Component initialization
    }

    void update(float deltaTime): void {
      // Update logic called every frame
    }

};
`;
          } else {
            templateContent = this.getScriptTemplate(scriptType as 'typescript' | 'assemblyscript');
          }
          await fileSystem.writeFile(scriptPath, templateContent, { create_dirs: true });

          logger.info('IPC', 'New script created', { path: scriptPath, type: scriptType });
          return scriptPath;
        } catch (error) {
          logger.error('IPC', 'Script creation failed', { scriptType, error });
          throw error;
        }
      }
    );

    ipcMain.handle('script:delete-file', async (_event, filePath: string) => {
      try {
        await fileSystem.deleteFile(filePath);
        logger.info('IPC', 'Script file deleted', { path: filePath });
      } catch (error) {
        logger.error('IPC', 'Script file deletion failed', { path: filePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'script:rename-file',
      async (_event, args: { oldPath: string; newPath: string }) => {
        try {
          await fs.promises.rename(args.oldPath, args.newPath);
          logger.info('IPC', 'Script file renamed', {
            oldPath: args.oldPath,
            newPath: args.newPath
          });
        } catch (error) {
          logger.error('IPC', 'Script file rename failed', {
            oldPath: args.oldPath,
            newPath: args.newPath,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'script:validate-worldc',
      async (_event, args: { sourceCode: string; filePath: string }) => {
        try {
          const { WCCompilerIntegration } = await import('./engine/WCCompilerIntegration');
          const compiler = new WCCompilerIntegration();

          if (!compiler.isReady()) {
            await compiler.initialize();
          }

          const result = await compiler.validateSource(args.sourceCode, args.filePath);

          logger.info('IPC', 'WorldC validation complete', {
            path: args.filePath,
            success: result.valid,
            diagnostics: result.diagnostics.length
          });

          return {
            success: result.valid,
            diagnostics: result.diagnostics.map((d) => ({
              severity: d.severity,
              message: d.message,
              line: d.line || 1,
              column: d.column || 1,
              endLine: d.line || 1,
              endColumn: (d.column || 1) + 1,
              code: d.code
            }))
          };
        } catch (error) {
          logger.error('IPC', 'WorldC validation failed', {
            path: args.filePath,
            error
          });
          return {
            success: false,
            diagnostics: [
              {
                severity: 'error' as const,
                message: error instanceof Error ? error.message : 'Validation failed',
                line: 1,
                column: 1
              }
            ]
          };
        }
      }
    );

    ipcMain.handle(
      'script:compile-worldc',
      async (_event, args: { sourceCode: string; filePath: string; target?: string }) => {
        try {
          const { WCCompilerIntegration, CompilationTarget } = await import(
            './engine/WCCompilerIntegration'
          );
          const compiler = new WCCompilerIntegration();

          if (!compiler.isReady()) {
            await compiler.initialize();
          }

          const target =
            args.target === 'assemblyscript'
              ? CompilationTarget.ASSEMBLYSCRIPT
              : CompilationTarget.TYPESCRIPT;

          const result = await compiler.compile({
            sourceCode: args.sourceCode,
            filename: args.filePath,
            target
          });

          logger.info('IPC', 'WorldC compilation complete', {
            path: args.filePath,
            target: args.target,
            success: result.success
          });

          return {
            success: result.success,
            outputCode: result.outputCode,
            diagnostics: result.diagnostics,
            warnings: result.warnings,
            timing: result.timing
          };
        } catch (error) {
          logger.error('IPC', 'WorldC compilation failed', {
            path: args.filePath,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('script:list-scripts', async (_event) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          return [];
        }

        const scriptsDir = path.join(project.path, 'scripts');
        if (!(await fileSystem.exists(scriptsDir))) {
          return [];
        }

        const files = await fileSystem.listDirectory(scriptsDir);
        const scripts = files.filter(
          (file: string) =>
            file.endsWith('.ts') ||
            file.endsWith('.js') ||
            file.endsWith('.wc') ||
            file.endsWith('.as.ts')
        );

        logger.info('IPC', 'Scripts listed', { count: scripts.length });
        return scripts.map((file: string) => path.join(scriptsDir, file));
      } catch (error) {
        logger.error('IPC', 'List scripts failed', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'script:attach-to-entity',
      async (_event, args: { entityId: string; scriptPath: string; properties?: any }) => {
        try {
          const { ScriptComponent } = await import('./engine/ScriptComponent');
          const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');

          const properties = {
            scriptPath: args.scriptPath,
            autoCompile: true,
            enableHotReload: true,
            executionOrder: 0,
            enabledPhases: ['start', 'update', 'destroy'] as any[],
            customProperties: args.properties || {}
          };

          const scriptComponent = new ScriptComponent(args.entityId, properties);
          const scriptSystem = ScriptSystemManager.getInstance();

          await scriptSystem.registerScript(args.entityId, scriptComponent);

          logger.info('IPC', 'Script attached to entity', {
            entityId: args.entityId,
            scriptPath: args.scriptPath
          });

          return scriptComponent.toComponentData();
        } catch (error) {
          logger.error('IPC', 'Failed to attach script to entity', {
            entityId: args.entityId,
            scriptPath: args.scriptPath,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('script:detach-from-entity', async (_event, args: { entityId: string }) => {
      try {
        const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');

        const scriptSystem = ScriptSystemManager.getInstance();
        await scriptSystem.unregisterScript(args.entityId);

        logger.info('IPC', 'Script detached from entity', { entityId: args.entityId });
      } catch (error) {
        logger.error('IPC', 'Failed to detach script from entity', {
          entityId: args.entityId,
          error
        });
        throw error;
      }
    });

    ipcMain.handle(
      'script:update-component-properties',
      async (_event, args: { entityId: string; properties: any }) => {
        try {
          const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');

          const scriptSystem = ScriptSystemManager.getInstance();
          const scripts = scriptSystem.getRegisteredScripts();
          const script = scripts.find((s) => {
            const data = s.toComponentData();
            return data.properties.entityId === args.entityId;
          });

          if (script) {
            for (const [key, value] of Object.entries(args.properties)) {
              await script.setProperty(key, value, true);
            }
          }

          logger.info('IPC', 'Script component properties updated', {
            entityId: args.entityId,
            properties: Object.keys(args.properties)
          });
        } catch (error) {
          logger.error('IPC', 'Failed to update script component properties', {
            entityId: args.entityId,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('script:get-system-stats', async (_event) => {
      try {
        const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');

        const scriptSystem = ScriptSystemManager.getInstance();
        const stats = scriptSystem.getExecutionStats();

        logger.info('IPC', 'Script system stats retrieved');
        return stats;
      } catch (error) {
        logger.error('IPC', 'Failed to get script system stats', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'script:execute-lifecycle-phase',
      async (_event, args: { phase: string; deltaTime?: number }) => {
        try {
          const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');

          const scriptSystem = ScriptSystemManager.getInstance();
          await scriptSystem.executeScripts(args.phase as any, args.deltaTime);

          logger.info('IPC', 'Script lifecycle phase executed', {
            phase: args.phase,
            deltaTime: args.deltaTime
          });
        } catch (error) {
          logger.error('IPC', 'Failed to execute script lifecycle phase', {
            phase: args.phase,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'script:start-debug-session',
      async (_event, args: { filePath: string; breakpoints: any[] }) => {
        try {
          // For now, this is a placeholder for debug functionality
          // In a full implementation, this would start a debug session
          // with the WORLDC compiler/runtime
          logger.info('IPC', 'Debug session started', {
            filePath: args.filePath,
            breakpoints: args.breakpoints.length
          });
        } catch (error) {
          logger.error('IPC', 'Failed to start debug session', {
            filePath: args.filePath,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('script:stop-debug-session', async (_event) => {
      try {
        // Placeholder for stopping debug session
        logger.info('IPC', 'Debug session stopped');
      } catch (error) {
        logger.error('IPC', 'Failed to stop debug session', { error });
        throw error;
      }
    });

    ipcMain.handle('script:continue-debug-session', async (_event) => {
      try {
        // Placeholder for continuing debug session
        logger.info('IPC', 'Debug session continued');
      } catch (error) {
        logger.error('IPC', 'Failed to continue debug session', { error });
        throw error;
      }
    });

    ipcMain.handle('script:step-over', async (_event) => {
      try {
        // Placeholder for step over functionality
        logger.info('IPC', 'Debug step over');
      } catch (error) {
        logger.error('IPC', 'Failed to step over', { error });
        throw error;
      }
    });

    ipcMain.handle('script:step-into', async (_event) => {
      try {
        // Placeholder for step into functionality
        logger.info('IPC', 'Debug step into');
      } catch (error) {
        logger.error('IPC', 'Failed to step into', { error });
        throw error;
      }
    });
  }

  /*
	====================================================================
             --- FILE CREATION HANDLERS ---
	====================================================================
  */

  /**
   * registerFileCreationHandlers()
   *
   * Registers handlers for creating new file types (shaders, materials, prefabs).
   */
  private registerFileCreationHandlers(): void {
    /* Create new shader file */
    ipcMain.handle(
      'file:create-shader',
      async (_event, shaderType: 'vertex' | 'fragment' | 'compute') => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          const shadersDir = path.join(project.path, 'assets', 'shaders');
          await fileSystem.ensureDirectory(shadersDir);

          const extension =
            shaderType === 'compute' ? '.glsl' : shaderType === 'vertex' ? '.vert' : '.frag';
          let counter = 1;
          let shaderPath: string;

          do {
            const fileName = `New${shaderType.charAt(0).toUpperCase() + shaderType.slice(1)}Shader${counter}${extension}`;
            shaderPath = path.join(shadersDir, fileName);
            counter++;
          } while (await fileSystem.exists(shaderPath));

          const templatePath = path.join(
            __dirname,
            '..',
            '..',
            'templates',
            'shaders',
            `${shaderType}.glsl`
          );
          let templateContent: string;

          try {
            templateContent = await fileSystem.readFile(templatePath);
          } catch (error) {
            /* fallback template if file not found */
            templateContent = this.getShaderTemplate(shaderType);
          }

          /* replace template variables */
          const shaderName = path.basename(shaderPath, extension);
          templateContent = templateContent.replace(/\{\{ShaderName\}\}/g, shaderName);

          await fileSystem.writeFile(shaderPath, templateContent, { create_dirs: true });

          logger.info('IPC', 'New shader created', { path: shaderPath, type: shaderType });
          return shaderPath;
        } catch (error) {
          logger.error('IPC', 'Shader creation failed', { shaderType, error });
          throw error;
        }
      }
    );

    /* Create new material file */
    ipcMain.handle(
      'file:create-material',
      async (_event, materialType: 'standard' | 'unlit' | 'transparent') => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          const materialsDir = path.join(project.path, 'assets', 'materials');
          await fileSystem.ensureDirectory(materialsDir);

          let counter = 1;
          let materialPath: string;

          do {
            const fileName = `New${materialType.charAt(0).toUpperCase() + materialType.slice(1)}Material${counter}.material`;
            materialPath = path.join(materialsDir, fileName);
            counter++;
          } while (await fileSystem.exists(materialPath));

          const templatePath = path.join(
            __dirname,
            '..',
            '..',
            'templates',
            'materials',
            'standard.material'
          );
          let templateContent: string;

          try {
            templateContent = await fileSystem.readFile(templatePath);
          } catch (error) {
            /* fallback template if file not found */
            templateContent = this.getMaterialTemplate(materialType);
          }

          /* replace template variables */
          const materialName = path.basename(materialPath, '.material');
          const now = new Date().toISOString();
          templateContent = templateContent
            .replace(/\{\{MaterialName\}\}/g, materialName)
            .replace(/\{\{CreatedDate\}\}/g, now)
            .replace(/\{\{ModifiedDate\}\}/g, now);

          await fileSystem.writeFile(materialPath, templateContent, { create_dirs: true });

          logger.info('IPC', 'New material created', { path: materialPath, type: materialType });
          return materialPath;
        } catch (error) {
          logger.error('IPC', 'Material creation failed', { materialType, error });
          throw error;
        }
      }
    );

    /* Create new prefab file */
    ipcMain.handle('file:create-prefab', async (_event, prefabType: 'entity' | 'ui' | 'effect') => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        const prefabsDir = path.join(project.path, 'prefabs');
        await fileSystem.ensureDirectory(prefabsDir);

        let counter = 1;
        let prefabPath: string;

        do {
          const fileName = `New${prefabType.charAt(0).toUpperCase() + prefabType.slice(1)}${counter}.prefab`;
          prefabPath = path.join(prefabsDir, fileName);
          counter++;
        } while (await fileSystem.exists(prefabPath));

        const templatePath = path.join(
          __dirname,
          '..',
          '..',
          'templates',
          'prefabs',
          'entity.prefab'
        );
        let templateContent: string;

        try {
          templateContent = await fileSystem.readFile(templatePath);
        } catch (error) {
          /* fallback template if file not found */
          templateContent = this.getPrefabTemplate(prefabType);
        }

        /* replace template variables */
        const prefabName = path.basename(prefabPath, '.prefab');
        const now = new Date().toISOString();
        const entityId = `${prefabName.toLowerCase()}-entity-${Date.now()}`;
        const childEntityId = `${prefabName.toLowerCase()}-child-${Date.now()}`;

        templateContent = templateContent
          .replace(/\{\{PrefabName\}\}/g, prefabName)
          .replace(/\{\{CreatedDate\}\}/g, now)
          .replace(/\{\{ModifiedDate\}\}/g, now)
          .replace(/\{\{EntityId\}\}/g, entityId)
          .replace(/\{\{ChildEntityId\}\}/g, childEntityId);

        await fileSystem.writeFile(prefabPath, templateContent, { create_dirs: true });

        logger.info('IPC', 'New prefab created', { path: prefabPath, type: prefabType });
        return prefabPath;
      } catch (error) {
        logger.error('IPC', 'Prefab creation failed', { prefabType, error });
        throw error;
      }
    });

    /* Enhanced file operations - rename file */
    ipcMain.handle('file:rename', async (_event, args: { oldPath: string; newPath: string }) => {
      try {
        const exists = await fileSystem.exists(args.oldPath);
        if (!exists) {
          throw new Error('Source file does not exist');
        }

        const targetExists = await fileSystem.exists(args.newPath);
        if (targetExists) {
          throw new Error('Target file already exists');
        }

        await fs.promises.rename(args.oldPath, args.newPath);

        logger.info('IPC', 'File renamed', {
          oldPath: args.oldPath,
          newPath: args.newPath
        });

        return true;
      } catch (error) {
        logger.error('IPC', 'File rename failed', {
          oldPath: args.oldPath,
          newPath: args.newPath,
          error
        });
        throw error;
      }
    });

    /* Enhanced file operations - move file */
    ipcMain.handle(
      'file:move',
      async (_event, args: { sourcePath: string; destinationPath: string }) => {
        try {
          const exists = await fileSystem.exists(args.sourcePath);
          if (!exists) {
            throw new Error('Source file does not exist');
          }

          /* ensure destination directory exists */
          const destDir = path.dirname(args.destinationPath);
          await fileSystem.ensureDirectory(destDir);

          const targetExists = await fileSystem.exists(args.destinationPath);
          if (targetExists) {
            throw new Error('Target file already exists');
          }

          await fs.promises.rename(args.sourcePath, args.destinationPath);

          logger.info('IPC', 'File moved', {
            sourcePath: args.sourcePath,
            destinationPath: args.destinationPath
          });

          return true;
        } catch (error) {
          logger.error('IPC', 'File move failed', {
            sourcePath: args.sourcePath,
            destinationPath: args.destinationPath,
            error
          });
          throw error;
        }
      }
    );

    /* Enhanced file operations - copy file */
    ipcMain.handle(
      'file:copy',
      async (_event, args: { sourcePath: string; destinationPath: string }) => {
        try {
          const exists = await fileSystem.exists(args.sourcePath);
          if (!exists) {
            throw new Error('Source file does not exist');
          }

          /* ensure destination directory exists */
          const destDir = path.dirname(args.destinationPath);
          await fileSystem.ensureDirectory(destDir);

          await fs.promises.copyFile(args.sourcePath, args.destinationPath);

          logger.info('IPC', 'File copied', {
            sourcePath: args.sourcePath,
            destinationPath: args.destinationPath
          });

          return true;
        } catch (error) {
          logger.error('IPC', 'File copy failed', {
            sourcePath: args.sourcePath,
            destinationPath: args.destinationPath,
            error
          });
          throw error;
        }
      }
    );

    /* File search functionality */
    ipcMain.handle(
      'file:search',
      async (_event, args: { query: string; directory: string; fileTypes?: string[] }) => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          const searchDir = args.directory || project.path;
          const results: string[] = [];

          const searchRecursive = async (dir: string): Promise<void> => {
            const entries = await fileSystem.listDirectory(dir);

            for (const entry of entries) {
              const fullPath = path.join(dir, entry);
              const isFile = await fileSystem.isFile(fullPath);

              if (isFile) {
                const fileName = path.basename(fullPath);
                const fileExt = path.extname(fullPath);

                /* check file type filter */
                if (args.fileTypes && args.fileTypes.length > 0) {
                  if (!args.fileTypes.includes(fileExt)) {
                    continue;
                  }
                }

                /* check if filename matches query */
                if (fileName.toLowerCase().includes(args.query.toLowerCase())) {
                  results.push(fullPath);
                }
              } else {
                const isDir = await fileSystem.isDirectory(fullPath);
                if (isDir) {
                  await searchRecursive(fullPath);
                }
              }
            }
          };

          await searchRecursive(searchDir);

          logger.info('IPC', 'File search completed', {
            query: args.query,
            directory: searchDir,
            resultCount: results.length
          });

          return results;
        } catch (error) {
          logger.error('IPC', 'File search failed', {
            query: args.query,
            directory: args.directory,
            error
          });
          throw error;
        }
      }
    );
  }

  /*
	====================================================================
             --- PROJECT MANAGEMENT HANDLERS ---
	====================================================================
  */

  /**
   * registerProjectManagementHandlers()
   *
   * Registers handlers for project backup, validation, and history management.
   */
  private registerProjectManagementHandlers(): void {
    /* Project backup handlers */
    ipcMain.handle('project:create-backup', async (_event, options?: any) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        await projectBackupManager.initialize(project.path);
        const backupId = await projectBackupManager.createBackup(options);

        logger.info('IPC', 'Project backup created', { backupId });
        return backupId;
      } catch (error) {
        logger.error('IPC', 'Project backup failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:list-backups', async (_event) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        await projectBackupManager.initialize(project.path);
        const backups = await projectBackupManager.listBackups();

        logger.info('IPC', 'Project backups listed', { count: backups.length });
        return backups;
      } catch (error) {
        logger.error('IPC', 'List backups failed', { error });
        throw error;
      }
    });

    ipcMain.handle(
      'project:restore-backup',
      async (_event, args: { backupId: string; options?: any }) => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          await projectBackupManager.initialize(project.path);
          await projectBackupManager.restoreBackup(args.backupId, args.options);

          logger.info('IPC', 'Project backup restored', { backupId: args.backupId });
          return true;
        } catch (error) {
          logger.error('IPC', 'Backup restore failed', { backupId: args.backupId, error });
          throw error;
        }
      }
    );

    ipcMain.handle('project:delete-backup', async (_event, backupId: string) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        await projectBackupManager.initialize(project.path);
        await projectBackupManager.deleteBackup(backupId);

        logger.info('IPC', 'Project backup deleted', { backupId });
        return true;
      } catch (error) {
        logger.error('IPC', 'Backup deletion failed', { backupId, error });
        throw error;
      }
    });

    /* Project validation handlers */
    ipcMain.handle('project:validate', async (_event, useCache: boolean = false) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        const result = await projectValidator.validateProject(useCache);

        logger.info('IPC', 'Project validation completed', {
          valid: result.valid,
          errorCount: result.errorCount,
          warningCount: result.warningCount
        });

        return result;
      } catch (error) {
        logger.error('IPC', 'Project validation failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:auto-fix-issues', async (_event, issues: any[]) => {
      try {
        const fixedIssues = await projectValidator.autoFixIssues(issues);

        logger.info('IPC', 'Auto-fix completed', { fixedCount: fixedIssues.length });
        return fixedIssues;
      } catch (error) {
        logger.error('IPC', 'Auto-fix failed', { error });
        throw error;
      }
    });

    ipcMain.handle('project:clear-validation-cache', async (_event) => {
      try {
        projectValidator.clearValidationCache();
        logger.info('IPC', 'Validation cache cleared');
        return true;
      } catch (error) {
        logger.error('IPC', 'Clear validation cache failed', { error });
        throw error;
      }
    });

    /* File history handlers */
    ipcMain.handle('file:track-history', async (_event, filePath: string) => {
      try {
        const project = projectManager.getCurrentProject();
        if (!project) {
          throw new Error('No project open');
        }

        await fileHistoryManager.initialize(project.path);
        const versionId = await fileHistoryManager.trackFile(filePath);

        logger.info('IPC', 'File history tracking started', { filePath, versionId });
        return versionId;
      } catch (error) {
        logger.error('IPC', 'File history tracking failed', { filePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'file:create-version',
      async (_event, args: { filePath: string; message: string }) => {
        try {
          const project = projectManager.getCurrentProject();
          if (!project) {
            throw new Error('No project open');
          }

          await fileHistoryManager.initialize(project.path);
          const versionId = await fileHistoryManager.createVersion(args.filePath, args.message);

          logger.info('IPC', 'File version created', { filePath: args.filePath, versionId });
          return versionId;
        } catch (error) {
          logger.error('IPC', 'File version creation failed', { filePath: args.filePath, error });
          throw error;
        }
      }
    );

    ipcMain.handle('file:get-history', async (_event, filePath: string) => {
      try {
        const history = fileHistoryManager.getFileHistory(filePath);

        logger.info('IPC', 'File history retrieved', {
          filePath,
          versionCount: history?.totalVersions || 0
        });

        return history;
      } catch (error) {
        logger.error('IPC', 'File history retrieval failed', { filePath, error });
        throw error;
      }
    });

    ipcMain.handle(
      'file:get-version-content',
      async (_event, args: { filePath: string; versionId: string }) => {
        try {
          const content = await fileHistoryManager.getVersionContent(args.filePath, args.versionId);

          logger.info('IPC', 'Version content retrieved', {
            filePath: args.filePath,
            versionId: args.versionId
          });

          return content;
        } catch (error) {
          logger.error('IPC', 'Version content retrieval failed', {
            filePath: args.filePath,
            versionId: args.versionId,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'file:restore-version',
      async (_event, args: { filePath: string; versionId: string }) => {
        try {
          await fileHistoryManager.restoreVersion(args.filePath, args.versionId);

          logger.info('IPC', 'File version restored', {
            filePath: args.filePath,
            versionId: args.versionId
          });

          return true;
        } catch (error) {
          logger.error('IPC', 'File version restoration failed', {
            filePath: args.filePath,
            versionId: args.versionId,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle(
      'file:compare-versions',
      async (_event, args: { filePath: string; oldVersionId: string; newVersionId: string }) => {
        try {
          const diff = await fileHistoryManager.compareVersions(
            args.filePath,
            args.oldVersionId,
            args.newVersionId
          );

          logger.info('IPC', 'File versions compared', {
            filePath: args.filePath,
            oldVersionId: args.oldVersionId,
            newVersionId: args.newVersionId
          });

          return diff;
        } catch (error) {
          logger.error('IPC', 'File version comparison failed', {
            filePath: args.filePath,
            oldVersionId: args.oldVersionId,
            newVersionId: args.newVersionId,
            error
          });
          throw error;
        }
      }
    );

    ipcMain.handle('file:delete-history', async (_event, filePath: string) => {
      try {
        await fileHistoryManager.deleteFileHistory(filePath);

        logger.info('IPC', 'File history deleted', { filePath });
        return true;
      } catch (error) {
        logger.error('IPC', 'File history deletion failed', { filePath, error });
        throw error;
      }
    });
  }

  /**
   * registerBuildHandlers()
   *
   * Registers build-related IPC handlers.
   */
  private registerBuildHandlers(): void {
    /* BUILD PROJECT */
    ipcMain.handle('build:build-project', async (_event, config) => {
      try {
        const result = await buildManager.buildProject(config, (progress) => {
          this.sendToAllWindows('build:progress', progress);
        });

        logger.debug('IPC', 'Build project completed', { result });
        return result;
      } catch (error) {
        logger.error('IPC', 'Failed to build project', { error });
        throw error;
      }
    });

    /* CANCEL BUILD */
    ipcMain.handle('build:cancel-build', async () => {
      try {
        buildManager.cancelBuild();
        logger.debug('IPC', 'Build cancelled');
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Failed to cancel build', { error });
        throw error;
      }
    });

    /* OPEN BUILD LOCATION */
    ipcMain.handle('build:open-build-location', async (_event, outputPath: string) => {
      try {
        await buildManager.openBuildLocation(outputPath);
        logger.debug('IPC', 'Build location opened', { outputPath });
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Failed to open build location', { error });
        throw error;
      }
    });

    /* GET AVAILABLE SCENES */
    ipcMain.handle('build:get-available-scenes', async () => {
      try {
        const currentProject = projectManager.getCurrentProject();
        if (!currentProject) {
          return { scenes: [] };
        }

        const scenesDir = path.join(currentProject.path, 'scenes');
        const scenes: Array<{ id: string; name: string; path: string }> = [];

        if (fs.existsSync(scenesDir)) {
          const entries = fs.readdirSync(scenesDir);

          for (const entry of entries) {
            if (entry.endsWith('.scene')) {
              const scenePath = path.join(scenesDir, entry);
              const sceneId = path.basename(entry, '.scene');
              const sceneName = sceneId
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

              scenes.push({
                id: sceneId,
                name: sceneName,
                path: entry
              });
            }
          }
        }

        logger.debug('IPC', 'Available scenes retrieved', { scenes });
        return { scenes };
      } catch (error) {
        logger.error('IPC', 'Failed to get available scenes', { error });
        throw error;
      }
    });

    /* SET PROJECT PATH FOR BUILD MANAGER */
    ipcMain.handle('build:set-project-path', async (_event, projectPath: string) => {
      try {
        buildManager.setProjectPath(projectPath);
        logger.debug('IPC', 'Build manager project path set', { projectPath });
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Failed to set build manager project path', { error });
        throw error;
      }
    });

    /* GET BUILD PROFILES */
    ipcMain.handle('build:get-build-profiles', async () => {
      try {
        const profiles = buildManager.getBuildProfiles();
        logger.debug('IPC', 'Build profiles retrieved', { profiles });
        return { profiles };
      } catch (error) {
        logger.error('IPC', 'Failed to get build profiles', { error });
        throw error;
      }
    });

    /* APPLY BUILD PROFILE */
    ipcMain.handle('build:apply-build-profile', async (_event, config) => {
      try {
        const updatedConfig = buildManager.applyBuildProfile(config);
        logger.debug('IPC', 'Build profile applied', { updatedConfig });
        return { config: updatedConfig };
      } catch (error) {
        logger.error('IPC', 'Failed to apply build profile', { error });
        throw error;
      }
    });

    logger.debug('IPC', 'Build handlers registered');
  }

  /**
   * getShaderTemplate()
   *
   * Returns fallback template content for new shaders.
   */
  private getShaderTemplate(shaderType: 'vertex' | 'fragment' | 'compute'): string {
    if (shaderType === 'vertex') {
      return `#version 330 core

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec2 vTexCoord;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  vTexCoord = aTexCoord;
}
`;
    } else if (shaderType === 'fragment') {
      return `#version 330 core

in vec2 vTexCoord;
out vec4 FragColor;

uniform sampler2D uTexture;
uniform vec4 uColor;

void main() {
  FragColor = texture(uTexture, vTexCoord) * uColor;
}
`;
    } else {
      return `#version 430

layout(local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

void main() {
  // Compute shader logic here
}
`;
    }
  }

  /**
   * getMaterialTemplate()
   *
   * Returns fallback template content for new materials.
   */
  private getMaterialTemplate(materialType: 'standard' | 'unlit' | 'transparent'): string {
    return `{
  "version": "1.0.0",
  "name": "{{MaterialName}}",
  "type": "${materialType}",
  "properties": {
    "diffuseColor": [1.0, 1.0, 1.0],
    "opacity": ${materialType === 'transparent' ? '0.5' : '1.0'}
  },
  "textures": {
    "diffuse": {
      "path": null,
      "enabled": true
    }
  }
}`;
  }

  /**
   * getPrefabTemplate()
   *
   * Returns fallback template content for new prefabs.
   */
  private getPrefabTemplate(prefabType: 'entity' | 'ui' | 'effect'): string {
    return `{
  "version": "1.0.0",
  "name": "{{PrefabName}}",
  "type": "prefab",
  "rootEntity": {
    "id": "{{EntityId}}",
    "name": "{{PrefabName}}",
    "enabled": true,
    "transform": {
      "position": [0.0, 0.0, 0.0],
      "rotation": [0.0, 0.0, 0.0, 1.0],
      "scale": [1.0, 1.0, 1.0]
    },
    "components": [],
    "children": []
  }
}`;
  }

  /**
   * getScriptTemplate()
   *
   * Returns template content for new scripts.
   */
  private getScriptTemplate(scriptType: 'typescript' | 'assemblyscript'): string {
    if (scriptType === 'typescript') {
      return `import { Component, Entity } from 'worldenv';

export class CustomComponent extends Component {

  onInit(): void {
    /* Component initialization */
  }

  onUpdate(deltaTime: number): void {
    /* Update logic */
  }

  onDestroy(): void {
    /* Cleanup */
  }
}
`;
    } else {
      return `// AssemblyScript Component
// Compiled to WebAssembly for performance

export class CustomComponent {

  onInit(): void {
    // Component initialization
  }

  onUpdate(deltaTime: f64): void {
    // Update logic
  }

  onDestroy(): void {
    // Cleanup
  }
}
`;
    }
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

  /**
   * registerWorldCHandlers()
   *
   * Registers WorldC compilation and hot-reload handlers.
   */
  private registerWorldCHandlers(): void {
    /* Compile single WorldC file */
    ipcMain.handle('worldc:compile-file', async (_event, filePath: string) => {
      try {
        logger.info('IPC', 'WorldC compilation requested', { filePath });

        /* Emit compilation start event */
        this.emitWorldCEvent({
          type: 'start',
          file: filePath,
          message: 'Starting WorldC compilation...'
        });

        /* Use asset manager to trigger compilation */
        const success = await assetManager.triggerWorldCCompilation(filePath);

        if (success) {
          this.emitWorldCEvent({
            type: 'complete',
            file: filePath,
            message: 'Compilation completed successfully'
          });
          return { success: true, errors: [], warnings: [] };
        } else {
          this.emitWorldCEvent({
            type: 'error',
            file: filePath,
            message: 'Compilation failed',
            errors: ['Failed to compile WorldC file']
          });
          return { success: false, errors: ['Compilation failed'], warnings: [] };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
        logger.error('IPC', 'WorldC compilation failed', { filePath, error });

        this.emitWorldCEvent({
          type: 'error',
          file: filePath,
          message: errorMessage,
          errors: [errorMessage]
        });

        return { success: false, errors: [errorMessage], warnings: [] };
      }
    });

    /* Get WorldC file metadata */
    ipcMain.handle('worldc:get-metadata', async (_event, filePath: string) => {
      try {
        const metadata = assetManager.getAssetMetadata(filePath);
        return metadata?.worldcInfo || null;
      } catch (error) {
        logger.error('IPC', 'Failed to get WorldC metadata', { filePath, error });
        return null;
      }
    });

    /* Enable WorldC hot-reload for file */
    ipcMain.handle('worldc:enable-hot-reload', async (_event, filePath: string) => {
      try {
        logger.info('IPC', 'Enabling WorldC hot-reload', { filePath });

        /* Clear existing watcher */
        const existingTimer = this.worldcWatcher.get(filePath);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        /* Set up file watcher with short delay for hot-reload */
        const timer = setTimeout(async () => {
          await this.compileWorldCFile(filePath);
          this.worldcWatcher.delete(filePath);
        }, 300);

        this.worldcWatcher.set(filePath, timer);
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Failed to enable WorldC hot-reload', { filePath, error });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    /* Disable WorldC hot-reload for file */
    ipcMain.handle('worldc:disable-hot-reload', async (_event, filePath: string) => {
      try {
        const timer = this.worldcWatcher.get(filePath);
        if (timer) {
          clearTimeout(timer);
          this.worldcWatcher.delete(filePath);
        }
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Failed to disable WorldC hot-reload', { filePath, error });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    /* Get all WorldC files in project */
    ipcMain.handle('worldc:list-files', async (_event, projectPath: string) => {
      try {
        const worldcFiles: string[] = [];

        const searchDir = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
              searchDir(fullPath);
            } else if (
              entry.isFile() &&
              (entry.name.endsWith('.wc') || entry.name.endsWith('.worldc'))
            ) {
              worldcFiles.push(fullPath);
            }
          }
        };

        const srcPath = path.join(projectPath, 'src');
        if (fs.existsSync(srcPath)) {
          searchDir(srcPath);
        }

        return worldcFiles;
      } catch (error) {
        logger.error('IPC', 'Failed to list WorldC files', { projectPath, error });
        return [];
      }
    });
  }

  /**
   * emitWorldCEvent()
   *
   * Emit WorldC compilation event to renderer process.
   */
  private emitWorldCEvent(event: WorldCCompilationEvent): void {
    const windows = BrowserWindow.getAllWindows();
    for (const window of windows) {
      window.webContents.send('worldc:compilation-event', event);
    }
  }

  /**
   * compileWorldCFile()
   *
   * Internal method to compile WorldC file and emit events.
   */
  private async compileWorldCFile(filePath: string): Promise<void> {
    try {
      this.emitWorldCEvent({
        type: 'start',
        file: filePath,
        message: 'Hot-reload compilation started...'
      });

      const success = await assetManager.triggerWorldCCompilation(filePath);

      if (success) {
        this.emitWorldCEvent({
          type: 'complete',
          file: filePath,
          message: 'Hot-reload compilation completed'
        });
      } else {
        this.emitWorldCEvent({
          type: 'error',
          file: filePath,
          message: 'Hot-reload compilation failed',
          errors: ['Compilation failed']
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitWorldCEvent({
        type: 'error',
        file: filePath,
        message: errorMessage,
        errors: [errorMessage]
      });
    }
  }
  /**
   * registerSceneHandlers()
   *
   * Registers scene management IPC handlers.
   */
  private registerSceneHandlers(): void {
    const sceneManager = SceneManager.getInstance();

    /* CREATE SCENE */
    ipcMain.handle(
      'scene:create',
      async (
        _event,
        command: {
          projectPath: string;
          fileName: string;
          options?: {
            name?: string;
            author?: string;
            description?: string;
            template?: 'empty' | '2d' | '3d';
          };
        }
      ) => {
        try {
          const scenePath = await sceneManager.createScene(
            command.projectPath,
            command.fileName,
            command.options || {}
          );
          return { success: true, scenePath };
        } catch (error) {
          logger.error('IPC', 'Scene creation failed', { error });
          throw error;
        }
      }
    );

    /* LOAD SCENE */
    ipcMain.handle('scene:load', async (_event, command: { scenePath: string }) => {
      try {
        const sceneData = await sceneManager.loadScene(command.scenePath);
        return { success: true, sceneData };
      } catch (error) {
        logger.error('IPC', 'Scene loading failed', { error });
        throw error;
      }
    });

    /* SAVE SCENE */
    ipcMain.handle(
      'scene:save',
      async (
        _event,
        command: {
          scenePath: string;
          sceneData: any;
        }
      ) => {
        try {
          await sceneManager.saveScene(command.scenePath, command.sceneData);
          return { success: true };
        } catch (error) {
          logger.error('IPC', 'Scene saving failed', { error });
          throw error;
        }
      }
    );

    /* DELETE SCENE */
    ipcMain.handle('scene:delete', async (_event, command: { scenePath: string }) => {
      try {
        await sceneManager.deleteScene(command.scenePath);
        return { success: true };
      } catch (error) {
        logger.error('IPC', 'Scene deletion failed', { error });
        throw error;
      }
    });

    /* LIST SCENES */
    ipcMain.handle('scene:list', async (_event, command: { projectPath: string }) => {
      try {
        const scenes = await sceneManager.listProjectScenes(command.projectPath);
        return { success: true, scenes };
      } catch (error) {
        logger.error('IPC', 'Scene listing failed', { error });
        throw error;
      }
    });

    logger.info('IPC', 'Scene handlers registered');
  }
}

export const ipcManager = new IPCManager();
