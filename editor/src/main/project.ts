/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	====================================================================
             PROJECT MANAGER - WORLDENV EDITOR
	====================================================================
*/

/*

	worldenv project lifecycle management with comprehensive validation
	and structured project format handling.

	this module manages complete project operations including creation,
	loading, saving, and validation of worldenv project files. handles
	the .worldenv project format with proper directory structure
	enforcement and data validation.

	project features:
	- structured project directory creation with templates
	- comprehensive project data validation
	- modification tracking for auto-save integration
	- project format versioning and migration support
	- integration with build system and asset management

	the system ensures project integrity through validation at
	load time and maintains consistency through structured
	data management and proper error handling.

*/

/*
	====================================================================
             --- SETUP ---
	====================================================================
*/

import * as path from 'path'; /* PATH MANIPULATION UTILITIES */
import { fileSystem } from './file-system'; /* SECURE FILE OPERATIONS */
import { logger } from './logger'; /* LOGGING SYSTEM */
import { buildManager } from './build-manager'; /* BUILD INTEGRATION */
import { projectBackupManager } from './project-backup'; /* PROJECT BACKUP */
import { projectValidator } from './project-validator'; /* PROJECT VALIDATION */
import { fileHistoryManager } from './file-history'; /* FILE HISTORY */
import { ProjectData, ProjectError } from '../shared/types'; /* PROJECT TYPES */

/*
	====================================================================
             --- GLOBAL ---
	====================================================================
*/

/* project format version for compatibility and migration */
const PROJECT_VERSION = '0.1.0';
const ENGINE_VERSION = '0.1.0';

/*
	====================================================================
             --- TYPES ---
	====================================================================
*/

/*

         ProjectInfo
	       ---
	       internal project state container.

	       maintains current project information including
	       file path, parsed data, and modification status
	       for proper state management and auto-save support.

*/

interface ProjectInfo {
  path: string /* PROJECT DIRECTORY PATH */;
  data: ProjectData /* PARSED PROJECT DATA */;
  modified: boolean /* MODIFICATION STATUS */;
}

/*
	====================================================================
             --- FUNCS ---
	====================================================================
*/

/*

         ProjectManager
	       ---
	       centralized project lifecycle management.

	       handles all aspects of worldenv project management
	       including creation with proper directory structure,
	       loading with validation, saving with error handling,
	       and modification tracking for editor integration.

	       maintains single active project state and provides
	       comprehensive validation to ensure project integrity
	       throughout the editing session.

*/

class ProjectManager {
  private current_project: ProjectInfo | null; /* ACTIVE PROJECT STATE */
  private project_file_name: string; /* PROJECT FILE NAME */

  constructor() {
    this.current_project = null;
    this.project_file_name = 'project.worldenv';
  }

  /*

           createProject()
	         ---
	         creates new worldenv project with complete structure.

	         initializes project directory with proper folder
	         structure, default configuration files, and
	         project metadata. validates target directory
	         and ensures proper permissions.

  */
  public async createProject(project_path: string, project_name: string): Promise<ProjectData> {
    try {
      logger.info('PROJECT', 'Creating project', {
        path: project_path,
        name: project_name
      });

      const exists = await fileSystem.exists(project_path);

      if (!exists) {
        await fileSystem.ensureDirectory(project_path);
      }

      const is_dir = await fileSystem.isDirectory(project_path);

      if (!is_dir) {
        throw new ProjectError('Project path is not a directory', {
          path: project_path
        });
      }

      const entries = await fileSystem.listDirectory(project_path);

      if (entries.length > 0) {
        throw new ProjectError('Project directory must be empty', {
          path: project_path,
          entry_count: entries.length
        });
      }

      await this.createProjectStructure(project_path);

      const project_data = this.createDefaultProjectData(project_name);

      const project_file_path = path.join(project_path, this.project_file_name);

      await fileSystem.writeJSON(project_file_path, project_data, {
        create_dirs: false
      });

      this.current_project = {
        path: project_path,
        data: project_data,
        modified: false
      };

      /* SET BUILD MANAGER PROJECT PATH */
      buildManager.setProjectPath(project_path);

      /* INITIALIZE INTEGRATED SYSTEMS */
      await this.initializeProjectSystems(project_path);

      logger.info('PROJECT', 'Project created successfully', {
        path: project_path
      });

      return project_data;
    } catch (error) {
      if (error instanceof ProjectError) {
        throw error;
      }

      logger.error('PROJECT', 'Project creation failed', {
        path: project_path,
        error: error
      });

      throw new ProjectError('Failed to create project', {
        path: project_path,
        error: error
      });
    }
  }

