/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Component System
 *
 * Component system manager for node component operations.
 * Handles component attachment, removal, and lifecycle management.
 */

import { IComponent, ComponentSerialData } from './Component';
import { componentRegistry } from './ComponentRegistry';
import { Node } from '../hierarchy/Node';

/**
 * Component change event types
 */
export enum ComponentChangeType {
  COMPONENT_ADDED = 'component_added',
  COMPONENT_REMOVED = 'component_removed',
  COMPONENT_ENABLED = 'component_enabled',
  COMPONENT_DISABLED = 'component_disabled',
  COMPONENT_MODIFIED = 'component_modified',
  COMPONENT_REORDERED = 'component_reordered',
}

/**
 * Component change event
 */
export interface ComponentChangeEvent {
  type: ComponentChangeType;
  nodeId: string;
  componentType: string;
  componentId: string;
  component?: IComponent;
  previousIndex?: number;
  newIndex?: number;
  timestamp: Date;
}

/**
 * Component change listener
 */
export type ComponentChangeListener = (event: ComponentChangeEvent) => void;

/**
 * Component operation result
 */
export interface ComponentOperationResult {
  success: boolean;
  error?: string;
  component?: IComponent;
}

/**
 * Component attachment info
 */
export interface ComponentAttachment {
  component: IComponent;
  index: number;
  enabled: boolean;
}

/**
 * Component system class
 *
 * Manages component lifecycle and operations on nodes.
 * Provides event system for tracking component changes.
 */
export class ComponentSystem {
  private _nodeComponents: Map<string, Map<string, ComponentAttachment>> = new Map();
  private _componentOrder: Map<string, string[]> = new Map();
  private _listeners: Set<ComponentChangeListener> = new Set();

  /**
   * ComponentSystem constructor
   */
  constructor() {
    // Initialize with empty state
  }

