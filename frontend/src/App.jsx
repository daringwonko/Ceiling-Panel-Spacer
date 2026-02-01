import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Original components (keep for backward compatibility)
import Layout from './components/Layout/Layout'
import Dashboard from './components/Dashboard'
import Calculator from './components/Calculator/Calculator'
import Projects from './components/Projects/Projects'
import ProjectDetail from './components/Projects/ProjectDetail'
import Visualization from './components/Visualization/Visualization'
import Monitoring from './components/Monitoring/Monitoring'
import Materials from './components/Materials'
import Exports from './components/Exports'
import Arch3DEditor from './components/Arch3DEditor'

// BIM Workbench components (new - Phase 6)
import BIMLayout from './components/Layout/BIMLayout'
import TestComponents from './components/bim/TestComponents'
import { StructuralObjectsDemo } from './bim'

// Placeholder routes (will be implemented in subsequent plans)
// const DraftingCanvas = () => <div className="p-4 card">2D Drafting Canvas - Coming Soon</div>
// const ModelingCanvas = () => <div className="p-4 card">3D Modeling Canvas - Coming Soon</div>
// const AnnotationsPanel = () => <div className="p-4 card">Annotations Panel - Coming Soon</div>
// const LayersPanel = () => <div className="p-4 card">Layers Panel - Coming Soon</div>
// const BIMMaterialsPanel = () => <div className="p-4 card">BIM Materials - Coming Soon</div>
// const SectionsPanel = () => <div className="p-4 card">Sections Panel - Coming Soon</div>
// const PropertiesPanel = () => <div className="p-4 card">Properties Panel - Coming Soon</div>
// const BIMExport = () => <div className="p-4 card">BIM Export - Coming Soon</div>
// const BIMSchedules = () => <div className="p-4 card">Schedules - Coming Soon</div>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* BIM Workbench Routes */}
        <Route path="/bim" element={<BIMLayout />} />
        <Route path="/bim/test-components" element={<TestComponents />} />
        <Route path="/bim/structural-demo" element={<StructuralObjectsDemo />} />
        
        {/* Original routes (keep for backward compatibility) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="visualization" element={<Visualization />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="materials" element={<Materials />} />
          <Route path="exports" element={<Exports />} />
          <Route path="3d-editor" element={<Arch3DEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
