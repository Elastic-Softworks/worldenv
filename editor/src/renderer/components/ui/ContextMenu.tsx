/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Context Menu Component
 *
 * Right-click context menu for asset operations and general UI interactions.
 * Provides configurable menu items with icons and keyboard shortcuts.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Context menu item interface
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  action?: () => void;
}

/**
 * Context menu props interface
 */
interface ContextMenuProps {
  items: ContextMenuItem[];
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
}

/**
 * ContextMenu component
 *
 * Displays context menu at specified position with configurable items.
 */
export function ContextMenu({
  items,
  visible,
  x,
  y,
  onClose
}: ContextMenuProps): JSX.Element | null {
  const { theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuState, setSubmenuState] = useState<{
    visible: boolean;
    items: ContextMenuItem[];
    x: number;
    y: number;
  }>({
    visible: false,
    items: [],
    x: 0,
    y: 0
  });

  /**
   * Handle click outside menu to close
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
        setSubmenuState((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        setSubmenuState((prev) => ({ ...prev, visible: false }));
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  /**
   * Handle menu item click
   */
  const handleItemClick = useCallback(
    (item: ContextMenuItem, event: React.MouseEvent): void => {
      event.stopPropagation();

      if (item.disabled) {
        return;
      }

      if (item.submenu && item.submenu.length > 0) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setSubmenuState({
          visible: true,
          items: item.submenu,
          x: rect.right + 5,
          y: rect.top
        });
        return;
      }

      if (item.action) {
        item.action();
      }

      onClose();
      setSubmenuState((prev) => ({ ...prev, visible: false }));
    },
    [onClose]
  );

  /**
   * Handle submenu item click
   */
  const handleSubmenuClick = useCallback(
    (item: ContextMenuItem): void => {
      if (item.disabled) {
        return;
      }

      if (item.action) {
        item.action();
      }

      onClose();
      setSubmenuState((prev) => ({ ...prev, visible: false }));
    },
    [onClose]
  );

  if (!visible) {
    return null;
  }

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    backgroundColor: theme.colors.panel.background,
    border: `1px solid ${theme.colors.panel.border}`,
    borderRadius: theme.borderRadius.sm,
    boxShadow: theme.shadows.lg,
    zIndex: 1000,
    minWidth: '180px',
    padding: `${theme.spacing.xs} 0`,
    fontSize: '13px'
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    cursor: 'pointer',
    color: theme.colors.foreground.primary,
    transition: 'background-color 0.1s ease'
  };

  const disabledItemStyle: React.CSSProperties = {
    ...itemStyle,
    color: theme.colors.foreground.tertiary,
    cursor: 'not-allowed'
  };

  const separatorStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: theme.colors.border.primary,
    margin: `${theme.spacing.xs} 0`
  };

  const iconStyle: React.CSSProperties = {
    marginRight: theme.spacing.sm,
    width: '16px',
    textAlign: 'center'
  };

  const labelStyle: React.CSSProperties = {
    flex: 1
  };

  const shortcutStyle: React.CSSProperties = {
    marginLeft: theme.spacing.sm,
    fontSize: '11px',
    color: theme.colors.foreground.tertiary
  };

  const submenuIndicatorStyle: React.CSSProperties = {
    marginLeft: theme.spacing.sm,
    fontSize: '10px',
    color: theme.colors.foreground.tertiary
  };

  return (
    <>
      <div ref={menuRef} style={menuStyle}>
        {items.map((item, index) => {
          if (item.separator) {
            return <div key={`separator-${index}`} style={separatorStyle} />;
          }

          const hasSubmenu = item.submenu && item.submenu.length > 0;

          return (
            <div
              key={item.id}
              style={item.disabled ? disabledItemStyle : itemStyle}
              onClick={(e) => handleItemClick(item, e)}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={iconStyle}>{item.icon || ''}</div>
              <div style={labelStyle}>{item.label}</div>
              {item.shortcut && <div style={shortcutStyle}>{item.shortcut}</div>}
              {hasSubmenu && <div style={submenuIndicatorStyle}>▶</div>}
            </div>
          );
        })}
      </div>

      {/* Submenu */}
      {submenuState.visible && (
        <ContextMenu
          items={submenuState.items}
          visible={submenuState.visible}
          x={submenuState.x}
          y={submenuState.y}
          onClose={() => setSubmenuState((prev) => ({ ...prev, visible: false }))}
        />
      )}
    </>
  );
}

/**
 * useContextMenu hook
 *
 * Manages context menu state and positioning.
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  });

  const showContextMenu = useCallback((event: React.MouseEvent, items: ContextMenuItem[]): void => {
    event.preventDefault();
    event.stopPropagation();

    // Adjust position if menu would go off screen
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 180; // Approximate menu width
    const menuHeight = items.length * 32; // Approximate item height

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }

    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }

    setContextMenu({
      visible: true,
      x,
      y,
      items
    });
  }, []);

  const hideContextMenu = useCallback((): void => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  };
}

/**
 * Context menu item factory functions
 */
export const createContextMenuItem = (
  id: string,
  label: string,
  action?: () => void,
  options?: Partial<ContextMenuItem>
): ContextMenuItem => ({
  id,
  label,
  action,
  ...options
});

export const createSeparator = (id: string): ContextMenuItem => ({
  id,
  label: '',
  separator: true
});

/**
 * Common context menu items
 */
export const CommonMenuItems = {
  copy: (action: () => void): ContextMenuItem =>
    createContextMenuItem('copy', 'Copy', action, { icon: '📋', shortcut: 'Ctrl+C' }),

  cut: (action: () => void): ContextMenuItem =>
    createContextMenuItem('cut', 'Cut', action, { icon: '✂️', shortcut: 'Ctrl+X' }),

  paste: (action: () => void, disabled = false): ContextMenuItem =>
    createContextMenuItem('paste', 'Paste', action, { icon: '📄', shortcut: 'Ctrl+V', disabled }),

  delete: (action: () => void): ContextMenuItem =>
    createContextMenuItem('delete', 'Delete', action, { icon: '🗑️', shortcut: 'Del' }),

  rename: (action: () => void): ContextMenuItem =>
    createContextMenuItem('rename', 'Rename', action, { icon: '✏️', shortcut: 'F2' }),

  refresh: (action: () => void): ContextMenuItem =>
    createContextMenuItem('refresh', 'Refresh', action, { icon: '🔄', shortcut: 'F5' }),

  properties: (action: () => void): ContextMenuItem =>
    createContextMenuItem('properties', 'Properties', action, { icon: 'ⓘ' })
};
