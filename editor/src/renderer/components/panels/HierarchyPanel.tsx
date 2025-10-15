/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Enhanced Hierarchy Panel Component
 *
 * Scene hierarchy panel with comprehensive node management.
 * Supports drag-and-drop, context menus, and real-time updates.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { SceneManager, SceneManagerEvent } from '../../core/hierarchy/SceneManager';
import { Node, NodeType } from '../../core/hierarchy/Node';
import { CreateEntityCommand, DeleteEntityCommand } from '../../core/undo';

/**
 * Drag and drop data
 */
interface DragData {
  nodeId: string;
  nodeName: string;
  sourceIndex: number;
}

/**
 * Context menu state
 */
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

/**
 * Enhanced HierarchyPanel component
 *
 * Tree view panel with full scene hierarchy management.
 */
export function HierarchyPanel(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();
  const undoRedo = useUndoRedo();
  const sceneManager = SceneManager.getInstance();

  // Component state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null
  });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const panelRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  /**
   * updateHierarchy()
   *
   * Updates hierarchy display from current scene.
   */
  const updateHierarchy = useCallback(() => {
    const scene = sceneManager.currentScene;
    if (!scene) {
      setNodes([]);
      return;
    }

    const rootNode = scene.rootNode;
    setNodes([rootNode]);

    // Auto-expand root node
    setExpandedNodes((prev) => new Set(prev).add(rootNode.id));
  }, [sceneManager]);

  /**
   * Scene manager event handler
   */
  useEffect(() => {
    const handleSceneEvent = () => {
      updateHierarchy();
    };

    sceneManager.addListener(handleSceneEvent);
    updateHierarchy();

    return () => {
      sceneManager.removeListener(handleSceneEvent);
    };
  }, [sceneManager, updateHierarchy]);

  /**
   * Focus edit input when editing starts
   */
  useEffect(() => {
    if (editingNode && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNode]);

  /**
   * Close context menu on outside click
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.visible]);

  /**
   * getNodeIcon()
   *
   * Returns icon for node type.
   */
  const getNodeIcon = (type: NodeType): string => {
    switch (type) {
      case NodeType.SCENE:
        return 'Scene';
      case NodeType.CAMERA:
        return 'Camera';
      case NodeType.LIGHT:
        return 'Light';
      case NodeType.ENTITY_2D:
        return '2D';
      case NodeType.ENTITY_3D:
        return '3D';
      case NodeType.SPRITE:
        return 'Sprite';
      case NodeType.MESH:
        return 'Mesh';
      case NodeType.AUDIO_SOURCE:
        return 'Audio';
      case NodeType.SCRIPT:
        return 'Script';
      case NodeType.GROUP:
        return 'Group';
      default:
        return '?';
    }
  };

  /**
   * handleNodeClick()
   *
   * Handles node selection.
   */
  const handleNodeClick = (node: Node, event: React.MouseEvent): void => {
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const isSelected = state.selectedEntities.includes(node.id);
      if (isSelected) {
        actions.selectEntities(state.selectedEntities.filter((id) => id !== node.id));
      } else {
        actions.selectEntities([...state.selectedEntities, node.id]);
      }
    } else {
      // Single select
      actions.selectEntities([node.id]);
    }
  };

  /**
   * handleNodeToggle()
   *
   * Toggles node expansion.
   */
  const handleNodeToggle = (nodeId: string, event: React.MouseEvent): void => {
    event.stopPropagation();

    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  /**
   * handleVisibilityToggle()
   *
   * Toggles node visibility.
   */
  const handleVisibilityToggle = (node: Node, event: React.MouseEvent): void => {
    event.stopPropagation();
    node.visible = !node.visible;
  };

  /**
   * handleDragStart()
   *
   * Handles drag start for reparenting.
   */
  const handleDragStart = (node: Node, event: React.DragEvent): void => {
    // Cannot drag root node
    if (node.type === NodeType.SCENE) {
      event.preventDefault();
      return;
    }

    const dragData: DragData = {
      nodeId: node.id,
      nodeName: node.name,
      sourceIndex: node.parent?.getChildIndex(node) || 0
    };

    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedNode(node.id);
  };

  /**
   * handleDragOver()
   *
   * Handles drag over for drop target highlighting.
   */
  const handleDragOver = (node: Node, event: React.DragEvent): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverNode(node.id);
  };

  /**
   * handleDragLeave()
   *
   * Handles drag leave.
   */
  const handleDragLeave = (): void => {
    setDragOverNode(null);
  };

  /**
   * handleDrop()
   *
   * Handles node drop for reparenting.
   */
  const handleDrop = (targetNode: Node, event: React.DragEvent): void => {
    event.preventDefault();
    setDragOverNode(null);
    setDraggedNode(null);

    try {
      const dragData: DragData = JSON.parse(event.dataTransfer.getData('application/json'));
      const sourceNode = sceneManager.getNode(dragData.nodeId);

      if (sourceNode && sourceNode !== targetNode) {
        sceneManager.reparentNode(sourceNode, targetNode);
      }
    } catch (error) {
      console.error('[HIERARCHY] Drop error:', error);
    }
  };

  /**
   * handleDragEnd()
   *
   * Cleans up drag state.
   */
  const handleDragEnd = (): void => {
    setDraggedNode(null);
    setDragOverNode(null);
  };

  /**
   * handleContextMenu()
   *
   * Shows context menu for node operations.
   */
  const handleContextMenu = (node: Node, event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    });
  };

  /**
   * handleCreateNode()
   *
   * Creates new node with undo/redo support.
   */
  const handleCreateNode = (type: NodeType, parentId?: string): void => {
    const parent = parentId ? sceneManager.getNode(parentId) : null;
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    // Create entity data for undo command
    const entityData = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      parentId: parent?.id
    };

    // Create undo command
    const command = new CreateEntityCommand(entityData, parent, sceneManager);
    undoRedo.executeCommand(command);

    // Update UI state
    actions.selectEntities([entityData.id]);
    setEditingNode(entityData.id);
    setEditingName(entityData.name);
  };

  /**
   * handleDeleteNode()
   *
   * Deletes selected node with undo/redo support.
   */
  const handleDeleteNode = (nodeId: string): void => {
    const node = sceneManager.getNode(nodeId);
    if (node && node.type !== NodeType.SCENE) {
      // Create undo command
      const command = new DeleteEntityCommand(node, sceneManager);
      undoRedo.executeCommand(command);

      // Update UI state
      actions.clearSelection();
    }
  };

  /**
   * handleDuplicateNode()
   *
   * Duplicates selected node.
   */
  const handleDuplicateNode = (nodeId: string): void => {
    const node = sceneManager.getNode(nodeId);
    if (node) {
      const duplicated = sceneManager.duplicateNode(node, `${node.name} Copy`);
      if (duplicated) {
        actions.selectEntities([duplicated.id]);
      }
    }

    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  /**
   * handleRenameNode()
   *
   * Starts node renaming.
   */
  const handleRenameNode = (nodeId: string): void => {
    const node = sceneManager.getNode(nodeId);
    if (node) {
      setEditingNode(nodeId);
      setEditingName(node.name);
    }

    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  /**
   * handleRenameSubmit()
   *
   * Submits node rename.
   */
  const handleRenameSubmit = (): void => {
    if (editingNode && editingName.trim()) {
      const node = sceneManager.getNode(editingNode);
      if (node) {
        node.name = editingName.trim();
      }
    }

    setEditingNode(null);
    setEditingName('');
  };

  /**
   * handleRenameCancel()
   *
   * Cancels node rename.
   */
  const handleRenameCancel = (): void => {
    setEditingNode(null);
    setEditingName('');
  };

  /**
   * renderContextMenu()
   *
   * Renders context menu.
   */
  const renderContextMenu = (): JSX.Element | null => {
    if (!contextMenu.visible || !contextMenu.nodeId) {
      return null;
    }

    const node = sceneManager.getNode(contextMenu.nodeId);
    if (!node) {
      return null;
    }

    const menuStyle: React.CSSProperties = {
      position: 'fixed',
      left: contextMenu.x,
      top: contextMenu.y,
      backgroundColor: theme.colors.panel.background,
      border: `1px solid ${theme.colors.panel.border}`,
      borderRadius: theme.borderRadius.md,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      minWidth: '180px',
      padding: theme.spacing.xs
    };

    const menuItemStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      cursor: 'pointer',
      borderRadius: theme.borderRadius.sm,
      fontSize: '14px',
      gap: theme.spacing.xs,
      transition: 'background-color 0.1s ease'
    };

    return (
      <div style={menuStyle}>
        {/* Create submenu */}
        <div style={menuItemStyle} onClick={(e) => e.stopPropagation()}>
          <span>+</span>
          <span>Create</span>
          <div style={{ marginLeft: 'auto' }}>{'>'}</div>
        </div>

        {/* Rename */}
        <div
          style={menuItemStyle}
          onClick={() => handleRenameNode(contextMenu.nodeId!)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Edit</span>
          <span>Rename</span>
        </div>

        {/* Duplicate */}
        {node.type !== NodeType.SCENE && (
          <div
            style={menuItemStyle}
            onClick={() => handleDuplicateNode(contextMenu.nodeId!)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>Copy</span>
            <span>Duplicate</span>
          </div>
        )}

        {/* Delete */}
        {node.type !== NodeType.SCENE && (
          <div
            style={{
              ...menuItemStyle,
              color: '#e74c3c',
              borderTop: `1px solid ${theme.colors.panel.border}`,
              marginTop: theme.spacing.xs,
              paddingTop: theme.spacing.sm
            }}
            onClick={() => handleDeleteNode(contextMenu.nodeId!)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e74c3c20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>Delete</span>
            <span>Delete</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * renderNode()
   *
   * Renders a single node in the hierarchy.
   */
  const renderNode = (node: Node, depth: number = 0): JSX.Element => {
    const isSelected = state.selectedEntities.includes(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.hasChildren();
    const isDragged = draggedNode === node.id;
    const isDragOver = dragOverNode === node.id;
    const isEditing = editingNode === node.id;

    const nodeStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      paddingLeft: `${depth * 20 + 8}px`,
      cursor: 'pointer',
      fontSize: '14px',
      backgroundColor: isSelected
        ? theme.colors.accent.primary
        : isDragOver
          ? theme.colors.accent.primary + '40'
          : 'transparent',
      color: isSelected ? '#ffffff' : theme.colors.foreground.primary,
      borderRadius: theme.borderRadius.sm,
      margin: `1px ${theme.spacing.xs}`,
      transition: 'background-color 0.1s ease',
      opacity: isDragged ? 0.5 : 1,
      border: isDragOver ? `2px dashed ${theme.colors.accent.primary}` : 'none'
    };

    const expanderStyle: React.CSSProperties = {
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.xs,
      cursor: 'pointer',
      fontSize: '12px',
      color: theme.colors.foreground.tertiary
    };

    const iconStyle: React.CSSProperties = {
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.xs,
      fontSize: '14px'
    };

    const nameStyle: React.CSSProperties = {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };

    const visibilityStyle: React.CSSProperties = {
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.xs,
      cursor: 'pointer',
      fontSize: '12px',
      opacity: node.visible ? 1 : 0.3
    };

    const inputStyle: React.CSSProperties = {
      flex: 1,
      background: theme.colors.input.background,
      border: `1px solid ${theme.colors.accent.primary}`,
      borderRadius: theme.borderRadius.sm,
      padding: '2px 6px',
      fontSize: '14px',
      color: theme.colors.foreground.primary,
      outline: 'none'
    };

    return (
      <div key={node.id}>
        <div
          style={nodeStyle}
          draggable={node.type !== NodeType.SCENE}
          onClick={(e) => handleNodeClick(node, e)}
          onContextMenu={(e) => handleContextMenu(node, e)}
          onDragStart={(e) => handleDragStart(node, e)}
          onDragOver={(e) => handleDragOver(node, e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(node, e)}
          onDragEnd={handleDragEnd}
          onMouseEnter={(e) => {
            if (!isSelected && !isDragOver) {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected && !isDragOver) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Expander */}
          <div
            style={expanderStyle}
            onClick={(e) => {
              if (hasChildren) {
                handleNodeToggle(node.id, e);
              }
            }}
          >
            {hasChildren ? (isExpanded ? 'v' : '>') : ''}
          </div>

          {/* Icon */}
          <div style={iconStyle}>{getNodeIcon(node.type)}</div>

          {/* Name / Edit Input */}
          {isEditing ? (
            <input
              ref={editInputRef}
              style={inputStyle}
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                } else if (e.key === 'Escape') {
                  handleRenameCancel();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div style={nameStyle} title={node.name}>
              {node.name}
            </div>
          )}

          {/* Visibility Toggle */}
          {!isEditing && (
            <div
              style={visibilityStyle}
              onClick={(e) => handleVisibilityToggle(node, e)}
              title={node.visible ? 'Hide node' : 'Show node'}
            >
              {node.visible ? 'Show' : 'Hide'}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{Array.from(node.children).map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.colors.panel.background,
    border: `1px solid ${theme.colors.panel.border}`,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.panel.header,
    borderBottom: `1px solid ${theme.colors.panel.border}`,
    fontSize: '14px',
    fontWeight: 600
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.xs
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.xs,
    alignItems: 'center'
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: theme.colors.foreground.tertiary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    borderRadius: theme.borderRadius.sm,
    transition: 'background-color 0.1s ease'
  };

  const emptyStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.colors.foreground.tertiary,
    fontSize: '14px',
    textAlign: 'center'
  };

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Panel Header */}
      <div style={headerStyle}>
        <span>Hierarchy</span>
        <div style={toolbarStyle}>
          <button
            style={iconButtonStyle}
            title="Create new entity"
            onClick={() => handleCreateNode(NodeType.ENTITY_3D)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            +
          </button>
          <button
            style={iconButtonStyle}
            title="Delete selected"
            disabled={state.selectedEntities.length === 0}
            onClick={() => {
              if (state.selectedEntities.length > 0) {
                handleDeleteNode(state.selectedEntities[0]);
              }
            }}
            onMouseEnter={(e) => {
              if (state.selectedEntities.length > 0) {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Delete
          </button>
          <button
            style={iconButtonStyle}
            title="Expand all"
            onClick={() => {
              const allNodeIds = sceneManager.currentScene?.getAllNodes().map((n) => n.id) || [];
              setExpandedNodes(new Set(allNodeIds));
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            📂
          </button>
        </div>
      </div>

      {/* Hierarchy Content */}
      <div style={contentStyle}>
        {state.project.isOpen && nodes.length > 0 ? (
          <div>{nodes.map((node) => renderNode(node))}</div>
        ) : (
          <div style={emptyStyle}>
            <div>
              <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No Scene Loaded</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Open a project to view hierarchy</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {renderContextMenu()}
    </div>
  );
}
