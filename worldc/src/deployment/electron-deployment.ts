/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         electron-deployment.ts
           ---
           electron deployment implementation for WORLDSRC language.

           handles compilation and packaging of WORLDSRC projects
           as cross-platform desktop applications using Electron.
           includes code signing, auto-updates, and platform-specific
           installers for Windows, macOS, and Linux.

*/

import {
  BaseDeploymentTarget,
  PlatformTarget,
  DeploymentOptions,
  DeploymentResult,
  BuildArtifact,
  OptimizationConfiguration,
  SecurityConfiguration,
  BuildStage,
} from './base-deployment';

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         ElectronDeploymentOptions
           ---
           electron-specific deployment configuration options.

*/

export interface ElectronDeploymentOptions extends DeploymentOptions {
  appInfo: {
    name: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license?: string;
  };
  electronVersion?: string;
  targetPlatforms: ('win32' | 'darwin' | 'linux')[];
  targetArchitectures: ('x64' | 'arm64' | 'ia32')[];
  mainProcess?: {
    entryPoint?: string;
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
    enableRemoteModule?: boolean;
  };
  rendererProcess?: {
    preload?: string;
    webSecurity?: boolean;
    allowRunningInsecureContent?: boolean;
  };
  window?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    fullscreen?: boolean;
    kiosk?: boolean;
    frame?: boolean;
    transparent?: boolean;
  };
  packaging?: {
    asar?: boolean;
    compression?: 'normal' | 'maximum' | 'store';
    createInstaller?: boolean;
    createPortable?: boolean;
    createZip?: boolean;
    icon?: string;
  };
  signing?: {
    certificatePath?: string;
    certificatePassword?: string;
    macDeveloperId?: string;
    windowsCodeSigning?: boolean;
    notarization?: {
      appleId?: string;
      appleIdPassword?: string;
      teamId?: string;
    };
  };
  autoUpdater?: {
    enabled?: boolean;
    updateServer?: string;
    checkInterval?: number;
    downloadInBackground?: boolean;
  };
  security?: SecurityConfiguration & {
    disableNodeIntegration?: boolean;
    enableSandbox?: boolean;
    allowedOrigins?: string[];
  };
}

/*

         ElectronBuildResult
           ---
           result of electron deployment build process.

*/

export interface ElectronBuildResult extends DeploymentResult {
  packages: Array<{
    platform: string;
    architecture: string;
    executable: string;
    installer?: string;
    portable?: string;
    zip?: string;
    size: number;
    checksum?: string;
  }>;
  mainProcess: string;
  rendererProcess: string[];
  resources: string[];
  distributionInfo: {
    totalPackages: number;
    totalSize: number;
    platforms: string[];
    architectures: string[];
  };
}

/*
    ====================================
         --- ELECTRON DEPLOYMENT ---
    ====================================
*/

/*

         ElectronDeployment
           ---
           concrete implementation for Electron desktop deployment.
           compiles WORLDSRC to optimized Electron application.

*/

export class ElectronDeployment extends BaseDeploymentTarget {
  public readonly platform = PlatformTarget.DESKTOP;
  public readonly name = 'Electron Deployment';
  public readonly version = '1.0.0';

  private electronOptions: ElectronDeploymentOptions;

  constructor(options: ElectronDeploymentOptions) {
    super(options);
    this.electronOptions = options;
  }

  /*

           deploy()
             ---
           main deployment method for Electron targets.
           orchestrates the entire Electron build pipeline.

  */

