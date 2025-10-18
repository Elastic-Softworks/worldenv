/*
   ===============================================================
   WORLDEDIT COMPONENT HELP SYSTEM
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
             --- TYPES ---
	===============================================================
*/

/*

         PropertyHelpInfo
	       ---
	       comprehensive help information structure for component
	       properties including type definitions, descriptions,
	       usage examples, validation ranges, and contextual
	       assistance for property configuration and usage.

*/

export interface PropertyHelpInfo {
  name: string /* property identifier name */;
  type: string /* property data type */;
  description: string /* detailed property description */;
  defaultValue?: any /* default value if not specified */;
  range?: { min?: number; max?: number } /* valid value range */;
  units?: string /* measurement units for numeric values */;
  examples?: string[] /* usage example values */;
  tips?: string[] /* helpful usage tips */;
  warnings?: string[] /* important usage warnings */;
  relatedProperties?: string[] /* related property names */;
}

/*

         ComponentHelpInfo
	       ---
	       comprehensive help documentation structure for
	       component types including descriptions, categories,
	       property information, and usage examples for
	       effective component utilization in the editor.

*/

export interface ComponentHelpInfo {
  type: string;
  displayName: string;
  category: string;
  description: string;
  longDescription?: string;
  useCases: string[];
  commonIssues: string[];
  bestPractices: string[];
  properties: { [key: string]: PropertyHelpInfo };
  dependencies: string[];
  conflicts: string[];
  examples: ComponentExample[];
  version: string;
  lastUpdated: string;
}

export interface ComponentExample {
  title: string;
  description: string;
  code?: string;
  propertyValues: { [key: string]: any };
  notes?: string[];
}

/**
 * ComponentHelpRegistry
 *
 * Central registry for component help information and documentation.
 */
export class ComponentHelpRegistry {
  private helpData: Map<string, ComponentHelpInfo>;
  private initialized: boolean;

  constructor() {
    this.helpData = new Map();
    this.initialized = false;
  }

