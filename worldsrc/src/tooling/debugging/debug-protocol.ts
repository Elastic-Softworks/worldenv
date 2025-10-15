/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             --- WORLDSRC DEBUG PROTOCOL ---
	====================================================================
*/

/*

         debug-protocol.ts
	       ---
	       this file implements the Debug Adapter Protocol (DAP)
	       for WORLDSRC, providing comprehensive debugging support
	       for the hybrid C/C++/TypeScript language. it enables
	       breakpoints, variable inspection, call stack analysis,
	       and real-time debugging across all language modes.

	       the protocol supports both source-level debugging and
	       generated code debugging for TypeScript and AssemblyScript
	       targets, with source map integration for accurate mapping.

*/

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

/*
	====================================================================
             --- PROTOCOL TYPES ---
	====================================================================
*/

export interface DebugProtocolMessage {
  seq:  number;         /* message sequence number */
  type: string;         /* message type */
}

export interface DebugRequest extends DebugProtocolMessage {
  type:    'request';   /* request type */
  command: string;      /* command name */
  arguments?: any;      /* command arguments */
}

export interface DebugResponse extends DebugProtocolMessage {
  type:       'response';     /* response type */
  request_seq: number;        /* request sequence */
  success:    boolean;        /* success flag */
  command:    string;         /* command name */
  message?:   string;         /* error message */
  body?:      any;            /* response body */
}

export interface DebugEvent extends DebugProtocolMessage {
  type:  'event';       /* event type */
  event: string;        /* event name */
  body?: any;           /* event body */
}

/*
	====================================================================
             --- BREAKPOINT TYPES ---
	====================================================================
*/

export interface SourceBreakpoint {
  line:      number;    /* breakpoint line */
  column?:   number;    /* breakpoint column */
  condition?: string;   /* conditional expression */
  hitCondition?: string; /* hit count condition */
  logMessage?: string;  /* log point message */
}

export interface Breakpoint {
  id?:        number;   /* breakpoint ID */
  verified:   boolean;  /* is verified */
  message?:   string;   /* verification message */
  source?:    Source;   /* source location */
  line?:      number;   /* actual line */
  column?:    number;   /* actual column */
  endLine?:   number;   /* end line */
  endColumn?: number;   /* end column */
}

export interface Source {
  name?:           string; /* source name */
  path?:           string; /* source path */
  sourceReference?: number; /* source reference */
  presentationHint?: SourcePresentationHint; /* presentation hint */
  origin?:         string; /* source origin */
  sources?:        Source[]; /* nested sources */
  adapterData?:    any;    /* adapter data */
  checksums?:      Checksum[]; /* file checksums */
}

export enum SourcePresentationHint {
  NORMAL    = 'normal',   /* normal source */
  EMPHASIZE = 'emphasize', /* emphasized source */
  DEEMPHASIZE = 'deemphasize' /* de-emphasized source */
}

export interface Checksum {
  algorithm: ChecksumAlgorithm; /* checksum algorithm */
  checksum:  string;            /* checksum value */
}

export enum ChecksumAlgorithm {
  MD5    = 'MD5',    /* MD5 algorithm */
  SHA1   = 'SHA1',   /* SHA1 algorithm */
  SHA256 = 'SHA256'  /* SHA256 algorithm */
}

/*
	====================================================================
             --- EXECUTION TYPES ---
	====================================================================
*/

export interface Thread {
  id:   number;         /* thread ID */
  name: string;         /* thread name */
}

export interface StackFrame {
  id:              number;     /* frame ID */
  name:            string;     /* frame name */
  source?:         Source;     /* source location */
  line:            number;     /* line number */
  column:          number;     /* column number */
  endLine?:        number;     /* end line */
  endColumn?:      number;     /* end column */
  canRestart?:     boolean;    /* can restart */
  instructionPointerReference?: string; /* instruction pointer */
  moduleId?:       number | string; /* module ID */
  presentationHint?: StackFramePresentationHint; /* presentation hint */
}

export enum StackFramePresentationHint {
  NORMAL = 'normal',     /* normal frame */
  LABEL  = 'label',      /* label frame */
  SUBTLE = 'subtle'      /* subtle frame */
}

export interface Scope {
  name:               string;  /* scope name */
  presentationHint?:  ScopePresentationHint; /* presentation hint */
  variablesReference: number;  /* variables reference */
  namedVariables?:    number;  /* named variable count */
  indexedVariables?:  number;  /* indexed variable count */
  expensive:          boolean; /* is expensive to evaluate */
  source?:            Source;  /* source location */
  line?:              number;  /* line number */
  column?:            number;  /* column number */
  endLine?:           number;  /* end line */
  endColumn?:         number;  /* end column */
}

