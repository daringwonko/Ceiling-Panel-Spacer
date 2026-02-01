/**
 * Quantity Calculator Service
 * 
 * Calculates areas, volumes, material quantities for BIM objects.
 * Supports door, window, wall, floor, and material schedules.
 */

import { BIMObject } from '../types/bim'
import { 
  ScheduleDefinition, 
  ScheduleRow, 
  ScheduleData,
  QuantityResult, 
  AreaCalculation, 
  VolumeCalculation, 
  MaterialQuantity,
  PREDEFINED_SCHEDULES 
} from '../types/schedules'
import { v4 as uuidv4 } from 'uuid'

/**
 * Calculate surface areas for all objects
 */
export function calculateAreas(objects: BIMObject[]): AreaCalculation[] {
  return objects
    .filter(obj => obj.type !== 'site' && obj.type !== 'building')
    .map(obj => {
      const width = obj.properties.width || obj.properties.length || 0
      const depth = obj.properties.depth || obj.properties.length || 0
      const height = obj.properties.height || 0
      const length = obj.properties.length || 0
      
      // Calculate based on object type
      let faces = { top: 0, bottom: 0, sides: 0, total: 0 }
      
      switch (obj.type) {
        case 'wall':
        case 'Wall':
          // Wall has two large faces (sides) and edges
          const wallArea = (length * height) / 1000000 // Convert mm² to m²
          faces = {
            top: 0,
            bottom: 0,
            sides: wallArea,
            total: wallArea * 2 // Both sides
          }
          break
          
        case 'floor':
        case 'Floor':
        case 'slab':
        case 'Slab':
          // Floor has top and bottom
          const floorArea = (width * depth) / 1000000
          faces = {
            top: floorArea,
            bottom: floorArea,
            sides: 0,
            total: floorArea * 2
          }
          break
          
        case 'door':
        case 'Door':
        case 'window':
        case 'Window':
          // Door/window is a single face
          const openingArea = (width * height) / 1000000
          faces = {
            top: 0,
            bottom: 0,
            sides: openingArea,
            total: openingArea
          }
          break
          
        case 'column':
        case 'Column':
        case 'beam':
        case 'Beam':
          // Column/beam has side faces
          const perimeter = 2 * ((width + depth) / 1000)
          const sideArea = perimeter * (height / 1000)
          faces = {
            top: (width * depth) / 1000000 || undefined,
            bottom: (width * depth) / 1000000 || undefined,
            sides: sideArea,
            total: sideArea + ((width * depth) / 1000000 || 0) * 2
          }
          break
          
        case 'ceiling':
        case 'Ceiling':
          // Ceiling is single face
          const ceilingArea = (width * depth) / 1000000
          faces = {
            top: ceilingArea,
            bottom: 0,
            sides: 0,
            total: ceilingArea
          }
          break
          
        default:
          // Generic calculation
          const genericArea = (width * height) / 1000000
          faces = {
            top: 0,
            bottom: 0,
            sides: genericArea,
            total: genericArea
          }
      }
      
      return {
        objectId: obj.id,
        objectName: obj.name,
        objectType: obj.type,
        level: obj.properties.level || 'Unknown',
        area: faces.total,
        unit: 'm²',
        faces
      }
    })
}

/**
 * Calculate volumes for 3D objects
 */
