/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import '../../styles/ScriptEditorPanel.css';

interface ScriptFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  hasErrors: boolean;
  diagnostics: ScriptDiagnostic[];
}

interface ScriptDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

interface ScriptEditorPanelProps {
  theme?: string;
}

export const ScriptEditorPanel: React.FC<ScriptEditorPanelProps> = ({ theme = 'dark' }) => {
  const [openFiles, setOpenFiles] = useState<ScriptFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    registerWorldCLanguage(monacoInstance);

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
      formatOnType: true,
      glyphMargin: true,
      lineNumbersMinChars: 3
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

      debouncedValidation(value, activeFileIndex);
    }
  };

  const debouncedValidation = useCallback((content: string, fileIndex: number) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(async () => {
      await validateScript(content, fileIndex);
    }, 500);
  }, []);

  const validateScript = async (content: string, fileIndex: number): Promise<void> => {
    const file = openFiles[fileIndex];
    if (!file || file.language !== 'worldc') {
      return;
    }

    try {
      setIsCompiling(true);

      const result = await window.worldedit.script.validateWorldC(content, file.path);

      const diagnostics: ScriptDiagnostic[] = result.diagnostics.map((d: any) => ({
        severity: d.severity,
        message: d.message,
        line: d.line || 1,
        column: d.column || 1,
        endLine: d.endLine,
        endColumn: d.endColumn
      }));

      const updatedFiles = [...openFiles];
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        hasErrors: diagnostics.some(d => d.severity === 'error'),
        diagnostics
      };
      setOpenFiles(updatedFiles);

      if (monacoRef.current && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const markers = diagnostics.map(d => ({
            severity: d.severity === 'error' ?
              monacoRef.current!.MarkerSeverity.Error :
              d.severity === 'warning' ?
                monacoRef.current!.MarkerSeverity.Warning :
                monacoRef.current!.MarkerSeverity.Info,
            message: d.message,
            startLineNumber: d.line,
            startColumn: d.column,
            endLineNumber: d.endLine || d.line,
            endColumn: d.endColumn || d.column + 1
          }));

          monacoRef.current.editor.setModelMarkers(model, 'worldc', markers);
        }
      }

    } catch (error) {
      console.error('Script validation failed:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const openFile = async (filePath: string) => {
    const existingIndex = openFiles.findIndex((f) => f.path === filePath);
    if (existingIndex >= 0) {
      setActiveFileIndex(existingIndex);
      return;
    }

    const language = getLanguageFromPath(filePath);

    try {
      const content = await window.worldedit.script.readFile(filePath);
      const newFile: ScriptFile = {
        path: filePath,
        content,
        language,
        isDirty: false,
        hasErrors: false,
        diagnostics: []
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
    try {
      const scriptPath = await window.worldedit.script.createNew(scriptType);
      await openFile(scriptPath);
    } catch (error) {
      console.error('Failed to create new script:', error);
    }
  };

  const getLanguageFromPath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'wc':
        return 'worldc';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'as':
        return 'assemblyscript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
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
              } ${file.hasErrors ? 'has-errors' : ''}`}
              onClick={() => setActiveFileIndex(index)}
            >
              <span className="tab-name">{file.path.split('/').pop()}</span>
              {file.isDirty && <span className="dirty-indicator">●</span>}
              {file.hasErrors && <span className="error-indicator">⚠</span>}
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
            onClick={() => createNewScript('worldc')}
            title="New WorldC Script"
          >
            + WC
          </button>
          <button
            className="action-button"
            onClick={() => createNewScript('typescript')}
            title="New TypeScript Script"
          >
            + TS
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

const registerWorldCLanguage = (monaco: Monaco) => {
  monaco.languages.register({ id: 'worldc' });

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

  monaco.languages.setMonarchTokensProvider('worldc', {
    keywords: [
      'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
      'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
      'inline', 'int', 'long', 'register', 'return', 'short', 'signed',
      'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
      'void', 'volatile', 'while', 'class', 'private', 'protected', 'public',
      'virtual', 'friend', 'template', 'typename', 'namespace', 'using',
      'operator', 'new', 'delete', 'this', 'throw', 'try', 'catch',
      'let', 'var', 'function', 'interface', 'type', 'import', 'export',
      'async', 'await', 'yield', 'extends', 'implements', 'declare',
      'edict', 'pass', 'invoke'
    ],

    typeKeywords: [
      'bool', 'string', 'number', 'boolean', 'any', 'unknown', 'never',
      'object', 'symbol', 'bigint', 'vec2', 'vec3', 'vec4', 'ivec2',
      'ivec3', 'ivec4', 'quat', 'mat3', 'mat4'
    ],

    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^',
      '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
      '^=', '%=', '<<=', '>>='
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
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ]
    }
  });

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
            '    void destroy(): void {',
            '      ${5:// cleanup}',
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
