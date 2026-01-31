// projectIO.ts - File System Access API for offline save/load capabilities

import { toast } from 'react-hot-toast';

// Define project data structure
export interface ProjectData {
  id: string;
  name: string;
  timestamp: string;
  version: string;
  data: {
    ceiling?: any;
    layout?: any;
    materials?: any;
    calculations?: any;
    scene?: any; // 3D scene data
  };
}

// Check if File System Access API is supported
export const supportsFileSystemAccess = (): boolean => {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
};

// Save project to filesystem using File System Access API
export const saveProjectToFile = async (project: ProjectData): Promise<void> => {
  if (!supportsFileSystemAccess()) {
    throw new Error('File System Access API not supported. Using fallback storage.');
  }

  try {
    // Create a JSON blob
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    // Choose save location
    const options: SaveFilePickerOptions = {
      suggestedName: `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp.json`,
      types: [
        {
          description: 'Ceiling Panel Project',
          accept: {
            'application/json': ['.mp.json'],
          },
        },
      ],
    };

    const handle = await (window as any).showSaveFilePicker(options);
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();

    toast.success(`Project saved to ${handle.name}`);
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error saving project:', error);
      throw new Error('Failed to save project');
    }
  }
};

// Load project from filesystem using File System Access API
export const loadProjectFromFile = async (): Promise<ProjectData> => {
  if (!supportsFileSystemAccess()) {
    throw new Error('File System Access API not supported');
  }

  try {
    const options: OpenFilePickerOptions = {
      types: [
        {
          description: 'Ceiling Panel Project',
          accept: {
            'application/json': ['.mp.json'],
          },
        },
        {
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
      excludeAcceptAllOption: false,
    };

    const [handle] = await (window as any).showOpenFilePicker(options);
    const file = await handle.getFile();
    const content = await file.text();
    const project: ProjectData = JSON.parse(content);

    toast.success(`Loaded project "${project.name}" from ${file.name}`);
    return project;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Error loading project:', error);
      throw new Error('Failed to load project');
    }
    throw error;
  }
};

// Fallback save using download
export const downloadProject = (project: ProjectData): void => {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp.json`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  toast.success('Project downloaded (fallback mode)');
};

// Fallback load using file input
export const uploadProject = (): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp.json,.json';
    input.style.display = 'none';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const content = await file.text();
        const project: ProjectData = JSON.parse(content);
        toast.success(`Loaded project "${project.name}" from ${file.name}`);
        resolve(project);
      } catch (error) {
        toast.error('Invalid project file');
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('Load cancelled'));
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

// localStorage fallback for metadata persistence
export const saveProjectMetadata = (projectId: string, metadata: Partial<ProjectData>): void => {
  try {
    const projects = getProjectsFromStorage();
    projects[projectId] = {
      ...projects[projectId],
      ...metadata,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('mp_projects', JSON.stringify(projects));
  } catch (error) {
    console.warn('Failed to save project metadata to localStorage:', error);
  }
};

export const loadProjectMetadata = (projectId: string): ProjectData | null => {
  try {
    const projects = getProjectsFromStorage();
    return projects[projectId] || null;
  } catch (error) {
    console.warn('Failed to load project metadata from localStorage:', error);
    return null;
  }
};

export const getRecentProjects = (): ProjectData[] => {
  try {
    const projects = getProjectsFromStorage();
    return Object.values(projects)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  } catch (error) {
    console.warn('Failed to get recent projects from localStorage:', error);
    return [];
  }
};

export const deleteProjectMetadata = (projectId: string): void => {
  try {
    const projects = getProjectsFromStorage();
    delete projects[projectId];
    localStorage.setItem('mp_projects', JSON.stringify(projects));
  } catch (error) {
    console.warn('Failed to delete project metadata from localStorage:', error);
  }
};

// Helper function
const getProjectsFromStorage = (): Record<string, ProjectData> => {
  try {
    const data = localStorage.getItem('mp_projects');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Export/import multiple projects (ZIP support could be added here)
export const exportAllProjects = async (): Promise<void> => {
  const projects = getRecentProjects();
  const exportData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    projects,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mp_projects_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  toast.success(`${projects.length} projects exported`);
};

export const importProjects = (): Promise<ProjectData[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const content = await file.text();
        const importData = JSON.parse(content);

        if (!importData.projects || !Array.isArray(importData.projects)) {
          throw new Error('Invalid backup file format');
        }

        // Save each project to localStorage
        const projects = getProjectsFromStorage();
        for (const project of importData.projects) {
          projects[project.id] = project;
        }
        localStorage.setItem('mp_projects', JSON.stringify(projects));

        toast.success(`${importData.projects.length} projects imported`);
        resolve(importData.projects);
      } catch (error) {
        toast.error('Failed to import projects');
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('Import cancelled'));
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};