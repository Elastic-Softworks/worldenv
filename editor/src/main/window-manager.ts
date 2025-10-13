/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Window Manager
 *
 * Manages editor window state persistence and lifecycle.
 * Saves and restores window position, size, and display state.
 * Supports multiple editor windows with unique identifiers.
 */

import { BrowserWindow, screen } from 'electron';
import Store from 'electron-store';
import { logger } from './logger';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowStateData {
  bounds: WindowBounds;
  maximized: boolean;
  fullscreen: boolean;
  display_id: number;
}

interface StoreSchema {
  window_states: {
    [key: string]: WindowStateData;
  };
}

class WindowManager {
  private store: Store<StoreSchema>;
  private windows: Map<string, BrowserWindow>;
  private save_timers: Map<string, NodeJS.Timeout>;
  private save_delay: number;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'window-state',
      defaults: {
        window_states: {}
      }
    });

    this.windows = new Map();
    this.save_timers = new Map();
    this.save_delay = 500;
  }

  /**
   * createWindow()
   *
   * Creates window with persisted state or defaults.
   * Returns window instance and unique identifier.
   */
  public createWindow(
    id: string,
    options: Electron.BrowserWindowConstructorOptions = {}
  ): BrowserWindow {
    const state = this.loadWindowState(id);
    const bounds = this.ensureValidBounds(state.bounds);

    const window_options: Electron.BrowserWindowConstructorOptions = {
      ...options,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      show: false
    };

    const window = new BrowserWindow(window_options);

    if (state.maximized) {
      window.maximize();
    }

    if (state.fullscreen) {
      window.setFullScreen(true);
    }

    this.windows.set(id, window);
    this.setupWindowListeners(id, window);

    logger.info('WINDOW', `Window created: ${id}`, { bounds });

    return window;
  }

  /**
   * getWindow()
   *
   * Returns window instance by identifier.
   */
  public getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  /**
   * getAllWindows()
   *
   * Returns all managed windows.
   */
  public getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  /**
   * destroyWindow()
   *
   * Destroys window and removes from tracking.
   */
  public destroyWindow(id: string): void {
    const window = this.windows.get(id);

    if (window && !window.isDestroyed()) {
      window.destroy();
    }

    this.windows.delete(id);

    const timer = this.save_timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.save_timers.delete(id);
    }

    logger.info('WINDOW', `Window destroyed: ${id}`);
  }

  /**
   * destroyAll()
   *
   * Destroys all managed windows.
   */
  public destroyAll(): void {
    const window_ids = Array.from(this.windows.keys());

    for (const id of window_ids) {
      this.destroyWindow(id);
    }
  }

  /**
   * loadWindowState()
   *
   * Loads persisted window state or returns defaults.
   */
  private loadWindowState(id: string): WindowStateData {
    const states = this.store.get('window_states', {});
    const state = states[id];

    if (state) {
      logger.debug('WINDOW', `Loaded window state: ${id}`, state);
      return state;
    }

    const primary = screen.getPrimaryDisplay();
    const display_bounds = primary.workAreaSize;

    const default_width = 1280;
    const default_height = 720;

    const default_state: WindowStateData = {
      bounds: {
        x: Math.floor((display_bounds.width - default_width) / 2),
        y: Math.floor((display_bounds.height - default_height) / 2),
        width: default_width,
        height: default_height
      },
      maximized: false,
      fullscreen: false,
      display_id: primary.id
    };

    logger.debug('WINDOW', `Using default window state: ${id}`, default_state);

    return default_state;
  }

  /**
   * saveWindowState()
   *
   * Persists window state to disk.
   * Debounced to avoid excessive writes.
   */
  private saveWindowState(id: string, window: BrowserWindow): void {
    const existing_timer = this.save_timers.get(id);

    if (existing_timer) {
      clearTimeout(existing_timer);
    }

    const timer = setTimeout(() => {
      if (window.isDestroyed()) {
        return;
      }

      const bounds = window.getBounds();
      const maximized = window.isMaximized();
      const fullscreen = window.isFullScreen();
      const display = screen.getDisplayMatching(bounds);

      const state: WindowStateData = {
        bounds: bounds,
        maximized: maximized,
        fullscreen: fullscreen,
        display_id: display.id
      };

      const states = this.store.get('window_states', {});
      states[id] = state;
      this.store.set('window_states', states);

      logger.debug('WINDOW', `Saved window state: ${id}`, state);
    }, this.save_delay);

    this.save_timers.set(id, timer);
  }

  /**
   * ensureValidBounds()
   *
   * Validates window bounds fit within available displays.
   * Adjusts bounds if window would be off-screen.
   */
  private ensureValidBounds(bounds: WindowBounds): WindowBounds {
    const displays = screen.getAllDisplays();
    let visible = false;

    for (const display of displays) {
      const area = display.workArea;

      const is_x_visible = bounds.x >= area.x && bounds.x < area.x + area.width;

      const is_y_visible = bounds.y >= area.y && bounds.y < area.y + area.height;

      if (is_x_visible && is_y_visible) {
        visible = true;
        break;
      }
    }

    if (!visible) {
      const primary = screen.getPrimaryDisplay();
      const area = primary.workAreaSize;

      bounds.x = Math.floor((area.width - bounds.width) / 2);
      bounds.y = Math.floor((area.height - bounds.height) / 2);

      logger.warn('WINDOW', 'Window bounds adjusted to primary display', bounds);
    }

    const min_width = 800;
    const min_height = 600;

    if (bounds.width < min_width) {
      bounds.width = min_width;
    }

    if (bounds.height < min_height) {
      bounds.height = min_height;
    }

    return bounds;
  }

  /**
   * setupWindowListeners()
   *
   * Attaches event listeners for state tracking.
   */
  private setupWindowListeners(id: string, window: BrowserWindow): void {
    window.on('resize', () => {
      this.saveWindowState(id, window);
    });

    window.on('move', () => {
      this.saveWindowState(id, window);
    });

    window.on('maximize', () => {
      this.saveWindowState(id, window);
    });

    window.on('unmaximize', () => {
      this.saveWindowState(id, window);
    });

    window.on('enter-full-screen', () => {
      this.saveWindowState(id, window);
    });

    window.on('leave-full-screen', () => {
      this.saveWindowState(id, window);
    });

    window.on('closed', () => {
      this.windows.delete(id);

      const timer = this.save_timers.get(id);

      if (timer) {
        clearTimeout(timer);
        this.save_timers.delete(id);
      }

      logger.info('WINDOW', `Window closed: ${id}`);
    });
  }
}

export const windowManager = new WindowManager();
