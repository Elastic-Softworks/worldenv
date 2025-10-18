/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Entity Rendering System
 *
 * Manages visualization of scene entities in the 3D viewport.
 * Handles component-to-visual-object mapping and real-time updates.
 */

import * as THREE from 'three';
import * as PIXI from 'pixi.js';
import { Node } from '../core/hierarchy/Node';
import {
  TransformComponent,
  MeshRendererComponent,
  SpriteComponent,
  LightComponent,
  CameraComponent,
  ColliderComponent
} from '../core/components';

type Entity = Node;

export interface RenderableEntity {
  entity: Entity;
  visualObject: THREE.Object3D | PIXI.DisplayObject;
  isDirty: boolean;
  lastUpdateFrame: number;
}

export interface EntityRenderingSettings {
  showWireframes: boolean;
  showBounds: boolean;
  showColliders: boolean;
  showLights: boolean;
  showLightHelpers: boolean;
  showCameras: boolean;
  wireframeOpacity: number;
  boundsColor: number;
  colliderColor: number;
  lightHelperSize: number;
  cameraHelperSize: number;
}

/**
 * EntityRenderingSystem
 *
 * Converts scene entities into visual representations for viewport display.
 * Handles 3D meshes, 2D sprites, lights, cameras, and physics visualization.
 */
export class EntityRenderingSystem {
  private scene3D: THREE.Scene | null;
  private scene2D: PIXI.Container | null;
  private currentMode: '2d' | '3d';

  /* ENTITY TRACKING */
  private renderableEntities: Map<string, RenderableEntity>;
  private entityLookup: Map<THREE.Object3D | PIXI.DisplayObject, Entity>;
  private entityToVisual: Map<string, THREE.Object3D | PIXI.DisplayObject>;
  private visualToEntity: Map<THREE.Object3D | PIXI.DisplayObject, Entity>;

  /* HELPER OBJECTS */
  private helperObjects: Map<string, THREE.Object3D>;
  private wireframeObjects: Map<string, THREE.Object3D>;
  private boundingBoxes: Map<string, THREE.Box3Helper>;
  private colliderHelpers: Map<string, THREE.Object3D>;

  /* MATERIAL CACHING */
  private materialCache: Map<string, THREE.Material>;
  private textureCache: Map<string, THREE.Texture>;
  private geometryCache: Map<string, THREE.BufferGeometry>;

  /* FRAME TRACKING */
  private currentFrame: number;
  private isEnabled: boolean;

  /* CONFIGURATION */
  private settings: EntityRenderingSettings;

  /* PRIMITIVE GEOMETRY CACHE */
  private static primitiveGeometries: Map<string, THREE.BufferGeometry> = new Map();

  /* CONSTANTS */
  private static readonly WIREFRAME_OPACITY = 0.3;
  private static readonly BOUNDS_COLOR = 0x00ff00;
  private static readonly COLLIDER_COLOR = 0xff0000;
  private static readonly LIGHT_HELPER_SIZE = 1.0;
  private static readonly CAMERA_HELPER_SIZE = 1.0;

  constructor() {
    this.scene3D = null;
    this.scene2D = null;
    this.currentMode = '3d';

    /* INITIALIZE COLLECTIONS */
    this.renderableEntities = new Map();
    this.entityLookup = new Map();
    this.entityToVisual = new Map();
    this.visualToEntity = new Map();
    this.helperObjects = new Map();
    this.wireframeObjects = new Map();
    this.boundingBoxes = new Map();
    this.colliderHelpers = new Map();
    this.materialCache = new Map();
    this.textureCache = new Map();
    this.geometryCache = new Map();

    /* INITIALIZE STATE */
    this.currentFrame = 0;
    this.isEnabled = true;

    /* INITIALIZE SETTINGS */
    this.settings = {
      showWireframes: false,
      showBounds: false,
      showColliders: true,
      showLights: true,
      showLightHelpers: true,
      showCameras: true,
      wireframeOpacity: EntityRenderingSystem.WIREFRAME_OPACITY,
      boundsColor: EntityRenderingSystem.BOUNDS_COLOR,
      colliderColor: EntityRenderingSystem.COLLIDER_COLOR,
      lightHelperSize: EntityRenderingSystem.LIGHT_HELPER_SIZE,
      cameraHelperSize: EntityRenderingSystem.CAMERA_HELPER_SIZE
    };

    this.initializePrimitiveGeometries();
  }

