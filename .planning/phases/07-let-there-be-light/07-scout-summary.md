# Phase 7: "Let There Be Light" — Comprehensive Scout Report

**Scouted:** 2026-02-01
**Mission:** Map entire codebase to identify what's connected vs orphaned

---

## 🚨 THE CHAOS: What We Found

### DUPLICATE DIRECTORIES (Multiple Copies of Same Thing!)

| Item | Locations | Severity | 
|------|-----------|----------|
| BIM | `bim/`, `src/bim/`, `Spacer/bim/` | **CRITICAL** - 3 copies! |
| Workbench | `bim_workbench/`, `Spacer/bim_workbench/` | **HIGH** - 2 copies |
| API | `api/`, `backend/` | **MEDIUM** - 2 entry points |
| Frontend | `frontend/src/`, `Spacer/frontend/` | **HIGH** - 2 copies |

### SUSPICIOUS DIRECTORIES (Likely Orphaned)

| Directory | Size | Evidence of Use |
|-----------|------|-----------------|
| `ai/` | empty (0 bytes) | Not imported anywhere |
| `analytics/` | 1 file | Minimal, not connected |
| `blockchain/` | 1 file | Not imported anywhere |
| `vision/` | 1 file | Not imported anywhere |
| `billing/` | 1 file | Not imported anywhere |
| `auth/` | 1 file | Not imported anywhere |
| `Spacer/` | **FULL COPY** | Entire project duplicated! |
| `03-platform-integration/` | phase files | Phase directory at root? |
| `archive/` | 13+ files | Old implementations |

### MULTIPLE ENTRY POINTS

```
Entry Points (Python):
├── main_platform_entry.py           ← MAIN (278 lines) - savage-platform CLI
├── savage_cli.py                    ← CLI entry (10 lines)
├── api/app.py                       ← API #1
├── backend/app.py                   ← API #2 (what's different?)
├── src/api/main.py                  ← Another API?
└── setup.py                         ← Package setup

Entry Points (Frontend):
├── frontend/src/main.tsx            ← Main React entry
├── frontend/src/main.jsx            ← Duplicate entry?
├── frontend/src/App.tsx             ← App component
├── frontend/src/App.jsx             ← Duplicate App?
└── frontend/index.html              ← HTML entry
```

---

## 📊 THE VERDICT: Connection Analysis

### KEEP (Connected to Savage Cabinetry Core)

```
Savage_Cabinetry_Platform/                 ← THE BABY - PROTECT!
├── config.py                              ← Central config
├── kitchen_orchestrator.py                ← Central orchestrator  
├── cli_interface.py                       ← CLI commands
└── __init__.py

core/                                      ← Core calculations
├── ceiling_panel_calc.py                  ← Used by orchestrator
├── algorithm_config.py                    ← Config for algo
├── svg_config.py                          ← SVG export config
└── validation.py                          ← Input validation

frontend/src/                              ← Main frontend
├── workbench/CeilingWorkbench.tsx         ← Main UI
├── store/useDesignStore.ts                ← Ceiling design state
├── main.tsx                               ← React mount
└── App.tsx                                ← App shell
```

### MOVE TO STAGING JAIL (Orphaned)

```
❌ ai/                                     ← Empty directory
❌ analytics/                              ← 1 unused file
❌ blockchain/                             ← Not connected
❌ vision/                                 ← Not connected
❌ billing/                                ← Not connected
❌ auth/                                   ← Not connected
❌ web/                                    ← Not connected
❌ resources/                              ← Not connected
❌ scripts/                                ← What's in here?
❌ logs/                                   ← Generated, not source
❌ k8s/                                    ← Kubernetes configs
❌ .github/workflows/                      ← Keep or move?
❌ .qoder/                                 ← Unknown purpose
```

### REVIEW (Uncertain - Ask User)

```
? Spacer/                                  ← FULL PROJECT DUPLICATE!
  - Contains: bim/, bim_workbench/, frontend/, tests/
  - Is this a backup? Staging? Old version?
  - Action: ASK USER

? 03-platform-integration/                 ← Phase directory at root?
  - Contains phase summary files
  - Should be in .planning/phases/
  - Action: MOVE to .planning/

? archive/                                 ← 13+ files
  - Contains: ceiling_panel_calc(1).py, examples(1).py, etc.
  - The (1) suggests duplicates/backups
  - Action: MOVE most to staging

? bim/ vs src/bim/ vs Spacer/bim/          ← 3 BIM directories!
  - bim/ - Python BIM objects (Wall, Beam, Column, etc.)
  - src/bim/ - TypeScript BIM components
  - Spacer/bim/ - Copy?
  - Action: CONSOLIDATE to one location

? backend/ vs api/                         ← 2 Python APIs
  - api/app.py - What's this?
  - backend/app.py - What's this?
  - src/api/main.py - Another one?
  - Action: CONSOLIDATE or document difference

? frontend/src/main.tsx vs main.jsx        ← 2 React entries
  - Both exist, which is used?
  - Vite config determines this
  - Action: DELETE duplicate

? frontend/src/App.tsx vs App.jsx          ← 2 App components
  - Both exist
  - Action: DELETE duplicate
```

