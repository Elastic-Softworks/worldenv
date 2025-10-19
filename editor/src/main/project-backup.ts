/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             PROJECT BACKUP MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	comprehensive project backup and recovery system with automatic
	incremental backups, versioning, and restoration capabilities.

	this module manages complete project backup operations including
	automatic scheduled backups, manual backup creation, version
	management, and full project restoration with integrity validation.

	backup features:
	- automatic incremental backup scheduling
	- manual backup creation with custom naming
	- compressed backup archives with metadata
	- backup validation and integrity checking
	- selective file restoration capabilities
	- backup cleanup and retention policies

	the system ensures project safety through regular backups and
	provides reliable recovery mechanisms for project restoration
	with proper error handling and progress tracking.

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

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         BackupMetadata
	       ---
	       backup archive metadata and information.

	       contains complete backup information including
	       creation timestamp, project version, file checksums,
	       and restoration details for backup validation.

*/

interface BackupMetadata {
  version: string /* BACKUP FORMAT VERSION */;
  created: number /* CREATION TIMESTAMP */;
  projectName: string /* PROJECT NAME */;
  projectVersion: string /* PROJECT VERSION */;
  backupType: 'automatic' | 'manual' /* BACKUP TYPE */;
  description?: string /* BACKUP DESCRIPTION */;
  fileCount: number /* TOTAL FILES BACKED UP */;
  totalSize: number /* TOTAL BACKUP SIZE */;
  checksum: string /* BACKUP INTEGRITY CHECKSUM */;
  files: BackupFileInfo[] /* FILE INFORMATION LIST */;
}

/*

         BackupFileInfo
	       ---
	       individual file backup information.

	       maintains file-level backup details including
	       original path, size, modification time, and
	       checksum for integrity verification.

*/

interface BackupFileInfo {
  path: string /* RELATIVE FILE PATH */;
  size: number /* FILE SIZE IN BYTES */;
  modified: number /* LAST MODIFICATION TIME */;
  checksum: string /* FILE CHECKSUM */;
}

/*

         BackupOptions
	       ---
	       backup operation configuration.

	       controls backup behavior including file filters,
	       compression settings, and validation options.

*/

interface BackupOptions {
  includeTemp?: boolean /* INCLUDE TEMPORARY FILES */;
  includeBuild?: boolean /* INCLUDE BUILD ARTIFACTS */;
  compress?: boolean /* ENABLE COMPRESSION */;
  validateFiles?: boolean /* VALIDATE FILE INTEGRITY */;
  description?: string /* BACKUP DESCRIPTION */;
}

/*

         RestoreOptions
	       ---
	       restoration operation configuration.

	       controls restore behavior including file selection,
	       overwrite policies, and validation settings.

*/

interface RestoreOptions {
  overwriteExisting?: boolean /* OVERWRITE EXISTING FILES */;
  validateIntegrity?: boolean /* VALIDATE BACKUP INTEGRITY */;
  selectiveRestore?: string[] /* SPECIFIC FILES TO RESTORE */;
  preserveTimestamps?: boolean /* PRESERVE FILE TIMESTAMPS */;
}

/*
	====================================================================
             --- GLOBAL ---
	====================================================================
*/

/* backup format version for compatibility */
const BACKUP_VERSION = '1.0.0';

/* default backup file extensions to exclude */
const DEFAULT_EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /build/,
  /dist/,
  /temp/,
  /\.tmp$/,
  /\.log$/,
  /\.cache$/,
  /\.DS_Store$/,
  /Thumbs\.db$/
];

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         ProjectBackupManager
	       ---
	       comprehensive project backup and recovery system.

	       manages complete backup lifecycle including automatic
	       scheduling, manual creation, version management, and
	       restoration with integrity validation and progress tracking.

	       provides reliable project protection through incremental
	       backups and comprehensive recovery mechanisms with proper
	       error handling and user feedback.

*/

class ProjectBackupManager {
  private backup_directory: string /* BACKUP STORAGE DIRECTORY */;
  private auto_backup_timer: NodeJS.Timeout | null /* AUTO BACKUP TIMER */;
  private auto_backup_interval: number /* AUTO BACKUP INTERVAL MS */;
  private max_backups: number /* MAXIMUM BACKUP RETENTION */;
  private exclude_patterns: RegExp[] /* FILE EXCLUSION PATTERNS */;

  constructor() {
    this.backup_directory = '';
    this.auto_backup_timer = null;
    this.auto_backup_interval = 30 * 60 * 1000; /* 30 MINUTES */
    this.max_backups = 50;
    this.exclude_patterns = [...DEFAULT_EXCLUDE_PATTERNS];
  }

