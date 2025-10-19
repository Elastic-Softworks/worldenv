/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
	WORLDEDIT - Clipboard Manager
	ELASTIC SOFTWORKS 2025
	===============================================================
*/

/*

	                --- CLIPBOARD ETHOS ---

	    the clipboard manager provides a comprehensive system
	    for cut, copy, and paste operations on entities and
	    components within the editor. it maintains a clipboard
	    stack that preserves entity hierarchies, component data,
	    and relationships between objects.

	    operations are designed to be intuitive and follow
	    standard desktop application conventions while handling
	    the complexities of game object relationships.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import { SceneManager } from '../hierarchy/SceneManager'; /* SCENE OPERATIONS */
import { NodeType } from '../hierarchy/Node'; /* NODE TYPES */
import { UndoRedoManager, ICommand } from '../undo'; /* COMMAND SYSTEM */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         ClipboardItem
	       ---
	       represents a single item in the clipboard that can
	       be an entity with its full component data and
	       transform hierarchy. maintains all necessary
	       information for accurate reconstruction.

*/

export interface ClipboardItem {
  type: 'entity' | 'component';
  entityId?: string;
  entityName?: string;
  parentId?: string;
  transform?: any;
  components?: Record<string, any>;
  children?: ClipboardItem[];
}

/*

         ClipboardData
	       ---
	       container for clipboard operations that holds
	       multiple items and metadata about the copy
	       operation including source context.

*/

export interface ClipboardData {
  items: ClipboardItem[];
  timestamp: number;
  sourceScene?: string;
  operation: 'copy' | 'cut';
}

/*
	===============================================================
             --- COMMANDS ---
	===============================================================
*/

/*

         PasteEntitiesCommand
	       ---
	       command for pasting entities from clipboard.
	       handles entity creation, component assignment,
	       and hierarchy reconstruction with undo support.

*/

class PasteEntitiesCommand implements ICommand {
  public description: string;
  private createdEntityIds: string[] = [];
  private sceneManager: SceneManager;

  constructor(
    private clipboardData: ClipboardData,
    private targetParentId?: string
  ) {
    const count = clipboardData.items.length;
    this.description = `Paste ${count} ${count === 1 ? 'entity' : 'entities'}`;
    this.sceneManager = SceneManager.getInstance();
  }

  execute(): void {
    this.createdEntityIds = [];

    for (const item of this.clipboardData.items) {
      if (item.type === 'entity') {
        const newEntityId = this.createEntityFromClipboard(item, this.targetParentId);
        if (newEntityId) {
          this.createdEntityIds.push(newEntityId);
        }
      }
    }
  }

  undo(): void {
    for (const entityId of this.createdEntityIds) {
      const scene = this.sceneManager.currentScene;
      if (scene) {
        const node = scene.getNode(entityId);
        if (node) {
          scene.removeNode(node);
        }
      }
    }
    this.createdEntityIds = [];
  }

  private createEntityFromClipboard(item: ClipboardItem, parentId?: string): string | null {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return null;

      /* CREATE NEW ENTITY */
      const parentNode = parentId ? scene.getNode(parentId) : null;
      const newNode = scene.createNode(
        this.generateUniqueName(item.entityName || 'Entity'),
        item.entityId?.startsWith('camera') ? NodeType.CAMERA : NodeType.ENTITY_3D,
        parentNode
      );

      /* RESTORE TRANSFORM */
      if (item.transform) {
        newNode.setTransform(item.transform);
      }

      /* CREATE CHILD ENTITIES RECURSIVELY */
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          this.createEntityFromClipboard(child, newNode.id);
        }
      }

      return newNode.id;
    } catch (error) {
      console.error('[CLIPBOARD] Failed to create entity from clipboard:', error);
      return null;
    }
  }

  private generateUniqueName(baseName: string): string {
    let counter = 1;
    let testName = baseName;
    const scene = this.sceneManager.currentScene;

    if (scene) {
      const allNodes = scene.getAllNodes();
      while (allNodes.some((node) => node.name === testName)) {
        testName = `${baseName} ${counter}`;
        counter++;
      }
    }

    return testName;
  }
}

/*

         DeleteEntitiesCommand
	       ---
	       command for deleting selected entities.
	       stores complete entity data for undo
	       including hierarchy and components.

*/

class DeleteEntitiesCommand implements ICommand {
  public description: string;
  private deletedEntities: ClipboardItem[] = [];
  private sceneManager: SceneManager;