---

## 🏗️ BIM INTERFACE: What It Looks Like

### BIM Components Found

| Location | Type | Purpose |
|----------|------|---------|
| `frontend/src/bim/index.ts` | TS exports | BIM module index |
| `frontend/src/bim/StructuralObjectsDemo.tsx` | React | Demo component |
| `frontend/src/bim/types/structural.ts` | Types | BIM object types |
| `frontend/src/stores/useBIMStore.ts` | Store | **1,363 lines!** - Full BIM state |
| `bim/__init__.py` | Python | BIM module exports |
| `bim/objects/*.py` | Python | Wall, Beam, Column, Slab, Roof |
| `bim/gui/*.py` | Python | GUI tools |
| `bim/property/*.py` | Python | Property panels |

### BIM Dependencies
- **Three.js** / @react-three/fiber (3D rendering)
- **Zustand** (state management)
- **@mui/material** (UI components)

### BIM on First Launch (Predicted)
Based on components found:
1. ✅ **3D Canvas** - Will render (Three.js is there)
2. ⚠️ **Structural Objects** - Wall/Beam/Column/Slab classes exist
3. ⚠️ **Property Panel** - May show empty state (no objects selected)
4. ❓ **Toolbar** - Need to verify BIM tools are connected

---

## 🎯 RECOMMENDED STAGING JAIL MOVES

### Move Immediately (Definite Orphans)

| From | To Staging | New Name |
|------|------------|----------|
| `ai/` | `staging/Francis/ai/` | Francis (empty but weird) |
| `blockchain/` | `staging/Francis/blockchain/` | Francis |
| `vision/` | `staging/Narwhal/vision/` | Narwhal (weird animal) |
| `analytics/` | `staging/Narwhal/analytics/` | Narwhal |
| `billing/` | `staging/Platypus/billing/` | Platypus (weird animal) |
| `auth/` | `staging/Platypus/auth/` | Platypus |
| `web/` | `staging/QuantumBadger/web/` | QuantumBadger |
| `resources/` | `staging/WetNoodle/resources/` | WetNoodle |
| `scripts/` | `staging/ExistentialDuck/scripts/` | ExistentialDuck |

### Ask User (Review Required)

| Item | Question |
|------|----------|
| `Spacer/` | Backup? Old version? Keep or delete? |
| `03-platform-integration/` | Move to .planning/phases/? |
| `archive/` | Keep some? Move all? |
| `k8s/` | Keep for deployment? |
| `.github/` | Keep for CI? |

### Consolidate (Technical Cleanup)

| Item | Action |
|------|--------|
| `bim/` vs `src/bim/` | Keep one, delete other |
| `bim_workbench/` vs `Spacer/bim_workbench/` | Consolidate |
| `frontend/src/main.tsx` vs `main.jsx` | Keep one |
| `frontend/src/App.tsx` vs `App.jsx` | Keep one |
| `api/` vs `backend/` vs `src/api/` | Consolidate APIs |

---

## 📋 PHASE 7 NEXT STEPS

### Step 1: User Decisions Needed
1. Confirm `Spacer/` disposition (backup or start fresh?)
2. Confirm `03-platform-integration/` location
3. Confirm which BIM directory is "real"
4. Confirm which frontend entry is "real"
5. Confirm which API is "real"

### Step 2: Technical Cleanup
1. Delete duplicate entry points (main.tsx vs main.jsx, etc.)
2. Consolidate duplicate directories (bim/, bim_workbench/)
3. Move definite orphans to staging

### Step 3: Staging Jail
1. Create `staging/` directory
2. Create subdirectories with weird names (Francis, Narwhal, etc.)
3. Move confirmed orphans

### Step 4: BIM First Launch
1. Verify BIM can render without errors
2. Verify no orphan imports causing failures
3. Document what BIM looks like on first launch

---

## 📁 FILES BY CONNECTION STATUS

### DEFINTELY CONNECTED (KEEP - 0 moves)
```
Savage_Cabinetry_Platform/
core/
frontend/src/ (main.tsx, App.tsx, workbench/, store/useDesignStore.ts)
main_platform_entry.py
```

### LIKELY CONNECTED (REVIEW - 5 files)
```
frontend/src/main.jsx         ← Is this used?
frontend/src/App.jsx          ← Is this used?
api/app.py                    ← What's this connect to?
backend/app.py                ← What's this connect to?
src/api/main.py               ← What's this connect to?
```

### DEFINITELY ORPHANED (MOVE - 8+ directories)
```
ai/, analytics/, blockchain/, vision/, billing/, auth/, web/, resources/
```

### FULL PROJECT DUPLICATE (REVIEW - 1 directory)
```
Spacer/                       ← Contains: bim/, bim_workbench/, frontend/, tests/
```

---

*Scout complete. Awaiting user decisions on review items.*
