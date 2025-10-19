/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             FILE HISTORY MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	comprehensive file history and version tracking system with
	automatic change detection, diff generation, and restoration.

	this module manages complete file versioning including automatic
	change tracking, diff-based storage, version metadata, and
	restoration capabilities with efficient storage optimization.

	history features:
	- automatic file change detection and versioning
	- diff-based storage for efficient space utilization
	- comprehensive version metadata and annotations
	- selective version restoration and comparison
	- history cleanup and retention policies
	- integration with file system watching

	the system ensures complete file history tracking through
	incremental versioning with proper metadata management
	and provides reliable restoration mechanisms.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as path from 'path'; /* PATH MANIPULATION UTILITIES */
import * as fs from 'fs'; /* FILESYSTEM OPERATIONS */
import * as crypto from 'crypto'; /* CRYPTOGRAPHIC UTILITIES */
import { fileSystem } from './file-system'; /* SECURE FILE OPERATIONS */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { projectManager } from './project'; /* PROJECT MANAGEMENT */
import { fileWatcher } from './watcher'; /* FILE WATCHING */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         FileVersion
	       ---
	       individual file version information.

	       contains complete version metadata including
	       content hash, diff data, modification details,
	       and restoration information for version tracking.

*/

interface FileVersion {
  id: string /* UNIQUE VERSION IDENTIFIER */;
  filePath: string /* RELATIVE FILE PATH */;
  timestamp: number /* VERSION CREATION TIME */;
  hash: string /* CONTENT HASH */;
  size: number /* FILE SIZE IN BYTES */;
  author: string /* MODIFICATION AUTHOR */;
  message: string /* VERSION MESSAGE */;
  type: 'full' | 'diff' /* VERSION TYPE */;
  parentVersion?: string /* PARENT VERSION ID */;
  contentDiff?: string /* DIFF FROM PARENT */;
  fullContent?: string /* FULL CONTENT FOR BASE VERSIONS */;
}

/*

         FileHistory
	       ---
	       complete file history information.

	       maintains chronological version list with metadata
	       for efficient version navigation and comparison.

*/

interface FileHistory {
  filePath: string /* RELATIVE FILE PATH */;
  created: number /* FIRST VERSION TIMESTAMP */;
  modified: number /* LAST VERSION TIMESTAMP */;
  totalVersions: number /* TOTAL VERSION COUNT */;
  currentVersion: string /* CURRENT VERSION ID */;
  versions: FileVersion[] /* CHRONOLOGICAL VERSION LIST */;
}

/*

         HistoryOptions
	       ---
	       file history tracking configuration.

	       controls history behavior including retention,
	       diff algorithms, and tracking granularity.

*/

interface HistoryOptions {
  maxVersions?: number /* MAXIMUM VERSIONS TO RETAIN */;
  diffAlgorithm?: 'line' | 'word' | 'character' /* DIFF GRANULARITY */;
  autoTrack?: boolean /* AUTOMATIC CHANGE TRACKING */;
  trackBinaryFiles?: boolean /* TRACK BINARY FILE CHANGES */;
  compressionEnabled?: boolean /* ENABLE DIFF COMPRESSION */;
  excludePatterns?: RegExp[] /* FILE EXCLUSION PATTERNS */;
}

/*

         DiffResult
	       ---
	       diff computation result information.

	       contains diff statistics and patch data for
	       version comparison and change visualization.

*/

interface DiffResult {
  filePath: string /* FILE PATH */;
  oldVersion: string /* OLD VERSION ID */;
  newVersion: string /* NEW VERSION ID */;
  additions: number /* LINES ADDED */;
  deletions: number /* LINES DELETED */;
  modifications: number /* LINES MODIFIED */;
  patch: string /* UNIFIED DIFF PATCH */;
}

/*
	====================================================================
             --- GLOBAL ---
	====================================================================
*/

/* default history tracking options */
const DEFAULT_HISTORY_OPTIONS: HistoryOptions = {
  maxVersions: 100,
  diffAlgorithm: 'line',
  autoTrack: true,
  trackBinaryFiles: false,
  compressionEnabled: true,
  excludePatterns: [
    /node_modules/,
    /\.git/,
    /build/,
    /dist/,
    /temp/,
    /\.tmp$/,
    /\.log$/,
    /\.cache$/
  ]
};