  /**
   * initialize()
   *
   * Initialize rendering system with scene references.
   */
  public initialize(scene3D: THREE.Scene, scene2D?: PIXI.Container): void {
    this.scene3D = scene3D;
    this.scene2D = scene2D || null;
  }

  /**
   * setMode()
   *
   * Set current rendering mode (2D or 3D).
   */
  public setMode(mode: '2d' | '3d'): void {
    if (this.currentMode === mode) {
      return;
    }

    /* CLEAR CURRENT MODE VISUALS */
    this.clearAllVisuals();

    this.currentMode = mode;

    /* RE-RENDER ALL ENTITIES IN NEW MODE */
    this.renderableEntities.forEach((renderable) => {
      renderable.isDirty = true;
      this.updateEntityVisual(renderable);
    });
  }

  /**
   * addEntity()
   *
   * Add entity to rendering system.
   */
  public addEntity(entity: Entity): void {
    if (this.renderableEntities.has(entity.id)) {
      return;
    }

    const visualObject = this.createVisualForEntity(entity);

    if (visualObject) {
      const renderable: RenderableEntity = {
        entity,
        visualObject,
        isDirty: true,
        lastUpdateFrame: 0
      };

      this.renderableEntities.set(entity.id, renderable);
      this.entityLookup.set(visualObject, entity);
      this.entityToVisual.set(entity.id, visualObject);
      this.visualToEntity.set(visualObject, entity);

      this.addVisualToScene(visualObject);
      this.updateEntityVisual(renderable);
    }
  }

  /**
   * removeEntity()
   *
   * Remove entity from rendering system.
   */
  public removeEntity(entityId: string): void {
    const renderable = this.renderableEntities.get(entityId);

    if (!renderable) {
      return;
    }

    /* REMOVE FROM SCENE */
    this.removeVisualFromScene(renderable.visualObject);

    /* CLEAN UP HELPERS */
    this.removeEntityHelpers(entityId);

    /* CLEAN UP LOOKUP */
    this.entityLookup.delete(renderable.visualObject);
    this.entityToVisual.delete(entityId);
    this.visualToEntity.delete(renderable.visualObject);

    /* REMOVE FROM TRACKING */
    this.renderableEntities.delete(entityId);
  }

  /**
   * updateEntity()
   *
   * Mark entity as needing visual update.
   */
  public updateEntity(entityId: string): void {
    const renderable = this.renderableEntities.get(entityId);

    if (renderable) {
      renderable.isDirty = true;
    }
  }

  /**
   * update()
   *
   * Update all dirty entity visuals.
   */
  public update(): void {
    if (!this.isEnabled) {
      return;
    }

    this.currentFrame++;

    this.renderableEntities.forEach((renderable) => {
      if (renderable.isDirty) {
        this.updateEntityVisual(renderable);
        renderable.isDirty = false;
        renderable.lastUpdateFrame = this.currentFrame;
      }
    });
  }

  /**
   * createVisualForEntity()
   *
   * Create appropriate visual object for entity based on its components.
   */
  private createVisualForEntity(entity: Entity): THREE.Object3D | PIXI.DisplayObject | null {
    if (this.currentMode === '3d') {
      return this.createVisual3D(entity);
    } else {
      return this.createVisual2D(entity);
    }
  }

