# Future Sprint Prompts - Ceiling Panel Calculator Platform

**Comprehensive Execution Prompts for Sprints 7-10**
Ready-to-use prompts for your next Claude Code sessions

---

## Overview

These sprints complete the platform vision:

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| **Sprint 7** | Web Interface & REST API | Flask/FastAPI endpoints, React dashboard, WebSocket real-time |
| **Sprint 8** | Advanced AI/ML | TensorFlow integration, computer vision, generative design |
| **Sprint 9** | Cloud & DevOps | Docker, Kubernetes, CI/CD, cloud deployment |
| **Sprint 10** | Enterprise & Polish | Multi-tenancy, billing, documentation, final testing |

---

## Sprint 7: Web Interface & REST API

### Prompt 1: REST API Foundation

```
Hello! I need you to build a comprehensive REST API for my Ceiling Panel Calculator platform.

Context files to read first:
- /home/user/ceiling/ARCHITECTURE.md (system architecture)
- /home/user/ceiling/ceiling_panel_calc.py (core calculation)
- /home/user/ceiling/gui_server.py (existing Flask skeleton)
- /home/user/ceiling/system_orchestrator.py (orchestration layer)

Tasks:
1. Create `api/` directory with proper structure:
   - api/__init__.py
   - api/routes/__init__.py
   - api/routes/calculations.py
   - api/routes/projects.py
   - api/routes/materials.py
   - api/routes/exports.py
   - api/middleware/auth.py
   - api/middleware/rate_limit.py
   - api/schemas.py (Pydantic models)

2. Implement these endpoints:
   POST /api/v1/calculate - Run panel calculation
   GET /api/v1/calculate/{id} - Get calculation result
   POST /api/v1/projects - Create new project
   GET /api/v1/projects - List projects
   GET /api/v1/projects/{id} - Get project details
   PUT /api/v1/projects/{id} - Update project
   DELETE /api/v1/projects/{id} - Delete project
   GET /api/v1/materials - List available materials
   POST /api/v1/exports/svg - Generate SVG
   POST /api/v1/exports/dxf - Generate DXF
   POST /api/v1/exports/3d - Generate 3D model (OBJ/STL/GLTF)
   GET /api/v1/health - Health check

3. Add proper:
   - Request validation with Pydantic
   - Error handling with consistent JSON responses
   - API versioning (v1)
   - OpenAPI/Swagger documentation
   - Rate limiting (100 req/min)
   - JWT authentication

4. Create `api/app.py` as the main FastAPI/Flask application

5. Write tests in `tests/test_api.py`

Use FastAPI if possible (better async support), otherwise Flask is fine.

Critical: Every endpoint should return proper JSON with consistent structure:
{
  "success": true/false,
  "data": {...} or null,
  "error": null or {"code": "...", "message": "..."}
}
```

### Prompt 2: WebSocket Real-Time Updates

```
I need you to add WebSocket support for real-time updates to the Ceiling Panel Calculator.

Context files:
- /home/user/ceiling/api/app.py (REST API from previous sprint)
- /home/user/ceiling/monitoring_dashboard.py (monitoring system)
- /home/user/ceiling/iot_sensor_network.py (sensor data)

Tasks:
1. Create `api/websocket/` directory:
   - api/websocket/__init__.py
   - api/websocket/handlers.py
   - api/websocket/events.py
   - api/websocket/rooms.py

2. Implement WebSocket endpoints:
   ws://host/ws/calculations/{project_id} - Real-time calculation progress
   ws://host/ws/monitoring - Live sensor/monitoring data
   ws://host/ws/notifications - System alerts and notifications

3. Event types to support:
   - calculation.started
   - calculation.progress (0-100%)
   - calculation.completed
   - calculation.failed
   - sensor.reading
   - alert.new
   - alert.resolved

4. Add connection management:
   - Room-based subscriptions
   - Heartbeat/ping-pong
   - Reconnection handling
   - Max connections per user

5. Integrate with existing monitoring_dashboard.py to push real-time data

6. Create client example in `examples/websocket_client.py`

Use python-socketio or websockets library.
```

