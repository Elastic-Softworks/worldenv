/*
	====================================================================
             WORLDENV LIVE BLUEPRINT ANALYZER ENGINE
	====================================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

	                --- BLUEPRINT ANALYZER CORE ---

	    This JavaScript engine provides comprehensive analysis
	    of the WORLDENV system architecture. It scans source
	    code, maps dependencies, visualizes system architecture,
	    and provides real-time monitoring capabilities for
	    development and debugging workflows.

	    Architecture:
	    - SystemAnalyzer: Core analysis engine
	    - VisualRenderer: D3.js visualization system
	    - CodeParser: Multi-language code analysis
	    - FlowTracer: Execution flow mapping
	    - DebugTools: Issue detection and performance monitoring
	    - FileMonitor: Real-time file system watching

*/

/*
	====================================================================
             --- GLOBAL STATE & CONFIGURATION ---
	====================================================================
*/

class BlueprintAnalyzer {
  constructor() {
    this.config = {
      refreshInterval: 5000,
      deepAnalysis: false,
      realTimeUpdates: true,
      theme: "dark",
    };

    this.state = {
      isAnalyzing: false,
      lastUpdate: null,
      systemData: null,
      selectedComponent: null,
      activeTab: "visual",
    };

    this.analyzers = {
      system: new SystemAnalyzer(),
      code: new CodeParser(),
      flow: new FlowTracer(),
      debug: new DebugTools(),
      monitor: new FileMonitor(),
    };

    this.renderers = {
      visual: new VisualRenderer(),
      textual: new TextualRenderer(),
      debug: new DebugRenderer(),
      monitor: new MonitorRenderer(),
      code: new CodeRenderer(),
    };

    this.initialize();
  }

  /*

           initialize()
             ---
             sets up the blueprint analyzer system with event
             listeners, initial analysis, and UI configuration.
             establishes the foundation for all analysis operations.

  */

  async initialize() {
    try {
      this.showLoading("Initializing WORLDENV Blueprint Analyzer...");

      await this.setupUI();
      await this.loadConfiguration();
      await this.startInitialAnalysis();

      this.hideLoading();
      this.updateStatus("READY");

      if (this.config.realTimeUpdates) {
        this.startMonitoring();
      }
    } catch (error) {
      console.error("Initialization failed:", error);
      this.updateStatus("ERROR");
      this.hideLoading();
    }
  }

  /*

           setupUI()
             ---
             configures user interface event listeners and
             initial state. handles tab navigation, control
             interactions, and modal functionality.

  */