  /*

           openProject()
	         ---
	         opens existing worldenv project with validation.

	         loads project from directory with comprehensive
	         structure validation and data integrity checks.
	         updates build manager with project path.

  */
  public async openProject(project_path: string): Promise<ProjectData> {
    try {
      logger.info('PROJECT', 'Opening project', { path: project_path });

      const is_dir = await fileSystem.isDirectory(project_path);

      if (!is_dir) {
        throw new ProjectError('Project path is not a directory', {
          path: project_path
        });
      }

      const project_file_path = path.join(project_path, this.project_file_name);

      const file_exists = await fileSystem.exists(project_file_path);

      if (!file_exists) {
        throw new ProjectError('Project file not found', {
          path: project_file_path
        });
      }

      const project_data = await fileSystem.readJSON<ProjectData>(project_file_path);

      this.validateProjectData(project_data);

      await this.validateProjectStructure(project_path);

      this.current_project = {
        path: project_path,
        data: project_data,
        modified: false
      };

      /* SET BUILD MANAGER PROJECT PATH */
      buildManager.setProjectPath(project_path);

      /* INITIALIZE INTEGRATED SYSTEMS */
      await this.initializeProjectSystems(project_path);

      logger.info('PROJECT', 'Project opened successfully', {
        path: project_path,
        name: project_data.name
      });

      return project_data;
    } catch (error) {
      if (error instanceof ProjectError) {
        throw error;
      }

      logger.error('PROJECT', 'Project open failed', {
        path: project_path,
        error: error
      });

      throw new ProjectError('Failed to open project', {
        path: project_path,
        error: error
      });
    }
  }

  /*

           saveProject()
	         ---
	         saves current project data to disk.

	         writes project configuration to .worldenv file
	         with proper error handling and validation.
	         clears modification flag on successful save.

  */
  public async saveProject(): Promise<void> {
    if (!this.current_project) {
      throw new ProjectError('No project is currently open');
    }

    try {
      logger.info('PROJECT', 'Saving project', {
        path: this.current_project.path
      });

      this.current_project.data.modified = Date.now();

      const project_file_path = path.join(this.current_project.path, this.project_file_name);

      await fileSystem.writeJSON(project_file_path, this.current_project.data);

      this.current_project.modified = false;

      logger.info('PROJECT', 'Project saved successfully');
    } catch (error) {
      logger.error('PROJECT', 'Project save failed', {
        path: this.current_project.path,
        error: error
      });

      throw new ProjectError('Failed to save project', {
        path: this.current_project.path,
        error: error
      });
    }
  }

  /*

           closeProject()
	         ---
	         closes current project and clears state.

	         safely closes active project with proper cleanup
	         and build manager notification. resets internal
	         state for next project operation.

  */
  public async closeProject(): Promise<void> {
    if (!this.current_project) {
      return;
    }

    logger.info('PROJECT', 'Closing project', {
      path: this.current_project.path
    });

    /* CLEAR BUILD MANAGER PROJECT PATH */
    buildManager.setProjectPath('');

    /* SHUTDOWN INTEGRATED SYSTEMS */
    await this.shutdownProjectSystems();

    this.current_project = null;
  }

  /*

           getCurrentProject()
	         ---
	         returns current project data if available.

	         provides access to active project information
	         or null if no project is currently loaded.

  */
  public getCurrentProject(): ProjectInfo | null {
    return this.current_project;
  }