  /**
   * emitChange()
   *
   * Emits component change event.
   */
  private emitChange(event: Omit<ComponentChangeEvent, 'timestamp'>): void {
    const fullEvent: ComponentChangeEvent = {
      ...event,
      timestamp: new Date(),
    };

    for (const listener of this._listeners) {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('[COMPONENT_SYSTEM] Change listener error:', error);
      }
    }
  }

  /**
   * addChangeListener()
   *
   * Adds component change listener.
   */
  addChangeListener(listener: ComponentChangeListener): void {
    this._listeners.add(listener);
  }

  /**
   * removeChangeListener()
   *
   * Removes component change listener.
   */
  removeChangeListener(listener: ComponentChangeListener): void {
    this._listeners.delete(listener);
  }

  /**
   * addComponent()
   *
   * Adds component to node.
   */
  addComponent(nodeId: string, componentType: string): ComponentOperationResult {
    // Check if component type is registered
    if (!componentRegistry.isRegistered(componentType)) {
      return {
        success: false,
        error: `Component type '${componentType}' is not registered`,
      };
    }

    // Create component instance
    const component = componentRegistry.createComponent(componentType);
    if (!component) {
      return {
        success: false,
        error: `Failed to create component of type '${componentType}'`,
      };
    }

    return this.addComponentInstance(nodeId, component);
  }

  /**
   * addComponentInstance()
   *
   * Adds component instance to node.
   */
  addComponentInstance(nodeId: string, component: IComponent): ComponentOperationResult {
    // Get or create node component map
    let nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      nodeComponents = new Map();
      this._nodeComponents.set(nodeId, nodeComponents);
    }

    // Check if component type already exists
    if (this.hasComponent(nodeId, component.type)) {
      return {
        success: false,
        error: `Component of type '${component.type}' already exists on node`,
      };
    }

    // Check dependencies and conflicts
    const existingTypes = this.getComponentTypes(nodeId);
    const deps = componentRegistry.checkDependencies(component.type, existingTypes);

    if (!deps.satisfied) {
      if (deps.missing.length > 0) {
        return {
          success: false,
          error: `Missing dependencies: ${deps.missing.join(', ')}`,
        };
      }
      if (deps.conflicts.length > 0) {
        return {
          success: false,
          error: `Conflicts with existing components: ${deps.conflicts.join(', ')}`,
        };
      }
    }

    // Get or create component order array
    let componentOrder = this._componentOrder.get(nodeId);
    if (!componentOrder) {
      componentOrder = [];
      this._componentOrder.set(nodeId, componentOrder);
    }

    // Add component
    const index = componentOrder.length;
    const attachment: ComponentAttachment = {
      component,
      index,
      enabled: component.enabled,
    };

    nodeComponents.set(component.type, attachment);
    componentOrder.push(component.type);

    this.emitChange({
      type: ComponentChangeType.COMPONENT_ADDED,
      nodeId,
      componentType: component.type,
      componentId: component.id,
      component,
    });

    return {
      success: true,
      component,
    };
  }

  /**
   * removeComponent()
   *
   * Removes component from node.
   */
  removeComponent(nodeId: string, componentType: string): ComponentOperationResult {
    const nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      return {
        success: false,
        error: 'Node has no components',
      };
    }

    const attachment = nodeComponents.get(componentType);
    if (!attachment) {
      return {
        success: false,
        error: `Component of type '${componentType}' not found on node`,
      };
    }

    // Check if other components depend on this one
    const existingTypes = this.getComponentTypes(nodeId);
    const dependents = componentRegistry.getComponentsByDependency(componentType);
    const conflictingDependents = dependents.filter(dep =>
      existingTypes.includes(dep.type)
    );

    if (conflictingDependents.length > 0) {
      return {
        success: false,
        error: `Cannot remove component: required by ${conflictingDependents.map(d => d.displayName).join(', ')}`,
      };
    }

    // Remove from order array
    const componentOrder = this._componentOrder.get(nodeId);
    if (componentOrder) {
      const index = componentOrder.indexOf(componentType);
      if (index !== -1) {
        componentOrder.splice(index, 1);

        // Update indices for remaining components
        this.updateComponentIndices(nodeId);
      }
    }

    // Dispose component
    attachment.component.dispose();

    // Remove from map
    nodeComponents.delete(componentType);

    // Clean up empty maps
    if (nodeComponents.size === 0) {
      this._nodeComponents.delete(nodeId);
      this._componentOrder.delete(nodeId);
    }

    this.emitChange({
      type: ComponentChangeType.COMPONENT_REMOVED,
      nodeId,
      componentType,
      componentId: attachment.component.id,
    });

    return {
      success: true,
      component: attachment.component,
    };
  }

  /**
   * hasComponent()
   *
   * Checks if node has component of specific type.
   */
  hasComponent(nodeId: string, componentType: string): boolean {
    const nodeComponents = this._nodeComponents.get(nodeId);
    return nodeComponents ? nodeComponents.has(componentType) : false;
  }

  /**
   * getComponent()
   *
   * Gets component instance by type.
   */
  getComponent(nodeId: string, componentType: string): IComponent | null {
    const nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      return null;
    }

    const attachment = nodeComponents.get(componentType);
    return attachment ? attachment.component : null;
  }

  /**
   * getComponents()
   *
   * Gets all components on node in order.
   */
  getComponents(nodeId: string): IComponent[] {
    const componentOrder = this._componentOrder.get(nodeId);
    if (!componentOrder) {
      return [];
    }

    const nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      return [];
    }

    const components: IComponent[] = [];
    for (const componentType of componentOrder) {
      const attachment = nodeComponents.get(componentType);
      if (attachment) {
        components.push(attachment.component);
      }
    }

    return components;
  }

  /**
   * getComponentTypes()
   *
   * Gets component types on node.
   */
  getComponentTypes(nodeId: string): string[] {
    const componentOrder = this._componentOrder.get(nodeId);
    return componentOrder ? [...componentOrder] : [];
  }

  /**
   * getComponentCount()
   *
   * Gets number of components on node.
   */
  getComponentCount(nodeId: string): number {
    const nodeComponents = this._nodeComponents.get(nodeId);
    return nodeComponents ? nodeComponents.size : 0;
  }

  /**
   * setComponentEnabled()
   *
   * Sets component enabled state.
   */
  setComponentEnabled(nodeId: string, componentType: string, enabled: boolean): boolean {
    const nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      return false;
    }

    const attachment = nodeComponents.get(componentType);
    if (!attachment) {
      return false;
    }

    if (attachment.component.enabled !== enabled) {
      attachment.component.enabled = enabled;
      attachment.enabled = enabled;

      this.emitChange({
        type: enabled ? ComponentChangeType.COMPONENT_ENABLED : ComponentChangeType.COMPONENT_DISABLED,
        nodeId,
        componentType,
        componentId: attachment.component.id,
        component: attachment.component,
      });
    }

    return true;
  }

  /**
   * reorderComponent()
   *
   * Changes component order on node.
   */
  reorderComponent(nodeId: string, componentType: string, newIndex: number): boolean {
    const componentOrder = this._componentOrder.get(nodeId);
    if (!componentOrder) {
      return false;
    }

    const currentIndex = componentOrder.indexOf(componentType);
    if (currentIndex === -1) {
      return false;
    }

    // Clamp new index
    const clampedIndex = Math.max(0, Math.min(newIndex, componentOrder.length - 1));
    if (currentIndex === clampedIndex) {
      return false;
    }

    // Move component in order array
    componentOrder.splice(currentIndex, 1);
    componentOrder.splice(clampedIndex, 0, componentType);

    // Update component indices
    this.updateComponentIndices(nodeId);

    this.emitChange({
      type: ComponentChangeType.COMPONENT_REORDERED,
      nodeId,
      componentType,
      componentId: this.getComponent(nodeId, componentType)?.id || '',
      previousIndex: currentIndex,
      newIndex: clampedIndex,
    });

    return true;
  }

  /**
   * updateComponentIndices()
   *
   * Updates component attachment indices after reordering.
   */
  private updateComponentIndices(nodeId: string): void {
    const componentOrder = this._componentOrder.get(nodeId);
    const nodeComponents = this._nodeComponents.get(nodeId);

    if (!componentOrder || !nodeComponents) {
      return;
    }

    componentOrder.forEach((componentType, index) => {
      const attachment = nodeComponents.get(componentType);
      if (attachment) {
        attachment.index = index;
      }
    });
  }

  /**
   * clearComponents()
   *
   * Removes all components from node.
   */
  clearComponents(nodeId: string): boolean {
    const nodeComponents = this._nodeComponents.get(nodeId);
    if (!nodeComponents) {
      return false;
    }

    // Dispose all components
    for (const attachment of nodeComponents.values()) {
      attachment.component.dispose();
    }

    // Clear maps
    this._nodeComponents.delete(nodeId);
    this._componentOrder.delete(nodeId);

    return true;
  }

  /**
   * copyComponents()
   *
   * Copies components from source node to target node.
   */
  copyComponents(sourceNodeId: string, targetNodeId: string): ComponentOperationResult[] {
    const sourceComponents = this.getComponents(sourceNodeId);
    const results: ComponentOperationResult[] = [];

    for (const component of sourceComponents) {
      const cloned = component.clone();
      const result = this.addComponentInstance(targetNodeId, cloned);
      results.push(result);

      if (!result.success && cloned) {
        cloned.dispose();
      }
    }

    return results;
  }

  /**
   * serializeComponents()
   *
   * Serializes all components on node.
   */
  serializeComponents(nodeId: string): Record<string, ComponentSerialData> {
    const components = this.getComponents(nodeId);
    const serialized: Record<string, ComponentSerialData> = {};

    for (const component of components) {
      serialized[component.type] = component.serialize();
    }

    return serialized;
  }

  /**
   * deserializeComponents()
   *
   * Deserializes components onto node.
   */
  deserializeComponents(nodeId: string, data: Record<string, ComponentSerialData>): ComponentOperationResult[] {
    const results: ComponentOperationResult[] = [];

    // Clear existing components first
    this.clearComponents(nodeId);

    // Deserialize components in order
    const sortedData = Object.values(data).sort((a, b) => {
      // Try to maintain component order if stored
      return 0;
    });

    for (const componentData of sortedData) {
      // Create component instance
      const component = componentRegistry.createComponent(componentData.type);
      if (!component) {
        results.push({
          success: false,
          error: `Failed to create component of type '${componentData.type}'`,
        });
        continue;
      }

      // Deserialize component data
      try {
        component.deserialize(componentData);
        const result = this.addComponentInstance(nodeId, component);
        results.push(result);

        if (!result.success) {
          component.dispose();
        }
      } catch (error) {
        component.dispose();
        results.push({
          success: false,
          error: `Failed to deserialize component '${componentData.type}': ${error}`,
        });
      }
    }

    return results;
  }

  /**
   * getAvailableComponents()
   *
   * Gets components that can be added to node.
   */
  getAvailableComponents(nodeId: string): string[] {
    const existingTypes = this.getComponentTypes(nodeId);
    const available: string[] = [];

    for (const descriptor of componentRegistry.getVisibleDescriptors()) {
      // Skip if already attached
      if (existingTypes.includes(descriptor.type)) {
        continue;
      }

      // Check dependencies and conflicts
      const deps = componentRegistry.checkDependencies(descriptor.type, existingTypes);
      if (deps.satisfied) {
        available.push(descriptor.type);
      }
    }

    return available;
  }

  /**
   * validateNode()
   *
   * Validates all components on node.
   */
  validateNode(nodeId: string): string[] {
    const components = this.getComponents(nodeId);
    const errors: string[] = [];

    for (const component of components) {
      const componentErrors = component.validate();
      errors.push(...componentErrors.map(err => `${component.displayName}: ${err}`));
    }

    return errors;
  }

  /**
   * dispose()
   *
   * Cleanup component system resources.
   */
  dispose(): void {
    // Dispose all components
    for (const nodeComponents of this._nodeComponents.values()) {
      for (const attachment of nodeComponents.values()) {
        attachment.component.dispose();
      }
    }

    this._nodeComponents.clear();
    this._componentOrder.clear();
    this._listeners.clear();
  }
}

/**
 * Global component system instance
 */
export const componentSystem = new ComponentSystem();
