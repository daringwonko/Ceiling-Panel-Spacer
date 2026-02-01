export interface Material {
  id: string
  name: string
  category: 'lighting' | 'acoustic' | 'drywall' | 'metal' | 'custom'
  color: string
  reflectivity: number // 0.0 to 1.0
  costPerSqm: number
  notes: string
}

export interface MaterialCategory {
  id: string
  name: string
  materials: Material[]
}

export const PREDEFINED_MATERIALS: Material[] = [
  {
    id: 'led_panel_white',
    name: 'LED Panel (White)',
    category: 'lighting',
    color: '#FFFFFF',
    reflectivity: 0.85,
    costPerSqm: 450.00,
    notes: 'Integrated LED lighting, 4000K'
  },
  {
    id: 'led_panel_black',
    name: 'LED Panel (Black)',
    category: 'lighting',
    color: '#1a1a1a',
    reflectivity: 0.15,
    costPerSqm: 450.00,
    notes: 'Integrated LED lighting, 4000K'
  },
  {
    id: 'acoustic_white',
    name: 'Acoustic Panel (White)',
    category: 'acoustic',
    color: '#F5F5F5',
    reflectivity: 0.70,
    costPerSqm: 35.00,
    notes: 'Sound absorbing, Class A'
  },
  {
    id: 'acoustic_grey',
    name: 'Acoustic Panel (Grey)',
    category: 'acoustic',
    color: '#808080',
    reflectivity: 0.50,
    costPerSqm: 35.00,
    notes: 'Sound absorbing, Class A'
  },
  {
    id: 'drywall_white',
    name: 'Drywall (White)',
    category: 'drywall',
    color: '#FFFFFF',
    reflectivity: 0.75,
    costPerSqm: 15.00,
    notes: 'Standard gypsum board'
  },
  {
    id: 'aluminum_brushed',
    name: 'Aluminum (Brushed)',
    category: 'metal',
    color: '#C0C0C0',
    reflectivity: 0.60,
    costPerSqm: 120.00,
    notes: 'Anodized aluminum, brushed finish'
  },
  {
    id: 'aluminum_polished',
    name: 'Aluminum (Polished)',
    category: 'metal',
    color: '#E8E8E8',
    reflectivity: 0.90,
    costPerSqm: 140.00,
    notes: 'Anodized aluminum, mirror polish'
  }
]

export function getMaterialsByCategory(): MaterialCategory[] {
  const categories: Record<string, Material[]> = {}
  
  PREDEFINED_MATERIALS.forEach(material => {
    if (!categories[material.category]) {
      categories[material.category] = []
    }
    categories[material.category].push(material)
  })
  
  return Object.entries(categories).map(([id, materials]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    materials
  }))
}

export function getMaterialById(id: string): Material | undefined {
  return PREDEFINED_MATERIALS.find(m => m.id === id)
}
