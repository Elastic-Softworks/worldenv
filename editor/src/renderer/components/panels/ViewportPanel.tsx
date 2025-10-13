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
import { ViewportManager, ViewportMode, ViewportStats } from '../../viewport/ViewportManager';
import { CameraPreset } from '../../viewport/EditorCamera';
import { ViewportToolbar } from '../ui/ViewportToolbar';
import { createDemoScene, animateObjects } from '../../viewport/DemoContent';
import { EngineInterface } from '../../engine/EngineInterface';
import * as THREE from 'three';
import * as PIXI from 'pixi.js';

/**
 * ViewportPanel component
 *
 * Central viewport for scene rendering and editing.
 * Manages 2D/3D rendering with full editor integration.
 */
export function ViewportPanel(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportManagerRef = useRef<ViewportManager | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<ViewportMode>('3d');
  const [stats, setStats] = useState<ViewportStats | null>(null);
  const [fps, setFps] = useState(0);
  const [isEngineMode, setIsEngineMode] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

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

    /* CLEANUP FUNCTION */
    return (): void => {
      window.removeEventListener('resize', resizeCanvas);
      if (viewportManagerRef.current) {
        viewportManagerRef.current.dispose();
        viewportManagerRef.current = null;
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
  }, [snapToGrid]);

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
    backgroundColor: '#1e1e1e'
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

          {/* NO PROJECT OVERLAY */}
          {!state.project.isOpen && (
            <div style={overlayStyle}>
              <div style={{ textAlign: 'center', color: theme.colors.foreground.tertiary }}>
                <p style={{ margin: 0, fontSize: '18px', marginBottom: theme.spacing.sm }}>
                  No Project Open
                </p>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Create or open a project to start editing
                </p>
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
    </div>
  );
}
