/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Menu Bar Component
 *
 * Top-level menu bar with application menus.
 * Provides access to file operations, edit functions, and view options.
 */

import React, { useState } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Menu item interface
 */
interface MenuItem {
  label?: string;
  action?: () => void;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

/**
 * MenuBar component
 *
 * Application menu bar with dropdown menus.
 */
export function MenuBar(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme, toggleTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  /**
   * handleNewProject()
   *
   * Handles new project creation.
   */
  const handleNewProject = async (): Promise<void> => {
    try {
      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Select Project Directory',
        properties: ['createDirectory']
      });

      if (!dirPath) {
        return;
      }

      const projectName = dirPath.split('/').pop() || 'New Project';
      const project = await window.worldedit.project.create(dirPath, projectName);

      actions.openProject({
        path: dirPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified)
      });
    } catch (error) {
      console.error('[MENU] Failed to create project:', error);
      await window.worldedit.dialog.showError(
        'Project Creation Error',
        `Failed to create new project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handleOpenProject()
   *
   * Handles project opening.
   */
  const handleOpenProject = async (): Promise<void> => {
    try {
      const dirPath = await window.worldedit.dialog.openDirectory({
        title: 'Open Project'
      });

      if (!dirPath) {
        return;
      }

      const project = await window.worldedit.project.open(dirPath);

      actions.openProject({
        path: dirPath,
        name: project.name,
        version: project.version,
        engineVersion: project.engine_version,
        isModified: false,
        lastSaved: new Date(project.modified)
      });
    } catch (error) {
      console.error('[MENU] Failed to open project:', error);
      await window.worldedit.dialog.showError(
        'Project Open Error',
        `Failed to open project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handleSaveProject()
   *
   * Handles project saving.
   */
  const handleSaveProject = async (): Promise<void> => {
    try {
      await window.worldedit.project.save();
      actions.saveProject();
    } catch (error) {
      console.error('[MENU] Failed to save project:', error);
      await window.worldedit.dialog.showError(
        'Save Error',
        `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  /**
   * handleCloseProject()
   *
   * Handles project closing.
   */
  const handleCloseProject = async (): Promise<void> => {
    try {
      if (state.project.isModified) {
        const shouldSave = await window.worldedit.dialog.showConfirm(
          'Unsaved Changes',
          'Do you want to save changes before closing?'
        );

        if (shouldSave) {
          await handleSaveProject();
        }
      }

      await window.worldedit.project.close();
      actions.closeProject();
    } catch (error) {
      console.error('[MENU] Failed to close project:', error);
    }
  };

  /**
   * Menu structure
   */
  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Project', action: handleNewProject, shortcut: 'Ctrl+N' },
      { label: 'Open Project', action: handleOpenProject, shortcut: 'Ctrl+O' },
      { separator: true },
      {
        label: 'Save Project',
        action: handleSaveProject,
        shortcut: 'Ctrl+S',
        disabled: !state.project.isOpen || !state.project.isModified
      },
      {
        label: 'Close Project',
        action: handleCloseProject,
        disabled: !state.project.isOpen
      },
      { separator: true },
      { label: 'Exit', action: () => window.close(), shortcut: 'Ctrl+Q' }
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', disabled: true },
      { label: 'Redo', shortcut: 'Ctrl+Y', disabled: true },
      { separator: true },
      { label: 'Cut', shortcut: 'Ctrl+X', disabled: true },
      { label: 'Copy', shortcut: 'Ctrl+C', disabled: true },
      { label: 'Paste', shortcut: 'Ctrl+V', disabled: true },
      { separator: true },
      { label: 'Select All', shortcut: 'Ctrl+A', disabled: true },
      {
        label: 'Deselect All',
        action: actions.clearSelection,
        disabled: state.selectedEntities.length === 0
      }
    ],
    View: [
      {
        label: 'Toggle Theme',
        action: toggleTheme,
        shortcut: 'Ctrl+T'
      },
      { separator: true },
      {
        label: state.ui.panels.hierarchy.visible ? 'Hide Hierarchy' : 'Show Hierarchy',
        action: () => actions.togglePanel('hierarchy', !state.ui.panels.hierarchy.visible)
      },
      {
        label: state.ui.panels.inspector.visible ? 'Hide Inspector' : 'Show Inspector',
        action: () => actions.togglePanel('inspector', !state.ui.panels.inspector.visible)
      },
      {
        label: state.ui.panels.assets.visible ? 'Hide Assets' : 'Show Assets',
        action: () => actions.togglePanel('assets', !state.ui.panels.assets.visible)
      },
      { separator: true },
      {
        label: state.ui.showGrid ? 'Hide Grid' : 'Show Grid',
        action: () => actions.toggleGrid(!state.ui.showGrid),
        shortcut: 'Ctrl+G'
      },
      {
        label: state.ui.showGizmos ? 'Hide Gizmos' : 'Show Gizmos',
        action: () => actions.toggleGizmos(!state.ui.showGizmos)
      },
      {
        label: state.ui.snapToGrid ? 'Disable Snap to Grid' : 'Enable Snap to Grid',
        action: () => actions.toggleSnapToGrid(!state.ui.snapToGrid)
      },
      { separator: true },
      {
        label: 'Switch to 2D View',
        action: () => actions.setViewportMode('2d'),
        disabled: state.ui.activeViewportMode === '2d'
      },
      {
        label: 'Switch to 3D View',
        action: () => actions.setViewportMode('3d'),
        disabled: state.ui.activeViewportMode === '3d'
      }
    ],
    Help: [
      {
        label: 'About WORLDEDIT',
        action: () =>
          window.worldedit.dialog.showMessage({
            type: 'info',
            title: 'About',
            message: `WORLDEDIT v${state.version}\nGame Development Editor for WORLDENV Engine`
          })
      },
      { label: 'Documentation', disabled: true },
      { label: 'Keyboard Shortcuts', disabled: true }
    ]
  };

  /**
   * handleMenuClick()
   *
   * Handles menu button click.
   */
  const handleMenuClick = (menuName: string): void => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  /**
   * handleMenuItemClick()
   *
   * Handles menu item click.
   */
  const handleMenuItemClick = (item: MenuItem): void => {
    if (item.action && !item.disabled) {
      item.action();
    }
    setActiveMenu(null);
  };

  /**
   * renderMenuItem()
   *
   * Renders a menu item with optional separator.
   */
  const renderMenuItem = (item: MenuItem, index: number): JSX.Element => {
    if (item.separator) {
      return (
        <div
          key={`separator-${index}`}
          style={{
            height: '1px',
            backgroundColor: theme.colors.border.primary,
            margin: `${theme.spacing.xs} 0`
          }}
        />
      );
    }

    return (
      <div
        key={item.label}
        onClick={() => handleMenuItemClick(item)}
        style={{
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          opacity: item.disabled ? 0.5 : 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          backgroundColor: 'transparent',
          transition: 'background-color 0.1s ease'
        }}
        onMouseEnter={(e) => {
          if (!item.disabled) {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>{item.label}</span>
        {item.shortcut && (
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.foreground.tertiary,
              marginLeft: theme.spacing.lg
            }}
          >
            {item.shortcut}
          </span>
        )}
      </div>
    );
  };

  const menuBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '32px',
    backgroundColor: theme.colors.background.secondary,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    padding: `0 ${theme.spacing.sm}`,
    position: 'relative',
    zIndex: 1000
  };

  const menuButtonStyle: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.colors.foreground.primary,
    borderRadius: theme.borderRadius.sm,
    transition: 'background-color 0.1s ease'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: theme.colors.panel.background,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.md,
    minWidth: '200px',
    zIndex: 1001
  };

  return (
    <>
      <div style={menuBarStyle}>
        {Object.entries(menus).map(([menuName, items]) => (
          <div key={menuName} style={{ position: 'relative' }}>
            <button
              style={{
                ...menuButtonStyle,
                backgroundColor:
                  activeMenu === menuName ? theme.colors.background.tertiary : 'transparent'
              }}
              onClick={() => handleMenuClick(menuName)}
              onMouseEnter={(e) => {
                if (activeMenu !== menuName) {
                  e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenu !== menuName) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {menuName}
            </button>

            {activeMenu === menuName && (
              <div style={dropdownStyle}>
                {items.map((item, index) => renderMenuItem(item, index))}
              </div>
            )}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {state.project.isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span style={{ fontSize: '14px', color: theme.colors.foreground.secondary }}>
              {state.project.name}
            </span>
            {state.project.isModified && (
              <span style={{ fontSize: '12px', color: theme.colors.accent.warning }}>●</span>
            )}
          </div>
        )}
      </div>

      {activeMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setActiveMenu(null)}
        />
      )}
    </>
  );
}
