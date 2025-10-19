/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
	WORLDEDIT - Search Manager
	ELASTIC SOFTWORKS 2025
	===============================================================
*/

/*

	                --- SEARCH ETHOS ---

	    the search manager provides comprehensive text search
	    and replace functionality across scripts, scenes, and
	    entity properties. it supports regex patterns, case
	    sensitivity, whole word matching, and batch operations.

	    results are presented in a structured format that
	    allows users to navigate matches quickly and perform
	    targeted replacements with undo support.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import { SceneManager } from '../hierarchy/SceneManager'; /* SCENE OPERATIONS */
import { UndoRedoManager, ICommand } from '../undo'; /* COMMAND SYSTEM */
import * as fs from 'fs'; /* FILE OPERATIONS */
import * as path from 'path'; /* PATH UTILITIES */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/*

         SearchOptions
	       ---
	       configuration for search operations including
	       pattern matching options and scope settings.

*/

export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includeScripts: boolean;
  includeScenes: boolean;
  includeProperties: boolean;
  maxResults?: number;
}

/*

         SearchResult
	       ---
	       represents a single match in search results with
	       context information for navigation and replacement.

*/

export interface SearchResult {
  id: string;
  type: 'script' | 'scene' | 'property';
  filePath?: string;
  entityId?: string;
  componentType?: string;
  propertyName?: string;
  lineNumber?: number;
  columnStart?: number;
  columnEnd?: number;
  matchText: string;
  contextBefore?: string;
  contextAfter?: string;
  fullLine?: string;
}

/*

         SearchSession
	       ---
	       contains complete search results and metadata
	       for a search operation.

*/

export interface SearchSession {
  id: string;
  query: string;
  options: SearchOptions;
  results: SearchResult[];
  timestamp: number;
  totalMatches: number;
  searchDuration: number;
}

/*

         ReplaceOptions
	       ---
	       configuration for replace operations including
	       replacement text and confirmation settings.

*/

export interface ReplaceOptions {
  replaceText: string;
  replaceAll: boolean;
  confirmEach: boolean;
  preserveCase: boolean;
}

/*
	===============================================================
             --- COMMANDS ---
	===============================================================
*/

/*

         ReplaceTextCommand
	       ---
	       command for text replacement with undo support.
	       handles file modifications and property changes.

*/

class ReplaceTextCommand implements ICommand {
  public description: string;
  private originalContents: Map<string, string> = new Map();
  private modifiedFiles: string[] = [];

  constructor(
    private replacements: Array<{
      result: SearchResult;
      newText: string;
      originalText: string;
    }>
  ) {
    const count = replacements.length;
    this.description = `Replace ${count} ${count === 1 ? 'occurrence' : 'occurrences'}`;
  }

  execute(): void {
    this.modifiedFiles = [];
    this.originalContents.clear();

    for (const replacement of this.replacements) {
      this.performReplacement(replacement);
    }
  }

  undo(): void {
    /* RESTORE ORIGINAL FILE CONTENTS */
    for (const filePath of this.modifiedFiles) {
      const originalContent = this.originalContents.get(filePath);
      if (originalContent !== undefined) {
        fs.writeFileSync(filePath, originalContent, 'utf8');
      }
    }

    this.modifiedFiles = [];
    this.originalContents.clear();
  }

  private performReplacement(replacement: any): void {
    const { result, newText, originalText } = replacement;

    if (result.type === 'script' && result.filePath) {
      this.replaceInFile(result.filePath, result, newText, originalText);
    } else if (result.type === 'scene' && result.filePath) {
      this.replaceInFile(result.filePath, result, newText, originalText);
    } else if (result.type === 'property') {
      this.replaceInProperty(result, newText);
    }
  }

  private replaceInFile(
    filePath: string,
    result: SearchResult,
    newText: string,
    originalText: string
  ): void {
    try {
      if (!this.originalContents.has(filePath)) {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        this.originalContents.set(filePath, originalContent);
      }

      let content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      if (
        result.lineNumber !== undefined &&
        result.lineNumber > 0 &&
        result.lineNumber <= lines.length
      ) {
        const lineIndex = result.lineNumber - 1;
        const line = lines[lineIndex];

        if (result.columnStart !== undefined && result.columnEnd !== undefined) {
          const before = line.substring(0, result.columnStart);
          const after = line.substring(result.columnEnd);
          lines[lineIndex] = before + newText + after;
        } else {
          lines[lineIndex] = line.replace(originalText, newText);
        }

        content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');

        if (!this.modifiedFiles.includes(filePath)) {
          this.modifiedFiles.push(filePath);
        }
      }
    } catch (error) {
      console.error('[SEARCH] Failed to replace in file:', error);
    }
  }

