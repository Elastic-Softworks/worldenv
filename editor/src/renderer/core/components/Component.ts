/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Component System
 *
 * Base component interface and property system for entity-component architecture.
 * Provides type-safe component definitions and property serialization.
 */

import { generateId } from '../../utils/IdGenerator';

/**
 * Component property types
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'vector2'
  | 'vector3'
  | 'color'
  | 'asset'
  | 'enum'
  | 'object';

/**
 * Vector2 interface
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Vector3 interface
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Color interface (RGBA)
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Asset reference interface
 */
export interface AssetReference {
  id: string;
  path: string;
  type: string;
}

/**
 * Property metadata for UI generation and validation
 */
export interface PropertyMetadata {
  type: PropertyType;
  displayName: string;
  description?: string;
  readonly?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  minLength?: number;
  maxLength?: number;
  options?: string[];
  fileFilter?: string;
  defaultValue?: any;
  placeholder?: string;
}

/**
 * Component property definition
 */
export interface ComponentProperty {
  key: string;
  value: any;
  metadata: PropertyMetadata;
}

/**
 * Component serialization data
 */
export interface ComponentSerialData {
  id: string;
  type: string;
  enabled: boolean;
  version: number;
  properties: Record<string, any>;
  metadata: {
    created: Date;
    modified: Date;
  };
}

/**
 * Base component interface
 */
export interface IComponent {
  readonly id: string;
  readonly type: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: number;
  readonly category: string;
  enabled: boolean;
  readonly properties: Map<string, ComponentProperty>;
  readonly metadata: {
    created: Date;
    modified: Date;
  };

  /**
   * getProperty()
   *
   * Gets property value by key.
   */
  getProperty<T = any>(key: string): T | null;

  /**
   * setProperty()
   *
   * Sets property value by key.
   */
  setProperty<T = any>(key: string, value: T): boolean;

  /**
   * hasProperty()
   *
   * Checks if property exists.
   */
  hasProperty(key: string): boolean;

  /**
   * getPropertyMetadata()
   *
   * Gets property metadata for UI generation.
   */
  getPropertyMetadata(key: string): PropertyMetadata | null;

  /**
   * getAllProperties()
   *
   * Gets all properties as array.
   */
  getAllProperties(): ComponentProperty[];

  /**
   * validate()
   *
   * Validates component data.
   */
  validate(): string[];

  /**
   * clone()
   *
   * Creates deep copy of component.
   */
  clone(): IComponent;

  /**
   * serialize()
   *
   * Converts component to serializable data.
   */
  serialize(): ComponentSerialData;

  /**
   * deserialize()
   *
   * Restores component from serialized data.
   */
  deserialize(data: ComponentSerialData): void;

  /**
   * dispose()
   *
   * Cleanup component resources.
   */
  dispose(): void;
}

/**
 * Component factory function
 */
export type ComponentFactory<T extends IComponent = IComponent> = () => T;

/**
 * Component class factory
 */
export type ComponentClass<T extends IComponent = IComponent> = new () => T;

/**
 * Component descriptor for registry
 */
export interface ComponentDescriptor {
  type: string;
  displayName: string;
  description: string;
  category: string;
  icon?: string;
  factory: ComponentFactory;
  isCore: boolean;
  isVisible: boolean;
  dependencies?: string[];
  conflicts?: string[];
}

/**
 * Base component implementation
 */
export abstract class Component implements IComponent {
  protected _id: string;
  protected _type: string;
  protected _displayName: string;
  protected _description: string;
  protected _version: number = 1;
  protected _category: string;
  protected _enabled: boolean = true;
  protected _properties: Map<string, ComponentProperty> = new Map();
  protected _metadata: {
    created: Date;
    modified: Date;
  };

  /**
   * Component constructor
   */
  constructor(
    type: string,
    displayName: string,
    description: string,
    category: string = 'General'
  ) {
    this._id = generateId();
    this._type = type;
    this._displayName = displayName;
    this._description = description;
    this._category = category;
    this._metadata = {
      created: new Date(),
      modified: new Date()
    };

    this.initializeProperties();
  }

  /**
   * Property getters
   */
  get id(): string {
    return this._id;
  }
  get type(): string {
    return this._type;
  }
  get displayName(): string {
    return this._displayName;
  }
  get description(): string {
    return this._description;
  }
  get version(): number {
    return this._version;
  }
  get category(): string {
    return this._category;
  }
  get enabled(): boolean {
    return this._enabled;
  }
  get properties(): Map<string, ComponentProperty> {
    return this._properties;
  }
  get metadata(): { created: Date; modified: Date } {
    return { ...this._metadata };
  }