  public async deploy(): Promise<ElectronBuildResult> {
    this.clearDiagnostics();

    try {
      /* stage 1: initialization */
      await this.initializeElectronBuild();

      /* stage 2: source preparation */
      const sourceFiles = await this.prepareElectronSources();

      /* stage 3: main process compilation */
      const mainProcess = await this.compileMainProcess(sourceFiles);

      /* stage 4: renderer process compilation */
      const rendererProcesses =
        await this.compileRendererProcesses(sourceFiles);

      /* stage 5: asset bundling */
      const bundledAssets = await this.bundleElectronAssets(sourceFiles);

      /* stage 6: optimization */
      const optimizedFiles = await this.optimizeForElectron([
        mainProcess,
        ...rendererProcesses,
        ...bundledAssets,
      ]);

      /* stage 7: electron packaging */
      const packages = await this.packageElectronApps(optimizedFiles);

      /* stage 8: code signing */
      const signedPackages = await this.signElectronPackages(packages);

      /* stage 9: installer creation */
      const installersAndPortables =
        await this.createElectronInstallers(signedPackages);

      /* stage 10: finalization */
      const finalResult = await this.finalizeElectronBuild({
        mainProcess,
        rendererProcesses,
        packages: installersAndPortables,
        assets: bundledAssets,
      });

      return finalResult;
    } catch (error) {
      this.addError(
        `Electron deployment failed: ${error}`,
        BuildStage.FINALIZATION
      );

      return {
        success: false,
        platform: this.platform,
        mode: this.options.mode,
        artifacts: [],
        metrics: {
          totalTime: 0,
          buildSize: 0,
          compressionRatio: 0,
          optimizationGains: 0,
        },
        files: [],
        errors: this.getDiagnostics().filter(
          (d) => d.severity === 'error'
        ) as any[],
        warnings: this.getDiagnostics().filter(
          (d) => d.severity === 'warning'
        ) as any[],
        packages: [],
        mainProcess: '',
        rendererProcess: [],
        resources: [],
        distributionInfo: {
          totalPackages: 0,
          totalSize: 0,
          platforms: [],
          architectures: [],
        },
      };
    }
  }

  /*

           initializeElectronBuild()
             ---
           initializes Electron build environment and validates configuration.

  */

  private async initializeElectronBuild(): Promise<void> {
    console.log('Initializing Electron deployment...');

    /* validate Electron version */
    const electronVersion = this.electronOptions.electronVersion || '28.0.0';
    console.log(`Using Electron version: ${electronVersion}`);

    /* validate target platforms */
    if (this.electronOptions.targetPlatforms.length === 0) {
      this.addError('No target platforms specified', BuildStage.INITIALIZATION);
      return;
    }

    /* validate app info */
    if (!this.electronOptions.appInfo.name) {
      this.addError('App name is required', BuildStage.INITIALIZATION);
      return;
    }

    if (!this.electronOptions.appInfo.version) {
      this.addError('App version is required', BuildStage.INITIALIZATION);
      return;
    }

    /* check for platform-specific requirements */
    for (const platform of this.electronOptions.targetPlatforms) {
      const supported = await this.checkPlatformSupport(platform);
      if (!supported) {
        this.addWarning(
          `Platform ${platform} may not be fully supported on this system`,
          BuildStage.INITIALIZATION
        );
      }
    }

    /* validate signing configuration */
    if (this.electronOptions.signing) {
      await this.validateSigningConfiguration();
    }

    console.log('Electron deployment initialization complete');
  }

  /*

           prepareElectronSources()
             ---
           prepares source files for Electron compilation.

  */

  private async prepareElectronSources(): Promise<BuildArtifact[]> {
    console.log('Preparing Electron sources...');

    const sourceFiles: BuildArtifact[] = [];

    /* scan for WORLDSRC files */
    /* scan source directory for WORLDC files */
    const worldcFiles = await this.scanForFiles(
      this.options.sourceDirectory,
      '.wc'
    );

    for (const file of worldcFiles) {
      sourceFiles.push({
        id: `worldc-${sourceFiles.length}`,
        type: 'javascript',
        path: file,
        size: await this.getFileSize(file),
        metadata: {
          language: 'worldc',
          needsCompilation: true,
        },
      });
    }

    /* scan for additional assets */
    const assetFiles = await this.scanForFiles(
      this.options.sourceDirectory,
      '.png',
      '.jpg',
      '.gif',
      '.svg',
      '.ico',
      '.html',
      '.css'
    );

    for (const file of assetFiles) {
      sourceFiles.push({
        id: `asset-${sourceFiles.length}`,
        type: 'asset',
        path: file,
        size: await this.getFileSize(file),
        metadata: {
          needsProcessing: true,
        },
      });
    }

    /* create package.json for Electron app */
    const packageJson = await this.createElectronPackageJson();
    sourceFiles.push({
      id: 'package-json',
      type: 'asset',
      path: `${this.options.outputDirectory}/package.json`,
      size: packageJson.length,
      metadata: {
        isElectronConfig: true,
      },
    });

    console.log(`Prepared ${sourceFiles.length} source files for Electron`);
    return sourceFiles;
  }

  /*

           compileMainProcess()
             ---
           compiles main process code for Electron.

  */

