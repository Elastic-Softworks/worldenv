/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Sprite Component
 *
 * 2D sprite rendering component for texture display.
 * Handles sprite properties, texture references, and rendering parameters.
 */

import { Component, Vector2, Color, AssetReference, PropertyMetadata } from '../Component';

/**
 * Sprite flip modes
 */
export enum SpriteFlip {
  NONE = 'none',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  BOTH = 'both',
}

/**
 * Sprite blend modes
 */
export enum BlendMode {
  NORMAL = 'normal',
  ADD = 'add',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
}

/**
 * Sprite component
 *
 * Renders 2D textures/sprites with various display options.
 * Supports texture atlasing, animation, and visual effects.
 */
export class SpriteComponent extends Component {
  /**
   * SpriteComponent constructor
   */
  constructor() {
    super(
      'Sprite',
      'Sprite',
      'Renders a 2D texture or sprite image',
      'Rendering'
    );
  }

  /**
   * initializeProperties()
   *
   * Sets up sprite properties.
   */
  protected initializeProperties(): void {
    this.defineProperty<AssetReference | null>(
      'texture',
      null,
      {
        type: 'asset',
        displayName: 'Texture',
        description: 'The texture/image to display',
        fileFilter: 'image/*',
      }
    );

    this.defineProperty<Color>(
      'color',
      { r: 1, g: 1, b: 1, a: 1 },
      {
        type: 'color',
        displayName: 'Color',
        description: 'Tint color applied to the sprite',
      }
    );

    this.defineProperty<Vector2>(
      'size',
      { x: 100, y: 100 },
      {
        type: 'vector2',
        displayName: 'Size',
        description: 'Size of the sprite in pixels',
        min: 1,
        max: 4096,
        step: 1,
      }
    );

    this.defineProperty<Vector2>(
      'pivot',
      { x: 0.5, y: 0.5 },
      {
        type: 'vector2',
        displayName: 'Pivot',
        description: 'Pivot point for rotation and scaling (0-1 normalized)',
        min: 0,
        max: 1,
        step: 0.01,
      }
    );

    this.defineProperty<SpriteFlip>(
      'flip',
      SpriteFlip.NONE,
      {
        type: 'enum',
        displayName: 'Flip',
        description: 'Flip the sprite horizontally or vertically',
        options: Object.values(SpriteFlip),
      }
    );

    this.defineProperty<BlendMode>(
      'blendMode',
      BlendMode.NORMAL,
      {
        type: 'enum',
        displayName: 'Blend Mode',
        description: 'How the sprite blends with background',
        options: Object.values(BlendMode),
      }
    );

    this.defineProperty<number>(
      'sortingOrder',
      0,
      {
        type: 'number',
        displayName: 'Sorting Order',
        description: 'Rendering order (higher values render on top)',
        min: -100,
        max: 100,
        step: 1,
      }
    );

    this.defineProperty<boolean>(
      'useTextureSize',
      true,
      {
        type: 'boolean',
        displayName: 'Use Texture Size',
        description: 'Automatically set size to match texture dimensions',
      }
    );

    // Texture atlas support
    this.defineProperty<Vector2>(
      'atlasOffset',
      { x: 0, y: 0 },
      {
        type: 'vector2',
        displayName: 'Atlas Offset',
        description: 'UV offset for texture atlas (0-1 normalized)',
        min: 0,
        max: 1,
        step: 0.01,
      }
    );

    this.defineProperty<Vector2>(
      'atlasSize',
      { x: 1, y: 1 },
      {
        type: 'vector2',
        displayName: 'Atlas Size',
        description: 'UV size for texture atlas (0-1 normalized)',
        min: 0.01,
        max: 1,
        step: 0.01,
      }
    );

    this.defineProperty<boolean>(
      'pixelPerfect',
      false,
      {
        type: 'boolean',
        displayName: 'Pixel Perfect',
        description: 'Snap sprite position to pixel boundaries',
      }
    );
  }

  /**
   * getTexture()
   *
   * Gets current texture reference.
   */
  getTexture(): AssetReference | null {
    return this.getProperty<AssetReference | null>('texture');
  }

  /**
   * setTexture()
   *
   * Sets texture reference.
   */
  setTexture(texture: AssetReference | null): void {
    this.setProperty('texture', texture);
  }

  /**
   * getColor()
   *
   * Gets current tint color.
   */
  getColor(): Color {
    return this.getProperty<Color>('color') || { r: 1, g: 1, b: 1, a: 1 };
  }

  /**
   * setColor()
   *
   * Sets tint color.
   */
  setColor(color: Color): void {
    this.setProperty('color', color);
  }

  /**
   * getSize()
   *
   * Gets sprite size.
   */
  getSize(): Vector2 {
    return this.getProperty<Vector2>('size') || { x: 100, y: 100 };
  }

  /**
   * setSize()
   *
   * Sets sprite size.
   */
  setSize(size: Vector2): void {
    this.setProperty('size', size);
  }

  /**
   * getPivot()
   *
   * Gets pivot point.
   */
  getPivot(): Vector2 {
    return this.getProperty<Vector2>('pivot') || { x: 0.5, y: 0.5 };
  }

  /**
   * setPivot()
   *
   * Sets pivot point.
   */
  setPivot(pivot: Vector2): void {
    this.setProperty('pivot', pivot);
  }

  /**
   * getFlip()
   *
   * Gets flip mode.
   */
  getFlip(): SpriteFlip {
    return this.getProperty<SpriteFlip>('flip') || SpriteFlip.NONE;
  }