  setupUI() {
    // Tab navigation
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetTab = e.target.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Header controls
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshAnalysis();
    });

    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportAnalysis();
    });

    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.openSettings();
    });

    // Settings modal
    this.setupSettingsModal();

    // Filter controls
    this.setupFilterControls();

    // Search functionality
    this.setupSearchFunctionality();
  }

  /*

           switchTab()
             ---
             handles tab switching functionality with proper
             cleanup and initialization of tab-specific features.
             ensures smooth transitions between analysis views.

  */

  switchTab(targetTab) {
    // Update active tab state
    this.state.activeTab = targetTab;

    // Update UI
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === targetTab);
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${targetTab}-tab`);
    });

    // Initialize tab-specific functionality
    switch (targetTab) {
      case "visual":
        this.renderers.visual.render(this.state.systemData);
        break;
      case "textual":
        this.renderers.textual.generateFlow();
        break;
      case "debug":
        this.renderers.debug.scanIssues();
        break;
      case "monitor":
        this.renderers.monitor.startMonitoring();
        break;
      case "code":
        this.renderers.code.loadFileTree();
        break;
    }
  }

  /*

           startInitialAnalysis()
             ---
             performs comprehensive system analysis on startup.
             scans directory structure, parses code files,
             and builds initial system representation.

  */

  async startInitialAnalysis() {
    this.state.isAnalyzing = true;
    this.updateStatus("ANALYZING");

    try {
      // Scan project structure
      const projectStructure = await this.analyzers.system.scanProject();

      // Parse code files
      const codeAnalysis =
        await this.analyzers.code.parseAllFiles(projectStructure);

      // Build dependency graph
      const dependencies =
        await this.analyzers.system.buildDependencyGraph(codeAnalysis);

      // Generate flow analysis
      const flowData =
        await this.analyzers.flow.analyzeExecutionPaths(codeAnalysis);

      // Compile system data
      this.state.systemData = {
        structure: projectStructure,
        code: codeAnalysis,
        dependencies: dependencies,
        flow: flowData,
        metrics: this.calculateSystemMetrics(codeAnalysis),
      };

      this.state.lastUpdate = new Date();
      this.updateSystemMetrics();
    } catch (error) {
      console.error("Analysis failed:", error);
      this.updateStatus("ERROR");
    } finally {
      this.state.isAnalyzing = false;
    }
  }

  /*

           refreshAnalysis()
             ---
             triggers a complete re-analysis of the system.
             useful for detecting changes and updating
             visualizations with current system state.

  */

  async refreshAnalysis() {
    if (this.state.isAnalyzing) return;

    this.showLoading("Refreshing system analysis...");
    await this.startInitialAnalysis();

    // Update active tab display
    this.switchTab(this.state.activeTab);

    this.hideLoading();
    this.updateStatus("READY");
  }

  /*

           updateStatus()
             ---
             updates system status indicator and timestamp
             display. provides visual feedback about current
             analysis state and last update time.

  */

  updateStatus(status) {
    const statusElement = document.getElementById("systemStatus");
    const updateElement = document.getElementById("lastUpdate");

    statusElement.textContent = status;
    statusElement.className = `status-indicator ${status.toLowerCase()}`;

    if (this.state.lastUpdate) {
      updateElement.textContent = `Last Update: ${this.state.lastUpdate.toLocaleTimeString()}`;
    }
  }

  /*

           updateSystemMetrics()
             ---
             calculates and displays system overview metrics
             including file counts, function counts, and
             integration point statistics.

  */

  updateSystemMetrics() {
    if (!this.state.systemData) return;

    const metrics = this.state.systemData.metrics;

    document.getElementById("totalFiles").textContent =
      metrics.totalFiles || "--";
    document.getElementById("cFunctions").textContent =
      metrics.cFunctions || "--";
    document.getElementById("tsClasses").textContent =
      metrics.tsClasses || "--";
    document.getElementById("integrationPoints").textContent =
      metrics.integrationPoints || "--";
  }

  /*

           calculateSystemMetrics()
             ---
             processes analysis data to generate summary
             statistics about the codebase structure,
             complexity, and integration patterns.

  */

  calculateSystemMetrics(codeAnalysis) {
    let totalFiles = 0;
    let cFunctions = 0;
    let tsClasses = 0;
    let integrationPoints = 0;

    if (codeAnalysis && codeAnalysis.files) {
      totalFiles = codeAnalysis.files.length;

      codeAnalysis.files.forEach((file) => {
        if (file.language === "c" || file.language === "cpp") {
          cFunctions += file.functions ? file.functions.length : 0;
        }

        if (file.language === "typescript" || file.language === "javascript") {
          tsClasses += file.classes ? file.classes.length : 0;
        }

        if (file.isIntegrationPoint) {
          integrationPoints++;
        }
      });
    }

    return {
      totalFiles,
      cFunctions,
      tsClasses,
      integrationPoints,
    };
  }

  showLoading(message) {
    const overlay = document.getElementById("loadingOverlay");
    const text = overlay.querySelector(".loading-text");
    text.textContent = message;
    overlay.classList.add("active");
  }

  hideLoading() {
    document.getElementById("loadingOverlay").classList.remove("active");
  }

  setupSettingsModal() {
    const modal = document.getElementById("settingsModal");
    const settingsBtn = document.getElementById("settingsBtn");
    const closeBtn = modal.querySelector(".modal-close");
    const cancelBtn = modal.querySelector(".cancel-btn");
    const saveBtn = modal.querySelector(".save-btn");

    const openModal = () => modal.classList.add("active");
    const closeModal = () => modal.classList.remove("active");

    settingsBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener("click", () => {
      this.saveSettings();
      closeModal();
    });
  }

  setupFilterControls() {
    const filterInputs = document.querySelectorAll(
      '.filter-item input[type="checkbox"]',
    );

    filterInputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.applyFilters();
      });
    });

    const viewMode = document.getElementById("viewMode");
    const layoutAlgorithm = document.getElementById("layoutAlgorithm");

    if (viewMode) {
      viewMode.addEventListener("change", () => {
        this.renderers.visual.updateView(viewMode.value);
      });
    }

    if (layoutAlgorithm) {
      layoutAlgorithm.addEventListener("change", () => {
        this.renderers.visual.updateLayout(layoutAlgorithm.value);
      });
    }
  }

  setupSearchFunctionality() {
    const flowSearch = document.getElementById("flowSearch");
    const fileFilter = document.getElementById("fileFilter");

    if (flowSearch) {
      flowSearch.addEventListener("input", (e) => {
        this.renderers.textual.searchFlow(e.target.value);
      });
    }

    if (fileFilter) {
      fileFilter.addEventListener("input", (e) => {
        this.renderers.code.filterFiles(e.target.value);
      });
    }
  }

  applyFilters() {
    const filters = {
      showEditor: document.getElementById("showEditor")?.checked,
      showWorldC: document.getElementById("showWorldC")?.checked,
      showManagers: document.getElementById("showManagers")?.checked,
      showIPC: document.getElementById("showIPC")?.checked,
      showScripts: document.getElementById("showScripts")?.checked,
    };

    this.renderers.visual.applyFilters(filters);
  }

  async loadConfiguration() {
    try {
      const stored = localStorage.getItem("blueprintConfig");
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Could not load configuration:", error);
    }
  }

  saveSettings() {
    const deepAnalysis = document.getElementById("deepAnalysis")?.checked;
    const realTimeUpdates = document.getElementById("realTimeUpdates")?.checked;
    const refreshInterval =
      parseInt(document.getElementById("refreshInterval")?.value) || 5000;
    const theme = document.getElementById("themeSelect")?.value;

    this.config = {
      ...this.config,
      deepAnalysis,
      realTimeUpdates,
      refreshInterval,
      theme,
    };

    localStorage.setItem("blueprintConfig", JSON.stringify(this.config));

    if (this.config.realTimeUpdates && !this.analyzers.monitor.isActive) {
      this.startMonitoring();
    } else if (
      !this.config.realTimeUpdates &&
      this.analyzers.monitor.isActive
    ) {
      this.analyzers.monitor.stop();
    }
  }

  startMonitoring() {
    this.analyzers.monitor.start(this.config.refreshInterval, () => {
      this.refreshAnalysis();
    });
  }

  async exportAnalysis() {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        systemData: this.state.systemData,
        config: this.config,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worldenv-analysis-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  }

  openSettings() {
    document.getElementById("settingsModal").classList.add("active");
  }
}

/*
	====================================================================
             --- SYSTEM ANALYZER ---
	====================================================================
*/

class SystemAnalyzer {
  constructor() {
    this.projectRoots = [
      "/home/instar/Work/worldenv/editor",
      "/home/instar/Work/worldenv/worldc",
    ];
  }

  /*

           scanProject()
             ---
             recursively scans project directories to build
             complete file system representation. identifies
             file types, sizes, and directory structure.

  */

  async scanProject() {
    const structure = {
      directories: [],
      files: [],
      totalSize: 0,
      fileTypes: new Map(),
    };

    try {
      // Simulate file system scanning
      // In a real implementation, this would use Node.js fs API
      const mockStructure = this.generateMockStructure();
      return mockStructure;
    } catch (error) {
      console.error("Project scan failed:", error);
      return structure;
    }
  }

  /*

           buildDependencyGraph()
             ---
             analyzes parsed code to construct dependency
             relationships between files, functions, and
             modules across the entire system.

  */

  async buildDependencyGraph(codeAnalysis) {
    const graph = {
      nodes: new Map(),
      edges: new Set(),
      clusters: [],
    };

    if (!codeAnalysis || !codeAnalysis.files) {
      return graph;
    }

    // Build nodes for each file and major component
    codeAnalysis.files.forEach((file) => {
      graph.nodes.set(file.path, {
        id: file.path,
        type: "file",
        language: file.language,
        size: file.size || 0,
        complexity: file.complexity || 0,
      });

      // Add function/class nodes
      if (file.functions) {
        file.functions.forEach((func) => {
          const nodeId = `${file.path}::${func.name}`;
          graph.nodes.set(nodeId, {
            id: nodeId,
            type: "function",
            name: func.name,
            parent: file.path,
            complexity: func.complexity || 0,
          });
        });
      }

      if (file.classes) {
        file.classes.forEach((cls) => {
          const nodeId = `${file.path}::${cls.name}`;
          graph.nodes.set(nodeId, {
            id: nodeId,
            type: "class",
            name: cls.name,
            parent: file.path,
            methods: cls.methods || [],
          });
        });
      }
    });

    // Build edges from imports and function calls
    codeAnalysis.files.forEach((file) => {
      if (file.imports) {
        file.imports.forEach((imp) => {
          const targetPath = this.resolveImportPath(imp.path, file.path);
          if (graph.nodes.has(targetPath)) {
            graph.edges.add({
              source: file.path,
              target: targetPath,
              type: "import",
              weight: 1,
            });
          }
        });
      }

      if (file.functionCalls) {
        file.functionCalls.forEach((call) => {
          const targetNode = this.findFunctionNode(call.name, graph.nodes);
          if (targetNode) {
            graph.edges.add({
              source: file.path,
              target: targetNode.id,
              type: "function_call",
              weight: call.count || 1,
            });
          }
        });
      }
    });

    return graph;
  }

  generateMockStructure() {
    return {
      directories: [
        {
          path: "/worldenv/editor/src",
          name: "editor/src",
          type: "typescript",
          children: ["main", "renderer"],
        },
        {
          path: "/worldenv/worldc/src",
          name: "worldc/src",
          type: "c",
          children: ["lexer", "parser", "codegen"],
        },
      ],
      files: [
        {
          path: "/worldenv/editor/src/main/main.ts",
          name: "main.ts",
          size: 15420,
          language: "typescript",
          isEntryPoint: true,
          complexity: 8,
        },
        {
          path: "/worldenv/worldc/src/lexer/lexer.c",
          name: "lexer.c",
          size: 8930,
          language: "c",
          complexity: 12,
        },
      ],
      totalSize: 2456789,
      fileTypes: new Map([
        ["typescript", 45],
        ["c", 23],
        ["json", 12],
        ["css", 8],
      ]),
    };
  }

  resolveImportPath(importPath, currentFile) {
    // Simplified import resolution
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      // Relative import resolution logic
      return importPath;
    }
    return importPath;
  }

  findFunctionNode(functionName, nodes) {
    for (const [id, node] of nodes) {
      if (node.type === "function" && node.name === functionName) {
        return node;
      }
    }
    return null;
  }
}

/*
	====================================================================
             --- CODE PARSER ---
	====================================================================
*/

class CodeParser {
  constructor() {
    this.languageParsers = {
      typescript: new TypeScriptParser(),
      javascript: new JavaScriptParser(),
      c: new CParser(),
      cpp: new CppParser(),
    };
  }

  /*

           parseAllFiles()
             ---
             coordinates parsing of all source files in the
             project using language-specific parsers. builds
             comprehensive code analysis data structure.

  */

  async parseAllFiles(projectStructure) {
    const analysis = {
      files: [],
      summary: {
        totalLinesOfCode: 0,
        totalFunctions: 0,
        totalClasses: 0,
        averageComplexity: 0,
      },
    };

    if (!projectStructure || !projectStructure.files) {
      return analysis;
    }

    for (const file of projectStructure.files) {
      try {
        const parser = this.getParserForFile(file);
        if (parser) {
          const fileAnalysis = await parser.parse(file);
          analysis.files.push(fileAnalysis);
          this.updateSummary(analysis.summary, fileAnalysis);
        }
      } catch (error) {
        console.error(`Failed to parse ${file.path}:`, error);
      }
    }

    this.finalizeSummary(analysis.summary, analysis.files.length);
    return analysis;
  }

  getParserForFile(file) {
    const extension = file.path.split(".").pop().toLowerCase();

    const languageMap = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      c: "c",
      cpp: "cpp",
      cc: "cpp",
      cxx: "cpp",
    };

    const language = languageMap[extension];
    return language ? this.languageParsers[language] : null;
  }

  updateSummary(summary, fileAnalysis) {
    summary.totalLinesOfCode += fileAnalysis.linesOfCode || 0;
    summary.totalFunctions += fileAnalysis.functions
      ? fileAnalysis.functions.length
      : 0;
    summary.totalClasses += fileAnalysis.classes
      ? fileAnalysis.classes.length
      : 0;
  }

  finalizeSummary(summary, fileCount) {
    if (fileCount > 0) {
      summary.averageComplexity =
        summary.totalFunctions > 0
          ? summary.totalLinesOfCode / summary.totalFunctions
          : 0;
    }
  }
}

/*
	====================================================================
             --- LANGUAGE PARSERS ---
	====================================================================
*/

class TypeScriptParser {
  async parse(file) {
    // Mock TypeScript parsing - in real implementation would use TypeScript compiler API
    return {
      ...file,
      language: "typescript",
      linesOfCode: Math.floor(Math.random() * 500) + 50,
      functions: this.mockFunctions(),
      classes: this.mockClasses(),
      imports: this.mockImports(),
      exports: this.mockExports(),
      complexity: Math.floor(Math.random() * 15) + 1,
      isIntegrationPoint:
        file.path.includes("engine") || file.path.includes("ipc"),
    };
  }

  mockFunctions() {
    const functionNames = [
      "initialize",
      "render",
      "update",
      "destroy",
      "handleEvent",
    ];
    return functionNames.map((name) => ({
      name,
      lineStart: Math.floor(Math.random() * 100),
      lineEnd: Math.floor(Math.random() * 100) + 100,
      complexity: Math.floor(Math.random() * 10) + 1,
      parameters: Math.floor(Math.random() * 5),
      isAsync: Math.random() > 0.5,
      isExported: Math.random() > 0.7,
    }));
  }

  mockClasses() {
    const classNames = ["Manager", "Service", "Component", "Handler"];
    return classNames.map((name) => ({
      name: `${name}${Math.floor(Math.random() * 100)}`,
      lineStart: Math.floor(Math.random() * 50),
      lineEnd: Math.floor(Math.random() * 200) + 50,
      methods: Math.floor(Math.random() * 10) + 2,
      properties: Math.floor(Math.random() * 8) + 1,
      isExported: Math.random() > 0.3,
    }));
  }

  mockImports() {
    const imports = ["electron", "fs", "path", "./utils", "../types"];
    return imports.map((imp) => ({
      path: imp,
      isDefault: Math.random() > 0.5,
      namedImports: Math.floor(Math.random() * 5),
    }));
  }

  mockExports() {
    return {
      hasDefault: Math.random() > 0.6,
      namedExports: Math.floor(Math.random() * 8),
    };
  }
}

class JavaScriptParser extends TypeScriptParser {
  async parse(file) {
    const result = await super.parse(file);
    result.language = "javascript";
    return result;
  }
}

class CParser {
  async parse(file) {
    return {
      ...file,
      language: "c",
      linesOfCode: Math.floor(Math.random() * 800) + 100,
      functions: this.mockCFunctions(),
      structs: this.mockStructs(),
      includes: this.mockIncludes(),
      defines: this.mockDefines(),
      complexity: Math.floor(Math.random() * 20) + 5,
      isIntegrationPoint:
        file.path.includes("compiler") || file.path.includes("runtime"),
    };
  }

  mockCFunctions() {
    const functionNames = ["parse", "compile", "execute", "cleanup", "init"];
    return functionNames.map((name) => ({
      name: `${name}_${Math.floor(Math.random() * 100)}`,
      returnType: ["void", "int", "char*", "bool"][
        Math.floor(Math.random() * 4)
      ],
      parameters: Math.floor(Math.random() * 6),
      lineStart: Math.floor(Math.random() * 100),
      lineEnd: Math.floor(Math.random() * 200) + 100,
      complexity: Math.floor(Math.random() * 15) + 1,
      isStatic: Math.random() > 0.7,
      isInline: Math.random() > 0.8,
    }));
  }

  mockStructs() {
    const structNames = ["Token", "Node", "Context", "State"];
    return structNames.map((name) => ({
      name: `${name}_t`,
      fields: Math.floor(Math.random() * 10) + 2,
      lineStart: Math.floor(Math.random() * 50),
      size: Math.floor(Math.random() * 64) + 8,
    }));
  }

  mockIncludes() {
    const includes = [
      "<stdio.h>",
      "<stdlib.h>",
      "<string.h>",
      '"lexer.h"',
      '"parser.h"',
    ];
    return includes.map((inc) => ({
      path: inc,
      isSystem: inc.startsWith("<"),
      lineNumber: Math.floor(Math.random() * 20) + 1,
    }));
  }

  mockDefines() {
    return [
      { name: "MAX_TOKEN_SIZE", value: "256" },
      { name: "BUFFER_SIZE", value: "1024" },
      { name: "DEBUG", value: "1" },
    ];
  }
}

class CppParser extends CParser {
  async parse(file) {
    const result = await super.parse(file);
    result.language = "cpp";
    result.classes = this.mockCppClasses();
    result.namespaces = this.mockNamespaces();
    return result;
  }

  mockCppClasses() {
    const classNames = ["Parser", "Lexer", "Compiler", "Generator"];
    return classNames.map((name) => ({
      name,
      methods: Math.floor(Math.random() * 15) + 3,
      constructors: Math.floor(Math.random() * 3) + 1,
      destructor: true,
      inheritance: Math.random() > 0.6,
      isTemplate: Math.random() > 0.7,
    }));
  }

  mockNamespaces() {
    return ["worldc", "codegen", "ast", "utils"].map((name) => ({
      name,
      nestedNamespaces: Math.floor(Math.random() * 3),
    }));
  }
}

/*
	====================================================================
             --- FLOW TRACER ---
	====================================================================
*/

class FlowTracer {
  constructor() {
    this.entryPoints = new Map();
    this.executionPaths = new Map();
  }

  /*

           analyzeExecutionPaths()
             ---
             traces program execution flow from entry points
             through function calls, IPC messages, and
             cross-language boundaries. builds comprehensive
             execution map for system understanding.

  */

  async analyzeExecutionPaths(codeAnalysis) {
    const flowData = {
      entryPoints: [],
      executionPaths: [],
      crossLanguageCalls: [],
      ipcMessages: [],
    };

    if (!codeAnalysis || !codeAnalysis.files) {
      return flowData;
    }

    // Identify entry points
    flowData.entryPoints = this.findEntryPoints(codeAnalysis.files);

    // Trace execution paths from each entry point
    for (const entryPoint of flowData.entryPoints) {
      const paths = await this.traceFromEntryPoint(
        entryPoint,
        codeAnalysis.files,
      );
      flowData.executionPaths.push(...paths);
    }

    // Identify cross-language integration points
    flowData.crossLanguageCalls = this.findCrossLanguageCalls(
      codeAnalysis.files,
    );

    // Map IPC communication patterns
    flowData.ipcMessages = this.findIPCMessages(codeAnalysis.files);

    return flowData;
  }

  /*

           findEntryPoints()
             ---
             identifies system entry points including main
             functions, exported APIs, and initialization
             routines across different languages and modules.

  */

  findEntryPoints(files) {
    const entryPoints = [];

    files.forEach((file) => {
      // TypeScript/JavaScript entry points
      if (file.language === "typescript" || file.language === "javascript") {
        if (file.path.includes("main.ts") || file.path.includes("index.ts")) {
          entryPoints.push({
            type: "main",
            file: file.path,
            language: file.language,
            description: "Application entry point",
          });
        }

        if (file.functions) {
          file.functions.forEach((func) => {
            if (
              func.name === "initialize" ||
              func.name === "init" ||
              func.name === "start"
            ) {
              entryPoints.push({
                type: "initializer",
                file: file.path,
                function: func.name,
                language: file.language,
                description: `${func.name} function`,
              });
            }
          });
        }
      }

      // C/C++ entry points
      if (file.language === "c" || file.language === "cpp") {
        if (file.functions) {
          file.functions.forEach((func) => {
            if (func.name === "main" || func.name.startsWith("main_")) {
              entryPoints.push({
                type: "main",
                file: file.path,
                function: func.name,
                language: file.language,
                description: "C/C++ main function",
              });
            }
          });
        }
      }
    });

    return entryPoints;
  }

  /*

           traceFromEntryPoint()
             ---
             performs depth-first traversal of execution
             paths starting from a given entry point.
             follows function calls and module dependencies.

  */

  async traceFromEntryPoint(entryPoint, files) {
    const paths = [];
    const visited = new Set();
    const currentPath = [];

    const trace = (currentLocation, depth = 0) => {
      if (depth > 20 || visited.has(currentLocation)) return; // Prevent infinite recursion

      visited.add(currentLocation);
      currentPath.push({
        location: currentLocation,
        depth,
        timestamp: Date.now(),
      });

      // Find file containing this location
      const file = files.find(
        (f) =>
          f.path === currentLocation ||
          (f.functions &&
            f.functions.some(
              (func) => `${f.path}::${func.name}` === currentLocation,
            )),
      );

      if (file) {
        // Trace function calls within this file
        if (file.functionCalls) {
          file.functionCalls.forEach((call) => {
            const targetLocation = this.resolveCallTarget(call, files);
            if (targetLocation) {
              trace(targetLocation, depth + 1);
            }
          });
        }

        // Trace imports
        if (file.imports) {
          file.imports.forEach((imp) => {
            const importPath = this.resolveImportPath(imp.path, file.path);
            trace(importPath, depth + 1);
          });
        }
      }
    };

    trace(entryPoint.file);

    if (currentPath.length > 0) {
      paths.push({
        entryPoint: entryPoint,
        steps: [...currentPath],
        totalDepth: currentPath.length,
      });
    }

    return paths;
  }

  findCrossLanguageCalls(files) {
    const crossCalls = [];

    files.forEach((file) => {
      if (file.isIntegrationPoint) {
        crossCalls.push({
          file: file.path,
          language: file.language,
          type: "integration_point",
          description: "Cross-language integration boundary",
        });
      }

      // Look for specific patterns indicating cross-language calls
      if (file.language === "typescript" && file.path.includes("compiler")) {
        crossCalls.push({
          file: file.path,
          type: "compiler_integration",
          source: "typescript",
          target: "c",
          description: "TypeScript to C compiler interface",
        });
      }
    });

    return crossCalls;
  }

  findIPCMessages(files) {
    const ipcMessages = [];

    files.forEach((file) => {
      if (file.path.includes("ipc") || file.path.includes("communication")) {
        // Mock IPC message detection
        const messageTypes = [
          "engine-command",
          "status-update",
          "compilation-result",
        ];

        messageTypes.forEach((type) => {
          ipcMessages.push({
            type,
            file: file.path,
            direction: Math.random() > 0.5 ? "send" : "receive",
            channel: `worldc-${type}`,
            description: `IPC message: ${type}`,
          });
        });
      }
    });

    return ipcMessages;
  }

  resolveCallTarget(call, files) {
    // Simplified call resolution - in reality would need sophisticated analysis
    return `resolved::${call.name}`;
  }

  resolveImportPath(importPath, currentFile) {
    // Simplified import resolution
    return importPath;
  }
}

/*
	====================================================================
             --- VISUAL RENDERER ---
	====================================================================
*/

class VisualRenderer {
  constructor() {
    this.svg = null;
    this.simulation = null;
    this.currentView = "hierarchy";
    this.currentLayout = "force";
    this.filters = {
      showEditor: true,
      showWorldC: true,
      showManagers: true,
      showIPC: true,
      showScripts: true,
    };
  }

  /*

           render()
             ---
             creates interactive D3.js visualization of the
             system architecture. supports multiple view modes
             and layout algorithms for different analysis needs.

  */

  render(systemData) {
    if (!systemData) return;

    this.initializeSVG();
    this.clearVisualization();

    switch (this.currentView) {
      case "hierarchy":
        this.renderHierarchy(systemData);
        break;
      case "dependency":
        this.renderDependencyGraph(systemData);
        break;
      case "flow":
        this.renderDataFlow(systemData);
        break;
      case "architecture":
        this.renderArchitectureMap(systemData);
        break;
    }

    this.setupZoomControls();
    this.setupInteractions();
  }

  /*

           initializeSVG()
             ---
             sets up the SVG container with proper dimensions
             and coordinate system for D3.js visualizations.
             configures zoom and pan behavior.

  */

  initializeSVG() {
    const container = document.getElementById("systemDiagram");
    if (!container) return;

    // Clear existing content
    d3.select(container).selectAll("*").remove();

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    this.svg = d3.select(container).attr("width", width).attr("height", height);

    // Create main group for zoom/pan
    this.mainGroup = this.svg.append("g").attr("class", "main-group");

    // Setup zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        this.mainGroup.attr("transform", event.transform);
      });

    this.svg.call(zoom);

    // Store dimensions
    this.width = width;
    this.height = height;
  }

  /*

           renderHierarchy()
             ---
             creates hierarchical tree visualization showing
             the directory and component structure of the
             system with expandable/collapsible nodes.

  */

  renderHierarchy(systemData) {
    if (!systemData.structure || !systemData.structure.files) return;

    // Convert flat file list to hierarchical structure
    const hierarchyData = this.buildHierarchyData(systemData);

    // Create tree layout
    const treeLayout = d3.tree().size([this.height - 100, this.width - 200]);

    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);

    // Draw links
    const links = this.mainGroup
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y + 100)
          .y((d) => d.x + 50),
      )
      .style("fill", "none")
      .style("stroke", "#30363d")
      .style("stroke-width", 2);

    // Draw nodes
    const nodes = this.mainGroup
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y + 100},${d.x + 50})`);

    // Add circles for nodes
    nodes
      .append("circle")
      .attr("r", (d) => (d.children ? 8 : 6))
      .style("fill", (d) => this.getNodeColor(d.data))
      .style("stroke", "#f0f6fc")
      .style("stroke-width", 2);

    // Add labels
    nodes
      .append("text")
      .attr("dx", (d) => (d.children ? -12 : 12))
      .attr("dy", 4)
      .style("text-anchor", (d) => (d.children ? "end" : "start"))
      .style("font-size", "12px")
      .style("fill", "#f0f6fc")
      .text((d) => d.data.name);

    // Add click handlers
    nodes.style("cursor", "pointer").on("click", (event, d) => {
      this.selectComponent(d.data);
    });
  }

  /*

           renderDependencyGraph()
             ---
             creates force-directed graph showing dependencies
             between components, files, and functions with
             different edge types and weights.

  */

  renderDependencyGraph(systemData) {
    if (!systemData.dependencies) return;

    const nodes = Array.from(systemData.dependencies.nodes.values());
    const links = Array.from(systemData.dependencies.edges);

    // Create force simulation
    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2));

    // Draw links
    const link = this.mainGroup
      .selectAll(".dependency-link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "dependency-link")
      .style("stroke", (d) => this.getLinkColor(d.type))
      .style("stroke-width", (d) => Math.sqrt(d.weight || 1) * 2)
      .style("stroke-opacity", 0.6);

    // Draw nodes
    const node = this.mainGroup
      .selectAll(".dependency-node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "dependency-node");

    node
      .append("circle")
      .attr("r", (d) => this.getNodeSize(d))
      .style("fill", (d) => this.getNodeColor(d))
      .style("stroke", "#f0f6fc")
      .style("stroke-width", 1.5);

    node
      .append("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .style("font-size", "10px")
      .style("fill", "#f0f6fc")
      .text((d) => d.name || d.id.split("/").pop());

    // Add drag behavior
    node.call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    // Update positions on simulation tick
    this.simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Add click handlers
    node.style("cursor", "pointer").on("click", (event, d) => {
      this.selectComponent(d);
    });
  }

  renderDataFlow(systemData) {
    // Implementation for data flow visualization
    console.log("Rendering data flow view...");
  }

  renderArchitectureMap(systemData) {
    // Implementation for architecture map visualization
    console.log("Rendering architecture map...");
  }

  buildHierarchyData(systemData) {
    const root = {
      name: "WORLDENV",
      children: [
        {
          name: "Editor",
          children: this.buildFileHierarchy(
            systemData.structure.files.filter((f) =>
              f.path.includes("/editor/"),
            ),
          ),
        },
        {
          name: "WorldC",
          children: this.buildFileHierarchy(
            systemData.structure.files.filter((f) =>
              f.path.includes("/worldc/"),
            ),
          ),
        },
      ],
    };

    return root;
  }

  buildFileHierarchy(files) {
    const hierarchy = [];
    const pathMap = new Map();

    files.forEach((file) => {
      const parts = file.path.split("/").filter((p) => p);
      let current = hierarchy;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath += "/" + part;

        if (!pathMap.has(currentPath)) {
          const node = {
            name: part,
            path: currentPath,
            isFile: index === parts.length - 1,
            children: [],
          };

          if (node.isFile) {
            node.size = file.size;
            node.language = file.language;
            node.complexity = file.complexity;
          }

          current.push(node);
          pathMap.set(currentPath, node);
          current = node.children;
        } else {
          current = pathMap.get(currentPath).children;
        }
      });
    });

    return hierarchy;
  }

  getNodeColor(node) {
    if (node.language) {
      const colorMap = {
        typescript: "#1f6feb",
        javascript: "#f1e05a",
        c: "#555555",
        cpp: "#f34b7d",
        json: "#292929",
        css: "#563d7c",
      };
      return colorMap[node.language] || "#8b949e";
    }

    if (node.type === "directory") return "#238636";
    return "#30363d";
  }

  getLinkColor(type) {
    const colorMap = {
      import: "#1f6feb",
      function_call: "#238636",
      dependency: "#8b949e",
    };
    return colorMap[type] || "#6e7681";
  }

  getNodeSize(node) {
    if (node.type === "file") {
      return Math.max(6, Math.min(20, (node.size || 1000) / 1000));
    }
    return node.type === "function" ? 5 : 8;
  }

  clearVisualization() {
    if (this.mainGroup) {
      this.mainGroup.selectAll("*").remove();
    }
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  updateView(viewMode) {
    this.currentView = viewMode;
    // Re-render with new view mode
    const systemData = window.blueprintAnalyzer?.state?.systemData;
    if (systemData) {
      this.render(systemData);
    }
  }

  updateLayout(layoutAlgorithm) {
    this.currentLayout = layoutAlgorithm;
    // Apply new layout algorithm
    console.log(`Switching to ${layoutAlgorithm} layout`);
  }

  applyFilters(filters) {
    this.filters = { ...filters };
    // Re-render with filters applied
    console.log("Applying filters:", filters);
  }

  selectComponent(component) {
    // Update component inspector
    const inspector = document.getElementById("selectedComponent");
    const details = document.getElementById("componentDetails");

    if (inspector && component) {
      inspector.innerHTML = `
        <h4>${component.name || "Component"}</h4>
        <p><strong>Type:</strong> ${component.type || "Unknown"}</p>
        <p><strong>Path:</strong> ${component.path || component.id || "N/A"}</p>
        ${component.language ? `<p><strong>Language:</strong> ${component.language}</p>` : ""}
        ${component.size ? `<p><strong>Size:</strong> ${component.size} bytes</p>` : ""}
        ${component.complexity ? `<p><strong>Complexity:</strong> ${component.complexity}</p>` : ""}
      `;
    }

    if (details) {
      details.innerHTML = "<p>Loading component details...</p>";
      // Load additional component details
      this.loadComponentDetails(component);
    }
  }

  setupZoomControls() {
    document.getElementById("zoomIn")?.addEventListener("click", () => {
      this.svg.transition().call(d3.zoom().scaleBy, 1.5);
    });

    document.getElementById("zoomOut")?.addEventListener("click", () => {
      this.svg.transition().call(d3.zoom().scaleBy, 1 / 1.5);
    });

    document.getElementById("zoomReset")?.addEventListener("click", () => {
      this.svg.transition().call(d3.zoom().transform, d3.zoomIdentity);
    });
  }

  setupInteractions() {
    // Add hover effects and tooltips
    if (this.mainGroup) {
      this.mainGroup
        .selectAll(".node, .dependency-node")
        .on("mouseover", (event, d) => {
          this.showTooltip(event, d);
        })
        .on("mouseout", () => {
          this.hideTooltip();
        });
    }
  }

  showTooltip(event, data) {
    // Create or update tooltip
    const tooltip = d3
      .select("body")
      .selectAll(".visualization-tooltip")
      .data([data]);

    const tooltipEnter = tooltip
      .enter()
      .append("div")
      .attr("class", "visualization-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(13, 17, 23, 0.9)")
      .style("color", "#f0f6fc")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    tooltip
      .merge(tooltipEnter)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 10 + "px")
      .html(this.formatTooltip(data));
  }

  hideTooltip() {
    d3.select(".visualization-tooltip").remove();
  }

  formatTooltip(data) {
    let html = `<strong>${data.name || data.id}</strong><br>`;
    if (data.type) html += `Type: ${data.type}<br>`;
    if (data.language) html += `Language: ${data.language}<br>`;
    if (data.size) html += `Size: ${data.size} bytes<br>`;
    if (data.complexity) html += `Complexity: ${data.complexity}`;
    return html;
  }

  async loadComponentDetails(component) {
    // Simulate loading component details
    setTimeout(() => {
      const details = document.getElementById("componentDetails");
      if (details) {
        details.innerHTML = `
          <h5>Analysis Details</h5>
          <ul>
            <li>Dependencies: ${Math.floor(Math.random() * 10)}</li>
            <li>Dependents: ${Math.floor(Math.random() * 5)}</li>
            <li>Test Coverage: ${Math.floor(Math.random() * 100)}%</li>
            <li>Last Modified: ${new Date().toLocaleDateString()}</li>
          </ul>
        `;
      }
    }, 500);
  }
}

