/*
   ===============================================================
   WORLDEDIT ASSET MANAGER
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import * as fs from 'fs'; /* FILESYSTEM OPERATIONS */
import {
  AssetItem,
  AssetType,
  AssetMetadata,
  ImageMetadata,
  AudioMetadata,
  ModelMetadata,
  WorldCMetadata
} from '../shared/types'; /* SHARED ASSET TYPES */
import * as path from 'path'; /* PATH UTILITIES */
import { promisify } from 'util'; /* PROMISE UTILITIES */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { fileSystem } from './file-system'; /* FILE SYSTEM ABSTRACTION */
import { FileSystemError } from '../shared/types'; /* ERROR TYPES */

/*
	===============================================================
             --- GLOBAL ---
	===============================================================
*/

const _readFileAsync = promisify(fs.readFile); /* ASYNC FILE READING */
const _writeFileAsync = promisify(fs.writeFile); /* ASYNC FILE WRITING */
const _statAsync = promisify(fs.stat); /* ASYNC FILE STATS */
const copyFileAsync = promisify(fs.copyFile); /* ASYNC FILE COPY */
const renameAsync = promisify(fs.rename); /* ASYNC FILE RENAME */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         AssetItem
	       ---
	       comprehensive asset information structure that
	       represents any file or folder within the project
	       asset system. contains all metadata needed for
	       browser display, file operations, and asset
	       management workflows.

*/

/* Asset types are now imported from shared/types.ts */

/**
 * Asset import options
 */
export interface AssetImportOptions {
  preserveStructure: boolean;
  generateThumbnails: boolean;
  overwriteExisting: boolean;
  targetFolder?: string;
}

/**
 * Asset search options
 */
export interface AssetSearchOptions {
  query: string;
  types: AssetType[];
  tags: string[];
  folder?: string;
  recursive: boolean;
}

class AssetManager {
  private projectPath: string | null;
  private assetCache: Map<string, AssetItem>;
  private metadataCache: Map<string, AssetMetadata>;
  private thumbnailCache: Map<string, string>;

  constructor() {
    this.projectPath = null;
    this.assetCache = new Map();
    this.metadataCache = new Map();
    this.thumbnailCache = new Map();
  }

  /*

           isWorldCFile()
	         ---
	         Check if file is a WorldC script file.

  */
  private isWorldCFile(filePath: string): boolean {
    /* ASSERTION: filePath parameter validation */
    console.assert(
      typeof filePath === 'string' && filePath.length > 0,
      'isWorldCFile: filePath must be non-empty string'
    );

    if (!filePath || typeof filePath !== 'string') {
      logger.error('ASSET', 'Invalid filePath in isWorldCFile', { filePath });
      return false;
    }
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.wc' || ext === '.worldc';
  }

