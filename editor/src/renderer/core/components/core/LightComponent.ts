/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         LightComponent
           ---
           implements lighting for 3D scenes with support for
           directional, point, and spot light types.

           directional lights simulate distant light sources like
           the sun. point lights emit in all directions from a
           position. spot lights emit in a cone shape with
           adjustable angle and falloff.

*/

import { Component, Color, Vector3, PropertyMetadata } from '../Component';

/*
 * ===========================
        --- TYPES ---
 * ===========================
 */

export enum LightType {
  DIRECTIONAL = 'directional',
  POINT = 'point',
  SPOT = 'spot'
}

export enum ShadowType {
  NONE = 'none',
  HARD = 'hard',
  SOFT = 'soft'
}

/*
 * ===========================
        --- COMPONENT ---
 * ===========================
 */

/**
 * Light component
 *
 * provides lighting functionality for 3D scenes.
 * supports multiple light types with physically-based
 * properties for realistic rendering.
 */
export class LightComponent extends Component {
  /**
   * LightComponent constructor
   */
  constructor() {
    super(
      'Light',
      'Light',
      'Provides illumination for 3D scenes with various light types',
      'Rendering'
    );
  }

  /**
   * initializeProperties()
   *
   * sets up all light properties with proper validation
   * and sensible defaults for each light type.
   */
  protected initializeProperties(): void {
    /* basic light properties */

    this.defineProperty<LightType>('type', LightType.DIRECTIONAL, {
      type: 'enum',
      displayName: 'Light Type',
      description: 'Type of light source',
      options: Object.values(LightType)
    });

    this.defineProperty<Color>(
      'color',
      { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
      {
        type: 'color',
        displayName: 'Color',
        description: 'Light color and tint'
      }
    );

    this.defineProperty<number>('intensity', 1.0, {
      type: 'number',
      displayName: 'Intensity',
      description: 'Light brightness multiplier',
      min: 0.0,
      max: 10.0,
      step: 0.1
    });

    this.defineProperty<boolean>('enabled', true, {
      type: 'boolean',
      displayName: 'Enabled',
      description: 'Whether the light is active'
    });

    /* directional light properties */

    this.defineProperty<Vector3>(
      'direction',
      { x: 0, y: -1, z: 0 },
      {
        type: 'vector3',
        displayName: 'Direction',
        description: 'Light direction (for directional lights)',
        step: 0.1,
        visible: (component: LightComponent) =>
          component.getProperty<LightType>('type') === LightType.DIRECTIONAL
      }
    );

    /* point light properties */

    this.defineProperty<number>('range', 10.0, {
      type: 'number',
      displayName: 'Range',
      description: 'Maximum distance light travels (point/spot lights)',
      min: 0.1,
      max: 1000.0,
      step: 0.5,
      visible: (component: LightComponent) => {
        const type = component.getProperty<LightType>('type');
        return type === LightType.POINT || type === LightType.SPOT;
      }
    });

    this.defineProperty<number>('constantAttenuation', 1.0, {
      type: 'number',
      displayName: 'Constant Attenuation',
      description: 'Constant term in distance falloff formula',
      min: 0.0,
      max: 2.0,
      step: 0.01,
      visible: (component: LightComponent) => {
        const type = component.getProperty<LightType>('type');
        return type === LightType.POINT || type === LightType.SPOT;
      }
    });

    this.defineProperty<number>('linearAttenuation', 0.1, {
      type: 'number',
      displayName: 'Linear Attenuation',
      description: 'Linear term in distance falloff formula',
      min: 0.0,
      max: 1.0,
      step: 0.001,
      visible: (component: LightComponent) => {
        const type = component.getProperty<LightType>('type');
        return type === LightType.POINT || type === LightType.SPOT;
      }
    });

    this.defineProperty<number>('quadraticAttenuation', 0.01, {
      type: 'number',
      displayName: 'Quadratic Attenuation',
      description: 'Quadratic term in distance falloff formula',
      min: 0.0,
      max: 1.0,
      step: 0.0001,
      visible: (component: LightComponent) => {
        const type = component.getProperty<LightType>('type');
        return type === LightType.POINT || type === LightType.SPOT;
      }
    });

    /* spot light properties */

    this.defineProperty<number>('spotAngle', 30.0, {
      type: 'number',
      displayName: 'Spot Angle',
      description: 'Cone angle in degrees (spot lights)',
      min: 1.0,
      max: 179.0,
      step: 1.0,
      visible: (component: LightComponent) =>
        component.getProperty<LightType>('type') === LightType.SPOT
    });

    this.defineProperty<number>('spotExponent', 1.0, {
      type: 'number',
      displayName: 'Spot Exponent',
      description: 'Controls falloff from center to edge of spotlight cone',
      min: 0.0,
      max: 128.0,
      step: 0.1,
      visible: (component: LightComponent) =>
        component.getProperty<LightType>('type') === LightType.SPOT
    });

    this.defineProperty<Vector3>(
      'spotDirection',
      { x: 0, y: 0, z: -1 },
      {
        type: 'vector3',
        displayName: 'Spot Direction',
        description: 'Direction the spotlight points',
        step: 0.1,
        visible: (component: LightComponent) =>
          component.getProperty<LightType>('type') === LightType.SPOT
      }
    );

    /* shadow properties */

    this.defineProperty<ShadowType>('shadowType', ShadowType.NONE, {
      type: 'enum',
      displayName: 'Shadow Type',
      description: 'Type of shadows this light casts',
      options: Object.values(ShadowType)
    });

    this.defineProperty<number>('shadowStrength', 1.0, {
      type: 'number',
      displayName: 'Shadow Strength',
      description: 'Intensity of shadows cast by this light',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      visible: (component: LightComponent) =>
        component.getProperty<ShadowType>('shadowType') !== ShadowType.NONE
    });

    this.defineProperty<number>('shadowBias', 0.005, {
      type: 'number',
      displayName: 'Shadow Bias',
      description: 'Bias to prevent shadow acne artifacts',
      min: 0.0001,
      max: 0.1,
      step: 0.0001,
      visible: (component: LightComponent) =>
        component.getProperty<ShadowType>('shadowType') !== ShadowType.NONE
    });

    this.defineProperty<number>('shadowMapSize', 1024, {
      type: 'number',
      displayName: 'Shadow Map Size',
      description: 'Resolution of shadow map texture',
      min: 256,
      max: 4096,
      step: 256,
      visible: (component: LightComponent) =>
        component.getProperty<ShadowType>('shadowType') !== ShadowType.NONE
    });
  }

  /*
   * ===========================
          --- GETTERS ---
   * ===========================
   */

  /**
   * getLightType()
   *
   * returns the current light type.
   */
  getLightType(): LightType {
    return this.getProperty<LightType>('type') || LightType.DIRECTIONAL;
  }

  /**
   * getColor()
   *
   * returns the light color.
   */
  getColor(): Color {
    return this.getProperty<Color>('color') || { r: 1, g: 1, b: 1, a: 1 };
  }

  /**
   * getIntensity()
   *
   * returns the light intensity.
   */
  getIntensity(): number {
    return this.getProperty<number>('intensity') || 1.0;
  }

  /**
   * isEnabled()
   *
   * returns whether the light is active.
   */
  isEnabled(): boolean {
    return this.getProperty<boolean>('enabled') !== false;
  }

  /**
   * getDirection()
   *
   * returns the normalized light direction for directional lights.
   */
  getDirection(): Vector3 {
    const dir = this.getProperty<Vector3>('direction') || { x: 0, y: -1, z: 0 };
    return this.normalizeVector3(dir);
  }

  /**
   * getRange()
   *
   * returns the light range for point/spot lights.
   */
  getRange(): number {
    return this.getProperty<number>('range') || 10.0;
  }

  /**
   * getSpotAngle()
   *
   * returns the spotlight cone angle in degrees.
   */
  getSpotAngle(): number {
    return this.getProperty<number>('spotAngle') || 30.0;
  }

  /**
   * getSpotAngleRadians()
   *
   * returns the spotlight cone angle in radians.
   */
  getSpotAngleRadians(): number {
    return (this.getSpotAngle() * Math.PI) / 180.0;
  }

  /**
   * getShadowType()
   *
   * returns the shadow type for this light.
   */
  getShadowType(): ShadowType {
    return this.getProperty<ShadowType>('shadowType') || ShadowType.NONE;
  }

  /*
   * ===========================
          --- SETTERS ---
   * ===========================
   */

  /**
   * setLightType()
   *
   * changes the light type and updates related properties.
   */
  setLightType(type: LightType): void {
    this.setProperty('type', type);

    /* adjust default properties based on type */
    switch (type) {
      case LightType.DIRECTIONAL:
        this.setProperty('intensity', 3.0);
        break;

      case LightType.POINT:
        this.setProperty('intensity', 1.0);
        this.setProperty('range', 10.0);
        break;

      case LightType.SPOT:
        this.setProperty('intensity', 1.0);
        this.setProperty('range', 10.0);
        this.setProperty('spotAngle', 30.0);
        break;
    }
  }

  /**
   * setColor()
   *
   * sets the light color.
   */
  setColor(color: Color): void {
    this.setProperty('color', color);
  }

  /**
   * setIntensity()
   *
   * sets the light intensity.
   */
  setIntensity(intensity: number): void {
    this.setProperty('intensity', Math.max(0, intensity));
  }

  /**
   * setEnabled()
   *
   * enables or disables the light.
   */
  setEnabled(enabled: boolean): void {
    this.setProperty('enabled', enabled);
  }

  /*
   * ===========================
          --- UTILS ---
   * ===========================
   */

  /**
   * calculateAttenuation()
   *
   * calculates light attenuation at given distance.
   * uses standard OpenGL attenuation formula.
   */
  calculateAttenuation(distance: number): number {
    if (this.getLightType() === LightType.DIRECTIONAL) {
      return 1.0; /* directional lights don't attenuate */
    }

    const constant = this.getProperty<number>('constantAttenuation') || 1.0;
    const linear = this.getProperty<number>('linearAttenuation') || 0.1;
    const quadratic = this.getProperty<number>('quadraticAttenuation') || 0.01;

    const attenuation = constant + linear * distance + quadratic * distance * distance;

    return Math.max(0.0, 1.0 / attenuation);
  }

  /**
   * calculateSpotFactor()
   *
   * calculates spotlight intensity factor based on angle from center.
   */
  calculateSpotFactor(lightDirection: Vector3, fragmentDirection: Vector3): number {
    if (this.getLightType() !== LightType.SPOT) {
      return 1.0;
    }

    const spotDir = this.getProperty<Vector3>('spotDirection') || { x: 0, y: 0, z: -1 };
    const spotAngleRad = this.getSpotAngleRadians();
    const spotExponent = this.getProperty<number>('spotExponent') || 1.0;

    const cosAngle = this.dotProduct(
      this.normalizeVector3(lightDirection),
      this.normalizeVector3(spotDir)
    );

    const cosSpotAngle = Math.cos(spotAngleRad * 0.5);

    if (cosAngle < cosSpotAngle) {
      return 0.0; /* outside spotlight cone */
    }

    return Math.pow(cosAngle, spotExponent);
  }

  /**
   * normalizeVector3()
   *
   * normalizes a 3D vector to unit length.
   */
  private normalizeVector3(vec: Vector3): Vector3 {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);

    if (length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: vec.x / length,
      y: vec.y / length,
      z: vec.z / length
    };
  }

