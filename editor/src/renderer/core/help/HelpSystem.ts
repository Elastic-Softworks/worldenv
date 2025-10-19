/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

        HelpSystem
        ---
        this module provides context-sensitive help and documentation
        for the WORLDEDIT editor. it manages help content, displays
        contextual information based on user focus, and provides
        access to documentation and tutorials.

        the system can show inline help, tooltips, and full
        documentation panels based on the current editor context
        and user actions. it integrates with the keyboard shortcut
        system to provide comprehensive help information.

*/

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

/**
 * Help content interface
 */
interface HelpContent {
  id:           string;
  title:        string;
  description:  string;
  category:     HelpCategory;
  tags:         string[];
  content:      string;
  shortcuts?:   string[];
  relatedTopics?: string[];
  examples?:    HelpExample[];
}

/**
 * Help example interface
 */
interface HelpExample {
  title:        string;
  description:  string;
  code?:        string;
  image?:       string;
}

/**
 * Help categories
 */
enum HelpCategory {
  GETTING_STARTED = 'Getting Started',
  SCENE_EDITING   = 'Scene Editing',
  COMPONENTS      = 'Components',
  SCRIPTING       = 'Scripting',
  BUILD_SYSTEM    = 'Build System',
  ASSETS          = 'Assets',
  SHORTCUTS       = 'Shortcuts',
  TROUBLESHOOTING = 'Troubleshooting'
}

/**
 * Context information for help
 */
interface HelpContext {
  panel?:         string;
  tool?:          string;
  selectedType?:  string;
  actionState?:   string;
}

/**
 * Help display modes
 */
enum HelpDisplayMode {
  INLINE    = 'inline',
  TOOLTIP   = 'tooltip',
  PANEL     = 'panel',
  MODAL     = 'modal'
}

/*
	===============================================================
             --- CONTENT ---
	===============================================================
*/

/**
 * Built-in help content database
 */
