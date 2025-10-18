/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             FILE SYSTEM MODULE - WORLDENV EDITOR
	====================================================================
*/

/*

	safe file system operations with comprehensive validation
	and error handling for worldenv projects.

	this module provides secure abstractions over Node.js file
	system operations with path validation, size limits, and
	extension filtering. all operations include proper error
	handling and logging for debugging.

	security features:
	- path traversal prevention (blocks ".." sequences)
	- file size limits to prevent memory exhaustion
	- extension whitelist for allowed file types
	- comprehensive validation before operations

	supports both synchronous and asynchronous operations
	with consistent error reporting and logging throughout.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as fs from 'fs'; /* NODE.JS FILE SYSTEM API */
import * as path from 'path'; /* PATH MANIPULATION UTILITIES */
import { promisify } from 'util'; /* PROMISE CONVERSION */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { FileSystemError } from '../shared/types'; /* ERROR TYPES */

/* promisified file system operations for async/await usage */
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         ReadOptions
	       ---
	       configuration for file reading operations.

	       controls text encoding, file flags, and other
	       read-specific parameters for file operations.

*/

interface ReadOptions {
  encoding?: BufferEncoding /* TEXT ENCODING (utf8, ascii, etc) */;
  flag?: string /* FILE SYSTEM FLAGS */;
}

/*

         WriteOptions
	       ---
	       configuration for file writing operations.

	       controls encoding, permissions, flags, and whether
	       to create parent directories automatically.

*/

interface WriteOptions {
  encoding?: BufferEncoding /* TEXT ENCODING FOR OUTPUT */;
  mode?: number /* FILE PERMISSIONS (octal) */;
  flag?: string /* WRITE FLAGS (w, a, etc) */;
  create_dirs?: boolean /* CREATE PARENT DIRECTORIES */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         FileSystem
	       ---
	       secure file system operations manager.

	       provides safe wrappers around Node.js file system
	       operations with comprehensive validation, error
	       handling, and security features.

	       implements:
	       - path traversal prevention
	       - file size limits
	       - extension whitelist validation
	       - automatic directory creation
	       - JSON serialization helpers

	       all operations are logged and provide detailed
	       error information for debugging purposes.

*/

class FileSystem {
  private max_file_size: number; /* MAXIMUM ALLOWED FILE SIZE */
  private allowed_extensions: Set<string>; /* PERMITTED FILE EXTENSIONS */

  constructor() {
    /* set reasonable default file size limit (100MB) to
       prevent memory exhaustion from large files */
    this.max_file_size = 100 * 1024 * 1024;

    /* define whitelist of allowed file extensions for
       security and project organization */
    this.allowed_extensions = new Set([
      '.worldenv' /* WORLDENV PROJECT FILES */,
      '.worldscene' /* SCENE DEFINITION FILES */,
      '.wc' /* WORLDC SOURCE FILES */,
      '.ts' /* TYPESCRIPT SOURCE */,
      '.js' /* JAVASCRIPT FILES */,
      '.json' /* JSON DATA FILES */,
      '.txt' /* TEXT DOCUMENTS */,
      '.md' /* MARKDOWN DOCUMENTATION */,
      '.png' /* PNG IMAGE FILES */,
      '.jpg' /* JPEG IMAGE FILES */,
      '.jpeg' /* JPEG IMAGE FILES (ALT) */,
      '.gif' /* GIF IMAGE FILES */,
      '.svg' /* SVG VECTOR GRAPHICS */,
      '.mp3' /* MP3 AUDIO FILES */,
      '.ogg' /* OGG AUDIO FILES */,
      '.wav' /* WAV AUDIO FILES */,
      '.glsl' /* OPENGL SHADER FILES */,
      '.wgsl' /* WEBGPU SHADER FILES */,
      '.obj' /* 3D MODEL FILES (OBJ) */,
      '.gltf' /* GLTF 3D MODEL FILES */,
      '.glb' /* BINARY GLTF FILES */
    ]);
  }

  /*

           readFile()
	         ---
	         reads file contents with comprehensive validation.

	         performs security checks including path validation,
	         file size limits, and ensures target is actually
	         a file. returns content as string with specified
	         encoding.

	         throws FileSystemError for invalid operations
	         or file system failures.

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

      /* prevent memory exhaustion from extremely large files */
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

  /*

           writeFile()
	         ---
	         writes content to file with validation and directory creation.

	         supports automatic parent directory creation when
	         create_dirs option is enabled. validates path and
	         handles permissions and encoding properly.

  */

