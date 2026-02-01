/**
 * Predefined Materials Library
 * Standard construction and architectural materials with realistic PBR properties
 */

import {
  Material,
  MaterialCategory,
  MaterialProperties
} from './Material';

// Helper to create material properties
const props = (p: Partial<MaterialProperties>): MaterialProperties => ({
  color: '#808080',
  roughness: 0.5,
  metalness: 0.0,
  opacity: 1.0,
  emissive: '#000000',
  emissiveIntensity: 0.0,
  ...p
});

/** Predefined concrete materials */
export const CONCRETE_MATERIALS: Material[] = [
  {
    id: 'concrete-standard',
    name: 'Standard Concrete',
    category: MaterialCategory.CONCRETE,
    properties: props({
      color: '#9E9E9E',
      roughness: 0.9,
      metalness: 0.0
    }),
    description: 'Standard gray concrete with rough finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'concrete-polished',
    name: 'Polished Concrete',
    category: MaterialCategory.CONCRETE,
    properties: props({
      color: '#BDBDBD',
      roughness: 0.3,
      metalness: 0.0
    }),
    description: 'Polished concrete floor finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'concrete-exposed',
    name: 'Exposed Aggregate',
    category: MaterialCategory.CONCRETE,
    properties: props({
      color: '#757575',
      roughness: 1.0,
      metalness: 0.0
    }),
    description: 'Exposed aggregate concrete texture',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined wood materials */
export const WOOD_MATERIALS: Material[] = [
  {
    id: 'wood-oak',
    name: 'Oak Wood',
    category: MaterialCategory.WOOD,
    properties: props({
      color: '#8D6E63',
      roughness: 0.6,
      metalness: 0.0
    }),
    description: 'Natural oak wood finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'wood-walnut',
    name: 'Walnut Wood',
    category: MaterialCategory.WOOD,
    properties: props({
      color: '#5D4037',
      roughness: 0.5,
      metalness: 0.0
    }),
    description: 'Dark walnut wood finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'wood-pine',
    name: 'Pine Wood',
    category: MaterialCategory.WOOD,
    properties: props({
      color: '#D7CCC8',
      roughness: 0.7,
      metalness: 0.0
    }),
    description: 'Light pine wood finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'wood-cherry',
    name: 'Cherry Wood',
    category: MaterialCategory.WOOD,
    properties: props({
      color: '#A1887F',
      roughness: 0.5,
      metalness: 0.0
    }),
    description: 'Rich cherry wood finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined metal materials */
export const METAL_MATERIALS: Material[] = [
  {
    id: 'metal-steel',
    name: 'Steel',
    category: MaterialCategory.METAL,
    properties: props({
      color: '#78909C',
      roughness: 0.3,
      metalness: 1.0
    }),
    description: 'Structural steel',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'metal-aluminum',
    name: 'Aluminum',
    category: MaterialCategory.METAL,
    properties: props({
      color: '#CFD8DC',
      roughness: 0.2,
      metalness: 0.9
    }),
    description: 'Brushed aluminum',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'metal-chrome',
    name: 'Chrome',
    category: MaterialCategory.METAL,
    properties: props({
      color: '#ECEFF1',
      roughness: 0.05,
      metalness: 1.0
    }),
    description: 'Polished chrome finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'metal-copper',
    name: 'Copper',
    category: MaterialCategory.METAL,
    properties: props({
      color: '#B87333',
      roughness: 0.3,
      metalness: 0.9
    }),
    description: 'Copper metal finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'metal-gold',
    name: 'Gold',
    category: MaterialCategory.METAL,
    properties: props({
      color: '#FFD700',
      roughness: 0.2,
      metalness: 1.0
    }),
    description: 'Gold finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined glass materials */
export const GLASS_MATERIALS: Material[] = [
  {
    id: 'glass-clear',
    name: 'Clear Glass',
    category: MaterialCategory.GLASS,
    properties: props({
      color: '#E3F2FD',
      roughness: 0.05,
      metalness: 0.0,
      opacity: 0.3
    }),
    description: 'Transparent clear glass',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'glass-tinted',
    name: 'Tinted Glass',
    category: MaterialCategory.GLASS,
    properties: props({
      color: '#546E7A',
      roughness: 0.05,
      metalness: 0.0,
      opacity: 0.5
    }),
    description: 'Gray tinted glass',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'glass-frosted',
    name: 'Frosted Glass',
    category: MaterialCategory.GLASS,
    properties: props({
      color: '#F5F5F5',
      roughness: 0.7,
      metalness: 0.0,
      opacity: 0.6
    }),
    description: 'Frosted/opaque glass',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined ceramic materials */
export const CERAMIC_MATERIALS: Material[] = [
  {
    id: 'ceramic-white',
    name: 'White Ceramic',
    category: MaterialCategory.CERAMIC,
    properties: props({
      color: '#FAFAFA',
      roughness: 0.2,
      metalness: 0.0
    }),
    description: 'Glossy white ceramic tile',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'ceramic-terracotta',
    name: 'Terracotta',
    category: MaterialCategory.CERAMIC,
    properties: props({
      color: '#BF360C',
      roughness: 0.8,
      metalness: 0.0
    }),
    description: 'Terracotta clay finish',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined fabric materials */
export const FABRIC_MATERIALS: Material[] = [
  {
    id: 'fabric-cotton',
    name: 'Cotton Fabric',
    category: MaterialCategory.FABRIC,
    properties: props({
      color: '#F5F5DC',
      roughness: 1.0,
      metalness: 0.0
    }),
    description: 'Natural cotton fabric',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'fabric-velvet',
    name: 'Velvet',
    category: MaterialCategory.FABRIC,
    properties: props({
      color: '#4A148C',
      roughness: 0.9,
      metalness: 0.1
    }),
    description: 'Rich velvet fabric',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined plastic materials */
export const PLASTIC_MATERIALS: Material[] = [
  {
    id: 'plastic-white',
    name: 'White Plastic',
    category: MaterialCategory.PLASTIC,
    properties: props({
      color: '#FFFFFF',
      roughness: 0.4,
      metalness: 0.0
    }),
    description: 'Glossy white plastic',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'plastic-black',
    name: 'Black Plastic',
    category: MaterialCategory.PLASTIC,
    properties: props({
      color: '#212121',
      roughness: 0.4,
      metalness: 0.0
    }),
    description: 'Glossy black plastic',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined stone materials */
export const STONE_MATERIALS: Material[] = [
  {
    id: 'stone-marble',
    name: 'Marble',
    category: MaterialCategory.STONE,
    properties: props({
      color: '#F5F5F5',
      roughness: 0.2,
      metalness: 0.0
    }),
    description: 'White marble with veining',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'stone-granite',
    name: 'Granite',
    category: MaterialCategory.STONE,
    properties: props({
      color: '#424242',
      roughness: 0.6,
      metalness: 0.0
    }),
    description: 'Dark granite stone',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  },
  {
    id: 'stone-brick',
    name: 'Brick',
    category: MaterialCategory.STONE,
    properties: props({
      color: '#A1887F',
      roughness: 0.9,
      metalness: 0.0
    }),
    description: 'Red clay brick',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Predefined gypsum materials */
export const GYPSUM_MATERIALS: Material[] = [
  {
    id: 'gypsum-standard',
    name: 'Drywall',
    category: MaterialCategory.GYPSUM,
    properties: props({
      color: '#FFF8E1',
      roughness: 0.9,
      metalness: 0.0
    }),
    description: 'Standard drywall/gypsum board',
    createdAt: 0,
    updatedAt: 0,
    isPredefined: true
  }
];

/** Complete predefined materials library */
export const PREDEFINED_MATERIALS: Material[] = [
  ...CONCRETE_MATERIALS,
  ...WOOD_MATERIALS,
  ...METAL_MATERIALS,
  ...GLASS_MATERIALS,
  ...CERAMIC_MATERIALS,
  ...FABRIC_MATERIALS,
  ...PLASTIC_MATERIALS,
  ...STONE_MATERIALS,
  ...GYPSUM_MATERIALS
];

/** Get materials by category */
export function getMaterialsByCategory(category: MaterialCategory): Material[] {
  return PREDEFINED_MATERIALS.filter(m => m.category === category);
}

/** Get material by ID */
export function getMaterialById(id: string): Material | undefined {
  return PREDEFINED_MATERIALS.find(m => m.id === id);
}

/** Get all material categories with counts */
export function getMaterialCategories(): { category: MaterialCategory; count: number }[] {
  const categories = Object.values(MaterialCategory);
  return categories.map(category => ({
    category,
    count: PREDEFINED_MATERIALS.filter(m => m.category === category).length
  }));
}

/** Total predefined material count */
export const PREDEFINED_MATERIAL_COUNT = PREDEFINED_MATERIALS.length;