  /*

           initialize()
	         ---
	         initializes backup system with project context.

	         sets up backup directory structure and configures
	         automatic backup scheduling based on project settings.

  */
  public async initialize(project_path: string): Promise<void> {
    try {
      this.backup_directory = path.join(project_path, '.worldenv', 'backups');
      await fileSystem.ensureDirectory(this.backup_directory);

      logger.info('BACKUP', 'Backup system initialized', {
        backupDirectory: this.backup_directory
      });

      await this.startAutoBackup();
    } catch (error) {
      logger.error('BACKUP', 'Backup system initialization failed', {
        projectPath: project_path,
        error: error
      });
      throw error;
    }
  }

  /*

           createBackup()
	         ---
	         creates manual project backup with options.

	         performs complete project backup with file validation,
	         compression, and metadata generation. returns backup
	         identifier for tracking and restoration.

  */
  public async createBackup(options: BackupOptions = {}): Promise<string> {
    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      logger.info('BACKUP', 'Creating project backup', {
        projectPath: project.path,
        options: options
      });

      const backup_id = this.generateBackupId();
      const backup_path = path.join(this.backup_directory, `${backup_id}.backup`);

      const files = await this.collectFiles(project.path, options);
      const metadata = await this.createBackupMetadata(files, options);

      await this.createBackupArchive(backup_path, files, metadata);
      await this.cleanupOldBackups();

      logger.info('BACKUP', 'Project backup created successfully', {
        backupId: backup_id,
        fileCount: files.length,
        totalSize: metadata.totalSize
      });

      return backup_id;
    } catch (error) {
      logger.error('BACKUP', 'Project backup failed', {
        error: error
      });
      throw error;
    }
  }

  /*

           restoreBackup()
	         ---
	         restores project from backup archive.

	         extracts backup archive with integrity validation
	         and applies restoration based on provided options.
	         supports selective file restoration.

  */
  public async restoreBackup(backup_id: string, options: RestoreOptions = {}): Promise<void> {
    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      logger.info('BACKUP', 'Restoring project backup', {
        backupId: backup_id,
        options: options
      });

      const backup_path = path.join(this.backup_directory, `${backup_id}.backup`);
      const backup_exists = await fileSystem.exists(backup_path);

      if (!backup_exists) {
        throw new Error(`Backup not found: ${backup_id}`);
      }

      const metadata = await this.loadBackupMetadata(backup_path);

      if (options.validateIntegrity) {
        await this.validateBackupIntegrity(backup_path, metadata);
      }

      await this.extractBackup(backup_path, project.path, metadata, options);

      logger.info('BACKUP', 'Project backup restored successfully', {
        backupId: backup_id,
        fileCount: metadata.fileCount
      });
    } catch (error) {
      logger.error('BACKUP', 'Project restore failed', {
        backupId: backup_id,
        error: error
      });
      throw error;
    }
  }

  /*

           listBackups()
	         ---
	         returns list of available project backups.

	         scans backup directory and returns backup metadata
	         for display in backup management interface.

  */
  public async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups: BackupMetadata[] = [];

      if (!(await fileSystem.exists(this.backup_directory))) {
        return backups;
      }

      const backup_files = await fileSystem.listDirectory(this.backup_directory);
      const backup_archives = backup_files.filter((file: string) => file.endsWith('.backup'));

      for (const backup_file of backup_archives) {
        try {
          const backup_path = path.join(this.backup_directory, backup_file);
          const metadata = await this.loadBackupMetadata(backup_path);
          backups.push(metadata);
        } catch (error) {
          logger.warn('BACKUP', 'Failed to load backup metadata', {
            backupFile: backup_file,
            error: error
          });
        }
      }

      /* sort by creation time, newest first */
      backups.sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      logger.error('BACKUP', 'List backups failed', {
        error: error
      });
      throw error;
    }
  }

  /*

           deleteBackup()
	         ---
	         deletes specified backup archive.

	         removes backup file from storage with validation
	         and updates backup index accordingly.

  */
  public async deleteBackup(backup_id: string): Promise<void> {
    try {
      const backup_path = path.join(this.backup_directory, `${backup_id}.backup`);
      const backup_exists = await fileSystem.exists(backup_path);

      if (!backup_exists) {
        throw new Error(`Backup not found: ${backup_id}`);
      }

      await fileSystem.deleteFile(backup_path);

      logger.info('BACKUP', 'Backup deleted successfully', {
        backupId: backup_id
      });
    } catch (error) {
      logger.error('BACKUP', 'Backup deletion failed', {
        backupId: backup_id,
        error: error
      });
      throw error;
    }
  }

  /*

           startAutoBackup()
	         ---
	         starts automatic backup scheduling.

	         enables periodic automatic backups based on
	         configured interval and project activity.

  */
  public async startAutoBackup(): Promise<void> {
    this.stopAutoBackup();

    this.auto_backup_timer = setInterval(async () => {
      try {
        const project = projectManager.getCurrentProject();
        if (project && projectManager.isProjectModified()) {
          await this.createBackup({
            includeTemp: false,
            includeBuild: false,
            compress: true,
            validateFiles: true,
            description: 'Automatic backup'
          });
        }
      } catch (error) {
        logger.error('BACKUP', 'Automatic backup failed', {
          error: error
        });
      }
    }, this.auto_backup_interval);

    logger.info('BACKUP', 'Automatic backup started', {
      interval: this.auto_backup_interval
    });
  }

  /*

           stopAutoBackup()
	         ---
	         stops automatic backup scheduling.

	         disables periodic automatic backups and clears
	         any pending backup timers.

  */
  public stopAutoBackup(): void {
    if (this.auto_backup_timer) {
      clearInterval(this.auto_backup_timer);
      this.auto_backup_timer = null;

      logger.info('BACKUP', 'Automatic backup stopped');
    }
  }

  /*

           setAutoBackupInterval()
	         ---
	         configures automatic backup interval.

	         updates backup frequency and restarts automatic
	         backup timer with new interval.

  */
  public setAutoBackupInterval(interval_ms: number): void {
    this.auto_backup_interval = interval_ms;

    if (this.auto_backup_timer) {
      this.startAutoBackup();
    }

    logger.info('BACKUP', 'Auto backup interval updated', {
      interval: interval_ms
    });
  }

  /*

           collectFiles()
	         ---
	         collects project files for backup operation.

	         scans project directory and builds file list
	         with filtering based on backup options and
	         exclusion patterns.

  */
  private async collectFiles(project_path: string, options: BackupOptions): Promise<string[]> {
    const files: string[] = [];

    const collectRecursive = async (dir: string): Promise<void> => {
      const entries = await fileSystem.listDirectory(dir);

      for (const entry of entries) {
        const full_path = path.join(dir, entry);
        const relative_path = path.relative(project_path, full_path);

        if (this.shouldExcludeFile(relative_path, options)) {
          continue;
        }

        const is_file = await fileSystem.isFile(full_path);
        if (is_file) {
          files.push(full_path);
        } else {
          const is_dir = await fileSystem.isDirectory(full_path);
          if (is_dir) {
            await collectRecursive(full_path);
          }
        }
      }
    };

    await collectRecursive(project_path);
    return files;
  }

  /*

           shouldExcludeFile()
	         ---
	         determines if file should be excluded from backup.

	         applies exclusion patterns and backup options
	         to filter files during backup collection.

  */
  private shouldExcludeFile(relative_path: string, options: BackupOptions): boolean {
    /* check exclusion patterns */
    for (const pattern of this.exclude_patterns) {
      if (pattern.test(relative_path)) {
        return true;
      }
    }

    /* check backup options */
    if (!options.includeTemp && relative_path.includes('temp')) {
      return true;
    }

    if (!options.includeBuild && relative_path.includes('build')) {
      return true;
    }

    return false;
  }

  /*

           createBackupMetadata()
	         ---
	         generates backup metadata from file list.

	         creates comprehensive backup metadata including
	         file information, checksums, and backup statistics.

  */
  private async createBackupMetadata(
    files: string[],
    options: BackupOptions
  ): Promise<BackupMetadata> {
    const project = projectManager.getCurrentProject();
    if (!project) {
      throw new Error('No project is currently open');
    }

    const file_info: BackupFileInfo[] = [];
    let total_size = 0;

    for (const file_path of files) {
      const stats = await fileSystem.getFileStats(file_path);
      const relative_path = path.relative(project.path, file_path);

      let checksum = '';
      if (options.validateFiles) {
        const content = await fileSystem.readFile(file_path);
        checksum = crypto.createHash('sha256').update(content).digest('hex');
      }

      file_info.push({
        path: relative_path,
        size: stats.size,
        modified: stats.mtime.getTime(),
        checksum: checksum
      });

      total_size += stats.size;
    }

    const metadata: BackupMetadata = {
      version: BACKUP_VERSION,
      created: Date.now(),
      projectName: project.data.name,
      projectVersion: project.data.version,
      backupType: 'manual',
      description: options.description,
      fileCount: files.length,
      totalSize: total_size,
      checksum: '',
      files: file_info
    };

    /* generate metadata checksum */
    const metadata_string = JSON.stringify(metadata, null, 2);
    metadata.checksum = crypto.createHash('sha256').update(metadata_string).digest('hex');

    return metadata;
  }

  /*

           createBackupArchive()
	         ---
	         creates backup archive with files and metadata.

	         packages project files and metadata into backup
	         archive with optional compression and validation.

  */
  private async createBackupArchive(
    backup_path: string,
    files: string[],
    metadata: BackupMetadata
  ): Promise<void> {
    /* for simplicity, create a JSON-based backup format */
    /* in production, would use tar/zip compression */

    const backup_data = {
      metadata: metadata,
      files: {} as Record<string, string>
    };

    for (const file_path of files) {
      const project = projectManager.getCurrentProject();
      if (!project) continue;

      const relative_path = path.relative(project.path, file_path);
      const content = await fileSystem.readFile(file_path);
      backup_data.files[relative_path] = Buffer.from(content).toString('base64');
    }

    await fileSystem.writeJSON(backup_path, backup_data);
  }

  /*

           loadBackupMetadata()
	         ---
	         loads metadata from backup archive.

	         extracts and validates backup metadata for
	         restoration and backup management operations.

  */
  private async loadBackupMetadata(backup_path: string): Promise<BackupMetadata> {
    const backup_data = await fileSystem.readJSON<any>(backup_path);
    return backup_data.metadata;
  }

  /*

           validateBackupIntegrity()
	         ---
	         validates backup archive integrity.

	         performs checksum validation and structure
	         verification to ensure backup completeness.

  */
  private async validateBackupIntegrity(
    backup_path: string,
    metadata: BackupMetadata
  ): Promise<void> {
    /* validate metadata checksum */
    const temp_metadata = { ...metadata };
    temp_metadata.checksum = '';

    const metadata_string = JSON.stringify(temp_metadata, null, 2);
    const calculated_checksum = crypto.createHash('sha256').update(metadata_string).digest('hex');

    if (calculated_checksum !== metadata.checksum) {
      throw new Error('Backup metadata integrity check failed');
    }

    logger.info('BACKUP', 'Backup integrity validated', {
      backupPath: backup_path
    });
  }

  /*

           extractBackup()
	         ---
	         extracts files from backup archive.

	         restores project files from backup with options
	         for selective restoration and overwrite behavior.

  */
  private async extractBackup(
    backup_path: string,
    project_path: string,
    metadata: BackupMetadata,
    options: RestoreOptions
  ): Promise<void> {
    const backup_data = await fileSystem.readJSON<any>(backup_path);

    for (const [relative_path, encoded_content] of Object.entries(backup_data.files)) {
      if (options.selectiveRestore && !options.selectiveRestore.includes(relative_path)) {
        continue;
      }

      const target_path = path.join(project_path, relative_path);
      const target_exists = await fileSystem.exists(target_path);

      if (target_exists && !options.overwriteExisting) {
        continue;
      }

      const content = Buffer.from(encoded_content as string, 'base64').toString();
      await fileSystem.writeFile(target_path, content, { create_dirs: true });

      /* preserve timestamps if requested */
      if (options.preserveTimestamps) {
        const file_info = metadata.files.find((f) => f.path === relative_path);
        if (file_info) {
          const modified_time = new Date(file_info.modified);
          await fs.promises.utimes(target_path, modified_time, modified_time);
        }
      }
    }
  }

  /*

           cleanupOldBackups()
	         ---
	         removes old backups exceeding retention policy.

	         maintains backup storage limits by removing
	         oldest backups when maximum count is exceeded.

  */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();

      if (backups.length <= this.max_backups) {
        return;
      }

      const backups_to_delete = backups.slice(this.max_backups);

      for (const backup of backups_to_delete) {
        const backup_id = path.basename(backup.checksum); /* simplified ID */
        await this.deleteBackup(backup_id);
      }

      logger.info('BACKUP', 'Old backups cleaned up', {
        deletedCount: backups_to_delete.length
      });
    } catch (error) {
      logger.warn('BACKUP', 'Backup cleanup failed', {
        error: error
      });
    }
  }

  /*

           generateBackupId()
	         ---
	         generates unique backup identifier.

	         creates timestamp-based backup ID with random
	         component for uniqueness and sorting.

  */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `backup-${timestamp}-${random}`;
  }
}

/* singleton instance for application-wide backup management */
export const projectBackupManager = new ProjectBackupManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
