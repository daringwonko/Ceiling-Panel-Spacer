import * as React from "react"
import { useState, useCallback, useMemo } from "react"
import { 
  Plus, Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown, 
  Building2, MapPin, Layers, Settings2, MoreVertical, Filter
} from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import { useLevels } from "../../hooks/useLevels"
import { LevelListItem } from "./LevelListItem"
import { LevelProperties } from "./LevelProperties"
import { formatElevation, generateLevelName, rgbToHex, hexToRgb } from "../../utils/levelUtils"
import type { Level, LevelProperties as LevelPropertiesType } from "../../types/level"

interface LevelPanelProps {
  className?: string
  onClose?: () => void
}

export function LevelPanel({ className, onClose }: LevelPanelProps) {
  const {
    sites,
    buildings,
    levels,
    currentSiteId,
    currentBuildingId,
    currentLevelId,
    currentSite,
    currentBuilding,
    currentLevel,
    getBuildingsBySite,
    getLevelsByBuilding,
    getSortedLevels,
    getLevelStatistics,
    createSite,
    createBuilding,
    createLevel,
    deleteLevel,
    copyLevel,
    setCurrentSite,
    setCurrentBuilding,
    setCurrentLevel,
    updateLevel,
    toggleLevelVisibility,
    showAllLevels,
    hideAllLevels,
    isolateLevel,
    validateLevelElevation,
  } = useLevels()

  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)
  const [showProperties, setShowProperties] = useState(false)
  const [filterText, setFilterText] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Get current hierarchy data
  const currentBuildings = useMemo(() => 
    currentSiteId ? getBuildingsBySite(currentSiteId) : [],
    [currentSiteId, getBuildingsBySite]
  )

  const currentLevels = useMemo(() => 
    currentBuildingId ? getSortedLevels(currentBuildingId) : [],
    [currentBuildingId, getSortedLevels]
  )

  const filteredLevels = useMemo(() => 
    currentLevels.filter(level => 
      level.name.toLowerCase().includes(filterText.toLowerCase())
    ),
    [currentLevels, filterText]
  )

  // Handlers
  const handleAddSite = useCallback(() => {
    const name = prompt("Enter site name:", "New Site")
    if (name) {
      createSite(name, { 
        description: "",
        elevation: 0 
      })
    }
  }, [createSite])

  const handleAddBuilding = useCallback(() => {
    if (!currentSiteId) {
      setError("Please select a site first")
      return
    }
    const name = prompt("Enter building name:", "New Building")
    if (name) {
      createBuilding(currentSiteId, name, { buildingType: 'other' })
    }
  }, [currentSiteId, createBuilding])

  const handleAddLevel = useCallback(() => {
    if (!currentBuildingId) {
      setError("Please select a building first")
      return
    }
    
    const buildingLevels = getLevelsByBuilding(currentBuildingId)
    const nextElevation = buildingLevels.length > 0
      ? Math.max(...buildingLevels.map(l => l.elevation + l.height))
      : 0
    const nextLevelNumber = buildingLevels.length
    
    const name = prompt("Enter level name:", generateLevelName(nextLevelNumber))
    if (name) {
      const validation = validateLevelElevation(currentBuildingId, nextElevation)
      if (!validation.valid) {
        setError(validation.error || "Invalid elevation")
        return
      }
      
      createLevel(currentBuildingId, name, nextElevation, {
        levelNumber: nextLevelNumber,
        height: 2.8,
        usageType: 'other',
      })
      setError(null)
    }
  }, [currentBuildingId, createLevel, getLevelsByBuilding, validateLevelElevation])

  const handleDeleteLevel = useCallback((levelId: string) => {
    const level = levels.find(l => l.id === levelId)
    if (!level) return
    
    const stats = getLevelStatistics(levelId)
    const confirmMsg = stats.objectCount > 0
      ? `Delete level "${level.name}" and its ${stats.objectCount} objects?`
      : `Delete level "${level.name}"?`
    
    if (confirm(confirmMsg)) {
      deleteLevel(levelId)
      if (selectedLevelId === levelId) {
        setSelectedLevelId(null)
        setShowProperties(false)
      }
    }
  }, [levels, deleteLevel, getLevelStatistics, selectedLevelId])

  const handleCopyLevel = useCallback((levelId: string) => {
    const level = levels.find(l => l.id === levelId)
    if (!level) return
    
    const newElevation = level.elevation + level.height + 0.1
    const validation = validateLevelElevation(level.buildingId, newElevation, levelId)
    
    if (!validation.valid) {
      setError(validation.error || "Cannot copy level: elevation conflict")
      return
    }
    
    copyLevel(levelId, newElevation, `${level.name} (Copy)`)
    setError(null)
  }, [levels, copyLevel, validateLevelElevation])

  const handleLevelClick = useCallback((level: Level) => {
    setCurrentLevel(level.id)
    setSelectedLevelId(level.id)
    setShowProperties(true)
  }, [setCurrentLevel])

  const handleUpdateLevel = useCallback((levelId: string, properties: LevelPropertiesType) => {
    if (properties.elevation !== undefined) {
      const validation = validateLevelElevation(
        currentBuildingId || '',
        properties.elevation,
        levelId
      )
      if (!validation.valid) {
        setError(validation.error || "Invalid elevation")
        return
      }
    }
    
    updateLevel(levelId, properties)
    setError(null)
  }, [updateLevel, validateLevelElevation, currentBuildingId])

  // Render helpers
  const renderHierarchySelector = () => (
    <div className="space-y-2 p-3 border-b border-slate-700 bg-slate-800/50">
      {/* Site Selector */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Select
          value={currentSiteId || ""}
          onValueChange={(value) => {
            setCurrentSite(value || null)
            setCurrentBuilding(null)
            setCurrentLevel(null)
          }}
          placeholder="Select Site..."
          className="flex-1"
        >
          {sites.map(site => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          onClick={handleAddSite}
          title="Add Site"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Building Selector */}
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Select
          value={currentBuildingId || ""}
          onValueChange={(value) => {
            setCurrentBuilding(value || null)
            setCurrentLevel(null)
          }}
          placeholder="Select Building..."
          className="flex-1"
          disabled={!currentSiteId}
        >
          {currentBuildings.map(building => (
            <option key={building.id} value={building.id}>{building.name}</option>
          ))}
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7"
          onClick={handleAddBuilding}
          disabled={!currentSiteId}
          title="Add Building"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  const renderLevelList = () => (
    <div className="flex-1 overflow-y-auto">
      {currentLevels.length === 0 ? (
        <div className="p-4 text-center text-slate-500">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No levels in this building</p>
          <p className="text-xs mt-1">Click + to add a level</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {filteredLevels.map((level) => (
            <LevelListItem
              key={level.id}
              level={level}
              isSelected={selectedLevelId === level.id}
              isCurrent={currentLevelId === level.id}
              onClick={() => handleLevelClick(level)}
              onToggleVisibility={() => toggleLevelVisibility(level.id)}
              onDelete={() => handleDeleteLevel(level.id)}
              onCopy={() => handleCopyLevel(level.id)}
              statistics={getLevelStatistics(level.id)}
            />
          ))}
        </div>
      )}
    </div>
  )

  const renderToolbar = () => (
    <div className="p-2 border-t border-slate-700 bg-slate-800/50 space-y-2">
      {/* Filter */}
      <div className="relative">
        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter levels..."
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleAddLevel}
          disabled={!currentBuildingId}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Level
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={showAllLevels}
          title="Show All"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={hideAllLevels}
          title="Hide All"
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  )

  return (
    <div className={cn("flex flex-col h-full bg-slate-900 border-l border-slate-700", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-savage-primary" />
          <span className="font-semibold text-savage-text">Level Manager</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => setShowProperties(!showProperties)}
            className={cn("w-7 h-7", showProperties && "bg-slate-700")}
            title="Toggle Properties"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Level List */}
        <div className="flex flex-col w-64 border-r border-slate-700">
          {renderHierarchySelector()}
          {renderLevelList()}
          {renderToolbar()}
        </div>

        {/* Properties Panel */}
        {showProperties && selectedLevelId && (
          <div className="flex-1 overflow-y-auto">
            <LevelProperties
              levelId={selectedLevelId}
              onUpdate={handleUpdateLevel}
              onClose={() => setShowProperties(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
