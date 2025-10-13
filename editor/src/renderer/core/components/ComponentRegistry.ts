/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Component Registry
 *
 * Central registry for component types, factories, and metadata.
 * Manages component discovery, creation, and validation.
 */

import { IComponent, ComponentDescriptor, ComponentFactory } from './Component';

/**
 * Component registration event types
 */
export enum RegistryEventType {
  COMPONENT_REGISTERED = 'component_registered',
  COMPONENT_UNREGISTERED = 'component_unregistered',
  REGISTRY_CLEARED = 'registry_cleared',
}

/**
 * Registry event interface
 */
export interface RegistryEvent {
  type: RegistryEventType;
  componentType?: string;
  descriptor?: ComponentDescriptor;
  timestamp: Date;
}

/**
 * Registry event listener
 */
export type RegistryEventListener = (event: RegistryEvent) => void;

/**
 * Component category interface
 */
export interface ComponentCategory {
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  order: number;
}

/**
 * Component registry class
 *
 * Manages component type registration, factory creation,
 * and component metadata for the editor system.
 */
export class ComponentRegistry {
  private _descriptors: Map<string, ComponentDescriptor> = new Map();
  private _categories: Map<string, ComponentCategory> = new Map();
  private _listeners: Set<RegistryEventListener> = new Set();

  /**
   * ComponentRegistry constructor
   */
  constructor() {
    this.initializeDefaultCategories();
  }

  /**
   * initializeDefaultCategories()
   *
   * Sets up default component categories.
   */
  private initializeDefaultCategories(): void {
    this.registerCategory({
      name: 'Core',
      displayName: 'Core',
      description: 'Essential core components',
      icon: '🔧',
      order: 0,
    });

    this.registerCategory({
      name: 'Rendering',
      displayName: 'Rendering',
      description: 'Visual rendering components',
      icon: '🎨',
      order: 10,
    });

    this.registerCategory({
      name: 'Physics',
      displayName: 'Physics',
      description: 'Physics and collision components',
      icon: '⚽',
      order: 20,
    });

    this.registerCategory({
      name: 'Audio',
      displayName: 'Audio',
      description: 'Audio and sound components',
      icon: '🔊',
      order: 30,
    });

    this.registerCategory({
      name: 'Scripting',
      displayName: 'Scripting',
      description: 'Script and logic components',
      icon: '📜',
      order: 40,
    });

    this.registerCategory({
      name: 'UI',
      displayName: 'User Interface',
      description: 'UI and interface components',
      icon: '🖼️',
      order: 50,
    });

    this.registerCategory({
      name: 'Utility',
      displayName: 'Utility',
      description: 'Utility and helper components',
      icon: '🔨',
      order: 60,
    });
  }

