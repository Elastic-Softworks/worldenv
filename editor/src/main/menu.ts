/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             MENU MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	native application menu system for cross-platform menu bar support
	in worldenv editor with full keyboard shortcut integration.

	this module manages the complete application menu structure including
	File, Edit, Build, View, Window, and Help menus. handles platform-
	specific differences between macOS and Windows/Linux menu conventions.

	menu features:
	- platform-aware menu construction (macOS app menu handling)
	- comprehensive keyboard shortcuts with cross-platform support
	- dynamic menu state updates based on application context
	- handler-based callback system for menu actions
	- proper separator placement for logical grouping

	the system automatically adapts menu structure and shortcuts
	to match platform conventions while maintaining consistent
	functionality across all supported operating systems.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import { Menu, BrowserWindow, app, shell } from 'electron'; /* ELECTRON MENU API */
import { logger } from './logger'; /* LOGGING SYSTEM */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         MenuHandlers
	       ---
	       callback interface for menu action handling.

	       provides optional handler functions for all menu actions
	       allowing the menu system to delegate operations to
	       appropriate application components. uses optional
	       properties to allow partial handler registration.

*/

interface MenuHandlers {
  onNewProject?: () => void /* CREATE NEW PROJECT */;
  onOpenProject?: () => void /* OPEN EXISTING PROJECT */;
  onSaveProject?: () => void /* SAVE CURRENT PROJECT */;
  onSaveProjectAs?: () => void /* SAVE PROJECT WITH NEW NAME */;
  onCloseProject?: () => void /* CLOSE CURRENT PROJECT */;
  onExit?: () => void /* EXIT APPLICATION */;
  onUndo?: () => void /* UNDO LAST ACTION */;
  onRedo?: () => void /* REDO LAST UNDONE ACTION */;
  onCut?: () => void /* CUT SELECTION TO CLIPBOARD */;
  onCopy?: () => void /* COPY SELECTION TO CLIPBOARD */;
  onPaste?: () => void /* PASTE FROM CLIPBOARD */;
  onDelete?: () => void /* DELETE SELECTION */;
  onSelectAll?: () => void /* SELECT ALL ITEMS */;
  onBuildProject?: () => void /* BUILD CURRENT PROJECT */;
  onBuildConfiguration?: () => void /* CONFIGURE BUILD SETTINGS */;
  onOpenBuildLocation?: () => void /* OPEN BUILD OUTPUT FOLDER */;
  onToggleDevTools?: () => void /* TOGGLE DEVELOPER TOOLS */;
  onReload?: () => void /* RELOAD APPLICATION */;
  onToggleFullScreen?: () => void /* TOGGLE FULLSCREEN MODE */;
  onResetZoom?: () => void /* RESET ZOOM TO 100% */;
  onZoomIn?: () => void /* INCREASE ZOOM LEVEL */;
  onZoomOut?: () => void /* DECREASE ZOOM LEVEL */;
  onShowDocumentation?: () => void /* SHOW HELP DOCUMENTATION */;
  onShowAbout?: () => void /* SHOW ABOUT DIALOG */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         MenuManager
	       ---
	       native application menu construction and management.

	       builds platform-appropriate menu structures with proper
	       keyboard shortcuts and separator placement. handles
	       differences between macOS (with app menu) and Windows/Linux
	       menu conventions.

	       supports dynamic menu updates based on application state
	       such as project availability, undo/redo capability, and
	       selection status. provides comprehensive callback system
	       for menu action delegation.

*/

class MenuManager {
  private handlers: MenuHandlers; /* MENU ACTION CALLBACKS */
  private current_menu: Menu | null; /* ACTIVE MENU INSTANCE */

  constructor() {
    this.handlers = {};
    this.current_menu = null;
  }

  /*

           setHandlers()
	         ---
	         registers callback functions for menu actions.

	         allows application components to provide handlers
	         for menu operations. uses spread operator to merge
	         new handlers with existing ones.

  */

