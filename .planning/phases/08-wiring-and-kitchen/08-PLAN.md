# Phase 8: Wiring & Kitchen - MASTER PLAN

**Phase:** 08-wiring-and-kitchen  
**Goal:** Wire BIM tools to UI, build Kitchen UI, fix THREE.js context, enable LLM harness  
**Duration:** 4 weeks  
**Confidence:** HIGH (based on 12 agent deep search)  
**Agents:** 50+ deployed across 6 waves with 2x redundancy  

---

## Phase Boundary

**Deliverables:**
1. ✅ BIMLayout renders without errors
2. ✅ 10+ BIM tools work (LineTool, RectangleTool, CircleTool, ArcTool, etc.)
3. ✅ Kitchen UI fully functional (useCabinetStore + KitchenWorkbench)
4. ✅ THREE.js context lost issue resolved
5. ✅ LLM Harness framework ready (first version)

**Out of Scope:**
- Full 3D tool implementation (WallTool, BeamTool, etc.) - Phase 9
- Advanced LLM features - Phase 8 is framework only
- Export pipeline full implementation - exists, just connect

---

## Wave Structure

| Wave | Focus | Duration | Success Criteria |
|------|-------|----------|------------------|
| **Wave 1** | Quick Fixes | Day 1 | Badge.tsx created, THREE context fixed |
| **Wave 2** | Tool Wiring | Days 2-5 | 10 tools connected to UI |
| **Wave 3** | Kitchen UI | Days 6-10 | KitchenWorkbench functional |
| **Wave 4** | Integration | Days 11-14 | All BIM routes working |
| **Wave 5** | LLM Framework | Days 15-20 | LLM harness basic framework |
| **Wave 6** | Polish & Test | Days 21-28 | E2E tests, bug fixes |

---

## Agent Redundancy Strategy

**For each critical task, deploy 2+ agents:**
- Primary agent executes the task
- Backup agent has identical instructions
- If primary completes, backup becomes synthesizer (creative opportunities)
- If primary fails, backup takes over

**Synthesizer Agents:**
- Monitor progress of all agents in wave
- Look for creative improvements
- Suggest optimizations
- Document findings

---

## Wave 1: Quick Fixes (Day 1)

### Objective
Fix blocking issues from Phase 7:
1. Create missing Badge.tsx component
2. Fix THREE.js context lost handlers
3. Verify BIMLayout route works

### Task 1.1: Create Badge.tsx (CRITICAL - BLOCKING)

**Primary Agent:** badge_creator_primary  
**Backup Agent:** badge_creator_backup  
**Synthesizer:** badge_synthesizer

**Instructions (both agents):**
```
Create frontend/src/components/ui/Badge.tsx

Requirements:
1. Export a Badge component with props:
   - variant: 'default' | 'secondary' | 'destructive' | 'outline'
   - className: string (optional)
2. Use same styling as other UI components in frontend/src/components/ui/
3. Export from frontend/src/components/ui/index.ts
4. Test: StructuralObjectsDemo.tsx should import it without errors

Output: frontend/src/components/ui/Badge.tsx
```

**Verification:**
```bash
# Test import works
grep -q "from.*Badge" frontend/src/bim/StructuralObjectsDemo.tsx && echo "✅ Import exists"
ls frontend/src/components/ui/Badge.tsx && echo "✅ File created"
```

### Task 1.2: Fix THREE.js Context Handlers (CRITICAL - BLOCKING)

**Primary Agent:** three_context_primary  
**Backup Agent:** three_context_backup  
**Synthesizer:** three_synthesizer

**Instructions (both agents):**
```
Fix THREE.js context lost issue in:
1. frontend/src/components/ThreeDCanvas.tsx
2. frontend/src/components/BIMWorkbench/BIM3DCanvas.tsx

Requirements:
1. Add gl={{ onContextLost, onContextRestored }} to Canvas components
2. Add proper dispose() cleanup in useEffect cleanup
3. Add event listeners for webglcontextlost/contextrestored
4. Test: Context should restore automatically, not crash

Output: Modified files with context handlers
```

**Code pattern to add:**
```typescript
// In Canvas component
<Canvas
  gl={{
    onContextLost: (e) => {
      e.preventDefault();
      console.warn('WebGL context lost');
    },
    onContextRestored: () => {
      console.info('WebGL context restored');
    },
    preserveDrawingBuffer: true,
  }}
>
```

