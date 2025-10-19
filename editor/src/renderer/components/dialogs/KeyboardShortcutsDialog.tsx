/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        KeyboardShortcutsDialog
        ---
        this dialog displays all available keyboard shortcuts
        organized by category. it provides a searchable interface
        for users to quickly find and learn keyboard shortcuts.

        the dialog fetches shortcuts from KeyboardShortcutManager
        and presents them in a clean, organized format with
        proper key visualization and descriptions.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import React, { useState, useEffect, useMemo } from 'react'; /* REACT FRAMEWORK */
import { useTheme } from '../../context/ThemeContext'; /* THEME MANAGEMENT */
import { Modal } from '../ui/Modal'; /* MODAL COMPONENT */
import { Button } from '../ui/Button'; /* BUTTON COMPONENT */
import { Input } from '../ui/Input'; /* INPUT COMPONENT */
import {
  keyboardShortcutManager,
  ShortcutCategory
} from '../../core/keyboard/KeyboardShortcutManager'; /* KEYBOARD SYSTEM */
import type { KeyboardShortcut } from '../../core/keyboard/KeyboardShortcutManager'; /* SHORTCUT TYPES */

/*
	===============================================================
             --- PROPS ---
	===============================================================
*/

/**
 * KeyboardShortcutsDialog props interface
 */
interface KeyboardShortcutsDialogProps {
  visible: boolean;
  onClose: () => void;
}

/*
	===============================================================
             --- COMPONENTS ---
	===============================================================
*/

/**
 * ShortcutKey component
 *
 * Renders a keyboard key with proper styling.
 */
function ShortcutKey({ keyName }: { keyName: string }): JSX.Element {
  const { theme } = useTheme();

  return (
    <span
      className="shortcut-key"
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        margin: '0 2px',
        backgroundColor: theme.type === 'dark' ? '#444' : '#f0f0f0',
        border: `1px solid ${theme.type === 'dark' ? '#666' : '#ccc'}`,
        borderRadius: '3px',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        color: theme.type === 'dark' ? '#fff' : '#333'
      }}
    >
      {keyName}
    </span>
  );
}

/**
 * ShortcutDisplay component
 *
 * Displays a single keyboard shortcut with formatted keys.
 */
function ShortcutDisplay({
  shortcut
}: {
  shortcut: KeyboardShortcut & { keys: string };
}): JSX.Element {
  const { theme } = useTheme();

  const keys = shortcut.keys.split('+');

  return (
    <div
      className="shortcut-item"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${theme.type === 'dark' ? '#333' : '#eee'}`
      }}
    >
      <div className="shortcut-description" style={{ flex: 1, marginRight: '20px' }}>
        {shortcut.description}
      </div>
      <div className="shortcut-keys">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span style={{ margin: '0 4px' }}>+</span>}
            <ShortcutKey keyName={key.charAt(0).toUpperCase() + key.slice(1)} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * CategorySection component
 *
 * Displays shortcuts for a specific category.
 */
function CategorySection({
  category,
  shortcuts,
  searchTerm
}: {
  category: ShortcutCategory;
  shortcuts: (KeyboardShortcut & { keys: string })[];
  searchTerm: string;
}): JSX.Element | null {
  const { theme } = useTheme();

  const filteredShortcuts = shortcuts.filter(
    (shortcut) =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.keys.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredShortcuts.length === 0) {
    return null;
  }

  return (
    <div
      className="shortcut-category"
      style={{
        marginBottom: '24px'
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme.type === 'dark' ? '#fff' : '#333',
          borderBottom: `2px solid ${theme.type === 'dark' ? '#555' : '#ddd'}`,
          paddingBottom: '4px'
        }}
      >
        {category}
      </h3>
      <div className="shortcuts-list">
        {filteredShortcuts.map((shortcut, index) => (
          <ShortcutDisplay key={index} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/*
	===============================================================
             --- MAIN COMPONENT ---
	===============================================================
*/

/**
 * KeyboardShortcutsDialog component
 *
 * Modal dialog displaying all keyboard shortcuts organized by category.
 * Includes search functionality to help users find specific shortcuts.
 */
export function KeyboardShortcutsDialog({
  visible,
  onClose
}: KeyboardShortcutsDialogProps): JSX.Element {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');

  /* SHORTCUTS DATA */
  const shortcutsData = useMemo(() => {
    const allShortcuts = keyboardShortcutManager.getShortcuts();
    const categorizedShortcuts = new Map<
      ShortcutCategory,
      (KeyboardShortcut & { keys: string })[]
    >();

    /* ORGANIZE SHORTCUTS BY CATEGORY */
    allShortcuts.forEach((shortcut, keys) => {
      const category = shortcut.category;
      const shortcutWithKeys = { ...shortcut, keys };

      if (!categorizedShortcuts.has(category)) {
        categorizedShortcuts.set(category, []);
      }

      categorizedShortcuts.get(category)!.push(shortcutWithKeys);
    });

    /* SORT SHORTCUTS WITHIN EACH CATEGORY */
    categorizedShortcuts.forEach((shortcuts) => {
      shortcuts.sort((a, b) => a.description.localeCompare(b.description));
    });

    return categorizedShortcuts;
  }, []);

  /* CATEGORY ORDER FOR DISPLAY */
  const categoryOrder = [
    ShortcutCategory.FILE,
    ShortcutCategory.EDIT,
    ShortcutCategory.TRANSFORM,
    ShortcutCategory.VIEW,
    ShortcutCategory.NAVIGATION,
    ShortcutCategory.PLAYBACK,
    ShortcutCategory.GENERAL
  ];

  /**
   * handleSearchChange()
   *
   * Updates search term as user types.
   */
  const handleSearchChange = (value: string): void => {
    setSearchTerm(value);
  };

  /**
   * handleClose()
   *
   * Clears search and closes dialog.
   */
  const handleClose = (): void => {
    setSearchTerm('');
    onClose();
  };

  if (!visible) {
    return <></>;
  }

  return (
    <Modal
      title="Keyboard Shortcuts"
      visible={visible}
      onClose={handleClose}
      width={700}
      height={600}
    >
      <div
        className="keyboard-shortcuts-dialog"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* SEARCH BAR */}
        <div
          className="search-section"
          style={{
            marginBottom: '20px',
            padding: '0 4px'
          }}
        >
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              fontSize: '14px',
              padding: '8px 12px'
            }}
          />
        </div>

        {/* SHORTCUTS CONTENT */}
        <div
          className="shortcuts-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 4px',
            marginBottom: '20px'
          }}
        >
          {categoryOrder.map((category) => {
            const shortcuts = shortcutsData.get(category);
            if (!shortcuts || shortcuts.length === 0) {
              return null;
            }

            return (
              <CategorySection
                key={category}
                category={category}
                shortcuts={shortcuts}
                searchTerm={searchTerm}
              />
            );
          })}

          {/* NO RESULTS MESSAGE */}
          {searchTerm &&
            categoryOrder.every((category) => {
              const shortcuts = shortcutsData.get(category) || [];
              return shortcuts.every(
                (shortcut) =>
                  !shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  !shortcut.keys.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }) && (
              <div
                className="no-results"
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.type === 'dark' ? '#888' : '#666',
                  fontStyle: 'italic'
                }}
              >
                No shortcuts found matching "{searchTerm}"
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div
          className="dialog-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.type === 'dark' ? '#333' : '#eee'}`
          }}
        >
          <Button
            variant="primary"
            onClick={handleClose}
            style={{
              minWidth: '80px'
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
