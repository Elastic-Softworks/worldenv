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

         scene_manager
           ---

           this module handles scene file operations in the main process.
           it provides create, save, load, and validation functionality
           for .scene.json files within project directories.

           the scene manager ensures proper file structure, handles
           error cases gracefully, and maintains scene metadata
           consistency throughout the application lifecycle.

*/

import * as fs from 'fs';
import * as path from 'path';
import {
  SceneData,
  SceneMetadata,
  SceneSettings,
  NodeData,
  Vector3,
  Color
} from '../shared/types/SceneTypes';
import { logger } from './logger';

/*
   ================================
             --- TYPES ---
   ================================
*/

interface SceneFileData {
  format: string;
  formatVersion: string;
  scene: SceneData;
}

interface CreateSceneOptions {
  name?: string;
  author?: string;
  description?: string;
  template?: 'empty' | '2d' | '3d';
}

interface SceneValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/*
   ================================
             --- CLASS ---
   ================================
*/

export class SceneManager {
  private static _instance: SceneManager | null = null;

  /*

           getInstance()
             ---

             singleton pattern implementation for global scene manager access.
             ensures only one scene manager exists throughout the application.

  */

  static getInstance(): SceneManager {
    if (!SceneManager._instance) {
      SceneManager._instance = new SceneManager();
    }

    return SceneManager._instance;
  }

  /*

           createScene()
             ---

           creates a new scene file within a project directory.
           generates default scene structure based on template type,
           ensuring proper scene hierarchy and component setup.

  */

  async createScene(
    projectPath: string,
    fileName: string,
    options: CreateSceneOptions = {}
  ): Promise<string> {
    try {
      const scenesDir = path.join(projectPath, 'scenes');

      /* ensure scenes directory exists */

      if (!fs.existsSync(scenesDir)) {
        fs.mkdirSync(scenesDir, { recursive: true });
      }

      /* generate scene file path */

      const sceneFileName = fileName.endsWith('.scene.json') ? fileName : `${fileName}.scene.json`;

      const scenePath = path.join(scenesDir, sceneFileName);

      /* check if scene already exists */

      if (fs.existsSync(scenePath)) {
        throw new Error(`Scene file already exists: ${sceneFileName}`);
      }

      /* create scene data based on template */

      const sceneData = this.createSceneTemplate(options);

      /* wrap scene data in file format */

      const fileData: SceneFileData = {
        format: 'worldenv-scene',
        formatVersion: '1.0.0',
        scene: sceneData
      };

      /* write scene file */

      const jsonContent = JSON.stringify(fileData, null, 2);
      fs.writeFileSync(scenePath, jsonContent, 'utf8');

      logger.info('SCENE_MANAGER', `Created scene: ${scenePath}`);

      return scenePath;
    } catch (error) {
      logger.error('SCENE_MANAGER', 'Failed to create scene:', error);
      throw error;
    }
  }

  /*

           loadScene()
             ---

           loads scene data from a .scene.json file.
           validates file format and structure, returning parsed
           scene data or throwing descriptive errors.

  */

  async loadScene(scenePath: string): Promise<SceneData> {
    try {
      /* check if file exists */

      if (!fs.existsSync(scenePath)) {
        throw new Error(`Scene file not found: ${scenePath}`);
      }

      /* read and parse scene file */

      const fileContent = fs.readFileSync(scenePath, 'utf8');
      const fileData = JSON.parse(fileContent) as SceneFileData;

      /* validate file format */

      if (fileData.format !== 'worldenv-scene') {
        throw new Error(`Invalid scene format: ${fileData.format}`);
      }

      /* validate scene data structure */

      const validation = this.validateSceneData(fileData.scene);

      if (!validation.isValid) {
        throw new Error(`Scene validation failed: ${validation.errors.join(', ')}`);
      }

      logger.info('SCENE_MANAGER', `Loaded scene: ${scenePath}`);

      return fileData.scene;
    } catch (error) {
      logger.error('SCENE_MANAGER', 'Failed to load scene:', error);
      throw error;
    }
  }

  /*

           saveScene()
             ---

           saves scene data to a .scene.json file.
           updates metadata timestamps and ensures proper
           file formatting for cross-platform compatibility.

  */