  /*

           isProjectOpen()
	         ---
	         checks if project is currently active.

	         returns boolean indicating whether a project
	         is loaded and available for operations.

  */
  public isProjectOpen(): boolean {
    return this.current_project !== null;
  }

  /*

           isProjectModified()
	         ---
	         checks if project has unsaved modifications.

	         returns modification status for auto-save
	         and user prompting during close operations.

  */
  public isProjectModified(): boolean {
    return this.current_project?.modified || false;
  }

  /*

           markModified()
	         ---
	         marks project as having unsaved changes.

	         sets modification flag to trigger auto-save
	         and enable save prompts during close operations.

  */
  public markModified(): void {
    if (this.current_project) {
      this.current_project.modified = true;
    }
  }

  /*

           updateProjectData()
	         ---
	         updates project data and marks as modified.

	         applies changes to project configuration
	         and automatically sets modification flag.

  */
  public updateProjectData(updater: (data: ProjectData) => ProjectData): void {
    if (!this.current_project) {
      throw new ProjectError('No project is currently open');
    }

    this.current_project.data = updater(this.current_project.data);
    this.current_project.modified = true;
  }

  /*

           createProjectStructure()
	         ---
	         creates complete project directory structure.

	         initializes all required folders and files
	         for worldenv project organization with
	         proper permissions and default content.

  */
  private async createProjectStructure(project_path: string): Promise<void> {
    const directories = [
      'assets',
      'assets/textures',
      'assets/audio',
      'assets/fonts',
      'assets/data',
      'assets/materials',
      'assets/shaders',
      'scenes',
      'scripts',
      'scripts/components',
      'scripts/systems',
      'prefabs',
      'build',
      'temp'
    ];

    for (const dir of directories) {
      const dir_path = path.join(project_path, dir);
      await fileSystem.ensureDirectory(dir_path);
    }

    const default_scene_path = path.join(project_path, 'scenes', 'main.worldscene');

    const default_scene = {
      version: PROJECT_VERSION,
      name: 'Main Scene',
      entities: [],
      root_entities: []
    };

    await fileSystem.writeJSON(default_scene_path, default_scene);

    // Create .gitkeep files for empty directories
    const gitkeep_dirs = [
      'assets/textures',
      'assets/audio',
      'assets/fonts',
      'assets/data',
      'assets/materials',
      'assets/shaders',
      'scripts/components',
      'scripts/systems',
      'prefabs',
      'temp'
    ];

    for (const dir of gitkeep_dirs) {
      const gitkeep_path = path.join(project_path, dir, '.gitkeep');
      await fileSystem.writeFile(gitkeep_path, '');
    }
  }

  /*

           createDefaultProjectData()
	         ---
	         generates default project configuration.

	         creates baseline project data structure
	         with sensible defaults for new project
	         initialization.

  */
  private createDefaultProjectData(project_name: string): ProjectData {
    const now = Date.now();

    return {
      version: PROJECT_VERSION,
      name: project_name,
      engine_version: ENGINE_VERSION,
      created: now,
      modified: now,
      settings: {
        default_scene: 'scenes/main.worldscene',
        viewport: {
          mode: '2d',
          grid_visible: true,
          grid_size: 32,
          snap_enabled: false,
          snap_value: 16
        },
        rendering: {
          renderer: 'webgl',
          antialias: true,
          vsync: true,
          target_fps: 60,
          resolution_scale: 1.0
        },
        physics: {
          enabled: true,
          gravity: [0, -9.8],
          fixed_timestep: 0.016
        },
        audio: {
          master_volume: 1.0,
          music_volume: 1.0,
          sfx_volume: 1.0
        }
      },
      scenes: ['scenes/main.worldscene'],
      prefabs: [],
      assets: {
        textures: [],
        audio: [],
        scripts: [],
        fonts: [],
        data: [],
        materials: [],
        shaders: []
      }
    };
  }

