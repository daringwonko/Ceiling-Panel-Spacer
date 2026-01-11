"""
Materials endpoints for the API.
"""

from flask import Blueprint, request, jsonify

from ..middleware.rate_limit import rate_limit

materials_bp = Blueprint('materials', __name__, url_prefix='/api/v1')

# Import materials from core
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from core.ceiling_panel_calc import MATERIALS, Material
except ImportError:
    MATERIALS = {}
    Material = None


def material_to_dict(material_id: str, material) -> dict:
    """Convert a Material object to dictionary."""
    return {
        'id': material_id,
        'name': material.name,
        'category': material.category,
        'color': material.color,
        'reflectivity': material.reflectivity,
        'cost_per_sqm': material.cost_per_sqm,
        'notes': material.notes if hasattr(material, 'notes') else None
    }


@materials_bp.route('/materials', methods=['GET'])
@rate_limit()
def list_materials():
    """
    List all available materials.

    ---
    tags:
      - Materials
    parameters:
      - name: category
        in: query
        schema:
          type: string
          enum: [lighting, acoustic, drywall, metal, custom]
      - name: min_cost
        in: query
        schema:
          type: number
      - name: max_cost
        in: query
        schema:
          type: number
    responses:
      200:
        description: List of materials
    """
    category = request.args.get('category')
    min_cost = request.args.get('min_cost', type=float)
    max_cost = request.args.get('max_cost', type=float)

    materials = []

    for material_id, material in MATERIALS.items():
        mat_dict = material_to_dict(material_id, material)

        # Apply filters
        if category and mat_dict['category'] != category:
            continue
        if min_cost is not None and mat_dict['cost_per_sqm'] < min_cost:
            continue
        if max_cost is not None and mat_dict['cost_per_sqm'] > max_cost:
            continue

        materials.append(mat_dict)

    # Sort by name
    materials.sort(key=lambda x: x['name'])

    return jsonify({
        "success": True,
        "data": materials,
        "error": None,
        "meta": {
            "total": len(materials)
        }
    }), 200


@materials_bp.route('/materials/<material_id>', methods=['GET'])
@rate_limit()
def get_material(material_id: str):
    """
    Get a specific material.

    ---
    tags:
      - Materials
    parameters:
      - name: material_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Material found
      404:
        description: Material not found
    """
    material = MATERIALS.get(material_id)

    if material is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Material {material_id} not found"
            }
        }), 404

    return jsonify({
        "success": True,
        "data": material_to_dict(material_id, material),
        "error": None
    }), 200


@materials_bp.route('/materials/categories', methods=['GET'])
@rate_limit()
def list_categories():
    """
    List all material categories.

    ---
    tags:
      - Materials
    responses:
      200:
        description: List of categories
    """
    categories = set()

    for material in MATERIALS.values():
        categories.add(material.category)

    return jsonify({
        "success": True,
        "data": sorted(list(categories)),
        "error": None
    }), 200


@materials_bp.route('/materials/cost-estimate', methods=['POST'])
@rate_limit()
def estimate_cost():
    """
    Estimate material cost for a given area.

    ---
    tags:
      - Materials
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              material_id:
                type: string
              area_sqm:
                type: number
              waste_factor:
                type: number
                default: 1.15
    responses:
      200:
        description: Cost estimate
    """
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

    material_id = data.get('material_id')
    area_sqm = data.get('area_sqm')
    waste_factor = data.get('waste_factor', 1.15)

    if not material_id:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "MISSING_FIELD",
                "message": "material_id is required"
            }
        }), 400

    if not area_sqm or area_sqm <= 0:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INVALID_VALUE",
                "message": "area_sqm must be a positive number"
            }
        }), 400

    material = MATERIALS.get(material_id)
    if material is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Material {material_id} not found"
            }
        }), 404

    # Calculate costs
    raw_cost = area_sqm * material.cost_per_sqm
    adjusted_area = area_sqm * waste_factor
    total_cost = adjusted_area * material.cost_per_sqm
    waste_cost = total_cost - raw_cost

    return jsonify({
        "success": True,
        "data": {
            "material": material_to_dict(material_id, material),
            "area_sqm": area_sqm,
            "adjusted_area_sqm": round(adjusted_area, 4),
            "waste_factor": waste_factor,
            "raw_cost": round(raw_cost, 2),
            "waste_cost": round(waste_cost, 2),
            "total_cost": round(total_cost, 2),
            "currency": "USD"
        },
        "error": None
    }), 200
