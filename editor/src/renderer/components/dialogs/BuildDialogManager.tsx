/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Build Dialog Manager
 *
 * Manages build-related dialogs including configuration and progress.
 * Provides centralized dialog state management and coordination
 * between build configuration and progress dialogs.
 */

import React, { useState, useCallback } from 'react';
import { BuildConfigDialog } from './BuildConfigDialog';
import { BuildProgressDialog } from './BuildProgressDialog';
import { useBuild } from '../../context/BuildContext';
import { BuildConfiguration, BuildResult } from '../../../shared/types';

interface BuildDialogManagerProps {
  configDialogOpen: boolean;
  onCloseConfigDialog: () => void;
}

export const BuildDialogManager: React.FC<BuildDialogManagerProps> = ({
  configDialogOpen,
  onCloseConfigDialog
}) => {
  const { state, actions } = useBuild();
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  /**
   * handleSaveConfiguration()
   *
   * Saves build configuration without starting build.
   */
  const handleSaveConfiguration = useCallback((config: BuildConfiguration) => {
    actions.updateConfiguration(config);
  }, [actions]);

  /**
   * handleBuildNow()
   *
   * Starts build process with given configuration.
   */
  const handleBuildNow = useCallback(async (config: BuildConfiguration) => {
    actions.updateConfiguration(config);
    setProgressDialogOpen(true);

    try {
      await actions.startBuild(config);
    } catch (error) {
      console.error('Build failed:', error);
    }
  }, [actions]);

  /**
   * handleCancelBuild()
   *
   * Cancels current build operation.
   */
  const handleCancelBuild = useCallback(async () => {
    try {
      await actions.cancelBuild();
      setProgressDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel build:', error);
    }
  }, [actions]);

  /**
   * handleBuildComplete()
   *
   * Handles build completion result.
   */
  const handleBuildComplete = useCallback((result: BuildResult) => {
    console.log('Build completed:', result);

    // Keep progress dialog open to show results
    // User can close it manually after reviewing results
  }, []);

  /**
   * handleCloseProgressDialog()
   *
   * Closes progress dialog and resets build state.
   */
  const handleCloseProgressDialog = useCallback(() => {
    setProgressDialogOpen(false);
    actions.resetBuildState();
  }, [actions]);

  return (
    <>
      {/* BUILD CONFIGURATION DIALOG */}
      <BuildConfigDialog
        isOpen={configDialogOpen}
        config={state.configuration}
        availableScenes={state.availableScenes}
        onClose={onCloseConfigDialog}
        onSave={handleSaveConfiguration}
        onBuild={handleBuildNow}
      />

      {/* BUILD PROGRESS DIALOG */}
      <BuildProgressDialog
        isOpen={progressDialogOpen}
        onClose={handleCloseProgressDialog}
        onCancel={handleCancelBuild}
        onComplete={handleBuildComplete}
      />
    </>
  );
};
