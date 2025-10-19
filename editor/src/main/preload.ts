/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             PRELOAD SCRIPT - WORLDENV EDITOR
	====================================================================
*/

/*

	secure IPC bridge between main and renderer processes in Electron
	architecture with controlled API surface exposure.

	this preload script runs in a privileged context with access to
	Node.js APIs while the renderer process runs in a sandboxed
	environment. the context bridge provides a secure channel for
	communication without exposing dangerous APIs directly.

	security features:
	- controlled API surface through contextBridge
	- no direct Node.js API exposure to renderer
	- type-safe IPC communication patterns
	- structured namespace organization
	- comprehensive operation coverage

	the API is organized into functional domains (app, fs, dialog,
	project, scene, asset, engine, build, script) with consistent
	patterns for synchronous and asynchronous operations.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'; /* ELECTRON IPC BRIDGE */

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         WorldEdit API Structure
	       ---
	       complete API surface exposed to renderer process.

	       provides organized namespaces for different functional
	       areas with consistent async/await patterns and proper
	       error handling through IPC communication.

*/

const api = {
  /*

           app namespace
	         ---
	         application-level operations and metadata.

	         provides access to application version, paths,
	         locale information, and recent project management.
	         handles application lifecycle operations.

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

    /* recent project management for quick access */
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

  /*

           fs namespace
	         ---
	         secure file system operations with validation.

	         provides controlled access to file operations with
	         built-in security checks and path validation.
	         supports both text and JSON file operations.

  */

  fs: {
    readFile: (path: string): Promise<string> => {
      return ipcRenderer.invoke('fs:read-file', path) as Promise<string>;
    },

    writeFile: (path: string, content: string): Promise<void> => {
      return ipcRenderer.invoke('fs:write-file', { path, content }) as Promise<void>;
    },

    /* JSON operations with automatic serialization */
    readJSON: (path: string): Promise<unknown> => {
      return ipcRenderer.invoke('fs:read-json', path) as Promise<unknown>;
    },

    writeJSON: (path: string, data: unknown): Promise<void> => {
      return ipcRenderer.invoke('fs:write-json', { path, data }) as Promise<void>;
    },

    /* file system querying operations */
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

    /* directory management operations */
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

  /*

           dialog namespace
	         ---
	         native dialog operations for user interaction.

	         provides access to file dialogs, message boxes,
	         and confirmation dialogs with proper error handling
	         and user cancellation support.

  */

  dialog: {
    /* file selection dialogs */
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

    /* message and confirmation dialogs */
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

  /*

           project namespace
	         ---
	         worldenv project lifecycle management.

	         handles project creation, opening, saving, and
	         modification tracking with proper state management
	         and settings persistence.

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

    /* project state queries */
    getCurrent: (): Promise<unknown> => {
      return ipcRenderer.invoke('project:get-current') as Promise<unknown>;
    },

    isOpen: (): Promise<boolean> => {
      return ipcRenderer.invoke('project:is-open') as Promise<boolean>;
    },

    isModified: (): Promise<boolean> => {
      return ipcRenderer.invoke('project:is-modified') as Promise<boolean>;
    },

    /* project modification tracking */
    markModified: (): Promise<void> => {
      return ipcRenderer.invoke('project:mark-modified') as Promise<void>;
    },

    updateSettings: (settings: unknown): Promise<void> => {
      return ipcRenderer.invoke('project:update-settings', settings) as Promise<void>;
    }
  },

  /*

           scene namespace
	         ---
	         scene file management and operations.

	         provides comprehensive scene lifecycle management
	         including creation, loading, saving, and deletion
	         with proper validation and error handling.

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

  /*

           asset namespace
	         ---
	         asset management and import operations.

	         handles asset imports, organization, metadata management,
	         and thumbnail generation with comprehensive search
	         and filtering capabilities.

  */

  asset: {
    list: (relativePath?: string): Promise<unknown[]> => {
      return ipcRenderer.invoke('asset:list', relativePath) as Promise<unknown[]>;
    },

    import: (filePaths: string[], options?: unknown): Promise<unknown[]> => {
      return ipcRenderer.invoke('asset:import', { filePaths, options }) as Promise<unknown[]>;
    },

    /* asset organization operations */
    createFolder: (relativePath: string, name: string): Promise<unknown> => {
      return ipcRenderer.invoke('asset:create-folder', { relativePath, name }) as Promise<unknown>;
    },

    rename: (relativePath: string, newName: string): Promise<unknown> => {
      return ipcRenderer.invoke('asset:rename', { relativePath, newName }) as Promise<unknown>;
    },

    delete: (relativePath: string): Promise<void> => {
      return ipcRenderer.invoke('asset:delete', relativePath) as Promise<void>;
    },

    /* asset discovery and metadata */
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

  /*

           engine namespace
	         ---
	         worldenv engine integration and communication.

	         provides interface to engine operations including
	         scene export, validation, entity management, and
	         runtime status monitoring.

  */

  engine: {
    /* scene operations */
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

    /* engine status and information */
    getEngineInfo: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-engine-info') as Promise<unknown>;
    },

    getStatus: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-status') as Promise<unknown>;
    },

    getHealthCheck: (): Promise<unknown> => {
      return ipcRenderer.invoke('engine:get-health-check') as Promise<unknown>;
    },

    /* engine lifecycle management */
    startInitialization: (options?: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:start-initialization', options) as Promise<unknown>;
    },

    initialize: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:initialize', command) as Promise<unknown>;
    },

    setPlayMode: (command: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('engine:set-play-mode', command) as Promise<unknown>;
    },

    /* entity and component operations */
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

  /*

           build namespace
	         ---
	         project build and compilation operations.

	         manages build process execution, configuration,
	         and output handling with proper progress tracking
	         and cancellation support.

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

    /* build configuration queries */
    getAvailableScenes: (): Promise<unknown> => {
      return ipcRenderer.invoke('build:get-available-scenes') as Promise<unknown>;
    },

    setProjectPath: (projectPath: string): Promise<unknown> => {
      return ipcRenderer.invoke('build:set-project-path', projectPath) as Promise<unknown>;
    },

    /* build profile management */
    getBuildProfiles: (): Promise<unknown> => {
      return ipcRenderer.invoke('build:get-build-profiles') as Promise<unknown>;
    },

    applyBuildProfile: (config: unknown): Promise<unknown> => {
      return ipcRenderer.invoke('build:apply-build-profile', config) as Promise<unknown>;
    }
  },

  /*

           script namespace
	         ---
	         script file management and editing operations.

	         handles script creation, editing, and organization
	         for TypeScript, AssemblyScript, and WorldC files
	         with proper template generation.

  */

  script: {
    readFile: (filePath: string): Promise<string> => {
      return ipcRenderer.invoke('script:read-file', filePath) as Promise<string>;
    },

    writeFile: (filePath: string, content: string): Promise<void> => {
      return ipcRenderer.invoke('script:write-file', { filePath, content }) as Promise<void>;
    },

    /* script creation with templates */
    createNew: (scriptType: 'typescript' | 'assemblyscript' | 'worldc'): Promise<string> => {
      return ipcRenderer.invoke('script:create-new', scriptType) as Promise<string>;
    },

    /* script file management */
    deleteFile: (filePath: string): Promise<void> => {
      return ipcRenderer.invoke('script:delete-file', filePath) as Promise<void>;
    },

    renameFile: (oldPath: string, newPath: string): Promise<void> => {
      return ipcRenderer.invoke('script:rename-file', { oldPath, newPath }) as Promise<void>;
    },

    listScripts: (): Promise<string[]> => {
      return ipcRenderer.invoke('script:list-scripts') as Promise<string[]>;
    },

    validateWorldC: (sourceCode: string, filePath: string): Promise<any> => {
      return ipcRenderer.invoke('script:validate-worldc', { sourceCode, filePath }) as Promise<any>;
    },

    compileWorldC: (sourceCode: string, filePath: string, target?: string): Promise<any> => {
      return ipcRenderer.invoke('script:compile-worldc', {
        sourceCode,
        filePath,
        target
      }) as Promise<any>;
    },

    attachToEntity: (entityId: string, scriptPath: string, properties?: any): Promise<any> => {
      return ipcRenderer.invoke('script:attach-to-entity', {
        entityId,
        scriptPath,
        properties
      }) as Promise<any>;
    },

    detachFromEntity: (entityId: string): Promise<void> => {
      return ipcRenderer.invoke('script:detach-from-entity', { entityId }) as Promise<void>;
    },

    updateComponentProperties: (entityId: string, properties: any): Promise<void> => {
      return ipcRenderer.invoke('script:update-component-properties', {
        entityId,
        properties
      }) as Promise<void>;
    },

    getSystemStats: (): Promise<any> => {
      return ipcRenderer.invoke('script:get-system-stats') as Promise<any>;
    },

    executeLifecyclePhase: (phase: string, deltaTime?: number): Promise<void> => {
      return ipcRenderer.invoke('script:execute-lifecycle-phase', {
        phase,
        deltaTime
      }) as Promise<void>;
    },

    startDebugSession: (filePath: string, breakpoints: any[]): Promise<void> => {
      return ipcRenderer.invoke('script:start-debug-session', {
        filePath,
        breakpoints
      }) as Promise<void>;
    },

    stopDebugSession: (): Promise<void> => {
      return ipcRenderer.invoke('script:stop-debug-session') as Promise<void>;
    },

    continueDebugSession: (): Promise<void> => {
      return ipcRenderer.invoke('script:continue-debug-session') as Promise<void>;
    },

    stepOver: (): Promise<void> => {
      return ipcRenderer.invoke('script:step-over') as Promise<void>;
    },

    stepInto: (): Promise<void> => {
      return ipcRenderer.invoke('script:step-into') as Promise<void>;
    }
  },

  /*

           General IPC operations
	         ---
	         low-level IPC communication for extensibility.

	         provides direct access to IPC invoke method and
	         event handling for custom communication patterns
	         not covered by the structured namespaces above.

  */

  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args) as Promise<unknown>;
  },

  /*

           Event handling operations
	         ---
	         event subscription and management for real-time updates.

	         provides event listener registration and cleanup
	         for receiving notifications from main process
	         about system changes and updates.

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

/* expose API to renderer process through secure context bridge
   this creates the global worldedit and electronAPI objects
   available in the renderer's window object */
contextBridge.exposeInMainWorld('worldedit', api);
contextBridge.exposeInMainWorld('electronAPI', api);

/* type definitions for TypeScript support in renderer process */
export type WorldEditAPI = typeof api;

declare global {
  interface Window {
    worldedit: WorldEditAPI /* PRIMARY API NAMESPACE */;
    electronAPI: WorldEditAPI /* LEGACY COMPATIBILITY NAMESPACE */;
  }
}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