const HELP_DATABASE: HelpContent[] = [
  {
    id: 'getting-started-overview',
    title: 'Getting Started with WORLDEDIT',
    description: 'Learn the basics of using the WORLDEDIT editor',
    category: HelpCategory.GETTING_STARTED,
    tags: ['basics', 'introduction', 'overview'],
    content: `
# Getting Started with WORLDEDIT

WORLDEDIT is a powerful game development editor built for the WORLDENV engine. This guide will help you get started with creating your first project.

## Creating a New Project

1. Click **File > New Project** or press **Ctrl+N**
2. Select a directory for your project
3. Choose your project settings
4. Click **Create**

## Interface Overview

The WORLDEDIT interface consists of several key panels:

- **Hierarchy Panel**: Shows the scene structure
- **Inspector Panel**: Displays properties of selected objects
- **Assets Panel**: Manages project assets
- **Viewport**: 3D/2D view of your scene
- **Script Panel**: Code editor for scripting

## Basic Workflow

1. Create entities in the scene
2. Add components to entities
3. Configure component properties
4. Test your scene with Play Mode
5. Build your project for deployment
    `,
    shortcuts: ['Ctrl+N', 'F5', 'Ctrl+S'],
    relatedTopics: ['scene-editing-basics', 'components-overview']
  },

  {
    id: 'scene-editing-basics',
    title: 'Scene Editing Basics',
    description: 'Learn how to create and edit scenes',
    category: HelpCategory.SCENE_EDITING,
    tags: ['scene', 'entities', 'hierarchy'],
    content: `
# Scene Editing Basics

Scenes are the foundation of your game. They contain all the entities and components that make up a level or area.

## Creating Entities

- Right-click in the Hierarchy panel
- Select "Create Entity"
- Choose from available entity types

## Transform Tools

Use the transform tools to position, rotate, and scale entities:

- **Select Tool (Q)**: Select and move entities
- **Move Tool (W)**: Translate entities in 3D space
- **Rotate Tool (E)**: Rotate entities around their center
- **Scale Tool (R)**: Resize entities uniformly or per-axis

## Selection

- Click entities in the viewport or hierarchy to select
- Hold Ctrl to multi-select
- Use Ctrl+A to select all entities
- Press Delete to remove selected entities
    `,
    shortcuts: ['Q', 'W', 'E', 'R', 'Ctrl+A', 'Delete'],
    relatedTopics: ['components-overview', 'transform-system']
  },

  {
    id: 'components-overview',
    title: 'Component System',
    description: 'Understanding components and how to use them',
    category: HelpCategory.COMPONENTS,
    tags: ['components', 'properties', 'systems'],
    content: `
# Component System

Components are the building blocks that give entities their behavior and appearance.

## Adding Components

1. Select an entity in the hierarchy
2. In the Inspector panel, click "Add Component"
3. Choose from available component types
4. Configure component properties

## Common Components

- **Transform**: Position, rotation, and scale
- **Mesh Renderer**: Visual appearance with materials
- **Collider**: Physics collision detection
- **Script**: Custom behavior through WORLDC scripts
- **Audio Source**: Sound and music playback

## Component Properties

Each component has properties that can be modified:
- Use the Inspector panel to edit values
- Properties are automatically saved with the scene
- Some properties can be animated or scripted
    `,
    relatedTopics: ['scripting-basics', 'scene-editing-basics']
  },

  {
    id: 'scripting-basics',
    title: 'WORLDC Scripting',
    description: 'Introduction to WORLDC scripting language',
    category: HelpCategory.SCRIPTING,
    tags: ['worldc', 'scripts', 'programming'],
    content: `
# WORLDC Scripting Basics

WORLDC is the scripting language used in WORLDENV for entity behavior and game logic.

## Creating Scripts

1. In the Assets panel, right-click and select "Create > Script"
2. Name your script file
3. Double-click to open in the Script panel

## Basic Script Structure

\`\`\`worldc
// Entity behavior script
entity MyEntity {
    void start() {
        // Called when entity is created
        log("Entity started");
    }

    void update(float deltaTime) {
        // Called every frame
        transform.position.y += deltaTime;
    }
}
\`\`\`

## Attaching Scripts

1. Select an entity
2. Add a Script component
3. Assign your script file to the component
    `,
    examples: [
      {
        title: 'Simple Movement',
        description: 'Move an entity up and down',
        code: `entity Bouncer {
    float speed = 2.0;

    void update(float dt) {
        float y = sin(time * speed) * 3.0;
        transform.position.y = y;
    }
}`
      }
    ],
    relatedTopics: ['components-overview', 'build-system']
  },

  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Complete list of keyboard shortcuts',
    category: HelpCategory.SHORTCUTS,
    tags: ['shortcuts', 'hotkeys', 'productivity'],
    content: `
# Keyboard Shortcuts

Master these shortcuts to speed up your workflow:

## File Operations
- **Ctrl+N**: New Project
- **Ctrl+O**: Open Project
- **Ctrl+S**: Save Project

## Edit Operations
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+C**: Copy
- **Ctrl+X**: Cut
- **Ctrl+V**: Paste
- **Ctrl+A**: Select All
- **Delete**: Delete Selected
- **Ctrl+D**: Duplicate

## Transform Tools
- **Q**: Select Tool
- **W**: Move Tool
- **E**: Rotate Tool
- **R**: Scale Tool
- **G**: Grab Mode

## View Controls
- **Ctrl+1**: Toggle Hierarchy Panel
- **Ctrl+2**: Toggle Inspector Panel
- **Ctrl+3**: Toggle Assets Panel
- **Ctrl+4**: Toggle Script Panel

## Playback
- **F5**: Play/Pause
- **F6**: Stop

## Help
- **F1**: Show Documentation
- **Ctrl+?**: Show This Shortcuts List
    `,
    shortcuts: ['F1', 'Ctrl+?']
  }
];

/*
	===============================================================
             --- MANAGER ---
	===============================================================
*/

/**
 * HelpSystem class
 *
 * Manages context-sensitive help and documentation display.
 * Provides search functionality and contextual help suggestions.
 */
export class HelpSystem {

  private static instance: HelpSystem | null = null;

