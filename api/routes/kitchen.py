"""
Kitchen design endpoints for the API.
"""

from flask import Blueprint, request, jsonify

kitchen_bp = Blueprint("kitchen", __name__, url_prefix="/api/v1/kitchen")

try:
    from Savage_Cabinetry_Platform.kitchen_orchestrator import (
        KitchenDesignOrchestrator,
        DesignParameters,
        KitchenDesignException,
    )

    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    ORCHESTRATOR_AVAILABLE = False
    KitchenDesignOrchestrator = None
    DesignParameters = None
    KitchenDesignException = Exception


def get_orchestrator():
    """Get or create the orchestrator instance."""
    if not ORCHESTRATOR_AVAILABLE or KitchenDesignOrchestrator is None:
        return None
    return KitchenDesignOrchestrator()


@kitchen_bp.route("/calculate", methods=["POST"])
def calculate_kitchen():
    """
    Calculate ceiling panels for kitchen design.

    ---
    tags:
      - Kitchen
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - width
              - length
              - material
              - kitchen_type
            properties:
              width:
                type: number
                description: Ceiling width in millimeters
                example: 4000
              length:
                type: number
                description: Ceiling length in millimeters
                example: 5000
              material:
                type: string
                description: Material type for panels
                example: standard_tiles
              kitchen_type:
                type: string
                description: Type of kitchen
                example: residential
    responses:
      200:
        description: Calculation completed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                panels:
                  type: array
                layout:
                  type: object
                cost:
                  type: number
                material_info:
                  type: object
      400:
        description: Invalid request data
      500:
        description: Internal server error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "INVALID_REQUEST",
                        "message": "Request body is required",
                    },
                }
            ), 400

        if not ORCHESTRATOR_AVAILABLE or KitchenDesignOrchestrator is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "SERVICE_UNAVAILABLE",
                        "message": "Kitchen design orchestrator is not available",
                    },
                }
            ), 503

        width = data.get("width")
        length = data.get("length")
        material = data.get("material")
        kitchen_type = data.get("kitchen_type")

        if width is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "width field is required",
                        "field": "width",
                    },
                }
            ), 400

        if length is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "length field is required",
                        "field": "length",
                    },
                }
            ), 400

        if material is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "material field is required",
                        "field": "material",
                    },
                }
            ), 400

        if kitchen_type is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "kitchen_type field is required",
                        "field": "kitchen_type",
                    },
                }
            ), 400

        orchestrator = get_orchestrator()

        params = DesignParameters(
            ceiling_width_mm=int(width),
            ceiling_length_mm=int(length),
            material_type=material,
        )

        result = orchestrator.calculate_ceiling_panels(params)

        panels = []
        for i, panel in enumerate(result.panel_dimensions):
            panels.append(
                {
                    "id": i + 1,
                    "width_mm": panel.get("width_mm"),
                    "length_mm": panel.get("length_mm"),
                    "area_sqm": panel.get("area_sqm"),
                }
            )

        layout = {
            "panel_width_mm": result.panel_dimensions[0].get("width_mm")
            if result.panel_dimensions
            else 0,
            "panel_length_mm": result.panel_dimensions[0].get("length_mm")
            if result.panel_dimensions
            else 0,
            "total_panels": result.panels_count,
            "total_area_sqm": result.total_area_sqm,
            "warnings": result.warnings,
        }

        return jsonify(
            {
                "success": True,
                "panels": panels,
                "layout": layout,
                "cost": result.estimated_cost,
                "material_info": result.material_info,
            }
        ), 200

    except KitchenDesignException as e:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)},
            }
        ), 400

    except ValueError as e:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": f"Invalid numeric value: {str(e)}",
                },
            }
        ), 400

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Calculation failed: {str(e)}",
                },
            }
        ), 500


@kitchen_bp.route("/cost-estimate", methods=["POST"])
def estimate_kitchen_cost():
    """
    Get quick cost estimate for kitchen ceiling.

    ---
    tags:
      - Kitchen
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - width
              - length
              - material
            properties:
              width:
                type: number
                description: Ceiling width in millimeters
              length:
                type: number
                description: Ceiling length in millimeters
              material:
                type: string
                description: Material type for panels
    responses:
      200:
        description: Cost estimate returned
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "INVALID_REQUEST",
                        "message": "Request body is required",
                    },
                }
            ), 400

        if not ORCHESTRATOR_AVAILABLE or KitchenDesignOrchestrator is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "SERVICE_UNAVAILABLE",
                        "message": "Kitchen design orchestrator is not available",
                    },
                }
            ), 503

        width = data.get("width")
        length = data.get("length")
        material = data.get("material", "standard_tiles")

        if width is None or length is None:
            return jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "MISSING_FIELD",
                        "message": "width and length fields are required",
                    },
                }
            ), 400

        orchestrator = get_orchestrator()

        params = DesignParameters(
            ceiling_width_mm=int(width),
            ceiling_length_mm=int(length),
            material_type=material,
        )

        estimate = orchestrator.get_cost_estimate(params)

        return jsonify(
            {
                "success": True,
                "data": estimate,
                "error": None,
            }
        ), 200

    except KitchenDesignException as e:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {"code": "VALIDATION_ERROR", "message": str(e)},
            }
        ), 400

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "data": None,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Estimate failed: {str(e)}",
                },
            }
        ), 500