export function calculateVolumes(objects: BIMObject[]): VolumeCalculation[] {
  return objects
    .filter(obj => {
      const volumetricTypes = ['wall', 'floor', 'slab', 'column', 'beam', 'ceiling', 'stairs']
      return volumetricTypes.includes(obj.type.toLowerCase())
    })
    .map(obj => {
      const width = obj.properties.width || obj.properties.length || 0
      const depth = obj.properties.depth || obj.properties.length || 0
      const height = obj.properties.height || 0
      const length = obj.properties.length || 0
      const thickness = obj.properties.thickness || width
      
      let volume = 0
      
      switch (obj.type.toLowerCase()) {
        case 'wall':
          // Wall volume
          volume = (length * thickness * height) / 1000000000 // Convert mm³ to m³
          break
          
        case 'floor':
        case 'slab':
          // Slab volume
          volume = (width * depth * (obj.properties.thickness || 200)) / 1000000000
          break
          
        case 'column':
          // Column volume (rectangular)
          volume = (width * depth * height) / 1000000000
          break
          
        case 'beam':
          // Beam volume
          volume = (width * depth * length) / 1000000000
          break
          
        case 'ceiling':
          // Ceiling volume (thin)
          volume = (width * depth * 50) / 1000000000 // Assume 50mm thickness
          break
          
        default:
          // Generic volume
          volume = (width * depth * height) / 1000000000
      }
      
      return {
        objectId: obj.id,
        objectName: obj.name,
        objectType: obj.type,
        level: obj.properties.level || 'Unknown',
        volume,
        unit: 'm³'
      }
    })
}

/**
 * Calculate material quantities across all objects
 */
export function calculateMaterialQuantities(objects: BIMObject[]): MaterialQuantity[] {
  const materialMap = new Map<string, MaterialQuantity>()
  
  objects.forEach(obj => {
    if (obj.type === 'site' || obj.type === 'building') return
    
    const materialId = obj.material || 'unknown'
    const existing = materialMap.get(materialId) || {
      materialId,
      materialName: obj.material || 'Unknown Material',
      category: obj.properties.materialCategory || 'General',
      area: 0,
      volume: 0,
      count: 0,
      objects: []
    }
    
    // Calculate area based on type
    let area = 0
    const width = obj.properties.width || 0
    const height = obj.properties.height || 0
    const length = obj.properties.length || 0
    const depth = obj.properties.depth || 0
    
    switch (obj.type.toLowerCase()) {
      case 'wall':
        area = (length * height) / 1000000
        break
      case 'floor':
      case 'slab':
        area = (width * depth) / 1000000
        break
      case 'door':
      case 'window':
        area = (width * height) / 1000000
        break
      default:
        area = (width * height) / 1000000
    }
    
    // Calculate volume
    let volume = 0
    const thickness = obj.properties.thickness || width
    switch (obj.type.toLowerCase()) {
      case 'wall':
        volume = (length * thickness * height) / 1000000000
        break
      case 'floor':
      case 'slab':
        volume = (width * depth * thickness) / 1000000000
        break
      case 'column':
        volume = (width * depth * height) / 1000000000
        break
      default:
        volume = (width * depth * height) / 1000000000
    }
    
    existing.area += area
    existing.volume += volume
    existing.count += 1
    existing.objects.push(obj.id)
    existing.totalCost = (existing.totalCost || 0) + (obj.properties.unitCost || 0)
    
    materialMap.set(materialId, existing)
  })
  
  return Array.from(materialMap.values())
}

/**
 * Generate schedule from definition and objects
 */
