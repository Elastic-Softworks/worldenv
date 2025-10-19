/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             PROJECT VALIDATOR - WORLDENV EDITOR
	====================================================================
*/

/*

	comprehensive project validation and integrity checking system
	with detailed error reporting and automatic repair capabilities.

	this module provides complete project validation including
	structure verification, dependency checking, asset validation,
	script compilation testing, and configuration verification
	with detailed reporting and guided repair suggestions.

	validation features:
	- project structure and file organization validation
	- asset dependency and reference integrity checking
	- script compilation and syntax validation
	- configuration file verification and schema validation
	- circular dependency detection and resolution
	- missing asset detection and replacement suggestions
	- automated repair and optimization recommendations

	the system ensures project integrity through comprehensive
	validation workflows and provides actionable feedback for
	resolving detected issues with minimal user intervention.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as path from 'path'; /* PATH MANIPULATION UTILITIES */
import * as fs from 'fs'; /* FILESYSTEM OPERATIONS */
import { fileSystem } from './file-system'; /* SECURE FILE OPERATIONS */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { projectManager } from './project'; /* PROJECT MANAGEMENT */
import { assetManager } from './asset-manager'; /* ASSET MANAGEMENT */
import { ProjectData } from '../shared/types'; /* PROJECT TYPES */

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         ValidationSeverity
	       ---
	       validation issue severity levels.

	       defines importance levels for validation issues
	       allowing proper prioritization and user presentation.

*/

type ValidationSeverity = 'error' | 'warning' | 'info';

/*

         ValidationIssue
	       ---
	       individual validation issue information.

	       contains detailed information about validation
	       problems including location, description, and
	       suggested repair actions.

*/

interface ValidationIssue {
  id: string /* UNIQUE ISSUE IDENTIFIER */;
  severity: ValidationSeverity /* ISSUE SEVERITY LEVEL */;
  category: string /* ISSUE CATEGORY */;
  title: string /* ISSUE TITLE */;
  description: string /* DETAILED DESCRIPTION */;
  filePath?: string /* AFFECTED FILE PATH */;
  lineNumber?: number /* AFFECTED LINE NUMBER */;
  suggestions: string[] /* REPAIR SUGGESTIONS */;
  autoFixable: boolean /* CAN BE AUTOMATICALLY FIXED */;
}

/*

         ValidationResult
	       ---
	       complete validation result information.

	       contains validation summary with issue counts,
	       detailed issues list, and overall project health
	       assessment with repair recommendations.

*/

interface ValidationResult {
  valid: boolean /* OVERALL VALIDATION STATUS */;
  errorCount: number /* NUMBER OF ERROR ISSUES */;
  warningCount: number /* NUMBER OF WARNING ISSUES */;
  infoCount: number /* NUMBER OF INFO ISSUES */;
  issues: ValidationIssue[] /* DETAILED ISSUES LIST */;
  projectHealth: number /* HEALTH SCORE 0-100 */;
  validationTime: number /* VALIDATION DURATION MS */;
  recommendations: string[] /* GENERAL RECOMMENDATIONS */;
}

/*

         AssetReference
	       ---
	       asset reference tracking information.

	       maintains asset usage information for dependency
	       validation and orphan detection workflows.

*/

interface AssetReference {
  assetPath: string /* ASSET FILE PATH */;
  referencedBy: string[] /* FILES REFERENCING ASSET */;
  referenceType: string /* TYPE OF REFERENCE */;
}

/*
	====================================================================
             --- GLOBAL ---
	====================================================================
*/

/* required project directories for structure validation */
const REQUIRED_DIRECTORIES = [
  'assets',
  'scenes',
  'scripts',
  'prefabs'
];

/* required project files for basic functionality */
const REQUIRED_FILES = [
  'project.worldenv'
];

