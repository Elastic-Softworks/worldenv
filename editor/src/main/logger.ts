/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             LOGGER MODULE - WORLDENV EDITOR
	====================================================================
*/

/*

	structured logging system with level filtering and persistent storage
	for debugging and monitoring worldenv editor operations.

	this module provides comprehensive logging capabilities with buffered
	file output, console integration, and configurable log levels. the
	system automatically manages log file creation in the user data
	directory and provides periodic flushing to prevent data loss.

	logging features:
	- hierarchical log levels (DEBUG, INFO, WARN, ERROR, FATAL)
	- automatic file rotation with timestamps
	- buffered output for performance
	- structured data logging with JSON serialization
	- console output with appropriate formatting

	the logger uses buffering to minimize disk I/O impact while ensuring
	critical messages (FATAL level) are immediately flushed to storage.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as fs from 'fs'; /* FILE SYSTEM OPERATIONS */
import * as path from 'path'; /* PATH MANIPULATION */
import { app } from 'electron'; /* ELECTRON APP API */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         LogLevel
	       ---
	       hierarchical logging levels for message filtering.

	       levels increase in severity from DEBUG to FATAL.
	       system filters messages below configured minimum
	       level to control output verbosity.

*/

export enum LogLevel {
  DEBUG = 0 /* DETAILED DEBUGGING INFORMATION */,
  INFO = 1 /* GENERAL INFORMATION MESSAGES */,
  WARN = 2 /* WARNING CONDITIONS */,
  ERROR = 3 /* ERROR CONDITIONS */,
  FATAL = 4 /* FATAL ERROR CONDITIONS */
}

/*

         LogEntry
	       ---
	       structured log entry with metadata and optional data.

	       contains timestamp, severity level, category for
	       organization, human-readable message, and optional
	       structured data for debugging context.

*/

interface LogEntry {
  timestamp: number /* UNIX TIMESTAMP (MS) */;
  level: LogLevel /* MESSAGE SEVERITY LEVEL */;
  category: string /* LOGGING CATEGORY */;
  message: string /* HUMAN-READABLE MESSAGE */;
  data?: unknown /* OPTIONAL STRUCTURED DATA */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         Logger
	       ---
	       centralized logging system with buffered file output.

	       manages log file creation, buffering, and periodic flushing
	       to ensure performance while maintaining data persistence.
	       provides methods for each log level with consistent
	       formatting and filtering.

	       the system automatically creates timestamped log files
	       in the user data directory and handles log rotation.
	       buffering prevents excessive disk I/O during high-volume
	       logging periods.

*/

class Logger {
  private log_file_path: string | null; /* LOG FILE PATH */
  private min_level: LogLevel; /* MINIMUM LOG LEVEL */
  private log_buffer: LogEntry[]; /* BUFFERED LOG ENTRIES */
  private flush_interval: NodeJS.Timeout | null; /* FLUSH TIMER */
  private max_buffer_size: number; /* BUFFER SIZE LIMIT */

  constructor() {
    this.log_file_path = null;
    this.min_level = LogLevel.INFO; /* DEFAULT TO INFO LEVEL */
    this.log_buffer = [];
    this.flush_interval = null;
    this.max_buffer_size = 100; /* FLUSH AFTER 100 ENTRIES */
  }

  /*

           initialize()
	         ---
	         sets up log file path and starts periodic flush timer.

	         creates log directory in user data folder and generates
	         timestamped log file name. starts background timer for
	         periodic buffer flushing every 5 seconds.

	         must be called after Electron app ready event when
	         user data path becomes available.

  */

  public initialize(): void {
    const user_data = app.getPath('userData');
    const log_dir = path.join(user_data, 'logs');

    /* ensure log directory exists for file output */
    if (!fs.existsSync(log_dir)) {
      fs.mkdirSync(log_dir, { recursive: true });
    }

    /* create timestamped log file name to avoid conflicts */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const log_filename = `worldedit-${timestamp}.log`;

    this.log_file_path = path.join(log_dir, log_filename);

    /* start periodic flush to ensure log data persistence */
    this.flush_interval = setInterval(() => {
      this.flush();
    }, 5000 /* FLUSH EVERY 5 SECONDS */);

    this.info('LOGGER', 'Logger initialized', { path: this.log_file_path });
  }

