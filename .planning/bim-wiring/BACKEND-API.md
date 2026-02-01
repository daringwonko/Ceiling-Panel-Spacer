# BIM Backend API Integration Analysis

## 1. All BIM-Related Routes in backend/app.py

### Project Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/projects` | POST | Create new BIM project with name, unit, dimensions |
| `/api/bim/projects` | GET | List all projects with pagination (page, limit, search) |
| `/api/bim/projects/<project_id>` | GET | Get project by ID with objects, layers, materials |
| `/api/bim/projects/<project_id>` | PUT | Update project name, description, unit, dimensions |
| `/api/bim/projects/<project_id>` | DELETE | Delete project and all related objects/layers |

### Object Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/objects` | POST | Create new object (wall, floor, ceiling, panel, etc.) |
| `/api/bim/objects/<object_id>` | GET | Get object by ID |
| `/api/bim/objects/<object_id>` | PUT | Update object geometry, properties, layer, material |
| `/api/bim/objects/<object_id>` | DELETE | Delete object |
| `/api/bim/projects/<project_id>/objects` | GET | Get all objects in a project |

### Layer Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/layers` | POST | Create new layer with name, color, visibility, lock state |
| `/api/bim/projects/<project_id>/layers` | GET | Get all layers in a project |
| `/api/bim/layers/<layer_id>` | PUT | Update layer name, color, visibility, lock state |
| `/api/bim/layers/<layer_id>` | DELETE | Delete layer |

### Material Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/materials` | GET | List all available materials |
| `/api/bim/materials` | POST | Create custom material with name, color, density, cost |
| `/api/bim/materials/<material_id>` | GET | Get material by ID |

### Export Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/export/ifc` | POST | Export project to IFC format (returns mock download_url) |
| `/api/bim/export/dxf` | POST | Export project to DXF format |
| `/api/bim/export/svg` | POST | Export project to SVG blueprint |
| `/api/bim/export/json` | POST | Export full project data to JSON |

### Import Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/import/ifc` | POST | Import IFC file into project (multipart/form-data) |
| `/api/bim/import/dxf` | POST | Import DXF file into project |

### Tool Routes
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/bim/tools/arc` | POST | Create arc geometry (start, end, bulge) |
| `/api/bim/tools/rectangle` | POST | Create rectangle geometry (corner, opposite_corner) |
| `/api/bim/tools/ellipse` | POST | Create ellipse geometry (center, radiusX, radiusY, rotation) |
| `/api/bim/tools/door` | POST | Create door object (position, width, height, direction) |

### V1 API Routes (Legacy)
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/bim/tools/ellipse` | POST | Create ellipse using v1 API (rx, ry instead of radiusX, radiusY) |