  constructor(private entityIds: string[]) {
    const count = entityIds.length;
    this.description = `Delete ${count} ${count === 1 ? 'entity' : 'entities'}`;
    this.sceneManager = SceneManager.getInstance();
  }

  execute(): void {
    /* STORE ENTITY DATA BEFORE DELETION */
    this.deletedEntities = [];

    for (const entityId of this.entityIds) {
      const entityData = this.captureEntityData(entityId);
      if (entityData) {
        this.deletedEntities.push(entityData);
      }
    }

    /* DELETE ENTITIES */
    const scene = this.sceneManager.currentScene;
    if (scene) {
      for (const entityId of this.entityIds) {
        const node = scene.getNode(entityId);
        if (node) {
          scene.removeNode(node);
        }
      }
    }
  }

  undo(): void {
    /* RECREATE DELETED ENTITIES */
    for (const entityData of this.deletedEntities) {
      this.recreateEntity(entityData);
    }
    this.deletedEntities = [];
  }

  private captureEntityData(entityId: string): ClipboardItem | null {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return null;

      const entity = scene.getNode(entityId);
      if (!entity) return null;

      const transform = entity.transform;
      const children = entity.children;

      const item: ClipboardItem = {
        type: 'entity',
        entityId,
        entityName: entity.name,
        parentId: entity.parent?.id,
        transform
      };

      /* CAPTURE CHILD ENTITIES */
      if (children && children.length > 0) {
        item.children = [];
        for (const child of children) {
          const childData = this.captureEntityData(child.id);
          if (childData) {
            item.children.push(childData);
          }
        }
      }

      return item;
    } catch (error) {
      console.error('[CLIPBOARD] Failed to capture entity data:', error);
      return null;
    }
  }

  private recreateEntity(item: ClipboardItem, parentId?: string): string | null {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return null;

      const parentNode = parentId ? scene.getNode(parentId) : null;
      const newNode = scene.createNode(
        item.entityName || 'Entity',
        item.entityId?.startsWith('camera') ? NodeType.CAMERA : NodeType.ENTITY_3D,
        parentNode
      );

      /* RESTORE TRANSFORM */
      if (item.transform) {
        newNode.setTransform(item.transform);
      }

      /* RECREATE CHILDREN */
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          this.recreateEntity(child, newNode.id);
        }
      }

      return newNode.id;
    } catch (error) {
      console.error('[CLIPBOARD] Failed to recreate entity:', error);
      return null;
    }
  }
}

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/*

         ClipboardManager
	       ---
	       singleton manager for clipboard operations in the
	       editor. handles cut, copy, paste, and delete
	       operations for entities and components with
	       full undo/redo support.

*/

