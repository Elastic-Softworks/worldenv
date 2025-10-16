/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Viewport Panel Component
 *
 * Main viewport panel for 3D/2D scene rendering using Three.js and Pixi.js.
 * Provides the primary workspace for scene editing and visualization.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { ViewportManager, ViewportMode, ViewportStats } from '../../viewport/ViewportManager';
import { CameraPreset } from '../../viewport/EditorCamera';
import { ViewportToolbar } from '../ui/ViewportToolbar';
import { createDemoScene, animateObjects } from '../../viewport/DemoContent';
import { EngineInterface } from '../../engine/EngineInterface';
import { ManipulatorManager, ManipulatorMode, TransformSpace } from '../../viewport/manipulators';
import { Button } from '../ui/Button';
import { NewProjectDialog } from '../dialogs/NewProjectDialog';
import { RecentProjectsDialog } from '../dialogs/RecentProjectsDialog';
import { ProjectData } from '../../../shared/types';
import * as THREE from 'three';
import * as PIXI from 'pixi.js';

/**
 * ViewportPanel component
 *
 * Central viewport for scene rendering and editing.
 * Manages 2D/3D rendering with full editor integration.
 */
export function ViewportPanel(): JSX.Element {
  console.log('[VIEWPORT PANEL] Component mounting...');
  const { state, actions } = useEditorState();
  const { theme } = useTheme();
  const undoRedo = useUndoRedo();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportManagerRef = useRef<ViewportManager | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<ViewportMode>('3d');
  const [stats, setStats] = useState<ViewportStats | null>(null);
  const [fps, setFps] = useState(0);
  const [isEngineMode, setIsEngineMode] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  /* WELCOME SCREEN STATE */
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showRecentProjectsDialog, setShowRecentProjectsDialog] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isOpeningProject, setIsOpeningProject] = useState(false);

  /* MANIPULATOR STATE */
  const manipulatorManagerRef = useRef<ManipulatorManager | null>(null);
  const [manipulatorMode, setManipulatorMode] = useState<ManipulatorMode>(
    ManipulatorMode.Translate
  );
  const [transformSpace, setTransformSpace] = useState<TransformSpace>(TransformSpace.World);

  /* VIEWPORT SETTINGS STATE */
  const [showGrid, setShowGrid] = useState(true);
  const [showGizmos, setShowGizmos] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  /* DEMO CONTENT STATE */
  const [demoObjects, setDemoObjects] = useState<(THREE.Object3D | PIXI.DisplayObject)[]>([]);
  const [hasLoadedDemo, setHasLoadedDemo] = useState(false);

  /* ENGINE INTERFACE */
  const engineInterfaceRef = useRef<EngineInterface | null>(null);

  /**
   * initializeManipulators()
   *
   * Initialize manipulator system.
   */
  const initializeManipulators = useCallback((): void => {
    if (!viewportManagerRef.current || manipulatorManagerRef.current) {
      return;
    }

    try {
      const manipulatorManager = new ManipulatorManager();
      manipulatorManagerRef.current = manipulatorManager;

      /* GET VIEWPORT COMPONENTS */
      const camera = viewportManagerRef.current.getCamera();
      const domElement = canvasRef.current;

      if (camera && domElement) {
        manipulatorManager.initialize(camera.getCamera3D(), domElement);

        /* ADD MANIPULATOR TO SCENE */
        const scene = viewportManagerRef.current.getScene();
        if (scene && 'add' in scene) {
          scene.add(manipulatorManager);
        }

        /* SET UP EVENT HANDLERS */
        manipulatorManager.addChangeListener((event) => {
          console.log('[VIEWPORT] Transform changed:', event);
          /* Transform changes are now handled by undo/redo system in manipulators */
        });

        /* APPLY INITIAL SETTINGS */
        manipulatorManager.setMode(manipulatorMode);
        manipulatorManager.setSpace(transformSpace);
        manipulatorManager.setSnapEnabled(snapToGrid);
      }
    } catch (error) {
      console.error('[VIEWPORT] Manipulator initialization failed:', error);
    }
  }, [manipulatorMode, transformSpace, snapToGrid]);

  /**
   * initializeEngine()
   *
   * Initialize engine interface for play mode.
   */
  const initializeEngine = useCallback((): void => {
    if (engineInterfaceRef.current) {
      return;
    }

    try {
      const engineInterface = EngineInterface.getInstance();
      engineInterfaceRef.current = engineInterface;

      /* SET UP ENGINE EVENT HANDLERS */
      engineInterface.addEventListener('ready', () => {
        setEngineReady(true);
      });

      engineInterface.addEventListener('playModeStarted', () => {
        setIsEngineMode(true);
      });

      engineInterface.addEventListener('playModeStopped', () => {
        setIsEngineMode(false);
      });

      engineInterface.addEventListener('error', (event: string, ...args: unknown[]) => {
        const error = args[0] as Error;
        console.error('[VIEWPORT] Engine error:', error);
        setEngineReady(false);
        setIsEngineMode(false);
      });

      /* CHECK INITIAL STATE */
      setEngineReady(engineInterface.isEngineReady());
      setIsEngineMode(engineInterface.isInPlayMode());
    } catch (error) {
      console.error('[VIEWPORT] Engine initialization failed:', error);
    }
  }, []);

  /**
   * initializeViewport()
   *
   * Initialize the viewport manager and rendering system.
   */
  const initializeViewport = useCallback((): (() => void) | undefined => {
    if (!canvasRef.current || isInitialized) {
      return;
    }

    const canvas = canvasRef.current;

    /* SET INITIAL CANVAS SIZE */
    const resizeCanvas = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        if (viewportManagerRef.current) {
          viewportManagerRef.current.resize();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /* INITIALIZE VIEWPORT MANAGER */
    viewportManagerRef.current = new ViewportManager(canvas);

    /* SET UP EVENT CALLBACKS */
    viewportManagerRef.current.onModeChange((mode) => {
      setCurrentMode(mode);
      actions.setViewportMode(mode);
    });

    viewportManagerRef.current.onSelectionChange((objects) => {
      /* UPDATE EDITOR STATE WITH SELECTED OBJECTS */
      console.log('[VIEWPORT] Selection changed:', objects);
    });

    /* APPLY INITIAL SETTINGS */
    viewportManagerRef.current.updateSettings({
      showGrid,
      showGizmos,
      showAxes,
      snapToGrid,
      gridSize: 50
    });

    /* SET INITIAL MODE */
    const initialMode = state.ui.activeViewportMode === '3d' ? '3d' : '2d';
    viewportManagerRef.current.setMode(initialMode);
    setCurrentMode(initialMode);

    /* LOAD DEMO CONTENT IF PROJECT IS OPEN */
    if (state.project.isOpen && !hasLoadedDemo) {
      const demo = createDemoScene(initialMode);
      demo.forEach((obj) => viewportManagerRef.current?.addObject(obj));
      setDemoObjects(demo);
      setHasLoadedDemo(true);
    }

    /* START STATS MONITORING */
    let frameCount = 0;
    let lastTime = performance.now();

    const updateStats = (): void => {
      if (viewportManagerRef.current) {
        const currentStats = viewportManagerRef.current.getStats();
        setStats(currentStats);

        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTime = currentTime;
        }
      }
      /* ANIMATE DEMO OBJECTS */
      if (demoObjects.length > 0) {
        animateObjects(demoObjects, performance.now());
      }

      requestAnimationFrame(updateStats);
    };

    requestAnimationFrame(updateStats);

    setIsInitialized(true);

    /* INITIALIZE ENGINE AFTER VIEWPORT */
    initializeEngine();

    /* INITIALIZE MANIPULATORS */
    setTimeout(() => {
      initializeManipulators();
    }, 100); /* Delay to ensure viewport is fully initialized */

    /* ADD KEYBOARD EVENT LISTENER */
    const keyHandler = (event: KeyboardEvent) => {
      /* Handle undo/redo first */
      if (undoRedo.handleKeyDown(event)) {
        return;
      }

      if (manipulatorManagerRef.current) {
        const handled = manipulatorManagerRef.current.handleKeyDown(event);
        if (handled) {
          event.preventDefault();
          return;
        }
      }

      /* Handle other viewport shortcuts */
      switch (event.code) {
        case 'KeyG':
          if (!event.ctrlKey && !event.altKey && !event.metaKey) {
            handleToggleSnap();
            event.preventDefault();
          }
          break;
      }
    };
    window.addEventListener('keydown', keyHandler);

    /* CLEANUP FUNCTION */
    return (): void => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', keyHandler);
      if (viewportManagerRef.current) {
        viewportManagerRef.current.dispose();
        viewportManagerRef.current = null;
      }
      if (manipulatorManagerRef.current) {
        manipulatorManagerRef.current.dispose();
        manipulatorManagerRef.current = null;
      }
      if (engineInterfaceRef.current) {
        engineInterfaceRef.current = null;
      }
    };
  }, [
    isInitialized,
    state.ui.activeViewportMode,
    actions,
    showGrid,
    showGizmos,
    showAxes,
    snapToGrid,
    initializeEngine
  ]);

  /* INITIALIZE VIEWPORT ON MOUNT */
  useEffect(() => {
    console.log('[VIEWPORT PANEL] Panel mounted and visible');
    const cleanup = initializeViewport();
    return cleanup;
  }, [initializeViewport]);

  /* UPDATE VIEWPORT MODE WHEN STATE CHANGES */
  useEffect(() => {
    if (viewportManagerRef.current && isInitialized) {
      const newMode = state.ui.activeViewportMode === '3d' ? '3d' : '2d';
      if (newMode !== currentMode) {
        viewportManagerRef.current.setMode(newMode);

        /* CLEAR OLD DEMO OBJECTS AND LOAD NEW ONES */
        if (state.project.isOpen) {
          demoObjects.forEach((obj) => viewportManagerRef.current?.removeObject(obj));
          const newDemo = createDemoScene(newMode);
          newDemo.forEach((obj) => viewportManagerRef.current?.addObject(obj));
          setDemoObjects(newDemo);
        }
      }
    }
  }, [state.ui.activeViewportMode, currentMode, isInitialized, demoObjects, state.project.isOpen]);

  /* LOAD DEMO CONTENT WHEN PROJECT OPENS */
  useEffect(() => {
    if (state.project.isOpen && viewportManagerRef.current && !hasLoadedDemo) {
      const demo = createDemoScene(currentMode);
      demo.forEach((obj) => viewportManagerRef.current?.addObject(obj));
      setDemoObjects(demo);
      setHasLoadedDemo(true);
    } else if (!state.project.isOpen && hasLoadedDemo) {
      /* CLEAR DEMO CONTENT WHEN PROJECT CLOSES */
      demoObjects.forEach((obj) => viewportManagerRef.current?.removeObject(obj));
      setDemoObjects([]);
      setHasLoadedDemo(false);
    }
  }, [state.project.isOpen, currentMode, hasLoadedDemo, demoObjects]);

  /**
   * handleModeToggle()
   *
   * Toggle between 2D and 3D viewport modes.
   */
  const handleModeToggle = useCallback(() => {
    if (viewportManagerRef.current) {
      viewportManagerRef.current.toggleMode();
    }
  }, []);

  /**
   * handleCameraPreset()
   *
   * Set camera to predefined position.
   */
  const handleCameraPreset = useCallback((preset: CameraPreset) => {
    if (viewportManagerRef.current) {
      viewportManagerRef.current.setCameraPreset(preset);
    }
  }, []);

  /**
   * handleCameraReset()
   *
   * Reset camera to default position.
   */
  const handleCameraReset = useCallback(() => {
    if (viewportManagerRef.current) {
      viewportManagerRef.current.resetCamera();
    }
  }, []);

  /**
   * handleToggleGrid()
   *
   * Toggle grid visibility.
   */
  const handleToggleGrid = useCallback(() => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    if (viewportManagerRef.current) {
      viewportManagerRef.current.updateSettings({ showGrid: newShowGrid });
    }
  }, [showGrid]);

  /**
   * handleToggleGizmos()
   *
   * Toggle gizmos visibility.
   */
  const handleToggleGizmos = useCallback(() => {
    const newShowGizmos = !showGizmos;
    setShowGizmos(newShowGizmos);
    if (viewportManagerRef.current) {
      viewportManagerRef.current.updateSettings({ showGizmos: newShowGizmos });
    }
  }, [showGizmos]);

  /**
   * handleToggleAxes()
   *
   * Toggle axes visibility.
   */
  const handleToggleAxes = useCallback(() => {
    const newShowAxes = !showAxes;
    setShowAxes(newShowAxes);
    if (viewportManagerRef.current) {
      viewportManagerRef.current.updateSettings({ showAxes: newShowAxes });
    }
  }, [showAxes]);

  /**
   * handleToggleSnap()
   *
   * Toggle snap to grid.
   */
  const handleToggleSnap = useCallback(() => {
    const newSnapToGrid = !snapToGrid;
    setSnapToGrid(newSnapToGrid);
    if (viewportManagerRef.current) {
      viewportManagerRef.current.updateSettings({ snapToGrid: newSnapToGrid });
    }
    if (manipulatorManagerRef.current) {
      manipulatorManagerRef.current.setSnapEnabled(newSnapToGrid);
    }
  }, [snapToGrid]);

  /**
   * handleManipulatorModeChange()
   *
   * Change manipulator mode (translate/rotate/scale).
   */
  const handleManipulatorModeChange = useCallback((mode: ManipulatorMode) => {
    setManipulatorMode(mode);
    if (manipulatorManagerRef.current) {
      manipulatorManagerRef.current.setMode(mode);
    }
  }, []);

  /**
   * handleTransformSpaceToggle()
   *
   * Toggle between world and local transform space.
   */
  const handleTransformSpaceToggle = useCallback(() => {
    const newSpace =
      transformSpace === TransformSpace.World ? TransformSpace.Local : TransformSpace.World;
    setTransformSpace(newSpace);
    if (manipulatorManagerRef.current) {
      manipulatorManagerRef.current.setSpace(newSpace);
    }
  }, [transformSpace]);

  /**
   * handleCanvasClick()
   *
   * Handle canvas click for object selection.
   */
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!viewportManagerRef.current) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      /* PERFORM OBJECT PICKING */
      if (currentMode === '3d') {
        const intersections = viewportManagerRef.current.raycast(x, y);
        if (intersections.length > 0) {
          viewportManagerRef.current.selectObject(intersections[0].object);
        } else {
          viewportManagerRef.current.clearSelection();
        }
      } else {
        const hitObject = viewportManagerRef.current.hitTest(x, y);
        if (hitObject) {
          viewportManagerRef.current.selectObject(hitObject);
        } else {
          viewportManagerRef.current.clearSelection();
        }
      }
    },
    [currentMode]
  );

  /**
   * handleContextMenu()
   *
   * Handle viewport context menu.
   */
  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    /* TODO: Show viewport context menu */
    console.log('[VIEWPORT] Context menu at', e.clientX, e.clientY);
  }, []);

  /**
   * handleNewProject()
   *
   * Shows new project dialog.
   */
  const handleNewProject = useCallback((): void => {
    setShowNewProjectDialog(true);
  }, []);

  /**
   * handleCreateProject()
   *
   * Handles project creation from wizard.
   */
  const handleCreateProject = useCallback(
    async (config: { name: string; location: string; template: any }): Promise<void> => {
      try {
        setIsCreatingProject(true);

        const projectPath = `${config.location}/${config.name}`;

        const project = (await window.worldedit.project.create(
          projectPath,
          config.name
        )) as ProjectData;

        actions.openProject({
          path: projectPath,
          name: project.name,
          version: project.version,
          engineVersion: project.engine_version,
          isModified: false,
          lastSaved: new Date(project.modified)
        });
      } catch (error) {
        console.error('[VIEWPORT] Failed to create project:', error);
        throw error;
      } finally {
        setIsCreatingProject(false);
      }
    },
    [actions]
  );

  /**
   * handleOpenProject()
   *
   * Handles project opening from path.
   */
  const handleOpenProject = useCallback(
    async (projectPath: string): Promise<void> => {
      try {
        setIsOpeningProject(true);

        const project = (await window.worldedit.project.open(projectPath)) as ProjectData;

        actions.openProject({
          path: projectPath,
          name: project.name,
          version: project.version,
          engineVersion: project.engine_version,
          isModified: false,
          lastSaved: new Date(project.modified)
        });
      } catch (error) {
        console.error('[VIEWPORT] Failed to open project:', error);

        await window.worldedit.dialog.showError(
          'Project Open Error',
          `Failed to open project: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setIsOpeningProject(false);
      }
    },
    [actions]
  );

  /**
   * handleBrowseProject()
   *
   * Shows file browser for project selection.
   */
  const handleBrowseProject = useCallback(async (): Promise<void> => {
    try {
      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Open Project'
      });

      if (dirPath) {
        await handleOpenProject(dirPath);
      }
    } catch (error) {
      console.error('[VIEWPORT] Failed to browse for project:', error);
    }
  }, [handleOpenProject]);

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

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.primary
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    cursor: 'crosshair'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  };

  const statsOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: theme.colors.foreground.primary,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    fontSize: '11px',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    zIndex: 2
  };

  return (
    <div style={panelStyle}>
      {/* Panel Header */}
      <div style={headerStyle}>
        <span>Viewport</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ fontSize: '12px', color: theme.colors.foreground.tertiary }}>
            {currentMode.toUpperCase()} • {fps} FPS
          </span>
        </div>
      </div>

      {/* Viewport Toolbar */}
      <ViewportToolbar
        mode={currentMode}
        showGrid={showGrid}
        showGizmos={showGizmos}
        showAxes={showAxes}
        snapToGrid={snapToGrid}
        onModeToggle={handleModeToggle}
        onCameraPreset={handleCameraPreset}
        onCameraReset={handleCameraReset}
        onToggleGrid={handleToggleGrid}
        onToggleGizmos={handleToggleGizmos}
        onToggleAxes={handleToggleAxes}
        onToggleSnap={handleToggleSnap}
        manipulatorMode={manipulatorMode}
        transformSpace={transformSpace}
        onManipulatorModeChange={handleManipulatorModeChange}
        onTransformSpaceToggle={handleTransformSpaceToggle}
      />

      {/* Viewport Content */}
      <div style={contentStyle}>
        <div ref={containerRef} style={canvasContainerStyle}>
          <canvas
            ref={canvasRef}
            style={canvasStyle}
            onContextMenu={handleContextMenu}
            onClick={handleCanvasClick}
          />

          {/* NO PROJECT OVERLAY - WELCOME SCREEN */}
          {!state.project.isOpen && (
            <div
              style={{
                ...overlayStyle,
                pointerEvents: 'auto',
                backgroundColor: 'rgba(30, 30, 30, 0.95)'
              }}
            >
              <div
                className="viewport-welcome"
                style={{ textAlign: 'center', maxWidth: '500px', padding: theme.spacing.xl }}
              >
                <h1
                  style={{
                    margin: 0,
                    marginBottom: theme.spacing.xl,
                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                    fontWeight: 700,
                    fontFamily:
                      'Hothouse, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: theme.colors.foreground.primary
                  }}
                >
                  WoRLDenV
                </h1>

                <p
                  style={{
                    margin: 0,
                    marginBottom: theme.spacing.xl,
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: theme.colors.foreground.secondary,
                    lineHeight: 1.5
                  }}
                >
                  Get started by creating a new project or opening an existing one
                </p>

                <div
                  className="viewport-buttons"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: theme.spacing.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.spacing.xl,
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNewProject}
                    disabled={isCreatingProject || isOpeningProject}
                    style={{
                      minWidth: '140px',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}
                  >
                    {isCreatingProject ? 'Creating...' : 'New Project'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowRecentProjectsDialog(true)}
                    disabled={isCreatingProject || isOpeningProject}
                    style={{
                      minWidth: '140px',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}
                  >
                    {isOpeningProject ? 'Opening...' : 'Open Project'}
                  </Button>
                </div>

                <div
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    color: theme.colors.foreground.tertiary,
                    textAlign: 'center' as const
                  }}
                >
                  All editor panels are visible and ready for use
                </div>
              </div>
            </div>
          )}

          {/* ENGINE MODE OVERLAY */}
          {isEngineMode && (
            <div
              style={{
                ...overlayStyle,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                border: `2px solid ${theme.colors.accent.success}`,
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: theme.spacing.md,
                  right: theme.spacing.md,
                  backgroundColor: theme.colors.accent.success,
                  color: '#ffffff',
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                PLAY MODE
              </div>
            </div>
          )}

          {/* RENDERING STATS OVERLAY */}
          {stats && isInitialized && (
            <div style={statsOverlayStyle}>
              <div>Mode: {isEngineMode ? 'ENGINE' : stats.mode.toUpperCase()}</div>
              <div>FPS: {fps}</div>
              <div>Frames: {stats.frameCount}</div>
              {engineReady && <div>Engine: Ready</div>}
              {'drawCalls' in stats.renderStats && 'triangles' in stats.renderStats && (
                <>
                  <div>Draw Calls: {stats.renderStats.drawCalls}</div>
                  <div>Triangles: {stats.renderStats.triangles}</div>
                </>
              )}
              {'sprites' in stats.renderStats && (
                <>
                  <div>Sprites: {stats.renderStats.sprites}</div>
                  <div>Graphics: {stats.renderStats.graphics}</div>
                </>
              )}
              <div>Textures: {stats.renderStats.textures}</div>
            </div>
          )}
        </div>
      </div>

      {/* Project Creation Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Recent Projects Dialog */}
      <RecentProjectsDialog
        isOpen={showRecentProjectsDialog}
        onClose={() => setShowRecentProjectsDialog(false)}
        onOpenProject={handleOpenProject}
        onBrowseProject={handleBrowseProject}
      />
    </div>
  );
}
