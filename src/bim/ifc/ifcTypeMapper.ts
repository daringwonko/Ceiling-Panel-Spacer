/**
 * IFC Type Mapper - IFC Entity Type to BIM Object Type Mapping
 * 
 * Maps IFC entity types to application-specific BIM object types
 * for consistent object creation and management.
 */

import { IFCEntityType, BIMObjectType } from '../../types/ifc';

/**
 * Mapping table from IFC entity types to BIM object types
 */
export const IFC_TYPE_MAP: Record<string, BIMObjectType> = {
  // Building elements
  'IfcWall': 'Wall',
  'IfcWallStandardCase': 'Wall',
  'IfcWallElementedCase': 'Wall',
  'IfcWallType': 'Wall',
  
  // Structural elements
  'IfcBeam': 'Beam',
  'IfcBeamStandardCase': 'Beam',
  'IfcBeamType': 'Beam',
  'IfcColumn': 'Column',
  'IfcColumnStandardCase': 'Column',
  'IfcColumnType': 'Column',
  
  // Floor/ceiling elements
  'IfcSlab': 'Slab',
  'IfcFloorSlab': 'Slab',
  'IfcRoofSlab': 'Slab',
  'IfcSlabElementedCase': 'Slab',
  'IfcSlabType': 'Slab',
  
  // Openings
  'IfcDoor': 'Door',
  'IfcDoorStandardCase': 'Door',
  'IfcDoorType': 'Door',
  'IfcWindow': 'Window',
  'IfcWindowStandardCase': 'Window',
  'IfcWindowType': 'Window',
  
  // Roof elements
  'IfcRoof': 'Roof',
  'IfcRoofType': 'Roof',
  'IfcCovering': 'Covering',
  'IfcCoveringType': 'Covering',
  
  // Vertical circulation
  'IfcStair': 'Stair',
  'IfcStairFlight': 'Stair',
  'IfcStairType': 'Stair',
  'IfcRamp': 'Ramp',
  'IfcRampFlight': 'Ramp',
  'IfcRampType': 'Ramp',
  
  // Furniture and equipment
  'IfcFurnishingElement': 'Furniture',
  'IfcFurnitureType': 'Furniture',
  'IfcSanitaryTerminalType': 'Furniture',
  'IfcTransportElementType': 'Furniture',
  
  // Spatial structure
  'IfcSite': 'Site',
  'IfcBuilding': 'Building',
  'IfcBuildingStorey': 'Level',
  'IfcSpace': 'Level',
  
  // Generic elements
  'IfcElement': 'Element',
  'IfcProduct': 'Element',
  'IfcBuiltElement': 'Element',
  'IfcBuiltElementType': 'Element',
};

/**
 * Reverse mapping from BIM types to IFC types
 */
export const BIM_TO_IFC_MAP: Record<BIMObjectType, string[]> = {
  'Wall': ['IfcWall', 'IfcWallStandardCase'],
  'Beam': ['IfcBeam', 'IfcBeamStandardCase'],
  'Column': ['IfcColumn', 'IfcColumnStandardCase'],
  'Slab': ['IfcSlab', 'IfcFloorSlab', 'IfcRoofSlab'],
  'Door': ['IfcDoor', 'IfcDoorStandardCase'],
  'Window': ['IfcWindow', 'IfcWindowStandardCase'],
  'Roof': ['IfcRoof', 'IfcRoofType'],
  'Covering': ['IfcCovering'],
  'Stair': ['IfcStair', 'IfcStairFlight'],
  'Ramp': ['IfcRamp', 'IfcRampFlight'],
  'Furniture': ['IfcFurnishingElement'],
  'Site': ['IfcSite'],
  'Building': ['IfcBuilding'],
  'Level': ['IfcBuildingStorey', 'IfcSpace'],
  'Element': ['IfcElement', 'IfcProduct', 'IfcBuiltElement'],
  'Unknown': []
};

/**
 * Map an IFC entity type to a BIM object type
 * 
 * @param ifcType - The IFC entity type string
 * @returns The corresponding BIM object type
 */
