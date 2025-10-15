/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Build Progress Dialog
 *
 * Shows build progress with real-time updates.
 * Displays current stage, progress percentage,
 * and status messages during build operations.
 */

import React, { useState, useEffect } from 'react';
import './BuildProgressDialog.css';

interface BuildProgress {
  stage: string;
  progress: number;
  message: string;
  error?: string;
}

interface BuildResult {
  success: boolean;
  outputPath: string;
  errors: string[];
  warnings: string[];
  buildTime: number;
}

interface BuildProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onComplete: (result: BuildResult) => void;
}

export const BuildProgressDialog: React.FC<BuildProgressDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onComplete
}) => {
  const [progress, setProgress] = useState<BuildProgress>({
    stage: 'Preparing',
    progress: 0,
    message: 'Initializing build...'
  });
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /* LISTEN FOR BUILD PROGRESS */
    const handleBuildProgress = (...args: unknown[]) => {
      const progressData = args[0] as BuildProgress;
      setProgress(progressData);

      if (progressData.stage === 'Complete') {
        setIsBuilding(false);
      } else if (progressData.stage === 'Error') {
        setIsBuilding(false);
      }
    };

    /* LISTEN FOR BUILD COMPLETION */
    const handleBuildComplete = (...args: unknown[]) => {
      const result = args[0] as BuildResult;
      setBuildResult(result);
      setShowResult(true);
      setIsBuilding(false);
      onComplete(result);
    };

    window.electronAPI.on('build:progress', handleBuildProgress);
    window.electronAPI.on('build:complete', handleBuildComplete);

    return () => {
      window.electronAPI.removeListener('build:progress', handleBuildProgress);
      window.electronAPI.removeListener('build:complete', handleBuildComplete);
    };
  }, [isOpen, onComplete]);

  const handleCancel = async () => {
    if (isBuilding) {
      try {
        await window.electronAPI.build.cancelBuild();
        setIsBuilding(false);
      } catch (error) {
        console.error('Failed to cancel build:', error);
      }
    }
    onCancel();
  };

  const handleClose = () => {
    if (!isBuilding) {
      onClose();
      setProgress({
        stage: 'Preparing',
        progress: 0,
        message: 'Initializing build...'
      });
      setBuildResult(null);
      setShowResult(false);
    }
  };

  const handleOpenBuildLocation = async () => {
    if (buildResult?.outputPath) {
      try {
        await window.electronAPI.build.openBuildLocation(buildResult.outputPath);
      } catch (error) {
        console.error('Failed to open build location:', error);
      }
    }
  };

  const formatBuildTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getProgressBarClass = (): string => {
    if (progress.error) {
      return 'progress-bar error';
    }
    if (progress.stage === 'Complete') {
      return 'progress-bar success';
    }
    return 'progress-bar';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog build-progress-dialog">
        <div className="dialog-header">
          <h2>Build Progress</h2>
          {!isBuilding && (
            <button className="dialog-close" onClick={handleClose}>
              ×
            </button>
          )}
        </div>

        <div className="dialog-content">
          {!showResult ? (
            /* BUILD PROGRESS VIEW */
            <div className="build-progress">
              <div className="progress-section">
                <div className="stage-info">
                  <h3>{progress.stage}</h3>
                  <p>{progress.message}</p>
                </div>

                <div className="progress-container">
                  <div className={getProgressBarClass()}>
                    <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
                  </div>
                  <span className="progress-text">{progress.progress}%</span>
                </div>

                {progress.error && (
                  <div className="error-message">
                    <h4>Build Error:</h4>
                    <p>{progress.error}</p>
                  </div>
                )}
              </div>

              <div className="build-stages">
                <div className="stage-list">
                  <div
                    className={`stage-item ${progress.stage === 'Preparing' ? 'active' : ''} ${progress.progress > 10 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Preparing</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Compiling' ? 'active' : ''} ${progress.progress > 30 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Compiling TypeScript</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Building WASM' ? 'active' : ''} ${progress.progress > 50 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Building WASM</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Bundling Assets' ? 'active' : ''} ${progress.progress > 70 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Bundling Assets</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Copying Scripts' ? 'active' : ''} ${progress.progress > 80 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Copying Scripts</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Generating HTML' ? 'active' : ''} ${progress.progress > 85 ? 'completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Generating HTML</span>
                  </div>
                  <div
                    className={`stage-item ${progress.stage === 'Complete' ? 'active completed' : ''}`}
                  >
                    <span className="stage-indicator" />
                    <span className="stage-name">Complete</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BUILD RESULT VIEW */
            <div className="build-result">
              <div className={`result-header ${buildResult?.success ? 'success' : 'error'}`}>
                <h3>{buildResult?.success ? '✓ Build Successful' : '✗ Build Failed'}</h3>
                {buildResult?.buildTime && (
                  <p>Build time: {formatBuildTime(buildResult.buildTime)}</p>
                )}
              </div>

              {buildResult?.success && (
                <div className="success-info">
                  <p>Project built successfully!</p>
                  <div className="output-path">
                    <strong>Output Location:</strong>
                    <code>{buildResult.outputPath}</code>
                  </div>
                </div>
              )}

              {buildResult?.errors && buildResult.errors.length > 0 && (
                <div className="error-list">
                  <h4>Errors:</h4>
                  <ul>
                    {buildResult.errors.map((error, index) => (
                      <li key={index} className="error-item">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {buildResult?.warnings && buildResult.warnings.length > 0 && (
                <div className="warning-list">
                  <h4>Warnings:</h4>
                  <ul>
                    {buildResult.warnings.map((warning, index) => (
                      <li key={index} className="warning-item">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {!showResult ? (
            /* BUILD IN PROGRESS FOOTER */
            <button className="btn btn-danger" onClick={handleCancel} disabled={!isBuilding}>
              Cancel Build
            </button>
          ) : (
            /* BUILD COMPLETE FOOTER */
            <div className="result-actions">
              <button className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
              {buildResult?.success && buildResult.outputPath && (
                <button className="btn btn-primary" onClick={handleOpenBuildLocation}>
                  Open Build Location
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
