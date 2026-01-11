"""
Calculation endpoints for the API.
"""

import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from ..schemas import (
    CalculationRequest,
    CalculationResponse,
    APIResponse,
    PanelLayoutOutput,
)
from ..middleware.auth import require_auth
from ..middleware.rate_limit import rate_limit

# Import core calculation engine
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from core.ceiling_panel_calc import (
        CeilingDimensions,
        PanelSpacing,
        CeilingPanelCalculator,
        MATERIALS,
    )
except ImportError:
    # Fallback for testing
    CeilingDimensions = None
    PanelSpacing = None
    CeilingPanelCalculator = None
    MATERIALS = {}

calculations_bp = Blueprint('calculations', __name__, url_prefix='/api/v1')

# In-memory storage for calculations (replace with database in production)
_calculations_store = {}


def perform_calculation(data: dict) -> dict:
    """Perform the ceiling panel calculation."""
    start_time = time.time()

    # Create dimension and spacing objects
    dims = CeilingDimensions(
        length_mm=data['dimensions']['length_mm'],
        width_mm=data['dimensions']['width_mm']
    )

    spacing = PanelSpacing(
        perimeter_gap_mm=data['spacing']['perimeter_gap_mm'],
        panel_gap_mm=data['spacing']['panel_gap_mm']
    )

    # Create calculator and compute
    calculator = CeilingPanelCalculator(dims, spacing)

    # Get target aspect ratio from constraints
    target_ratio = 1.0
    if data.get('constraints') and data['constraints'].get('target_aspect_ratio'):
        target_ratio = data['constraints']['target_aspect_ratio']

    layout = calculator.calculate_optimal_layout(target_aspect_ratio=target_ratio)

    execution_time = (time.time() - start_time) * 1000

    # Calculate efficiency
    ceiling_area = dims.length_mm * dims.width_mm / 1_000_000
    efficiency = (layout.total_coverage_sqm / ceiling_area) * 100

    # Get material info
    material = None
    if data.get('material_id') and data['material_id'] in MATERIALS:
        mat = MATERIALS[data['material_id']]
        material = {
            'id': data['material_id'],
            'name': mat.name,
            'category': mat.category,
            'cost_per_sqm': mat.cost_per_sqm,
            'total_cost': mat.cost_per_sqm * layout.total_coverage_sqm
        }

    return {
        'layout': {
            'panel_width_mm': layout.panel_width_mm,
            'panel_length_mm': layout.panel_length_mm,
            'panels_per_row': layout.panels_per_row,
            'panels_per_column': layout.panels_per_column,
            'total_panels': layout.total_panels,
            'total_coverage_sqm': round(layout.total_coverage_sqm, 4),
            'gap_area_sqm': round(layout.gap_area_sqm, 4),
            'efficiency_percent': round(efficiency, 2)
        },
        'material': material,
        'optimization_score': round(efficiency, 2),
        'execution_time_ms': round(execution_time, 2)
    }


@calculations_bp.route('/calculate', methods=['POST'])
@rate_limit()
def create_calculation():
    """
    Perform a new panel calculation.

    ---
    tags:
      - Calculations
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CalculationRequest'
    responses:
      200:
        description: Calculation completed successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/APIResponse'
      400:
        description: Invalid request data
      429:
        description: Rate limit exceeded
    """
    try:
        # Parse and validate request
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_REQUEST",
                    "message": "Request body is required"
                }
            }), 400

        # Validate required fields
        if 'dimensions' not in data:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "MISSING_FIELD",
                    "message": "dimensions field is required",
                    "field": "dimensions"
                }
            }), 400

        dims = data['dimensions']
        if 'length_mm' not in dims or 'width_mm' not in dims:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "MISSING_FIELD",
                    "message": "length_mm and width_mm are required",
                    "field": "dimensions"
                }
            }), 400

        # Apply defaults
        if 'spacing' not in data:
            data['spacing'] = {'perimeter_gap_mm': 200, 'panel_gap_mm': 50}

        # Check for calculator availability
        if CeilingPanelCalculator is None:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "SERVICE_UNAVAILABLE",
                    "message": "Calculation engine not available"
                }
            }), 503

        # Perform calculation
        result = perform_calculation(data)

        # Generate calculation ID and store
        calc_id = f"calc_{uuid.uuid4().hex[:12]}"
        created_at = datetime.utcnow()

        calculation = {
            'id': calc_id,
            'created_at': created_at.isoformat(),
            'dimensions': data['dimensions'],
            'spacing': data['spacing'],
            **result
        }

        _calculations_store[calc_id] = calculation

        return jsonify({
            "success": True,
            "data": calculation,
            "error": None,
            "meta": {
                "request_id": f"req_{uuid.uuid4().hex[:8]}"
            }
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(e)
            }
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": f"Calculation failed: {str(e)}"
            }
        }), 500


@calculations_bp.route('/calculate/<calculation_id>', methods=['GET'])
@rate_limit()
def get_calculation(calculation_id: str):
    """
    Get a previously computed calculation result.

    ---
    tags:
      - Calculations
    parameters:
      - name: calculation_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Calculation found
      404:
        description: Calculation not found
    """
    calculation = _calculations_store.get(calculation_id)

    if calculation is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Calculation {calculation_id} not found"
            }
        }), 404

    return jsonify({
        "success": True,
        "data": calculation,
        "error": None
    }), 200


@calculations_bp.route('/calculate/optimize', methods=['POST'])
@rate_limit(tier="pro")
def optimize_calculation():
    """
    Perform optimized calculation using quantum-inspired optimizer.

    ---
    tags:
      - Calculations
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CalculationRequest'
    responses:
      200:
        description: Optimized calculation completed
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_REQUEST",
                    "message": "Request body is required"
                }
            }), 400

        # Try to use quantum optimizer
        try:
            from optimization.quantum_optimizer import CeilingLayoutOptimizer

            optimizer = CeilingLayoutOptimizer()
            dims = data.get('dimensions', {})
            spacing = data.get('spacing', {})

            optimized = optimizer.optimize_layout(
                ceiling_length_mm=dims.get('length_mm', 5000),
                ceiling_width_mm=dims.get('width_mm', 4000),
                perimeter_gap_mm=spacing.get('perimeter_gap_mm', 200),
                panel_gap_mm=spacing.get('panel_gap_mm', 50),
                max_panel_size_mm=data.get('constraints', {}).get('max_panel_width_mm', 2400)
            )

            calc_id = f"calc_{uuid.uuid4().hex[:12]}"

            return jsonify({
                "success": True,
                "data": {
                    "id": calc_id,
                    "optimized": True,
                    "result": optimized
                },
                "error": None
            }), 200

        except ImportError:
            # Fall back to standard calculation
            if 'dimensions' not in data:
                return jsonify({
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "dimensions field is required"
                    }
                }), 400

            if 'spacing' not in data:
                data['spacing'] = {'perimeter_gap_mm': 200, 'panel_gap_mm': 50}

            result = perform_calculation(data)
            calc_id = f"calc_{uuid.uuid4().hex[:12]}"

            return jsonify({
                "success": True,
                "data": {
                    "id": calc_id,
                    "optimized": False,
                    "fallback_reason": "Optimizer not available",
                    **result
                },
                "error": None
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "OPTIMIZATION_ERROR",
                "message": str(e)
            }
        }), 500
