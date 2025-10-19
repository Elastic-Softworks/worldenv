/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        KeyboardShortcutManager
        ---
        this module manages the comprehensive keyboard shortcut system
        for the WORLDEDIT editor. it provides a centralized way to
        register, execute, and manage keyboard shortcuts throughout
        the application.

        the system supports modifier keys (ctrl, alt, shift, meta)
        and provides context-aware shortcuts that can be enabled or
        disabled based on editor state and focus context.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

/* EDITOR STATE ACTIONS */
import {
  TransformManager,
  TransformMode
} from '../transform/TransformManager'; /* TRANSFORM SYSTEM */
import { ClipboardManager } from '../clipboard/ClipboardManager'; /* CLIPBOARD SYSTEM */
import { SearchManager } from '../search/SearchManager'; /* SEARCH SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/**
 * Keyboard shortcut definition interface
 */
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void | Promise<void>;
  description: string;
  category: ShortcutCategory;
  context?: ShortcutContext;
  enabled?: () => boolean;
}

/**
 * Shortcut categories for organization
 */
enum ShortcutCategory {
  FILE = 'File',
  EDIT = 'Edit',
  VIEW = 'View',
  TRANSFORM = 'Transform',
  NAVIGATION = 'Navigation',
  PLAYBACK = 'Playback',
  GENERAL = 'General'
}

/**
 * Context where shortcut is active
 */
enum ShortcutContext {
  GLOBAL = 'global',
  VIEWPORT = 'viewport',
  HIERARCHY = 'hierarchy',
  INSPECTOR = 'inspector',
  SCRIPT_EDITOR = 'script_editor'
}

/**
 * Keyboard event handler type
 */
type KeyEventHandler = (event: KeyboardEvent) => void;

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/**
 * KeyboardShortcutManager class
 *
 * Centralized keyboard shortcut management system.
 * Handles registration, execution, and context management.
 */
export class KeyboardShortcutManager {
  private static instance: KeyboardShortcutManager | null = null;

  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private contextStack: ShortcutContext[] = [ShortcutContext.GLOBAL];
  private enabled: boolean = true;
  private eventHandler: KeyEventHandler | null = null;

  /* EXTERNAL DEPENDENCIES */
  private editorActions: any = null;
  private transformManager: TransformManager;
  private clipboardManager: ClipboardManager;
  private searchManager: SearchManager;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.transformManager = TransformManager.getInstance();
    this.clipboardManager = ClipboardManager.getInstance();
    this.searchManager = SearchManager.getInstance();

    /* BIND EVENT HANDLER */
    this.eventHandler = this.handleKeyDown.bind(this);

    /* REGISTER DEFAULT SHORTCUTS */
    this.registerDefaultShortcuts();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KeyboardShortcutManager {
    if (!KeyboardShortcutManager.instance) {
      KeyboardShortcutManager.instance = new KeyboardShortcutManager();
    }

    return KeyboardShortcutManager.instance;
  }

  /**
   * Initialize with editor actions
   */
  public initialize(editorActions: any): void {
    this.editorActions = editorActions;
    this.attachEventListeners();
  }

  /**
   * Attach keyboard event listeners
   */
  public attachEventListeners(): void {
    if (this.eventHandler) {
      document.addEventListener('keydown', this.eventHandler, true);
    }
  }

  /**
   * Detach keyboard event listeners
   */
  public detachEventListeners(): void {
    if (this.eventHandler) {
      document.removeEventListener('keydown', this.eventHandler, true);
    }
  }

  /**
   * Register a keyboard shortcut
   */
  public registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  public unregisterShortcut(
    key: string,
    modifiers?: {
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
      metaKey?: boolean;
    }
  ): void {
    const shortcutKey = modifiers
      ? this.generateShortcutKey({ key, ...modifiers } as KeyboardShortcut)
      : key;

    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Get all registered shortcuts
   */
  public getShortcuts(): Map<string, KeyboardShortcut> {
    return new Map(this.shortcuts);
  }

  /**
   * Get shortcuts by category
   */
  public getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter((shortcut) => shortcut.category === category);
  }

  /**
   * Push context onto stack
   */
  public pushContext(context: ShortcutContext): void {
    this.contextStack.push(context);
  }

  /**
   * Pop context from stack
   */
  public popContext(): ShortcutContext | undefined {
    if (this.contextStack.length > 1) {
      return this.contextStack.pop();
    }

    return undefined;
  }

  /**
   * Get current context
   */
  public getCurrentContext(): ShortcutContext {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Enable/disable shortcut system
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    /* IGNORE IF TYPING IN INPUT ELEMENTS */
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true')
    ) {
      return;
    }

