/**
 * IFC Property Extractor - Extract Properties from IFC Elements
 * 
 * Parses IFC property sets (Psets), quantities, and metadata
 * from imported IFC geometry.
 */

import * as THREE from 'three';
import {
  BIMProperties,
  IFCPropertyValue,
  IFCPropertySet,
  IFCQuantitySet,
  IFCQuantity,
  IFCLocalPlacement
} from '../../types/ifc';

/**
 * Extract properties from an IFC mesh
 * 
 * @param mesh - Three.js mesh with IFC user data
 * @returns BIMProperties object with extracted data
 */
export function extractProperties(mesh: THREE.Mesh): BIMProperties {
  const ifcData = mesh.userData.ifc;
  
  if (!ifcData) {
    return {
      ifcType: 'Unknown',
      expressID: 0,
      propertySets: [],
      quantitySets: []
    };
  }

  const properties: BIMProperties = {
    ifcType: ifcData.type || 'Unknown',
    expressID: ifcData.expressID || 0,
    propertySets: [],
    quantitySets: []
  };

  // Extract name and description from userData if available
  if (mesh.userData.name) {
    properties.name = mesh.userData.name;
  }
  if (mesh.userData.description) {
    properties.description = mesh.userData.description;
  }

  // Extract geometry bounds for dimensions
  if (mesh.geometry) {
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox;
    
    if (bbox) {
      properties.dimensions = {
        width: bbox.max.x - bbox.min.x,
        height: bbox.max.y - bbox.min.y,
        depth: bbox.max.z - bbox.min.z
      };
    }
  }

  // Extract placement if available
  if (mesh.position) {
    properties.placement = {
      location: {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z
      }
    };
  }

  // Extract properties from web-ifc-three data structure
  if (ifcData.properties) {
    const props = ifcData.properties;
    
    // Extract Name
    if (props.Name) {
      properties.name = props.Name.value || properties.name;
    }
    
    // Extract Description
    if (props.Description) {
      properties.description = props.Description.value || properties.description;
    }
    
    // Extract ObjectType
    if (props.ObjectType) {
      properties.objectType = props.ObjectType.value;
    }

    // Extract property sets if present
    if (props.HasPropertySets) {
      properties.propertySets = extractPropertySets(props.HasPropertySets);
    }
  }

  // Extract quantity sets if available
  if (ifcData.quantities) {
    properties.quantitySets = extractQuantitySets(ifcData.quantities);
  }

  return properties;
}

/**
 * Extract property sets from IFC data
 * 
 * @param propertySetsData - Raw property sets data from IFC
 * @returns Array of parsed property sets
 */
function extractPropertySets(propertySetsData: any[]): IFCPropertySet[] {
  if (!Array.isArray(propertySetsData)) {
    return [];
  }

  return propertySetsData.map(pset => {
    const properties: IFCPropertyValue[] = [];
    
    if (pset.HasProperties) {
      for (const prop of pset.HasProperties) {
        properties.push({
          name: prop.Name?.value || prop.name || 'Unknown',
          type: getPropertyType(prop),
          value: prop.NominalValue?.value ?? prop.nominalValue ?? null,
          unit: prop.Unit?.value || prop.unit
        });
      }
    }
    
    return {
      name: pset.Name?.value || pset.name || 'Unknown',
      description: pset.Description?.value || pset.description,
      properties
    };
  });
}

/**
 * Extract quantity sets from IFC data
 * 
 * @param quantityData - Raw quantity data from IFC
 * @returns Array of parsed quantity sets
 */
function extractQuantitySets(quantityData: any[]): IFCQuantitySet[] {
  if (!Array.isArray(quantityData)) {
    return [];
  }

  return quantityData.map(qset => {
    const quantities: IFCQuantity[] = [];
    
    if (qset.Quantities) {
      for (const qty of qset.Quantities) {
        quantities.push({
          name: qty.Name?.value || qty.name || 'Unknown',
          type: getQuantityType(qty),
          value: qty[getQuantityValueField(qty)]?.value ?? qty.value ?? 0,
          unit: qty.Unit?.value || qty.unit || 'mm'
        });
      }
    }
    
    return {
      name: qset.Name?.value || qset.name || 'Unknown',
      quantities
    };
  });
}

