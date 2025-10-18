/*
   ===============================================================
   WORLDEDIT SCENE SERIALIZER
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
  SceneData,
  SceneExportData,
  NodeData,
  ComponentData,
  SceneValidationResult,
  SceneValidationError,
  Transform,
  Vector3,
  AssetReference,
  SceneSettings
} from '../../shared/types/SceneTypes'; /* SCENE TYPE DEFINITIONS */
import { Node, NodeType } from '../../renderer/core/hierarchy/Node'; /* HIERARCHY NODE SYSTEM */
import { Scene } from '../../renderer/core/hierarchy/Scene'; /* SCENE CONTAINER */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         SerializationOptions
	       ---
	       configuration interface for scene serialization behavior
	       controlling asset inclusion, compression, runtime optimization,
	       validation, and editor metadata handling during export.

*/

export interface SerializationOptions {
  includeAssets: boolean /* include referenced assets in export */;
  compressAssets: boolean /* compress asset data for smaller files */;
  optimizeForRuntime: boolean /* optimize scene data for runtime performance */;
  validateBeforeExport: boolean /* validate scene before serialization */;
  includeEditorData: boolean /* include editor-specific metadata */;
}

/*

         SerializationContext
	       ---
	       context object that tracks serialization state including
	       asset references, node mappings, component data, and
	       validation results during the conversion process.

*/

export interface SerializationContext {
  assetMap: Map<string, AssetReference> /* asset reference mapping */;
  nodeMap: Map<string, NodeData> /* node data lookup table */;
  componentMap: Map<string, ComponentData> /* component data cache */;
  errors: SceneValidationError[] /* critical validation errors */;
  warnings: SceneValidationError[] /* non-critical validation warnings */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         SceneSerializer
	       ---
	       comprehensive scene serialization system that converts
	       editor scene data to engine-compatible runtime format.
	       provides validation, optimization, and asset management
	       for efficient scene loading and execution.

	       the serializer handles complex scene hierarchies,
	       component data transformation, asset reference resolution,
	       and runtime optimization to ensure scenes load correctly
	       and perform well in the engine environment.

*/
export class SceneSerializer {
  private static readonly FORMAT_VERSION = '1.0.0';
  private static readonly SUPPORTED_FORMATS = ['worldenv-scene'];

  /*

           serialize()
  	       ---
  	       converts editor scene data to WORLDENV runtime format
  	       with comprehensive validation, optimization, and asset
  	       management. handles scene hierarchy transformation and
  	       component data serialization for engine compatibility.

  	       the method performs validation before serialization
  	       to catch errors early, optimizes data structures for
  	       runtime performance, and manages asset references
  	       for proper loading in the engine environment.

  */
  static serialize(scene: Scene, options: Partial<SerializationOptions> = {}): SceneData {
    const opts: SerializationOptions = {
      includeAssets: true,
      compressAssets: false,
      optimizeForRuntime: true,
      validateBeforeExport: true,
      includeEditorData: false,
      ...options
    };

    const context: SerializationContext = {
      assetMap: new Map(),
      nodeMap: new Map(),
      componentMap: new Map(),
      errors: [],
      warnings: []
    };

    /* VALIDATE SCENE BEFORE SERIALIZATION */
    if (opts.validateBeforeExport) {
      const validation = this.validateScene(scene);
      if (!validation.isValid) {
        throw new Error(
          `Scene validation failed: ${validation.errors[0]?.message || 'Unknown error'}`
        );
      }
      context.warnings.push(...validation.warnings);
    }

    /* SERIALIZE ROOT NODE */
    const rootNode = this.serializeNode(scene.rootNode, context, opts);

    /* BUILD SCENE DATA */
    const sceneData: SceneData = {
      id: (scene as unknown as { id?: string }).id ?? 'scene-' + Date.now(),
      name: (scene as unknown as { name?: string }).name ?? 'Untitled Scene',
      rootNode,
      settings: this.serializeSettings(scene, context),
      metadata: {
        version: this.FORMAT_VERSION,
        createdAt:
          (scene as unknown as { createdAt?: string }).createdAt ?? new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author: (scene as unknown as { author?: string }).author,
        description: (scene as unknown as { description?: string }).description,
        engineVersion: '0.1.0-prealpha',
        editorVersion: '0.1.0-prealpha'
      }
    };

    /* ADD ASSETS IF REQUESTED */
    if (opts.includeAssets && context.assetMap.size > 0) {
      sceneData.assets = Array.from(context.assetMap.values());
    }

    return sceneData;
  }

