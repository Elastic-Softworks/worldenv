/*
   ===============================================================
   WORLDEDIT MESH RENDERER COMPONENT
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

import { Component, AssetReference, PropertyMetadata } from '../Component';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ShadowCastingMode
	       ---
	       shadow rendering behavior that determines how the mesh
	       participates in shadow mapping systems. controls whether
	       the mesh casts shadows, receives shadows, or both.

*/

export enum ShadowCastingMode {
  OFF = 'off' /* no shadow interaction */,
  ON = 'on' /* cast shadows normally */,
  TWO_SIDED = 'two_sided' /* cast shadows from both sides */,
  SHADOWS_ONLY = 'shadows_only' /* only visible in shadow maps */
}

/*

         LightProbeUsage
	       ---
	       light probe sampling mode that determines how the mesh
	       receives indirect lighting from the global illumination
	       system. light probes provide ambient lighting information
	       for more realistic lighting in complex scenes.

*/

export enum LightProbeUsage {
  OFF = 'off' /* no light probe sampling */,
  BLEND_PROBES = 'blend_probes' /* interpolate between nearby probes */,
  USE_PROXY_VOLUME = 'use_proxy_volume' /* use proxy geometry for sampling */,
  CUSTOM_PROVIDED = 'custom_provided' /* use manually specified probe */
}

/*

         MeshRendererComponent
	       ---
	       3D mesh rendering component responsible for displaying
	       geometric meshes with materials in the 3D scene. this
	       component bridges the gap between geometric data (meshes)
	       and visual appearance (materials).

	       the mesh renderer handles:
	       - mesh geometry references for 3D model data
	       - material assignments for surface appearance
	       - rendering parameters like shadow behavior
	       - level-of-detail (LOD) selection for performance
	       - culling and visibility optimizations

	       meshes are typically loaded from external model files
	       (.obj, .fbx, .gltf) and converted to internal geometry
	       representations. materials define how light interacts
	       with the surface, including colors, textures, and
	       physically-based rendering properties.

	       multiple materials can be assigned to a single mesh
	       when the model has multiple material regions (submeshes).
	       each submesh uses a different material slot, allowing
	       complex models with varied surface properties.

*/

export class MeshRendererComponent extends Component {
  /*
	===============================================================
             --- FUNCS ---
	===============================================================
  */

  /*

           constructor()
	         ---
	         initializes the mesh renderer component with default
	         rendering settings suitable for typical 3D objects.
	         sets up shadow casting, light probe usage, and
	         material slot configuration for standard geometry.

  */

  constructor() {
    super(
      'MeshRenderer',
      'Mesh Renderer',
      'Renders 3D meshes with materials and lighting',
      'Rendering'
    );
  }

  /*

           initializeProperties()
	         ---
	         sets up the mesh renderer component properties including
	         mesh asset reference, material array, and rendering
	         options with appropriate metadata for editor interaction.

  */

  protected initializeProperties(): void {
    this.defineProperty<AssetReference | null>('mesh', null, {
      type: 'asset',
      displayName: 'Mesh',
      description: 'The 3D mesh geometry to render',
      fileFilter: 'model/*'
    });

    this.defineProperty<(AssetReference | null)[]>('materials', [], {
      type: 'object',
      displayName: 'Materials',
      description: 'Array of materials for mesh submeshes'
    });

    this.defineProperty<ShadowCastingMode>('shadowCastingMode', ShadowCastingMode.ON, {
      type: 'enum',
      displayName: 'Cast Shadows',
      description: 'How this renderer casts shadows',
      options: Object.values(ShadowCastingMode)
    });

    this.defineProperty<boolean>('receiveShadows', true, {
      type: 'boolean',
      displayName: 'Receive Shadows',
      description: 'Whether this renderer receives shadows from other objects'
    });

    this.defineProperty<LightProbeUsage>('lightProbeUsage', LightProbeUsage.BLEND_PROBES, {
      type: 'enum',
      displayName: 'Light Probes',
      description: 'How this renderer uses light probes for global illumination',
      options: Object.values(LightProbeUsage)
    });

    this.defineProperty<number>('sortingOrder', 0, {
      type: 'number',
      displayName: 'Sorting Order',
      description: 'Rendering order within the same layer',
      min: -100,
      max: 100,
      step: 1
    });

    this.defineProperty<string>('sortingLayerName', 'Default', {
      type: 'string',
      displayName: 'Sorting Layer',
      description: 'The sorting layer this renderer belongs to'
    });

    this.defineProperty<boolean>('dynamicOccludee', true, {
      type: 'boolean',
      displayName: 'Dynamic Occludee',
      description: 'Whether this renderer can be occluded by other objects'
    });

    this.defineProperty<boolean>('allowOcclusionWhenDynamic', true, {
      type: 'boolean',
      displayName: 'Allow Occlusion When Dynamic',
      description: 'Allow occlusion culling when renderer moves'
    });

    this.defineProperty<boolean>('enableGPUInstancing', false, {
      type: 'boolean',
      displayName: 'Enable GPU Instancing',
      description: 'Enable GPU instancing for performance when rendering many identical objects'
    });

    this.defineProperty<number>('lightmapIndex', -1, {
      type: 'number',
      displayName: 'Lightmap Index',
      description: 'Index of the lightmap applied to this renderer (-1 for none)',
      min: -1,
      max: 255,
      step: 1
    });
  }

