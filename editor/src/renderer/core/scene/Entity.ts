/*
   ===============================================================
   WORLDEDIT ENTITY CLASS
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

import type { Component } from '../components/Component';
import type { EntityData, ComponentData } from '../../../shared/types';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         Entity
	       ---
	       core scene entity class that represents game objects
	       in the scene hierarchy. entities are containers for
	       components that define behavior, rendering, physics,
	       and other game logic functionality.

	       entities maintain a parent-child hierarchy for
	       scene organization and transformation inheritance.
	       each entity has a unique identifier and can be
	       enabled/disabled for selective processing.

*/

export class Entity {
  /*
	===============================================================
             --- PROPERTIES ---
	===============================================================
*/

  public readonly id: string /* unique entity identifier */;

  public name: string /* human-readable entity name */;

  public parent: string | null /* parent entity ID for hierarchy */;

  public children: string[] /* child entity IDs */;

  public enabled: boolean /* whether entity is active */;

  private components: Map<string, Component> /* component instances */;

  /*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

  /*

           constructor()
	         ---
	         initializes a new entity with the provided data.
	         creates empty component map and sets up basic
	         entity properties including hierarchy relationships.

  */

  constructor(data: EntityData) {
    /* ASSERTION: validate entity data parameter */
    console.assert(
      data !== null && typeof data === 'object',
      'Entity constructor: data must be valid EntityData object'
    );
    console.assert(
      typeof data.id === 'string' && data.id.length > 0,
      'Entity constructor: data.id must be non-empty string'
    );
    console.assert(typeof data.name === 'string', 'Entity constructor: data.name must be string');
    console.assert(
      typeof data.enabled === 'boolean',
      'Entity constructor: data.enabled must be boolean'
    );

    if (!data || typeof data !== 'object') {
      throw new Error('Entity constructor: Invalid data parameter - must be EntityData object');
    }

    if (typeof data.id !== 'string' || data.id.length === 0) {
      throw new Error('Entity constructor: Invalid id - must be non-empty string');
    }

    if (typeof data.name !== 'string') {
      throw new Error('Entity constructor: Invalid name - must be string');
    }

    if (typeof data.enabled !== 'boolean') {
      throw new Error('Entity constructor: Invalid enabled - must be boolean');
    }

    this.id = data.id;
    this.name = data.name;
    this.parent = data.parent;
    this.children = [...(data.children || [])];
    this.enabled = data.enabled;
    this.components = new Map<string, Component>();
  }

  /*

           getComponent()
	         ---
	         retrieves a component by type name. returns the
	         component instance if found, or undefined if the
	         entity does not have that component type.

  */

  getComponent<T extends Component>(type: string): T | undefined {
    /* ASSERTION: validate component type parameter */
    console.assert(
      typeof type === 'string' && type.length > 0,
      'getComponent: type must be non-empty string'
    );

    if (typeof type !== 'string' || type.length === 0) {
      console.error('[ENTITY] getComponent: Invalid type parameter');
      return undefined;
    }

    return this.components.get(type) as T | undefined;
  }

  /*

           hasComponent()
	         ---
	         checks if the entity has a component of the specified
	         type. returns true if the component exists, false
	         otherwise.

  */

  hasComponent(type: string): boolean {
    /* ASSERTION: validate component type parameter */
    console.assert(
      typeof type === 'string' && type.length > 0,
      'hasComponent: type must be non-empty string'
    );

    if (typeof type !== 'string' || type.length === 0) {
      console.error('[ENTITY] hasComponent: Invalid type parameter');
      return false;
    }

    return this.components.has(type);
  }

  /*

           addComponent()
	         ---
	         adds a new component to the entity. replaces any
	         existing component of the same type. validates
	         the component before adding it.

  */

  addComponent(component: Component): void {
    /* ASSERTION: validate component parameter */
    console.assert(
      component !== null && typeof component === 'object',
      'addComponent: component must be valid Component object'
    );
    console.assert(
      typeof component.type === 'string',
      'addComponent: component must have type property'
    );

    if (!component || typeof component !== 'object') {
      throw new Error('addComponent: Invalid component - must be Component object');
    }

    if (typeof component.type !== 'string') {
      throw new Error('addComponent: Component must have type property');
    }

    const type = component.type;
    this.components.set(type, component);
  }

  /*

           removeComponent()
	         ---
	         removes a component by type name. returns true if
	         the component was removed, false if it didn't exist.

  */

  removeComponent(type: string): boolean {
    /* ASSERTION: validate component type parameter */
    console.assert(
      typeof type === 'string' && type.length > 0,
      'removeComponent: type must be non-empty string'
    );

    if (typeof type !== 'string' || type.length === 0) {
      console.error('[ENTITY] removeComponent: Invalid type parameter');
      return false;
    }

    return this.components.delete(type);
  }

