/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Scene Management
 *
 * Scene class for managing scene hierarchy and operations.
 * Handles scene creation, loading, saving, and node management.
 */

import { Node, NodeType, NodeSerialData } from './Node';
import { generateId } from '../../utils/IdGenerator';
import { createDefaultNodeComponents } from '../components';

/**
 * Scene metadata interface
 */
export interface SceneMetadata {
  name: string;
  version: string;
  engineVersion: string;
  created: Date;
  modified: Date;
  author?: string;
  description?: string;
}

/**
 * Scene serialization data
 */
export interface SceneSerialData {
  metadata: SceneMetadata;
  rootNodeId: string;
  nodes: Record<string, NodeSerialData>;
}

/**
 * Scene change event types
 */
export enum SceneChangeType {
  NODE_ADDED = 'node_added',
  NODE_REMOVED = 'node_removed',
  NODE_MODIFIED = 'node_modified',
  NODE_REPARENTED = 'node_reparented',
  SCENE_CLEARED = 'scene_cleared',
  SCENE_LOADED = 'scene_loaded'
}

/**
 * Scene change event
 */
export interface SceneChangeEvent {
  type: SceneChangeType;
  nodeId?: string;
  parentId?: string;
  previousParentId?: string;
  timestamp: Date;
}

/**
 * Scene change listener
 */
export type SceneChangeListener = (event: SceneChangeEvent) => void;

/**
 * Scene class
 *
 * Manages scene hierarchy, node operations, and serialization.
 * Provides event system for tracking changes.
 */
export class Scene {
  protected _metadata: SceneMetadata;
  protected _rootNode: Node;
  protected _nodeRegistry: Map<string, Node> = new Map();
  protected _isDirty: boolean = false;
  protected _changeListeners: Set<SceneChangeListener> = new Set();

  /**
   * Scene constructor
   */
  constructor(name: string = 'New Scene') {
    this._metadata = {
      name,
      version: '1.0.0',
      engineVersion: '0.1.0',
      created: new Date(),
      modified: new Date()
    };

    this._rootNode = new Node('Scene', NodeType.SCENE);
    this._nodeRegistry.set(this._rootNode.id, this._rootNode);
  }

  /**
   * Property getters
   */
  get metadata(): SceneMetadata {
    return { ...this._metadata };
  }
  get rootNode(): Node {
    return this._rootNode;
  }
  get isDirty(): boolean {
    return this._isDirty;
  }
  get nodeCount(): number {
    return this._nodeRegistry.size;
  }

  /**
   * markDirty()
   *
   * Marks scene as modified.
   */
  protected markDirty(): void {
    this._isDirty = true;
    this._metadata.modified = new Date();
  }

  /**
   * clearDirty()
   *
   * Clears dirty flag (after save).
   */
  clearDirty(): void {
    this._isDirty = false;
  }

  /**
   * emitChange()
   *
   * Emits scene change event.
   */
  protected emitChange(event: Omit<SceneChangeEvent, 'timestamp'>): void {
    const fullEvent: SceneChangeEvent = {
      ...event,
      timestamp: new Date()
    };

    for (const listener of this._changeListeners) {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('[SCENE] Change listener error:', error);
      }
    }

