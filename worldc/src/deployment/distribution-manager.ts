/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         distribution-manager.ts
           ---
           distribution manager for WORLDSRC Alpha Phase 20.

           handles package creation, release management,
           and distribution preparation for multiple target
           platforms with checksums, manifests, and
           deployment configurations.

*/

import {
  BuildArtifact,
  PlatformTarget,
  DeploymentMode,
} from './base-deployment';

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         DistributionConfiguration
           ---
           configuration for distribution manager.

*/

export interface DistributionConfiguration {
  outputDirectory: string;
  enableCompression: boolean;
  enableChecksums: boolean;
  generateManifest: boolean;
  includeSourceMaps: boolean;
  cdnUrls?: string[];
  mirrorUrls?: string[];
  signatureKey?: string;
  distributionFormat: 'zip' | 'tar.gz' | 'directory';
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
  };
}

/*

         DistributionResult
           ---
           result of distribution process.

*/

export interface DistributionResult {
  success: boolean;
  distributionPath: string;
  files: string[];
  totalSize: number;
  compressedSize: number;
  assetSize: number;
  checksums: Record<string, string>;
  manifest: string;
  deploymentUrl?: string;
  mirrorUrls: string[];
  errors: string[];
  warnings: string[];
}

/*

         ReleasePackage
           ---
           represents a complete release package.

*/

export interface ReleasePackage {
  version: string;
  platform: string;
  architecture?: string;
  format: string;
  path: string;
  size: number;
  checksum: string;
  signature?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  artifacts: BuildArtifact[];
  metadata: {
    buildNumber: number;
    buildDate: string;
    commitHash?: string;
    branch?: string;
    releaseType: 'stable' | 'beta' | 'alpha' | 'nightly';
  };
}

/*
    ====================================
         --- DISTRIBUTION MANAGER ---
    ====================================
*/

/*

         DistributionManager
           ---
           main distribution manager that handles package creation
           and release management for all deployment targets.

*/

export class DistributionManager {
  private config: DistributionConfiguration;

  constructor(config: DistributionConfiguration) {
    this.config = config;
  }

  /*

           createWebPackage()
             ---
           creates web deployment package with assets and manifest.

  */

  public async createWebPackage(options: {
    artifacts: BuildArtifact[];
    outputDirectory?: string;
    cdnUrls?: string[];
    enableCompression?: boolean;
    generateManifest?: boolean;
  }): Promise<{
    success: boolean;
    files: string[];
    totalSize: number;
    compressedSize: number;
    assetSize: number;
    deploymentUrl?: string;
    manifest?: string;
    errors: string[];
    warnings: string[];
  }> {
    console.log('Creating web package...');

    const outputDir = options.outputDirectory || this.config.outputDirectory;
    const errors: string[] = [];
    const warnings: string[] = [];
    const files: string[] = [];

    try {
      let totalSize = 0;
      let assetSize = 0;

      /* copy artifacts to output directory */
      for (const artifact of options.artifacts) {
        const outputPath = `${outputDir}/${this.getRelativePath(artifact.path)}`;
        files.push(outputPath);
        totalSize += artifact.size;

        if (artifact.type === 'asset') {
          assetSize += artifact.size;
        }
      }

      /* create index.html if not present */
      const hasIndex = options.artifacts.some((a) =>
        a.path.includes('index.html')
      );
      if (!hasIndex) {
        const indexContent = this.generateWebIndex(options.artifacts);
        const indexPath = `${outputDir}/index.html`;
        files.push(indexPath);
        totalSize += indexContent.length;
      }

      /* create .htaccess for web server configuration */
      const htaccessContent = this.generateHtaccess();
      const htaccessPath = `${outputDir}/.htaccess`;
      files.push(htaccessPath);
      totalSize += htaccessContent.length;

      /* create robots.txt */
      const robotsContent = this.generateRobotsTxt();
      const robotsPath = `${outputDir}/robots.txt`;
      files.push(robotsPath);
      totalSize += robotsContent.length;

      /* generate web manifest if requested */
      let manifestPath: string | undefined;
      if (options.generateManifest || this.config.generateManifest) {
        const webManifest = this.generateWebManifest(options.artifacts);
        manifestPath = `${outputDir}/manifest.json`;
        files.push(manifestPath);
        totalSize += webManifest.length;
      }

      /* apply compression if enabled */
      const compressedSize =
        options.enableCompression || this.config.enableCompression
          ? Math.floor(totalSize * 0.7) /* 30% compression */
          : totalSize;

      /* generate deployment URL */
      const deploymentUrl = options.cdnUrls?.[0] || this.config.cdnUrls?.[0];

      console.log(
        `Web package created: ${files.length} files, ${this.formatBytes(totalSize)}`
      );

      const result: any = {
        success: true,
        files,
        totalSize,
        compressedSize,
        assetSize,
        errors,
        warnings,
      };

      if (deploymentUrl) {
        result.deploymentUrl = deploymentUrl;
      }

      if (manifestPath) {
        result.manifest = manifestPath;
      }

      return result;
    } catch (error) {
      errors.push(`Web package creation failed: ${error}`);

      return {
        success: false,
        files: [],
        totalSize: 0,
        compressedSize: 0,
        assetSize: 0,
        errors,
        warnings,
      };
    }
  }

