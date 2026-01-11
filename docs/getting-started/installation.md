# Installation Guide

## Prerequisites

- Python 3.8 or higher
- Node.js 18+ (for frontend)
- Docker (optional, for containerized deployment)

## Quick Installation

### Option 1: pip install

```bash
# Clone repository
git clone https://github.com/daringwonko/Ceiling-Panel-Spacer.git
cd Ceiling-Panel-Spacer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m api.app
```

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:5000
```

### Option 3: Development Setup

```bash
# Install all dependencies including dev tools
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install frontend dependencies
cd frontend && npm install

# Run backend
python -m api.app

# Run frontend (in another terminal)
cd frontend && npm run dev
```

## Configuration

Create a `.env` file in the project root:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=5000
DEBUG=false

# Database (optional)
DATABASE_URL=sqlite:///ceiling_calc.db

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET_KEY=your-secret-key-here

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Verify Installation

```bash
# Run tests
pytest tests/ -v

# Check API health
curl http://localhost:5000/api/v1/health
```

## Next Steps

- [Quick Start Tutorial](quick-start.md)
- [Configuration Options](configuration.md)
- [API Reference](../api-reference/endpoints.md)
