/**
 * Material Model
 * Defines the data structures for BIM materials with PBR properties
 */

export enum MaterialCategory {
  CONCRETE = 'concrete',
  WOOD = 'wood',
  METAL = 'metal',
  GLASS = 'glass',
  CERAMIC = 'ceramic',
  FABRIC = 'fabric',
  PLASTIC = 'plastic',
  STONE = 'stone',
  GYPSUM = 'gypsum',
  CUSTOM = 'custom'
}

export interface MaterialProperties {
  /** Base color in hex format (e.g., '#808080') */
  color: string;
  /** Roughness value 0-1 (0 = mirror-like, 1 = matte) */
  roughness: number;
  /** Metalness value 0-1 (0 = dielectric, 1 = metal) */
  metalness: number;
  /** Opacity value 0-1 (0 = fully transparent, 1 = fully opaque) */
  opacity: number;
  /** Emissive color in hex format for self-illumination */
  emissive: string;
  /** Emissive intensity 0-1 */
  emissiveIntensity: number;
  /** Optional texture map URL */
  textureMap?: string;
  /** Optional normal map URL */
  normalMap?: string;
  /** Optional roughness map URL */
  roughnessMap?: string;
  /** Optional metalness map URL */
  metalnessMap?: string;
}

export interface Material {
  /** Unique identifier */
  id: string;
  /** Material name */
  name: string;
  /** Material category */
  category: MaterialCategory;
  /** PBR material properties */
  properties: MaterialProperties;
  /** Optional description */
  description?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  updatedAt: number;
  /** Whether this is a predefined (read-only) material */
  isPredefined: boolean;
}

export interface MaterialCreateInput {
  name: string;
  category: MaterialCategory;
  properties: Partial<MaterialProperties>;
  description?: string;
}

export interface MaterialUpdateInput {
  name?: string;
  category?: MaterialCategory;
  properties?: Partial<MaterialProperties>;
  description?: string;
}

/** Default material properties */
export const DEFAULT_MATERIAL_PROPERTIES: MaterialProperties = {
  color: '#808080',
  roughness: 0.5,
  metalness: 0.0,
  opacity: 1.0,
  emissive: '#000000',
  emissiveIntensity: 0.0
};

/** Validate material properties */
export function validateMaterialProperties(props: Partial<MaterialProperties>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (props.color !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(props.color)) {
      errors.push('Color must be a valid hex color (e.g., #808080)');
    }
  }

  if (props.roughness !== undefined) {
    if (props.roughness < 0 || props.roughness > 1) {
      errors.push('Roughness must be between 0 and 1');
    }
  }

  if (props.metalness !== undefined) {
    if (props.metalness < 0 || props.metalness > 1) {
      errors.push('Metalness must be between 0 and 1');
    }
  }

  if (props.opacity !== undefined) {
    if (props.opacity < 0 || props.opacity > 1) {
      errors.push('Opacity must be between 0 and 1');
    }
  }

  if (props.emissive !== undefined) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(props.emissive)) {
      errors.push('Emissive color must be a valid hex color');
    }
  }

  if (props.emissiveIntensity !== undefined) {
    if (props.emissiveIntensity < 0 || props.emissiveIntensity > 1) {
      errors.push('Emissive intensity must be between 0 and 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/** Create a new material with default properties merged */
export function createMaterial(
  id: string,
  input: MaterialCreateInput,
  isPredefined: boolean = false
): Material {
  const validation = validateMaterialProperties(input.properties);
  if (!validation.valid) {
    throw new Error(`Invalid material properties: ${validation.errors.join(', ')}`);
  }

  const now = Date.now();

  return {
    id,
    name: input.name,
    category: input.category,
    properties: {
      ...DEFAULT_MATERIAL_PROPERTIES,
      ...input.properties
    },
    description: input.description,
    createdAt: now,
    updatedAt: now,
    isPredefined
  };
}

/** Update material properties */
export function updateMaterial(
  material: Material,
  input: MaterialUpdateInput
): Material {
  if (material.isPredefined) {
    throw new Error('Cannot modify predefined materials. Duplicate it first.');
  }

  const validation = validateMaterialProperties(input.properties || {});
  if (!validation.valid) {
    throw new Error(`Invalid material properties: ${validation.errors.join(', ')}`);
  }

  return {
    ...material,
    name: input.name ?? material.name,
    category: input.category ?? material.category,
    properties: input.properties
      ? { ...material.properties, ...input.properties }
      : material.properties,
    description: input.description ?? material.description,
    updatedAt: Date.now()
  };
}

/** Duplicate a material for editing */
export function duplicateMaterial(
  material: Material,
  newId: string,
  newName?: string
): Material {
  const now = Date.now();

  return {
    ...material,
    id: newId,
    name: newName || `${material.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    isPredefined: false
  };
}

/** Check if material is transparent */
export function isTransparent(material: Material): boolean {
  return material.properties.opacity < 1.0;
}

/** Check if material is emissive */
export function isEmissive(material: Material): boolean {
  return (
    material.properties.emissive !== '#000000' &&
    material.properties.emissiveIntensity > 0
  );
}

/** Get material display color (for UI swatches) */
export function getMaterialDisplayColor(material: Material): string {
  return material.properties.color;
}