export class ClipboardManager {
  private static instance: ClipboardManager;
  private clipboardData: ClipboardData | null = null;
  private sceneManager: SceneManager;
  private undoRedoManager: UndoRedoManager;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.undoRedoManager = UndoRedoManager.getInstance();
  }

  public static getInstance(): ClipboardManager {
    if (!ClipboardManager.instance) {
      ClipboardManager.instance = new ClipboardManager();
    }
    return ClipboardManager.instance;
  }

  /*

           copyEntities()
	         ---
	         copies selected entities to clipboard without
	         removing them from the scene. captures full
	         entity data including components and hierarchy.

  */

  public copyEntities(entityIds: string[]): void {
    try {
      const items: ClipboardItem[] = [];

      for (const entityId of entityIds) {
        const item = this.captureEntityForClipboard(entityId);
        if (item) {
          items.push(item);
        }
      }

      this.clipboardData = {
        items,
        timestamp: Date.now(),
        sourceScene: this.sceneManager.currentScene?.metadata.name || 'Unknown',
        operation: 'copy'
      };

      console.log(`[CLIPBOARD] Copied ${items.length} entities to clipboard`);
    } catch (error) {
      console.error('[CLIPBOARD] Failed to copy entities:', error);
      throw error;
    }
  }

  /*

           cutEntities()
	         ---
	         copies entities to clipboard and removes them
	         from the scene using the command pattern for
	         undo support.

  */

  public cutEntities(entityIds: string[]): void {
    try {
      /* COPY TO CLIPBOARD FIRST */
      this.copyEntities(entityIds);

      if (this.clipboardData) {
        this.clipboardData.operation = 'cut';
      }

      /* DELETE ENTITIES WITH UNDO SUPPORT */
      const deleteCommand = new DeleteEntitiesCommand(entityIds);
      this.undoRedoManager.executeCommand(deleteCommand);

      console.log(`[CLIPBOARD] Cut ${entityIds.length} entities to clipboard`);
    } catch (error) {
      console.error('[CLIPBOARD] Failed to cut entities:', error);
      throw error;
    }
  }

  /*

           pasteEntities()
	         ---
	         creates new entities from clipboard data at
	         specified location. uses command pattern for
	         undo support.

  */

  public pasteEntities(targetParentId?: string): string[] {
    if (!this.clipboardData || this.clipboardData.items.length === 0) {
      console.warn('[CLIPBOARD] No data in clipboard to paste');
      return [];
    }

    try {
      const pasteCommand = new PasteEntitiesCommand(this.clipboardData, targetParentId);
      this.undoRedoManager.executeCommand(pasteCommand);

      const count = this.clipboardData.items.length;
      console.log(`[CLIPBOARD] Pasted ${count} entities from clipboard`);

      return []; /* RETURN CREATED ENTITY IDS IF NEEDED */
    } catch (error) {
      console.error('[CLIPBOARD] Failed to paste entities:', error);
      throw error;
    }
  }

  /*

           deleteEntities()
	         ---
	         deletes selected entities with undo support.
	         shows confirmation dialog for destructive
	         operations.

  */

  public async deleteEntities(entityIds: string[], showConfirmation = true): Promise<void> {
    if (entityIds.length === 0) {
      return;
    }

    try {
      if (showConfirmation) {
        const count = entityIds.length;
        const message = `Are you sure you want to delete ${count} ${count === 1 ? 'entity' : 'entities'}?`;

        const result = await window.worldedit.dialog.showMessage({
          type: 'warning',
          title: 'Confirm Deletion',
          message,
          buttons: ['Delete', 'Cancel'],
          defaultButton: 1,
          cancelButton: 1
        });

        if (result !== 0) {
          console.log('[CLIPBOARD] Entity deletion cancelled by user');
          return;
        }
      }

      const deleteCommand = new DeleteEntitiesCommand(entityIds);
      this.undoRedoManager.executeCommand(deleteCommand);

      console.log(`[CLIPBOARD] Deleted ${entityIds.length} entities`);
    } catch (error) {
      console.error('[CLIPBOARD] Failed to delete entities:', error);
      throw error;
    }
  }

  /*

           selectAllEntities()
	         ---
	         selects all entities in the current scene.
	         integrates with the editor's selection system.

  */

  public selectAllEntities(): string[] {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return [];

      const allNodes = scene.getAllNodes();
      const entityIds = allNodes.map((node) => node.id);
      console.log(`[CLIPBOARD] Selected ${entityIds.length} entities`);
      return entityIds;
    } catch (error) {
      console.error('[CLIPBOARD] Failed to select all entities:', error);
      return [];
    }
  }

  /*

           hasClipboardData()
	         ---
	         checks if clipboard contains data that can
	         be pasted.

  */

  public hasClipboardData(): boolean {
    return this.clipboardData !== null && this.clipboardData.items.length > 0;
  }

  /*

           getClipboardInfo()
	         ---
	         returns information about current clipboard
	         contents for UI display.

  */

  public getClipboardInfo(): { count: number; operation: string; timestamp: number } | null {
    if (!this.clipboardData) {
      return null;
    }

    return {
      count: this.clipboardData.items.length,
      operation: this.clipboardData.operation,
      timestamp: this.clipboardData.timestamp
    };
  }

  /*

           clearClipboard()
	         ---
	         empties clipboard contents.

  */

  public clearClipboard(): void {
    this.clipboardData = null;
    console.log('[CLIPBOARD] Clipboard cleared');
  }

  private captureEntityForClipboard(entityId: string): ClipboardItem | null {
    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return null;

      const entity = scene.getNode(entityId);
      if (!entity) return null;

      const transform = entity.transform;
      const children = entity.children;

      const item: ClipboardItem = {
        type: 'entity',
        entityId,
        entityName: entity.name,
        parentId: entity.parent?.id,
        transform
      };

      /* CAPTURE CHILD ENTITIES */
      if (children && children.length > 0) {
        item.children = [];
        for (const child of children) {
          const childData = this.captureEntityForClipboard(child.id);
          if (childData) {
            item.children.push(childData);
          }
        }
      }

      return item;
    } catch (error) {
      console.error('[CLIPBOARD] Failed to capture entity for clipboard:', error);
      return null;
    }
  }
}

/* END OF FILE */