  /**
   * setFlip()
   *
   * Sets flip mode.
   */
  setFlip(flip: SpriteFlip): void {
    this.setProperty('flip', flip);
  }

  /**
   * getBlendMode()
   *
   * Gets blend mode.
   */
  getBlendMode(): BlendMode {
    return this.getProperty<BlendMode>('blendMode') || BlendMode.NORMAL;
  }

  /**
   * setBlendMode()
   *
   * Sets blend mode.
   */
  setBlendMode(blendMode: BlendMode): void {
    this.setProperty('blendMode', blendMode);
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
   * isUsingTextureSize()
   *
   * Checks if using automatic texture sizing.
   */
  isUsingTextureSize(): boolean {
    return this.getProperty<boolean>('useTextureSize') || false;
  }

  /**
   * setUseTextureSize()
   *
   * Sets automatic texture sizing.
   */
  setUseTextureSize(useTextureSize: boolean): void {
    this.setProperty('useTextureSize', useTextureSize);
  }

  /**
   * getAtlasOffset()
   *
   * Gets texture atlas UV offset.
   */
  getAtlasOffset(): Vector2 {
    return this.getProperty<Vector2>('atlasOffset') || { x: 0, y: 0 };
  }

  /**
   * setAtlasOffset()
   *
   * Sets texture atlas UV offset.
   */
  setAtlasOffset(offset: Vector2): void {
    this.setProperty('atlasOffset', offset);
  }

  /**
   * getAtlasSize()
   *
   * Gets texture atlas UV size.
   */
  getAtlasSize(): Vector2 {
    return this.getProperty<Vector2>('atlasSize') || { x: 1, y: 1 };
  }

  /**
   * setAtlasSize()
   *
   * Sets texture atlas UV size.
   */
  setAtlasSize(size: Vector2): void {
    this.setProperty('atlasSize', size);
  }

  /**
   * isPixelPerfect()
   *
   * Checks if pixel perfect rendering is enabled.
   */
  isPixelPerfect(): boolean {
    return this.getProperty<boolean>('pixelPerfect') || false;
  }

  /**
   * setPixelPerfect()
   *
   * Sets pixel perfect rendering.
   */
  setPixelPerfect(pixelPerfect: boolean): void {
    this.setProperty('pixelPerfect', pixelPerfect);
  }

  /**
   * setAtlasRegion()
   *
   * Helper to set atlas region from pixel coordinates.
   */
  setAtlasRegion(x: number, y: number, width: number, height: number, textureWidth: number, textureHeight: number): void {
    const offset: Vector2 = {
      x: x / textureWidth,
      y: y / textureHeight,
    };

    const size: Vector2 = {
      x: width / textureWidth,
      y: height / textureHeight,
    };

    this.setAtlasOffset(offset);
    this.setAtlasSize(size);
  }

  /**
   * validate()
   *
   * Validates sprite properties.
   */
  validate(): string[] {
    const errors = super.validate();

    const size = this.getSize();
    if (size.x <= 0 || size.y <= 0) {
      errors.push('Sprite size must be greater than zero');
    }

    const pivot = this.getPivot();
    if (pivot.x < 0 || pivot.x > 1 || pivot.y < 0 || pivot.y > 1) {
      errors.push('Pivot values must be between 0 and 1');
    }

    const atlasOffset = this.getAtlasOffset();
    if (atlasOffset.x < 0 || atlasOffset.x > 1 || atlasOffset.y < 0 || atlasOffset.y > 1) {
      errors.push('Atlas offset values must be between 0 and 1');
    }

    const atlasSize = this.getAtlasSize();
    if (atlasSize.x <= 0 || atlasSize.x > 1 || atlasSize.y <= 0 || atlasSize.y > 1) {
      errors.push('Atlas size values must be between 0 and 1');
    }

    const color = this.getColor();
    if (color.r < 0 || color.r > 1 || color.g < 0 || color.g > 1 ||
        color.b < 0 || color.b > 1 || color.a < 0 || color.a > 1) {
      errors.push('Color values must be between 0 and 1');
    }

    return errors;
  }

  /**
   * onPropertyChanged()
   *
   * Handles property changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    super.onPropertyChanged(key, value);

    // Clamp color values
    if (key === 'color') {
      const color = value as Color;
      color.r = Math.max(0, Math.min(1, color.r));
      color.g = Math.max(0, Math.min(1, color.g));
      color.b = Math.max(0, Math.min(1, color.b));
      color.a = Math.max(0, Math.min(1, color.a));
    }

    // Clamp pivot values
    if (key === 'pivot') {
      const pivot = value as Vector2;
      pivot.x = Math.max(0, Math.min(1, pivot.x));
      pivot.y = Math.max(0, Math.min(1, pivot.y));
    }

    // Clamp atlas values
    if (key === 'atlasOffset') {
      const offset = value as Vector2;
      offset.x = Math.max(0, Math.min(1, offset.x));
      offset.y = Math.max(0, Math.min(1, offset.y));
    }

    if (key === 'atlasSize') {
      const size = value as Vector2;
      size.x = Math.max(0.01, Math.min(1, size.x));
      size.y = Math.max(0.01, Math.min(1, size.y));
    }

    // Ensure positive size
    if (key === 'size') {
      const size = value as Vector2;
      size.x = Math.max(1, size.x);
      size.y = Math.max(1, size.y);
    }
  }
}

/**
 * Sprite component factory
 */
export function createSpriteComponent(): SpriteComponent {
  return new SpriteComponent();
}
