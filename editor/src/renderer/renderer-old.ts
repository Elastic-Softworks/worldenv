/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Renderer Process Entry Point
 *
 * Initializes the editor UI and application state.
 * Handles renderer-side application lifecycle.
 */

import './styles/main.css';

/**
 * Application state
 */
interface EditorState {
  initialized: boolean;
  version: string;
  projectPath: string | null;
  projectOpen: boolean;
}

const state: EditorState = {
  initialized: false,
  version: '',
  projectPath: null,
  projectOpen: false
};

/**
 * initializeEditor()
 *
 * Initializes the editor application.
 * Sets up UI components and loads initial state.
 */
async function initializeEditor(): Promise<void> {
  try {
    state.version = await window.worldedit.app.getVersion();

    console.log(`[RENDERER] WORLDEDIT v${state.version} initializing...`);

    const root = document.getElementById('root');

    if (!root) {
      throw new Error('Root element not found');
    }

    buildUI(root);
    setupEventListeners();

    state.initialized = true;

    console.log('[RENDERER] Editor initialized successfully');
  } catch (error) {
    console.error('[RENDERER] Initialization failed:', error);

    const root = document.getElementById('root');

    if (root) {
      root.innerHTML = `
        <div class="error-screen">
          <h1>Initialization Error</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }
}

/**
 * buildUI()
 *
 * Builds the initial UI structure.
 */
function buildUI(root: HTMLElement): void {
  root.innerHTML = `
    <div class="editor-shell">
      <div class="title-bar">
        <span class="title">WORLDEDIT</span>
        <span class="version">v${state.version}</span>
        <span class="project-status" id="project-status">No Project</span>
      </div>
      <div class="editor-content">
        <div class="welcome-screen" id="welcome-screen">
          <h1>WORLDEDIT</h1>
          <p>Game Development Editor for WORLDENV Engine</p>
          <div class="button-group">
            <button class="btn btn-primary" id="btn-new-project">New Project</button>
            <button class="btn btn-primary" id="btn-open-project">Open Project</button>
          </div>
          <div class="phase-info">
            <h3>Phase 2: Basic Electron Application</h3>
            <p>Testing features:</p>
            <ul>
              <li>Window management and state persistence</li>
              <li>File system operations</li>
              <li>Dialog handlers</li>
              <li>Project management</li>
              <li>IPC communication</li>
              <li>Auto-save functionality</li>
            </ul>
          </div>
        </div>
        <div class="project-view" id="project-view" style="display: none;">
          <div class="toolbar">
            <button class="btn" id="btn-save-project">Save Project</button>
            <button class="btn" id="btn-close-project">Close Project</button>
            <button class="btn" id="btn-test-fs">Test FS</button>
          </div>
          <div class="project-info">
            <h2>Project Information</h2>
            <div id="project-details"></div>
          </div>
          <div class="test-area">
            <h3>Test Output</h3>
            <pre id="test-output"></pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * setupEventListeners()
 *
 * Sets up event listeners for UI interactions and IPC messages.
 */
function setupEventListeners(): void {
  const btnNewProject = document.getElementById('btn-new-project');
  const btnOpenProject = document.getElementById('btn-open-project');
  const btnSaveProject = document.getElementById('btn-save-project');
  const btnCloseProject = document.getElementById('btn-close-project');
  const btnTestFS = document.getElementById('btn-test-fs');

  if (btnNewProject) {
    btnNewProject.addEventListener('click', handleNewProject);
  }

  if (btnOpenProject) {
    btnOpenProject.addEventListener('click', handleOpenProject);
  }

  if (btnSaveProject) {
    btnSaveProject.addEventListener('click', handleSaveProject);
  }

  if (btnCloseProject) {
    btnCloseProject.addEventListener('click', handleCloseProject);
  }

  if (btnTestFS) {
    btnTestFS.addEventListener('click', handleTestFileSystem);
  }

  window.worldedit.on('project:opened', handleProjectOpened);
  window.worldedit.on('project:saved', handleProjectSaved);
  window.worldedit.on('project:closed', handleProjectClosed);
}

/**
 * handleNewProject()
 *
 * Handles new project creation.
 */
async function handleNewProject(): Promise<void> {
  try {
    logOutput('Creating new project...');

    const dirPath = await window.worldedit.dialog.openDirectory({
      title: 'Select Project Directory',
      properties: ['createDirectory']
    });

    if (!dirPath) {
      logOutput('Project creation canceled');
      return;
    }

    const projectName = dirPath.split('/').pop() || 'New Project';

    const project = await window.worldedit.project.create(dirPath, projectName);

    logOutput(`Project created: ${project.name}`);

    state.projectPath = dirPath;
    state.projectOpen = true;

    showProjectView(project);
  } catch (error) {
    logOutput(
      `Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    await window.worldedit.dialog.showError(
      'Project Creation Error',
      'Failed to create new project.'
    );
  }
}

/**
 * handleOpenProject()
 *
 * Handles project opening.
 */
async function handleOpenProject(): Promise<void> {
  try {
    logOutput('Opening project...');

    const dirPath = await window.worldedit.dialog.openDirectory({
      title: 'Open Project'
    });

    if (!dirPath) {
      logOutput('Project open canceled');
      return;
    }

    const project = await window.worldedit.project.open(dirPath);

    logOutput(`Project opened: ${project.name}`);

    state.projectPath = dirPath;
    state.projectOpen = true;

    showProjectView(project);
  } catch (error) {
    logOutput(`Error opening project: ${error instanceof Error ? error.message : 'Unknown error'}`);

    await window.worldedit.dialog.showError('Project Open Error', 'Failed to open project.');
  }
}

/**
 * handleSaveProject()
 *
 * Handles project saving.
 */
async function handleSaveProject(): Promise<void> {
  try {
    logOutput('Saving project...');

    await window.worldedit.project.save();

    logOutput('Project saved successfully');
  } catch (error) {
    logOutput(`Error saving project: ${error instanceof Error ? error.message : 'Unknown error'}`);

    await window.worldedit.dialog.showError('Save Error', 'Failed to save project.');
  }
}

/**
 * handleCloseProject()
 *
 * Handles project closing.
 */
async function handleCloseProject(): Promise<void> {
  try {
    const isModified = await window.worldedit.project.isModified();

    if (isModified) {
      const shouldSave = await window.worldedit.dialog.showConfirm(
        'Unsaved Changes',
        'Do you want to save changes before closing?'
      );

      if (shouldSave) {
        await window.worldedit.project.save();
      }
    }

    await window.worldedit.project.close();

    logOutput('Project closed');

    state.projectPath = null;
    state.projectOpen = false;

    showWelcomeScreen();
  } catch (error) {
    logOutput(`Error closing project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * handleTestFileSystem()
 *
 * Tests file system operations.
 */
async function handleTestFileSystem(): Promise<void> {
  try {
    logOutput('Testing file system operations...');

    if (!state.projectPath) {
      logOutput('No project open');
      return;
    }

    const testFile = `${state.projectPath}/test.txt`;
    const testContent = 'Hello from WORLDEDIT!';

    logOutput(`Writing file: ${testFile}`);
    await window.worldedit.fs.writeFile(testFile, testContent);

    logOutput(`Reading file: ${testFile}`);
    const content = await window.worldedit.fs.readFile(testFile);

    logOutput(`File content: ${content}`);

    const exists = await window.worldedit.fs.exists(testFile);
    logOutput(`File exists: ${exists}`);

    const stats = await window.worldedit.fs.getStats(testFile);
    logOutput(`File size: ${stats.size} bytes`);

    logOutput('File system test completed successfully');
  } catch (error) {
    logOutput(
      `File system test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * showProjectView()
 *
 * Shows project view with project details.
 */
function showProjectView(project: any): void {
  const welcomeScreen = document.getElementById('welcome-screen');
  const projectView = document.getElementById('project-view');
  const projectStatus = document.getElementById('project-status');
  const projectDetails = document.getElementById('project-details');

  if (welcomeScreen) {
welcomeScreen.style.display = 'none';
}
  if (projectView) {
projectView.style.display = 'block';
}
  if (projectStatus) {
projectStatus.textContent = project.name;
}

  if (projectDetails) {
    projectDetails.innerHTML = `
      <p><strong>Name:</strong> ${project.name}</p>
      <p><strong>Version:</strong> ${project.version}</p>
      <p><strong>Engine Version:</strong> ${project.engine_version}</p>
      <p><strong>Created:</strong> ${new Date(project.created).toLocaleString()}</p>
      <p><strong>Modified:</strong> ${new Date(project.modified).toLocaleString()}</p>
      <p><strong>Default Scene:</strong> ${project.settings.default_scene}</p>
    `;
  }
}

/**
 * showWelcomeScreen()
 *
 * Shows welcome screen.
 */
function showWelcomeScreen(): void {
  const welcomeScreen = document.getElementById('welcome-screen');
  const projectView = document.getElementById('project-view');
  const projectStatus = document.getElementById('project-status');

  if (welcomeScreen) {
welcomeScreen.style.display = 'block';
}
  if (projectView) {
projectView.style.display = 'none';
}
  if (projectStatus) {
projectStatus.textContent = 'No Project';
}
}

/**
 * handleProjectOpened()
 *
 * Handles project opened event from main process.
 */
function handleProjectOpened(): void {
  console.log('[RENDERER] Project opened event received');
}

/**
 * handleProjectSaved()
 *
 * Handles project saved event from main process.
 */
function handleProjectSaved(): void {
  console.log('[RENDERER] Project saved event received');
  logOutput('Project saved (event notification)');
}

/**
 * handleProjectClosed()
 *
 * Handles project closed event from main process.
 */
function handleProjectClosed(): void {
  console.log('[RENDERER] Project closed event received');
}

/**
 * logOutput()
 *
 * Logs message to test output area.
 */
function logOutput(message: string): void {
  const output = document.getElementById('test-output');

  if (output) {
    const timestamp = new Date().toLocaleTimeString();
    output.textContent += `[${timestamp}] ${message}\n`;
    output.scrollTop = output.scrollHeight;
  }

  console.log(`[RENDERER] ${message}`);
}

/**
 * Error handling
 */
window.addEventListener('error', (event) => {
  console.error('[RENDERER] Uncaught error:', event.error);
  logOutput(`Error: ${event.error.message}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[RENDERER] Unhandled rejection:', event.reason);
  logOutput(`Unhandled rejection: ${event.reason}`);
});

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEditor);
} else {
  initializeEditor();
}