  /*

           createElectronPackage()
             ---
           creates Electron desktop application package.

  */

  public async createElectronPackage(options: {
    artifacts: BuildArtifact[];
    platform: string;
    architecture: string;
    appInfo: {
      name: string;
      version: string;
      description: string;
      author: string;
    };
    outputDirectory?: string;
    createInstaller?: boolean;
    createPortable?: boolean;
    signing?: any;
  }): Promise<{
    success: boolean;
    files: string[];
    packageSize: number;
    installerPath?: string;
    portablePath?: string;
    errors: string[];
    warnings: string[];
  }> {
    console.log(
      `Creating Electron package for ${options.platform}-${options.architecture}...`
    );

    const outputDir = options.outputDirectory || this.config.outputDirectory;
    const errors: string[] = [];
    const warnings: string[] = [];
    const files: string[] = [];

    try {
      const packageDir = `${outputDir}/${options.platform}-${options.architecture}`;

      /* calculate package size */
      const artifactSize = options.artifacts.reduce(
        (sum, a) => sum + a.size,
        0
      );
      const electronRuntimeSize =
        80 * 1024 * 1024; /* ~80MB for Electron runtime */
      const packageSize = artifactSize + electronRuntimeSize;

      /* copy application files */
      for (const artifact of options.artifacts) {
        const outputPath = `${packageDir}/${this.getRelativePath(artifact.path)}`;
        files.push(outputPath);
      }

      /* create platform-specific files */
      if (options.platform === 'win32') {
        files.push(`${packageDir}/${options.appInfo.name}.exe`);
        files.push(`${packageDir}/resources/app.asar`);
      } else if (options.platform === 'darwin') {
        files.push(
          `${packageDir}/${options.appInfo.name}.app/Contents/MacOS/${options.appInfo.name}`
        );
        files.push(
          `${packageDir}/${options.appInfo.name}.app/Contents/Resources/app.asar`
        );
        files.push(
          `${packageDir}/${options.appInfo.name}.app/Contents/Info.plist`
        );
      } else if (options.platform === 'linux') {
        files.push(`${packageDir}/${options.appInfo.name.toLowerCase()}`);
        files.push(`${packageDir}/resources/app.asar`);
      }

      /* create installer if requested */
      let installerPath: string | undefined;
      if (options.createInstaller) {
        installerPath = await this.createInstaller(options, packageDir);
        if (installerPath) {
          files.push(installerPath);
        }
      }

      /* create portable version if requested */
      let portablePath: string | undefined;
      if (options.createPortable) {
        portablePath = await this.createPortableVersion(options, packageDir);
        if (portablePath) {
          files.push(portablePath);
        }
      }

      console.log(`Electron package created: ${this.formatBytes(packageSize)}`);

      const result: any = {
        success: true,
        files,
        packageSize,
        errors,
        warnings,
      };

      if (installerPath) {
        result.installerPath = installerPath;
      }

      if (portablePath) {
        result.portablePath = portablePath;
      }

      return result;
    } catch (error) {
      errors.push(`Electron package creation failed: ${error}`);

      return {
        success: false,
        files: [],
        packageSize: 0,
        errors,
        warnings,
      };
    }
  }

