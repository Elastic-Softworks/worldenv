/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             --- WORLDSRC TOOLING API ---
	====================================================================
*/

/*

         index.ts
	       ---
	       this file provides the main API and coordination layer for
	       the WORLDSRC advanced tooling system. it integrates the
	       language server, debugging infrastructure, real-time
	       compilation, and IDE integration components into a unified
	       development environment.

	       the API provides a simplified interface for editor plugins,
	       IDEs, and development tools to interact with the complete
	       WORLDSRC tooling ecosystem.

*/

import { EventEmitter } from 'events';

/* LSP components */
export { WorldSrcLanguageServer } from './lsp/language-server';
export {
  WorldSrcLanguageMode,
  WorldSrcServerCapabilities,
  WorldSrcSemanticContext,
  WorldSrcDiagnosticData,
  WorldSrcErrorCategory,
  TextDocumentSyncKind,
  MarkupKind,
  CompletionItemKind,
  DiagnosticSeverity,
} from './lsp/lsp-types';

/* debugging components */
export {
  WorldSrcDebugSession,
  WorldSrcDebugAdapter,
} from './debugging/debug-protocol';
export {
  StackFrame,
  Thread,
  Source,
  Scope,
  Variable,
  DebugProtocolMessage,
  DebugEvent,
  DebugRequest,
  DebugResponse,
  Breakpoint,
  SourceBreakpoint,
} from './debugging/debug-protocol';

/* real-time compilation */
export {
  RealtimeCompiler,
  CompilationCache,
} from './realtime/realtime-compiler';
export {
  RealtimeCompilationRequest,
  RealtimeCompilationResult,
  CompilationError,
  CompilationWarning,
  GeneratedFile,
  ErrorCategory,
  ErrorSeverity,
  WarningCategory,
} from './realtime/realtime-compiler';

/* IDE integration */
export { IDEIntegrationManager, WorkspaceManager } from './ide/ide-integration';
export * from './ide/ide-integration';

/*
	====================================================================
             --- TOOLING COORDINATOR ---
	====================================================================
*/

export interface ToolingConfiguration {
  workspaceRoot: string /* workspace root directory */;
  languageServer: LanguageServerConfig /* language server config */;
  debugging: DebuggingConfig /* debugging configuration */;
  realtimeCompiler: CompilerConfig /* compiler configuration */;
  ideIntegration: IDEConfig /* IDE integration config */;
  features: ToolingFeature[] /* enabled features */;
}

export interface LanguageServerConfig {
  enabled: boolean /* enable language server */;
  port: number /* server port */;
  host: string /* server host */;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' /* log level */;
  stdio: boolean /* use stdio transport */;
}

export interface DebuggingConfig {
  enabled: boolean /* enable debugging */;
  port: number /* debug adapter port */;
  sourceMaps: boolean /* enable source maps */;
  adapter: 'dap' | 'chrome' | 'node' /* debug adapter type */;
}

export interface CompilerConfig {
  enabled: boolean /* enable real-time compilation */;
  watchMode: boolean /* enable file watching */;
  debounceMs: number /* debounce delay */;
  targets: string[] /* compilation targets */;
  optimization: 'none' | 'basic' | 'aggressive' /* optimization level */;
}

export interface IDEConfig {
  enabled: boolean /* enable IDE integration */;
  autoDetect: boolean /* auto-detect editor */;
  supportedIDEs: string[] /* supported IDE list */;
  configGen: boolean /* generate config files */;
}

export enum ToolingFeature {
  LANGUAGE_SERVER = 'languageServer' /* language server protocol */,
  DEBUG_ADAPTER = 'debugAdapter' /* debug adapter protocol */,
  REALTIME_COMPILE = 'realtimeCompile' /* real-time compilation */,
  IDE_INTEGRATION = 'ideIntegration' /* IDE integration */,
  HOT_RELOAD = 'hotReload' /* hot reload support */,
  SOURCE_MAPS = 'sourceMaps' /* source map generation */,
  PERFORMANCE_ANALYSIS = 'performanceAnalysis' /* performance monitoring */,
  WORKSPACE_SYMBOLS = 'workspaceSymbols' /* workspace symbol indexing */,
  CODE_ACTIONS = 'codeActions' /* code action support */,
  REFACTORING = 'refactoring' /* refactoring tools */,
}

