/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             BUILD MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	build system orchestrator for worldenv projects.

	handles complete build pipeline from source compilation
	to asset bundling and output generation. manages multiple
	compilation targets including WorldC, TypeScript, and
	AssemblyScript with integrated optimization and minification.

	the build process follows a staged approach:
	1. validation of build configuration
	2. output directory preparation
	3. source code compilation (WorldC, TypeScript, AssemblyScript)
	4. asset bundling and copying
	5. HTML generation and manifest creation

	supports cancellation and progress reporting for long-running
	builds with detailed logging throughout each stage.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as fs from 'fs'; /* FILE SYSTEM OPERATIONS */
import * as path from 'path'; /* PATH MANIPULATION */
import { spawn, ChildProcess } from 'child_process'; /* PROCESS SPAWNING */
import { logger } from './logger'; /* LOGGING SYSTEM */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         BuildConfiguration
	       ---
	       complete build settings for project compilation.

	       defines output location, target platform, optimization
	       settings, and feature flags for asset inclusion and
	       source map generation.

*/

interface BuildConfiguration {
  outputDirectory: string /* TARGET OUTPUT PATH */;
  buildTarget: string /* BUILD TARGET PLATFORM */;
  optimizationLevel: string /* OPTIMIZATION LEVEL (debug/release) */;
  entryScene: string /* MAIN SCENE FILE */;
  includeAssets: boolean /* BUNDLE ASSETS FLAG */;
  includeScripts: boolean /* INCLUDE SCRIPTS FLAG */;
  generateSourceMaps: boolean /* SOURCE MAP GENERATION */;
  minifyOutput: boolean /* OUTPUT MINIFICATION */;
}

/*

         BuildProgress
	       ---
	       progress reporting structure for build operations.

	       provides stage identification, completion percentage,
	       human-readable messages, and optional error information
	       for build monitoring and UI updates.

*/

interface BuildProgress {
  stage: string /* CURRENT BUILD STAGE */;
  progress: number /* COMPLETION PERCENTAGE (0-100) */;
  message: string /* HUMAN-READABLE STATUS */;
  error?: string /* OPTIONAL ERROR MESSAGE */;
}

/*

         BuildCallback
	       ---
	       callback function type for build progress notifications.

	       allows external systems to monitor build progress
	       and update user interfaces accordingly.

*/

type BuildCallback = (progress: BuildProgress) => void;

/*

         BuildResult
	       ---
	       comprehensive build operation result.

	       contains success status, output location, collected
	       errors and warnings, and total build time for
	       post-build analysis and reporting.

*/

interface BuildResult {
  success: boolean /* BUILD SUCCESS STATUS */;
  outputPath: string /* FINAL OUTPUT LOCATION */;
  errors: string[] /* COMPILATION ERRORS */;
  warnings: string[] /* COMPILATION WARNINGS */;
  buildTime: number /* TOTAL BUILD TIME (MS) */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         BuildManager
	       ---
	       main build orchestration class.

	       manages complete build pipeline from configuration
	       validation through final output generation. handles
	       multiple compilation targets and provides progress
	       reporting for long-running operations.

	       supports build cancellation and maintains reference
	       to current build process for cleanup operations.

*/

class BuildManager {
  private currentBuild: ChildProcess | null; /* ACTIVE BUILD PROCESS */
  private projectPath: string; /* CURRENT PROJECT PATH */

  constructor() {
    this.currentBuild = null;
    this.projectPath = '';
  }

  /*

           setProjectPath()
	         ---
	         configures project path for build operations.

	         establishes base directory for all build-related
	         file operations and compilation processes.

  */

  public setProjectPath(path: string): void {
    this.projectPath = path;
    logger.debug('BUILD', 'Project path set', { path });
  }

  /*

           validateConfiguration()
	         ---
	         validates build configuration before starting build.

	         performs comprehensive validation of all required
	         settings and verifies file system paths exist.
	         returns array of error messages for invalid settings.

	         validation includes:
	         - required field presence checks
	         - output directory accessibility
	         - entry scene file existence

  */

