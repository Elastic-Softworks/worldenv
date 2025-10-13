/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Inspector Panel Component
 *
 * Enhanced inspector panel for viewing and editing entity properties.
 * Provides detailed property editors with undo/redo, validation, and multi-selection support.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorState } from '../../context/EditorStateContext';
import { useTheme } from '../../context/ThemeContext';
import { componentSystem, componentRegistry, ComponentUtils } from '../../core/components';
import { SceneManager } from '../../core/hierarchy/SceneManager';
import {
  UndoRedoManager,
  PropertyChangeCommand,
  RenameEntityCommand
} from '../../core/undo/UndoRedoManager';
import { propertyValidator } from '../../core/validation/PropertyValidator';
import { DragNumberInput } from '../ui/inputs/DragNumberInput';
import { Vector2Input, Vector3Input } from '../ui/inputs/VectorInput';
import type {
  IComponent,
  PropertyMetadata,
  Vector2,
  Vector3,
  Color
} from '../../core/components/Component';

/**
 * UI Component data interface
 */
interface UIComponentData {
  component: IComponent;
  expanded: boolean;
  validationResults: { [key: string]: any };
}

/**
 * Multi-selection data interface
 */
interface MultiSelectionData {
  sharedProperties: Array<{
    componentType: string;
    propertyKey: string;
    metadata: PropertyMetadata;
    hasCommonValue: boolean;
    commonValue?: any;
  }>;
  entityCount: number;
}

/**
 * InspectorPanel component
 *
 * Enhanced property inspector for selected entities.
 */
