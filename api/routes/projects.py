"""
Project management endpoints for the API.
"""

import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from ..middleware.auth import require_auth
from ..middleware.rate_limit import rate_limit

projects_bp = Blueprint('projects', __name__, url_prefix='/api/v1')

# In-memory storage (replace with database in production)
_projects_store = {}


@projects_bp.route('/projects', methods=['POST'])
@rate_limit()
def create_project():
    """
    Create a new project.

    ---
    tags:
      - Projects
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProjectRequest'
    responses:
      201:
        description: Project created successfully
      400:
        description: Invalid request data
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

        # Validate required fields
        if 'name' not in data:
            return jsonify({
                "success": False,
                "data": None,
                "error": {
                    "code": "MISSING_FIELD",
                    "message": "name field is required",
                    "field": "name"
                }
            }), 400

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

        # Create project
        project_id = f"proj_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()

        # Get owner from auth context or use anonymous
        owner_id = getattr(g, 'current_user', None)
        if owner_id:
            owner_id = owner_id.id
        else:
            owner_id = "anonymous"

        project = {
            'id': project_id,
            'name': data['name'],
            'description': data.get('description'),
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'dimensions': data['dimensions'],
            'spacing': data.get('spacing', {'perimeter_gap_mm': 200, 'panel_gap_mm': 50}),
            'material_id': data.get('material_id'),
            'calculation_id': None,
            'tags': data.get('tags', []),
            'metadata': data.get('metadata', {}),
            'owner_id': owner_id
        }

        _projects_store[project_id] = project

        return jsonify({
            "success": True,
            "data": project,
            "error": None
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            }
        }), 500


@projects_bp.route('/projects', methods=['GET'])
@rate_limit()
def list_projects():
    """
    List all projects.

    ---
    tags:
      - Projects
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: per_page
        in: query
        schema:
          type: integer
          default: 20
      - name: search
        in: query
        schema:
          type: string
    responses:
      200:
        description: List of projects
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')

    # Filter projects
    projects = list(_projects_store.values())

    if search:
        search_lower = search.lower()
        projects = [
            p for p in projects
            if search_lower in p['name'].lower() or
               (p.get('description') and search_lower in p['description'].lower())
        ]

    # Sort by updated_at descending
    projects.sort(key=lambda x: x['updated_at'], reverse=True)

    # Paginate
    total = len(projects)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = projects[start:end]

    return jsonify({
        "success": True,
        "data": paginated,
        "error": None,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }), 200


@projects_bp.route('/projects/<project_id>', methods=['GET'])
@rate_limit()
def get_project(project_id: str):
    """
    Get a specific project.

    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Project found
      404:
        description: Project not found
    """
    project = _projects_store.get(project_id)

    if project is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Project {project_id} not found"
            }
        }), 404

    return jsonify({
        "success": True,
        "data": project,
        "error": None
    }), 200


@projects_bp.route('/projects/<project_id>', methods=['PUT'])
@rate_limit()
def update_project(project_id: str):
    """
    Update a project.

    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProjectRequest'
    responses:
      200:
        description: Project updated
      404:
        description: Project not found
    """
    project = _projects_store.get(project_id)

    if project is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Project {project_id} not found"
            }
        }), 404

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

    # Update fields
    if 'name' in data:
        project['name'] = data['name']
    if 'description' in data:
        project['description'] = data['description']
    if 'dimensions' in data:
        project['dimensions'] = data['dimensions']
    if 'spacing' in data:
        project['spacing'] = data['spacing']
    if 'material_id' in data:
        project['material_id'] = data['material_id']
    if 'tags' in data:
        project['tags'] = data['tags']
    if 'metadata' in data:
        project['metadata'] = data['metadata']

    project['updated_at'] = datetime.utcnow().isoformat()

    return jsonify({
        "success": True,
        "data": project,
        "error": None
    }), 200


@projects_bp.route('/projects/<project_id>', methods=['DELETE'])
@rate_limit()
def delete_project(project_id: str):
    """
    Delete a project.

    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Project deleted
      404:
        description: Project not found
    """
    if project_id not in _projects_store:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Project {project_id} not found"
            }
        }), 404

    del _projects_store[project_id]

    return jsonify({
        "success": True,
        "data": {"deleted": True, "id": project_id},
        "error": None
    }), 200


@projects_bp.route('/projects/<project_id>/calculate', methods=['POST'])
@rate_limit()
def calculate_project(project_id: str):
    """
    Run calculation for a project.

    ---
    tags:
      - Projects
    parameters:
      - name: project_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Calculation completed
      404:
        description: Project not found
    """
    project = _projects_store.get(project_id)

    if project is None:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "NOT_FOUND",
                "message": f"Project {project_id} not found"
            }
        }), 404

    # Import and run calculation
    try:
        from .calculations import perform_calculation

        result = perform_calculation({
            'dimensions': project['dimensions'],
            'spacing': project['spacing'],
            'material_id': project.get('material_id')
        })

        # Store calculation ID
        calc_id = f"calc_{uuid.uuid4().hex[:12]}"
        project['calculation_id'] = calc_id
        project['updated_at'] = datetime.utcnow().isoformat()

        return jsonify({
            "success": True,
            "data": {
                "project_id": project_id,
                "calculation_id": calc_id,
                "result": result
            },
            "error": None
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "data": None,
            "error": {
                "code": "CALCULATION_ERROR",
                "message": str(e)
            }
        }), 500
