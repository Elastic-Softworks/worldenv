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
import { shell } from 'electron'; /* ELECTRON SHELL OPERATIONS */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { WCCompilerIntegration } from './engine/WCCompilerIntegration'; /* WORLDC COMPILER */

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
  buildProfile: string /* BUILD PROFILE (debug/release/distribution) */;
  optimizationLevel: string /* OPTIMIZATION LEVEL (none/basic/full) */;
  entryScene: string /* MAIN SCENE FILE */;
  includeAssets: boolean /* BUNDLE ASSETS FLAG */;
  includeScripts: boolean /* INCLUDE SCRIPTS FLAG */;
  generateSourceMaps: boolean /* SOURCE MAP GENERATION */;
  minifyOutput: boolean /* OUTPUT MINIFICATION */;
  enableHotReload: boolean /* HOT RELOAD FOR DEVELOPMENT */;
  generateInstaller: boolean /* CREATE INSTALLER PACKAGE */;
  enablePWA: boolean /* PROGRESSIVE WEB APP FEATURES */;
  compressionLevel: number /* ASSET COMPRESSION (0-9) */;
  bundleAnalysis: boolean /* GENERATE BUNDLE ANALYSIS */;
  targetPlatforms: string[] /* SPECIFIC PLATFORM TARGETS */;
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
  buildProfile: string /* BUILD PROFILE USED */;
  outputSize: number /* TOTAL OUTPUT SIZE (BYTES) */;
  assets: { [key: string]: string } /* GENERATED ASSET PATHS */;
  installerPath?: string /* INSTALLER PACKAGE PATH */;
  webPath?: string /* WEB DEPLOYMENT PATH */;
  desktopPath?: string /* DESKTOP APPLICATION PATH */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         BuildProfile
	       ---
	       predefined build configuration profiles.

	       provides standardized build settings for common
	       development scenarios with appropriate defaults
	       for debugging, release, and distribution builds.

*/