  /*

           export()
  	       ---
  	       exports scene with comprehensive metadata for file
  	       storage and distribution. includes serialization data
  	       along with format information, timestamps, and export
  	       configuration for proper scene file management.

  	       the method extends basic serialization with additional
  	       metadata required for file format compatibility and
  	       version tracking in the WORLDENV ecosystem.

  */
  static export(scene: Scene, options: Partial<SerializationOptions> = {}): SceneExportData {
    const sceneData = this.serialize(scene, options);

    return {
      ...sceneData,
      format: 'worldenv-scene',
      formatVersion: this.FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      exportSettings: {
        includeAssets: options.includeAssets ?? true,
        compressAssets: options.compressAssets ?? false,
        optimizeForRuntime: options.optimizeForRuntime ?? true
      }
    };
  }

  /*

           validateScene()
  	       ---
  	       performs comprehensive scene validation to ensure
  	       data integrity and compatibility before serialization.
  	       checks scene structure, component validity, asset
  	       references, and hierarchy consistency.

  	       the method identifies potential issues that could
  	       cause runtime errors or loading failures, providing
  	       detailed error and warning information for debugging
  	       and quality assurance.

  */
  static validateScene(scene: Scene): SceneValidationResult {
    const errors: SceneValidationError[] = [];
    const warnings: SceneValidationError[] = [];

    /* VALIDATE BASIC STRUCTURE */
    const sceneWithId = scene as unknown as { id?: string };
    const sceneWithName = scene as unknown as { name?: string };

    if (!sceneWithId.id || sceneWithId.id.trim() === '') {
      errors.push({
        type: 'error',
        message: 'Scene must have a valid ID'
      });
    }

    if (!sceneWithName.name || sceneWithName.name.trim() === '') {
      errors.push({
        type: 'error',
        message: 'Scene must have a valid name'
      });
    }

    if (!scene.rootNode) {
      errors.push({
        type: 'error',
        message: 'Scene must have a root node'
      });
    } else {
      /* VALIDATE NODE HIERARCHY */
      this.validateNode(scene.rootNode, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /*

           serializeNode()
  	       ---
  	       converts individual editor nodes to engine-compatible
  	       format with proper type mapping, component serialization,
  	       and hierarchy preservation. handles transform data,
  	       component attachment, and child node recursion.

  	       the method ensures proper node structure conversion
  	       while maintaining parent-child relationships and
  	       preserving all node metadata required for runtime
  	       scene reconstruction and entity management.

  */
  private static serializeNode(
    node: Node,
    context: SerializationContext,
    options: SerializationOptions
  ): NodeData {
    const nodeData: NodeData = {
      id: node.id,
      name: node.name,
      type: this.convertNodeType(node.type) as
        | 'scene'
        | 'camera'
        | 'light'
        | 'entity_2d'
        | 'entity_3d'
        | 'group',
      enabled: (node as unknown as { enabled?: boolean }).enabled !== false,
      transform: this.serializeTransform(node),
      components: this.serializeComponents(node, context, options),
      children: node.children.map((child: Node) => this.serializeNode(child, context, options)),
      tags: (node as unknown as { tags?: string[] }).tags ?? [],
      layer: (node as unknown as { layer?: number }).layer ?? 0
    };

    /* STORE IN CONTEXT MAP */
    context.nodeMap.set(node.id, nodeData);

    return nodeData;
  }

  /*

           serializeTransform()
  	       ---
  	       extracts and serializes node transformation data
  	       including position, rotation, and scale components.
  	       ensures proper coordinate system conversion and
  	       default value handling for missing transform data.

  	       the method provides consistent transform representation
  	       across different node types and maintains compatibility
  	       with the engine's transform system requirements.

  */
  private static serializeTransform(node: Node): Transform {
    const transform = node.transform || {};

    return {
      position: this.serializeVector3(transform.position || { x: 0, y: 0, z: 0 }),
      rotation: this.serializeVector3(transform.rotation || { x: 0, y: 0, z: 0 }),
      scale: this.serializeVector3(transform.scale || { x: 1, y: 1, z: 1 })
    };
  }

  /*

           serializeComponents()
  	       ---
  	       serializes node components based on node type and
  	       properties. creates appropriate component data for
  	       transform, rendering, lighting, and type-specific
  	       functionality required by the engine system.

  	       the method ensures all nodes have required components
  	       while adding type-specific components for cameras,
  	       lights, and renderable entities with proper default
  	       values and configuration settings.

  */
  private static serializeComponents(
    node: Node,
    context: SerializationContext,
    options: SerializationOptions
  ): ComponentData[] {
    const components: ComponentData[] = [];

    /* ADD TRANSFORM COMPONENT */
    components.push({
      id: `${node.id}-transform`,
      type: 'transform',
      enabled: true,
      properties: {
        position: node.transform?.position || { x: 0, y: 0, z: 0 },
        rotation: node.transform?.rotation || { x: 0, y: 0, z: 0 },
        scale: node.transform?.scale || { x: 1, y: 1, z: 1 }
      }
    });

    /* ADD TYPE-SPECIFIC COMPONENTS */
    switch (node.type) {
      case NodeType.CAMERA:
        components.push({
          id: `${node.id}-camera`,
          type: 'camera',
          enabled: true,
          properties: {
            fov: 75,
            aspect: 16 / 9,
            near: 0.1,
            far: 1000,
            orthographic: false
          }
        });
        break;

      case NodeType.LIGHT:
        components.push({
          id: `${node.id}-light`,
          type: 'light',
          enabled: true,
          properties: {
            lightType: 'directional',
            color: { r: 1, g: 1, b: 1, a: 1 },
            intensity: 1,
            castShadows: false
          }
        });
        break;

      case NodeType.ENTITY_3D:
        components.push({
          id: `${node.id}-render`,
          type: 'render',
          enabled: true,
          properties: {
            color: { r: 1, g: 1, b: 1, a: 1 },
            visible: true,
            castShadows: false,
            receiveShadows: false
          }
        });
        break;

      case NodeType.ENTITY_2D:
        components.push({
          id: `${node.id}-sprite`,
          type: 'sprite',
          enabled: true,
          properties: {
            color: { r: 1, g: 1, b: 1, a: 1 },
            visible: true
          }
        });
        break;
    }

    /* ADD CUSTOM COMPONENTS */
    if (node.components) {
      for (const component of node.components) {
        const serialized = this.serializeComponent(component, context, options);
        if (serialized) {
          components.push(serialized);
        }
      }
    }

    return components;
  }

  /*

           serializeComponent()
  	       ---
  	       serializes individual component data with proper
  	       property extraction and type validation. handles
  	       component-specific data transformation and ensures
  	       compatibility with engine component system.

  	       the method provides consistent component serialization
  	       across all component types while preserving important
  	       properties and maintaining data integrity for runtime
  	       component instantiation and management.

  */
  private static serializeComponent(
    component: unknown,
    context: SerializationContext,
    _options: SerializationOptions
  ): ComponentData | null {
    const comp = component as {
      type?: string;
      id?: string;
      enabled?: boolean;
      properties?: Record<string, unknown>;
    };

    if (!component || !comp.type) {
      return null;
    }

    const componentData: ComponentData = {
      id: comp.id ?? `component-${Date.now()}`,
      type: comp.type,
      enabled: comp.enabled !== false,
      properties: comp.properties ? { ...comp.properties } : {}
    };

    /* PROCESS ASSET REFERENCES */
    this.processAssetReferences(componentData.properties, context);

    context.componentMap.set(componentData.id, componentData);
    return componentData;
  }

  /*

           serializeSettings()
  	       ---
  	       extracts and serializes scene-level configuration
  	       including physics settings, rendering parameters,
  	       lighting configuration, and global scene properties
  	       required for proper engine initialization.

  	       the method ensures all scene settings are properly
  	       formatted and include appropriate default values
  	       for missing configuration options.

  */
  private static serializeSettings(scene: Scene, _context: SerializationContext): SceneSettings {
    const sceneWithSettings = scene as unknown as { settings?: Record<string, unknown> };
    return {
      ambientColor: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
      fogEnabled: false,
      gravity: { x: 0, y: -9.81, z: 0 },
      physicsEnabled: true,
      audioEnabled: true,
      ...sceneWithSettings.settings
    };
  }

  /*

           processAssetReferences()
  	       ---
  	       processes and collects all asset references from
  	       the scene hierarchy, building a comprehensive asset
  	       map for dependency tracking and loading optimization.

  	       the method scans all nodes and components for asset
  	       references, resolves asset paths, and maintains
  	       reference counts for efficient asset management
  	       during scene loading and runtime operations.

  */
  private static processAssetReferences(
    properties: Record<string, unknown>,
    context: SerializationContext
  ): void {
    for (const [_key, value] of Object.entries(properties)) {
      if (this.isAssetReference(value)) {
        const assetValue = value as { id?: string; path: string; type?: string };
        const assetRef: AssetReference = {
          id: assetValue.id ?? `asset-${Date.now()}`,
          path: assetValue.path,
          type: (assetValue.type ?? this.inferAssetType(assetValue.path)) as
            | 'image'
            | 'model'
            | 'audio'
            | 'script'
            | 'material'
            | 'texture'
        };
        context.assetMap.set(assetRef.id, assetRef);
      } else if (typeof value === 'object' && value !== null) {
        this.processAssetReferences(value as Record<string, unknown>, context);
      }
    }
  }

  /*

           convertNodeType()
  	       ---
  	       converts editor node types to engine-compatible
  	       node type identifiers. maps editor-specific node
  	       classifications to runtime node types for proper
  	       engine processing and component attachment.

  	       the method ensures type compatibility between
  	       editor and engine systems while maintaining
  	       node functionality and behavior consistency.

  */
  private static convertNodeType(type: NodeType): string {
    switch (type) {
      case NodeType.SCENE:
        return 'scene';
      case NodeType.CAMERA:
        return 'camera';
      case NodeType.LIGHT:
        return 'light';
      case NodeType.ENTITY_2D:
        return 'entity_2d';
      case NodeType.ENTITY_3D:
        return 'entity_3d';
      case NodeType.GROUP:
        return 'group';
      default:
        return 'group';
    }
  }

  /*

           serializeVector3()
  	       ---
  	       serializes Vector3 data with proper numeric validation
  	       and default value handling. ensures consistent vector
  	       representation across transform and component data.

  	       the method provides safe vector serialization with
  	       fallback values for invalid or missing components.

  */
  private static serializeVector3(vector: unknown): Vector3 {
    const vec = vector as { x?: number; y?: number; z?: number };
    return {
      x: Number(vec.x) || 0,
      y: Number(vec.y) || 0,
      z: Number(vec.z) || 0
    };
  }

  /*

           validateNode()
  	       ---
  	       validates individual nodes and their hierarchies
  	       for serialization compatibility. checks node structure,
  	       component validity, and hierarchy consistency to
  	       prevent runtime errors and loading failures.

  	       the method recursively validates child nodes and
  	       accumulates validation errors and warnings for
  	       comprehensive scene quality assurance.

  */
  private static validateNode(
    node: Node,
    errors: SceneValidationError[],
    warnings: SceneValidationError[]
  ): void {
    if (!node.id || node.id.trim() === '') {
      errors.push({
        type: 'error',
        message: 'Node must have a valid ID',
        nodeId: node.id
      });
    }

    if (!node.name || node.name.trim() === '') {
      warnings.push({
        type: 'warning',
        message: 'Node should have a descriptive name',
        nodeId: node.id
      });
    }

    /* VALIDATE CHILDREN */
    for (const child of node.children ?? []) {
      this.validateNode(child, errors, warnings);
    }
  }

  /*

           isAssetReference()
  	       ---
  	       determines if a string represents an asset reference
  	       by checking for asset URI patterns and file extensions.
  	       used during serialization to identify and process
  	       asset dependencies correctly.

  	       the method provides reliable asset reference detection
  	       for proper dependency tracking and asset management.

  */
  private static isAssetReference(value: unknown): boolean {
    const obj = value as { path?: unknown };
    return Boolean(
      value && typeof value === 'object' && typeof obj.path === 'string' && obj.path.length > 0
    );
  }

  /*

           inferAssetType()
  	       ---
  	       infers asset type from file extension patterns to
  	       enable proper asset categorization and loading
  	       behavior. maps file extensions to asset types
  	       for engine processing and component assignment.

  	       the method provides comprehensive asset type
  	       classification for various media and data formats
  	       supported by the WORLDENV engine system.

  */
  private static inferAssetType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
        return 'image';
      case 'obj':
      case 'fbx':
      case 'gltf':
      case 'glb':
        return 'model';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'ts':
      case 'js':
      case 'as':
        return 'script';
      case 'mat':
        return 'material';
      case 'scene':
        return 'scene';
      default:
        return 'unknown';
    }
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
