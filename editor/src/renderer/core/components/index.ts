/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Component System Index
 *
 * Main entry point for the component system.
 * Exports all components and handles component registration.
 */

// Core component system exports
export * from './Component';
export * from './ComponentRegistry';
export * from './ComponentSystem';

// Core component exports
export * from './core/TransformComponent';
export * from './core/SpriteComponent';
export * from './core/MeshRendererComponent';
export * from './core/CameraComponent';
export * from './core/ScriptComponent';

// Component factories
import { createTransformComponent } from './core/TransformComponent';
import { createSpriteComponent } from './core/SpriteComponent';
import { createMeshRendererComponent } from './core/MeshRendererComponent';
import { createCameraComponent } from './core/CameraComponent';
import { createScriptComponent } from './core/ScriptComponent';

// Registry and system instances
import { componentRegistry } from './ComponentRegistry';
import { componentSystem } from './ComponentSystem';

/**
 * initializeComponentSystem()
 *
 * Initializes the component system and registers core components.
 * Should be called during editor startup.
 */
export function initializeComponentSystem(): void {
  console.log('[COMPONENT_SYSTEM] Initializing component system...');

  // Register core components
  registerCoreComponents();

  console.log('[COMPONENT_SYSTEM] Component system initialized');
}

/**
 * registerCoreComponents()
 *
 * Registers all core components with the registry.
 */
function registerCoreComponents(): void {
  // Transform Component (Core, always required)
  componentRegistry.register({
    type: 'Transform',
    displayName: 'Transform',
    description: 'Controls the position, rotation, and scale of an entity',
    category: 'Core',
    icon: '📐',
    factory: createTransformComponent,
    isCore: true,
    isVisible: true,
    dependencies: [],
    conflicts: [],
  });

  // Sprite Component (2D Rendering)
  componentRegistry.register({
    type: 'Sprite',
    displayName: 'Sprite',
    description: 'Renders a 2D texture or sprite image',
    category: 'Rendering',
    icon: '🖼️',
    factory: createSpriteComponent,
    isCore: false,
    isVisible: true,
    dependencies: ['Transform'],
    conflicts: ['MeshRenderer'],
  });

  // MeshRenderer Component (3D Rendering)
  componentRegistry.register({
    type: 'MeshRenderer',
    displayName: 'Mesh Renderer',
    description: 'Renders a 3D mesh with materials and lighting',
    category: 'Rendering',
    icon: '🧊',
    factory: createMeshRendererComponent,
    isCore: false,
    isVisible: true,
    dependencies: ['Transform'],
    conflicts: ['Sprite'],
  });

  // Camera Component
  componentRegistry.register({
    type: 'Camera',
    displayName: 'Camera',
    description: 'Renders the scene from this entity\'s position and orientation',
    category: 'Core',
    icon: '📷',
    factory: createCameraComponent,
    isCore: false,
    isVisible: true,
    dependencies: ['Transform'],
    conflicts: [],
  });

  // Script Component
  componentRegistry.register({
    type: 'Script',
    displayName: 'Script',
    description: 'Attaches a script file to an entity for custom behavior',
    category: 'Scripting',
    icon: '📜',
    factory: createScriptComponent,
    isCore: false,
    isVisible: true,
    dependencies: [],
    conflicts: [],
  });

  console.log(`[COMPONENT_SYSTEM] Registered ${componentRegistry.getAllDescriptors().length} core components`);
}

/**
 * getComponentRegistry()
 *
 * Gets the global component registry instance.
 */
export function getComponentRegistry() {
  return componentRegistry;
}

/**
 * getComponentSystem()
 *
 * Gets the global component system instance.
 */
export function getComponentSystem() {
  return componentSystem;
}

/**
 * createDefaultNodeComponents()
 *
 * Creates default components for a new node based on node type.
 */
export function createDefaultNodeComponents(nodeType: string): string[] {
  const defaultComponents: string[] = [];

  // All nodes get Transform component
  defaultComponents.push('Transform');

  // Add type-specific default components
  switch (nodeType) {
    case 'entity2d':
      defaultComponents.push('Sprite');
      break;
    case 'entity3d':
      defaultComponents.push('MeshRenderer');
      break;
    case 'camera':
      defaultComponents.push('Camera');
      break;
    case 'sprite':
      defaultComponents.push('Sprite');
      break;
    case 'mesh':
      defaultComponents.push('MeshRenderer');
      break;
  }

  return defaultComponents;
}

/**
 * Component system utilities
 */
export const ComponentUtils = {
  /**
   * Gets components that can be added to a node
   */
  getAvailableComponents: (nodeId: string) => {
    return componentSystem.getAvailableComponents(nodeId);
  },

  /**
   * Adds component to node with error handling
   */
  addComponentSafe: (nodeId: string, componentType: string) => {
    try {
      return componentSystem.addComponent(nodeId, componentType);
    } catch (error) {
      console.error(`[COMPONENT_UTILS] Failed to add component ${componentType}:`, error);
      return {
        success: false,
        error: `Failed to add component: ${error}`,
      };
    }
  },

  /**
   * Removes component from node with error handling
   */
  removeComponentSafe: (nodeId: string, componentType: string) => {
    try {
      return componentSystem.removeComponent(nodeId, componentType);
    } catch (error) {
      console.error(`[COMPONENT_UTILS] Failed to remove component ${componentType}:`, error);
      return {
        success: false,
        error: `Failed to remove component: ${error}`,
      };
    }
  },

  /**
   * Gets component display information
   */
  getComponentDisplayInfo: (componentType: string) => {
    const descriptor = componentRegistry.getDescriptor(componentType);
    if (!descriptor) {
      return null;
    }

    return {
      type: descriptor.type,
      displayName: descriptor.displayName,
      description: descriptor.description,
      category: descriptor.category,
      icon: descriptor.icon,
      isCore: descriptor.isCore,
    };
  },

  /**
   * Validates component dependencies
   */
  validateDependencies: (nodeId: string, componentType: string) => {
    const existingTypes = componentSystem.getComponentTypes(nodeId);
    return componentRegistry.checkDependencies(componentType, existingTypes);
  },
};

// Export registry and system instances for direct access
export { componentRegistry, componentSystem };