  /**
   * dotProduct()
   *
   * calculates dot product of two 3D vectors.
   */
  private dotProduct(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /*
   * ===========================
        --- VALIDATION ---
   * ===========================
   */

  /**
   * validate()
   *
   * validates light component properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const lightType = this.getLightType();
    const intensity = this.getIntensity();
    const color = this.getColor();

    /* validate intensity */
    if (intensity < 0) {
      errors.push('Light intensity cannot be negative');
    }

    if (intensity > 100) {
      errors.push('Light intensity is extremely high and may cause rendering issues');
    }

    /* validate color */
    if (color.r < 0 || color.g < 0 || color.b < 0 || color.a < 0) {
      errors.push('Light color values cannot be negative');
    }

    if (color.r > 2 || color.g > 2 || color.b > 2) {
      errors.push('Light color values above 2.0 may cause HDR issues');
    }

    /* validate light-type-specific properties */
    if (lightType === LightType.POINT || lightType === LightType.SPOT) {
      const range = this.getRange();
      if (range <= 0) {
        errors.push('Light range must be greater than zero');
      }
    }

    if (lightType === LightType.SPOT) {
      const spotAngle = this.getSpotAngle();
      if (spotAngle <= 0 || spotAngle >= 180) {
        errors.push('Spot light angle must be between 0 and 180 degrees');
      }
    }

    /* validate shadow properties */
    const shadowType = this.getShadowType();
    if (shadowType !== ShadowType.NONE) {
      const shadowMapSize = this.getProperty<number>('shadowMapSize') || 1024;
      if (shadowMapSize < 256 || shadowMapSize > 4096) {
        errors.push('Shadow map size must be between 256 and 4096');
      }

      if ((shadowMapSize & (shadowMapSize - 1)) !== 0) {
        errors.push('Shadow map size should be a power of 2 for best performance');
      }
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * handles property change events and updates dependent properties.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    /* normalize direction vectors */
    if (key === 'direction' || key === 'spotDirection') {
      const vec = value as Vector3;
      const normalized = this.normalizeVector3(vec);
      this.setProperty(key, normalized); /* don't trigger another change event */
    }

    /* clamp angle values */
    if (key === 'spotAngle') {
      const angle = Math.max(1.0, Math.min(179.0, value as number));
      if (angle !== value) {
        this.setProperty(key, angle);
      }
    }

    /* ensure positive values */
    if (key === 'intensity' || key === 'range') {
      const num = Math.max(0.0, value as number);
      if (num !== value) {
        this.setProperty(key, num);
      }
    }
  }
}

/*
 * ===========================
       --- FACTORY ---
 * ===========================
 */

/**
 * createLightComponent()
 *
 * light component factory function.
 */
export function createLightComponent(): LightComponent {
  return new LightComponent();
}

/* EOF */