/*
	====================================================================
             --- MAIN TOOLING CLASS ---
	====================================================================
*/

export class WorldSrcTooling extends EventEmitter {
  private configuration: ToolingConfiguration;
  private languageServer: any; /* WorldSrcLanguageServer */
  private debugAdapter: any; /* WorldSrcDebugAdapter */
  private realtimeCompiler: any; /* RealtimeCompiler */
  private ideIntegration: any; /* IDEIntegrationManager */
  private isInitialized: boolean;
  private activeConnections: Map<string, ToolingConnection>;

  constructor(configuration: ToolingConfiguration) {
    super();

    this.configuration = configuration;
    this.isInitialized = false;
    this.activeConnections = new Map();

    this.validateConfiguration();
  }

  /*

           initialize()
  	       ---
  	       initializes the complete WORLDSRC tooling system.
  	       starts all enabled services and establishes
  	       communication channels for IDE integration.

  */

  async initialize(): Promise<ToolingInitResult> {
    const result: ToolingInitResult = {
      success: false,
      services: [],
      errors: [],
      startupTimeMs: 0,
      availableFeatures: [],
    };

    const startTime = Date.now();

    try {
      this.emit('initializationStarted', this.configuration);

      /* initialize language server */
      if (this.isFeatureEnabled(ToolingFeature.LANGUAGE_SERVER)) {
        await this.initializeLanguageServer();
        result.services.push('languageServer');
      }

      /* initialize debug adapter */
      if (this.isFeatureEnabled(ToolingFeature.DEBUG_ADAPTER)) {
        await this.initializeDebugAdapter();
        result.services.push('debugAdapter');
      }

      /* initialize real-time compiler */
      if (this.isFeatureEnabled(ToolingFeature.REALTIME_COMPILE)) {
        await this.initializeRealtimeCompiler();
        result.services.push('realtimeCompiler');
      }

      /* initialize IDE integration */
      if (this.isFeatureEnabled(ToolingFeature.IDE_INTEGRATION)) {
        await this.initializeIDEIntegration();
        result.services.push('ideIntegration');
      }

      this.setupCrossServiceCommunication();

      this.isInitialized = true;
      result.success = true;
      result.startupTimeMs = Date.now() - startTime;
      result.availableFeatures = this.configuration.features;

      this.emit('initializationComplete', result);
    } catch (error) {
      result.errors.push(error.message);
      result.startupTimeMs = Date.now() - startTime;

      this.emit('initializationFailed', { error, result });
    }

    return result;
  }

  /*

           shutdown()
  	       ---
  	       gracefully shuts down all tooling services and
  	       cleans up resources. ensures proper cleanup of
  	       file watchers, servers, and connections.

  */

  async shutdown(): Promise<void> {
    this.emit('shutdownStarted');

    try {
      /* shutdown in reverse order */
      if (this.ideIntegration) {
        await this.ideIntegration.shutdown?.();
      }

      if (this.realtimeCompiler) {
        this.realtimeCompiler.stopWatchingAll();
      }

      if (this.debugAdapter) {
        await this.debugAdapter.shutdown?.();
      }

      if (this.languageServer) {
        await this.languageServer.shutdown();
      }

      /* close all active connections */
      for (const connection of this.activeConnections.values()) {
        connection.close();
      }

      this.activeConnections.clear();
      this.isInitialized = false;

      this.emit('shutdownComplete');
    } catch (error) {
      this.emit('shutdownError', error);
    }
  }

  /*

           createConnection()
  	       ---
  	       creates a new tooling connection for an IDE or editor.
  	       establishes bidirectional communication and sets up
  	       event forwarding for real-time updates.

  */

  async createConnection(
    connectionId: string,
    connectionType: ConnectionType,
    options?: ConnectionOptions
  ): Promise<ToolingConnection> {
    if (!this.isInitialized) {
      throw new Error('Tooling system not initialized');
    }

    const connection = new ToolingConnection(
      connectionId,
      connectionType,
      this,
      options
    );

    await connection.initialize();

    this.activeConnections.set(connectionId, connection);

    this.emit('connectionCreated', {
      connectionId,
      connectionType,
      options,
    });

    return connection;
  }

  /*

           removeConnection()
  	       ---
  	       removes and cleans up a tooling connection.
  	       stops event forwarding and releases resources.

  */

