/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        Preferences Module Exports
        ---
        this module exports all preferences-related functionality
        including the preferences manager and related types.

*/

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export {
  PreferencesManager,
  preferencesManager
} from './PreferencesManager';

export type {
  UserPreferences,
  PreferenceChangeListener
} from './PreferencesManager';

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