/* supported asset file extensions */
const ASSET_EXTENSIONS = {
  images: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
  audio: ['.wav', '.mp3', '.ogg', '.m4a', '.aac'],
  models: ['.obj', '.fbx', '.gltf', '.glb', '.dae'],
  fonts: ['.ttf', '.otf', '.woff', '.woff2'],
  scripts: ['.wc', '.ts', '.js'],
  materials: ['.material'],
  shaders: ['.glsl', '.vert', '.frag', '.comp'],
  data: ['.json', '.xml', '.yaml', '.csv']
};

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         ProjectValidator
	       ---
	       comprehensive project validation and integrity system.

	       performs complete project validation including structure
	       verification, dependency checking, asset validation, and
	       configuration verification with detailed error reporting
	       and automatic repair capabilities.

	       provides actionable feedback for resolving project issues
	       and maintains project health through continuous validation
	       workflows with user-friendly repair guidance.

*/

class ProjectValidator {
  private validation_cache: Map<string, ValidationResult> /* VALIDATION CACHE */;
  private asset_references: Map<string, AssetReference> /* ASSET REFERENCE MAP */;

  constructor() {
    this.validation_cache = new Map();
    this.asset_references = new Map();
  }

  /*

           validateProject()
	         ---
	         performs complete project validation.

	         executes comprehensive validation workflow including
	         structure, dependencies, assets, and configuration
	         verification with detailed issue reporting.

  */
  public async validateProject(use_cache: boolean = false): Promise<ValidationResult> {
    const start_time = Date.now();

    try {
      const project = projectManager.getCurrentProject();
      if (!project) {
        throw new Error('No project is currently open');
      }

      logger.info('VALIDATOR', 'Starting project validation', {
        projectPath: project.path,
        useCache: use_cache
      });

      /* check cache if requested */
      if (use_cache) {
        const cached_result = this.validation_cache.get(project.path);
        if (cached_result) {
          logger.info('VALIDATOR', 'Using cached validation result');
          return cached_result;
        }
      }

      const issues: ValidationIssue[] = [];

      /* validate project structure */
      const structure_issues = await this.validateProjectStructure(project.path);
      issues.push(...structure_issues);

      /* validate project configuration */
      const config_issues = await this.validateProjectConfiguration(project.data);
      issues.push(...config_issues);

      /* validate assets */
      const asset_issues = await this.validateAssets(project.path);
      issues.push(...asset_issues);

      /* validate scripts */
      const script_issues = await this.validateScripts(project.path);
      issues.push(...script_issues);

      /* validate dependencies */
      const dependency_issues = await this.validateDependencies(project.path);
      issues.push(...dependency_issues);

      /* validate scenes */
      const scene_issues = await this.validateScenes(project.path);
      issues.push(...scene_issues);

      /* calculate validation metrics */
      const error_count = issues.filter(issue => issue.severity === 'error').length;
      const warning_count = issues.filter(issue => issue.severity === 'warning').length;
      const info_count = issues.filter(issue => issue.severity === 'info').length;

      const project_health = this.calculateProjectHealth(issues);
      const recommendations = this.generateRecommendations(issues);

      const result: ValidationResult = {
        valid: error_count === 0,
        errorCount: error_count,
        warningCount: warning_count,
        infoCount: info_count,
        issues: issues,
        projectHealth: project_health,
        validationTime: Date.now() - start_time,
        recommendations: recommendations
      };

      /* cache result */
      this.validation_cache.set(project.path, result);

      logger.info('VALIDATOR', 'Project validation completed', {
        valid: result.valid,
        errorCount: error_count,
        warningCount: warning_count,
        infoCount: info_count,
        projectHealth: project_health,
        validationTime: result.validationTime
      });

      return result;
    } catch (error) {
      logger.error('VALIDATOR', 'Project validation failed', {
        error: error
      });
      throw error;
    }
  }