export function InspectorPanel(): JSX.Element {
  const { state, actions } = useEditorState();
  const { theme } = useTheme();
  const [componentData, setComponentData] = useState<UIComponentData[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [multiSelectionData, setMultiSelectionData] = useState<MultiSelectionData | null>(null);
  const [undoRedoManager] = useState(() => UndoRedoManager.getInstance());

  /**
   * updateComponentData()
   *
   * Updates component data for selected entities.
   */
  const updateComponentData = useCallback(() => {
    if (state.selectedEntities.length === 1) {
      const nodeId = state.selectedEntities[0];
      const scene = SceneManager.getInstance().currentScene;

      if (scene) {
        const node = scene.getNode(nodeId);
        if (node) {
          setSelectedNodes([node]);

          // Get components for this node
          const components = componentSystem.getComponents(nodeId);
          const uiData: UIComponentData[] = components.map((component) => {
            const properties = component.getAllProperties();
            const validationResults = propertyValidator.validateAllProperties(properties);

            return {
              component,
              expanded: true,
              validationResults
            };
          });

          setComponentData(uiData);

          // Get available components that can be added
          const available = ComponentUtils.getAvailableComponents(nodeId);
          setAvailableComponents(available);
          setMultiSelectionData(null);
        } else {
          setSelectedNodes([]);
          setComponentData([]);
          setAvailableComponents([]);
          setMultiSelectionData(null);
        }
      }
    } else if (state.selectedEntities.length > 1) {
      // Multi-selection handling
      const scene = SceneManager.getInstance().currentScene;
      if (scene) {
        const nodes = state.selectedEntities
          .map((id) => scene.getNode(id))
          .filter((node) => node !== null);

        setSelectedNodes(nodes);
        setComponentData([]);

        // Calculate shared properties
        const sharedProps = calculateSharedProperties(nodes);
        setMultiSelectionData({
          sharedProperties: sharedProps,
          entityCount: nodes.length
        });
      }
    } else {
      setSelectedNodes([]);
      setComponentData([]);
      setAvailableComponents([]);
      setMultiSelectionData(null);
    }
  }, [state.selectedEntities]);

  /**
   * calculateSharedProperties()
   *
   * Calculates properties shared across multiple selected entities.
   */
  const calculateSharedProperties = useCallback((nodes: any[]) => {
    if (nodes.length === 0) return [];

    // Get all component types present in first node
    const firstNodeComponents = componentSystem.getComponents(nodes[0].id);
    const sharedProperties: Array<{
      componentType: string;
      propertyKey: string;
      metadata: PropertyMetadata;
      hasCommonValue: boolean;
      commonValue?: any;
    }> = [];

    for (const component of firstNodeComponents) {
      // Check if all other nodes have this component type
      const hasComponentInAllNodes = nodes.every((node) =>
        componentSystem.hasComponent(node.id, component.type)
      );

      if (hasComponentInAllNodes) {
        const properties = component.getAllProperties();

        for (const prop of properties) {
          // Check if all nodes have the same value for this property
          const values = nodes.map((node) => {
            const comp = componentSystem.getComponent(node.id, component.type);
            return comp ? comp.getProperty(prop.key) : undefined;
          });

          const firstValue = values[0];
          const hasCommonValue = values.every(
            (value) => JSON.stringify(value) === JSON.stringify(firstValue)
          );

          sharedProperties.push({
            componentType: component.type,
            propertyKey: prop.key,
            metadata: prop.metadata,
            hasCommonValue,
            commonValue: hasCommonValue ? firstValue : undefined
          });
        }
      }
    }

    return sharedProperties;
  }, []);

  // Update component data when selection changes
  useEffect(() => {
    updateComponentData();
  }, [updateComponentData]);

  /**
   * handlePropertyChange()
   *
   * Handles property value changes with undo/redo support.
   */
  const handlePropertyChange = useCallback(
    (
      componentType: string,
      propertyKey: string,
      newValue: any,
      skipUndo: boolean = false
    ): void => {
      if (selectedNodes.length === 0) return;

      if (selectedNodes.length === 1) {
        // Single selection
        const node = selectedNodes[0];
        const component = componentSystem.getComponent(node.id, componentType);
        if (component) {
          const oldValue = component.getProperty(propertyKey);

          if (!skipUndo && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            const command = new PropertyChangeCommand(
              node.id,
              componentType,
              propertyKey,
              oldValue,
              newValue,
              componentSystem
            );
            undoRedoManager.executeCommand(command);
          } else {
            component.setProperty(propertyKey, newValue);
          }

          actions.setProjectModified(true);
          updateComponentData();
        }
      } else {
        // Multi-selection - update all nodes
        const commands: PropertyChangeCommand[] = [];

        for (const node of selectedNodes) {
          const component = componentSystem.getComponent(node.id, componentType);
          if (component) {
            const oldValue = component.getProperty(propertyKey);

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              commands.push(
                new PropertyChangeCommand(
                  node.id,
                  componentType,
                  propertyKey,
                  oldValue,
                  newValue,
                  componentSystem
                )
              );
            }
          }
        }

        // Execute all commands
        commands.forEach((command) => {
          if (!skipUndo) {
            undoRedoManager.executeCommand(command);
          } else {
            command.execute();
          }
        });

        actions.setProjectModified(true);
        updateComponentData();
      }
    },
    [selectedNodes, undoRedoManager, actions, updateComponentData]
  );

  /**
   * handleEntityRename()
   *
   * Handles entity name changes with undo/redo support.
   */
  const handleEntityRename = useCallback(
    (entity: any, newName: string): void => {
      const oldName = entity.name;
      if (oldName !== newName) {
        const command = new RenameEntityCommand(entity, oldName, newName);
        undoRedoManager.executeCommand(command);
        actions.setProjectModified(true);
      }
    },
    [undoRedoManager, actions]
  );

  /**
   * handleComponentToggle()
   *
   * Handles component enable/disable toggle.
   */
  const handleComponentToggle = useCallback(
    (componentType: string): void => {
      if (selectedNodes.length === 0) return;

      for (const node of selectedNodes) {
        const component = componentSystem.getComponent(node.id, componentType);
        if (component) {
          componentSystem.setComponentEnabled(node.id, componentType, !component.enabled);
        }
      }

      actions.setProjectModified(true);
      updateComponentData();
    },
    [selectedNodes, actions, updateComponentData]
  );

  /**
   * handleAddComponent()
   *
   * Handles adding a new component.
   */
  const handleAddComponent = useCallback(
    (componentType: string): void => {
      if (selectedNodes.length === 0) return;

      for (const node of selectedNodes) {
        const result = ComponentUtils.addComponentSafe(node.id, componentType);
        if (!result.success) {
          console.error('Failed to add component:', result.error);
        }
      }

      actions.setProjectModified(true);
      updateComponentData();
    },
    [selectedNodes, actions, updateComponentData]
  );

  /**
   * handleRemoveComponent()
   *
   * Handles removing a component.
   */
  const handleRemoveComponent = useCallback(
    (componentType: string): void => {
      if (selectedNodes.length === 0) return;

      for (const node of selectedNodes) {
        const result = ComponentUtils.removeComponentSafe(node.id, componentType);
        if (!result.success) {
          console.error('Failed to remove component:', result.error);
        }
      }

      actions.setProjectModified(true);
      updateComponentData();
    },
    [selectedNodes, actions, updateComponentData]
  );

  /**
   * renderPropertyEditor()
   *
   * Renders enhanced property editor based on property type.
   */
  const renderPropertyEditor = useCallback(
    (
      component: IComponent,
      propertyKey: string,
      propertyValue: any,
      propertyMetadata: PropertyMetadata,
      validationResult?: any
    ): JSX.Element => {
      const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: theme.colors.foreground.secondary,
        marginBottom: theme.spacing.xs,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      };

      const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.input.background,
        border: `1px solid ${validationResult?.isValid === false ? '#ff6b6b' : theme.colors.input.border}`,
        borderRadius: theme.borderRadius.sm,
        color: theme.colors.input.text,
        fontSize: '12px',
        fontFamily: 'inherit'
      };

      const containerStyle: React.CSSProperties = {
        marginBottom: theme.spacing.sm
      };

      const errorStyle: React.CSSProperties = {
        fontSize: '11px',
        color: '#ff6b6b',
        marginTop: '2px',
        fontStyle: 'italic'
      };

      switch (propertyMetadata.type) {
        case 'string':
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <input
                type="text"
                value={propertyValue || ''}
                onChange={(e) => handlePropertyChange(component.type, propertyKey, e.target.value)}
                style={inputStyle}
                readOnly={propertyMetadata.readonly}
                placeholder={propertyMetadata.placeholder}
              />
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'number':
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <DragNumberInput
                value={propertyValue || 0}
                onChange={(value) => handlePropertyChange(component.type, propertyKey, value)}
                min={propertyMetadata.min}
                max={propertyMetadata.max}
                step={propertyMetadata.step || 0.1}
                precision={propertyMetadata.precision || 3}
                disabled={propertyMetadata.readonly}
                style={inputStyle}
              />
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'boolean':
          return (
            <div style={containerStyle}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={propertyValue || false}
                  onChange={(e) =>
                    handlePropertyChange(component.type, propertyKey, e.target.checked)
                  }
                  style={{ marginRight: theme.spacing.xs }}
                  disabled={propertyMetadata.readonly}
                />
                <span style={{ ...labelStyle, marginBottom: 0 }}>
                  {propertyMetadata.displayName}
                </span>
                {propertyMetadata.required && (
                  <span style={{ color: '#ff6b6b', marginLeft: '4px' }}>*</span>
                )}
              </label>
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'vector2':
          const vec2Value = (propertyValue as Vector2) || { x: 0, y: 0 };
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <Vector2Input
                value={vec2Value}
                onChange={(value) => handlePropertyChange(component.type, propertyKey, value)}
                disabled={propertyMetadata.readonly}
                step={propertyMetadata.step || 0.1}
                precision={propertyMetadata.precision || 3}
                min={propertyMetadata.min}
                max={propertyMetadata.max}
              />
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'vector3':
          const vec3Value = (propertyValue as Vector3) || { x: 0, y: 0, z: 0 };
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <Vector3Input
                value={vec3Value}
                onChange={(value) => handlePropertyChange(component.type, propertyKey, value)}
                disabled={propertyMetadata.readonly}
                step={propertyMetadata.step || 0.1}
                precision={propertyMetadata.precision || 3}
                min={propertyMetadata.min}
                max={propertyMetadata.max}
              />
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'color':
          const colorValue = (propertyValue as Color) || { r: 1, g: 1, b: 1, a: 1 };
          const hexColor = `#${Math.round(colorValue.r * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(colorValue.g * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(colorValue.b * 255)
            .toString(16)
            .padStart(2, '0')}`;
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
                <input
                  type="color"
                  value={hexColor}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16) / 255;
                    const g = parseInt(hex.slice(3, 5), 16) / 255;
                    const b = parseInt(hex.slice(5, 7), 16) / 255;
                    handlePropertyChange(component.type, propertyKey, { ...colorValue, r, g, b });
                  }}
                  style={{
                    width: '40px',
                    height: '32px',
                    border: 'none',
                    borderRadius: theme.borderRadius.sm
                  }}
                  disabled={propertyMetadata.readonly}
                />
                <DragNumberInput
                  value={colorValue.a}
                  onChange={(a) =>
                    handlePropertyChange(component.type, propertyKey, { ...colorValue, a })
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                  disabled={propertyMetadata.readonly}
                  placeholder="Alpha"
                  style={{ flex: 1 }}
                />
              </div>
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        case 'enum':
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
                {propertyMetadata.required && <span style={{ color: '#ff6b6b' }}>*</span>}
              </div>
              <select
                value={propertyValue || ''}
                onChange={(e) => handlePropertyChange(component.type, propertyKey, e.target.value)}
                style={inputStyle}
                disabled={propertyMetadata.readonly}
              >
                {!propertyMetadata.required && <option value="">-- None --</option>}
                {propertyMetadata.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {validationResult?.error && <div style={errorStyle}>{validationResult.error}</div>}
            </div>
          );

        default:
          return (
            <div style={containerStyle}>
              <div style={labelStyle}>
                <span>{propertyMetadata.displayName}</span>
              </div>
              <div style={{ fontSize: '12px', color: theme.colors.foreground.tertiary }}>
                Unsupported property type: {propertyMetadata.type}
              </div>
            </div>
          );
      }
    },
    [theme, handlePropertyChange]
  );

  /**
   * renderComponent()
   *
   * Renders a component section with its properties.
   */
  const renderComponent = useCallback(
    (uiData: UIComponentData, index: number): JSX.Element => {
      const { component, validationResults } = uiData;

      const componentHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.sm,
        cursor: 'pointer',
        marginBottom: theme.spacing.xs
      };

      const componentContentStyle: React.CSSProperties = {
        padding: theme.spacing.sm,
        border: `1px solid ${theme.colors.border.primary}`,
        borderTop: 'none',
        borderRadius: `0 0 ${theme.borderRadius.sm} ${theme.borderRadius.sm}`,
        marginBottom: theme.spacing.md
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

      const toggleExpanded = () => {
        const newData = [...componentData];
        newData[index].expanded = !newData[index].expanded;
        setComponentData(newData);
      };

      return (
        <div key={component.id}>
          <div style={componentHeaderStyle} onClick={toggleExpanded}>
            <span style={{ marginRight: theme.spacing.xs, fontSize: '12px' }}>
              {uiData.expanded ? '▼' : '▶'}
            </span>
            <span style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>
              {component.displayName}
            </span>
            <button
              style={{ ...iconButtonStyle, marginRight: theme.spacing.xs }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveComponent(component.type);
              }}
              title="Remove component"
            >
              🗑️
            </button>
            <input
              type="checkbox"
              checked={component.enabled}
              onChange={(e) => {
                e.stopPropagation();
                handleComponentToggle(component.type);
              }}
              style={{ marginLeft: theme.spacing.xs }}
            />
          </div>

          {uiData.expanded && (
            <div style={componentContentStyle}>
              {component
                .getAllProperties()
                .map((property) =>
                  renderPropertyEditor(
                    component,
                    property.key,
                    property.value,
                    property.metadata,
                    validationResults[property.key]
                  )
                )}
            </div>
          )}
        </div>
      );
    },
    [componentData, theme, handleRemoveComponent, handleComponentToggle, renderPropertyEditor]
  );

  /**
   * renderMultiSelectionProperty()
   *
   * Renders property editor for multi-selection.
   */
  const renderMultiSelectionProperty = useCallback(
    (sharedProp: any): JSX.Element => {
      const component = { type: sharedProp.componentType } as IComponent;
      const value = sharedProp.hasCommonValue ? sharedProp.commonValue : '';

      return (
        <div key={`${sharedProp.componentType}.${sharedProp.propertyKey}`}>
          {renderPropertyEditor(component, sharedProp.propertyKey, value, sharedProp.metadata)}
        </div>
      );
    },
    [renderPropertyEditor]
  );

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
    padding: theme.spacing.sm
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

  return (
    <div style={panelStyle}>
      {/* Panel Header */}
      <div style={headerStyle}>
        <span>Inspector</span>
        <div style={toolbarStyle}>
          {selectedNodes.length === 1 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddComponent(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{
                ...iconButtonStyle,
                backgroundColor: theme.colors.input.background,
                border: `1px solid ${theme.colors.input.border}`,
                color: theme.colors.input.text,
                fontSize: '12px',
                padding: '4px 8px'
              }}
              disabled={availableComponents.length === 0}
            >
              <option value="">Add Component</option>
              {availableComponents.map((componentType) => {
                const info = ComponentUtils.getComponentDisplayInfo(componentType);
                return (
                  <option key={componentType} value={componentType}>
                    {info?.displayName || componentType}
                  </option>
                );
              })}
            </select>
          )}
          <button
            style={iconButtonStyle}
            title="Reset values"
            disabled={selectedNodes.length === 0}
            onMouseEnter={(e) => {
              if (selectedNodes.length > 0) {
                e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Inspector Content */}
      <div style={contentStyle}>
        {selectedNodes.length === 1 ? (
          <div>
            {/* Entity Header */}
            <div
              style={{
                marginBottom: theme.spacing.md,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.sm
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Entity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: theme.colors.foreground.tertiary,
                      fontFamily: 'monospace'
                    }}
                  >
                    ID: {selectedNodes[0].id}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedNodes[0].enabled !== false}
                    onChange={(e) => {
                      selectedNodes[0].enabled = e.target.checked;
                      actions.setProjectModified(true);
                    }}
                    title="Enable/Disable Entity"
                  />
                </div>
              </div>

              <input
                type="text"
                value={selectedNodes[0].name}
                onChange={(e) => {
                  handleEntityRename(selectedNodes[0], e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: theme.spacing.xs,
                  backgroundColor: theme.colors.input.background,
                  border: `1px solid ${theme.colors.input.border}`,
                  borderRadius: theme.borderRadius.sm,
                  color: theme.colors.input.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Components */}
            {componentData.map((uiData, index) => renderComponent(uiData, index))}
          </div>
        ) : selectedNodes.length > 1 ? (
          <div>
            {/* Multi-selection header */}
            <div
              style={{
                marginBottom: theme.spacing.md,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.sm
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: theme.spacing.xs }}>
                  Multiple Objects Selected
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.foreground.tertiary }}>
                  {selectedNodes.length} entities selected
                </div>
              </div>
            </div>

            {/* Shared Properties */}
            {multiSelectionData && multiSelectionData.sharedProperties.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: theme.spacing.sm,
                    color: theme.colors.foreground.secondary
                  }}
                >
                  Shared Properties
                </div>
                {multiSelectionData.sharedProperties.map(renderMultiSelectionProperty)}
              </div>
            )}

            {multiSelectionData && multiSelectionData.sharedProperties.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: theme.colors.foreground.tertiary,
                  fontSize: '14px'
                }}
              >
                No shared properties found
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.foreground.tertiary,
              fontSize: '14px',
              textAlign: 'center'
            }}
          >
            <div>
              <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No Object Selected</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Select an entity to view properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
