---
phase: "06-bim-workbench"
plan: "07"
subsystem: "bim_workbench"
tags: ["python", "drafting", "2d", "tools", "geometry", "curves"]

dependency_graph:
  requires:
    - "06-06"  # Prior drafting infrastructure
    - "06-04"  # BIM API Layer
  provides:
    - "Advanced 2D drafting tools"
    - "Geometric primitive creation"
    - "Curve support (B-spline, Bézier)"
  affects:
    - "06-08"  # Next drafting tools
    - "06-12"  # 3D objects (uses 2D profiles)

tech-stack:
  added:
    - "Cox-de Boor algorithm"
    - "Bernstein polynomials"
    - "Parametric curve generation"
    - "Knot vector generation"
  patterns:
    - "State machine for tool workflow"
    - "Entity-Tool separation"
    - "Interactive preview rendering"

file_tracking:
  created:
    - "bim_workbench/drafting/polyline_tool.py"
    - "bim_workbench/drafting/polygon_tool.py"
    - "bim_workbench/drafting/ellipse_tool.py"
    - "bim_workbench/drafting/bspline_tool.py"
    - "bim_workbench/drafting/bezier_tool.py"
    - "bim_workbench/drafting/point_tool.py"
    - "bim_workbench/drafting/base_draft_tool.py"
    - "bim_workbench/drafting/__init__.py"
    - "bim_workbench/tools/tool_manager.py"
    - "bim_workbench/tools/tool_registration.py"
    - "tests/test_drafting/test_advanced_tools.py"
  modified: []

decisions:
  - id: "D01"
    text: "Use Cox-de Boor recursion for B-spline basis functions"
    context: "Accurate mathematical implementation of B-splines"
  - id: "D02"
    text: "Implement Bernstein polynomials for Bézier curves"
    context: "Standard cubic and quadratic Bézier formulas"
  - id: "D03"
    text: "Separate tool logic from entity geometry"
    context: "Clean architecture with Tool handling interaction, Entity storing data"
  - id: "D04"
    text: "Support both inscribed and circumscribed polygon modes"
    context: "CAD-standard polygon creation workflow"
  - id: "D05"
    text: "Point tool creates entity immediately on click"
    context: "Unlike other tools, points are created instantly for rapid placement"

metrics:
  duration: "~45 minutes"
  completed: "2026-01-31"
---

# Phase 06 Plan 07: Advanced 2D Drafting Tools Summary

## Overview

Successfully implemented six advanced 2D drafting tools to extend the BIM Workbench drawing capabilities. These tools provide comprehensive geometric primitive creation for technical drawings, supporting complex shapes, curves, and precise markers.

## Tools Created

### 1. Polyline Tool (`polyline_tool.py`)
**Purpose:** Create connected line segments forming complex shapes

**Key Features:**
- Vertex-by-vertex creation via left-click
- Rubber-band preview line from last vertex to cursor
- Double-click or Enter to finish
- 'C' key toggles closed polyline (connects last to first)
- Right-click removes last vertex
- Vertex markers at each point

**Entity:** `PolylineEntity` with vertices list and is_closed flag

### 2. Polygon Tool (`polygon_tool.py`)
**Purpose:** Create regular polygons from center and radius

**Key Features:**
- Center point + radius workflow
- Number keys (3-9) change number of sides
- 'I'/'C' keys toggle inscribed/circumscribed modes
- Real-time preview with polygon outline
- Radius circle reference display

**Geometry:**
- Inscribed: radius to vertex
- Circumscribed: radius to edge midpoint (adjusted by cos(π/n))
- Vertices calculated using parametric equations

**Entity:** `PolygonEntity` with center, radius, num_sides, vertices

### 3. Ellipse Tool (`ellipse_tool.py`)
**Purpose:** Create ellipses via axis definition

**Key Features:**
- Three-click workflow: first axis start → first axis end → second axis length
- Shift key constrains first axis to 45° increments
- Dashed axis lines in preview
- Real-time ellipse outline

**Geometry:**
- Center = midpoint of first axis
- Major radius = half of first axis length
- Minor radius = second axis length / 2
- Rotation = angle of first axis
- Parametric equation: x = a·cos(t), y = b·sin(t), rotated

**Entity:** `EllipseEntity` with center, major/minor radii, rotation