  public setHandlers(handlers: MenuHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /*

           buildMenu()
	         ---
	         constructs and activates application menu structure.

	         builds platform-appropriate menu with all standard
	         menus and shortcuts. automatically includes macOS
	         app menu when running on Darwin platform.

  */

  public buildMenu(_window: BrowserWindow | null): void {
    const is_mac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
      ...(is_mac ? [this.buildMacAppMenu()] : []),
      this.buildFileMenu(),
      this.buildEditMenu(),
      this.buildBuildMenu(),
      this.buildViewMenu(),
      this.buildWindowMenu(),
      this.buildHelpMenu()
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    this.current_menu = menu;

    logger.debug('MENU', 'Application menu built');
  }

  /*

           buildMacAppMenu()
	         ---
	         constructs macOS-specific application menu.

	         creates standard macOS app menu with About, Services,
	         Hide/Show actions, and Quit option. follows Apple
	         Human Interface Guidelines for menu structure.

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

  /*

           buildFileMenu()
	         ---
	         constructs File menu with project operations.

	         includes standard file operations (New, Open, Save)
	         with proper keyboard shortcuts. adapts Exit placement
	         based on platform conventions.

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
        /* exit menu item only appears on Windows/Linux
           since macOS uses app menu for Quit */
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

  /*

           buildEditMenu()
	         ---
	         constructs Edit menu with standard editing operations.

	         provides undo/redo, clipboard operations, and selection
	         commands with appropriate keyboard shortcuts for all
	         platforms.

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
          /* macOS uses Shift+Command+Z while Windows/Linux uses Ctrl+Y */
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

  /*

           buildBuildMenu()
	         ---
	         constructs Build menu for project compilation operations.

	         provides build commands and configuration access
	         with keyboard shortcuts for common build operations.

  */

  private buildBuildMenu(): Electron.MenuItemConstructorOptions {
    return {
      label: 'Build',
      submenu: [
        {
          label: 'Build Project',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            this.handlers.onBuildProject?.();
          }
        },
        {
          label: 'Build Configuration...',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            this.handlers.onBuildConfiguration?.();
          }
        },
        { type: 'separator' },
        {
          label: 'Open Build Location',
          click: () => {
            this.handlers.onOpenBuildLocation?.();
          }
        }
      ]
    };
  }

  /*

           buildViewMenu()
	         ---
	         constructs View menu with display and zoom controls.

	         includes developer tools access, zoom controls, and
	         fullscreen toggle with platform-appropriate shortcuts.

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
          /* platform-specific developer tools shortcuts */
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
          /* platform-specific fullscreen shortcuts */
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => {
            this.handlers.onToggleFullScreen?.();
          }
        }
      ]
    };
  }

  /*

           buildWindowMenu()
	         ---
	         constructs Window menu with platform-specific window controls.

	         adapts menu structure based on platform conventions.
	         macOS includes Zoom and Bring All to Front while
	         Windows/Linux includes Close window action.

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
        /* platform-specific window menu items */
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

  /*

           buildHelpMenu()
	         ---
	         constructs Help menu with documentation and about information.

	         provides access to help documentation, project repository,
	         and application about dialog.

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
            /* open external repository link in default browser */
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

  /*

           updateMenu()
	         ---
	         updates menu state based on application context.

	         allows dynamic enabling/disabling of menu items
	         based on current application state such as
	         project availability and selection status.

  */

  public updateMenu(state: {
    has_project?: boolean /* PROJECT IS LOADED */;
    can_undo?: boolean /* UNDO OPERATION AVAILABLE */;
    can_redo?: boolean /* REDO OPERATION AVAILABLE */;
    has_selection?: boolean /* ITEMS ARE SELECTED */;
  }): void {
    if (!this.current_menu) {
      return;
    }

    /* future implementation: dynamically enable/disable
       menu items based on application state */

    logger.debug('MENU', 'Menu updated', state);
  }
}

/* singleton instance for application-wide menu management */
export const menuManager = new MenuManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