  async saveScene(scenePath: string, sceneData: SceneData): Promise<void> {
    try {
      /* update scene metadata */

      sceneData.metadata.modifiedAt = new Date().toISOString();
      sceneData.metadata.editorVersion = '0.1.0';

      /* validate scene data before saving */

      const validation = this.validateSceneData(sceneData);

      if (!validation.isValid) {
        throw new Error(`Scene validation failed: ${validation.errors.join(', ')}`);
      }

      /* create file data structure */

      const fileData: SceneFileData = {
        format: 'worldenv-scene',
        formatVersion: '1.0.0',
        scene: sceneData
      };

      /* ensure directory exists */

      const sceneDir = path.dirname(scenePath);

      if (!fs.existsSync(sceneDir)) {
        fs.mkdirSync(sceneDir, { recursive: true });
      }

      /* write scene file */

      const jsonContent = JSON.stringify(fileData, null, 2);
      fs.writeFileSync(scenePath, jsonContent, 'utf8');

      logger.info('SCENE_MANAGER', `Saved scene: ${scenePath}`);
    } catch (error) {
      logger.error('SCENE_MANAGER', 'Failed to save scene:', error);
      throw error;
    }
  }

  /*

           deleteScene()
             ---

           deletes a scene file from the filesystem.
           provides safety checks and logging for
           scene removal operations.

  */

  async deleteScene(scenePath: string): Promise<void> {
    try {
      if (!fs.existsSync(scenePath)) {
        throw new Error(`Scene file not found: ${scenePath}`);
      }

      fs.unlinkSync(scenePath);

      logger.info('SCENE_MANAGER', `Deleted scene: ${scenePath}`);
    } catch (error) {
      logger.error('SCENE_MANAGER', 'Failed to delete scene:', error);
      throw error;
    }
  }

  /*

           listProjectScenes()
             ---

           returns list of scene files within a project directory.
           scans the scenes folder and returns metadata for
           each discovered scene file.

  */

  async listProjectScenes(projectPath: string): Promise<
    Array<{
      name: string;
      path: string;
      metadata: SceneMetadata;
    }>
  > {
    try {
      const scenesDir = path.join(projectPath, 'scenes');
      const scenes: Array<{
        name: string;
        path: string;
        metadata: SceneMetadata;
      }> = [];

      if (!fs.existsSync(scenesDir)) {
        return scenes;
      }

      const files = fs.readdirSync(scenesDir);

      for (const file of files) {
        if (file.endsWith('.scene.json')) {
          try {
            const scenePath = path.join(scenesDir, file);
            const sceneData = await this.loadScene(scenePath);

            scenes.push({
              name: sceneData.name,
              path: scenePath,
              metadata: sceneData.metadata
            });
          } catch (error) {
            logger.warn('SCENE_MANAGER', `Failed to load scene metadata: ${file}`, error);
          }
        }
      }

      return scenes;
    } catch (error) {
      logger.error('SCENE_MANAGER', 'Failed to list project scenes:', error);
      throw error;
    }
  }

  /*

           createSceneTemplate()
             ---

           generates default scene structure based on template type.
           creates appropriate node hierarchy and default components
           for different scene types (empty, 2d, 3d).

  */

  private createSceneTemplate(options: CreateSceneOptions): SceneData {
    const now = new Date().toISOString();
    const template = options.template || 'empty';

    /* create default metadata */

    const metadata: SceneMetadata = {
      version: '1.0.0',
      createdAt: now,
      modifiedAt: now,
      author: options.author,
      description: options.description,
      engineVersion: '0.1.0',
      editorVersion: '0.1.0'
    };

    /* create default scene settings */

    const settings: SceneSettings = {
      ambientColor: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
      fogEnabled: false,
      gravity: { x: 0, y: -9.81, z: 0 },
      physicsEnabled: true,
      audioEnabled: true
    };

    /* create root node based on template */

    const rootNode = this.createRootNodeForTemplate(template);

    /* create scene data structure */

    const sceneData: SceneData = {
      id: this.generateId(),
      name: options.name || 'New Scene',
      rootNode,
      settings,
      metadata,
      assets: []
    };

    return sceneData;
  }

  /*

           createRootNodeForTemplate()
             ---

           creates appropriate root node structure for different
           scene templates. sets up default cameras, lighting,
           and environment based on template type.

  */