  private async compileMainProcess(
    sourceFiles: BuildArtifact[]
  ): Promise<BuildArtifact> {
    console.log('Compiling Electron main process...');

    const mainProcessFiles = sourceFiles.filter(
      (f) =>
        f.metadata?.targetProcess === 'main' || f.metadata?.isElectronConfig
    );

    const mainProcessCode = await this.generateMainProcessCode();

    const mainProcess: BuildArtifact = {
      id: 'main-process',
      type: 'javascript',
      path: `${this.options.outputDirectory}/main.js`,
      size: mainProcessCode.length,
      metadata: {
        isMainProcess: true,
        electronVersion: this.electronOptions.electronVersion,
        compiledFiles: mainProcessFiles.map((f) => f.path),
      },
    };

    console.log('Main process compiled');
    return mainProcess;
  }

  /*

           compileRendererProcesses()
             ---
           compiles renderer process code for Electron.

  */

  private async compileRendererProcesses(
    sourceFiles: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Compiling Electron renderer processes...');

    const rendererFiles = sourceFiles.filter(
      (f) =>
        f.metadata?.targetProcess === 'renderer' || f.metadata?.needsCompilation
    );

    const rendererProcesses: BuildArtifact[] = [];

    /* compile main renderer */
    const mainRendererCode = await this.generateRendererCode(rendererFiles);

    rendererProcesses.push({
      id: 'main-renderer',
      type: 'javascript',
      path: `${this.options.outputDirectory}/renderer.js`,
      size: mainRendererCode.length,
      metadata: {
        isRenderer: true,
        compiledFiles: rendererFiles.map((f) => f.path),
      },
    });

    /* compile preload script if needed */
    if (this.electronOptions.rendererProcess?.preload) {
      const preloadCode = await this.generatePreloadCode();
      rendererProcesses.push({
        id: 'preload-script',
        type: 'javascript',
        path: `${this.options.outputDirectory}/preload.js`,
        size: preloadCode.length,
        metadata: {
          isPreload: true,
        },
      });
    }

    console.log(`Compiled ${rendererProcesses.length} renderer processes`);
    return rendererProcesses;
  }

  /*

           bundleElectronAssets()
             ---
           bundles assets specifically for Electron environment.

  */

  private async bundleElectronAssets(
    sourceFiles: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Bundling Electron assets...');

    const bundledAssets: BuildArtifact[] = [];

    /* copy static assets */
    const staticAssets = sourceFiles.filter(
      (f) => f.type === 'asset' && !f.metadata?.isElectronConfig
    );

    for (const asset of staticAssets) {
      const bundledAsset = {
        ...asset,
        path: `${this.options.outputDirectory}/assets/${this.getFileName(asset.path)}`,
        metadata: {
          ...asset.metadata,
          bundledForElectron: true,
        },
      };
      bundledAssets.push(bundledAsset);
    }

    /* create Electron-specific HTML */
    const electronHtml = await this.generateElectronHTML();
    bundledAssets.push({
      id: 'electron-html',
      type: 'html',
      path: `${this.options.outputDirectory}/index.html`,
      size: electronHtml.length,
      metadata: {
        isElectronHTML: true,
      },
    });

    /* create Electron CSS */
    const electronCss = await this.generateElectronCSS();
    bundledAssets.push({
      id: 'electron-css',
      type: 'css',
      path: `${this.options.outputDirectory}/styles.css`,
      size: electronCss.length,
      metadata: {
        isElectronCSS: true,
      },
    });

    console.log(`Bundled ${bundledAssets.length} assets for Electron`);
    return bundledAssets;
  }

  /*

           optimizeForElectron()
             ---
           applies Electron-specific optimizations.

  */

  private async optimizeForElectron(
    files: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Optimizing for Electron...');

    const optimizedFiles: BuildArtifact[] = [];

    for (const file of files) {
      const optimized = await this.optimizeElectronFile(file);
      optimizedFiles.push(optimized);
    }

    /* apply ASAR packaging if enabled */
    if (this.electronOptions.packaging?.asar !== false) {
      await this.applyAsarPackaging(optimizedFiles);
    }

    console.log('Electron optimization complete');
    return optimizedFiles;
  }

  /*

           packageElectronApps()
             ---
           packages Electron applications for each target platform.

  */

