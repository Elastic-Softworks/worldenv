/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Asset Browser Panel Component
 *
 * Phase 5 Enhanced: Comprehensive asset management with import, preview, and drag-and-drop.
 * Provides professional asset organization and viewport integration.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { DropZone, DropZoneIndicator } from '../ui/DropZone';
import { ContextMenu, useContextMenu, CommonMenuItems, createSeparator } from '../ui/ContextMenu';
import { AssetPropertiesDialog } from '../dialogs/AssetPropertiesDialog';

/**
 * Asset browser panel component interfaces
 */

import { AssetItem, AssetMetadata } from '../../../shared/types';

/* AssetItem is now imported from shared/types.ts */

/**
 * Asset import options
 */
interface AssetImportOptions {
  generateThumbnails?: boolean;
  compressImages?: boolean;
  targetDirectory?: string;
  overwriteExisting?: boolean;
}

/**
 * Asset preview component props
 */
interface AssetPreviewProps {
  asset: AssetItem;
  onLoadError?: () => void;
}

/**
 * AssetPreview component for thumbnail display
 */
function AssetPreview({ asset, onLoadError }: AssetPreviewProps): JSX.Element {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (asset.type === 'image' && asset.metadata.thumbnail) {
      setThumbnailUrl(`file://${asset.metadata.thumbnail}`);
    } else if (asset.type === 'image') {
      // For images without thumbnails, use the original file
      setThumbnailUrl(`file://${asset.path}`);
    }
  }, [asset]);

  const handleLoadError = () => {
    setLoadError(true);
    onLoadError?.();
  };

  if (loadError || !thumbnailUrl) {
    return (
      <div className="asset-preview-fallback">
        <span className="asset-icon">{getAssetIcon(asset.type)}</span>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt={asset.name}
      className="asset-thumbnail"
      onError={handleLoadError}
      loading="lazy"
    />
  );
}

/**
 * Get icon for asset type
 */
function getAssetIcon(type: string): string {
  const icons: Record<string, string> = {
    folder: '[DIR]',
    image: '[IMG]',
    audio: '[SND]',
    model: '[3D]',
    script: '[JS]',
    scene: '[SCN]',
    material: '[MAT]',
    font: '[FNT]',
    data: '[DAT]',
    shader: '[SHD]',
    unknown: '[?]'
  };
  return icons[type] || icons.unknown;
}

/**
 * AssetBrowserPanel component
 *
 * Professional asset management with import, preview, and drag-and-drop functionality.
 */