### Prompt 3: React Dashboard Frontend

```
Build a React dashboard for the Ceiling Panel Calculator platform.

Context:
- /home/user/ceiling/api/app.py (REST API)
- /home/user/ceiling/ARCHITECTURE.md (system overview)

Create a new `frontend/` directory with a React application:

1. Project setup:
   frontend/
   ├── package.json
   ├── vite.config.js (use Vite)
   ├── src/
   │   ├── main.jsx
   │   ├── App.jsx
   │   ├── api/client.js (API wrapper)
   │   ├── components/
   │   │   ├── Layout/
   │   │   ├── Calculator/
   │   │   ├── Projects/
   │   │   ├── Visualization/
   │   │   └── Monitoring/
   │   ├── hooks/
   │   ├── context/
   │   └── styles/

2. Pages/Features:
   - Dashboard home with project overview
   - Calculator form with live preview
   - 2D SVG visualization (render SVG from API)
   - 3D viewer (using Three.js for OBJ/GLTF)
   - Project management (CRUD)
   - Material library browser
   - Real-time monitoring view (WebSocket)
   - Export download center

3. UI Components:
   - Dimension input with unit conversion (mm/cm/m/ft/in)
   - Material selector with visual previews
   - Panel layout preview (real-time as you type)
   - 3D orbit viewer
   - Alert/notification toast system

4. State management with React Context or Zustand

5. Use Tailwind CSS for styling

6. Responsive design (desktop + tablet)

Create production-ready code with proper error handling and loading states.
```

---

## Sprint 8: Advanced AI/ML Integration

### Prompt 1: TensorFlow Design Optimizer

```
Integrate TensorFlow/Keras for advanced design optimization in the Ceiling Panel Calculator.

Context files:
- /home/user/ceiling/quantum_optimizer.py (current optimizer)
- /home/user/ceiling/reinforcement_optimizer.py (RL optimizer)
- /home/user/ceiling/ceiling_panel_calc.py (core calculations)

Tasks:
1. Create `ml/` directory:
   - ml/__init__.py
   - ml/models/__init__.py
   - ml/models/layout_predictor.py
   - ml/models/cost_estimator.py
   - ml/models/aesthetic_scorer.py
   - ml/training/__init__.py
   - ml/training/data_generator.py
   - ml/training/train_layout.py
   - ml/inference.py

2. Implement Layout Prediction Model:
   - Input: ceiling dimensions, gap specs, constraints
   - Output: optimal panel configuration (panels_x, panels_y, dimensions)
   - Architecture: Dense neural network with 3-4 hidden layers
   - Training: Generate synthetic data from quantum_optimizer results

3. Implement Cost Estimation Model:
   - Input: layout parameters, material properties
   - Output: estimated total cost, material cost, labor cost
   - Use regression with ensemble approach

4. Implement Aesthetic Scoring Model:
   - Input: layout parameters, panel aspect ratios
   - Output: aesthetic score 0-100
   - Train on golden ratio and design principles

5. Create training data generator that:
   - Generates 10,000+ layout scenarios
   - Uses quantum_optimizer to get "optimal" labels
   - Augments with noise for robustness

6. Add model serving:
   - Load trained models on startup
   - Provide predict() API
   - Fall back to quantum_optimizer if model fails

7. Integration with API:
   POST /api/v1/calculate/ml - Use ML-based prediction (faster)
   POST /api/v1/calculate/optimize - Use full optimization (slower, more accurate)

Make models optional - system works without TensorFlow installed.
```

### Prompt 2: Computer Vision for Floor Plans

