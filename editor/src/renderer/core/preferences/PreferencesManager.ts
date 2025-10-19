/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        PreferencesManager
        ---
        this module manages user preferences and settings for the
        WORLDEDIT editor. it provides persistent storage of user
        preferences with type-safe access and automatic saving.

        preferences are stored in localStorage and include editor
        settings, UI state, keyboard shortcuts, and visual options.
        the system supports default values and validation.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/**
 * User preferences interface
 */
interface UserPreferences {
  /* GENERAL SETTINGS */
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;

  /* UI PREFERENCES */
  panelSizes: {
    hierarchy: number;
    inspector: number;
    assets: number;
    script: number;
  };

  panelVisibility: {
    hierarchy: boolean;
    inspector: boolean;
    assets: boolean;
    script: boolean;
    menuBar: boolean;
    toolbar: boolean;
    statusBar: boolean;
  };

  /* VIEWPORT SETTINGS */
  viewport: {
    renderMode: 'wireframe' | 'shaded';
    showGrid: boolean;
    showGizmos: boolean;
    gridSize: number;
    snapToGrid: boolean;
    transformSpace: 'world' | 'local';
  };

  /* EDITOR BEHAVIOR */
  editor: {
    undoLevels: number;
    confirmDelete: boolean;
    autoFocus: boolean;
    highlightSelection: boolean;
    showLineNumbers: boolean;
    wordWrap: boolean;
    tabSize: number;
  };

  /* KEYBOARD SHORTCUTS */
  shortcuts: {
    enabled: boolean;
    customBindings: Record<string, string>;
  };

  /* PERFORMANCE */
  performance: {
    maxEntities: number;
    enableVSync: boolean;
    frameRateLimit: number;
    lodEnabled: boolean;
  };

  /* ADVANCED */
  advanced: {
    debugMode: boolean;
    showFPS: boolean;
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Preference change listener type
 */
type PreferenceChangeListener = (key: keyof UserPreferences, newValue: any, oldValue: any) => void;

/*
	===============================================================
             --- DEFAULTS ---
	===============================================================
*/

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'auto',
  autoSave: true,
  autoSaveInterval: 300000, // 5 minutes

  panelSizes: {
    hierarchy: 250,
    inspector: 300,
    assets: 250,
    script: 400
  },

  panelVisibility: {
    hierarchy: true,
    inspector: true,
    assets: true,
    script: false,
    menuBar: true,
    toolbar: true,
    statusBar: true
  },

  viewport: {
    renderMode: 'shaded',
    showGrid: true,
    showGizmos: true,
    gridSize: 1.0,
    snapToGrid: false,
    transformSpace: 'world'
  },

  editor: {
    undoLevels: 50,
    confirmDelete: true,
    autoFocus: true,
    highlightSelection: true,
    showLineNumbers: true,
    wordWrap: false,
    tabSize: 4
  },

  shortcuts: {
    enabled: true,
    customBindings: {}
  },

  performance: {
    maxEntities: 10000,
    enableVSync: true,
    frameRateLimit: 60,
    lodEnabled: true
  },

  advanced: {
    debugMode: false,
    showFPS: false,
    enableLogging: true,
    logLevel: 'info'
  }
};

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/**
 * PreferencesManager class
 *
 * Manages user preferences with persistent storage and type safety.
 * Provides change notifications and validation.
 */
export class PreferencesManager {
  private static instance: PreferencesManager | null = null;

  private preferences: UserPreferences;
  private listeners: Set<PreferenceChangeListener> = new Set();
  private saveTimeout: NodeJS.Timeout | null = null;
  private storageKey: string = 'worldedit-preferences';

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PreferencesManager {
    if (!PreferencesManager.instance) {
      PreferencesManager.instance = new PreferencesManager();
    }

    return PreferencesManager.instance;
  }

  /**
   * Get all preferences
   */
  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Get specific preference value
   */
  public get<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
    return this.preferences[key];
  }

  /**
   * Get nested preference value
   */
  public getNested<T>(path: string): T | undefined {
    const keys = path.split('.');
    let current: any = this.preferences;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Set specific preference value
   */
  public set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    const oldValue = this.preferences[key];

    if (this.validatePreference(key, value)) {
      this.preferences[key] = value;
      this.notifyListeners(key, value, oldValue);
      this.scheduleSave();
    } else {
      console.warn('[PREFERENCES] Invalid value for preference:', key, value);
    }
  }

  /**
   * Set nested preference value
   */
  public setNested(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) {
      return;
    }

    let current: any = this.preferences;