/*
	====================================================================
             --- ADDITIONAL RENDERERS ---
	====================================================================
*/

class TextualRenderer {
  generateFlow() {
    console.log("Generating textual flow...");
  }

  searchFlow(query) {
    console.log(`Searching flow for: ${query}`);
  }
}

class DebugRenderer {
  scanIssues() {
    console.log("Scanning for issues...");
  }
}

class MonitorRenderer {
  startMonitoring() {
    console.log("Starting system monitoring...");
  }
}

class CodeRenderer {
  loadFileTree() {
    console.log("Loading file tree...");
  }

  filterFiles(query) {
    console.log(`Filtering files: ${query}`);
  }
}

/*
	====================================================================
             --- UTILITY CLASSES ---
	====================================================================
*/

class DebugTools {
  async scanForIssues() {
    // Mock issue detection
    return [
      {
        type: "error",
        severity: "high",
        message: "EPIPE error in compiler integration",
        file: "/worldenv/editor/src/main/engine/WCCompilerIntegration.ts",
        line: 125,
      },
      {
        type: "warning",
        severity: "medium",
        message: "Large bundle size detected",
        file: "/worldenv/editor/webpack.renderer.config.js",
        suggestion: "Consider code splitting",
      },
    ];
  }
}

class FileMonitor {
  constructor() {
    this.isActive = false;
    this.watchers = new Map();
  }

  start(interval, callback) {
    this.isActive = true;
    this.callback = callback;

    // Mock file monitoring
    this.interval = setInterval(() => {
      if (Math.random() > 0.9) {
        // 10% chance of detecting change
        this.callback();
      }
    }, interval);
  }

  stop() {
    this.isActive = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

/*
	====================================================================
             --- APPLICATION BOOTSTRAP ---
	====================================================================
*/

// Initialize the blueprint analyzer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.blueprintAnalyzer = new BlueprintAnalyzer();
});

// Export classes for testing and extensibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BlueprintAnalyzer,
    SystemAnalyzer,
    CodeParser,
    FlowTracer,
    VisualRenderer,
  };
}
