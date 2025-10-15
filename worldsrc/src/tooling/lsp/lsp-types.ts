/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             --- WORLDSRC LSP TYPES ---
	====================================================================
*/

/*

         lsp-types.ts
	       ---
	       this file defines the Language Server Protocol types and
	       interfaces for WORLDSRC. it provides comprehensive type
	       definitions for LSP communication, enabling IDE integration
	       with features like auto-completion, error reporting, and
	       real-time diagnostics.

	       the types follow the LSP 3.17 specification and include
	       WORLDSRC-specific extensions for hybrid language support.

*/

/*
	====================================================================
             --- CORE LSP TYPES ---
	====================================================================
*/

export interface Position {
  line:      number;    /* 0-based line position */
  character: number;    /* 0-based character position */
}

export interface Range {
  start: Position;      /* start position of range */
  end:   Position;      /* end position of range */
}

export interface Location {
  uri:   string;        /* document URI */
  range: Range;         /* location range */
}

export interface Diagnostic {
  range:              Range;                    /* diagnostic range */
  severity?:          DiagnosticSeverity;      /* severity level */
  code?:              number | string;         /* diagnostic code */
  codeDescription?:   CodeDescription;         /* code description */
  source?:            string;                  /* diagnostic source */
  message:            string;                  /* diagnostic message */
  tags?:              DiagnosticTag[];         /* diagnostic tags */
  relatedInformation?: DiagnosticRelatedInformation[]; /* related info */
  data?:              any;                     /* additional data */
}

export enum DiagnosticSeverity {
  ERROR       = 1,
  WARNING     = 2,
  INFORMATION = 3,
  HINT        = 4
}

export enum DiagnosticTag {
  UNNECESSARY = 1,      /* unused code */
  DEPRECATED  = 2       /* deprecated code */
}

export interface CodeDescription {
  href: string;         /* link to documentation */
}

export interface DiagnosticRelatedInformation {
  location: Location;   /* related location */
  message:  string;     /* related message */
}

/*
	====================================================================
             --- COMPLETION TYPES ---
	====================================================================
*/

export interface CompletionItem {
  label:               string;                      /* completion label */
  labelDetails?:       CompletionItemLabelDetails;  /* label details */
  kind?:               CompletionItemKind;          /* completion kind */
  tags?:               CompletionItemTag[];         /* item tags */
  detail?:             string;                      /* detail string */
  documentation?:      string | MarkupContent;     /* documentation */
  deprecated?:         boolean;                     /* is deprecated */
  preselect?:          boolean;                     /* should preselect */
  sortText?:           string;                      /* sort text */
  filterText?:         string;                      /* filter text */
  insertText?:         string;                      /* insert text */
  insertTextFormat?:   InsertTextFormat;            /* insert format */
  insertTextMode?:     InsertTextMode;              /* insert mode */
  textEdit?:           TextEdit;                    /* text edit */
  additionalTextEdits?: TextEdit[];                 /* additional edits */
  commitCharacters?:   string[];                    /* commit chars */
  command?:            Command;                     /* command to run */
  data?:               any;                         /* additional data */
}

export interface CompletionItemLabelDetails {
  detail?:      string; /* additional detail */
  description?: string; /* item description */
}

export enum CompletionItemKind {
  TEXT          = 1,    /* plain text */
  METHOD        = 2,    /* method/function */
  FUNCTION      = 3,    /* function */
  CONSTRUCTOR   = 4,    /* constructor */
  FIELD         = 5,    /* field/member */
  VARIABLE      = 6,    /* variable */
  CLASS         = 7,    /* class */
  INTERFACE     = 8,    /* interface */
  MODULE        = 9,    /* module */
  PROPERTY      = 10,   /* property */
  UNIT          = 11,   /* unit/measurement */
  VALUE         = 12,   /* value */
  ENUM          = 13,   /* enumeration */
  KEYWORD       = 14,   /* language keyword */
  SNIPPET       = 15,   /* code snippet */
  COLOR         = 16,   /* color */
  FILE          = 17,   /* file */
  REFERENCE     = 18,   /* reference */
  FOLDER        = 19,   /* folder/directory */
  ENUM_MEMBER   = 20,   /* enum member */
  CONSTANT      = 21,   /* constant */
  STRUCT        = 22,   /* struct */
  EVENT         = 23,   /* event */
  OPERATOR      = 24,   /* operator */
  TYPE_PARAMETER = 25   /* type parameter */
}