  /*

           analyzeWorldCFile()
	         ---
	         Analyze WorldC file for metadata and compilation info.

  */
  private async analyzeWorldCFile(filePath: string): Promise<WorldCMetadata> {
    /* ASSERTION: filePath parameter validation */
    console.assert(
      typeof filePath === 'string' && filePath.length > 0,
      'analyzeWorldCFile: filePath must be non-empty string'
    );
    console.assert(this.isWorldCFile(filePath), 'analyzeWorldCFile: filePath must be WorldC file');

    if (!filePath || typeof filePath !== 'string') {
      logger.error('ASSET', 'Invalid filePath in analyzeWorldCFile', { filePath });
      throw new Error('Invalid filePath provided to analyzeWorldCFile');
    }
    try {
      const content = await _readFileAsync(filePath, 'utf8');
      const metadata: WorldCMetadata = {
        version: '0.2.0',
        target: 'typescript',
        dependencies: [],
        exports: [],
        compiled: new Date(),
        hasErrors: false,
        errorCount: 0,
        warningCount: 0,
        animations: [],
        format: 'worldc'
      };

      /* Extract basic information from file content */
      const lines = content.split('\n');

      /* Check for include statements */
      const includePattern = /#include\s*[<"]([^>"]+)[">]/g;
      let match;
      while ((match = includePattern.exec(content)) !== null) {
        metadata.dependencies.push(match[1]);
      }

      /* Check for class/function exports */
      const classPattern = /class\s+(\w+)/g;
      while ((match = classPattern.exec(content)) !== null) {
        metadata.exports.push(match[1]);
      }

      /* Check for edict/const declarations */
      const edictPattern = /edict\s+\w+\s+(\w+)/g;
      while ((match = edictPattern.exec(content)) !== null) {
        metadata.exports.push(match[1]);
      }

      /* Check for compilation target hints */
      if (content.includes('assemblyscript') || content.includes('wasm')) {
        metadata.target = 'assemblyscript';
      }

      /* Check for compiled output */
      const compiledPath = filePath.replace(/\.wc$/, '.ts').replace(/\.worldc$/, '.ts');
      if (fs.existsSync(compiledPath)) {
        const compiledStats = await _statAsync(compiledPath);
        const sourceStats = await _statAsync(filePath);

        metadata.compiledPath = compiledPath;
        metadata.lastCompiled = compiledStats.mtime;

        /* Check if recompilation needed */
        if (sourceStats.mtime > compiledStats.mtime) {
          logger.info('ASSET', 'WorldC file needs recompilation', {
            source: filePath,
            compiled: compiledPath
          });
        }
      }

      return metadata;
    } catch (error) {
      logger.error('ASSET', 'Failed to analyze WorldC file', {
        path: filePath,
        error
      });

      return {
        version: '0.2.0',
        target: 'typescript',
        dependencies: [],
        exports: [],
        compiled: new Date(),
        hasErrors: true,
        errorCount: 1,
        warningCount: 0,
        animations: [],
        format: 'worldc'
      };
    }
  }
  /*

         triggerWorldCCompilation()
	         ---
	         Trigger compilation of WorldC file when changed.

*/
  public async triggerWorldCCompilation(filePath: string): Promise<boolean> {
    /* ASSERTION: filePath must be provided */
    console.assert(filePath != null, 'triggerWorldCCompilation: filePath cannot be null');
    console.assert(
      typeof filePath === 'string',
      'triggerWorldCCompilation: filePath must be string'
    );

    if (!filePath || typeof filePath !== 'string') {
      logger.error('ASSET', 'Invalid filePath provided to triggerWorldCCompilation', { filePath });
      return false;
    }

    if (!this.isWorldCFile(filePath)) {
      return false;
    }

    if (!this.projectPath) {
      logger.warn('ASSET', 'No project path set for WorldC compilation');
      return false;
    }

    try {
      logger.info('ASSET', 'Triggering WorldC compilation', { path: filePath });

      /* This would integrate with the build manager */
      /* For now, just update metadata */
      const relativePath = path.relative(this.projectPath, filePath);
      if (this.metadataCache.has(relativePath)) {
        const metadata = this.metadataCache.get(relativePath);
        if (metadata && metadata.worldcInfo) {
          metadata.worldcInfo = await this.analyzeWorldCFile(filePath);
          this.metadataCache.set(relativePath, metadata);
        }
      }

      return true;
    } catch (error) {
      logger.error('ASSET', 'WorldC compilation trigger failed', {
        path: filePath,
        error
      });
      return false;
    }
  }
  /*

         setProjectPath()
	         ---
	         Sets the current project path for asset operations.

*/
  public setProjectPath(projectPath: string | null): void {
    /* ASSERTION: if projectPath provided, must be string */
    console.assert(
      projectPath === null || typeof projectPath === 'string',
      'setProjectPath: projectPath must be string or null'
    );

    if (projectPath !== null && typeof projectPath !== 'string') {
      logger.error('ASSET', 'Invalid projectPath type provided', {
        projectPath,
        type: typeof projectPath
      });
      return;
    }

    this.projectPath = projectPath;
    this.clearCaches();

    if (projectPath) {
      logger.info('ASSET', 'Project path set', { path: projectPath });
    }
  }