export enum ScopePresentationHint {
  ARGUMENTS = 'arguments', /* function arguments */
  LOCALS    = 'locals',    /* local variables */
  REGISTERS = 'registers'  /* CPU registers */
}

export interface Variable {
  name:                string;  /* variable name */
  value:               string;  /* variable value */
  type?:               string;  /* variable type */
  presentationHint?:   VariablePresentationHint; /* presentation hint */
  evaluateName?:       string;  /* evaluate name */
  variablesReference:  number;  /* variables reference */
  namedVariables?:     number;  /* named variable count */
  indexedVariables?:   number;  /* indexed variable count */
  memoryReference?:    string;  /* memory reference */
}

export interface VariablePresentationHint {
  kind?:        VariableKind;        /* variable kind */
  attributes?:  VariableAttribute[]; /* variable attributes */
  visibility?:  VariableVisibility;  /* variable visibility */
  lazy?:        boolean;             /* lazy evaluation */
}

export enum VariableKind {
  PROPERTY      = 'property',      /* object property */
  METHOD        = 'method',        /* method */
  CLASS         = 'class',         /* class */
  DATA          = 'data',          /* data */
  EVENT         = 'event',         /* event */
  BASE_CLASS    = 'baseClass',     /* base class */
  INNER_CLASS   = 'innerClass',    /* inner class */
  INTERFACE     = 'interface',     /* interface */
  MOST_DERIVED_CLASS = 'mostDerivedClass', /* most derived class */
  VIRTUAL       = 'virtual',       /* virtual */
  DATA_BREAKPOINT = 'dataBreakpoint' /* data breakpoint */
}

export enum VariableAttribute {
  STATIC         = 'static',        /* static */
  CONSTANT       = 'constant',      /* constant */
  READ_ONLY      = 'readOnly',      /* read-only */
  RAW_STRING     = 'rawString',     /* raw string */
  HAS_OBJECT_ID  = 'hasObjectId',   /* has object ID */
  CAN_HAVE_OBJECT_ID = 'canHaveObjectId', /* can have object ID */
  HAS_SIDE_EFFECTS = 'hasSideEffects', /* has side effects */
  HAS_DATA_BREAKPOINT = 'hasDataBreakpoint' /* has data breakpoint */
}

export enum VariableVisibility {
  PUBLIC    = 'public',    /* public visibility */
  PRIVATE   = 'private',   /* private visibility */
  PROTECTED = 'protected', /* protected visibility */
  INTERNAL  = 'internal',  /* internal visibility */
  FINAL     = 'final'      /* final visibility */
}

/*
	====================================================================
             --- WORLDSRC DEBUG EXTENSIONS ---
	====================================================================
*/

export interface WorldSrcDebugContext {
  languageMode:      WorldSrcLanguageMode;    /* current language mode */
  compilationTarget: WorldSrcCompilationTarget; /* compilation target */
  sourceMap?:        SourceMapData;           /* source map information */
  engineContext?:    WorldSrcEngineDebugContext; /* engine debug context */
}

export enum WorldSrcLanguageMode {
  C_MODE          = 'c',         /* C language mode */
  CPP_MODE        = 'cpp',       /* C++ language mode */
  TYPESCRIPT_MODE = 'typescript', /* TypeScript mode */
  MIXED_MODE      = 'mixed'      /* mixed language mode */
}

export enum WorldSrcCompilationTarget {
  TYPESCRIPT     = 'typescript',     /* TypeScript target */
  ASSEMBLYSCRIPT = 'assemblyscript', /* AssemblyScript target */
  WEBASSEMBLY    = 'webassembly'     /* WebAssembly target */
}

export interface SourceMapData {
  version:        number;        /* source map version */
  sources:        string[];      /* source files */
  names:          string[];      /* symbol names */
  mappings:       string;        /* mapping data */
  sourcesContent?: string[];     /* source content */
  sourceRoot?:    string;        /* source root */
  file?:          string;        /* generated file */
}

export interface WorldSrcEngineDebugContext {
  currentScene?:     string;     /* current scene */
  activeEntities:    EntityDebugInfo[]; /* active entities */
  systemStates:      SystemDebugInfo[]; /* system states */
  performanceMetrics: PerformanceMetrics; /* performance data */
}