export enum CompletionItemTag {
  DEPRECATED = 1        /* deprecated completion */
}

export enum InsertTextFormat {
  PLAIN_TEXT = 1,       /* plain text */
  SNIPPET    = 2        /* snippet format */
}

export enum InsertTextMode {
  AS_IS               = 1, /* insert as is */
  ADJUST_INDENTATION  = 2  /* adjust indentation */
}

export interface TextEdit {
  range:   Range;       /* edit range */
  newText: string;      /* new text */
}

export interface Command {
  title:     string;    /* command title */
  command:   string;    /* command identifier */
  arguments?: any[];    /* command arguments */
}

export interface MarkupContent {
  kind:  MarkupKind;    /* markup kind */
  value: string;        /* markup content */
}

export enum MarkupKind {
  PLAIN_TEXT = "plaintext",
  MARKDOWN   = "markdown"
}

/*
	====================================================================
             --- HOVER TYPES ---
	====================================================================
*/

export interface Hover {
  contents: MarkupContent | MarkedString | MarkedString[]; /* hover content */
  range?:   Range;                                         /* hover range */
}

export interface MarkedString {
  language: string;     /* language identifier */
  value:    string;     /* string value */
}

/*
	====================================================================
             --- SIGNATURE HELP TYPES ---
	====================================================================
*/

export interface SignatureHelp {
  signatures:      SignatureInformation[]; /* signature list */
  activeSignature?: number;                /* active signature */
  activeParameter?: number;                /* active parameter */
}

export interface SignatureInformation {
  label:           string;                    /* signature label */
  documentation?:  string | MarkupContent;   /* documentation */
  parameters?:     ParameterInformation[];   /* parameter info */
  activeParameter?: number;                  /* active parameter */
}

export interface ParameterInformation {
  label:         string | [number, number]; /* parameter label */
  documentation?: string | MarkupContent;   /* parameter docs */
}

/*
	====================================================================
             --- DEFINITION TYPES ---
	====================================================================
*/

export type Definition = Location | Location[];

export interface DefinitionLink {
  originSelectionRange?: Range;    /* origin selection */
  targetUri:            string;   /* target URI */
  targetRange:          Range;    /* target range */
  targetSelectionRange: Range;    /* target selection */
}

/*
	====================================================================
             --- REFERENCE TYPES ---
	====================================================================
*/

export interface ReferenceContext {
  includeDeclaration: boolean;    /* include declaration */
}

/*
	====================================================================
             --- SYMBOL TYPES ---
	====================================================================
*/

export interface DocumentSymbol {
  name:           string;               /* symbol name */
  detail?:        string;               /* symbol detail */
  kind:           SymbolKind;           /* symbol kind */
  tags?:          SymbolTag[];          /* symbol tags */
  deprecated?:    boolean;              /* is deprecated */
  range:          Range;                /* symbol range */
  selectionRange: Range;                /* selection range */
  children?:      DocumentSymbol[];     /* child symbols */
}

export interface SymbolInformation {
  name:          string;     /* symbol name */
  kind:          SymbolKind; /* symbol kind */
  tags?:         SymbolTag[]; /* symbol tags */
  deprecated?:   boolean;    /* is deprecated */
  location:      Location;   /* symbol location */
  containerName?: string;    /* container name */
}

export enum SymbolKind {
  FILE          = 1,    /* file */
  MODULE        = 2,    /* module */
  NAMESPACE     = 3,    /* namespace */
  PACKAGE       = 4,    /* package */
  CLASS         = 5,    /* class */
  METHOD        = 6,    /* method */
  PROPERTY      = 7,    /* property */
  FIELD         = 8,    /* field */
  CONSTRUCTOR   = 9,    /* constructor */
  ENUM          = 10,   /* enumeration */
  INTERFACE     = 11,   /* interface */
  FUNCTION      = 12,   /* function */
  VARIABLE      = 13,   /* variable */
  CONSTANT      = 14,   /* constant */
  STRING        = 15,   /* string */
  NUMBER        = 16,   /* number */
  BOOLEAN       = 17,   /* boolean */
  ARRAY         = 18,   /* array */
  OBJECT        = 19,   /* object */
  KEY           = 20,   /* key */
  NULL          = 21,   /* null value */
  ENUM_MEMBER   = 22,   /* enum member */
  STRUCT        = 23,   /* struct */
  EVENT         = 24,   /* event */
  OPERATOR      = 25,   /* operator */
  TYPE_PARAMETER = 26   /* type parameter */
}

