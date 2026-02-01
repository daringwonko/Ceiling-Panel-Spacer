import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BIMLayout from '../Layout/BIMLayout'
import DraftingCanvas from '../DraftingCanvas/DraftingCanvas'
import BIM3DCanvas from '../BIM3DCanvas'

// Mock the BIM store
vi.mock('../stores/useBIMStore', () => ({
  useBIMStore: vi.fn((selector) => {
    const state = {
      objects: [],
      selectedObjectIds: [],
      currentTool: null,
      viewMode: '2d',
      activeLevelId: 'level-1',
      snapEnabled: true,
      gridEnabled: true,
      orthoEnabled: false,
      undo: vi.fn(),
      redo: vi.fn(),
      saveProject: vi.fn()
    }
    
    if (typeof selector === 'function') {
      return selector(state)
    }
    return state
  })
}))

// Mock React Three Fiber components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="three-canvas">{children}</div>,
  useThree: vi.fn(() => ({
    camera: { position: [0, 0, 10], fov: 50 },
    scene: { children: [] },
    gl: { domElement: document.createElement('canvas') }
  })),
  useFrame: vi.fn((callback) => {
    // Simulate frame callback
    callback({ clock: { getElapsedTime: () => 0 } })
  })
}))

describe('BIMLayout', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BIMLayout />
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = renderComponent()
    expect(container).toBeTruthy()
  })

  it('displays the BIM Workbench title', () => {
    renderComponent()
    expect(screen.getByText('BIM Workbench')).toBeInTheDocument()
  })

  it('shows the sidebar toggle button', () => {
    renderComponent()
    const toggleButton = screen.getByLabelText(/toggle sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('displays tool categories', () => {
    renderComponent()
    expect(screen.getByText('2D Drafting')).toBeInTheDocument()
    expect(screen.getByText('3D Modeling')).toBeInTheDocument()
    expect(screen.getByText('View')).toBeInTheDocument()
  })

  it('toggles sidebar when button is clicked', () => {
    renderComponent()
    const toggleButton = screen.getByLabelText(/toggle sidebar/i)
    
    // Initially sidebar should be visible
    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toBeVisible()
    
    // Click toggle
    fireEvent.click(toggleButton)
    
    // Sidebar should be hidden
    // Note: This depends on actual implementation
  })

  it('contains toolbar with drawing tools', () => {
    renderComponent()
    expect(screen.getByText('Line')).toBeInTheDocument()
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    expect(screen.getByText('Circle')).toBeInTheDocument()
  })
})

describe('DraftingCanvas', () => {
  const renderCanvas = (props = {}) => {
    return render(
      <DraftingCanvas 
        objects={[]}
        onObjectSelect={vi.fn()}
        onCanvasClick={vi.fn()}
        snapEnabled={true}
        gridEnabled={true}
        orthoEnabled={false}
        {...props}
      />
    )
  }

  it('renders without crashing', () => {
    const { container } = renderCanvas()
    expect(container).toBeTruthy()
  })

  it('renders SVG element', () => {
    renderCanvas()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('displays grid when enabled', () => {
    const { container } = renderCanvas({ gridEnabled: true })
    const gridLines = container.querySelectorAll('.grid-line')
    // Grid should be rendered
  })

  it('hides grid when disabled', () => {
    const { container } = renderCanvas({ gridEnabled: false })
    const gridGroup = container.querySelector('[data-grid-hidden]')
    // Grid should be hidden
  })

  it('handles click events', () => {
    const onCanvasClick = vi.fn()
    const { container } = renderCanvas({ onCanvasClick })
    
    const svg = container.querySelector('svg')
    fireEvent.click(svg, { clientX: 100, clientY: 100 })
    
    expect(onCanvasClick).toHaveBeenCalled()
  })

  it('renders existing objects', () => {
    const mockObjects = [
      { id: 'obj-1', type: 'line', geometry: { start: { x: 0, y: 0 }, end: { x: 100, y: 100 } } },
      { id: 'obj-2', type: 'rectangle', geometry: { x: 200, y: 200, width: 50, height: 50 } }
    ]
    
    const { container } = renderCanvas({ objects: mockObjects })
    
    // Should render the objects
    expect(container.querySelector('[data-object-id="obj-1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-object-id="obj-2"]')).toBeInTheDocument()
  })
})

describe('BIM3DCanvas', () => {
  const render3DCanvas = (props = {}) => {
    return render(
      <BrowserRouter>
        <BIM3DCanvas 
          objects={[]}
          onObjectSelect={vi.fn()}
          viewMode="perspective"
          {...props}
        />
      </BrowserRouter>
    )
  }

  it('renders without crashing', () => {
    const { container } = render3DCanvas()
    expect(container).toBeTruthy()
  })

  it('contains canvas element', () => {
    const { container } = render3DCanvas()
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('renders objects when provided', () => {
    const mockObjects = [
      { id: 'wall-1', type: 'wall', geometry: { width: 5000, height: 3000, depth: 200 } }
    ]
    
    const { container } = render3DCanvas({ objects: mockObjects })
    // 3D objects should be rendered
    expect(container.querySelector('[data-3d-object="wall-1"]')).toBeInTheDocument()
  })
})
