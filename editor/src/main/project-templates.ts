/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             PROJECT TEMPLATES MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	comprehensive project template management system with template
	discovery, instantiation, and customization capabilities.

	this module manages complete project template operations including
	template scanning, variable substitution, file generation, and
	project structure creation with proper dependency management
	and configuration customization.

	template features:
	- dynamic template discovery from template directories
	- variable substitution and customization workflows
	- multi-file template instantiation with dependencies
	- project structure validation and verification
	- template metadata and documentation integration
	- custom template creation and registration

	the system provides reliable project bootstrapping through
	comprehensive template management with proper error handling
	and progress tracking for complex template instantiation.

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

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         ProjectTemplate
	       ---
	       complete project template definition.

	       contains template metadata, file mappings, and
	       configuration for project instantiation with
	       variable substitution and dependency management.

*/

interface ProjectTemplate {
  id: string /* UNIQUE TEMPLATE IDENTIFIER */;
  name: string /* DISPLAY NAME */;
  description: string /* TEMPLATE DESCRIPTION */;
  category: string /* TEMPLATE CATEGORY */;
  version: string /* TEMPLATE VERSION */;
  icon?: string /* TEMPLATE ICON PATH */;
  thumbnail?: string /* TEMPLATE THUMBNAIL PATH */;
  author: string /* TEMPLATE AUTHOR */;
  license: string /* TEMPLATE LICENSE */;
  tags: string[] /* TEMPLATE TAGS */;
  difficulty: 'beginner' | 'intermediate' | 'advanced' /* DIFFICULTY LEVEL */;
  estimatedTime: string /* ESTIMATED COMPLETION TIME */;
  targetPlatforms: string[] /* TARGET PLATFORMS */;
  engineFeatures: string[] /* REQUIRED ENGINE FEATURES */;
  projectSettings: any /* PROJECT CONFIGURATION */;
  directories: string[] /* DIRECTORY STRUCTURE */;
  files: TemplateFile[] /* TEMPLATE FILES */;
  sampleAssets: SampleAsset[] /* SAMPLE ASSETS */;
  buildSettings: any /* BUILD CONFIGURATION */;
  dependencies: any /* TEMPLATE DEPENDENCIES */;
  tutorial?: TutorialConfig /* TUTORIAL CONFIGURATION */;
  documentation: DocumentationConfig /* DOCUMENTATION LINKS */;
}

/*

         TemplateFile
	       ---
	       individual template file definition.

	       contains source file mapping with destination
	       path and variable substitution configuration.

*/

interface TemplateFile {
  source: string /* SOURCE FILE PATH */;
  destination: string /* DESTINATION FILE PATH */;
  variables: Record<string, string> /* VARIABLE SUBSTITUTIONS */;
  conditional?: string /* CONDITIONAL INCLUSION */;
  permissions?: string /* FILE PERMISSIONS */;
}

/*

         SampleAsset
	       ---
	       sample asset file definition.

	       defines sample assets to be included with
	       template instantiation for immediate usability.

*/

interface SampleAsset {
  type: string /* ASSET TYPE */;
  name: string /* ASSET NAME */;
  destination: string /* DESTINATION PATH */;
  description: string /* ASSET DESCRIPTION */;
  source?: string /* SOURCE ASSET PATH */;
}

/*

         TutorialConfig
	       ---
	       template tutorial configuration.

	       defines guided tutorial steps for template
	       familiarization and feature demonstration.

*/

interface TutorialConfig {
  enabled: boolean /* TUTORIAL ENABLED */;
  steps: TutorialStep[] /* TUTORIAL STEPS */;
}

/*

         TutorialStep
	       ---
	       individual tutorial step definition.

	       contains step instructions and target elements
	       for guided template walkthrough.

*/

interface TutorialStep {
  title: string /* STEP TITLE */;
  description: string /* STEP DESCRIPTION */;
  target: string /* TARGET ELEMENT */;
  action: string /* TUTORIAL ACTION */;
}

/*

         DocumentationConfig
	       ---
	       template documentation configuration.

	       defines documentation resources and links
	       for template usage and customization.

*/

