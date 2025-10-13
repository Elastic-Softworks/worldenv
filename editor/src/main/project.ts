/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/**
 * WORLDEDIT - Project Manager
 *
 * Manages WORLDENV project lifecycle including creation, loading, and saving.
 * Handles project file format (.worldenv) and directory structure validation.
 */

import * as path from 'path';
import { fileSystem } from './file-system';
import { logger } from './logger';
import { ProjectData, ProjectError } from '../shared/types';

const PROJECT_VERSION = '0.1.0';
const ENGINE_VERSION = '0.1.0';

interface ProjectInfo {
  path: string;
  data: ProjectData;
  modified: boolean;
}

class ProjectManager {

  private current_project: ProjectInfo | null;
  private project_file_name: string;

  constructor() {

    this.current_project = null;
    this.project_file_name = 'project.worldenv';

  }

  /**
   * createProject()
   *
   * Creates new project at specified directory.
   * Initializes project structure and default files.
   */
  public async createProject(
    project_path: string,
    project_name: string
  ): Promise<ProjectData> {

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

      const project_file_path = path.join(
        project_path,
        this.project_file_name
      );

      await fileSystem.writeJSON(project_file_path, project_data, {
        create_dirs: false
      });

      this.current_project = {
        path: project_path,
        data: project_data,
        modified: false
      };

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

  /**
   * openProject()
   *
   * Opens existing project from directory.
   * Validates project structure and loads project data.
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

      const project_file_path = path.join(
        project_path,
        this.project_file_name
      );

      const file_exists = await fileSystem.exists(project_file_path);

      if (!file_exists) {

        throw new ProjectError('Project file not found', {
          path: project_file_path
        });

      }

      const project_data = await fileSystem.readJSON<ProjectData>(
        project_file_path
      );

      this.validateProjectData(project_data);

      await this.validateProjectStructure(project_path);

      this.current_project = {
        path: project_path,
        data: project_data,
        modified: false
      };

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

  /**
   * saveProject()
   *
   * Saves current project to disk.
   * Updates modification timestamp.
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

      const project_file_path = path.join(
        this.current_project.path,
        this.project_file_name
      );

      await fileSystem.writeJSON(
        project_file_path,
        this.current_project.data
      );

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

  /**
   * closeProject()
   *
   * Closes current project.
   * Does not save unless explicitly requested.
   */
  public closeProject(): void {

    if (!this.current_project) {

      return;

    }

    logger.info('PROJECT', 'Closing project', {
      path: this.current_project.path
    });

    this.current_project = null;

  }

  /**
   * getCurrentProject()
   *
   * Returns current project info or null if no project open.
   */
  public getCurrentProject(): ProjectInfo | null {

    return this.current_project;

  }

  /**
   * isProjectOpen()
   *
   * Returns true if project is currently open.
   */
  public isProjectOpen(): boolean {

    return this.current_project !== null;

  }

  /**
   * isProjectModified()
   *
   * Returns true if project has unsaved changes.
   */
  public isProjectModified(): boolean {

    return this.current_project?.modified || false;

  }

  /**
   * markModified()
   *
   * Marks project as modified.
   */
  public markModified(): void {

    if (this.current_project) {

      this.current_project.modified = true;

    }

  }

  /**
   * updateProjectData()
   *
   * Updates project data and marks as modified.
   */
  public updateProjectData(
    updater: (data: ProjectData) => ProjectData
  ): void {

    if (!this.current_project) {

      throw new ProjectError('No project is currently open');

    }

    this.current_project.data = updater(this.current_project.data);
    this.current_project.modified = true;

  }

  /**
   * createProjectStructure()
   *
   * Creates default project directory structure.
   */
  private async createProjectStructure(project_path: string): Promise<void> {

    const directories = [
      'assets',
      'assets/textures',
      'assets/audio',
      'assets/fonts',
      'assets/data',
      'scenes',
      'scripts',
      'build'
    ];

    for (const dir of directories) {

      const dir_path = path.join(project_path, dir);
      await fileSystem.ensureDirectory(dir_path);

    }

    const default_scene_path = path.join(
      project_path,
      'scenes',
      'main.worldscene'
    );

    const default_scene = {
      version: PROJECT_VERSION,
      name: 'Main Scene',
      entities: [],
      root_entities: []
    };

    await fileSystem.writeJSON(default_scene_path, default_scene);

  }

  /**
   * createDefaultProjectData()
   *
   * Creates default project data structure.
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
      assets: {
        textures: [],
        audio: [],
        scripts: [],
        fonts: [],
        data: []
      }
    };

  }

  /**
   * validateProjectData()
   *
   * Validates project data structure.
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

  }

  /**
   * validateProjectStructure()
   *
   * Validates project directory structure.
   */
  private async validateProjectStructure(
    project_path: string
  ): Promise<void> {

    const required_dirs = ['assets', 'scenes', 'scripts'];

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

}

export const projectManager = new ProjectManager();