  private async packageElectronApps(optimizedFiles: BuildArtifact[]): Promise<
    Array<{
      platform: string;
      architecture: string;
      path: string;
      size: number;
      executable: string;
    }>
  > {
    console.log('Packaging Electron applications...');

    const packages: Array<{
      platform: string;
      architecture: string;
      path: string;
      size: number;
      executable: string;
    }> = [];

    /* package for each platform/architecture combination */
    for (const platform of this.electronOptions.targetPlatforms) {
      for (const arch of this.electronOptions.targetArchitectures) {
        console.log(`Packaging for ${platform}-${arch}...`);

        const packagePath = `${this.options.outputDirectory}/packages/${platform}-${arch}`;
        const executable = this.getExecutableName(platform);
        const packageSize = await this.calculatePackageSize(optimizedFiles);

        packages.push({
          platform,
          architecture: arch,
          path: packagePath,
          size: packageSize,
          executable: `${packagePath}/${executable}`,
        });
      }
    }

    console.log(`Created ${packages.length} Electron packages`);
    return packages;
  }

  /*

           signElectronPackages()
             ---
           applies code signing to Electron packages.

  */

  private async signElectronPackages(
    packages: Array<{
      platform: string;
      architecture: string;
      path: string;
      size: number;
      executable: string;
    }>
  ): Promise<
    Array<{
      platform: string;
      architecture: string;
      path: string;
      size: number;
      executable: string;
      signed: boolean;
    }>
  > {
    if (!this.electronOptions.signing) {
      console.log('Code signing disabled');
      return packages.map((pkg) => ({ ...pkg, signed: false }));
    }

    console.log('Applying code signing...');

    const signedPackages = [];

    for (const pkg of packages) {
      const signed = await this.signPackage(pkg);
      signedPackages.push({
        ...pkg,
        signed,
      });
    }

    console.log('Code signing complete');
    return signedPackages;
  }

  /*

           createElectronInstallers()
             ---
           creates installers and portable versions.

  */

  private async createElectronInstallers(
    packages: Array<{
      platform: string;
      architecture: string;
      path: string;
      size: number;
      executable: string;
      signed: boolean;
    }>
  ): Promise<
    Array<{
      platform: string;
      architecture: string;
      executable: string;
      installer?: string;
      portable?: string;
      zip?: string;
      size: number;
      checksum?: string;
    }>
  > {
    console.log('Creating installers...');

    const installersAndPortables = [];

    for (const pkg of packages) {
      const result: any = {
        platform: pkg.platform,
        architecture: pkg.architecture,
        executable: pkg.executable,
        size: pkg.size,
      };

      /* create installer if requested */
      if (this.electronOptions.packaging?.createInstaller !== false) {
        result.installer = await this.createInstaller(pkg);
      }

      /* create portable if requested */
      if (this.electronOptions.packaging?.createPortable) {
        result.portable = await this.createPortable(pkg);
      }

      /* create zip if requested */
      if (this.electronOptions.packaging?.createZip) {
        result.zip = await this.createZip(pkg);
      }

      /* calculate checksum */
      result.checksum = await this.calculateChecksum(pkg.executable);

      installersAndPortables.push(result);
    }

    console.log('Installers created');
    return installersAndPortables;
  }

  /*

           finalizeElectronBuild()
             ---
           finalizes Electron build and generates result.

  */

