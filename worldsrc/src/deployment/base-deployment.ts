/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         base-deployment.ts
           ---
           base deployment interfaces and types for WORLDSRC
           Alpha Phase 20: Beta Preparation & Production Deployment.

           defines core abstractions for deployment targets,
           optimization profiles, and build configurations
           used across all deployment implementations.

*/

/*
    ====================================
             --- ENUMS ---
    ====================================
*/

/*

         PlatformTarget
           ---
           supported deployment platform targets.

*/

export enum PlatformTarget {
  WEB = 'web',
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  SERVER = 'server',
}

/*

         DeploymentMode
           ---
           deployment environment modes.

*/

export enum DeploymentMode {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

/*

         OptimizationProfile
           ---
           optimization level profiles for different
           deployment scenarios.

*/

export enum OptimizationProfile {
  NONE = 'none',
  BASIC = 'basic',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  AGGRESSIVE = 'aggressive',
}

/*

         BuildStage
           ---
           stages in the deployment build pipeline.

*/

export enum BuildStage {
  INITIALIZATION = 'initialization',
  SOURCE_PREPARATION = 'source-preparation',
  COMPILATION = 'compilation',
  OPTIMIZATION = 'optimization',
  BUNDLING = 'bundling',
  ASSET_PROCESSING = 'asset-processing',
  PACKAGING = 'packaging',
  SIGNING = 'signing',
  VALIDATION = 'validation',
  FINALIZATION = 'finalization',
}

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         DeploymentOptions
           ---
           base configuration options for all deployment types.

*/

export interface DeploymentOptions {
  sourceDirectory: string;
  outputDirectory: string;
  platform: PlatformTarget;
  mode: DeploymentMode;
  optimization: OptimizationProfile;
  enableSourceMaps: boolean;
  enableMetrics: boolean;
  enableCaching: boolean;
  buildNumber?: number;
  version?: string;
}

/*

         PlatformConfig
           ---
           platform-specific configuration settings.

*/

export interface PlatformConfig {
  target: PlatformTarget;
  architecture?: 'x64' | 'arm64' | 'ia32';
  operatingSystem?: 'win32' | 'darwin' | 'linux';
  minimumVersion?: string;
  features?: {
    webgl?: boolean;
    webassembly?: boolean;
    serviceWorkers?: boolean;
    pushNotifications?: boolean;
    fileSystemAccess?: boolean;
  };
}

/*

         BuildArtifact
           ---
           represents a single build output artifact.

*/

export interface BuildArtifact {
  id: string;
  type: 'javascript' | 'css' | 'html' | 'wasm' | 'asset' | 'manifest';
  path: string;
  size: number;
  checksum?: string;
  dependencies?: string[];
  metadata?: {
    originalSize?: number;
    compressionRatio?: number;
    processingTime?: number;
    [key: string]: any;
  };
}

/*

         DeploymentResult
           ---
           result of a deployment operation.

*/

export interface DeploymentResult {
  success: boolean;
  platform: PlatformTarget;
  mode: DeploymentMode;
  artifacts: BuildArtifact[];
  metrics: {
    totalTime: number;
    buildSize: number;
    compressionRatio: number;
    optimizationGains: number;
  };
  files: string[];
  errors: DeploymentError[];
  warnings: DeploymentWarning[];
  deploymentUrl?: string;
  packagePath?: string;
}

/*

         DeploymentDiagnostic
           ---
           diagnostic information from deployment process.

*/

export interface DeploymentDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  stage?: BuildStage;
  platform?: PlatformTarget;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

/*

         DeploymentError
           ---
           error information from deployment process.

*/

export interface DeploymentError extends DeploymentDiagnostic {
  severity: 'error';
  code?: string;
  stack?: string;
}

/*

         DeploymentWarning
           ---
           warning information from deployment process.

*/

export interface DeploymentWarning extends DeploymentDiagnostic {
  severity: 'warning';
  impact?: 'low' | 'medium' | 'high';
}

/*

         OptimizationConfiguration
           ---
           configuration for build optimization.

*/

export interface OptimizationConfiguration {
  profile: OptimizationProfile;
  minifyHTML?: boolean;
  minifyCSS?: boolean;
  minifyJS?: boolean;
  optimizeImages?: boolean;
  bundleSplitting?: boolean;
  treeshaking?: boolean;
  deadCodeElimination?: boolean;
  compressionLevel?: number;
  targetBundleSize?: number;
  enablePolyfills?: boolean;
  enableSourceMaps?: boolean;
}

/*

         SecurityConfiguration
           ---
           security settings for deployment.

*/

export interface SecurityConfiguration {
  enableCSP?: boolean;
  cspPolicy?: string;
  enableSRI?: boolean;
  enableHTTPS?: boolean;
  certificatePath?: string;
  privateKeyPath?: string;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  trustedDomains?: string[];
}

/*

         AnalyticsConfiguration
           ---
           analytics and tracking configuration.

*/

export interface AnalyticsConfiguration {
  googleAnalytics?: string;
  customTracking?: boolean;
  enableErrorTracking?: boolean;
  enablePerformanceTracking?: boolean;
  enableUserTracking?: boolean;
  trackingEndpoints?: string[];
}

/*

         SEOConfiguration
           ---
           search engine optimization configuration.

*/

export interface SEOConfiguration {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  robots?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

/*
    ====================================
         --- ABSTRACT CLASSES ---
    ====================================
*/

/*

         BaseDeploymentTarget
           ---
           abstract base class for all deployment targets.
           provides common functionality and interfaces
           for platform-specific implementations.

*/

export abstract class BaseDeploymentTarget {
  public abstract readonly platform: PlatformTarget;
  public abstract readonly name: string;
  public abstract readonly version: string;