  private validateConfiguration(config: BuildConfiguration): string[] {
    const errors: string[] = [];

    /* validate required configuration fields */
    if (!config.outputDirectory || config.outputDirectory.trim() === '') {
      errors.push('Output directory is required');
    }

    if (!config.buildTarget) {
      errors.push('Build target is required');
    }

    if (!config.optimizationLevel) {
      errors.push('Optimization level is required');
    }

    if (!config.entryScene) {
      errors.push('Entry scene is required');
    }

    if (!this.projectPath) {
      errors.push('No project loaded');
    }

    /* validate file system paths and accessibility */
    if (config.outputDirectory) {
      try {
        const outputDir = path.resolve(config.outputDirectory);
        const parentDir = path.dirname(outputDir);

        if (!fs.existsSync(parentDir)) {
          errors.push('Output directory parent does not exist');
        }
      } catch (error) {
        errors.push('Invalid output directory path');
      }
    }

    /* verify entry scene file exists in project */
    if (config.entryScene && this.projectPath) {
      const scenePath = path.join(this.projectPath, 'scenes', `${config.entryScene}.scene`);

      if (!fs.existsSync(scenePath)) {
        errors.push('Entry scene file does not exist');
      }
    }

    return errors;
  }

  /*

           buildProject()
	         ---
	         orchestrates complete project build pipeline.

	         executes full build process including validation,
	         compilation, asset bundling, and output generation.
	         provides progress callbacks for UI updates and
	         returns comprehensive build results.

	         build stages:
	         1. configuration validation
	         2. output directory preparation
	         3. source compilation (WorldC, TypeScript, AssemblyScript)
	         4. asset bundling and script copying
	         5. HTML generation and manifest creation

  */
  public async buildProject(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<BuildResult> {
    const startTime = Date.now();
    const result: BuildResult = {
      success: false,
      outputPath: '',
      errors: [],
      warnings: [],
      buildTime: 0
    };

    try {
      /* VALIDATE CONFIGURATION */
      const validationErrors = this.validateConfiguration(config);
      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        return result;
      }

      logger.info('BUILD', 'Starting build', { config });

      onProgress?.({
        stage: 'Preparing',
        progress: 0,
        message: 'Validating configuration...'
      });

      /* PREPARE OUTPUT DIRECTORY */
      await this.prepareOutputDirectory(config, onProgress);

      /* COMPILE WORLDC */
      await this.compileWorldC(config, onProgress);

      /* COMPILE TYPESCRIPT */
      await this.compileTypeScript(config, onProgress);

      /* BUILD ASSEMBLYSCRIPT */
      if (config.buildTarget === 'wasm') {
        await this.buildAssemblyScript(config, onProgress);
      }

      /* BUNDLE ASSETS */
      if (config.includeAssets) {
        await this.bundleAssets(config, onProgress);
      }

      /* COPY SCRIPTS */
      if (config.includeScripts) {
        await this.copyScripts(config, onProgress);
      }

      /* GENERATE INDEX HTML */
      await this.generateIndexHtml(config, onProgress);

      /* COPY RUNTIME FILES */
      await this.copyRuntimeFiles(config, onProgress);

      /* GENERATE MANIFEST */
      await this.generateManifest(config, onProgress);

      onProgress?.({
        stage: 'Complete',
        progress: 100,
        message: 'Build completed successfully'
      });

      result.success = true;
      result.outputPath = path.resolve(config.outputDirectory);
      result.buildTime = Date.now() - startTime;

      logger.info('BUILD', 'Build completed successfully', {
        outputPath: result.outputPath,
        buildTime: result.buildTime
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
      result.errors.push(errorMessage);
      result.buildTime = Date.now() - startTime;

      logger.error('BUILD', 'Build failed', { error: errorMessage });

      onProgress?.({
        stage: 'Error',
        progress: 0,
        message: 'Build failed',
        error: errorMessage
      });

      return result;
    }
  }

  /*

           prepareOutputDirectory()
	         ---
	         prepares output directory for build operation.

	         creates output directory structure and cleans
	         existing content if necessary. ensures proper
	         permissions and directory hierarchy exists.

  */
  private async prepareOutputDirectory(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Preparing',
      progress: 10,
      message: 'Preparing output directory...'
    });

    const outputDir = path.resolve(config.outputDirectory);

    /* CREATE OUTPUT DIRECTORY */
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    /* CLEAN EXISTING BUILD */
    const entries = fs.readdirSync(outputDir);
    for (const entry of entries) {
      const entryPath = path.join(outputDir, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entryPath);
      }
    }