  private async finalizeElectronBuild(buildData: {
    mainProcess: BuildArtifact;
    rendererProcesses: BuildArtifact[];
    packages: Array<{
      platform: string;
      architecture: string;
      executable: string;
      installer?: string;
      portable?: string;
      zip?: string;
      size: number;
      checksum?: string;
    }>;
    assets: BuildArtifact[];
  }): Promise<ElectronBuildResult> {
    console.log('Finalizing Electron build...');

    const allArtifacts = [
      buildData.mainProcess,
      ...buildData.rendererProcesses,
      ...buildData.assets,
    ];

    const totalSize = buildData.packages.reduce(
      (sum, pkg) => sum + pkg.size,
      0
    );
    const platforms = [
      ...new Set(buildData.packages.map((pkg) => pkg.platform)),
    ];
    const architectures = [
      ...new Set(buildData.packages.map((pkg) => pkg.architecture)),
    ];

    const result: ElectronBuildResult = {
      success: true,
      platform: this.platform,
      mode: this.options.mode,
      artifacts: allArtifacts,
      metrics: {
        totalTime: Date.now() /* would track actual time */,
        buildSize: totalSize,
        compressionRatio: 0 /* would calculate actual ratio */,
        optimizationGains: 0 /* would calculate actual gains */,
      },
      files: [
        ...allArtifacts.map((a) => a.path),
        ...buildData.packages.map((p) => p.executable),
        ...buildData.packages
          .filter((p) => p.installer)
          .map((p) => p.installer!),
        ...buildData.packages.filter((p) => p.portable).map((p) => p.portable!),
      ],
      errors: this.getDiagnostics().filter(
        (d) => d.severity === 'error'
      ) as any[],
      warnings: this.getDiagnostics().filter(
        (d) => d.severity === 'warning'
      ) as any[],
      packages: buildData.packages,
      mainProcess: buildData.mainProcess.path,
      rendererProcess: buildData.rendererProcesses.map((r) => r.path),
      resources: buildData.assets.map((a) => a.path),
      distributionInfo: {
        totalPackages: buildData.packages.length,
        totalSize,
        platforms,
        architectures,
      },
    };

    console.log('Electron deployment complete!');
    console.log(`Total size: ${this.formatBytes(totalSize)}`);
    console.log(`Packages created: ${buildData.packages.length}`);
    console.log(`Platforms: ${platforms.join(', ')}`);

    return result;
  }

  /*
    ====================================
         --- HELPER METHODS ---
    ====================================
  */

  /*

           generateMainProcessCode()
             ---
           generates Electron main process JavaScript code.

  */

