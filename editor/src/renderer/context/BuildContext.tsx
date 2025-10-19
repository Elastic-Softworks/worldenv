/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Build System Context
 *
 * React context for managing build state and operations.
 * Provides build configuration management, progress tracking,
 * and build execution capabilities.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BuildConfiguration, BuildProgress, BuildResult } from '../../shared/types';

interface BuildState {
  configuration: BuildConfiguration;
  isBuilding: boolean;
  progress: BuildProgress | null;
  lastResult: BuildResult | null;
  availableScenes: Array<{ id: string; name: string; path: string }>;
}

interface BuildActions {
  updateConfiguration: (config: Partial<BuildConfiguration>) => void;
  startBuild: (config?: BuildConfiguration) => Promise<BuildResult>;
  cancelBuild: () => Promise<void>;
  openBuildLocation: (outputPath: string) => Promise<void>;
  refreshAvailableScenes: () => Promise<void>;
  resetBuildState: () => void;
}

interface BuildContextValue {
  state: BuildState;
  actions: BuildActions;
}

const defaultConfiguration: BuildConfiguration = {
  outputDirectory: '',
  buildTarget: 'web',
  buildProfile: 'debug',
  optimizationLevel: 'basic',
  entryScene: '',
  includeAssets: true,
  includeScripts: true,
  generateSourceMaps: true,
  minifyOutput: false,
  enableHotReload: true,
  generateInstaller: false,
  enablePWA: false,
  compressionLevel: 6,
  bundleAnalysis: false,
  targetPlatforms: ['web']
};

const defaultState: BuildState = {
  configuration: defaultConfiguration,
  isBuilding: false,
  progress: null,
  lastResult: null,
  availableScenes: []
};

const BuildContext = createContext<BuildContextValue | null>(null);

/**
 * BuildProvider component
 *
 * Provides build state and actions to child components.
 */
export const BuildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BuildState>(defaultState);

  /**
   * updateConfiguration()
   *
   * Updates build configuration with partial changes.
   */
  const updateConfiguration = useCallback((config: Partial<BuildConfiguration>) => {
    setState((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        ...config
      }
    }));
  }, []);

  /**
   * startBuild()
   *
   * Starts build process with given configuration.
   */
  const startBuild = useCallback(
    async (config?: BuildConfiguration): Promise<BuildResult> => {
      const buildConfig = config || state.configuration;

      setState((prev) => ({
        ...prev,
        isBuilding: true,
        progress: {
          stage: 'Preparing',
          progress: 0,
          message: 'Initializing build...'
        },
        lastResult: null
      }));

      try {
        const result = (await window.electronAPI.build.buildProject(buildConfig)) as BuildResult;

        setState((prev) => ({
          ...prev,
          isBuilding: false,
          progress: null,
          lastResult: result
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
        const failedResult: BuildResult = {
          success: false,
          outputPath: '',
          errors: [errorMessage],
          warnings: [],
          buildTime: 0,
          buildProfile: buildConfig.buildProfile,
          outputSize: 0,
          assets: {}
        };

        setState((prev) => ({
          ...prev,
          isBuilding: false,
          progress: null,
          lastResult: failedResult
        }));

        return failedResult;
      }
    },
    [state.configuration]
  );

  /**
   * cancelBuild()
   *
   * Cancels current build operation.
   */
  const cancelBuild = useCallback(async (): Promise<void> => {
    try {
      await window.electronAPI.build.cancelBuild();

      setState((prev) => ({
        ...prev,
        isBuilding: false,
        progress: null
      }));
    } catch (error) {
      console.error('Failed to cancel build:', error);
    }
  }, []);

  /**
   * openBuildLocation()
   *
   * Opens build output directory in file explorer.
   */
  const openBuildLocation = useCallback(async (outputPath: string): Promise<void> => {
    try {
      await window.electronAPI.build.openBuildLocation(outputPath);
    } catch (error) {
      console.error('Failed to open build location:', error);
    }
  }, []);

  /**
   * refreshAvailableScenes()
   *
   * Refreshes list of available scenes for entry scene selection.
   */
  const refreshAvailableScenes = useCallback(async (): Promise<void> => {
    try {
      const response = (await window.electronAPI.build.getAvailableScenes()) as {
        scenes: Array<{ id: string; name: string; path: string }>;
      };

      setState((prev) => ({
        ...prev,
        availableScenes: response.scenes
      }));
    } catch (error) {
      console.error('Failed to refresh available scenes:', error);
      setState((prev) => ({
        ...prev,
        availableScenes: []
      }));
    }
  }, []);

  /**
   * resetBuildState()
   *
   * Resets build state to default values.
   */
  const resetBuildState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isBuilding: false,
      progress: null,
      lastResult: null
    }));
  }, []);

  /**
   * Listen for build progress updates
   */
  useEffect(() => {
    const handleBuildProgress = (...args: unknown[]) => {
      const progress = args[0] as BuildProgress;
      setState((prev) => ({
        ...prev,
        progress
      }));
    };

    window.electronAPI.on('build:progress', handleBuildProgress);

    return () => {
      window.electronAPI.removeListener('build:progress', handleBuildProgress);
    };
  }, []);

  /**
   * Update default output directory when project changes
   */
  useEffect(() => {
    const updateDefaultOutputDirectory = async () => {
      try {
        const currentProject = (await window.electronAPI.project.getCurrent()) as {
          path?: string;
        } | null;

        if (currentProject?.path && !state.configuration.outputDirectory) {
          const projectDir = currentProject.path;
          const defaultOutputDir = `${projectDir}/build`;

          updateConfiguration({ outputDirectory: defaultOutputDir });

          // Set project path for build manager
          await window.electronAPI.build.setProjectPath(projectDir);
        }
      } catch (error) {
        console.error('Failed to update default output directory:', error);
      }
    };

    updateDefaultOutputDirectory();
  }, [state.configuration.outputDirectory, updateConfiguration]);

  /**
   * Refresh available scenes on mount and when project changes
   */
  useEffect(() => {
    refreshAvailableScenes();
  }, [refreshAvailableScenes]);

  const contextValue: BuildContextValue = {
    state,
    actions: {
      updateConfiguration,
      startBuild,
      cancelBuild,
      openBuildLocation,
      refreshAvailableScenes,
      resetBuildState
    }
  };

  return <BuildContext.Provider value={contextValue}>{children}</BuildContext.Provider>;
};

/**
 * useBuild hook
 *
 * Hook for accessing build context.
 */
export const useBuild = (): BuildContextValue => {
  const context = useContext(BuildContext);

  if (!context) {
    throw new Error('useBuild must be used within a BuildProvider');
  }

  return context;
};

/**
 * useBuildConfiguration hook
 *
 * Hook for accessing build configuration specifically.
 */
export const useBuildConfiguration = () => {
  const { state, actions } = useBuild();

  return {
    configuration: state.configuration,
    updateConfiguration: actions.updateConfiguration,
    availableScenes: state.availableScenes,
    refreshAvailableScenes: actions.refreshAvailableScenes
  };
};

/**
 * useBuildExecution hook
 *
 * Hook for accessing build execution functionality.
 */
export const useBuildExecution = () => {
  const { state, actions } = useBuild();

  return {
    isBuilding: state.isBuilding,
    progress: state.progress,
    lastResult: state.lastResult,
    startBuild: actions.startBuild,
    cancelBuild: actions.cancelBuild,
    openBuildLocation: actions.openBuildLocation,
    resetBuildState: actions.resetBuildState
  };
};