### Health Check
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/health` | GET | API health check with status, version, timestamp |

---

## 2. Endpoint Descriptions (One Sentence Each)

**Project Endpoints:**
- `POST /api/bim/projects`: Creates a new BIM project with required name and unit measurement
- `GET /api/bim/projects`: Retrieves paginated list of all BIM projects with optional search
- `GET /api/bim/projects/<project_id>`: Fetches complete project details including all objects, layers, and materials
- `PUT /api/bim/projects/<project_id>`: Updates project metadata (name, description, dimensions)
- `DELETE /api/bim/projects/<project_id>`: Removes project and cascades deletion to all objects/layers

**Object Endpoints:**
- `POST /api/bim/objects`: Adds a new geometric object to a specified project
- `GET /api/bim/objects/<object_id>`: Retrieves detailed properties of a single object
- `PUT /api/bim/objects/<object_id>`: Modifies object geometry, properties, or assignments
- `DELETE /api/bim/objects/<project_id>`: Removes object from the system
- `GET /api/bim/projects/<project_id>/objects`: Lists all objects belonging to a project

**Layer Endpoints:**
- `POST /api/bim/layers`: Creates a new organizational layer for grouping objects
- `GET /api/bim/projects/<project_id>/layers`: Returns all layers defined in a project
- `PUT /api/bim/layers/<layer_id>`: Updates layer appearance or state properties
- `DELETE /api/bim/layers/<layer_id>`: Removes layer and unassigns from objects

**Material Endpoints:**
- `GET /api/bim/materials`: Lists available materials with their properties
- `POST /api/bim/materials`: Registers a custom material with physical properties
- `GET /api/bim/materials/<material_id>`: Gets detailed material information

**Export Endpoints:**
- `POST /api/bim/export/ifc`: Generates Industry Foundation Classes export for BIM interoperability
- `POST /api/bim/export/dxf`: Creates AutoCAD Drawing Exchange Format file
- `POST /api/bim/export/svg`: Produces scalable vector graphic blueprint
- `POST /api/bim/export/json`: Dumps complete project structure to JSON format

**Import Endpoints:**
- `POST /api/bim/import/ifc`: Parses and imports IFC building model data
- `POST /api/bim/import/dxf`: Reads AutoCAD drawing file into project

**Tool Endpoints:**
- `POST /api/bim/tools/arc`: Generates arc geometry with curvature factor
- `POST /api/bim/tools/rectangle`: Creates rectangular primitive from corner points
- `POST /api/bim/tools/ellipse`: Constructs elliptical shape with radii and rotation
- `POST /api/bim/tools/door`: Instantiates door object with dimensions and swing direction

---

## 3. Frontend API Calls to BIM Backend

### bimClient.js (Primary API Client)
**Base URL:** `/api/v1` (from `import.meta.env.VITE_API_URL || '/api/v1'`)

All calls prepend `/bim/` to endpoint paths:

| Frontend Function | HTTP | Endpoint | Backend Status |
|-------------------|------|----------|----------------|
| `createProject()` | POST | `/api/v1/bim/projects` | ✅ Exists |
| `getProject()` | GET | `/api/v1/bim/projects/{id}` | ✅ Exists |
| `updateProject()` | PUT | `/api/v1/bim/projects/{id}` | ✅ Exists |
| `deleteProject()` | DELETE | `/api/v1/bim/projects/{id}` | ✅ Exists |
| `listProjects()` | GET | `/api/v1/bim/projects` | ✅ Exists |
| `createObject()` | POST | `/api/v1/bim/objects` | ✅ Exists |
| `getObject()` | GET | `/api/v1/bim/objects/{id}` | ✅ Exists |
| `updateObject()` | PUT | `/api/v1/bim/objects/{id}` | ✅ Exists |
| `deleteObject()` | DELETE | `/api/v1/bim/objects/{id}` | ✅ Exists |
| `getProjectObjects()` | GET | `/api/v1/bim/projects/{id}/objects` | ✅ Exists |
| `createLayer()` | POST | `/api/v1/bim/layers` | ✅ Exists |
| `getProjectLayers()` | GET | `/api/v1/bim/projects/{id}/layers` | ✅ Exists |
| `updateLayer()` | PUT | `/api/v1/bim/layers/{id}` | ✅ Exists |
| `deleteLayer()` | DELETE | `/api/v1/bim/layers/{id}` | ✅ Exists |
| `getMaterials()` | GET | `/api/v1/bim/materials` | ✅ Exists |
| `createMaterial()` | POST | `/api/v1/bim/materials` | ✅ Exists |
| `getMaterial()` | GET | `/api/v1/bim/materials/{id}` | ✅ Exists |
| `exportIFC()` | POST | `/api/v1/bim/export/ifc` | ✅ Exists |
| `exportDXF()` | POST | `/api/v1/bim/export/dxf` | ✅ Exists |
| `exportSVG()` | POST | `/api/v1/bim/export/svg` | ✅ Exists |
| `exportJSON()` | POST | `/api/v1/bim/export/json` | ✅ Exists |
| `importIFC()` | POST | `/api/v1/bim/import/ifc` | ✅ Exists |
| `importDXF()` | POST | `/api/v1/bim/import/dxf` | ✅ Exists |

### RectangleToolHandler.tsx (Direct Fetch Calls)
| Function | HTTP | Endpoint | Backend Status |
|----------|------|----------|----------------|
| `handleClick()` | POST | `/api/bim/tools/rectangle` | ✅ Exists |

### ArcToolHandler.tsx (Direct Fetch Calls)
| Function | HTTP | Endpoint | Backend Status |
|----------|------|----------|----------------|
| `handleClick()` | POST | `/api/bim/tools/arc` | ✅ Exists |

### scheduleExport.ts (Direct Fetch Calls)
| Function | HTTP | Endpoint | Backend Status |
|----------|------|----------|----------------|
| `exportScheduleToExcel()` | POST | `/api/bim/schedules/export/excel` | ❌ **MISSING** |
| `generateProjectReport()` | POST | `/api/bim/schedules/report` | ❌ **MISSING** |
| `exportAllSchedules()` | POST | `/api/bim/schedules/generate` | ❌ **MISSING** |

---

## 4. Endpoint Patterns Used

### Standard Pattern: `/api/bim/<resource>`
- **Projects:** `/api/bim/projects`, `/api/bim/projects/<id>`
- **Objects:** `/api/bim/objects`, `/api/bim/objects/<id>`
- **Layers:** `/api/bim/layers`, `/api/bim/layers/<id>`
- **Materials:** `/api/bim/materials`, `/api/bim/materials/<id>`

### Nested Resource Pattern: `/api/bim/projects/<id>/<resource>`
- `/api/bim/projects/<id>/objects`
- `/api/bim/projects/<id>/layers`

### Action Pattern: `/api/bim/<category>/<action>`
- **Export:** `/api/bim/export/ifc`, `/api/bim/export/dxf`, `/api/bim/export/svg`, `/api/bim/export/json`
- **Import:** `/api/bim/import/ifc`, `/api/bim/import/dxf`
- **Tools:** `/api/bim/tools/arc`, `/api/bim/tools/rectangle`, `/api/bim/tools/ellipse`, `/api/bim/tools/door`

### Versioned API Pattern: `/api/v1/bim/...`
- `/api/v1/bim/tools/ellipse` (legacy endpoint with different parameter names)

---

## 5. Response Formats for BIM Endpoints

### Standard Success Response
```json
{
  "success": true,
  "data": { /* endpoint-specific payload */ }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description"
  }
}
```

### Project List Response (GET /projects with pagination)
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Export Response
```json
{
  "success": true,
  "data": {
    "export_id": "uuid",
    "format": "IFC",
    "project_id": "uuid",
    "download_url": "/api/bim/download/uuid",
    "message": "IFC export generated successfully"
  }
}
```

### Import Response
```json
{
  "success": true,
  "data": {
    "import_id": "uuid",
    "format": "IFC",
    "filename": "file.ifc",
    "project_id": "uuid",
    "objects_imported": 0,
    "message": "IFC import completed successfully"
  }
}
```

### Tool Creation Response (Rectangle)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "rectangle",
    "corner": [x, y, z],
    "opposite_corner": [x, y, z],
    "width": 100,
    "height": 200,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "service": "BIM Workbench API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 6. Mismatches Between Frontend and Backend

### Critical Issues

#### 1. Missing Schedule Endpoints (HIGH PRIORITY)
**Frontend calls non-existent endpoints:**
- `/api/bim/schedules/export/excel` - Used by `exportScheduleToExcel()` in `scheduleExport.ts:103`
- `/api/bim/schedules/report` - Used by `generateProjectReport()` in `scheduleExport.ts:157`
- `/api/bim/schedules/generate` - Used by `exportAllSchedules()` in `scheduleExport.ts:267`

**Impact:** Schedule export and report generation features will fail with 404 errors.

---

### Medium Issues

#### 2. Base URL Mismatch Between Components
| Component | Base URL | Calls |
|-----------|----------|-------|
| `bimClient.js` | `/api/v1` | `/api/v1/bim/...` |
| `RectangleToolHandler.tsx` | None (absolute) | `/api/bim/tools/rectangle` |
| `ArcToolHandler.tsx` | None (absolute) | `/api/bim/tools/arc` |
| `scheduleExport.ts` | None (absolute) | `/api/bim/schedules/...` |

**Issue:** Inconsistent API base URL usage across frontend components. `bimClient.js` uses `/api/v1` while other components use `/api/bim`.

**Note:** This works because Flask routes are registered at `/api/bim` via Blueprint, so `/api/v1/bim/...` and `/api/bim/...` both resolve to the same handlers.

---

#### 3. Response Handling Inconsistency in bimClient.js
The response interceptor in `bimClient.js:29-37` expects:
```javascript
response.data.error.message
```

But backend error format is:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

**This matches correctly** - the interceptor will extract error messages properly.

---

#### 4. V1 API Ellipse Parameter Mismatch
**V1 API (`/api/v1/bim/tools/ellipse`):** Uses `rx`, `ry` parameters
**Current API (`/api/bim/tools/ellipse`):** Uses `radiusX`, `radiusY` parameters

**Frontend doesn't use the V1 endpoint** - `bimClient.js` doesn't expose a method for ellipse creation.

---

### Low Issues

#### 5. Response Type Handling for Exports
Frontend `exportIFC()`, `exportDXF()`, `exportSVG()` set `responseType: 'blob'` expecting binary file data.

Backend currently returns JSON with `download_url` field instead of actual file:
```json
{
  "success": true,
  "data": {
    "download_url": "/api/bim/download/uuid",
    ...
  }
}
```

**Impact:** Frontend expects blob but receives JSON. Need to either:
1. Update backend to return actual file (streaming response)
2. Update frontend to handle JSON and make second request to download_url

---

#### 6. Missing Delete Function for Materials
**Backend has:** DELETE `/api/bim/materials/<material_id>` (not implemented)
**Frontend bimClient.js:** No `deleteMaterial()` function

**Impact:** Cannot delete materials once created.

---

## Summary

| Issue Type | Count | Severity |
|------------|-------|----------|
| Missing endpoints (schedules) | 3 | HIGH |
| Inconsistent base URL usage | 1 | MEDIUM |
| Export response format mismatch | 1 | MEDIUM |
| Missing material delete | 1 | LOW |

**Total High Priority:** 3 (all schedule-related endpoints)
**Total Medium Priority:** 2
**Total Low Priority:** 1