  /*

           getMesh()
	         ---
	         retrieves the current mesh asset reference. the mesh
	         defines the 3D geometry that will be rendered with
	         the assigned materials and rendering parameters.

  */

  getMesh(): AssetReference | null {
    return this.getProperty<AssetReference | null>('mesh');
  }

  /*

           setMesh()
	         ---
	         assigns a new mesh asset reference and automatically
	         adjusts the material array to match the number of
	         submeshes in the new geometry.

  */

  setMesh(mesh: AssetReference | null): void {
    this.setProperty('mesh', mesh);

    /* adjust material array when mesh changes */
    const materials = this.getMaterials();
    if (mesh) {
      /* ensure at least one material slot for new mesh */
      if (materials.length === 0) {
        materials.push(null);
        this.setMaterials(materials);
      }
    }
  }

  /*

           getMaterials()
	         ---
	         retrieves the current array of material assignments.
	         each element corresponds to a submesh in the geometry
	         and defines its visual appearance properties.

  */

  getMaterials(): (AssetReference | null)[] {
    return this.getProperty<(AssetReference | null)[]>('materials') || [];
  }

  /*

           setMaterials()
	         ---
	         updates the complete material assignment array. ensures
	         all submeshes have appropriate materials assigned for
	         proper rendering without visual artifacts.

  */

  setMaterials(materials: (AssetReference | null)[]): void {
    this.setProperty('materials', materials);
  }

  /*

           addMaterial()
	         ---
	         appends a new material to the material array, extending
	         the available material slots. useful for dynamically
	         adding materials to multi-submesh objects.

  */

  addMaterial(material: AssetReference | null): void {
    const materials = this.getMaterials();
    materials.push(material);
    this.setMaterials(materials);
  }

  /*

           removeMaterial()
	         ---
	         removes a material at the specified index from the
	         material array. validates index bounds and maintains
	         array integrity after removal.

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

  /*

           getMaterial()
	         ---
	         retrieves the material assigned to a specific submesh
	         index. handles bounds checking and provides fallback
	         behavior for missing material assignments.

  */

  getMaterial(submeshIndex: number): AssetReference | null {
    const materials = this.getMaterials();
    if (submeshIndex < 0 || submeshIndex >= materials.length) {
      return null;
    }
    return materials[submeshIndex];
  }

  /*

           setMaterial()
	         ---
	         assigns a material to a specific submesh index, extending
	         the material array if necessary to accommodate the assignment.
	         ensures material slots are available for all submeshes.

  */

  setMaterial(submeshIndex: number, material: AssetReference | null): void {
    if (submeshIndex < 0) {
      return;
    }

    const materials = this.getMaterials();
    while (materials.length <= submeshIndex) {
      materials.push(null);
    }

    materials[submeshIndex] = material;
    this.setMaterials(materials);
  }

  /*

           getShadowCastingMode()
	         ---
	         retrieves the current shadow casting behavior that
	         determines how this mesh participates in shadow
	         mapping and lighting calculations.

  */

  getShadowCastingMode(): ShadowCastingMode {
    return this.getProperty<ShadowCastingMode>('shadowCastingMode') || ShadowCastingMode.ON;
  }

  /*

           setShadowCastingMode()
	         ---
	         updates the shadow casting behavior. affects performance
	         and visual quality by controlling shadow participation
	         in the rendering pipeline.

  */

  setShadowCastingMode(mode: ShadowCastingMode): void {
    this.setProperty('shadowCastingMode', mode);
  }

  /*

           getReceiveShadows()
	         ---
	         checks whether this mesh renderer receives shadows
	         from other objects in the scene. shadow reception
	         adds visual depth and realism to rendered objects.

  */

  getReceiveShadows(): boolean {
    return this.getProperty<boolean>('receiveShadows') || false;
  }

  /*

           setReceiveShadows()
	         ---
	         enables or disables shadow reception for this mesh.
	         disabling can improve performance for objects that
	         don't benefit from shadow detail.

  */

  setReceiveShadows(receiveShadows: boolean): void {
    this.setProperty('receiveShadows', receiveShadows);
  }

  /*

           getLightProbeUsage()
	         ---
	         retrieves the light probe sampling mode that determines
	         how this mesh receives indirect lighting from the
	         global illumination system.

  */

  getLightProbeUsage(): LightProbeUsage {
    return this.getProperty<LightProbeUsage>('lightProbeUsage') || LightProbeUsage.BLEND_PROBES;
  }

  /*

           setLightProbeUsage()
	         ---
	         updates the light probe sampling behavior. affects
	         how the mesh receives ambient and indirect lighting
	         for more realistic shading.

  */

  setLightProbeUsage(usage: LightProbeUsage): void {
    this.setProperty('lightProbeUsage', usage);
  }

