import React, { useState, useEffect } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Typography,
  Box
} from '@mui/material'
import { materialsApi } from '../services/materialsApi'
import { useDesignStore } from '../store/useDesignStore'
import { Material, MaterialCategory } from '../types/materials'

export const MaterialSelectionDropdown: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  
  const selectedPanelId = useDesignStore(state => state.selectedPanelId)
  const updatePanelMaterial = useDesignStore(state => state.updatePanelMaterial)

  // Load materials from API
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const categoryData = await materialsApi.getMaterialsByCategory()
        setCategories(categoryData)
      } catch (error) {
        console.error('Failed to load materials:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMaterials()
  }, [])

  const handleChange = (event: SelectChangeEvent<string>) => {
    const materialId = event.target.value as string
    setSelectedMaterialId(materialId)
    
    if (selectedPanelId) {
      updatePanelMaterial(selectedPanelId, materialId)
    }
  }

  if (!selectedPanelId) {
    return (
      <Typography variant="body2" sx={{ color: '#888', fontSize: '12px' }}>
        Select a panel to assign material
      </Typography>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} sx={{ color: '#666' }} />
        <Typography variant="body2" sx={{ color: '#888', fontSize: '12px' }}>
          Loading materials...
        </Typography>
      </Box>
    )
  }

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel sx={{ color: '#aaa', fontSize: '12px' }}>Material</InputLabel>
      <Select
        value={selectedMaterialId}
        onChange={handleChange}
        label="Material"
        sx={{
          color: '#eaeaea',
          fontSize: '13px',
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: '#444'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#666'
          },
          '.MuiSvgIcon-root': {
            color: '#aaa'
          }
        }}
      >
        {categories.map(category => (
          <MenuItem key={category.id} value="" disabled sx={{ fontWeight: 600 }}>
            {category.name}
          </MenuItem>
        ))}
        {categories.flatMap(category => 
          category.materials.map(material => (
            <MenuItem key={material.id} value={material.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: material.color,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                />
                {material.name}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  )
}
