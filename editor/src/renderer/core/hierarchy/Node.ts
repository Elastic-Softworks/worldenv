/*
   ===============================================================
   WORLDEDIT NODE DATA STRUCTURE
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

import { generateId } from '../../utils/IdGenerator'; /* UNIQUE ID GENERATION */
import { componentSystem, ComponentSerialData } from '../components'; /* COMPONENT SYSTEM */
import type { IComponent } from '../components/Component'; /* COMPONENT INTERFACE */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         NodeType
	       ---
	       enumeration of supported node types in the scene
	       hierarchy system. defines entity classifications for
	       proper component attachment and rendering behavior.

*/

export enum NodeType {
  SCENE = 'scene' /* root scene container node */,
  ENTITY_2D = 'entity2d' /* 2D entity for sprites and UI */,
  ENTITY_3D = 'entity3d' /* 3D entity for meshes and models */,
  CAMERA = 'camera' /* camera for scene rendering */,
  LIGHT = 'light' /* light source for illumination */,
  SPRITE = 'sprite' /* 2D sprite entity */,
  MESH = 'mesh' /* 3D mesh entity */,
  AUDIO_SOURCE = 'audio_source' /* audio playback entity */,
  SCRIPT = 'script' /* script-controlled entity */,
  GROUP = 'group'
}

/**
 * Node transform data
 */
