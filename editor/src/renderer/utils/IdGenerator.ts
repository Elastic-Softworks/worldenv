/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - ID Generator Utility
 *
 * Generates unique identifiers for nodes and entities.
 * Provides consistent ID format across the editor.
 */

/**
 * ID generation counter
 */
let idCounter = 0;

/**
 * generateId()
 *
 * Generates unique identifier with timestamp and counter.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (++idCounter).toString(36).padStart(3, '0');
  const random = Math.random().toString(36).substring(2, 6);

  return `${timestamp}-${counter}-${random}`;
}

/**
 * generateEntityId()
 *
 * Generates entity-specific ID with prefix.
 */
export function generateEntityId(type: string = 'entity'): string {
  const baseId = generateId();
  const prefix = type.toLowerCase().replace(/[^a-z0-9]/g, '');

  return `${prefix}_${baseId}`;
}

/**
 * generateComponentId()
 *
 * Generates component-specific ID.
 */
export function generateComponentId(componentType: string): string {
  const baseId = generateId();
  const prefix = componentType.toLowerCase().replace(/[^a-z0-9]/g, '');

  return `comp_${prefix}_${baseId}`;
}

/**
 * isValidId()
 *
 * Validates ID format.
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Basic format validation
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(id) && id.length >= 3 && id.length <= 64;
}

/**
 * sanitizeId()
 *
 * Sanitizes string for use as ID.
 */
export function sanitizeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 32);
}

/**
 * resetIdCounter()
 *
 * Resets ID counter (for testing).
 */
export function resetIdCounter(): void {
  idCounter = 0;
}