  /**
   * initialize()
   *
   * Initialize the help registry with component documentation.
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.registerCoreComponentHelp();
    this.initialized = true;
    console.log('[COMPONENT_HELP] Help registry initialized');
  }

  /**
   * registerCoreComponentHelp()
   *
   * Register help information for all core components.
   */
  private registerCoreComponentHelp(): void {
    // Transform Component Help
    this.register({
      type: 'Transform',
      displayName: 'Transform',
      category: 'Core',
      description: 'Controls the position, rotation, and scale of an entity in 3D space',
      longDescription:
        'The Transform component is the fundamental component that defines where an entity exists in the world. It provides position (translation), rotation, and scale properties that work together to place and orient objects in both 2D and 3D scenes.',
      useCases: [
        'Position objects in the scene',
        'Rotate objects to face different directions',
        'Scale objects to make them larger or smaller',
        'Create hierarchical parent-child relationships',
        'Animate object transformations over time'
      ],
      commonIssues: [
        'Extremely large scale values can cause rendering issues',
        'Rotation values are in degrees, not radians',
        'Negative scale values flip the object',
        'Child objects inherit parent transformations'
      ],
      bestPractices: [
        'Keep scale values reasonable (0.1 to 10.0 typically)',
        'Use consistent units across your project',
        'Remember that rotation order matters (XYZ)',
        'Consider using parent objects for complex hierarchies'
      ],
      properties: {
        position: {
          name: 'position',
          type: 'Vector3',
          description: 'The position of the entity in world space',
          defaultValue: { x: 0, y: 0, z: 0 },
          units: 'world units',
          examples: [
            '{ x: 0, y: 0, z: 0 } - Origin point',
            '{ x: 5, y: 2, z: -3 } - 5 units right, 2 up, 3 back'
          ],
          tips: [
            'Y is typically up in 3D scenes',
            'Use round numbers for easier alignment',
            'Consider the scale of your scene when positioning'
          ]
        },
        rotation: {
          name: 'rotation',
          type: 'Vector3',
          description: 'The rotation of the entity in degrees (Euler angles)',
          defaultValue: { x: 0, y: 0, z: 0 },
          range: { min: -360, max: 360 },
          units: 'degrees',
          examples: [
            '{ x: 0, y: 90, z: 0 } - 90 degree turn around Y axis',
            '{ x: 45, y: 0, z: 0 } - 45 degree tilt forward'
          ],
          tips: [
            'Rotation order is X, Y, Z (pitch, yaw, roll)',
            'Values wrap around at 360 degrees',
            'Small increments (15, 30, 45, 90) often work well'
          ],
          warnings: [
            'Gimbal lock can occur with extreme rotations',
            'Multiple rotation combinations can produce the same result'
          ]
        },
        scale: {
          name: 'scale',
          type: 'Vector3',
          description: 'The scale of the entity along each axis',
          defaultValue: { x: 1, y: 1, z: 1 },
          range: { min: 0.001, max: 1000 },
          units: 'multiplier',
          examples: [
            '{ x: 1, y: 1, z: 1 } - Original size',
            '{ x: 2, y: 1, z: 0.5 } - Double width, half depth',
            '{ x: -1, y: 1, z: 1 } - Flipped horizontally'
          ],
          tips: [
            'Uniform scaling uses same value for all axes',
            'Non-uniform scaling can create interesting effects',
            'Scale of 0 makes objects invisible'
          ],
          warnings: [
            'Negative values flip the object',
            'Very large values can cause performance issues',
            'Very small values may cause precision errors'
          ]
        }
      },
      dependencies: [],
      conflicts: [],
      examples: [
        {
          title: 'Basic Positioning',
          description: 'Place an object at a specific location',
          propertyValues: {
            position: { x: 5, y: 0, z: -2 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          }
        },
        {
          title: 'Scaled and Rotated',
          description: 'Create a large, rotated object',
          propertyValues: {
            position: { x: 0, y: 2, z: 0 },
            rotation: { x: 0, y: 45, z: 0 },
            scale: { x: 2, y: 2, z: 2 }
          }
        }
      ],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });

    // Light Component Help
    this.register({
      type: 'Light',
      displayName: 'Light',
      category: 'Rendering',
      description: 'Provides illumination for 3D scenes with various light types',
      longDescription:
        'The Light component adds realistic lighting to your 3D scenes. It supports different light types including directional lights (like the sun), point lights (like light bulbs), and spot lights (like flashlights). Proper lighting is essential for creating visually appealing 3D environments.',
      useCases: [
        'Illuminate 3D scenes for realistic rendering',
        'Create mood and atmosphere with colored lighting',
        'Simulate natural lighting conditions',
        'Highlight specific objects or areas',
        'Create dynamic lighting effects'
      ],
      commonIssues: [
        'Too many lights can impact performance',
        'Lights without shadows may look flat',
        'Very bright lights can wash out colors',
        'Overlapping lights can create hotspots'
      ],
      bestPractices: [
        'Use directional lights for primary illumination',
        'Add point/spot lights for accent lighting',
        'Keep light count reasonable for performance',
        'Use colored lights sparingly for effect',
        'Enable shadows for key lights only'
      ],
      properties: {
        type: {
          name: 'type',
          type: 'enum',
          description: 'The type of light (directional, point, or spot)',
          defaultValue: 'directional',
          examples: [
            'directional - Sunlight, affects entire scene uniformly',
            'point - Light bulb, radiates in all directions',
            'spot - Flashlight, cone-shaped beam'
          ]
        },
        color: {
          name: 'color',
          type: 'Color',
          description: 'The color of the light',
          defaultValue: { r: 1, g: 1, b: 1, a: 1 },
          examples: [
            '{ r: 1, g: 1, b: 1, a: 1 } - Pure white light',
            '{ r: 1, g: 0.8, b: 0.6, a: 1 } - Warm white',
            '{ r: 0.6, b: 1, g: 0.8, a: 1 } - Cool blue'
          ]
        },
        intensity: {
          name: 'intensity',
          type: 'number',
          description: 'The brightness of the light',
          defaultValue: 1.0,
          range: { min: 0, max: 10 },
          units: 'multiplier'
        }
      },
      dependencies: ['Transform'],
      conflicts: [],
      examples: [
        {
          title: 'Sun Light',
          description: 'Primary directional light acting as sunlight',
          propertyValues: {
            type: 'directional',
            color: { r: 1, g: 0.95, b: 0.8, a: 1 },
            intensity: 1.2,
            castShadows: true
          }
        }
      ],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });

    // Add help for other components...
    this.registerRenderComponentHelp();
    this.registerPhysicsComponentHelp();
    this.registerAudioComponentHelp();
    this.registerCameraComponentHelp();
    this.registerScriptComponentHelp();
  }

  /**
   * registerRenderComponentHelp()
   *
   * Register help for rendering components.
   */
  private registerRenderComponentHelp(): void {
    // MeshRenderer Help
    this.register({
      type: 'MeshRenderer',
      displayName: 'Mesh Renderer',
      category: 'Rendering',
      description: 'Renders a 3D mesh with materials and lighting',
      longDescription:
        'The MeshRenderer component displays 3D geometry in the scene. It works with mesh assets and materials to create visible 3D objects that respond to lighting and can cast shadows.',
      useCases: [
        'Display 3D models and geometry',
        'Create visible objects in 3D scenes',
        'Apply materials and textures to surfaces',
        'Enable shadow casting and receiving'
      ],
      commonIssues: [
        'Missing mesh asset results in no rendering',
        'Incorrect material settings can cause visual issues',
        'Large meshes can impact performance',
        'Backface culling may hide geometry'
      ],
      bestPractices: [
        'Optimize mesh polygon count for performance',
        'Use appropriate materials for the surface type',
        'Enable shadow casting for important objects',
        'Consider level-of-detail for distant objects'
      ],
      properties: {
        mesh: {
          name: 'mesh',
          type: 'asset',
          description: 'The 3D mesh to render',
          examples: ['cube.obj', 'character.fbx', 'terrain.gltf']
        },
        material: {
          name: 'material',
          type: 'asset',
          description: 'The material applied to the mesh',
          examples: ['metal.mat', 'wood.mat', 'glass.mat']
        }
      },
      dependencies: ['Transform'],
      conflicts: ['Sprite'],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });

    // Sprite Help
    this.register({
      type: 'Sprite',
      displayName: 'Sprite',
      category: 'Rendering',
      description: 'Renders a 2D texture or sprite image',
      longDescription:
        'The Sprite component displays 2D images in both 2D and 3D scenes. It is ideal for UI elements, 2D game objects, billboards, and particle effects.',
      useCases: [
        'Display 2D images and textures',
        'Create 2D game objects',
        'Build user interface elements',
        'Create billboard effects in 3D'
      ],
      commonIssues: [
        'Incorrect sprite size or aspect ratio',
        'Texture filtering causing blurry sprites',
        'Z-fighting with other sprites',
        'Performance with many animated sprites'
      ],
      bestPractices: [
        'Use power-of-two texture sizes when possible',
        'Keep sprite atlases organized',
        'Use appropriate filtering settings',
        'Batch similar sprites for performance'
      ],
      properties: {
        texture: {
          name: 'texture',
          type: 'asset',
          description: 'The image texture to display',
          examples: ['player.png', 'button.jpg', 'icon.svg']
        },
        color: {
          name: 'color',
          type: 'Color',
          description: 'Tint color applied to the sprite',
          defaultValue: { r: 1, g: 1, b: 1, a: 1 }
        }
      },
      dependencies: ['Transform'],
      conflicts: ['MeshRenderer'],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });
  }

  /**
   * registerPhysicsComponentHelp()
   *
   * Register help for physics components.
   */
  private registerPhysicsComponentHelp(): void {
    // RigidBody Help
    this.register({
      type: 'RigidBody',
      displayName: 'Rigid Body',
      category: 'Physics',
      description: 'Handles physics simulation with mass, velocity, and forces',
      longDescription:
        'The RigidBody component enables physics simulation for entities. It handles mass, velocity, forces, and responds to collisions. Essential for creating realistic physical interactions.',
      useCases: [
        'Create objects affected by gravity',
        'Enable collision responses',
        'Apply forces and impulses',
        'Simulate realistic physics behavior'
      ],
      commonIssues: [
        'Very light or heavy objects behave strangely',
        'High velocity objects may tunnel through colliders',
        'Incorrect body type for intended behavior',
        'Physics timestep issues with fast movement'
      ],
      bestPractices: [
        'Use appropriate mass values for object size',
        'Choose correct body type (static/kinematic/dynamic)',
        'Limit maximum velocities to prevent tunneling',
        'Use continuous collision detection for fast objects'
      ],
      properties: {
        bodyType: {
          name: 'bodyType',
          type: 'enum',
          description: 'How the body responds to physics',
          defaultValue: 'dynamic',
          examples: [
            'static - Never moves, like walls or floors',
            'kinematic - Moves via script, not physics',
            'dynamic - Fully simulated physics object'
          ]
        },
        mass: {
          name: 'mass',
          type: 'number',
          description: 'The mass of the object in kilograms',
          defaultValue: 1.0,
          range: { min: 0.001, max: 1000 },
          units: 'kg'
        }
      },
      dependencies: ['Transform'],
      conflicts: [],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });

    // Collider Help
    this.register({
      type: 'Collider',
      displayName: 'Collider',
      category: 'Physics',
      description: 'Defines collision shape and physics material properties',
      longDescription:
        'The Collider component defines the shape used for collision detection and physics interactions. It works with RigidBody components to create realistic physical behavior.',
      useCases: [
        'Define collision boundaries for objects',
        'Trigger events when objects touch',
        'Create invisible collision volumes',
        'Optimize collision detection with simple shapes'
      ],
      commonIssues: [
        "Collider shape doesn't match visual mesh",
        'Complex mesh colliders impact performance',
        "Trigger colliders don't stop physical movement",
        'Scaled colliders may behave unexpectedly'
      ],
      bestPractices: [
        'Use simple shapes (box, sphere) when possible',
        'Match collider size to visual representation',
        'Use mesh colliders only for static geometry',
        'Consider using compound colliders for complex shapes'
      ],
      properties: {
        shape: {
          name: 'shape',
          type: 'enum',
          description: 'The collision shape type',
          defaultValue: 'box',
          examples: [
            'box - Rectangular collision volume',
            'sphere - Spherical collision volume',
            'capsule - Pill-shaped collision volume'
          ]
        },
        isTrigger: {
          name: 'isTrigger',
          type: 'boolean',
          description: 'Whether this collider triggers events without blocking movement',
          defaultValue: false
        }
      },
      dependencies: ['Transform'],
      conflicts: [],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });
  }

  /**
   * registerAudioComponentHelp()
   *
   * Register help for audio components.
   */
  private registerAudioComponentHelp(): void {
    // AudioSource Help
    this.register({
      type: 'AudioSource',
      displayName: 'Audio Source',
      category: 'Audio',
      description: 'Plays audio clips with 2D and 3D spatial audio support',
      longDescription:
        'The AudioSource component plays sound effects and music. It supports both 2D audio (UI sounds, music) and 3D spatial audio (positional sounds in the world).',
      useCases: [
        'Play sound effects and music',
        'Create positional 3D audio',
        'Implement interactive audio feedback',
        'Add ambient environmental sounds'
      ],
      commonIssues: [
        'Audio files not loading or unsupported format',
        '3D audio not working without AudioListener',
        'Volume levels too loud or quiet',
        'Audio latency in interactive scenarios'
      ],
      bestPractices: [
        'Use compressed formats (MP3, OGG) for music',
        'Use uncompressed formats (WAV) for short effects',
        'Set appropriate volume levels (0.1-0.8 typically)',
        'Use 3D audio sparingly to avoid overwhelming users'
      ],
      properties: {
        clip: {
          name: 'clip',
          type: 'asset',
          description: 'The audio file to play',
          examples: ['explosion.wav', 'music.mp3', 'ambient.ogg']
        },
        volume: {
          name: 'volume',
          type: 'number',
          description: 'The playback volume',
          defaultValue: 1.0,
          range: { min: 0, max: 1 },
          units: 'normalized'
        },
        loop: {
          name: 'loop',
          type: 'boolean',
          description: 'Whether the audio should loop continuously',
          defaultValue: false
        }
      },
      dependencies: ['Transform'],
      conflicts: [],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });
  }

  /**
   * registerCameraComponentHelp()
   *
   * Register help for Camera component.
   */
  private registerCameraComponentHelp(): void {
    this.register({
      type: 'Camera',
      displayName: 'Camera',
      category: 'Core',
      description: "Renders the scene from this entity's position and orientation",
      longDescription:
        'The Camera component defines a viewpoint for rendering the scene. It determines what the player sees and can be moved, rotated, and configured for different rendering styles.',
      useCases: [
        'Define player viewpoint in 3D scenes',
        'Create multiple camera angles',
        'Implement first-person or third-person views',
        'Create cinematic camera movements'
      ],
      commonIssues: [
        'Multiple active cameras causing conflicts',
        'Incorrect field of view causing distortion',
        'Clipping planes cutting off geometry',
        'Camera inside geometry causing rendering issues'
      ],
      bestPractices: [
        'Use only one active camera at a time',
        'Set appropriate near/far clipping planes',
        'Use reasonable field of view (60-90 degrees)',
        'Keep camera position clear of geometry'
      ],
      properties: {
        fieldOfView: {
          name: 'fieldOfView',
          type: 'number',
          description: 'The camera field of view in degrees',
          defaultValue: 75,
          range: { min: 10, max: 170 },
          units: 'degrees'
        },
        nearClip: {
          name: 'nearClip',
          type: 'number',
          description: 'Near clipping plane distance',
          defaultValue: 0.1,
          units: 'world units'
        },
        farClip: {
          name: 'farClip',
          type: 'number',
          description: 'Far clipping plane distance',
          defaultValue: 1000,
          units: 'world units'
        }
      },
      dependencies: ['Transform'],
      conflicts: [],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });
  }

  /**
   * registerScriptComponentHelp()
   *
   * Register help for Script component.
   */
  private registerScriptComponentHelp(): void {
    this.register({
      type: 'Script',
      displayName: 'Script',
      category: 'Scripting',
      description: 'Attaches a script file to an entity for custom behavior',
      longDescription:
        'The Script component allows you to attach WORLDC code to entities for custom behavior, game logic, and interactions. Scripts can access other components and respond to events.',
      useCases: [
        'Implement custom game logic',
        'Handle user input and interactions',
        'Create AI behavior for NPCs',
        'Manage game state and progression'
      ],
      commonIssues: [
        'Script compilation errors preventing execution',
        'Performance issues with heavy computation in update loops',
        'Memory leaks from improper event handling',
        'Script conflicts when multiple scripts modify same properties'
      ],
      bestPractices: [
        'Keep update methods lightweight',
        'Use events for communication between scripts',
        'Cache component references for performance',
        'Handle errors gracefully with try-catch blocks'
      ],
      properties: {
        scriptFile: {
          name: 'scriptFile',
          type: 'asset',
          description: 'The WORLDC script file to execute',
          examples: ['PlayerController.wc', 'EnemyAI.wc', 'Pickup.wc']
        },
        enabled: {
          name: 'enabled',
          type: 'boolean',
          description: 'Whether the script is active and running',
          defaultValue: true
        }
      },
      dependencies: [],
      conflicts: [],
      examples: [],
      version: '1.0.0',
      lastUpdated: '2025-01-27'
    });
  }

  /**
   * register()
   *
   * Register help information for a component.
   */
  register(helpInfo: ComponentHelpInfo): void {
    this.helpData.set(helpInfo.type, helpInfo);
  }

  /**
   * getHelp()
   *
   * Get help information for a component.
   */
  getHelp(componentType: string): ComponentHelpInfo | null {
    return this.helpData.get(componentType) || null;
  }

  /**
   * getPropertyHelp()
   *
   * Get help information for a specific property.
   */
  getPropertyHelp(componentType: string, propertyKey: string): PropertyHelpInfo | null {
    const componentHelp = this.getHelp(componentType);
    if (!componentHelp) {
      return null;
    }

    return componentHelp.properties[propertyKey] || null;
  }

  /**
   * generateTooltip()
   *
   * Generate tooltip text for a component or property.
   */
  generateTooltip(componentType: string, propertyKey?: string): string {
    if (propertyKey) {
      const propertyHelp = this.getPropertyHelp(componentType, propertyKey);
      if (!propertyHelp) {
        return '';
      }

      let tooltip = propertyHelp.description;
      if (propertyHelp.defaultValue !== undefined) {
        tooltip += `\nDefault: ${JSON.stringify(propertyHelp.defaultValue)}`;
      }
      if (propertyHelp.range) {
        tooltip += `\nRange: ${propertyHelp.range.min || 'none'} to ${propertyHelp.range.max || 'none'}`;
      }
      if (propertyHelp.units) {
        tooltip += `\nUnits: ${propertyHelp.units}`;
      }

      return tooltip;
    } else {
      const componentHelp = this.getHelp(componentType);
      if (!componentHelp) {
        return '';
      }

      return componentHelp.description;
    }
  }

  /**
   * getAllComponentTypes()
   *
   * Get list of all component types with help available.
   */
  getAllComponentTypes(): string[] {
    return Array.from(this.helpData.keys());
  }

  /**
   * searchHelp()
   *
   * Search help content for specific terms.
   */
  searchHelp(query: string): Array<{ componentType: string; relevance: number }> {
    const results: Array<{ componentType: string; relevance: number }> = [];
    const searchTerms = query.toLowerCase().split(' ');

    for (const [componentType, helpInfo] of this.helpData) {
      let relevance = 0;
      const searchText = [
        helpInfo.displayName,
        helpInfo.description,
        helpInfo.longDescription || '',
        ...helpInfo.useCases,
        ...Object.keys(helpInfo.properties)
      ]
        .join(' ')
        .toLowerCase();

      for (const term of searchTerms) {
        const matches = (searchText.match(new RegExp(term, 'g')) || []).length;
        relevance += matches;
      }

      if (relevance > 0) {
        results.push({ componentType, relevance });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }
}

/**
 * Global component help registry instance
 */
export const componentHelpRegistry = new ComponentHelpRegistry();

/**
 * initializeComponentHelp()
 *
 * Initialize the component help system.
 */
export function initializeComponentHelp(): void {
  componentHelpRegistry.initialize();
}

/**
 * getComponentHelp()
 *
 * Get help information for a component.
 */
export function getComponentHelp(componentType: string): ComponentHelpInfo | null {
  return componentHelpRegistry.getHelp(componentType);
}

/**
 * getPropertyTooltip()
 *
 * Get tooltip text for a component property.
 */
export function getPropertyTooltip(componentType: string, propertyKey: string): string {
  return componentHelpRegistry.generateTooltip(componentType, propertyKey);
}

/**
 * getComponentTooltip()
 *
 * Get tooltip text for a component.
 */
export function getComponentTooltip(componentType: string): string {
  return componentHelpRegistry.generateTooltip(componentType);
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
