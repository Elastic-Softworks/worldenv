/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - MeshRenderer Component
 *
 * 3D mesh rendering component for displaying 3D models.
 * Handles mesh geometry, materials, and rendering parameters.
 */

import { Component, AssetReference, PropertyMetadata } from '../Component';

/**
 * Shadow casting modes
 */
export enum ShadowCastingMode {
  OFF = 'off',
  ON = 'on',
  TWO_SIDED = 'two_sided',
  SHADOWS_ONLY = 'shadows_only',
}

/**
 * Light probe usage modes
 */
export enum LightProbeUsage {
  OFF = 'off',
  BLEND_PROBES = 'blend_probes',
  USE_PROXY_VOLUME = 'use_proxy_volume',
  CUSTOM_PROVIDED = 'custom_provided',
}

/**
 * Mesh renderer component
 *
 * Renders 3D meshes with materials and lighting support.
 * Provides control over rendering parameters and optimization settings.
 */
export class MeshRendererComponent extends Component {
  /**
   * MeshRendererComponent constructor
   */
  constructor() {
    super(
      'MeshRenderer',
      'Mesh Renderer',
      'Renders a 3D mesh with materials and lighting',
      'Rendering'
    );
  }

  /**
   * initializeProperties()
   *
   * Sets up mesh renderer properties.
   */
  protected initializeProperties(): void {
    this.defineProperty<AssetReference | null>(
      'mesh',
      null,
      {
        type: 'asset',
        displayName: 'Mesh',
        description: 'The 3D mesh geometry to render',
        fileFilter: 'model/*',
      }
    );

    this.defineProperty<AssetReference[]>(
      'materials',
      [],
      {
        type: 'object',
        displayName: 'Materials',
        description: 'Array of materials for mesh submeshes',
      }
    );

    this.defineProperty<ShadowCastingMode>(
      'shadowCastingMode',
      ShadowCastingMode.ON,
      {
        type: 'enum',
        displayName: 'Cast Shadows',
        description: 'How this renderer casts shadows',
        options: Object.values(ShadowCastingMode),
      }
    );

    this.defineProperty<boolean>(
      'receiveShadows',
      true,
      {
        type: 'boolean',
        displayName: 'Receive Shadows',
        description: 'Whether this renderer receives shadows from other objects',
      }
    );

    this.defineProperty<LightProbeUsage>(
      'lightProbeUsage',
      LightProbeUsage.BLEND_PROBES,
      {
        type: 'enum',
        displayName: 'Light Probes',
        description: 'How this renderer uses light probes for global illumination',
        options: Object.values(LightProbeUsage),
      }
    );

    this.defineProperty<number>(
      'sortingOrder',
      0,
      {
        type: 'number',
        displayName: 'Sorting Order',
        description: 'Rendering order within the same layer',
        min: -100,
        max: 100,
        step: 1,
      }
    );

    this.defineProperty<string>(
      'sortingLayerName',
      'Default',
      {
        type: 'string',
        displayName: 'Sorting Layer',
        description: 'The sorting layer this renderer belongs to',
      }
    );

    this.defineProperty<boolean>(
      'dynamicOccludee',
      true,
      {
        type: 'boolean',
        displayName: 'Dynamic Occludee',
        description: 'Whether this renderer can be occluded by other objects',
      }
    );

    this.defineProperty<boolean>(
      'allowOcclusionWhenDynamic',
      true,
      {
        type: 'boolean',
        displayName: 'Allow Occlusion When Dynamic',
        description: 'Allow occlusion culling when renderer moves',
      }
    );

    this.defineProperty<number>(
      'motionVectorGenerationMode',
      0,
      {
        type: 'number',
        displayName: 'Motion Vector Mode',
        description: 'Mode for generating motion vectors (0=Object, 1=Camera, 2=ForceNoMotion)',
        min: 0,
        max: 2,
        step: 1,
      }
    );

    this.defineProperty<boolean>(
      'enableGPUInstancing',
      false,
      {
        type: 'boolean',
        displayName: 'Enable GPU Instancing',
        description: 'Enable GPU instancing for performance when rendering many identical objects',
      }
    );

    this.defineProperty<number>(
      'lightmapIndex',
      -1,
      {
        type: 'number',
        displayName: 'Lightmap Index',
        description: 'Index of the lightmap applied to this renderer (-1 for none)',
        min: -1,
        max: 255,
        step: 1,
      }
    );

    this.defineProperty<number>(
      'realtimeLightmapIndex',
      -1,
      {
        type: 'number',
        displayName: 'Realtime Lightmap Index',
        description: 'Index of the realtime lightmap applied to this renderer (-1 for none)',
        min: -1,
        max: 255,
        step: 1,
      }
    );
  }

