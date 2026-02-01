import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { X, Box, Ruler, Palette, Tag, Info, AlertTriangle } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import { useLevels } from "../../hooks/useLevels"
import { 
  formatElevation, 
  rgbToHex, 
  hexToRgb, 
  validateElevation, 
  validateHeight,
  generateLevelName 
} from "../../utils/levelUtils"
import type { LevelProperties as LevelPropertiesType, LevelStatistics } from "../../types/level"

interface LevelPropertiesProps {
  levelId: string
  onUpdate: (levelId: string, properties: LevelPropertiesType) => void
  onClose: () => void
}

const USAGE_TYPES = [
  { value: 'living', label: 'Living Space' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'utility', label: 'Utility' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
]

export function LevelProperties({ levelId, onUpdate, onClose }: LevelPropertiesProps) {
  const { 
    getLevelById, 
    getLevelStatistics, 
    validateLevelElevation,
    getLevelsByBuilding 
  } = useLevels()
  
  const level = getLevelById(levelId)
  const statistics = getLevelStatistics(levelId)
  
  const [formData, setFormData] = useState<{
    name: string
    elevation: string
    height: string
    levelNumber: string
    usageType: string
    color: string
    isVisible: boolean
  }>({
    name: '',
    elevation: '0',
    height: '2.8',
    levelNumber: '0',
    usageType: 'other',
    color: '#c8c8c8',
    isVisible: true,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data from level
  useEffect(() => {
    if (level) {
      setFormData({
        name: level.name,
        elevation: level.elevation.toString(),
        height: level.height.toString(),
        levelNumber: level.levelNumber.toString(),
        usageType: level.usageType,
        color: rgbToHex(level.color),
        isVisible: level.isVisible,
      })
      setHasChanges(false)
      setErrors({})
    }
  }, [level?.id])

  if (!level) return null

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    // Validate elevation
    const elevationNum = parseFloat(formData.elevation)
    const elevationValidation = validateElevation(elevationNum)
    if (!elevationValidation.valid) {
      newErrors.elevation = elevationValidation.error || 'Invalid elevation'
    } else {
      // Check for overlapping levels
      const overlapValidation = validateLevelElevation(level.buildingId, elevationNum, levelId)
      if (!overlapValidation.valid) {
        newErrors.elevation = overlapValidation.error || 'Elevation conflict'
      }
    }
    
    // Validate height
    const heightNum = parseFloat(formData.height)
    const heightValidation = validateHeight(heightNum)
    if (!heightValidation.valid) {
      newErrors.height = heightValidation.error || 'Invalid height'
    }
    
    // Validate level number
    const levelNum = parseInt(formData.levelNumber)
    if (isNaN(levelNum)) {
      newErrors.levelNumber = 'Level number must be a valid integer'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, level?.buildingId, levelId, validateLevelElevation])

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const handleSave = useCallback(() => {
    if (!validateForm()) return
    
    const properties: LevelPropertiesType = {
      name: formData.name,
      elevation: parseFloat(formData.elevation),
      height: parseFloat(formData.height),
      levelNumber: parseInt(formData.levelNumber),
      usageType: formData.usageType as any,
      color: hexToRgb(formData.color),
      isVisible: formData.isVisible,
    }
    
    onUpdate(levelId, properties)
    setHasChanges(false)
  }, [formData, levelId, onUpdate, validateForm])

  const handleAutoName = useCallback(() => {
    const levelNum = parseInt(formData.levelNumber)
    if (!isNaN(levelNum)) {
      handleChange('name', generateLevelName(levelNum))
    }
  }, [formData.levelNumber, handleChange])

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-savage-primary" />
          <h3 className="font-semibold text-savage-text">Level Properties</h3>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Statistics */}
      <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase">Statistics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-slate-500">Objects</span>
            <p className="text-lg font-semibold text-savage-text">{statistics.objectCount}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Total Area</span>
            <p className="text-lg font-semibold text-savage-text">
              {statistics.totalArea > 0 ? `${statistics.totalArea.toFixed(1)} m²` : '-'}
            </p>
          </div>
        </div>
        {statistics.bounds && (
          <div className="text-xs text-slate-500">
            Bounds: {statistics.bounds.maxX - statistics.bounds.minX:.1f}m × {statistics.bounds.maxY - statistics.bounds.minY:.1f}m
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Name
          </label>
          <div className="flex gap-2">
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Level name"
              className={cn(errors.name && "border-red-500")}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoName}
              title="Auto-generate from level number"
            >
              Auto
            </Button>
          </div>
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Elevation & Height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              Elevation (m)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.elevation}
              onChange={(e) => handleChange('elevation', e.target.value)}
              className={cn(errors.elevation && "border-red-500")}
            />
            {errors.elevation && (
              <p className="text-xs text-red-400">{errors.elevation}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              Height (m)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              className={cn(errors.height && "border-red-500")}
            />
            {errors.height && (
              <p className="text-xs text-red-400">{errors.height}</p>
            )}
          </div>
        </div>

        {/* Level Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Level Number</label>
          <Input
            type="number"
            value={formData.levelNumber}
            onChange={(e) => handleChange('levelNumber', e.target.value)}
            placeholder="0 = Ground, -1 = Basement, 1 = First Floor"
            className={cn(errors.levelNumber && "border-red-500")}
          />
          {errors.levelNumber && (
            <p className="text-xs text-red-400">{errors.levelNumber}</p>
          )}
          <p className="text-xs text-slate-500">
            0 = Ground Floor, -1 = Basement 1, 1 = First Floor
          </p>
        </div>

        {/* Usage Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Usage Type</label>
          <Select
            value={formData.usageType}
            onValueChange={(value) => handleChange('usageType', value)}
          >
            {USAGE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Display Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <Input
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#RRGGBB"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-savage-text">Visible in Views</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVisible}
              onChange={(e) => handleChange('isVisible', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-savage-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-savage-primary"></div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Apply Changes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (level) {
              setFormData({
                name: level.name,
                elevation: level.elevation.toString(),
                height: level.height.toString(),
                levelNumber: level.levelNumber.toString(),
                usageType: level.usageType,
                color: rgbToHex(level.color),
                isVisible: level.isVisible,
              })
            }
            setHasChanges(false)
            setErrors({})
          }}
          disabled={!hasChanges}
        >
          Reset
        </Button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          Changes to elevation will affect all objects on this level. Objects will maintain their relative positions.
        </p>
      </div>
    </div>
  )
}