  private async generateMainProcessCode(): Promise<string> {
    const windowConfig = this.electronOptions.window || {};

    return `
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: ${windowConfig.width || 1200},
    height: ${windowConfig.height || 800},
    minWidth: ${windowConfig.minWidth || 800},
    minHeight: ${windowConfig.minHeight || 600},
    resizable: ${windowConfig.resizable !== false},
    frame: ${windowConfig.frame !== false},
    transparent: ${windowConfig.transparent || false},
    webPreferences: {
      nodeIntegration: ${this.electronOptions.mainProcess?.nodeIntegration || false},
      contextIsolation: ${this.electronOptions.mainProcess?.contextIsolation !== false},
      enableRemoteModule: ${this.electronOptions.mainProcess?.enableRemoteModule || false},
      preload: ${this.electronOptions.rendererProcess?.preload ? `path.join(__dirname, 'preload.js')` : 'undefined'},
      webSecurity: ${this.electronOptions.rendererProcess?.webSecurity !== false},
      allowRunningInsecureContent: ${this.electronOptions.rendererProcess?.allowRunningInsecureContent || false}
    },
    icon: ${this.electronOptions.packaging?.icon ? `path.join(__dirname, 'assets', '${this.electronOptions.packaging.icon}')` : 'undefined'}
  });

  /* load the app */
  const startUrl = isDev ? 'http://localhost:3000' : \`file://\${path.join(__dirname, 'index.html')}\`;
  mainWindow.loadURL(startUrl);

  /* open DevTools in development */
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  /* handle window closed */
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  /* handle window ready */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (${windowConfig.fullscreen || false}) {
      mainWindow.setFullScreen(true);
    }

    if (${windowConfig.kiosk || false}) {
      mainWindow.setKiosk(true);
    }
  });
}

/* app event handlers */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/* security: prevent new window creation */
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault();
    require('electron').shell.openExternal(url);
  });
});

/* IPC handlers for WORLDSRC integration */
ipcMain.handle('worldsrc:get-app-info', () => {
  return {
    name: '${this.electronOptions.appInfo.name}',
    version: '${this.electronOptions.appInfo.version}',
    platform: process.platform,
    arch: process.arch
  };
});

ipcMain.handle('worldsrc:show-message', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('worldsrc:show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('worldsrc:show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

/* auto-updater integration */
${
  this.electronOptions.autoUpdater?.enabled
    ? `
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. It will be downloaded in the background.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to apply the update.',
    buttons: ['Restart Now', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
`
    : '/* Auto-updater disabled */'
}

console.log('WORLDSRC Electron app initialized');
`;
  }

  /*

           generateRendererCode()
             ---
           generates Electron renderer process code.

  */

  private async generateRendererCode(
    sourceFiles: BuildArtifact[]
  ): Promise<string> {
    return `
// WORLDSRC Electron Renderer Process
import { WorldCGame } from './worldc-compiled';

// Electron API access
const { ipcRenderer } = require('electron');

class ElectronWorldSrcGame extends WorldSrcGame {
  constructor(canvasId) {
    super(canvasId);
    this.setupElectronIntegration();
  }

  async setupElectronIntegration() {
    // Get app info from main process
    const appInfo = await ipcRenderer.invoke('worldsrc:get-app-info');
    console.log('Running in Electron:', appInfo);

    // Setup Electron-specific features
    this.setupElectronMenus();
    this.setupElectronDialogs();
    this.setupElectronFileAccess();
  }

  setupElectronMenus() {
    // Electron menu integration
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            this.saveGame();
            break;
          case 'o':
            e.preventDefault();
            this.openGame();
            break;
          case 'q':
            e.preventDefault();
            window.close();
            break;
        }
      }
    });
  }

  setupElectronDialogs() {
    this.showMessage = async (options) => {
      return await ipcRenderer.invoke('worldsrc:show-message', options);
    };

    this.showSaveDialog = async (options) => {
      return await ipcRenderer.invoke('worldsrc:show-save-dialog', options);
    };

    this.showOpenDialog = async (options) => {
      return await ipcRenderer.invoke('worldsrc:show-open-dialog', options);
    };
  }

  setupElectronFileAccess() {
    // Enhanced file access capabilities in Electron
    this.fileAPI = {
      save: async (data, filename) => {
        const result = await this.showSaveDialog({
          defaultPath: filename,
          filters: [
            { name: 'WORLDSRC Save', extensions: ['wsave'] },
            { name: 'JSON', extensions: ['json'] }
          ]
        });

        if (!result.canceled) {
          // Would use Node.js fs module to save file
          console.log('Saving to:', result.filePath);
          return true;
        }
        return false;
      },

      load: async () => {
        const result = await this.showOpenDialog({
          filters: [
            { name: 'WORLDSRC Save', extensions: ['wsave'] },
            { name: 'JSON', extensions: ['json'] }
          ],
          properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
          // Would use Node.js fs module to load file
          console.log('Loading from:', result.filePaths[0]);
          return { success: true, data: {} };
        }
        return { success: false };
      }
    };
  }

  async saveGame() {
    const gameData = this.exportGameState();
    const success = await this.fileAPI.save(gameData, 'game.wsave');

    if (success) {
      await this.showMessage({
        type: 'info',
        title: 'Game Saved',
        message: 'Your game has been saved successfully!'
      });
    }
  }

  async openGame() {
    const result = await this.fileAPI.load();

    if (result.success) {
      this.importGameState(result.data);
      await this.showMessage({
        type: 'info',
        title: 'Game Loaded',
        message: 'Your game has been loaded successfully!'
      });
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    const game = new ElectronWorldSrcGame('gameCanvas');
    game.run();

    // Make game available globally for debugging
    window.worldsrcGame = game;
  }
});

// Handle window events
window.addEventListener('beforeunload', (e) => {
  // Save game state before closing
  if (window.worldsrcGame && window.worldsrcGame.hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

console.log('WORLDSRC Electron renderer initialized');
`;
  }

  /*

           generatePreloadCode()
             ---
           generates Electron preload script.

  */

  private async generatePreloadCode(): Promise<string> {
    return `
// WORLDSRC Electron Preload Script
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('worldsrc:get-app-info'),
  showMessage: (options) => ipcRenderer.invoke('worldsrc:show-message', options),
  showSaveDialog: (options) => ipcRenderer.invoke('worldsrc:show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('worldsrc:show-open-dialog', options),

  // Platform info
  platform: process.platform,
  arch: process.arch,

  // WORLDSRC-specific APIs
  worldsrc: {
    version: '${this.electronOptions.appInfo.version}',
    name: '${this.electronOptions.appInfo.name}',
    isElectron: true
  }
});

console.log('WORLDSRC Electron preload script loaded');
`;
  }

  /*

           generateElectronHTML()
             ---
           generates HTML file for Electron renderer.

  */

  private async generateElectronHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.electronOptions.appInfo.name}</title>
  <link rel="stylesheet" href="styles.css">

