/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Preload Script
 *
 * Context bridge for secure IPC communication between main and renderer.
 * Exposes controlled API surface to renderer process.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * API exposed to renderer process
 */
const api = {
  /**
   * Application-level operations
   */
  app: {
    getVersion: (): Promise<string> => {
      return ipcRenderer.invoke('app:get-version') as Promise<string>;
    },

    getPath: (name: string): Promise<string> => {
      return ipcRenderer.invoke('app:get-path', name) as Promise<string>;
    },

    getLocale: (): Promise<string> => {
      return ipcRenderer.invoke('app:get-locale') as Promise<string>;
    },

    quit: (): Promise<void> => {
      return ipcRenderer.invoke('app:quit') as Promise<void>;
    },

    getRecentProjects: (): Promise<unknown[]> => {
      return ipcRenderer.invoke('app:get-recent-projects') as Promise<unknown[]>;
    },

    addRecentProject: (project: unknown): Promise<void> => {
      return ipcRenderer.invoke('app:add-recent-project', project) as Promise<void>;
    },

    removeRecentProject: (path: string): Promise<void> => {
      return ipcRenderer.invoke('app:remove-recent-project', path) as Promise<void>;
    },

    clearRecentProjects: (): Promise<void> => {
      return ipcRenderer.invoke('app:clear-recent-projects') as Promise<void>;
    }
  },

  /**
   * File system operations
   */
  fs: {
    readFile: (path: string): Promise<string> => {
      return ipcRenderer.invoke('fs:read-file', path) as Promise<string>;
    },

    writeFile: (path: string, content: string): Promise<void> => {
      return ipcRenderer.invoke('fs:write-file', { path, content }) as Promise<void>;
    },

    readJSON: (path: string): Promise<unknown> => {
      return ipcRenderer.invoke('fs:read-json', path) as Promise<unknown>;
    },

    writeJSON: (path: string, data: unknown): Promise<void> => {
      return ipcRenderer.invoke('fs:write-json', { path, data }) as Promise<void>;
    },

    exists: (path: string): Promise<boolean> => {
      return ipcRenderer.invoke('fs:exists', path) as Promise<boolean>;
    },

    isFile: (path: string): Promise<boolean> => {
      return ipcRenderer.invoke('fs:is-file', path) as Promise<boolean>;
    },

    isDirectory: (path: string): Promise<boolean> => {
      return ipcRenderer.invoke('fs:is-directory', path) as Promise<boolean>;
    },

    listDirectory: (path: string): Promise<string[]> => {
      return ipcRenderer.invoke('fs:list-directory', path) as Promise<string[]>;
    },

    ensureDirectory: (path: string): Promise<void> => {
      return ipcRenderer.invoke('fs:ensure-directory', path) as Promise<void>;
    },

    deleteFile: (path: string): Promise<void> => {
      return ipcRenderer.invoke('fs:delete-file', path) as Promise<void>;
    },

    deleteDirectory: (path: string): Promise<void> => {
      return ipcRenderer.invoke('fs:delete-directory', path) as Promise<void>;
    },

    getStats: (path: string): Promise<unknown> => {
      return ipcRenderer.invoke('fs:get-stats', path) as Promise<unknown>;
    }
  },

  /**
   * Dialog operations
   */
  dialog: {
    openFile: (options?: unknown): Promise<string | null> => {
      return ipcRenderer.invoke('dialog:open-file', options) as Promise<string | null>;
    },

    openFiles: (options?: unknown): Promise<string[]> => {
      return ipcRenderer.invoke('dialog:open-files', options) as Promise<string[]>;
    },

    saveFile: (options?: unknown): Promise<string | null> => {
      return ipcRenderer.invoke('dialog:save-file', options) as Promise<string | null>;
    },

    openDirectory: (options?: unknown): Promise<string | null> => {
      return ipcRenderer.invoke('dialog:open-directory', options) as Promise<string | null>;
    },

    showMessage: (options: unknown): Promise<number> => {
      return ipcRenderer.invoke('dialog:show-message', options) as Promise<number>;
    },

    showError: (title: string, message: string, detail?: string): Promise<void> => {
      return ipcRenderer.invoke('dialog:show-error', { title, message, detail }) as Promise<void>;
    },

    showConfirm: (title: string, message: string, detail?: string): Promise<boolean> => {
      return ipcRenderer.invoke('dialog:show-confirm', {
        title,
        message,
        detail
      }) as Promise<boolean>;
    }
  },

  /**
   * Project operations
   */
  project: {
    create: (path: string, name: string): Promise<unknown> => {
      return ipcRenderer.invoke('project:create', { path, name }) as Promise<unknown>;
    },

    open: (path: string): Promise<unknown> => {
      return ipcRenderer.invoke('project:open', path) as Promise<unknown>;
    },

    save: (): Promise<void> => {
      return ipcRenderer.invoke('project:save') as Promise<void>;
    },

    close: (): Promise<void> => {
      return ipcRenderer.invoke('project:close') as Promise<void>;
    },

    getCurrent: (): Promise<unknown> => {
      return ipcRenderer.invoke('project:get-current') as Promise<unknown>;
    },

    isOpen: (): Promise<boolean> => {
      return ipcRenderer.invoke('project:is-open') as Promise<boolean>;
    },

    isModified: (): Promise<boolean> => {
      return ipcRenderer.invoke('project:is-modified') as Promise<boolean>;
    },

    markModified: (): Promise<void> => {
      return ipcRenderer.invoke('project:mark-modified') as Promise<void>;
    },

    updateSettings: (settings: unknown): Promise<void> => {
      return ipcRenderer.invoke('project:update-settings', settings) as Promise<void>;
    }
  },

  /**
   * Scene operations
   */
  scene: {
    create: (projectPath: string, fileName: string, options?: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('scene:create', {
        projectPath,
        fileName,
        options
      }) as Promise<unknown>;
    },

    load: (scenePath: string): Promise<unknown> => {
      return ipcRenderer.invoke('scene:load', { scenePath }) as Promise<unknown>;
    },

    save: (scenePath: string, sceneData: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('scene:save', { scenePath, sceneData }) as Promise<unknown>;
    },

    delete: (scenePath: string): Promise<unknown> => {
      return ipcRenderer.invoke('scene:delete', { scenePath }) as Promise<unknown>;
    },

    list: (projectPath: string): Promise<unknown> => {
      return ipcRenderer.invoke('scene:list', { projectPath }) as Promise<unknown>;
    }
  },

  /**
   * Asset operations
   */
  asset: {
    list: (relativePath?: string): Promise<unknown[]> => {
      return ipcRenderer.invoke('asset:list', relativePath) as Promise<unknown[]>;
    },

    import: (filePaths: string[], options?: unknown): Promise<unknown[]> => {
      return ipcRenderer.invoke('asset:import', { filePaths, options }) as Promise<unknown[]>;
    },

    createFolder: (relativePath: string, name: string): Promise<unknown> => {
      return ipcRenderer.invoke('asset:create-folder', { relativePath, name }) as Promise<unknown>;
    },

    rename: (relativePath: string, newName: string): Promise<unknown> => {
      return ipcRenderer.invoke('asset:rename', { relativePath, newName }) as Promise<unknown>;
    },

    delete: (relativePath: string): Promise<void> => {
      return ipcRenderer.invoke('asset:delete', relativePath) as Promise<void>;
    },

    search: (options: unknown): Promise<unknown[]> => {
      return ipcRenderer.invoke('asset:search', options) as Promise<unknown[]>;
    },

    getMetadata: (relativePath: string): Promise<unknown> => {
      return ipcRenderer.invoke('asset:get-metadata', relativePath) as Promise<unknown>;
    },

    updateMetadata: (relativePath: string, metadata: unknown): Promise<void> => {
      return ipcRenderer.invoke('asset:update-metadata', {
        relativePath,
        metadata
      }) as Promise<void>;
    },

    getThumbnail: (relativePath: string): Promise<string | null> => {
      return ipcRenderer.invoke('asset:get-thumbnail', relativePath) as Promise<string | null>;
    }
  },

  /**
   * Engine operations
   */
  engine: {
    exportScene: (sceneData: unknown, options?: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:export-scene', { sceneData, options }) as Promise<unknown>;
    },

    validateScene: (sceneData: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:validate-scene', sceneData) as Promise<unknown>;
    },

    saveScene: (path: string, sceneData: unknown): Promise<void> => {
      return ipcRenderer.invoke('engine:save-scene', { path, sceneData }) as Promise<void>;
    },

    loadScene: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:load-scene', command) as Promise<unknown>;
    },

    getEngineInfo: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-engine-info') as Promise<unknown>;
    },

    getStatus: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-status') as Promise<unknown>;
    },

    getHealthCheck: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-health-check') as Promise<unknown>;
    },

    startInitialization: (options?: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:start-initialization', options) as Promise<unknown>;
    },

    initialize: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:initialize', command) as Promise<unknown>;
    },

    setPlayMode: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:set-play-mode', command) as Promise<unknown>;
    },

    createEntity: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:create-entity', command) as Promise<unknown>;
    },

    updateComponent: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:update-component', command) as Promise<unknown>;
    },

    getStats: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-stats') as Promise<unknown>;
    }
  },

  /**
   * Build operations
   */
  build: {
    buildProject: (config: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('build:build-project', config) as Promise<unknown>;
    },

    cancelBuild: (): Promise<unknown> => {
      return ipcRenderer.invoke('build:cancel-build') as Promise<unknown>;
    },

    openBuildLocation: (outputPath: string): Promise<unknown> => {
      return ipcRenderer.invoke('build:open-build-location', outputPath) as Promise<unknown>;
    },

    getAvailableScenes: (): Promise<unknown> => {
      return ipcRenderer.invoke('build:get-available-scenes') as Promise<unknown>;
    },

    setProjectPath: (projectPath: string): Promise<unknown> => {
      return ipcRenderer.invoke('build:set-project-path', projectPath) as Promise<unknown>;
    }
  },

  /**
   * Script operations
   */
  script: {
    readFile: (filePath: string): Promise<string> => {
      return ipcRenderer.invoke('script:read-file', filePath) as Promise<string>;
    },

    writeFile: (filePath: string, content: string): Promise<void> => {
      return ipcRenderer.invoke('script:write-file', { filePath, content }) as Promise<void>;
    },

    createNew: (scriptType: 'typescript' | 'assemblyscript' | 'worldc'): Promise<string> => {
      return ipcRenderer.invoke('script:create-new', scriptType) as Promise<string>;
    },

    deleteFile: (filePath: string): Promise<void> => {
      return ipcRenderer.invoke('script:delete-file', filePath) as Promise<void>;
    },

    renameFile: (oldPath: string, newPath: string): Promise<void> => {
      return ipcRenderer.invoke('script:rename-file', { oldPath, newPath }) as Promise<void>;
    },

    listScripts: (): Promise<string[]> => {
      return ipcRenderer.invoke('script:list-scripts') as Promise<string[]>;
    }
  },

  /**
   * General IPC invoke method
   */
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args) as Promise<unknown>;
  },

  /**
   * Event listeners
   */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args);
    };

    ipcRenderer.on(channel, subscription);
  },

  removeListener: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback);
  },

  off: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback);
  },

  once: (channel: string, callback: (...args: unknown[]) => void): void => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args);
    };

    ipcRenderer.once(channel, subscription);
  }
};

/**
 * Expose API to renderer via contextBridge
 */
contextBridge.exposeInMainWorld('worldedit', api);
contextBridge.exposeInMainWorld('electronAPI', api);

/**
 * Type declarations for renderer process
 */
export type WorldEditAPI = typeof api;

declare global {
  interface Window {
    worldedit: WorldEditAPI;
    electronAPI: WorldEditAPI;
  }
}
