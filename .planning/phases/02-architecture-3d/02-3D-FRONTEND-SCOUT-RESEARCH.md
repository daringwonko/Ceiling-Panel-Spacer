# Phase 2: 3D Frontend Research (Scout Report)
**Generated:** January 31, 2026  
**Scout:** Backup Scout (Activated due to main timeout)  
**Purpose:** Redundant research for Ceiling Panel Spacer 3D interface  

---

## Executive Summary

Research confirms React + Three.js + Material-UI as optimal stack for Phase 2 architectural visualization. Core findings support immediate prototyping with focus on component-based 3D interaction patterns.

### Key Recommendations
1. **Use React Three Fiber** - Declarative Three.js wrapper
2. **Material-UI v5+** - Component library with 3D integration support  
3. **Component-first architecture** - Modular, testable 3D interface
4. **Start with @react-three/cannon** - Physics-ready for panel interaction

---

## 1. React App Structure Research

### Core Concepts (From React Docs)

**Component Hierarchy Pattern:**
```
App (State Manager)
├── 3DViewport (Three.js Canvas)
│   ├── CeilingMesh (Geometry)
│   ├── PanelGroup (Instanced meshes)
│   └── Controls (Orbit/Pan)
├── UIControlPanel (Material-UI)
│   ├── ParameterSliders
│   ├── ViewModeSelector
│   └── ExportButtons
└── StatusBar (Real-time feedback)
```

**Data Flow:**
- **Unidirectional:** State ↓ Components → UI
- **Inverse flow:** User actions ↑ Callbacks → State updates
- **State management:** useState/useReducer for 3D viewport, Context API for global app state

**Key Patterns:**
1. **Break UI into hierarchical components** - Ceiling panels, controls, layouts
2. **Build static version first** - Render without interactivity
3. **Add state minimally** - Only changing data (camera position, panel selection, parameters)
4. **Use props for parent-child communication** - 3D scene parameters, UI state

### State Design for 3D App

```typescript
interface AppState {
  ceiling: {
    dimensions: {width: number, length: number, height: number}
    gaps: {edge: number, spacing: number}
  }
  panels: LayoutResult[] // Pre-calculated layouts
  viewport: {
    camera: {position: Vector3, target: Vector3}
    selectedPanel: number | null
    showWires: boolean
  }
  ui: {
    activeTab: 'dimensions' | 'materials' | 'export'
    isCalculating: boolean
  }
}
```

---

## 2. Three.js Integration Patterns

### React Integration Options

**Option A: React Three Fiber (R3F) - RECOMMENDED**
```bash
npm install @react-three/fiber @react-three/drei
```
- Declarative syntax: `<Canvas><mesh>...</mesh></Canvas>`
- React hooks for 3D state management
- Built-in performance optimizations
- Active community, TypeScript support

**Option B: Raw Three.js with React**
```jsx
// Manual integration - more complex
useEffect(() => {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer();
  // ... manual setup
}, []);
```

**Option C: R3F with Cannon.js Physics**
```bash
npm install @react-three/cannon
```
- Physics-ready for panel placement simulation
- Collision detection for realistic layouts
- Force-based panel arrangement

### Core 3D Architecture Pattern

**Scene Structure:**
```
Canvas (@react-three/fiber)
├── Lighting (Ambient + Directional)
├── GridHelper (Construction reference)
├── CeilingPlane (Transparent geometry)
├── PanelInstances (@react-three/drei instancing)
│   ├── PanelMesh (Basic geometry)
│   └── PanelMaterial (Lambert/Phong)
└── Controls (@react-three/drei OrbitControls)
```

**Component Patterns:**
1. **Geometry Components** - Pure 3D objects (planes, boxes, custom shapes)
2. **Material Components** - Textures, colors, shaders  
3. **Controller Components** - Camera, interaction controls
4. **Effect Components** - Post-processing (bloom, outlines)

### Performance Patterns

**Instancing for Multiple Panels:**
```jsx
// Use InstancedMesh for 100+ ceiling panels
<instancedMesh args={[geometry, material, panelCount]}>
  {panels.map((panel, i) => (
    <PanelInstance key={i} panel={panel} instanceMatrix={matrices[i]} />
  ))}
</instancedMesh>
```

**LOD (Level of Detail):**
- Low poly for distant panels
- High detail for selected/near panels
- Progressive loading by zoom level

---

## 3. Component Library Research - Material-UI

### Why Material-UI (MUI)

** Strengths:**
- **Production Ready** - Largest React UI library, 2,500+ contributors
- **Material Design** - Architectural/construction industry standard
- **Extensible** - Theming system for custom design systems
- **TypeScript First** - Full type safety for complex 3D app
- **Component Ecosystem** - 70+ components including 3D-friendly controls

### Recommended Components for 3D App

**Layout & Navigation:**
- **AppBar/Drawer** - Side panel for parameters
- **Tabs** - Switch between dimension/material/export views  
- **Grid** - Responsive control panel layout