export interface Transform {
  position: { x: number; y: number; z?: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

/**
 * Node metadata interface
 */
export interface NodeMetadata {
  created: Date;
  modified: Date;
  version: number;
  tags: string[];
  description?: string;
}

/**
 * Node serialization data
 */
export interface NodeSerialData {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  locked: boolean;
  expanded: boolean;
  transform: Transform;
  components: Record<string, any>;
  metadata: NodeMetadata;
}

/**
 * Node class
 *
 * Base node/entity class for scene hierarchy.
 * Manages parent/child relationships and basic node properties.
 */
export class Node {
  protected _id: string;
  protected _name: string;
  protected _type: NodeType;
  protected _parent: Node | null = null;
  protected _children: Node[] = [];
  protected _visible: boolean = true;
  protected _locked: boolean = false;
  protected _expanded: boolean = true;
  protected _transform: Transform;
  protected _components: Map<string, any> = new Map();
  protected _metadata: NodeMetadata;

  /**
   * Node constructor
   */
  constructor(name: string, type: NodeType, id?: string) {
    this._id = id || generateId();
    this._name = name;
    this._type = type;
    this._transform = this.createDefaultTransform();
    this._metadata = {
      created: new Date(),
      modified: new Date(),
      version: 1,
      tags: []
    };
  }

  /**
   * createDefaultTransform()
   *
   * Creates default transform based on node type.
   */
  protected createDefaultTransform(): Transform {
    const is3D =
      this._type === NodeType.ENTITY_3D ||
      this._type === NodeType.CAMERA ||
      this._type === NodeType.LIGHT ||
      this._type === NodeType.MESH;

    return {
      position: { x: 0, y: 0, z: is3D ? 0 : undefined },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
  }

  /**
   * Basic property getters
   */
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get type(): NodeType {
    return this._type;
  }
  get parent(): Node | null {
    return this._parent;
  }
  get children(): readonly Node[] {
    return this._children;
  }
  get visible(): boolean {
    return this._visible;
  }
  get locked(): boolean {
    return this._locked;
  }
  get expanded(): boolean {
    return this._expanded;
  }
  get transform(): Transform {
    return { ...this._transform };
  }
  get components(): ReadonlyMap<string, any> {
    return this._components;
  }
  get metadata(): NodeMetadata {
    return { ...this._metadata };
  }

  /**
   * Basic property setters
   */
  set name(value: string) {
    this._name = value;
    this.markModified();
  }

  set visible(value: boolean) {
    this._visible = value;
    this.markModified();
  }

  set locked(value: boolean) {
    this._locked = value;
    this.markModified();
  }

  set expanded(value: boolean) {
    this._expanded = value;
    this.markModified();
  }

  /**
   * markModified()
   *
   * Updates modification timestamp and version.
   */
  protected markModified(): void {
    this._metadata.modified = new Date();
    this._metadata.version++;
  }

  /**
   * hasChildren()
   *
   * Returns whether node has child nodes.
   */
  hasChildren(): boolean {
    return this._children.length > 0;
  }

  /**
   * getChildCount()
   *
   * Returns number of direct children.
   */
  getChildCount(): number {
    return this._children.length;
  }

  /**
   * getDescendantCount()
   *
   * Returns total number of descendants (recursive).
   */
  getDescendantCount(): number {
    let count = this._children.length;
    for (const child of this._children) {
      count += child.getDescendantCount();
    }
    return count;
  }

  /**
   * getDepth()
   *
   * Returns depth in hierarchy (0 for root).
   */
  getDepth(): number {
    let depth = 0;
    let current = this._parent;
    while (current) {
      depth++;
      current = current._parent;
    }
    return depth;
  }

  /**
   * getRoot()
   *
   * Returns root node of hierarchy.
   */
  getRoot(): Node {
    let current: Node = this;
    while (current._parent) {
      current = current._parent;
    }
    return current;
  }

  /**
   * getPath()
   *
   * Returns hierarchical path from root.
   */
  getPath(): string {
    const path: string[] = [];
    let current: Node | null = this;
    while (current) {
      path.unshift(current._name);
      current = current._parent;
    }
    return path.join('/');
  }

  /**
   * addChild()
   *
   * Adds child node to this node.
   */
  addChild(child: Node): boolean {
    if (!child || child === this) {
      return false;
    }

    // Prevent circular reference
    if (this.isDescendantOf(child)) {
      return false;
    }

    // Remove from current parent
    if (child._parent) {
      child._parent.removeChild(child);
    }

    // Add to this node
    this._children.push(child);
    child._parent = this;

    this.markModified();
    child.markModified();

    return true;
  }

  /**
   * removeChild()
   *
   * Removes child node from this node.
   */
  removeChild(child: Node): boolean {
    const index = this._children.indexOf(child);
    if (index === -1) {
      return false;
    }

    this._children.splice(index, 1);
    child._parent = null;

    this.markModified();
    child.markModified();

    return true;
  }

  /**
   * insertChildAt()
   *
   * Inserts child at specific index.
   */
  insertChildAt(child: Node, index: number): boolean {
    if (!child || child === this) {
      return false;
    }

    // Prevent circular reference
    if (this.isDescendantOf(child)) {
      return false;
    }

    // Remove from current parent
    if (child._parent) {
      child._parent.removeChild(child);
    }

    // Insert at index
    const clampedIndex = Math.max(0, Math.min(index, this._children.length));
    this._children.splice(clampedIndex, 0, child);
    child._parent = this;

    this.markModified();
    child.markModified();

    return true;
  }

  /**
   * getChildIndex()
   *
   * Returns index of child node.
   */
  getChildIndex(child: Node): number {
    return this._children.indexOf(child);
  }

  /**
   * getChildAt()
   *
   * Returns child at specific index.
   */
  getChildAt(index: number): Node | null {
    if (index < 0 || index >= this._children.length) {
      return null;
    }
    return this._children[index];
  }

  /**
   * isDescendantOf()
   *
   * Checks if this node is descendant of another node.
   */
  isDescendantOf(node: Node): boolean {
    let current = this._parent;
    while (current) {
      if (current === node) {
        return true;
      }
      current = current._parent;
    }
    return false;
  }

  /**
   * isAncestorOf()
   *
   * Checks if this node is ancestor of another node.
   */
  isAncestorOf(node: Node): boolean {
    return node.isDescendantOf(this);
  }

  /**
   * findChild()
   *
   * Finds direct child by name or ID.
   */
  findChild(nameOrId: string): Node | null {
    return (
      this._children.find((child) => child._name === nameOrId || child._id === nameOrId) || null
    );
  }

  /**
   * findDescendant()
   *
   * Finds descendant by name or ID (recursive).
   */
  findDescendant(nameOrId: string): Node | null {
    // Check direct children first
    for (const child of this._children) {
      if (child._name === nameOrId || child._id === nameOrId) {
        return child;
      }
    }

    // Check descendants recursively
    for (const child of this._children) {
      const found = child.findDescendant(nameOrId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * getAllDescendants()
   *
   * Returns all descendants (recursive).
   */
  getAllDescendants(): Node[] {
    const descendants: Node[] = [];

    function traverse(node: Node): void {
      for (const child of node._children) {
        descendants.push(child);
        traverse(child);
      }
    }

    traverse(this);
    return descendants;
  }

  /**
   * setTransform()
   *
   * Updates transform data.
   */
  setTransform(transform: Partial<Transform>): void {
    this._transform = { ...this._transform, ...transform };
    this.markModified();
  }

  /**
   * addComponent()
   *
   * Adds component to node via component system.
   */
  addComponent(type: string): boolean {
    const result = componentSystem.addComponent(this._id, type);
    if (result.success) {
      this.markModified();
    }
    return result.success;
  }

  /**
   * removeComponent()
   *
   * Removes component from node via component system.
   */
  removeComponent(type: string): boolean {
    const result = componentSystem.removeComponent(this._id, type);
    if (result.success) {
      this.markModified();
    }
    return result.success;
  }

  /**
   * hasComponent()
   *
   * Checks if node has component.
   */
  hasComponent(type: string): boolean {
    return componentSystem.hasComponent(this._id, type);
  }

  /**
   * getComponent()
   *
   * Gets component instance.
   */
  getComponent<T extends IComponent = IComponent>(type: string): T | null {
    return componentSystem.getComponent(this._id, type) as T | null;
  }

  /**
   * getComponents()
   *
   * Gets all components on this node.
   */
  getComponents(): IComponent[] {
    return componentSystem.getComponents(this._id);
  }

  /**
   * getComponentTypes()
   *
   * Gets all component types on this node.
   */
  getComponentTypes(): string[] {
    return componentSystem.getComponentTypes(this._id);
  }

  /**
   * getComponentCount()
   *
   * Gets number of components on this node.
   */
  getComponentCount(): number {
    return componentSystem.getComponentCount(this._id);
  }

  /**
   * clone()
   *
   * Creates deep clone of node.
   */
  clone(newName?: string): Node {
    const cloned = new Node(newName || this._name, this._type);

    // Copy properties
    cloned._visible = this._visible;
    cloned._locked = this._locked;
    cloned._expanded = this._expanded;
    cloned._transform = { ...this._transform };

    // Copy metadata (excluding timestamps)
    cloned._metadata = {
      ...this._metadata,
      created: new Date(),
      modified: new Date(),
      version: 1
    };

    // Copy components via component system
    componentSystem.copyComponents(this._id, cloned._id);

    // Clone children recursively
    for (const child of this._children) {
      const clonedChild = child.clone();
      cloned.addChild(clonedChild);
    }

    return cloned;
  }

  /**
   * serialize()
   *
   * Converts node to serializable data.
   */
  serialize(): NodeSerialData {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      parentId: this._parent?._id || null,
      childIds: this._children.map((child) => child._id),
      visible: this._visible,
      locked: this._locked,
      expanded: this._expanded,
      transform: { ...this._transform },
      components: componentSystem.serializeComponents(this._id),
      metadata: { ...this._metadata }
    };
  }

  /**
   * deserialize()
   *
   * Creates node from serialized data.
   */
  static deserialize(data: NodeSerialData): Node {
    const node = new Node(data.name, data.type, data.id);

    node._visible = data.visible;
    node._locked = data.locked;
    node._expanded = data.expanded;
    node._transform = { ...data.transform };
    node._metadata = { ...data.metadata };

    // Restore components via component system
    if (data.components && typeof data.components === 'object') {
      componentSystem.deserializeComponents(
        node._id,
        data.components as Record<string, ComponentSerialData>
      );
    }

    return node;
  }

  /**
   * dispose()
   *
   * Cleanup node resources.
   */
  dispose(): void {
    // Remove from parent
    if (this._parent) {
      this._parent.removeChild(this);
    }

    // Dispose children
    const children = [...this._children];
    for (const child of children) {
      child.dispose();
    }

    // Clear components via component system
    componentSystem.clearComponents(this._id);

    // Clear references
    this._parent = null;
    this._children.length = 0;
    this._components.clear();
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