  /*

           validateProjectData()
	         ---
	         validates project data structure and content.

	         performs comprehensive validation of project
	         configuration including version compatibility
	         and required field presence.

  */
  private validateProjectData(data: ProjectData): void {
    if (!data.version) {
      throw new ProjectError('Project data missing version');
    }

    if (!data.name) {
      throw new ProjectError('Project data missing name');
    }

    if (!data.settings) {
      throw new ProjectError('Project data missing settings');
    }

    if (!data.scenes || !Array.isArray(data.scenes)) {
      throw new ProjectError('Project data missing or invalid scenes array');
    }

    if (!data.assets) {
      throw new ProjectError('Project data missing assets manifest');
    }

    if (!data.prefabs || !Array.isArray(data.prefabs)) {
      logger.warn('PROJECT', 'Project missing prefabs array, adding default');
      data.prefabs = [];
    }
  }

  /*

           validateProjectStructure()
	         ---
	         validates project directory structure.

	         ensures all required directories and files
	         exist with proper organization and permissions.

  */
  private async validateProjectStructure(project_path: string): Promise<void> {
    const required_dirs = ['assets', 'scenes', 'scripts', 'prefabs'];

    for (const dir of required_dirs) {
      const dir_path = path.join(project_path, dir);
      const exists = await fileSystem.exists(dir_path);

      if (!exists) {
        logger.warn('PROJECT', 'Required directory missing', {
          path: dir_path
        });

        await fileSystem.ensureDirectory(dir_path);
      }
    }
  }

  /*

           initializeProjectSystems()
	         ---
	         initializes integrated project systems.

	         sets up backup, validation, history, and script
	         systems for the opened project with proper configuration.

  */

  private async initializeProjectSystems(project_path: string): Promise<void> {
    try {
      /* initialize backup system */
      await projectBackupManager.initialize(project_path);

      /* initialize file history system */
      await fileHistoryManager.initialize(project_path, {
        maxVersions: 50,
        autoTrack: true,
        trackBinaryFiles: false
      });

      /* initialize script system */
      try {
        const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');
        const scriptSystem = ScriptSystemManager.getInstance({
          enableAutoCompilation: true,
          enableHotReload: true,
          scriptsDirectory: path.join(project_path, 'scripts'),
          debugMode: true
        });
        await scriptSystem.initialize();

        logger.info('PROJECT', 'Script system initialized', {
          projectPath: project_path
        });
      } catch (error) {
        logger.warn('PROJECT', 'Failed to initialize script system', {
          projectPath: project_path,
          error
        });
      }

      await projectBackupManager.startAutoBackup();

      logger.info('PROJECT', 'Project systems initialized', {
        projectPath: project_path
      });
    } catch (error) {
      logger.error('PROJECT', 'Project systems initialization failed', {
        projectPath: project_path,
        error: error
      });
      /* non-critical error - don't throw */
    }
  }

  /*

           shutdownProjectSystems()
	         ---
	         shuts down integrated project systems.

	         properly closes backup, validation, history, and
	         script systems when project is closed.

  */

  private async shutdownProjectSystems(): Promise<void> {
    try {
      /* stop auto-backup */
      projectBackupManager.stopAutoBackup();

      /* clear validation cache */
      projectValidator.clearValidationCache();

      /* shutdown script system */
      try {
        const { ScriptSystemManager } = await import('./engine/ScriptSystemManager');
        const scriptSystem = ScriptSystemManager.getInstance();
        await scriptSystem.shutdown();

        logger.info('PROJECT', 'Script system shutdown completed');
      } catch (error) {
        logger.warn('PROJECT', 'Script system shutdown failed', { error });
      }

      logger.info('PROJECT', 'Project systems shutdown completed');
    } catch (error) {
      logger.error('PROJECT', 'Project systems shutdown failed', {
        error: error
      });
      /* non-critical error - don't throw */
    }
  }
}

/* singleton instance for application-wide project management */
export const projectManager = new ProjectManager();

/*
	====================================================================
             --- EOF ---
	====================================================================
*/