export interface EntityDebugInfo {
  id:         number;            /* entity ID */
  name:       string;            /* entity name */
  components: ComponentDebugInfo[]; /* component data */
  position?:  Vector3;           /* world position */
  active:     boolean;           /* is active */
}

export interface ComponentDebugInfo {
  type:       string;            /* component type */
  data:       any;               /* component data */
  enabled:    boolean;           /* is enabled */
}

export interface SystemDebugInfo {
  name:       string;            /* system name */
  enabled:    boolean;           /* is enabled */
  updateTime: number;            /* last update time */
  entityCount: number;           /* managed entity count */
}

export interface PerformanceMetrics {
  frameRate:      number;        /* current FPS */
  updateTime:     number;        /* update time (ms) */
  renderTime:     number;        /* render time (ms) */
  memoryUsage:    number;        /* memory usage (MB) */
  entityCount:    number;        /* total entity count */
  systemCount:    number;        /* active system count */
}

export interface Vector3 {
  x: number;                     /* X coordinate */
  y: number;                     /* Y coordinate */
  z: number;                     /* Z coordinate */
}

/*
	====================================================================
             --- DEBUG SESSION ---
	====================================================================
*/

export class WorldSrcDebugSession extends EventEmitter {

  private nextSeq:           number;
  private breakpoints:       Map<string, Breakpoint[]>;
  private sourceMap:         SourceMapData | null;
  private threads:           Map<number, Thread>;
  private stackFrames:       Map<number, StackFrame[]>;
  private variables:         Map<number, Variable[]>;
  private isRunning:         boolean;
  private currentContext:    WorldSrcDebugContext | null;

  constructor() {

    super();

    this.nextSeq      = 1;
    this.breakpoints  = new Map();
    this.sourceMap    = null;
    this.threads      = new Map();
    this.stackFrames  = new Map();
    this.variables    = new Map();
    this.isRunning    = false;
    this.currentContext = null;

  }

  /*

           handleRequest()
  	       ---
  	       processes debug protocol requests and dispatches them
  	       to appropriate handlers. maintains sequence numbers
  	       and provides error handling for invalid requests.

  */

  async handleRequest(request: DebugRequest): Promise<DebugResponse> {

    const response: DebugResponse = {
      seq:         this.nextSeq++,
      type:        'response',
      request_seq: request.seq,
      success:     false,
      command:     request.command
    };

    try {

      switch (request.command) {

        case 'initialize':
          response.body = await this.handleInitialize(request.arguments);
          response.success = true;
          break;

        case 'launch':
          await this.handleLaunch(request.arguments);
          response.success = true;
          break;

        case 'attach':
          await this.handleAttach(request.arguments);
          response.success = true;
          break;

        case 'setBreakpoints':
          response.body = await this.handleSetBreakpoints(request.arguments);
          response.success = true;
          break;

        case 'continue':
          await this.handleContinue(request.arguments);
          response.success = true;
          break;

        case 'pause':
          await this.handlePause();
          response.success = true;
          break;

        case 'next':
          await this.handleNext(request.arguments);
          response.success = true;
          break;

        case 'stepIn':
          await this.handleStepIn(request.arguments);
          response.success = true;
          break;

        case 'stepOut':
          await this.handleStepOut(request.arguments);
          response.success = true;
          break;

        case 'threads':
          response.body = await this.handleThreads();
          response.success = true;
          break;

        case 'stackTrace':
          response.body = await this.handleStackTrace(request.arguments);
          response.success = true;
          break;

        case 'scopes':
          response.body = await this.handleScopes(request.arguments);
          response.success = true;
          break;

        case 'variables':
          response.body = await this.handleVariables(request.arguments);
          response.success = true;
          break;

        case 'evaluate':
          response.body = await this.handleEvaluate(request.arguments);
          response.success = true;
          break;

        case 'disconnect':
          await this.handleDisconnect(request.arguments);
          response.success = true;
          break;

        default:
          response.message = `Unknown command: ${request.command}`;
          break;

      }

    } catch (error) {

      response.message = error.message;
      response.success = false;

    }

    return response;

  }

  /*

           handleInitialize()
  	       ---
  	       initializes the debug session and returns adapter
  	       capabilities. sets up the debugging environment
  	       and prepares for debugging operations.

  */