interface DocumentationConfig {
  readme: string /* README FILE PATH */;
  quickStart: string /* QUICK START GUIDE */;
  api: string /* API REFERENCE */;
  examples: string /* EXAMPLES DOCUMENTATION */;
  troubleshooting: string /* TROUBLESHOOTING GUIDE */;
}

/*

         TemplateInstantiationOptions
	       ---
	       template instantiation configuration.

	       controls template instantiation behavior including
	       variable values and customization options.

*/

interface TemplateInstantiationOptions {
  projectName: string /* PROJECT NAME */;
  projectPath: string /* PROJECT PATH */;
  variables: Record<string, string> /* TEMPLATE VARIABLES */;
  includeSampleAssets: boolean /* INCLUDE SAMPLE ASSETS */;
  includeTutorial: boolean /* INCLUDE TUTORIAL */;
  customSettings?: any /* CUSTOM PROJECT SETTINGS */;
}

/*

         TemplateVariable
	       ---
	       template variable definition.

	       defines customizable template variables with
	       validation and default values.

*/

interface TemplateVariable {
  name: string /* VARIABLE NAME */;
  type: 'string' | 'number' | 'boolean' | 'select' /* VARIABLE TYPE */;
  description: string /* VARIABLE DESCRIPTION */;
  defaultValue: any /* DEFAULT VALUE */;
  required: boolean /* REQUIRED VARIABLE */;
  options?: string[] /* SELECT OPTIONS */;
  validation?: string /* VALIDATION PATTERN */;
}

/*
	====================================================================
             --- GLOBAL ---
	====================================================================
*/

/* template directory paths */
const TEMPLATE_DIRECTORIES = [
  path.join(__dirname, '..', '..', 'templates', 'projects'),
  path.join(process.env.HOME || process.env.USERPROFILE || '', '.worldenv', 'templates')
];

/* built-in template variables */
const BUILT_IN_VARIABLES = [
  'ProjectName',
  'ProjectPath',
  'CreatedDate',
  'ModifiedDate',
  'Author',
  'Version'
];

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         ProjectTemplateManager
	       ---
	       comprehensive project template management system.

	       manages complete template lifecycle including discovery,
	       validation, instantiation, and customization with proper
	       variable substitution and dependency resolution.

	       provides reliable project bootstrapping through template
	       management with comprehensive error handling and progress
	       tracking for complex template workflows.

*/

class ProjectTemplateManager {
  private templates: Map<string, ProjectTemplate> /* TEMPLATE REGISTRY */;
  private template_cache: Map<string, any> /* TEMPLATE CACHE */;

  constructor() {
    this.templates = new Map();
    this.template_cache = new Map();
  }

  /*

           initialize()
	         ---
	         initializes template system with discovery.

	         scans template directories and loads available
	         templates with validation and registration.

  */
  public async initialize(): Promise<void> {
    try {
      logger.info('TEMPLATES', 'Initializing project template system');

      await this.discoverTemplates();

      logger.info('TEMPLATES', 'Template system initialized', {
        templateCount: this.templates.size
      });
    } catch (error) {
      logger.error('TEMPLATES', 'Template system initialization failed', {
        error: error
      });
      throw error;
    }
  }

  /*

           getAvailableTemplates()
	         ---
	         returns list of available project templates.

	         provides template metadata for template selection
	         interface with filtering and categorization.

  */
  public getAvailableTemplates(category?: string): ProjectTemplate[] {
    const templates = Array.from(this.templates.values());

    if (category) {
      return templates.filter(template => template.category === category);
    }

    return templates;
  }

  /*

           getTemplate()
	         ---
	         returns specific template by identifier.

	         retrieves template definition with complete
	         metadata and configuration information.

  */
  public getTemplate(template_id: string): ProjectTemplate | null {
    return this.templates.get(template_id) || null;
  }

