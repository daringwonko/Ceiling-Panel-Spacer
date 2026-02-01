import { Outlet, NavLink } from 'react-router-dom'
import { useState, useMemo, useCallback } from 'react'
import { useBIMStore } from '../../stores/useBIMStore'
import SavageLogo from './SavageLogo'
import {
  PencilIcon, CubeIcon, BuildingIcon, DoorIcon,
  TextIcon, EditIcon, SettingsIcon, DownloadIcon
} from './icons'
import BIMHeader from './BIMHeader'
import BIMStatusBar from './BIMStatusBar'
import QuickActions from './QuickActions'
import ExportMenu from './ExportMenu'
import { BIM3DCanvas } from '../BIMWorkbench/BIM3DCanvas'
import { BIM3DObject } from '../BIMWorkbench/BIM3DObject'

// ============================================================================
// BIM TOOL CATEGORIES
// ============================================================================

const toolCategories = [
  { 
    id: '2d-drafting', 
    name: '2D Drafting', 
    tools: '2d-drafting', 
    icon: PencilIcon,
    description: 'Line, Rectangle, Circle, Arc, Polygon, Polyline, etc.'
  },
  { 
    id: '3d-modeling', 
    name: '3D Modeling', 
    tools: '3d-modeling',
    icon: CubeIcon,
    description: 'Wall, Beam, Column, Slab, etc.'
  },
  { 
    id: 'structural', 
    name: 'Structural', 
    tools: 'structural',
    icon: BuildingIcon,
    description: 'Beams, columns, footings, reinforcement'
  },
  { 
    id: 'building-elements', 
    name: 'Building Elements', 
    tools: 'building',
    icon: DoorIcon,
    description: 'Doors, Windows, Stairs, Roofs'
  },
  { 
    id: 'annotations', 
    name: 'Annotations', 
    tools: 'annotations',
    icon: TextIcon,
    description: 'Dimensions, Text, Labels, Leaders, etc.'
  },
  { 
    id: 'modify', 
    name: 'Modify', 
    tools: 'modify',
    icon: EditIcon,
    description: 'Move, Rotate, Scale, Trim, Split, etc.'
  },
  { 
    id: 'manage', 
    name: 'Manage', 
    tools: 'manage',
    icon: SettingsIcon,
    description: 'Projects, Layers, Materials, Schedules'
  },
  { 
    id: 'export', 
    name: 'Export', 
    tools: 'export',
    icon: DownloadIcon,
    description: 'IFC, DXF, SVG, JSON exports'
  },
]

