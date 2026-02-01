# Phase 7: "Let There Be Light" - Context

**Gathered:** 2026-02-01
**Status:** Ready for execution

## Phase Boundary

Clean the codebase chaos: move orphans to staging jail, consolidate BIM into single source of truth, recover valuable IP from archive, and get BIM visible for the first time.

---

## Implementation Decisions

### Archive Recovery
- **Connected archive files → core/[descriptive name]:**
  - `ceiling_panel_calc(1).py` → `core/algorithms/panel_calculator_legacy.py`
  - `examples(1).py` → `examples/bim_examples.py`
  - `three_d_engine.py` → `core/engines/three_d_engine.py`
  - `full_architecture.py` → `core/architecture/full_architecture_reference.py`
  - `phase1_mvp.py` → `core/mvp/phase1_mvp_reference.py`
  - `__init__.py` → `core/archive_init.py`

- **Orphaned archive files → staging jail:**
  - Move to `staging/QuantumBadger/archive/` with weird names

### BIM Consolidation
- **Consolidate INTO App.tsx** (current active entry)
- Add React Router routing from App.jsx
- Import BIMLayout, TestComponents, StructuralObjectsDemo
- Add BIM routes (/bim, /bim/test-components, /bim/structural-demo)
- Preserve MUI theming from App.tsx
- **DELETE App.jsx** after IP harvest
- **DELETE main.jsx** (confirmed orphan)

### Entry Points
- Keep `main.tsx` → `App.tsx` → CeilingWorkbench (current flow)
- Add BIM routing alongside CeilingWorkbench

### Staging Jail Names (weird)
- `Francis` - for odd LLM/experimental stuff
- `Narwhal` - for analytics/climate stuff
- `QuantumBadger` - for archive remnants
- `WetNoodle` - for resources/scripts

### Phase Docs Location
- Move `03-platform-integration/` → `.planning/phases/07-let-there-be-light/`

---

## Claude's Discretion

- Specific naming for core/ directories (algorithms, engines, architecture, mvp)
- Exact structure of BIM routes (whether standalone or integrated with ceiling)
- MUI theme consolidation (use existing theme or create BIM-specific)
- Service worker handling (App.jsx has service worker code - keep or discard?)

---

## Specific Ideas

- "LLM harness for AI/" → defer to Phase 8, first task of that phase
- Keep ceiling calculator IP while building BIM - they coexist
- App.jsx has service worker registration - evaluate if needed

---

## Deferred Ideas

- **LLM Harness in ai/** → Phase 8, first tasks
- Any other Spacer/ IP not yet analyzed → Phase 9

---

## Execution Checklist

- [ ] Move connected archive files to core/[descriptive]/ (5 files)
- [ ] Move orphaned archive files to staging/QuantumBadger/ (6 files)
- [ ] Consolidate BIM into App.tsx (add routing, imports)
- [ ] DELETE App.jsx (after harvest)
- [ ] DELETE main.jsx (confirmed orphan)
- [ ] Move 03-platform-integration to .planning/phases/
- [ ] Verify BIM renders on first launch
- [ ] Commit changes

---

*Phase: 07-let-there-be-light*
*Context gathered: 2026-02-01*