```
Add computer vision capabilities to extract ceiling dimensions from floor plan images.

Context:
- /home/user/ceiling/ceiling_panel_calc.py (needs dimensions as input)
- /home/user/ceiling/api/app.py (API endpoints)

Tasks:
1. Create `vision/` directory:
   - vision/__init__.py
   - vision/floor_plan_parser.py
   - vision/dimension_extractor.py
   - vision/room_detector.py
   - vision/scale_detector.py

2. Floor Plan Parser:
   - Accept image uploads (PNG, JPG, PDF first page)
   - Detect room boundaries using edge detection
   - Find scale indicator if present
   - Extract dimension annotations (OCR)
   - Output list of rooms with dimensions

3. Processing Pipeline:
   a. Preprocess image (denoise, contrast enhancement)
   b. Detect walls/boundaries (Canny edge + Hough transform)
   c. Find rooms (contour detection)
   d. OCR for dimension text (using pytesseract or easyocr)
   e. Match dimensions to rooms
   f. Apply scale factor

4. Room Detection:
   - Identify rectangular rooms
   - Handle L-shaped and complex rooms
   - Output bounding boxes with confidence scores

5. API Integration:
   POST /api/v1/vision/parse - Upload floor plan image
   Response: {
     "rooms": [
       {"name": "Room 1", "width_mm": 5000, "length_mm": 4000, "confidence": 0.85}
     ],
     "scale_detected": true,
     "scale_factor": 0.01
   }

6. Create demo in `examples/floor_plan_demo.py`

Use OpenCV for image processing, pytesseract or easyocr for OCR.
Optional: Use a pre-trained model for room segmentation.
```

### Prompt 3: Generative Design AI

```
Implement generative design capabilities for creating novel ceiling layouts.

Context:
- /home/user/ceiling/ai_generative_engine.py (existing skeleton)
- /home/user/ceiling/emotional_design_optimizer.py (design principles)
- /home/user/ceiling/quantum_optimizer.py (optimization)

Tasks:
1. Enhance `ai_generative_engine.py` with:
   - Pattern generation algorithms
   - Style transfer for ceiling aesthetics
   - Constraint-based generation
   - Multi-objective optimization

2. Create `generative/` directory:
   - generative/__init__.py
   - generative/patterns.py (pattern library)
   - generative/styles.py (style definitions)
   - generative/generator.py (main generator)
   - generative/evaluator.py (design evaluation)

3. Pattern Types to Generate:
   - Grid patterns (standard, offset, herringbone)
   - Organic patterns (voronoi, perlin noise based)
   - Geometric patterns (hexagonal, triangular)
   - Custom patterns (user-defined rules)

4. Generation Process:
   a. User specifies: dimensions, style preferences, constraints
   b. Generator creates N candidate designs
   c. Evaluator scores each on: efficiency, aesthetics, cost, acoustics
   d. Return top K designs ranked

5. API Endpoints:
   POST /api/v1/generate/designs - Generate design options
   {
     "ceiling_length_mm": 6000,
     "ceiling_width_mm": 5000,
     "style": "modern", // modern, classic, organic, minimal
     "pattern": "grid", // grid, offset, hexagonal, organic
     "num_options": 5,
     "constraints": {
       "max_panel_size_mm": 2400,
       "min_panels": 4
     }
   }

   Response: Array of design options with visualizations

6. SVG preview generation for each option

7. Save/load favorite designs to project
```

---

## Sprint 9: Cloud & DevOps

### Prompt 1: Docker Containerization

```
Containerize the Ceiling Panel Calculator platform with Docker.

Context:
- /home/user/ceiling/requirements.txt (dependencies)
- /home/user/ceiling/api/app.py (API application)
- /home/user/ceiling/ARCHITECTURE.md (system overview)

Tasks:
1. Create Docker configuration:
   - Dockerfile (main application)
   - Dockerfile.worker (background worker for heavy computation)
   - docker-compose.yml (full stack)
   - docker-compose.dev.yml (development)
   - docker-compose.prod.yml (production)
   - .dockerignore

2. Main Dockerfile:
   - Base: python:3.11-slim
   - Multi-stage build (builder + runtime)
   - Non-root user
   - Health check
   - Proper signal handling
   - Optimized layer caching

3. docker-compose.yml services:
   - api: Main API service (port 8000)
   - worker: Background task worker
   - redis: Task queue and caching
   - postgres: Database (optional, for project storage)
   - nginx: Reverse proxy with SSL
   - frontend: React app (production build served by nginx)

4. Environment configuration:
   - .env.example with all variables
   - Secrets management (Docker secrets or env vars)
   - Different configs for dev/staging/prod

5. Volume mounts:
   - ./output:/app/output (generated files)
   - ./logs:/app/logs (log files)
   - postgres_data:/var/lib/postgresql/data

6. Networking:
   - Internal network for services
   - Only nginx exposed externally

7. Health checks for all services

8. Create Makefile with common commands:
   make build
   make up
   make down
   make logs
   make test
   make shell

9. Documentation in DOCKER.md
```

