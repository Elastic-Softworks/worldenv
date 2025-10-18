/*
   ===============================================================
   WORLDEDIT OBJECT SELECTION SYSTEM
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import * as THREE from 'three'; /* 3D RENDERING LIBRARY */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

export interface SelectionEvent {
  selected: THREE.Object3D[] /* newly selected objects */;
  deselected: THREE.Object3D[] /* objects removed from selection */;
  primary: THREE.Object3D | null /* primary selection for transform operations */;
}

export interface SelectionOptions {
  highlightColor: number /* color for selected object highlighting */;
  outlineColor: number /* color for selection outline effect */;
  highlightOpacity: number /* transparency of highlight overlay */;
  outlineWidth: number /* thickness of outline in pixels */;
  enableOutline: boolean /* enable outline post-processing effect */;
  enableHighlight: boolean /* enable highlight material overlay */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         ObjectSelectionSystem
	       ---
	       comprehensive object selection system for 3D viewport
	       interactions. handles single and multi-selection with
	       visual feedback through highlighting and outline effects.

	       the system uses raycasting to detect mouse interactions
	       with 3D objects in the scene. it maintains selection
	       state and provides events for other systems like the
	       hierarchy panel and transform manipulators.

	       visual feedback includes material highlighting for
	       selected objects and optional outline post-processing
	       effects for better visibility.

*/

export class ObjectSelectionSystem {
  /* core rendering components for selection operations */
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  /* selection state management */
  private selectedObjects: Set<THREE.Object3D>;
  private primarySelection: THREE.Object3D | null;
  private selectableObjects: Set<THREE.Object3D>;

  /* visual feedback systems */
  private outlinePass: any | null;
  private highlightMaterials: Map<THREE.Object3D, THREE.Material[]>;
  private originalMaterials: Map<THREE.Object3D, THREE.Material[]>;
  private selectionBox: THREE.Box3Helper | null;

  /* INTERACTION STATE */
  private isEnabled: boolean;
  private isDragging: boolean;
  private dragStartTime: number;
  private dragThreshold: number;

  /* CONFIGURATION */
  private options: SelectionOptions;

  /* EVENT LISTENERS */
  private eventListeners: Map<string, (event: SelectionEvent) => void>;

  /* CONSTANTS */
  private static readonly DRAG_THRESHOLD_MS = 150;
  private static readonly RAYCAST_LAYERS = 0;
  private static readonly SELECTION_COLOR = 0x00ff00;
  private static readonly OUTLINE_COLOR = 0xffffff;

  constructor(scene: THREE.Scene, camera: THREE.Camera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    /* INITIALIZE SELECTION STATE */
    this.selectedObjects = new Set();
    this.primarySelection = null;
    this.selectableObjects = new Set();

    /* INITIALIZE VISUAL FEEDBACK */
    this.outlinePass = null;
    this.highlightMaterials = new Map();
    this.originalMaterials = new Map();
    this.selectionBox = null;

    /* INITIALIZE INTERACTION STATE */
    this.isEnabled = true;
    this.isDragging = false;
    this.dragStartTime = 0;
    this.dragThreshold = ObjectSelectionSystem.DRAG_THRESHOLD_MS;

    /* INITIALIZE OPTIONS */
    this.options = {
      highlightColor: ObjectSelectionSystem.SELECTION_COLOR,
      outlineColor: ObjectSelectionSystem.OUTLINE_COLOR,
      highlightOpacity: 0.3,
      outlineWidth: 2,
      enableOutline: true,
      enableHighlight: true
    };

    /* INITIALIZE EVENT LISTENERS */
    this.eventListeners = new Map();

    this.setupEventListeners();
    this.initializeVisualFeedback();
  }

  /**
   * setupEventListeners()
   *
   * Set up mouse and keyboard event listeners for selection.
   */
  private setupEventListeners(): void {
    /* MOUSE EVENTS */
    this.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.handleMouseUp.bind(this));

    /* KEYBOARD EVENTS */
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * initializeVisualFeedback()
   *
   * Initialize visual feedback systems for selection highlighting.
   */
  private initializeVisualFeedback(): void {
    /* CREATE SELECTION BOX HELPER */
    const box = new THREE.Box3();
    this.selectionBox = new THREE.Box3Helper(box, ObjectSelectionSystem.SELECTION_COLOR);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);
  }

