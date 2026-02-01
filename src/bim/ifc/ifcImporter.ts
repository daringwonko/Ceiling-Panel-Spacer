/**
 * IFC Importer - IFC File Parsing and BIM Object Creation
 * 
 * Handles IFC file loading, parsing, and conversion to BIM objects
 * with progress tracking and error handling.
 */

import * as THREE from 'three';
import {
  IFCImportResult,
  IFCImportStatistics,
  IFCEntityType,
  BIMObjectType,
  BIMProperties,
  SpatialTree,
  SpatialTreeNode
} from '../../types/ifc';
import { mapIFCTypeToBIM, isIFCTypeSupported } from './ifcTypeMapper';
import { extractProperties } from './ifcPropertyExtractor';
import { buildSpatialStructure, initializeSpatialTree } from './ifcSpatialStructure';
import { IFCManager } from './ifcManager';

export interface ImportOptions {
  filterUnsupported?: boolean;
  mergeGeometry?: boolean;
  autoCenter?: boolean;
  autoScale?: boolean;
  targetUnit?: 'mm' | 'cm' | 'm';
}

export interface ParseOptions {
  extractProperties?: boolean;
  buildHierarchy?: boolean;
  groupByLevel?: boolean;
}

/**
 * Import an IFC file and convert to BIM objects
 * 
 * @param file - The IFC file to import
 * @param onProgress - Optional progress callback (0-100)
 * @param options - Import options
 * @returns IFCImportResult with model and statistics
 */
export async function importIFC(
  file: File,
  onProgress?: (progress: number) => void,
  options: ImportOptions = {}
): Promise<IFCImportResult> {
  const manager = IFCManager.getInstance();
  
  if (!manager.isReady()) {
    await manager.initialize();
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
    // Load the IFC file
    const result = await manager.loadIFC(file, (progress) => {
      if (onProgress) {
        onProgress(progress * 0.9); // Reserve 10% for post-processing
      }
    });

    if (!result.success) {
      return result;
    }

    // Apply import options
    if (result.model) {
      if (options.autoCenter) {
        centerGeometry(result.model);
      }
      if (options.autoScale) {
        scaleGeometry(result.model, options.targetUnit);
      }
      if (options.mergeGeometry) {
        mergeDuplicateMaterials(result.model);
      }
    }

    // Build spatial hierarchy
    const spatialStructure = buildSpatialStructure(manager.getModel());
    statistics.levels = spatialStructure?.levels.length || 0;

    // Update progress
    if (onProgress) {
      onProgress(100);
    }

    // Calculate processing time
    const processingTime = performance.now() - startTime;
    console.log(`IFC import completed in ${processingTime.toFixed(2)}ms`);

    return {
      ...result,
      statistics,
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
 * Parse IFC file metadata without full import
 * 
 * @param file - The IFC file to parse
 * @returns Object with file metadata
 */
export async function parseIFCMetadata(
  file: File
): Promise<{
  name: string;
  size: number;
  type: string;
  schema: string;
  elementCount: number;
  supportedTypes: string[];
}> {
  const manager = IFCManager.getInstance();
  
  if (!manager.isReady()) {
    await manager.initialize();
  }

  // Basic metadata from file
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    schema: 'IFC4', // Default, would be extracted from actual file
    elementCount: 0,
    supportedTypes: getSupportedIFCTypes()
  };

  return metadata;
}

/**
 * Parse IFC file and extract element information
 * 
 * @param file - The IFC file to parse
 * @param options - Parse options
 * @returns Array of element information
 */
export async function parseIFCElements(
  file: File,
  options: ParseOptions = {}
): Promise<Array<{
  expressID: number;
  type: IFCEntityType;
  bimType: BIMObjectType;
  name?: string;
  level?: string;
}>> {
  const manager = IFCManager.getInstance();
  
  if (!manager.isReady()) {
    await manager.initialize();
  }

  const result = await manager.loadIFC(file);
  const elements: Array<{
    expressID: number;
    type: IFCEntityType;
    bimType: BIMObjectType;
    name?: string;
    level?: string;
  }> = [];

  if (result.model && result.model.children) {
    for (const child of result.model.children) {
      if (child.userData?.ifc) {
        const ifcData = child.userData.ifc;
        const bimType = mapIFCTypeToBIM(ifcData.type);
        
        if (options.extractProperties) {
          const props = extractProperties(child as THREE.Mesh);
          elements.push({
            expressID: ifcData.expressID,
            type: ifcData.type as IFCEntityType,
            bimType,
            name: props.name,
            level: props.level
          });
        } else {
          elements.push({
            expressID: ifcData.expressID,
            type: ifcData.type as IFCEntityType,
            bimType
          });
        }
      }
    }
  }

  return elements;
}

/**
 * Get list of supported IFC entity types
 */
function getSupportedIFCTypes(): string[] {
  return [
    'IfcWall',
    'IfcWallStandardCase',
    'IfcBeam',
    'IfcColumn',
    'IfcSlab',
    'IfcFloorSlab',
    'IfcRoofSlab',
    'IfcDoor',
    'IfcDoorStandardCase',
    'IfcWindow',
    'IfcWindowStandardCase',
    'IfcStair',
    'IfcStairFlight',
    'IfcRamp',
    'IfcRampFlight',
    'IfcRoof',
    'IfcCovering',
    'IfcFurnishingElement',
    'IfcSite',
    'IfcBuilding',
    'IfcBuildingStorey'
  ];
}

/**
 * Center geometry at origin
 */
function centerGeometry(group: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  
  group.position.sub(center);
}

/**
 * Scale geometry to target unit
 */
function scaleGeometry(
  group: THREE.Group,
  targetUnit: 'mm' | 'cm' | 'm' = 'mm'
): void {
  const scaleFactors = {
    'm': 1000,  // IFC uses meters, convert to mm
    'cm': 100,  // IFC uses meters, convert to cm
    'mm': 1     // Already in mm
  };
  
  const scale = scaleFactors[targetUnit];
  group.scale.multiplyScalar(scale);
}

/**
 * Merge duplicate materials in geometry
 */
function mergeDuplicateMaterials(group: THREE.Group): void {
  const materialMap = new Map<string, THREE.Material>();
  
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = child.material;
      const matKey = mat.uuid;
      
      if (!materialMap.has(matKey)) {
        materialMap.set(matKey, mat);
      } else {
        child.material = materialMap.get(matKey)!;
      }
    }
  });
}