  /**
   * getMesh()
   *
   * Gets current mesh reference.
   */
  getMesh(): AssetReference | null {
    return this.getProperty<AssetReference | null>('mesh');
  }

  /**
   * setMesh()
   *
   * Sets mesh reference.
   */
  setMesh(mesh: AssetReference | null): void {
    this.setProperty('mesh', mesh);
  }

  /**
   * getMaterials()
   *
   * Gets current materials array.
   */
  getMaterials(): AssetReference[] {
    return this.getProperty<AssetReference[]>('materials') || [];
  }

  /**
   * setMaterials()
   *
   * Sets materials array.
   */
  setMaterials(materials: AssetReference[]): void {
    this.setProperty('materials', materials);
  }

  /**
   * addMaterial()
   *
   * Adds material to the materials array.
   */
  addMaterial(material: AssetReference): void {
    const materials = this.getMaterials();
    materials.push(material);
    this.setMaterials(materials);
  }

  /**
   * removeMaterial()
   *
   * Removes material at specified index.
   */
  removeMaterial(index: number): boolean {
    const materials = this.getMaterials();
    if (index < 0 || index >= materials.length) {
      return false;
    }

    materials.splice(index, 1);
    this.setMaterials(materials);
    return true;
  }

  /**
   * getShadowCastingMode()
   *
   * Gets shadow casting mode.
   */
  getShadowCastingMode(): ShadowCastingMode {
    return this.getProperty<ShadowCastingMode>('shadowCastingMode') || ShadowCastingMode.ON;
  }

  /**
   * setShadowCastingMode()
   *
   * Sets shadow casting mode.
   */
  setShadowCastingMode(mode: ShadowCastingMode): void {
    this.setProperty('shadowCastingMode', mode);
  }

  /**
   * getReceiveShadows()
   *
   * Gets whether renderer receives shadows.
   */
  getReceiveShadows(): boolean {
    return this.getProperty<boolean>('receiveShadows') || false;
  }

  /**
   * setReceiveShadows()
   *
   * Sets whether renderer receives shadows.
   */
  setReceiveShadows(receiveShadows: boolean): void {
    this.setProperty('receiveShadows', receiveShadows);
  }

  /**
   * getLightProbeUsage()
   *
   * Gets light probe usage mode.
   */
  getLightProbeUsage(): LightProbeUsage {
    return this.getProperty<LightProbeUsage>('lightProbeUsage') || LightProbeUsage.BLEND_PROBES;
  }

  /**
   * setLightProbeUsage()
   *
   * Sets light probe usage mode.
   */
  setLightProbeUsage(usage: LightProbeUsage): void {
    this.setProperty('lightProbeUsage', usage);
  }

  /**
   * getSortingOrder()
   *
   * Gets sorting order.
   */
  getSortingOrder(): number {
    return this.getProperty<number>('sortingOrder') || 0;
  }

  /**
   * setSortingOrder()
   *
   * Sets sorting order.
   */
  setSortingOrder(order: number): void {
    this.setProperty('sortingOrder', order);
  }

  /**
   * getSortingLayerName()
   *
   * Gets sorting layer name.
   */
  getSortingLayerName(): string {
    return this.getProperty<string>('sortingLayerName') || 'Default';
  }

  /**
   * setSortingLayerName()
   *
   * Sets sorting layer name.
   */
  setSortingLayerName(layerName: string): void {
    this.setProperty('sortingLayerName', layerName);
  }

  /**
   * isDynamicOccludee()
   *
   * Gets whether renderer is a dynamic occludee.
   */
  isDynamicOccludee(): boolean {
    return this.getProperty<boolean>('dynamicOccludee') || false;
  }