// Tool catalog (100+ tools - sample for 2D and 3D)
const toolsByCategory = {
  '2d-drafting': [
    { id: 'line', name: 'Line', icon: PencilIcon, path: '/bim/tools/line' },
    { id: 'polyline', name: 'Polyline', icon: PencilIcon, path: '/bim/tools/polyline' },
    { id: 'rectangle', name: 'Rectangle', icon: PencilIcon, path: '/bim/tools/rectangle' },
    { id: 'circle', name: 'Circle', icon: PencilIcon, path: '/bim/tools/circle' },
    { id: 'ellipse', name: 'Ellipse', icon: PencilIcon, path: '/bim/tools/ellipse' },
    { id: 'arc', name: 'Arc', icon: PencilIcon, path: '/bim/tools/arc' },
    { id: 'polygon', name: 'Polygon', icon: PencilIcon, path: '/bim/tools/polygon' },
    // ... 8 more 2D tools
  ],
  '3d-modeling': [
    { id: 'wall', name: 'Wall', icon: CubeIcon, path: '/bim/3d-modeling?tool=wall' },
    { id: 'beam', name: 'Beam', icon: CubeIcon, path: '/bim/3d-modeling?tool=beam' },
    { id: 'column', name: 'Column', icon: CubeIcon, path: '/bim/3d-modeling?tool=column' },
    { id: 'slab', name: 'Slab', icon: CubeIcon, path: '/bim/3d-modeling?tool=slab' },
    // ... 31 more 3D tools
  ],
  'structural': [
    { id: 'custom-rebar', name: 'Custom Rebar', icon: BuildingIcon, path: '/bim/structural?tool=custom-rebar' },
    { id: 'column-rebar', name: 'Column Rebar', icon: BuildingIcon, path: '/bim/structural?tool=column-rebar' },
    // ... 6 more structural tools
  ],
  'building-elements': [
    { id: 'door', name: 'Door', icon: DoorIcon, path: '/bim/tools/door' },
    { id: 'window', name: 'Window', icon: DoorIcon, path: '/bim/tools/window' },
    { id: 'stairs', name: 'Stairs', icon: DoorIcon, path: '/bim/tools/stairs' },
    { id: 'roof', name: 'Roof', icon: DoorIcon, path: '/bim/building-elements?tool=roof' },
    // ... 4 more building elements
  ],
  'annotations': [
    { id: 'aligned-dimension', name: 'Aligned Dimension', icon: TextIcon, path: '/bim/annotations?tool=aligned-dimension' },
    { id: 'horizontal-dimension', name: 'Horizontal Dimension', icon: TextIcon, path: '/bim/annotations?tool=horizontal-dimension' },
    { id: 'vertical-dimension', name: 'Vertical Dimension', icon: TextIcon, path: '/bim/annotations?tool=vertical-dimension' },
    // ... 16 more annotation tools
  ],
  'modify': [
    { id: 'move', name: 'Move', icon: EditIcon, path: '/bim/modify?tool=move' },
    { id: 'rotate', name: 'Rotate', icon: EditIcon, path: '/bim/modify?tool=rotate' },
    { id: 'scale', name: 'Scale', icon: EditIcon, path: '/bim/modify?tool=scale' },
    // ... 24 more modify tools
  ],
  'manage': [
    { id: 'new-project', name: 'New Project', icon: SettingsIcon, path: '/bim/manage?tool=new-project' },
    { id: 'open-project', name: 'Open Project', icon: SettingsIcon, path: '/bim/manage?tool=open-project' },
    { id: 'save-project', name: 'Save Project', icon: SettingsIcon, path: '/bim/manage?tool=save-project' },
    { id: 'export-project', name: 'Export Project', icon: DownloadIcon, path: '/bim/manage?tool=export-project' },
    // ... 21 more manage tools
  ],
  'export': [
    { id: 'ifc-export', name: 'IFC Export', icon: DownloadIcon, path: '/bim/export?format=ifc' },
    { id: 'dxf-export', name: 'DXF Export', icon: DownloadIcon, path: '/bim/export?format=dxf' },
    { id: 'svg-export', name: 'SVG Export', icon: DownloadIcon, path: '/bim/export?format=svg' },
    { id: 'json-export', name: 'JSON Export', icon: DownloadIcon, path: '/bim/export?format=json' },
    // ... 5 more export tools
  ],
}