  /**
   * emitEvent()
   *
   * Emits registry event to listeners.
   */
  private emitEvent(event: Omit<RegistryEvent, 'timestamp'>): void {
    const fullEvent: RegistryEvent = {
      ...event,
      timestamp: new Date(),
    };

    for (const listener of this._listeners) {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('[COMPONENT_REGISTRY] Event listener error:', error);
      }
    }
  }

  /**
   * addListener()
   *
   * Adds registry event listener.
   */
  addListener(listener: RegistryEventListener): void {
    this._listeners.add(listener);
  }

  /**
   * removeListener()
   *
   * Removes registry event listener.
   */
  removeListener(listener: RegistryEventListener): void {
    this._listeners.delete(listener);
  }

  /**
   * registerCategory()
   *
   * Registers component category.
   */
  registerCategory(category: ComponentCategory): void {
    this._categories.set(category.name, category);
  }

  /**
   * getCategory()
   *
   * Gets component category by name.
   */
  getCategory(name: string): ComponentCategory | null {
    return this._categories.get(name) || null;
  }

  /**
   * getAllCategories()
   *
   * Gets all component categories sorted by order.
   */
  getAllCategories(): ComponentCategory[] {
    return Array.from(this._categories.values())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * register()
   *
   * Registers component type with factory.
   */
  register(descriptor: ComponentDescriptor): boolean {
    if (this._descriptors.has(descriptor.type)) {
      console.warn(`[COMPONENT_REGISTRY] Component type '${descriptor.type}' already registered`);
      return false;
    }

    // Validate descriptor
    if (!this.validateDescriptor(descriptor)) {
      console.error(`[COMPONENT_REGISTRY] Invalid component descriptor: ${descriptor.type}`);
      return false;
    }

    // Ensure category exists
    if (!this._categories.has(descriptor.category)) {
      console.warn(`[COMPONENT_REGISTRY] Unknown category '${descriptor.category}' for component '${descriptor.type}'`);
      this.registerCategory({
        name: descriptor.category,
        displayName: descriptor.category,
        description: `Auto-generated category for ${descriptor.category}`,
        order: 999,
      });
    }

    // Register component
    this._descriptors.set(descriptor.type, descriptor);

    this.emitEvent({
      type: RegistryEventType.COMPONENT_REGISTERED,
      componentType: descriptor.type,
      descriptor,
    });

    return true;
  }

  /**
   * unregister()
   *
   * Unregisters component type.
   */
  unregister(type: string): boolean {
    const descriptor = this._descriptors.get(type);
    if (!descriptor) {
      return false;
    }

    this._descriptors.delete(type);

    this.emitEvent({
      type: RegistryEventType.COMPONENT_UNREGISTERED,
      componentType: type,
      descriptor,
    });

    return true;
  }

  /**
   * isRegistered()
   *
   * Checks if component type is registered.
   */
  isRegistered(type: string): boolean {
    return this._descriptors.has(type);
  }

  /**
   * getDescriptor()
   *
   * Gets component descriptor by type.
   */
  getDescriptor(type: string): ComponentDescriptor | null {
    return this._descriptors.get(type) || null;
  }

  /**
   * getAllDescriptors()
   *
   * Gets all registered component descriptors.
   */
  getAllDescriptors(): ComponentDescriptor[] {
    return Array.from(this._descriptors.values());
  }

  /**
   * getDescriptorsByCategory()
   *
   * Gets component descriptors filtered by category.
   */
  getDescriptorsByCategory(category: string): ComponentDescriptor[] {
    return Array.from(this._descriptors.values())
      .filter(desc => desc.category === category);
  }

  /**
   * getVisibleDescriptors()
   *
   * Gets descriptors for components visible in UI.
   */
  getVisibleDescriptors(): ComponentDescriptor[] {
    return Array.from(this._descriptors.values())
      .filter(desc => desc.isVisible);
  }

  /**
   * getCoreDescriptors()
   *
   * Gets descriptors for core components.
   */
  getCoreDescriptors(): ComponentDescriptor[] {
    return Array.from(this._descriptors.values())
      .filter(desc => desc.isCore);
  }

  /**
   * createComponent()
   *
   * Creates component instance by type.
   */
  createComponent(type: string): IComponent | null {
    const descriptor = this._descriptors.get(type);
    if (!descriptor) {
      console.error(`[COMPONENT_REGISTRY] Unknown component type: ${type}`);
      return null;
    }

    try {
      return descriptor.factory();
    } catch (error) {
      console.error(`[COMPONENT_REGISTRY] Failed to create component '${type}':`, error);
      return null;
    }
  }

  /**
   * validateDescriptor()
   *
   * Validates component descriptor.
   */
  private validateDescriptor(descriptor: ComponentDescriptor): boolean {
    if (!descriptor.type || typeof descriptor.type !== 'string') {
      return false;
    }

    if (!descriptor.displayName || typeof descriptor.displayName !== 'string') {
      return false;
    }

    if (!descriptor.category || typeof descriptor.category !== 'string') {
      return false;
    }

    if (typeof descriptor.factory !== 'function') {
      return false;
    }

    // Validate dependencies
    if (descriptor.dependencies) {
      for (const dep of descriptor.dependencies) {
        if (!this._descriptors.has(dep)) {
          console.warn(`[COMPONENT_REGISTRY] Missing dependency '${dep}' for component '${descriptor.type}'`);
        }
      }
    }

    // Validate conflicts
    if (descriptor.conflicts) {
      for (const conflict of descriptor.conflicts) {
        if (this._descriptors.has(conflict)) {
          console.warn(`[COMPONENT_REGISTRY] Conflicting component '${conflict}' already registered for '${descriptor.type}'`);
        }
      }
    }

    return true;
  }

  /**
   * checkDependencies()
   *
   * Checks if component dependencies are satisfied.
   */
  checkDependencies(type: string, existingComponents: string[]): {
    satisfied: boolean;
    missing: string[];
    conflicts: string[];
  } {
    const descriptor = this._descriptors.get(type);
    if (!descriptor) {
      return { satisfied: false, missing: [], conflicts: [] };
    }

    const missing: string[] = [];
    const conflicts: string[] = [];

    // Check dependencies
    if (descriptor.dependencies) {
      for (const dep of descriptor.dependencies) {
        if (!existingComponents.includes(dep)) {
          missing.push(dep);
        }
      }
    }

    // Check conflicts
    if (descriptor.conflicts) {
      for (const conflict of descriptor.conflicts) {
        if (existingComponents.includes(conflict)) {
          conflicts.push(conflict);
        }
      }
    }

    return {
      satisfied: missing.length === 0 && conflicts.length === 0,
      missing,
      conflicts,
    };
  }

  /**
   * getComponentsByDependency()
   *
   * Gets components that depend on a specific component.
   */
  getComponentsByDependency(dependencyType: string): ComponentDescriptor[] {
    return Array.from(this._descriptors.values())
      .filter(desc => desc.dependencies?.includes(dependencyType));
  }

  /**
   * getRecommendedComponents()
   *
   * Gets recommended components based on existing components.
   */
  getRecommendedComponents(existingComponents: string[]): ComponentDescriptor[] {
    const recommended: ComponentDescriptor[] = [];

    for (const descriptor of this._descriptors.values()) {
      if (existingComponents.includes(descriptor.type)) {
        continue;
      }

      const deps = this.checkDependencies(descriptor.type, existingComponents);
      if (deps.satisfied || deps.missing.length <= 1) {
        recommended.push(descriptor);
      }
    }

    return recommended;
  }

  /**
   * clear()
   *
   * Clears all registered components.
   */
  clear(): void {
    this._descriptors.clear();

    this.emitEvent({
      type: RegistryEventType.REGISTRY_CLEARED,
    });
  }

  /**
   * getStats()
   *
   * Gets registry statistics.
   */
  getStats(): {
    totalComponents: number;
    coreComponents: number;
    visibleComponents: number;
    componentsByCategory: Record<string, number>;
  } {
    const componentsByCategory: Record<string, number> = {};
    let coreComponents = 0;
    let visibleComponents = 0;

    for (const descriptor of this._descriptors.values()) {
      // Count by category
      componentsByCategory[descriptor.category] =
        (componentsByCategory[descriptor.category] || 0) + 1;

      // Count core components
      if (descriptor.isCore) {
        coreComponents++;
      }

      // Count visible components
      if (descriptor.isVisible) {
        visibleComponents++;
      }
    }

    return {
      totalComponents: this._descriptors.size,
      coreComponents,
      visibleComponents,
      componentsByCategory,
    };
  }

  /**
   * dispose()
   *
   * Cleanup registry resources.
   */
  dispose(): void {
    this.clear();
    this._categories.clear();
    this._listeners.clear();
  }
}

/**
 * Global component registry instance
 */
export const componentRegistry = new ComponentRegistry();
