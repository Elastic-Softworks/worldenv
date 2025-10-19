/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Batch Import Dialog
 *
 * Dialog component for enhanced batch asset import operations.
 * Provides progress tracking, filtering, and import options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

/*
  =================================
           --- TYPES ---
  =================================
*/

interface BatchImportFile {
  path: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'importing' | 'success' | 'error';
  error?: string;
}

interface BatchImportOptions {
  targetFolder: string;
  preserveStructure: boolean;
  generateThumbnails: boolean;
  overwriteExisting: boolean;
  compressImages: boolean;
  imageQuality: number;
  maxImageSize: number;
}

interface BatchImportDialogProps {
  isOpen: boolean;
  files: File[];
  targetFolder: string;
  onClose: () => void;
  onImport: (files: string[], options: BatchImportOptions) => Promise<void>;
}

/*
  =================================
           --- COMPONENT ---
  =================================
*/

export function BatchImportDialog({
  isOpen,
  files,
  targetFolder,
  onClose,
  onImport
}: BatchImportDialogProps): JSX.Element {
  const { theme } = useTheme();

  const [importFiles, setImportFiles] = useState<BatchImportFile[]>([]);
  const [options, setOptions] = useState<BatchImportOptions>({
    targetFolder,
    preserveStructure: false,
    generateThumbnails: true,
    overwriteExisting: false,
    compressImages: false,
    imageQuality: 85,
    maxImageSize: 2048
  });
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  /*

           initializeFiles()
           ---
           converts File objects to BatchImportFile format
           for tracking and display

  */
  const initializeFiles = useCallback(() => {
    const batchFiles: BatchImportFile[] = files.map((file) => ({
      path: file.path || file.name,
      name: file.name,
      size: file.size,
      type: determineAssetType(file.name),
      status: 'pending'
    }));
    setImportFiles(batchFiles);
  }, [files]);

  /*

           determineAssetType()
           ---
           determines asset type from file extension

  */
  const determineAssetType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return 'audio';
    }
    if (['gltf', 'glb', 'obj', 'fbx', 'dae'].includes(ext)) {
      return 'model';
    }
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
      return 'font';
    }
    if (['js', 'ts', 'wc', 'worldc'].includes(ext)) {
      return 'script';
    }
    return 'unknown';
  };

  /*

           formatFileSize()
           ---
           formats file size for display

  */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /*

           handleImport()
           ---
           executes the batch import operation with progress tracking

  */
  const handleImport = async (): Promise<void> => {
    if (importFiles.length === 0 || isImporting) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const filesToImport = importFiles
        .filter((file) => file.status === 'pending')
        .map((file) => file.path);

      for (let i = 0; i < filesToImport.length; i++) {
        const filePath = filesToImport[i];
        const fileName = filePath.split('/').pop() || filePath;

        setCurrentFile(fileName);
        setProgress((i / filesToImport.length) * 100);

        /* update file status to importing */
        setImportFiles((prev) =>
          prev.map((file) => (file.path === filePath ? { ...file, status: 'importing' } : file))
        );

        try {
          await onImport([filePath], options);

          /* mark file as successful */
          setImportFiles((prev) =>
            prev.map((file) => (file.path === filePath ? { ...file, status: 'success' } : file))
          );
        } catch (error) {
          /* mark file as failed */
          setImportFiles((prev) =>
            prev.map((file) =>
              file.path === filePath
                ? {
                    ...file,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Import failed'
                  }
                : file
            )
          );
        }
      }

      setProgress(100);
      setCurrentFile('');
    } catch (error) {
      console.error('[BATCH IMPORT] Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  /*

           toggleFileSelection()
           ---
           toggles individual file selection for import

  */
  const toggleFileSelection = (filePath: string): void => {
    setImportFiles((prev) =>
      prev.map((file) =>
        file.path === filePath
          ? {
              ...file,
              status: file.status === 'pending' ? 'success' : 'pending'
            }
          : file
      )
    );
  };

  /*

           getStatusIcon()
           ---
           returns appropriate icon for file status

  */
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'importing':
        return '⚡';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '?';
    }
  };

  /* initialize files when dialog opens */
  useEffect(() => {
    if (isOpen) {
      initializeFiles();
    }
  }, [isOpen, initializeFiles]);

  /* update target folder when prop changes */
  useEffect(() => {
    setOptions((prev) => ({ ...prev, targetFolder }));
  }, [targetFolder]);

  if (!isOpen) return <></>;

  const pendingCount = importFiles.filter((f) => f.status === 'pending').length;
  const successCount = importFiles.filter((f) => f.status === 'success').length;
  const errorCount = importFiles.filter((f) => f.status === 'error').length;

  /*
    =================================
             --- STYLES ---
    =================================
  */

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: '8px',
    width: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    overflow: 'auto'
  };

  const optionsStyle: React.CSSProperties = {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: '4px'
  };

  const fileListStyle: React.CSSProperties = {
    maxHeight: '300px',
    overflowY: 'auto',
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: '4px'
  };

  const fileItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const progressStyle: React.CSSProperties = {
    margin: '16px 0',
    padding: '12px',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: '4px'
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px'
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px',
    borderTop: `1px solid ${theme.colors.border.primary}`,
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.foreground.primary,
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: theme.colors.accent.primary,
    color: '#ffffff'
  };

  /*
    =================================
             --- RENDER ---
    =================================
  */

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: theme.colors.foreground.primary }}>Batch Import Assets</h2>
          <p style={{ margin: '4px 0 0 0', color: theme.colors.foreground.secondary }}>
            {importFiles.length} files selected for import
          </p>
        </div>

        {/* content */}
        <div style={contentStyle}>
          {/* import options */}
          <div style={optionsStyle}>
            <h3 style={{ margin: '0 0 8px 0', color: theme.colors.foreground.primary }}>
              Import Options
            </h3>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
              <input
                type="checkbox"
                checked={options.preserveStructure}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    preserveStructure: e.target.checked
                  }))
                }
                disabled={isImporting}
              />
              <span style={{ color: theme.colors.foreground.secondary }}>
                Preserve folder structure
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
              <input
                type="checkbox"
                checked={options.generateThumbnails}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    generateThumbnails: e.target.checked
                  }))
                }
                disabled={isImporting}
              />
              <span style={{ color: theme.colors.foreground.secondary }}>Generate thumbnails</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
              <input
                type="checkbox"
                checked={options.overwriteExisting}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    overwriteExisting: e.target.checked
                  }))
                }
                disabled={isImporting}
              />
              <span style={{ color: theme.colors.foreground.secondary }}>
                Overwrite existing files
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
              <input
                type="checkbox"
                checked={options.compressImages}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    compressImages: e.target.checked
                  }))
                }
                disabled={isImporting}
              />
              <span style={{ color: theme.colors.foreground.secondary }}>Compress images</span>
            </label>

            {options.compressImages && (
              <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                <label style={{ display: 'block', color: theme.colors.foreground.secondary }}>
                  Quality: {options.imageQuality}%
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={options.imageQuality}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        imageQuality: parseInt(e.target.value)
                      }))
                    }
                    disabled={isImporting}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* progress tracking */}
          {isImporting && (
            <div style={progressStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span style={{ color: theme.colors.foreground.primary }}>
                  Importing: {currentFile}
                </span>
                <span style={{ color: theme.colors.foreground.secondary }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={progressBarStyle}>
                <div style={progressFillStyle} />
              </div>
            </div>
          )}

          {/* file list */}
          <div style={fileListStyle}>
            {importFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  ...fileItemStyle,
                  backgroundColor:
                    file.status === 'success'
                      ? 'rgba(0, 255, 0, 0.1)'
                      : file.status === 'error'
                        ? 'rgba(255, 0, 0, 0.1)'
                        : 'transparent'
                }}
              >
                <span style={{ fontSize: '16px' }}>{getStatusIcon(file.status)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.colors.foreground.primary }}>{file.name}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: theme.colors.foreground.secondary
                    }}
                  >
                    {file.type} • {formatFileSize(file.size)}
                    {file.error && ` • ${file.error}`}
                  </div>
                </div>
                <button
                  style={{
                    ...buttonStyle,
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                  onClick={() => toggleFileSelection(file.path)}
                  disabled={isImporting || file.status === 'importing'}
                >
                  {file.status === 'pending' ? 'Skip' : 'Include'}
                </button>
              </div>
            ))}
          </div>

          {/* status summary */}
          <div
            style={{
              marginTop: '16px',
              padding: '8px',
              backgroundColor: theme.colors.background.secondary,
              borderRadius: '4px',
              fontSize: '14px',
              color: theme.colors.foreground.secondary
            }}
          >
            {pendingCount} pending • {successCount} imported • {errorCount} failed
          </div>
        </div>

        {/* footer */}
        <div style={footerStyle}>
          <button style={buttonStyle} onClick={onClose} disabled={isImporting}>
            {isImporting ? 'Close' : 'Cancel'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={primaryButtonStyle}
              onClick={handleImport}
              disabled={isImporting || pendingCount === 0}
            >
              {isImporting ? 'Importing...' : `Import ${pendingCount} Files`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* end file */

/*
  =================================
             --- EOF ---
  =================================
*/
