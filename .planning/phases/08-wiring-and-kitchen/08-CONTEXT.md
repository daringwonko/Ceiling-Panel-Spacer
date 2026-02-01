# Phase 8: Wiring & Kitchen - Context

**Gathered:** 2026-02-01
**Status:** Ready for execution

## Phase Boundary

Wire BIM tools to UI, build complete Kitchen UI, fix THREE.js context issues, and create LLM Harness framework. Deliver working applications with 10+ connected tools, functional Kitchen Workbench, and basic LLM framework.

---

## Implementation Decisions

### Badge Component
- Create frontend/src/components/ui/Badge.tsx to fix StructuralObjectsDemo import error
- Use styling consistent with existing UI components (Button, Card, etc.)
- Export from index.ts

### THREE.js Context Fix
- Add gl={{ onContextLost, onContextRestored }} to Canvas components
- Add proper dispose() cleanup in useEffect
- Add event listeners for contextlost/contextrestored

### Tool Wiring Strategy
- Wire LineTool, RectangleTool, CircleTool, ArcTool first (proven working)
- Then DoorTool, WindowTool, StairsTool (building elements)
- Then PolylineTool, PolygonTool, EllipseTool (drafting tools)
- Use existing tool_manager.py pattern from bim_workbench

### Kitchen Backend
- KitchenDesignOrchestrator exists in Savage_Cabinetry_Platform/kitchen_orchestrator.py
- API endpoints needed: POST /api/v1/kitchen/calculate
- Connect frontend to backend via API, not direct Python imports

### Kitchen Frontend Structure
- useCabinetStore.ts with createProject, updateDimensions, selectMaterial, calculate
- KitchenWorkbench.tsx with 3D canvas, controls, results panel
- Lazy-load from /kitchen route

### LLM Harness Scope
- Framework only in Phase 8 (not full implementation)
- API endpoints for tool execution
- Context management
- Prompt templates
- Full LLM features deferred to Phase 9

---

## Specific Ideas

- "Kitchen UI should feel like CeilingWorkbench but for cabinet design"
- "LineTool should be the simplest to wire - start there"
- "LLM should be able to call any BIM tool via API"
- "Error boundaries should show user-friendly messages, not crashes"

---

## Claude's Discretion

- Specific Badge component styling (follow existing patterns)
- Error boundary fallback UI design
- Loading skeleton design
- KitchenWorkbench layout details (position of controls, canvas size)
- LLM prompt template exact wording
- Test coverage thresholds

---

## Deferred Ideas

- Full 3D tool implementation (WallTool, BeamTool, ColumnTool, SlabTool) - Phase 9
- Advanced LLM features (autonomous agents, self-improvement) - Phase 9
- Export pipeline full implementation - exists, just connect

---

## Execution Notes

- 6 waves over 28 days
- 50+ agents with 2x redundancy for critical tasks
- Synthesizer agents at each wave to capture opportunities
- Wave 1: Quick fixes (Badge.tsx, THREE context)
- Wave 2: Tool wiring (10 tools)
- Wave 3: Kitchen UI
- Wave 4: Integration
- Wave 5: LLM framework
- Wave 6: Polish & test

---

*Phase: 08-wiring-and-kitchen*
*Context gathered: 2026-02-01*