  private helpDatabase:     HelpContent[] = [...HELP_DATABASE];
  private currentContext:   HelpContext = {};
  private displayMode:      HelpDisplayMode = HelpDisplayMode.PANEL;
  private searchIndex:      Map<string, HelpContent[]> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {

    this.buildSearchIndex();

  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HelpSystem {

    if (!HelpSystem.instance) {
      HelpSystem.instance = new HelpSystem();
    }

    return HelpSystem.instance;

  }

  /**
   * Search help content
   */
  public search(query: string): HelpContent[] {

    if (!query.trim()) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const results: Map<string, { content: HelpContent, score: number }> = new Map();

    searchTerms.forEach(term => {
      /* SEARCH IN TITLES */
      this.helpDatabase.forEach(content => {
        if (content.title.toLowerCase().includes(term)) {
          const existing = results.get(content.id);
          const score = (existing?.score || 0) + 10;
          results.set(content.id, { content, score });
        }
      });

      /* SEARCH IN TAGS */
      this.helpDatabase.forEach(content => {
        content.tags.forEach(tag => {
          if (tag.toLowerCase().includes(term)) {
            const existing = results.get(content.id);
            const score = (existing?.score || 0) + 5;
            results.set(content.id, { content, score });
          }
        });
      });

      /* SEARCH IN DESCRIPTIONS */
      this.helpDatabase.forEach(content => {
        if (content.description.toLowerCase().includes(term)) {
          const existing = results.get(content.id);
          const score = (existing?.score || 0) + 3;
          results.set(content.id, { content, score });
        }
      });

      /* SEARCH IN CONTENT */
      this.helpDatabase.forEach(content => {
        if (content.content.toLowerCase().includes(term)) {
          const existing = results.get(content.id);
          const score = (existing?.score || 0) + 1;
          results.set(content.id, { content, score });
        }
      });
    });

    /* SORT BY SCORE */
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .map(result => result.content);

  }

  /**
   * Get help content by ID
   */
  public getContent(id: string): HelpContent | null {

    return this.helpDatabase.find(content => content.id === id) || null;

  }

  /**
   * Get help content by category
   */
  public getByCategory(category: HelpCategory): HelpContent[] {

    return this.helpDatabase.filter(content => content.category === category);

  }

  /**
   * Get contextual help based on current editor state
   */
  public getContextualHelp(context?: HelpContext): HelpContent[] {

    const currentContext = context || this.currentContext;
    const suggestions: HelpContent[] = [];

    /* PANEL-SPECIFIC HELP */
    if (currentContext.panel) {
      switch (currentContext.panel) {
        case 'hierarchy':
          suggestions.push(...this.getByCategory(HelpCategory.SCENE_EDITING));
          break;
        case 'inspector':
          suggestions.push(...this.getByCategory(HelpCategory.COMPONENTS));
          break;
        case 'script':
          suggestions.push(...this.getByCategory(HelpCategory.SCRIPTING));
          break;
        case 'assets':
          suggestions.push(...this.getByCategory(HelpCategory.ASSETS));
          break;
      }
    }

    /* TOOL-SPECIFIC HELP */
    if (currentContext.tool) {
      suggestions.push(...this.helpDatabase.filter(content =>
        content.tags.includes(currentContext.tool!)
      ));
    }

    /* FALLBACK TO GETTING STARTED */
    if (suggestions.length === 0) {
      suggestions.push(...this.getByCategory(HelpCategory.GETTING_STARTED));
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions

  }

  /**
   * Update current context
   */
  public updateContext(context: Partial<HelpContext>): void {

    this.currentContext = { ...this.currentContext, ...context };

  }

  /**
   * Get all categories
   */
  public getCategories(): HelpCategory[] {

    return Object.values(HelpCategory);

  }

  /**
   * Add custom help content
   */
  public addContent(content: HelpContent): void {

    /* CHECK IF CONTENT ALREADY EXISTS */
    const existingIndex = this.helpDatabase.findIndex(item => item.id === content.id);

    if (existingIndex >= 0) {
      this.helpDatabase[existingIndex] = content;
    } else {
      this.helpDatabase.push(content);
    }

    this.buildSearchIndex();

  }

  /**
   * Remove help content
   */
  public removeContent(id: string): boolean {

    const index = this.helpDatabase.findIndex(content => content.id === id);

    if (index >= 0) {
      this.helpDatabase.splice(index, 1);
      this.buildSearchIndex();
      return true;
    }

    return false;

  }

  /**
   * Get related topics for a piece of content
   */
  public getRelatedTopics(contentId: string): HelpContent[] {

    const content = this.getContent(contentId);

    if (!content || !content.relatedTopics) {
      return [];
    }

    return content.relatedTopics
      .map(id => this.getContent(id))
      .filter((item): item is HelpContent => item !== null);

  }

  /**
   * Set display mode
   */
  public setDisplayMode(mode: HelpDisplayMode): void {

    this.displayMode = mode;

  }

  /**
   * Get current display mode
   */
  public getDisplayMode(): HelpDisplayMode {

    return this.displayMode;

  }

  /*
	===============================================================
             --- PRIVATE ---
	===============================================================
*/

  /**
   * Build search index for faster searching
   */
  private buildSearchIndex(): void {

    this.searchIndex.clear();

    this.helpDatabase.forEach(content => {
      /* INDEX BY TITLE WORDS */
      const titleWords = content.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, []);
        }
        this.searchIndex.get(word)!.push(content);
      });

      /* INDEX BY TAGS */
      content.tags.forEach(tag => {
        const tagKey = tag.toLowerCase();
        if (!this.searchIndex.has(tagKey)) {
          this.searchIndex.set(tagKey, []);
        }
        this.searchIndex.get(tagKey)!.push(content);
      });
    });

  }

}

/* EXPORT SINGLETON INSTANCE */
export const helpSystem = HelpSystem.getInstance();

/*
	===============================================================
             --- EXPORTS ---
	===============================================================
*/

export { HelpCategory, HelpDisplayMode };
export type { HelpContent, HelpContext, HelpExample };

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