export function mapIFCTypeToBIM(ifcType: string): BIMObjectType {
  // Direct mapping lookup
  if (IFC_TYPE_MAP[ifcType]) {
    return IFC_TYPE_MAP[ifcType];
  }
  
  // Try to match prefix patterns
  if (ifcType.startsWith('IfcWall')) {
    return 'Wall';
  }
  if (ifcType.startsWith('IfcBeam')) {
    return 'Beam';
  }
  if (ifcType.startsWith('IfcColumn')) {
    return 'Column';
  }
  if (ifcType.startsWith('IfcSlab')) {
    return 'Slab';
  }
  if (ifcType.startsWith('IfcDoor')) {
    return 'Door';
  }
  if (ifcType.startsWith('IfcWindow')) {
    return 'Window';
  }
  if (ifcType.startsWith('IfcStair') || ifcType.startsWith('IfcStairFlight')) {
    return 'Stair';
  }
  if (ifcType.startsWith('IfcRamp') || ifcType.startsWith('IfcRampFlight')) {
    return 'Ramp';
  }
  if (ifcType.startsWith('IfcRoof') || ifcType.startsWith('IfcCovering')) {
    return 'Roof';
  }
  if (ifcType.startsWith('IfcFurnishing') || ifcType.startsWith('IfcFurniture')) {
    return 'Furniture';
  }
  if (ifcType.startsWith('IfcSite')) {
    return 'Site';
  }
  if (ifcType.startsWith('IfcBuilding')) {
    return 'Building';
  }
  if (ifcType.startsWith('IfcBuildingStorey') || ifcType.startsWith('IfcSpace')) {
    return 'Level';
  }
  if (ifcType.startsWith('Ifc')) {
    return 'Element';
  }
  
  // Unknown type
  return 'Unknown';
}

/**
 * Get the primary IFC type for a BIM object type
 * 
 * @param bimType - The BIM object type
 * @returns The primary IFC entity type
 */
export function getPrimaryIFCType(bimType: BIMObjectType): string {
  const ifcTypes = BIM_TO_IFC_MAP[bimType] || [];
  return ifcTypes[0] || '';
}

/**
 * Check if an IFC type is supported for import
 * 
 * @param ifcType - The IFC entity type
 * @returns True if the type is supported
 */
export function isIFCTypeSupported(ifcType: string): boolean {
  const bimType = mapIFCTypeToBIM(ifcType);
  return bimType !== 'Unknown';
}

/**
 * Get all supported IFC types
 * 
 * @returns Array of supported IFC entity types
 */
export function getSupportedIFCTypes(): string[] {
  return Object.keys(IFC_TYPE_MAP);
}

/**
 * Get statistics about supported types
 * 
 * @returns Object with type statistics
 */
export function getTypeMappingStatistics(): {
  totalMapped: number;
  buildingElements: number;
  structuralElements: number;
  openings: number;
  spatialElements: number;
} {
  const buildingElements = ['Wall', 'Slab', 'Roof', 'Covering'].length;
  const structuralElements = ['Beam', 'Column'].length;
  const openings = ['Door', 'Window'].length;
  const spatialElements = ['Site', 'Building', 'Level'].length;
  
  return {
    totalMapped: Object.keys(IFC_TYPE_MAP).length,
    buildingElements,
    structuralElements,
    openings,
    spatialElements
  };
}

/**
 * Categorize IFC type for UI grouping
 * 
 * @param ifcType - The IFC entity type
 * @returns Category string for UI organization
 */
export function categorizeIFCType(ifcType: string): string {
  const bimType = mapIFCTypeToBIM(ifcType);
  
  switch (bimType) {
    case 'Wall':
    case 'Slab':
    case 'Roof':
    case 'Covering':
      return 'Building Elements';
    case 'Beam':
    case 'Column':
      return 'Structural Elements';
    case 'Door':
    case 'Window':
      return 'Openings';
    case 'Stair':
    case 'Ramp':
      return 'Vertical Circulation';
    case 'Furniture':
      return 'Furniture & Equipment';
    case 'Site':
    case 'Building':
    case 'Level':
      return 'Spatial Structure';
    default:
      return 'Other Elements';
  }
}
