/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             DIALOG MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	dialog system provides safe wrappers around Electron's dialog API
	for file operations and user communications.

	this module handles all modal interactions including file selection,
	directory browsing, message boxes, and confirmation dialogs. the
	system provides consistent error handling and logging for all
	dialog operations.

	dialog types supported:
	- file open/save dialogs with filtering
	- directory selection dialogs
	- informational and error message boxes
	- confirmation dialogs with multiple response options

	all dialogs are asynchronous and provide proper error recovery
	when operations fail or are canceled by the user.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import { dialog, BrowserWindow } from 'electron'; /* ELECTRON DIALOG API */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { DialogOptions, MessageDialogOptions } from '../shared/types'; /* TYPE DEFINITIONS */

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         DialogManager
	       ---
	       centralized dialog management for file and message operations.

	       provides consistent interface for all dialog types with
	       proper error handling and logging. wraps Electron's native
	       dialog API to ensure safe operation and graceful fallbacks.

	       supports file operations (open, save, directory selection)
	       and user communication (messages, confirmations, errors).
	       all operations are asynchronous and respect user cancellation.

*/

class DialogManager {
  /*

           openFile()
	         ---
	         displays file selection dialog for single file.

	         shows native file picker with configurable filters
	         and options. returns selected file path or null
	         if user cancels operation.

	         handles dialog errors gracefully and provides
	         logging for debugging file selection issues.

  */

  public async openFile(
    window: BrowserWindow | null,
    options: DialogOptions = {}
  ): Promise<string | null> {
    try {
      const result = await dialog.showOpenDialog(window as BrowserWindow, {
        title: options.title || 'Open File',
        defaultPath: options.default_path,
        filters: options.filters || [],
        properties: ['openFile', 'showHiddenFiles']
      });

      if (result.canceled || result.filePaths.length === 0) {
        logger.debug('DIALOG', 'File open canceled');
        return null;
      }

      const file_path = result.filePaths[0];
      logger.info('DIALOG', 'File selected', { path: file_path });

      return file_path;
    } catch (error) {
      logger.error('DIALOG', 'File open dialog failed', { error });
      return null;
    }
  }

  /*

           openFiles()
	         ---
	         displays file selection dialog allowing multiple files.

	         enables multi-selection for batch file operations.
	         returns array of selected file paths or empty array
	         if operation is canceled.

	         useful for importing multiple assets or processing
	         several files simultaneously.

  */

  public async openFiles(
    window: BrowserWindow | null,
    options: DialogOptions = {}
  ): Promise<string[]> {
    try {
      const result = await dialog.showOpenDialog(window as BrowserWindow, {
        title: options.title || 'Open Files',
        defaultPath: options.default_path,
        filters: options.filters || [],
        properties: ['openFile', 'multiSelections', 'showHiddenFiles']
      });

      if (result.canceled || result.filePaths.length === 0) {
        logger.debug('DIALOG', 'Files open canceled');
        return [];
      }

      logger.info('DIALOG', 'Files selected', {
        count: result.filePaths.length
      });

      return result.filePaths;
    } catch (error) {
      logger.error('DIALOG', 'Files open dialog failed', { error });
      return [];
    }
  }

  /*

           saveFile()
	         ---
	         displays file save dialog for output selection.

	         shows native save picker with configurable filters
	         and default locations. allows user to specify
	         output file name and location.

	         supports directory creation if user navigates
	         to non-existent paths during save operation.

  */

  public async saveFile(
    window: BrowserWindow | null,
    options: DialogOptions = {}
  ): Promise<string | null> {
    try {
      const result = await dialog.showSaveDialog(window as BrowserWindow, {
        title: options.title || 'Save File',
        defaultPath: options.default_path,
        filters: options.filters || [],
        properties: ['showHiddenFiles', 'createDirectory']
      });

      if (result.canceled || !result.filePath) {
        logger.debug('DIALOG', 'File save canceled');
        return null;
      }

      logger.info('DIALOG', 'Save path selected', {
        path: result.filePath
      });

      return result.filePath;
    } catch (error) {
      logger.error('DIALOG', 'File save dialog failed', { error });
      return null;
    }
  }

  /*

           openDirectory()
	         ---
	         displays directory selection dialog.

	         allows user to select folders for project operations,
	         asset imports, or output destinations. supports
	         directory creation during selection process.

	         commonly used for project creation, asset folder
	         selection, and build output configuration.

  */