  /*

           shutdown()
	         ---
	         gracefully shuts down logger with final flush.

	         stops periodic flush timer and performs final
	         buffer flush to ensure no log data is lost
	         during application shutdown.

  */

  public shutdown(): void {
    if (this.flush_interval) {
      clearInterval(this.flush_interval);
      this.flush_interval = null;
    }

    /* final flush to ensure no data loss on shutdown */
    this.flush();
  }

  /*

           setLevel()
	         ---
	         configures minimum log level for output filtering.

	         messages below this level are ignored to control
	         output verbosity. useful for debugging vs production
	         configurations.

  */

  public setLevel(level: LogLevel): void {
    this.min_level = level;
  }

  /*

           debug()
	         ---
	         logs detailed debugging information.

	         used for verbose diagnostic output during development
	         and troubleshooting. typically filtered out in
	         production builds.

  */

  public debug(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /*

           info()
	         ---
	         logs general informational messages.

	         used for normal operation status, configuration
	         changes, and significant events. default minimum
	         level for production systems.

  */

  public info(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /*

           warn()
	         ---
	         logs warning conditions that need attention.

	         indicates potentially problematic situations
	         that don't prevent operation but may require
	         investigation or user action.

  */

  public warn(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /*

           error()
	         ---
	         logs error conditions requiring attention.

	         indicates operation failures, exceptions, or
	         other problems that affect functionality but
	         don't necessarily require immediate shutdown.

  */

  public error(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /*

           fatal()
	         ---
	         logs fatal error conditions.

	         indicates critical failures that may require
	         application shutdown. immediately flushes
	         buffer to ensure message persistence.

  */

  public fatal(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.FATAL, category, message, data);

    /* immediately flush fatal errors to ensure persistence */
    this.flush();
  }

  /*

           log()
	         ---
	         internal logging method with level filtering and buffering.

	         core logging implementation that handles level filtering,
	         entry creation, console output, and buffer management.
	         automatically flushes when buffer reaches size limit.

  */

  private log(level: LogLevel, category: string, message: string, data?: unknown): void {
    /* filter messages below minimum level */
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

    /* flush buffer when it reaches size limit to prevent
       excessive memory usage during high-volume logging */
    if (this.log_buffer.length >= this.max_buffer_size) {
      this.flush();
    }
  }

  /*

           writeToConsole()
	         ---
	         outputs formatted log entry to console.

	         creates formatted message with timestamp, level,
	         category, and message. uses appropriate console
	         method based on log level for proper styling.

  */

  private writeToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level_name = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${level_name}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    /* route to appropriate console method based on level
       for proper browser/terminal styling and filtering */
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

  /*

           flush()
	         ---
	         writes buffered log entries to file.

	         formats all buffered entries as text lines and
	         appends to log file. handles JSON serialization
	         for structured data and gracefully handles
	         serialization failures.

  */

  private flush(): void {
    if (this.log_buffer.length === 0 || !this.log_file_path) {
      return;
    }

    const lines: string[] = [];

    /* format each log entry as a text line for file output */
    for (const entry of this.log_buffer) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const level_name = LogLevel[entry.level];
      let line = `[${timestamp}] [${level_name}] [${entry.category}] ${entry.message}`;

      /* serialize structured data if present */
      if (entry.data !== undefined) {
        try {
          const data_str = JSON.stringify(entry.data);
          line += ` ${data_str}`;
        } catch (error) {
          /* handle cases where data contains circular references
             or other non-serializable content */
          line += ` [UNSERIALIZABLE DATA]`;
        }
      }

      lines.push(line);
    }

    const content = lines.join('\n') + '\n';

    /* append to log file with error handling to prevent
       logger failures from crashing the application */
    try {
      fs.appendFileSync(this.log_file_path, content, { encoding: 'utf8' });
    } catch (error) {
      /* use console.error directly to avoid recursive logging */
      console.error('[LOGGER] Failed to write log file:', error);
    }

    /* clear buffer after successful write */
    this.log_buffer = [];
  }
}

/* singleton instance for application-wide logging */
export const logger = new Logger();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
