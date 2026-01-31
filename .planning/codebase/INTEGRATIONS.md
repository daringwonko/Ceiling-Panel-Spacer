# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**CAD/Design Export:**
- ezdxf library - DXF file generation for AutoCAD/Revit compatibility
  - File: `core/ceiling_panel_calc.py` lines 152-228
  - Fallback: Manual DXF format generation if library unavailable
  - Output: CAD-ready `.dxf` files

**IoT Communication:**
- MQTT broker (Eclipse Mosquitto or compatible)
  - Host: Configurable (default: `localhost:1883`)
  - Client library: paho-mqtt
  - Topics:
    - `ceiling/sensors/+/data` - Sensor data ingestion
    - `ceiling/nodes/+/status` - Node status updates
    - `ceiling/commands/+` - Command distribution
    - `ceiling/nodes/{id}/registration` - Node registration
  - File: `iot/iot_sensor_network.py` lines 208-285

**Authentication Providers:**
- JWT (JSON Web Tokens) - Primary authentication mechanism
  - Algorithm: HS256
  - Secret: Environment variable `JWT_SECRET`
  - Expiration: 24 hours default
  - Files: `api/middleware/auth.py`, `iot/iot_security.py`

**Billing/Payments (Planned):**
- Stripe (referenced in `billing/plans.py`)
  - Fields: `stripe_subscription_id`, `stripe_customer_id`, `stripe_invoice_id`
  - Status: Model fields present, integration not fully implemented

## Data Storage

**Primary Database:**
- SQLite 3 - Embedded database for development and IoT data
  - Files: `sensor_network.db`, `security.db`
  - Tables: sensor_nodes, sensor_data, api_keys, jwt_tokens, security_events
  - File: `iot/iot_sensor_network.py` lines 89-205

**Configuration Storage:**
- JSON files - Application configuration and project exports
  - Files: `default_config.json`, `ceiling_project.json` (example)
  - Format: Structured JSON with metadata, ceiling specs, layout results

**File Storage:**
- Local filesystem - Output directory for generated files
  - DXF files (CAD)
  - SVG files (vector blueprints)
  - TXT reports
  - JSON exports
  - Path: Configurable via `output_dir` parameter (default: current directory)

**Kubernetes Storage:**
- emptyDir volumes - Temporary storage for container outputs
  - Mount path: `/app/output`
  - File: `k8s/deployments/api.yaml` lines 74-79

## Authentication & Identity

**Auth Provider:** Custom implementation with JWT

**Implementation Details:**
- API Key authentication (for IoT devices and service accounts)
  - Key format: 64-character hex string
  - Storage: SHA256 hash in SQLite database
  - Rate limiting: Per-key configurable (default 100 req/min)
  - File: `iot/iot_security.py` lines 41-88, 406-430

- JWT Token authentication (for users)
  - Roles: guest, operator, maintenance, administrator
  - Permissions: Granular (e.g., `read:sensors`, `write:commands`)
  - Storage: SQLite with revocation support
  - File: `iot/iot_security.py` lines 67-87, 436-500

- Password hashing: PBKDF2-HMAC-SHA256 (100,000 iterations)
  - File: `api/middleware/auth.py` lines 220-238

**Authorization Patterns:**
- Decorator-based: `@require_auth()`, `@require_permission('read:sensors')`
- Flask g-object for request context user storage
- Rate limiting integrated with auth (per-user/per-key limits)

## Monitoring & Observability

**Error Tracking:**
- Built-in logging (Python standard library)
  - Level: INFO default, configurable via `LOG_LEVEL` env var
  - Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

**Health Checks:**
- Kubernetes probes configured
  - Liveness: `GET /api/v1/health/live`
  - Readiness: `GET /api/v1/health/ready`
  - File: `k8s/deployments/api.yaml` lines 58-73

**API Response Headers:**
- `X-API-Version` - API version identifier
- `X-Request-Time` - UTC timestamp
- Rate limit headers (X-RateLimit-*)

## CI/CD & Deployment

**Hosting:**
- Kubernetes (production)
  - NGINX Ingress Controller
  - cert-manager for TLS (Let's Encrypt)
  - PodDisruptionBudget implied by maxUnavailable: 0
  - HPA (Horizontal Pod Autoscaler) configured (file: `k8s/hpa.yaml`)

**Container Orchestration:**
- Namespace: `ceiling-calculator`
- Service Account: `ceiling-api`
- Security Context: runAsNonRoot: true, runAsUser: 1000
- Resource limits: 256Mi-512Mi memory, 250m-500m CPU

**Local Development:**
- Flask development server (`app.run()`)
- Vite dev server (frontend)
- Port: 5000 (backend), 5173 (frontend default)

## Environment Configuration

**Required Environment Variables:**
- `JWT_SECRET` - Required for production (signing JWTs)
- `DATABASE_URL` - Required in Kubernetes (PostgreSQL referenced but SQLite used)
- `SECRET_KEY` - Flask session security

**Optional Environment Variables:**
- `PORT` - Server port (default: 5000/8000)
- `FLASK_DEBUG` - Debug mode (default: false)
- `CORS_ORIGINS` - Comma-separated allowed origins (default: *)
- `LOG_LEVEL` - Logging verbosity (default: INFO)

**Secrets Management:**
- Kubernetes Secrets: `ceiling-secrets` namespace
  - Keys: `database-url`, `jwt-secret`
  - File: `k8s/deployments/api.yaml` lines 41-50

## Webhooks & Callbacks

**Incoming Webhooks:**
- Endpoint: `POST /api/integration/webhook`
  - File: `web/gui_server.py` lines 479-504
  - Supported sources (extensible):
    - `building_management_system`
    - `energy_provider`
    - `maintenance_system`
  - Authentication: Requires JWT/API key
  - Current implementation: Placeholder (pass statements)

**Outgoing Callbacks:**
- MQTT callbacks for sensor data
  - File: `iot/iot_sensor_network.py` lines 387-389, 334-339
  - Pattern: Register callback functions for real-time data processing

**Data Export Endpoints:**
- `GET /api/integration/export/json` - Full system data export
- `GET /api/integration/export/csv` - CSV format (not implemented, returns 501)
  - File: `web/gui_server.py` lines 507-547

## Third-Party Libraries (Not Services)

**No external SaaS integrations detected for:**
- No Stripe API calls (models only)
- No cloud storage (AWS S3, GCS, Azure Blob)
- No external databases (Redis, PostgreSQL in code, SQLite in practice)
- No monitoring services (DataDog, New Relic, Sentry)
- No email services (SendGrid, AWS SES)
- No push notification services

**Note:** The billing module (`billing/plans.py`) contains Stripe model fields but no actual Stripe API integration code was found.

---

*Integration audit: 2026-01-31*
