/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         pwa-deployment.ts
           ---
           PWA deployment implementation for WORLDSRC language.

           handles compilation and deployment of WORLDSRC projects
           as Progressive Web Applications with offline capabilities,
           service workers, app manifests, and installable features.

*/

import {
  BaseDeploymentTarget,
  PlatformTarget,
  DeploymentOptions,
  DeploymentResult,
  BuildArtifact,
  OptimizationConfiguration,
  OptimizationProfile,
  SecurityConfiguration,
  BuildStage,
} from './base-deployment';

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         PWADeploymentOptions
           ---
           PWA-specific deployment configuration options.

*/

export interface PWADeploymentOptions
  extends Omit<DeploymentOptions, 'optimization'> {
  manifest: {
    name: string;
    shortName: string;
    description: string;
    startUrl: string;
    display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
    orientation: 'any' | 'natural' | 'landscape' | 'portrait';
    themeColor: string;
    backgroundColor: string;
    scope?: string;
    categories?: string[];
    icons: Array<{
      src: string;
      sizes: string;
      type: string;
      purpose?: 'any' | 'maskable' | 'monochrome';
    }>;
    screenshots?: Array<{
      src: string;
      sizes: string;
      type: string;
      platform?: 'narrow' | 'wide';
      label?: string;
    }>;
    shortcuts?: Array<{
      name: string;
      shortName?: string;
      description?: string;
      url: string;
      icons?: Array<{
        src: string;
        sizes: string;
        type: string;
      }>;
    }>;
  };
  serviceWorker: {
    enabled: boolean;
    strategy:
      | 'cache-first'
      | 'network-first'
      | 'stale-while-revalidate'
      | 'network-only'
      | 'cache-only';
    cacheName?: string;
    runtimeCaching?: Array<{
      urlPattern: string;
      handler: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
      };
    }>;
    skipWaiting?: boolean;
    clientsClaim?: boolean;
    cleanupOutdatedCaches?: boolean;
  };
  features: {
    offlineSupport: boolean;
    pushNotifications?: boolean;
    backgroundSync?: boolean;
    webShare?: boolean;
    installPrompt?: boolean;
    badging?: boolean;
    shortcuts?: boolean;
    fileHandling?: Array<{
      action: string;
      accept: Record<string, string[]>;
    }>;
  };
  optimization: OptimizationProfile;
  pwaOptimization?: {
    preload?: string[];
    prefetch?: string[];
    criticalCSS?: boolean;
    inlineSmallAssets?: boolean;
    lazyLoadImages?: boolean;
    compressionLevel?: number;
    bundleSplitting?: boolean;
  };
  analytics?: {
    trackInstalls?: boolean;
    trackUsage?: boolean;
    trackOfflineUsage?: boolean;
    customEvents?: boolean;
  };
  security?: SecurityConfiguration & {
    contentSecurityPolicy?: string;
    permissionsPolicy?: string;
    crossOriginEmbedderPolicy?: string;
  };
}

/*

         PWABuildResult
           ---
           result of PWA deployment build process.

*/

export interface PWABuildResult extends DeploymentResult {
  manifestFile: string;
  serviceWorkerFile: string;
  htmlFiles: string[];
  cssFiles: string[];
  jsFiles: string[];
  iconFiles: string[];
  screenshotFiles: string[];
  cacheableAssets: string[];
  installability: {
    isInstallable: boolean;
    requirements: string[];
    warnings: string[];
  };
  offlineSupport: {
    enabled: boolean;
    cachedResources: string[];
    offlinePages: string[];
  };
  features: {
    pushNotifications: boolean;
    backgroundSync: boolean;
    webShare: boolean;
    badging: boolean;
    fileHandling: boolean;
  };
}

/*
    ====================================
         --- PWA DEPLOYMENT ---
    ====================================
*/

/*

         PWADeployment
           ---
           concrete implementation for PWA deployment.
           compiles WORLDSRC to optimized Progressive Web App.

*/

export class PWADeployment extends BaseDeploymentTarget {
  public readonly platform = PlatformTarget.WEB;
  public readonly name = 'PWA Deployment';
  public readonly version = '1.0.0';

  private pwaOptions: PWADeploymentOptions;

  constructor(options: PWADeploymentOptions) {
    super(options);
    this.pwaOptions = options;
  }