  /**
   * getAssetsPath()
   *
   * Returns the assets directory path for the current project.
   */
  public getAssetsPath(): string | null {
    /* ASSERTION: projectPath validation if present */
    console.assert(
      this.projectPath === null || typeof this.projectPath === 'string',
      'getAssetsPath: projectPath must be string or null'
    );

    if (!this.projectPath) {
      return null;
    }

    /* ASSERTION: path.join will return valid string */
    const assetsPath = path.join(this.projectPath, 'assets');
    console.assert(
      typeof assetsPath === 'string' && assetsPath.length > 0,
      'getAssetsPath: generated path must be non-empty string'
    );

    return assetsPath;
  }

  /**
   * initializeAssetDirectory()
   *
   * Creates the asset directory structure for a new project.
   */
  public async initializeAssetDirectory(): Promise<void> {
    /* ASSERTION: this method requires valid project state */
    console.assert(this.projectPath !== null, 'initializeAssetDirectory: requires project path');

    const assetsPath = this.getAssetsPath();

    /* ASSERTION: assetsPath must be valid after project path check */
    console.assert(
      assetsPath !== null && typeof assetsPath === 'string',
      'initializeAssetDirectory: assetsPath must be valid string'
    );

    if (!assetsPath) {
      logger.error('ASSET', 'Cannot initialize asset directory without project path');
      throw new FileSystemError('No project path set');
    }

    try {
      await fileSystem.ensureDirectory(assetsPath);
      await fileSystem.ensureDirectory(path.join(assetsPath, 'textures'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'audio'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'models'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'scripts'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'scenes'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'materials'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'fonts'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'data'));
      await fileSystem.ensureDirectory(path.join(assetsPath, 'shaders'));

      logger.info('ASSET', 'Asset directory structure created', {
        path: assetsPath
      });
    } catch (error) {
      logger.error('ASSET', 'Failed to initialize asset directory', {
        path: assetsPath,
        error: error
      });

      throw new FileSystemError('Failed to initialize asset directory', {
        path: assetsPath,
        error: error
      });
    }
  }

  /**
   * listAssets()
   *
   * Lists all assets in the specified directory.
   */
  public async listAssets(relativePath: string = ''): Promise<AssetItem[]> {
    /* ASSERTION: relativePath parameter validation */
    console.assert(typeof relativePath === 'string', 'listAssets: relativePath must be string');
    console.assert(
      !relativePath.includes('..'),
      'listAssets: relativePath cannot contain parent directory references'
    );

    if (typeof relativePath !== 'string') {
      logger.error('ASSET', 'Invalid relativePath type in listAssets', {
        relativePath,
        type: typeof relativePath
      });
      return [];
    }

    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      logger.warn('ASSET', 'Cannot list assets without project path');
      return [];
    }

    const fullPath = path.join(assetsPath, relativePath);

    try {
      const entries = await fileSystem.listDirectory(fullPath);
      const assets: AssetItem[] = [];

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry);
        const entryRelativePath = path.join(relativePath, entry);

