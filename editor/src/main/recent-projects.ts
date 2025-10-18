/*
   ===============================================================
   WORLDEDIT RECENT PROJECTS MANAGER
   ELASTIC SOFTWORKS 2025
   ===============================================================
*/

/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*
	===============================================================
             --- SETUP ---
	===============================================================
*/

import * as path from 'path'; /* NODE.JS PATH UTILITIES */
import { app } from 'electron'; /* ELECTRON APP MODULE FOR USER DATA */
import { fileSystem } from './file-system'; /* PROJECT FILE SYSTEM OPERATIONS */
import { logger } from './logger'; /* CENTRALIZED LOGGING SYSTEM */

/*
	===============================================================
             --- GLOBAL ---
	===============================================================
*/

const MAX_RECENT_PROJECTS = 10; /* MAXIMUM ENTRIES IN RECENT PROJECTS LIST */

/*
	===============================================================
             --- TYPES ---
	===============================================================
*/

interface RecentProject {
  name: string /* DISPLAY NAME OF THE PROJECT */;
  path: string /* ABSOLUTE PATH TO PROJECT DIRECTORY */;
  lastOpened: number /* TIMESTAMP OF LAST ACCESS */;
}

/*
	===============================================================
             --- FUNCS ---
	===============================================================
*/

/*

         RecentProjectsManager
	       ---
	       manages the list of recently opened projects with
	       persistent storage and automatic cleanup of invalid
	       entries. provides methods to add, remove, and validate
	       project entries while maintaining chronological order
	       and enforcing maximum count limits.

*/

class RecentProjectsManager {
  private recent_projects: RecentProject[];
  private storage_path: string;

  constructor() {
    this.recent_projects = [];
    this.storage_path = path.join(app.getPath('userData'), 'recent-projects.json');
  }

  /**
   * initialize()
   *
   * Loads recent projects from storage.
   */
  public async initialize(): Promise<void> {
    try {
      const exists = await fileSystem.exists(this.storage_path);

      if (exists) {
        const data = await fileSystem.readJSON<RecentProject[]>(this.storage_path);

        if (Array.isArray(data)) {
          this.recent_projects = data
            .slice(0, MAX_RECENT_PROJECTS)
            .sort((a, b) => b.lastOpened - a.lastOpened);
        }
      }

      logger.info('RECENT', 'Recent projects loaded', {
        count: this.recent_projects.length
      });
    } catch (error) {
      logger.error('RECENT', 'Failed to load recent projects', {
        error: error
      });

      this.recent_projects = [];
    }
  }

  /**
   * addProject()
   *
   * Adds project to recent list.
   * Removes duplicates and maintains max count.
   */
  public async addProject(project_path: string, project_name: string): Promise<void> {
    try {
      const now = Date.now();

      const existing_index = this.recent_projects.findIndex((p) => p.path === project_path);

      if (existing_index >= 0) {
        this.recent_projects.splice(existing_index, 1);
      }

      this.recent_projects.unshift({
        name: project_name,
        path: project_path,
        lastOpened: now
      });

      while (this.recent_projects.length > MAX_RECENT_PROJECTS) {
        this.recent_projects.pop();
      }

      await this.saveToStorage();

      logger.info('RECENT', 'Project added to recent list', {
        path: project_path,
        name: project_name
      });
    } catch (error) {
      logger.error('RECENT', 'Failed to add recent project', {
        path: project_path,
        error: error
      });
    }
  }

  /**
   * removeProject()
   *
   * Removes project from recent list.
   */
  public async removeProject(project_path: string): Promise<void> {
    try {
      const initial_count = this.recent_projects.length;

      this.recent_projects = this.recent_projects.filter((p) => p.path !== project_path);

      if (this.recent_projects.length !== initial_count) {
        await this.saveToStorage();

        logger.info('RECENT', 'Project removed from recent list', {
          path: project_path
        });
      }
    } catch (error) {
      logger.error('RECENT', 'Failed to remove recent project', {
        path: project_path,
        error: error
      });
    }
  }

  /**
   * clearAll()
   *
   * Clears all recent projects.
   */
  public async clearAll(): Promise<void> {
    try {
      this.recent_projects = [];
      await this.saveToStorage();

      logger.info('RECENT', 'All recent projects cleared');
    } catch (error) {
      logger.error('RECENT', 'Failed to clear recent projects', {
        error: error
      });
    }
  }

  /**
   * getProjects()
   *
   * Returns list of recent projects.
   */
  public getProjects(): RecentProject[] {
    return [...this.recent_projects];
  }

  /**
   * cleanupInvalidProjects()
   *
   * Removes projects that no longer exist.
   */
  public async cleanupInvalidProjects(): Promise<void> {
    try {
      const initial_count = this.recent_projects.length;
      const valid_projects: RecentProject[] = [];

      for (const project of this.recent_projects) {
        const exists = await fileSystem.exists(project.path);

        if (exists) {
          const project_file = path.join(project.path, 'project.worldenv');

          const project_file_exists = await fileSystem.exists(project_file);

          if (project_file_exists) {
            valid_projects.push(project);
          }
        }
      }

      this.recent_projects = valid_projects;

      const removed_count = initial_count - valid_projects.length;

      if (removed_count > 0) {
        await this.saveToStorage();

        logger.info('RECENT', 'Invalid projects cleaned up', {
          removed: removed_count,
          remaining: valid_projects.length
        });
      }
    } catch (error) {
      logger.error('RECENT', 'Failed to cleanup invalid projects', {
        error: error
      });
    }
  }

  /**
   * saveToStorage()
   *
   * Persists recent projects to storage.
   */
  private async saveToStorage(): Promise<void> {
    try {
      await fileSystem.ensureDirectory(path.dirname(this.storage_path));

      await fileSystem.writeJSON(this.storage_path, this.recent_projects);
    } catch (error) {
      logger.error('RECENT', 'Failed to save recent projects', {
        error: error
      });

      throw error;
    }
  }
}

export const recentProjectsManager = new RecentProjectsManager();

/*
	===============================================================
             --- EOF ---
	===============================================================
*/
