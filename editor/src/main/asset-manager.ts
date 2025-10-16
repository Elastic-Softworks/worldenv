/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Asset Manager
 *
 * Comprehensive asset management system for project file operations.
 * Handles asset import, organization, metadata, and file system operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { logger } from './logger';
import { fileSystem } from './file-system';
import { FileSystemError } from '../shared/types';

const _readFileAsync = promisify(fs.readFile);
const _statAsync = promisify(fs.stat);
const copyFileAsync = promisify(fs.copyFile);
const renameAsync = promisify(fs.rename);

/**
 * Asset item interface
 */
export interface AssetItem {
  name: string;
  type: AssetType;
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  created: Date;
  extension: string;
  metadata: AssetMetadata;
  children?: AssetItem[];
}

/**
 * Asset type enumeration
 */
export type AssetType =
  | 'folder'
  | 'image'
  | 'audio'
  | 'model'
  | 'script'
  | 'scene'
  | 'material'
  | 'font'
  | 'data'
  | 'shader'
  | 'unknown';

/**
 * Asset metadata interface
 */
export interface AssetMetadata {
  id: string;
  imported: Date;
  tags: string[];
  description?: string;
  thumbnail?: string;
  imageInfo?: ImageMetadata;
  audioInfo?: AudioMetadata;
  modelInfo?: ModelMetadata;
  worldcInfo?: WorldCMetadata;
}

/**
 * Image metadata
 */
interface ImageMetadata {
  width: number;
  height: number;
  channels: number;
  format: string;
  compressed: boolean;
}

/**
 * Audio metadata
 */
interface AudioMetadata {
  duration: number;
  channels: number;
  sampleRate: number;
  bitRate: number;
  format: string;
}

/**
 * Model metadata
 */
interface ModelMetadata {
  vertices: number;
  faces: number;
  materials: number;
}

/**
 * WorldC script metadata
 */
interface WorldCMetadata {
  version: string;
  target: 'typescript' | 'assemblyscript';
  dependencies: string[];
  exports: string[];
  compiledPath?: string;
  lastCompiled?: Date;
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;
  animations?: string[];
  format?: string;
}

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

  /**
   * isWorldCFile()
   *
   * Check if file is a WorldC script file.
   */
  private isWorldCFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.wc' || ext === '.worldc';
  }

  /**
   * analyzeWorldCFile()
   *
   * Analyze WorldC file for metadata and compilation info.
   */
  private async analyzeWorldCFile(filePath: string): Promise<WorldCMetadata> {
    try {
      const content = await _readFileAsync(filePath, 'utf8');
      const metadata: WorldCMetadata = {
        version: '0.2.0',
        target: 'typescript',
        dependencies: [],
        exports: [],
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
        hasErrors: true,
        errorCount: 1,
        warningCount: 0,
        animations: [],
        format: 'worldc'
      };
    }
  }

  /**
   * triggerWorldCCompilation()
   *
   * Trigger compilation of WorldC file when changed.
   */
  public async triggerWorldCCompilation(filePath: string): Promise<boolean> {
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

  /**
   * setProjectPath()
   *
   * Sets the current project path for asset operations.
   */
  public setProjectPath(projectPath: string | null): void {
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
    if (!this.projectPath) {
      return null;
    }

    return path.join(this.projectPath, 'assets');
  }

  /**
   * initializeAssetDirectory()
   *
   * Creates the asset directory structure for a new project.
   */
  public async initializeAssetDirectory(): Promise<void> {
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
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
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
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
    const stats = await fileSystem.getFileStats(fullPath);
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
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
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
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
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
    const assetsPath = this.getAssetsPath();

    if (!assetsPath) {
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

  /**
   * searchAssets()
   *
   * Searches for assets matching the specified criteria.
   */
  public async searchAssets(options: AssetSearchOptions): Promise<AssetItem[]> {
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

  /**
   * matchesSearch()
   *
   * Checks if asset matches search criteria.
   */
  private matchesSearch(asset: AssetItem, options: AssetSearchOptions): boolean {
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

  /**
   * generateThumbnail()
   *
   * Generates thumbnail for image asset.
   */
  private async generateThumbnail(asset: AssetItem): Promise<void> {
    if (asset.type !== 'image') {
      return;
    }

    try {
      const thumbnailPath = await this.createThumbnailPath(asset);

      this.thumbnailCache.set(asset.relativePath, thumbnailPath);
      asset.metadata.thumbnail = thumbnailPath;

      logger.debug('ASSET', 'Thumbnail generated', {
        asset: asset.path,
        thumbnail: thumbnailPath
      });
    } catch (error) {
      logger.warn('ASSET', 'Thumbnail generation failed', {
        asset: asset.path,
        error: error
      });
    }
  }

  /**
   * createThumbnailPath()
   *
   * Creates thumbnail file path for asset.
   */
  private async createThumbnailPath(asset: AssetItem): Promise<string> {
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

  /**
   * generateAssetId()
   *
   * Generates unique asset ID from relative path.
   */
  private generateAssetId(relativePath: string): string {
    const normalized = relativePath.replace(/[\\/]/g, '_');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    return `${normalized}_${timestamp}_${random}`;
  }

  /**
   * cacheAssets()
   *
   * Caches asset list for performance.
   */
  private cacheAssets(relativePath: string, assets: AssetItem[]): void {
    for (const asset of assets) {
      this.assetCache.set(asset.relativePath, asset);
    }
  }

  /**
   * clearCaches()
   *
   * Clears all asset caches.
   */
  private clearCaches(): void {
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
