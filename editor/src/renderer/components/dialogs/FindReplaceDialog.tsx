/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
	WORLDEDIT - Find and Replace Dialog
	ELASTIC SOFTWORKS 2025
	===============================================================
*/

/*

	                --- FIND REPLACE ETHOS ---

	    the find and replace dialog provides comprehensive
	    search capabilities across all project files.
	    it supports regex patterns, case sensitivity,
	    whole word matching, and batch replace operations
	    with clear result presentation.

	    the interface follows standard text editor
	    conventions while providing game-specific
	    search scopes for entities and components.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import React, { useState, useEffect, useCallback } from 'react'; /* REACT CORE */
import { useTheme } from '../../context/ThemeContext'; /* THEMING */
import { useEditorState } from '../../context/EditorStateContext'; /* STATE */
import {
  SearchManager,
  SearchOptions,
  SearchResult
} from '../../core/search/SearchManager'; /* SEARCH */
import { Button } from '../ui/Button'; /* UI COMPONENTS */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         FindReplaceDialogProps
	       ---
	       component props for dialog configuration and
	       callback handling.

*/

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/*
	===============================================================
             --- COMPONENT ---
	===============================================================
*/

/*

         FindReplaceDialog()
	       ---
	       comprehensive find and replace dialog with
	       advanced search options, result preview,
	       and batch replacement capabilities.

*/

