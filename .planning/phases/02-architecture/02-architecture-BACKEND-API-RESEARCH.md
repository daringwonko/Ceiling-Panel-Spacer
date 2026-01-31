# Scout Report: Backend API Patterns

**Scouted:** Sat Jan 31 2026  
**Target Phase:** 02-architecture (Backend API Research)

## What We Found (Tier 1 - Stable)

### Codebase Location
- Primary API Routes: `/api/routes/` (calculations, projects, materials, exports, health)
- FastAPI Application: `api/app.py`
- Pydantic Schemas: `api/schemas.py`
- SQLAlchemy Models: `src/db/models.py`
- Middleware: `api/middleware/` (auth.py, rate_limit.py)
- WebSocket Support: `api/websocket/` (rooms.py, handlers.py, events.py)

### Existing Patterns

#### REST API Architecture  
- FastAPI-based asynchronous API server
- 5 route modules with clear separation of concerns
- Standard REST conventions (GET, POST, PUT, DELETE) 
- JSON request/response format throughout
- Pydantic v1/v2 for data validation and serialization

#### CRUD Operations

**Projects (Complete CRUD):**
- GET `/projects/` - list all projects with pagination
- POST `/projects/` - create new ceiling project
- GET `/projects/{uuid}` - retrieve specific project details  
- PUT `/projects/{uuid}` - update project configuration
- DELETE `/projects/{uuid}` - remove project and associated data

**Materials (Complete CRUD):**
- GET `/materials/` - list available material types/costs
- POST `/materials/` - add custom material definitions
- GET `/materials/{id}` - get specific material properties
- PUT `/materials/{id}` - modify material specifications  
- DELETE `/materials/{id}` - remove unused materials

**Calculations (Processing-Centric):**
- POST `/calculations/calculate` - accept dimensions/gaps → return layout result

**Exports (Multi-Format Output):**
- POST `/exports/json/{project_id}` - structured JSON export
- POST `/exports/dxf/{project_id}` - CAD-ready DXF files  
- POST `/exports/svg/{project_id}` - vector blueprint graphics
- POST `/exports/report/{project_id}` - technical reports with specs/costs

**Health Monitoring:**
- GET `/health` - system status and basic metrics

#### Middleware Chain
- Rate limiting middleware (configurable thresholds)
- Authentication middleware (@require_auth decorator pattern)  
- CORS middleware (likely configured for frontend integration)

#### Database Integration
- SQLAlchemy ORM with core domain models:
  - `User` - authentication and ownership tracking
  - `Project` - ceiling design configurations
  - `Material` - material specifications and costing
  - `CeilingLayout` - calculated panel arrangements  
  - `Calculation` - persisted calculation history
- Relationship mappings (projects↔layouts↔calculations, projects↔materials)
- Session management handled in models.py

#### WebSocket Infrastructure  
- Room-based real-time communication
- Event handling framework
- Intended for live updates during ceiling calibration process

### Dependencies
- **fastapi** - async REST API framework
- **sqlalchemy** - ORM for database operations  
- **pydantic** - data validation and serialization
- **uvicorn** - ASGI server for WebSocket + HTTP
- Authentication library (TBD - basic auth placeholder implemented)

## What We Need (Tier 2 - Decision-Dependent)

### Unknowns Awaiting Phase N Decisions
- Authentication implementation (OAuth2/JWT vs basic auth vs API keys)
- WebSocket event structure for real-time ceiling editor updates
- Database connection/session strategy (per request vs pooled connections vs async sessions)
- Frontend-backend state synchronization patterns
- Rate limiting policies (per user, per endpoint, burst handling)
- Error response format standardization
- Background task handling for heavy calculations

### Questions for Planner
1. **Authentication Strategy:** Complete existing basic auth, or migrate to JWT/OAuth2 for modern React frontend compatibility?
2. **Real-Time Updates:** What WebSocket events needed for live ceiling calculation previews and collaborative editing?
3. **Session Management:** Session-per-request pattern, or connection pooling with async SQLAlchemy?
4. **State Sync:** Should frontend use Redux/SWR/context for optimistic updates, or simple fetch calls?
5. **Error Handling:** What are key ceiling calculation failure modes (invalid dimensions, material conflicts, etc.)?
6. **Performance:** Should heavy calculations be synchronous, queued as background tasks, or streamed with WebSockets?
7. **CORS:** What frontend domains need access (development, staging, production URLs)?

## Recommendations

### Implementation Approach
1. **Phase 1:** Complete authentication middleware with JWT (modern standard, good React integration)
2. **Phase 2:** Implement WebSocket rooms for project-specific real-time updates during calibration
3. **Phase 3:** Add database service layer with proper connection pooling and session management
4. **Phase 4:** Configure comprehensive CORS and error response standardization
5. **Phase 5:** Add optimistic updates support in API responses for fast UI feedback
6. **Phase 6:** Background task support for heavy calculation workloads

### Risk Assessment
- **Authentication Integration:** Medium risk - frontend/backend compatibility crucial
- **WebSocket Scalability:** Low-Medium risk - ceiling design has moderate concurrent users (max dozens)
- **Database Performance:** Medium risk - avoided by query optimization and background processing
- **Real-Time Features:** Low risk - WebSockets needed for calibration but not mission-critical

---

*Scout Report Complete*