  private replaceInProperty(result: SearchResult, newText: string): void {
    try {
      const sceneManager = SceneManager.getInstance();
      const scene = sceneManager.currentScene;

      if (scene && result.entityId && result.componentType && result.propertyName) {
        const node = scene.getNode(result.entityId);
        if (node) {
          // For now, just log the replacement as component system needs implementation
          console.log(
            `[SEARCH] Property replacement: ${result.entityId}.${result.componentType}.${result.propertyName} = ${newText}`
          );
        }
      }
    } catch (error) {
      console.error('[SEARCH] Failed to replace in property:', error);
    }
  }
}

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/*

         SearchManager
	       ---
	       singleton manager for search and replace operations
	       across the entire project. handles text searching
	       in scripts, scenes, and entity properties with
	       comprehensive filtering and replacement capabilities.

*/

export class SearchManager {
  private static instance: SearchManager;
  private currentSession: SearchSession | null = null;
  private sceneManager: SceneManager;
  private undoRedoManager: UndoRedoManager;
  private projectPath: string = '';

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.undoRedoManager = UndoRedoManager.getInstance();
  }

  public static getInstance(): SearchManager {
    if (!SearchManager.instance) {
      SearchManager.instance = new SearchManager();
    }
    return SearchManager.instance;
  }

  /*

           setProjectPath()
	         ---
	         sets the current project path for file searches.

  */

  public setProjectPath(projectPath: string): void {
    this.projectPath = projectPath;
  }

  /*

           search()
	         ---
	         performs comprehensive search across specified
	         scope with given options. returns structured
	         results for UI presentation.

  */

  public async search(options: SearchOptions): Promise<SearchSession> {
    const startTime = Date.now();
    const sessionId = `search_${Date.now()}`;
    const results: SearchResult[] = [];

    try {
      console.log('[SEARCH] Starting search with options:', options);

      /* SEARCH IN SCRIPTS */
      if (options.includeScripts) {
        const scriptResults = await this.searchInScripts(options);
        results.push(...scriptResults);
      }

      /* SEARCH IN SCENES */
      if (options.includeScenes) {
        const sceneResults = await this.searchInScenes(options);
        results.push(...sceneResults);
      }

      /* SEARCH IN PROPERTIES */
      if (options.includeProperties) {
        const propertyResults = this.searchInProperties(options);
        results.push(...propertyResults);
      }

      /* LIMIT RESULTS IF SPECIFIED */
      const finalResults = options.maxResults ? results.slice(0, options.maxResults) : results;

      const searchDuration = Date.now() - startTime;

      this.currentSession = {
        id: sessionId,
        query: options.query,
        options,
        results: finalResults,
        timestamp: Date.now(),
        totalMatches: finalResults.length,
        searchDuration
      };

      console.log(`[SEARCH] Found ${finalResults.length} matches in ${searchDuration}ms`);
      return this.currentSession;
    } catch (error) {
      console.error('[SEARCH] Search failed:', error);
      throw error;
    }
  }

  /*

           replace()
	         ---
	         performs text replacement on specified search
	         results with undo support.

  */

  public async replace(results: SearchResult[], replaceOptions: ReplaceOptions): Promise<void> {
    if (results.length === 0) {
      return;
    }

    try {
      const replacements: Array<{
        result: SearchResult;
        newText: string;
        originalText: string;
      }> = [];

      for (const result of results) {
        if (replaceOptions.confirmEach) {
          const shouldReplace = await this.confirmReplacement(result, replaceOptions.replaceText);
          if (!shouldReplace) {
            continue;
          }
        }

        const newText = this.calculateReplacementText(
          result.matchText,
          replaceOptions.replaceText,
          replaceOptions.preserveCase
        );

        replacements.push({
          result,
          newText,
          originalText: result.matchText
        });
      }

      if (replacements.length > 0) {
        const replaceCommand = new ReplaceTextCommand(replacements);
        this.undoRedoManager.executeCommand(replaceCommand);

        console.log(`[SEARCH] Replaced ${replacements.length} occurrences`);
      }
    } catch (error) {
      console.error('[SEARCH] Replace failed:', error);
      throw error;
    }
  }

  /*

           getCurrentSession()
	         ---
	         returns the current search session or null.

  */

  public getCurrentSession(): SearchSession | null {
    return this.currentSession;
  }

  /*

           clearSession()
	         ---
	         clears the current search session.

  */

  public clearSession(): void {
    this.currentSession = null;
  }

  private async searchInScripts(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const scriptsDir = path.join(this.projectPath, 'scripts');

    if (!fs.existsSync(scriptsDir)) {
      return results;
    }

    const scriptFiles = this.findScriptFiles(scriptsDir);

    for (const filePath of scriptFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileResults = this.searchInText(content, options, 'script', filePath);
        results.push(...fileResults);
      } catch (error) {
        console.warn('[SEARCH] Failed to read script file:', filePath, error);
      }
    }

    return results;
  }

  private async searchInScenes(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const scenesDir = path.join(this.projectPath, 'scenes');

    if (!fs.existsSync(scenesDir)) {
      return results;
    }

    const sceneFiles = this.findFiles(scenesDir, ['.scene', '.json']);

    for (const filePath of sceneFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileResults = this.searchInText(content, options, 'scene', filePath);
        results.push(...fileResults);
      } catch (error) {
        console.warn('[SEARCH] Failed to read scene file:', filePath, error);
      }
    }

    return results;
  }

  private searchInProperties(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];

    try {
      const scene = this.sceneManager.currentScene;
      if (!scene) return results;

      const allNodes = scene.getAllNodes();

      for (const node of allNodes) {
        // Search in node name
        if (this.matchesQuery(node.name, options)) {
          results.push({
            id: `${node.id}_name`,
            type: 'property',
            entityId: node.id,
            componentType: 'Node',
            propertyName: 'name',
            matchText: node.name,
            contextBefore: `${node.name}.Node.name:`
          });
        }

        // For now, we'll search basic node properties
        // Component system would need to be implemented for full property search
        const transform = node.transform;
        if (transform) {
          const transformStr = JSON.stringify(transform);
          if (this.matchesQuery(transformStr, options)) {
            results.push({
              id: `${node.id}_transform`,
              type: 'property',
              entityId: node.id,
              componentType: 'Transform',
              propertyName: 'transform',
              matchText: transformStr,
              contextBefore: `${node.name}.Transform.transform:`
            });
          }
        }
      }
    } catch (error) {
      console.error('[SEARCH] Failed to search properties:', error);
    }

    return results;
  }

  private searchInText(
    content: string,
    options: SearchOptions,
    type: 'script' | 'scene',
    filePath: string
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const matches = this.findMatchesInLine(line, options);

      for (const match of matches) {
        results.push({
          id: `${filePath}_${lineIndex}_${match.start}`,
          type,
          filePath,
          lineNumber: lineIndex + 1,
          columnStart: match.start,
          columnEnd: match.end,
          matchText: match.text,
          contextBefore: line.substring(0, match.start),
          contextAfter: line.substring(match.end),
          fullLine: line
        });
      }
    }

    return results;
  }

  private findMatchesInLine(
    line: string,
    options: SearchOptions
  ): Array<{
    start: number;
    end: number;
    text: string;
  }> {
    const matches: Array<{ start: number; end: number; text: string }> = [];

    try {
      let searchText = line;
      let query = options.query;

      if (!options.caseSensitive) {
        searchText = line.toLowerCase();
        query = options.query.toLowerCase();
      }

      if (options.useRegex) {
        const flags = options.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(options.query, flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });

          if (!regex.global) break;
        }
      } else {
        let startIndex = 0;
        while (startIndex < searchText.length) {
          let index = searchText.indexOf(query, startIndex);
          if (index === -1) break;

          if (options.wholeWord) {
            const charBefore = index > 0 ? line[index - 1] : '';
            const charAfter = index + query.length < line.length ? line[index + query.length] : '';

            if (/\w/.test(charBefore) || /\w/.test(charAfter)) {
              startIndex = index + 1;
              continue;
            }
          }

          matches.push({
            start: index,
            end: index + query.length,
            text: line.substring(index, index + query.length)
          });

          startIndex = index + query.length;
        }
      }
    } catch (error) {
      console.warn('[SEARCH] Regex error in line search:', error);
    }

    return matches;
  }

  private matchesQuery(text: string, options: SearchOptions): boolean {
    try {
      if (options.useRegex) {
        const flags = options.caseSensitive ? '' : 'i';
        const regex = new RegExp(options.query, flags);
        return regex.test(text);
      }

      let searchText = text;
      let query = options.query;

      if (!options.caseSensitive) {
        searchText = text.toLowerCase();
        query = options.query.toLowerCase();
      }

      if (options.wholeWord) {
        const regex = new RegExp(`\\b${query}\\b`, options.caseSensitive ? '' : 'i');
        return regex.test(text);
      }

      return searchText.includes(query);
    } catch (error) {
      console.warn('[SEARCH] Error matching query:', error);
      return false;
    }
  }

  private findScriptFiles(dir: string): string[] {
    return this.findFiles(dir, ['.ts', '.js', '.wc']);
  }

  private findFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.findFiles(fullPath, extensions));
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn('[SEARCH] Failed to read directory:', dir, error);
    }

    return files;
  }

  private async confirmReplacement(result: SearchResult, replaceText: string): Promise<boolean> {
    try {
      const message = `Replace "${result.matchText}" with "${replaceText}"?`;

      const response = await window.worldedit.dialog.showMessage({
        type: 'question',
        title: 'Confirm Replacement',
        message,
        buttons: ['Replace', 'Skip', 'Cancel'],
        defaultButton: 0,
        cancelButton: 2
      });

      return response === 0; /* REPLACE */
    } catch (error) {
      console.error('[SEARCH] Failed to show confirmation dialog:', error);
      return false;
    }
  }

  private calculateReplacementText(
    originalText: string,
    replaceText: string,
    preserveCase: boolean
  ): string {
    if (!preserveCase) {
      return replaceText;
    }

    /* PRESERVE CASE LOGIC */
    if (originalText === originalText.toUpperCase()) {
      return replaceText.toUpperCase();
    } else if (originalText === originalText.toLowerCase()) {
      return replaceText.toLowerCase();
    } else if (originalText[0] === originalText[0].toUpperCase()) {
      return replaceText.charAt(0).toUpperCase() + replaceText.slice(1).toLowerCase();
    }

    return replaceText;
  }
}

/* END OF FILE */