  /*

           instantiateTemplate()
	         ---
	         creates project from template with customization.

	         performs complete template instantiation including
	         file generation, variable substitution, and project
	         configuration with progress tracking.

  */
  public async instantiateTemplate(
    template_id: string,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    try {
      const template = this.templates.get(template_id);
      if (!template) {
        throw new Error(`Template not found: ${template_id}`);
      }

      logger.info('TEMPLATES', 'Starting template instantiation', {
        templateId: template_id,
        projectName: options.projectName,
        projectPath: options.projectPath
      });

      /* validate options */
      await this.validateInstantiationOptions(template, options);

      /* create project directory structure */
      await this.createProjectStructure(template, options);

      /* generate template files */
      await this.generateTemplateFiles(template, options);

      /* generate sample assets if requested */
      if (options.includeSampleAssets) {
        await this.generateSampleAssets(template, options);
      }

      /* create project configuration */
      await this.createProjectConfiguration(template, options);

      /* setup tutorial if requested */
      if (options.includeTutorial && template.tutorial?.enabled) {
        await this.setupTutorial(template, options);
      }

      logger.info('TEMPLATES', 'Template instantiation completed successfully', {
        templateId: template_id,
        projectName: options.projectName
      });
    } catch (error) {
      logger.error('TEMPLATES', 'Template instantiation failed', {
        templateId: template_id,
        error: error
      });
      throw error;
    }
  }

  /*

           getTemplateVariables()
	         ---
	         returns customizable variables for template.

	         extracts template variables with metadata for
	         user customization interface generation.

  */
  public getTemplateVariables(template_id: string): TemplateVariable[] {
    const template = this.templates.get(template_id);
    if (!template) {
      return [];
    }

    const variables: TemplateVariable[] = [];

    /* extract variables from template files */
    for (const file of template.files) {
      for (const [variable_name, _] of Object.entries(file.variables)) {
        if (!variables.find(v => v.name === variable_name)) {
          variables.push({
            name: variable_name,
            type: 'string',
            description: `Template variable: ${variable_name}`,
            defaultValue: '',
            required: true
          });
        }
      }
    }

    return variables;
  }

