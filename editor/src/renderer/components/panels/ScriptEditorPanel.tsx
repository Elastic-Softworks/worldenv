/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

import React, { useState, useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import '../../styles/ScriptEditorPanel.css';

interface ScriptFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface ScriptEditorPanelProps {
  theme?: string;
}

export const ScriptEditorPanel: React.FC<ScriptEditorPanelProps> = ({ theme = 'dark' }) => {
  const [openFiles, setOpenFiles] = useState<ScriptFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const [editorContent, setEditorContent] = useState<string>('');
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const activeFile = activeFileIndex >= 0 ? openFiles[activeFileIndex] : null;

  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
    } else {
      setEditorContent('');
    }
  }, [activeFile]);

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    /* Register WorldC language */
    registerWorldCLanguage(monacoInstance);

    /* Configure editor options */
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFileIndex >= 0) {
      const updatedFiles = [...openFiles];
      updatedFiles[activeFileIndex] = {
        ...updatedFiles[activeFileIndex],
        content: value,
        isDirty: true
      };
      setOpenFiles(updatedFiles);
      setEditorContent(value);
    }
  };

  const openFile = async (filePath: string) => {
    /* Check if file is already open */
    const existingIndex = openFiles.findIndex((f) => f.path === filePath);
    if (existingIndex >= 0) {
      setActiveFileIndex(existingIndex);
      return;
    }

    /* Determine language from file extension */
    const language = getLanguageFromPath(filePath);

    /* Request file content from main process */
    try {
      const content = await window.worldedit.script.readFile(filePath);
      const newFile: ScriptFile = {
        path: filePath,
        content,
        language,
        isDirty: false
      };

      setOpenFiles([...openFiles, newFile]);
      setActiveFileIndex(openFiles.length);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const closeFile = (index: number) => {
    const file = openFiles[index];
    if (file.isDirty) {
      /* Prompt to save changes */
      const shouldSave = confirm(`Save changes to ${file.path}?`);
      if (shouldSave) {
        saveFile(index);
      }
    }

    const updatedFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(updatedFiles);

    if (activeFileIndex === index) {
      setActiveFileIndex(updatedFiles.length > 0 ? 0 : -1);
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const saveFile = async (index: number) => {
    const file = openFiles[index];
    try {
      await window.worldedit.script.writeFile(file.path, file.content);
      const updatedFiles = [...openFiles];
      updatedFiles[index] = { ...file, isDirty: false };
      setOpenFiles(updatedFiles);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const saveActiveFile = () => {
    if (activeFileIndex >= 0) {
      saveFile(activeFileIndex);
    }
  };

  const createNewScript = async (scriptType: 'typescript' | 'assemblyscript' | 'worldc') => {
    const extension =
      scriptType === 'typescript' ? '.ts' : scriptType === 'assemblyscript' ? '.as.ts' : '.wc';
    const template = getScriptTemplate(scriptType);

    /* Request new file creation from main process */
    try {
      const filePath = await window.worldedit.script.createNew(scriptType);
      if (filePath) {
        const newFile: ScriptFile = {
          path: filePath,
          content: template,
          language: 'typescript',
          isDirty: true
        };

        setOpenFiles([...openFiles, newFile]);
        setActiveFileIndex(openFiles.length);
      }
    } catch (error) {
      console.error('Failed to create new script:', error);
    }
  };

  const getLanguageFromPath = (filePath: string): string => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    } else if (filePath.endsWith('.wc') || filePath.endsWith('.worldc')) {
      return 'worldc';
    } else if (filePath.endsWith('.json')) {
      return 'json';
    }
    return 'plaintext';
  };

  const getScriptTemplate = (scriptType: 'typescript' | 'assemblyscript' | 'worldc'): string => {
    if (scriptType === 'worldc') {
      return `#include <worldenv.h>

/*

         PlayerController.wc
           ---
           example WorldC component demonstrating the
           simplified verbiage system and C-like syntax
           with modern TypeScript integration.

*/

edict float PLAYER_SPEED = 200.0f;
edict float JUMP_FORCE = 500.0f;

class PlayerController : public Component {

  private:

  vec3   velocity;
  bool   grounded;
  float  health;

  public:

  /* initialize component */
  void start(): void {

    this.velocity = vec3(0, 0, 0);
    this.grounded = false;
    this.health = 100.0f;

    invoke this.setupInput();

  }

  /* update every frame */
  void update(float deltaTime): void {

    if  (Input.isKeyPressed(KeyCode.A)) {
      this.velocity.x = -PLAYER_SPEED;
    } else if  (Input.isKeyPressed(KeyCode.D)) {
      this.velocity.x = PLAYER_SPEED;
    } else {
      this.velocity.x = 0;
    }

    if  (Input.isKeyPressed(KeyCode.SPACE) && this.grounded) {
      this.velocity.y = JUMP_FORCE;
      this.grounded = false;
    }

    /* apply movement */
    invoke this.applyMovement(deltaTime);

  }

  private void setupInput(): void {
    pass;  /* input setup would go here */
  }

  private void applyMovement(float deltaTime): void {

    vec3 position = this.entity.transform.position;
    position.x += this.velocity.x * deltaTime;
    position.y += this.velocity.y * deltaTime;

    this.entity.transform.position = position;

  }

}`;
    } else if (scriptType === 'typescript') {
      return `import { Component, Entity } from 'worldenv';

export class CustomComponent extends Component {

  onInit(): void {
    /* Component initialization */
  }

  onUpdate(deltaTime: number): void {
    /* Update logic */
  }

  onDestroy(): void {
    /* Cleanup */
  }
}
`;
    } else {
      return `// AssemblyScript Component
// Compiled to WebAssembly for performance

export class CustomComponent {

  onInit(): void {
    // Component initialization
  }

  onUpdate(deltaTime: f64): void {
    // Update logic
  }

  onDestroy(): void {
    // Cleanup
  }
}
`;
    }
  };

  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  return (
    <div className="script-editor-panel">
      <div className="script-editor-header">
        <div className="script-tabs">
          {openFiles.map((file, index) => (
            <div
              key={file.path}
              className={`script-tab ${index === activeFileIndex ? 'active' : ''} ${
                file.isDirty ? 'dirty' : ''
              }`}
              onClick={() => setActiveFileIndex(index)}
            >
              <span className="tab-name">{getFileName(file.path)}</span>
              {file.isDirty && <span className="dirty-indicator">●</span>}
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(index);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="script-actions">
          <button
            className="action-button"
            onClick={() => createNewScript('typescript')}
            title="New TypeScript Script"
          >
            + TS
          </button>
          <button
            className="action-button"
            onClick={() => createNewScript('assemblyscript')}
            title="New AssemblyScript Script"
          >
            + AS
          </button>
          <button
            className="action-button"
            onClick={saveActiveFile}
            disabled={!activeFile || !activeFile.isDirty}
            title="Save (Ctrl+S)"
          >
            Save
          </button>
        </div>
      </div>

      <div className="script-editor-content">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={editorContent}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              automaticLayout: true
            }}
          />
        ) : (
          <div className="no-file-open">
            <div className="placeholder-content">
              <h3>No Script Open</h3>
              <p>Create a new script or open an existing one from the Asset Browser</p>
              <div className="placeholder-actions">
                <button onClick={() => createNewScript('worldc')}>Create WorldC Script</button>
                <button onClick={() => createNewScript('typescript')}>
                  Create TypeScript Script
                </button>
                <button onClick={() => createNewScript('assemblyscript')}>
                  Create AssemblyScript Script
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Register WorldC language with Monaco Editor
 */
const registerWorldCLanguage = (monaco: Monaco) => {
  /* Register language */
  monaco.languages.register({ id: 'worldc' });

  /* Set language configuration */
  monaco.languages.setLanguageConfiguration('worldc', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });

  /* Set syntax highlighting */
  monaco.languages.setMonarchTokensProvider('worldc', {
    keywords: [
      'auto',
      'break',
      'case',
      'char',
      'const',
      'continue',
      'default',
      'do',
      'double',
      'else',
      'enum',
      'extern',
      'float',
      'for',
      'goto',
      'if',
      'inline',
      'int',
      'long',
      'register',
      'return',
      'short',
      'signed',
      'sizeof',
      'static',
      'struct',
      'switch',
      'typedef',
      'union',
      'unsigned',
      'void',
      'volatile',
      'while',
      'class',
      'private',
      'protected',
      'public',
      'virtual',
      'friend',
      'template',
      'typename',
      'namespace',
      'using',
      'operator',
      'new',
      'delete',
      'this',
      'throw',
      'try',
      'catch',
      'let',
      'var',
      'function',
      'interface',
      'type',
      'import',
      'export',
      'async',
      'await',
      'yield',
      'extends',
      'implements',
      'declare',
      'edict',
      'pass',
      'invoke'
    ],

    typeKeywords: [
      'bool',
      'string',
      'number',
      'boolean',
      'any',
      'unknown',
      'never',
      'object',
      'symbol',
      'bigint',
      'vec2',
      'vec3',
      'vec4',
      'ivec2',
      'ivec3',
      'ivec4',
      'quat',
      'mat3',
      'mat4'
    ],

    operators: [
      '=',
      '>',
      '<',
      '!',
      '~',
      '?',
      ':',
      '==',
      '<=',
      '>=',
      '!=',
      '&&',
      '||',
      '++',
      '--',
      '+',
      '-',
      '*',
      '/',
      '&',
      '|',
      '^',
      '%',
      '<<',
      '>>',
      '>>>',
      '+=',
      '-=',
      '*=',
      '/=',
      '&=',
      '|=',
      '^=',
      '%=',
      '<<= ',
      '>>='
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
      root: [
        [
          /[a-z_$][\w$]*/,
          {
            cases: {
              '@typeKeywords': 'keyword',
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }
        ],
        [/[A-Z][\w\$]*/, 'type.identifier'],
        [/[0-9]+\.[0-9]*([eE][\-+]?[0-9]+)?[fF]?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/[0-9]+/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
        [/'[^\\']'/, 'string'],
        [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
        [/'/, 'string.invalid'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
        [
          /@symbols/,
          {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }
        ],
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/[;,.]/, 'delimiter'],
        [/\s+/, 'white']
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        ['\\*/', 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ]
    }
  });

  /* Register completion provider */
  monaco.languages.registerCompletionItemProvider('worldc', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = [
        {
          label: 'edict',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'edict ${1:type} ${2:name} = ${3:value};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Declare a constant value (WorldC simplified syntax)',
          range: range
        },
        {
          label: 'pass',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'pass;',
          documentation: 'No-operation statement (WorldC simplified syntax)',
          range: range
        },
        {
          label: 'invoke',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'invoke ${1:functionName}(${2:args});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Explicit function call (WorldC simplified syntax)',
          range: range
        },
        {
          label: 'component',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'class ${1:ComponentName} : public Component {',
            '',
            '  private:',
            '    ${2:// private members}',
            '',
            '  public:',
            '',
            '    void start(): void {',
            '      ${3:// initialization}',
            '    }',
            '',
            '    void update(float deltaTime): void {',
            '      ${4:// update logic}',
            '    }',
            '',
            '};'
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Create a new WorldC component class',
          range: range
        }
      ];
      return { suggestions };
    }
  });
};