    this.markDirty();
  }

  /**
   * addChangeListener()
   *
   * Adds scene change listener.
   */
  addChangeListener(listener: SceneChangeListener): void {
    this._changeListeners.add(listener);
  }

  /**
   * removeChangeListener()
   *
   * Removes scene change listener.
   */
  removeChangeListener(listener: SceneChangeListener): void {
    this._changeListeners.delete(listener);
  }

  /**
   * getNode()
   *
   * Gets node by ID.
   */
  getNode(id: string): Node | null {
    return this._nodeRegistry.get(id) || null;
  }

  /**
   * hasNode()
   *
   * Checks if node exists in scene.
   */
  hasNode(id: string): boolean {
    return this._nodeRegistry.has(id);
  }

  /**
   * getAllNodes()
   *
   * Returns all nodes in scene.
   */
  getAllNodes(): Node[] {
    return Array.from(this._nodeRegistry.values());
  }

  /**
   * findNodeByName()
   *
   * Finds node by name (first match).
   */
  findNodeByName(name: string): Node | null {
    for (const node of this._nodeRegistry.values()) {
      if (node.name === name) {
        return node;
      }
    }
    return null;
  }

  /**
   * findNodesByType()
   *
   * Finds all nodes of specific type.
   */
  findNodesByType(type: NodeType): Node[] {
    const nodes: Node[] = [];
    for (const node of this._nodeRegistry.values()) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * addNode()
   *
   * Adds node to scene.
   */
  addNode(node: Node, parent: Node | null = null): boolean {
    // Check if node already exists
    if (this._nodeRegistry.has(node.id)) {
      return false;
    }

    // Set parent (default to root)
    const targetParent = parent || this._rootNode;
    if (!targetParent.addChild(node)) {
      return false;
    }

    // Register node and all descendants
    this.registerNodeRecursive(node);

    this.emitChange({
      type: SceneChangeType.NODE_ADDED,
      nodeId: node.id,
      parentId: targetParent.id
    });

    return true;
  }

  /**
   * removeNode()
   *
   * Removes node from scene.
   */
  removeNode(node: Node): boolean {
    if (!this._nodeRegistry.has(node.id)) {
      return false;
    }

    // Cannot remove root node
    if (node === this._rootNode) {
      return false;
    }

    const parentId = node.parent?.id;

    // Remove from parent
    if (node.parent) {
      node.parent.removeChild(node);
    }

    // Unregister node and all descendants
    this.unregisterNodeRecursive(node);

    this.emitChange({
      type: SceneChangeType.NODE_REMOVED,
      nodeId: node.id,
      parentId
    });

    return true;
  }

  /**
   * reparentNode()
   *
   * Moves node to new parent.
   */
  reparentNode(node: Node, newParent: Node): boolean {
    if (!this._nodeRegistry.has(node.id) || !this._nodeRegistry.has(newParent.id)) {
      return false;
    }

    // Cannot reparent root node
    if (node === this._rootNode) {
      return false;
    }

    const previousParentId = node.parent?.id;

    if (!newParent.addChild(node)) {
      return false;
    }

    this.emitChange({
      type: SceneChangeType.NODE_REPARENTED,
      nodeId: node.id,
      parentId: newParent.id,
      previousParentId
    });

    return true;
  }

  /**
   * createNode()
   *
   * Creates new node and adds to scene.
   */
  createNode(name: string, type: NodeType, parent: Node | null = null): Node {
    const node = new Node(name, type);
    this.addNode(node, parent);

    // Add default components based on node type
    const defaultComponents = createDefaultNodeComponents(type);
    for (const componentType of defaultComponents) {
      node.addComponent(componentType);
    }

    return node;
  }

  /**
   * duplicateNode()
   *
   * Duplicates node with all children.
   */
  duplicateNode(node: Node, newName?: string): Node | null {
    if (!this._nodeRegistry.has(node.id)) {
      return null;
    }

    // Cannot duplicate root node
    if (node === this._rootNode) {
      return null;
    }

    const cloned = node.clone(newName);
    const parent = node.parent || this._rootNode;

    if (this.addNode(cloned, parent)) {
      return cloned;
    }

    return null;
  }

  /**
   * registerNodeRecursive()
   *
   * Registers node and all descendants.
   */
  protected registerNodeRecursive(node: Node): void {
    this._nodeRegistry.set(node.id, node);

    for (const child of node.children) {
      this.registerNodeRecursive(child);
    }
  }

  /**
   * unregisterNodeRecursive()
   *
   * Unregisters node and all descendants.
   */
  protected unregisterNodeRecursive(node: Node): void {
    for (const child of node.children) {
      this.unregisterNodeRecursive(child);
    }

    this._nodeRegistry.delete(node.id);
  }

  /**
   * clear()
   *
   * Clears entire scene.
   */
  clear(): void {
    const oldRoot = this._rootNode;

    // Create new root
    this._rootNode = new Node('Scene', NodeType.SCENE);
    this._nodeRegistry.clear();
    this._nodeRegistry.set(this._rootNode.id, this._rootNode);

    // Dispose old root
    oldRoot.dispose();

    this.emitChange({
      type: SceneChangeType.SCENE_CLEARED
    });
  }

  /**
   * serialize()
   *
   * Converts scene to serializable data.
   */
  serialize(): SceneSerialData {
    const nodes: Record<string, NodeSerialData> = {};

    // Serialize all nodes
    for (const node of this._nodeRegistry.values()) {
      nodes[node.id] = node.serialize();
    }

    return {
      metadata: { ...this._metadata },
      rootNodeId: this._rootNode.id,
      nodes
    };
  }

  /**
   * deserialize()
   *
   * Creates scene from serialized data.
   */
  static deserialize(data: SceneSerialData): Scene {
    const scene = new Scene(data.metadata.name);
    scene._metadata = { ...data.metadata };

    // Clear default root
    scene._nodeRegistry.clear();

    // Deserialize nodes
    const nodeMap = new Map<string, Node>();
    for (const [id, nodeData] of Object.entries(data.nodes)) {
      const node = Node.deserialize(nodeData);
      nodeMap.set(id, node);
      scene._nodeRegistry.set(id, node);
    }

    // Rebuild hierarchy
    for (const [id, nodeData] of Object.entries(data.nodes)) {
      const node = nodeMap.get(id)!;

      if (id === data.rootNodeId) {
        scene._rootNode = node;
      }

      // Restore parent/child relationships
      for (const childId of nodeData.childIds) {
        const child = nodeMap.get(childId);
        if (child) {
          node.addChild(child);
        }
      }
    }

    scene.emitChange({
      type: SceneChangeType.SCENE_LOADED
    });

    scene.clearDirty();

    return scene;
  }

  /**
   * exportToJson()
   *
   * Exports scene to JSON string.
   */
  exportToJson(prettify: boolean = true): string {
    const data = this.serialize();
    return JSON.stringify(data, null, prettify ? 2 : 0);
  }

  /**
   * importFromJson()
   *
   * Imports scene from JSON string.
   */
  static importFromJson(json: string): Scene {
    try {
      const data = JSON.parse(json) as SceneSerialData;
      return Scene.deserialize(data);
    } catch (error) {
      throw new Error(`Failed to import scene: ${error}`);
    }
  }

  /**
   * getStats()
   *
   * Returns scene statistics.
   */
  getStats(): {
    nodeCount: number;
    maxDepth: number;
    nodesByType: Record<string, number>;
  } {
    const nodesByType: Record<string, number> = {};
    let maxDepth = 0;

    for (const node of this._nodeRegistry.values()) {
      // Count by type
      const type = node.type;
      nodesByType[type] = (nodesByType[type] || 0) + 1;

      // Track max depth
      const depth = node.getDepth();
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }

    return {
      nodeCount: this._nodeRegistry.size,
      maxDepth,
      nodesByType
    };
  }

  /**
   * dispose()
   *
   * Cleanup scene resources.
   */
  dispose(): void {
    this._rootNode.dispose();
    this._nodeRegistry.clear();
    this._changeListeners.clear();
  }
}