  public async openDirectory(
    window: BrowserWindow | null,
    options: DialogOptions = {}
  ): Promise<string | null> {
    try {
      const result = await dialog.showOpenDialog(window as BrowserWindow, {
        title: options.title || 'Open Directory',
        defaultPath: options.default_path,
        properties: ['openDirectory', 'showHiddenFiles', 'createDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        logger.debug('DIALOG', 'Directory open canceled');
        return null;
      }

      const dir_path = result.filePaths[0];
      logger.info('DIALOG', 'Directory selected', { path: dir_path });

      return dir_path;
    } catch (error) {
      logger.error('DIALOG', 'Directory open dialog failed', { error });
      return null;
    }
  }

  /*

           showMessage()
	         ---
	         displays generic message dialog with custom buttons.

	         provides foundation for all message-based dialogs
	         including info, warning, error, and confirmation
	         dialogs. returns button index for response handling.

	         supports custom button arrays and default/cancel
	         button configuration for consistent behavior.

  */

  public async showMessage(
    window: BrowserWindow | null,
    options: MessageDialogOptions
  ): Promise<number> {
    try {
      const result = await dialog.showMessageBox(window as BrowserWindow, {
        type: options.type,
        title: options.title,
        message: options.message,
        detail: options.detail,
        buttons: options.buttons || ['OK'],
        defaultId: options.default_id || 0,
        cancelId: options.cancel_id
      });

      logger.debug('DIALOG', 'Message dialog closed', {
        button_index: result.response
      });

      return result.response;
    } catch (error) {
      logger.error('DIALOG', 'Message dialog failed', { error });
      return options.cancel_id || 0;
    }
  }

  /*

           showInfo()
	         ---
	         displays informational message dialog.

	         provides simple information display with OK button.
	         used for status updates, completion notifications,
	         and general user information.

  */

  public async showInfo(
    window: BrowserWindow | null,
    title: string,
    message: string,
    detail?: string
  ): Promise<void> {
    await this.showMessage(window, {
      type: 'info',
      title: title,
      message: message,
      detail: detail,
      buttons: ['OK']
    });
  }

  /*

           showWarning()
	         ---
	         displays warning message dialog.

	         alerts user to potentially problematic conditions
	         that require attention but don't prevent operation.
	         uses warning icon for visual emphasis.

  */

  public async showWarning(
    window: BrowserWindow | null,
    title: string,
    message: string,
    detail?: string
  ): Promise<void> {
    await this.showMessage(window, {
      type: 'warning',
      title: title,
      message: message,
      detail: detail,
      buttons: ['OK']
    });
  }

  /*

           showError()
	         ---
	         displays error message dialog.

	         notifies user of operation failures or critical
	         problems requiring immediate attention. uses
	         error icon to indicate severity.

  */

  public async showError(
    window: BrowserWindow | null,
    title: string,
    message: string,
    detail?: string
  ): Promise<void> {
    await this.showMessage(window, {
      type: 'error',
      title: title,
      message: message,
      detail: detail,
      buttons: ['OK']
    });
  }

  /*

           showConfirm()
	         ---
	         displays yes/no confirmation dialog.

	         requests user confirmation for potentially
	         destructive or significant operations.
	         returns boolean for simple decision handling.

  */

  public async showConfirm(
    window: BrowserWindow | null,
    title: string,
    message: string,
    detail?: string
  ): Promise<boolean> {
    const result = await this.showMessage(window, {
      type: 'question',
      title: title,
      message: message,
      detail: detail,
      buttons: ['Yes', 'No'],
      default_id: 0,
      cancel_id: 1
    });

    return result === 0;
  }

  /*

           showSaveConfirm()
	         ---
	         displays save confirmation dialog with three options.

	         handles unsaved changes scenarios with save,
	         discard, or cancel options. returns string
	         identifier for clear response handling.

	         commonly used when closing projects or exiting
	         application with unsaved modifications.

  */

  public async showSaveConfirm(
    window: BrowserWindow | null,
    title: string,
    message: string
  ): Promise<'save' | 'discard' | 'cancel'> {
    const result = await this.showMessage(window, {
      type: 'question',
      title: title,
      message: message,
      buttons: ['Save', "Don't Save", 'Cancel'],
      default_id: 0,
      cancel_id: 2
    });

    if (result === 0) {
      return 'save';
    } else if (result === 1) {
      return 'discard';
    } else {
      return 'cancel';
    }
  }

  /*

           showErrorBox()
	         ---
	         displays synchronous error dialog.

	         blocks main process execution until dismissed.
	         used only for fatal errors requiring immediate
	         attention before application can continue.

	         use sparingly as it freezes application UI
	         until user acknowledges the error message.

  */

  public showErrorBox(title: string, message: string): void {
    dialog.showErrorBox(title, message);
    logger.error('DIALOG', 'Error box shown', { title, message });
  }
}

/* singleton instance for application-wide dialog management */
export const dialogManager = new DialogManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