  /**
   * createVisual3D()
   *
   * Create 3D visual representation for entity.
   */
  private createVisual3D(entity: Entity): THREE.Object3D | null {
    const group = new THREE.Group();
    group.name = entity.name || `Entity_${entity.id}`;

    /* HANDLE MESH RENDERER COMPONENT */
    const meshRenderer = entity.getComponent('MeshRenderer') as MeshRendererComponent;
    if (meshRenderer) {
      const mesh = this.createMeshFromRenderer(meshRenderer);
      if (mesh) {
        group.add(mesh);
      }
    }

    /* HANDLE LIGHT COMPONENT */
    const lightComponent = entity.getComponent('Light') as LightComponent;
    if (lightComponent && this.settings.showLights) {
      const light = this.createLightFromComponent(lightComponent);
      if (light) {
        group.add(light);

        /* ADD LIGHT HELPER */
        if (this.settings.showLightHelpers) {
          const helper = this.createLightHelper(light);
          if (helper) {
            group.add(helper);
          }
        }
      }
    }

    /* HANDLE CAMERA COMPONENT */
    const cameraComponent = entity.getComponent('Camera') as CameraComponent;
    if (cameraComponent && this.settings.showCameras) {
      const cameraHelper = this.createCameraHelper(cameraComponent);
      if (cameraHelper) {
        group.add(cameraHelper);
      }
    }

    return group.children.length > 0 ? group : null;
  }

  /**
   * createVisual2D()
   *
   * Create 2D visual representation for entity.
   */
  private createVisual2D(entity: Entity): PIXI.DisplayObject | null {
    const container = new PIXI.Container();
    container.name = entity.name || `Entity_${entity.id}`;

    /* HANDLE SPRITE COMPONENT */
    const spriteComponent = entity.getComponent('Sprite') as SpriteComponent;
    if (spriteComponent) {
      const sprite = this.createSpriteFromComponent(spriteComponent);
      if (sprite) {
        container.addChild(sprite);
      }
    }

    return container;
  }

  /**
   * createMeshFromRenderer()
   *
   * Create Three.js mesh from MeshRenderer component.
   */
  private createMeshFromRenderer(meshRenderer: MeshRendererComponent): THREE.Mesh | null {
    const meshProp = meshRenderer.properties.get('mesh');
    const meshName = (meshProp?.value as string) || 'cube';
    const geometry = this.getGeometryForMesh(meshName);
    const material = this.getMaterialForRenderer(meshRenderer);

    if (!geometry || !material) {
      return null;
    }

    const mesh = new THREE.Mesh(geometry, material);
    const castShadowsProp = meshRenderer.properties.get('castShadows');
    const receiveShadowsProp = meshRenderer.properties.get('receiveShadows');
    mesh.castShadow = (castShadowsProp?.value as boolean) || false;
    mesh.receiveShadow = (receiveShadowsProp?.value as boolean) || false;

    return mesh;
  }

  /**
   * createSpriteFromComponent()
   *
   * Create PIXI sprite from Sprite component.
   */
  private createSpriteFromComponent(spriteComponent: SpriteComponent): PIXI.Sprite | null {
    const textureProp = spriteComponent.properties.get('texture');
    const texturePath = textureProp?.value as string;
    if (!texturePath) {
      return null;
    }

    /* CREATE TEXTURE */
    const texture = this.getTextureForSprite(texturePath);
    if (!texture) {
      return null;
    }

    const sprite = new PIXI.Sprite(texture);
    const colorProp = spriteComponent.properties.get('color');
    const alphaProp = spriteComponent.properties.get('alpha');
    sprite.tint = (colorProp?.value as number) || 0xffffff;
    sprite.alpha = (alphaProp?.value as number) || 1;

    return sprite;
  }

  /**
   * createLightFromComponent()
   *
   * Create THREE.js light from Light component.
   */
  private createLightFromComponent(lightComponent: LightComponent): THREE.Light | null {
    const props = lightComponent.properties;
    const typeProp = props.get('type');
    const colorProp = props.get('color');
    const intensityProp = props.get('intensity');
    const type = (typeProp?.value as string) || 'directional';
    const color = (colorProp?.value as number) || 0xffffff;
    const intensity = (intensityProp?.value as number) || 1;

    switch (type) {
      case 'directional':
        const directional = new THREE.DirectionalLight(color, intensity);
        const directionProp = props.get('direction');
        const direction = directionProp?.value as { x: number; y: number; z: number };
        if (direction) {
          directional.position.set(direction.x, direction.y, direction.z);
        }
        return directional;

      case 'point':
        const rangeProp = props.get('range');
        const range = (rangeProp?.value as number) || 10;
        const point = new THREE.PointLight(color, intensity, range);
        return point;

      case 'spot':
        const spotRangeProp = props.get('range');
        const angleProp = props.get('angle');
        const penumbraProp = props.get('penumbra');
        const spotRange = (spotRangeProp?.value as number) || 10;
        const angle = (angleProp?.value as number) || Math.PI / 4;
        const penumbra = (penumbraProp?.value as number) || 0;
        const spot = new THREE.SpotLight(color, intensity, spotRange, angle, penumbra);
        return spot;

      case 'ambient':
        const ambient = new THREE.AmbientLight(color, intensity);
        return ambient;

      default:
        return null;
    }
  }

