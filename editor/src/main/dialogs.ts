/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Dialog Handlers
 *
 * File and directory selection dialogs with message boxes.
 * Provides safe wrappers around Electron dialog API.
 */

import { dialog, BrowserWindow } from 'electron';
import { logger } from './logger';
import { DialogOptions, MessageDialogOptions } from '../shared/types';

class DialogManager {

  /**
   * openFile()
   *
   * Shows file selection dialog.
   * Returns selected file path or null if canceled.
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

  /**
   * openFiles()
   *
   * Shows file selection dialog allowing multiple files.
   * Returns array of selected file paths or empty array if canceled.
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

  /**
   * saveFile()
   *
   * Shows file save dialog.
   * Returns selected file path or null if canceled.
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

  /**
   * openDirectory()
   *
   * Shows directory selection dialog.
   * Returns selected directory path or null if canceled.
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

  /**
   * showMessage()
   *
   * Shows message dialog with buttons.
   * Returns index of clicked button.
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

  /**
   * showInfo()
   *
   * Shows informational message dialog.
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

  /**
   * showWarning()
   *
   * Shows warning message dialog.
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

  /**
   * showError()
   *
   * Shows error message dialog.
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

  /**
   * showConfirm()
   *
   * Shows confirmation dialog with Yes/No buttons.
   * Returns true if Yes clicked, false otherwise.
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

  /**
   * showSaveConfirm()
   *
   * Shows save confirmation dialog with Save/Don't Save/Cancel buttons.
   * Returns 'save', 'discard', or 'cancel'.
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

  /**
   * showErrorBox()
   *
   * Shows error message box (synchronous, blocks main process).
   * Use sparingly, primarily for fatal errors.
   */
  public showErrorBox(title: string, message: string): void {

    dialog.showErrorBox(title, message);

    logger.error('DIALOG', 'Error box shown', { title, message });

  }

}

export const dialogManager = new DialogManager();
