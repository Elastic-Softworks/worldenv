/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Asset Properties Dialog Component
 *
 * Professional asset properties dialog with metadata editing and preview.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { AssetItem, AssetMetadata } from '../../../shared/types';

/* AssetItem and AssetMetadata are now imported from shared/types.ts */

/**
 * Asset Properties Dialog props
 */
interface AssetPropertiesDialogProps {
  asset: AssetItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (asset: AssetItem, updatedMetadata: Partial<AssetMetadata>) => void;
}

/**
 * AssetPropertiesDialog component
 *
 * Professional dialog for viewing and editing asset properties.
 */
export function AssetPropertiesDialog({
  asset,
  visible,
  onClose,
  onSave
}: AssetPropertiesDialogProps): JSX.Element {
  const { theme } = useTheme();
  const [editedMetadata, setEditedMetadata] = useState<Partial<AssetMetadata>>({});
  const [tags, setTags] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Initialize form data when asset changes
   */
  useEffect(() => {
    if (asset) {
      setTags(asset.metadata.tags.join(', '));
      setDescription(asset.metadata.description || '');
      setEditedMetadata({});
      setHasChanges(false);
    }
  }, [asset]);

  /**
   * Handle form input changes
   */
  const handleTagsChange = useCallback((value: string) => {
    setTags(value);
    setHasChanges(true);
    setEditedMetadata((prev) => ({
      ...prev,
      tags: value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    }));
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setHasChanges(true);
    setEditedMetadata((prev) => ({
      ...prev,
      description: value
    }));
  }, []);

  /**
   * Handle save operation
   */
  const handleSave = useCallback(() => {
    if (!asset || !hasChanges) return;

    onSave(asset, editedMetadata);
    onClose();
  }, [asset, editedMetadata, hasChanges, onSave, onClose]);

  /**
   * Handle cancel operation
   */
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!visible || !asset) {
    return <></>;
  }

  const dialogStyle: React.CSSProperties = {
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

  const contentStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary
  };

  const bodyStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    flex: 1,
    overflow: 'auto'
  };

  const footerStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: theme.spacing.lg
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.xs,
    fontWeight: 600,
    color: theme.colors.foreground.primary
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.foreground.primary,
    fontSize: '14px'
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical'
  };

  const infoGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing.md
  };

  const previewStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    backgroundColor: theme.colors.background.tertiary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md
  };

  return (
    <div style={dialogStyle} onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: theme.colors.foreground.primary }}>Asset Properties</h2>
          <p
            style={{
              margin: '4px 0 0 0',
              color: theme.colors.foreground.secondary,
              fontSize: '14px'
            }}
          >
            {asset.name}
          </p>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Preview */}
          {asset.type === 'image' && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Preview</label>
              <div style={previewStyle}>
                {asset.metadata.thumbnail ? (
                  <img
                    src={`file://${asset.metadata.thumbnail}`}
                    alt={asset.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = `file://${asset.path}`;
                    }}
                  />
                ) : (
                  <span style={{ color: theme.colors.foreground.tertiary }}>
                    No preview available
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Basic Information</label>
            <div style={infoGridStyle}>
              <div>
                <strong>Type:</strong> {asset.type}
              </div>
              <div>
                <strong>Size:</strong> {formatFileSize(asset.size)}
              </div>
              <div>
                <strong>Created:</strong> {formatDate(asset.created)}
              </div>
              <div>
                <strong>Modified:</strong> {formatDate(asset.modified)}
              </div>
              <div>
                <strong>Extension:</strong> {asset.extension}
              </div>
              <div>
                <strong>Path:</strong> {asset.relativePath}
              </div>
            </div>
          </div>

          {/* Metadata Information */}
          {asset.metadata.imageInfo && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Image Information</label>
              <div style={infoGridStyle}>
                <div>
                  <strong>Dimensions:</strong> {asset.metadata.imageInfo.width} ×{' '}
                  {asset.metadata.imageInfo.height}
                </div>
                <div>
                  <strong>Format:</strong> {asset.metadata.imageInfo.format}
                </div>
                <div>
                  <strong>Channels:</strong> {asset.metadata.imageInfo.channels}
                </div>
                <div>
                  <strong>Compressed:</strong> {asset.metadata.imageInfo.compressed ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          )}

          {asset.metadata.audioInfo && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Audio Information</label>
              <div style={infoGridStyle}>
                <div>
                  <strong>Duration:</strong> {Math.round(asset.metadata.audioInfo.duration)}s
                </div>
                <div>
                  <strong>Sample Rate:</strong> {asset.metadata.audioInfo.sampleRate} Hz
                </div>
                <div>
                  <strong>Channels:</strong> {asset.metadata.audioInfo.channels}
                </div>
                <div>
                  <strong>Bit Rate:</strong> {asset.metadata.audioInfo.bitrate} kbps
                </div>
              </div>
            </div>
          )}

          {asset.metadata.modelInfo && (
            <div style={sectionStyle}>
              <label style={labelStyle}>Model Information</label>
              <div style={infoGridStyle}>
                <div>
                  <strong>Vertices:</strong> {asset.metadata.modelInfo.vertices.toLocaleString()}
                </div>
                <div>
                  <strong>Faces:</strong> {asset.metadata.modelInfo.faces.toLocaleString()}
                </div>
                <div>
                  <strong>Animations:</strong> {asset.metadata.modelInfo.animations?.length || 0}
                </div>
                <div>
                  <strong>Materials:</strong> {asset.metadata.modelInfo.materials.length}
                </div>
              </div>
            </div>
          )}

          {/* Editable Metadata */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="Enter tags separated by commas"
              style={inputStyle}
            />
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter asset description"
              style={textareaStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