  /**
   * createLightHelper()
   *
   * Create THREE.js helper for light visualization.
   */
  private createLightHelper(light: THREE.Light): THREE.Object3D | null {
    const size = this.settings.lightHelperSize;

    if (light instanceof THREE.DirectionalLight) {
      return new THREE.DirectionalLightHelper(light, size);
    } else if (light instanceof THREE.PointLight) {
      return new THREE.PointLightHelper(light, size);
    } else if (light instanceof THREE.SpotLight) {
      return new THREE.SpotLightHelper(light);
    }

    return null;
  }

  /**
   * createCameraHelper()
   *
   * Create THREE.js helper for camera visualization.
   */
  private createCameraHelper(cameraComponent: CameraComponent): THREE.Object3D | null {
    /* CREATE CAMERA GEOMETRY */
    const geometry = new THREE.ConeGeometry(0.5, 1, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const helper = new THREE.Mesh(geometry, material);
    helper.rotateX(-Math.PI / 2);

    return helper;
  }

  /**
   * updateEntityVisual()
   *
   * Update visual representation based on entity state.
   */
  private updateEntityVisual(renderable: RenderableEntity): void {
    const { entity, visualObject } = renderable;

    /* UPDATE TRANSFORM */
    const transformComponent = entity.getComponent('Transform') as TransformComponent;
    if (transformComponent) {
      this.updateTransform(visualObject, transformComponent);
    }

    /* UPDATE COMPONENT-SPECIFIC PROPERTIES */
    if (this.currentMode === '3d' && visualObject instanceof THREE.Object3D) {
      this.updateVisual3DComponents(entity, visualObject);
    } else if (this.currentMode === '2d' && visualObject instanceof PIXI.DisplayObject) {
      this.updateVisual2DComponents(entity, visualObject);
    }

    /* UPDATE HELPERS */
    this.updateEntityHelpers(entity);
  }

  /**
   * updateTransform()
   *
   * Update visual object transform from Transform component.
   */
  private updateTransform(
    visualObject: THREE.Object3D | PIXI.DisplayObject,
    transform: TransformComponent
  ): void {
    if (visualObject instanceof THREE.Object3D) {
      const posProp = transform.properties.get('position');
      const rotProp = transform.properties.get('rotation');
      const scaleProp = transform.properties.get('scale');
      const pos = (posProp?.value as { x: number; y: number; z: number }) || {
        x: 0,
        y: 0,
        z: 0
      };
      const rot = (rotProp?.value as { x: number; y: number; z: number }) || {
        x: 0,
        y: 0,
        z: 0
      };
      const scale = (scaleProp?.value as { x: number; y: number; z: number }) || {
        x: 1,
        y: 1,
        z: 1
      };

      visualObject.position.set(pos.x, pos.y, pos.z);
      visualObject.rotation.set(rot.x, rot.y, rot.z);
      visualObject.scale.set(scale.x, scale.y, scale.z);
    } else if (visualObject instanceof PIXI.DisplayObject) {
      const posProp = transform.properties.get('position');
      const rotProp = transform.properties.get('rotation');
      const scaleProp = transform.properties.get('scale');
      const pos = (posProp?.value as { x: number; y: number; z: number }) || {
        x: 0,
        y: 0,
        z: 0
      };
      const rot = (rotProp?.value as { x: number; y: number; z: number }) || {
        x: 0,
        y: 0,
        z: 0
      };
      const scale = (scaleProp?.value as { x: number; y: number; z: number }) || {
        x: 1,
        y: 1,
        z: 1
      };

      visualObject.position.set(pos.x, pos.y);
      visualObject.rotation = rot.z;
      visualObject.scale.set(scale.x, scale.y);
    }
  }

  /**
   * updateVisual3DComponents()
   *
   * Update 3D-specific component visualizations.
   */
  private updateVisual3DComponents(entity: Entity, visualObject: THREE.Object3D): void {
    /* UPDATE MESH RENDERER */
    const meshRenderer = entity.getComponent('MeshRenderer') as MeshRendererComponent;
    if (meshRenderer) {
      const mesh = visualObject.children.find((child) => child instanceof THREE.Mesh) as THREE.Mesh;
      if (mesh) {
        mesh.visible = meshRenderer.enabled;
        /* UPDATE MATERIAL PROPERTIES */
        const material = this.getMaterialForRenderer(meshRenderer);
        if (material) {
          mesh.material = material;
        }
      }
    }

    /* UPDATE LIGHT */
    const lightComponent = entity.getComponent('Light') as LightComponent;
    if (lightComponent) {
      const light = visualObject.children.find(
        (child) => child instanceof THREE.Light
      ) as THREE.Light;
      if (light) {
        const colorProp = lightComponent.properties.get('color');
        const intensityProp = lightComponent.properties.get('intensity');
        light.color.setHex((colorProp?.value as number) || 0xffffff);
        light.intensity = (intensityProp?.value as number) || 1;
        light.visible = lightComponent.enabled;
      }
    }
  }

  /**
   * updateVisual2DComponents()
   *
   * Update 2D-specific component visualizations.
   */
  private updateVisual2DComponents(entity: Entity, visualObject: PIXI.DisplayObject): void {
    /* UPDATE SPRITE */
    const spriteComponent = entity.getComponent('Sprite') as SpriteComponent;
    if (spriteComponent && visualObject instanceof PIXI.Container) {
      const sprite = visualObject.children.find(
        (child) => child instanceof PIXI.Sprite
      ) as PIXI.Sprite;
      if (sprite) {
        const colorProp = spriteComponent.properties.get('color');
        const alphaProp = spriteComponent.properties.get('alpha');
        sprite.visible = spriteComponent.enabled;
        sprite.tint = (colorProp?.value as number) || 0xffffff;
        sprite.alpha = (alphaProp?.value as number) || 1;
      }
    }
  }

  /**
   * updateEntityHelpers()
   *
   * Update helper objects for entity (bounds, colliders, etc.).
   */
  private updateEntityHelpers(entity: Entity): void {
    const entityId = entity.id;

    /* UPDATE BOUNDING BOX */
    if (this.settings.showBounds) {
      this.updateBoundingBox(entity);
    } else {
      this.removeBoundingBox(entityId);
    }

    /* UPDATE COLLIDERS */
    if (this.settings.showColliders) {
      this.updateColliderHelper(entity);
    } else {
      this.removeColliderHelper(entityId);
    }
  }

  /**
   * updateBoundingBox()
   *
   * Update bounding box helper for entity.
   */
  private updateBoundingBox(entity: Entity): void {
    if (this.currentMode !== '3d' || !this.scene3D) {
      return;
    }

    const entityId = entity.id;
    const renderable = this.renderableEntities.get(entityId);

    if (!renderable || !(renderable.visualObject instanceof THREE.Object3D)) {
      return;
    }

    /* REMOVE EXISTING BOUNDING BOX */
    this.removeBoundingBox(entityId);

    /* CREATE NEW BOUNDING BOX */
    const box = new THREE.Box3().setFromObject(renderable.visualObject);
    const helper = new THREE.Box3Helper(box, this.settings.boundsColor);

    this.boundingBoxes.set(entityId, helper);
    this.scene3D.add(helper);
  }

  /**
   * updateColliderHelper()
   *
   * Update collider visualization for entity.
   */
  private updateColliderHelper(entity: Entity): void {
    if (this.currentMode !== '3d' || !this.scene3D) {
      return;
    }

    const collider = entity.getComponent('Collider') as ColliderComponent;
    if (!collider) {
      this.removeColliderHelper(entity.id);
      return;
    }

    const transform = entity.getComponent('Transform') as TransformComponent;
    if (!transform) {
      return;
    }

    /* REMOVE EXISTING COLLIDER HELPER */
    this.removeColliderHelper(entity.id);

    /* CREATE COLLIDER HELPER */
    const helper = this.createColliderHelper(collider, transform);
    if (helper) {
      this.colliderHelpers.set(entity.id, helper);
      this.scene3D.add(helper);
    }
  }

  /**
   * createColliderHelper()
   *
   * Create Three.js helper for collider visualization.
   */
  private createColliderHelper(
    collider: ColliderComponent,
    transform: TransformComponent
  ): THREE.Object3D | null {
    const material = new THREE.MeshBasicMaterial({
      color: this.settings.colliderColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    let geometry: THREE.BufferGeometry | null = null;

    const typeProp = collider.properties.get('type');
    const sizeProp = collider.properties.get('size');
    const radiusProp = collider.properties.get('radius');
    const heightProp = collider.properties.get('height');

    const type = (typeProp?.value as string) || 'box';
    const size = (sizeProp?.value as { x: number; y: number; z: number }) || { x: 1, y: 1, z: 1 };
    const radius = (radiusProp?.value as number) || 0.5;
    const height = (heightProp?.value as number) || 1;

    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(radius, 16, 12);
        break;

      case 'capsule':
        geometry = new THREE.CapsuleGeometry(radius, height, 8, 16);
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
        break;
    }

    if (!geometry) {
      return null;
    }

    const helper = new THREE.Mesh(geometry, material);
    const position = transform.getPosition();
    const rotation = transform.getRotation();
    helper.position.set(position.x, position.y, position.z);
    helper.rotation.set(rotation.x, rotation.y, rotation.z);

    return helper;
  }

  /**
   * getGeometryForMesh()
   *
   * Get or create geometry for mesh name.
   */
  private getGeometryForMesh(meshName: string): THREE.BufferGeometry | null {
    /* CHECK CACHE FIRST */
    if (this.geometryCache.has(meshName)) {
      return this.geometryCache.get(meshName)!;
    }

    let geometry: THREE.BufferGeometry | null = null;

    switch (meshName) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 16);
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(1, 1);
        break;

      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 32);
        break;

      default:
        /* TRY TO LOAD CUSTOM GEOMETRY */
        geometry = this.loadCustomGeometry(meshName);
        break;
    }

