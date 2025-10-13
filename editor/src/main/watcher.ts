/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - File System Watcher
 *
 * Monitors project directory for file system changes.
 * Notifies renderer process of file additions, modifications, and deletions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

type WatchEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

interface WatchEvent {
  type: WatchEventType;
  path: string;
  stats?: fs.Stats;
}

type WatchListener = (event: WatchEvent) => void;

class FileWatcher {
  private watchers: Map<string, fs.FSWatcher>;
  private listeners: Set<WatchListener>;
  private ignore_patterns: RegExp[];
  private debounce_timers: Map<string, NodeJS.Timeout>;
  private debounce_delay: number;

  constructor() {
    this.watchers = new Map();
    this.listeners = new Set();
    this.ignore_patterns = [
      /node_modules/,
      /\.git/,
      /build/,
      /dist/,
      /\.DS_Store/,
      /Thumbs\.db/,
      /~$/,
      /\.tmp$/,
      /\.swp$/
    ];
    this.debounce_timers = new Map();
    this.debounce_delay = 100;
  }

  /**
   * watch()
   *
   * Starts watching directory for changes.
   * Recursively watches subdirectories.
   */
  public watch(dir_path: string): void {
    try {
      if (this.watchers.has(dir_path)) {
        logger.warn('WATCHER', 'Directory already being watched', {
          path: dir_path
        });

        return;
      }

      if (this.shouldIgnore(dir_path)) {
        return;
      }

      const watcher = fs.watch(dir_path, { recursive: true }, (event_type, filename) => {
        if (!filename) {
          return;
        }

        const full_path = path.join(dir_path, filename);

        if (this.shouldIgnore(full_path)) {
          return;
        }

        this.handleFileSystemEvent(event_type, full_path);
      });

      watcher.on('error', (error) => {
        logger.error('WATCHER', 'Watcher error', {
          path: dir_path,
          error: error
        });
      });

      this.watchers.set(dir_path, watcher);

      logger.info('WATCHER', 'Started watching directory', {
        path: dir_path
      });
    } catch (error) {
      logger.error('WATCHER', 'Failed to watch directory', {
        path: dir_path,
        error: error
      });
    }
  }

  /**
   * unwatch()
   *
   * Stops watching directory.
   */
  public unwatch(dir_path: string): void {
    const watcher = this.watchers.get(dir_path);

    if (!watcher) {
      return;
    }

    try {
      watcher.close();
      this.watchers.delete(dir_path);

      logger.info('WATCHER', 'Stopped watching directory', {
        path: dir_path
      });
    } catch (error) {
      logger.error('WATCHER', 'Failed to unwatch directory', {
        path: dir_path,
        error: error
      });
    }
  }

  /**
   * unwatchAll()
   *
   * Stops watching all directories.
   */
  public unwatchAll(): void {
    const paths = Array.from(this.watchers.keys());

    for (const dir_path of paths) {
      this.unwatch(dir_path);
    }

    for (const timer of this.debounce_timers.values()) {
      clearTimeout(timer);
    }

    this.debounce_timers.clear();
  }

  /**
   * addListener()
   *
   * Adds event listener for file system changes.
   */
  public addListener(listener: WatchListener): void {
    this.listeners.add(listener);
  }

  /**
   * removeListener()
   *
   * Removes event listener.
   */
  public removeListener(listener: WatchListener): void {
    this.listeners.delete(listener);
  }

  /**
   * addIgnorePattern()
   *
   * Adds pattern to ignore list.
   */
  public addIgnorePattern(pattern: RegExp): void {
    this.ignore_patterns.push(pattern);
  }

  /**
   * handleFileSystemEvent()
   *
   * Handles file system event from fs.watch.
   * Debounces rapid events and determines event type.
   */
  private handleFileSystemEvent(_event_type: string, file_path: string): void {
    const existing_timer = this.debounce_timers.get(file_path);

    if (existing_timer) {
      clearTimeout(existing_timer);
    }

    const timer = setTimeout(() => {
      this.debounce_timers.delete(file_path);
      this.processFileSystemEvent(file_path);
    }, this.debounce_delay);

    this.debounce_timers.set(file_path, timer);
  }

  /**
   * processFileSystemEvent()
   *
   * Processes debounced file system event.
   * Determines if file was added, changed, or deleted.
   */
  private processFileSystemEvent(file_path: string): void {
    try {
      fs.stat(file_path, (error, stats) => {
        let event_type: WatchEventType;

        if (error) {
          if (error.code === 'ENOENT') {
            event_type = 'unlink';
            this.emitEvent({ type: event_type, path: file_path });
          } else {
            logger.error('WATCHER', 'Failed to stat file', {
              path: file_path,
              error: error
            });
          }

          return;
        }

        if (stats.isDirectory()) {
          event_type = 'addDir';
        } else if (stats.isFile()) {
          event_type = 'add';
        } else {
          return;
        }

        this.emitEvent({
          type: event_type,
          path: file_path,
          stats: stats
        });
      });
    } catch (error) {
      logger.error('WATCHER', 'Failed to process file system event', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * emitEvent()
   *
   * Emits watch event to all listeners.
   */
  private emitEvent(event: WatchEvent): void {
    logger.debug('WATCHER', 'File system event', event);

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error('WATCHER', 'Listener error', {
          event: event,
          error: error
        });
      }
    }
  }

  /**
   * shouldIgnore()
   *
   * Checks if path should be ignored based on patterns.
   */
  private shouldIgnore(file_path: string): boolean {
    for (const pattern of this.ignore_patterns) {
      if (pattern.test(file_path)) {
        return true;
      }
    }

    return false;
  }
}

export const fileWatcher = new FileWatcher();