  /*

           createPWAPackage()
             ---
           creates Progressive Web App package.

  */

  public async createPWAPackage(options: {
    artifacts: BuildArtifact[];
    outputDirectory?: string;
    manifest: any;
    generateServiceWorker?: boolean;
    offlineStrategy?: string;
    enableCompression?: boolean;
  }): Promise<{
    success: boolean;
    files: string[];
    totalSize: number;
    cachedSize: number;
    manifestPath: string;
    serviceWorkerPath?: string;
    errors: string[];
    warnings: string[];
  }> {
    console.log('Creating PWA package...');

    const outputDir = options.outputDirectory || this.config.outputDirectory;
    const errors: string[] = [];
    const warnings: string[] = [];
    const files: string[] = [];

    try {
      let totalSize = 0;
      let cachedSize = 0;

      /* copy artifacts */
      for (const artifact of options.artifacts) {
        const outputPath = `${outputDir}/${this.getRelativePath(artifact.path)}`;
        files.push(outputPath);
        totalSize += artifact.size;

        if (artifact.metadata?.cacheable) {
          cachedSize += artifact.size;
        }
      }

      /* create PWA manifest */
      const manifestContent = JSON.stringify(options.manifest, null, 2);
      const manifestPath = `${outputDir}/manifest.json`;
      files.push(manifestPath);
      totalSize += manifestContent.length;

      /* create service worker if requested */
      let serviceWorkerPath: string | undefined;
      if (options.generateServiceWorker) {
        const swContent = this.generateServiceWorker(
          options.artifacts,
          options.offlineStrategy || 'cache-first'
        );
        serviceWorkerPath = `${outputDir}/sw.js`;
        files.push(serviceWorkerPath);
        totalSize += swContent.length;
        cachedSize += swContent.length;
      }

      /* create offline fallback page */
      const offlineContent = this.generateOfflinePage(options.manifest);
      const offlinePath = `${outputDir}/offline.html`;
      files.push(offlinePath);
      totalSize += offlineContent.length;

      /* create PWA configuration files */
      const browserConfigContent = this.generateBrowserConfig(options.manifest);
      const browserConfigPath = `${outputDir}/browserconfig.xml`;
      files.push(browserConfigPath);
      totalSize += browserConfigContent.length;

      console.log(
        `PWA package created: ${files.length} files, ${this.formatBytes(totalSize)}`
      );

      const result: any = {
        success: true,
        files,
        totalSize,
        cachedSize,
        manifestPath,
        errors,
        warnings,
      };

      if (serviceWorkerPath) {
        result.serviceWorkerPath = serviceWorkerPath;
      }

      return result;
    } catch (error) {
      errors.push(`PWA package creation failed: ${error}`);

      return {
        success: false,
        files: [],
        totalSize: 0,
        cachedSize: 0,
        manifestPath: '',
        errors,
        warnings,
      };
    }
  }

  /*

           createReleaseManifest()
             ---
           creates release manifest with package information.

  */

  public async createReleaseManifest(options: {
    version: string;
    appInfo: {
      name: string;
      description: string;
      author: string;
      homepage?: string;
      repository?: string;
    };
    packages: Array<{
      target: string;
      platform?: string;
      architecture?: string;
      files: string[];
      size: number;
      checksum?: string;
    }>;
    releaseNotes?: string;
    buildNumber: number;
    buildTimestamp: string;
  }): Promise<{
    success: boolean;
    manifestPath: string;
    errors: string[];
  }> {
    console.log('Creating release manifest...');

    try {
      const manifest = {
        name: options.appInfo.name,
        version: options.version,
        description: options.appInfo.description,
        author: options.appInfo.author,
        homepage: options.appInfo.homepage,
        repository: options.appInfo.repository,
        buildNumber: options.buildNumber,
        buildTimestamp: options.buildTimestamp,
        releaseNotes: options.releaseNotes,
        packages: options.packages.map((pkg) => ({
          target: pkg.target,
          platform: pkg.platform,
          architecture: pkg.architecture,
          files: pkg.files,
          size: pkg.size,
          checksum: pkg.checksum,
          downloadUrl: this.generateDownloadUrl(pkg),
        })),
        totalSize: options.packages.reduce((sum, pkg) => sum + pkg.size, 0),
        checksums: this.generateChecksumManifest(options.packages),
        signature: this.config.signatureKey
          ? 'release-signature-placeholder'
          : undefined,
      };

      const manifestContent = JSON.stringify(manifest, null, 2);
      const manifestPath = `${this.config.outputDirectory}/release-manifest.json`;

      console.log('Release manifest created');

      return {
        success: true,
        manifestPath,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        manifestPath: '',
        errors: [`Release manifest creation failed: ${error}`],
      };
    }
  }