### 4. B-spline Tool (`bspline_tool.py`)
**Purpose:** Create smooth B-spline curves through control points

**Key Features:**
- Control point placement via left-click
- Degree selection: '2' for quadratic, '3' for cubic
- Control polygon visible during creation
- Double-click or Enter to finish
- Minimum 3 points required

**Mathematics:**
- Cox-de Boor recursion for basis functions
- Uniform clamped knot vector generation
- Support for degree 2 (quadratic) and 3 (cubic)
- Curve equation: C(t) = Σ N_i,p(t) · P_i

**Entity:** `BSplineEntity` with control_points, degree, knots, curve_points

### 5. Bézier Curve Tool (`bezier_tool.py`)
**Purpose:** Create cubic/quadratic Bézier curves

**Key Features:**
- Four-point workflow for cubic (start, control1, control2, end)
- Three-point workflow for quadratic (start, control, end)
- 'Q' key toggles between cubic and quadratic
- Control handles visible as dashed lines
- Backspace to go back one step
- Real-time curve preview

**Mathematics:**
- **Cubic:** B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
- **Quadratic:** B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
- 100 samples for smooth curve (t = 0 to 1)

**Entity:** `BezierCurveEntity` with start, control points, end, degree

### 6. Point Tool (`point_tool.py`)
**Purpose:** Place point markers on single click

**Key Features:**
- Immediate entity creation on left-click
- Tool remains active for rapid placement
- 'S' key cycles through marker styles
- Number keys (1-9) adjust marker size
- Snap indicator when snap is active

**Marker Styles:**
- **Crosshair:** Horizontal + vertical lines (default)
- **Dot:** Small filled circle
- **Plus:** Diagonal cross ('×')
- **Circle:** Small circle outline

**Entity:** `PointEntity` with position, marker_style, marker_size

## Architecture

### Base Infrastructure
Created foundation classes in `base_draft_tool.py`:
- `BaseDraftTool`: Abstract base with mouse/keyboard handling, preview rendering
- `ToolState`: IDLE, ACTIVE, PREVIEW states
- `Point2D`: 2D point with vector operations
- `BaseEntity`: Base class for all drawing entities

### Tool Management
- `ToolManager`: Singleton managing tool registration and activation
- `tool_registration.py`: Imports and registers all drafting tools

### Entity Pattern
Each tool has a corresponding entity class:
- Tool handles user interaction and state management
- Entity stores geometry data and handles rendering
- Clean separation of concerns

## Testing

Created comprehensive test suite (`test_advanced_tools.py`):
- **31 tests** covering all 6 tools
- Tests for tool creation, entity generation, geometry calculations
- Mock renderer for testing without UI dependencies
- Integration tests verifying all tools work together

**Test Coverage:**
- Tool instantiation and metadata
- Mouse interaction (click, move, drag)
- Keyboard shortcuts
- Entity geometry correctness
- Rendering (via MockRenderer)
- State machine transitions

## Deviations from Plan

None. Plan executed exactly as written. All 6 tools implemented with:
- ✅ Interactive previews
- ✅ Correct geometry calculations
- ✅ Proper keyboard shortcuts
- ✅ Entity creation on completion
- ✅ Tool registration
- ✅ Comprehensive tests

## Next Steps

These tools integrate with:
- **Tool palette UI** (to be implemented)
- **Property editor** for editing created entities
- **Layer system** for organizing geometry
- **3D extrusion** (Phase 06-12) - 2D profiles become 3D objects
- **IFC export** (Phase 06-19) - entities export to IFC format

## Key Decisions

1. **Mathematical Accuracy:** Implemented standard algorithms (Cox-de Boor, Bernstein) rather than approximations
2. **CAD Conventions:** Followed standard CAD workflows (center-radius for polygons, 3-click for ellipses)
3. **Immediate Feedback:** All tools show real-time previews during creation
4. **Flexibility:** Multiple ways to complete operations (Enter key, double-click, etc.)

## Technical Highlights

- **Cox-de Boor Algorithm:** Recursive basis function calculation for B-splines
- **Knot Vector Generation:** Proper uniform clamped knot vectors
- **Parametric Equations:** Accurate ellipse point generation
- **State Machines:** Clean workflow management for multi-step tools
- **Snap Integration:** All tools respect grid and object snap settings