  /**
   * enabled setter
   */
  set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      this.markModified();
      this.onEnabledChanged(value);
    }
  }

  /**
   * initializeProperties()
   *
   * Abstract method to initialize component properties.
   * Must be implemented by subclasses.
   */
  protected abstract initializeProperties(): void;

  /**
   * onEnabledChanged()
   *
   * Called when component enabled state changes.
   */
  protected onEnabledChanged(enabled: boolean): void {
    // Override in subclasses if needed
  }

  /**
   * markModified()
   *
   * Updates modification timestamp.
   */
  protected markModified(): void {
    this._metadata.modified = new Date();
  }

  /**
   * defineProperty()
   *
   * Helper method to define component properties.
   */
  protected defineProperty<T>(key: string, defaultValue: T, metadata: PropertyMetadata): void {
    this._properties.set(key, {
      key,
      value: defaultValue,
      metadata: {
        ...metadata,
        defaultValue: defaultValue
      }
    });
  }

  /**
   * getProperty()
   *
   * Gets property value by key.
   */
  getProperty<T = any>(key: string): T | null {
    const property = this._properties.get(key);
    return property ? property.value : null;
  }

  /**
   * setProperty()
   *
   * Sets property value by key.
   */
  setProperty<T = any>(key: string, value: T): boolean {
    const property = this._properties.get(key);
    if (!property) {
      return false;
    }

    if (property.metadata.readonly) {
      return false;
    }

    // Validate value
    if (!this.validatePropertyValue(property.metadata, value)) {
      return false;
    }

    // Update value
    property.value = value;
    this.markModified();
    this.onPropertyChanged(key, value);

    return true;
  }

  /**
   * hasProperty()
   *
   * Checks if property exists.
   */
  hasProperty(key: string): boolean {
    return this._properties.has(key);
  }

  /**
   * getPropertyMetadata()
   *
   * Gets property metadata for UI generation.
   */
  getPropertyMetadata(key: string): PropertyMetadata | null {
    const property = this._properties.get(key);
    return property ? property.metadata : null;
  }

  /**
   * getAllProperties()
   *
   * Gets all properties as array.
   */
  getAllProperties(): ComponentProperty[] {
    return Array.from(this._properties.values());
  }

  /**
   * validatePropertyValue()
   *
   * Validates property value against metadata constraints.
   */
  protected validatePropertyValue(metadata: PropertyMetadata, value: any): boolean {
    // Type validation
    switch (metadata.type) {
      case 'string':
        if (typeof value !== 'string') return false;
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) return false;
        if (metadata.min !== undefined && value < metadata.min) return false;
        if (metadata.max !== undefined && value > metadata.max) return false;
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return false;
        break;
      case 'vector2':
        if (!value || typeof value.x !== 'number' || typeof value.y !== 'number') return false;
        break;
      case 'vector3':
        if (
          !value ||
          typeof value.x !== 'number' ||
          typeof value.y !== 'number' ||
          typeof value.z !== 'number'
        )
          return false;
        break;
      case 'color':
        if (
          !value ||
          typeof value.r !== 'number' ||
          typeof value.g !== 'number' ||
          typeof value.b !== 'number' ||
          typeof value.a !== 'number'
        )
          return false;
        break;
      case 'enum':
        if (metadata.options && !metadata.options.includes(value)) return false;
        break;
    }

    return true;
  }

  /**
   * onPropertyChanged()
   *
   * Called when property value changes.
   */
  protected onPropertyChanged(key: string, value: any): void {
    // Override in subclasses if needed
  }

  /**
   * validate()
   *
   * Validates component data.
   */
  validate(): string[] {
    const errors: string[] = [];

    for (const property of this._properties.values()) {
      if (!this.validatePropertyValue(property.metadata, property.value)) {
        errors.push(`Invalid value for property '${property.key}': ${property.value}`);
      }
    }

    return errors;
  }

  /**
   * clone()
   *
   * Creates deep copy of component.
   */
  clone(): IComponent {
    const cloned = Object.create(Object.getPrototypeOf(this));

    cloned._id = generateId();
    cloned._type = this._type;
    cloned._displayName = this._displayName;
    cloned._description = this._description;
    cloned._version = this._version;
    cloned._category = this._category;
    cloned._enabled = this._enabled;
    cloned._metadata = {
      created: new Date(),
      modified: new Date()
    };

    // Deep clone properties
    cloned._properties = new Map();
    for (const [key, property] of this._properties) {
      cloned._properties.set(key, {
        key: property.key,
        value: this.clonePropertyValue(property.value),
        metadata: { ...property.metadata }
      });
    }

    return cloned;
  }

  /**
   * clonePropertyValue()
   *
   * Creates deep copy of property value.
   */
  protected clonePropertyValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item) => this.clonePropertyValue(item));
      }
      return { ...value };
    }

    return value;
  }

  /**
   * serialize()
   *
   * Converts component to serializable data.
   */
  serialize(): ComponentSerialData {
    const properties: Record<string, any> = {};

    for (const [key, property] of this._properties) {
      properties[key] = property.value;
    }

    return {
      id: this._id,
      type: this._type,
      enabled: this._enabled,
      version: this._version,
      properties,
      metadata: { ...this._metadata }
    };
  }

  /**
   * deserialize()
   *
   * Restores component from serialized data.
   */
  deserialize(data: ComponentSerialData): void {
    this._id = data.id;
    this._enabled = data.enabled;
    this._version = data.version;
    this._metadata = { ...data.metadata };

    // Restore properties
    for (const [key, value] of Object.entries(data.properties)) {
      if (this._properties.has(key)) {
        this._properties.get(key)!.value = value;
      }
    }
  }

  /**
   * dispose()
   *
   * Cleanup component resources.
   */
  dispose(): void {
    this._properties.clear();
  }
}