export function FindReplaceDialog({ isOpen, onClose }: FindReplaceDialogProps): JSX.Element | null {
  const { theme } = useTheme();
  const { state } = useEditorState();
  const searchManager = SearchManager.getInstance();

  /* SEARCH STATE */
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  /* SEARCH OPTIONS */
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [includeScripts, setIncludeScripts] = useState(true);
  const [includeScenes, setIncludeScenes] = useState(true);
  const [includeProperties, setIncludeProperties] = useState(false);

  /* RESULTS STATE */
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [currentSession, setCurrentSession] = useState<any>(null);

  /**
   * Component setup
   */
  useEffect(() => {
    if (isOpen && state.project.isOpen) {
      searchManager.setProjectPath(state.project.path || '');
    }
  }, [isOpen, state.project.path]);

  /**
   * handleSearch()
   *
   * Performs search with current options and updates results.
   */
  const handleSearch = useCallback(async (): Promise<void> => {
    if (!searchQuery.trim() || !state.project.isOpen) {
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSelectedResults(new Set());

    try {
      const options: SearchOptions = {
        query: searchQuery,
        caseSensitive,
        wholeWord,
        useRegex,
        includeScripts,
        includeScenes,
        includeProperties,
        maxResults: 1000
      };

      const session = await searchManager.search(options);
      setCurrentSession(session);
      setResults(session.results);

      console.log(`[FIND_REPLACE] Found ${session.results.length} matches`);
    } catch (error) {
      console.error('[FIND_REPLACE] Search failed:', error);
      await window.worldedit.dialog.showError(
        'Search Error',
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSearching(false);
    }
  }, [
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    includeScripts,
    includeScenes,
    includeProperties,
    state.project.isOpen
  ]);

  /**
   * handleReplace()
   *
   * Performs replace operation on selected results.
   */
  const handleReplace = useCallback(async (): Promise<void> => {
    if (selectedResults.size === 0 || !replaceText) {
      return;
    }

    setIsReplacing(true);

    try {
      const resultsToReplace = results.filter((result) => selectedResults.has(result.id));

      await searchManager.replace(resultsToReplace, {
        replaceText,
        replaceAll: false,
        confirmEach: false,
        preserveCase: false
      });

      /* REFRESH SEARCH RESULTS */
      await handleSearch();

      console.log(`[FIND_REPLACE] Replaced ${resultsToReplace.length} occurrences`);
    } catch (error) {
      console.error('[FIND_REPLACE] Replace failed:', error);
      await window.worldedit.dialog.showError(
        'Replace Error',
        `Replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsReplacing(false);
    }
  }, [selectedResults, results, replaceText, handleSearch]);

  /**
   * handleReplaceAll()
   *
   * Replaces all occurrences without selection.
   */
  const handleReplaceAll = useCallback(async (): Promise<void> => {
    if (results.length === 0 || !replaceText) {
      return;
    }

    const confirmed = await window.worldedit.dialog.showMessage({
      type: 'warning',
      title: 'Replace All',
      message: `Replace all ${results.length} occurrences of "${searchQuery}" with "${replaceText}"?`,
      buttons: ['Replace All', 'Cancel'],
      defaultButton: 1,
      cancelButton: 1
    });

    if (confirmed !== 0) return;

    setIsReplacing(true);

    try {
      await searchManager.replace(results, {
        replaceText,
        replaceAll: true,
        confirmEach: false,
        preserveCase: false
      });

      /* REFRESH SEARCH RESULTS */
      await handleSearch();

      console.log(`[FIND_REPLACE] Replaced all ${results.length} occurrences`);
    } catch (error) {
      console.error('[FIND_REPLACE] Replace all failed:', error);
      await window.worldedit.dialog.showError(
        'Replace All Error',
        `Replace all failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsReplacing(false);
    }
  }, [results, replaceText, searchQuery, handleSearch]);

  /**
   * handleResultSelect()
   *
   * Toggles selection state of search result.
   */
  const handleResultSelect = (resultId: string): void => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(resultId)) {
      newSelection.delete(resultId);
    } else {
      newSelection.add(resultId);
    }
    setSelectedResults(newSelection);
  };

  /**
   * handleSelectAll()
   *
   * Selects or deselects all results.
   */
  const handleSelectAll = (): void => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map((r) => r.id)));
    }
  };

  /**
   * handleKeyDown()
   *
   * Handles keyboard shortcuts.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && event.ctrlKey) {
        handleSearch();
      } else if (event.key === 'F3') {
        event.preventDefault();
        handleSearch();
      }
    },
    [onClose, handleSearch]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  /* STYLES */
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const dialogStyle: React.CSSProperties = {
    width: '800px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    flex: 1,
    overflow: 'hidden'
  };

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    backgroundColor: theme.colors.background.tertiary,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.foreground.primary,
    fontSize: '14px'
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.md,
    flexWrap: 'wrap'
  };

  const checkboxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    fontSize: '12px',
    color: theme.colors.foreground.secondary
  };

  const resultsStyle: React.CSSProperties = {
    flex: 1,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.borderRadius.sm,
    overflow: 'auto',
    backgroundColor: theme.colors.background.tertiary
  };

  const resultItemStyle: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'monospace'
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTop: `1px solid ${theme.colors.border.primary}`
  };

  const statusStyle: React.CSSProperties = {
    fontSize: '12px',
    color: theme.colors.foreground.tertiary,
    flex: 1
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '16px', color: theme.colors.foreground.primary }}>
            Find and Replace
          </h3>
        </div>

        {/* CONTENT */}
        <div style={contentStyle}>
          {/* SEARCH INPUT */}
          <div style={inputRowStyle}>
            <label
              style={{
                minWidth: '60px',
                fontSize: '14px',
                color: theme.colors.foreground.secondary
              }}
            >
              Find:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search text..."
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Find'}
            </Button>
          </div>

          {/* REPLACE INPUT */}
          <div style={inputRowStyle}>
            <label
              style={{
                minWidth: '60px',
                fontSize: '14px',
                color: theme.colors.foreground.secondary
              }}
            >
              Replace:
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              style={inputStyle}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReplace}
              disabled={selectedResults.size === 0 || !replaceText.trim() || isReplacing}
            >
              Replace Selected
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReplaceAll}
              disabled={results.length === 0 || !replaceText.trim() || isReplacing}
            >
              Replace All
            </Button>
          </div>

          {/* OPTIONS */}
          <div style={checkboxRowStyle}>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case Sensitive
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
              />
              Whole Word
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              Use Regex
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={includeScripts}
                onChange={(e) => setIncludeScripts(e.target.checked)}
              />
              Scripts
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={includeScenes}
                onChange={(e) => setIncludeScenes(e.target.checked)}
              />
              Scenes
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={includeProperties}
                onChange={(e) => setIncludeProperties(e.target.checked)}
              />
              Properties
            </label>
          </div>

          {/* RESULTS */}
          <div style={resultsStyle}>
            {results.length > 0 && (
              <div
                style={{
                  ...resultItemStyle,
                  backgroundColor: theme.colors.background.secondary,
                  fontWeight: 'bold'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <input
                    type="checkbox"
                    checked={selectedResults.size === results.length && results.length > 0}
                    onChange={handleSelectAll}
                  />
                  {results.length} Results (Select: {selectedResults.size})
                </label>
              </div>
            )}
            {results.map((result) => (
              <div
                key={result.id}
                style={{
                  ...resultItemStyle,
                  backgroundColor: selectedResults.has(result.id)
                    ? theme.colors.accent.primary + '20'
                    : 'transparent'
                }}
                onClick={() => handleResultSelect(result.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <input type="checkbox" checked={selectedResults.has(result.id)} readOnly />
                  <div>
                    <div style={{ fontWeight: 'bold', color: theme.colors.foreground.primary }}>
                      {result.type === 'script' || result.type === 'scene'
                        ? result.filePath?.split('/').pop()
                        : `${result.entityId} → ${result.componentType}.${result.propertyName}`}
                      {result.lineNumber && (
                        <span style={{ color: theme.colors.foreground.tertiary }}>
                          :{result.lineNumber}
                        </span>
                      )}
                    </div>
                    <div style={{ color: theme.colors.foreground.secondary }}>
                      {result.contextBefore}
                      <span
                        style={{
                          backgroundColor: theme.colors.accent.warning,
                          color: '#000',
                          padding: '1px 2px'
                        }}
                      >
                        {result.matchText}
                      </span>
                      {result.contextAfter}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {results.length === 0 && searchQuery && !isSearching && (
              <div
                style={{
                  ...resultItemStyle,
                  textAlign: 'center',
                  color: theme.colors.foreground.tertiary
                }}
              >
                No results found
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={buttonRowStyle}>
            <div style={statusStyle}>
              {currentSession &&
                `Found ${currentSession.totalMatches} matches in ${currentSession.searchDuration}ms`}
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* END OF FILE */