  private createRootNodeForTemplate(template: string): NodeData {
    const rootNode: NodeData = {
      id: this.generateId(),
      name: 'Scene',
      type: 'scene',
      enabled: true,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      components: [],
      children: []
    };

    if (template === '3d') {
      /* add 3d camera */

      const camera3d: NodeData = {
        id: this.generateId(),
        name: 'Main Camera',
        type: 'camera',
        enabled: true,
        transform: {
          position: { x: 0, y: 2, z: 5 },
          rotation: { x: -15, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        components: [
          {
            id: this.generateId(),
            type: 'camera',
            enabled: true,
            properties: {
              fov: 60,
              aspect: 16 / 9,
              near: 0.1,
              far: 1000,
              orthographic: false
            }
          }
        ],
        children: []
      };

      /* add directional light */

      const light: NodeData = {
        id: this.generateId(),
        name: 'Directional Light',
        type: 'light',
        enabled: true,
        transform: {
          position: { x: 0, y: 3, z: 0 },
          rotation: { x: 45, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        components: [
          {
            id: this.generateId(),
            type: 'light',
            enabled: true,
            properties: {
              lightType: 'directional' as const,
              color: { r: 1, g: 1, b: 1, a: 1 },
              intensity: 1.0,
              castShadows: true
            }
          }
        ],
        children: []
      };

      rootNode.children = [camera3d, light];
    } else if (template === '2d') {
      /* add 2d camera */

      const camera2d: NodeData = {
        id: this.generateId(),
        name: 'Main Camera',
        type: 'camera',
        enabled: true,
        transform: {
          position: { x: 0, y: 0, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        components: [
          {
            id: this.generateId(),
            type: 'camera',
            enabled: true,
            properties: {
              fov: 60,
              aspect: 16 / 9,
              near: 0.1,
              far: 1000,
              orthographic: true,
              size: 10
            }
          }
        ],
        children: []
      };

      rootNode.children = [camera2d];
    }

    /* empty template has no default children */

    return rootNode;
  }

  /*

           validateSceneData()
             ---

           validates scene data structure for consistency and
           completeness. checks required fields, data types,
           and structural integrity.

  */

  private validateSceneData(sceneData: SceneData): SceneValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    /* validate required fields */

    if (!sceneData.id) {
      errors.push('Scene ID is required');
    }

    if (!sceneData.name || sceneData.name.trim() === '') {
      errors.push('Scene name is required');
    }

    if (!sceneData.rootNode) {
      errors.push('Root node is required');
    }

    if (!sceneData.metadata) {
      errors.push('Scene metadata is required');
    }

    /* validate root node structure */

    if (sceneData.rootNode) {
      const nodeValidation = this.validateNodeData(sceneData.rootNode);
      errors.push(...nodeValidation.errors);
      warnings.push(...nodeValidation.warnings);
    }

    /* validate metadata fields */

    if (sceneData.metadata) {
      if (!sceneData.metadata.version) {
        warnings.push('Scene version not specified');
      }

      if (!sceneData.metadata.createdAt) {
        warnings.push('Scene creation date not specified');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /*

           validateNodeData()
             ---

           validates individual node data for structural integrity.
           recursively validates child nodes and component data.

  */

  private validateNodeData(nodeData: NodeData): SceneValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    /* validate required node fields */

    if (!nodeData.id) {
      errors.push(`Node missing ID: ${nodeData.name || 'unknown'}`);
    }

    if (!nodeData.name || nodeData.name.trim() === '') {
      errors.push(`Node missing name: ${nodeData.id || 'unknown'}`);
    }

    if (!nodeData.type) {
      errors.push(`Node missing type: ${nodeData.name || nodeData.id || 'unknown'}`);
    }

    /* validate transform */

    if (!nodeData.transform) {
      errors.push(`Node missing transform: ${nodeData.name || nodeData.id}`);
    }

    /* validate children recursively */

    if (nodeData.children) {
      for (const child of nodeData.children) {
        const childValidation = this.validateNodeData(child);
        errors.push(...childValidation.errors);
        warnings.push(...childValidation.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /*

           generateId()
             ---

           generates unique identifier for scene elements.
           uses timestamp and random components for uniqueness.

  */

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    return `${timestamp}-${random}`;
  }
}

/*
   ================================
             --- EOF ---
   ================================
*/