export enum SymbolTag {
  DEPRECATED = 1        /* deprecated symbol */
}

/*
	====================================================================
             --- WORLDSRC EXTENSIONS ---
	====================================================================
*/

export interface WorldSrcCompletionData {
  languageMode:    WorldSrcLanguageMode;    /* current language mode */
  semanticContext: WorldSrcSemanticContext; /* semantic context */
  engineContext?:  WorldSrcEngineContext;   /* engine-specific context */
}

export enum WorldSrcLanguageMode {
  C_MODE          = "c",         /* C language mode */
  CPP_MODE        = "cpp",       /* C++ language mode */
  TYPESCRIPT_MODE = "typescript", /* TypeScript mode */
  MIXED_MODE      = "mixed"      /* mixed language mode */
}

export interface WorldSrcSemanticContext {
  currentScope:     string;                /* current scope */
  availableSymbols: WorldSrcSymbolInfo[];  /* available symbols */
  currentClass?:    string;                /* current class context */
  currentFunction?: string;                /* current function context */
  includes:         string[];              /* included headers/modules */
}

export interface WorldSrcSymbolInfo {
  name:           string;                  /* symbol name */
  type:           string;                  /* symbol type */
  kind:           WorldSrcSymbolKind;      /* symbol kind */
  languageOrigin: WorldSrcLanguageMode;    /* originating language */
  documentation?: string;                  /* symbol documentation */
  signature?:     string;                  /* function signature */
  memberOf?:      string;                  /* parent class/namespace */
}

export enum WorldSrcSymbolKind {
  C_FUNCTION       = "c_function",       /* C function */
  CPP_CLASS        = "cpp_class",        /* C++ class */
  CPP_METHOD       = "cpp_method",       /* C++ method */
  TS_INTERFACE     = "ts_interface",     /* TypeScript interface */
  TS_TYPE          = "ts_type",          /* TypeScript type */
  GAME_ENTITY      = "game_entity",      /* game entity */
  GAME_COMPONENT   = "game_component",   /* game component */
  GAME_SYSTEM      = "game_system",      /* game system */
  ENGINE_API       = "engine_api",       /* engine API */
  STDLIB_FUNCTION  = "stdlib_function"   /* standard library */
}

export interface WorldSrcEngineContext {
  currentScene?:     string;               /* current scene */
  availableEntities: string[];             /* available entities */
  availableComponents: string[];           /* available components */
  engineVersion:     string;               /* engine version */
}

export interface WorldSrcDiagnosticData {
  compilationTarget?: string;              /* target language */
  errorCategory:      WorldSrcErrorCategory; /* error category */
  suggestions?:       string[];            /* fix suggestions */
  relatedFiles?:      string[];            /* related files */
}

export enum WorldSrcErrorCategory {
  SYNTAX_ERROR      = "syntax",      /* syntax error */
  TYPE_ERROR        = "type",        /* type mismatch */
  SEMANTIC_ERROR    = "semantic",    /* semantic error */
  COMPILATION_ERROR = "compilation", /* compilation error */
  ENGINE_ERROR      = "engine",      /* engine-specific error */
  PERFORMANCE_WARNING = "performance" /* performance warning */
}

/*
	====================================================================
             --- SERVER CAPABILITIES ---
	====================================================================
*/

export interface WorldSrcServerCapabilities {
  textDocumentSync?:           TextDocumentSyncOptions;     /* document sync */
  completionProvider?:         CompletionOptions;           /* completion */
  hoverProvider?:              boolean | HoverOptions;      /* hover support */
  signatureHelpProvider?:      SignatureHelpOptions;        /* signature help */
  definitionProvider?:         boolean | DefinitionOptions; /* go to definition */
  referencesProvider?:         boolean | ReferenceOptions;  /* find references */
  documentSymbolProvider?:     boolean | DocumentSymbolOptions; /* document symbols */
  workspaceSymbolProvider?:    boolean | WorkspaceSymbolOptions; /* workspace symbols */
  codeActionProvider?:         boolean | CodeActionOptions; /* code actions */
  documentFormattingProvider?: boolean | DocumentFormattingOptions; /* formatting */
  renameProvider?:             boolean | RenameOptions;     /* rename support */
  worldSrcExtensions?:         WorldSrcExtensionCapabilities; /* WORLDSRC extensions */
}

