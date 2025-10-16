/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         output-manager.ts
           ---
           output management system for WORLDC code generation.

           this module handles the organization, writing, and
           management of generated code artifacts including
           file creation, directory structure, and project
           configuration files.

*/

import {
  CompilationTarget,
  CodeGenerationResult,
  CodegenDiagnostic,
} from './base-generator';

import { CompilationResult } from './compilation-pipeline';

/*
    ====================================
             --- INTERFACES ---
    ====================================
*/

/*

         OutputConfiguration
           ---
           configuration for output generation including
           directory structure, file naming conventions,
           and output formatting options.

*/

export interface OutputConfiguration {
  outputDirectory: string;
  createSubdirectories: boolean;
  preserveSourceStructure: boolean;

  fileNaming: {
    useTimestamp: boolean;
    includeTarget: boolean;
    customPrefix?: string;
    customSuffix?: string;
  };

  formatting: {
    prettify: boolean;
    removeComments: boolean;
    minify: boolean;
    insertHeaders: boolean;
  };

  metadata: {
    includeSourceInfo: boolean;
    includeGenerationTime: boolean;
    includeCompilerInfo: boolean;
    customHeaders?: Map<string, string>;
  };
}

/*

         OutputResult
           ---
           result of output operations including created
           files, directories, and any errors encountered
           during the output process.

*/

export interface OutputResult {
  success: boolean;
  outputDirectory: string;
  filesCreated: string[];
  directoriesCreated: string[];

  errors: OutputError[];
  warnings: OutputError[];

  statistics: {
    totalFiles: number;
    totalSize: number;
    processingTime: number;
  };
}

/*

         OutputError
           ---
           error information for output operations with
           detailed context and recovery suggestions.

*/

export interface OutputError {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  filename?: string;
  operation?: string;
  suggestion?: string;
}

/*

         FileArtifact
           ---
           represents a single file artifact with content,
           metadata, and output configuration.

*/

export interface FileArtifact {
  filename: string;
  content: string;
  target: CompilationTarget;
  encoding: string;
  size: number;

  metadata: {
    generated: Date;
    source: string;
    contentType: string;
    checksum?: string;
  };
}

/*
    ====================================
             --- MANAGER ---
    ====================================
*/

/*

         OutputManager
           ---
           manages the output of generated code artifacts
           including file writing, directory creation, and
           project structure organization.

*/

export class OutputManager {
  private configuration: OutputConfiguration;
  private fileSystem: FileSystemInterface;
  private artifacts: Map<string, FileArtifact>;

  constructor(config: OutputConfiguration, fileSystem?: FileSystemInterface) {
    this.configuration = config;
    this.fileSystem = fileSystem || new BrowserFileSystem();
    this.artifacts = new Map();
  }

  /*

           processCompilationResult()
             ---
             processes a complete compilation result and
             generates all output artifacts according to
             the configured output settings.

  */

  public async processCompilationResult(
    result: CompilationResult
  ): Promise<OutputResult> {
    const startTime = performance.now();
    const outputResult: OutputResult = {
      success: false,
      outputDirectory: this.configuration.outputDirectory,
      filesCreated: [],
      directoriesCreated: [],
      errors: [],
      warnings: [],
      statistics: {
        totalFiles: 0,
        totalSize: 0,
        processingTime: 0,
      },
    };

    try {
      /* create output directory structure */
      await this.createDirectoryStructure(outputResult);

      /* process artifacts from compilation results */
      for (const [filename, content] of result.artifacts) {
        await this.processArtifact(filename, content, result, outputResult);
      }

      /* generate project files */
      await this.generateProjectFiles(result, outputResult);

      /* create index files if needed */
      await this.generateIndexFiles(result, outputResult);

      outputResult.success = outputResult.errors.length === 0;
    } catch (error) {
      this.addError(
        outputResult,
        `Output processing failed: ${error}`,
        'PROCESSING_FAILED'
      );
    }

    outputResult.statistics.processingTime = performance.now() - startTime;
    return outputResult;
  }

  /*

           directory and file management methods

  */

