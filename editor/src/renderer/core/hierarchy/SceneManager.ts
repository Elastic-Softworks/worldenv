/*
   ===============================================================
   WORLDEDIT SCENE MANAGER
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

import {
  Scene,
  SceneSerialData,
  SceneChangeEvent,
  SceneChangeListener
} from './Scene'; /* SCENE MANAGEMENT */
import { Node, NodeType } from './Node'; /* NODE HIERARCHY */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         SceneFile
	       ---
	       file system representation of a scene document
	       including metadata and serialized scene data.
	       used for scene persistence and project management
	       operations.

*/
export interface SceneFile {
  path: string /* absolute filesystem path */;
  name: string /* display name without extension */;
  data: SceneSerialData /* serialized scene content */;
  lastModified: Date /* last file modification time */;
}

/*

         SceneManagerEvent
	       ---
	       enumeration of scene lifecycle events that can
	       occur during scene management operations. these
	       events notify the editor UI of scene state changes.

*/
export enum SceneManagerEvent {
  SCENE_CREATED = 'scene_created' /* new scene created */,
  SCENE_LOADED = 'scene_loaded' /* scene loaded from file */,
  SCENE_SAVED = 'scene_saved' /* scene saved to file */,
  SCENE_CLOSED = 'scene_closed' /* scene closed by user */,
  SCENE_CHANGED = 'scene_changed' /* scene content modified */
}

/*

         SceneManagerEventData
	       ---
	       event data structure containing information about
	       scene management operations. provides context for
	       UI updates and system notifications.

*/
export interface SceneManagerEventData {
  type: SceneManagerEvent;
  scene?: Scene;
  filePath?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Scene manager listener
 */
export type SceneManagerListener = (event: SceneManagerEventData) => void;

/**
 * SceneManager class
 *
 * Handles scene lifecycle, file I/O, and state management.
 * Singleton pattern for global scene access.
 */
export class SceneManager {
  private static _instance: SceneManager | null = null;

  protected _currentScene: Scene | null = null;
  protected _recentScenes: SceneFile[] = [];
  protected _listeners: Set<SceneManagerListener> = new Set();
  protected _sceneChangeListener: SceneChangeListener;

  /**
   * SceneManager constructor (private for singleton)
   */
  private constructor() {
    this._sceneChangeListener = (event: SceneChangeEvent) => {
      this.emitEvent({
        type: SceneManagerEvent.SCENE_CHANGED,
        scene: this._currentScene || undefined,
        timestamp: new Date()
      });
    };
  }

  /**
   * getInstance()
   *
   * Gets singleton instance.
   */
  static getInstance(): SceneManager {
    if (!SceneManager._instance) {
      SceneManager._instance = new SceneManager();
    }
    return SceneManager._instance;
  }

  /**
   * Property getters
   */
  get currentScene(): Scene | null {
    return this._currentScene;
  }
  get hasScene(): boolean {
    return this._currentScene !== null;
  }
  get recentScenes(): readonly SceneFile[] {
    return this._recentScenes;
  }