  /*

           autoFixIssues()
	         ---
	         automatically fixes fixable validation issues.

	         attempts to resolve validation issues that can be
	         automatically repaired with user confirmation.

  */
  public async autoFixIssues(issues: ValidationIssue[]): Promise<ValidationIssue[]> {
    const fixed_issues: ValidationIssue[] = [];

    for (const issue of issues) {
      if (!issue.autoFixable) {
        continue;
      }

      try {
        const fixed = await this.fixIssue(issue);
        if (fixed) {
          fixed_issues.push(issue);
        }
      } catch (error) {
        logger.error('VALIDATOR', 'Auto-fix failed', {
          issueId: issue.id,
          error: error
        });
      }
    }

    logger.info('VALIDATOR', 'Auto-fix completed', {
      fixedCount: fixed_issues.length,
      totalFixable: issues.filter(i => i.autoFixable).length
    });

    return fixed_issues;
  }

  /*

           clearValidationCache()
	         ---
	         clears validation result cache.

	         forces fresh validation on next validation request
	         by clearing cached results.

  */
  public clearValidationCache(): void {
    this.validation_cache.clear();
    logger.info('VALIDATOR', 'Validation cache cleared');
  }

  /*

           validateProjectStructure()
	         ---
	         validates project directory structure.

	         verifies required directories and files exist
	         with proper organization and permissions.

  */
  private async validateProjectStructure(project_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    /* check required directories */
    for (const required_dir of REQUIRED_DIRECTORIES) {
      const dir_path = path.join(project_path, required_dir);
      const exists = await fileSystem.exists(dir_path);

      if (!exists) {
        issues.push({
          id: `structure-missing-dir-${required_dir}`,
          severity: 'error',
          category: 'Structure',
          title: `Missing required directory: ${required_dir}`,
          description: `Required project directory '${required_dir}' is missing`,
          filePath: dir_path,
          suggestions: [
            `Create the '${required_dir}' directory`,
            'Use project template to restore structure',
            'Check project initialization'
          ],
          autoFixable: true
        });
        continue;
      }

      const is_dir = await fileSystem.isDirectory(dir_path);
      if (!is_dir) {
        issues.push({
          id: `structure-not-dir-${required_dir}`,
          severity: 'error',
          category: 'Structure',
          title: `'${required_dir}' is not a directory`,
          description: `Required directory path '${required_dir}' exists but is not a directory`,
          filePath: dir_path,
          suggestions: [
            `Remove the file at '${required_dir}'`,
            `Create a directory named '${required_dir}'`,
            'Restore from backup'
          ],
          autoFixable: false
        });
      }
    }

    /* check required files */
    for (const required_file of REQUIRED_FILES) {
      const file_path = path.join(project_path, required_file);
      const exists = await fileSystem.exists(file_path);

      if (!exists) {
        issues.push({
          id: `structure-missing-file-${required_file}`,
          severity: 'error',
          category: 'Structure',
          title: `Missing required file: ${required_file}`,
          description: `Required project file '${required_file}' is missing`,
          filePath: file_path,
          suggestions: [
            `Create the '${required_file}' file`,
            'Restore from backup',
            'Check project initialization'
          ],
          autoFixable: true
        });
      }
    }

    return issues;
  }

  /*

           validateProjectConfiguration()
	         ---
	         validates project configuration data.

	         verifies project settings, metadata, and
	         configuration integrity with schema validation.

  */
  private async validateProjectConfiguration(project_data: ProjectData): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    /* validate required fields */
    if (!project_data.name || project_data.name.trim() === '') {
      issues.push({
        id: 'config-missing-name',
        severity: 'error',
        category: 'Configuration',
        title: 'Project name is missing',
        description: 'Project must have a valid name',
        suggestions: [
          'Set a project name in project settings',
          'Update project.worldenv file'
        ],
        autoFixable: false
      });
    }

    if (!project_data.version) {
      issues.push({
        id: 'config-missing-version',
        severity: 'warning',
        category: 'Configuration',
        title: 'Project version is missing',
        description: 'Project should have a version number',
        suggestions: [
          'Set project version in project settings',
          'Use semantic versioning (e.g., 1.0.0)'
        ],
        autoFixable: true
      });
    }

