/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Undo/Redo Manager
 *
 * Manages undo/redo operations for property changes and entity modifications.
 * Implements command pattern for reversible operations.
 */

/**
 * Base command interface for undo/redo operations
 */
export interface ICommand {
  /** Execute the command */
  execute(): void;

  /** Undo the command */
  undo(): void;

  /** Command description for debugging */
  description: string;
}

/**
 * Property change command for component properties
 */
export class PropertyChangeCommand implements ICommand {
  public description: string;

  constructor(
    private entityId: string,
    private componentType: string,
    private propertyKey: string,
    private oldValue: any,
    private newValue: any,
    private componentSystem: any
  ) {
    this.description = `Change ${componentType}.${propertyKey}`;
  }

  execute(): void {
    const component = this.componentSystem.getComponent(this.entityId, this.componentType);
    if (component) {
      component.setProperty(this.propertyKey, this.newValue);
    }
  }

  undo(): void {
    const component = this.componentSystem.getComponent(this.entityId, this.componentType);
    if (component) {
      component.setProperty(this.propertyKey, this.oldValue);
    }
  }
}

/**
 * Component add command
 */
export class AddComponentCommand implements ICommand {
  public description: string;

  constructor(
    private entityId: string,
    private componentType: string,
    private componentUtils: any
  ) {
    this.description = `Add ${componentType} component`;
  }

  execute(): void {
    this.componentUtils.addComponentSafe(this.entityId, this.componentType);
  }

  undo(): void {
    this.componentUtils.removeComponentSafe(this.entityId, this.componentType);
  }
}

/**
 * Component remove command
 */
export class RemoveComponentCommand implements ICommand {
  public description: string;
  private componentData: any;

  constructor(
    private entityId: string,
    private componentType: string,
    private componentSystem: any,
    private componentUtils: any
  ) {
    this.description = `Remove ${componentType} component`;

    // Store component data before removal
    const component = this.componentSystem.getComponent(this.entityId, this.componentType);
    if (component) {
      this.componentData = component.serialize();
    }
  }

  execute(): void {
    this.componentUtils.removeComponentSafe(this.entityId, this.componentType);
  }

  undo(): void {
    const result = this.componentUtils.addComponentSafe(this.entityId, this.componentType);
    if (result.success && this.componentData) {
      const component = this.componentSystem.getComponent(this.entityId, this.componentType);
      if (component) {
        component.deserialize(this.componentData);
      }
    }
  }
}

/**
 * Entity rename command
 */
export class RenameEntityCommand implements ICommand {
  public description: string;

  constructor(
    private entity: any,
    private oldName: string,
    private newName: string
  ) {
    this.description = `Rename entity to "${newName}"`;
  }

  execute(): void {
    this.entity.name = this.newName;
  }

  undo(): void {
    this.entity.name = this.oldName;
  }
}

/**
 * UndoRedoManager
 *
 * Manages command history for undo/redo operations.
 */
export class UndoRedoManager {
  private static instance: UndoRedoManager;

  private undoStack: ICommand[] = [];
  private redoStack: ICommand[] = [];
  private maxHistorySize: number = 100;
  private listeners: Array<() => void> = [];

  /**
   * getInstance()
   *
   * Singleton pattern implementation.
   */
  public static getInstance(): UndoRedoManager {
    if (!UndoRedoManager.instance) {
      UndoRedoManager.instance = new UndoRedoManager();
    }
    return UndoRedoManager.instance;
  }

  /**
   * executeCommand()
   *
   * Executes a command and adds it to undo stack.
   */
  public executeCommand(command: ICommand): void {
    // Execute the command
    command.execute();

    // Add to undo stack
    this.undoStack.push(command);

    // Clear redo stack when new command is executed
    this.redoStack = [];

    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.notifyListeners();
  }

  /**
   * undo()
   *
   * Undoes the last command.
   */
  public undo(): boolean {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * redo()
   *
   * Redoes the last undone command.
   */
  public redo(): boolean {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * canUndo()
   *
   * Checks if undo is available.
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * canRedo()
   *
   * Checks if redo is available.
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * clear()
   *
   * Clears both undo and redo stacks.
   */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * getUndoCount()
   *
   * Returns number of available undo operations.
   */
  public getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * getRedoCount()
   *
   * Returns number of available redo operations.
   */
  public getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * getLastUndoDescription()
   *
   * Returns description of the last undoable command.
   */
  public getLastUndoDescription(): string | null {
    const lastCommand = this.undoStack[this.undoStack.length - 1];
    return lastCommand ? lastCommand.description : null;
  }

  /**
   * getLastRedoDescription()
   *
   * Returns description of the last redoable command.
   */
  public getLastRedoDescription(): string | null {
    const lastCommand = this.redoStack[this.redoStack.length - 1];
    return lastCommand ? lastCommand.description : null;
  }

  /**
   * addListener()
   *
   * Adds a listener for undo/redo state changes.
   */
  public addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  /**
   * removeListener()
   *
   * Removes a listener for undo/redo state changes.
   */
  public removeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * notifyListeners()
   *
   * Notifies all listeners of state changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