/* supported text file extensions for diff tracking */
const TEXT_FILE_EXTENSIONS = [
  '.wc', '.ts', '.js', '.tsx', '.jsx',
  '.json', '.xml', '.yaml', '.yml',
  '.md', '.txt', '.csv',
  '.glsl', '.vert', '.frag', '.comp',
  '.material', '.prefab', '.worldscene'
];

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         FileHistoryManager
	       ---
	       comprehensive file history and version tracking system.

	       manages complete file versioning lifecycle including
	       automatic change detection, diff generation, version
	       storage, and restoration with efficient space utilization
	       and comprehensive metadata tracking.

	       provides reliable version control for project files
	       with configurable retention policies and integration
	       with file system monitoring for real-time tracking.

*/

class FileHistoryManager {
  private history_directory: string /* HISTORY STORAGE DIRECTORY */;
  private file_histories: Map<string, FileHistory> /* FILE HISTORY MAP */;
  private options: HistoryOptions /* TRACKING OPTIONS */;
  private tracking_enabled: boolean /* TRACKING STATE */;
  private tracked_files: Set<string> /* TRACKED FILE SET */;

  constructor() {
    this.history_directory = '';
    this.file_histories = new Map();
    this.options = { ...DEFAULT_HISTORY_OPTIONS };
    this.tracking_enabled = false;
    this.tracked_files = new Set();
  }

  /*

           initialize()
	         ---
	         initializes file history system with project context.

	         sets up history storage directory and configures
	         file system watching for automatic change tracking.

  */
  public async initialize(project_path: string, options?: Partial<HistoryOptions>): Promise<void> {
    try {
      this.history_directory = path.join(project_path, '.worldenv', 'history');
      await fileSystem.ensureDirectory(this.history_directory);

      /* merge options */
      this.options = { ...DEFAULT_HISTORY_OPTIONS, ...options };

      /* load existing histories */
      await this.loadExistingHistories();

      /* setup file watching if enabled */
      if (this.options.autoTrack) {
        this.setupFileWatching(project_path);
      }

      this.tracking_enabled = true;

      logger.info('HISTORY', 'File history system initialized', {
        historyDirectory: this.history_directory,
        options: this.options
      });
    } catch (error) {
      logger.error('HISTORY', 'History system initialization failed', {
        projectPath: project_path,
        error: error
      });
      throw error;
    }
  }

  /*

           trackFile()
	         ---
	         adds file to version tracking system.

	         creates initial version and enables automatic
	         change tracking for specified file.

  */
  public async trackFile(file_path: string, message: string = 'Initial version'): Promise<string> {
    try {
      if (!this.tracking_enabled) {
        throw new Error('History tracking is not enabled');
      }

      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      const relative_path = path.relative(project.path, file_path);

      if (this.shouldExcludeFile(relative_path)) {
        throw new Error('File type is excluded from tracking');
      }

      /* check if file exists */
      const exists = await fileSystem.exists(file_path);
      if (!exists) {
        throw new Error('File does not exist');
      }

      /* create initial version */
      const version_id = await this.createVersion(file_path, message, 'full');

      this.tracked_files.add(relative_path);

      logger.info('HISTORY', 'File added to tracking', {
        filePath: relative_path,
        versionId: version_id
      });

      return version_id;
    } catch (error) {
      logger.error('HISTORY', 'File tracking failed', {
        filePath: file_path,
        error: error
      });
      throw error;
    }
  }