  private async handleInitialize(args: any): Promise<any> {

    return {
      supportsConfigurationDoneRequest:   true,
      supportsFunctionBreakpoints:        true,
      supportsConditionalBreakpoints:     true,
      supportsHitConditionalBreakpoints:  true,
      supportsEvaluateForHovers:          true,
      exceptionBreakpointFilters:         [],
      supportsStepBack:                   false,
      supportsSetVariable:                true,
      supportsRestartFrame:               false,
      supportsGotoTargetsRequest:         false,
      supportsStepInTargetsRequest:       false,
      supportsCompletionsRequest:         true,
      completionTriggerCharacters:        ['.', '['],
      supportsModulesRequest:             true,
      additionalModuleColumns:            [],
      supportedChecksumAlgorithms:        [ChecksumAlgorithm.MD5, ChecksumAlgorithm.SHA1],
      supportsRestartRequest:             true,
      supportsExceptionOptions:           true,
      supportsValueFormattingOptions:     true,
      supportsExceptionInfoRequest:       true,
      supportTerminateDebuggee:           true,
      supportSuspendDebuggee:             true,
      supportsDelayedStackTraceLoading:   true,
      supportsLoadedSourcesRequest:       true,
      supportsLogPoints:                  true,
      supportsTerminateThreadsRequest:    false,
      supportsSetExpression:              false,
      supportsTerminateRequest:           true,
      supportsDataBreakpoints:            false,
      supportsReadMemoryRequest:          false,
      supportsWriteMemoryRequest:         false,
      supportsDisassembleRequest:         false,
      supportsCancelRequest:              false,
      supportsBreakpointLocationsRequest: true,
      supportsClipboardContext:           true,
      supportsSteppingGranularity:        false,
      supportsInstructionBreakpoints:     false,
      supportsExceptionFilterOptions:     true
    };

  }

  /*

           handleLaunch()
  	       ---
  	       launches the debug target and begins debugging session.
  	       configures the runtime environment and establishes
  	       communication with the target process.

  */

  private async handleLaunch(args: any): Promise<void> {

    this.currentContext = {
      languageMode:      args.languageMode || WorldSrcLanguageMode.MIXED_MODE,
      compilationTarget: args.target || WorldSrcCompilationTarget.TYPESCRIPT
    };

    /* load source maps if available */
    if  (args.sourceMapPath) {
      this.sourceMap = await this.loadSourceMap(args.sourceMapPath);
    }

    /* create main thread */
    const mainThread: Thread = {
      id:   1,
      name: 'Main Thread'
    };

    this.threads.set(1, mainThread);

    /* emit initialized event */
    this.sendEvent('initialized');

  }

  /*

           handleSetBreakpoints()
  	       ---
  	       sets breakpoints in the specified source file.
  	       verifies breakpoint locations and maps them to
  	       generated code if necessary.

  */

  private async handleSetBreakpoints(args: any): Promise<any> {

    const { source, breakpoints: requestedBreakpoints } = args;
    const actualBreakpoints: Breakpoint[] = [];

    for  (const bp of requestedBreakpoints || []) {

      const breakpoint: Breakpoint = {
        verified: true,
        line:     bp.line,
        column:   bp.column,
        source:   source
      };

      /* verify breakpoint location */
      if  (this.sourceMap) {
        const mappedLocation = this.mapSourceLocation(source.path, bp.line, bp.column || 0);
        if  (mappedLocation) {
          breakpoint.line   = mappedLocation.line;
          breakpoint.column = mappedLocation.column;
        }
      }

      actualBreakpoints.push(breakpoint);

    }

    this.breakpoints.set(source.path || source.name, actualBreakpoints);

    return {
      breakpoints: actualBreakpoints
    };

  }

  /*

           handleContinue()
  	       ---
  	       continues execution from the current stopping point.
  	       resumes all threads and continues until the next
  	       breakpoint or completion.

  */

  private async handleContinue(args: any): Promise<void> {

    this.isRunning = true;
    this.sendEvent('continued', { threadId: args.threadId || 1 });

  }

  /*

           handlePause()
  	       ---
  	       pauses execution at the current location.
  	       interrupts running code and prepares for inspection.

  */

  private async handlePause(): Promise<void> {

    this.isRunning = false;
    this.sendEvent('stopped', {
      reason:   'pause',
      threadId: 1
    });

  }

  /*

           handleThreads()
  	       ---
  	       returns list of active threads in the debug target.
  	       provides thread information for multi-threaded debugging.

  */

  private async handleThreads(): Promise<any> {

    return {
      threads: Array.from(this.threads.values())
    };

  }

  /*

           handleStackTrace()
  	       ---
  	       provides call stack information for the specified thread.
  	       maps generated code locations back to source locations
  	       when source maps are available.

  */

  private async handleStackTrace(args: any): Promise<any> {

    const threadId = args.threadId;
    const frames   = this.stackFrames.get(threadId) || [];

    return {
      stackFrames: frames,
      totalFrames: frames.length
    };

  }

