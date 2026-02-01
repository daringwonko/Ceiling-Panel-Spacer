// Test fixtures and mocks for BIM objects
import { BIMObject, BIMProject, Level, Material, Layer } from '../../bim/types'

// Mock BIM Object fixtures
export const mockWall: BIMObject = {
  id: 'wall-001',
  type: 'wall',
  name: 'Test Wall',
  properties: {
    width: 5000,
    height: 3000,
    thickness: 200
  },
  geometry: {
    type: 'box',
    width: 5000,
    height: 3000,
    depth: 200
  },
  material: 'concrete',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  isSelected: false,
  isLocked: false,
  levelId: 'level-1',
  layerId: 'layer-structure',
  metadata: {
    ifcType: 'IfcWall',
    ifcGuid: 'wall-ifc-001'
  }
}

export const mockDoor: BIMObject = {
  id: 'door-001',
  type: 'door',
  name: 'Test Door',
  properties: {
    width: 900,
    height: 2100,
    thickness: 100
  },
  geometry: {
    type: 'box',
    width: 900,
    height: 2100,
    depth: 100
  },
  material: 'wood-oak',
  position: [1000, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  isSelected: false,
  isLocked: false,
  levelId: 'level-1',
  layerId: 'layer-architecture',
  metadata: {
    ifcType: 'IfcDoor',
    ifcGuid: 'door-ifc-001'
  }
}

export const mockWindow: BIMObject = {
  id: 'window-001',
  type: 'window',
  name: 'Test Window',
  properties: {
    width: 1500,
    height: 1200,
    thickness: 150
  },
  geometry: {
    type: 'box',
    width: 1500,
    height: 1200,
    depth: 150
  },
  material: 'glass-clear',
  position: [2000, 1000, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  isSelected: false,
  isLocked: false,
  levelId: 'level-1',
  layerId: 'layer-architecture',
  metadata: {
    ifcType: 'IfcWindow',
    ifcGuid: 'window-ifc-001'
  }
}

export const mockFloor: BIMObject = {
  id: 'floor-001',
  type: 'floor',
  name: 'Test Floor',
  properties: {
    width: 10000,
    length: 15000,
    thickness: 200
  },
  geometry: {
    type: 'box',
    width: 10000,
    height: 200,
    depth: 15000
  },
  material: 'concrete-reinforced',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  isSelected: false,
  isLocked: false,
  levelId: 'level-1',
  layerId: 'layer-structure',
  metadata: {
    ifcType: 'IfcSlab',
    ifcGuid: 'floor-ifc-001'
  }
}

// Mock Level fixture
export const mockLevel: Level = {
  id: 'level-1',
  name: 'Ground Floor',
  elevation: 0,
  height: 3000,
  buildingId: 'building-1',
  isVisible: true,
  isActive: true
}

// Mock Material fixture
export const mockMaterial: Material = {
  id: 'material-concrete',
  name: 'Concrete',
  type: 'standard',
  properties: {
    color: '#808080',
    roughness: 0.8,
    metalness: 0.1
  },
  costPerSqM: 150,
  unit: 'sqm'
}

// Mock Layer fixture
export const mockLayer: Layer = {
  id: 'layer-structure',
  name: 'Structure',
  isVisible: true,
  isLocked: false,
  color: '#ff0000',
  lineWeight: 1
}

// Generate array of mock objects for performance testing
export const generateMockObjects = (count: number): BIMObject[] => {
  const objects: BIMObject[] = []
  for (let i = 0; i < count; i++) {
    objects.push({
      ...mockWall,
      id: `wall-${String(i).padStart(3, '0')}`,
      name: `Test Wall ${i}`,
      position: [i * 600, 0, 0]
    })
  }
  return objects
}

// Mock project fixture
export const mockProject: BIMProject = {
  id: 'project-001',
  name: 'Test Project',
  description: 'A test project for unit testing',
  version: '1.0.0',
  objects: [mockWall, mockDoor, mockWindow, mockFloor],
  levels: [mockLevel],
  materials: [mockMaterial],
  layers: [mockLayer],
  metadata: {
    created: new Date('2026-01-01').toISOString(),
    modified: new Date('2026-01-15').toISOString(),
    author: 'Test Suite',
    ifcVersion: 'IFC4'
  }
}

// Empty project for reset tests
export const emptyProject: BIMProject = {
  id: 'empty-project',
  name: 'Empty Project',
  description: 'An empty project for testing',
  version: '1.0.0',
  objects: [],
  levels: [mockLevel],
  materials: [],
  layers: [],
  metadata: {
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    author: 'Test Suite',
    ifcVersion: 'IFC4'
  }
}
