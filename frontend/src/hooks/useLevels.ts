import { useCallback, useMemo } from 'react'
import { useBIMStore } from '../stores/useBIMStore'
import { v4 as uuidv4 } from 'uuid'
import type { Level, Building, Site, LevelProperties, BuildingProperties, SiteProperties, LevelStatistics } from '../types/level'

// ============================================================================
// LEVEL HOOK - Manage project hierarchy (Site → Building → Level)
// ============================================================================

export interface UseLevelsReturn {
  // State
  sites: Site[]
  buildings: Building[]
  levels: Level[]
  currentSiteId: string | null
  currentBuildingId: string | null
  currentLevelId: string | null
  
  // Getters
  currentSite: Site | null
  currentBuilding: Building | null
  currentLevel: Level | null
  getSiteById: (id: string) => Site | undefined
  getBuildingById: (id: string) => Building | undefined
  getLevelById: (id: string) => Level | undefined
  getBuildingsBySite: (siteId: string) => Building[]
  getLevelsByBuilding: (buildingId: string) => Level[]
  getLevelsBySite: (siteId: string) => Level[]
  getSortedLevels: (buildingId: string) => Level[]
  getLevelStatistics: (levelId: string) => LevelStatistics
  getObjectsByLevel: (levelId: string) => any[]
  
  // Site CRUD
  createSite: (name: string, properties?: SiteProperties) => Site
  updateSite: (id: string, properties: SiteProperties) => void
  deleteSite: (id: string) => void
  setCurrentSite: (id: string | null) => void
  
  // Building CRUD
  createBuilding: (siteId: string, name: string, properties?: BuildingProperties) => Building
  updateBuilding: (id: string, properties: BuildingProperties) => void
  deleteBuilding: (id: string) => void
  moveBuilding: (buildingId: string, targetSiteId: string) => void
  setCurrentBuilding: (id: string | null) => void
  
  // Level CRUD
  createLevel: (buildingId: string, name: string, elevation: number, properties?: LevelProperties) => Level
  updateLevel: (id: string, properties: LevelProperties) => void
  deleteLevel: (id: string) => void
  moveLevel: (levelId: string, targetBuildingId: string) => void
  copyLevel: (levelId: string, targetElevation: number, newName?: string) => Level
  setCurrentLevel: (id: string | null) => void
  
  // Level operations
  toggleLevelVisibility: (id: string) => void
  showAllLevels: () => void
  hideAllLevels: () => void
  isolateLevel: (id: string) => void
  
  // Object-level operations
  assignObjectToLevel: (objectId: string, levelId: string) => void
  removeObjectFromLevel: (objectId: string, levelId: string) => void
  moveObjectToLevel: (objectId: string, fromLevelId: string, toLevelId: string) => void
  
  // Validation
  validateLevelElevation: (buildingId: string, elevation: number, excludeLevelId?: string) => { valid: boolean; error?: string }
  checkOverlappingLevels: (buildingId: string) => string[]
}