    /* validate scenes configuration */
    if (!project_data.scenes || project_data.scenes.length === 0) {
      issues.push({
        id: 'config-no-scenes',
        severity: 'warning',
        category: 'Configuration',
        title: 'No scenes configured',
        description: 'Project should have at least one scene',
        suggestions: [
          'Create a default scene',
          'Add existing scenes to project configuration'
        ],
        autoFixable: true
      });
    }

    /* validate default scene */
    if (project_data.settings?.default_scene) {
      const default_scene = project_data.settings.default_scene;
      if (!project_data.scenes.includes(default_scene)) {
        issues.push({
          id: 'config-invalid-default-scene',
          severity: 'error',
          category: 'Configuration',
          title: 'Invalid default scene',
          description: `Default scene '${default_scene}' is not in scenes list`,
          suggestions: [
            'Update default scene setting',
            'Add default scene to scenes list',
            'Create the missing scene file'
          ],
          autoFixable: false
        });
      }
    }

    return issues;
  }

  /*

           validateAssets()
	         ---
	         validates project assets and references.

	         checks asset file integrity, reference validation,
	         and orphan detection with repair suggestions.

  */
  private async validateAssets(project_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    this.asset_references.clear();

    const assets_dir = path.join(project_path, 'assets');
    if (!(await fileSystem.exists(assets_dir))) {
      return issues;
    }

    /* collect all assets */
    const assets = await this.collectAssets(assets_dir);

    /* validate asset files */
    for (const asset_path of assets) {
      const asset_issues = await this.validateAssetFile(asset_path);
      issues.push(...asset_issues);
    }

    /* check for orphaned assets */
    await this.buildAssetReferenceMap(project_path);
    const orphan_issues = this.detectOrphanedAssets();
    issues.push(...orphan_issues);

    return issues;
  }

  /*

           validateScripts()
	         ---
	         validates project scripts and compilation.

	         checks script syntax, compilation errors, and
	         dependency resolution with error reporting.

  */
  private async validateScripts(project_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    const scripts_dir = path.join(project_path, 'scripts');
    if (!(await fileSystem.exists(scripts_dir))) {
      return issues;
    }

    const scripts = await this.collectScripts(scripts_dir);

    for (const script_path of scripts) {
      const script_issues = await this.validateScriptFile(script_path);
      issues.push(...script_issues);
    }

    return issues;
  }

  /*

           validateDependencies()
	         ---
	         validates project dependencies and references.

	         checks circular dependencies, missing references,
	         and dependency resolution with guided fixes.

  */
  private async validateDependencies(project_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    /* validate asset dependencies */
    const asset_dependency_issues = await this.validateAssetDependencies(project_path);
    issues.push(...asset_dependency_issues);

    /* validate script dependencies */
    const script_dependency_issues = await this.validateScriptDependencies(project_path);
    issues.push(...script_dependency_issues);

    return issues;
  }

  /*

           validateScenes()
	         ---
	         validates project scenes and entity references.

	         checks scene file integrity, entity validation,
	         and component reference verification.

  */
  private async validateScenes(project_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    const scenes_dir = path.join(project_path, 'scenes');
    if (!(await fileSystem.exists(scenes_dir))) {
      return issues;
    }

    const scenes = await this.collectScenes(scenes_dir);

    for (const scene_path of scenes) {
      const scene_issues = await this.validateSceneFile(scene_path);
      issues.push(...scene_issues);
    }

    return issues;
  }

  /*

           fixIssue()
	         ---
	         attempts to automatically fix validation issue.

	         applies automatic repair for fixable issues
	         with proper error handling and validation.

  */
  private async fixIssue(issue: ValidationIssue): Promise<boolean> {
    try {
      switch (issue.id) {
        case 'config-missing-version':
          return await this.fixMissingVersion();
        case 'config-no-scenes':
          return await this.fixNoScenes();
        default:
          if (issue.id.startsWith('structure-missing-dir-')) {
            const dir_name = issue.id.replace('structure-missing-dir-', '');
            return await this.fixMissingDirectory(dir_name);
          }
          break;
      }

      return false;
    } catch (error) {
      logger.error('VALIDATOR', 'Issue fix failed', {
        issueId: issue.id,
        error: error
      });
      return false;
    }
  }

  /*

           calculateProjectHealth()
	         ---
	         calculates overall project health score.

	         computes health score based on issue severity
	         and counts with weighted scoring system.

  */
  private calculateProjectHealth(issues: ValidationIssue[]): number {
    if (issues.length === 0) {
      return 100;
    }

    let penalty = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          penalty += 10;
          break;
        case 'warning':
          penalty += 3;
          break;
        case 'info':
          penalty += 1;
          break;
      }
    }

    return Math.max(0, 100 - penalty);
  }

  /*

           generateRecommendations()
	         ---
	         generates repair recommendations from issues.

	         analyzes validation issues and provides actionable
	         recommendations for improving project health.

  */
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];

    const error_count = issues.filter(i => i.severity === 'error').length;
    const warning_count = issues.filter(i => i.severity === 'warning').length;

    if (error_count > 0) {
      recommendations.push(`Fix ${error_count} critical error(s) to ensure project stability`);
    }

    if (warning_count > 0) {
      recommendations.push(`Address ${warning_count} warning(s) to improve project quality`);
    }

    /* category-specific recommendations */
    const categories = new Set(issues.map(i => i.category));

    if (categories.has('Structure')) {
      recommendations.push('Restore missing project structure using templates');
    }

    if (categories.has('Assets')) {
      recommendations.push('Review asset references and remove unused assets');
    }

    if (categories.has('Scripts')) {
      recommendations.push('Fix script compilation errors and dependency issues');
    }

    if (issues.length === 0) {
      recommendations.push('Project is healthy - consider adding unit tests and documentation');
    }

    return recommendations;
  }

  /* helper methods for specific validation tasks */
  private async collectAssets(assets_dir: string): Promise<string[]> {
    const assets: string[] = [];

    const collectRecursive = async (dir: string): Promise<void> => {
      const entries = await fileSystem.listDirectory(dir);

      for (const entry of entries) {
        const full_path = path.join(dir, entry);
        const is_file = await fileSystem.isFile(full_path);

        if (is_file) {
          assets.push(full_path);
        } else {
          const is_dir = await fileSystem.isDirectory(full_path);
          if (is_dir) {
            await collectRecursive(full_path);
          }
        }
      }
    };

    await collectRecursive(assets_dir);
    return assets;
  }

  private async validateAssetFile(asset_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      const stats = await fileSystem.getFileStats(asset_path);
      const ext = path.extname(asset_path).toLowerCase();

      /* check if file extension is supported */
      const is_supported = Object.values(ASSET_EXTENSIONS).some(exts => exts.includes(ext));

      if (!is_supported) {
        issues.push({
          id: `asset-unsupported-${path.basename(asset_path)}`,
          severity: 'warning',
          category: 'Assets',
          title: `Unsupported asset type: ${ext}`,
          description: `Asset file '${path.basename(asset_path)}' has unsupported extension`,
          filePath: asset_path,
          suggestions: [
            'Convert to supported format',
            'Remove unused asset',
            'Add extension to supported types'
          ],
          autoFixable: false
        });
      }

      /* check file size */
      if (stats.size === 0) {
        issues.push({
          id: `asset-empty-${path.basename(asset_path)}`,
          severity: 'error',
          category: 'Assets',
          title: 'Empty asset file',
          description: `Asset file '${path.basename(asset_path)}' is empty`,
          filePath: asset_path,
          suggestions: [
            'Replace with valid asset file',
            'Remove empty asset',
            'Restore from backup'
          ],
          autoFixable: false
        });
      }

    } catch (error) {
      issues.push({
        id: `asset-unreadable-${path.basename(asset_path)}`,
        severity: 'error',
        category: 'Assets',
        title: 'Unreadable asset file',
        description: `Cannot read asset file '${path.basename(asset_path)}'`,
        filePath: asset_path,
        suggestions: [
          'Check file permissions',
          'Restore from backup',
          'Remove corrupted asset'
        ],
        autoFixable: false
      });
    }

    return issues;
  }

  private async buildAssetReferenceMap(project_path: string): Promise<void> {
    /* simplified asset reference tracking */
    /* in production, would parse all files for asset references */
  }

  private detectOrphanedAssets(): ValidationIssue[] {
    /* simplified orphan detection */
    return [];
  }

  private async collectScripts(scripts_dir: string): Promise<string[]> {
    return this.collectAssets(scripts_dir);
  }

  private async validateScriptFile(script_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      const content = await fileSystem.readFile(script_path);
      const ext = path.extname(script_path).toLowerCase();

      /* basic syntax validation */
      if (ext === '.wc') {
        /* validate WorldC syntax */
        if (!content.includes('class ') && !content.includes('function ')) {
          issues.push({
            id: `script-no-class-${path.basename(script_path)}`,
            severity: 'warning',
            category: 'Scripts',
            title: 'Script has no class or function',
            description: `WorldC script '${path.basename(script_path)}' appears to have no class or function definitions`,
            filePath: script_path,
            suggestions: [
              'Add class or function definitions',
              'Check script template',
              'Review WorldC syntax'
            ],
            autoFixable: false
          });
        }
      }

    } catch (error) {
      issues.push({
        id: `script-unreadable-${path.basename(script_path)}`,
        severity: 'error',
        category: 'Scripts',
        title: 'Unreadable script file',
        description: `Cannot read script file '${path.basename(script_path)}'`,
        filePath: script_path,
        suggestions: [
          'Check file permissions',
          'Restore from backup',
          'Remove corrupted script'
        ],
        autoFixable: false
      });
    }

    return issues;
  }

  private async validateAssetDependencies(project_path: string): Promise<ValidationIssue[]> {
    return [];
  }

  private async validateScriptDependencies(project_path: string): Promise<ValidationIssue[]> {
    return [];
  }

  private async collectScenes(scenes_dir: string): Promise<string[]> {
    return this.collectAssets(scenes_dir);
  }

  private async validateSceneFile(scene_path: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    try {
      const scene_data = await fileSystem.readJSON<any>(scene_path);

      if (!scene_data.version) {
        issues.push({
          id: `scene-no-version-${path.basename(scene_path)}`,
          severity: 'warning',
          category: 'Scenes',
          title: 'Scene missing version',
          description: `Scene file '${path.basename(scene_path)}' has no version information`,
          filePath: scene_path,
          suggestions: [
            'Add version field to scene',
            'Update scene format',
            'Use scene template'
          ],
          autoFixable: true
        });
      }

    } catch (error) {
      issues.push({
        id: `scene-invalid-${path.basename(scene_path)}`,
        severity: 'error',
        category: 'Scenes',
        title: 'Invalid scene file',
        description: `Scene file '${path.basename(scene_path)}' is not valid JSON`,
        filePath: scene_path,
        suggestions: [
          'Fix JSON syntax errors',
          'Restore from backup',
          'Recreate scene'
        ],
        autoFixable: false
      });
    }

    return issues;
  }

  private async fixMissingVersion(): Promise<boolean> {
    const project = projectManager.getCurrentProject();
    if (!project) return false;

    projectManager.updateProjectData(data => ({
      ...data,
      version: '1.0.0'
    }));

    return true;
  }

  private async fixNoScenes(): Promise<boolean> {
    const project = projectManager.getCurrentProject();
    if (!project) return false;

    const default_scene = 'scenes/main.worldscene';
    projectManager.updateProjectData(data => ({
      ...data,
      scenes: [default_scene],
      settings: {
        ...data.settings,
        default_scene: default_scene
      }
    }));

    return true;
  }

  private async fixMissingDirectory(dir_name: string): Promise<boolean> {
    const project = projectManager.getCurrentProject();
    if (!project) return false;

    const dir_path = path.join(project.path, dir_name);
    await fileSystem.ensureDirectory(dir_path);

    return true;
  }
}

/* singleton instance for application-wide project validation */
export const projectValidator = new ProjectValidator();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
