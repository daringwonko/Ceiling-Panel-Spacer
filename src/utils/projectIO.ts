// src/utils/projectIO.ts
export interface ProjectData {
  name: string;
  shapes: Array<{
    id: string;
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }>;
  created: string;
  modified: string;
}

/**
 * Saves project data to localStorage
 */
export function saveProject(projectData: ProjectData): void {
  try {
    const serializedData = JSON.stringify(projectData);
    localStorage.setItem('ceiling-spacer-project', serializedData);
    console.log('Project saved successfully');
  } catch (error) {
    console.error('Failed to save project:', error);
    throw new Error('Project save failed');
  }
}

/**
 * Loads project data from localStorage
 */
export function loadProject(): ProjectData | null {
  try {
    const serializedData = localStorage.getItem('ceiling-spacer-project');
    if (!serializedData) return null;
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
}