    if (geometry) {
      this.geometryCache.set(meshName, geometry);
    }

    return geometry;
  }

  /**
   * getMaterialForRenderer()
   *
   * Get or create material for mesh renderer.
   */
  private getMaterialForRenderer(meshRenderer: MeshRendererComponent): THREE.Material | null {
    const materialKey = this.generateMaterialKey(meshRenderer);

    /* CHECK CACHE FIRST */
    if (this.materialCache.has(materialKey)) {
      return this.materialCache.get(materialKey)!;
    }

    /* CREATE MATERIAL */
    const props = meshRenderer.properties;
    const colorProp = props.get('color');
    const alphaProp = props.get('alpha');
    const metallicProp = props.get('metallic');
    const roughnessProp = props.get('roughness');
    const color = (colorProp?.value as number) || 0xffffff;
    const alpha = (alphaProp?.value as number) || 1;
    const metallic = (metallicProp?.value as number) || 0;
    const roughness = (roughnessProp?.value as number) || 0.5;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      transparent: alpha < 1.0,
      opacity: alpha,
      metalness: metallic,
      roughness: roughness
    });

    /* ADD TEXTURE IF AVAILABLE */
    const textureProp = props.get('texture');
    const texturePath = textureProp?.value as string;
    if (texturePath) {
      const texture = this.getTextureForPath(texturePath);
      if (texture) {
        material.map = texture;
      }
    }

    this.materialCache.set(materialKey, material);
    return material;
  }

  /**
   * generateMaterialKey()
   *
   * Generate cache key for material.
   */
  private generateMaterialKey(meshRenderer: MeshRendererComponent): string {
    const props = meshRenderer.properties;
    const colorProp = props.get('color');
    const alphaProp = props.get('alpha');
    const metallicProp = props.get('metallic');
    const roughnessProp = props.get('roughness');
    const textureProp = props.get('texture');
    const color = (colorProp?.value as number) || 0xffffff;
    const alpha = (alphaProp?.value as number) || 1;
    const metallic = (metallicProp?.value as number) || 0;
    const roughness = (roughnessProp?.value as number) || 0.5;
    const texture = (textureProp?.value as string) || 'none';
    return `${color}_${alpha}_${metallic}_${roughness}_${texture}`;
  }

  /**
   * getTextureForPath()
   *
   * Get or load texture from file path.
   */
  private getTextureForPath(texturePath: string): THREE.Texture | null {
    /* CHECK CACHE FIRST */
    if (this.textureCache.has(texturePath)) {
      return this.textureCache.get(texturePath)!;
    }

    /* LOAD TEXTURE */
    try {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(texturePath);

      /* CACHE TEXTURE */
      this.textureCache.set(texturePath, texture);

      return texture;
    } catch (error) {
      console.warn(`Failed to load texture: ${texturePath}`, error);
      return null;
    }
  }

  /**
   * getTexture()
   *
   * Get or load texture.
   */
  private getTexture(texturePath: string): THREE.Texture | null {
    /* CHECK CACHE FIRST */
    if (this.textureCache.has(texturePath)) {
      return this.textureCache.get(texturePath)!;
    }

    /* LOAD TEXTURE */
    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath);

    this.textureCache.set(texturePath, texture);
    return texture;
  }

  /**
   * getTextureForSprite()
   *
   * Get PIXI texture for sprite.
   */
  private getTextureForSprite(texturePath: string): PIXI.Texture | null {
    try {
      return PIXI.Texture.from(texturePath);
    } catch (error) {
      console.warn(`Failed to load sprite texture: ${texturePath}`, error);
      return null;
    }
  }

  /**
   * loadCustomGeometry()
   *
   * Load custom geometry from file.
   */
  private loadCustomGeometry(meshPath: string): THREE.BufferGeometry | null {
    /* TODO: Implement custom geometry loading */
    console.warn(`Custom geometry loading not implemented: ${meshPath}`);
    return null;
  }

  /**
   * addVisualToScene()
   *
   * Add visual object to appropriate scene.
   */
  private addVisualToScene(visualObject: THREE.Object3D | PIXI.DisplayObject): void {
    if (visualObject instanceof THREE.Object3D && this.scene3D) {
      this.scene3D.add(visualObject);
    } else if (visualObject instanceof PIXI.DisplayObject && this.scene2D) {
      this.scene2D.addChild(visualObject);
    }
  }

  /**
   * removeVisualFromScene()
   *
   * Remove visual object from scene.
   */
  private removeVisualFromScene(visualObject: THREE.Object3D | PIXI.DisplayObject): void {
    if (visualObject instanceof THREE.Object3D && this.scene3D) {
      this.scene3D.remove(visualObject);
    } else if (visualObject instanceof PIXI.DisplayObject && this.scene2D) {
      this.scene2D.removeChild(visualObject);
    }
  }

  /**
   * removeEntityHelpers()
   *
   * Remove all helper objects for entity.
   */
  private removeEntityHelpers(entityId: string): void {
    this.removeBoundingBox(entityId);
    this.removeColliderHelper(entityId);
  }

  /**
   * removeBoundingBox()
   *
   * Remove bounding box helper for entity.
   */
  private removeBoundingBox(entityId: string): void {
    const helper = this.boundingBoxes.get(entityId);
    if (helper && this.scene3D) {
      this.scene3D.remove(helper);
      this.boundingBoxes.delete(entityId);
    }
  }

  /**
   * removeColliderHelper()
   *
   * Remove collider helper for entity.
   */
  private removeColliderHelper(entityId: string): void {
    const helper = this.colliderHelpers.get(entityId);
    if (helper && this.scene3D) {
      this.scene3D.remove(helper);
      this.colliderHelpers.delete(entityId);
    }
  }

  /**
   * clearAllVisuals()
   *
   * Clear all visual objects from scenes.
   */
  private clearAllVisuals(): void {
    this.renderableEntities.forEach((renderable) => {
      this.removeVisualFromScene(renderable.visualObject);
    });

    /* CLEAR HELPERS */
    this.boundingBoxes.forEach((helper) => {
      if (this.scene3D) this.scene3D.remove(helper);
    });

    this.colliderHelpers.forEach((helper) => {
      if (this.scene3D) this.scene3D.remove(helper);
    });

    this.boundingBoxes.clear();
    this.colliderHelpers.clear();
  }

  /**
   * initializePrimitiveGeometries()
   *
   * Pre-create commonly used geometries.
   */
  private initializePrimitiveGeometries(): void {
    if (EntityRenderingSystem.primitiveGeometries.size > 0) {
      return;
    }

    const primitives = [
      { name: 'cube', geometry: new THREE.BoxGeometry(1, 1, 1) },
      { name: 'sphere', geometry: new THREE.SphereGeometry(0.5, 32, 16) },
      { name: 'cylinder', geometry: new THREE.CylinderGeometry(0.5, 0.5, 1, 32) },
      { name: 'plane', geometry: new THREE.PlaneGeometry(1, 1) },
      { name: 'cone', geometry: new THREE.ConeGeometry(0.5, 1, 32) }
    ];

    primitives.forEach(({ name, geometry }) => {
      EntityRenderingSystem.primitiveGeometries.set(name, geometry);
    });
  }

  /**
   * getEntityFromVisual()
   *
   * Get entity associated with visual object.
   */
  public getEntityFromVisual(visualObject: THREE.Object3D | PIXI.DisplayObject): Entity | null {
    return this.entityLookup.get(visualObject) || this.visualToEntity.get(visualObject) || null;
  }

  /**
   * getVisualForEntity()
   *
   * Get visual object for entity.
   */
  public getVisualForEntity(entityId: string): THREE.Object3D | PIXI.DisplayObject | null {
    const renderable = this.renderableEntities.get(entityId);
    return renderable ? renderable.visualObject : this.entityToVisual.get(entityId) || null;
  }

  /**
   * setSettings()
   *
   * Update rendering settings.
   */
  public setSettings(settings: Partial<EntityRenderingSettings>): void {
    Object.assign(this.settings, settings);

    /* TRIGGER VISUAL UPDATES */
    this.renderableEntities.forEach((renderable) => {
      renderable.isDirty = true;
    });
  }

  /**
   * getSettings()
   *
   * Get current rendering settings.
   */
  public getSettings(): EntityRenderingSettings {
    return { ...this.settings };
  }

  /**
   * setEnabled()
   *
   * Enable or disable the rendering system.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearAllVisuals();
    } else {
      /* RE-RENDER ALL ENTITIES */
      this.renderableEntities.forEach((renderable) => {
        renderable.isDirty = true;
      });
    }
  }

  /**
   * isRenderingEnabled()
   *
   * Check if rendering is enabled.
   */
  public isRenderingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * dispose()
   *
   * Clean up rendering system resources.
   */
  public dispose(): void {
    /* CLEAR ALL VISUALS */
    this.clearAllVisuals();

    /* DISPOSE CACHED MATERIALS */
    this.materialCache.forEach((material) => {
      material.dispose();
    });

    /* DISPOSE CACHED TEXTURES */
    this.textureCache.forEach((texture) => {
      texture.dispose();
    });

    /* DISPOSE CACHED GEOMETRIES */
    this.geometryCache.forEach((geometry) => {
      geometry.dispose();
    });

    /* CLEAR ALL COLLECTIONS */
    this.renderableEntities.clear();
    this.entityLookup.clear();
    this.entityToVisual.clear();
    this.visualToEntity.clear();
    this.helperObjects.clear();
    this.wireframeObjects.clear();
    this.boundingBoxes.clear();
    this.colliderHelpers.clear();
    this.materialCache.clear();
    this.textureCache.clear();
    this.geometryCache.clear();
  }
}