### Task 1.3: Verify BIMLayout Route

**Agent:** route_verifier

**Instructions:**
```
1. Test http://localhost:3000/bim loads without errors
2. Test subroutes: /bim/2d-drafting, /bim/3d-modeling
3. Verify sidebar shows 8 tool categories
4. Document any remaining errors

Output: route_verification_report.md
```

---

## Wave 2: Tool Wiring (Days 2-5)

### Objective
Connect 10+ working BIM tools to UI:
- LineTool, RectangleTool, CircleTool, ArcTool
- DoorTool, WindowTool, StairsTool
- PolylineTool, PolygonTool, EllipseTool

### Task 2.1: Analyze Tool Structure

**Agent:** tool_analyzer

**Instructions:**
```
Analyze bim_workbench/tools/ structure:

1. Read bim_workbench/tools/tool_manager.py
2. Read bim_workbench/tools/line_tool.py
3. Read bim_workbench/tools/__init__.py

Report:
- How tools are instantiated
- What methods they expose (execute, etc.)
- How to call them from frontend
- What API endpoints exist

Output: tool_structure_analysis.json
```

### Task 2.2: Wire LineTool to UI

**Primary Agent:** line_tool_wirer_primary  
**Backup Agent:** line_tool_wirer_backup  
**Synthesizer:** line_tool_synthesizer

**Instructions (both agents):**
```
Connect LineTool to BIMLayout sidebar

Steps:
1. frontend/src/components/Layout/BIMLayout.jsx - find Line tool NavLink
2. Check what happens when Line is clicked (currently goes to /bim/2d-drafting?tool=line)
3. Create frontend/src/components/BIM/tools/LineToolHandler.tsx
4. Add route /bim/tools/line that renders LineToolHandler
5. LineToolHandler should:
   - Show canvas for drawing line
   - Call backend API to create line
   - Display created line in BIM store

API pattern (check if exists):
POST /api/v1/bim/tools/line
Body: { "start": [x, y, z], "end": [x, y, z], "properties": {...} }

Output: Working LineTool in UI
```

### Task 2.3: Wire Remaining 2D Tools (Redundant Teams)

**Team A (Rectangle, Circle, Arc):**
- rectangle_tool_wirer_primary / backup
- circle_tool_wirer_primary / backup
- arc_tool_wirer_primary / backup

**Team B (Polyline, Polygon, Ellipse):**
- polyline_tool_wirer_primary / backup
- polygon_tool_wirer_primary / backup
- ellipse_tool_wirer_primary / backup

### Task 2.4: Wire Building Tools (Redundant Teams)

**Team C (Door, Window, Stairs):**
- door_tool_wirer_primary / backup
- window_tool_wirer_primary / backup
- stairs_tool_wirer_primary / backup

---

## Wave 3: Kitchen UI (Days 6-10)

### Objective
Build complete Kitchen frontend:
1. useCabinetStore real implementation
2. KitchenWorkbench component
3. /kitchen route fully functional

### Task 3.1: Analyze Kitchen Backend

**Agent:** kitchen_backend_analyzer

**Instructions:**
```
Analyze Savage_Cabinetry_Platform/kitchen_orchestrator.py:

1. What methods does KitchenDesignOrchestrator expose?
2. What inputs does it accept (width, length, materials)?
3. What outputs does it return (panels, layout, cost)?
4. What API endpoints should exist?

Report: kitchen_backend_api.md
```

### Task 3.2: Create useCabinetStore

**Primary Agent:** cabinet_store_primary  
**Backup Agent:** cabinet_store_backup  
**Synthesizer:** cabinet_store_synthesizer

**Instructions (both agents):**
```
Create frontend/src/stores/useCabinetStore.ts

Requirements:
1. Define CabinetProject interface (name, dimensions, materials, panels)
2. Create useCabinetStore with:
   - state: CabinetProject | null
   - methods: createProject, updateDimensions, selectMaterial, calculate
3. Connect to API: POST /api/v1/kitchen/calculate
4. Handle loading states, errors

API endpoint to create (if not exists):
POST /api/v1/kitchen/calculate
Body: { "width": number, "length": number, "material": string }
Response: { "panels": [...], "layout": {...}, "cost": number }

Output: useCabinetStore.ts
```

### Task 3.3: Create KitchenWorkbench