  /*

           validateTemplate()
	         ---
	         validates template definition and structure.

	         performs comprehensive template validation including
	         file existence, configuration integrity, and
	         dependency verification.

  */
  public async validateTemplate(template: ProjectTemplate): Promise<boolean> {
    try {
      /* validate required fields */
      if (!template.id || !template.name || !template.description) {
        return false;
      }

      /* validate file references */
      for (const file of template.files) {
        if (!file.source || !file.destination) {
          return false;
        }
      }

      /* validate directory structure */
      if (!template.directories || template.directories.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('TEMPLATES', 'Template validation failed', {
        templateId: template.id,
        error: error
      });
      return false;
    }
  }

  /*

           registerTemplate()
	         ---
	         registers custom template with system.

	         adds custom template to registry with validation
	         and integration for project creation.

  */
  public async registerTemplate(template: ProjectTemplate): Promise<void> {
    try {
      const is_valid = await this.validateTemplate(template);
      if (!is_valid) {
        throw new Error('Template validation failed');
      }

      this.templates.set(template.id, template);

      logger.info('TEMPLATES', 'Template registered', {
        templateId: template.id,
        name: template.name
      });
    } catch (error) {
      logger.error('TEMPLATES', 'Template registration failed', {
        templateId: template.id,
        error: error
      });
      throw error;
    }
  }

  /*

           discoverTemplates()
	         ---
	         discovers templates from template directories.

	         scans template directories and loads template
	         definitions with proper validation and registration.

  */
  private async discoverTemplates(): Promise<void> {
    for (const template_dir of TEMPLATE_DIRECTORIES) {
      try {
        const exists = await fileSystem.exists(template_dir);
        if (!exists) {
          continue;
        }

        const entries = await fileSystem.listDirectory(template_dir);

        for (const entry of entries) {
          const entry_path = path.join(template_dir, entry);
          const is_dir = await fileSystem.isDirectory(entry_path);

          if (is_dir) {
            await this.loadTemplate(entry_path);
          }
        }
      } catch (error) {
        logger.warn('TEMPLATES', 'Failed to scan template directory', {
          templateDir: template_dir,
          error: error
        });
      }
    }
  }

  /*

           loadTemplate()
	         ---
	         loads template from directory.

	         reads template manifest and validates template
	         structure for registration with system.

  */
  private async loadTemplate(template_path: string): Promise<void> {
    try {
      const manifest_path = path.join(template_path, 'template.json');
      const manifest_exists = await fileSystem.exists(manifest_path);

      if (!manifest_exists) {
        return;
      }

      const template = await fileSystem.readJSON<ProjectTemplate>(manifest_path);
      template.id = path.basename(template_path);

      /* resolve template file paths */
      for (const file of template.files) {
        file.source = path.join(template_path, file.source);
      }

      const is_valid = await this.validateTemplate(template);
      if (is_valid) {
        this.templates.set(template.id, template);

        logger.debug('TEMPLATES', 'Template loaded', {
          templateId: template.id,
          name: template.name
        });
      }
    } catch (error) {
      logger.warn('TEMPLATES', 'Failed to load template', {
        templatePath: template_path,
        error: error
      });
    }
  }

  /*

           validateInstantiationOptions()
	         ---
	         validates template instantiation options.

	         checks required variables and configuration
	         for proper template instantiation.

  */
  private async validateInstantiationOptions(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    if (!options.projectName || options.projectName.trim() === '') {
      throw new Error('Project name is required');
    }

    if (!options.projectPath || options.projectPath.trim() === '') {
      throw new Error('Project path is required');
    }

    /* validate project path doesn't exist or is empty */
    const path_exists = await fileSystem.exists(options.projectPath);
    if (path_exists) {
      const entries = await fileSystem.listDirectory(options.projectPath);
      if (entries.length > 0) {
        throw new Error('Project path must be empty');
      }
    }
  }

  /*

           createProjectStructure()
	         ---
	         creates project directory structure from template.

	         generates project directories based on template
	         specification with proper permissions.

  */
  private async createProjectStructure(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    await fileSystem.ensureDirectory(options.projectPath);

    for (const directory of template.directories) {
      const resolved_dir = this.substituteVariables(directory, options);
      const dir_path = path.join(options.projectPath, resolved_dir);
      await fileSystem.ensureDirectory(dir_path);
    }
  }

  /*

           generateTemplateFiles()
	         ---
	         generates project files from template.

	         creates project files with variable substitution
	         and proper content generation from templates.

  */
  private async generateTemplateFiles(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    for (const file of template.files) {
      try {
        /* check conditional inclusion */
        if (file.conditional && !this.evaluateCondition(file.conditional, options)) {
          continue;
        }

        const source_content = await fileSystem.readFile(file.source);
        const processed_content = this.substituteVariables(source_content, options);

        const destination_path = this.substituteVariables(file.destination, options);
        const full_destination = path.join(options.projectPath, destination_path);

        await fileSystem.writeFile(full_destination, processed_content, {
          create_dirs: true
        });

        /* set file permissions if specified */
        if (file.permissions) {
          try {
            await fs.promises.chmod(full_destination, file.permissions);
          } catch (error) {
            logger.warn('TEMPLATES', 'Failed to set file permissions', {
              filePath: full_destination,
              permissions: file.permissions,
              error: error
            });
          }
        }
      } catch (error) {
        logger.error('TEMPLATES', 'Failed to generate template file', {
          sourceFile: file.source,
          destinationFile: file.destination,
          error: error
        });
        throw error;
      }
    }
  }

  /*

           generateSampleAssets()
	         ---
	         generates sample assets for template.

	         creates sample asset files for immediate project
	         usability and demonstration purposes.

  */
  private async generateSampleAssets(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    for (const asset of template.sampleAssets) {
      try {
        if (asset.source) {
          /* copy existing sample asset */
          const source_path = asset.source;
          const destination_path = path.join(options.projectPath, asset.destination);

          await fileSystem.ensureDirectory(path.dirname(destination_path));
          await fs.promises.copyFile(source_path, destination_path);
        } else {
          /* generate placeholder asset */
          const placeholder_content = this.generatePlaceholderAsset(asset);
          const destination_path = path.join(options.projectPath, asset.destination);

          await fileSystem.writeFile(destination_path, placeholder_content, {
            create_dirs: true
          });
        }
      } catch (error) {
        logger.warn('TEMPLATES', 'Failed to generate sample asset', {
          assetName: asset.name,
          error: error
        });
      }
    }
  }

  /*

           createProjectConfiguration()
	         ---
	         creates project configuration from template.

	         generates project configuration file with
	         template settings and customizations.

  */
  private async createProjectConfiguration(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    const project_settings = {
      ...template.projectSettings,
      ...options.customSettings
    };

    /* substitute variables in project settings */
    const settings_json = JSON.stringify(project_settings, null, 2);
    const processed_settings = this.substituteVariables(settings_json, options);
    const final_settings = JSON.parse(processed_settings);

    /* create project using project manager */
    await projectManager.createProject(options.projectPath, options.projectName);

    /* update project with template settings */
    projectManager.updateProjectData(data => ({
      ...data,
      ...final_settings
    }));

    await projectManager.saveProject();
  }

  /*

           setupTutorial()
	         ---
	         sets up tutorial configuration for template.

	         creates tutorial metadata and configuration
	         for guided template exploration.

  */
  private async setupTutorial(
    template: ProjectTemplate,
    options: TemplateInstantiationOptions
  ): Promise<void> {
    if (!template.tutorial) {
      return;
    }

    const tutorial_config = {
      enabled: true,
      templateId: template.id,
      steps: template.tutorial.steps
    };

    const tutorial_path = path.join(options.projectPath, '.worldenv', 'tutorial.json');
    await fileSystem.writeJSON(tutorial_path, tutorial_config);
  }

  /*

           substituteVariables()
	         ---
	         performs variable substitution in template content.

	         replaces template variables with actual values
	         from instantiation options and built-in variables.

  */
  private substituteVariables(content: string, options: TemplateInstantiationOptions): string {
    let processed_content = content;

    /* built-in variables */
    const built_in_vars = {
      ProjectName: options.projectName,
      ProjectPath: options.projectPath,
      CreatedDate: new Date().toISOString(),
      ModifiedDate: new Date().toISOString(),
      Author: 'User', /* would get from user settings */
      Version: '1.0.0'
    };

    /* combine all variables */
    const all_variables = {
      ...built_in_vars,
      ...options.variables
    };

    /* perform substitution */
    for (const [variable_name, variable_value] of Object.entries(all_variables)) {
      const pattern = new RegExp(`\\{\\{${variable_name}\\}\\}`, 'g');
      processed_content = processed_content.replace(pattern, String(variable_value));
    }

    return processed_content;
  }

  /*

           evaluateCondition()
	         ---
	         evaluates conditional template inclusion.

	         checks conditional expressions for template
	         file inclusion based on options.

  */
  private evaluateCondition(condition: string, options: TemplateInstantiationOptions): boolean {
    /* simplified condition evaluation */
    /* would implement proper expression parser in production */
    try {
      /* basic variable existence check */
      if (condition.startsWith('has_')) {
        const variable_name = condition.substring(4);
        return options.variables[variable_name] !== undefined;
      }

      return true;
    } catch (error) {
      logger.warn('TEMPLATES', 'Condition evaluation failed', {
        condition: condition,
        error: error
      });
      return false;
    }
  }

  /*

           generatePlaceholderAsset()
	         ---
	         generates placeholder asset content.

	         creates placeholder content for sample assets
	         when source assets are not available.

  */
  private generatePlaceholderAsset(asset: SampleAsset): string {
    switch (asset.type) {
      case 'sprite':
        return '/* Placeholder sprite asset */';
      case 'audio':
        return '/* Placeholder audio asset */';
      case 'model':
        return '/* Placeholder model asset */';
      default:
        return `/* Placeholder ${asset.type} asset */`;
    }
  }
}

/* singleton instance for application-wide template management */
export const projectTemplateManager = new ProjectTemplateManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
