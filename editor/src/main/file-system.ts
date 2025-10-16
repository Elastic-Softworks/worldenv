/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - File System Module
 *
 * Safe file system operations with validation and error handling.
 * Provides abstractions for project file management and directory operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { logger } from './logger';
import { FileSystemError } from '../shared/types';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);

interface ReadOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

interface WriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
  create_dirs?: boolean;
}

class FileSystem {
  private max_file_size: number;
  private allowed_extensions: Set<string>;

  constructor() {
    this.max_file_size = 100 * 1024 * 1024;

    this.allowed_extensions = new Set([
      '.worldenv',
      '.worldscene',
      '.wc',
      '.ts',
      '.js',
      '.json',
      '.txt',
      '.md',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.mp3',
      '.ogg',
      '.wav',
      '.glsl',
      '.wgsl',
      '.obj',
      '.gltf',
      '.glb'
    ]);
  }

  /**
   * readFile()
   *
   * Reads file contents with validation and error handling.
   * Returns file content as string or buffer.
   */
  public async readFile(file_path: string, options: ReadOptions = {}): Promise<string> {
    try {
      this.validatePath(file_path);

      const stats = await statAsync(file_path);

      if (!stats.isFile()) {
        throw new FileSystemError('Path is not a file', {
          path: file_path
        });
      }

      if (stats.size > this.max_file_size) {
        throw new FileSystemError('File exceeds maximum size', {
          path: file_path,
          size: stats.size,
          max_size: this.max_file_size
        });
      }

      const encoding = options.encoding || 'utf8';
      const content = await readFileAsync(file_path, { encoding });

      logger.debug('FS', 'File read', { path: file_path, size: stats.size });

      return content;
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'File read failed', {
        path: file_path,
        error: error
      });

      throw new FileSystemError('Failed to read file', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * writeFile()
   *
   * Writes file contents with validation and error handling.
   * Creates parent directories if requested.
   */
  public async writeFile(
    file_path: string,
    content: string | Buffer,
    options: WriteOptions = {}
  ): Promise<void> {
    try {
      this.validatePath(file_path);

      if (options.create_dirs) {
        const dir_path = path.dirname(file_path);
        await this.ensureDirectory(dir_path);
      }

      const encoding = options.encoding || 'utf8';
      const mode = options.mode || 0o666;
      const flag = options.flag || 'w';

      await writeFileAsync(file_path, content, {
        encoding: encoding as BufferEncoding | null,
        mode: mode,
        flag: flag
      });

      logger.debug('FS', 'File written', {
        path: file_path,
        size: content.length
      });
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'File write failed', {
        path: file_path,
        error: error
      });

      throw new FileSystemError('Failed to write file', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * readJSON()
   *
   * Reads and parses JSON file.
   */
  public async readJSON<T = unknown>(file_path: string): Promise<T> {
    try {
      const content = await this.readFile(file_path, { encoding: 'utf8' });
      const data = JSON.parse(content);

      return data as T;
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new FileSystemError('Invalid JSON format', {
          path: file_path,
          error: error
        });
      }

      throw new FileSystemError('Failed to read JSON file', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * writeJSON()
   *
   * Writes data as formatted JSON file.
   */
  public async writeJSON(
    file_path: string,
    data: unknown,
    options: WriteOptions = {}
  ): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await this.writeFile(file_path, content, options);
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      throw new FileSystemError('Failed to write JSON file', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * exists()
   *
   * Checks if file or directory exists.
   */
  public async exists(file_path: string): Promise<boolean> {
    try {
      await statAsync(file_path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * existsSync()
   *
   * Synchronous version of exists.
   */
  public existsSync(file_path: string): boolean {
    try {
      fs.statSync(file_path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * isFile()
   *
   * Checks if path is a file.
   */
  public async isFile(file_path: string): Promise<boolean> {
    try {
      const stats = await statAsync(file_path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * isDirectory()
   *
   * Checks if path is a directory.
   */
  public async isDirectory(file_path: string): Promise<boolean> {
    try {
      const stats = await statAsync(file_path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * ensureDirectory()
   *
   * Creates directory and all parent directories if they do not exist.
   */
  public async ensureDirectory(dir_path: string): Promise<void> {
    try {
      this.validatePath(dir_path);

      if (await this.exists(dir_path)) {
        const is_dir = await this.isDirectory(dir_path);

        if (!is_dir) {
          throw new FileSystemError('Path exists but is not a directory', {
            path: dir_path
          });
        }

        return;
      }

      await mkdirAsync(dir_path, { recursive: true });

      logger.debug('FS', 'Directory created', { path: dir_path });
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'Directory creation failed', {
        path: dir_path,
        error: error
      });

      throw new FileSystemError('Failed to create directory', {
        path: dir_path,
        error: error
      });
    }
  }

  /**
   * listDirectory()
   *
   * Lists files and directories in a directory.
   */
  public async listDirectory(dir_path: string): Promise<string[]> {
    try {
      this.validatePath(dir_path);

      const is_dir = await this.isDirectory(dir_path);

      if (!is_dir) {
        throw new FileSystemError('Path is not a directory', {
          path: dir_path
        });
      }

      const entries = await readdirAsync(dir_path);

      logger.debug('FS', 'Directory listed', {
        path: dir_path,
        count: entries.length
      });

      return entries;
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'Directory listing failed', {
        path: dir_path,
        error: error
      });

      throw new FileSystemError('Failed to list directory', {
        path: dir_path,
        error: error
      });
    }
  }

  /**
   * deleteFile()
   *
   * Deletes a file.
   */
  public async deleteFile(file_path: string): Promise<void> {
    try {
      this.validatePath(file_path);

      const is_file = await this.isFile(file_path);

      if (!is_file) {
        throw new FileSystemError('Path is not a file', {
          path: file_path
        });
      }

      await unlinkAsync(file_path);

      logger.debug('FS', 'File deleted', { path: file_path });
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'File deletion failed', {
        path: file_path,
        error: error
      });

      throw new FileSystemError('Failed to delete file', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * deleteDirectory()
   *
   * Deletes a directory and all its contents recursively.
   */
  public async deleteDirectory(dir_path: string): Promise<void> {
    try {
      this.validatePath(dir_path);

      const is_dir = await this.isDirectory(dir_path);

      if (!is_dir) {
        throw new FileSystemError('Path is not a directory', {
          path: dir_path
        });
      }

      await this.deleteDirectoryRecursive(dir_path);

      logger.debug('FS', 'Directory deleted', { path: dir_path });
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }

      logger.error('FS', 'Directory deletion failed', {
        path: dir_path,
        error: error
      });

      throw new FileSystemError('Failed to delete directory', {
        path: dir_path,
        error: error
      });
    }
  }

  /**
   * deleteDirectoryRecursive()
   *
   * Recursively deletes directory contents.
   */
  private async deleteDirectoryRecursive(dir_path: string): Promise<void> {
    const entries = await readdirAsync(dir_path);

    for (const entry of entries) {
      const entry_path = path.join(dir_path, entry);
      const stats = await statAsync(entry_path);

      if (stats.isDirectory()) {
        await this.deleteDirectoryRecursive(entry_path);
      } else {
        await unlinkAsync(entry_path);
      }
    }

    await rmdirAsync(dir_path);
  }

  /**
   * getFileStats()
   *
   * Returns file system statistics for path.
   */
  public async getFileStats(file_path: string): Promise<fs.Stats> {
    try {
      this.validatePath(file_path);

      const stats = await statAsync(file_path);

      return stats;
    } catch (error) {
      logger.error('FS', 'Failed to get file stats', {
        path: file_path,
        error: error
      });

      throw new FileSystemError('Failed to get file stats', {
        path: file_path,
        error: error
      });
    }
  }

  /**
   * validatePath()
   *
   * Validates file path for security and correctness.
   * Throws error if path is invalid or potentially unsafe.
   */
  private validatePath(file_path: string): void {
    if (!file_path || typeof file_path !== 'string') {
      throw new FileSystemError('Invalid file path', {
        path: file_path
      });
    }

    const normalized = path.normalize(file_path);

    if (normalized.includes('..')) {
      throw new FileSystemError('Path traversal not allowed', {
        path: file_path
      });
    }

    if (path.isAbsolute(file_path)) {
      const ext = path.extname(file_path).toLowerCase();

      if (ext && !this.allowed_extensions.has(ext)) {
        logger.warn('FS', 'File extension not in allowed list', {
          path: file_path,
          extension: ext
        });
      }
    }
  }

  /**
   * setMaxFileSize()
   *
   * Sets maximum allowed file size for read operations.
   */
  public setMaxFileSize(size: number): void {
    if (size <= 0) {
      throw new Error('Maximum file size must be positive');
    }

    this.max_file_size = size;
  }

  /**
   * addAllowedExtension()
   *
   * Adds file extension to allowed list.
   */
  public addAllowedExtension(extension: string): void {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }

    this.allowed_extensions.add(extension.toLowerCase());
  }
}

export const fileSystem = new FileSystem();