  /**
   * handleMouseDown()
   *
   * Handle mouse down event for selection start.
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled || event.button !== 0) {
      return;
    }

    this.isDragging = false;
    this.dragStartTime = Date.now();

    this.updateMousePosition(event);
  }

  /**
   * handleMouseMove()
   *
   * Handle mouse move event during potential drag.
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    /* CHECK FOR DRAG THRESHOLD */
    if (Date.now() - this.dragStartTime > this.dragThreshold) {
      this.isDragging = true;
    }

    this.updateMousePosition(event);
  }

  /**
   * handleMouseUp()
   *
   * Handle mouse up event for selection completion.
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled || event.button !== 0 || this.isDragging) {
      return;
    }

    this.performSelection(event);
  }

  /**
   * handleKeyDown()
   *
   * Handle keyboard shortcuts for selection operations.
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) {
      return;
    }

    switch (event.code) {
      case 'KeyA':
        if (event.ctrlKey || event.metaKey) {
          this.selectAll();
          event.preventDefault();
        }
        break;

      case 'Escape':
        this.clearSelection();
        event.preventDefault();
        break;

      case 'Delete':
      case 'Backspace':
        this.deleteSelected();
        event.preventDefault();
        break;
    }
  }

  /**
   * updateMousePosition()
   *
   * Update normalized mouse coordinates for raycasting.
   */
  private updateMousePosition(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * performSelection()
   *
   * Perform raycasting and object selection.
   */
  private performSelection(event: MouseEvent): void {
    /* PERFORM RAYCAST */
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.layers.set(ObjectSelectionSystem.RAYCAST_LAYERS);

    const selectableArray = Array.from(this.selectableObjects);
    const intersects = this.raycaster.intersectObjects(selectableArray, true);

    if (intersects.length > 0) {
      const hitObject = this.findSelectableParent(intersects[0].object);

      if (hitObject) {
        this.handleObjectSelection(hitObject, event);
      }
    } else {
      /* CLICKED ON EMPTY SPACE */
      if (!event.ctrlKey && !event.shiftKey && !event.metaKey) {
        this.clearSelection();
      }
    }
  }

  /**
   * findSelectableParent()
   *
   * Find the selectable parent object from hit result.
   */
  private findSelectableParent(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (this.selectableObjects.has(current)) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * handleObjectSelection()
   *
   * Handle selection of a specific object with modifier key support.
   */
  private handleObjectSelection(object: THREE.Object3D, event: MouseEvent): void {
    const isSelected = this.selectedObjects.has(object);
    const isMultiSelect = event.ctrlKey || event.metaKey;
    const isRangeSelect = event.shiftKey;

    if (isMultiSelect) {
      /* TOGGLE SELECTION */
      if (isSelected) {
        this.removeFromSelection(object);
      } else {
        this.addToSelection(object);
      }
      this.toggleSelection(object);
    } else if (isRangeSelect && this.primarySelection) {
      /* RANGE SELECTION - TODO: Implement range selection logic */
      this.addToSelection(object);
    } else {
      /* SINGLE SELECTION */
      if (!isSelected || this.selectedObjects.size > 1) {
        this.setSelection([object]);
      }
    }
  }

  /**
   * toggleSelection()
   *
   * Toggle selection state of object.
   */
  private toggleSelection(object: THREE.Object3D): void {
    if (this.selectedObjects.has(object)) {
      this.removeFromSelection(object);
    } else {
      this.addToSelection(object);
    }
  }

  /**
   * setSelection()
   *
   * Set selected objects, replacing current selection.
   */
  public setSelection(objects: THREE.Object3D[]): void {
    const previousSelection = Array.from(this.selectedObjects);
    const newSelection = objects.filter((obj) => this.selectableObjects.has(obj));

    /* CLEAR CURRENT SELECTION */
    this.clearSelectionInternal();

    /* SET NEW SELECTION */
    newSelection.forEach((obj) => {
      this.selectedObjects.add(obj);
      this.applySelectionHighlight(obj);
    });

    /* SET PRIMARY SELECTION */
    this.primarySelection = newSelection.length > 0 ? newSelection[0] : null;

    /* UPDATE VISUAL FEEDBACK */
    this.updateSelectionBox();

    /* DISPATCH SELECTION EVENT */
    this.dispatchSelectionEvent(newSelection, previousSelection);
  }

  /**
   * addToSelection()
   *
   * Add object to current selection.
   */
  public addToSelection(object: THREE.Object3D): void {
    if (!this.selectableObjects.has(object) || this.selectedObjects.has(object)) {
      return;
    }

    this.selectedObjects.add(object);
    this.applySelectionHighlight(object);

    /* SET AS PRIMARY IF FIRST SELECTION */
    if (!this.primarySelection) {
      this.primarySelection = object;
    }

    this.updateSelectionBox();

    this.dispatchSelectionEvent([object], []);
  }

  /**
   * removeFromSelection()
   *
   * Remove object from current selection.
   */
  public removeFromSelection(object: THREE.Object3D): void {
    if (!this.selectedObjects.has(object)) {
      return;
    }

    this.selectedObjects.delete(object);
    this.removeSelectionHighlight(object);

    /* UPDATE PRIMARY SELECTION */
    if (this.primarySelection === object) {
      this.primarySelection =
        this.selectedObjects.size > 0 ? this.selectedObjects.values().next().value || null : null;
    }

    this.updateSelectionBox();

    this.dispatchSelectionEvent([], [object]);
  }

  /**
   * clearSelection()
   *
   * Clear all selected objects.
   */
  public clearSelection(): void {
    const previousSelection = Array.from(this.selectedObjects);

    this.clearSelectionInternal();
    this.updateSelectionBox();

    this.dispatchSelectionEvent([], previousSelection);
  }

  /**
   * clearSelectionInternal()
   *
   * Internal method to clear selection without events.
   */
  private clearSelectionInternal(): void {
    this.selectedObjects.forEach((obj) => {
      this.removeSelectionHighlight(obj);
    });

    this.selectedObjects.clear();
    this.primarySelection = null;
  }

  /**
   * selectAll()
   *
   * Select all selectable objects.
   */
  public selectAll(): void {
    const allObjects = Array.from(this.selectableObjects);
    this.setSelection(allObjects);
  }

  /**
   * getSelection()
   *
   * Get currently selected objects.
   */
  public getSelection(): THREE.Object3D[] {
    return Array.from(this.selectedObjects);
  }

  /**
   * getPrimarySelection()
   *
   * Get primary selected object.
   */
  public getPrimarySelection(): THREE.Object3D | null {
    return this.primarySelection;
  }

  /**
   * hasSelection()
   *
   * Check if any objects are selected.
   */
  public hasSelection(): boolean {
    return this.selectedObjects.size > 0;
  }

  /**
   * isSelected()
   *
   * Check if specific object is selected.
   */
  public isSelected(object: THREE.Object3D): boolean {
    return this.selectedObjects.has(object);
  }

  /**
   * addSelectableObject()
   *
   * Add object to selectable set.
   */
  public addSelectableObject(object: THREE.Object3D): void {
    this.selectableObjects.add(object);
  }

  /**
   * removeSelectableObject()
   *
   * Remove object from selectable set.
   */
  public removeSelectableObject(object: THREE.Object3D): void {
    this.selectableObjects.delete(object);
    this.removeFromSelection(object);
  }

  /**
   * setSelectableObjects()
   *
   * Set all selectable objects.
   */
  public setSelectableObjects(objects: THREE.Object3D[]): void {
    this.selectableObjects.clear();
    objects.forEach((obj) => this.selectableObjects.add(obj));
  }

  /**
   * applySelectionHighlight()
   *
   * Apply visual highlighting to selected object.
   */
  private applySelectionHighlight(object: THREE.Object3D): void {
    if (!this.options.enableHighlight) {
      return;
    }

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        /* STORE ORIGINAL MATERIALS */
        if (!this.originalMaterials.has(child)) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          this.originalMaterials.set(child, materials.slice());
        }

        /* CREATE HIGHLIGHT MATERIALS */
        const highlightMaterials = this.createHighlightMaterials(child);
        this.highlightMaterials.set(child, highlightMaterials);

        /* APPLY HIGHLIGHT */
        child.material =
          highlightMaterials.length === 1 ? highlightMaterials[0] : highlightMaterials;
      }
    });
  }

  /**
   * removeSelectionHighlight()
   *
   * Remove visual highlighting from object.
   */
  private removeSelectionHighlight(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        /* RESTORE ORIGINAL MATERIALS */
        const originalMaterials = this.originalMaterials.get(child);
        if (originalMaterials) {
          child.material =
            originalMaterials.length === 1 ? originalMaterials[0] : originalMaterials;
          this.originalMaterials.delete(child);
        }

        /* CLEAN UP HIGHLIGHT MATERIALS */
        const highlightMaterials = this.highlightMaterials.get(child);
        if (highlightMaterials) {
          highlightMaterials.forEach((material) => material.dispose());
          this.highlightMaterials.delete(child);
        }
      }
    });
  }

  /**
   * createHighlightMaterials()
   *
   * Create highlight materials for selected object.
   */
  private createHighlightMaterials(mesh: THREE.Mesh): THREE.Material[] {
    const originalMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    return originalMaterials.map((material) => {
      const highlightMaterial = material.clone();

      /* APPLY HIGHLIGHT COLOR */
      if ('color' in highlightMaterial) {
        const originalColor = (highlightMaterial as any).color.clone();
        const highlightColor = new THREE.Color(this.options.highlightColor);
        (highlightMaterial as any).color.lerpColors(
          originalColor,
          highlightColor,
          this.options.highlightOpacity
        );
      }

      /* MAKE TRANSPARENT IF NEEDED */
      if ('transparent' in highlightMaterial) {
        (highlightMaterial as any).transparent = true;
        (highlightMaterial as any).opacity = Math.max(0.8, (highlightMaterial as any).opacity || 1);
      }

      return highlightMaterial;
    });
  }

  /**
   * updateSelectionBox()
   *
   * Update selection bounding box display.
   */
  private updateSelectionBox(): void {
    if (!this.selectionBox) {
      return;
    }

    if (this.selectedObjects.size === 0) {
      this.selectionBox.visible = false;
      return;
    }

    /* CALCULATE BOUNDING BOX */
    const box = new THREE.Box3();
    this.selectedObjects.forEach((obj) => {
      const objBox = new THREE.Box3().setFromObject(obj);
      box.union(objBox);
    });

    /* UPDATE BOX HELPER */
    this.selectionBox.box = box;
    this.selectionBox.visible = true;
  }

  /**
   * deleteSelected()
   *
   * Delete selected objects (emit event for external handling).
   */
  private deleteSelected(): void {
    if (this.selectedObjects.size === 0) {
      return;
    }

    const toDelete = Array.from(this.selectedObjects);
    this.notifyListeners('delete', {
      selected: [],
      deselected: toDelete,
      primary: null
    });
  }

  /**
   * setEnabled()
   *
   * Enable or disable selection system.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      this.clearSelection();
    }
  }

  /**
   * isSelectionEnabled()
   *
   * Check if selection is enabled.
   */
  public isSelectionEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * setOptions()
   *
   * Update selection system options.
   */
  public setOptions(options: Partial<SelectionOptions>): void {
    Object.assign(this.options, options);

    /* REAPPLY HIGHLIGHTS WITH NEW OPTIONS */
    this.selectedObjects.forEach((obj) => {
      this.removeSelectionHighlight(obj);
      this.applySelectionHighlight(obj);
    });
  }

  /**
   * getOptions()
   *
   * Get current selection options.
   */
  public getOptions(): SelectionOptions {
    return { ...this.options };
  }

  /**
   * addEventListener()
   *
   * Add selection event listener.
   */
  public addEventListener(type: string, listener: (event: SelectionEvent) => void): void {
    this.eventListeners.set(type, listener);
  }

  /**
   * notifyListeners()
   *
   * Notify all registered listeners of selection events.
   */
  private notifyListeners(type: string, event: SelectionEvent): void {
    const listener = this.eventListeners.get(type);
    if (listener) {
      listener(event);
    }
  }

  /**
   * removeEventListener()
   *
   * Remove selection event listener.
   */
  public removeEventListener(type: string): void {
    this.eventListeners.delete(type);
  }

  /**
   * dispatchSelectionEvent()
   *
   * Dispatch selection change event.
   */
  private dispatchSelectionEvent(selected: THREE.Object3D[], deselected: THREE.Object3D[]): void {
    const event: SelectionEvent = {
      selected,
      deselected,
      primary: this.primarySelection
    };

    const listener = this.eventListeners.get('selectionchange');
    if (listener) {
      listener(event);
    }

    /* ALSO DISPATCH VIA THREE.js EVENT SYSTEM */
    // No longer needed - handled by notifyListeners
  }

  /**
   * dispose()
   *
   * Clean up selection system resources.
   */
  public dispose(): void {
    /* REMOVE EVENT LISTENERS */
    this.domElement.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    /* CLEAR SELECTION */
    this.clearSelectionInternal();

    /* DISPOSE VISUAL FEEDBACK */
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox = null;
    }

    /* DISPOSE HIGHLIGHT MATERIALS */
    this.highlightMaterials.forEach((materials) => {
      materials.forEach((material) => material.dispose());
    });

    /* CLEAR COLLECTIONS */
    this.selectedObjects.clear();
    this.selectableObjects.clear();
    this.highlightMaterials.clear();
    this.originalMaterials.clear();
    this.eventListeners.clear();
  }

  /**
   * delete()
   *
   * Alias for dispose() method for cleanup verification.
   */
  public delete(): void {
    this.dispose();
  }
}