  /*

           getComponents()
	         ---
	         returns an array of all components attached to
	         this entity. provides access to the complete
	         component set for iteration or inspection.

  */

  getComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /*

           getComponentTypes()
	         ---
	         returns an array of all component type names
	         attached to this entity. useful for dependency
	         checking and component management.

  */

  getComponentTypes(): string[] {
    return Array.from(this.components.keys());
  }

  /*

           addChild()
	         ---
	         adds a child entity ID to this entity's children
	         array. maintains parent-child relationships in
	         the scene hierarchy.

  */

  addChild(childId: string): void {
    /* ASSERTION: validate child ID parameter */
    console.assert(
      typeof childId === 'string' && childId.length > 0,
      'addChild: childId must be non-empty string'
    );
    console.assert(childId !== this.id, 'addChild: entity cannot be its own child');
    console.assert(
      !this.children.includes(childId),
      'addChild: child already exists in children array'
    );

    if (typeof childId !== 'string' || childId.length === 0) {
      throw new Error('addChild: Invalid childId - must be non-empty string');
    }

    if (childId === this.id) {
      throw new Error('addChild: Entity cannot be its own child');
    }

    if (this.children.includes(childId)) {
      console.warn(`[ENTITY] addChild: Child ${childId} already exists`);
      return;
    }

    this.children.push(childId);
  }

  /*

           removeChild()
	         ---
	         removes a child entity ID from this entity's
	         children array. returns true if the child was
	         removed, false if it didn't exist.

  */

  removeChild(childId: string): boolean {
    /* ASSERTION: validate child ID parameter */
    console.assert(
      typeof childId === 'string' && childId.length > 0,
      'removeChild: childId must be non-empty string'
    );

    if (typeof childId !== 'string' || childId.length === 0) {
      console.error('[ENTITY] removeChild: Invalid childId parameter');
      return false;
    }

    const index = this.children.indexOf(childId);
    if (index >= 0) {
      this.children.splice(index, 1);
      return true;
    }

    return false;
  }

  /*

           setParent()
	         ---
	         sets the parent entity ID for this entity.
	         updates the parent-child hierarchy relationship.
	         pass null to remove parent (make root entity).

  */

  setParent(parentId: string | null): void {
    /* ASSERTION: validate parent ID parameter */
    console.assert(
      parentId === null || (typeof parentId === 'string' && parentId.length > 0),
      'setParent: parentId must be null or non-empty string'
    );
    console.assert(parentId !== this.id, 'setParent: entity cannot be its own parent');

    if (parentId !== null && (typeof parentId !== 'string' || parentId.length === 0)) {
      throw new Error('setParent: Invalid parentId - must be null or non-empty string');
    }

    if (parentId === this.id) {
      throw new Error('setParent: Entity cannot be its own parent');
    }

    this.parent = parentId;
  }

  /*

           toData()
	         ---
	         converts the entity to serializable EntityData
	         format for saving, network transmission, or
	         other persistence operations.

  */

  toData(): EntityData {
    const componentDataArray: ComponentData[] = [];

    for (const [type, component] of this.components) {
      if (typeof component.serialize === 'function') {
        componentDataArray.push(component.serialize());
      } else {
        console.warn(`[ENTITY] Component ${type} missing serialize method`);
      }
    }

    return {
      id: this.id,
      name: this.name,
      parent: this.parent,
      children: [...this.children],
      components: componentDataArray,
      enabled: this.enabled
    };
  }

  /*

           clone()
	         ---
	         creates a deep copy of the entity with a new ID.
	         copies all components and hierarchy relationships
	         while generating a unique identifier.

  */

  clone(newId: string): Entity {
    /* ASSERTION: validate new ID parameter */
    console.assert(
      typeof newId === 'string' && newId.length > 0,
      'clone: newId must be non-empty string'
    );
    console.assert(newId !== this.id, 'clone: newId must be different from current entity ID');

    if (typeof newId !== 'string' || newId.length === 0) {
      throw new Error('clone: Invalid newId - must be non-empty string');
    }

    if (newId === this.id) {
      throw new Error('clone: newId must be different from current entity ID');
    }

    const cloneData: EntityData = {
      id: newId,
      name: `${this.name} (Clone)`,
      parent: this.parent,
      children: [], // Children relationships are not cloned
      components: [],
      enabled: this.enabled
    };

    const cloned = new Entity(cloneData);

    // Clone all components
    for (const [type, component] of this.components) {
      if (typeof component.clone === 'function') {
        cloned.addComponent(component.clone() as Component);
      } else {
        console.warn(`[ENTITY] Component ${type} missing clone method`);
      }
    }

    return cloned;
  }
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
