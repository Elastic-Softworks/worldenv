/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Application Menu
 *
 * Defines application menu structure for native menu bar.
 * Includes File, Edit, View, Window, and Help menus.
 */

import { Menu, BrowserWindow, app, shell } from 'electron';
import { logger } from './logger';

interface MenuHandlers {
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onSaveProjectAs?: () => void;
  onCloseProject?: () => void;
  onExit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onToggleDevTools?: () => void;
  onReload?: () => void;
  onToggleFullScreen?: () => void;
  onResetZoom?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onShowDocumentation?: () => void;
  onShowAbout?: () => void;
}

class MenuManager {
  private handlers: MenuHandlers;
  private current_menu: Menu | null;

  constructor() {
    this.handlers = {};
    this.current_menu = null;
  }

  /**
   * setHandlers()
   *
   * Sets menu action handlers.
   */
  public setHandlers(handlers: MenuHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * buildMenu()
   *
   * Builds and sets application menu.
   */
  public buildMenu(_window: BrowserWindow | null): void {
    const is_mac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
      ...(is_mac ? [this.buildMacAppMenu()] : []),
      this.buildFileMenu(),
      this.buildEditMenu(),
      this.buildViewMenu(),
      this.buildWindowMenu(),
      this.buildHelpMenu()
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    this.current_menu = menu;

    logger.debug('MENU', 'Application menu built');
  }

  /**
   * buildMacAppMenu()
   *
   * Builds macOS-specific app menu.
   */
  private buildMacAppMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => {
            this.handlers.onShowAbout?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services'
        },
        { type: 'separator' },
        {
          label: `Hide ${app.name}`,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideOthers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            this.handlers.onExit?.();
          }
        }
      ]
    };
  }

  /**
   * buildFileMenu()
   *
   * Builds File menu.
   */
  private buildFileMenu(): Electron.MenuItemConstructorOptions {
    const is_mac = process.platform === 'darwin';

    return {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            this.handlers.onNewProject?.();
          }
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            this.handlers.onOpenProject?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            this.handlers.onSaveProject?.();
          }
        },
        {
          label: 'Save Project As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            this.handlers.onSaveProjectAs?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Close Project',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            this.handlers.onCloseProject?.();
          }
        },
        { type: 'separator' },
        ...(is_mac
          ? []
          : [
              {
                label: 'Exit',
                accelerator: 'Alt+F4',
                click: () => {
                  this.handlers.onExit?.();
                }
              }
            ])
      ]
    };
  }

  /**
   * buildEditMenu()
   *
   * Builds Edit menu.
   */
  private buildEditMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            this.handlers.onUndo?.();
          }
        },
        {
          label: 'Redo',
          accelerator: process.platform === 'darwin' ? 'Shift+Command+Z' : 'CmdOrCtrl+Y',
          click: () => {
            this.handlers.onRedo?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => {
            this.handlers.onCut?.();
          }
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => {
            this.handlers.onCopy?.();
          }
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            this.handlers.onPaste?.();
          }
        },
        {
          label: 'Delete',
          accelerator: 'Delete',
          click: () => {
            this.handlers.onDelete?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            this.handlers.onSelectAll?.();
          }
        }
      ]
    };
  }

  /**
   * buildViewMenu()
   *
   * Builds View menu.
   */
  private buildViewMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            this.handlers.onReload?.();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            this.handlers.onToggleDevTools?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            this.handlers.onResetZoom?.();
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            this.handlers.onZoomIn?.();
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            this.handlers.onZoomOut?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => {
            this.handlers.onToggleFullScreen?.();
          }
        }
      ]
    };
  }

  /**
   * buildWindowMenu()
   *
   * Builds Window menu.
   */
  private buildWindowMenu(): Electron.MenuItemConstructorOptions {
    const is_mac = process.platform === 'darwin';

    return {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        ...(is_mac
          ? [
              {
                label: 'Zoom',
                role: 'zoom' as const
              },
              { type: 'separator' as const },
              {
                label: 'Bring All to Front',
                role: 'front' as const
              }
            ]
          : [
              {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close' as const
              }
            ])
      ]
    };
  }

  /**
   * buildHelpMenu()
   *
   * Builds Help menu.
   */
  private buildHelpMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          accelerator: 'F1',
          click: () => {
            this.handlers.onShowDocumentation?.();
          }
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/elasticsoftworks/worldenv');
          }
        },
        { type: 'separator' },
        {
          label: 'About WORLDEDIT',
          click: () => {
            this.handlers.onShowAbout?.();
          }
        }
      ]
    };
  }

  /**
   * updateMenu()
   *
   * Updates menu state based on application state.
   */
  public updateMenu(state: {
    has_project?: boolean;
    can_undo?: boolean;
    can_redo?: boolean;
    has_selection?: boolean;
  }): void {
    if (!this.current_menu) {
      return;
    }

    logger.debug('MENU', 'Menu updated', state);
  }
}

export const menuManager = new MenuManager();