    const shortcutKey = this.generateShortcutKey({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    } as KeyboardShortcut);

    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      /* CHECK CONTEXT */
      const currentContext = this.getCurrentContext();
      if (
        shortcut.context &&
        shortcut.context !== ShortcutContext.GLOBAL &&
        shortcut.context !== currentContext
      ) {
        return;
      }

      /* CHECK IF ENABLED */
      if (shortcut.enabled && !shortcut.enabled()) {
        return;
      }

      /* EXECUTE SHORTCUT */
      event.preventDefault();
      event.stopPropagation();

      try {
        shortcut.action();
      } catch (error) {
        console.error('[KEYBOARD] Shortcut execution failed:', error);
      }
    }
  }

  /**
   * Generate unique key for shortcut
   */
  private generateShortcutKey(shortcut: {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  }): string {
    const modifiers: string[] = [];

    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.metaKey) modifiers.push('meta');

    modifiers.push(shortcut.key.toLowerCase());

    return modifiers.join('+');
  }

  /**
   * Register default application shortcuts
   */
  private registerDefaultShortcuts(): void {
    /* FILE OPERATIONS */
    this.registerShortcut({
      key: 'n',
      ctrlKey: true,
      action: () => this.handleNewProject(),
      description: 'New Project',
      category: ShortcutCategory.FILE
    });

    this.registerShortcut({
      key: 'o',
      ctrlKey: true,
      action: () => this.handleOpenProject(),
      description: 'Open Project',
      category: ShortcutCategory.FILE
    });

    this.registerShortcut({
      key: 's',
      ctrlKey: true,
      action: () => this.handleSaveProject(),
      description: 'Save Project',
      category: ShortcutCategory.FILE
    });

    /* EDIT OPERATIONS */
    this.registerShortcut({
      key: 'z',
      ctrlKey: true,
      action: () => this.handleUndo(),
      description: 'Undo',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'y',
      ctrlKey: true,
      action: () => this.handleRedo(),
      description: 'Redo',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => this.handleRedo(),
      description: 'Redo (Alternate)',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'c',
      ctrlKey: true,
      action: () => this.handleCopy(),
      description: 'Copy',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'x',
      ctrlKey: true,
      action: () => this.handleCut(),
      description: 'Cut',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'v',
      ctrlKey: true,
      action: () => this.handlePaste(),
      description: 'Paste',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'a',
      ctrlKey: true,
      action: () => this.handleSelectAll(),
      description: 'Select All',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'Delete',
      action: () => this.handleDelete(),
      description: 'Delete Selected',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'd',
      ctrlKey: true,
      action: () => this.handleDuplicate(),
      description: 'Duplicate',
      category: ShortcutCategory.EDIT
    });

    /* SEARCH OPERATIONS */
    this.registerShortcut({
      key: 'f',
      ctrlKey: true,
      action: () => this.handleFind(),
      description: 'Find and Replace',
      category: ShortcutCategory.EDIT
    });

    this.registerShortcut({
      key: 'g',
      ctrlKey: true,
      action: () => this.handleFindNext(),
      description: 'Find Next',
      category: ShortcutCategory.EDIT
    });

    /* TRANSFORM TOOLS */
    this.registerShortcut({
      key: 'q',
      action: () => this.setTransformMode(TransformMode.SELECT),
      description: 'Select Tool',
      category: ShortcutCategory.TRANSFORM
    });

    this.registerShortcut({
      key: 'w',
      action: () => this.setTransformMode(TransformMode.TRANSLATE),
      description: 'Move Tool',
      category: ShortcutCategory.TRANSFORM
    });

    this.registerShortcut({
      key: 'e',
      action: () => this.setTransformMode(TransformMode.ROTATE),
      description: 'Rotate Tool',
      category: ShortcutCategory.TRANSFORM
    });

    this.registerShortcut({
      key: 'r',
      action: () => this.setTransformMode(TransformMode.SCALE),
      description: 'Scale Tool',
      category: ShortcutCategory.TRANSFORM
    });

    this.registerShortcut({
      key: 'g',
      action: () => this.activateGrabMode(),
      description: 'Grab (Move)',
      category: ShortcutCategory.TRANSFORM
    });

    /* PLAYBACK CONTROLS */
    this.registerShortcut({
      key: 'F5',
      action: () => this.handlePlayToggle(),
      description: 'Play/Pause',
      category: ShortcutCategory.PLAYBACK
    });

    this.registerShortcut({
      key: 'F6',
      action: () => this.handleStop(),
      description: 'Stop',
      category: ShortcutCategory.PLAYBACK
    });

    /* VIEW CONTROLS */
    this.registerShortcut({
      key: '1',
      ctrlKey: true,
      action: () => this.togglePanel('hierarchy'),
      description: 'Toggle Hierarchy Panel',
      category: ShortcutCategory.VIEW
    });

    this.registerShortcut({
      key: '2',
      ctrlKey: true,
      action: () => this.togglePanel('inspector'),
      description: 'Toggle Inspector Panel',
      category: ShortcutCategory.VIEW
    });

    this.registerShortcut({
      key: '3',
      ctrlKey: true,
      action: () => this.togglePanel('assets'),
      description: 'Toggle Assets Panel',
      category: ShortcutCategory.VIEW
    });

    this.registerShortcut({
      key: '4',
      ctrlKey: true,
      action: () => this.togglePanel('script'),
      description: 'Toggle Script Panel',
      category: ShortcutCategory.VIEW
    });

    /* GENERAL SHORTCUTS */
    this.registerShortcut({
      key: 'F1',
      action: () => this.showKeyboardShortcuts(),
      description: 'Show Keyboard Shortcuts',
      category: ShortcutCategory.GENERAL
    });
  }

  /*
	===============================================================
             --- ACTIONS ---
	===============================================================
*/

  /**
   * File operation handlers
   */
  private async handleNewProject(): Promise<void> {
    if (this.editorActions) {
      // Trigger new project action from MenuBar
      const event = new CustomEvent('editor:new-project');
      document.dispatchEvent(event);
    }
  }

  private async handleOpenProject(): Promise<void> {
    if (this.editorActions) {
      const event = new CustomEvent('editor:open-project');
      document.dispatchEvent(event);
    }
  }

  private async handleSaveProject(): Promise<void> {
    if (this.editorActions) {
      const event = new CustomEvent('editor:save-project');
      document.dispatchEvent(event);
    }
  }

  /**
   * Edit operation handlers
   */
  private handleUndo(): void {
    const event = new CustomEvent('editor:undo');
    document.dispatchEvent(event);
  }

  private handleRedo(): void {
    const event = new CustomEvent('editor:redo');
    document.dispatchEvent(event);
  }

  private handleCopy(): void {
    const event = new CustomEvent('editor:copy');
    document.dispatchEvent(event);
  }

  private handleCut(): void {
    const event = new CustomEvent('editor:cut');
    document.dispatchEvent(event);
  }

  private handlePaste(): void {
    const event = new CustomEvent('editor:paste');
    document.dispatchEvent(event);
  }

  private handleSelectAll(): void {
    const event = new CustomEvent('editor:select-all');
    document.dispatchEvent(event);
  }

  private handleDelete(): void {
    const event = new CustomEvent('editor:delete-selected');
    document.dispatchEvent(event);
  }

  private handleDuplicate(): void {
    const event = new CustomEvent('editor:duplicate');
    document.dispatchEvent(event);
  }

  /**
   * Search operation handlers
   */
  private handleFind(): void {
    const event = new CustomEvent('editor:show-find-replace');
    document.dispatchEvent(event);
  }

  private handleFindNext(): void {
    const event = new CustomEvent('editor:find-next');
    document.dispatchEvent(event);
  }

  /**
   * Transform operation handlers
   */
  private setTransformMode(mode: TransformMode): void {
    this.transformManager.setTransformMode(mode);
  }

  private activateGrabMode(): void {
    /* GRAB MODE IS ESSENTIALLY TRANSLATE WITH IMMEDIATE MOUSE FOLLOW */
    this.transformManager.setTransformMode(TransformMode.TRANSLATE);

    /* DISPATCH EVENT FOR UI TO HANDLE MOUSE CAPTURE */
    const event = new CustomEvent('transform:grab-mode-activated');
    document.dispatchEvent(event);
  }

  /**
   * Playback control handlers
   */
  private handlePlayToggle(): void {
    const event = new CustomEvent('editor:play-toggle');
    document.dispatchEvent(event);
  }

  private handleStop(): void {
    const event = new CustomEvent('editor:stop');
    document.dispatchEvent(event);
  }

  /**
   * Panel toggle handlers
   */
  private togglePanel(panelName: string): void {
    if (this.editorActions) {
      this.editorActions.togglePanel(panelName as any);
    }
  }

  /**
   * Show keyboard shortcuts dialog
   */
  private showKeyboardShortcuts(): void {
    const event = new CustomEvent('editor:show-keyboard-shortcuts');
    document.dispatchEvent(event);
  }
}

/* EXPORT SINGLETON INSTANCE */
export const keyboardShortcutManager = KeyboardShortcutManager.getInstance();

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export { ShortcutCategory, ShortcutContext };
export type { KeyboardShortcut };

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
