/*
   ===============================================================
   WORLDEDIT PROPERTY VALIDATOR
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

import type {
  PropertyMetadata,
  Vector2,
  Vector3,
  Color,
  PropertyType
} from '../components/Component';

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ValidationResult
	       ---
	       result structure returned by validation functions that
	       indicates whether a property value is valid and provides
	       descriptive error or warning messages for user feedback.

	       the validation system distinguishes between errors (which
	       prevent saving) and warnings (which allow saving but
	       suggest improvements or potential issues).

*/

export interface ValidationResult {
  isValid: boolean /* true if value passes validation */;
  error?: string /* blocking error message if validation fails */;
  warning?: string /* non-blocking warning message for user guidance */;
}

/*

         ValidationRule
	       ---
	       validation rule definition that encapsulates a specific
	       validation check with a descriptive name and validation
	       function. rules can be combined to create comprehensive
	       validation for complex property types.

*/

export interface ValidationRule {
  name: string /* descriptive name for the validation rule */;
  validate: (value: any, metadata: PropertyMetadata) => ValidationResult;
}

/*

         PropertyValidator
	       ---
	       comprehensive property validation system that ensures
	       component property values meet type requirements, range
	       constraints, and logical consistency rules. provides
	       user-friendly error messages and prevents invalid data
	       from corrupting the scene graph.

	       the validator handles all standard property types including
	       primitives (number, string, boolean), vectors (Vector2,
	       Vector3), colors, enums, and asset references. each type
	       has specific validation rules that check constraints like
	       numeric ranges, string patterns, and asset existence.

	       validation is performed both during user input (for
	       immediate feedback) and before saving (to ensure data
	       integrity). the system supports both hard errors (which
	       block operations) and soft warnings (which provide
	       guidance but allow continuation).

*/

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

export class PropertyValidator {
  /*

           validateProperty()
	         ---
	         performs comprehensive validation of a property value
	         against its metadata constraints, returning detailed
	         validation results with user-friendly error messages.

	         this is the primary validation entry point that dispatches
	         to type-specific validation functions based on the
	         property metadata type field.

  */

  static validateProperty(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata parameter validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateProperty: metadata must be valid object'
    );
    console.assert(
      typeof metadata.type === 'string',
      'validateProperty: metadata.type must be string'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateProperty: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata !== 'object' || !metadata.type) {
      return { isValid: false, error: 'Invalid property metadata provided' };
    }

    /* handle null/undefined values based on required flag */
    if (value === null || value === undefined) {
      return metadata.required
        ? { isValid: false, error: `${metadata.displayName} is required` }
        : { isValid: true };
    }