  private async createDirectoryStructure(
    outputResult: OutputResult
  ): Promise<void> {
    const baseDir = this.configuration.outputDirectory;

    /* create base output directory */
    if (!(await this.fileSystem.exists(baseDir))) {
      await this.fileSystem.createDirectory(baseDir);
      outputResult.directoriesCreated.push(baseDir);
    }

    /* create subdirectories if configured */
    if (this.configuration.createSubdirectories) {
      const subdirs = ['src', 'lib', 'types', 'build', 'docs'];
      for (const subdir of subdirs) {
        const fullPath = this.fileSystem.join(baseDir, subdir);
        if (!(await this.fileSystem.exists(fullPath))) {
          await this.fileSystem.createDirectory(fullPath);
          outputResult.directoriesCreated.push(fullPath);
        }
      }
    }
  }

  private async processArtifact(
    filename: string,
    content: string,
    compilationResult: CompilationResult,
    outputResult: OutputResult
  ): Promise<void> {
    try {
      /* determine target directory */
      const targetDir = this.getTargetDirectory(filename);
      const fullPath = this.fileSystem.join(targetDir, filename);

      /* process content according to configuration */
      const processedContent = await this.processContent(
        content,
        filename,
        compilationResult
      );

      /* create file artifact */
      const artifact: FileArtifact = {
        filename,
        content: processedContent,
        target: this.inferTargetFromFilename(filename),
        encoding: 'utf-8',
        size: processedContent.length,
        metadata: {
          generated: new Date(),
          source: compilationResult.request.filename || 'unknown',
          contentType: this.getContentType(filename),
          checksum: this.calculateChecksum(processedContent),
        },
      };

      this.artifacts.set(filename, artifact);

      /* write file to output */
      await this.fileSystem.writeFile(fullPath, processedContent);
      outputResult.filesCreated.push(fullPath);
      outputResult.statistics.totalFiles++;
      outputResult.statistics.totalSize += processedContent.length;
    } catch (error) {
      this.addError(
        outputResult,
        `Failed to process artifact ${filename}: ${error}`,
        'ARTIFACT_FAILED',
        filename
      );
    }
  }

  private async processContent(
    content: string,
    filename: string,
    compilationResult: CompilationResult
  ): Promise<string> {
    let processed = content;

    /* insert headers if configured */
    if (this.configuration.formatting.insertHeaders) {
      processed =
        this.insertFileHeader(processed, filename, compilationResult) +
        processed;
    }

    /* apply formatting options */
    if (this.configuration.formatting.prettify) {
      processed = this.prettifyContent(processed, filename);
    }

    if (this.configuration.formatting.removeComments) {
      processed = this.removeComments(processed, filename);
    }

    if (this.configuration.formatting.minify) {
      processed = this.minifyContent(processed, filename);
    }

    return processed;
  }

  /*

           project file generation methods

  */

  private async generateProjectFiles(
    result: CompilationResult,
    outputResult: OutputResult
  ): Promise<void> {
    /* generate package.json if not already present */
    if (!result.artifacts.has('package.json')) {
      const packageJson = this.generatePackageJson(result);
      await this.writeProjectFile('package.json', packageJson, outputResult);
    }

    /* generate tsconfig.json for TypeScript targets */
    if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      const tsConfig = this.generateTsConfig(result);
      await this.writeProjectFile('tsconfig.json', tsConfig, outputResult);
    }

    /* generate asconfig.json for AssemblyScript targets */
    if (result.outputFiles.has(CompilationTarget.ASSEMBLYSCRIPT)) {
      const asConfig = this.generateAsConfig(result);
      await this.writeProjectFile('asconfig.json', asConfig, outputResult);
    }

    /* generate .gitignore */
    const gitignore = this.generateGitignore(result);
    await this.writeProjectFile('.gitignore', gitignore, outputResult);