function ObjectPropertiesPanel({ object, onObjectUpdate }) {
  if (!object) {
    return null
  }

  const handleNameChange = (e) => {
    onObjectUpdate(object.id, { name: e.target.value })
  }

  const handlePositionChange = (axis, value) => {
    const newPosition = [...object.position]
    newPosition[axis] = parseFloat(value) || 0
    onObjectUpdate(object.id, { position: newPosition })
  }

  const handleRotationChange = (axis, value) => {
    const newRotation = [...object.rotation]
    newRotation[axis] = parseFloat(value) || 0
    onObjectUpdate(object.id, { rotation: newRotation })
  }

  const handleScaleChange = (axis, value) => {
    const newScale = [...object.scale]
    newScale[axis] = parseFloat(value) || 1
    onObjectUpdate(object.id, { scale: newScale })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-savage-text-muted mb-1">Name</label>
        <input
          type="text"
          value={object.name}
          onChange={handleNameChange}
          className="w-full px-3 py-2 bg-savage-dark border border-slate-600 rounded text-savage-text text-sm focus:outline-none focus:border-savage-primary"
        />
      </div>

      <div>
        <label className="block text-xs text-savage-text-muted mb-1">Type</label>
        <div className="px-3 py-2 bg-savage-dark border border-slate-600 rounded text-savage-text text-sm">
          {object.type}
        </div>
      </div>

      <div>
        <label className="block text-xs text-savage-text-muted mb-1">ID</label>
        <div className="px-3 py-2 bg-savage-dark border border-slate-600 rounded text-savage-text-muted text-xs font-mono">
          {object.id.slice(0, 8)}...
        </div>
      </div>

      <div>
        <label className="block text-xs text-savage-text-muted mb-2">Position (X, Y, Z)</label>
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="flex items-center gap-2">
              <span className="w-4 text-xs text-savage-text-muted">{axis}</span>
              <input
                type="number"
                value={object.position[i] || 0}
                onChange={(e) => handlePositionChange(i, e.target.value)}
                className="w-full px-2 py-1 bg-savage-dark border border-slate-600 rounded text-savage-text text-xs focus:outline-none focus:border-savage-primary"
                step="10"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-savage-text-muted mb-2">Rotation (X, Y, Z)</label>
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="flex items-center gap-2">
              <span className="w-4 text-xs text-savage-text-muted">{axis}</span>
              <input
                type="number"
                value={object.rotation[i] || 0}
                onChange={(e) => handleRotationChange(i, e.target.value)}
                className="w-full px-2 py-1 bg-savage-dark border border-slate-600 rounded text-savage-text text-xs focus:outline-none focus:border-savage-primary"
                step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-savage-text-muted mb-2">Scale (X, Y, Z)</label>
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} className="flex items-center gap-2">
              <span className="w-4 text-xs text-savage-text-muted">{axis}</span>
              <input
                type="number"
                value={object.scale[i] || 1}
                onChange={(e) => handleScaleChange(i, e.target.value)}
                className="w-full px-2 py-1 bg-savage-dark border border-slate-600 rounded text-savage-text text-xs focus:outline-none focus:border-savage-primary"
                step="0.1"
                min="0.1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function convertStoreObjectsToBIM3DObjects(storeObjects) {
  return storeObjects.map(obj => {
    const object = new BIM3DObject({
      id: obj.id,
      name: obj.name,
      ifcType: `Ifc${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`,
      material: obj.material,
      level: obj.level,
      properties: obj.properties,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    })

    object.position.set(...obj.position)
    object.rotation.set(...obj.rotation)
    object.scale.set(...obj.scale)

    if (obj.isSelected) {
      object.select()
    }

    return object
  })
}