  /*

           createVersion()
	         ---
	         creates new version of tracked file.

	         generates version with diff from previous version
	         and stores metadata for restoration and comparison.

  */
  public async createVersion(
    file_path: string,
    message: string,
    type: 'full' | 'diff' = 'diff'
  ): Promise<string> {
    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      const relative_path = path.relative(project.path, file_path);
      const content = await fileSystem.readFile(file_path);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const stats = await fileSystem.getFileStats(file_path);

      const version_id = this.generateVersionId();
      let existing_history = this.file_histories.get(relative_path);

      /* create new history if none exists */
      if (!existing_history) {
        existing_history = {
          filePath: relative_path,
          created: Date.now(),
          modified: Date.now(),
          totalVersions: 0,
          currentVersion: '',
          versions: []
        };
      }

      /* determine version type and content */
      let content_diff: string | undefined;
      let full_content: string | undefined;
      let parent_version: string | undefined;

      if (type === 'full' || existing_history.versions.length === 0) {
        full_content = content;
        type = 'full';
      } else {
        /* generate diff from previous version */
        const previous_version = existing_history.versions[existing_history.versions.length - 1];
        parent_version = previous_version.id;

        const previous_content = await this.getVersionContent(relative_path, previous_version.id);
        content_diff = this.generateDiff(previous_content, content);
      }

      const version: FileVersion = {
        id: version_id,
        filePath: relative_path,
        timestamp: Date.now(),
        hash: hash,
        size: stats.size,
        author: 'user', /* would get from user context */
        message: message,
        type: type,
        parentVersion: parent_version,
        contentDiff: content_diff,
        fullContent: full_content
      };

      /* add version to history */
      existing_history.versions.push(version);
      existing_history.totalVersions++;
      existing_history.currentVersion = version_id;
      existing_history.modified = Date.now();

      /* cleanup old versions if needed */
      await this.cleanupOldVersions(existing_history);

      /* save history */
      this.file_histories.set(relative_path, existing_history);
      await this.saveFileHistory(existing_history);

      logger.info('HISTORY', 'File version created', {
        filePath: relative_path,
        versionId: version_id,
        type: type,
        size: stats.size
      });

      return version_id;
    } catch (error) {
      logger.error('HISTORY', 'Version creation failed', {
        filePath: file_path,
        error: error
      });
      throw error;
    }
  }

  /*

           getFileHistory()
	         ---
	         returns complete history for specified file.

	         provides chronological version list with metadata
	         for history browsing and version comparison.

  */
  public getFileHistory(file_path: string): FileHistory | null {
    const project = projectManager.getCurrentProject();
    if (!project) {
      return null;
    }

    const relative_path = path.relative(project.path, file_path);
    return this.file_histories.get(relative_path) || null;
  }

  /*

           getVersionContent()
	         ---
	         reconstructs file content for specific version.

	         applies diffs from base version to reconstruct
	         complete file content for specified version.

  */
  public async getVersionContent(file_path: string, version_id: string): Promise<string> {
    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      const relative_path = path.relative(project.path, file_path);
      const history = this.file_histories.get(relative_path);

      if (!history) {
        throw new Error('No history found for file');
      }

      const version = history.versions.find(v => v.id === version_id);
      if (!version) {
        throw new Error('Version not found');
      }

      /* return full content if available */
      if (version.type === 'full' && version.fullContent) {
        return version.fullContent;
      }

      /* reconstruct from diffs */
      if (version.type === 'diff' && version.parentVersion && version.contentDiff) {
        const parent_content = await this.getVersionContent(file_path, version.parentVersion);
        return this.applyDiff(parent_content, version.contentDiff);
      }

      throw new Error('Unable to reconstruct version content');
    } catch (error) {
      logger.error('HISTORY', 'Version content retrieval failed', {
        filePath: file_path,
        versionId: version_id,
        error: error
      });
      throw error;
    }
  }

  /*

           restoreVersion()
	         ---
	         restores file to specified version.

	         overwrites current file content with content
	         from specified version and creates new version.

  */
  public async restoreVersion(file_path: string, version_id: string): Promise<void> {
    try {
      const version_content = await this.getVersionContent(file_path, version_id);
      await fileSystem.writeFile(file_path, version_content);

      /* create new version marking restoration */
      await this.createVersion(file_path, `Restored to version ${version_id}`, 'diff');

      logger.info('HISTORY', 'File restored to version', {
        filePath: file_path,
        versionId: version_id
      });
    } catch (error) {
      logger.error('HISTORY', 'Version restoration failed', {
        filePath: file_path,
        versionId: version_id,
        error: error
      });
      throw error;
    }
  }

  /*

           compareVersions()
	         ---
	         generates diff between two file versions.

	         computes unified diff between specified versions
	         with statistics and change visualization.

  */
  public async compareVersions(
    file_path: string,
    old_version_id: string,
    new_version_id: string
  ): Promise<DiffResult> {
    try {
      const old_content = await this.getVersionContent(file_path, old_version_id);
      const new_content = await this.getVersionContent(file_path, new_version_id);

      const patch = this.generateDiff(old_content, new_content);
      const stats = this.analyzeDiff(patch);

      const result: DiffResult = {
        filePath: file_path,
        oldVersion: old_version_id,
        newVersion: new_version_id,
        additions: stats.additions,
        deletions: stats.deletions,
        modifications: stats.modifications,
        patch: patch
      };

      return result;
    } catch (error) {
      logger.error('HISTORY', 'Version comparison failed', {
        filePath: file_path,
        oldVersionId: old_version_id,
        newVersionId: new_version_id,
        error: error
      });
      throw error;
    }
  }

  /*

           deleteFileHistory()
	         ---
	         removes complete history for specified file.

	         deletes all versions and metadata for file
	         from history tracking system.

  */
  public async deleteFileHistory(file_path: string): Promise<void> {
    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      const relative_path = path.relative(project.path, file_path);

      /* remove from tracking */
      this.tracked_files.delete(relative_path);
      this.file_histories.delete(relative_path);

      /* delete history file */
      const history_file = path.join(this.history_directory, `${this.encodeFilePath(relative_path)}.json`);
      const exists = await fileSystem.exists(history_file);
      if (exists) {
        await fileSystem.deleteFile(history_file);
      }

      logger.info('HISTORY', 'File history deleted', {
        filePath: relative_path
      });
    } catch (error) {
      logger.error('HISTORY', 'File history deletion failed', {
        filePath: file_path,
        error: error
      });
      throw error;
    }
  }

  /*

           cleanup()
	         ---
	         performs history system cleanup and maintenance.

	         removes obsolete versions, optimizes storage,
	         and maintains retention policies.

  */
  public async cleanup(): Promise<void> {
    try {
      let cleaned_files = 0;
      let cleaned_versions = 0;

      for (const [file_path, history] of this.file_histories) {
        const old_version_count = history.totalVersions;
        await this.cleanupOldVersions(history);

        const new_version_count = history.totalVersions;
        if (new_version_count < old_version_count) {
          cleaned_files++;
          cleaned_versions += (old_version_count - new_version_count);
          await this.saveFileHistory(history);
        }
      }

      logger.info('HISTORY', 'History cleanup completed', {
        cleanedFiles: cleaned_files,
        cleanedVersions: cleaned_versions
      });
    } catch (error) {
      logger.error('HISTORY', 'History cleanup failed', {
        error: error
      });
      throw error;
    }
  }

  /*

           setupFileWatching()
	         ---
	         configures file system watching for automatic tracking.

	         integrates with file watcher to detect changes
	         and automatically create versions for tracked files.

  */
  private setupFileWatching(project_path: string): void {
    fileWatcher.addListener((event) => {
      if (event.type === 'change' && this.isTextFile(event.path)) {
        const relative_path = path.relative(project_path, event.path);

        if (this.tracked_files.has(relative_path) && !this.shouldExcludeFile(relative_path)) {
          /* debounce rapid changes */
          setTimeout(async () => {
            try {
              await this.createVersion(event.path, 'Auto-save version', 'diff');
            } catch (error) {
              logger.debug('HISTORY', 'Auto-version creation failed', {
                filePath: event.path,
                error: error
              });
            }
          }, 1000);
        }
      }
    });
  }

  /*

           loadExistingHistories()
	         ---
	         loads existing file histories from storage.

	         scans history directory and loads file histories
	         for continuation of tracking across sessions.

  */
  private async loadExistingHistories(): Promise<void> {
    try {
      const exists = await fileSystem.exists(this.history_directory);
      if (!exists) {
        return;
      }

      const history_files = await fileSystem.listDirectory(this.history_directory);
      const json_files = history_files.filter((file: string) => file.endsWith('.json'));

      for (const json_file of json_files) {
        try {
          const history_path = path.join(this.history_directory, json_file);
          const history = await fileSystem.readJSON<FileHistory>(history_path);

          this.file_histories.set(history.filePath, history);
          this.tracked_files.add(history.filePath);
        } catch (error) {
          logger.warn('HISTORY', 'Failed to load history file', {
            historyFile: json_file,
            error: error
          });
        }
      }

      logger.info('HISTORY', 'Loaded existing histories', {
        historyCount: this.file_histories.size
      });
    } catch (error) {
      logger.error('HISTORY', 'Failed to load existing histories', {
        error: error
      });
    }
  }

  /*

           saveFileHistory()
	         ---
	         saves file history to persistent storage.

	         writes history metadata and versions to disk
	         for persistence across editor sessions.

  */
  private async saveFileHistory(history: FileHistory): Promise<void> {
    const history_file = path.join(this.history_directory, `${this.encodeFilePath(history.filePath)}.json`);
    await fileSystem.writeJSON(history_file, history);
  }

  /*

           generateDiff()
	         ---
	         generates unified diff between two text strings.

	         creates unified diff format patch for version
	         storage and change visualization.

  */
  private generateDiff(old_content: string, new_content: string): string {
    /* simplified diff generation - would use proper diff library */
    const old_lines = old_content.split('\n');
    const new_lines = new_content.split('\n');

    let patch = '';
    let old_index = 0;
    let new_index = 0;

    while (old_index < old_lines.length || new_index < new_lines.length) {
      if (old_index >= old_lines.length) {
        /* addition */
        patch += `+${new_lines[new_index]}\n`;
        new_index++;
      } else if (new_index >= new_lines.length) {
        /* deletion */
        patch += `-${old_lines[old_index]}\n`;
        old_index++;
      } else if (old_lines[old_index] === new_lines[new_index]) {
        /* no change */
        patch += ` ${old_lines[old_index]}\n`;
        old_index++;
        new_index++;
      } else {
        /* modification */
        patch += `-${old_lines[old_index]}\n`;
        patch += `+${new_lines[new_index]}\n`;
        old_index++;
        new_index++;
      }
    }

    return patch;
  }

  /*

           applyDiff()
	         ---
	         applies unified diff patch to base content.

	         reconstructs file content by applying diff
	         patch to previous version content.

  */
  private applyDiff(base_content: string, patch: string): string {
    /* simplified patch application - would use proper patch library */
    const base_lines = base_content.split('\n');
    const patch_lines = patch.split('\n').filter(line => line.length > 0);

    const result_lines: string[] = [];
    let base_index = 0;

    for (const patch_line of patch_lines) {
      const operation = patch_line[0];
      const content = patch_line.slice(1);

      switch (operation) {
        case ' ':
          /* unchanged line */
          result_lines.push(content);
          base_index++;
          break;
        case '+':
          /* added line */
          result_lines.push(content);
          break;
        case '-':
          /* deleted line */
          base_index++;
          break;
      }
    }

    return result_lines.join('\n');
  }

  /*

           analyzeDiff()
	         ---
	         analyzes diff patch for statistics.

	         computes change statistics from unified diff
	         for change visualization and reporting.

  */
  private analyzeDiff(patch: string): { additions: number; deletions: number; modifications: number } {
    const lines = patch.split('\n');
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('+')) {
        additions++;
      } else if (line.startsWith('-')) {
        deletions++;
      }
    }

    return {
      additions: additions,
      deletions: deletions,
      modifications: Math.min(additions, deletions)
    };
  }

  /*

           cleanupOldVersions()
	         ---
	         removes old versions based on retention policy.

	         maintains version count within limits while
	         preserving important versions and full snapshots.

  */
  private async cleanupOldVersions(history: FileHistory): Promise<void> {
    if (history.versions.length <= this.options.maxVersions!) {
      return;
    }

    /* keep most recent versions and full snapshots */
    const versions_to_keep = history.versions
      .slice(-this.options.maxVersions!)
      .filter(v => v.type === 'full' || history.versions.indexOf(v) >= history.versions.length - this.options.maxVersions!);

    history.versions = versions_to_keep;
    history.totalVersions = versions_to_keep.length;
  }

  /*

           shouldExcludeFile()
	         ---
	         determines if file should be excluded from tracking.

	         applies exclusion patterns to filter files from
	         automatic history tracking.

  */
  private shouldExcludeFile(relative_path: string): boolean {
    if (!this.options.excludePatterns) {
      return false;
    }

    for (const pattern of this.options.excludePatterns) {
      if (pattern.test(relative_path)) {
        return true;
      }
    }

    return false;
  }

  /*

           isTextFile()
	         ---
	         determines if file is a text file suitable for diff tracking.

	         checks file extension against supported text types
	         for diff-based version tracking.

  */
  private isTextFile(file_path: string): boolean {
    const ext = path.extname(file_path).toLowerCase();
    return TEXT_FILE_EXTENSIONS.includes(ext);
  }

  /*

           encodeFilePath()
	         ---
	         encodes file path for safe filename storage.

	         converts file path to safe filename for history
	         file storage with proper character escaping.

  */
  private encodeFilePath(file_path: string): string {
    return file_path.replace(/[\/\\:*?"<>|]/g, '_');
  }

  /*

           generateVersionId()
	         ---
	         generates unique version identifier.

	         creates timestamp-based version ID with random
	         component for uniqueness and chronological sorting.

  */
  private generateVersionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `v${timestamp}-${random}`;
  }
}

/* singleton instance for application-wide file history management */
export const fileHistoryManager = new FileHistoryManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
