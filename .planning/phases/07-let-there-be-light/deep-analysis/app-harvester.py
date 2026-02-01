#!/usr/bin/env python3
"""
Deep Analysis: App.tsx vs App.jsx - IP Harvest
Find the best of both, create single BIM source of truth
"""

import subprocess
import json
from pathlib import Path
from datetime import datetime

ROOT = Path("/home/tomas/Ceiling Panel Spacer")
OUTPUT = ROOT / ".planning/phases/07-let-there-be-light/deep-analysis"


def run_grep(pattern, path="."):
    try:
        result = subprocess.run(
            [
                "grep",
                "-r",
                "-n",
                "--include=*.tsx",
                "--include=*.ts",
                "--include=*.py",
                pattern,
                path,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return result.stdout
    except:
        return ""


def count_lines(path):
    try:
        with open(path) as f:
            return sum(1 for _ in f)
    except:
        return 0


print("=" * 80)
print("APP COMPARISON: CeilingWorkbench (App.tsx) vs BIM Workbench (App.jsx)")
print("=" * 80)

# Read both files
app_tsx = ROOT / "frontend/src/App.tsx"
app_jsx = ROOT / "frontend/src/App.jsx"

app_tsx_lines = count_lines(app_tsx)
app_jsx_lines = count_lines(app_jsx)

print(f"\n📊 App.tsx: {app_tsx_lines} lines (CeilingWorkbench)")
print(f"📊 App.jsx: {app_jsx_lines} lines (BIM Workbench)")

# Analyze each
analysis = {
    "timestamp": datetime.now().isoformat(),
    "app_tsx": {
        "path": str(app_tsx),
        "lines": app_tsx_lines,
        "features": [],
        "components": [],
        "stores": [],
        "ip_assets": [],
    },
    "app_jsx": {
        "path": str(app_jsx),
        "lines": app_jsx_lines,
        "features": [],
        "components": [],
        "stores": [],
        "ip_assets": [],
    },
    "comparison": {},
}

# Analyze App.tsx (CeilingWorkbench)
print("\n" + "-" * 40)
print("App.tsx (CeilingWorkbench) Analysis:")
print("-" * 40)

with open(app_tsx) as f:
    content = f.read()

# Find imports
imports_tsx = []
for line in content.split("\n"):
    if line.strip().startswith("import ") and "from" in line:
        imports_tsx.append(line.strip())

print(f"   Imports: {len(imports_tsx)}")
for imp in imports_tsx:
    print(f"      {imp}")

# Find features (mentions of components)
features_tsx = []
components_tsx = []

if "CeilingWorkbench" in content:
    features_tsx.append("CeilingWorkbench 3D interface")
if "useDesignStore" in content:
    features_tsx.append("useDesignStore state management")
    components_tsx.append("useDesignStore")
if "Toolbar" in content:
    features_tsx.append("Toolbar integration")
if "Grid" in content or "grid" in content.lower():
    features_tsx.append("Grid snapping")
if "Panel" in content or "panel" in content.lower():
    features_tsx.append("Panel management")
if "Material" in content or "material" in content.lower():
    features_tsx.append("Material selection")

print(f"   Features: {features_tsx}")
print(f"   State stores: {components_tsx}")

analysis["app_tsx"]["features"] = features_tsx
analysis["app_tsx"]["components"] = components_tsx
analysis["app_tsx"]["imports"] = imports_tsx

# Analyze App.jsx (BIM Workbench)
print("\n" + "-" * 40)
print("App.jsx (BIM Workbench) Analysis:")
print("-" * 40)

with open(app_jsx) as f:
    content = f.read()

# Find imports
imports_jsx = []
for line in content.split("\n"):
    if line.strip().startswith("import ") and "from" in line:
        imports_jsx.append(line.strip())

print(f"   Imports: {len(imports_jsx)}")
for imp in imports_jsx:
    print(f"      {imp}")

# Find features
features_jsx = []
components_jsx = []

if "BIMLayout" in content:
    features_jsx.append("BIMLayout shell")
if "BrowserRouter" in content:
    features_jsx.append("React Router routing")
if "QueryClient" in content:
    features_jsx.append("React Query integration")
    components_jsx.append("QueryClient")
if "TestComponents" in content:
    features_jsx.append("TestComponents testing")
if "StructuralObjectsDemo" in content:
    features_jsx.append("StructuralObjectsDemo BIM objects")
    components_jsx.append("StructuralObjectsDemo")
if "useBIMStore" in content:
    features_tsx.append("useBIMStore BIM state")
    components_tsx.append("useBIMStore")

print(f"   Features: {features_jsx}")
print(f"   State stores: {components_jsx}")

analysis["app_jsx"]["features"] = features_jsx
analysis["app_jsx"]["components"] = components_jsx
analysis["app_jsx"]["imports"] = imports_jsx

# Compare and find unique IP
print("\n" + "=" * 80)
print("IP COMPARISON & HARVEST OPPORTUNITIES")
print("=" * 80)

unique_to_tsx = [f for f in features_tsx if f not in features_jsx]
unique_to_jsx = [f for f in features_jsx if f not in features_tsx]
common = [f for f in features_tsx if f in features_jsx]

print(f"\n🔵 UNIQUE TO App.tsx (CeilingWorkbench):")
for f in unique_to_tsx:
    print(f"   - {f}")

print(f"\n🔴 UNIQUE TO App.jsx (BIM Workbench):")
for f in unique_to_jsx:
    print(f"   - {f}")

print(f"\n🟡 COMMON:")
for f in common:
    print(f"   - {f}")

# Recommendations
print("\n" + "=" * 80)
print("RECOMMENDATIONS FOR SINGLE BIM SOURCE OF TRUTH")
print("=" * 80)

print("""
OPTION 1: Consolidate INTO App.tsx (Current Active Entry)
   Pros: 
   - Already the active entry point (index.html points here)
   - CeilingWorkbench foundation is solid
   
   What to keep from App.jsx:
   - BIMLayout shell
   - React Router routing
   - React Query integration
   - StructuralObjectsDemo
   - BIM-specific components

OPTION 2: Switch TO App.jsx (BIM-focused Entry)
   Pros:
   - Built specifically for BIM
   - Has routing for multiple BIM views
   
   What to keep from App.tsx:
   - ThemeProvider pattern
   - CeilingWorkbench integration
   - Any UI components that work well

OPTION 3: Create NEW App that merges best of both
""")

# Check what each needs
print("\n" + "-" * 40)
print("State Stores Needed:")
print("-" * 40)

print("   App.tsx needs:")
print("      - useDesignStore (already importing)")
print("   App.jsx needs:")
print("      - BIMLayout (custom)")
print("      - QueryClient (from @tanstack/react-query)")

# Check if stores exist
design_store = ROOT / "frontend/src/store/useDesignStore.ts"
bim_store = ROOT / "frontend/src/stores/useBIMStore.ts"

print(
    f"\n   useDesignStore.ts: {'✅ EXISTS' if design_store.exists() else '❌ MISSING'}"
)
print(f"   useBIMStore.ts: {'✅ EXISTS' if bim_store.exists() else '❌ MISSING'}")

# Save analysis
report_path = OUTPUT / "app-comparison.json"
with open(report_path, "w") as f:
    json.dump(analysis, f, indent=2)

print(f"\n✅ Analysis: {report_path}")

# Create action plan
print("\n" + "=" * 80)
print("PROPOSED ACTION PLAN")
print("=" * 80)

print("""
PHASE 7A: IP Harvest
   1. Read App.tsx and App.jsx to identify components
   2. Identify which BIM components exist in App.jsx
   3. Identify which UI components exist in App.tsx
   4. Document what each app has that the other needs

PHASE 7B: Consolidation (RECOMMEND: Consolidate INTO App.tsx)
   1. Extend App.tsx to include BIM routing
   2. Add BIMLayout as main component or integrate into CeilingWorkbench
   3. Add React Query integration if needed
   4. Preserve StructuralObjectsDemo
   5. Delete App.jsx (if App.tsx can do everything)

PHASE 7C: Cleanup
   1. Delete orphaned main.jsx
   2. Delete orphaned App.jsx (if consolidated)
   3. Clean up any duplicate imports
""")

print("✅ Analysis complete!")