    /* generate README.md if metadata is available */
    if (result.request.metadata) {
      const readme = this.generateReadme(result);
      await this.writeProjectFile('README.md', readme, outputResult);
    }
  }

  private async generateIndexFiles(
    result: CompilationResult,
    outputResult: OutputResult
  ): Promise<void> {
    /* generate index files for each target */
    for (const [target, files] of result.outputFiles) {
      const indexContent = this.generateIndexContent(target, files, result);
      const indexFilename = this.getIndexFilename(target);

      await this.writeProjectFile(indexFilename, indexContent, outputResult);
    }
  }

  private async writeProjectFile(
    filename: string,
    content: string,
    outputResult: OutputResult
  ): Promise<void> {
    try {
      const fullPath = this.fileSystem.join(
        this.configuration.outputDirectory,
        filename
      );
      await this.fileSystem.writeFile(fullPath, content);
      outputResult.filesCreated.push(fullPath);
      outputResult.statistics.totalFiles++;
      outputResult.statistics.totalSize += content.length;
    } catch (error) {
      this.addError(
        outputResult,
        `Failed to write project file ${filename}: ${error}`,
        'PROJECT_FILE_FAILED',
        filename
      );
    }
  }

  /*

           content processing utilities

  */

  private insertFileHeader(
    content: string,
    filename: string,
    compilationResult: CompilationResult
  ): string {
    let header = '';

    header += '/*\n';
    header += ` * Generated from WORLDC\n`;
    header += ` * File: ${filename}\n`;

    if (
      this.configuration.metadata.includeSourceInfo &&
      compilationResult.request.filename
    ) {
      header += ` * Source: ${compilationResult.request.filename}\n`;
    }

    if (this.configuration.metadata.includeGenerationTime) {
      header += ` * Generated: ${new Date().toISOString()}\n`;
    }

    if (this.configuration.metadata.includeCompilerInfo) {
      header += ` * Compiler: WORLDC v1.0.0\n`;
    }

    /* add custom headers */
    if (this.configuration.metadata.customHeaders) {
      for (const [key, value] of this.configuration.metadata.customHeaders) {
        header += ` * ${key}: ${value}\n`;
      }
    }

    header += ' */\n\n';

    return header;
  }

  private prettifyContent(content: string, filename: string): string {
    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'ts':
      case 'js':
        return this.prettifyJavaScript(content);
      case 'json':
        return this.prettifyJson(content);
      default:
        return content;
    }
  }

  private prettifyJavaScript(content: string): string {
    /* basic JavaScript prettification */
    return content
      .replace(/;/g, ';\n')
      .replace(/{/g, ' {\n')
      .replace(/}/g, '\n}\n')
      .replace(/,/g, ',\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  private prettifyJson(content: string): string {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  private removeComments(content: string, filename: string): string {
    const extension = this.getFileExtension(filename);

    if (extension === 'ts' || extension === 'js') {
      /* remove single-line comments */
      content = content.replace(/\/\/.*$/gm, '');
      /* remove multi-line comments */
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    return content;
  }

  private minifyContent(content: string, filename: string): string {
    /* basic minification - remove extra whitespace */
    return content
      .replace(/\s+/g, ' ') /* collapse whitespace */
      .replace(/;\s+/g, ';') /* remove space after semicolons */
      .replace(/{\s+/g, '{') /* remove space after opening braces */
      .replace(/\s+}/g, '}') /* remove space before closing braces */
      .trim();
  }

  /*

           project configuration generators

  */

  private generatePackageJson(result: CompilationResult): string {
    const metadata = result.request.metadata || {};

    const config = {
      name: (metadata as any).projectName || 'worldc-project',
      version: (metadata as any).version || '1.0.0',
      description: (metadata as any).description || 'Generated from WORLDC',
      author: (metadata as any).author || 'WORLDC Compiler',
      license: 'ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0',
      main: this.getMainEntry(result),
      types: this.getTypesEntry(result),
      scripts: this.generateScripts(result),
      dependencies: {},
      devDependencies: this.generateDevDependencies(result),
    };

    return JSON.stringify(config, null, 2);
  }

  private generateTsConfig(result: CompilationResult): string {
    const config = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    };

    return JSON.stringify(config, null, 2);
  }

  private generateAsConfig(result: CompilationResult): string {
    const config = {
      targets: {
        debug: {
          outFile: 'build/debug.wasm',
          textFile: 'build/debug.wat',
          sourceMap: true,
          debug: true,
        },
        release: {
          outFile: 'build/release.wasm',
          textFile: 'build/release.wat',
          sourceMap: true,
          optimizeLevel: 3,
          shrinkLevel: 0,
        },
      },
      options: {},
    };

    return JSON.stringify(config, null, 2);
  }

  private generateGitignore(result: CompilationResult): string {
    return [
      'node_modules/',
      'dist/',
      'build/',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.temp',
    ].join('\n');
  }

  private generateReadme(result: CompilationResult): string {
    const metadata = result.request.metadata || {};

    let readme = `# ${(metadata as any).projectName || 'WORLDC Project'}\n\n`;
    readme += `${(metadata as any).description || 'Generated from WORLDC language'}\n\n`;

    readme += '## Generated Files\n\n';
    for (const [target, files] of result.outputFiles) {
      readme += `### ${target}\n\n`;
      for (const file of files) {
        readme += `- \`${file}\`\n`;
      }
      readme += '\n';
    }

    readme += '## Build Scripts\n\n';
    readme += '```bash\n';
    readme += 'npm install\n';
    if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      readme += 'npm run build:ts\n';
    }
    if (result.outputFiles.has(CompilationTarget.ASSEMBLYSCRIPT)) {
      readme += 'npm run build:as\n';
    }
    readme += '```\n\n';

    readme += '## License\n\n';
    readme += 'Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0\n';

    return readme;
  }

  /*

           utility methods

  */

  private getTargetDirectory(filename: string): string {
    if (!this.configuration.createSubdirectories) {
      return this.configuration.outputDirectory;
    }

    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'ts':
        return this.fileSystem.join(this.configuration.outputDirectory, 'src');
      case 'd.ts':
        return this.fileSystem.join(
          this.configuration.outputDirectory,
          'types'
        );
      case 'js':
        return this.fileSystem.join(this.configuration.outputDirectory, 'lib');
      case 'wasm':
      case 'wat':
        return this.fileSystem.join(
          this.configuration.outputDirectory,
          'build'
        );
      case 'md':
        return this.fileSystem.join(this.configuration.outputDirectory, 'docs');
      default:
        return this.configuration.outputDirectory;
    }
  }

  private inferTargetFromFilename(filename: string): CompilationTarget {
    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'ts':
        return filename.includes('.as.')
          ? CompilationTarget.ASSEMBLYSCRIPT
          : CompilationTarget.TYPESCRIPT;
      case 'js':
        return CompilationTarget.JAVASCRIPT;
      case 'wasm':
        return CompilationTarget.WASM;
      default:
        return CompilationTarget.TYPESCRIPT;
    }
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > -1 ? filename.substring(lastDot + 1) : '';
  }

  private getContentType(filename: string): string {
    const extension = this.getFileExtension(filename);

    switch (extension) {
      case 'ts':
        return 'text/typescript';
      case 'js':
        return 'text/javascript';
      case 'json':
        return 'application/json';
      case 'md':
        return 'text/markdown';
      case 'wasm':
        return 'application/wasm';
      default:
        return 'text/plain';
    }
  }

  private calculateChecksum(content: string): string {
    /* simple checksum calculation */
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; /* convert to 32-bit integer */
    }
    return hash.toString(16);
  }

  private getMainEntry(result: CompilationResult): string {
    if (result.outputFiles.has(CompilationTarget.JAVASCRIPT)) {
      return 'lib/index.js';
    } else if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      return 'src/index.ts';
    }
    return 'index.js';
  }

  private getTypesEntry(result: CompilationResult): string | undefined {
    return result.outputFiles.has(CompilationTarget.TYPESCRIPT)
      ? 'types/index.d.ts'
      : undefined;
  }

  private generateScripts(result: CompilationResult): Record<string, string> {
    const scripts: Record<string, string> = {};

    if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      scripts['build:ts'] = 'tsc';
      scripts['dev:ts'] = 'tsc --watch';
    }

    if (result.outputFiles.has(CompilationTarget.ASSEMBLYSCRIPT)) {
      scripts['build:as'] = 'asc src/index.as.ts -b build/optimized.wasm -O3z';
      scripts['build:as:debug'] =
        'asc src/index.as.ts -b build/debug.wasm --debug';
    }

    scripts['clean'] = 'rm -rf dist build';

    return scripts;
  }

  private generateDevDependencies(
    result: CompilationResult
  ): Record<string, string> {
    const deps: Record<string, string> = {};

    if (result.outputFiles.has(CompilationTarget.TYPESCRIPT)) {
      deps['typescript'] = '^5.0.0';
      deps['@types/node'] = '^20.0.0';
    }

    if (result.outputFiles.has(CompilationTarget.ASSEMBLYSCRIPT)) {
      deps['assemblyscript'] = '^0.27.0';
    }

    return deps;
  }

  private generateIndexContent(
    target: CompilationTarget,
    files: string[],
    result: CompilationResult
  ): string {
    let content = '';

    /* add header comment */
    content += `/* Index file for ${target} */\n\n`;

    /* add exports */
    for (const file of files) {
      const moduleName = file.replace(/\.[^.]+$/, '');
      const exportName = this.getExportName(file);
      content += `export * from './${moduleName}';\n`;
    }

    return content;
  }

  private getIndexFilename(target: CompilationTarget): string {
    switch (target) {
      case CompilationTarget.TYPESCRIPT:
        return 'src/index.ts';
      case CompilationTarget.ASSEMBLYSCRIPT:
        return 'src/index.as.ts';
      case CompilationTarget.JAVASCRIPT:
        return 'lib/index.js';
      default:
        return 'index.js';
    }
  }

  private getExportName(filename: string): string {
    return filename
      .replace(/\.[^.]+$/, '') /* remove extension */
      .replace(
        /[^a-zA-Z0-9]/g,
        '_'
      ) /* replace non-alphanumeric with underscore */
      .replace(/^[0-9]/, '_$&'); /* prefix numbers with underscore */
  }

  private addError(
    result: OutputResult,
    message: string,
    code: string,
    filename?: string
  ): void {
    result.errors.push({
      severity: 'error',
      message,
      code,
      filename,
      operation: 'output',
    });
  }

  /*

           public API methods

  */

  public getConfiguration(): OutputConfiguration {
    return { ...this.configuration };
  }

  public updateConfiguration(config: Partial<OutputConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  public getArtifacts(): Map<string, FileArtifact> {
    return new Map(this.artifacts);
  }

  public clearArtifacts(): void {
    this.artifacts.clear();
  }
}