  /*

           deploy()
             ---
           main deployment method for PWA targets.
           orchestrates the entire PWA build pipeline.

  */

  public async deploy(): Promise<PWABuildResult> {
    this.clearDiagnostics();

    try {
      /* stage 1: initialization */
      await this.initializePWABuild();

      /* stage 2: source preparation */
      const sourceFiles = await this.preparePWASources();

      /* stage 3: web compilation */
      const compiledFiles = await this.compileForPWA(sourceFiles);

      /* stage 4: asset optimization */
      const optimizedAssets = await this.optimizePWAAssets(compiledFiles);

      /* stage 5: manifest generation */
      const manifestFile = await this.generateWebAppManifest();

      /* stage 6: service worker generation */
      const serviceWorkerFile =
        await this.generateServiceWorker(optimizedAssets);

      /* stage 7: HTML generation */
      const htmlFiles = await this.generatePWAHTML(optimizedAssets);

      /* stage 8: icon processing */
      const iconFiles = await this.processPWAIcons();

      /* stage 9: screenshot generation */
      const screenshotFiles = await this.generateScreenshots();

      /* stage 10: offline page creation */
      const offlinePages = await this.createOfflinePages();

      /* stage 11: installability validation */
      const installabilityCheck = await this.validateInstallability();

      /* stage 12: finalization */
      const finalResult = await this.finalizePWABuild({
        manifest: manifestFile,
        serviceWorker: serviceWorkerFile,
        html: htmlFiles,
        assets: optimizedAssets,
        icons: iconFiles,
        screenshots: screenshotFiles,
        offline: offlinePages,
        installability: installabilityCheck,
      });

      return finalResult;
    } catch (error) {
      this.addError(`PWA deployment failed: ${error}`, BuildStage.FINALIZATION);

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
        manifestFile: '',
        serviceWorkerFile: '',
        htmlFiles: [],
        cssFiles: [],
        jsFiles: [],
        iconFiles: [],
        screenshotFiles: [],
        cacheableAssets: [],
        installability: {
          isInstallable: false,
          requirements: [],
          warnings: [],
        },
        offlineSupport: {
          enabled: false,
          cachedResources: [],
          offlinePages: [],
        },
        features: {
          pushNotifications: false,
          backgroundSync: false,
          webShare: false,
          badging: false,
          fileHandling: false,
        },
      };
    }
  }

  /*

           initializePWABuild()
             ---
           initializes PWA build environment and validates configuration.

  */

  private async initializePWABuild(): Promise<void> {
    console.log('Initializing PWA deployment...');

    /* validate manifest */
    if (!this.pwaOptions.manifest.name) {
      this.addError('PWA manifest name is required', BuildStage.INITIALIZATION);
      return;
    }

    if (!this.pwaOptions.manifest.startUrl) {
      this.addError(
        'PWA manifest start_url is required',
        BuildStage.INITIALIZATION
      );
      return;
    }

    if (this.pwaOptions.manifest.icons.length === 0) {
      this.addWarning(
        'PWA should have at least one icon',
        BuildStage.INITIALIZATION
      );
    }

    /* validate service worker configuration */
    if (this.pwaOptions.serviceWorker.enabled) {
      console.log(
        `Using service worker strategy: ${this.pwaOptions.serviceWorker.strategy}`
      );
    } else {
      this.addWarning(
        'Service worker disabled - PWA features will be limited',
        BuildStage.INITIALIZATION
      );
    }

    /* validate PWA features */
    if (
      this.pwaOptions.features.offlineSupport &&
      !this.pwaOptions.serviceWorker.enabled
    ) {
      this.addWarning(
        'Offline support requires service worker',
        BuildStage.INITIALIZATION
      );
    }

    /* check security requirements */
    if (this.pwaOptions.security?.enableHTTPS === false) {
      this.addWarning(
        'PWAs require HTTPS for full functionality',
        BuildStage.INITIALIZATION
      );
    }

    console.log('PWA deployment initialization complete');
  }

  /*

           preparePWASources()
             ---
           prepares source files for PWA compilation.

  */

  private async preparePWASources(): Promise<BuildArtifact[]> {
    console.log('Preparing PWA sources...');

    const sourceFiles: BuildArtifact[] = [];

    /* scan for WORLDSRC files */
    const worldsrcFiles = await this.scanForFiles(
      this.options.sourceDirectory,
      '.ws'
    );

    for (const file of worldsrcFiles) {
      sourceFiles.push({
        id: `pwa-source-${sourceFiles.length}`,
        type: 'javascript',
        path: file,
        size: await this.getFileSize(file),
        metadata: {
          language: 'worldsrc',
          needsCompilation: true,
          pwaOptimizable: true,
        },
      });
    }

    /* scan for web assets */
    const assetFiles = await this.scanForFiles(
      this.options.sourceDirectory,
      '.png',
      '.jpg',
      '.gif',
      '.svg',
      '.webp',
      '.css',
      '.html'
    );

    for (const file of assetFiles) {
      sourceFiles.push({
        id: `pwa-asset-${sourceFiles.length}`,
        type: 'asset',
        path: file,
        size: await this.getFileSize(file),
        metadata: {
          needsOptimization: true,
          cacheable: true,
        },
      });
    }

    console.log(`Prepared ${sourceFiles.length} source files for PWA`);
    return sourceFiles;
  }

  /*

           compileForPWA()
             ---
           compiles source files optimized for PWA.

  */

  private async compileForPWA(
    sourceFiles: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Compiling for PWA...');

    const compiledFiles: BuildArtifact[] = [];

    for (const file of sourceFiles) {
      if (file.metadata?.needsCompilation) {
        const compiledContent = await this.compileWorldSrcForPWA(file.path);

        compiledFiles.push({
          id: `pwa-compiled-${compiledFiles.length}`,
          type: 'javascript',
          path: file.path.replace('.ws', '.js'),
          size: compiledContent.length,
          metadata: {
            originalFile: file.path,
            compiledForPWA: true,
            supportsOffline: true,
          },
        });
      } else {
        compiledFiles.push(file);
      }
    }

    console.log(`Compiled ${compiledFiles.length} files for PWA`);
    return compiledFiles;
  }

  /*

           optimizePWAAssets()
             ---
           applies PWA-specific optimizations to assets.

  */

  private async optimizePWAAssets(
    compiledFiles: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Optimizing PWA assets...');

    const optimizedAssets: BuildArtifact[] = [];

    for (const file of compiledFiles) {
      const optimized = await this.optimizePWAFile(file);
      optimizedAssets.push(optimized);
    }

    /* apply PWA-specific optimizations */
    if (this.pwaOptions.pwaOptimization?.bundleSplitting) {
      await this.applySplitBundles(optimizedAssets);
    }

    if (this.pwaOptions.pwaOptimization?.criticalCSS) {
      await this.extractCriticalCSS(optimizedAssets);
    }

    if (this.pwaOptions.pwaOptimization?.lazyLoadImages) {
      await this.setupLazyLoading(optimizedAssets);
    }

    console.log('PWA asset optimization complete');
    return optimizedAssets;
  }

  /*

           generateWebAppManifest()
             ---
           generates PWA web app manifest file.

  */

  private async generateWebAppManifest(): Promise<BuildArtifact> {
    console.log('Generating web app manifest...');

    const manifestContent = JSON.stringify(
      {
        name: this.pwaOptions.manifest.name,
        short_name: this.pwaOptions.manifest.shortName,
        description: this.pwaOptions.manifest.description,
        start_url: this.pwaOptions.manifest.startUrl,
        display: this.pwaOptions.manifest.display,
        orientation: this.pwaOptions.manifest.orientation,
        theme_color: this.pwaOptions.manifest.themeColor,
        background_color: this.pwaOptions.manifest.backgroundColor,
        scope: this.pwaOptions.manifest.scope || '/',
        categories: this.pwaOptions.manifest.categories || ['games'],
        icons: this.pwaOptions.manifest.icons,
        screenshots: this.pwaOptions.manifest.screenshots,
        shortcuts: this.pwaOptions.manifest.shortcuts,
        file_handlers: this.pwaOptions.features.fileHandling || [],
        protocol_handlers: [],
        related_applications: [],
        prefer_related_applications: false,
        edge_side_panel: {
          preferred_width: 400,
        },
      },
      null,
      2
    );

    const manifestFile: BuildArtifact = {
      id: 'pwa-manifest',
      type: 'manifest',
      path: `${this.options.outputDirectory}/manifest.json`,
      size: manifestContent.length,
      metadata: {
        isPWAManifest: true,
        manifestVersion: '1.0',
      },
    };

    console.log('Web app manifest generated');
    return manifestFile;
  }

  /*

           generateServiceWorker()
             ---
           generates service worker for PWA functionality.

  */

  private async generateServiceWorker(
    assets: BuildArtifact[]
  ): Promise<BuildArtifact> {
    if (!this.pwaOptions.serviceWorker.enabled) {
      return {
        id: 'empty-sw',
        type: 'javascript',
        path: '',
        size: 0,
        metadata: { disabled: true },
      };
    }

    console.log('Generating service worker...');

    const cacheableAssets = assets
      .filter((a) => a.metadata?.cacheable)
      .map((a) => this.getRelativePath(a.path));

    const serviceWorkerContent =
      this.createServiceWorkerContent(cacheableAssets);

    const serviceWorkerFile: BuildArtifact = {
      id: 'pwa-service-worker',
      type: 'javascript',
      path: `${this.options.outputDirectory}/sw.js`,
      size: serviceWorkerContent.length,
      metadata: {
        isServiceWorker: true,
        strategy: this.pwaOptions.serviceWorker.strategy,
        cachedAssets: cacheableAssets,
        features: {
          offlineSupport: this.pwaOptions.features.offlineSupport,
          backgroundSync: this.pwaOptions.features.backgroundSync,
          pushNotifications: this.pwaOptions.features.pushNotifications,
        },
      },
    };

    console.log('Service worker generated');
    return serviceWorkerFile;
  }

  /*

           generatePWAHTML()
             ---
           generates HTML files optimized for PWA.

  */

  private async generatePWAHTML(
    assets: BuildArtifact[]
  ): Promise<BuildArtifact[]> {
    console.log('Generating PWA HTML...');

    const htmlFiles: BuildArtifact[] = [];

    /* get JS and CSS files */
    const jsFiles = assets.filter((f) => f.type === 'javascript');
    const cssFiles = assets.filter((f) => f.type === 'css');

    /* generate main index.html */
    const indexContent = await this.generatePWAIndexHTML(jsFiles, cssFiles);

    htmlFiles.push({
      id: 'pwa-index',
      type: 'html',
      path: `${this.options.outputDirectory}/index.html`,
      size: indexContent.length,
      metadata: {
        isPWAMain: true,
        includesManifest: true,
        includesServiceWorker: true,
      },
    });

    console.log(`Generated ${htmlFiles.length} PWA HTML files`);
    return htmlFiles;
  }

  /*

           processPWAIcons()
             ---
           processes and optimizes PWA icons.

  */

  private async processPWAIcons(): Promise<BuildArtifact[]> {
    console.log('Processing PWA icons...');

    const iconFiles: BuildArtifact[] = [];

    /* process each icon from manifest */
    for (const icon of this.pwaOptions.manifest.icons) {
      const processedIcon = await this.processIcon(icon);
      if (processedIcon) {
        iconFiles.push(processedIcon);
      }
    }

    /* generate favicon if not present */
    const hasFavicon = iconFiles.some((f) => f.path.includes('favicon'));
    if (!hasFavicon) {
      const favicon = await this.generateFavicon();
      if (favicon) {
        iconFiles.push(favicon);
      }
    }

    console.log(`Processed ${iconFiles.length} PWA icons`);
    return iconFiles;
  }

  /*

           generateScreenshots()
             ---
           generates screenshots for PWA store listings.

  */

  private async generateScreenshots(): Promise<BuildArtifact[]> {
    if (!this.pwaOptions.manifest.screenshots) {
      return [];
    }

    console.log('Generating PWA screenshots...');

    const screenshotFiles: BuildArtifact[] = [];

    for (const screenshot of this.pwaOptions.manifest.screenshots) {
      const generatedScreenshot = await this.generateScreenshot(screenshot);
      if (generatedScreenshot) {
        screenshotFiles.push(generatedScreenshot);
      }
    }

    console.log(`Generated ${screenshotFiles.length} PWA screenshots`);
    return screenshotFiles;
  }

  /*

           createOfflinePages()
             ---
           creates offline fallback pages.

  */

  private async createOfflinePages(): Promise<BuildArtifact[]> {
    if (!this.pwaOptions.features.offlineSupport) {
      return [];
    }

    console.log('Creating offline pages...');

    const offlinePages: BuildArtifact[] = [];

    /* create main offline page */
    const offlineContent = await this.generateOfflineHTML();
    offlinePages.push({
      id: 'pwa-offline',
      type: 'html',
      path: `${this.options.outputDirectory}/offline.html`,
      size: offlineContent.length,
      metadata: {
        isOfflinePage: true,
      },
    });

    /* create offline game state page if applicable */
    const offlineGameContent = await this.generateOfflineGameHTML();
    offlinePages.push({
      id: 'pwa-offline-game',
      type: 'html',
      path: `${this.options.outputDirectory}/offline-game.html`,
      size: offlineGameContent.length,
      metadata: {
        isOfflineGamePage: true,
      },
    });

    console.log(`Created ${offlinePages.length} offline pages`);
    return offlinePages;
  }

  /*

           validateInstallability()
             ---
           validates PWA installability requirements.

  */

  private async validateInstallability(): Promise<{
    isInstallable: boolean;
    requirements: string[];
    warnings: string[];
  }> {
    console.log('Validating PWA installability...');

    const requirements: string[] = [];
    const warnings: string[] = [];

    /* check manifest requirements */
    if (!this.pwaOptions.manifest.name) {
      requirements.push('Manifest must include name');
    }

    if (!this.pwaOptions.manifest.shortName) {
      warnings.push('Short name recommended for better display');
    }

    if (!this.pwaOptions.manifest.startUrl) {
      requirements.push('Manifest must include start_url');
    }

    if (this.pwaOptions.manifest.display === 'browser') {
      warnings.push('Display mode "browser" may affect installability');
    }

    /* check icon requirements */
    const hasRequiredIcon = this.pwaOptions.manifest.icons.some((icon) => {
      const sizes = icon.sizes.split('x');
      const size = parseInt(sizes[0]);
      return size >= 192;
    });

    if (!hasRequiredIcon) {
      requirements.push('At least one icon 192x192 or larger required');
    }

    /* check service worker */
    if (!this.pwaOptions.serviceWorker.enabled) {
      requirements.push('Service worker required for full PWA functionality');
    }

    /* check HTTPS */
    if (this.pwaOptions.security?.enableHTTPS === false) {
      requirements.push('HTTPS required for PWA installation');
    }

    const isInstallable = requirements.length === 0;

    console.log(
      `PWA installability check complete (installable: ${isInstallable})`
    );
    return { isInstallable, requirements, warnings };
  }

  /*

           finalizePWABuild()
             ---
           finalizes PWA build and generates result.

  */

  private async finalizePWABuild(buildData: {
    manifest: BuildArtifact;
    serviceWorker: BuildArtifact;
    html: BuildArtifact[];
    assets: BuildArtifact[];
    icons: BuildArtifact[];
    screenshots: BuildArtifact[];
    offline: BuildArtifact[];
    installability: {
      isInstallable: boolean;
      requirements: string[];
      warnings: string[];
    };
  }): Promise<PWABuildResult> {
    console.log('Finalizing PWA build...');

    const allArtifacts = [
      buildData.manifest,
      buildData.serviceWorker,
      ...buildData.html,
      ...buildData.assets,
      ...buildData.icons,
      ...buildData.screenshots,
      ...buildData.offline,
    ].filter((a) => a.size > 0);

    const totalSize = allArtifacts.reduce(
      (sum, artifact) => sum + artifact.size,
      0
    );

    const result: PWABuildResult = {
      success: true,
      platform: this.platform,
      mode: this.options.mode,
      artifacts: allArtifacts,
      metrics: {
        totalTime: Date.now(),
        buildSize: totalSize,
        compressionRatio: 0,
        optimizationGains: 0,
      },
      files: allArtifacts.map((a) => a.path),
      errors: this.getDiagnostics().filter(
        (d) => d.severity === 'error'
      ) as any[],
      warnings: this.getDiagnostics().filter(
        (d) => d.severity === 'warning'
      ) as any[],
      manifestFile: buildData.manifest.path,
      serviceWorkerFile: buildData.serviceWorker.path,
      htmlFiles: buildData.html.map((f) => f.path),
      cssFiles: buildData.assets
        .filter((a) => a.type === 'css')
        .map((a) => a.path),
      jsFiles: buildData.assets
        .filter((a) => a.type === 'javascript')
        .map((a) => a.path),
      iconFiles: buildData.icons.map((f) => f.path),
      screenshotFiles: buildData.screenshots.map((f) => f.path),
      cacheableAssets: buildData.assets
        .filter((a) => a.metadata?.cacheable)
        .map((a) => a.path),
      installability: buildData.installability,
      offlineSupport: {
        enabled: this.pwaOptions.features.offlineSupport,
        cachedResources: buildData.assets
          .filter((a) => a.metadata?.cacheable)
          .map((a) => a.path),
        offlinePages: buildData.offline.map((f) => f.path),
      },
      features: {
        pushNotifications: this.pwaOptions.features.pushNotifications || false,
        backgroundSync: this.pwaOptions.features.backgroundSync || false,
        webShare: this.pwaOptions.features.webShare || false,
        badging: this.pwaOptions.features.badging || false,
        fileHandling: (this.pwaOptions.features.fileHandling?.length || 0) > 0,
      },
    };

    console.log('PWA deployment complete!');
    console.log(`Total size: ${this.formatBytes(totalSize)}`);
    console.log(`Files generated: ${allArtifacts.length}`);
    console.log(`Installable: ${buildData.installability.isInstallable}`);

    return result;
  }

  /*
    ====================================
         --- HELPER METHODS ---
    ====================================
  */

  private async compileWorldSrcForPWA(filePath: string): Promise<string> {
    /* would use actual WORLDSRC compiler with PWA optimizations */
    return `
// Generated PWA code from ${filePath}
export class PWAWorldSrcGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.offlineCapable = 'serviceWorker' in navigator;
    this.installPrompt = null;
    this.init();
  }

  async init() {
    await this.setupPWAFeatures();
    console.log('WORLDSRC PWA game initialized');
  }

  async setupPWAFeatures() {
    // Service worker registration
    if (this.offlineCapable) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton();
    });

    // PWA installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.hideInstallButton();
    });

    // Background sync
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
    }

    // Web Share API
    if (navigator.share) {
      this.setupWebShare();
    }

    // Badging API
    if ('setAppBadge' in navigator) {
      this.setupBadging();
    }
  }

  showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'pwa-install-button';
    installBtn.onclick = () => this.promptInstall();
    document.body.appendChild(installBtn);
  }

  hideInstallButton() {
    const installBtn = document.querySelector('.pwa-install-button');
    if (installBtn) installBtn.remove();
  }

  async promptInstall() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      console.log('Install prompt result:', result);
      this.installPrompt = null;
    }
  }

  setupBackgroundSync() {
    // Background sync for game state
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register('background-sync');
    });
  }

  setupWebShare() {
    this.shareScore = async (score) => {
      try {
        await navigator.share({
          title: 'WORLDSRC Game Score',
          text: \`I scored \${score} points!\`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Web Share failed:', error);
      }
    };
  }

  setupBadging() {
    this.updateBadge = (count) => {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    };
  }

  run() {
    this.gameLoop();
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());
    // Game logic here
  }
}

// Auto-start
if (typeof window !== 'undefined') {
  const game = new PWAWorldSrcGame('gameCanvas');
  game.run();
}
`;
  }

  private createServiceWorkerContent(cacheableAssets: string[]): string {
    const strategy = this.pwaOptions.serviceWorker.strategy;
    const cacheName =
      this.pwaOptions.serviceWorker.cacheName || 'worldsrc-cache-v1';

    return `
// WORLDSRC PWA Service Worker
const CACHE_NAME = '${cacheName}';
const FILES_TO_CACHE = ${JSON.stringify(['/', ...cacheableAssets])};

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        ${this.pwaOptions.serviceWorker.skipWaiting ? 'return self.skipWaiting();' : ''}
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((thisCacheName) => {
          if (thisCacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', thisCacheName);
            return caches.delete(thisCacheName);
          }
        })
      );
    }).then(() => {
      ${this.pwaOptions.serviceWorker.clientsClaim ? 'return self.clients.claim();' : ''}
    })
  );
});

// Fetch event with ${strategy} strategy
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      ${this.getFetchStrategy(strategy)}
    );
  }
});

${
  this.pwaOptions.features.backgroundSync
    ? `
// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync game state when back online
  try {
    const gameState = await getStoredGameState();
    if (gameState) {
      await syncGameState(gameState);
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function getStoredGameState() {
  // Would retrieve from IndexedDB
  return null;
}

async function syncGameState(gameState) {
  // Would sync to server
  console.log('[SW] Syncing game state');
}
`
    : ''
}

${
  this.pwaOptions.features.pushNotifications
    ? `
// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Game',
        icon: '/icons/play.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WORLDSRC Game', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});
`
    : ''
}

console.log('[SW] WORLDSRC PWA Service Worker loaded');
`;
  }

  private getFetchStrategy(strategy: string): string {
    switch (strategy) {
      case 'cache-first':
        return `
        caches.match(event.request)
          .then((response) => {
            return response || fetch(event.request);
          })
        `;

      case 'network-first':
        return `
        fetch(event.request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
            return response;
          })
          .catch(() => caches.match(event.request))
        `;

      case 'stale-while-revalidate':
        return `
        caches.match(event.request)
          .then((response) => {
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                  });
                return networkResponse;
              });
            return response || fetchPromise;
          })
        `;

      case 'network-only':
        return 'fetch(event.request)';

      case 'cache-only':
        return 'caches.match(event.request)';

      default:
        return 'caches.match(event.request).then((response) => response || fetch(event.request))';
    }
  }

  private async generatePWAIndexHTML(
    jsFiles: BuildArtifact[],
    cssFiles: BuildArtifact[]
  ): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.pwaOptions.manifest.name}</title>
  <meta name="description" content="${this.pwaOptions.manifest.description}">

  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="${this.pwaOptions.manifest.themeColor}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="${this.pwaOptions.manifest.shortName}">
  <meta name="msapplication-TileColor" content="${this.pwaOptions.manifest.themeColor}">

  <!-- Manifest -->
  <link rel="manifest" href="manifest.json">

  <!-- Icons -->
  ${this.pwaOptions.manifest.icons
    .map(
      (icon) =>
        `<link rel="icon" type="${icon.type}" sizes="${icon.sizes}" href="${icon.src}">`
    )
    .join('\n  ')}

  <!-- Apple Touch Icons -->
  ${this.pwaOptions.manifest.icons
    .filter((icon) => icon.sizes.includes('180') || icon.sizes.includes('192'))
    .map((icon) => `<link rel="apple-touch-icon" href="${icon.src}">`)
    .join('\n  ')}

  <!-- Styles -->
  ${cssFiles.map((file) => `<link rel="stylesheet" href="${this.getRelativePath(file.path)}">`).join('\n  ')}

  <style>
    /* PWA-specific styles */
    body {
      margin: 0;
      padding: 0;
      background: ${this.pwaOptions.manifest.backgroundColor};
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }

    .pwa-install-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.pwaOptions.manifest.themeColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 14px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .pwa-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: ${this.pwaOptions.manifest.backgroundColor};
      z-index: 9999;
    }

    #gameCanvas {
      display: block;
      margin: 0 auto;
      touch-action: none;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      #gameCanvas {
        width: 100vw;
        height: 100vh;
        object-fit: contain;
      }
    }

    /* PWA display modes */
    @media (display-mode: standalone) {
      .pwa-install-button {
        display: none;
      }
    }

    @media (display-mode: fullscreen) {
      body {
        overflow: hidden;
      }
    }
  </style>