  removeConnection(connectionId: string): void {
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      connection.close();
      this.activeConnections.delete(connectionId);

      this.emit('connectionRemoved', { connectionId });
    }
  }

  /*

           getServiceStatus()
  	       ---
  	       returns the current status of all tooling services.
  	       provides health information and operational metrics.

  */

  getServiceStatus(): ToolingStatus {
    return {
      initialized: this.isInitialized,
      configuration: this.configuration,
      services: {
        languageServer: this.getLanguageServerStatus(),
        debugAdapter: this.getDebugAdapterStatus(),
        realtimeCompiler: this.getRealtimeCompilerStatus(),
        ideIntegration: this.getIDEIntegrationStatus(),
      },
      connections: {
        active: this.activeConnections.size,
        list: Array.from(this.activeConnections.keys()),
      },
      uptime: this.isInitialized ? Date.now() - this.initTime : 0,
    };
  }

  /*

           updateConfiguration()
  	       ---
  	       updates the tooling configuration and restarts
  	       affected services. allows runtime reconfiguration
  	       without full system restart.

  */

  async updateConfiguration(
    newConfig: Partial<ToolingConfiguration>
  ): Promise<void> {
    const oldConfig = { ...this.configuration };

    this.configuration = { ...this.configuration, ...newConfig };

    this.emit('configurationUpdating', {
      oldConfig,
      newConfig: this.configuration,
    });

    /* restart affected services */
    await this.restartAffectedServices(oldConfig, this.configuration);

    this.emit('configurationUpdated', this.configuration);
  }

  /* service accessors for advanced usage */

  getLanguageServer(): any {
    return this.languageServer;
  }

  getDebugAdapter(): any {
    return this.debugAdapter;
  }

  getRealtimeCompiler(): any {
    return this.realtimeCompiler;
  }

  getIDEIntegration(): any {
    return this.ideIntegration;
  }

  /* private implementation methods */

  private validateConfiguration(): void {
    if (!this.configuration.workspaceRoot) {
      throw new Error('Workspace root is required');
    }

    if (this.configuration.features.length === 0) {
      throw new Error('At least one feature must be enabled');
    }
  }

  private isFeatureEnabled(feature: ToolingFeature): boolean {
    return this.configuration.features.includes(feature);
  }

  private async initializeLanguageServer(): Promise<void> {
    const { WorldSrcLanguageServer } = await import('./lsp/language-server');

    this.languageServer = new WorldSrcLanguageServer();

    /* setup language server event forwarding */
    this.languageServer.on('publishDiagnostics', (params: any) => {
      this.emit('diagnostics', params);
    });

    this.languageServer.on('initialized', () => {
      this.emit('languageServerReady');
    });

    await this.languageServer.initialize({
      workspaceRoot: this.configuration.workspaceRoot,
    });
  }

  private async initializeDebugAdapter(): Promise<void> {
    const { WorldSrcDebugAdapter } = await import('./debugging/debug-protocol');

    this.debugAdapter = new WorldSrcDebugAdapter();

    /* setup debug adapter event forwarding */
    this.debugAdapter.on('event', (event: any) => {
      this.emit('debugEvent', event);
    });
  }

  private async initializeRealtimeCompiler(): Promise<void> {
    const { RealtimeCompiler } = await import('./realtime/realtime-compiler');

    this.realtimeCompiler = new RealtimeCompiler();

    /* setup compiler event forwarding */
    this.realtimeCompiler.on('compilationComplete', (result: any) => {
      this.emit('compilationResult', result);
    });

    this.realtimeCompiler.on('realtimeFeedback', (feedback: any) => {
      this.emit('realtimeFeedback', feedback);
    });
  }

  private async initializeIDEIntegration(): Promise<void> {
    const { IDEIntegrationManager } = await import('./ide/ide-integration');

    this.ideIntegration = new IDEIntegrationManager(
      this.configuration.workspaceRoot
    );

    await this.ideIntegration.initialize();

    /* setup IDE integration event forwarding */
    this.ideIntegration.on('editorConnected', (connection: any) => {
      this.emit('editorConnected', connection);
    });

    this.ideIntegration.on('workspaceFileAdded', (file: any) => {
      this.emit('workspaceFileAdded', file);
    });
  }

  private setupCrossServiceCommunication(): void {
    /* language server <-> real-time compiler */
    if (this.languageServer && this.realtimeCompiler) {
      this.realtimeCompiler.on('compilationComplete', (result: any) => {
        /* forward compilation results to language server for diagnostics */
      });
    }

    /* debug adapter <-> real-time compiler */
    if (this.debugAdapter && this.realtimeCompiler) {
      /* setup source map sharing */
    }
  }

  private getLanguageServerStatus(): any {
    return this.languageServer
      ? {
          running: true,
          port: this.configuration.languageServer.port,
          clients: 0 /* would track connected clients */,
        }
      : { running: false };
  }

  private getDebugAdapterStatus(): any {
    return this.debugAdapter
      ? {
          running: true,
          port: this.configuration.debugging.port,
          sessions: 0 /* would track active debug sessions */,
        }
      : { running: false };
  }

  private getRealtimeCompilerStatus(): any {
    return this.realtimeCompiler
      ? this.realtimeCompiler.getCompilationStatus()
      : { running: false };
  }

  private getIDEIntegrationStatus(): any {
    return this.ideIntegration
      ? this.ideIntegration.getServiceStatus()
      : { running: false };
  }

  private async restartAffectedServices(
    oldConfig: ToolingConfiguration,
    newConfig: ToolingConfiguration
  ): Promise<void> {
    /* restart logic for configuration changes */
  }

  private initTime: number = Date.now();
}

