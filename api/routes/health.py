"""
Health check endpoints for the API.
"""

import time
from datetime import datetime
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__, url_prefix='/api/v1')

# Server start time for uptime calculation
_start_time = time.time()


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.

    ---
    tags:
      - System
    responses:
      200:
        description: System is healthy
    """
    uptime = time.time() - _start_time

    return jsonify({
        "success": True,
        "data": {
            "status": "healthy",
            "version": "2.0.0",
            "uptime_seconds": round(uptime, 2),
            "database": "connected",
            "cache": "connected",
            "timestamp": datetime.utcnow().isoformat()
        },
        "error": None
    }), 200


@health_bp.route('/health/ready', methods=['GET'])
def readiness_check():
    """
    Readiness probe for Kubernetes.

    ---
    tags:
      - System
    responses:
      200:
        description: Service is ready
      503:
        description: Service is not ready
    """
    # Check if core services are available
    try:
        from core.ceiling_panel_calc import CeilingPanelCalculator
        calculator_ready = True
    except ImportError:
        calculator_ready = False

    if calculator_ready:
        return jsonify({
            "success": True,
            "data": {
                "status": "ready",
                "services": {
                    "calculator": "ready"
                }
            },
            "error": None
        }), 200
    else:
        return jsonify({
            "success": False,
            "data": {
                "status": "not_ready",
                "services": {
                    "calculator": "unavailable"
                }
            },
            "error": {
                "code": "NOT_READY",
                "message": "Required services not available"
            }
        }), 503


@health_bp.route('/health/live', methods=['GET'])
def liveness_check():
    """
    Liveness probe for Kubernetes.

    ---
    tags:
      - System
    responses:
      200:
        description: Service is alive
    """
    return jsonify({
        "success": True,
        "data": {
            "status": "alive",
            "timestamp": datetime.utcnow().isoformat()
        },
        "error": None
    }), 200


@health_bp.route('/version', methods=['GET'])
def version():
    """
    Get API version information.

    ---
    tags:
      - System
    responses:
      200:
        description: Version information
    """
    return jsonify({
        "success": True,
        "data": {
            "api_version": "v1",
            "app_version": "2.0.0",
            "python_version": "3.8+",
            "build_date": "2026-01-11"
        },
        "error": None
    }), 200