  /**
   * setDynamicOccludee()
   *
   * Sets whether renderer is a dynamic occludee.
   */
  setDynamicOccludee(dynamic: boolean): void {
    this.setProperty('dynamicOccludee', dynamic);
  }

  /**
   * getAllowOcclusionWhenDynamic()
   *
   * Gets whether occlusion is allowed when dynamic.
   */
  getAllowOcclusionWhenDynamic(): boolean {
    return this.getProperty<boolean>('allowOcclusionWhenDynamic') || false;
  }

  /**
   * setAllowOcclusionWhenDynamic()
   *
   * Sets whether occlusion is allowed when dynamic.
   */
  setAllowOcclusionWhenDynamic(allow: boolean): void {
    this.setProperty('allowOcclusionWhenDynamic', allow);
  }

  /**
   * isGPUInstancingEnabled()
   *
   * Gets whether GPU instancing is enabled.
   */
  isGPUInstancingEnabled(): boolean {
    return this.getProperty<boolean>('enableGPUInstancing') || false;
  }

  /**
   * setGPUInstancingEnabled()
   *
   * Sets whether GPU instancing is enabled.
   */
  setGPUInstancingEnabled(enabled: boolean): void {
    this.setProperty('enableGPUInstancing', enabled);
  }

  /**
   * getLightmapIndex()
   *
   * Gets lightmap index.
   */
  getLightmapIndex(): number {
    return this.getProperty<number>('lightmapIndex') || -1;
  }

  /**
   * setLightmapIndex()
   *
   * Sets lightmap index.
   */
  setLightmapIndex(index: number): void {
    this.setProperty('lightmapIndex', index);
  }

  /**
   * hasLightmap()
   *
   * Checks if renderer has a lightmap assigned.
   */
  hasLightmap(): boolean {
    return this.getLightmapIndex() >= 0;
  }

  /**
   * validate()
   *
   * Validates mesh renderer properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const mesh = this.getMesh();
    if (!mesh) {
      errors.push('Mesh renderer requires a mesh to be assigned');
    }

    const materials = this.getMaterials();
    if (materials.length === 0) {
      errors.push('Mesh renderer should have at least one material assigned');
    }

    const lightmapIndex = this.getLightmapIndex();
    if (lightmapIndex < -1 || lightmapIndex > 255) {
      errors.push('Lightmap index must be between -1 and 255');
    }

    const realtimeLightmapIndex = this.getRealtimeLightmapIndex();
    if (realtimeLightmapIndex < -1 || realtimeLightmapIndex > 255) {
      errors.push('Realtime lightmap index must be between -1 and 255');
    }

    return errors;
  }

  /**
   * getRealtimeLightmapIndex()
   *
   * Gets realtime lightmap index.
   */
  getRealtimeLightmapIndex(): number {
    return this.getProperty<number>('realtimeLightmapIndex') || -1;
  }

  /**
   * setRealtimeLightmapIndex()
   *
   * Sets realtime lightmap index.
   */
  setRealtimeLightmapIndex(index: number): void {
    this.setProperty('realtimeLightmapIndex', index);
  }

  /**
   * onPropertyChanged()
   *
   * Handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    // Clamp lightmap indices
    if (key === 'lightmapIndex' || key === 'realtimeLightmapIndex') {
      const index = value as number;
      const clampedIndex = Math.max(-1, Math.min(255, Math.floor(index)));
      if (clampedIndex !== index) {
        this.setProperty(key, clampedIndex);
      }
    }

    // Clamp motion vector mode
    if (key === 'motionVectorGenerationMode') {
      const mode = value as number;
      const clampedMode = Math.max(0, Math.min(2, Math.floor(mode)));
      if (clampedMode !== mode) {
        this.setProperty(key, clampedMode);
      }
    }

    // Clamp sorting order
    if (key === 'sortingOrder') {
      const order = value as number;
      const clampedOrder = Math.max(-100, Math.min(100, Math.floor(order)));
      if (clampedOrder !== order) {
        this.setProperty(key, clampedOrder);
      }
    }
  }
}

/**
 * MeshRenderer component factory
 */
export function createMeshRendererComponent(): MeshRendererComponent {
  return new MeshRendererComponent();
}