**Primary Agent:** kitchen_workbench_primary  
**Backup Agent:** kitchen_workbench_backup  
**Synthesizer:** kitchen_workbench_synthesizer

**Instructions (both agents):**
```
Create frontend/src/components/Kitchen/KitchenWorkbench.tsx

Requirements:
1. Layout similar to CeilingWorkbench (3D canvas + controls)
2. Input panel for dimensions (width, length)
3. Material selector (use MaterialLibrary from core)
4. Calculate button (calls useCabinetStore.calculate)
5. Results panel showing panels, cost, layout
6. Export options (JSON, DXF, SVG)

Use existing components:
- ThreeDCanvas for 3D rendering
- MaterialButton, MaterialCard for materials
- MeasurementDialog for inputs

Output: KitchenWorkbench.tsx
```

### Task 3.4: Update /kitchen Route

**Agent:** kitchen_route_updater

**Instructions:**
```
Update frontend/src/App.tsx:

1. Replace placeholder /kitchen route with lazy-loaded KitchenWorkbench
2. Add /kitchen/calculate route
3. Add /kitchen/export/:format route

Pattern from CeilingWorkbench:
const KitchenWorkbench = lazy(() => import('./components/Kitchen/KitchenWorkbench'))

Output: Updated App.tsx routes
```

---

## Wave 4: Integration (Days 11-14)

### Objective
Ensure all BIM and Kitchen features work together:
1. State management across components
2. Proper loading/suspense
3. Error boundaries
4. Consistent navigation

### Task 4.1: State Integration Tester

**Agent:** state_integration_tester

**Instructions:**
```
Test state flow:

1. CeilingWorkbench → useDesignStore ✅
2. BIMLayout → useBIMStore ✅ (verify it works)
3. KitchenWorkbench → useCabinetStore (verify new store works)

Test:
- Can switch between /ceiling, /bim, /kitchen?
- Does state persist on navigation?
- Do components load without errors?

Output: state_integration_report.md
```

### Task 4.2: Error Boundary Implementation

**Agent:** error_boundary_implementer

**Instructions:**
```
Add error boundaries to App.tsx:

1. Wrap Routes in ErrorBoundary component
2. Create frontend/src/components/ErrorBoundary.tsx
3. Show user-friendly error message if component crashes
4. Log error details for debugging

ErrorBoundary pattern:
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return <FallbackUI />
    }
    return this.props.children
  }
}

Output: Error boundaries in App.tsx
```

### Task 4.3: Loading States

**Agent:** loading_states_implementer

**Instructions:**
```
Improve loading states:

1. Add Suspense fallbacks to all lazy-loaded routes
2. Create Skeleton components for loading states
3. Add loading spinners for API calls
4. Show progress for calculations

Output: Better UX during loading
```

---

## Wave 5: LLM Framework (Days 15-20)

### Objective
Build LLM Harness framework in ai/:
1. API endpoints for LLM to call tools
2. Prompt templates for common tasks
3. Context management
4. Tool definitions

### Task 5.1: LLM Harness Architecture

**Agent:** llm_architecture_primary  
**Agent:** llm_architecture_secondary

**Instructions (both):**
```
Design LLM Harness for ai/

Based on findings from Phase 7 deep search:
- orchestration/ai_singularity.py (694 lines)
- orchestration/autonomous_adaptation.py (738 lines)
- orchestration/ai_generative_engine.py (606 lines)

Design:
1. What tools can LLM call? (list all from bim_workbench/tools/)
2. What API endpoints does LLM need?
3. What context should LLM maintain?
4. What prompt templates are needed?

Output: llm_harness_design.md
```

### Task 5.2: Tool API for LLM

**Primary Agent:** llm_tool_api_primary  
**Backup Agent:** llm_tool_api_backup

**Instructions (both):**
```
Create api/routes/llm.py

Endpoints:
POST /api/v1/llm/execute
  - Body: { "tool": "line", "params": {...}, "context": {...} }
  - Response: { "result": {...}, "success": boolean }

GET /api/v1/llm/tools
  - Response: List of available tools with descriptions

GET /api/v1/llm/schema
  - Response: OpenAPI schema for tool calls

Output: api/routes/llm.py with 3 endpoints
```

### Task 5.3: LLM Context Manager

**Agent:** llm_context_manager