/*
    ====================================
             --- FILE SYSTEM ---
    ====================================
*/

/*

         FileSystemInterface
           ---
           abstraction for file system operations to support
           different environments (browser, Node.js, etc.).

*/

export interface FileSystemInterface {
  exists(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  join(...paths: string[]): string;
}

/*

         BrowserFileSystem
           ---
           browser-compatible file system implementation
           using in-memory storage and download capabilities.

*/

export class BrowserFileSystem implements FileSystemInterface {
  private files: Map<string, string> = new Map();

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async createDirectory(path: string): Promise<void> {
    /* directories are implicit in browser environment */
  }

  async writeFile(path: string, content: string): Promise<void> {
    /* check if we're in a browser environment */
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      /* trigger download in browser */
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      /* Node.js environment - would need fs module */
      throw new Error(
        'File writing not supported in Node.js environment for BrowserFileSystem'
      );
    }
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  join(...paths: string[]): string {
    return paths.join('/');
  }
}

/*

         OutputManagerFactory
           ---
           factory for creating configured output managers
           for different environments and use cases.

*/

export class OutputManagerFactory {
  public static createDefault(outputDir: string): OutputManager {
    const config: OutputConfiguration = {
      outputDirectory: outputDir,
      createSubdirectories: true,
      preserveSourceStructure: false,
      fileNaming: {
        useTimestamp: false,
        includeTarget: true,
      },
      formatting: {
        prettify: true,
        removeComments: false,
        minify: false,
        insertHeaders: true,
      },
      metadata: {
        includeSourceInfo: true,
        includeGenerationTime: true,
        includeCompilerInfo: true,
      },
    };

    return new OutputManager(config);
  }

  public static createMinimal(outputDir: string): OutputManager {
    const config: OutputConfiguration = {
      outputDirectory: outputDir,
      createSubdirectories: false,
      preserveSourceStructure: false,
      fileNaming: {
        useTimestamp: false,
        includeTarget: false,
      },
      formatting: {
        prettify: false,
        removeComments: false,
        minify: false,
        insertHeaders: false,
      },
      metadata: {
        includeSourceInfo: false,
        includeGenerationTime: false,
        includeCompilerInfo: false,
      },
    };

    return new OutputManager(config);
  }
}

/*
    ====================================
             --- EOF ---
    ====================================
*/
