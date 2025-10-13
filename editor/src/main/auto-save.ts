/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Auto-Save Module
 *
 * Automatic project saving at configurable intervals.
 * Monitors project modification state and triggers saves.
 */

import { logger } from './logger';
import { projectManager } from './project';

interface AutoSaveOptions {
  enabled: boolean;
  interval: number;
  on_focus_lost: boolean;
}

class AutoSave {

  private interval_timer: NodeJS.Timeout | null;
  private options: AutoSaveOptions;
  private last_save_time: number;
  private save_in_progress: boolean;

  constructor() {

    this.interval_timer = null;
    this.options = {
      enabled: true,
      interval: 300000,
      on_focus_lost: true
    };
    this.last_save_time = 0;
    this.save_in_progress = false;

  }

  /**
   * start()
   *
   * Starts auto-save timer.
   */
  public start(): void {

    if (!this.options.enabled) {

      logger.debug('AUTOSAVE', 'Auto-save disabled');
      return;

    }

    if (this.interval_timer) {

      this.stop();

    }

    this.interval_timer = setInterval(() => {

      this.performAutoSave();

    }, this.options.interval);

    logger.info('AUTOSAVE', 'Auto-save started', {
      interval: this.options.interval
    });

  }

  /**
   * stop()
   *
   * Stops auto-save timer.
   */
  public stop(): void {

    if (this.interval_timer) {

      clearInterval(this.interval_timer);
      this.interval_timer = null;

      logger.info('AUTOSAVE', 'Auto-save stopped');

    }

  }

  /**
   * setEnabled()
   *
   * Enables or disables auto-save.
   */
  public setEnabled(enabled: boolean): void {

    this.options.enabled = enabled;

    if (enabled) {

      this.start();

    } else {

      this.stop();

    }

    logger.info('AUTOSAVE', `Auto-save ${enabled ? 'enabled' : 'disabled'}`);

  }

  /**
   * setInterval()
   *
   * Sets auto-save interval in milliseconds.
   */
  public setInterval(interval: number): void {

    if (interval < 10000) {

      logger.warn('AUTOSAVE', 'Auto-save interval too short, using minimum');
      interval = 10000;

    }

    this.options.interval = interval;

    if (this.interval_timer) {

      this.start();

    }

    logger.info('AUTOSAVE', 'Auto-save interval updated', { interval });

  }

  /**
   * setOnFocusLost()
   *
   * Sets whether to save when window loses focus.
   */
  public setOnFocusLost(enabled: boolean): void {

    this.options.on_focus_lost = enabled;

  }

  /**
   * getOptions()
   *
   * Returns current auto-save options.
   */
  public getOptions(): AutoSaveOptions {

    return { ...this.options };

  }

  /**
   * saveNow()
   *
   * Triggers immediate save if project is modified.
   */
  public async saveNow(): Promise<void> {

    await this.performAutoSave();

  }

  /**
   * onWindowBlur()
   *
   * Called when window loses focus.
   * Saves if on_focus_lost option is enabled.
   */
  public async onWindowBlur(): Promise<void> {

    if (!this.options.on_focus_lost) {

      return;

    }

    await this.performAutoSave();

  }

  /**
   * performAutoSave()
   *
   * Performs auto-save if conditions are met.
   */
  private async performAutoSave(): Promise<void> {

    if (this.save_in_progress) {

      logger.debug('AUTOSAVE', 'Save already in progress, skipping');
      return;

    }

    if (!projectManager.isProjectOpen()) {

      return;

    }

    if (!projectManager.isProjectModified()) {

      return;

    }

    const time_since_last_save = Date.now() - this.last_save_time;

    if (time_since_last_save < 5000) {

      return;

    }

    this.save_in_progress = true;

    try {

      logger.info('AUTOSAVE', 'Auto-saving project');

      await projectManager.saveProject();

      this.last_save_time = Date.now();

      logger.info('AUTOSAVE', 'Auto-save completed');

    } catch (error) {

      logger.error('AUTOSAVE', 'Auto-save failed', { error });

    } finally {

      this.save_in_progress = false;

    }

  }

  /**
   * getLastSaveTime()
   *
   * Returns timestamp of last successful save.
   */
  public getLastSaveTime(): number {

    return this.last_save_time;

  }

  /**
   * isSaveInProgress()
   *
   * Returns true if save is currently in progress.
   */
  public isSaveInProgress(): boolean {

    return this.save_in_progress;

  }

}

export const autoSave = new AutoSave();