    /* NAVIGATE TO PARENT OBJECT */
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return;
      }
    }

    /* SET VALUE */
    if (current && typeof current === 'object') {
      const oldValue = current[lastKey];
      current[lastKey] = value;
      this.notifyListeners(path as keyof UserPreferences, value, oldValue);
      this.scheduleSave();
    }
  }

  /**
   * Update multiple preferences at once
   */
  public update(updates: Partial<UserPreferences>): void {
    const changes: Array<{ key: keyof UserPreferences; newValue: any; oldValue: any }> = [];

    /* COLLECT CHANGES */
    Object.entries(updates).forEach(([key, value]) => {
      const typedKey = key as keyof UserPreferences;
      const oldValue = this.preferences[typedKey];

      if (this.validatePreference(typedKey, value)) {
        (this.preferences as any)[typedKey] = value;
        changes.push({ key: typedKey, newValue: value, oldValue });
      }
    });

    /* NOTIFY LISTENERS */
    changes.forEach(({ key, newValue, oldValue }) => {
      this.notifyListeners(key, newValue, oldValue);
    });

    if (changes.length > 0) {
      this.scheduleSave();
    }
  }

  /**
   * Reset preferences to defaults
   */
  public reset(): void {
    const oldPreferences = { ...this.preferences };
    this.preferences = { ...DEFAULT_PREFERENCES };

    /* NOTIFY ALL CHANGES */
    Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
      const typedKey = key as keyof UserPreferences;
      this.notifyListeners(typedKey, this.preferences[typedKey], oldPreferences[typedKey]);
    });

    this.scheduleSave();
  }

  /**
   * Reset specific preference to default
   */
  public resetToDefault<K extends keyof UserPreferences>(key: K): void {
    const oldValue = this.preferences[key];
    const defaultValue = DEFAULT_PREFERENCES[key];

    this.preferences[key] = defaultValue;
    this.notifyListeners(key, defaultValue, oldValue);
    this.scheduleSave();
  }

  /**
   * Add preference change listener
   */
  public addListener(listener: PreferenceChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove preference change listener
   */
  public removeListener(listener: PreferenceChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Export preferences as JSON
   */
  public exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from JSON
   */
  public importPreferences(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);

      if (this.validatePreferencesObject(imported)) {
        const oldPreferences = { ...this.preferences };
        this.preferences = { ...DEFAULT_PREFERENCES, ...imported };

        /* NOTIFY ALL CHANGES */
        Object.keys(this.preferences).forEach((key) => {
          const typedKey = key as keyof UserPreferences;
          if (oldPreferences[typedKey] !== this.preferences[typedKey]) {
            this.notifyListeners(typedKey, this.preferences[typedKey], oldPreferences[typedKey]);
          }
        });

        this.scheduleSave();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[PREFERENCES] Failed to import preferences:', error);
      return false;
    }
  }

  /*
	===============================================================
             --- PRIVATE ---
	===============================================================
*/

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (this.validatePreferencesObject(parsed)) {
          return { ...DEFAULT_PREFERENCES, ...parsed };
        }
      }
    } catch (error) {
      console.warn('[PREFERENCES] Failed to load preferences, using defaults:', error);
    }

    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      const serialized = JSON.stringify(this.preferences);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('[PREFERENCES] Failed to save preferences:', error);
    }
  }

  /**
   * Schedule save operation (debounced)
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.savePreferences();
      this.saveTimeout = null;
    }, 500);
  }

  /**
   * Notify preference change listeners
   */
  private notifyListeners(key: keyof UserPreferences, newValue: any, oldValue: any): void {
    this.listeners.forEach((listener) => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        console.error('[PREFERENCES] Listener error:', error);
      }
    });
  }

  /**
   * Validate single preference
   */
  private validatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): boolean {
    /* TYPE CHECK */
    const defaultValue = DEFAULT_PREFERENCES[key];
    if (typeof value !== typeof defaultValue) {
      return false;
    }

    /* SPECIFIC VALIDATIONS */
    switch (key) {
      case 'theme':
        return ['light', 'dark', 'auto'].includes(value as string);

      case 'autoSaveInterval':
        return typeof value === 'number' && value >= 10000; // min 10 seconds

      case 'advanced':
        const advanced = value as UserPreferences['advanced'];
        return ['error', 'warn', 'info', 'debug'].includes(advanced.logLevel);

      default:
        return true;
    }
  }

  /**
   * Validate entire preferences object
   */
  private validatePreferencesObject(obj: any): obj is Partial<UserPreferences> {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    /* CHECK EACH KNOWN PREFERENCE */
    for (const key in obj) {
      if (key in DEFAULT_PREFERENCES) {
        const typedKey = key as keyof UserPreferences;
        if (!this.validatePreference(typedKey, obj[key])) {
          return false;
        }
      }
    }

    return true;
  }
}

/* EXPORT SINGLETON INSTANCE */
export const preferencesManager = PreferencesManager.getInstance();

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export type { UserPreferences, PreferenceChangeListener };

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
