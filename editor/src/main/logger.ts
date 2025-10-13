/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Logger Module
 *
 * Structured logging system with level filtering and file output.
 * Logs written to console and optionally to file in user data directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

class Logger {

  private log_file_path: string | null;
  private min_level: LogLevel;
  private log_buffer: LogEntry[];
  private flush_interval: NodeJS.Timeout | null;
  private max_buffer_size: number;

  constructor() {

    this.log_file_path = null;
    this.min_level = LogLevel.INFO;
    this.log_buffer = [];
    this.flush_interval = null;
    this.max_buffer_size = 100;

  }

  /**
   * initialize()
   *
   * Sets up log file path and starts periodic flush.
   * Called after app ready event.
   */
  public initialize(): void {

    const user_data = app.getPath('userData');
    const log_dir = path.join(user_data, 'logs');

    if (!fs.existsSync(log_dir)) {

      fs.mkdirSync(log_dir, { recursive: true });

    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const log_filename = `worldedit-${timestamp}.log`;

    this.log_file_path = path.join(log_dir, log_filename);

    this.flush_interval = setInterval(() => {

      this.flush();

    }, 5000);

    this.info('LOGGER', 'Logger initialized', { path: this.log_file_path });

  }

  /**
   * shutdown()
   *
   * Flushes remaining logs and stops periodic flush.
   */
  public shutdown(): void {

    if (this.flush_interval) {

      clearInterval(this.flush_interval);
      this.flush_interval = null;

    }

    this.flush();

  }

  /**
   * setLevel()
   *
   * Sets minimum log level for output.
   */
  public setLevel(level: LogLevel): void {

    this.min_level = level;

  }

  /**
   * debug()
   *
   * Logs debug message.
   */
  public debug(category: string, message: string, data?: unknown): void {

    this.log(LogLevel.DEBUG, category, message, data);

  }

  /**
   * info()
   *
   * Logs info message.
   */
  public info(category: string, message: string, data?: unknown): void {

    this.log(LogLevel.INFO, category, message, data);

  }

  /**
   * warn()
   *
   * Logs warning message.
   */
  public warn(category: string, message: string, data?: unknown): void {

    this.log(LogLevel.WARN, category, message, data);

  }

  /**
   * error()
   *
   * Logs error message.
   */
  public error(category: string, message: string, data?: unknown): void {

    this.log(LogLevel.ERROR, category, message, data);

  }

  /**
   * fatal()
   *
   * Logs fatal error message.
   */
  public fatal(category: string, message: string, data?: unknown): void {

    this.log(LogLevel.FATAL, category, message, data);
    this.flush();

  }

  /**
   * log()
   *
   * Internal log method. Formats and buffers log entry.
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown
  ): void {

    if (level < this.min_level) {

      return;

    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level: level,
      category: category,
      message: message,
      data: data
    };

    this.log_buffer.push(entry);

    this.writeToConsole(entry);

    if (this.log_buffer.length >= this.max_buffer_size) {

      this.flush();

    }

  }

  /**
   * writeToConsole()
   *
   * Writes log entry to console with appropriate formatting.
   */
  private writeToConsole(entry: LogEntry): void {

    const timestamp = new Date(entry.timestamp).toISOString();
    const level_name = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${level_name}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    if (entry.data !== undefined) {

      switch (entry.level) {

        case LogLevel.DEBUG:
          console.debug(message, entry.data);
          break;

        case LogLevel.INFO:
          console.info(message, entry.data);
          break;

        case LogLevel.WARN:
          console.warn(message, entry.data);
          break;

        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(message, entry.data);
          break;

      }

    } else {

      switch (entry.level) {

        case LogLevel.DEBUG:
          console.debug(message);
          break;

        case LogLevel.INFO:
          console.info(message);
          break;

        case LogLevel.WARN:
          console.warn(message);
          break;

        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(message);
          break;

      }

    }

  }

  /**
   * flush()
   *
   * Writes buffered log entries to file.
   */
  private flush(): void {

    if (this.log_buffer.length === 0 || !this.log_file_path) {

      return;

    }

    const lines: string[] = [];

    for (const entry of this.log_buffer) {

      const timestamp = new Date(entry.timestamp).toISOString();
      const level_name = LogLevel[entry.level];
      let line = `[${timestamp}] [${level_name}] [${entry.category}] ${entry.message}`;

      if (entry.data !== undefined) {

        try {

          const data_str = JSON.stringify(entry.data);
          line += ` ${data_str}`;

        } catch (error) {

          line += ` [UNSERIALIZABLE DATA]`;

        }

      }

      lines.push(line);

    }

    const content = lines.join('\n') + '\n';

    try {

      fs.appendFileSync(this.log_file_path, content, { encoding: 'utf8' });

    } catch (error) {

      console.error('[LOGGER] Failed to write log file:', error);

    }

    this.log_buffer = [];

  }

}

export const logger = new Logger();