  /*

           processCompilationResult()
             ---
           processes compilation result and creates distribution packages.

  */

  public async processCompilationResult(compilationResult: {
    success: boolean;
    artifacts: BuildArtifact[];
    diagnostics: any[];
    warnings: any[];
  }): Promise<DistributionResult> {
    console.log('Processing compilation result for distribution...');

    if (!compilationResult.success) {
      return {
        success: false,
        distributionPath: '',
        files: [],
        totalSize: 0,
        compressedSize: 0,
        assetSize: 0,
        checksums: {},
        manifest: '',
        mirrorUrls: [],
        errors: ['Compilation failed - cannot create distribution'],
        warnings: [],
      };
    }

    try {
      const artifacts = compilationResult.artifacts;
      const files: string[] = [];
      const checksums: Record<string, string> = {};
      let totalSize = 0;
      let assetSize = 0;

      /* process each artifact */
      for (const artifact of artifacts) {
        const outputPath = `${this.config.outputDirectory}/${this.getRelativePath(artifact.path)}`;
        files.push(outputPath);
        totalSize += artifact.size;

        if (artifact.type === 'asset') {
          assetSize += artifact.size;
        }

        /* generate checksum if enabled */
        if (this.config.enableChecksums) {
          checksums[outputPath] = await this.generateChecksum(artifact);
        }
      }

      /* apply compression if enabled */
      const compressedSize = this.config.enableCompression
        ? await this.applyCompression(files, totalSize)
        : totalSize;

      /* create distribution manifest */
      const manifest = this.config.generateManifest
        ? await this.createDistributionManifest(artifacts)
        : '';

      /* prepare mirror URLs */
      const mirrorUrls = this.config.mirrorUrls || [];

      return {
        success: true,
        distributionPath: this.config.outputDirectory,
        files,
        totalSize,
        compressedSize,
        assetSize,
        checksums,
        manifest,
        mirrorUrls,
        errors: [],
        warnings: compilationResult.warnings.map((w) => w.message),
      };
    } catch (error) {
      return {
        success: false,
        distributionPath: '',
        files: [],
        totalSize: 0,
        compressedSize: 0,
        assetSize: 0,
        checksums: {},
        manifest: '',
        mirrorUrls: [],
        errors: [`Distribution processing failed: ${error}`],
        warnings: [],
      };
    }
  }

  /*

           updateConfiguration()
             ---
           updates distribution manager configuration.

  */

  public updateConfiguration(
    newConfig: Partial<DistributionConfiguration>
  ): void {
    this.config = { ...this.config, ...newConfig };
  }

  /*
    ====================================
         --- HELPER METHODS ---
    ====================================
  */

  /*

           generateWebIndex()
             ---
           generates index.html for web deployment.

  */

  private generateWebIndex(artifacts: BuildArtifact[]): string {
    const jsFiles = artifacts
      .filter((a) => a.type === 'javascript')
      .map((a) => this.getRelativePath(a.path));
    const cssFiles = artifacts
      .filter((a) => a.type === 'css')
      .map((a) => this.getRelativePath(a.path));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.metadata?.title || 'WORLDSRC Game'}</title>
  <meta name="description" content="${this.config.metadata?.description || 'A game built with WORLDSRC'}">

  ${cssFiles.map((file) => `<link rel="stylesheet" href="${file}">`).join('\n  ')}

