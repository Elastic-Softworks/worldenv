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
 * Transform command for position changes
 */
export class TransformPositionCommand implements ICommand {
  public description: string;

  constructor(
    private targets: any[],
    private oldPositions: THREE.Vector3[],
    private newPositions: THREE.Vector3[]
  ) {
    const targetCount = targets.length;
    this.description =
      targetCount === 1 ? `Move ${targets[0].name || 'entity'}` : `Move ${targetCount} entities`;
  }

  execute(): void {
    this.targets.forEach((target, index) => {
      if (this.newPositions[index]) {
        target.position.copy(this.newPositions[index]);
      }
    });
  }

  undo(): void {
    this.targets.forEach((target, index) => {
      if (this.oldPositions[index]) {
        target.position.copy(this.oldPositions[index]);
      }
    });
  }
}

/**
 * Transform command for rotation changes
 */
export class TransformRotationCommand implements ICommand {
  public description: string;

  constructor(
    private targets: any[],
    private oldRotations: THREE.Euler[],
    private newRotations: THREE.Euler[]
  ) {
    const targetCount = targets.length;
    this.description =
      targetCount === 1
        ? `Rotate ${targets[0].name || 'entity'}`
        : `Rotate ${targetCount} entities`;
  }

  execute(): void {
    this.targets.forEach((target, index) => {
      if (this.newRotations[index]) {
        target.rotation.copy(this.newRotations[index]);
      }
    });
  }

  undo(): void {
    this.targets.forEach((target, index) => {
      if (this.oldRotations[index]) {
        target.rotation.copy(this.oldRotations[index]);
      }
    });
  }
}

/**
 * Transform command for scale changes
 */
export class TransformScaleCommand implements ICommand {
  public description: string;

  constructor(
    private targets: any[],
    private oldScales: THREE.Vector3[],
    private newScales: THREE.Vector3[]
  ) {
    const targetCount = targets.length;
    this.description =
      targetCount === 1 ? `Scale ${targets[0].name || 'entity'}` : `Scale ${targetCount} entities`;
  }

  execute(): void {
    this.targets.forEach((target, index) => {
      if (this.newScales[index]) {
        target.scale.copy(this.newScales[index]);
      }
    });
  }

  undo(): void {
    this.targets.forEach((target, index) => {
      if (this.oldScales[index]) {
        target.scale.copy(this.oldScales[index]);
      }
    });
  }
}

/**
 * Create entity command
 */
export class CreateEntityCommand implements ICommand {
  public description: string;
  private createdNode: any = null;

  constructor(
    private entityData: any,
    private parentEntity: any,
    private sceneManager: any
  ) {
    this.description = `Create entity "${entityData.name}"`;
  }

  execute(): void {
    this.createdNode = this.sceneManager.createNode(
      this.entityData.name,
      this.entityData.type,
      this.parentEntity
    );
  }

  undo(): void {
    if (this.createdNode) {
      this.sceneManager.removeNode(this.createdNode);
    }
  }
}

/**
 * Delete entity command
 */
export class DeleteEntityCommand implements ICommand {
  public description: string;
  private nodeData: any;
  private parentNode: any;

  constructor(
    private node: any,
    private sceneManager: any
  ) {
    this.description = `Delete entity "${node.name}"`;

    // Store node data and parent before deletion
    this.nodeData = {
      id: node.id,
      name: node.name,
      type: node.type,
      transform: node.transform,
      properties: node.properties
    };
    this.parentNode = node.parent;
  }

  execute(): void {
    this.sceneManager.removeNode(this.node);
  }

  undo(): void {
    const restoredNode = this.sceneManager.createNode(
      this.nodeData.name,
      this.nodeData.type,
      this.parentNode
    );
    if (restoredNode && this.nodeData.transform) {
      restoredNode.setTransform(this.nodeData.transform);
    }
    return restoredNode;
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
    this.listeners.forEach((listener) => listener());
  }
}