/*
	====================================================================
             --- TOOLING CONNECTION ---
	====================================================================
*/

export enum ConnectionType {
  LSP_CLIENT = 'lsp_client' /* language server client */,
  DEBUG_CLIENT = 'debug_client' /* debug client */,
  IDE_PLUGIN = 'ide_plugin' /* IDE plugin */,
  CLI_TOOL = 'cli_tool' /* command-line tool */,
  WEB_CLIENT = 'web_client' /* web-based client */,
  CUSTOM = 'custom' /* custom integration */,
}

export interface ConnectionOptions {
  capabilities?: any /* client capabilities */;
  settings?: any /* connection settings */;
  filters?: string[] /* event filters */;
  debug?: boolean /* debug mode */;
}

export class ToolingConnection extends EventEmitter {
  private connectionId: string;
  private connectionType: ConnectionType;
  private tooling: WorldSrcTooling;
  private options: ConnectionOptions;
  private isActive: boolean;

  constructor(
    connectionId: string,
    connectionType: ConnectionType,
    tooling: WorldSrcTooling,
    options: ConnectionOptions = {}
  ) {
    super();

    this.connectionId = connectionId;
    this.connectionType = connectionType;
    this.tooling = tooling;
    this.options = options;
    this.isActive = false;
  }

  /*

           initialize()
  	       ---
  	       initializes the tooling connection and sets up
  	       event forwarding based on connection type and options.

  */

  async initialize(): Promise<void> {
    this.isActive = true;

    /* setup event forwarding based on connection type */
    this.setupEventForwarding();

    this.emit('connectionInitialized', {
      connectionId: this.connectionId,
      connectionType: this.connectionType,
      capabilities: this.options.capabilities,
    });
  }

  /*

           sendRequest()
  	       ---
  	       sends a request through the appropriate service
  	       and returns the response. handles routing to
  	       language server, debug adapter, etc.

  */

  async sendRequest(method: string, params: any): Promise<any> {
    if (!this.isActive) {
      throw new Error('Connection is not active');
    }

    switch (this.connectionType) {
      case ConnectionType.LSP_CLIENT:
        return this.handleLSPRequest(method, params);

      case ConnectionType.DEBUG_CLIENT:
        return this.handleDebugRequest(method, params);

      default:
        throw new Error(
          `Unsupported request for connection type: ${this.connectionType}`
        );
    }
  }

  /*

           close()
  	       ---
  	       closes the connection and cleans up resources.
  	       stops event forwarding and notifies the tooling system.

  */

  close(): void {
    this.isActive = false;
    this.removeAllListeners();

    this.emit('connectionClosed', {
      connectionId: this.connectionId,
    });
  }

  /* private implementation methods */

  private setupEventForwarding(): void {
    const filters = this.options.filters || [];

    /* forward all events if no filters specified */
    if (filters.length === 0) {
      this.tooling.on('diagnostics', (data) => {
        this.emit('diagnostics', data);
      });

      this.tooling.on('compilationResult', (data) => {
        this.emit('compilationResult', data);
      });

      this.tooling.on('realtimeFeedback', (data) => {
        this.emit('realtimeFeedback', data);
      });
    } else {
      /* filter events based on options */
      for (const filter of filters) {
        this.tooling.on(filter, (data) => {
          this.emit(filter, data);
        });
      }
    }
  }