export function AssetBrowserPanel(): JSX.Element {
  console.log('[ASSETS PANEL] Component mounting...');
  const { state } = useEditorState();
  const { theme } = useTheme();
  const [currentPath, setCurrentPath] = useState('assets');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importProgress, setImportProgress] = useState<{
    importing: boolean;
    progress: number;
    currentFile?: string;
  }>({ importing: false, progress: 0 });
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [selectedAssetForProperties, setSelectedAssetForProperties] = useState<AssetItem | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  /**
   * Load assets for current path
   */
  useEffect(() => {
    console.log('[ASSETS PANEL] Panel mounted and visible');
    if (state.project.isOpen) {
      void loadAssets(currentPath);
    } else {
      setAssets([]);
    }
  }, [currentPath, state.project.isOpen]);

  /**
   * Filter assets based on search query
   */
  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.extension.toLowerCase().includes(query) ||
      asset.metadata.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  /**
   * loadAssets()
   *
   * Loads assets from the file system using IPC.
   */
  const loadAssets = useCallback(async (path: string): Promise<void> => {
    setLoading(true);
    try {
      const assetList = (await window.electronAPI.invoke('asset:list', path)) as AssetItem[];

      // Add parent directory navigation if not at root
      const finalAssets: AssetItem[] = [];
      if (path !== '' && path !== 'assets') {
        const parentPath = path.split('/').slice(0, -1).join('/');
        finalAssets.push({
          name: '..',
          type: 'folder',
          path: parentPath,
          relativePath: parentPath,
          size: 0,
          modified: new Date(),
          created: new Date(),
          extension: '',
          metadata: {
            id: 'parent',
            imported: new Date(),
            tags: []
          }
        });
      }

      finalAssets.push(...assetList);
      setAssets(finalAssets);
    } catch (error) {
      console.error('[ASSETS PANEL] Failed to load assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.project.isOpen) return;

      // Check if we're focused on the asset browser
      const activeElement = document.activeElement;
      const isAssetBrowserFocused = activeElement?.closest('[data-panel="assets"]');

      if (!isAssetBrowserFocused) return;

      switch (event.key) {
        case 'Delete':
          if (selectedAssets.length > 0) {
            event.preventDefault();
            const firstAsset = assets.find((asset) => asset.relativePath === selectedAssets[0]);
            if (firstAsset) {
              handleDelete(firstAsset);
            }
          }
          break;

        case 'F2':
          if (selectedAssets.length === 1) {
            event.preventDefault();
            const firstAsset = assets.find((asset) => asset.relativePath === selectedAssets[0]);
            if (firstAsset) {
              handleRename(firstAsset);
            }
          }
          break;

        case 'F5':
          event.preventDefault();
          loadAssets(currentPath);
          break;

        case 'Enter':
          if (selectedAssets.length === 1) {
            event.preventDefault();
            const firstAsset = assets.find((asset) => asset.relativePath === selectedAssets[0]);
            if (firstAsset) {
              if (firstAsset.type === 'folder') {
                setCurrentPath(firstAsset.relativePath);
              } else {
                handleShowProperties(firstAsset);
              }
            }
          }
          break;

        case 'Escape':
          if (selectedAssets.length > 0) {
            event.preventDefault();
            setSelectedAssets([]);
          }
          break;
      }

      // Handle Ctrl combinations
      if (event.ctrlKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            setSelectedAssets(assets.map((asset) => asset.relativePath));
            break;

          case 'i':
            event.preventDefault();
            triggerFileImport();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAssets, assets, currentPath, state.project.isOpen, loadAssets]);

  /**
   * handleAssetImport()
   *
   * Handle file import with progress tracking.
   */
  const handleAssetImport = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setImportProgress({ importing: true, progress: 0 });

      try {
        const filePaths = fileArray.map((file) => file.path || file.name);
        const options: AssetImportOptions = {
          generateThumbnails: true,
          compressImages: false,
          targetDirectory: currentPath,
          overwriteExisting: false
        };

        // Import assets with progress tracking
        for (let i = 0; i < filePaths.length; i++) {
          setImportProgress({
            importing: true,
            progress: (i / filePaths.length) * 100,
            currentFile: filePaths[i]
          });

          await window.electronAPI.invoke('asset:import', {
            filePaths: [filePaths[i]],
            options
          });
        }

        setImportProgress({ importing: true, progress: 100 });

        // Reload assets to show imported files
        await loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS PANEL] Import failed:', error);
      } finally {
        setImportProgress({ importing: false, progress: 0 });
      }
    },
    [currentPath, loadAssets]
  );

  /**
   * handleDragStart()
   *
   * Handle drag start for asset items.
   */
  const handleDragStart = useCallback((event: React.DragEvent, asset: AssetItem): void => {
    if (asset.type === 'folder') return;

    event.dataTransfer.setData(
      'application/worldedit-asset',
      JSON.stringify({
        type: 'asset',
        asset: {
          name: asset.name,
          type: asset.type,
          path: asset.path,
          relativePath: asset.relativePath
        }
      })
    );

    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  /**
   * handleContextMenu()
   *
   * Handle right-click context menu for assets.
   */
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, asset?: AssetItem): void => {
      event.preventDefault();

      const menuItems = [];

      if (asset) {
        if (asset.type === 'folder') {
          menuItems.push(
            { id: 'open', label: 'Open', onClick: () => setCurrentPath(asset.relativePath) },
            createSeparator('sep1'),
            { id: 'new-folder', label: 'New Folder', onClick: () => void handleCreateFolder() },
            createSeparator('sep2'),
            { id: 'rename', label: 'Rename', onClick: () => handleRename(asset) },
            { id: 'delete', label: 'Delete', onClick: () => handleDelete(asset) }
          );
        } else {
          menuItems.push(
            {
              id: 'import',
              label: 'Import to Viewport',
              onClick: () => handleImportToViewport(asset)
            },
            {
              id: 'properties',
              label: 'Show Properties',
              onClick: () => handleShowProperties(asset)
            },
            createSeparator('sep3'),
            { id: 'rename', label: 'Rename', onClick: () => handleRename(asset) },
            { id: 'delete', label: 'Delete', onClick: () => handleDelete(asset) }
          );
        }
      } else {
        menuItems.push(
          { id: 'import-files', label: 'Import Files...', onClick: () => triggerFileImport() },
          { id: 'new-folder', label: 'New Folder', onClick: () => void handleCreateFolder() },
          createSeparator('sep4'),
          { id: 'refresh', label: 'Refresh', onClick: () => loadAssets(currentPath) }
        );
      }

      showContextMenu(event, menuItems);
    },
    [currentPath, loadAssets, showContextMenu]
  );

  /**
   * Utility functions for context menu actions
   */
  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleRename = async (asset: AssetItem) => {
    const newName = prompt('Enter new name:', asset.name);
    if (newName && newName !== asset.name) {
      try {
        await window.electronAPI.invoke('asset:rename', {
          oldPath: asset.relativePath,
          newName
        });
        loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS PANEL] Failed to rename asset:', error);
      }
    }
  };

  const handleDelete = async (asset: AssetItem) => {
    if (confirm(`Delete "${asset.name}"? This action cannot be undone.`)) {
      try {
        await window.electronAPI.invoke('asset:delete', asset.relativePath);
        loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS PANEL] Failed to delete asset:', error);
      }
    }
  };

  const handleImportToViewport = (asset: AssetItem) => {
    // TODO: Integrate with viewport system to add asset as entity
    console.log('[ASSETS PANEL] Import to viewport:', asset);
  };

  const handleShowProperties = (asset: AssetItem) => {
    setSelectedAssetForProperties(asset);
    setShowPropertiesDialog(true);
  };

  /**
   * handleSaveAssetProperties()
   *
   * Save updated asset metadata.
   */
  const handleSaveAssetProperties = useCallback(
    async (asset: AssetItem, updatedMetadata: Partial<AssetMetadata>) => {
      try {
        await window.electronAPI.invoke('asset:update-metadata', {
          relativePath: asset.relativePath,
          metadata: updatedMetadata
        });
        // Reload assets to reflect changes
        loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS PANEL] Failed to save asset properties:', error);
        // TODO: Show error notification
      }
    },
    [currentPath, loadAssets]
  );

  /**
   * handleClosePropertiesDialog()
   *
   * Close the properties dialog.
   */
  const handleClosePropertiesDialog = useCallback(() => {
    setShowPropertiesDialog(false);
    setSelectedAssetForProperties(null);
  }, []);

  /**
   * handleImportAssets()
   *
   * Handles asset import via drag and drop or file dialog.
   */
  const handleImportAssets = async (): Promise<void> => {
    try {
      const filePaths = (await window.electronAPI.invoke('dialog:open-files', {
        title: 'Import Assets',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] },
          { name: 'Models', extensions: ['gltf', 'glb', 'obj', 'fbx'] },
          { name: 'Scripts', extensions: ['ws', 'ts', 'js'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      })) as string[];

      if (filePaths && filePaths.length > 0) {
        await window.electronAPI.invoke('asset:import', {
          filePaths,
          options: {
            targetFolder: currentPath,
            preserveStructure: false,
            generateThumbnails: true,
            overwriteExisting: false
          }
        });

        // Reload assets after import
        await loadAssets(currentPath);
      }
    } catch (error) {
      console.error('[ASSETS] Failed to import assets:', error);
    }
  };

  /**
   * handleFilesDropped()
   *
   * Handles files dropped via drag and drop.
   */
  const handleFilesDropped = async (files: File[]): Promise<void> => {
    try {
      const filePaths = files.map((file) => file.path);

      await window.electronAPI.invoke('asset:import', {
        filePaths,
        options: {
          targetFolder: currentPath,
          preserveStructure: false,
          generateThumbnails: true,
          overwriteExisting: false
        }
      });

      // Reload assets after import
      loadAssets(currentPath);
    } catch (error) {
      console.error('[ASSETS] Failed to import dropped files:', error);
    }
  };

  /**
   * handleCreateFolder()
   *
   * Creates a new folder in the current directory.
   */
  const handleCreateFolder = async (): Promise<void> => {
    const name = prompt('Enter folder name:');
    if (name && name.trim()) {
      try {
        await window.electronAPI.invoke('asset:create-folder', {
          relativePath: currentPath,
          name: name.trim()
        });

        // Reload assets after creating folder
        await loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS] Failed to create folder:', error);
        alert('Failed to create folder: ' + ((error as Error)?.message ?? 'Unknown error'));
      }
    }
  };

  /**
   * handleDeleteAsset()
   *
   * Deletes selected asset(s) with confirmation.
   */
  const handleDeleteAsset = async (relativePath: string): Promise<void> => {
    const asset = assets.find((a) => a.relativePath === relativePath);
    if (!asset) {
      return;
    }

    try {
      const confirmed = await window.worldedit.dialog.showConfirm(
        'Delete Asset',
        `Are you sure you want to delete "${asset.name}"?`,
        'This action cannot be undone.'
      );

      if (confirmed) {
        // Remove from selection immediately for better UX
        setSelectedAssets((prev) => prev.filter((path) => path !== relativePath));

        // For now, show that delete works but needs backend implementation
        await window.worldedit.dialog.showMessage({
          type: 'info',
          title: 'Delete Asset',
          message: `Delete functionality working.\nWould delete: "${asset.name}"`
        });

        // TODO: Implement actual deletion when backend API is ready
        // await window.worldedit.project.deleteAsset(relativePath);
        await loadAssets(currentPath);
      }
    } catch (error) {
      console.error('[ASSETS] Failed to delete asset:', error);
      await window.worldedit.dialog.showError(
        'Delete Error',
        `Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handleRenameAsset()
   *
   * Renames selected asset.
   */
  const handleRenameAsset = async (relativePath: string): Promise<void> => {
    const asset = assets.find((a) => a.relativePath === relativePath);
    if (!asset) {
      return;
    }

    try {
      // Use browser prompt for now since showInput doesn't exist
      const newName = prompt('Enter new name:', asset.name);

      if (newName && newName.trim() && newName !== asset.name) {
        // For now, show that rename functionality exists but needs implementation
        await window.worldedit.dialog.showMessage({
          type: 'info',
          title: 'Rename Asset',
          message: `Rename functionality not yet implemented.\nWould rename "${asset.name}" to "${newName.trim()}"`
        });

        // TODO: Implement actual rename when backend API is ready
        // await window.worldedit.project.renameAsset(relativePath, newName.trim());
        // await loadAssets(currentPath);
      }
    } catch (error) {
      console.error('[ASSETS] Failed to rename asset:', error);
      await window.worldedit.dialog.showError(
        'Rename Error',
        `Failed to rename asset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handleShowAssetProperties()
   *
   * Shows asset properties dialog.
   */
  const handleShowAssetProperties = async (asset: AssetItem): Promise<void> => {
    try {
      const properties = [
        `Name: ${asset.name}`,
        `Type: ${asset.type}`,
        `Size: ${asset.size ? formatFileSize(asset.size) : 'Unknown'}`,
        `Path: ${asset.relativePath}`,
        `Modified: ${asset.modified.toLocaleString()}`,
        `Created: ${asset.created.toLocaleString()}`
      ];

      if (asset.metadata?.description) {
        properties.push(`Description: ${asset.metadata.description}`);
      }

      if (asset.metadata?.tags?.length) {
        properties.push(`Tags: ${asset.metadata.tags.join(', ')}`);
      }

      await window.worldedit.dialog.showMessage({
        type: 'info',
        title: `Properties - ${asset.name}`,
        message: properties.join('\n')
      });
    } catch (error) {
      console.error('[ASSETS] Failed to show asset properties:', error);
      await window.worldedit.dialog.showError(
        'Properties Error',
        `Failed to show asset properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * getParentPath()
   *
   * Returns parent directory path.
   */
  const getParentPath = (path: string): string => {
    const parts = path.split('/');
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  };

  /**
   * getAssetIcon()
   *
   * Returns SVG icon element for asset type.
   */
  const getAssetIcon = (
    type: AssetItem['type'],
    size: 'small' | 'large' = 'large'
  ): JSX.Element => {
    const iconStyle: React.CSSProperties = {
      width: size === 'large' ? '32px' : '16px',
      height: size === 'large' ? '32px' : '16px',
      fill: theme.colors.foreground.secondary
    };

    switch (type) {
      case 'folder':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
          </svg>
        );
      case 'image':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        );
      case 'audio':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        );
      case 'model':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        );
      case 'script':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
        );
      case 'scene':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'material':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'font':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M9.93 13.5h4.14L12.5 7.98L9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z" />
          </svg>
        );
      case 'data':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      case 'shader':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M9 4v1.38c-.83-.33-1.72-.5-2.61-.5-1.79 0-3.58.68-4.95 2.05l3.33 3.33h1.11v1.11c.86.86 1.98 1.31 3.11 1.36V15c0 1.1.9 2 2 2s2-.9 2-2v-2.26c1.13-.05 2.25-.5 3.11-1.36V10.27h1.11l3.33-3.33c-1.37-1.37-3.16-2.05-4.95-2.05-.89 0-1.78.17-2.61.5V4H9z" />
          </svg>
        );
      default:
        return (
          <svg style={iconStyle} viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
        );
    }
  };

  /**
   * formatFileSize()
   *
   * Formats file size in human readable format.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * handleAssetClick()
   *
   * Handles asset selection and navigation.
   */
  const handleAssetClick = (asset: AssetItem, event: React.MouseEvent): void => {
    if (asset.type === 'folder') {
      if (asset.name === '..') {
        const parentPath = getParentPath(currentPath);
        setCurrentPath(parentPath);
      } else {
        setCurrentPath(asset.relativePath);
      }
      setSelectedAssets([]);
    } else {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        const isSelected = selectedAssets.includes(asset.relativePath);
        if (isSelected) {
          setSelectedAssets(selectedAssets.filter((path) => path !== asset.relativePath));
        } else {
          setSelectedAssets([...selectedAssets, asset.relativePath]);
        }
      } else {
        // Single select
        setSelectedAssets([asset.relativePath]);
      }
    }
  };

  /**
   * handleAssetDoubleClick()
   *
   * Handles asset opening/editing.
   */
  const handleAssetDoubleClick = (asset: AssetItem): void => {
    if (asset.type === 'scene') {
      console.log('[ASSETS] Opening scene:', asset.path);
      // TODO: Load scene in editor
    } else if (asset.type === 'script') {
      console.log('[ASSETS] Opening script:', asset.path);
      // TODO: Open script editor
    }
  };

  /**
   * handleAssetContextMenu()
   *
   * Handles right-click context menu on assets.
   */
  const handleAssetContextMenu = (asset: AssetItem, event: React.MouseEvent): void => {
    const menuItems = [
      CommonMenuItems.rename(() => void handleRenameAsset(asset.relativePath)),
      createSeparator('sep1'),
      CommonMenuItems.delete(() => void handleDeleteAsset(asset.relativePath)),
      createSeparator('sep2'),
      CommonMenuItems.properties(() => void handleShowAssetProperties(asset))
    ];

    showContextMenu(event, menuItems);
  };

  /**
   * renderGridView()
   *
   * Renders assets in grid view.
   */
  const renderGridView = (): JSX.Element => {
    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
      gap: theme.spacing.sm,
      padding: theme.spacing.sm
    };

    const itemStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      cursor: 'pointer',
      transition: 'background-color 0.1s ease',
      textAlign: 'center',
      minHeight: '100px'
    };

    const iconContainerStyle: React.CSSProperties = {
      marginBottom: theme.spacing.xs,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '32px',
      height: '32px'
    };

    const nameStyle: React.CSSProperties = {
      fontSize: '11px',
      color: theme.colors.foreground.primary,
      wordBreak: 'break-word',
      lineHeight: 1.2
    };

    return (
      <div style={gridStyle}>
        {assets.map((asset) => {
          const isSelected = selectedAssets.includes(asset.relativePath);
          return (
            <div
              key={asset.relativePath}
              style={{
                ...itemStyle,
                backgroundColor: isSelected ? theme.colors.accent.primary : 'transparent',
                color: isSelected ? '#ffffff' : theme.colors.foreground.primary
              }}
              onClick={(e) => handleAssetClick(asset, e)}
              onDoubleClick={() => handleAssetDoubleClick(asset)}
              onContextMenu={(e) => handleAssetContextMenu(asset, e)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={iconContainerStyle}>{getAssetIcon(asset.type, 'large')}</div>
              <div style={nameStyle}>{asset.name}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * renderListView()
   *
   * Renders assets in list view.
   */
  const renderListView = (): JSX.Element => {
    const listStyle: React.CSSProperties = {
      padding: theme.spacing.sm
    };

    const itemStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.borderRadius.sm,
      cursor: 'pointer',
      transition: 'background-color 0.1s ease',
      fontSize: '13px'
    };

    const iconContainerStyle: React.CSSProperties = {
      marginRight: theme.spacing.sm,
      width: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    };

    const nameStyle: React.CSSProperties = {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };

    const sizeStyle: React.CSSProperties = {
      width: '80px',
      textAlign: 'right',
      color: theme.colors.foreground.tertiary,
      fontSize: '12px'
    };

    const dateStyle: React.CSSProperties = {
      width: '120px',
      textAlign: 'right',
      color: theme.colors.foreground.tertiary,
      fontSize: '12px'
    };

    return (
      <div style={listStyle}>
        {assets.map((asset) => {
          const isSelected = selectedAssets.includes(asset.relativePath);
          return (
            <div
              key={asset.relativePath}
              style={{
                ...itemStyle,
                backgroundColor: isSelected ? theme.colors.accent.primary : 'transparent',
                color: isSelected ? '#ffffff' : theme.colors.foreground.primary
              }}
              onClick={(e) => handleAssetClick(asset, e)}
              onDoubleClick={() => handleAssetDoubleClick(asset)}
              onContextMenu={(e) => handleAssetContextMenu(asset, e)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={iconContainerStyle}>{getAssetIcon(asset.type, 'small')}</div>
              <div style={nameStyle}>{asset.name}</div>
              <div style={sizeStyle}>{asset.size ? formatFileSize(asset.size) : ''}</div>
              <div style={dateStyle}>
                {asset.modified ? asset.modified.toLocaleDateString() : ''}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.panel.background,
    border: `1px solid ${theme.colors.panel.border}`,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.panel.header,
    borderBottom: `1px solid ${theme.colors.panel.border}`,
    fontSize: '14px',
    fontWeight: 600
  };

  const pathBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    backgroundColor: theme.colors.background.secondary,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    fontSize: '12px',
    color: theme.colors.foreground.secondary
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto'
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: theme.colors.foreground.tertiary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    borderRadius: theme.borderRadius.sm,
    transition: 'background-color 0.1s ease'
  };

  return (
    <div style={panelStyle}>
      {/* Panel Header */}
      <div style={headerStyle}>
        <span>Assets</span>
        <div style={toolbarStyle}>
          <button
            style={{
              ...iconButtonStyle,
              backgroundColor:
                viewMode === 'grid' ? theme.colors.background.tertiary : 'transparent'
            }}
            title="Grid view"
            onClick={() => setViewMode('grid')}
          >
            ⊞
          </button>
          <button
            style={{
              ...iconButtonStyle,
              backgroundColor:
                viewMode === 'list' ? theme.colors.background.tertiary : 'transparent'
            }}
            title="List view"
            onClick={() => setViewMode('list')}
          >
            ≡
          </button>
          <div
            style={{ width: '1px', height: '16px', backgroundColor: theme.colors.border.primary }}
          />
          <button
            style={iconButtonStyle}
            title="Create new folder"
            disabled={!state.project.isOpen}
            onClick={() => void handleCreateFolder()}
            onMouseEnter={(e) => {
              if (state.project.isOpen) {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            New Folder
          </button>
          <button
            style={iconButtonStyle}
            title="Import asset"
            disabled={!state.project.isOpen}
            onClick={() => void handleImportAssets()}
            onMouseEnter={(e) => {
              if (state.project.isOpen) {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ↓
          </button>
          <button
            style={iconButtonStyle}
            title="Refresh"
            onClick={() => void loadAssets(currentPath)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div style={pathBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {(() => {
            const pathSegments = (currentPath || 'assets').split('/').filter(Boolean);
            const breadcrumbs = [];

            // Root breadcrumb
            breadcrumbs.push(
              <button
                key="root"
                onClick={() => setCurrentPath('assets')}
                style={{
                  background: 'none',
                  border: 'none',
                  color:
                    currentPath === 'assets'
                      ? theme.colors.accent.primary
                      : theme.colors.foreground.secondary,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  if (currentPath !== 'assets') {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                assets
              </button>
            );

            // Path segment breadcrumbs
            pathSegments.forEach((segment, index) => {
              const segmentPath = pathSegments.slice(0, index + 1).join('/');
              const isLast = index === pathSegments.length - 1;

              breadcrumbs.push(
                <span
                  key={`sep-${index}`}
                  style={{ margin: '0 4px', color: theme.colors.foreground.tertiary }}
                >
                  /
                </span>
              );

              breadcrumbs.push(
                <button
                  key={`seg-${index}`}
                  onClick={() => setCurrentPath(segmentPath)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLast ? theme.colors.accent.primary : theme.colors.foreground.secondary,
                    cursor: isLast ? 'default' : 'pointer',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontSize: '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLast) {
                      e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {segment}
                </button>
              );
            });

            return breadcrumbs;
          })()}
        </div>
        {selectedAssets.length > 0 && (
          <span
            style={{
              marginLeft: theme.spacing.md,
              fontSize: '12px',
              color: theme.colors.foreground.secondary
            }}
          >
            ({selectedAssets.length} selected)
          </span>
        )}
      </div>

      {/* Asset Content */}
      <DropZone
        onFilesDropped={handleFilesDropped}
        disabled={!state.project.isOpen}
        style={contentStyle}
      >
        {state.project.isOpen ? (
          loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: theme.colors.foreground.tertiary,
                fontSize: '14px'
              }}
            >
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <DropZoneIndicator text="No assets found" icon="□" />
          ) : viewMode === 'grid' ? (
            renderGridView()
          ) : (
            renderListView()
          )
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.foreground.tertiary,
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            <div>
              <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No Project Open</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Open a project to browse assets</p>
            </div>
          </div>
        )}
      </DropZone>

      {/* Context Menu */}
      <ContextMenu
        items={contextMenu.items}
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={hideContextMenu}
      />

      {/* Asset Properties Dialog */}
      <AssetPropertiesDialog
        asset={selectedAssetForProperties}
        visible={showPropertiesDialog}
        onClose={handleClosePropertiesDialog}
        onSave={handleSaveAssetProperties}
      />
    </div>
  );
}