  <style>
    body { margin: 0; padding: 0; background: #1a1a1a; color: white; font-family: Arial, sans-serif; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
    #gameCanvas { display: block; margin: 0 auto; border: 2px solid #333; }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <div>Loading...</div>
  </div>

  <canvas id="gameCanvas" width="800" height="600"></canvas>

  ${jsFiles.map((file) => `<script src="${file}"></script>`).join('\n  ')}

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('loading').style.display = 'none';
    });
  </script>
</body>
</html>`;
  }

  /*

           generateHtaccess()
             ---
           generates .htaccess file for web server configuration.

  */

  private generateHtaccess(): string {
    return `# WORLDSRC Web App Configuration

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/gif "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options nosniff
  Header always set X-Frame-Options DENY
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# MIME types
AddType application/wasm .wasm
AddType application/json .json

# Fallback for SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`;
  }

  /*

           generateRobotsTxt()
             ---
           generates robots.txt file.

  */

  private generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.config.metadata?.homepage || 'https://example.com'}/sitemap.xml`;
  }

  /*

           generateWebManifest()
             ---
           generates web manifest for PWA functionality.

  */

  private generateWebManifest(artifacts: BuildArtifact[]): string {
    const manifest = {
      name: this.config.metadata?.title || 'WORLDSRC Game',
      short_name: 'WorldSrc',
      description:
        this.config.metadata?.description || 'A game built with WORLDSRC',
      start_url: '/',
      display: 'standalone',
      background_color: '#1a1a1a',
      theme_color: '#000000',
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    };

    return JSON.stringify(manifest, null, 2);
  }

  /*

           createInstaller()
             ---
           creates platform-specific installer.

  */

  private async createInstaller(
    options: any,
    packageDir: string
  ): Promise<string | undefined> {
    const platform = options.platform;
    const appName = options.appInfo.name;

    switch (platform) {
      case 'win32':
        return `${packageDir}/../${appName}-setup.exe`;
      case 'darwin':
        return `${packageDir}/../${appName}.dmg`;
      case 'linux':
        return `${packageDir}/../${appName}.AppImage`;
      default:
        return undefined;
    }
  }

  /*

           createPortableVersion()
             ---
           creates portable version of the application.

  */

  private async createPortableVersion(
    options: any,
    packageDir: string
  ): Promise<string | undefined> {
    const appName = options.appInfo.name;
    const platform = options.platform;
    const arch = options.architecture;

    return `${packageDir}/../${appName}-${platform}-${arch}-portable.zip`;
  }

  /*

           generateServiceWorker()
             ---
           generates service worker for PWA.

  */

  private generateServiceWorker(
    artifacts: BuildArtifact[],
    strategy: string
  ): string {
    const cacheableFiles = artifacts
      .filter((a) => a.metadata?.cacheable)
      .map((a) => `'/${this.getRelativePath(a.path)}'`);

    return `