### Prompt 2: Kubernetes Deployment

```
Create Kubernetes manifests for deploying the Ceiling Panel Calculator to a cluster.

Context:
- /home/user/ceiling/Dockerfile (containerized app)
- /home/user/ceiling/docker-compose.yml (service definitions)

Tasks:
1. Create `k8s/` directory:
   - k8s/namespace.yaml
   - k8s/configmap.yaml
   - k8s/secrets.yaml (template)
   - k8s/deployments/
   │   ├── api.yaml
   │   ├── worker.yaml
   │   └── frontend.yaml
   - k8s/services/
   │   ├── api.yaml
   │   └── frontend.yaml
   - k8s/ingress.yaml
   - k8s/hpa.yaml (Horizontal Pod Autoscaler)
   - k8s/pdb.yaml (Pod Disruption Budget)
   - k8s/jobs/
   │   └── db-migrate.yaml

2. Deployment specifications:
   - Resource limits and requests
   - Liveness and readiness probes
   - Rolling update strategy
   - Pod anti-affinity for HA
   - Init containers for dependencies

3. Autoscaling:
   - HPA based on CPU/memory
   - Scale 2-10 replicas for API
   - Scale 1-5 replicas for worker

4. Ingress:
   - TLS termination
   - Path-based routing (/api/*, /*)
   - Rate limiting annotations
   - CORS headers

5. Create Helm chart in `charts/ceiling-calculator/`:
   - Chart.yaml
   - values.yaml
   - values-dev.yaml
   - values-prod.yaml
   - templates/

6. CI/CD integration notes in k8s/README.md

7. Monitoring setup:
   - ServiceMonitor for Prometheus
   - Annotations for log collection
```

### Prompt 3: CI/CD Pipeline

```
Create a complete CI/CD pipeline for the Ceiling Panel Calculator.

Context:
- /home/user/ceiling/ (full repository)
- /home/user/ceiling/Dockerfile
- /home/user/ceiling/k8s/ (Kubernetes manifests)

Tasks:
1. Create `.github/workflows/`:
   - ci.yml (continuous integration)
   - cd-staging.yml (deploy to staging)
   - cd-production.yml (deploy to production)
   - release.yml (version releases)

2. CI Pipeline (ci.yml) - runs on every PR:
   - Checkout code
   - Setup Python 3.11
   - Install dependencies
   - Run linting (flake8, black --check)
   - Run type checking (mypy)
   - Run unit tests (pytest)
   - Run integration tests
   - Build Docker image
   - Security scan (trivy)
   - Upload coverage to Codecov
   - Comment test results on PR

3. CD Staging (cd-staging.yml) - on merge to main:
   - Build and tag Docker image
   - Push to container registry
   - Deploy to staging K8s cluster
   - Run smoke tests
   - Notify Slack on success/failure

4. CD Production (cd-production.yml) - manual trigger:
   - Require approval
   - Deploy to production K8s cluster
   - Canary deployment (10% → 50% → 100%)
   - Automated rollback on failure
   - Post-deploy health checks

5. Release Pipeline (release.yml) - on version tag:
   - Build final images
   - Generate changelog
   - Create GitHub release
   - Publish Python package (optional)
   - Update documentation

6. Create supporting files:
   - .github/CODEOWNERS
   - .github/pull_request_template.md
   - .github/ISSUE_TEMPLATE/
   - scripts/smoke-test.sh
   - scripts/rollback.sh

7. Branch protection rules documentation
```