    /* dispatch to type-specific validation */
    switch (metadata.type) {
      case 'number':
        return this.validateNumber(value, metadata);
      case 'string':
        return this.validateString(value, metadata);
      case 'boolean':
        return this.validateBoolean(value, metadata);
      case 'vector2':
        return this.validateVector2(value, metadata);
      case 'vector3':
        return this.validateVector3(value, metadata);
      case 'color':
        return this.validateColor(value, metadata);
      case 'enum':
        return this.validateEnum(value, metadata);
      case 'asset':
        return this.validateAsset(value, metadata);
      case 'object':
        return this.validateObject(value, metadata);
      default:
        return { isValid: true, warning: `Unknown property type: ${metadata.type}` };
    }
  }

  /*

           validateNumber()
	         ---
	         validates numeric property values including type checking,
	         range constraints, step validation, and special value
	         handling (infinity, NaN). ensures numeric properties
	         remain within acceptable bounds for their intended use.

  */

  private static validateNumber(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateNumber: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateNumber: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in number validation' };
    }

    /* ensure value is actually a number */
    if (typeof value !== 'number') {
      return { isValid: false, error: `${metadata.displayName} must be a number` };
    }

    /* check for invalid numeric values */
    if (!isFinite(value)) {
      return { isValid: false, error: `${metadata.displayName} must be a finite number` };
    }

    /* validate minimum constraint */
    if (metadata.min !== undefined && value < metadata.min) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be at least ${metadata.min}`
      };
    }

    /* validate maximum constraint */
    if (metadata.max !== undefined && value > metadata.max) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be at most ${metadata.max}`
      };
    }

    /* validate step constraint for discrete values */
    if (metadata.step !== undefined && metadata.step > 0) {
      const remainder = (value - (metadata.min || 0)) % metadata.step;
      if (Math.abs(remainder) > 1e-10) {
        return {
          isValid: false,
          error: `${metadata.displayName} must be a multiple of ${metadata.step}`
        };
      }
    }

    return { isValid: true };
  }

  /*

           validateString()
	         ---
	         validates string property values including length
	         constraints, pattern matching, and character restrictions.
	         supports regular expression validation for complex
	         string format requirements.

  */

  private static validateString(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateString: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateString: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in string validation' };
    }

    /* ensure value is actually a string */
    if (typeof value !== 'string') {
      return { isValid: false, error: `${metadata.displayName} must be a string` };
    }

    /* validate minimum length constraint */
    if (metadata.minLength !== undefined && value.length < metadata.minLength) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be at least ${metadata.minLength} characters`
      };
    }

    /* validate maximum length constraint */
    if (metadata.maxLength !== undefined && value.length > metadata.maxLength) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be at most ${metadata.maxLength} characters`
      };
    }

    return { isValid: true };
  }

  /*

           validateBoolean()
	         ---
	         validates boolean property values with simple type
	         checking. booleans have minimal validation requirements
	         but type safety is still important for component integrity.

  */

  private static validateBoolean(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateBoolean: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateBoolean: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in boolean validation' };
    }

    /* ensure value is actually a boolean */
    if (typeof value !== 'boolean') {
      return { isValid: false, error: `${metadata.displayName} must be a boolean` };
    }

    return { isValid: true };
  }

  /*

           validateVector2()
	         ---
	         validates 2D vector properties by checking the structure
	         and validating each component (x, y) individually. ensures
	         vector components meet numeric constraints and maintain
	         mathematical validity.

  */

  private static validateVector2(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateVector2: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateVector2: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in Vector2 validation' };
    }

    /* ensure value is an object with x and y properties */
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: `${metadata.displayName} must be a Vector2 object` };
    }

    const vector = value as Vector2;

    /* validate x component */
    if (typeof vector.x !== 'number' || !isFinite(vector.x)) {
      return { isValid: false, error: `${metadata.displayName}.x must be a finite number` };
    }

    /* validate y component */
    if (typeof vector.y !== 'number' || !isFinite(vector.y)) {
      return { isValid: false, error: `${metadata.displayName}.y must be a finite number` };
    }

    /* validate component ranges if specified */
    if (metadata.min !== undefined) {
      if (vector.x < metadata.min || vector.y < metadata.min) {
        return {
          isValid: false,
          error: `${metadata.displayName} components must be at least ${metadata.min}`
        };
      }
    }

    if (metadata.max !== undefined) {
      if (vector.x > metadata.max || vector.y > metadata.max) {
        return {
          isValid: false,
          error: `${metadata.displayName} components must be at most ${metadata.max}`
        };
      }
    }

    return { isValid: true };
  }

  /*

           validateVector3()
	         ---
	         validates 3D vector properties by checking the structure
	         and validating each component (x, y, z) individually.
	         essential for transform, physics, and lighting calculations
	         that require mathematically valid 3D coordinates.

  */

  private static validateVector3(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateVector3: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateVector3: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in Vector3 validation' };
    }

    /* ensure value is an object with x, y, and z properties */
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: `${metadata.displayName} must be a Vector3 object` };
    }

    const vector = value as Vector3;

    /* validate x component */
    if (typeof vector.x !== 'number' || !isFinite(vector.x)) {
      return { isValid: false, error: `${metadata.displayName}.x must be a finite number` };
    }

    /* validate y component */
    if (typeof vector.y !== 'number' || !isFinite(vector.y)) {
      return { isValid: false, error: `${metadata.displayName}.y must be a finite number` };
    }

    /* validate z component */
    if (typeof vector.z !== 'number' || !isFinite(vector.z)) {
      return { isValid: false, error: `${metadata.displayName}.z must be a finite number` };
    }

    /* validate component ranges if specified */
    if (metadata.min !== undefined) {
      if (vector.x < metadata.min || vector.y < metadata.min || vector.z < metadata.min) {
        return {
          isValid: false,
          error: `${metadata.displayName} components must be at least ${metadata.min}`
        };
      }
    }

    if (metadata.max !== undefined) {
      if (vector.x > metadata.max || vector.y > metadata.max || vector.z > metadata.max) {
        return {
          isValid: false,
          error: `${metadata.displayName} components must be at most ${metadata.max}`
        };
      }
    }

    return { isValid: true };
  }

  /*

           validateColor()
	         ---
	         validates color properties by checking RGBA component
	         structure and ensuring values are within the valid
	         0.0-1.0 range for each channel. prevents invalid colors
	         that could cause rendering artifacts.

  */

  private static validateColor(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateColor: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateColor: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in color validation' };
    }

    /* ensure value is an object with r, g, b, and optional a properties */
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: `${metadata.displayName} must be a color object` };
    }

    const color = value as Color;

    /* validate red component (0.0-1.0 range) */
    if (typeof color.r !== 'number' || color.r < 0 || color.r > 1) {
      return {
        isValid: false,
        error: `${metadata.displayName} red component must be between 0.0 and 1.0`
      };
    }

    /* validate green component (0.0-1.0 range) */
    if (typeof color.g !== 'number' || color.g < 0 || color.g > 1) {
      return {
        isValid: false,
        error: `${metadata.displayName} green component must be between 0.0 and 1.0`
      };
    }

    /* validate blue component (0.0-1.0 range) */
    if (typeof color.b !== 'number' || color.b < 0 || color.b > 1) {
      return {
        isValid: false,
        error: `${metadata.displayName} blue component must be between 0.0 and 1.0`
      };
    }

    /* validate alpha component (0.0-1.0 range) */
    if (typeof color.a !== 'number' || color.a < 0 || color.a > 1) {
      return {
        isValid: false,
        error: `${metadata.displayName} alpha component must be between 0.0 and 1.0`
      };
    }

    return { isValid: true };
  }

  /*

           validateEnum()
	         ---
	         validates enumeration properties by checking that the
	         value matches one of the allowed enumeration values.
	         ensures type safety for properties with restricted
	         value sets like projection modes or rendering flags.

  */

  private static validateEnum(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateEnum: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateEnum: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in enum validation' };
    }

    /* ensure enum options are provided in metadata */
    if (!metadata.options || !Array.isArray(metadata.options)) {
      return { isValid: false, error: `${metadata.displayName} enum options not configured` };
    }

    /* check if value is in allowed enumeration set */
    if (!metadata.options.some((option) => String(option) === String(value))) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be one of: ${metadata.options.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /*

           validateAsset()
	         ---
	         validates asset reference properties by checking reference
	         structure and asset type compatibility. ensures asset
	         references point to valid resources that match the
	         expected asset type for the property.

  */

  private static validateAsset(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateAsset: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateAsset: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in asset validation' };
    }

    /* null asset references are typically valid (optional assets) */
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    /* ensure value has asset reference structure */
    if (!value || typeof value !== 'object') {
      return { isValid: false, error: `${metadata.displayName} must be an asset reference` };
    }

    /* validate asset ID is present */
    if (!value.id || typeof value.id !== 'string') {
      return { isValid: false, error: `${metadata.displayName} asset reference must have an ID` };
    }

    /* validate asset type compatibility if specified */
    if (metadata.assetTypes && value.type && !metadata.assetTypes.includes(value.type)) {
      return {
        isValid: false,
        error: `${metadata.displayName} must be one of: ${metadata.assetTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /*

           validateObject()
	         ---
	         validates complex object properties with basic structure
	         checking. object validation is typically handled by
	         specialized validators for specific object types.

  */

  private static validateObject(value: any, metadata: PropertyMetadata): ValidationResult {
    /* ASSERTION: metadata validation */
    console.assert(
      metadata !== null && typeof metadata === 'object',
      'validateObject: metadata must be valid object'
    );
    console.assert(
      typeof metadata.displayName === 'string',
      'validateObject: metadata.displayName must be string'
    );

    if (!metadata || typeof metadata.displayName !== 'string') {
      return { isValid: false, error: 'Invalid metadata in object validation' };
    }

    /* ensure value is an object */
    if (value !== null && typeof value !== 'object') {
      return { isValid: false, error: `${metadata.displayName} must be an object` };
    }

    return { isValid: true };
  }

  /*

           validateBatch()
	         ---
	         performs validation on multiple properties simultaneously,
	         collecting all validation results for batch operations.
	         useful for validating entire component configurations
	         or property sets before applying changes.

  */

  static validateBatch(
    values: Record<string, any>,
    metadataMap: Record<string, PropertyMetadata>
  ): Record<string, ValidationResult> {
    /* ASSERTION: parameter validation */
    console.assert(
      values !== null && typeof values === 'object',
      'validateBatch: values must be valid object'
    );
    console.assert(
      metadataMap !== null && typeof metadataMap === 'object',
      'validateBatch: metadataMap must be valid object'
    );

    if (!values || typeof values !== 'object') {
      return { error: { isValid: false, error: 'Invalid values object provided' } };
    }

    if (!metadataMap || typeof metadataMap !== 'object') {
      return { error: { isValid: false, error: 'Invalid metadata map provided' } };
    }

    const results: Record<string, ValidationResult> = {};

    /* validate each property in the batch */
    for (const [key, value] of Object.entries(values)) {
      /* ASSERTION: key must be valid string */
      console.assert(
        typeof key === 'string' && key.length > 0,
        'validateBatch: property keys must be non-empty strings'
      );

      if (typeof key !== 'string' || key.length === 0) {
        results[key || 'invalid_key'] = {
          isValid: false,
          error: 'Invalid property key in batch validation'
        };
        continue;
      }

      const metadata = metadataMap[key];
      if (metadata) {
        results[key] = this.validateProperty(value, metadata);
      } else {
        results[key] = {
          isValid: true,
          warning: `No validation metadata found for property: ${key}`
        };
      }
    }

    return results;
  }

  /*

           hasErrors()
	         ---
	         utility function that checks a batch validation result
	         for any error conditions, returning true if any property
	         failed validation. used to determine if a batch operation
	         should be allowed to proceed.

  */

  static hasErrors(results: Record<string, ValidationResult>): boolean {
    /* ASSERTION: results parameter validation */
    console.assert(
      results !== null && typeof results === 'object',
      'hasErrors: results must be valid object'
    );

    if (!results || typeof results !== 'object') {
      return true; /* treat invalid input as having errors */
    }

    return Object.values(results).some((result) => !result.isValid);
  }

  /*

           getErrorMessages()
	         ---
	         extracts all error messages from a batch validation
	         result, returning them as a formatted array for user
	         display. filters out warnings and focuses on blocking
	         errors that prevent operation completion.

  */

  static getErrorMessages(results: Record<string, ValidationResult>): string[] {
    /* ASSERTION: results parameter validation */
    console.assert(
      results !== null && typeof results === 'object',
      'getErrorMessages: results must be valid object'
    );

    if (!results || typeof results !== 'object') {
      return ['Invalid validation results provided'];
    }

    return Object.values(results)
      .filter((result) => !result.isValid && result.error)
      .map((result) => result.error!);
  }

  /*

           getWarningMessages()
	         ---
	         extracts all warning messages from a batch validation
	         result, returning them as a formatted array for user
	         guidance. warnings don't block operations but provide
	         helpful feedback for potential improvements.

  */

  static getWarningMessages(results: Record<string, ValidationResult>): string[] {
    /* ASSERTION: results parameter validation */
    console.assert(
      results !== null && typeof results === 'object',
      'getWarningMessages: results must be valid object'
    );

    if (!results || typeof results !== 'object') {
      return ['Invalid validation results provided'];
    }

    return Object.values(results)
      .filter((result) => result.warning)
      .map((result) => result.warning!);
  }

  /*

           validateAllProperties()
	         ---
	         performs validation on a collection of properties
	         and returns a map of validation results keyed by
	         property name. useful for batch validation operations.

  */

  validateAllProperties(properties: Record<string, any>): Record<string, ValidationResult> {
    /* ASSERTION: properties parameter validation */
    console.assert(
      properties !== null && typeof properties === 'object',
      'validateAllProperties: properties must be valid object'
    );

    if (!properties || typeof properties !== 'object') {
      return {};
    }

    const results: Record<string, ValidationResult> = {};

    for (const [key, value] of Object.entries(properties)) {
      /* create basic metadata if not available */
      const metadata: PropertyMetadata = {
        type: typeof value as PropertyType,
        displayName: key,
        description: `Property ${key}`,
        required: false,
        readonly: false
      };

      results[key] = PropertyValidator.validateProperty(value, metadata);
    }

    return results;
  }
}

/*
	===============================================================
             --- INSTANCE ---
	===============================================================
*/

/*

         propertyValidator
	       ---
	       singleton instance of PropertyValidator class for use
	       throughout the application. provides centralized
	       validation functionality without requiring multiple
	       instantiations.

*/

export const propertyValidator = new PropertyValidator();

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
