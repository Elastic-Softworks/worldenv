/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Render Component Integration
 *
 * Integrates MeshRenderer and Sprite components with viewport rendering.
 * Creates visual representations of entities in both 2D and 3D viewports
 * based on their render components and Transform properties.
 */

import { ViewportManager } from './ViewportManager';
import { componentSystem } from '../core/components';
import { MeshRendererComponent } from '../core/components/core/MeshRendererComponent';
import { SpriteComponent } from '../core/components/core/SpriteComponent';
import { TransformComponent } from '../core/components/core/TransformComponent';
import { SceneManager } from '../core/hierarchy/SceneManager';
import type { Vector3 } from '../core/components/Component';
import * as THREE from 'three';
import * as PIXI from 'pixi.js';

export interface RenderableEntity {
  entityId: string;
  renderObject: THREE.Object3D | PIXI.DisplayObject | null;
  componentType: 'MeshRenderer' | 'Sprite';
  lastUpdateTime: number;
}

/**
 * RenderComponentIntegration
 *
 * Manages the connection between render components and viewport display.
 * Creates and updates visual representations based on component data.
 */
export class RenderComponentIntegration {
  private viewportManager: ViewportManager;
  private sceneManager: SceneManager;
  private renderableEntities: Map<string, RenderableEntity>;
  private boundHandlers: Map<string, Function>;

  /* ASSET CACHING */
  private meshCache: Map<string, THREE.BufferGeometry>;
  private textureCache: Map<string, THREE.Texture | PIXI.Texture>;
  private materialCache: Map<string, THREE.Material>;

  /* UPDATE TRACKING */
  private needsUpdate: Set<string>;
  private lastUpdateFrame: number;

  constructor(viewportManager: ViewportManager) {
    this.viewportManager = viewportManager;
    this.sceneManager = SceneManager.getInstance();
    this.renderableEntities = new Map();
    this.boundHandlers = new Map();
    this.meshCache = new Map();
    this.textureCache = new Map();
    this.materialCache = new Map();
    this.needsUpdate = new Set();
    this.lastUpdateFrame = 0;

    this.initializeEventHandlers();
    this.initializeDefaultAssets();
  }

  /**
   * initializeEventHandlers()
   *
   * Set up event listeners for component and scene changes.
   */
  private initializeEventHandlers(): void {
    // Event system not implemented yet - using polling approach
    console.log('[RENDER_INTEGRATION] Using polling approach for updates');
  }

  /**
   * initializeDefaultAssets()
   *
   * Create default meshes and materials for immediate rendering.
   */
  private initializeDefaultAssets(): void {
    // Default cube mesh
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.meshCache.set('default_cube', cubeGeometry);

    // Default plane mesh
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    this.meshCache.set('default_plane', planeGeometry);

    // Default sphere mesh
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 12);
    this.meshCache.set('default_sphere', sphereGeometry);