export default function BIMLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState('2d-drafting')
  const [searchQuery, setSearchQuery] = useState('')
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true)

  const {
    setActiveTool,
    objects,
    selectedObjectIds,
    selectObject,
    deselectAll,
    updateObject,
    undo,
    redo,
    project,
    saveProject,
    createProject,
    view,
    setViewMode,
  } = useBIMStore()

  const bimObjects = useMemo(() => convertStoreObjectsToBIM3DObjects(objects), [objects])

  const selectedObject = useMemo(() => {
    if (selectedObjectIds.length === 1) {
      return objects.find(obj => obj.id === selectedObjectIds[0]) || null
    }
    return null
  }, [objects, selectedObjectIds])

  const handleObjectUpdate = useCallback((id, updates) => {
    updateObject(id, updates)
  }, [updateObject])

  const handleObjectSelect = useCallback((id, multi) => {
    selectObject(id, multi)
  }, [selectObject])

  const handleObjectDeselect = useCallback((id) => {
  }, [])

  const handleCanvasClick = useCallback((point) => {
    deselectAll()
  }, [deselectAll])

  const filteredTools = toolsByCategory[activeCategory]?.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen flex bg-savage-dark">
      {/* Savage Cabinetry Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-savage-surface border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        {/* Savage Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <SavageLogo size="sm" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-savage-primary">Savage Cabinetry</span>
                <span className="text-xs text-savage-text-muted">BIM Workbench</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-700 text-savage-text"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 6M6 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 6H4 6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4 6H20 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Tool Search */}
        {sidebarOpen && (
          <div className="p-3">
            <input
              type="text"
              placeholder="Search 100+ tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input bg-savage-surface border-slate-600 focus:ring-2 focus:ring-savage-primary"
              autoFocus
            />
          </div>
        )}

        {/* Tool Categories */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin">
          {sidebarOpen && (
            <div className="p-3">
              {/* Category Tabs */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-2 border-b border-slate-700">
                {toolCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.tools)}
                    className={`btn btn-sm whitespace-nowrap ${
                      activeCategory === category.tools ? 'btn-primary' : 'btn-outline'
                    }`}
                    aria-label={category.name}
                  >
                    <category.icon className="w-4 h-4 inline mr-2" />
                    {sidebarOpen && <span>{category.name}</span>}
                  </button>
                ))}
              </div>

              {/* Tool List */}
              <div className="space-y-1">
                {filteredTools.map(tool => (
                  <NavLink
                    key={tool.id}
                    to={tool.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-savage-primary text-white hover:bg-savage-primary-hover'
                          : 'text-savage-text-muted hover:bg-savage-surface hover:text-savage-primary'
                      }`
                    }>
                    <tool.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="truncate text-sm">{tool.name}</span>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Quick Actions */}
              {sidebarOpen && (
                <>
                  <QuickActions
                    onNewProject={() => createProject('New BIM Project')}
                    onSave={saveProject}
                    projectModified={true}
                  />
                  <div className="p-4 border-t border-slate-700">
                    <ExportMenu />
                  </div>
                </>
              )}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <BIMHeader
          onUndo={undo}
          onRedo={redo}
          canUndo={false}
          canRedo={false}
          viewMode="perspective"
          onViewModeChange={(mode) => console.log('View mode:', mode)}
          projectName={project?.name || 'Untitled Project'}
        />
        <div className="flex-1 overflow-hidden relative flex">
          <div className="flex-1 relative">
            <BIM3DCanvas
              objects={bimObjects}
              selectedIds={selectedObjectIds}
              backgroundColor="#1a1a1a"
              gridSize={view.grid.size}
              gridDivisions={100}
              showGrid={view.grid.enabled}
              cameraPosition={view.camera.position}
              cameraTarget={view.camera.target}
              onObjectSelect={handleObjectSelect}
              onObjectDeselect={handleObjectDeselect}
              onCanvasClick={handleCanvasClick}
              onObjectHover={(id) => {}}
            />
          </div>
          {propertiesPanelOpen && (
            <aside className="w-72 bg-savage-surface border-l border-slate-700 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between h-12 px-4 border-b border-slate-700 bg-savage-dark">
                <span className="text-sm font-semibold text-savage-text">Properties</span>
                <button
                  onClick={() => setPropertiesPanelOpen(false)}
                  className="p-1 rounded hover:bg-slate-700 text-savage-text-muted"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {selectedObject ? (
                  <ObjectPropertiesPanel
                    object={selectedObject}
                    onObjectUpdate={handleObjectUpdate}
                  />
                ) : (
                  <div className="text-center text-savage-text-muted text-sm py-8">
                    Select an object to view and edit its properties
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
        <BIMStatusBar
          activeTool="Select"
          coordinates={{ x: 0, y: 0, z: 0 }}
          zoom={1}
          snapEnabled={true}
          snapToGrid={false}
          snapToObjects={true}
        />
      </main>
    </div>
  )
}
