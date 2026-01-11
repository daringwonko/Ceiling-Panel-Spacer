"""
Export endpoints for the API.
"""

import os
import uuid
import tempfile
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, send_file

from ..middleware.rate_limit import rate_limit

exports_bp = Blueprint('exports', __name__, url_prefix='/api/v1')

# Import generators
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from core.ceiling_panel_calc import (
        CeilingDimensions,
        PanelSpacing,
        CeilingPanelCalculator,
        SVGGenerator,
        DXFGenerator,
        ProjectExporter,
        MATERIALS,
    )
    GENERATORS_AVAILABLE = True
except ImportError:
    GENERATORS_AVAILABLE = False

try:
    from output.renderer_3d import (
        CeilingPanel3DGenerator,
        MeshExporter,
    )
    RENDERER_3D_AVAILABLE = True
except ImportError:
    RENDERER_3D_AVAILABLE = False

# In-memory export storage
_exports_store = {}
_output_dir = tempfile.mkdtemp(prefix="ceiling_exports_")


@exports_bp.route('/exports/svg', methods=['POST'])
@rate_limit()
def export_svg():
    """
    Generate SVG export for a calculation.

    ---
    tags:
      - Exports
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              dimensions:
                type: object
              spacing:
                type: object
              options:
                type: object
    responses:
      200:
        description: SVG file generated
    """
    if not GENERATORS_AVAILABLE:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "SERVICE_UNAVAILABLE",
                "message": "Export generators not available"
            }
        }), 503

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

    try:
        dims = data.get('dimensions', {})
        spacing = data.get('spacing', {})
        options = data.get('options', {})

        # Create objects
        ceiling_dims = CeilingDimensions(
            length_mm=dims.get('length_mm', 5000),
            width_mm=dims.get('width_mm', 4000)
        )

        panel_spacing = PanelSpacing(
            perimeter_gap_mm=spacing.get('perimeter_gap_mm', 200),
            panel_gap_mm=spacing.get('panel_gap_mm', 50)
        )

        # Calculate layout
        calculator = CeilingPanelCalculator(ceiling_dims, panel_spacing)
        layout = calculator.calculate_optimal_layout()

        # Generate SVG
        export_id = f"exp_{uuid.uuid4().hex[:12]}"
        filename = f"{export_id}.svg"
        filepath = os.path.join(_output_dir, filename)

        svg_gen = SVGGenerator(scale=options.get('scale', 0.5))
        svg_gen.generate(filepath, ceiling_dims, panel_spacing, layout)

        # Get file size
        file_size = os.path.getsize(filepath)

        # Store export record
        expires_at = datetime.utcnow() + timedelta(hours=24)
        _exports_store[export_id] = {
            'id': export_id,
            'format': 'svg',
            'file_path': filepath,
            'file_url': f"/api/v1/exports/download/{export_id}",
            'file_size_bytes': file_size,
            'expires_at': expires_at.isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }

        return jsonify({
            "success": True,
            "data": _exports_store[export_id],
            "error": None
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXPORT_ERROR",
                "message": str(e)
            }
        }), 500


@exports_bp.route('/exports/dxf', methods=['POST'])
@rate_limit()
def export_dxf():
    """
    Generate DXF export for a calculation.

    ---
    tags:
      - Exports
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
    responses:
      200:
        description: DXF file generated
    """
    if not GENERATORS_AVAILABLE:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "SERVICE_UNAVAILABLE",
                "message": "Export generators not available"
            }
        }), 503

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

    try:
        dims = data.get('dimensions', {})
        spacing = data.get('spacing', {})
        options = data.get('options', {})

        # Create objects
        ceiling_dims = CeilingDimensions(
            length_mm=dims.get('length_mm', 5000),
            width_mm=dims.get('width_mm', 4000)
        )

        panel_spacing = PanelSpacing(
            perimeter_gap_mm=spacing.get('perimeter_gap_mm', 200),
            panel_gap_mm=spacing.get('panel_gap_mm', 50)
        )

        # Calculate layout
        calculator = CeilingPanelCalculator(ceiling_dims, panel_spacing)
        layout = calculator.calculate_optimal_layout()

        # Get material
        material = None
        material_id = data.get('material_id')
        if material_id and material_id in MATERIALS:
            material = MATERIALS[material_id]

        # Generate DXF
        export_id = f"exp_{uuid.uuid4().hex[:12]}"
        filename = f"{export_id}.dxf"
        filepath = os.path.join(_output_dir, filename)

        dxf_gen = DXFGenerator()
        dxf_gen.generate(filepath, ceiling_dims, panel_spacing, layout, material)

        # Get file size
        file_size = os.path.getsize(filepath)

        # Store export record
        expires_at = datetime.utcnow() + timedelta(hours=24)
        _exports_store[export_id] = {
            'id': export_id,
            'format': 'dxf',
            'file_path': filepath,
            'file_url': f"/api/v1/exports/download/{export_id}",
            'file_size_bytes': file_size,
            'expires_at': expires_at.isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }

        return jsonify({
            "success": True,
            "data": _exports_store[export_id],
            "error": None
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXPORT_ERROR",
                "message": str(e)
            }
        }), 500