---

## Sprint 10: Enterprise Features & Polish

### Prompt 1: Multi-Tenancy & User Management

```
Implement multi-tenancy and user management for the Ceiling Panel Calculator.

Context:
- /home/user/ceiling/api/app.py (API)
- /home/user/ceiling/iot_security.py (security patterns)

Tasks:
1. Create `auth/` directory:
   - auth/__init__.py
   - auth/models.py (User, Organization, Role)
   - auth/jwt_handler.py
   - auth/permissions.py
   - auth/oauth.py (Google, Microsoft SSO)

2. User Management:
   - User registration and verification
   - Password reset flow
   - Profile management
   - API key generation
   - Session management

3. Organization/Tenant Support:
   - Organization CRUD
   - Invite users to organization
   - Role-based access (Admin, Editor, Viewer)
   - Organization-level settings
   - Data isolation between orgs

4. API Endpoints:
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   POST /api/v1/auth/logout
   POST /api/v1/auth/refresh
   POST /api/v1/auth/forgot-password
   GET /api/v1/users/me
   PUT /api/v1/users/me
   GET /api/v1/organizations
   POST /api/v1/organizations
   POST /api/v1/organizations/{id}/invite
   GET /api/v1/organizations/{id}/members

5. Permission System:
   - Resource-based permissions
   - Project sharing between users
   - Public/private projects
   - Permission inheritance

6. Database models (SQLAlchemy):
   - Users table
   - Organizations table
   - Memberships table (user-org relationship)
   - API_Keys table
   - Sessions table

7. Add middleware to check permissions on all endpoints

8. Audit logging for security events
```

### Prompt 2: Billing & Usage Tracking

```
Implement billing and usage tracking for the Ceiling Panel Calculator SaaS.

Context:
- /home/user/ceiling/auth/ (user management)
- /home/user/ceiling/api/app.py (API)

Tasks:
1. Create `billing/` directory:
   - billing/__init__.py
   - billing/models.py
   - billing/plans.py
   - billing/usage.py
   - billing/stripe_integration.py
   - billing/invoices.py

2. Subscription Plans:
   ```python
   PLANS = {
     "free": {
       "calculations_per_month": 10,
       "projects": 3,
       "export_formats": ["svg"],
       "price_monthly": 0
     },
     "pro": {
       "calculations_per_month": 500,
       "projects": 50,
       "export_formats": ["svg", "dxf", "3d"],
       "ml_optimization": True,
       "price_monthly": 29
     },
     "enterprise": {
       "calculations_per_month": -1,  # unlimited
       "projects": -1,
       "export_formats": ["all"],
       "api_access": True,
       "sso": True,
       "price_monthly": "custom"
     }
   }
   ```

3. Usage Tracking:
   - Track API calls per user/org
   - Track calculations performed
   - Track exports generated
   - Track storage used
   - Daily/monthly aggregation

4. Stripe Integration:
   - Subscription management
   - Payment method handling
   - Invoice generation
   - Webhook handling
   - Proration for plan changes

5. API Endpoints:
   GET /api/v1/billing/plans
   GET /api/v1/billing/subscription
   POST /api/v1/billing/subscribe
   POST /api/v1/billing/cancel
   PUT /api/v1/billing/payment-method
   GET /api/v1/billing/invoices
   GET /api/v1/billing/usage

6. Usage Limit Enforcement:
   - Check limits before operations
   - Return 429 when limit exceeded
   - Upgrade prompts in response

7. Admin Dashboard Data:
   - Revenue metrics
   - User growth
   - Feature usage analytics
```

### Prompt 3: Documentation & Final Polish