export interface TextDocumentSyncOptions {
  openClose?: boolean;         /* open/close notifications */
  change?:    TextDocumentSyncKind; /* change notifications */
  save?:      boolean | SaveOptions; /* save notifications */
}

export enum TextDocumentSyncKind {
  NONE        = 0,             /* no sync */
  FULL        = 1,             /* full document */
  INCREMENTAL = 2              /* incremental changes */
}

export interface SaveOptions {
  includeText?: boolean;       /* include text in save */
}

export interface CompletionOptions {
  triggerCharacters?:   string[];          /* trigger characters */
  allCommitCharacters?: string[];          /* commit characters */
  resolveProvider?:     boolean;           /* resolve support */
  completionItem?:      CompletionItemOptions; /* completion item options */
}

export interface CompletionItemOptions {
  labelDetailsSupport?: boolean;           /* label details support */
}

export interface HoverOptions {
  workDoneProgress?: boolean;              /* work done progress */
}

export interface SignatureHelpOptions {
  triggerCharacters?:   string[];          /* trigger characters */
  retriggerCharacters?: string[];          /* retrigger characters */
  workDoneProgress?:    boolean;           /* work done progress */
}

export interface DefinitionOptions {
  workDoneProgress?: boolean;              /* work done progress */
}

export interface ReferenceOptions {
  workDoneProgress?: boolean;              /* work done progress */
}

export interface DocumentSymbolOptions {
  workDoneProgress?: boolean;              /* work done progress */
  label?:            string;               /* provider label */
}

export interface WorkspaceSymbolOptions {
  workDoneProgress?: boolean;              /* work done progress */
  resolveProvider?:  boolean;              /* resolve support */
}

export interface CodeActionOptions {
  codeActionKinds?:  CodeActionKind[];     /* supported kinds */
  resolveProvider?:  boolean;              /* resolve support */
  workDoneProgress?: boolean;              /* work done progress */
}

export enum CodeActionKind {
  EMPTY                    = "",
  QUICK_FIX               = "quickfix",
  REFACTOR                = "refactor",
  REFACTOR_EXTRACT        = "refactor.extract",
  REFACTOR_INLINE         = "refactor.inline",
  REFACTOR_REWRITE        = "refactor.rewrite",
  SOURCE                  = "source",
  SOURCE_ORGANIZE_IMPORTS = "source.organizeImports"
}

export interface DocumentFormattingOptions {
  workDoneProgress?: boolean;              /* work done progress */
}

export interface RenameOptions {
  prepareProvider?:  boolean;              /* prepare support */
  workDoneProgress?: boolean;              /* work done progress */
}

export interface WorldSrcExtensionCapabilities {
  multiLanguageSupport:    boolean;        /* multi-language support */
  realtimeCompilation:     boolean;        /* real-time compilation */
  engineIntegration:       boolean;        /* engine integration */
  performanceAnalysis:     boolean;        /* performance analysis */
  debuggingSupport:        boolean;        /* debugging support */
  codeGeneration:          boolean;        /* code generation */
  targetSpecificFeatures:  boolean;        /* target-specific features */
}

/*
	====================================================================
             --- REQUEST/RESPONSE TYPES ---
	====================================================================
*/

export interface LSPRequest {
  jsonrpc: "2.0";          /* JSON-RPC version */
  id:      number | string; /* request ID */
  method:  string;         /* method name */
  params?: any;            /* method parameters */
}

export interface LSPResponse {
  jsonrpc: "2.0";          /* JSON-RPC version */
  id:      number | string | null; /* request ID */
  result?: any;            /* response result */
  error?:  LSPError;       /* error information */
}

export interface LSPNotification {
  jsonrpc: "2.0";          /* JSON-RPC version */
  method:  string;         /* method name */
  params?: any;            /* method parameters */
}

export interface LSPError {
  code:    number;         /* error code */
  message: string;         /* error message */
  data?:   any;            /* additional data */
}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