**Form Controls:**
- **Slider** - Panel spacing, ceiling height adjustments
- **Select** - Material selection, view modes
- **TextField** - Dimension input with validation

**Feedback:**
- **CircularProgress** - Loading states for calculation
- **Snackbar** - Error messages, success notifications
- **Alert** - Validation feedback

**Data Display:**
- **Card** - Panel specification cards
- **Table** - Material cost breakdowns
- **List** - Layout options with previews

### Integration Pattern

**Styled Components approach:**
```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Slider, Button } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // Construction blue
    secondary: { main: '#dc004e' },
  },
});

function ControlPanel() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 2 }}>
        <Slider value={ceilingHeight} onChange={handleHeight} />
        <Button variant="contained">Calculate Layout</Button>
      </Box>
    </ThemeProvider>
  );
}
```

---

## 4. Integration Architecture Pattern

### Recommended Tech Stack

```json
{
  "frontend": {
    "framework": "React 18+",
    "3d": "@react-three/fiber + drei",
    "physics": "@react-three/cannon", 
    "ui": "@mui/material v6+",
    "state": "Zustand/Redux Toolkit",
    "build": "Vite"
  }
}
```

### Component Architecture

**File Structure:**
```
src/
├── components/
│   ├── 3d/
│   │   ├── CeilingPanel3D.tsx     # 3D viewport wrapper
│   │   ├── PanelGeometry.tsx      # Panel mesh component
│   │   └── SceneControls.tsx      # Camera/zoom controls
│   └── ui/
│       ├── ControlPanel.tsx       # Material-UI form controls
│       ├── LayoutPreview.tsx      # 2D/3D toggle
│       └── ExportDialog.tsx       # Material export modal
├── hooks/
│   ├── useLayoutCalculation.ts    # Backend integration
│   └── use3DViewport.ts          # 3D scene management
├── stores/
│   └── projectStore.ts           # Global app state
└── types/
    └── panel.types.ts            # TypeScript definitions
```

### Data Flow Pattern

**React Pattern Application:**
```
1. User changes dimensions in MUI TextField
2. ControlPanel callback → useLayoutCalculation hook  
3. Hook calls backend API → receives panel coordinates
4. Zustand store updates with new panels array
5. CeilingPanel3D subscribes to store → re-renders Three.js scene
6. InstancedMesh updates positions/color automatically
```

---

## 5. Implementation Roadmap

### Phase 2A: Core 3D Prototype (Week 4)
- [ ] Install React Three Fiber + MUI
- [ ] Create basic Canvas with ceiling plane
- [ ] Add Material-UI control panel skeleton
- [ ] Implement OrbitControls for camera

### Phase 2B: Panel Visualization (Week 5)  
- [ ] Add panel geometry generation from calculator data
- [ ] Implement instancing for performance
- [ ] Connect control panel to 3D viewport state
- [ ] Add panel selection/highlighting

### Phase 2C: Interaction Enhancement (Week 6)
- [ ] Physics integration for panel placement preview
- [ ] Drag/drop interaction for manual adjustments
- [ ] Real-time dimension updates from sliders
- [ ] Export to GLTF/OBJ formats

### Phase 2D: Polish & User Testing (Week 7)
- [ ] Performance optimization (LOD, culling)
- [ ] Mobile responsive design
- [ ] Accessibility features (keyboard navigation)
- [ ] Integration testing with backend calculator

---

## 6. Risk Assessment & Mitigations

### Technical Risks
1. **Performance** - Large panel counts causing frame drops
   - **Mitigation:** Instanced meshes + LOD system

2. **Browser Compatibility** - WebGL support issues  
   - **Mitigation:** Fallback to static 2D views + user warnings

3. **Memory Usage** - Complex geometries consuming RAM
   - **Mitigation:** Buffer geometry pooling + progressive loading

### Integration Risks  
1. **State Synchronization** - 3D view not reflecting calculation changes
   - **Mitigation:** Single source of truth store pattern

2. **API Latency** - Slow calculation blocking UI
   - **Mitigation:** Optimistic updates + loading states

---

## 7. Recommended Next Steps

1. **Immediate (Today):** Install dependencies and create skeleton app
2. **Short-term (This Week):** Basic 3D viewport with MUI controls  
3. **Medium-term (Next Week):** Connect to existing calculator API
4. **Long-term (Phase 2):** Full interactive prototyping

### Dependencies to Install
```bash
npm install @react-three/fiber @react-three/drei @react-three/cannon
npm install @mui/material @emotion/react @emotion/styled
npm install zustand typescript
```

---

## Resources Consulted

- React Official Documentation (Thinking in React)
- Three.js Manual & API Reference  
- Material-UI Overview & Getting Started
- GitHub: react-three-fiber, mui/material-ui

**Status:** Research Complete  
**Recommendation:** Proceed with Phase 2A implementation  
**Confidence Level:** High (Industry-standard technologies with active support)</content>
<parameter name="filePath">.planning/phases/02-architecture-3d/02-3D-FRONTEND-SCOUT-RESEARCH.md