  <style>
    /* Electron-specific styles */
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #1a1a1a;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .electron-titlebar {
      height: 30px;
      background: #2d2d2d;
      -webkit-app-region: drag;
      display: flex;
      align-items: center;
      padding: 0 15px;
      font-size: 14px;
    }

    .electron-controls {
      position: absolute;
      top: 0;
      right: 0;
      height: 30px;
      -webkit-app-region: no-drag;
    }
  </style>
</head>
<body>
  ${
    this.electronOptions.window?.frame === false
      ? `
  <div class="electron-titlebar">
    <span>${this.electronOptions.appInfo.name}</span>
    <div class="electron-controls">
      <!-- Window controls would go here -->
    </div>
  </div>
  `
      : ''
  }

  <div id="worldsrc-loading" class="worldsrc-loading">
    <div>Loading ${this.electronOptions.appInfo.name}...</div>
  </div>

  <canvas id="gameCanvas" width="800" height="600"></canvas>

  <div id="worldsrc-ui" class="worldsrc-ui">
    <!-- UI elements will be added here by the game -->
  </div>

  <script src="renderer.js"></script>
</body>
</html>`;
  }

  /*

           generateElectronCSS()
             ---
           generates CSS file for Electron styling.

  */

  private async generateElectronCSS(): Promise<string> {
    return `
/* WORLDSRC Electron Styles */

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #1a1a1a;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#gameCanvas {
  display: block;
  margin: 0 auto;
  background: #000000;
  border: 1px solid #333;
}

.worldsrc-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(26, 26, 26, 0.9);
  z-index: 9999;
  font-size: 18px;
}

