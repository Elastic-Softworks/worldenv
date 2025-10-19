/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             AUTO-SAVE MODULE - WORLDENV EDITOR
	====================================================================
*/

/*

	automatic project saving provides safety net for user work.
	this module implements interval-based saving with configurable
	options and smart triggers like focus-loss detection.

	the system prevents data loss during crashes or unexpected
	shutdowns by maintaining recent saves. save operations are
	throttled to prevent excessive disk I/O while ensuring
	modifications are preserved.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import { logger } from './logger'; /* LOGGING SYSTEM */
import { projectManager } from './project'; /* PROJECT STATE MANAGER */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         AutoSaveOptions
	       ---
	       configuration structure for auto-save behavior.

	       enabled controls whether auto-saving is active.
	       interval sets millisecond delay between save attempts.
	       onFocusLost triggers saves when window loses focus.

*/

interface AutoSaveOptions {
  enabled: boolean /* MASTER ENABLE/DISABLE SWITCH */;
  interval: number /* MILLISECONDS BETWEEN SAVE ATTEMPTS */;
  onFocusLost: boolean /* SAVE WHEN WINDOW LOSES FOCUS */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         AutoSave
	       ---
	       main auto-save management class.

	       handles timer-based saving with smart throttling to prevent
	       excessive saves. monitors project modification state and
	       only saves when changes exist. provides focus-loss saving
	       for additional data protection.

	       saves are throttled with minimum 5-second intervals to
	       prevent disk thrashing while maintaining responsiveness.

*/

class AutoSave {
  private intervalTimer: NodeJS.Timeout | null; /* SAVE INTERVAL TIMER */
  private options: AutoSaveOptions; /* CONFIGURATION OPTIONS */
  private lastSaveTime: number; /* LAST SAVE TIMESTAMP */
  private saveInProgress: boolean; /* SAVE OPERATION FLAG */

  constructor() {
    this.intervalTimer = null;
    this.lastSaveTime = 0;
    this.saveInProgress = false;

    /* default configuration provides reasonable safety without
       being overly aggressive with disk writes */
    this.options = {
      enabled: true,
      interval: 300000 /* 5 MINUTES DEFAULT */,
      onFocusLost: true
    };
  }

  /*

           start()
	         ---
	         initiates auto-save timer with configured interval.

	         stops any existing timer first to prevent multiple
	         timers running simultaneously. logs startup for
	         debugging purposes.

  */

  public start(): void {
    if (!this.options.enabled) {
      logger.debug('AUTOSAVE', 'Auto-save disabled');
      return;
    }

    if (this.intervalTimer) {
      this.stop();
    }

    /* set up interval timer that triggers save attempts.
       actual saves only occur if project is modified */
    this.intervalTimer = setInterval(() => {
      this.performAutoSave();
    }, this.options.interval);

    logger.info('AUTOSAVE', 'Auto-save started', {
      interval: this.options.interval
    });
  }

  /*

           stop()
	         ---
	         halts auto-save timer and cleans up resources.

	         safe to call multiple times - checks for existing
	         timer before attempting to clear it.

  */

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;

      logger.debug('AUTOSAVE', 'Auto-save timer stopped');
    }
  }

  /*

           setEnabled()
	         ---
	         enables or disables auto-save functionality.

	         when enabling, starts timer immediately. when disabling,
	         stops timer to prevent unwanted saves.

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

  /*

           setInterval()
	         ---
	         updates save interval with minimum threshold enforcement.

	         enforces 10-second minimum to prevent excessive disk
	         activity. restarts timer if currently running to
	         apply new interval immediately.

  */

  public setInterval(interval: number): void {
    if (interval < 10000) {
      logger.warn('AUTOSAVE', 'Auto-save interval too short, using minimum');
      interval = 10000; /* ENFORCE 10-SECOND MINIMUM */
    }

    this.options.interval = interval;

    /* restart timer with new interval if currently active */
    if (this.intervalTimer) {
      this.start();
    }

    logger.info('AUTOSAVE', 'Auto-save interval updated', { interval });
  }

  /*

           setOnFocusLost()
	         ---
	         configures whether to save when window loses focus.

	         focus-loss saving provides additional protection
	         against data loss when user switches applications.

  */

  public setOnFocusLost(enabled: boolean): void {
    this.options.onFocusLost = enabled;
  }

  /*

           getOptions()
	         ---
	         returns copy of current configuration options.

	         provides shallow copy to prevent external modification
	         of internal state.

  */

  public getOptions(): AutoSaveOptions {
    return { ...this.options };
  }

  /*

           saveNow()
	         ---
	         triggers immediate save operation bypassing timer.

	         useful for manual save requests or critical moments
	         where immediate persistence is required.

  */

  public async saveNow(): Promise<void> {
    await this.performAutoSave();
  }

  /*

           onWindowBlur()
	         ---
	         handles window focus loss events.

	         called by window manager when application loses focus.
	         saves project if focus-loss saving is enabled.

  */

  public async onWindowBlur(): Promise<void> {
    if (!this.options.onFocusLost) {
      return;
    }

    await this.performAutoSave();
  }

  /*

           performAutoSave()
	         ---
	         core save logic with intelligent conditions checking.

	         implements several safety checks:
	         - prevents concurrent saves with progress flag
	         - only saves if project is open and modified
	         - throttles saves with minimum 5-second intervals

	         this approach prevents disk thrashing while ensuring
	         user work is preserved regularly.

  */

  private async performAutoSave(): Promise<void> {
    /* prevent concurrent save operations which could
       cause corruption or unnecessary resource usage */
    if (this.saveInProgress) {
      logger.debug('AUTOSAVE', 'Save already in progress, skipping');
      return;
    }

    /* no point saving if no project is open */
    if (!projectManager.isProjectOpen()) {
      return;
    }

    /* save only when changes exist to avoid unnecessary
       disk writes and preserve file timestamps */
    if (!projectManager.isProjectModified()) {
      return;
    }

    /* throttle saves to prevent excessive disk activity
       during rapid editing sessions */
    const timeSinceLastSave = Date.now() - this.lastSaveTime;

    if (timeSinceLastSave < 5000) {
      return;
    }

    this.saveInProgress = true;

    try {
      logger.info('AUTOSAVE', 'Auto-saving project');

      await projectManager.saveProject();

      this.lastSaveTime = Date.now();

      logger.info('AUTOSAVE', 'Auto-save completed');
    } catch (error) {
      /* log error but don't throw - auto-save failures
         should not crash the application */
      logger.error('AUTOSAVE', 'Auto-save failed', { error });
    } finally {
      this.saveInProgress = false;
    }
  }

  /*

           getLastSaveTime()
	         ---
	         returns timestamp of most recent successful save.

	         useful for UI indicators showing save status
	         and debugging save timing issues.

  */

  public getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /*

           isSaveInProgress()
	         ---
	         indicates whether save operation is currently active.

	         helps prevent UI actions that might interfere
	         with ongoing save operations.

  */

  public isSaveInProgress(): boolean {
    return this.saveInProgress;
  }
}

/* singleton instance for application-wide auto-save management */
export const autoSave = new AutoSave();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