  public async writeFile(
    file_path: string,
    content: string | Buffer,
    options: WriteOptions = {}
  ): Promise<void> {
    try {
      this.validatePath(file_path);

      /* create parent directories if requested and they don't exist */
      if (options.create_dirs) {
        const dir_path = path.dirname(file_path);
        await this.ensureDirectory(dir_path);
      }

      const encoding = options.encoding || 'utf8';
      const mode = options.mode || 0o666; /* DEFAULT FILE PERMISSIONS */
      const flag = options.flag || 'w'; /* WRITE MODE */

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

  /*

           readJSON()
	         ---
	         reads and parses JSON file with error handling.

	         combines file reading with JSON parsing and provides
	         specific error messages for parsing failures.
	         returns typed data structure.

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

  /*

           writeJSON()
	         ---
	         serializes data to formatted JSON file.

	         converts JavaScript objects to properly formatted
	         JSON with 2-space indentation for readability.
	         handles serialization errors gracefully.

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

  /*

           exists()
	         ---
	         checks if file or directory exists asynchronously.

	         uses stat operation to determine existence.
	         returns false for any error including permission
	         denied or path not found.

  */

  public async exists(file_path: string): Promise<boolean> {
    try {
      await statAsync(file_path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /*

           existsSync()
	         ---
	         synchronous version of exists check.

	         useful for quick existence checks where blocking
	         is acceptable. prefer async version in most cases.

  */

  public existsSync(file_path: string): boolean {
    try {
      fs.statSync(file_path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /*

           isFile()
	         ---
	         checks if path points to a regular file.

	         distinguishes between files and directories.
	         returns false for non-existent paths or
	         permission errors.

  */

  public async isFile(file_path: string): Promise<boolean> {
    try {
      const stats = await statAsync(file_path);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  /*

           isDirectory()
	         ---
	         checks if path points to a directory.

	         useful for path validation before directory
	         operations. returns false for files or
	         non-existent paths.

  */

  public async isDirectory(file_path: string): Promise<boolean> {
    try {
      const stats = await statAsync(file_path);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /*

           ensureDirectory()
	         ---
	         creates directory and all parent directories.

	         equivalent to 'mkdir -p' command. validates path
	         and ensures existing paths are actually directories.
	         uses recursive creation for parent directories.

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

  /*

           listDirectory()
	         ---
	         lists files and directories in a directory.

	         validates path is actually a directory before
	         attempting to list contents. returns array of
	         entry names (not full paths).

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

  /*

           deleteFile()
	         ---
	         deletes a single file with validation.

	         ensures path points to a file (not directory)
	         before attempting deletion. provides clear
	         error messages for different failure modes.

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

  /*

           deleteDirectory()
	         ---
	         deletes directory and all contents recursively.

	         equivalent to 'rm -rf' command. validates path
	         is actually a directory then recursively removes
	         all contents before removing directory itself.

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

  /*

           deleteDirectoryRecursive()
	         ---
	         internal recursive directory deletion implementation.

	         walks directory tree depth-first, deleting files
	         and subdirectories. handles mixed content types
	         appropriately.

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

  /*

           getFileStats()
	         ---
	         returns file system statistics for path.

	         provides detailed information about file size,
	         permissions, timestamps, and type. useful for
	         detailed file information queries.

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

  /*

           validatePath()
	         ---
	         validates file path for security and correctness.

	         implements security checks including:
	         - path traversal prevention (blocks "..")
	         - file extension validation against whitelist
	         - basic path format validation

	         throws FileSystemError for invalid paths.

  */

  private validatePath(file_path: string): void {
    if (!file_path || typeof file_path !== 'string') {
      throw new FileSystemError('Invalid file path', {
        path: file_path
      });
    }

    const normalized = path.normalize(file_path);

    /* prevent path traversal attacks by blocking parent
       directory references in normalized paths */
    if (normalized.includes('..')) {
      throw new FileSystemError('Path traversal not allowed', {
        path: file_path
      });
    }

    /* check file extension against whitelist for absolute paths
       warn about unknown extensions but don't block them */
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

  /*

           setMaxFileSize()
	         ---
	         configures maximum allowed file size for read operations.

	         prevents memory exhaustion from extremely large files.
	         size must be positive integer in bytes.

  */

  public setMaxFileSize(size: number): void {
    if (size <= 0) {
      throw new Error('Maximum file size must be positive');
    }

    this.max_file_size = size;
  }

  /*

           addAllowedExtension()
	         ---
	         adds file extension to security whitelist.

	         allows new file types to be processed by the
	         file system. automatically adds leading dot
	         if not provided.

  */

  public addAllowedExtension(extension: string): void {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }

    this.allowed_extensions.add(extension.toLowerCase());
  }
}

/* singleton instance for application-wide file system operations */
export const fileSystem = new FileSystem();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