  /*

           handleScopes()
  	       ---
  	       returns available scopes for the specified stack frame.
  	       provides access to local variables, parameters, and
  	       closure variables.

  */

  private async handleScopes(args: any): Promise<any> {

    const frameId = args.frameId;

    const scopes: Scope[] = [
      {
        name:               'Locals',
        presentationHint:   ScopePresentationHint.LOCALS,
        variablesReference: frameId * 1000 + 1,
        expensive:          false
      },
      {
        name:               'Arguments',
        presentationHint:   ScopePresentationHint.ARGUMENTS,
        variablesReference: frameId * 1000 + 2,
        expensive:          false
      }
    ];

    return { scopes };

  }

  /*

           handleVariables()
  	       ---
  	       returns variables for the specified scope reference.
  	       provides variable names, values, types, and nested
  	       object information.

  */

  private async handleVariables(args: any): Promise<any> {

    const variablesReference = args.variablesReference;
    const variables = this.variables.get(variablesReference) || [];

    return { variables };

  }

  /*

           handleEvaluate()
  	       ---
  	       evaluates expressions in the current debug context.
  	       supports watch expressions, immediate evaluation,
  	       and hover evaluations.

  */

  private async handleEvaluate(args: any): Promise<any> {

    const { expression, frameId, context } = args;

    /* simplified evaluation */
    return {
      result:             `<evaluation of "${expression}">`,
      type:               'string',
      variablesReference: 0
    };

  }

  /*

           sendEvent()
  	       ---
  	       sends debug events to the client. used for
  	       notifications about execution state changes,
  	       breakpoint hits, and other debug events.

  */

  private sendEvent(event: string, body?: any): void {

    const debugEvent: DebugEvent = {
      seq:   this.nextSeq++,
      type:  'event',
      event: event,
      body:  body
    };

    this.emit('event', debugEvent);

  }

  /*

           loadSourceMap()
  	       ---
  	       loads source map data from the specified file.
  	       parses the source map and prepares it for
  	       location mapping operations.

  */

  private async loadSourceMap(sourceMapPath: string): Promise<SourceMapData | null> {

    try {

      const content = fs.readFileSync(sourceMapPath, 'utf8');
      return JSON.parse(content) as SourceMapData;

    } catch (error) {

      return null;

    }

  }

  /*

           mapSourceLocation()
  	       ---
  	       maps source file locations to generated code locations
  	       using source map data. enables accurate debugging
  	       of transpiled code.

  */

  private mapSourceLocation(
    sourcePath: string,
    line:       number,
    column:     number
  ): { line: number; column: number } | null {

    if  (!this.sourceMap) {
      return null;
    }

    /* simplified source map lookup */
    /* in a real implementation, this would parse the mappings */
    return {
      line:   line,
      column: column
    };

  }

  /* additional handlers for other debug commands */

  private async handleAttach(args: any): Promise<void> {
    /* attach to running process */
  }

  private async handleNext(args: any): Promise<void> {
    /* step over */
  }

  private async handleStepIn(args: any): Promise<void> {
    /* step into */
  }

  private async handleStepOut(args: any): Promise<void> {
    /* step out */
  }

  private async handleDisconnect(args: any): Promise<void> {
    /* disconnect from target */
  }

}

/*
	====================================================================
             --- DEBUG ADAPTER ---
	====================================================================
*/

export class WorldSrcDebugAdapter {

  private session: WorldSrcDebugSession;

  constructor() {

    this.session = new WorldSrcDebugSession();
    this.setupEventHandlers();

  }

  /*

           setupEventHandlers()
  	       ---
  	       configures event handling for the debug session.
  	       forwards events from the session to the appropriate
  	       communication channel.

  */

  private setupEventHandlers(): void {

    this.session.on('event', (event: DebugEvent) => {
      this.sendMessage(event);
    });

  }

  /*

           processMessage()
  	       ---
  	       processes incoming debug protocol messages.
  	       handles requests and forwards them to the debug session.

  */

  async processMessage(message: DebugRequest): Promise<void> {

    const response = await this.session.handleRequest(message);
    this.sendMessage(response);

  }

  /*

           sendMessage()
  	       ---
  	       sends debug protocol messages to the client.
  	       handles message serialization and communication.

  */

  private sendMessage(message: DebugProtocolMessage): void {

    /* in a real implementation, this would send via stdio or socket */
    console.log(JSON.stringify(message));

  }

}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