@exports_bp.route('/exports/3d', methods=['POST'])
@rate_limit(tier="pro")
def export_3d():
    """
    Generate 3D model export (OBJ, STL, or GLTF).

    ---
    tags:
      - Exports
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              format:
                type: string
                enum: [obj, stl, gltf]
    responses:
      200:
        description: 3D model generated
    """
    if not RENDERER_3D_AVAILABLE:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "SERVICE_UNAVAILABLE",
                "message": "3D renderer not available"
            }
        }), 503

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

    try:
        dims = data.get('dimensions', {})
        spacing = data.get('spacing', {})
        format_type = data.get('format', 'obj').lower()
        options = data.get('options', {})

        if format_type not in ['obj', 'stl', 'gltf']:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "INVALID_FORMAT",
                    "message": f"Unsupported format: {format_type}"
                }
            }), 400

        # Generate 3D mesh
        generator = CeilingPanel3DGenerator(
            panel_thickness_mm=options.get('thickness_mm', 20)
        )

        # Calculate layout first
        length_mm = dims.get('length_mm', 5000)
        width_mm = dims.get('width_mm', 4000)
        perimeter_gap = spacing.get('perimeter_gap_mm', 200)
        panel_gap = spacing.get('panel_gap_mm', 50)

        # Simple layout calculation
        available_length = length_mm - 2 * perimeter_gap
        available_width = width_mm - 2 * perimeter_gap
        panels_x = 3
        panels_y = 2
        panel_width = (available_width - (panels_y - 1) * panel_gap) / panels_y
        panel_height = (available_length - (panels_x - 1) * panel_gap) / panels_x

        mesh = generator.generate_layout_mesh(
            panels_x=panels_x,
            panels_y=panels_y,
            panel_width_mm=panel_width,
            panel_height_mm=panel_height,
            include_frame=options.get('include_frame', True)
        )

        # Export to file
        export_id = f"exp_{uuid.uuid4().hex[:12]}"
        filename = f"{export_id}.{format_type}"
        filepath = os.path.join(_output_dir, filename)

        if format_type == 'obj':
            MeshExporter.to_obj(mesh, filepath)
        elif format_type == 'stl':
            MeshExporter.to_stl(mesh, filepath)
        elif format_type == 'gltf':
            MeshExporter.to_gltf(mesh, filepath)

        # Get file size
        file_size = os.path.getsize(filepath)

        # Store export record
        expires_at = datetime.utcnow() + timedelta(hours=24)
        _exports_store[export_id] = {
            'id': export_id,
            'format': format_type,
            'file_path': filepath,
            'file_url': f"/api/v1/exports/download/{export_id}",
            'file_size_bytes': file_size,
            'expires_at': expires_at.isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }

        return jsonify({
            "success": True,
            "data": _exports_store[export_id],
            "error": None
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXPORT_ERROR",
                "message": str(e)
            }
        }), 500


@exports_bp.route('/exports/download/<export_id>', methods=['GET'])
@rate_limit()
def download_export(export_id: str):
    """
    Download an exported file.

    ---
    tags:
      - Exports
    parameters:
      - name: export_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: File download
      404:
        description: Export not found
      410:
        description: Export expired
    """
    export = _exports_store.get(export_id)

    if export is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Export {export_id} not found"
            }
        }), 404

    # Check expiration
    expires_at = datetime.fromisoformat(export['expires_at'])
    if datetime.utcnow() > expires_at:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "EXPIRED",
                "message": "Export has expired"
            }
        }), 410

    # Check file exists
    if not os.path.exists(export['file_path']):
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "FILE_NOT_FOUND",
                "message": "Export file not found"
            }
        }), 404

    return send_file(
        export['file_path'],
        as_attachment=True,
        download_name=os.path.basename(export['file_path'])
    )


@exports_bp.route('/exports/<export_id>', methods=['GET'])
@rate_limit()
def get_export(export_id: str):
    """
    Get export metadata.

    ---
    tags:
      - Exports
    parameters:
      - name: export_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Export metadata
      404:
        description: Export not found
    """
    export = _exports_store.get(export_id)

    if export is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Export {export_id} not found"
            }
        }), 404

    # Remove internal file_path from response
    export_data = {k: v for k, v in export.items() if k != 'file_path'}

    return jsonify({
        "success": True,
        "data": export_data,
        "error": None
    }), 200