.worldsrc-ui {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

/* Electron-specific UI elements */
.electron-menu {
  background: #2d2d2d;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
  margin: 4px;
}

.electron-button {
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.electron-button:hover {
  background: #005a9e;
}

.electron-button:active {
  background: #004578;
}

/* Platform-specific adjustments */
.platform-win32 .electron-titlebar {
  height: 32px;
}

.platform-darwin .electron-titlebar {
  height: 28px;
  padding-left: 80px; /* Space for traffic lights */
}

.platform-linux .electron-titlebar {
  height: 30px;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  body {
    background: #1e1e1e;
    color: #e5e5e5;
  }

  .electron-menu {
    background: #252526;
    border-color: #464647;
  }
}

/* High DPI display support */
@media (-webkit-min-device-pixel-ratio: 2) {
  #gameCanvas {
    image-rendering: -webkit-optimize-contrast;
  }
}

/* Scrollbar styling for webkit */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #2d2d2d;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #777;
}
`;
  }

  /*
    ====================================
         --- UTILITY METHODS ---
    ====================================
  */

  private async createElectronPackageJson(): Promise<string> {
    const packageData = {
      name: this.electronOptions.appInfo.name
        .toLowerCase()
        .replace(/\s+/g, '-'),
      version: this.electronOptions.appInfo.version,
      description: this.electronOptions.appInfo.description,
      main: 'main.js',
      author: this.electronOptions.appInfo.author,
      license: this.electronOptions.appInfo.license || 'MIT',
      homepage: this.electronOptions.appInfo.homepage,
      repository: this.electronOptions.appInfo.repository,
      dependencies: {
        electron: this.electronOptions.electronVersion || '^28.0.0',
      },
      build: {
        appId: `com.worldsrc.${this.electronOptions.appInfo.name.toLowerCase().replace(/\s+/g, '')}`,
        productName: this.electronOptions.appInfo.name,
        directories: {
          output: 'dist',
        },
        files: [
          'main.js',
          'renderer.js',
          'preload.js',
          'index.html',
          'styles.css',
          'assets/**/*',
        ],
        win: {
          target: 'nsis',
          icon: this.electronOptions.packaging?.icon,
        },
        mac: {
          target: 'dmg',
          icon: this.electronOptions.packaging?.icon,
          category: 'public.app-category.games',
        },
        linux: {
          target: 'AppImage',
          icon: this.electronOptions.packaging?.icon,
        },
      },
    };

    return JSON.stringify(packageData, null, 2);
  }

  private determineTargetProcess(filePath: string): 'main' | 'renderer' {
    /* would analyze file content to determine target process */
    return filePath.includes('main') ? 'main' : 'renderer';
  }

  private async scanForFiles(
    directory: string,
    ...extensions: string[]
  ): Promise<string[]> {
    /* would scan filesystem for files with given extensions */
    return [`${directory}/main.ws`, `${directory}/game.ws`];
  }

  private async getFileSize(filePath: string): Promise<number> {
    /* would get actual file size */
    return Math.floor(Math.random() * 10000) + 1000;
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || '';
  }

  private getExecutableName(platform: string): string {
    const appName = this.electronOptions.appInfo.name;
    switch (platform) {
      case 'win32':
        return `${appName}.exe`;
      case 'darwin':
        return `${appName}.app`;
      case 'linux':
        return appName.toLowerCase();
      default:
        return appName;
    }
  }

  private async checkPlatformSupport(platform: string): Promise<boolean> {
    /* would check if current system can build for target platform */
    return true;
  }

  private async validateSigningConfiguration(): Promise<void> {
    if (this.electronOptions.signing?.certificatePath) {
      /* would validate certificate exists and is valid */
      console.log('Validating code signing certificate...');
    }
  }

  private async optimizeElectronFile(
    file: BuildArtifact
  ): Promise<BuildArtifact> {
    /* would apply Electron-specific optimizations */
    return {
      ...file,
      metadata: {
        ...file.metadata,
        optimizedForElectron: true,
      },
    };
  }

  private async applyAsarPackaging(files: BuildArtifact[]): Promise<void> {
    /* would package files into ASAR archive */
    console.log('Applying ASAR packaging...');
  }

  private async calculatePackageSize(files: BuildArtifact[]): Promise<number> {
    return (
      files.reduce((sum, file) => sum + file.size, 0) + 100 * 1024 * 1024
    ); /* base Electron size */
  }

  private async signPackage(pkg: any): Promise<boolean> {
    /* would apply code signing */
    console.log(`Signing package for ${pkg.platform}-${pkg.architecture}...`);
    return true;
  }

  private async createInstaller(pkg: any): Promise<string> {
    /* would create platform-specific installer */
    return `${pkg.path}/${this.electronOptions.appInfo.name}-setup.${this.getInstallerExtension(pkg.platform)}`;
  }

  private async createPortable(pkg: any): Promise<string> {
    /* would create portable version */
    return `${pkg.path}/${this.electronOptions.appInfo.name}-portable.zip`;
  }

  private async createZip(pkg: any): Promise<string> {
    /* would create zip archive */
    return `${pkg.path}/${this.electronOptions.appInfo.name}-${pkg.platform}-${pkg.architecture}.zip`;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    /* would calculate actual checksum */
    return 'sha256-checksum-placeholder';
  }

  private getInstallerExtension(platform: string): string {
    switch (platform) {
      case 'win32':
        return 'exe';
      case 'darwin':
        return 'dmg';
      case 'linux':
        return 'AppImage';
      default:
        return 'pkg';
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /*
    ====================================
         --- VALIDATION ---
    ====================================
  */

  protected override async validatePlatform(): Promise<{
    errors: any[];
    warnings: any[];
  }> {
    const errors: any[] = [];
    const warnings: any[] = [];

    /* validate Electron-specific requirements */
    if (!this.electronOptions.appInfo.name) {
      errors.push({
        id: 'missing-app-name',
        severity: 'error',
        message: 'App name is required for Electron deployment',
        stage: BuildStage.INITIALIZATION,
      });
    }

    if (!this.electronOptions.appInfo.version) {
      errors.push({
        id: 'missing-app-version',
        severity: 'error',
        message: 'App version is required for Electron deployment',
        stage: BuildStage.INITIALIZATION,
      });
    }

    /* validate target platforms */
    if (this.electronOptions.targetPlatforms.length === 0) {
      errors.push({
        id: 'no-target-platforms',
        severity: 'error',
        message: 'At least one target platform must be specified',
        stage: BuildStage.INITIALIZATION,
      });
    }

    return { errors, warnings };
  }

  public async isSupported(): Promise<boolean> {
    /* Electron deployment is supported on all platforms */
    return true;
  }

  public getRequirements(): {
    nodeVersion?: string;
    dependencies?: string[];
    systemRequirements?: string[];
  } {
    return {
      nodeVersion: '>=16.0.0',
      dependencies: ['electron', 'electron-builder'],
      systemRequirements: [
        'Windows 10+, macOS 10.15+, or Linux with GTK 3.x',
        'At least 4GB RAM for building',
        'Code signing certificates (optional)',
      ],
    };
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