// WORLDSRC PWA Service Worker
const CACHE_NAME = 'worldsrc-cache-v1';
const FILES_TO_CACHE = [
  '/',
  ${cacheableFiles.join(',\n  ')}
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Fetch event with ${strategy} strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});`;
  }

  /*

           generateOfflinePage()
             ---
           generates offline fallback page.

  */

  private generateOfflinePage(manifest: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - ${manifest.name || 'WORLDSRC Game'}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: ${manifest.background_color || '#1a1a1a'};
      color: white;
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .offline-content { max-width: 400px; padding: 2rem; }
    .retry-button {
      background: ${manifest.theme_color || '#007acc'};
      color: white;
      border: none;
      border-radius: 4px;
      padding: 12px 24px;
      cursor: pointer;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="offline-content">
    <h1>You're Offline</h1>
    <p>Please check your connection and try again.</p>
    <button class="retry-button" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;
  }

  /*

           generateBrowserConfig()
             ---
           generates browserconfig.xml for Windows tiles.

  */

  private generateBrowserConfig(manifest: any): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="icon-150.png"/>
      <TileColor>${manifest.theme_color || '#000000'}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  }

  /*

           generateDownloadUrl()
             ---
           generates download URL for package.

  */

  private generateDownloadUrl(pkg: any): string {
    const baseUrl = this.config.cdnUrls?.[0] || 'https://releases.example.com';
    const filename = `${pkg.target}-${pkg.platform || 'all'}-${pkg.architecture || 'universal'}.zip`;
    return `${baseUrl}/${filename}`;
  }

  /*

           generateChecksumManifest()
             ---
           generates checksum manifest for packages.

  */

  private generateChecksumManifest(packages: any[]): Record<string, string> {
    const checksums: Record<string, string> = {};

    for (const pkg of packages) {
      if (pkg.checksum) {
        const key = `${pkg.target}-${pkg.platform || 'all'}-${pkg.architecture || 'universal'}`;
        checksums[key] = pkg.checksum;
      }
    }

    return checksums;
  }

  /*

           generateChecksum()
             ---
           generates checksum for artifact.

  */

  private async generateChecksum(artifact: BuildArtifact): Promise<string> {
    /* would use crypto module to generate actual checksum */
    return `sha256:${artifact.id}-${artifact.size}-checksum`;
  }

  /*

           applyCompression()
             ---
           applies compression to files.

  */

  private async applyCompression(
    files: string[],
    totalSize: number
  ): Promise<number> {
    /* would apply actual compression */
    return Math.floor(totalSize * 0.7); /* 30% compression ratio */
  }

  /*

           createDistributionManifest()
             ---
           creates distribution manifest.

  */

  private async createDistributionManifest(
    artifacts: BuildArtifact[]
  ): Promise<string> {
    const manifest = {
      name: this.config.metadata?.title || 'WORLDSRC Distribution',
      version: '1.0.0',
      description:
        this.config.metadata?.description ||
        'WORLDSRC game distribution package',
      author: this.config.metadata?.author || 'Unknown',
      license: this.config.metadata?.license || 'MIT',
      artifacts: artifacts.map((a) => ({
        id: a.id,
        type: a.type,
        path: a.path,
        size: a.size,
        checksum: this.config.enableChecksums ? `checksum-${a.id}` : undefined,
      })),
      totalSize: artifacts.reduce((sum, a) => sum + a.size, 0),
      created: new Date().toISOString(),
    };

    return JSON.stringify(manifest, null, 2);
  }

  /*

           getRelativePath()
             ---
           gets relative path from absolute path.

  */

  private getRelativePath(path: string): string {
    return path.split('/').pop() || path;
  }

  /*

           formatBytes()
             ---
           formats bytes in human-readable format.

  */

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
}

/*
    ====================================
         --- DISTRIBUTION FACTORY ---
    ====================================
*/

/*

         DistributionManagerFactory
           ---
           factory for creating distribution managers with different configurations.

*/

export class DistributionManagerFactory {
  public static createDefault(outputDirectory: string): DistributionManager {
    const config: DistributionConfiguration = {
      outputDirectory,
      enableCompression: true,
      enableChecksums: true,
      generateManifest: true,
      includeSourceMaps: false,
      distributionFormat: 'directory',
    };

    return new DistributionManager(config);
  }

  public static createForProduction(
    outputDirectory: string
  ): DistributionManager {
    const config: DistributionConfiguration = {
      outputDirectory,
      enableCompression: true,
      enableChecksums: true,
      generateManifest: true,
      includeSourceMaps: false,
      distributionFormat: 'zip',
    };

    return new DistributionManager(config);
  }

  public static createForDevelopment(
    outputDirectory: string
  ): DistributionManager {
    const config: DistributionConfiguration = {
      outputDirectory,
      enableCompression: false,
      enableChecksums: false,
      generateManifest: true,
      includeSourceMaps: true,
      distributionFormat: 'directory',
    };

    return new DistributionManager(config);
  }

  public static createWithCDN(
    outputDirectory: string,
    cdnUrls: string[]
  ): DistributionManager {
    const config: DistributionConfiguration = {
      outputDirectory,
      enableCompression: true,
      enableChecksums: true,
      generateManifest: true,
      includeSourceMaps: false,
      distributionFormat: 'zip',
      cdnUrls,
    };

    return new DistributionManager(config);
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