        try {
          const asset = await this.createAssetItem(entryPath, entryRelativePath);

          assets.push(asset);
        } catch (error) {
          logger.warn('ASSET', 'Failed to create asset item', {
            path: entryPath,
            error: error
          });
        }
      }

      assets.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') {
          return -1;
        }

        if (a.type !== 'folder' && b.type === 'folder') {
          return 1;
        }

        return a.name.localeCompare(b.name);
      });

      this.cacheAssets(relativePath, assets);

      return assets;
    } catch (error) {
      logger.error('ASSET', 'Failed to list assets', {
        path: fullPath,
        error: error
      });

      throw new FileSystemError('Failed to list assets', {
        path: fullPath,
        error: error
      });
    }
  }

  /**
   * createAssetItem()
   *
   * Creates an asset item from file system entry.
   */
  private async createAssetItem(fullPath: string, relativePath: string): Promise<AssetItem> {
    /* ASSERTION: parameter validation */
    console.assert(
      typeof fullPath === 'string' && fullPath.length > 0,
      'createAssetItem: fullPath must be non-empty string'
    );
    console.assert(
      typeof relativePath === 'string',
      'createAssetItem: relativePath must be string'
    );

    if (!fullPath || typeof fullPath !== 'string') {
      logger.error('ASSET', 'Invalid fullPath in createAssetItem', { fullPath });
      throw new Error('Invalid fullPath provided to createAssetItem');
    }

    if (typeof relativePath !== 'string') {
      logger.error('ASSET', 'Invalid relativePath in createAssetItem', { relativePath });
      throw new Error('Invalid relativePath provided to createAssetItem');
    }

    const stats = await fileSystem.getFileStats(fullPath);

    /* ASSERTION: fileSystem operation must return valid stats */
    console.assert(
      stats !== null && typeof stats === 'object',
      'createAssetItem: stats must be valid object'
    );

    const name = path.basename(fullPath);
    const extension = path.extname(name).toLowerCase();
    const type = this.determineAssetType(fullPath, stats.isDirectory());

    let metadata = this.metadataCache.get(relativePath);

    if (!metadata) {
      metadata = {
        id: this.generateAssetId(relativePath),
        imported: stats.birthtime,
        tags: [],
        description: undefined,
        thumbnail: undefined
      };

      /* Add WorldC-specific metadata for .wc files */
      if (this.isWorldCFile(relativePath)) {
        metadata.worldcInfo = await this.analyzeWorldCFile(fullPath);
      }

      this.metadataCache.set(relativePath, metadata);
    }

    const asset: AssetItem = {
      name: name,
      type: type,
      path: fullPath,
      relativePath: relativePath,
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      extension: extension,
      metadata: metadata
    };

    if (type === 'folder') {
      asset.children = [];
    }

    return asset;
  }

  /**
   * determineAssetType()
   *
   * Determines asset type from file path and metadata.
   */
  private determineAssetType(filePath: string, isDirectory: boolean): AssetType {
    /* ASSERTION: parameter validation */
    console.assert(
      typeof filePath === 'string' && filePath.length > 0,
      'determineAssetType: filePath must be non-empty string'
    );
    console.assert(
      typeof isDirectory === 'boolean',
      'determineAssetType: isDirectory must be boolean'
    );

    if (!filePath || typeof filePath !== 'string') {
      logger.error('ASSET', 'Invalid filePath in determineAssetType', { filePath });
      return 'unknown';
    }

    if (isDirectory) {
      return 'folder';
    }

    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.bmp':
      case '.tiff':
      case '.tga':
      case '.webp':
      case '.svg':
        return 'image';

      case '.mp3':
      case '.wav':
      case '.ogg':
      case '.flac':
      case '.aac':
      case '.m4a':
        return 'audio';

      case '.obj':
      case '.fbx':
      case '.gltf':
      case '.glb':
      case '.dae':
      case '.3ds':
      case '.blend':
        return 'model';

      case '.wc':
      case '.worldc':
        return 'script';
      case '.ts':
      case '.js':
        return 'script';

      case '.scene':
      case '.worldscene':
        return 'scene';

      case '.mat':
      case '.material':
        return 'material';

      case '.ttf':
      case '.otf':
      case '.woff':
      case '.woff2':
        return 'font';

      case '.json':
      case '.xml':
      case '.csv':
      case '.txt':
        return 'data';

      case '.glsl':
      case '.hlsl':
      case '.wgsl':
      case '.vert':
      case '.frag':
      case '.compute':
        return 'shader';

      default:
        return 'unknown';
    }
  }

  /**
   * importAssets()
   *
   * Imports external files into the project assets directory.
   */
  public async importAssets(
    filePaths: string[],
    options: AssetImportOptions = {
      preserveStructure: false,
      generateThumbnails: true,
      overwriteExisting: false
    }
  ): Promise<AssetItem[]> {
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      throw new FileSystemError('No project path set');
    }

    const importedAssets: AssetItem[] = [];

    for (const filePath of filePaths) {
      try {
        const asset = await this.importSingleAsset(filePath, assetsPath, options);

        importedAssets.push(asset);
      } catch (error) {
        logger.error('ASSET', 'Failed to import asset', {
          path: filePath,
          error: error
        });
      }
    }

    this.clearCaches();

    logger.info('ASSET', 'Assets imported', {
      count: importedAssets.length,
      failed: filePaths.length - importedAssets.length
    });

    return importedAssets;
  }

  /**
   * importSingleAsset()
   *
   * Imports a single asset file.
   */
  private async importSingleAsset(
    sourcePath: string,
    assetsPath: string,
    options: AssetImportOptions
  ): Promise<AssetItem> {
    const fileName = path.basename(sourcePath);
    const _fileExtension = path.extname(fileName).toLowerCase();
    const assetType = this.determineAssetType(sourcePath, false);

    const targetFolder = options.targetFolder ?? this.getDefaultFolder(assetType);
    let targetPath = path.join(assetsPath, targetFolder, fileName);

    if ((await fileSystem.exists(targetPath)) && !options.overwriteExisting) {
      targetPath = await this.generateUniqueFileName(targetPath);
    }

    await fileSystem.ensureDirectory(path.dirname(targetPath));
    await copyFileAsync(sourcePath, targetPath);

    const relativePath = path.relative(assetsPath, targetPath);
    const asset = await this.createAssetItem(targetPath, relativePath);

    if (options.generateThumbnails && assetType === 'image') {
      try {
        await this.generateThumbnail(asset);
      } catch (error) {
        logger.warn('ASSET', 'Failed to generate thumbnail', {
          path: targetPath,
          error: error
        });
      }
    }

    logger.debug('ASSET', 'Asset imported', {
      source: sourcePath,
      target: targetPath
    });

    return asset;
  }

  /**
   * getDefaultFolder()
   *
   * Returns default folder for asset type.
   */
  private getDefaultFolder(assetType: AssetType): string {
    switch (assetType) {
      case 'image':
        return 'textures';
      case 'audio':
        return 'audio';
      case 'model':
        return 'models';
      case 'script':
        return 'scripts';
      case 'scene':
        return 'scenes';
      case 'material':
        return 'materials';
      case 'font':
        return 'fonts';
      case 'data':
        return 'data';
      case 'shader':
        return 'shaders';
      default:
        return '';
    }
  }

  /**
   * generateUniqueFileName()
   *
   * Generates unique file name to avoid conflicts.
   */
  private async generateUniqueFileName(filePath: string): Promise<string> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    let counter = 1;
    let uniquePath = filePath;

    while (await fileSystem.exists(uniquePath)) {
      const uniqueName = `${name}_${counter}${ext}`;
      uniquePath = path.join(dir, uniqueName);
      counter++;
    }

    return uniquePath;
  }

  /**
   * createFolder()
   *
   * Creates a new folder in the assets directory.
   */
  public async createFolder(relativePath: string, name: string): Promise<AssetItem> {
    /* ASSERTION: parameter validation */
    console.assert(typeof relativePath === 'string', 'createFolder: relativePath must be string');
    console.assert(
      typeof name === 'string' && name.length > 0,
      'createFolder: name must be non-empty string'
    );
    console.assert(
      !name.includes('/') && !name.includes('\\'),
      'createFolder: name cannot contain path separators'
    );

    if (typeof relativePath !== 'string' || typeof name !== 'string' || !name.trim()) {
      logger.error('ASSET', 'Invalid parameters in createFolder', { relativePath, name });
      throw new Error('Invalid parameters provided to createFolder');
    }

    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      logger.error('ASSET', 'Cannot create folder without project path');
      throw new FileSystemError('No project path set');
    }

    const folderPath = path.join(assetsPath, relativePath, name);

    if (await fileSystem.exists(folderPath)) {
      throw new FileSystemError('Folder already exists', {
        path: folderPath
      });
    }

    await fileSystem.ensureDirectory(folderPath);

    const folderRelativePath = path.join(relativePath, name);
    const folder = await this.createAssetItem(folderPath, folderRelativePath);

    this.clearCaches();

    logger.info('ASSET', 'Folder created', {
      path: folderPath
    });

    return folder;
  }

  /**
   * renameAsset()
   *
   * Renames an asset file or folder.
   */
  public async renameAsset(relativePath: string, newName: string): Promise<AssetItem> {
    /* ASSERTION: parameter validation */
    console.assert(
      typeof relativePath === 'string' && relativePath.length > 0,
      'renameAsset: relativePath must be non-empty string'
    );
    console.assert(
      typeof newName === 'string' && newName.length > 0,
      'renameAsset: newName must be non-empty string'
    );
    console.assert(
      !newName.includes('/') && !newName.includes('\\'),
      'renameAsset: newName cannot contain path separators'
    );

    if (
      !relativePath ||
      typeof relativePath !== 'string' ||
      !newName ||
      typeof newName !== 'string'
    ) {
      logger.error('ASSET', 'Invalid parameters in renameAsset', { relativePath, newName });
      throw new Error('Invalid parameters provided to renameAsset');
    }

    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      logger.error('ASSET', 'Cannot rename asset without project path');
      throw new FileSystemError('No project path set');
    }

    const oldPath = path.join(assetsPath, relativePath);
    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);

    if (await fileSystem.exists(newPath)) {
      throw new FileSystemError('Asset with new name already exists', {
        oldPath: oldPath,
        newPath: newPath
      });
    }

    await renameAsync(oldPath, newPath);

    const newRelativePath = path.relative(assetsPath, newPath);
    const asset = await this.createAssetItem(newPath, newRelativePath);

    this.clearCaches();

    logger.info('ASSET', 'Asset renamed', {
      oldPath: oldPath,
      newPath: newPath
    });

    return asset;
  }

  /**
   * deleteAsset()
   *
   * Deletes an asset file or folder.
   */
  public async deleteAsset(relativePath: string): Promise<void> {
    /* ASSERTION: parameter validation */
    console.assert(
      typeof relativePath === 'string' && relativePath.length > 0,
      'deleteAsset: relativePath must be non-empty string'
    );
    console.assert(
      !relativePath.includes('..'),
      'deleteAsset: relativePath cannot contain parent directory references'
    );

    if (!relativePath || typeof relativePath !== 'string') {
      logger.error('ASSET', 'Invalid relativePath in deleteAsset', { relativePath });
      throw new Error('Invalid relativePath provided to deleteAsset');
    }

    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      logger.error('ASSET', 'Cannot delete asset without project path');
      throw new FileSystemError('No project path set');
    }

    const fullPath = path.join(assetsPath, relativePath);
    const isDirectory = await fileSystem.isDirectory(fullPath);

    if (isDirectory) {
      await fileSystem.deleteDirectory(fullPath);
    } else {
      await fileSystem.deleteFile(fullPath);
    }

    this.clearCaches();

    logger.info('ASSET', 'Asset deleted', {
      path: fullPath
    });
  }

  /*

           searchAssets()
	         ---
	         Searches for assets matching the specified criteria.

  */
  public async searchAssets(options: AssetSearchOptions): Promise<AssetItem[]> {
    /* ASSERTION: options parameter validation */
    console.assert(
      options !== null && typeof options === 'object',
      'searchAssets: options must be valid object'
    );
    console.assert(Array.isArray(options.types), 'searchAssets: options.types must be array');

    if (!options || typeof options !== 'object') {
      logger.error('ASSET', 'Invalid options in searchAssets', { options });
      return [];
    }
    const results: AssetItem[] = [];
    const searchPath = options.folder ?? '';

    const assets = await this.listAssets(searchPath);

    for (const asset of assets) {
      if (this.matchesSearch(asset, options)) {
        results.push(asset);
      }

      if (options.recursive && asset.type === 'folder') {
        const childPath = path.join(searchPath, asset.name);
        const childResults = await this.searchAssets({
          ...options,
          folder: childPath
        });

        results.push(...childResults);
      }
    }

    return results;
  }

  /*

           matchesSearch()
	         ---
	         Checks if asset matches search criteria.

  */
  private matchesSearch(asset: AssetItem, options: AssetSearchOptions): boolean {
    /* ASSERTION: parameter validation */
    console.assert(
      asset !== null && typeof asset === 'object',
      'matchesSearch: asset must be valid object'
    );
    console.assert(
      options !== null && typeof options === 'object',
      'matchesSearch: options must be valid object'
    );

    if (!asset || !options) {
      logger.error('ASSET', 'Invalid parameters in matchesSearch', { asset, options });
      return false;
    }
    if (options.types.length > 0 && !options.types.includes(asset.type)) {
      return false;
    }

    if (options.query) {
      const query = options.query.toLowerCase();
      const name = asset.name.toLowerCase();

      if (!name.includes(query)) {
        return false;
      }
    }

    if (options.tags.length > 0) {
      const hasMatchingTag = options.tags.some((tag) => asset.metadata.tags.includes(tag));

      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }

  /*

           generateThumbnail()
	         ---
	         Generates thumbnail for image asset.

  */
  private async generateThumbnail(asset: AssetItem): Promise<void> {
    /* ASSERTION: asset parameter validation */
    console.assert(
      asset !== null && typeof asset === 'object',
      'generateThumbnail: asset must be valid object'
    );
    console.assert(typeof asset.type === 'string', 'generateThumbnail: asset.type must be string');

    if (!asset || typeof asset !== 'object') {
      logger.error('ASSET', 'Invalid asset in generateThumbnail', { asset });
      return;
    }
    if (asset.type !== 'image' && asset.type !== 'font') {
      return;
    }

    try {
      const thumbnailPath = await this.createThumbnailPath(asset);

      if (asset.type === 'font') {
        await this.generateFontPreview(asset.path, thumbnailPath);
      }

      this.thumbnailCache.set(asset.relativePath, thumbnailPath);
      asset.metadata.thumbnail = thumbnailPath;

      logger.debug('ASSET', 'Thumbnail generated', {
        asset: asset.path,
        thumbnail: thumbnailPath,
        type: asset.type
      });
    } catch (error) {
      logger.warn('ASSET', 'Thumbnail generation failed', {
        asset: asset.path,
        error: error
      });
    }
  }

  /*

           createThumbnailPath()
	         ---
	         Creates thumbnail file path for asset.

  */
  private async createThumbnailPath(asset: AssetItem): Promise<string> {
    /* ASSERTION: asset parameter validation */
    console.assert(
      asset !== null && typeof asset === 'object',
      'createThumbnailPath: asset must be valid object'
    );
    console.assert(
      typeof asset.relativePath === 'string',
      'createThumbnailPath: asset.relativePath must be string'
    );

    if (!asset || typeof asset.relativePath !== 'string') {
      logger.error('ASSET', 'Invalid asset in createThumbnailPath', { asset });
      throw new Error('Invalid asset provided to createThumbnailPath');
    }
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
      throw new FileSystemError('No project path set');
    }

    const thumbnailDir = path.join(assetsPath, '.thumbnails');
    await fileSystem.ensureDirectory(thumbnailDir);

    const assetId = asset.metadata.id;
    const thumbnailName = `${assetId}.png`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailName);

    return thumbnailPath;
  }

  /*

           generateFontPreview()
	         ---
	         generates a text preview thumbnail for font assets.
	         creates a canvas-based preview showing sample text
	         rendered with the specified font file.

  */
  private async generateFontPreview(fontPath: string, outputPath: string): Promise<void> {
    /* ASSERTION: parameter validation */
    console.assert(
      typeof fontPath === 'string' && fontPath.length > 0,
      'generateFontPreview: fontPath must be non-empty string'
    );
    console.assert(
      typeof outputPath === 'string' && outputPath.length > 0,
      'generateFontPreview: outputPath must be non-empty string'
    );

    try {
      let createCanvas: any;
      try {
        const canvasModule = await import('canvas');
        createCanvas = canvasModule.createCanvas;
      } catch (canvasError) {
        logger.warn('ASSET', 'Canvas module not available, skipping font preview generation', {
          error: canvasError
        });
        await this.generateFallbackFontPreview(outputPath);
        return;
      }

      const canvas = createCanvas(256, 128);
      const ctx = canvas.getContext('2d');

      /* background */
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 128);

      /* border */
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 256, 128);

      /* load font and render preview text */
      const fontName = path.basename(fontPath, path.extname(fontPath));
      const previewText = 'Aa Bb Cc\n123 456';

      ctx.fillStyle = '#333333';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = previewText.split('\n');
      const lineHeight = 30;
      const startY = 128 / 2 - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, 128, startY + index * lineHeight);
      });

      /* font name label */
      ctx.fillStyle = '#666666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fontName, 128, 115);

      /* save thumbnail */
      const buffer = canvas.toBuffer('image/png');
      await _writeFileAsync(outputPath, buffer);

      logger.debug('ASSET', 'Font preview generated', {
        font: fontPath,
        preview: outputPath
      });
    } catch (error) {
      logger.warn('ASSET', 'Font preview generation failed', {
        font: fontPath,
        error: error
      });

      /* fallback: create simple text-based thumbnail */
      await this.generateFallbackFontPreview(outputPath);
    }
  }

  /*

           generateFallbackFontPreview()
	         ---
	         creates a simple fallback preview for fonts when
	         canvas rendering fails.

  */
  private async generateFallbackFontPreview(outputPath: string): Promise<void> {
    try {
      let createCanvas: any;
      try {
        const canvasModule = await import('canvas');
        createCanvas = canvasModule.createCanvas;
      } catch (canvasError) {
        logger.error('ASSET', 'Canvas module not available for fallback font preview', {
          error: canvasError
        });
        return;
      }

      const canvas = createCanvas(256, 128);
      const ctx = canvas.getContext('2d');

      /* simple background */
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, 256, 128);

      /* border */
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 254, 126);

      /* font icon placeholder */
      ctx.fillStyle = '#999999';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Aa', 128, 64);

      const buffer = canvas.toBuffer('image/png');
      await _writeFileAsync(outputPath, buffer);
    } catch (fallbackError) {
      logger.error('ASSET', 'Fallback font preview generation failed', {
        error: fallbackError
      });
    }
  }

  /*

           generateAssetId()
	         ---
	         generates unique asset identifier

  */
  private generateAssetId(relativePath: string): string {
    /* ASSERTION: relativePath parameter validation */
    console.assert(
      typeof relativePath === 'string',
      'generateAssetId: relativePath must be string'
    );
    console.assert(relativePath.length > 0, 'generateAssetId: relativePath must not be empty');

    if (typeof relativePath !== 'string' || relativePath.length === 0) {
      logger.error('ASSET', 'Invalid relativePath in generateAssetId', { relativePath });
      return `invalid_${Date.now().toString(36)}`;
    }
    const normalized = relativePath.replace(/[\\/]/g, '_');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    return `${normalized}_${timestamp}_${random}`;
  }

  /*

           cacheAssets()
	         ---
	         Caches asset list for performance.

  */
  private cacheAssets(relativePath: string, assets: AssetItem[]): void {
    /* ASSERTION: parameter validation */
    console.assert(typeof relativePath === 'string', 'cacheAssets: relativePath must be string');
    console.assert(Array.isArray(assets), 'cacheAssets: assets must be array');

    if (typeof relativePath !== 'string' || !Array.isArray(assets)) {
      logger.error('ASSET', 'Invalid parameters in cacheAssets', { relativePath, assets });
      return;
    }
    for (const asset of assets) {
      this.assetCache.set(asset.relativePath, asset);
    }
  }

  /*

           clearCaches()
	         ---
	         Clears all internal caches.

  */
  private clearCaches(): void {
    /* ASSERTION: cache objects must exist */
    console.assert(this.assetCache instanceof Map, 'clearCaches: assetCache must be Map instance');
    console.assert(
      this.metadataCache instanceof Map,
      'clearCaches: metadataCache must be Map instance'
    );
    this.assetCache.clear();
    this.metadataCache.clear();
    this.thumbnailCache.clear();
  }

  /**
   * getAssetMetadata()
   *
   * Returns metadata for specific asset.
   */
  public getAssetMetadata(relativePath: string): AssetMetadata | null {
    return this.metadataCache.get(relativePath) ?? null;
  }

  /**
   * updateAssetMetadata()
   *
   * Updates metadata for specific asset.
   */
  public updateAssetMetadata(relativePath: string, metadata: Partial<AssetMetadata>): void {
    const existing = this.metadataCache.get(relativePath);

    if (existing) {
      Object.assign(existing, metadata);
    }
  }

  /**
   * getThumbnailPath()
   *
   * Returns thumbnail path for asset.
   */
  public getThumbnailPath(relativePath: string): string | null {
    return this.thumbnailCache.get(relativePath) ?? null;
  }
}

export const assetManager = new AssetManager();
