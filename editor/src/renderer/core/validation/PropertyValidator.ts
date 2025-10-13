/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Property Validator
 *
 * Validates component property values and provides error messages.
 * Ensures data integrity and provides user feedback for invalid inputs.
 */

import type { PropertyMetadata, Vector2, Vector3, Color } from '../components/Component';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Property validation rules
 */
export interface ValidationRule {
  name: string;
  validate: (value: any, metadata: PropertyMetadata) => ValidationResult;
}

/**
 * PropertyValidator
 *
 * Validates component property values against metadata constraints.
 */
export class PropertyValidator {
  private static readonly DEFAULT_RULES: ValidationRule[] = [
    {
      name: 'required',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.required && (value === null || value === undefined || value === '')) {
          return {
            isValid: false,
            error: `${metadata.displayName} is required`
          };
        }
        return { isValid: true };
      }
    },

    {
      name: 'numeric_range',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'number' && typeof value === 'number') {
          if (metadata.min !== undefined && value < metadata.min) {
            return {
              isValid: false,
              error: `${metadata.displayName} must be at least ${metadata.min}`
            };
          }
          if (metadata.max !== undefined && value > metadata.max) {
            return {
              isValid: false,
              error: `${metadata.displayName} must be at most ${metadata.max}`
            };
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'string_length',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'string' && typeof value === 'string') {
          if (metadata.minLength !== undefined && value.length < metadata.minLength) {
            return {
              isValid: false,
              error: `${metadata.displayName} must be at least ${metadata.minLength} characters`
            };
          }
          if (metadata.maxLength !== undefined && value.length > metadata.maxLength) {
            return {
              isValid: false,
              error: `${metadata.displayName} must be at most ${metadata.maxLength} characters`
            };
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'enum_validation',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'enum' && metadata.options) {
          if (!metadata.options.includes(value)) {
            return {
              isValid: false,
              error: `${metadata.displayName} must be one of: ${metadata.options.join(', ')}`
            };
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'vector2_validation',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'vector2') {
          if (!value || typeof value !== 'object') {
            return {
              isValid: false,
              error: `${metadata.displayName} must be a Vector2 object`
            };
          }

          const vec = value as Vector2;
          if (typeof vec.x !== 'number' || typeof vec.y !== 'number') {
            return {
              isValid: false,
              error: `${metadata.displayName} components must be numbers`
            };
          }

          if (isNaN(vec.x) || isNaN(vec.y)) {
            return {
              isValid: false,
              error: `${metadata.displayName} components cannot be NaN`
            };
          }

          // Check component ranges if specified
          if (metadata.min !== undefined) {
            if (vec.x < metadata.min || vec.y < metadata.min) {
              return {
                isValid: false,
                error: `${metadata.displayName} components must be at least ${metadata.min}`
              };
            }
          }
          if (metadata.max !== undefined) {
            if (vec.x > metadata.max || vec.y > metadata.max) {
              return {
                isValid: false,
                error: `${metadata.displayName} components must be at most ${metadata.max}`
              };
            }
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'vector3_validation',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'vector3') {
          if (!value || typeof value !== 'object') {
            return {
              isValid: false,
              error: `${metadata.displayName} must be a Vector3 object`
            };
          }

          const vec = value as Vector3;
          if (typeof vec.x !== 'number' || typeof vec.y !== 'number' || typeof vec.z !== 'number') {
            return {
              isValid: false,
              error: `${metadata.displayName} components must be numbers`
            };
          }

          if (isNaN(vec.x) || isNaN(vec.y) || isNaN(vec.z)) {
            return {
              isValid: false,
              error: `${metadata.displayName} components cannot be NaN`
            };
          }

          // Check component ranges if specified
          if (metadata.min !== undefined) {
            if (vec.x < metadata.min || vec.y < metadata.min || vec.z < metadata.min) {
              return {
                isValid: false,
                error: `${metadata.displayName} components must be at least ${metadata.min}`
              };
            }
          }
          if (metadata.max !== undefined) {
            if (vec.x > metadata.max || vec.y > metadata.max || vec.z > metadata.max) {
              return {
                isValid: false,
                error: `${metadata.displayName} components must be at most ${metadata.max}`
              };
            }
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'color_validation',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.type === 'color') {
          if (!value || typeof value !== 'object') {
            return {
              isValid: false,
              error: `${metadata.displayName} must be a Color object`
            };
          }

          const color = value as Color;
          if (typeof color.r !== 'number' || typeof color.g !== 'number' ||
              typeof color.b !== 'number' || typeof color.a !== 'number') {
            return {
              isValid: false,
              error: `${metadata.displayName} components must be numbers`
            };
          }

          if (isNaN(color.r) || isNaN(color.g) || isNaN(color.b) || isNaN(color.a)) {
            return {
              isValid: false,
              error: `${metadata.displayName} components cannot be NaN`
            };
          }

          // Color components should be in [0, 1] range
          if (color.r < 0 || color.r > 1 || color.g < 0 || color.g > 1 ||
              color.b < 0 || color.b > 1 || color.a < 0 || color.a > 1) {
            return {
              isValid: false,
              error: `${metadata.displayName} components must be between 0 and 1`
            };
          }
        }
        return { isValid: true };
      }
    },

    {
      name: 'readonly_validation',
      validate: (value: any, metadata: PropertyMetadata): ValidationResult => {
        if (metadata.readonly) {
          return {
            isValid: false,
            error: `${metadata.displayName} is read-only and cannot be modified`
          };
        }
        return { isValid: true };
      }
    }
  ];

  private customRules: ValidationRule[] = [];

  /**
   * validateProperty()
   *
   * Validates a single property value.
   */
  public validateProperty(value: any, metadata: PropertyMetadata): ValidationResult {
    const allRules = [...PropertyValidator.DEFAULT_RULES, ...this.customRules];

    for (const rule of allRules) {
      const result = rule.validate(value, metadata);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }

  /**
   * validateAllProperties()
   *
   * Validates all properties of a component.
   */
  public validateAllProperties(
    properties: Array<{ key: string; value: any; metadata: PropertyMetadata }>
  ): { [key: string]: ValidationResult } {
    const results: { [key: string]: ValidationResult } = {};

    for (const prop of properties) {
      results[prop.key] = this.validateProperty(prop.value, prop.metadata);
    }

    return results;
  }

  /**
   * addCustomRule()
   *
   * Adds a custom validation rule.
   */
  public addCustomRule(rule: ValidationRule): void {
    this.customRules.push(rule);
  }

  /**
   * removeCustomRule()
   *
   * Removes a custom validation rule by name.
   */
  public removeCustomRule(ruleName: string): boolean {
    const index = this.customRules.findIndex(rule => rule.name === ruleName);
    if (index >= 0) {
      this.customRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * hasErrors()
   *
   * Checks if any validation results have errors.
   */
  public static hasErrors(results: { [key: string]: ValidationResult }): boolean {
    return Object.values(results).some(result => !result.isValid);
  }

  /**
   * getErrors()
   *
   * Gets all error messages from validation results.
   */
  public static getErrors(results: { [key: string]: ValidationResult }): string[] {
    return Object.values(results)
      .filter(result => !result.isValid && result.error)
      .map(result => result.error!);
  }

  /**
   * getWarnings()
   *
   * Gets all warning messages from validation results.
   */
  public static getWarnings(results: { [key: string]: ValidationResult }): string[] {
    return Object.values(results)
      .filter(result => result.warning)
      .map(result => result.warning!);
  }

  /**
   * formatErrorMessage()
   *
   * Formats validation error for display.
   */
  public static formatErrorMessage(propertyName: string, result: ValidationResult): string {
    if (result.isValid) {
      return '';
    }
    return result.error || `Invalid value for ${propertyName}`;
  }
}

/**
 * Global property validator instance
 */
export const propertyValidator = new PropertyValidator();