  protected options: DeploymentOptions;
  protected diagnostics: DeploymentDiagnostic[];

  constructor(options: DeploymentOptions) {
    this.options = options;
    this.diagnostics = [];
  }

  /*

           deploy()
             ---
             main deployment method that must be implemented
             by concrete deployment target classes.

  */

  public abstract deploy(): Promise<DeploymentResult>;

  /*

           validate()
             ---
             validates deployment configuration and
             environment before deployment.

  */

  public async validate(): Promise<{
    valid: boolean;
    errors: DeploymentError[];
    warnings: DeploymentWarning[];
  }> {
    const errors: DeploymentError[] = [];
    const warnings: DeploymentWarning[] = [];

    /* validate source directory */
    if (!this.options.sourceDirectory) {
      errors.push({
        id: 'missing-source',
        severity: 'error',
        message: 'Source directory is required',
        stage: BuildStage.INITIALIZATION,
      });
    }

    /* validate output directory */
    if (!this.options.outputDirectory) {
      errors.push({
        id: 'missing-output',
        severity: 'error',
        message: 'Output directory is required',
        stage: BuildStage.INITIALIZATION,
      });
    }

    /* platform-specific validation */
    const platformValidation = await this.validatePlatform();
    errors.push(...platformValidation.errors);
    warnings.push(...platformValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /*

           validatePlatform()
             ---
             platform-specific validation logic.
             override in concrete implementations.

  */

  protected async validatePlatform(): Promise<{
    errors: DeploymentError[];
    warnings: DeploymentWarning[];
  }> {
    return { errors: [], warnings: [] };
  }

  /*

           addDiagnostic()
             ---
             adds diagnostic information to the deployment process.

  */

  protected addDiagnostic(diagnostic: DeploymentDiagnostic): void {
    this.diagnostics.push(diagnostic);
  }

  /*

           addError()
             ---
             convenience method for adding error diagnostics.

  */

  protected addError(message: string, stage?: BuildStage, code?: string): void {
    const diagnostic: any = {
      id: code || `error-${Date.now()}`,
      severity: 'error',
      message,
      platform: this.platform,
    };

    if (stage) {
      diagnostic.stage = stage;
    }

    this.addDiagnostic(diagnostic);
  }

  /*

           addWarning()
             ---
             convenience method for adding warning diagnostics.

  */

  protected addWarning(
    message: string,
    stage?: BuildStage,
    code?: string,
    impact?: string
  ): void {
    const diagnostic: any = {
      id: code || `warning-${Date.now()}`,
      severity: 'warning',
      message,
      platform: this.platform,
    };

    if (stage) {
      diagnostic.stage = stage;
    }

    this.addDiagnostic(diagnostic);
  }

  /*

           getDiagnostics()
             ---
             returns all accumulated diagnostics.

  */

  public getDiagnostics(): DeploymentDiagnostic[] {
    return [...this.diagnostics];
  }

  /*

           clearDiagnostics()
             ---
             clears all accumulated diagnostics.

  */

  public clearDiagnostics(): void {
    this.diagnostics = [];
  }

  /*

           isSupported()
             ---
             checks if the deployment target is supported
             on the current system.

  */

  public abstract isSupported(): Promise<boolean>;

  /*

           getRequirements()
             ---
             returns system requirements for this deployment target.

  */

  public abstract getRequirements(): {
    nodeVersion?: string;
    dependencies?: string[];
    systemRequirements?: string[];
  };
}

/*
    ====================================
         --- DEPLOYMENT TARGET ---
    ====================================
*/

/*

         DeploymentTarget
           ---
           interface for deployment target implementations.

*/

export interface DeploymentTarget {
  readonly platform: PlatformTarget;
  readonly name: string;
  readonly version: string;

  deploy(): Promise<DeploymentResult>;
  validate(): Promise<{
    valid: boolean;
    errors: DeploymentError[];
    warnings: DeploymentWarning[];
  }>;
  isSupported(): Promise<boolean>;
  getRequirements(): {
    nodeVersion?: string;
    dependencies?: string[];
    systemRequirements?: string[];
  };
}

/*
    ====================================
             --- UTILITIES ---
    ====================================
*/

/*

         DeploymentUtils
           ---
           utility functions for deployment operations.

*/

export class DeploymentUtils {
  /*

           validateVersion()
             ---
             validates version string format.

  */

  public static validateVersion(version: string): boolean {
    const semverPattern =
      /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?(\+[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)?$/;
    return semverPattern.test(version);
  }

  /*

           calculateChecksum()
             ---
             calculates checksum for file content.

  */

  public static async calculateChecksum(
    content: string | Buffer,
    algorithm: 'md5' | 'sha1' | 'sha256' = 'sha256'
  ): Promise<string> {
    /* would use crypto module to calculate actual checksum */
    return `${algorithm}-checksum-placeholder`;
  }

  /*

           formatFileSize()
             ---
             formats file size in human-readable format.

  */

  public static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /*

           calculateCompressionRatio()
             ---
             calculates compression ratio between original and compressed sizes.

  */

  public static calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /*

           validatePlatformConfig()
             ---
             validates platform configuration.

  */

  public static validatePlatformConfig(config: PlatformConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Object.values(PlatformTarget).includes(config.target)) {
      errors.push(`Invalid platform target: ${config.target}`);
    }

    if (
      config.architecture &&
      !['x64', 'arm64', 'ia32'].includes(config.architecture)
    ) {
      errors.push(`Invalid architecture: ${config.architecture}`);
    }

    if (
      config.operatingSystem &&
      !['win32', 'darwin', 'linux'].includes(config.operatingSystem)
    ) {
      errors.push(`Invalid operating system: ${config.operatingSystem}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /*

           mergeConfigurations()
             ---
             merges deployment configurations with proper precedence.

  */

  public static mergeConfigurations<T extends Record<string, any>>(
    base: T,
    override: Partial<T>
  ): T {
    return {
      ...base,
      ...override,
    };
  }

  /*

           createBuildId()
             ---
             creates unique build identifier.

  */

  public static createBuildId(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return prefix
      ? `${prefix}-${timestamp}-${random}`
      : `build-${timestamp}-${random}`;
  }

  /*

           sanitizeFilename()
             ---
             sanitizes filename for cross-platform compatibility.

  */

  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  /*

           validateUrl()
             ---
             validates URL format.

  */

  public static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
