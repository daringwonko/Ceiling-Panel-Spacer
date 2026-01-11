"""
Main Flask/FastAPI application for Ceiling Panel Calculator API.

This module provides the REST API for the ceiling panel calculator platform.
"""

import os
import logging
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config: dict = None) -> Flask:
    """
    Application factory for creating Flask app.

    Args:
        config: Optional configuration dictionary

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)

    # Default configuration
    app.config.update({
        'DEBUG': os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        'SECRET_KEY': os.getenv('SECRET_KEY', 'ceiling-panel-secret-key'),
        'JSON_SORT_KEYS': False,
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB max request size
    })

    # Apply custom config
    if config:
        app.config.update(config)

    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": os.getenv('CORS_ORIGINS', '*').split(','),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Request-ID"]
        }
    })

    # Register blueprints
    from .routes.calculations import calculations_bp
    from .routes.projects import projects_bp
    from .routes.materials import materials_bp
    from .routes.exports import exports_bp
    from .routes.health import health_bp

    app.register_blueprint(calculations_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(materials_bp)
    app.register_blueprint(exports_bp)
    app.register_blueprint(health_bp)

    # Request logging middleware
    @app.before_request
    def log_request():
        """Log incoming requests."""
        logger.info(f"{request.method} {request.path} - {request.remote_addr}")

    # Response middleware
    @app.after_request
    def add_headers(response):
        """Add standard headers to responses."""
        response.headers['X-API-Version'] = 'v1'
        response.headers['X-Request-Time'] = datetime.utcnow().isoformat()
        return response

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "BAD_REQUEST",
                "message": str(error.description) if hasattr(error, 'description') else "Bad request"
            }
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "FORBIDDEN",
                "message": "Access denied"
            }
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": "Resource not found"
            }
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": f"Method {request.method} not allowed"
            }
        }), 405

    @app.errorhandler(429)
    def rate_limited(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "RATE_LIMITED",
                "message": "Too many requests"
            }
        }), 429

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {error}")
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred"
            }
        }), 500

    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            "success": True,
            "data": {
                "name": "Ceiling Panel Calculator API",
                "version": "2.0.0",
                "documentation": "/api/v1/docs",
                "health": "/api/v1/health"
            },
            "error": None
        })

    # OpenAPI documentation endpoint
    @app.route('/api/v1/docs')
    def api_docs():
        return jsonify({
            "success": True,
            "data": {
                "openapi": "3.0.0",
                "info": {
                    "title": "Ceiling Panel Calculator API",
                    "version": "2.0.0",
                    "description": "REST API for ceiling panel layout calculation and export"
                },
                "servers": [
                    {"url": "http://localhost:5000", "description": "Development"},
                    {"url": "https://api.ceilingcalc.com", "description": "Production"}
                ],
                "endpoints": {
                    "calculations": {
                        "POST /api/v1/calculate": "Perform panel calculation",
                        "GET /api/v1/calculate/{id}": "Get calculation result",
                        "POST /api/v1/calculate/optimize": "Optimized calculation"
                    },
                    "projects": {
                        "POST /api/v1/projects": "Create project",
                        "GET /api/v1/projects": "List projects",
                        "GET /api/v1/projects/{id}": "Get project",
                        "PUT /api/v1/projects/{id}": "Update project",
                        "DELETE /api/v1/projects/{id}": "Delete project",
                        "POST /api/v1/projects/{id}/calculate": "Calculate project"
                    },
                    "materials": {
                        "GET /api/v1/materials": "List materials",
                        "GET /api/v1/materials/{id}": "Get material",
                        "GET /api/v1/materials/categories": "List categories",
                        "POST /api/v1/materials/cost-estimate": "Estimate cost"
                    },
                    "exports": {
                        "POST /api/v1/exports/svg": "Generate SVG",
                        "POST /api/v1/exports/dxf": "Generate DXF",
                        "POST /api/v1/exports/3d": "Generate 3D model",
                        "GET /api/v1/exports/{id}": "Get export info",
                        "GET /api/v1/exports/download/{id}": "Download file"
                    },
                    "system": {
                        "GET /api/v1/health": "Health check",
                        "GET /api/v1/health/ready": "Readiness probe",
                        "GET /api/v1/health/live": "Liveness probe",
                        "GET /api/v1/version": "Version info"
                    }
                }
            },
            "error": None
        })

    logger.info("Ceiling Panel Calculator API initialized")
    return app


# Create default app instance
app = create_app()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║         Ceiling Panel Calculator API v2.0.0                ║
    ╠════════════════════════════════════════════════════════════╣
    ║  Server: http://localhost:{port}                             ║
    ║  API Docs: http://localhost:{port}/api/v1/docs               ║
    ║  Health: http://localhost:{port}/api/v1/health               ║
    ╚════════════════════════════════════════════════════════════╝
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)