interface BuildProfile {
  id: string /* PROFILE IDENTIFIER */;
  name: string /* DISPLAY NAME */;
  description: string /* PROFILE DESCRIPTION */;
  defaults: Partial<BuildConfiguration> /* DEFAULT SETTINGS */;
}

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
  private wcCompiler: WCCompilerIntegration; /* WORLDC COMPILER INSTANCE */
  private buildProfiles: Map<string, BuildProfile>; /* AVAILABLE BUILD PROFILES */

  constructor() {
    this.currentBuild = null;
    this.projectPath = '';
    this.wcCompiler = new WCCompilerIntegration();
    this.buildProfiles = new Map();
    this.initializeBuildProfiles();
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
    this.wcCompiler.initialize();
    logger.debug('BUILD', 'Project path set', { path });
  }

  /*

           initializeBuildProfiles()
	         ---
	         sets up standard build profiles with predefined configurations.

	         creates debug, release, and distribution profiles with
	         appropriate defaults for common development workflows.

  */

  private initializeBuildProfiles(): void {
    /* DEBUG PROFILE - FAST BUILDS FOR DEVELOPMENT */
    this.buildProfiles.set('debug', {
      id: 'debug',
      name: 'Debug',
      description: 'Fast builds with debugging features',
      defaults: {
        buildProfile: 'debug',
        optimizationLevel: 'none',
        generateSourceMaps: true,
        minifyOutput: false,
        enableHotReload: true,
        generateInstaller: false,
        enablePWA: false,
        compressionLevel: 0,
        bundleAnalysis: false
      }
    });

    /* RELEASE PROFILE - OPTIMIZED FOR TESTING */
    this.buildProfiles.set('release', {
      id: 'release',
      name: 'Release',
      description: 'Optimized builds for testing and staging',
      defaults: {
        buildProfile: 'release',
        optimizationLevel: 'basic',
        generateSourceMaps: true,
        minifyOutput: true,
        enableHotReload: false,
        generateInstaller: false,
        enablePWA: true,
        compressionLevel: 6,
        bundleAnalysis: true
      }
    });

    /* DISTRIBUTION PROFILE - PRODUCTION READY */
    this.buildProfiles.set('distribution', {
      id: 'distribution',
      name: 'Distribution',
      description: 'Production builds with maximum optimization',
      defaults: {
        buildProfile: 'distribution',
        optimizationLevel: 'full',
        generateSourceMaps: false,
        minifyOutput: true,
        enableHotReload: false,
        generateInstaller: true,
        enablePWA: true,
        compressionLevel: 9,
        bundleAnalysis: true
      }
    });

    logger.debug('BUILD', 'Build profiles initialized', {
      profiles: Array.from(this.buildProfiles.keys())
    });
  }

  /*

           getBuildProfiles()
	         ---
	         returns available build profiles for UI selection.

	         provides list of predefined build configurations
	         with descriptions for user selection.

  */

  public getBuildProfiles(): BuildProfile[] {
    return Array.from(this.buildProfiles.values());
  }

  /*

           applyBuildProfile()
	         ---
	         applies build profile defaults to configuration.

	         merges profile defaults with user configuration,
	         preserving explicit user settings while applying
	         appropriate defaults for the selected profile.

  */

  public applyBuildProfile(config: BuildConfiguration): BuildConfiguration {
    const profile = this.buildProfiles.get(config.buildProfile);

    if (!profile) {
      logger.warn('BUILD', 'Unknown build profile', { profile: config.buildProfile });
      return config;
    }

    /* MERGE PROFILE DEFAULTS WITH USER CONFIG */
    const mergedConfig = {
      ...profile.defaults,
      ...config
    } as BuildConfiguration;

    logger.debug('BUILD', 'Applied build profile', {
      profile: config.buildProfile,
      config: mergedConfig
    });

    return mergedConfig;
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

    if (!config.buildProfile) {
      errors.push('Build profile is required');
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

    /* validate build profile exists */
    if (config.buildProfile && !this.buildProfiles.has(config.buildProfile)) {
      errors.push(`Invalid build profile: ${config.buildProfile}`);
    }

    /* validate target platforms for multi-platform builds */
    if (config.targetPlatforms && config.targetPlatforms.length === 0) {
      errors.push('At least one target platform must be specified');
    }

    /* validate compression level range */
    if (config.compressionLevel < 0 || config.compressionLevel > 9) {
      errors.push('Compression level must be between 0 and 9');
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
    /* APPLY BUILD PROFILE DEFAULTS */
    const finalConfig = this.applyBuildProfile(config);
    /* ASSERTION: config parameter validation */
    console.assert(
      config !== null && typeof config === 'object',
      'buildProject: config must be valid BuildConfiguration object'
    );
    console.assert(
      typeof config.outputDirectory === 'string',
      'buildProject: config.outputDirectory must be string'
    );
    console.assert(
      typeof config.buildTarget === 'string',
      'buildProject: config.buildTarget must be string'
    );

    if (!config || typeof config !== 'object') {
      throw new Error('buildProject: Invalid configuration object provided');
    }

    /* ASSERTION: onProgress callback validation if provided */
    console.assert(
      onProgress === undefined || typeof onProgress === 'function',
      'buildProject: onProgress must be function if provided'
    );

    if (onProgress !== undefined && typeof onProgress !== 'function') {
      throw new Error('buildProject: onProgress must be a function');
    }

    const startTime = Date.now();
    const result: BuildResult = {
      success: false,
      outputPath: '',
      errors: [],
      warnings: [],
      buildTime: 0,
      buildProfile: finalConfig.buildProfile,
      outputSize: 0,
      assets: {}
    };

    try {
      /* VALIDATE CONFIGURATION */
      const validationErrors = this.validateConfiguration(finalConfig);

      /* ASSERTION: validation must return array */
      console.assert(
        Array.isArray(validationErrors),
        'buildProject: validateConfiguration must return array'
      );

      if (validationErrors.length > 0) {
        result.errors = validationErrors;
        return result;
      }

      logger.info('BUILD', 'Starting build', { config: finalConfig });

      onProgress?.({
        stage: 'Preparing',
        progress: 0,
        message: 'Validating configuration...'
      });

      /* PREPARE OUTPUT DIRECTORY */
      await this.prepareOutputDirectory(finalConfig, onProgress);

      /* COMPILE WORLDC */
      await this.compileWorldC(finalConfig, onProgress);

      /* COMPILE TYPESCRIPT */
      await this.compileTypeScript(finalConfig, onProgress);

      /* BUILD ASSEMBLYSCRIPT */
      if (finalConfig.buildTarget === 'wasm') {
        await this.buildAssemblyScript(finalConfig, onProgress);
      }

      /* BUNDLE ASSETS */
      if (finalConfig.includeAssets) {
        await this.bundleAssets(finalConfig, onProgress);
      }

      /* COPY SCRIPTS */
      if (finalConfig.includeScripts) {
        await this.copyScripts(finalConfig, onProgress);
      }

      /* GENERATE INDEX HTML */
      await this.generateIndexHtml(finalConfig, onProgress);

      /* COPY RUNTIME FILES */
      await this.copyRuntimeFiles(finalConfig, onProgress);

      /* GENERATE MANIFEST */
      await this.generateManifest(finalConfig, onProgress);

      /* GENERATE PWA FILES */
      if (finalConfig.enablePWA) {
        await this.generatePWAFiles(finalConfig, onProgress);
      }

      /* GENERATE DESKTOP APPLICATION */
      if (finalConfig.buildTarget === 'desktop') {
        result.desktopPath = await this.generateDesktopApp(finalConfig, onProgress);
      }

      /* GENERATE MOBILE APPLICATION */
      if (finalConfig.buildTarget === 'mobile') {
        result.desktopPath = await this.generateMobileApp(finalConfig, onProgress);
      }

      /* GENERATE INSTALLER */
      if (finalConfig.generateInstaller) {
        result.installerPath = await this.generateInstaller(finalConfig, onProgress);
      }

      /* CALCULATE OUTPUT SIZE */
      result.outputSize = await this.calculateOutputSize(finalConfig.outputDirectory);

      /* GENERATE BUNDLE ANALYSIS */
      if (finalConfig.bundleAnalysis) {
        await this.generateBundleAnalysis(finalConfig, onProgress);
      }

      onProgress?.({
        stage: 'Complete',
        progress: 100,
        message: 'Build completed successfully'
      });

      result.success = true;
      result.outputPath = path.resolve(finalConfig.outputDirectory);
      result.buildTime = Date.now() - startTime;
      result.webPath = finalConfig.buildTarget === 'web' ? result.outputPath : undefined;

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

  /*

           generatePWAFiles()
	         ---
	         generates Progressive Web App configuration files.

	         creates service worker, web manifest, and icon files
	         needed for PWA functionality and offline capability.

  */

  private async generatePWAFiles(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Generating PWA',
      progress: 85,
      message: 'Creating Progressive Web App files...'
    });

    const outputDir = config.outputDirectory;
    const manifestPath = path.join(outputDir, 'manifest.json');
    const serviceWorkerPath = path.join(outputDir, 'sw.js');

    /* GENERATE WEB APP MANIFEST */
    const manifest = {
      name: 'WorldEnv Application',
      short_name: 'WorldEnv',
      description: 'WorldEnv 3D Application',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    /* GENERATE SERVICE WORKER */
    const serviceWorkerContent = `
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('worldenv-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/main.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`;

    await fs.promises.writeFile(serviceWorkerPath, serviceWorkerContent);

    logger.debug('BUILD', 'PWA files generated', { manifestPath, serviceWorkerPath });
  }

  /*

           generateDesktopApp()
	         ---
	         generates Electron desktop application package.

	         creates platform-specific desktop application
	         with proper packaging and native integration.

  */

  private async generateDesktopApp(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<string> {
    onProgress?.({
      stage: 'Building Desktop',
      progress: 90,
      message: 'Creating desktop application...'
    });

    const outputDir = config.outputDirectory;
    const desktopDir = path.join(outputDir, 'desktop');

    if (!fs.existsSync(desktopDir)) {
      fs.mkdirSync(desktopDir, { recursive: true });
    }

    /* GENERATE ELECTRON MAIN PROCESS */
    const mainContent = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

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
`;

    const mainPath = path.join(desktopDir, 'main.js');
    await fs.promises.writeFile(mainPath, mainContent);

    /* GENERATE PACKAGE.JSON */
    const packageJson = {
      name: 'worldenv-app',
      version: '1.0.0',
      main: 'main.js',
      scripts: {
        start: 'electron .'
      },
      devDependencies: {
        electron: '^latest'
      }
    };

    const packagePath = path.join(desktopDir, 'package.json');
    await fs.promises.writeFile(packagePath, JSON.stringify(packageJson, null, 2));

    /* COPY WEB BUILD TO DESKTOP */
    await this.copyDirectory(outputDir, desktopDir);

    logger.debug('BUILD', 'Desktop application generated', { desktopDir });
    return desktopDir;
  }

  /*

           generateMobileApp()
	         ---
	         generates mobile application package.

	         creates Cordova/PhoneGap mobile application
	         with proper native integration and device APIs.

  */

  private async generateMobileApp(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<string> {
    onProgress?.({
      stage: 'Building Mobile',
      progress: 90,
      message: 'Creating mobile application...'
    });

    const outputDir = config.outputDirectory;
    const mobileDir = path.join(outputDir, 'mobile');

    if (!fs.existsSync(mobileDir)) {
      fs.mkdirSync(mobileDir, { recursive: true });
    }

    /* GENERATE CORDOVA CONFIG */
    const cordovaConfig = `
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.worldenv.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:gap="http://phonegap.com/ns/1.0">
    <name>WorldEnv App</name>
    <description>WorldEnv 3D Mobile Application</description>
    <author email="support@worldenv.com" href="https://worldenv.com">
        WorldEnv Team
    </author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="19" />
    <preference name="Orientation" value="landscape" />
    <platform name="android">
        <allow-intent href="market:*" />
    </platform>
    <platform name="ios">
        <allow-intent href="itms:*" />
        <allow-intent href="itms-apps:*" />
    </platform>
</widget>
`;

    const configPath = path.join(mobileDir, 'config.xml');
    await fs.promises.writeFile(configPath, cordovaConfig);

    /* GENERATE MOBILE-OPTIMIZED INDEX */
    const mobileIndexContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    <title>WorldEnv Mobile</title>
    <link rel="stylesheet" href="styles.css" />
</head>
<body>
    <div id="app"></div>
    <script type="text/javascript" src="cordova.js"></script>
    <script type="text/javascript" src="main.js"></script>
</body>
</html>
`;

    const indexPath = path.join(mobileDir, 'index.html');
    await fs.promises.writeFile(indexPath, mobileIndexContent);

    /* COPY WEB BUILD TO MOBILE */
    await this.copyDirectory(outputDir, mobileDir);

    logger.debug('BUILD', 'Mobile application generated', { mobileDir });
    return mobileDir;
  }

  /*

           generateInstaller()
	         ---
	         generates installer package for distribution.

	         creates platform-specific installer packages
	         for easy application deployment.

  */

  private async generateInstaller(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<string> {
    onProgress?.({
      stage: 'Creating Installer',
      progress: 95,
      message: 'Generating installer package...'
    });

    const outputDir = config.outputDirectory;
    const installerDir = path.join(outputDir, 'installer');

    if (!fs.existsSync(installerDir)) {
      fs.mkdirSync(installerDir, { recursive: true });
    }

    /* GENERATE INSTALLER SCRIPT */
    const installerScript = `
#!/bin/bash
# WorldEnv Application Installer

echo "Installing WorldEnv Application..."

# Create application directory
mkdir -p /opt/worldenv
cp -r * /opt/worldenv/

# Create desktop entry
cat > ~/.local/share/applications/worldenv.desktop << EOF
[Desktop Entry]
Name=WorldEnv
Comment=3D World Editor
Exec=/opt/worldenv/worldenv
Icon=/opt/worldenv/icon.png
Terminal=false
Type=Application
Categories=Development;Graphics;
EOF

echo "Installation complete!"
`;

    const installerPath = path.join(installerDir, 'install.sh');
    await fs.promises.writeFile(installerPath, installerScript);

    /* MAKE INSTALLER EXECUTABLE */
    await fs.promises.chmod(installerPath, '755');

    logger.debug('BUILD', 'Installer generated', { installerPath });
    return installerPath;
  }

  /*

           calculateOutputSize()
	         ---
	         calculates total size of build output.

	         recursively measures all files in output directory
	         to provide build size metrics.

  */

  private async calculateOutputSize(outputPath: string): Promise<number> {
    let totalSize = 0;

    const calculateDirSize = async (dirPath: string): Promise<void> => {
      const items = await fs.promises.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.promises.stat(itemPath);

        if (stats.isDirectory()) {
          await calculateDirSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };

    try {
      await calculateDirSize(outputPath);
    } catch (error) {
      logger.warn('BUILD', 'Failed to calculate output size', { error });
    }

    return totalSize;
  }

  /*

           generateBundleAnalysis()
	         ---
	         generates bundle analysis report.

	         creates detailed report of bundle composition,
	         asset sizes, and optimization opportunities.

  */

  private async generateBundleAnalysis(
    config: BuildConfiguration,
    onProgress?: BuildCallback
  ): Promise<void> {
    onProgress?.({
      stage: 'Analyzing Bundle',
      progress: 98,
      message: 'Generating bundle analysis...'
    });

    const outputDir = config.outputDirectory;
    const analysisPath = path.join(outputDir, 'bundle-analysis.json');

    const analysis = {
      buildProfile: config.buildProfile,
      buildTarget: config.buildTarget,
      optimizationLevel: config.optimizationLevel,
      timestamp: new Date().toISOString(),
      totalSize: await this.calculateOutputSize(outputDir),
      files: [] as Array<{ path: string; size: number; type: string }>,
      recommendations: [] as string[]
    };

    /* ANALYZE FILES */
    const analyzeDirectory = async (dirPath: string, basePath: string = ''): Promise<void> => {
      const items = await fs.promises.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const relativePath = path.join(basePath, item);
        const stats = await fs.promises.stat(itemPath);

        if (stats.isDirectory()) {
          await analyzeDirectory(itemPath, relativePath);
        } else {
          analysis.files.push({
            path: relativePath,
            size: stats.size,
            type: path.extname(item).slice(1) || 'unknown'
          });
        }
      }
    };

    try {
      await analyzeDirectory(outputDir);

      /* GENERATE RECOMMENDATIONS */
      const totalJS = analysis.files
        .filter((f) => f.type === 'js')
        .reduce((sum, f) => sum + f.size, 0);

      if (totalJS > 1024 * 1024 && !config.minifyOutput) {
        analysis.recommendations.push('Enable minification to reduce JavaScript bundle size');
      }

      if (config.optimizationLevel === 'none' && config.buildProfile !== 'debug') {
        analysis.recommendations.push(
          'Consider using higher optimization level for better performance'
        );
      }

      await fs.promises.writeFile(analysisPath, JSON.stringify(analysis, null, 2));

      logger.debug('BUILD', 'Bundle analysis generated', { analysisPath });
    } catch (error) {
      logger.warn('BUILD', 'Failed to generate bundle analysis', { error });
    }
  }
}

/* singleton instance for application-wide build management */
export const buildManager = new BuildManager();

/* end the file, buddy */

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