  private async handleLSPRequest(method: string, params: any): Promise<any> {
    const languageServer = this.tooling.getLanguageServer();

    if (!languageServer) {
      throw new Error('Language server not available');
    }

    /* route to appropriate LSP method */
    switch (method) {
      case 'textDocument/completion':
        return languageServer.completion(params);

      case 'textDocument/hover':
        return languageServer.hover(params);

      case 'textDocument/definition':
        return languageServer.definition(params);

      default:
        throw new Error(`Unsupported LSP method: ${method}`);
    }
  }

  private async handleDebugRequest(method: string, params: any): Promise<any> {
    const debugAdapter = this.tooling.getDebugAdapter();

    if (!debugAdapter) {
      throw new Error('Debug adapter not available');
    }

    /* route to debug adapter */
    return debugAdapter.processMessage({
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params,
    });
  }
}

/*
	====================================================================
             --- SUPPORTING INTERFACES ---
	====================================================================
*/

export interface ToolingInitResult {
  success: boolean;
  services: string[];
  errors: string[];
  startupTimeMs: number;
  availableFeatures: ToolingFeature[];
}

export interface ToolingStatus {
  initialized: boolean;
  configuration: ToolingConfiguration;
  services: ServiceStatusMap;
  connections: ConnectionStatusMap;
  uptime: number;
}

export interface ServiceStatusMap {
  languageServer: any;
  debugAdapter: any;
  realtimeCompiler: any;
  ideIntegration: any;
}

export interface ConnectionStatusMap {
  active: number;
  list: string[];
}

/*
	====================================================================
             --- CONVENIENCE FUNCTIONS ---
	====================================================================
*/

/*

         createDefaultConfiguration()
	       ---
	       creates a default tooling configuration suitable for
	       most development scenarios. provides sensible defaults
	       for all services and features.

*/

export function createDefaultConfiguration(
  workspaceRoot: string
): ToolingConfiguration {
  return {
    workspaceRoot,

    languageServer: {
      enabled: true,
      port: 7000,
      host: 'localhost',
      logLevel: 'info',
      stdio: false,
    },

    debugging: {
      enabled: true,
      port: 9229,
      sourceMaps: true,
      adapter: 'dap',
    },

    realtimeCompiler: {
      enabled: true,
      watchMode: true,
      debounceMs: 300,
      targets: ['typescript', 'assemblyscript'],
      optimization: 'basic',
    },

    ideIntegration: {
      enabled: true,
      autoDetect: true,
      supportedIDEs: ['vscode', 'webstorm', 'vim'],
      configGen: true,
    },

    features: [
      ToolingFeature.LANGUAGE_SERVER,
      ToolingFeature.DEBUG_ADAPTER,
      ToolingFeature.REALTIME_COMPILE,
      ToolingFeature.IDE_INTEGRATION,
      ToolingFeature.HOT_RELOAD,
      ToolingFeature.SOURCE_MAPS,
      ToolingFeature.WORKSPACE_SYMBOLS,
      ToolingFeature.CODE_ACTIONS,
    ],
  };
}

/*

         createMinimalConfiguration()
	       ---
	       creates a minimal tooling configuration with only
	       essential features enabled. suitable for resource-
	       constrained environments or simple setups.

*/

export function createMinimalConfiguration(
  workspaceRoot: string
): ToolingConfiguration {
  return {
    workspaceRoot,

    languageServer: {
      enabled: true,
      port: 7000,
      host: 'localhost',
      logLevel: 'warn',
      stdio: true,
    },

    debugging: {
      enabled: false,
      port: 9229,
      sourceMaps: false,
      adapter: 'dap',
    },

    realtimeCompiler: {
      enabled: true,
      watchMode: false,
      debounceMs: 500,
      targets: ['typescript'],
      optimization: 'none',
    },

    ideIntegration: {
      enabled: false,
      autoDetect: false,
      supportedIDEs: [],
      configGen: false,
    },

    features: [ToolingFeature.LANGUAGE_SERVER, ToolingFeature.REALTIME_COMPILE],
  };
}

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