    /* CREATE SUBDIRECTORIES */
    const subdirs = ['assets', 'scripts', 'scenes', 'js'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(outputDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    }

    logger.debug('BUILD', 'Output directory prepared', { outputDir });
  }

  /*

           compileWorldC()
	         ---
	         compiles WorldC source files to target format.

	         invokes WorldC compiler with project-specific
	         configuration and optimization settings.
	         handles compiler output and error reporting.

  */
  private async compileWorldC(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Compiling WorldC',
      progress: 20,
      message: 'Compiling WorldC files...'
    });

    const sourceDir = path.join(this.projectPath, 'src');
    const outputDir = path.join(config.outputDirectory, 'compiled');

    /* Ensure output directory exists */
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const worldcPath = path.join(this.projectPath, 'node_modules', '.bin', 'worldc');
      const args = [
        '--input',
        sourceDir,
        '--output',
        outputDir,
        '--target',
        config.buildTarget === 'wasm' ? 'assemblyscript' : 'typescript',
        '--optimization',
        config.optimizationLevel
      ];

      if (config.generateSourceMaps) {
        args.push('--sourcemaps');
      }

      logger.debug('BUILD', 'Starting WorldC compilation', {
        command: worldcPath,
        args,
        cwd: this.projectPath
      });

      const process = spawn(worldcPath, args, {
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.currentBuild = process;

      let output = '';
      let errorOutput = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
        logger.debug('BUILD', 'WorldC stdout', { data: data.toString() });
      });

      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        logger.debug('BUILD', 'WorldC stderr', { data: data.toString() });
      });

      process.on('close', (code) => {
        this.currentBuild = null;

        if (code === 0) {
          logger.debug('BUILD', 'WorldC compilation completed');
          resolve();
        } else {
          logger.error('BUILD', 'WorldC compilation failed', {
            code,
            output,
            errorOutput
          });
          reject(new Error(`WorldC compilation failed: ${errorOutput || output}`));
        }
      });

      process.on('error', (error) => {
        this.currentBuild = null;
        logger.error('BUILD', 'WorldC compilation error', { error });
        reject(new Error(`WorldC compilation error: ${error.message}`));
      });
    });
  }

  /*

           compileTypeScript()
	         ---
	         compiles TypeScript source files to JavaScript.

	         uses TypeScript compiler with project configuration
	         to generate JavaScript output with optional
	         source maps and minification.

  */
  private async compileTypeScript(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Compiling TypeScript',
      progress: 40,
      message: 'Compiling TypeScript...'
    });

    return new Promise((resolve, reject) => {
      const enginePath = path.dirname(this.projectPath);
      const tsconfigPath = path.join(enginePath, 'tsconfig.json');

      const args = ['--project', tsconfigPath, '--outDir', path.join(config.outputDirectory, 'js')];

      if (config.generateSourceMaps) {
        args.push('--sourceMap');
      }

      if (config.optimizationLevel === 'full') {
        args.push('--removeComments');
      }

      const tsc = spawn('npx', ['tsc', ...args], {
        cwd: enginePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      tsc.on('close', (code) => {
        if (code === 0) {
          logger.debug('BUILD', 'TypeScript compilation completed');
          resolve();
        } else {
          logger.error('BUILD', 'TypeScript compilation failed', {
            code,
            output,
            errorOutput
          });
          reject(new Error(`TypeScript compilation failed: ${errorOutput || output}`));
        }
      });

      this.currentBuild = tsc;
    });
  }

  /*

           buildAssemblyScript()
	         ---
	         builds AssemblyScript files to WebAssembly modules.

	         compiles AssemblyScript source to optimized
	         WebAssembly binary format with proper
	         JavaScript binding generation.

  */
  private async buildAssemblyScript(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Building WASM',
      progress: 50,
      message: 'Building AssemblyScript to WebAssembly...'
    });

    return new Promise((resolve, reject) => {
      const enginePath = path.dirname(this.projectPath);
      const wasmOutputDir = path.join(config.outputDirectory, 'wasm');

      if (!fs.existsSync(wasmOutputDir)) {
        fs.mkdirSync(wasmOutputDir, { recursive: true });
      }

      const args = [
        'asc',
        'asm/index.ts',
        '-b',
        path.join(wasmOutputDir, 'optimized.wasm'),
        '-o',
        path.join(wasmOutputDir, 'optimized.js')
      ];

      if (config.optimizationLevel !== 'none') {
        args.push('--optimize');
      }

      if (config.generateSourceMaps) {
        args.push('--sourceMap');
      }

      const asc = spawn('npx', args, {
        cwd: enginePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      asc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      asc.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      asc.on('close', (code) => {
        if (code === 0) {
          logger.debug('BUILD', 'AssemblyScript compilation completed');
          resolve();
        } else {
          logger.error('BUILD', 'AssemblyScript compilation failed', {
            code,
            output,
            errorOutput
          });
          reject(new Error(`AssemblyScript compilation failed: ${errorOutput || output}`));
        }
      });

      this.currentBuild = asc;
    });
  }

  /*

           bundleAssets()
	         ---
	         bundles project assets for distribution.

	         copies and processes asset files including
	         textures, models, audio, and configuration
	         files to output directory.

  */
  private async bundleAssets(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Bundling Assets',
      progress: 70,
      message: 'Bundling project assets...'
    });

    const assetsSourceDir = path.join(this.projectPath, 'assets');
    const assetsOutputDir = path.join(config.outputDirectory, 'assets');

    if (fs.existsSync(assetsSourceDir)) {
      await this.copyDirectory(assetsSourceDir, assetsOutputDir);
    }

    logger.debug('BUILD', 'Assets bundled', { assetsOutputDir });
  }

  /*

           copyScripts()
	         ---
	         copies script files to build output.

	         transfers compiled JavaScript and other
	         script files to final output location
	         with proper directory structure.

  */
  private async copyScripts(config: BuildConfiguration, onProgress?: BuildCallback): Promise<void> {
    onProgress?.({
      stage: 'Copying Scripts',
      progress: 80,
      message: 'Copying project scripts...'
    });

    const scriptsSourceDir = path.join(this.projectPath, 'scripts');
    const scriptsOutputDir = path.join(config.outputDirectory, 'scripts');

    if (fs.existsSync(scriptsSourceDir)) {
      await this.copyDirectory(scriptsSourceDir, scriptsOutputDir);
    }

    /* COPY SCENES */
    const scenesSourceDir = path.join(this.projectPath, 'scenes');
    const scenesOutputDir = path.join(config.outputDirectory, 'scenes');

    if (fs.existsSync(scenesSourceDir)) {
      await this.copyDirectory(scenesSourceDir, scenesOutputDir);
    }

    logger.debug('BUILD', 'Scripts and scenes copied');
  }

  /*

           generateIndexHtml()
	         ---
	         generates main HTML entry point file.

	         creates HTML document with proper script
	         references, asset links, and runtime
	         initialization code.

  */
  private async generateIndexHtml(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Generating HTML',
      progress: 85,
      message: 'Generating index.html...'
    });

    const htmlContent = this.getIndexHtmlTemplate(config);
    const htmlPath = path.join(config.outputDirectory, 'index.html');

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    logger.debug('BUILD', 'index.html generated', { htmlPath });
  }

  /*

           copyRuntimeFiles()
	         ---
	         copies runtime support files to output.

	         transfers WorldEnv runtime libraries,
	         engine files, and support modules
	         required for project execution.

  */
  private async copyRuntimeFiles(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Copying Runtime',
      progress: 90,
      message: 'Copying runtime files...'
    });

    const enginePath = path.dirname(this.projectPath);
    const runtimeFiles = ['package.json'];

    for (const file of runtimeFiles) {
      const sourcePath = path.join(enginePath, file);
      const outputPath = path.join(config.outputDirectory, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, outputPath);
      }
    }

    logger.debug('BUILD', 'Runtime files copied');
  }

  /*

           generateManifest()
	         ---
	         generates build manifest and metadata.

	         creates manifest file containing build
	         information, asset references, and
	         runtime configuration data.

  */
  private async generateManifest(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Generating Manifest',
      progress: 95,
      message: 'Generating build manifest...'
    });

    const manifest = {
      version: '1.0.0',
      buildTarget: config.buildTarget,
      optimizationLevel: config.optimizationLevel,
      entryScene: config.entryScene,
      buildTime: new Date().toISOString(),
      includeAssets: config.includeAssets,
      includeScripts: config.includeScripts,
      generateSourceMaps: config.generateSourceMaps,
      minifyOutput: config.minifyOutput
    };

    const manifestPath = path.join(config.outputDirectory, 'build-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    logger.debug('BUILD', 'Build manifest generated', { manifestPath });
  }

  /*

           copyDirectory()
	         ---
	         recursively copies directory structure.

	         performs deep copy of source directory
	         to destination with proper error handling
	         and permission preservation.

  */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const entries = fs.readdirSync(source);

    for (const entry of entries) {
      const sourcePath = path.join(source, entry);
      const destPath = path.join(destination, entry);

      if (fs.statSync(sourcePath).isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  /*

           getIndexHtmlTemplate()
	         ---
	         returns HTML template for index file generation.

	         provides base HTML structure with proper
	         meta tags, script references, and runtime
	         initialization boilerplate.

  */
  private getIndexHtmlTemplate(config: BuildConfiguration): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WORLDENV Application</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        #app {
            width: 100vw;
            height: 100vh;
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="app">
        <div id="loading">
            <h2>Loading WORLDENV Application...</h2>
            <p>Entry Scene: ${config.entryScene}</p>
        </div>
    </div>

    <!-- ENGINE SCRIPTS -->
    <script src="js/main.js"></script>
    ${config.buildTarget === 'wasm' ? '<script src="wasm/optimized.js"></script>' : ''}

    <script>
        // Application configuration
        window.WORLDENV_CONFIG = {
            entryScene: '${config.entryScene}',
            buildTarget: '${config.buildTarget}',
            assetsPath: './assets/',
            scenesPath: './scenes/'
        };

        // Initialize application
        document.addEventListener('DOMContentLoaded', function() {
            if (window.WORLDENV && window.WORLDENV.initialize) {
                window.WORLDENV.initialize(window.WORLDENV_CONFIG);
            }
        });
    </script>
</body>
</html>`;
  }

  /*

           cancelBuild()
	         ---
	         cancels currently running build operation.

	         terminates active build process and cleans
	         up resources. safe to call multiple times.

  */
  public cancelBuild(): void {
    if (this.currentBuild) {
      this.currentBuild.kill();
      this.currentBuild = null;
      logger.info('BUILD', 'Build cancelled');
    }
  }

  /*

           openBuildLocation()
	         ---
	         opens build output location in system file explorer.

	         launches system file manager to display
	         build output directory for user inspection.

  */
  public async openBuildLocation(outputPath: string): Promise<void> {
    const { shell } = require('electron');
    await shell.openPath(outputPath);
    logger.debug('BUILD', 'Build location opened', { outputPath });
  }
}

/* singleton instance for application-wide build management */
export const buildManager = new BuildManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