    // Default material
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.0
    });
    this.materialCache.set('default', defaultMaterial);

    // Default wireframe material
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
    this.materialCache.set('wireframe', wireframeMaterial);

    console.log('[RENDER_INTEGRATION] Default assets initialized');
  }

  /**
   * handleComponentChange()
   *
   * Handle render component property changes.
   */
  private handleComponentChange(data: {
    entityId: string;
    componentType: string;
    propertyKey: string;
    newValue: any;
    oldValue: any;
  }): void {
    // Only handle render component changes
    if (
      data.componentType !== 'MeshRenderer' &&
      data.componentType !== 'Sprite' &&
      data.componentType !== 'Transform'
    ) {
      return;
    }

    this.markEntityForUpdate(data.entityId);
  }

  /**
   * handleComponentAdded()
   *
   * Handle render component additions.
   */
  private handleComponentAdded(data: { entityId: string; componentType: string }): void {
    if (data.componentType === 'MeshRenderer' || data.componentType === 'Sprite') {
      this.createRenderableEntity(data.entityId, data.componentType as 'MeshRenderer' | 'Sprite');
    }
  }

  /**
   * handleComponentRemoved()
   *
   * Handle render component removals.
   */
  private handleComponentRemoved(data: { entityId: string; componentType: string }): void {
    if (data.componentType === 'MeshRenderer' || data.componentType === 'Sprite') {
      this.removeRenderableEntity(data.entityId);
    }
  }

  /**
   * handleEntityDeleted()
   *
   * Handle entity deletions.
   */
  private handleEntityDeleted(entityId: string): void {
    this.removeRenderableEntity(entityId);
  }

  /**
   * createRenderableEntity()
   *
   * Create a visual representation for an entity with render components.
   */
  private createRenderableEntity(entityId: string, componentType: 'MeshRenderer' | 'Sprite'): void {
    // Remove existing if present
    this.removeRenderableEntity(entityId);

    const renderableEntity: RenderableEntity = {
      entityId,
      renderObject: null,
      componentType,
      lastUpdateTime: 0
    };

    this.renderableEntities.set(entityId, renderableEntity);
    this.updateRenderableEntity(entityId);

    console.log(`[RENDER_INTEGRATION] Created renderable entity: ${entityId} (${componentType})`);
  }

  /**
   * removeRenderableEntity()
   *
   * Remove visual representation for an entity.
   */
  private removeRenderableEntity(entityId: string): void {
    const renderable = this.renderableEntities.get(entityId);
    if (!renderable) {
      return;
    }

    // Remove from viewport
    if (renderable.renderObject) {
      this.viewportManager.removeObject(renderable.renderObject);
    }

    this.renderableEntities.delete(entityId);
    this.needsUpdate.delete(entityId);

    console.log(`[RENDER_INTEGRATION] Removed renderable entity: ${entityId}`);
  }

  /**
   * updateRenderableEntity()
   *
   * Update visual representation based on current component data.
   */
  private updateRenderableEntity(entityId: string): void {
    const renderable = this.renderableEntities.get(entityId);
    if (!renderable) {
      return;
    }

    const transform = componentSystem.getComponent(entityId, 'Transform') as TransformComponent;
    if (!transform) {
      console.warn(`[RENDER_INTEGRATION] Entity ${entityId} missing Transform component`);
      return;
    }

    if (renderable.componentType === 'MeshRenderer') {
      this.updateMeshRenderer(renderable, transform);
    } else if (renderable.componentType === 'Sprite') {
      this.updateSpriteRenderer(renderable, transform);
    }

    renderable.lastUpdateTime = Date.now();
  }

  /**
   * updateMeshRenderer()
   *
   * Update 3D mesh renderer visual representation.
   */
  private updateMeshRenderer(renderable: RenderableEntity, transform: TransformComponent): void {
    const meshRenderer = componentSystem.getComponent(
      renderable.entityId,
      'MeshRenderer'
    ) as MeshRendererComponent;
    if (!meshRenderer) {
      return;
    }

    // Get component properties
    const meshAsset = meshRenderer.getProperty('mesh') as string;
    const materialAsset = meshRenderer.getProperty('material') as string;
    const castShadows = meshRenderer.getProperty('castShadows') as boolean;
    const receiveShadows = meshRenderer.getProperty('receiveShadows') as boolean;

    // Create or update 3D object
    let mesh3D = renderable.renderObject as THREE.Mesh;

    if (!mesh3D) {
      // Create new mesh
      const geometry = this.getMesh(meshAsset || 'default_cube');
      const material = this.getMaterial(materialAsset || 'default');

      mesh3D = new THREE.Mesh(geometry, material);
      mesh3D.userData.entityId = renderable.entityId;
      mesh3D.name = `Entity_${renderable.entityId}`;

      renderable.renderObject = mesh3D;
      this.viewportManager.addObject(mesh3D);
    } else {
      // Update existing mesh
      const newGeometry = this.getMesh(meshAsset || 'default_cube');
      const newMaterial = this.getMaterial(materialAsset || 'default');

      if (mesh3D.geometry !== newGeometry) {
        mesh3D.geometry = newGeometry;
      }
      if (mesh3D.material !== newMaterial) {
        mesh3D.material = newMaterial;
      }
    }

    // Update transform
    const position = transform.getProperty('position') as Vector3;
    const rotation = transform.getProperty('rotation') as Vector3;
    const scale = transform.getProperty('scale') as Vector3;

    mesh3D.position.set(position.x, position.y, position.z);
    mesh3D.rotation.set(
      rotation.x * (Math.PI / 180),
      rotation.y * (Math.PI / 180),
      rotation.z * (Math.PI / 180)
    );
    mesh3D.scale.set(scale.x, scale.y, scale.z);

    // Update shadow settings
    mesh3D.castShadow = castShadows;
    mesh3D.receiveShadow = receiveShadows;
  }

  /**
   * updateSpriteRenderer()
   *
   * Update 2D sprite renderer visual representation.
   */
  private updateSpriteRenderer(renderable: RenderableEntity, transform: TransformComponent): void {
    const sprite = componentSystem.getComponent(renderable.entityId, 'Sprite') as SpriteComponent;
    if (!sprite) {
      return;
    }

    // Get component properties
    const textureAsset = sprite.getProperty('texture') as string;
    const color = sprite.getProperty('color') as { r: number; g: number; b: number; a: number };
    const flipX = sprite.getProperty('flipX') as boolean;
    const flipY = sprite.getProperty('flipY') as boolean;

    // Create or update 2D sprite
    let sprite2D = renderable.renderObject as PIXI.Sprite;

    if (!sprite2D) {
      // Create new sprite with default texture
      const texture = this.getTexture2D(textureAsset) || PIXI.Texture.WHITE;
      sprite2D = new PIXI.Sprite(texture);
      sprite2D.anchor.set(0.5, 0.5); // Center anchor

      renderable.renderObject = sprite2D;
      this.viewportManager.addObject(sprite2D);
    } else {
      // Update existing sprite texture
      const newTexture = this.getTexture2D(textureAsset);
      if (newTexture && sprite2D.texture !== newTexture) {
        sprite2D.texture = newTexture;
      }
    }

    // Update transform
    const position = transform.getProperty('position') as Vector3;
    const rotation = transform.getProperty('rotation') as Vector3;
    const scale = transform.getProperty('scale') as Vector3;

    sprite2D.position.set(position.x, position.y);
    sprite2D.rotation = rotation.z * (Math.PI / 180);
    sprite2D.scale.set(scale.x * (flipX ? -1 : 1), scale.y * (flipY ? -1 : 1));

    // Update color tint
    const tint = ((color.r * 255) << 16) | ((color.g * 255) << 8) | (color.b * 255);
    sprite2D.tint = tint;
    sprite2D.alpha = color.a;
  }

  /**
   * getMesh()
   *
   * Get or load a mesh geometry.
   */
  private getMesh(assetPath: string): THREE.BufferGeometry {
    // Check cache first
    if (this.meshCache.has(assetPath)) {
      return this.meshCache.get(assetPath)!;
    }

    // For now, return default mesh and log that asset loading is needed
    console.log(`[RENDER_INTEGRATION] Mesh asset not loaded: ${assetPath}, using default`);
    return this.meshCache.get('default_cube')!;
  }

  /**
   * getMaterial()
   *
   * Get or load a material.
   */
  private getMaterial(assetPath: string): THREE.Material {
    // Check cache first
    if (this.materialCache.has(assetPath)) {
      return this.materialCache.get(assetPath)!;
    }

    // For now, return default material and log that asset loading is needed
    console.log(`[RENDER_INTEGRATION] Material asset not loaded: ${assetPath}, using default`);
    return this.materialCache.get('default')!;
  }

  /**
   * getTexture2D()
   *
   * Get or load a 2D texture.
   */
  private getTexture2D(assetPath: string): PIXI.Texture | null {
    if (!assetPath) {
      return null;
    }

    // Check cache first
    if (this.textureCache.has(assetPath)) {
      return this.textureCache.get(assetPath) as PIXI.Texture;
    }

    // For now, log that asset loading is needed and return null
    console.log(`[RENDER_INTEGRATION] Texture asset not loaded: ${assetPath}`);
    return null;
  }

  /**
   * markEntityForUpdate()
   *
   * Mark an entity for visual update on next frame.
   */
  private markEntityForUpdate(entityId: string): void {
    this.needsUpdate.add(entityId);
  }

  /**
   * update()
   *
   * Update all renderable entities that need updates.
   * Should be called each frame.
   */
  update(): void {
    const currentFrame = performance.now();

    // Skip if no updates needed and frame rate is reasonable
    if (this.needsUpdate.size === 0 && currentFrame - this.lastUpdateFrame < 16.67) {
      return;
    }

    // Update entities that need updates
    for (const entityId of this.needsUpdate) {
      this.updateRenderableEntity(entityId);
    }

    this.needsUpdate.clear();
    this.lastUpdateFrame = currentFrame;
  }

  /**
   * refreshAllEntities()
   *
   * Force update of all renderable entities.
   */
  refreshAllEntities(): void {
    for (const entityId of this.renderableEntities.keys()) {
      this.markEntityForUpdate(entityId);
    }
  }

  /**
   * getEntityRenderObject()
   *
   * Get the render object for a specific entity.
   */
  getEntityRenderObject(entityId: string): THREE.Object3D | PIXI.DisplayObject | null {
    const renderable = this.renderableEntities.get(entityId);
    return renderable ? renderable.renderObject : null;
  }

  /**
   * getAllRenderableEntities()
   *
   * Get all currently renderable entities.
   */
  getAllRenderableEntities(): RenderableEntity[] {
    return Array.from(this.renderableEntities.values());
  }

  /**
   * setEntityVisibility()
   *
   * Show or hide a specific entity's visual representation.
   */
  setEntityVisibility(entityId: string, visible: boolean): void {
    const renderable = this.renderableEntities.get(entityId);
    if (!renderable || !renderable.renderObject) {
      return;
    }

    if (renderable.renderObject instanceof THREE.Object3D) {
      renderable.renderObject.visible = visible;
    } else if (renderable.renderObject instanceof PIXI.DisplayObject) {
      renderable.renderObject.visible = visible;
    }
  }

  /**
   * scanSceneForRenderComponents()
   *
   * Scan current scene and create renderables for all entities with render components.
   */
  scanSceneForRenderComponents(): void {
    const scene = this.sceneManager.currentScene;
    if (!scene) {
      return;
    }

    const entities = scene.getAllNodes();
    let created = 0;

    for (const entity of entities) {
      const hasMeshRenderer = componentSystem.hasComponent(entity.id, 'MeshRenderer');
      const hasSprite = componentSystem.hasComponent(entity.id, 'Sprite');

      if (hasMeshRenderer) {
        this.createRenderableEntity(entity.id, 'MeshRenderer');
        created++;
      } else if (hasSprite) {
        this.createRenderableEntity(entity.id, 'Sprite');
        created++;
      }
    }

    console.log(`[RENDER_INTEGRATION] Scene scan complete, created ${created} renderables`);
  }

  /**
   * pollForChanges()
   *
   * Poll for component changes since event system is not available.
   * Should be called regularly to detect component updates.
   */
  pollForChanges(): void {
    // This would check for component changes without events
    // For now, we rely on explicit updates via markEntityForUpdate
  }

  /**
   * destroy()
   *
   * Clean up all resources and event handlers.
   */
  destroy(): void {
    // Remove all renderable entities
    for (const entityId of this.renderableEntities.keys()) {
      this.removeRenderableEntity(entityId);
    }

    // Clean up resources
    this.boundHandlers.clear();
    this.needsUpdate.clear();

    // Clear caches
    this.meshCache.clear();
    this.textureCache.clear();
    this.materialCache.clear();

    console.log('[RENDER_INTEGRATION] Destroyed');
  }
}

/**
 * Global render component integration instance
 */
let renderComponentIntegration: RenderComponentIntegration | null = null;

/**
 * initializeRenderComponentIntegration()
 *
 * Initialize the global render component integration.
 */
export function initializeRenderComponentIntegration(
  viewportManager: ViewportManager
): RenderComponentIntegration {
  if (renderComponentIntegration) {
    renderComponentIntegration.destroy();
  }

  renderComponentIntegration = new RenderComponentIntegration(viewportManager);
  return renderComponentIntegration;
}

/**
 * getRenderComponentIntegration()
 *
 * Get the global render component integration instance.
 */
export function getRenderComponentIntegration(): RenderComponentIntegration | null {
  return renderComponentIntegration;
}
