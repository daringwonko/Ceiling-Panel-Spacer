import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MaterialSelectionDropdown } from './MaterialSelectionDropdown'
import { materialsApi } from '../services/materialsApi'
import { useDesignStore } from '../store/useDesignStore'

// Mock the services and store
jest.mock('../services/materialsApi')
jest.mock('../store/useDesignStore')

const mockedMaterialsApi = materialsApi as jest.Mocked<typeof materialsApi>
const mockedUseDesignStore = useDesignStore as jest.MockedFunction<typeof useDesignStore>

const mockMaterials = [
  { id: 'led_panel_white', name: 'LED Panel (White)', category: 'lighting', color: '#FFFFFF', reflectivity: 0.85, costPerSqm: 450, notes: 'Integrated LED' },
  { id: 'acoustic_white', name: 'Acoustic Panel (White)', category: 'acoustic', color: '#F5F5F5', reflectivity: 0.70, costPerSqm: 35, notes: 'Sound absorbing' }
]

describe('MaterialSelectionDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockedMaterialsApi.getMaterialsByCategory.mockResolvedValue([
      { id: 'lighting', name: 'Lighting', materials: [mockMaterials[0]] },
      { id: 'acoustic', name: 'Acoustic', materials: [mockMaterials[1]] }
    ])
    
    mockedUseDesignStore.mockReturnValue({
      selectedPanelId: 'test-panel-1',
      updatePanelMaterial: jest.fn()
    } as any)
  })

  it('renders without crashing', async () => {
    render(<MaterialSelectionDropdown />)
    expect(screen.getByText('Select Material')).toBeInTheDocument()
  })

  it('loads materials from API on mount', async () => {
    render(<MaterialSelectionDropdown />)
    
    await waitFor(() => {
      expect(mockedMaterialsApi.getMaterialsByCategory).toHaveBeenCalledTimes(1)
    })
  })

  it('shows materials when dropdown is opened', async () => {
    const user = userEvent.setup()
    render(<MaterialSelectionDropdown />)
    
    // Wait for materials to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Open the dropdown
    await user.click(screen.getByRole('combobox'))
    
    // Check if materials are displayed
    await waitFor(() => {
      expect(screen.getByText('LED Panel (White)')).toBeInTheDocument()
      expect(screen.getByText('Acoustic Panel (White)')).toBeInTheDocument()
    })
  })

  it('calls updatePanelMaterial when material is selected', async () => {
    const updateMaterialMock = jest.fn()
    mockedUseDesignStore.mockReturnValue({
      selectedPanelId: 'test-panel-1',
      updatePanelMaterial: updateMaterialMock
    } as any)

    const user = userEvent.setup()
    render(<MaterialSelectionDropdown />)
    
    // Wait for load and open dropdown
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('combobox'))
    
    // Select a material
    await user.click(screen.getByText('LED Panel (White)'))
    
    // Verify update was called
    expect(updateMaterialMock).toHaveBeenCalledWith('test-panel-1', 'led_panel_white')
  })

  it('displays selected material name', async () => {
    const user = userEvent.setup()
    render(<MaterialSelectionDropdown />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('LED Panel (White)'))
    
    expect(screen.getByRole('combobox')).toHaveValue('LED Panel (White)')
  })
})