  /*

           getSortingOrder()
	         ---
	         retrieves the rendering order value within the same
	         sorting layer. higher values render on top of lower
	         values for fine-grained depth control.

  */

  getSortingOrder(): number {
    return this.getProperty<number>('sortingOrder') || 0;
  }

  /*

           setSortingOrder()
	         ---
	         updates the rendering order within the sorting layer.
	         useful for controlling draw order without changing
	         actual 3D depth relationships.

  */

  setSortingOrder(order: number): void {
    this.setProperty('sortingOrder', order);
  }

  /*

           getSortingLayerName()
	         ---
	         retrieves the name of the sorting layer this renderer
	         belongs to. sorting layers provide coarse-grained
	         control over rendering order.

  */

  getSortingLayerName(): string {
    return this.getProperty<string>('sortingLayerName') || 'Default';
  }

  /*

           setSortingLayerName()
	         ---
	         assigns this renderer to a specific sorting layer.
	         sorting layers help organize rendering order for
	         UI elements, effects, and geometry.

  */

  setSortingLayerName(layerName: string): void {
    this.setProperty('sortingLayerName', layerName);
  }

  /*

           isDynamicOccludee()
	         ---
	         checks if this renderer can be occluded by other
	         objects during occlusion culling. dynamic occlusion
	         improves performance by hiding invisible objects.

  */

  isDynamicOccludee(): boolean {
    return this.getProperty<boolean>('dynamicOccludee') || false;
  }

  /*

           setDynamicOccludee()
	         ---
	         enables or disables dynamic occlusion for this renderer.
	         important objects should disable occlusion to ensure
	         they're always considered for rendering.

  */

  setDynamicOccludee(dynamic: boolean): void {
    this.setProperty('dynamicOccludee', dynamic);
  }

  /*

           isGPUInstancingEnabled()
	         ---
	         checks if GPU instancing is enabled for this renderer.
	         instancing provides significant performance benefits
	         when rendering many identical objects.

  */

  isGPUInstancingEnabled(): boolean {
    return this.getProperty<boolean>('enableGPUInstancing') || false;
  }

  /*

           setGPUInstancingEnabled()
	         ---
	         enables or disables GPU instancing optimization.
	         only beneficial when many identical objects use
	         the same mesh and material configuration.

  */

  setGPUInstancingEnabled(enabled: boolean): void {
    this.setProperty('enableGPUInstancing', enabled);
  }

  /*

           getLightmapIndex()
	         ---
	         retrieves the lightmap index for pre-baked lighting.
	         lightmaps provide high-quality static lighting
	         with minimal runtime performance cost.

  */

  getLightmapIndex(): number {
    return this.getProperty<number>('lightmapIndex') || -1;
  }

  /*

           setLightmapIndex()
	         ---
	         assigns a lightmap index for pre-baked lighting.
	         value of -1 indicates no lightmap assignment,
	         using dynamic lighting instead.

  */

  setLightmapIndex(index: number): void {
    this.setProperty('lightmapIndex', index);
  }

  /*

           hasLightmap()
	         ---
	         utility function that checks if this renderer has
	         a lightmap assigned. lightmapped objects use
	         pre-baked lighting for improved performance.

  */

  hasLightmap(): boolean {
    return this.getLightmapIndex() >= 0;
  }

  /*

           validate()
	         ---
	         ensures mesh renderer configuration is valid for rendering,
	         checking asset references, material assignments, and
	         parameter ranges that could cause rendering errors.

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

    return errors;
  }

  /*

           onPropertyChanged()
	         ---
	         handles mesh renderer property changes including
	         validation and constraint enforcement. ensures
	         parameters stay within valid ranges for rendering.

  */

  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* clamp lightmap index to valid range */
    if (key === 'lightmapIndex') {
      const index = value as number;
      const clampedIndex = Math.max(-1, Math.min(255, Math.floor(index)));
      if (clampedIndex !== index) {
        this.setProperty('lightmapIndex', clampedIndex);
      }
    }

    /* clamp sorting order to reasonable range */
    if (key === 'sortingOrder') {
      const order = value as number;
      const clampedOrder = Math.max(-100, Math.min(100, Math.floor(order)));
      if (clampedOrder !== order) {
        this.setProperty('sortingOrder', clampedOrder);
      }
    }

    /* adjust materials array when mesh changes */
    if (key === 'mesh') {
      const mesh = value as AssetReference | null;
      const materials = this.getMaterials();
      if (mesh) {
        /* ensure at least one material slot for new mesh */
        if (materials.length === 0) {
          materials.push(null);
          this.setMaterials(materials);
        }
      }
    }
  }
}

/*
	===============================================================
             --- FACTORY ---
	===============================================================
*/

/*

         createMeshRendererComponent()
	       ---
	       factory function that creates a new MeshRendererComponent
	       with default values. provides consistent instantiation
	       pattern for the component system registration.

	       returns a properly initialized mesh renderer component
	       with no mesh or materials assigned initially.

*/

export function createMeshRendererComponent(): MeshRendererComponent {
  return new MeshRendererComponent();
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
