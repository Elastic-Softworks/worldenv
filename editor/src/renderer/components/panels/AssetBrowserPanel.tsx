/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Asset Browser Panel Component
 *
 * Asset browser panel for managing project assets.
 * Provides file system navigation and asset organization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { DropZone, DropZoneIndicator } from '../ui/DropZone';
import { ContextMenu, useContextMenu, CommonMenuItems, createSeparator } from '../ui/ContextMenu';

/**
 * Asset item interface
 */
interface AssetItem {
  name: string;
  type:
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
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  created: Date;
  extension: string;
  metadata: {
    id: string;
    imported: Date;
    tags: string[];
    description?: string;
    thumbnail?: string;
  };
  children?: AssetItem[];
}

/**
 * AssetBrowserPanel component
 *
 * File browser for project assets with preview and management.
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
  const [_searchQuery, _setSearchQuery] = useState('');
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
      console.error('[ASSETS] Failed to load assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
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
      await loadAssets(currentPath);
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

    const confirmMessage = `Are you sure you want to delete "${asset.name}"?`;
    if (confirm(confirmMessage)) {
      try {
        await window.electronAPI.invoke('asset:delete', relativePath);

        // Remove from selection if selected
        setSelectedAssets((prev) => prev.filter((path) => path !== relativePath));

        // Reload assets after deletion
        await loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS] Failed to delete asset:', error);
        alert('Failed to delete asset: ' + (error as Error).message);
      }
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

    const newName = prompt('Enter new name:', asset.name);
    if (newName && newName.trim() && newName !== asset.name) {
      try {
        await window.electronAPI.invoke('asset:rename', {
          relativePath,
          newName: newName.trim()
        });

        // Reload assets after rename
        await loadAssets(currentPath);
      } catch (error) {
        console.error('[ASSETS] Failed to rename asset:', error);
        alert('Failed to rename asset: ' + ((error as Error)?.message ?? 'Unknown error'));
      }
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
   * Returns icon for asset type.
   */
  const getAssetIcon = (type: AssetItem['type']): string => {
    switch (type) {
      case 'folder':
        return 'Folder';
      case 'image':
        return 'IMG';
      case 'model':
        return 'Model';
      case 'audio':
        return 'AUD';
      case 'script':
        return 'Script';
      case 'scene':
        return 'Scene';
      case 'material':
        return 'MAT';
      case 'font':
        return 'Font';
      case 'data':
        return 'DAT';
      case 'shader':
        return 'Shader';
      default:
        return 'File';
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
      CommonMenuItems.properties(() => {
        console.log('Asset properties:', asset);
      })
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

    const iconStyle: React.CSSProperties = {
      fontSize: '32px',
      marginBottom: theme.spacing.xs
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
              <div style={iconStyle}>{getAssetIcon(asset.type)}</div>
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

    const iconStyle: React.CSSProperties = {
      fontSize: '16px',
      marginRight: theme.spacing.sm,
      width: '20px',
      textAlign: 'center'
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
              <div style={iconStyle}>{getAssetIcon(asset.type)}</div>
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

      {/* Path Bar */}
      <div style={pathBarStyle}>
        <span>Path: {currentPath || 'assets'}</span>
        {selectedAssets.length > 0 && (
          <span style={{ marginLeft: theme.spacing.md }}>({selectedAssets.length} selected)</span>
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
    </div>
  );
}