</head>
<body>
  <div id="pwa-loading" class="pwa-loading">
    <div>Loading ${this.pwaOptions.manifest.name}...</div>
  </div>

  <canvas id="gameCanvas" width="800" height="600"></canvas>

  <!-- Scripts -->
  ${jsFiles.map((file) => `<script src="${this.getRelativePath(file.path)}"></script>`).join('\n  ')}

  <script>
    // Hide loading screen when game is ready
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.getElementById('pwa-loading').style.display = 'none';
      }, 1000);
    });

    // Prevent context menu on long press
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  </script>
</body>
</html>`;
  }

  private async generateOfflineHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - ${this.pwaOptions.manifest.name}</title>
  <meta name="theme-color" content="${this.pwaOptions.manifest.themeColor}">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: ${this.pwaOptions.manifest.backgroundColor};
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .offline-content {
      max-width: 400px;
      padding: 2rem;
    }
    .offline-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .retry-button {
      background: ${this.pwaOptions.manifest.themeColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="offline-content">
    <div class="offline-icon">⚬</div>
    <h1>You're Offline</h1>
    <p>It looks like you're not connected to the internet. Some features may not be available.</p>
    <button class="retry-button" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;
  }

  private async generateOfflineGameHTML(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Game - ${this.pwaOptions.manifest.name}</title>
  <meta name="theme-color" content="${this.pwaOptions.manifest.themeColor}">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: ${this.pwaOptions.manifest.backgroundColor};
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .offline-game {
      max-width: 400px;
      padding: 2rem;
    }
    .game-canvas {
      border: 2px solid #666;
      background: #000;
    }
  </style>
</head>
<body>
  <div class="offline-game">
    <h1>Offline Mode</h1>
    <p>You can still play with limited features while offline.</p>
    <canvas class="game-canvas" width="320" height="240"></canvas>
    <p><small>Your progress will sync when you're back online.</small></p>
  </div>
</body>
</html>`;
  }

  /*
    ====================================
         --- UTILITY METHODS ---
    ====================================
  */

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

  private getRelativePath(filePath: string): string {
    return filePath
      .replace(this.options.outputDirectory, '')
      .replace(/^\//, '');
  }

  private async optimizePWAFile(file: BuildArtifact): Promise<BuildArtifact> {
    /* would apply PWA-specific optimizations */
    return {
      ...file,
      metadata: {
        ...file.metadata,
        optimizedForPWA: true,
      },
    };
  }

  private async applySplitBundles(files: BuildArtifact[]): Promise<void> {
    console.log('Applying bundle splitting...');
  }

  private async extractCriticalCSS(files: BuildArtifact[]): Promise<void> {
    console.log('Extracting critical CSS...');
  }

  private async setupLazyLoading(files: BuildArtifact[]): Promise<void> {
    console.log('Setting up lazy loading...');
  }

  private async processIcon(icon: any): Promise<BuildArtifact | null> {
    /* would process and optimize icon */
    return {
      id: `pwa-icon-${icon.sizes}`,
      type: 'asset',
      path: `${this.options.outputDirectory}/${icon.src}`,
      size: 1024,
      metadata: {
        isPWAIcon: true,
        sizes: icon.sizes,
        type: icon.type,
      },
    };
  }

  private async generateFavicon(): Promise<BuildArtifact | null> {
    /* would generate favicon */
    return {
      id: 'pwa-favicon',
      type: 'asset',
      path: `${this.options.outputDirectory}/favicon.ico`,
      size: 512,
      metadata: {
        isFavicon: true,
      },
    };
  }

  private async generateScreenshot(
    screenshot: any
  ): Promise<BuildArtifact | null> {
    /* would generate screenshot */
    return {
      id: `pwa-screenshot-${Date.now()}`,
      type: 'asset',
      path: `${this.options.outputDirectory}/${screenshot.src}`,
      size: 2048,
      metadata: {
        isPWAScreenshot: true,
        platform: screenshot.platform,
      },
    };
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

  protected async validatePlatform(): Promise<{
    errors: any[];
    warnings: any[];
  }> {
    const errors: any[] = [];
    const warnings: any[] = [];

    /* validate PWA manifest */
    if (!this.pwaOptions.manifest.name) {
      errors.push({
        id: 'missing-manifest-name',
        severity: 'error',
        message: 'PWA manifest name is required',
        stage: BuildStage.INITIALIZATION,
      });
    }

    if (this.pwaOptions.manifest.icons.length === 0) {
      warnings.push({
        id: 'no-icons',
        severity: 'warning',
        message: 'PWA should include app icons',
        stage: BuildStage.INITIALIZATION,
      });
    }

    return { errors, warnings };
  }

  public async isSupported(): Promise<boolean> {
    /* PWA deployment is supported on all platforms */
    return true;
  }

  public getRequirements(): {
    nodeVersion?: string;
    dependencies?: string[];
    systemRequirements?: string[];
  } {
    return {
      nodeVersion: '>=16.0.0',
      dependencies: ['workbox-cli', 'sharp'],
      systemRequirements: [
        'Modern web browser with PWA support',
        'HTTPS-enabled web server for production',
      ],
    };
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