export function useLevels(): UseLevelsReturn {
  // Get state from BIM store
  const sites = useBIMStore((state) => (state as any).sites || [])
  const buildings = useBIMStore((state) => (state as any).buildings || [])
  const levels = useBIMStore((state) => (state as any).levels || [])
  const currentSiteId = useBIMStore((state) => (state as any).currentSiteId)
  const currentBuildingId = useBIMStore((state) => (state as any).currentBuildingId)
  const currentLevelId = useBIMStore((state) => (state as any).currentLevelId)
  const objects = useBIMStore((state) => state.objects)
  const setBIMState = useBIMStore((state) => state as any)

  // Memoized current selections
  const currentSite = useMemo(() => 
    sites.find((s: Site) => s.id === currentSiteId) || null,
    [sites, currentSiteId]
  )
  
  const currentBuilding = useMemo(() => 
    buildings.find((b: Building) => b.id === currentBuildingId) || null,
    [buildings, currentBuildingId]
  )
  
  const currentLevel = useMemo(() => 
    levels.find((l: Level) => l.id === currentLevelId) || null,
    [levels, currentLevelId]
  )

  // Getters
  const getSiteById = useCallback((id: string) => 
    sites.find((s: Site) => s.id === id),
    [sites]
  )

  const getBuildingById = useCallback((id: string) => 
    buildings.find((b: Building) => b.id === id),
    [buildings]
  )

  const getLevelById = useCallback((id: string) => 
    levels.find((l: Level) => l.id === id),
    [levels]
  )

  const getBuildingsBySite = useCallback((siteId: string) => 
    buildings.filter((b: Building) => b.siteId === siteId),
    [buildings]
  )

  const getLevelsByBuilding = useCallback((buildingId: string) => 
    levels.filter((l: Level) => l.buildingId === buildingId),
    [levels]
  )

  const getLevelsBySite = useCallback((siteId: string) => {
    const siteBuildings = getBuildingsBySite(siteId)
    const buildingIds = new Set(siteBuildings.map((b: Building) => b.id))
    return levels.filter((l: Level) => buildingIds.has(l.buildingId))
  }, [levels, getBuildingsBySite])

  const getSortedLevels = useCallback((buildingId: string) => 
    getLevelsByBuilding(buildingId).sort((a: Level, b: Level) => a.elevation - b.elevation),
    [getLevelsByBuilding]
  )

  const getLevelStatistics = useCallback((levelId: string): LevelStatistics => {
    const level = getLevelById(levelId)
    if (!level) {
      return { objectCount: 0, totalArea: 0, bounds: null }
    }
    
    const levelObjects = objects.filter((obj: any) => level.objectIds.includes(obj.id))
    
    // Calculate bounds from object positions
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    levelObjects.forEach((obj: any) => {
      const [x, y] = obj.position
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
    
    const bounds = levelObjects.length > 0 
      ? { minX, minY, maxX, maxY }
      : null
    
    const totalArea = bounds 
      ? (maxX - minX) * (maxY - minY) 
      : 0
    
    return {
      objectCount: levelObjects.length,
      totalArea,
      bounds
    }
  }, [getLevelById, objects])

  const getObjectsByLevel = useCallback((levelId: string) => {
    const level = getLevelById(levelId)
    if (!level) return []
    return objects.filter((obj: any) => level.objectIds.includes(obj.id))
  }, [getLevelById, objects])

  // Site CRUD
  const createSite = useCallback((name: string, properties?: SiteProperties): Site => {
    const site: Site = {
      id: uuidv4(),
      name,
      description: properties?.description || '',
      buildingIds: [],
      elevation: properties?.elevation || 0,
      address: properties?.address,
      latitude: properties?.latitude,
      longitude: properties?.longitude,
    }
    
    setBIMState.setState((state: any) => ({
      sites: [...state.sites, site],
      currentSiteId: site.id
    }))
    
    return site
  }, [setBIMState])

  const updateSite = useCallback((id: string, properties: SiteProperties) => {
    setBIMState.setState((state: any) => ({
      sites: state.sites.map((s: Site) => 
        s.id === id ? { ...s, ...properties } : s
      )
    }))
  }, [setBIMState])

  const deleteSite = useCallback((id: string) => {
    setBIMState.setState((state: any) => {
      // Delete all buildings in this site
      const site = state.sites.find((s: Site) => s.id === id)
      if (site) {
        site.buildingIds.forEach((buildingId: string) => {
          const building = state.buildings.find((b: Building) => b.id === buildingId)
          if (building) {
            // Delete all levels in this building
            building.levelIds.forEach((levelId: string) => {
              // Remove objects from these levels
              const level = state.levels.find((l: Level) => l.id === levelId)
              if (level) {
                level.objectIds.forEach((objId: string) => {
                  state.objects = state.objects.filter((obj: any) => obj.id !== objId)
                })
              }
            })
            state.levels = state.levels.filter((l: Level) => !building.levelIds.includes(l.id))
          }
        })
        state.buildings = state.buildings.filter((b: Building) => b.siteId !== id)
      }
      
      return {
        sites: state.sites.filter((s: Site) => s.id !== id),
        buildings: state.buildings,
        levels: state.levels,
        objects: state.objects,
        currentSiteId: state.currentSiteId === id ? null : state.currentSiteId
      }
    })
  }, [setBIMState])

  const setCurrentSite = useCallback((id: string | null) => {
    setBIMState.setState({ currentSiteId: id })
  }, [setBIMState])

  // Building CRUD
  const createBuilding = useCallback((siteId: string, name: string, properties?: BuildingProperties): Building => {
    const building: Building = {
      id: uuidv4(),
      name,
      siteId,
      levelIds: [],
      buildingType: properties?.buildingType || 'other',
      constructionYear: properties?.constructionYear,
      address: properties?.address,
    }
    
    setBIMState.setState((state: any) => ({
      buildings: [...state.buildings, building],
      sites: state.sites.map((s: Site) => 
        s.id === siteId 
          ? { ...s, buildingIds: [...s.buildingIds, building.id] }
          : s
      ),
      currentBuildingId: building.id
    }))
    
    return building
  }, [setBIMState])

  const updateBuilding = useCallback((id: string, properties: BuildingProperties) => {
    setBIMState.setState((state: any) => ({
      buildings: state.buildings.map((b: Building) => 
        b.id === id ? { ...b, ...properties } : b
      )
    }))
  }, [setBIMState])

  const deleteBuilding = useCallback((id: string) => {
    setBIMState.setState((state: any) => {
      const building = state.buildings.find((b: Building) => b.id === id)
      if (building) {
        // Delete all levels in this building
        building.levelIds.forEach((levelId: string) => {
          const level = state.levels.find((l: Level) => l.id === levelId)
          if (level) {
            level.objectIds.forEach((objId: string) => {
              state.objects = state.objects.filter((obj: any) => obj.id !== objId)
            })
          }
        })
        state.levels = state.levels.filter((l: Level) => !building.levelIds.includes(l.id))
      }
      
      return {
        buildings: state.buildings.filter((b: Building) => b.id !== id),
        sites: state.sites.map((s: Site) => ({
          ...s,
          buildingIds: s.buildingIds.filter((bid: string) => bid !== id)
        })),
        levels: state.levels,
        objects: state.objects,
        currentBuildingId: state.currentBuildingId === id ? null : state.currentBuildingId
      }
    })
  }, [setBIMState])

  const moveBuilding = useCallback((buildingId: string, targetSiteId: string) => {
    setBIMState.setState((state: any) => {
      const building = state.buildings.find((b: Building) => b.id === buildingId)
      if (!building) return state
      
      const oldSiteId = building.siteId
      
      return {
        buildings: state.buildings.map((b: Building) => 
          b.id === buildingId ? { ...b, siteId: targetSiteId } : b
        ),
        sites: state.sites.map((s: Site) => {
          if (s.id === oldSiteId) {
            return { ...s, buildingIds: s.buildingIds.filter((id: string) => id !== buildingId) }
          }
          if (s.id === targetSiteId) {
            return { ...s, buildingIds: [...s.buildingIds, buildingId] }
          }
          return s
        })
      }
    })
  }, [setBIMState])

  const setCurrentBuilding = useCallback((id: string | null) => {
    setBIMState.setState({ currentBuildingId: id })
  }, [setBIMState])

  // Level CRUD
  const createLevel = useCallback((buildingId: string, name: string, elevation: number, properties?: LevelProperties): Level => {
    // Auto-calculate level number based on elevation
    const buildingLevels = getLevelsByBuilding(buildingId)
    const levelNumber = properties?.levelNumber ?? buildingLevels.length
    
    const level: Level = {
      id: uuidv4(),
      name,
      elevation,
      height: properties?.height || 2.8,
      levelNumber,
      usageType: properties?.usageType || 'other',
      isVisible: properties?.isVisible ?? true,
      color: properties?.color || [200, 200, 200],
      buildingId,
      objectIds: [],
    }
    
    setBIMState.setState((state: any) => ({
      levels: [...state.levels, level],
      buildings: state.buildings.map((b: Building) => 
        b.id === buildingId 
          ? { ...b, levelIds: [...b.levelIds, level.id] }
          : b
      ),
      currentLevelId: level.id
    }))
    
    return level
  }, [setBIMState, getLevelsByBuilding])

  const updateLevel = useCallback((id: string, properties: LevelProperties) => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => 
        l.id === id ? { ...l, ...properties } : l
      )
    }))
  }, [setBIMState])

  const deleteLevel = useCallback((id: string) => {
    setBIMState.setState((state: any) => {
      const level = state.levels.find((l: Level) => l.id === id)
      if (level) {
        // Remove all objects in this level
        level.objectIds.forEach((objId: string) => {
          state.objects = state.objects.filter((obj: any) => obj.id !== objId)
        })
      }
      
      return {
        levels: state.levels.filter((l: Level) => l.id !== id),
        buildings: state.buildings.map((b: Building) => ({
          ...b,
          levelIds: b.levelIds.filter((lid: string) => lid !== id)
        })),
        objects: state.objects,
        currentLevelId: state.currentLevelId === id ? null : state.currentLevelId
      }
    })
  }, [setBIMState])

  const moveLevel = useCallback((levelId: string, targetBuildingId: string) => {
    setBIMState.setState((state: any) => {
      const level = state.levels.find((l: Level) => l.id === levelId)
      if (!level) return state
      
      const oldBuildingId = level.buildingId
      
      return {
        levels: state.levels.map((l: Level) => 
          l.id === levelId ? { ...l, buildingId: targetBuildingId } : l
        ),
        buildings: state.buildings.map((b: Building) => {
          if (b.id === oldBuildingId) {
            return { ...b, levelIds: b.levelIds.filter((id: string) => id !== levelId) }
          }
          if (b.id === targetBuildingId) {
            return { ...b, levelIds: [...b.levelIds, levelId] }
          }
          return b
        })
      }
    })
  }, [setBIMState])

  const copyLevel = useCallback((levelId: string, targetElevation: number, newName?: string): Level => {
    const sourceLevel = getLevelById(levelId)
    if (!sourceLevel) throw new Error(`Level ${levelId} not found`)
    
    const copiedLevel: Level = {
      id: uuidv4(),
      name: newName || `${sourceLevel.name} (Copy)`,
      elevation: targetElevation,
      height: sourceLevel.height,
      levelNumber: sourceLevel.levelNumber,
      usageType: sourceLevel.usageType,
      isVisible: true,
      color: [...sourceLevel.color],
      buildingId: sourceLevel.buildingId,
      objectIds: [], // Objects will be copied separately
    }
    
    setBIMState.setState((state: any) => ({
      levels: [...state.levels, copiedLevel],
      buildings: state.buildings.map((b: Building) => 
        b.id === sourceLevel.buildingId 
          ? { ...b, levelIds: [...b.levelIds, copiedLevel.id] }
          : b
      )
    }))
    
    // Copy objects from source level to new level
    const sourceObjects = getObjectsByLevel(levelId)
    sourceObjects.forEach((obj: any) => {
      const newObj = {
        ...obj,
        id: uuidv4(),
        position: [obj.position[0], obj.position[1], targetElevation] as [number, number, number],
        level: copiedLevel.id,
      }
      setBIMState.addObject(newObj)
      copiedLevel.objectIds.push(newObj.id)
    })
    
    return copiedLevel
  }, [getLevelById, getObjectsByLevel, setBIMState])

  const setCurrentLevel = useCallback((id: string | null) => {
    setBIMState.setState({ currentLevelId: id })
  }, [setBIMState])

  // Level operations
  const toggleLevelVisibility = useCallback((id: string) => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => 
        l.id === id ? { ...l, isVisible: !l.isVisible } : l
      )
    }))
  }, [setBIMState])

  const showAllLevels = useCallback(() => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => ({ ...l, isVisible: true }))
    }))
  }, [setBIMState])

  const hideAllLevels = useCallback(() => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => ({ ...l, isVisible: false }))
    }))
  }, [setBIMState])

  const isolateLevel = useCallback((id: string) => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => ({ ...l, isVisible: l.id === id }))
    }))
  }, [setBIMState])

  // Object-level operations
  const assignObjectToLevel = useCallback((objectId: string, levelId: string) => {
    const level = getLevelById(levelId)
    if (!level) return
    
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => 
        l.id === levelId 
          ? { ...l, objectIds: [...l.objectIds, objectId] }
          : l
      ),
      objects: state.objects.map((obj: any) => 
        obj.id === objectId 
          ? { ...obj, level: levelId, position: [obj.position[0], obj.position[1], level.elevation] }
          : obj
      )
    }))
  }, [getLevelById, setBIMState])

  const removeObjectFromLevel = useCallback((objectId: string, levelId: string) => {
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => 
        l.id === levelId 
          ? { ...l, objectIds: l.objectIds.filter((id: string) => id !== objectId) }
          : l
      )
    }))
  }, [setBIMState])

  const moveObjectToLevel = useCallback((objectId: string, fromLevelId: string, toLevelId: string) => {
    const targetLevel = getLevelById(toLevelId)
    if (!targetLevel) return
    
    setBIMState.setState((state: any) => ({
      levels: state.levels.map((l: Level) => {
        if (l.id === fromLevelId) {
          return { ...l, objectIds: l.objectIds.filter((id: string) => id !== objectId) }
        }
        if (l.id === toLevelId) {
          return { ...l, objectIds: [...l.objectIds, objectId] }
        }
        return l
      }),
      objects: state.objects.map((obj: any) => 
        obj.id === objectId 
          ? { ...obj, level: toLevelId, position: [obj.position[0], obj.position[1], targetLevel.elevation] }
          : obj
      )
    }))
  }, [getLevelById, setBIMState])

  // Validation
  const validateLevelElevation = useCallback((buildingId: string, elevation: number, excludeLevelId?: string): { valid: boolean; error?: string } => {
    const buildingLevels = getLevelsByBuilding(buildingId)
    
    for (const level of buildingLevels) {
      if (level.id === excludeLevelId) continue
      
      const levelBottom = level.elevation
      const levelTop = level.elevation + level.height
      
      // Check if elevation is within any existing level's range
      if (elevation >= levelBottom && elevation < levelTop) {
        return {
          valid: false,
          error: `Elevation ${elevation}m overlaps with level "${level.name}" (${levelBottom}m - ${levelTop}m)`
        }
      }
    }
    
    // Check if elevation is within reasonable bounds
    if (elevation < -100 || elevation > 1000) {
      return {
        valid: false,
        error: `Elevation ${elevation}m is outside reasonable range (-100m to 1000m)`
      }
    }
    
    return { valid: true }
  }, [getLevelsByBuilding])

  const checkOverlappingLevels = useCallback((buildingId: string): string[] => {
    const buildingLevels = getLevelsByBuilding(buildingId)
    const overlapping: string[] = []
    
    for (let i = 0; i < buildingLevels.length; i++) {
      for (let j = i + 1; j < buildingLevels.length; j++) {
        const levelA = buildingLevels[i]
        const levelB = buildingLevels[j]
        
        const aBottom = levelA.elevation
        const aTop = levelA.elevation + levelA.height
        const bBottom = levelB.elevation
        const bTop = levelB.elevation + levelB.height
        
        if (aBottom < bTop && aTop > bBottom) {
          overlapping.push(`${levelA.name} overlaps with ${levelB.name}`)
        }
      }
    }
    
    return overlapping
  }, [getLevelsByBuilding])

  return {
    sites,
    buildings,
    levels,
    currentSiteId,
    currentBuildingId,
    currentLevelId,
    currentSite,
    currentBuilding,
    currentLevel,
    getSiteById,
    getBuildingById,
    getLevelById,
    getBuildingsBySite,
    getLevelsByBuilding,
    getLevelsBySite,
    getSortedLevels,
    getLevelStatistics,
    getObjectsByLevel,
    createSite,
    updateSite,
    deleteSite,
    setCurrentSite,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    moveBuilding,
    setCurrentBuilding,
    createLevel,
    updateLevel,
    deleteLevel,
    moveLevel,
    copyLevel,
    setCurrentLevel,
    toggleLevelVisibility,
    showAllLevels,
    hideAllLevels,
    isolateLevel,
    assignObjectToLevel,
    removeObjectFromLevel,
    moveObjectToLevel,
    validateLevelElevation,
    checkOverlappingLevels,
  }
}