export function generateSchedule(definition: ScheduleDefinition, objects: BIMObject[]): ScheduleRow[] {
  // Apply filter if defined
  const filteredObjects = definition.filter 
    ? objects.filter(definition.filter)
    : objects
  
  // Generate rows
  const rows: ScheduleRow[] = filteredObjects.map(obj => {
    const row: ScheduleRow = {
      id: uuidv4(),
      count: 1,
      type: obj.type,
      dimensions: `${obj.properties.width || 0} × ${obj.properties.height || 0}mm`,
      width: obj.properties.width,
      height: obj.properties.height,
      length: obj.properties.length,
      material: obj.material,
      level: obj.properties.level,
      notes: obj.properties.notes
    }
    
    // Calculate area and volume
    if (obj.properties.width && obj.properties.height) {
      row.area = (obj.properties.width * obj.properties.height) / 1000000
    }
    if (obj.properties.width && obj.properties.height && obj.properties.depth) {
      row.volume = (obj.properties.width * obj.properties.height * obj.properties.depth) / 1000000000
    }
    
    // Calculate cost
    if (obj.properties.unitCost) {
      row.unitCost = obj.properties.unitCost
      row.totalCost = obj.properties.unitCost
    }
    
    return row
  })
  
  // Sort if specified
  if (definition.sortBy) {
    rows.sort((a, b) => {
      const aVal = a[definition.sortBy!]
      const bVal = b[definition.sortBy!]
      
      if (aVal === undefined || bVal === undefined) return 0
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return definition.sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  return rows
}

/**
 * Generate complete schedule data with totals
 */
export function generateScheduleData(definition: ScheduleDefinition, objects: BIMObject[]): ScheduleData {
  const rows = generateSchedule(definition, objects)
  
  // Calculate totals
  const totals = {
    count: rows.reduce((sum, row) => sum + row.count, 0),
    area: rows.reduce((sum, row) => sum + (row.area || 0), 0),
    volume: rows.reduce((sum, row) => sum + (row.volume || 0), 0),
    cost: rows.reduce((sum, row) => sum + (row.totalCost || 0), 0)
  }
  
  // Group by level if specified
  let groupedRows: Record<string, ScheduleRow[]> | undefined
  if (definition.groupBy) {
    groupedRows = {}
    rows.forEach(row => {
      const groupKey = row[definition.groupBy!] as string || 'Unknown'
      if (!groupedRows[groupKey]) {
        groupedRows[groupKey] = []
      }
      groupedRows[groupKey].push(row)
    })
  }
  
  return {
    definition,
    rows,
    groupedRows,
    totals,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Generate full quantity takeoff for project
 */
export function generateFullQuantityTakeoff(objects: BIMObject[]): QuantityResult[] {
  const results: QuantityResult[] = []
  
  // Calculate wall areas
  const walls = objects.filter(obj => obj.type.toLowerCase() === 'wall')
  const wallAreas = calculateAreas(walls)
  wallAreas.forEach(area => {
    const unitCost = walls.find(w => w.id === area.objectId)?.properties.unitCost || 0
    results.push({
      category: 'Walls',
      item: area.objectName,
      count: 1,
      unit: 'm²',
      total: area.area,
      unitCost,
      totalCost: area.area * unitCost,
      breakdown: {
        level: area.level,
        area: area.area
      }
    })
  })
  
  // Calculate floor areas
  const floors = objects.filter(obj => obj.type.toLowerCase() === 'floor' || obj.type.toLowerCase() === 'slab')
  const floorAreas = calculateAreas(floors)
  floorAreas.forEach(area => {
    const unitCost = floors.find(f => f.id === area.objectId)?.properties.unitCost || 0
    results.push({
      category: 'Floors',
      item: area.objectName,
      count: 1,
      unit: 'm²',
      total: area.area,
      unitCost,
      totalCost: area.area * unitCost,
      breakdown: {
        level: area.level,
        area: area.area
      }
    })
  })
  
  // Calculate volumes
  const volumes = calculateVolumes(objects)
  volumes.forEach(vol => {
    const obj = objects.find(o => o.id === vol.objectId)
    const unitCost = obj?.properties.unitCost || 0
    results.push({
      category: 'Concrete',
      item: `${vol.objectName} (${vol.objectType})`,
      count: 1,
      unit: 'm³',
      total: vol.volume,
      unitCost,
      totalCost: vol.volume * unitCost,
      breakdown: {
        level: vol.level,
        volume: vol.volume
      }
    })
  })
  
  // Calculate material quantities
  const materialQuantities = calculateMaterialQuantities(objects)
  materialQuantities.forEach(mq => {
    results.push({
      category: 'Materials',
      item: mq.materialName,
      count: mq.count,
      unit: 'm²',
      total: mq.area,
      totalCost: mq.totalCost,
      breakdown: {
        material: mq.materialName,
        area: mq.area,
        volume: mq.volume
      }
    })
  })
  
  // Count doors
  const doors = objects.filter(obj => obj.type.toLowerCase() === 'door')
  if (doors.length > 0) {
    const totalDoorCost = doors.reduce((sum, d) => sum + (d.properties.unitCost || 0), 0)
    results.push({
      category: 'Doors',
      item: 'Doors',
      count: doors.length,
      unit: 'ea',
      total: doors.length,
      totalCost: totalDoorCost
    })
  }
  
  // Count windows
  const windows = objects.filter(obj => obj.type.toLowerCase() === 'window')
  if (windows.length > 0) {
    const totalWindowCost = windows.reduce((sum, w) => sum + (w.properties.unitCost || 0), 0)
    results.push({
      category: 'Windows',
      item: 'Windows',
      count: windows.length,
      unit: 'ea',
      total: windows.length,
      totalCost: totalWindowCost
    })
  }
  
  return results
}

/**
 * Get predefined schedule by ID
 */
export function getPredefinedSchedule(id: string): ScheduleDefinition | undefined {
  return PREDEFINED_SCHEDULES.find(s => s.id === id)
}

/**
 * Get all predefined schedules
 */
export function getAllPredefinedSchedules(): ScheduleDefinition[] {
  return [...PREDEFINED_SCHEDULES]
}

/**
 * Create custom schedule definition
 */
export function createCustomSchedule(
  name: string,
  type: 'custom',
  columns: ScheduleDefinition['columns'],
  filter?: ScheduleDefinition['filter']
): ScheduleDefinition {
  return {
    id: `custom-${uuidv4().slice(0, 8)}`,
    name,
    type,
    description: 'Custom schedule',
    columns,
    filter
  }
}

/**
 * Calculate wall areas specifically
 */
export function calculateWallAreas(walls: BIMObject[]): QuantityResult[] {
  return walls.map(wall => {
    const length = wall.properties.length || wall.properties.width || 0
    const height = wall.properties.height || 3000
    const area = (length * height) / 1000000 // m²
    
    return {
      category: 'Walls',
      item: wall.name,
      count: 1,
      unit: 'm²',
      total: area,
      unitCost: wall.properties.unitCost,
      totalCost: area * (wall.properties.unitCost || 0),
      breakdown: {
        level: wall.properties.level,
        area
      }
    }
  })
}

/**
 * Calculate floor areas specifically
 */
export function calculateFloorAreas(floors: BIMObject[]): QuantityResult[] {
  return floors.map(floor => {
    const width = floor.properties.width || 0
    const depth = floor.properties.depth || floor.properties.length || 0
    const area = (width * depth) / 1000000 // m²
    
    return {
      category: 'Floors',
      item: floor.name,
      count: 1,
      unit: 'm²',
      total: area,
      unitCost: floor.properties.unitCost,
      totalCost: area * (floor.properties.unitCost || 0),
      breakdown: {
        level: floor.properties.level,
        area
      }
    }
  })
}

/**
 * Calculate door quantities
 */
export function calculateDoorQuantities(doors: BIMObject[]): QuantityResult[] {
  const doorMap = new Map<string, { count: number; cost: number }>()
  
  doors.forEach(door => {
    const type = door.properties.type || 'Standard'
    const existing = doorMap.get(type) || { count: 0, cost: 0 }
    existing.count += 1
    existing.cost += door.properties.unitCost || 0
    doorMap.set(type, existing)
  })
  
  return Array.from(doorMap.entries()).map(([type, data]) => ({
    category: 'Doors',
    item: type,
    count: data.count,
    unit: 'ea',
    total: data.count,
    totalCost: data.cost
  }))
}

/**
 * Calculate window quantities
 */
export function calculateWindowQuantities(windows: BIMObject[]): QuantityResult[] {
  const windowMap = new Map<string, { count: number; cost: number }>()
  
  windows.forEach(window => {
    const type = window.properties.type || 'Fixed'
    const existing = windowMap.get(type) || { count: 0, cost: 0 }
    existing.count += 1
    existing.cost += window.properties.unitCost || 0
    windowMap.set(type, existing)
  })
  
  return Array.from(windowMap.entries()).map(([type, data]) => ({
    category: 'Windows',
    item: type,
    count: data.count,
    unit: 'ea',
    total: data.count,
    totalCost: data.cost
  }))
}
