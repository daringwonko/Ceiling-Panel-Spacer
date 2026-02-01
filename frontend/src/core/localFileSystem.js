/**
 * File System Access API Integration for Offline Save/Load
 * Enables local file operations without server dependency
 */

import { v4 as uuidv4 } from 'uuid';

class LocalFileSystem {
  constructor() {
    this.supported = 'showOpenFilePicker' in window;
    this.fileHandles = new Map();
  }

  /**
   * Save project to local file using File System Access API
   * @param {Object} projectData - Project data to save
   * @param {string} filename - Default filename
   * @returns {Promise<Object>} File handle and result
   */
  async saveProject(projectData, filename = 'ceiling-project.json') {
    if (!this.supported) {
      return this.fallbackSave(projectData, filename);
    }

    try {
      const suggestedName = this.generateFilename(projectData, filename);
      
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'JSON Project Files',
            accept: { 'application/json': ['.json'] },
          },
          {
            description: 'All Files',
            accept: { '*/*': ['.*'] },
          },
        ],
      });

      // Store handle for potential future writes
      const fileId = uuidv4();
      this.fileHandles.set(fileId, { handle, filename: suggestedName });

      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(projectData, null, 2));
      await writable.close();

      return {
        success: true,
        fileId,
        filename: suggestedName,
        handle,
        message: `Project saved to ${suggestedName}`
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Save cancelled by user' };
      }
      console.error('File save failed:', error);
      return this.fallbackSave(projectData, filename);
    }
  }

  /**
   * Load project from local file
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Loaded project data
   */
  async loadProject(options = {}) {
    if (!this.supported) {
      return this.fallbackLoad();
    }

    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'JSON Project Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      const handle = handles[0];
      const file = await handle.getFile();
      const content = await file.text();
      const projectData = JSON.parse(content);

      // Store handle for save operations
      const fileId = uuidv4();
      this.fileHandles.set(fileId, { handle, filename: file.name });

      return {
        success: true,
        fileId,
        filename: file.name,
        data: projectData,
        handle
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Load cancelled by user' };
      }
      console.error('File load failed:', error);
      return this.fallbackLoad();
    }
  }

  /**
   * Update existing file without showing picker
   * @param {string} fileId - File identifier from previous save
   * @param {Object} projectData - Updated project data
   * @returns {Promise<Object>} Result
   */
  async updateFile(fileId, projectData) {
    const fileRecord = this.fileHandles.get(fileId);
    if (!fileRecord) {
      return { success: false, error: 'File handle not found' };
    }

    try {
      const writable = await fileRecord.handle.createWritable();
      await writable.write(JSON.stringify(projectData, null, 2));
      await writable.close();

      return {
        success: true,
        filename: fileRecord.filename,
        message: `Project updated: ${fileRecord.filename}`
      };
    } catch (error) {
      console.error('File update failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export data as downloadable file (works in all browsers)
   * @param {Object} data - Data to export
   * @param {string} filename - Download filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(data, filename, mimeType = 'application/json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  }

  /**
   * Fallback save using traditional download
   * @param {Object} projectData - Project data
   * @param {string} filename - Filename
   */
  fallbackSave(projectData, filename) {
    const suggestedName = this.generateFilename(projectData, filename);
    return this.downloadFile(projectData, suggestedName);
  }

  /**
   * Fallback load using file input
   * @returns {Promise<Object>} Loaded data
   */
  async fallbackLoad() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            resolve({
              success: true,
              filename: file.name,
              data
            });
          } catch (error) {
            resolve({ success: false, error: 'Invalid JSON file' });
          }
        };
        reader.readAsText(file);
      };

      input.click();
    });
  }

  /**
   * Generate meaningful filename from project data
   * @param {Object} projectData - Project data
   * @param {string} defaultName - Default filename
   */
  generateFilename(projectData, defaultName) {
    if (projectData.metadata?.name) {
      const sanitized = projectData.metadata.name
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      return `${sanitized}-${Date.now()}.json`;
    }
    
    if (projectData.ceiling?.width_mm && projectData.ceiling?.length_mm) {
      return `ceiling-${projectData.ceiling.width_mm}x${projectData.ceiling.length_mm}-${Date.now()}.json`;
    }

    return `${defaultName.replace('.json', '')}-${Date.now()}.json`;
  }

  /**
   * Check if File System Access API is supported
   */
  isSupported() {
    return this.supported;
  }
}

// Export singleton instance
export const localFileSystem = new LocalFileSystem();

// Export for use in React components
export const useLocalFileSystem = () => localFileSystem;
