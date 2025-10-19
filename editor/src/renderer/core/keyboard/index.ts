/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        Keyboard Module Exports
        ---
        this module exports all keyboard-related functionality
        including the keyboard shortcut manager and related types.

*/

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export {
  KeyboardShortcutManager,
  keyboardShortcutManager,
  ShortcutCategory,
  ShortcutContext
} from './KeyboardShortcutManager';

export type { KeyboardShortcut } from './KeyboardShortcutManager';

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
