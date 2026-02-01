/**
 * IFC Manager - Web-ifc-three Initialization and Management
 * 
 * Handles WASM loading, IFCLoader initialization, and provides
 * singleton access for IFC operations throughout the application.
 */

import { IFCLoader } from 'web-ifc-three';
import { IFCLoaderConfig, IFCImportResult, IFCImportStatistics, BIMProperties, SpatialTree } from '../../types/ifc';
import { mapIFCTypeToBIM } from './ifcTypeMapper';
import { extractProperties } from './ifcPropertyExtractor';
import { buildSpatialStructure } from './ifcSpatialStructure';
import * as THREE from 'three';

export class IFCManager {
  private static instance: IFCManager | null = null;
  private loader: IFCLoader | null = null;
  private isInitialized: boolean = false;
  private initializationError: Error | null = null;
  private model: any = null; // web-ifc-three model type

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of IFCManager
   */
  static getInstance(): IFCManager {
    if (IFCManager.instance === null) {
      IFCManager.instance = new IFCManager();
    }
    return IFCManager.instance;
  }

  /**
   * Initialize the IFC manager and load WASM
   */
  async initialize(config: IFCLoaderConfig = {}): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    try {
      // Configure WASM path if provided
      const WASMPath = config.WASMPath || '/';
      
      // Initialize IFCLoader with optional configuration
      this.loader = new IFCLoader();
      
      // Configure worker path for better performance
      if (config.workerPath) {
        this.loader.setWorkerPath(config.workerPath);
      }

      // Note: web-ifc-three handles WASM loading internally
      // The WASM file is bundled with the package
      this.isInitialized = true;
      
      console.log('IFC Manager initialized successfully');
    } catch (error) {
      this.initializationError = error as Error;
      throw error;
    }
  }

  /**
   * Check if IFC manager is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.loader !== null;
  }

  /**
   * Get the IFCLoader instance
   */
  getLoader(): IFCLoader {
    if (!this.loader) {
      throw new Error('IFCManager not initialized. Call initialize() first.');
    }
    return this.loader;
  }

  /**
   * Load and parse an IFC file
   */
  async loadIFC(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<IFCImportResult> {
    if (!this.isInitialized || !this.loader) {
      throw new Error('IFCManager not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    const statistics: IFCImportStatistics = {
      totalElements: 0,
      walls: 0,
      beams: 0,
      columns: 0,
      slabs: 0,
      doors: 0,
      windows: 0,
      other: 0,
      levels: 0,
      warnings: []
    };

    try {
      // Load the IFC file using web-ifc-three
      const ifcLoader = this.getLoader();
      
      // Create a group to hold all imported objects
      const group = new THREE.Group();
      group.name = 'IFC Import';

      // Load the file with progress callback
      const model = await new Promise<any>((resolve, reject) => {
        ifcLoader.load(
          file,
          (loadedModel) => {
            resolve(loadedModel);
          },
          (progress) => {
            if (onProgress) {
              onProgress(progress.loaded / progress.total * 100);
            }
          },
          (error) => {
            reject(error);
          }
        );
      });

      this.model = model;

      // Extract geometry and properties from the model
      if (model && model.children) {
        for (const child of model.children) {
          const result = this.processIFCElement(child, statistics);
          if (result) {
            group.add(result);
          }
        }
      }

      // Build spatial structure
      const spatialStructure = buildSpatialStructure(model);

      // Count levels
      statistics.levels = spatialStructure?.levels.length || 0;

      // Calculate processing time
      const processingTime = performance.now() - startTime;

      console.log(`IFC import completed in ${processingTime.toFixed(2)}ms`);
      console.log(`Imported ${statistics.totalElements} elements:`, statistics);

      return {
        success: true,
        statistics,
        model: group,
        spatialStructure
      };
    } catch (error) {
      console.error('IFC import failed:', error);
      return {
        success: false,
        statistics,
        error: error instanceof Error ? error.message : 'Unknown error during import'
      };
    }
  }

  /**
   * Process a single IFC element and convert to BIM object
   */
  private processIFCElement(
    mesh: THREE.Mesh,
    statistics: IFCImportStatistics
  ): THREE.Object3D | null {
    if (!mesh.userData || !mesh.userData.ifc) {
      return null;
    }

    const ifcData = mesh.userData.ifc;
    const expressID = ifcData.expressID || 0;
    const ifcType = ifcData.type as string;

    // Map IFC type to BIM type
    const bimType = mapIFCTypeToBIM(ifcType);

    // Update statistics
    statistics.totalElements++;
    switch (bimType) {
      case 'Wall':
        statistics.walls++;
        break;
      case 'Beam':
        statistics.beams++;
        break;
      case 'Column':
        statistics.columns++;
        break;
      case 'Slab':
        statistics.slabs++;
        break;
      case 'Door':
        statistics.doors++;
        break;
      case 'Window':
        statistics.windows++;
        break;
      default:
        statistics.other++;
        break;
    }

    // Extract properties
    const properties = extractProperties(mesh);

    // Store BIM data in userData
    mesh.userData.ifc = {
      expressID,
      type: ifcType,
      properties
    };

    // Enhance mesh with BIM properties
    mesh.userData.bimType = bimType;
    mesh.userData.name = properties.name || `${bimType}_${expressID}`;
    mesh.userData.originalIfcType = ifcType;

    return mesh;
  }

  /**
   * Get the loaded model
   */
  getModel(): any {
    return this.model;
  }

  /**
   * Clear the loaded model
   */
  clearModel(): void {
    this.model = null;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.loader) {
      this.loader.dispose();
      this.loader = null;
    }
    this.isInitialized = false;
    this.initializationError = null;
    this.model = null;
  }
}

/**
 * Convenience function to initialize IFC
 */
export async function initializeIFC(config?: IFCLoaderConfig): Promise<void> {
  const manager = IFCManager.getInstance();
  await manager.initialize(config);
}

/**
 * Convenience function to load an IFC file
 */
export async function importIFC(
  file: File,
  onProgress?: (progress: number) => void
): Promise<IFCImportResult> {
  const manager = IFCManager.getInstance();
  if (!manager.isReady()) {
    await manager.initialize();
  }
  return manager.loadIFC(file, onProgress);
}

/**
 * Get the IFC manager instance
 */
export function getIFCManager(): IFCManager {
  return IFCManager.getInstance();
}