/**
 * Determine the type of an IFC property
 */
function getPropertyType(prop: any): 'string' | 'number' | 'boolean' | 'entity' {
  const nominalValue = prop.NominalValue || prop.nominalValue;
  
  if (!nominalValue) {
    return 'string';
  }
  
  const value = nominalValue.value;
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  
  return 'entity';
}

/**
 * Determine the type of an IFC quantity
 */
function getQuantityType(qty: any): 'length' | 'area' | 'volume' | 'count' {
  // Check the type field if present
  if (qty.type) {
    const type = qty.type.value || qty.type;
    if (type.includes('Length')) return 'length';
    if (type.includes('Area')) return 'area';
    if (type.includes('Volume')) return 'volume';
    if (type.includes('Count')) return 'count';
  }
  
  // Guess from the value field name
  const valueField = getQuantityValueField(qty);
  if (valueField.includes('Length')) return 'length';
  if (valueField.includes('Area')) return 'area';
  if (valueField.includes('Volume')) return 'volume';
  if (valueField.includes('Number') || valueField.includes('Count')) return 'count';
  
  return 'count'; // Default
}

/**
 * Get the field name containing the quantity value
 */
function getQuantityValueField(qty: any): string {
  const possibleFields = [
    'LengthValue',
    'AreaValue',
    'VolumeValue',
    'CountValue'
  ];
  
  for (const field of possibleFields) {
    if (qty[field]) {
      return field;
    }
  }
  
  return 'value';
}

/**
 * Create a common property set for BIM objects
 * 
 * @param name - Property name
 * @param value - Property value
 * @param type - Property type
 * @returns IFCPropertyValue object
 */
export function createProperty(
  name: string,
  value: string | number | boolean,
  type: 'string' | 'number' | 'boolean' = 'string'
): IFCPropertyValue {
  return {
    name,
    type,
    value
  };
}

/**
 * Create a standard property set for construction elements
 * 
 * @param material - Material name
 * @param fireRating - Fire rating classification
 * @returns IFCPropertySet object
 */
export function createStandardPropertySet(
  material?: string,
  fireRating?: string
): IFCPropertySet {
  const properties: IFCPropertyValue[] = [];
  
  if (material) {
    properties.push(createProperty('Material', material, 'string'));
  }
  if (fireRating) {
    properties.push(createProperty('FireRating', fireRating, 'string'));
  }
  
  return {
    name: 'Pset_ElementCommon',
    properties
  };
}

/**
 * Convert units from IFC to application units
 * Typically IFC uses meters, app may use millimeters
 * 
 * @param value - Value in IFC units (meters)
 * @param fromUnit - Source unit (default: 'm')
 * @param toUnit - Target unit (default: 'mm')
 * @returns Converted value
 */
export function convertIFCUnits(
  value: number,
  fromUnit: string = 'm',
  toUnit: string = 'mm'
): number {
  const conversionFactors: Record<string, number> = {
    'm': 1,
    'mm': 0.001,
    'cm': 0.01,
    'in': 0.0254,
    'ft': 0.3048
  };
  
  const fromFactor = conversionFactors[fromUnit] || 1;
  const toFactor = conversionFactors[toUnit] || 0.001;
  
  // Convert to meters first, then to target unit
  return value * fromFactor / toFactor;
}

/**
 * Format a property value for display
 * 
 * @param property - IFC property value
 * @returns Formatted string with unit if applicable
 */
export function formatPropertyValue(property: IFCPropertyValue): string {
  let valueStr = String(property.value);
  
  if (property.unit && property.type === 'number') {
    valueStr += ` ${property.unit}`;
  }
  
  return valueStr;
}
