# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- Python 3.8+ - Core backend calculation engine, API, IoT services, and ML models
  - Main files: `core/ceiling_panel_calc.py`, `api/app.py`, `iot/iot_sensor_network.py`
- TypeScript/JavaScript - Frontend React application
  - Main location: `frontend/` directory with Vite-based build system

**Configuration/Template:**
- YAML - Kubernetes manifests, GitHub Actions workflows
  - Location: `k8s/`, `.github/workflows/`
- JSON - Application configuration, data exchange
  - Key files: `default_config.json`, `frontend/package.json`

## Runtime

**Environment:**
- Python 3.8+ (backend services)
- Node.js 18+ (frontend build environment)

**Package Managers:**
- pip - Python package management
  - Files: `requirements.txt`, `gui_requirements.txt`
  - Lockfile: Not present (uses loose versioning with `>=` constraints)
- npm - Node.js frontend dependencies
  - File: `frontend/package-lock.json` (lockfile present)

## Frameworks

**Core Web Framework:**
- Flask 2.0+ - REST API backend
  - File: `api/app.py`, `web/gui_server.py`
  - Extensions: Flask-CORS for cross-origin requests
  - Routes organized in blueprint pattern under `api/routes/`

**Frontend Framework:**
- React 18.2+ - UI component library
  - File: `frontend/package.json`
  - Router: React Router DOM v6
  - State Management: Zustand (lightweight state)
  - Data Fetching: TanStack React Query v5
  - HTTP Client: Axios

**3D Visualization:**
- Three.js 0.159+ - WebGL 3D rendering
  - React Three Fiber - React integration for Three.js
  - React Three Drei - Utility components for R3F
  - File: `output/renderer_3d.py` (Python), `frontend/` (JavaScript)

**Testing:**
- pytest 6.0+ - Python test runner
  - Extensions: pytest-cov (coverage), pytest-asyncio (async)
  - Config: No explicit config file, uses defaults
- Vitest 1.0+ - Frontend test runner (Vite-native)
  - File: `frontend/package.json` scripts

**Build/Dev Tools:**
- Vite 5.0+ - Frontend build tool and dev server
  - Plugin: @vitejs/plugin-react for Fast Refresh
- Tailwind CSS 3.3+ - Utility-first CSS framework
  - Build tools: PostCSS, Autoprefixer
- ESLint 8.53+ - JavaScript/TypeScript linting
  - Plugins: react, react-hooks, react-refresh

## Key Dependencies

**Critical Python Packages:**
- ezdxf 0.17+ - CAD/DXF file generation (core differentiator)
  - File: `core/ceiling_panel_calc.py` (lines 152-157)
  - Fallback manual DXF generation if library unavailable
- numpy 1.21+ - Scientific computing, array operations
- pandas 1.3+ - Data manipulation and analysis
- paho-mqtt 1.6+ - IoT MQTT broker client
  - File: `iot/iot_sensor_network.py` (lines 14-15)

**Security & Auth:**
- PyJWT 2.0+ - JWT token generation/validation
  - Files: `api/middleware/auth.py`, `iot/iot_security.py`
- cryptography 3.4+ - Encryption and secure hashing

**IoT & Smart Building:**
- paho-mqtt - MQTT client for sensor network communication
- sqlite3 (built-in) - Local database for sensor data and security logs

**Frontend Key Dependencies:**
- recharts 2.10+ - React charting library
- date-fns 2.30+ - Date utility library
- clsx 2.0+ - Conditional CSS class utility

## Configuration

**Environment Variables:**
- `PORT` - Server port (default: 5000 for dev, 8000 for production)
- `FLASK_DEBUG` - Debug mode toggle
- `SECRET_KEY` - Flask session encryption
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `DATABASE_URL` - Database connection string (Kubernetes secret ref)

**Application Configuration:**
- File: `default_config.json`
- Settings include: ceiling dimensions, gaps, material defaults, waste factor (0.15), labor multiplier (0.25)

**Build Configuration:**
- Vite: `vite.config.*` (standard config, no custom file found)
- Tailwind: `tailwind.config.*` (implied by package.json, file not directly found)
- TypeScript: `tsconfig.json` (referenced, not found in glob)

## Platform Requirements

**Development:**
- Python 3.8+ with pip
- Node.js 18+ with npm
- MQTT broker (optional, localhost:1883 for IoT features)
- SQLite (built-in with Python)

**Production Deployment:**
- Kubernetes cluster (manifests in `k8s/`)
  - Namespace: `ceiling-calculator`
  - Replicas: 2 minimum
  - Ingress: NGINX with cert-manager for TLS
  - Container port: 8000
- Container image: `ceiling-calculator:latest`
- Resource limits: 256Mi-512Mi memory, 250m-500m CPU

**Optional External Services:**
- MQTT broker (Eclipse Mosquitto or similar) for IoT sensor network
- PostgreSQL (referenced in k8s secrets as DATABASE_URL, but SQLite used in code)

---

*Stack analysis: 2026-01-31*