**Instructions:**
```
Create ai/context_manager.py

Requirements:
1. Track conversation history
2. Maintain project context (current design, materials, etc.)
3. Provide context to LLM prompts
4. Handle long conversations (truncate if needed)

Pattern:
class LLMContextManager:
  def __init__(self, max_turns=20):
    self.history = []
    self.project_context = {}
  
  def add_turn(self, role, content):
    self.history.append({"role": role, "content": content})
    if len(self.history) > max_turns:
      self.history = self.history[-max_turns:]
  
  def get_context(self):
    return {
      "history": self.history,
      "project": self.project_context
    }

Output: ai/context_manager.py
```

### Task 5.4: Prompt Templates

**Agent:** prompt_templates

**Instructions:**
```
Create ai/prompts/

Templates for common tasks:
1. design_kitchen.txt - "Design a kitchen with dimensions {width}x{length}"
2. add_wall.txt - "Add a wall at position {x},{y} with height {height}"
3. optimize_layout.txt - "Optimize the current layout for cost"
4. check_compliance.txt - "Check if current design complies with building codes"

Each template should:
- Have clear instructions
- Accept parameters
- Specify output format
- Include examples

Output: ai/prompts/*.txt files
```

---

## Wave 6: Polish & Test (Days 21-28)

### Objective
Final integration, testing, bug fixes:
1. E2E tests for all features
2. Bug bash and fixes
3. Documentation
4. Performance optimization

### Task 6.1: E2E Test Writer

**Agent:** e2e_test_writer

**Instructions:**
```
Write E2E tests using existing test infrastructure:

Tests:
1. / renders CeilingWorkbench
2. /bim renders BIMLayout
3. /bim/structural-demo renders StructuralObjectsDemo
4. /kitchen renders KitchenWorkbench
5. LineTool creates a line
6. Kitchen calculation returns panels

Output: tests/test_phase8.py with 20+ tests
```

### Task 6.2: Bug Basher

**Agent:** bug_basher_primary  
**Agent:** bug_basher_secondary

**Instructions:**
```
Bug bash Phase 8 features:

1. Test all routes manually
2. Report any errors in console
3. Fix critical bugs (crashes)
4. Flag cosmetic issues

Output: bugs_fixed.md with list of bugs fixed
```

### Task 6.3: Performance Optimizer

**Agent:** performance_optimizer

**Instructions:**
```
Optimize Phase 8 features:

1. Code splitting - ensure routes load independently
2. Memoization - add useMemo, useCallback where needed
3. Bundle size - verify not too large
4. Loading speed - should load in <3 seconds

Output: performance_report.md
```

### Task 6.4: Documentation Writer

**Agent:** documentation_writer

**Instructions:**
```
Create Phase 8 documentation:

1. README.md for each new feature
2. API documentation for LLM endpoints
3. Usage guide for Kitchen UI
4. Tool guide for BIM tools

Output: docs/ directory with Phase 8 docs
```

---

## Success Criteria

| Feature | Success Criteria | Priority |
|---------|-----------------|----------|
| Badge.tsx | StructuralObjectsDemo loads without import error | Critical |
| THREE context | No context lost errors on route navigation | Critical |
| LineTool | Can draw line, appears in 3D canvas | Critical |
| 10 tools wired | 10 tools work in UI | High |
| Kitchen UI | Can calculate kitchen, see results | High |
| LLM framework | API endpoints respond correctly | Medium |
| E2E tests | 20+ tests passing | High |
| Documentation | All features documented | Medium |

---

## Estimated Timeline

| Day | Focus | Deliverables |
|-----|-------|--------------|
| 1 | Quick Fixes | Badge.tsx, THREE context fixed |
| 2-5 | Tool Wiring | 10+ tools working |
| 6-10 | Kitchen UI | KitchenWorkbench functional |
| 11-14 | Integration | State works, error boundaries |
| 15-20 | LLM Framework | Basic harness ready |
| 21-28 | Polish & Test | Tests, docs, bugs fixed |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend API doesn't exist | Medium | High | Create API endpoints in Wave 3 |
| THREE context persists | Medium | High | Multiple fixes, extensive testing |
| Tool wiring complex | High | Medium | Use tool_manager pattern |
| LLM integration complex | High | Medium | Start simple, iterate |

---

*Plan created: 2026-02-01*  
*Ready for execution: YES*  
*Confidence: HIGH*  
*Agents deployed: 50+*