  /**
   * emitEvent()
   *
   * Emits scene manager event.
   */
  protected emitEvent(event: SceneManagerEventData): void {
    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[SCENE_MANAGER] Event listener error:', error);
      }
    }
  }

  /**
   * addListener()
   *
   * Adds scene manager event listener.
   */
  addListener(listener: SceneManagerListener): void {
    this._listeners.add(listener);
  }

  /**
   * removeListener()
   *
   * Removes scene manager event listener.
   */
  removeListener(listener: SceneManagerListener): void {
    this._listeners.delete(listener);
  }

  /**
   * createNewScene()
   *
   * Creates new empty scene.
   */
  createNewScene(name: string = 'New Scene'): Scene {
    // Close current scene
    if (this._currentScene) {
      this.closeScene();
    }

    // Create new scene
    this._currentScene = new Scene(name);
    this._currentScene.addChangeListener(this._sceneChangeListener);

    // Add default entities
    this.setupDefaultScene();

    this.emitEvent({
      type: SceneManagerEvent.SCENE_CREATED,
      scene: this._currentScene,
      timestamp: new Date()
    });

    return this._currentScene;
  }

  /**
   * setupDefaultScene()
   *
   * Sets up default scene entities.
   */
  protected setupDefaultScene(): void {
    if (!this._currentScene) return;

    // Create main camera
    const camera = this._currentScene.createNode('Main Camera', NodeType.CAMERA);
    camera.setTransform({
      position: { x: 0, y: 0, z: 10 },
      rotation: { x: 0, y: 0, z: 0 }
    });

    // Create directional light
    const light = this._currentScene.createNode('Directional Light', NodeType.LIGHT);
    light.setTransform({
      position: { x: 5, y: 10, z: 5 },
      rotation: { x: -45, y: 45, z: 0 }
    });
  }

  /**
   * loadScene()
   *
   * Loads scene from JSON data.
   */
  async loadScene(data: SceneSerialData): Promise<Scene> {
    try {
      // Close current scene
      if (this._currentScene) {
        this.closeScene();
      }

      // Deserialize scene
      this._currentScene = Scene.deserialize(data);
      this._currentScene.addChangeListener(this._sceneChangeListener);

      this.emitEvent({
        type: SceneManagerEvent.SCENE_LOADED,
        scene: this._currentScene,
        timestamp: new Date()
      });

      return this._currentScene;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent({
        type: SceneManagerEvent.SCENE_LOADED,
        error: errorMessage,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * loadSceneFromFile()
   *
   * Loads scene from file path.
   */
  async loadSceneFromFile(filePath: string): Promise<Scene> {
    try {
      // Use IPC to read file
      const content = await window.worldedit.fs.readFile(filePath);
      const data = JSON.parse(content) as SceneSerialData;

      const scene = await this.loadScene(data);

      // Add to recent scenes
      this.addToRecentScenes({
        path: filePath,
        name: data.metadata.name,
        data,
        lastModified: new Date()
      });

      return scene;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent({
        type: SceneManagerEvent.SCENE_LOADED,
        filePath,
        error: errorMessage,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * saveScene()
   *
   * Saves current scene to JSON.
   */
  saveScene(): string | null {
    if (!this._currentScene) {
      return null;
    }

    try {
      const json = this._currentScene.exportToJson();
      this._currentScene.clearDirty();

      this.emitEvent({
        type: SceneManagerEvent.SCENE_SAVED,
        scene: this._currentScene,
        timestamp: new Date()
      });

      return json;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent({
        type: SceneManagerEvent.SCENE_SAVED,
        scene: this._currentScene,
        error: errorMessage,
        timestamp: new Date()
      });

      return null;
    }
  }

  /**
   * saveSceneToFile()
   *
   * Saves current scene to file.
   */
  async saveSceneToFile(filePath: string): Promise<boolean> {
    if (!this._currentScene) {
      return false;
    }

    try {
      const json = this._currentScene.exportToJson();

      // Use IPC to write file
      await window.worldedit.fs.writeFile(filePath, json);

      this._currentScene.clearDirty();

      // Add to recent scenes
      this.addToRecentScenes({
        path: filePath,
        name: this._currentScene.metadata.name,
        data: this._currentScene.serialize(),
        lastModified: new Date()
      });

      this.emitEvent({
        type: SceneManagerEvent.SCENE_SAVED,
        scene: this._currentScene,
        filePath,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent({
        type: SceneManagerEvent.SCENE_SAVED,
        scene: this._currentScene,
        filePath,
        error: errorMessage,
        timestamp: new Date()
      });

      return false;
    }
  }

  /**
   * closeScene()
   *
   * Closes current scene.
   */
  closeScene(): boolean {
    if (!this._currentScene) {
      return false;
    }

    const scene = this._currentScene;

    // Remove listener
    scene.removeChangeListener(this._sceneChangeListener);

    // Dispose scene
    scene.dispose();
    this._currentScene = null;

    this.emitEvent({
      type: SceneManagerEvent.SCENE_CLOSED,
      scene,
      timestamp: new Date()
    });

    return true;
  }

  /**
   * hasUnsavedChanges()
   *
   * Checks if current scene has unsaved changes.
   */
  hasUnsavedChanges(): boolean {
    return this._currentScene?.isDirty || false;
  }

  /**
   * addToRecentScenes()
   *
   * Adds scene file to recent scenes list.
   */
  protected addToRecentScenes(sceneFile: SceneFile): void {
    // Remove existing entry for same path
    this._recentScenes = this._recentScenes.filter((scene) => scene.path !== sceneFile.path);

    // Add to beginning
    this._recentScenes.unshift(sceneFile);

    // Limit to 10 recent scenes
    this._recentScenes = this._recentScenes.slice(0, 10);

    // Persist to storage
    this.saveRecentScenes();
  }

  /**
   * clearRecentScenes()
   *
   * Clears recent scenes list.
   */
  clearRecentScenes(): void {
    this._recentScenes = [];
    this.saveRecentScenes();
  }

  /**
   * saveRecentScenes()
   *
   * Saves recent scenes to local storage.
   */
  protected saveRecentScenes(): void {
    try {
      const data = this._recentScenes.map((scene) => ({
        path: scene.path,
        name: scene.name,
        lastModified: scene.lastModified.toISOString()
      }));

      localStorage.setItem('worldedit-recent-scenes', JSON.stringify(data));
    } catch (error) {
      console.warn('[SCENE_MANAGER] Failed to save recent scenes:', error);
    }
  }

  /**
   * loadRecentScenes()
   *
   * Loads recent scenes from local storage.
   */
  loadRecentScenes(): void {
    try {
      const data = localStorage.getItem('worldedit-recent-scenes');
      if (!data) return;

      const parsed = JSON.parse(data);
      this._recentScenes = parsed.map((item: any) => ({
        path: item.path,
        name: item.name,
        data: {} as SceneSerialData, // Will be loaded when needed
        lastModified: new Date(item.lastModified)
      }));
    } catch (error) {
      console.warn('[SCENE_MANAGER] Failed to load recent scenes:', error);
      this._recentScenes = [];
    }
  }

  /**
   * getNode()
   *
   * Gets node from current scene.
   */
  getNode(id: string): Node | null {
    return this._currentScene?.getNode(id) || null;
  }

  /**
   * createNode()
   *
   * Creates node in current scene.
   */
  createNode(name: string, type: NodeType, parent?: Node): Node | null {
    if (!this._currentScene) {
      return null;
    }

    return this._currentScene.createNode(name, type, parent);
  }

  /**
   * removeNode()
   *
   * Removes node from current scene.
   */
  removeNode(node: Node): boolean {
    if (!this._currentScene) {
      return false;
    }

    return this._currentScene.removeNode(node);
  }

  /**
   * duplicateNode()
   *
   * Duplicates node in current scene.
   */
  duplicateNode(node: Node, newName?: string): Node | null {
    if (!this._currentScene) {
      return null;
    }

    return this._currentScene.duplicateNode(node, newName);
  }

  /**
   * reparentNode()
   *
   * Moves node to new parent in current scene.
   */
  reparentNode(node: Node, newParent: Node): boolean {
    if (!this._currentScene) {
      return false;
    }

    return this._currentScene.reparentNode(node, newParent);
  }

  /**
   * getSceneStats()
   *
   * Gets current scene statistics.
   */
  getSceneStats(): any | null {
    return this._currentScene?.getStats() || null;
  }

  /**
   * dispose()
   *
   * Cleanup scene manager resources.
   */
  dispose(): void {
    if (this._currentScene) {
      this.closeScene();
    }

    this._listeners.clear();
    SceneManager._instance = null;
  }
}