/**
 * Create a preview of an IFC file without full import
 * 
 * @param file - The IFC file to preview
 * @param maxElements - Maximum number of elements to include
 * @returns THREE.Group with preview geometry
 */
export async function previewIFC(
  file: File,
  maxElements: number = 100
): Promise<THREE.Group> {
  const manager = IFCManager.getInstance();
  
  if (!manager.isReady()) {
    await manager.initialize();
  }

  const result = await manager.loadIFC(file);
  
  if (!result.success || !result.model) {
    throw new Error(result.error || 'Failed to load IFC file');
  }

  // Limit to max elements for preview
  const previewGroup = new THREE.Group();
  let count = 0;
  
  result.model.traverse((child) => {
    if (count >= maxElements) return;
    
    if (child instanceof THREE.Mesh) {
      const clone = child.clone();
      clone.material = clone.material.clone();
      clone.material.transparent = true;
      clone.material.opacity = 0.5;
      previewGroup.add(clone);
      count++;
    }
  });

  return previewGroup;
}

/**
 * Validate an IFC file structure
 * 
 * @param file - The IFC file to validate
 * @returns Validation result with any errors/warnings
 */
export async function validateIFC(
  file: File
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  schema: string;
  elementCount: number;
}> {
  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[],
    schema: 'IFC4',
    elementCount: 0
  };

  // Check file size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    validation.errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (500MB)`);
    validation.valid = false;
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.ifc')) {
    validation.errors.push('File must have .ifc extension');
    validation.valid = false;
  }

  // Try to load and count elements
  try {
    const manager = IFCManager.getInstance();
    
    if (!manager.isReady()) {
      await manager.initialize();
    }

    const result = await manager.loadIFC(file);
    
    if (result.success) {
      validation.elementCount = result.statistics.totalElements;
      
      // Check for common issues
      if (result.statistics.walls === 0 && result.statistics.slabs === 0) {
        validation.warnings.push('No walls or slabs found - may be an incomplete model');
      }
      if (result.statistics.levels === 0) {
        validation.warnings.push('No building storeys found - spatial hierarchy may be incomplete');
      }
    } else {
      validation.errors.push(result.error || 'Failed to parse IFC file');
      validation.valid = false;
    }
  } catch (error) {
    validation.errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    validation.valid = false;
  }

  return validation;
}