```
Create comprehensive documentation and final polish for the Ceiling Panel Calculator.

Context:
- /home/user/ceiling/ (entire codebase)
- /home/user/ceiling/ARCHITECTURE.md (architecture doc)

Tasks:
1. Create `docs/` directory with MkDocs:
   - docs/index.md (home)
   - docs/getting-started/
   │   ├── installation.md
   │   ├── quick-start.md
   │   └── configuration.md
   - docs/user-guide/
   │   ├── calculations.md
   │   ├── projects.md
   │   ├── exports.md
   │   ├── 3d-visualization.md
   │   └── monitoring.md
   - docs/api-reference/
   │   ├── authentication.md
   │   ├── endpoints.md
   │   └── webhooks.md
   - docs/developer-guide/
   │   ├── architecture.md
   │   ├── contributing.md
   │   ├── testing.md
   │   └── deployment.md
   - docs/tutorials/
   │   ├── first-calculation.md
   │   ├── building-design.md
   │   └── integration.md
   - mkdocs.yml

2. API Documentation:
   - OpenAPI/Swagger spec (auto-generated)
   - Postman collection
   - Code examples in Python, JavaScript, cURL

3. Code Documentation:
   - Docstrings on all public functions
   - Type hints throughout
   - README.md for each module directory

4. User-Facing Content:
   - FAQ page
   - Troubleshooting guide
   - Video tutorial scripts
   - Changelog

5. Developer Experience:
   - CONTRIBUTING.md with guidelines
   - CODE_OF_CONDUCT.md
   - Issue templates
   - PR templates

6. Final Polish:
   - Consistent error messages
   - User-friendly validation errors
   - Loading states in UI
   - Empty states in UI
   - 404/500 error pages

7. Performance Optimization:
   - API response caching
   - Database query optimization
   - Image/asset optimization
   - Bundle size optimization

8. Accessibility:
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Color contrast

9. Create demo environment:
   - Demo account with sample data
   - Reset script for demo
   - Rate limiting for demo
```

---

## Bonus: Integration Sprint

### Prompt: Third-Party Integrations

```
Add third-party integrations to make the Ceiling Panel Calculator work with industry tools.

Context:
- /home/user/ceiling/api/app.py (API)
- /home/user/ceiling/renderer_3d.py (3D export)

Tasks:
1. Create `integrations/` directory:
   - integrations/__init__.py
   - integrations/autodesk.py (AutoCAD, Revit)
   - integrations/sketchup.py
   - integrations/blender.py
   - integrations/spreadsheets.py (Excel, Google Sheets)
   - integrations/project_management.py (Asana, Monday, Jira)

2. AutoCAD/Revit Integration:
   - Enhanced DXF export with layers
   - Revit family parameter export
   - AutoCAD script generation

3. SketchUp Integration:
   - SKP file export
   - Component definitions
   - Material mappings

4. Blender Integration:
   - Blender Python script export
   - Material node setup
   - Animation-ready rigs

5. Spreadsheet Export:
   - Excel with formatting and formulas
   - Google Sheets API integration
   - Material schedules
   - Cost breakdowns

6. Project Management:
   - Create tasks from projects
   - Sync project status
   - Attach exports to tasks

7. Webhooks (outgoing):
   - Project created/updated/deleted
   - Calculation completed
   - Export generated
   - Configurable per organization

8. API Endpoints:
   POST /api/v1/integrations/connect/{provider}
   DELETE /api/v1/integrations/disconnect/{provider}
   GET /api/v1/integrations/status
   POST /api/v1/exports/autodesk
   POST /api/v1/exports/sketchup
   POST /api/v1/webhooks/configure
```

---

## Usage Instructions

1. **Copy the prompt** you want to execute
2. **Start a new Claude Code session** (or continue existing)
3. **Paste the prompt** and let Claude execute
4. **Review the output** and provide feedback
5. **Commit and push** when satisfied

### Tips for Best Results

- Run prompts in order within each sprint
- Provide feedback if something doesn't work as expected
- Ask Claude to read existing files before making changes
- Request tests for critical functionality
- Commit frequently to avoid losing work

### Customization

Feel free to modify these prompts:
- Add specific technologies you prefer
- Remove features you don't need
- Adjust complexity based on your timeline
- Split large prompts into smaller chunks

---

**Document Version:** 1.0
**Created:** January 11, 2026
**For:** Ceiling Panel Calculator Platform
